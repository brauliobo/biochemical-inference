import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { AttemptRecordSchema, ExperimentDetailSchema, ReportRecordSchema } from '../../shared/workspace-contracts.js'
import { workspaceSpecification } from '../fixtures/workspace.js'

let app
afterEach(async () => app?.close())

async function terminal(attemptId) {
  for (let index = 0; index < 200; index += 1) {
    const response = await app.inject({ method: 'GET', url: `/api/v7/workspace/runs/${encodeURIComponent(attemptId)}` })
    if (response.json().attempt.state === 'terminal') return response.json().attempt
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('attempt did not finish')
}

describe('experiment workspace API v7', () => {
  it('creates revisions, queues attempts, exposes events/artifacts/history, and builds reports', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), env: { NODE_ENV: 'test' } })
    const createdResponse = await app.inject({ method: 'POST', url: '/api/v7/workspace/experiments', payload: { name: 'API workspace', description: 'v7', specification: workspaceSpecification({ tissueId: 'UBERON:0002107' }), resourceProfileId: 'local-default' } })
    const created = ExperimentDetailSchema.parse(createdResponse.json())
    const revisionResponse = await app.inject({ method: 'POST', url: `/api/v7/workspace/experiments/${created.experiment.experimentId}/revisions`, payload: { specification: workspaceSpecification({ tags: ['changed'] }), resourceProfileId: 'local-default' } })
    const queuedResponse = await app.inject({ method: 'POST', url: '/api/v7/workspace/runs', payload: { revisionId: revisionResponse.json().revisionId } })
    const queued = AttemptRecordSchema.parse(queuedResponse.json())
    const completed = await terminal(queued.attemptId)
    const events = await app.inject({ method: 'GET', url: `/api/v7/workspace/runs/${queued.attemptId}/events` })
    const artifacts = await app.inject({ method: 'GET', url: `/api/v7/workspace/runs/${queued.attemptId}/artifacts` })
    const history = await app.inject({ method: 'GET', url: '/api/v7/workspace/runs?model=first_order_ode&taxon=NCBITaxon%3A9606&status=successful' })
    const reportResponse = await app.inject({ method: 'POST', url: '/api/v7/workspace/reports', payload: { attemptId: queued.attemptId } })
    const report = ReportRecordSchema.parse(reportResponse.json())
    const html = await app.inject({ method: 'GET', url: `/api/v7/workspace/reports/${report.reportId}/files/html` })

    expect(createdResponse.statusCode).toBe(201)
    expect(revisionResponse.json()).toMatchObject({ ordinal: 2, parentRevisionId: created.revisions[0].revisionId })
    expect(completed.outcome).toBe('successful')
    expect(events.json().map((event) => event.type)).toEqual(expect.arrayContaining(['queued', 'started', 'completed']))
    expect(artifacts.json()).toHaveLength(1)
    expect(history.json().total).toBe(1)
    expect(html.headers['content-security-policy']).toContain("default-src 'none'")
    expect(html.body).not.toContain('<script')
  })

  it('exports and imports a validated bundle and rejects unknown request fields', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), env: { NODE_ENV: 'test' } })
    const invalid = await app.inject({ method: 'POST', url: '/api/v7/workspace/experiments', payload: { name: 'invalid', description: '', specification: workspaceSpecification(), resourceProfileId: 'local-default', unexpected: true } })
    const created = await app.inject({ method: 'POST', url: '/api/v7/workspace/experiments', payload: { name: 'Portable API', description: '', specification: workspaceSpecification(), resourceProfileId: 'local-default' } })
    const exported = await app.inject({ method: 'GET', url: `/api/v7/workspace/experiments/${created.json().experiment.experimentId}/export` })
    const imported = await app.inject({ method: 'POST', url: '/api/v7/workspace/experiments/import', payload: { bundleBase64: exported.json().bundleBase64 } })

    expect(invalid).toMatchObject({ statusCode: 422 })
    expect(exported.json()).toMatchObject({ profile: 'biochemical-workspace-portable-1.0' })
    expect(ExperimentDetailSchema.parse(imported.json()).revisions[0].source).toBe('import')
  })
})
