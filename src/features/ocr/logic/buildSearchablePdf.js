import { PDFDocument, StandardFonts } from 'pdf-lib';
import { sanitizeTextForPdf } from './sanitizeTextForPdf.js';

/**
 * Build Searchable PDF by embedding an invisible text layer (opacity = 0)
 * at the recognized word coordinates on top of the original PDF document.
 * @param {Uint8Array|ArrayBuffer} originalPdfBytes
 * @param {Array<{ pageIndex: number, canvasWidth: number, canvasHeight: number, words: Array<{ text: string, bbox: { x0: number, y0: number, x1: number, y1: number } }> }>} pageResults
 * @returns {Promise<Uint8Array>}
 */
export async function buildSearchablePdf(originalPdfBytes, pageResults) {
  let safeBytes;
  if (originalPdfBytes instanceof Uint8Array) {
    safeBytes = new Uint8Array(originalPdfBytes.buffer.slice(originalPdfBytes.byteOffset, originalPdfBytes.byteOffset + originalPdfBytes.byteLength));
  } else if (originalPdfBytes instanceof ArrayBuffer) {
    safeBytes = new Uint8Array(originalPdfBytes.slice(0));
  } else {
    safeBytes = originalPdfBytes;
  }

  const pdfDoc = await PDFDocument.load(safeBytes);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();

  for (const pageRes of pageResults) {
    if (pageRes.pageIndex < 0 || pageRes.pageIndex >= totalPages) continue;

    const page = pdfDoc.getPage(pageRes.pageIndex);
    const { width: pageWidth, height: pageHeight } = page.getSize();
    const canvasW = pageRes.canvasWidth || pageWidth;
    const canvasH = pageRes.canvasHeight || pageHeight;

    const scaleX = canvasW / pageWidth;
    const scaleY = canvasH / pageHeight;

    if (!pageRes.words || !Array.isArray(pageRes.words)) continue;

    for (const word of pageRes.words) {
      if (!word.text || !word.bbox) continue;

      const safeText = sanitizeTextForPdf(word.text);
      if (!safeText) continue;

      const bbox = word.bbox;
      const pdfX = bbox.x0 / scaleX;
      const pdfY = pageHeight - (bbox.y1 / scaleY);
      const pdfH = (bbox.y1 - bbox.y0) / scaleY;
      const fontSize = Math.max(4, Math.min(72, pdfH * 0.9));

      try {
        page.drawText(safeText, {
          x: Math.max(0, pdfX),
          y: Math.max(0, pdfY),
          size: fontSize,
          font: helveticaFont,
          opacity: 0
        });
      } catch (_) {
        // Skip individual characters/symbols that cannot be rendered
      }
    }
  }

  return await pdfDoc.save();
}
