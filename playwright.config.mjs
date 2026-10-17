import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.mjs',
  globalSetup: './tests/e2e/global-setup.mjs',
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    screenshot: 'only-on-failure',
    // Bounded, so a selector that matches nothing fails the test instead of
    // waiting forever (Playwright's default action timeout is unlimited).
    actionTimeout: 20000
  },
  webServer: {
    command: 'node scripts/serve.mjs',
    env: { PORT: '4173' },
    url: 'http://127.0.0.1:4173/index.html',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
