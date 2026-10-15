import ExcelJS from 'exceljs';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../../core/pdf.js';
import { extractLayoutItems } from '../../pdf-to-markdown/logic/extractLayoutItems.js';
import { parsePageRange } from '../../split/logic/parsePageRange.js';
import { detectColumns } from './detectColumns.js';
import { detectRows } from './detectRows.js';

/**
 * Convert PDF layout content into an Excel (.xlsx) workbook
 * @param {ArrayBuffer | Uint8Array} pdfBuffer
 * @param {object} [options]
 * @param {'table' | 'raw-text'} [options.mode='table']
 * @param {string} [options.pageRange='']
 * @param {(pct: number) => void} [options.onProgress]
 * @returns {Promise<{ xlsxBytes: Uint8Array, sheetCount: number, rowCount: number }>}
 */
export async function convertPdfToExcel(pdfBuffer, options = {}) {
  const { mode = 'table', pageRange = '', onProgress = null } = options;
  if (!pdfBuffer || pdfBuffer.byteLength === 0) {
    throw new Error('Berkas PDF kosong atau tidak valid.');
  }

  const safeBytes = new Uint8Array(
    pdfBuffer instanceof Uint8Array
      ? pdfBuffer.buffer.slice(pdfBuffer.byteOffset, pdfBuffer.byteOffset + pdfBuffer.byteLength)
      : pdfBuffer.slice(0)
  );

  const rawDoc = await loadPdfJsDocument(safeBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const totalPages = doc.numPages;

  let pagesToProcess = [];
  if (pageRange && pageRange.trim()) {
    pagesToProcess = parsePageRange(pageRange, totalPages);
  }
  if (pagesToProcess.length === 0) {
    pagesToProcess = Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PDFGO';
  workbook.created = new Date();

  let totalRows = 0;

  for (let idx = 0; idx < pagesToProcess.length; idx++) {
    const pageNum = pagesToProcess[idx];
    if (onProgress) {
      onProgress(Math.round(((idx + 1) / pagesToProcess.length) * 100));
    }

    const page = await doc.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = extractLayoutItems(textContent.items || []);

    const sheetName = `Halaman ${pageNum}`.slice(0, 31);
    const sheet = workbook.addWorksheet(sheetName);

    if (mode === 'raw-text') {
      const headerRow = sheet.addRow(['X (pt)', 'Y (pt)', 'Teks', 'Ukuran Font (pt)', 'Tebal']);
      headerRow.font = { bold: true };
      for (const it of items) {
        sheet.addRow([it.x, it.y, it.str, it.fontSize, it.isBold ? 'Ya' : 'Tidak']);
        totalRows++;
      }
    } else {
      const columns = detectColumns(items);
      const rows = detectRows(items, columns);

      if (rows.length > 0) {
        for (let rIdx = 0; rIdx < rows.length; rIdx++) {
          const row = sheet.addRow(rows[rIdx]);
          if (rIdx === 0) row.font = { bold: true };
          totalRows++;
        }
      } else {
        sheet.addRow(['(Tidak ada teks tabel terdeteksi)']);
        totalRows++;
      }
    }
  }

  const excelBuffer = await workbook.xlsx.writeBuffer();
  return {
    xlsxBytes: new Uint8Array(excelBuffer),
    sheetCount: pagesToProcess.length,
    rowCount: totalRows
  };
}
