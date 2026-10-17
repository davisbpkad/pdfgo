/**
 * fixtures.mjs - Generates the files the browser tests upload.
 * Written to tests/e2e/.fixtures (gitignored) so no binaries live in the repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph } from 'docx';
import pptxgen from 'pptxgenjs';
import ExcelJS from 'exceljs';
import { encryptPdf } from '../../src/features/protect/logic/encryptPdf.js';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.fixtures');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const textPdf = path.join(DIR, 'text.pdf');
export const twoPagePdf = path.join(DIR, 'pages2.pdf');
export const notAPdf = path.join(DIR, 'bukan-pdf.txt');
export const imagePng = path.join(DIR, 'gambar.png');
export const docxFile = path.join(DIR, 'dokumen.docx');
export const pptxFile = path.join(DIR, 'slide.pptx');
export const xlsxFile = path.join(DIR, 'tabel.xlsx');
export const htmlFile = path.join(DIR, 'halaman.html');
export const lockedPdf = path.join(DIR, 'terkunci.pdf');
export const formPdf = path.join(DIR, 'formulir.pdf');
export const scannedPdf = path.join(DIR, 'scan.pdf');

export const LOCKED_PASSWORD = 'rahasia123';

async function makeTextPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Halo dunia dokumen uji', { x: 60, y: 720, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText('Baris kedua untuk diubah', { x: 60, y: 680, size: 14, font, color: rgb(0, 0, 0) });
  return doc.save();
}

async function makeTwoPagePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 2; i++) {
    const page = doc.addPage([595.28, 841.89]);
    page.drawText(`Halaman ${i}`, { x: 60, y: 720, size: 24, font, color: rgb(0, 0, 0) });
  }
  return doc.save();
}

async function makeFormPdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Formulir Pendaftaran', { x: 60, y: 760, size: 18, font, color: rgb(0, 0, 0) });
  const form = doc.getForm();
  const nama = form.createTextField('nama_lengkap');
  nama.setText('');
  nama.addToPage(page, { x: 60, y: 660, width: 300, height: 24 });
  const setuju = form.createCheckBox('setuju');
  setuju.addToPage(page, { x: 60, y: 620, width: 18, height: 18 });
  return doc.save();
}

async function makeScannedPdf() {
  const doc = await PDFDocument.create();
  const png = await doc.embedPng(fs.readFileSync(imagePng));
  const page = doc.addPage([595.28, 841.89]);
  // Image only, no text layer: this is what makes the tool call it a scan.
  page.drawImage(png, { x: 40, y: 300, width: 500, height: 280 });
  return doc.save();
}

export async function writeFixtures() {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(notAPdf, 'ini bukan pdf, hanya teks biasa\n');
  fs.writeFileSync(htmlFile, '<html><body><h1>Halaman Uji</h1><p>Paragraf untuk konversi.</p></body></html>\n');

  // Reuse a real PNG that already ships with the app instead of hand-building one.
  fs.copyFileSync(path.join(ROOT, 'dist/screenshots/screenshot-mobile-id.png'), imagePng);

  fs.writeFileSync(textPdf, await makeTextPdf());
  fs.writeFileSync(scannedPdf, await makeScannedPdf());
  fs.writeFileSync(twoPagePdf, await makeTwoPagePdf());
  fs.writeFileSync(formPdf, await makeFormPdf());

  const base = await makeTwoPagePdf();
  const encrypted = await encryptPdf(base, { userPassword: LOCKED_PASSWORD });
  fs.writeFileSync(lockedPdf, encrypted.encryptedBytes);

  const doc = new Document({ sections: [{ children: [new Paragraph('Laporan uji konversi Word ke PDF')] }] });
  fs.writeFileSync(docxFile, Buffer.from(await Packer.toArrayBuffer(doc)));

  const PptxGen = pptxgen.default || pptxgen;
  const pres = new PptxGen();
  pres.addSlide().addText('Slide Uji Konversi', { x: 1, y: 1, w: 6, h: 1, fontSize: 20 });
  fs.writeFileSync(pptxFile, await pres.write({ outputType: 'uint8array' }));

  const Pkg = ExcelJS.default || ExcelJS;
  const wb = new Pkg.Workbook();
  const ws = wb.addWorksheet('Laporan Stok');
  ws.addRow(['Kode', 'Deskripsi', 'Kuantitas']);
  ws.addRow(['KOD-1', 'Produk Elektronik', 5]);
  fs.writeFileSync(xlsxFile, await wb.xlsx.writeBuffer());
}
