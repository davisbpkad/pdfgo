import ProtectTool from './components/ProtectTool.vue';

export const id = 'protect';
export const titleKey = 'tools.protect.title';
export const descKey = 'tools.protect.desc';
export const icon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
export const component = ProtectTool;

export { encryptPdf } from './logic/encryptPdf.js';
