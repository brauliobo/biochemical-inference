import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { chmod, copyFile, lstat, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import { acquireInferenceBackupLock, assertInferenceOperationLock } from '../../server/operations/runtime-lock.js'
import { assertSafeLocalFilesystem, inspectNoSymlinkPath, publishDirectoryAnchored, removeAnchored, syncPath, syncTree, withDirectoryAnchor } from '../../server/operations/path-safety.js'

export const INFERENCE_BACKUP_VERSION = 'biochemical-inference-state-backup-v1'
export const INFERENCE_STATE_ROOTS = Object.freeze([
  ['challenge', 'sqlite-cas', 'goal13.sqlite3'],
  ['data-plane', 'sqlite-cas', 'data-plane.sqlite3'],
  ['measured', 'sqlite-cas', 'measured.sqlite3'],
  ['measured-spatial', 'sqlite-chunk-cache', 'goal14.sqlite3'],
  ['physiology', 'sqlite-cas', 'physiology.sqlite3'],
  ['revalidation', 'sqlite-cas', 'revalidation.sqlite3'],
  ['spatial-registration', 'sqlite-chunk-cache', 'goal14-registration-v1-1.sqlite3'],
  ['workspace', 'sqlite-cas', 'workspace.sqlite3']
].map(([name, kind, database]) => Object.freeze({ name, kind, database })))

const PRIVATE_NAME = /(?:^|\/)(?:[^/]*(?:private[-_.]?key|secret|token)[^/]*|[^/]+\.pem)$/i
const PRIVATE_BYTES = [Buffer.from('-----BEGIN PRIVATE KEY-----'), Buffer.from('-----BEGIN ENCRYPTED PRIVATE KEY-----')]
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))
const digest = (value) => createHash('sha256').update(value).digest('hex')

function inside(parent, child) {
  const selected = relative(parent, child)
  return selected === '' || (selected !== '..' && !selected.startsWith(`..${sep}`) && !isAbsolute(selected))
}

async function exactDirectory(path, label) {
  return (await inspectNoSymlinkPath(path, label)).path
}

async function secretPatterns(secretEnvPaths) {
  const patterns = [...PRIVATE_BYTES]
  for (const path of secretEnvPaths ?? []) {
    await inspectNoSymlinkPath(path, 'secret environment file', { type: 'file' })
    for (const line of (await readFile(resolve(path), 'utf8')).split('\n')) {
      if (!line || line.startsWith('#')) continue
      const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line)
      if (!match) throw new Error('secret environment files must use unquoted NAME=value lines')
      if (!/(?:TOKEN|SECRET|PRIVATE_KEY)/.test(match[1]) || match[2].length < 12) continue
      patterns.push(Buffer.from(match[2]))
      if (match[1].includes('PRIVATE_KEY') && isAbsolute(match[2])) {
        await inspectNoSymlinkPath(match[2], 'private key file', { type: 'file' })
        patterns.push(await readFile(match[2]))
      }
    }
  }
  return patterns.filter((value, index, values) => value.length > 0 && values.findIndex((candidate) => candidate.equals(value)) === index)
}

async function hashFile(path, patterns, label) {
  const before = await lstat(path, { bigint: true })
  if (!before.isFile() || before.isSymbolicLink() || before.nlink !== 1n) throw new Error(`${label} must be a non-linked regular file`)
  const hash = createHash('sha256')
  const overlapLength = Math.max(...patterns.map((value) => value.length), 1) - 1
  let overlap = Buffer.alloc(0)
  let size = 0n
  for await (const value of createReadStream(path, { highWaterMark: 1024 * 1024 })) {
    const chunk = Buffer.from(value)
    const searchable = Buffer.concat([overlap, chunk])
    if (patterns.some((pattern) => searchable.indexOf(pattern) !== -1)) throw new Error(`${label} contains configured or private-key secret material`)
    hash.update(chunk)
    size += BigInt(chunk.length)
    overlap = overlapLength > 0 ? searchable.subarray(Math.max(0, searchable.length - overlapLength)) : Buffer.alloc(0)
  }
  const after = await stat(path, { bigint: true })
  if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || size !== after.size) throw new Error(`${label} changed while it was read`)
  if (size > BigInt(Number.MAX_SAFE_INTEGER)) throw new Error(`${label} is too large for the backup manifest`)
  return { sha256: hash.digest('hex'), size: Number(size) }
}

