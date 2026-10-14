/**
 * pdf-to-image.js - PDF ke Gambar Module (PNG / JPEG)
 * 100% Client-side canvas rasterization, adaptive memory downscaling, and ZIP packaging.
 */

import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { createZipArchive } from '../core/zip.js';
import { parsePageRange } from './split.js';
import { t } from '../core/i18n.js';

export const id = 'pdf-to-image';
export const titleKey = 'tools.pdfToImage.title';
export const descKey = 'tools.pdfToImage.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;

// Re-export pure logic from atomic feature file
export { convertPdfToImages } from '../features/pdf-to-image/logic/convertPdfToImages.js';

// ============================================================================
// UI Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let pdfDocProxy = null;
let totalPages = 0;
let imageFormat = 'png'; // 'png' | 'jpeg'
let jpegQuality = 85;
let dpiScale = 2.08; // ~150 DPI
let pageRangeChoice = 'all'; // 'all' | 'custom'
let customRange = '';
let isConverting = false;
let progressPct = 0;
let progressStatus = '';

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
  pdfDocProxy = null;
  totalPages = 0;
  isConverting = false;
}

async function loadDocument(file) {
  activeFile = file;
  render();

  try {
    const buffer = await file.arrayBuffer();
    pdfDocProxy = await loadPdfJsDocument(buffer);
    totalPages = pdfDocProxy.numPages;
    customRange = `1-${Math.min(5, totalPages)}`;
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
}

async function handleConvert() {
  if (!pdfDocProxy || !activeFile) return;

  let pageNumbers = [];
  if (pageRangeChoice === 'custom') {
    pageNumbers = parsePageRange(customRange, totalPages);
    if (pageNumbers.length === 0) {
      if (activeCtx) activeCtx.showToast(t('tools.split.invalidRange'), 'error');
      return;
    }
  }

  isConverting = true;
  progressPct = 5;
  render();

  try {
    const baseName = activeFile.name.replace(/\.pdf$/i, '');
    const images = await convertPdfToImages(
      pdfDocProxy,
      {
        format: imageFormat,
        scale: dpiScale,
        quality: jpegQuality / 100,
        pageNumbers,
        baseName
      },
      (pct, current, total) => {
        progressPct = pct;
        progressStatus = t('tools.pdfToImage.converting', { current, total });
        updateProgressBar(pct, progressStatus);
      }
    );

    if (images.length === 1) {
      downloadFile(images[0].data, images[0].name, images[0].data.type);
    } else {
      const zipBlob = await createZipArchive(images);
      const zipName = `${baseName}_gambar_ZIP.zip`;
      downloadFile(zipBlob, zipName, 'application/zip');
    }

    if (activeCtx) activeCtx.showToast(`Berhasil mengonversi ${images.length} halaman ke gambar!`, 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal mengonversi ke gambar', 'error');
  } finally {
    isConverting = false;
    render();
  }
}

function updateProgressBar(pct, statusText) {
  const bar = document.getElementById('image-progress-fill');
  const label = document.getElementById('image-progress-label');
  const statusEl = document.getElementById('image-progress-status');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
  if (statusEl && statusText) statusEl.textContent = statusText;
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
            ${t('tools.pdfToImage.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.pdfToImage.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Document Summary -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); padding: 0.85rem 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <div>
          <span style="font-weight: 700; color: var(--text-primary);">${activeFile.name}</span>
          <span style="font-size: 0.85rem; color: var(--text-muted); margin-left: 0.5rem;">(${totalPages} halaman)</span>
        </div>
        <button class="btn-control" id="btn-change-image-file" style="font-size: 0.8rem;">Ganti Dokumen</button>
      </div>

      <!-- Settings Form -->
      <div class="form-row">
        <!-- Format -->
        <div class="form-group">
          <label class="form-label">${t('tools.pdfToImage.formatLabel')}</label>
          <select id="select-img-format" class="form-select">
            <option value="png" ${imageFormat === 'png' ? 'selected' : ''}>PNG (Kualitas Tanpa Rugi/Lossless)</option>
            <option value="jpeg" ${imageFormat === 'jpeg' ? 'selected' : ''}>JPEG (Ukuran Lebih Ringan)</option>
          </select>
        </div>

        <!-- Resolution / DPI -->
        <div class="form-group">
          <label class="form-label">${t('tools.pdfToImage.dpiLabel')}</label>
          <select id="select-img-dpi" class="form-select">
            <option value="1.0" ${dpiScale === 1.0 ? 'selected' : ''}>${t('tools.pdfToImage.dpiStandard')}</option>
            <option value="2.08" ${dpiScale === 2.08 ? 'selected' : ''}>${t('tools.pdfToImage.dpiMedium')}</option>
            <option value="4.16" ${dpiScale === 4.16 ? 'selected' : ''}>${t('tools.pdfToImage.dpiHigh')}</option>
          </select>
        </div>

        <!-- JPEG Quality (if JPEG selected) -->
        ${imageFormat === 'jpeg' ? `
          <div class="form-group">
            <label class="form-label">${t('tools.pdfToImage.qualityLabel', { pct: jpegQuality })}</label>
            <input type="range" id="range-img-quality" min="50" max="100" value="${jpegQuality}" style="margin-top: 0.5rem;" />
          </div>
        ` : ''}
      </div>

      <div class="form-row" style="margin-top: 0.5rem;">
        <!-- Page Range Choice -->
        <div class="form-group">
          <label class="form-label">${t('tools.pdfToImage.pagesLabel')}</label>
          <select id="select-page-range" class="form-select">
            <option value="all" ${pageRangeChoice === 'all' ? 'selected' : ''}>${t('tools.pdfToImage.pagesAll')} (${totalPages} halaman)</option>
            <option value="custom" ${pageRangeChoice === 'custom' ? 'selected' : ''}>Pilih Rentang Halaman Kustom</option>
          </select>
        </div>

        ${pageRangeChoice === 'custom' ? `
          <div class="form-group">
            <label class="form-label">Masukkan Rentang (misal: 1-3, 5):</label>
            <input type="text" id="input-custom-range" class="form-control" value="${customRange}" />
          </div>
        ` : ''}
      </div>

      <!-- Progress Bar -->
      ${isConverting ? `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
            <span id="image-progress-status">${progressStatus || 'Mengonversi gambar...'}</span>
            <span id="image-progress-label">${progressPct}%</span>
          </div>
          <div class="merge-progress-wrapper">
            <div class="merge-progress-bar" id="image-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Action -->
      <div style="display: flex; justify-content: flex-end; margin-top: 0.5rem;">
        <button class="btn-upload" id="btn-convert-images" ${isConverting ? 'disabled' : ''}>
          ${t('tools.pdfToImage.actionConvert')}
        </button>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('btn-change-image-file')?.addEventListener('click', () => {
    activeFile = null;
    pdfDocProxy = null;
    render();
  });

  document.getElementById('select-img-format')?.addEventListener('change', (e) => {
    imageFormat = e.target.value;
    render();
  });

  document.getElementById('select-img-dpi')?.addEventListener('change', (e) => {
    dpiScale = parseFloat(e.target.value);
  });

  document.getElementById('range-img-quality')?.addEventListener('input', (e) => {
    jpegQuality = parseInt(e.target.value, 10);
    const label = activeContainer.querySelector('label[for="range-img-quality"]');
    if (label) label.textContent = t('tools.pdfToImage.qualityLabel', { pct: jpegQuality });
  });

  document.getElementById('select-page-range')?.addEventListener('change', (e) => {
    pageRangeChoice = e.target.value;
    render();
  });

  document.getElementById('input-custom-range')?.addEventListener('input', (e) => {
    customRange = e.target.value;
  });

  document.getElementById('btn-convert-images')?.addEventListener('click', handleConvert);
}
