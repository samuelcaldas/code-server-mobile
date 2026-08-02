import { PlaywrightTestConfig } from "@playwright/test"

import path from "path"

// The default configuration runs all tests in three browsers with workers equal
// to half the available threads. See 'npm run test:e2e --help' to customize
// from the command line. For example:
//   npm run test:e2e -- --workers 1        # Run with one worker
//   npm run test:e2e -- --project Chromium # Only run on Chromium
//   npm run test:e2e -- --grep login       # Run tests matching "login"
//   PWDEBUG=1 npm run test:e2e             # Run Playwright inspector
const config: PlaywrightTestConfig = {
  testDir: path.join(__dirname, "e2e"), // Search for tests in this directory.
  timeout: 60000, // Each test is given 60 seconds.
  retries: process.env.CI ? 2 : 1, // Retry in CI due to flakiness.
  // Limit the number of failures on CI to save resources
  maxFailures: process.env.CI ? 3 : undefined,
  globalSetup: require.resolve("./utils/globalE2eSetup.ts"),
  reporter: "list",
  // Put any shared options on the top level.
  use: {
    headless: true, // Run tests in headless browsers.
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "Chromium",
      // Mobile specs need a touch-enabled context; they run in "Mobile Chromium".
      testIgnore: /mobile\..*\.test\.ts/,
      use: { browserName: "chromium" },
    },
    // Phone-sized viewport with touch emulation. Required for `page.tap()`,
    // which throws unless the context has `hasTouch`. Tests that exercise the
    // compact workbench layout should be run with `--project "Mobile Chromium"`.
    {
      name: "Mobile Chromium",
      testMatch: /mobile\..*\.test\.ts/,
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3,
      },
    },
    // Firefox seems to have bugs with opening context menus in the file tree.
    // {
    //   name: "Firefox",
    //   use: { browserName: "firefox" },
    // },
    // Keeps failing with "Underlying ArrayBuffer has been detached from the view or out-of-bounds"
    // Not sure what we can do about it...so skip for now.
    // {
    //   name: "WebKit",
    //   use: { browserName: "webkit" },
    // },
  ],
}

export default config
