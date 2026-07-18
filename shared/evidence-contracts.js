import { z } from 'zod'

export const EvidenceDigestSchema = z.string().regex(/^[a-f0-9]{64}$/)
export const EvidenceDocumentIdSchema = z.string().regex(/^EVIDENCE-DOC:[0-9]+$/)
export const EvidenceSectionIdSchema = z.string().regex(/^SECTION:[A-Z0-9-]+$/)
export const EvidenceSpanIdSchema = z.string().regex(/^SPAN:[A-Z0-9-]+$/)

export const EvidenceReleaseRefSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*-v[0-9]+\.[0-9]+\.[0-9]+$/),
  schema_version: z.literal('3.0.0'),
  digest: EvidenceDigestSchema
}).strict()

export const EvidenceHealthSchema = z.object({
  status: z.literal('ok'),
  release: EvidenceReleaseRefSchema,
  documents: z.number().int().nonnegative()
}).strict()

export const EvidenceDocumentSchema = z.object({
  id: EvidenceDocumentIdSchema,
  canonical_id: z.string().regex(/^PMID:[1-9][0-9]*$/),
  title: z.string().min(1),
  authors: z.array(z.string().min(1)).min(1),
  journal: z.string().min(1),
  publication_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  publication_status: z.enum(['active', 'corrected', 'retracted', 'deleted']),
  content_scope: z.enum(['metadata-only', 'licensed-excerpts']),
  source_ids: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).min(1)
}).strict()

export const EvidenceIdentifierSchema = z.object({
  id: z.string().regex(/^IDENTIFIER:[A-Z0-9-]+$/),
  document_id: EvidenceDocumentIdSchema,
  namespace: z.enum(['PMID', 'PMCID', 'DOI']),
  value: z.string().min(1).regex(/^[A-Za-z0-9./-]+$/),
  relation: z.enum(['canonical', 'exact-alias']),
  source_id: z.string().regex(/^[A-Z][A-Z0-9_]*$/)
}).strict()

export const EvidenceLicenseSchema = z.object({
  id: z.string().regex(/^LICENSE:[A-Z0-9.-]+$/),
  name: z.string().min(1),
  url: z.string().url(),
  redistribution: z.enum(['metadata-only', 'full-text-permitted']),
  attribution: z.string().min(1)
}).strict()

export const EvidenceLifecycleSchema = z.object({
  id: z.string().regex(/^LIFECYCLE:[A-Z0-9-]+$/),
  document_id: EvidenceDocumentIdSchema,
  event_type: z.enum(['published', 'corrected', 'retracted', 'deleted']),
  occurred_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  source_record_id: z.string().min(1),
  note: z.string().min(1)
}).strict()

export const EvidenceSectionSchema = z.object({
  id: EvidenceSectionIdSchema,
  document_id: EvidenceDocumentIdSchema,
  section_type: z.enum(['title', 'abstract', 'introduction', 'results']),
  source_id: z.string().regex(/^[A-Z][A-Z0-9_]*$/),
  source_locator: z.string().min(1),
  source_offset: z.number().int().nonnegative(),
  source_end: z.number().int().positive(),
  text: z.string().min(1).nullable(),
  access: z.enum(['redistributable', 'metadata-only']),
  license_id: z.string().regex(/^LICENSE:[A-Z0-9.-]+$/)
}).strict().superRefine((section, context) => {
  if (section.source_end <= section.source_offset) context.addIssue({ code: z.ZodIssueCode.custom, message: 'source_end must exceed source_offset' })
  if (section.access === 'redistributable' && section.text === null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'redistributable sections require text' })
  if (section.access === 'metadata-only' && section.text !== null) context.addIssue({ code: z.ZodIssueCode.custom, message: 'metadata-only sections cannot expose text' })
  if (section.text !== null && section.text.length !== section.source_end - section.source_offset) context.addIssue({ code: z.ZodIssueCode.custom, message: 'section text must match source offsets' })
})

export const EvidenceSpanSchema = z.object({
  id: EvidenceSpanIdSchema,
  document_id: EvidenceDocumentIdSchema,
  section_id: EvidenceSectionIdSchema,
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
  source_offset: z.number().int().nonnegative(),
  source_end: z.number().int().positive(),
  text: z.string().min(1),
  license_id: z.string().regex(/^LICENSE:[A-Z0-9.-]+$/)
}).strict().superRefine((span, context) => {
  if (span.end <= span.start || span.source_end <= span.source_offset) context.addIssue({ code: z.ZodIssueCode.custom, message: 'span end offsets must exceed start offsets' })
  if (span.text.length !== span.end - span.start || span.text.length !== span.source_end - span.source_offset) context.addIssue({ code: z.ZodIssueCode.custom, message: 'span text must match local and source offsets' })
})

export const EvidenceAnnotationSchema = z.object({
  id: z.string().regex(/^ANNOTATION:[A-Z0-9-]+$/),
  document_id: EvidenceDocumentIdSchema,
  span_id: EvidenceSpanIdSchema,
  annotation_type: z.enum(['Gene', 'Chemical', 'Disease', 'Species', 'Variant']),
  normalized_id: z.string().min(1).nullable(),
  source_id: z.literal('PUBTATOR'),
  source_annotation_id: z.string().min(1)
}).strict()

export const EvidenceRelationSchema = z.object({
  id: z.string().regex(/^RELATION:[A-Z0-9-]+$/),
  document_id: EvidenceDocumentIdSchema,
  relation_type: z.enum(['Association', 'Negative_Correlation', 'Positive_Correlation']),
  subject_annotation_id: z.string().regex(/^ANNOTATION:[A-Z0-9-]+$/),
  object_annotation_id: z.string().regex(/^ANNOTATION:[A-Z0-9-]+$/),
  confidence: z.number().finite().min(0).max(1),
  source_id: z.literal('PUBTATOR'),
  source_relation_id: z.string().min(1)
}).strict()

