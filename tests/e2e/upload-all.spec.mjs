import { test, expect, openTool } from './helpers.mjs';

const routes = [
  'merge', 'split', 'organize', 'page-numbers', 'watermark', 'compress',
  'ocr', 'extract-text', 'form', 'image-to-pdf', 'pdf-to-image',
  'pdf-to-markdown', 'pdf-to-word', 'pdf-to-powerpoint', 'excel-to-pdf',
  'word-to-pdf', 'powerpoint-to-pdf', 'pdf-to-excel', 'sign', 'redact',
  'unlock', 'protect', 'edit-pdf', 'scan-to-pdf', 'html-to-pdf'
];

for (const route of routes) {
  test(`${route}: positive picker opens once; negative cancel permits retry`, async ({ page }) => {
    await openTool(page, route);
    const trigger = route === 'scan-to-pdf'
      ? page.locator('main button').filter({ hasText: 'Pilih Berkas Gambar' })
      : route === 'html-to-pdf'
        ? page.locator('main button').filter({ hasText: 'Impor .html' })
        : page.locator('main [role="button"]').filter({ has: page.locator('input[type="file"]') });
    let dialogs = 0;
    page.on('filechooser', () => { dialogs++; });
    for (const attempt of [1, 2]) {
      const pickerPromise = page.waitForEvent('filechooser', { timeout: 5000 });
      await trigger.click();
      const picker = await pickerPromise;
      await picker.setFiles([]);
      await expect(trigger).toBeVisible();
      expect(dialogs).toBe(attempt);
    }
    await expect(page.locator('main h1')).toBeVisible();
  });

  test(`${route}: negative empty session cannot download a result`, async ({ page }) => {
    await openTool(page, route);
    const downloads = [];
    page.on('download', download => downloads.push(download.suggestedFilename()));
    const actions = page.locator('main button:enabled').filter({ hasText: /^(Gabungkan|Pisahkan|Unduh|Simpan|Konversi|Proses|Terapkan|Kompres|Ekstrak|Mulai OCR)/ });
    for (const action of await actions.all()) {
      await action.click();
    }
    await expect(page.locator('main h1')).toBeVisible();
    expect(downloads).toEqual([]);
  });
}
