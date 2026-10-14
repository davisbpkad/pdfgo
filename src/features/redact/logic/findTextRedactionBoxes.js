import { toNormalized } from '../../../core/coordinates.js';

/**
 * Find text bounding boxes for redaction on a given page, returning normalized (0..1) boxes.
 * @param {object} pdfDocProxy
 * @param {number} pageNum 1-indexed
 * @param {string} searchTerm
 * @param {number} [previewScale=1.0] Legacy parameter, ignored in favor of normalized coordinates
 * @returns {Promise<Array<{ id: string, x: number, y: number, width: number, height: number }>>}
 */
export async function findTextRedactionBoxes(pdfDocProxy, pageNum, searchTerm, previewScale = 1.0) {
  if (!pdfDocProxy || !searchTerm?.trim()) return [];

  const page = await pdfDocProxy.getPage(pageNum);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: 1.0 });
  const containerPx = { width: viewport.width, height: viewport.height };
  const query = searchTerm.toLowerCase();
  const boxes = [];

  for (const item of content.items) {
    if (item.str && item.str.toLowerCase().includes(query)) {
      const tx = item.transform;
      const fontHeight = Math.hypot(tx[2], tx[3]);
      const itemWidth = item.width;
      const itemHeight = fontHeight;

      const p1 = viewport.convertToViewportPoint(tx[4], tx[5]);
      const boxX = p1[0];
      const boxY = p1[1] - itemHeight;

      // Unnormalized bounds at scale 1.0 with 1pt padding
      const rawBox = {
        x: Math.max(0, boxX - 1),
        y: Math.max(0, boxY - 1),
        width: itemWidth + 2,
        height: itemHeight + 2
      };

      const normalized = toNormalized(rawBox, containerPx);

      boxes.push({
        id: 'rbox_' + Math.random().toString(36).substring(2, 9),
        ...normalized
      });
    }
  }

  return boxes;
}
