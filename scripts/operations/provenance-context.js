#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { relative, resolve, sep } from 'node:path'
import { canonicalJson } from '../../shared/canonical-json.js'
import { inspectNoSymlinkPath, syncPath } from '../../server/operations/path-safety.js'

const execute = promisify(execFile)
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))
const sha256 = (value) => createHash('sha256').update(value).digest('hex')

function flags(values) {
  const output = {}
  for (let index = 0; index < values.length; index += 2) {
    if (!values[index]?.startsWith('--') || values[index + 1] === undefined) throw new Error('arguments must use --name value pairs')
    output[values[index].slice(2)] = values[index + 1]
  }
  return output
}

async function git(repository, ...arguments_) {
  return (await execute('git', ['-C', repository, ...arguments_], { encoding: 'utf8' })).stdout.trim()
}

async function repositoryIdentity(repository, name, expectedCommit, fixture) {
  if (fixture) {
    const selected = fixture.repositories?.find((item) => item.name === name)
    if (!selected || !/^[a-f0-9]{40}$/.test(selected.commit) || typeof selected.repository !== 'string' || !selected.repository) throw new Error(`explicit ${name} fixture identity is invalid`)
    return selected
  }
  const [commit, remote, status] = await Promise.all([
    git(repository, 'rev-parse', 'HEAD^{commit}'),
    git(repository, 'remote', 'get-url', 'origin'),
    git(repository, 'status', '--porcelain', '--untracked-files=all')
  ])
  if (status) throw new Error(`${name} provenance requires a clean exact commit`)
  if (process.env.CI && !expectedCommit) throw new Error(`${name} provenance requires an explicit expected commit in CI`)
  if (expectedCommit && (!/^[a-f0-9]{40}$/.test(expectedCommit) || commit !== expectedCommit)) throw new Error(`${name} checkout does not match its expected provenance commit`)
  return { name, repository: remote, commit }
}

async function treeArtifact(root, path, name) {
  const selected = (await inspectNoSymlinkPath(resolve(root, path), `${name} build artifact`)).path
  const files = []
  let bytes = 0
  async function visit(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((left, right) => compareUtf8(left.name, right.name))) {
      const child = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) throw new Error(`${name} build artifact cannot contain symlinks`)
      if (entry.isDirectory()) await visit(child)
      else if (entry.isFile()) {
        const before = await lstat(child, { bigint: true })
        const value = await readFile(child)
        const after = await lstat(child, { bigint: true })
        if (before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs || before.ctimeNs !== after.ctimeNs || before.size !== BigInt(value.length)) throw new Error(`${name} build artifact changed while it was hashed`)
        bytes += value.length
        files.push({ path: relative(selected, child).split(sep).join('/'), bytes: value.length, sha256: sha256(value) })
      } else throw new Error(`${name} build artifact cannot contain special files`)
    }
  }
  await visit(selected)
  return { path: name, bytes, sha256: sha256(canonicalJson({ artifact_tree_schema_version: '1.0.0', files })) }
}

async function workflow(repository, name) {
  const path = resolve(repository, '.github/workflows/operations.yml')
  await inspectNoSymlinkPath(path, `${name} operations workflow`, { type: 'file' })
  return { repository: name, path: `${name}/.github/workflows/operations.yml`, sha256: sha256(await readFile(path)) }
}

const [output, ...arguments_] = process.argv.slice(2)
if (!output) throw new Error('usage: provenance-context.js OUTPUT --inference-repo PATH --database-repo PATH')
const selected = flags(arguments_)
const inference = (await inspectNoSymlinkPath(selected['inference-repo'], 'inference repository')).path
const database = (await inspectNoSymlinkPath(selected['database-repo'], 'database repository')).path
const databaseService = resolve(database, 'service-js')
let fixture = null
if (selected['fixture-identity']) {
  if (process.env.NODE_ENV !== 'test') throw new Error('--fixture-identity is restricted to tests')
  fixture = JSON.parse(await readFile((await inspectNoSymlinkPath(selected['fixture-identity'], 'provenance fixture identity', { type: 'file' })).path, 'utf8'))
}
const [inferenceIdentity, databaseIdentity, npmVersion, artifacts, workflows] = await Promise.all([
  repositoryIdentity(inference, 'biochemical-inference', selected['inference-commit'], fixture),
  repositoryIdentity(database, 'biochemical-db', selected['database-commit'], fixture),
  execute('npm', ['--version'], { encoding: 'utf8' }).then((result) => result.stdout.trim()),
  Promise.all([
    treeArtifact(inference, 'dist', 'biochemical-inference/dist'),
    treeArtifact(inference, 'server-dist', 'biochemical-inference/server-dist'),
    treeArtifact(databaseService, 'dist', 'biochemical-db/service-js/dist')
  ]),
  Promise.all([workflow(inference, 'biochemical-inference'), workflow(database, 'biochemical-db')])
])
const context = {
  provenance_context_schema_version: 'biochemical-build-context-v1',
  repositories: [databaseIdentity, inferenceIdentity],
  artifacts: artifacts.sort((left, right) => compareUtf8(left.path, right.path)),
  workflows: workflows.sort((left, right) => compareUtf8(left.path, right.path)),
  environment: {
    architecture: process.arch,
    node: process.version,
    npm: npmVersion,
    platform: process.platform,
    runner_image: process.env.ImageOS && process.env.ImageVersion ? `${process.env.ImageOS}-${process.env.ImageVersion}` : 'local-unmanaged',
    workflow_ref: process.env.GITHUB_WORKFLOW_REF ?? 'local-unmanaged',
    workflow_sha: process.env.GITHUB_WORKFLOW_SHA ?? 'local-unmanaged'
  }
}
await inspectNoSymlinkPath(output, 'provenance context output', { allowMissing: true, type: 'file' })
await writeFile(resolve(output), canonicalJson(context), { flag: 'wx', mode: 0o600 })
await syncPath(resolve(output))
process.stdout.write(`${JSON.stringify({ artifacts: context.artifacts.length, repositories: context.repositories.length, status: 'created' })}\n`)
