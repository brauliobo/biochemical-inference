import { z } from 'zod'
import { Sha256HexSchema, UtcInstantSchema, IsoDateSchema, KebabIdSchema, ReleaseIdSchema, DecimalTextSchema, boundedIdentifierSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, StrictEmptyObjectSchema, PageLimitSchema, CursorSchema, pageLimitQuerySchema, isCanonicalBase64Url, releaseRefSchema } from './commons/schemas.js'

export const MEASURED_BASELINE_RELEASE_ID = 'measured-apap-observation-commons-v1.0.0'
export const MEASURED_BASELINE_RELEASE_DIGEST = '96bb00dc5b7f718275f890ab43b085eb87015b8ab4af023af51a1a9916830572'
export const MEASURED_BASELINE_MANIFEST_DIGEST = 'b9bf9fd6ef1e7c7dd6ba077145743ad186d75a59e2dde4da989b0a448b408252'
export const MEASURED_BASELINE_ENVELOPE_DIGEST = '90b1e8d61de353bc75441adf46a1dd05eb5d6774223c4e6ce208a638b44ca00a'
export const MEASURED_BASELINE_SIGNER_KEY_ID = 'goal12-measured-2026'
export const MEASURED_BASELINE_SIGNER_PUBLIC_KEY = 'fEj0E7bygqJsWhxAHij30MQdFjDnRcGrtpnQ8_iq4M0'
export const MEASURED_RELEASE_ID = 'measured-apap-observation-commons-v1.0.1'
export const MEASURED_RELEASE_DIGEST = '6a1f81b41d89e52d666e38a26943955ed3fdb008adb7ae23bb2c353abc0cd496'
export const MEASURED_CATALOG_DIGEST = 'd9a68ad32700b592dd3bbbe98e54c514cfc03041a514e25b29a2fc64aaad3853'
export const MEASURED_TRUST_DIGEST = '5ddd92b32724378a692a2e815935bc8ee1abd46be1ba2afaba26d55e5bbd8160'
export const MEASURED_MANIFEST_DIGEST = '32b687616d8521f344d0fc0b20aa3415739262c5076a6a6802253baf9741b4d7'
export const MEASURED_ENVELOPE_DIGEST = 'f4fca212d1d4a73cb01f5978075b8f92e09bc482791b3d053ab90c87d2860df4'
export const MEASURED_SIGNER_KEY_ID = 'goal12-measured-2026-rotation-1'
export const MEASURED_SIGNER_PUBLIC_KEY = 'wXpO3gYV4ASU2o5X_sfLF4ZMewvm80e1sXZo_tG2FRI'
export const MEASURED_CALIBRATION_PARTITION_ID = 'partition:calibration:cebs-c55801c'
export const MEASURED_CALIBRATION_PARTITION_DIGEST = '94c248dc2e12c8d339d8283bfecb25fcfab044cf975cc0050edd31b584cdb7c3'
export const MEASURED_HELDOUT_PARTITION_ID = 'partition:external-held-out:zenodo7648975'
export const MEASURED_HELDOUT_PARTITION_DIGEST = 'f3e7c59a1ff0cb3fe4fd7c9712711ed88ea682482af109e8a239f9dd2afc39b6'
export const MEASURED_CSRF_HEADER = 'x-measured-csrf'
export const MEASURED_CSRF_VALUE = 'measured-commons-v1'
export const MEASURED_CALIBRATION_ALGORITHM = 'descriptive-linear-dose-response-v1.0.0'
export const MEASURED_GROUP_IDS = Object.freeze(['group:cebs0004:dose-0', 'group:cebs0004:dose-150', 'group:cebs0004:dose-1500', 'group:cebs0004:dose-2000', 'group:cebs0004:dose-50'])
export const MEASURED_SELECTED_LINEAGE_IDS = Object.freeze([
  'measurement:cebs0003:0001:d1:alb',
  'measurement:cebs0004:0113:h24:alt', 'measurement:cebs0004:0114:h24:alt', 'measurement:cebs0004:0115:h24:alt',
  'measurement:cebs0004:0116:h24:alt', 'measurement:cebs0004:0117:h24:alt', 'measurement:cebs0004:0118:h24:alt',
  'measurement:cebs0004:0119:h24:alt', 'measurement:cebs0004:0120:h24:alt', 'measurement:cebs0004:0127:h24:alt',
  'measurement:cebs0004:0128:h24:alt', 'measurement:cebs0004:0129:h24:alt', 'measurement:cebs0004:0130:h24:alt',
  'measurement:cebs0004:0131:h24:alt', 'measurement:cebs0004:0132:h24:alt', 'measurement:cebs0004:0133:h24:alt',
  'measurement:cebs0004:0147:h24:alt', 'measurement:cebs0004:0148:h24:alt', 'measurement:cebs0004:0149:h24:alt',
  'measurement:cebs0004:0150:h24:alt', 'measurement:cebs0004:0151:h24:alt', 'measurement:cebs0004:0152:h24:alt',
  'measurement:cebs0004:0153:h24:alt', 'measurement:cebs0004:0204:h24:alt', 'measurement:cebs0004:0205:h24:alt',
  'measurement:cebs0004:0206:h24:alt', 'measurement:cebs0004:0207:h24:alt', 'measurement:cebs0004:0215:h24:alt',
  'measurement:cebs0004:0216:h24:alt', 'measurement:cebs0004:0217:h24:alt', 'measurement:cebs0004:0218:h24:alt',
  'measurement:cebs0004:0219:h24:alt', 'measurement:cebs0004:0220:h24:alt', 'measurement:cebs0004:0221:h24:alt',
  'measurement:cebs0004:0222:h24:alt'
])
export const MEASURED_API_VIEW_SPECS = Object.freeze([
  { viewId: 'families-all', endpoint: 'datasets', recordType: 'families', query: { role: null }, count: 3, root: 'e5b3a1e096567e7c2263a8b54825e77d8f803f0bad480f555d5472fc6f6c1f35' },
  { viewId: 'studies-all', endpoint: 'studies', recordType: 'studies', query: { family_id: null }, count: 3, root: '828facf29e73ae53d91ad3f8d66cc6a931e92fab25c656f65c310061f3ef8329' },
  { viewId: 'partitions-all', endpoint: 'partitions', recordType: 'partitions', query: { role: null }, count: 3, root: '3e0bd60c2b40549cb6fd7c3a7e3d8f610468824b837fc350c05a771eb5999924' },
  { viewId: 'applicability-all', endpoint: 'applicability', recordType: 'applicability', query: { observable_id: null, study_id: null }, count: 25, root: '81efe88c61498d1e19898dc573faac3c8a752cc9b728c43cc276f0df82faf501' },
  { viewId: 'sources-all', endpoint: 'provenance', recordType: 'sources', query: { source: null }, count: 6, root: 'e432bfb38e0e28cb444190a2f2eb307633f585bc5f9d53ce92ef3bc89f2fb6ca' },
  { viewId: 'exclusions-all', endpoint: 'exclusions', recordType: 'exclusions', query: { reason_code: null }, count: 3, root: '624ad5278ba1b9278e9789e182ec0ce322dedfcf6b24a9d78700477c0912560c' },
  { viewId: 'measurements-development', endpoint: 'measurements', recordType: 'measurements', query: { group_id: null, level: null, observable_id: null, role: 'development', study_id: null }, count: 687, root: 'fda47ace612a52a2a7a99ebc6aaf94511d118615d09a4b69b14a35d10c82ab43' },
  { viewId: 'measurements-calibration', endpoint: 'measurements', recordType: 'measurements', query: { group_id: null, level: null, observable_id: null, role: 'calibration', study_id: null }, count: 851, root: '29d69b86e501cebb7f35b8912e700c631c33c098023353fee2b938cea7e20697' },
  { viewId: 'missingness-development', endpoint: 'missingness', recordType: 'missingness', query: { observable_id: null, reason: null, role: 'development', study_id: null }, count: 15, root: '50b846730cb31aa8e8b3fa98a1e9015e6155ab669cc29917e1de0c5ddc7f1019' },
  { viewId: 'missingness-calibration', endpoint: 'missingness', recordType: 'missingness', query: { observable_id: null, reason: null, role: 'calibration', study_id: null }, count: 73, root: 'a752d591e4e93d683007371782c0b8a23035cfa55d291bdf3d04d85b18571724' }
])
export const MEASURED_SELECTED_LINEAGE_ROOT = '08094df6e24b2325c5760769beba74fdb5c1dc9a19e6ee6d1eed1fb3387fdcd3'

