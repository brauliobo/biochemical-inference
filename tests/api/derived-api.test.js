import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService } from '../../server/apap/service.js'
import { buildApapDerivedBundle } from '../../server/derived/bundle.js'
import { createDerivedFixtureClient } from '../../server/derived/fixture.js'
import { createDerivedRunService } from '../../server/derived/service.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { APAP_RELEASE_ID } from '../../shared/apap-contracts.js'
import { DERIVED_CSRF_HEADER, DERIVED_CSRF_VALUE } from '../../shared/derived-contracts.js'

const specification = { releaseId: APAP_RELEASE_ID, contextId: 'CONTEXT:APAP-HUMAN-LIVER', protocolId: 'PROTOCOL:APAP-HUMAN-PK', stepHours: 0.01, outputEveryHours: 0.5, mechanismScales: { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 } }
const mutationHeaders = { host: 'untrusted-host.example', origin: 'http://localhost', [DERIVED_CSRF_HEADER]: DERIVED_CSRF_VALUE }
const reviewer = { id: 'local:derived-api-reviewer', name: 'API Reviewer', organization: 'Test Review Board', role: 'scientific-reviewer' }
let baseRecord
let app

beforeAll(async () => {
  baseRecord = await createApapRunService(createApapFixtureClient()).create(specification)
}, 30_000)

afterEach(async () => app?.close())

async function fixtureApp() {
  const apapClient = createApapFixtureClient()
  const apapRuns = createApapRunService(apapClient)
  await apapRuns.create(specification)
  return buildApp({
    serveClient: false,
    env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://localhost' },
    knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }),
    apapClient,
    apapRunService: apapRuns,
    derivedClient: createDerivedFixtureClient()
  })
}

