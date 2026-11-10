import { test, expect, openTool, upload, clickButton } from './helpers.mjs';
import { imagePng, textPdf, formPdf, docxFile, htmlFile } from './fixtures.mjs';

for (const [route, file, accept, target] of [
  ['image-to-pdf', imagePng, 'image/png', 'img'],
  ['scan-to-pdf', imagePng, 'image/*', 'img'],
  ['organize', textPdf, '.pdf', 'img'],
  ['merge', textPdf, '.pdf', 'img'],
  ['split', textPdf, '.pdf', 'img'],
  ['extract-text', imagePng, 'image/', 'img'],
  ['form', formPdf, '.pdf', 'canvas'],
  ['word-to-pdf', docxFile, '.docx', '[data-testid="zoom-content"] > div'],
  ['html-to-pdf', htmlFile, '.html', 'iframe'],
  ['pdf-to-markdown', textPdf, '.pdf', 'textarea']
]) {
  test(`${route}: preview grows, shrinks, resets and respects bounds`, async ({ page }) => {
    await openTool(page, route);
    await upload(page, file, accept);
    if (route === 'pdf-to-markdown') await clickButton(page, /Konversi ke markdown/i);
    const preview = page.getByTestId('zoom-preview').first();
    const content = preview.locator(target).first();
    await expect(content).toBeVisible();
    if (target === 'canvas') await expect.poll(async () => Number(await content.getAttribute('width'))).toBeGreaterThan(300);
    const original = await content.boundingBox();
    await preview.getByRole('button', { name: 'Perbesar zoom', exact: true }).click();
    await expect.poll(async () => (await content.boundingBox()).width).toBeGreaterThan(original.width * 1.2);
    await preview.getByRole('button', { name: 'Perkecil zoom', exact: true }).click();
    await expect.poll(async () => (await content.boundingBox()).width).toBeCloseTo(original.width, 0);
    for (let i = 0; i < 3; i++) await preview.getByRole('button', { name: 'Perkecil zoom', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Perkecil zoom', exact: true })).toBeDisabled();
    await expect(preview.getByRole('button', { name: 'Reset zoom' })).toHaveText('25%');
    await preview.getByRole('button', { name: 'Reset zoom' }).click();
    for (let i = 0; i < 12; i++) await preview.getByRole('button', { name: 'Perbesar zoom', exact: true }).click();
    await expect(preview.getByRole('button', { name: 'Perbesar zoom', exact: true })).toBeDisabled();
    await expect(preview.getByRole('button', { name: 'Reset zoom' })).toHaveText('400%');
    await preview.getByRole('button', { name: 'Reset zoom' }).click();
    await expect.poll(async () => (await content.boundingBox()).width).toBeCloseTo(original.width, 0);
    await page.screenshot({ path: `test-results/zoom-${route}.png` });
  });
}

for (const route of ['watermark', 'page-numbers', 'edit-pdf', 'sign', 'redact']) {
  test(`${route}: canvas zoom changes actual size and keeps page geometry`, async ({ page }) => {
    await openTool(page, route);
    await upload(page, textPdf);
    const canvas = page.locator('main canvas').last();
    await expect(canvas).toBeVisible();
    await expect.poll(async () => (await canvas.boundingBox()).width).toBeGreaterThan(300);
    const original = await canvas.boundingBox();
    await page.getByRole('button', { name: 'Perbesar zoom', exact: true }).click();
    await expect.poll(async () => (await canvas.boundingBox()).width).toBeGreaterThan(original.width * 1.05);
    const enlarged = await canvas.boundingBox();
    expect(enlarged.width / enlarged.height).toBeCloseTo(original.width / original.height, 1);
    await page.getByRole('button', { name: 'Perkecil zoom', exact: true }).click();
    await expect.poll(async () => (await canvas.boundingBox()).width).toBeLessThan(enlarged.width * 0.95);
    await page.screenshot({ path: `test-results/zoom-${route}.png` });
  });
}

test('crop modal: zoom keeps crop overlay aligned and permits scrolling on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openTool(page, 'scan-to-pdf');
  await upload(page, imagePng, 'image/*');
  await page.getByTitle('Potong Halaman', { exact: true }).click();
  const modal = page.locator('.fixed.inset-0').filter({ has: page.getByTestId('zoom-preview') }).last();
  const preview = modal.getByTestId('zoom-preview');
  const overlay = preview.locator('.border-dashed');
  const before = await overlay.boundingBox();
  await preview.getByRole('button', { name: 'Perbesar zoom', exact: true }).click();
  expect(Math.abs((await overlay.boundingBox()).width - before.width * 1.25)).toBeLessThan(1);
  const viewport = preview.getByLabel('Preview', { exact: true });
  expect(await viewport.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await viewport.evaluate(el => { el.scrollLeft = 30; });
  expect(await viewport.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('redaction inspection modal: canvas zoom works', async ({ page }) => {
  await openTool(page, 'redact');
  await upload(page, textPdf);
  const source = page.locator('main canvas').first();
  await expect(source).toBeVisible();
  const box = await source.boundingBox();
  await page.mouse.move(box.x + 30, box.y + 30);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 70, { steps: 5 });
  await page.mouse.up();
  await clickButton(page, /Periksa Hasil Sensor/i);
  const preview = page.getByTestId('zoom-preview');
  const canvas = preview.locator('canvas');
  await expect(canvas).toBeVisible();
  await expect.poll(async () => Number(await canvas.getAttribute('width'))).toBeGreaterThan(300);
  const before = await canvas.boundingBox();
  await preview.getByRole('button', { name: 'Perbesar zoom', exact: true }).click();
  expect(Math.abs((await canvas.boundingBox()).width - before.width * 1.25)).toBeLessThan(1);
});
