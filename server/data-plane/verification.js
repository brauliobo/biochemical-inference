import { canonicalJson } from '../../shared/canonical-json.js'
import { sha256Hex } from '../commons/digest.js'
import { defineProblemError } from '../commons/errors.js'
import { parseCanonicalBytes as parseCanonical, verifyEd25519Signature } from '../commons/verification.js'
import {
  DATA_PLANE_ACTIVE_KEY_ID,
  DATA_PLANE_ACTIVE_PUBLIC_KEY,
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_CATALOG_DIGEST,
  DATA_PLANE_DIFF_DIGEST,
  DATA_PLANE_DIFF_RESPONSE_DIGEST,
  DATA_PLANE_HISTORICAL_KEY_ID,
  DATA_PLANE_HISTORICAL_PUBLIC_KEY,
  DATA_PLANE_NLM_COURTESY,
  DATA_PLANE_RELEASE_PINS,
  DATA_PLANE_TRUST_DIGEST,
  FACTORY_RECORD_SCHEMAS,
  FactoryCatalogEnvelopeSchema,
  FactoryDiscoverySchema,
  FactoryManifestSchema,
  FactoryRecordPageSchema,
  FactoryReleaseEnvelopeSchema,
  FactorySemanticDiffSchema,
  FactoryTrustStoreSchema
} from '../../shared/data-plane-contracts.js'

export const MAX_METADATA_BYTES = 8 * 1024 * 1024
export const MAX_PARTITION_BYTES = 8 * 1024 * 1024
const MAX_RECORD_BYTES = 1024 * 1024
export const PRODUCER_PAGE_LIMIT = 2

const RECORD_TYPES = Object.freeze(Object.keys(FACTORY_RECORD_SCHEMAS))
const EXPECTED_SOURCE_ACCESSIONS = Object.freeze({
  'ncbi-taxonomy-human-mouse-esummary': ['NCBITaxon:9606', 'NCBITaxon:10090'],
  'chebi-15377-json': ['CHEBI:15377'],
  'chebi-15636-json': ['CHEBI:15636'],
  'chebi-33384-json': ['CHEBI:33384'],
  'chebi-57305-json': ['CHEBI:57305'],
  'chebi-57453-json': ['CHEBI:57453'],
  'rhea-15483-sparql-json': ['RHEA:15483'],
  'uniprot-shmt1-human-mouse-json': ['UniProtKB:P34896', 'UniProtKB:P50431'],
  'pubmed-24698160-esummary-json': ['PubMed:24698160'],
  'repository-catalysis-v2': ['CATALYSIS:P34896-15483', 'CATALYSIS:P50431-15483'],
  'repository-limitations-v2': ['LIMITATION:AUTHORITY-SNAPSHOT', 'LIMITATION:BOUNDED-SLICE', 'LIMITATION:MOUSE-INFERENCE', 'LIMITATION:NO-KINETICS']
})
const SOURCE_POLICY = Object.freeze({
  NCBI_TAXONOMY: { recordType: 'taxa', adapter: 'ncbi-taxonomy-esummary-json', sourceId: 'NCBI_TAXONOMY', origin: 'authority' },
  CHEBI: { recordType: 'compounds', adapter: 'chebi-authority-json-obo', sourceId: 'CHEBI', origin: 'authority' },
  RHEA: { recordType: 'reactions', adapter: 'rhea-tsv-json', sourceId: 'RHEA', origin: 'authority' },
  UNIPROTKB: { recordType: 'proteins', adapter: 'uniprot-rest-tsv-json', sourceId: 'UNIPROTKB', origin: 'authority' },
  PUBMED: { recordType: 'references', adapters: ['pubmed-esummary-json', 'pubmed-esummary-json-doi'], sourceId: 'PUBMED', origin: 'authority' },
  REPOSITORY: { recordTypes: ['catalysis', 'limitations'], adapter: 'repository-curation-json', origin: 'curation' }
})

export const DataPlaneVerificationError = defineProblemError('DataPlaneVerificationError', { statusCode: 409, code: 'DATA_PLANE_VERIFICATION_FAILED' })

export const sha256 = sha256Hex

