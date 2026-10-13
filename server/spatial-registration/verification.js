import { gunzipSync } from 'node:zlib'
import { canonicalJson } from '../../shared/canonical-json.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { defineProblemError } from '../commons/errors.js'
import { parseCanonicalBytes, verifyEd25519Signature } from '../commons/verification.js'
import {
  SPATIAL_REGISTRATION_ARRAY_IDS,
  SPATIAL_REGISTRATION_PINS,
  SPATIAL_REGISTRATION_RECORD_TYPES,
  SpatialRegistrationBundleSchema,
  SpatialRegistrationCatalogSchema,
  SpatialRegistrationEnvelopeSchema,
  SpatialRegistrationInventorySchema,
  SpatialRegistrationManifestSchema,
  SpatialRegistrationMetadataSchema,
  SpatialRegistrationProducerChunkPageSchema,
  SpatialRegistrationProducerDiscoverySchema,
  SpatialRegistrationProducerRecordPageSchema,
  SpatialRegistrationTrustSchema
} from '../../shared/spatial-registration-contracts.js'

export const MAX_SPATIAL_REGISTRATION_METADATA_BYTES = 16 * 1024 * 1024
export const MAX_SPATIAL_REGISTRATION_PAGE_BYTES = 2 * 1024 * 1024
export const MAX_SPATIAL_REGISTRATION_CHUNK_BYTES = 1024 * 1024
const RECORD_COUNTS = Object.freeze({ datasets: 1, acquisitions: 1, spaces: 2, arrays: 5, registrations: 1, 'residual-overlap': 4, limitations: 5, attribution: 1 })
const FULL_INDEX_ZYX_TO_SPACE_XYZ = [[0, 0, 2, 0], [0, 2, 0, 0], [2, 0, 0, 0], [0, 0, 0, 1]]
const PREVIEW_INDEX_ZYX_TO_SPACE_XYZ = [[0, 0, 8, 4], [0, 8, 0, 4], [8, 0, 0, 4], [0, 0, 0, 1]]

export const SpatialRegistrationVerificationError = defineProblemError('SpatialRegistrationVerificationError', { statusCode: 409, code: 'SPATIAL_REGISTRATION_VERIFICATION_FAILED' })

export const spatialRegistrationSha256 = sha256Hex
export const spatialRegistrationDigest = canonicalSha256Hex

function currentSpatialRegistrationTime(now) {
  if (typeof now !== 'function') throw new TypeError('Spatial-registration verification requires an injectable clock.')
  const current = now()
  const parsed = new Date(current)
  if (Number.isNaN(parsed.valueOf())) throw new TypeError('Spatial-registration clock must return a valid date or timestamp.')
  return parsed
}

function assertSpatialRegistrationTimes(current, entries) {
  for (const [label, value] of entries) if (Date.parse(value) > current.valueOf()) throw new SpatialRegistrationVerificationError(`Spatial-registration ${label} is in the future.`)
}

export function parseSpatialRegistrationCanonical(bytes, schema, label, expectedDigest) {
  return parseCanonicalBytes(bytes, schema, label, { ErrorClass: SpatialRegistrationVerificationError, maxBytes: MAX_SPATIAL_REGISTRATION_METADATA_BYTES, expectedDigest, contract: 'spatial-registration', issue: true })
}

function verifySpatialRegistrationSignatureAt(payload, signature, trust, current) {
  const key = trust.keys.find((candidate) => candidate.key_id === signature.key_id)
  if (!key || key.public_key !== SPATIAL_REGISTRATION_PINS.signerPublicKey || key.status !== 'retired') throw new SpatialRegistrationVerificationError('Spatial-registration signature does not use the independently pinned retired publication key.')
  const signedDate = signature.signed_at.slice(0, 10)
  if (signedDate < key.valid_from || signedDate > key.valid_until) throw new SpatialRegistrationVerificationError('Spatial-registration signature falls outside the publication key interval.')
  assertSpatialRegistrationTimes(current, [['signature time', signature.signed_at]])
  verifyEd25519Signature({
    payload,
    signature,
    publicKey: key.public_key,
    ErrorClass: SpatialRegistrationVerificationError,
    labels: { publicKey: 'Spatial-registration public key', signature: 'Spatial-registration signature' },
    invalidMessage: 'Spatial-registration Ed25519 signature is invalid.'
  })
}

