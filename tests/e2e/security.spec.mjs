import { test, expect } from '@playwright/test';

test('CSP allows app but blocks injected inline and same-origin scripts', async ({ page }) => {
  const response = await page.goto('/');
  await expect(page.locator('main h1')).toBeVisible();
  expect(response.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
  await page.evaluate(() => {
    window.__securityViolations = [];
    document.addEventListener('securitypolicyviolation', e => window.__securityViolations.push(e.effectiveDirective));
    const inline = document.createElement('script');
    inline.textContent = 'window.__injectedInline = true';
    document.body.append(inline);
    const external = document.createElement('script');
    external.src = '/hud-audit.js';
    document.body.append(external);
  });
  await expect.poll(() => page.evaluate(() => window.__securityViolations.length)).toBeGreaterThanOrEqual(2);
  expect(await page.evaluate(() => window.__injectedInline)).toBeUndefined();
});

test('both standalone variants boot with their own script hash', async ({ page }) => {
  for (const path of ['/PDF%20To%20Go.html', '/PDF%20To%20Go%20Lite.html']) {
    await page.goto(path);
    await expect(page.locator('main h1')).toBeVisible();
  }
});
