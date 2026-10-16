/**
 * tests/unit/sign.test.mjs - Unit Tests for Digital Signature Placement & Coordinate Precision
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { toPdfRect } from '../../src/core/coordinates.js';
import { applySignatures } from '../../src/features/sign/logic/applySignatures.js';

// 1x1 white PNG: enough for pdf-lib to embed a real image XObject.
const TINY_PNG = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
));

test('sign: toPdfRect maps normalized placement to PDF points with inverted Y-axis', () => {
  const pageWidthPt = 595.28; // A4 width
  const pageHeightPt = 841.89; // A4 height

  const placement = { x: 0.1, y: 0.2, width: 0.25, height: 0.1 };
  const pdfRect = toPdfRect(placement, pageWidthPt, pageHeightPt);

  // X should be 10% from left
  assert.equal(Math.round(pdfRect.x * 100) / 100, Math.round(0.1 * pageWidthPt * 100) / 100);
  // Width should be 25% of page
  assert.equal(Math.round(pdfRect.width * 100) / 100, Math.round(0.25 * pageWidthPt * 100) / 100);
  // Height should be 10% of page
  assert.equal(Math.round(pdfRect.height * 100) / 100, Math.round(0.1 * pageHeightPt * 100) / 100);
  // Inverted Y: origin is bottom-left, so Y = pageHeight - (y*H + height*H) = pageHeight - 0.3*H = 0.7*H
  const expectedY = pageHeightPt - (0.2 * pageHeightPt + 0.1 * pageHeightPt);
  assert.equal(Math.round(pdfRect.y * 100) / 100, Math.round(expectedY * 100) / 100);
});

test('sign: applySignatures embeds the signature image on the requested page', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  doc.addPage([595.28, 841.89]);
  const source = await doc.save();

  const placement = toPdfRect({ x: 0.1, y: 0.2, width: 0.25, height: 0.1 }, 595.28, 841.89);
  const result = await applySignatures(source, TINY_PNG, [
    { pageIndex: 1, x: placement.x, y: placement.y, width: placement.width, height: placement.height }
  ]);

  assert.equal(String.fromCharCode(...result.slice(0, 5)), '%PDF-');
  const reloaded = await PDFDocument.load(result);
  assert.equal(reloaded.getPageCount(), 2);
  // The signature must be a real embedded image, not a silent no-op.
  assert.match(new TextDecoder('latin1').decode(result), /\/Subtype\s*\/Image/);
});

test('sign: applySignatures refuses to run without a placement', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([595.28, 841.89]);
  const source = await doc.save();

  await assert.rejects(() => applySignatures(source, TINY_PNG, []), /Tentukan posisi penempatan/);
});
