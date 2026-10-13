import { z } from 'zod'
import { Sha256HexSchema, Sha256DigestSchema, IsoDateSchema, UtcDatetimeSchema, HumanMouseTaxonSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, pinnedReleaseRefSchema, pinnedCatalogEntrySchema, releaseItemsEnvelopeSchema } from './commons/schemas.js'

export const PHYSIOLOGY_RELEASE_ID = 'physiology-plugin-evidence-v1.0.0'
export const PHYSIOLOGY_RELEASE_DIGEST = '8f7a14db2cebe4603772146b3d1f9f2a8ccafbf2452ef5c9ff856326584fadb8'
export const PHYSIOLOGY_CONTRACT_VERSION = '1.0.0'
export const PHYSIOLOGY_WARNING = 'Synthetic, non-clinical software conformance fixture. Scientific validation is unsupported.'
export const PHYSIOLOGY_CSRF_HEADER = 'x-physiology-csrf'
export const PHYSIOLOGY_CSRF_VALUE = 'physiology-v1'
export const BPP_PROFILE = 'biochemical-physiology-package-v1'
export const BPP_MAX_ARCHIVE_BYTES = 1_000_000
export const BPP_BASE64_MAX_LENGTH = Math.ceil(BPP_MAX_ARCHIVE_BYTES / 3) * 4
export const BPP_REQUEST_BODY_LIMIT = BPP_BASE64_MAX_LENGTH + 64
export const BPP_MAX_ENTRY_BYTES = 256_000
export const BPP_MAX_TOTAL_BYTES = 750_000
export const BPP_MAX_ENTRIES = 8
export const BPP_MAX_COMPRESSION_RATIO = 50

const PositiveFiniteSchema = FiniteNumberSchema.positive()
export const PhysiologySha256Schema = Sha256HexSchema
export const PhysiologyDigestSchema = Sha256DigestSchema
export const PhysiologyTaxonSchema = HumanMouseTaxonSchema
export const PhysiologyDomainSchema = z.enum(['circulation', 'liver', 'kidney', 'respiratory', 'endocrine', 'immune', 'neural', 'tumor'])
export const PhysiologyPluginIdSchema = z.string().regex(/^PLUGIN:[A-Z0-9][A-Z0-9-]{2,79}$/)
export const ReferencePluginIdSchema = z.enum(['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:LIVER-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE'])
export const PhysiologyContextIdSchema = z.string().regex(/^CONTEXT:PHYS-HUMAN-(?:CIRCULATION|LIVER|KIDNEY)$/)
export const PhysiologyPortIdSchema = z.string().regex(/^PORT:[A-Z0-9][A-Z0-9-]{2,95}$/)
export const PhysiologyQuantityIdSchema = z.string().regex(/^QUANTITY:[A-Z0-9][A-Z0-9-]{2,127}$/)
const AnatomySchema = z.enum(['UBERON:0004537', 'UBERON:0002107', 'UBERON:0002113', 'UBERON:0001004', 'UBERON:0000949', 'UBERON:0002405', 'UBERON:0001016'])

export const PhysiologyReleaseRefSchema = pinnedReleaseRefSchema(PHYSIOLOGY_RELEASE_ID, PHYSIOLOGY_CONTRACT_VERSION, PHYSIOLOGY_RELEASE_DIGEST)

const CatalogEntrySchema = pinnedCatalogEntrySchema({ releaseId: PHYSIOLOGY_RELEASE_ID, schemaVersion: PHYSIOLOGY_CONTRACT_VERSION, releaseDigest: PHYSIOLOGY_RELEASE_DIGEST, title: z.literal('Synthetic human physiology plugin coupling evidence') })

export const PhysiologyCatalogSchema = z.object({
  catalog_schema_version: z.literal(PHYSIOLOGY_CONTRACT_VERSION),
  releases: z.tuple([CatalogEntrySchema])
}).strict()

const ManifestFileSchema = z.object({
  path: z.string().regex(/^[a-z][a-z0-9_]*\.json$/),
  record_type: z.enum(['contexts', 'applicability', 'quantities', 'model_evidence', 'benchmarks', 'observations', 'validation', 'coverage', 'limitations']),
  sha256: PhysiologySha256Schema,
  bytes: PositiveIntSchema,
  record_count: NonNegativeIntSchema
}).strict()