export function parseCanonicalBytes(bytes, schema, label, expectedDigest) {
  return parseCanonical(bytes, schema, label, {
    ErrorClass: DataPlaneVerificationError,
    maxBytes: MAX_METADATA_BYTES,
    expectedDigest,
    contract: 'producer',
    messages: { bounds: 'exceeds its canonical metadata boundary.', pin: 'SHA-256 does not match its independent pin.' }
  })
}

function keyAtSigningTime(signature, trust) {
  const key = trust.keys.find((candidate) => candidate.key_id === signature.key_id)
  if (!key) throw new DataPlaneVerificationError(`Unknown signing key: ${signature.key_id}.`)
  if (key.status === 'revoked') throw new DataPlaneVerificationError(`Revoked signing key: ${signature.key_id}.`)
  if (key.status !== 'active' && key.status !== 'retired') throw new DataPlaneVerificationError(`Signing key is not trusted: ${signature.key_id}.`)
  const signedDate = signature.signed_at.slice(0, 10)
  if (signedDate < key.valid_from || (key.valid_until !== null && signedDate > key.valid_until)) throw new DataPlaneVerificationError(`Signing key ${signature.key_id} is outside its validity interval.`)
  return key
}

export function verifySignedObject(payload, signature, trust) {
  const key = keyAtSigningTime(signature, trust)
  verifyEd25519Signature({
    payload,
    signature,
    publicKey: key.public_key,
    ErrorClass: DataPlaneVerificationError,
    labels: { publicKey: `Public key ${key.key_id}`, signature: `Signature ${key.key_id}` },
    invalidMessage: `Invalid Ed25519 signature for key: ${key.key_id}.`,
    lengthMessage: 'has an invalid encoded length.'
  })
  return key
}

export function verifyTrust(bytes) {
  const trust = parseCanonicalBytes(bytes, FactoryTrustStoreSchema, 'Factory trust store', DATA_PLANE_TRUST_DIGEST)
  const active = trust.keys.find((key) => key.key_id === DATA_PLANE_ACTIVE_KEY_ID)
  const historical = trust.keys.find((key) => key.key_id === DATA_PLANE_HISTORICAL_KEY_ID)
  if (!active || active.status !== 'active' || active.algorithm !== 'Ed25519' || active.public_key !== DATA_PLANE_ACTIVE_PUBLIC_KEY) throw new DataPlaneVerificationError('Factory trust store does not contain the independently pinned active Ed25519 key.')
  if (!historical || historical.status !== 'retired' || historical.valid_until !== '2026-07-13' || historical.algorithm !== 'Ed25519' || historical.public_key !== DATA_PLANE_HISTORICAL_PUBLIC_KEY) throw new DataPlaneVerificationError('Factory trust store does not retain the independently pinned historical Ed25519 key and validity interval.')
  return trust
}

export function verifyDiscovery(bytes) {
  const discovery = parseCanonicalBytes(bytes, FactoryDiscoverySchema, 'Factory discovery')
  if (discovery.catalog_digest !== DATA_PLANE_CATALOG_DIGEST || discovery.release_count !== DATA_PLANE_RELEASE_PINS.length || !discovery.acknowledgments.includes(DATA_PLANE_NLM_COURTESY)) throw new DataPlaneVerificationError('Factory discovery does not identify the pinned catalog and acknowledgment closure.')
  return discovery
}

export function verifyCatalog(bytes, trust) {
  const catalog = parseCanonicalBytes(bytes, FactoryCatalogEnvelopeSchema, 'Factory catalog', DATA_PLANE_CATALOG_DIGEST)
  verifySignedObject(catalog.payload, catalog.signature, trust)
  if (catalog.signature.key_id !== DATA_PLANE_ACTIVE_KEY_ID) throw new DataPlaneVerificationError('Factory catalog signer does not match the independently pinned key ID.')
  if (catalog.payload.releases.length !== DATA_PLANE_RELEASE_PINS.length) throw new DataPlaneVerificationError('Pinned factory catalog must contain exactly the baseline and candidate releases.')
  if (catalog.payload.releases.some((entry, index) => {
    const pin = DATA_PLANE_RELEASE_PINS[index]
    return entry.release_id !== pin.releaseId || entry.release_digest !== pin.releaseDigest || entry.manifest_sha256 !== pin.manifestDigest || entry.envelope_sha256 !== pin.envelopeDigest || entry.envelope_path !== `${pin.releaseId}/envelope.json`
  })) throw new DataPlaneVerificationError('Factory catalog release identities do not match the independent baseline/candidate pins and order.')
  return { catalog, entries: new Map(catalog.payload.releases.map((entry) => [entry.release_id, entry])) }
}

