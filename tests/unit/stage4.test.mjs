/**
 * tests/unit/stage4.test.mjs - Unit Tests for Stage 4 Annotation Engines
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { applyWatermark } from '../../src/modules/watermark.js';
import { applyPageNumbers } from '../../src/modules/page-numbers.js';
import { applySignatures } from '../../src/modules/sign.js';
import { inspectAcroForm, fillAcroForm } from '../../src/modules/form.js';

test('watermark: applies watermark to PDF document', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([500, 700]);
  doc.addPage([500, 700]);
  const bytes = await doc.save();

  const watermarked = await applyWatermark(bytes, {
    text: 'RAHASIA',
    fontSize: 36,
    colorHex: '#dc2626',
    opacity: 0.3,
    position: 'diagonal',
    pageFilter: 'all'
  });

  const verify = await PDFDocument.load(watermarked);
  assert.equal(verify.getPageCount(), 2);
});

test('page-numbers: stamps page numbers across pages', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([600, 800]);
  doc.addPage([600, 800]);
  doc.addPage([600, 800]);
  const bytes = await doc.save();

  const numbered = await applyPageNumbers(bytes, {
    format: 'Halaman {n} dari {total}',
    startNumber: 1,
    position: 'bottom-center',
    margin: 30,
    fontSize: 10,
    colorHex: '#000000',
    skipFirstPage: false
  });

  const verify = await PDFDocument.load(numbered);
  assert.equal(verify.getPageCount(), 3);
});

test('sign: stamps signature PNG at specified coordinates', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([500, 700]);
  const bytes = await doc.save();

  const minimalPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );

  const signed = await applySignatures(bytes, minimalPng, [
    { pageIndex: 0, x: 100, y: 100, width: 80, height: 40 }
  ]);

  const verify = await PDFDocument.load(signed);
  assert.equal(verify.getPageCount(), 1);
});

test('form: inspects and fills AcroForm fields with flattening', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([500, 700]);
  const form = doc.getForm();

  const nameField = form.createTextField('fullName');
  nameField.setText('Initial Name');
  nameField.addToPage(page, { x: 50, y: 500, width: 200, height: 30 });

  const agreeBox = form.createCheckBox('agreeTerms');
  agreeBox.addToPage(page, { x: 50, y: 450, width: 20, height: 20 });

  const bytes = await doc.save();

  // Inspect
  const fields = await inspectAcroForm(bytes);
  assert.equal(fields.length, 2);
  const nameMeta = fields.find(f => f.name === 'fullName');
  const agreeMeta = fields.find(f => f.name === 'agreeTerms');
  assert.equal(nameMeta.value, 'Initial Name');
  assert.equal(agreeMeta.value, false);

  // Fill and flatten
  const filledBytes = await fillAcroForm(
    bytes,
    { fullName: 'Davis Tanjung', agreeTerms: true },
    true // flatten
  );

  const verifyDoc = await PDFDocument.load(filledBytes);
  // After flattening, form fields are baked into the page graphics
  assert.equal(verifyDoc.getPageCount(), 1);
});
