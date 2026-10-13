import { z } from 'zod'
import { Sha256HexSchema, Sha256DigestSchema, ReleaseIdSchema, SourceIdSchema, NcbiTaxonIdSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, releaseRefSchema } from './commons/schemas.js'

export const PARAMETER_RELEASE_ID = 'parameter-evidence-benchmark-v1.0.0'
export const PARAMETER_RELEASE_DIGEST = '6e72e6bebf3b18aa2edd95dae7e719799cb6916a3e58bb68e697347eebce7fa9'
export const PARAMETER_CONTRACT_VERSION = '1.0.0'

const QualifiedIdSchema = z.string().regex(/^(?:PARAMETER|CONTEXT|ASSAY|EVIDENCE|CANDIDATE|CORRELATION|DATASET|OBSERVATION|UNCERTAINTY|PARTITION|GO|UBERON):[A-Za-z0-9_.-]+$/)
const UnitSchema = z.enum(['1', 's', 's^-1', 'min^-1', 'umol/L', 'mmol/L', 'umol/L/s', 'mmol/L/min'])
const EvidenceClassSchema = z.enum(['measured', 'synthetic', 'assumption'])

export const ParameterReleaseRefSchema = releaseRefSchema(ReleaseIdSchema, PARAMETER_CONTRACT_VERSION, Sha256HexSchema)

const UpstreamCatalogEntrySchema = z.object({
  release_id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  schema_version: z.literal(PARAMETER_CONTRACT_VERSION),
  release_digest: Sha256HexSchema,
  manifest_path: z.string().regex(/^[a-z0-9.-]+\/manifest\.json$/)
}).strict()

export const UpstreamParameterCatalogSchema = z.object({
  catalog_schema_version: z.literal(PARAMETER_CONTRACT_VERSION),
  releases: z.array(UpstreamCatalogEntrySchema)
}).strict()

export const ParameterContextSchema = z.object({
  id: QualifiedIdSchema,
  name: NonEmptyStringSchema,
  taxon_id: NcbiTaxonIdSchema.nullable(),
  tissue_id: QualifiedIdSchema.nullable(),
  compartment_id: QualifiedIdSchema.nullable(),
  assay_id: QualifiedIdSchema,
  ph: FiniteNumberSchema.min(0).max(14).nullable(),
  temperature: z.object({ value: FiniteNumberSchema.positive(), unit: z.literal('K') }).strict().nullable(),
  biological_scope: z.enum(['biological', 'synthetic'])
}).strict()

export const ParameterDefinitionSchema = z.object({
  id: QualifiedIdSchema,
  name: NonEmptyStringSchema,
  model_symbol: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  dimension: z.enum(['dimensionless', 'time', 'first_order_rate', 'concentration', 'concentration_rate']),
  canonical_unit: UnitSchema,
  reference_context_id: QualifiedIdSchema,
  description: NonEmptyStringSchema
}).strict()

const ApplicabilitySchema = z.object({
  status: z.enum(['applicable', 'excluded']),
  target_context_id: QualifiedIdSchema,
  qualifiers: z.array(z.enum(['exact-context', 'competing-context', 'unit-conversion-required', 'taxon-mismatch', 'incompatible-unit'])).min(1),
  rationale: NonEmptyStringSchema
}).strict()

const CandidateBase = {
  id: QualifiedIdSchema,
  parameter_id: QualifiedIdSchema,
  context_id: QualifiedIdSchema,
  unit: UnitSchema,
  evidence_class: EvidenceClassSchema,
  evidence_locator_ids: z.array(QualifiedIdSchema).min(1),
  applicability: ApplicabilitySchema,
  note: NonEmptyStringSchema
}

const PointCandidateSchema = z.object({ ...CandidateBase, value_kind: z.literal('point'), value: FiniteNumberSchema }).strict()
const IntervalCandidateSchema = z.object({
  ...CandidateBase,
  value_kind: z.literal('interval'),
  lower: FiniteNumberSchema,
  upper: FiniteNumberSchema,
  interval_type: z.enum(['range', 'confidence', 'credible'])
}).strict()
const DistributionSchema = z.discriminatedUnion('family', [
  z.object({ family: z.literal('normal'), mean: FiniteNumberSchema, standard_deviation: FiniteNumberSchema.positive() }).strict(),
  z.object({ family: z.literal('lognormal'), log_mean: FiniteNumberSchema, log_standard_deviation: FiniteNumberSchema.positive() }).strict(),
  z.object({ family: z.literal('uniform'), lower: FiniteNumberSchema, upper: FiniteNumberSchema }).strict()
])
const DistributionCandidateSchema = z.object({ ...CandidateBase, value_kind: z.literal('distribution'), distribution: DistributionSchema }).strict()

