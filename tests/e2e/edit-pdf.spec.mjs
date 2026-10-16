/**
 * edit-pdf.spec.mjs - The text-only Edit PDF tool, driven through the browser.
 */
import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { loadPdfJsDocument, unwrapPdfProxy } from '../../src/core/pdf.js';
import { textPdf, twoPagePdf, notAPdf } from './fixtures.mjs';

const EDIT_ROUTE = '/#edit-pdf';

async function openTool(page) {
  await page.goto(EDIT_ROUTE);
  await page.reload();
}

async function loadPdf(page, file) {
  await page.setInputFiles('input[type=file]', file);
  await expect(page.getByText(/Hal\. \d+ \/ \d+/)).toBeVisible({ timeout: 15000 });
  // The page renders first; the editable text layer arrives once extraction ends.
  await expect(page.locator('main textarea').first()).toBeVisible({ timeout: 15000 });
}

async function extractText(bytes) {
  const raw = await loadPdfJsDocument(bytes);
  const doc = unwrapPdfProxy(raw);
  let out = '';
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    out += content.items.map((i) => i.str).join(' ') + '\n';
  }
  return out;
}

test.describe('edit pdf', () => {
  test('positive: the tool offers text editing only', async ({ page }) => {
    await openTool(page);
    await loadPdf(page, textPdf);

    await expect(page.getByRole('button', { name: /Simpan PDF/ })).toBeVisible();
    expect(await page.locator('main textarea').count()).toBeGreaterThan(0);

    // The removed overlay objects must not come back.
    const mainText = await page.locator('main').innerText();
    for (const label of ['Tambah Objek', 'Tutup Teks', 'Kotak', 'Lingkaran', 'Garis', 'Coretan', 'Gambar']) {
      expect(mainText, `"${label}" must no longer be offered`).not.toContain(label);
    }
  });

  test('positive: retyping existing text then saving writes it into the PDF', async ({ page }) => {
    await openTool(page);
    await loadPdf(page, textPdf);

    await page.locator('main textarea').first().fill('Halo dunia BARU');
    await expect(page.getByText('1 tulisan diubah')).toBeVisible();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Simpan PDF/ }).click()
    ]);
    expect(download.suggestedFilename()).toBe('text-edit.pdf');
    await expect(page.getByText('Dokumen PDF Berhasil Disimpan!')).toBeVisible();
    await expect(page.getByText(/Gagal menyimpan/)).toHaveCount(0);

    const saved = new Uint8Array(fs.readFileSync(await download.path()));
    expect(await extractText(saved)).toContain('Halo dunia BARU');
  });

  test('positive: the change counter can be reset', async ({ page }) => {
    await openTool(page);
    await loadPdf(page, textPdf);

    await page.locator('main textarea').first().fill('teks sementara');
    await expect(page.getByText('1 tulisan diubah')).toBeVisible();

    await page.getByRole('button', { name: /Batalkan Perubahan Tulisan/ }).click();
    await expect(page.getByText(/tulisan diubah/)).toHaveCount(0);
    await expect(page.locator('main textarea').first()).toHaveValue('Halo dunia dokumen uji');
  });

  test('positive: page navigation is bounded by the document', async ({ page }) => {
    await openTool(page);
    await loadPdf(page, twoPagePdf);

    const prev = page.getByRole('button', { name: '◀' });
    const next = page.getByRole('button', { name: '▶' });

    await expect(prev).toBeDisabled();
    await expect(next).toBeEnabled();
    await next.click();
    await expect(page.getByText('Hal. 2 / 2')).toBeVisible();
    await expect(next).toBeDisabled();
    await expect(prev).toBeEnabled();
  });

  test('negative: a file that is not a PDF leaves the tool usable', async ({ page }) => {
    await openTool(page);
    await page.setInputFiles('input[type=file]', notAPdf);

    // The dropzone must come back, and the broken "Hal. 1 / 0" header must never appear.
    await expect(page.getByText(/Tarik & lepas file/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Hal\. 1 \/ 0/)).toHaveCount(0);
    await expect(page.getByText(/Gagal membuka|tidak valid|bukan PDF/i).first()).toBeVisible();
  });

  test('negative: an empty edit session cannot save a document', async ({ page }) => {
    await openTool(page);
    await expect(page.getByRole('button', { name: /Simpan PDF/ })).toHaveCount(0);
    await expect(page.getByText(/Tarik & lepas file/)).toBeVisible();
  });

  test('negative: saving with no edits keeps the original text intact', async ({ page }) => {
    await openTool(page);
    await loadPdf(page, textPdf);

    await expect(page.getByText(/tulisan diubah/)).toHaveCount(0);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /Simpan PDF/ }).click()
    ]);
    const saved = new Uint8Array(fs.readFileSync(await download.path()));
    const text = await extractText(saved);
    expect(text).toContain('Halo dunia dokumen uji');
    expect(text).toContain('Baris kedua untuk diubah');
  });
});
