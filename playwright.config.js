// @ts-check
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load environment variables from a local .env (gitignored). See .env.example.
dotenv.config();

const BASE_URL = process.env.BASE_URL || 'https://control.estatelink.cloud';

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  /* Run every test file in parallel. */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only. */
  retries: process.env.CI ? 2 : 0,
  /* Cap workers on CI for stable, shared-environment runs. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporters: rich HTML locally, concise line output in the terminal/CI. */
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
  /* Shared settings for all projects. https://playwright.dev/docs/api/class-testoptions */
  use: {
    baseURL: BASE_URL,
    /* Diagnostics retained only when a test fails or retries — keeps runs fast and artifacts small. */
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  /* Per-assertion timeout for web-first expect() calls. */
  expect: { timeout: 10000 },

  projects: [
    // Authenticates once and saves storage state for all dependent projects.
    // Own testDir so the .setup.js is discovered (it lives outside ./tests).
    { name: 'setup', testDir: './global-setup', testMatch: /.*\.setup\.js/ },

    {
      name: 'chromium',
      use: {
        // Full-screen: maximize the window and let the page fill it (viewport: null).
        // (Don't spread devices['Desktop Chrome'] — its deviceScaleFactor conflicts with viewport:null.)
        viewport: null,
        // --start-maximized fills the screen when headed; --window-size gives
        // headless a large viewport too (viewport:null otherwise defaults tiny).
        launchOptions: { args: ['--start-maximized', '--window-size=1920,1080'] },
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
});
