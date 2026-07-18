import { createHash } from 'node:crypto'
import {
  SPATIAL_MAX_CONTENT_BYTES,
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetsSchema,
  SpatialCatalogSchema,
  SpatialDescriptorsSchema,
  SpatialDetailSchema,
  SpatialInventorySchema,
  SpatialMappingsSchema,
  SpatialSpacesSchema,
  SpatialStructuresSchema,
  SpatialTransformsSchema
} from '../../shared/spatial-contracts.js'
import { createSpatialFixtureClient, FIXTURE_SPATIAL_RELEASE, PINNED_SPATIAL_TRANSFORMS } from './fixture.js'

export const DEFAULT_SPATIAL_URL = 'http://127.0.0.1:8000'
const TRANSFORMS_FILE_DIGEST = 'adf0a71f8469f3878523150749fd1aff3e80189ead6e0142ae7a6dfcb0fb9159'

export class SpatialCompatibilityError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'SpatialCompatibilityError'
    this.statusCode = options.statusCode ?? 409
    this.code = options.code ?? 'SPATIAL_INCOMPATIBLE'
  }
}

function queryString(values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) if (value) query.set(key, value)
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ''
}

function canonicalDigest(value) {
  const sort = (item) => Array.isArray(item)
    ? item.map(sort)
    : item && typeof item === 'object'
      ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, sort(item[key])]))
      : item
  return createHash('sha256').update(JSON.stringify(sort(value))).digest('hex')
}

