import { z } from 'zod'

export const APAP_RELEASE_ID = 'apap-liver-benchmark-v1.0.0'
export const APAP_RELEASE_DIGEST = '6de9844b2e8e4f3a15a0aba5455c69dc4116dc3287b7adb05e68ea337707f23b'
export const APAP_CONTRACT_VERSION = '1.0.0'
export const APAP_MODEL_ID = 'MODEL:APAP-LIVER-MULTISCALE'
export const APAP_MODEL_VERSION = '1.0.0'
export const APAP_ENGINE_VERSION = 'fixed-step-rk4-1.0.0'
export const APAP_EQUATION_SET_ID = 'EQUATION-SET:APAP-LIVER-MULTISCALE-V1'
export const APAP_WARNING = 'Synthetic, non-clinical algorithm benchmark. Not medical advice, treatment guidance, or validated human or mouse toxicology.'

const FiniteSchema = z.number().finite()
const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/)
const CanonicalDigestSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
const SourceIdSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/)
const ContextIdSchema = z.enum(['CONTEXT:APAP-HUMAN-LIVER', 'CONTEXT:APAP-MOUSE-LIVER'])
const ProtocolIdSchema = z.enum(['PROTOCOL:APAP-HUMAN-PK', 'PROTOCOL:APAP-MOUSE-TOXIC-DOSE', 'PROTOCOL:APAP-DELAYED-NAC'])
const EquationIdSchema = z.enum(['EQUATION:APAP-HUMAN-PK', 'EQUATION:APAP-MOUSE-INJURY', 'EQUATION:APAP-DELAYED-NAC'])
const AssumptionIdSchema = z.string().regex(/^ASSUMPTION:APAP-[A-Z0-9-]+$/)
const UnitSchema = z.enum(['1', 'h', 'h^-1', 'L', 'mg', 'mg/L', 'mg/kg'])
const ModelUnitSchema = z.enum(['1', 'h', 'h^-1', 'model-unit', 'model-unit/h'])
const QuantitySchema = z.object({ value: FiniteSchema.nonnegative(), unit: UnitSchema }).strict()
const BoundSchema = z.object({ lower: FiniteSchema.nonnegative(), upper: FiniteSchema.nonnegative(), unit: UnitSchema }).strict()

export const ApapReleaseRefSchema = z.object({
  id: z.literal(APAP_RELEASE_ID),
  schema_version: z.literal(APAP_CONTRACT_VERSION),
  digest: z.literal(APAP_RELEASE_DIGEST)
}).strict()

const CatalogEntrySchema = z.object({
  release_id: z.literal(APAP_RELEASE_ID),
  title: z.string().min(1),
  schema_version: z.literal(APAP_CONTRACT_VERSION),
  release_digest: z.literal(APAP_RELEASE_DIGEST),
  manifest_path: z.literal(`${APAP_RELEASE_ID}/manifest.json`)
}).strict()

export const UpstreamApapCatalogSchema = z.object({
  catalog_schema_version: z.literal(APAP_CONTRACT_VERSION),
  releases: z.array(CatalogEntrySchema).min(1)
}).strict()

const ManifestFileSchema = z.object({
  path: z.string().regex(/^[a-z][a-z0-9_]*\.json$/),
  record_type: z.enum(['compounds', 'proteins', 'contexts', 'parameters', 'protocols', 'observations', 'assumptions', 'limitations', 'validation_matrix']),
  sha256: DigestSchema,
  bytes: z.number().int().positive(),
  record_count: z.number().int().nonnegative()
}).strict()

const SourceSchema = z.object({
  id: SourceIdSchema,
  name: z.string().min(1),
  source_class: z.enum(['identifier-authority', 'synthetic', 'curator-assumption']),
  version: z.string().min(1),
  url: z.string().url(),
  accessed_at: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  license: z.string().min(1),
  license_url: z.string().url(),
  usage: z.string().min(1)
}).strict()

const ManifestSchema = z.object({
  release_id: z.literal(APAP_RELEASE_ID),
  title: z.string().min(1),
  schema_version: z.literal(APAP_CONTRACT_VERSION),
  release_digest: z.literal(APAP_RELEASE_DIGEST),
  digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
  published_at: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  immutable: z.literal(true),
  scientific_scope: z.string().min(1),
  files: z.array(ManifestFileSchema).length(9),
  record_counts: z.record(z.number().int().nonnegative()),
  sources: z.array(SourceSchema).min(1),
  compatibility: z.object({ consumer: z.literal('biochemical-inference'), apap_benchmark_api_contract: z.literal(APAP_CONTRACT_VERSION) }).strict()
}).strict()

