import { z } from 'zod'
import { Sha256DigestSchema, OffsetDatetimeSchema, SemverSchema, NcbiTaxonIdSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, JsonValueSchema } from './commons/schemas.js'

export const DERIVED_CONTRACT_VERSION = '1.0.0'
export const DERIVED_CSRF_HEADER = 'x-biochemical-csrf'
export const DERIVED_CSRF_VALUE = 'derived-review-v1'

export const DerivedDigestSchema = Sha256DigestSchema
export const QualifiedIdSchema = z.string().min(3).max(200).regex(/^[A-Za-z][A-Za-z0-9_.-]*:[A-Za-z0-9][A-Za-z0-9_.-]*$/)
export const DerivedSlugSchema = z.string().max(100).regex(/^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$/)
export const SemanticVersionSchema = SemverSchema
export const SourceFamilySchema = z.enum(['core', 'atlas', 'evidence', 'parameters', 'apap', 'spatial'])
export const DerivedClassificationSchema = z.enum(['predicted', 'fitted', 'estimated', 'computed'])
export const ReviewStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'superseded', 'invalidated'])
export const ReviewActionSchema = z.enum(['accepted', 'rejected', 'superseded', 'invalidated', 'reproduction-verified', 'recalculation-requested'])

export { JsonValueSchema }

export const DimensionSchema = z.object({
  amount: z.number().int().min(-8).max(8),
  mass: z.number().int().min(-8).max(8),
  length: z.number().int().min(-8).max(8),
  time: z.number().int().min(-8).max(8),
  temperature: z.number().int().min(-8).max(8),
  current: z.number().int().min(-8).max(8),
  luminosity: z.number().int().min(-8).max(8)
}).strict()

export const DerivedUnitSchema = z.object({
  id: DerivedSlugSchema,
  symbol: NonEmptyStringSchema.max(64),
  scale_to_si: FiniteNumberSchema.positive(),
  dimension: DimensionSchema
}).strict()

export const DerivedQuantitySchema = z.object({ value: FiniteNumberSchema, unit: DerivedUnitSchema }).strict()
const ContextQualifierSchema = z.object({ name: DerivedSlugSchema, value: NonEmptyStringSchema.max(500) }).strict()

export const ScientificContextSchema = z.object({
  taxon_id: NcbiTaxonIdSchema.nullable(),
  tissue_id: QualifiedIdSchema.nullable(),
  cell_type_id: QualifiedIdSchema.nullable(),
  compartment_id: QualifiedIdSchema.nullable(),
  biological_sex: z.enum(['female', 'male', 'intersex', 'not-applicable', 'unknown']).nullable(),
  life_stage_id: QualifiedIdSchema.nullable(),
  strain: z.string().max(200).nullable(),
  disease_ids: z.array(QualifiedIdSchema),
  route: z.string().max(200).nullable(),
  dose: DerivedQuantitySchema.nullable(),
  time: DerivedQuantitySchema.nullable(),
  ph: FiniteNumberSchema.min(0).max(14).nullable(),
  temperature: DerivedQuantitySchema.nullable(),
  assay_id: QualifiedIdSchema.nullable(),
  spatial_region_id: QualifiedIdSchema.nullable(),
  model_scope: NonEmptyStringSchema.max(1000),
  qualifiers: z.array(ContextQualifierSchema)
}).strict().superRefine((value, context) => {
  if (new Set(value.disease_ids).size !== value.disease_ids.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['disease_ids'], message: 'disease_ids must be unique' })
  const names = value.qualifiers.map((item) => item.name)
  if (new Set(names).size !== names.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['qualifiers'], message: 'context qualifier names must be unique' })
})

export const ApplicabilityBoundarySchema = z.object({
  variable: DerivedSlugSchema,
  lower: FiniteNumberSchema.nullable(),
  upper: FiniteNumberSchema.nullable(),
  unit: DerivedUnitSchema.nullable(),
  inclusive: z.boolean()
}).strict().superRefine((value, context) => {
  if (value.lower === null && value.upper === null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'an applicability boundary requires lower or upper' })
  if (value.lower !== null && value.upper !== null && value.lower > value.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'applicability boundary lower exceeds upper' })
})

