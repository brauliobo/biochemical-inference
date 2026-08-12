import { execFile } from 'node:child_process'
import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { canonicalJson } from '../../shared/canonical-json.js'

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')
const encoded = (value, newline = false) => Buffer.from(`${canonicalJson(value)}${newline ? '\n' : ''}`)
const execute = promisify(execFile)
const producerFixtureRoot = resolve('tests/fixtures/entity-mention-handoff-producer')

export async function extractProducerEntityMentionHandoffFixture(root) {
  const archivePath = resolve(producerFixtureRoot, 'release.tar.gz')
  const archive = await readFile(archivePath)
  const handoffBytes = await readFile(resolve(producerFixtureRoot, 'rejected-unauthorized-handoff.json'))
  if (sha256(archive) !== '8661e6e137dc8458959f1f95c3ee254ea4994637ce4790f542bdb2edc180d118' || sha256(handoffBytes) !== 'a3fb50a6683387e7c399ff20ea3c47e0a62db25239ca212badbd4b23e3b45989') throw new Error('Pinned producer fixture bytes are invalid.')
  await execute('tar', ['-xzf', archivePath, '-C', root])
  const handoffPath = resolve(root, 'handoff.json')
  await writeFile(handoffPath, handoffBytes)
  const releaseRoot = resolve(root, 'release')
  const manifest = JSON.parse(await readFile(resolve(releaseRoot, 'manifest.json'), 'utf8'))
  return { releaseRoot, handoffPath, signaturePath: null, handoff: JSON.parse(handoffBytes), manifest }
}

const participants = [
  { charge: 1, chemical_id: 'CHEBI:15378', coefficient: '1', compartment_id: 'GO:0005829', formula: 'H', name: 'hydron', role: 'reactant' },
  { charge: -2, chemical_id: 'CHEBI:15636', coefficient: '1', compartment_id: 'GO:0005829', formula: 'C20H21N7O6', name: 'methylene-THF', role: 'reactant' },
  { charge: -2, chemical_id: 'CHEBI:18608', coefficient: '1', compartment_id: 'GO:0005829', formula: 'C20H23N7O6', name: 'methyl-THF', role: 'product' },
  { charge: -4, chemical_id: 'CHEBI:57783', coefficient: '1', compartment_id: 'GO:0005829', formula: 'NADPH', name: 'NADPH', role: 'reactant' },
  { charge: -3, chemical_id: 'CHEBI:58349', coefficient: '1', compartment_id: 'GO:0005829', formula: 'NADP', name: 'NADP', role: 'product' }
]

const assumptions = [
  'The exact Rhea chemistry is mapped only by reaction identity.',
  'No kinetic rate, concentration, flux bound, or physiological validation is asserted.'
]

function sourcePayload() {
  const value = {
    id: 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION', origin: 'curated', event_kind_id: 'EVENT_KIND:CHEMICAL_TRANSFORMATION', nutrient_concept_ids: ['NUTRIENT:FOLATE'],
    participants: participants.map((item) => ({ ...item })), direction: 'left-to-right', taxon_id: 'NCBITaxon:9606', tissue_id: 'UBERON:0002107', compartment_id: 'GO:0005829', human_applicability: 'inferred',
    source_ids: ['SOURCE:CHEBI', 'SOURCE:REACTOME', 'SOURCE:RHEA', 'SOURCE:UNIPROT'], lineage_ids: ['LINEAGE:ATLAS_MTHFR_V2', 'LINEAGE:FOUNDATION_V0_1'], assumptions,
    uncertainty: { representation: 'qualitative', description: 'Chemistry is curated; human applicability is inferred and kinetics are unknown.' }, simulation_mode: 'stoichiometric-symbolic',
    simulation_eligible: true, simulation_eligibility_rationale: 'Exact identity, participants, direction, context, uncertainty, and lineage are explicit.', trusted_knowledge_eligible: false,
    can_support_biological_conclusion: false, automatic_promotion: false, review_status: 'unreviewed'
  }
  return { ...value, content_digest: sha256(encoded(value)) }
}

