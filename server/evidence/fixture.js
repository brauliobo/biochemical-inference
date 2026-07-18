import { createHash } from 'node:crypto'
import {
  EVIDENCE_RANKING_EXPLANATIONS,
  EvidenceCandidateExtractionRequestSchema,
  EvidenceCandidateListResponseSchema,
  EvidenceCandidateResponseSchema,
  EvidenceDocumentResponseSchema,
  EvidenceHealthSchema,
  EvidenceSearchRequestSchema,
  EvidenceSearchResponseSchema
} from '../../shared/evidence-contracts.js'

export const FIXTURE_EVIDENCE_RELEASE = Object.freeze({
  id: 'mthfr-evidence-v1.0.0',
  schema_version: '3.0.0',
  digest: '93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701'
})

export const EVIDENCE_LICENSES = Object.freeze([
  { id: 'LICENSE:NLM-METADATA', name: 'NLM data terms and conditions', url: 'https://www.nlm.nih.gov/databases/download/terms_and_conditions.html', redistribution: 'metadata-only', attribution: 'Bibliographic metadata from PubMed; abstract and article text are not redistributed in this release.' },
  { id: 'LICENSE:CC-BY-4.0', name: 'Creative Commons Attribution 4.0 International', url: 'https://creativecommons.org/licenses/by/4.0/', redistribution: 'full-text-permitted', attribution: 'Froese et al., Nature Communications 9, 2261 (2018), CC BY 4.0; excerpts are unmodified plain-text renderings.' }
])

const documents = [
  { id: 'EVIDENCE-DOC:16769880', canonical_id: 'PMID:16769880', title: 'Human methionine synthase reductase is a molecular chaperone for human methionine synthase.', authors: ['Yamada K', 'Gravel RA', 'Toraya T', 'Matthews RG'], journal: 'Proceedings of the National Academy of Sciences of the United States of America', publication_date: '2006-06-20', publication_status: 'active', content_scope: 'metadata-only', source_ids: ['PUBMED', 'PUBTATOR'] },
  { id: 'EVIDENCE-DOC:24698160', canonical_id: 'PMID:24698160', title: 'Distinct biochemical properties of human serine hydroxymethyltransferase compared with the Plasmodium enzyme: implications for selective inhibition.', authors: ['Pinthong C', 'Maenpuen S'], journal: 'The FEBS journal', publication_date: '2014-06-01', publication_status: 'active', content_scope: 'metadata-only', source_ids: ['PUBMED', 'PUBTATOR'] },
  { id: 'EVIDENCE-DOC:29891918', canonical_id: 'PMID:29891918', title: 'Structural basis for the regulation of human 5,10-methylenetetrahydrofolate reductase by phosphorylation and S-adenosylmethionine inhibition.', authors: ['Froese DS', 'Kopec J', 'Rembeza E', 'Yue WW'], journal: 'Nature communications', publication_date: '2018-06-11', publication_status: 'active', content_scope: 'licensed-excerpts', source_ids: ['PUBMED', 'PMC', 'PUBTATOR'] }
]

const title = documents[2].title
const abstract = 'MTHFR represents a key regulatory connection between the folate and methionine cycles and undergoes allosteric inhibition by SAM.'
const support = 'Phosphorylation has been identified to affect the maximum degree of inhibition of MTHFR by SAM, whereby phosphorylated protein was found to be maximally ~80% inhibited, while phosphatase treated protein was maximally ~60% inhibited.'
const sections = [
  { id: 'SECTION:PMID-29891918-TITLE', document_id: documents[2].id, section_type: 'title', source_id: 'PUBTATOR', source_locator: 'PubTator3 BioC passage type=title offset=0', source_offset: 0, source_end: title.length, text: title, access: 'redistributable', license_id: 'LICENSE:CC-BY-4.0' },
  { id: 'SECTION:PMID-29891918-ABSTRACT', document_id: documents[2].id, section_type: 'abstract', source_id: 'PUBTATOR', source_locator: 'PubTator3 BioC passage type=abstract offset=142', source_offset: 142, source_end: 142 + abstract.length, text: abstract, access: 'redistributable', license_id: 'LICENSE:CC-BY-4.0' },
  { id: 'SECTION:PMID-29891918-RESULTS-SAM', document_id: documents[2].id, section_type: 'results', source_id: 'PMC', source_locator: 'PMC5995969 BioC section_type=RESULTS paragraph offset=17004', source_offset: 17004, source_end: 17004 + support.length, text: support, access: 'redistributable', license_id: 'LICENSE:CC-BY-4.0' }
]
const spans = [
  { id: 'SPAN:PMID-29891918-MTHFR', document_id: documents[2].id, section_id: sections[0].id, start: 45, end: 85, source_offset: 45, source_end: 85, text: '5,10-methylenetetrahydrofolate reductase', license_id: 'LICENSE:CC-BY-4.0' },
  { id: 'SPAN:PMID-29891918-RESULTS-SUPPORT', document_id: documents[2].id, section_id: sections[2].id, start: 0, end: support.length, source_offset: 17004, source_end: 17004 + support.length, text: support, license_id: 'LICENSE:CC-BY-4.0' }
]

