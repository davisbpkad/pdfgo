/**
 * Extract editable text lines from a PDF page (normalized 0..1 boxes, y from top).
 * Pure grouping logic is separated so it can be unit tested without PDF.js.
 */

import { toNormalized } from '../../../core/coordinates.js';
import { unwrapPdfProxy } from '../../../core/pdf.js';

/**
 * Group raw text items (already converted to top-origin pixel space) into editable lines.
 * @param {Array<{ str: string, x: number, y: number, width: number, height: number, fontSize: number, isBold: boolean }>} items
 * @param {{ width: number, height: number }} containerPx
 * @returns {Array<object>} lines with normalized boxes
 */
export function groupItemsIntoLines(items, containerPx) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const sorted = [...items].sort((a, b) => (a.y - b.y) || (a.x - b.x));
  const lines = [];

  for (const item of sorted) {
    const tolerance = Math.max(2, (item.height || 10) * 0.6);
    const line = lines.find((l) => Math.abs(l.baseY - item.y) <= tolerance);

    if (!line) {
      lines.push({
        baseY: item.y,
        x: item.x,
        y: item.y,
        right: item.x + item.width,
        bottom: item.y + item.height,
        height: item.height,
        fontSize: item.fontSize,
        isBold: item.isBold,
        parts: [{ str: item.str, x: item.x, width: item.width, height: item.height }]
      });
      continue;
    }

    line.parts.push({ str: item.str, x: item.x, width: item.width, height: item.height });
    line.x = Math.min(line.x, item.x);
    line.y = Math.min(line.y, item.y);
    line.right = Math.max(line.right, item.x + item.width);
    line.bottom = Math.max(line.bottom, item.y + item.height);
    line.height = Math.max(line.height, item.height);
    line.fontSize = Math.max(line.fontSize, item.fontSize);
    line.isBold = line.isBold || item.isBold;
  }

  return lines
    .map((line, index) => {
      const parts = [...line.parts].sort((a, b) => a.x - b.x);
      const text = parts
        .map((part, i) => {
          if (i === 0) return part.str;
          const prev = parts[i - 1];
          const gap = part.x - (prev.x + prev.width);
          return (gap > part.height * 0.25 ? ' ' : '') + part.str;
        })
        .join('')
        .replace(/\s+$/, '');

      const box = toNormalized(
        { x: line.x, y: line.y, width: Math.max(1, line.right - line.x), height: Math.max(1, line.bottom - line.y) },
        containerPx
      );

      return {
        id: `txt_${index}`,
        text,
        original: text,
        x: box.x, y: box.y, width: box.width, height: box.height,
        fontSize: Math.round((line.fontSize || 10) * 10) / 10,
        isBold: Boolean(line.isBold)
      };
    })
    .filter((line) => line.text.trim().length > 0);
}

/**
 * Read a PDF page and return editable text lines.
 * @param {object} pdfDocProxy
 * @param {number} pageNum 1-indexed
 * @returns {Promise<Array<object>>}
 */
export async function extractEditableText(pdfDocProxy, pageNum) {
  if (!pdfDocProxy) return [];

  const rawDoc = unwrapPdfProxy(pdfDocProxy);
  const page = await rawDoc.getPage(pageNum);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  const items = [];

  for (const item of content.items) {
    if (!item || !item.str || !item.str.trim()) continue;
    const tx = item.transform || [1, 0, 0, 1, 0, 0];
    const fontHeight = Math.hypot(tx[2], tx[3]) || item.height || 10;
    const point = viewport.convertToViewportPoint(tx[4], tx[5]);
    const fontName = String(item.fontName || '').toLowerCase();

    items.push({
      str: item.str,
      x: point[0],
      y: point[1] - fontHeight,
      width: item.width || item.str.length * fontHeight * 0.5,
      height: fontHeight,
      fontSize: fontHeight,
      isBold: /bold|black|heavy/.test(fontName)
    });
  }

  return groupItemsIntoLines(items, { width: viewport.width, height: viewport.height });
}
