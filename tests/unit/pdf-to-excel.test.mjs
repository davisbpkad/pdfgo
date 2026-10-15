/**
 * pdf-to-excel.test.mjs - Unit tests for PDF to Excel conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { detectColumns, findColumnIndex } from '../../src/features/pdf-to-excel/logic/detectColumns.js';
import { detectRows } from '../../src/features/pdf-to-excel/logic/detectRows.js';
import { convertPdfToExcel } from '../../src/features/pdf-to-excel/logic/convertPdfToExcel.js';

test('pdf-to-excel: detectColumns clusters X coordinates into columns', () => {
  assert.deepEqual(detectColumns([]), []);
  assert.deepEqual(detectColumns(null), []);

  const sampleItems = [
    { x: 50, str: 'No' },
    { x: 120, str: 'Nama' },
    { x: 250, str: 'Skor' },
    { x: 51, str: '1' },
    { x: 121, str: 'Budi' },
    { x: 249, str: '90' },
    { x: 49, str: '2' },
    { x: 119, str: 'Siti' },
    { x: 252, str: '95' },
    { x: 50, str: '   ' } // whitespace should be filtered
  ];

  const cols = detectColumns(sampleItems, { minColGap: 18 });
  assert.equal(cols.length, 3);
  assert.equal(Math.round(cols[0].x), 50);
  assert.equal(Math.round(cols[1].x), 120);
  assert.equal(Math.round(cols[2].x), 250);

  // findColumnIndex tests
  assert.equal(findColumnIndex(48, cols), 0);
  assert.equal(findColumnIndex(52, cols), 0);
  assert.equal(findColumnIndex(125, cols), 1);
  assert.equal(findColumnIndex(245, cols), 2);
  assert.equal(findColumnIndex(500, cols), 2);
});

test('pdf-to-excel: detectRows groups layout items into table rows and cells', () => {
  assert.deepEqual(detectRows([], []), []);
  assert.deepEqual(detectRows(null, null), []);

  const cols = [
    { index: 0, x: 50 },
    { index: 1, x: 120 },
    { index: 2, x: 250 }
  ];

  const sampleItems = [
    // Header row at Y = 700
    { str: 'No', x: 50, y: 700 },
    { str: 'Nama Lengkap', x: 120, y: 700 },
    { str: 'Nilai', x: 250, y: 701 },
    // Data row 1 at Y = 680
    { str: '1', x: 51, y: 680 },
    { str: 'Ahmad', x: 120, y: 679 },
    { str: 'Dahlan', x: 160, y: 681 }, // Multi-word in col 1
    { str: '88', x: 249, y: 680 },
    // Data row 2 at Y = 660
    { str: '2', x: 49, y: 660 },
    { str: 'Budi', x: 121, y: 660 },
    { str: '92', x: 251, y: 660 }
  ];

  const rows = detectRows(sampleItems, cols, { rowTolerance: 4 });
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['No', 'Nama Lengkap', 'Nilai']);
  assert.deepEqual(rows[1], ['1', 'Ahmad Dahlan', '88']);
  assert.deepEqual(rows[2], ['2', 'Budi', '92']);
});

test('pdf-to-excel: single column fallback handles non-tabular text gracefully', () => {
  const items = [
    { str: 'Judul Dokumen', x: 100, y: 700 },
    { str: 'Paragraf pertama isi dokumen.', x: 100, y: 680 }
  ];
  const rows = detectRows(items, []);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], ['Judul Dokumen']);
  assert.deepEqual(rows[1], ['Paragraf pertama isi dokumen.']);
});

test('pdf-to-excel: integration test - converts PDF to valid XLSX workbook', async () => {
  // Create a minimal PDF with 1 table page
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  page.drawText('ID', { x: 50, y: 350, size: 12, font });
  page.drawText('Produk', { x: 120, y: 350, size: 12, font });
  page.drawText('Harga', { x: 250, y: 350, size: 12, font });

  page.drawText('P01', { x: 50, y: 320, size: 12, font });
  page.drawText('Kopi Tubruk', { x: 120, y: 320, size: 12, font });
  page.drawText('15000', { x: 250, y: 320, size: 12, font });

  const pdfBytes = await pdfDoc.save();

  // Test table mode
  const resTable = await convertPdfToExcel(pdfBytes, { mode: 'table' });
  assert.ok(resTable.xlsxBytes instanceof Uint8Array);
  assert.ok(resTable.xlsxBytes.byteLength > 100);
  assert.equal(resTable.sheetCount, 1);
  assert.ok(resTable.rowCount >= 2);

  // Test raw-text mode
  const resRaw = await convertPdfToExcel(pdfBytes, { mode: 'raw-text' });
  assert.ok(resRaw.xlsxBytes instanceof Uint8Array);
  assert.ok(resRaw.xlsxBytes.byteLength > 100);
  assert.equal(resRaw.sheetCount, 1);
  assert.ok(resRaw.rowCount >= 6); // header + 6 items

  // Test error handling
  await assert.rejects(
    async () => {
      await convertPdfToExcel(new Uint8Array(0));
    },
    /kosong atau tidak valid/
  );
});
