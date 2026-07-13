import { z } from 'zod'
import { TaxonIdSchema } from './contracts.js'

export const ATLAS_ENTITY_TYPES = [
  'gene',
  'transcript',
  'protein',
  'isoform',
  'compound',
  'reaction',
  'complex',
  'pathway',
  'compartment',
  'tissue',
  'cell',
  'disease',
  'phenotype'
]

const Sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
const QualifiedIdSchema = z.string().regex(/^(?:HGNC|MGI|Ensembl|UniProtKB|CHEBI|RHEA|Reactome|GO|UBERON|MONDO|HP|MP):[A-Za-z0-9_.-]+$/)
const EntityTypeSchema = z.enum(ATLAS_ENTITY_TYPES)
const DerivationSchema = z.enum(['direct', 'inferred', 'orthology-transferred'])
const PolaritySchema = z.enum(['supporting', 'contradicting'])

export const AtlasReleaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  digest: Sha256Schema,
  schemaVersion: z.literal('2.0.0'),
  supportedTaxa: z.array(TaxonIdSchema).min(1),
  verified: z.literal(true),
  source: z.enum(['biochemical-db', 'bundled-demonstration'])
}).strict()

export const AtlasReleaseDetailSchema = z.object({
  release: AtlasReleaseSchema,
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  immutable: z.literal(true),
  scientificScope: z.string().min(1),
  recordCounts: z.record(z.number().int().nonnegative()),
  apiContract: z.literal('2.0.0')
}).strict()

const baseEntityShape = {
  id: QualifiedIdSchema,
  name: z.string().min(1),
  taxonId: TaxonIdSchema.nullable(),
  externalIds: z.array(QualifiedIdSchema),
  sourceIds: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).min(1)
}

export const AtlasEntitySchema = z.discriminatedUnion('entityType', [
  z.object({ ...baseEntityShape, entityType: z.literal('gene'), symbol: z.string().min(1) }).strict(),
  z.object({ ...baseEntityShape, entityType: z.literal('transcript'), geneId: QualifiedIdSchema, canonical: z.boolean() }).strict(),
  z.object({ ...baseEntityShape, entityType: z.literal('protein'), geneId: QualifiedIdSchema, reviewed: z.boolean() }).strict(),
  z.object({ ...baseEntityShape, entityType: z.literal('isoform'), proteinId: QualifiedIdSchema, sequenceStatus: z.enum(['displayed', 'alternative']) }).strict(),
  z.object({ ...baseEntityShape, entityType: z.literal('compound'), formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/), charge: z.number().int() }).strict(),
  z.object({
    ...baseEntityShape,
    entityType: z.literal('reaction'),
    equation: z.string().min(3),
    direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
    participants: z.array(z.object({
      compoundId: QualifiedIdSchema,
      coefficient: z.number().int().positive(),
      side: z.enum(['reactant', 'product'])
    }).strict()).min(2)
  }).strict(),
  z.object({ ...baseEntityShape, entityType: z.literal('complex'), componentIds: z.array(QualifiedIdSchema).min(1) }).strict(),
  ...['pathway', 'compartment', 'tissue', 'cell', 'disease'].map((entityType) => z.object({ ...baseEntityShape, entityType: z.literal(entityType) }).strict()),
  z.object({ ...baseEntityShape, entityType: z.literal('phenotype'), phenotypeSystem: z.enum(['HPO', 'MP']) }).strict()
])

export const AtlasEvidenceSchema = z.object({
  id: z.string().regex(/^EVIDENCE:[A-Z0-9-]+$/),
  kind: z.enum(['database-record', 'publication', 'ontology-record']),
  sourceId: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  citation: z.string().min(1),
  url: z.string().url(),
  taxonId: TaxonIdSchema.nullable()
}).strict()

export const AtlasClaimSchema = z.object({
  id: z.string().regex(/^CLAIM:[A-Z0-9-]+$/),
  subjectId: QualifiedIdSchema,
  relation: z.enum(['has_transcript', 'translates_to', 'isoform_of', 'encodes', 'forms_complex', 'catalyzes', 'participates_in', 'studied_in', 'causes', 'has_phenotype']),
  objectId: QualifiedIdSchema,
  context: z.object({
    taxonId: TaxonIdSchema,
    tissueId: QualifiedIdSchema.nullable(),
    compartmentId: QualifiedIdSchema.nullable(),
    cellId: QualifiedIdSchema.nullable()
  }).strict(),
  derivation: DerivationSchema,
  polarity: PolaritySchema,
  evidenceIds: z.array(z.string().regex(/^EVIDENCE:[A-Z0-9-]+$/)).min(1),
  transformationId: z.string().regex(/^TRANSFORMATION:[A-Z0-9-]+$/).nullable()
}).strict()

