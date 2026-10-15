/**
 * ocr.js - Optical Character Recognition (OCR) Module
 * 100% Client-Side, Zero Network, Clean Code Architecture.
 * Supports Indonesian ('ind') and English ('eng'), locally cached models in IndexedDB,
 * searchability preservation via invisible text layer over original pages,
 * and plain text (.txt) export with confidence statistics.
 */

import { PDFDocument, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';
import { t } from '../core/i18n.js';
import { downloadFile } from '../core/download.js';
import { getTesseractWorkerBlobUrl } from '../core/workers.js';
import {
  ensureBuiltinModelsLoaded,
  getAvailableOcrLangs,
  saveTesseractModel,
  deleteTesseractModel
} from '../core/assets.js';

export const id = 'ocr';
export const titleKey = 'tools.ocr.title';
export const descKey = 'tools.ocr.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3"/><path d="M20 7V4h-3"/><path d="M4 17v3h3"/><path d="M20 17v3h-3"/><line x1="9" x2="15" y1="10" y2="10"/><line x1="12" x2="12" y1="10" y2="14"/></svg>`;

// Safe UI notification helper
function notify(msg, type = 'info') {
  if (activeCtx && typeof activeCtx.showToast === 'function') {
    activeCtx.showToast(msg, type);
  }
}

// Module state
let activeContainer = null;
let activeCtx = null;
let currentFile = null;
let currentPdfDoc = null;
let pageCount = 0;
let availableLangs = [];
let selectedLang = 'ind';
let selectedPageMode = 'all'; // 'all' or 'range'
let customPageRange = '';
let targetDpi = 300; // 150 or 300
let isProcessing = false;
let isCancelled = false;
let activeWorker = null;
let activeWorkerLang = null;

// Results state
let lastOcrResults = null;
let lastSearchablePdfBytes = null;

// Re-export pure logic from atomic feature files
export { sanitizeTextForPdf } from '../features/ocr/logic/sanitizeTextForPdf.js';
export { parsePageRange } from '../features/ocr/logic/parsePageRange.js';
export { formatOcrText } from '../features/ocr/logic/formatOcrText.js';
export { buildSearchablePdf } from '../features/ocr/logic/buildSearchablePdf.js';

// =========================================================================
// TESSERACT WORKER MANAGEMENT
// =========================================================================

/**
 * Get or initialize Tesseract worker for the chosen language
 * @param {string} lang
 * @param {Function} [onProgress]
 * @returns {Promise<any>}
 */
async function getOcrWorker(lang, onProgress) {
  if (activeWorker && activeWorkerLang === lang) {
    return activeWorker;
  }

  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {}
    activeWorker = null;
    activeWorkerLang = null;
  }

  await ensureBuiltinModelsLoaded();

  const workerBlobUrl = getTesseractWorkerBlobUrl();
  const options = {
    gzip: true,
    logger: (m) => {
      if (onProgress) onProgress(m);
    }
  };

  if (workerBlobUrl) {
    options.workerPath = workerBlobUrl;
    options.workerBlobURL = false; // Directly instantiate worker from blob URL
  }

  try {
    const worker = await createWorker(lang, 1, options);
    activeWorker = worker;
    activeWorkerLang = lang;
    return worker;
  } catch (err) {
    activeWorker = null;
    activeWorkerLang = null;
    throw err;
  }
}

/**
 * Terminate active OCR worker
 */
export async function terminateOcrWorker() {
  if (activeWorker) {
    try {
      await activeWorker.terminate();
    } catch {}
    activeWorker = null;
    activeWorkerLang = null;
  }
}

// =========================================================================
// UI CONTROLLER & EVENT LISTENERS
// =========================================================================

export async function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;

  // Initialize builtin models if present (Full variant)
  await ensureBuiltinModelsLoaded();
  availableLangs = await getAvailableOcrLangs();

  if (availableLangs.includes('ind')) {
    selectedLang = 'ind';
  } else if (availableLangs.includes('eng')) {
    selectedLang = 'eng';
  }

  render();
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
  currentFile = null;
  currentPdfDoc = null;
  lastOcrResults = null;
  lastSearchablePdfBytes = null;
  isProcessing = false;
  isCancelled = true;
  terminateOcrWorker();
}