export function createSpatialClient(env = process.env) {
  if (env.BIOCHEMICAL_SPATIAL_USE_FIXTURE === 'true' || env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') return createSpatialFixtureClient()

  const baseUrl = (env.BIOCHEMICAL_SPATIAL_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_SPATIAL_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_SPATIAL_RELEASE_ID ?? SPATIAL_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_SPATIAL_EXPECTED_DIGEST ?? SPATIAL_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_SPATIAL_TIMEOUT_MS ?? 5000)
  if (releaseId !== SPATIAL_RELEASE_ID) throw new SpatialCompatibilityError(`Only ${SPATIAL_RELEASE_ID} is supported`)
  if (expectedDigest !== SPATIAL_RELEASE_DIGEST) throw new SpatialCompatibilityError(`Configured spatial digest must equal the trusted ${SPATIAL_RELEASE_ID} digest`)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new SpatialCompatibilityError('BIOCHEMICAL_SPATIAL_TIMEOUT_MS must be positive')
  const base = `/api/spatial/v1/releases/${encodeURIComponent(releaseId)}`

  async function request(path, options = {}) {
    try {
      const signal = options.signal ? AbortSignal.any([options.signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: options.accept ?? 'application/json', ...options.headers }, redirect: 'error', signal })
      if (!response.ok && !options.allowedStatuses?.includes(response.status)) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 503
        throw new SpatialCompatibilityError(`Spatial service returned ${response.status} for ${path}`, { statusCode, code: response.status === 404 ? 'SPATIAL_NOT_FOUND' : 'SPATIAL_UPSTREAM_ERROR' })
      }
      return response
    } catch (error) {
      if (error instanceof SpatialCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new SpatialCompatibilityError(`Spatial service timed out after ${timeoutMs} ms for ${path}`, { statusCode: 503, code: 'SPATIAL_TIMEOUT' })
      throw new SpatialCompatibilityError(`Spatial service is unavailable for ${path}`, { statusCode: 503, code: 'SPATIAL_UNAVAILABLE' })
    }
  }

  async function fetchJson(path, signal) {
    const response = await request(path, { signal })
    return response.json().catch(() => { throw new SpatialCompatibilityError(`Spatial service returned non-JSON metadata for ${path}`) })
  }

  async function catalog(signal) {
    const parsed = SpatialCatalogSchema.safeParse(await fetchJson('/api/spatial/v1/releases', signal))
    if (!parsed.success || parsed.data.releases[0]?.release_digest !== expectedDigest) throw new SpatialCompatibilityError('Spatial catalog does not contain the trusted release and digest')
    return parsed.data
  }

  function verifyEnvelope(parsed, description) {
    if (!parsed.success) throw new SpatialCompatibilityError(`Spatial ${description} schema is incompatible with 1.0.0`)
    if (parsed.data.release.id !== releaseId || parsed.data.release.digest !== expectedDigest) throw new SpatialCompatibilityError(`Spatial ${description} does not match the pinned release and digest`)
    return parsed.data
  }

  async function detail(signal) {
    await catalog(signal)
    const parsed = SpatialDetailSchema.safeParse(await fetchJson(base, signal))
    const payload = verifyEnvelope(parsed, 'release detail')
    const digestPayload = { ...payload.manifest }
    delete digestPayload.release_digest
    if (canonicalDigest(digestPayload) !== expectedDigest) throw new SpatialCompatibilityError('Spatial canonical manifest digest does not match the trusted release digest')
    const transformsFile = payload.manifest.files.find((file) => file.record_type === 'transforms')
    if (transformsFile?.sha256 !== TRANSFORMS_FILE_DIGEST) throw new SpatialCompatibilityError('Spatial transform metadata is not the pinned transform closure')
    return payload
  }

  async function verified(path, schema, description) {
    await catalog()
    return verifyEnvelope(schema.safeParse(await fetchJson(`${base}${path}`)), description)
  }

  async function inventory() {
    const payload = await detail()
    return SpatialInventorySchema.parse({ release: payload.release, items: payload.inventory })
  }

  return {
    catalog,
    detail,
    async structures(taxonId) { return verified(`/structures${queryString({ taxon_id: taxonId })}`, SpatialStructuresSchema, 'structures') },
    async spaces(taxonId) { return verified(`/spaces${queryString({ taxon_id: taxonId })}`, SpatialSpacesSchema, 'spaces') },
    async transforms(taxonId) {
      const payload = await detail()
      return SpatialTransformsSchema.parse({ release: payload.release, items: PINNED_SPATIAL_TRANSFORMS.filter((item) => !taxonId || item.taxon_id === taxonId) })
    },
    async assets(query = {}) { return verified(`/assets${queryString({ taxon_id: query.taxonId, structure_id: query.structureId, asset_type: query.assetType })}`, SpatialAssetsSchema, 'assets') },
    async descriptors(assetId) { return verified(`/descriptors${queryString({ asset_id: assetId })}`, SpatialDescriptorsSchema, 'descriptors') },
    async mappings(signal) {
      const payload = await detail(signal)
      return SpatialMappingsSchema.parse({ release: payload.release, items: payload.mappings })
    },
    inventory,
    async content(assetId, contentId, range) {
      const inventoryPayload = await inventory()
      const item = inventoryPayload.items.find((candidate) => candidate.asset_id === assetId && candidate.id === contentId)
      if (!item) return undefined
      if (item.bytes > SPATIAL_MAX_CONTENT_BYTES) throw new SpatialCompatibilityError('Spatial content exceeds the configured byte cap', { statusCode: 413, code: 'SPATIAL_CONTENT_TOO_LARGE' })
      const path = `${base}/assets/${encodeURIComponent(assetId)}/content/${encodeURIComponent(contentId)}`
      const response = await request(path, { accept: item.media_type, headers: range ? { range: range.header } : {}, allowedStatuses: [206] })
      if (![200, 206].includes(response.status)) throw new SpatialCompatibilityError('Spatial content response status is incompatible')
      if ((range && response.status !== 206) || (!range && response.status !== 200)) throw new SpatialCompatibilityError('Spatial upstream did not honor the requested content range')
      if (response.headers.get('x-release-digest') !== expectedDigest || response.headers.get('x-content-sha256') !== item.sha256 || response.headers.get('etag') !== `"sha256:${item.sha256}"`) throw new SpatialCompatibilityError('Spatial content digest headers do not match the verified inventory')
      if (response.headers.get('accept-ranges') !== 'bytes' || response.headers.get('content-type')?.split(';')[0] !== item.media_type) throw new SpatialCompatibilityError('Spatial content transport metadata does not match the verified inventory')
      const body = Buffer.from(await response.arrayBuffer())
      const expectedBytes = range ? range.end - range.start + 1 : item.bytes
      if (body.length !== expectedBytes || body.length > SPATIAL_MAX_CONTENT_BYTES) throw new SpatialCompatibilityError('Spatial content byte count does not match the verified inventory')
      if (range && response.headers.get('content-range') !== `bytes ${range.start}-${range.end}/${item.bytes}`) throw new SpatialCompatibilityError('Spatial upstream returned an incompatible content range')
      if (!range && createHash('sha256').update(body).digest('hex') !== item.sha256) throw new SpatialCompatibilityError('Spatial content SHA-256 does not match the verified inventory')
      return { body, statusCode: response.status, item, range }
    }
  }
}

export { FIXTURE_SPATIAL_RELEASE }
