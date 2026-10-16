/**
 * ocr.spec.mjs - The OCR tool is the slowest workflow (WASM + language models),
 * so it lives in its own file with a long timeout.
 */
import { test, expect, openTool, upload, mainButton, clickAndDownload, downloadBytes, pdfInfo } from './helpers.mjs';
import { textPdf, imagePng } from './fixtures.mjs';

test.describe('ocr workflow', () => {
  // Tesseract WASM plus the language models need well over the default budget.
  test.setTimeout(300000);

  test('positive: a scanned image is recognised and exported as searchable PDF and text', async ({ page }) => {
    await openTool(page, 'ocr');
    await upload(page, [imagePng], '.png');

    const start = mainButton(page, /Mulai proses pengenalan teks/i);
    await expect(start).toBeEnabled({ timeout: 60000 });
    await start.click();

    await expect(page.getByText(/kata •/)).toBeVisible({ timeout: 240000 });

    const pdfDownload = await clickAndDownload(page, /Unduh PDF searchable/i);
    expect(pdfDownload.suggestedFilename()).toBe('gambar_searchable.pdf');
    const info = await pdfInfo(await downloadBytes(pdfDownload));
    expect(info.pages).toBe(1);
    expect(info.text.trim().length).toBeGreaterThan(0);

    const txtDownload = await clickAndDownload(page, /Unduh berkas .txt/i);
    expect(txtDownload.suggestedFilename()).toBe('gambar_ocr.txt');
    const text = Buffer.from(await downloadBytes(txtDownload)).toString('utf8');
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('negative: a text PDF is not treated as a scan', async ({ page }) => {
    await openTool(page, 'ocr');
    await upload(page, textPdf, '.pdf');

    await expect(mainButton(page, /Mulai proses pengenalan teks/i)).toBeEnabled({ timeout: 60000 });
    await expect(page.getByText(/kata •/)).toHaveCount(0);
  });
});
