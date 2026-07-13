import { z } from 'zod'
import { ExperimentSchema, PortfolioModelSchema, PortfolioResultSchema, RunOutcomeSchema, Sha256Schema } from './portfolio-contracts.js'

export const WORKSPACE_CONTRACT_VERSION = '1.0.0'
export const PORTABLE_BUNDLE_PROFILE = 'biochemical-workspace-portable-1.0'
export const WORKSPACE_MAX_BUNDLE_BYTES = 25_000_000
export const WORKSPACE_BUNDLE_BASE64_MAX_LENGTH = Math.ceil(WORKSPACE_MAX_BUNDLE_BYTES / 3) * 4
export const WORKSPACE_BUNDLE_REQUEST_BODY_LIMIT = WORKSPACE_BUNDLE_BASE64_MAX_LENGTH + 64

const IdentifierSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_.-]{0,63}$/)
const TimestampSchema = z.string().datetime({ offset: true })
const TaxonSchema = z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)
const TissueSchema = z.string().regex(/^[A-Z][A-Za-z0-9_]*:[A-Za-z0-9_.-]+$/)
const FailureSchema = z.object({ code: IdentifierSchema, message: z.string().min(1).max(2000) }).strict()

export const NumericalContractSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('exact') }).strict(),
  z.object({ kind: z.literal('tolerance'), absolute: z.number().finite().nonnegative(), relative: z.number().finite().nonnegative() }).strict()
])

export const WorkspaceDesignSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('single') }).strict(),
  z.object({ type: z.literal('parameter-sweep'), parameterId: IdentifierSchema, values: z.array(z.number().finite()).min(2).max(128) }).strict(),
  z.object({ type: z.literal('ensemble'), members: z.number().int().min(2).max(128) }).strict(),
  z.object({ type: z.literal('sensitivity'), parameterIds: z.array(IdentifierSchema).min(1).max(32) }).strict(),
  z.object({ type: z.literal('intervention-schedule') }).strict()
])

export const WorkspaceEntrySchema = z.object({
  id: IdentifierSchema,
  label: z.string().min(1).max(160),
  model: PortfolioModelSchema,
  experiment: ExperimentSchema
}).strict().superRefine((entry, context) => {
  if (entry.experiment.modelId !== entry.model.id || entry.experiment.modelDigest !== entry.model.digest) context.addIssue({ code: z.ZodIssueCode.custom, path: ['experiment', 'modelDigest'], message: 'entry experiment must pin its embedded model' })
  if (entry.experiment.engine.type !== entry.model.engine.type || entry.experiment.engine.id !== entry.model.engine.id || entry.experiment.engine.version !== entry.model.engine.version) context.addIssue({ code: z.ZodIssueCode.custom, path: ['experiment', 'engine'], message: 'entry experiment must pin its embedded engine' })
})

export const WorkspaceSpecificationSchema = z.object({
  contractVersion: z.literal(WORKSPACE_CONTRACT_VERSION),
  design: WorkspaceDesignSchema,
  context: z.object({ taxonId: TaxonSchema, tissueId: TissueSchema.nullable() }).strict(),
  entries: z.array(WorkspaceEntrySchema).min(1).max(128),
  numericalContract: NumericalContractSchema,
  tags: z.array(IdentifierSchema).max(32)
}).strict().superRefine((specification, context) => {
  const identifiers = specification.entries.map((entry) => entry.id)
  if (new Set(identifiers).size !== identifiers.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'entry identifiers must be unique' })
  if (specification.design.type === 'single' && specification.entries.length !== 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'single designs require exactly one entry' })
  if (specification.design.type === 'ensemble' && specification.entries.length !== specification.design.members) context.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'ensemble entry count must equal members' })
  if (specification.design.type === 'parameter-sweep' && specification.entries.length !== specification.design.values.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'parameter-sweep entry count must equal values' })
  if (specification.design.type === 'intervention-schedule' && specification.entries.every((entry) => entry.experiment.interventions.length === 0)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['entries'], message: 'intervention-schedule designs require an intervention' })
})

export const ResourceProfileSchema = z.object({
  id: IdentifierSchema,
  name: z.string().min(1).max(100),
  cpuCores: z.number().int().min(1).max(64),
  concurrency: z.number().int().min(1).max(16),
  gpu: z.enum(['disabled', 'optional', 'required']),
  memoryMb: z.number().int().min(32).max(4096),
  wallTimeMs: z.number().int().min(10).max(3_600_000),
  maxOutputBytes: z.number().int().min(1024).max(50_000_000),
  maxStorageBytes: z.number().int().min(4096).max(500_000_000),
  isDefault: z.boolean()
}).strict().refine((profile) => profile.concurrency <= profile.cpuCores, { message: 'worker concurrency cannot exceed the CPU core budget', path: ['concurrency'] })