export const ApplicabilitySchema = z.object({
  status: z.enum(['exact', 'bounded', 'extrapolated', 'not-applicable']),
  boundaries: z.array(ApplicabilityBoundarySchema),
  exclusions: z.array(z.string()),
  rationale: NonEmptyStringSchema.max(2000)
}).strict().superRefine((value, context) => {
  if (value.status === 'bounded' && value.boundaries.length === 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ['boundaries'], message: 'bounded applicability requires boundaries' })
})

const ScalarValueSchema = z.object({ kind: z.literal('scalar'), value: FiniteNumberSchema }).strict()
const NormalDistributionSchema = z.object({ family: z.literal('normal'), mean: FiniteNumberSchema, standard_deviation: FiniteNumberSchema.positive() }).strict()
const LognormalDistributionSchema = z.object({ family: z.literal('lognormal'), log_mean: FiniteNumberSchema, log_standard_deviation: FiniteNumberSchema.positive() }).strict()
const UniformDistributionSchema = z.object({ family: z.literal('uniform'), lower: FiniteNumberSchema, upper: FiniteNumberSchema }).strict().superRefine((value, context) => {
  if (value.lower >= value.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'uniform lower must be less than upper' })
})
const EmpiricalDistributionSchema = z.object({
  family: z.literal('empirical'),
  points: z.array(z.object({ value: FiniteNumberSchema, probability: FiniteNumberSchema.positive().max(1) }).strict()).min(2).max(1000)
}).strict().superRefine((value, context) => {
  const total = value.points.reduce((sum, item) => sum + item.probability, 0)
  if (Math.abs(total - 1) > 1e-9) context.addIssue({ code: z.ZodIssueCode.custom, path: ['points'], message: 'empirical probabilities must sum to one' })
})
const DistributionSchema = z.union([NormalDistributionSchema, LognormalDistributionSchema, UniformDistributionSchema, EmpiricalDistributionSchema])
const DistributionValueSchema = z.object({ kind: z.literal('distribution'), distribution: DistributionSchema }).strict()
export const AssertionValueSchema = z.discriminatedUnion('kind', [ScalarValueSchema, DistributionValueSchema])

export const UncertaintyComponentSchema = z.object({
  category: z.enum(['biological', 'measurement', 'structural', 'contextual', 'numerical']),
  representation: z.enum(['standard-deviation', 'relative-standard-deviation', 'interval', 'qualitative']),
  value: FiniteNumberSchema.nonnegative().nullable(),
  lower: FiniteNumberSchema.nullable(),
  upper: FiniteNumberSchema.nullable(),
  unit: DerivedUnitSchema.nullable(),
  description: NonEmptyStringSchema.max(1000)
}).strict().superRefine((item, context) => {
  if (item.representation === 'standard-deviation') {
    if (item.value === null || item.value <= 0 || item.unit === null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'standard-deviation uncertainty requires positive value and unit' })
    if (item.lower !== null || item.upper !== null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'standard-deviation uncertainty cannot carry interval bounds' })
  } else if (item.representation === 'relative-standard-deviation') {
    if (item.value === null || item.value > 1 || item.unit !== null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'relative uncertainty requires a fraction and no unit' })
    if (item.lower !== null || item.upper !== null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'relative uncertainty cannot carry interval bounds' })
  } else if (item.representation === 'interval') {
    if (item.lower === null || item.upper === null || item.lower >= item.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'interval uncertainty requires ordered bounds' })
    if (item.value !== null || item.unit === null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'interval uncertainty requires a unit and no value' })
  } else if ([item.value, item.lower, item.upper, item.unit].some((value) => value !== null)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'qualitative uncertainty cannot carry numeric fields' })
  }
})

export const UncertaintySchema = z.object({
  interpretation: z.enum(['exact', 'aleatory', 'epistemic', 'combined']),
  components: z.array(UncertaintyComponentSchema),
  method: NonEmptyStringSchema.max(1000)
}).strict().superRefine((value, context) => {
  if ((value.interpretation === 'exact') !== (value.components.length === 0)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['components'], message: 'exact uncertainty requires no components and other kinds require components' })
})

