/**
 * unicodeText.test.mjs - Regression tests: non-ASCII input must not break PDF writers.
 *
 * StandardFonts.Helvetica encodes WinAnsi only, so drawing a string with an arrow,
 * emoji or CJK character throws "WinAnsi cannot encode" and aborted the whole
 * conversion. Every writer now sanitizes text before measuring or drawing it.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import pptxgen from 'pptxgenjs';
import ExcelJS from 'exceljs';
import { applyWatermark } from '../../src/features/watermark/logic/applyWatermark.js';
import { applyPageNumbers } from '../../src/features/page-numbers/logic/applyPageNumbers.js';
import { createPdfExport } from '../../src/features/ai-summary/logic/exportAiResult.js';
import { renderGridToPdf } from '../../src/features/excel-to-pdf/logic/renderGridToPdf.js';
import { convertPptxToPdf } from '../../src/features/powerpoint-to-pdf/logic/convertPptxToPdf.js';

const NON_ASCII = 'Total: 51% → selesai 中文 🚀 — aman';

/** Two blank pages, as Uint8Array. */
async function blankPdf(pageCount = 2) {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([595.28, 841.89]);
  return doc.save();
}

function assertValidPdf(bytes, expectedPages) {
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(String.fromCharCode(...bytes.slice(0, 5)), '%PDF-');
  return PDFDocument.load(bytes).then((pdf) => {
    assert.equal(pdf.getPageCount(), expectedPages);
    return pdf;
  });
}

test('watermark: non-ASCII text does not throw and keeps every page', async () => {
  const bytes = await applyWatermark(await blankPdf(), { text: NON_ASCII, pageFilter: 'all' });
  await assertValidPdf(bytes, 2);
});

test('watermark: text with no encodable character is rejected instead of silently skipped', async () => {
  const bytes = await blankPdf();
  await assert.rejects(
    () => applyWatermark(bytes, { text: '中文🚀', pageFilter: 'all' }),
    /Teks watermark kosong/
  );
});

test('page-numbers: non-ASCII format does not throw', async () => {
  const bytes = await applyPageNumbers(await blankPdf(), { format: 'Hal {n} dari {total} →' });
  await assertValidPdf(bytes, 2);
});

test('ai-summary: PDF export with non-ASCII text does not throw', async () => {
  const result = await createPdfExport(`${NON_ASCII}\nBaris kedua — dengan emoji 🎯`, 'laporan penilaian.pdf');
  assert.equal(result.fileName, 'laporan penilaian-ringkasan-ai.pdf');
  await assertValidPdf(result.content, 1);
});

test('excel-to-pdf: cells with arrow, CJK and emoji no longer abort the conversion', async () => {
  const Pkg = ExcelJS.default || ExcelJS;
  const wb = new Pkg.Workbook();
  const ws = wb.addWorksheet('Laporan → 2026');
  ws.addRow(['Deskripsi →', 'Bahasa 中文', 'Emoji 🚀']);
  ws.addRow(['Naik 12% → 51%', 'Selesai 中文', 'Aman 🎯']);

  const { pdfBytes, pageCount } = await renderGridToPdf(await wb.xlsx.writeBuffer(), {
    fileName: 'laporan.xlsx',
    orientation: 'landscape'
  });

  assert.equal(pageCount, 1);
  await assertValidPdf(pdfBytes, 1);
});

test('powerpoint-to-pdf: slide text with non-ASCII characters does not abort the conversion', async () => {
  const PptxGen = pptxgen.default || pptxgen;
  const pres = new PptxGen();
  const slide = pres.addSlide();
  slide.addText('Total → 51% 中文 🚀', { x: 1, y: 1, w: 6, h: 1, fontSize: 20 });

  const { pdfBytes, slideCount } = await convertPptxToPdf(await pres.write({ outputType: 'uint8array' }));

  assert.equal(slideCount, 1);
  await assertValidPdf(pdfBytes, 1);
});
