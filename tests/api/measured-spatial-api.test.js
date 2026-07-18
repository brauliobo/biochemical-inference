import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { MEASURED_SPATIAL_PINS } from '../../shared/measured-spatial-contracts.js'
import { MeasuredSpatialRequestError } from '../../server/measured-spatial/service.js'

const apps = []
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

const descriptor = {
  array_id: 'liver-mask',
  level: 1,
  grid_zyx: [0, 0, 0],
  voxel_origin_zyx: [0, 0, 0],
  voxel_shape_zyx: [32, 128, 128],
  stored_shape_zyx: [32, 128, 128],
  path: 'arrays/liver-mask/1/0.0.0',
  codec: 'gzip-level-9-mtime-0',
  media_type: 'application/vnd.zarr.chunk',
  encoded_bytes: 3,
  encoded_sha256: 'a'.repeat(64),
  decoded_bytes: 524_288,
  decoded_sha256: 'b'.repeat(64)
}

function fakeMeasuredSpatial() {
  const status = { state: 'ready', integrity: 'valid', releaseId: MEASURED_SPATIAL_PINS.releaseId, cachedChunks: 1, totalChunks: 400, offlineComplete: false, lastError: null }
  return {
    close: vi.fn(),
    discovery: vi.fn(async () => ({ contractVersion: '1.0.0', status })),
    status: vi.fn(async () => status),
    sync: vi.fn(async () => status),
    recordPage: vi.fn((recordType) => ({ releaseId: MEASURED_SPATIAL_PINS.releaseId, releaseDigest: MEASURED_SPATIAL_PINS.releaseDigest, recordType, items: [{}] })),
    chunkInventory: vi.fn(() => ({ releaseId: MEASURED_SPATIAL_PINS.releaseId, releaseDigest: MEASURED_SPATIAL_PINS.releaseDigest, arrayId: 'liver-mask', level: 1, offset: 0, limit: 100, total: 1, items: [descriptor] })),
    chunk: vi.fn(async () => ({ descriptor, bytes: Buffer.from([1, 2, 3]), source: 'local' })),
    completeOffline: vi.fn(async () => ({ verifiedChunks: 400 })),
    integrity: vi.fn(async () => ({ status: 'valid', networkAccess: false }))
  }
}

const env = { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' }
const mutationHeaders = { origin: 'http://127.0.0.1:5173', 'x-measured-spatial-csrf': 'goal14-measured-spatial-v1' }

describe('Goal 14 measured-spatial API boundary', () => {
  it('requires same-origin CSRF for cache mutations and keeps mutable responses no-store', async () => {
    const measuredSpatial = fakeMeasuredSpatial()
    const app = await buildApp({ serveClient: false, measuredSpatialService: measuredSpatial, env })
    apps.push(app)

    expect((await app.inject({ method: 'POST', url: '/api/v12/measured-spatial/sync', payload: {} })).statusCode).toBe(403)
    const synchronized = await app.inject({ method: 'POST', url: '/api/v12/measured-spatial/sync', headers: mutationHeaders, payload: {} })
    expect(synchronized.statusCode).toBe(200)
    expect(measuredSpatial.sync).toHaveBeenCalled()
    for (const response of [synchronized, await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/status' }), await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/integrity' })]) {
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers.pragma).toBe('no-cache')
      expect(response.headers.etag).toBeUndefined()
    }
  })

  it('serves only manifest-owned atomic chunks with exact immutable release identities', async () => {
    const measuredSpatial = fakeMeasuredSpatial()
    const app = await buildApp({ serveClient: false, measuredSpatialService: measuredSpatial, env })
    apps.push(app)

    const inventory = await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks?array_id=liver-mask&level=1&offset=0&limit=100' })
    expect(inventory.statusCode).toBe(200)
    expect(inventory.headers['cache-control']).toBe('public, max-age=31536000, immutable')
    expect(inventory.headers['x-release-digest']).toBe(MEASURED_SPATIAL_PINS.releaseDigest)
    expect(measuredSpatial.chunkInventory).toHaveBeenCalledWith({ arrayId: 'liver-mask', level: 1, offset: 0, limit: 100 })

    const chunk = await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks/liver-mask/1/0/0/0' })
    expect(chunk.statusCode).toBe(200)
    expect(chunk.rawPayload).toEqual(Buffer.from([1, 2, 3]))
    expect(chunk.headers).toMatchObject({
      'accept-ranges': 'none',
      'cache-control': 'public, max-age=31536000, immutable',
      'x-cache-source': 'local',
      'x-array-id': 'liver-mask',
      'x-level': '1',
      'x-chunk-grid': '0.0.0',
      'x-release-digest': MEASURED_SPATIAL_PINS.releaseDigest
    })
    expect((await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks/liver-mask/1/0/0/0', headers: { range: 'bytes=0-1' } })).statusCode).toBe(416)
    expect((await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks/liver-mask/1/0/0/0?fallback=1' })).statusCode).toBe(416)
    expect((await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks/liver-mask/2/0/0/0' })).statusCode).toBe(422)
  })

  it('preserves visible upstream, corruption, and eviction error taxonomy', async () => {
    const measuredSpatial = fakeMeasuredSpatial()
    measuredSpatial.chunk.mockRejectedValue(new MeasuredSpatialRequestError('MEASURED_SPATIAL_CHUNK_NOT_CACHED', 'Selected chunk is absent and the producer network is unavailable.', 503))
    const app = await buildApp({ serveClient: false, measuredSpatialService: measuredSpatial, env })
    apps.push(app)

    const response = await app.inject({ method: 'GET', url: '/api/v12/measured-spatial/chunks/liver-mask/1/0/0/0' })
    expect(response.statusCode).toBe(503)
    expect(response.json()).toMatchObject({ code: 'MEASURED_SPATIAL_CHUNK_NOT_CACHED', message: expect.stringContaining('absent') })
    expect(response.headers['cache-control']).toBe('no-store')
  })
})
