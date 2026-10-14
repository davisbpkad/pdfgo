/**
 * extract-text.js - Ekstrak Teks Module
 * 100% Client-side extraction via PDF.js getTextContent with natural reading order.
 * UTF-8 text download, word count statistics, scanned PDF detection & OCR suggestion.
 */

import { loadPdfJsDocument } from '../core/pdf.js';
import { downloadFile } from '../core/download.js';
import { t } from '../core/i18n.js';

export const id = 'extract-text';
export const titleKey = 'tools.extractText.title';
export const descKey = 'tools.extractText.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`;

// Re-export pure logic from atomic feature file
export { extractTextContent } from '../features/extract-text/logic/extractTextContent.js';

// ============================================================================
// UI Controller
// ============================================================================
let activeContainer = null;
let activeCtx = null;
let activeFile = null;
let extractedData = null;
let isProcessing = false;
let includeSeparators = true;

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
  extractedData = null;
  isProcessing = false;
}

async function loadDocument(file) {
  activeFile = file;
  isProcessing = true;
  extractedData = null;
  render();

  try {
    const buffer = await file.arrayBuffer();
    const docProxy = await loadPdfJsDocument(buffer);
    extractedData = await extractTextContent(docProxy, includeSeparators);
  } catch (err) {
    if (activeCtx) activeCtx.showToast('Gagal mengekstrak teks: ' + (err.message || ''), 'error');
  } finally {
    isProcessing = false;
    render();
  }
}

function handleCopy() {
  if (!extractedData) return;
  const textarea = document.getElementById('extract-output-area');
  const text = textarea ? textarea.value : extractedData.fullText;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      if (activeCtx) activeCtx.showToast(t('tools.extractText.copied'), 'success');
    });
  }
}

function handleDownloadTxt() {
  if (!extractedData || !activeFile) return;
  const textarea = document.getElementById('extract-output-area');
  const text = textarea ? textarea.value : extractedData.fullText;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const filename = `${activeFile.name.replace(/\.pdf$/i, '')}_teks.txt`;
  downloadFile(blob, filename, 'text/plain');
}

function render() {
  if (!activeContainer) return;

  if (!activeFile && !isProcessing) {
    activeContainer.innerHTML = `
      <div class="tool-workspace">
        <div style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
          <div style="width: 56px; height: 56px; margin: 0 auto 1rem; color: var(--accent-primary); background: var(--accent-primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
            ${icon}
          </div>
          <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
            ${t('tools.extractText.title')}
          </p>
          <p style="font-size: 0.9rem; max-width: 480px; margin: 0 auto;">
            ${t('tools.extractText.emptyPrompt')}
          </p>
        </div>
      </div>
    `;
    return;
  }

  if (isProcessing) {
    activeContainer.innerHTML = `
      <div class="tool-workspace" style="text-align: center; padding: 3rem 1rem;">
        <p style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
          Sedang mengekstrak teks dari "${activeFile ? activeFile.name : ''}"...
        </p>
        <div class="merge-progress-wrapper" style="max-width: 400px; margin: 1rem auto;">
          <div class="merge-progress-bar" style="width: 100%; animation: pulse-dot 1.5s infinite;"></div>
        </div>
      </div>
    `;
    return;
  }

  activeContainer.innerHTML = `
    <div class="tool-workspace" style="display: flex; flex-direction: column; gap: 1.25rem;">
      <!-- Stats & Options Bar -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-light);">
        <div class="extract-stats-bar">
          ${t('tools.extractText.stats', {
            words: extractedData ? extractedData.wordCount : 0,
            chars: extractedData ? extractedData.charCount : 0,
            pages: extractedData ? extractedData.pageTexts.length : 0
          })}
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <label style="display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; cursor: pointer;">
            <input type="checkbox" id="chk-include-separators" ${includeSeparators ? 'checked' : ''} />
            <span>${t('tools.extractText.includeSeparators')}</span>
          </label>
        </div>
      </div>

      <!-- Scanned PDF Warning Banner -->
      ${extractedData && extractedData.isScanned ? `
        <div style="background-color: var(--accent-warning-light); border: 1px solid rgba(217, 119, 6, 0.3); border-radius: var(--radius-md); padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
          <div style="font-size: 0.9rem; color: var(--text-primary);">
            ⚠️ <strong>Perhatian:</strong> ${t('tools.extractText.scannedWarning')}
          </div>
          <button class="btn-control" style="background: var(--bg-surface); font-weight: 600; white-space: nowrap;" onclick="window.location.hash='ocr'">
            ${t('tools.extractText.openOcr')}
          </button>
        </div>
      ` : ''}

      <!-- Textarea Output -->
      <div>
        <textarea id="extract-output-area" class="extract-textarea" spellcheck="false">${extractedData ? extractedData.fullText : ''}</textarea>
      </div>

      <!-- Actions -->
      <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
        <button class="btn-control" id="btn-extract-copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
          </svg>
          <span>${t('tools.extractText.copyText')}</span>
        </button>
        <button class="btn-upload" id="btn-extract-download">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>${t('tools.extractText.downloadTxt')}</span>
        </button>
      </div>
    </div>
  `;

  bindEvents();
}

function bindEvents() {
  document.getElementById('chk-include-separators')?.addEventListener('change', (e) => {
    includeSeparators = e.target.checked;
    if (activeFile) loadDocument(activeFile);
  });

  document.getElementById('btn-extract-copy')?.addEventListener('click', handleCopy);
  document.getElementById('btn-extract-download')?.addEventListener('click', handleDownloadTxt);
}
