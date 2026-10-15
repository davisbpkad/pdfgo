import PptxToPdfTool from './components/PptxToPdfTool.vue';

export const id = 'powerpoint-to-pdf';
export const titleKey = 'tools.powerpointToPdf.title';
export const descKey = 'tools.powerpointToPdf.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="m10 9 5 3-5 3V9z"/></svg>`;
export const component = PptxToPdfTool;

export { convertPptxToPdf } from './logic/convertPptxToPdf.js';
export { parsePresentationDimensions, parseSlideElements, parseSlideRels } from './logic/parseSlideXml.js';
export { emuToPt, ptToEmu } from './logic/emuToPt.js';
