import { PDFDocument } from 'pdf-lib';
import { renderPageToCanvas } from '../../../core/pdf.js';
import { renderRedactionBoxes } from './renderRedactionBoxes.js';

/**
 * Execute True Redaction: rasterizes redacted pages, preserves untouched pages, clears metadata
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} pdfDocProxy
 * @param {Record<number, Array<{ x: number, y: number, width: number, height: number }>>} boxesByPage
 * @param {number} previewScale
 * @param {boolean} [sanitizeMeta=true]
 * @param {Function} [onProgress]
 * @param {Function} [renderPage] renderPageToCanvas override, injectable for headless tests
 * @returns {Promise<Uint8Array>}
 */
export async function executeTrueRedaction(srcBuffer, pdfDocProxy, boxesByPage, previewScale, sanitizeMeta = true, onProgress = null, renderPage = renderPageToCanvas) {
  let safeBuffer;
  if (srcBuffer instanceof Uint8Array) {
    safeBuffer = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuffer = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuffer = srcBuffer;
  }

  const srcDoc = await PDFDocument.load(safeBuffer);
  const newDoc = await PDFDocument.create();
  const totalPages = srcDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const pageBoxes = boxesByPage[i] || [];
    const origPage = srcDoc.getPage(i);
    const { width: origWidth, height: origHeight } = origPage.getSize();

    if (pageBoxes.length === 0) {
      const [copied] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copied);
    } else {
      const highResScale = 2.5;
      const { canvas } = await renderPage(pdfDocProxy, i + 1, highResScale);
      const ctx = canvas.getContext('2d');
      renderRedactionBoxes(ctx, pageBoxes, canvas.width, canvas.height, highResScale, previewScale);

      const pngBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const pngBuffer = await pngBlob.arrayBuffer();

      canvas.width = 0;
      canvas.height = 0;

      const embeddedImg = await newDoc.embedPng(pngBuffer);
      const newPage = newDoc.addPage([origWidth, origHeight]);
      newPage.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width: origWidth,
        height: origHeight
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  if (sanitizeMeta) {
    newDoc.setTitle('');
    newDoc.setAuthor('');
    newDoc.setSubject('');
    newDoc.setKeywords([]);
    newDoc.setProducer('');
    newDoc.setCreator('');
  }

  return await newDoc.save();
}
