import { afterEach, describe, expect, it, vi } from 'vitest'
import { rm, writeFile } from 'node:fs/promises'
import { buildApp } from '../../server/app.js'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { BUNDLED_RELEASE } from '../../server/knowledge/fixture.js'
import { ModelSchema, NetworkSchema, ProvenanceSchema, ReleaseSchema } from '../../shared/contracts.js'
import { AtlasCoverageResponseSchema, AtlasEntityResponseSchema, AtlasNetworkSchema, AtlasSubgraphSchema } from '../../shared/atlas-contracts.js'
import { BUNDLED_ATLAS_RELEASE } from '../../server/knowledge/atlas-fixture.js'
import { createEvidenceFixtureClient, FIXTURE_EVIDENCE_RELEASE } from '../../server/evidence/fixture.js'
import { EvidenceCompatibilityError } from '../../server/evidence/client.js'
import { DerivedCompatibilityError } from '../../server/derived/client.js'
import { MODEL } from '../../server/model.js'
import { EvidenceCandidateListResponseSchema, EvidenceCandidateResponseSchema, EvidenceDocumentResponseSchema, EvidenceHealthSchema, EvidenceSearchResponseSchema } from '../../shared/evidence-contracts.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

let app
let clientRoot
afterEach(async () => {
  await app?.close()
  if (clientRoot) await rm(clientRoot, { recursive: true, force: true })
  app = undefined
  clientRoot = undefined
})
const fixtureKnowledge = () => createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })

