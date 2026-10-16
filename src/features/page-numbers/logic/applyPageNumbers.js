import { PDFDocument, StandardFonts } from 'pdf-lib';
import { sanitizeTextForPdf } from '../../ocr/logic/sanitizeTextForPdf.js';
import { hexToRgb } from '../../edit-pdf/logic/hexColor.js';

/**
 * Stamp page numbers across a PDF document
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} options
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function applyPageNumbers(srcBuffer, options, onProgress = null) {
  const {
    format = 'Halaman {n} dari {total}',
    startNumber = 1,
    position = 'bottom-center',
    margin = 30,
    fontSize = 10,
    colorHex = '#475569',
    skipFirstPage = false
  } = options || {};

  let safeBuf;
  if (srcBuffer instanceof Uint8Array) {
    safeBuf = new Uint8Array(srcBuffer.buffer.slice(srcBuffer.byteOffset, srcBuffer.byteOffset + srcBuffer.byteLength));
  } else if (srcBuffer instanceof ArrayBuffer) {
    safeBuf = new Uint8Array(srcBuffer.slice(0));
  } else {
    safeBuf = srcBuffer;
  }

  const pdfDoc = await PDFDocument.load(safeBuf);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const color = hexToRgb(colorHex);
  const totalPages = pdfDoc.getPageCount();

  const effectiveTotal = skipFirstPage ? totalPages - 1 : totalPages;
  let pageCounter = startNumber;

  for (let i = 0; i < totalPages; i++) {
    if (skipFirstPage && i === 0) continue;

    const page = pdfDoc.getPage(i);
    const { width, height } = page.getSize();

    const text = sanitizeTextForPdf(format
      .replace(/\{n\}/g, String(pageCounter))
      .replace(/\{total\}/g, String(effectiveTotal)));

    if (text) {
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      let x = margin;
      if (position.includes('center')) {
        x = (width - textWidth) / 2;
      } else if (position.includes('right')) {
        x = width - margin - textWidth;
      }

      let y = margin;
      if (position.startsWith('top')) {
        y = height - margin - textHeight;
      } else if (position.startsWith('middle')) {
        y = (height - textHeight) / 2;
      }

      page.drawText(text, {
        x,
        y,
        size: fontSize,
        font,
        color
      });
    }

    pageCounter++;

    if (onProgress) {
      onProgress(Math.round(((i + 1) / totalPages) * 100));
    }
  }

  return await pdfDoc.save();
}
