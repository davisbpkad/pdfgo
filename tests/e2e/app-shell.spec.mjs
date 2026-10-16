/**
 * app-shell.spec.mjs - The shell: sidebar, hash routing, and the not-found panel.
 */
import { test, expect } from '@playwright/test';

const ROUTES = [
  'merge', 'split', 'organize', 'page-numbers', 'watermark',
  'compress', 'ocr', 'extract-text', 'form',
  'image-to-pdf', 'pdf-to-image', 'pdf-to-markdown', 'scan-to-pdf', 'html-to-pdf',
  'pdf-to-word', 'pdf-to-powerpoint', 'excel-to-pdf', 'word-to-pdf', 'powerpoint-to-pdf', 'pdf-to-excel',
  'sign', 'redact', 'unlock', 'protect',
  'edit-pdf'
];

test.describe('app shell', () => {
  test('positive: the sidebar lists exactly the 25 registered tools', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside nav button')).toHaveCount(25);
  });

  test('positive: every sidebar entry opens a tool that renders a title', async ({ page }) => {
    await page.goto('/');
    for (const id of ROUTES) {
      await page.goto(`/#${id}`);
      const heading = page.locator('main h1').first();
      await expect(heading, `route #${id} has no heading`).toHaveCount(1);
      const title = (await heading.innerText()).trim();
      expect(title.length, `route #${id} has an empty heading`).toBeGreaterThan(0);
      expect(title, `route #${id} shows a raw i18n key`).not.toMatch(/[a-z]+\.[a-zA-Z]+\.[a-zA-Z]/);
    }
  });

  test('positive: no page error fires while opening every tool', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    for (const id of ROUTES) {
      await page.goto(`/#${id}`);
      await page.waitForTimeout(100);
    }
    expect(errors).toEqual([]);
  });

  test('negative: the removed AI tool route shows the not-found panel', async ({ page }) => {
    await page.goto('/#ai-summary');
    await expect(page.getByText('Alat Tidak Ditemukan')).toBeVisible();
    await expect(page.getByText(/Siapkan untuk AI|Prepare for AI/)).toHaveCount(0);
  });

  test('negative: an unknown route shows the not-found panel, not a blank area', async ({ page }) => {
    await page.goto('/#alat-yang-tidak-ada');
    await expect(page.getByText('Alat Tidak Ditemukan')).toBeVisible();
    await expect(page.locator('main h1')).toHaveCount(0);
  });

  test('negative: the removed AI tool is absent from the sidebar', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('aside nav')).not.toContainText('Siapkan untuk AI');
    await expect(page.locator('aside nav')).toContainText('Pindai jadi PDF');
  });
});
