import { z } from 'zod'
import { Sha256HexSchema, UtcInstantSchema, IsoDateSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, StrictEmptyObjectSchema, PageLimitSchema, CoercedNonNegativeIntSchema, pageLimitQuerySchema } from './commons/schemas.js'

export const MEASURED_SPATIAL_CONTRACT = 'measured-spatial/1.0.0'
export const MEASURED_SPATIAL_RELEASE_ID = 'digimouse-measured-liver-atlas-v1.0.0'
export const MEASURED_SPATIAL_CSRF_HEADER = 'x-measured-spatial-csrf'
export const MEASURED_SPATIAL_CSRF_VALUE = 'goal14-measured-spatial-v1'
export const MEASURED_SPATIAL_RECORD_TYPES = Object.freeze([
  'acquisitions',
  'spaces',
  'arrays',
  'labels',
  'registrations',
  'limitations',
  'attribution'
])
export const MEASURED_SPATIAL_CODEC = Object.freeze({
  id: 'gzip',
  specification: 'RFC 1952',
  level: 9,
  mtime: 0,
  header_os: 3,
  implementation_probe_sha256: '676a53aff05d0332d03ae91ae54e0ab34a8a260e2b1840d71fb9d39980648883'
})
export const MEASURED_SPATIAL_ARRAY_PINS = Object.freeze({
  'anatomy-labels:0': Object.freeze({ shapeZyx: Object.freeze([208, 992, 380]), spacingUm: Object.freeze([100, 100, 100]), uncompressedBytes: 78_407_680, uncompressedSha256: '0169aa60143b9dfab042270bf10ec45579cf1dd62b9d72437c99b1703cc0b298', liverVoxels: 2_007_078, chunkCount: 168 }),
  'anatomy-labels:1': Object.freeze({ shapeZyx: Object.freeze([104, 496, 190]), spacingUm: Object.freeze([200, 200, 200]), uncompressedBytes: 9_800_960, uncompressedSha256: '6ecba397ef638d8f9d1b9d581aadb01b871a331470d77e918a6d131b74bc1965', liverVoxels: 248_736, chunkCount: 32 }),
  'liver-mask:0': Object.freeze({ shapeZyx: Object.freeze([208, 992, 380]), spacingUm: Object.freeze([100, 100, 100]), uncompressedBytes: 78_407_680, uncompressedSha256: '2b9608326cd9f2ef3c4998d63c941099df6b71db3206e24f5fb1b894be5f05b9', liverVoxels: 2_007_078, chunkCount: 168 }),
  'liver-mask:1': Object.freeze({ shapeZyx: Object.freeze([104, 496, 190]), spacingUm: Object.freeze([200, 200, 200]), uncompressedBytes: 9_800_960, uncompressedSha256: '5a82200f36c92dd5bb64acd0e04b32dc2b1e34b81ef0f86ea9af5bca2d661222', liverVoxels: 248_736, chunkCount: 32 })
})
export const MEASURED_SPATIAL_PINS = Object.freeze({
  contractFamily: MEASURED_SPATIAL_CONTRACT,
  releaseId: MEASURED_SPATIAL_RELEASE_ID,
  releaseDigest: '9b4ea920b9daa49f23aefe453b88fcd0b13f92dd50c5ebb168c7809d78c22b1b',
  trustDigest: 'f438a720972edf576a37ee12103eac949b84d942126ea97bbd97b40c0f83813f',
  catalogDigest: '8d9197c2f3c964a82392e871efc12b063b46228b4d33e3203aa8528af83eb845',
  manifestDigest: '3a3409e44df84e200e074760bfda4197ec8673dd5bf79b37167b2b83aaf850c0',
  envelopeDigest: '71a5876a50c9a9c2a7a373339ef12002f3fb054bd04095b299ac480560199210',
  metadataDigest: '2244bcb1bf444911cc84655558872ab533725e39e3ecbd544322c0d76a01ad10',
  inventoryDigest: 'fac42ad9b6796d62933dd0b370113404d0c1cb51a4776ebd3c63d20775fcbb9a',
  sourceArchiveDigest: '6f7cbd8a7236a78c47a14c3259d387439c0dc0284b2a83fa955f8c49efe11761',
  sourceLockDigest: '2a74086ebc264a08a868c74214e3fbeeea5839da6def0ca9fd3e669f6f563136',
  recipeDigest: '2e84985cd31f83a08233ed2e1430f852d1be9aa6de4ebf116d36849d2d08d056',
  attributionDigest: '78f89b0df2f80e356b835ee7fd84a02c6bd4aaf6778031ac408802746dc0480b',
  signerKeyId: 'goal14-measured-spatial-2026',
  signerPublicKey: 'LkUc5qudlNruohEvS3Q3cJpmIxNZydvgVS7ugH0wNT8',
  signedAt: '2026-07-17T00:00:00Z',
  chunkCount: 400,
  encodedChunkBytes: 1_003_982,
  decodedChunkBytes: 524_288
})

