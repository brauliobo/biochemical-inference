import { z } from 'zod'

export const PARAMETER_RELEASE_ID = 'parameter-evidence-benchmark-v1.0.0'
export const PARAMETER_RELEASE_DIGEST = '6e72e6bebf3b18aa2edd95dae7e719799cb6916a3e58bb68e697347eebce7fa9'
export const PARAMETER_CONTRACT_VERSION = '1.0.0'

const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/)
const CanonicalDigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
const QualifiedIdSchema = z.string().regex(/^(?:PARAMETER|CONTEXT|ASSAY|EVIDENCE|CANDIDATE|CORRELATION|DATASET|OBSERVATION|UNCERTAINTY|PARTITION|GO|UBERON):[A-Za-z0-9_.-]+$/)
const UnitSchema = z.enum(['1', 's', 's^-1', 'min^-1', 'umol/L', 'mmol/L', 'umol/L/s', 'mmol/L/min'])
const EvidenceClassSchema = z.enum(['measured', 'synthetic', 'assumption'])
const FiniteSchema = z.number().finite()

export const ParameterReleaseRefSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+\.[0-9]+\.[0-9]+$/),
  schema_version: z.literal(PARAMETER_CONTRACT_VERSION),
  digest: DigestSchema
}).strict()

const UpstreamCatalogEntrySchema = z.object({
  release_id: z.string().min(1),
  title: z.string().min(1),
  schema_version: z.literal(PARAMETER_CONTRACT_VERSION),
  release_digest: DigestSchema,
  manifest_path: z.string().regex(/^[a-z0-9.-]+\/manifest\.json$/)
}).strict()

export const UpstreamParameterCatalogSchema = z.object({
  catalog_schema_version: z.literal(PARAMETER_CONTRACT_VERSION),
  releases: z.array(UpstreamCatalogEntrySchema)
}).strict()

export const ParameterContextSchema = z.object({
  id: QualifiedIdSchema,
  name: z.string().min(1),
  taxon_id: z.string().regex(/^NCBITaxon:[1-9][0-9]*$/).nullable(),
  tissue_id: QualifiedIdSchema.nullable(),
  compartment_id: QualifiedIdSchema.nullable(),
  assay_id: QualifiedIdSchema,
  ph: FiniteSchema.min(0).max(14).nullable(),
  temperature: z.object({ value: FiniteSchema.positive(), unit: z.literal('K') }).strict().nullable(),
  biological_scope: z.enum(['biological', 'synthetic'])
}).strict()

export const ParameterDefinitionSchema = z.object({
  id: QualifiedIdSchema,
  name: z.string().min(1),
  model_symbol: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  dimension: z.enum(['dimensionless', 'time', 'first_order_rate', 'concentration', 'concentration_rate']),
  canonical_unit: UnitSchema,
  reference_context_id: QualifiedIdSchema,
  description: z.string().min(1)
}).strict()

const ApplicabilitySchema = z.object({
  status: z.enum(['applicable', 'excluded']),
  target_context_id: QualifiedIdSchema,
  qualifiers: z.array(z.enum(['exact-context', 'competing-context', 'unit-conversion-required', 'taxon-mismatch', 'incompatible-unit'])).min(1),
  rationale: z.string().min(1)
}).strict()

const CandidateBase = {
  id: QualifiedIdSchema,
  parameter_id: QualifiedIdSchema,
  context_id: QualifiedIdSchema,
  unit: UnitSchema,
  evidence_class: EvidenceClassSchema,
  evidence_locator_ids: z.array(QualifiedIdSchema).min(1),
  applicability: ApplicabilitySchema,
  note: z.string().min(1)
}

const PointCandidateSchema = z.object({ ...CandidateBase, value_kind: z.literal('point'), value: FiniteSchema }).strict()
const IntervalCandidateSchema = z.object({
  ...CandidateBase,
  value_kind: z.literal('interval'),
  lower: FiniteSchema,
  upper: FiniteSchema,
  interval_type: z.enum(['range', 'confidence', 'credible'])
}).strict()
const DistributionSchema = z.discriminatedUnion('family', [
  z.object({ family: z.literal('normal'), mean: FiniteSchema, standard_deviation: FiniteSchema.positive() }).strict(),
  z.object({ family: z.literal('lognormal'), log_mean: FiniteSchema, log_standard_deviation: FiniteSchema.positive() }).strict(),
  z.object({ family: z.literal('uniform'), lower: FiniteSchema, upper: FiniteSchema }).strict()
])
const DistributionCandidateSchema = z.object({ ...CandidateBase, value_kind: z.literal('distribution'), distribution: DistributionSchema }).strict()