export const ParameterCandidateSchema = z.discriminatedUnion('value_kind', [PointCandidateSchema, IntervalCandidateSchema, DistributionCandidateSchema]).superRefine((candidate, context) => {
  if (candidate.value_kind === 'interval' && candidate.lower >= candidate.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'candidate interval must be ordered' })
  if (candidate.value_kind === 'distribution' && candidate.distribution.family === 'uniform' && candidate.distribution.lower >= candidate.distribution.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'uniform bounds must be ordered' })
})

export const ParameterEvidenceLocatorSchema = z.object({
  id: QualifiedIdSchema,
  source_id: SourceIdSchema,
  evidence_class: EvidenceClassSchema,
  locator_type: z.enum(['publication', 'database-record', 'synthetic-protocol', 'assumption-rationale']),
  citation: NonEmptyStringSchema,
  locator: NonEmptyStringSchema,
  url: z.string().url()
}).strict()

export const ParameterCorrelationSchema = z.object({
  id: QualifiedIdSchema,
  candidate_ids: z.array(QualifiedIdSchema).min(2).max(20),
  matrix: z.array(z.array(FiniteNumberSchema).min(2).max(20)).min(2).max(20),
  matrix_type: z.literal('correlation'),
  positive_semidefinite_tolerance: FiniteNumberSchema.min(0).max(1e-6),
  rationale: NonEmptyStringSchema
}).strict()

export const UncertaintyComponentSchema = z.object({
  category: z.enum(['biological', 'measurement', 'structural', 'contextual', 'numerical']),
  representation: z.enum(['absolute-standard-deviation', 'relative-standard-deviation', 'qualitative']),
  value: FiniteNumberSchema.nonnegative().nullable(),
  unit: UnitSchema.nullable(),
  description: NonEmptyStringSchema
}).strict()

export const ParameterUncertaintySchema = z.object({
  id: QualifiedIdSchema,
  subject_id: QualifiedIdSchema,
  components: z.array(UncertaintyComponentSchema).min(1)
}).strict()

export const ParameterDatasetSchema = z.object({
  id: QualifiedIdSchema,
  title: NonEmptyStringSchema,
  data_origin: z.enum(['measured', 'synthetic']),
  context_id: QualifiedIdSchema,
  parameter_ids: z.array(QualifiedIdSchema).min(1),
  independent_variable: NonEmptyStringSchema,
  independent_unit: UnitSchema,
  observable: NonEmptyStringSchema,
  observable_unit: UnitSchema,
  evidence_locator_ids: z.array(QualifiedIdSchema).min(1),
  source_id: SourceIdSchema,
  generation_method: NonEmptyStringSchema.nullable(),
  bounded_scope: NonEmptyStringSchema
}).strict()

export const ParameterObservationSchema = z.object({
  id: QualifiedIdSchema,
  dataset_id: QualifiedIdSchema,
  replicate_id: NonEmptyStringSchema,
  independent_value: FiniteNumberSchema,
  value: FiniteNumberSchema,
  data_origin: z.enum(['measured', 'synthetic'])
}).strict()

export const ParameterPartitionSchema = z.object({
  id: QualifiedIdSchema,
  dataset_id: QualifiedIdSchema,
  fixed: z.literal(true),
  assignment_method: z.literal('explicit-identifiers-v1'),
  calibration_observation_ids: z.array(QualifiedIdSchema).min(1),
  validation_observation_ids: z.array(QualifiedIdSchema).min(1),
  rationale: NonEmptyStringSchema
}).strict().refine((value) => !value.calibration_observation_ids.some((id) => value.validation_observation_ids.includes(id)), 'calibration and validation observations must be disjoint')

export const UpstreamParameterCandidatesResponseSchema = z.object({
  release: ParameterReleaseRefSchema,
  items: z.array(ParameterCandidateSchema),
  parameters: z.array(ParameterDefinitionSchema),
  contexts: z.array(ParameterContextSchema),
  evidence: z.array(ParameterEvidenceLocatorSchema),
  uncertainties: z.array(ParameterUncertaintySchema),
  correlations: z.array(ParameterCorrelationSchema)
}).strict()

export const UpstreamParameterDatasetsResponseSchema = z.object({
  release: ParameterReleaseRefSchema,
  items: z.array(ParameterDatasetSchema),
  observations: z.array(ParameterObservationSchema),
  partitions: z.array(ParameterPartitionSchema),
  uncertainties: z.array(ParameterUncertaintySchema)
}).strict()

export const UpstreamParameterContextsResponseSchema = z.object({
  release: ParameterReleaseRefSchema,
  items: z.array(ParameterContextSchema),
  options: z.object({
    taxon_ids: z.array(NcbiTaxonIdSchema),
    tissue_ids: z.array(QualifiedIdSchema),
    compartment_ids: z.array(QualifiedIdSchema),
    assay_ids: z.array(QualifiedIdSchema),
    ph_values: z.array(FiniteNumberSchema),
    temperatures: z.array(z.object({ value: FiniteNumberSchema.positive(), unit: z.literal('K') }).strict())
  }).strict()
}).strict()

