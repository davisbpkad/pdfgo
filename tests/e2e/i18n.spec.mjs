/**
 * i18n.spec.mjs - Language switching and the "no raw key on screen" guard.
 * The guard exists because three keys were once missing and t() fell back to
 * returning the key path itself, so users saw tools.split.summaryPage on screen.
 */
import { test, expect } from '@playwright/test';
import { textPdf } from './fixtures.mjs';

const ROUTES = [
  'merge', 'split', 'organize', 'page-numbers', 'watermark',
  'compress', 'ocr', 'extract-text', 'form',
  'image-to-pdf', 'pdf-to-image', 'pdf-to-markdown', 'scan-to-pdf', 'html-to-pdf',
  'pdf-to-word', 'pdf-to-powerpoint', 'excel-to-pdf', 'word-to-pdf', 'powerpoint-to-pdf', 'pdf-to-excel',
  'sign', 'redact', 'unlock', 'protect',
  'edit-pdf'
];

const KEY_PATTERN = /\b(?:tools|queue|common|dropzone|app|header)\.[A-Za-z]+(?:\.[A-Za-z]+)?/;

/**
 * Words that exist only in Indonesian. In English mode any of these means a
 * tool still hardcodes its copy (or an English key is missing and t() fell
 * back to Indonesian). English words are never matched, so there are no false
 * hits from the translations themselves.
 */
const INDONESIAN_ONLY = /\b(?:dan|atau|dengan|untuk|halaman|berkas|gambar|unduh|pilih|warna|ukuran|tidak|pada|dari|yang|sudah|akan|semua|lagi|sini|belum|silakan|coba|simpan|hapus|mulai|unggah|tarik|lepas|nomor|tanda|kunci|asli|hasil|selesai|sedang|mohon|teks|dokumen|hanya|juga|bisa|setelah|sebelum|tanpa|lebih|paling|sangat|wajib|nama|kiri|kanan|atas|bawah|tengah|kotak|baris|huruf|tanggal|isi|kecil|besar)\b/i;

async function visibleText(page) {
  return [
    await page.locator('aside').innerText(),
    await page.locator('header').innerText(),
    await page.locator('main').innerText()
  ].join('\n');
}

test.describe('i18n', () => {
  test('positive: the language toggle switches the interface to English', async ({ page }) => {
    await page.goto('/#edit-pdf');
    await page.setInputFiles('input[type=file]', textPdf);
    await expect(page.getByRole('button', { name: /Simpan PDF/ })).toBeVisible({ timeout: 15000 });

    await page.getByTestId('lang-toggle').click();

    await expect(page.locator('main h1').first()).toHaveText(/EDIT PDF TEXT/i);
    await expect(page.getByRole('button', { name: /Save PDF/ })).toBeVisible();
    await expect(page.getByText(/Tarik & lepas file/)).toHaveCount(0);
  });

  test('positive: English edit-pdf copy describes text editing, not overlay objects', async ({ page }) => {
    await page.goto('/#edit-pdf');
    await page.getByTestId('lang-toggle').click();
    const text = await visibleText(page);
    expect(text).not.toMatch(/whiteout|rectangle|ellipse|freehand/i);
  });

  test('negative: no raw i18n key is visible on any route in Indonesian', async ({ page }) => {
    await page.goto('/');
    const leaks = [];
    for (const id of ROUTES) {
      await page.goto(`/#${id}`);
      await page.waitForTimeout(80);
      const text = await visibleText(page);
      const hit = text.match(KEY_PATTERN);
      if (hit) leaks.push(`#${id}: ${hit[0]}`);
    }
    expect(leaks).toEqual([]);
  });

  test('negative: no raw i18n key is visible on any route in English', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('lang-toggle').click();
    const leaks = [];
    for (const id of ROUTES) {
      await page.goto(`/#${id}`);
      await page.waitForTimeout(80);
      const text = await visibleText(page);
      const hit = text.match(KEY_PATTERN);
      if (hit) leaks.push(`#${id}: ${hit[0]}`);
    }
    expect(leaks).toEqual([]);
  });

  test('negative: no Indonesian copy is visible on any route in English', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('lang-toggle').click();
    const leftovers = [];
    for (const id of ROUTES) {
      await page.goto(`/#${id}`);
      await page.waitForTimeout(80);
      const text = await visibleText(page);
      const hit = text.match(INDONESIAN_ONLY);
      if (hit) leftovers.push(`#${id}: ${hit[0]}`);
    }
    expect(leftovers).toEqual([]);
  });
});