const CompoundSchema = z.object({
  id: z.string().regex(/^CHEBI:[1-9][0-9]*$/),
  name: z.string().min(1),
  aliases: z.array(z.string()),
  formula: z.string().regex(/^[A-Z][A-Za-z0-9]+$/),
  charge: z.number().int(),
  source_id: z.literal('CHEBI'),
  verified_current: z.literal(true),
  verification_url: z.string().url()
}).strict()

const ProteinSchema = z.object({
  id: z.string().regex(/^UniProtKB:[A-Z0-9]+$/),
  accession: z.string().regex(/^[A-Z0-9]+$/),
  recommended_name: z.string().min(1),
  gene_symbol: z.enum(['CYP2E1', 'Cyp2e1']),
  taxon_id: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']),
  reviewed: z.literal(true),
  ec_numbers: z.array(z.enum(['1.14.14.1', '1.14.13.n7'])).min(1),
  role: z.literal('verified enzyme identifier anchor; no measured activity is included'),
  source_id: z.literal('UNIPROT'),
  verification_url: z.string().url()
}).strict()

export const ApapContextSchema = z.object({
  id: ContextIdSchema,
  name: z.string().min(1),
  taxon_id: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']),
  taxon_label: z.enum(['Homo sapiens', 'Mus musculus']),
  organ_id: z.literal('UBERON:0002107'),
  organ_label: z.literal('liver'),
  cell_type_id: z.literal('CL:0000182'),
  cell_type_label: z.literal('hepatocyte'),
  strain: z.string().nullable(),
  sex: z.enum(['not-specified', 'male', 'female', 'mixed']),
  challenge_route: z.enum(['oral', 'intraperitoneal']),
  fasting_status: z.enum(['not-specified', 'fasted']),
  fasting_detail: z.string().min(1),
  source_ids: z.array(SourceIdSchema).min(3)
}).strict()

export const ApapAssumptionSchema = z.object({
  id: AssumptionIdSchema,
  label: z.string().min(1),
  statement: z.string().min(1),
  quantity: QuantitySchema,
  context_id: ContextIdSchema,
  equation_id: EquationIdSchema,
  evidence_class: z.literal('illustrative-assumption'),
  source_id: z.literal('CURATOR_ASSUMPTION'),
  validation_status: z.literal('unsupported'),
  measured: z.literal(false)
}).strict()

export const ApapParameterSchema = z.object({
  id: z.string().regex(/^PARAMETER:APAP-[A-Z0-9-]+$/),
  equation_id: EquationIdSchema,
  equation: z.string().min(1),
  context_id: ContextIdSchema,
  symbol: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  name: z.string().min(1),
  quantity: QuantitySchema,
  value_origin: z.literal('illustrative-assumption'),
  evidence_class: z.literal('illustrative-assumption'),
  assumption_id: AssumptionIdSchema,
  validation_status: z.literal('unsupported')
}).strict()

const InterventionSchema = z.object({
  compound_id: z.enum(['CHEBI:46195', 'CHEBI:28939']),
  role: z.enum(['challenge', 'antidote']),
  route: z.enum(['oral', 'intraperitoneal', 'intravenous']),
  dose: BoundSchema,
  start_time: BoundSchema,
  assumption_id: AssumptionIdSchema
}).strict()

export const ApapProtocolSchema = z.object({
  id: ProtocolIdSchema,
  name: z.string().min(1),
  protocol_class: z.enum(['human-pk', 'mouse-toxic-dose', 'delayed-nac']),
  context_id: ContextIdSchema,
  equation_id: EquationIdSchema,
  evidence_class: z.literal('synthetic-benchmark'),
  applicability: z.literal('algorithm-demonstration-only'),
  bounded: z.literal(true),
  interventions: z.array(InterventionSchema).min(1).max(2),
  observation_window: BoundSchema,
  sampling_times: z.array(QuantitySchema).min(2),
  expected_use: z.string().min(1),
  exclusion: z.string().min(1)
}).strict()

export const ApapObservationSchema = z.object({
  id: z.string().regex(/^OBSERVATION:APAP-[A-Z0-9-]+$/),
  protocol_id: ProtocolIdSchema,
  context_id: ContextIdSchema,
  equation_id: EquationIdSchema,
  time: QuantitySchema,
  observable: z.enum(['synthetic-apap-concentration', 'synthetic-injury-index']),
  value: QuantitySchema,
  evidence_class: z.literal('synthetic'),
  data_origin: z.literal('equation-generated'),
  partition: z.enum(['calibration', 'validation']),
  validation_status: z.literal('unsupported'),
  supports_biological_conclusion: z.literal(false)
}).strict()

