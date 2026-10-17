/**
 * workflows-security.spec.mjs - Sign, redact, unlock and protect, including the
 * negative paths where a wrong password or a mismatch must be refused.
 */
import { test, expect, openTool, upload, mainButton, clickButton, clickAndDownload, downloadBytes, pdfInfo } from './helpers.mjs';
import { loadPdfJsDocument } from '../../src/core/pdf.js';
import { textPdf, twoPagePdf, lockedPdf, LOCKED_PASSWORD } from './fixtures.mjs';

test.describe('security workflows', () => {
  test('sign: a drawn signature is applied and the file is saved', async ({ page }) => {
    await openTool(page, 'sign');
    await upload(page, twoPagePdf);

    await mainButton(page, /Gambar/).click();
    const pad = page.locator('main canvas').first();
    const box = await pad.boundingBox();
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 90, box.y + 60, { steps: 8 });
    await page.mouse.up();

    await mainButton(page, /Gunakan tanda tangan ini/i).click();
    const download = await clickAndDownload(page, /Simpan Dokumen Bertanda Tangan/i);
    expect(download.suggestedFilename()).toBe('pages2_signed.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(2);
  });

  test('negative: signing without drawing anything is refused', async ({ page }) => {
    await openTool(page, 'sign');
    await upload(page, twoPagePdf);

    // Nothing drawn yet, so the save button must not be usable.
    await expect(mainButton(page, /Simpan Dokumen Bertanda Tangan/i)).toBeDisabled();
  });

  test('redact: a drawn box is applied to the output', async ({ page }) => {
    await openTool(page, 'redact');
    await upload(page, textPdf);

    await mainButton(page, /Sensor Kata Kunci/i).click();
    const canvas = page.locator('main canvas').first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 60, box.y + 60);
    await page.mouse.down();
    await page.mouse.move(box.x + 220, box.y + 110, { steps: 10 });
    await page.mouse.up();

    const download = await clickAndDownload(page, /Terapkan sensor/i);
    expect(download.suggestedFilename()).toBe('text_redacted.pdf');
    expect((await pdfInfo(await downloadBytes(download))).pages).toBe(1);
  });

  test('unlock: the right password produces a readable PDF', async ({ page }) => {
    await openTool(page, 'unlock');
    await upload(page, lockedPdf);
    await page.locator('main input[type=password]').first().fill(LOCKED_PASSWORD);

    await clickButton(page, /Buka kunci pdf/i);
    const download = await clickAndDownload(page, /Unduh hasil/i);
    expect(download.suggestedFilename()).toBe('terkunci-terbuka.pdf');

    const info = await pdfInfo(await downloadBytes(download));
    expect(info.pages).toBe(2);
  });

  test('negative: the wrong password is refused and nothing is downloaded', async ({ page }) => {
    await openTool(page, 'unlock');
    await upload(page, lockedPdf);
    await page.locator('main input[type=password]').first().fill('password-salah');

    const downloads = [];
    page.on('download', (d) => downloads.push(d.suggestedFilename()));
    await mainButton(page, /Buka kunci pdf/i).click();

    await expect(page.getByText(/Password salah|Gagal/i).first()).toBeVisible({ timeout: 30000 });
    expect(downloads).toEqual([]);
  });

  test('protect: the output really is encrypted', async ({ page }) => {
    await openTool(page, 'protect');
    await upload(page, twoPagePdf);
    await page.locator('main input[type=password]').nth(0).fill('kunci-uji-123');
    await page.locator('main input[type=password]').nth(1).fill('kunci-uji-123');

    await clickButton(page, /Kunci dengan password/i);
    const download = await clickAndDownload(page, /Unduh hasil/i);
    expect(download.suggestedFilename()).toBe('pages2-terproteksi.pdf');

    const bytes = await downloadBytes(download);
    // Without the password pdf.js must refuse to open it.
    await expect(loadPdfJsDocument(bytes)).rejects.toThrow();
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  test('negative: mismatched passwords are refused', async ({ page }) => {
    await openTool(page, 'protect');
    await upload(page, twoPagePdf);
    await page.locator('main input[type=password]').nth(0).fill('kunci-uji-123');
    await page.locator('main input[type=password]').nth(1).fill('beda-sekali');

    // A mismatch must keep the submit button unusable.
    await expect(mainButton(page, /Kunci dengan password/i)).toBeDisabled();
    await expect(page.getByText(/tidak cocok|tidak sama/i).first()).toBeVisible();
  });
});
