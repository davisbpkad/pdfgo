/**
 * Group layout items into coherent lines with natural spacing
 * @param {Array<object>} items
 * @param {number} [yTolerance=4]
 * @returns {Array<{ text: string, y: number, minX: number, maxX: number, fontSize: number, isBold: boolean, items: Array<object> }>}
 */
export function groupLines(items, yTolerance = 4) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const lines = [];
  let currentGroup = [];
  let currentY = null;

  for (const item of items) {
    if (currentY === null || Math.abs(item.y - currentY) <= yTolerance) {
      currentGroup.push(item);
      if (currentY === null) currentY = item.y;
    } else {
      if (currentGroup.length > 0) {
        lines.push(buildLineObject(currentGroup));
      }
      currentGroup = [item];
      currentY = item.y;
    }
  }

  if (currentGroup.length > 0) {
    lines.push(buildLineObject(currentGroup));
  }

  return lines;
}

function buildLineObject(group) {
  const sorted = [...group].sort((a, b) => a.x - b.x);

  let text = '';
  let lastEndX = null;
  let maxFontSize = 0;
  let boldCount = 0;

  for (const it of sorted) {
    const str = it.str || '';
    if (lastEndX !== null) {
      const gap = it.x - lastEndX;
      const spaceWidth = (it.fontSize || 10) * 0.25;
      if (gap > spaceWidth && !text.endsWith(' ') && !str.startsWith(' ')) {
        text += ' ';
      }
    }
    text += str;
    lastEndX = it.x + (it.width || (str.length * (it.fontSize || 10) * 0.5));
    if ((it.fontSize || 0) > maxFontSize) maxFontSize = it.fontSize;
    if (it.isBold) boldCount++;
  }

  return {
    text: text.trim(),
    y: group[0].y,
    minX: sorted[0].x,
    maxX: lastEndX,
    fontSize: maxFontSize || 12,
    isBold: boldCount > (group.length / 2),
    items: sorted
  };
}