const PhysiologySourceSchema = z.object({
  id: z.enum(['NCBI_TAXONOMY', 'UBERON', 'SYNTHETIC_PHYSIOLOGY', 'CURATOR_ASSUMPTION']),
  name: NonEmptyStringSchema,
  source_class: z.enum(['identifier-authority', 'synthetic', 'curator-assumption']),
  trust_label: z.enum(['authority-anchor-only', 'synthetic-not-measured', 'assumption-not-measured']),
  version: NonEmptyStringSchema,
  url: z.string().url(),
  accessed_at: IsoDateSchema,
  license: NonEmptyStringSchema,
  license_url: z.string().url(),
  usage: NonEmptyStringSchema
}).strict()

export const PhysiologyManifestSchema = z.object({
  release_id: z.literal(PHYSIOLOGY_RELEASE_ID),
  title: z.literal('Synthetic human physiology plugin coupling evidence'),
  schema_version: z.literal(PHYSIOLOGY_CONTRACT_VERSION),
  release_digest: z.literal(PHYSIOLOGY_RELEASE_DIGEST),
  digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
  published_at: IsoDateSchema,
  immutable: z.literal(true),
  scientific_scope: NonEmptyStringSchema,
  files: z.array(ManifestFileSchema).length(9),
  record_counts: z.object({ applicability: z.literal(3), benchmarks: z.literal(1), contexts: z.literal(3), coverage: z.literal(16), limitations: z.literal(6), model_evidence: z.literal(3), observations: z.literal(4), quantities: z.literal(4), validation: z.literal(4) }).strict(),
  sources: z.array(PhysiologySourceSchema).length(4),
  compatibility: z.object({ consumer: z.literal('biochemical-inference'), physiology_api_contract: z.literal(PHYSIOLOGY_CONTRACT_VERSION) }).strict()
}).strict().superRefine((manifest, context) => {
  const recordTypes = manifest.files.map((item) => item.record_type).sort().join(',')
  if (recordTypes !== 'applicability,benchmarks,contexts,coverage,limitations,model_evidence,observations,quantities,validation') context.addIssue({ code: z.ZodIssueCode.custom, message: 'Physiology manifest file closure is incomplete.' })
  const sourceTrust = new Map(manifest.sources.map((source) => [source.id, `${source.source_class}:${source.trust_label}`]))
  const expected = new Map([
    ['NCBI_TAXONOMY', 'identifier-authority:authority-anchor-only'],
    ['UBERON', 'identifier-authority:authority-anchor-only'],
    ['SYNTHETIC_PHYSIOLOGY', 'synthetic:synthetic-not-measured'],
    ['CURATOR_ASSUMPTION', 'curator-assumption:assumption-not-measured']
  ])
  for (const [id, trust] of expected) if (sourceTrust.get(id) !== trust) context.addIssue({ code: z.ZodIssueCode.custom, message: `Physiology source ${id} has an invalid trust classification.` })
})

export const PhysiologyContextSchema = z.object({
  id: PhysiologyContextIdSchema,
  name: NonEmptyStringSchema,
  taxon_id: z.literal('NCBITaxon:9606'),
  taxon_label: z.literal('Homo sapiens'),
  domain: z.enum(['circulation', 'liver', 'kidney']),
  anatomy_id: z.enum(['UBERON:0004537', 'UBERON:0002107', 'UBERON:0002113']),
  anatomy_label: z.enum(['blood vasculature', 'liver', 'kidney']),
  life_stage: z.literal('adult-unspecified'),
  sex: z.literal('unspecified'),
  health_state: z.literal('unspecified'),
  spatial_scope: z.literal('lumped synthetic reference compartment'),
  evidence_class: z.literal('ontology-anchor-with-synthetic-context'),
  source_ids: z.tuple([z.literal('NCBI_TAXONOMY'), z.literal('UBERON'), z.literal('SYNTHETIC_PHYSIOLOGY')])
}).strict()