export const ExperimentCreateRequestSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000),
  specification: WorkspaceSpecificationSchema,
  resourceProfileId: IdentifierSchema.default('local-default')
}).strict()

export const ExperimentRecordSchema = z.object({
  experimentId: z.string().uuid(),
  name: z.string().min(1).max(160),
  description: z.string().max(2000),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  latestRevisionId: Sha256Schema.nullable()
}).strict()

export const RevisionCreateRequestSchema = z.object({ specification: WorkspaceSpecificationSchema, resourceProfileId: IdentifierSchema.default('local-default') }).strict()

export const RevisionRecordSchema = z.object({
  revisionId: Sha256Schema,
  experimentId: z.string().uuid(),
  ordinal: z.number().int().positive(),
  parentRevisionId: Sha256Schema.nullable(),
  specificationDigest: Sha256Schema,
  specificationObjectDigest: Sha256Schema,
  snapshotDigest: Sha256Schema,
  snapshotObjectDigest: Sha256Schema,
  modelDigests: z.array(Sha256Schema).min(1),
  engineDigests: z.array(Sha256Schema).min(1),
  resourceProfileId: IdentifierSchema,
  source: z.enum(['local', 'clone', 'import']),
  createdAt: TimestampSchema,
  specification: WorkspaceSpecificationSchema
}).strict()

export const ExperimentDetailSchema = z.object({ experiment: ExperimentRecordSchema, revisions: z.array(RevisionRecordSchema) }).strict()
export const QueueStateSchema = z.enum(['queued', 'running', 'terminal'])
export const AttemptKindSchema = z.enum(['initial', 'rerun', 'restart'])

export const AttemptRecordSchema = z.object({
  attemptId: Sha256Schema,
  runId: Sha256Schema,
  revisionId: Sha256Schema,
  attemptNumber: z.number().int().positive(),
  kind: AttemptKindSchema,
  restartMode: z.literal('from-specification').nullable(),
  checkpointId: Sha256Schema.nullable(),
  state: QueueStateSchema,
  outcome: RunOutcomeSchema.nullable(),
  resourceProfileId: IdentifierSchema,
  createdAt: TimestampSchema,
  startedAt: TimestampSchema.nullable(),
  completedAt: TimestampSchema.nullable(),
  cancellationRequested: z.boolean(),
  failure: FailureSchema.nullable(),
  resultArtifactId: Sha256Schema.nullable(),
  rerunVerification: z.enum(['not-declared', 'pending', 'pass', 'fail'])
}).strict()

export const RunRecordSchema = z.object({
  runId: Sha256Schema,
  revisionIds: z.array(Sha256Schema).min(1),
  scientificIdentityVersion: z.literal('workspace-scientific-run-v1'),
  createdAt: TimestampSchema,
  attempts: z.array(AttemptRecordSchema)
}).strict()

export const WorkspaceEventSchema = z.object({
  eventId: Sha256Schema,
  attemptId: Sha256Schema,
  sequence: z.number().int().positive(),
  type: z.enum(['queued', 'started', 'progress', 'cancellation-requested', 'cancelled', 'completed', 'failed', 'interrupted', 'recovered', 'resource-exhausted', 'rerun-verified']),
  at: TimestampSchema,
  data: z.record(z.union([z.string(), z.number().finite(), z.boolean(), z.null()]))
}).strict()

export const SpecificationCheckpointSchema = z.object({
  checkpointId: Sha256Schema,
  runId: Sha256Schema,
  attemptId: Sha256Schema,
  kind: z.literal('specification'),
  continuation: z.literal(false),
  restartMode: z.literal('from-specification'),
  specificationDigest: Sha256Schema,
  specificationObjectDigest: Sha256Schema,
  snapshotDigest: Sha256Schema,
  modelDigests: z.array(Sha256Schema).min(1),
  engineDigests: z.array(Sha256Schema).min(1),
  createdAt: TimestampSchema
}).strict()

export const ArtifactRecordSchema = z.object({
  artifactId: Sha256Schema,
  attemptId: Sha256Schema,
  name: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.-]{0,159}$/),
  kind: z.enum(['result', 'log', 'report-html', 'report-json', 'report-csv', 'report-svg', 'bundle']),
  mediaType: z.string().min(1).max(100),
  digest: Sha256Schema,
  bytes: z.number().int().nonnegative(),
  createdAt: TimestampSchema
}).strict()

