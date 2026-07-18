import { createHash } from 'node:crypto'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import {
  MEASURED_SPATIAL_PINS,
  MeasuredSpatialArraySchema,
  MeasuredSpatialCatalogSchema,
  MeasuredSpatialTrustSchema
} from '../../shared/measured-spatial-contracts.js'
import { validateMeasuredSpatialLoopbackUrl } from '../../server/measured-spatial/client.js'
import {
  measuredSpatialDigest,
  verifyMeasuredSpatialChunkBytes,
  verifyMeasuredSpatialSignature
} from '../../server/measured-spatial/verification.js'

const trust = {
  keys: [{
    algorithm: 'Ed25519',
    key_id: 'goal14-measured-spatial-2026',
    public_key: 'LkUc5qudlNruohEvS3Q3cJpmIxNZydvgVS7ugH0wNT8',
    reason: 'One-time Goal 14 publication key retired after signing the DigiMouse measured-spatial v1 release and catalog; private key destroyed.',
    status: 'retired',
    valid_from: '2026-07-17',
    valid_until: '2026-07-17'
  }],
  trust_schema_version: '1.0.0'
}
const catalog = {
  catalog_envelope_schema_version: '1.0.0',
  payload: {
    catalog_version: '1.0.0',
    published_at: '2026-07-17',
    releases: [{
      chunk_count: 400,
      contract_family: 'measured-spatial/1.0.0',
      envelope_sha256: '71a5876a50c9a9c2a7a373339ef12002f3fb054bd04095b299ac480560199210',
      manifest_sha256: '3a3409e44df84e200e074760bfda4197ec8673dd5bf79b37167b2b83aaf850c0',
      release_digest: '9b4ea920b9daa49f23aefe453b88fcd0b13f92dd50c5ebb168c7809d78c22b1b',
      release_id: 'digimouse-measured-liver-atlas-v1.0.0'
    }]
  },
  signature: {
    algorithm: 'Ed25519',
    key_id: 'goal14-measured-spatial-2026',
    signed_at: '2026-07-17T00:00:00Z',
    value: 'GkScRsZaOblggKZZhqan6_0ugznaH31LW_b2U8peoD6ta3Zos_FAfCnpvLMuoaFWcXkSWmuSdtnQl5YgT3U-Ag'
  }
}
const codec = {
  id: 'gzip',
  specification: 'RFC 1952',
  level: 9,
  mtime: 0,
  header_os: 3,
  implementation_probe_sha256: '676a53aff05d0332d03ae91ae54e0ab34a8a260e2b1840d71fb9d39980648883'
}
const array = {
  id: 'liver-mask:1',
  array_id: 'liver-mask',
  kind: 'binary-mask',
  level: 1,
  shape_zyx: [104, 496, 190],
  spacing_um: [200, 200, 200],
  dtype: '|u1',
  order: 'C',
  chunks_zyx: [32, 128, 128],
  fill_value: 0,
  dimension_separator: '.',
  zarr_format: 2,
  compressor: codec,
  uncompressed_bytes: 9_800_960,
  uncompressed_sha256: '5a82200f36c92dd5bb64acd0e04b32dc2b1e34b81ef0f86ea9af5bca2d661222',
  liver_voxels: 248_736,
  liver_bounds_xyz: [[27, 221, 13], [146, 311, 90]]
}

describe('Goal 14 measured-spatial verification', () => {
  it('independently pins and verifies the retired publication key and signed catalog', () => {
    const checkedTrust = MeasuredSpatialTrustSchema.parse(trust)
    const checkedCatalog = MeasuredSpatialCatalogSchema.parse(catalog)

    expect(measuredSpatialDigest(checkedTrust)).toBe(MEASURED_SPATIAL_PINS.trustDigest)
    expect(measuredSpatialDigest(checkedCatalog)).toBe(MEASURED_SPATIAL_PINS.catalogDigest)
    expect(verifyMeasuredSpatialSignature(checkedCatalog.payload, checkedCatalog.signature, checkedTrust)).toMatchObject({ key_id: MEASURED_SPATIAL_PINS.signerKeyId, status: 'retired' })
    expect(() => verifyMeasuredSpatialSignature({ ...checkedCatalog.payload, published_at: '2026-07-18' }, checkedCatalog.signature, checkedTrust)).toThrow('Ed25519 signature is invalid')
  })

  it('rejects independently pinned array shape, level, and digest drift', () => {
    expect(MeasuredSpatialArraySchema.parse(array)).toEqual(array)
    expect(MeasuredSpatialArraySchema.safeParse({ ...array, shape_zyx: [104, 496, 191] }).success).toBe(false)
    expect(MeasuredSpatialArraySchema.safeParse({ ...array, uncompressed_sha256: '0'.repeat(64) }).success).toBe(false)
    expect(MeasuredSpatialArraySchema.safeParse({ ...array, level: 0, id: 'liver-mask:0' }).success).toBe(false)
  })

  it('verifies both encoded and decoded chunk identities and keeps corruption visible', () => {
    const decoded = Buffer.alloc(32 * 128 * 128, 1)
    const encoded = gzipSync(decoded, { level: 9, mtime: 0 })
    const sha256 = (value) => createHash('sha256').update(value).digest('hex')
    const descriptor = {
      path: 'arrays/liver-mask/1/0.0.0',
      encoded_bytes: encoded.length,
      encoded_sha256: sha256(encoded),
      decoded_bytes: decoded.length,
      decoded_sha256: sha256(decoded)
    }

    expect(verifyMeasuredSpatialChunkBytes(encoded, descriptor).decoded).toEqual(decoded)
    const corrupt = Buffer.from(encoded)
    corrupt[corrupt.length - 1] ^= 1
    expect(() => verifyMeasuredSpatialChunkBytes(corrupt, descriptor)).toThrow('encoded chunk identity is invalid')
    expect(() => verifyMeasuredSpatialChunkBytes(encoded, { ...descriptor, decoded_sha256: '0'.repeat(64) })).toThrow('decoded chunk identity is invalid')
  })

  it('accepts only origin-only loopback HTTP producer URLs', () => {
    expect(validateMeasuredSpatialLoopbackUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000')
    expect(() => validateMeasuredSpatialLoopbackUrl('https://127.0.0.1:8000')).toThrow('restricted')
    expect(() => validateMeasuredSpatialLoopbackUrl('http://localhost:8000')).toThrow('restricted')
    expect(() => validateMeasuredSpatialLoopbackUrl('http://127.0.0.1:8000/path')).toThrow('restricted')
  })
})