async function buildStaticApp(nodeEnv) {
  clientRoot = await isolatedTestRoot('static-client')
  await writeFile(`${clientRoot}/index.html`, '<!doctype html><title>Biochemical inference</title>')
  return buildApp({ clientRoot, knowledgeClient: fixtureKnowledge(), env: { NODE_ENV: nodeEnv, BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' } })
}

describe('simulation API', () => {
  it.each(['production', 'test', 'development'])('protects root, index, and fallback HTML from framing in %s', async (nodeEnv) => {
    app = await buildStaticApp(nodeEnv)
    const responses = await Promise.all([
      app.inject({ method: 'GET', url: '/' }),
      app.inject({ method: 'GET', url: '/index.html' }),
      app.inject({ method: 'GET', url: '/workbench/deep-link' })
    ])

    for (const response of responses) {
      expect(response.statusCode).toBe(200)
      expect(response.headers['content-type']).toContain('text/html')
      expect(response.headers['content-security-policy']).toBe("frame-ancestors 'none'")
      expect(response.headers['x-frame-options']).toBe('DENY')
    }
  })

  it('preserves existing HTML CSP and leaves JSON API responses unchanged', async () => {
    app = await buildStaticApp('test')
    app.get('/existing-csp', async (_request, reply) => reply
      .header('content-security-policy', "default-src 'self'")
      .type('text/html')
      .send('<!doctype html><title>Protected</title>'))

    const html = await app.inject({ method: 'GET', url: '/existing-csp' })
    const api = await app.inject({ method: 'GET', url: '/api/v1/health' })

    expect(html.headers['content-security-policy']).toBe("default-src 'self'")
    expect(html.headers['x-frame-options']).toBe('DENY')
    expect(api.json()).toEqual({ status: 'ok', modelVersion: MODEL.version })
    expect(api.headers['content-security-policy']).toBeUndefined()
    expect(api.headers['x-frame-options']).toBeUndefined()
  })

  it('proxies pinned search, document, and isolated unreviewed candidate contracts', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), evidenceClient: createEvidenceFixtureClient(), env: { NODE_ENV: 'test' } })
    const health = await app.inject({ method: 'GET', url: '/api/v3/evidence/health' })
    const search = await app.inject({ method: 'POST', url: '/api/v3/evidence/search', payload: { query: 'PMID:29891918', limit: 10, use_vector: false } })
    const document = await app.inject({ method: 'GET', url: '/api/v3/evidence/documents/PMCID%3APMC5995969' })
    const extracted = await app.inject({ method: 'POST', url: '/api/v3/evidence/candidates/extract', payload: { document_id: 'EVIDENCE-DOC:29891918', span_ids: ['SPAN:PMID-29891918-RESULTS-SUPPORT'], instruction: 'Extract one regulation assertion.' } })
    const candidateId = extracted.json().candidate.id
    const detail = await app.inject({ method: 'GET', url: `/api/v3/evidence/candidates/${encodeURIComponent(candidateId)}` })
    const listing = await app.inject({ method: 'GET', url: '/api/v3/evidence/candidates' })

    expect(health.statusCode).toBe(200)
    expect(() => EvidenceHealthSchema.parse(health.json())).not.toThrow()
    expect(health.json().release).toEqual(FIXTURE_EVIDENCE_RELEASE)
    expect(() => EvidenceSearchResponseSchema.parse(search.json())).not.toThrow()
    expect(search.json().items[0].score_components).toMatchObject({ exact: { rank: 1 } })
    expect(() => EvidenceDocumentResponseSchema.parse(document.json())).not.toThrow()
    expect(document.json().licenses[0].redistribution).toBe('full-text-permitted')
    expect(extracted.statusCode).toBe(201)
    expect(() => EvidenceCandidateResponseSchema.parse(extracted.json())).not.toThrow()
    expect(extracted.json().candidate.status).toBe('unreviewed')
    expect(detail.json().candidate).toEqual(extracted.json().candidate)
    expect(() => EvidenceCandidateListResponseSchema.parse(listing.json())).not.toThrow()
  })

  it('rejects invalid evidence requests before contacting the client', async () => {
    const evidenceClient = { search: vi.fn(), extract: vi.fn(), health: vi.fn(), candidates: vi.fn(), candidate: vi.fn(), document: vi.fn() }
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), evidenceClient, env: { NODE_ENV: 'test' } })
    const search = await app.inject({ method: 'POST', url: '/api/v3/evidence/search', payload: { query: '', unknown: true } })
    const candidate = await app.inject({ method: 'POST', url: '/api/v3/evidence/candidates/extract', payload: { document_id: 'bad', span_ids: [], instruction: '' } })

    expect(search.statusCode).toBe(422)
    expect(candidate.statusCode).toBe(422)
    expect(evidenceClient.search).not.toHaveBeenCalled()
    expect(evidenceClient.extract).not.toHaveBeenCalled()
  })

  it('marks evidence and derived proxy failures no-store', async () => {
    const evidenceClient = { ...createEvidenceFixtureClient(), health: async () => { throw new EvidenceCompatibilityError('evidence unavailable', { statusCode: 503, code: 'EVIDENCE_UNAVAILABLE' }) } }
    const derivedClient = { health: async () => { throw new DerivedCompatibilityError('derived unavailable', { statusCode: 503, code: 'DERIVED_UNAVAILABLE' }) } }
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), evidenceClient, derivedClient, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' } })
    for (const url of ['/api/v3/evidence/health', '/api/v6/derived/health']) {
      const response = await app.inject({ method: 'GET', url })
      expect(response.statusCode).toBe(503)
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers.pragma).toBe('no-cache')
    }
  })

  it('marks derived success, validation, and not-found responses no-store', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' } })
    const responses = [
      await app.inject({ method: 'GET', url: '/api/v6/derived/health' }),
      await app.inject({ method: 'POST', url: '/api/v6/derived/measurements/compare', payload: { uncertainty: true } }),
      await app.inject({ method: 'GET', url: '/api/v6/derived/not-a-route' })
    ]
    expect(responses.map((response) => response.statusCode)).toEqual([200, 422, 404])
    for (const response of responses) {
      expect(response.headers['cache-control']).toBe('no-store')
      expect(response.headers.pragma).toBe('no-cache')
      expect(response.headers.etag).toBeUndefined()
    }
  })

  it('allows route parameters up to the declared 200-character schema bound', async () => {
    const identifier = 'a'.repeat(200)
    const evidenceClient = { ...createEvidenceFixtureClient(), document: vi.fn(async (value) => ({ identifier: value })) }
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), evidenceClient, env: { NODE_ENV: 'test' } })
    const response = await app.inject({ method: 'GET', url: `/api/v3/evidence/documents/${identifier}` })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ identifier })
    expect(evidenceClient.document).toHaveBeenCalledWith(identifier)
  })

  it('proxies independently pinned atlas release, entity, traversal, claims, coverage, and network contracts', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const base = `/api/v2/releases/${BUNDLED_ATLAS_RELEASE.id}`
    const releases = await app.inject({ method: 'GET', url: '/api/v2/releases' })
    const detail = await app.inject({ method: 'GET', url: base })
    const entity = await app.inject({ method: 'GET', url: `${base}/entities/HGNC%3A7436?taxon_id=9606` })
    const graph = await app.inject({ method: 'GET', url: `${base}/subgraph?root_id=HGNC%3A7436&taxon_id=9606&max_depth=6&max_nodes=100` })
    const mouseClaims = await app.inject({ method: 'GET', url: `${base}/claims?taxon_id=10090&derivation=orthology-transferred` })
    const gaps = await app.inject({ method: 'GET', url: `${base}/coverage?taxon_id=10090&evidence_class=uncovered` })
    const mouseNetwork = await app.inject({ method: 'GET', url: `${base}/network?taxon_id=10090` })

    expect(releases.json()).toEqual([expect.objectContaining({ id: BUNDLED_ATLAS_RELEASE.id, digest: BUNDLED_ATLAS_RELEASE.digest })])
    expect(detail.json()).toMatchObject({ release: { id: BUNDLED_ATLAS_RELEASE.id }, apiContract: '2.0.0' })
    expect(() => AtlasEntityResponseSchema.parse(entity.json())).not.toThrow()
    expect(() => AtlasSubgraphSchema.parse(graph.json())).not.toThrow()
    expect(graph.json().entities.map((item) => item.id)).not.toContain('MGI:106639')
    expect(mouseClaims.json().items.every((item) => item.derivation === 'orthology-transferred')).toBe(true)
    expect(() => AtlasCoverageResponseSchema.parse(gaps.json())).not.toThrow()
    expect(gaps.json().items.map((item) => item.entityType).sort()).toEqual(['cell', 'disease', 'isoform'])
    expect(() => AtlasNetworkSchema.parse(mouseNetwork.json())).not.toThrow()
    expect(mouseNetwork.json().entities.map((item) => item.id)).not.toContain('HGNC:7436')
    expect(mouseNetwork.json().transformations).toHaveLength(3)
  })

  it('rejects unbounded atlas traversal parameters before contacting knowledge', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const base = `/api/v2/releases/${BUNDLED_ATLAS_RELEASE.id}`
    const depth = await app.inject({ method: 'GET', url: `${base}/subgraph?root_id=HGNC%3A7436&taxon_id=9606&max_depth=7` })
    const nodes = await app.inject({ method: 'GET', url: `${base}/subgraph?root_id=HGNC%3A7436&taxon_id=9606&max_nodes=101` })

    expect(depth.statusCode).toBe(400)
    expect(nodes.statusCode).toBe(400)
    expect(depth.json()).toMatchObject({ code: 'INVALID_ATLAS_QUERY' })
  })

  it('serves model, release, and taxon-filtered network contracts', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge() })
    const releases = await app.inject({ method: 'GET', url: '/api/v1/releases' })
    const provenance = await app.inject({ method: 'GET', url: `/api/v1/releases/${BUNDLED_RELEASE.id}/provenance` })
    const network = await app.inject({ method: 'GET', url: `/api/v1/releases/${BUNDLED_RELEASE.id}/network?taxon_id=10090` })
    const model = await app.inject({ method: 'GET', url: '/api/v1/models/one-carbon' })

    expect(releases.statusCode).toBe(200)
    expect(() => ReleaseSchema.array().parse(releases.json())).not.toThrow()
    expect(releases.json()[0]).toMatchObject({ id: BUNDLED_RELEASE.id, verified: true })
    expect(provenance.statusCode).toBe(200)
    expect(() => ProvenanceSchema.parse(provenance.json())).not.toThrow()
    expect(provenance.json()).toMatchObject({ releaseId: BUNDLED_RELEASE.id, releaseDigest: BUNDLED_RELEASE.digest })
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
      async atlasReleases() { return [] },
      async network() { throw new Error('not called') }
    }
    app = await buildApp({ serveClient: false, knowledgeClient: unavailable })

    const health = await app.inject({ method: 'GET', url: '/api/v1/health' })
    const ready = await app.inject({ method: 'GET', url: '/api/v1/ready' })
    expect(health.statusCode).toBe(200)
    expect(health.json()).toMatchObject({ status: 'ok' })
    expect(ready.statusCode).toBe(503)
    expect(ready.json()).toMatchObject({ code: 'KNOWLEDGE_NOT_READY', message: 'Runtime is not ready.' })
  })

  it('allows configured production origins without reflecting unconfigured origins', async () => {
    app = await buildApp({ serveClient: false, knowledgeClient: fixtureKnowledge(), env: { NODE_ENV: 'production', CORS_ORIGINS: 'https://allowed.example' } })
    const allowed = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://allowed.example' } })
    const denied = await app.inject({ method: 'GET', url: '/api/v1/health', headers: { origin: 'https://denied.example' } })

    expect(allowed.headers['access-control-allow-origin']).toBe('https://allowed.example')
    expect(denied.headers['access-control-allow-origin']).toBeUndefined()
  })
})
