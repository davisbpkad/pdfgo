import { findColumnIndex } from './detectColumns.js';

/**
 * Group layout items into rows and map them into tabular cells
 * @param {Array<{ str: string, x: number, y: number }>} items
 * @param {Array<{ index: number, x: number }>} columns
 * @param {object} [options]
 * @param {number} [options.rowTolerance=4] Vertical threshold in points
 * @returns {Array<Array<string>>} 2D array of rows and cells
 */
export function detectRows(items, columns, { rowTolerance = 4 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return [];
  if (!Array.isArray(columns) || columns.length === 0) {
    return items
      .filter((it) => it && typeof it.str === 'string' && it.str.trim().length > 0)
      .map((it) => [it.str.trim()]);
  }

  const validItems = items.filter(
    (it) => it && typeof it.str === 'string' && it.str.trim().length > 0
  );
  if (validItems.length === 0) return [];

  // Group by descending Y (top-to-bottom in PDF.js layout)
  const rowGroups = [];
  let currentRow = [];
  let currentY = null;

  for (const it of validItems) {
    if (currentY === null) {
      currentY = it.y;
      currentRow.push(it);
    } else if (Math.abs(it.y - currentY) <= rowTolerance) {
      currentRow.push(it);
    } else {
      rowGroups.push(currentRow);
      currentY = it.y;
      currentRow = [it];
    }
  }
  if (currentRow.length > 0) {
    rowGroups.push(currentRow);
  }

  const numCols = columns.length;
  const resultRows = [];

  for (const group of rowGroups) {
    const cells = Array(numCols).fill('');
    // Sort left to right within the row
    group.sort((a, b) => a.x - b.x);

    for (const it of group) {
      const colIdx = findColumnIndex(it.x, columns);
      if (colIdx >= 0 && colIdx < numCols) {
        const text = it.str.trim();
        cells[colIdx] = cells[colIdx] ? `${cells[colIdx]} ${text}` : text;
      }
    }

    if (cells.some((c) => c.length > 0)) {
      resultRows.push(cells);
    }
  }

  return resultRows;
}