function candidateEntity() {
  const payload = sourcePayload()
  return {
    alias_refs: [], attributes: {
      adaptation_origin: 'model-derived', assumptions, automatic_promotion: false, biological_support: false, compartment_id: 'GO:0005829', direction: 'left-to-right',
      event_kind_id: 'EVENT_KIND:CHEMICAL_TRANSFORMATION', human_applicability: 'inferred', nutrient_concept_ids: ['NUTRIENT:FOLATE'], participant_ids: participants.map((item) => item.chemical_id),
      simulation_eligibility_rationale: payload.simulation_eligibility_rationale, simulation_eligible: true, simulation_mode: 'stoichiometric-symbolic',
      source_candidate_id: payload.id, source_origin: 'curated', source_payload: payload, tissue_id: 'UBERON:0002107', trusted: false,
      uncertainty_description: payload.uncertainty.description, uncertainty_representation: 'qualitative'
    },
    canonical_label: 'MTHFR folate reduction simulation bootstrap candidate', classification_refs: [], description: null, entity_type: 'reaction-candidate', facet_ids: [], id: payload.id,
    limitation_refs: ['LIMITATION:BOOTSTRAP_COVERAGE', 'LIMITATION:BOOTSTRAP_KINETICS', 'LIMITATION:BOOTSTRAP_PATHWAY', 'LIMITATION:BOOTSTRAP_PROMOTION'], mapping_refs: [],
    profile_id: 'ATTRIBUTE_PROFILE:REACTION_CANDIDATE_V1', provenance_refs: ['PROVENANCE:SIMULATION_BOOTSTRAP'], rights_refs: ['RIGHTS:SIMULATION_BOOTSTRAP'],
    source_lineage_refs: payload.lineage_ids, source_mapping_refs: [], source_refs: ['SOURCE:SIMULATION_BOOTSTRAP'], source_release_id: 'nutrient-reaction-simulation-bootstrap-v0.1.0', taxon_id: 'NCBITaxon:9606'
  }
}

function reactionEntity() {
  return {
    alias_refs: [], attributes: {
      direction: 'left-to-right', participant_ids: participants.map((item) => item.chemical_id), source_payload: {
        id: 'RHEA:19819', name: 'MTHFR physiological reduction', entity_type: 'reaction', taxon_id: null, external_ids: [], source_ids: ['RHEA'], equation: 'Methylene-THF + NADPH + H -> methyl-THF + NADP', direction: 'left-to-right',
        participants: participants.map((item) => ({ coefficient: 1, compound_id: item.chemical_id, side: item.role }))
      }
    },
    canonical_label: 'MTHFR physiological reduction', classification_refs: [], description: null, entity_type: 'reaction', facet_ids: [], id: 'RHEA:19819', limitation_refs: [], mapping_refs: [],
    profile_id: 'ATTRIBUTE_PROFILE:REACTION_V1', provenance_refs: ['PROVENANCE:CONTEXTUAL_RHEA'], rights_refs: ['RIGHTS:CONTEXTUAL_RHEA'], source_lineage_refs: [], source_mapping_refs: [],
    source_refs: ['SOURCE:CONTEXTUAL_RHEA'], source_release_id: 'contextual-mthfr-human-mouse-v2.0.0', taxon_id: null
  }
}

function humanCatalystEntities() {
  return [
    {
      alias_refs: [], attributes: { component_ids: ['UniProtKB:P42898'], source_payload: { component_ids: ['UniProtKB:P42898'], entity_type: 'complex', external_ids: [], id: 'Reactome:R-HSA-200713', name: 'MTHFR dimer', source_ids: ['REACTOME'], taxon_id: 'NCBITaxon:9606' } }, canonical_label: 'MTHFR dimer', classification_refs: [], description: null, entity_type: 'complex', facet_ids: [], id: 'Reactome:R-HSA-200713', limitation_refs: [], mapping_refs: [], profile_id: 'ATTRIBUTE_PROFILE:COMPLEX_V1', provenance_refs: ['PROVENANCE:CONTEXTUAL_REACTOME'], rights_refs: ['RIGHTS:CONTEXTUAL_REACTOME'], source_lineage_refs: [], source_mapping_refs: [], source_refs: ['SOURCE:CONTEXTUAL_REACTOME'], source_release_id: 'contextual-mthfr-human-mouse-v2.0.0', taxon_id: 'NCBITaxon:9606'
    },
    {
      alias_refs: [], attributes: { accession: 'P42898', gene_id: 'HGNC:7436', source_payload: { entity_type: 'protein', external_ids: [], gene_id: 'HGNC:7436', id: 'UniProtKB:P42898', name: 'Methylenetetrahydrofolate reductase (NADPH)', reviewed: true, source_ids: ['UNIPROTKB'], taxon_id: 'NCBITaxon:9606' } }, canonical_label: 'Methylenetetrahydrofolate reductase (NADPH)', classification_refs: [], description: null, entity_type: 'protein', facet_ids: [], id: 'UniProtKB:P42898', limitation_refs: [], mapping_refs: [], profile_id: 'ATTRIBUTE_PROFILE:PROTEIN_V1', provenance_refs: ['PROVENANCE:CONTEXTUAL_UNIPROTKB'], rights_refs: ['RIGHTS:CONTEXTUAL_UNIPROTKB'], source_lineage_refs: [], source_mapping_refs: [], source_refs: ['SOURCE:CONTEXTUAL_UNIPROTKB'], source_release_id: 'contextual-mthfr-human-mouse-v2.0.0', taxon_id: 'NCBITaxon:9606'
    }
  ]
}

