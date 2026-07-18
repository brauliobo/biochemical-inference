import { defineConfig, devices } from '@playwright/test'
import { randomBytes } from 'node:crypto'
import { resolve } from 'node:path'
import { E2E_REVALIDATION } from './tests/fixtures/revalidation-e2e-runtime.js'

const useFixture = process.env.E2E_USE_FIXTURE === 'true'
const runtimeRoot = process.env.E2E_RUNTIME_ROOT ?? resolve(process.cwd(), '..', `.biochemical-inference-e2e-${process.pid}`)
process.env.E2E_RUNTIME_ROOT = runtimeRoot
const buildPrefix = process.env.E2E_SKIP_BUILD === 'true' ? '' : 'npm run build && '
const databaseRuntime = `${runtimeRoot}/database-js`
const workspaceRuntime = `${runtimeRoot}/workspace`
const dataPlaneRuntime = `${runtimeRoot}/data-plane`
const measuredRuntime = `${runtimeRoot}/measured-local`
const challengeRuntime = `${runtimeRoot}/challenge-local`
const measuredSpatialRuntime = `${runtimeRoot}/measured-spatial-local`
const spatialRegistrationRuntime = `${runtimeRoot}/spatial-registration-local`
const revalidationProducerRuntime = `${runtimeRoot}/revalidation-producer`
const revalidationRuntime = `${runtimeRoot}/revalidation-local`
const derivedToken = randomBytes(32).toString('hex')
const factoryCursorSecret = randomBytes(32).toString('base64url')
const dataPlaneCursorSecret = randomBytes(32).toString('base64url')
const measuredCursorSecret = randomBytes(32).toString('base64url')
const measuredCsrfToken = randomBytes(32).toString('base64url')
const challengeCsrfToken = process.env.E2E_CHALLENGE_CSRF_TOKEN ?? randomBytes(32).toString('base64url')
const evidenceCsrfToken = randomBytes(32).toString('base64url')
const challengeCursorSecret = randomBytes(32).toString('base64url')
const revalidationCursorSecret = randomBytes(32).toString('base64url')
const revalidationEnvironment = `BIOCHEMICAL_REVALIDATION_ROOT=${revalidationRuntime} BIOCHEMICAL_REVALIDATION_CURSOR_SECRET=${revalidationCursorSecret} BIOCHEMICAL_REVALIDATION_URL=http://127.0.0.1:8000 BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN=${E2E_REVALIDATION.authorBearerToken} BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN=${E2E_REVALIDATION.executorBearerToken} BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID=${E2E_REVALIDATION.bootstrapKeyId} BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY=${E2E_REVALIDATION.bootstrapPublicKey} BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID=${E2E_REVALIDATION.rolePolicyId}`

