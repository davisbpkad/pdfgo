import ExcelToPdfTool from './components/ExcelToPdfTool.vue';

export const id = 'excel-to-pdf';
export const titleKey = 'tools.excelToPdf.title';
export const descKey = 'tools.excelToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/></svg>`;
export const component = ExcelToPdfTool;

export { readWorkbook, parseCsvText } from './logic/readSheet.js';
export { sheetToGrid } from './logic/sheetToGrid.js';
export { renderGridToPdf } from './logic/renderGridToPdf.js';