const RrfComponentSchema = z.object({ rank: z.number().int().positive(), rrf: z.number().finite().positive() }).strict()
const Bm25ComponentSchema = z.object({ rank: z.number().int().positive(), raw: z.number().finite(), rrf: z.number().finite().positive() }).strict()
const VectorComponentSchema = z.object({ rank: z.number().int().positive(), cosine: z.number().finite().min(-1).max(1), rrf: z.number().finite().positive() }).strict()

export const EvidenceScoreComponentsSchema = z.object({
  exact: RrfComponentSchema.optional(),
  bm25: Bm25ComponentSchema.optional(),
  vector: VectorComponentSchema.optional()
}).strict().refine((components) => Object.keys(components).length > 0, 'a result requires at least one ranking channel')

export const EvidenceSearchRequestSchema = z.object({
  query: z.string().trim().min(1).max(500),
  limit: z.number().int().min(1).max(50).default(10),
  use_vector: z.boolean().default(false)
}).strict()

export const EvidenceVectorMetadataSchema = z.object({
  release_digest: EvidenceDigestSchema,
  model: z.string().min(1),
  model_digest: EvidenceDigestSchema,
  dimensions: z.number().int().positive(),
  attribution: z.enum(['digest-bound', 'trusted-local-unverified']).optional()
}).strict()

export const EvidenceSearchResultSchema = z.object({
  document: EvidenceDocumentSchema,
  score: z.number().finite().positive(),
  score_components: EvidenceScoreComponentsSchema
}).strict()

export const EvidenceSearchResponseSchema = z.object({
  release: EvidenceReleaseRefSchema,
  query: z.string().min(1),
  ranking: z.literal('reciprocal-rank-fusion-v1'),
  vector_metadata: EvidenceVectorMetadataSchema.nullable(),
  explanations: z.object({
    exact: z.string().min(1),
    annotation: z.string().min(1),
    bm25: z.string().min(1),
    vector: z.string().min(1),
    rrf: z.string().min(1)
  }).strict(),
  items: z.array(EvidenceSearchResultSchema)
}).strict()

export const UpstreamEvidenceSearchResponseSchema = EvidenceSearchResponseSchema.omit({ explanations: true }).strict()

export const EvidenceDocumentResponseSchema = z.object({
  release: EvidenceReleaseRefSchema,
  document: EvidenceDocumentSchema,
  identifiers: z.array(EvidenceIdentifierSchema),
  licenses: z.array(EvidenceLicenseSchema).min(1),
  lifecycle: z.array(EvidenceLifecycleSchema).min(1),
  sections: z.array(EvidenceSectionSchema),
  spans: z.array(EvidenceSpanSchema),
  annotations: z.array(EvidenceAnnotationSchema),
  relations: z.array(EvidenceRelationSchema)
}).strict()

export const UpstreamEvidenceDocumentResponseSchema = EvidenceDocumentResponseSchema.omit({ licenses: true }).strict()

export const EvidenceCandidateSchema = z.object({
  id: z.string().regex(/^CANDIDATE:[a-f0-9]{32}$/),
  status: z.literal('unreviewed'),
  release_id: EvidenceReleaseRefSchema.shape.id,
  release_digest: EvidenceDigestSchema,
  document_id: EvidenceDocumentIdSchema,
  span_ids: z.array(EvidenceSpanIdSchema).min(1),
  model: z.string().min(1),
  model_digest: EvidenceDigestSchema,
  prompt_digest: EvidenceDigestSchema,
  input_digest: EvidenceDigestSchema,
  output_digest: EvidenceDigestSchema,
  subject: z.string().min(1),
  relation: z.string().min(1),
  object: z.string().min(1),
  unresolved_entities: z.array(z.string()),
  missing_context: z.array(z.string())
}).strict()

export const EvidenceCandidateExtractionRequestSchema = z.object({
  document_id: EvidenceDocumentIdSchema,
  span_ids: z.array(EvidenceSpanIdSchema).min(1).max(20).refine((ids) => new Set(ids).size === ids.length, 'span_ids must be unique'),
  instruction: z.string().trim().min(1).max(2000)
}).strict()

export const EvidenceCandidateResponseSchema = z.object({
  release: EvidenceReleaseRefSchema,
  candidate: EvidenceCandidateSchema
}).strict()

export const EvidenceCandidateListResponseSchema = z.object({
  release: EvidenceReleaseRefSchema,
  items: z.array(EvidenceCandidateSchema)
}).strict()

export const UpstreamEvidenceCandidateResponseSchema = z.object({ candidate: EvidenceCandidateSchema }).strict()
export const UpstreamEvidenceCandidateListResponseSchema = z.object({ items: z.array(EvidenceCandidateSchema) }).strict()

export const EVIDENCE_RANKING_EXPLANATIONS = Object.freeze({
  exact: 'Exact canonical document IDs and aliases receive their own deterministic rank.',
  annotation: 'Normalized PubTator IDs and exact annotation text participate in the exact-match rank.',
  bm25: 'BM25 ranks indexed titles and redistributable section text; lower raw values rank first.',
  vector: 'Optional local Ollama cosine similarity is an independent rank and is never required for lexical search.',
  rrf: 'Reciprocal rank fusion sums 1 / (60 + rank) across participating channels.'
})
