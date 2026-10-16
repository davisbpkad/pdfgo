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
    screenshot: 'only-on-failure'
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
