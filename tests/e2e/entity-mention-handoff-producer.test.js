import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, expect, it } from 'vitest'

const execute = promisify(execFile)
const producerRoot = resolve(process.cwd(), '..', 'biochemical-db', 'service-js')
const fixtureRoot = resolve(process.cwd(), 'tests', 'fixtures', 'entity-mention-handoff-producer')
const roots = []

afterAll(async () => Promise.all(roots.map((root) => rm(root, { recursive: true, force: true }))))

const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex')

async function treeFiles(root) {
  const output = []
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (entry.isFile()) output.push(relative(root, path))
      else throw new Error(`Golden tree contains a non-regular entry: ${relative(root, path)}`)
    }
  }
  await walk(root)
  return output.sort()
}

async function treeIdentity(root) {
  const files = await treeFiles(root)
  const digest = createHash('sha256')
  for (const path of files) digest.update(path).update('\0').update(sha256(await readFile(resolve(root, path)))).update('\n')
  return { files, sha256: digest.digest('hex') }
}

async function authoritativeSourcePaths() {
  const domain = 'src/domains/nutrient-reaction-atlas'
  const domainFiles = (await readdir(resolve(producerRoot, domain))).filter((name) => name.endsWith('.js')).map((name) => `${domain}/${name}`)
  return [
    'package-lock.json',
    'package.json',
    'scripts/nutrient-reaction-pages-build.js',
    'scripts/nutrient-reaction-simulation-handoff.js',
    'src/artifacts/source-node.js',
    'src/artifacts/source.js',
    'src/domains/factory/safeio-node.js',
    'src/foundation/bounded-json.js',
    'src/foundation/bytes.js',
    'src/foundation/canonical.js',
    'src/foundation/errors.js',
    'src/foundation/json-parser.js',
    ...domainFiles
  ].sort()
}