export const ReleaseDependencySchema = z.object({ type: z.literal('release'), family: SourceFamilySchema, release_id: NonEmptyStringSchema.max(200), digest: DerivedDigestSchema }).strict()
export const RecordDependencySchema = z.object({ type: z.literal('record'), family: SourceFamilySchema, release_id: NonEmptyStringSchema.max(200), release_digest: DerivedDigestSchema, collection: DerivedSlugSchema, record_id: NonEmptyStringSchema.max(300), digest: DerivedDigestSchema }).strict()
export const ModelDependencySchema = z.object({ type: z.literal('model'), model_id: DerivedSlugSchema, version: SemanticVersionSchema, digest: DerivedDigestSchema }).strict()
export const TransformDependencySchema = z.object({ type: z.literal('transform'), transform_id: DerivedSlugSchema, version: SemanticVersionSchema, digest: DerivedDigestSchema }).strict()
export const ArtifactDependencySchema = z.object({ type: z.literal('artifact'), artifact_id: DerivedSlugSchema, role: z.enum(['input', 'output', 'analysis', 'reproduction']), digest: DerivedDigestSchema }).strict()
export const DependencySchema = z.discriminatedUnion('type', [ReleaseDependencySchema, RecordDependencySchema, ModelDependencySchema, TransformDependencySchema, ArtifactDependencySchema])

export const ReproductionSchema = z.object({
  status: z.enum(['not-attempted', 'producer-verified', 'failed']),
  method: NonEmptyStringSchema.max(1000),
  protocol_artifact_digest: DerivedDigestSchema.nullable(),
  result_artifact_digest: DerivedDigestSchema.nullable(),
  tolerance: FiniteNumberSchema.nonnegative().nullable()
}).strict().superRefine((value, context) => {
  if (value.status === 'not-attempted' && value.result_artifact_digest !== null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'not-attempted reproduction cannot have a result artifact' })
  if (value.status !== 'not-attempted' && (value.protocol_artifact_digest === null || value.result_artifact_digest === null)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'attempted reproduction requires protocol and result artifacts' })
})

export const DerivedAssertionSchema = z.object({
  contract_version: z.literal(DERIVED_CONTRACT_VERSION),
  subject_id: QualifiedIdSchema,
  property: DerivedSlugSchema,
  statement: NonEmptyStringSchema.max(4000),
  classification: DerivedClassificationSchema,
  value: AssertionValueSchema,
  unit: DerivedUnitSchema,
  context: ScientificContextSchema,
  applicability: ApplicabilitySchema,
  uncertainty: UncertaintySchema,
  dependencies: z.array(DependencySchema).min(3).max(100),
  reproduction: ReproductionSchema,
  limitations: z.array(NonEmptyStringSchema).min(1).max(50)
}).strict().superRefine((value, context) => {
  const types = new Set(value.dependencies.map((item) => item.type))
  for (const type of ['release', 'model', 'artifact']) if (!types.has(type)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['dependencies'], message: `assertion lineage is missing dependency: ${type}` })
  const identities = value.dependencies.map((item) => JSON.stringify(item))
  if (new Set(identities).size !== identities.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['dependencies'], message: 'assertion dependencies must be unique' })
})

export const AssertionObjectSchema = z.object({ digest: DerivedDigestSchema, assertion: DerivedAssertionSchema }).strict()
export const ContentObjectSchema = z.object({
  kind: z.enum(['model', 'transform', 'artifact']),
  object_id: DerivedSlugSchema,
  version: SemanticVersionSchema.nullable(),
  digest: DerivedDigestSchema,
  content: JsonValueSchema
}).strict().superRefine((value, context) => {
  if ((value.kind === 'model' || value.kind === 'transform') && value.version === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ['version'], message: 'model and transform objects require a version' })
  if (value.kind === 'artifact' && value.version !== null) context.addIssue({ code: z.ZodIssueCode.custom, path: ['version'], message: 'artifact objects cannot have a version' })
})

