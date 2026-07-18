#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { cp, lstat, mkdir, mkdtemp, open, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, relative, resolve, sep } from 'node:path'
import { canonicalJson } from '../shared/canonical-json.js'
import { inspectNoSymlinkPath } from '../server/operations/path-safety.js'
import { deploymentTreeDigest } from './operations/deployment-identity.js'

function flags(values) {
  const output = {}
  for (let index = 0; index < values.length; index += 2) {
    if (!values[index]?.startsWith('--') || values[index + 1] === undefined) throw new Error('arguments must use --name value pairs')
    output[values[index].slice(2)] = values[index + 1]
  }
  return output
}

function run(command, arguments_, options = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, { stdio: 'inherit', ...options })
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with ${code ?? signal}`)))
  })
}

async function git(repository, ...arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('git', ['-C', repository, ...arguments_], { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (value) => stdout.push(value))
    child.stderr.on('data', (value) => stderr.push(value))
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolvePromise(Buffer.concat(stdout).toString('utf8').trim()) : reject(new Error(Buffer.concat(stderr).toString('utf8').trim() || `git exited with ${code}`)))
  })
}

async function artifactDigest(roots) {
  const files = []
  async function visit(base, directory, prefix) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)))) {
      const path = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`built artifact cannot contain symlinks: ${relative(base, path)}`)
      if (entry.isDirectory()) await visit(base, path, prefix)
      else if (entry.isFile()) {
        const before = await lstat(path, { bigint: true })
        const bytes = await readFile(path)
        const after = await lstat(path, { bigint: true })
        if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new Error('built artifact changed while it was hashed')
        files.push({ path: `${prefix}/${relative(base, path).split(sep).join('/')}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
      } else throw new Error('built artifact contains a special file')
    }
  }
  for (const item of roots) await visit(item.root, item.root, item.name)
  return createHash('sha256').update(canonicalJson({ artifact_tree_schema_version: '1.0.0', files })).digest('hex')
}

