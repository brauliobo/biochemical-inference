import { z } from 'zod'

const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/)
const SourceIdSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/)
const TaxonIdSchema = z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)
const CompoundIdSchema = z.string().regex(/^CHEBI:[1-9][0-9]*$/)
const ReactionIdSchema = z.string().regex(/^RHEA:[1-9][0-9]*$/)
const ProteinIdSchema = z.string().regex(/^UniProtKB:[A-Z0-9]+$/)
const ReferenceIdSchema = z.string().regex(/^(?:PubMed:[1-9][0-9]*|UniProtKB:[A-Z0-9]+)$/)
const RecordTypeSchema = z.enum(['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations'])

const SourceSchema = z.object({
  id: SourceIdSchema,
  name: z.string().min(1),
  url: z.string().url(),
  accessed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  license: z.string().min(1),
  license_url: z.string().url().nullable()
}).strict()

const ManifestFileSchema = z.object({
  path: z.string().regex(/^[a-z][a-z0-9_-]*\.json$/),
  sha256: DigestSchema,
  bytes: z.number().int().positive(),
  record_type: RecordTypeSchema,
  record_count: z.number().int().nonnegative()
}).strict()

const ProvenanceArtifactSchema = z.object({
  path: z.string().regex(/^(?:recipes|sources\/locks)\/[a-z0-9.-]+\.json$/),
  sha256: DigestSchema
}).strict()

const ProvenanceImplementationSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  sha256: DigestSchema
}).strict()

const ProvenanceSourceObjectSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  record_type: RecordTypeSchema,
  sha256: DigestSchema,
  bytes: z.number().int().positive(),
  source_ids: z.array(SourceIdSchema).min(1),
  license_id: z.string().min(1)
}).strict()

const TaxonSchema = z.object({
  id: TaxonIdSchema,
  scientific_name: z.string().min(1),
  common_name: z.string().min(1),
  source_ids: z.array(z.literal('NCBI_TAXONOMY')).min(1)
}).strict()

const CompoundSchema = z.object({
  id: CompoundIdSchema,
  name: z.string().min(1),
  synonyms: z.array(z.string()),
  formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  charge: z.number().int(),
  source_ids: z.array(z.literal('CHEBI')).min(1)
}).strict()

const ParticipantSchema = z.object({ compound_id: CompoundIdSchema, coefficient: z.number().int().positive() }).strict()

const ReactionSchema = z.object({
  id: ReactionIdSchema,
  rhea_master_id: ReactionIdSchema,
  name: z.string().min(1),
  ec_numbers: z.array(z.string().regex(/^\d+\.[0-9-]+\.[0-9-]+\.[0-9-]+$/)).min(1),
  physiological_direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  equation: z.string().min(3),
  reactants: z.array(ParticipantSchema).min(1),
  products: z.array(ParticipantSchema).min(1),
  source_ids: z.array(z.literal('RHEA')).min(1)
}).strict()

const ProteinSchema = z.object({
  id: ProteinIdSchema,
  accession: z.string().regex(/^[A-Z0-9]+$/),
  taxon_id: TaxonIdSchema,
  gene_symbol: z.string().min(1),
  recommended_name: z.string().min(1),
  reviewed: z.literal(true),
  source_ids: z.array(z.literal('UNIPROTKB')).min(1)
}).strict()

const ReferenceSchema = z.object({
  id: ReferenceIdSchema,
  kind: z.enum(['pubmed', 'uniprot']),
  citation: z.string().min(1),
  url: z.string().url(),
  support_level: z.enum(['direct', 'inferred']),
  source_ids: z.array(SourceIdSchema).min(1)
}).strict()

const CatalysisSchema = z.object({
  id: z.string().regex(/^CATALYSIS:[A-Z0-9]+-[0-9]+$/),
  protein_id: ProteinIdSchema,
  reaction_id: ReactionIdSchema,
  taxon_id: TaxonIdSchema,
  evidence_class: z.enum(['direct', 'inferred']),
  evidence_code: z.enum(['ECO:0000250', 'ECO:0000269', 'ECO:0000305']),
  reference_ids: z.array(ReferenceIdSchema).min(1)
}).strict()

const LimitationSchema = z.object({ id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/), statement: z.string().min(1) }).strict()
const LicenseSchema = z.object({ id: z.string().min(1), name: z.string().min(1), url: z.string().url(), redistribution: z.enum(['public', 'restricted']) }).strict()

const SnapshotSourceObjectSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  record_type: RecordTypeSchema,
  sha256: DigestSchema,
  bytes: z.number().int().positive(),
  media_type: z.literal('application/json'),
  origin_url: z.string().regex(/^(?:file|https):\/\/\S+$/),
  source_release: z.string().min(1),
  retrieved_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/),
  source_ids: z.array(SourceIdSchema).min(1),
  license: LicenseSchema,
  included_content: z.literal('normalized-public-release-records'),
  included_record_ids: z.array(z.string().min(1)).min(1),
  upstream_source_bytes_included: z.literal(false),
  content_limitations: z.array(z.string().min(1))
}).strict()

export const KnowledgeSnapshotSchema = z.object({
  snapshot_schema_version: z.literal('1.0.0'),
  digest_algorithm: z.literal('sha256-rfc8785-snapshot-v1'),
  release: z.object({ id: z.string().min(1), schema_version: z.literal('1.0.0'), digest: DigestSchema }).strict(),
  manifest: z.object({
    release_id: z.string().min(1),
    title: z.string().min(1),
    schema_version: z.literal('1.0.0'),
    release_digest: DigestSchema,
    digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
    published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    immutable: z.literal(true),
    supported_taxa: z.array(TaxonIdSchema).min(1),
    scientific_scope: z.string().min(1),
    files: z.array(ManifestFileSchema).min(1),
    record_counts: z.record(z.number().int().nonnegative()),
    sources: z.array(SourceSchema).min(1),
    compatibility: z.object({ consumer: z.literal('biochemical-inference'), network_contract: z.literal('1.0.0') }).strict()
  }).strict(),
  provenance: z.object({
    release_id: z.string().min(1),
    release_digest: DigestSchema,
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
  source_metadata: z.object({ sources: z.array(SourceSchema).min(1), source_objects: z.array(SnapshotSourceObjectSchema).min(1) }).strict(),
  limitations: z.array(LimitationSchema),
  self_contained: z.boolean(),
  restricted_dependencies: z.array(z.object({ source_object_name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), source_ids: z.array(SourceIdSchema).min(1), license: LicenseSchema, reason: z.string().min(1) }).strict()),
  snapshot_digest: DigestSchema
}).strict()

export const SnapshotDigestSchema = DigestSchema
