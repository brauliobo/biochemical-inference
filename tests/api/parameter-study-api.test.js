import { afterEach, describe, expect, it, vi } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { createParameterFixtureClient } from '../../server/parameters/fixture.js'
import { PARAMETER_RELEASE_DIGEST, ParameterOptionsResponseSchema, StudyRecordSchema } from '../../shared/parameter-contracts.js'

let app
afterEach(async () => app?.close())

function fixtureApp(options = {}) {
  return buildApp({
    serveClient: false,
    knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }),
    parameterClient: createParameterFixtureClient(),
    env: { NODE_ENV: 'test' },
    ...options
  })
}

describe('parameter studies API v2', () => {
  it('returns pinned context-filtered options with visible exclusions and fixed partitions', async () => {
    app = await fixtureApp()
    const response = await app.inject({ method: 'GET', url: '/api/v2/parameter-options' })
    const options = ParameterOptionsResponseSchema.parse(response.json())

    expect(response.statusCode).toBe(200)
    expect(options.release.digest).toBe(PARAMETER_RELEASE_DIGEST)
    expect(options.decisions.map((item) => item.candidateId)).not.toContain('CANDIDATE:MTHFR-KM-ASSUMED')
    expect(options.decisions.find((item) => item.candidateId === 'CANDIDATE:DECAY-INCOMPATIBLE-UNIT')?.decision).toBe('excluded')
    expect(new Set(options.partitions[0].calibration_observation_ids)).not.toContain(options.partitions[0].validation_observation_ids[0])
  })

  it('creates immediate terminal studies with canonical reproducible identities', async () => {
    app = await fixtureApp()
    const first = await app.inject({ method: 'POST', url: '/api/v2/studies', payload: {} })
    const second = await app.inject({ method: 'POST', url: '/api/v2/studies', payload: {} })
    const record = StudyRecordSchema.parse(first.json())
    const detail = await app.inject({ method: 'GET', url: `/api/v2/studies/${encodeURIComponent(record.studyId)}` })

    expect(first.statusCode).toBe(201)
    expect(record).toMatchObject({ lifecycle: 'terminal', outcome: 'successful', result: { calibration: { converged: true }, posterior: { converged: true } } })
    expect(second.json()).toEqual(first.json())
    expect(detail.json()).toEqual(first.json())
  })

  it('rejects invalid study input before loading parameter evidence', async () => {
    const parameterClient = { catalog: vi.fn(), candidates: vi.fn(), contexts: vi.fn(), datasets: vi.fn() }
    app = await fixtureApp({ parameterClient })
    const response = await app.inject({ method: 'POST', url: '/api/v2/studies', payload: { seed: -1, unknown: true } })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toMatchObject({ code: 'INVALID_STUDY' })
    expect(parameterClient.candidates).not.toHaveBeenCalled()
  })
})
