import ScanToPdfTool from './components/ScanToPdfTool.vue';

export const id = 'scan-to-pdf';
export const titleKey = 'tools.scanToPdf.title';
export const descKey = 'tools.scanToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
export const component = ScanToPdfTool;

export { applyScanFilter } from './logic/applyScanFilter.js';
export { buildScannedPdf } from './logic/buildScannedPdf.js';
