/**
 * watermark.js - Watermark Module
 * 100% Client-side text watermarking with live preview, diagonal/tiled patterns, and page range filtering.
 */

import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { parsePageRange } from './split.js';
import { t } from '../core/i18n.js';

export const id = 'watermark';
export const titleKey = 'tools.watermark.title';
export const descKey = 'tools.watermark.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>`;

// Helper: Hex color to RGB object (0..1)
function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const num = parseInt(clean, 16);
  return rgb((num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Apply text watermark to specified pages of a PDF
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} options
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function applyWatermark(srcBuffer, options, onProgress = null) {
  const {
    text = 'CONFIDENTIAL',
    fontSize = 48,
    colorHex = '#dc2626',
    opacity = 0.25,
    position = 'diagonal', // 'diagonal' | 'center' | 'tiled'
    pageFilter = 'all',   // 'all' | 'odd' | 'even' | 'custom'
    customRange = ''
  } = options;

  const pdfDoc = await PDFDocument.load(srcBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(colorHex);
  const totalPages = pdfDoc.getPageCount();

  // Determine target pages
  const targetIndices = [];
  let customPages = [];
  if (pageFilter === 'custom') {
    customPages = parsePageRange(customRange, totalPages);
  }

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    if (pageFilter === 'all') targetIndices.push(i);
    else if (pageFilter === 'odd' && pageNum % 2 !== 0) targetIndices.push(i);
    else if (pageFilter === 'even' && pageNum % 2 === 0) targetIndices.push(i);
    else if (pageFilter === 'custom' && customPages.includes(pageNum)) targetIndices.push(i);
  }

  const textWidth = font.widthOfTextAtSize(text, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  for (let idx = 0; idx < targetIndices.length; idx++) {
    const pageIndex = targetIndices[idx];
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();

    if (position === 'tiled') {
      const stepX = Math.max(textWidth + 80, 200);
      const stepY = Math.max(textHeight + 80, 150);
      for (let x = -width * 0.5; x < width * 1.5; x += stepX) {
        for (let y = -height * 0.5; y < height * 1.5; y += stepY) {
          page.drawText(text, {
            x,
            y,
            size: fontSize * 0.7,
            font,
            color,
            opacity: opacity * 0.8,
            rotate: degrees(30)
          });
        }
      }
    } else if (position === 'diagonal') {
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      // Center accounting for rotation
      const x = (width - (textWidth * Math.cos(rad) - textHeight * Math.sin(rad))) / 2;
      const y = (height - (textWidth * Math.sin(rad) + textHeight * Math.cos(rad))) / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(angle)
      });
    } else {
      // Center horizontal
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(0)
      });
    }

    if (onProgress) {
      onProgress(Math.round(((idx + 1) / targetIndices.length) * 100));
    }
  }

  return await pdfDoc.save();
}

// ============================================================================
// UI Controller & Live Preview
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let activeBuffer = null;
let pdfDocProxy = null;
let previewCanvas = null;
let totalPages = 0;

// Settings
let watermarkText = 'CONFIDENTIAL';
let fontSize = 48;
let colorHex = '#dc2626';
let opacityValue = 25;
let positionLayout = 'diagonal'; // 'diagonal' | 'center' | 'tiled'
let pageFilterChoice = 'all';
let customRangeStr = '';
let isProcessing = false;

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
  previewCanvas = null;
  isProcessing = false;
}

async function loadDocument(file) {
  activeFile = file;
  render();

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    pdfDocProxy = await loadPdfJsDocument(buffer);
    totalPages = pdfDocProxy.numPages;
    customRangeStr = `1-${Math.min(5, totalPages)}`;
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
  updateLivePreview();
}

async function updateLivePreview() {
  if (!pdfDocProxy) return;

  const previewBox = document.getElementById('watermark-preview-box');
  if (!previewBox) return;

  try {
    const { canvas } = await renderPageToCanvas(pdfDocProxy, 1, 0.7);
    const ctx = canvas.getContext('2d');

    // Draw live watermark on canvas
    ctx.save();
    ctx.font = `bold ${fontSize * 0.7}px Atkinson Hyperlegible, sans-serif`;
    ctx.fillStyle = colorHex;
    ctx.globalAlpha = opacityValue / 100;

    const textMetrics = ctx.measureText(watermarkText);
    const textWidth = textMetrics.width;
    const textHeight = fontSize * 0.7;

    if (positionLayout === 'tiled') {
      const stepX = textWidth + 60;
      const stepY = textHeight + 70;
      for (let x = -canvas.width * 0.5; x < canvas.width * 1.5; x += stepX) {
        for (let y = -canvas.height * 0.5; y < canvas.height * 1.5; y += stepY) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((30 * Math.PI) / 180);
          ctx.fillText(watermarkText, 0, 0);
          ctx.restore();
        }
      }
    } else if (positionLayout === 'diagonal') {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-45 * Math.PI) / 180);
      ctx.fillText(watermarkText, -textWidth / 2, textHeight / 3);
    } else {
      ctx.fillText(watermarkText, (canvas.width - textWidth) / 2, (canvas.height + textHeight) / 2);
    }

    ctx.restore();

    previewBox.innerHTML = '';
    previewBox.appendChild(canvas);
  } catch (e) {
    console.warn('Live preview error:', e);
  }
}

