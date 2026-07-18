import { z } from 'zod'
import { ModelSchema, NetworkSchema, ProvenanceSchema, ReleaseSchema, SimulationResultSchema } from '../shared/contracts.js'
import {
  AtlasClaimsResponseSchema,
  AtlasCoverageResponseSchema,
  AtlasEntityResponseSchema,
  AtlasNetworkSchema,
  AtlasReleaseDetailSchema,
  AtlasReleaseSchema,
  AtlasSubgraphSchema
} from '../shared/atlas-contracts.js'
import {
  EvidenceCandidateExtractionRequestSchema,
  EvidenceCandidateListResponseSchema,
  EvidenceCandidateResponseSchema,
  EvidenceDocumentResponseSchema,
  EvidenceHealthSchema,
  EvidenceSearchRequestSchema,
  EvidenceSearchResponseSchema
} from '../shared/evidence-contracts.js'
import { ExperimentSchema, PortfolioModelSchema, RunRecordSchema } from '../shared/portfolio-contracts.js'
import { ParameterOptionsResponseSchema, StudyRecordSchema, StudyRequestSchema } from '../shared/parameter-contracts.js'
import {
  APAP_RELEASE_ID,
  ApapDiscoverySchema,
  ApapRunRecordSchema,
  ApapRunRequestSchema,
  UpstreamApapAssumptionsSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../shared/apap-contracts.js'
import {
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetsSchema,
  SpatialCatalogSchema,
  SpatialContentIdSchema,
  SpatialDescriptorsSchema,
  SpatialDetailSchema,
  SpatialDiscoverySchema,
  SpatialInventorySchema,
  SpatialMappingsSchema,
  SpatialSpacesSchema,
  SpatialStructuresSchema,
  SpatialTransformsSchema,
  SpatialAssetIdSchema
} from '../shared/spatial-contracts.js'
import { selectLod } from './spatial.js'
import {
  AssertionDetailSchema,
  AssertionEventsSchema,
  AssertionListSchema,
  BundleDetailSchema,
  BundleSubmitResponseSchema,
  DERIVED_CSRF_HEADER,
  DERIVED_CSRF_VALUE,
  DerivedHealthSchema,
  EventAppendResponseSchema,
  ImpactRequestSchema,
  ImpactResponseSchema,
  LayeredQueryResponseSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  MeasurementComparisonResponseSchema,
  ReproduceRequestSchema,
  ReviewEventRequestSchema
} from '../shared/derived-contracts.js'
import {
  ArtifactRecordSchema,
  AttemptDetailSchema,
  AttemptRecordSchema,
  BundleExportResponseSchema,
  ComparisonRecordSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  ExperimentDetailSchema,
  ExperimentRecordSchema,
  HistoryResponseSchema,
  ReportRecordSchema,
  ResourceProfileSchema,
  RevisionCreateRequestSchema,
  RevisionRecordSchema,
  SpecificationCheckpointSchema,
  WorkspaceEventSchema
} from '../shared/workspace-contracts.js'
import {
  ConformanceResultSchema,
  CouplingCreateRequestSchema,
  PHYSIOLOGY_CSRF_HEADER,
  PHYSIOLOGY_CSRF_VALUE,
  PackageValidationRequestSchema,
  PackageValidationResponseSchema,
  PhysiologyCouplingSchema,
  PhysiologyCoverageMatrixSchema,
  PhysiologyDiscoverySchema,
  PhysiologyEvidenceSchema,
  PhysiologyPackageSchema,
  PhysiologyRunRequestSchema,
  PhysiologyRunSchema,
  TrustKeySchema
} from '../shared/physiology-contracts.js'
import {
  DATA_PLANE_CSRF_HEADER,
  DATA_PLANE_CSRF_VALUE,
  AuthorityClosureAuditListSchema,
  AuthorityClosureAuditReportSchema,
  AuthorityClosureAuditRequestSchema,
  DataPlaneDiscoverySchema,
  DataPlaneIntegritySchema,
  DataPlaneLocalPageSchema,
  DataPlaneLocalRecordSchema,
  DataPlaneReleaseDetailSchema,
  DataPlaneReleaseListSchema,
  DataPlaneStatusSchema,
  FactorySemanticDiffSchema
} from '../shared/data-plane-contracts.js'
import {
  CalibrationArtifactSchema,
  CalibrationRequestSchema,
  DisclosureIntentSchema,
  EvaluationResponseSchema,
  FreezeIntentSchema,
  FreezeResponseSchema,
  MEASURED_CSRF_HEADER,
  MEASURED_CSRF_VALUE,
  MeasuredLocalDiscoverySchema,
  MeasuredLocalLineageResponseSchema,
  MeasuredLocalPageSchema,
  MeasuredStatusSchema
} from '../shared/measured-contracts.js'
import {
  CHALLENGE_CSRF_HEADER,
  CHALLENGE_CSRF_VALUE,
  CHALLENGE_PINS,
  CHALLENGE_PUBLIC_RECORD_SCHEMAS,
  ChallengeArtifactRefsSchema,
  ChallengeCommitmentRequestSchema,
  ChallengeCommitmentResponseSchema,
  ChallengeDisclosureIntentSchema,
  ChallengeDisclosureResponseSchema,
  ChallengeFreezeIntentSchema,
  ChallengeResultResponseSchema,
  ChallengeResultSubmissionSchema,
  ChallengeSha256Schema,
  ChallengeTimestampSchema
} from '../shared/challenge-contracts.js'
import {
  MEASURED_SPATIAL_CSRF_HEADER,
  MEASURED_SPATIAL_CSRF_VALUE,
  MEASURED_SPATIAL_PINS,
  MEASURED_SPATIAL_RECORD_SCHEMAS,
  MEASURED_SPATIAL_RECORD_TYPES,
  MeasuredSpatialChunkSchema,
  MeasuredSpatialDiscoverySchema,
  MeasuredSpatialIntegritySchema,
  MeasuredSpatialLocalChunkPageSchema,
  MeasuredSpatialLocalRecordPageSchema,
  MeasuredSpatialOfflineCompletionSchema,
  MeasuredSpatialStatusSchema
} from '../shared/measured-spatial-contracts.js'
import {
  SPATIAL_REGISTRATION_CSRF_HEADER,
  SPATIAL_REGISTRATION_CSRF_VALUE,
  SPATIAL_REGISTRATION_PINS,
  SPATIAL_REGISTRATION_RECORD_SCHEMAS,
  SPATIAL_REGISTRATION_RECORD_TYPES,
  SPATIAL_REGISTRATION_RIGHTS_LINK,
  SpatialRegistrationChunkSchema,
  SpatialRegistrationDiscoverySchema,
  SpatialRegistrationIntegritySchema,
  SpatialRegistrationLocalChunkPageSchema,
  SpatialRegistrationLocalRecordPageSchema,
  SpatialRegistrationOfflineResponseSchema,
  SpatialRegistrationResidualOverlapResponseSchema,
  SpatialRegistrationStatusSchema,
  SpatialRegistrationTransformRequestSchema,
  SpatialRegistrationTransformResponseSchema
} from '../shared/spatial-registration-contracts.js'
import {
  REVALIDATION_CSRF_HEADER,
  REVALIDATION_CSRF_VALUE,
  ProducerEventPageSchema,
  RevalidationCampaignDetailSchema,
  RevalidationCampaignListSchema,
  RevalidationCampaignReportSchema,
  RevalidationDigestSchema,
  RevalidationIntegrationStatusSchema,
  RevalidationIntegritySchema,
  RevalidationSyncRequestSchema
} from '../shared/revalidation-contracts.js'

export class ApiError extends Error {
  constructor(message, { status, code, payload } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.payload = payload
  }
}

export async function requestJson(path, init) {
  let response
  try {
    response = await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
    throw new ApiError(message, { status: response.status, code, payload })
  }
  return payload
}

const withSignal = (signal) => signal ? { signal } : {}
const derivedMutationHeaders = { 'content-type': 'application/json', [DERIVED_CSRF_HEADER]: DERIVED_CSRF_VALUE }
const physiologyMutationHeaders = { 'content-type': 'application/json', [PHYSIOLOGY_CSRF_HEADER]: PHYSIOLOGY_CSRF_VALUE }
const dataPlaneMutationHeaders = { 'content-type': 'application/json', [DATA_PLANE_CSRF_HEADER]: DATA_PLANE_CSRF_VALUE }
const measuredMutationHeaders = { 'content-type': 'application/json', [MEASURED_CSRF_HEADER]: MEASURED_CSRF_VALUE }
const challengeMutationHeaders = { 'content-type': 'application/json', [CHALLENGE_CSRF_HEADER]: CHALLENGE_CSRF_VALUE }
const challengeProtectedReadHeaders = { [CHALLENGE_CSRF_HEADER]: CHALLENGE_CSRF_VALUE }
const measuredSpatialMutationHeaders = { 'content-type': 'application/json', [MEASURED_SPATIAL_CSRF_HEADER]: MEASURED_SPATIAL_CSRF_VALUE }
const spatialRegistrationMutationHeaders = { 'content-type': 'application/json', [SPATIAL_REGISTRATION_CSRF_HEADER]: SPATIAL_REGISTRATION_CSRF_VALUE }
const revalidationMutationHeaders = { 'content-type': 'application/json', [REVALIDATION_CSRF_HEADER]: REVALIDATION_CSRF_VALUE }

const ChallengePublicRootsSchema = z.object(Object.fromEntries(
  Object.entries(CHALLENGE_PINS.publicViewRoots).map(([viewId, digest]) => [viewId, z.literal(digest)])
)).strict()
const ChallengePinsSchema = z.object({
  releaseId: z.literal(CHALLENGE_PINS.releaseId),
  releaseDigest: z.literal(CHALLENGE_PINS.releaseDigest),
  catalogDigest: z.literal(CHALLENGE_PINS.catalogDigest),
  trustDigest: z.literal(CHALLENGE_PINS.trustDigest),
  manifestDigest: z.literal(CHALLENGE_PINS.manifestDigest),
  envelopeDigest: z.literal(CHALLENGE_PINS.envelopeDigest),
  signerKeyId: z.literal(CHALLENGE_PINS.signerKeyId),
  signerPublicKey: z.literal(CHALLENGE_PINS.signerPublicKey),
  partitionId: z.literal(CHALLENGE_PINS.partitionId),
  partitionDigest: z.literal(CHALLENGE_PINS.partitionDigest),
  samplingGridDigest: z.literal(CHALLENGE_PINS.samplingGridDigest),
  publicViewRoots: ChallengePublicRootsSchema
}).strict()
const ChallengeStatusSchema = z.object({
  state: z.enum(['empty', 'verifying', 'ready', 'failed']),
  integrity: z.enum(['empty', 'verifying', 'valid', 'failed']),
  releaseId: z.literal(CHALLENGE_PINS.releaseId).nullable(),
  disclosureEpoch: z.object({
    openedAt: ChallengeTimestampSchema,
    firstCommitmentDigest: ChallengeSha256Schema
  }).strict().nullable(),
  lastError: z.string().nullable()
}).strict().superRefine((value, context) => {
  if (value.state === 'ready' && value.releaseId !== CHALLENGE_PINS.releaseId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['releaseId'], message: 'A ready challenge status must bind the pinned release.' })
  }
  if (value.state === 'empty' && (value.releaseId !== null || value.disclosureEpoch !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'An empty challenge status cannot expose release or disclosure state.' })
  }
})
const ChallengeDiscoverySchema = z.object({
  contractVersion: z.literal('1.0.0'),
  mode: z.literal('inference-owned-goal13-consumer'),
  pins: ChallengePinsSchema,
  status: ChallengeStatusSchema,
  claims: z.tuple([z.literal('failed'), z.literal('not-evaluable'), z.literal('supported-within-boundary')]),
  routes: z.object({
    status: z.literal('/api/v11/challenge/status'),
    sync: z.literal('/api/v11/challenge/sync'),
    commitments: z.literal('/api/v11/challenge/commitments'),
    runs: z.literal('/api/v11/challenge/runs'),
    disclose: z.literal('/api/v11/challenge/commitments/{commitmentDigest}/disclose'),
    report: z.literal('/api/v11/challenge/reports/{resultDigest}'),
    replay: z.literal('/api/v11/challenge/reports/{resultDigest}/replay'),
    artifact: z.literal('/api/v11/challenge/artifacts/{artifactDigest}'),
    integrity: z.literal('/api/v11/challenge/integrity')
  }).strict()
}).strict()
const ChallengeCommitmentViewSchema = z.object({
  frozenCommitment: ChallengeCommitmentRequestSchema,
  receipt: ChallengeCommitmentResponseSchema,
  artifacts: ChallengeArtifactRefsSchema
}).strict().superRefine((value, context) => {
  const bindings = [
    ['consumer_model_digest', 'model'],
    ['equation_set_digest', 'equationSet'],
    ['parameter_policy_digest', 'parameterPolicy'],
    ['solver_digest', 'solver'],
    ['prediction_artifact_digest', 'prediction']
  ]
  for (const [field, artifact] of bindings) {
    if (value.frozenCommitment[field] !== value.artifacts[artifact].digest) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifacts', artifact, 'digest'], message: `Challenge ${artifact} artifact does not bind the frozen commitment.` })
    }
  }
  if (
    value.receipt.created_at !== value.frozenCommitment.created_at ||
    value.receipt.partition_digest !== value.frozenCommitment.partition_digest
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['receipt'], message: 'Challenge receipt does not bind the frozen commitment identity.' })
  }
})
const ChallengeIndependentScoringSchema = ChallengeResultResponseSchema.pick({
  result_contract: true,
  commitment_digest: true,
  disclosure_digest: true,
  metric: true,
  threshold: true,
  rounding: true,
  endpoint_results: true,
  conclusion: true,
  bounded_conclusion: true
})
const ChallengeEndpointDiagnosticSchema = z.object({
  endpoint_id: z.enum(['endpoint:apap-cmax:reference', 'endpoint:apap-cmax:test']),
  status: z.enum(['evaluable', 'invalid-mapping', 'invalid-diagnostics']),
  expected_unit: z.literal('mg/L'),
  predicted_unit: z.literal('mg/L'),
  reasons: z.array(z.string().min(1)).max(2)
}).strict()
const ChallengeEndpointDiagnosticsSchema = z.tuple([
  ChallengeEndpointDiagnosticSchema.extend({ endpoint_id: z.literal('endpoint:apap-cmax:reference') }).strict(),
  ChallengeEndpointDiagnosticSchema.extend({ endpoint_id: z.literal('endpoint:apap-cmax:test') }).strict()
])
const ChallengeReportSchema = z.object({
  report_schema_version: z.literal('1.0.0'),
  scientific_boundary: z.literal('aggregate parent-APAP Cmax for the two frozen oral formulations and exact published sampling grid only'),
  pins: ChallengePinsSchema,
  public_bundle_digest: ChallengeSha256Schema,
  artifact_refs: ChallengeArtifactRefsSchema,
  frozen_commitment: ChallengeCommitmentRequestSchema,
  commitment_receipt: ChallengeCommitmentResponseSchema,
  disclosure: ChallengeDisclosureResponseSchema,
  disclosure_verification: z.object({
    observation_count: z.literal(2),
    observations_ndjson_bytes: z.number().int().positive(),
    observations_ndjson_sha256: ChallengeSha256Schema,
    partition_closure_digest: z.literal(CHALLENGE_PINS.partitionDigest),
    producer_builder_algorithm: z.literal('sha256-rfc8785({role:"external-held-out",records:{all-record-types-except-partitions}})')
  }).strict(),
  endpoint_diagnostics: ChallengeEndpointDiagnosticsSchema,
  submission: ChallengeResultSubmissionSchema,
  independent_scoring: ChallengeIndependentScoringSchema,
  producer_result: ChallengeResultResponseSchema,
  not_evaluable: CHALLENGE_PUBLIC_RECORD_SCHEMAS.not_evaluable.array().length(8),
  availability: z.object({
    parameter_sensitivity_analysis: z.literal('not-available'),
    structural_uncertainty: z.literal('not-available'),
    prediction_interval: z.literal('not-available'),
    measurement_uncertainty: z.literal('not-reported-by-source')
  }).strict(),
  lineage: z.object({
    release_id: z.literal(CHALLENGE_PINS.releaseId),
    release_digest: z.literal(CHALLENGE_PINS.releaseDigest),
    partition_id: z.literal(CHALLENGE_PINS.partitionId),
    partition_digest: z.literal(CHALLENGE_PINS.partitionDigest),
    public_lineage_artifact_digest: ChallengeSha256Schema,
    concentration_mapping_artifact_digest: ChallengeSha256Schema,
    committed_at: ChallengeTimestampSchema,
    disclosed_at: ChallengeTimestampSchema,
    submitted_at: ChallengeTimestampSchema
  }).strict()
}).strict().superRefine((value, context) => {
  const commitmentDigest = value.commitment_receipt.commitment_digest
  const disclosureDigest = value.disclosure.disclosure_digest
  const artifactBindings = [
    ['consumer_model_digest', 'model'],
    ['equation_set_digest', 'equationSet'],
    ['parameter_policy_digest', 'parameterPolicy'],
    ['solver_digest', 'solver'],
    ['prediction_artifact_digest', 'prediction']
  ]
  for (const [field, artifact] of artifactBindings) {
    if (value.frozen_commitment[field] !== value.artifact_refs[artifact].digest) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_refs', artifact, 'digest'], message: `Report ${artifact} artifact does not bind the frozen commitment.` })
    }
  }
  const commitmentIdentities = [
    value.disclosure.commitment_digest,
    value.submission.commitment_digest,
    value.independent_scoring.commitment_digest,
    value.producer_result.commitment_digest
  ]
  const disclosureIdentities = [
    value.submission.disclosure_digest,
    value.independent_scoring.disclosure_digest,
    value.producer_result.disclosure_digest
  ]
  if (commitmentIdentities.some((digest) => digest !== commitmentDigest)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['commitment_receipt', 'commitment_digest'], message: 'Report commitment identities differ.' })
  }
  if (disclosureIdentities.some((digest) => digest !== disclosureDigest)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['disclosure', 'disclosure_digest'], message: 'Report disclosure identities differ.' })
  }
  if (
    value.commitment_receipt.created_at !== value.frozen_commitment.created_at ||
    value.commitment_receipt.partition_digest !== value.frozen_commitment.partition_digest ||
    JSON.stringify(value.submission.frozen_commitment) !== JSON.stringify(value.frozen_commitment)
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['frozen_commitment'], message: 'Report workflow does not bind the exact frozen commitment.' })
  }
  if (
    value.submission.software_digest !== value.artifact_refs.software.digest ||
    value.producer_result.software_digest !== value.artifact_refs.software.digest ||
    value.submission.diagnostics_digest !== value.artifact_refs.diagnostics.digest ||
    value.producer_result.diagnostics_digest !== value.artifact_refs.diagnostics.digest
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_refs'], message: 'Report software or diagnostics identities differ.' })
  }
  if (
    value.lineage.public_lineage_artifact_digest !== value.artifact_refs.publicLineage.digest ||
    value.lineage.concentration_mapping_artifact_digest !== value.artifact_refs.concentrationMapping.digest
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lineage'], message: 'Report lineage artifact identities differ.' })
  }
  if (
    value.lineage.committed_at !== value.commitment_receipt.committed_at ||
    value.lineage.disclosed_at !== value.disclosure.disclosed_at ||
    value.lineage.submitted_at !== value.producer_result.submitted_at ||
    value.submission.submitted_conclusion !== value.producer_result.conclusion ||
    value.independent_scoring.conclusion !== value.producer_result.conclusion
  ) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['lineage'], message: 'Report timestamps or conclusion identities differ.' })
  }
  value.endpoint_diagnostics.forEach((diagnostic, index) => {
    if (
      diagnostic.status !== value.submission.endpoint_results[index].diagnostic_status ||
      diagnostic.status !== value.independent_scoring.endpoint_results[index].diagnostic_status ||
      diagnostic.status !== value.producer_result.endpoint_results[index].diagnostic_status
    ) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['endpoint_diagnostics', index, 'status'], message: 'Report endpoint diagnostic identities differ.' })
    }
  })
})
const ChallengeRunsSchema = z.object({
  items: z.array(z.object({
    commitment_digest: ChallengeSha256Schema,
    nonce: z.string().min(16).max(128),
    created_at: ChallengeTimestampSchema,
    committed_at: ChallengeTimestampSchema,
    disclosure_digest: ChallengeSha256Schema.nullable(),
    disclosed_at: ChallengeTimestampSchema.nullable(),
    result_digest: ChallengeSha256Schema.nullable(),
    submitted_at: ChallengeTimestampSchema.nullable()
  }).strict()).max(50),
  limit: z.number().int().min(1).max(50)
}).strict()
const ChallengeReplaySchema = z.object({
  verification: z.literal('pass'),
  network_access: z.literal(false),
  rerun: z.object({
    artifactRefs: ChallengeArtifactRefsSchema,
    conclusion: z.enum(['failed', 'not-evaluable', 'supported-within-boundary'])
  }).strict(),
  report: ChallengeReportSchema
}).strict().superRefine((value, context) => {
  if (JSON.stringify(value.rerun.artifactRefs) !== JSON.stringify(value.report.artifact_refs) || value.rerun.conclusion !== value.report.independent_scoring.conclusion) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['rerun'], message: 'Challenge replay does not bind the stored report artifacts and conclusion.' })
  }
})
const ChallengeArtifactSchema = z.object({
  artifactDigest: ChallengeSha256Schema,
  kind: z.enum(['model', 'equation-set', 'parameter-policy', 'concentration-mapping', 'solver', 'software', 'diagnostics', 'prediction', 'public-lineage']),
  bytes: z.number().int().positive(),
  content: z.unknown()
}).strict()
const ChallengeIntegritySchema = z.object({
  status: z.enum(['empty', 'valid', 'failed']),
  artifacts: z.number().int().nonnegative().optional(),
  commitments: z.number().int().nonnegative().optional(),
  disclosureEpochs: z.number().int().nonnegative().optional(),
  disclosures: z.number().int().nonnegative().optional(),
  reports: z.number().int().nonnegative().optional(),
  findings: z.array(z.string()).optional()
}).strict()

