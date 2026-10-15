import PdfToPowerpointTool from './components/PdfToPowerpointTool.vue';

export const id = 'pdf-to-powerpoint';
export const titleKey = 'tools.pdfToPowerpoint.title';
export const descKey = 'tools.pdfToPowerpoint.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><polygon points="10 7 15 10 10 13 10 7"/></svg>`;
export const component = PdfToPowerpointTool;

export { convertPdfToPptx } from './logic/convertPdfToPptx.js';
export { ptToEmu, emuToPt, ptToInches, inchesToPt } from './logic/ptToEmu.js';
export { buildSlidePlan } from './logic/buildSlidePlan.js';