export const TaxonTransformSchema = z.object({
  id: z.string().regex(/^TRANSFORM:[A-Za-z0-9_.-]+$/),
  candidateId: QualifiedIdSchema,
  sourceTaxonId: NcbiTaxonIdSchema,
  targetTaxonId: NcbiTaxonIdSchema,
  scaleFactor: FiniteNumberSchema.positive(),
  rationale: NonEmptyStringSchema
}).strict()

export const ParameterOptionsQuerySchema = z.object({
  parameter_id: QualifiedIdSchema.default('PARAMETER:DECAY-K'),
  target_context_id: QualifiedIdSchema.default('CONTEXT:SYNTHETIC-DECAY')
}).strict()

const CandidateDecisionSchema = z.object({
  candidateId: QualifiedIdSchema,
  decision: z.enum(['selected', 'supporting', 'excluded']),
  role: z.enum(['estimate', 'bounds', 'prior']).nullable(),
  canonicalUnit: UnitSchema,
  canonicalValue: FiniteNumberSchema.nullable(),
  rationale: NonEmptyStringSchema,
  labels: z.array(z.enum(['synthetic', 'assumption', 'measured', 'unit-converted', 'context-transformed']))
}).strict()

export const ParameterOptionsResponseSchema = z.object({
  contractVersion: z.literal(PARAMETER_CONTRACT_VERSION),
  release: ParameterReleaseRefSchema,
  parameter: ParameterDefinitionSchema,
  targetContext: ParameterContextSchema,
  selectedCandidateId: QualifiedIdSchema,
  selectedValue: FiniteNumberSchema,
  canonicalUnit: UnitSchema,
  bounds: z.object({ lower: FiniteNumberSchema, upper: FiniteNumberSchema, candidateId: QualifiedIdSchema }).strict(),
  prior: z.object({ family: z.literal('normal'), mean: FiniteNumberSchema, standardDeviation: FiniteNumberSchema.positive(), candidateId: QualifiedIdSchema }).strict(),
  decisions: z.array(CandidateDecisionSchema).min(1),
  evidence: z.array(ParameterEvidenceLocatorSchema),
  correlations: z.array(ParameterCorrelationSchema),
  uncertainties: z.array(ParameterUncertaintySchema),
  datasets: z.array(ParameterDatasetSchema),
  observations: z.array(ParameterObservationSchema),
  partitions: z.array(ParameterPartitionSchema),
  labels: z.array(z.enum(['synthetic', 'assumption'])).min(1)
}).strict()

const StudyControlsSchema = z.object({
  sensitivityRelativeStep: FiniteNumberSchema.min(1e-8).max(0.1).default(1e-4),
  morrisTrajectories: z.number().int().min(4).max(100).default(12),
  morrisLevels: z.number().int().min(4).max(20).default(6),
  optimizerMaxIterations: z.number().int().min(1).max(1000).default(200),
  optimizerTolerance: FiniteNumberSchema.min(1e-12).max(0.1).default(1e-10),
  posteriorChains: z.number().int().min(2).max(8).default(4),
  posteriorWarmup: z.number().int().min(0).max(10000).default(300),
  posteriorSamples: z.number().int().min(20).max(20000).default(700),
  posteriorProposalScale: FiniteNumberSchema.positive().max(1).default(0.002),
  observationSigma: FiniteNumberSchema.positive().max(10).default(0.05),
  includeMisspecifiedAlternative: z.boolean().default(false)
}).strict()

export const StudyRequestSchema = z.object({
  parameterId: z.literal('PARAMETER:DECAY-K').default('PARAMETER:DECAY-K'),
  targetContextId: z.literal('CONTEXT:SYNTHETIC-DECAY').default('CONTEXT:SYNTHETIC-DECAY'),
  datasetId: z.literal('DATASET:SYNTHETIC-FIRST-ORDER-DECAY').default('DATASET:SYNTHETIC-FIRST-ORDER-DECAY'),
  seed: z.number().int().min(0).max(0xffffffff).default(20260712),
  transforms: z.array(TaxonTransformSchema).max(10).default([]),
  controls: StudyControlsSchema.default({})
}).strict()

