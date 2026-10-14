/**
 * tests/unit/merge.test.mjs - Unit Tests for Merge Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { mergePdfFiles } from '../../src/modules/merge.js';

test('merge: successfully merges multiple PDF documents', async () => {
  // Create 1-page PDF
  const docA = await PDFDocument.create();
  docA.addPage([500, 700]);
  const bytesA = await docA.save();

  // Create 2-page PDF
  const docB = await PDFDocument.create();
  docB.addPage([500, 700]);
  docB.addPage([500, 700]);
  const bytesB = await docB.save();

  // Create 3-page PDF
  const docC = await PDFDocument.create();
  docC.addPage([500, 700]);
  docC.addPage([500, 700]);
  docC.addPage([500, 700]);
  const bytesC = await docC.save();

  let progressReported = 0;
  const mergedBytes = await mergePdfFiles(
    [
      { name: 'docA.pdf', buffer: bytesA },
      { name: 'docB.pdf', buffer: bytesB },
      { name: 'docC.pdf', buffer: bytesC }
    ],
    (pct) => {
      progressReported = pct;
    }
  );

  assert.ok(mergedBytes instanceof Uint8Array);
  assert.equal(progressReported, 100);

  // Verify merged document page count
  const verifyDoc = await PDFDocument.load(mergedBytes);
  assert.equal(verifyDoc.getPageCount(), 1 + 2 + 3); // 6 pages total
});

test('merge: throws error when less than 2 files are provided', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([400, 600]);
  const bytes = await doc.save();

  await assert.rejects(
    async () => {
      await mergePdfFiles([{ name: 'single.pdf', buffer: bytes }]);
    },
    /Minimal 2 file PDF dibutuhkan/
  );
});
