import { test, expect } from '@playwright/test';

test('fresh session defaults to light even on a dark OS; saved preference remains', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('upload opens the file picker with click, Enter and Space', async ({ page }) => {
  await page.goto('/');
  let pickerCount = 0;
  await page.locator('input[type="file"]').evaluate(input => {
    window.uploadInputClicks = 0;
    input.addEventListener('click', () => { window.uploadInputClicks += 1; });
  });
  page.on('filechooser', () => { pickerCount += 1; });
  const upload = page.getByRole('button', { name: 'Tarik & lepas file di sini', exact: true });
  for (const key of [null, 'Enter', 'Space']) {
    const pickerPromise = page.waitForEvent('filechooser', { timeout: 3000 });
    if (key) await upload.press(key);
    else await upload.click();
    const picker = await pickerPromise;
    expect(await picker.element().getAttribute('accept')).toBe('.pdf');
    await picker.setFiles([]);
    expect(await page.evaluate(() => window.uploadInputClicks)).toBe(pickerCount);
  }
  expect(pickerCount).toBe(3);
});

test('workspace navigation and theme work across desktop and mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Gabung PDF', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tata Letak Dokumen', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Gabung PDF', exact: true })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Pisah PDF', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pisah PDF', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Toggle theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Toggle theme' }).click();

  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.getByRole('button', { name: 'Toggle menu' }).click();
    await page.getByRole('button', { name: 'Gabung PDF', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Gabung PDF', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const upload = page.getByRole('button', { name: 'Tarik & lepas file di sini', exact: true });
    await upload.focus();
    await expect(upload).toBeFocused();
  }
});
