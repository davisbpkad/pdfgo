import { t } from '../../../core/i18n.js';
import mammoth from 'mammoth';
import { sanitizeHtml } from '../../html-to-pdf/logic/sanitizeHtml.js';

/**
 * Convert a Microsoft Word DOCX buffer into sanitized HTML suitable for PDF printing
 * @param {ArrayBuffer | Uint8Array} docxBuffer
 * @param {Object} [options]
 * @returns {Promise<{ html: string, rawHtml: string, messages: Array<any> }>}
 */
export async function docxToHtml(docxBuffer, options = {}) {
  if (!docxBuffer || docxBuffer.byteLength === 0) {
    throw new Error(t('tools.wordToPdf.invalidDocx'));
  }

  const safeArrayBuffer = docxBuffer instanceof Uint8Array
    ? docxBuffer.buffer.slice(docxBuffer.byteOffset, docxBuffer.byteOffset + docxBuffer.byteLength)
    : docxBuffer.slice(0);

  const Mammoth = mammoth.default || mammoth;
  // mammoth's browser build only reads `arrayBuffer`, its Node build only reads
  // `buffer`; passing both keeps one code path working in the browser and in tests.
  const result = await Mammoth.convertToHtml(
    { buffer: safeArrayBuffer, arrayBuffer: safeArrayBuffer },
    options
  );

  const rawHtml = result.value || '';
  const sanitized = sanitizeHtml(rawHtml);

  return {
    html: sanitized,
    rawHtml,
    messages: result.messages || []
  };
}