export const ParameterCandidateSchema = z.discriminatedUnion('value_kind', [PointCandidateSchema, IntervalCandidateSchema, DistributionCandidateSchema]).superRefine((candidate, context) => {
  if (candidate.value_kind === 'interval' && candidate.lower >= candidate.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'candidate interval must be ordered' })
  if (candidate.value_kind === 'distribution' && candidate.distribution.family === 'uniform' && candidate.distribution.lower >= candidate.distribution.upper) context.addIssue({ code: z.ZodIssueCode.custom, message: 'uniform bounds must be ordered' })
})

export const ParameterEvidenceLocatorSchema = z.object({
  id: QualifiedIdSchema,
  source_id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  evidence_class: EvidenceClassSchema,
  locator_type: z.enum(['publication', 'database-record', 'synthetic-protocol', 'assumption-rationale']),
  citation: z.string().min(1),
  locator: z.string().min(1),
  url: z.string().url()
}).strict()

export const ParameterCorrelationSchema = z.object({
  id: QualifiedIdSchema,
  candidate_ids: z.array(QualifiedIdSchema).min(2).max(20),
  matrix: z.array(z.array(FiniteSchema).min(2).max(20)).min(2).max(20),
  matrix_type: z.literal('correlation'),
  positive_semidefinite_tolerance: FiniteSchema.min(0).max(1e-6),
  rationale: z.string().min(1)
}).strict()

export const UncertaintyComponentSchema = z.object({
  category: z.enum(['biological', 'measurement', 'structural', 'contextual', 'numerical']),
  representation: z.enum(['absolute-standard-deviation', 'relative-standard-deviation', 'qualitative']),
  value: FiniteSchema.nonnegative().nullable(),
  unit: UnitSchema.nullable(),
  description: z.string().min(1)
}).strict()

export const ParameterUncertaintySchema = z.object({
  id: QualifiedIdSchema,
  subject_id: QualifiedIdSchema,
  components: z.array(UncertaintyComponentSchema).min(1)
}).strict()

export const ParameterDatasetSchema = z.object({
  id: QualifiedIdSchema,
  title: z.string().min(1),
  data_origin: z.enum(['measured', 'synthetic']),
  context_id: QualifiedIdSchema,
  parameter_ids: z.array(QualifiedIdSchema).min(1),
  independent_variable: z.string().min(1),
  independent_unit: UnitSchema,
  observable: z.string().min(1),
  observable_unit: UnitSchema,
  evidence_locator_ids: z.array(QualifiedIdSchema).min(1),
  source_id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  generation_method: z.string().min(1).nullable(),
  bounded_scope: z.string().min(1)
}).strict()

export const ParameterObservationSchema = z.object({
  id: QualifiedIdSchema,
  dataset_id: QualifiedIdSchema,
  replicate_id: z.string().min(1),
  independent_value: FiniteSchema,
  value: FiniteSchema,
  data_origin: z.enum(['measured', 'synthetic'])
}).strict()

export const ParameterPartitionSchema = z.object({
  id: QualifiedIdSchema,
  dataset_id: QualifiedIdSchema,
  fixed: z.literal(true),
  assignment_method: z.literal('explicit-identifiers-v1'),
  calibration_observation_ids: z.array(QualifiedIdSchema).min(1),
  validation_observation_ids: z.array(QualifiedIdSchema).min(1),
  rationale: z.string().min(1)
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
    taxon_ids: z.array(z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)),
    tissue_ids: z.array(QualifiedIdSchema),
    compartment_ids: z.array(QualifiedIdSchema),
    assay_ids: z.array(QualifiedIdSchema),
    ph_values: z.array(FiniteSchema),
    temperatures: z.array(z.object({ value: FiniteSchema.positive(), unit: z.literal('K') }).strict())
  }).strict()
}).strict()

export const TaxonTransformSchema = z.object({
  id: z.string().regex(/^TRANSFORM:[A-Za-z0-9_.-]+$/),
  candidateId: QualifiedIdSchema,
  sourceTaxonId: z.string().regex(/^NCBITaxon:[1-9][0-9]*$/),
  targetTaxonId: z.string().regex(/^NCBITaxon:[1-9][0-9]*$/),
  scaleFactor: FiniteSchema.positive(),
  rationale: z.string().min(1)
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
  canonicalValue: FiniteSchema.nullable(),
  rationale: z.string().min(1),
  labels: z.array(z.enum(['synthetic', 'assumption', 'measured', 'unit-converted', 'context-transformed']))
}).strict()

