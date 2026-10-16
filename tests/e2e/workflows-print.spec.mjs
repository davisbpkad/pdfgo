/**
 * workflows-print.spec.mjs - HTML to PDF and Word to PDF both end in the
 * browser's print dialog, so the check is that the preview is built and that
 * the app really asks the browser to print the rendered document.
 */
import { test, expect, openTool, upload, mainButton } from './helpers.mjs';
import { htmlFile, docxFile } from './fixtures.mjs';

/** Count print() calls from the app's sandboxed iframe. */
async function stubPrint(page) {
  await page.addInitScript(() => {
    window.__printCalls = 0;
    const self = window;
    self.print = () => {
      self.top.__printCalls = (self.top.__printCalls || 0) + 1;
    };
  });
}

const printCalls = (page) => page.evaluate(() => window.__printCalls);

test.describe('print workflows', () => {
  test('html to pdf: the imported page is previewed and sent to print', async ({ page }) => {
    await stubPrint(page);
    await openTool(page, 'html-to-pdf');
    await upload(page, htmlFile, '.html');

    // The source pane holds the imported markup.
    await expect(page.locator('main textarea').first()).toHaveValue(/Halaman Uji/);
    await mainButton(page, /Cetak jadi pdf/i).click();

    await expect.poll(() => printCalls(page), { timeout: 15000 }).toBe(1);
  });

  test('word to pdf: the docx is converted to a preview and sent to print', async ({ page }) => {
    await stubPrint(page);
    await openTool(page, 'word-to-pdf');
    await upload(page, docxFile, '.docx');

    await expect(page.locator('main')).toContainText('Laporan uji konversi Word ke PDF', { timeout: 30000 });
    await mainButton(page, /Cetak jadi pdf/i).click();

    await expect.poll(() => printCalls(page), { timeout: 15000 }).toBe(1);
  });

  test('negative: html to pdf refuses an empty document', async ({ page }) => {
    await stubPrint(page);
    await openTool(page, 'html-to-pdf');

    await expect(mainButton(page, /Cetak jadi pdf/i)).toBeDisabled();
    expect(await printCalls(page)).toBe(0);
  });
});