export const MeasuredSpatialSha256Schema = Sha256HexSchema
export const MeasuredSpatialRecordTypeSchema = z.enum(MEASURED_SPATIAL_RECORD_TYPES)
export const MeasuredSpatialArrayIdSchema = z.enum(['anatomy-labels', 'liver-mask'])
export const MeasuredSpatialLevelSchema = z.union([z.literal(0), z.literal(1)])
const PositiveTripleSchema = z.tuple([PositiveIntSchema.max(10_000), PositiveIntSchema.max(10_000), PositiveIntSchema.max(10_000)])
const NonnegativeTripleSchema = z.tuple([NonNegativeIntSchema.max(10_000), NonNegativeIntSchema.max(10_000), NonNegativeIntSchema.max(10_000)])
const BoundsSchema = z.tuple([NonnegativeTripleSchema, NonnegativeTripleSchema]).nullable()
const ChunkShapeSchema = z.tuple([z.literal(32), z.literal(128), z.literal(128)])
const sortedUnique = (items, select) => items.every((item, index) => index === 0 || select(items[index - 1]) < select(item))

export const MeasuredSpatialCodecSchema = z.object({
  id: z.literal(MEASURED_SPATIAL_CODEC.id),
  specification: z.literal(MEASURED_SPATIAL_CODEC.specification),
  level: z.literal(MEASURED_SPATIAL_CODEC.level),
  mtime: z.literal(MEASURED_SPATIAL_CODEC.mtime),
  header_os: z.literal(MEASURED_SPATIAL_CODEC.header_os),
  implementation_probe_sha256: z.literal(MEASURED_SPATIAL_CODEC.implementation_probe_sha256)
}).strict()

export const MeasuredSpatialAttributionSchema = z.object({
  attribution_schema_version: z.literal('1.0.0'),
  release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  title: z.literal('Digimouse: A 3D Whole Body Mouse Atlas from CT and Cryosection Data'),
  creators: z.tuple([z.literal('B. Dogdas'), z.literal('D. Stout'), z.literal('A. Chatziioannou'), z.literal('R. M. Leahy')]),
  doi: z.literal('10.1088/0031-9155/52/3/003'),
  source_url: z.literal('https://neuroimage.usc.edu/neuro/Digimouse'),
  license: z.object({
    id: z.literal('CC-BY-SA-4.0'),
    name: z.literal('Creative Commons Attribution-ShareAlike 4.0 International'),
    url: z.literal('https://creativecommons.org/licenses/by-sa/4.0/'),
    redistribution: z.literal('permitted'),
    share_alike: z.literal(true),
    warranty_disclaimer: NonEmptyStringSchema.max(2048),
    no_endorsement: NonEmptyStringSchema.max(2048)
  }).strict(),
  modifications: z.tuple([
    z.literal('Analyze extraction'),
    z.literal('explicit axis declaration'),
    z.literal('two-level mode pyramid'),
    z.literal('liver-value extraction'),
    z.literal('binary mask generation'),
    z.literal('chunk padding'),
    z.literal('deterministic compression')
  ]),
  adapted_material_license: z.literal('CC-BY-SA-4.0'),
  software_license_boundary: NonEmptyStringSchema.max(2048)
}).strict()

