import { t } from '../../../core/i18n.js';
import { PDFDocument } from 'pdf-lib';

/**
 * Extract specified pages into a new PDF
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {number[]} pageNumbers (1-indexed)
 * @param {string} [password]
 * @returns {Promise<Uint8Array>}
 */
export async function extractPages(pdfBuffer, pageNumbers, password = '') {
  if (!pageNumbers || pageNumbers.length === 0) {
    throw new Error(t('tools.split.noPagesSelected'));
  }

  let safeBuf;
  if (pdfBuffer instanceof Uint8Array) {
    safeBuf = new Uint8Array(pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength));
  } else if (pdfBuffer instanceof ArrayBuffer) {
    safeBuf = new Uint8Array(pdfBuffer.slice(0));
  } else {
    safeBuf = pdfBuffer;
  }

  const srcDoc = await PDFDocument.load(safeBuf, {
    password: password || undefined,
    ignoreEncryption: false
  });

  const totalPages = srcDoc.getPageCount();
  const validZeroIndices = pageNumbers
    .filter(p => p >= 1 && p <= totalPages)
    .map(p => p - 1);

  if (validZeroIndices.length === 0) {
    throw new Error(t('tools.split.exceedsPages'));
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validZeroIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save();
}
