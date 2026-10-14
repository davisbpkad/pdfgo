/**
 * tests/unit/stage3.test.mjs - Unit Tests for Stage 3 Pure Engines
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { parsePageRange, extractPages, splitEveryN } from '../../src/modules/split.js';
import { reorganizePdfPages } from '../../src/modules/organize.js';
import { buildPdfFromImages } from '../../src/modules/image-to-pdf.js';

test('split: parsePageRange parser logic', () => {
  const result1 = parsePageRange('1-3, 5, 8-10', 12);
  assert.deepEqual(result1, [1, 2, 3, 5, 8, 9, 10]);

  // Out of bounds clamped
  const result2 = parsePageRange('1-5, 20-30', 8);
  assert.deepEqual(result2, [1, 2, 3, 4, 5]);

  // Empty or invalid input
  assert.deepEqual(parsePageRange('', 10), []);
  assert.deepEqual(parsePageRange('abc', 10), []);
});

test('split: extractPages extracts selected page subset', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]); // Page 1
  doc.addPage([400, 600]); // Page 2
  doc.addPage([400, 600]); // Page 3
  doc.addPage([400, 600]); // Page 4
  const bytes = await doc.save();

  const extractedBytes = await extractPages(bytes, [1, 3, 4]);
  const verify = await PDFDocument.load(extractedBytes);
  assert.equal(verify.getPageCount(), 3);
});

test('split: splitEveryN breaks document into chunks', async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 5; i++) doc.addPage([400, 600]);
  const bytes = await doc.save();

  const chunks = await splitEveryN(bytes, 2);
  assert.equal(chunks.length, 3); // 2 + 2 + 1 = 5 pages
  const chunk1 = await PDFDocument.load(chunks[0].data);
  const chunk2 = await PDFDocument.load(chunks[1].data);
  const chunk3 = await PDFDocument.load(chunks[2].data);
  assert.equal(chunk1.getPageCount(), 2);
  assert.equal(chunk2.getPageCount(), 2);
  assert.equal(chunk3.getPageCount(), 1);
});

test('organize: reorganizePdfPages reorders and applies rotations', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]); // 0
  doc.addPage([500, 700]); // 1
  const bytes = await doc.save();

  const reordered = await reorganizePdfPages(bytes, [
    { originalIndex: 1, rotation: 90 },
    { originalIndex: 0, rotation: 180 }
  ]);

  const verify = await PDFDocument.load(reordered);
  assert.equal(verify.getPageCount(), 2);
  assert.equal(verify.getPage(0).getRotation().angle, 90);
  assert.equal(verify.getPage(1).getRotation().angle, 180);
});

test('image-to-pdf: builds PDF from image items', async () => {
  // Minimal 1x1 transparent PNG buffer
  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const pdfBytes = await buildPdfFromImages(
    [
      { buffer: minimalPng, type: 'image/png' },
      { buffer: minimalPng, type: 'image/png' }
    ],
    { pageSize: 'A4', orientation: 'auto', margin: 20, fitMode: 'contain' }
  );

  const verify = await PDFDocument.load(pdfBytes);
  assert.equal(verify.getPageCount(), 2);
});
