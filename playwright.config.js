import { defineConfig, devices } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'

const useFixture = process.env.E2E_USE_FIXTURE === 'true'
const runtimeRoot = process.env.E2E_RUNTIME_ROOT ?? resolve(process.cwd(), '..', `.biochemical-inference-e2e-${process.pid}`)
const evidenceRuntime = `${runtimeRoot}/evidence`
const derivedRuntime = `${runtimeRoot}/derived`
const workspaceRuntime = `${runtimeRoot}/workspace`
const dataPlaneRuntime = `${runtimeRoot}/data-plane`
const measuredRuntime = `${runtimeRoot}/measured-local`
const measuredProducerRuntime = `${runtimeRoot}/measured-producer`
const derivedToken = randomBytes(32).toString('hex')
const factoryCursorSecret = randomBytes(32).toString('base64url')
const dataPlaneCursorSecret = randomBytes(32).toString('base64url')
const measuredCursorSecret = randomBytes(32).toString('base64url')
const measuredCsrfToken = randomBytes(32).toString('base64url')

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 } } }
  ],
  webServer: [
    ...(useFixture ? [{
      command: `BIOCHEMICAL_FACTORY_CURSOR_SECRET=${factoryCursorSecret} PORT=8010 node tests/fixtures/data-plane-server.js`,
      url: 'http://127.0.0.1:8010/api/factory/v1',
      reuseExistingServer: false,
      timeout: 120_000
    }, {
      command: `PORT=8011 MEASURED_FIXTURE_ALLOWED_ORIGIN=http://127.0.0.1:5173 MEASURED_FIXTURE_CSRF=${measuredCsrfToken} node tests/fixtures/measured-server.js`,
      url: 'http://127.0.0.1:8011/api/measured/v1',
      reuseExistingServer: false,
      timeout: 120_000
    }] : [{
      command: `sh -c 'umask 077 && mkdir -p "${measuredProducerRuntime}" && BIOCHEMICAL_MEASURED_STATE_DB="${measuredProducerRuntime}/state.sqlite3" BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_FACTORY_CURSOR_SECRET=${factoryCursorSecret} uv run uvicorn biochemical_db_api.app:app --host 127.0.0.1 --port 8000'`,
      cwd: '../biochemical-db/service',
      url: 'http://127.0.0.1:8000/healthz',
      reuseExistingServer: false,
      timeout: 120_000
    }, {
      command: `sh -c 'umask 077 && mkdir -p "${evidenceRuntime}" && BIOCHEMICAL_EVIDENCE_INDEX="${evidenceRuntime}/index.sqlite3" BIOCHEMICAL_EVIDENCE_WORKSPACE="${evidenceRuntime}/workspace.sqlite3" uv run uvicorn biochemical_db_api.evidence_app:app --host 127.0.0.1 --port 8001'`,
      cwd: '../biochemical-db/service',
      url: 'http://127.0.0.1:8001/healthz',
      reuseExistingServer: false,
      timeout: 120_000
    }, {
      command: `sh -c 'umask 077 && mkdir -p "${derivedRuntime}" && openssl genpkey -algorithm Ed25519 -out "${derivedRuntime}/events.pem" && BIOCHEMICAL_DERIVED_DATABASE="${derivedRuntime}/derived.sqlite3" BIOCHEMICAL_DERIVED_OBJECT_ROOT="${derivedRuntime}/objects" BIOCHEMICAL_DERIVED_SIGNING_KEY="${derivedRuntime}/events.pem" BIOCHEMICAL_DERIVED_WRITE_TOKEN="${derivedToken}" uv run biochemical-db-derived'`,
      cwd: '../biochemical-db/service',
      url: 'http://127.0.0.1:8002/healthz',
      reuseExistingServer: false,
      timeout: 120_000
    }]),
    {
      command: useFixture
        ? `npm run build && NODE_ENV=test PORT=5173 HOST=127.0.0.1 BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_WORKSPACE_ROOT=${workspaceRuntime} BIOCHEMICAL_DATA_PLANE_ROOT=${dataPlaneRuntime} BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET=${dataPlaneCursorSecret} BIOCHEMICAL_MEASURED_ROOT=${measuredRuntime} BIOCHEMICAL_MEASURED_CURSOR_SECRET=${measuredCursorSecret} BIOCHEMICAL_MEASURED_URL=http://127.0.0.1:8011 BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_FACTORY_URL=http://127.0.0.1:8010 BIOCHEMICAL_INFERENCE_USE_FIXTURE=true BIOCHEMICAL_EVIDENCE_USE_FIXTURE=true BIOCHEMICAL_DERIVED_USE_FIXTURE=true npm start`
        : `npm run build && NODE_ENV=test PORT=5173 HOST=127.0.0.1 BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_WORKSPACE_ROOT=${workspaceRuntime} BIOCHEMICAL_DATA_PLANE_ROOT=${dataPlaneRuntime} BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET=${dataPlaneCursorSecret} BIOCHEMICAL_MEASURED_ROOT=${measuredRuntime} BIOCHEMICAL_MEASURED_CURSOR_SECRET=${measuredCursorSecret} BIOCHEMICAL_MEASURED_URL=http://127.0.0.1:8000 BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_FACTORY_URL=http://127.0.0.1:8000 BIOCHEMICAL_DERIVED_URL=http://127.0.0.1:8002 BIOCHEMICAL_DERIVED_WRITE_TOKEN=${derivedToken} npm start`,
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
})
