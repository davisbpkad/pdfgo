import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderScale,
  toNormalized,
  toCanvasPx,
  toPdfRect,
  toDisplayBox
} from '../../src/core/coordinates.js';

test('coordinates: toNormalized and toCanvasPx roundtrip stability', () => {
  const container = { width: 800, height: 1000 };
  const originalBox = { x: 100, y: 250, width: 200, height: 150 };

  const normalized = toNormalized(originalBox, container);
  assert.equal(normalized.x, 0.125);
  assert.equal(normalized.y, 0.25);
  assert.equal(normalized.width, 0.25);
  assert.equal(normalized.height, 0.15);

  const recovered = toCanvasPx(normalized, container);
  assert.equal(recovered.x, originalBox.x);
  assert.equal(recovered.y, originalBox.y);
  assert.equal(recovered.width, originalBox.width);
  assert.equal(recovered.height, originalBox.height);
});

test('coordinates: toNormalized clamps bounds safely inside [0, 1]', () => {
  const container = { width: 500, height: 500 };

  const outOfBounds = { x: -50, y: -20, width: 600, height: 700 };
  const normalized = toNormalized(outOfBounds, container);

  assert.equal(normalized.x, 0);
  assert.equal(normalized.y, 0);
  assert.equal(normalized.width, 1);
  assert.equal(normalized.height, 1);
});

test('coordinates: toPdfRect correctly inverts Y-axis for PDF coordinates', () => {
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;

  // Box at top-left: x=0, y=0, width=0.5, height=0.25
  const topBox = { x: 0, y: 0, width: 0.5, height: 0.25 };
  const pdfRect = toPdfRect(topBox, pageWidthPt, pageHeightPt);

  assert.equal(pdfRect.x, 0);
  assert.equal(pdfRect.width, pageWidthPt * 0.5);
  assert.equal(pdfRect.height, pageHeightPt * 0.25);
  // Y in PDF should be at the top: pageHeight - height
  const expectedPdfY = pageHeightPt - (0.25 * pageHeightPt);
  assert.ok(Math.abs(pdfRect.y - expectedPdfY) < 0.001);

  // Box at bottom-left: x=0, y=0.75, width=0.5, height=0.25
  const bottomBox = { x: 0, y: 0.75, width: 0.5, height: 0.25 };
  const pdfBottomRect = toPdfRect(bottomBox, pageWidthPt, pageHeightPt);
  assert.ok(Math.abs(pdfBottomRect.y - 0) < 0.001);
});

test('coordinates: renderScale respects devicePixelRatio and clamps at canvas limits', () => {
  // Normal zoom
  const normal = renderScale(1.0, 2.0, 595, 842);
  assert.equal(normal.scale, 2.0);
  assert.equal(normal.clamped, false);

  // Extreme zoom that would exceed MAX_CANVAS_DIM (4096)
  const extreme = renderScale(10.0, 2.0, 595, 842); // 20x on 842 = 16840px
  assert.equal(extreme.clamped, true);
  assert.ok(extreme.scale <= 4096 / 842);
});

test('coordinates: toDisplayBox maps normalized box to display pixels', () => {
  const view = { width: 400, height: 600 };
  const norm = { x: 0.25, y: 0.5, width: 0.5, height: 0.25 };

  const display = toDisplayBox(norm, view);
  assert.equal(display.x, 100);
  assert.equal(display.y, 300);
  assert.equal(display.width, 200);
  assert.equal(display.height, 150);
});