export const PhysiologyApplicabilitySchema = z.object({
  id: z.string().regex(/^APPLICABILITY:PHYS-HUMAN-(?:CIRCULATION|LIVER|KIDNEY)$/),
  plugin_id: ReferencePluginIdSchema,
  context_id: PhysiologyContextIdSchema,
  taxon_id: z.literal('NCBITaxon:9606'),
  domain: z.enum(['circulation', 'liver', 'kidney']),
  anatomy_id: z.enum(['UBERON:0004537', 'UBERON:0002107', 'UBERON:0002113']),
  applicability_status: z.literal('applicable-for-synthetic-contract'),
  included_use: z.literal('bounded three-plugin coupling conformance benchmark'),
  excluded_taxon_ids: z.tuple([z.literal('NCBITaxon:10090')]),
  exclusions: z.array(NonEmptyStringSchema).min(1),
  scientific_validation_status: z.literal('unsupported')
}).strict()

export const PhysiologyPortSchema = z.object({
  id: PhysiologyPortIdSchema,
  quantity_id: PhysiologyQuantityIdSchema,
  direction: z.enum(['input', 'output']),
  semantic: z.literal('drug-mass-flow'),
  dimension: z.literal('mass_rate'),
  unit: z.literal('mg/min')
}).strict()

const EndpointSchema = PhysiologyPortSchema.omit({ id: true, quantity_id: true }).extend({
  plugin_id: ReferencePluginIdSchema,
  port_id: PhysiologyPortIdSchema
}).strict()

export const PhysiologyQuantitySchema = z.object({
  id: PhysiologyQuantityIdSchema,
  name: NonEmptyStringSchema,
  semantic: z.literal('drug-mass-flow'),
  dimension: z.literal('mass_rate'),
  canonical_unit: z.literal('mg/min'),
  quantity_kind: z.literal('extensive-rate'),
  conservation_rule: z.literal('source loss equals target gain over each coupling interval'),
  sign_convention: z.literal('positive from source to target'),
  source: EndpointSchema,
  target: EndpointSchema,
  numeric_value_in_release: z.literal(false),
  evidence_class: z.literal('synthetic-contract-definition'),
  source_id: z.literal('SYNTHETIC_PHYSIOLOGY')
}).strict().superRefine((quantity, context) => {
  if (quantity.source.direction !== 'output' || quantity.target.direction !== 'input') context.addIssue({ code: z.ZodIssueCode.custom, message: 'Physiology quantities must be directed output-to-input.' })
})

const NumericAssumptionSchema = z.object({
  id: z.string().regex(/^ASSUMPTION:PHYS-(?:CIRCULATION|LIVER|KIDNEY)-STEP$/),
  name: NonEmptyStringSchema,
  value: PositiveFiniteSchema,
  unit: z.literal('min'),
  dimension: z.literal('time'),
  value_origin: z.literal('assumption'),
  evidence_class: z.literal('curator-assumption'),
  source_id: z.literal('CURATOR_ASSUMPTION')
}).strict()

export const PhysiologyModelEvidenceSchema = z.object({
  id: z.string().regex(/^MODEL-EVIDENCE:(?:CIRCULATION|LIVER|KIDNEY)-REFERENCE$/),
  plugin_id: ReferencePluginIdSchema,
  name: NonEmptyStringSchema,
  context_id: PhysiologyContextIdSchema,
  domain: z.enum(['circulation', 'liver', 'kidney']),
  model_class: z.literal('repository-authored declarative synthetic reference'),
  model_digest: PhysiologySha256Schema,
  protocol_digest: PhysiologySha256Schema,
  ports: z.array(PhysiologyPortSchema).min(2).max(4),
  numeric_assumptions: z.tuple([NumericAssumptionSchema]),
  evidence_class: z.literal('synthetic-contract-evidence'),
  source_id: z.literal('SYNTHETIC_PHYSIOLOGY'),
  protocol_conformance_status: z.literal('passed'),
  certification_status: z.literal('not-certified'),
  scientific_validation_status: z.literal('unsupported'),
  limitation: NonEmptyStringSchema
}).strict()

