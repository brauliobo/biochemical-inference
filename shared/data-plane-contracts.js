import { z } from 'zod'
import { Sha256HexSchema, UtcInstantSchema, IsoDateSchema, SemverSchema, KebabIdSchema, ReleaseIdSchema, NcbiTaxonIdSchema, ChebiIdSchema, RheaIdSchema, UniProtIdSchema, PubMedOrUniProtIdSchema, FactoryRecordTypeSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, StrictEmptyObjectSchema, PageLimitSchema, CursorSchema, pageLimitQuerySchema, isCanonicalBase64Url, releaseRefSchema } from './commons/schemas.js'

export const DATA_PLANE_BASELINE_RELEASE_ID = 'one-carbon-authority-human-mouse-v2.0.0'
export const DATA_PLANE_BASELINE_RELEASE_DIGEST = '310bd8a04320c9b1bd9d4e18795bd998627265ac11b1c0e2b07a0473ba48f8e0'
export const DATA_PLANE_BASELINE_MANIFEST_DIGEST = '33f1830a8138bd47993d3732b6a7bda84c78ee1cc3abc4811cdcbf6902ebe5db'
export const DATA_PLANE_BASELINE_ENVELOPE_DIGEST = 'c81bdaead61d13dc80afeb21abb029fe34cb4775451f513370dcf7a971bf4c75'
export const DATA_PLANE_CANDIDATE_RELEASE_ID = 'one-carbon-authority-human-mouse-v2.0.1'
export const DATA_PLANE_CANDIDATE_RELEASE_DIGEST = '9dad9f1ac92ff2c53810867414c7729a1ee97425213b9749482ebe2fd37874b5'
export const DATA_PLANE_CANDIDATE_MANIFEST_DIGEST = 'bb54c85f1a87ff4fe8414ead85001d566329b4adb2a8aa7edf76495296cace0d'
export const DATA_PLANE_CANDIDATE_ENVELOPE_DIGEST = 'ea9dbeb9ae620a0899fa29a15368ec969bf499dfb618e479d019f7d4cdcd0641'
export const DATA_PLANE_RELEASE_ID = DATA_PLANE_CANDIDATE_RELEASE_ID
export const DATA_PLANE_RELEASE_DIGEST = DATA_PLANE_CANDIDATE_RELEASE_DIGEST
export const DATA_PLANE_CATALOG_DIGEST = 'a1569da9b2193d4bbfc09349fa24acbf72d03fde04af06e1b0a95eb55fdc25dc'
export const DATA_PLANE_TRUST_DIGEST = 'd9ada7b62b31e6ff07d3363c5b756bbc979b5600aa44add50c9ffa089ee862f7'
export const DATA_PLANE_HISTORICAL_KEY_ID = 'goal11-release-2026'
export const DATA_PLANE_HISTORICAL_PUBLIC_KEY = 'yWbisY7eaKIvpoUkoLb28XGGpimerBSmmsAutm9kSvM'
export const DATA_PLANE_ACTIVE_KEY_ID = 'goal11-release-2026-rotation-1'
export const DATA_PLANE_ACTIVE_PUBLIC_KEY = 'IQyu5Evu5OzUFJXuUU5qq27H7pwiUfLHKKi6YQn0reE'
export const DATA_PLANE_DIFF_DIGEST = '080b92aa65472f1df25d6b2b573ea6b332786b22c3601ddbd081bf1e76d4b3a5'
export const DATA_PLANE_DIFF_RESPONSE_DIGEST = '5e8e9cf854e1c38bf7b25651c83236d6b281c07ad76bc621a8e5c8fde00df86b'
export const DATA_PLANE_AUDIT_ALGORITHM_VERSION = 'authority-closure-audit-v1.0.0'
export const DATA_PLANE_CSRF_HEADER = 'x-data-plane-csrf'
export const DATA_PLANE_CSRF_VALUE = 'data-plane-v1'
export const DATA_PLANE_NLM_COURTESY = 'Courtesy of the U.S. National Library of Medicine.'