async function inventory(root, patterns) {
  const directories = []
  const files = []
  async function visit(directory, prefix) {
    const entries = (await readdir(directory, { withFileTypes: true })).sort((left, right) => compareUtf8(left.name, right.name))
    for (const entry of entries) {
      const path = resolve(directory, entry.name)
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isSymbolicLink()) throw new Error(`${relativePath} cannot be a symlink`)
      if (entry.isDirectory()) {
        directories.push(relativePath)
        await visit(path, relativePath)
      } else if (entry.isFile()) {
        if (PRIVATE_NAME.test(relativePath)) throw new Error(`${relativePath} has a secret-bearing file name`)
        const record = { path: relativePath, ...await hashFile(path, patterns, relativePath) }
        const object = /(?:^|\/)objects\/sha256\/([a-f0-9]{2})\/([a-f0-9]{64})$/.exec(relativePath)
        if (object && (object[2].slice(0, 2) !== object[1] || object[2] !== record.sha256)) throw new Error(`${relativePath} failed content-address verification`)
        files.push(record)
      } else throw new Error(`${relativePath} must be a regular file or directory`)
    }
  }
  await visit(root, '')
  return { directories, files }
}

function manifestWithoutDigest(applicationVersion, roots) {
  return { backup_schema_version: INFERENCE_BACKUP_VERSION, application: 'biochemical-inference', application_version: applicationVersion, roots }
}

function validateManifest(value) {
  if (!value || value.backup_schema_version !== INFERENCE_BACKUP_VERSION || value.application !== 'biochemical-inference' || !/^\d+\.\d+\.\d+$/.test(value.application_version) || !/^[a-f0-9]{64}$/.test(value.content_sha256)) throw new Error('inference backup manifest header is invalid')
  if (!Array.isArray(value.roots) || value.roots.length !== INFERENCE_STATE_ROOTS.length) throw new Error('inference backup root closure is invalid')
  for (let index = 0; index < INFERENCE_STATE_ROOTS.length; index += 1) {
    const root = value.roots[index]
    const expected = INFERENCE_STATE_ROOTS[index]
    if (root?.name !== expected.name || root?.kind !== expected.kind || root?.database !== expected.database || !Array.isArray(root.directories) || !Array.isArray(root.files)) throw new Error('inference backup root identity is invalid')
    if ([...root.directories].sort(compareUtf8).join('\0') !== root.directories.join('\0')) throw new Error(`directories are not sorted: ${root.name}`)
    if ([...root.files].sort((left, right) => compareUtf8(left.path, right.path)).map((item) => item.path).join('\0') !== root.files.map((item) => item.path).join('\0')) throw new Error(`files are not sorted: ${root.name}`)
    for (const path of root.directories) if (!path || path.startsWith('/') || path.split('/').includes('..')) throw new Error('inference backup contains an unsafe directory')
    for (const file of root.files) if (!file?.path || file.path.startsWith('/') || file.path.split('/').includes('..') || !Number.isSafeInteger(file.size) || file.size < 0 || !/^[a-f0-9]{64}$/.test(file.sha256)) throw new Error('inference backup contains an unsafe file')
  }
  const { content_sha256: expected, ...unsigned } = value
  if (digest(canonicalJson(unsigned)) !== expected) throw new Error('inference backup manifest checksum is invalid')
  return value
}

export const verifyInferenceStateManifest = (manifest) => validateManifest(manifest)

async function buildManifest(stateRoot, applicationVersion, patterns) {
  const roots = []
  for (const descriptor of INFERENCE_STATE_ROOTS) roots.push({ ...descriptor, ...await inventory(await exactDirectory(resolve(stateRoot, descriptor.name), descriptor.name), patterns) })
  const unsigned = manifestWithoutDigest(applicationVersion, roots)
  return { ...unsigned, content_sha256: digest(canonicalJson(unsigned)) }
}

export async function snapshotInferenceStateManifest({ stateRoot, applicationVersion, secretEnvPaths = [] }) {
  const selected = await exactDirectory(stateRoot, 'inference state snapshot root')
  return buildManifest(selected, applicationVersion, await secretPatterns(secretEnvPaths))
}

