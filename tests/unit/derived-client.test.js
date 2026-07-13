import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService } from '../../server/apap/service.js'
import { buildApapDerivedBundle } from '../../server/derived/bundle.js'
import { createDerivedClient } from '../../server/derived/client.js'

let submission

beforeAll(async () => {
  const record = await createApapRunService(createApapFixtureClient()).create({})
  submission = buildApapDerivedBundle(record)
}, 30_000)

afterEach(() => vi.unstubAllGlobals())

describe('server-only derived client', () => {
  it('uses bearer authorization only upstream and strips health key material', async () => {
    const token = 'private-derived-token-never-returned'
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        status: 'ok', journal_mode: 'wal', signing_key_id: `sha256:${'a'.repeat(64)}`, signing_public_key: 'public-key-material', bundles: 0, assertions: 0, content_objects: 0, events: 0
      }), { status: 200, headers: { 'content-type': 'application/json' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ created: true, bundle_digest: submission.digest, assertion_digests: submission.bundle.assertions.map((item) => item.digest) }), { status: 201, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createDerivedClient({ BIOCHEMICAL_DERIVED_URL: 'http://derived.test', BIOCHEMICAL_DERIVED_WRITE_TOKEN: token })

    const health = await client.health()
    const submitted = await client.submitBundle(submission)

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('authorization')
    expect(fetchMock.mock.calls[1][1].headers.authorization).toBe(`Bearer ${token}`)
    expect(health).not.toHaveProperty('signing_key_id')
    expect(health).not.toHaveProperty('signing_public_key')
    expect(JSON.stringify({ health, submitted })).not.toContain(token)
    expect(JSON.stringify({ health, submitted })).not.toContain('public-key-material')
  })
})