async function handleApply() {
  if (!activeBuffer || !activeFile) return;

  isProcessing = true;
  render();

  try {
    const resultBytes = await applyWatermark(activeBuffer, {
      text: watermarkText,
      fontSize,
      colorHex,
      opacity: opacityValue / 100,
      position: positionLayout,
      pageFilter: pageFilterChoice,
      customRange: customRangeStr
    });

    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_watermark.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast('Watermark berhasil diterapkan!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menerapkan watermark', 'error');
  } finally {
    isProcessing = false;
    render();
    updateLivePreview();
  }
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
            ${t('tools.watermark.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.watermark.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Left Column: Controls Form -->
        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Text Input & Presets -->
          <div class="form-group">
            <label class="form-label">${t('tools.watermark.textLabel')}</label>
            <input type="text" id="input-wm-text" class="form-control" value="${watermarkText}" />
            <div style="display: flex; gap: 0.35rem; margin-top: 0.35rem; flex-wrap: wrap;">
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setWmPreset('CONFIDENTIAL')">CONFIDENTIAL</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setWmPreset('RAHASIA')">RAHASIA</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setWmPreset('DRAFT')">DRAFT</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setWmPreset('SAMPLE')">SAMPLE</button>
            </div>
          </div>

          <!-- Position Layout -->
          <div class="form-group">
            <label class="form-label">${t('tools.watermark.posLabel')}</label>
            <select id="select-wm-pos" class="form-select">
              <option value="diagonal" ${positionLayout === 'diagonal' ? 'selected' : ''}>${t('tools.watermark.posDiagonal')}</option>
              <option value="center" ${positionLayout === 'center' ? 'selected' : ''}>${t('tools.watermark.posCenter')}</option>
              <option value="tiled" ${positionLayout === 'tiled' ? 'selected' : ''}>${t('tools.watermark.posTiled')}</option>
            </select>
          </div>

          <!-- Size, Opacity & Color -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('tools.watermark.sizeLabel')} (${fontSize}pt)</label>
              <input type="range" id="range-wm-size" min="16" max="100" value="${fontSize}" />
            </div>

            <div class="form-group">
              <label class="form-label">${t('tools.watermark.opacityLabel', { pct: opacityValue })}</label>
              <input type="range" id="range-wm-opacity" min="5" max="100" value="${opacityValue}" />
            </div>

            <div class="form-group" style="max-width: 80px;">
              <label class="form-label">Warna:</label>
              <input type="color" id="input-wm-color" value="${colorHex}" style="width: 100%; height: 38px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer;" />
            </div>
          </div>

          <!-- Pages Target -->
          <div class="form-group">
            <label class="form-label">${t('tools.watermark.pagesLabel')}</label>
            <select id="select-wm-pages" class="form-select">
              <option value="all" ${pageFilterChoice === 'all' ? 'selected' : ''}>${t('tools.watermark.pagesAll')} (${totalPages} halaman)</option>
              <option value="odd" ${pageFilterChoice === 'odd' ? 'selected' : ''}>${t('tools.watermark.pagesOdd')}</option>
              <option value="even" ${pageFilterChoice === 'even' ? 'selected' : ''}>${t('tools.watermark.pagesEven')}</option>
              <option value="custom" ${pageFilterChoice === 'custom' ? 'selected' : ''}>Rentang Kustom</option>
            </select>
          </div>

          ${pageFilterChoice === 'custom' ? `
            <div class="form-group">
              <label class="form-label">Rentang Halaman (misal: 1-3, 5):</label>
              <input type="text" id="input-wm-custom-range" class="form-control" value="${customRangeStr}" />
            </div>
          ` : ''}

          <div style="margin-top: 0.5rem;">
            <button class="btn-upload" id="btn-apply-watermark" style="width: 100%; justify-content: center;" ${isProcessing ? 'disabled' : ''}>
              ${isProcessing ? 'Menerapkan...' : t('tools.watermark.actionApply')}
            </button>
          </div>
        </div>

        <!-- Right Column: Live Preview -->
        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column;">
          <label class="form-label" style="margin-bottom: 0.4rem;">Pratinjau Langsung (Halaman 1):</label>
          <div class="preview-canvas-container" id="watermark-preview-box">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Memuat pratinjau...</span>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('input-wm-text')?.addEventListener('input', (e) => {
    watermarkText = e.target.value;
    updateLivePreview();
  });

  document.getElementById('select-wm-pos')?.addEventListener('change', (e) => {
    positionLayout = e.target.value;
    updateLivePreview();
  });

  document.getElementById('range-wm-size')?.addEventListener('input', (e) => {
    fontSize = parseInt(e.target.value, 10);
    updateLivePreview();
  });

  document.getElementById('range-wm-opacity')?.addEventListener('input', (e) => {
    opacityValue = parseInt(e.target.value, 10);
    updateLivePreview();
  });

  document.getElementById('input-wm-color')?.addEventListener('input', (e) => {
    colorHex = e.target.value;
    updateLivePreview();
  });

  document.getElementById('select-wm-pages')?.addEventListener('change', (e) => {
    pageFilterChoice = e.target.value;
    render();
    updateLivePreview();
  });

  document.getElementById('input-wm-custom-range')?.addEventListener('input', (e) => {
    customRangeStr = e.target.value;
  });

  document.getElementById('btn-apply-watermark')?.addEventListener('click', handleApply);
}

// Global UI helper
if (typeof window !== 'undefined') {
  window.__setWmPreset = (str) => {
    watermarkText = str;
    const input = document.getElementById('input-wm-text');
    if (input) input.value = str;
    updateLivePreview();
  };
}