function edge(id, taxon, subject, predicate, object, origin) {
  const source = predicate === 'catalyzes' ? 'UNIPROTKB' : 'REACTOME'
  const taxonLabel = taxon === 'NCBITaxon:9606' ? 'HUMAN' : 'MOUSE'
  return {
    id, policy_id: `PREDICATE_POLICY:${predicate.toUpperCase()}`, policy_digest: 'a'.repeat(64), subject_id: subject, predicate, object_id: object, origin,
    derivation: { method: origin === 'inferred' ? 'contextual atlas inferred claim adaptation' : 'explicit source orthology transformation', description: 'Preserved source claim.', source_edge_refs: origin === 'inferred' ? [] : ['EDGE:HUMAN'], transformation_refs: origin === 'inferred' ? [] : ['TRANSFORMATION:MTHFR'] },
    source_record_id: `CLAIM:${taxonLabel}-${predicate}`, source_predicate: predicate, source_polarity: 'supporting', source_mapping_status: null, source_evidence_ids: [`EVIDENCE:${source}-${taxonLabel}`],
    polarity: 'positive', epistemic_status: 'supported', context: { taxon_id: taxon, anatomical_structure_id: null, tissue_id: 'UBERON:0002107', cell_type_id: null, compartment_id: 'GO:0005829' },
    evidence_refs: [`EVIDENCE:${source}-${taxonLabel}`], provenance_refs: [`PROVENANCE:CONTEXTUAL_${source}`], rights_refs: [`RIGHTS:CONTEXTUAL_${source}`], review_status: 'reviewed', automatic_promotion: false, can_support_biological_conclusion: false
  }
}

