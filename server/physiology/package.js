import { createHash, createPublicKey, verify } from 'node:crypto'
import yauzl from 'yauzl'
import yazl from 'yazl'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  BPP_MAX_ARCHIVE_BYTES,
  BPP_MAX_COMPRESSION_RATIO,
  BPP_MAX_ENTRIES,
  BPP_MAX_ENTRY_BYTES,
  BPP_MAX_TOTAL_BYTES,
  BPP_PROFILE,
  BppCouplingDescriptorSchema,
  BppManifestSchema,
  BppModelDescriptorSchema,
  BppSignatureSchema,
  CertificationSchema,
  PackageValidationResponseSchema,
  PHYSIOLOGY_WARNING,
  PhysiologyPackageSchema
} from '../../shared/physiology-contracts.js'

const ZIP_MTIME = new Date('1980-01-01T00:00:00.000Z')
const REQUIRED_FILES = new Set(['manifest.json', 'model.json', 'coupling.json', 'signature.json'])
const digestBuffer = (buffer) => `sha256:${createHash('sha256').update(buffer).digest('hex')}`

class BppValidationError extends Error {
  constructor(code, path, message) {
    super(message)
    this.name = 'BppValidationError'
    this.code = code
    this.path = path
  }
}

const invalid = (code, path, message) => { throw new BppValidationError(code, path, message) }

function parseCanonicalJson(buffer, schema, path) {
  let value
  const text = buffer.toString('utf8')
  try {
    value = JSON.parse(text)
  } catch {
    invalid('invalid_json', path, `${path} is not valid UTF-8 JSON.`)
  }
  try {
    if (text !== canonicalJson(value)) invalid('noncanonical_json', path, `${path} must use canonical JSON encoding.`)
  } catch (error) {
    if (error instanceof BppValidationError) throw error
    invalid('noncanonical_json', path, `${path} cannot be represented as canonical JSON.`)
  }
  const parsed = schema.safeParse(value)
  if (!parsed.success) invalid('schema_mismatch', path, `${path} does not match the strict ${BPP_PROFILE} contract: ${parsed.error.issues[0]?.message ?? 'invalid value'}`)
  return parsed.data
}

function readArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > BPP_MAX_ARCHIVE_BYTES) return Promise.reject(new BppValidationError('archive_size', 'archive', `Compressed .bpp package must be 1..${BPP_MAX_ARCHIVE_BYTES} bytes.`))
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, decodeStrings: true, validateEntrySizes: true, strictFileNames: true }, (openError, zip) => {
      if (openError) return reject(new BppValidationError('invalid_zip', 'archive', 'Package is not a valid strict ZIP archive.'))
      const files = new Map()
      let entries = 0
      let total = 0
      let failed = false
      const fail = (error) => {
        if (failed) return
        failed = true
        zip.close()
        reject(error instanceof BppValidationError ? error : new BppValidationError('invalid_zip', 'archive', error instanceof Error ? error.message : 'Invalid ZIP archive.'))
      }
      zip.on('error', fail)
      zip.on('entry', (entry) => {
        const path = entry.fileName
        entries += 1
        if (entries > BPP_MAX_ENTRIES) return fail(new BppValidationError('entry_count', 'archive', `Package contains more than ${BPP_MAX_ENTRIES} entries.`))
        if (path.includes('\\') || path.startsWith('/') || path.split('/').includes('..') || path.includes('\0') || path.endsWith('/')) return fail(new BppValidationError('unsafe_path', path, `${path} is an unsafe or unsupported package path.`))
        if (!REQUIRED_FILES.has(path) && !/^process\/[a-z0-9][a-z0-9._-]{0,63}$/.test(path)) return fail(new BppValidationError('unsupported_entry', path, `${path} is not allowed in a .bpp package.`))
        if (files.has(path)) return fail(new BppValidationError('duplicate_entry', path, `${path} is duplicated.`))
        const unixType = (entry.externalFileAttributes >>> 16) & 0o170000
        if (unixType === 0o120000) return fail(new BppValidationError('symbolic_link', path, `${path} is a symbolic link; links are forbidden.`))
        if ((entry.generalPurposeBitFlag & 0x1) !== 0) return fail(new BppValidationError('encrypted_entry', path, `${path} is encrypted; encrypted entries are forbidden.`))
        if (entry.uncompressedSize > BPP_MAX_ENTRY_BYTES) return fail(new BppValidationError('entry_size', path, `${path} exceeds ${BPP_MAX_ENTRY_BYTES} expanded bytes.`))
        if (entry.uncompressedSize > 0 && (entry.compressedSize === 0 || entry.uncompressedSize / entry.compressedSize > BPP_MAX_COMPRESSION_RATIO)) return fail(new BppValidationError('compression_ratio', path, `${path} exceeds the ${BPP_MAX_COMPRESSION_RATIO}:1 compression ratio cap.`))
        total += entry.uncompressedSize
        if (total > BPP_MAX_TOTAL_BYTES) return fail(new BppValidationError('expanded_size', 'archive', `Package exceeds ${BPP_MAX_TOTAL_BYTES} total expanded bytes.`))
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail(streamError)
          const chunks = []
          let bytes = 0
          stream.on('data', (chunk) => {
            bytes += chunk.length
            if (bytes > BPP_MAX_ENTRY_BYTES) return fail(new BppValidationError('streamed_size', path, `${path} exceeded its streamed byte cap.`))
            chunks.push(chunk)
          })
          stream.on('error', fail)
          stream.on('end', () => {
            if (failed) return
            if (bytes !== entry.uncompressedSize) return fail(new BppValidationError('size_mismatch', path, `${path} streamed size differs from its ZIP directory record.`))
            files.set(path, Buffer.concat(chunks))
            zip.readEntry()
          })
        })
      })
      zip.on('end', () => { if (!failed) resolve(files) })
      zip.readEntry()
    })
  })
}

function verifyDescriptorClosure(manifest, model, coupling, evidence) {
  if (model.pluginId !== manifest.pluginId || coupling.pluginId !== manifest.pluginId) invalid('plugin_id_mismatch', 'manifest.json', 'Manifest, model, and coupling plugin identifiers must match.')
  const modelEvidence = evidence.modelEvidence.find((item) => item.id === manifest.evidence.modelEvidenceId)
  const applicability = evidence.applicability.find((item) => item.plugin_id === manifest.pluginId)
  if (!modelEvidence || modelEvidence.plugin_id !== manifest.pluginId) invalid('evidence_mismatch', 'manifest.json', 'Package does not bind the pinned model evidence for its plugin.')
  if (!applicability || applicability.context_id !== model.contextId) invalid('applicability_mismatch', 'manifest.json', 'Package context is outside pinned applicability evidence.')
  if (manifest.evidence.releaseId !== evidence.release.id || manifest.evidence.releaseDigest !== evidence.release.digest || manifest.evidence.modelEvidenceDigest !== modelEvidence.model_digest || manifest.evidence.protocolEvidenceDigest !== modelEvidence.protocol_digest) invalid('evidence_digest_mismatch', 'manifest.json', 'Package evidence digests do not match the pinned physiology release.')
  if (model.evidenceModelDigest !== modelEvidence.model_digest || coupling.protocolEvidenceDigest !== modelEvidence.protocol_digest) invalid('descriptor_evidence_mismatch', 'model.json', 'Descriptor evidence digests do not match the pinned model evidence.')
  if (canonicalJson(coupling.ports) !== canonicalJson(modelEvidence.ports)) invalid('port_mismatch', 'coupling.json', 'Package ports do not exactly match pinned model evidence.')
  if (manifest.applicability.contextIds[0] !== modelEvidence.context_id || manifest.applicability.domains[0] !== modelEvidence.domain || manifest.applicability.taxonIds[0] !== applicability.taxon_id) invalid('applicability_mismatch', 'manifest.json', 'Package applicability does not exactly match pinned model evidence.')
  if (coupling.cadenceMinutes !== modelEvidence.numeric_assumptions[0].value || model.cadenceMinutes !== coupling.cadenceMinutes) invalid('cadence_mismatch', 'coupling.json', 'Package cadence does not match the explicitly labeled upstream assumption.')

  const outputPorts = new Set(coupling.ports.filter((port) => port.direction === 'output').map((port) => port.id))
  if (new Set(model.outputSchedules.map((item) => item.portId)).size !== model.outputSchedules.length || model.outputSchedules.some((item) => !outputPorts.has(item.portId))) invalid('output_port_mismatch', 'model.json', 'Output schedules must bind each declared output port at most once.')
  for (const schedule of model.outputSchedules) {
    let cursor = 0
    for (const interval of schedule.intervals) {
      if (interval.startMinute !== cursor) invalid('schedule_gap', 'model.json', `Output schedule ${schedule.portId} is not contiguous from minute zero.`)
      cursor = interval.endMinute
    }
    if (cursor !== 4) invalid('schedule_scope', 'model.json', `Output schedule ${schedule.portId} must cover exactly the bounded four-minute benchmark.`)
  }
}

