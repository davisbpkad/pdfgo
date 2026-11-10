import { test, expect } from './helpers.mjs';

test('categories collapse without navigating; conversions group PDF inputs before outputs', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Konversi Media', exact: true });
  await expect(page.locator('aside nav button[aria-expanded="false"]')).toHaveCount(4);
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const group = page.locator('#sidebar-conversion');
  await expect(group.locator('[data-tool-id]')).toHaveCount(11);
  expect(await group.locator('[data-tool-id]').evaluateAll(items => items.map(item => item.dataset.toolId))).toEqual([
    'image-to-pdf', 'scan-to-pdf', 'html-to-pdf', 'word-to-pdf', 'excel-to-pdf', 'powerpoint-to-pdf',
    'pdf-to-image', 'pdf-to-word', 'pdf-to-excel', 'pdf-to-powerpoint', 'pdf-to-markdown'
  ]);
  const url = page.url();
  await toggle.click();
  await expect(group).toBeHidden();
  expect(page.url()).toBe(url);
  await toggle.press('Enter');
  await expect(group).toBeVisible();
  await group.locator('[data-tool-id="pdf-to-word"]').click();
  await expect(page).toHaveURL(/#pdf-to-word$/);
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await page.goto('/#pdf-to-image');
  await expect(group).toBeVisible();
  await page.screenshot({ path: 'test-results/sidebar-dropdown.png' });
});

test('mobile dropdown collapses without closing sidebar; selecting tool closes it', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Toggle menu', exact: true }).click();
  const toggle = page.getByRole('button', { name: 'Konversi Media', exact: true });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toBeInViewport();
  await expect(page.locator('#sidebar-conversion')).toBeHidden();
  await toggle.click();
  await page.locator('[data-tool-id="image-to-pdf"]').click();
  await expect(page).toHaveURL(/#image-to-pdf$/);
  await expect(page.locator('aside')).not.toBeInViewport();
});

test('initial deep link stays collapsed and reduced motion disables animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#pdf-to-word');
  const toggle = page.getByRole('button', { name: 'Konversi Media', exact: true });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#sidebar-conversion')).toBeHidden();
  await toggle.click();
  await expect(page.locator('#sidebar-conversion')).toBeVisible();
  expect(await page.locator('#sidebar-conversion').evaluate(el => getComputedStyle(el.parentElement).transitionProperty)).toBe('none');
});
