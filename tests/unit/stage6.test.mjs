/**
 * stage6.test.mjs - Unit tests for Tahap 6 (OCR Engine, Searchable PDF & Model Management)
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { loadPdfJsDocument } from '../../src/core/pdf.js';

const ROOT = path.resolve(import.meta.dirname, '../..');
import {
  parsePageRange,
  sanitizeTextForPdf,
  formatOcrText,
  buildSearchablePdf
} from '../../src/modules/ocr.js';

test('Tahap 6: parsePageRange parses single and multi-page range strings', () => {
  // Empty or whitespace returns all pages
  assert.deepEqual(parsePageRange('', 5), [0, 1, 2, 3, 4]);
  assert.deepEqual(parsePageRange('   ', 5), [0, 1, 2, 3, 4]);

  // Specific ranges and individual pages
  assert.deepEqual(parsePageRange('1-3, 5', 6), [0, 1, 2, 4]);
  assert.deepEqual(parsePageRange('2, 4-5', 6), [1, 3, 4]);

  // Out of bounds filtering
  assert.deepEqual(parsePageRange('1, 10', 3), [0]);

  // Reverse range normalization (e.g. 3-1)
  assert.deepEqual(parsePageRange('3-1', 4), [0, 1, 2]);
});

test('Tahap 6: sanitizeTextForPdf keeps WinAnsi Latin characters and removes incompatible glyphs', () => {
  assert.equal(sanitizeTextForPdf(''), '');
  assert.equal(sanitizeTextForPdf('Halo Dunia 123!'), 'Halo Dunia 123!');
  assert.equal(sanitizeTextForPdf('Café & Résumé (100%)'), 'Café & Résumé (100%)');

  // Emoji replaced safely without throwing
  const withEmoji = sanitizeTextForPdf('Surat Resmi 😊 Nomor 45');
  assert.ok(!withEmoji.includes('😊'));
  assert.ok(withEmoji.includes('Surat Resmi'));
  assert.ok(withEmoji.includes('Nomor 45'));
});

test('Tahap 6: formatOcrText produces clean formatted plain text and accurate statistics', () => {
  const sampleResults = [
    {
      pageIndex: 0,
      text: 'Kementerian Keuangan Republik Indonesia',
      words: [
        { text: 'Kementerian', confidence: 95 },
        { text: 'Keuangan', confidence: 93 },
        { text: 'Republik', confidence: 92 },
        { text: 'Indonesia', confidence: 96 }
      ]
    },
    {
      pageIndex: 1,
      text: 'Laporan Tahunan Pajak Penghasilan',
      words: [
        { text: 'Laporan', confidence: 90 },
        { text: 'Tahunan', confidence: 88 },
        { text: 'Pajak', confidence: 91 },
        { text: 'Penghasilan', confidence: 89 }
      ]
    }
  ];

  const formatted = formatOcrText(sampleResults, { includeSeparators: true });

  assert.equal(formatted.totalWords, 8);
  assert.equal(formatted.totalChars, 66);
  // Average of (95+93+92+96 + 90+88+91+89) / 8 = 734 / 8 = 91.75 -> 92
  assert.equal(formatted.avgConfidence, 92);
  assert.ok(formatted.fullText.includes('Kementerian Keuangan Republik Indonesia'));
  assert.ok(formatted.fullText.includes('Laporan Tahunan Pajak Penghasilan'));
  assert.ok(formatted.fullText.includes('---'));
});

test('Tahap 6: buildSearchablePdf embeds invisible text layer verifiable by PDF.js', async () => {
  // 1. Create a blank 1-page PDF document
  const baseDoc = await PDFDocument.create();
  const page = baseDoc.addPage([600, 800]);
  const originalBytes = await baseDoc.save();

  // 2. Mock OCR recognition result on a 1200x1600 canvas (scale = 2.0)
  const ocrResults = [
    {
      pageIndex: 0,
      canvasWidth: 1200,
      canvasHeight: 1600,
      text: 'DOKUMEN RAHASIA NEGARA 2026',
      words: [
        { text: 'DOKUMEN', bbox: { x0: 100, y0: 100, x1: 250, y1: 140 } },
        { text: 'RAHASIA', bbox: { x0: 260, y0: 100, x1: 400, y1: 140 } },
        { text: 'NEGARA', bbox: { x0: 410, y0: 100, x1: 540, y1: 140 } },
        { text: '2026', bbox: { x0: 550, y0: 100, x1: 620, y1: 140 } }
      ]
    }
  ];

  // 3. Build Searchable PDF
  const searchablePdfBytes = await buildSearchablePdf(originalBytes, ocrResults);
  assert.ok(searchablePdfBytes.length > originalBytes.length);

  // 4. Extract text using PDF.js to verify text layer searchability
  const loadedDoc = await loadPdfJsDocument(searchablePdfBytes);
  assert.equal(loadedDoc.numPages, 1);

  const loadedPage = await loadedDoc.getPage(1);
  const textContent = await loadedPage.getTextContent();
  const extractedWords = textContent.items.map((item) => item.str).join(' ');

  assert.ok(extractedWords.includes('DOKUMEN'));
  assert.ok(extractedWords.includes('RAHASIA'));
  assert.ok(extractedWords.includes('NEGARA'));
  assert.ok(extractedWords.includes('2026'));
});

test('Tahap 6: the build wires both OCR language models', () => {
  const build = fs.readFileSync(path.join(ROOT, 'build.mjs'), 'utf8');
  // Lite variant must stub both globals, full variant must inject both base64 models.
  assert.match(build, /__OCR_FULL_ENG_GZ_BASE64__/);
  assert.match(build, /__OCR_FULL_IND_GZ_BASE64__/);
  assert.equal((build.match(/__OCR_FULL_ENG_GZ_BASE64__/g) || []).length >= 2, true);
  assert.equal((build.match(/__OCR_FULL_IND_GZ_BASE64__/g) || []).length >= 2, true);
});