export const DATA_PLANE_PINS = Object.freeze({
  catalogDigest: DATA_PLANE_CATALOG_DIGEST,
  trustDigest: DATA_PLANE_TRUST_DIGEST,
  baseline: Object.freeze({
    releaseId: DATA_PLANE_BASELINE_RELEASE_ID,
    releaseDigest: DATA_PLANE_BASELINE_RELEASE_DIGEST,
    manifestDigest: DATA_PLANE_BASELINE_MANIFEST_DIGEST,
    envelopeDigest: DATA_PLANE_BASELINE_ENVELOPE_DIGEST,
    signerKeyId: DATA_PLANE_HISTORICAL_KEY_ID
  }),
  candidate: Object.freeze({
    releaseId: DATA_PLANE_CANDIDATE_RELEASE_ID,
    releaseDigest: DATA_PLANE_CANDIDATE_RELEASE_DIGEST,
    manifestDigest: DATA_PLANE_CANDIDATE_MANIFEST_DIGEST,
    envelopeDigest: DATA_PLANE_CANDIDATE_ENVELOPE_DIGEST,
    signerKeyId: DATA_PLANE_ACTIVE_KEY_ID
  }),
  historicalKey: Object.freeze({ keyId: DATA_PLANE_HISTORICAL_KEY_ID, publicKey: DATA_PLANE_HISTORICAL_PUBLIC_KEY, status: 'retired' }),
  activeKey: Object.freeze({ keyId: DATA_PLANE_ACTIVE_KEY_ID, publicKey: DATA_PLANE_ACTIVE_PUBLIC_KEY, status: 'active' }),
  diff: Object.freeze({ digest: DATA_PLANE_DIFF_DIGEST, responseDigest: DATA_PLANE_DIFF_RESPONSE_DIGEST })
})

export const DATA_PLANE_RELEASE_PINS = Object.freeze([
  DATA_PLANE_PINS.baseline,
  DATA_PLANE_PINS.candidate
])

const DateSchema = IsoDateSchema.refine((value) => {
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value
})
const TimestampSchema = UtcInstantSchema.refine((value) => {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().replace('.000Z', 'Z') === value
})
export const FactoryRecordCountsSchema = z.object({
  taxa: NonNegativeIntSchema,
  compounds: NonNegativeIntSchema,
  reactions: NonNegativeIntSchema,
  proteins: NonNegativeIntSchema,
  references: NonNegativeIntSchema,
  catalysis: NonNegativeIntSchema,
  limitations: NonNegativeIntSchema
}).strict()

export const FactoryTaxonSchema = z.object({
  id: NcbiTaxonIdSchema,
  scientific_name: NonEmptyStringSchema,
  common_name: NonEmptyStringSchema,
  source_ids: z.array(z.literal('NCBI_TAXONOMY')).min(1)
}).strict()

export const FactoryCompoundSchema = z.object({
  id: ChebiIdSchema,
  name: NonEmptyStringSchema,
  synonyms: z.array(z.string()),
  formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  charge: z.number().int(),
  source_ids: z.array(z.literal('CHEBI')).min(1)
}).strict()

export const FactoryParticipantSchema = z.object({
  compound_id: ChebiIdSchema,
  coefficient: PositiveIntSchema
}).strict()

export const FactoryReactionSchema = z.object({
  id: RheaIdSchema,
  rhea_master_id: RheaIdSchema,
  name: NonEmptyStringSchema,
  ec_numbers: z.array(z.string().regex(/^[0-9]+\.[0-9-]+\.[0-9-]+\.[0-9-]+$/)).min(1),
  physiological_direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  equation: z.string().min(3),
  reactants: z.array(FactoryParticipantSchema).min(1),
  products: z.array(FactoryParticipantSchema).min(1),
  source_ids: z.array(z.literal('RHEA')).min(1)
}).strict()

export const FactoryProteinSchema = z.object({
  id: UniProtIdSchema,
  accession: z.string().regex(/^[A-Z0-9]+$/),
  taxon_id: NcbiTaxonIdSchema,
  gene_symbol: NonEmptyStringSchema,
  recommended_name: NonEmptyStringSchema,
  reviewed: z.literal(true),
  source_ids: z.array(z.literal('UNIPROTKB')).min(1)
}).strict()

export const FactoryReferenceSchema = z.object({
  id: z.string().regex(/^PubMed:[1-9][0-9]*$/),
  kind: z.literal('pubmed'),
  citation: NonEmptyStringSchema,
  url: z.string().url(),
  source_ids: z.array(z.literal('PUBMED')).min(1).max(1)
}).strict()

