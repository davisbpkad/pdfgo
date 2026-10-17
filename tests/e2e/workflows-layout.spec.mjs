/**
 * workflows-layout.spec.mjs - Full workflows of the layout and text tools:
 * load a document, act, download, and check the bytes that came out.
 */
import { test, expect, openTool, upload, waitLoaded, mainButton, clickAndDownload, downloadBytes, pdfInfo, countImageXObjects, pdfTextFieldValue } from './helpers.mjs';
import { textPdf, twoPagePdf, formPdf } from './fixtures.mjs';

test.describe('layout workflows', () => {
  test('merge: two documents become one file with every page', async ({ page }) => {
    await openTool(page, 'merge');
    await upload(page, [twoPagePdf, textPdf]);

    const download = await clickAndDownload(page, /Gabung 2 file/i);
    expect(download.suggestedFilename()).toMatch(/^PDFToolkit_Merged_\d+\.pdf$/);

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(3);
    expect(info.text).toContain('Halaman 1');
    expect(info.text).toContain('Halo dunia dokumen uji');
    await expect(page.getByText('Dokumen berhasil digabungkan!')).toBeVisible();
  });

  test('split: a one-page range really yields one page', async ({ page }) => {
    await openTool(page, 'split');
    await upload(page, twoPagePdf);
    await waitLoaded(page, /Pisahkan sekarang/i);
    await page.locator('main input[type=text]').first().fill('1');

    const download = await clickAndDownload(page, /Pisahkan sekarang/i);
    expect(download.suggestedFilename()).toBe('pages2_hal_1.pdf');
    expect((await pdfInfo(await downloadBytes(download))).pages).toBe(1);
  });

  test('split: an invalid range is refused instead of producing a file', async ({ page }) => {
    await openTool(page, 'split');
    await upload(page, twoPagePdf);
    await waitLoaded(page, /Pisahkan sekarang/i);
    await page.locator('main input[type=text]').first().fill('abc');

    await mainButton(page, /Pisahkan sekarang/i).click();
    await expect(page.getByText('Format rentang halaman tidak valid')).toBeVisible();
    await expect(page.getByText(/berhasil/i)).toHaveCount(0);
  });

  test('organize: a rotated page keeps its rotation in the saved file', async ({ page }) => {
    await openTool(page, 'organize');
    await upload(page, twoPagePdf);
    await mainButton(page, /↻ 90°/).click();

    const download = await clickAndDownload(page, /Simpan dokumen/i);
    expect(download.suggestedFilename()).toBe('pages2_organized.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(2);
    expect(info.rotations[0]).toBe(90);
    expect(info.rotations[1]).toBe(0);
  });

  test('organize: deleting every page is refused', async ({ page }) => {
    await openTool(page, 'organize');
    await upload(page, twoPagePdf);
    await mainButton(page, '🗑').click();
    await mainButton(page, '🗑').click();

    await expect(page.getByText(/minimal 1 halaman/i)).toBeVisible();
  });

  test('page numbers: the stamp is readable in the output', async ({ page }) => {
    await openTool(page, 'page-numbers');
    await upload(page, twoPagePdf);

    const download = await clickAndDownload(page, /Terapkan nomor halaman/i);
    expect(download.suggestedFilename()).toBe('pages2_numbered.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(2);
    expect(info.text).toContain('Halaman 1 dari 2');
    expect(info.text).toContain('Halaman 2 dari 2');
  });

  test('watermark: the text is present on every page', async ({ page }) => {
    await openTool(page, 'watermark');
    await upload(page, twoPagePdf);

    const download = await clickAndDownload(page, /Terapkan watermark/i);
    expect(download.suggestedFilename()).toBe('pages2_watermark.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(2);
    expect(info.text).toContain('CONFIDENTIAL');
  });

  test('compress: the result stays a readable PDF', async ({ page }) => {
    test.slow();
    await openTool(page, 'compress');
    await upload(page, twoPagePdf);
    await page.getByText('Seimbang').first().click();

    const download = await clickAndDownload(page, /Kompres .*sekarang/i);
    expect(download.suggestedFilename()).toBe('pages2_compressed.pdf');

    // Compression re-encodes each page as an image, so the page count and the
    // embedded images are what prove the content survived.
    const bytes = await downloadBytes(download);
    const info = await pdfInfo(bytes);
    expect(info.pages).toBe(2);
    expect(await countImageXObjects(bytes)).toBeGreaterThanOrEqual(2);
  });

  test('extract text: the .txt holds the document text', async ({ page }) => {
    await openTool(page, 'extract-text');
    await upload(page, textPdf);

    const download = await clickAndDownload(page, /Unduh berkas .txt/i);
    expect(download.suggestedFilename()).toBe('text_teks.txt');

    const text = Buffer.from(await downloadBytes(download)).toString('utf8');
    expect(text).toContain('Halo dunia dokumen uji');
    expect(text).toContain('Baris kedua untuk diubah');
  });

  test('fill form: a typed value lands in the saved PDF', async ({ page }) => {
    await openTool(page, 'form');
    await upload(page, formPdf);
    await waitLoaded(page, /Simpan PDF terisi/i);

    await page.locator('main input[type=text]').first().fill('Budi Santoso');
    const download = await clickAndDownload(page, /Simpan PDF terisi/i);
    expect(download.suggestedFilename()).toBe('formulir_filled.pdf');

    // The value is stored in the AcroForm field, so read it back with pdf-lib.
    const bytes = await downloadBytes(download);
    expect((await pdfInfo(bytes)).pages).toBe(1);
    expect(await pdfTextFieldValue(bytes, 'nama_lengkap')).toBe('Budi Santoso');
  });
});