export const ApapValidationEntrySchema = z.object({
  id: z.string().regex(/^VALIDATION:APAP-[A-Z0-9-]+$/),
  protocol_id: ProtocolIdSchema,
  context_id: ContextIdSchema,
  claim_type: z.enum(['human-pk', 'human-injury', 'mouse-injury', 'delayed-nac-efficacy']),
  claim: z.string().min(1),
  evidence_class: z.literal('synthetic-benchmark'),
  applicability: z.literal('algorithm-demonstration-only'),
  benchmark_status: z.literal('synthetic-contract-only'),
  validation_status: z.literal('unsupported'),
  supported: z.literal(false),
  rationale: z.string().min(1)
}).strict()

export const ApapLimitationSchema = z.object({
  id: z.string().regex(/^LIMITATION:APAP-[A-Z0-9-]+$/),
  category: z.enum(['scope', 'evidence', 'translation', 'clinical', 'benchmark']),
  statement: z.string().min(1)
}).strict()

export const UpstreamApapDetailSchema = z.object({
  release: ApapReleaseRefSchema,
  manifest: ManifestSchema,
  benchmark: z.object({
    compounds: z.array(CompoundSchema).length(4),
    proteins: z.array(ProteinSchema).length(2),
    assumptions: z.array(ApapAssumptionSchema).length(12),
    limitations: z.array(ApapLimitationSchema).length(6)
  }).strict()
}).strict()

const envelope = (itemSchema) => z.object({ release: ApapReleaseRefSchema, items: z.array(itemSchema) }).strict()
export const UpstreamApapContextsSchema = envelope(ApapContextSchema)
export const UpstreamApapProtocolsSchema = envelope(ApapProtocolSchema)
export const UpstreamApapObservationsSchema = envelope(ApapObservationSchema)
export const UpstreamApapValidationSchema = envelope(ApapValidationEntrySchema)
export const UpstreamApapAssumptionsSchema = envelope(ApapAssumptionSchema)
export const UpstreamApapLimitationsSchema = envelope(ApapLimitationSchema)
export const UpstreamApapParametersSchema = z.object({
  release: ApapReleaseRefSchema,
  items: z.array(ApapParameterSchema),
  assumptions: z.array(ApapAssumptionSchema)
}).strict()

const ScaleSchema = FiniteSchema.min(0).max(2)
export const ApapRunRequestSchema = z.object({
  releaseId: z.literal(APAP_RELEASE_ID).default(APAP_RELEASE_ID),
  contextId: ContextIdSchema.default('CONTEXT:APAP-HUMAN-LIVER'),
  protocolId: ProtocolIdSchema.default('PROTOCOL:APAP-HUMAN-PK'),
  stepHours: z.literal(0.01).default(0.01),
  outputEveryHours: z.literal(0.5).default(0.5),
  mechanismScales: z.object({
    cypActivity: ScaleSchema.default(1),
    adductBinding: ScaleSchema.default(1),
    zonation: ScaleSchema.default(1),
    nacGsh: ScaleSchema.default(1)
  }).strict().default({})
}).strict()

const EffectiveParameterSchema = z.object({
  id: z.string().regex(/^PARAMETER:APAP-(?:INTERNAL-)?[A-Z0-9-]+$/),
  symbol: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  value: FiniteSchema.nonnegative(),
  unit: ModelUnitSchema,
  contextId: ContextIdSchema,
  origin: z.enum(['upstream-illustrative-assumption', 'internal-illustrative-assumption', 'run-control']),
  sourceId: z.string().min(1),
  assumptionId: z.string().regex(/^ASSUMPTION:APAP-(?:INTERNAL-)?[A-Z0-9-]+$/),
  statement: z.string().min(1)
}).strict()

const SeriesSchema = z.object({ id: z.string().min(1), name: z.string().min(1), unit: ModelUnitSchema, values: z.array(FiniteSchema.nonnegative()) }).strict()
const LobuleVectorSchema = z.array(FiniteSchema.nonnegative()).length(12)
const LobuleSnapshotSchema = z.object({
  timeHours: FiniteSchema.nonnegative(),
  apap: LobuleVectorSchema,
  napqi: LobuleVectorSchema,
  gsh: LobuleVectorSchema,
  adduct: LobuleVectorSchema,
  oxygen: LobuleVectorSchema,
  healthy: LobuleVectorSchema,
  stressed: LobuleVectorSchema,
  injured: LobuleVectorSchema,
  recovering: LobuleVectorSchema
}).strict()

