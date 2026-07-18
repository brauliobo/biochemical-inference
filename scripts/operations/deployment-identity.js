import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, readlink } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'

const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))

function inside(parent, child) {
  const selected = relative(parent, child)
  return selected === '' || (selected !== '..' && !selected.startsWith(`..${sep}`) && !isAbsolute(selected))
}

export function deploymentClosure(root, repository) {
  if (repository === 'biochemical-db') return [
    { name: 'service-js/package.json', path: resolve(root, 'service-js', 'package.json') },
    { name: 'service-js/src', path: resolve(root, 'service-js', 'src') },
    { name: 'service-js/node_modules', path: resolve(root, 'service-js', 'node_modules') }
  ]
  if (repository === 'biochemical-inference') return [
    { name: 'package.json', path: resolve(root, 'package.json') },
    { name: 'dist', path: resolve(root, 'dist') },
    { name: 'server-dist', path: resolve(root, 'server-dist') },
    { name: 'node_modules', path: resolve(root, 'node_modules') }
  ]
  throw new Error(`unsupported deployment repository: ${repository}`)
}

export async function deploymentTreeDigest(root, repository) {
  const entries = []
  const selectedClosure = deploymentClosure(root, repository)
  const covered = selectedClosure.map((item) => resolve(item.path))
  async function visit(path, name) {
    const before = await lstat(path, { bigint: true })
    const mode = Number(before.mode & 0o777n)
    if (before.isSymbolicLink()) {
      const target = await readlink(path)
      const targetPath = resolve(dirname(path), target)
      if (isAbsolute(target) || !inside(root, targetPath) || !covered.some((coveredPath) => inside(coveredPath, targetPath))) throw new Error(`deployment symlink escapes its runnable closure: ${name}`)
      const after = await lstat(path, { bigint: true })
      if (before.dev !== after.dev || before.ino !== after.ino || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new Error(`deployment symlink changed while it was verified: ${name}`)
      entries.push({ path: name, type: 'symlink', mode, target })
      return
    }
    if (before.isDirectory()) {
      entries.push({ path: name, type: 'directory', mode })
      for (const entry of (await readdir(path, { withFileTypes: true })).sort((left, right) => compareUtf8(left.name, right.name))) await visit(resolve(path, entry.name), `${name}/${entry.name}`)
      const after = await lstat(path, { bigint: true })
      if (before.dev !== after.dev || before.ino !== after.ino || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new Error(`deployment directory changed while it was verified: ${name}`)
      return
    }
    if (!before.isFile()) throw new Error(`deployment closure contains a special file: ${name}`)
    const bytes = await readFile(path)
    const after = await lstat(path, { bigint: true })
    if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs) throw new Error(`deployment file changed while it was verified: ${name}`)
    entries.push({ path: name, type: 'file', mode, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') })
  }
  for (const item of selectedClosure) await visit(item.path, item.name)
  entries.sort((left, right) => compareUtf8(left.path, right.path))
  return createHash('sha256').update(canonicalJson({ artifact_tree_schema_version: 'biochemical-runnable-tree-v2', entries })).digest('hex')
}

export async function verifyDeploymentTree(root, repository, marker) {
  const expectedEntrypoint = repository === 'biochemical-db' ? 'service-js/src/http/server.js' : 'server-dist/server/index.js'
  if (marker.entrypoint !== expectedEntrypoint) throw new Error('deployment marker entrypoint is invalid')
  const packagePath = repository === 'biochemical-db' ? resolve(root, 'service-js', 'package.json') : resolve(root, 'package.json')
  const packageValue = JSON.parse(await readFile(packagePath, 'utf8'))
  const expectedPackage = repository === 'biochemical-db'
    ? { name: '@biochemical-db/deployment', private: true, type: 'module', engines: { node: '>=22 <23' }, scripts: { start: 'node src/http/server.js' } }
    : { name: 'biochemical-inference-deployment', private: true, type: 'module', engines: { node: '>=22 <23' }, scripts: { start: 'node server-dist/server/index.js' } }
  if (canonicalJson(packageValue) !== canonicalJson(expectedPackage)) throw new Error('deployment package does not bind the exact entrypoint')
  const artifactSha256 = await deploymentTreeDigest(root, repository)
  if (artifactSha256 !== marker.artifact_sha256) throw new Error('runnable deployment tree does not match its marker')
  return artifactSha256
}