export const MEASURED_PINS = Object.freeze({
  releaseId: MEASURED_RELEASE_ID,
  releaseDigest: MEASURED_RELEASE_DIGEST,
  catalogDigest: MEASURED_CATALOG_DIGEST,
  trustDigest: MEASURED_TRUST_DIGEST,
  manifestDigest: MEASURED_MANIFEST_DIGEST,
  envelopeDigest: MEASURED_ENVELOPE_DIGEST,
  signerKeyId: MEASURED_SIGNER_KEY_ID,
  signerPublicKey: MEASURED_SIGNER_PUBLIC_KEY,
  baseline: Object.freeze({
    releaseId: MEASURED_BASELINE_RELEASE_ID,
    releaseDigest: MEASURED_BASELINE_RELEASE_DIGEST,
    manifestDigest: MEASURED_BASELINE_MANIFEST_DIGEST,
    envelopeDigest: MEASURED_BASELINE_ENVELOPE_DIGEST,
    signerKeyId: MEASURED_BASELINE_SIGNER_KEY_ID,
    signerPublicKey: MEASURED_BASELINE_SIGNER_PUBLIC_KEY
  })
})

export const Sha256Schema = Sha256HexSchema
const IdentifierSchema = boundedIdentifierSchema(160)
const RoleSchema = z.enum(['development', 'calibration', 'validation', 'external-held-out'])
const UnitText = NonEmptyStringSchema.max(64)

export const MeasuredSignatureSchema = z.object({
  algorithm: z.literal('Ed25519'),
  key_id: KebabIdSchema,
  signed_at: UtcInstantSchema,
  value: z.string().refine((value) => isCanonicalBase64Url(value, 64))
}).strict()

export const MeasuredTrustKeySchema = z.object({
  key_id: KebabIdSchema,
  algorithm: z.literal('Ed25519'),
  public_key: z.string().refine((value) => isCanonicalBase64Url(value, 32)),
  status: z.enum(['active', 'retired', 'revoked']),
  valid_from: IsoDateSchema,
  valid_until: IsoDateSchema.nullable(),
  reason: z.string().nullable()
}).strict()