const ObservationIdSchema = z.string().regex(/^OBSERVATION:PHYS-MASS-BALANCE-T[0-9]+$/)
export const PhysiologyBenchmarkSchema = z.object({
  id: z.literal('DATASET:PHYS-HUMAN-THREE-PLUGIN-MASS-BALANCE'),
  title: NonEmptyStringSchema,
  context_ids: z.tuple([PhysiologyContextIdSchema, PhysiologyContextIdSchema, PhysiologyContextIdSchema]),
  model_evidence_ids: z.tuple([z.string(), z.string(), z.string()]),
  quantity_ids: z.tuple([PhysiologyQuantityIdSchema, PhysiologyQuantityIdSchema, PhysiologyQuantityIdSchema, PhysiologyQuantityIdSchema]),
  data_origin: z.literal('synthetic'),
  evidence_class: z.literal('synthetic-benchmark'),
  source_id: z.literal('SYNTHETIC_PHYSIOLOGY'),
  generation_method: z.literal('repository-authored compartment mass fixtures with an exact 100 mg conserved total'),
  protocol_conformance_status: z.literal('passed'),
  scientific_validation_status: z.literal('unsupported'),
  partition: z.object({ fixed: z.literal(true), assignment_method: z.literal('explicit-identifiers-v1'), calibration_observation_ids: z.array(ObservationIdSchema).min(1), validation_observation_ids: z.array(ObservationIdSchema).min(1) }).strict(),
  bounded_scope: z.literal('four time points for software conformance only')
}).strict()

const SyntheticValueSchema = z.object({
  metric: z.enum(['time', 'circulation-drug-mass', 'liver-drug-mass', 'kidney-drug-mass', 'mass-balance-residual']),
  value: FiniteNumberSchema,
  unit: z.enum(['min', 'mg']),
  dimension: z.enum(['time', 'mass']),
  value_origin: z.literal('synthetic'),
  evidence_class: z.literal('synthetic-benchmark')
}).strict()

export const PhysiologyObservationSchema = z.object({
  id: ObservationIdSchema,
  dataset_id: z.literal('DATASET:PHYS-HUMAN-THREE-PLUGIN-MASS-BALANCE'),
  partition: z.enum(['calibration', 'validation']),
  values: z.array(SyntheticValueSchema).length(5),
  supports_scientific_validation: z.literal(false)
}).strict()

export const PhysiologyValidationSchema = z.object({
  id: z.string().regex(/^VALIDATION:PHYS-[A-Z-]+$/),
  domain: z.enum(['circulation', 'liver', 'kidney', 'integrated']),
  plugin_id: ReferencePluginIdSchema.nullable(),
  claim: NonEmptyStringSchema,
  validation_kind: z.literal('scientific'),
  evidence_class: z.literal('synthetic-contract-only'),
  validation_status: z.literal('unsupported'),
  supported: z.literal(false),
  protocol_conformance_used_as_scientific_evidence: z.literal(false),
  rationale: NonEmptyStringSchema
}).strict()

export const PhysiologyCoverageSchema = z.object({
  id: z.string().regex(/^COVERAGE:PHYS-(?:HUMAN|MOUSE)-[A-Z]+$/),
  taxon_id: PhysiologyTaxonSchema,
  taxon_label: z.enum(['Homo sapiens', 'Mus musculus']),
  domain: PhysiologyDomainSchema,
  anatomy_id: AnatomySchema.nullable(),
  anatomy_label: z.enum(['blood vasculature', 'liver', 'kidney', 'respiratory system', 'endocrine system', 'immune system', 'nervous system']).nullable(),
  coverage_status: z.enum(['contract-covered', 'unsupported', 'unknown']),
  plugin_id: ReferencePluginIdSchema.nullable(),
  context_id: PhysiologyContextIdSchema.nullable(),
  scientific_validation_status: z.literal('unsupported'),
  reason_code: z.enum(['synthetic-reference-published', 'not-published-in-release', 'not-assessed']),
  rationale: NonEmptyStringSchema
}).strict()

const PhysiologyLimitationSchema = z.object({ id: z.string().regex(/^LIMITATION:PHYS-[A-Z0-9-]+$/), category: z.enum(['scope', 'evidence', 'applicability', 'validation', 'clinical']), statement: NonEmptyStringSchema }).strict()
const upstreamEnvelope = (schema) => releaseItemsEnvelopeSchema(PhysiologyReleaseRefSchema, schema)
export const PhysiologyContextsResponseSchema = upstreamEnvelope(PhysiologyContextSchema)
export const PhysiologyApplicabilityResponseSchema = upstreamEnvelope(PhysiologyApplicabilitySchema)
export const PhysiologyQuantitiesResponseSchema = upstreamEnvelope(PhysiologyQuantitySchema)
export const PhysiologyModelEvidenceResponseSchema = upstreamEnvelope(PhysiologyModelEvidenceSchema)
export const PhysiologyValidationResponseSchema = upstreamEnvelope(PhysiologyValidationSchema)
export const PhysiologyCoverageResponseSchema = upstreamEnvelope(PhysiologyCoverageSchema)
export const PhysiologyBenchmarksResponseSchema = z.object({ release: PhysiologyReleaseRefSchema, items: z.array(PhysiologyBenchmarkSchema), observations: z.array(PhysiologyObservationSchema) }).strict()
export const PhysiologyDetailSchema = z.object({ release: PhysiologyReleaseRefSchema, manifest: PhysiologyManifestSchema, limitations: z.array(PhysiologyLimitationSchema).length(6) }).strict()

