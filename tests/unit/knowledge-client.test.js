import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createKnowledgeClient,
  DEFAULT_RELEASE_DIGEST,
  DEFAULT_RELEASE_ID
} from '../../server/knowledge/client.js'

const catalog = {
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

const provenance = {
  release: { id: DEFAULT_RELEASE_ID, schema_version: '1.0.0', digest: DEFAULT_RELEASE_DIGEST },
  provenance: {
    release_id: DEFAULT_RELEASE_ID,
    release_digest: DEFAULT_RELEASE_DIGEST,
    recipe: { path: `recipes/${DEFAULT_RELEASE_ID}.json`, sha256: 'a'.repeat(64) },
    source_lock: { path: `sources/locks/${DEFAULT_RELEASE_ID}.json`, sha256: 'b'.repeat(64) },
    source_objects: [{
      name: 'one-carbon-compounds',
      record_type: 'compounds',
      sha256: 'c'.repeat(64),
      bytes: 2182,
      object_class: 'repository-authored-normalized-fixture',
      upstream_response: false,
      origin_url: `https://raw.githubusercontent.com/example/biochemical-db/${'f'.repeat(40)}/knowledge/sources/objects/sha256/${'c'.repeat(64)}`,
      artifact_repository: 'https://github.com/example/biochemical-db',
      artifact_commit: 'f'.repeat(40),
      source_release: 'fixture-1',
      retrieved_at: '2026-01-01T00:00:00Z',
      source_ids: ['CHEBI'],
      license_id: 'CC-BY-4.0'
    }],
    transformer: { id: 'normalized-json', version: '1.0.0', sha256: 'd'.repeat(64) },
    validation: { id: 'mvp-scientific', version: '1.0.0', sha256: 'e'.repeat(64) }
  }
}

function network(taxonId) {
  return {
    contract_version: '1.0.0',
    release: { id: DEFAULT_RELEASE_ID, schema_version: '1.0.0', digest: DEFAULT_RELEASE_DIGEST },
    taxon: { id: taxonId, scientific_name: 'Homo sapiens', common_name: 'human', source_ids: ['NCBI_TAXONOMY'] },
    compounds: [
      { id: 'CHEBI:15636', name: '5,10-methylene-THF', synonyms: [], formula: 'C20H21N7O6', charge: -2, source_ids: ['CHEBI'] },
      { id: 'CHEBI:18608', name: '5-methyl-THF', synonyms: [], formula: 'C20H23N7O6', charge: -2, source_ids: ['CHEBI'] }
    ],
    reactions: [{
      id: 'RHEA:19819',
      rhea_master_id: 'RHEA:19817',
      name: 'MTHFR reduction',
      ec_numbers: ['1.5.1.53'],
      physiological_direction: 'left-to-right',
      equation: '5,10-methylene-THF -> 5-methyl-THF',
      reactants: [{ compound_id: 'CHEBI:15636', coefficient: 1 }],
      products: [{ compound_id: 'CHEBI:18608', coefficient: 1 }],
      source_ids: ['RHEA']
    }],
    proteins: [{
      id: 'UniProtKB:P42898',
      accession: 'P42898',
      taxon_id: taxonId,
      gene_symbol: 'MTHFR',
      recommended_name: 'Methylenetetrahydrofolate reductase',
      reviewed: true,
      source_ids: ['UNIPROTKB']
    }],
    catalysis: [{
      id: 'CATALYSIS:P42898-19819',
      protein_id: 'UniProtKB:P42898',
      reaction_id: 'RHEA:19819',
      taxon_id: taxonId,
      evidence_class: taxonId === 'NCBITaxon:9606' ? 'direct' : 'inferred',
      evidence_code: taxonId === 'NCBITaxon:9606' ? 'ECO:0000269' : 'ECO:0000250',
      reference_ids: ['PubMed:29891918']
    }],
    references: [{
      id: 'PubMed:29891918',
      kind: 'pubmed',
      citation: 'MTHFR evidence',
      url: 'https://pubmed.ncbi.nlm.nih.gov/29891918/',
      support_level: taxonId === 'NCBITaxon:9606' ? 'direct' : 'inferred',
      source_ids: ['PUBMED']
    }],
    limitations: [{ id: 'LIMITATION:INCOMPLETE-SLICE', statement: 'Incomplete seed.' }]
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('biochemical-db client', () => {
  it('adapts the canonical catalog and network and URL-encodes the NCBITaxon identifier', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(network('NCBITaxon:9606')), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const client = createKnowledgeClient({ BIOCHEMICAL_DB_URL: 'https://knowledge.test/' })

    await expect(client.releases()).resolves.toEqual([expect.objectContaining({
      id: DEFAULT_RELEASE_ID,
      digest: `sha256:${DEFAULT_RELEASE_DIGEST}`,
      source: 'biochemical-db'
    })])
    await expect(client.network(DEFAULT_RELEASE_ID, 9606)).resolves.toMatchObject({
      contractVersion: '1.0.0',
      taxonId: 9606,
      catalysis: [expect.objectContaining({ evidenceClass: 'direct', evidenceCode: 'ECO:0000269' })],
      evidence: [expect.objectContaining({ evidenceClass: 'direct' })],
      limitations: [{ id: 'LIMITATION:INCOMPLETE-SLICE' }]
    })
    expect(fetchMock).toHaveBeenLastCalledWith(
      `https://knowledge.test/api/v1/releases/${DEFAULT_RELEASE_ID}/network?taxon_id=NCBITaxon%3A9606`,
      expect.any(Object)
    )
  })

  it('fails closed on a digest mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(catalog), { status: 200 })))
    const client = createKnowledgeClient({ BIOCHEMICAL_DB_EXPECTED_DIGEST: '0'.repeat(64) })

    await expect(client.releases()).rejects.toThrow(`Digest mismatch for ${DEFAULT_RELEASE_ID}`)
  })

  it('loads strict build provenance only when its release and digest match the verified catalog', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(provenance), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(createKnowledgeClient().provenance(DEFAULT_RELEASE_ID)).resolves.toMatchObject({
      releaseId: DEFAULT_RELEASE_ID,
      releaseDigest: `sha256:${DEFAULT_RELEASE_DIGEST}`,
      recipe: { digest: `sha256:${'a'.repeat(64)}` },
      sourceObjects: [{ recordType: 'compounds', sourceIds: ['CHEBI'], licenseId: 'CC-BY-4.0' }],
      transformer: { id: 'normalized-json' },
      validation: { id: 'mvp-scientific' }
    })
    expect(fetchMock).toHaveBeenLastCalledWith(
      `http://127.0.0.1:8000/api/v1/releases/${DEFAULT_RELEASE_ID}/provenance`,
      expect.any(Object)
    )
  })

  it('rejects provenance whose envelope digest differs from the pinned release', async () => {
    const mismatched = { ...provenance, release: { ...provenance.release, digest: '0'.repeat(64) } }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(mismatched), { status: 200 })))

    await expect(createKnowledgeClient().provenance(DEFAULT_RELEASE_ID)).rejects.toThrow('provenance does not match the pinned release and digest')
  })

  it('rejects undocumented provenance fields instead of accepting schema drift', async () => {
    const undocumented = { ...provenance, provenance: { ...provenance.provenance, undocumented: true } }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(catalog), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(undocumented), { status: 200 })))

    await expect(createKnowledgeClient().provenance(DEFAULT_RELEASE_ID)).rejects.toThrow('provenance schema is incompatible')
  })

  it('rejects undocumented upstream fields instead of silently accepting schema drift', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ...catalog, undocumented: true }), { status: 200 })))

    await expect(createKnowledgeClient().releases()).rejects.toThrow('release schema is incompatible')
  })

  it('uses the bundled fixture only when explicitly requested', async () => {
    const client = createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })

    await expect(client.releases()).resolves.toEqual([expect.objectContaining({ source: 'bundled-demonstration' })])
  })

  it('fails pinned-release verification visibly when the upstream request times out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('timed out', 'TimeoutError')))
    const client = createKnowledgeClient({ BIOCHEMICAL_DB_TIMEOUT_MS: '25' })

    await expect(client.releases()).rejects.toThrow('biochemical-db timed out after 25 ms')
  })
})