export async function onFiles(files) {
  if (!files || files.length === 0) return;
  const file = files[0];
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {notify(t('errors.unsupportedFormat'), 'error');
    return;
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise;

    currentFile = file;
    currentPdfDoc = pdf;
    pageCount = pdf.numPages;
    lastOcrResults = null;
    lastSearchablePdfBytes = null;

    render();
  } catch (err) {
    console.error('Failed to load PDF for OCR:', err);notify(t('errors.corruptFile'), 'error');
  }
}

function render() {
  if (!activeContainer) return;

  const isFullVariant = typeof window !== 'undefined' && !!window.__OCR_FULL_ENG_GZ_BASE64__;
  const hasModels = availableLangs.length > 0;

  activeContainer.innerHTML = `
    <div class="tool-workspace">
      <!-- Model Status Header -->
      <div class="card" style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem; padding: 1rem 1.25rem;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <div style="width: 10px; height: 10px; border-radius: 50%; background: ${hasModels ? 'var(--color-success, #10b981)' : 'var(--color-warning, #f59e0b)'};"></div>
          <div>
            <div style="font-weight: 600; font-size: 0.95rem;">
              ${hasModels ? t('tools.ocr.modelStatusReady', { langs: availableLangs.join(', ').toUpperCase() }) : t('tools.ocr.modelStatusMissing')}
            </div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">
              ${isFullVariant ? 'Varian Full (Model terpasang secara lokal)' : 'Varian Lite (Impor berkas lokal tanpa internet)'}
            </div>
          </div>
        </div>

        <div>
          <input type="file" id="ocr-model-input" accept=".traineddata,.gz" style="display: none;" />
          <button class="btn btn-secondary btn-sm" id="btn-import-model" style="display: inline-flex; align-items: center; gap: 0.4rem;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            ${t('tools.ocr.importBtn')}
          </button>
        </div>
      </div>

      ${!hasModels ? `
        <div class="card" style="margin-bottom: 1.5rem; border: 1px dashed var(--border-strong); background: var(--bg-subtle);">
          <p style="font-weight: 600; margin-bottom: 0.5rem; color: var(--color-warning, #d97706);">${t('tools.ocr.modelStatusMissing')}</p>
          <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 1rem;">
            ${t('tools.ocr.modelImportPrompt')}
          </p>
          <button class="btn btn-primary btn-sm" id="btn-import-model-hero">
            ${t('tools.ocr.importBtn')}
          </button>
        </div>
      ` : ''}

      ${!currentFile ? `
        <div class="drop-zone" id="ocr-drop-zone">
          <svg class="drop-zone-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <p class="drop-zone-prompt">${t('tools.ocr.emptyPrompt')}</p>
          <p class="drop-zone-hint">${t('common.dropZoneHint')}</p>
          <button class="btn btn-secondary" id="btn-select-ocr-file">${t('common.browseFiles')}</button>
          <input type="file" id="ocr-file-input" accept="application/pdf" style="display: none;" />
        </div>
      ` : `
        <div class="card" style="margin-bottom: 1.5rem;">
          <!-- Document Header -->
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 1rem; margin-bottom: 1.25rem;">
            <div>
              <div style="font-weight: 600; font-size: 1.05rem;">${currentFile.name}</div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
                ${t('tools.split.infoPages', { n: pageCount })} • ${(currentFile.size / 1024 / 1024).toFixed(2)} MB
              </div>
            </div>
            <button class="btn btn-secondary btn-sm" id="btn-change-file">${t('common.clear')}</button>
          </div>

          <!-- Configuration Controls -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
            <!-- Language Selection -->
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">
                ${t('tools.ocr.langLabel')}
              </label>
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="ocr-lang" value="ind" ${selectedLang === 'ind' ? 'checked' : ''} ${!availableLangs.includes('ind') ? 'disabled' : ''} />
                  <span>${t('tools.ocr.langInd')} ${!availableLangs.includes('ind') ? '(Belum diimpor)' : ''}</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="ocr-lang" value="eng" ${selectedLang === 'eng' ? 'checked' : ''} ${!availableLangs.includes('eng') ? 'disabled' : ''} />
                  <span>${t('tools.ocr.langEng')} ${!availableLangs.includes('eng') ? '(Belum diimpor)' : ''}</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="ocr-lang" value="ind+eng" ${selectedLang === 'ind+eng' ? 'checked' : ''} ${!(availableLangs.includes('ind') && availableLangs.includes('eng')) ? 'disabled' : ''} />
                  <span>${t('tools.ocr.langBoth')}</span>
                </label>
              </div>
            </div>

            <!-- Page Selection -->
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">
                ${t('tools.ocr.pageLabel')}
              </label>
              <div style="display: flex; flex-direction: column; gap: 0.4rem;">
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="ocr-page-mode" value="all" ${selectedPageMode === 'all' ? 'checked' : ''} />
                  <span>${t('tools.ocr.pagesAll')} (${pageCount})</span>
                </label>
                <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                  <input type="radio" name="ocr-page-mode" value="range" ${selectedPageMode === 'range' ? 'checked' : ''} />
                  <span>${t('tools.ocr.pagesRange')}</span>
                </label>
                ${selectedPageMode === 'range' ? `
                  <input type="text" id="ocr-range-input" class="input-text" placeholder="${t('tools.ocr.rangePlaceholder')}" value="${customPageRange}" style="margin-top: 0.25rem; font-size: 0.85rem;" />
                ` : ''}
              </div>
            </div>

            <!-- Resolution / DPI Selection -->
            <div>
              <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.5rem;">
                ${t('tools.ocr.dpiLabel')}
              </label>
              <select id="ocr-dpi-select" class="input-select" style="width: 100%; font-size: 0.85rem;">
                <option value="300" ${targetDpi === 300 ? 'selected' : ''}>${t('tools.ocr.dpi300')}</option>
                <option value="150" ${targetDpi === 150 ? 'selected' : ''}>${t('tools.ocr.dpi150')}</option>
              </select>
            </div>
          </div>

          <!-- Action / Progress Section -->
          ${isProcessing ? `
            <div style="padding: 1rem; background: var(--bg-subtle); border-radius: var(--radius-md); margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
                <span id="ocr-progress-text">Memproses OCR...</span>
                <span id="ocr-progress-pct">0%</span>
              </div>
              <div class="progress-bar-container" style="height: 8px; margin-bottom: 0.75rem;">
                <div class="progress-bar-fill" id="ocr-progress-bar" style="width: 0%;"></div>
              </div>
              <div style="text-align: right;">
                <button class="btn btn-secondary btn-sm" id="btn-cancel-ocr">${t('tools.ocr.cancel')}</button>
              </div>
            </div>
          ` : `
            <div>
              <button class="btn btn-primary" id="btn-start-ocr" style="width: 100%; font-weight: 600; padding: 0.75rem 1.25rem;" ${!hasModels ? 'disabled' : ''}>
                ${t('tools.ocr.actionStart')}
              </button>
            </div>
          `}
        </div>

        <!-- Results Display Card -->
        ${lastOcrResults ? `
          <div class="card" style="border: 1px solid var(--color-success, #10b981);">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; border-bottom: 1px solid var(--border-subtle); padding-bottom: 0.75rem; margin-bottom: 1rem;">
              <div>
                <span style="font-weight: 700; color: var(--color-success, #10b981); margin-right: 0.5rem;">✓ ${t('tools.ocr.completed')}</span>
                <span style="font-size: 0.85rem; color: var(--text-secondary);">
                  ${t('tools.ocr.recognizedStats', {
                    words: lastOcrResults.totalWords,
                    chars: lastOcrResults.totalChars,
                    acc: lastOcrResults.avgConfidence
                  })}
                </span>
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" id="btn-download-searchable-pdf" style="display: inline-flex; align-items: center; gap: 0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  ${t('tools.ocr.downloadSearchablePdf')}
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-download-txt">
                  ${t('tools.ocr.downloadTxt')}
                </button>
                <button class="btn btn-secondary btn-sm" id="btn-copy-ocr-text">
                  ${t('tools.ocr.copyText')}
                </button>
              </div>
            </div>

            <!-- Recognized Text Preview Box -->
            <textarea readonly class="input-text" style="width: 100%; height: 260px; font-family: monospace; font-size: 0.85rem; resize: vertical; padding: 0.75rem; background: var(--bg-surface); line-height: 1.6;" id="ocr-preview-textarea">${lastOcrResults.fullText || t('tools.ocr.noTextFound')}</textarea>
          </div>
        ` : ''}
      `}
    </div>
  `;

  attachEventListeners();
}

