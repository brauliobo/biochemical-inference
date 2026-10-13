import { gunzipSync } from 'node:zlib'
import { canonicalJson } from '../../shared/canonical-json.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { defineProblemError } from '../commons/errors.js'
import { parseCanonicalBytes, verifyEd25519Signature } from '../commons/verification.js'
import {
  MEASURED_SPATIAL_ARRAY_PINS,
  MEASURED_SPATIAL_PINS,
  MEASURED_SPATIAL_RECORD_SCHEMAS,
  MEASURED_SPATIAL_RECORD_TYPES,
  MeasuredSpatialBundleSchema,
  MeasuredSpatialCatalogSchema,
  MeasuredSpatialEnvelopeSchema,
  MeasuredSpatialInventorySchema,
  MeasuredSpatialManifestSchema,
  MeasuredSpatialMetadataSchema,
  MeasuredSpatialProducerChunkPageSchema,
  MeasuredSpatialProducerDiscoverySchema,
  MeasuredSpatialProducerRecordPageSchema,
  MeasuredSpatialTrustSchema
} from '../../shared/measured-spatial-contracts.js'

export const MAX_MEASURED_SPATIAL_METADATA_BYTES = 16 * 1024 * 1024
export const MAX_MEASURED_SPATIAL_PAGE_BYTES = 2 * 1024 * 1024
export const MAX_MEASURED_SPATIAL_CHUNK_BYTES = 1024 * 1024
const RECORD_COUNTS = Object.freeze({ acquisitions: 1, spaces: 1, arrays: 4, labels: 1, registrations: 1, limitations: 3, attribution: 1 })

export const MeasuredSpatialVerificationError = defineProblemError('MeasuredSpatialVerificationError', { statusCode: 409, code: 'MEASURED_SPATIAL_VERIFICATION_FAILED' })

export const measuredSpatialSha256 = sha256Hex
export const measuredSpatialDigest = canonicalSha256Hex

export function parseMeasuredSpatialCanonical(bytes, schema, label, expectedDigest) {
  return parseCanonicalBytes(bytes, schema, label, { ErrorClass: MeasuredSpatialVerificationError, maxBytes: MAX_MEASURED_SPATIAL_METADATA_BYTES, expectedDigest, contract: 'measured-spatial', issue: true })
}

export function verifyMeasuredSpatialSignature(payload, signature, trust) {
  const key = trust.keys.find((candidate) => candidate.key_id === signature.key_id)
  if (!key || key.public_key !== MEASURED_SPATIAL_PINS.signerPublicKey || key.status !== 'retired') throw new MeasuredSpatialVerificationError('Measured-spatial signature does not use the independently pinned retired publication key.')
  const signedDate = signature.signed_at.slice(0, 10)
  if (signedDate < key.valid_from || signedDate > key.valid_until) throw new MeasuredSpatialVerificationError('Measured-spatial signature falls outside the publication key interval.')
  verifyEd25519Signature({
    payload,
    signature,
    publicKey: key.public_key,
    ErrorClass: MeasuredSpatialVerificationError,
    labels: { publicKey: 'Measured-spatial public key', signature: 'Measured-spatial signature' },
    invalidMessage: 'Measured-spatial Ed25519 signature is invalid.'
  })
  return key
}

function manifestFile(manifest, path, role, digest) {
  const matches = manifest.files.filter((item) => item.path === path)
  if (matches.length !== 1 || matches[0].role !== role || (digest && matches[0].sha256 !== digest)) throw new MeasuredSpatialVerificationError(`Measured-spatial manifest does not own the exact ${path} identity.`)
  return matches[0]
}

