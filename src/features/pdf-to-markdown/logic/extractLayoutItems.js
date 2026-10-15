/**
 * Extract structured layout items from PDF.js text content
 * @param {Array<object>} textContentItems
 * @returns {Array<{ str: string, x: number, y: number, width: number, height: number, fontSize: number, fontName: string, isBold: boolean }>}
 */
export function extractLayoutItems(textContentItems) {
  if (!Array.isArray(textContentItems)) return [];
  const items = [];

  for (const item of textContentItems) {
    if (!item || !item.str) continue;
    const transform = item.transform || [1, 0, 0, 1, 0, 0];
    const x = transform[4];
    const y = transform[5];
    const scaleX = Math.abs(transform[0]);
    const scaleY = Math.abs(transform[3]);
    const fontSize = Math.max(scaleY, scaleX, item.height || 0);
    const fontName = String(item.fontName || '').toLowerCase();
    const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy') || fontName.includes('b');

    items.push({
      str: item.str,
      x,
      y,
      width: item.width || (item.str.length * fontSize * 0.5),
      height: item.height || fontSize,
      fontSize: Math.round(fontSize * 10) / 10,
      fontName: item.fontName || '',
      isBold
    });
  }

  // Sort: top to bottom (descending Y in PDF points), then left to right (ascending X)
  items.sort((a, b) => {
    const diffY = b.y - a.y;
    if (Math.abs(diffY) > 3) return diffY;
    return a.x - b.x;
  });

  return items;
}
