import {
  CHALLENGE_CSRF_HEADER,
  CHALLENGE_CSRF_VALUE,
  CHALLENGE_REQUEST_BODY_LIMIT,
  ChallengeArtifactParamSchema,
  ChallengeCommitmentParamSchema,
  ChallengeDisclosureIntentSchema,
  ChallengeEmptyObjectSchema,
  ChallengeFreezeIntentSchema,
  ChallengeReportParamSchema,
  ChallengeRunListQuerySchema
} from '../../shared/challenge-contracts.js'
import { ChallengeRequestError } from '../challenge/service.js'
import { conflict, problemReply } from '../http/replies.js'
import { createRouter } from '../http/routes.js'

const Empty = ChallengeEmptyObjectSchema
const invalidChallenge = problemReply(422, 'INVALID_CHALLENGE_REQUEST', 'Goal 13 request does not match the strict v1 contract.')

// Browsers may omit Origin on same-origin GETs, so a GET falls back to the Referer's origin.
function requestOrigin(request) {
  if (request.headers.origin) return request.headers.origin
  if (request.method !== 'GET' || !request.headers.referer) return null
  try {
    const referer = new URL(request.headers.referer)
    return ['http:', 'https:'].includes(referer.protocol) && !referer.username && !referer.password ? referer.origin : null
  } catch {
    return null
  }
}

export function registerChallengeRoutes(app, { challenge, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidChallenge)
  const requireAccess = async (request) => {
    if (!allowedOrigins.has(requestOrigin(request)) || request.headers[CHALLENGE_CSRF_HEADER] !== CHALLENGE_CSRF_VALUE) {
      throw new ChallengeRequestError('CHALLENGE_CSRF_REJECTED', 'Goal 13 protected access requires a startup-allowlisted browser origin and CSRF header.', 403)
    }
  }
  const mutation = { bodyLimit: CHALLENGE_REQUEST_BODY_LIMIT, preHandler: requireAccess }
  const protectedRead = { preHandler: requireAccess }

  get('/api/v11/challenge', { query: Empty }, () => challenge.discovery())
  get('/api/v11/challenge/status', { query: Empty }, () => challenge.status())
  post('/api/v11/challenge/sync', { query: Empty, bodyOrEmpty: Empty, options: mutation }, (_input, request) => challenge.sync(request.raw.signal))
  post('/api/v11/challenge/commitments', { query: Empty, body: ChallengeFreezeIntentSchema, options: mutation, status: 201 },
    ({ body }, request) => challenge.prepare(body, request.raw.signal))
  post('/api/v11/challenge/commitments/:commitmentDigest/disclose', { query: Empty, params: ChallengeCommitmentParamSchema, body: ChallengeDisclosureIntentSchema, options: mutation },
    async ({ params, body }, request, reply) => {
      if (body.commitmentDigest !== params.commitmentDigest) return conflict(reply, 'CHALLENGE_IDENTITY_MISMATCH', 'Goal 13 commitment path and body identities differ.')
      return reply.status(201).send(await challenge.disclose(body, request.raw.signal))
    })
  get('/api/v11/challenge/runs', { query: ChallengeRunListQuerySchema, options: protectedRead }, ({ query }) => challenge.listRuns(query.limit))
  get('/api/v11/challenge/reports/:resultDigest', { query: Empty, params: ChallengeReportParamSchema, options: protectedRead }, ({ params }) => challenge.report(params.resultDigest))
  post('/api/v11/challenge/reports/:resultDigest/replay', { query: Empty, bodyOrEmpty: Empty, params: ChallengeReportParamSchema, options: mutation }, ({ params }) => challenge.replay(params.resultDigest))
  get('/api/v11/challenge/artifacts/:artifactDigest', { query: Empty, params: ChallengeArtifactParamSchema, options: protectedRead }, ({ params }) => challenge.artifact(params.artifactDigest))
  get('/api/v11/challenge/integrity', { query: Empty, options: protectedRead }, () => challenge.integrity())
}
