import { z } from 'zod'

export const CHALLENGE_RELEASE_ID = 'apap-human-pk-challenge-v1.0.0'
export const CHALLENGE_RELEASE_DIGEST = '3c1c7e50b8b9e10b9912802e471a07d9df50ee5088b441784fb39e441663ffb7'
export const CHALLENGE_CATALOG_DIGEST = '7c825c04df71a33525cb224c1237531784d3e2da93498e7961943543e4a2ef3b'
export const CHALLENGE_TRUST_DIGEST = '36daef48ccd9a3fa412caed0082fa72e61eaf676babc6ca802174a4c56a30b3b'
export const CHALLENGE_MANIFEST_DIGEST = '07ac5f559167d71f2eea142992090fa5332f2ce79682290595db8a41baa2e7f0'
export const CHALLENGE_ENVELOPE_DIGEST = '474eca34b532b49fb666f9d3f04a58e67b20b0ce9740af120637ad40c9c4bb05'
export const CHALLENGE_SIGNER_KEY_ID = 'goal13-challenge-2026'
export const CHALLENGE_SIGNER_PUBLIC_KEY = 'NiSiA9onSkxjUk-nW6iWRnpy5oZrGhXob21Dv6gx8tc'
export const CHALLENGE_PARTITION_ID = 'partition:external-held-out:zenodo13358906'
export const CHALLENGE_PARTITION_DIGEST = 'aaba147a203d1b43055a273b1a7a7fb076015377084defe5172d2a38ddcb8cd9'
export const CHALLENGE_PROTOCOL_ID = 'protocol:apap-human-pk-challenge-v1'
export const CHALLENGE_SAMPLING_GRID_DIGEST = 'f3957d19d16bc1e274306ed1a01fd848b3679880d1a995272e766c12a3e5744c'
export const CHALLENGE_MAPPING_ID = 'mapping:oral-depot-325mg-volume-50l'
export const CHALLENGE_METRIC_ID = 'metric:absolute-relative-error-v1'
export const CHALLENGE_THRESHOLD_ID = 'threshold:absolute-relative-error-le-0.30'
export const CHALLENGE_HELDOUT_POLICY = 'Public responses contain no held-out values, uncertainties, or summaries. Exact outcomes require persisted commitment before disclosure.'
export const CHALLENGE_RESULT_POLICY = 'Scoring is a repository-authored convention and makes no clinical, treatment, or bioequivalence claim.'
export const CHALLENGE_CONCLUSION_BOUNDARY = 'These results concern only aggregate parent-APAP Cmax for the two frozen oral formulations, study population, sampling grid, mapping, metric, and threshold; they make no clinical, treatment, or bioequivalence claim.'
export const CHALLENGE_CSRF_HEADER = 'x-challenge-csrf'
export const CHALLENGE_CSRF_VALUE = 'goal13-challenge-v1'
export const CHALLENGE_REQUEST_BODY_LIMIT = 256 * 1024

export const CHALLENGE_ENDPOINT_IDS = Object.freeze([
  'endpoint:apap-cmax:reference',
  'endpoint:apap-cmax:test'
])
export const CHALLENGE_SAMPLING_LABELS = Object.freeze([
  '0', '00:05', '00:10', '00:15', '00:20', '00:25', '00:30', '00:40', '00:50',
  '01:00', '01:15', '01:30', '01:45', '02:00', '02:30', '03:00', '04:00', '06:00', '08:00', '12:00'
])
export const CHALLENGE_SAMPLING_HOURS = Object.freeze([
  '0', '0.0833333333333333', '0.1666666666666667', '0.25', '0.3333333333333333',
  '0.4166666666666667', '0.5', '0.6666666666666667', '0.8333333333333333', '1',
  '1.25', '1.5', '1.75', '2', '2.5', '3', '4', '6', '8', '12'
])