export const SubmissionBundleSchema = z.object({
  contract_version: z.literal(DERIVED_CONTRACT_VERSION),
  producer: z.object({ name: DerivedSlugSchema, version: SemanticVersionSchema }).strict(),
  objects: z.array(ContentObjectSchema).min(2).max(100),
  assertions: z.array(AssertionObjectSchema).min(1).max(100)
}).strict().superRefine((value, context) => {
  const objectDigests = value.objects.map((item) => item.digest)
  if (new Set(objectDigests).size !== objectDigests.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['objects'], message: 'content object digests must be unique' })
  const assertionDigests = value.assertions.map((item) => item.digest)
  if (new Set(assertionDigests).size !== assertionDigests.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['assertions'], message: 'assertion digests must be unique' })
})
export const BundleSubmissionSchema = z.object({ digest: DerivedDigestSchema, bundle: SubmissionBundleSchema }).strict()

export const ReviewerSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_.:@/-]{2,199}$/),
  name: NonEmptyStringSchema.max(200),
  organization: NonEmptyStringSchema.max(200),
  role: NonEmptyStringSchema.max(200)
}).strict()

export const ReviewEventRequestSchema = z.object({
  action: ReviewActionSchema,
  reviewer: ReviewerSchema,
  reason: NonEmptyStringSchema.max(4000),
  related_assertion_digest: DerivedDigestSchema.nullable().default(null),
  reproduction_artifact_digest: DerivedDigestSchema.nullable().default(null)
}).strict().superRefine((value, context) => {
  if ((value.action === 'superseded') !== (value.related_assertion_digest !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['related_assertion_digest'], message: 'only superseded events require related_assertion_digest' })
  if ((value.action === 'reproduction-verified') !== (value.reproduction_artifact_digest !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['reproduction_artifact_digest'], message: 'only reproduction-verified events require an artifact digest' })
})

export const SignedReviewEventSchema = z.object({
  contract_version: z.literal(DERIVED_CONTRACT_VERSION),
  assertion_digest: DerivedDigestSchema,
  sequence: PositiveIntSchema,
  action: ReviewActionSchema,
  reviewer: ReviewerSchema,
  occurred_at: OffsetDatetimeSchema,
  reason: z.string(),
  related_assertion_digest: DerivedDigestSchema.nullable(),
  reproduction_artifact_digest: DerivedDigestSchema.nullable(),
  previous_event_digest: DerivedDigestSchema.nullable(),
  event_digest: DerivedDigestSchema,
  key_id: DerivedDigestSchema,
  signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/)
}).strict()

export const AssertionStateSchema = z.object({
  review_status: ReviewStatusSchema,
  reproduction_verified: z.boolean(),
  recalculation_requested: z.boolean(),
  superseded_by: DerivedDigestSchema.nullable(),
  event_count: NonNegativeIntSchema
}).strict()
export const AssertionDetailSchema = z.object({ digest: DerivedDigestSchema, assertion: DerivedAssertionSchema, state: AssertionStateSchema }).strict()
export const AssertionListSchema = z.object({ layer: z.enum(['derived-review-workspace', 'reviewed-derived']), items: z.array(AssertionDetailSchema) }).strict()
export const AssertionEventsSchema = z.object({ assertion_digest: DerivedDigestSchema, items: z.array(SignedReviewEventSchema) }).strict()
export const EventAppendResponseSchema = z.object({ event: SignedReviewEventSchema, state: AssertionStateSchema }).strict()

export const SourceSelectorSchema = z.object({ family: SourceFamilySchema, release_id: NonEmptyStringSchema.max(200), collection: DerivedSlugSchema, record_id: NonEmptyStringSchema.max(300).nullable().default(null) }).strict()
export const DerivedSelectorSchema = z.object({ subject_id: QualifiedIdSchema.nullable().default(null), classification: DerivedClassificationSchema.nullable().default(null) }).strict()
export const LayeredQuerySchema = z.object({
  layers: z.array(z.enum(['source', 'reviewed-derived'])).min(1).max(2),
  source: SourceSelectorSchema.nullable(),
  reviewed_derived: DerivedSelectorSchema.nullable()
}).strict().superRefine((value, context) => {
  if (new Set(value.layers).size !== value.layers.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['layers'], message: 'layers must be unique' })
  if (value.layers.includes('source') !== (value.source !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['source'], message: 'the source layer requires exactly one source selector' })
  if (!value.layers.includes('reviewed-derived') && value.reviewed_derived !== null) context.addIssue({ code: z.ZodIssueCode.custom, path: ['reviewed_derived'], message: 'reviewed_derived selector requires its layer' })
})

