import { test, expect, openTool, upload, clickAndDownload, downloadBytes } from './helpers.mjs';
import { textPdf } from './fixtures.mjs';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { inflateSync } from 'node:zlib';

test('uploaded signature removes light paper, preserves ink, restores original and exports transparency', async ({ page }) => {
  await openTool(page, 'sign');
  await upload(page, textPdf);
  await page.getByRole('button', { name: /Unggah Gambar/i }).click();
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 120; canvas.height = 60;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'rgb(210,205,190)'; ctx.fillRect(0, 0, 120, 60);
    ctx.fillStyle = 'rgb(15,30,90)'; ctx.fillRect(40, 20, 40, 20);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  const pickerPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: /Unggah paraf/i }).click();
  await (await pickerPromise).setFiles({ name: 'signature.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  const preview = page.getByAltText('Pratinjau Tanda Tangan', { exact: true });
  const pixels = () => preview.evaluate(async img => {
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0);
    return [ctx.getImageData(5, 5, 1, 1).data[3], ...ctx.getImageData(50, 30, 1, 1).data];
  });
  await expect.poll(pixels).toEqual([0, 15, 30, 90, 255]);
  const remove = page.getByRole('checkbox', { name: /Hapus latar putih/i });
  await remove.uncheck();
  await expect.poll(pixels).toEqual([255, 15, 30, 90, 255]);
  await remove.check();
  await expect.poll(pixels).toEqual([0, 15, 30, 90, 255]);
  await page.screenshot({ path: 'test-results/sign-upload-transparent.png' });
  await page.getByRole('button', { name: /Gunakan tanda tangan ini/i }).click();
  const download = await clickAndDownload(page, /Simpan Dokumen Bertanda Tangan/i);
  const pdf = await PDFDocument.load(await downloadBytes(download));
  const masks = pdf.context.enumerateIndirectObjects().map(([, obj]) => obj).filter(obj => obj instanceof PDFRawStream && obj.dict.has(PDFName.of('SMask')));
  expect(masks.length).toBeGreaterThan(0);
  const mask = pdf.context.lookup(masks[0].dict.get(PDFName.of('SMask')));
  const alpha = inflateSync(mask.contents);
  expect(alpha.includes(0)).toBe(true);
  expect(alpha.includes(255)).toBe(true);
});
