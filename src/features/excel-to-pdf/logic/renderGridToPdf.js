import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { readWorkbook } from './readSheet.js';
import { sheetToGrid } from './sheetToGrid.js';
import { fitText } from './fitText.js';

/**
 * Convert Excel workbook or CSV buffer into a formatted PDF document
 * @param {ArrayBuffer | Uint8Array} buffer
 * @param {Object} [options]
 * @param {string} [options.fileName='']
 * @param {'landscape' | 'portrait'} [options.orientation='landscape']
 * @param {number} [options.selectedSheetIndex=-1] // -1 = all sheets
 * @param {(pct: number) => void} [options.onProgress]
 * @returns {Promise<{ pdfBytes: Uint8Array, pageCount: number, sheetCount: number }>}
 */
export async function renderGridToPdf(buffer, options = {}) {
  const { fileName = '', orientation = 'landscape', selectedSheetIndex = -1, onProgress = null } = options;
  const sheets = await readWorkbook(buffer, fileName);

  const activeSheets = selectedSheetIndex >= 0 && selectedSheetIndex < sheets.length
    ? [sheets[selectedSheetIndex]]
    : sheets;

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const totalSheets = activeSheets.length;
  let totalPages = 0;

  for (let sIdx = 0; sIdx < totalSheets; sIdx++) {
    const sheet = activeSheets[sIdx];
    const grid = sheetToGrid(sheet.rows, { orientation, margin: 36 });
    const { pageWidth, pageHeight, margin, rowHeight, headerHeight, colWidths, headerRow, pages } = grid;

    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      totalPages++;
      const pageData = pages[pIdx];
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Draw Sheet Header
      page.drawText(`${sheet.name} (Halaman ${pIdx + 1} dari ${pages.length})`, {
        x: margin,
        y: currentY - 10,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2)
      });
      currentY -= 18;

      // Draw Table Header
      let curX = margin;
      for (let c = 0; c < colWidths.length; c++) {
        const colW = colWidths[c];
        page.drawRectangle({
          x: curX,
          y: currentY - headerHeight,
          width: colW,
          height: headerHeight,
          color: rgb(0.92, 0.92, 0.92),
          borderColor: rgb(0.1, 0.1, 0.1),
          borderWidth: 1
        });
        const headerText = fitText(fontBold, headerRow[c] || `Kolom ${c + 1}`, 9, colW - 8);
        page.drawText(headerText, {
          x: curX + 4,
          y: currentY - headerHeight + 8,
          size: 9,
          font: fontBold,
          color: rgb(0, 0, 0)
        });
        curX += colW;
      }
      currentY -= headerHeight;

      // Draw Body Rows
      for (let r = 0; r < pageData.rows.length; r++) {
        const row = pageData.rows[r];
        const isZebra = r % 2 === 1;
        curX = margin;

        for (let c = 0; c < colWidths.length; c++) {
          const colW = colWidths[c];
          page.drawRectangle({
            x: curX,
            y: currentY - rowHeight,
            width: colW,
            height: rowHeight,
            color: isZebra ? rgb(0.98, 0.98, 0.98) : rgb(1, 1, 1),
            borderColor: rgb(0.7, 0.7, 0.7),
            borderWidth: 0.5
          });
          const cellText = fitText(fontRegular, row[c] || '', 8, colW - 8);
          page.drawText(cellText, {
            x: curX + 4,
            y: currentY - rowHeight + 6,
            size: 8,
            font: fontRegular,
            color: rgb(0.1, 0.1, 0.1)
          });
          curX += colW;
        }
        currentY -= rowHeight;
      }

      if (onProgress) {
        onProgress(Math.round(((sIdx + 1) / totalSheets) * 90));
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  if (onProgress) onProgress(100);

  return { pdfBytes, pageCount: totalPages, sheetCount: totalSheets };
}