function attachEventListeners() {
  if (!activeContainer) return;

  // Import Model File Picker
  const btnImport = activeContainer.querySelector('#btn-import-model');
  const btnImportHero = activeContainer.querySelector('#btn-import-model-hero');
  const modelInput = activeContainer.querySelector('#ocr-model-input');

  const triggerModelPick = () => modelInput && modelInput.click();
  if (btnImport) btnImport.addEventListener('click', triggerModelPick);
  if (btnImportHero) btnImportHero.addEventListener('click', triggerModelPick);

  if (modelInput) {
    modelInput.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const fileName = file.name.toLowerCase();
      let langCode = 'eng';
      if (fileName.includes('ind')) {
        langCode = 'ind';
      } else if (fileName.includes('eng')) {
        langCode = 'eng';
      }

      try {
        const arrayBuf = await file.arrayBuffer();
        const uint8 = new Uint8Array(arrayBuf);
        await saveTesseractModel(langCode, uint8);
        availableLangs = await getAvailableOcrLangs();
        selectedLang = langCode;notify(t('tools.ocr.importSuccess', { lang: langCode.toUpperCase() }), 'success');
        render();
      } catch (err) {
        console.error('Failed to import model:', err);notify(t('errors.generic'), 'error');
      }
    });
  }

  // File Picker
  const btnSelect = activeContainer.querySelector('#btn-select-ocr-file');
  const fileInput = activeContainer.querySelector('#ocr-file-input');
  if (btnSelect && fileInput) {
    btnSelect.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFiles(e.target.files);
      }
    });
  }

  // Drag and drop zone
  const dropZone = activeContainer.querySelector('#ocr-drop-zone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('drag-over');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('drag-over');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFiles(e.dataTransfer.files);
      }
    });
  }

  // Change / Clear File
  const btnChange = activeContainer.querySelector('#btn-change-file');
  if (btnChange) {
    btnChange.addEventListener('click', () => {
      currentFile = null;
      currentPdfDoc = null;
      lastOcrResults = null;
      lastSearchablePdfBytes = null;
      render();
    });
  }

  // Language Radio
  const langRadios = activeContainer.querySelectorAll('input[name="ocr-lang"]');
  langRadios.forEach((r) => {
    r.addEventListener('change', (e) => {
      selectedLang = e.target.value;
    });
  });

  // Page Selection Radio
  const pageRadios = activeContainer.querySelectorAll('input[name="ocr-page-mode"]');
  pageRadios.forEach((r) => {
    r.addEventListener('change', (e) => {
      selectedPageMode = e.target.value;
      render();
    });
  });

  // Range Input
  const rangeInput = activeContainer.querySelector('#ocr-range-input');
  if (rangeInput) {
    rangeInput.addEventListener('input', (e) => {
      customPageRange = e.target.value;
    });
  }

  // DPI Select
  const dpiSelect = activeContainer.querySelector('#ocr-dpi-select');
  if (dpiSelect) {
    dpiSelect.addEventListener('change', (e) => {
      targetDpi = parseInt(e.target.value, 10);
    });
  }

  // Cancel Button
  const btnCancel = activeContainer.querySelector('#btn-cancel-ocr');
  if (btnCancel) {
    btnCancel.addEventListener('click', () => {
      isCancelled = true;
      isProcessing = false;notify(t('common.cancel'), 'info');
      render();
    });
  }

  // Start OCR Button
  const btnStart = activeContainer.querySelector('#btn-start-ocr');
  if (btnStart) {
    btnStart.addEventListener('click', () => {
      executeOcr();
    });
  }

  // Download Searchable PDF
  const btnDlPdf = activeContainer.querySelector('#btn-download-searchable-pdf');
  if (btnDlPdf && lastSearchablePdfBytes) {
    btnDlPdf.addEventListener('click', () => {
      const baseName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
      downloadFile(lastSearchablePdfBytes, `${baseName}-ocr-searchable.pdf`, 'application/pdf');
    });
  }

  // Download TXT
  const btnDlTxt = activeContainer.querySelector('#btn-download-txt');
  if (btnDlTxt && lastOcrResults) {
    btnDlTxt.addEventListener('click', () => {
      const baseName = currentFile ? currentFile.name.replace(/\.pdf$/i, '') : 'document';
      const blob = new Blob([lastOcrResults.fullText], { type: 'text/plain;charset=utf-8' });
      downloadFile(blob, `${baseName}-ocr.txt`, 'text/plain');
    });
  }

  // Copy TXT
  const btnCopy = activeContainer.querySelector('#btn-copy-ocr-text');
  if (btnCopy && lastOcrResults) {
    btnCopy.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(lastOcrResults.fullText);notify(t('tools.ocr.copied'), 'success');
      } catch (err) {notify(t('errors.generic'), 'error');
      }
    });
  }
}

