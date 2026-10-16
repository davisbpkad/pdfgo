import { PDFDocument } from 'pdf-lib';
import { renderPageToCanvas } from '../../../core/pdf.js';

/**
 * Compress PDF via raster canvas re-encoding
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} pdfDocProxy
 * @param {{ dpiScale: number, quality: number }} options
 * @param {Function} [onProgress]
 * @param {Function} [renderPage] renderPageToCanvas override, injectable for headless tests
 * @returns {Promise<{ bytes: Uint8Array, originalSize: number, compressedSize: number, reductionRate: number }>}
 */
export async function compressPdfDocument(srcBuffer, pdfDocProxy, options, onProgress = null, renderPage = renderPageToCanvas) {
  const { dpiScale = 1.5, quality = 0.70 } = options || {};
  const numPages = pdfDocProxy.numPages;

  let safeBuf;
  if (srcBuffer instanceof Uint8Array) {
    safeBuf = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuf = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuf = srcBuffer;
  }

  const srcDoc = await PDFDocument.load(safeBuf);
  const newDoc = await PDFDocument.create();

  for (let i = 1; i <= numPages; i++) {
    const origPage = srcDoc.getPage(i - 1);
    const { width: origWidth, height: origHeight } = origPage.getSize();

    const { canvas } = await renderPage(pdfDocProxy, i, dpiScale);

    const jpegBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
    const jpegBuffer = await jpegBlob.arrayBuffer();

    canvas.width = 0;
    canvas.height = 0;

    const embeddedJpg = await newDoc.embedJpg(jpegBuffer);
    const newPage = newDoc.addPage([origWidth, origHeight]);
    newPage.drawImage(embeddedJpg, {
      x: 0,
      y: 0,
      width: origWidth,
      height: origHeight
    });

    if (onProgress) {
      onProgress(Math.round((i / numPages) * 100), i, numPages);
    }
  }

  const resultBytes = await newDoc.save();
  const originalSize = safeBuf.byteLength;
  const compressedSize = resultBytes.byteLength;
  const reductionRate = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  return {
    bytes: resultBytes,
    originalSize,
    compressedSize,
    reductionRate
  };
}