function verifyManifestClosure(manifest, inventory) {
  const identity = { ...manifest }
  delete identity.release_digest
  if (measuredSpatialDigest(identity) !== MEASURED_SPATIAL_PINS.releaseDigest) throw new MeasuredSpatialVerificationError('Measured-spatial release digest is invalid.')
  manifestFile(manifest, 'metadata.json', 'metadata', MEASURED_SPATIAL_PINS.metadataDigest)
  manifestFile(manifest, 'chunk-inventory.json', 'chunk-inventory', MEASURED_SPATIAL_PINS.inventoryDigest)
  for (const arrayId of ['anatomy-labels', 'liver-mask']) {
    manifestFile(manifest, `arrays/${arrayId}/.zattrs`, 'zarr-metadata')
    manifestFile(manifest, `arrays/${arrayId}/0/.zarray`, 'zarr-metadata')
    manifestFile(manifest, `arrays/${arrayId}/1/.zarray`, 'zarr-metadata')
  }
  const chunkFiles = manifest.files.filter((item) => item.role === 'chunk')
  if (chunkFiles.length !== MEASURED_SPATIAL_PINS.chunkCount || chunkFiles.some((file, index) => {
    const chunk = inventory.chunks[index]
    return file.path !== chunk.path || file.bytes !== chunk.encoded_bytes || file.sha256 !== chunk.encoded_sha256
  })) throw new MeasuredSpatialVerificationError('Measured-spatial manifest and chunk inventory ownership differ.')
  const allowed = new Set(['metadata.json', 'chunk-inventory.json', ...['anatomy-labels', 'liver-mask'].flatMap((arrayId) => [`arrays/${arrayId}/.zattrs`, `arrays/${arrayId}/0/.zarray`, `arrays/${arrayId}/1/.zarray`]), ...inventory.chunks.map((item) => item.path)])
  if (manifest.files.some((item) => !allowed.has(item.path)) || allowed.size !== manifest.files.length) throw new MeasuredSpatialVerificationError('Measured-spatial manifest contains missing or excessive file ownership.')
}

function verifyArrayAndGridClosure(metadata, inventory) {
  for (const array of metadata.arrays) {
    const pin            = MEASURED_SPATIAL_ARRAY_PINS[array.id]
    const selectedChunks = inventory.chunks.filter((item) => item.array_id === array.array_id && item.level === array.level)
    const grids          = array.shape_zyx.map((size, index) => Math.ceil(size / array.chunks_zyx[index]))
    if (!pin || selectedChunks.length !== pin.chunkCount || selectedChunks.length !== grids.reduce((total, item) => total * item, 1)) throw new MeasuredSpatialVerificationError(`${array.id} does not contain its exact independently pinned chunk grid.`)
    for (const chunk of selectedChunks) {
      const expectedShape = chunk.voxel_origin_zyx.map((origin, index) => Math.min(array.chunks_zyx[index], array.shape_zyx[index] - origin))
      if (expectedShape.some((item, index) => item <= 0 || item !== chunk.voxel_shape_zyx[index]) || chunk.grid_zyx.some((item, index) => item >= grids[index])) throw new MeasuredSpatialVerificationError(`${chunk.path} lies outside its pinned array shape or has invalid edge padding.`)
    }
  }
  const encodedBytes = inventory.chunks.reduce((total, item) => total + item.encoded_bytes, 0)
  if (encodedBytes !== MEASURED_SPATIAL_PINS.encodedChunkBytes) throw new MeasuredSpatialVerificationError('Measured-spatial encoded chunk byte inventory differs from its independent pin.')
}

export function reconstructMeasuredSpatialMetadata(records) {
  if (!records || Object.keys(records).sort().join() !== [...MEASURED_SPATIAL_RECORD_TYPES].sort().join()) throw new MeasuredSpatialVerificationError('Measured-spatial semantic record closure is incomplete or excessive.')
  const parsed = {}
  for (const recordType of MEASURED_SPATIAL_RECORD_TYPES) {
    const items = records[recordType]
    if (!Array.isArray(items) || items.length !== RECORD_COUNTS[recordType]) throw new MeasuredSpatialVerificationError(`Measured-spatial ${recordType} count is invalid.`)
    parsed[recordType] = items.map((item) => {
      const result = MEASURED_SPATIAL_RECORD_SCHEMAS[recordType].safeParse(item)
      if (!result.success) throw new MeasuredSpatialVerificationError(`Measured-spatial ${recordType} record is invalid: ${result.error.issues[0].message}`)
      return result.data
    })
  }
  const metadata = MeasuredSpatialMetadataSchema.parse({
    metadata_schema_version: '1.0.0',
    release_id: MEASURED_SPATIAL_PINS.releaseId,
    acquisition: parsed.acquisitions[0],
    spaces: parsed.spaces,
    arrays: parsed.arrays,
    labels: parsed.labels.map(({ id: _id, ...item }) => item),
    registrations: parsed.registrations,
    limitations: parsed.limitations.map((item) => item.statement),
    attribution: (({ id: _id, ...item }) => item)(parsed.attribution[0])
  })
  if (measuredSpatialDigest(metadata) !== MEASURED_SPATIAL_PINS.metadataDigest) throw new MeasuredSpatialVerificationError('Reconstructed measured-spatial metadata does not match its independent digest pin.')
  return metadata
}

