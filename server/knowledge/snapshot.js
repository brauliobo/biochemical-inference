import { canonicalJson } from '../../shared/canonical-json.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { KnowledgeSnapshotSchema } from '../../shared/snapshot-contracts.js'
import { BUNDLED_PROVENANCE, BUNDLED_RELEASE, bundledNetwork } from './fixture.js'

function digestCharacter(character) {
  return character.repeat(64)
}

function fixtureSource(id, name, license) {
  return { id, name, url: `https://example.invalid/${id.toLowerCase()}`, accessed_at: '2026-01-01', license, license_url: `https://example.invalid/licenses/${id.toLowerCase()}` }
}

function asciiJson(value) {
  return JSON.stringify(value).replace(/[\u007f-\uffff]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`)
}

function releaseJson(value, level = 0) {
  const indent = '  '.repeat(level)
  const childIndent = '  '.repeat(level + 1)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    if (value.every((item) => item === null || typeof item !== 'object')) return `[${value.map(asciiJson).join(', ')}]`
    return `[\n${value.map((item) => `${childIndent}${releaseJson(item, level + 1)}`).join(',\n')}\n${indent}]`
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'
    if (level >= 4 && entries.every(([, item]) => item === null || typeof item !== 'object')) return `{${entries.map(([key, item]) => `${asciiJson(key)}: ${asciiJson(item)}`).join(', ')}}`
    return `{\n${entries.map(([key, item]) => `${childIndent}${asciiJson(key)}: ${releaseJson(item, level + 1)}`).join(',\n')}\n${indent}}`
  }
  return asciiJson(value)
}

function releasePayloadBytes(payload) {
  return Buffer.from(`${releaseJson(payload)}\n`)
}

export function snapshotDigest(snapshot) {
  const { snapshot_digest: _digest, ...content } = snapshot
  return canonicalSha256Hex(content)
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
  const manifestDigest = canonicalSha256Hex(manifestContent)
  if (manifestDigest !== snapshot.manifest.release_digest) throw new Error('Knowledge snapshot manifest release digest does not recompute.')
  if (!snapshot.manifest.supported_taxa.includes(snapshot.selected_taxon.id)) throw new Error('Knowledge snapshot taxon is outside the release scope.')
  if (!snapshot.self_contained || snapshot.restricted_dependencies.length > 0) throw new Error('Knowledge snapshot is not self-contained for offline execution.')

  const releaseRecords = Object.fromEntries(Object.entries(snapshot.release_payloads).map(([recordType, payload]) => [recordType, payload.records]))
  const manifestFiles = new Map(snapshot.manifest.files.map((item) => [item.record_type, item]))
  if (manifestFiles.size !== snapshot.manifest.files.length || manifestFiles.size !== Object.keys(releaseRecords).length) throw new Error('Knowledge snapshot release payload inventory does not match its manifest.')
  for (const [recordType, payload] of Object.entries(snapshot.release_payloads)) {
    const entry = manifestFiles.get(recordType)
    const bytes = releasePayloadBytes(payload)
    if (!entry || entry.path !== `${recordType}.json` || entry.bytes !== bytes.length || entry.sha256 !== sha256Hex(bytes) || entry.record_count !== payload.records.length) throw new Error(`Knowledge snapshot ${recordType} payload does not match its manifest file bytes and hash.`)
    const identifiers = payload.records.map((item) => item.id)
    if (new Set(identifiers).size !== identifiers.length) throw new Error(`Knowledge snapshot release payload repeats a ${recordType} identifier.`)
  }
  const payloadCounts = Object.fromEntries(Object.entries(releaseRecords).map(([recordType, records]) => [recordType, records.length]))
  if (canonicalJson(payloadCounts) !== canonicalJson(snapshot.manifest.record_counts)) throw new Error('Knowledge snapshot release payload counts do not match its manifest.')

  const releaseTaxon = releaseRecords.taxa.find((item) => item.id === snapshot.selected_taxon.id)
  if (!releaseTaxon || canonicalJson(releaseTaxon) !== canonicalJson(snapshot.selected_taxon)) throw new Error('Knowledge snapshot selected taxon does not match the authenticated release payload.')
  const expectedCatalysis = releaseRecords.catalysis.filter((item) => item.taxon_id === snapshot.selected_taxon.id)
  const expectedProteinIds = new Set(expectedCatalysis.map((item) => item.protein_id))
  const expectedReactionIds = new Set(expectedCatalysis.map((item) => item.reaction_id))
  const expectedReferenceIds = new Set(expectedCatalysis.flatMap((item) => item.reference_ids))
  const expectedReactions = releaseRecords.reactions.filter((item) => expectedReactionIds.has(item.id))
  const expectedCompoundIds = new Set(expectedReactions.flatMap((reaction) => [...reaction.reactants, ...reaction.products].map((participant) => participant.compound_id)))
  const expectedNetwork = {
    contract_version: snapshot.manifest.compatibility.network_contract,
    compounds: releaseRecords.compounds.filter((item) => expectedCompoundIds.has(item.id)),
    reactions: expectedReactions,
    proteins: releaseRecords.proteins.filter((item) => expectedProteinIds.has(item.id)),
    catalysis: expectedCatalysis,
    references: releaseRecords.references.filter((item) => expectedReferenceIds.has(item.id))
  }
  if (canonicalJson(snapshot.network) !== canonicalJson(expectedNetwork)) throw new Error('Knowledge snapshot network does not match the authenticated release payload closure.')
  if (canonicalJson(snapshot.limitations) !== canonicalJson(releaseRecords.limitations)) throw new Error('Knowledge snapshot limitations do not match the authenticated release payload.')

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

  const declaredSources = new Set(snapshot.manifest.sources.map((item) => item.id))
  const sourcedRecords = [snapshot.selected_taxon, ...snapshot.network.compounds, ...snapshot.network.reactions, ...snapshot.network.proteins, ...snapshot.network.references]
  if (sourcedRecords.some((record) => record.source_ids.some((sourceId) => !declaredSources.has(sourceId)))) throw new Error('Knowledge snapshot record references an undeclared embedded source.')

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
  if (metadataByType.size !== snapshot.source_metadata.source_objects.length || provenanceByType.size !== snapshot.provenance.source_objects.length || metadataByType.size !== Object.keys(recordIds).length || provenanceByType.size !== Object.keys(recordIds).length) throw new Error('Knowledge snapshot source-object closure is incomplete.')
  for (const [recordType, identifiers] of Object.entries(recordIds)) {
    const metadata = metadataByType.get(recordType)
    const provenance = provenanceByType.get(recordType)
    if (!metadata || !provenance || canonicalJson(metadata.included_record_ids) !== canonicalJson(identifiers)) throw new Error(`Knowledge snapshot source metadata does not identify ${recordType}.`)
    const metadataIdentity = { name: metadata.name, sha256: metadata.sha256, bytes: metadata.bytes, object_class: metadata.object_class, upstream_response: metadata.upstream_response, origin_url: metadata.origin_url, artifact_repository: metadata.artifact_repository, artifact_commit: metadata.artifact_commit, source_release: metadata.source_release, retrieved_at: metadata.retrieved_at, source_ids: metadata.source_ids, license_id: metadata.license.id }
    const provenanceIdentity = { name: provenance.name, sha256: provenance.sha256, bytes: provenance.bytes, object_class: provenance.object_class, upstream_response: provenance.upstream_response, origin_url: provenance.origin_url, artifact_repository: provenance.artifact_repository, artifact_commit: provenance.artifact_commit, source_release: provenance.source_release, retrieved_at: provenance.retrieved_at, source_ids: provenance.source_ids, license_id: provenance.license_id }
    if (canonicalJson(metadataIdentity) !== canonicalJson(provenanceIdentity)) throw new Error(`Knowledge snapshot source metadata conflicts with ${recordType} provenance.`)
    if (metadata.license.redistribution !== 'public') throw new Error(`Knowledge snapshot embeds restricted ${recordType} content.`)
    if (metadata.object_class === 'repository-authored-normalized-fixture') {
      const repository = metadata.artifact_repository.slice('https://github.com/'.length)
      const expectedOrigin = `https://raw.githubusercontent.com/${repository}/${metadata.artifact_commit}/knowledge/sources/objects/sha256/${metadata.sha256}`
      if (metadata.origin_url !== expectedOrigin) throw new Error(`Knowledge snapshot fixture source origin is invalid for ${recordType}.`)
    }
    let resolvedSourceIds
    let resolution
    if (recordType === 'limitations') {
      resolvedSourceIds = []
      resolution = 'unavailable-in-core-schema'
    } else if (recordType === 'catalysis') {
      const payloadProteins = new Map(releaseRecords.proteins.map((item) => [item.id, item]))
      const payloadReactions = new Map(releaseRecords.reactions.map((item) => [item.id, item]))
      const payloadReferences = new Map(releaseRecords.references.map((item) => [item.id, item]))
      resolvedSourceIds = [...new Set(releaseRecords.catalysis.flatMap((item) => [payloadProteins.get(item.protein_id), payloadReactions.get(item.reaction_id), ...item.reference_ids.map((id) => payloadReferences.get(id))].flatMap((linked) => linked.source_ids)))].sort()
      resolution = 'linked-record-source-ids'
    } else {
      resolvedSourceIds = [...new Set(releaseRecords[recordType].flatMap((item) => item.source_ids))].sort()
      resolution = 'record-source-ids'
    }
    const allSourceIds = new Set([...metadata.resolved_source_ids, ...metadata.unresolved_source_ids])
    const expectedSourceIds = new Set(metadata.source_ids)
    if (canonicalJson(metadata.resolved_source_ids) !== canonicalJson(resolvedSourceIds) || metadata.source_namespace_resolution !== resolution || !equalSet(allSourceIds, expectedSourceIds) || metadata.resolved_source_ids.some((item) => metadata.unresolved_source_ids.includes(item))) throw new Error(`Knowledge snapshot source namespace resolution is invalid for ${recordType}.`)
    if (resolution === 'unavailable-in-core-schema') {
      if (canonicalJson(metadata.unresolved_source_ids) !== canonicalJson(['CURATION']) || !metadata.content_limitations.some((item) => item.includes('CURATION') && item.includes('additive core release'))) throw new Error('Knowledge snapshot must disclose the unresolved CURATION namespace.')
    } else if (metadata.unresolved_source_ids.length > 0 || metadata.resolved_source_ids.some((sourceId) => !declaredSources.has(sourceId))) {
      throw new Error(`Knowledge snapshot unexpectedly leaves source namespaces unresolved for ${recordType}.`)
    }
  }
  return snapshot
}