export function verifySpatialRegistrationSignature(payload, signature, trust, now = () => new Date()) {
  verifySpatialRegistrationSignatureAt(payload, signature, trust, currentSpatialRegistrationTime(now))
}

function verifyManifestClosure(manifest, inventory) {
  const identity = { ...manifest }
  delete identity.release_digest
  if (spatialRegistrationDigest(identity) !== SPATIAL_REGISTRATION_PINS.releaseDigest) throw new SpatialRegistrationVerificationError('Spatial-registration release digest is invalid.')
  const fixed = new Set(['metadata.json', 'chunk-inventory.json', ...SPATIAL_REGISTRATION_ARRAY_IDS.flatMap((arrayId) => [`arrays/${arrayId}/.zattrs`, `arrays/${arrayId}/0/.zarray`])])
  const chunks = manifest.files.filter((item) => item.role === 'chunk')
  if (chunks.length !== 304 || chunks.some((item, index) => item.path !== inventory.chunks[index].path || item.bytes !== inventory.chunks[index].encoded_bytes || item.sha256 !== inventory.chunks[index].encoded_sha256)) throw new SpatialRegistrationVerificationError('Spatial-registration manifest and chunk inventory ownership differ.')
  const allowed = new Set([...fixed, ...inventory.chunks.map((item) => item.path)])
  if (manifest.files.length !== allowed.size || manifest.files.some((item) => !allowed.has(item.path))) throw new SpatialRegistrationVerificationError('Spatial-registration manifest closure is incomplete or excessive.')
  const metadata = manifest.files.find((item) => item.path === 'metadata.json')
  const inventoryFile = manifest.files.find((item) => item.path === 'chunk-inventory.json')
  if (metadata?.role !== 'metadata' || metadata.sha256 !== SPATIAL_REGISTRATION_PINS.metadataDigest || inventoryFile?.role !== 'chunk-inventory' || inventoryFile.sha256 !== SPATIAL_REGISTRATION_PINS.inventoryDigest) throw new SpatialRegistrationVerificationError('Spatial-registration manifest does not bind metadata and inventory pins.')
  if (inventory.chunks.reduce((total, item) => total + item.encoded_bytes, 0) !== SPATIAL_REGISTRATION_PINS.encodedChunkBytes) throw new SpatialRegistrationVerificationError('Spatial-registration encoded chunk byte total differs from its independent pin.')
}

function stripId(value) { const { id: _id, ...selected } = value; return selected }

export function reconstructSpatialRegistrationMetadata(records) {
  if (!records || Object.keys(records).sort().join() !== [...SPATIAL_REGISTRATION_RECORD_TYPES].sort().join()) throw new SpatialRegistrationVerificationError('Spatial-registration semantic record closure is incomplete or excessive.')
  for (const type of SPATIAL_REGISTRATION_RECORD_TYPES) if (!Array.isArray(records[type]) || records[type].length !== RECORD_COUNTS[type]) throw new SpatialRegistrationVerificationError(`Spatial-registration ${type} record count is invalid.`)
  const metadata = SpatialRegistrationMetadataSchema.parse({
    metadata_schema_version: '1.1.0', release_id: SPATIAL_REGISTRATION_PINS.releaseId, dataset: records.datasets[0], spaces: records.spaces, arrays: records.arrays, registration: records.registrations[0], limitations: records.limitations.map((item) => item.statement), attribution: stripId(records.attribution[0])
  })
  const acquisition = stripId(records.acquisitions[0])
  if (canonicalJson(acquisition) !== canonicalJson(metadata.dataset.acquisition) || spatialRegistrationDigest(acquisition) !== SPATIAL_REGISTRATION_PINS.sourceAcquisitionReportDigest) throw new SpatialRegistrationVerificationError('Spatial-registration acquisition report record differs from the full-package proof.')
  const residualOverlap = records['residual-overlap'].map(stripId)
  if (canonicalJson(residualOverlap) !== canonicalJson(metadata.registration.residual_overlap_metrics)) throw new SpatialRegistrationVerificationError('Spatial-registration residual-overlap records differ from the published recomputation.')
  if (spatialRegistrationDigest(metadata) !== SPATIAL_REGISTRATION_PINS.metadataDigest) throw new SpatialRegistrationVerificationError('Reconstructed spatial-registration metadata does not match its independent digest pin.')
  return metadata
}

