/**
 * scan-to-pdf.test.mjs - Unit tests for scan-to-pdf filters and processing
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { applyScanFilter } from '../../src/features/scan-to-pdf/logic/applyScanFilter.js';

test('scan-to-pdf: original filter returns data unchanged', () => {
  const pixelData = new Uint8ClampedArray([255, 100, 50, 255]);
  const imgData = { data: pixelData, width: 1, height: 1 };
  applyScanFilter(imgData, 'original');

  assert.equal(pixelData[0], 255);
  assert.equal(pixelData[1], 100);
  assert.equal(pixelData[2], 50);
});

test('scan-to-pdf: grayscale filter correctly computes luminance for pixels', () => {
  // Pure Red: 0.299 * 255 = 76
  const redData = new Uint8ClampedArray([255, 0, 0, 255]);
  applyScanFilter({ data: redData, width: 1, height: 1 }, 'grayscale');
  assert.equal(redData[0], 76);
  assert.equal(redData[1], 76);
  assert.equal(redData[2], 76);

  // Pure White: 255, 255, 255
  const whiteData = new Uint8ClampedArray([255, 255, 255, 255]);
  applyScanFilter({ data: whiteData, width: 1, height: 1 }, 'grayscale');
  assert.equal(whiteData[0], 255);
  assert.equal(whiteData[1], 255);
  assert.equal(whiteData[2], 255);
});

test('scan-to-pdf: bw filter binarizes pixels to strict black or white', () => {
  // 2x1 pixel matrix: [Dark, Light]
  const matrix = new Uint8ClampedArray([
    30, 30, 30, 255,   // Dark pixel (lum < 128)
    200, 200, 200, 255 // Light pixel (lum > 128)
  ]);

  applyScanFilter({ data: matrix, width: 2, height: 1 }, 'bw');

  // Dark pixel becomes pure black
  assert.equal(matrix[0], 0);
  assert.equal(matrix[1], 0);
  assert.equal(matrix[2], 0);

  // Light pixel becomes pure white
  assert.equal(matrix[4], 255);
  assert.equal(matrix[5], 255);
  assert.equal(matrix[6], 255);
});

test('scan-to-pdf: enhance filter boosts document contrast and bleaches background', () => {
  const matrix = new Uint8ClampedArray([
    40, 40, 40, 255,   // Dark text pixel
    210, 210, 210, 255 // Off-white paper background
  ]);

  applyScanFilter({ data: matrix, width: 2, height: 1 }, 'enhance');

  // Dark text is darkened
  assert.ok(matrix[0] < 40);

  // Background is bleached pure white (255)
  assert.equal(matrix[4], 255);
  assert.equal(matrix[5], 255);
  assert.equal(matrix[6], 255);
});

test('scan-to-pdf: invalid data throws informative error', () => {
  assert.throws(() => {
    applyScanFilter(null, 'grayscale');
  }, /tidak valid/);
});
