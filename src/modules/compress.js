/**
 * compress.js - Kompres PDF Module
 * 3 Adaptive presets (Light, Balanced, Maximum), adaptive canvas JPEG raster encoding,
 * before/after size scorecard, and compression trade-off explanations.
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'compress';
export const titleKey = 'tools.compress.title';
export const descKey = 'tools.compress.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 14 8-8 8 8"/><path d="M12 6v12"/><path d="M4 20h16"/></svg>`;

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Compress PDF via raster canvas re-encoding
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} pdfDocProxy
 * @param {{ dpiScale: number, quality: number }} options
 * @param {Function} [onProgress]
 * @returns {Promise<{ bytes: Uint8Array, originalSize: number, compressedSize: number, reductionRate: number }>}
 */
export async function compressPdfDocument(srcBuffer, pdfDocProxy, options, onProgress = null) {
  const { dpiScale = 1.5, quality = 0.70 } = options;
  const numPages = pdfDocProxy.numPages;

  const srcDoc = await PDFDocument.load(srcBuffer);
  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const origPage = srcDoc.getPage(i - 1);
    const { width: origWidth, height: origHeight } = origPage.getSize();

    // Render page to canvas at target scale
    const { canvas } = await renderPageToCanvas(pdfDocProxy, i, dpiScale);

    // Convert to JPEG blob
    const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    const jpegBuffer = await jpegBlob.arrayBuffer();

    // Release canvas memory
    canvas.width = 0;
    canvas.height = 0;

    const embeddedJpg = await newDoc.embedJpg(jpegBuffer);
    const newPage = newDoc.addPage([origWidth, origHeight]);
    newPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: origWidth,
      height: origHeight
    });

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100), i, numPages);
    }
  }

  const resultBytes = await newDoc.save();
  const originalSize = srcBuffer.byteLength;
  const compressedSize = resultBytes.byteLength;
  const reductionRate = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  return {
    bytes: resultBytes,
    originalSize,
    compressedSize,
    reductionRate
  };
}

// ============================================================================
// UI Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let activeBuffer = null;
let pdfDocProxy = null;
let totalPages = 0;

let selectedPreset = 'balanced'; // 'low' | 'balanced' | 'high'
let isCompressing = false;
let progressPct = 0;
let progressStatusText = '';
let compressionResult = null;

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
  pdfDocProxy = null;
  compressionResult = null;
  isCompressing = false;
}

async function loadDocument(file) {
  activeFile = file;
  compressionResult = null;
  render();

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    pdfDocProxy = await loadPdfJsDocument(buffer);
    totalPages = pdfDocProxy.numPages;
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
}

