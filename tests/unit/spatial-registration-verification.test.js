import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { validateSpatialRegistrationLoopbackUrl } from '../../server/spatial-registration/client.js'
import { createSpatialRegistrationService } from '../../server/spatial-registration/service.js'
import { applyAffine, selectRegistrationChain } from '../../server/spatial-registration/transform.js'
import {
  recomputeSpatialRegistrationResidualOverlap,
  spatialRegistrationDigest,
  verifySpatialRegistrationBundle,
  verifySpatialRegistrationCatalog,
  verifySpatialRegistrationChunkBytes,
  verifySpatialRegistrationEnvelope,
  verifySpatialRegistrationManifest,
  verifySpatialRegistrationSignature,
  verifySpatialRegistrationTrust
} from '../../server/spatial-registration/verification.js'
import { SPATIAL_REGISTRATION_PINS } from '../../shared/spatial-registration-contracts.js'

const producerRoot = resolve(process.cwd(), '../biochemical-db/knowledge/spatial-registration')
const releaseRoot = resolve(producerRoot, `releases/${SPATIAL_REGISTRATION_PINS.releaseId}`)
const json = async (path) => JSON.parse(await readFile(path, 'utf8'))

async function publishedBundle() {
  return verifySpatialRegistrationBundle({
    discovery: { contract_family: 'spatial-registration/1.1.0', release_count: 1, routes: ['GET /api/spatial-registration/v1', 'GET /api/spatial-registration/v1/trust', 'GET /api/spatial-registration/v1/catalog', 'GET /api/spatial-registration/v1/releases/:releaseId', 'GET /api/spatial-registration/v1/releases/:releaseId/envelope', 'GET /api/spatial-registration/v1/releases/:releaseId/records/:recordType', 'GET /api/spatial-registration/v1/releases/:releaseId/chunks', 'GET /api/spatial-registration/v1/releases/:releaseId/chunks/:arrayId/:z/:y/:x'] },
    trust: await json(resolve(producerRoot, 'trust/keys.json')),
    catalog: await json(resolve(producerRoot, 'catalog.envelope.json')),
    manifest: await json(resolve(releaseRoot, 'manifest.json')),
    envelope: await json(resolve(releaseRoot, 'envelope.json')),
    metadata: await json(resolve(releaseRoot, 'metadata.json')),
    inventory: await json(resolve(releaseRoot, 'chunk-inventory.json'))
  })
}

