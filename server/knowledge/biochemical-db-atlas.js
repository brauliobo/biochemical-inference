import { z } from 'zod'
import {
  AtlasClaimSchema,
  AtlasClaimsResponseSchema,
  AtlasCoverageResponseSchema,
  AtlasCoverageSchema,
  AtlasEntityResponseSchema,
  AtlasEntitySchema,
  AtlasEvidenceSchema,
  AtlasLimitationSchema,
  AtlasMappingSchema,
  AtlasNetworkSchema,
  AtlasReleaseDetailSchema,
  AtlasReleaseSchema,
  AtlasSubgraphSchema,
  AtlasTransformationSchema
} from '../../shared/atlas-contracts.js'
import { TaxonIdSchema } from '../../shared/contracts.js'

const QualifiedIdSchema = z.string().regex(/^(?:HGNC|MGI|Ensembl|UniProtKB|CHEBI|RHEA|Reactome|GO|UBERON|MONDO|HP|MP):[A-Za-z0-9_.-]+$/)
const CanonicalTaxonIdSchema = z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)
const SourceIdSchema = z.string().regex(/^[A-Z][A-Z0-9_]*$/)
const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/)
const EvidenceIdSchema = z.string().regex(/^EVIDENCE:[A-Z0-9-]+$/)
const EntityTypeSchema = z.enum(['gene', 'transcript', 'protein', 'isoform', 'compound', 'reaction', 'complex', 'pathway', 'compartment', 'tissue', 'cell', 'disease', 'phenotype'])
const DerivationSchema = z.enum(['direct', 'inferred', 'orthology-transferred'])

const AtlasReleaseRefSchema = z.object({
  id: z.string().min(1),
  schema_version: z.literal('2.0.0'),
  digest: DigestSchema
}).strict()

const AtlasCatalogEntrySchema = z.object({
  release_id: z.string().min(1),
  title: z.string().min(1),
  schema_version: z.literal('2.0.0'),
  release_digest: DigestSchema,
  supported_taxa: z.array(CanonicalTaxonIdSchema).min(1),
  manifest_path: z.string().regex(/^[a-z0-9.-]+\/manifest\.json$/)
}).strict()

export const BiochemicalDbAtlasCatalogSchema = z.object({
  catalog_schema_version: z.literal('2.0.0'),
  releases: z.array(AtlasCatalogEntrySchema)
}).strict()

const baseEntityShape = {
  id: QualifiedIdSchema,
  name: z.string().min(1),
  taxon_id: CanonicalTaxonIdSchema.nullable(),
  external_ids: z.array(QualifiedIdSchema),
  source_ids: z.array(SourceIdSchema).min(1)
}

export const BiochemicalDbAtlasEntitySchema = z.discriminatedUnion('entity_type', [
  z.object({ ...baseEntityShape, entity_type: z.literal('gene'), symbol: z.string().min(1) }).strict(),
  z.object({ ...baseEntityShape, entity_type: z.literal('transcript'), gene_id: QualifiedIdSchema, canonical: z.boolean() }).strict(),
  z.object({ ...baseEntityShape, entity_type: z.literal('protein'), gene_id: QualifiedIdSchema, reviewed: z.boolean() }).strict(),
  z.object({ ...baseEntityShape, entity_type: z.literal('isoform'), protein_id: QualifiedIdSchema, sequence_status: z.enum(['displayed', 'alternative']) }).strict(),
  z.object({ ...baseEntityShape, entity_type: z.literal('compound'), formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/), charge: z.number().int() }).strict(),
  z.object({
    ...baseEntityShape,
    entity_type: z.literal('reaction'),
    equation: z.string().min(3),
    direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
    participants: z.array(z.object({
      compound_id: QualifiedIdSchema,
      coefficient: z.number().int().positive(),
      side: z.enum(['reactant', 'product'])
    }).strict()).min(2)
  }).strict(),
  z.object({ ...baseEntityShape, entity_type: z.literal('complex'), component_ids: z.array(QualifiedIdSchema).min(1) }).strict(),
  ...['pathway', 'compartment', 'tissue', 'cell', 'disease'].map((entityType) => z.object({ ...baseEntityShape, entity_type: z.literal(entityType) }).strict()),
  z.object({ ...baseEntityShape, entity_type: z.literal('phenotype'), phenotype_system: z.enum(['HPO', 'MP']) }).strict()
])

export const BiochemicalDbAtlasEvidenceSchema = z.object({
  id: EvidenceIdSchema,
  kind: z.enum(['database-record', 'publication', 'ontology-record']),
  source_id: SourceIdSchema,
  citation: z.string().min(1),
  url: z.string().url(),
  taxon_id: CanonicalTaxonIdSchema.nullable()
}).strict()