export const FactoryCatalysisSchema = z.object({
  id: z.string().regex(/^CATALYSIS:[A-Z0-9]+-[0-9]+$/),
  protein_id: UniProtIdSchema,
  reaction_id: RheaIdSchema,
  taxon_id: NcbiTaxonIdSchema,
  evidence_class: z.enum(['direct', 'inferred']),
  evidence_code: z.enum(['ECO:0000250', 'ECO:0000269', 'ECO:0000305']),
  reference_ids: z.array(PubMedOrUniProtIdSchema).min(1)
}).strict()

export const FactoryLimitationSchema = z.object({
  id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/),
  statement: NonEmptyStringSchema
}).strict()

export const FACTORY_RECORD_SCHEMAS = Object.freeze({
  taxa: FactoryTaxonSchema,
  compounds: FactoryCompoundSchema,
  reactions: FactoryReactionSchema,
  proteins: FactoryProteinSchema,
  references: FactoryReferenceSchema,
  catalysis: FactoryCatalysisSchema,
  limitations: FactoryLimitationSchema
})

export const FactoryLicenseSchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  url: z.string().url(),
  redistribution: z.enum(['public', 'restricted']),
  attribution: NonEmptyStringSchema
}).strict()

export const FactoryAdapterSchema = z.object({
  id: z.enum([
    'ncbi-taxonomy-esummary-json',
    'chebi-authority-json-obo',
    'rhea-tsv-json',
    'uniprot-rest-tsv-json',
    'pubmed-esummary-json',
    'pubmed-esummary-json-doi',
    'repository-curation-json'
  ]),
  version: SemverSchema,
  implementation_sha256: Sha256HexSchema,
  package_sha256: Sha256HexSchema
}).strict()

export const FactoryManifestPartitionSchema = z.object({
  path: z.string().regex(/^records\/(?:taxa|compounds|reactions|proteins|references|catalysis|limitations)\/part-[0-9]{5}\.ndjson$/),
  record_type: FactoryRecordTypeSchema,
  first_id: NonEmptyStringSchema,
  last_id: NonEmptyStringSchema,
  record_count: PositiveIntSchema,
  bytes: PositiveIntSchema,
  sha256: Sha256HexSchema
}).strict()

export const FactoryManifestInputSchema = z.object({
  name: z.string(),
  record_type: FactoryRecordTypeSchema,
  source: z.string(),
  source_object_sha256: Sha256HexSchema,
  source_object_bytes: PositiveIntSchema,
  adapter: FactoryAdapterSchema,
  license: FactoryLicenseSchema
}).strict()

export const FactoryManifestSchema = z.object({
  manifest_schema_version: z.literal('2.0.0'),
  release_id: ReleaseIdSchema,
  title: z.string(),
  schema_version: z.literal('2.0.0'),
  release_digest: Sha256HexSchema,
  digest_algorithm: z.literal('sha256-rfc8785-manifest-v2'),
  published_at: z.string(),
  immutable: z.literal(true),
  supported_taxa: z.array(NcbiTaxonIdSchema).min(1),
  scientific_scope: z.string(),
  sort: z.literal('id:asc'),
  partitions: z.array(FactoryManifestPartitionSchema).min(1),
  record_counts: FactoryRecordCountsSchema,
  inputs: z.array(FactoryManifestInputSchema).min(1)
}).strict()

export const FactorySignatureSchema = z.object({
  algorithm: z.literal('Ed25519'),
  key_id: KebabIdSchema,
  signed_at: TimestampSchema,
  value: z.string().regex(/^[A-Za-z0-9_-]{86}$/).refine((value) => isCanonicalBase64Url(value, 64), 'Signature must be canonical unpadded base64url for 64 bytes.')
}).strict()

export const FactoryReleaseEnvelopeSchema = z.object({
  envelope_schema_version: z.literal('2.0.0'),
  payload: z.object({
    release_id: ReleaseIdSchema,
    schema_version: z.literal('2.0.0'),
    release_digest: Sha256HexSchema,
    manifest_sha256: Sha256HexSchema,
    recipe_path: z.string().regex(/^recipes\/[a-z0-9.-]+\.json$/),
    recipe_sha256: Sha256HexSchema,
    source_lock_path: z.string().regex(/^sources\/locks\/[a-z0-9.-]+\.json$/),
    source_lock_sha256: Sha256HexSchema
  }).strict(),
  signature: FactorySignatureSchema
}).strict()