const ShapeSchema = z.array(PositiveIntSchema.max(1_000_000)).min(1).max(4)
const PackagePathSchema = z.union([z.enum(['model.json', 'coupling.json']), z.string().regex(/^process\/[a-z0-9][a-z0-9._-]{0,63}$/)])
const PackageContentSchema = z.object({
  path: PackagePathSchema,
  sha256: PhysiologySha256Schema,
  bytes: PositiveIntSchema.max(BPP_MAX_ENTRY_BYTES),
  mediaType: z.enum(['application/json', 'application/javascript'])
}).strict()

export const BppManifestSchema = z.object({
  profile: z.literal(BPP_PROFILE),
  schemaVersion: z.literal('1.0.0'),
  packageId: z.string().regex(/^org\.biochemical-inference\.synthetic\.(?:circulation|liver|kidney)$/),
  pluginId: ReferencePluginIdSchema,
  pluginVersion: z.literal('1.0.0'),
  pluginKind: z.enum(['declarative', 'process']),
  publisher: z.object({ keyId: z.string().regex(/^ed25519:[a-f0-9]{16}$/), algorithm: z.literal('Ed25519') }).strict(),
  evidence: z.object({ releaseId: z.literal(PHYSIOLOGY_RELEASE_ID), releaseDigest: z.literal(PHYSIOLOGY_RELEASE_DIGEST), modelEvidenceId: z.string().regex(/^MODEL-EVIDENCE:(?:CIRCULATION|LIVER|KIDNEY)-REFERENCE$/), modelEvidenceDigest: PhysiologySha256Schema, protocolEvidenceDigest: PhysiologySha256Schema }).strict(),
  license: z.object({ spdx: z.literal('CC0-1.0'), redistributable: z.literal(true), notice: NonEmptyStringSchema.max(500) }).strict(),
  applicability: z.object({ taxonIds: z.tuple([z.literal('NCBITaxon:9606')]), contextIds: z.tuple([PhysiologyContextIdSchema]), domains: z.tuple([z.enum(['circulation', 'liver', 'kidney'])]), useScopes: z.tuple([z.literal('bounded-three-plugin-coupling-conformance')]), exclusions: z.array(NonEmptyStringSchema.max(500)).min(1).max(8) }).strict(),
  resources: z.object({ cpuCores: z.number().int().min(1).max(2), memoryMb: z.number().int().min(16).max(128), wallTimeMs: z.number().int().min(100).max(10_000), maxOutputBytes: z.number().int().min(1024).max(1_000_000) }).strict(),
  permissions: z.object({ network: z.literal(false), filesystem: z.literal('none'), subprocess: z.literal(false) }).strict(),
  entrypoints: z.object({ model: z.literal('model.json'), coupling: z.literal('coupling.json'), process: z.string().regex(/^process\/[a-z0-9._-]+$/).nullable() }).strict(),
  contents: z.array(PackageContentSchema).min(2).max(3),
  synthetic: z.literal(true),
  scientificValidation: z.literal('unsupported'),
  warning: z.literal(PHYSIOLOGY_WARNING)
}).strict().superRefine((manifest, context) => {
  if ((manifest.pluginKind === 'process') !== (manifest.entrypoints.process !== null)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Process entrypoint must match plugin kind.' })
  const paths = manifest.contents.map((item) => item.path).sort()
  const expected = manifest.entrypoints.process ? ['coupling.json', 'model.json', manifest.entrypoints.process].sort() : ['coupling.json', 'model.json']
  if (paths.join(',') !== expected.join(',')) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Package content closure does not match its entrypoints.' })
})

export const BppModelDescriptorSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  pluginId: ReferencePluginIdSchema,
  modelType: z.literal('declarative-piecewise-flow-v1'),
  contextId: PhysiologyContextIdSchema,
  evidenceModelDigest: PhysiologySha256Schema,
  state: z.object({ id: z.literal('STATE:DRUG-MASS'), semantic: z.literal('drug-mass'), dimension: z.literal('mass'), unit: z.literal('mg'), shape: ShapeSchema, initial: FiniteNumberSchema.nonnegative() }).strict(),
  cadenceMinutes: PositiveFiniteSchema,
  outputSchedules: z.array(z.object({ portId: PhysiologyPortIdSchema, intervals: z.array(z.object({ startMinute: FiniteNumberSchema.nonnegative(), endMinute: PositiveFiniteSchema, value: FiniteNumberSchema.nonnegative(), unit: z.literal('mg/min') }).strict().refine((item) => item.endMinute > item.startMinute, 'Flow interval must be ordered.')).min(1).max(16) }).strict()).max(4)
}).strict()