function documents(options) {
  const rightsIds = ['SIMULATION_BOOTSTRAP', 'CONTEXTUAL_RHEA', 'CONTEXTUAL_UNIPROTKB', 'CONTEXTUAL_REACTOME']
  const sourceIds = ['SIMULATION_BOOTSTRAP', 'CONTEXTUAL_RHEA', 'CONTEXTUAL_UNIPROTKB', 'CONTEXTUAL_REACTOME']
  const edges = [
    edge('EDGE:HUMAN', 'NCBITaxon:9606', 'Reactome:R-HSA-200713', 'catalyzes', 'RHEA:19819', 'inferred'),
    edge('EDGE:MOUSE', 'NCBITaxon:10090', 'Reactome:R-MMU-200713', 'catalyzes', 'RHEA:19819', 'orthology-transferred'),
    edge('EDGE:HUMAN_PATH', 'NCBITaxon:9606', 'RHEA:19819', 'participates_in', 'Reactome:R-HSA-196757', 'inferred'),
    edge('EDGE:MOUSE_PATH', 'NCBITaxon:10090', 'RHEA:19819', 'participates_in', 'Reactome:R-MMU-196757', 'orthology-transferred')
  ]
  const limitations = [
    ['LIMITATION:BOOTSTRAP_COVERAGE', 'coverage', 'One candidate does not establish broad coverage.', 'nutrient-reaction-simulation-bootstrap-v0.1.0'],
    ['LIMITATION:BOOTSTRAP_KINETICS', 'simulation', 'No kinetic law or parameters are provided.', 'nutrient-reaction-simulation-bootstrap-v0.1.0'],
    ['LIMITATION:BOOTSTRAP_PATHWAY', 'evidence', 'Pathway placement is inferred.', 'nutrient-reaction-simulation-bootstrap-v0.1.0'],
    ['LIMITATION:BOOTSTRAP_PROMOTION', 'simulation', 'Simulation cannot promote source knowledge.', 'nutrient-reaction-simulation-bootstrap-v0.1.0'],
    ['LIMITATION:BROAD-DISCOVERY-MTHFR-GAP', 'coverage', 'Broad discovery excluded its MTHFR candidates.', null]
  ].map(([id, category, statement, source_release_id]) => ({ id, category, statement, applies_to_ids: id.includes('BROAD') ? ['RHEA:19819', 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'] : ['REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'], source_release_id }))
  if (options.omitLimitation) limitations.pop()
  const broad = ['RHEA', 'REACTOME', 'RECONCILIATION'].map((name) => ({ id: `DISCOVERY_REPORT:${name}`, mthfr_disposition: name === 'RECONCILIATION' ? null : { disposition: 'excluded-no-direct-candidate', source_reaction_id: `SOURCE:${name}` }, trust_boundary: { simulation_eligible: false, trusted_knowledge_eligible: false, can_support_biological_conclusion: false, automatic_promotion: options.promoteBroad === true && name === 'RHEA' } }))
  const output = {
    aliases: [],
    article_identifiers: [],
    article_lifecycle: [],
    article_sections: [],
    article_spans: [],
    articles: [],
    attribute_profiles: [],
    broad_discovery: broad,
    classifications: [],
    contexts: [{ id: 'JSONLD_CONTEXT:FIXTURE' }],
    coverage: [],
    edges,
    entities: [candidateEntity(), reactionEntity(), ...humanCatalystEntities()],
    entity_types: ['assay', 'complex', 'protein', 'reaction', 'reaction-candidate'].map((entity_type) => ({ id: `ENTITY_TYPE:${entity_type.toUpperCase()}`, entity_type })),
    evidence: sourceIds.slice(2).flatMap((name) => ['HUMAN', 'MOUSE'].map((taxon) => ({ id: `EVIDENCE:${name.replace('CONTEXTUAL_', '')}-${taxon}`, source_ref: `SOURCE:${name}`, locator: 'fixture evidence', evidence_kind: 'curation', excerpt: null, provenance_refs: [`PROVENANCE:${name}`], rights_refs: [`RIGHTS:${name}`] }))),
    facets: [],
    input_closures: [
      ['nutrient-reaction-simulation-bootstrap-v0.1.0', '2f3afbed57ad6de9d4afff20c766eb08ed766e7e6593724f40240da147e86b69'],
      ['contextual-mthfr-human-mouse-v2.0.0', '79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f'],
      ['nutrient-reaction-atlas-foundation-v0.1.0', 'ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4']
    ].map(([input_id, declared_digest], index) => ({ id: `INPUT_CLOSURE:${index}`, input_id, declared_digest })),
    limitations,
    mappings: [],
    mention_coverage: [],
    mention_resolutions: [{ id: 'MENTION_RESOLUTION:1', status: options.contextualDiseaseMention ? 'resolved' : 'unresolved', selected_entity_id: options.contextualDiseaseMention ? 'MONDO:0009353' : null, review_status: 'unreviewed', can_support_biological_conclusion: false }],
    mentions: [{ id: 'MENTION:1', review_status: 'unreviewed', can_support_biological_conclusion: false, automatic_promotion: false, rights_refs: [] }],
    model_provenance: [],
    predicate_policies: [],
    prefixes: [],
    provenance: sourceIds.map((name) => ({ id: `PROVENANCE:${name}`, activity: 'fixture adaptation', agent: 'fixture assembler', method: 'exact mapping', generated_at: '2026-08-10T00:00:00Z', source_refs: [`SOURCE:${name}`], parent_refs: [] })),
    rights: rightsIds.map((name) => ({ id: `RIGHTS:${name}`, license: 'Local synthetic reviewed terms', license_url: null, attribution: 'Local synthetic fixture attribution', redistribution: options.restrictedRights && name === 'SIMULATION_BOOTSTRAP' ? 'restricted' : 'conditional', allowed_public_content_classes: [], restrictions: ['Retain the local synthetic fixture attribution'] })),
    rights_dispositions: options.withoutReviewedDisposition ? [] : rightsIds.map((name) => ({
      id: `RIGHTS_DISPOSITION:${name}`, rights_ref: `RIGHTS:${name}`, source_ref: `SOURCE:${name}`, content_class: 'simulation-handoff-payload', decision: 'authorized',
      license: 'Local synthetic reviewed terms', license_url: null, attribution: 'Local synthetic fixture attribution', redistribution: 'conditional',
      conditions: ['Retain the local synthetic fixture attribution'], evidence: [{ artifact_id: `LOCAL_SYNTHETIC_RIGHTS_EVIDENCE:${name}`, sha256: sha256(Buffer.from(`local-synthetic-reviewed-rights:${name}`)) }], reviewer_identity: 'LOCAL_SYNTHETIC_REVIEWER:TEST-ONLY',
      reviewed_at: '2026-08-10T00:00:00Z', immutable: true
    })),
    simulation_coverage: [{ expected_candidate_ids: ['REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'], simulation_ready_ids: ['REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'], broad_reaction_coverage_status: 'not-started' }],
    slice_gaps: [],
    slice_summary: [],
    source_coverage: [],
    source_lineage: [
      { id: 'LINEAGE:ATLAS_MTHFR_V2', source_release_id: 'nutrient-reaction-simulation-bootstrap-v0.1.0', release_id: 'contextual-mthfr-human-mouse-v2.0.0', release_digest: '79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f', role: 'source-evidence', record_ids: ['RHEA:19819'], statement: 'Exact contextual reaction lineage.' },
      { id: 'LINEAGE:FOUNDATION_V0_1', source_release_id: 'nutrient-reaction-simulation-bootstrap-v0.1.0', release_id: 'nutrient-reaction-atlas-foundation-v0.1.0', release_digest: 'ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4', role: 'foundation', record_ids: ['NUTRIENT:FOLATE'], statement: 'Exact foundation lineage.' }
    ],
    source_mappings: [],
    sources: sourceIds.map((name) => ({ id: `SOURCE:${name}`, name, locator: 'https://example.test/source', version: 'fixture', retrieved_at: null, rights_refs: [`RIGHTS:${name}`] })),
    text_assertions: [{ id: 'TEXT_ASSERTION:1', review_status: 'unreviewed', trusted_knowledge_eligible: options.trustedAssertion === true, can_support_biological_conclusion: options.conclusionEligible === true, automatic_promotion: false, extraction_origin: options.coMention ? 'co-mentioned' : 'source-annotation', rights_refs: [] }],
    transformations: []
  }
  if (options.missingRights) output.rights = output.rights.filter((record) => record.id !== 'RIGHTS:SIMULATION_BOOTSTRAP')
  if (options.unresolvedIdentity) output.entities[0].attributes.source_payload.participants[0].chemical_id = null
  return output
}

export async function writeLocalSyntheticReviewedDispositionFixture(root, options = {}) {
  const releaseRoot = resolve(root, 'release')
  await mkdir(resolve(releaseRoot, 'entity-records'), { recursive: true })
  const values = documents(options)
  const files = new Map()
  const metadata = new Map()
  const add = (path, value, { compressed = false, mediaType = 'application/json', recordCount = value.records?.length } = {}) => {
    const content = typeof value === 'string' ? Buffer.from(value) : encoded(value)
    files.set(path, compressed ? gzipSync(content, { level: 9, mtime: 0 }) : content)
    metadata.set(path, { content, mediaType: compressed ? 'application/gzip' : mediaType, recordCount })
  }
  for (const [name, records] of Object.entries(values)) add(`entity-records/${name}.json`, { records, schema_version: '1.0.0' })

  const envelopeBase = {
    context_ref: 'JSONLD_CONTEXT:FIXTURE', description: 'Fixture MTHFR folate slice', digest_algorithm: 'sha256-canonical-manifest-v1',
    files: [...files].map(([path, bytes]) => ({ bytes: bytes.length, path, record_count: JSON.parse(bytes).records.length, record_type: path.slice('entity-records/'.length, -'.json'.length), sha256: sha256(bytes) })),
    immutable: true, published_at: '2026-08-10', release_id: 'entity-mention-atlas-mthfr-folate-v1.0.0', schema_version: '1.0.0', title: 'Fixture atlas'
  }
  const entityEnvelope = { ...envelopeBase, release_digest: sha256(encoded(envelopeBase)) }
  add('entity-release.json', entityEnvelope, { recordCount: entityEnvelope.files.length })

  const direct = {
    'entity-facets.json': 'facets', 'entity-input-closures.json': 'input_closures', 'entity-linked-coverage.json': 'coverage', 'entity-linked-evidence.json': 'evidence',
    'entity-linked-facets.json': 'facets', 'entity-linked-gaps.json': 'slice_gaps', 'entity-linked-limitations.json': 'limitations', 'entity-linked-provenance.json': 'provenance',
    'entity-linked-rights.json': 'rights', 'entity-linked-source-coverage.json': 'source_coverage', 'entity-linked-sources.json': 'sources', 'entity-predicates.json': 'predicate_policies',
    'entity-profiles.json': 'attribute_profiles', 'entity-slice-summary.json': 'slice_summary', 'entity-types.json': 'entity_types'
  }
  for (const [path, family] of Object.entries(direct)) add(path, { records: values[family], schema_version: '1.0.0' })
  add('entity-context.json', { prefixes: values.prefixes, schema_version: '1.0.0', selected_context: values.contexts[0] }, { recordCount: values.contexts.length + values.prefixes.length })
  for (const { entity_type } of values.entity_types) add(`entity-index-${entity_type}.json.gz`, { entity_type, records: values.entities.filter((record) => record.entity_type === entity_type).map((record) => ({ id: record.id, type: record.entity_type })), schema_version: '1.0.0' }, { compressed: true })
  add('article-index.json.gz', { records: values.articles.map((record) => ({ id: record.id })), schema_version: '1.0.0' }, { compressed: true })

  const shards = Array.from({ length: 256 }, (_, index) => index.toString(16).padStart(2, '0'))
  const byShard = (records) => Object.fromEntries(shards.map((shard) => [shard, records.filter((record) => sha256(Buffer.from(record.id)).startsWith(shard))]))
  const entityShards = byShard(values.entities)
  const articleShards = byShard(values.articles)
  const resolved = new Set(values.mention_resolutions.filter((record) => record.status === 'resolved' && record.selected_entity_id !== null).map((record) => record.selected_entity_id))
  for (const shard of shards) for (const [family, records] of [
    ['article-details', articleShards[shard].map((record) => ({ id: record.id }))],
    ['entity-details', entityShards[shard].map((record) => ({ id: record.id }))],
    ['entity-edges-in', entityShards[shard].map((record) => ({ entity_id: record.id }))],
    ['entity-edges-out', entityShards[shard].map((record) => ({ entity_id: record.id }))],
    ['mentions-by-article', articleShards[shard].map((record) => ({ article_id: record.id }))],
    ['mentions-by-entity', entityShards[shard].filter((record) => resolved.has(record.id)).map((record) => ({ entity_id: record.id }))]
  ]) add(`${family}-${shard}.json.gz`, { records, schema_version: '1.0.0', shard, shard_algorithm: 'sha256-utf8-first-byte-v1' }, { compressed: true })

  const graphCount = values.entities.length + values.edges.length + values.articles.length + values.mentions.length + values.text_assertions.length + values.rights.length + values.provenance.length
  add('entity-atlas.jsonld', { '@context': {}, '@graph': Array.from({ length: graphCount }, (_, index) => ({ id: `urn:fixture:${index}` })) }, { mediaType: 'application/ld+json', recordCount: graphCount })
  const lengths = (records, base) => records.reduce((total, record) => total + base + (record.rights_refs?.length ?? 0) + (record.provenance_refs?.length ?? 0) + (record.facet_ids?.length ?? 0) + (record.source_refs?.length ?? 0) + Number(base === 4 && 'taxon_id' in record && record.taxon_id !== null), 0)
  const nquadCount = lengths(values.entities, 4) + lengths(values.edges, 6) + lengths(values.articles, 5) + lengths(values.mentions, 4) + lengths(values.text_assertions, 7) + values.rights.length * 4 + values.provenance.length * 4
  add('entity-atlas.nq', `${Array.from({ length: nquadCount }, (_, index) => `<urn:s${index}> <urn:p> <urn:o> <urn:g> .`).join('\n')}\n`, { mediaType: 'application/n-quads', recordCount: nquadCount })

  if (options.projectionMutation) {
    const { path, operation } = options.projectionMutation
    const selected = metadata.get(path)
    const document = JSON.parse(selected.content)
    if (operation === 'remove') document.records.pop()
    else if (operation === 'add') document.records.push({ id: 'ENTITY:CONSISTENT-LIE' })
    else throw new Error(`Unknown projection mutation ${operation}.`)
    add(path, document, { compressed: selected.mediaType === 'application/gzip' })
  }

  const descriptorFor = (filename, bytes) => {
    const selected = metadata.get(filename)
    return { filename, media_type: selected.mediaType, bytes: bytes.length, sha256: sha256(bytes), content_bytes: selected.content.length, content_sha256: sha256(selected.content), record_count: selected.recordCount }
  }
  const staticDescriptors = [...files].map(([filename, bytes]) => descriptorFor(filename, bytes))
  const staticManifest = {
    schema_version: '1.0.0', artifact_kind: 'entity-mention-atlas-static-tree', release_id: entityEnvelope.release_id, release_digest: entityEnvelope.release_digest,
    digest_algorithm: 'sha256-canonical-manifest-v1', digest_description: 'fixture', shard_algorithm: 'sha256-utf8-first-byte-v1', counts: { entities: values.entities.length, edges: 4, articles: 0, mentions: 1, assertions: 1, fixed_shards_per_family: 256, fixed_shard_families: 6, files: staticDescriptors.length }, files: staticDescriptors
  }
  add('entity-static-manifest.json', staticManifest, { recordCount: staticDescriptors.length })

  const fileDescriptors = [...files].map(([filename, bytes]) => descriptorFor(filename, bytes))
  if (options.invalidRecordCount) fileDescriptors.find((descriptor) => descriptor.filename === 'entity-records/entities.json').record_count += 1
  const release = { id: 'nutrient-reaction-pages-253-rhea-141-reactome-97', foundation_id: 'nutrient-reaction-atlas-foundation-v0.1.0', foundation_digest: 'ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4', chebi_release: '253', rhea_release: '141', reactome_release: '97' }
  const manifest = {
    schema_version: '1.0.0', artifact_kind: 'nutrient-reaction-github-pages-static-tree', release, cutoff_date: '2026-07-21', source_artifacts: [{ id: 'fixture/source.json', bytes: 1, sha256: 'f'.repeat(64), media_type: 'application/json' }],
    counts: { ontology_terms: 0, ontology_relations: 0, registered_sources: 4, acquisitions: 0, rhea_reactions: 0, reactome_reactions: 0, reactions: 0, detail_shards: 0, source_dispositions: 0, reconciliation_links: 0, reconciliation_outcomes: 0, entity_mention_entities: values.entities.length + Number(Boolean(options.invalidAggregateCount)), entity_mention_edges: 4, entity_mention_articles: 0, entity_mention_mentions: 1, entity_mention_assertions: 1, entity_mention_static_files: files.size, output_files: files.size },
    files: fileDescriptors, boundary: { serving_model: 'serverless-static-files', access: 'read-only', runtime_database: false, mutation_api: false, automatic_promotion: false }
  }
  const manifestBytes = encoded(manifest, true)
  files.set('manifest.json', manifestBytes)
  let officialPublicJwk = null
  let officialKeyId = null
  if (options.pagesEnvelope) {
    const pair = generateKeyPairSync('ed25519')
    officialPublicJwk = pair.publicKey.export({ format: 'jwk' })
    officialKeyId = `sha256:${sha256(encoded(officialPublicJwk))}`
    const envelope = {
      schema_version: '1.0.0', artifact_kind: 'nutrient-reaction-pages-manifest-signature',
      manifest: { filename: 'manifest.json', bytes: manifestBytes.length, sha256: sha256(manifestBytes) },
      signer: { algorithm: 'Ed25519', key_id: officialKeyId, public_jwk: officialPublicJwk },
      signature: sign(null, manifestBytes, pair.privateKey).toString('base64')
    }
    files.set('envelope.json', encoded(envelope))
  }
  await Promise.all([...files].map(([path, bytes]) => writeFile(resolve(releaseRoot, path), bytes)))

  const candidate = {
    id: 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION', source_id: 'RHEA:19819', participants, direction_status: 'known', compartments: [{ id: 'GO:0005829', name: 'cytosol', go_ids: ['GO:0005829'] }],
    balance_status: 'balanced', human_applicability_status: 'inferred', simulation_eligibility_status: 'eligible', eligibility_rationale: 'Exact eligible fixture.', uncertainty_status: 'qualitative uncertainty retained',
    disease_status: 'unknown', drug_status: 'unknown', pathogen_status: 'unknown', source_artifact_sha256: sha256(files.get('entity-records/entities.json'))
  }
  candidate.candidate_sha256 = sha256(encoded(candidate))
  const content = {
    schema: 'nutrient-reaction-atlas/simulation-handoff/v1', createdAt: '2026-08-11T00:00:00.000Z', intent: 'external-inference-request', execution: 'none: this artifact contains no numerical result and this SPA runs no simulation',
    hypothesis: 'Exercise the exact MTHFR identity without biological conclusions.', reactionIds: ['RHEA:19819'], release: { ...release, manifest_sha256: sha256(manifestBytes) }, candidates: [candidate], mode: 'eligible-stoichiometric', assumptions,
    evidence: { trusted: [], unreviewed: [options.coMentionAsEvidence ? 'TEXT_ASSERTION:1' : 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'], browserLocalReviews: 'excluded: non-authoritative and never trusted' },
    boundaries: { simulation: 'boundary: handoff only; no numerical execution', unresolvedMappings: 'excluded unless explicitly identified in assumptions', unknownDiseaseRelations: true, unknownDrugRelations: true, unknownPathogenRelations: true, sourceDeclaredUnknowns: options.omitUnknowns ? ['disease', 'drug'] : ['disease', 'drug', 'pathogen'], userAddedUnknowns: [] }
  }
  const handoff = { ...content, id: `sha256:${sha256(encoded(content))}`, digestAlgorithm: 'SHA-256', desktop: { local: true, official: false } }
  const handoffPath = resolve(root, 'handoff.json')
  await writeFile(handoffPath, encoded(handoff))

  let signaturePath = null
  if (options.signed) {
    const pair = generateKeyPairSync('ed25519')
    const public_jwk = pair.publicKey.export({ format: 'jwk' })
    const key_id = `sha256:${sha256(encoded(public_jwk))}`
    const signature = { schema_version: '1.0.0', artifact_kind: 'nutrient-reaction-desktop-local-signature', official: options.official === true, release_id: release.id, manifest: { filename: 'manifest.json', bytes: manifestBytes.length, sha256: sha256(manifestBytes) }, signer: { algorithm: 'Ed25519', key_id, public_jwk, scope: 'workspace-local-user-key' }, signature: sign(null, manifestBytes, pair.privateKey).toString('base64') }
    signaturePath = resolve(root, 'local-signature.json')
    await writeFile(signaturePath, encoded(signature))
  }
  const requiredFiles = Object.fromEntries([...files].filter(([path]) => !['manifest.json', 'envelope.json'].includes(path)).map(([path, bytes]) => [path, sha256(bytes)]))
  const pins = {
    servingManifestSha256: sha256(manifestBytes), servingManifestBytes: manifestBytes.length, servingReleaseId: release.id, servingSchemaVersion: '1.0.0', handoffContract: content.schema,
    entityReleaseId: entityEnvelope.release_id, entityReleaseDigest: entityEnvelope.release_digest, entityReleaseSha256: sha256(files.get('entity-release.json')),
    entityStaticManifestSha256: sha256(files.get('entity-static-manifest.json')), outputFiles: manifest.files.length, entityStaticFiles: staticManifest.files.length + 1,
    entityEnvelopeFiles: entityEnvelope.files.length,
    officialKeyId: options.pagesEnvelope && !options.unpinnedPagesEnvelope ? officialKeyId : null,
    officialPublicJwk: options.pagesEnvelope && !options.unpinnedPagesEnvelope ? officialPublicJwk : null,
    requiredFiles
  }
  return { fixtureKind: 'local-synthetic-reviewed-rights-disposition', releaseRoot, handoffPath, signaturePath, pins, handoff, manifest }
}
