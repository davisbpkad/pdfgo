/**
 * page-numbers.js - Nomor Halaman Module
 * 100% Client-side page numbering with token formatting ({n}, {total}),
 * 9-point position matrix, margin controls, and live interactive preview.
 */

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'page-numbers';
export const titleKey = 'tools.pageNumbers.title';
export const descKey = 'tools.pageNumbers.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M10 10h4"/><path d="M12 8v4"/></svg>`;

function hexToRgb(hex) {
  let clean = hex.replace('#', '');
  if (clean.length === 3) clean = clean.split('').map(c => c + c).join('');
  const num = parseInt(clean, 16);
  return rgb((num >> 16) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
}

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Stamp page numbers across a PDF document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} options
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function applyPageNumbers(srcBuffer, options, onProgress = null) {
  const {
    format = 'Halaman {n} dari {total}',
    startNumber = 1,
    position = 'bottom-center',
    margin = 30,
    fontSize = 10,
    colorHex = '#475569',
    skipFirstPage = false
  } = options;

  const pdfDoc = await PDFDocument.load(srcBuffer);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(colorHex);
  const totalPages = pdfDoc.getPageCount();

  const effectiveTotal = skipFirstPage ? totalPages - 1 : totalPages;
  let pageCounter = startNumber;

  for (let i = 0; i < totalPages; i++) {
    if (skipFirstPage && i === 0) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    const text = format
      .replace(/\{n\}/g, String(pageCounter))
      .replace(/\{total\}/g, String(effectiveTotal));

    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    // Compute X coordinate
    let x = margin;
    if (position.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (position.includes('right')) {
      x = width - margin - textWidth;
    }

    // Compute Y coordinate
    let y = margin;
    if (position.startsWith('top')) {
      y = height - margin - textHeight;
    } else if (position.startsWith('middle')) {
      y = (height - textHeight) / 2;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color
    });

    pageCounter++;

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
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
let totalPages = 0;

// State options
let numberFormat = 'Halaman {n} dari {total}';
let numberPosition = 'bottom-center';
let startNum = 1;
let marginVal = 25;
let fontSz = 10;
let colorCode = '#475569';
let skipFirst = false;
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
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
  updateLivePreview();
}

async function updateLivePreview() {
  if (!pdfDocProxy) return;

  const previewBox = document.getElementById('pagenum-preview-box');
  if (!previewBox) return;

  try {
    const pageToPreview = (skipFirst && totalPages > 1) ? 2 : 1;
    const { canvas } = await renderPageToCanvas(pdfDocProxy, pageToPreview, 0.7);
    const ctx = canvas.getContext('2d');

    const effectiveTotal = skipFirst && totalPages > 1 ? totalPages - 1 : totalPages;
    const sampleNum = (skipFirst && totalPages > 1) ? startNum : startNum;
    const text = numberFormat
      .replace(/\{n\}/g, String(sampleNum))
      .replace(/\{total\}/g, String(effectiveTotal));

    ctx.save();
    ctx.font = `${fontSz * 0.7}px Atkinson Hyperlegible, sans-serif`;
    ctx.fillStyle = colorCode;

    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = fontSz * 0.7;

    const scaledMargin = marginVal * 0.7;

    let x = scaledMargin;
    if (numberPosition.includes('center')) {
      x = (canvas.width - textW) / 2;
    } else if (numberPosition.includes('right')) {
      x = canvas.width - scaledMargin - textW;
    }

    let y = canvas.height - scaledMargin;
    if (numberPosition.startsWith('top')) {
      y = scaledMargin + textH;
    } else if (numberPosition.startsWith('middle')) {
      y = (canvas.height + textH) / 2;
    }

    ctx.fillText(text, x, y);
    ctx.restore();

    previewBox.innerHTML = '';
    previewBox.appendChild(canvas);
  } catch (e) {
    console.warn('Page number preview error:', e);
  }
}

async function handleApply() {
  if (!activeBuffer || !activeFile) return;

  isProcessing = true;
  render();

  try {
    const resultBytes = await applyPageNumbers(activeBuffer, {
      format: numberFormat,
      position: numberPosition,
      startNumber: startNum,
      margin: marginVal,
      fontSize: fontSz,
      colorHex: colorCode,
      skipFirstPage: skipFirst
    });

    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_numbered.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast('Nomor halaman berhasil diterapkan!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menambahkan nomor halaman', 'error');
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
            ${t('tools.pageNumbers.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.pageNumbers.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  const positions = [
    { id: 'top-left', label: '↖' },
    { id: 'top-center', label: '↑' },
    { id: 'top-right', label: '↗' },
    { id: 'middle-left', label: '←' },
    { id: 'middle-center', label: '•' },
    { id: 'middle-right', label: '→' },
    { id: 'bottom-left', label: '↙' },
    { id: 'bottom-center', label: '↓' },
    { id: 'bottom-right', label: '↘' }
  ];

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Left Column: Settings -->
        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Format Input -->
          <div class="form-group">
            <label class="form-label">${t('tools.pageNumbers.formatLabel')}</label>
            <input type="text" id="input-num-format" class="form-control" value="${numberFormat}" />
            <div style="display: flex; gap: 0.35rem; margin-top: 0.35rem; flex-wrap: wrap;">
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setNumFormat('Halaman {n} dari {total}')">Halaman {n} dari {total}</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setNumFormat('{n} / {total}')">{n} / {total}</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setNumFormat('- {n} -')">- {n} -</button>
              <button class="btn-control" style="font-size: 0.75rem; padding: 0.15rem 0.5rem;" onclick="window.__setNumFormat('{n}')">{n}</button>
            </div>
          </div>

          <!-- Position Matrix (3x3 grid) -->
          <div class="form-group">
            <label class="form-label">${t('tools.pageNumbers.posLabel')}</label>
            <div class="pos-matrix-grid">
              ${positions.map(p => `
                <button class="pos-matrix-btn ${numberPosition === p.id ? 'active' : ''}" onclick="window.__setNumPos('${p.id}')" title="${p.id}">
                  ${p.label}
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Start Number & Margin -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">${t('tools.pageNumbers.startNumberLabel')}</label>
              <input type="number" id="input-num-start" class="form-control" value="${startNum}" min="1" />
            </div>

            <div class="form-group">
              <label class="form-label">${t('tools.pageNumbers.marginLabel')} (${marginVal}pt)</label>
              <input type="range" id="range-num-margin" min="10" max="60" value="${marginVal}" />
            </div>

            <div class="form-group" style="max-width: 80px;">
              <label class="form-label">Warna:</label>
              <input type="color" id="input-num-color" value="${colorCode}" style="width: 100%; height: 38px; border: 1px solid var(--border-light); border-radius: var(--radius-sm); cursor: pointer;" />
            </div>
          </div>

          <!-- Skip First Page Checkbox -->
          <div class="form-group">
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
              <input type="checkbox" id="chk-skip-first" ${skipFirst ? 'checked' : ''} />
              <span>${t('tools.pageNumbers.skipFirstLabel')}</span>
            </label>
          </div>

          <div style="margin-top: 0.5rem;">
            <button class="btn-upload" id="btn-apply-pagenum" style="width: 100%; justify-content: center;" ${isProcessing ? 'disabled' : ''}>
              ${isProcessing ? 'Menerapkan...' : t('tools.pageNumbers.actionApply')}
            </button>
          </div>
        </div>

        <!-- Right Column: Live Preview -->
        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column;">
          <label class="form-label" style="margin-bottom: 0.4rem;">Pratinjau Langsung:</label>
          <div class="preview-canvas-container" id="pagenum-preview-box">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Memuat pratinjau...</span>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('input-num-format')?.addEventListener('input', (e) => {
    numberFormat = e.target.value;
    updateLivePreview();
  });

  document.getElementById('input-num-start')?.addEventListener('input', (e) => {
    startNum = parseInt(e.target.value, 10) || 1;
    updateLivePreview();
  });

  document.getElementById('range-num-margin')?.addEventListener('input', (e) => {
    marginVal = parseInt(e.target.value, 10);
    updateLivePreview();
  });

  document.getElementById('input-num-color')?.addEventListener('input', (e) => {
    colorCode = e.target.value;
    updateLivePreview();
  });

  document.getElementById('chk-skip-first')?.addEventListener('change', (e) => {
    skipFirst = e.target.checked;
    updateLivePreview();
  });

  document.getElementById('btn-apply-pagenum')?.addEventListener('click', handleApply);
}

// Global UI helpers
if (typeof window !== 'undefined') {
  window.__setNumFormat = (fmt) => {
    numberFormat = fmt;
    const input = document.getElementById('input-num-format');
    if (input) input.value = fmt;
    updateLivePreview();
  };

  window.__setNumPos = (pos) => {
    numberPosition = pos;
    render();
    updateLivePreview();
  };
}
