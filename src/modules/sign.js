/**
 * sign.js - Tanda Tangan Digital Module
 * 3 Signature creation methods: Freehand canvas drawing with smoothing, typed cursive font, and image upload with transparent background removal.
 * Draggable & resizable placement with precision PDF coordinate mapping.
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'sign';
export const titleKey = 'tools.sign.title';
export const descKey = 'tools.sign.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>`;

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Embed and stamp a signature PNG onto a PDF document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {ArrayBuffer|Uint8Array} signaturePngBuffer
 * @param {Array<{ pageIndex: number, x: number, y: number, width: number, height: number }>} placements
 * @returns {Promise<Uint8Array>}
 */
export async function applySignatures(srcBuffer, signaturePngBuffer, placements) {
  if (!placements || placements.length === 0) {
    throw new Error('Tentukan posisi penempatan tanda tangan terlebih dahulu.');
  }

  const pdfDoc = await PDFDocument.load(srcBuffer);
  const signatureImg = await pdfDoc.embedPng(signaturePngBuffer);

  for (const p of placements) {
    const page = pdfDoc.getPage(p.pageIndex);
    page.drawImage(signatureImg, {
      x: p.x,
      y: p.y,
      width: p.width,
      height: p.height
    });
  }

  return await pdfDoc.save();
}

/**
 * Remove near-white pixels from an image to make it transparent
 * @param {HTMLImageElement} img
 * @returns {string} transparent PNG data URL
 */
export function removeWhiteBackground(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // If pixel is near-white (threshold > 230)
    if (r > 230 && g > 230 && b > 230) {
      data[i + 3] = 0; // Alpha 0
    }
  }

  ctx.putImageData(imgData, 0, 0);
  const dataUrl = canvas.toDataURL('image/png');
  canvas.width = 0;
  canvas.height = 0;
  return dataUrl;
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

// Creation Tab State
let activeTab = 'draw'; // 'draw' | 'type' | 'upload'
let activeSignatureUrl = null; // Data URL of current ready signature

// Draw state
let inkColor = '#000000';
let inkWidth = 2;
let isDrawing = false;
let lastPoint = null;

// Type state
let typeText = '';
let typeFont = 'Dancing Script'; // 'Dancing Script' | 'Caveat'

// Placement state
let uiX = 50;
let uiY = 50;
let uiWidth = 140;
let uiHeight = 70;
let applyTarget = 'current'; // 'current' | 'all'
let isSaving = false;

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
  activeSignatureUrl = null;
  isSaving = false;
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
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }

  render();
  renderPdfPagePreview();
}

async function renderPdfPagePreview() {
  if (!pdfDocProxy) return;

  const canvasContainer = document.getElementById('sign-page-canvas-wrapper');
  if (!canvasContainer) return;

  try {
    const { canvas, width, height } = await renderPageToCanvas(pdfDocProxy, currentPageIndex + 1, 0.8);
    canvas.id = 'sign-rendered-page';

    canvasContainer.innerHTML = '';
    canvasContainer.appendChild(canvas);

    // If a signature is already chosen, ensure draggable box is mounted over page
    if (activeSignatureUrl) {
      mountDraggableSignature(canvasContainer, width, height);
    }
  } catch (e) {
    console.warn('Page preview error:', e);
  }
}

function mountDraggableSignature(parent, pageW, pageH) {
  const existing = document.getElementById('sign-draggable-overlay');
  if (existing) existing.remove();

  const box = document.createElement('div');
  box.id = 'sign-draggable-overlay';
  box.className = 'sign-draggable-box';
  box.style.left = `${uiX}px`;
  box.style.top = `${uiY}px`;
  box.style.width = `${uiWidth}px`;
  box.style.height = `${uiHeight}px`;

  box.innerHTML = `
    <img src="${activeSignatureUrl}" alt="Paraf" />
    <div class="sign-resize-handle" id="sign-resize-handle"></div>
  `;

  parent.appendChild(box);

  // Dragging logic
  let startDragX = 0;
  let startDragY = 0;
  let initLeft = 0;
  let initTop = 0;
  let isDraggingBox = false;

  box.addEventListener('pointerdown', (e) => {
    if (e.target.id === 'sign-resize-handle') return; // Handled by resizer
    isDraggingBox = true;
    startDragX = e.clientX;
    startDragY = e.clientY;
    initLeft = parseInt(box.style.left, 10);
    initTop = parseInt(box.style.top, 10);
    box.setPointerCapture(e.pointerId);
  });

  box.addEventListener('pointermove', (e) => {
    if (!isDraggingBox) return;
    const dx = e.clientX - startDragX;
    const dy = e.clientY - startDragY;
    uiX = Math.max(0, Math.min(initLeft + dx, pageW - uiWidth));
    uiY = Math.max(0, Math.min(initTop + dy, pageH - uiHeight));
    box.style.left = `${uiX}px`;
    box.style.top = `${uiY}px`;
  });

  box.addEventListener('pointerup', (e) => {
    isDraggingBox = false;
    try { box.releasePointerCapture(e.pointerId); } catch (_) {}
  });

  // Resizing logic
  const handle = box.querySelector('#sign-resize-handle');
  let startResizeX = 0;
  let startResizeY = 0;
  let initW = 0;
  let initH = 0;
  let isResizing = false;

  handle?.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    isResizing = true;
    startResizeX = e.clientX;
    startResizeY = e.clientY;
    initW = parseInt(box.style.width, 10);
    initH = parseInt(box.style.height, 10);
    handle.setPointerCapture(e.pointerId);
  });

  handle?.addEventListener('pointermove', (e) => {
    if (!isResizing) return;
    const dx = e.clientX - startResizeX;
    const dy = e.clientY - startResizeY;
    uiWidth = Math.max(40, initW + dx);
    uiHeight = Math.max(20, initH + dy);
    box.style.width = `${uiWidth}px`;
    box.style.height = `${uiHeight}px`;
  });

  handle?.addEventListener('pointerup', (e) => {
    isResizing = false;
    try { handle.releasePointerCapture(e.pointerId); } catch (_) {}
  });
}

