import { defineConfig } from "@playwright/test";

const PORT = 3200;

export default defineConfig({
  testDir: "tests",
  timeout: 40_000,
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 1280, height: 900 },
  },
  // Tests run against the production build, which `npm test` makes first.
  webServer: {
    command: `npm run start -w site -- -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