export const MeasuredSpatialAcquisitionSchema = z.object({
  id: z.literal('acquisition:digimouse-atlas'),
  subject_count: z.literal(1),
  subject: z.object({
    species: z.literal('Mus musculus'),
    taxon_id: z.literal('NCBITaxon:10090'),
    strain: z.literal('nude'),
    sex: z.literal('male'),
    mass_g: z.literal(28),
    state: z.literal('post-mortem')
  }).strict(),
  modalities_used_to_create_atlas: z.tuple([z.literal('CT'), z.literal('cryosection')]),
  source_archive_sha256: z.literal(MEASURED_SPATIAL_PINS.sourceArchiveDigest),
  raw_modalities_included: z.literal(false)
}).strict()

export const MeasuredSpatialSpaceSchema = z.object({
  id: z.literal('SPACE:DIGIMOUSE-ATLAS'),
  dimensions: z.literal(3),
  axes: z.tuple([z.literal('z'), z.literal('y'), z.literal('x')]),
  unit: z.literal('micrometer'),
  axis_polarity: z.literal('unreported'),
  physical_origin: z.literal('unreported'),
  reference_anatomy: z.literal('measured-derived-whole-body-atlas')
}).strict()

export const MeasuredSpatialArraySchema = z.object({
  id: z.string().regex(/^(anatomy-labels|liver-mask):[01]$/),
  array_id: MeasuredSpatialArrayIdSchema,
  kind: z.enum(['anatomical-labels', 'binary-mask']),
  level: MeasuredSpatialLevelSchema,
  shape_zyx: PositiveTripleSchema,
  spacing_um: PositiveTripleSchema,
  dtype: z.literal('|u1'),
  order: z.literal('C'),
  chunks_zyx: ChunkShapeSchema,
  fill_value: z.literal(0),
  dimension_separator: z.literal('.'),
  zarr_format: z.literal(2),
  compressor: MeasuredSpatialCodecSchema,
  uncompressed_bytes: PositiveIntSchema.max(100_000_000),
  uncompressed_sha256: MeasuredSpatialSha256Schema,
  liver_voxels: NonNegativeIntSchema.max(100_000_000),
  liver_bounds_xyz: BoundsSchema
}).strict().superRefine((value, context) => {
  const pin = MEASURED_SPATIAL_ARRAY_PINS[value.id]
  const expectedKind = value.array_id === 'anatomy-labels' ? 'anatomical-labels' : 'binary-mask'
  if (!pin || value.id !== `${value.array_id}:${value.level}` || value.kind !== expectedKind || JSON.stringify(value.shape_zyx) !== JSON.stringify(pin.shapeZyx) || JSON.stringify(value.spacing_um) !== JSON.stringify(pin.spacingUm) || value.uncompressed_bytes !== pin.uncompressedBytes || value.uncompressed_sha256 !== pin.uncompressedSha256 || value.liver_voxels !== pin.liverVoxels) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Measured-spatial array does not match its independent identity pin.' })
  }
})

export const MeasuredSpatialLabelSchema = z.object({
  value: z.literal(18),
  name: z.literal('liver'),
  anatomy_id: z.literal('UBERON:0002107'),
  taxon_id: z.literal('NCBITaxon:10090')
}).strict()

export const MeasuredSpatialRegistrationSchema = z.object({
  id: z.literal('registration:digimouse-to-mouse-lobule-local'),
  source_space_id: z.literal('SPACE:DIGIMOUSE-ATLAS'),
  target_space_id: z.literal('SPACE:MOUSE-LOBULE-LOCAL'),
  status: z.literal('unavailable'),
  transform: z.null(),
  inverse: z.null(),
  landmarks: z.null(),
  quality_metrics: z.null(),
  valid_region: z.null(),
  reason: z.literal('The source archive provides no transform, deformation field, landmarks, quality metrics, valid region, or inverse to SPACE:MOUSE-LOBULE-LOCAL.')
}).strict()

