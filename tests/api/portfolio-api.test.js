import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { ODE_MODEL } from '../../server/portfolio/registry.js'
import { createRunService } from '../../server/portfolio/execution.js'
import { ArchiveValidationResponseSchema, PortfolioModelSchema, RunRecordSchema } from '../../shared/portfolio-contracts.js'
import { benchmarkExperiment } from '../fixtures/portfolio/experiments.js'

let app
afterEach(async () => app?.close())

describe('portfolio API v2', () => {
  it('lists strict registry models and creates a deterministic terminal worker run', async () => {
    const direct = await createRunService().create(ODE_MODEL, benchmarkExperiment(ODE_MODEL))
    expect(direct.outcome).toBe('successful')
    app = await buildApp({ serveClient: false, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), env: { NODE_ENV: 'test' } })
    const listing = await app.inject({ method: 'GET', url: '/api/v2/models' })
    const experiment = benchmarkExperiment(ODE_MODEL)
    const first = await app.inject({ method: 'POST', url: '/api/v2/runs', payload: { experiment } })
    const second = await app.inject({ method: 'POST', url: '/api/v2/runs', payload: { experiment } })
    const detail = await app.inject({ method: 'GET', url: `/api/v2/runs/${encodeURIComponent(first.json().runId)}` })

    expect(PortfolioModelSchema.array().parse(listing.json())).toHaveLength(3)
    expect(first.statusCode, first.body).toBe(201)
    expect(RunRecordSchema.parse(first.json())).toMatchObject({ lifecycle: 'terminal', outcome: 'successful', result: { provenance: { seed: experiment.seed } } })
    expect(second.json()).toEqual(first.json())
    expect(detail.json()).toEqual(first.json())
  })

  it('exports, validates, and rejects malformed archive requests without execution', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), env: { NODE_ENV: 'test' } })
    const experiment = benchmarkExperiment(ODE_MODEL)
    const exported = await app.inject({ method: 'POST', url: '/api/v2/model-archives/export', payload: { experiment } })
    const validated = await app.inject({ method: 'POST', url: '/api/v2/model-archives/validate', payload: { archiveBase64: exported.json().archiveBase64 } })
    const malformed = await app.inject({ method: 'POST', url: '/api/v2/model-archives/validate', payload: { archiveBase64: '../not-base64' } })

    expect(exported.statusCode).toBe(200)
    expect(ArchiveValidationResponseSchema.parse(validated.json())).toMatchObject({ valid: true, model: { id: ODE_MODEL.id } })
    expect(malformed.statusCode).toBe(422)
  })

  it('rejects digest and algorithm mismatches before starting a worker', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), env: { NODE_ENV: 'test' } })
    const experiment = benchmarkExperiment(ODE_MODEL)
    const digestMismatch = await app.inject({ method: 'POST', url: '/api/v2/runs', payload: { experiment: { ...experiment, modelDigest: `sha256:${'0'.repeat(64)}` } } })
    const algorithmMismatch = await app.inject({ method: 'POST', url: '/api/v2/runs', payload: { experiment: { ...experiment, engine: { ...experiment.engine, algorithm: 'rk4' } } } })

    expect(digestMismatch).toMatchObject({ statusCode: 422 })
    expect(digestMismatch.json()).toMatchObject({ code: 'model_mismatch' })
    expect(algorithmMismatch.json()).toMatchObject({ code: 'algorithm_mismatch' })
  })
})
