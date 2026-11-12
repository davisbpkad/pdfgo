import WordToPdfTool from './components/WordToPdfTool.vue';

export const id = 'word-to-pdf';
export const titleKey = 'tools.wordToPdf.title';
export const descKey = 'tools.wordToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="m8.5 12 1.5 5 2-4 2 4 1.5-5"/></svg>`;
export const component = WordToPdfTool;

export { docxToHtml } from './logic/docxToHtml.js';
