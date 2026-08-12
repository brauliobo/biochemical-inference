import { createHash, createPublicKey, verify as verifySignature } from 'node:crypto'
import { constants } from 'node:fs'
import { TextDecoder } from 'node:util'
import { gunzipSync } from 'node:zlib'
import { z } from 'zod'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  EntityMentionServingManifestSchema,
  EntityMentionSimulationHandoffSchema,
  ProducerLocalSignatureSchema,
  ProducerPagesSignatureEnvelopeSchema,
  StaticFileDescriptorSchema
} from '../../shared/entity-mention-handoff-contracts.js'
import { openPinnedDirectory, openRegularNoFollow } from '../data-plane/safe-path.js'
import { parseBoundedJson } from './bounded-json.js'
import { ENTITY_MENTION_HANDOFF_PINS } from './pins.js'
import { verifyEntityMentionStaticCounts } from './static-counts.js'

const utf8 = new TextDecoder('utf-8', { fatal: true })
const SHA256 = /^[a-f0-9]{64}$/
const SAFE_PATH = /^[a-z0-9][a-z0-9_.-]*(?:\/[a-z0-9][a-z0-9_.-]*)*$/
const CANDIDATE_ID = 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'
const REACTION_ID = 'RHEA:19819'
const HANDOFF_CONTENT_CLASS = 'simulation-handoff-payload'
const PAGES_DATA_PATH = /^(?:terms|sources|coverage)\.json$|^(?:reaction-index|reaction-details-[a-f0-9]{2}|reconciliation|dispositions)\.json\.gz$/
const REQUIRED_LIMITATION_IDS = Object.freeze([
  'LIMITATION:BOOTSTRAP_COVERAGE',
  'LIMITATION:BOOTSTRAP_KINETICS',
  'LIMITATION:BOOTSTRAP_PATHWAY',
  'LIMITATION:BOOTSTRAP_PROMOTION',
  'LIMITATION:BROAD-DISCOVERY-MTHFR-GAP'
])
const ENTITY_RECORD_FAMILIES = Object.freeze([
  'aliases', 'article_identifiers', 'article_lifecycle', 'article_sections', 'article_spans', 'articles', 'attribute_profiles', 'broad_discovery', 'classifications',
  'contexts', 'coverage', 'edges', 'entities', 'entity_types', 'evidence', 'facets', 'input_closures', 'limitations', 'mappings', 'mention_coverage',
  'mention_resolutions', 'mentions', 'model_provenance', 'predicate_policies', 'prefixes', 'provenance', 'rights', 'rights_dispositions', 'simulation_coverage', 'slice_gaps',
  'slice_summary', 'source_coverage', 'source_lineage', 'source_mappings', 'sources', 'text_assertions', 'transformations'
])

export const ENTITY_MENTION_IMPORT_LIMITS = Object.freeze({
  files: 1_700,
  depth: 3,
  manifestBytes: 1024 * 1024,
  handoffBytes: 1024 * 1024,
  signatureBytes: 64 * 1024,
  fileBytes: 64 * 1024 * 1024,
  contentBytes: 256 * 1024 * 1024,
  totalTransportBytes: 1024 * 1024 * 1024,
  totalContentBytes: 2 * 1024 * 1024 * 1024
})

const DocumentSchema = z.object({ schema_version: z.literal('1.0.0'), records: z.array(z.unknown()) }).strict()
const StringArray = z.array(z.string())

const CandidateSourceParticipantSchema = z.object({
  charge: z.number().int(), chemical_id: z.string(), coefficient: z.string(), compartment_id: z.string(), formula: z.string(), name: z.string(), role: z.enum(['reactant', 'product'])
}).strict()

const CandidateEntitySchema = z.object({
  alias_refs: StringArray, canonical_label: z.string(), classification_refs: StringArray, description: z.null(), entity_type: z.literal('reaction-candidate'), facet_ids: StringArray,
  id: z.literal(CANDIDATE_ID), limitation_refs: z.array(z.string()).length(4), mapping_refs: StringArray, profile_id: z.literal('ATTRIBUTE_PROFILE:REACTION_CANDIDATE_V1'),
  provenance_refs: z.array(z.string()).min(1), rights_refs: z.array(z.string()).min(1), source_lineage_refs: z.array(z.string()).min(1), source_mapping_refs: StringArray,
  source_refs: z.array(z.string()).min(1), source_release_id: z.literal('nutrient-reaction-simulation-bootstrap-v0.1.0'), taxon_id: z.literal('NCBITaxon:9606'),
  attributes: z.object({
    adaptation_origin: z.literal('model-derived'), assumptions: z.array(z.string()).min(2), automatic_promotion: z.literal(false), biological_support: z.literal(false),
    compartment_id: z.literal('GO:0005829'), direction: z.literal('left-to-right'), event_kind_id: z.literal('EVENT_KIND:CHEMICAL_TRANSFORMATION'), human_applicability: z.literal('inferred'),
    nutrient_concept_ids: z.tuple([z.literal('NUTRIENT:FOLATE')]), participant_ids: z.array(z.string()).length(5), simulation_eligibility_rationale: z.string().min(1),
    simulation_eligible: z.literal(true), simulation_mode: z.literal('stoichiometric-symbolic'), source_candidate_id: z.literal(CANDIDATE_ID), source_origin: z.literal('curated'),
    tissue_id: z.literal('UBERON:0002107'), trusted: z.literal(false), uncertainty_description: z.string().min(1), uncertainty_representation: z.literal('qualitative'),
    source_payload: z.object({
      id: z.literal(CANDIDATE_ID), content_digest: z.string().regex(SHA256), origin: z.literal('curated'), event_kind_id: z.literal('EVENT_KIND:CHEMICAL_TRANSFORMATION'),
      nutrient_concept_ids: z.tuple([z.literal('NUTRIENT:FOLATE')]), participants: z.array(CandidateSourceParticipantSchema).length(5), direction: z.literal('left-to-right'),
      taxon_id: z.literal('NCBITaxon:9606'), tissue_id: z.literal('UBERON:0002107'), compartment_id: z.literal('GO:0005829'), human_applicability: z.literal('inferred'),
      source_ids: z.array(z.string()).length(4), lineage_ids: z.array(z.string()).length(2), assumptions: z.array(z.string()).min(2),
      uncertainty: z.object({ representation: z.literal('qualitative'), description: z.string().min(1) }).strict(), simulation_mode: z.literal('stoichiometric-symbolic'),
      simulation_eligible: z.literal(true), simulation_eligibility_rationale: z.string().min(1), trusted_knowledge_eligible: z.literal(false),
      can_support_biological_conclusion: z.literal(false), automatic_promotion: z.literal(false), review_status: z.literal('unreviewed')
    }).strict()
  }).strict()
}).strict()

