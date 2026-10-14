/**
 * tests/unit/viewportZoom.test.mjs - Unit tests for Viewport Zoom Logic & Legibility Standards
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_PRESETS,
  clampZoom,
  calculateFitWidthZoom
} from '../../src/ui/logic/viewportZoom.js';

test('viewportZoom: clampZoom confines zoom within 25% to 400%', () => {
  assert.equal(clampZoom(0.1), MIN_ZOOM);
  assert.equal(clampZoom(0.25), 0.25);
  assert.equal(clampZoom(1.5), 1.5);
  assert.equal(clampZoom(4.0), 4.0);
  assert.equal(clampZoom(5.5), MAX_ZOOM);
  assert.equal(clampZoom(NaN), 1.0);
  assert.equal(clampZoom(null), 1.0);
});

test('viewportZoom: presets cover 25% through 400% in orderly increments', () => {
  assert.deepEqual(ZOOM_PRESETS, [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 4.0]);
  for (const preset of ZOOM_PRESETS) {
    assert.ok(preset >= MIN_ZOOM && preset <= MAX_ZOOM);
  }
});

test('viewportZoom: calculateFitWidthZoom accurately calculates responsive scale', () => {
  const a4WidthPt = 595.28;
  const padding = 32;

  // On a desktop viewport column with 700px available width:
  // (700 - 32) / 595.28 = 668 / 595.28 = 1.122 -> 1.12
  const desktopZoom = calculateFitWidthZoom(700, a4WidthPt, padding);
  assert.equal(desktopZoom, 1.12);

  // On a mobile device with 360px viewport:
  // (360 - 32) / 595.28 = 328 / 595.28 = 0.55
  const mobileZoom = calculateFitWidthZoom(360, a4WidthPt, padding);
  assert.equal(mobileZoom, 0.55);

  // Handles zero or negative cleanly
  assert.equal(calculateFitWidthZoom(0, a4WidthPt), 1.0);
});

test('viewportZoom legibility: 10pt text in PDF achieves >= 12px CSS on 1280px window with Fit Width', () => {
  const a4WidthPt = 595.28;
  // In 12-col grid, lg:col-span-7 on a 1280px window provides ~710px
  const containerWidth = 710;
  const fitZoom = calculateFitWidthZoom(containerWidth, a4WidthPt, 32);

  const pdfFontSizePt = 10;
  // 1 PDF point = 1/72 inch; 1 CSS pixel = 1/96 inch -> 1 pt = 96/72 = 1.333 CSS px
  const cssPixels = pdfFontSizePt * fitZoom * (96 / 72);

  assert.ok(
    cssPixels >= 12,
    `Rendered text size (${cssPixels.toFixed(2)} px) must be >= 12 px CSS for readability`
  );
});
