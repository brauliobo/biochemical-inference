import { sha256Hex } from '../commons/digest.js'
import {
  SPATIAL_CONTRACT_VERSION,
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

export const FIXTURE_SPATIAL_RELEASE = Object.freeze({ id: SPATIAL_RELEASE_ID, schema_version: SPATIAL_CONTRACT_VERSION, digest: SPATIAL_RELEASE_DIGEST })

const structures = [
  ['HUMAN', '9606', 'LIVER', 'UBERON:0002107', 'liver', 'organ', null, 'UBERON'],
  ['HUMAN', '9606', 'HEPATOCYTE', 'CL:0000182', 'hepatocyte', 'cell', 'STRUCTURE:HUMAN-LIVER', 'CELL_ONTOLOGY'],
  ['MOUSE', '10090', 'LIVER', 'UBERON:0002107', 'liver', 'organ', null, 'UBERON'],
  ['MOUSE', '10090', 'HEPATOCYTE', 'CL:0000182', 'hepatocyte', 'cell', 'STRUCTURE:MOUSE-LIVER', 'CELL_ONTOLOGY']
].map(([species, taxon, suffix, ontology_id, label, structure_class, parent_id, source_id]) => ({
  id: `STRUCTURE:${species}-${suffix}`,
  taxon_id: `NCBITaxon:${taxon}`,
  ontology_id,
  label,
  structure_class,
  parent_id,
  source_id,
  verified_anchor: true,
  spatial_representation: 'ontology anchor only; associated geometry is repository-authored synthetic benchmark data'
}))

const spaceRows = [
  ['HUMAN', '9606', 'LOCAL', 'Synthetic human lobule local space', [[0, 200], [0, 200], [0, 100]]],
  ['HUMAN', '9606', 'WORLD', 'Synthetic human lobule translated world space', [[1000, 1200], [2000, 2200], [3000, 3100]]],
  ['MOUSE', '10090', 'LOCAL', 'Synthetic mouse lobule local space', [[0, 160], [0, 160], [0, 80]]],
  ['MOUSE', '10090', 'WORLD', 'Synthetic mouse lobule translated world space', [[-500, -340], [500, 660], [100, 180]]]
]
const spaces = spaceRows.map(([species, taxon, suffix, name, bounds]) => ({
  id: `SPACE:${species}-LOBULE-${suffix}`,
  name,
  taxon_id: `NCBITaxon:${taxon}`,
  coordinate_system: 'right-handed-cartesian',
  dimensions: 3,
  axes: ['x', 'y', 'z'].map((axis, index) => ({ name: axis, lower: bounds[index][0], upper: bounds[index][1] })),
  unit: 'micrometer',
  origin: 'repository-authored synthetic lobule benchmark',
  reference_anatomy: false,
  applicability: 'algorithm-testing-only; not reference anatomy'
}))

export const PINNED_SPATIAL_TRANSFORMS = Object.freeze([
  { id: 'TRANSFORM:HUMAN-LOCAL-TO-WORLD', source_space_id: 'SPACE:HUMAN-LOBULE-LOCAL', target_space_id: 'SPACE:HUMAN-LOBULE-WORLD', taxon_id: 'NCBITaxon:9606', transform_type: 'affine-4x4', matrix: [[1, 0, 0, 1000], [0, 1, 0, 2000], [0, 0, 1, 3000], [0, 0, 0, 1]], source_unit: 'micrometer', target_unit: 'micrometer', inverse_required: true, applicability: 'algorithm-testing-only; not reference anatomy' },
  { id: 'TRANSFORM:MOUSE-LOCAL-TO-WORLD', source_space_id: 'SPACE:MOUSE-LOBULE-LOCAL', target_space_id: 'SPACE:MOUSE-LOBULE-WORLD', taxon_id: 'NCBITaxon:10090', transform_type: 'affine-4x4', matrix: [[1, 0, 0, -500], [0, 1, 0, 500], [0, 0, 1, 100], [0, 0, 0, 1]], source_unit: 'micrometer', target_unit: 'micrometer', inverse_required: true, applicability: 'algorithm-testing-only; not reference anatomy' }
])

const inventory = [
  ['CONTENT:HUMAN-LOBULE-MESH', 'ASSET:HUMAN-LOBULE-MESH', 0, 'human_lobule.obj', '306dd8cca0e4c1b122543cf68c027edf5ef5019e5b7e71451b6428fc62d15695', 266, 'model/obj', 'geometry'],
  ['CONTENT:HUMAN-HEPATOCYTE-INSTANCES', 'ASSET:HUMAN-HEPATOCYTE-INSTANCES', 0, 'human_hepatocytes.csv', '026a40abe64d49fffe172f181f9b8ebe55c0f1e9bd49f4da678d68767a4f7436', 66, 'text/csv', 'instances'],
  ['CONTENT:HUMAN-APAP-FIELD-L0', 'ASSET:HUMAN-APAP-FIELD', 0, 'human_apap_l0.csv', 'ba425c63b652f2bb1c9b46bd873374571ccd861c13453cc8690a3cf59124f71b', 124, 'text/csv', 'field-level'],
  ['CONTENT:HUMAN-APAP-FIELD-L1', 'ASSET:HUMAN-APAP-FIELD', 1, 'human_apap_l1.csv', 'd217b3be01ae3c4d5303725bdd73534b2860ef6d4088124c281c074ae4ea156d', 30, 'text/csv', 'field-level'],
  ['CONTENT:MOUSE-LOBULE-MESH', 'ASSET:MOUSE-LOBULE-MESH', 0, 'mouse_lobule.obj', 'e9c989d64554994a062298a4637c4a4460889f012c567b5b8fc17f2651b58a5f', 262, 'model/obj', 'geometry'],
  ['CONTENT:MOUSE-HEPATOCYTE-INSTANCES', 'ASSET:MOUSE-HEPATOCYTE-INSTANCES', 0, 'mouse_hepatocytes.csv', 'd06785bdc5759d2aed70ad992588f52e40c12830c4177b49fe0008b22aefc420', 66, 'text/csv', 'instances'],
  ['CONTENT:MOUSE-APAP-FIELD-L0', 'ASSET:MOUSE-APAP-FIELD', 0, 'mouse_apap_l0.csv', '4ac407590004b344209afcf984c990a828550cec39abf9a8f7f2c0bf998a7b40', 131, 'text/csv', 'field-level'],
  ['CONTENT:MOUSE-APAP-FIELD-L1', 'ASSET:MOUSE-APAP-FIELD', 1, 'mouse_apap_l1.csv', '423eaa7101844980a19e2b9ed7ae3471a54cfc2897513818b12f69bfad863ead', 29, 'text/csv', 'field-level']
].map(([id, asset_id, level, path, sha256, bytes, media_type, role]) => ({ id, asset_id, level, path: `content/${path}`, sha256, bytes, media_type, encoding: 'utf-8', role }))

const assets = ['HUMAN', 'MOUSE'].flatMap((species) => {
  const taxon_id = species === 'HUMAN' ? 'NCBITaxon:9606' : 'NCBITaxon:10090'
  const label = species.toLowerCase()
  return [
    { suffix: 'LOBULE-MESH', name: `Synthetic ${label} lobule cuboid mesh`, asset_type: 'geometry', structure: 'LIVER' },
    { suffix: 'HEPATOCYTE-INSTANCES', name: `Synthetic ${label} hepatocyte point instances`, asset_type: 'instances', structure: 'HEPATOCYTE' },
    { suffix: 'APAP-FIELD', name: `Synthetic ${label} dimensionless APAP field`, asset_type: 'scalar-field', structure: 'HEPATOCYTE' }
  ].map(({ suffix, name, asset_type, structure }) => ({
    id: `ASSET:${species}-${suffix}`,
    name,
    asset_type,
    taxon_id,
    structure_id: `STRUCTURE:${species}-${structure}`,
    coordinate_space_id: `SPACE:${species}-LOBULE-LOCAL`,
    descriptor_id: `DESCRIPTOR:${species}-${suffix}`,
    content_ids: inventory.filter((item) => item.asset_id === `ASSET:${species}-${suffix}`).map((item) => item.id),
    source_id: 'SYNTHETIC_SPATIAL',
    license_id: 'CC0-1.0',
    synthetic: true,
    reference_anatomy: false,
    applicability: 'algorithm-testing-only; not reference anatomy'
  }))
})

function descriptor(species, suffix, data_kind, dimension_labels, value_unit, interpolation, missing_value_policy, uncertainty, levels) {
  return {
    id: `DESCRIPTOR:${species}-${suffix}`,
    asset_id: `ASSET:${species}-${suffix}`,
    data_kind,
    coordinate_space_id: `SPACE:${species}-LOBULE-LOCAL`,
    spatial_dimensions: 3,
    dimension_labels,
    coordinate_unit: 'micrometer',
    value_unit,
    interpolation,
    missing_value_policy,
    uncertainty: { kind: 'exact-synthetic', value: 0, ...uncertainty },
    levels,
    applicability: 'algorithm-testing-only; not reference anatomy'
  }
}

const forbiddenMesh = { mode: 'forbidden', sentinel: null, meaning: 'All declared mesh coordinates and indices must be present.' }
const forbiddenInstances = { mode: 'forbidden', sentinel: null, meaning: 'Every synthetic instance has a complete identifier and xyz coordinate.' }
const sentinelField = { mode: 'sentinel', sentinel: -1, meaning: 'A value of -1 would denote outside-domain data; the complete fixture contains no sentinel.' }
const descriptors = ['HUMAN', 'MOUSE'].flatMap((species) => {
  const human = species === 'HUMAN'
  const size = human ? [200, 200, 100] : [160, 160, 80]
  return [
    descriptor(species, 'LOBULE-MESH', 'triangular-mesh', ['vertices', 'triangles', 'coordinates'], 'not-applicable', 'none', forbiddenMesh, { unit: 'not-applicable', statement: 'Exact repository-authored fixture bytes; no biological uncertainty is represented.' }, [{ level: 0, dimensions: [8, 12, 3], scale: [1, 1, 1], content_id: `CONTENT:${species}-LOBULE-MESH` }]),
    descriptor(species, 'HEPATOCYTE-INSTANCES', 'point-instances', ['instances', 'coordinates', 'singleton'], 'instance-id', 'nearest', forbiddenInstances, { unit: 'instance-id', statement: 'Exact synthetic instance fixture; not a measured cell distribution.' }, [{ level: 0, dimensions: [4, 3, 1], scale: [1, 1, 1], content_id: `CONTENT:${species}-HEPATOCYTE-INSTANCES` }]),
    descriptor(species, 'APAP-FIELD', 'scalar-grid', ['x', 'y', 'z'], '1', 'linear', sentinelField, { unit: '1', statement: 'Exact synthetic field values; no measured concentration or uncertainty is represented.' }, [
      { level: 0, dimensions: [2, 2, 2], scale: size.map((value) => value / 2), content_id: `CONTENT:${species}-APAP-FIELD-L0` },
      { level: 1, dimensions: [1, 1, 1], scale: size, content_id: `CONTENT:${species}-APAP-FIELD-L1` }
    ])
  ]
})

const mappings = [
  { id: 'MAPPING:HUMAN-SYNTHETIC-REGISTRATION', species: 'HUMAN', taxon: 'NCBITaxon:9606', reason: 'Repository-authored translation between two synthetic human benchmark spaces.' },
  { id: 'MAPPING:MOUSE-SYNTHETIC-REGISTRATION', species: 'MOUSE', taxon: 'NCBITaxon:10090', reason: 'Repository-authored translation between two synthetic mouse benchmark spaces.' }
].map(({ id, species, taxon, reason }) => ({ id, mapping_type: 'synthetic-registration', source_space_id: `SPACE:${species}-LOBULE-LOCAL`, target_space_id: `SPACE:${species}-LOBULE-WORLD`, transform_id: `TRANSFORM:${species}-LOCAL-TO-WORLD`, source_taxon_id: taxon, target_taxon_id: taxon, target_system: 'synthetic-benchmark', status: 'available', compatibility: 'same-taxon-only', reason, source_id: 'SYNTHETIC_SPATIAL', applicability: 'algorithm-testing-only; not reference anatomy' }))
mappings.push({ id: 'MAPPING:HUMAN-HRA-UNAVAILABLE', mapping_type: 'reference-anatomy', source_space_id: 'SPACE:HUMAN-LOBULE-LOCAL', target_space_id: null, transform_id: null, source_taxon_id: 'NCBITaxon:9606', target_taxon_id: null, target_system: 'HRA', status: 'unavailable', compatibility: 'human-reference-unavailable', reason: 'No geometry or registration is published because an exact HRA source, license, and version were not verified for this release.', source_id: 'SYNTHETIC_SPATIAL', applicability: 'algorithm-testing-only; not reference anatomy' })

const manifest = {
  release_id: SPATIAL_RELEASE_ID,
  title: 'Immutable synthetic APAP liver spatial benchmark',
  schema_version: SPATIAL_CONTRACT_VERSION,
  release_digest: SPATIAL_RELEASE_DIGEST,
  digest_algorithm: 'sha256-canonical-manifest-v1',
  published_at: '2026-07-13',
  immutable: true,
  scientific_scope: 'Repository-authored synthetic human and mouse lobule geometry, hepatocyte instances, and dimensionless APAP fields for deterministic spatial algorithm tests. Ontology records are identifier anchors only. No asset is measured biology or HRA reference anatomy, and no biological, toxicological, therapeutic, or clinical conclusion is supported.',
  files: [
    ['assets.json', 'assets', 'f5f0b0afbb9d6afc945b326d2d3e54a3c28421a5fc1dd35ace9448a8bdd4afa9', 3228, 6],
    ['descriptors.json', 'descriptors', 'b152c305627d099378509f522c5897f68eb4abd1123b8fd67be52f88a230b319', 5400, 6],
    ['inventory.json', 'inventory', '809fe47d594250c424737dc5287d2944ca8a50855f2909b337a58dc8405627b1', 2413, 8],
    ['mappings.json', 'mappings', '67ba9c89eaa2716353b23d571ebe725e1a3f5d293b48b71d8fa3d0e7c9a094d5', 1832, 3],
    ['spaces.json', 'spaces', '5206a0042f72aec0a5ed40d0091b5e4b2a10aad49b5c71b0d290f350eddfbeb9', 2098, 4],
    ['structures.json', 'structures', 'e63b065835055a6296b43c828de3d801c756099bd37f26fc6ada027f1daf72ed', 1443, 4],
    ['transforms.json', 'transforms', 'adf0a71f8469f3878523150749fd1aff3e80189ead6e0142ae7a6dfcb0fb9159', 972, 2]
  ].map(([path, record_type, sha256, bytes, record_count]) => ({ path, record_type, sha256, bytes, record_count })),
  contents: inventory,
  record_counts: { assets: 6, descriptors: 6, inventory: 8, mappings: 3, spaces: 4, structures: 4, transforms: 2 },
  sources: [
    ['NCBI_TAXONOMY', 'NCBI Taxonomy', 'identifier-authority', 'live records accessed 2026-07-13', 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=taxonomy&id=9606,10090&retmode=json', 'NCBI-TERMS', 'Active Homo sapiens and Mus musculus taxon identifier anchors.'],
    ['UBERON', 'Uberon multi-species anatomy ontology', 'identifier-authority', 'live OLS record accessed 2026-07-13', 'https://www.ebi.ac.uk/ols4/api/ontologies/uberon/terms?obo_id=UBERON%3A0002107', 'CC-BY-3.0', 'Verified UBERON:0002107 liver identifier and label only; no geometry.'],
    ['CELL_ONTOLOGY', 'Cell Ontology', 'identifier-authority', 'live OLS record accessed 2026-07-13', 'https://www.ebi.ac.uk/ols4/api/ontologies/cl/terms?obo_id=CL%3A0000182', 'CC-BY-4.0', 'Verified CL:0000182 hepatocyte identifier and label only; no geometry.'],
    ['SYNTHETIC_SPATIAL', 'Repository-authored APAP spatial benchmark', 'synthetic', SPATIAL_RELEASE_ID, 'https://github.com/bc1-global/biochemical-db', 'CC0-1.0', 'Synthetic geometry, coordinates, transforms, instances, fields, descriptors, and explicit unavailable HRA mapping gap.']
  ].map(([id, name, source_class, version, url, license_id, usage]) => ({ id, name, source_class, version, url, accessed_at: '2026-07-13', license_id, usage })),
  licenses: [
    ['NCBI-TERMS', 'NCBI data usage policies', 'https://www.ncbi.nlm.nih.gov/home/about/policies/', false],
    ['CC-BY-3.0', 'Creative Commons Attribution 3.0', 'https://creativecommons.org/licenses/by/3.0/', true],
    ['CC-BY-4.0', 'Creative Commons Attribution 4.0', 'https://creativecommons.org/licenses/by/4.0/', true],
    ['CC0-1.0', 'CC0 1.0 Universal', 'https://creativecommons.org/publicdomain/zero/1.0/', true]
  ].map(([id, name, url, redistributable]) => ({ id, name, url, redistributable })),
  compatibility: { consumer: 'biochemical-inference', spatial_api_contract: SPATIAL_CONTRACT_VERSION, coordinate_convention: 'right-handed-cartesian-xyz' }
}

const obj = (x, y, z) => `# Repository-authored synthetic APAP benchmark cuboid; not HRA reference anatomy.\nv 0 0 0\nv ${x} 0 0\nv ${x} ${y} 0\nv 0 ${y} 0\nv 0 0 ${z}\nv ${x} 0 ${z}\nv ${x} ${y} ${z}\nv 0 ${y} ${z}\nf 1 2 3\nf 1 3 4\nf 5 7 6\nf 5 8 7\nf 1 5 6\nf 1 6 2\nf 2 6 7\nf 2 7 3\nf 3 7 8\nf 3 8 4\nf 4 8 5\nf 4 5 1\n`
const content = new Map(Object.entries({
  'CONTENT:HUMAN-LOBULE-MESH': obj(200, 200, 100),
  'CONTENT:HUMAN-HEPATOCYTE-INSTANCES': 'instance_id,x,y,z\n1,40,40,25\n2,160,40,25\n3,40,160,75\n4,160,160,75\n',
  'CONTENT:HUMAN-APAP-FIELD-L0': 'x,y,z,value\n50,50,25,1.0\n150,50,25,0.8\n50,150,25,0.7\n150,150,25,0.5\n50,50,75,0.9\n150,50,75,0.6\n50,150,75,0.4\n150,150,75,0.2\n',
  'CONTENT:HUMAN-APAP-FIELD-L1': 'x,y,z,value\n100,100,50,0.6375\n',
  'CONTENT:MOUSE-LOBULE-MESH': obj(160, 160, 80),
  'CONTENT:MOUSE-HEPATOCYTE-INSTANCES': 'instance_id,x,y,z\n1,32,32,20\n2,128,32,20\n3,32,128,60\n4,128,128,60\n',
  'CONTENT:MOUSE-APAP-FIELD-L0': 'x,y,z,value\n40,40,20,1.0\n120,40,20,0.75\n40,120,20,0.65\n120,120,20,0.45\n40,40,60,0.85\n120,40,60,0.55\n40,120,60,0.35\n120,120,60,0.15\n',
  'CONTENT:MOUSE-APAP-FIELD-L1': 'x,y,z,value\n80,80,40,0.59375\n'
}).map(([id, value]) => [id, Buffer.from(value)]))

for (const item of inventory) {
  const body = content.get(item.id)
  if (!body || body.length !== item.bytes || sha256Hex(body) !== item.sha256) throw new Error(`Invalid spatial fixture content ${item.id}`)
}

const envelope = (items) => ({ release: FIXTURE_SPATIAL_RELEASE, items })

export function createSpatialFixtureClient() {
  return {
    async catalog() { return SpatialCatalogSchema.parse({ catalog_schema_version: SPATIAL_CONTRACT_VERSION, releases: [{ release_id: SPATIAL_RELEASE_ID, title: manifest.title, schema_version: SPATIAL_CONTRACT_VERSION, release_digest: SPATIAL_RELEASE_DIGEST, manifest_path: `${SPATIAL_RELEASE_ID}/manifest.json` }] }) },
    async detail() { return SpatialDetailSchema.parse({ release: FIXTURE_SPATIAL_RELEASE, manifest, mappings, inventory }) },
    async structures(taxonId) { return SpatialStructuresSchema.parse(envelope(structures.filter((item) => !taxonId || item.taxon_id === taxonId))) },
    async spaces(taxonId) { return SpatialSpacesSchema.parse(envelope(spaces.filter((item) => !taxonId || item.taxon_id === taxonId))) },
    async transforms(taxonId) { return SpatialTransformsSchema.parse(envelope(PINNED_SPATIAL_TRANSFORMS.filter((item) => !taxonId || item.taxon_id === taxonId))) },
    async assets(query = {}) { return SpatialAssetsSchema.parse(envelope(assets.filter((item) => (!query.taxonId || item.taxon_id === query.taxonId) && (!query.structureId || item.structure_id === query.structureId) && (!query.assetType || item.asset_type === query.assetType)))) },
    async descriptors(assetId) { return SpatialDescriptorsSchema.parse(envelope(descriptors.filter((item) => !assetId || item.asset_id === assetId))) },
    async mappings() { return SpatialMappingsSchema.parse(envelope(mappings)) },
    async inventory() { return SpatialInventorySchema.parse(envelope(inventory)) },
    async content(assetId, contentId, range) {
      const item = inventory.find((candidate) => candidate.asset_id === assetId && candidate.id === contentId)
      const body = item ? content.get(item.id) : undefined
      if (!item || !body) return undefined
      const selected = range ? body.subarray(range.start, range.end + 1) : body
      return { body: selected, statusCode: range ? 206 : 200, item, range }
    }
  }
}
