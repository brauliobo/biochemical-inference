import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { BUNDLED_RELEASE } from '../../server/knowledge/fixture.js'
import { ModelSchema, NetworkSchema, ReleaseSchema } from '../../shared/contracts.js'

let app
afterEach(async () => app?.close())
const fixtureKnowledge = () => createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })

describe('simulation API', () => {
  it('serves model, release, and taxon-filtered network contracts', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const releases = await app.inject({ method: 'GET', url: '/api/v1/releases' })
    const network = await app.inject({ method: 'GET', url: `/api/v1/releases/${BUNDLED_RELEASE.id}/network?taxon_id=10090` })
    const model = await app.inject({ method: 'GET', url: '/api/v1/models/one-carbon' })

    expect(releases.statusCode).toBe(200)
    expect(() => ReleaseSchema.array().parse(releases.json())).not.toThrow()
    expect(releases.json()[0]).toMatchObject({ id: BUNDLED_RELEASE.id, verified: true })
    expect(network.statusCode).toBe(200)
    expect(() => NetworkSchema.parse(network.json())).not.toThrow()
    expect(network.json().proteins.every((protein) => protein.taxonId === 10090)).toBe(true)
    expect(model.json()).toMatchObject({ id: 'one-carbon', controls: { stepHours: 0.05 } })
    expect(() => ModelSchema.parse(model.json())).not.toThrow()
    expect(model.json().topology.reactions).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'RHEA:19819', kind: 'curated', knowledgeReactionId: 'RHEA:19819' }),
      expect.objectContaining({ id: 'MODEL:METHYLATION', kind: 'model-only' }),
      expect.objectContaining({ id: 'MODEL:METHIONINE-INPUT', kind: 'boundary' })
    ]))
  })

  it('returns a deterministic run and rejects unsupported controls', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const validBody = { releaseId: BUNDLED_RELEASE.id, taxonId: 9606, preset: 'baseline', mthfrActivity: 1, durationHours: 24, stepHours: 0.05 }
    const first = await app.inject({ method: 'POST', url: '/api/v1/models/one-carbon/simulations', payload: validBody })
    const second = await app.inject({ method: 'POST', url: '/api/v1/models/one-carbon/simulations', payload: validBody })
    const invalid = await app.inject({ method: 'POST', url: '/api/v1/models/one-carbon/simulations', payload: { ...validBody, durationHours: 100 } })

    expect(first.statusCode).toBe(200)
    expect(second.json()).toEqual(first.json())
    expect(invalid.statusCode).toBe(422)
    expect(invalid.json()).toMatchObject({ code: 'INVALID_SIMULATION', fieldErrors: { durationHours: expect.any(Array) } })
  })

  it('enforces preset activity semantics while allowing explicit custom activity', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const body = { releaseId: BUNDLED_RELEASE.id, taxonId: 9606, durationHours: 1, stepHours: 0.05 }
    const mismatch = await app.inject({ method: 'POST', url: '/api/v1/models/one-carbon/simulations', payload: { ...body, preset: 'baseline', mthfrActivity: 0.8 } })
    const custom = await app.inject({ method: 'POST', url: '/api/v1/models/one-carbon/simulations', payload: { ...body, preset: 'custom', mthfrActivity: 0.8 } })

    expect(mismatch.statusCode).toBe(422)
    expect(mismatch.json()).toMatchObject({ code: 'INVALID_SIMULATION', fieldErrors: { mthfrActivity: expect.any(Array) } })
    expect(custom.statusCode).toBe(200)
    expect(custom.json()).toMatchObject({ preset: 'custom', effectiveInputs: { mthfrActivity: 0.8 } })
  })

  it('preserves Fastify malformed JSON as a 4xx response', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/models/one-carbon/simulations',
      headers: { 'content-type': 'application/json' },
      payload: '{"releaseId":'
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ statusCode: 400, code: 'FST_ERR_CTP_INVALID_JSON_BODY' })
  })

  it('keeps liveness independent and fails readiness when the pinned release cannot be verified', async () => {
    const unavailable = {
      async releases() { throw new Error('upstream unavailable') },
      async network() { throw new Error('not called') }
    }
    app = await buildApp({ serveClient: false, knowledgeClient: unavailable })

    const health = await app.inject({ method: 'GET', url: '/api/v1/health' })
    const ready = await app.inject({ method: 'GET', url: '/api/v1/ready' })
    expect(health.statusCode).toBe(200)
    expect(health.json()).toMatchObject({ status: 'ok' })
    expect(ready.statusCode).toBe(503)
    expect(ready.json()).toMatchObject({ code: 'KNOWLEDGE_NOT_READY', message: 'upstream unavailable' })
  })

  it('allows configured production origins without reflecting unconfigured origins', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), env: { NODE_ENV: 'production', CORS_ORIGINS: 'https://allowed.example' } })
    const allowed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://allowed.example' } })
    const denied = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://denied.example' } })

    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example')
    expect(denied.headers['access-control-allow-origin']).toBeUndefined()
  })
})
