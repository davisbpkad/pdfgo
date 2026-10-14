/**
 * tests/unit/core.test.mjs - Unit Tests for Pure Logic Functions
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { t, setLang, getLang } from '../../src/core/i18n.js';
import { queue } from '../../src/core/queue.js';
import { convertUiCoordsToPdfCoords } from '../../src/core/pdf.js';

test('i18n: translations and interpolation', () => {
  setLang('id');
  assert.equal(getLang(), 'id');
  assert.equal(t('app.name'), 'PDF To Go');
  assert.equal(t('queue.totalFiles', { count: 5 }), '5 file');

  setLang('en');
  assert.equal(getLang(), 'en');
  assert.equal(t('queue.totalFiles', { count: 5 }), '5 files');
  assert.equal(t('tools.merge.title'), 'Merge PDF');

  // Reset to ID
  setLang('id');
});

test('queue: deduplication and state tracking', () => {
  queue.clear();
  assert.equal(queue.getState().count, 0);

  // Fake file object
  const dummyFile1 = {
    name: 'test.pdf',
    size: 1024,
    lastModified: 1000,
    type: 'application/pdf'
  };

  const dummyFile2 = {
    name: 'test.pdf',
    size: 1024,
    lastModified: 1000,
    type: 'application/pdf'
  };

  const dummyFile3 = {
    name: 'another.pdf',
    size: 2048,
    lastModified: 2000,
    type: 'application/pdf'
  };

  const added1 = queue.addFiles([dummyFile1]);
  assert.equal(added1, 1);

  // Duplicate should not be added
  const added2 = queue.addFiles([dummyFile2]);
  assert.equal(added2, 0);
  assert.equal(queue.getState().count, 1);

  // New file should be added
  const added3 = queue.addFiles([dummyFile3]);
  assert.equal(added3, 1);
  assert.equal(queue.getState().count, 2);

  // Remove first file
  const firstId = queue.getItems()[0].id;
  queue.removeItem(firstId);
  assert.equal(queue.getState().count, 1);
  assert.equal(queue.getItems()[0].name, 'another.pdf');

  queue.clear();
  assert.equal(queue.getState().count, 0);
});

test('pdf: coordinate conversion from UI top-left to PDF bottom-left', () => {
  const pageWidth = 600;
  const pageHeight = 800;
  const elementWidth = 100;
  const elementHeight = 50;

  // 0 degree rotation: Top-left UI (0, 0) should be PDF (x=0, y=800-50=750)
  const coords0 = convertUiCoordsToPdfCoords(0, 0, elementWidth, elementHeight, pageWidth, pageHeight, 0);
  assert.equal(coords0.x, 0);
  assert.equal(coords0.y, 750);
  assert.equal(coords0.width, 100);
  assert.equal(coords0.height, 50);

  // Center UI (250, 375) -> y = 800 - 375 - 50 = 375
  const coordsCenter = convertUiCoordsToPdfCoords(250, 375, elementWidth, elementHeight, pageWidth, pageHeight, 0);
  assert.equal(coordsCenter.x, 250);
  assert.equal(coordsCenter.y, 375);
});