export const BppCouplingDescriptorSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  pluginId: ReferencePluginIdSchema,
  protocolEvidenceDigest: PhysiologySha256Schema,
  cadenceMinutes: PositiveFiniteSchema,
  interpolation: z.literal('zero-order-hold'),
  integration: z.literal('exact-piecewise-constant'),
  ports: z.array(PhysiologyPortSchema).min(2).max(4)
}).strict()

export const BppSignatureSchema = z.object({
  schemaVersion: z.literal('1.0.0'),
  algorithm: z.literal('Ed25519'),
  keyId: z.string().regex(/^ed25519:[a-f0-9]{16}$/),
  signedDigest: PhysiologyDigestSchema,
  signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/)
}).strict()

export const PackageValidationRequestSchema = z.object({ packageBase64: z.string().min(4).max(BPP_BASE64_MAX_LENGTH).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/) }).strict()
export const PackageFindingSchema = z.object({ code: z.string().regex(/^[a-z0-9_]+$/), path: NonEmptyStringSchema, message: NonEmptyStringSchema }).strict()

export const CertificationSchema = z.object({
  status: z.enum(['certified-conformant', 'not-certified']),
  checks: z.object({ signature: z.boolean(), schema: z.boolean(), ports: z.boolean(), applicability: z.boolean(), license: z.boolean(), resources: z.boolean(), conformanceBenchmark: z.boolean() }).strict(),
  protocolConformance: z.enum(['passed', 'failed', 'not-run']),
  scientificValidation: z.literal('unsupported'),
  statement: z.literal('Certification is software protocol conformance only and does not establish scientific validity.')
}).strict()

export const PhysiologyPackageSchema = z.object({
  packageDigest: PhysiologyDigestSchema,
  modelDescriptorDigest: PhysiologyDigestSchema,
  couplingDescriptorDigest: PhysiologyDigestSchema,
  bytes: PositiveIntSchema.max(BPP_MAX_ARCHIVE_BYTES),
  installedAt: UtcDatetimeSchema,
  builtIn: z.boolean(),
  manifest: BppManifestSchema,
  signature: BppSignatureSchema,
  trust: z.object({ keyId: z.string(), status: z.enum(['trusted', 'revoked', 'unknown']), publisher: NonEmptyStringSchema }).strict(),
  certification: CertificationSchema
}).strict()

export const PackageValidationResponseSchema = z.object({
  valid: z.boolean(),
  installable: z.boolean(),
  profile: z.literal(BPP_PROFILE),
  package: PhysiologyPackageSchema.nullable(),
  findings: z.array(PackageFindingSchema)
}).strict()

export const TrustKeySchema = z.object({ keyId: z.string(), algorithm: z.literal('Ed25519'), publisher: NonEmptyStringSchema, publicKeySpkiBase64: z.string().min(32), status: z.enum(['trusted', 'revoked']), createdAt: UtcDatetimeSchema, revokedAt: UtcDatetimeSchema.nullable() }).strict()
export const TrustKeyAddRequestSchema = z.object({ keyId: z.string().regex(/^ed25519:[a-f0-9]{16}$/), algorithm: z.literal('Ed25519'), publisher: z.string().trim().min(1).max(160), publicKeySpkiBase64: z.string().regex(/^[A-Za-z0-9+/]+={0,2}$/).max(256) }).strict()

