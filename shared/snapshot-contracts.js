import { z } from 'zod'
import { Sha256HexSchema, UtcInstantSchema, IsoDateSchema, SemverSchema, KebabIdSchema, SourceIdSchema, NcbiTaxonIdSchema, ChebiIdSchema, RheaIdSchema, UniProtIdSchema, PubMedOrUniProtIdSchema, FactoryRecordTypeSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema } from './commons/schemas.js'


const SourceSchema = z.object({
  id: SourceIdSchema,
  name: NonEmptyStringSchema,
  url: z.string().url(),
  accessed_at: IsoDateSchema,
  license: NonEmptyStringSchema,
  license_url: z.string().url().nullable()
}).strict()

const ManifestFileSchema = z.object({
  path: z.string().regex(/^[a-z][a-z0-9_-]*\.json$/),
  sha256: Sha256HexSchema,
  bytes: PositiveIntSchema,
  record_type: FactoryRecordTypeSchema,
  record_count: NonNegativeIntSchema
}).strict()

const ProvenanceArtifactSchema = z.object({
  path: z.string().regex(/^(?:recipes|sources\/locks)\/[a-z0-9.-]+\.json$/),
  sha256: Sha256HexSchema
}).strict()

const ProvenanceImplementationSchema = z.object({
  id: KebabIdSchema,
  version: SemverSchema,
  sha256: Sha256HexSchema
}).strict()

