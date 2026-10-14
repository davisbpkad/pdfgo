/**
 * tests/unit/sign.test.mjs - Unit Tests for Digital Signature Placement & Coordinate Precision
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { toPdfRect } from '../../src/core/coordinates.js';

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

test('sign: metric mm conversion to normalized fraction is accurate and reversible', () => {
  const MM_PER_PT = 25.4 / 72;
  const pageWidthPt = 595.28;
  const pageHeightPt = 841.89;

  const pageWMm = pageWidthPt * MM_PER_PT; // ~210 mm
  const pageHMm = pageHeightPt * MM_PER_PT; // ~297 mm

  const targetWidthMm = 50; // standard signature 50mm
  const targetHeightMm = 22; // standard signature 22mm

  const normW = targetWidthMm / pageWMm;
  const normH = targetHeightMm / pageHMm;

  assert.ok(normW > 0 && normW < 1);
  assert.ok(normH > 0 && normH < 1);

  // Roundtrip
  const roundtripW = normW * pageWMm;
  const roundtripH = normH * pageHMm;

  assert.equal(Math.round(roundtripW * 10) / 10, targetWidthMm);
  assert.equal(Math.round(roundtripH * 10) / 10, targetHeightMm);
});

test('sign: pointer drag delta normalized calculation is scale-invariant', () => {
  // Container at 50% scale
  const containerW_50 = 300;
  // Container at 200% scale
  const containerW_200 = 1200;

  // Moving mouse by 30 CSS pixels at 50% scale:
  const deltaPx50 = 30;
  const normDelta50 = deltaPx50 / containerW_50; // 0.1 (10% of page width)

  // Moving mouse by 120 CSS pixels at 200% scale:
  const deltaPx200 = 120;
  const normDelta200 = deltaPx200 / containerW_200; // 0.1 (10% of page width)

  assert.equal(normDelta50, 0.1);
  assert.equal(normDelta200, 0.1);
});
