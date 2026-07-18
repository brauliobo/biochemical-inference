import { z } from 'zod'

export const REVALIDATION_CONTRACT_VERSION = '1.0.0'
export const MAX_MATERIALIZED_IMPACT_REASONS = 100_000
export const CAMPAIGN_CONTRACT_VERSION = '2.0.0'
export const REVALIDATION_CHANGE_CLASSES = Object.freeze(['scientific', 'provenance', 'rights', 'packaging', 'trust'])
export const REVALIDATION_NODE_KINDS = Object.freeze([
  'release', 'record', 'study', 'model', 'transform', 'run', 'assertion', 'report', 'spatial-asset', 'challenge-result'
])
export const REVALIDATION_DEPENDENCY_ROLES = Object.freeze([
  'scientific-input', 'provenance-source', 'rights-governance', 'packaging-input', 'trust-envelope',
  'model-input', 'transform-input', 'run-input', 'report-input', 'challenge-input', 'spatial-input'
])
export const REVALIDATION_ACTIONS = Object.freeze(['verify', 'recompute', 'reproduce', 'review'])

export const RevalidationDigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
export const RevalidationChangeClassSchema = z.enum(REVALIDATION_CHANGE_CLASSES)
export const RevalidationNodeKindSchema = z.enum(REVALIDATION_NODE_KINDS)
export const RevalidationDependencyRoleSchema = z.enum(REVALIDATION_DEPENDENCY_ROLES)
export const RevalidationActionSchema = z.enum(REVALIDATION_ACTIONS)
export const RevalidationLocatorSchema = z.string().min(1).max(500).regex(/^[A-Za-z0-9][A-Za-z0-9._:%/-]*$/)
export const RevalidationSlugSchema = z.string().min(1).max(100).regex(/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/)

const FiniteNumberSchema = z.number().finite()
export const RevalidationJsonValueSchema = z.lazy(() => z.union([
  z.null(),
  z.boolean(),
  z.string(),
  FiniteNumberSchema,
  z.array(RevalidationJsonValueSchema),
  z.record(RevalidationJsonValueSchema)
]))

export const DependencyNodeSchema = z.object({
  node_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  node_id: RevalidationDigestSchema,
  kind: RevalidationNodeKindSchema,
  locator: RevalidationLocatorSchema,
  content_digest: RevalidationDigestSchema,
  dependency_count: z.number().int().min(0).max(10000)
}).strict()

export const DependencyEdgeSchema = z.object({
  edge_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  edge_id: RevalidationDigestSchema,
  dependent_node_id: RevalidationDigestSchema,
  dependency_node_id: RevalidationDigestSchema,
  role: RevalidationDependencyRoleSchema,
  impact_classes: z.array(RevalidationChangeClassSchema).min(1).max(REVALIDATION_CHANGE_CLASSES.length)
}).strict()

export const DependencySnapshotSchema = z.object({
  snapshot_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  snapshot_id: RevalidationDigestSchema,
  closure_complete: z.literal(true),
  root_node_ids: z.array(RevalidationDigestSchema).min(1).max(10000),
  nodes: z.array(DependencyNodeSchema).min(1).max(10000),
  edges: z.array(DependencyEdgeSchema).max(100000)
}).strict()

export const RevalidationReleaseReferenceSchema = z.object({
  family: RevalidationSlugSchema,
  release_id: z.string().min(1).max(200),
  schema_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  digest: RevalidationDigestSchema
}).strict()

export const NormalizedChangeSchema = z.object({
  change_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  change_id: RevalidationDigestSchema,
  class: RevalidationChangeClassSchema,
  subject: RevalidationLocatorSchema,
  path: z.string().min(1).max(1000),
  before: RevalidationJsonValueSchema,
  after: RevalidationJsonValueSchema,
  reasons: z.array(z.string().min(1).max(1000)).min(1).max(100)
}).strict()

export const NormalizedChangeSetSchema = z.object({
  change_set_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  change_set_id: RevalidationDigestSchema,
  source_diff_digest: RevalidationDigestSchema,
  baseline: RevalidationReleaseReferenceSchema,
  candidate: RevalidationReleaseReferenceSchema,
  changes: z.array(NormalizedChangeSchema).max(10000)
}).strict()

