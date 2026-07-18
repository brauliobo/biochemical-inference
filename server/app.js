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
import { ArchiveValidationRequestSchema, ExperimentSchema, PORTFOLIO_ARCHIVE_REQUEST_BODY_LIMIT, Sha256Schema } from '../shared/portfolio-contracts.js'
import { exportCombineArchive, validateCombineArchive } from './portfolio/archive.js'
import { createRunService, PortfolioRequestError, validateExperimentForModel } from './portfolio/execution.js'
import { getModel, listModels } from './portfolio/registry.js'
import { ParameterOptionsQuerySchema, StudyRequestSchema } from '../shared/parameter-contracts.js'
import { createParameterClient, ParameterCompatibilityError } from './parameters/client.js'
import { loadParameterOptions, ParameterSelectionError } from './parameters/selection.js'
import { createStudyService } from './studies/service.js'
import {
  APAP_CONTRACT_VERSION,
  APAP_ENGINE_VERSION,
  APAP_EQUATION_SET_ID,
  APAP_MODEL_ID,
  APAP_MODEL_VERSION,
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  APAP_WARNING,
  ApapRunRequestSchema
} from '../shared/apap-contracts.js'
import { createApapClient, ApapCompatibilityError } from './apap/client.js'
import { createApapRunService, ApapRequestError } from './apap/service.js'
import { ApapNumericalError } from './apap/model.js'
import {
  SPATIAL_CONTRACT_VERSION,
  SPATIAL_MAX_CONTENT_BYTES,
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetIdSchema,
  SpatialContentIdSchema
} from '../shared/spatial-contracts.js'
import { createSpatialClient, SpatialCompatibilityError } from './spatial/client.js'
import { parseSpatialRange, SpatialRangeError } from './spatial/range.js'
import {
  DERIVED_CSRF_HEADER,
  DERIVED_CSRF_VALUE,
  DerivedClassificationSchema,
  DerivedDigestSchema,
  ImpactRequestSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  QualifiedIdSchema,
  ReproduceRequestSchema,
  ReviewEventRequestSchema,
  ReviewStatusSchema,
  SourceSelectorSchema
} from '../shared/derived-contracts.js'
import { createDerivedClient, DerivedCompatibilityError } from './derived/client.js'
import { createDerivedRunService, DerivedRequestError } from './derived/service.js'
import {
  BundleImportRequestSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  HistoryFilterSchema,
  ReportRequestSchema,
  ResourceProfileSchema,
  RestartRequestSchema,
  RevisionCreateRequestSchema,
  WORKSPACE_BUNDLE_REQUEST_BODY_LIMIT,
  RunCreateRequestSchema
} from '../shared/workspace-contracts.js'
import { createWorkspaceService, WorkspaceRequestError } from './workspace/service.js'
import {
  BPP_REQUEST_BODY_LIMIT,
  CouplingCreateRequestSchema,
  PackageValidationRequestSchema,
  PHYSIOLOGY_CONTRACT_VERSION,
  PHYSIOLOGY_CSRF_HEADER,
  PHYSIOLOGY_CSRF_VALUE,
  PHYSIOLOGY_RELEASE_DIGEST,
  PHYSIOLOGY_RELEASE_ID,
  PHYSIOLOGY_WARNING,
  PhysiologyDigestSchema,
  PhysiologyRunRequestSchema,
  TrustKeyAddRequestSchema
} from '../shared/physiology-contracts.js'
import { createPhysiologyClient, PhysiologyCompatibilityError } from './physiology/client.js'
import { createPhysiologyService, PhysiologyRequestError } from './physiology/service.js'
import {
  DATA_PLANE_CSRF_HEADER,
  DATA_PLANE_CSRF_VALUE,
  DATA_PLANE_PINS,
  AuthorityClosureAuditRequestSchema,
  DataPlanePageQuerySchema,
  DataPlaneRecordTypeSchema,
  DataPlaneSyncRequestSchema,
  ReleaseIdSchema,
  Sha256Schema as DataPlaneSha256Schema
} from '../shared/data-plane-contracts.js'
import { DataPlaneUpstreamError } from './data-plane/client.js'
import { createDataPlaneService, DataPlaneRequestError } from './data-plane/service.js'
import { DataPlaneVerificationError } from './data-plane/verification.js'
import {
  CalibrationRequestSchema,
  DisclosureIntentSchema,
  FreezeIntentSchema,
  MEASURED_CSRF_HEADER,
  MEASURED_CSRF_VALUE,
  MeasuredLocalPageQuerySchema,
  MeasuredLocalRecordTypeSchema,
  MeasuredSyncRequestSchema,
  Sha256Schema as MeasuredSha256Schema
} from '../shared/measured-contracts.js'
import { MeasuredUpstreamError } from './measured/client.js'
import { createMeasuredService, MeasuredRequestError } from './measured/service.js'
import { MeasuredVerificationError } from './measured/verification.js'
import {
  CHALLENGE_CSRF_HEADER,
  CHALLENGE_CSRF_VALUE,
  CHALLENGE_REQUEST_BODY_LIMIT,
  ChallengeArtifactParamSchema,
  ChallengeCommitmentParamSchema,
  ChallengeDisclosureIntentSchema,
  ChallengeEmptyObjectSchema,
  ChallengeFreezeIntentSchema,
  ChallengeReportParamSchema,
  ChallengeRunListQuerySchema
} from '../shared/challenge-contracts.js'
import { ChallengeUpstreamError } from './challenge/client.js'
import { createChallengeService, ChallengeRequestError } from './challenge/service.js'
import { ChallengeVerificationError } from './challenge/verification.js'
import {
  MEASURED_SPATIAL_CSRF_HEADER,
  MEASURED_SPATIAL_CSRF_VALUE,
  MEASURED_SPATIAL_PINS,
  MeasuredSpatialChunkParamSchema,
  MeasuredSpatialChunkQuerySchema,
  MeasuredSpatialEmptySchema,
  MeasuredSpatialRecordTypeSchema
} from '../shared/measured-spatial-contracts.js'
import { MeasuredSpatialUpstreamError } from './measured-spatial/client.js'
import { createMeasuredSpatialService, MeasuredSpatialRequestError } from './measured-spatial/service.js'
import { MeasuredSpatialVerificationError } from './measured-spatial/verification.js'
import {
  SPATIAL_REGISTRATION_CSRF_HEADER,
  SPATIAL_REGISTRATION_CSRF_VALUE,
  SPATIAL_REGISTRATION_PINS,
  SPATIAL_REGISTRATION_RIGHTS_LINK,
  SpatialRegistrationChunkParamSchema,
  SpatialRegistrationChunkQuerySchema,
  SpatialRegistrationEmptySchema,
  SpatialRegistrationRecordTypeSchema,
  SpatialRegistrationTransformRequestSchema
} from '../shared/spatial-registration-contracts.js'
import { SpatialRegistrationUpstreamError } from './spatial-registration/client.js'
import { createSpatialRegistrationService, SpatialRegistrationRequestError } from './spatial-registration/service.js'
import { SpatialRegistrationVerificationError } from './spatial-registration/verification.js'
import {
  REVALIDATION_CSRF_HEADER,
  REVALIDATION_CSRF_VALUE,
  RevalidationCampaignParamSchema,
  RevalidationProjectionQuerySchema,
  RevalidationSyncRequestSchema
} from '../shared/revalidation-contracts.js'
import {
  createRevalidationIntegrationService,
  RevalidationIntegrationError,
  revalidationIntegrationError
} from './revalidation/integration.js'
import { createOperationalMetrics } from './operations/metrics.js'

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
const PortfolioRunRequestSchema = z.object({ experiment: ExperimentSchema }).strict()
const PortfolioRunParamSchema = z.object({ runId: Sha256Schema }).strict()
const StudyParamSchema = z.object({ studyId: Sha256Schema }).strict()
const ApapReleaseParamSchema = z.object({ releaseId: z.literal(APAP_RELEASE_ID) }).strict()
const ApapRunParamSchema = z.object({ runId: Sha256Schema }).strict()
const SpatialReleaseParamSchema = z.object({ releaseId: z.literal(SPATIAL_RELEASE_ID) }).strict()
const SpatialContentParamSchema = z.object({ releaseId: z.literal(SPATIAL_RELEASE_ID), assetId: SpatialAssetIdSchema, contentId: SpatialContentIdSchema }).strict()
const SpatialTaxonQuerySchema = z.object({ taxon_id: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']).optional() }).strict()
const SpatialAssetQuerySchema = z.object({
  taxon_id: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']).optional(),
  structure_id: z.string().regex(/^STRUCTURE:(?:HUMAN|MOUSE)-(?:LIVER|HEPATOCYTE)$/).optional(),
  asset_type: z.enum(['geometry', 'instances', 'scalar-field']).optional()
}).strict()
const SpatialDescriptorQuerySchema = z.object({ asset_id: SpatialAssetIdSchema.optional() }).strict()
const DerivedRunParamSchema = z.object({ runId: Sha256Schema }).strict()
const DerivedAssertionParamSchema = z.object({ assertionDigest: DerivedDigestSchema }).strict()
const DerivedBundleParamSchema = z.object({ bundleDigest: DerivedDigestSchema }).strict()
const DerivedListQuerySchema = z.object({
  subject_id: QualifiedIdSchema.optional(),
  classification: DerivedClassificationSchema.optional(),
  review_status: ReviewStatusSchema.optional()
}).strict()
const WorkspaceExperimentParamSchema = z.object({ experimentId: z.string().uuid() }).strict()
const WorkspaceRevisionParamSchema = z.object({ experimentId: z.string().uuid() }).strict()
const WorkspaceAttemptParamSchema = z.object({ attemptId: Sha256Schema }).strict()
const WorkspaceRunParamSchema = z.object({ runId: Sha256Schema }).strict()
const WorkspaceCheckpointParamSchema = z.object({ checkpointId: Sha256Schema }).strict()
const WorkspaceArtifactParamSchema = z.object({ artifactId: Sha256Schema }).strict()
const WorkspaceComparisonParamSchema = z.object({ comparisonId: Sha256Schema }).strict()
const WorkspaceReportParamSchema = z.object({ reportId: Sha256Schema }).strict()
const WorkspaceReportFileParamSchema = z.object({ reportId: Sha256Schema, format: z.enum(['html', 'json', 'csv', 'svg']) }).strict()
const WorkspaceCloneRequestSchema = z.object({ name: z.string().trim().min(1).max(160).optional() }).strict()
const PhysiologyDigestParamSchema = z.object({ packageDigest: PhysiologyDigestSchema }).strict()
const PhysiologyCouplingParamSchema = z.object({ couplingDigest: PhysiologyDigestSchema }).strict()
const PhysiologyRunParamSchema = z.object({ runDigest: PhysiologyDigestSchema }).strict()
const PhysiologyTrustParamSchema = z.object({ keyId: z.string().regex(/^ed25519:[a-f0-9]{16}$/) }).strict()
const DataPlaneReleaseParamSchema = z.object({ releaseId: ReleaseIdSchema }).strict()
const DataPlaneRecordParamSchema = z.object({ releaseId: ReleaseIdSchema, recordType: DataPlaneRecordTypeSchema, recordId: z.string().min(1).max(200) }).strict()
const DataPlanePageParamSchema = z.object({ releaseId: ReleaseIdSchema, recordType: DataPlaneRecordTypeSchema }).strict()
const DataPlaneDiffQuerySchema = z.object({ base_release_id: ReleaseIdSchema, candidate_release_id: ReleaseIdSchema }).strict()
const DataPlaneAuditParamSchema = z.object({ reportDigest: DataPlaneSha256Schema }).strict()
const MeasuredPageParamSchema = z.object({ recordType: MeasuredLocalRecordTypeSchema }).strict()
const MeasuredLineageParamSchema = z.object({ measurementId: z.string().min(1).max(160) }).strict()
const MeasuredArtifactParamSchema = z.object({ artifactDigest: MeasuredSha256Schema }).strict()
const MeasuredSpatialRecordParamSchema = z.object({ recordType: MeasuredSpatialRecordTypeSchema }).strict()
const RevalidationEmptySchema = z.object({}).strict()
const SPATIAL_IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'

function fixedAllowedOrigins(env) {
  const values = [env.BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN, ...(env.CORS_ORIGINS ?? '').split(',')].filter((value) => value !== undefined && value !== '')
  return new Set(values.map((raw) => {
    const value = raw.trim()
    let parsed
    try {
      parsed = new URL(value)
    } catch {
      throw new Error(`Invalid configured browser origin: ${raw}.`)
    }
    if (value !== raw || !['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== value) throw new Error(`Configured browser origin must be an exact HTTP(S) origin: ${raw}.`)
    return value
  }))
}

function invalidAtlasQuery(reply, parsed) {
  return reply.status(400).send({
    statusCode: 400,
    code: 'INVALID_ATLAS_QUERY',
    error: 'Bad Request',
    message: 'Atlas query parameters are invalid.',
    fieldErrors: parsed.error.flatten().fieldErrors
  })
}

export async function settleReadinessChecks(checks) {
  const settled = await Promise.allSettled(checks)
  const failure = settled.find((result) => result.status === 'rejected')
  if (failure) throw failure.reason
  return settled.map((result) => result.value)
}

export async function buildApp(options = {}) {
  const env = options.env ?? process.env
  const allowedOrigins = fixedAllowedOrigins(env)
  const app = Fastify({ bodyLimit: 1_048_576, logger: env.NODE_ENV !== 'test', routerOptions: { maxParamLength: 200 } })
  const operations = createOperationalMetrics()
  const knowledge = options.knowledgeClient ?? createKnowledgeClient(env)
  const evidence = options.evidenceClient ?? createEvidenceClient(env)
  const parameters = options.parameterClient ?? createParameterClient(env)
  const apap = options.apapClient ?? createApapClient(env)
  const spatial = options.spatialClient ?? createSpatialClient(env)
  const derived = options.derivedClient ?? createDerivedClient(env)
  const physiologyEvidence = options.physiologyClient ?? createPhysiologyClient(process.env.VITEST ? { ...env, BIOCHEMICAL_PHYSIOLOGY_USE_FIXTURE: 'true' } : env)
  const portfolioRuns = options.portfolioRunService ?? createRunService()
  const studies = options.studyService ?? createStudyService(parameters)
  const apapRuns = options.apapRunService ?? createApapRunService(apap)
  const derivedRuns = options.derivedRunService ?? createDerivedRunService(derived, apapRuns)
  const workspace = options.workspaceService ?? await createWorkspaceService({
    env: process.env.VITEST ? { ...env, NODE_ENV: 'test' } : env,
    knowledgeClient: knowledge
  })
  const physiology = options.physiologyService ?? await createPhysiologyService({
    env: process.env.VITEST ? { ...env, NODE_ENV: 'test' } : env,
    evidenceClient: physiologyEvidence
  })
  const dataPlane = options.dataPlaneService ?? await createDataPlaneService({
    env: process.env.VITEST ? { ...env, NODE_ENV: 'test' } : env
  })
  const measured = options.measuredService ?? await createMeasuredService({
    env: process.env.VITEST ? {
      ...env,
      NODE_ENV: 'test',
      BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: env.BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN ?? 'http://127.0.0.1:5173',
      BIOCHEMICAL_MEASURED_CSRF_TOKEN: env.BIOCHEMICAL_MEASURED_CSRF_TOKEN ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    } : env
  })
  const challenge = options.challengeService ?? await createChallengeService({
    env: process.env.VITEST ? {
      ...env,
      NODE_ENV: 'test',
      BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN: env.BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN ?? 'http://127.0.0.1:5173',
      BIOCHEMICAL_CHALLENGE_CSRF_TOKEN: env.BIOCHEMICAL_CHALLENGE_CSRF_TOKEN ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
    } : env
  })
  const measuredSpatial = options.measuredSpatialService ?? await createMeasuredSpatialService({
    env: process.env.VITEST ? { ...env, NODE_ENV: 'test' } : env
  })
  const spatialRegistration = options.spatialRegistrationService ?? await createSpatialRegistrationService({
    env: process.env.VITEST ? { ...env, NODE_ENV: 'test' } : env
  })
  const revalidation = Object.hasOwn(options, 'revalidationService')
    ? options.revalidationService
    : env.BIOCHEMICAL_REVALIDATION_URL ? await createRevalidationIntegrationService({ env }) : null
  app.addHook('onClose', async () => {
    await Promise.allSettled([workspace.close?.(), physiology.close?.(), dataPlane.close?.(), measured.close?.(), challenge.close?.(), measuredSpatial.close?.(), spatialRegistration.close?.(), revalidation?.close?.()])
  })
  await app.register(cors, {
    origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin))
  })
  app.addHook('onRequest', async () => { operations.requestStarted() })
  app.addHook('onResponse', async (_request, reply) => { operations.requestFinished(reply.statusCode) })
  app.addHook('onSend', async (request, reply, payload) => {
    if (reply.getHeader('content-type')?.toString().startsWith('text/html')) {
      if (!reply.hasHeader('content-security-policy')) reply.header('content-security-policy', "frame-ancestors 'none'")
      reply.header('x-frame-options', 'DENY')
    }
    if (request.url.startsWith('/api/v6/derived')) {
      reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' })
      reply.removeHeader('etag')
    }
    if (request.url.startsWith('/api/v11/challenge')) {
      reply.headers({ 'cache-control': 'private, no-store', pragma: 'no-cache' })
      reply.removeHeader('etag')
    }
    if (request.url.startsWith('/api/v12/measured-spatial') && reply.statusCode >= 400) {
      reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' })
      reply.removeHeader('etag')
    }
    if (request.url.startsWith('/api/v14/spatial-registration') && reply.statusCode >= 400) {
      reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' })
      reply.removeHeader('etag')
    }
    if (request.url.startsWith('/api/v13/revalidation')) {
      reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' })
      reply.removeHeader('etag')
    }
    return payload
  })

  const requireFixedOrigin = (request, csrfHeader, csrfValue) => allowedOrigins.has(request.headers.origin) && request.headers[csrfHeader] === csrfValue

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof KnowledgeCompatibilityError) {
      return reply.status(409).send({ statusCode: 409, code: 'KNOWLEDGE_INCOMPATIBLE', error: 'Conflict', message: error.message })
    }
    if (error instanceof EvidenceCompatibilityError) {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof ParameterCompatibilityError || error instanceof ParameterSelectionError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof ApapCompatibilityError || error instanceof ApapRequestError || error instanceof ApapNumericalError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof SpatialRangeError) {
      return reply.header('content-range', `bytes */${error.size}`).status(416).send({ statusCode: 416, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof SpatialCompatibilityError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof DerivedCompatibilityError || error instanceof DerivedRequestError) {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof WorkspaceRequestError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof PhysiologyCompatibilityError || error instanceof PhysiologyRequestError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof DataPlaneRequestError || error instanceof DataPlaneUpstreamError || error instanceof DataPlaneVerificationError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof MeasuredRequestError || error instanceof MeasuredUpstreamError || error instanceof MeasuredVerificationError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof ChallengeRequestError || error instanceof ChallengeUpstreamError || error instanceof ChallengeVerificationError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof MeasuredSpatialRequestError || error instanceof MeasuredSpatialUpstreamError || error instanceof MeasuredSpatialVerificationError) {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof SpatialRegistrationRequestError || error instanceof SpatialRegistrationUpstreamError || error instanceof SpatialRegistrationVerificationError) {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message })
    }
    if (error instanceof RevalidationIntegrationError || error.name === 'RevalidationProducerError' || error.name === 'RevalidationEngineError') {
      const selected = revalidationIntegrationError(error)
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(selected.statusCode).send({ statusCode: selected.statusCode, code: selected.code, error: selected.name, message: selected.message })
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      return reply.status(409).send({ statusCode: 409, code: 'DATA_PLANE_SYNC_SUPERSEDED', error: 'Conflict', message: error.message })
    }
    if (error instanceof SimulationNumericalError) {
      return reply.status(422).send({ statusCode: 422, code: 'INVALID_NUMERICAL_STATE', error: 'Unprocessable Entity', message: error.message })
    }
    if (error instanceof PortfolioRequestError) {
      return reply.status(error.statusCode).send({ statusCode: error.statusCode, code: error.code, error: error.name, message: error.message, findings: error.findings })
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
  const optionalUninitialized = new Set((env.BIOCHEMICAL_OPTIONAL_UNINITIALIZED_DOMAINS ?? '').split(',').filter(Boolean))
  const requireReadyResult = (label, value) => {
    if (value?.status === 'failed' || value?.integrity === 'failed') throw new Error(`${label} is not ready`)
    const counters = value && !Array.isArray(value) && typeof value === 'object'
      ? Object.entries(value).filter(([name, selected]) => ['artifacts', 'bundles', 'cachedChunks', 'commitments', 'disclosures', 'objects', 'records', 'releases'].includes(name) && Number.isInteger(selected))
      : []
    const uninitialized = ['empty', 'not-configured', 'uninitialized'].includes(value?.status) || (Array.isArray(value) && value.length === 0) || (value?.status === 'valid' && counters.length > 0 && counters.every(([, selected]) => selected === 0))
    if (uninitialized && !optionalUninitialized.has(label)) throw new Error(`${label} has no configured domain state`)
    return uninitialized ? 'uninitialized' : 'configured'
  }
  const readiness = async (signal) => {
    signal?.throwIfAborted()
    const results = await settleReadinessChecks([
      knowledge.releases(signal),
      knowledge.atlasReleases(signal),
      evidence.health(signal),
      parameters.contexts(signal),
      apap.contexts(signal),
      spatial.mappings(signal),
      derived.health(signal),
      physiologyEvidence.contexts(signal),
      Promise.resolve(workspace.listResourceProfiles(signal)),
      Promise.resolve(physiology.coverage(signal)),
      dataPlane.integrity(signal),
      measured.integrity(signal),
      challenge.integrity(signal),
      measuredSpatial.integrity(signal),
      spatialRegistration.integrity(signal),
      revalidation?.integrity(signal) ?? Promise.resolve({ status: 'not-configured' })
    ])
    signal?.throwIfAborted()
    const labels = ['core', 'atlas', 'evidence', 'parameters', 'apap', 'spatial', 'derived', 'physiology-evidence', 'workspace', 'physiology', 'data-plane', 'measured', 'challenge', 'measured-spatial', 'spatial-registration', 'revalidation']
    const domains = Object.fromEntries(results.map((value, index) => [labels[index], requireReadyResult(labels[index], value)]))
    return { domains, releases: results[0] }
  }
  app.get('/ops/readyz', async (_request, reply) => {
    try {
      return await operations.readiness(readiness)
    } catch {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(503).send({ statusCode: 503, code: 'NOT_READY', error: 'Service Unavailable', message: 'Runtime is not ready.' })
    }
  })
  app.get('/metrics', async (_request, reply) => reply.header('cache-control', 'no-store').type('text/plain; version=0.0.4').send(operations.prometheus()))
  app.get('/api/v1/ready', async (_request, reply) => {
    try {
      const result = await readiness()
      return { status: 'ready', release: result.releases[0], domains: result.domains }
    } catch {
      return reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(503).send({ statusCode: 503, code: 'KNOWLEDGE_NOT_READY', error: 'Service Unavailable', message: 'Runtime is not ready.' })
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
  app.get('/api/v2/models', async () => listModels())
  app.get('/api/v2/models/:modelId', async (request, reply) => {
    const model = getModel(request.params.modelId)
    return model ?? reply.status(404).send({ statusCode: 404, code: 'MODEL_NOT_FOUND', error: 'Not Found', message: 'Portfolio model is not registered.' })
  })
  app.post('/api/v2/model-archives/validate', { bodyLimit: PORTFOLIO_ARCHIVE_REQUEST_BODY_LIMIT }, async (request, reply) => {
    const parsed = ArchiveValidationRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_ARCHIVE_REQUEST', error: 'Unprocessable Entity', message: 'Archive request must contain bounded base64 content.', fieldErrors: parsed.error.flatten().fieldErrors })
    return validateCombineArchive(Buffer.from(parsed.data.archiveBase64, 'base64'))
  })
  app.post('/api/v2/model-archives/export', async (request, reply) => {
    const parsed = PortfolioRunRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_EXPERIMENT', error: 'Unprocessable Entity', message: 'Experiment contract is invalid.', fieldErrors: parsed.error.flatten().fieldErrors })
    const model = getModel(parsed.data.experiment.modelId)
    if (!model) return reply.status(404).send({ statusCode: 404, code: 'MODEL_NOT_FOUND', error: 'Not Found', message: 'Portfolio model is not registered.' })
    const archive = await exportCombineArchive(model, validateExperimentForModel(model, parsed.data.experiment))
    return { profile: 'portfolio-combine-1.0', archiveBase64: archive.toString('base64') }
  })
  app.post('/api/v2/runs', async (request, reply) => {
    const parsed = PortfolioRunRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_EXPERIMENT', error: 'Unprocessable Entity', message: 'Experiment contract is invalid.', fieldErrors: parsed.error.flatten().fieldErrors })
    const model = getModel(parsed.data.experiment.modelId)
    if (!model) return reply.status(404).send({ statusCode: 404, code: 'MODEL_NOT_FOUND', error: 'Not Found', message: 'Portfolio model is not registered.' })
    return reply.status(201).send(await portfolioRuns.create(model, parsed.data.experiment))
  })
  app.get('/api/v2/runs/:runId', async (request, reply) => {
    const parsed = PortfolioRunParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_RUN_ID', error: 'Bad Request', message: 'Run identifier is invalid.' })
    const record = portfolioRuns.get(parsed.data.runId)
    return record ?? reply.status(404).send({ statusCode: 404, code: 'RUN_NOT_FOUND', error: 'Not Found', message: 'Portfolio run is not available.' })
  })
  app.delete('/api/v2/runs/:runId', async (request, reply) => {
    const parsed = PortfolioRunParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_RUN_ID', error: 'Bad Request', message: 'Run identifier is invalid.' })
    if (!portfolioRuns.cancel(parsed.data.runId)) return reply.status(409).send({ statusCode: 409, code: 'RUN_NOT_CANCELLABLE', error: 'Conflict', message: 'Run is not active or is already terminal.' })
    return reply.status(202).send({ runId: parsed.data.runId, lifecycle: 'running', cancellationRequested: true })
  })
  app.get('/api/v2/parameter-options', async (request, reply) => {
    const parsed = ParameterOptionsQuerySchema.safeParse(request.query)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_PARAMETER_OPTIONS', error: 'Bad Request', message: 'Parameter option filters are invalid.', fieldErrors: parsed.error.flatten().fieldErrors })
    return loadParameterOptions(parameters, { parameterId: parsed.data.parameter_id, targetContextId: parsed.data.target_context_id })
  })
  app.post('/api/v2/studies', async (request, reply) => {
    const parsed = StudyRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_STUDY', error: 'Unprocessable Entity', message: 'Study controls are invalid.', fieldErrors: parsed.error.flatten().fieldErrors })
    return reply.status(201).send(await studies.create(parsed.data))
  })
  app.get('/api/v2/studies/:studyId', async (request, reply) => {
    const parsed = StudyParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_STUDY_ID', error: 'Bad Request', message: 'Study identifier is invalid.' })
    const record = studies.get(parsed.data.studyId)
    return record ?? reply.status(404).send({ statusCode: 404, code: 'STUDY_NOT_FOUND', error: 'Not Found', message: 'Parameter study is not available.' })
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
  app.get('/api/v4/apap', async () => ({
    contractVersion: APAP_CONTRACT_VERSION,
    releaseId: APAP_RELEASE_ID,
    releaseDigest: APAP_RELEASE_DIGEST,
    modelId: APAP_MODEL_ID,
    modelVersion: APAP_MODEL_VERSION,
    equationSetId: APAP_EQUATION_SET_ID,
    engineVersion: APAP_ENGINE_VERSION,
    routes: {
      release: `/api/v4/apap/releases/${APAP_RELEASE_ID}`,
      contexts: `/api/v4/apap/releases/${APAP_RELEASE_ID}/contexts`,
      parameters: `/api/v4/apap/releases/${APAP_RELEASE_ID}/parameters`,
      protocols: `/api/v4/apap/releases/${APAP_RELEASE_ID}/protocols`,
      observations: `/api/v4/apap/releases/${APAP_RELEASE_ID}/observations`,
      assumptions: `/api/v4/apap/releases/${APAP_RELEASE_ID}/assumptions`,
      limitations: `/api/v4/apap/releases/${APAP_RELEASE_ID}/limitations`,
      validationMatrix: `/api/v4/apap/releases/${APAP_RELEASE_ID}/validation-matrix`,
      runs: '/api/v4/apap/runs'
    },
    warning: APAP_WARNING
  }))
  app.get('/api/v4/apap/releases', async () => apap.catalog())
  app.get('/api/v4/apap/releases/:releaseId', async (request, reply) => {
    const parsed = ApapReleaseParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.detail()
  })
  app.get('/api/v4/apap/releases/:releaseId/contexts', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.contexts()
  })
  app.get('/api/v4/apap/releases/:releaseId/parameters', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.parameters()
  })
  app.get('/api/v4/apap/releases/:releaseId/protocols', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.protocols()
  })
  app.get('/api/v4/apap/releases/:releaseId/observations', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.observations()
  })
  app.get('/api/v4/apap/releases/:releaseId/assumptions', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.assumptions()
  })
  app.get('/api/v4/apap/releases/:releaseId/limitations', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.limitations()
  })
  app.get('/api/v4/apap/releases/:releaseId/validation-matrix', async (request, reply) => {
    if (!ApapReleaseParamSchema.safeParse(request.params).success) return reply.status(404).send({ statusCode: 404, code: 'APAP_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned APAP benchmark release is supported.' })
    return apap.validationMatrix()
  })
  app.post('/api/v4/apap/runs', async (request, reply) => {
    const parsed = ApapRunRequestSchema.safeParse(request.body)
    if (!parsed.success) return reply.status(422).send({ statusCode: 422, code: 'INVALID_APAP_RUN', error: 'Unprocessable Entity', message: 'APAP run controls are invalid or outside the pinned benchmark.', fieldErrors: parsed.error.flatten().fieldErrors })
    return reply.status(201).send(await apapRuns.create(parsed.data))
  })
  app.get('/api/v4/apap/runs/:runId', async (request, reply) => {
    const parsed = ApapRunParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(400).send({ statusCode: 400, code: 'INVALID_APAP_RUN_ID', error: 'Bad Request', message: 'APAP run identifier is invalid.' })
    return apapRuns.get(parsed.data.runId) ?? reply.status(404).send({ statusCode: 404, code: 'APAP_RUN_NOT_FOUND', error: 'Not Found', message: 'APAP run is not available.' })
  })
  const spatialMetadata = (reply) => reply.headers({ 'cache-control': SPATIAL_IMMUTABLE_CACHE, etag: `"sha256:${SPATIAL_RELEASE_DIGEST}"`, 'x-release-digest': SPATIAL_RELEASE_DIGEST })
  const spatialRelease = (request, reply) => {
    const parsed = SpatialReleaseParamSchema.safeParse(request.params)
    if (!parsed.success) {
      reply.status(404).send({ statusCode: 404, code: 'SPATIAL_RELEASE_NOT_FOUND', error: 'Not Found', message: 'Only the pinned spatial benchmark release is supported.' })
      return false
    }
    return true
  }
  const invalidSpatialQuery = (reply, parsed) => reply.status(400).send({ statusCode: 400, code: 'INVALID_SPATIAL_QUERY', error: 'Bad Request', message: 'Spatial query parameters are invalid.', fieldErrors: parsed.error.flatten().fieldErrors })

  app.get('/api/v5/spatial', async () => ({
    contractVersion: SPATIAL_CONTRACT_VERSION,
    releaseId: SPATIAL_RELEASE_ID,
    releaseDigest: SPATIAL_RELEASE_DIGEST,
    maxContentBytes: SPATIAL_MAX_CONTENT_BYTES,
    syntheticGeometry: true,
    hraAvailable: false,
    routes: {
      catalog: '/api/v5/spatial/releases',
      release: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}`,
      structures: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/structures`,
      spaces: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/spaces`,
      transforms: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/transforms`,
      assets: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/assets`,
      descriptors: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/descriptors`,
      mappings: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/mappings`,
      inventory: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/inventory`,
      content: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/assets/{assetId}/content/{contentId}`
    }
  }))
  app.get('/api/v5/spatial/releases', async () => spatial.catalog())
  app.get('/api/v5/spatial/releases/:releaseId', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    spatialMetadata(reply)
    return spatial.detail()
  })
  app.get('/api/v5/spatial/releases/:releaseId/structures', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    const parsed = SpatialTaxonQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    spatialMetadata(reply)
    return spatial.structures(parsed.data.taxon_id)
  })
  app.get('/api/v5/spatial/releases/:releaseId/spaces', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    const parsed = SpatialTaxonQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    spatialMetadata(reply)
    return spatial.spaces(parsed.data.taxon_id)
  })
  app.get('/api/v5/spatial/releases/:releaseId/transforms', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    const parsed = SpatialTaxonQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    spatialMetadata(reply)
    return spatial.transforms(parsed.data.taxon_id)
  })
  app.get('/api/v5/spatial/releases/:releaseId/assets', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    const parsed = SpatialAssetQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    spatialMetadata(reply)
    return spatial.assets({ taxonId: parsed.data.taxon_id, structureId: parsed.data.structure_id, assetType: parsed.data.asset_type })
  })
  app.get('/api/v5/spatial/releases/:releaseId/descriptors', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    const parsed = SpatialDescriptorQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    spatialMetadata(reply)
    return spatial.descriptors(parsed.data.asset_id)
  })
  app.get('/api/v5/spatial/releases/:releaseId/mappings', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    spatialMetadata(reply)
    return spatial.mappings()
  })
  app.get('/api/v5/spatial/releases/:releaseId/inventory', async (request, reply) => {
    if (!spatialRelease(request, reply)) return reply
    spatialMetadata(reply)
    return spatial.inventory()
  })
  app.get('/api/v5/spatial/releases/:releaseId/assets/:assetId/content/:contentId', async (request, reply) => {
    const parsed = SpatialContentParamSchema.safeParse(request.params)
    if (!parsed.success) return reply.status(404).send({ statusCode: 404, code: 'SPATIAL_CONTENT_NOT_FOUND', error: 'Not Found', message: 'Spatial content identifier is unknown.' })
    const inventory = await spatial.inventory()
    const item = inventory.items.find((candidate) => candidate.asset_id === parsed.data.assetId && candidate.id === parsed.data.contentId)
    if (!item) return reply.status(404).send({ statusCode: 404, code: 'SPATIAL_CONTENT_NOT_FOUND', error: 'Not Found', message: 'Spatial content does not belong to this asset.' })
    const range = parseSpatialRange(request.headers.range, item.bytes)
    const etag = `"sha256:${item.sha256}"`
    const headers = { 'accept-ranges': 'bytes', 'cache-control': SPATIAL_IMMUTABLE_CACHE, etag, 'x-content-sha256': item.sha256, 'x-release-digest': SPATIAL_RELEASE_DIGEST }
    if (!range && request.headers['if-none-match'] === etag) return reply.headers(headers).status(304).send()
    const content = await spatial.content(parsed.data.assetId, parsed.data.contentId, range)
    if (!content) return reply.status(404).send({ statusCode: 404, code: 'SPATIAL_CONTENT_NOT_FOUND', error: 'Not Found', message: 'Spatial content does not belong to this asset.' })
    if (range) headers['content-range'] = `bytes ${range.start}-${range.end}/${item.bytes}`
    return reply.headers(headers).type(item.media_type).status(content.statusCode).send(content.body)
  })
  const invalidDerived = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_DERIVED_REQUEST', error: 'Unprocessable Entity', message: 'Derived knowledge request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireDerivedMutation = async (request) => {
    if (!requireFixedOrigin(request, DERIVED_CSRF_HEADER, DERIVED_CSRF_VALUE)) throw new DerivedRequestError('Derived mutation requires a startup-allowlisted Origin and CSRF header.', { statusCode: 403, code: 'DERIVED_CSRF_REJECTED' })
  }

  app.get('/api/v6/derived/health', async () => derived.health())
  app.post('/api/v6/derived/apap-runs/:runId/bundles', { preHandler: requireDerivedMutation }, async (request, reply) => {
    const parsed = DerivedRunParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return reply.status(201).send(await derivedRuns.submitApapRun(parsed.data.runId))
  })
  app.get('/api/v6/derived/bundles/:bundleDigest', async (request, reply) => {
    const parsed = DerivedBundleParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.bundle(parsed.data.bundleDigest)
  })
  app.get('/api/v6/derived/assertions', async (request, reply) => {
    const parsed = DerivedListQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.assertions(parsed.data)
  })
  app.get('/api/v6/derived/reviewed-assertions', async (request, reply) => {
    const parsed = DerivedListQuerySchema.omit({ review_status: true }).safeParse(request.query)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.reviewedAssertions(parsed.data)
  })
  app.get('/api/v6/derived/assertions/:assertionDigest', async (request, reply) => {
    const parsed = DerivedAssertionParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.assertion(parsed.data.assertionDigest)
  })
  app.get('/api/v6/derived/assertions/:assertionDigest/events', async (request, reply) => {
    const parsed = DerivedAssertionParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.events(parsed.data.assertionDigest)
  })
  app.post('/api/v6/derived/assertions/:assertionDigest/events', { preHandler: requireDerivedMutation }, async (request, reply) => {
    const params = DerivedAssertionParamSchema.safeParse(request.params)
    const body = ReviewEventRequestSchema.safeParse(request.body)
    if (!params.success) return invalidDerived(reply, params)
    if (!body.success) return invalidDerived(reply, body)
    return reply.status(201).send(await derived.appendEvent(params.data.assertionDigest, body.data))
  })
  app.post('/api/v6/derived/assertions/:assertionDigest/reproduce', { preHandler: requireDerivedMutation }, async (request, reply) => {
    const params = DerivedAssertionParamSchema.safeParse(request.params)
    const body = ReproduceRequestSchema.safeParse(request.body)
    if (!params.success) return invalidDerived(reply, params)
    if (!body.success) return invalidDerived(reply, body)
    return reply.status(201).send(await derivedRuns.reproduce(params.data.assertionDigest, body.data))
  })
  app.get('/api/v6/derived/source-records', async (request, reply) => {
    const parsed = SourceSelectorSchema.safeParse({ ...request.query, record_id: request.query.record_id ?? null })
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.sourceRecords(parsed.data)
  })
  app.post('/api/v6/derived/query', async (request, reply) => {
    const parsed = LayeredQuerySchema.safeParse(request.body)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.query(parsed.data)
  })
  app.post('/api/v6/derived/impact', async (request, reply) => {
    const parsed = ImpactRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.impact(parsed.data)
  })
  app.post('/api/v6/derived/measurements/compare', async (request, reply) => {
    const parsed = MeasurementComparisonRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidDerived(reply, parsed)
    return derived.compare(parsed.data)
  })
  const invalidWorkspace = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_WORKSPACE_REQUEST', error: 'Unprocessable Entity', message: 'Workspace request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  app.get('/api/v7/workspace', async () => ({
    contractVersion: '1.0.0',
    checkpointMode: 'from-specification',
    statefulContinuation: false,
    objectAddressing: 'sha256',
    routes: {
      experiments: '/api/v7/workspace/experiments',
      runs: '/api/v7/workspace/runs',
      resourceProfiles: '/api/v7/workspace/resource-profiles',
      comparisons: '/api/v7/workspace/comparisons',
      reports: '/api/v7/workspace/reports'
    }
  }))
  app.get('/api/v7/workspace/resource-profiles', async () => workspace.listResourceProfiles())
  app.post('/api/v7/workspace/resource-profiles', async (request, reply) => {
    const parsed = ResourceProfileSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(201).send(workspace.createResourceProfile(parsed.data))
  })
  app.get('/api/v7/workspace/experiments', async () => workspace.listExperiments())
  app.post('/api/v7/workspace/experiments', async (request, reply) => {
    const parsed = ExperimentCreateRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(201).send(await workspace.createExperiment(parsed.data))
  })
  app.post('/api/v7/workspace/experiments/import', { bodyLimit: WORKSPACE_BUNDLE_REQUEST_BODY_LIMIT }, async (request, reply) => {
    const parsed = BundleImportRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(201).send(await workspace.importExperiment(Buffer.from(parsed.data.bundleBase64, 'base64')))
  })
  app.get('/api/v7/workspace/experiments/:experimentId', async (request, reply) => {
    const parsed = WorkspaceExperimentParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.getExperiment(parsed.data.experimentId)
  })
  app.post('/api/v7/workspace/experiments/:experimentId/revisions', async (request, reply) => {
    const params = WorkspaceRevisionParamSchema.safeParse(request.params)
    const body = RevisionCreateRequestSchema.safeParse(request.body)
    if (!params.success) return invalidWorkspace(reply, params)
    if (!body.success) return invalidWorkspace(reply, body)
    return reply.status(201).send(await workspace.createRevision(params.data.experimentId, body.data))
  })
  app.post('/api/v7/workspace/experiments/:experimentId/clone', async (request, reply) => {
    const params = WorkspaceExperimentParamSchema.safeParse(request.params)
    const body = WorkspaceCloneRequestSchema.safeParse(request.body ?? {})
    if (!params.success) return invalidWorkspace(reply, params)
    if (!body.success) return invalidWorkspace(reply, body)
    return reply.status(201).send(await workspace.cloneExperiment(params.data.experimentId, body.data.name))
  })
  app.get('/api/v7/workspace/experiments/:experimentId/export', async (request, reply) => {
    const parsed = WorkspaceExperimentParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.exportExperiment(parsed.data.experimentId)
  })
  app.get('/api/v7/workspace/runs', async (request, reply) => {
    const parsed = HistoryFilterSchema.safeParse(request.query)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.listHistory(parsed.data)
  })
  app.post('/api/v7/workspace/runs', async (request, reply) => {
    const parsed = RunCreateRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(202).send(workspace.queueRun(parsed.data))
  })
  app.get('/api/v7/workspace/runs/scientific/:runId', async (request, reply) => {
    const parsed = WorkspaceRunParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.getRun(parsed.data.runId)
  })
  app.get('/api/v7/workspace/runs/:attemptId', async (request, reply) => {
    const parsed = WorkspaceAttemptParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.getAttempt(parsed.data.attemptId)
  })
  app.get('/api/v7/workspace/runs/:attemptId/events', async (request, reply) => {
    const parsed = WorkspaceAttemptParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.events(parsed.data.attemptId)
  })
  app.post('/api/v7/workspace/runs/:attemptId/cancel', async (request, reply) => {
    const parsed = WorkspaceAttemptParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    const attempt = workspace.cancel(parsed.data.attemptId)
    return attempt ?? reply.status(409).send({ statusCode: 409, code: 'ATTEMPT_NOT_CANCELLABLE', error: 'Conflict', message: 'Run attempt is already terminal.' })
  })
  app.get('/api/v7/workspace/runs/:attemptId/checkpoints', async (request, reply) => {
    const parsed = WorkspaceAttemptParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.checkpoints(parsed.data.attemptId)
  })
  app.post('/api/v7/workspace/checkpoints/:checkpointId/restart', async (request, reply) => {
    const params = WorkspaceCheckpointParamSchema.safeParse(request.params)
    const body = RestartRequestSchema.safeParse(request.body ?? {})
    if (!params.success) return invalidWorkspace(reply, params)
    if (!body.success) return invalidWorkspace(reply, body)
    return reply.status(202).send(await workspace.restart(params.data.checkpointId, body.data.resourceProfileId))
  })
  app.get('/api/v7/workspace/runs/:attemptId/artifacts', async (request, reply) => {
    const parsed = WorkspaceAttemptParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.artifacts(parsed.data.attemptId)
  })
  app.get('/api/v7/workspace/artifacts/:artifactId', async (request, reply) => {
    const parsed = WorkspaceArtifactParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    const { artifact, content } = await workspace.artifactContent(parsed.data.artifactId)
    return reply.headers({ 'content-type': artifact.mediaType, 'content-length': artifact.bytes, 'x-content-sha256': artifact.digest, 'content-disposition': `attachment; filename="${artifact.name}"` }).send(content)
  })
  app.post('/api/v7/workspace/comparisons', async (request, reply) => {
    const parsed = ComparisonRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(201).send(await workspace.compare(parsed.data))
  })
  app.get('/api/v7/workspace/comparisons/:comparisonId', async (request, reply) => {
    const parsed = WorkspaceComparisonParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.getComparison(parsed.data.comparisonId)
  })
  app.post('/api/v7/workspace/reports', async (request, reply) => {
    const parsed = ReportRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return reply.status(201).send(await workspace.createReport(parsed.data.attemptId))
  })
  app.get('/api/v7/workspace/reports/:reportId', async (request, reply) => {
    const parsed = WorkspaceReportParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    return workspace.getReport(parsed.data.reportId)
  })
  app.get('/api/v7/workspace/reports/:reportId/files/:format', async (request, reply) => {
    const parsed = WorkspaceReportFileParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidWorkspace(reply, parsed)
    const report = workspace.getReport(parsed.data.reportId)
    const artifact = report.artifacts.find((item) => item.kind === `report-${parsed.data.format}`)
    const content = await workspace.artifactContent(artifact.artifactId)
    const headers = parsed.data.format === 'html' ? { 'content-security-policy': report.csp } : {}
    return reply.headers({ ...headers, 'content-type': content.artifact.mediaType, 'x-content-sha256': content.artifact.digest }).send(content.content)
  })
  const invalidPhysiology = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_PHYSIOLOGY_REQUEST', error: 'Unprocessable Entity', message: 'Physiology request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requirePhysiologyMutation = async (request) => {
    if (!requireFixedOrigin(request, PHYSIOLOGY_CSRF_HEADER, PHYSIOLOGY_CSRF_VALUE)) throw new PhysiologyRequestError('physiology_csrf_rejected', 'Physiology mutation requires a startup-allowlisted Origin and CSRF header.', 403)
  }

  app.get('/api/v8/physiology', async () => ({
    contractVersion: PHYSIOLOGY_CONTRACT_VERSION,
    releaseId: PHYSIOLOGY_RELEASE_ID,
    releaseDigest: PHYSIOLOGY_RELEASE_DIGEST,
    packageProfile: 'biochemical-physiology-package-v1',
    processPlugins: physiology.sandbox.available ? 'sandbox-gated' : 'disabled',
    scientificValidation: 'unsupported',
    warning: PHYSIOLOGY_WARNING,
    routes: { evidence: '/api/v8/physiology/evidence', validatePackage: '/api/v8/physiology/packages/validate', installPackage: '/api/v8/physiology/packages/install', catalog: '/api/v8/physiology/packages', couplings: '/api/v8/physiology/couplings', runs: '/api/v8/physiology/runs', coverage: '/api/v8/physiology/coverage', trust: '/api/v8/physiology/trust' }
  }))
  app.get('/api/v8/physiology/evidence', async () => physiology.evidence())
  app.post('/api/v8/physiology/packages/validate', { bodyLimit: BPP_REQUEST_BODY_LIMIT, preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = PackageValidationRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.validatePackage(Buffer.from(parsed.data.packageBase64, 'base64'))
  })
  app.post('/api/v8/physiology/packages/install', { bodyLimit: BPP_REQUEST_BODY_LIMIT, preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = PackageValidationRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return reply.status(201).send(await physiology.installPackage(Buffer.from(parsed.data.packageBase64, 'base64')))
  })
  app.get('/api/v8/physiology/packages', async () => physiology.listPackages())
  app.get('/api/v8/physiology/packages/:packageDigest', async (request, reply) => {
    const parsed = PhysiologyDigestParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.getPackage(parsed.data.packageDigest)
  })
  app.post('/api/v8/physiology/packages/:packageDigest/conformance', { preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = PhysiologyDigestParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.conformance(parsed.data.packageDigest)
  })
  app.get('/api/v8/physiology/trust', async () => physiology.listTrust())
  app.post('/api/v8/physiology/trust', { preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = TrustKeyAddRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return reply.status(201).send(physiology.addTrustKey(parsed.data))
  })
  app.post('/api/v8/physiology/trust/:keyId/revoke', { preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = PhysiologyTrustParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.revokeTrustKey(parsed.data.keyId)
  })
  app.get('/api/v8/physiology/couplings', async () => physiology.listCouplings())
  app.post('/api/v8/physiology/couplings', { preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = CouplingCreateRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return reply.status(201).send(physiology.createCoupling(parsed.data))
  })
  app.get('/api/v8/physiology/couplings/:couplingDigest', async (request, reply) => {
    const parsed = PhysiologyCouplingParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.getCoupling(parsed.data.couplingDigest)
  })
  app.get('/api/v8/physiology/runs', async () => physiology.listRuns())
  app.post('/api/v8/physiology/runs', { preHandler: requirePhysiologyMutation }, async (request, reply) => {
    const parsed = PhysiologyRunRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return reply.status(201).send(await physiology.run(parsed.data))
  })
  app.get('/api/v8/physiology/runs/:runDigest', async (request, reply) => {
    const parsed = PhysiologyRunParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidPhysiology(reply, parsed)
    return physiology.getRun(parsed.data.runDigest)
  })
  app.get('/api/v8/physiology/coverage', async () => physiology.coverage())
  const invalidDataPlane = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_DATA_PLANE_REQUEST', error: 'Unprocessable Entity', message: 'Data-plane request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireDataPlaneMutation = async (request) => {
    if (!requireFixedOrigin(request, DATA_PLANE_CSRF_HEADER, DATA_PLANE_CSRF_VALUE)) throw new DataPlaneRequestError('data_plane_csrf_rejected', 'Data-plane mutation requires a startup-allowlisted Origin and CSRF header.', 403)
  }

  app.get('/api/v9/data-plane', async () => ({
    contractVersion: '1.0.0',
    mode: 'local-verified-mirror',
    explicitSync: true,
    readNetworkAccess: false,
    pins: DATA_PLANE_PINS,
    status: dataPlane.status(),
    routes: {
      status: '/api/v9/data-plane/status',
      sync: '/api/v9/data-plane/sync',
      releases: '/api/v9/data-plane/releases',
      release: '/api/v9/data-plane/releases/{releaseId}',
      record: '/api/v9/data-plane/releases/{releaseId}/records/{recordType}/{recordId}',
      pages: '/api/v9/data-plane/releases/{releaseId}/pages/{recordType}',
      diff: '/api/v9/data-plane/diff',
      integrity: '/api/v9/data-plane/integrity',
      audits: '/api/v9/data-plane/audits',
      audit: '/api/v9/data-plane/audits/{reportDigest}'
    }
  }))
  app.get('/api/v9/data-plane/status', async () => dataPlane.status())
  app.post('/api/v9/data-plane/sync', { preHandler: requireDataPlaneMutation }, async (request, reply) => {
    const parsed = DataPlaneSyncRequestSchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return reply.status(200).send(await dataPlane.sync())
  })
  app.get('/api/v9/data-plane/releases', async () => dataPlane.listReleases())
  app.get('/api/v9/data-plane/releases/:releaseId', async (request, reply) => {
    const parsed = DataPlaneReleaseParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return dataPlane.releaseDetail(parsed.data.releaseId)
  })
  app.get('/api/v9/data-plane/releases/:releaseId/records/:recordType/:recordId', async (request, reply) => {
    const parsed = DataPlaneRecordParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return dataPlane.record(parsed.data.releaseId, parsed.data.recordType, parsed.data.recordId)
  })
  app.get('/api/v9/data-plane/releases/:releaseId/pages/:recordType', async (request, reply) => {
    const params = DataPlanePageParamSchema.safeParse(request.params)
    const query = DataPlanePageQuerySchema.safeParse(request.query)
    if (!params.success) return invalidDataPlane(reply, params)
    if (!query.success) return invalidDataPlane(reply, query)
    return dataPlane.page(params.data.releaseId, params.data.recordType, query.data)
  })
  app.get('/api/v9/data-plane/diff', async (request, reply) => {
    const parsed = DataPlaneDiffQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return dataPlane.diff(parsed.data.base_release_id, parsed.data.candidate_release_id)
  })
  app.get('/api/v9/data-plane/integrity', async () => dataPlane.integrity())
  app.post('/api/v9/data-plane/audits', { preHandler: requireDataPlaneMutation }, async (request, reply) => {
    const parsed = AuthorityClosureAuditRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return reply.status(201).send(await dataPlane.audit(parsed.data.candidateReleaseId, parsed.data.baselineReleaseId))
  })
  app.get('/api/v9/data-plane/audits', async () => dataPlane.listAudits())
  app.get('/api/v9/data-plane/audits/:reportDigest', async (request, reply) => {
    const parsed = DataPlaneAuditParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidDataPlane(reply, parsed)
    return dataPlane.auditDetail(parsed.data.reportDigest)
  })
  const invalidMeasured = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_MEASURED_REQUEST', error: 'Unprocessable Entity', message: 'Measured request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireMeasuredMutation = async (request) => {
    if (!requireFixedOrigin(request, MEASURED_CSRF_HEADER, MEASURED_CSRF_VALUE)) throw new MeasuredRequestError('MEASURED_CSRF_REJECTED', 'Measured mutation requires a startup-allowlisted Origin and browser CSRF header.', 403)
  }
  const protectedMeasuredHeaders = (reply) => reply.headers({ 'cache-control': 'private, no-store', pragma: 'no-cache' })
  const measuredProtectedRoute = { onRequest: async (_request, reply) => { protectedMeasuredHeaders(reply) }, preHandler: requireMeasuredMutation }

  app.get('/api/v10/measured', async () => measured.discovery())
  app.get('/api/v10/measured/status', async () => measured.status())
  app.post('/api/v10/measured/sync', { preHandler: requireMeasuredMutation }, async (request, reply) => {
    const parsed = MeasuredSyncRequestSchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return measured.sync()
  })
  app.get('/api/v10/measured/pages/:recordType', async (request, reply) => {
    const params = MeasuredPageParamSchema.safeParse(request.params)
    const query = MeasuredLocalPageQuerySchema.safeParse(request.query)
    if (!params.success) return invalidMeasured(reply, params)
    if (!query.success) return invalidMeasured(reply, query)
    return measured.page(params.data.recordType, query.data)
  })
  app.get('/api/v10/measured/lineages/:measurementId', async (request, reply) => {
    const parsed = MeasuredLineageParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return measured.lineage(parsed.data.measurementId)
  })
  app.post('/api/v10/measured/calibrations', { preHandler: requireMeasuredMutation }, async (request, reply) => {
    const parsed = CalibrationRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return reply.status(201).send(await measured.calibrate(parsed.data))
  })
  app.get('/api/v10/measured/calibrations', async () => measured.listCalibrations())
  app.get('/api/v10/measured/calibrations/:artifactDigest', async (request, reply) => {
    const parsed = MeasuredArtifactParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return measured.calibration(parsed.data.artifactDigest)
  })
  app.get('/api/v10/measured/integrity', async () => measured.integrity())
  app.post('/api/v10/measured/commitments', measuredProtectedRoute, async (request, reply) => {
    const parsed = FreezeIntentSchema.safeParse(request.body)
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return measured.freeze(parsed.data, request.raw.signal)
  })
  app.post('/api/v10/measured/evaluation', measuredProtectedRoute, async (request, reply) => {
    const parsed = DisclosureIntentSchema.safeParse(request.body)
    if (!parsed.success) return invalidMeasured(reply, parsed)
    return measured.disclose(parsed.data, request.raw.signal)
  })
  const invalidChallenge = (reply, parsed) => reply.status(422).send({ statusCode: 422, code: 'INVALID_CHALLENGE_REQUEST', error: 'Unprocessable Entity', message: 'Goal 13 request does not match the strict v1 contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const challengeRequestOrigin = (request) => {
    if (request.headers.origin) return request.headers.origin
    if (request.method !== 'GET' || !request.headers.referer) return null
    try {
      const referer = new URL(request.headers.referer)
      return ['http:', 'https:'].includes(referer.protocol) && !referer.username && !referer.password ? referer.origin : null
    } catch {
      return null
    }
  }
  const requireChallengeAccess = async (request) => {
    if (!allowedOrigins.has(challengeRequestOrigin(request)) || request.headers[CHALLENGE_CSRF_HEADER] !== CHALLENGE_CSRF_VALUE) throw new ChallengeRequestError('CHALLENGE_CSRF_REJECTED', 'Goal 13 protected access requires a startup-allowlisted browser origin and CSRF header.', 403)
  }
  const challengeMutation = { bodyLimit: CHALLENGE_REQUEST_BODY_LIMIT, preHandler: requireChallengeAccess }
  const challengeProtectedRead = { preHandler: requireChallengeAccess }
  const challengeQuery = (request, reply) => {
    const parsed = ChallengeEmptyObjectSchema.safeParse(request.query)
    return parsed.success ? true : invalidChallenge(reply, parsed)
  }

  app.get('/api/v11/challenge', async (request, reply) => challengeQuery(request, reply) === true ? challenge.discovery() : reply)
  app.get('/api/v11/challenge/status', async (request, reply) => challengeQuery(request, reply) === true ? challenge.status() : reply)
  app.post('/api/v11/challenge/sync', challengeMutation, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const parsed = ChallengeEmptyObjectSchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return challenge.sync(request.raw.signal)
  })
  app.post('/api/v11/challenge/commitments', challengeMutation, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const parsed = ChallengeFreezeIntentSchema.safeParse(request.body)
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return reply.status(201).send(await challenge.prepare(parsed.data, request.raw.signal))
  })
  app.post('/api/v11/challenge/commitments/:commitmentDigest/disclose', challengeMutation, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const params = ChallengeCommitmentParamSchema.safeParse(request.params)
    const body = ChallengeDisclosureIntentSchema.safeParse(request.body)
    if (!params.success) return invalidChallenge(reply, params)
    if (!body.success) return invalidChallenge(reply, body)
    if (body.data.commitmentDigest !== params.data.commitmentDigest) return reply.status(409).send({ statusCode: 409, code: 'CHALLENGE_IDENTITY_MISMATCH', error: 'Conflict', message: 'Goal 13 commitment path and body identities differ.' })
    return reply.status(201).send(await challenge.disclose(body.data, request.raw.signal))
  })
  app.get('/api/v11/challenge/runs', challengeProtectedRead, async (request, reply) => {
    const parsed = ChallengeRunListQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return challenge.listRuns(parsed.data.limit)
  })
  app.get('/api/v11/challenge/reports/:resultDigest', challengeProtectedRead, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const parsed = ChallengeReportParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return challenge.report(parsed.data.resultDigest)
  })
  app.post('/api/v11/challenge/reports/:resultDigest/replay', challengeMutation, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const body = ChallengeEmptyObjectSchema.safeParse(request.body ?? {})
    if (!body.success) return invalidChallenge(reply, body)
    const parsed = ChallengeReportParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return challenge.replay(parsed.data.resultDigest)
  })
  app.get('/api/v11/challenge/artifacts/:artifactDigest', challengeProtectedRead, async (request, reply) => {
    if (challengeQuery(request, reply) !== true) return reply
    const parsed = ChallengeArtifactParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidChallenge(reply, parsed)
    return challenge.artifact(parsed.data.artifactDigest)
  })
  app.get('/api/v11/challenge/integrity', challengeProtectedRead, async (request, reply) => challengeQuery(request, reply) === true ? challenge.integrity() : reply)
  const invalidMeasuredSpatial = (reply, parsed) => reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(422).send({ statusCode: 422, code: 'INVALID_MEASURED_SPATIAL_REQUEST', error: 'Unprocessable Entity', message: 'Goal 14 request does not match the strict bounded measured-spatial contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireMeasuredSpatialMutation = async (request) => {
    if (!requireFixedOrigin(request, MEASURED_SPATIAL_CSRF_HEADER, MEASURED_SPATIAL_CSRF_VALUE)) throw new MeasuredSpatialRequestError('MEASURED_SPATIAL_CSRF_REJECTED', 'Goal 14 cache mutation requires a startup-allowlisted browser origin and CSRF header.', 403)
  }
  const measuredSpatialMutation = { preHandler: requireMeasuredSpatialMutation }
  const measuredSpatialQuery = (request, reply) => {
    const parsed = MeasuredSpatialEmptySchema.safeParse(request.query)
    return parsed.success ? true : invalidMeasuredSpatial(reply, parsed)
  }
  const measuredSpatialMutable = (reply) => reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).removeHeader('etag')
  const measuredSpatialImmutable = (reply) => reply.headers({
    'cache-control': 'public, max-age=31536000, immutable',
    'x-release-id': MEASURED_SPATIAL_PINS.releaseId,
    'x-release-digest': MEASURED_SPATIAL_PINS.releaseDigest
  })

  app.get('/api/v12/measured-spatial', async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    measuredSpatialMutable(reply)
    return measuredSpatial.discovery()
  })
  app.get('/api/v12/measured-spatial/status', async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    measuredSpatialMutable(reply)
    return measuredSpatial.status()
  })
  app.post('/api/v12/measured-spatial/sync', measuredSpatialMutation, async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    const parsed = MeasuredSpatialEmptySchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidMeasuredSpatial(reply, parsed)
    measuredSpatialMutable(reply)
    return measuredSpatial.sync(request.raw.signal)
  })
  app.get('/api/v12/measured-spatial/records/:recordType', async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    const parsed = MeasuredSpatialRecordParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidMeasuredSpatial(reply, parsed)
    measuredSpatialImmutable(reply)
    return measuredSpatial.recordPage(parsed.data.recordType)
  })
  app.get('/api/v12/measured-spatial/chunks', async (request, reply) => {
    const parsed = MeasuredSpatialChunkQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidMeasuredSpatial(reply, parsed)
    measuredSpatialImmutable(reply)
    return measuredSpatial.chunkInventory({ arrayId: parsed.data.array_id ?? null, level: parsed.data.level ?? null, offset: parsed.data.offset, limit: parsed.data.limit })
  })
  app.get('/api/v12/measured-spatial/chunks/:arrayId/:level/:z/:y/:x', async (request, reply) => {
    if (request.headers.range || Object.keys(request.query).length > 0) return reply.headers({ 'accept-ranges': 'none', 'cache-control': 'no-store' }).status(416).send({ statusCode: 416, code: 'MEASURED_SPATIAL_RANGE_REJECTED', error: 'Range Not Satisfiable', message: 'Goal 14 chunks are atomic and do not accept ranges or query parameters.' })
    const parsed = MeasuredSpatialChunkParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidMeasuredSpatial(reply, parsed)
    const selected = await measuredSpatial.chunk(parsed.data.arrayId, parsed.data.level, [parsed.data.z, parsed.data.y, parsed.data.x], request.raw.signal)
    const descriptor = selected.descriptor
    return measuredSpatialImmutable(reply).headers({
      'accept-ranges': 'none',
      'content-length': descriptor.encoded_bytes,
      etag: `"sha256:${descriptor.encoded_sha256}"`,
      'x-content-sha256': descriptor.encoded_sha256,
      'x-decoded-sha256': descriptor.decoded_sha256,
      'x-array-id': descriptor.array_id,
      'x-level': descriptor.level,
      'x-chunk-grid': descriptor.grid_zyx.join('.'),
      'x-cache-source': selected.source
    }).type(descriptor.media_type).send(selected.bytes)
  })
  app.post('/api/v12/measured-spatial/offline-completion', measuredSpatialMutation, async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    const parsed = MeasuredSpatialEmptySchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidMeasuredSpatial(reply, parsed)
    measuredSpatialMutable(reply)
    return measuredSpatial.completeOffline(request.raw.signal)
  })
  app.get('/api/v12/measured-spatial/integrity', async (request, reply) => {
    if (measuredSpatialQuery(request, reply) !== true) return reply
    measuredSpatialMutable(reply)
    return measuredSpatial.integrity()
  })
  const invalidSpatialRegistration = (reply, parsed) => reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(422).send({ statusCode: 422, code: 'INVALID_SPATIAL_REGISTRATION_REQUEST', error: 'Unprocessable Entity', message: 'Goal 14 registration request does not match the strict bounded contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireSpatialRegistrationMutation = async (request) => {
    if (!requireFixedOrigin(request, SPATIAL_REGISTRATION_CSRF_HEADER, SPATIAL_REGISTRATION_CSRF_VALUE)) throw new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_CSRF_REJECTED', 'Goal 14 registration cache and transform intents require the startup-allowlisted browser origin and CSRF header.', 403)
  }
  const spatialRegistrationMutation = { preHandler: requireSpatialRegistrationMutation }
  const spatialRegistrationQuery = (request, reply) => {
    const parsed = SpatialRegistrationEmptySchema.safeParse(request.query)
    return parsed.success ? true : invalidSpatialRegistration(reply, parsed)
  }
  const spatialRegistrationMutable = (reply) => reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).removeHeader('etag')
  const spatialRegistrationImmutable = (reply) => reply.headers({ 'cache-control': 'public, max-age=31536000, immutable', link: SPATIAL_REGISTRATION_RIGHTS_LINK, 'x-release-id': SPATIAL_REGISTRATION_PINS.releaseId, 'x-release-digest': SPATIAL_REGISTRATION_PINS.releaseDigest })

  app.get('/api/v14/spatial-registration', async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    spatialRegistrationMutable(reply)
    return spatialRegistration.discovery()
  })
  app.get('/api/v14/spatial-registration/status', async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    spatialRegistrationMutable(reply)
    return spatialRegistration.status()
  })
  app.post('/api/v14/spatial-registration/sync', spatialRegistrationMutation, async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    const parsed = SpatialRegistrationEmptySchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationMutable(reply)
    return spatialRegistration.sync(request.raw.signal)
  })
  app.get('/api/v14/spatial-registration/records/:recordType', async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    const parsed = SpatialRegistrationRecordTypeSchema.safeParse(request.params.recordType)
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationImmutable(reply)
    return spatialRegistration.recordPage(parsed.data)
  })
  app.get('/api/v14/spatial-registration/chunks', async (request, reply) => {
    const parsed = SpatialRegistrationChunkQuerySchema.safeParse(request.query)
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationImmutable(reply)
    return spatialRegistration.chunkInventory({ arrayId: parsed.data.array_id ?? null, offset: parsed.data.offset, limit: parsed.data.limit })
  })
  app.get('/api/v14/spatial-registration/chunks/:arrayId/:z/:y/:x', async (request, reply) => {
    if (request.headers.range || Object.keys(request.query).length > 0) return reply.headers({ 'accept-ranges': 'none', 'cache-control': 'no-store' }).status(416).send({ statusCode: 416, code: 'SPATIAL_REGISTRATION_RANGE_REJECTED', error: 'Range Not Satisfiable', message: 'Goal 14 registration chunks are atomic and reject ranges and query parameters.' })
    const parsed = SpatialRegistrationChunkParamSchema.safeParse(request.params)
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    const selected = await spatialRegistration.chunk(parsed.data.arrayId, [parsed.data.z, parsed.data.y, parsed.data.x], request.raw.signal)
    const descriptor = selected.descriptor
    return spatialRegistrationImmutable(reply).headers({ 'accept-ranges': 'none', 'content-length': descriptor.encoded_bytes, etag: `"sha256:${descriptor.encoded_sha256}"`, 'x-content-sha256': descriptor.encoded_sha256, 'x-decoded-sha256': descriptor.decoded_sha256, 'x-array-id': descriptor.array_id, 'x-level': '0', 'x-chunk-grid': descriptor.grid_zyx.join('.'), 'x-cache-source': selected.source }).type(descriptor.media_type).send(selected.bytes)
  })
  app.post('/api/v14/spatial-registration/residual-overlap', spatialRegistrationMutation, async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    const parsed = SpatialRegistrationEmptySchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationMutable(reply)
    return spatialRegistration.recomputeResidualOverlap(request.raw.signal)
  })
  app.post('/api/v14/spatial-registration/transform', spatialRegistrationMutation, async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    const parsed = SpatialRegistrationTransformRequestSchema.safeParse(request.body)
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationMutable(reply)
    return spatialRegistration.transform(parsed.data, request.raw.signal)
  })
  app.post('/api/v14/spatial-registration/offline-completion', spatialRegistrationMutation, async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    const parsed = SpatialRegistrationEmptySchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidSpatialRegistration(reply, parsed)
    spatialRegistrationMutable(reply)
    return spatialRegistration.completeOffline(request.raw.signal)
  })
  app.get('/api/v14/spatial-registration/integrity', async (request, reply) => {
    if (spatialRegistrationQuery(request, reply) !== true) return reply
    spatialRegistrationMutable(reply)
    return spatialRegistration.integrity()
  })
  const invalidRevalidation = (reply, parsed) => reply.headers({ 'cache-control': 'no-store', pragma: 'no-cache' }).status(422).send({ statusCode: 422, code: 'INVALID_REVALIDATION_REQUEST', error: 'Unprocessable Entity', message: 'Goal 15 request does not match the strict bounded revalidation contract.', fieldErrors: parsed.error.flatten().fieldErrors })
  const requireRevalidation = () => {
    if (!revalidation) throw new RevalidationIntegrationError('revalidation-not-configured', 'Goal 15 producer integration is not configured.', 503)
    return revalidation
  }
  const requireRevalidationMutation = async (request) => {
    if (!requireFixedOrigin(request, REVALIDATION_CSRF_HEADER, REVALIDATION_CSRF_VALUE)) throw new RevalidationIntegrationError('revalidation-csrf-rejected', 'Goal 15 campaign mutation requires a startup-allowlisted browser origin and CSRF header.', 403)
  }
  const revalidationMutation = { preHandler: requireRevalidationMutation }
  const revalidationQuery = (request, reply) => {
    const parsed = RevalidationEmptySchema.safeParse(request.query)
    return parsed.success ? true : invalidRevalidation(reply, parsed)
  }
  const revalidationParams = (request, reply) => {
    const parsed = RevalidationCampaignParamSchema.safeParse(request.params)
    return parsed.success ? parsed.data : invalidRevalidation(reply, parsed)
  }
  const revalidationProjection = (request, reply) => {
    const parsed = RevalidationProjectionQuerySchema.safeParse(request.query)
    if (parsed.success) return parsed.data
    invalidRevalidation(reply, parsed)
    return null
  }

  app.get('/api/v13/revalidation/status', async (request, reply) => revalidationQuery(request, reply) === true ? requireRevalidation().status() : reply)
  app.get('/api/v13/revalidation/campaigns', async (request, reply) => revalidationQuery(request, reply) === true ? requireRevalidation().campaigns() : reply)
  app.post('/api/v13/revalidation/campaigns', revalidationMutation, async (request, reply) => {
    if (revalidationQuery(request, reply) !== true) return reply
    const parsed = RevalidationSyncRequestSchema.safeParse(request.body ?? {})
    if (!parsed.success) return invalidRevalidation(reply, parsed)
    return reply.status(201).send(await requireRevalidation().sync(parsed.data))
  })
  app.get('/api/v13/revalidation/campaigns/:campaignId', async (request, reply) => {
    const query = revalidationProjection(request, reply)
    if (!query) return reply
    const parsed = revalidationParams(request, reply)
    return parsed?.campaignId ? requireRevalidation().detail(parsed.campaignId, { limit: query.limit, cursor: query.cursor ?? null }) : reply
  })
  app.get('/api/v13/revalidation/campaigns/:campaignId/report', async (request, reply) => {
    if (revalidationQuery(request, reply) !== true) return reply
    const parsed = revalidationParams(request, reply)
    return parsed?.campaignId ? requireRevalidation().report(parsed.campaignId) : reply
  })
  app.post('/api/v13/revalidation/campaigns/:campaignId/reconcile', revalidationMutation, async (request, reply) => {
    if (revalidationQuery(request, reply) !== true) return reply
    const body = RevalidationEmptySchema.safeParse(request.body ?? {})
    if (!body.success) return invalidRevalidation(reply, body)
    const parsed = revalidationParams(request, reply)
    return parsed?.campaignId ? requireRevalidation().reconcile(parsed.campaignId) : reply
  })
  app.post('/api/v13/revalidation/campaigns/:campaignId/cancel', revalidationMutation, async (request, reply) => {
    if (revalidationQuery(request, reply) !== true) return reply
    const body = RevalidationEmptySchema.safeParse(request.body ?? {})
    if (!body.success) return invalidRevalidation(reply, body)
    const parsed = revalidationParams(request, reply)
    return parsed?.campaignId ? requireRevalidation().cancel(parsed.campaignId) : reply
  })
  app.get('/api/v13/revalidation/integrity', async (request, reply) => revalidationQuery(request, reply) === true ? requireRevalidation().integrity() : reply)
  app.get('/api/v13/revalidation/events', async (request, reply) => {
    const query = revalidationProjection(request, reply)
    return query === null ? reply : requireRevalidation().events(query)
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

  const clientRoot = options.clientRoot ?? resolve(process.cwd(), 'dist')
  if (options.serveClient !== false && existsSync(clientRoot)) {
    await app.register(fastifyStatic, { root: clientRoot })
    app.setNotFoundHandler((request, reply) => request.raw.url?.startsWith('/api/')
      ? reply.status(404).send({ statusCode: 404, code: 'NOT_FOUND', error: 'Not Found', message: 'API route not found' })
      : reply.sendFile('index.html'))
  }
  return app
}
