/**
 * tests/unit/editPdfText.test.mjs - Inline document text editing + WASM preflight
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { groupItemsIntoLines } from '../../src/features/edit-pdf/logic/extractEditableText.js';
import {
  applyText,
  countChanged,
  createTextEdit,
  fitFontSize,
  isChanged,
  isCleared,
  resetAll,
  resetEdit,
  splitLines
} from '../../src/features/edit-pdf/logic/textEditInteractions.js';
import { renderTextEditsToPdf } from '../../src/features/edit-pdf/logic/renderTextEditsToPdf.js';
import { checkWasmSupport, classifyWasmError } from '../../src/core/wasmCheck.js';

const CONTAINER = { width: 600, height: 800 };

test('editText: groups items on the same baseline into one editable line', () => {
  const items = [
    { str: 'Halo', x: 10, y: 100, width: 30, height: 10, fontSize: 10, isBold: false },
    { str: 'Dunia', x: 45, y: 100.5, width: 35, height: 10, fontSize: 10, isBold: false },
    { str: 'Baris kedua', x: 10, y: 140, width: 70, height: 10, fontSize: 10, isBold: false }
  ];

  const lines = groupItemsIntoLines(items, CONTAINER);

  assert.equal(lines.length, 2);
  assert.equal(lines[0].text, 'Halo Dunia');
  assert.equal(lines[1].text, 'Baris kedua');
  assert.equal(lines[0].original, 'Halo Dunia');
  assert.ok(lines[0].width > 0 && lines[0].height > 0);
  assert.ok(lines[0].x >= 0 && lines[0].x <= 1 && lines[0].y >= 0 && lines[0].y <= 1);
});

test('editText: joins without a space when characters are adjacent', () => {
  const items = [
    { str: 'Pem', x: 10, y: 50, width: 20, height: 10, fontSize: 10, isBold: false },
    { str: 'daftar', x: 30, y: 50, width: 30, height: 10, fontSize: 10, isBold: false }
  ];
  const lines = groupItemsIntoLines(items, CONTAINER);
  assert.equal(lines[0].text, 'Pemdaftar');
});

test('editText: empty input returns no lines', () => {
  assert.deepEqual(groupItemsIntoLines([], CONTAINER), []);
  assert.deepEqual(groupItemsIntoLines(null, CONTAINER), []);
});

test('editText: detects typing changes, deletions and resets', () => {
  const edit = createTextEdit({ id: 'a', text: 'Nama Lama', original: 'Nama Lama', fontSize: 11 });
  assert.equal(isChanged(edit), false);

  const typed = applyText(edit, 'Nama Baru');
  assert.equal(isChanged(typed), true);
  assert.equal(isCleared(typed), false);

  const cleared = applyText(edit, '   ');
  assert.equal(isChanged(cleared), true);
  assert.equal(isCleared(cleared), true);

  assert.equal(resetEdit(typed).text, 'Nama Lama');
  assert.equal(countChanged({ 0: [typed, edit], 1: [applyText(edit, 'x')] }), 2);
  assert.equal(countChanged(resetAll({ 0: [typed, edit] })), 0);
});

test('editText: CRLF typing is treated as unchanged', () => {
  const edit = createTextEdit({ id: 'b', text: 'baris satu\nbaris dua' });
  assert.equal(isChanged(applyText(edit, 'baris satu\r\nbaris dua')), false);
  assert.deepEqual(splitLines('a\r\nb'), ['a', 'b']);
});

test('editText: fitFontSize shrinks until the text fits, never below the minimum', () => {
  const measure = (text, size) => text.length * size * 0.5; // monospace-ish
  const fitted = fitFontSize(measure, 'x'.repeat(40), 100, 12);
  assert.ok(fitted < 12);
  assert.ok(measure('x'.repeat(40), fitted) <= 100 + 0.25);

  const clamped = fitFontSize(measure, 'x'.repeat(4000), 10, 12);
  assert.equal(clamped, 5);
});

test('editText: renderTextEditsToPdf covers and retypes without changing page count', async () => {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  page.drawText('Judul Lama', { x: 60, y: 700, size: 16, font });
  const sourceBytes = await doc.save();

  const edits = {
    0: [
      { id: 't0', text: 'Judul Baru', original: 'Judul Lama', x: 0.1, y: 0.15, width: 0.3, height: 0.03, fontSize: 16, isBold: true },
      { id: 't1', text: '', original: 'Dihapus', x: 0.1, y: 0.25, width: 0.2, height: 0.03, fontSize: 12, isBold: false },
      { id: 't2', text: 'Tidak diubah', original: 'Tidak diubah', x: 0.1, y: 0.35, width: 0.2, height: 0.03, fontSize: 12, isBold: false }
    ]
  };

  const result = await renderTextEditsToPdf(sourceBytes, edits);

  assert.equal(result.editCount, 2, 'only changed lines are applied');
  assert.equal(result.clearedCount, 1, 'cleared line is covered only');
  assert.ok(result.pdfBytes.byteLength > 0);

  const reloaded = await PDFDocument.load(result.pdfBytes);
  assert.equal(reloaded.getPageCount(), 1);
});

test('wasmCheck: classifies the CSP blocking error from the OCR report', () => {
  const cspError = new Error(
    "WebAssembly.instantiate(): Compiling or instantiating WebAssembly module violates the following Content Security policy directive because 'unsafe-eval' is not an allowed source of script in the following Content Security Policy directive: \"script-src 'self' 'unsafe-inline' blob:\"."
  );
  assert.equal(classifyWasmError(cspError), 'csp');
  assert.equal(classifyWasmError(new Error('CompileError: wasm Module compile failed')), 'compile');
  assert.equal(classifyWasmError(new Error('something else')), 'unknown');
});

test('wasmCheck: minimal module compiles in this runtime', async () => {
  const result = await checkWasmSupport();
  assert.equal(result.ok, true, result.message);
  assert.equal(result.reason, 'ok');
});