export const FactoryCatalogReleaseSchema = z.object({
  release_id: ReleaseIdSchema,
  schema_version: z.literal('2.0.0'),
  release_digest: Sha256HexSchema,
  manifest_sha256: Sha256HexSchema,
  envelope_path: z.string().regex(/^[a-z0-9.-]+\/envelope\.json$/),
  envelope_sha256: Sha256HexSchema,
  record_counts: FactoryRecordCountsSchema
}).strict()

export const FactoryCatalogEnvelopeSchema = z.object({
  catalog_envelope_schema_version: z.literal('2.0.0'),
  payload: z.object({
    catalog_version: z.literal('2.0.0'),
    published_at: DateSchema,
    releases: z.array(FactoryCatalogReleaseSchema)
  }).strict(),
  signature: FactorySignatureSchema
}).strict()

export const FactoryTrustKeySchema = z.object({
  key_id: KebabIdSchema,
  algorithm: z.literal('Ed25519'),
  public_key: z.string().regex(/^[A-Za-z0-9_-]{43}$/).refine((value) => isCanonicalBase64Url(value, 32), 'Public key must be canonical unpadded base64url for 32 bytes.'),
  status: z.enum(['active', 'retired', 'revoked']),
  valid_from: DateSchema,
  valid_until: DateSchema.nullable(),
  reason: z.string().nullable()
}).strict()

