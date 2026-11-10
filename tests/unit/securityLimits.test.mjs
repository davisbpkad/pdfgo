import test from 'node:test';
import assert from 'node:assert/strict';
import { zipSync, strToU8 } from 'fflate';
import { convertPptxToPdf } from '../../src/features/powerpoint-to-pdf/logic/convertPptxToPdf.js';
import { renderPageToCanvas } from '../../src/core/pdf.js';

test('PPTX rejects excessive archive entries before conversion', async () => {
  const entries = Object.fromEntries(Array.from({ length: 2001 }, (_, i) => [`entry${i}`, strToU8('x')]));
  await assert.rejects(convertPptxToPdf(zipSync(entries)), /Arsip PPTX melebihi batas aman/);
});

test('PPTX rejects oversized expanded entries without allocating their declared size', async () => {
  const archive = zipSync({ 'entry.xml': strToU8('small') });
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  for (let i = 0; i < archive.length - 24; i++) {
    if (view.getUint32(i, true) === 0x02014b50) {
      view.setUint32(i + 24, 33 * 1024 * 1024, true);
      break;
    }
  }
  await assert.rejects(convertPptxToPdf(archive), /Arsip PPTX melebihi batas aman/);
});

test('PPTX rejects excessive total expansion, input size, and slide count', async () => {
  const archive = zipSync(Object.fromEntries(Array.from({ length: 4 }, (_, i) => [`entry${i}`, strToU8('small')])));
  const view = new DataView(archive.buffer, archive.byteOffset, archive.byteLength);
  for (let i = 0; i < archive.length - 24; i++) {
    if (view.getUint32(i, true) === 0x02014b50) view.setUint32(i + 24, 30 * 1024 * 1024, true);
  }
  await assert.rejects(convertPptxToPdf(archive), /Arsip PPTX melebihi batas aman/);
  await assert.rejects(convertPptxToPdf({ byteLength: 51 * 1024 * 1024 }), /50 MB/);
  const slides = Object.fromEntries(Array.from({ length: 501 }, (_, i) => [`ppt/slides/slide${i + 1}.xml`, strToU8('<slide/>')]));
  await assert.rejects(convertPptxToPdf(zipSync(slides)), /500 slide/);
});

test('PDF rendering bounds large pages and preserves normal page scale', async () => {
  const previous = globalThis.document;
  globalThis.document = { createElement: () => ({ getContext: () => ({}) }) };
  try {
    for (const [width, height, expected] of [[600, 800, 1.5], [60000, 80000, 4096 / 80000]]) {
      let usedScale;
      const page = {
        getViewport: ({ scale }) => { usedScale = scale; return { width: width * scale, height: height * scale }; },
        render: () => ({ promise: Promise.resolve() })
      };
      const result = await renderPageToCanvas({ getPage: async () => page });
      assert.equal(usedScale, expected);
      assert.ok(result.width <= 4096 && result.height <= 4096);
    }
    await assert.rejects(renderPageToCanvas({ getPage: async () => ({ getViewport: () => ({ width: NaN, height: 10 }) }) }), /tidak valid/);
  } finally {
    globalThis.document = previous;
  }
});
