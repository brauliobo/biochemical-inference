import { z } from 'zod'
import {
  APAP_CONTRACT_VERSION,
  APAP_ENGINE_VERSION,
  APAP_EQUATION_SET_ID,
  APAP_MODEL_ID,
  APAP_MODEL_VERSION,
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  APAP_WARNING,
  ApapRunRequestSchema
} from '../../shared/apap-contracts.js'
import { RunIdParamSchema } from '../http/params.js'
import { notFound, problemReply } from '../http/replies.js'
import { createRouter } from '../http/routes.js'

const ApapReleaseParamSchema = z.object({ releaseId: z.literal(APAP_RELEASE_ID) }).strict()

// Release sub-resources: path segment -> client method.
const RELEASE_VIEWS = {
  contexts: 'contexts',
  parameters: 'parameters',
  protocols: 'protocols',
  observations: 'observations',
  assumptions: 'assumptions',
  limitations: 'limitations',
  'validation-matrix': 'validationMatrix'
}

const releaseNotFound = (reply) => notFound(reply, 'APAP_RELEASE_NOT_FOUND', 'Only the pinned APAP benchmark release is supported.')

export function registerApapRoutes(app, { apap, apapRuns }) {
  const { get, post } = createRouter(app)
  const releaseGuard = (request, reply) => ApapReleaseParamSchema.safeParse(request.params).success ? true : releaseNotFound(reply)

  get('/api/v4/apap', {}, () => ({
    contractVersion: APAP_CONTRACT_VERSION,
    releaseId: APAP_RELEASE_ID,
    releaseDigest: APAP_RELEASE_DIGEST,
    modelId: APAP_MODEL_ID,
    modelVersion: APAP_MODEL_VERSION,
    equationSetId: APAP_EQUATION_SET_ID,
    engineVersion: APAP_ENGINE_VERSION,
    routes: {
      release: `/api/v4/apap/releases/${APAP_RELEASE_ID}`,
      contexts: `/api/v4/apap/releases/${APAP_RELEASE_ID}/contexts`,
      parameters: `/api/v4/apap/releases/${APAP_RELEASE_ID}/parameters`,
      protocols: `/api/v4/apap/releases/${APAP_RELEASE_ID}/protocols`,
      observations: `/api/v4/apap/releases/${APAP_RELEASE_ID}/observations`,
      assumptions: `/api/v4/apap/releases/${APAP_RELEASE_ID}/assumptions`,
      limitations: `/api/v4/apap/releases/${APAP_RELEASE_ID}/limitations`,
      validationMatrix: `/api/v4/apap/releases/${APAP_RELEASE_ID}/validation-matrix`,
      runs: '/api/v4/apap/runs'
    },
    warning: APAP_WARNING
  }))
  get('/api/v4/apap/releases', {}, () => apap.catalog())
  get('/api/v4/apap/releases/:releaseId', {}, (_input, request, reply) => releaseGuard(request, reply) === true ? apap.detail() : reply)
  for (const [segment, method] of Object.entries(RELEASE_VIEWS)) {
    get(`/api/v4/apap/releases/:releaseId/${segment}`, {}, (_input, request, reply) => releaseGuard(request, reply) === true ? apap[method]() : reply)
  }

  post('/api/v4/apap/runs', {
    body: ApapRunRequestSchema,
    invalid: problemReply(422, 'INVALID_APAP_RUN', 'APAP run controls are invalid or outside the pinned benchmark.'),
    status: 201
  }, ({ body }) => apapRuns.create(body))
  get('/api/v4/apap/runs/:runId', {
    params: RunIdParamSchema,
    invalid: problemReply(400, 'INVALID_APAP_RUN_ID', 'APAP run identifier is invalid.', { fieldErrors: false })
  }, ({ params }, _request, reply) => apapRuns.get(params.runId) ?? notFound(reply, 'APAP_RUN_NOT_FOUND', 'APAP run is not available.'))
}