export const FactoryTrustStoreSchema = z.object({
  trust_schema_version: z.literal('1.0.0'),
  keys: z.array(FactoryTrustKeySchema).min(1)
}).strict().superRefine((trust, context) => {
  const identifiers = trust.keys.map((key) => key.key_id)
  const publicKeys = trust.keys.map((key) => key.public_key)
  if (new Set(identifiers).size !== identifiers.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Trust key identifiers must be unique.' })
  if (new Set(publicKeys).size !== publicKeys.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Trust key identifiers cannot alias one public key.' })
  for (const key of trust.keys) {
    if (key.valid_until !== null && key.valid_until < key.valid_from) context.addIssue({ code: z.ZodIssueCode.custom, message: `Trust key ${key.key_id} has an invalid interval.` })
    if (key.status === 'retired' && key.valid_until === null) context.addIssue({ code: z.ZodIssueCode.custom, message: `Retired trust key ${key.key_id} requires valid_until.` })
  }
})

export const FactoryDiscoverySchema = z.object({
  contract_version: z.literal('1.0.0'),
  catalog_digest: Sha256HexSchema,
  release_count: NonNegativeIntSchema,
  acknowledgments: z.array(z.string()),
  routes: z.object({
    releases: z.literal('/api/factory/v1/releases'),
    envelope: z.literal('/api/factory/v1/releases/{release_id}/envelope'),
    manifest: z.literal('/api/factory/v1/releases/{release_id}/manifest'),
    partitions: z.literal('/api/factory/v1/releases/{release_id}/partitions/{record_type}/{part_number}'),
    records: z.literal('/api/factory/v1/releases/{release_id}/records/{record_type}'),
    diff: z.literal('/api/factory/v1/diff'),
    trust: z.literal('/api/factory/v1/trust')
  }).strict()
}).strict()

export const FactoryReleaseRefSchema = releaseRefSchema(ReleaseIdSchema, '2.0.0', Sha256HexSchema)

function factoryPageSchema(recordType, itemSchema) {
  return z.object({
    page_contract: z.literal('factory-records-v1'),
    release: FactoryReleaseRefSchema,
    record_type: z.literal(recordType),
    filters: z.record(z.string()),
    sort: z.literal('id:asc'),
    limit: PageLimitSchema,
    items: z.array(itemSchema).max(100),
    next_cursor: CursorSchema.nullable()
  }).strict()
}

export const FactoryRecordPageSchema = z.discriminatedUnion('record_type', [
  factoryPageSchema('taxa', FactoryTaxonSchema),
  factoryPageSchema('compounds', FactoryCompoundSchema),
  factoryPageSchema('reactions', FactoryReactionSchema),
  factoryPageSchema('proteins', FactoryProteinSchema),
  factoryPageSchema('references', FactoryReferenceSchema),
  factoryPageSchema('catalysis', FactoryCatalysisSchema),
  factoryPageSchema('limitations', FactoryLimitationSchema)
])

const JsonValueSchema = z.lazy(() => z.union([
  z.string(),
  FiniteNumberSchema,
  z.boolean(),
  z.null(),
  z.array(JsonValueSchema),
  z.record(JsonValueSchema)
]))
const DiffClassificationSchema = z.enum(['scientific', 'provenance', 'rights', 'packaging'])
const DiffValueChangeSchema = z.object({
  classification: DiffClassificationSchema,
  before: JsonValueSchema,
  after: JsonValueSchema
}).strict()

export const FactorySemanticDiffSchema = z.object({
  diff_schema_version: z.literal('2.0.0'),
  diff_digest: Sha256HexSchema,
  baseline: FactoryReleaseRefSchema,
  candidate: FactoryReleaseRefSchema,
  counts: z.object({
    added: NonNegativeIntSchema,
    removed: NonNegativeIntSchema,
    changed: NonNegativeIntSchema,
    unchanged: NonNegativeIntSchema
  }).strict(),
  record_changes: z.array(z.object({
    record_type: FactoryRecordTypeSchema,
    id: z.string(),
    status: z.enum(['added', 'removed', 'changed']),
    classification: z.literal('scientific'),
    fields: z.array(z.object({
      path: z.string(),
      before: JsonValueSchema,
      after: JsonValueSchema,
      classification: z.literal('scientific')
    }).strict()),
    attribution: z.array(z.string())
  }).strict()),
  scientific_metadata_changes: z.array(DiffValueChangeSchema.extend({ field: z.string() }).strict()),
  provenance_changes: z.array(DiffValueChangeSchema.extend({ input: z.string() }).strict()),
  rights_changes: z.array(DiffValueChangeSchema.extend({ input: z.string() }).strict()),
  packaging_changes: z.array(DiffValueChangeSchema.extend({ artifact: z.string() }).strict())
}).strict()

export const DataPlaneSyncRequestSchema = StrictEmptyObjectSchema
export const DataPlaneRecordTypeSchema = FactoryRecordTypeSchema
export const DataPlanePageQuerySchema = z.object({
  limit: pageLimitQuerySchema(25),
  cursor: CursorSchema.optional(),
  id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_.-]*$/).max(128).optional(),
  taxon_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_.-]*$/).max(128).optional(),
  reaction_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_.-]*$/).max(128).optional(),
  protein_id: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_.-]*$/).max(128).optional()
}).strict()

export const DataPlaneStatusSchema = z.object({
  contractVersion: z.literal('1.0.0'),
  state: z.enum(['empty', 'syncing', 'ready', 'failed']),
  localOnly: z.literal(true),
  release: FactoryReleaseRefSchema.nullable(),
  signerKeyId: KebabIdSchema.nullable(),
  lastSyncAt: z.string().nullable(),
  lastError: z.string().nullable(),
  integrity: z.enum(['empty', 'checking', 'valid', 'failed'])
}).strict()

