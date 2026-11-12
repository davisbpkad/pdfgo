import PdfToMarkdownTool from './components/PdfToMarkdownTool.vue';

export const id = 'pdf-to-markdown';
export const titleKey = 'tools.pdfToMarkdown.title';
export const descKey = 'tools.pdfToMarkdown.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15V9l2.5 3L12 9v6"/><path d="M16 9v6"/><path d="m14 13 2 2 2-2"/></svg>`;
export const component = PdfToMarkdownTool;

export { convertPdfToMarkdown } from './logic/convertPdfToMarkdown.js';