const LimitingCaseSchema = z.object({ id: z.enum(['zero-cyp', 'zero-binding', 'uniform-zonation']), passed: z.boolean(), expectation: z.string().min(1), maximumSignal: FiniteSchema.nonnegative(), tolerance: FiniteSchema.nonnegative() }).strict()

export const ApapRunResultSchema = z.object({
  contractVersion: z.literal(APAP_CONTRACT_VERSION),
  runId: CanonicalDigestSchema,
  lifecycle: z.literal('terminal'),
  outcome: z.literal('successful'),
  warning: z.literal(APAP_WARNING),
  release: ApapReleaseRefSchema,
  context: ApapContextSchema,
  protocol: ApapProtocolSchema,
  equationSet: z.object({ id: z.literal(APAP_EQUATION_SET_ID), version: z.literal(APAP_MODEL_VERSION), digest: CanonicalDigestSchema, taxonBranches: z.literal(false), lobuleBins: z.literal(12) }).strict(),
  engine: z.object({ version: z.literal(APAP_ENGINE_VERSION), method: z.literal('fixed-step RK4'), stepHours: z.literal(0.01), outputEveryHours: z.literal(0.5), deterministic: z.literal(true) }).strict(),
  effectiveParameters: z.array(EffectiveParameterSchema).min(20),
  assumptions: z.array(z.object({ id: z.string().min(1), statement: z.string().min(1), origin: z.enum(['upstream', 'internal', 'run-control']), validationStatus: z.literal('unsupported') }).strict()).min(1),
  timeHours: z.array(FiniteSchema.nonnegative()).min(2),
  systemicOutputs: z.array(SeriesSchema).min(4),
  lobule: z.object({ binCount: z.literal(12), orientation: z.literal('portal-to-central'), snapshots: z.array(LobuleSnapshotSchema).min(2) }).strict(),
  summary: z.object({ peakCentralApap: FiniteSchema.nonnegative(), finalCentralApap: FiniteSchema.nonnegative(), totalNapqiFormed: FiniteSchema.nonnegative(), finalAdductBurden: FiniteSchema.nonnegative(), peakInjuredFraction: FiniteSchema.min(0).max(1), finalHealthyFraction: FiniteSchema.min(0).max(1), minimumOxygen: FiniteSchema.nonnegative() }).strict(),
  syntheticComparisons: z.array(z.object({ observationId: z.string().min(1), partition: z.enum(['calibration', 'validation']), observed: FiniteSchema.nonnegative(), predicted: FiniteSchema.nonnegative(), unit: UnitSchema, validationStatus: z.literal('unsupported') }).strict()),
  validationMatrix: z.array(ApapValidationEntrySchema).min(1),
  diagnostics: z.object({
    mass: z.object({ initialApap: FiniteSchema.nonnegative(), accountedApap: FiniteSchema.nonnegative(), residual: FiniteSchema, tolerance: FiniteSchema.positive(), passed: z.literal(true) }).strict(),
    cellState: z.object({ maximumSumError: FiniteSchema.nonnegative(), minimumFraction: FiniteSchema.nonnegative(), passed: z.literal(true) }).strict(),
    state: z.object({ minimumValue: FiniteSchema.nonnegative(), finite: z.literal(true), nonNegative: z.literal(true) }).strict(),
    limitingCases: z.array(LimitingCaseSchema).length(3),
    integrationSteps: z.number().int().positive()
  }).strict(),
  limitations: z.array(ApapLimitationSchema).min(6)
}).strict()

export const ApapRunRecordSchema = z.object({
  runId: CanonicalDigestSchema,
  lifecycle: z.literal('terminal'),
  outcome: z.literal('successful'),
  specification: ApapRunRequestSchema,
  result: ApapRunResultSchema
}).strict()

export const ApapDiscoverySchema = z.object({
  contractVersion: z.literal(APAP_CONTRACT_VERSION),
  releaseId: z.literal(APAP_RELEASE_ID),
  releaseDigest: z.literal(APAP_RELEASE_DIGEST),
  modelId: z.literal(APAP_MODEL_ID),
  modelVersion: z.literal(APAP_MODEL_VERSION),
  equationSetId: z.literal(APAP_EQUATION_SET_ID),
  engineVersion: z.literal(APAP_ENGINE_VERSION),
  routes: z.object({ release: z.string(), contexts: z.string(), parameters: z.string(), protocols: z.string(), observations: z.string(), assumptions: z.string(), limitations: z.string(), validationMatrix: z.string(), runs: z.string() }).strict(),
  warning: z.literal(APAP_WARNING)
}).strict()
