import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { SpatialRegistrationRequestError } from '../../server/spatial-registration/service.js'
import { SPATIAL_REGISTRATION_PINS, SPATIAL_REGISTRATION_RIGHTS_LINK } from '../../shared/spatial-registration-contracts.js'

const apps = []
afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())))

const status = { state: 'ready', integrity: 'valid', releaseId: SPATIAL_REGISTRATION_PINS.releaseId, cachedChunks: 1, totalChunks: 304, offlineComplete: false, residualOverlapRecomputed: true, lastError: null }
const descriptor = {
  array_id: 'evaluation-roi', level: 0, grid_zyx: [0, 0, 0], voxel_origin_zyx: [0, 0, 0], voxel_shape_zyx: [32, 40, 48],
  path: 'arrays/evaluation-roi/0/0.0.0', codec: 'gzip-level-9-mtime-0', media_type: 'application/vnd.zarr.chunk', encoded_bytes: 3,
  encoded_sha256: 'a'.repeat(64), decoded_bytes: 61_440, decoded_sha256: 'b'.repeat(64)
}

function fakeRegistration() {
  return {
    close: vi.fn(),
    discovery: vi.fn(async () => ({ contractVersion: '1.1.0', mode: 'independently-pinned-source-prealigned-registration', pins: SPATIAL_REGISTRATION_PINS, status, goal14Complete: false, diagnosticUse: false, routes: {} })),
    status: vi.fn(async () => status),
    sync: vi.fn(async () => status),
    recordPage: vi.fn((recordType) => ({ releaseId: SPATIAL_REGISTRATION_PINS.releaseId, releaseDigest: SPATIAL_REGISTRATION_PINS.releaseDigest, recordType, items: [] })),
    chunkInventory: vi.fn(() => ({ releaseId: SPATIAL_REGISTRATION_PINS.releaseId, releaseDigest: SPATIAL_REGISTRATION_PINS.releaseDigest, arrayId: 'evaluation-roi', offset: 0, limit: 100, total: 1, items: [descriptor] })),
    chunk: vi.fn(async () => ({ descriptor, bytes: Buffer.from([1, 2, 3]), source: 'local' })),
    recomputeResidualOverlap: vi.fn(async () => ({ recomputed: true })),
    transform: vi.fn(async () => ({ direction: 'forward' })),
    completeOffline: vi.fn(async () => ({ verifiedChunks: 304 })),
    integrity: vi.fn(async () => ({ status: 'valid', networkAccess: false }))
  }
}

const env = { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://127.0.0.1:5173' }
const mutationHeaders = { origin: 'http://127.0.0.1:5173', 'x-spatial-registration-csrf': 'goal14-spatial-registration-v1' }

describe('Goal 14 spatial-registration API boundary', () => {
  it('requires same-origin CSRF and keeps residual-overlap and transform intents no-store', async () => {
    const spatialRegistration = fakeRegistration()
    const app = await buildApp({ serveClient: false, spatialRegistrationService: spatialRegistration, env })
    apps.push(app)

    expect((await app.inject({ method: 'POST', url: '/api/v14/spatial-registration/residual-overlap', payload: {} })).statusCode).toBe(403)
    const residualOverlap = await app.inject({ method: 'POST', url: '/api/v14/spatial-registration/residual-overlap', headers: mutationHeaders, payload: {} })
    const transformed = await app.inject({ method: 'POST', url: '/api/v14/spatial-registration/transform', headers: mutationHeaders, payload: { sourceSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', targetSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-MR-PREALIGNED', pointXyzMm: [192, 160, 192] } })
    expect(residualOverlap.statusCode).toBe(200)
    expect(transformed.statusCode).toBe(200)
    for (const response of [residualOverlap, transformed]) {
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers.pragma).toBe('no-cache')
      expect(response.headers.etag).toBeUndefined()
    }
  })

  it('serves only manifest-owned atomic chunks with release and rights identities', async () => {
    const spatialRegistration = fakeRegistration()
    const app = await buildApp({ serveClient: false, spatialRegistrationService: spatialRegistration, env })
    apps.push(app)

    const inventory = await app.inject({ method: 'GET', url: '/api/v14/spatial-registration/chunks?array_id=evaluation-roi&offset=0&limit=100' })
    expect(inventory.statusCode).toBe(200)
    expect(inventory.headers.link).toBe(SPATIAL_REGISTRATION_RIGHTS_LINK)
    expect(inventory.headers['x-release-digest']).toBe(SPATIAL_REGISTRATION_PINS.releaseDigest)
    expect(spatialRegistration.chunkInventory).toHaveBeenCalledWith({ arrayId: 'evaluation-roi', offset: 0, limit: 100 })

    const chunk = await app.inject({ method: 'GET', url: '/api/v14/spatial-registration/chunks/evaluation-roi/0/0/0' })
    expect(chunk.statusCode).toBe(200)
    expect(chunk.rawPayload).toEqual(Buffer.from([1, 2, 3]))
    expect(chunk.headers).toMatchObject({ 'accept-ranges': 'none', 'cache-control': 'public, max-age=31536000, immutable', link: SPATIAL_REGISTRATION_RIGHTS_LINK, 'x-cache-source': 'local', 'x-array-id': 'evaluation-roi', 'x-level': '0', 'x-chunk-grid': '0.0.0' })
    expect((await app.inject({ method: 'GET', url: '/api/v14/spatial-registration/chunks/evaluation-roi/0/0/0', headers: { range: 'bytes=0-1' } })).statusCode).toBe(416)
    expect((await app.inject({ method: 'GET', url: '/api/v14/spatial-registration/chunks/evaluation-roi/0/0/0?fallback=1' })).statusCode).toBe(416)
    expect((await app.inject({ method: 'GET', url: '/api/v14/spatial-registration/chunks/unknown/0/0/0' })).statusCode).toBe(422)
  })

  it('preserves the explicit same-space request taxonomy', async () => {
    const spatialRegistration = fakeRegistration()
    spatialRegistration.transform.mockRejectedValue(new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_SAME_SPACE_REQUEST', 'Source and target are the same published space; no registration transform is required.', 422))
    const app = await buildApp({ serveClient: false, spatialRegistrationService: spatialRegistration, env })
    apps.push(app)

    const response = await app.inject({ method: 'POST', url: '/api/v14/spatial-registration/transform', headers: mutationHeaders, payload: { sourceSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', targetSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', pointXyzMm: [0, 0, 0] } })
    expect(response.statusCode).toBe(422)
    expect(response.json()).toMatchObject({ code: 'SPATIAL_REGISTRATION_SAME_SPACE_REQUEST', message: expect.stringContaining('no registration transform is required') })
    expect(response.headers['cache-control']).toBe('no-store')
  })
})
