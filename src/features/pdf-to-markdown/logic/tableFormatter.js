/**
 * Check if a line represents a multi-column table row candidate
 * @param {object} line
 * @returns {boolean}
 */
export function isTableLine(line) {
  if (!line || !Array.isArray(line.items) || line.items.length < 2) {
    return false;
  }

  let multiColumnGaps = 0;
  for (let i = 1; i < line.items.length; i++) {
    const prev = line.items[i - 1];
    const curr = line.items[i];
    const gap = curr.x - (prev.x + prev.width);
    if (gap > 20) {
      multiColumnGaps++;
    }
  }

  return multiColumnGaps >= 1;
}

/**
 * Convert consecutive table lines into a Markdown table string
 * @param {Array<object>} tableLines
 * @returns {string}
 */
export function formatTableMarkdown(tableLines) {
  if (!Array.isArray(tableLines) || tableLines.length === 0) return '';

  const rows = tableLines.map((line) => {
    const cells = [];
    let currentCell = [];
    let lastX = null;

    for (const item of line.items) {
      if (lastX !== null && (item.x - lastX) > 20) {
        cells.push(currentCell.map((i) => i.str).join(' ').trim());
        currentCell = [item];
      } else {
        currentCell.push(item);
      }
      lastX = item.x + item.width;
    }
    if (currentCell.length > 0) {
      cells.push(currentCell.map((i) => i.str).join(' ').trim());
    }
    return cells;
  });

  const maxCols = Math.max(...rows.map((r) => r.length), 1);
  if (maxCols < 2) {
    return tableLines.map((l) => l.text).join('\n');
  }

  const paddedRows = rows.map((r) => {
    const row = [...r];
    while (row.length < maxCols) row.push('');
    return row.map((cell) => cell.replace(/\|/g, '\\|'));
  });

  const header = '| ' + paddedRows[0].join(' | ') + ' |';
  const separator = '| ' + Array(maxCols).fill('---').join(' | ') + ' |';
  const body = paddedRows
    .slice(1)
    .map((r) => '| ' + r.join(' | ') + ' |')
    .join('\n');

  return body ? `${header}\n${separator}\n${body}` : `${header}\n${separator}`;
}
