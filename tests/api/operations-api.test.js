import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'

let app
afterEach(async () => { await app?.close(); app = undefined })

const fixtureKnowledge = () => createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })

describe('operational endpoints', () => {
  it('provides bounded readiness and fixed-cardinality path-free metrics', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_EVIDENCE_USE_FIXTURE: 'true', BIOCHEMICAL_OPTIONAL_UNINITIALIZED_DOMAINS: 'challenge,data-plane,measured,measured-spatial,physiology,revalidation,spatial-registration,workspace' } })
    const readiness = await app.inject({ method: 'GET', url: '/ops/readyz' })
    expect(readiness.json()).toMatchObject({ status: 'ready', domains: { challenge: 'uninitialized', revalidation: 'uninitialized' } })
    await app.inject({ method: 'GET', url: '/missing-operational-probe' })
    const metrics = await app.inject({ method: 'GET', url: '/metrics' })
    expect(metrics.statusCode).toBe(200)
    expect(metrics.headers['cache-control']).toBe('no-store')
    expect(metrics.body).toContain('biochemical_inference_http_responses_total{class="4xx"} 1')
    expect(metrics.body).not.toContain('/missing-operational-probe')
    expect(metrics.body).not.toContain('BIOCHEMICAL_')
  })

  it('returns a generic no-store readiness failure without upstream details', async () => {
    const knowledge = fixtureKnowledge()
    knowledge.releases = async () => { throw new Error('/private/path?token=secret') }
    app = await buildApp({ serveClient: false, knowledgeClient: knowledge, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_EVIDENCE_USE_FIXTURE: 'true' } })
    const response = await app.inject({ method: 'GET', url: '/ops/readyz' })
    expect(response.statusCode).toBe(503)
    expect(response.headers['cache-control']).toBe('no-store')
    expect(response.body).not.toContain('/private/path')
    expect(response.body).not.toContain('secret')
  })
})