export function verifySpatialRegistrationBundle(value, now = () => new Date()) {
  const bundle = SpatialRegistrationBundleSchema.parse(value)
  const current = currentSpatialRegistrationTime(now)
  assertSpatialRegistrationTimes(current, [
    ['catalog publication time', bundle.catalog.payload.published_at],
    ['catalog signature time', bundle.catalog.signature.signed_at],
    ['manifest publication time', bundle.manifest.published_at],
    ['manifest source retrieval time', bundle.manifest.source_retrieved_at],
    ['release signature time', bundle.envelope.signature.signed_at],
    ['acquisition retrieval time', bundle.metadata.dataset.acquisition.retrieval.retrieved_at],
    ['attribution retrieval time', bundle.metadata.attribution.source.retrieved_at]
  ])
  const identities = [['trust', 'trustDigest'], ['catalog', 'catalogDigest'], ['manifest', 'manifestDigest'], ['envelope', 'envelopeDigest'], ['metadata', 'metadataDigest'], ['inventory', 'inventoryDigest']]
  if (identities.some(([key, pin]) => spatialRegistrationDigest(bundle[key]) !== SPATIAL_REGISTRATION_PINS[pin])) throw new SpatialRegistrationVerificationError('Spatial-registration signed metadata or inventory pin failed.')
  verifySpatialRegistrationSignatureAt(bundle.catalog.payload, bundle.catalog.signature, bundle.trust, current)
  verifySpatialRegistrationSignatureAt(bundle.envelope.payload, bundle.envelope.signature, bundle.trust, current)
  if (bundle.metadata.dataset.source_package_sha256 !== SPATIAL_REGISTRATION_PINS.sourcePackageDigest || spatialRegistrationDigest(bundle.metadata.dataset.acquisition) !== SPATIAL_REGISTRATION_PINS.sourceAcquisitionReportDigest || bundle.manifest.source_acquisition_report_sha256 !== SPATIAL_REGISTRATION_PINS.sourceAcquisitionReportDigest || bundle.manifest.source_retrieved_at !== SPATIAL_REGISTRATION_PINS.sourceRetrievedAt || bundle.envelope.payload.source_package_sha256 !== SPATIAL_REGISTRATION_PINS.sourcePackageDigest || bundle.inventory.release_id !== SPATIAL_REGISTRATION_PINS.releaseId) throw new SpatialRegistrationVerificationError('Spatial-registration source acquisition, metadata, and inventory identities do not close.')
  if (Date.parse(bundle.manifest.source_retrieved_at) > Date.parse(bundle.manifest.published_at)) throw new SpatialRegistrationVerificationError('Spatial-registration publication predates source acquisition.')
  for (const array of bundle.metadata.arrays) {
    const expectedMatrix = array.array_id.endsWith('intensity-preview') ? PREVIEW_INDEX_ZYX_TO_SPACE_XYZ : FULL_INDEX_ZYX_TO_SPACE_XYZ
    const expectedSpace = array.array_id.startsWith('ct-') ? 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED' : 'SPACE:L2R-ABDOMEN-MRCT-0001-MR-PREALIGNED'
    if (canonicalJson(array.index_zyx_to_space_xyz_mm) !== canonicalJson(expectedMatrix) || array.space_id !== expectedSpace || canonicalJson(array.index_axis_order) !== canonicalJson(['z', 'y', 'x'])) throw new SpatialRegistrationVerificationError(`${array.array_id}: array space or index transform is invalid.`)
  }
  verifyManifestClosure(bundle.manifest, bundle.inventory)
  return bundle
}

export function verifySpatialRegistrationDiscovery(bytes) {
  const value = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationProducerDiscoverySchema, 'Spatial-registration discovery')
  const expected = ['GET /api/spatial-registration/v1', 'GET /api/spatial-registration/v1/trust', 'GET /api/spatial-registration/v1/catalog', 'GET /api/spatial-registration/v1/releases/:releaseId', 'GET /api/spatial-registration/v1/releases/:releaseId/envelope', 'GET /api/spatial-registration/v1/releases/:releaseId/records/:recordType', 'GET /api/spatial-registration/v1/releases/:releaseId/chunks', 'GET /api/spatial-registration/v1/releases/:releaseId/chunks/:arrayId/:z/:y/:x']
  if (canonicalJson(value.routes) !== canonicalJson(expected)) throw new SpatialRegistrationVerificationError('Spatial-registration producer route inventory changed.')
  return value
}