function certification(checks, passed) {
  return CertificationSchema.parse({
    status: passed && Object.values(checks).every(Boolean) ? 'certified-conformant' : 'not-certified',
    checks,
    protocolConformance: passed ? 'passed' : 'failed',
    scientificValidation: 'unsupported',
    statement: 'Certification is software protocol conformance only and does not establish scientific validity.'
  })
}

function verifyPublisher(manifest, signature, trustKey) {
  if (!trustKey) invalid('unknown_publisher', 'signature.json', `Publisher key ${signature.keyId} is not in the local trust store.`)
  if (trustKey.status !== 'trusted') invalid('revoked_publisher', 'signature.json', `Publisher key ${signature.keyId} is revoked.`)
  if (signature.keyId !== manifest.publisher.keyId || signature.keyId !== trustKey.keyId) invalid('publisher_mismatch', 'signature.json', 'Publisher key identifiers do not match.')
  const signedDigest = canonicalDigest(manifest)
  if (signature.signedDigest !== signedDigest) invalid('signed_digest_mismatch', 'signature.json', 'Publisher signature digest does not match canonical manifest bytes.')
  let publicKey
  try {
    publicKey = createPublicKey({ key: Buffer.from(trustKey.publicKeySpkiBase64, 'base64'), format: 'der', type: 'spki' })
  } catch {
    invalid('invalid_public_key', 'trust-store', 'Trusted publisher public key is invalid.')
  }
  if (!verify(null, Buffer.from(signature.signedDigest), publicKey, Buffer.from(signature.signature, 'base64'))) invalid('signature_invalid', 'signature.json', 'Ed25519 publisher signature verification failed.')
}

