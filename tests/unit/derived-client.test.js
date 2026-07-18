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
    const client = createDerivedClient({ BIOCHEMICAL_DERIVED_URL: 'http://derived.test', BIOCHEMICAL_DERIVED_HEALTH_PATH: '/api/derived/v1/healthz', BIOCHEMICAL_DERIVED_WRITE_TOKEN: token })

    const health = await client.health()
    const submitted = await client.submitBundle(submission)

    expect(fetchMock.mock.calls[0][1].headers).not.toHaveProperty('authorization')
    expect(fetchMock.mock.calls[0][0]).toBe('http://derived.test/api/derived/v1/healthz')
    expect(fetchMock.mock.calls[1][1].headers.authorization).toBe(`Bearer ${token}`)
    expect(health).not.toHaveProperty('signing_key_id')
    expect(health).not.toHaveProperty('signing_public_key')
    expect(JSON.stringify({ health, submitted })).not.toContain(token)
    expect(JSON.stringify({ health, submitted })).not.toContain('public-key-material')
  })

  it('uses integrated defaults and preserves explicit derived URL and health overrides', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({
      status: 'ok', journal_mode: 'wal', signing_key_id: `sha256:${'a'.repeat(64)}`, signing_public_key: 'public-key-material', bundles: 0, assertions: 0, content_objects: 0, events: 0
    }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)

    await createDerivedClient({}).health()
    await createDerivedClient({ BIOCHEMICAL_DB_URL: 'http://database.test/' }).health()
    await createDerivedClient({
      BIOCHEMICAL_DB_URL: 'http://database.test',
      BIOCHEMICAL_DERIVED_URL: 'http://derived.test/',
      BIOCHEMICAL_DERIVED_HEALTH_PATH: '/custom/derived-healthz'
    }).health()

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      'http://127.0.0.1:8000/api/derived/v1/healthz',
      'http://database.test/api/derived/v1/healthz',
      'http://derived.test/custom/derived-healthz'
    ])
  })

  it('uses the exact Python measurement request and verified response shape', async () => {
    const assertion = submission.bundle.assertions[0].assertion
    const measurement = {
      record: { type: 'record', family: 'parameters', release_id: 'parameters-v1', release_digest: `sha256:${'1'.repeat(64)}`, collection: 'observations', record_id: 'OBSERVATION:1', digest: `sha256:${'2'.repeat(64)}` },
      value: assertion.value.value,
      unit: assertion.unit,
      context: assertion.context
    }
    const response = {
      assertion_digest: submission.bundle.assertions[0].digest,
      measurement: { ...measurement, trust: { eligibility: 'verified-measured-observation', data_origin: 'measured', source_id: 'SOURCE:1', source_class: 'trusted-external', evidence_locator_ids: ['EVIDENCE:1'], evidence_class: 'measured' } },
      unit_compatible: true,
      context_compatible: true,
      comparable: true,
      comparison: { derived_si: 1, measurement_si: 1, absolute_difference_si: 0, relative_difference: 0 },
      automatically_invalidated: false
    }
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(response), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createDerivedClient({ BIOCHEMICAL_DERIVED_URL: 'http://derived.test' })
    expect(await client.compare({ assertion_digest: response.assertion_digest, measurement })).toEqual(response)
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(payload.measurement).not.toHaveProperty('uncertainty')
    expect(response).not.toHaveProperty('measurement_record')
  })
})