export function verifyEnvelope(bytes, entry, trust) {
  const pin = DATA_PLANE_RELEASE_PINS.find((candidate) => candidate.releaseId === entry.release_id)
  if (!pin) throw new DataPlaneVerificationError(`Factory envelope is not independently pinned: ${entry.release_id}.`)
  const envelope = parseCanonicalBytes(bytes, FactoryReleaseEnvelopeSchema, 'Factory release envelope', entry.envelope_sha256)
  const key = verifySignedObject(envelope.payload, envelope.signature, trust)
  if (envelope.signature.key_id !== pin.signerKeyId) throw new DataPlaneVerificationError(`Factory release signer does not match the independent pin for ${entry.release_id}.`)
  if (envelope.payload.release_id !== pin.releaseId || envelope.payload.release_digest !== pin.releaseDigest || envelope.payload.schema_version !== entry.schema_version || envelope.payload.manifest_sha256 !== pin.manifestDigest) throw new DataPlaneVerificationError('Factory envelope does not bind the catalog release identity and manifest.')
  return { envelope, key }
}

function validateManifestInputs(manifest) {
  if (manifest.inputs.length !== Object.keys(EXPECTED_SOURCE_ACCESSIONS).length) throw new DataPlaneVerificationError('Manifest source input closure is incomplete.')
  const names = manifest.inputs.map((input) => input.name)
  if (new Set(names).size !== names.length || names.some((name) => !(name in EXPECTED_SOURCE_ACCESSIONS))) throw new DataPlaneVerificationError('Manifest source inputs are duplicated or unknown.')
  const adapterDefinitions = new Map()
  for (const input of manifest.inputs) {
    const policy = SOURCE_POLICY[input.source]
    const allowedType = policy && (policy.recordType === input.record_type || policy.recordTypes?.includes(input.record_type))
    const allowedAdapter = policy && (policy.adapter === input.adapter.id || policy.adapters?.includes(input.adapter.id))
    if (!policy || !allowedType || !allowedAdapter) throw new DataPlaneVerificationError(`Manifest source/adapter closure is invalid for ${input.name}.`)
    if (input.license.redistribution !== 'public') throw new DataPlaneVerificationError(`Manifest input ${input.name} is not licensed for public redistribution.`)
    const rendered = canonicalJson(input.adapter)
    if (adapterDefinitions.has(input.adapter.id) && adapterDefinitions.get(input.adapter.id) !== rendered) throw new DataPlaneVerificationError(`Adapter declaration ${input.adapter.id} is inconsistent across inputs.`)
    adapterDefinitions.set(input.adapter.id, rendered)
  }
  if (adapterDefinitions.size !== 6) throw new DataPlaneVerificationError('Manifest does not close every factory adapter declaration.')
  const pubmed = manifest.inputs.find((input) => input.source === 'PUBMED')
  if (!pubmed || pubmed.license.id !== 'NLM-CITATION-METADATA-TERMS' || !pubmed.license.attribution.includes(DATA_PLANE_NLM_COURTESY)) throw new DataPlaneVerificationError('Manifest does not retain the PubMed metadata terms and NLM courtesy.')
  const expectedPubmed = manifest.release_id === DATA_PLANE_BASELINE_RELEASE_ID
    ? { id: 'pubmed-esummary-json', version: '1.0.0', implementation: '7b447f550b74bec0cbec60987552a1f8fc7ed0612f980a6d09d5d2e38a3b611b', package: 'e613c3af6749a433d6a29774aa2168251429f87f73a25b5307887db44cf117dd' }
    : { id: 'pubmed-esummary-json-doi', version: '1.1.0', implementation: 'cf778a0b6948cc8ac3a30821f7693d5b4b171bfe47e6fc49129209f1f1a8c6ee', package: 'f4de69a53845271499427254cd8efd59bbd2673a2d53a061d0df6cb2e2b92163' }
  if (pubmed.adapter.id !== expectedPubmed.id || pubmed.adapter.version !== expectedPubmed.version || pubmed.adapter.implementation_sha256 !== expectedPubmed.implementation || pubmed.adapter.package_sha256 !== expectedPubmed.package) throw new DataPlaneVerificationError(`Manifest PubMed adapter is not independently pinned for ${manifest.release_id}.`)
}

