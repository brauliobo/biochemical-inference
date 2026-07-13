import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  BiochemicalDbAtlasClaimSchema,
  BiochemicalDbAtlasCoverageSchema,
  BiochemicalDbAtlasEntitySchema,
  BiochemicalDbAtlasEvidenceSchema,
  BiochemicalDbAtlasLimitationSchema,
  BiochemicalDbAtlasMappingSchema,
  BiochemicalDbAtlasTransformationSchema
} from '../../server/knowledge/biochemical-db-atlas.js'
import {
  createKnowledgeClient,
  DEFAULT_ATLAS_RELEASE_DIGEST,
  DEFAULT_ATLAS_RELEASE_ID,
  DEFAULT_RELEASE_DIGEST,
  DEFAULT_RELEASE_ID
} from '../../server/knowledge/client.js'
import { BUNDLED_ATLAS_RELEASE } from '../../server/knowledge/atlas-fixture.js'

const atlasCatalog = {
  catalog_schema_version: '2.0.0',
  releases: [{
    release_id: DEFAULT_ATLAS_RELEASE_ID,
    title: 'Contextual human and mouse MTHFR atlas slice',
    schema_version: '2.0.0',
    release_digest: DEFAULT_ATLAS_RELEASE_DIGEST,
    supported_taxa: ['NCBITaxon:9606', 'NCBITaxon:10090'],
    manifest_path: `${DEFAULT_ATLAS_RELEASE_ID}/manifest.json`
  }]
}

const v1Catalog = {
  catalog_schema_version: '1.0.0',
  releases: [{
    release_id: DEFAULT_RELEASE_ID,
    title: 'Human and mouse one-carbon metabolism seed',
    schema_version: '1.0.0',
    release_digest: DEFAULT_RELEASE_DIGEST,
    supported_taxa: ['NCBITaxon:9606', 'NCBITaxon:10090'],
    manifest_path: `${DEFAULT_RELEASE_ID}/manifest.json`
  }]
}

const baseEntity = { id: 'HGNC:7436', name: 'MTHFR', entity_type: 'gene', taxon_id: 'NCBITaxon:9606', external_ids: [], source_ids: ['HGNC'], symbol: 'MTHFR' }
const evidence = { id: 'EVIDENCE:TEST', kind: 'database-record', source_id: 'HGNC', citation: 'HGNC record', url: 'https://example.org/evidence', taxon_id: 'NCBITaxon:9606' }
const claim = { id: 'CLAIM:TEST', subject_id: 'HGNC:7436', relation: 'encodes', object_id: 'UniProtKB:P42898', context: { taxon_id: 'NCBITaxon:9606', tissue_id: null, compartment_id: null, cell_id: null }, derivation: 'direct', polarity: 'supporting', evidence_ids: ['EVIDENCE:TEST'], transformation_id: null }
const mapping = { id: 'MAPPING:TEST', source_id: 'HGNC:7436', relation: 'exact_match', status: 'resolved', target_id: 'Ensembl:ENSG00000177000', candidate_ids: [], evidence_ids: ['EVIDENCE:TEST'], rationale: 'Exact gene identity.' }
const transformation = { id: 'TRANSFORMATION:TEST', kind: 'orthology', source_taxon_id: 'NCBITaxon:9606', target_taxon_id: 'NCBITaxon:10090', source_claim_id: 'CLAIM:TEST', entity_pairs: [{ source_id: 'HGNC:7436', target_id: 'MGI:106639' }], method: 'Orthology mapping.', evidence_ids: ['EVIDENCE:TEST'], limitations: 'Not direct mouse evidence.' }
const coverage = { id: 'COVERAGE:TEST', taxon_id: 'NCBITaxon:9606', tissue_id: null, entity_type: 'gene', evidence_class: 'direct', numerator: 1, denominator: 1, denominator_definition: 'One target.', expected_ids: ['HGNC:7436'], covered_ids: ['HGNC:7436'], gap_ids: [] }
const limitation = { id: 'LIMITATION:TEST', category: 'scope', statement: 'Bounded scope.', coverage_ids: [] }

afterEach(() => vi.unstubAllGlobals())

describe('atlas v2 knowledge boundary', () => {
  it('uses separate strict schemas for every upstream atlas record family', () => {
    for (const [schema, value] of [
      [BiochemicalDbAtlasEntitySchema, baseEntity],
      [BiochemicalDbAtlasEvidenceSchema, evidence],
      [BiochemicalDbAtlasClaimSchema, claim],
      [BiochemicalDbAtlasMappingSchema, mapping],
      [BiochemicalDbAtlasTransformationSchema, transformation],
      [BiochemicalDbAtlasCoverageSchema, coverage],
      [BiochemicalDbAtlasLimitationSchema, limitation]
    ]) {
      expect(schema.safeParse(value).success).toBe(true)
      expect(schema.safeParse({ ...value, undocumented: true }).success).toBe(false)
    }
  })

  it('pins the atlas catalog independently from the v1 simulation release', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url) => new Response(JSON.stringify(String(url).includes('/api/v2/') ? atlasCatalog : v1Catalog), { status: 200 })))
    const client = createKnowledgeClient({ BIOCHEMICAL_DB_ATLAS_EXPECTED_DIGEST: '0'.repeat(64) })

    await expect(client.releases()).resolves.toEqual([expect.objectContaining({ id: DEFAULT_RELEASE_ID })])
    await expect(client.atlasReleases()).rejects.toThrow(`Digest mismatch for atlas release ${DEFAULT_ATLAS_RELEASE_ID}`)
  })

  it('serves explicit fixture atlas data without cross-species substitution', async () => {
    const client = createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })
    const human = await client.atlasSubgraph(BUNDLED_ATLAS_RELEASE.id, 'HGNC:7436', 9606, 6, 100)
    const mouse = await client.atlasSubgraph(BUNDLED_ATLAS_RELEASE.id, 'MGI:106639', 10090, 6, 100)

    expect(human.entities.map((item) => item.id)).toContain('HGNC:7436')
    expect(human.entities.map((item) => item.id)).not.toContain('MGI:106639')
    expect(mouse.entities.map((item) => item.id)).toContain('MGI:106639')
    expect(mouse.entities.map((item) => item.id)).not.toContain('HGNC:7436')
    expect(mouse.claims).toEqual(expect.arrayContaining([expect.objectContaining({ derivation: 'orthology-transferred' })]))
    await expect(client.atlasEntity(BUNDLED_ATLAS_RELEASE.id, 'HGNC:7436', 10090)).rejects.toThrow('Unknown atlas entity in taxon context')
  })
})