export const CHALLENGE_API_VIEW_SPECS = Object.freeze([
  { viewId: 'sources-all', recordType: 'sources', count: 3, root: '7a209cea37ec7f5e6a2788ae144f593ada1e7455e270e14b5d8430775a1b6b91' },
  { viewId: 'rights-all', recordType: 'rights', count: 1, root: 'e0b655b7f72820e62992423c2a216a0027b65ff5cb3396a40930dd887635d03a' },
  { viewId: 'source-facts-all', recordType: 'source_facts', count: 12, root: '1f4c8b0b03b608636fb6d57299d052193dfd8cd09729b1d9ae565fa57538ee4f' },
  { viewId: 'studies-all', recordType: 'studies', count: 1, root: '81f9151a7cb2c94ccfa71e026aed53cc8f8f46cf039bfdfbdcc09f9594802bd7' },
  { viewId: 'protocols-all', recordType: 'protocols', count: 1, root: '857decff0e9a4f9f50be200c381996009f6e3881b33b929fc8e61d1218b694c9' },
  { viewId: 'endpoints-all', recordType: 'endpoints', count: 2, root: '38a1d4f8f359bd20018a73ffee76fd0728b178ca91b1e742dc18a19bc8e378f8' },
  { viewId: 'mappings-all', recordType: 'mappings', count: 1, root: 'cf8bdd977717c58653bcd9aea9b92b87296c5ac0d76f21e1782b8419737ce8de' },
  { viewId: 'metrics-all', recordType: 'metrics', count: 1, root: '107c54601f494262c4b35969e5ff51a45cd8f50a42735284ef64a5090a8c0b2b' },
  { viewId: 'thresholds-all', recordType: 'thresholds', count: 1, root: 'c4a412802b05c4fd3f29f4230410a3ef68417cdab9ca072542bbff1929be195d' },
  { viewId: 'exclusions-all', recordType: 'exclusions', count: 3, root: '8bb07527e71a5e582f3e81eb72425f0acef91913c694cd95e13243e2af04c8e0' },
  { viewId: 'not-evaluable-all', recordType: 'not_evaluable', count: 8, root: '0a79bfcaa683b43396e1ccf0e965502ff1338b0ce360084cf1669b3cc185e495' },
  { viewId: 'partitions-all', recordType: 'partitions', count: 1, root: '5e9f105796570ccf9959aa9d159c860cc70a8b0496aa4a1feca45fc4bae11489' }
])

export const CHALLENGE_PINS = Object.freeze({
  releaseId: CHALLENGE_RELEASE_ID,
  releaseDigest: CHALLENGE_RELEASE_DIGEST,
  catalogDigest: CHALLENGE_CATALOG_DIGEST,
  trustDigest: CHALLENGE_TRUST_DIGEST,
  manifestDigest: CHALLENGE_MANIFEST_DIGEST,
  envelopeDigest: CHALLENGE_ENVELOPE_DIGEST,
  signerKeyId: CHALLENGE_SIGNER_KEY_ID,
  signerPublicKey: CHALLENGE_SIGNER_PUBLIC_KEY,
  partitionId: CHALLENGE_PARTITION_ID,
  partitionDigest: CHALLENGE_PARTITION_DIGEST,
  samplingGridDigest: CHALLENGE_SAMPLING_GRID_DIGEST,
  publicViewRoots: Object.freeze(Object.fromEntries(CHALLENGE_API_VIEW_SPECS.map((item) => [item.viewId, item.root])))
})

