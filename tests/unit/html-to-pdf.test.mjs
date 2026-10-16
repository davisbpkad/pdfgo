/**
 * html-to-pdf.test.mjs - Unit tests for HTML to PDF sanitization and canvas pagination
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeHtml } from '../../src/features/html-to-pdf/logic/sanitizeHtml.js';
import { calculateCanvasPagination } from '../../src/features/html-to-pdf/logic/paginateCanvas.js';
import { buildPrintableHtml } from '../../src/features/html-to-pdf/logic/printHtmlDocument.js';

test('html-to-pdf: sanitizeHtml strips scripts, iframes and dangerous tags', () => {
  const dirty = `
    <div>
      <h1>Clean Title</h1>
      <script>alert('xss');</script>
      <iframe src="https://example.com"></iframe>
      <p>Content preserved</p>
    </div>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('<script>'));
  assert.ok(!clean.includes('alert'));
  assert.ok(!clean.includes('<iframe'));
  assert.ok(clean.includes('Clean Title'));
  assert.ok(clean.includes('Content preserved'));
});

test('html-to-pdf: sanitizeHtml strips inline event handlers and javascript: urls', () => {
  const dirty = `
    <button onclick="steal()" onmouseover="track()">Click</button>
    <a href="javascript:void(0)">Link</a>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('onclick'));
  assert.ok(!clean.includes('onmouseover'));
  assert.ok(!clean.includes('javascript:'));
  assert.ok(clean.includes('href="#"'));
});

test('html-to-pdf: sanitizeHtml neutralizes external src and url() to keep offline-safe', () => {
  const dirty = `
    <img src="https://tracking.com/pixel.gif" alt="Test" />
    <div style="background-image: url('https://remote.com/bg.png');">Box</div>
  `;
  const clean = sanitizeHtml(dirty);
  assert.ok(!clean.includes('https://tracking.com/pixel.gif'));
  assert.ok(!clean.includes('https://remote.com/bg.png'));
  assert.ok(clean.includes('src=""'));
});

test('html-to-pdf: sanitizeHtml blocks markup that bypassed the old regex denylist', () => {
  const payloads = [
    '<script>alert(1)',                                     // unclosed script
    '<a href=javascript:alert(1)>x</a>',                    // unquoted protocol
    '<a href="javascript&colon;alert(1)">x</a>',            // entity-encoded protocol
    '<meta http-equiv=refresh content="0;url=https://evil.com">',
    '<link rel=stylesheet href="https://evil.com/x.css">',
    '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">',
    '<img src=x onerror=alert(1)>'                          // event handler without quotes
  ];
  for (const payload of payloads) {
    const clean = sanitizeHtml(payload);
    assert.ok(!/<script/i.test(clean), `script survived: ${clean}`);
    assert.ok(!/<meta/i.test(clean), `meta survived: ${clean}`);
    assert.ok(!/<link/i.test(clean), `link survived: ${clean}`);
    assert.ok(!/javascript:/i.test(clean), `javascript: survived: ${clean}`);
    assert.ok(!/evil\.com/i.test(clean), `external host survived: ${clean}`);
    assert.ok(!/\son\w+\s*=/i.test(clean), `event handler survived: ${clean}`);
  }
});

test('html-to-pdf: sanitizeHtml keeps safe markup, data URIs and table structure', () => {
  const clean = sanitizeHtml(`
    <table><tr><th colspan="2">Judul</th></tr><tr><td>Isi</td><td>Lagi</td></tr></table>
    <p style="color: red">Teks <strong>tebal</strong></p>
    <img src="data:image/png;base64,AAAA" alt="gambar" width="100">
    <div style="background: url(data:image/png;base64,BBBB)">Box</div>
  `);
  assert.ok(clean.includes('<table>'));
  assert.ok(clean.includes('colspan="2"'));
  assert.ok(clean.includes('<strong>tebal</strong>'));
  assert.ok(clean.includes('src="data:image/png;base64,AAAA"'));
  assert.ok(clean.includes('alt="gambar"'));
  assert.ok(clean.includes('width="100"'));
  assert.ok(clean.includes("url(data:image/png;base64,BBBB)"));
  assert.ok(clean.includes('Judul'));
});

test('html-to-pdf: calculateCanvasPagination calculates A4 slices accurately', () => {
  const canvasWidth = 794; // approx A4 96dpi
  // If height is 2246 (approx 2 A4 pages at 794 width)
  const canvasHeight = 2246;
  const slices = calculateCanvasPagination(canvasWidth, canvasHeight, 0.707);

  assert.equal(slices.length, 2);
  assert.equal(slices[0].pageNum, 1);
  assert.equal(slices[0].sy, 0);
  assert.equal(slices[0].width, 794);
  assert.equal(slices[1].pageNum, 2);
  assert.ok(slices[1].sy > 0);
  assert.equal(slices[0].totalPages, 2);
});

test('html-to-pdf: buildPrintableHtml produces complete printable document', () => {
  const fragment = '<h2>My Report</h2><p>Report details</p>';
  const doc = buildPrintableHtml(fragment);

  assert.ok(doc.includes('<!DOCTYPE html>'));
  assert.ok(doc.includes('@page { size: A4; margin: 15mm; }'));
  assert.ok(doc.includes('<h2>My Report</h2>'));
  assert.ok(doc.includes('<p>Report details</p>'));
});