export const DataPlaneDiscoverySchema = z.object({
  contractVersion: z.literal('1.0.0'),
  mode: z.literal('local-verified-mirror'),
  explicitSync: z.literal(true),
  readNetworkAccess: z.literal(false),
  pins: z.object({
    catalogDigest: z.literal(DATA_PLANE_CATALOG_DIGEST),
    trustDigest: z.literal(DATA_PLANE_TRUST_DIGEST),
    baseline: z.object({
      releaseId: z.literal(DATA_PLANE_BASELINE_RELEASE_ID),
      releaseDigest: z.literal(DATA_PLANE_BASELINE_RELEASE_DIGEST),
      manifestDigest: z.literal(DATA_PLANE_BASELINE_MANIFEST_DIGEST),
      envelopeDigest: z.literal(DATA_PLANE_BASELINE_ENVELOPE_DIGEST),
      signerKeyId: z.literal(DATA_PLANE_HISTORICAL_KEY_ID)
    }).strict(),
    candidate: z.object({
      releaseId: z.literal(DATA_PLANE_CANDIDATE_RELEASE_ID),
      releaseDigest: z.literal(DATA_PLANE_CANDIDATE_RELEASE_DIGEST),
      manifestDigest: z.literal(DATA_PLANE_CANDIDATE_MANIFEST_DIGEST),
      envelopeDigest: z.literal(DATA_PLANE_CANDIDATE_ENVELOPE_DIGEST),
      signerKeyId: z.literal(DATA_PLANE_ACTIVE_KEY_ID)
    }).strict(),
    historicalKey: z.object({ keyId: z.literal(DATA_PLANE_HISTORICAL_KEY_ID), publicKey: z.literal(DATA_PLANE_HISTORICAL_PUBLIC_KEY), status: z.literal('retired') }).strict(),
    activeKey: z.object({ keyId: z.literal(DATA_PLANE_ACTIVE_KEY_ID), publicKey: z.literal(DATA_PLANE_ACTIVE_PUBLIC_KEY), status: z.literal('active') }).strict(),
    diff: z.object({ digest: z.literal(DATA_PLANE_DIFF_DIGEST), responseDigest: z.literal(DATA_PLANE_DIFF_RESPONSE_DIGEST) }).strict()
  }).strict(),
  status: DataPlaneStatusSchema,
  routes: z.object({
    status: z.literal('/api/v9/data-plane/status'),
    sync: z.literal('/api/v9/data-plane/sync'),
    releases: z.literal('/api/v9/data-plane/releases'),
    release: z.literal('/api/v9/data-plane/releases/{releaseId}'),
    record: z.literal('/api/v9/data-plane/releases/{releaseId}/records/{recordType}/{recordId}'),
    pages: z.literal('/api/v9/data-plane/releases/{releaseId}/pages/{recordType}'),
    diff: z.literal('/api/v9/data-plane/diff'),
    integrity: z.literal('/api/v9/data-plane/integrity'),
    audits: z.literal('/api/v9/data-plane/audits'),
    audit: z.literal('/api/v9/data-plane/audits/{reportDigest}')
  }).strict()
}).strict()

export const DataPlaneReleaseListSchema = z.array(z.object({
  release: FactoryReleaseRefSchema,
  signerKeyId: KebabIdSchema,
  signedAt: TimestampSchema,
  syncedAt: z.string(),
  active: z.boolean()
}).strict())

export const DataPlaneReleaseDetailSchema = z.object({
  release: FactoryReleaseRefSchema,
  catalogDigest: Sha256HexSchema,
  trustDigest: Sha256HexSchema,
  manifestDigest: Sha256HexSchema,
  envelopeDigest: Sha256HexSchema,
  signer: z.object({ keyId: KebabIdSchema, algorithm: z.literal('Ed25519'), signedAt: TimestampSchema, status: z.enum(['active', 'retired']) }).strict(),
  manifest: FactoryManifestSchema,
  envelope: FactoryReleaseEnvelopeSchema,
  syncedAt: z.string(),
  storage: z.literal('local-verified-mirror')
}).strict()

function localPageSchema(recordType, itemSchema) {
  return z.object({
    pageContract: z.literal('data-plane-records-v1'),
    release: FactoryReleaseRefSchema,
    recordType: z.literal(recordType),
    filters: z.record(z.string()),
    sort: z.literal('id:asc'),
    limit: PageLimitSchema,
    items: z.array(itemSchema),
    nextCursor: CursorSchema.nullable(),
    source: z.literal('local-mirror')
  }).strict()
}

export const DataPlaneLocalPageSchema = z.discriminatedUnion('recordType', [
  localPageSchema('taxa', FactoryTaxonSchema),
  localPageSchema('compounds', FactoryCompoundSchema),
  localPageSchema('reactions', FactoryReactionSchema),
  localPageSchema('proteins', FactoryProteinSchema),
  localPageSchema('references', FactoryReferenceSchema),
  localPageSchema('catalysis', FactoryCatalysisSchema),
  localPageSchema('limitations', FactoryLimitationSchema)
])

function localRecordSchema(recordType, itemSchema) {
  return z.object({
    release: FactoryReleaseRefSchema,
    recordType: z.literal(recordType),
    item: itemSchema,
    source: z.literal('local-mirror')
  }).strict()
}

