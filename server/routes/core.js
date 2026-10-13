import { z } from 'zod'
import { ApiErrorSchema, SimulationRequestSchema, TaxonIdSchema } from '../../shared/contracts.js'
import { badRequest, problemReply } from '../http/replies.js'
import { createRouter } from '../http/routes.js'
import { KnowledgeCompatibilityError } from '../knowledge/client.js'
import { MODEL } from '../model.js'
import { simulate } from '../simulation.js'

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

const invalidAtlasQuery = problemReply(400, 'INVALID_ATLAS_QUERY', 'Atlas query parameters are invalid.')

export function registerCoreRoutes(app, { knowledge }) {
  const { get } = createRouter(app, invalidAtlasQuery)

  get('/api/v1/releases', {}, () => knowledge.releases())
  get('/api/v1/releases/:releaseId/provenance', {}, (_input, request) => knowledge.provenance(request.params.releaseId))
  app.get('/api/v1/releases/:releaseId/network', async (request, reply) => {
    const taxon = TaxonIdSchema.safeParse(Number(request.query.taxon_id))
    if (!taxon.success) return badRequest(reply, 'INVALID_TAXON', 'taxon_id must be 9606 or 10090')
    return knowledge.network(request.params.releaseId, taxon.data)
  })

  get('/api/v2/releases', {}, () => knowledge.atlasReleases())
  get('/api/v2/releases/:releaseId', {}, (_input, request) => knowledge.atlasRelease(request.params.releaseId))
  get('/api/v2/releases/:releaseId/entities/:entityId', { query: AtlasEntityQuerySchema }, ({ query }, request) =>
    knowledge.atlasEntity(request.params.releaseId, request.params.entityId, query.taxon_id))
  get('/api/v2/releases/:releaseId/subgraph', { query: AtlasSubgraphQuerySchema }, ({ query }, request) =>
    knowledge.atlasSubgraph(request.params.releaseId, query.root_id, query.taxon_id, query.max_depth, query.max_nodes))
  get('/api/v2/releases/:releaseId/claims', { query: AtlasClaimsQuerySchema }, ({ query }, request) =>
    knowledge.atlasClaims(request.params.releaseId, {
      subjectId: query.subject_id,
      objectId: query.object_id,
      relation: query.relation,
      taxonId: query.taxon_id,
      tissueId: query.tissue_id,
      derivation: query.derivation,
      polarity: query.polarity
    }))
  get('/api/v2/releases/:releaseId/coverage', { query: AtlasCoverageQuerySchema }, ({ query }, request) =>
    knowledge.atlasCoverage(request.params.releaseId, {
      taxonId: query.taxon_id,
      tissueId: query.tissue_id,
      entityType: query.entity_type,
      evidenceClass: query.evidence_class
    }))
  get('/api/v2/releases/:releaseId/network', { query: AtlasNetworkQuerySchema }, ({ query }, request) =>
    knowledge.atlasNetwork(request.params.releaseId, query.taxon_id, query.tissue_id))

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
}