async function handleStartCompress() {
  if (!pdfDocProxy || !activeBuffer) return;

  isCompressing = true;
  progressPct = 5;
  compressionResult = null;
  render();

  let dpiScale = 1.5;
  let quality = 0.70;

  if (selectedPreset === 'low') {
    dpiScale = 2.0;
    quality = 0.85;
  } else if (selectedPreset === 'high') {
    dpiScale = 1.0;
    quality = 0.50;
  }

  try {
    const result = await compressPdfDocument(
      activeBuffer,
      pdfDocProxy,
      { dpiScale, quality },
      (pct, cur, total) => {
        progressPct = pct;
        progressStatusText = `Mengompresi halaman ${cur} dari ${total}...`;
        updateProgressBar(pct, progressStatusText);
      }
    );

    compressionResult = result;
    isCompressing = false;
    render();

    // Trigger download
    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_compressed.pdf`;
    downloadFile(result.bytes, filename);

    if (activeCtx) {
      if (result.reductionRate > 0) {
        activeCtx.showToast(`Berhasil dikompres! Penghematan ${result.reductionRate}%`, 'success');
      } else {
        activeCtx.showToast('Kompresi selesai (ukuran asli sudah sangat optimal).', 'info');
      }
    }
  } catch (err) {
    isCompressing = false;
    render();
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal mengompresi PDF', 'error');
  }
}

function updateProgressBar(pct, statusText) {
  const bar = document.getElementById('compress-progress-fill');
  const label = document.getElementById('compress-progress-label');
  const statusEl = document.getElementById('compress-status-text');
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
            ${t('tools.compress.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.compress.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- File Summary -->
      <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light);">
        <div>
          <div style="font-weight: 700; color: var(--text-primary); font-size: 1rem;">${activeFile.name}</div>
          <div style="font-size: 0.85rem; color: var(--text-muted);">
            ${totalPages} halaman • ${(activeFile.size / 1024 / 1024).toFixed(2)} MB
          </div>
        </div>
        <button class="btn-control" id="btn-compress-change-file" style="font-size: 0.8rem;">Ganti Dokumen</button>
      </div>

      <!-- Compression Presets Cards -->
      <div>
        <label class="form-label">Tingkat Kompresi:</label>
        <div class="compress-presets-grid">
          <div class="compress-card ${selectedPreset === 'low' ? 'active' : ''}" onclick="window.__setCompressPreset('low')">
            <span class="compress-card-title">${t('tools.compress.presetLow')}</span>
            <span class="compress-card-desc">${t('tools.compress.presetLowDesc')}</span>
          </div>

          <div class="compress-card ${selectedPreset === 'balanced' ? 'active' : ''}" onclick="window.__setCompressPreset('balanced')">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span class="compress-card-title">${t('tools.compress.presetBalanced')}</span>
              <span style="font-size: 0.7rem; background: var(--accent-primary); color: white; padding: 0.1rem 0.4rem; border-radius: var(--radius-full); font-weight: 700;">PRO</span>
            </div>
            <span class="compress-card-desc">${t('tools.compress.presetBalancedDesc')}</span>
          </div>

          <div class="compress-card ${selectedPreset === 'high' ? 'active' : ''}" onclick="window.__setCompressPreset('high')">
            <span class="compress-card-title">${t('tools.compress.presetHigh')}</span>
            <span class="compress-card-desc">${t('tools.compress.presetHighDesc')}</span>
          </div>
        </div>
      </div>

      <!-- Progress Bar -->
      ${isCompressing ? `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
            <span id="compress-status-text">${progressStatusText || t('tools.compress.compressing')}</span>
            <span id="compress-progress-label">${progressPct}%</span>
          </div>
          <div class="merge-progress-wrapper">
            <div class="merge-progress-bar" id="compress-progress-fill" style="width: ${progressPct}%;"></div>
          </div>
        </div>
      ` : ''}

      <!-- Scorecard Result -->
      ${compressionResult ? `
        <div class="compress-scorecard">
          <div class="score-item">
            <span class="score-label">${t('tools.compress.originalSize')}</span>
            <span class="score-value">${(compressionResult.originalSize / 1024 / 1024).toFixed(2)} MB</span>
          </div>

          <div style="font-size: 1.5rem; color: var(--text-muted);">➔</div>

          <div class="score-item">
            <span class="score-label">${t('tools.compress.compressedSize')}</span>
            <span class="score-value" style="color: var(--accent-success);">
              ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          <div class="score-item">
            <span class="score-label">${t('tools.compress.reductionRate')}</span>
            <span class="score-badge-saved">
              ${compressionResult.reductionRate > 0 ? `-${compressionResult.reductionRate}%` : '0%'}
            </span>
          </div>

          <button class="btn-upload" id="btn-compress-download-again">
            Unduh Lagi
          </button>
        </div>

        ${compressionResult.reductionRate <= 0 ? `
          <div style="background-color: var(--accent-warning-light); border: 1px solid rgba(217, 119, 6, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1rem; font-size: 0.85rem; color: var(--text-primary);">
            ℹ️ ${t('tools.compress.warnLarger')}
          </div>
        ` : ''}
      ` : ''}

      <!-- Action Button -->
      <div style="display: flex; justify-content: flex-end;">
        <button class="btn-upload" id="btn-execute-compress" ${isCompressing ? 'disabled' : ''}>
          ${isCompressing ? 'Mengompresi...' : t('tools.compress.actionCompress')}
        </button>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('btn-compress-change-file')?.addEventListener('click', () => {
    activeFile = null;
    compressionResult = null;
    render();
  });

  document.getElementById('btn-execute-compress')?.addEventListener('click', handleStartCompress);

  document.getElementById('btn-compress-download-again')?.addEventListener('click', () => {
    if (compressionResult && compressionResult.bytes) {
      downloadFile(compressionResult.bytes, `${activeFile.name.replace(/\.pdf$/i, '')}_compressed.pdf`);
    }
  });
}

// Global UI helper
if (typeof window !== 'undefined') {
  window.__setCompressPreset = (preset) => {
    selectedPreset = preset;
    render();
  };
}
