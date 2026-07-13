import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import Fastify from 'fastify'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { z } from 'zod'
import { ApiErrorSchema, SimulationRequestSchema, TaxonIdSchema } from '../shared/contracts.js'
import { EvidenceCandidateExtractionRequestSchema, EvidenceSearchRequestSchema } from '../shared/evidence-contracts.js'
import { createEvidenceClient, EvidenceCompatibilityError } from './evidence/client.js'
import { createKnowledgeClient, KnowledgeCompatibilityError } from './knowledge/client.js'
import { MODEL } from './model.js'
import { simulate, SimulationNumericalError } from './simulation.js'

const AtlasCurieSchema = z.string().regex(/^(?:HGNC|MGI|Ensembl|UniProtKB|CHEBI|RHEA|Reactome|GO|UBERON|MONDO|HP|MP):[A-Za-z0-9_.-]+$/)
const OptionalAtlasTaxonSchema = z.preprocess((value) => value === undefined ? undefined : Number(value), TaxonIdSchema.optional())
const AtlasEntityQuerySchema = z.object({ taxon_id: OptionalAtlasTaxonSchema }).strict()
const AtlasSubgraphQuerySchema = z.object({
  root_id: AtlasCurieSchema,
  taxon_id: z.coerce.number().pipe(TaxonIdSchema),
  max_depth: z.coerce.number().int().min(0).max(6).default(3),
  max_nodes: z.coerce.number().int().min(1).max(100).default(50)
}).strict()
const AtlasClaimsQuerySchema = z.object({
  subject_id: AtlasCurieSchema.optional(),
  object_id: AtlasCurieSchema.optional(),
  relation: z.enum(['has_transcript', 'translates_to', 'isoform_of', 'encodes', 'forms_complex', 'catalyzes', 'participates_in', 'studied_in', 'causes', 'has_phenotype']).optional(),
  taxon_id: OptionalAtlasTaxonSchema,
  tissue_id: AtlasCurieSchema.optional(),
  derivation: z.enum(['direct', 'inferred', 'orthology-transferred']).optional(),
  polarity: z.enum(['supporting', 'contradicting']).optional()
}).strict()
const AtlasCoverageQuerySchema = z.object({
  taxon_id: OptionalAtlasTaxonSchema,
  tissue_id: AtlasCurieSchema.optional(),
  entity_type: z.enum(['gene', 'transcript', 'protein', 'isoform', 'compound', 'reaction', 'complex', 'pathway', 'compartment', 'tissue', 'cell', 'disease', 'phenotype']).optional(),
  evidence_class: z.enum(['direct', 'inferred', 'orthology-transferred', 'uncovered']).optional()
}).strict()
const AtlasNetworkQuerySchema = z.object({
  taxon_id: z.coerce.number().pipe(TaxonIdSchema),
  tissue_id: AtlasCurieSchema.optional()
}).strict()
const EvidenceDocumentParamSchema = z.object({ identifier: z.string().min(1).max(200) }).strict()
const EvidenceCandidateParamSchema = z.object({ candidateId: z.string().regex(/^CANDIDATE:[a-f0-9]{32}$/) }).strict()

function invalidAtlasQuery(reply, parsed) {
  return reply.status(400).send({
    statusCode: 400,
    code: 'INVALID_ATLAS_QUERY',
    error: 'Bad Request',
    message: 'Atlas query parameters are invalid.',
    fieldErrors: parsed.error.flatten().fieldErrors
  })
}