const IntervalSchema = z.object({ lower: FiniteNumberSchema, median: FiniteNumberSchema, upper: FiniteNumberSchema }).strict()
const OutcomeSchema = z.enum(['successful', 'non-converged'])
const ValidationPredictionSchema = z.object({ observationId: QualifiedIdSchema, observed: FiniteNumberSchema, interval: IntervalSchema, covered: z.boolean() }).strict()
const PosteriorValidationSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('available'), diagnosticOnly: z.literal(false), heldOutOnly: z.literal(true), observationIds: z.array(QualifiedIdSchema).min(1), coverageProbability: FiniteNumberSchema.min(0).max(1), covered: NonNegativeIntSchema, total: PositiveIntSchema, predictions: z.array(ValidationPredictionSchema).min(1), diagnostics: z.array(z.string()).max(0) }).strict(),
  z.object({ status: z.literal('suppressed'), diagnosticOnly: z.literal(true), heldOutOnly: z.literal(true), observationIds: z.array(QualifiedIdSchema).min(1), coverageProbability: z.null(), covered: z.null(), total: PositiveIntSchema, predictions: z.array(ValidationPredictionSchema).max(0), diagnostics: z.array(NonEmptyStringSchema).min(1) }).strict()
])

export const StudyResultSchema = z.object({
  contractVersion: z.literal(PARAMETER_CONTRACT_VERSION),
  studyId: Sha256DigestSchema,
  lifecycle: z.literal('terminal'),
  outcome: OutcomeSchema,
  provenance: z.object({
    parameterRelease: ParameterReleaseRefSchema,
    modelId: z.literal('synthetic-first-order-decay'),
    modelVersion: z.literal('1.0.0'),
    algorithms: z.object({ sensitivity: z.literal('centered-finite-difference-1.0.0'), morris: z.literal('seeded-morris-1.0.0'), calibration: z.literal('bounded-nelder-mead-1.0.0'), posterior: z.literal('random-walk-metropolis-1.0.0') }).strict(),
    seed: z.number().int().min(0).max(0xffffffff)
  }).strict(),
  request: StudyRequestSchema,
  labels: z.array(z.enum(['synthetic', 'assumption'])).min(1),
  parameterSelection: ParameterOptionsResponseSchema,
  partition: ParameterPartitionSchema,
  sensitivity: z.object({ method: z.literal('centered-finite-difference'), relativeStep: FiniteNumberSchema.positive(), local: z.array(z.object({ observationId: QualifiedIdSchema, derivative: FiniteNumberSchema, normalized: FiniteNumberSchema }).strict()), morris: z.array(z.object({ parameterId: QualifiedIdSchema, mu: FiniteNumberSchema, muStar: FiniteNumberSchema.nonnegative(), sigma: FiniteNumberSchema.nonnegative(), trajectories: PositiveIntSchema }).strict()) }).strict(),
  calibration: z.object({ status: OutcomeSchema, converged: z.boolean(), estimate: FiniteNumberSchema.nullable(), bestSoFar: FiniteNumberSchema, objective: FiniteNumberSchema.nonnegative(), iterations: NonNegativeIntSchema, calibrationObservationIds: z.array(QualifiedIdSchema).min(1), validationObservationIdsAccessed: z.array(QualifiedIdSchema).max(0) }).strict(),
  identifiability: z.object({ identifiable: z.boolean(), parameterIds: z.array(QualifiedIdSchema).min(1), rank: NonNegativeIntSchema, columns: PositiveIntSchema, conditionNumber: FiniteNumberSchema.nonnegative().or(z.literal('infinite')), fisherInformation: z.array(z.array(FiniteNumberSchema)) }).strict(),
  posterior: z.object({ status: OutcomeSchema, converged: z.boolean(), interval: IntervalSchema.nullable(), rHat: FiniteNumberSchema.positive(), acceptanceRates: z.array(FiniteNumberSchema.min(0).max(1)).min(2), chains: z.number().int().min(2), samplesPerChain: PositiveIntSchema, diagnostics: z.array(z.string()) }).strict(),
  validation: PosteriorValidationSchema,
  robustness: z.object({ status: z.enum(['robust', 'downgraded']), conclusion: NonEmptyStringSchema, matrix: z.array(z.object({ id: NonEmptyStringSchema, parameterStart: FiniteNumberSchema, solver: z.enum(['analytic', 'rk4']), timestep: FiniteNumberSchema.nonnegative(), modelForm: z.enum(['first-order', 'first-order-offset']), outcome: OutcomeSchema, estimate: FiniteNumberSchema.nullable(), heldOutRmse: FiniteNumberSchema.nonnegative().nullable(), supportsConclusion: z.boolean(), rationale: NonEmptyStringSchema }).strict()).min(4) }).strict(),
  uncertainty: z.array(z.object({ category: z.enum(['biological', 'measurement', 'structural', 'contextual', 'numerical']), label: z.enum(['synthetic', 'assumption']), description: NonEmptyStringSchema }).strict()).min(5),
  limitations: z.array(NonEmptyStringSchema).min(1)
}).strict()

export const StudyRecordSchema = z.object({
  studyId: Sha256DigestSchema,
  lifecycle: z.literal('terminal'),
  outcome: OutcomeSchema,
  result: StudyResultSchema
}).strict()
