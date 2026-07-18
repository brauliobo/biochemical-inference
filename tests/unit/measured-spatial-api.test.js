import { afterEach, describe, expect, it, vi } from 'vitest'
import { MEASURED_SPATIAL_PINS } from '../../shared/measured-spatial-contracts.js'
import { loadMeasuredSpatialStatus, syncMeasuredSpatial } from '../../src/api.js'

const status = {
  state: 'ready',
  integrity: 'valid',
  releaseId: MEASURED_SPATIAL_PINS.releaseId,
  cachedChunks: 0,
  totalChunks: 400,
  offlineComplete: false,
  lastError: null
}

function response(value, headers = { 'cache-control': 'no-store', 'content-type': 'application/json', pragma: 'no-cache' }) {
  return new Response(JSON.stringify(value), { status: 200, headers })
}

afterEach(() => vi.unstubAllGlobals())

describe('Goal 14 frontend API', () => {
  it('sends only the fixed CSRF mutation header and parses the strict status', async () => {
    const fetch = vi.fn(async () => response(status))
    vi.stubGlobal('fetch', fetch)

    await expect(syncMeasuredSpatial()).resolves.toEqual(status)
    expect(fetch).toHaveBeenCalledWith('/api/v12/measured-spatial/sync', expect.objectContaining({
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json', 'x-measured-spatial-csrf': 'goal14-measured-spatial-v1' }
    }))
  })

  it('rejects cacheable mutable status and identity drift', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(status, { 'cache-control': 'public, max-age=60', 'content-type': 'application/json' })))
    await expect(loadMeasuredSpatialStatus()).rejects.toMatchObject({ code: 'MEASURED_SPATIAL_CACHE_POLICY_INVALID' })

    vi.stubGlobal('fetch', vi.fn(async () => response({ ...status, releaseId: 'digimouse-other-v1.0.0' })))
    await expect(loadMeasuredSpatialStatus()).rejects.toThrow()
  })
})