export function verifySpatialRegistrationTrust(bytes) { return parseSpatialRegistrationCanonical(bytes, SpatialRegistrationTrustSchema, 'Spatial-registration trust', SPATIAL_REGISTRATION_PINS.trustDigest) }
export function verifySpatialRegistrationCatalog(bytes, trust, now = () => new Date()) { const value = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationCatalogSchema, 'Spatial-registration catalog', SPATIAL_REGISTRATION_PINS.catalogDigest); const current = currentSpatialRegistrationTime(now); assertSpatialRegistrationTimes(current, [['catalog publication time', value.payload.published_at], ['catalog signature time', value.signature.signed_at]]); verifySpatialRegistrationSignatureAt(value.payload, value.signature, trust, current); return value }
export function verifySpatialRegistrationManifest(bytes, now = () => new Date()) { const value = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationManifestSchema, 'Spatial-registration manifest', SPATIAL_REGISTRATION_PINS.manifestDigest); assertSpatialRegistrationTimes(currentSpatialRegistrationTime(now), [['manifest publication time', value.published_at], ['manifest source retrieval time', value.source_retrieved_at]]); return value }
export function verifySpatialRegistrationEnvelope(bytes, trust, now = () => new Date()) { const value = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationEnvelopeSchema, 'Spatial-registration envelope', SPATIAL_REGISTRATION_PINS.envelopeDigest); const current = currentSpatialRegistrationTime(now); assertSpatialRegistrationTimes(current, [['release signature time', value.signature.signed_at]]); verifySpatialRegistrationSignatureAt(value.payload, value.signature, trust, current); return value }

export function verifySpatialRegistrationRecordPage(bytes, recordType) {
  const page = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationProducerRecordPageSchema, `Spatial-registration ${recordType} page`)
  if (page.record_type !== recordType || page.total !== RECORD_COUNTS[recordType] || page.items.length !== page.total) throw new SpatialRegistrationVerificationError(`Spatial-registration ${recordType} page is incomplete.`)
  return page.items
}

export function verifySpatialRegistrationChunkPage(bytes, offset) {
  const page = parseSpatialRegistrationCanonical(bytes, SpatialRegistrationProducerChunkPageSchema, `Spatial-registration chunk page ${offset}`)
  if (page.offset !== offset || page.total !== 304) throw new SpatialRegistrationVerificationError('Spatial-registration chunk page identity differs from the request.')
  return page.items
}

export function reconstructSpatialRegistrationInventory(pages) {
  const inventory = SpatialRegistrationInventorySchema.parse({ inventory_schema_version: '1.0.0', release_id: SPATIAL_REGISTRATION_PINS.releaseId, codec: { id: 'gzip', specification: 'RFC 1952', level: 9, mtime: 0, header_os: 3, implementation_probe_sha256: '676a53aff05d0332d03ae91ae54e0ab34a8a260e2b1840d71fb9d39980648883' }, chunks: pages.flat() })
  if (spatialRegistrationDigest(inventory) !== SPATIAL_REGISTRATION_PINS.inventoryDigest) throw new SpatialRegistrationVerificationError('Reconstructed spatial-registration inventory does not match its independent pin.')
  return inventory
}

export function verifySpatialRegistrationChunkBytes(encoded, descriptor) {
  if (!Buffer.isBuffer(encoded) || encoded.length !== descriptor.encoded_bytes || spatialRegistrationSha256(encoded) !== descriptor.encoded_sha256) throw new SpatialRegistrationVerificationError(`${descriptor.path}: encoded chunk identity is invalid.`)
  if (encoded.length < 18 || encoded[0] !== 0x1f || encoded[1] !== 0x8b || encoded[2] !== 8 || encoded[3] !== 0 || encoded.readUInt32LE(4) !== 0 || encoded[8] !== 2 || encoded[9] !== 3) throw new SpatialRegistrationVerificationError(`${descriptor.path}: deterministic gzip identity is invalid.`)
  let decoded
  try { decoded = gunzipSync(encoded, { maxOutputLength: descriptor.decoded_bytes }) } catch { throw new SpatialRegistrationVerificationError(`${descriptor.path}: gzip decoding failed within its declared bound.`) }
  if (decoded.length !== descriptor.decoded_bytes || spatialRegistrationSha256(decoded) !== descriptor.decoded_sha256) throw new SpatialRegistrationVerificationError(`${descriptor.path}: decoded chunk identity is invalid.`)
  return { encoded, decoded }
}

