import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: 'http://localhost:8081',
    channel: 'msedge',
    headless: true,
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run start -w @tap-o/server',
      url: 'http://localhost:3001/health',
      env: { DB_NAME: 'tap_o_test' },
      reuseExistingServer: false,
    },
    {
      command: 'node scripts/serve-web.mjs',
      url: 'http://localhost:8081',
      reuseExistingServer: false,
    },
  ],
});
