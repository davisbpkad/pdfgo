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
    throw new Error('Berkas Word (.docx) kosong atau tidak valid.');
  }

  const safeArrayBuffer = docxBuffer instanceof Uint8Array
    ? docxBuffer.buffer.slice(docxBuffer.byteOffset, docxBuffer.byteOffset + docxBuffer.byteLength)
    : docxBuffer.slice(0);

  const Mammoth = mammoth.default || mammoth;
  const result = await Mammoth.convertToHtml({ buffer: safeArrayBuffer }, options);

  const rawHtml = result.value || '';
  const sanitized = sanitizeHtml(rawHtml);

  return {
    html: sanitized,
    rawHtml,
    messages: result.messages || []
  };
}
