/**
 * ai-summary.test.mjs - Unit tests for AI Summary and Prompt Builder logic
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  buildAiPrompt,
  estimateTokens,
  TASK_TEMPLATES
} from '../../src/features/ai-summary/logic/formatAiPrompt.js';
import {
  createMarkdownExport,
  createTextExport,
  createPdfExport
} from '../../src/features/ai-summary/logic/exportAiResult.js';

test('ai-summary: estimateTokens calculates approximate token counts correctly', () => {
  assert.equal(estimateTokens(''), 0);
  assert.equal(estimateTokens(null), 0);
  assert.equal(estimateTokens('abcd'), 1);
  assert.equal(estimateTokens('12345678'), 2);
  assert.equal(estimateTokens('Halo dunia, selamat pagi!'), 7);
});

test('ai-summary: buildAiPrompt constructs structured prompts across all task types', () => {
  const sampleText = 'Laporan Keuangan Q3 menunjukkan pertumbuhan pendapatan sebesar 15%.';
  const fileName = 'laporan-keuangan.pdf';

  // Summarize prompt
  const sumPrompt = buildAiPrompt({ fileName, text: sampleText, task: 'summarize' });
  assert.ok(sumPrompt.includes('laporan-keuangan.pdf'));
  assert.ok(sumPrompt.includes(sampleText));
  assert.ok(sumPrompt.includes('Ringkasan Eksekutif'));

  // Translate prompt
  const transPrompt = buildAiPrompt({
    fileName,
    text: sampleText,
    task: 'translate',
    targetLang: 'Bahasa Jepang'
  });
  assert.ok(transPrompt.includes('Bahasa Jepang'));
  assert.ok(transPrompt.includes(sampleText));

  // Action items prompt
  const actionPrompt = buildAiPrompt({ fileName, text: sampleText, task: 'action_items' });
  assert.ok(actionPrompt.includes('daftar tindakan (action items)'));

  // QA prompt
  const qaPrompt = buildAiPrompt({ fileName, text: sampleText, task: 'qa' });
  assert.ok(qaPrompt.includes('5 Pertanyaan kritis'));

  // Custom prompt
  const customPrompt = buildAiPrompt({
    fileName,
    text: sampleText,
    task: 'custom',
    customInstruction: 'Temukan 3 risiko terbesar.'
  });
  assert.ok(customPrompt.includes('Temukan 3 risiko terbesar.'));
});

test('ai-summary: exportAiResult creates valid Markdown and Plaintext exports', () => {
  const text = 'Poin 1: Efisiensi biaya tercapai.\nPoin 2: Margin laba meningkat.';
  const md = createMarkdownExport(text, 'dokumen-analisis.pdf');
  const txt = createTextExport(text, 'dokumen-analisis.pdf');

  assert.equal(md.fileName, 'dokumen-analisis-ringkasan-ai.md');
  assert.equal(txt.fileName, 'dokumen-analisis-ringkasan-ai.txt');

  const decoder = new TextDecoder();
  const mdStr = decoder.decode(md.content);
  assert.ok(mdStr.includes('# Ringkasan AI: dokumen-analisis'));
  assert.ok(mdStr.includes('Efisiensi biaya'));

  const txtStr = decoder.decode(txt.content);
  assert.equal(txtStr, text);
});

test('ai-summary: exportAiResult creates valid readable PDF with pagination and wrapping', async () => {
  const longParagraph = 'Ini adalah baris kalimat panjang yang menguji kemampuan word wrapping dan pemisahan baris otomatis pada engine export PDF tanpa memicu error atau teks keluar batas margin. '.repeat(15);
  const pdfOut = await createPdfExport(longParagraph, 'hasil-rapat.pdf');

  assert.ok(pdfOut.content instanceof Uint8Array);
  assert.ok(pdfOut.content.byteLength > 500);
  assert.equal(pdfOut.fileName, 'hasil-rapat-ringkasan-ai.pdf');

  // Verify readable by pdf-lib
  const parsedPdf = await PDFDocument.load(pdfOut.content);
  assert.ok(parsedPdf.getPageCount() >= 1);
});