export const MeasuredSpatialMetadataSchema = z.object({
  metadata_schema_version: z.literal('1.0.0'),
  release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  acquisition: MeasuredSpatialAcquisitionSchema,
  spaces: z.tuple([MeasuredSpatialSpaceSchema]),
  arrays: z.array(MeasuredSpatialArraySchema).length(4),
  labels: z.tuple([MeasuredSpatialLabelSchema]),
  registrations: z.tuple([MeasuredSpatialRegistrationSchema]),
  limitations: z.tuple([
    z.literal('Axis polarity, physical origin, registration uncertainty, and quantitative registration quality are unreported.'),
    z.literal('No raw CT, raw cryosections, PET, registered intensity volume, mesh, HRA placement, APAP value, or executable registration transform is included.'),
    z.literal('The atlas represents one normal nude male mouse and is not population anatomy.')
  ]),
  attribution: MeasuredSpatialAttributionSchema
}).strict().refine((value) => value.arrays.map((item) => item.id).sort().join() === Object.keys(MEASURED_SPATIAL_ARRAY_PINS).sort().join(), 'Measured-spatial metadata array closure is incomplete.')

export const MeasuredSpatialChunkSchema = z.object({
  array_id: MeasuredSpatialArrayIdSchema,
  level: MeasuredSpatialLevelSchema,
  grid_zyx: NonnegativeTripleSchema,
  voxel_origin_zyx: NonnegativeTripleSchema,
  voxel_shape_zyx: PositiveTripleSchema,
  stored_shape_zyx: ChunkShapeSchema,
  path: z.string().regex(/^arrays\/(anatomy-labels|liver-mask)\/[01]\/[0-9]+\.[0-9]+\.[0-9]+$/),
  codec: z.literal('gzip-level-9-mtime-0'),
  media_type: z.literal('application/vnd.zarr.chunk'),
  encoded_bytes: PositiveIntSchema.max(1024 * 1024),
  encoded_sha256: MeasuredSpatialSha256Schema,
  decoded_bytes: z.literal(MEASURED_SPATIAL_PINS.decodedChunkBytes),
  decoded_sha256: MeasuredSpatialSha256Schema
}).strict().refine((value) => value.path === `arrays/${value.array_id}/${value.level}/${value.grid_zyx.join('.')}` && value.voxel_origin_zyx.every((item, index) => item === value.grid_zyx[index] * value.stored_shape_zyx[index]) && value.voxel_shape_zyx.every((item, index) => item <= value.stored_shape_zyx[index]), 'Measured-spatial chunk path, grid, origin, and shape identity mismatch.')

export const MeasuredSpatialInventorySchema = z.object({
  inventory_schema_version: z.literal('1.0.0'),
  release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  codec: MeasuredSpatialCodecSchema,
  chunks: z.array(MeasuredSpatialChunkSchema).length(MEASURED_SPATIAL_PINS.chunkCount)
}).strict().refine((value) => sortedUnique(value.chunks, (item) => item.path), 'Measured-spatial chunk inventory must be uniquely sorted.')

const ManifestFileSchema = z.object({
  path: NonEmptyStringSchema.max(512).regex(/^(?!\/)(?!.*(?:^|\/)\.\.?(?:\/|$))[A-Za-z0-9._/-]+$/),
  role: z.enum(['metadata', 'zarr-metadata', 'chunk-inventory', 'chunk']),
  bytes: PositiveIntSchema.max(16 * 1024 * 1024),
  sha256: MeasuredSpatialSha256Schema
}).strict()

