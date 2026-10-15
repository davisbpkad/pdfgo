/**
 * edit-pdf.test.mjs - Unit tests for Edit PDF / Add Objects feature
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  nudgeObject,
  moveObject,
  resizeObject,
  clampNormalized,
  createDefaultObject
} from '../../src/features/edit-pdf/logic/objectInteractions.js';
import { renderOverlayToPdf } from '../../src/features/edit-pdf/logic/renderOverlayToPdf.js';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../src/core/pdf.js';

test('edit-pdf: objectInteractions handles nudge, move, and resize with boundary clamping', () => {
  const initial = { x: 0.1, y: 0.1, width: 0.2, height: 0.1 };

  // Nudge right
  const nudgedRight = nudgeObject(initial, 'right', false);
  assert.equal(nudgedRight.x, 0.102);

  // Nudge left with shift
  const nudgedLeftShift = nudgeObject(initial, 'left', true);
  assert.equal(nudgedLeftShift.x, 0.08);

  // Move within page
  const moved = moveObject(initial, 0.05, 0.05);
  assert.equal(moved.x, 0.15);
  assert.equal(moved.y, 0.15);

  // Clamping move at page borders
  const movedOOB = moveObject(initial, 0.9, 0.9);
  assert.equal(movedOOB.x, 0.8); // 1 - width (0.2)
  assert.equal(movedOOB.y, 0.9); // 1 - height (0.1)

  // Resize clamping
  const resized = resizeObject(initial, 0.1, 0.1);
  assert.equal(resized.width, 0.3);
  assert.equal(resized.height, 0.2);

  // createDefaultObject provides valid initial properties for all types
  const types = ['text', 'whiteout', 'rect', 'ellipse', 'line', 'arrow', 'draw', 'image'];
  for (const t of types) {
    const obj = createDefaultObject(t);
    assert.equal(obj.type, t);
    assert.ok(obj.id.startsWith('obj_'));
    assert.ok(obj.width > 0);
    assert.ok(obj.height > 0);
  }
});

test('edit-pdf: renderOverlayToPdf overlays objects and text is readable at requested coordinates', async () => {
  // 1. Create a blank 1-page PDF
  const baseDoc = await PDFDocument.create();
  baseDoc.addPage([595.28, 841.89]);
  const basePdfBytes = await baseDoc.save();

  // 2. Add overlay objects: Text, Whiteout, Rect, and Line
  const objectsByPage = {
    0: [
      createDefaultObject('whiteout', { x: 0.1, y: 0.1, width: 0.4, height: 0.05 }),
      createDefaultObject('text', {
        x: 0.15,
        y: 0.2,
        width: 0.3,
        height: 0.05,
        text: 'Teks Tersemat Akurat',
        fontSize: 16
      }),
      createDefaultObject('rect', { x: 0.1, y: 0.3, width: 0.3, height: 0.1, borderColor: '#ff0000' }),
      createDefaultObject('line', { x: 0.1, y: 0.45, width: 0.2, height: 0.02 })
    ]
  };

  const { pdfBytes, pageCount, objectCount } = await renderOverlayToPdf(basePdfBytes, objectsByPage);

  assert.equal(pageCount, 1);
  assert.equal(objectCount, 4);
  assert.ok(pdfBytes instanceof Uint8Array);

  // 3. Verify that the output PDF actually contains the embedded text using PDF.js
  const rawDoc = await loadPdfJsDocument(pdfBytes);
  const doc = unwrapPdfProxy(rawDoc);
  const p1 = await doc.getPage(1);
  const textContent = await p1.getTextContent();
  const allText = textContent.items.map((i) => i.str).join(' ');

  assert.ok(allText.includes('Teks Tersemat Akurat'));
});
