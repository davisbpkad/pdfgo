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

/**
 * Extract multiple page-range groups into separate PDF files, loading source PDF once.
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {Array<{ label: string, pages: number[] }>} groups
 * @param {string} [baseName='dokumen']
 * @param {string} [password='']
 * @param {Function} [onProgress=null]
 * @returns {Promise<Array<{ name: string, data: Uint8Array }>>}
 */
export async function extractRangeGroups(pdfBuffer, groups, baseName = 'dokumen', password = '', onProgress = null) {
  if (!groups || groups.length === 0) {
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
  const safeBase = (baseName || 'dokumen').replace(/\.pdf$/i, '');
  const results = [];

  for (let i = 0; i < groups.length; i++) {
    const group = groups[i];
    const indices = (group.pages || []).filter(p => p >= 1 && p <= totalPages).map(p => p - 1);
    if (indices.length === 0) continue;

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, indices);
    for (const page of copiedPages) newDoc.addPage(page);

    const idxTag = String(results.length + 1).padStart(3, '0');
    const rangeTag = String(group.label || `${indices[0] + 1}`).replace(/[^0-9a-zA-Z-]/g, '_');
    results.push({
      name: `${safeBase}_bagian_${idxTag}_hal_${rangeTag}.pdf`,
      data: await newDoc.save()
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / groups.length) * 100));
    }
  }

  if (results.length === 0) {
    throw new Error(t('tools.split.exceedsPages'));
  }

  return results;
}