const ReactionEntitySchema = z.object({
  alias_refs: StringArray, canonical_label: z.string(), classification_refs: StringArray, description: z.null(), entity_type: z.literal('reaction'), facet_ids: StringArray,
  id: z.literal(REACTION_ID), limitation_refs: StringArray, mapping_refs: StringArray, profile_id: z.literal('ATTRIBUTE_PROFILE:REACTION_V1'), provenance_refs: z.array(z.string()).min(1),
  rights_refs: z.array(z.string()).min(1), source_lineage_refs: StringArray, source_mapping_refs: StringArray, source_refs: z.array(z.string()).min(1),
  source_release_id: z.literal('contextual-mthfr-human-mouse-v2.0.0'), taxon_id: z.null(),
  attributes: z.object({
    direction: z.literal('left-to-right'), participant_ids: z.array(z.string()).length(5),
    source_payload: z.object({
      id: z.literal(REACTION_ID), name: z.string(), entity_type: z.literal('reaction'), taxon_id: z.null(), external_ids: StringArray, source_ids: z.tuple([z.literal('RHEA')]),
      equation: z.string(), direction: z.literal('left-to-right'), participants: z.array(z.object({ coefficient: z.literal(1), compound_id: z.string(), side: z.enum(['reactant', 'product']) }).strict()).length(5)
    }).strict()
  }).strict()
}).strict()

const RelevantEdgeSchema = z.object({
  id: z.string(), policy_id: z.string(), policy_digest: z.string().regex(SHA256), subject_id: z.string(), predicate: z.enum(['catalyzes', 'participates_in']), object_id: z.string(),
  origin: z.enum(['inferred', 'orthology-transferred']), derivation: z.object({ method: z.string(), description: z.string(), source_edge_refs: StringArray, transformation_refs: StringArray }).strict(),
  source_record_id: z.string(), source_predicate: z.string(), source_polarity: z.literal('supporting'), source_mapping_status: z.null(), source_evidence_ids: StringArray,
  polarity: z.literal('positive'), epistemic_status: z.literal('supported'), context: z.object({ taxon_id: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']), anatomical_structure_id: z.null(), tissue_id: z.literal('UBERON:0002107'), cell_type_id: z.null(), compartment_id: z.literal('GO:0005829') }).strict(),
  evidence_refs: StringArray, provenance_refs: z.array(z.string()).min(1), rights_refs: z.array(z.string()).min(1), review_status: z.literal('reviewed'), automatic_promotion: z.literal(false), can_support_biological_conclusion: z.literal(false)
}).strict()

const RightsSchema = z.object({ id: z.string(), license: z.string(), license_url: z.string().url().nullable(), attribution: z.string().min(1), redistribution: z.enum(['permitted', 'conditional', 'restricted', 'prohibited']), allowed_public_content_classes: StringArray, restrictions: StringArray }).strict()
const RightsDispositionSchema = z.object({
  id: z.string(), rights_ref: z.string(), source_ref: z.string(), content_class: z.literal(HANDOFF_CONTENT_CLASS), decision: z.literal('authorized'),
  license: z.string().min(1), license_url: z.string().url().nullable(), attribution: z.string().min(1), redistribution: z.literal('conditional'),
  conditions: StringArray, evidence: z.array(z.object({ artifact_id: z.string().min(1), sha256: z.string().regex(SHA256) }).strict()).min(1), reviewer_identity: z.string().min(1), reviewed_at: z.string().datetime({ offset: true }), immutable: z.literal(true)
}).strict()
const SourceSchema = z.object({ id: z.string(), name: z.string(), locator: z.string().url(), version: z.string(), retrieved_at: z.string().datetime({ offset: true }).nullable(), rights_refs: StringArray }).strict()
const EvidenceSchema = z.object({ id: z.string(), source_ref: z.string(), locator: z.string(), evidence_kind: z.enum(['article', 'dataset', 'source-annotation', 'measurement', 'text-mention', 'curation']), excerpt: z.string().nullable(), provenance_refs: StringArray, rights_refs: StringArray, source_release_id: z.string().nullable().optional(), source_record_id: z.string().nullable().optional(), citation: z.string().nullable().optional(), taxon_id: z.string().nullable().optional() }).strict()
const ProvenanceSchema = z.object({ id: z.string(), activity: z.string(), agent: z.string(), method: z.string(), generated_at: z.string().datetime({ offset: true }), source_refs: StringArray, parent_refs: StringArray }).strict()
const LimitationSchema = z.object({ id: z.string(), category: z.string(), statement: z.string().min(1), applies_to_ids: StringArray, source_release_id: z.string().nullable().optional() }).strict()

export class EntityMentionHandoffVerificationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'EntityMentionHandoffVerificationError'
    this.code = 'ENTITY_MENTION_HANDOFF_VERIFICATION_FAILED'
  }
}

const fail = (message) => { throw new EntityMentionHandoffVerificationError(message) }
export const entityMentionSha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

function safePath(path) {
  if (typeof path !== 'string' || !SAFE_PATH.test(path) || path.includes('..')) fail(`Unsafe bundle path: ${path}.`)
  return path
}

async function readBounded(path, maximumBytes, label) {
  let handle
  try { handle = await openRegularNoFollow(path, constants.O_RDONLY) } catch (error) { throw new EntityMentionHandoffVerificationError(`${label} is missing or unsafe.`, { cause: error }) }
  try {
    const stat = await handle.stat()
    if (stat.size < 1 || stat.size > maximumBytes) fail(`${label} exceeds its byte limit.`)
    const bytes = await handle.readFile()
    if (bytes.length !== stat.size) fail(`${label} changed while it was read.`)
    return bytes
  } finally { await handle.close() }
}