export const AtlasMappingSchema = z.object({
  id: z.string().regex(/^MAPPING:[A-Z0-9-]+$/),
  sourceId: QualifiedIdSchema,
  relation: z.enum(['exact_match', 'related_match', 'replaced_by']),
  status: z.enum(['resolved', 'ambiguous', 'deprecated']),
  targetId: QualifiedIdSchema.nullable(),
  candidateIds: z.array(QualifiedIdSchema),
  evidenceIds: z.array(z.string().regex(/^EVIDENCE:[A-Z0-9-]+$/)).min(1),
  rationale: z.string().min(1)
}).strict()

export const AtlasTransformationSchema = z.object({
  id: z.string().regex(/^TRANSFORMATION:[A-Z0-9-]+$/),
  kind: z.literal('orthology'),
  sourceTaxonId: TaxonIdSchema,
  targetTaxonId: TaxonIdSchema,
  sourceClaimId: z.string().regex(/^CLAIM:[A-Z0-9-]+$/),
  entityPairs: z.array(z.object({ sourceId: QualifiedIdSchema, targetId: QualifiedIdSchema }).strict()).min(1),
  method: z.string().min(1),
  evidenceIds: z.array(z.string().regex(/^EVIDENCE:[A-Z0-9-]+$/)).min(1),
  limitations: z.string().min(1)
}).strict()

export const AtlasCoverageSchema = z.object({
  id: z.string().regex(/^COVERAGE:[A-Z0-9-]+$/),
  taxonId: TaxonIdSchema,
  tissueId: QualifiedIdSchema.nullable(),
  entityType: EntityTypeSchema,
  evidenceClass: z.union([DerivationSchema, z.literal('uncovered')]),
  numerator: z.number().int().nonnegative(),
  denominator: z.number().int().positive(),
  denominatorDefinition: z.string().min(1),
  expectedIds: z.array(z.string()).min(1),
  coveredIds: z.array(z.string()),
  gapIds: z.array(z.string())
}).strict()

export const AtlasLimitationSchema = z.object({
  id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/),
  category: z.enum(['scope', 'evidence', 'mapping', 'coverage']),
  statement: z.string().min(1),
  coverageIds: z.array(z.string().regex(/^COVERAGE:[A-Z0-9-]+$/))
}).strict()

const atlasEnvelopeShape = {
  releaseId: z.string().min(1),
  releaseDigest: Sha256Schema
}

export const AtlasEntityResponseSchema = z.object({
  ...atlasEnvelopeShape,
  entity: AtlasEntitySchema
}).strict()

export const AtlasClaimsResponseSchema = z.object({
  ...atlasEnvelopeShape,
  items: z.array(AtlasClaimSchema)
}).strict()

export const AtlasCoverageResponseSchema = z.object({
  ...atlasEnvelopeShape,
  items: z.array(AtlasCoverageSchema)
}).strict()

export const AtlasSubgraphSchema = z.object({
  contractVersion: z.literal('2.0.0'),
  ...atlasEnvelopeShape,
  rootId: QualifiedIdSchema,
  taxonId: TaxonIdSchema,
  maxDepth: z.number().int().min(0).max(6),
  maxNodes: z.number().int().min(1).max(100),
  truncated: z.boolean(),
  entities: z.array(AtlasEntitySchema),
  claims: z.array(AtlasClaimSchema),
  evidence: z.array(AtlasEvidenceSchema),
  transformations: z.array(AtlasTransformationSchema)
}).strict()

export const AtlasNetworkSchema = z.object({
  contractVersion: z.literal('2.0.0'),
  ...atlasEnvelopeShape,
  taxonId: TaxonIdSchema,
  tissueId: QualifiedIdSchema.nullable(),
  entities: z.array(AtlasEntitySchema),
  claims: z.array(AtlasClaimSchema),
  evidence: z.array(AtlasEvidenceSchema),
  mappings: z.array(AtlasMappingSchema),
  transformations: z.array(AtlasTransformationSchema),
  coverage: z.array(AtlasCoverageSchema),
  limitations: z.array(AtlasLimitationSchema)
}).strict()
