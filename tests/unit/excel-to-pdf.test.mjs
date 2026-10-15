/**
 * excel-to-pdf.test.mjs - Unit tests for Excel/CSV to PDF conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { PDFDocument } from 'pdf-lib';
import { parseCsvText } from '../../src/features/excel-to-pdf/logic/readSheet.js';
import { sheetToGrid } from '../../src/features/excel-to-pdf/logic/sheetToGrid.js';
import { fitText } from '../../src/features/excel-to-pdf/logic/fitText.js';
import { renderGridToPdf } from '../../src/features/excel-to-pdf/logic/renderGridToPdf.js';

test('excel-to-pdf: parseCsvText handles basic, quotes, and commas inside cells', () => {
  const csv = 'Nama,"Alamat, Kota",Gaji\nBudi,"Jl. Merdeka, Jakarta",5000000\n"Siti ""Aisyah""","Bandung",6000000';
  const rows = parseCsvText(csv);

  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], ['Nama', 'Alamat, Kota', 'Gaji']);
  assert.equal(rows[1][0], 'Budi');
  assert.equal(rows[1][1], 'Jl. Merdeka, Jakarta');
  assert.equal(rows[2][0], 'Siti "Aisyah"');
});

test('excel-to-pdf: sheetToGrid calculates column widths and paginates rows', () => {
  const rawRows = [
    ['ID', 'Nama Barang', 'Harga Satuan'],
    ...Array.from({ length: 60 }, (_, i) => [`BRG-${i + 1}`, `Nama Barang Nomor Urut ${i + 1}`, `Rp ${(i + 1) * 1000}`])
  ];

  const grid = sheetToGrid(rawRows, { orientation: 'landscape', margin: 36 });
  assert.equal(grid.orientation, 'landscape');
  assert.equal(grid.pageWidth, 841.89);
  assert.equal(grid.pageHeight, 595.28);
  assert.equal(grid.colWidths.length, 3);

  // Assert sum of colWidths equals printable width
  const totalW = grid.colWidths.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(totalW - (841.89 - 72)) < 0.1);

  // 60 rows should be split across multiple pages
  assert.ok(grid.pages.length >= 2);
  assert.equal(grid.pages[0].pageNumber, 1);
});

test('excel-to-pdf: fitText truncates overflowing text with ellipsis', () => {
  const mockFont = {
    widthOfTextAtSize: (t, size) => t.length * (size * 0.5)
  };

  const normal = fitText(mockFont, 'Halo', 10, 100);
  assert.equal(normal, 'Halo');

  const truncated = fitText(mockFont, 'Teks yang sangat panjang sekali melebihi lebar batas', 10, 50);
  assert.ok(truncated.endsWith('...'));
  assert.ok(mockFont.widthOfTextAtSize(truncated, 10) <= 50);
});

test('excel-to-pdf: integration test - converts XLSX workbook into PDF with accurate page count', async () => {
  const Pkg = ExcelJS.default || ExcelJS;
  const wb = new Pkg.Workbook();
  const ws = wb.addWorksheet('Laporan Stok');
  ws.addRow(['Kode', 'Deskripsi Produk', 'Kuantitas']);
  for (let i = 1; i <= 20; i++) {
    ws.addRow([`KOD-${i}`, `Produk Elektronik Nomor ${i}`, i * 5]);
  }

  const xlsxBuffer = await wb.xlsx.writeBuffer();
  assert.ok(xlsxBuffer.byteLength > 1000);

  const { pdfBytes, pageCount, sheetCount } = await renderGridToPdf(xlsxBuffer, {
    fileName: 'stok.xlsx',
    orientation: 'landscape'
  });

  assert.ok(pdfBytes instanceof Uint8Array);
  assert.equal(sheetCount, 1);
  assert.equal(pageCount, 1);

  // Verify valid PDF magic header %PDF-
  const header = String.fromCharCode(...pdfBytes.slice(0, 5));
  assert.equal(header, '%PDF-');

  // Verify loading with pdf-lib
  const loadedPdf = await PDFDocument.load(pdfBytes);
  assert.equal(loadedPdf.getPageCount(), 1);
});
