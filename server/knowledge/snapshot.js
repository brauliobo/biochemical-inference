import { createHash } from 'node:crypto'
import { canonicalJson } from '../../shared/canonical-json.js'
import { KnowledgeSnapshotSchema } from '../../shared/snapshot-contracts.js'
import { BUNDLED_PROVENANCE, BUNDLED_RELEASE, bundledNetwork } from './fixture.js'

function digestCharacter(character) {
  return character.repeat(64)
}

function fixtureSource(id, name, license) {
  return { id, name, url: `https://example.invalid/${id.toLowerCase()}`, accessed_at: '2026-01-01', license, license_url: `https://example.invalid/licenses/${id.toLowerCase()}` }
}

export function snapshotDigest(snapshot) {
  const { snapshot_digest: _digest, ...content } = snapshot
  return createHash('sha256').update(canonicalJson(content), 'utf8').digest('hex')
}

export function verifyKnowledgeSnapshot(rawSnapshot, options = {}) {
  const snapshot = KnowledgeSnapshotSchema.parse(rawSnapshot)
  const actualDigest = snapshotDigest(snapshot)
  if (snapshot.snapshot_digest !== actualDigest) throw new Error(`Knowledge snapshot digest mismatch: expected ${snapshot.snapshot_digest}, got ${actualDigest}`)
  if (options.expectedReleaseId && snapshot.release.id !== options.expectedReleaseId) throw new Error('Knowledge snapshot release does not match the configured release.')
  if (options.expectedReleaseDigest && snapshot.release.digest !== options.expectedReleaseDigest) throw new Error('Knowledge snapshot release digest does not match the configured release.')
  if (options.expectedTaxonId && snapshot.selected_taxon.id !== options.expectedTaxonId) throw new Error('Knowledge snapshot taxon does not match the requested taxon.')
  if (snapshot.release.id !== snapshot.manifest.release_id || snapshot.release.id !== snapshot.provenance.release_id || snapshot.release.digest !== snapshot.manifest.release_digest || snapshot.release.digest !== snapshot.provenance.release_digest) throw new Error('Knowledge snapshot release closure is inconsistent.')
  const { release_digest: _releaseDigest, ...manifestContent } = snapshot.manifest
  const manifestDigest = createHash('sha256').update(canonicalJson(manifestContent), 'utf8').digest('hex')
  if (manifestDigest !== snapshot.manifest.release_digest) throw new Error('Knowledge snapshot manifest release digest does not recompute.')
  if (!snapshot.manifest.supported_taxa.includes(snapshot.selected_taxon.id)) throw new Error('Knowledge snapshot taxon is outside the release scope.')
  if (!snapshot.self_contained || snapshot.restricted_dependencies.length > 0) throw new Error('Knowledge snapshot is not self-contained for offline execution.')

  const unique = (items, label) => {
    const identifiers = items.map((item) => item.id)
    if (new Set(identifiers).size !== identifiers.length) throw new Error(`Knowledge snapshot repeats a ${label} identifier.`)
    return new Set(identifiers)
  }
  const compounds = unique(snapshot.network.compounds, 'compound')
  const reactions = unique(snapshot.network.reactions, 'reaction')
  const proteins = unique(snapshot.network.proteins, 'protein')
  const references = unique(snapshot.network.references, 'reference')
  unique(snapshot.network.catalysis, 'catalysis')
  if (snapshot.network.proteins.some((item) => item.taxon_id !== snapshot.selected_taxon.id) || snapshot.network.catalysis.some((item) => item.taxon_id !== snapshot.selected_taxon.id)) throw new Error('Knowledge snapshot contains cross-taxon records.')
  for (const assertion of snapshot.network.catalysis) {
    if (!proteins.has(assertion.protein_id) || !reactions.has(assertion.reaction_id) || assertion.reference_ids.some((identifier) => !references.has(identifier))) throw new Error('Knowledge snapshot catalysis closure is incomplete.')
    const evidence = snapshot.network.references.filter((item) => assertion.reference_ids.includes(item.id))
    if (evidence.some((item) => item.support_level !== assertion.evidence_class)) throw new Error('Knowledge snapshot evidence classification conflicts with catalysis.')
  }
  for (const reaction of snapshot.network.reactions) {
    if ([...reaction.reactants, ...reaction.products].some((participant) => !compounds.has(participant.compound_id))) throw new Error('Knowledge snapshot reaction closure is incomplete.')
  }
  const requiredProteins = new Set(snapshot.network.catalysis.map((item) => item.protein_id))
  const requiredReactions = new Set(snapshot.network.catalysis.map((item) => item.reaction_id))
  const requiredReferences = new Set(snapshot.network.catalysis.flatMap((item) => item.reference_ids))
  const requiredCompounds = new Set(snapshot.network.reactions.flatMap((item) => [...item.reactants, ...item.products].map((participant) => participant.compound_id)))
  const equalSet = (left, right) => left.size === right.size && [...left].every((value) => right.has(value))
  if (!equalSet(proteins, requiredProteins) || !equalSet(reactions, requiredReactions) || !equalSet(references, requiredReferences) || !equalSet(compounds, requiredCompounds)) throw new Error('Knowledge snapshot network contains records outside its exact closure.')

  if (canonicalJson(snapshot.source_metadata.sources) !== canonicalJson(snapshot.manifest.sources)) throw new Error('Knowledge snapshot source metadata does not match its manifest.')
  const recordIds = {
    taxa: [snapshot.selected_taxon.id],
    compounds: snapshot.network.compounds.map((item) => item.id),
    reactions: snapshot.network.reactions.map((item) => item.id),
    proteins: snapshot.network.proteins.map((item) => item.id),
    references: snapshot.network.references.map((item) => item.id),
    catalysis: snapshot.network.catalysis.map((item) => item.id),
    limitations: snapshot.limitations.map((item) => item.id)
  }
  const metadataByType = new Map(snapshot.source_metadata.source_objects.map((item) => [item.record_type, item]))
  const provenanceByType = new Map(snapshot.provenance.source_objects.map((item) => [item.record_type, item]))
  if (metadataByType.size !== Object.keys(recordIds).length || provenanceByType.size !== Object.keys(recordIds).length) throw new Error('Knowledge snapshot source-object closure is incomplete.')
  for (const [recordType, identifiers] of Object.entries(recordIds)) {
    const metadata = metadataByType.get(recordType)
    const provenance = provenanceByType.get(recordType)
    if (!metadata || !provenance || canonicalJson(metadata.included_record_ids) !== canonicalJson(identifiers)) throw new Error(`Knowledge snapshot source metadata does not identify ${recordType}.`)
    if (metadata.name !== provenance.name || metadata.sha256 !== provenance.sha256 || metadata.bytes !== provenance.bytes || metadata.license.id !== provenance.license_id || canonicalJson(metadata.source_ids) !== canonicalJson(provenance.source_ids)) throw new Error(`Knowledge snapshot source metadata conflicts with ${recordType} provenance.`)
    if (metadata.license.redistribution !== 'public') throw new Error(`Knowledge snapshot embeds restricted ${recordType} content.`)
  }
  return snapshot
}

