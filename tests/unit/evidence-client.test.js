import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  EvidenceAnnotationSchema,
  EvidenceDocumentSchema,
  EvidenceLicenseSchema,
  EvidenceLifecycleSchema,
  EvidenceRelationSchema,
  EvidenceSectionSchema,
  EvidenceSpanSchema
} from '../../shared/evidence-contracts.js'
import {
  createEvidenceClient,
  DEFAULT_EVIDENCE_RELEASE_DIGEST,
  DEFAULT_EVIDENCE_RELEASE_ID
} from '../../server/evidence/client.js'

afterEach(() => vi.unstubAllGlobals())

describe('evidence service boundary', () => {
  it('uses strict schemas for every document evidence family', () => {
    const document = { id: 'EVIDENCE-DOC:1', canonical_id: 'PMID:1', title: 'Title', authors: ['Author'], journal: 'Journal', publication_date: '2026-01-01', publication_status: 'active', content_scope: 'metadata-only', source_ids: ['PUBMED'] }
    const license = { id: 'LICENSE:TEST', name: 'Test', url: 'https://example.test/license', redistribution: 'metadata-only', attribution: 'Attribution.' }
    const lifecycle = { id: 'LIFECYCLE:TEST', document_id: document.id, event_type: 'published', occurred_at: '2026-01-01', source_id: 'PUBMED', source_record_id: '1', note: 'Published.' }
    const section = { id: 'SECTION:TEST', document_id: document.id, section_type: 'title', source_id: 'PUBMED', source_locator: 'title', source_offset: 0, source_end: 5, text: 'Title', access: 'redistributable', license_id: license.id }
    const span = { id: 'SPAN:TEST', document_id: document.id, section_id: section.id, start: 0, end: 5, source_offset: 0, source_end: 5, text: 'Title', license_id: license.id }
    const annotation = { id: 'ANNOTATION:TEST', document_id: document.id, span_id: span.id, annotation_type: 'Gene', normalized_id: 'NCBIGene:1', source_id: 'PUBTATOR', source_annotation_id: '1' }
    const relation = { id: 'RELATION:TEST', document_id: document.id, relation_type: 'Association', subject_annotation_id: annotation.id, object_annotation_id: 'ANNOTATION:OTHER', confidence: 0.9, source_id: 'PUBTATOR', source_relation_id: 'R1' }

    for (const [schema, value] of [[EvidenceDocumentSchema, document], [EvidenceLicenseSchema, license], [EvidenceLifecycleSchema, lifecycle], [EvidenceSectionSchema, section], [EvidenceSpanSchema, span], [EvidenceAnnotationSchema, annotation], [EvidenceRelationSchema, relation]]) {
      expect(schema.safeParse(value).success).toBe(true)
      expect(schema.safeParse({ ...value, undocumented: true }).success).toBe(false)
    }
  })

  it('fails closed when health reports a different evidence digest', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      status: 'ok',
      release: { id: DEFAULT_EVIDENCE_RELEASE_ID, schema_version: '3.0.0', digest: '0'.repeat(64) },
      documents: 3
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    await expect(createEvidenceClient().health()).rejects.toThrow(`pinned release ${DEFAULT_EVIDENCE_RELEASE_ID} and digest`)
  })

  it('ranks exact and BM25 fixture channels with visible RRF contributions', async () => {
    const client = createEvidenceClient({ BIOCHEMICAL_EVIDENCE_USE_FIXTURE: 'true' })
    const response = await client.search({ query: 'PMID:29891918', limit: 10, use_vector: false })

    expect(response.release.digest).toBe(DEFAULT_EVIDENCE_RELEASE_DIGEST)
    expect(response.items[0].document.id).toBe('EVIDENCE-DOC:29891918')
    expect(response.items[0].score_components).toMatchObject({ exact: { rank: 1 } })
    expect(response.items[0].score).toBeCloseTo(response.items[0].score_components.exact.rrf)
    const lexical = await client.search({ query: 'MTHFR phosphorylation', limit: 10, use_vector: false })
    expect(lexical.items[0].score_components.bm25).toMatchObject({ rank: expect.any(Number), raw: expect.any(Number), rrf: expect.any(Number) })
    expect(response.explanations.annotation).toContain('PubTator')
    expect(lexical.vector_metadata).toBeNull()
  })

  it('classifies only explicit Ollama availability failures as model unavailable', async () => {
    const health = {
      status: 'ok',
      release: { id: DEFAULT_EVIDENCE_RELEASE_ID, schema_version: '3.0.0', digest: DEFAULT_EVIDENCE_RELEASE_DIGEST },
      documents: 3
    }
    let detail = 'Ollama generation response is invalid: malformed JSON'
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(String(url).endsWith('/healthz') ? health : { detail }), {
      status: String(url).endsWith('/healthz') ? 200 : 503,
      headers: { 'content-type': 'application/json' }
    })))
    const client = createEvidenceClient()
    const request = { document_id: 'EVIDENCE-DOC:1', span_ids: ['SPAN:TEST'], instruction: 'Extract.' }

    await expect(client.extract(request)).rejects.toMatchObject({ code: 'EVIDENCE_UPSTREAM_ERROR' })

    detail = 'Ollama model is not installed: qwen3:4b'
    await expect(client.extract(request)).rejects.toMatchObject({ code: 'EVIDENCE_MODEL_UNAVAILABLE' })
  })
})