it('certifies static bytes and the authoritative blocked handoff outcome', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'entity-mention-producer-e2e-'))
  roots.push(root)
  const releaseRoot = resolve(root, 'release')
  const handoffPath = resolve(root, 'handoff.json')
  const archivePath = resolve(root, 'release.tar.gz')
  const inputInventoryPath = resolve(root, 'input-inventory.json')
  const storeRoot = resolve(root, 'store')
  const goldenParent = resolve(root, 'golden-fixture')
  const goldenRoot = resolve(goldenParent, 'release')
  const provenance = JSON.parse(await readFile(resolve(fixtureRoot, 'provenance.json'), 'utf8'))

  expect(provenance.schema).toBe('entity-mention-handoff-golden-provenance/v1')
  expect(provenance.generator.tool_version_policy).toEqual({
    recorded_versions: 'informational reproduction context only',
    required_compatibility: 'package engines: Node >=22 <23',
    authority: 'golden static output bytes, complete producer source_files, and actual-build input_files inventory'
  })
  expect(Object.keys(provenance.producer).sort()).toEqual(['input_files', 'package', 'package_version', 'repository', 'service', 'source_files', 'source_parent_commit', 'source_state_policy'])
  expect(provenance.producer.source_parent_commit).toMatch(/^[a-f0-9]{40}$/)
  expect(provenance.producer.source_state_policy).toEqual({
    identity: 'The complete source_files path/hash map is authoritative for generator code; source_parent_commit is only its committed ancestry anchor.',
    local_validation: 'A local producer may be dirty or contain uncommitted files, but every authoritative source path must exist with the recorded hash before regeneration.',
    certification_ref: 'Certification requires a clean immutable 40-hex producer commit equal to or descended from source_parent_commit and containing every authoritative source path at its recorded hash.',
    current_status: 'blocked by conditional source rights without a reviewed immutable simulation-handoff rights disposition'
  })
  expect(Object.keys(provenance.producer.source_files).sort()).toEqual(await authoritativeSourcePaths())
  const producerCommit = (await execute('git', ['rev-parse', 'HEAD'], { cwd: resolve(producerRoot, '..') })).stdout.trim()
  await execute('git', ['merge-base', '--is-ancestor', provenance.producer.source_parent_commit, producerCommit], { cwd: resolve(producerRoot, '..') })
  if (process.env.CI) {
    const certificationRef = process.env.BIOCHEMICAL_DB_CERTIFICATION_REF
    expect(certificationRef).toMatch(/^[a-f0-9]{40}$/)
    expect(producerCommit).toBe(certificationRef)
    expect((await execute('git', ['status', '--porcelain'], { cwd: resolve(producerRoot, '..') })).stdout).toBe('')
  }
  for (const [path, digest] of Object.entries(provenance.producer.source_files)) expect(sha256(await readFile(resolve(producerRoot, path))), path).toBe(digest)
  expect(sha256(await readFile(resolve(fixtureRoot, 'release.tar.gz')))).toBe(provenance.golden.release_archive_sha256)

  const buildCommand = provenance.generator.build_command.map((value) => value === '$RELEASE_OUTPUT' ? releaseRoot : value === '$INPUT_INVENTORY_OUTPUT' ? inputInventoryPath : value)
  const archiveCommand = provenance.generator.archive_command.map((value) => value === '$RELEASE_OUTPUT' ? releaseRoot : value === '$ARCHIVE_OUTPUT' ? archivePath : value)
  const handoffCommand = provenance.generator.handoff_command.map((value) => value === '$RELEASE_OUTPUT' ? releaseRoot : value === '$HANDOFF_OUTPUT' ? handoffPath : value)
  await execute(buildCommand[0], buildCommand.slice(1), { cwd: producerRoot, maxBuffer: 16 * 1024 * 1024 })
  await execute(archiveCommand[0], archiveCommand.slice(1), { cwd: producerRoot, maxBuffer: 16 * 1024 * 1024 })
  const generatedInventory = JSON.parse(await readFile(inputInventoryPath, 'utf8'))
  expect(generatedInventory).toEqual({ schema: 'nutrient-reaction-pages-build-input-inventory/v1', files: provenance.producer.input_files })
  for (const [path, digest] of Object.entries(provenance.producer.input_files)) expect(sha256(await readFile(resolve(producerRoot, '..', path))), path).toBe(digest)
  await expect(execute(handoffCommand[0], handoffCommand.slice(1), { cwd: producerRoot, maxBuffer: 16 * 1024 * 1024 })).rejects.toMatchObject({ stderr: expect.stringMatching(/external legal blocker.*conditional rights/i) })
  await expect(readFile(handoffPath)).rejects.toMatchObject({ code: 'ENOENT' })
  expect(await readFile(archivePath)).toEqual(await readFile(resolve(fixtureRoot, 'release.tar.gz')))

  await mkdir(goldenParent)
  await execute('tar', ['-xzf', resolve(fixtureRoot, 'release.tar.gz'), '-C', goldenParent])
  const generatedIdentity = await treeIdentity(releaseRoot)
  const goldenIdentity = await treeIdentity(goldenRoot)
  expect({ files: generatedIdentity.files.length, sha256: generatedIdentity.sha256 }).toEqual({ files: provenance.golden.release_tree.files, sha256: provenance.golden.release_tree.sha256 })
  expect(goldenIdentity).toEqual(generatedIdentity)
  for (const path of generatedIdentity.files) expect(await readFile(resolve(releaseRoot, path)), path).toEqual(await readFile(resolve(goldenRoot, path)))
  const rejectedHandoffPath = resolve(fixtureRoot, 'rejected-unauthorized-handoff.json')
  expect(sha256(await readFile(rejectedHandoffPath))).toBe(provenance.golden.rejected_historical_handoff.sha256)
  await expect(execute('node', ['scripts/entity-mention-handoff.js', 'import', '--release', releaseRoot, '--handoff', rejectedHandoffPath, '--store', storeRoot], { cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024 })).rejects.toMatchObject({ stderr: expect.stringMatching(/canonical byte|release binding|External legal blocker/i) })
  await expect(readFile(storeRoot)).rejects.toMatchObject({ code: 'ENOENT' })
}, 120_000)
