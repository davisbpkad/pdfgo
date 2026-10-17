import { t } from '../../../core/i18n.js';
import { PDFDocument, StandardFonts, degrees } from 'pdf-lib';
import { parsePageRange } from '../../split/logic/parsePageRange.js';
import { sanitizeTextForPdf } from '../../ocr/logic/sanitizeTextForPdf.js';
import { hexToRgb } from '../../edit-pdf/logic/hexColor.js';

/**
 * Apply text watermark to specified pages of a PDF
 * @param {ArrayBuffer|Uint8Array} srcBuffer
 * @param {object} options
 * @param {Function} [onProgress]
 * @returns {Promise<Uint8Array>}
 */
export async function applyWatermark(srcBuffer, options, onProgress = null) {
  const {
    text = 'CONFIDENTIAL',
    fontSize = 48,
    colorHex = '#dc2626',
    opacity = 0.25,
    position = 'diagonal',
    pageFilter = 'all',
    customRange = ''
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
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const color = hexToRgb(colorHex);
  const totalPages = pdfDoc.getPageCount();

  const targetIndices = [];
  let customPages = [];
  if (pageFilter === 'custom') {
    customPages = parsePageRange(customRange, totalPages);
    if (customPages.length === 0) {
      throw new Error(t('tools.watermark.invalidRange'));
    }
  }

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    if (pageFilter === 'all') targetIndices.push(i);
    else if (pageFilter === 'odd' && pageNum % 2 !== 0) targetIndices.push(i);
    else if (pageFilter === 'even' && pageNum % 2 === 0) targetIndices.push(i);
    else if (pageFilter === 'custom' && customPages.includes(pageNum)) targetIndices.push(i);
  }

  const safeText = sanitizeTextForPdf(text);
  if (!safeText) {
    throw new Error(t('tools.watermark.emptyText'));
  }

  const textWidth = font.widthOfTextAtSize(safeText, fontSize);
  const textHeight = font.heightAtSize(fontSize);

  for (let idx = 0; idx < targetIndices.length; idx++) {
    const pageIndex = targetIndices[idx];
    const page = pdfDoc.getPage(pageIndex);
    const { width, height } = page.getSize();

    if (position === 'tiled') {
      const stepX = Math.max(textWidth + 80, 200);
      const stepY = Math.max(textHeight + 80, 150);
      for (let x = -width * 0.5; x < width * 1.5; x += stepX) {
        for (let y = -height * 0.5; y < height * 1.5; y += stepY) {
          page.drawText(safeText, {
            x,
            y,
            size: fontSize * 0.7,
            font,
            color,
            opacity: opacity * 0.8,
            rotate: degrees(30)
          });
        }
      }
    } else if (position === 'diagonal') {
      const angle = 45;
      const rad = (angle * Math.PI) / 180;
      const x = (width - (textWidth * Math.cos(rad) - textHeight * Math.sin(rad))) / 2;
      const y = (height - (textWidth * Math.sin(rad) + textHeight * Math.cos(rad))) / 2;

      page.drawText(safeText, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(angle)
      });
    } else {
      const x = (width - textWidth) / 2;
      const y = (height - textHeight) / 2;

      page.drawText(safeText, {
        x,
        y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(0)
      });
    }

    if (onProgress) {
      onProgress(Math.round(((idx + 1) / targetIndices.length) * 100));
    }
  }

  return await pdfDoc.save();
}