export const BiochemicalDbAtlasClaimSchema = z.object({
  id: z.string().regex(/^CLAIM:[A-Z0-9-]+$/),
  subject_id: QualifiedIdSchema,
  relation: z.enum(['has_transcript', 'translates_to', 'isoform_of', 'encodes', 'forms_complex', 'catalyzes', 'participates_in', 'studied_in', 'causes', 'has_phenotype']),
  object_id: QualifiedIdSchema,
  context: z.object({
    taxon_id: CanonicalTaxonIdSchema,
    tissue_id: QualifiedIdSchema.nullable(),
    compartment_id: QualifiedIdSchema.nullable(),
    cell_id: QualifiedIdSchema.nullable()
  }).strict(),
  derivation: DerivationSchema,
  polarity: z.enum(['supporting', 'contradicting']),
  evidence_ids: z.array(EvidenceIdSchema).min(1),
  transformation_id: z.string().regex(/^TRANSFORMATION:[A-Z0-9-]+$/).nullable()
}).strict()

export const BiochemicalDbAtlasMappingSchema = z.object({
  id: z.string().regex(/^MAPPING:[A-Z0-9-]+$/),
  source_id: QualifiedIdSchema,
  relation: z.enum(['exact_match', 'related_match', 'replaced_by']),
  status: z.enum(['resolved', 'ambiguous', 'deprecated']),
  target_id: QualifiedIdSchema.nullable(),
  candidate_ids: z.array(QualifiedIdSchema),
  evidence_ids: z.array(EvidenceIdSchema).min(1),
  rationale: z.string().min(1)
}).strict()

export const BiochemicalDbAtlasTransformationSchema = z.object({
  id: z.string().regex(/^TRANSFORMATION:[A-Z0-9-]+$/),
  kind: z.literal('orthology'),
  source_taxon_id: CanonicalTaxonIdSchema,
  target_taxon_id: CanonicalTaxonIdSchema,
  source_claim_id: z.string().regex(/^CLAIM:[A-Z0-9-]+$/),
  entity_pairs: z.array(z.object({ source_id: QualifiedIdSchema, target_id: QualifiedIdSchema }).strict()).min(1),
  method: z.string().min(1),
  evidence_ids: z.array(EvidenceIdSchema).min(1),
  limitations: z.string().min(1)
}).strict()

export const BiochemicalDbAtlasCoverageSchema = z.object({
  id: z.string().regex(/^COVERAGE:[A-Z0-9-]+$/),
  taxon_id: CanonicalTaxonIdSchema,
  tissue_id: QualifiedIdSchema.nullable(),
  entity_type: EntityTypeSchema,
  evidence_class: z.union([DerivationSchema, z.literal('uncovered')]),
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().positive(),
  denominator_definition: z.string().min(1),
  expected_ids: z.array(z.string()).min(1),
  covered_ids: z.array(z.string()),
  gap_ids: z.array(z.string())
}).strict()

export const BiochemicalDbAtlasLimitationSchema = z.object({
  id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/),
  category: z.enum(['scope', 'evidence', 'mapping', 'coverage']),
  statement: z.string().min(1),
  coverage_ids: z.array(z.string().regex(/^COVERAGE:[A-Z0-9-]+$/))
}).strict()

const ManifestSchema = z.object({
  release_id: z.string().min(1),
  title: z.string().min(1),
  schema_version: z.literal('2.0.0'),
  release_digest: DigestSchema,
  digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
  published_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  immutable: z.literal(true),
  supported_taxa: z.array(CanonicalTaxonIdSchema).min(1),
  scientific_scope: z.string().min(1),
  files: z.array(z.object({
    path: z.string().regex(/^[a-z][a-z0-9_-]*\.json$/),
    record_type: z.enum(['entities', 'evidence', 'claims', 'mappings', 'transformations', 'coverage', 'limitations']),
    sha256: DigestSchema,
    bytes: z.number().int().positive(),
    record_count: z.number().int().nonnegative()
  }).strict()).min(1),
  record_counts: z.record(z.number().int().nonnegative()),
  sources: z.array(z.object({
    id: SourceIdSchema,
    name: z.string().min(1),
    release: z.string().min(1),
    url: z.string().url(),
    accessed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    license: z.string().min(1),
    license_url: z.string().url()
  }).strict()).min(1),
  compatibility: z.object({
    consumer: z.literal('biochemical-inference'),
    api_contract: z.literal('2.0.0'),
    network_contract: z.literal('2.0.0')
  }).strict()
}).strict()