export const MeasuredSpatialManifestSchema = z.object({
  manifest_schema_version: z.literal('1.0.0'),
  release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  title: NonEmptyStringSchema.max(256),
  contract_family: z.literal(MEASURED_SPATIAL_CONTRACT),
  release_digest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
  digest_algorithm: z.literal('sha256-rfc8785-manifest-v1'),
  published_at: z.literal('2026-07-17'),
  immutable: z.literal(true),
  taxon_id: z.literal('NCBITaxon:10090'),
  source_archive_sha256: z.literal(MEASURED_SPATIAL_PINS.sourceArchiveDigest),
  source_lock_path: z.string().regex(/^sources\/locks\/[a-z0-9.-]+\.json$/),
  source_lock_sha256: z.literal(MEASURED_SPATIAL_PINS.sourceLockDigest),
  recipe_path: z.string().regex(/^recipes\/[a-z0-9.-]+\.json$/),
  recipe_sha256: z.literal(MEASURED_SPATIAL_PINS.recipeDigest),
  attribution_path: z.string().regex(/^attribution\/[a-z0-9.-]+\.json$/),
  attribution_sha256: z.literal(MEASURED_SPATIAL_PINS.attributionDigest),
  metadata_path: z.literal('metadata.json'),
  chunk_inventory_path: z.literal('chunk-inventory.json'),
  chunk_count: z.literal(MEASURED_SPATIAL_PINS.chunkCount),
  files: z.array(ManifestFileSchema).length(408)
}).strict().refine((value) => sortedUnique(value.files, (item) => item.path), 'Measured-spatial manifest files must be uniquely sorted.')

const SignatureSchema = z.object({
  algorithm: z.literal('Ed25519'),
  key_id: z.literal(MEASURED_SPATIAL_PINS.signerKeyId),
  signed_at: z.literal(MEASURED_SPATIAL_PINS.signedAt),
  value: z.string().regex(/^[A-Za-z0-9_-]{86}$/)
}).strict()

export const MeasuredSpatialTrustSchema = z.object({
  trust_schema_version: z.literal('1.0.0'),
  keys: z.tuple([z.object({
    algorithm: z.literal('Ed25519'),
    key_id: z.literal(MEASURED_SPATIAL_PINS.signerKeyId),
    public_key: z.literal(MEASURED_SPATIAL_PINS.signerPublicKey),
    status: z.literal('retired'),
    valid_from: z.literal('2026-07-17'),
    valid_until: z.literal('2026-07-17'),
    reason: NonEmptyStringSchema.max(1024)
  }).strict()])
}).strict()

export const MeasuredSpatialEnvelopeSchema = z.object({
  envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({
    release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
    contract_family: z.literal(MEASURED_SPATIAL_CONTRACT),
    release_digest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
    manifest_sha256: z.literal(MEASURED_SPATIAL_PINS.manifestDigest),
    source_archive_sha256: z.literal(MEASURED_SPATIAL_PINS.sourceArchiveDigest)
  }).strict(),
  signature: SignatureSchema
}).strict()

export const MeasuredSpatialCatalogSchema = z.object({
  catalog_envelope_schema_version: z.literal('1.0.0'),
  payload: z.object({
    catalog_version: z.literal('1.0.0'),
    published_at: z.literal('2026-07-17'),
    releases: z.tuple([z.object({
      release_id: z.literal(MEASURED_SPATIAL_RELEASE_ID),
      contract_family: z.literal(MEASURED_SPATIAL_CONTRACT),
      release_digest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
      manifest_sha256: z.literal(MEASURED_SPATIAL_PINS.manifestDigest),
      envelope_sha256: z.literal(MEASURED_SPATIAL_PINS.envelopeDigest),
      chunk_count: z.literal(MEASURED_SPATIAL_PINS.chunkCount)
    }).strict()])
  }).strict(),
  signature: SignatureSchema
}).strict()

export const MeasuredSpatialProducerDiscoverySchema = z.object({
  contract_family: z.literal(MEASURED_SPATIAL_CONTRACT),
  release_count: z.literal(1),
  routes: z.array(z.string()).length(8)
}).strict()

export const MeasuredSpatialProducerRecordPageSchema = z.object({
  record_type: MeasuredSpatialRecordTypeSchema,
  offset: z.literal(0),
  limit: z.literal(100),
  total: z.number().int().min(1).max(4),
  items: z.array(z.unknown()).min(1).max(4)
}).strict()