export function verifyManifest(bytes, entry, envelope) {
  const pin = DATA_PLANE_RELEASE_PINS.find((candidate) => candidate.releaseId === entry.release_id)
  if (!pin) throw new DataPlaneVerificationError(`Factory manifest is not independently pinned: ${entry.release_id}.`)
  const manifest = parseCanonicalBytes(bytes, FactoryManifestSchema, 'Factory release manifest', entry.manifest_sha256)
  if (manifest.release_id !== pin.releaseId || manifest.release_digest !== pin.releaseDigest || manifest.schema_version !== entry.schema_version || envelope.payload.manifest_sha256 !== pin.manifestDigest || sha256(bytes) !== pin.manifestDigest) throw new DataPlaneVerificationError('Manifest release identity is not bound by the catalog and envelope.')
  const digestValue = { ...manifest }
  delete digestValue.release_digest
  if (sha256(Buffer.from(canonicalJson(digestValue))) !== pin.releaseDigest) throw new DataPlaneVerificationError('Canonical manifest release digest does not match its independent pin.')
  if (canonicalJson(manifest.record_counts) !== canonicalJson(entry.record_counts)) throw new DataPlaneVerificationError('Manifest counts do not match the signed catalog.')
  if (new Set(manifest.supported_taxa).size !== manifest.supported_taxa.length) throw new DataPlaneVerificationError('Manifest supported taxa must be unique.')
  validateManifestInputs(manifest)
  return manifest
}

export function parsePartition(bytes, entry) {
  if (!Buffer.isBuffer(bytes) || bytes.length !== entry.bytes || bytes.length > MAX_PARTITION_BYTES || sha256(bytes) !== entry.sha256) throw new DataPlaneVerificationError(`Partition ${entry.path} has an invalid digest or byte count.`)
  if (bytes.length === 0 || bytes[bytes.length - 1] !== 0x0a) throw new DataPlaneVerificationError(`Partition ${entry.path} has invalid NDJSON framing.`)
  const lines = []
  let start = 0
  for (let index = 0; index < bytes.length; index += 1) {
    if (bytes[index] !== 0x0a) continue
    const line = bytes.subarray(start, index)
    if (line.length === 0 || line.length > MAX_RECORD_BYTES || line.includes(0x0a) || line.includes(0x0d)) throw new DataPlaneVerificationError(`Partition ${entry.path} contains an invalid bounded NDJSON record.`)
    lines.push(parseCanonicalBytes(line, FACTORY_RECORD_SCHEMAS[entry.record_type], `${entry.path}:${lines.length + 1}`))
    start = index + 1
  }
  const identifiers = lines.map((record) => record.id)
  if (lines.length !== entry.record_count || identifiers[0] !== entry.first_id || identifiers.at(-1) !== entry.last_id || identifiers.some((id, index) => index > 0 && id <= identifiers[index - 1])) throw new DataPlaneVerificationError(`Partition ${entry.path} has invalid record bounds, ordering, or count.`)
  return lines
}

function formulaComposition(formula) {
  const composition = new Map()
  const parts = [...formula.matchAll(/([A-Z][a-z]?)([0-9]*)/g)]
  if (parts.map((part) => part[0]).join('') !== formula) throw new DataPlaneVerificationError(`Unsupported molecular formula: ${formula}.`)
  for (const [, element, count] of parts) composition.set(element, (composition.get(element) ?? 0) + Number(count || 1))
  return composition
}

function sideBalance(participants, compounds) {
  const composition = new Map()
  let charge = 0
  const seen = new Set()
  for (const participant of participants) {
    const compound = compounds.get(participant.compound_id)
    if (!compound || seen.has(participant.compound_id)) throw new DataPlaneVerificationError(`Reaction participant ${participant.compound_id} is unresolved or duplicated.`)
    seen.add(participant.compound_id)
    for (const [element, count] of formulaComposition(compound.formula)) composition.set(element, (composition.get(element) ?? 0) + count * participant.coefficient)
    charge += compound.charge * participant.coefficient
  }
  return { composition: [...composition.entries()].sort(), charge }
}