async function copyRoot(source, destination, root, patterns) {
  await mkdir(destination, { recursive: true, mode: 0o700 })
  await withDirectoryAnchor(source, `${root.name} copy source`, (sourceAnchor) => withDirectoryAnchor(destination, `${root.name} copy destination`, async (destinationAnchor) => {
    for (const directory of root.directories) await mkdir(resolve(destinationAnchor, directory), { recursive: true, mode: 0o700 })
    for (const file of root.files) {
      const target = resolve(destinationAnchor, file.path)
      await mkdir(dirname(target), { recursive: true, mode: 0o700 })
      await copyFile(resolve(sourceAnchor, file.path), target)
      await chmod(target, 0o600)
      await syncPath(target)
      const copied = await hashFile(target, patterns, file.path)
      if (copied.sha256 !== file.sha256 || copied.size !== file.size) throw new Error(`${root.name}/${file.path} changed during copy`)
    }
  }))
}

async function verifyRoot(path, root, patterns) {
  const actual = await inventory(path, patterns)
  if (canonicalJson(actual) !== canonicalJson({ directories: root.directories, files: root.files })) throw new Error(`${root.name} does not match its manifest`)
}

export async function createInferenceBackup({ stateRoot, destination, applicationVersion, secretEnvPaths = [], operationLock = null }) {
  const source = await exactDirectory(stateRoot, 'inference state root')
  await assertSafeLocalFilesystem(source, 'inference state root')
  const ownedLock = operationLock ?? await acquireInferenceBackupLock(source)
  await assertInferenceOperationLock(ownedLock, source, 'backup')
  const target = resolve(destination)
  try {
    await inspectNoSymlinkPath(target, 'inference backup destination', { allowMissing: true })
    if (inside(source, target) || inside(target, source)) throw new Error('inference backup destination and state root must not overlap')
    const patterns = await secretPatterns(secretEnvPaths)
    const manifest = await buildManifest(source, applicationVersion, patterns)
    await mkdir(dirname(target), { recursive: true, mode: 0o700 })
    await inspectNoSymlinkPath(dirname(target), 'inference backup destination parent')
    await assertSafeLocalFilesystem(dirname(target), 'inference backup destination parent')
    await mkdir(target, { mode: 0o700 })
    try {
      const roots = resolve(target, 'roots')
      await mkdir(roots, { mode: 0o700 })
      for (const root of manifest.roots) await copyRoot(resolve(source, root.name), resolve(roots, root.name), root, patterns)
      const manifestPath = resolve(target, 'manifest.json')
      await writeFile(manifestPath, canonicalJson(manifest), { flag: 'wx', mode: 0o600 })
      await syncPath(manifestPath)
      await syncTree(target)
      await syncPath(dirname(target))
      await verifyInferenceBackup({ backupRoot: target, secretEnvPaths })
    } catch (error) {
      await removeAnchored(target, rm, { recursive: true, force: true })
      throw error
    }
    return manifest
  } finally {
    if (!operationLock) await ownedLock.release()
  }
}

export async function verifyInferenceBackup({ backupRoot, secretEnvPaths = [] }) {
  const backup = await exactDirectory(backupRoot, 'inference backup root')
  const bytes = await readFile(resolve(backup, 'manifest.json'), 'utf8')
  const parsed = JSON.parse(bytes)
  if (canonicalJson(parsed) !== bytes) throw new Error('inference backup manifest is not canonical JSON')
  const manifest = validateManifest(parsed)
  const top = (await readdir(backup)).sort(compareUtf8)
  if (top.join('\0') !== ['manifest.json', 'roots'].join('\0')) throw new Error('inference backup contains unmanifested entries')
  const names = (await readdir(resolve(backup, 'roots'))).sort(compareUtf8)
  if (names.join('\0') !== INFERENCE_STATE_ROOTS.map((item) => item.name).sort(compareUtf8).join('\0')) throw new Error('inference backup root set is incomplete')
  const patterns = await secretPatterns(secretEnvPaths)
  for (const root of manifest.roots) await verifyRoot(await exactDirectory(resolve(backup, 'roots', root.name), root.name), root, patterns)
  return manifest
}

