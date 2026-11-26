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
import { unzipSync, strFromU8 } from 'fflate';
import { createCanvas, loadImage } from '@napi-rs/canvas';

function documentXml(bytes) {
  return strFromU8(unzipSync(new Uint8Array(bytes))['word/document.xml']);
}

test('pdf-to-word: preserves page sizes and separate positioned headings, cells and footers', async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const page = pdf.addPage([595, 842]);
  for (const [text, x, y] of [
    ['I. PENDAHULUAN', 72, 758], ['1.1 Latar Belakang Strategis', 72, 734],
    ['Paragraf pertama.', 72, 710], ['Dimensi', 78, 478],
    ['Kondisi Eksisting', 182, 478], ['Kondisi Target', 352, 478],
    ['Teks lanjutan sel', 182, 462], ['Footer elektronik', 32, 25]
  ]) page.drawText(text, { x, y, size: 12, font });
  pdf.addPage([700, 500]).drawText('Halaman landscape', { x: 40, y: 450, size: 12, font });
  const result = await convertPdfToWord(await pdf.save(), { includeImages: false });
  const xml = documentXml(result.docxBytes);
  assert.match(xml, /w:pgSz[^>]*w:w="11900"[^>]*w:h="16840"/);
  assert.match(xml, /w:pgSz[^>]*w:w="14000"[^>]*w:h="10000"/);
  assert.match(xml, /w:framePr[^>]*w:x="1440"[^>]*w:y="\d+"/);
  assert.equal((xml.match(/<w:framePr /g) || []).length, 9);
  assert.equal((xml.match(/<w:tbl>/g) || []).length, 0);
  assert.ok(!xml.includes('I. PENDAHULUAN 1.1'));
  const readBack = await mammoth.extractRawText({ buffer: result.docxBytes });
  assert.ok(readBack.value.includes('Teks lanjutan sel'));
  assert.ok(readBack.value.includes('Footer elektronik'));
});

test('pdf-to-word: positioned text retains font style without guessing opaque PDF font IDs', async () => {
  const pdf = await PDFDocument.create();
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  pdf.addPage([595, 842]).drawText('Judul tebal', { x: 72, y: 758, size: 12, font: bold });
  const result = await convertPdfToWord(await pdf.save(), { includeImages: false });
  const xml = documentXml(result.docxBytes);
  assert.match(xml, /<w:b\/>/);
  assert.match(xml, /<w:sz w:val="24"\/>/);
});

test('pdf-to-word: serif, monospace and italic text retain matching Word font families', async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const serif = await pdf.embedFont(StandardFonts.TimesRomanItalic);
  const mono = await pdf.embedFont(StandardFonts.Courier);
  page.drawText('Serif miring', { x: 72, y: 758, size: 12, font: serif });
  page.drawText('Kode monospace', { x: 72, y: 730, size: 10, font: mono });
  const xml = documentXml((await convertPdfToWord(await pdf.save(), { includeImages: false })).docxBytes);
  assert.match(xml, /w:ascii="Times New Roman"/);
  assert.match(xml, /w:ascii="Courier New"/);
  assert.match(xml, /<w:i\/>/);
});

test('pdf-to-word: browser canvas path preserves graphics, excludes raster text, reports progress and releases canvases', async () => {
  const previous = globalThis.document;
  const canvases = [];
  globalThis.document = {
    createElement() {
      const canvas = createCanvas(1, 1);
      canvas.toBlob = (callback) => callback(new Blob([canvas.toBuffer('image/png')]));
      canvases.push(canvas);
      return canvas;
    }
  };
  try {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage([200, 300]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    page.drawText('Editable', { x: 20, y: 250, size: 12, font });
    page.drawRectangle({ x: 20, y: 100, width: 50, height: 50 });
    const progress = [];
    const result = await convertPdfToWord(await pdf.save(), { onProgress: (pct) => progress.push(pct) });
    const zip = unzipSync(result.docxBytes);
    const imageName = Object.keys(zip).find((name) => /word\/media\/.*\.png$/.test(name));
    assert.ok(imageName);
    const image = await loadImage(Buffer.from(zip[imageName]));
    const context = createCanvas(image.width, image.height).getContext('2d');
    context.drawImage(image, 0, 0);
    assert.deepEqual([...context.getImageData(35, 70, 1, 1).data], [255, 255, 255, 255]);
    assert.deepEqual([...context.getImageData(35, 240, 1, 1).data], [0, 0, 0, 255]);
    assert.ok(documentXml(result.docxBytes).includes('Editable'));
    assert.deepEqual(progress, [90, 100]);
    assert.equal(canvases[1].width, 0);
    assert.equal(canvases[1].height, 0);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

test('pdf-to-word: canvas encoding failure rejects instead of silently dropping page graphics', async () => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement() {
      const canvas = createCanvas(1, 1);
      canvas.toBlob = (callback) => callback(null);
      return canvas;
    }
  };
  try {
    const pdf = await PDFDocument.create();
    pdf.addPage([200, 300]);
    await assert.rejects(convertPdfToWord(await pdf.save()), /Gagal menyimpan gambar/);
  } finally {
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  }
});

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