export const BiochemicalDbAtlasReleaseDetailSchema = z.object({ release: AtlasReleaseRefSchema, manifest: ManifestSchema }).strict()
export const BiochemicalDbAtlasEntityResponseSchema = z.object({ release: AtlasReleaseRefSchema, entity: BiochemicalDbAtlasEntitySchema }).strict()
export const BiochemicalDbAtlasClaimsResponseSchema = z.object({ release: AtlasReleaseRefSchema, items: z.array(BiochemicalDbAtlasClaimSchema) }).strict()
export const BiochemicalDbAtlasCoverageResponseSchema = z.object({ release: AtlasReleaseRefSchema, items: z.array(BiochemicalDbAtlasCoverageSchema) }).strict()
export const BiochemicalDbAtlasSubgraphSchema = z.object({
  contract_version: z.literal('2.0.0'),
  release: AtlasReleaseRefSchema,
  root_id: QualifiedIdSchema,
  taxon_id: CanonicalTaxonIdSchema,
  max_depth: z.number().int().min(0).max(6),
  max_nodes: z.number().int().min(1).max(100),
  truncated: z.boolean(),
  entities: z.array(BiochemicalDbAtlasEntitySchema),
  claims: z.array(BiochemicalDbAtlasClaimSchema),
  evidence: z.array(BiochemicalDbAtlasEvidenceSchema),
  transformations: z.array(BiochemicalDbAtlasTransformationSchema)
}).strict()
export const BiochemicalDbAtlasNetworkSchema = z.object({
  contract_version: z.literal('2.0.0'),
  release: AtlasReleaseRefSchema,
  taxon_id: CanonicalTaxonIdSchema,
  tissue_id: QualifiedIdSchema.nullable(),
  entities: z.array(BiochemicalDbAtlasEntitySchema),
  claims: z.array(BiochemicalDbAtlasClaimSchema),
  evidence: z.array(BiochemicalDbAtlasEvidenceSchema),
  mappings: z.array(BiochemicalDbAtlasMappingSchema),
  transformations: z.array(BiochemicalDbAtlasTransformationSchema),
  coverage: z.array(BiochemicalDbAtlasCoverageSchema),
  limitations: z.array(BiochemicalDbAtlasLimitationSchema)
}).strict()

export function canonicalAtlasTaxonId(taxonId) {
  return `NCBITaxon:${TaxonIdSchema.parse(taxonId)}`
}

function internalTaxonId(taxonId) {
  return taxonId === null ? null : TaxonIdSchema.parse(Number(taxonId.slice('NCBITaxon:'.length)))
}

export function adaptAtlasCatalogEntry(entry, source = 'biochemical-db') {
  return AtlasReleaseSchema.parse({
    id: entry.release_id,
    title: entry.title,
    digest: `sha256:${entry.release_digest}`,
    schemaVersion: entry.schema_version,
    supportedTaxa: entry.supported_taxa.map(internalTaxonId),
    verified: true,
    source
  })
}

export function adaptAtlasEntity(entity) {
  const adapted = {
    id: entity.id,
    name: entity.name,
    entityType: entity.entity_type,
    taxonId: internalTaxonId(entity.taxon_id),
    externalIds: entity.external_ids,
    sourceIds: entity.source_ids
  }
  if (entity.entity_type === 'gene') adapted.symbol = entity.symbol
  if (entity.entity_type === 'transcript') Object.assign(adapted, { geneId: entity.gene_id, canonical: entity.canonical })
  if (entity.entity_type === 'protein') Object.assign(adapted, { geneId: entity.gene_id, reviewed: entity.reviewed })
  if (entity.entity_type === 'isoform') Object.assign(adapted, { proteinId: entity.protein_id, sequenceStatus: entity.sequence_status })
  if (entity.entity_type === 'compound') Object.assign(adapted, { formula: entity.formula, charge: entity.charge })
  if (entity.entity_type === 'reaction') Object.assign(adapted, {
    equation: entity.equation,
    direction: entity.direction,
    participants: entity.participants.map((item) => ({ compoundId: item.compound_id, coefficient: item.coefficient, side: item.side }))
  })
  if (entity.entity_type === 'complex') adapted.componentIds = entity.component_ids
  if (entity.entity_type === 'phenotype') adapted.phenotypeSystem = entity.phenotype_system
  return AtlasEntitySchema.parse(adapted)
}

export function adaptAtlasEvidence(evidence) {
  return AtlasEvidenceSchema.parse({
    id: evidence.id,
    kind: evidence.kind,
    sourceId: evidence.source_id,
    citation: evidence.citation,
    url: evidence.url,
    taxonId: internalTaxonId(evidence.taxon_id)
  })
}