export const SourceRecordSchema = z.object({
  family: SourceFamilySchema,
  release_id: NonEmptyStringSchema,
  release_digest: DerivedDigestSchema,
  collection: DerivedSlugSchema,
  record_digest: DerivedDigestSchema,
  record: z.record(JsonValueSchema)
}).strict()
export const SourceRecordsResponseSchema = z.object({ layer: z.literal('source'), items: z.array(SourceRecordSchema) }).strict()
export const LayeredQueryResponseSchema = z.object({
  layers: z.array(z.enum(['source', 'reviewed-derived'])).min(1).max(2),
  source: z.array(SourceRecordSchema).optional(),
  'reviewed-derived': z.array(AssertionDetailSchema).optional()
}).strict()

export const DependencyChangeSchema = z.object({ previous: DependencySchema, current_digest: DerivedDigestSchema }).strict()
export const ImpactRequestSchema = z.object({ changes: z.array(DependencyChangeSchema).min(1).max(100) }).strict()
const ImpactItemSchema = z.object({
  assertion_digest: DerivedDigestSchema,
  state: AssertionStateSchema,
  reasons: z.array(z.object({ dependency: DependencySchema, pinned_digest: DerivedDigestSchema, current_digest: DerivedDigestSchema }).strict()),
  automatically_invalidated: z.literal(false)
}).strict()
export const ImpactResponseSchema = z.object({ items: z.array(ImpactItemSchema), automatic_invalidation: z.literal(false) }).strict()

export const MeasurementSchema = z.object({ record: RecordDependencySchema, value: FiniteNumberSchema, unit: DerivedUnitSchema, context: ScientificContextSchema }).strict()
export const MeasurementComparisonRequestSchema = z.object({ assertion_digest: DerivedDigestSchema, measurement: MeasurementSchema }).strict()
export const VerifiedMeasurementSchema = MeasurementSchema.extend({
  trust: z.object({
    eligibility: z.literal('verified-measured-observation'),
    data_origin: z.literal('measured'),
    source_id: NonEmptyStringSchema,
    source_class: z.literal('trusted-external'),
    evidence_locator_ids: z.array(NonEmptyStringSchema),
    evidence_class: z.literal('measured')
  }).strict()
}).strict()
export const MeasurementComparisonResponseSchema = z.object({
  assertion_digest: DerivedDigestSchema,
  measurement: VerifiedMeasurementSchema,
  unit_compatible: z.boolean(),
  context_compatible: z.boolean(),
  comparable: z.boolean(),
  comparison: z.object({ derived_si: FiniteNumberSchema, measurement_si: FiniteNumberSchema, absolute_difference_si: FiniteNumberSchema, relative_difference: FiniteNumberSchema.nullable() }).strict().nullable(),
  automatically_invalidated: z.literal(false)
}).strict()

export const DerivedHealthUpstreamSchema = z.object({
  status: z.literal('ok'),
  journal_mode: z.literal('wal'),
  signing_key_id: DerivedDigestSchema,
  signing_public_key: NonEmptyStringSchema,
  bundles: NonNegativeIntSchema,
  assertions: NonNegativeIntSchema,
  content_objects: NonNegativeIntSchema,
  events: NonNegativeIntSchema
}).strict()
export const DerivedHealthSchema = DerivedHealthUpstreamSchema.omit({ signing_key_id: true, signing_public_key: true })
export const ReplayResponseSchema = z.object({ status: z.literal('valid'), bundles: NonNegativeIntSchema, assertions: NonNegativeIntSchema, content_objects: NonNegativeIntSchema, events: NonNegativeIntSchema }).strict()
export const BundleSubmitResponseSchema = z.object({ created: z.boolean(), bundle_digest: DerivedDigestSchema, assertion_digests: z.array(DerivedDigestSchema).min(1) }).strict()
export const BundleDetailSchema = z.object({ digest: DerivedDigestSchema, submitted_at: OffsetDatetimeSchema, bundle: SubmissionBundleSchema }).strict()
export const ReproduceRequestSchema = z.object({ run_id: DerivedDigestSchema, reviewer: ReviewerSchema, reason: NonEmptyStringSchema.max(4000) }).strict()