export function verifyRecordClosure(manifest, partitions) {
  const records = Object.fromEntries(RECORD_TYPES.map((type) => [type, []]))
  const previous = new Map()
  const paths = new Set()
  const partNumbers = new Map(RECORD_TYPES.map((type) => [type, []]))
  for (const entry of manifest.partitions) {
    if (paths.has(entry.path) || !entry.path.startsWith(`records/${entry.record_type}/`)) throw new DataPlaneVerificationError(`Manifest partition path/type closure is invalid: ${entry.path}.`)
    paths.add(entry.path)
    const number = Number(entry.path.match(/part-([0-9]{5})\.ndjson$/)?.[1])
    partNumbers.get(entry.record_type).push(number)
    const selected = partitions.get(entry.path)
    if (!selected) throw new DataPlaneVerificationError(`Verified partition is missing: ${entry.path}.`)
    if (previous.has(entry.record_type) && selected[0].id <= previous.get(entry.record_type)) throw new DataPlaneVerificationError(`Partition ordering overlaps for ${entry.record_type}.`)
    previous.set(entry.record_type, selected.at(-1).id)
    records[entry.record_type].push(...selected)
  }
  for (const type of RECORD_TYPES) {
    const numbers = partNumbers.get(type)
    if (numbers.length === 0 || numbers.some((number, index) => number !== index)) throw new DataPlaneVerificationError(`Manifest partitions for ${type} are not contiguous from zero.`)
    if (records[type].length !== manifest.record_counts[type]) throw new DataPlaneVerificationError(`Manifest aggregate count is invalid for ${type}.`)
  }
  const byId = Object.fromEntries(RECORD_TYPES.map((type) => [type, new Map(records[type].map((record) => [record.id, record]))]))
  const allIds = new Set(RECORD_TYPES.flatMap((type) => records[type].map((record) => record.id)))
  for (const [inputName, accessions] of Object.entries(EXPECTED_SOURCE_ACCESSIONS)) {
    if (accessions.some((accession) => !allIds.has(accession))) throw new DataPlaneVerificationError(`Pinned source accessions are not closed for ${inputName}.`)
  }
  if (canonicalJson([...byId.taxa.keys()].sort()) !== canonicalJson([...manifest.supported_taxa].sort())) throw new DataPlaneVerificationError('Taxa do not match manifest supported_taxa.')
  for (const protein of records.proteins) {
    if (!byId.taxa.has(protein.taxon_id) || protein.id !== `UniProtKB:${protein.accession}`) throw new DataPlaneVerificationError(`Protein ${protein.id} has an invalid taxon or accession binding.`)
  }
  for (const reaction of records.reactions) {
    const left = sideBalance(reaction.reactants, byId.compounds)
    const right = sideBalance(reaction.products, byId.compounds)
    if (canonicalJson(left) !== canonicalJson(right)) throw new DataPlaneVerificationError(`Reaction ${reaction.id} is not chemically and electrically balanced.`)
  }
  const evidenceCodes = { direct: new Set(['ECO:0000269']), inferred: new Set(['ECO:0000250', 'ECO:0000305']) }
  for (const assertion of records.catalysis) {
    const protein = byId.proteins.get(assertion.protein_id)
    if (!protein || !byId.reactions.has(assertion.reaction_id)) throw new DataPlaneVerificationError(`Catalysis assertion ${assertion.id} has an unresolved protein or reaction.`)
    if (protein.taxon_id !== assertion.taxon_id) throw new DataPlaneVerificationError(`Catalysis assertion ${assertion.id} has a taxon mismatch.`)
    if (!evidenceCodes[assertion.evidence_class].has(assertion.evidence_code)) throw new DataPlaneVerificationError(`Catalysis assertion ${assertion.id} has an evidence class/code conflict.`)
    if (assertion.reference_ids.some((id) => !byId.references.has(id))) throw new DataPlaneVerificationError(`Catalysis assertion ${assertion.id} has an unresolved reference.`)
  }
  for (const taxon of records.taxa) for (const reaction of records.reactions) {
    const assertions = records.catalysis.filter((item) => item.taxon_id === taxon.id && item.reaction_id === reaction.id)
    if (assertions.length !== 1) throw new DataPlaneVerificationError(`Catalysis coverage is incomplete for ${taxon.id}/${reaction.id}.`)
  }
  return records
}