export async function buildApp(options = {}) {
  const env = options.env ?? process.env
  const app = Fastify({ logger: env.NODE_ENV !== 'test' })
  const knowledge = options.knowledgeClient ?? createKnowledgeClient(env)
  const evidence = options.evidenceClient ?? createEvidenceClient(env)
  const allowedOrigins = new Set((env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean))
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin))
  })

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof KnowledgeCompatibilityError) {
      return reply.status(409).send({ statusCode: 409, code: 'KNOWLEDGE_INCOMPATIBLE', error: 'Conflict', message: error.message })
    }
    if (error instanceof EvidenceCompatibilityError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof SimulationNumericalError) {
      return reply.status(422).send({ statusCode: 422, code: 'INVALID_NUMERICAL_STATE', error: 'Unprocessable Entity', message: error.message })
    }
    if (error instanceof Error && 'validation' in error && error.validation) {
      return reply.status(400).send({ statusCode: 400, code: 'INVALID_REQUEST', error: 'Bad Request', message: error.message })
    }
    if (error instanceof Error && 'statusCode' in error && typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 500) {
      const statusCode = error.statusCode
      return reply.status(statusCode).send({
        statusCode,
        code: 'code' in error && typeof error.code === 'string' ? error.code : 'BAD_REQUEST',
        error: error.name,
        message: error.message
      })
    }
    app.log.error(error)
    return reply.status(500).send({ statusCode: 500, code: 'INTERNAL_ERROR', error: 'Internal Server Error', message: 'The simulation service could not complete the request.' })
  })

  app.get('/api/v1/health', async () => ({ status: 'ok', modelVersion: MODEL.version }))
  app.get('/api/v1/ready', async (_request, reply) => {
    try {
      const releases = await knowledge.releases()
      return { status: 'ready', release: releases[0] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Pinned biochemical knowledge is unavailable'
      return reply.status(503).send({ statusCode: 503, code: 'KNOWLEDGE_NOT_READY', error: 'Service Unavailable', message })
    }
  })
  app.get('/api/v1/releases', async () => knowledge.releases())
  app.get('/api/v1/releases/:releaseId/provenance', async (request) => knowledge.provenance(request.params.releaseId))
  app.get('/api/v1/releases/:releaseId/network', async (request, reply) => {
    const params = request.params
    const query = request.query
    const taxon = TaxonIdSchema.safeParse(Number(query.taxon_id))
    if (!taxon.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_TAXON', error: 'Bad Request', message: 'taxon_id must be 9606 or 10090' })
    return knowledge.network(params.releaseId, taxon.data)
  })
  app.get('/api/v2/releases', async () => knowledge.atlasReleases())
  app.get('/api/v2/releases/:releaseId', async (request) => knowledge.atlasRelease(request.params.releaseId))
  app.get('/api/v2/releases/:releaseId/entities/:entityId', async (request, reply) => {
    const parsed = AtlasEntityQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidAtlasQuery(reply, parsed)
    return knowledge.atlasEntity(request.params.releaseId, request.params.entityId, parsed.data.taxon_id)
  })
  app.get('/api/v2/releases/:releaseId/subgraph', async (request, reply) => {
    const parsed = AtlasSubgraphQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidAtlasQuery(reply, parsed)
    return knowledge.atlasSubgraph(request.params.releaseId, parsed.data.root_id, parsed.data.taxon_id, parsed.data.max_depth, parsed.data.max_nodes)
  })
  app.get('/api/v2/releases/:releaseId/claims', async (request, reply) => {
    const parsed = AtlasClaimsQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidAtlasQuery(reply, parsed)
    return knowledge.atlasClaims(request.params.releaseId, {
      subjectId: parsed.data.subject_id,
      objectId: parsed.data.object_id,
      relation: parsed.data.relation,
      taxonId: parsed.data.taxon_id,
      tissueId: parsed.data.tissue_id,
      derivation: parsed.data.derivation,
      polarity: parsed.data.polarity
    })
  })
  app.get('/api/v2/releases/:releaseId/coverage', async (request, reply) => {
    const parsed = AtlasCoverageQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidAtlasQuery(reply, parsed)
    return knowledge.atlasCoverage(request.params.releaseId, {
      taxonId: parsed.data.taxon_id,
      tissueId: parsed.data.tissue_id,
      entityType: parsed.data.entity_type,
      evidenceClass: parsed.data.evidence_class
    })
  })
  app.get('/api/v2/releases/:releaseId/network', async (request, reply) => {
    const parsed = AtlasNetworkQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidAtlasQuery(reply, parsed)
    return knowledge.atlasNetwork(request.params.releaseId, parsed.data.taxon_id, parsed.data.tissue_id)
  })
  app.get('/api/v3/evidence/health', async () => evidence.health())
  app.post('/api/v3/evidence/search', async (request, reply) => {
    const parsed = EvidenceSearchRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_EVIDENCE_SEARCH', error: 'Unprocessable Entity', message: 'Evidence search parameters are invalid.', fieldErrors: parsed.error.flatten().fieldErrors })
    return evidence.search(parsed.data)
  })
  app.get('/api/v3/evidence/documents/:identifier', async (request, reply) => {
    const parsed = EvidenceDocumentParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_EVIDENCE_DOCUMENT', error: 'Bad Request', message: 'Evidence document identifier is invalid.' })
    return evidence.document(parsed.data.identifier)
  })
  app.post('/api/v3/evidence/candidates/extract', async (request, reply) => {
    const parsed = EvidenceCandidateExtractionRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_EVIDENCE_CANDIDATE', error: 'Unprocessable Entity', message: 'Candidate extraction requires unique exact spans from one document.', fieldErrors: parsed.error.flatten().fieldErrors })
    return reply.status(201).send(await evidence.extract(parsed.data))
  })
  app.get('/api/v3/evidence/candidates', async () => evidence.candidates())
  app.get('/api/v3/evidence/candidates/:candidateId', async (request, reply) => {
    const parsed = EvidenceCandidateParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_EVIDENCE_CANDIDATE_ID', error: 'Bad Request', message: 'Candidate identifier is invalid.' })
    return evidence.candidate(parsed.data.candidateId)
  })
  app.get('/api/v1/models/one-carbon', async () => MODEL)
  app.post('/api/v1/models/one-carbon/simulations', async (request, reply) => {
    const parsed = SimulationRequestSchema.safeParse(request.body)
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors
      return reply.status(422).send(ApiErrorSchema.parse({ statusCode: 422, code: 'INVALID_SIMULATION', error: 'Unprocessable Entity', message: 'Simulation controls are outside supported bounds.', fieldErrors }))
    }
    const releases = await knowledge.releases()
    const release = releases.find((candidate) => candidate.id === parsed.data.releaseId)
    if (!release) throw new KnowledgeCompatibilityError(`Release ${parsed.data.releaseId} is not the pinned verified release`)
    const network = await knowledge.network(release.id, parsed.data.taxonId)
    return reply.send(simulate(parsed.data, release, network))
  })

  const clientRoot = resolve(process.cwd(), 'dist')
  if (options.serveClient !== false && existsSync(clientRoot)) {
    await app.register(fastifyStatic, { root: clientRoot })
    app.setNotFoundHandler((request, reply) => request.raw.url?.startsWith('/api/')
      ? reply.status(404).send({ statusCode: 404, code: 'NOT_FOUND', error: 'Not Found', message: 'API route not found' })
      : reply.sendFile('index.html'))
  }
  return app
}