const details = new Map(documents.map((document) => [document.id, EvidenceDocumentResponseSchema.parse({
  release: FIXTURE_EVIDENCE_RELEASE,
  document,
  identifiers: [{ id: `IDENTIFIER:PMID-${document.canonical_id.slice(5)}`, document_id: document.id, namespace: 'PMID', value: document.canonical_id.slice(5), relation: 'canonical', source_id: 'PUBMED' }],
  licenses: document.content_scope === 'licensed-excerpts' ? [EVIDENCE_LICENSES[1]] : [EVIDENCE_LICENSES[0]],
  lifecycle: [{ id: `LIFECYCLE:PMID-${document.canonical_id.slice(5)}-PUBLISHED`, document_id: document.id, event_type: 'published', occurred_at: document.publication_date, source_id: 'PUBMED', source_record_id: document.canonical_id.slice(5), note: 'PubMed publication record.' }],
  sections: document.id === documents[2].id ? sections : [],
  spans: document.id === documents[2].id ? spans : [],
  annotations: document.id === documents[2].id ? [{ id: 'ANNOTATION:PMID-29891918-MTHFR', document_id: document.id, span_id: spans[0].id, annotation_type: 'Gene', normalized_id: 'NCBIGene:4524', source_id: 'PUBTATOR', source_annotation_id: '4' }] : [],
  relations: []
})]))

function digest(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function createEvidenceFixtureClient() {
  const candidates = new Map()
  return {
    async health() {
      return EvidenceHealthSchema.parse({ status: 'ok', release: FIXTURE_EVIDENCE_RELEASE, documents: documents.length })
    },
    async search(input) {
      const request = EvidenceSearchRequestSchema.parse(input)
      const query = request.query.toLowerCase()
      const ranked = documents
        .map((document, index) => {
          const exact = [document.id.toLowerCase(), document.canonical_id.toLowerCase(), 'pmcid:pmc5995969'].includes(query) && (query !== 'pmcid:pmc5995969' || document.id === documents[2].id)
          const lexical = document.title.toLowerCase().split(/\W+/).some((term) => term.length > 3 && query.includes(term)) || (document.id === documents[2].id && /mthfr|phosphorylation|sam/.test(query))
          if (!exact && !lexical) return null
          const score_components = {}
          if (exact) score_components.exact = { rank: 1, rrf: 1 / 61 }
          if (lexical) score_components.bm25 = { rank: index + 1, raw: -(3 - index), rrf: 1 / (61 + index) }
          return { document, score: Object.values(score_components).reduce((total, item) => total + item.rrf, 0), score_components }
        })
        .filter(Boolean)
        .sort((left, right) => right.score - left.score || left.document.id.localeCompare(right.document.id))
        .slice(0, request.limit)
      return EvidenceSearchResponseSchema.parse({ release: FIXTURE_EVIDENCE_RELEASE, query: request.query, ranking: 'reciprocal-rank-fusion-v1', vector_metadata: null, explanations: EVIDENCE_RANKING_EXPLANATIONS, items: ranked })
    },
    async document(identifier) {
      const normalized = identifier.toUpperCase().replace('PMCID:PMC5995969', 'PMID:29891918')
      const document = documents.find((item) => item.id === identifier || item.canonical_id === normalized)
      if (!document) throw Object.assign(new Error(`Unknown evidence document: ${identifier}`), { statusCode: 404, code: 'EVIDENCE_NOT_FOUND' })
      return details.get(document.id)
    },
    async extract(input) {
      const request = EvidenceCandidateExtractionRequestSchema.parse(input)
      const document = details.get(request.document_id)
      const validSpanIds = new Set(document?.spans.map((span) => span.id) ?? [])
      if (!document || !request.span_ids.every((spanId) => validSpanIds.has(spanId))) {
        throw Object.assign(new Error('span_ids must be exact spans from the selected document'), { statusCode: 422, code: 'INVALID_EVIDENCE_CANDIDATE' })
      }
      const seed = JSON.stringify(request)
      const candidate = {
        id: `CANDIDATE:${digest(seed).slice(0, 32)}`,
        status: 'unreviewed',
        release_id: FIXTURE_EVIDENCE_RELEASE.id,
        release_digest: FIXTURE_EVIDENCE_RELEASE.digest,
        document_id: request.document_id,
        span_ids: request.span_ids,
        model: 'fixture-generation-model',
        model_digest: 'b'.repeat(64),
        prompt_digest: digest(`prompt:${seed}`),
        input_digest: digest(`input:${seed}`),
        output_digest: digest(`output:${seed}`),
        subject: 'MTHFR phosphorylation',
        relation: 'increases sensitivity to',
        object: 'SAM inhibition',
        unresolved_entities: ['CIP treatment context'],
        missing_context: ['cell type', 'in vivo validation']
      }
      candidates.set(candidate.id, candidate)
      return EvidenceCandidateResponseSchema.parse({ release: FIXTURE_EVIDENCE_RELEASE, candidate })
    },
    async candidates() {
      return EvidenceCandidateListResponseSchema.parse({ release: FIXTURE_EVIDENCE_RELEASE, items: [...candidates.values()].sort((left, right) => left.id.localeCompare(right.id)) })
    },
    async candidate(identifier) {
      const candidate = candidates.get(identifier)
      if (!candidate) throw Object.assign(new Error(`Unknown candidate: ${identifier}`), { statusCode: 404, code: 'EVIDENCE_NOT_FOUND' })
      return EvidenceCandidateResponseSchema.parse({ release: FIXTURE_EVIDENCE_RELEASE, candidate })
    }
  }
}