function scientificClosureResults(manifest, records) {
  const citedAssertions = records.catalysis.filter((assertion) => assertion.reference_ids.length > 0).length
  return {
    recordCounts: manifest.record_counts,
    totalRecords: Object.values(manifest.record_counts).reduce((sum, count) => sum + count, 0),
    partitionCount: manifest.partitions.length,
    sourceObjectCount: manifest.inputs.length,
    reactionBalance: { checked: records.reactions.length, passed: true },
    taxonCatalysisClosure: {
      taxa: records.taxa.length,
      reactions: records.reactions.length,
      expectedAssertions: records.taxa.length * records.reactions.length,
      actualAssertions: records.catalysis.length,
      passed: true
    },
    referenceClosure: { references: records.references.length, citedAssertions, unresolvedReferences: 0, passed: true },
    allChecksPassed: true
  }
}

export function verifyProducerPage(value, release, recordType, limit, expectedItems) {
  const page = FactoryRecordPageSchema.parse(value)
  if (page.release.id !== release.id || page.release.digest !== release.digest || page.release.schema_version !== release.schema_version || page.record_type !== recordType || canonicalJson(page.filters) !== '{}' || page.sort !== 'id:asc' || page.limit !== limit) throw new DataPlaneVerificationError(`Producer page query binding is invalid for ${recordType}.`)
  if (page.items.length > limit || (page.next_cursor !== null && page.items.length === 0)) throw new DataPlaneVerificationError(`Producer page size or continuation is invalid for ${recordType}.`)
  for (const item of page.items) expectedItems.push(item)
  return page.next_cursor
}

export function verifyProducerTraversal(records, traversed) {
  for (const type of RECORD_TYPES) {
    if (canonicalJson(traversed[type]) !== canonicalJson(records[type])) throw new DataPlaneVerificationError(`Producer cursor traversal does not equal partition records for ${type}.`)
  }
}

