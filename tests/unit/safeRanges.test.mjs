/**
 * safeRanges.test.mjs - Regression tests for silent failures in page-range handling,
 * destructive text edits and page-range parsing parity.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../src/core/pdf.js';
import { applyWatermark } from '../../src/features/watermark/logic/applyWatermark.js';
import { renderTextEditsToPdf } from '../../src/features/edit-pdf/logic/renderTextEditsToPdf.js';
import { convertPdfToExcel } from '../../src/features/pdf-to-excel/logic/convertPdfToExcel.js';
import { parsePageRange as splitParse } from '../../src/features/split/logic/parsePageRange.js';
import { parsePageRange as ocrParse } from '../../src/features/ocr/logic/parsePageRange.js';

async function pdfWithText(lines, pageCount = lines.length) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    const text = lines[i] ?? `HALAMAN ${i + 1}`;
    page.drawText(text, { x: 50, y: 700, size: 14, font });
  }
  return doc.save();
}

async function pageText(bytes, pageNumber) {
  const raw = await loadPdfJsDocument(bytes);
  const doc = unwrapPdfProxy(raw);
  const page = await doc.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(' ');
}

test('watermark: an empty custom range is an error, not a silent no-op', async () => {
  const bytes = await pdfWithText(['satu', 'dua']);
  await assert.rejects(
    () => applyWatermark(bytes, { pageFilter: 'custom', customRange: '' }),
    /Rentang halaman kosong/
  );
});

test('watermark: a custom range still marks only the requested pages', async () => {
  const bytes = await applyWatermark(await pdfWithText(['satu', 'dua', 'tiga']), {
    text: 'RAHASIA',
    pageFilter: 'custom',
    customRange: '2-3'
  });
  const pdf = await PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 3);
  assert.equal(await pageText(bytes, 1), 'satu');
  assert.ok((await pageText(bytes, 2)).includes('RAHASIA'));
  assert.ok((await pageText(bytes, 3)).includes('RAHASIA'));
});

test('edit-pdf: unencodable replacement text leaves the original text intact', async () => {
  const bytes = await pdfWithText(['ASLI']);
  const result = await renderTextEditsToPdf(bytes, {
    0: [{ text: '你好', original: 'ASLI', fontSize: 14, x: 50 / 595.28, y: 700 / 841.89, width: 80 / 595.28, height: 16 / 841.89 }]
  });

  assert.equal(result.skippedCount, 1);
  assert.equal(result.clearedCount, 0);
  assert.equal(result.editCount, 0);
  assert.ok((await pageText(result.pdfBytes, 1)).includes('ASLI'));
});

test('edit-pdf: an intentionally emptied box still clears the text', async () => {
  const bytes = await pdfWithText(['ASLI']);
  const result = await renderTextEditsToPdf(bytes, {
    0: [{ text: '', original: 'ASLI', fontSize: 14, x: 50 / 595.28, y: 700 / 841.89, width: 80 / 595.28, height: 16 / 841.89 }]
  });

  // The cover is a white rectangle; text extraction cannot observe it, so the
  // branch taken (cleared, not skipped) is what the counters prove.
  assert.equal(result.clearedCount, 1);
  assert.equal(result.skippedCount, 0);
  assert.equal(result.editCount, 1);
});

test('edit-pdf: a normal replacement is still written', async () => {
  const bytes = await pdfWithText(['ASLI']);
  const result = await renderTextEditsToPdf(bytes, {
    0: [{ text: 'BARU', original: 'ASLI', fontSize: 14, x: 50 / 595.28, y: 700 / 841.89, width: 80 / 595.28, height: 16 / 841.89 }]
  });

  assert.equal(result.editCount, 1);
  assert.equal(result.skippedCount, 0);
  assert.ok((await pageText(result.pdfBytes, 1)).includes('BARU'));
});

test('pdf-to-excel: an unparsable range is an error instead of exporting every page', async () => {
  const bytes = await pdfWithText(['satu', 'dua']);
  await assert.rejects(
    () => convertPdfToExcel(bytes, { pageRange: 'abc' }),
    /Rentang halaman tidak valid/
  );
});

test('pdf-to-excel: an empty range still exports every page', async () => {
  const bytes = await pdfWithText(['satu', 'dua', 'tiga']);
  const result = await convertPdfToExcel(bytes, { pageRange: '' });
  assert.equal(result.sheetCount, 3);
});

test('parsePageRange: split and OCR keep their documented semantics', () => {
  // split: 1-based, blank means "nothing selected"
  assert.deepEqual(splitParse('1-3, 5', 10), [1, 2, 3, 5]);
  assert.deepEqual(splitParse('', 5), []);
  assert.deepEqual(splitParse('   ', 5), []);
  assert.deepEqual(splitParse('4 2', 10), [2, 4]); // multi-page input now accepted

  // ocr: 0-based, blank means "every page"
  assert.deepEqual(ocrParse('', 3), [0, 1, 2]);
  assert.deepEqual(ocrParse('   ', 3), [0, 1, 2]);
  assert.deepEqual(ocrParse('1 3', 5), [0, 2]);
  assert.deepEqual(ocrParse('2-3', 5), [1, 2]);
});