export const RevalidationResourceProfileSchema = z.object({
  profile_id: RevalidationSlugSchema,
  cpu_cores: z.number().int().positive().max(1024),
  memory_mib: z.number().int().positive().max(1048576),
  scratch_mib: z.number().int().nonnegative().max(10485760),
  maximum_runtime_seconds: z.number().int().positive().max(31536000)
}).strict()

export const RevalidationWorkRuleSchema = z.object({
  node_kind: RevalidationNodeKindSchema,
  action: RevalidationActionSchema,
  expected_artifact_class: RevalidationSlugSchema,
  resource_profile: RevalidationResourceProfileSchema
}).strict()

export const ImpactPolicySchema = z.object({
  policy_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  policy_id: RevalidationDigestSchema,
  change_classes: z.array(RevalidationChangeClassSchema).min(1).max(REVALIDATION_CHANGE_CLASSES.length),
  traversal: z.enum(['direct', 'transitive']),
  maximum_depth: z.number().int().min(1).max(32),
  impact_kinds: z.array(RevalidationNodeKindSchema).min(1).max(REVALIDATION_NODE_KINDS.length),
  work_rules: z.array(RevalidationWorkRuleSchema).min(1).max(REVALIDATION_NODE_KINDS.length)
}).strict()

export const ImpactReasonSchema = z.object({
  change_id: RevalidationDigestSchema,
  change_class: RevalidationChangeClassSchema,
  subject: RevalidationLocatorSchema,
  path: z.string().min(1).max(1000),
  distance: z.number().int().positive().max(32),
  edge_ids: z.array(RevalidationDigestSchema).min(1).max(32)
}).strict()

export const RevalidationImpactSchema = z.object({
  impact_id: RevalidationDigestSchema,
  node_id: RevalidationDigestSchema,
  node_kind: RevalidationNodeKindSchema,
  locator: RevalidationLocatorSchema,
  relation: z.enum(['direct', 'transitive']),
  distance: z.number().int().positive().max(32),
  classes: z.array(RevalidationChangeClassSchema).min(1).max(REVALIDATION_CHANGE_CLASSES.length),
  reasons: z.array(ImpactReasonSchema).min(1).max(10000)
}).strict()

export const UnrelatedChangeClosureSchema = z.object({
  change_id: RevalidationDigestSchema,
  subject: RevalidationLocatorSchema,
  dependency_snapshot_id: RevalidationDigestSchema,
  disposition: z.literal('unrelated-to-dependency-closure'),
  closure_evidence: z.object({
    snapshot_closure_complete: z.literal(true),
    matching_node_ids: z.array(RevalidationDigestSchema).length(0)
  }).strict(),
  reason: z.string().min(1).max(1000)
}).strict()

export const RevalidationWorkItemSchema = z.object({
  work_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  work_id: RevalidationDigestSchema,
  baseline: RevalidationReleaseReferenceSchema,
  candidate: RevalidationReleaseReferenceSchema,
  change_set_id: RevalidationDigestSchema,
  dependency_snapshot_id: RevalidationDigestSchema,
  impact_policy_id: RevalidationDigestSchema,
  impact_id: RevalidationDigestSchema,
  subject_node_id: RevalidationDigestSchema,
  impact_classes: z.array(RevalidationChangeClassSchema).min(1).max(REVALIDATION_CHANGE_CLASSES.length),
  reason_change_ids: z.array(RevalidationDigestSchema).min(1).max(10000),
  action: RevalidationActionSchema,
  expected_artifact_class: RevalidationSlugSchema,
  resource_profile: RevalidationResourceProfileSchema
}).strict()

export const ImpactPlanSchema = z.object({
  plan_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  plan_id: RevalidationDigestSchema,
  baseline: RevalidationReleaseReferenceSchema,
  candidate: RevalidationReleaseReferenceSchema,
  change_set_id: RevalidationDigestSchema,
  dependency_snapshot_id: RevalidationDigestSchema,
  impact_policy_id: RevalidationDigestSchema,
  unrelated_changes: z.array(UnrelatedChangeClosureSchema).max(10000).optional(),
  impacts: z.array(RevalidationImpactSchema).max(10000),
  work_items: z.array(RevalidationWorkItemSchema).max(10000)
}).strict()

