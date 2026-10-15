/**
 * word-to-pdf.test.mjs - Unit tests for Word (DOCX) to PDF conversion
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { docxToHtml } from '../../src/features/word-to-pdf/logic/docxToHtml.js';

test('word-to-pdf: converts synthetic DOCX to sanitized HTML structure', async () => {
  // Create synthetic docx
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'Judul Dokumen Resmi',
            heading: HeadingLevel.HEADING_1
          }),
          new Paragraph({
            children: [
              new TextRun('Paragraf pertama dengan teks biasa dan '),
              new TextRun({ text: 'teks tebal penting.', bold: true })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun('Poin kesimpulan dokumen.')
            ]
          })
        ]
      }
    ]
  });

  const buffer = await Packer.toArrayBuffer(doc);
  assert.ok(buffer.byteLength > 500);

  const { html, rawHtml } = await docxToHtml(buffer);
  assert.ok(typeof html === 'string');
  assert.ok(html.includes('Judul Dokumen Resmi'));
  assert.ok(html.includes('teks tebal penting.'));
  assert.ok(html.includes('Poin kesimpulan dokumen.'));
  assert.ok(html.includes('<strong>') || html.includes('<b>') || rawHtml.includes('strong'));
});

test('word-to-pdf: rejects empty or invalid buffer', async () => {
  await assert.rejects(
    () => docxToHtml(new Uint8Array(0)),
    /Berkas Word/
  );
  await assert.rejects(
    () => docxToHtml(null),
    /Berkas Word/
  );
});
