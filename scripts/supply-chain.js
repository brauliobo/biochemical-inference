#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rename, rmdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalJson } from '../shared/canonical-json.js'
import { inspectNoSymlinkPath, syncPath } from '../server/operations/path-safety.js'

const root = resolve(import.meta.dirname, '..')
const EXCLUDED = new Set(['.git', '.supply-chain', 'coverage', 'dist', 'node_modules', 'playwright-report', 'server-dist', 'test-results'])
const OUTPUT_FILES = Object.freeze(['.biochemical-supply-chain-output.json', 'SHA256SUMS', 'checksums.json', 'provenance.json', 'sbom.cdx.json'])
const OUTPUT_MARKER = Object.freeze({ output_schema_version: 'biochemical-supply-chain-output-v1', owner: 'biochemical-inference' })
const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right))
const digest = (value) => createHash('sha256').update(value).digest('hex')

async function sourceFiles() {
  const output = []
  async function visit(path) {
    const details = await lstat(path)
    if (details.isSymbolicLink()) throw new Error(`supply-chain scope cannot contain symlinks: ${relative(root, path)}`)
    if (details.isFile()) { output.push(relative(root, path).split(sep).join('/')); return }
    if (!details.isDirectory()) throw new Error(`supply-chain scope contains a non-regular entry: ${relative(root, path)}`)
    for (const entry of (await readdir(path)).sort(compareUtf8)) {
      if (!EXCLUDED.has(entry)) await visit(resolve(path, entry))
    }
  }
  for (const path of ['.github/workflows', 'README.md', 'docs/OPERATIONS.md', 'operations', 'package-lock.json', 'package.json', 'playwright.config.js', 'scripts', 'server', 'shared', 'src', 'vite.config.js']) {
    try { await visit(resolve(root, path)) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  }
  return output.sort(compareUtf8)
}

async function checksums() {
  const files = []
  for (const path of await sourceFiles()) {
    const bytes = await readFile(resolve(root, path))
    files.push({ path, bytes: bytes.length, sha256: digest(bytes) })
  }
  return { checksum_manifest_schema_version: '1.0.0', algorithm: 'SHA-256', files }
}

function purl(name, version) {
  const selected = name.startsWith('@') ? `${encodeURIComponent(name.split('/')[0])}/${encodeURIComponent(name.split('/')[1])}` : encodeURIComponent(name)
  return `pkg:npm/${selected}@${encodeURIComponent(version)}`
}

const licenseName = (value) => typeof value === 'string' && value ? [{ license: { name: value } }] : undefined

export async function buildSbom() {
  const lock = JSON.parse(await readFile(resolve(root, 'package-lock.json'), 'utf8'))
  const packageValue = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  const components = []
  for (const [path, value] of Object.entries(lock.packages ?? {})) {
    if (!path || !value?.version) continue
    const name = value.name ?? path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length)
    if (!name) continue
    const component = { type: 'library', 'bom-ref': purl(name, value.version), name, version: value.version, purl: purl(name, value.version) }
    if (licenseName(value.license)) component.licenses = licenseName(value.license)
    if (typeof value.integrity === 'string') component.properties = [{ name: 'npm:integrity', value: value.integrity }]
    components.push(component)
  }
  components.sort((left, right) => compareUtf8(left.purl, right.purl))
  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    version: 1,
    metadata: { component: { type: 'application', 'bom-ref': purl(packageValue.name, packageValue.version), name: packageValue.name, version: packageValue.version, purl: purl(packageValue.name, packageValue.version), licenses: [{ license: { id: 'MIT' } }] }, tools: { components: [{ type: 'application', name: 'biochemical-supply-chain', version: '1.0.0', licenses: [{ license: { id: 'MIT' } }] }] } },
    components
  }
}