function queryString(values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  return query.toString()
}

function verifyAtlasEnvelope(payload, release) {
  if (payload.releaseId !== release.id || payload.releaseDigest !== release.digest) {
    throw new Error('Atlas response does not match the independently verified release and digest.')
  }
  return payload
}

function verifyEvidenceEnvelope(payload, release) {
  if (payload.release.id !== release.id || payload.release.digest !== release.digest) {
    throw new Error('Evidence response does not match the independently verified release and digest.')
  }
  return payload
}

export async function loadWorkspace(taxonId, signal) {
  const releasesPayload = await requestJson('/api/v1/releases', withSignal(signal))
  const releases = ReleaseSchema.array().parse(releasesPayload)
  const release = releases[0]
  if (!release) throw new Error('No verified biochemical knowledge release is available.')
  const [modelPayload, networkPayload] = await Promise.all([
    requestJson('/api/v1/models/one-carbon', withSignal(signal)),
    requestJson(`/api/v1/releases/${encodeURIComponent(release.id)}/network?taxon_id=${taxonId}`, withSignal(signal))
  ])
  return { release, model: ModelSchema.parse(modelPayload), network: NetworkSchema.parse(networkPayload) }
}

export async function loadNetwork(releaseId, taxonId, signal) {
  return NetworkSchema.parse(await requestJson(`/api/v1/releases/${encodeURIComponent(releaseId)}/network?taxon_id=${taxonId}`, withSignal(signal)))
}