export const CouplingCreateRequestSchema = z.object({
  packageDigests: z.array(PhysiologyDigestSchema).length(3),
  taxonId: PhysiologyTaxonSchema,
  durationMinutes: z.number().int().min(1).max(4).default(4),
  couplingCadenceMinutes: PositiveFiniteSchema.max(2).default(1),
  interpolation: z.literal('zero-order-hold').default('zero-order-hold'),
  refinementFactors: z.tuple([z.literal(1), z.literal(2), z.literal(4)]).default([1, 2, 4]),
  convergenceToleranceMg: PositiveFiniteSchema.max(0.01).default(1e-9)
}).strict()

const CouplingExchangeSchema = z.object({
  quantityId: PhysiologyQuantityIdSchema,
  source: EndpointSchema,
  target: EndpointSchema,
  semantic: z.literal('drug-mass-flow'),
  dimension: z.literal('mass_rate'),
  unit: z.literal('mg/min'),
  shape: ShapeSchema,
  cadenceMinutes: PositiveFiniteSchema,
  interpolation: z.literal('zero-order-hold'),
  integration: z.literal('exact-piecewise-constant'),
  conservation: z.literal('source-loss-equals-target-gain')
}).strict()

export const PhysiologyCouplingSchema = z.object({
  couplingDigest: PhysiologyDigestSchema,
  schemaVersion: z.literal('1.0.0'),
  packageDigests: z.array(PhysiologyDigestSchema).length(3),
  pluginDigests: z.record(PhysiologyPluginIdSchema, PhysiologyDigestSchema),
  taxonId: z.literal('NCBITaxon:9606'),
  durationMinutes: z.number().int().min(1).max(4),
  couplingCadenceMinutes: PositiveFiniteSchema,
  interpolation: z.literal('zero-order-hold'),
  refinementFactors: z.tuple([z.literal(1), z.literal(2), z.literal(4)]),
  convergenceToleranceMg: PositiveFiniteSchema,
  exchanges: z.array(CouplingExchangeSchema).length(4),
  applicabilityIntersection: z.object({ taxonIds: z.tuple([z.literal('NCBITaxon:9606')]), useScopes: z.tuple([z.literal('bounded-three-plugin-coupling-conformance')]), contextBindings: z.array(PhysiologyContextIdSchema).length(3), exclusions: z.array(z.string()).min(3) }).strict(),
  scientificValidation: z.literal('unsupported'),
  warning: z.literal(PHYSIOLOGY_WARNING),
  createdAt: UtcDatetimeSchema
}).strict()

export const PhysiologyRunRequestSchema = z.object({ couplingDigest: PhysiologyDigestSchema }).strict()
const StateSnapshotSchema = z.object({ timeMinutes: FiniteNumberSchema.nonnegative(), massesMg: z.record(ReferencePluginIdSchema, FiniteNumberSchema.nonnegative()), totalMassMg: FiniteNumberSchema.nonnegative(), massConservationResidualMg: FiniteNumberSchema }).strict()
const ExchangeAmountSchema = z.object({ intervalStartMinutes: FiniteNumberSchema.nonnegative(), intervalEndMinutes: PositiveFiniteSchema, quantityId: PhysiologyQuantityIdSchema, rateMgPerMinute: FiniteNumberSchema.nonnegative(), integratedAmountMg: FiniteNumberSchema.nonnegative(), sourceLossMg: FiniteNumberSchema.nonnegative(), targetGainMg: FiniteNumberSchema.nonnegative(), residualMg: FiniteNumberSchema }).strict()

