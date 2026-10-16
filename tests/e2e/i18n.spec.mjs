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

    await page.getByTitle('Ganti Bahasa (ID / EN)').click();

    await expect(page.locator('main h1').first()).toHaveText(/EDIT PDF TEXT/i);
    await expect(page.getByRole('button', { name: /Save PDF/ })).toBeVisible();
    await expect(page.getByText(/Tarik & lepas file/)).toHaveCount(0);
  });

  test('positive: English edit-pdf copy describes text editing, not overlay objects', async ({ page }) => {
    await page.goto('/#edit-pdf');
    await page.getByTitle('Ganti Bahasa (ID / EN)').click();
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
    await page.getByTitle('Ganti Bahasa (ID / EN)').click();
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
});
