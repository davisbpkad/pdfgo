/**
 * ocr.js - Module definition
 */
import { t } from '../core/i18n.js';

export const id = 'ocr';
export const titleKey = 'tools.ocr.title';
export const descKey = 'tools.ocr.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3"/><path d="M20 7V4h-3"/><path d="M4 17v3h3"/><path d="M20 17v3h-3"/><line x1="9" x2="15" y1="10" y2="10"/><line x1="12" x2="12" y1="10" y2="14"/></svg>`;

let activeContainer = null;
let activeCtx = null;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;
  render();
}

function render() {
  if (!activeContainer) return;
  activeContainer.innerHTML = `
    <div class="tool-workspace">
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">${t('tools.ocr.title')}</p>
        <p style="font-size: 0.9rem; color: var(--text-muted);">${t('tools.ocr.desc')}</p>
        <div style="margin-top: 1.5rem; display: inline-block; padding: 0.5rem 1rem; background: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; border: 1px dashed var(--border-strong);">
          ${t('common.readyPlaceholder')}
        </div>
      </div>
    </div>
  `;
}

export function onFiles(files) {
  console.log('ocr onFiles:', files ? files.length : 0);
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
}