function validateContext(value) {
  if (value?.provenance_context_schema_version !== 'biochemical-build-context-v1' || !Array.isArray(value.repositories) || value.repositories.length !== 2 || !Array.isArray(value.artifacts) || !value.artifacts.length || !Array.isArray(value.workflows) || value.workflows.length !== 2 || !value.environment) throw new Error('provenance context closure is invalid')
  if (new Set(value.repositories.map((item) => item.name)).size !== 2 || value.repositories.some((item) => typeof item.name !== 'string' || typeof item.repository !== 'string' || !/^[a-f0-9]{40}$/.test(item.commit))) throw new Error('provenance context repository commits are invalid')
  for (const item of [...value.artifacts, ...value.workflows]) if (typeof item.path !== 'string' || item.path.startsWith('/') || item.path.split('/').includes('..') || !/^[a-f0-9]{64}$/.test(item.sha256)) throw new Error('provenance context artifact identity is invalid')
  if (value.artifacts.some((item) => !Number.isSafeInteger(item.bytes) || item.bytes < 0)) throw new Error('provenance context artifact byte count is invalid')
  if (value.repositories.map((item) => item.name).sort(compareUtf8).join('\0') !== ['biochemical-db', 'biochemical-inference'].join('\0') || value.workflows.map((item) => item.repository).sort(compareUtf8).join('\0') !== ['biochemical-db', 'biochemical-inference'].join('\0')) throw new Error('provenance context does not bind both repositories and workflows')
  const artifacts = new Set(value.artifacts.map((item) => item.path))
  if (!['biochemical-db/service-js/dist', 'biochemical-inference/dist', 'biochemical-inference/server-dist'].every((path) => artifacts.has(path))) throw new Error('provenance context built-artifact closure is incomplete')
  if (['architecture', 'node', 'npm', 'platform', 'runner_image', 'workflow_ref', 'workflow_sha'].some((name) => typeof value.environment[name] !== 'string' || !value.environment[name])) throw new Error('provenance context observed environment is incomplete')
  return value
}

async function readContext(path) {
  if (!path) throw new Error('signed provenance generation requires --context with both repositories, artifacts, workflows, and observed environment')
  await inspectNoSymlinkPath(path, 'provenance context', { type: 'file' })
  const bytes = await readFile(path, 'utf8')
  const value = validateContext(JSON.parse(bytes))
  if (canonicalJson(value) !== bytes) throw new Error('provenance context is not canonical JSON')
  return value
}

async function provenance(checksumManifest, context) {
  const packageValue = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  return {
    _type: 'https://in-toto.io/Statement/v1',
    subject: [
      { name: `${packageValue.name}-source`, digest: { sha256: digest(canonicalJson(checksumManifest)) } },
      ...context.artifacts.map((item) => ({ name: item.path, digest: { sha256: item.sha256 } }))
    ],
    predicateType: 'https://slsa.dev/provenance/v1',
    predicate: {
      buildDefinition: {
        buildType: 'https://github.com/biochemical-inference/operations/npm-ci-node22-v1',
        externalParameters: { install: 'npm ci --ignore-scripts=false', package: packageValue.name, version: packageValue.version, observed_environment: context.environment, workflows: context.workflows },
        internalParameters: { deterministic: true, network_required_for_generation: false, provenance_context_sha256: digest(canonicalJson(context)) },
        resolvedDependencies: [
          ...context.repositories.map((item) => ({ uri: `git+${item.repository}@${item.commit}`, digest: { sha1: item.commit } })),
          { uri: 'file:package.json', digest: { sha256: digest(await readFile(resolve(root, 'package.json'))) } },
          { uri: 'file:package-lock.json', digest: { sha256: digest(await readFile(resolve(root, 'package-lock.json'))) } }
        ]
      },
      runDetails: { builder: { id: 'https://github.com/biochemical-inference/operations' }, metadata: { invocationId: digest(canonicalJson(checksumManifest)) } }
    }
  }
}

async function removeOwnedOutput(target) {
  const selected = await inspectNoSymlinkPath(target, 'supply-chain output')
  const markerPath = resolve(selected.path, OUTPUT_FILES[0])
  const marker = await readCanonical(markerPath, 'supply-chain output owner marker')
  if (canonicalJson(marker) !== canonicalJson(OUTPUT_MARKER)) throw new Error('refusing to delete a supply-chain output not owned by this repository')
  const entries = await readdir(selected.path, { withFileTypes: true })
  for (const entry of entries) {
    if (!OUTPUT_FILES.includes(entry.name) || !entry.isFile() || entry.isSymbolicLink()) throw new Error('refusing to delete a supply-chain output containing unowned entries')
  }
  for (const entry of entries) await unlink(resolve(selected.path, entry.name))
  await rmdir(selected.path)
  await syncPath(dirname(selected.path))
}

