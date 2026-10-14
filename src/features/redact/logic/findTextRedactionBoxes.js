/**
 * Find text bounding boxes for redaction on a given page
 * @param {object} pdfDocProxy
 * @param {number} pageNum 1-indexed
 * @param {string} searchTerm
 * @param {number} previewScale
 * @returns {Promise<Array<{ id: string, x: number, y: number, width: number, height: number }>>}
 */
export async function findTextRedactionBoxes(pdfDocProxy, pageNum, searchTerm, previewScale) {
  if (!pdfDocProxy || !searchTerm?.trim()) return [];

  const page = await pdfDocProxy.getPage(pageNum);
  const content = await page.getTextContent();
  const viewport = page.getViewport({ scale: previewScale });
  const query = searchTerm.toLowerCase();
  const boxes = [];

  for (const item of content.items) {
    if (item.str && item.str.toLowerCase().includes(query)) {
      const tx = item.transform;
      const fontHeight = Math.hypot(tx[2], tx[3]);
      const itemWidth = item.width * previewScale;
      const itemHeight = fontHeight * previewScale;

      const p1 = viewport.convertToViewportPoint(tx[4], tx[5]);
      const boxX = p1[0];
      const boxY = p1[1] - itemHeight;

      boxes.push({
        id: 'rbox_' + Math.random().toString(36).substring(2, 9),
        x: Math.max(0, boxX - 2),
        y: Math.max(0, boxY - 2),
        width: itemWidth + 4,
        height: itemHeight + 4
      });
    }
  }

  return boxes;
}
