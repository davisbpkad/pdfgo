/**
 * image-to-pdf.js - Gambar ke PDF Module
 * Converts PNG, JPEG, and WebP images to a standardized PDF.
 * Supports A4 / Letter / Fit Image, auto-orientation, margins, and contain/cover fit modes.
 */

import { PDFDocument, PageSizes } from 'pdf-lib';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'image-to-pdf';
export const titleKey = 'tools.imageToPdf.title';
export const descKey = 'tools.imageToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m18 18-3-3-4 4"/></svg>`;

// Re-export pure logic from atomic feature files
export { convertImageToPngBuffer } from '../features/image-to-pdf/logic/convertImageToPngBuffer.js';
export { buildPdfFromImages } from '../features/image-to-pdf/logic/buildPdfFromImages.js';

// ============================================================================
// UI Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let imageList = []; // Array of { id, file, name, size, type, buffer, thumbUrl, rotation }
let pageSizeChoice = 'A4';
let orientationChoice = 'auto';
let marginChoice = 20;
let fitModeChoice = 'contain';
let isConverting = false;
let draggedImageIndex = null;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;

  if (ctx && ctx.queue && imageList.length === 0) {
    const queueImages = ctx.queue.getItems()
      .filter(i => /\.(png|jpe?g|webp)$/i.test(i.name))
      .map(i => i.file);
    if (queueImages.length > 0) {
      processIncomingImages(queueImages);
    }
  }

  render();
}

export function onFiles(files) {
  processIncomingImages(files);
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
  imageList = [];
  isConverting = false;
}

async function processIncomingImages(files) {
  const validFiles = Array.from(files).filter(f => /\.(png|jpe?g|webp)$/i.test(f.name));
  if (validFiles.length === 0) return;

  for (const file of validFiles) {
    const id = 'img_' + Math.random().toString(36).substring(2, 9);
    const item = {
      id,
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'image/png',
      buffer: null,
      thumbUrl: URL.createObjectURL(file),
      rotation: 0
    };

    imageList.push(item);
    render();

    // Prepare buffer
    try {
      if (file.type.includes('webp') || file.name.toLowerCase().endsWith('.webp')) {
        item.buffer = await convertImageToPngBuffer(file);
        item.type = 'image/png';
      } else {
        item.buffer = await file.arrayBuffer();
      }
    } catch (err) {
      console.warn('Failed to load image buffer:', file.name, err);
    }
  }

  render();
}

function removeImage(index) {
  if (imageList[index]) {
    if (imageList[index].thumbUrl) {
      URL.revokeObjectURL(imageList[index].thumbUrl);
    }
    imageList.splice(index, 1);
    render();
  }
}

function moveImage(fromIndex, toIndex) {
  if (fromIndex < 0 || fromIndex >= imageList.length || toIndex < 0 || toIndex >= imageList.length) return;
  const [moved] = imageList.splice(fromIndex, 1);
  imageList.splice(toIndex, 0, moved);
  render();
}

async function handleGeneratePdf() {
  if (imageList.length === 0) {
    if (activeCtx) activeCtx.showToast('Tambahkan minimal 1 gambar.', 'error');
    return;
  }

  isConverting = true;
  render();

  try {
    const items = imageList.map(item => ({
      buffer: item.buffer,
      type: item.type,
      rotation: item.rotation
    }));

    const pdfBytes = await buildPdfFromImages(items, {
      pageSize: pageSizeChoice,
      orientation: orientationChoice,
      margin: marginChoice,
      fitMode: fitModeChoice
    });

    const filename = `PDFToolkit_Images_${Date.now()}.pdf`;
    downloadFile(pdfBytes, filename);

    if (activeCtx) activeCtx.showToast('Dokumen PDF berhasil dibuat!', 'success');
  } catch (err) {
    if (activeCtx) activeCtx.showToast(err.message || 'Gagal membuat PDF', 'error');
  } finally {
    isConverting = false;
    render();
  }
}