export default defineConfig({
  testDir: 'tests/e2e',
  globalTeardown: './tests/fixtures/e2e-global-teardown.js',
  globalTimeout: 20 * 60_000,
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'line' : 'html',
  use: { baseURL: 'http://127.0.0.1:5173', trace: 'on-first-retry' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Galaxy S9+'], viewport: { width: 360, height: 740 } } }
  ],
  webServer: [
    {
      command: `sh -c 'umask 077 && mkdir -p "${databaseRuntime}" && test -f "${databaseRuntime}/derived.pem" || openssl genpkey -algorithm Ed25519 -out "${databaseRuntime}/derived.pem"; BIOCHEMICAL_JS_HOST=127.0.0.1 PORT=8000 BIOCHEMICAL_JS_KNOWLEDGE_ROOT=../knowledge BIOCHEMICAL_JS_STATE_ROOT="${databaseRuntime}/state" BIOCHEMICAL_JS_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_JS_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_JS_CHALLENGE_CSRF_TOKEN=${challengeCsrfToken} BIOCHEMICAL_JS_EVIDENCE_CSRF_TOKEN=${evidenceCsrfToken} BIOCHEMICAL_JS_DERIVED_PRIVATE_KEY="${databaseRuntime}/derived.pem" BIOCHEMICAL_JS_DERIVED_BEARER_TOKEN=${derivedToken} BIOCHEMICAL_JS_FACTORY_CURSOR_SECRET=${factoryCursorSecret} BIOCHEMICAL_JS_MEASURED_CURSOR_SECRET=${measuredCursorSecret} BIOCHEMICAL_JS_CHALLENGE_CURSOR_SECRET=${challengeCursorSecret} E2E_REVALIDATION_RUNTIME="${revalidationProducerRuntime}" node ../../biochemical-inference/tests/fixtures/revalidation-e2e-runtime.js'`,
      cwd: '../biochemical-db/service-js',
      url: 'http://127.0.0.1:8000/readyz',
      reuseExistingServer: false,
      timeout: 180_000
    },
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
    }] : []),
    {
      command: useFixture
        ? `${buildPrefix}NODE_ENV=test PORT=5173 HOST=127.0.0.1 BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_WORKSPACE_ROOT=${workspaceRuntime} BIOCHEMICAL_DATA_PLANE_ROOT=${dataPlaneRuntime} BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET=${dataPlaneCursorSecret} BIOCHEMICAL_MEASURED_ROOT=${measuredRuntime} BIOCHEMICAL_MEASURED_CURSOR_SECRET=${measuredCursorSecret} BIOCHEMICAL_MEASURED_URL=http://127.0.0.1:8011 BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_MEASURED_SPATIAL_ROOT=${measuredSpatialRuntime} BIOCHEMICAL_MEASURED_SPATIAL_URL=http://127.0.0.1:8000 BIOCHEMICAL_SPATIAL_REGISTRATION_ROOT=${spatialRegistrationRuntime} BIOCHEMICAL_SPATIAL_REGISTRATION_URL=http://127.0.0.1:8000 BIOCHEMICAL_CHALLENGE_URL=http://127.0.0.1:8000 BIOCHEMICAL_CHALLENGE_ROOT=${challengeRuntime} BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_CHALLENGE_CSRF_TOKEN=${challengeCsrfToken} BIOCHEMICAL_FACTORY_URL=http://127.0.0.1:8010 BIOCHEMICAL_INFERENCE_USE_FIXTURE=true BIOCHEMICAL_EVIDENCE_USE_FIXTURE=true BIOCHEMICAL_DERIVED_USE_FIXTURE=true ${revalidationEnvironment} npm start`
        : `${buildPrefix}NODE_ENV=test PORT=5173 HOST=127.0.0.1 BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_WORKSPACE_ROOT=${workspaceRuntime} BIOCHEMICAL_DATA_PLANE_ROOT=${dataPlaneRuntime} BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET=${dataPlaneCursorSecret} BIOCHEMICAL_MEASURED_ROOT=${measuredRuntime} BIOCHEMICAL_MEASURED_CURSOR_SECRET=${measuredCursorSecret} BIOCHEMICAL_DB_URL=http://127.0.0.1:8000 BIOCHEMICAL_MEASURED_URL=http://127.0.0.1:8000 BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_MEASURED_CSRF_TOKEN=${measuredCsrfToken} BIOCHEMICAL_MEASURED_SPATIAL_ROOT=${measuredSpatialRuntime} BIOCHEMICAL_MEASURED_SPATIAL_URL=http://127.0.0.1:8000 BIOCHEMICAL_SPATIAL_REGISTRATION_ROOT=${spatialRegistrationRuntime} BIOCHEMICAL_SPATIAL_REGISTRATION_URL=http://127.0.0.1:8000 BIOCHEMICAL_CHALLENGE_URL=http://127.0.0.1:8000 BIOCHEMICAL_CHALLENGE_ROOT=${challengeRuntime} BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_CHALLENGE_CSRF_TOKEN=${challengeCsrfToken} BIOCHEMICAL_FACTORY_URL=http://127.0.0.1:8000 BIOCHEMICAL_EVIDENCE_URL=http://127.0.0.1:8000 BIOCHEMICAL_EVIDENCE_HEALTH_PATH=/api/evidence/v1/healthz BIOCHEMICAL_EVIDENCE_ALLOWED_ORIGIN=http://127.0.0.1:5173 BIOCHEMICAL_EVIDENCE_CSRF_TOKEN=${evidenceCsrfToken} BIOCHEMICAL_DERIVED_URL=http://127.0.0.1:8000 BIOCHEMICAL_DERIVED_HEALTH_PATH=/api/derived/v1/healthz BIOCHEMICAL_DERIVED_WRITE_TOKEN=${derivedToken} ${revalidationEnvironment} npm start`,
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120_000
    }
  ]
})