// =========================================================================
// OCR ENGINE RUNNER
// =========================================================================

async function executeOcr() {
  if (!currentPdfDoc || !currentFile) return;

  if (availableLangs.length === 0) {notify(t('tools.ocr.notLoadedWarning'), 'warning');
    return;
  }

  isProcessing = true;
  isCancelled = false;
  render();

  try {
    const targetPages = selectedPageMode === 'all'
      ? Array.from({ length: pageCount }, (_, i) => i)
      : parsePageRange(customPageRange, pageCount);

    if (targetPages.length === 0) {notify(t('errors.invalidRange'), 'error');
      isProcessing = false;
      render();
      return;
    }

    const progressText = activeContainer.querySelector('#ocr-progress-text');
    const progressPct = activeContainer.querySelector('#ocr-progress-pct');
    const progressBar = activeContainer.querySelector('#ocr-progress-bar');

    const updateProgress = (pageIdx, totalTarget, workerStatus, subProgress = 0) => {
      if (!progressText || !progressBar) return;
      const overall = Math.round(((pageIdx + subProgress) / totalTarget) * 100);
      progressText.textContent = t('tools.ocr.processing', {
        current: pageIdx + 1,
        total: totalTarget,
        pct: overall
      });
      if (progressPct) progressPct.textContent = `${overall}%`;
      progressBar.style.width = `${overall}%`;
    };

    updateProgress(0, targetPages.length, 'init', 0);

    // Initialize or fetch worker
    const worker = await getOcrWorker(selectedLang, (m) => {
      if (m && typeof m.progress === 'number') {
        // Sub-progress during current page recognition
      }
    });

    const pageResults = [];
    const scale = targetDpi === 300 ? 4.16 : 2.08; // 300 DPI vs 150 DPI

    for (let i = 0; i < targetPages.length; i++) {
      if (isCancelled) break;

      const pageIndex = targetPages[i];
      updateProgress(i, targetPages.length, 'rendering', 0.2);

      const page = await currentPdfDoc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: ctx,
        viewport
      };

      await page.render(renderContext).promise;

      updateProgress(i, targetPages.length, 'recognizing', 0.5);

      const ocrRes = await worker.recognize(canvas);

      pageResults.push({
        pageIndex,
        canvasWidth: viewport.width,
        canvasHeight: viewport.height,
        text: ocrRes.data.text || '',
        words: ocrRes.data.words || []
      });

      // Strict memory cleanup
      canvas.width = 0;
      canvas.height = 0;

      updateProgress(i + 1, targetPages.length, 'page-done', 0);
    }

    if (isCancelled) {
      isProcessing = false;
      render();
      return;
    }

    // Format Plain Text & Statistics
    const textReport = formatOcrText(pageResults);

    // Build Searchable PDF with invisible text layer
    const fileBytes = new Uint8Array(await currentFile.arrayBuffer());
    const searchablePdfBytes = await buildSearchablePdf(fileBytes, pageResults);

    lastOcrResults = textReport;
    lastSearchablePdfBytes = searchablePdfBytes;
    isProcessing = false;notify(t('tools.ocr.completed'), 'success');
    render();
  } catch (err) {
    console.error('OCR Processing error:', err);notify(t('errors.generic'), 'error');
    isProcessing = false;
    render();
  }
}