async function createOwnedOutput(target) {
  const inspected = await inspectNoSymlinkPath(target, 'supply-chain output', { allowMissing: true })
  await inspectNoSymlinkPath(dirname(inspected.path), 'supply-chain output parent')
  if (inspected.exists) await removeOwnedOutput(inspected.path)
  const stage = `${inspected.path}.stage-${process.pid}`
  await inspectNoSymlinkPath(stage, 'supply-chain output stage', { allowMissing: true })
  await mkdir(stage, { mode: 0o700 })
  const markerPath = resolve(stage, OUTPUT_FILES[0])
  await writeFile(markerPath, canonicalJson(OUTPUT_MARKER), { flag: 'wx', mode: 0o600 })
  await syncPath(markerPath)
  return { stage, target: inspected.path }
}

async function readCanonical(path, label) {
  const bytes = await readFile(path, 'utf8')
  const value = JSON.parse(bytes)
  if (canonicalJson(value) !== bytes) throw new Error(`${label} is not canonical JSON`)
  return value
}

async function generate(output, contextPath) {
  const context = await readContext(contextPath)
  const target = resolve(output)
  const checksumManifest = await checksums()
  const values = { 'checksums.json': checksumManifest, 'provenance.json': await provenance(checksumManifest, context), 'sbom.cdx.json': await buildSbom() }
  const owned = await createOwnedOutput(target)
  try {
    for (const [name, value] of Object.entries(values)) await writeFile(resolve(owned.stage, name), canonicalJson(value), { flag: 'wx', mode: 0o600 })
    const checksummed = { ...values, [OUTPUT_FILES[0]]: OUTPUT_MARKER }
    await writeFile(resolve(owned.stage, 'SHA256SUMS'), `${Object.keys(checksummed).sort(compareUtf8).map((name) => `${digest(canonicalJson(checksummed[name]))}  ${name}`).join('\n')}\n`, { flag: 'wx', mode: 0o600 })
    for (const name of OUTPUT_FILES) await syncPath(resolve(owned.stage, name))
    await syncPath(owned.stage)
    await rename(owned.stage, owned.target)
    await syncPath(dirname(owned.target))
  } catch (error) {
    await removeOwnedOutput(owned.stage).catch(() => undefined)
    throw error
  }
  return { components: values['sbom.cdx.json'].components.length, output: target, source_files: checksumManifest.files.length }
}

async function verify(output, contextPath) {
  const context = await readContext(contextPath)
  const target = resolve(output)
  await inspectNoSymlinkPath(target, 'supply-chain output')
  const entries = (await readdir(target, { withFileTypes: true })).sort((left, right) => compareUtf8(left.name, right.name))
  if (entries.map((entry) => entry.name).join('\0') !== [...OUTPUT_FILES].sort(compareUtf8).join('\0') || entries.some((entry) => !entry.isFile() || entry.isSymbolicLink())) throw new Error('supply-chain output file closure is invalid')
  const marker = await readCanonical(resolve(target, OUTPUT_FILES[0]), 'supply-chain output owner marker')
  if (canonicalJson(marker) !== canonicalJson(OUTPUT_MARKER)) throw new Error('supply-chain output owner marker is invalid')
  const checksumManifest = await checksums()
  const values = { 'checksums.json': checksumManifest, 'provenance.json': await provenance(checksumManifest, context), 'sbom.cdx.json': await buildSbom() }
  for (const [name, expected] of Object.entries(values)) if (canonicalJson(await readCanonical(resolve(target, name), name)) !== canonicalJson(expected)) throw new Error(`${name} failed offline regeneration`)
  const checksummed = { ...values, [OUTPUT_FILES[0]]: OUTPUT_MARKER }
  const expectedSums = `${Object.keys(checksummed).sort(compareUtf8).map((name) => `${digest(canonicalJson(checksummed[name]))}  ${name}`).join('\n')}\n`
  if (await readFile(resolve(target, 'SHA256SUMS'), 'utf8') !== expectedSums) throw new Error('SHA256SUMS does not match generated attestations')
  return { components: values['sbom.cdx.json'].components.length, source_files: checksumManifest.files.length, status: 'verified' }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [command, output = resolve(root, '.supply-chain'), contextFlag, contextValue] = process.argv.slice(2)
  if (contextFlag !== '--context' || !contextValue) throw new Error('usage: supply-chain.js generate|verify [output-directory] --context PROVENANCE_CONTEXT.json')
  const result = command === 'generate' ? await generate(output, contextValue) : command === 'verify' ? await verify(output, contextValue) : null
  if (!result) throw new Error('usage: supply-chain.js generate|verify [output-directory] --context PROVENANCE_CONTEXT.json')
  process.stdout.write(`${JSON.stringify(result)}\n`)
}
