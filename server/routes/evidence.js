import { z } from 'zod'
import { EvidenceCandidateExtractionRequestSchema, EvidenceSearchRequestSchema } from '../../shared/evidence-contracts.js'
import { problemReply } from '../http/replies.js'
import { createRouter } from '../http/routes.js'

const EvidenceDocumentParamSchema = z.object({ identifier: z.string().min(1).max(200) }).strict()
const EvidenceCandidateParamSchema = z.object({ candidateId: z.string().regex(/^CANDIDATE:[a-f0-9]{32}$/) }).strict()

export function registerEvidenceRoutes(app, { evidence }) {
  const { get, post } = createRouter(app)

  get('/api/v3/evidence/health', {}, () => evidence.health())
  post('/api/v3/evidence/search', {
    body: EvidenceSearchRequestSchema,
    invalid: problemReply(422, 'INVALID_EVIDENCE_SEARCH', 'Evidence search parameters are invalid.')
  }, ({ body }) => evidence.search(body))
  get('/api/v3/evidence/documents/:identifier', {
    params: EvidenceDocumentParamSchema,
    invalid: problemReply(400, 'INVALID_EVIDENCE_DOCUMENT', 'Evidence document identifier is invalid.', { fieldErrors: false })
  }, ({ params }) => evidence.document(params.identifier))
  post('/api/v3/evidence/candidates/extract', {
    body: EvidenceCandidateExtractionRequestSchema,
    invalid: problemReply(422, 'INVALID_EVIDENCE_CANDIDATE', 'Candidate extraction requires unique exact spans from one document.'),
    status: 201
  }, ({ body }) => evidence.extract(body))
  get('/api/v3/evidence/candidates', {}, () => evidence.candidates())
  get('/api/v3/evidence/candidates/:candidateId', {
    params: EvidenceCandidateParamSchema,
    invalid: problemReply(400, 'INVALID_EVIDENCE_CANDIDATE_ID', 'Candidate identifier is invalid.', { fieldErrors: false })
  }, ({ params }) => evidence.candidate(params.candidateId))
}
