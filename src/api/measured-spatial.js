import {
  MEASURED_SPATIAL_CSRF_HEADER,
  MEASURED_SPATIAL_CSRF_VALUE,
  MEASURED_SPATIAL_PINS,
  MEASURED_SPATIAL_RECORD_SCHEMAS,
  MEASURED_SPATIAL_RECORD_TYPES,
  MeasuredSpatialChunkSchema,
  MeasuredSpatialDiscoverySchema,
  MeasuredSpatialIntegritySchema,
  MeasuredSpatialLocalChunkPageSchema,
  MeasuredSpatialLocalRecordPageSchema,
  MeasuredSpatialOfflineCompletionSchema,
  MeasuredSpatialStatusSchema
} from '../../shared/measured-spatial-contracts.js'
import { loadVerifiedChunk } from './chunks.js'
import {
  IMMUTABLE_CACHE,
  collectOffsetPages,
  createStrictClient,
  csrfHeaders,
  policyError,
  queryString,
  violatesNoStore,
  withSignal
} from './core.js'

const BASE = '/api/v12/measured-spatial'
const mutationHeaders = csrfHeaders(MEASURED_SPATIAL_CSRF_HEADER, MEASURED_SPATIAL_CSRF_VALUE)
const CACHE_POLICY_INVALID = 'MEASURED_SPATIAL_CACHE_POLICY_INVALID'

const jsonRequest = createStrictClient({
  verify(response, { immutable = false }) {
    if (immutable) {
      const { headers } = response
      if (headers.get('cache-control') !== IMMUTABLE_CACHE || headers.get('x-release-id') !== MEASURED_SPATIAL_PINS.releaseId || headers.get('x-release-digest') !== MEASURED_SPATIAL_PINS.releaseDigest) {
        throw policyError(response, 'Goal 14 metadata did not preserve the exact release-bound immutable cache identity.', CACHE_POLICY_INVALID)
      }
    } else if (violatesNoStore(response, 'no-store')) {
      throw policyError(response, 'Goal 14 mutable status did not preserve the required no-store policy.', CACHE_POLICY_INVALID)
    }
  }
})

const get = (path, schema, signal, options) => jsonRequest(path, { init: withSignal(signal), schema, ...options })
const post = (path, body, schema, signal) => jsonRequest(path, {
  init: { method: 'POST', headers: mutationHeaders, body: JSON.stringify(body), ...withSignal(signal) },
  schema
})

export async function loadMeasuredSpatialDiscovery(signal) {
  return get(BASE, MeasuredSpatialDiscoverySchema, signal)
}

export async function loadMeasuredSpatialStatus(signal) {
  return get(`${BASE}/status`, MeasuredSpatialStatusSchema, signal)
}

export async function syncMeasuredSpatial(signal) {
  return post(`${BASE}/sync`, {}, MeasuredSpatialStatusSchema, signal)
}

export async function loadMeasuredSpatialRecords(recordType, signal) {
  if (!MEASURED_SPATIAL_RECORD_TYPES.includes(recordType)) throw new TypeError(`Unknown measured-spatial record type: ${recordType}.`)
  const page = await get(`${BASE}/records/${encodeURIComponent(recordType)}`, MeasuredSpatialLocalRecordPageSchema, signal, { immutable: true })
  return { ...page, items: page.items.map((item) => MEASURED_SPATIAL_RECORD_SCHEMAS[recordType].parse(item)) }
}

export async function loadMeasuredSpatialWorkspace(signal) {
  const pages = await Promise.all(MEASURED_SPATIAL_RECORD_TYPES.map((recordType) => loadMeasuredSpatialRecords(recordType, signal)))
  return Object.fromEntries(pages.map((page) => [page.recordType, page.items]))
}

export async function loadMeasuredSpatialChunkInventory(arrayId, level, signal) {
  return collectOffsetPages(
    (offset) => get(`${BASE}/chunks?${queryString({ array_id: arrayId, level, offset, limit: 100 })}`, MeasuredSpatialLocalChunkPageSchema, signal, { immutable: true }),
    {
      matches: (page, offset) => page.arrayId === arrayId && page.level === level && page.offset === offset,
      mismatch: { message: 'Goal 14 chunk inventory page does not bind the selected array, level, and offset.', code: 'MEASURED_SPATIAL_IDENTITY_MISMATCH' },
      incomplete: { message: 'Goal 14 chunk inventory ended before its declared total.', code: 'MEASURED_SPATIAL_INVENTORY_INCOMPLETE' }
    }
  )
}

export async function loadMeasuredSpatialChunk(input, signal) {
  const descriptor = MeasuredSpatialChunkSchema.parse(input)
  const [z, y, x] = descriptor.grid_zyx
  return loadVerifiedChunk(descriptor, {
    path: `${BASE}/chunks/${encodeURIComponent(descriptor.array_id)}/${descriptor.level}/${z}/${y}/${x}`,
    extraHeaders: {
      'x-release-id': MEASURED_SPATIAL_PINS.releaseId,
      'x-release-digest': MEASURED_SPATIAL_PINS.releaseDigest,
      'x-level': String(descriptor.level)
    },
    codePrefix: 'MEASURED_SPATIAL',
    signal,
    messages: {
      request: 'Goal 14 chunk request failed',
      identity: 'Goal 14 chunk response does not bind the exact release, array, level, grid, codec, or digest identities.',
      encoded: 'Goal 14 encoded chunk hash verification failed.',
      decoded: 'Goal 14 decoded chunk hash verification failed.',
      codec: 'This browser cannot verify the pinned gzip chunk codec.'
    }
  })
}

export async function completeMeasuredSpatialOffline(signal) {
  return post(`${BASE}/offline-completion`, {}, MeasuredSpatialOfflineCompletionSchema, signal)
}

export async function verifyMeasuredSpatialIntegrity(signal) {
  return get(`${BASE}/integrity`, MeasuredSpatialIntegritySchema, signal)
}
