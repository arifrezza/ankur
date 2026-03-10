const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // Maximum time one test can run for
  timeout: 180 * 1000, // 3 minutes per test
  
  // Retry failed tests
  retries: 1,
  
  // Number of parallel workers
  workers: 3, // Run 3 tests in parallel
  
  // Reporter to use
  reporter: [
    ['html', { outputFolder: 'test-results/html-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  
  use: {
    // Base URL
    baseURL: 'https://api.vantagecircle.co.in/',
    
    // Browser options
    headless: false, // Set to true for headless mode
    
    // Viewport
    viewport: { width: 1280, height: 720 },
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Trace on failure
    trace: 'on-first-retry',
    
    // Timeout for each action
    actionTimeout: 30000,
    
    // Navigation timeout
    navigationTimeout: 60000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          slowMo: 800, // 800ms delay between each action so you can follow along
        },
      },
    },
    
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Output folder for test artifacts
  outputDir: 'test-results/',
});
