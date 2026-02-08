/**
 * Playwright Configuration for Holy Hoops Game Tests
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  testMatch: '**/*.spec.js',

  // Increase timeout for game tests
  timeout: 30000,

  // Run tests sequentially (game state can conflict if parallel)
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests for game testing
  workers: 1,

  // Reporter to use
  reporter: [
    ['html', { open: 'never' }],
    ['list']
  ],

  use: {
    // Base URL for the game
    baseURL: 'http://localhost:5176',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Record video for debugging
    video: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
    // Uncomment to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  // Uncomment if you want Playwright to start the server automatically
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:5176',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000,
  // },
});