export const MeasuredTrustStoreSchema = z.object({
  keys: z.array(MeasuredTrustKeySchema).min(1),
  trust_schema_version: z.literal('1.0.0')
}).strict().superRefine((trust, context) => {
  const ids = trust.keys.map((key) => key.key_id)
  const publicKeys = trust.keys.map((key) => key.public_key)
  if (new Set(ids).size !== ids.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Trust key IDs must be unique.' })
  if (new Set(publicKeys).size !== publicKeys.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Trust keys cannot alias one public key.' })
  for (const key of trust.keys) {
    if (key.valid_until !== null && key.valid_until < key.valid_from) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Trust key interval is invalid.' })
    if (key.status === 'retired' && key.valid_until === null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Retired keys require valid_until.' })
  }
})

export const MeasuredRecordCountsSchema = z.object({
  applicability: NonNegativeIntSchema, assays: NonNegativeIntSchema, contexts: NonNegativeIntSchema,
  exclusions: NonNegativeIntSchema, experimental_units: NonNegativeIntSchema, families: NonNegativeIntSchema,
  groups: NonNegativeIntSchema, interventions: NonNegativeIntSchema, licenses: NonNegativeIntSchema,
  limitations: NonNegativeIntSchema, measurements: NonNegativeIntSchema, missingness: NonNegativeIntSchema,
  observables: NonNegativeIntSchema, partitions: NonNegativeIntSchema, protocols: NonNegativeIntSchema,
  sources: NonNegativeIntSchema, specimens: NonNegativeIntSchema, studies: NonNegativeIntSchema,
  transformations: NonNegativeIntSchema, uncertainties: NonNegativeIntSchema
}).strict()

const CatalogReleaseSchema = z.object({
  envelope_sha256: Sha256Schema,
  manifest_sha256: Sha256Schema,
  record_counts: MeasuredRecordCountsSchema,
  release_digest: Sha256Schema,
  release_id: ReleaseIdSchema,
  schema_version: z.literal('1.0.0')
}).strict()

export const MeasuredCatalogSchema = z.object({
  catalog_envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({ catalog_version: z.literal('1.0.0'), published_at: IsoDateSchema, releases: z.array(CatalogReleaseSchema).max(16) }).strict(),
  signature: MeasuredSignatureSchema
}).strict()

const ManifestFileSchema = z.object({
  bytes: PositiveIntSchema,
  path: z.string().regex(/^records\/[a-z_]+\.ndjson$/),
  record_count: NonNegativeIntSchema,
  record_type: z.enum(['licenses', 'sources', 'families', 'studies', 'groups', 'experimental_units', 'specimens', 'protocols', 'assays', 'interventions', 'observables', 'contexts', 'uncertainties', 'transformations', 'measurements', 'missingness', 'partitions', 'limitations', 'applicability', 'exclusions']),
  sha256: Sha256Schema
}).strict()

const MeasuredSemanticDiffSchema = z.object({
  baseline_release_id: z.literal(MEASURED_BASELINE_RELEASE_ID),
  classification: z.literal('transport-inclusion-proof-only'),
  statement: z.literal('No scientific records or source objects changed; v1.0.1 only adds signed API-view and selected-lineage inclusion proofs.')
}).strict()

export const ApiViewDescriptorSchema = z.object({
  count: NonNegativeIntSchema.max(100_000),
  endpoint: z.string().regex(/^\/api\/measured\/v1\/releases\/[a-z0-9.-]+\/[a-z]+$/),
  query: z.record(z.string(), z.string().nullable()),
  record_type: z.enum(['licenses', 'sources', 'families', 'studies', 'groups', 'experimental_units', 'specimens', 'protocols', 'assays', 'interventions', 'observables', 'contexts', 'uncertainties', 'transformations', 'measurements', 'missingness', 'partitions', 'limitations', 'applicability', 'exclusions']),
  root_schema_version: z.literal('measured-api-items-rfc8785-v1'),
  root_sha256: Sha256Schema,
  sort: z.literal('id:asc'),
  view_id: IdentifierSchema
}).strict()

export const SelectedLineageSelectionSchema = z.object({
  calibration_family_id: z.literal('family:cebs:study-c55801c'),
  calibration_observable_id: z.literal('observable:cebs:alt'),
  calibration_role: z.literal('calibration'),
  calibration_study_id: z.literal('study:cebs:002-01586-0004-0000-6'),
  calibration_time_unit: z.literal('h'),
  calibration_time_value: z.literal('24'),
  display_example_rule: z.literal('lexicographically-first-development-measurement')
}).strict()

export const SelectedLineageViewDescriptorSchema = z.object({
  count: z.literal(35),
  endpoint_template: z.literal(`/api/measured/v1/releases/${MEASURED_RELEASE_ID}/lineage/{measurement_id}`),
  measurement_ids: z.tuple(MEASURED_SELECTED_LINEAGE_IDS.map((id) => z.literal(id))),
  root_schema_version: z.literal('measured-selected-lineages-rfc8785-v1'),
  root_sha256: z.literal(MEASURED_SELECTED_LINEAGE_ROOT),
  selection: SelectedLineageSelectionSchema,
  sort: z.literal('measurement_id:asc'),
  view_id: z.literal('selected-consumer-lineages')
}).strict()

export const MeasuredManifestSchema = z.object({
  digest_algorithm: z.literal('sha256-rfc8785-manifest-v1'),
  files: z.array(ManifestFileSchema).min(1).max(32),
  immutable: z.literal(true),
  manifest_schema_version: z.literal('1.1.0'),
  published_at: IsoDateSchema,
  recipe_path: z.string().regex(/^recipes\/[a-z0-9.-]+\.json$/),
  recipe_sha256: Sha256Schema,
  record_counts: MeasuredRecordCountsSchema,
  release_digest: Sha256Schema,
  release_id: ReleaseIdSchema,
  schema_version: z.literal('1.0.0'),
  scientific_scope: NonEmptyStringSchema.max(2048),
  source_lock_path: z.string().regex(/^sources\/locks\/[a-z0-9.-]+\.json$/),
  source_lock_sha256: Sha256Schema,
  title: NonEmptyStringSchema.max(256),
  semantic_diff: MeasuredSemanticDiffSchema,
  api_views: z.array(ApiViewDescriptorSchema).length(10),
  selected_lineage_view: SelectedLineageViewDescriptorSchema
}).strict()

export const MeasuredEnvelopeSchema = z.object({
  envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({
    manifest_sha256: Sha256Schema, recipe_sha256: Sha256Schema, release_digest: Sha256Schema,
    release_id: ReleaseIdSchema, schema_version: z.literal('1.0.0'), source_lock_sha256: Sha256Schema
  }).strict(),
  signature: MeasuredSignatureSchema
}).strict()

export const MeasuredReleaseRefSchema = releaseRefSchema(ReleaseIdSchema, '1.0.0', Sha256Schema)

export const MeasuredDiscoverySchema = z.object({
  catalog_digest: Sha256Schema,
  contract_version: z.literal('1.0.0'),
  heldout_policy: NonEmptyStringSchema,
  release_count: NonNegativeIntSchema,
  trust_digest: Sha256Schema
}).strict()

export const MeasuredTrustResponseSchema = z.object({ trust: MeasuredTrustStoreSchema, trust_digest: Sha256Schema }).strict()
export const MeasuredReleaseResponseSchema = z.object({ release: MeasuredReleaseRefSchema, manifest: MeasuredManifestSchema }).strict()

export const StudyFamilySchema = z.object({
  basis: z.enum(['independent-study-number', 'independent-publication']), id: IdentifierSchema, role: RoleSchema,
  study_ids: z.array(IdentifierSchema).min(1).max(16), title: NonEmptyStringSchema.max(256)
}).strict()

const BiologicalContextSchema = z.object({
  taxon_id: z.literal('NCBITaxon:10116'), taxon_label: z.literal('Rattus norvegicus'), strain: z.string().nullable(),
  sex: z.enum(['male', 'female']).nullable(), life_stage: z.string().nullable(), tissue: z.string().nullable(), cell: z.string().nullable(),
  compartment: z.string().nullable(), disease: z.string().nullable(), fasting: z.string().nullable(), ph: DecimalTextSchema.nullable(),
  temperature_value: DecimalTextSchema.nullable(), temperature_unit: UnitText.nullable(),
  unreported_fields: z.array(z.enum(['strain', 'sex', 'life_stage', 'tissue', 'cell', 'compartment', 'disease', 'fasting', 'ph', 'temperature'])).max(10)
}).strict()

export const StudySchema = z.object({
  accession: NonEmptyStringSchema.max(256), context: BiologicalContextSchema, family_id: IdentifierSchema, id: IdentifierSchema,
  source_object_ids: z.array(IdentifierSchema).min(1).max(8), title: NonEmptyStringSchema.max(256)
}).strict()

export const PartitionSchema = z.object({
  closure_digest: Sha256Schema, family_ids: z.array(IdentifierSchema).min(1).max(16), id: IdentifierSchema,
  role: RoleSchema, study_ids: z.array(IdentifierSchema).min(1).max(64)
}).strict()

const CopyrightReviewSchema = z.object({
  copyright_marker_present: z.literal(false), reviewed_at: IsoDateSchema, reviewer_role: z.literal('source-rights-reviewer'),
  scope: z.literal('complete exact export bytes'), searched_markers: z.tuple([z.literal('copyright'), z.literal('©'), z.literal('(c)')])
}).strict()

export const SourceSchema = z.object({
  accession: NonEmptyStringSchema.max(256), adapter_id: z.enum(['ntp-cebs-clinchem-html-xls@1.0.0', 'ntp-web-policy-html@1.0.0', 'zenodo-record-metadata@1.0.0', 'exact-pdf@1.0.0', 'reviewed-gsh-transcription@1.0.0']),
  bytes: PositiveIntSchema.max(2 * 1024 * 1024), copyright_marker_review: CopyrightReviewSchema.nullable(), id: IdentifierSchema,
  license_id: IdentifierSchema, live_verified: z.boolean(), md5: z.string().regex(/^[a-f0-9]{32}$/).nullable(),
  media_type: z.enum(['application/vnd.ms-excel', 'application/json', 'application/pdf', 'text/html']),
  object_class: z.enum(['official-data-export', 'rights-policy', 'repository-metadata', 'licensed-article', 'reviewed-transcription']),
  origin_url: z.string().url().nullable(), repository_path: z.string().nullable(), retrieved_at: UtcInstantSchema, sha256: Sha256Schema,
  source: z.enum(['NTP_CEBS', 'NTP', 'ZENODO', 'REPOSITORY_CURATION']), title: NonEmptyStringSchema.max(256)
}).strict()

export const ApplicabilitySchema = z.object({
  id: IdentifierSchema, observable_id: IdentifierSchema, reason: NonEmptyStringSchema.max(2048),
  status: z.enum(['compatible-within-study-context', 'context-incomplete', 'heldout-gated']), study_id: IdentifierSchema
}).strict()

const LocatorSchema = z.object({
  column: PositiveIntSchema, curation_grid_coordinate: z.string().nullable(), locator_kind: z.enum(['source-table', 'curation-grid']),
  page: PositiveIntSchema.nullable(), printed_page: PositiveIntSchema.nullable(), row: PositiveIntSchema,
  source_native_cell: z.string().nullable(), source_object_id: IdentifierSchema, table: NonEmptyStringSchema.max(256)
}).strict()

export const MeasurementSchema = z.object({
  context_id: IdentifierSchema, family_id: IdentifierSchema, group_id: IdentifierSchema, id: IdentifierSchema,
  level: z.enum(['individual', 'aggregate']), locator: LocatorSchema,
  normalized: z.object({ scientific_origin: z.literal('derived-measurement'), transformation_id: IdentifierSchema, unit: UnitText, value: DecimalTextSchema }).strict(),
  observable_id: IdentifierSchema, reported_annotations: z.array(NonEmptyStringSchema.max(32)).max(8), reported_unit: UnitText,
  reported_value: DecimalTextSchema, role: RoleSchema, scientific_origin: z.literal('measured'), source_object_id: IdentifierSchema,
  study_id: IdentifierSchema, uncertainty_id: IdentifierSchema,
  validation_state: z.enum(['source-verified', 'independently-reviewed-transcription'])
}).strict()

export const MissingnessSchema = z.object({
  context_id: IdentifierSchema, family_id: IdentifierSchema, group_id: IdentifierSchema, id: IdentifierSchema,
  locator: LocatorSchema, observable_id: IdentifierSchema, raw_marker: z.string().max(32), reason: z.enum(['blank', 'qns']),
  role: RoleSchema, source_object_id: IdentifierSchema, study_id: IdentifierSchema
}).strict()

export const ExclusionSchema = z.object({
  id: IdentifierSchema, reason_code: z.enum(['outside-declared-table', 'prose-not-ingested', 'assay-context-unreported']),
  scope: NonEmptyStringSchema.max(256), source_object_id: IdentifierSchema, statement: NonEmptyStringSchema.max(2048)
}).strict()

const GroupSchema = z.object({ id: IdentifierSchema, intervention_ids: z.array(IdentifierSchema).max(8), label: NonEmptyStringSchema.max(256), size: PositiveIntSchema.nullable(), study_id: IdentifierSchema }).strict()
const ExperimentalUnitSchema = z.object({ group_id: IdentifierSchema, id: IdentifierSchema, source_subject_id: NonEmptyStringSchema.max(256), study_id: IdentifierSchema, unit_type: z.literal('animal') }).strict()
const SpecimenSchema = z.object({ collection_time_unit: z.enum(['h', 'd']).nullable(), collection_time_value: DecimalTextSchema.nullable(), experimental_unit_id: IdentifierSchema.nullable(), group_id: IdentifierSchema, id: IdentifierSchema, matrix: z.string().nullable(), specimen_type: z.string().nullable(), study_id: IdentifierSchema, unreported_fields: z.array(z.enum(['specimen_type', 'matrix', 'collection_time'])).max(3) }).strict()
const ProtocolSchema = z.object({ id: IdentifierSchema, name: NonEmptyStringSchema.max(256), protocol_class: z.enum(['clinical-chemistry', 'published-group-summary']), source_object_id: IdentifierSchema, study_id: IdentifierSchema }).strict()
const AssaySchema = z.object({ id: IdentifierSchema, method: z.string().nullable(), method_status: z.enum(['reported', 'unreported']), protocol_id: IdentifierSchema, source_label: NonEmptyStringSchema.max(256) }).strict()
const InterventionSchema = z.object({ dose_unit: UnitText.nullable(), dose_value: DecimalTextSchema.nullable(), id: IdentifierSchema, name: NonEmptyStringSchema.max(256), route: z.string().nullable(), schedule: z.string().nullable(), source_label: NonEmptyStringSchema.max(256), study_id: IdentifierSchema, time_unit: UnitText.nullable(), time_value: DecimalTextSchema.nullable(), unreported_fields: z.array(z.enum(['dose', 'route', 'time', 'schedule'])).max(4) }).strict()
const ObservableSchema = z.object({ canonical_unit: UnitText, id: IdentifierSchema, name: NonEmptyStringSchema.max(256), quantity_kind: z.enum(['source-reported-assay-result', 'mass-concentration', 'activity', 'ratio']), raw_unit: UnitText, source_label: NonEmptyStringSchema.max(256) }).strict()
const QualifierSchema = z.object({ column: z.literal(4), name: z.literal('CEBS Control Code'), raw_value: z.string().max(32), row: z.number().int().min(3).max(200), source_native_cell: z.string().regex(/^D[1-9][0-9]*$/), source_object_id: IdentifierSchema, status: z.enum(['reported', 'blank']) }).strict()
const MeasurementContextSchema = z.object({ assay_id: IdentifierSchema, experimental_unit_id: IdentifierSchema.nullable(), group_id: IdentifierSchema, id: IdentifierSchema, intervention_ids: z.array(IdentifierSchema).max(8), protocol_id: IdentifierSchema, qualifiers: z.array(QualifierSchema).max(8), specimen_id: IdentifierSchema.nullable(), study_id: IdentifierSchema }).strict()
const UncertaintySchema = z.object({ id: IdentifierSchema, kind: z.enum(['sem', 'not-reported']), measurement_id: IdentifierSchema, n: PositiveIntSchema.nullable(), unit: UnitText.nullable(), value: DecimalTextSchema.nullable() }).strict()
const TransformationSchema = z.object({ expression: NonEmptyStringSchema.max(256), factor: DecimalTextSchema, id: IdentifierSchema, input_unit: UnitText, kind: z.enum(['identity', 'unit-conversion']), output_unit: UnitText, version: z.literal('1.0.0') }).strict()

export const LicenseSchema = z.object({
  attribution: NonEmptyStringSchema.max(2048), copyright_caveat_text: z.string().nullable(), copyright_status: z.enum(['not-asserted', 'copyright-retained']),
  id: IdentifierSchema, name: NonEmptyStringSchema.max(256), policy_last_updated: IsoDateSchema.nullable(), public_domain_default_text: z.string().nullable(),
  redistribution: z.literal('permitted'), rights_basis: z.enum(['official-federal-public-data-with-third-party-caveat', 'cc-by-4.0']),
  terms_source_object_id: IdentifierSchema.nullable(), terms_url: z.string().url(), third_party_caveat: z.string().nullable()
}).strict()

export const MeasuredLineageSchema = z.object({
  assay: AssaySchema, context: MeasurementContextSchema, experimental_unit: ExperimentalUnitSchema.nullable(), family: StudyFamilySchema,
  group: GroupSchema, interventions: z.array(InterventionSchema), license: LicenseSchema, measurement: MeasurementSchema,
  normalized_transformation: TransformationSchema, observable: ObservableSchema, protocol: ProtocolSchema, source: SourceSchema,
  specimen: SpecimenSchema.nullable(), study: StudySchema, uncertainty: UncertaintySchema
}).strict()

export const MeasuredLineageResponseSchema = z.object({ release: MeasuredReleaseRefSchema, lineage: MeasuredLineageSchema }).strict()

const PAGE_SCHEMAS = Object.freeze({
  families: StudyFamilySchema, studies: StudySchema, partitions: PartitionSchema, applicability: ApplicabilitySchema,
  sources: SourceSchema, measurements: MeasurementSchema, missingness: MissingnessSchema, exclusions: ExclusionSchema
})

function pageSchema(recordType, itemSchema) {
  return z.object({
    items: z.array(itemSchema).max(100), limit: PageLimitSchema, next_cursor: CursorSchema.nullable(),
    page_contract: z.literal('measured-records-v1'), query: z.record(z.string(), z.string().nullable()), record_type: z.literal(recordType),
    release: MeasuredReleaseRefSchema, sort: z.literal('id:asc')
  }).strict()
}

export const MeasuredPageSchema = z.discriminatedUnion('record_type', Object.entries(PAGE_SCHEMAS).map(([type, schema]) => pageSchema(type, schema)))
export const MEASURED_PAGE_SCHEMAS = PAGE_SCHEMAS

export const ConsumerCommitmentSchema = z.object({
  commitment_schema_version: z.literal('1.0.0'), consumer_id: NonEmptyStringSchema.max(128).regex(/^[A-Za-z0-9._:-]+$/), created_at: UtcInstantSchema,
  endpoint_mapping_digest: Sha256Schema, family_ids: z.array(IdentifierSchema).min(1).max(16), metric_threshold_policy_digest: Sha256Schema,
  model_digest: Sha256Schema, nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/), observable_ids: z.array(IdentifierSchema).min(1).max(128),
  parameter_policy_digest: Sha256Schema, prediction_digest: Sha256Schema, release_digest: Sha256Schema, release_id: ReleaseIdSchema,
  target_partition_digest: Sha256Schema, target_partition_id: IdentifierSchema, target_partition_role: z.enum(['validation', 'external-held-out'])
}).strict().superRefine((value, context) => {
  if (value.family_ids.join('\0') !== [...new Set(value.family_ids)].sort().join('\0')) context.addIssue({ code: z.ZodIssueCode.custom, message: 'family_ids must be uniquely sorted.' })
  if (value.observable_ids.join('\0') !== [...new Set(value.observable_ids)].sort().join('\0')) context.addIssue({ code: z.ZodIssueCode.custom, message: 'observable_ids must be uniquely sorted.' })
})

export const EvaluationRequestSchema = z.object({ evaluation_schema_version: z.literal('1.0.0'), commitment_digest: Sha256Schema, frozen_request: ConsumerCommitmentSchema }).strict()
export const CommitmentResponseSchema = z.object({ commitment_contract: z.literal('consumer-measured-commitment-v1'), commitment_digest: Sha256Schema, committed_at: UtcInstantSchema, created_at: UtcInstantSchema, target_partition_digest: Sha256Schema }).strict()
const DisclosedItemSchema = z.object({ family_id: IdentifierSchema, group_id: IdentifierSchema, measurement_id: IdentifierSchema, normalized: z.object({ scientific_origin: z.literal('derived-measurement'), transformation_id: IdentifierSchema, unit: UnitText, value: DecimalTextSchema }).strict(), observable_id: IdentifierSchema, reported_annotations: z.array(z.string()), reported_unit: UnitText, reported_value: DecimalTextSchema, study_id: IdentifierSchema, uncertainty: UncertaintySchema }).strict()
export const EvaluationResponseSchema = z.object({ commitment_digest: Sha256Schema, disclosed_at: UtcInstantSchema, evaluation_contract: z.literal('consumer-measured-disclosure-v1'), items: z.array(DisclosedItemSchema).max(10_000), partition: PartitionSchema, release: MeasuredReleaseRefSchema }).strict()

export const FreezeIntentSchema = z.object({
  calibrationArtifactDigest: Sha256Schema,
  targetPartitionId: z.literal(MEASURED_HELDOUT_PARTITION_ID),
  nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/),
  createdAt: UtcInstantSchema
}).strict()
export const DisclosureIntentSchema = z.object({ commitmentDigest: Sha256Schema }).strict()

const ConsumerArtifactRefSchema = z.object({ bytes: PositiveIntSchema, digest: Sha256Schema, kind: z.enum(['calibration', 'parameter-policy', 'endpoint-mapping', 'metric-threshold-policy', 'prediction']) }).strict()
export const FrozenArtifactRefsSchema = z.object({
  model: ConsumerArtifactRefSchema.extend({ kind: z.literal('calibration') }).strict(),
  parameterPolicy: ConsumerArtifactRefSchema.extend({ kind: z.literal('parameter-policy') }).strict(),
  endpointMapping: ConsumerArtifactRefSchema.extend({ kind: z.literal('endpoint-mapping') }).strict(),
  metricThresholdPolicy: ConsumerArtifactRefSchema.extend({ kind: z.literal('metric-threshold-policy') }).strict(),
  prediction: ConsumerArtifactRefSchema.extend({ kind: z.literal('prediction') }).strict()
}).strict()
export const FreezeResponseSchema = z.object({
  freezeContract: z.literal('artifact-bound-measured-freeze-v1'),
  frozenRequest: ConsumerCommitmentSchema,
  artifacts: FrozenArtifactRefsSchema,
  receipt: CommitmentResponseSchema
}).strict()

export const MeasuredStatusSchema = z.object({ contractVersion: z.literal('1.0.0'), integrity: z.enum(['empty', 'valid', 'failed']), lastError: z.string().nullable(), lastSyncAt: z.string().nullable(), release: MeasuredReleaseRefSchema.nullable(), state: z.enum(['empty', 'syncing', 'ready', 'failed']) }).strict()
export const MeasuredLocalDiscoverySchema = z.object({ contractVersion: z.literal('1.0.0'), dataflowIsolationNotSecrecy: z.literal(true), explicitSync: z.literal(true), localOnlyReads: z.literal(true), pins: z.object({
  releaseId: z.literal(MEASURED_RELEASE_ID), releaseDigest: z.literal(MEASURED_RELEASE_DIGEST), catalogDigest: z.literal(MEASURED_CATALOG_DIGEST),
  trustDigest: z.literal(MEASURED_TRUST_DIGEST), manifestDigest: z.literal(MEASURED_MANIFEST_DIGEST), envelopeDigest: z.literal(MEASURED_ENVELOPE_DIGEST),
  signerKeyId: z.literal(MEASURED_SIGNER_KEY_ID), signerPublicKey: z.literal(MEASURED_SIGNER_PUBLIC_KEY),
  baseline: z.object({ releaseId: z.literal(MEASURED_BASELINE_RELEASE_ID), releaseDigest: z.literal(MEASURED_BASELINE_RELEASE_DIGEST), manifestDigest: z.literal(MEASURED_BASELINE_MANIFEST_DIGEST), envelopeDigest: z.literal(MEASURED_BASELINE_ENVELOPE_DIGEST), signerKeyId: z.literal(MEASURED_BASELINE_SIGNER_KEY_ID), signerPublicKey: z.literal(MEASURED_BASELINE_SIGNER_PUBLIC_KEY) }).strict()
}).strict(), status: MeasuredStatusSchema }).strict()
export const MeasuredSyncRequestSchema = StrictEmptyObjectSchema
export const MeasuredLocalPageQuerySchema = z.object({ cursor: CursorSchema.optional(), limit: pageLimitQuerySchema(25), role: z.enum(['development', 'calibration']).optional() }).strict()
export const MeasuredLocalRecordTypeSchema = z.enum(['families', 'studies', 'partitions', 'applicability', 'sources', 'measurements', 'missingness', 'exclusions'])
function localPageSchema(recordType, itemSchema) {
  return z.object({ filters: z.record(z.string()), items: z.array(itemSchema).max(100), limit: PageLimitSchema, nextCursor: CursorSchema.nullable(), pageContract: z.literal('measured-local-records-v1'), recordType: z.literal(recordType), release: MeasuredReleaseRefSchema, sort: z.literal('id:asc'), source: z.literal('verified-local-mirror') }).strict()
}
export const MeasuredLocalPageSchema = z.discriminatedUnion('recordType', Object.entries(PAGE_SCHEMAS).map(([type, schema]) => localPageSchema(type, schema)))
export const MeasuredLocalLineageResponseSchema = z.object({ lineage: MeasuredLineageSchema, lineageDigest: Sha256Schema, release: MeasuredReleaseRefSchema, source: z.literal('verified-local-mirror') }).strict()
const CalibrationRequestObjectSchema = z.object({
  familyId: z.literal('family:cebs:study-c55801c'), groupIds: z.tuple(MEASURED_GROUP_IDS.map((id) => z.literal(id))),
  observableId: z.literal('observable:cebs:alt'), partitionId: z.literal(MEASURED_CALIBRATION_PARTITION_ID),
  studyId: z.literal('study:cebs:002-01586-0004-0000-6'), timeUnit: z.literal('h'), timeValue: z.literal('24')
}).strict()
export const CalibrationRequestSchema = CalibrationRequestObjectSchema

const CalibrationMeasurementPinSchema = z.object({ id: IdentifierSchema, lineageDigest: Sha256Schema, normalizedUnit: UnitText, normalizedValue: DecimalTextSchema, reportedUnit: UnitText, reportedValue: DecimalTextSchema }).strict()
export const CalibrationArtifactSchema = z.object({
  accessProof: z.object({
    calls: z.object({ applicability: z.literal(1), calibrationMeasurements: z.literal(1), calibrationMissingness: z.literal(1), exclusions: z.literal(1), partition: z.literal(1), release: z.literal(1) }).strict(),
    rows: z.object({ calibrationMeasurements: z.literal(34), calibrationMissingness: NonNegativeIntSchema, exclusions: z.literal(3) }).strict(),
    exposedMethods: z.tuple([z.literal('release'), z.literal('partition'), z.literal('applicability'), z.literal('calibrationMeasurements'), z.literal('calibrationMissingness'), z.literal('exclusions'), z.literal('accessReport')]),
    rolesObserved: z.tuple([z.literal('calibration')]),
    forbiddenMethodsAvailable: z.literal(false),
    developmentMeasurementsRead: z.literal(0), evaluationClientAvailable: z.literal(false), externalHeldoutMeasurementsRead: z.literal(0), validationMeasurementsRead: z.literal(0)
  }).strict(),
  algorithm: z.object({ id: z.literal(MEASURED_CALIBRATION_ALGORITHM), deterministic: z.literal(true), fit: z.literal('ordinary-least-squares-individual-observations') }).strict(),
  artifactDigest: Sha256Schema, artifactSchemaVersion: z.literal('1.0.0'), conclusion: z.literal('no-validation-conclusion'),
  diagnostics: z.object({ assayIds: z.array(IdentifierSchema), doseUnit: UnitText.nullable(), groupCount: NonNegativeIntSchema, measurementCount: NonNegativeIntSchema, protocolIds: z.array(IdentifierSchema), time: z.object({ unit: z.literal('h'), value: z.literal('24') }).strict(), units: z.array(UnitText) }).strict(),
  exclusions: z.array(ExclusionSchema), fit: z.object({ intercept: FiniteNumberSchema, rSquared: FiniteNumberSchema, slope: FiniteNumberSchema }).strict().nullable(),
  measurements: z.array(CalibrationMeasurementPinSchema), missingness: z.array(MissingnessSchema),
  partition: PartitionSchema, reasons: z.array(NonEmptyStringSchema), release: MeasuredReleaseRefSchema,
  selection: CalibrationRequestObjectSchema.extend({ rationale: NonEmptyStringSchema }).strict(), status: z.enum(['completed', 'not-evaluable'])
}).strict()

export const ConsumerArtifactContentSchema = z.discriminatedUnion('artifactKind', [
  z.object({ artifactKind: z.literal('parameter-policy'), artifactSchemaVersion: z.literal('1.0.0'), calibrationArtifactDigest: Sha256Schema, release: MeasuredReleaseRefSchema, targetPartition: PartitionSchema, status: z.literal('not-evaluable'), policy: z.literal('no-heldout-parameter-selection') }).strict(),
  z.object({ artifactKind: z.literal('endpoint-mapping'), artifactSchemaVersion: z.literal('1.0.0'), calibrationArtifactDigest: Sha256Schema, release: MeasuredReleaseRefSchema, targetPartition: PartitionSchema, status: z.literal('not-evaluable'), sourceObservableId: z.literal('observable:renal-gsh'), endpoint: z.literal('renal-gsh-provenance-only'), mapping: z.literal('no-scoring-mapping') }).strict(),
  z.object({ artifactKind: z.literal('metric-threshold-policy'), artifactSchemaVersion: z.literal('1.0.0'), calibrationArtifactDigest: Sha256Schema, release: MeasuredReleaseRefSchema, targetPartition: PartitionSchema, status: z.literal('not-evaluable'), metric: z.null(), threshold: z.null(), scoring: z.literal('none'), conclusion: z.literal('no-validation-conclusion') }).strict(),
  z.object({ artifactKind: z.literal('prediction'), artifactSchemaVersion: z.literal('1.0.0'), calibrationArtifactDigest: Sha256Schema, release: MeasuredReleaseRefSchema, targetPartition: PartitionSchema, status: z.literal('not-evaluable'), predictionCount: z.literal(0), predictions: z.tuple([]), reason: z.literal('Calibration was not evaluable; no predictions were generated.') }).strict()
])

export { CursorSchema, IdentifierSchema, ReleaseIdSchema, RoleSchema }
