/**
 * tests/unit/merge.test.mjs - Unit Tests for Merge Engine
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import { mergePdfFiles } from '../../src/features/merge/logic/mergePdfFiles.js';
import { loadPdfJsDocument } from '../../src/core/pdf.js';

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

test('merge: preserves input ArrayBuffer without detachment for subsequent operations', async () => {
  const docA = await PDFDocument.create();
  docA.addPage([500, 700]);
  const uintA = await docA.save();
  const bufferA = uintA.buffer.slice(uintA.byteOffset, uintA.byteOffset + uintA.byteLength);

  const docB = await PDFDocument.create();
  docB.addPage([500, 700]);
  const uintB = await docB.save();
  const bufferB = uintB.buffer.slice(uintB.byteOffset, uintB.byteOffset + uintB.byteLength);

  const originalLenA = bufferA.byteLength;
  const originalLenB = bufferB.byteLength;

  // Simulate PDF.js load
  const proxyA = await loadPdfJsDocument(bufferA);
  const proxyB = await loadPdfJsDocument(bufferB);
  assert.equal(proxyA.numPages, 1);
  assert.equal(proxyB.numPages, 1);

  // Assert buffers remain attached and have full length
  assert.equal(bufferA.byteLength, originalLenA);
  assert.equal(bufferB.byteLength, originalLenB);

  // Merge using the same buffers
  const mergedBytes = await mergePdfFiles([
    { name: 'a.pdf', buffer: bufferA },
    { name: 'b.pdf', buffer: bufferB }
  ]);

  assert.ok(mergedBytes instanceof Uint8Array);
  const verifyDoc = await PDFDocument.load(mergedBytes);
  assert.equal(verifyDoc.getPageCount(), 2);
});

test('merge: automatically recovers if buffer is detached or empty by reading from entry.file', async () => {
  const docA = await PDFDocument.create();
  docA.addPage([500, 700]);
  const uintA = await docA.save();

  const docB = await PDFDocument.create();
  docB.addPage([500, 700]);
  const uintB = await docB.save();

  // Mock File objects that provide arrayBuffer()
  const mockFileA = {
    arrayBuffer: async () => uintA.buffer.slice(uintA.byteOffset, uintA.byteOffset + uintA.byteLength)
  };
  const mockFileB = {
    arrayBuffer: async () => uintB.buffer.slice(uintB.byteOffset, uintB.byteOffset + uintB.byteLength)
  };

  // Simulate detached buffer (0 byteLength)
  const emptyOrDetachedBuffer = new ArrayBuffer(0);

  const mergedBytes = await mergePdfFiles([
    { name: 'DB.pdf', buffer: emptyOrDetachedBuffer, file: mockFileA },
    { name: 'docB.pdf', buffer: emptyOrDetachedBuffer, file: mockFileB }
  ]);

  assert.ok(mergedBytes instanceof Uint8Array);
  const verifyDoc = await PDFDocument.load(mergedBytes);
  assert.equal(verifyDoc.getPageCount(), 2);
});


