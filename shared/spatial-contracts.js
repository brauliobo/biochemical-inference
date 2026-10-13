import { z } from 'zod'
import { Sha256HexSchema, IsoDateSchema, HumanMouseTaxonSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema, pinnedReleaseRefSchema, pinnedCatalogEntrySchema, releaseItemsEnvelopeSchema } from './commons/schemas.js'

export const SPATIAL_RELEASE_ID = 'apap-liver-spatial-benchmark-v1.0.0'
export const SPATIAL_RELEASE_DIGEST = 'fd838be6771c61b79eb97561320ffee8096f538e31ec769480c0a4979101290b'
export const SPATIAL_CONTRACT_VERSION = '1.0.0'
export const SPATIAL_MAX_CONTENT_BYTES = 1_048_576
export const SPATIAL_APPLICABILITY = 'algorithm-testing-only; not reference anatomy'

const StructureIdSchema = z.string().regex(/^STRUCTURE:(?:HUMAN|MOUSE)-(?:LIVER|HEPATOCYTE)$/)
const SpaceIdSchema = z.string().regex(/^SPACE:(?:HUMAN|MOUSE)-LOBULE-(?:LOCAL|WORLD)$/)
const TransformIdSchema = z.string().regex(/^TRANSFORM:(?:HUMAN|MOUSE)-LOCAL-TO-WORLD$/)
export const SpatialAssetIdSchema = z.string().regex(/^ASSET:(?:HUMAN|MOUSE)-(?:LOBULE-MESH|HEPATOCYTE-INSTANCES|APAP-FIELD)$/)
export const SpatialContentIdSchema = z.string().regex(/^CONTENT:(?:HUMAN|MOUSE)-(?:LOBULE-MESH|HEPATOCYTE-INSTANCES|APAP-FIELD-L[01])$/)
const DescriptorIdSchema = z.string().regex(/^DESCRIPTOR:(?:HUMAN|MOUSE)-(?:LOBULE-MESH|HEPATOCYTE-INSTANCES|APAP-FIELD)$/)
const SourceIdSchema = z.enum(['NCBI_TAXONOMY', 'UBERON', 'CELL_ONTOLOGY', 'SYNTHETIC_SPATIAL'])
const LicenseIdSchema = z.enum(['NCBI-TERMS', 'CC-BY-3.0', 'CC-BY-4.0', 'CC0-1.0'])
const ApplicabilitySchema = z.literal(SPATIAL_APPLICABILITY)
const expectedTaxon = (id) => id.includes(':HUMAN-') ? 'NCBITaxon:9606' : 'NCBITaxon:10090'
const sameSpecies = (...ids) => ids.every((id) => id.includes(':HUMAN-')) || ids.every((id) => id.includes(':MOUSE-'))

export const SpatialReleaseRefSchema = pinnedReleaseRefSchema(SPATIAL_RELEASE_ID, SPATIAL_CONTRACT_VERSION, SPATIAL_RELEASE_DIGEST)

const CatalogEntrySchema = pinnedCatalogEntrySchema({ releaseId: SPATIAL_RELEASE_ID, schemaVersion: SPATIAL_CONTRACT_VERSION, releaseDigest: SPATIAL_RELEASE_DIGEST, title: z.literal('Immutable synthetic APAP liver spatial benchmark') })

export const SpatialCatalogSchema = z.object({
  catalog_schema_version: z.literal(SPATIAL_CONTRACT_VERSION),
  releases: z.array(CatalogEntrySchema).length(1)
}).strict()