export const WorkspaceRunResultSchema = z.object({
  contractVersion: z.literal(WORKSPACE_CONTRACT_VERSION),
  runId: Sha256Schema,
  attemptId: Sha256Schema,
  revisionId: Sha256Schema,
  entries: z.array(z.object({ entryId: IdentifierSchema, result: PortfolioResultSchema }).strict()).min(1),
  numericalContract: NumericalContractSchema
}).strict()

export const HistoryFilterSchema = z.object({
  release: z.string().max(160).optional(),
  model: IdentifierSchema.optional(),
  taxon: TaxonSchema.optional(),
  tissue: TissueSchema.optional(),
  status: z.union([QueueStateSchema, RunOutcomeSchema]).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0)
}).strict()

export const HistoryItemSchema = z.object({
  attempt: AttemptRecordSchema,
  experimentId: z.string().uuid(),
  experimentName: z.string().min(1),
  taxonId: TaxonSchema,
  tissueId: TissueSchema.nullable(),
  modelIds: z.array(IdentifierSchema).min(1),
  releaseIds: z.array(z.string().min(1)).min(1)
}).strict()
export const HistoryResponseSchema = z.object({ items: z.array(HistoryItemSchema), total: z.number().int().nonnegative(), limit: z.number().int().positive(), offset: z.number().int().nonnegative() }).strict()

export const AttemptDetailSchema = z.object({
  attempt: AttemptRecordSchema,
  revision: RevisionRecordSchema,
  experiment: ExperimentRecordSchema
}).strict()

export const RunCreateRequestSchema = z.object({ revisionId: Sha256Schema, resourceProfileId: IdentifierSchema.optional() }).strict()
export const RestartRequestSchema = z.object({ resourceProfileId: IdentifierSchema.optional() }).strict()

export const ComparisonRequestSchema = z.object({ leftAttemptId: Sha256Schema, rightAttemptId: Sha256Schema, contract: NumericalContractSchema }).strict()
export const ComparisonRecordSchema = z.object({
  comparisonId: Sha256Schema,
  leftAttemptId: Sha256Schema,
  rightAttemptId: Sha256Schema,
  contract: NumericalContractSchema,
  status: z.enum(['pass', 'fail', 'incompatible']),
  specificationChanged: z.boolean(),
  differences: z.array(z.object({ path: z.string().min(1), left: z.number().finite(), right: z.number().finite(), absoluteDifference: z.number().finite().nonnegative(), withinContract: z.boolean() }).strict()).max(10_000),
  createdAt: TimestampSchema
}).strict()

export const ReportRequestSchema = z.object({ attemptId: Sha256Schema }).strict()
export const ReportDocumentSchema = z.object({
  reportVersion: z.literal(WORKSPACE_CONTRACT_VERSION),
  reportId: Sha256Schema,
  experiment: z.object({ experimentId: z.string().uuid(), name: z.string().min(1), description: z.string() }).strict(),
  revision: z.object({ revisionId: Sha256Schema, specificationDigest: Sha256Schema, snapshotDigest: Sha256Schema }).strict(),
  attempt: AttemptRecordSchema,
  result: WorkspaceRunResultSchema,
  warnings: z.array(z.string()),
  scientificBoundaries: z.array(z.string()).min(1)
}).strict()
export const ReportRecordSchema = z.object({
  reportId: Sha256Schema,
  attemptId: Sha256Schema,
  createdAt: TimestampSchema,
  artifacts: z.array(ArtifactRecordSchema).length(4),
  csp: z.literal("default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
}).strict()

export const BundleObjectSchema = z.object({ path: z.string().regex(/^objects\/sha256\/[a-f0-9]{64}$/), digest: Sha256Schema, bytes: z.number().int().nonnegative(), mediaType: z.string().min(1) }).strict()
export const PortableBundleManifestSchema = z.object({
  profile: z.literal(PORTABLE_BUNDLE_PROFILE),
  experiment: ExperimentRecordSchema,
  revision: RevisionRecordSchema.omit({ specification: true }),
  objects: z.array(BundleObjectSchema).min(2).max(256),
  snapshotPath: z.literal('snapshot.json'),
  rerun: z.object({ contract: NumericalContractSchema, expectedResultDigest: Sha256Schema.nullable() }).strict()
}).strict()

export const BundleImportRequestSchema = z.object({ bundleBase64: z.string().min(1).max(WORKSPACE_BUNDLE_BASE64_MAX_LENGTH).regex(/^[A-Za-z0-9+/]+={0,2}$/) }).strict()
export const BundleExportResponseSchema = z.object({ profile: z.literal(PORTABLE_BUNDLE_PROFILE), fileName: z.string().regex(/^[A-Za-z0-9_.-]+\.zip$/), bundleBase64: z.string().min(1) }).strict()