describe('Goal 14 spatial-registration verification', () => {
  it('independently verifies retired signatures and all release, metadata, inventory, and source pins', async () => {
    const bundle = await publishedBundle()
    expect(spatialRegistrationDigest(bundle.trust)).toBe(SPATIAL_REGISTRATION_PINS.trustDigest)
    expect(spatialRegistrationDigest(bundle.catalog)).toBe(SPATIAL_REGISTRATION_PINS.catalogDigest)
    expect(spatialRegistrationDigest(bundle.manifest)).toBe(SPATIAL_REGISTRATION_PINS.manifestDigest)
    expect(spatialRegistrationDigest(bundle.metadata)).toBe(SPATIAL_REGISTRATION_PINS.metadataDigest)
    expect(bundle.metadata.dataset.source_package_sha256).toBe(SPATIAL_REGISTRATION_PINS.sourcePackageDigest)
    expect(spatialRegistrationDigest(bundle.metadata.dataset.acquisition)).toBe(SPATIAL_REGISTRATION_PINS.sourceAcquisitionReportDigest)
    expect(bundle.metadata.dataset.acquisition.package_verification).toMatchObject({ observed_bytes: 1_916_666_413, full_response_body_hashed: true, matched_lock: true })
    expect(bundle.metadata.attribution.source.dataset_authors).toHaveLength(53)
    expect(bundle.metadata.attribution.citations).toHaveLength(5)
    expect(bundle.metadata.arrays.find((item) => item.array_id === 'ct-intensity-preview')).toMatchObject({ space_id: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', index_zyx_to_space_xyz_mm: [[0, 0, 8, 4], [0, 8, 0, 4], [8, 0, 0, 4], [0, 0, 0, 1]] })
    expect(() => verifySpatialRegistrationSignature(bundle.catalog.payload, bundle.catalog.signature, bundle.trust)).not.toThrow()
    expect(() => verifySpatialRegistrationSignature({ ...bundle.catalog.payload, published_at: '2026-07-18' }, bundle.catalog.signature, bundle.trust)).toThrow('Ed25519 signature is invalid')
  })

  it('recomputes ROI-scoped residual overlap from all 288 evidence chunks and keeps the absent CT left kidney not evaluable', async () => {
    const bundle = await publishedBundle()
    const visited = new Set()
    const metrics = await recomputeSpatialRegistrationResidualOverlap(bundle, async (descriptor) => {
      visited.add(descriptor.path)
      return verifySpatialRegistrationChunkBytes(await readFile(resolve(releaseRoot, descriptor.path)), descriptor).decoded
    })
    expect(visited.size).toBe(288)
    expect(metrics).toMatchObject([
      { anatomy: 'liver', dice: 0.6823498512713702, fixed_mr_voxels: 147_635, moving_ct_voxels: 179_807 },
      { anatomy: 'spleen', dice: 0.6056176293676977 },
      { anatomy: 'right kidney', dice: 0.40082075057953764 },
      { anatomy: 'left kidney', status: 'not-evaluable', dice: null, fixed_mr_voxels: 18_285, moving_ct_voxels: 0 }
    ])
    expect(metrics.every((item) => item.metric.endsWith('within repository-derived evaluation ROI'))).toBe(true)
  })

  it('rejects chunk corruption and incompatible transform boundaries', async () => {
    const bundle = await publishedBundle()
    const descriptor = bundle.inventory.chunks.find((item) => item.array_id === 'evaluation-roi')
    const encoded = await readFile(resolve(releaseRoot, descriptor.path))
    expect(verifySpatialRegistrationChunkBytes(encoded, descriptor).decoded).toHaveLength(descriptor.decoded_bytes)
    const corrupt = Buffer.from(encoded)
    corrupt[corrupt.length - 1] ^= 1
    expect(() => verifySpatialRegistrationChunkBytes(corrupt, descriptor)).toThrow('encoded chunk identity is invalid')

    const selected = selectRegistrationChain(bundle.metadata, bundle.metadata.registration.source_space_id, bundle.metadata.registration.target_space_id)
    expect(applyAffine(selected.matrix, [192, 160, 192])).toEqual([192, 160, 192])
    expect(() => selectRegistrationChain(bundle.metadata, bundle.metadata.registration.source_space_id, bundle.metadata.registration.source_space_id)).toThrow('distinct')
    const incompatible = structuredClone(bundle.metadata)
    incompatible.spaces[1].taxon_id = 'NCBITaxon:10090'
    expect(() => selectRegistrationChain(incompatible, incompatible.registration.source_space_id, incompatible.registration.target_space_id)).toThrow('incompatible')
    const axisMismatch = structuredClone(bundle.metadata)
    axisMismatch.spaces[1].axes = ['z', 'y', 'x']
    expect(() => selectRegistrationChain(axisMismatch, axisMismatch.registration.source_space_id, axisMismatch.registration.target_space_id)).toThrow('axis')
  })

  it('accepts only origin-only loopback HTTP producer URLs', () => {
    expect(validateSpatialRegistrationLoopbackUrl('http://127.0.0.1:8000')).toBe('http://127.0.0.1:8000')
    expect(() => validateSpatialRegistrationLoopbackUrl('https://127.0.0.1:8000')).toThrow('restricted')
    expect(() => validateSpatialRegistrationLoopbackUrl('http://localhost:8000')).toThrow('restricted')
    expect(() => validateSpatialRegistrationLoopbackUrl('http://127.0.0.1:8000/path')).toThrow('restricted')
  })

  it('rejects future acquisition, publication, and signature times through every exported verification path using one injected clock', async () => {
    const now = () => '2026-07-17T20:28:34Z'
    const trustBytes = await readFile(resolve(producerRoot, 'trust/keys.json'))
    const catalogBytes = await readFile(resolve(producerRoot, 'catalog.envelope.json'))
    const manifestBytes = await readFile(resolve(releaseRoot, 'manifest.json'))
    const envelopeBytes = await readFile(resolve(releaseRoot, 'envelope.json'))
    const trust = verifySpatialRegistrationTrust(trustBytes)
    const bundle = await publishedBundle()

    expect(() => verifySpatialRegistrationSignature(bundle.catalog.payload, bundle.catalog.signature, trust, now)).toThrow('signature time is in the future')
    expect(() => verifySpatialRegistrationCatalog(catalogBytes, trust, now)).toThrow('catalog publication time is in the future')
    expect(() => verifySpatialRegistrationManifest(manifestBytes, now)).toThrow('manifest publication time is in the future')
    expect(() => verifySpatialRegistrationEnvelope(envelopeBytes, trust, now)).toThrow('release signature time is in the future')
    expect(() => verifySpatialRegistrationBundle(bundle, now)).toThrow('catalog publication time is in the future')
    expect(() => verifySpatialRegistrationBundle(bundle, null)).toThrow('requires an injectable clock')

    const root = await mkdtemp(resolve(tmpdir(), 'future-spatial-registration-consumer-'))
    const service = await createSpatialRegistrationService({ root, env: {}, client: { synchronize: async () => bundle }, now })
    try {
      await expect(service.sync()).rejects.toThrow('catalog publication time is in the future')
    } finally {
      await service.close()
      await rm(root, { recursive: true, force: true })
    }
  })

  it('executes the exact inverse and classifies fractional coordinates as off-grid without rejecting the transform', async () => {
    const root = await mkdtemp(resolve(tmpdir(), 'spatial-registration-consumer-'))
    const bundle = await publishedBundle()
    const service = await createSpatialRegistrationService({ root, env: {}, client: { synchronize: async () => bundle }, now: () => '2026-07-17T20:32:14Z' })
    try {
      await service.sync()
      const forward = await service.transform({ sourceSpaceId: bundle.metadata.registration.source_space_id, targetSpaceId: bundle.metadata.registration.target_space_id, pointXyzMm: [1, 0, 0] })
      expect(forward).toMatchObject({ direction: 'forward', outputPointXyzMm: [1, 0, 0], sourceVoxelXyz: [0.5, 0, 0], evaluationRoiMembership: 'not-assessed-off-grid', cacheSource: null })
      const inverse = await service.transform({ sourceSpaceId: bundle.metadata.registration.target_space_id, targetSpaceId: bundle.metadata.registration.source_space_id, pointXyzMm: [1, 0, 0] })
      expect(inverse).toMatchObject({ direction: 'inverse', outputPointXyzMm: [1, 0, 0], sourceVoxelXyz: [0.5, 0, 0], evaluationRoiMembership: 'not-assessed-off-grid', inverseStatus: 'available-exact' })
    } finally {
      await service.close()
      await rm(root, { recursive: true, force: true })
    }
  })
})
