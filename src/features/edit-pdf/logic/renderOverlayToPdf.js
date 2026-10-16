import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { toPdfRect } from '../../../core/coordinates.js';
import { hexToRgb } from './hexColor.js';
import { sanitizeTextForPdf } from '../../ocr/logic/sanitizeTextForPdf.js';

export async function renderOverlayToPdf(pdfBuffer, objectsByPage = {}, options = {}) {
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const pdfDoc = await PDFDocument.load(safeBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const totalPages = pdfDoc.getPageCount();
  let totalObjects = 0;

  for (let pIdx = 0; pIdx < totalPages; pIdx++) {
    const page = pdfDoc.getPage(pIdx);
    const pW = page.getWidth();
    const pH = page.getHeight();
    const objects = objectsByPage[pIdx] || [];

    for (const obj of objects) {
      totalObjects++;
      const rect = toPdfRect(obj, pW, pH);

      if (obj.type === 'text') {
        const size = Math.max(6, obj.fontSize || 12);
        const yPos = Math.max(0, rect.y + Math.max(0, rect.height - size));
        const safeText = sanitizeTextForPdf(obj.text);
        if (safeText) {
          page.drawText(safeText, { x: rect.x, y: yPos, size, font, color: hexToRgb(obj.color) });
        }
      } else if (obj.type === 'whiteout') {
        page.drawRectangle({ x: rect.x, y: rect.y, width: rect.width, height: rect.height, color: rgb(1, 1, 1) });
      } else if (obj.type === 'rect') {
        page.drawRectangle({
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          color: obj.fillColor ? hexToRgb(obj.fillColor) : undefined,
          borderColor: hexToRgb(obj.borderColor || '#000000'),
          borderWidth: obj.strokeWidth || 1
        });
      } else if (obj.type === 'ellipse') {
        page.drawEllipse({
          x: rect.x + rect.width / 2, y: rect.y + rect.height / 2,
          xScale: Math.max(1, rect.width / 2), yScale: Math.max(1, rect.height / 2),
          color: obj.fillColor ? hexToRgb(obj.fillColor) : undefined,
          borderColor: hexToRgb(obj.borderColor || '#000000'),
          borderWidth: obj.strokeWidth || 1
        });
      } else if (obj.type === 'line' || obj.type === 'arrow') {
        const start = { x: rect.x, y: rect.y + rect.height };
        const end = { x: rect.x + rect.width, y: rect.y };
        page.drawLine({ start, end, thickness: obj.strokeWidth || 2, color: hexToRgb(obj.color || '#000000') });
        if (obj.type === 'arrow') {
          page.drawEllipse({ x: end.x, y: end.y, xScale: 3, yScale: 3, color: hexToRgb(obj.color || '#000000') });
        }
      } else if (obj.type === 'draw' && Array.isArray(obj.points) && obj.points.length > 1) {
        for (let i = 0; i < obj.points.length - 1; i++) {
          const p1 = obj.points[i];
          const p2 = obj.points[i + 1];
          page.drawLine({
            start: { x: p1.x * pW, y: pH - (p1.y * pH) },
            end: { x: p2.x * pW, y: pH - (p2.y * pH) },
            thickness: obj.strokeWidth || 2,
            color: hexToRgb(obj.color || '#000000')
          });
        }
      } else if (obj.type === 'image' && obj.dataUrl) {
        try {
          const rawBase64 = obj.dataUrl.split(',')[1] || '';
          const binaryStr = atob(rawBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let b = 0; b < binaryStr.length; b++) bytes[b] = binaryStr.charCodeAt(b);
          const isPng = obj.dataUrl.includes('image/png');
          const embedded = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
          page.drawImage(embedded, { x: rect.x, y: rect.y, width: rect.width, height: rect.height });
        } catch (err) {
          console.warn('Gagal menempelkan gambar ke PDF:', err);
        }
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  return { pdfBytes, pageCount: totalPages, objectCount: totalObjects };
}
