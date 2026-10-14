/**
 * organize.js - Atur Halaman Module (Visual Page Reordering, Rotation & Deletion)
 * 100% Client-side, undo/redo history, drag-and-drop grid, memory safe.
 */

import { PDFDocument, degrees } from 'pdf-lib';
import { loadPdfJsDocument, renderPageToCanvas } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'organize';
export const titleKey = 'tools.organize.title';
export const descKey = 'tools.organize.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`;

// ============================================================================
// Pure Logic Engine
// ============================================================================
/**
 * Assemble a new PDF from a list of page operations
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {Array<{ originalIndex: number, rotation: number }>} pageConfigs
 * @param {string} [password]
 * @returns {Promise<Uint8Array>}
 */
export async function reorganizePdfPages(srcBuffer, pageConfigs, password = '') {
  if (!pageConfigs || pageConfigs.length === 0) {
    throw new Error('Dokumen harus memiliki minimal 1 halaman.');
  }

  const srcDoc = await PDFDocument.load(srcBuffer, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const newDoc = await PDFDocument.create();

  for (const config of pageConfigs) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [config.originalIndex]);
    const currentRot = copiedPage.getRotation().angle;
    const finalRot = (currentRot + config.rotation) % 360;
    copiedPage.setRotation(degrees(finalRot));
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save();
}

// ============================================================================
// UI & State Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let activeBuffer = null;
let pdfDocProxy = null;
let pages = []; // Array of { id, originalIndex, rotation, thumbUrl, isSelected }
let historyStack = [];
let historyIndex = -1;
let draggedPageIndex = null;
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
  pages = [];
  historyStack = [];
  historyIndex = -1;
  isSaving = false;
}

async function loadDocument(file) {
  activeFile = file;
  render();

  try {
    const buffer = await file.arrayBuffer();
    activeBuffer = buffer;
    pdfDocProxy = await loadPdfJsDocument(buffer);
    const count = pdfDocProxy.numPages;

    pages = [];
    for (let i = 0; i < count; i++) {
      pages.push({
        id: 'p_' + i + '_' + Math.random().toString(36).substring(2, 6),
        originalIndex: i,
        rotation: 0,
        thumbUrl: '',
        isSelected: false
      });
    }

    // Initialize history
    historyStack = [JSON.parse(JSON.stringify(pages))];
    historyIndex = 0;
    render();

    // Lazy render thumbnails asynchronously in small batches
    loadThumbnailsBatch(0, count);
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal memuat dokumen: ' + (err.message || ''), 'error');
  }
}

async function loadThumbnailsBatch(start, end) {
  if (!pdfDocProxy) return;

  for (let i = start; i < end; i++) {
    if (!pages[i] || pages[i].thumbUrl) continue;
    try {
      const { canvas } = await renderPageToCanvas(pdfDocProxy, pages[i].originalIndex + 1, 0.4);
      pages[i].thumbUrl = canvas.toDataURL('image/jpeg', 0.8);

      const thumbEl = document.getElementById(`thumb-img-${pages[i].id}`);
      if (thumbEl) {
        thumbEl.innerHTML = `<img src="${pages[i].thumbUrl}" alt="Hal ${i + 1}" />`;
      }
    } catch (e) {
      console.warn('Failed to render page thumbnail:', i, e);
    }
  }
}

function pushHistory() {
  if (historyIndex < historyStack.length - 1) {
    historyStack = historyStack.slice(0, historyIndex + 1);
  }
  historyStack.push(JSON.parse(JSON.stringify(pages)));
  historyIndex++;
  render();
}

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    pages = JSON.parse(JSON.stringify(historyStack[historyIndex]));
    render();
  }
}

function redo() {
  if (historyIndex < historyStack.length - 1) {
    historyIndex++;
    pages = JSON.parse(JSON.stringify(historyStack[historyIndex]));
    render();
  }
}

function rotatePage(index, delta = 90) {
  if (!pages[index]) return;
  pages[index].rotation = (pages[index].rotation + delta) % 360;
  pushHistory();
}

function rotateAll(delta = 90) {
  pages.forEach(p => {
    p.rotation = (p.rotation + delta) % 360;
  });
  pushHistory();
}

function deletePage(index) {
  if (pages.length <= 1) {
    if (activeCtx) activeCtx.showToast('Dokumen harus memiliki minimal 1 halaman tersisa.', 'error');
    return;
  }
  pages.splice(index, 1);
  pushHistory();
}

function deleteSelected() {
  const remaining = pages.filter(p => !p.isSelected);
  if (remaining.length === 0) {
    if (activeCtx) activeCtx.showToast('Dokumen harus memiliki minimal 1 halaman tersisa.', 'error');
    return;
  }
  pages = remaining;
  pushHistory();
}