function parseCanonical(bytes, schema, label, { trailingNewline = false, digest } = {}) {
  if (digest && entityMentionSha256(bytes) !== digest) fail(`${label} SHA-256 does not match its independent pin.`)
  let text
  let value
  try { text = utf8.decode(bytes); value = parseBoundedJson(text, undefined, label) } catch (error) { fail(`${label} is not strict, bounded UTF-8 JSON: ${error.message}.`) }
  let canonical
  try { canonical = canonicalJson(value) } catch { fail(`${label} cannot be canonical JSON.`) }
  if (text !== `${canonical}${trailingNewline ? '\n' : ''}`) fail(`${label} is not in its required canonical byte encoding.`)
  const parsed = schema.safeParse(value)
  if (!parsed.success) fail(`${label} does not match the independent strict contract.`)
  return parsed.data
}

function verifyHandoffIdentity(handoff) {
  const content = structuredClone(handoff)
  delete content.id
  delete content.digestAlgorithm
  delete content.desktop
  const expected = `sha256:${entityMentionSha256(Buffer.from(canonicalJson(content)))}`
  if (handoff.id !== expected) fail('Handoff content-addressed identity is invalid.')
  const candidate = structuredClone(handoff.candidates[0])
  const candidateDigest = candidate.candidate_sha256
  delete candidate.candidate_sha256
  if (candidateDigest !== entityMentionSha256(Buffer.from(canonicalJson(candidate)))) fail('Handoff candidate identity is invalid.')
}

function verifyLocalSignature(bytes, manifestBytes, manifest, pins) {
  const signature = parseCanonical(bytes, ProducerLocalSignatureSchema, 'Local signature')
  if (signature.release_id !== manifest.release.id || signature.manifest.bytes !== manifestBytes.length || signature.manifest.sha256 !== entityMentionSha256(manifestBytes)) fail('Local signature is not bound to the verified release manifest.')
  const keyDigest = entityMentionSha256(Buffer.from(canonicalJson(signature.signer.public_jwk)))
  if (signature.signer.key_id !== `sha256:${keyDigest}`) fail('Local signature public-key identity is invalid.')
  let signatureBytes
  try { signatureBytes = Buffer.from(signature.signature, 'base64') } catch { fail('Local signature encoding is invalid.') }
  if (signatureBytes.length !== 64 || signatureBytes.toString('base64') !== signature.signature) fail('Local signature encoding is noncanonical.')
  let valid = false
  try { valid = verifySignature(null, manifestBytes, createPublicKey({ key: signature.signer.public_jwk, format: 'jwk' }), signatureBytes) } catch { valid = false }
  if (!valid) fail('Local Ed25519 signature verification failed.')
  if (pins.officialKeyId && signature.signer.key_id === pins.officialKeyId) fail('A workspace-local signature cannot claim official producer authority.')
  return signature
}

function verifyPagesSignatureEnvelope(bytes, manifestBytes, manifest, pins) {
  const envelope = parseCanonical(bytes, ProducerPagesSignatureEnvelopeSchema, 'Official Pages signature envelope')
  if (!pins.officialKeyId || !pins.officialPublicJwk) fail('Unsupported official trust: no independent official Pages key and key ID are pinned.')
  if (envelope.manifest.bytes !== manifestBytes.length || envelope.manifest.sha256 !== entityMentionSha256(manifestBytes)) fail('Official Pages signature envelope is not bound to the exact verified manifest transport bytes.')
  const pinnedKeyId = `sha256:${entityMentionSha256(Buffer.from(canonicalJson(pins.officialPublicJwk)))}`
  if (pins.officialKeyId !== pinnedKeyId || envelope.signer.key_id !== pinnedKeyId || canonicalJson(envelope.signer.public_jwk) !== canonicalJson(pins.officialPublicJwk)) fail('Official Pages signer does not match the independent key pin.')
  let signatureBytes
  try { signatureBytes = Buffer.from(envelope.signature, 'base64') } catch { fail('Official Pages signature encoding is invalid.') }
  if (signatureBytes.length !== 64 || signatureBytes.toString('base64') !== envelope.signature) fail('Official Pages signature encoding is noncanonical.')
  let valid = false
  try { valid = verifySignature(null, manifestBytes, createPublicKey({ key: pins.officialPublicJwk, format: 'jwk' }), signatureBytes) } catch { valid = false }
  if (!valid) fail('Official Pages Ed25519 signature verification failed.')
  return envelope
}

function exactSet(values, expected, label) {
  const actual = [...new Set(values)].sort()
  const wanted = [...new Set(expected)].sort()
  if (canonicalJson(actual) !== canonicalJson(wanted)) fail(`${label} closure is incomplete or excessive.`)
}