export async function verifyRestoredInferenceState({ stateRoot, manifest, secretEnvPaths = [] }) {
  const selected = await exactDirectory(stateRoot, 'restored inference state root')
  const verified = validateManifest(manifest)
  const names = (await readdir(selected)).sort(compareUtf8)
  if (names.join('\0') !== INFERENCE_STATE_ROOTS.map((item) => item.name).sort(compareUtf8).join('\0')) throw new Error('restored inference root set is incomplete')
  const patterns = await secretPatterns(secretEnvPaths)
  for (const root of verified.roots) await verifyRoot(await exactDirectory(resolve(selected, root.name), `${root.name} restored root`), root, patterns)
  return verified
}

export async function restoreInferenceBackup({ backupRoot, targetStateRoot, secretEnvPaths = [], verifiedManifest = null, beforePublish = null }) {
  const backup = await exactDirectory(backupRoot, 'inference backup root')
  const target = resolve(targetStateRoot)
  if (inside(backup, target) || inside(target, backup)) throw new Error('restore target and backup root must not overlap')
  const observedManifest = await verifyInferenceBackup({ backupRoot: backup, secretEnvPaths })
  if (verifiedManifest && canonicalJson(verifiedManifest) !== canonicalJson(observedManifest)) throw new Error('inference backup changed after independent verification')
  const manifest = verifiedManifest ?? observedManifest
  await inspectNoSymlinkPath(target, 'inference restore target', { allowMissing: true })
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await inspectNoSymlinkPath(dirname(target), 'inference restore target parent')
  await assertSafeLocalFilesystem(dirname(target), 'inference restore target parent')
  let targetMetadata = null
  try {
    const details = await lstat(target)
    if (!details.isDirectory() || details.isSymbolicLink() || (await readdir(target)).length !== 0) throw new Error('restore target must be absent or an empty real directory')
    targetMetadata = await lstat(target)
  } catch (error) { if (error?.code !== 'ENOENT') throw error }
  const stage = await mkdtemp(resolve(dirname(target), `.${target.split(sep).at(-1)}.restore-`))
  try {
    const patterns = await secretPatterns(secretEnvPaths)
    for (const root of manifest.roots) await copyRoot(resolve(backup, 'roots', root.name), resolve(stage, root.name), root, patterns)
    await verifyRestoredInferenceState({ stateRoot: stage, manifest, secretEnvPaths })
    await syncTree(stage)
    await publishDirectoryAnchored(stage, target, { metadata: targetMetadata, beforePublish })
  } catch (error) {
    await removeAnchored(stage, rm, { recursive: true, force: true })
    throw error
  }
  return manifest
}

