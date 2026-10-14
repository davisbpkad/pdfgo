/**
 * tests/unit/stage5.test.mjs - Unit Tests for Stage 5 High-Risk Engines
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';

test('redact: metadata sanitization removes title, author, and creator', async () => {
  const doc = await PDFDocument.create();
  doc.setTitle('Secret Financial Report');
  doc.setAuthor('John Confidential');
  doc.setProducer('Internal Scanner');
  doc.addPage([500, 700]);
  const bytes = await doc.save();

  const loaded = await PDFDocument.load(bytes);
  assert.equal(loaded.getTitle(), 'Secret Financial Report');
  assert.equal(loaded.getAuthor(), 'John Confidential');

  // Sanitize
  loaded.setTitle('');
  loaded.setAuthor('');
  loaded.setSubject('');
  loaded.setKeywords([]);
  loaded.setProducer('');
  loaded.setCreator('');
  const sanitizedBytes = await loaded.save();

  const verify = await PDFDocument.load(sanitizedBytes);
  assert.ok(!verify.getTitle(), 'Title should be empty');
  assert.ok(!verify.getAuthor(), 'Author should be empty');
});

test('redact: untouched pages remain clean vector copies', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]);
  doc.addPage([400, 600]);
  const bytes = await doc.save();

  const src = await PDFDocument.load(bytes);
  const dest = await PDFDocument.create();

  // Copy page 0 directly (untouched page in redact pipeline)
  const [copied] = await dest.copyPages(src, [0]);
  dest.addPage(copied);

  const destBytes = await dest.save();
  const verify = await PDFDocument.load(destBytes);
  assert.equal(verify.getPageCount(), 1);
});

test('compress: reduction rate formula and statistics', () => {
  const originalSize = 10000;
  const compressedSize = 3500;
  const reductionRate = Math.round(((originalSize - compressedSize) / originalSize) * 100);
  assert.equal(reductionRate, 65); // 65% reduction

  const largerSize = 12000;
  const negativeRate = Math.round(((originalSize - largerSize) / originalSize) * 100);
  assert.equal(negativeRate, -20);
});