export function adaptAtlasClaim(claim) {
  return AtlasClaimSchema.parse({
    id: claim.id,
    subjectId: claim.subject_id,
    relation: claim.relation,
    objectId: claim.object_id,
    context: {
      taxonId: internalTaxonId(claim.context.taxon_id),
      tissueId: claim.context.tissue_id,
      compartmentId: claim.context.compartment_id,
      cellId: claim.context.cell_id
    },
    derivation: claim.derivation,
    polarity: claim.polarity,
    evidenceIds: claim.evidence_ids,
    transformationId: claim.transformation_id
  })
}

export function adaptAtlasMapping(mapping) {
  return AtlasMappingSchema.parse({
    id: mapping.id,
    sourceId: mapping.source_id,
    relation: mapping.relation,
    status: mapping.status,
    targetId: mapping.target_id,
    candidateIds: mapping.candidate_ids,
    evidenceIds: mapping.evidence_ids,
    rationale: mapping.rationale
  })
}

export function adaptAtlasTransformation(transformation) {
  return AtlasTransformationSchema.parse({
    id: transformation.id,
    kind: transformation.kind,
    sourceTaxonId: internalTaxonId(transformation.source_taxon_id),
    targetTaxonId: internalTaxonId(transformation.target_taxon_id),
    sourceClaimId: transformation.source_claim_id,
    entityPairs: transformation.entity_pairs.map((pair) => ({ sourceId: pair.source_id, targetId: pair.target_id })),
    method: transformation.method,
    evidenceIds: transformation.evidence_ids,
    limitations: transformation.limitations
  })
}

export function adaptAtlasCoverage(coverage) {
  return AtlasCoverageSchema.parse({
    id: coverage.id,
    taxonId: internalTaxonId(coverage.taxon_id),
    tissueId: coverage.tissue_id,
    entityType: coverage.entity_type,
    evidenceClass: coverage.evidence_class,
    numerator: coverage.numerator,
    denominator: coverage.denominator,
    denominatorDefinition: coverage.denominator_definition,
    expectedIds: coverage.expected_ids,
    coveredIds: coverage.covered_ids,
    gapIds: coverage.gap_ids
  })
}

export function adaptAtlasLimitation(limitation) {
  return AtlasLimitationSchema.parse({
    id: limitation.id,
    category: limitation.category,
    statement: limitation.statement,
    coverageIds: limitation.coverage_ids
  })
}

function envelope(release) {
  return { releaseId: release.id, releaseDigest: `sha256:${release.digest}` }
}

export function adaptAtlasReleaseDetail(payload, release) {
  return AtlasReleaseDetailSchema.parse({
    release,
    publishedAt: payload.manifest.published_at,
    immutable: payload.manifest.immutable,
    scientificScope: payload.manifest.scientific_scope,
    recordCounts: payload.manifest.record_counts,
    apiContract: payload.manifest.compatibility.api_contract
  })
}

export function adaptAtlasEntityResponse(payload) {
  return AtlasEntityResponseSchema.parse({ ...envelope(payload.release), entity: adaptAtlasEntity(payload.entity) })
}

export function adaptAtlasClaimsResponse(payload) {
  return AtlasClaimsResponseSchema.parse({ ...envelope(payload.release), items: payload.items.map(adaptAtlasClaim) })
}

export function adaptAtlasCoverageResponse(payload) {
  return AtlasCoverageResponseSchema.parse({ ...envelope(payload.release), items: payload.items.map(adaptAtlasCoverage) })
}

export function adaptAtlasSubgraph(payload) {
  return AtlasSubgraphSchema.parse({
    contractVersion: payload.contract_version,
    ...envelope(payload.release),
    rootId: payload.root_id,
    taxonId: internalTaxonId(payload.taxon_id),
    maxDepth: payload.max_depth,
    maxNodes: payload.max_nodes,
    truncated: payload.truncated,
    entities: payload.entities.map(adaptAtlasEntity),
    claims: payload.claims.map(adaptAtlasClaim),
    evidence: payload.evidence.map(adaptAtlasEvidence),
    transformations: payload.transformations.map(adaptAtlasTransformation)
  })
}

export function adaptAtlasNetwork(payload) {
  return AtlasNetworkSchema.parse({
    contractVersion: payload.contract_version,
    ...envelope(payload.release),
    taxonId: internalTaxonId(payload.taxon_id),
    tissueId: payload.tissue_id,
    entities: payload.entities.map(adaptAtlasEntity),
    claims: payload.claims.map(adaptAtlasClaim),
    evidence: payload.evidence.map(adaptAtlasEvidence),
    mappings: payload.mappings.map(adaptAtlasMapping),
    transformations: payload.transformations.map(adaptAtlasTransformation),
    coverage: payload.coverage.map(adaptAtlasCoverage),
    limitations: payload.limitations.map(adaptAtlasLimitation)
  })
}