export const ChallengeSha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const artifactRef = (kind) => z.object({ kind: z.literal(kind), digest: ChallengeSha256Schema, bytes: z.number().int().positive() }).strict()
export const ChallengeArtifactRefsSchema = z.object({
  model: artifactRef('model'),
  equationSet: artifactRef('equation-set'),
  parameterPolicy: artifactRef('parameter-policy'),
  concentrationMapping: artifactRef('concentration-mapping'),
  solver: artifactRef('solver'),
  software: artifactRef('software'),
  diagnostics: artifactRef('diagnostics'),
  prediction: artifactRef('prediction'),
  publicLineage: artifactRef('public-lineage')
}).strict()
const IdentifierSchema = z.string().min(1).max(180).regex(/^[a-z][a-z0-9]*(?:[:.-][A-Za-z0-9]+)*$/)
const ReleaseIdSchema = z.string().max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+\.[0-9]+\.[0-9]+$/)
const DecimalTextSchema = z.string().max(64).regex(/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/)
const DateSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
export const ChallengeTimestampSchema = z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/)
const ShortTextSchema = z.string().min(1).max(512)
const LongTextSchema = z.string().min(1).max(4096)
const HttpUrlSchema = z.string().url().refine((value) => /^https?:\/\//.test(value), 'URL must use HTTP(S).')
const EndpointIdSchema = z.enum(CHALLENGE_ENDPOINT_IDS)

const EvidenceLocatorSchema = z.object({
  source_object_id: IdentifierSchema,
  pdf_page: z.number().int().min(1).max(9),
  printed_page: z.number().int().min(707).max(715),
  section: ShortTextSchema,
  paragraph: z.number().int().min(1).max(20),
  continuation: z.boolean()
}).strict()

const SourceSchema = z.object({
  id: IdentifierSchema,
  source: z.enum(['ZENODO', 'REPOSITORY_CURATION']),
  object_class: z.enum(['record-metadata', 'licensed-article', 'reviewed-transcription']),
  title: ShortTextSchema,
  accession: ShortTextSchema,
  origin_url: HttpUrlSchema.nullable(),
  repository_path: z.string().regex(/^[A-Za-z0-9._/-]+$/).nullable(),
  media_type: z.enum(['application/json', 'application/pdf']),
  bytes: z.number().int().positive().max(2 * 1024 * 1024),
  sha256: ChallengeSha256Schema,
  md5: z.string().regex(/^[a-f0-9]{32}$/).nullable(),
  retrieved_at: ChallengeTimestampSchema,
  live_verified: z.boolean(),
  license_id: z.literal('rights:cc-by-4.0'),
  adapter_id: z.enum(['zenodo-13358906-metadata@1.0.0', 'exact-zenodo-pdf@1.0.0', 'reviewed-apap-cmax-transcription@1.0.0'])
}).strict()

const RightsSchema = z.object({
  id: z.literal('rights:cc-by-4.0'),
  license: z.literal('CC-BY-4.0'),
  terms_url: HttpUrlSchema,
  redistribution: z.literal('permitted-with-attribution'),
  attribution: LongTextSchema,
  source_object_id: z.literal('source:zenodo:13358906:metadata')
}).strict()

const SourceFactSchema = z.object({
  id: IdentifierSchema,
  study_id: z.literal('study:zenodo:13358906'),
  fact_class: z.enum(['study-design', 'population', 'formulation', 'administration', 'sampling', 'sample-processing', 'assay', 'analysis']),
  statement: LongTextSchema,
  locator: EvidenceLocatorSchema
}).strict()

const StudySchema = z.object({
  id: z.literal('study:zenodo:13358906'),
  family_id: z.literal('family:zenodo:13358906'),
  role: z.literal('external-held-out'),
  title: ShortTextSchema,
  doi: z.literal('10.21474/IJAR01/19104'),
  taxon_id: z.literal('NCBITaxon:9606'),
  population_boundary: z.literal('healthy adult male and female subjects aged 18 to 50 years under fasting conditions'),
  source_object_ids: z.array(IdentifierSchema).length(3)
}).strict()

export const ChallengeProtocolSchema = z.object({
  id: z.literal(CHALLENGE_PROTOCOL_ID),
  study_id: z.literal('study:zenodo:13358906'),
  design: z.literal('monocentric open-label randomized prospective two-treatment two-sequence two-period crossover'),
  fasting: z.literal(true),
  route: z.literal('oral'),
  apap_dose_mg: z.literal('325'),
  tramadol_hydrochloride_dose_mg: z.literal('37.5'),
  washout_days: z.literal('7'),
  matrix: z.literal('human lithium-heparin plasma'),
  assay: z.literal('validated UPLC-MS/MS after protein precipitation'),
  apap_calibration_range_ng_ml: z.tuple([z.literal('25'), z.literal('10000')]),
  apap_sampling_times: z.tuple(CHALLENGE_SAMPLING_LABELS.map((value) => z.literal(value))),
  sampling_grid_digest: ChallengeSha256Schema,
  source_fact_ids: z.array(IdentifierSchema).min(1).max(32)
}).strict()

const EndpointSchema = z.object({
  id: EndpointIdSchema,
  protocol_id: z.literal(CHALLENGE_PROTOCOL_ID),
  arm: z.enum(['reference-ultracet', 'test-gesico-duo']),
  priority: z.enum(['primary', 'secondary']),
  analyte: z.literal('parent acetaminophen'),
  quantity: z.literal('maximum central plasma concentration'),
  time_domain: z.literal('exact published 20-time acetaminophen sampling grid'),
  expected_unit: z.literal('mg/L')
}).strict()

export const ChallengeMappingSchema = z.object({
  id: z.literal(CHALLENGE_MAPPING_ID),
  protocol_id: z.literal(CHALLENGE_PROTOCOL_ID),
  consumer_input: z.literal('oral depot'),
  apap_dose_mg: z.literal('325'),
  consumer_volume_l: z.literal('50'),
  normalization: z.literal('frozen consumer volume normalization'),
  endpoint_mapping: z.literal('maximum consumer central parent-APAP concentration over the exact published sampling grid'),
  forbidden: z.tuple([z.literal('model-specific fitting'), z.literal('formulation-specific fitting')])
}).strict()

export const ChallengeMetricSchema = z.object({
  id: z.literal(CHALLENGE_METRIC_ID),
  expression: z.literal('abs(predicted-measured)/measured'),
  input_unit: z.literal('mg/L'),
  score_rounding: z.literal('decimal ROUND_HALF_EVEN to 10 places')
}).strict()

export const ChallengeThresholdSchema = z.object({
  id: z.literal(CHALLENGE_THRESHOLD_ID),
  metric_id: z.literal(CHALLENGE_METRIC_ID),
  operator: z.literal('<='),
  value: z.literal('0.30'),
  authorship: z.literal('repository-authored evaluation convention'),
  not_paper_criterion: z.literal(true)
}).strict()

const ExclusionSchema = z.object({ id: IdentifierSchema, scope: ShortTextSchema, rule: LongTextSchema }).strict()
const NotEvaluableSchema = z.object({
  id: IdentifierSchema,
  endpoint: z.enum(['Tmax scoring/statistic', 'absolute AUC', 'BE ratio/CI/power', 'sequence effect', 'variance/CV', 'full curve', 'population/sex/BMI', 'tramadol/safety']),
  reason: LongTextSchema
}).strict()
export const ChallengePartitionSchema = z.object({
  id: z.literal(CHALLENGE_PARTITION_ID),
  role: z.literal('external-held-out'),
  family_ids: z.tuple([z.literal('family:zenodo:13358906')]),
  study_ids: z.tuple([z.literal('study:zenodo:13358906')]),
  observation_ids: z.array(IdentifierSchema).length(2),
  closure_digest: z.literal(CHALLENGE_PARTITION_DIGEST)
}).strict()

export const CHALLENGE_PUBLIC_RECORD_SCHEMAS = Object.freeze({
  sources: SourceSchema,
  rights: RightsSchema,
  source_facts: SourceFactSchema,
  studies: StudySchema,
  protocols: ChallengeProtocolSchema,
  endpoints: EndpointSchema,
  mappings: ChallengeMappingSchema,
  metrics: ChallengeMetricSchema,
  thresholds: ChallengeThresholdSchema,
  exclusions: ExclusionSchema,
  not_evaluable: NotEvaluableSchema,
  partitions: ChallengePartitionSchema
})

const RecordCountsSchema = z.object({
  sources: z.literal(3), rights: z.literal(1), source_facts: z.literal(12), studies: z.literal(1),
  protocols: z.literal(1), endpoints: z.literal(2), mappings: z.literal(1), metrics: z.literal(1),
  thresholds: z.literal(1), exclusions: z.literal(3), not_evaluable: z.literal(8), observations: z.literal(2), partitions: z.literal(1)
}).strict()
const SignatureSchema = z.object({ algorithm: z.literal('Ed25519'), key_id: IdentifierSchema, signed_at: ChallengeTimestampSchema, value: z.string().min(1) }).strict()
const ReleaseRefSchema = z.object({ id: z.literal(CHALLENGE_RELEASE_ID), schema_version: z.literal('1.0.0'), digest: z.literal(CHALLENGE_RELEASE_DIGEST) }).strict()

export const ChallengeTrustStoreSchema = z.object({
  keys: z.tuple([z.object({
    algorithm: z.literal('Ed25519'), key_id: z.literal(CHALLENGE_SIGNER_KEY_ID), public_key: z.literal(CHALLENGE_SIGNER_PUBLIC_KEY),
    reason: z.string().nullable(), status: z.literal('retired'), valid_from: z.literal('2026-07-14'), valid_until: z.literal('2026-07-14')
  }).strict()]),
  trust_schema_version: z.literal('1.0.0')
}).strict()
export const ChallengeTrustResponseSchema = z.object({ trust: ChallengeTrustStoreSchema, trust_digest: z.literal(CHALLENGE_TRUST_DIGEST) }).strict()
export const ChallengeDiscoverySchema = z.object({
  contract_version: z.literal('1.0.0'), catalog_digest: z.literal(CHALLENGE_CATALOG_DIGEST), trust_digest: z.literal(CHALLENGE_TRUST_DIGEST),
  release_count: z.literal(1), heldout_policy: z.literal(CHALLENGE_HELDOUT_POLICY), result_policy: z.literal(CHALLENGE_RESULT_POLICY)
}).strict()
export const ChallengeCatalogSchema = z.object({
  catalog_envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({ catalog_version: z.literal('1.0.0'), published_at: DateSchema, releases: z.tuple([z.object({
    envelope_sha256: z.literal(CHALLENGE_ENVELOPE_DIGEST), manifest_sha256: z.literal(CHALLENGE_MANIFEST_DIGEST),
    record_counts: RecordCountsSchema, release_digest: z.literal(CHALLENGE_RELEASE_DIGEST), release_id: z.literal(CHALLENGE_RELEASE_ID), schema_version: z.literal('1.0.0')
  }).strict()]) }).strict(),
  signature: SignatureSchema
}).strict()
const ManifestFileSchema = z.object({ path: z.string().regex(/^records\/[a-z_]+\.ndjson$/), record_type: z.string().min(1), record_count: z.number().int().nonnegative(), bytes: z.number().int().positive(), sha256: ChallengeSha256Schema }).strict()
const ApiViewSchema = z.object({
  root_schema_version: z.literal('challenge-api-items-rfc8785-v1'), view_id: z.string().min(1),
  endpoint: z.string().min(1), record_type: z.string().min(1), sort: z.literal('id:asc'), count: z.number().int().nonnegative(), root_sha256: ChallengeSha256Schema
}).strict()
export const ChallengeManifestSchema = z.object({
  manifest_schema_version: z.literal('1.0.0'), release_id: z.literal(CHALLENGE_RELEASE_ID), title: ShortTextSchema, schema_version: z.literal('1.0.0'),
  release_digest: z.literal(CHALLENGE_RELEASE_DIGEST), digest_algorithm: z.literal('sha256-rfc8785-manifest-v1'), published_at: DateSchema, immutable: z.literal(true),
  scientific_scope: LongTextSchema, source_lock_path: z.string().min(1), source_lock_sha256: ChallengeSha256Schema,
  recipe_path: z.string().min(1), recipe_sha256: ChallengeSha256Schema, files: z.array(ManifestFileSchema).length(13),
  record_counts: RecordCountsSchema, api_views: z.array(ApiViewSchema).length(12)
}).strict()
export const ChallengeReleaseResponseSchema = z.object({ release: ReleaseRefSchema, manifest: ChallengeManifestSchema }).strict()
export const ChallengeEnvelopeSchema = z.object({
  envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({ release_id: z.literal(CHALLENGE_RELEASE_ID), schema_version: z.literal('1.0.0'), release_digest: z.literal(CHALLENGE_RELEASE_DIGEST), manifest_sha256: z.literal(CHALLENGE_MANIFEST_DIGEST), source_lock_sha256: ChallengeSha256Schema, recipe_sha256: ChallengeSha256Schema }).strict(),
  signature: SignatureSchema
}).strict()
export const ChallengePublicPageSchema = z.object({
  page_contract: z.literal('challenge-public-records-v1'), release_id: z.literal(CHALLENGE_RELEASE_ID), release_digest: z.literal(CHALLENGE_RELEASE_DIGEST),
  record_type: z.string().min(1), sort: z.literal('id:asc'), limit: z.number().int().min(1).max(100), release: ReleaseRefSchema,
  items: z.array(z.unknown()).max(100), next_cursor: z.string().max(8192).nullable()
}).strict()

export const ChallengePredictionSchema = z.object({
  endpoint_id: EndpointIdSchema,
  predicted_value: DecimalTextSchema,
  predicted_unit: z.literal('mg/L'),
  predicted_time_h: z.enum(CHALLENGE_SAMPLING_HOURS)
}).strict()
export const ChallengeCommitmentRequestSchema = z.object({
  commitment_schema_version: z.literal('1.0.0'), release_id: z.literal(CHALLENGE_RELEASE_ID), release_digest: z.literal(CHALLENGE_RELEASE_DIGEST),
  consumer_id: z.string().min(1).max(128).regex(/^[A-Za-z0-9._:-]+$/), consumer_model_digest: ChallengeSha256Schema,
  equation_set_digest: ChallengeSha256Schema, parameter_policy_digest: ChallengeSha256Schema,
  consumer_volume_l: z.literal('50'), normalization_assumption: z.literal('frozen consumer volume normalization'),
  sampling_grid_digest: ChallengeSha256Schema, solver_digest: ChallengeSha256Schema,
  endpoint_mapping_id: z.literal(CHALLENGE_MAPPING_ID), endpoint_mapping_digest: ChallengeSha256Schema,
  metric_id: z.literal(CHALLENGE_METRIC_ID), metric_digest: ChallengeSha256Schema,
  threshold_id: z.literal(CHALLENGE_THRESHOLD_ID), threshold_digest: ChallengeSha256Schema,
  exclusion_digest: ChallengeSha256Schema, not_evaluable_digest: ChallengeSha256Schema,
  partition_id: z.literal(CHALLENGE_PARTITION_ID), partition_digest: z.literal(CHALLENGE_PARTITION_DIGEST),
  prediction_artifact_digest: ChallengeSha256Schema, predictions: z.tuple(CHALLENGE_ENDPOINT_IDS.map((endpointId) => ChallengePredictionSchema.extend({ endpoint_id: z.literal(endpointId) }).strict())),
  nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/), created_at: ChallengeTimestampSchema
}).strict()
export const ChallengeCommitmentResponseSchema = z.object({
  commitment_contract: z.literal('apap-human-pk-challenge-commitment-v1'), commitment_digest: ChallengeSha256Schema,
  created_at: ChallengeTimestampSchema, committed_at: ChallengeTimestampSchema, partition_digest: z.literal(CHALLENGE_PARTITION_DIGEST)
}).strict()
export const ChallengeDisclosureRequestSchema = z.object({
  disclosure_schema_version: z.literal('1.0.0'), commitment_digest: ChallengeSha256Schema, frozen_commitment: ChallengeCommitmentRequestSchema
}).strict()
export const ChallengeObservationSchema = z.object({
  id: IdentifierSchema, endpoint_id: EndpointIdSchema, study_id: z.literal('study:zenodo:13358906'), partition_id: z.literal(CHALLENGE_PARTITION_ID),
  scientific_origin: z.literal('measured'), validation_state: z.literal('independently-reviewed-transcription'), level: z.literal('aggregate'), n: z.literal(39),
  reported_value: DecimalTextSchema, reported_unit: z.literal('ng/mL'), normalized_value: DecimalTextSchema, normalized_unit: z.literal('mg/L'),
  transformation: z.literal('mg/L = ng/mL * 0.001'), uncertainty_reported: z.literal(false), locator: EvidenceLocatorSchema, n_locator: EvidenceLocatorSchema
}).strict()
export const ChallengeDisclosureResponseSchema = z.object({
  disclosure_contract: z.literal('apap-human-pk-challenge-disclosure-v1'), commitment_digest: ChallengeSha256Schema,
  disclosed_at: ChallengeTimestampSchema, observations: z.tuple(CHALLENGE_ENDPOINT_IDS.map((endpointId) => ChallengeObservationSchema.extend({ endpoint_id: z.literal(endpointId) }).strict())),
  disclosure_digest: ChallengeSha256Schema
}).strict()
export const ChallengeSubmittedEndpointSchema = z.object({
  endpoint_id: EndpointIdSchema, predicted_value: DecimalTextSchema, predicted_unit: z.literal('mg/L'), predicted_time_h: DecimalTextSchema,
  measured_value: DecimalTextSchema, measured_unit: z.literal('mg/L'), diagnostic_status: z.enum(['evaluable', 'invalid-mapping', 'invalid-diagnostics'])
}).strict()
export const ChallengeResultSubmissionSchema = z.object({
  result_schema_version: z.literal('1.0.0'), commitment_digest: ChallengeSha256Schema, disclosure_digest: ChallengeSha256Schema,
  frozen_commitment: ChallengeCommitmentRequestSchema,
  endpoint_results: z.tuple(CHALLENGE_ENDPOINT_IDS.map((endpointId) => ChallengeSubmittedEndpointSchema.extend({ endpoint_id: z.literal(endpointId) }).strict())),
  submitted_conclusion: z.enum(['failed', 'not-evaluable', 'supported-within-boundary']), conclusion_boundary: z.literal(CHALLENGE_CONCLUSION_BOUNDARY),
  software_digest: ChallengeSha256Schema, diagnostics_digest: ChallengeSha256Schema
}).strict()
const ScoredEndpointSchema = ChallengeSubmittedEndpointSchema.extend({
  absolute_relative_error: DecimalTextSchema.nullable(), threshold: z.literal('0.30'),
  support_label: z.enum(['unsupported', 'not-evaluable', 'supported-within-boundary'])
}).strict()
export const ChallengeResultResponseSchema = z.object({
  result_contract: z.literal('apap-human-pk-challenge-result-v1'), commitment_digest: ChallengeSha256Schema, disclosure_digest: ChallengeSha256Schema,
  metric: z.literal('abs(predicted-measured)/measured'), threshold: z.literal('<=0.30'), rounding: z.literal('decimal ROUND_HALF_EVEN to 10 places'),
  endpoint_results: z.tuple(CHALLENGE_ENDPOINT_IDS.map((endpointId) => ScoredEndpointSchema.extend({ endpoint_id: z.literal(endpointId) }).strict())),
  conclusion: z.enum(['failed', 'not-evaluable', 'supported-within-boundary']), bounded_conclusion: z.string().min(1),
  software_digest: ChallengeSha256Schema, diagnostics_digest: ChallengeSha256Schema, submitted_at: ChallengeTimestampSchema,
  result_digest: ChallengeSha256Schema
}).strict()

export const ChallengeFreezeIntentSchema = z.object({ nonce: z.string().min(16).max(128).regex(/^[A-Za-z0-9_-]+$/), createdAt: ChallengeTimestampSchema }).strict()
export const ChallengeDisclosureIntentSchema = z.object({ commitmentDigest: ChallengeSha256Schema }).strict()
export const ChallengeArtifactParamSchema = z.object({ artifactDigest: ChallengeSha256Schema }).strict()
export const ChallengeCommitmentParamSchema = z.object({ commitmentDigest: ChallengeSha256Schema }).strict()
export const ChallengeReportParamSchema = z.object({ resultDigest: ChallengeSha256Schema }).strict()
export const ChallengeRunListQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) }).strict()
export const ChallengeEmptyObjectSchema = z.object({}).strict()
