/**
 * fixtures.mjs - Generates the PDF fixtures the browser tests upload.
 * Written to tests/e2e/.fixtures (gitignored) so no binaries live in the repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '.fixtures');

export const FIXTURE_DIR = DIR;
export const textPdf = path.join(DIR, 'text.pdf');
export const twoPagePdf = path.join(DIR, 'pages2.pdf');
export const notAPdf = path.join(DIR, 'bukan-pdf.txt');

export async function writeFixtures() {
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(notAPdf, 'ini bukan pdf, hanya teks biasa\n');

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595.28, 841.89]);
  page.drawText('Halo dunia dokumen uji', { x: 60, y: 720, size: 18, font, color: rgb(0, 0, 0) });
  page.drawText('Baris kedua untuk diubah', { x: 60, y: 680, size: 14, font, color: rgb(0, 0, 0) });
  fs.writeFileSync(textPdf, await doc.save());

  const doc2 = await PDFDocument.create();
  const font2 = await doc2.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= 2; i++) {
    const p = doc2.addPage([595.28, 841.89]);
    p.drawText(`Halaman ${i}`, { x: 60, y: 720, size: 24, font: font2, color: rgb(0, 0, 0) });
  }
  fs.writeFileSync(twoPagePdf, await doc2.save());
}
