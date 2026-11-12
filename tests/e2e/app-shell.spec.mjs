/**
 * app-shell.spec.mjs - The shell: sidebar, hash routing, and the not-found panel.
 */
import { test, expect } from '@playwright/test';
import { twoPagePdf } from './fixtures.mjs';

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
    await expect(page.locator('aside nav button[data-tool-id]')).toHaveCount(25);
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

  test('positive: mobile viewport (320px and 375px) has no horizontal overflow or overlapping controls', async ({ page }) => {
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 640 });
      for (const id of ROUTES) {
        await page.goto(`/#${id}`);
        if (id === 'page-numbers' || id === 'watermark' || id === 'redact') {
          await page.reload();
          await page.locator('main input[type=file]').first().setInputFiles(twoPagePdf);
          await page.waitForTimeout(400);
        }
        const metrics = await page.evaluate(() => {
          const main = document.querySelector('main');
          const docOverflow = document.documentElement.scrollWidth - window.innerWidth;
          const mainOverflow = main ? main.scrollWidth - main.clientWidth : 0;
          const buttons = [...document.querySelectorAll('header button, main button')].filter((el) => {
            const s = getComputedStyle(el);
            const r = el.getBoundingClientRect();
            return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('[data-testid="zoom-preview"]');
          });
          const overlaps = [];
          for (let i = 0; i < buttons.length; i++) {
            const a = buttons[i].getBoundingClientRect();
            for (let j = i + 1; j < buttons.length; j++) {
              if (buttons[i].contains(buttons[j]) || buttons[j].contains(buttons[i])) continue;
              const b = buttons[j].getBoundingClientRect();
              const ix = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
              const iy = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
              if (ix > 2 && iy > 2) overlaps.push([buttons[i].innerText.trim(), buttons[j].innerText.trim()]);
            }
          }
          return { docOverflow, mainOverflow, overlaps };
        });
        expect(metrics.docOverflow, `docOverflow at ${width}px on #${id}`).toBeLessThanOrEqual(1);
        expect(metrics.mainOverflow, `mainOverflow at ${width}px on #${id}`).toBeLessThanOrEqual(1);
        expect(metrics.overlaps, `button overlaps at ${width}px on #${id}`).toEqual([]);
      }
    }
  });
});
