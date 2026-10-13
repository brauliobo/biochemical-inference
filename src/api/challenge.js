import { z } from 'zod'
import {
  CHALLENGE_CSRF_HEADER,
  CHALLENGE_CSRF_VALUE,
  ChallengeDisclosureIntentSchema,
  ChallengeFreezeIntentSchema,
  ChallengeSha256Schema
} from '../../shared/challenge-contracts.js'
import {
  ChallengeArtifactSchema,
  ChallengeCommitmentViewSchema,
  ChallengeDiscoverySchema,
  ChallengeIntegritySchema,
  ChallengeReplaySchema,
  ChallengeReportSchema,
  ChallengeRunsSchema,
  ChallengeStatusSchema
} from './challenge-schemas.js'
import { createStrictClient, csrfHeaders, identityMismatch, policyError, queryString, violatesNoStore, withSignal } from './core.js'

const BASE = '/api/v11/challenge'
const mutationHeaders = csrfHeaders(CHALLENGE_CSRF_HEADER, CHALLENGE_CSRF_VALUE)
const protectedReadHeaders = { [CHALLENGE_CSRF_HEADER]: CHALLENGE_CSRF_VALUE }

const challengeRequest = createStrictClient({
  verifyFirst: true,
  verify(response) {
    if (violatesNoStore(response, 'private, no-store')) {
      throw policyError(response, 'Challenge response did not preserve the required private no-store policy.', 'CHALLENGE_CACHE_POLICY_INVALID')
    }
  }
})

const get = (path, schema, signal) => challengeRequest(path, { init: withSignal(signal), schema })
const protectedGet = (path, schema, signal) => challengeRequest(path, { init: { headers: protectedReadHeaders, ...withSignal(signal) }, schema })
const post = (path, body, schema, signal) => challengeRequest(path, {
  init: { method: 'POST', headers: mutationHeaders, body: JSON.stringify(body), ...withSignal(signal) },
  schema
})
const bind = (condition, message) => identityMismatch(condition, message, 'CHALLENGE_IDENTITY_MISMATCH')

export async function loadChallengeDiscovery(signal) {
  return get(BASE, ChallengeDiscoverySchema, signal)
}

export async function loadChallengeStatus(signal) {
  return get(`${BASE}/status`, ChallengeStatusSchema, signal)
}

export async function syncChallenge(signal) {
  return post(`${BASE}/sync`, {}, ChallengeStatusSchema, signal)
}

export async function prepareChallengeCommitment(input, signal) {
  const request = ChallengeFreezeIntentSchema.parse(input)
  const prepared = await post(`${BASE}/commitments`, request, ChallengeCommitmentViewSchema, signal)
  bind(
    prepared.frozenCommitment.nonce === request.nonce && prepared.frozenCommitment.created_at === request.createdAt,
    'Challenge commitment does not bind the requested freeze intent.'
  )
  return prepared
}

export async function discloseChallengeCommitment(commitmentDigest, signal) {
  const request = ChallengeDisclosureIntentSchema.parse({ commitmentDigest })
  const report = await post(`${BASE}/commitments/${encodeURIComponent(request.commitmentDigest)}/disclose`, request, ChallengeReportSchema, signal)
  bind(report.commitment_receipt.commitment_digest === request.commitmentDigest, 'Challenge disclosure does not bind the requested commitment digest.')
  return report
}

export async function loadChallengeRuns(limit = 20, signal) {
  const parsedLimit = z.number().int().min(1).max(50).parse(limit)
  return protectedGet(`${BASE}/runs?${queryString({ limit: parsedLimit })}`, ChallengeRunsSchema, signal)
}

export async function loadChallengeReport(resultDigest, signal) {
  const digest = ChallengeSha256Schema.parse(resultDigest)
  const report = await protectedGet(`${BASE}/reports/${encodeURIComponent(digest)}`, ChallengeReportSchema, signal)
  bind(report.producer_result.result_digest === digest, 'Challenge report does not bind the requested result digest.')
  return report
}

export async function replayChallengeReport(resultDigest, signal) {
  const digest = ChallengeSha256Schema.parse(resultDigest)
  const replay = await post(`${BASE}/reports/${encodeURIComponent(digest)}/replay`, {}, ChallengeReplaySchema, signal)
  bind(replay.report.producer_result.result_digest === digest, 'Challenge replay does not bind the requested result digest.')
  return replay
}

export async function loadChallengeArtifact(artifactDigest, signal) {
  const digest = ChallengeSha256Schema.parse(artifactDigest)
  const artifact = await protectedGet(`${BASE}/artifacts/${encodeURIComponent(digest)}`, ChallengeArtifactSchema, signal)
  bind(artifact.artifactDigest === digest, 'Challenge artifact does not bind the requested digest.')
  return artifact
}

export async function verifyChallengeIntegrity(signal) {
  return protectedGet(`${BASE}/integrity`, ChallengeIntegritySchema, signal)
}