export function verifyEntityMentionSemanticClosure(documents, handoff) {
  const entities = DocumentSchema.parse(documents.get('entity-records/entities.json')).records
  const candidate = CandidateEntitySchema.safeParse(entities.find((record) => record?.id === CANDIDATE_ID))
  const reaction = ReactionEntitySchema.safeParse(entities.find((record) => record?.id === REACTION_ID))
  if (!candidate.success || !reaction.success) fail('The exact candidate and reaction identities are required.')

  const payload = candidate.data.attributes.source_payload
  const digestInput = structuredClone(payload)
  delete digestInput.content_digest
  if (payload.content_digest !== entityMentionSha256(Buffer.from(canonicalJson(digestInput)))) fail('Source candidate content identity is invalid.')
  exactSet(payload.participants.map((item) => item.chemical_id), ['CHEBI:15378', 'CHEBI:15636', 'CHEBI:18608', 'CHEBI:57783', 'CHEBI:58349'], 'Supported MTHFR participant identity')
  exactSet(payload.participants.map((item) => item.chemical_id), reaction.data.attributes.source_payload.participants.map((item) => item.compound_id), 'Candidate/reaction participant identity')
  for (const item of payload.participants) {
    const source = reaction.data.attributes.source_payload.participants.find((participant) => participant.compound_id === item.chemical_id)
    if (!source || source.coefficient !== Number(item.coefficient) || source.side !== item.role || item.compartment_id !== payload.compartment_id) fail('Candidate/reaction stoichiometry or compartment identity differs.')
  }
  if (canonicalJson(handoff.candidates[0].participants) !== canonicalJson(payload.participants) || handoff.candidates[0].source_artifact_sha256 !== entityMentionSha256(Buffer.from(canonicalJson(DocumentSchema.parse(documents.get('entity-records/entities.json')))))) fail('Handoff candidate does not preserve the exact source candidate payload and artifact identity.')

  const edges = DocumentSchema.parse(documents.get('entity-records/edges.json')).records.filter((record) => record?.subject_id === REACTION_ID || record?.object_id === REACTION_ID)
  const parsedEdges = edges.map((record) => RelevantEdgeSchema.safeParse(record))
  if (parsedEdges.length !== 4 || parsedEdges.some((result) => !result.success)) fail('Reviewed contextual reaction edge closure is invalid.')
  const human = parsedEdges.map((result) => result.data).filter((edge) => edge.context.taxon_id === 'NCBITaxon:9606')
  if (human.length !== 2 || human.some((edge) => edge.origin !== 'inferred' || edge.context.compartment_id !== payload.compartment_id || edge.context.tissue_id !== payload.tissue_id)) fail('Human reaction context is not the exact inferred liver/cytosol selection.')
  const humanCatalysis = human.find((edge) => edge.predicate === 'catalyzes')
  const humanCatalyst = entities.find((record) => record?.id === humanCatalysis?.subject_id)
  const componentIds = humanCatalyst?.attributes?.component_ids
  if (humanCatalyst?.entity_type !== 'complex' || humanCatalyst.taxon_id !== candidate.data.taxon_id || !Array.isArray(componentIds) || componentIds.length !== 1) fail('Human catalyst complex closure is invalid.')
  const humanProtein = entities.find((record) => record?.id === componentIds[0])
  if (humanProtein?.entity_type !== 'protein' || humanProtein.taxon_id !== candidate.data.taxon_id || humanProtein.attributes?.source_payload?.reviewed !== true) fail('Human catalyst protein closure is invalid.')

  const rights = new Map(DocumentSchema.parse(documents.get('entity-records/rights.json')).records.map((record) => { const parsed = RightsSchema.parse(record); return [parsed.id, parsed] }))
  const dispositions = DocumentSchema.parse(documents.get('entity-records/rights_dispositions.json')).records.map((record) => RightsDispositionSchema.parse(record))
  const sources = new Map(DocumentSchema.parse(documents.get('entity-records/sources.json')).records.map((record) => { const parsed = SourceSchema.parse(record); return [parsed.id, parsed] }))
  const evidence = new Map(DocumentSchema.parse(documents.get('entity-records/evidence.json')).records.map((record) => { const parsed = EvidenceSchema.parse(record); return [parsed.id, parsed] }))
  const provenance = new Map(DocumentSchema.parse(documents.get('entity-records/provenance.json')).records.map((record) => { const parsed = ProvenanceSchema.parse(record); return [parsed.id, parsed] }))
  const selected = [candidate.data, reaction.data, ...parsedEdges.map((result) => result.data)]
  const sourceRefs = new Set(selected.flatMap((record) => record.source_refs ?? []))
  const rightsRefs = new Set(selected.flatMap((record) => record.rights_refs ?? []))
  const provenanceRefs = new Set(selected.flatMap((record) => record.provenance_refs ?? []))
  const evidenceRefs = new Set(selected.flatMap((record) => record.evidence_refs ?? []))
  for (const id of evidenceRefs) {
    const record = evidence.get(id)
    if (!record) fail(`Missing selected evidence record ${id}.`)
    sourceRefs.add(record.source_ref); record.rights_refs.forEach((ref) => rightsRefs.add(ref)); record.provenance_refs.forEach((ref) => provenanceRefs.add(ref))
  }
  const provenanceQueue = [...provenanceRefs]
  for (let index = 0; index < provenanceQueue.length; index += 1) {
    const id = provenanceQueue[index]
    const record = provenance.get(id)
    if (!record) fail(`Missing selected provenance record ${id}.`)
    record.source_refs.forEach((ref) => sourceRefs.add(ref))
    for (const parent of record.parent_refs) if (!provenanceRefs.has(parent)) { provenanceRefs.add(parent); provenanceQueue.push(parent) }
  }
  for (const id of sourceRefs) {
    const source = sources.get(id)
    if (!source) fail(`Missing selected source record ${id}.`)
    source.rights_refs.forEach((ref) => rightsRefs.add(ref))
  }
  for (const id of rightsRefs) {
    const record = rights.get(id)
    if (!record) fail(`Missing selected rights record ${id}.`)
    if (['restricted', 'prohibited'].includes(record.redistribution)) fail(`Selected biological payload is not redistributable: ${id}.`)
    if (record.allowed_public_content_classes.includes(HANDOFF_CONTENT_CLASS)) continue
    if (record.redistribution !== 'conditional') fail(`External legal blocker: rights ${id} do not explicitly authorize public ${HANDOFF_CONTENT_CLASS}.`)
    const matching = dispositions.filter((item) => item.rights_ref === id && item.content_class === HANDOFF_CONTENT_CLASS)
    if (matching.length !== 1) fail(`External legal blocker: conditional rights ${id} do not contain exactly one reviewed immutable disposition for ${HANDOFF_CONTENT_CLASS}.`)
    const disposition = matching[0]
    const source = sources.get(disposition.source_ref)
    if (!source || !source.rights_refs.includes(id) || disposition.license !== record.license || disposition.license_url !== record.license_url || disposition.attribution !== record.attribution || canonicalJson(disposition.conditions) !== canonicalJson(record.restrictions)) fail(`External legal blocker: conditional rights ${id} disposition closure is invalid.`)
  }

  const limitations = DocumentSchema.parse(documents.get('entity-records/limitations.json')).records.map((record) => LimitationSchema.parse(record))
  exactSet(limitations.filter((record) => record.applies_to_ids.some((id) => [CANDIDATE_ID, REACTION_ID].includes(id))).map((record) => record.id), REQUIRED_LIMITATION_IDS, 'Selected limitation')
  if (candidate.data.limitation_refs.some((id) => !limitations.find((record) => record.id === id))) fail('Candidate limitation references are unresolved.')

  const coverage = DocumentSchema.parse(documents.get('entity-records/simulation_coverage.json')).records
  if (coverage.length !== 1 || canonicalJson(coverage[0]?.expected_candidate_ids) !== canonicalJson([CANDIDATE_ID]) || canonicalJson(coverage[0]?.simulation_ready_ids) !== canonicalJson([CANDIDATE_ID]) || coverage[0]?.broad_reaction_coverage_status !== 'not-started') fail('Simulation coverage does not select exactly the bootstrap candidate.')
  const broad = DocumentSchema.parse(documents.get('entity-records/broad_discovery.json')).records
  if (broad.length !== 3 || broad.some((record) => record.trust_boundary?.simulation_eligible !== false || record.trust_boundary?.trusted_knowledge_eligible !== false || record.trust_boundary?.can_support_biological_conclusion !== false || record.trust_boundary?.automatic_promotion !== false)) fail('Broad-discovery reports crossed the simulation trust boundary.')
  if (broad.filter((record) => record.mthfr_disposition).some((record) => !String(record.mthfr_disposition.disposition).startsWith('excluded-'))) fail('A broad-discovery MTHFR candidate was made eligible.')

  const mentions = DocumentSchema.parse(documents.get('entity-records/mentions.json')).records
  const resolutions = DocumentSchema.parse(documents.get('entity-records/mention_resolutions.json')).records
  const assertions = DocumentSchema.parse(documents.get('entity-records/text_assertions.json')).records
  if (mentions.some((record) => record.review_status !== 'unreviewed' || record.can_support_biological_conclusion !== false || record.automatic_promotion !== false)) fail('Article mentions crossed their non-conclusion boundary.')
  if (resolutions.some((record) => record.status === 'resolved' || record.selected_entity_id !== null || record.review_status !== 'unreviewed' || record.can_support_biological_conclusion !== false)) fail('Unreviewed article mentions were resolved into producer facts.')
  if (assertions.some((record) => record.review_status !== 'unreviewed' || record.trusted_knowledge_eligible !== false || record.can_support_biological_conclusion !== false || record.automatic_promotion !== false || !['source-annotation', 'co-mentioned', 'model-generated', 'rule-based', 'deterministic-link'].includes(record.extraction_origin))) fail('Machine assertions crossed their untrusted boundary.')
  if (handoff.evidence.trusted.length || handoff.evidence.unreviewed.some((id) => assertions.some((record) => record.id === id))) fail('Mention or machine assertion was used as trusted simulation evidence.')
  if (DocumentSchema.parse(documents.get('entity-records/model_provenance.json')).records.length !== 0) fail('Model-derived article assertions are not supported by this vertical slice.')

  const lineage = DocumentSchema.parse(documents.get('entity-records/source_lineage.json')).records
  exactSet(lineage.map((record) => record.id), candidate.data.source_lineage_refs, 'Candidate source lineage')
  for (const record of lineage) {
    if (record.source_release_id !== candidate.data.source_release_id || !SHA256.test(record.release_digest) || !record.release_id || !Array.isArray(record.record_ids) || !record.record_ids.length || !record.statement) fail(`Source lineage is incomplete: ${record.id}.`)
  }
  const atlasLineage = lineage.find((record) => record.id === 'LINEAGE:ATLAS_MTHFR_V2')
  if (atlasLineage.release_id !== reaction.data.source_release_id || atlasLineage.release_digest !== '79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f' || !atlasLineage.record_ids.includes(REACTION_ID)) fail('Reaction identity is not closed by the exact contextual source lineage.')

  const closureRecords = DocumentSchema.parse(documents.get('entity-records/input_closures.json')).records
  for (const expected of [
    ['nutrient-reaction-simulation-bootstrap-v0.1.0', '2f3afbed57ad6de9d4afff20c766eb08ed766e7e6593724f40240da147e86b69'],
    ['contextual-mthfr-human-mouse-v2.0.0', '79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f'],
    ['nutrient-reaction-atlas-foundation-v0.1.0', 'ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4']
  ]) if (!closureRecords.find((record) => record.input_id === expected[0] && record.declared_digest === expected[1])) fail(`Missing pinned source closure ${expected[0]}.`)

  return { candidate: candidate.data, reaction: reaction.data, humanCatalyst, humanProtein, edges: parsedEdges.map((result) => result.data), limitations: limitations.filter((record) => REQUIRED_LIMITATION_IDS.includes(record.id)), sources: [...sourceRefs], rights: [...rightsRefs], provenance: [...provenanceRefs], evidence: [...evidenceRefs] }
}

