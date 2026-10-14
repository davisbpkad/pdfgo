/**
 * main.js - Master Application Shell, Router & State Coordinator
 * 100% Client-Side, Zero Network, Clean Code
 */

import { allModules, moduleMap } from './modules/index.js';
import { t, getLang, setLang, subscribeLang } from './core/i18n.js';
import { initTheme, getTheme, cycleTheme, subscribeTheme } from './core/theme.js';
import { queue } from './core/queue.js';
import { initPdfJsWorker } from './core/workers.js';
import { loadPdfJsDocument } from './core/pdf.js';
import { createZipArchive } from './core/zip.js';
import { downloadFile } from './core/download.js';
import { compressPdfDocument } from './modules/compress.js';
import { applyWatermark } from './modules/watermark.js';
import { applyPageNumbers } from './modules/page-numbers.js';
import { extractTextContent } from './modules/extract-text.js';

// Global application state
let currentModuleId = 'merge';
let activeModule = null;
let queueDrawerOpen = false;

// Toast helper
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, 3500);
}

// Module router
function switchModule(moduleId) {
  const mod = moduleMap.get(moduleId);
  if (!mod) return;

  if (activeModule && typeof activeModule.destroy === 'function') {
    activeModule.destroy();
  }

  currentModuleId = moduleId;
  activeModule = mod;
  window.location.hash = moduleId;

  renderActiveTool();
  updateSidebarActiveState();
}