export const ParameterOptionsResponseSchema = z.object({
  contractVersion: z.literal(PARAMETER_CONTRACT_VERSION),
  release: ParameterReleaseRefSchema,
  parameter: ParameterDefinitionSchema,
  targetContext: ParameterContextSchema,
  selectedCandidateId: QualifiedIdSchema,
  selectedValue: FiniteSchema,
  canonicalUnit: UnitSchema,
  bounds: z.object({ lower: FiniteSchema, upper: FiniteSchema, candidateId: QualifiedIdSchema }).strict(),
  prior: z.object({ family: z.literal('normal'), mean: FiniteSchema, standardDeviation: FiniteSchema.positive(), candidateId: QualifiedIdSchema }).strict(),
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
  sensitivityRelativeStep: FiniteSchema.min(1e-8).max(0.1).default(1e-4),
  morrisTrajectories: z.number().int().min(4).max(100).default(12),
  morrisLevels: z.number().int().min(4).max(20).default(6),
  optimizerMaxIterations: z.number().int().min(1).max(1000).default(200),
  optimizerTolerance: FiniteSchema.min(1e-12).max(0.1).default(1e-10),
  posteriorChains: z.number().int().min(2).max(8).default(4),
  posteriorWarmup: z.number().int().min(0).max(10000).default(300),
  posteriorSamples: z.number().int().min(20).max(20000).default(700),
  posteriorProposalScale: FiniteSchema.positive().max(1).default(0.002),
  observationSigma: FiniteSchema.positive().max(10).default(0.05),
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

const IntervalSchema = z.object({ lower: FiniteSchema, median: FiniteSchema, upper: FiniteSchema }).strict()
const OutcomeSchema = z.enum(['successful', 'non-converged'])

export const StudyResultSchema = z.object({
  contractVersion: z.literal(PARAMETER_CONTRACT_VERSION),
  studyId: CanonicalDigestSchema,
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
  sensitivity: z.object({ method: z.literal('centered-finite-difference'), relativeStep: FiniteSchema.positive(), local: z.array(z.object({ observationId: QualifiedIdSchema, derivative: FiniteSchema, normalized: FiniteSchema }).strict()), morris: z.array(z.object({ parameterId: QualifiedIdSchema, mu: FiniteSchema, muStar: FiniteSchema.nonnegative(), sigma: FiniteSchema.nonnegative(), trajectories: z.number().int().positive() }).strict()) }).strict(),
  calibration: z.object({ status: OutcomeSchema, converged: z.boolean(), estimate: FiniteSchema.nullable(), bestSoFar: FiniteSchema, objective: FiniteSchema.nonnegative(), iterations: z.number().int().nonnegative(), calibrationObservationIds: z.array(QualifiedIdSchema).min(1), validationObservationIdsAccessed: z.array(QualifiedIdSchema).max(0) }).strict(),
  identifiability: z.object({ identifiable: z.boolean(), parameterIds: z.array(QualifiedIdSchema).min(1), rank: z.number().int().nonnegative(), columns: z.number().int().positive(), conditionNumber: FiniteSchema.nonnegative().or(z.literal('infinite')), fisherInformation: z.array(z.array(FiniteSchema)) }).strict(),
  posterior: z.object({ status: OutcomeSchema, converged: z.boolean(), interval: IntervalSchema.nullable(), rHat: FiniteSchema.positive(), acceptanceRates: z.array(FiniteSchema.min(0).max(1)).min(2), chains: z.number().int().min(2), samplesPerChain: z.number().int().positive(), diagnostics: z.array(z.string()) }).strict(),
  validation: z.object({ heldOutOnly: z.literal(true), observationIds: z.array(QualifiedIdSchema).min(1), coverageProbability: FiniteSchema.min(0).max(1), covered: z.number().int().nonnegative(), total: z.number().int().positive(), predictions: z.array(z.object({ observationId: QualifiedIdSchema, observed: FiniteSchema, interval: IntervalSchema, covered: z.boolean() }).strict()) }).strict(),
  robustness: z.object({ status: z.enum(['robust', 'downgraded']), conclusion: z.string().min(1), matrix: z.array(z.object({ id: z.string().min(1), parameterStart: FiniteSchema, solver: z.enum(['analytic', 'rk4']), timestep: FiniteSchema.nonnegative(), modelForm: z.enum(['first-order', 'first-order-offset']), outcome: OutcomeSchema, estimate: FiniteSchema.nullable(), heldOutRmse: FiniteSchema.nonnegative().nullable(), supportsConclusion: z.boolean(), rationale: z.string().min(1) }).strict()).min(4) }).strict(),
  uncertainty: z.array(z.object({ category: z.enum(['biological', 'measurement', 'structural', 'contextual', 'numerical']), label: z.enum(['synthetic', 'assumption']), description: z.string().min(1) }).strict()).min(5),
  limitations: z.array(z.string().min(1)).min(1)
}).strict()

export const StudyRecordSchema = z.object({
  studyId: CanonicalDigestSchema,
  lifecycle: z.literal('terminal'),
  outcome: OutcomeSchema,
  result: StudyResultSchema
}).strict()