export const CampaignRetryPolicySchema = z.object({
  maximum_attempts: z.number().int().positive().max(100),
  initial_backoff_seconds: z.number().int().nonnegative().max(86400),
  maximum_backoff_seconds: z.number().int().nonnegative().max(604800),
  backoff_multiplier: FiniteNumberSchema.min(1).max(100),
  retryable_failure_codes: z.array(RevalidationSlugSchema).min(1).max(32)
}).strict().superRefine((value, context) => {
  if (value.maximum_backoff_seconds < value.initial_backoff_seconds) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['maximum_backoff_seconds'], message: 'maximum backoff must not precede initial backoff' })
  }
  if (new Set(value.retryable_failure_codes).size !== value.retryable_failure_codes.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['retryable_failure_codes'], message: 'retryable failure codes must be unique' })
  }
})

export const CampaignArtifactDescriptorSchema = z.object({
  name: z.string().min(1).max(200).regex(/^[a-z][a-z0-9.-]*$/),
  digest: RevalidationDigestSchema,
  bytes: z.number().int().nonnegative().max(1073741824),
  media_type: z.string().min(1).max(200)
}).strict()

export const CampaignExecutorBindingSchema = z.object({
  expected_artifact_class: RevalidationSlugSchema,
  executor_id: RevalidationSlugSchema,
  executor_version: z.string().regex(/^\d+\.\d+\.\d+$/),
  checkpoint_mode: z.enum(['none', 'exact-input-closure'])
}).strict()

export const CampaignExecutionLimitsSchema = z.object({
  maximum_concurrency: z.number().int().positive().max(64),
  maximum_output_bytes: z.number().int().positive().max(1073741824),
  lease_duration_seconds: z.number().int().positive().max(86400)
}).strict()

export const CampaignSpecificationSchema = z.object({
  campaign_schema_version: z.literal(CAMPAIGN_CONTRACT_VERSION),
  campaign_id: RevalidationDigestSchema,
  producer_plan_id: RevalidationDigestSchema,
  producer_campaign: z.object({
    campaign_id: RevalidationDigestSchema,
    name: RevalidationSlugSchema,
    reason: z.string().min(1).max(4000)
  }).strict(),
  resource_profile: RevalidationResourceProfileSchema,
  retry_policy: CampaignRetryPolicySchema,
  execution_limits: CampaignExecutionLimitsSchema,
  executor_bindings: z.array(CampaignExecutorBindingSchema).min(1).max(REVALIDATION_NODE_KINDS.length),
  input_artifacts: z.array(CampaignArtifactDescriptorSchema).min(4).max(1000),
  ordered_work_ids: z.array(RevalidationDigestSchema).min(1).max(10000)
}).strict()

export const CampaignStateSchema = z.enum(['active', 'terminal'])
export const CampaignWorkStateSchema = z.enum(['queued', 'leased', 'running', 'terminal'])
export const CampaignAttemptStateSchema = z.enum(['leased', 'running', 'terminal'])
export const CampaignTerminalOutcomeSchema = z.enum(['succeeded', 'failed', 'cancelled', 'resource-exhausted'])
export const CampaignExecutionModeSchema = z.enum(['isolated-worker', 'inline-evidence-only', 'unrecorded'])
export const ScientificConclusionSchema = z.enum(['not-evaluated', 'review-required', 'supported-within-boundary', 'failed', 'not-evaluable'])

export const CampaignFailureSchema = z.object({
  code: RevalidationSlugSchema,
  message: z.string().min(1).max(2000),
  retryable: z.boolean()
}).strict()