export async function verifyEntityMentionHandoffBundle({ releaseRoot, handoffPath, signaturePath = null, pins = ENTITY_MENTION_HANDOFF_PINS, limits = ENTITY_MENTION_IMPORT_LIMITS, hooks = {} }) {
  let releaseDirectory
  try { releaseDirectory = await openPinnedDirectory(releaseRoot) } catch (error) { throw new EntityMentionHandoffVerificationError('Release root is missing or unsafe.', { cause: error }) }
  try {
  let paths
  try { paths = await releaseDirectory.listTree({ maximumEntries: limits.files + 1, maximumDepth: limits.depth }) }
  catch (error) {
    if (error.message.includes('entry count')) fail('Release tree exceeds its file-count limit.')
    if (error.message.includes('directory depth')) fail('Release tree exceeds its depth limit.')
    throw error
  }
  await hooks.afterInventory?.()
  const manifestBytes = await releaseDirectory.readFile('manifest.json', limits.manifestBytes)
  if (manifestBytes.length !== pins.servingManifestBytes) fail('Serving manifest byte count does not match its independent pin.')
  const manifest = parseCanonical(manifestBytes, EntityMentionServingManifestSchema, 'Serving manifest', { trailingNewline: true, digest: pins.servingManifestSha256 })
  if (manifest.release.id !== pins.servingReleaseId || manifest.schema_version !== pins.servingSchemaVersion || manifest.files.length !== pins.outputFiles || manifest.counts.output_files !== pins.outputFiles || manifest.counts.entity_mention_static_files !== pins.entityStaticFiles) fail('Serving release identity, schema, or count pins do not match.')
  const descriptorByPath = new Map()
  for (const descriptor of manifest.files) {
    safePath(descriptor.filename)
    if (descriptorByPath.has(descriptor.filename)) fail(`Duplicate serving descriptor: ${descriptor.filename}.`)
    descriptorByPath.set(descriptor.filename, descriptor)
  }
  const hasPagesEnvelope = paths.includes('envelope.json')
  const expectedPaths = ['manifest.json', ...(hasPagesEnvelope ? ['envelope.json'] : []), ...descriptorByPath.keys()].sort()
  if (canonicalJson(paths) !== canonicalJson(expectedPaths)) fail('Release directory inventory does not exactly match the closed serving manifest.')

  const files = new Map([['manifest.json', manifestBytes]])
  let pagesEnvelope = null
  if (hasPagesEnvelope) {
    const pagesEnvelopeBytes = await releaseDirectory.readFile('envelope.json', limits.signatureBytes)
    pagesEnvelope = verifyPagesSignatureEnvelope(pagesEnvelopeBytes, manifestBytes, manifest, pins)
    files.set('envelope.json', pagesEnvelopeBytes)
  }
  const documents = new Map()
  const parsedFiles = new Map()
  const contents = new Map()
  let totalTransport = manifestBytes.length
  let totalContent = 0
  for (const [path, descriptor] of descriptorByPath) {
    const bytes = await releaseDirectory.readFile(path, Math.min(descriptor.bytes, limits.fileBytes))
    if (bytes.length !== descriptor.bytes || entityMentionSha256(bytes) !== descriptor.sha256) fail(`${path} transport closure mismatch.`)
    totalTransport += bytes.length
    if (totalTransport > limits.totalTransportBytes) fail('Release transport closure exceeds its aggregate byte limit.')
    let content
    try { content = descriptor.media_type === 'application/gzip' ? gunzipSync(bytes, { maxOutputLength: Math.min(descriptor.content_bytes, limits.contentBytes) }) : bytes } catch { fail(`${path} compressed content is invalid or oversized.`) }
    if (content.length !== descriptor.content_bytes || entityMentionSha256(content) !== descriptor.content_sha256) fail(`${path} content closure mismatch.`)
    contents.set(path, content)
    totalContent += content.length
    if (totalContent > limits.totalContentBytes) fail('Release content closure exceeds its aggregate byte limit.')
    if (descriptor.media_type !== 'application/n-quads') {
      const trailingNewline = PAGES_DATA_PATH.test(path)
      const schema = path.startsWith('entity-records/') ? DocumentSchema : z.unknown()
      const value = parseCanonical(Buffer.from(content), schema, path, { trailingNewline })
      parsedFiles.set(path, value)
      if (path.startsWith('entity-records/')) {
        if (descriptor.record_count !== value.records.length) fail(`${path} record count does not match its serving descriptor.`)
        documents.set(path, value)
      }
    }
    files.set(path, bytes)
  }
  for (const [path, digest] of Object.entries(pins.requiredFiles)) {
    const descriptor = descriptorByPath.get(path)
    if (!descriptor || descriptor.sha256 !== digest || entityMentionSha256(files.get(path)) !== digest) fail(`Required static file pin mismatch: ${path}.`)
  }

  const entityEnvelope = parseCanonical(files.get('entity-release.json'), z.object({
    release_id: z.string(), schema_version: z.literal('1.0.0'), release_digest: z.string().regex(SHA256), digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
    title: z.string(), description: z.string(), published_at: z.string(), immutable: z.literal(true), context_ref: z.string(),
    files: z.array(z.object({ path: z.string(), record_type: z.string(), sha256: z.string().regex(SHA256), bytes: z.number().int().positive(), record_count: z.number().int().nonnegative() }).strict())
  }).strict(), 'Entity release envelope', { digest: pins.entityReleaseSha256 })
  const digestInput = structuredClone(entityEnvelope); delete digestInput.release_digest
  if (entityEnvelope.release_id !== pins.entityReleaseId || entityEnvelope.release_digest !== pins.entityReleaseDigest || entityEnvelope.files.length !== pins.entityEnvelopeFiles || entityEnvelope.release_digest !== entityMentionSha256(Buffer.from(canonicalJson(digestInput)))) fail('Entity release identity or canonical digest is invalid.')
  const entityStatic = parseCanonical(files.get('entity-static-manifest.json'), z.object({
    schema_version: z.literal('1.0.0'), artifact_kind: z.literal('entity-mention-atlas-static-tree'), release_id: z.string(), release_digest: z.string(), digest_algorithm: z.string(), digest_description: z.string(), shard_algorithm: z.string(),
    counts: z.object({ entities: z.number(), edges: z.number(), articles: z.number(), mentions: z.number(), assertions: z.number(), fixed_shards_per_family: z.number(), fixed_shard_families: z.number(), files: z.number() }).strict(),
    files: z.array(StaticFileDescriptorSchema)
  }).strict(), 'Entity static manifest', { digest: pins.entityStaticManifestSha256 })
  if (entityStatic.release_id !== entityEnvelope.release_id || entityStatic.release_digest !== entityEnvelope.release_digest || entityStatic.files.length + 1 !== pins.entityStaticFiles || entityStatic.counts.files !== entityStatic.files.length || manifest.counts.entity_mention_static_files !== entityStatic.files.length + 1) fail('Entity static manifest tree binding is invalid.')
  if (descriptorByPath.get('entity-static-manifest.json')?.record_count !== entityStatic.files.length) fail('Entity static manifest serving record count is invalid.')
  const staticPaths = new Set()
  for (const descriptor of entityStatic.files) {
    if (staticPaths.has(descriptor.filename)) fail(`Duplicate entity static descriptor: ${descriptor.filename}.`)
    staticPaths.add(descriptor.filename)
    const serving = descriptorByPath.get(descriptor.filename)
    if (!serving || canonicalJson(serving) !== canonicalJson(descriptor)) fail(`Entity static descriptor disagrees with serving closure: ${descriptor.filename}.`)
  }
  const envelopePaths = new Set()
  for (const descriptor of entityEnvelope.files) {
    if (envelopePaths.has(descriptor.path)) fail(`Duplicate entity release descriptor: ${descriptor.path}.`)
    envelopePaths.add(descriptor.path)
    const serving = descriptorByPath.get(descriptor.path)
    const document = documents.get(descriptor.path)
    if (!serving || !document || serving.bytes !== descriptor.bytes || serving.sha256 !== descriptor.sha256 || serving.record_count !== descriptor.record_count || document.records.length !== descriptor.record_count) fail(`Entity release descriptor disagrees with its record closure: ${descriptor.path}.`)
    const expectedType = descriptor.path.slice('entity-records/'.length, -'.json'.length)
    if (descriptor.record_type !== expectedType) fail(`Entity release record family is invalid: ${descriptor.path}.`)
  }
  exactSet(entityEnvelope.files.map((descriptor) => descriptor.record_type), ENTITY_RECORD_FAMILIES, 'Entity release record family')
  const familyCounts = {
    articles:   documents.get('entity-records/articles.json')?.records.length,
    assertions: documents.get('entity-records/text_assertions.json')?.records.length,
    edges:      documents.get('entity-records/edges.json')?.records.length,
    entities:   documents.get('entity-records/entities.json')?.records.length,
    mentions:   documents.get('entity-records/mentions.json')?.records.length
  }
  for (const [family, count] of Object.entries(familyCounts)) {
    if (entityStatic.counts[family] !== count || manifest.counts[`entity_mention_${family}`] !== count) fail(`Entity ${family} count closure is invalid.`)
  }
  const shardFamilies = new Map()
  for (const descriptor of entityStatic.files) {
    const match = descriptor.filename.match(/^(.+)-([a-f0-9]{2})\.json\.gz$/)
    if (match) shardFamilies.set(match[1], (shardFamilies.get(match[1]) ?? 0) + 1)
  }
  if (shardFamilies.size !== entityStatic.counts.fixed_shard_families || [...shardFamilies.values()].some((count) => count !== entityStatic.counts.fixed_shards_per_family)) fail('Entity fixed-shard family count closure is invalid.')
  verifyEntityMentionStaticCounts({ staticManifest: entityStatic, entityEnvelope, parsed: parsedFiles, contents })

  const handoffBytes = await readBounded(handoffPath, limits.handoffBytes, 'Simulation handoff')
  const handoff = parseCanonical(handoffBytes, EntityMentionSimulationHandoffSchema, 'Simulation handoff')
  verifyHandoffIdentity(handoff)
  if (handoff.release.id !== manifest.release.id || handoff.release.manifest_sha256 !== pins.servingManifestSha256) fail('Handoff release binding is invalid.')
  for (const field of ['foundation_id', 'foundation_digest', 'chebi_release', 'rhea_release', 'reactome_release']) if (handoff.release[field] !== manifest.release[field]) fail(`Handoff release field mismatch: ${field}.`)
  const semantic = verifyEntityMentionSemanticClosure(documents, handoff)

  let signature = null
  let signatureBytes = null
  let trust = 'workspace-local-unsigned'
  if (signaturePath) {
    if (pagesEnvelope) fail('Official Pages and workspace-local signature envelopes cannot be combined in one import.')
    signatureBytes = await readBounded(signaturePath, limits.signatureBytes, 'Local signature')
    signature = verifyLocalSignature(signatureBytes, manifestBytes, manifest, pins)
    trust = 'workspace-local-signed'
  }
  if (handoff.desktop?.official === true || signature?.official === true) fail('Official trust cannot be claimed by a handoff or workspace-local signature.')
  if (pagesEnvelope) trust = 'official-pages-signed'
  const closure = verifyStoredEntityMentionClosure(files, handoffBytes, signatureBytes, pins, limits)
  await releaseDirectory.assertPathIdentity()
  return { trust, manifestBytes, handoffBytes, signatureBytes, files, ...closure }
  } catch (error) {
    if (error instanceof EntityMentionHandoffVerificationError) throw error
    throw new EntityMentionHandoffVerificationError(`Release verification failed: ${error.message}`, { cause: error })
  } finally { await releaseDirectory.close() }
}