export async function inspectBppPackage(buffer, options) {
  const files = await readArchive(buffer)
  for (const required of REQUIRED_FILES) if (!files.has(required)) invalid('missing_entry', required, `${required} is required.`)
  const manifest = parseCanonicalJson(files.get('manifest.json'), BppManifestSchema, 'manifest.json')
  const signature = parseCanonicalJson(files.get('signature.json'), BppSignatureSchema, 'signature.json')
  const listedPaths = new Set(manifest.contents.map((item) => item.path))
  const expectedPaths = new Set([...REQUIRED_FILES, ...listedPaths])
  for (const path of files.keys()) if (!expectedPaths.has(path)) invalid('unlisted_entry', path, `${path} is not listed in the canonical manifest.`)
  for (const descriptor of manifest.contents) {
    const content = files.get(descriptor.path)
    if (!content) invalid('missing_content', descriptor.path, `${descriptor.path} is listed but missing.`)
    if (content.length !== descriptor.bytes || digestBuffer(content) !== `sha256:${descriptor.sha256}`) invalid('content_digest_mismatch', descriptor.path, `${descriptor.path} does not match its declared byte count and SHA-256.`)
    if (['model.json', 'coupling.json'].includes(descriptor.path) && descriptor.mediaType !== 'application/json') invalid('media_type_mismatch', descriptor.path, `${descriptor.path} must be application/json.`)
    if (descriptor.path.startsWith('process/') && descriptor.mediaType !== 'application/javascript') invalid('media_type_mismatch', descriptor.path, `${descriptor.path} must be application/javascript.`)
  }
  const model = parseCanonicalJson(files.get('model.json'), BppModelDescriptorSchema, 'model.json')
  const coupling = parseCanonicalJson(files.get('coupling.json'), BppCouplingDescriptorSchema, 'coupling.json')
  verifyDescriptorClosure(manifest, model, coupling, options.evidence)
  const trustKey = options.trustKey(signature.keyId)
  verifyPublisher(manifest, signature, trustKey)
  const checks = { signature: true, schema: true, ports: true, applicability: true, license: true, resources: true, conformanceBenchmark: manifest.pluginKind === 'declarative' }
  const processAllowed = manifest.pluginKind === 'declarative' || options.processSandboxAvailable === true
  const record = PhysiologyPackageSchema.parse({
    packageDigest: digestBuffer(buffer),
    modelDescriptorDigest: digestBuffer(files.get('model.json')),
    couplingDescriptorDigest: digestBuffer(files.get('coupling.json')),
    bytes: buffer.length,
    installedAt: options.installedAt ?? new Date().toISOString(),
    builtIn: options.builtIn ?? false,
    manifest,
    signature,
    trust: { keyId: trustKey.keyId, status: trustKey.status, publisher: trustKey.publisher },
    certification: certification(checks, manifest.pluginKind === 'declarative')
  })
  return { record, manifest, signature, model, coupling, files, installable: processAllowed }
}

export async function validateBppPackage(buffer, options) {
  try {
    const inspected = await inspectBppPackage(buffer, options)
    const findings = inspected.installable ? [] : [{ code: 'process_sandbox_unavailable', path: 'manifest.json', message: 'Process plugin is recognized but installation and execution are refused because the configured Bubblewrap sandbox did not pass capability checks.' }]
    return { ...inspected, response: PackageValidationResponseSchema.parse({ valid: true, installable: inspected.installable, profile: BPP_PROFILE, package: inspected.record, findings }) }
  } catch (error) {
    const finding = error instanceof BppValidationError
      ? { code: error.code, path: error.path, message: error.message }
      : { code: 'package_validation', path: 'archive', message: error instanceof Error ? error.message : 'Package validation failed.' }
    return { response: PackageValidationResponseSchema.parse({ valid: false, installable: false, profile: BPP_PROFILE, package: null, findings: [finding] }) }
  }
}

export function createBppArchive({ manifest, model, coupling, signature, process }) {
  const entries = [
    ['manifest.json', Buffer.from(canonicalJson(manifest))],
    ['model.json', Buffer.from(canonicalJson(model))],
    ['coupling.json', Buffer.from(canonicalJson(coupling))],
    ...(process ? [[manifest.entrypoints.process, Buffer.isBuffer(process) ? process : Buffer.from(process)]] : []),
    ['signature.json', Buffer.from(canonicalJson(signature))]
  ]
  const zip = new yazl.ZipFile()
  for (const [path, content] of entries) zip.addBuffer(content, path, { compress: true, mtime: ZIP_MTIME, mode: 0o100600 })
  zip.end()
  return new Promise((resolve, reject) => {
    const chunks = []
    zip.outputStream.on('data', (chunk) => chunks.push(chunk))
    zip.outputStream.on('error', reject)
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

export { BppValidationError, digestBuffer, readArchive, verifyDescriptorClosure }