export const SpatialStructureSchema = z.object({
  id: StructureIdSchema,
  taxon_id: HumanMouseTaxonSchema,
  ontology_id: z.enum(['UBERON:0002107', 'CL:0000182']),
  label: z.enum(['liver', 'hepatocyte']),
  structure_class: z.enum(['organ', 'cell']),
  parent_id: StructureIdSchema.nullable(),
  source_id: z.enum(['UBERON', 'CELL_ONTOLOGY']),
  verified_anchor: z.literal(true),
  spatial_representation: z.literal('ontology anchor only; associated geometry is repository-authored synthetic benchmark data')
}).strict().superRefine((structure, context) => {
  if (structure.taxon_id !== expectedTaxon(structure.id) || (structure.parent_id && !sameSpecies(structure.id, structure.parent_id))) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Structure identifiers cannot cross taxa.' })
  if ((structure.structure_class === 'organ') !== (structure.parent_id === null)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Only the organ structure may be parentless.' })
})

const AxisSchema = z.object({
  name: z.enum(['x', 'y', 'z']),
  lower: FiniteNumberSchema,
  upper: FiniteNumberSchema
}).strict().refine((axis) => axis.lower < axis.upper, 'Axis bounds must be ordered.')

export const SpatialSpaceSchema = z.object({
  id: SpaceIdSchema,
  name: NonEmptyStringSchema,
  taxon_id: HumanMouseTaxonSchema,
  coordinate_system: z.literal('right-handed-cartesian'),
  dimensions: z.literal(3),
  axes: z.tuple([AxisSchema, AxisSchema, AxisSchema]),
  unit: z.literal('micrometer'),
  origin: z.literal('repository-authored synthetic lobule benchmark'),
  reference_anatomy: z.literal(false),
  applicability: ApplicabilitySchema
}).strict().superRefine((space, context) => {
  if (space.axes.map((axis) => axis.name).join(',') !== 'x,y,z') context.addIssue({ code: z.ZodIssueCode.custom, message: 'Spatial axes must be xyz ordered.' })
  if (space.taxon_id !== expectedTaxon(space.id)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Coordinate spaces cannot cross taxa.' })
})

const MatrixRowSchema = z.tuple([FiniteNumberSchema, FiniteNumberSchema, FiniteNumberSchema, FiniteNumberSchema])
export const SpatialTransformSchema = z.object({
  id: TransformIdSchema,
  source_space_id: SpaceIdSchema,
  target_space_id: SpaceIdSchema,
  taxon_id: HumanMouseTaxonSchema,
  transform_type: z.literal('affine-4x4'),
  matrix: z.tuple([MatrixRowSchema, MatrixRowSchema, MatrixRowSchema, MatrixRowSchema]),
  source_unit: z.literal('micrometer'),
  target_unit: z.literal('micrometer'),
  inverse_required: z.literal(true),
  applicability: ApplicabilitySchema
}).strict().superRefine((transform, context) => {
  if (!transform.matrix[3].every((value, index) => value === [0, 0, 0, 1][index])) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Transform must be affine.' })
  if (transform.taxon_id !== expectedTaxon(transform.id) || !sameSpecies(transform.id, transform.source_space_id, transform.target_space_id)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Transforms cannot cross taxa.' })
})

export const SpatialAssetSchema = z.object({
  id: SpatialAssetIdSchema,
  name: NonEmptyStringSchema,
  asset_type: z.enum(['geometry', 'instances', 'scalar-field']),
  taxon_id: HumanMouseTaxonSchema,
  structure_id: StructureIdSchema,
  coordinate_space_id: SpaceIdSchema,
  descriptor_id: DescriptorIdSchema,
  content_ids: z.array(SpatialContentIdSchema).min(1).max(2),
  source_id: z.literal('SYNTHETIC_SPATIAL'),
  license_id: z.literal('CC0-1.0'),
  synthetic: z.literal(true),
  reference_anatomy: z.literal(false),
  applicability: ApplicabilitySchema
}).strict().superRefine((asset, context) => {
  if (asset.taxon_id !== expectedTaxon(asset.id) || !sameSpecies(asset.id, asset.structure_id, asset.coordinate_space_id, asset.descriptor_id, ...asset.content_ids)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Assets cannot cross taxa.' })
})

export const SpatialMissingValuePolicySchema = z.object({
  mode: z.enum(['forbidden', 'sentinel']),
  sentinel: FiniteNumberSchema.nullable(),
  meaning: NonEmptyStringSchema
}).strict().refine((policy) => (policy.mode === 'sentinel') === (policy.sentinel !== null), 'Sentinel must match the policy mode.')

const LevelSchema = z.object({
  level: z.number().int().min(0).max(8),
  dimensions: z.tuple([PositiveIntSchema, PositiveIntSchema, PositiveIntSchema]),
  scale: z.tuple([FiniteNumberSchema.positive(), FiniteNumberSchema.positive(), FiniteNumberSchema.positive()]),
  content_id: SpatialContentIdSchema
}).strict()

export const SpatialDescriptorSchema = z.object({
  id: DescriptorIdSchema,
  asset_id: SpatialAssetIdSchema,
  data_kind: z.enum(['triangular-mesh', 'point-instances', 'scalar-grid']),
  coordinate_space_id: SpaceIdSchema,
  spatial_dimensions: z.literal(3),
  dimension_labels: z.tuple([NonEmptyStringSchema, NonEmptyStringSchema, NonEmptyStringSchema]),
  coordinate_unit: z.literal('micrometer'),
  value_unit: z.enum(['1', 'instance-id', 'not-applicable']),
  interpolation: z.enum(['none', 'nearest', 'linear']),
  missing_value_policy: SpatialMissingValuePolicySchema,
  uncertainty: z.object({ kind: z.literal('exact-synthetic'), value: z.literal(0), unit: z.enum(['micrometer', '1', 'instance-id', 'not-applicable']), statement: NonEmptyStringSchema }).strict(),
  levels: z.array(LevelSchema).min(1).max(2),
  applicability: ApplicabilitySchema
}).strict().superRefine((descriptor, context) => {
  if (descriptor.levels.some((level, index) => level.level !== index)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'LOD levels must be contiguous.' })
  if (!sameSpecies(descriptor.id, descriptor.asset_id, descriptor.coordinate_space_id, ...descriptor.levels.map((level) => level.content_id))) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Descriptors cannot cross taxa.' })
})

export const SpatialMappingSchema = z.object({
  id: z.string().regex(/^MAPPING:(?:HUMAN|MOUSE)-[A-Z-]+$/),
  mapping_type: z.enum(['synthetic-registration', 'reference-anatomy']),
  source_space_id: SpaceIdSchema,
  target_space_id: SpaceIdSchema.nullable(),
  transform_id: TransformIdSchema.nullable(),
  source_taxon_id: HumanMouseTaxonSchema,
  target_taxon_id: HumanMouseTaxonSchema.nullable(),
  target_system: z.enum(['synthetic-benchmark', 'HRA']),
  status: z.enum(['available', 'unavailable']),
  compatibility: z.enum(['same-taxon-only', 'human-reference-unavailable']),
  reason: NonEmptyStringSchema,
  source_id: z.literal('SYNTHETIC_SPATIAL'),
  applicability: ApplicabilitySchema
}).strict().superRefine((mapping, context) => {
  if (mapping.target_system === 'HRA' && (mapping.status !== 'unavailable' || mapping.target_space_id !== null || mapping.transform_id !== null || mapping.source_taxon_id !== 'NCBITaxon:9606')) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'HRA must remain unavailable and human-only.' })
  }
  if (mapping.status === 'available' && (!mapping.target_space_id || !mapping.transform_id || mapping.source_taxon_id !== mapping.target_taxon_id)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Available mappings must remain same-taxon and complete.' })
  }
  if (mapping.source_taxon_id !== expectedTaxon(mapping.source_space_id) || (mapping.target_space_id && !sameSpecies(mapping.source_space_id, mapping.target_space_id, mapping.transform_id))) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Mappings cannot cross taxa.' })
})

