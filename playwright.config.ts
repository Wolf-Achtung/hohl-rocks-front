import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:' + (process.env.PORT || 8080) },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }]
});
