import yauzl from 'yauzl'
import yazl from 'yazl'
import { canonicalJson } from '../../shared/canonical-json.js'
import { sha256Prefixed as bufferDigest } from '../commons/digest.js'
import { KnowledgeSnapshotSchema } from '../../shared/snapshot-contracts.js'
import { PORTABLE_BUNDLE_PROFILE, PortableBundleManifestSchema, WORKSPACE_MAX_BUNDLE_BYTES, WorkspaceRunResultSchema, WorkspaceSpecificationSchema } from '../../shared/workspace-contracts.js'
import { verifyKnowledgeSnapshot } from '../knowledge/snapshot.js'
import { modelDigest } from '../portfolio/identity.js'
import { engineIdentity, specificationIdentity } from './identity.js'

const MAX_ENTRY_BYTES = 25_000_000
const MAX_TOTAL_BYTES = 50_000_000
const MAX_ENTRIES = 260
const MAX_COMPRESSION_RATIO = 100
const ZIP_MTIME = new Date('1980-01-01T00:00:00.000Z')

const objectPath = (digest) => `objects/sha256/${digest.slice('sha256:'.length)}`

function zipBuffer(files) {
  const zip = new yazl.ZipFile()
  for (const [path, buffer] of files) zip.addBuffer(buffer, path, { compress: true, mtime: ZIP_MTIME, mode: 0o100600 })
  zip.end()
  return new Promise((resolve, reject) => {
    const chunks = []
    zip.outputStream.on('data', (chunk) => chunks.push(chunk))
    zip.outputStream.on('error', reject)
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

export async function exportPortableBundle({ experiment, revision, specificationBytes, snapshotBytes, resultBytes }) {
  const objectBuffers = new Map()
  const addObject = (buffer, mediaType) => {
    const digest = bufferDigest(buffer)
    objectBuffers.set(digest, { buffer, mediaType })
    return digest
  }
  addObject(specificationBytes, 'application/json')
  addObject(snapshotBytes, 'application/vnd.biochemical-db.snapshot+json')
  const expectedResultDigest = resultBytes ? addObject(resultBytes, 'application/vnd.biochemical-workspace.result+json') : null
  const objects = [...objectBuffers.entries()].map(([digest, item]) => ({ path: objectPath(digest), digest, bytes: item.buffer.length, mediaType: item.mediaType })).sort((left, right) => left.path.localeCompare(right.path))
  const { specification: _specification, ...portableRevision } = revision
  const manifest = PortableBundleManifestSchema.parse({
    profile: PORTABLE_BUNDLE_PROFILE,
    experiment,
    revision: portableRevision,
    objects,
    snapshotPath: 'snapshot.json',
    rerun: { contract: revision.specification.numericalContract, expectedResultDigest }
  })
  const files = [
    ['manifest.json', Buffer.from(canonicalJson(manifest))],
    ['snapshot.json', snapshotBytes],
    ...objects.map((descriptor) => [descriptor.path, objectBuffers.get(descriptor.digest).buffer])
  ]
  return zipBuffer(files)
}

function readZip(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > WORKSPACE_MAX_BUNDLE_BYTES) return Promise.reject(new Error(`bundle: compressed bundle must be 1..${WORKSPACE_MAX_BUNDLE_BYTES} bytes`))
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, decodeStrings: true, validateEntrySizes: true, strictFileNames: true }, (openError, zip) => {
      if (openError) return reject(openError)
      const files = new Map()
      let entries = 0
      let total = 0
      let failed = false
      const fail = (error) => {
        if (failed) return
        failed = true
        zip.close()
        reject(error)
      }
      zip.on('error', fail)
      zip.on('entry', (entry) => {
        const path = entry.fileName
        entries += 1
        if (entries > MAX_ENTRIES) return fail(new Error(`bundle: more than ${MAX_ENTRIES} entries`))
        if (path.includes('\\') || path.startsWith('/') || path.split('/').includes('..') || path.includes('\0') || path.endsWith('/')) return fail(new Error(`${path}: unsafe or unsupported bundle path`))
        if (!/^(?:manifest\.json|snapshot\.json|objects\/sha256\/[a-f0-9]{64})$/.test(path)) return fail(new Error(`${path}: unsupported bundle entry`))
        if (files.has(path)) return fail(new Error(`${path}: duplicate bundle entry`))
        const unixType = (entry.externalFileAttributes >>> 16) & 0o170000
        if (unixType === 0o120000) return fail(new Error(`${path}: symbolic links are forbidden`))
        if (entry.uncompressedSize > MAX_ENTRY_BYTES) return fail(new Error(`${path}: entry exceeds ${MAX_ENTRY_BYTES} bytes`))
        if (entry.uncompressedSize > 0 && (entry.compressedSize === 0 || entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO)) return fail(new Error(`${path}: compression ratio exceeds ${MAX_COMPRESSION_RATIO}`))
        total += entry.uncompressedSize
        if (total > MAX_TOTAL_BYTES) return fail(new Error(`bundle: expanded content exceeds ${MAX_TOTAL_BYTES} bytes`))
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail(streamError)
          const chunks = []
          let bytes = 0
          stream.on('data', (chunk) => {
            bytes += chunk.length
            if (bytes > MAX_ENTRY_BYTES) return fail(new Error(`${path}: streamed entry exceeds its limit`))
            chunks.push(chunk)
          })
          stream.on('error', fail)
          stream.on('end', () => {
            if (failed) return
            if (bytes !== entry.uncompressedSize) return fail(new Error(`${path}: streamed size differs from the ZIP directory`))
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

export async function importPortableBundle(buffer) {
  const files = await readZip(buffer)
  if (!files.has('manifest.json') || !files.has('snapshot.json')) throw new Error('bundle: manifest.json and snapshot.json are required')
  let manifest
  try {
    const text = files.get('manifest.json').toString('utf8')
    const raw = JSON.parse(text)
    if (text !== canonicalJson(raw)) throw new Error('manifest is not canonical JSON')
    manifest = PortableBundleManifestSchema.parse(raw)
  } catch (error) {
    throw new Error(`manifest.json: ${error instanceof Error ? error.message : 'invalid manifest'}`)
  }
  const listedPaths = new Set(['manifest.json', 'snapshot.json'])
  const listedDigests = new Set()
  for (const descriptor of manifest.objects) {
    if (listedPaths.has(descriptor.path) || listedDigests.has(descriptor.digest)) throw new Error(`${descriptor.path}: duplicate manifest object`)
    listedPaths.add(descriptor.path)
    listedDigests.add(descriptor.digest)
    const content = files.get(descriptor.path)
    if (!content) throw new Error(`${descriptor.path}: listed object is missing`)
    if (content.length !== descriptor.bytes) throw new Error(`${descriptor.path}: object size does not match the manifest`)
    if (bufferDigest(content) !== descriptor.digest || descriptor.path !== objectPath(descriptor.digest)) throw new Error(`${descriptor.path}: object digest does not match its content address`)
  }
  for (const path of files.keys()) if (!listedPaths.has(path)) throw new Error(`${path}: unlisted bundle object`)

  const snapshotBytes = files.get('snapshot.json')
  let snapshot
  try {
    const text = snapshotBytes.toString('utf8')
    const raw = JSON.parse(text)
    if (text !== canonicalJson(raw)) throw new Error('snapshot is not canonical JSON')
    snapshot = verifyKnowledgeSnapshot(KnowledgeSnapshotSchema.parse(raw))
  } catch (error) {
    throw new Error(`snapshot.json: ${error instanceof Error ? error.message : 'invalid snapshot'}`)
  }
  if (bufferDigest(snapshotBytes) !== manifest.revision.snapshotObjectDigest) throw new Error('snapshot.json: object digest does not match the revision')

  const specificationBytes = files.get(objectPath(manifest.revision.specificationObjectDigest))
  if (!specificationBytes) throw new Error('bundle: revision specification object is missing')
  let specification
  try {
    const text = specificationBytes.toString('utf8')
    const raw = JSON.parse(text)
    if (text !== canonicalJson(raw)) throw new Error('specification is not canonical JSON')
    specification = WorkspaceSpecificationSchema.parse(raw)
  } catch (error) {
    throw new Error(`specification: ${error instanceof Error ? error.message : 'invalid specification'}`)
  }
  if (specificationIdentity(specification) !== manifest.revision.specificationDigest) throw new Error('specification: digest does not match the revision')
  const modelDigests = [...new Set(specification.entries.map((entry) => modelDigest(entry.model)))].sort()
  const engineDigests = [...new Set(specification.entries.map((entry) => engineIdentity(entry.experiment.engine)))].sort()
  if (canonicalJson(modelDigests) !== canonicalJson([...manifest.revision.modelDigests].sort())) throw new Error('specification: model digests do not match the revision')
  if (canonicalJson(engineDigests) !== canonicalJson([...manifest.revision.engineDigests].sort())) throw new Error('specification: engine digests do not match the revision')
  if (`sha256:${snapshot.snapshot_digest}` !== manifest.revision.snapshotDigest) throw new Error('snapshot.json: scientific digest does not match the revision')

  let expectedResultBytes = null
  if (manifest.rerun.expectedResultDigest) {
    expectedResultBytes = files.get(objectPath(manifest.rerun.expectedResultDigest))
    if (!expectedResultBytes) throw new Error('bundle: expected rerun result object is missing')
    WorkspaceRunResultSchema.parse(JSON.parse(expectedResultBytes.toString('utf8')))
  }
  return { manifest, specification, snapshot, specificationBytes, snapshotBytes, expectedResultBytes }
}
