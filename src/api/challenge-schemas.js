// Browser-side response schemas for the challenge API. They bind the pinned
// release, artifact digests and cross-record identities in addition to the
// shared wire contracts.
import { z } from 'zod'
import {
  CHALLENGE_PINS,
  CHALLENGE_PUBLIC_RECORD_SCHEMAS,
  ChallengeArtifactRefsSchema,
  ChallengeCommitmentRequestSchema,
  ChallengeCommitmentResponseSchema,
  ChallengeDisclosureResponseSchema,
  ChallengeResultResponseSchema,
  ChallengeResultSubmissionSchema,
  ChallengeSha256Schema,
  ChallengeTimestampSchema
} from '../../shared/challenge-contracts.js'

const ARTIFACT_BINDINGS = [
  ['consumer_model_digest', 'model'],
  ['equation_set_digest', 'equationSet'],
  ['parameter_policy_digest', 'parameterPolicy'],
  ['solver_digest', 'solver'],
  ['prediction_artifact_digest', 'prediction']
]

function checkArtifactBindings(context, commitment, artifacts, pathRoot, label) {
  for (const [field, artifact] of ARTIFACT_BINDINGS) {
    if (commitment[field] !== artifacts[artifact].digest) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [pathRoot, artifact, 'digest'], message: `${label} ${artifact} artifact does not bind the frozen commitment.` })
    }
  }
}

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
export const ChallengeStatusSchema = z.object({
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
export const ChallengeDiscoverySchema = z.object({
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
export const ChallengeCommitmentViewSchema = z.object({
  frozenCommitment: ChallengeCommitmentRequestSchema,
  receipt: ChallengeCommitmentResponseSchema,
  artifacts: ChallengeArtifactRefsSchema
}).strict().superRefine((value, context) => {
  checkArtifactBindings(context, value.frozenCommitment, value.artifacts, 'artifacts', 'Challenge')
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
export const ChallengeReportSchema = z.object({
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
  checkArtifactBindings(context, value.frozen_commitment, value.artifact_refs, 'artifact_refs', 'Report')
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
export const ChallengeRunsSchema = z.object({
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
export const ChallengeReplaySchema = z.object({
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
export const ChallengeArtifactSchema = z.object({
  artifactDigest: ChallengeSha256Schema,
  kind: z.enum(['model', 'equation-set', 'parameter-policy', 'concentration-mapping', 'solver', 'software', 'diagnostics', 'prediction', 'public-lineage']),
  bytes: z.number().int().positive(),
  content: z.unknown()
}).strict()
export const ChallengeIntegritySchema = z.object({
  status: z.enum(['empty', 'valid', 'failed']),
  artifacts: z.number().int().nonnegative().optional(),
  commitments: z.number().int().nonnegative().optional(),
  disclosureEpochs: z.number().int().nonnegative().optional(),
  disclosures: z.number().int().nonnegative().optional(),
  reports: z.number().int().nonnegative().optional(),
  findings: z.array(z.string()).optional()
}).strict()
