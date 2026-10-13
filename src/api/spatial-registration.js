import {
  SPATIAL_REGISTRATION_CSRF_HEADER,
  SPATIAL_REGISTRATION_CSRF_VALUE,
  SPATIAL_REGISTRATION_PINS,
  SPATIAL_REGISTRATION_RECORD_SCHEMAS,
  SPATIAL_REGISTRATION_RECORD_TYPES,
  SPATIAL_REGISTRATION_RIGHTS_LINK,
  SpatialRegistrationChunkSchema,
  SpatialRegistrationDiscoverySchema,
  SpatialRegistrationIntegritySchema,
  SpatialRegistrationLocalChunkPageSchema,
  SpatialRegistrationLocalRecordPageSchema,
  SpatialRegistrationOfflineResponseSchema,
  SpatialRegistrationResidualOverlapResponseSchema,
  SpatialRegistrationStatusSchema,
  SpatialRegistrationTransformRequestSchema,
  SpatialRegistrationTransformResponseSchema
} from '../../shared/spatial-registration-contracts.js'
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

const BASE = '/api/v14/spatial-registration'
const mutationHeaders = csrfHeaders(SPATIAL_REGISTRATION_CSRF_HEADER, SPATIAL_REGISTRATION_CSRF_VALUE)
const CACHE_POLICY_INVALID = 'SPATIAL_REGISTRATION_CACHE_POLICY_INVALID'

const jsonRequest = createStrictClient({
  verify(response, { immutable = false }) {
    if (immutable) {
      const { headers } = response
      if (headers.get('cache-control') !== IMMUTABLE_CACHE || headers.get('link') !== SPATIAL_REGISTRATION_RIGHTS_LINK || headers.get('x-release-id') !== SPATIAL_REGISTRATION_PINS.releaseId || headers.get('x-release-digest') !== SPATIAL_REGISTRATION_PINS.releaseDigest) {
        throw policyError(response, 'Goal 14 registration metadata did not preserve its release and rights identity.', CACHE_POLICY_INVALID)
      }
    } else if (violatesNoStore(response, 'no-store')) {
      throw policyError(response, 'Goal 14 registration mutable response did not preserve the required no-store policy.', CACHE_POLICY_INVALID)
    }
  }
})

const get = (path, schema, signal, options) => jsonRequest(path, { init: withSignal(signal), schema, ...options })
const post = (path, body, schema, signal) => jsonRequest(path, {
  init: { method: 'POST', headers: mutationHeaders, body: JSON.stringify(body), ...withSignal(signal) },
  schema
})

export async function loadSpatialRegistrationDiscovery(signal) {
  return get(BASE, SpatialRegistrationDiscoverySchema, signal)
}

export async function loadSpatialRegistrationStatus(signal) {
  return get(`${BASE}/status`, SpatialRegistrationStatusSchema, signal)
}

export async function syncSpatialRegistration(signal) {
  return post(`${BASE}/sync`, {}, SpatialRegistrationStatusSchema, signal)
}

export async function loadSpatialRegistrationRecords(recordType, signal) {
  if (!SPATIAL_REGISTRATION_RECORD_TYPES.includes(recordType)) throw new TypeError(`Unknown spatial-registration record type: ${recordType}.`)
  const page = await get(`${BASE}/records/${encodeURIComponent(recordType)}`, SpatialRegistrationLocalRecordPageSchema, signal, { immutable: true })
  return { ...page, items: page.items.map((item) => SPATIAL_REGISTRATION_RECORD_SCHEMAS[recordType].parse(item)) }
}

export async function loadSpatialRegistrationWorkspace(signal) {
  const pages = await Promise.all(SPATIAL_REGISTRATION_RECORD_TYPES.map((recordType) => loadSpatialRegistrationRecords(recordType, signal)))
  return Object.fromEntries(pages.map((page) => [page.recordType, page.items]))
}

export async function loadSpatialRegistrationChunkInventory(arrayId, signal) {
  return collectOffsetPages(
    (offset) => get(`${BASE}/chunks?${queryString({ array_id: arrayId, offset, limit: 100 })}`, SpatialRegistrationLocalChunkPageSchema, signal, { immutable: true }),
    {
      matches: (page, offset) => page.arrayId === arrayId && page.offset === offset,
      mismatch: { message: 'Goal 14 registration inventory does not bind the selected array and offset.', code: 'SPATIAL_REGISTRATION_IDENTITY_MISMATCH' },
      incomplete: { message: 'Goal 14 registration inventory ended before its declared total.', code: 'SPATIAL_REGISTRATION_INVENTORY_INCOMPLETE' }
    }
  )
}

export async function loadSpatialRegistrationChunk(input, signal) {
  const descriptor = SpatialRegistrationChunkSchema.parse(input)
  const [z, y, x] = descriptor.grid_zyx
  return loadVerifiedChunk(descriptor, {
    path: `${BASE}/chunks/${encodeURIComponent(descriptor.array_id)}/${z}/${y}/${x}`,
    extraHeaders: {
      link: SPATIAL_REGISTRATION_RIGHTS_LINK,
      'x-release-id': SPATIAL_REGISTRATION_PINS.releaseId,
      'x-release-digest': SPATIAL_REGISTRATION_PINS.releaseDigest,
      'x-level': '0'
    },
    codePrefix: 'SPATIAL_REGISTRATION',
    signal,
    messages: {
      request: 'Goal 14 registration chunk request failed',
      identity: 'Goal 14 registration chunk response does not bind its release, rights, array, grid, codec, and digest identities.',
      encoded: 'Goal 14 registration encoded chunk hash verification failed.',
      decoded: 'Goal 14 registration decoded chunk hash verification failed.',
      codec: 'This browser cannot verify the pinned registration gzip codec.'
    }
  })
}

export async function recomputeSpatialRegistrationResidualOverlap(signal) {
  return post(`${BASE}/residual-overlap`, {}, SpatialRegistrationResidualOverlapResponseSchema, signal)
}

export async function transformSpatialRegistrationPoint(input, signal) {
  return post(`${BASE}/transform`, SpatialRegistrationTransformRequestSchema.parse(input), SpatialRegistrationTransformResponseSchema, signal)
}

export async function completeSpatialRegistrationOffline(signal) {
  return post(`${BASE}/offline-completion`, {}, SpatialRegistrationOfflineResponseSchema, signal)
}

export async function verifySpatialRegistrationIntegrity(signal) {
  return get(`${BASE}/integrity`, SpatialRegistrationIntegritySchema, signal)
}
