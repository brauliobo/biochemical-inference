import { defineConfig, devices } from '@playwright/test'

// Browser tests of the static (API-less) site, the edition published to GitHub Pages:
// the shell and knowledge-site accessibility scan (every route, the workbenches'
// API-required notices included), the ISO 9241-11 task measures and the
// accessibility of every populated workbench state (docs/USABILITY.md). It serves
// dist-static, so build it first:
//
//   npm run build:static && npm run test:e2e:static
//
// playwright.config.js runs the whole suite against the full API stack instead.
const port = Number(process.env.E2E_STATIC_PORT ?? 4173)

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['shell.spec.js', 'usability-tasks.spec.js', 'populated-states.spec.js', 'atlas.spec.js', 'entity-templates.spec.js'],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : [['list']],
  use: { baseURL: `http://127.0.0.1:${port}`, trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 } } }
  ],
  webServer: {
    command: `npx vite preview --outDir dist-static --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000
  }
})