function render() {
  if (!activeContainer) return;

  if (imageList.length === 0) {
    activeContainer.innerHTML = `
      <div class="tool-workspace">
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 1rem; color: var(--accent-primary); background: var(--accent-primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${icon}
          </div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${t('tools.imageToPdf.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.imageToPdf.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Options Bar -->
      <div class="form-row">
        <!-- Page Size -->
        <div class="form-group">
          <label class="form-label">${t('tools.imageToPdf.pageSizeLabel')}</label>
          <select id="select-page-size" class="form-select">
            <option value="A4" ${pageSizeChoice === 'A4' ? 'selected' : ''}>A4 (Standar)</option>
            <option value="LETTER" ${pageSizeChoice === 'LETTER' ? 'selected' : ''}>US Letter</option>
            <option value="FIT" ${pageSizeChoice === 'FIT' ? 'selected' : ''}>${t('tools.imageToPdf.pageFit')}</option>
          </select>
        </div>

        <!-- Orientation -->
        <div class="form-group">
          <label class="form-label">${t('tools.imageToPdf.orientationLabel')}</label>
          <select id="select-orientation" class="form-select">
            <option value="auto" ${orientationChoice === 'auto' ? 'selected' : ''}>${t('tools.imageToPdf.orientAuto')}</option>
            <option value="portrait" ${orientationChoice === 'portrait' ? 'selected' : ''}>${t('tools.imageToPdf.orientPortrait')}</option>
            <option value="landscape" ${orientationChoice === 'landscape' ? 'selected' : ''}>${t('tools.imageToPdf.orientLandscape')}</option>
          </select>
        </div>

        <!-- Margin -->
        <div class="form-group">
          <label class="form-label">${t('tools.imageToPdf.marginLabel')}</label>
          <select id="select-margin" class="form-select">
            <option value="0" ${marginChoice === 0 ? 'selected' : ''}>${t('tools.imageToPdf.marginNone')}</option>
            <option value="15" ${marginChoice === 15 ? 'selected' : ''}>${t('tools.imageToPdf.marginSmall')}</option>
            <option value="30" ${marginChoice === 30 ? 'selected' : ''}>${t('tools.imageToPdf.marginNormal')}</option>
          </select>
        </div>

        <!-- Fit Mode -->
        <div class="form-group">
          <label class="form-label">${t('tools.imageToPdf.fitModeLabel')}</label>
          <select id="select-fit-mode" class="form-select">
            <option value="contain" ${fitModeChoice === 'contain' ? 'selected' : ''}>${t('tools.imageToPdf.fitContain')}</option>
            <option value="cover" ${fitModeChoice === 'cover' ? 'selected' : ''}>${t('tools.imageToPdf.fitCover')}</option>
          </select>
        </div>
      </div>

      <!-- Action & Counter -->
      <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 0.5rem; border-top: 1px solid var(--border-light);">
        <span style="font-weight: 600; color: var(--text-secondary); font-size: 0.9rem;">
          ${imageList.length} gambar terpilih
        </span>
        <button class="btn-upload" id="btn-create-pdf" ${isConverting ? 'disabled' : ''}>
          ${isConverting ? 'Membuat PDF...' : t('tools.imageToPdf.actionCreate', { count: imageList.length })}
        </button>
      </div>

      <!-- Image Grid -->
      <div class="image-grid" id="image-grid-container">
        ${imageList.map((img, index) => `
          <div class="image-item-card" draggable="true" data-index="${index}">
            <div class="image-thumb-box">
              <img src="${img.thumbUrl}" alt="${img.name}" />
            </div>
            <div class="image-item-name" title="${img.name}">${img.name}</div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.35rem;">
              <span style="font-size: 0.7rem; color: var(--text-muted);">${(img.size / 1024).toFixed(0)} KB</span>
              <button class="btn-icon-action danger" style="width: 24px; height: 24px; font-size: 0.75rem;" onclick="window.__removeImageItem(${index})">
                &times;
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('select-page-size')?.addEventListener('change', (e) => {
    pageSizeChoice = e.target.value;
  });

  document.getElementById('select-orientation')?.addEventListener('change', (e) => {
    orientationChoice = e.target.value;
  });

  document.getElementById('select-margin')?.addEventListener('change', (e) => {
    marginChoice = parseInt(e.target.value, 10);
  });

  document.getElementById('select-fit-mode')?.addEventListener('change', (e) => {
    fitModeChoice = e.target.value;
  });

  document.getElementById('btn-create-pdf')?.addEventListener('click', handleGeneratePdf);

  // Drag and drop grid ordering
  const cards = activeContainer.querySelectorAll('.image-item-card');
  cards.forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedImageIndex = parseInt(card.getAttribute('data-index'), 10);
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
      if (draggedImageIndex !== null && targetIndex !== draggedImageIndex) {
        moveImage(draggedImageIndex, targetIndex);
      }
    });

    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedImageIndex = null;
    });
  });
}

// Global UI bridges
if (typeof window !== 'undefined') {
  window.__removeImageItem = (idx) => removeImage(idx);
}
