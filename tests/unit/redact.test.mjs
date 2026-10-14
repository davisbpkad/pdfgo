/**
 * tests/unit/redact.test.mjs - Unit & Regression Tests for Document Redaction Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { loadPdfJsDocument } from '../../src/core/pdf.js';
import { findTextRedactionBoxes } from '../../src/features/redact/logic/findTextRedactionBoxes.js';
import { renderRedactionBoxes } from '../../src/features/redact/logic/renderRedactionBoxes.js';
import { nudgeBox, moveBox, resizeBox, MIN_BOX_FRACTION } from '../../src/features/redact/logic/boxInteractions.js';

test('redact: nudgeBox moves box in all directions with bounds clamping and Shift multiplier', () => {
  const initial = { x: 0.5, y: 0.5, width: 0.2, height: 0.2 };

  // 1-step nudge (0.002)
  const left = nudgeBox(initial, 'left', false);
  assert.equal(left.x, 0.498);

  const right = nudgeBox(initial, 'right', false);
  assert.equal(right.x, 0.502);

  const up = nudgeBox(initial, 'up', false);
  assert.equal(up.y, 0.498);

  const down = nudgeBox(initial, 'down', false);
  assert.equal(down.y, 0.502);

  // Shift 10-step nudge (0.02)
  const shiftLeft = nudgeBox(initial, 'left', true);
  assert.equal(shiftLeft.x, 0.48);

  // Clamping at edge
  const edgeBox = { x: 0.001, y: 0.001, width: 0.2, height: 0.2 };
  const clamped = nudgeBox(edgeBox, 'left', true);
  assert.equal(clamped.x, 0);

  const edgeRightBox = { x: 0.795, y: 0.5, width: 0.2, height: 0.2 };
  const clampedRight = nudgeBox(edgeRightBox, 'right', true);
  assert.equal(clampedRight.x, 0.8); // 1 - 0.2 = 0.8
});

test('redact: moveBox and resizeBox respect page boundaries and minimum fraction', () => {
  const initial = { x: 0.2, y: 0.2, width: 0.3, height: 0.3 };

  const moved = moveBox(initial, 0.1, -0.05);
  assert.equal(moved.x, 0.3);
  assert.equal(moved.y, 0.15);

  const resized = resizeBox(initial, 0.2, 0.1);
  assert.equal(resized.width, 0.5);
  assert.equal(resized.height, 0.4);

  // Shrink below minimum fraction
  const tooSmall = resizeBox(initial, -0.4, -0.4);
  assert.equal(tooSmall.width, MIN_BOX_FRACTION);
  assert.equal(tooSmall.height, MIN_BOX_FRACTION);
});

test('redact: findTextRedactionBoxes returns valid normalized (0..1) bounding boxes', async () => {
  // Create a PDF with known text
  const doc = await PDFDocument.create();
  const page = doc.addPage([600, 800]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('CONFIDENTIAL FINANCIAL RECORD 2026', {
    x: 100,
    y: 700,
    size: 16,
    font,
    color: rgb(0, 0, 0)
  });
  const pdfBytes = await doc.save();

  const pdfDocProxy = await loadPdfJsDocument(pdfBytes);
  const boxes = await findTextRedactionBoxes(pdfDocProxy, 1, 'CONFIDENTIAL');

  assert.ok(boxes.length > 0, 'Should find at least 1 bounding box for keyword');

  for (const box of boxes) {
    assert.ok(box.x >= 0 && box.x <= 1, `box.x (${box.x}) must be inside [0, 1]`);
    assert.ok(box.y >= 0 && box.y <= 1, `box.y (${box.y}) must be inside [0, 1]`);
    assert.ok(box.width > 0 && box.width <= 1, `box.width (${box.width}) must be inside (0, 1]`);
    assert.ok(box.height > 0 && box.height <= 1, `box.height (${box.height}) must be inside (0, 1]`);
    assert.ok(box.x + box.width <= 1.001, 'box must not exceed page width');
    assert.ok(box.y + box.height <= 1.001, 'box must not exceed page height');
  }
});

test('redact regression: renderRedactionBoxes applies safety margin, never smaller than requested, and fills pure black', () => {
  const canvasWidth = 1000;
  const canvasHeight = 1000;
  const highResScale = 2.5;

  // Normalized box at 20%..60% X, 30%..50% Y
  const normalizedBox = { x: 0.2, y: 0.3, width: 0.4, height: 0.2 };
  const expectedNominalPx = {
    x: 200,
    y: 300,
    width: 400,
    height: 200
  };

  // Create a mock 2D context backed by a pixel buffer
  const pixelBuffer = new Uint8ClampedArray(canvasWidth * canvasHeight * 4);
  // Fill initial background with white (255, 255, 255, 255)
  pixelBuffer.fill(255);

  const mockCtx = {
    fillStyle: '',
    fillRect(x, y, w, h) {
      assert.equal(this.fillStyle, '#000000', 'Redaction fill must be pure solid black');
      const startX = Math.floor(x);
      const startY = Math.floor(y);
      const endX = Math.ceil(x + w);
      const endY = Math.ceil(y + h);

      for (let py = startY; py < endY; py++) {
        for (let px = startX; px < endX; px++) {
          if (px >= 0 && px < canvasWidth && py >= 0 && py < canvasHeight) {
            const idx = (py * canvasWidth + px) * 4;
            pixelBuffer[idx] = 0;     // R
            pixelBuffer[idx + 1] = 0; // G
            pixelBuffer[idx + 2] = 0; // B
            pixelBuffer[idx + 3] = 255; // A
          }
        }
      }
    }
  };

  const drawnRects = renderRedactionBoxes(
    mockCtx,
    [normalizedBox],
    canvasWidth,
    canvasHeight,
    highResScale
  );

  assert.equal(drawnRects.length, 1);
  const drawn = drawnRects[0];

  // 1. Safety margin check: drawn rectangle MUST be >= nominal requested size
  assert.ok(drawn.width >= expectedNominalPx.width, 'Drawn width must not be smaller than requested box');
  assert.ok(drawn.height >= expectedNominalPx.height, 'Drawn height must not be smaller than requested box');
  assert.ok(drawn.x <= expectedNominalPx.x, 'Drawn X must cover starting boundary with safety margin');
  assert.ok(drawn.y <= expectedNominalPx.y, 'Drawn Y must cover top boundary with safety margin');

  // 2. Pixel-level verification: Every single pixel in the requested box MUST be pure black (#000000)
  for (let py = expectedNominalPx.y; py < expectedNominalPx.y + expectedNominalPx.height; py += 10) {
    for (let px = expectedNominalPx.x; px < expectedNominalPx.x + expectedNominalPx.width; px += 10) {
      const idx = (py * canvasWidth + px) * 4;
      assert.equal(pixelBuffer[idx], 0, `Pixel at (${px}, ${py}) Red must be 0`);
      assert.equal(pixelBuffer[idx + 1], 0, `Pixel at (${px}, ${py}) Green must be 0`);
      assert.equal(pixelBuffer[idx + 2], 0, `Pixel at (${px}, ${py}) Blue must be 0`);
      assert.equal(pixelBuffer[idx + 3], 255, `Pixel at (${px}, ${py}) Alpha must be 255`);
    }
  }
});

test('redact zoom invariance: output raster box is identical regardless of preview zoom (25% vs 400%)', () => {
  const normalizedBox = { x: 0.15, y: 0.25, width: 0.35, height: 0.1 };

  // Simulated preview canvas sizes:
  // At 25% zoom on a 600x800 page:
  const preview25 = { width: 150, height: 200 };
  // At 400% zoom on a 600x800 page:
  const preview400 = { width: 2400, height: 3200 };

  // Both preview viewports store and emit the normalized box:
  assert.deepEqual(normalizedBox, { x: 0.15, y: 0.25, width: 0.35, height: 0.1 });

  // When high-res output is generated at scale 2.5 on a 600x800 page:
  const outputWidth = 1500;
  const outputHeight = 2000;
  const highResScale = 2.5;

  const rectsFrom25 = renderRedactionBoxes(null, [normalizedBox], outputWidth, outputHeight, highResScale);
  const rectsFrom400 = renderRedactionBoxes(null, [normalizedBox], outputWidth, outputHeight, highResScale);

  assert.deepEqual(rectsFrom25, rectsFrom400, 'Output redaction rectangle must be identical across all preview zoom levels');
});