const selected = flags(process.argv.slice(2))
const kind = selected.kind
const commit = selected.commit
const output = resolve(selected.output)
if (!['database', 'inference'].includes(kind) || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('deployment archive requires --kind database|inference and an exact --commit')
await mkdir(dirname(output), { recursive: true, mode: 0o700 })
await inspectNoSymlinkPath(dirname(output), 'deployment archive output parent')
const outputState = await inspectNoSymlinkPath(output, 'deployment archive output', { allowMissing: true, type: 'file' })
if (outputState.exists) throw new Error('deployment archive output must not exist')
const ownerPath = `${output}.owner.json`
const ownerState = await inspectNoSymlinkPath(ownerPath, 'deployment archive owner marker', { allowMissing: true, type: 'file' })
if (ownerState.exists) throw new Error('deployment archive owner marker must not exist')
const owner = { output_schema_version: 'biochemical-deployment-output-v1', owner: 'biochemical-inference', token: randomUUID() }
await writeFile(ownerPath, canonicalJson(owner), { flag: 'wx', mode: 0o600 })
let outputHandle
try { outputHandle = await open(output, 'wx', 0o600) } catch (error) {
  if (await readFile(ownerPath, 'utf8').catch(() => null) === canonicalJson(owner)) await rm(ownerPath)
  throw error
}
const outputIdentity = await outputHandle.stat({ bigint: true })
let stage
try {
  stage = await mkdtemp(resolve(tmpdir(), 'biochemical-deployment-'))
  const repositoryName = kind === 'database' ? 'biochemical-db' : 'biochemical-inference'
  const repository = resolve(stage, repositoryName)
  await mkdir(repository, { recursive: true, mode: 0o700 })
  let sourceRepository
  let sourceArtifacts
  if (kind === 'database') {
    const serviceRoot = (await inspectNoSymlinkPath(selected['service-root'], 'database service root')).path
    sourceRepository = resolve(serviceRoot, '..')
    sourceArtifacts = [{ name: 'dist/src', root: resolve(serviceRoot, 'dist', 'src') }]
    const service = resolve(repository, 'service-js')
    await mkdir(service, { mode: 0o700 })
    await cp(resolve(serviceRoot, 'dist', 'src'), resolve(service, 'src'), { recursive: true, errorOnExist: true, force: false })
    await cp(resolve(serviceRoot, 'node_modules'), resolve(service, 'node_modules'), { recursive: true, errorOnExist: true, force: false })
    await Promise.all(['.cache', '.vite'].map((name) => rm(resolve(service, 'node_modules', name), { recursive: true, force: true })))
    await writeFile(resolve(service, 'package.json'), `${JSON.stringify({ name: '@biochemical-db/deployment', private: true, type: 'module', engines: { node: '>=22 <23' }, scripts: { start: 'node src/http/server.js' } }, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  } else {
    const sourceRoot = (await inspectNoSymlinkPath(selected['source-root'], 'inference source root')).path
    sourceRepository = sourceRoot
    sourceArtifacts = [{ name: 'dist', root: resolve(sourceRoot, 'dist') }, { name: 'server-dist', root: resolve(sourceRoot, 'server-dist') }]
    await cp(resolve(sourceRoot, 'dist'), resolve(repository, 'dist'), { recursive: true, errorOnExist: true, force: false })
    await cp(resolve(sourceRoot, 'server-dist'), resolve(repository, 'server-dist'), { recursive: true, errorOnExist: true, force: false })
    await cp(resolve(sourceRoot, 'node_modules'), resolve(repository, 'node_modules'), { recursive: true, errorOnExist: true, force: false })
    await Promise.all(['.cache', '.vite'].map((name) => rm(resolve(repository, 'node_modules', name), { recursive: true, force: true })))
    await writeFile(resolve(repository, 'package.json'), `${JSON.stringify({ name: 'biochemical-inference-deployment', private: true, type: 'module', engines: { node: '>=22 <23' }, scripts: { start: 'node server-dist/server/index.js' } }, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  }
  const [actualCommit, status, sourceArtifactSha256] = await Promise.all([
    git(sourceRepository, 'rev-parse', 'HEAD^{commit}'),
    git(sourceRepository, 'status', '--porcelain', '--untracked-files=all'),
    artifactDigest(sourceArtifacts)
  ])
  if (actualCommit !== commit || status) throw new Error('deployment archive requires the actual clean git commit and tree')
  const stagedArtifacts = kind === 'database'
    ? [{ name: 'dist/src', root: resolve(repository, 'service-js', 'src') }]
    : [{ name: 'dist', root: resolve(repository, 'dist') }, { name: 'server-dist', root: resolve(repository, 'server-dist') }]
  if (await artifactDigest(stagedArtifacts) !== sourceArtifactSha256) throw new Error('deployment archive built artifact digest changed during staging')
  const artifactSha256 = await deploymentTreeDigest(repository, repositoryName)
  const manifest = { deployment_archive_schema_version: 'biochemical-deployment-archive-v1', repository: repositoryName, commit, artifact_sha256: artifactSha256, entrypoint: kind === 'database' ? 'service-js/src/http/server.js' : 'server-dist/server/index.js' }
  await writeFile(resolve(repository, '.biochemical-deployment.json'), canonicalJson(manifest), { flag: 'wx', mode: 0o600 })
  await run('tar', ['--sort=name', '--mtime=UTC 1970-01-01', '--owner=0', '--group=0', '--numeric-owner', '--format=posix', '--pax-option=delete=atime,delete=ctime', '-cf', '/proc/self/fd/3', '-C', stage, repositoryName], { stdio: ['inherit', 'inherit', 'inherit', outputHandle.fd] })
  await outputHandle.sync()
  await outputHandle.close()
  const published = await lstat(output, { bigint: true })
  if (published.dev !== outputIdentity.dev || published.ino !== outputIdentity.ino) throw new Error('deployment archive output ownership changed during publication')
  const bytes = await readFile(output)
  process.stdout.write(`${JSON.stringify({ artifact_sha256: artifactSha256, bytes: bytes.length, commit, repository: repositoryName, sha256: createHash('sha256').update(bytes).digest('hex') })}\n`)
} catch (error) {
  await outputHandle.close().catch(() => undefined)
  const current = await lstat(output, { bigint: true }).catch(() => null)
  if (current && current.dev === outputIdentity.dev && current.ino === outputIdentity.ino) await rm(output)
  const marker = await readFile(ownerPath, 'utf8').catch(() => null)
  if (marker === canonicalJson(owner)) await rm(ownerPath)
  throw error
} finally {
  if (stage) await rm(stage, { recursive: true, force: true })
}
