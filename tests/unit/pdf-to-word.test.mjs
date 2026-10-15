/**
 * pdf-to-word.test.mjs - Unit tests for PDF to Word (DOCX) conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Document, Packer } from 'docx';
import mammoth from 'mammoth';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { buildParagraphs } from '../../src/features/pdf-to-word/logic/buildParagraphs.js';
import { convertPdfToWord } from '../../src/features/pdf-to-word/logic/convertPdfToWord.js';

test('pdf-to-word: buildParagraphs generates docx elements from lines and packs cleanly', async () => {
  const lines = [
    { text: 'Laporan Triwulan Keuangan', fontSize: 24, isBold: true },
    { text: '• Ringkasan eksekutif', fontSize: 12, isBold: false },
    { text: '• Target pertumbuhan tercapai', fontSize: 12, isBold: false },
    {
      text: 'Divisi Pendapatan',
      fontSize: 12,
      isBold: false,
      items: [
        { str: 'Divisi', x: 50, width: 40 },
        { str: 'Pendapatan', x: 150, width: 60 }
      ]
    },
    {
      text: 'Teknologi 1.5M',
      fontSize: 12,
      isBold: false,
      items: [
        { str: 'Teknologi', x: 50, width: 40 },
        { str: '1.5M', x: 150, width: 30 }
      ]
    },
    { text: 'Dokumen ini disusun secara otomatis tanpa ketergantungan pihak ketiga.', fontSize: 12, isBold: false }
  ];

  const elements = buildParagraphs(lines);
  assert.ok(elements.length >= 4);

  // Verify it packs to a valid docx document
  const doc = new Document({ sections: [{ children: elements }] });
  const buf = await Packer.toArrayBuffer(doc);
  assert.ok(buf.byteLength > 1000);

  // Verify readability with mammoth
  const extracted = await mammoth.extractRawText({ buffer: buf });
  assert.ok(extracted.value.includes('Laporan Triwulan Keuangan'));
  assert.ok(extracted.value.includes('Ringkasan eksekutif'));
  assert.ok(extracted.value.includes('Divisi'));
  assert.ok(extracted.value.includes('Teknologi'));
});

test('pdf-to-word: integration test - converts PDF to DOCX readable by mammoth', async () => {
  // 1. Create a synthetic 1-page PDF
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const page = pdfDoc.addPage([595, 842]);
  page.drawText('Dokumen Uji Konversi Word', { x: 50, y: 750, size: 20, font });
  page.drawText('Paragraf penjelasan dokumen hasil konversi.', { x: 50, y: 700, size: 12, font });
  const pdfBytes = await pdfDoc.save();

  // 2. Convert to DOCX
  const result = await convertPdfToWord(pdfBytes);
  assert.equal(result.pageCount, 1);
  assert.ok(result.docxBytes instanceof Uint8Array);
  assert.ok(result.docxBytes.byteLength > 2000);

  // 3. Read back with mammoth
  const readBack = await mammoth.extractRawText({ buffer: result.docxBytes });
  assert.ok(readBack.value.includes('Dokumen Uji Konversi Word'));
  assert.ok(readBack.value.includes('Paragraf penjelasan dokumen hasil konversi.'));
});

test('pdf-to-word: rejects empty buffer', async () => {
  await assert.rejects(async () => {
    await convertPdfToWord(new Uint8Array(0));
  }, /kosong/);
});