export function verifyMeasuredSpatialBundle(value) {
  const bundle = MeasuredSpatialBundleSchema.parse(value)
  if (measuredSpatialDigest(bundle.trust) !== MEASURED_SPATIAL_PINS.trustDigest || measuredSpatialDigest(bundle.catalog) !== MEASURED_SPATIAL_PINS.catalogDigest || measuredSpatialDigest(bundle.manifest) !== MEASURED_SPATIAL_PINS.manifestDigest || measuredSpatialDigest(bundle.envelope) !== MEASURED_SPATIAL_PINS.envelopeDigest || measuredSpatialDigest(bundle.metadata) !== MEASURED_SPATIAL_PINS.metadataDigest || measuredSpatialDigest(bundle.inventory) !== MEASURED_SPATIAL_PINS.inventoryDigest) throw new MeasuredSpatialVerificationError('Measured-spatial trust, catalog, manifest, envelope, metadata, or inventory pin failed.')
  verifyMeasuredSpatialSignature(bundle.catalog.payload, bundle.catalog.signature, bundle.trust)
  verifyMeasuredSpatialSignature(bundle.envelope.payload, bundle.envelope.signature, bundle.trust)
  const catalogEntry = bundle.catalog.payload.releases[0]
  if (catalogEntry.release_id !== bundle.manifest.release_id || catalogEntry.release_digest !== bundle.manifest.release_digest || catalogEntry.manifest_sha256 !== MEASURED_SPATIAL_PINS.manifestDigest || catalogEntry.envelope_sha256 !== MEASURED_SPATIAL_PINS.envelopeDigest || bundle.envelope.payload.manifest_sha256 !== MEASURED_SPATIAL_PINS.manifestDigest || bundle.envelope.payload.release_digest !== bundle.manifest.release_digest || bundle.envelope.payload.source_archive_sha256 !== bundle.manifest.source_archive_sha256 || bundle.metadata.acquisition.source_archive_sha256 !== bundle.manifest.source_archive_sha256 || bundle.inventory.release_id !== bundle.manifest.release_id) throw new MeasuredSpatialVerificationError('Measured-spatial catalog, release, envelope, metadata, and inventory identities do not close.')
  verifyManifestClosure(bundle.manifest, bundle.inventory)
  verifyArrayAndGridClosure(bundle.metadata, bundle.inventory)
  return bundle
}

export function verifyMeasuredSpatialDiscovery(bytes) {
  const discovery = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialProducerDiscoverySchema, 'Measured-spatial discovery')
  const expectedRoutes = [
    'GET /api/measured-spatial/v1',
    'GET /api/measured-spatial/v1/trust',
    'GET /api/measured-spatial/v1/catalog',
    'GET /api/measured-spatial/v1/releases/:releaseId',
    'GET /api/measured-spatial/v1/releases/:releaseId/envelope',
    'GET /api/measured-spatial/v1/releases/:releaseId/records/:recordType',
    'GET /api/measured-spatial/v1/releases/:releaseId/chunks',
    'GET /api/measured-spatial/v1/releases/:releaseId/chunks/:arrayId/:level/:z/:y/:x'
  ]
  if (canonicalJson(discovery.routes) !== canonicalJson(expectedRoutes)) throw new MeasuredSpatialVerificationError('Measured-spatial producer route inventory changed.')
  return discovery
}

export function verifyMeasuredSpatialTrust(bytes) {
  const trust = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialTrustSchema, 'Measured-spatial trust', MEASURED_SPATIAL_PINS.trustDigest)
  return trust
}

export function verifyMeasuredSpatialCatalog(bytes, trust) {
  const catalog = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialCatalogSchema, 'Measured-spatial catalog', MEASURED_SPATIAL_PINS.catalogDigest)
  verifyMeasuredSpatialSignature(catalog.payload, catalog.signature, trust)
  return catalog
}