export const PhysiologyRunSchema = z.object({
  runDigest: PhysiologyDigestSchema,
  couplingDigest: PhysiologyDigestSchema,
  packageDigests: z.array(PhysiologyDigestSchema).length(3),
  pluginDigests: z.record(PhysiologyPluginIdSchema, PhysiologyDigestSchema),
  status: z.literal('completed'),
  protocolEvents: z.array(z.object({ sequence: PositiveIntSchema, timeMinutes: FiniteNumberSchema.nonnegative(), pluginId: ReferencePluginIdSchema, event: z.enum(['initialize', 'read-inputs', 'advance', 'publish-outputs']), cadenceDue: z.boolean() }).strict()).min(1),
  schedule: z.array(z.object({ timeMinutes: FiniteNumberSchema.nonnegative(), duePluginIds: z.array(ReferencePluginIdSchema) }).strict()).min(2),
  states: z.array(StateSnapshotSchema).min(2),
  exchanges: z.array(ExchangeAmountSchema).min(4),
  diagnostics: z.object({ initialMassMg: FiniteNumberSchema.nonnegative(), finalMassMg: FiniteNumberSchema.nonnegative(), maximumAbsoluteResidualMg: FiniteNumberSchema.nonnegative(), massConserved: z.boolean(), deterministic: z.literal(true), cadenceMinutes: PositiveFiniteSchema, interpolation: z.literal('zero-order-hold'), refinement: z.array(z.object({ factor: z.union([z.literal(1), z.literal(2), z.literal(4)]), stepMinutes: PositiveFiniteSchema, finalMassesMg: z.record(ReferencePluginIdSchema, FiniteNumberSchema.nonnegative()), maximumAbsoluteResidualMg: FiniteNumberSchema.nonnegative() }).strict()).length(3), convergenceMaximumDifferenceMg: FiniteNumberSchema.nonnegative(), converged: z.boolean() }).strict(),
  applicability: z.object({ supported: z.literal(true), intersection: PhysiologyCouplingSchema.shape.applicabilityIntersection }).strict(),
  protocolConformance: z.literal('passed'),
  scientificValidation: z.literal('unsupported'),
  warning: z.literal(PHYSIOLOGY_WARNING),
  completedAt: UtcDatetimeSchema
}).strict()

export const ConformanceResultSchema = z.object({ packageDigest: PhysiologyDigestSchema, certification: CertificationSchema, benchmark: z.object({ id: z.literal('DATASET:PHYS-HUMAN-THREE-PLUGIN-MASS-BALANCE'), passed: z.boolean(), maximumAbsoluteDifferenceMg: FiniteNumberSchema.nonnegative(), partition: z.literal('fixed-calibration-validation') }).strict(), protocolSequence: z.array(z.string()).min(4), scientificValidation: z.literal('unsupported'), warning: z.literal(PHYSIOLOGY_WARNING) }).strict()

export const PhysiologyEvidenceSchema = z.object({
  release: PhysiologyReleaseRefSchema,
  manifest: PhysiologyManifestSchema,
  contexts: z.array(PhysiologyContextSchema).length(3),
  applicability: z.array(PhysiologyApplicabilitySchema).length(3),
  quantities: z.array(PhysiologyQuantitySchema).length(4),
  modelEvidence: z.array(PhysiologyModelEvidenceSchema).length(3),
  benchmarks: z.array(PhysiologyBenchmarkSchema).length(1),
  observations: z.array(PhysiologyObservationSchema).length(4),
  validation: z.array(PhysiologyValidationSchema).length(4),
  coverage: z.array(PhysiologyCoverageSchema).length(16),
  limitations: z.array(PhysiologyLimitationSchema).length(6),
  warning: z.literal(PHYSIOLOGY_WARNING)
}).strict()

export const PhysiologyDiscoverySchema = z.object({
  contractVersion: z.literal(PHYSIOLOGY_CONTRACT_VERSION),
  releaseId: z.literal(PHYSIOLOGY_RELEASE_ID),
  releaseDigest: z.literal(PHYSIOLOGY_RELEASE_DIGEST),
  packageProfile: z.literal(BPP_PROFILE),
  processPlugins: z.enum(['sandbox-gated', 'disabled']),
  scientificValidation: z.literal('unsupported'),
  warning: z.literal(PHYSIOLOGY_WARNING),
  routes: z.object({ evidence: z.string(), validatePackage: z.string(), installPackage: z.string(), catalog: z.string(), couplings: z.string(), runs: z.string(), coverage: z.string(), trust: z.string() }).strict()
}).strict()

export const PhysiologyCoverageMatrixSchema = z.object({
  release: PhysiologyReleaseRefSchema,
  items: z.array(PhysiologyCoverageSchema.extend({ installed: z.boolean() }).strict()).length(16),
  warning: z.literal(PHYSIOLOGY_WARNING)
}).strict()