// Generate signature from drawing canvas
function commitDrawnSignature() {
  const canvas = document.getElementById('draw-sign-canvas');
  if (!canvas) return;
  activeSignatureUrl = canvas.toDataURL('image/png');
  render();
  renderPdfPagePreview();
  if (activeCtx) activeCtx.showToast('Tanda tangan siap ditempatkan.', 'info');
}

// Generate signature from typed text
function commitTypedSignature() {
  if (!typeText.trim()) return;

  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.font = `64px '${typeFont}', cursive`;
  ctx.fillStyle = inkColor;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'center';
  ctx.fillText(typeText, canvas.width / 2, canvas.height / 2);

  activeSignatureUrl = canvas.toDataURL('image/png');
  render();
  renderPdfPagePreview();
  if (activeCtx) activeCtx.showToast('Tanda tangan ketik siap ditempatkan.', 'info');
}

async function handleSaveSignedPdf() {
  if (!activeBuffer || !activeSignatureUrl) {
    if (activeCtx) activeCtx.showToast('Pilih dan posisikan tanda tangan terlebih dahulu.', 'error');
    return;
  }

  isSaving = true;
  render();

  try {
    // Convert activeSignatureUrl data URL to ArrayBuffer
    const resp = await fetch(activeSignatureUrl); // local data URL fetch is allowed by CSP connect-src data:
    const signBuffer = await resp.arrayBuffer();

    const pageProxy = await pdfDocProxy.getPage(currentPageIndex + 1);
    const unscaledViewport = pageProxy.getViewport({ scale: 1.0 });
    const pdfPageWidth = unscaledViewport.width;
    const pdfPageHeight = unscaledViewport.height;

    // Get rendered canvas dimensions
    const renderedCanvas = document.getElementById('sign-rendered-page');
    const canvasWidth = renderedCanvas ? renderedCanvas.width : pdfPageWidth;
    const canvasHeight = renderedCanvas ? renderedCanvas.height : pdfPageHeight;

    const scaleX = pdfPageWidth / canvasWidth;
    const scaleY = pdfPageHeight / canvasHeight;

    // Convert UI (top-left) to PDF (bottom-left) coordinates
    const pdfX = uiX * scaleX;
    const pdfY = pdfPageHeight - (uiY + uiHeight) * scaleY;
    const pdfW = uiWidth * scaleX;
    const pdfH = uiHeight * scaleY;

    const placements = [];
    if (applyTarget === 'all') {
      for (let i = 0; i < totalPages; i++) {
        placements.push({ pageIndex: i, x: pdfX, y: pdfY, width: pdfW, height: pdfH });
      }
    } else {
      placements.push({ pageIndex: currentPageIndex, x: pdfX, y: pdfY, width: pdfW, height: pdfH });
    }

    const resultBytes = await applySignatures(activeBuffer, signBuffer, placements);
    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_signed.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast('Dokumen berhasil ditandatangani!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menandatangani PDF', 'error');
  } finally {
    isSaving = false;
    render();
    renderPdfPagePreview();
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
            ${t('tools.sign.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.sign.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.5rem;">
      <div style="display: flex; gap: 1.5rem; flex-wrap: wrap;">
        <!-- Left Column: Signature Creator Panel -->
        <div style="flex: 1; min-width: 340px; display: flex; flex-direction: column; gap: 1rem;">
          <!-- Tabs: Draw / Type / Upload -->
          <div style="display: flex; justify-content: center;">
            <div class="tab-group">
              <button class="tab-btn ${activeTab === 'draw' ? 'active' : ''}" id="tab-sign-draw">
                ✏️ ${t('tools.sign.tabDraw')}
              </button>
              <button class="tab-btn ${activeTab === 'type' ? 'active' : ''}" id="tab-sign-type">
                ⌨️ ${t('tools.sign.tabType')}
              </button>
              <button class="tab-btn ${activeTab === 'upload' ? 'active' : ''}" id="tab-sign-upload">
                📁 ${t('tools.sign.tabUpload')}
              </button>
            </div>
          </div>

          <!-- Tab Content: Draw -->
          ${activeTab === 'draw' ? `
            <div>
              <div class="sign-palette-bar">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span style="font-size: 0.8rem; font-weight: 600;">Warna:</span>
                  <button class="btn-control" style="width: 22px; height: 22px; border-radius: 50%; background: #000000; padding: 0;" onclick="window.__setInkColor('#000000')"></button>
                  <button class="btn-control" style="width: 22px; height: 22px; border-radius: 50%; background: #1d4ed8; padding: 0;" onclick="window.__setInkColor('#1d4ed8')"></button>
                  <button class="btn-control" style="width: 22px; height: 22px; border-radius: 50%; background: #991b1b; padding: 0;" onclick="window.__setInkColor('#991b1b')"></button>
                </div>
                <button class="btn-control" style="font-size: 0.75rem; padding: 0.2rem 0.6rem;" id="btn-clear-draw-canvas">
                  ${t('tools.sign.clearCanvas')}
                </button>
              </div>

              <div class="sign-canvas-container">
                <canvas id="draw-sign-canvas" width="340" height="150" style="width: 100%; height: 150px; display: block;"></canvas>
              </div>

              <button class="btn-upload" id="btn-use-drawn-sign" style="width: 100%; justify-content: center; margin-top: 0.65rem;">
                ${t('tools.sign.useSignature')}
              </button>
            </div>
          ` : ''}

          <!-- Tab Content: Type -->
          ${activeTab === 'type' ? `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div class="form-group">
                <label class="form-label">${t('tools.sign.fontLabel')}</label>
                <select id="select-sign-font" class="form-select">
                  <option value="Dancing Script" ${typeFont === 'Dancing Script' ? 'selected' : ''}>Dancing Script (Cursive Halus)</option>
                  <option value="Caveat" ${typeFont === 'Caveat' ? 'selected' : ''}>Caveat (Cursive Santai)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Nama / Teks Paraf:</label>
                <input type="text" id="input-sign-text" class="form-control" placeholder="${t('tools.sign.typePlaceholder')}" value="${typeText}" />
              </div>

              <!-- Typed Preview Box -->
              <div style="background: white; border: 1px solid var(--border-light); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; min-height: 100px; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; font-family: '${typeFont}', cursive; color: ${inkColor}; box-shadow: var(--shadow-sm);">
                ${typeText || 'Contoh Tanda Tangan'}
              </div>

              <button class="btn-upload" id="btn-use-typed-sign" style="width: 100%; justify-content: center;">
                ${t('tools.sign.useSignature')}
              </button>
            </div>
          ` : ''}

          <!-- Tab Content: Upload -->
          ${activeTab === 'upload' ? `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <input type="file" id="input-upload-sign-file" accept="image/png,image/jpeg" style="display: none;" />
              <button class="btn-control" id="btn-browse-sign-image" style="padding: 1.5rem; justify-content: center; border-style: dashed; flex-direction: column;">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" color="var(--accent-primary)">
                  <rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                </svg>
                <span style="margin-top: 0.5rem; font-weight: 600;">${t('tools.sign.uploadPrompt')}</span>
              </button>

              <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
                <input type="checkbox" id="chk-remove-bg" checked />
                <span>${t('tools.sign.removeBg')}</span>
              </label>

              <div id="upload-sign-preview-box" style="text-align: center; min-height: 60px;"></div>
            </div>
          ` : ''}

          <!-- Placement Settings -->
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-light); display: flex; flex-direction: column; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">${t('tools.sign.pageApplyLabel')}</label>
              <select id="select-sign-target" class="form-select">
                <option value="current" ${applyTarget === 'current' ? 'selected' : ''}>${t('tools.sign.applyCurrent')} (Hal ${currentPageIndex + 1})</option>
                <option value="all" ${applyTarget === 'all' ? 'selected' : ''}>${t('tools.sign.applyAll')} (${totalPages} halaman)</option>
              </select>
            </div>

            <button class="btn-upload" id="btn-save-signed-pdf" style="width: 100%; justify-content: center; margin-top: 0.5rem;" ${isSaving || !activeSignatureUrl ? 'disabled' : ''}>
              ${isSaving ? 'Menyimpan...' : t('tools.sign.saveSigned')}
            </button>
          </div>
        </div>

        <!-- Right Column: PDF Page Placement Interactive Viewport -->
        <div style="flex: 1.5; min-width: 360px; display: flex; flex-direction: column; gap: 0.5rem;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
              Pratinjau & Penempatan (Halaman ${currentPageIndex + 1} dari ${totalPages})
            </span>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn-icon-action" id="btn-sign-prev-page" ${currentPageIndex <= 0 ? 'disabled' : ''}>◀</button>
              <button class="btn-icon-action" id="btn-sign-next-page" ${currentPageIndex >= totalPages - 1 ? 'disabled' : ''}>▶</button>
            </div>
          </div>

          <div class="preview-canvas-container" style="padding: 1rem;">
            <div class="preview-canvas-wrapper" id="sign-page-canvas-wrapper">
              <span style="font-size: 0.85rem; color: var(--text-muted);">Memuat halaman dokumen...</span>
            </div>
          </div>

          <p style="font-size: 0.8rem; color: var(--text-muted); text-align: center;">
            💡 ${t('tools.sign.placementHint')}
          </p>
        </div>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('tab-sign-draw')?.addEventListener('click', () => { activeTab = 'draw'; render(); });
  document.getElementById('tab-sign-type')?.addEventListener('click', () => { activeTab = 'type'; render(); });
  document.getElementById('tab-sign-upload')?.addEventListener('click', () => { activeTab = 'upload'; render(); });

  // Draw Tab canvas events
  const drawCanvas = document.getElementById('draw-sign-canvas');
  if (drawCanvas) {
    const ctx = drawCanvas.getContext('2d');
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = inkWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    drawCanvas.addEventListener('pointerdown', (e) => {
      isDrawing = true;
      const rect = drawCanvas.getBoundingClientRect();
      lastPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      drawCanvas.setPointerCapture(e.pointerId);
    });

    drawCanvas.addEventListener('pointermove', (e) => {
      if (!isDrawing || !lastPoint) return;
      const rect = drawCanvas.getBoundingClientRect();
      const current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      ctx.beginPath();
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(current.x, current.y);
      ctx.stroke();

      lastPoint = current;
    });

    drawCanvas.addEventListener('pointerup', (e) => {
      isDrawing = false;
      lastPoint = null;
      try { drawCanvas.releasePointerCapture(e.pointerId); } catch (_) {}
    });

    document.getElementById('btn-clear-draw-canvas')?.addEventListener('click', () => {
      ctx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    });

    document.getElementById('btn-use-drawn-sign')?.addEventListener('click', commitDrawnSignature);
  }

  // Type Tab events
  document.getElementById('select-sign-font')?.addEventListener('change', (e) => {
    typeFont = e.target.value;
    render();
  });

  document.getElementById('input-sign-text')?.addEventListener('input', (e) => {
    typeText = e.target.value;
    const previewBox = activeContainer.querySelector('.tool-workspace div[style*="font-family"]');
    if (previewBox) previewBox.textContent = typeText || 'Contoh Tanda Tangan';
  });

  document.getElementById('btn-use-typed-sign')?.addEventListener('click', commitTypedSignature);

  // Upload Tab events
  const uploadBtn = document.getElementById('btn-browse-sign-image');
  const uploadInput = document.getElementById('input-upload-sign-file');

  uploadBtn?.addEventListener('click', () => uploadInput?.click());
  uploadInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const removeBg = document.getElementById('chk-remove-bg')?.checked ?? true;
        if (removeBg) {
          activeSignatureUrl = removeWhiteBackground(img);
        } else {
          activeSignatureUrl = ev.target.result;
        }
        render();
        renderPdfPagePreview();
        if (activeCtx) activeCtx.showToast('Gambar tanda tangan berhasil dimuat.', 'success');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Page pagination
  document.getElementById('btn-sign-prev-page')?.addEventListener('click', () => {
    if (currentPageIndex > 0) {
      currentPageIndex--;
      render();
      renderPdfPagePreview();
    }
  });

  document.getElementById('btn-sign-next-page')?.addEventListener('click', () => {
    if (currentPageIndex < totalPages - 1) {
      currentPageIndex++;
      render();
      renderPdfPagePreview();
    }
  });

  document.getElementById('select-sign-target')?.addEventListener('change', (e) => {
    applyTarget = e.target.value;
  });

  document.getElementById('btn-save-signed-pdf')?.addEventListener('click', handleSaveSignedPdf);
}

// Global UI helper
if (typeof window !== 'undefined') {
  window.__setInkColor = (color) => {
    inkColor = color;
    const canvas = document.getElementById('draw-sign-canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = color;
    }
  };
}
