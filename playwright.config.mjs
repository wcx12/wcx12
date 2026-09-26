import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 45000,
  outputDir: 'output/site-quality-20260926/e2e-artifacts',
  reporter: [['list'], ['json', { outputFile: 'output/site-quality-20260926/e2e-results.json' }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4285/wcx12/',
    viewport: { width: 1440, height: 1000 },
    locale: 'en-US',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'node scripts/qa/serve.mjs output/pages 4285',
    url: 'http://127.0.0.1:4285/wcx12/',
    reuseExistingServer: false
  }
});
