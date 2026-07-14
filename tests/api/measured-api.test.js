import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { MeasuredRequestError } from '../../server/measured/service.js'

const apps = []
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

function fakeMeasured() {
  return {
    close: vi.fn(),
    discovery: () => ({ contractVersion: '1.0.0', explicitSync: true }),
    status: () => ({ contractVersion: '1.0.0', integrity: 'empty', lastError: null, lastSyncAt: null, release: null, state: 'empty' }),
    sync: vi.fn(async () => ({ contractVersion: '1.0.0', integrity: 'valid', lastError: null, lastSyncAt: 'now', release: { id: 'measured-apap-observation-commons-v1.0.1', schema_version: '1.0.0', digest: '6a1f81b41d89e52d666e38a26943955ed3fdb008adb7ae23bb2c353abc0cd496' }, state: 'ready' })),
    page: vi.fn(), lineage: vi.fn(), calibrate: vi.fn(), listCalibrations: vi.fn(() => []), calibration: vi.fn(), integrity: vi.fn(), freeze: vi.fn(), disclose: vi.fn()
  }
}

describe('measured API boundary', () => {
  it('requires fixed browser origin/CSRF and applies no-store before protected authorization', async () => {
    const measured = fakeMeasured()
    const app = await buildApp({ serveClient: false, measuredService: measured, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' } })
    apps.push(app)
    const denied = await app.inject({ method: 'POST', url: '/api/v10/measured/commitments', payload: {} })
    expect(denied.statusCode).toBe(403)
    expect(denied.headers['cache-control']).toBe('private, no-store')
    expect(denied.headers.etag).toBeUndefined()
    expect(measured.freeze).not.toHaveBeenCalled()
    const synced = await app.inject({ method: 'POST', url: '/api/v10/measured/sync', headers: { origin: 'http://127.0.0.1:5173', 'x-measured-csrf': 'measured-commons-v1' }, payload: {} })
    expect(synced.statusCode).toBe(200)
    expect(measured.sync).toHaveBeenCalledOnce()
  }, 20_000)

  it('preserves measured synchronization error taxonomy', async () => {
    const measured = fakeMeasured()
    measured.sync.mockRejectedValue(new MeasuredRequestError('MEASURED_SYNC_SUPERSEDED', 'A newer measured sync superseded this request.', 409))
    const app = await buildApp({ serveClient: false, measuredService: measured, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' } })
    apps.push(app)
    const response = await app.inject({ method: 'POST', url: '/api/v10/measured/sync', headers: { origin: 'http://127.0.0.1:5173', 'x-measured-csrf': 'measured-commons-v1' }, payload: {} })
    expect(response.statusCode).toBe(409)
    expect(response.json().code).toBe('MEASURED_SYNC_SUPERSEDED')
  })
})
