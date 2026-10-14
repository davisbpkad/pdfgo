/**
 * redact.js - Sensor Dokumen Module (True Permanent Redaction via Canvas Rasterization)
 * Permanently removes sensitive text & underlying vectors by replacing redacted pages with high-resolution raster images.
 * Untouched pages remain clean vectors. Sanitizes PDF metadata.
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'redact';
export const titleKey = 'tools.redact.title';
export const descKey = 'tools.redact.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m3 3 18 18"/><path d="M9 3v18"/></svg>`;

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Execute True Redaction: rasterizes redacted pages, preserves untouched pages, clears metadata
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} pdfDocProxy
 * @param {Record<number, Array<{ x: number, y: number, width: number, height: number }>>} boxesByPage
 * @param {number} previewScale
 * @param {boolean} [sanitizeMeta=true]
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function executeTrueRedaction(srcBuffer, pdfDocProxy, boxesByPage, previewScale, sanitizeMeta = true, onProgress = null) {
  const srcDoc = await PDFDocument.load(srcBuffer);
  const newDoc = await PDFDocument.create();
  const totalPages = srcDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const pageBoxes = boxesByPage[i] || [];
    const origPage = srcDoc.getPage(i);
    const { width: origWidth, height: origHeight } = origPage.getSize();

    if (pageBoxes.length === 0) {
      // Untouched page: copy original vector page directly
      const [copied] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copied);
    } else {
      // Redacted page: render at high resolution (scale 2.5 ~ 180-200 DPI)
      const highResScale = 2.5;
      const { canvas } = await renderPageToCanvas(pdfDocProxy, i + 1, highResScale);
      const ctx = canvas.getContext('2d');

      const scaleFactor = highResScale / previewScale;

      // Draw permanent solid black rectangles directly over the raster pixels
      ctx.fillStyle = '#000000';
      for (const box of pageBoxes) {
        ctx.fillRect(
          box.x * scaleFactor,
          box.y * scaleFactor,
          box.width * scaleFactor,
          box.height * scaleFactor
        );
      }

      // Convert canvas to PNG bytes (destroys all underlying text vectors completely)
      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();

      // Cleanup canvas memory
      canvas.width = 0;
      canvas.height = 0;

      const embeddedImg = await newDoc.embedPng(pngBuffer);
      const newPage = newDoc.addPage([origWidth, origHeight]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: origWidth,
        height: origHeight
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  if (sanitizeMeta) {
    newDoc.setTitle('');
    newDoc.setAuthor('');
    newDoc.setSubject('');
    newDoc.setKeywords([]);
    newDoc.setProducer('');
    newDoc.setCreator('');
  }

  return await newDoc.save();
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
let currentPageIndex = 0; // 0-indexed

// Redaction boxes keyed by page index
let boxesByPage = {}; // { [pageIdx]: Array<{ id, x, y, width, height }> }
let sanitizeMetadata = true;
let searchTerm = '';
let isDrawingBox = false;
let startBoxPoint = null;
let currentPreviewScale = 0.8;
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
  boxesByPage = {};
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
    currentPageIndex = 0;
    boxesByPage = {};
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
  renderPageCanvas();
}

async function renderPageCanvas() {
  if (!pdfDocProxy) return;

  const canvasWrapper = document.getElementById('redact-canvas-wrapper');
  if (!canvasWrapper) return;

  try {
    const { canvas, width, height } = await renderPageToCanvas(pdfDocProxy, currentPageIndex + 1, currentPreviewScale);
    canvas.id = 'redact-rendered-page';

    canvasWrapper.innerHTML = '';
    canvasWrapper.appendChild(canvas);

    // Mount existing boxes for this page
    const pageBoxes = boxesByPage[currentPageIndex] || [];
    for (const box of pageBoxes) {
      createBoxDomElement(canvasWrapper, box);
    }
  } catch (e) {
    console.warn('Redact canvas render error:', e);
  }
}

function createBoxDomElement(parent, box) {
  const el = document.createElement('div');
  el.id = box.id;
  el.className = 'redact-box-rect';
  el.style.left = `${box.x}px`;
  el.style.top = `${box.y}px`;
  el.style.width = `${box.width}px`;
  el.style.height = `${box.height}px`;

  el.title = 'Klik untuk menghapus kotak sensor';
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBox(box.id);
  });

  parent.appendChild(el);
}

function removeBox(boxId) {
  const list = boxesByPage[currentPageIndex] || [];
  boxesByPage[currentPageIndex] = list.filter(b => b.id !== boxId);
  const el = document.getElementById(boxId);
  if (el) el.remove();
}

function clearCurrentPageBoxes() {
  boxesByPage[currentPageIndex] = [];
  renderPageCanvas();
  if (activeCtx) activeCtx.showToast('Kotak sensor di halaman ini dihapus.', 'info');
}

async function handleSearchAndRedact() {
  if (!searchTerm.trim() || !pdfDocProxy) return;

  try {
    const page = await pdfDocProxy.getPage(currentPageIndex + 1);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: currentPreviewScale });
    const query = searchTerm.toLowerCase();

    let matchedCount = 0;
    if (!boxesByPage[currentPageIndex]) boxesByPage[currentPageIndex] = [];

    const wrapper = document.getElementById('redact-canvas-wrapper');

    for (const item of content.items) {
      if (item.str && item.str.toLowerCase().includes(query)) {
        // Compute item bounds using PDF.js viewport transform
        const tx = item.transform;
        const fontHeight = Math.hypot(tx[2], tx[3]);
        const itemWidth = item.width * currentPreviewScale;
        const itemHeight = fontHeight * currentPreviewScale;

        // Convert to viewport coordinates
        const p1 = viewport.convertToViewportPoint(tx[4], tx[5]);
        const boxX = p1[0];
        const boxY = p1[1] - itemHeight;

        const box = {
          id: 'rbox_' + Math.random().toString(36).substring(2, 9),
          x: Math.max(0, boxX - 2),
          y: Math.max(0, boxY - 2),
          width: itemWidth + 4,
          height: itemHeight + 4
        };

        boxesByPage[currentPageIndex].push(box);
        if (wrapper) createBoxDomElement(wrapper, box);
        matchedCount++;
      }
    }

    if (matchedCount > 0) {
      if (activeCtx) activeCtx.showToast(t('tools.redact.foundCount', { count: matchedCount }), 'success');
    } else {
      if (activeCtx) activeCtx.showToast(`Kata "${searchTerm}" tidak ditemukan pada halaman ini.`, 'info');
    }
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal mencari teks: ' + (err.message || ''), 'error');
  }
}

async function handleApplyRedaction() {
  const totalBoxes = Object.values(boxesByPage).reduce((acc, list) => acc + list.length, 0);
  if (totalBoxes === 0) {
    if (activeCtx) activeCtx.showToast('Gambar setidaknya satu kotak sensor terlebih dahulu.', 'error');
    return;
  }

  isProcessing = true;
  render();

  try {
    const resultBytes = await executeTrueRedaction(
      activeBuffer,
      pdfDocProxy,
      boxesByPage,
      currentPreviewScale,
      sanitizeMetadata
    );

    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_redacted.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast('Dokumen berhasil disensor permanen!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menyensor dokumen', 'error');
  } finally {
    isProcessing = false;
    render();
    renderPageCanvas();
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
            ${t('tools.redact.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.redact.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  const currentBoxes = boxesByPage[currentPageIndex] || [];

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Security Alert Notice -->
      <div style="background-color: var(--accent-danger-light); border: 1px solid rgba(220, 38, 38, 0.3); border-radius: var(--radius-md); padding: 0.85rem 1.25rem; font-size: 0.85rem; color: var(--accent-danger); font-weight: 600;">
        ${t('tools.redact.warningPermanent')}
      </div>

      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Left Column: Controls & Search -->
        <div style="flex: 1; min-width: 320px; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Search Redaction Box -->
          <div class="form-group">
            <label class="form-label">${t('tools.redact.searchLabel')}</label>
            <div style="display: flex; gap: 0.5rem;">
              <input type="text" id="input-redact-search" class="form-control" placeholder="${t('tools.redact.searchPlaceholder')}" value="${searchTerm}" />
              <button class="btn-control" id="btn-redact-search" style="font-weight: 600; white-space: nowrap;">
                ${t('tools.redact.searchBtn')}
              </button>
            </div>
          </div>

          <!-- Page Tools & Status -->
          <div style="background: var(--bg-subtle); padding: 1rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">
                Halaman ${currentPageIndex + 1} (${currentBoxes.length} kotak sensor)
              </span>
              <button class="btn-control" id="btn-clear-redact-page" style="font-size: 0.75rem; color: var(--accent-danger);" ${currentBoxes.length === 0 ? 'disabled' : ''}>
                ${t('tools.redact.clearBoxes')}
              </button>
            </div>

            <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
              💡 ${t('tools.redact.drawHint')} Klik kotak hitam untuk menghapus.
            </p>
          </div>

          <!-- Sanitize Metadata -->
          <div>
            <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
              <input type="checkbox" id="chk-redact-meta" ${sanitizeMetadata ? 'checked' : ''} />
              <span>${t('tools.redact.sanitizeMetadata')}</span>
            </label>
          </div>

          <!-- Submit Action -->
          <div style="margin-top: 0.5rem;">
            <button class="btn-upload" id="btn-apply-redaction" style="width: 100%; justify-content: center; background-color: var(--accent-danger);" ${isProcessing ? 'disabled' : ''}>
              ${isProcessing ? 'Memproses Sensor...' : t('tools.redact.actionApply')}
            </button>
          </div>
        </div>

        <!-- Right Column: Interactive Canvas Viewport -->
        <div style="flex: 1.4; min-width: 360px; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
              Halaman ${currentPageIndex + 1} dari ${totalPages}
            </span>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn-icon-action" id="btn-redact-prev" ${currentPageIndex <= 0 ? 'disabled' : ''}>◀</button>
              <button class="btn-icon-action" id="btn-redact-next" ${currentPageIndex >= totalPages - 1 ? 'disabled' : ''}>▶</button>
            </div>
          </div>

          <div class="preview-canvas-container" style="padding: 1rem;">
            <div class="redact-canvas-wrapper" id="redact-canvas-wrapper">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Memuat halaman...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('input-redact-search')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
  });

  document.getElementById('btn-redact-search')?.addEventListener('click', handleSearchAndRedact);
  document.getElementById('btn-clear-redact-page')?.addEventListener('click', clearCurrentPageBoxes);

  document.getElementById('chk-redact-meta')?.addEventListener('change', (e) => {
    sanitizeMetadata = e.target.checked;
  });

  document.getElementById('btn-redact-prev')?.addEventListener('click', () => {
    if (currentPageIndex > 0) {
      currentPageIndex--;
      render();
      renderPageCanvas();
    }
  });

  document.getElementById('btn-redact-next')?.addEventListener('click', () => {
    if (currentPageIndex < totalPages - 1) {
      currentPageIndex++;
      render();
      renderPageCanvas();
    }
  });

  document.getElementById('btn-apply-redaction')?.addEventListener('click', handleApplyRedaction);

  // Drawing redaction boxes on canvas wrapper
  const wrapper = document.getElementById('redact-canvas-wrapper');
  if (wrapper) {
    let currentDrawingBoxEl = null;

    wrapper.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('redact-box-rect')) return; // ignore existing box clicks
      isDrawingBox = true;
      const rect = wrapper.getBoundingClientRect();
      startBoxPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      currentDrawingBoxEl = document.createElement('div');
      currentDrawingBoxEl.className = 'redact-box-rect';
      currentDrawingBoxEl.style.left = `${startBoxPoint.x}px`;
      currentDrawingBoxEl.style.top = `${startBoxPoint.y}px`;
      currentDrawingBoxEl.style.width = '0px';
      currentDrawingBoxEl.style.height = '0px';
      currentDrawingBoxEl.style.pointerEvents = 'none';
      wrapper.appendChild(currentDrawingBoxEl);

      wrapper.setPointerCapture(e.pointerId);
    });

    wrapper.addEventListener('pointermove', (e) => {
      if (!isDrawingBox || !startBoxPoint || !currentDrawingBoxEl) return;
      const rect = wrapper.getBoundingClientRect();
      const curX = e.clientX - rect.left;
      const curY = e.clientY - rect.top;

      const left = Math.min(startBoxPoint.x, curX);
      const top = Math.min(startBoxPoint.y, curY);
      const width = Math.abs(curX - startBoxPoint.x);
      const height = Math.abs(curY - startBoxPoint.y);

      currentDrawingBoxEl.style.left = `${left}px`;
      currentDrawingBoxEl.style.top = `${top}px`;
      currentDrawingBoxEl.style.width = `${width}px`;
      currentDrawingBoxEl.style.height = `${height}px`;
    });

    wrapper.addEventListener('pointerup', (e) => {
      if (!isDrawingBox) return;
      isDrawingBox = false;

      if (currentDrawingBoxEl) {
        const w = parseInt(currentDrawingBoxEl.style.width, 10);
        const h = parseInt(currentDrawingBoxEl.style.height, 10);

        if (w > 8 && h > 8) {
          const box = {
            id: 'rbox_' + Math.random().toString(36).substring(2, 9),
            x: parseInt(currentDrawingBoxEl.style.left, 10),
            y: parseInt(currentDrawingBoxEl.style.top, 10),
            width: w,
            height: h
          };

          if (!boxesByPage[currentPageIndex]) boxesByPage[currentPageIndex] = [];
          boxesByPage[currentPageIndex].push(box);

          currentDrawingBoxEl.id = box.id;
          currentDrawingBoxEl.style.pointerEvents = 'auto';
          currentDrawingBoxEl.title = 'Klik untuk menghapus kotak sensor';
          currentDrawingBoxEl.addEventListener('click', (ev) => {
            ev.stopPropagation();
            removeBox(box.id);
          });
        } else {
          currentDrawingBoxEl.remove();
        }
        currentDrawingBoxEl = null;
      }

      startBoxPoint = null;
      try { wrapper.releasePointerCapture(e.pointerId); } catch (_) {}
    });
  }
}