function renderShell() {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="app-header">
      <div class="brand-wrapper" id="brand-home">
        <div class="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div>
          <span class="brand-title" id="txt-app-name">${t('app.name')}</span>
          <span class="brand-badge" id="txt-app-badge">${(!window.__OCR_FULL_ENG_GZ_BASE64__) ? (getLang() === 'id' ? 'OFFLINE LITE' : 'LITE OFFLINE') : t('app.badge')}</span>
        </div>
      </div>

      <div class="header-center">
        <div class="offline-badge" id="txt-offline-banner">
          <span class="offline-dot"></span>
          <span>${t('app.offlineBanner')}</span>
        </div>
      </div>

      <div class="header-actions">
        <!-- Language Switcher -->
        <button class="btn-control" id="btn-toggle-lang" aria-label="Ganti Bahasa">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" x2="22" y1="12" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          <span id="txt-lang-label">${getLang().toUpperCase()}</span>
        </button>

        <!-- Theme Toggle -->
        <button class="btn-control" id="btn-toggle-theme" aria-label="Ganti Tema">
          <svg id="theme-icon-sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>

        <!-- Queue Drawer Toggle -->
        <button class="btn-control" id="btn-toggle-queue" aria-label="Buka Antrean File">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          <span class="queue-badge-count" id="header-queue-count">0</span>
        </button>

        <!-- Mobile Menu Toggle Button -->
        <button class="btn-control btn-mobile-menu" id="btn-toggle-menu" aria-label="Menu Alat">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>
    </header>

    <div class="app-container">
      <!-- Mobile Sidebar Backdrop -->
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>

      <!-- Sidebar Navigation -->
      <nav class="app-sidebar" id="app-sidebar" aria-label="Navigasi Alat">
        <div class="sidebar-mobile-header">
          <div class="sidebar-mobile-brand">
            <span class="brand-title">${t('app.name')}</span>
          </div>
          <button class="btn-control" id="btn-close-sidebar" aria-label="Tutup Menu">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="sidebar-section-title" id="txt-nav-title">${t('nav.categoryAll')}</div>
        <ul class="sidebar-nav-list" id="sidebar-nav-list">
          ${allModules.map(m => `
            <li>
              <button class="nav-item-btn ${m.id === currentModuleId ? 'active' : ''}" data-tool="${m.id}">
                <span class="nav-item-icon">${m.icon}</span>
                <span class="nav-item-text">${t(m.titleKey)}</span>
              </button>
            </li>
          `).join('')}
        </ul>
      </nav>

      <!-- Main Workspace -->
      <main class="app-main" id="app-main-viewport">
        <div class="content-wrapper">
          <!-- Active Tool Header -->
          <div class="tool-header-card" id="tool-header-card">
            <div class="tool-title-wrapper">
              <div class="tool-header-icon" id="tool-active-icon"></div>
              <div class="tool-header-info">
                <h1 id="tool-active-title"></h1>
                <p id="tool-active-desc"></p>
              </div>
            </div>
          </div>

          <!-- Dropzone -->
          <div class="dropzone-container" id="dropzone" tabindex="0" role="button" aria-label="Dropzone upload file">
            <input type="file" id="file-input" multiple accept=".pdf,image/png,image/jpeg,image/webp" style="display: none;" />
            <div class="dropzone-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p class="dropzone-title" id="txt-dropzone-title">${t('dropzone.title')}</p>
              <p class="dropzone-subtitle" id="txt-dropzone-subtitle">${t('dropzone.subtitle')}</p>
            </div>
            <button class="btn-upload" type="button" id="btn-browse-files">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              <span id="txt-dropzone-btn">${t('dropzone.button')}</span>
            </button>
          </div>

          <!-- Active Tool Dynamic Container -->
          <div id="module-container"></div>
        </div>
      </main>
    </div>

    <!-- Batch Queue Drawer -->
    <div class="queue-drawer-overlay" id="queue-overlay"></div>
    <aside class="queue-drawer" id="queue-drawer" aria-label="Panel Antrean Berkas">
      <div class="queue-header">
        <span class="queue-title" id="txt-queue-title">${t('queue.title')}</span>
        <button class="btn-control" id="btn-close-queue" aria-label="Tutup Antrean">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div class="queue-list" id="queue-list-container">
        <!-- Rendered reactively from queue state -->
      </div>

      <div class="queue-footer" style="display: flex; flex-direction: column; gap: 0.75rem;">
        <button class="btn-upload" id="btn-queue-process-batch" style="width: 100%; justify-content: center;">
          ${t('queue.processBatch', { tool: t(activeModule?.titleKey || 'nav.categoryAll') })}
        </button>
        <div style="display: flex; gap: 0.75rem; width: 100%;">
          <button class="btn-control" id="btn-queue-clear" style="flex: 1;">
            ${t('queue.clearAll')}
          </button>
          <button class="btn-control" id="btn-queue-download-all" style="flex: 2; justify-content: center; font-weight: 600;">
            ${t('queue.downloadAll')}
          </button>
        </div>
      </div>
    </aside>

    <!-- Global Toast Container -->
    <div id="toast-container" aria-live="polite"></div>
  `;

  bindEvents();
}

function bindEvents() {
  // Brand click -> defaults to merge
  document.getElementById('brand-home')?.addEventListener('click', () => switchModule('merge'));

  // Language toggle
  document.getElementById('btn-toggle-lang')?.addEventListener('click', () => {
    const nextLang = getLang() === 'id' ? 'en' : 'id';
    setLang(nextLang);
  });

  // Theme toggle
  document.getElementById('btn-toggle-theme')?.addEventListener('click', () => {
    cycleTheme();
  });

  // Queue drawer toggle
  document.getElementById('btn-toggle-queue')?.addEventListener('click', toggleQueueDrawer);
  document.getElementById('btn-close-queue')?.addEventListener('click', toggleQueueDrawer);
  document.getElementById('queue-overlay')?.addEventListener('click', toggleQueueDrawer);

  // Clear queue
  document.getElementById('btn-queue-clear')?.addEventListener('click', () => {
    queue.clear();
    showToast(getLang() === 'id' ? 'Antrean dikosongkan.' : 'Queue cleared.', 'info');
  });

  // Batch process queue with active tool
  document.getElementById('btn-queue-process-batch')?.addEventListener('click', executeBatchProcessing);

  // Download all as ZIP
  document.getElementById('btn-queue-download-all')?.addEventListener('click', async () => {
    const items = queue.getItems().filter(i => i.result);
    if (items.length === 0) {
      showToast(getLang() === 'id' ? 'Belum ada hasil yang selesai diproses.' : 'No processed results available.', 'error');
      return;
    }
    try {
      showToast(getLang() === 'id' ? 'Mengemas berkas ke ZIP...' : 'Packaging files into ZIP...', 'info');
      const zipBlob = await createZipArchive(items.map(i => ({ name: i.name, data: i.result })));
      downloadFile(zipBlob, `PDFToolkit_Batch_${Date.now()}.zip`, 'application/zip');
    } catch (err) {
      showToast(err.message || 'Gagal membuat ZIP', 'error');
    }
  });

  // Mobile sidebar navigation
  const sidebar = document.getElementById('app-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const toggleMobileSidebar = (forceClose = false) => {
    if (!sidebar) return;
    const shouldOpen = forceClose ? false : !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', shouldOpen);
    sidebarBackdrop?.classList.toggle('active', shouldOpen);
  };

  document.getElementById('btn-toggle-menu')?.addEventListener('click', () => toggleMobileSidebar());
  document.getElementById('btn-close-sidebar')?.addEventListener('click', () => toggleMobileSidebar(true));
  sidebarBackdrop?.addEventListener('click', () => toggleMobileSidebar(true));

  // Global Escape key accessibility listener
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (queueDrawerOpen) toggleQueueDrawer();
      toggleMobileSidebar(true);
    }
  });

  // Sidebar tool buttons
  const navButtons = document.querySelectorAll('.nav-item-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.getAttribute('data-tool');
      if (toolId) {
        switchModule(toolId);
        toggleMobileSidebar(true);
      }
    });
  });

  // Dropzone setup
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const browseBtn = document.getElementById('btn-browse-files');

  browseBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput?.click();
  });

  dropzone?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
      fileInput.value = ''; // Reset
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone?.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone?.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      handleFiles(dt.files);
    }
  });
}

function handleFiles(files) {
  const added = queue.addFiles(files);
  if (added > 0) {
    showToast(
      getLang() === 'id' ? `${added} berkas ditambahkan ke antrean.` : `${added} files added to queue.`,
      'success'
    );
  }

  // Pass files to active module
  if (activeModule && typeof activeModule.onFiles === 'function') {
    activeModule.onFiles(files);
  }
}

function renderActiveTool() {
  if (!activeModule) return;

  const iconEl = document.getElementById('tool-active-icon');
  const titleEl = document.getElementById('tool-active-title');
  const descEl = document.getElementById('tool-active-desc');
  const container = document.getElementById('module-container');

  if (iconEl) iconEl.innerHTML = activeModule.icon;
  if (titleEl) titleEl.textContent = t(activeModule.titleKey);
  if (descEl) descEl.textContent = t(activeModule.descKey);

  if (container) {
    const ctx = {
      queue,
      t,
      getLang,
      showToast,
      openQueueDrawer: () => {
        if (!queueDrawerOpen) toggleQueueDrawer();
      }
    };
    activeModule.init(container, ctx);
  }
}

function updateSidebarActiveState() {
  const buttons = document.querySelectorAll('.nav-item-btn');
  buttons.forEach(btn => {
    const toolId = btn.getAttribute('data-tool');
    if (toolId === currentModuleId) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function toggleQueueDrawer() {
  queueDrawerOpen = !queueDrawerOpen;
  const drawer = document.getElementById('queue-drawer');
  const overlay = document.getElementById('queue-overlay');
  if (drawer && overlay) {
    if (queueDrawerOpen) {
      drawer.classList.add('open');
      overlay.classList.add('open');
    } else {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
    }
  }
}

async function executeBatchProcessing() {
  const items = queue.getItems();
  if (items.length === 0) {
    showToast(t('queue.empty'), 'warning');
    return;
  }

  // Aggregator tools (Merge, Image to PDF, Organize): pass all files directly
  if (['merge', 'image-to-pdf', 'organize'].includes(currentModuleId)) {
    if (activeModule && typeof activeModule.onFiles === 'function') {
      activeModule.onFiles(items.map(i => i.file));
      showToast(t('queue.notPerDoc', { tool: t(activeModule.titleKey) }), 'info');
      toggleQueueDrawer();
    }
    return;
  }

  // Per-document tool: sequential execution with isolated error boundaries
  queue.isProcessing = true;
  queue._notify();

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < items.length; i++) {
    if (queue.cancelRequested) break;
    const item = items[i];
    if (item.status === 'done' && item.result) {
      successCount++;
      continue;
    }

    queue.updateItem(item.id, { status: 'processing', progress: 15 });

    try {
      const buffer = await item.file.arrayBuffer();
      let outputBlob = null;

      if (currentModuleId === 'compress') {
        const proxy = await loadPdfJsDocument(buffer);
        const res = await compressPdfDocument(buffer, proxy, { dpiScale: 1.5, quality: 0.70 });
        outputBlob = new Blob([res.bytes], { type: 'application/pdf' });
      } else if (currentModuleId === 'watermark') {
        const resBytes = await applyWatermark(buffer, { text: 'CONFIDENTIAL', position: 'diagonal', opacity: 0.25 });
        outputBlob = new Blob([resBytes], { type: 'application/pdf' });
      } else if (currentModuleId === 'page-numbers') {
        const resBytes = await applyPageNumbers(buffer, { format: 'Halaman {n} dari {total}' });
        outputBlob = new Blob([resBytes], { type: 'application/pdf' });
      } else if (currentModuleId === 'extract-text' || currentModuleId === 'ocr') {
        const proxy = await loadPdfJsDocument(buffer);
        const res = await extractTextContent(proxy, true);
        outputBlob = new Blob([res.fullText], { type: 'text/plain;charset=utf-8' });
      } else {
        outputBlob = item.file;
      }

      queue.updateItem(item.id, {
        status: 'done',
        progress: 100,
        result: outputBlob
      });
      successCount++;
    } catch (err) {
      console.error(`Batch processing failed for ${item.name}:`, err);
      queue.updateItem(item.id, {
        status: 'error',
        progress: 0,
        error: err.message || 'Error processing file'
      });
      failCount++;
    }
  }

  queue.isProcessing = false;
  queue.cancelRequested = false;
  queue._notify();

  showToast(
    t('queue.batchCompleted', { success: successCount, failed: failCount }),
    successCount > 0 ? 'success' : 'error'
  );
}

function updateQueueUi(state) {
  const countBadge = document.getElementById('header-queue-count');
  if (countBadge) {
    countBadge.textContent = state.count;
  }

  const listContainer = document.getElementById('queue-list-container');
  if (!listContainer) return;

  if (state.items.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; color: var(--text-muted); padding: 3rem 1rem; font-size: 0.9rem;">
        ${t('queue.empty')}
      </div>
    `;
    return;
  }

  listContainer.innerHTML = state.items.map(item => `
    <div class="queue-item" data-id="${item.id}">
      <div class="queue-item-header">
        <span class="queue-item-name" title="${item.name}">${item.name}</span>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          ${item.status === 'done' && item.result ? `
            <button class="btn-control" style="padding: 0.2rem 0.5rem; font-size: 0.8rem; color: var(--accent-success);" onclick="window.__downloadQueueItem('${item.id}')" title="${t('queue.downloadSingle')}">
              ↓
            </button>
          ` : ''}
          <button class="btn-control" style="padding: 0.2rem 0.4rem; font-size: 0.75rem;" onclick="window.__removeQueueItem('${item.id}')">
            &times;
          </button>
        </div>
      </div>
      <div class="queue-item-meta">
        ${(item.size / 1024 / 1024).toFixed(2)} MB • <span style="font-weight: 600; color: ${item.status === 'done' ? 'var(--accent-success)' : (item.status === 'error' ? 'var(--accent-danger)' : 'var(--text-secondary)')};">${t('queue.status' + item.status.charAt(0).toUpperCase() + item.status.slice(1))}</span>
        ${item.error ? `<div style="color: var(--accent-danger); font-size: 0.7rem; margin-top: 0.2rem;">${item.error}</div>` : ''}
      </div>
    </div>
  `).join('');
}

// Global removal bridge
window.__removeQueueItem = (id) => {
  queue.removeItem(id);
};

// Global individual download bridge
window.__downloadQueueItem = (id) => {
  const item = queue.getItems().find(i => i.id === id);
  if (item && item.result) {
    const ext = item.result.type === 'text/plain' ? '.txt' : '.pdf';
    const base = item.name.replace(/\.[^/.]+$/, '');
    downloadFile(item.result, `${base}-processed${ext}`, item.result.type);
  }
};

// Listeners
subscribeLang(() => {
  renderShell();
  switchModule(currentModuleId);
});

queue.subscribe(updateQueueUi);

// Application Initialization
export function initApp() {
  initTheme();
  initPdfJsWorker();

  // Hash-based routing
  const hash = window.location.hash.replace('#', '');
  if (hash && moduleMap.has(hash)) {
    currentModuleId = hash;
  }

  renderShell();
  switchModule(currentModuleId);
}

// Bootstrap on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
