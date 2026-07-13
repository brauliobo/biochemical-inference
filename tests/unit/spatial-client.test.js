import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSpatialClient, SpatialCompatibilityError } from '../../server/spatial/client.js'
import { createSpatialFixtureClient } from '../../server/spatial/fixture.js'
import { SPATIAL_RELEASE_DIGEST } from '../../shared/spatial-contracts.js'

afterEach(() => vi.unstubAllGlobals())

async function payloads() {
  const fixture = createSpatialFixtureClient()
  return { catalog: await fixture.catalog(), detail: await fixture.detail(), fixture }
}

describe('spatial upstream client', () => {
  it('fails closed on a configured release digest mismatch', () => {
    expect(() => createSpatialClient({ BIOCHEMICAL_SPATIAL_EXPECTED_DIGEST: '0'.repeat(64) })).toThrow(SpatialCompatibilityError)
  })

  it('rejects metadata whose release digest drifts', async () => {
    const { catalog, detail } = await payloads()
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...detail, release: { ...detail.release, digest: '0'.repeat(64) } }), { status: 200 })))
    await expect(createSpatialClient({}).detail()).rejects.toThrow('release detail schema is incompatible')
  })

  it('recomputes and rejects canonical manifest digest drift server-side', async () => {
    const { catalog, detail } = await payloads()
    const changed = { ...detail, manifest: { ...detail.manifest, scientific_scope: `${detail.manifest.scientific_scope} changed` } }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(changed), { status: 200 })))
    await expect(createSpatialClient({}).detail()).rejects.toThrow('canonical manifest digest')
  })

  it('verifies full content bytes and immutable digest headers', async () => {
    const { catalog, detail, fixture } = await payloads()
    const item = detail.inventory[0]
    const upstream = await fixture.content(item.asset_id, item.id)
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detail), { status: 200 }))
      .mockResolvedValueOnce(new Response(upstream.body, { status: 200, headers: { 'accept-ranges': 'bytes', 'content-type': item.media_type, etag: `"sha256:${item.sha256}"`, 'x-content-sha256': item.sha256, 'x-release-digest': SPATIAL_RELEASE_DIGEST } })))

    const content = await createSpatialClient({}).content(item.asset_id, item.id)
    expect(content.body.length).toBe(item.bytes)
    expect(content.item.sha256).toBe(item.sha256)
  })

  it('rejects content when upstream digest headers do not match inventory', async () => {
    const { catalog, detail, fixture } = await payloads()
    const item = detail.inventory[0]
    const upstream = await fixture.content(item.asset_id, item.id)
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(detail), { status: 200 }))
      .mockResolvedValueOnce(new Response(upstream.body, { status: 200, headers: { 'accept-ranges': 'bytes', 'content-type': item.media_type, etag: `"sha256:${item.sha256}"`, 'x-content-sha256': '0'.repeat(64), 'x-release-digest': SPATIAL_RELEASE_DIGEST } })))

    await expect(createSpatialClient({}).content(item.asset_id, item.id)).rejects.toThrow('digest headers')
  })
})
