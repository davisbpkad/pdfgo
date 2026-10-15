import PdfToExcelTool from './components/PdfToExcelTool.vue';

export const id = 'pdf-to-excel';
export const titleKey = 'pdfToExcel.title';
export const descKey = 'pdfToExcel.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2"/><path d="M8 17h2"/><path d="M14 13h2"/><path d="M14 17h2"/></svg>`;
export const component = PdfToExcelTool;

export { convertPdfToExcel } from './logic/convertPdfToExcel.js';
export { detectColumns, findColumnIndex } from './logic/detectColumns.js';
export { detectRows } from './logic/detectRows.js';