export const SpatialContentItemSchema = z.object({
  id: SpatialContentIdSchema,
  asset_id: SpatialAssetIdSchema,
  level: z.number().int().min(0).max(8),
  path: z.string().regex(/^content\/[a-z0-9][a-z0-9._/-]+$/),
  sha256: Sha256HexSchema,
  bytes: PositiveIntSchema.max(SPATIAL_MAX_CONTENT_BYTES),
  media_type: z.enum(['model/obj', 'text/csv']),
  encoding: z.literal('utf-8'),
  role: z.enum(['geometry', 'instances', 'field-level'])
}).strict().superRefine((item, context) => {
  if (!sameSpecies(item.id, item.asset_id)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Content cannot cross asset taxa.' })
})

const ManifestFileSchema = z.object({
  path: z.string().regex(/^[a-z][a-z0-9_]*\.json$/),
  record_type: z.enum(['structures', 'spaces', 'transforms', 'assets', 'descriptors', 'mappings', 'inventory']),
  sha256: Sha256HexSchema,
  bytes: PositiveIntSchema,
  record_count: NonNegativeIntSchema
}).strict()

export const SpatialManifestSchema = z.object({
  release_id: z.literal(SPATIAL_RELEASE_ID),
  title: z.literal('Immutable synthetic APAP liver spatial benchmark'),
  schema_version: z.literal(SPATIAL_CONTRACT_VERSION),
  release_digest: z.literal(SPATIAL_RELEASE_DIGEST),
  digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
  published_at: IsoDateSchema,
  immutable: z.literal(true),
  scientific_scope: NonEmptyStringSchema,
  files: z.array(ManifestFileSchema).length(7),
  contents: z.array(SpatialContentItemSchema).length(8),
  record_counts: z.object({ assets: z.literal(6), descriptors: z.literal(6), inventory: z.literal(8), mappings: z.literal(3), spaces: z.literal(4), structures: z.literal(4), transforms: z.literal(2) }).strict(),
  sources: z.array(z.object({ id: SourceIdSchema, name: NonEmptyStringSchema, source_class: z.enum(['identifier-authority', 'synthetic']), version: NonEmptyStringSchema, url: z.string().url(), accessed_at: IsoDateSchema, license_id: LicenseIdSchema, usage: NonEmptyStringSchema }).strict()).length(4),
  licenses: z.array(z.object({ id: LicenseIdSchema, name: NonEmptyStringSchema, url: z.string().url(), redistributable: z.boolean() }).strict()).length(4),
  compatibility: z.object({ consumer: z.literal('biochemical-inference'), spatial_api_contract: z.literal(SPATIAL_CONTRACT_VERSION), coordinate_convention: z.literal('right-handed-cartesian-xyz') }).strict()
}).strict().superRefine((manifest, context) => {
  const types = manifest.files.map((file) => file.record_type).sort().join(',')
  if (types !== 'assets,descriptors,inventory,mappings,spaces,structures,transforms') context.addIssue({ code: z.ZodIssueCode.custom, message: 'Manifest file closure is incomplete.' })
  if (new Set(manifest.contents.map((item) => item.id)).size !== manifest.contents.length) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Content IDs must be unique.' })
})

export const SpatialDetailSchema = z.object({
  release: SpatialReleaseRefSchema,
  manifest: SpatialManifestSchema,
  mappings: z.array(SpatialMappingSchema).length(3),
  inventory: z.array(SpatialContentItemSchema).length(8)
}).strict().superRefine((detail, context) => {
  if (JSON.stringify(detail.inventory) !== JSON.stringify(detail.manifest.contents)) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Manifest contents and inventory differ.' })
  if (!detail.mappings.some((mapping) => mapping.id === 'MAPPING:HUMAN-HRA-UNAVAILABLE')) context.addIssue({ code: z.ZodIssueCode.custom, message: 'Explicit unavailable HRA mapping is required.' })
})

const envelope = (schema) => releaseItemsEnvelopeSchema(SpatialReleaseRefSchema, schema)
export const SpatialStructuresSchema = envelope(SpatialStructureSchema)
export const SpatialSpacesSchema = envelope(SpatialSpaceSchema)
export const SpatialTransformsSchema = envelope(SpatialTransformSchema)
export const SpatialAssetsSchema = envelope(SpatialAssetSchema)
export const SpatialDescriptorsSchema = envelope(SpatialDescriptorSchema)
export const SpatialMappingsSchema = envelope(SpatialMappingSchema)
export const SpatialInventorySchema = envelope(SpatialContentItemSchema)

export const SpatialDiscoverySchema = z.object({
  contractVersion: z.literal(SPATIAL_CONTRACT_VERSION),
  releaseId: z.literal(SPATIAL_RELEASE_ID),
  releaseDigest: z.literal(SPATIAL_RELEASE_DIGEST),
  maxContentBytes: z.literal(SPATIAL_MAX_CONTENT_BYTES),
  syntheticGeometry: z.literal(true),
  hraAvailable: z.literal(false),
  routes: z.object({ catalog: z.string(), release: z.string(), structures: z.string(), spaces: z.string(), transforms: z.string(), assets: z.string(), descriptors: z.string(), mappings: z.string(), inventory: z.string(), content: z.string() }).strict()
}).strict()