export function bundledKnowledgeSnapshot(taxonId) {
  const snapshotReleaseId = 'fixture-workspace-snapshot-v1.0.0'
  const taxa = [
    { id: 'NCBITaxon:9606', scientific_name: 'Homo sapiens', common_name: 'Human', source_ids: ['NCBI_TAXONOMY'] },
    { id: 'NCBITaxon:10090', scientific_name: 'Mus musculus', common_name: 'Mouse', source_ids: ['NCBI_TAXONOMY'] }
  ]
  const selectedTaxon = taxa.find((item) => item.id === `NCBITaxon:${taxonId}`)
  if (!selectedTaxon) throw new Error(`Unsupported fixture snapshot taxon: ${taxonId}`)
  const fixtureNetworks = [bundledNetwork(9606), bundledNetwork(10090)]
  const releaseCompounds = fixtureNetworks[0].compounds.map((item) => ({ id: item.id, name: item.name, synonyms: item.synonyms, formula: item.formula, charge: item.charge, source_ids: ['CHEBI'] }))
  const releaseReactions = fixtureNetworks[0].reactions.map((item) => ({ id: item.id, rhea_master_id: item.rheaMasterId, name: item.name, ec_numbers: ['1.1.1.1'], physiological_direction: item.physiologicalDirection, equation: item.equation, reactants: item.reactants.map((participant) => ({ compound_id: participant.compoundId, coefficient: participant.coefficient })), products: item.products.map((participant) => ({ compound_id: participant.compoundId, coefficient: participant.coefficient })), source_ids: ['RHEA'] }))
  const releaseProteins = fixtureNetworks.flatMap((network) => network.proteins.map((item) => ({ id: item.id, accession: item.id.slice('UniProtKB:'.length), taxon_id: `NCBITaxon:${network.taxonId}`, gene_symbol: item.gene, recommended_name: item.name, reviewed: true, source_ids: ['UNIPROTKB'] })))
  const releaseReferences = fixtureNetworks.flatMap((network) => network.proteins.map((protein, index) => ({
    id: protein.id,
    kind: 'uniprot',
    citation: `${protein.gene} reviewed association`,
    url: `https://www.uniprot.org/uniprotkb/${protein.id.slice('UniProtKB:'.length)}/entry`,
    support_level: network.catalysis[index].evidenceClass,
    source_ids: ['UNIPROTKB']
  })))
  const releaseCatalysis = fixtureNetworks.flatMap((network) => network.catalysis.map((item, index) => ({ id: item.id, protein_id: item.proteinId, reaction_id: item.reactionId, taxon_id: `NCBITaxon:${network.taxonId}`, evidence_class: item.evidenceClass, evidence_code: item.evidenceCode, reference_ids: [releaseReferences.find((reference) => reference.id === network.proteins[index].id).id] })))
  const releaseLimitations = fixtureNetworks[0].limitations
  const selectedCatalysis = releaseCatalysis.filter((item) => item.taxon_id === selectedTaxon.id)
  const selectedProteinIds = new Set(selectedCatalysis.map((item) => item.protein_id))
  const selectedReactionIds = new Set(selectedCatalysis.map((item) => item.reaction_id))
  const selectedReferenceIds = new Set(selectedCatalysis.flatMap((item) => item.reference_ids))
  const selectedReactions = releaseReactions.filter((item) => selectedReactionIds.has(item.id))
  const selectedCompoundIds = new Set(selectedReactions.flatMap((reaction) => [...reaction.reactants, ...reaction.products].map((participant) => participant.compound_id)))
  const network = {
    contract_version: '1.0.0',
    compounds: releaseCompounds.filter((item) => selectedCompoundIds.has(item.id)),
    reactions: selectedReactions,
    proteins: releaseProteins.filter((item) => selectedProteinIds.has(item.id)),
    catalysis: selectedCatalysis,
    references: releaseReferences.filter((item) => selectedReferenceIds.has(item.id))
  }
  const recordIds = {
    taxa: [selectedTaxon.id],
    compounds: network.compounds.map((item) => item.id),
    reactions: network.reactions.map((item) => item.id),
    proteins: network.proteins.map((item) => item.id),
    references: network.references.map((item) => item.id),
    catalysis: network.catalysis.map((item) => item.id),
    limitations: releaseLimitations.map((item) => item.id)
  }
  const payloadRecords = { taxa, compounds: releaseCompounds, reactions: releaseReactions, proteins: releaseProteins, references: releaseReferences, catalysis: releaseCatalysis, limitations: releaseLimitations }
  const releasePayloads = Object.fromEntries(Object.entries(payloadRecords).map(([type, records]) => [type, { schema_version: '1.0.0', records }]))
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
  const fixtureRepository = 'https://github.com/brauliobo/biochemical-inference'
  const fixtureCommit = 'aab059b38ff9cad2cc278fa16d874eb78c2f020c'
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
    object_class: 'repository-authored-normalized-fixture',
    upstream_response: false,
    origin_url: `https://raw.githubusercontent.com/brauliobo/biochemical-inference/${fixtureCommit}/knowledge/sources/objects/sha256/${digestCharacter(String(index + 1))}`,
    artifact_repository: fixtureRepository,
    artifact_commit: fixtureCommit,
    source_release: 'fixture-2026.1',
    retrieved_at: '2026-01-01T00:00:00Z',
    source_ids: sourceIds[type],
    license: { id: licenses[type], name: licenses[type], url: `https://example.invalid/licenses/${licenses[type].toLowerCase()}`, redistribution: 'public' },
    included_content: 'normalized-public-release-records',
    included_record_ids: recordIds[type],
    resolved_source_ids: type === 'limitations' ? [] : sourceIds[type],
    unresolved_source_ids: type === 'limitations' ? ['CURATION'] : [],
    source_namespace_resolution: type === 'limitations' ? 'unavailable-in-core-schema' : type === 'catalysis' ? 'linked-record-source-ids' : 'record-source-ids',
    upstream_source_bytes_included: false,
    content_limitations: type === 'limitations'
      ? ['Selected normalized fixture records only.', 'CURATION cannot be resolved through the fixture core limitation schema; declaring it requires an additive core release.']
      : ['Selected normalized fixture records only.']
  }))
  const manifestFiles = types.map((type) => {
    const bytes = releasePayloadBytes(releasePayloads[type])
    return { path: `${type}.json`, sha256: sha256Hex(bytes), bytes: bytes.length, record_type: type, record_count: payloadRecords[type].length }
  })
  const content = {
    snapshot_schema_version: '1.0.0',
    digest_algorithm: 'sha256-rfc8785-snapshot-v1',
    release: { id: snapshotReleaseId, schema_version: '1.0.0', digest: BUNDLED_RELEASE.digest.slice('sha256:'.length) },
    manifest: {
      release_id: snapshotReleaseId,
      title: BUNDLED_RELEASE.title,
      schema_version: '1.0.0',
      release_digest: BUNDLED_RELEASE.digest.slice('sha256:'.length),
      digest_algorithm: 'sha256-canonical-manifest-v1',
      published_at: '2026-01-01',
      immutable: true,
      supported_taxa: ['NCBITaxon:9606', 'NCBITaxon:10090'],
      scientific_scope: 'Deterministic bundled test fixture.',
      files: manifestFiles,
      record_counts: Object.fromEntries(types.map((type) => [type, payloadRecords[type].length])),
      sources,
      compatibility: { consumer: 'biochemical-inference', network_contract: '1.0.0' }
    },
    provenance: {
      release_id: snapshotReleaseId,
      release_digest: BUNDLED_RELEASE.digest.slice('sha256:'.length),
      recipe: { path: BUNDLED_PROVENANCE.recipe.path, sha256: BUNDLED_PROVENANCE.recipe.digest.slice('sha256:'.length) },
      source_lock: { path: BUNDLED_PROVENANCE.sourceLock.path, sha256: BUNDLED_PROVENANCE.sourceLock.digest.slice('sha256:'.length) },
      source_objects: sourceObjects.map((item) => ({ name: item.name, record_type: item.record_type, sha256: item.sha256, bytes: item.bytes, object_class: item.object_class, upstream_response: item.upstream_response, origin_url: item.origin_url, artifact_repository: item.artifact_repository, artifact_commit: item.artifact_commit, source_release: item.source_release, retrieved_at: item.retrieved_at, source_ids: item.source_ids, license_id: item.license.id })),
      transformer: { id: 'normalized-json', version: '1.0.0', sha256: digestCharacter('c') },
      validation: { id: 'mvp-scientific', version: '1.0.0', sha256: digestCharacter('d') }
    },
    selected_taxon: selectedTaxon,
    network,
    release_payloads: releasePayloads,
    source_metadata: { sources, source_objects: sourceObjects },
    limitations: releaseLimitations,
    self_contained: true,
    restricted_dependencies: []
  }
  const { release_digest: _releaseDigest, ...manifestContent } = content.manifest
  const actualReleaseDigest = canonicalSha256Hex(manifestContent)
  content.release.digest = actualReleaseDigest
  content.manifest.release_digest = actualReleaseDigest
  content.provenance.release_digest = actualReleaseDigest
  const snapshot = { ...content, snapshot_digest: canonicalSha256Hex(content) }
  return verifyKnowledgeSnapshot(snapshot, { expectedReleaseId: snapshotReleaseId, expectedReleaseDigest: actualReleaseDigest, expectedTaxonId: selectedTaxon.id })
}
