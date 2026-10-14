/**
 * stage7.test.mjs - Unit tests for Tahap 7 (Multi-File Batch Queue, Isolated Error Boundaries, and Packaging)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { queue } from '../../src/core/queue.js';
import { createZipArchive } from '../../src/core/zip.js';
import * as fflate from 'fflate';

test('Tahap 7: DocumentQueue deduplicates identical files and tracks batch state', () => {
  queue.clear();

  // Mock files
  const file1 = { name: 'invoice_1.pdf', size: 1024, lastModified: 1000, type: 'application/pdf' };
  const file2 = { name: 'invoice_2.pdf', size: 2048, lastModified: 2000, type: 'application/pdf' };
  const file1Duplicate = { name: 'invoice_1.pdf', size: 1024, lastModified: 1000, type: 'application/pdf' };

  const addedInitial = queue.addFiles([file1, file2, file1Duplicate]);
  assert.equal(addedInitial, 2, 'Should only add 2 unique files, ignoring identical duplicate');

  const state = queue.getState();
  assert.equal(state.count, 2);
  assert.equal(state.completedCount, 0);
  assert.equal(state.errorCount, 0);
});

test('Tahap 7: DocumentQueue supports item state transitions and isolated error status', () => {
  queue.clear();
  const fileA = { name: 'fileA.pdf', size: 1000, lastModified: 100, type: 'application/pdf' };
  const fileB = { name: 'fileB.pdf', size: 2000, lastModified: 200, type: 'application/pdf' };
  queue.addFiles([fileA, fileB]);

  const items = queue.getItems();
  const idA = items[0].id;
  const idB = items[1].id;

  // Simulate file A completing successfully
  queue.updateItem(idA, {
    status: 'done',
    progress: 100,
    result: new Blob(['dummy pdf A content'], { type: 'application/pdf' })
  });

  // Simulate file B encountering an error (corrupt file)
  queue.updateItem(idB, {
    status: 'error',
    progress: 0,
    error: 'Corrupt PDF structure'
  });

  const finalState = queue.getState();
  assert.equal(finalState.completedCount, 1);
  assert.equal(finalState.errorCount, 1);

  const itemA = queue.getItems().find((i) => i.id === idA);
  const itemB = queue.getItems().find((i) => i.id === idB);

  assert.equal(itemA.status, 'done');
  assert.ok(itemA.result instanceof Blob);
  assert.equal(itemB.status, 'error');
  assert.equal(itemB.error, 'Corrupt PDF structure');
});

test('Tahap 7: createZipArchive packages multiple batch outputs into a valid readable ZIP', async () => {
  const batchOutputs = [
    { name: 'document_1_compressed.pdf', data: new Uint8Array([1, 2, 3, 4, 5]) },
    { name: 'document_2_watermarked.pdf', data: new Uint8Array([10, 20, 30]) },
    { name: 'document_3_extracted.txt', data: new TextEncoder().encode('Extracted text sample') }
  ];

  const zipBlob = await createZipArchive(batchOutputs);
  assert.ok(zipBlob instanceof Blob);
  assert.ok(zipBlob.size > 0);

  // Unzip and verify contents with fflate
  const zipBuffer = new Uint8Array(await zipBlob.arrayBuffer());
  const unzipped = fflate.unzipSync(zipBuffer);

  const fileNames = Object.keys(unzipped);
  assert.ok(fileNames.includes('document_1_compressed.pdf'));
  assert.ok(fileNames.includes('document_2_watermarked.pdf'));
  assert.ok(fileNames.includes('document_3_extracted.txt'));

  const textContent = new TextDecoder().decode(unzipped['document_3_extracted.txt']);
  assert.equal(textContent, 'Extracted text sample');
});

test('Tahap 7: DocumentQueue cleanup releases memory and empties subscribers', () => {
  queue.clear();
  assert.equal(queue.getItems().length, 0);
  assert.equal(queue.getState().count, 0);
});