export function verifyMeasuredSpatialManifest(bytes) {
  return parseMeasuredSpatialCanonical(bytes, MeasuredSpatialManifestSchema, 'Measured-spatial manifest', MEASURED_SPATIAL_PINS.manifestDigest)
}

export function verifyMeasuredSpatialEnvelope(bytes, trust, manifest) {
  const envelope = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialEnvelopeSchema, 'Measured-spatial envelope', MEASURED_SPATIAL_PINS.envelopeDigest)
  verifyMeasuredSpatialSignature(envelope.payload, envelope.signature, trust)
  if (envelope.payload.release_digest !== manifest.release_digest || envelope.payload.manifest_sha256 !== MEASURED_SPATIAL_PINS.manifestDigest || envelope.payload.source_archive_sha256 !== manifest.source_archive_sha256) throw new MeasuredSpatialVerificationError('Measured-spatial envelope does not bind the exact manifest.')
  return envelope
}

export function verifyMeasuredSpatialRecordPage(bytes, recordType) {
  const page = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialProducerRecordPageSchema, `Measured-spatial ${recordType} page`)
  if (page.record_type !== recordType || page.total !== RECORD_COUNTS[recordType] || page.items.length !== page.total) throw new MeasuredSpatialVerificationError(`Measured-spatial ${recordType} page does not contain the complete bounded record set.`)
  return page.items
}

export function verifyMeasuredSpatialChunkPage(bytes, offset) {
  const page = parseMeasuredSpatialCanonical(bytes, MeasuredSpatialProducerChunkPageSchema, `Measured-spatial chunk inventory page ${offset}`)
  if (page.offset !== offset) throw new MeasuredSpatialVerificationError('Measured-spatial chunk inventory offset differs from the requested page.')
  return page.items
}

export function reconstructMeasuredSpatialInventory(pages) {
  if (!Array.isArray(pages) || pages.length !== 4) throw new MeasuredSpatialVerificationError('Measured-spatial inventory requires exactly four bounded pages.')
  const inventory = MeasuredSpatialInventorySchema.parse({ inventory_schema_version: '1.0.0', release_id: MEASURED_SPATIAL_PINS.releaseId, codec: {
    id: 'gzip', specification: 'RFC 1952', level: 9, mtime: 0, header_os: 3,
    implementation_probe_sha256: '676a53aff05d0332d03ae91ae54e0ab34a8a260e2b1840d71fb9d39980648883'
  }, chunks: pages.flat() })
  if (measuredSpatialDigest(inventory) !== MEASURED_SPATIAL_PINS.inventoryDigest) throw new MeasuredSpatialVerificationError('Reconstructed measured-spatial inventory does not match its independent digest pin.')
  return inventory
}

export function verifyMeasuredSpatialChunkBytes(encoded, descriptor) {
  if (!Buffer.isBuffer(encoded) || encoded.length !== descriptor.encoded_bytes || measuredSpatialSha256(encoded) !== descriptor.encoded_sha256) throw new MeasuredSpatialVerificationError(`${descriptor.path}: encoded chunk identity is invalid.`)
  if (encoded.length < 18 || encoded[0] !== 0x1f || encoded[1] !== 0x8b || encoded[2] !== 8 || encoded[3] !== 0 || encoded.readUInt32LE(4) !== 0 || encoded[8] !== 2 || encoded[9] !== 3) throw new MeasuredSpatialVerificationError(`${descriptor.path}: deterministic gzip level-9, mtime-0, OS-3 codec header is invalid.`)
  let decoded
  try {
    decoded = gunzipSync(encoded, { maxOutputLength: descriptor.decoded_bytes })
  } catch {
    throw new MeasuredSpatialVerificationError(`${descriptor.path}: gzip codec or decoded byte boundary is invalid.`)
  }
  if (decoded.length !== descriptor.decoded_bytes || measuredSpatialSha256(decoded) !== descriptor.decoded_sha256) throw new MeasuredSpatialVerificationError(`${descriptor.path}: decoded chunk identity is invalid.`)
  return { encoded, decoded }
}

export { MeasuredSpatialCatalogSchema, MeasuredSpatialEnvelopeSchema, MeasuredSpatialManifestSchema, MeasuredSpatialTrustSchema }
