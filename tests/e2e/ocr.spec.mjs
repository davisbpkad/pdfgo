/**
 * ocr.spec.mjs - The OCR tool is the slowest workflow (WASM + language models),
 * so it lives in its own file with a long timeout.
 */
import { test, expect, openTool, upload, mainButton, clickAndDownload, downloadBytes, pdfInfo, zipEntries } from './helpers.mjs';
import { textPdf, imagePng, scannedPdf } from './fixtures.mjs';

test.describe('ocr workflow', () => {
  // Tesseract WASM plus the language models need well over the default budget.
  test.setTimeout(300000);

  test('positive: a scanned image is recognised and exported as searchable PDF and text', async ({ page }) => {
    await openTool(page, 'ocr');
    await upload(page, [imagePng], '.png');

    const start = mainButton(page, /Mulai .*Pengenalan Teks/i);
    await expect(start).toBeEnabled({ timeout: 60000 });
    await start.click();

    await expect(page.getByText(/kata •/)).toBeVisible({ timeout: 240000 });

    const pdfDownload = await clickAndDownload(page, /Unduh PDF/i);
    expect(pdfDownload.suggestedFilename()).toBe('gambar_searchable.pdf');
    const info = await pdfInfo(await downloadBytes(pdfDownload));
    expect(info.pages).toBe(1);
    expect(info.text.trim().length).toBeGreaterThan(0);

    const txtDownload = await clickAndDownload(page, /Unduh berkas teks/i);
    expect(txtDownload.suggestedFilename()).toBe('gambar_ocr.txt');
    const text = Buffer.from(await downloadBytes(txtDownload)).toString('utf8');
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('negative: a text PDF is not treated as a scan', async ({ page }) => {
    await openTool(page, 'ocr');
    await upload(page, textPdf, '.pdf');

    await expect(mainButton(page, /Mulai .*Pengenalan Teks/i)).toBeEnabled({ timeout: 60000 });
    await expect(page.getByText(/kata •/)).toHaveCount(0);
  });

  test('positive: a scan handed over from extract-text lands in the queue and can be downloaded', async ({ page }) => {
    await openTool(page, 'extract-text');
    await upload(page, [scannedPdf], '.pdf');

    // Image-only PDF: the text tool recognises it as a scan and offers the OCR hand-off.
    const handOff = mainButton(page, /Buka Modul OCR/i);
    await expect(handOff).toBeVisible({ timeout: 30000 });
    await handOff.click();

    await expect(page.locator('main h1')).toHaveText(/OCR/i);
    const start = mainButton(page, /Mulai .*Pengenalan Teks/i);
    await expect(start).toBeEnabled({ timeout: 60000 });
    await start.click();
    await expect(page.getByText(/kata •/)).toBeVisible({ timeout: 240000 });

    // The finished result is attached to the queued file, so the queue can download it.
    await page.getByRole('button', { name: /Antrean/ }).click();
    const zip = page.getByRole('button', { name: /Unduh Semua/ });
    await expect(zip).toBeEnabled();

    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 25000 }),
      zip.click()
    ]);
    expect(download.suggestedFilename()).toMatch(/Batch_\d+\.zip$/);
    expect(zipEntries(await downloadBytes(download))).toEqual(['scan.pdf']);
  });
});
