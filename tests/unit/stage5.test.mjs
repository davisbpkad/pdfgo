/**
 * stage5.test.mjs - High-risk engines: true redaction and compression.
 *
 * These run in Node, where there is no canvas, so the page renderer is injected:
 * the real renderer needs document.createElement('canvas').
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { loadPdfJsDocument } from '../../src/core/pdf.js';
import { executeTrueRedaction } from '../../src/features/redact/logic/executeTrueRedaction.js';
import { compressPdfDocument } from '../../src/features/compress/logic/compressPdfDocument.js';

// 1x1 white PNG / JPEG, enough for pdf-lib to embed a real image XObject.
const TINY_PNG = Uint8Array.from(Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
  'base64'
));
const TINY_JPEG = Uint8Array.from(Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64'
));

/** Stand-in for renderPageToCanvas: a canvas-like object whose toBlob returns real bytes. */
function fakeCanvas(bytes, mime) {
  const ctx = { fillStyle: '', fillRect() {} };
  const canvas = {
    width: 100,
    height: 100,
    getContext: () => ctx,
    toBlob: (resolve) => resolve(new Blob([bytes], { type: mime }))
  };
  return { canvas, width: 100, height: 100 };
}

const fakeRenderer = (bytes, mime) => async () => fakeCanvas(bytes, mime);

async function pdfWithText(lines, pageCount = lines.length) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 0; i < pageCount; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(lines[i] ?? `HALAMAN ${i + 1}`, { x: 50, y: 700, size: 16, font });
  }
  return doc.save();
}

async function pageTexts(bytes) {
  const doc = await loadPdfJsDocument(bytes);
  const out = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    out.push(content.items.map((item) => item.str).join(' '));
  }
  await doc.destroy();
  return out;
}

test('redact: redacted text is not extractable from the output', async () => {
  const source = await pdfWithText(['RAHASIA NEGARA']);
  const result = await executeTrueRedaction(
    source,
    null,
    { 0: [{ x: 0.05, y: 0.1, width: 0.5, height: 0.08 }] },
    1,
    true,
    null,
    fakeRenderer(TINY_PNG, 'image/png')
  );

  const texts = await pageTexts(result);
  assert.equal(texts.length, 1);
  assert.ok(!texts[0].includes('RAHASIA'), `redacted text still extractable: "${texts[0]}"`);
  assert.ok(String.fromCharCode(...result.slice(0, 5)) === '%PDF-');
});

test('redact: metadata is wiped by the real pipeline', async () => {
  const doc = await PDFDocument.create();
  doc.setTitle('Secret Financial Report');
  doc.setAuthor('John Confidential');
  doc.setProducer('Internal Scanner');
  doc.setCreator('Some Editor');
  doc.addPage([500, 700]);
  const source = await doc.save();

  const result = await executeTrueRedaction(source, null, {}, 1, true, null, fakeRenderer(TINY_PNG, 'image/png'));
  const verify = await PDFDocument.load(result);

  assert.ok(!verify.getTitle());
  assert.ok(!verify.getAuthor());
  assert.ok(!verify.getSubject());
  assert.ok(!verify.getCreator());
  // pdf-lib stamps its own Producer on save; what matters is that the original is gone.
  assert.ok(!String(verify.getProducer() || '').includes('Internal Scanner'));
});

test('redact: untouched pages stay vector copies with readable text', async () => {
  const source = await pdfWithText(['RAHASIA', 'HALAMAN AMAN'], 2);
  const result = await executeTrueRedaction(
    source,
    null,
    { 0: [{ x: 0.05, y: 0.1, width: 0.5, height: 0.08 }] },
    1,
    true,
    null,
    fakeRenderer(TINY_PNG, 'image/png')
  );

  const texts = await pageTexts(result);
  assert.equal(texts.length, 2);
  assert.ok(!texts[0].includes('RAHASIA'));
  assert.ok(texts[1].includes('HALAMAN AMAN'), 'untouched page lost its text layer');
});

test('compress: output is a valid PDF and the reported reduction matches the sizes', async () => {
  const source = await pdfWithText(['Dokumen untuk dikompres'], 2);
  const pdfDocProxy = { numPages: 2 };

  const result = await compressPdfDocument(
    source,
    pdfDocProxy,
    { dpiScale: 1, quality: 0.7 },
    null,
    fakeRenderer(TINY_JPEG, 'image/jpeg')
  );

  assert.equal(String.fromCharCode(...result.bytes.slice(0, 5)), '%PDF-');
  const reloaded = await PDFDocument.load(result.bytes);
  assert.equal(reloaded.getPageCount(), 2);

  assert.equal(result.originalSize, source.byteLength);
  assert.equal(result.compressedSize, result.bytes.byteLength);
  assert.equal(
    result.reductionRate,
    Math.round(((result.originalSize - result.compressedSize) / result.originalSize) * 100)
  );
});
