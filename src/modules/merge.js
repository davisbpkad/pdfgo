/**
 * merge.js - Gabung PDF Module (Architecture Proof of Concept)
 * Clean Code, 100% offline-first, client-side merging via pdf-lib.
 * Handles reordering, encrypted PDFs, page extraction, and memory cleanup.
 */

import { PDFDocument } from 'pdf-lib';
import { loadPdfJsDocument, generateThumbnail } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t, getLang } from '../core/i18n.js';

export const id = 'merge';
export const titleKey = 'tools.merge.title';
export const descKey = 'tools.merge.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4"/><path d="M12 2v4"/><path d="M16 2v4"/><rect width="16" height="18" x="4" y="4" rx="2"/><path d="M8 10h8"/><path d="M8 14h8"/><path d="M8 18h5"/></svg>`;

// ============================================================================
// Pure Logic Function (Decoupled from UI for testing)
// ============================================================================
/**
 * Merge an array of PDF buffers into a single PDF
 * @param {Array<{ buffer: ArrayBuffer|Uint8Array, name?: string, password?: string }>} entries
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function mergePdfFiles(entries, onProgress = null) {
  if (!entries || entries.length < 2) {
    throw new Error('Minimal 2 file PDF dibutuhkan untuk penggabungan.');
  }

  const mergedDoc = await PDFDocument.create();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    let srcDoc;
    try {
      const buf = entry.buffer instanceof Uint8Array
        ? entry.buffer.slice()
        : (entry.buffer instanceof ArrayBuffer ? entry.buffer.slice(0) : entry.buffer);
      srcDoc = await PDFDocument.load(buf, {
        password: entry.password || undefined,
        ignoreEncryption: false
      });
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypt')) {
        throw new Error(`File "${entry.name || 'PDF'}" dilindungi password. Silakan masukkan password yang benar.`);
      }
      throw new Error(`Gagal membaca "${entry.name || 'PDF'}": ${msg}`);
    }

    const pageIndices = srcDoc.getPageIndices();
    const copiedPages = await mergedDoc.copyPages(srcDoc, pageIndices);
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / entries.length) * 100));
    }
  }

  return await mergedDoc.save();
}

// ============================================================================
// UI Component & State Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let fileList = [];
let isProcessing = false;
let progressValue = 0;
let mergedResult = null;
let draggedIndex = null;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;

  // Initialize with any files currently in the global queue
  if (ctx && ctx.queue) {
    const queueFiles = ctx.queue.getItems()
      .filter(i => i.name.toLowerCase().endsWith('.pdf'))
      .map(i => i.file);

    if (queueFiles.length > 0 && fileList.length === 0) {
      processIncomingFiles(queueFiles);
    }
  }

  render();
}

export function onFiles(incomingFiles) {
  processIncomingFiles(incomingFiles);
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
  fileList = [];
  mergedResult = null;
  isProcessing = false;
}

async function processIncomingFiles(files) {
  const newPdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
  if (newPdfFiles.length === 0) return;

  for (const file of newPdfFiles) {
    const id = 'merge_' + Math.random().toString(36).substring(2, 9);
    const item = {
      id,
      file,
      name: file.name,
      size: file.size,
      buffer: null,
      pageCount: '...',
      thumbnail: '',
      isEncrypted: false,
      password: '',
      error: null
    };

    fileList.push(item);
    render();

    // Asynchronously read buffer and metadata
    try {
      const buffer = await file.arrayBuffer();
      item.buffer = buffer;

      // Check encryption & page count via PDF.js
      try {
        const docProxy = await loadPdfJsDocument(buffer);
        item.pageCount = docProxy.numPages;
        item.thumbnail = await generateThumbnail(docProxy, 120);
      } catch (err) {
        if (err.name === 'PasswordException' || (err.message && err.message.includes('password'))) {
          item.isEncrypted = true;
          item.pageCount = '?';
        } else {
          item.error = err.message || 'File PDF tidak valid';
        }
      }
    } catch (e) {
      item.error = 'Gagal membaca berkas';
    }

    render();
  }
}

async function unlockFile(index) {
  const item = fileList[index];
  if (!item || !item.isEncrypted || !item.buffer) return;

  const passInput = document.getElementById(`pass-${item.id}`);
  const pass = passInput ? passInput.value : '';

  try {
    const docProxy = await loadPdfJsDocument(item.buffer, pass);
    item.pageCount = docProxy.numPages;
    item.thumbnail = await generateThumbnail(docProxy, 120);
    item.password = pass;
    item.isEncrypted = false;
    item.error = null;
    if (activeCtx) activeCtx.showToast('Password cocok! Dokumen terbuka.', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Password salah. Silakan coba lagi.', 'error');
  }
  render();
}

function removeFile(index) {
  fileList.splice(index, 1);
  if (fileList.length === 0) {
    mergedResult = null;
  }
  render();
}

function moveFile(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= fileList.length || toIndex < 0 || toIndex >= fileList.length) {
    return;
  }
  const [moved] = fileList.splice(fromIndex, 1);
  fileList.splice(toIndex, 0, moved);
  render();
}

async function handleMerge() {
  if (fileList.length < 2) {
    if (activeCtx) activeCtx.showToast(t('tools.merge.needMinFiles'), 'error');
    return;
  }

  // Check if any file is still locked
  const lockedItem = fileList.find(f => f.isEncrypted);
  if (lockedItem) {
    if (activeCtx) activeCtx.showToast(`Berkas "${lockedItem.name}" masih terkunci password. Buka terlebih dahulu.`, 'error');
    return;
  }

  isProcessing = true;
  progressValue = 5;
  render();

  try {
    const entries = fileList.map(item => ({
      buffer: item.buffer,
      name: item.name,
      password: item.password
    }));

    const mergedBytes = await mergePdfFiles(entries, (pct) => {
      progressValue = pct;
      updateProgressBar(pct);
    });

    const blob = new Blob([mergedBytes], { type: 'application/pdf' });
    const verifyDoc = await loadPdfJsDocument(mergedBytes);

    mergedResult = {
      blob,
      pageCount: verifyDoc.numPages,
      size: (blob.size / 1024 / 1024).toFixed(2) + ' MB'
    };

    isProcessing = false;
    render();

    // Trigger immediate download
    const filename = `PDFToolkit_Merged_${Date.now()}.pdf`;
    downloadFile(blob, filename);

    if (activeCtx) {
      activeCtx.showToast(t('tools.merge.successTitle'), 'success');
    }
  } catch (err) {
    isProcessing = false;
    render();
    if (activeCtx) {
      activeCtx.showToast(err.message || 'Gagal menggabungkan PDF', 'error');
    }
  }
}

function updateProgressBar(pct) {
  const bar = document.getElementById('merge-progress-fill');
  const label = document.getElementById('merge-progress-label');
  if (bar) bar.style.width = `${pct}%`;
  if (label) label.textContent = `${pct}%`;
}

function render() {
  if (!activeContainer) return;

  const totalPages = fileList.reduce((acc, f) => {
    return typeof f.pageCount === 'number' ? acc + f.pageCount : acc;
  }, 0);

  activeContainer.innerHTML = `
    <div class="tool-workspace merge-workspace">
      ${fileList.length === 0 ? renderEmptyState() : renderFileListState(totalPages)}
    </div>
  `;

  bindDomEvents();
}

function renderEmptyState() {
  return `
    <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
      <div style="width: 56px; height: 56px; margin: 0 auto 1rem; color: var(--accent-primary); background: var(--accent-primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        ${icon}
      </div>
      <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
        ${t('tools.merge.title')}
      </p>
      <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
        ${t('tools.merge.emptyPrompt')}
      </p>
    </div>
  `;
}

function renderFileListState(totalPages) {
  return `
    <!-- Merge Toolbar -->
    <div class="merge-toolbar">
      <div class="merge-stats">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        </svg>
        <span>${t('tools.merge.stats', { fileCount: fileList.length, pageCount: totalPages || '?' })}</span>
      </div>

      <div style="display: flex; gap: 0.65rem;">
        <button class="btn-control" id="btn-merge-clear">
          ${t('tools.merge.clearAll')}
        </button>
        <button class="btn-upload" id="btn-merge-action" ${isProcessing ? 'disabled' : ''}>
          ${isProcessing ? t('tools.merge.merging') : t('tools.merge.actionButton', { count: fileList.length })}
        </button>
      </div>
    </div>

    <!-- Progress Bar (shown when merging) -->
    ${isProcessing ? `
      <div style="margin: 0.5rem 0;">
        <div style="display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 600; margin-bottom: 0.35rem;">
          <span>${t('tools.merge.merging')}</span>
          <span id="merge-progress-label">${progressValue}%</span>
        </div>
        <div class="merge-progress-wrapper">
          <div class="merge-progress-bar" id="merge-progress-fill" style="width: ${progressValue}%;"></div>
        </div>
      </div>
    ` : ''}

    <!-- Success Result Banner -->
    ${mergedResult ? `
      <div class="merge-result-card">
        <div>
          <div style="font-weight: 700; color: var(--accent-success); font-size: 1.05rem; margin-bottom: 0.2rem;">
            ${t('tools.merge.successTitle')}
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">
            ${t('tools.merge.successDesc', { pageCount: mergedResult.pageCount, fileSize: mergedResult.size })}
          </div>
        </div>
        <button class="btn-upload" id="btn-download-again">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>${t('common.download')}</span>
        </button>
      </div>
    ` : ''}

    <!-- File Cards List -->
    <div class="merge-file-list" id="merge-cards-container">
      ${fileList.map((item, index) => `
        <div class="merge-card" draggable="true" data-index="${index}">
          <div class="merge-drag-handle" title="Tarik untuk mengubah urutan">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
              <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
            </svg>
          </div>

          <div class="merge-thumb-box">
            ${item.thumbnail ? `<img src="${item.thumbnail}" alt="Thumbnail" />` : `
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" color="var(--text-muted)">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            `}
          </div>

          <div class="merge-card-details">
            <div class="merge-card-title" title="${item.name}">${item.name}</div>
            <div class="merge-card-meta">
              <span>${(item.size / 1024 / 1024).toFixed(2)} MB</span>
              <span>•</span>
              <span style="font-weight: 600; color: ${item.isEncrypted ? 'var(--accent-warning)' : 'var(--accent-primary)'};">
                ${item.isEncrypted ? 'Terkunci Password' : t('tools.merge.pagesLabel', { count: item.pageCount })}
              </span>
            </div>

            ${item.isEncrypted ? `
              <div class="password-box">
                <input type="password" id="pass-${item.id}" class="input-password" placeholder="Password..." />
                <button class="btn-control" style="padding: 0.35rem 0.65rem;" onclick="window.__unlockMergeFile(${index})">
                  ${t('tools.merge.unlockBtn')}
                </button>
              </div>
            ` : ''}

            ${item.error ? `
              <div style="color: var(--accent-danger); font-size: 0.75rem; margin-top: 0.25rem;">
                ${item.error}
              </div>
            ` : ''}
          </div>

          <div class="merge-card-actions">
            <button class="btn-icon-action" title="Geser ke Atas" onclick="window.__moveMergeFile(${index}, ${index - 1})" ${index === 0 ? 'disabled' : ''}>
              ▲
            </button>
            <button class="btn-icon-action" title="Geser ke Bawah" onclick="window.__moveMergeFile(${index}, ${index + 1})" ${index === fileList.length - 1 ? 'disabled' : ''}>
              ▼
            </button>
            <button class="btn-icon-action danger" title="Hapus Berkas" onclick="window.__removeMergeFile(${index})">
              &times;
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function bindDomEvents() {
  document.getElementById('btn-merge-clear')?.addEventListener('click', () => {
    fileList = [];
    mergedResult = null;
    render();
  });

  document.getElementById('btn-merge-action')?.addEventListener('click', handleMerge);

  document.getElementById('btn-download-again')?.addEventListener('click', () => {
    if (mergedResult && mergedResult.blob) {
      downloadFile(mergedResult.blob, `PDFToolkit_Merged_${Date.now()}.pdf`);
    }
  });

  // Drag and Drop ordering handlers
  const cards = activeContainer.querySelectorAll('.merge-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedIndex = parseInt(card.getAttribute('data-index'), 10);
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
      if (draggedIndex !== null && targetIndex !== draggedIndex) {
        moveFile(draggedIndex, targetIndex);
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedIndex = null;
    });
  });
}

// Global UI bridges (safely guarded for non-browser/test environments)
if (typeof window !== 'undefined') {
  window.__unlockMergeFile = (index) => unlockFile(index);
  window.__removeMergeFile = (index) => removeFile(index);
  window.__moveMergeFile = (from, to) => moveFile(from, to);
}
