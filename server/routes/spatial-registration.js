import {
  SPATIAL_REGISTRATION_CSRF_HEADER,
  SPATIAL_REGISTRATION_CSRF_VALUE,
  SPATIAL_REGISTRATION_PINS,
  SPATIAL_REGISTRATION_RIGHTS_LINK,
  SpatialRegistrationChunkParamSchema,
  SpatialRegistrationChunkQuerySchema,
  SpatialRegistrationEmptySchema,
  SpatialRegistrationRecordTypeSchema,
  SpatialRegistrationTransformRequestSchema
} from '../../shared/spatial-registration-contracts.js'
import { createCsrfGuard } from '../http/guards.js'
import { noStore, parseOrReply, problemReply, sendProblem } from '../http/replies.js'
import { createRouter } from '../http/routes.js'
import { SpatialRegistrationRequestError } from '../spatial-registration/service.js'

const Empty = SpatialRegistrationEmptySchema
const invalidSpatialRegistration = problemReply(422, 'INVALID_SPATIAL_REGISTRATION_REQUEST', 'Goal 14 registration request does not match the strict bounded contract.', { noStore: true })

const immutable = (reply) => reply.headers({
  'cache-control': 'public, max-age=31536000, immutable',
  link: SPATIAL_REGISTRATION_RIGHTS_LINK,
  'x-release-id': SPATIAL_REGISTRATION_PINS.releaseId,
  'x-release-digest': SPATIAL_REGISTRATION_PINS.releaseDigest
})

export function registerSpatialRegistrationRoutes(app, { spatialRegistration, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidSpatialRegistration)
  const mutation = {
    preHandler: createCsrfGuard(allowedOrigins, SPATIAL_REGISTRATION_CSRF_HEADER, SPATIAL_REGISTRATION_CSRF_VALUE,
      () => new SpatialRegistrationRequestError('SPATIAL_REGISTRATION_CSRF_REJECTED', 'Goal 14 registration cache and transform intents require the startup-allowlisted browser origin and CSRF header.', 403))
  }
  // Mutable (no-store) endpoints validate an empty query (and, for POST, an empty or specific body), then run `call`.
  const mutableGet = (path, call) => get(path, { query: Empty }, (_input, _request, reply) => { noStore(reply); return call() })
  const mutablePost = (path, call, body) => post(path, { query: Empty, ...(body ? { body } : { bodyOrEmpty: Empty }), options: mutation }, ({ body: parsed }, request, reply) => {
    noStore(reply)
    return call(request.raw.signal, parsed)
  })

  mutableGet('/api/v14/spatial-registration', () => spatialRegistration.discovery())
  mutableGet('/api/v14/spatial-registration/status', () => spatialRegistration.status())
  mutablePost('/api/v14/spatial-registration/sync', (signal) => spatialRegistration.sync(signal))
  app.get('/api/v14/spatial-registration/records/:recordType', async (request, reply) => {
    if (parseOrReply(reply, Empty, request.query, invalidSpatialRegistration) === undefined) return reply
    const recordType = parseOrReply(reply, SpatialRegistrationRecordTypeSchema, request.params.recordType, invalidSpatialRegistration)
    if (recordType === undefined) return reply
    immutable(reply)
    return spatialRegistration.recordPage(recordType)
  })
  get('/api/v14/spatial-registration/chunks', { query: SpatialRegistrationChunkQuerySchema }, ({ query }, _request, reply) => {
    immutable(reply)
    return spatialRegistration.chunkInventory({ arrayId: query.array_id ?? null, offset: query.offset, limit: query.limit })
  })
  app.get('/api/v14/spatial-registration/chunks/:arrayId/:z/:y/:x', async (request, reply) => {
    if (request.headers.range || Object.keys(request.query).length > 0) {
      reply.headers({ 'accept-ranges': 'none', 'cache-control': 'no-store' })
      return sendProblem(reply, 416, 'SPATIAL_REGISTRATION_RANGE_REJECTED', 'Range Not Satisfiable', 'Goal 14 registration chunks are atomic and reject ranges and query parameters.')
    }
    const params = parseOrReply(reply, SpatialRegistrationChunkParamSchema, request.params, invalidSpatialRegistration)
    if (!params) return reply
    const selected = await spatialRegistration.chunk(params.arrayId, [params.z, params.y, params.x], request.raw.signal)
    const descriptor = selected.descriptor
    return immutable(reply).headers({
      'accept-ranges': 'none',
      'content-length': descriptor.encoded_bytes,
      etag: `"sha256:${descriptor.encoded_sha256}"`,
      'x-content-sha256': descriptor.encoded_sha256,
      'x-decoded-sha256': descriptor.decoded_sha256,
      'x-array-id': descriptor.array_id,
      'x-level': '0',
      'x-chunk-grid': descriptor.grid_zyx.join('.'),
      'x-cache-source': selected.source
    }).type(descriptor.media_type).send(selected.bytes)
  })
  mutablePost('/api/v14/spatial-registration/residual-overlap', (signal) => spatialRegistration.recomputeResidualOverlap(signal))
  mutablePost('/api/v14/spatial-registration/transform', (signal, body) => spatialRegistration.transform(body, signal), SpatialRegistrationTransformRequestSchema)
  mutablePost('/api/v14/spatial-registration/offline-completion', (signal) => spatialRegistration.completeOffline(signal))
  mutableGet('/api/v14/spatial-registration/integrity', () => spatialRegistration.integrity())
}
