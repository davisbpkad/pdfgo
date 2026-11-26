/**
 * workflows-convert.spec.mjs - Full conversion workflows, output checked by
 * reading the produced file back with the same libraries the app uses.
 */
import { test, expect, openTool, upload, clickButton, clickAndDownload, downloadBytes, pdfInfo, zipEntries, pngSize, xlsxSheetText, docxText, pptxSlideCount } from './helpers.mjs';
import { textPdf, twoPagePdf, imagePng, docxFile, pptxFile, xlsxFile } from './fixtures.mjs';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { unzipSync, strFromU8 } from 'fflate';

test.describe('conversion workflows', () => {
  test('image to pdf: one image becomes a one-page PDF', async ({ page }) => {
    await openTool(page, 'image-to-pdf');
    await upload(page, [imagePng], 'image/png');

    const download = await clickAndDownload(page, /Buat Dokumen PDF/i);
    expect(download.suggestedFilename()).toBe('gambar-ke-pdf.pdf');
    expect((await pdfInfo(await downloadBytes(download))).pages).toBe(1);
  });

  test('image to pdf: clicking while the image bytes are still loading does not fail', async ({ page }) => {
    // Slow the browser's file read down so the click lands mid-load, the way it
    // does with big phone photos.
    await page.addInitScript(() => {
      const original = File.prototype.arrayBuffer;
      File.prototype.arrayBuffer = function () {
        return new Promise((resolve) => setTimeout(() => resolve(original.call(this)), 400));
      };
    });

    await openTool(page, 'image-to-pdf');
    await upload(page, [imagePng], 'image/png');

    // Click immediately instead of waiting for the read to finish.
    const download = await clickAndDownload(page, /Buat Dokumen PDF/i);
    expect((await pdfInfo(await downloadBytes(download))).pages).toBe(1);
    await expect(page.getByText(/masih dimuat/)).toHaveCount(0);
  });

  test('pdf to image: two pages become a ZIP with two real PNGs', async ({ page }) => {
    await openTool(page, 'pdf-to-image');
    await upload(page, twoPagePdf);

    const download = await clickAndDownload(page, /Konversi ke Gambar/i);
    expect(download.suggestedFilename()).toBe('pages2_gambar_ZIP.zip');

    // The toast shows the message itself, never a raw t('...') call.
    await expect(page.getByRole('status')).toContainText('Berhasil mengekstrak 2 gambar!');

    const bytes = await downloadBytes(download);
    const entries = zipEntries(bytes).filter((n) => n.endsWith('.png'));
    expect(entries).toHaveLength(2);

    const { unzipSync } = await import('fflate');
    const first = unzipSync(bytes)[entries[0]];
    const size = pngSize(first);
    expect(size.width).toBeGreaterThan(100);
    expect(size.height).toBeGreaterThan(100);
  });

  test('pdf to markdown: the .md carries the document text', async ({ page }) => {
    await openTool(page, 'pdf-to-markdown');
    await upload(page, textPdf);

    await clickButton(page, /Konversi ke markdown/i);
    const download = await clickAndDownload(page, /Unduh \.md/i);
    expect(download.suggestedFilename()).toBe('text.md');

    const md = Buffer.from(await downloadBytes(download)).toString('utf8');
    expect(md).toContain('Halo dunia dokumen uji');
  });

  test('pdf to word: the .docx opens and holds the text', async ({ page }) => {
    await openTool(page, 'pdf-to-word');
    await upload(page, textPdf);

    await clickButton(page, /Simpan sebagai word/i);
    const download = await clickAndDownload(page, /Unduh dokumen word/i);
    expect(download.suggestedFilename()).toBe('text.docx');
    expect(await docxText(await downloadBytes(download))).toContain('Halo dunia dokumen uji');
  });

  test('pdf to word: offline conversion keeps cover, table geometry and editable text without duplicates', async ({ page }) => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);
    const cover = pdf.addPage([595, 842]);
    cover.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0, 0.6, 0.6) });
    const body = pdf.addPage([595, 842]);
    body.drawLine({ start: { x: 72, y: 500 }, end: { x: 520, y: 500 }, thickness: 1 });
    for (const [text, x] of [['Dimensi', 78], ['Sebelum', 182], ['Sesudah', 352]]) {
      body.drawText(text, { x, y: 478, size: 12, font });
    }
    const external = [];
    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (/^https?:/.test(url) && !url.startsWith('http://127.0.0.1:')) {
        external.push(url);
        return route.abort();
      }
      return route.continue();
    });
    await openTool(page, 'pdf-to-word');
    await upload(page, { name: 'layout.pdf', mimeType: 'application/pdf', buffer: Buffer.from(await pdf.save()) });
    await expect(page.locator('main input[type=checkbox]')).toBeChecked();
    await clickButton(page, /Simpan sebagai word/i);
    const download = await clickAndDownload(page, /Unduh dokumen word/i);
    const bytes = await downloadBytes(download);
    const zip = unzipSync(bytes);
    const xml = strFromU8(zip['word/document.xml']);
    expect(xml.match(/<w:sectPr>/g)).toHaveLength(2);
    expect(xml.match(/<w:framePr /g)).toHaveLength(3);
    expect(Object.keys(zip).filter((name) => /word\/media\/.*\.png$/.test(name))).toHaveLength(2);
    expect(xml.match(/>Dimensi</g)).toHaveLength(1);
    expect(xml).toContain('w:x="1560"');
    expect(xml).toContain('behindDoc="1"');
    expect(await docxText(bytes)).toContain('Sesudah');
    expect(external).toEqual([]);
    // The graphics-only background must not contain a second raster copy of editable text.
    const images = Object.keys(zip).filter((name) => /word\/media\/.*\.png$/.test(name));
    const pixels = await page.evaluate(async (base64) => {
      const image = new Image();
      image.src = `data:image/png;base64,${base64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const data = context.getImageData(110, 530, 650, 25).data;
      return [...data].filter((value, index) => index % 4 !== 3 && value < 240).length;
    }, Buffer.from(zip[images[1]]).toString('base64'));
    expect(pixels).toBe(0);
  });

  test('pdf to powerpoint: the .pptx holds one slide per page', async ({ page }) => {
    await openTool(page, 'pdf-to-powerpoint');
    await upload(page, twoPagePdf);

    await clickButton(page, /Simpan sebagai powerpoint/i);
    const download = await clickAndDownload(page, /Unduh presentasi powerpoint/i);
    expect(download.suggestedFilename()).toBe('pages2.pptx');

    const bytes = await downloadBytes(download);
    expect(pptxSlideCount(bytes)).toBe(2);
    expect(zipEntries(bytes)).toContain('[Content_Types].xml');
  });

  test('pdf to excel: the .xlsx opens with the extracted text', async ({ page }) => {
    await openTool(page, 'pdf-to-excel');
    await upload(page, twoPagePdf);

    await clickButton(page, /Ekspor ke excel/i);
    const download = await clickAndDownload(page, /Unduh berkas excel/i);
    expect(download.suggestedFilename()).toBe('pages2.xlsx');
    expect(await xlsxSheetText(await downloadBytes(download))).toContain('Halaman 1');
  });

  test('excel to pdf: the spreadsheet cells reach the PDF', async ({ page }) => {
    await openTool(page, 'excel-to-pdf');
    await upload(page, xlsxFile, '.xlsx');

    await clickButton(page, /Simpan sebagai pdf/i);
    const download = await clickAndDownload(page, /Unduh dokumen pdf/i);
    expect(download.suggestedFilename()).toBe('tabel.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBeGreaterThan(0);
    expect(info.text).toContain('KOD-1');
  });

  test('powerpoint to pdf: the slide text reaches the PDF', async ({ page }) => {
    await openTool(page, 'powerpoint-to-pdf');
    await upload(page, pptxFile, '.pptx');

    await clickButton(page, /Simpan sebagai pdf/i);
    const download = await clickAndDownload(page, /Unduh dokumen pdf/i);
    expect(download.suggestedFilename()).toBe('slide.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(1);
    expect(info.text).toContain('Slide Uji Konversi');
  });

  test('scan to pdf: an image becomes a PDF', async ({ page }) => {
    await openTool(page, 'scan-to-pdf');
    await upload(page, [imagePng], 'image/*');

    await clickButton(page, /Pindai jadi pdf/i);
    const download = await clickAndDownload(page, /Unduh hasil/i);
    expect(download.suggestedFilename()).toBe('dokumen-pindai.pdf');
    expect((await pdfInfo(await downloadBytes(download))).pages).toBe(1);
  });

  test('negative: a PDF uploaded where an image is expected does not crash the tool', async ({ page }) => {
    await openTool(page, 'image-to-pdf');
    await upload(page, [textPdf], 'image/png');

    await expect(page.locator('main h1')).toHaveCount(1);
    await expect(page.getByText(/Buat Dokumen PDF/i)).toHaveCount(0);
  });
});
