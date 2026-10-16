import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toPdfRect } from '../../../core/coordinates.js';
import { sanitizeTextForPdf } from '../../ocr/logic/sanitizeTextForPdf.js';
import { fitFontSize, isChanged, isCleared, splitLines, TEXT_COVER_PADDING_PT } from './textEditInteractions.js';

/**
 * Apply typed text edits onto the PDF: the original text area is covered, then the new text is drawn.
 * Existing PDF content streams cannot be rewritten, so this is a cover + retype operation.
 * ponytail: cover is always white; use the "Tutup Teks" object for colored/scanned pages.
 * @param {ArrayBuffer|Uint8Array} pdfBuffer
 * @param {Record<number, Array<object>>} editsByPage
 * @returns {Promise<{ pdfBytes: Uint8Array, editCount: number, clearedCount: number, skippedCount: number }>}
 */
export async function renderTextEditsToPdf(pdfBuffer, editsByPage = {}) {
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const pdfDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const totalPages = pdfDoc.getPageCount();
  let editCount = 0;
  let clearedCount = 0;
  let skippedCount = 0;

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const edits = (editsByPage[pIdx] || []).filter(isChanged);
    if (edits.length === 0) continue;

    const page = pdfDoc.getPage(pIdx);
    const pW = page.getWidth();
    const pH = page.getHeight();

    for (const edit of edits) {
      const rect = toPdfRect(edit, pW, pH);
      const pad = TEXT_COVER_PADDING_PT;
      const lines = splitLines(edit.text).map(sanitizeTextForPdf);

      if (lines.every((line) => line.length === 0)) {
        if (isCleared(edit)) {
          // The user emptied the box on purpose: cover the original text, draw nothing.
          page.drawRectangle({
            x: Math.max(0, rect.x - pad),
            y: Math.max(0, rect.y - pad),
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            color: rgb(1, 1, 1)
          });
          clearedCount++;
          editCount++;
        } else {
          // Typed text has no encodable character: leave the page untouched
          // instead of erasing the original and drawing nothing.
          skippedCount++;
        }
        continue;
      }

      page.drawRectangle({
        x: Math.max(0, rect.x - pad),
        y: Math.max(0, rect.y - pad),
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
        color: rgb(1, 1, 1)
      });

      const font = edit.isBold ? fontBold : fontRegular;
      const measure = (text, size) => font.widthOfTextAtSize(text, size);
      const size = fitFontSize(measure, lines.reduce((a, b) => (a.length > b.length ? a : b), ''), Math.max(4, rect.width), edit.fontSize || 11);
      const lineHeight = size * 1.25;
      const top = rect.y + rect.height;

      lines.forEach((line, i) => {
        if (!line) return;
        page.drawText(line, {
          x: rect.x + 0.5,
          y: top - size - i * lineHeight,
          size,
          font,
          color: rgb(0, 0, 0)
        });
      });

      editCount++;
    }
  }

  return { pdfBytes: await pdfDoc.save(), editCount, clearedCount, skippedCount };
}
