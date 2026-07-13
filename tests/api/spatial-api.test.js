import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { createSpatialFixtureClient } from '../../server/spatial/fixture.js'
import {
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetsSchema,
  SpatialDescriptorsSchema,
  SpatialDetailSchema,
  SpatialDiscoverySchema,
  SpatialInventorySchema,
  SpatialMappingsSchema,
  SpatialSpacesSchema,
  SpatialStructuresSchema,
  SpatialTransformsSchema
} from '../../shared/spatial-contracts.js'

let app
afterEach(async () => app?.close())

async function fixtureApp() {
  return buildApp({
    serveClient: false,
    knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }),
    spatialClient: createSpatialFixtureClient(),
    env: { NODE_ENV: 'test' }
  })
}

describe('spatial API v5', () => {
  it('proxies the complete strict pinned metadata closure', async () => {
    app = await fixtureApp()
    const base = `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}`
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: '/api/v5/spatial' }),
      app.inject({ method: 'GET', url: base }),
      app.inject({ method: 'GET', url: `${base}/structures?taxon_id=NCBITaxon%3A9606` }),
      app.inject({ method: 'GET', url: `${base}/spaces?taxon_id=NCBITaxon%3A9606` }),
      app.inject({ method: 'GET', url: `${base}/transforms?taxon_id=NCBITaxon%3A9606` }),
      app.inject({ method: 'GET', url: `${base}/assets?taxon_id=NCBITaxon%3A9606` }),
      app.inject({ method: 'GET', url: `${base}/descriptors` }),
      app.inject({ method: 'GET', url: `${base}/mappings` }),
      app.inject({ method: 'GET', url: `${base}/inventory` })
    ])
    expect(responses.every((response) => response.statusCode === 200)).toBe(true)
    expect(SpatialDiscoverySchema.parse(responses[0].json())).toMatchObject({ releaseDigest: SPATIAL_RELEASE_DIGEST, hraAvailable: false })
    expect(SpatialDetailSchema.parse(responses[1].json()).inventory).toHaveLength(8)
    expect(SpatialStructuresSchema.parse(responses[2].json()).items).toHaveLength(2)
    expect(SpatialSpacesSchema.parse(responses[3].json()).items).toHaveLength(2)
    expect(SpatialTransformsSchema.parse(responses[4].json()).items).toHaveLength(1)
    expect(SpatialAssetsSchema.parse(responses[5].json()).items).toHaveLength(3)
    expect(SpatialDescriptorsSchema.parse(responses[6].json()).items).toHaveLength(6)
    expect(SpatialMappingsSchema.parse(responses[7].json()).items.find((item) => item.target_system === 'HRA')).toMatchObject({ status: 'unavailable', target_space_id: null })
    expect(SpatialInventorySchema.parse(responses[8].json()).items).toHaveLength(8)
    expect(responses[1].headers['cache-control']).toBe('public, max-age=31536000, immutable')
  })

  it('serves verified content and bounded immutable ranges by IDs', async () => {
    app = await fixtureApp()
    const content = `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/assets/ASSET:HUMAN-LOBULE-MESH/content/CONTENT:HUMAN-LOBULE-MESH`
    const full = await app.inject({ method: 'GET', url: content })
    const partial = await app.inject({ method: 'GET', url: content, headers: { range: 'bytes=0-9' } })
    const cached = await app.inject({ method: 'GET', url: content, headers: { 'if-none-match': full.headers.etag } })

    expect(full.statusCode).toBe(200)
    expect(full.headers['x-release-digest']).toBe(SPATIAL_RELEASE_DIGEST)
    expect(full.headers['x-content-sha256']).toBe('306dd8cca0e4c1b122543cf68c027edf5ef5019e5b7e71451b6428fc62d15695')
    expect(partial.statusCode).toBe(206)
    expect(partial.rawPayload.toString()).toBe('# Reposito')
    expect(partial.headers['content-range']).toBe('bytes 0-9/266')
    expect(cached.statusCode).toBe(304)
  })

  it('rejects traversal, mismatched assets, unknown releases, and unsafe ranges', async () => {
    app = await fixtureApp()
    const base = `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}`
    const wrong = await app.inject({ method: 'GET', url: `${base}/assets/ASSET:MOUSE-LOBULE-MESH/content/CONTENT:HUMAN-LOBULE-MESH` })
    const multiple = await app.inject({ method: 'GET', url: `${base}/assets/ASSET:HUMAN-LOBULE-MESH/content/CONTENT:HUMAN-LOBULE-MESH`, headers: { range: 'bytes=0-1,4-5' } })
    const traversal = await app.inject({ method: 'GET', url: `${base}/assets/ASSET:HUMAN-LOBULE-MESH/content/%2E%2E%2Fmanifest.json` })
    const unknown = await app.inject({ method: 'GET', url: '/api/v5/spatial/releases/unknown' })

    expect(wrong.statusCode).toBe(404)
    expect(multiple.statusCode).toBe(416)
    expect(multiple.headers['content-range']).toBe('bytes */266')
    expect(traversal.statusCode).toBe(404)
    expect(traversal.body).not.toContain('release_digest')
    expect(unknown.statusCode).toBe(404)
  })
})
