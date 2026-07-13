import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import {
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  ApapDiscoverySchema,
  ApapRunRecordSchema,
  UpstreamApapAssumptionsSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../../shared/apap-contracts.js'

let app
afterEach(async () => app?.close())

function fixtureApp(options = {}) {
  return buildApp({
    serveClient: false,
    knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }),
    apapClient: createApapFixtureClient(),
    env: { NODE_ENV: 'test' },
    ...options
  })
}

describe('APAP benchmark API v4', () => {
  it('discovers and proxies the complete independently pinned release contract', async () => {
    app = await fixtureApp()
    const base = `/api/v4/apap/releases/${APAP_RELEASE_ID}`
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: '/api/v4/apap' }),
      app.inject({ method: 'GET', url: base }),
      app.inject({ method: 'GET', url: `${base}/contexts` }),
      app.inject({ method: 'GET', url: `${base}/parameters` }),
      app.inject({ method: 'GET', url: `${base}/protocols` }),
      app.inject({ method: 'GET', url: `${base}/observations` }),
      app.inject({ method: 'GET', url: `${base}/assumptions` }),
      app.inject({ method: 'GET', url: `${base}/limitations` }),
      app.inject({ method: 'GET', url: `${base}/validation-matrix` })
    ])

    expect(responses.every((response) => response.statusCode === 200)).toBe(true)
    expect(ApapDiscoverySchema.parse(responses[0].json()).releaseDigest).toBe(APAP_RELEASE_DIGEST)
    expect(() => UpstreamApapDetailSchema.parse(responses[1].json())).not.toThrow()
    expect(() => UpstreamApapContextsSchema.parse(responses[2].json())).not.toThrow()
    expect(() => UpstreamApapParametersSchema.parse(responses[3].json())).not.toThrow()
    expect(() => UpstreamApapProtocolsSchema.parse(responses[4].json())).not.toThrow()
    expect(() => UpstreamApapObservationsSchema.parse(responses[5].json())).not.toThrow()
    expect(() => UpstreamApapAssumptionsSchema.parse(responses[6].json())).not.toThrow()
    expect(() => UpstreamApapLimitationsSchema.parse(responses[7].json())).not.toThrow()
    expect(() => UpstreamApapValidationSchema.parse(responses[8].json())).not.toThrow()
  })

  it('creates deterministic canonical runs with all result and diagnostic contracts', async () => {
    app = await fixtureApp()
    const payload = { releaseId: APAP_RELEASE_ID, contextId: 'CONTEXT:APAP-HUMAN-LIVER', protocolId: 'PROTOCOL:APAP-HUMAN-PK', stepHours: 0.01, outputEveryHours: 0.5, mechanismScales: { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 } }
    const first = await app.inject({ method: 'POST', url: '/api/v4/apap/runs', payload })
    const second = await app.inject({ method: 'POST', url: '/api/v4/apap/runs', payload })
    const record = ApapRunRecordSchema.parse(first.json())
    const detail = await app.inject({ method: 'GET', url: `/api/v4/apap/runs/${encodeURIComponent(record.runId)}` })

    expect(first.statusCode).toBe(201)
    expect(second.json()).toEqual(first.json())
    expect(detail.json()).toEqual(first.json())
    expect(record.result.equationSet.taxonBranches).toBe(false)
    expect(record.result.lobule.snapshots[0].apap).toHaveLength(12)
    expect(record.result.diagnostics.mass.passed).toBe(true)
    expect(record.result.diagnostics.cellState.passed).toBe(true)
    expect(record.result.diagnostics.limitingCases.every((item) => item.passed)).toBe(true)
    expect(record.result.validationMatrix.every((item) => item.validation_status === 'unsupported')).toBe(true)
  }, 30_000)

  it('rejects invalid and cross-context runs before numerical execution', async () => {
    const runService = { create: vi.fn(), get: vi.fn() }
    app = await fixtureApp({ apapRunService: runService })
    const invalid = await app.inject({ method: 'POST', url: '/api/v4/apap/runs', payload: { unknown: true } })

    expect(invalid.statusCode).toBe(422)
    expect(runService.create).not.toHaveBeenCalled()

    await app.close()
    app = await fixtureApp()
    const mismatch = await app.inject({ method: 'POST', url: '/api/v4/apap/runs', payload: { contextId: 'CONTEXT:APAP-MOUSE-LIVER', protocolId: 'PROTOCOL:APAP-HUMAN-PK' } })
    expect(mismatch.statusCode).toBe(422)
    expect(mismatch.json()).toMatchObject({ code: 'INVALID_APAP_RUN' })
  })
})