describe('reviewed-derived API v6', () => {
  it('enforces Origin and CSRF while keeping credentials and signing keys out of responses', async () => {
    app = await fixtureApp()
    const url = `/api/v6/derived/apap-runs/${encodeURIComponent(baseRecord.runId)}/bundles`
    const missing = await app.inject({ method: 'POST', url })
    const crossOrigin = await app.inject({ method: 'POST', url, headers: { ...mutationHeaders, host: 'attacker.example', origin: 'https://attacker.example' } })
    const accepted = await app.inject({ method: 'POST', url, headers: mutationHeaders })
    const health = await app.inject({ method: 'GET', url: '/api/v6/derived/health' })
    const serialized = JSON.stringify({ accepted: accepted.json(), health: health.json() })

    expect(missing.statusCode).toBe(403)
    expect(crossOrigin.statusCode).toBe(403)
    expect(accepted.statusCode).toBe(201)
    expect(health.statusCode).toBe(200)
    expect(serialized).not.toContain('token')
    expect(serialized).not.toContain('signing_public_key')
    expect(serialized).not.toContain('signing_key_id')
  })

  it('preserves source records, exposes lineage and layers, and applies valid signed transitions', async () => {
    app = await fixtureApp()
    const sourceRequest = {
      method: 'POST', url: '/api/v6/derived/query',
      payload: { layers: ['source', 'reviewed-derived'], source: { family: 'apap', release_id: APAP_RELEASE_ID, collection: 'protocols', record_id: specification.protocolId }, reviewed_derived: { subject_id: 'OBSERVABLE:APAP-PEAK-INJURED-FRACTION', classification: 'predicted' } }
    }
    const sourceBefore = await app.inject(sourceRequest)
    const submitted = await app.inject({ method: 'POST', url: `/api/v6/derived/apap-runs/${encodeURIComponent(baseRecord.runId)}/bundles`, headers: mutationHeaders })
    const assertionDigest = submitted.json().assertion_digests[0]
    const detail = await app.inject({ method: 'GET', url: `/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}` })
    const accepted = await app.inject({ method: 'POST', url: `/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events`, headers: mutationHeaders, payload: { action: 'accepted', reviewer, reason: 'Accepted within explicit synthetic scope.', related_assertion_digest: null, reproduction_artifact_digest: null } })
    const sourceRecord = sourceBefore.json().source[0]
    const assertion = detail.json().assertion
    const comparison = await app.inject({
      method: 'POST', url: '/api/v6/derived/measurements/compare',
      payload: {
        assertion_digest: assertionDigest,
        measurement: {
          record: { type: 'record', family: 'apap', release_id: APAP_RELEASE_ID, release_digest: sourceRecord.release_digest, collection: 'protocols', record_id: sourceRecord.record.id, digest: sourceRecord.record_digest },
          value: assertion.value.value,
          unit: assertion.unit,
          context: assertion.context
        }
      }
    })
    const reproduced = await app.inject({ method: 'POST', url: `/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/reproduce`, headers: mutationHeaders, payload: { run_id: baseRecord.runId, reviewer, reason: 'Exact canonical result artifact matched.' } })
    const history = await app.inject({ method: 'GET', url: `/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events` })
    const sourceAfter = await app.inject(sourceRequest)

    expect(detail.json().assertion.dependencies.map((item) => item.type)).toEqual(['release', 'model', 'artifact', 'artifact'])
    expect(accepted.json().state.review_status).toBe('accepted')
    expect(comparison.statusCode).toBe(409)
    expect(comparison.json()).toMatchObject({ code: 'DERIVED_NO_ELIGIBLE_MEASUREMENT' })
    expect(comparison.headers['cache-control']).toBe('no-store')
    expect(reproduced.json().state.reproduction_verified).toBe(true)
    expect(history.json().items.map((item) => item.action)).toEqual(['accepted', 'reproduction-verified'])
    expect(history.json().items[1].previous_event_digest).toBe(history.json().items[0].event_digest)
    expect(sourceAfter.json().source).toEqual(sourceBefore.json().source)
    expect(sourceAfter.json()['reviewed-derived']).toHaveLength(1)
  }, 30_000)

  it('compares only an injected verified parameter observation with the exact Python wire shape', async () => {
    const submission = buildApapDerivedBundle(baseRecord)
    const assertion = submission.bundle.assertions[0].assertion
    const measurement = {
      record: { type: 'record', family: 'parameters', release_id: 'parameters-verified-fixture-v1', release_digest: `sha256:${'9'.repeat(64)}`, collection: 'observations', record_id: 'OBSERVATION:VERIFIED', digest: `sha256:${'8'.repeat(64)}` },
      value: assertion.value.value + 1,
      unit: assertion.unit,
      context: assertion.context,
      parameter_ids: [assertion.subject_id],
      trust: { eligibility: 'verified-measured-observation', data_origin: 'measured', source_id: 'VERIFIED_FIXTURE', source_class: 'trusted-external', evidence_locator_ids: ['EVIDENCE:VERIFIED'], evidence_class: 'measured' }
    }
    const derived = createDerivedFixtureClient({ verifiedMeasurements: [measurement] })
    const submitted = await derived.submitBundle(submission); const assertionDigest = submitted.assertion_digests[0]
    await derived.appendEvent(assertionDigest, { action: 'accepted', reviewer, reason: 'Accept verified comparison fixture.', related_assertion_digest: null, reproduction_artifact_digest: null })
    const compared = await derived.compare({ assertion_digest: assertionDigest, measurement: { record: measurement.record, value: measurement.value, unit: measurement.unit, context: measurement.context } })
    expect(compared.measurement).toMatchObject({ record: measurement.record, trust: measurement.trust })
    expect(compared).not.toHaveProperty('measurement_record')
    expect(compared.comparison.absolute_difference_si).toBeGreaterThanOrEqual(0)
  })

  it('does not append reproduction verification when the canonical rerun differs', async () => {
    const derived = createDerivedFixtureClient()
    const service = createDerivedRunService(derived, {
      get: () => baseRecord,
      create: async () => {
        const changed = structuredClone(baseRecord)
        changed.result.summary.peakInjuredFraction += 0.0001
        return changed
      }
    })
    const submitted = await service.submitApapRun(baseRecord.runId)
    const assertionDigest = submitted.assertion_digests[0]
    await derived.appendEvent(assertionDigest, { action: 'accepted', reviewer, reason: 'Accept before reproduction.', related_assertion_digest: null, reproduction_artifact_digest: null })

    await expect(service.reproduce(assertionDigest, { run_id: baseRecord.runId, reviewer, reason: 'Attempt exact rerun.' })).rejects.toMatchObject({ code: 'DERIVED_REPRODUCTION_MISMATCH' })
    expect((await derived.events(assertionDigest)).items.map((item) => item.action)).toEqual(['accepted'])
  })

  it('reports dependency impact without changing accepted review state', async () => {
    const derived = createDerivedFixtureClient()
    const submission = buildApapDerivedBundle(baseRecord)
    const submitted = await derived.submitBundle(submission)
    const assertionDigest = submitted.assertion_digests[0]
    await derived.appendEvent(assertionDigest, { action: 'accepted', reviewer, reason: 'Accepted for impact test.', related_assertion_digest: null, reproduction_artifact_digest: null })
    const dependency = submission.bundle.assertions[0].assertion.dependencies[0]

    const impact = await derived.impact({ changes: [{ previous: dependency, current_digest: `sha256:${'f'.repeat(64)}` }] })
    const detail = await derived.assertion(assertionDigest)

    expect(impact.items[0].assertion_digest).toBe(assertionDigest)
    expect(impact.automatic_invalidation).toBe(false)
    expect(detail.state).toMatchObject({ review_status: 'accepted', event_count: 1 })
  })

  it('keeps rejected, superseded, and invalidated states terminal and auditable', async () => {
    const derived = createDerivedFixtureClient()
    const variant = (digit) => {
      const changed = structuredClone(baseRecord)
      changed.runId = `sha256:${digit.repeat(64)}`
      changed.result.runId = changed.runId
      return buildApapDerivedBundle(changed)
    }
    const [primary, replacement, rejected, invalidated] = await Promise.all(['a', 'b', 'c', 'd'].map(async (digit) => {
      const submitted = await derived.submitBundle(variant(digit))
      return submitted.assertion_digests[0]
    }))
    const event = (action, fields = {}) => ({ action, reviewer, reason: `Transition fixture: ${action}.`, related_assertion_digest: fields.related ?? null, reproduction_artifact_digest: null })

    await derived.appendEvent(primary, event('accepted'))
    await derived.appendEvent(replacement, event('accepted'))
    await derived.appendEvent(rejected, event('rejected'))
    await derived.appendEvent(invalidated, event('accepted'))
    await derived.appendEvent(primary, event('superseded', { related: replacement }))
    await derived.appendEvent(invalidated, event('invalidated'))

    await expect(derived.appendEvent(rejected, event('accepted'))).rejects.toThrow(/not allowed from rejected/)
    expect((await derived.assertion(primary)).state).toMatchObject({ review_status: 'superseded', superseded_by: replacement, event_count: 2 })
    expect((await derived.assertion(rejected)).state).toMatchObject({ review_status: 'rejected', event_count: 1 })
    expect((await derived.assertion(invalidated)).state).toMatchObject({ review_status: 'invalidated', event_count: 2 })
  })
})
