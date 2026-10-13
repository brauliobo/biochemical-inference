import {
  MEASURED_SPATIAL_CSRF_HEADER,
  MEASURED_SPATIAL_CSRF_VALUE,
  MEASURED_SPATIAL_PINS,
  MeasuredSpatialChunkParamSchema,
  MeasuredSpatialChunkQuerySchema,
  MeasuredSpatialEmptySchema,
  MeasuredSpatialRecordTypeSchema
} from '../../shared/measured-spatial-contracts.js'
import { createCsrfGuard } from '../http/guards.js'
import { noStore, parseOrReply, problemReply, sendProblem } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'
import { MeasuredSpatialRequestError } from '../measured-spatial/service.js'

const Empty = MeasuredSpatialEmptySchema
const RecordParamSchema = paramSchema('recordType', MeasuredSpatialRecordTypeSchema)
const invalidMeasuredSpatial = problemReply(422, 'INVALID_MEASURED_SPATIAL_REQUEST', 'Goal 14 request does not match the strict bounded measured-spatial contract.', { noStore: true })

const mutable = (reply) => noStore(reply)
const immutable = (reply) => reply.headers({
  'cache-control': 'public, max-age=31536000, immutable',
  'x-release-id': MEASURED_SPATIAL_PINS.releaseId,
  'x-release-digest': MEASURED_SPATIAL_PINS.releaseDigest
})

export function registerMeasuredSpatialRoutes(app, { measuredSpatial, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidMeasuredSpatial)
  const mutation = {
    preHandler: createCsrfGuard(allowedOrigins, MEASURED_SPATIAL_CSRF_HEADER, MEASURED_SPATIAL_CSRF_VALUE,
      () => new MeasuredSpatialRequestError('MEASURED_SPATIAL_CSRF_REJECTED', 'Goal 14 cache mutation requires a startup-allowlisted browser origin and CSRF header.', 403))
  }
  // Mutable (no-store) endpoints validate an empty query, then run `call`.
  const mutableGet = (path, call) => get(path, { query: Empty }, (_input, _request, reply) => { mutable(reply); return call() })
  const mutablePost = (path, call) => post(path, { query: Empty, bodyOrEmpty: Empty, options: mutation }, (_input, request, reply) => { mutable(reply); return call(request.raw.signal) })

  mutableGet('/api/v12/measured-spatial', () => measuredSpatial.discovery())
  mutableGet('/api/v12/measured-spatial/status', () => measuredSpatial.status())
  mutablePost('/api/v12/measured-spatial/sync', (signal) => measuredSpatial.sync(signal))
  get('/api/v12/measured-spatial/records/:recordType', { query: Empty, params: RecordParamSchema }, ({ params }, _request, reply) => {
    immutable(reply)
    return measuredSpatial.recordPage(params.recordType)
  })
  get('/api/v12/measured-spatial/chunks', { query: MeasuredSpatialChunkQuerySchema }, ({ query }, _request, reply) => {
    immutable(reply)
    return measuredSpatial.chunkInventory({ arrayId: query.array_id ?? null, level: query.level ?? null, offset: query.offset, limit: query.limit })
  })
  app.get('/api/v12/measured-spatial/chunks/:arrayId/:level/:z/:y/:x', async (request, reply) => {
    if (request.headers.range || Object.keys(request.query).length > 0) {
      reply.headers({ 'accept-ranges': 'none', 'cache-control': 'no-store' })
      return sendProblem(reply, 416, 'MEASURED_SPATIAL_RANGE_REJECTED', 'Range Not Satisfiable', 'Goal 14 chunks are atomic and do not accept ranges or query parameters.')
    }
    const params = parseOrReply(reply, MeasuredSpatialChunkParamSchema, request.params, invalidMeasuredSpatial)
    if (!params) return reply
    const selected = await measuredSpatial.chunk(params.arrayId, params.level, [params.z, params.y, params.x], request.raw.signal)
    const descriptor = selected.descriptor
    return immutable(reply).headers({
      'accept-ranges': 'none',
      'content-length': descriptor.encoded_bytes,
      etag: `"sha256:${descriptor.encoded_sha256}"`,
      'x-content-sha256': descriptor.encoded_sha256,
      'x-decoded-sha256': descriptor.decoded_sha256,
      'x-array-id': descriptor.array_id,
      'x-level': descriptor.level,
      'x-chunk-grid': descriptor.grid_zyx.join('.'),
      'x-cache-source': selected.source
    }).type(descriptor.media_type).send(selected.bytes)
  })
  mutablePost('/api/v12/measured-spatial/offline-completion', (signal) => measuredSpatial.completeOffline(signal))
  mutableGet('/api/v12/measured-spatial/integrity', () => measuredSpatial.integrity())
}