export async function verifyInferenceStateIntegrity(stateRoot, { baselinePath = resolve(import.meta.dirname, '../../operations/schema-baseline.json') } = {}) {
  const root = await exactDirectory(stateRoot, 'inference state root')
  const baseline = JSON.parse(await readFile(baselinePath, 'utf8'))
  if (baseline.backup_layout !== INFERENCE_BACKUP_VERSION || baseline.persistent_roots.join('\0') !== INFERENCE_STATE_ROOTS.map((item) => item.name).join('\0')) throw new Error('inference schema baseline does not match the runtime root closure')
  let casObjects = 0
  let chunkObjects = 0
  let tables = 0
  let indexes = 0
  let triggers = 0
  let constraints = 0
  const schemas = []
  for (const descriptor of INFERENCE_STATE_ROOTS) {
    const selected = await exactDirectory(resolve(root, descriptor.name), `${descriptor.name} state root`)
    const contents = await inventory(selected, PRIVATE_BYTES)
    if (contents.files.some((file) => file.path.startsWith('staging/'))) throw new Error(`${descriptor.name} contains unfinished staging state`)
    const sqliteFiles = contents.files.filter((file) => file.path.endsWith('.sqlite3'))
    if (sqliteFiles.length !== 1 || sqliteFiles[0].path !== descriptor.database) throw new Error(`${descriptor.name} SQLite database closure is invalid`)
    const path = resolve(selected, descriptor.database)
    const database = new DatabaseSync(path, { readOnly: true })
    try {
      database.exec('PRAGMA foreign_keys = ON; PRAGMA query_only = ON;')
      const result = database.prepare('PRAGMA integrity_check').get()
      if (Object.values(result)[0] !== 'ok') throw new Error(`SQLite integrity failed: ${relative(root, path)}`)
      if (database.prepare('PRAGMA foreign_key_check').all().length) throw new Error(`SQLite foreign-key integrity failed: ${relative(root, path)}`)
      const expectedVersion = baseline.sqlite_user_versions[descriptor.name]
      if (database.prepare('PRAGMA user_version').get().user_version !== expectedVersion) throw new Error(`SQLite user_version failed: ${relative(root, path)}`)
      const schema = database.prepare("SELECT type, name, tbl_name AS table_name, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY type COLLATE BINARY, name COLLATE BINARY").all()
      tables += schema.filter((item) => item.type === 'table').length
      indexes += schema.filter((item) => item.type === 'index').length
      triggers += schema.filter((item) => item.type === 'trigger').length
      constraints += schema.filter((item) => item.type === 'table').reduce((total, item) => total + (item.sql?.match(/\b(?:CHECK|FOREIGN KEY|NOT NULL|PRIMARY KEY|UNIQUE)\b/g)?.length ?? 0), 0)
      schemas.push({ root: descriptor.name, objects: schema })
      const hasObjects = database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='objects'").get()
      const files = new Map(contents.files.flatMap((file) => {
        const match = /^objects\/sha256\/([a-f0-9]{2})\/([a-f0-9]{64})$/.exec(file.path)
        return match ? [[match[2], file]] : []
      }))
      casObjects += files.size
      if (descriptor.kind === 'sqlite-chunk-cache') chunkObjects += files.size
      if (descriptor.kind === 'sqlite-cas') {
        if (!hasObjects && files.size) throw new Error(`SQLite/CAS metadata is absent: ${descriptor.name}`)
        const rows = hasObjects ? database.prepare('SELECT digest, bytes FROM objects ORDER BY digest').all() : []
        const referenced = new Set()
        for (const row of rows) {
          const hash = row.digest.startsWith('sha256:') ? row.digest.slice(7) : row.digest
          const file = files.get(hash)
          if (!file || file.size !== row.bytes) throw new Error(`SQLite/CAS closure failed: ${descriptor.name}/${row.digest}`)
          referenced.add(hash)
        }
        if (referenced.size !== files.size) throw new Error(`SQLite/CAS contains unreferenced objects: ${descriptor.name}`)
      }
      if (descriptor.kind === 'sqlite-chunk-cache') {
        const expected = new Set()
        const hasSnapshot = database.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='snapshot'").get()
        if (!hasSnapshot) throw new Error(`chunk-cache snapshot metadata is absent: ${descriptor.name}`)
        const snapshot = database.prepare("SELECT bundle_digest, bundle_bytes FROM snapshot WHERE singleton = 1").get()
        if (snapshot) {
          const bundle = files.get(snapshot.bundle_digest)
          if (!bundle || bundle.size !== snapshot.bundle_bytes) throw new Error(`chunk-cache snapshot bundle is absent: ${descriptor.name}`)
          expected.add(snapshot.bundle_digest)
          const value = JSON.parse(await readFile(resolve(selected, bundle.path), 'utf8'))
          const visit = (item) => {
            if (Array.isArray(item)) for (const child of item) visit(child)
            else if (item && typeof item === 'object') for (const [name, child] of Object.entries(item)) {
              if (name === 'encoded_sha256' && typeof child === 'string' && /^[a-f0-9]{64}$/.test(child)) expected.add(child)
              visit(child)
            }
          }
          visit(value)
        }
        if ([...expected].some((hash) => !files.has(hash)) || expected.size !== files.size) throw new Error(`chunk-cache reachability/no-extra closure failed: ${descriptor.name}`)
      }
    } finally { database.close() }
  }
  if (!tables) throw new Error('SQLite table closure is empty')
  const schemaClosure = digest(canonicalJson(schemas))
  const schemaCounts = { constraints, indexes, tables, triggers }
  for (const [field, value] of Object.entries(schemaCounts)) if (baseline.sqlite_schema?.[field] !== value) throw new Error(`SQLite schema ${field} closure differs from baseline: expected ${baseline.sqlite_schema?.[field]}, observed ${value}`)
  if (baseline.sqlite_schema?.sha256 !== schemaClosure) throw new Error(`SQLite schema/table/index/trigger/constraint closure differs from baseline: observed ${schemaClosure}`)
  return { cas_objects: casObjects, chunk_objects: chunkObjects, constraints, indexes, schema_closure_sha256: schemaClosure, sqlite_databases: INFERENCE_STATE_ROOTS.length, tables, triggers, status: 'valid' }
}