export const MeasuredSpatialProducerChunkPageSchema = z.object({
  offset: NonNegativeIntSchema.max(300),
  limit: z.literal(100),
  total: z.literal(MEASURED_SPATIAL_PINS.chunkCount),
  items: z.array(MeasuredSpatialChunkSchema).length(100)
}).strict()

export const MeasuredSpatialBundleSchema = z.object({
  discovery: MeasuredSpatialProducerDiscoverySchema,
  trust: MeasuredSpatialTrustSchema,
  catalog: MeasuredSpatialCatalogSchema,
  manifest: MeasuredSpatialManifestSchema,
  envelope: MeasuredSpatialEnvelopeSchema,
  metadata: MeasuredSpatialMetadataSchema,
  inventory: MeasuredSpatialInventorySchema
}).strict()

export const MeasuredSpatialStatusSchema = z.object({
  state: z.enum(['empty', 'ready', 'failed']),
  integrity: z.enum(['empty', 'valid', 'failed']),
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID).nullable(),
  cachedChunks: z.number().int().min(0).max(MEASURED_SPATIAL_PINS.chunkCount),
  totalChunks: z.literal(MEASURED_SPATIAL_PINS.chunkCount),
  offlineComplete: z.boolean(),
  lastError: z.string().nullable()
}).strict()

const PinSchema = z.object({
  contractFamily: z.literal(MEASURED_SPATIAL_CONTRACT),
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  releaseDigest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
  trustDigest: z.literal(MEASURED_SPATIAL_PINS.trustDigest),
  catalogDigest: z.literal(MEASURED_SPATIAL_PINS.catalogDigest),
  manifestDigest: z.literal(MEASURED_SPATIAL_PINS.manifestDigest),
  envelopeDigest: z.literal(MEASURED_SPATIAL_PINS.envelopeDigest),
  metadataDigest: z.literal(MEASURED_SPATIAL_PINS.metadataDigest),
  inventoryDigest: z.literal(MEASURED_SPATIAL_PINS.inventoryDigest),
  sourceArchiveDigest: z.literal(MEASURED_SPATIAL_PINS.sourceArchiveDigest),
  sourceLockDigest: z.literal(MEASURED_SPATIAL_PINS.sourceLockDigest),
  recipeDigest: z.literal(MEASURED_SPATIAL_PINS.recipeDigest),
  attributionDigest: z.literal(MEASURED_SPATIAL_PINS.attributionDigest),
  signerKeyId: z.literal(MEASURED_SPATIAL_PINS.signerKeyId),
  signerPublicKey: z.literal(MEASURED_SPATIAL_PINS.signerPublicKey),
  signedAt: z.literal(MEASURED_SPATIAL_PINS.signedAt),
  chunkCount: z.literal(MEASURED_SPATIAL_PINS.chunkCount),
  encodedChunkBytes: z.literal(MEASURED_SPATIAL_PINS.encodedChunkBytes),
  decodedChunkBytes: z.literal(MEASURED_SPATIAL_PINS.decodedChunkBytes)
}).strict()

export const MeasuredSpatialDiscoverySchema = z.object({
  contractVersion: z.literal('1.0.0'),
  mode: z.literal('bounded-measured-atlas-consumer'),
  pins: PinSchema,
  arrays: z.record(z.string(), z.object({
    shapeZyx: PositiveTripleSchema,
    spacingUm: PositiveTripleSchema,
    uncompressedBytes: PositiveIntSchema,
    uncompressedSha256: MeasuredSpatialSha256Schema,
    liverVoxels: NonNegativeIntSchema,
    chunkCount: PositiveIntSchema
  }).strict()),
  status: MeasuredSpatialStatusSchema,
  registration: z.literal('unavailable'),
  webglRequired: z.literal(false),
  goal14Complete: z.literal(false),
  routes: z.object({
    status: z.literal('/api/v12/measured-spatial/status'),
    sync: z.literal('/api/v12/measured-spatial/sync'),
    records: z.literal('/api/v12/measured-spatial/records/{recordType}'),
    inventory: z.literal('/api/v12/measured-spatial/chunks'),
    chunk: z.literal('/api/v12/measured-spatial/chunks/{arrayId}/{level}/{z}/{y}/{x}'),
    offlineCompletion: z.literal('/api/v12/measured-spatial/offline-completion'),
    integrity: z.literal('/api/v12/measured-spatial/integrity')
  }).strict()
}).strict()