export async function loadProvenance(release, signal) {
  const provenance = ProvenanceSchema.parse(await requestJson(`/api/v1/releases/${encodeURIComponent(release.id)}/provenance`, withSignal(signal)))
  if (provenance.releaseId !== release.id || provenance.releaseDigest !== release.digest) {
    throw new Error('Build provenance does not match the verified release and digest.')
  }
  return provenance
}

export async function runSimulation(input) {
  return SimulationResultSchema.parse(await requestJson('/api/v1/models/one-carbon/simulations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  }))
}

export async function loadPortfolioModels(signal) {
  return PortfolioModelSchema.array().parse(await requestJson('/api/v2/models', withSignal(signal)))
}

export async function runPortfolioExperiment(input, signal) {
  const experiment = ExperimentSchema.parse(input)
  return RunRecordSchema.parse(await requestJson('/api/v2/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ experiment }),
    ...withSignal(signal)
  }))
}

export async function loadParameterOptions(signal) {
  return ParameterOptionsResponseSchema.parse(await requestJson('/api/v2/parameter-options', withSignal(signal)))
}

export async function runParameterStudy(input, signal) {
  const request = StudyRequestSchema.parse(input)
  return StudyRecordSchema.parse(await requestJson('/api/v2/studies', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadApapWorkspace(signal) {
  const base = `/api/v4/apap/releases/${encodeURIComponent(APAP_RELEASE_ID)}`
  const [discovery, detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix] = await Promise.all([
    requestJson('/api/v4/apap', withSignal(signal)).then((payload) => ApapDiscoverySchema.parse(payload)),
    requestJson(base, withSignal(signal)).then((payload) => UpstreamApapDetailSchema.parse(payload)),
    requestJson(`${base}/contexts`, withSignal(signal)).then((payload) => UpstreamApapContextsSchema.parse(payload)),
    requestJson(`${base}/parameters`, withSignal(signal)).then((payload) => UpstreamApapParametersSchema.parse(payload)),
    requestJson(`${base}/protocols`, withSignal(signal)).then((payload) => UpstreamApapProtocolsSchema.parse(payload)),
    requestJson(`${base}/observations`, withSignal(signal)).then((payload) => UpstreamApapObservationsSchema.parse(payload)),
    requestJson(`${base}/assumptions`, withSignal(signal)).then((payload) => UpstreamApapAssumptionsSchema.parse(payload)),
    requestJson(`${base}/limitations`, withSignal(signal)).then((payload) => UpstreamApapLimitationsSchema.parse(payload)),
    requestJson(`${base}/validation-matrix`, withSignal(signal)).then((payload) => UpstreamApapValidationSchema.parse(payload))
  ])
  const envelopes = [detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix]
  if (discovery.releaseId !== detail.release.id || discovery.releaseDigest !== detail.release.digest || envelopes.some((item) => item.release.id !== detail.release.id || item.release.digest !== detail.release.digest)) {
    throw new Error('APAP responses do not match the independently pinned release and digest.')
  }
  return { discovery, detail, contexts: contexts.items, parameters: parameters.items, protocols: protocols.items, observations: observations.items, assumptions: assumptions.items, limitations: limitations.items, validationMatrix: validationMatrix.items }
}

export async function runApapBenchmark(input, signal) {
  const request = ApapRunRequestSchema.parse(input)
  return ApapRunRecordSchema.parse(await requestJson('/api/v4/apap/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadDerivedHealth(signal) {
  return DerivedHealthSchema.parse(await requestJson('/api/v6/derived/health', withSignal(signal)))
}

export async function loadDerivedAssertions(filters = {}, signal) {
  const query = queryString(filters)
  return AssertionListSchema.parse(await requestJson(`/api/v6/derived/assertions${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadReviewedDerivedAssertions(filters = {}, signal) {
  const query = queryString(filters)
  return AssertionListSchema.parse(await requestJson(`/api/v6/derived/reviewed-assertions${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadDerivedAssertion(assertionDigest, signal) {
  return AssertionDetailSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}`, withSignal(signal)))
}

export async function loadDerivedEvents(assertionDigest, signal) {
  return AssertionEventsSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events`, withSignal(signal)))
}

export async function loadDerivedBundle(bundleDigest, signal) {
  return BundleDetailSchema.parse(await requestJson(`/api/v6/derived/bundles/${encodeURIComponent(bundleDigest)}`, withSignal(signal)))
}

export async function submitApapDerivedBundle(runId, signal) {
  return BundleSubmitResponseSchema.parse(await requestJson(`/api/v6/derived/apap-runs/${encodeURIComponent(runId)}/bundles`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: '{}',
    ...withSignal(signal)
  }))
}

export async function appendDerivedReviewEvent(assertionDigest, input, signal) {
  const request = ReviewEventRequestSchema.parse(input)
  return EventAppendResponseSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function reproduceDerivedAssertion(assertionDigest, input, signal) {
  const request = ReproduceRequestSchema.parse(input)
  return EventAppendResponseSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/reproduce`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function queryDerivedLayers(input, signal) {
  const request = LayeredQuerySchema.parse(input)
  return LayeredQueryResponseSchema.parse(await requestJson('/api/v6/derived/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function queryDerivedImpact(input, signal) {
  const request = ImpactRequestSchema.parse(input)
  return ImpactResponseSchema.parse(await requestJson('/api/v6/derived/impact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function compareDerivedMeasurement(input, signal) {
  const request = MeasurementComparisonRequestSchema.parse(input)
  return MeasurementComparisonResponseSchema.parse(await requestJson('/api/v6/derived/measurements/compare', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

function verifySpatialEnvelope(payload) {
  if (payload.release.id !== SPATIAL_RELEASE_ID || payload.release.digest !== SPATIAL_RELEASE_DIGEST) throw new Error('Spatial response does not match the independently pinned release and digest.')
  return payload
}

export async function loadSpatialContent(assetId, contentId, signal) {
  const asset = SpatialAssetIdSchema.parse(assetId)
  const content = SpatialContentIdSchema.parse(contentId)
  const response = await fetch(`/api/v5/spatial/releases/${encodeURIComponent(SPATIAL_RELEASE_ID)}/assets/${encodeURIComponent(asset)}/content/${encodeURIComponent(content)}`, withSignal(signal))
  if (!response.ok) throw new Error(`Spatial content request failed with status ${response.status}`)
  if (response.headers.get('x-release-digest') !== SPATIAL_RELEASE_DIGEST) throw new Error('Spatial content does not match the pinned release digest.')
  return response.text()
}

export async function loadSpatialWorkspace(taxonId, signal, projectedCellPixels = 5) {
  const base = `/api/v5/spatial/releases/${encodeURIComponent(SPATIAL_RELEASE_ID)}`
  const query = `?taxon_id=${encodeURIComponent(taxonId)}`
  const [discovery, catalog, detail, structures, spaces, transforms, assets, descriptors, mappings, inventory] = await Promise.all([
    requestJson('/api/v5/spatial', withSignal(signal)).then((payload) => SpatialDiscoverySchema.parse(payload)),
    requestJson('/api/v5/spatial/releases', withSignal(signal)).then((payload) => SpatialCatalogSchema.parse(payload)),
    requestJson(base, withSignal(signal)).then((payload) => SpatialDetailSchema.parse(payload)),
    requestJson(`${base}/structures${query}`, withSignal(signal)).then((payload) => SpatialStructuresSchema.parse(payload)),
    requestJson(`${base}/spaces${query}`, withSignal(signal)).then((payload) => SpatialSpacesSchema.parse(payload)),
    requestJson(`${base}/transforms${query}`, withSignal(signal)).then((payload) => SpatialTransformsSchema.parse(payload)),
    requestJson(`${base}/assets${query}`, withSignal(signal)).then((payload) => SpatialAssetsSchema.parse(payload)),
    requestJson(`${base}/descriptors`, withSignal(signal)).then((payload) => SpatialDescriptorsSchema.parse(payload)),
    requestJson(`${base}/mappings`, withSignal(signal)).then((payload) => SpatialMappingsSchema.parse(payload)),
    requestJson(`${base}/inventory`, withSignal(signal)).then((payload) => SpatialInventorySchema.parse(payload))
  ])
  const envelopes = [structures, spaces, transforms, assets, descriptors, mappings, inventory]
  if (discovery.releaseDigest !== SPATIAL_RELEASE_DIGEST || catalog.releases[0]?.release_digest !== SPATIAL_RELEASE_DIGEST || detail.release.digest !== SPATIAL_RELEASE_DIGEST || envelopes.some((payload) => verifySpatialEnvelope(payload) !== payload)) {
    throw new Error('Spatial metadata does not match the independently pinned release and digest.')
  }
  const instanceAsset = assets.items.find((asset) => asset.asset_type === 'instances')
  const instanceItem = inventory.items.find((item) => item.asset_id === instanceAsset?.id && item.role === 'instances')
  const fieldAsset = assets.items.find((asset) => asset.asset_type === 'scalar-field')
  const fieldDescriptor = descriptors.items.find((descriptor) => descriptor.asset_id === fieldAsset?.id)
  if (!instanceAsset || !instanceItem || !fieldAsset || !fieldDescriptor) throw new Error('Pinned spatial instance or field content is unavailable for this taxon.')
  const fieldLevel = selectLod(fieldDescriptor.levels, projectedCellPixels)
  const [instanceContent, fieldContent] = await Promise.all([
    loadSpatialContent(instanceAsset.id, instanceItem.id, signal),
    loadSpatialContent(fieldAsset.id, fieldLevel.content_id, signal)
  ])
  return { discovery, catalog, detail, structures: structures.items, spaces: spaces.items, transforms: transforms.items, assets: assets.items, descriptors: descriptors.items, mappings: mappings.items, inventory: inventory.items, instanceContent, fieldContent, fieldLevel }
}

export async function loadAtlasWorkspace(taxonId, signal) {
  const releases = AtlasReleaseSchema.array().parse(await requestJson('/api/v2/releases', withSignal(signal)))
  const release = releases[0]
  if (!release) throw new Error('No verified contextual atlas release is available.')
  const base = `/api/v2/releases/${encodeURIComponent(release.id)}`
  const [detail, network, claims, coverage] = await Promise.all([
    requestJson(base, withSignal(signal)).then((payload) => AtlasReleaseDetailSchema.parse(payload)),
    requestJson(`${base}/network?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasNetworkSchema.parse(payload)),
    requestJson(`${base}/claims?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasClaimsResponseSchema.parse(payload)),
    requestJson(`${base}/coverage?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasCoverageResponseSchema.parse(payload))
  ])
  if (detail.release.id !== release.id || detail.release.digest !== release.digest) {
    throw new Error('Atlas manifest does not match the independently verified release and digest.')
  }
  const verifiedNetwork = verifyAtlasEnvelope(network, release)
  const includedEntities = [...verifiedNetwork.entities]
  if (taxonId === 9606 && !includedEntities.some((entity) => entity.id === 'UniProtKB:P42898-2')) {
    const isoformPayload = AtlasEntityResponseSchema.parse(await requestJson(
      `${base}/entities/${encodeURIComponent('UniProtKB:P42898-2')}?${queryString({ taxon_id: taxonId })}`,
      withSignal(signal)
    ))
    includedEntities.push(verifyAtlasEnvelope(isoformPayload, release).entity)
  }
  return {
    release,
    detail,
    network: verifiedNetwork,
    includedEntities,
    claims: verifyAtlasEnvelope(claims, release),
    coverage: verifyAtlasEnvelope(coverage, release)
  }
}

export async function loadAtlasEntity(release, entityId, taxonId, signal) {
  const query = queryString({ taxon_id: taxonId })
  const payload = AtlasEntityResponseSchema.parse(await requestJson(
    `/api/v2/releases/${encodeURIComponent(release.id)}/entities/${encodeURIComponent(entityId)}?${query}`,
    withSignal(signal)
  ))
  return verifyAtlasEnvelope(payload, release)
}

export async function loadAtlasSubgraph(release, rootId, taxonId, maxDepth, maxNodes, signal) {
  const query = queryString({ root_id: rootId, taxon_id: taxonId, max_depth: maxDepth, max_nodes: maxNodes })
  const payload = AtlasSubgraphSchema.parse(await requestJson(
    `/api/v2/releases/${encodeURIComponent(release.id)}/subgraph?${query}`,
    withSignal(signal)
  ))
  return verifyAtlasEnvelope(payload, release)
}

export async function loadEvidenceHealth(signal) {
  return EvidenceHealthSchema.parse(await requestJson('/api/v3/evidence/health', withSignal(signal)))
}

export async function searchEvidence(release, input, signal) {
  const request = EvidenceSearchRequestSchema.parse(input)
  const payload = EvidenceSearchResponseSchema.parse(await requestJson('/api/v3/evidence/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceDocument(release, identifier, signal) {
  const payload = EvidenceDocumentResponseSchema.parse(await requestJson(`/api/v3/evidence/documents/${encodeURIComponent(identifier)}`, withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}

export async function extractEvidenceCandidate(release, input, signal) {
  const request = EvidenceCandidateExtractionRequestSchema.parse(input)
  const payload = EvidenceCandidateResponseSchema.parse(await requestJson('/api/v3/evidence/candidates/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceCandidates(release, signal) {
  const payload = EvidenceCandidateListResponseSchema.parse(await requestJson('/api/v3/evidence/candidates', withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceCandidate(release, candidateId, signal) {
  const payload = EvidenceCandidateResponseSchema.parse(await requestJson(`/api/v3/evidence/candidates/${encodeURIComponent(candidateId)}`, withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadWorkspaceResourceProfiles(signal) {
  return ResourceProfileSchema.array().parse(await requestJson('/api/v7/workspace/resource-profiles', withSignal(signal)))
}

export async function loadWorkspaceExperiments(signal) {
  return ExperimentRecordSchema.array().parse(await requestJson('/api/v7/workspace/experiments', withSignal(signal)))
}

export async function createWorkspaceExperiment(input, signal) {
  const request = ExperimentCreateRequestSchema.parse(input)
  return ExperimentDetailSchema.parse(await requestJson('/api/v7/workspace/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceExperiment(experimentId, signal) {
  return ExperimentDetailSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}`, withSignal(signal)))
}

export async function createWorkspaceRevision(experimentId, input, signal) {
  const request = RevisionCreateRequestSchema.parse(input)
  return RevisionRecordSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/revisions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function cloneWorkspaceExperiment(experimentId, name, signal) {
  return ExperimentDetailSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/clone`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(name ? { name } : {}),
    ...withSignal(signal)
  }))
}

export async function queueWorkspaceRun(revisionId, resourceProfileId, signal) {
  return AttemptRecordSchema.parse(await requestJson('/api/v7/workspace/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ revisionId, ...(resourceProfileId ? { resourceProfileId } : {}) }),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceHistory(filters = {}, signal) {
  const query = queryString(filters)
  return HistoryResponseSchema.parse(await requestJson(`/api/v7/workspace/runs${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadWorkspaceAttempt(attemptId, signal) {
  return AttemptDetailSchema.parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}`, withSignal(signal)))
}

export async function loadWorkspaceEvents(attemptId, signal) {
  return WorkspaceEventSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/events`, withSignal(signal)))
}

export async function cancelWorkspaceAttempt(attemptId, signal) {
  return AttemptRecordSchema.parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/cancel`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' }, ...withSignal(signal) }))
}

export async function loadWorkspaceCheckpoints(attemptId, signal) {
  return SpecificationCheckpointSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/checkpoints`, withSignal(signal)))
}

export async function restartWorkspaceCheckpoint(checkpointId, resourceProfileId, signal) {
  return AttemptRecordSchema.parse(await requestJson(`/api/v7/workspace/checkpoints/${encodeURIComponent(checkpointId)}/restart`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(resourceProfileId ? { resourceProfileId } : {}),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceArtifacts(attemptId, signal) {
  return ArtifactRecordSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/artifacts`, withSignal(signal)))
}

export async function compareWorkspaceAttempts(input, signal) {
  const request = ComparisonRequestSchema.parse(input)
  return ComparisonRecordSchema.parse(await requestJson('/api/v7/workspace/comparisons', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function createWorkspaceReport(attemptId, signal) {
  return ReportRecordSchema.parse(await requestJson('/api/v7/workspace/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ attemptId }),
    ...withSignal(signal)
  }))
}

export async function exportWorkspaceExperiment(experimentId, signal) {
  return BundleExportResponseSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/export`, withSignal(signal)))
}

export async function importWorkspaceExperiment(bundleBase64, signal) {
  return ExperimentDetailSchema.parse(await requestJson('/api/v7/workspace/experiments/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bundleBase64 }),
    ...withSignal(signal)
  }))
}

export async function loadPhysiologyWorkbench(signal) {
  const [discovery, evidence, packages, trust, coverage, couplings, runs] = await Promise.all([
    requestJson('/api/v8/physiology', withSignal(signal)).then((payload) => PhysiologyDiscoverySchema.parse(payload)),
    requestJson('/api/v8/physiology/evidence', withSignal(signal)).then((payload) => PhysiologyEvidenceSchema.parse(payload)),
    requestJson('/api/v8/physiology/packages', withSignal(signal)).then((payload) => PhysiologyPackageSchema.array().parse(payload)),
    requestJson('/api/v8/physiology/trust', withSignal(signal)).then((payload) => TrustKeySchema.array().parse(payload)),
    requestJson('/api/v8/physiology/coverage', withSignal(signal)).then((payload) => PhysiologyCoverageMatrixSchema.parse(payload)),
    requestJson('/api/v8/physiology/couplings', withSignal(signal)).then((payload) => PhysiologyCouplingSchema.array().parse(payload)),
    requestJson('/api/v8/physiology/runs', withSignal(signal)).then((payload) => PhysiologyRunSchema.array().parse(payload))
  ])
  if (discovery.releaseId !== evidence.release.id || discovery.releaseDigest !== evidence.release.digest || coverage.release.digest !== evidence.release.digest) throw new Error('Physiology responses do not match the independently pinned evidence release and digest.')
  return { discovery, evidence, packages, trust, coverage, couplings, runs }
}

export async function validatePhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return PackageValidationResponseSchema.parse(await requestJson('/api/v8/physiology/packages/validate', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function installPhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return PhysiologyPackageSchema.parse(await requestJson('/api/v8/physiology/packages/install', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function runPhysiologyConformance(packageDigest, signal) {
  return ConformanceResultSchema.parse(await requestJson(`/api/v8/physiology/packages/${encodeURIComponent(packageDigest)}/conformance`, {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: '{}',
    ...withSignal(signal)
  }))
}

export async function createPhysiologyCoupling(input, signal) {
  const request = CouplingCreateRequestSchema.parse(input)
  return PhysiologyCouplingSchema.parse(await requestJson('/api/v8/physiology/couplings', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function runPhysiologyCoupling(couplingDigest, signal) {
  const request = PhysiologyRunRequestSchema.parse({ couplingDigest })
  return PhysiologyRunSchema.parse(await requestJson('/api/v8/physiology/runs', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadDataPlaneDiscovery(signal) {
  return DataPlaneDiscoverySchema.parse(await requestJson('/api/v9/data-plane', withSignal(signal)))
}

export async function loadDataPlaneStatus(signal) {
  return DataPlaneStatusSchema.parse(await requestJson('/api/v9/data-plane/status', withSignal(signal)))
}

export async function syncDataPlane(signal) {
  return DataPlaneStatusSchema.parse(await requestJson('/api/v9/data-plane/sync', {
    method: 'POST',
    headers: dataPlaneMutationHeaders,
    body: '{}',
    ...withSignal(signal)
  }))
}

export async function loadDataPlaneReleases(signal) {
  return DataPlaneReleaseListSchema.parse(await requestJson('/api/v9/data-plane/releases', withSignal(signal)))
}

export async function loadDataPlaneRelease(releaseId, signal) {
  return DataPlaneReleaseDetailSchema.parse(await requestJson(`/api/v9/data-plane/releases/${encodeURIComponent(releaseId)}`, withSignal(signal)))
}

export async function loadDataPlanePage(releaseId, recordType, query = {}, signal) {
  const encoded = queryString(query)
  return DataPlaneLocalPageSchema.parse(await requestJson(`/api/v9/data-plane/releases/${encodeURIComponent(releaseId)}/pages/${encodeURIComponent(recordType)}${encoded ? `?${encoded}` : ''}`, withSignal(signal)))
}

export async function loadDataPlaneRecord(releaseId, recordType, recordId, signal) {
  return DataPlaneLocalRecordSchema.parse(await requestJson(`/api/v9/data-plane/releases/${encodeURIComponent(releaseId)}/records/${encodeURIComponent(recordType)}/${encodeURIComponent(recordId)}`, withSignal(signal)))
}

export async function loadDataPlaneDiff(baseReleaseId, candidateReleaseId, signal) {
  const query = queryString({ base_release_id: baseReleaseId, candidate_release_id: candidateReleaseId })
  return FactorySemanticDiffSchema.parse(await requestJson(`/api/v9/data-plane/diff?${query}`, withSignal(signal)))
}

export async function loadDataPlaneIntegrity(signal) {
  return DataPlaneIntegritySchema.parse(await requestJson('/api/v9/data-plane/integrity', withSignal(signal)))
}

export async function runAuthorityClosureAudit(input, signal) {
  const request = AuthorityClosureAuditRequestSchema.parse(input)
  return AuthorityClosureAuditReportSchema.parse(await requestJson('/api/v9/data-plane/audits', {
    method: 'POST',
    headers: dataPlaneMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadAuthorityClosureAudits(signal) {
  return AuthorityClosureAuditListSchema.parse(await requestJson('/api/v9/data-plane/audits', withSignal(signal)))
}

export async function loadAuthorityClosureAudit(reportDigest, signal) {
  return AuthorityClosureAuditReportSchema.parse(await requestJson(`/api/v9/data-plane/audits/${encodeURIComponent(reportDigest)}`, withSignal(signal)))
}

export async function loadMeasuredDiscovery(signal) {
  return MeasuredLocalDiscoverySchema.parse(await requestJson('/api/v10/measured', withSignal(signal)))
}

export async function loadMeasuredStatus(signal) {
  return MeasuredStatusSchema.parse(await requestJson('/api/v10/measured/status', withSignal(signal)))
}

export async function syncMeasured(signal) {
  return MeasuredStatusSchema.parse(await requestJson('/api/v10/measured/sync', {
    method: 'POST', headers: measuredMutationHeaders, body: '{}', ...withSignal(signal)
  }))
}

export async function loadMeasuredPage(recordType, query = {}, signal) {
  const encoded = queryString(query)
  return MeasuredLocalPageSchema.parse(await requestJson(`/api/v10/measured/pages/${encodeURIComponent(recordType)}${encoded ? `?${encoded}` : ''}`, withSignal(signal)))
}

export async function loadMeasuredLineage(measurementId, signal) {
  return MeasuredLocalLineageResponseSchema.parse(await requestJson(`/api/v10/measured/lineages/${encodeURIComponent(measurementId)}`, withSignal(signal)))
}

export async function runMeasuredCalibration(input, signal) {
  const request = CalibrationRequestSchema.parse(input)
  return CalibrationArtifactSchema.parse(await requestJson('/api/v10/measured/calibrations', {
    method: 'POST', headers: measuredMutationHeaders, body: JSON.stringify(request), ...withSignal(signal)
  }))
}

async function protectedMeasuredRequest(path, body, schema, signal) {
  const response = await fetch(path, { method: 'POST', headers: measuredMutationHeaders, body: JSON.stringify(body), ...withSignal(signal) })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    throw new ApiError(message, { status: response.status, code: payload?.code ?? 'HTTP_ERROR', payload })
  }
  if (response.headers.get('cache-control') !== 'private, no-store') throw new ApiError('Protected measured response did not preserve the required no-store policy.', { status: response.status, code: 'MEASURED_CACHE_POLICY_INVALID', payload: null })
  return { value: schema.parse(payload), cacheControl: response.headers.get('cache-control') }
}

export async function freezeMeasuredCommitment(input, signal) {
  const request = FreezeIntentSchema.parse(input)
  return protectedMeasuredRequest('/api/v10/measured/commitments', request, FreezeResponseSchema, signal)
}

export async function discloseMeasuredEvaluation(input, signal) {
  const request = DisclosureIntentSchema.parse(input)
  return protectedMeasuredRequest('/api/v10/measured/evaluation', request, EvaluationResponseSchema, signal)
}

async function measuredSpatialJsonRequest(path, { init, schema, immutable = false } = {}) {
  let response
  try {
    response = await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
    throw new ApiError(message, { status: response.status, code, payload })
  }
  if (immutable) {
    if (response.headers.get('cache-control') !== 'public, max-age=31536000, immutable' || response.headers.get('x-release-id') !== MEASURED_SPATIAL_PINS.releaseId || response.headers.get('x-release-digest') !== MEASURED_SPATIAL_PINS.releaseDigest) throw new ApiError('Goal 14 metadata did not preserve the exact release-bound immutable cache identity.', { status: response.status, code: 'MEASURED_SPATIAL_CACHE_POLICY_INVALID', payload: null })
  } else if (response.headers.get('cache-control') !== 'no-store' || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')) {
    throw new ApiError('Goal 14 mutable status did not preserve the required no-store policy.', { status: response.status, code: 'MEASURED_SPATIAL_CACHE_POLICY_INVALID', payload: null })
  }
  return schema.parse(payload)
}

export async function loadMeasuredSpatialDiscovery(signal) {
  return measuredSpatialJsonRequest('/api/v12/measured-spatial', { init: withSignal(signal), schema: MeasuredSpatialDiscoverySchema })
}

export async function loadMeasuredSpatialStatus(signal) {
  return measuredSpatialJsonRequest('/api/v12/measured-spatial/status', { init: withSignal(signal), schema: MeasuredSpatialStatusSchema })
}

export async function syncMeasuredSpatial(signal) {
  return measuredSpatialJsonRequest('/api/v12/measured-spatial/sync', {
    init: { method: 'POST', headers: measuredSpatialMutationHeaders, body: '{}', ...withSignal(signal) },
    schema: MeasuredSpatialStatusSchema
  })
}

export async function loadMeasuredSpatialRecords(recordType, signal) {
  if (!MEASURED_SPATIAL_RECORD_TYPES.includes(recordType)) throw new TypeError(`Unknown measured-spatial record type: ${recordType}.`)
  const page = await measuredSpatialJsonRequest(`/api/v12/measured-spatial/records/${encodeURIComponent(recordType)}`, { init: withSignal(signal), schema: MeasuredSpatialLocalRecordPageSchema, immutable: true })
  return { ...page, items: page.items.map((item) => MEASURED_SPATIAL_RECORD_SCHEMAS[recordType].parse(item)) }
}

export async function loadMeasuredSpatialWorkspace(signal) {
  const pages = await Promise.all(MEASURED_SPATIAL_RECORD_TYPES.map((recordType) => loadMeasuredSpatialRecords(recordType, signal)))
  return Object.fromEntries(pages.map((page) => [page.recordType, page.items]))
}

export async function loadMeasuredSpatialChunkInventory(arrayId, level, signal) {
  const items = []
  let offset = 0
  let total = 1
  while (offset < total) {
    const query = queryString({ array_id: arrayId, level, offset, limit: 100 })
    const page = await measuredSpatialJsonRequest(`/api/v12/measured-spatial/chunks?${query}`, { init: withSignal(signal), schema: MeasuredSpatialLocalChunkPageSchema, immutable: true })
    if (page.arrayId !== arrayId || page.level !== level || page.offset !== offset) throw new ApiError('Goal 14 chunk inventory page does not bind the selected array, level, and offset.', { status: 409, code: 'MEASURED_SPATIAL_IDENTITY_MISMATCH', payload: page })
    items.push(...page.items)
    total = page.total
    offset += page.items.length
    if (page.items.length === 0 && offset < total) throw new ApiError('Goal 14 chunk inventory ended before its declared total.', { status: 409, code: 'MEASURED_SPATIAL_INVENTORY_INCOMPLETE', payload: page })
  }
  return items
}

async function browserSha256(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function browserGunzip(encoded) {
  if (typeof DecompressionStream !== 'function') throw new ApiError('This browser cannot verify the pinned gzip chunk codec.', { status: 0, code: 'MEASURED_SPATIAL_CODEC_UNAVAILABLE', payload: null })
  const stream = new Blob([encoded]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function loadMeasuredSpatialChunk(input, signal) {
  const descriptor = MeasuredSpatialChunkSchema.parse(input)
  const [z, y, x] = descriptor.grid_zyx
  const path = `/api/v12/measured-spatial/chunks/${encodeURIComponent(descriptor.array_id)}/${descriptor.level}/${z}/${y}/${x}`
  let response
  try {
    response = await fetch(path, { cache: 'reload', ...withSignal(signal) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(payload?.message ?? `Goal 14 chunk request failed with status ${response.status}.`, { status: response.status, code: payload?.code ?? 'HTTP_ERROR', payload })
  }
  const headers = response.headers
  if (headers.get('cache-control') !== 'public, max-age=31536000, immutable' || headers.get('accept-ranges') !== 'none' || headers.get('content-type') !== descriptor.media_type || headers.get('content-length') !== String(descriptor.encoded_bytes) || headers.get('etag') !== `"sha256:${descriptor.encoded_sha256}"` || headers.get('x-content-sha256') !== descriptor.encoded_sha256 || headers.get('x-decoded-sha256') !== descriptor.decoded_sha256 || headers.get('x-release-id') !== MEASURED_SPATIAL_PINS.releaseId || headers.get('x-release-digest') !== MEASURED_SPATIAL_PINS.releaseDigest || headers.get('x-array-id') !== descriptor.array_id || headers.get('x-level') !== String(descriptor.level) || headers.get('x-chunk-grid') !== descriptor.grid_zyx.join('.')) throw new ApiError('Goal 14 chunk response does not bind the exact release, array, level, grid, codec, or digest identities.', { status: response.status, code: 'MEASURED_SPATIAL_IDENTITY_MISMATCH', payload: null })
  const encoded = new Uint8Array(await response.arrayBuffer())
  if (encoded.byteLength !== descriptor.encoded_bytes || await browserSha256(encoded) !== descriptor.encoded_sha256) throw new ApiError('Goal 14 encoded chunk hash verification failed.', { status: response.status, code: 'MEASURED_SPATIAL_ENCODED_HASH_FAILED', payload: null })
  const decoded = await browserGunzip(encoded)
  if (decoded.byteLength !== descriptor.decoded_bytes || await browserSha256(decoded) !== descriptor.decoded_sha256) throw new ApiError('Goal 14 decoded chunk hash verification failed.', { status: response.status, code: 'MEASURED_SPATIAL_DECODED_HASH_FAILED', payload: null })
  return { descriptor, encodedBytes: encoded.byteLength, decodedBytes: decoded.byteLength, cacheSource: headers.get('x-cache-source') }
}

export async function completeMeasuredSpatialOffline(signal) {
  return measuredSpatialJsonRequest('/api/v12/measured-spatial/offline-completion', {
    init: { method: 'POST', headers: measuredSpatialMutationHeaders, body: '{}', ...withSignal(signal) },
    schema: MeasuredSpatialOfflineCompletionSchema
  })
}

export async function verifyMeasuredSpatialIntegrity(signal) {
  return measuredSpatialJsonRequest('/api/v12/measured-spatial/integrity', { init: withSignal(signal), schema: MeasuredSpatialIntegritySchema })
}

async function spatialRegistrationJsonRequest(path, { init, schema, immutable = false } = {}) {
  let response
  try {
    response = await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
    throw new ApiError(message, { status: response.status, code, payload })
  }
  if (immutable) {
    if (response.headers.get('cache-control') !== 'public, max-age=31536000, immutable' || response.headers.get('link') !== SPATIAL_REGISTRATION_RIGHTS_LINK || response.headers.get('x-release-id') !== SPATIAL_REGISTRATION_PINS.releaseId || response.headers.get('x-release-digest') !== SPATIAL_REGISTRATION_PINS.releaseDigest) throw new ApiError('Goal 14 registration metadata did not preserve its release and rights identity.', { status: response.status, code: 'SPATIAL_REGISTRATION_CACHE_POLICY_INVALID', payload: null })
  } else if (response.headers.get('cache-control') !== 'no-store' || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')) {
    throw new ApiError('Goal 14 registration mutable response did not preserve the required no-store policy.', { status: response.status, code: 'SPATIAL_REGISTRATION_CACHE_POLICY_INVALID', payload: null })
  }
  return schema.parse(payload)
}

export async function loadSpatialRegistrationDiscovery(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration', { init: withSignal(signal), schema: SpatialRegistrationDiscoverySchema })
}

export async function loadSpatialRegistrationStatus(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/status', { init: withSignal(signal), schema: SpatialRegistrationStatusSchema })
}

export async function syncSpatialRegistration(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/sync', {
    init: { method: 'POST', headers: spatialRegistrationMutationHeaders, body: '{}', ...withSignal(signal) },
    schema: SpatialRegistrationStatusSchema
  })
}

export async function loadSpatialRegistrationRecords(recordType, signal) {
  if (!SPATIAL_REGISTRATION_RECORD_TYPES.includes(recordType)) throw new TypeError(`Unknown spatial-registration record type: ${recordType}.`)
  const page = await spatialRegistrationJsonRequest(`/api/v14/spatial-registration/records/${encodeURIComponent(recordType)}`, { init: withSignal(signal), schema: SpatialRegistrationLocalRecordPageSchema, immutable: true })
  return { ...page, items: page.items.map((item) => SPATIAL_REGISTRATION_RECORD_SCHEMAS[recordType].parse(item)) }
}

export async function loadSpatialRegistrationWorkspace(signal) {
  const pages = await Promise.all(SPATIAL_REGISTRATION_RECORD_TYPES.map((recordType) => loadSpatialRegistrationRecords(recordType, signal)))
  return Object.fromEntries(pages.map((page) => [page.recordType, page.items]))
}

export async function loadSpatialRegistrationChunkInventory(arrayId, signal) {
  const items = []
  let offset = 0
  let total = 1
  while (offset < total) {
    const query = queryString({ array_id: arrayId, offset, limit: 100 })
    const page = await spatialRegistrationJsonRequest(`/api/v14/spatial-registration/chunks?${query}`, { init: withSignal(signal), schema: SpatialRegistrationLocalChunkPageSchema, immutable: true })
    if (page.arrayId !== arrayId || page.offset !== offset) throw new ApiError('Goal 14 registration inventory does not bind the selected array and offset.', { status: 409, code: 'SPATIAL_REGISTRATION_IDENTITY_MISMATCH', payload: page })
    items.push(...page.items)
    total = page.total
    offset += page.items.length
    if (page.items.length === 0 && offset < total) throw new ApiError('Goal 14 registration inventory ended before its declared total.', { status: 409, code: 'SPATIAL_REGISTRATION_INVENTORY_INCOMPLETE', payload: page })
  }
  return items
}

async function browserSpatialRegistrationGunzip(encoded) {
  if (typeof DecompressionStream !== 'function') throw new ApiError('This browser cannot verify the pinned registration gzip codec.', { status: 0, code: 'SPATIAL_REGISTRATION_CODEC_UNAVAILABLE', payload: null })
  const stream = new Blob([encoded]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

export async function loadSpatialRegistrationChunk(input, signal) {
  const descriptor = SpatialRegistrationChunkSchema.parse(input)
  const [z, y, x] = descriptor.grid_zyx
  const path = `/api/v14/spatial-registration/chunks/${encodeURIComponent(descriptor.array_id)}/${z}/${y}/${x}`
  let response
  try {
    response = await fetch(path, { cache: 'reload', ...withSignal(signal) })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(payload?.message ?? `Goal 14 registration chunk request failed with status ${response.status}.`, { status: response.status, code: payload?.code ?? 'HTTP_ERROR', payload })
  }
  const headers = response.headers
  if (headers.get('cache-control') !== 'public, max-age=31536000, immutable' || headers.get('link') !== SPATIAL_REGISTRATION_RIGHTS_LINK || headers.get('accept-ranges') !== 'none' || headers.get('content-type') !== descriptor.media_type || headers.get('content-length') !== String(descriptor.encoded_bytes) || headers.get('etag') !== `"sha256:${descriptor.encoded_sha256}"` || headers.get('x-content-sha256') !== descriptor.encoded_sha256 || headers.get('x-decoded-sha256') !== descriptor.decoded_sha256 || headers.get('x-release-id') !== SPATIAL_REGISTRATION_PINS.releaseId || headers.get('x-release-digest') !== SPATIAL_REGISTRATION_PINS.releaseDigest || headers.get('x-array-id') !== descriptor.array_id || headers.get('x-level') !== '0' || headers.get('x-chunk-grid') !== descriptor.grid_zyx.join('.')) throw new ApiError('Goal 14 registration chunk response does not bind its release, rights, array, grid, codec, and digest identities.', { status: response.status, code: 'SPATIAL_REGISTRATION_IDENTITY_MISMATCH', payload: null })
  const encoded = new Uint8Array(await response.arrayBuffer())
  if (encoded.byteLength !== descriptor.encoded_bytes || await browserSha256(encoded) !== descriptor.encoded_sha256) throw new ApiError('Goal 14 registration encoded chunk hash verification failed.', { status: response.status, code: 'SPATIAL_REGISTRATION_ENCODED_HASH_FAILED', payload: null })
  const decoded = await browserSpatialRegistrationGunzip(encoded)
  if (decoded.byteLength !== descriptor.decoded_bytes || await browserSha256(decoded) !== descriptor.decoded_sha256) throw new ApiError('Goal 14 registration decoded chunk hash verification failed.', { status: response.status, code: 'SPATIAL_REGISTRATION_DECODED_HASH_FAILED', payload: null })
  return { descriptor, encodedBytes: encoded.byteLength, decodedBytes: decoded.byteLength, cacheSource: headers.get('x-cache-source') }
}

export async function recomputeSpatialRegistrationResidualOverlap(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/residual-overlap', {
    init: { method: 'POST', headers: spatialRegistrationMutationHeaders, body: '{}', ...withSignal(signal) },
    schema: SpatialRegistrationResidualOverlapResponseSchema
  })
}

export async function transformSpatialRegistrationPoint(input, signal) {
  const request = SpatialRegistrationTransformRequestSchema.parse(input)
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/transform', {
    init: { method: 'POST', headers: spatialRegistrationMutationHeaders, body: JSON.stringify(request), ...withSignal(signal) },
    schema: SpatialRegistrationTransformResponseSchema
  })
}

export async function completeSpatialRegistrationOffline(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/offline-completion', {
    init: { method: 'POST', headers: spatialRegistrationMutationHeaders, body: '{}', ...withSignal(signal) },
    schema: SpatialRegistrationOfflineResponseSchema
  })
}

export async function verifySpatialRegistrationIntegrity(signal) {
  return spatialRegistrationJsonRequest('/api/v14/spatial-registration/integrity', { init: withSignal(signal), schema: SpatialRegistrationIntegritySchema })
}

async function challengeRequest(path, init, schema) {
  let response
  try {
    response = await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  const payload = await response.json().catch(() => null)
  if (response.headers.get('cache-control') !== 'private, no-store' || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')) {
    throw new ApiError('Challenge response did not preserve the required private no-store policy.', { status: response.status, code: 'CHALLENGE_CACHE_POLICY_INVALID', payload: null })
  }
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
    throw new ApiError(message, { status: response.status, code, payload })
  }
  return schema.parse(payload)
}

function bindChallengeIdentity(condition, message) {
  if (!condition) throw new ApiError(message, { status: 200, code: 'CHALLENGE_IDENTITY_MISMATCH', payload: null })
}

export async function loadChallengeDiscovery(signal) {
  return challengeRequest('/api/v11/challenge', withSignal(signal), ChallengeDiscoverySchema)
}

export async function loadChallengeStatus(signal) {
  return challengeRequest('/api/v11/challenge/status', withSignal(signal), ChallengeStatusSchema)
}

export async function syncChallenge(signal) {
  return challengeRequest('/api/v11/challenge/sync', {
    method: 'POST', headers: challengeMutationHeaders, body: '{}', ...withSignal(signal)
  }, ChallengeStatusSchema)
}

export async function prepareChallengeCommitment(input, signal) {
  const request = ChallengeFreezeIntentSchema.parse(input)
  const prepared = await challengeRequest('/api/v11/challenge/commitments', {
    method: 'POST', headers: challengeMutationHeaders, body: JSON.stringify(request), ...withSignal(signal)
  }, ChallengeCommitmentViewSchema)
  bindChallengeIdentity(
    prepared.frozenCommitment.nonce === request.nonce && prepared.frozenCommitment.created_at === request.createdAt,
    'Challenge commitment does not bind the requested freeze intent.'
  )
  return prepared
}

export async function discloseChallengeCommitment(commitmentDigest, signal) {
  const request = ChallengeDisclosureIntentSchema.parse({ commitmentDigest })
  const report = await challengeRequest(`/api/v11/challenge/commitments/${encodeURIComponent(request.commitmentDigest)}/disclose`, {
    method: 'POST', headers: challengeMutationHeaders, body: JSON.stringify(request), ...withSignal(signal)
  }, ChallengeReportSchema)
  bindChallengeIdentity(report.commitment_receipt.commitment_digest === request.commitmentDigest, 'Challenge disclosure does not bind the requested commitment digest.')
  return report
}

export async function loadChallengeRuns(limit = 20, signal) {
  const parsedLimit = z.number().int().min(1).max(50).parse(limit)
  return challengeRequest(`/api/v11/challenge/runs?${queryString({ limit: parsedLimit })}`, {
    headers: challengeProtectedReadHeaders, ...withSignal(signal)
  }, ChallengeRunsSchema)
}

export async function loadChallengeReport(resultDigest, signal) {
  const digest = ChallengeSha256Schema.parse(resultDigest)
  const report = await challengeRequest(`/api/v11/challenge/reports/${encodeURIComponent(digest)}`, {
    headers: challengeProtectedReadHeaders, ...withSignal(signal)
  }, ChallengeReportSchema)
  bindChallengeIdentity(report.producer_result.result_digest === digest, 'Challenge report does not bind the requested result digest.')
  return report
}

export async function replayChallengeReport(resultDigest, signal) {
  const digest = ChallengeSha256Schema.parse(resultDigest)
  const replay = await challengeRequest(`/api/v11/challenge/reports/${encodeURIComponent(digest)}/replay`, {
    method: 'POST', headers: challengeMutationHeaders, body: '{}', ...withSignal(signal)
  }, ChallengeReplaySchema)
  bindChallengeIdentity(replay.report.producer_result.result_digest === digest, 'Challenge replay does not bind the requested result digest.')
  return replay
}

export async function loadChallengeArtifact(artifactDigest, signal) {
  const digest = ChallengeSha256Schema.parse(artifactDigest)
  const artifact = await challengeRequest(`/api/v11/challenge/artifacts/${encodeURIComponent(digest)}`, {
    headers: challengeProtectedReadHeaders, ...withSignal(signal)
  }, ChallengeArtifactSchema)
  bindChallengeIdentity(artifact.artifactDigest === digest, 'Challenge artifact does not bind the requested digest.')
  return artifact
}

export async function verifyChallengeIntegrity(signal) {
  return challengeRequest('/api/v11/challenge/integrity', {
    headers: challengeProtectedReadHeaders, ...withSignal(signal)
  }, ChallengeIntegritySchema)
}

async function revalidationRequest(path, init, schema) {
  let response
  try {
    response = await fetch(path, init)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(error instanceof Error ? error.message : 'Network request failed.', { status: 0, code: 'NETWORK_ERROR', payload: null })
  }
  const payload = await response.json().catch(() => null)
  if (response.headers.get('cache-control') !== 'no-store' || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')) throw new ApiError('Goal 15 response did not preserve the required no-store policy.', { status: response.status, code: 'REVALIDATION_CACHE_POLICY_INVALID', payload: null })
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    const code = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : 'HTTP_ERROR'
    throw new ApiError(message, { status: response.status, code, payload })
  }
  return schema.parse(payload)
}

export async function loadRevalidationStatus(signal) {
  return revalidationRequest('/api/v13/revalidation/status', withSignal(signal), RevalidationIntegrationStatusSchema)
}

export async function loadRevalidationCampaigns(signal) {
  return revalidationRequest('/api/v13/revalidation/campaigns', withSignal(signal), RevalidationCampaignListSchema)
}

export async function createRevalidationCampaign(input = {}, signal) {
  const request = RevalidationSyncRequestSchema.parse(input)
  return revalidationRequest('/api/v13/revalidation/campaigns', {
    method: 'POST', headers: revalidationMutationHeaders, body: JSON.stringify(request), ...withSignal(signal)
  }, RevalidationCampaignDetailSchema)
}

export async function loadRevalidationCampaign(campaignId, signal) {
  return loadRevalidationCampaignPage(campaignId, {}, signal)
}

export async function loadRevalidationCampaignPage(campaignId, page = {}, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const query = new URLSearchParams()
  if (page.limit !== undefined) query.set('limit', String(page.limit))
  if (page.cursor !== undefined && page.cursor !== null) query.set('cursor', page.cursor)
  const campaign = await revalidationRequest(`/api/v13/revalidation/campaigns/${encodeURIComponent(id)}${query.size ? `?${query}` : ''}`, withSignal(signal), RevalidationCampaignDetailSchema)
  if (campaign.campaign_id !== id) throw new ApiError('Goal 15 campaign response does not bind the requested identity.', { status: 200, code: 'REVALIDATION_IDENTITY_MISMATCH', payload: campaign })
  return campaign
}

export async function loadRevalidationCampaignReport(campaignId, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const report = await revalidationRequest(`/api/v13/revalidation/campaigns/${encodeURIComponent(id)}/report`, withSignal(signal), RevalidationCampaignReportSchema)
  if (report.campaign_id !== id) throw new ApiError('Goal 15 campaign report does not bind the requested identity.', { status: 200, code: 'REVALIDATION_IDENTITY_MISMATCH', payload: report })
  return report
}

async function mutateRevalidationCampaign(campaignId, action, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const campaign = await revalidationRequest(`/api/v13/revalidation/campaigns/${encodeURIComponent(id)}/${action}`, {
    method: 'POST', headers: revalidationMutationHeaders, body: '{}', ...withSignal(signal)
  }, RevalidationCampaignDetailSchema)
  if (campaign.campaign_id !== id) throw new ApiError('Goal 15 campaign mutation does not bind the requested identity.', { status: 200, code: 'REVALIDATION_IDENTITY_MISMATCH', payload: campaign })
  return campaign
}

export async function reconcileRevalidationCampaign(campaignId, signal) {
  return mutateRevalidationCampaign(campaignId, 'reconcile', signal)
}

export async function cancelRevalidationCampaign(campaignId, signal) {
  return mutateRevalidationCampaign(campaignId, 'cancel', signal)
}

export async function verifyRevalidationIntegrity(signal) {
  return revalidationRequest('/api/v13/revalidation/integrity', withSignal(signal), RevalidationIntegritySchema)
}

export async function loadRevalidationEvents(signal) {
  const events = []
  let path = '/api/v13/revalidation/events?limit=100'
  let expectedHead = null
  while (path) {
    const page = await revalidationRequest(path, withSignal(signal), ProducerEventPageSchema)
    const head = `${page.head_sequence}\0${page.head_digest}`
    if (expectedHead !== null && head !== expectedHead) throw new ApiError('Goal 15 event pagination changed signed heads.', { status: 200, code: 'REVALIDATION_EVENT_HEAD_DRIFT', payload: page })
    expectedHead = head
    events.push(...page.items)
    path = page.next_cursor === null ? null : `/api/v13/revalidation/events?limit=100&cursor=${encodeURIComponent(page.next_cursor)}`
  }
  return events
}
