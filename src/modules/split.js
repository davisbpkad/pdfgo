/**
 * split.js - Pisah PDF Module (Split & Page Range Extraction)
 * 100% Client-side, pure logic separated from UI, offline-first.
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, generateThumbnail } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { createZipArchive } from '../core/zip.js';
import { t } from '../core/i18n.js';

export const id = 'split';
export const titleKey = 'tools.split.title';
export const descKey = 'tools.split.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8"/><path d="M9 18l3 4 3-4"/><path d="m14 10 7-7"/><path d="m3 3 7 7"/></svg>`;

// ============================================================================
// Pure Logic Functions
// ============================================================================

/**
 * Parse a human-friendly page range string (e.g. "1-3, 5, 8-10")
 * @param {string} rangeStr
 * @param {number} totalPages
 * @returns {number[]} Array of 1-indexed page numbers
 */
export function parsePageRange(rangeStr, totalPages) {
  if (!rangeStr || typeof rangeStr !== 'string') return [];
  const parts = rangeStr.split(/[,;\s]+/).map(s => s.trim()).filter(Boolean);
  const pagesSet = new Set();

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(totalPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pagesSet.add(p);
        }
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= totalPages) {
        pagesSet.add(page);
      }
    }
  }

  return Array.from(pagesSet).sort((a, b) => a - b);
}

/**
 * Extract specified pages into a new PDF
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {number[]} pageNumbers (1-indexed)
 * @param {string} [password]
 * @returns {Promise<Uint8Array>}
 */
