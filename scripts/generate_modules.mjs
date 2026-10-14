import fs from 'fs';
import path from 'path';

const tools = [
  { id: 'split', titleKey: 'tools.split.title', descKey: 'tools.split.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8"/><path d="M9 18l3 4 3-4"/><path d="m14 10 7-7"/><path d="m3 3 7 7"/></svg>' },
  { id: 'organize', titleKey: 'tools.organize.title', descKey: 'tools.organize.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>' },
  { id: 'sign', titleKey: 'tools.sign.title', descKey: 'tools.sign.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/></svg>' },
  { id: 'form', titleKey: 'tools.form.title', descKey: 'tools.form.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>' },
  { id: 'redact', titleKey: 'tools.redact.title', descKey: 'tools.redact.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m3 3 18 18"/><path d="M9 3v18"/></svg>' },
  { id: 'compress', titleKey: 'tools.compress.title', descKey: 'tools.compress.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m4 14 8-8 8 8"/><path d="M12 6v12"/><path d="M4 20h16"/></svg>' },
  { id: 'ocr', titleKey: 'tools.ocr.title', descKey: 'tools.ocr.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7V4h3"/><path d="M20 7V4h-3"/><path d="M4 17v3h3"/><path d="M20 17v3h-3"/><line x1="9" x2="15" y1="10" y2="10"/><line x1="12" x2="12" y1="10" y2="14"/></svg>' },
  { id: 'extract-text', titleKey: 'tools.extractText.title', descKey: 'tools.extractText.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>' },
  { id: 'watermark', titleKey: 'tools.watermark.title', descKey: 'tools.watermark.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/></svg>' },
  { id: 'page-numbers', titleKey: 'tools.pageNumbers.title', descKey: 'tools.pageNumbers.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M10 10h4"/><path d="M12 8v4"/></svg>' },
  { id: 'pdf-to-image', titleKey: 'tools.pdfToImage.title', descKey: 'tools.pdfToImage.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>' },
  { id: 'image-to-pdf', titleKey: 'tools.imageToPdf.title', descKey: 'tools.imageToPdf.desc', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m18 18-3-3-4 4"/></svg>' }
];

for (const t of tools) {
  const content = `/**
 * ${t.id}.js - Module definition
 */
import { t } from '../core/i18n.js';

export const id = '${t.id}';
export const titleKey = '${t.titleKey}';
export const descKey = '${t.descKey}';
export const icon = \`${t.icon}\`;

let activeContainer = null;
let activeCtx = null;

export function init(container, ctx) {
  activeContainer = container;
  activeCtx = ctx;
  render();
}

function render() {
  if (!activeContainer) return;
  activeContainer.innerHTML = \`
    <div class="tool-workspace">
      <div style="text-align: center; padding: 2rem 1rem; color: var(--text-secondary);">
        <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">\${t('${t.titleKey}')}</p>
        <p style="font-size: 0.9rem; color: var(--text-muted);">\${t('${t.descKey}')}</p>
        <div style="margin-top: 1.5rem; display: inline-block; padding: 0.5rem 1rem; background: var(--bg-subtle); border-radius: var(--radius-md); font-size: 0.85rem; border: 1px dashed var(--border-strong);">
          \${t('common.readyPlaceholder')}
        </div>
      </div>
    </div>
  \`;
}

export function onFiles(files) {
  console.log('${t.id} onFiles:', files ? files.length : 0);
}

export function destroy() {
  activeContainer = null;
  activeCtx = null;
}
`;
  fs.writeFileSync(path.join('src/modules', `${t.id}.js`), content);
}

// Generate registry index.js
const imports = [
  "import * as merge from './merge.js';",
  ...tools.map(t => {
    const varName = t.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    return `import * as ${varName} from './${t.id}.js';`;
  })
];

const list = [
  'merge',
  ...tools.map(t => t.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase()))
];

const indexContent = `/**
 * Module registry exporting all 13 tools
 */
${imports.join('\n')}

export const allModules = [
  ${list.join(',\n  ')}
];

export const moduleMap = new Map(allModules.map((m) => [m.id, m]));
`;

fs.writeFileSync('src/modules/index.js', indexContent);
console.log('Successfully generated all modules and registry index.');
