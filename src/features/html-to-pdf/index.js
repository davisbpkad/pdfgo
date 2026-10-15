import HtmlToPdfTool from './components/HtmlToPdfTool.vue';

export const id = 'html-to-pdf';
export const titleKey = 'tools.htmlToPdf.title';
export const descKey = 'tools.htmlToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>`;
export const component = HtmlToPdfTool;

export { sanitizeHtml } from './logic/sanitizeHtml.js';
export { printHtmlViaIframe, buildPrintableHtml } from './logic/printHtmlDocument.js';
export { calculateCanvasPagination, sliceCanvasPages } from './logic/paginateCanvas.js';