export function verifySemanticDiff(bytes, baseline, candidate) {
  const diff = parseCanonicalBytes(bytes, FactorySemanticDiffSchema, 'Factory semantic diff', DATA_PLANE_DIFF_RESPONSE_DIGEST)
  const digestValue = { ...diff }
  delete digestValue.diff_digest
  if (sha256(Buffer.from(canonicalJson(digestValue))) !== DATA_PLANE_DIFF_DIGEST || diff.diff_digest !== DATA_PLANE_DIFF_DIGEST) throw new DataPlaneVerificationError('Factory semantic diff digest is invalid.')
  if (canonicalJson(diff.baseline) !== canonicalJson(baseline.release) || canonicalJson(diff.candidate) !== canonicalJson(candidate.release)) throw new DataPlaneVerificationError('Factory semantic diff release identities are invalid.')
  let changedRecordCount = 0
  for (const type of RECORD_TYPES) {
    const before = new Map(baseline.records[type].map((record) => [record.id, record]))
    const after = new Map(candidate.records[type].map((record) => [record.id, record]))
    if (before.size !== after.size || [...before.keys()].some((id) => !after.has(id))) throw new DataPlaneVerificationError(`Factory candidate changed the ${type} identity closure unexpectedly.`)
    for (const [id, record] of before) {
      if (canonicalJson(record) === canonicalJson(after.get(id))) continue
      changedRecordCount += 1
      if (type !== 'references' || id !== 'PubMed:24698160') throw new DataPlaneVerificationError(`Factory candidate contains an unexpected scientific record change: ${type}/${id}.`)
      const expectedAfter = { ...record, citation: `${record.citation} doi: 10.1111/febs.12803.` }
      if (canonicalJson(after.get(id)) !== canonicalJson(expectedAfter)) throw new DataPlaneVerificationError('Factory candidate citation change does not match the independently expected DOI normalization.')
    }
  }
  if (changedRecordCount !== 1 || canonicalJson(diff.counts) !== canonicalJson({ added: 0, removed: 0, changed: 1, unchanged: 16 })) throw new DataPlaneVerificationError('Factory semantic diff record counts do not match independent comparison.')
  const change = diff.record_changes[0]
  if (diff.record_changes.length !== 1 || change.record_type !== 'references' || change.id !== 'PubMed:24698160' || change.status !== 'changed' || change.fields.length !== 1 || change.fields[0].path !== '$.citation' || canonicalJson(change.fields[0].before) !== canonicalJson(baseline.records.references[0].citation) || canonicalJson(change.fields[0].after) !== canonicalJson(candidate.records.references[0].citation) || canonicalJson(change.attribution) !== canonicalJson(['adapter:pubmed-esummary-json-doi@1.1.0'])) throw new DataPlaneVerificationError('Factory semantic diff does not contain exactly the expected attributed citation change.')
  const baselineInputs = new Map(baseline.manifest.inputs.map((input) => [input.name, input]))
  const candidateInputs = new Map(candidate.manifest.inputs.map((input) => [input.name, input]))
  for (const [name, before] of baselineInputs) {
    const after = candidateInputs.get(name)
    if (!after || canonicalJson(before.license) !== canonicalJson(after.license) || before.source_object_sha256 !== after.source_object_sha256 || before.source_object_bytes !== after.source_object_bytes) throw new DataPlaneVerificationError(`Factory candidate changed source bytes or rights unexpectedly for ${name}.`)
    if (name !== 'pubmed-24698160-esummary-json' && canonicalJson(before) !== canonicalJson(after)) throw new DataPlaneVerificationError(`Factory candidate changed non-PubMed provenance unexpectedly for ${name}.`)
  }
  if (diff.rights_changes.length !== 0 || diff.scientific_metadata_changes.length !== 0) throw new DataPlaneVerificationError('Factory candidate contains unexpected rights or scientific metadata changes.')
  const provenanceNames = new Set(diff.provenance_changes.map((item) => item.input))
  for (const expected of ['pubmed-24698160-esummary-json', 'release-envelope.recipe_path', 'release-envelope.recipe_sha256', 'release-envelope.source_lock_path', 'release-envelope.source_lock_sha256']) if (!provenanceNames.has(expected)) throw new DataPlaneVerificationError(`Factory semantic diff is missing provenance attribution: ${expected}.`)
  return diff
}

export function verifyStoredRelease(snapshot) {
  const trust = verifyTrust(snapshot.trustBytes)
  const { catalog, entries } = verifyCatalog(snapshot.catalogBytes, trust)
  const envelopeValue = parseCanonicalBytes(snapshot.envelopeBytes, FactoryReleaseEnvelopeSchema, 'Stored release envelope')
  const entry = entries.get(envelopeValue.payload.release_id)
  if (!entry) throw new DataPlaneVerificationError(`Stored release is absent from the signed catalog: ${envelopeValue.payload.release_id}.`)
  const { envelope, key } = verifyEnvelope(snapshot.envelopeBytes, entry, trust)
  const manifest = verifyManifest(snapshot.manifestBytes, entry, envelope)
  const parsedPartitions = new Map(manifest.partitions.map((entryValue) => {
    const bytes = snapshot.partitionBytes.get(entryValue.path)
    return [entryValue.path, parsePartition(bytes, entryValue)]
  }))
  const records = verifyRecordClosure(manifest, parsedPartitions)
  const release = { id: manifest.release_id, schema_version: manifest.schema_version, digest: manifest.release_digest }
  return { trust, catalog, entry, envelope, key, manifest, parsedPartitions, records, release, results: scientificClosureResults(manifest, records) }
}

export function verifyStoredBundle(releases, diffBytes) {
  const baseline = releases.get(DATA_PLANE_BASELINE_RELEASE_ID)
  const candidate = releases.get(DATA_PLANE_CANDIDATE_RELEASE_ID)
  if (!baseline || !candidate) throw new DataPlaneVerificationError('Stored bundle does not contain both pinned releases.')
  return verifySemanticDiff(diffBytes, baseline, candidate)
}

export { RECORD_TYPES, SOURCE_POLICY }