export function bundledKnowledgeSnapshot(taxonId) {
  const network = bundledNetwork(taxonId)
  const snapshotReleaseId = 'fixture-workspace-snapshot-v1.0.0'
  const taxon = taxonId === 9606
    ? { id: 'NCBITaxon:9606', scientific_name: 'Homo sapiens', common_name: 'Human', source_ids: ['NCBI_TAXONOMY'] }
    : { id: 'NCBITaxon:10090', scientific_name: 'Mus musculus', common_name: 'Mouse', source_ids: ['NCBI_TAXONOMY'] }
  const references = network.proteins.map((protein, index) => ({
    id: protein.id,
    kind: 'uniprot',
    citation: `${protein.gene} reviewed association`,
    url: `https://www.uniprot.org/uniprotkb/${protein.id.slice('UniProtKB:'.length)}/entry`,
    support_level: network.catalysis[index].evidenceClass,
    source_ids: ['UNIPROTKB']
  }))
  const requiredCompoundIds = new Set(network.reactions.flatMap((reaction) => [...reaction.reactants, ...reaction.products].map((participant) => participant.compoundId)))
  const selectedCompounds = network.compounds.filter((compound) => requiredCompoundIds.has(compound.id))
  const recordIds = {
    taxa: [taxon.id],
    compounds: selectedCompounds.map((item) => item.id),
    reactions: network.reactions.map((item) => item.id),
    proteins: network.proteins.map((item) => item.id),
    references: references.map((item) => item.id),
    catalysis: network.catalysis.map((item) => item.id),
    limitations: network.limitations.map((item) => item.id)
  }
  const sourceIds = {
    taxa: ['NCBI_TAXONOMY'],
    compounds: ['CHEBI'],
    reactions: ['RHEA'],
    proteins: ['UNIPROTKB'],
    references: ['UNIPROTKB'],
    catalysis: ['RHEA', 'UNIPROTKB'],
    limitations: ['CURATION']
  }
  const licenses = {
    taxa: 'NCBI-POLICY',
    compounds: 'CC-BY-4.0',
    reactions: 'CC-BY-4.0',
    proteins: 'CC-BY-4.0',
    references: 'CC-BY-4.0',
    catalysis: 'CC-BY-4.0',
    limitations: 'MIT'
  }
  const types = Object.keys(recordIds)
  const sources = [
    fixtureSource('NCBI_TAXONOMY', 'NCBI Taxonomy', 'NCBI policy'),
    fixtureSource('CHEBI', 'ChEBI', 'CC BY 4.0'),
    fixtureSource('RHEA', 'Rhea', 'CC BY 4.0'),
    fixtureSource('UNIPROTKB', 'UniProtKB', 'CC BY 4.0'),
    fixtureSource('CURATION', 'Local curation', 'MIT')
  ]
  const sourceObjects = types.map((type, index) => ({
    name: `demo-${type}`,
    record_type: type,
    sha256: digestCharacter(String(index + 1)),
    bytes: 100 + index,
    media_type: 'application/json',
    origin_url: `file://fixture/${type}.json`,
    source_release: 'fixture-2026.1',
    retrieved_at: '2026-01-01T00:00:00Z',
    source_ids: sourceIds[type],
    license: { id: licenses[type], name: licenses[type], url: `https://example.invalid/licenses/${licenses[type].toLowerCase()}`, redistribution: 'public' },
    included_content: 'normalized-public-release-records',
    included_record_ids: recordIds[type],
    upstream_source_bytes_included: false,
    content_limitations: ['Selected normalized fixture records only.']
  }))
  const releaseDigest = BUNDLED_RELEASE.digest.slice('sha256:'.length)
  const content = {
    snapshot_schema_version: '1.0.0',
    digest_algorithm: 'sha256-rfc8785-snapshot-v1',
    release: { id: snapshotReleaseId, schema_version: '1.0.0', digest: releaseDigest },
    manifest: {
      release_id: snapshotReleaseId,
      title: BUNDLED_RELEASE.title,
      schema_version: '1.0.0',
      release_digest: releaseDigest,
      digest_algorithm: 'sha256-canonical-manifest-v1',
      published_at: '2026-01-01',
      immutable: true,
      supported_taxa: ['NCBITaxon:9606', 'NCBITaxon:10090'],
      scientific_scope: 'Deterministic bundled test fixture.',
      files: types.map((type, index) => ({ path: `${type}.json`, sha256: digestCharacter(String(index + 1)), bytes: 100 + index, record_type: type, record_count: recordIds[type].length })),
      record_counts: Object.fromEntries(types.map((type) => [type, recordIds[type].length])),
      sources,
      compatibility: { consumer: 'biochemical-inference', network_contract: '1.0.0' }
    },
    provenance: {
      release_id: snapshotReleaseId,
      release_digest: releaseDigest,
      recipe: { path: BUNDLED_PROVENANCE.recipe.path, sha256: BUNDLED_PROVENANCE.recipe.digest.slice('sha256:'.length) },
      source_lock: { path: BUNDLED_PROVENANCE.sourceLock.path, sha256: BUNDLED_PROVENANCE.sourceLock.digest.slice('sha256:'.length) },
      source_objects: sourceObjects.map((item) => ({ name: item.name, record_type: item.record_type, sha256: item.sha256, bytes: item.bytes, source_ids: item.source_ids, license_id: item.license.id })),
      transformer: { id: 'normalized-json', version: '1.0.0', sha256: digestCharacter('c') },
      validation: { id: 'mvp-scientific', version: '1.0.0', sha256: digestCharacter('d') }
    },
    selected_taxon: taxon,
    network: {
      contract_version: '1.0.0',
      compounds: selectedCompounds.map((item) => ({ id: item.id, name: item.name, synonyms: item.synonyms, formula: item.formula, charge: item.charge, source_ids: ['CHEBI'] })),
      reactions: network.reactions.map((item) => ({ id: item.id, rhea_master_id: item.rheaMasterId, name: item.name, ec_numbers: ['1.1.1.1'], physiological_direction: item.physiologicalDirection, equation: item.equation, reactants: item.reactants.map((participant) => ({ compound_id: participant.compoundId, coefficient: participant.coefficient })), products: item.products.map((participant) => ({ compound_id: participant.compoundId, coefficient: participant.coefficient })), source_ids: ['RHEA'] })),
      proteins: network.proteins.map((item) => ({ id: item.id, accession: item.id.slice('UniProtKB:'.length), taxon_id: taxon.id, gene_symbol: item.gene, recommended_name: item.name, reviewed: true, source_ids: ['UNIPROTKB'] })),
      catalysis: network.catalysis.map((item, index) => ({ id: item.id, protein_id: item.proteinId, reaction_id: item.reactionId, taxon_id: taxon.id, evidence_class: item.evidenceClass, evidence_code: item.evidenceCode, reference_ids: [references[index].id] })),
      references
    },
    source_metadata: { sources, source_objects: sourceObjects },
    limitations: network.limitations,
    self_contained: true,
    restricted_dependencies: []
  }
  const { release_digest: _releaseDigest, ...manifestContent } = content.manifest
  const actualReleaseDigest = createHash('sha256').update(canonicalJson(manifestContent), 'utf8').digest('hex')
  content.release.digest = actualReleaseDigest
  content.manifest.release_digest = actualReleaseDigest
  content.provenance.release_digest = actualReleaseDigest
  const snapshot = { ...content, snapshot_digest: createHash('sha256').update(canonicalJson(content), 'utf8').digest('hex') }
  return verifyKnowledgeSnapshot(snapshot, { expectedReleaseId: snapshotReleaseId, expectedReleaseDigest: actualReleaseDigest, expectedTaxonId: taxon.id })
}
