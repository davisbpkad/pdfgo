import { t } from '../../../core/i18n.js';
/**
 * Transform raw 2D sheet rows into paginated layout grid models for PDF rendering
 * @param {Array<Array<string>>} rawRows
 * @param {Object} [options]
 * @param {'landscape' | 'portrait'} [options.orientation='landscape']
 * @param {number} [options.margin=36]
 * @returns {{ orientation: string, pageWidth: number, pageHeight: number, margin: number, colWidths: Array<number>, headerRow: Array<string>, pages: Array<{ pageNumber: number, rows: Array<Array<string>> }> }}
 */
export function sheetToGrid(rawRows, options = {}) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error(t('tools.excelToPdf.noTableRows'));
  }

  const { orientation = 'landscape', margin = 36 } = options;
  const isLandscape = orientation === 'landscape';
  const pageWidth = isLandscape ? 841.89 : 595.28;
  const pageHeight = isLandscape ? 595.28 : 841.89;

  const headerRow = rawRows[0] || [];
  const bodyRows = rawRows.slice(1);
  const colCount = Math.max(headerRow.length, ...bodyRows.map((r) => r.length), 1);

  // Compute character weight per column to distribute available printable width
  const printableWidth = pageWidth - margin * 2;
  const colCharLengths = new Array(colCount).fill(1);

  for (const row of rawRows) {
    for (let c = 0; c < colCount; c++) {
      const cellText = String(row[c] || '');
      colCharLengths[c] = Math.max(colCharLengths[c], Math.min(cellText.length, 40));
    }
  }

  const totalCharLength = colCharLengths.reduce((a, b) => a + b, 0);
  const minColWidth = 35;
  const colWidths = colCharLengths.map((len) => {
    const proportional = (len / totalCharLength) * printableWidth;
    return Math.max(minColWidth, proportional);
  });

  // Scale column widths to fit printableWidth exactly
  const sumColWidths = colWidths.reduce((a, b) => a + b, 0);
  const scale = printableWidth / sumColWidths;
  for (let i = 0; i < colWidths.length; i++) {
    colWidths[i] = colWidths[i] * scale;
  }

  // Row heights and pagination calculation
  const headerHeight = 26;
  const rowHeight = 20;
  const availableHeight = pageHeight - margin * 2 - headerHeight - 20; // 20pt bottom footer space
  const rowsPerPage = Math.max(1, Math.floor(availableHeight / rowHeight));

  const pages = [];
  if (bodyRows.length === 0) {
    pages.push({ pageNumber: 1, rows: [] });
  } else {
    for (let i = 0; i < bodyRows.length; i += rowsPerPage) {
      pages.push({
        pageNumber: pages.length + 1,
        rows: bodyRows.slice(i, i + rowsPerPage)
      });
    }
  }

  return {
    orientation,
    pageWidth,
    pageHeight,
    margin,
    rowHeight,
    headerHeight,
    colWidths,
    headerRow,
    pages
  };
}