const ProvenanceSourceObjectSchema = z.object({
  name: KebabIdSchema,
  record_type: FactoryRecordTypeSchema,
  sha256: Sha256HexSchema,
  bytes: PositiveIntSchema,
  object_class: z.enum(['repository-authored-normalized-fixture', 'upstream-source-object']),
  upstream_response: z.boolean(),
  origin_url: z.string().regex(/^(?:file|https):\/\/\S+$/),
  artifact_repository: z.string().regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/).nullable(),
  artifact_commit: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  source_release: NonEmptyStringSchema,
  retrieved_at: UtcInstantSchema,
  source_ids: z.array(SourceIdSchema).min(1),
  license_id: NonEmptyStringSchema
}).strict().superRefine((value, context) => {
  const fixture = value.object_class === 'repository-authored-normalized-fixture'
  if (value.upstream_response === fixture) context.addIssue({ code: z.ZodIssueCode.custom, path: ['upstream_response'], message: 'source object class and upstream_response conflict' })
  if (fixture && (value.artifact_repository === null || value.artifact_commit === null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_repository'], message: 'repository fixtures require repository and commit fields' })
  if (!fixture && (value.artifact_repository !== null || value.artifact_commit !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_repository'], message: 'upstream source objects cannot claim repository artifact fields' })
})

const TaxonSchema = z.object({
  id: NcbiTaxonIdSchema,
  scientific_name: NonEmptyStringSchema,
  common_name: NonEmptyStringSchema,
  source_ids: z.array(z.literal('NCBI_TAXONOMY')).min(1)
}).strict()

const CompoundSchema = z.object({
  id: ChebiIdSchema,
  name: NonEmptyStringSchema,
  synonyms: z.array(z.string()),
  formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  charge: z.number().int(),
  source_ids: z.array(z.literal('CHEBI')).min(1)
}).strict()

const ParticipantSchema = z.object({ compound_id: ChebiIdSchema, coefficient: PositiveIntSchema }).strict()

const ReactionSchema = z.object({
  id: RheaIdSchema,
  rhea_master_id: RheaIdSchema,
  name: NonEmptyStringSchema,
  ec_numbers: z.array(z.string().regex(/^\d+\.[0-9-]+\.[0-9-]+\.[0-9-]+$/)).min(1),
  physiological_direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  equation: z.string().min(3),
  reactants: z.array(ParticipantSchema).min(1),
  products: z.array(ParticipantSchema).min(1),
  source_ids: z.array(z.literal('RHEA')).min(1)
}).strict()

const ProteinSchema = z.object({
  id: UniProtIdSchema,
  accession: z.string().regex(/^[A-Z0-9]+$/),
  taxon_id: NcbiTaxonIdSchema,
  gene_symbol: NonEmptyStringSchema,
  recommended_name: NonEmptyStringSchema,
  reviewed: z.literal(true),
  source_ids: z.array(z.literal('UNIPROTKB')).min(1)
}).strict()

const ReferenceSchema = z.object({
  id: PubMedOrUniProtIdSchema,
  kind: z.enum(['pubmed', 'uniprot']),
  citation: NonEmptyStringSchema,
  url: z.string().url(),
  support_level: z.enum(['direct', 'inferred']),
  source_ids: z.array(SourceIdSchema).min(1)
}).strict()

const CatalysisSchema = z.object({
  id: z.string().regex(/^CATALYSIS:[A-Z0-9]+-[0-9]+$/),
  protein_id: UniProtIdSchema,
  reaction_id: RheaIdSchema,
  taxon_id: NcbiTaxonIdSchema,
  evidence_class: z.enum(['direct', 'inferred']),
  evidence_code: z.enum(['ECO:0000250', 'ECO:0000269', 'ECO:0000305']),
  reference_ids: z.array(PubMedOrUniProtIdSchema).min(1)
}).strict()

const LimitationSchema = z.object({ id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/), statement: NonEmptyStringSchema }).strict()
const LicenseSchema = z.object({ id: NonEmptyStringSchema, name: NonEmptyStringSchema, url: z.string().url(), redistribution: z.enum(['public', 'restricted']) }).strict()

const ReleasePayloadsSchema = z.object({
  taxa: z.object({ schema_version: z.literal('1.0.0'), records: z.array(TaxonSchema).min(1) }).strict(),
  compounds: z.object({ schema_version: z.literal('1.0.0'), records: z.array(CompoundSchema).min(1) }).strict(),
  reactions: z.object({ schema_version: z.literal('1.0.0'), records: z.array(ReactionSchema).min(1) }).strict(),
  proteins: z.object({ schema_version: z.literal('1.0.0'), records: z.array(ProteinSchema).min(1) }).strict(),
  references: z.object({ schema_version: z.literal('1.0.0'), records: z.array(ReferenceSchema).min(1) }).strict(),
  catalysis: z.object({ schema_version: z.literal('1.0.0'), records: z.array(CatalysisSchema).min(1) }).strict(),
  limitations: z.object({ schema_version: z.literal('1.0.0'), records: z.array(LimitationSchema).min(1) }).strict()
}).strict()

const SnapshotSourceObjectSchema = z.object({
  name: KebabIdSchema,
  record_type: FactoryRecordTypeSchema,
  sha256: Sha256HexSchema,
  bytes: PositiveIntSchema,
  media_type: z.literal('application/json'),
  object_class: z.enum(['repository-authored-normalized-fixture', 'upstream-source-object']),
  upstream_response: z.boolean(),
  origin_url: z.string().regex(/^(?:file|https):\/\/\S+$/),
  artifact_repository: z.string().regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/).nullable(),
  artifact_commit: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  source_release: NonEmptyStringSchema,
  retrieved_at: UtcInstantSchema,
  source_ids: z.array(SourceIdSchema).min(1),
  license: LicenseSchema,
  included_content: z.literal('normalized-public-release-records'),
  included_record_ids: z.array(NonEmptyStringSchema).min(1),
  resolved_source_ids: z.array(SourceIdSchema),
  unresolved_source_ids: z.array(SourceIdSchema),
  source_namespace_resolution: z.enum(['record-source-ids', 'linked-record-source-ids', 'unavailable-in-core-schema']),
  upstream_source_bytes_included: z.literal(false),
  content_limitations: z.array(NonEmptyStringSchema)
}).strict().superRefine((value, context) => {
  const fixture = value.object_class === 'repository-authored-normalized-fixture'
  if (value.upstream_response === fixture) context.addIssue({ code: z.ZodIssueCode.custom, path: ['upstream_response'], message: 'source object class and upstream_response conflict' })
  if (fixture && (value.artifact_repository === null || value.artifact_commit === null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_repository'], message: 'repository fixtures require repository and commit fields' })
  if (!fixture && (value.artifact_repository !== null || value.artifact_commit !== null)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['artifact_repository'], message: 'upstream source objects cannot claim repository artifact fields' })
})

export const KnowledgeSnapshotSchema = z.object({
  snapshot_schema_version: z.literal('1.0.0'),
  digest_algorithm: z.literal('sha256-rfc8785-snapshot-v1'),
  release: z.object({ id: NonEmptyStringSchema, schema_version: z.literal('1.0.0'), digest: Sha256HexSchema }).strict(),
  manifest: z.object({
    release_id: NonEmptyStringSchema,
    title: NonEmptyStringSchema,
    schema_version: z.literal('1.0.0'),
    release_digest: Sha256HexSchema,
    digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
    published_at: IsoDateSchema,
    immutable: z.literal(true),
    supported_taxa: z.array(NcbiTaxonIdSchema).min(1),
    scientific_scope: NonEmptyStringSchema,
    files: z.array(ManifestFileSchema).min(1),
    record_counts: z.record(NonNegativeIntSchema),
    sources: z.array(SourceSchema).min(1),
    compatibility: z.object({ consumer: z.literal('biochemical-inference'), network_contract: z.literal('1.0.0') }).strict()
  }).strict(),
  provenance: z.object({
    release_id: NonEmptyStringSchema,
    release_digest: Sha256HexSchema,
    recipe: ProvenanceArtifactSchema,
    source_lock: ProvenanceArtifactSchema,
    source_objects: z.array(ProvenanceSourceObjectSchema).min(1),
    transformer: ProvenanceImplementationSchema,
    validation: ProvenanceImplementationSchema
  }).strict(),
  selected_taxon: TaxonSchema,
  network: z.object({
    contract_version: z.literal('1.0.0'),
    compounds: z.array(CompoundSchema),
    reactions: z.array(ReactionSchema),
    proteins: z.array(ProteinSchema),
    catalysis: z.array(CatalysisSchema),
    references: z.array(ReferenceSchema)
  }).strict(),
  release_payloads: ReleasePayloadsSchema,
  source_metadata: z.object({ sources: z.array(SourceSchema).min(1), source_objects: z.array(SnapshotSourceObjectSchema).min(1) }).strict(),
  limitations: z.array(LimitationSchema),
  self_contained: z.boolean(),
  restricted_dependencies: z.array(z.object({ source_object_name: KebabIdSchema, source_ids: z.array(SourceIdSchema).min(1), license: LicenseSchema, reason: NonEmptyStringSchema }).strict()),
  snapshot_digest: Sha256HexSchema
}).strict()