export async function extractPages(pdfBuffer, pageNumbers, password = '') {
  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error('Tidak ada halaman yang dipilih untuk diekstrak.');
  }

  const srcDoc = await PDFDocument.load(pdfBuffer, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const totalPages = srcDoc.getPageCount();
  const validZeroIndices = pageNumbers
    .filter(p => p >= 1 && p <= totalPages)
    .map(p => p - 1);

  if (validZeroIndices.length === 0) {
    throw new Error('Halaman yang dipilih melebihi jumlah halaman dokumen.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validZeroIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save();
}

/**
 * Split a PDF into chunks of N pages
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {number} nPages
 * @param {string} [password]
 * @param {Function} [onProgress]
 * @returns {Promise<Array<{ name: string, data: Uint8Array }>>}
 */
export async function splitEveryN(pdfBuffer, nPages = 1, password = '', onProgress = null) {
  if (nPages < 1) throw new Error('N harus minimal 1');

  const srcDoc = await PDFDocument.load(pdfBuffer, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const total = srcDoc.getPageCount();
  const chunks = [];
  const totalChunks = Math.ceil(total / nPages);

  for (let i = 0; i < total; i += nPages) {
    const chunkDoc = await PDFDocument.create();
    const end = Math.min(i + nPages, total);
    const indices = [];
    for (let p = i; p < end; p++) indices.push(p);

    const pages = await chunkDoc.copyPages(srcDoc, indices);
    for (const page of pages) chunkDoc.addPage(page);

    const chunkBytes = await chunkDoc.save();
    const chunkNum = Math.floor(i / nPages) + 1;
    const name = `bagian_${String(chunkNum).padStart(3, '0')}_hal_${i + 1}-${end}.pdf`;
    chunks.push({ name, data: chunkBytes });

    if (onProgress) {
      onProgress(Math.round((chunkNum / totalChunks) * 100));
    }
  }

  return chunks;
}

// ============================================================================
// UI Component
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let activeBuffer = null;
let activeThumbnail = '';
let totalPages = 0;
let splitMode = 'range'; // 'range' | 'everyN'
let rangeString = '1-2';
let nPagesValue = 1;
let isProcessing = false;
let progressPct = 0;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;

  if (ctx && ctx.queue && !activeFile) {
    const queuePdf = ctx.queue.getItems().find(i => i.name.toLowerCase().endsWith('.pdf'));
    if (queuePdf) {
      loadDocument(queuePdf.file);
    }
  }

  render();
}

export function onFiles(files) {
  const pdf = Array.from(files).find(f => f.name.toLowerCase().endsWith('.pdf'));
  if (pdf) {
    loadDocument(pdf);
  }
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
  activeFile = null;
  activeBuffer = null;
  activeThumbnail = '';
  totalPages = 0;
  isProcessing = false;
}

async function loadDocument(file) {
  activeFile = file;
  render();

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    const docProxy = await loadPdfJsDocument(buffer);
    totalPages = docProxy.numPages;
    activeThumbnail = await generateThumbnail(buffer, 140);
    rangeString = totalPages > 1 ? `1-${Math.min(3, totalPages)}` : '1';
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
}

async function handleProcess() {
  if (!activeBuffer || totalPages === 0) return;

  isProcessing = true;
  progressPct = 10;
  render();

  try {
    if (splitMode === 'range') {
      const pageNumbers = parsePageRange(rangeString, totalPages);
      if (pageNumbers.length === 0) {
        throw new Error(t('tools.split.invalidRange'));
      }

      progressPct = 40;
      updateProgressBar(progressPct);

      const resultBytes = await extractPages(activeBuffer, pageNumbers);
      progressPct = 100;
      updateProgressBar(progressPct);

      const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_hal_${rangeString.replace(/[,\s]+/g, '_')}.pdf`;
      downloadFile(resultBytes, filename);

      if (activeCtx) activeCtx.showToast(t('tools.split.successPdf'), 'success');
    } else {
      // Split every N
      const n = Math.max(1, parseInt(nPagesValue, 10) || 1);
      const chunks = await splitEveryN(activeBuffer, n, '', (pct) => {
        progressPct = pct;
        updateProgressBar(pct);
      });

      if (chunks.length === 1) {
        downloadFile(chunks[0].data, chunks[0].name);
      } else {
        const zipBlob = await createZipArchive(chunks);
        const zipName = `${activeFile.name.replace(/\.pdf$/i, '')}_split_ZIP.zip`;
        downloadFile(zipBlob, zipName, 'application/zip');
      }

      if (activeCtx) activeCtx.showToast(t('tools.split.successZip', { count: chunks.length }), 'success');
    }
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal memproses split', 'error');
  } finally {
    isProcessing = false;
    render();
  }
}

function updateProgressBar(pct) {
  const bar = document.getElementById('split-progress-fill');
  const label = document.getElementById('split-progress-label');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
}

function render() {
  if (!activeContainer) return;

  if (!activeFile) {
    activeContainer.innerHTML = `
      <div class="tool-workspace">
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 1rem; color: var(--accent-primary); background: var(--accent-primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${icon}
          </div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${t('tools.split.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.split.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  const selectedPages = splitMode === 'range' ? parsePageRange(rangeString, totalPages) : [];

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Document Summary Card -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <div class="merge-thumb-box" style="width: 48px; height: 64px;">
            ${activeThumbnail ? `<img src="${activeThumbnail}" alt="Thumbnail" />` : 'PDF'}
          </div>
          <div>
            <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">${activeFile.name}</div>
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              ${totalPages} halaman • ${(activeFile.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        </div>
        <button class="btn-control" id="btn-split-change-file" style="font-size: 0.8rem;">
          Ganti Dokumen
        </button>
      </div>

      <!-- Mode Selector -->
      <div style="display: flex; justify-content: center;">
        <div class="tab-group">
          <button class="tab-btn ${splitMode === 'range' ? 'active' : ''}" id="tab-mode-range">
            ${t('tools.split.modeRange')}
          </button>
          <button class="tab-btn ${splitMode === 'everyN' ? 'active' : ''}" id="tab-mode-everyN">
            ${t('tools.split.modeEveryN')}
          </button>
        </div>
      </div>

      <!-- Mode Settings Form -->
      <div style="background: var(--bg-surface); border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.25rem;">
        ${splitMode === 'range' ? `
          <div class="form-group">
            <label class="form-label">${t('tools.split.rangeLabel')}</label>
            <input type="text" id="input-split-range" class="form-control" value="${rangeString}" placeholder="Contoh: 1-3, 5, 8-10" />
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
              Terpilih: <strong>${selectedPages.length}</strong> halaman (${selectedPages.join(', ') || 'tidak ada'})
            </div>
          </div>
        ` : `
          <div class="form-group" style="max-width: 320px;">
            <label class="form-label">${t('tools.split.nPagesLabel')}</label>
            <input type="number" id="input-split-n" class="form-control" value="${nPagesValue}" min="1" max="${totalPages}" />
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">
              Akan menghasilkan sekitar <strong>${Math.ceil(totalPages / (parseInt(nPagesValue, 10) || 1))}</strong> file (dikemas dalam ZIP).
            </div>
          </div>
        `}
      </div>

      <!-- Progress Bar -->
      ${isProcessing ? `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
            <span>Memproses pemisahan...</span>
            <span id="split-progress-label">${progressPct}%</span>
          </div>
          <div class="merge-progress-wrapper">
            <div class="merge-progress-bar" id="split-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Action Button -->
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn-upload" id="btn-split-execute" ${isProcessing ? 'disabled' : ''}>
          ${splitMode === 'range' ? t('tools.split.actionExtract') : t('tools.split.actionSplit')}
        </button>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('btn-split-change-file')?.addEventListener('click', () => {
    activeFile = null;
    activeBuffer = null;
    render();
  });

  document.getElementById('tab-mode-range')?.addEventListener('click', () => {
    splitMode = 'range';
    render();
  });

  document.getElementById('tab-mode-everyN')?.addEventListener('click', () => {
    splitMode = 'everyN';
    render();
  });

  const rangeInput = document.getElementById('input-split-range');
  rangeInput?.addEventListener('input', (e) => {
    rangeString = e.target.value;
    // Live update preview text without full re-render
    const previewEl = activeContainer.querySelector('.form-group div');
    if (previewEl) {
      const selected = parsePageRange(rangeString, totalPages);
      previewEl.innerHTML = `Terpilih: <strong>${selected.length}</strong> halaman (${selected.join(', ') || 'tidak ada'})`;
    }
  });

  const nInput = document.getElementById('input-split-n');
  nInput?.addEventListener('input', (e) => {
    nPagesValue = e.target.value;
  });

  document.getElementById('btn-split-execute')?.addEventListener('click', handleProcess);
}