export const CampaignAttemptSchema = z.object({
  attempt_id: RevalidationDigestSchema,
  campaign_id: RevalidationDigestSchema,
  work_id: RevalidationDigestSchema,
  attempt_number: z.number().int().positive(),
  state: CampaignAttemptStateSchema,
  execution_mode: CampaignExecutionModeSchema,
  lease_owner: RevalidationSlugSchema,
  lease_expires_at: z.string().datetime({ offset: true }),
  created_at: z.string().datetime({ offset: true }),
  started_at: z.string().datetime({ offset: true }).nullable(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  peak_rss_bytes: z.number().int().nonnegative().nullable(),
  runtime_ms: z.number().int().nonnegative().nullable(),
  outcome: CampaignTerminalOutcomeSchema.nullable(),
  failure: CampaignFailureSchema.nullable()
}).strict()

export const CampaignResultSchema = z.object({
  result_schema_version: z.literal('1.0.0'),
  result_id: RevalidationDigestSchema,
  campaign_id: RevalidationDigestSchema,
  work_id: RevalidationDigestSchema,
  executor: z.object({ id: RevalidationSlugSchema, version: z.string().regex(/^\d+\.\d+\.\d+$/) }).strict(),
  execution_status: z.literal('succeeded'),
  scientific_conclusion: ScientificConclusionSchema,
  input_artifact_digests: z.array(RevalidationDigestSchema).min(4).max(1000),
  output: RevalidationJsonValueSchema
}).strict()

export const CampaignCheckpointSchema = z.object({
  checkpoint_schema_version: z.literal('1.0.0'),
  checkpoint_id: RevalidationDigestSchema,
  campaign_id: RevalidationDigestSchema,
  work_id: RevalidationDigestSchema,
  compatibility_id: RevalidationDigestSchema,
  state_digest: RevalidationDigestSchema,
  continuation: z.literal(true),
  scientifically_valid: z.literal(true)
}).strict()

export const CampaignWorkerResultSchema = z.object({
  execution_status: z.literal('succeeded'),
  scientific_conclusion: ScientificConclusionSchema,
  output: RevalidationJsonValueSchema
}).strict()

export const CampaignWorkerFailureSchema = z.object({
  code: RevalidationSlugSchema,
  message: z.string().min(1).max(2000),
  checkpoint: RevalidationJsonValueSchema.nullable()
}).strict()

export const RevalidationGoldenFixtureSchema = z.object({
  fixture_schema_version: z.literal('goal15-producer-golden-v1'),
  dependency_snapshot: DependencySnapshotSchema,
  change_set: NormalizedChangeSetSchema,
  impact_policy: ImpactPolicySchema,
  expected: z.object({
    plan_id: RevalidationDigestSchema,
    ordered_impact_ids: z.array(RevalidationDigestSchema),
    ordered_work_ids: z.array(RevalidationDigestSchema)
  }).strict()
}).strict()

export const REVALIDATION_CSRF_HEADER = 'x-biochemical-csrf'
export const REVALIDATION_CSRF_VALUE = 'revalidation-campaign-v1'

export const ProducerRevalidationActorSchema = z.object({
  id: z.string().min(3).max(200).regex(/^[A-Za-z0-9][A-Za-z0-9_.:@/-]*$/),
  role: z.enum(['campaign-author', 'key-administrator', 'inference-executor', 'scientific-reviewer']),
  organization: z.string().min(1).max(200)
}).strict()

export const ProducerRevalidationKeySchema = z.object({
  key_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  key_id: RevalidationDigestSchema,
  algorithm: z.literal('Ed25519'),
  public_key: z.string().regex(/^[A-Za-z0-9+/]{43}=$/)
}).strict()

export const ProducerCampaignSpecificationSchema = z.object({
  campaign_spec_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  campaign_id: RevalidationDigestSchema,
  name: RevalidationSlugSchema,
  plan_id: RevalidationDigestSchema,
  dependency_snapshot_id: RevalidationDigestSchema,
  change_set_id: RevalidationDigestSchema,
  impact_policy_id: RevalidationDigestSchema,
  work_ids: z.array(RevalidationDigestSchema).min(1).max(10000),
  requested_by: ProducerRevalidationActorSchema,
  reason: z.string().min(1).max(4000)
}).strict()

export const ProducerCampaignSubmissionSchema = z.object({
  specification: ProducerCampaignSpecificationSchema,
  dependency_snapshot: DependencySnapshotSchema,
  change_set: NormalizedChangeSetSchema,
  impact_policy: ImpactPolicySchema,
  plan: ImpactPlanSchema
}).strict()

const ProducerExecutionOutcomeBaseSchema = z.object({
  outcome_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  outcome_id: RevalidationDigestSchema,
  campaign_id: RevalidationDigestSchema,
  work_id: RevalidationDigestSchema,
  execution_status: z.enum(['succeeded', 'failed', 'not-evaluable']),
  artifact: z.object({ artifact_class: RevalidationSlugSchema, digest: RevalidationDigestSchema }).strict().nullable(),
  diagnostics: RevalidationJsonValueSchema,
  executor: ProducerRevalidationActorSchema
}).strict()

export const ProducerExecutionOutcomeSchema = ProducerExecutionOutcomeBaseSchema.superRefine((value, context) => {
  if ((value.execution_status === 'succeeded') !== (value.artifact !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact'], message: 'only succeeded outcomes require an artifact' })
  if (value.executor.role !== 'inference-executor') context.addIssue({ code: z.ZodIssueCode.custom, path: ['executor'], message: 'outcome executor role is invalid' })
})

const ProducerKeyActivationPayloadSchema = z.object({ action: z.literal('key-activated'), key: ProducerRevalidationKeySchema, effective_sequence: z.number().int().positive() }).strict()
const ProducerKeyRotationPayloadSchema = z.object({ action: z.literal('key-rotated'), key: ProducerRevalidationKeySchema, retiring_key_id: RevalidationDigestSchema, effective_sequence: z.number().int().positive() }).strict()
const ProducerKeyRetirementPayloadSchema = z.object({ action: z.literal('key-retired'), key_id: RevalidationDigestSchema, effective_sequence: z.number().int().positive() }).strict()
const ProducerKeyRevocationPayloadSchema = z.object({ action: z.literal('key-revoked'), key_id: RevalidationDigestSchema, effective_sequence: z.number().int().positive() }).strict()
const ProducerCampaignEventPayloadSchema = z.object({ action: z.literal('campaign-created'), campaign_id: RevalidationDigestSchema, plan_id: RevalidationDigestSchema }).strict()
const ProducerOutcomeEventPayloadSchema = z.object({ action: z.literal('outcome-recorded'), campaign_id: RevalidationDigestSchema, work_id: RevalidationDigestSchema, outcome_id: RevalidationDigestSchema }).strict()
const ProducerOutcomeLabelPayloadSchema = z.object({
  action: z.literal('outcome-labeled'),
  campaign_id: RevalidationDigestSchema,
  work_id: RevalidationDigestSchema,
  outcome_id: RevalidationDigestSchema,
  scientific_label: z.enum(['supported-within-boundary', 'unsupported', 'not-evaluable', 'inconclusive'])
}).strict()

export const ProducerRevalidationEventPayloadSchema = z.discriminatedUnion('action', [
  ProducerKeyActivationPayloadSchema,
  ProducerKeyRotationPayloadSchema,
  ProducerKeyRetirementPayloadSchema,
  ProducerKeyRevocationPayloadSchema,
  ProducerCampaignEventPayloadSchema,
  ProducerOutcomeEventPayloadSchema,
  ProducerOutcomeLabelPayloadSchema
])

export const ProducerSignedEventSchema = z.object({
  event_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  sequence: z.number().int().positive(),
  previous_event_digest: RevalidationDigestSchema.nullable(),
  occurred_at: z.string().datetime({ offset: true }),
  actor: ProducerRevalidationActorSchema,
  reason: z.string().min(1).max(4000),
  role_policy_id: RevalidationDigestSchema,
  signing_key_id: RevalidationDigestSchema,
  algorithm: z.literal('Ed25519'),
  payload: ProducerRevalidationEventPayloadSchema,
  event_digest: RevalidationDigestSchema,
  signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/)
}).strict()

export const ProducerEventPageSchema = z.object({
  page_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  head_sequence: z.number().int().nonnegative(),
  head_digest: RevalidationDigestSchema.nullable(),
  limit: z.number().int().min(1).max(100),
  items: z.array(ProducerSignedEventSchema).max(100),
  next_cursor: z.string().nullable()
}).strict()

export const ProducerPlanManifestSchema = z.object({
  manifest_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  dependency_snapshot: DependencySnapshotSchema,
  change_set: NormalizedChangeSetSchema,
  impact_policy: ImpactPolicySchema,
  plan: ImpactPlanSchema.omit({ impacts: true, work_items: true }).extend({
    impact_count: z.number().int().nonnegative().max(10000),
    work_item_count: z.number().int().nonnegative().max(10000)
  }).strict()
}).strict()
const ProducerPlanPageBaseSchema = z.object({
  page_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  plan_id: RevalidationDigestSchema,
  total: z.number().int().nonnegative().max(10000),
  limit: z.number().int().min(1).max(100),
  next_cursor: z.string().nullable()
})
export const ProducerPlanPageSchema = z.discriminatedUnion('collection', [
  ProducerPlanPageBaseSchema.extend({ collection: z.literal('impacts'), items: z.array(RevalidationImpactSchema).max(100) }).strict(),
  ProducerPlanPageBaseSchema.extend({ collection: z.literal('work-items'), items: z.array(RevalidationWorkItemSchema).max(100) }).strict()
])

const ProducerStateKeySchema = z.object({
  key_id: RevalidationDigestSchema,
  algorithm: z.literal('Ed25519'),
  active_from: z.number().int().positive(),
  retired_from: z.number().int().positive().nullable(),
  revoked_from: z.number().int().positive().nullable(),
  status: z.enum(['pending', 'active', 'retired', 'revoked'])
}).strict()
const ProducerStateOutcomeSchema = z.object({
  work_id: RevalidationDigestSchema,
  outcome_id: RevalidationDigestSchema,
  execution_status: z.enum(['succeeded', 'failed', 'not-evaluable']),
  scientific_label: z.enum(['supported-within-boundary', 'unsupported', 'not-evaluable', 'inconclusive']).nullable()
}).strict()
const ProducerStateCampaignSchema = z.object({
  campaign_id: RevalidationDigestSchema,
  plan_id: RevalidationDigestSchema,
  work_ids: z.array(RevalidationDigestSchema).min(1),
  outcomes: z.array(ProducerStateOutcomeSchema)
}).strict()
export const ProducerStateSchema = z.object({
  state_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  head_sequence: z.number().int().nonnegative(),
  head_digest: RevalidationDigestSchema.nullable(),
  keys: z.array(ProducerStateKeySchema).min(1),
  campaigns: z.array(ProducerStateCampaignSchema)
}).strict()

export const ProducerEventMetadataSchema = z.object({
  actor: ProducerRevalidationActorSchema,
  reason: z.string().min(1).max(4000),
  signing_key_id: RevalidationDigestSchema
}).strict()
export const ProducerCampaignWriteRequestSchema = z.object({ campaign: ProducerCampaignSubmissionSchema, event: ProducerEventMetadataSchema }).strict()
export const ProducerOutcomeWriteRequestSchema = z.object({ outcome: ProducerExecutionOutcomeBaseSchema.omit({ outcome_id: true, outcome_schema_version: true }), event: ProducerEventMetadataSchema }).strict()
export const ProducerOutcomeBatchWriteRequestSchema = z.object({ outcomes: z.array(ProducerExecutionOutcomeBaseSchema.omit({ outcome_id: true, outcome_schema_version: true })).min(1).max(100), event: ProducerEventMetadataSchema }).strict()
export const ProducerCampaignReceiptSchema = z.object({ created: z.boolean(), campaign_id: RevalidationDigestSchema, event_sequence: z.number().int().positive(), event: ProducerSignedEventSchema }).strict()
export const ProducerOutcomeReceiptSchema = z.object({ created: z.boolean(), outcome: ProducerExecutionOutcomeSchema, event_sequence: z.number().int().positive(), event: ProducerSignedEventSchema }).strict()
export const ProducerOutcomeBatchReceiptSchema = z.array(ProducerOutcomeReceiptSchema).min(1).max(100)
export const ProducerCampaignResponseSchema = ProducerCampaignSubmissionSchema.extend({ event_sequence: z.number().int().positive() }).strict()
export const ProducerOutcomeResponseSchema = z.object({
  outcome: ProducerExecutionOutcomeSchema,
  event_sequence: z.number().int().positive(),
  scientific_label: z.enum(['supported-within-boundary', 'unsupported', 'not-evaluable', 'inconclusive']).nullable(),
  label_sequence: z.number().int().positive().nullable()
}).strict()
export const ProducerOutcomePageSchema = z.object({
  page_schema_version: z.literal(REVALIDATION_CONTRACT_VERSION),
  campaign_id: RevalidationDigestSchema,
  head_sequence: z.number().int().nonnegative(),
  head_digest: RevalidationDigestSchema.nullable(),
  total: z.number().int().nonnegative().max(10000),
  limit: z.number().int().min(1).max(100),
  items: z.array(ProducerOutcomeResponseSchema).max(100),
  next_cursor: z.string().nullable()
}).strict()

export const RevalidationSyncRequestSchema = z.object({
  name: RevalidationSlugSchema.default('goal15-local-revalidation'),
  reason: z.string().min(1).max(4000).default('Execute the pinned Goal 11 revalidation impact plan locally.')
}).strict()
export const RevalidationCampaignParamSchema = z.object({ campaignId: RevalidationDigestSchema }).strict()
export const RevalidationWorkParamSchema = z.object({ campaignId: RevalidationDigestSchema, workId: RevalidationDigestSchema }).strict()

export const RevalidationEventHeadSchema = z.object({ sequence: z.number().int().positive(), digest: RevalidationDigestSchema }).strict()
export const RevalidationProducerBindingSchema = z.object({
  local_campaign_id: RevalidationDigestSchema,
  producer_campaign_id: RevalidationDigestSchema,
  producer_plan_id: RevalidationDigestSchema,
  campaign: ProducerCampaignResponseSchema,
  receipt: ProducerCampaignReceiptSchema,
  event_head: RevalidationEventHeadSchema,
  submitted_outcomes: z.number().int().nonnegative()
}).strict()
export const RevalidationProducerStoredReceiptSchema = z.object({
  request: ProducerOutcomeWriteRequestSchema,
  receipt: ProducerOutcomeReceiptSchema,
  event_sequence: z.number().int().positive(),
  event_digest: RevalidationDigestSchema
}).strict()
export const RevalidationCampaignSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  queued: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  succeeded: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  resource_exhausted: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  submitted: z.number().int().nonnegative()
}).strict()
export const RevalidationCampaignWorkViewSchema = z.object({
  work_id: RevalidationDigestSchema,
  campaign_id: RevalidationDigestSchema,
  ordinal: z.number().int().nonnegative(),
  state: CampaignWorkStateSchema,
  attempt_count: z.number().int().nonnegative(),
  cancellation_requested: z.boolean(),
  available_at: z.string().datetime({ offset: true }),
  current_attempt_id: RevalidationDigestSchema.nullable(),
  outcome: CampaignTerminalOutcomeSchema.nullable(),
  failure: CampaignFailureSchema.nullable(),
  accepted_result_id: RevalidationDigestSchema.nullable(),
  completed_at: z.string().datetime({ offset: true }).nullable(),
  work: RevalidationWorkItemSchema,
  attempts: z.array(CampaignAttemptSchema),
  checkpoint_count: z.number().int().nonnegative(),
  impact: RevalidationImpactSchema,
  producer_receipt: RevalidationProducerStoredReceiptSchema.nullable()
}).strict()
export const RevalidationProjectionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.string().min(1).max(8192).optional()
}).strict()
export const RevalidationCampaignProjectionSchema = z.object({
  projection_schema_version: z.literal('1.0.0'),
  snapshot_id: RevalidationDigestSchema,
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(100),
  next_cursor: z.string().nullable()
}).strict()
export const RevalidationCampaignDetailSchema = z.object({
  campaign_id: RevalidationDigestSchema,
  state: CampaignStateSchema,
  cancellation_requested: z.boolean(),
  producer: RevalidationProducerBindingSchema,
  review: z.object({ required: z.boolean(), automatically_accepted: z.literal(false), labeled_outcomes: z.number().int().nonnegative() }).strict(),
  summary: RevalidationCampaignSummarySchema,
  projection: RevalidationCampaignProjectionSchema,
  work: z.array(RevalidationCampaignWorkViewSchema),
  last_error: z.string().nullable()
}).strict()
export const RevalidationCampaignListSchema = z.array(z.object({
  local_campaign_id: RevalidationDigestSchema,
  producer_campaign_id: RevalidationDigestSchema,
  event_head: RevalidationEventHeadSchema
}).strict())
export const RevalidationIntegrationStatusSchema = z.object({
  mode: z.literal('producer-bound-local-revalidation'),
  producer_origin: z.string().url(),
  bootstrap_key_id: RevalidationDigestSchema,
  campaigns: z.number().int().nonnegative(),
  last_error: z.string().nullable(),
  review_automatic_acceptance: z.literal(false)
}).strict()
export const RevalidationIntegritySchema = z.object({
  status: z.literal('valid'),
  campaigns: z.number().int().nonnegative(),
  accepted_results: z.number().int().nonnegative(),
  producer: z.literal('valid'),
  event_heads: z.array(RevalidationEventHeadSchema)
}).strict()
const RevalidationCountRecordSchema = z.record(z.number().int().nonnegative())
export const RevalidationCampaignReportSchema = z.object({
  report_schema_version: z.literal('goal15-scale-acceptance-v1'),
  campaign_id: RevalidationDigestSchema,
  technical_execution: z.object({
    state: CampaignStateSchema,
    progress: RevalidationCampaignSummarySchema,
    selection: z.object({
      direct: z.number().int().nonnegative(),
      transitive: z.number().int().nonnegative(),
      by_node_kind: RevalidationCountRecordSchema,
      by_action: RevalidationCountRecordSchema,
      registration_negative_controls: z.number().int().nonnegative(),
      registration_controls_selected: z.number().int().nonnegative(),
      all_and_only_verified: z.literal(true)
    }).strict(),
    resources: z.object({
      declared: RevalidationResourceProfileSchema,
      execution_limits: CampaignExecutionLimitsSchema,
      acceptance: z.object({ mode: z.enum(['isolated-worker', 'inline-evidence-only', 'mixed-or-unrecorded-evidence']), evidence_only: z.boolean() }).strict(),
      enforcement: z.object({
        cpu: z.object({ mode: z.literal('concurrency-ceiling'), cpu_time_limit_enforced: z.literal(false) }).strict(),
        process_rss: z.object({ limit_bytes: z.number().int().positive(), enforced: z.boolean(), observed_peak_bytes: z.number().int().nonnegative() }).strict(),
        runtime: z.object({ limit_ms: z.number().int().positive(), enforced: z.boolean(), observed_max_ms: z.number().int().nonnegative() }).strict(),
        output: z.object({ limit_bytes: z.number().int().positive(), enforced: z.literal(true) }).strict(),
        storage: z.object({ limit_bytes: z.number().int().nonnegative(), enforced: z.literal(true) }).strict()
      }).strict()
    }).strict(),
    recovery: z.object({ attempts: z.number().int().nonnegative(), retries: z.number().int().nonnegative(), by_failure_code: RevalidationCountRecordSchema }).strict(),
    accepted_results: z.object({
      count: z.number().int().nonnegative(),
      unique_work_ids: z.number().int().nonnegative(),
      duplicate_work_ids: z.number().int().nonnegative(),
      missing_successful_work_ids: z.number().int().nonnegative(),
      unexpected_non_success_results: z.number().int().nonnegative(),
      exactly_once: z.boolean()
    }).strict(),
    storage: z.object({
      object_count: z.number().int().nonnegative(),
      object_bytes: z.number().int().nonnegative(),
      campaign_logical_bytes: z.number().int().nonnegative(),
      campaign_limit_bytes: z.number().int().nonnegative(),
      sqlite_bytes: z.number().int().nonnegative(),
      wal_bytes: z.number().int().nonnegative()
    }).strict(),
    projection: z.object({ snapshot_id: RevalidationDigestSchema, total: z.number().int().nonnegative() }).strict()
  }).strict(),
  scientific_review: z.object({
    support: z.enum(['pending-technical-execution', 'unsupported']),
    review_required: z.boolean(),
    automatically_accepted: z.literal(false),
    producer_labeled_outcomes: z.number().int().nonnegative()
  }).strict()
}).strict()
