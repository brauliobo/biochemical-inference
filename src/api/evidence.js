import {
  EvidenceCandidateExtractionRequestSchema,
  EvidenceCandidateListResponseSchema,
  EvidenceCandidateResponseSchema,
  EvidenceDocumentResponseSchema,
  EvidenceHealthSchema,
  EvidenceSearchRequestSchema,
  EvidenceSearchResponseSchema
} from '../../shared/evidence-contracts.js'
import { getJson, postJson } from './core.js'

function verifyEvidenceEnvelope(payload, release) {
  if (payload.release.id !== release.id || payload.release.digest !== release.digest) {
    throw new Error('Evidence response does not match the independently verified release and digest.')
  }
  return payload
}

export async function loadEvidenceHealth(signal) {
  return getJson('/api/v3/evidence/health', EvidenceHealthSchema, signal)
}

export async function searchEvidence(release, input, signal) {
  const request = EvidenceSearchRequestSchema.parse(input)
  return verifyEvidenceEnvelope(await postJson('/api/v3/evidence/search', request, EvidenceSearchResponseSchema, { signal }), release)
}

export async function loadEvidenceDocument(release, identifier, signal) {
  return verifyEvidenceEnvelope(await getJson(`/api/v3/evidence/documents/${encodeURIComponent(identifier)}`, EvidenceDocumentResponseSchema, signal), release)
}

export async function extractEvidenceCandidate(release, input, signal) {
  const request = EvidenceCandidateExtractionRequestSchema.parse(input)
  return verifyEvidenceEnvelope(await postJson('/api/v3/evidence/candidates/extract', request, EvidenceCandidateResponseSchema, { signal }), release)
}

export async function loadEvidenceCandidates(release, signal) {
  return verifyEvidenceEnvelope(await getJson('/api/v3/evidence/candidates', EvidenceCandidateListResponseSchema, signal), release)
}

export async function loadEvidenceCandidate(release, candidateId, signal) {
  return verifyEvidenceEnvelope(await getJson(`/api/v3/evidence/candidates/${encodeURIComponent(candidateId)}`, EvidenceCandidateResponseSchema, signal), release)
}