function toggleSelect(index) {
  if (pages[index]) {
    pages[index].isSelected = !pages[index].isSelected;
    render();
  }
}

function selectAll(val = true) {
  pages.forEach(p => p.isSelected = val);
  render();
}

function movePage(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) return;
  const [moved] = pages.splice(fromIndex, 1);
  pages.splice(toIndex, 0, moved);
  pushHistory();
}

async function handleSave() {
  if (!activeBuffer || pages.length === 0) return;

  isSaving = true;
  render();

  try {
    const configs = pages.map(p => ({
      originalIndex: p.originalIndex,
      rotation: p.rotation
    }));

    const resultBytes = await reorganizePdfPages(activeBuffer, configs);
    const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_organized.pdf`;
    downloadFile(resultBytes, filename);

    if (activeCtx) activeCtx.showToast(t('tools.organize.successSaved'), 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal menyimpan perubahan halaman', 'error');
  } finally {
    isSaving = false;
    render();
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
            ${t('tools.organize.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.organize.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  const selectedCount = pages.filter(p => p.isSelected).length;

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Toolbar -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-light);">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn-control" id="btn-org-undo" ${historyIndex <= 0 ? 'disabled' : ''} title="Urungkan">
            ↶ ${t('tools.organize.undo')}
          </button>
          <button class="btn-control" id="btn-org-redo" ${historyIndex >= historyStack.length - 1 ? 'disabled' : ''} title="Ulangi">
            ↷ ${t('tools.organize.redo')}
          </button>
          <button class="btn-control" id="btn-org-rotate-all">
            ↻ ${t('tools.organize.rotateAll')}
          </button>
          <button class="btn-control" id="btn-org-select-all">
            ${selectedCount === pages.length ? t('tools.organize.deselectAll') : t('tools.organize.selectAll')}
          </button>
          ${selectedCount > 0 ? `
            <button class="btn-control" id="btn-org-delete-selected" style="color: var(--accent-danger);">
              🗑 ${t('tools.organize.deleteSelected')} (${selectedCount})
            </button>
          ` : ''}
        </div>

        <button class="btn-upload" id="btn-org-save" ${isSaving ? 'disabled' : ''}>
          ${isSaving ? 'Menyimpan...' : t('tools.organize.saveOrganized', { count: pages.length })}
        </button>
      </div>

      <!-- Grid of Pages -->
      <div class="organize-grid" id="org-grid">
        ${pages.map((p, index) => `
          <div class="organize-card ${p.isSelected ? 'selected' : ''}" draggable="true" data-index="${index}">
            <span class="organize-badge">${index + 1}</span>

            <div class="organize-thumb-wrapper" id="thumb-img-${p.id}" style="transform: rotate(${p.rotation}deg);">
              ${p.thumbUrl ? `<img src="${p.thumbUrl}" alt="Hal ${index + 1}" />` : `
                <span style="font-size: 0.75rem; color: var(--text-muted);">Memuat...</span>
              `}
            </div>

            <div class="organize-card-actions">
              <button class="btn-icon-action" style="width: 28px; height: 28px;" title="Putar 90°" onclick="window.__orgRotate(${index})">
                ↻
              </button>
              <button class="btn-icon-action danger" style="width: 28px; height: 28px;" title="Hapus Halaman" onclick="window.__orgDelete(${index})">
                🗑
              </button>
              <input type="checkbox" ${p.isSelected ? 'checked' : ''} style="cursor: pointer; margin-left: 0.25rem;" onchange="window.__orgToggleSelect(${index})" />
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('btn-org-undo')?.addEventListener('click', undo);
  document.getElementById('btn-org-redo')?.addEventListener('click', redo);
  document.getElementById('btn-org-rotate-all')?.addEventListener('click', () => rotateAll(90));
  document.getElementById('btn-org-delete-selected')?.addEventListener('click', deleteSelected);
  document.getElementById('btn-org-save')?.addEventListener('click', handleSave);

  document.getElementById('btn-org-select-all')?.addEventListener('click', () => {
    const allSelected = pages.every(p => p.isSelected);
    selectAll(!allSelected);
  });

  // Drag and drop grid ordering
  const cards = activeContainer.querySelectorAll('.organize-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedPageIndex = parseInt(card.getAttribute('data-index'), 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    card.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(card.getAttribute('data-index'), 10);
      if (draggedPageIndex !== null && targetIndex !== draggedPageIndex) {
        movePage(draggedPageIndex, targetIndex);
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedPageIndex = null;
    });
  });
}

// Global UI bridges
if (typeof window !== 'undefined') {
  window.__orgRotate = (idx) => rotatePage(idx);
  window.__orgDelete = (idx) => deletePage(idx);
  window.__orgToggleSelect = (idx) => toggleSelect(idx);
}