export function verifyStoredEntityMentionClosure(files, handoffBytes, signatureBytes = null, pins = ENTITY_MENTION_HANDOFF_PINS, limits = ENTITY_MENTION_IMPORT_LIMITS) {
  const manifestBytes = files.get('manifest.json')
  const manifest = parseCanonical(manifestBytes, EntityMentionServingManifestSchema, 'Stored serving manifest', { trailingNewline: true, digest: pins.servingManifestSha256 })
  if (manifestBytes.length !== pins.servingManifestBytes || manifest.release.id !== pins.servingReleaseId || manifest.schema_version !== pins.servingSchemaVersion || manifest.files.length !== pins.outputFiles || manifest.counts.output_files !== pins.outputFiles || manifest.counts.entity_mention_static_files !== pins.entityStaticFiles) fail('Stored serving release identity, schema, or count pins do not match.')
  const descriptorByPath = new Map(manifest.files.map((descriptor) => [descriptor.filename, descriptor]))
  const pagesEnvelopeBytes = files.get('envelope.json') ?? null
  if (descriptorByPath.size !== manifest.files.length || files.size !== manifest.files.length + 1 + Number(Boolean(pagesEnvelopeBytes))) fail('Stored release inventory is incomplete or excessive.')
  const pagesEnvelope = pagesEnvelopeBytes ? verifyPagesSignatureEnvelope(pagesEnvelopeBytes, manifestBytes, manifest, pins) : null
  const documents = new Map()
  const parsedFiles = new Map()
  const contents = new Map()
  let totalTransport = manifestBytes.length
  let totalContent = 0
  for (const [path, descriptor] of descriptorByPath) {
    const bytes = files.get(path)
    if (!bytes || bytes.length !== descriptor.bytes || entityMentionSha256(bytes) !== descriptor.sha256) fail(`Stored object closure mismatch: ${path}.`)
    if (bytes.length > limits.fileBytes) fail(`Stored ${path} exceeds its byte limit.`)
    totalTransport += bytes.length
    if (totalTransport > limits.totalTransportBytes) fail('Stored release transport closure exceeds its aggregate byte limit.')
    let content
    try { content = descriptor.media_type === 'application/gzip' ? gunzipSync(bytes, { maxOutputLength: Math.min(descriptor.content_bytes, limits.contentBytes) }) : bytes } catch { fail(`Stored ${path} compressed content is invalid or oversized.`) }
    if (content.length !== descriptor.content_bytes || entityMentionSha256(content) !== descriptor.content_sha256) fail(`Stored ${path} content closure mismatch.`)
    contents.set(path, content)
    totalContent += content.length
    if (totalContent > limits.totalContentBytes) fail('Stored release content closure exceeds its aggregate byte limit.')
    if (descriptor.media_type !== 'application/n-quads') {
      const value = parseCanonical(Buffer.from(content), path.startsWith('entity-records/') ? DocumentSchema : z.unknown(), `Stored ${path}`, { trailingNewline: PAGES_DATA_PATH.test(path) })
      parsedFiles.set(path, value)
      if (path.startsWith('entity-records/')) {
        if (value.records.length !== descriptor.record_count) fail(`Stored ${path} record count does not match its serving descriptor.`)
        documents.set(path, value)
      }
    }
  }
  for (const [path, digest] of Object.entries(pins.requiredFiles)) if (entityMentionSha256(files.get(path) ?? Buffer.alloc(0)) !== digest) fail(`Stored required file pin mismatch: ${path}.`)

  const entityEnvelope = parseCanonical(files.get('entity-release.json'), z.object({
    release_id: z.string(), schema_version: z.literal('1.0.0'), release_digest: z.string().regex(SHA256), digest_algorithm: z.literal('sha256-canonical-manifest-v1'),
    title: z.string(), description: z.string(), published_at: z.string(), immutable: z.literal(true), context_ref: z.string(),
    files: z.array(z.object({ path: z.string(), record_type: z.string(), sha256: z.string().regex(SHA256), bytes: z.number().int().positive(), record_count: z.number().int().nonnegative() }).strict())
  }).strict(), 'Stored entity release envelope', { digest: pins.entityReleaseSha256 })
  const digestInput = structuredClone(entityEnvelope); delete digestInput.release_digest
  if (entityEnvelope.release_id !== pins.entityReleaseId || entityEnvelope.release_digest !== pins.entityReleaseDigest || entityEnvelope.files.length !== pins.entityEnvelopeFiles || entityEnvelope.release_digest !== entityMentionSha256(Buffer.from(canonicalJson(digestInput)))) fail('Stored entity release identity or canonical digest is invalid.')
  for (const descriptor of entityEnvelope.files) {
    const serving = descriptorByPath.get(descriptor.path)
    const document = documents.get(descriptor.path)
    if (!serving || !document || serving.bytes !== descriptor.bytes || serving.sha256 !== descriptor.sha256 || serving.record_count !== descriptor.record_count || document.records.length !== descriptor.record_count || descriptor.record_type !== descriptor.path.slice('entity-records/'.length, -'.json'.length)) fail(`Stored entity release descriptor closure is invalid: ${descriptor.path}.`)
  }
  exactSet(entityEnvelope.files.map((descriptor) => descriptor.record_type), ENTITY_RECORD_FAMILIES, 'Stored entity release record family')

  const entityStatic = parseCanonical(files.get('entity-static-manifest.json'), z.object({
    schema_version: z.literal('1.0.0'), artifact_kind: z.literal('entity-mention-atlas-static-tree'), release_id: z.string(), release_digest: z.string(), digest_algorithm: z.string(), digest_description: z.string(), shard_algorithm: z.string(),
    counts: z.object({ entities: z.number(), edges: z.number(), articles: z.number(), mentions: z.number(), assertions: z.number(), fixed_shards_per_family: z.number(), fixed_shard_families: z.number(), files: z.number() }).strict(),
    files: z.array(StaticFileDescriptorSchema)
  }).strict(), 'Stored entity static manifest', { digest: pins.entityStaticManifestSha256 })
  if (entityStatic.release_id !== entityEnvelope.release_id || entityStatic.release_digest !== entityEnvelope.release_digest || entityStatic.files.length + 1 !== pins.entityStaticFiles || entityStatic.counts.files !== entityStatic.files.length || manifest.counts.entity_mention_static_files !== entityStatic.files.length + 1) fail('Stored entity static manifest tree binding is invalid.')
  if (descriptorByPath.get('entity-static-manifest.json')?.record_count !== entityStatic.files.length) fail('Stored entity static manifest serving record count is invalid.')
  const staticPaths = new Set()
  for (const descriptor of entityStatic.files) {
    if (staticPaths.has(descriptor.filename) || canonicalJson(descriptorByPath.get(descriptor.filename)) !== canonicalJson(descriptor)) fail(`Stored entity static descriptor closure is invalid: ${descriptor.filename}.`)
    staticPaths.add(descriptor.filename)
  }
  const familyCounts = {
    articles:   documents.get('entity-records/articles.json')?.records.length,
    assertions: documents.get('entity-records/text_assertions.json')?.records.length,
    edges:      documents.get('entity-records/edges.json')?.records.length,
    entities:   documents.get('entity-records/entities.json')?.records.length,
    mentions:   documents.get('entity-records/mentions.json')?.records.length
  }
  for (const [family, count] of Object.entries(familyCounts)) if (entityStatic.counts[family] !== count || manifest.counts[`entity_mention_${family}`] !== count) fail(`Stored entity ${family} count closure is invalid.`)
  const shardFamilies = new Map()
  for (const descriptor of entityStatic.files) {
    const match = descriptor.filename.match(/^(.+)-([a-f0-9]{2})\.json\.gz$/)
    if (match) shardFamilies.set(match[1], (shardFamilies.get(match[1]) ?? 0) + 1)
  }
  if (shardFamilies.size !== entityStatic.counts.fixed_shard_families || [...shardFamilies.values()].some((count) => count !== entityStatic.counts.fixed_shards_per_family)) fail('Stored entity fixed-shard family count closure is invalid.')
  verifyEntityMentionStaticCounts({ staticManifest: entityStatic, entityEnvelope, parsed: parsedFiles, contents })

  const handoff = parseCanonical(handoffBytes, EntityMentionSimulationHandoffSchema, 'Stored simulation handoff')
  verifyHandoffIdentity(handoff)
  if (handoff.release.id !== manifest.release.id || handoff.release.manifest_sha256 !== pins.servingManifestSha256) fail('Stored handoff release binding is invalid.')
  for (const field of ['foundation_id', 'foundation_digest', 'chebi_release', 'rhea_release', 'reactome_release']) if (handoff.release[field] !== manifest.release[field]) fail(`Stored handoff release field mismatch: ${field}.`)
  const signature = signatureBytes ? verifyLocalSignature(signatureBytes, manifestBytes, manifest, pins) : null
  if (handoff.desktop?.official === true || signature?.official === true) fail('Official trust cannot be claimed by a handoff or workspace-local signature.')
  return { trust: pagesEnvelope ? 'official-pages-signed' : signature ? 'workspace-local-signed' : 'workspace-local-unsigned', manifest, entityEnvelope, entityStatic, handoff, signature, pagesEnvelope, semantic: verifyEntityMentionSemanticClosure(documents, handoff) }
}