export async function recomputeSpatialRegistrationResidualOverlap(bundle, readDecoded) {
  const mr = bundle.inventory.chunks.filter((item) => item.array_id === 'mr-organ-labels')
  const ct = bundle.inventory.chunks.filter((item) => item.array_id === 'ct-organ-labels')
  const roi = bundle.inventory.chunks.filter((item) => item.array_id === 'evaluation-roi')
  if (mr.length !== 96 || ct.length !== 96 || roi.length !== 96 || mr.some((item, index) => item.grid_zyx.join('.') !== ct[index].grid_zyx.join('.') || item.grid_zyx.join('.') !== roi[index].grid_zyx.join('.'))) throw new SpatialRegistrationVerificationError('Source label and evaluation-ROI chunk grids are incomplete or incompatible.')
  const counts = Array.from({ length: 5 }, () => ({ fixed: 0, moving: 0, intersection: 0, fixedSum: [0, 0, 0], movingSum: [0, 0, 0] }))
  for (let chunkIndex = 0; chunkIndex < mr.length; chunkIndex += 1) {
    const [fixed, moving, evaluationRoi] = await Promise.all([readDecoded(mr[chunkIndex]), readDecoded(ct[chunkIndex]), readDecoded(roi[chunkIndex])])
    const origin = mr[chunkIndex].voxel_origin_zyx
    const shape = mr[chunkIndex].voxel_shape_zyx
    for (let index = 0; index < fixed.length; index += 1) {
      if (evaluationRoi[index] !== 1) continue
      const fixedLabel = fixed[index]
      const movingLabel = moving[index]
      if ((fixedLabel < 1 || fixedLabel > 4) && (movingLabel < 1 || movingLabel > 4)) continue
      const localX = index % shape[2]
      const localY = Math.floor(index / shape[2]) % shape[1]
      const localZ = Math.floor(index / (shape[1] * shape[2]))
      const xyz = [origin[2] + localX, origin[1] + localY, origin[0] + localZ]
      if (fixedLabel >= 1 && fixedLabel <= 4) { counts[fixedLabel].fixed += 1; xyz.forEach((item, axis) => { counts[fixedLabel].fixedSum[axis] += item }) }
      if (movingLabel >= 1 && movingLabel <= 4) { counts[movingLabel].moving += 1; xyz.forEach((item, axis) => { counts[movingLabel].movingSum[axis] += item }) }
      if (fixedLabel === movingLabel && fixedLabel >= 1 && fixedLabel <= 4) counts[fixedLabel].intersection += 1
    }
  }
  const names = [null, 'liver', 'spleen', 'right kidney', 'left kidney']
  const metrics = counts.slice(1).map((value, index) => {
    const label = index + 1
    if (value.fixed === 0 || value.moving === 0) return { anatomy: names[label], label, status: 'not-evaluable', metric: 'Recomputed residual Dice overlap under published identity affine within repository-derived evaluation ROI', dice: null, centroid_distance_mm: null, fixed_mr_voxels: value.fixed, moving_ct_voxels: value.moving, reason: `${names[label]} is absent from ${value.fixed === 0 ? 'fixed MR' : 'moving CT'} source labels inside the repository-derived evaluation ROI.` }
    const fixedCentroid = value.fixedSum.map((item) => item / value.fixed)
    const movingCentroid = value.movingSum.map((item) => item / value.moving)
    return { anatomy: names[label], label, status: 'observed', metric: 'Recomputed residual Dice overlap under published identity affine within repository-derived evaluation ROI', dice: 2 * value.intersection / (value.fixed + value.moving), centroid_distance_mm: Math.sqrt(fixedCentroid.reduce((total, item, axis) => total + ((item - movingCentroid[axis]) * 2) ** 2, 0)), fixed_mr_voxels: value.fixed, moving_ct_voxels: value.moving, reason: null }
  })
  if (canonicalJson(metrics) !== canonicalJson(bundle.metadata.registration.residual_overlap_metrics)) throw new SpatialRegistrationVerificationError('Residual source-label overlap recomputation differs from the published metrics.')
  return metrics
}