export const MeasuredSpatialLocalRecordPageSchema = z.object({
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  releaseDigest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
  recordType: MeasuredSpatialRecordTypeSchema,
  items: z.array(z.unknown()).min(1).max(4)
}).strict()

export const MeasuredSpatialLocalChunkPageSchema = z.object({
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  releaseDigest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
  arrayId: MeasuredSpatialArrayIdSchema.nullable(),
  level: MeasuredSpatialLevelSchema.nullable(),
  offset: NonNegativeIntSchema,
  limit: PageLimitSchema,
  total: NonNegativeIntSchema.max(MEASURED_SPATIAL_PINS.chunkCount),
  items: z.array(MeasuredSpatialChunkSchema).max(100)
}).strict()

export const MeasuredSpatialOfflineCompletionSchema = z.object({
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID),
  releaseDigest: z.literal(MEASURED_SPATIAL_PINS.releaseDigest),
  verifiedChunks: z.literal(MEASURED_SPATIAL_PINS.chunkCount),
  encodedBytes: z.literal(MEASURED_SPATIAL_PINS.encodedChunkBytes),
  encodedAndDecodedVerified: z.literal(true),
  networkAccessRequiredForReplay: z.literal(false),
  completedAt: UtcInstantSchema
}).strict()

export const MeasuredSpatialIntegritySchema = z.object({
  status: z.enum(['empty', 'valid', 'failed']),
  releaseId: z.literal(MEASURED_SPATIAL_RELEASE_ID).nullable(),
  metadataVerified: z.boolean(),
  cachedChunks: z.number().int().min(0).max(MEASURED_SPATIAL_PINS.chunkCount),
  verifiedEncodedChunks: z.number().int().min(0).max(MEASURED_SPATIAL_PINS.chunkCount),
  verifiedDecodedChunks: z.number().int().min(0).max(MEASURED_SPATIAL_PINS.chunkCount),
  offlineComplete: z.boolean(),
  networkAccess: z.literal(false),
  findings: z.array(z.string()).max(20)
}).strict()

export const MeasuredSpatialChunkParamSchema = z.object({
  arrayId: MeasuredSpatialArrayIdSchema,
  level: z.coerce.number().pipe(MeasuredSpatialLevelSchema),
  z: CoercedNonNegativeIntSchema.max(10_000),
  y: CoercedNonNegativeIntSchema.max(10_000),
  x: CoercedNonNegativeIntSchema.max(10_000)
}).strict()

export const MeasuredSpatialChunkQuerySchema = z.object({
  array_id: MeasuredSpatialArrayIdSchema.optional(),
  level: z.coerce.number().pipe(MeasuredSpatialLevelSchema).optional(),
  offset: CoercedNonNegativeIntSchema.max(MEASURED_SPATIAL_PINS.chunkCount).default(0),
  limit: pageLimitQuerySchema(100)
}).strict()

export const MeasuredSpatialEmptySchema = StrictEmptyObjectSchema

export const MEASURED_SPATIAL_RECORD_SCHEMAS = Object.freeze({
  acquisitions: MeasuredSpatialAcquisitionSchema,
  spaces: MeasuredSpatialSpaceSchema,
  arrays: MeasuredSpatialArraySchema,
  labels: MeasuredSpatialLabelSchema.extend({ id: z.literal('label:18') }).strict(),
  registrations: MeasuredSpatialRegistrationSchema,
  limitations: z.object({ id: z.string().regex(/^limitation:[0-2]$/), statement: NonEmptyStringSchema }).strict(),
  attribution: MeasuredSpatialAttributionSchema.extend({ id: z.literal('attribution:digimouse') }).strict()
})

export { IsoDateSchema as DateSchema, UtcInstantSchema as InstantSchema }