export const DataPlaneLocalRecordSchema = z.discriminatedUnion('recordType', [
  localRecordSchema('taxa', FactoryTaxonSchema),
  localRecordSchema('compounds', FactoryCompoundSchema),
  localRecordSchema('reactions', FactoryReactionSchema),
  localRecordSchema('proteins', FactoryProteinSchema),
  localRecordSchema('references', FactoryReferenceSchema),
  localRecordSchema('catalysis', FactoryCatalysisSchema),
  localRecordSchema('limitations', FactoryLimitationSchema)
])

export const DataPlaneIntegritySchema = z.object({
  status: z.enum(['valid', 'failed']),
  checkedAt: z.string(),
  releases: NonNegativeIntSchema,
  objects: NonNegativeIntSchema,
  records: NonNegativeIntSchema,
  findings: z.array(z.string())
}).strict()

export const AuthorityClosureAuditRequestSchema = z.object({
  baselineReleaseId: z.literal(DATA_PLANE_BASELINE_RELEASE_ID),
  candidateReleaseId: z.literal(DATA_PLANE_CANDIDATE_RELEASE_ID)
}).strict()

const AuthorityClosureResultSchema = z.object({
  recordCounts: FactoryRecordCountsSchema,
  totalRecords: PositiveIntSchema,
  partitionCount: PositiveIntSchema,
  sourceObjectCount: PositiveIntSchema,
  reactionBalance: z.object({ checked: NonNegativeIntSchema, passed: z.literal(true) }).strict(),
  taxonCatalysisClosure: z.object({ taxa: PositiveIntSchema, reactions: PositiveIntSchema, expectedAssertions: PositiveIntSchema, actualAssertions: PositiveIntSchema, passed: z.literal(true) }).strict(),
  referenceClosure: z.object({ references: PositiveIntSchema, citedAssertions: PositiveIntSchema, unresolvedReferences: z.literal(0), passed: z.literal(true) }).strict(),
  allChecksPassed: z.literal(true)
}).strict()

export const AuthorityClosureAuditReportSchema = z.object({
  reportSchemaVersion: z.literal('1.0.0'),
  algorithmVersion: z.literal(DATA_PLANE_AUDIT_ALGORITHM_VERSION),
  reportDigest: Sha256HexSchema,
  release: FactoryReleaseRefSchema,
  baseline: FactoryReleaseRefSchema,
  pins: z.object({
    catalogDigest: Sha256HexSchema,
    trustDigest: Sha256HexSchema,
    envelopeDigest: Sha256HexSchema,
    manifestDigest: Sha256HexSchema
  }).strict(),
  signer: z.object({
    keyId: KebabIdSchema,
    algorithm: z.literal('Ed25519'),
    signedAt: TimestampSchema,
    status: z.enum(['active', 'retired'])
  }).strict(),
  partitions: z.array(FactoryManifestPartitionSchema).min(1),
  sources: z.array(z.object({
    name: z.string(),
    recordType: FactoryRecordTypeSchema,
    source: z.string(),
    sourceObject: z.object({ sha256: Sha256HexSchema, bytes: PositiveIntSchema }).strict(),
    adapter: FactoryAdapterSchema,
    license: FactoryLicenseSchema
  }).strict()).min(1),
  difference: z.object({
    digest: z.literal(DATA_PLANE_DIFF_DIGEST),
    responseDigest: z.literal(DATA_PLANE_DIFF_RESPONSE_DIGEST),
    semanticDiff: FactorySemanticDiffSchema,
    classes: z.object({ scientific: NonNegativeIntSchema, provenance: NonNegativeIntSchema, rights: NonNegativeIntSchema, packaging: NonNegativeIntSchema }).strict()
  }).strict(),
  results: AuthorityClosureResultSchema,
  scientificValidation: z.literal('unsupported')
}).strict()

export const AuthorityClosureAuditListSchema = z.array(z.object({
  reportDigest: Sha256HexSchema,
  release: FactoryReleaseRefSchema,
  baseline: FactoryReleaseRefSchema,
  algorithmVersion: z.literal(DATA_PLANE_AUDIT_ALGORITHM_VERSION),
  createdAt: z.string()
}).strict())

export { FactoryRecordTypeSchema, JsonValueSchema, ReleaseIdSchema, Sha256HexSchema as Sha256Schema }
