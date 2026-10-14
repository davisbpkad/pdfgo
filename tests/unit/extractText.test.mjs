/**
 * extractText.test.mjs - Unit tests for Extract Text Feature
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { loadPdfJsDocument } from '../../src/core/pdf.js';
import { extractTextContent } from '../../src/features/extract-text/logic/extractTextContent.js';

test('extractText: correctly extracts text content from vector PDF with separators', async () => {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const page1 = doc.addPage([500, 700]);
  page1.drawText('Halo Dunia Indonesia', { x: 50, y: 600, size: 14, font });
  page1.drawText('Baris Kedua Dokumen', { x: 50, y: 550, size: 12, font });

  const page2 = doc.addPage([500, 700]);
  page2.drawText('Halaman Kedua Teks Rahasia', { x: 50, y: 600, size: 14, font });

  const pdfBytes = await doc.save();
  const pdfDocProxy = await loadPdfJsDocument(pdfBytes);

  const resultWithSep = await extractTextContent(pdfDocProxy, true);
  assert.equal(resultWithSep.pageTexts.length, 2);
  assert.ok(resultWithSep.fullText.includes('--- Halaman 1 ---'));
  assert.ok(resultWithSep.fullText.includes('Halo Dunia Indonesia'));
  assert.ok(resultWithSep.fullText.includes('--- Halaman 2 ---'));
  assert.ok(resultWithSep.fullText.includes('Halaman Kedua Teks Rahasia'));
  assert.equal(resultWithSep.isScanned, false);
  assert.ok(resultWithSep.wordCount >= 7);
  assert.ok(resultWithSep.charCount > 40);

  const resultNoSep = await extractTextContent(pdfDocProxy, false);
  assert.ok(!resultNoSep.fullText.includes('--- Halaman 1 ---'));
  assert.ok(resultNoSep.fullText.includes('Halo Dunia Indonesia'));
});

test('extractText: marks isScanned true when PDF has no text layer (scanned/images)', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([500, 700]); // Blank page representing a pure scanned image
  const pdfBytes = await doc.save();
  const pdfDocProxy = await loadPdfJsDocument(pdfBytes);

  const result = await extractTextContent(pdfDocProxy, true);
  assert.equal(result.isScanned, true);
  assert.equal(result.wordCount, 0);
  assert.equal(result.charCount, 0);
});

test('extractText: image extension regex detects common image formats', () => {
  const isImageFile = (name) => /\.(png|jpe?g|webp|bmp)$/i.test(name);

  assert.ok(isImageFile('foto.jpg'));
  assert.ok(isImageFile('scan.jpeg'));
  assert.ok(isImageFile('DOKUMEN.PNG'));
  assert.ok(isImageFile('screenshot.webp'));
  assert.ok(isImageFile('kartu.bmp'));

  assert.ok(!isImageFile('dokumen.pdf'));
  assert.ok(!isImageFile('berkas.txt'));
  assert.ok(!isImageFile('arsip.zip'));
});
