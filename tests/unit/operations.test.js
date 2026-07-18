import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { DatabaseSync } from 'node:sqlite'
import { chmod, lstat, mkdtemp, mkdir, readFile, rm, symlink, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import { openChallengeDatabase } from '../../server/challenge/database.js'
import { openDataPlaneDatabase } from '../../server/data-plane/database.js'
import { openMeasuredDatabase } from '../../server/measured/database.js'
import { openMeasuredSpatialDatabase } from '../../server/measured-spatial/database.js'
import { createOperationalMetrics } from '../../server/operations/metrics.js'
import { settleReadinessChecks } from '../../server/app.js'
import { deploymentIdentity } from '../../scripts/operations.js'
import { deploymentTreeDigest } from '../../scripts/operations/deployment-identity.js'
import { openPhysiologyDatabase } from '../../server/physiology/database.js'
import { openRevalidationDatabase } from '../../server/revalidation/database.js'
import { acquireInferenceBackupLock, acquireInferenceRuntimeLock } from '../../server/operations/runtime-lock.js'
import { openSpatialRegistrationDatabase } from '../../server/spatial-registration/database.js'
import { openWorkspaceDatabase } from '../../server/workspace/database.js'
import { createInferenceBackup, INFERENCE_STATE_ROOTS, restoreInferenceBackup, verifyInferenceBackup, verifyInferenceStateIntegrity } from '../../scripts/operations/inference-state.js'

const execute = promisify(execFile)
const versions = { challenge: 2, 'data-plane': 2, measured: 2, 'measured-spatial': 1, physiology: 1, revalidation: 3, 'spatial-registration': 2, workspace: 1 }
let temporary
afterEach(async () => { vi.useRealTimers(); if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined })

async function populateInferenceState(state) {
  const openers = {
    challenge: openChallengeDatabase,
    'data-plane': openDataPlaneDatabase,
    measured: openMeasuredDatabase,
    'measured-spatial': openMeasuredSpatialDatabase,
    physiology: openPhysiologyDatabase,
    revalidation: openRevalidationDatabase,
    'spatial-registration': openSpatialRegistrationDatabase,
    workspace: openWorkspaceDatabase
  }
  for (const root of INFERENCE_STATE_ROOTS) {
    await mkdir(resolve(state, root.name), { recursive: true })
    openers[root.name](resolve(state, root.name)).close()
  }
}

async function fixture() {
  temporary = await mkdtemp(resolve(tmpdir(), 'inference-operations-'))
  const state = resolve(temporary, 'state')
  await mkdir(state)
  await populateInferenceState(state)
  const content = Buffer.from('verified chunk bytes')
  const digest = createHash('sha256').update(content).digest('hex')
  const bundle = Buffer.from(canonicalJson({ inventory: { chunks: [{ encoded_sha256: digest }] } }))
  const bundleDigest = createHash('sha256').update(bundle).digest('hex')
  for (const [hash, bytes] of [[digest, content], [bundleDigest, bundle]]) {
    const objectRoot = resolve(state, 'measured-spatial', 'objects', 'sha256', hash.slice(0, 2))
    await mkdir(objectRoot, { recursive: true })
    await writeFile(resolve(objectRoot, hash), bytes)
  }
  const measuredSpatial = new DatabaseSync(resolve(state, 'measured-spatial', 'goal14.sqlite3'))
  measuredSpatial.prepare('INSERT INTO snapshot VALUES (1,?,?,?,?,?,?,?,?,?,?,?)').run('fixture', '1'.repeat(64), '2'.repeat(64), '3'.repeat(64), '4'.repeat(64), '5'.repeat(64), '6'.repeat(64), '7'.repeat(64), bundleDigest, bundle.length, '2026-01-01T00:00:00.000Z')
  measuredSpatial.close()
  const databaseEnv = resolve(temporary, 'database.env')
  const inferenceEnv = resolve(temporary, 'inference.env')
  await writeFile(databaseEnv, `BIOCHEMICAL_JS_DERIVED_BEARER_TOKEN=${'D'.repeat(43)}\n`)
  await writeFile(inferenceEnv, `BIOCHEMICAL_REVALIDATION_CURSOR_SECRET=${'R'.repeat(43)}\n`)
  return { databaseEnv, inferenceEnv, state }
}

function provenanceContext() {
  return {
    provenance_context_schema_version: 'biochemical-build-context-v1',
    repositories: [
      { name: 'biochemical-db', repository: 'https://example.invalid/database.git', commit: '1'.repeat(40) },
      { name: 'biochemical-inference', repository: 'https://example.invalid/inference.git', commit: '2'.repeat(40) }
    ],
    artifacts: [
      { path: 'biochemical-db/service-js/dist', bytes: 1, sha256: '3'.repeat(64) },
      { path: 'biochemical-inference/dist', bytes: 1, sha256: '6'.repeat(64) },
      { path: 'biochemical-inference/server-dist', bytes: 1, sha256: '7'.repeat(64) }
    ],
    workflows: [
      { repository: 'biochemical-db', path: 'biochemical-db/.github/workflows/operations.yml', sha256: '4'.repeat(64) },
      { repository: 'biochemical-inference', path: 'biochemical-inference/.github/workflows/operations.yml', sha256: '5'.repeat(64) }
    ],
    environment: { architecture: 'x64', node: process.version, npm: '10', platform: process.platform, runner_image: 'test', workflow_ref: 'test', workflow_sha: 'test' }
  }
}

describe('inference operational state', () => {
  it('cancels timed-out readiness work before the next all-domain check can run', async () => {
    vi.useFakeTimers()
    const metrics = createOperationalMetrics({ timeoutMilliseconds: 100 })
    const check = vi.fn((signal) => new Promise((resolvePromise, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true })
    }))
    const first = metrics.readiness(check)
    const rejected = expect(first).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(100)
    await rejected
    await expect(metrics.readiness(async () => undefined)).resolves.toEqual({ status: 'ready' })
    expect(check).toHaveBeenCalledOnce()
    expect(metrics.prometheus()).toContain('biochemical_inference_readiness_total{outcome="timeout"} 1')
    expect(metrics.prometheus()).toContain('biochemical_inference_readiness_total{outcome="success"} 1')
  })

  it('waits for every domain cancellation and retains the coalescing slot until cleanup settles', async () => {
    vi.useFakeTimers()
    const metrics = createOperationalMetrics({ timeoutMilliseconds: 100 })
    let active = 0
    let maximumActive = 0
    const check = vi.fn((signal) => {
      active += 1
      maximumActive = Math.max(maximumActive, active)
      return new Promise((resolvePromise) => signal.addEventListener('abort', () => {
        setTimeout(() => { active -= 1; resolvePromise() }, 50)
      }, { once: true }))
    })
    const first = metrics.readiness(check)
    const timedOut = expect(first).rejects.toThrow('timed out')
    await vi.advanceTimersByTimeAsync(100)
    await timedOut
    await expect(metrics.readiness(check)).rejects.toThrow('timed out')
    expect(check).toHaveBeenCalledOnce()
    await vi.advanceTimersByTimeAsync(50)
    const next = metrics.readiness(async () => { maximumActive = Math.max(maximumActive, active + 1) })
    await expect(next).resolves.toEqual({ status: 'ready' })
    expect(maximumActive).toBe(1)
  })

  it('does not finish an all-domain readiness pass when one failed check leaves cancellation cleanup pending', async () => {
    let release
    let settled = false
    const pending = settleReadinessChecks([
      Promise.reject(new Error('domain failed')),
      new Promise((resolvePromise) => { release = resolvePromise })
    ]).finally(() => { settled = true })
    await Promise.resolve()
    expect(settled).toBe(false)
    release()
    await expect(pending).rejects.toThrow('domain failed')
    expect(settled).toBe(true)
  })

  it('backs up every persistent root deterministically and validates SQLite, FK, user_version, and CAS integrity', async () => {
    const selected = await fixture()
    const options = { stateRoot: selected.state, applicationVersion: '0.1.0', secretEnvPaths: [selected.databaseEnv, selected.inferenceEnv] }
    const first = await createInferenceBackup({ ...options, destination: resolve(temporary, 'backup-a') })
    const second = await createInferenceBackup({ ...options, destination: resolve(temporary, 'backup-b') })
    expect(first).toEqual(second)
    expect(first.roots.map((root) => root.name)).toEqual(INFERENCE_STATE_ROOTS.map((root) => root.name))
    expect(first.roots.map((root) => root.name)).toContain('spatial-registration')
    expect(JSON.stringify(first)).not.toContain(temporary)
    await expect(verifyInferenceBackup({ backupRoot: resolve(temporary, 'backup-a'), secretEnvPaths: options.secretEnvPaths })).resolves.toEqual(first)
    const restored = resolve(temporary, 'restored')
    await mkdir(restored)
    await chmod(restored, 0o750)
    await utimes(restored, new Date('2025-04-01T00:00:00.000Z'), new Date('2025-04-02T00:00:00.000Z'))
    const beforeCrash = await lstat(restored)
    await expect(restoreInferenceBackup({ backupRoot: resolve(temporary, 'backup-a'), targetStateRoot: restored, secretEnvPaths: options.secretEnvPaths, beforePublish: async () => { throw new Error('injected inference publication crash') } })).rejects.toThrow('injected inference publication crash')
    const afterCrash = await lstat(restored)
    expect({ dev: afterCrash.dev, ino: afterCrash.ino, mode: afterCrash.mode, mtimeMs: afterCrash.mtimeMs }).toEqual({ dev: beforeCrash.dev, ino: beforeCrash.ino, mode: beforeCrash.mode, mtimeMs: beforeCrash.mtimeMs })
    await restoreInferenceBackup({ backupRoot: resolve(temporary, 'backup-a'), targetStateRoot: restored, secretEnvPaths: options.secretEnvPaths })
    const afterRestore = await lstat(restored)
    expect({ gid: afterRestore.gid, mode: afterRestore.mode, mtimeMs: afterRestore.mtimeMs, uid: afterRestore.uid }).toEqual({ gid: beforeCrash.gid, mode: beforeCrash.mode, mtimeMs: beforeCrash.mtimeMs, uid: beforeCrash.uid })
    await expect(verifyInferenceStateIntegrity(resolve(temporary, 'restored'))).resolves.toMatchObject({ cas_objects: 2, chunk_objects: 2, constraints: 540, indexes: 12, schema_closure_sha256: expect.stringMatching(/^[a-f0-9]{64}$/), sqlite_databases: 8, tables: 57, triggers: 74, status: 'valid' })

    const workspace = new DatabaseSync(resolve(temporary, 'restored', 'workspace', 'workspace.sqlite3'))
    workspace.exec('PRAGMA foreign_keys = OFF; CREATE TABLE parent (id INTEGER PRIMARY KEY); CREATE TABLE child (parent_id INTEGER REFERENCES parent(id)); INSERT INTO child VALUES (99);')
    workspace.close()
    await expect(verifyInferenceStateIntegrity(resolve(temporary, 'restored'))).rejects.toThrow('foreign-key')
    const versionMismatch = new DatabaseSync(resolve(temporary, 'restored', 'workspace', 'workspace.sqlite3'))
    versionMismatch.exec('DELETE FROM child; PRAGMA user_version = 99')
    versionMismatch.close()
    await expect(verifyInferenceStateIntegrity(resolve(temporary, 'restored'))).rejects.toThrow('user_version')
  })

  it('uses mutually exclusive owner-token runtime and backup locks without stale-lock reclamation races', async () => {
    const selected = await fixture()
    const runtime = await acquireInferenceRuntimeLock(selected.state)
    expect(runtime.token).toMatch(/^[0-9a-f-]{36}$/)
    await expect(acquireInferenceBackupLock(selected.state)).rejects.toThrow('active runtime lock')
    await expect(createInferenceBackup({ stateRoot: selected.state, destination: resolve(temporary, 'locked'), applicationVersion: '0.1.0' })).rejects.toThrow('active runtime lock')
    await runtime.release()
    const backup = await acquireInferenceBackupLock(selected.state)
    await expect(acquireInferenceRuntimeLock(selected.state)).rejects.toThrow('active backup lock')
    await expect(createInferenceBackup({ stateRoot: selected.state, destination: resolve(temporary, 'forged'), applicationVersion: '0.1.0', operationLock: { path: backup.path, role: 'backup', token: 'forged' } })).rejects.toThrow('not the published owner')
    await backup.release()
    const raced = await Promise.allSettled([acquireInferenceRuntimeLock(selected.state), acquireInferenceBackupLock(selected.state)])
    expect(raced.map((result) => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    await raced.find((result) => result.status === 'fulfilled').value.release()

    const linkedParent = resolve(temporary, 'linked-parent')
    await mkdir(resolve(temporary, 'real-parent'))
    await symlink(resolve(temporary, 'real-parent'), linkedParent)
    await expect(acquireInferenceRuntimeLock(resolve(linkedParent, 'state'))).rejects.toThrow('symlink')
  })

  it('rejects secret bytes, unreferenced CAS objects, and symlinked backup ancestors', async () => {
    const selected = await fixture()
    await writeFile(resolve(selected.state, 'workspace', 'leak.bin'), Buffer.from(`x${'R'.repeat(43)}x`))
    await expect(createInferenceBackup({ stateRoot: selected.state, destination: resolve(temporary, 'secret'), applicationVersion: '0.1.0', secretEnvPaths: [selected.inferenceEnv] })).rejects.toThrow('secret material')
    await rm(resolve(selected.state, 'workspace', 'leak.bin'))

    const bytes = Buffer.from('unreferenced')
    const hash = createHash('sha256').update(bytes).digest('hex')
    await mkdir(resolve(selected.state, 'workspace', 'objects', 'sha256', hash.slice(0, 2)), { recursive: true })
    await writeFile(resolve(selected.state, 'workspace', 'objects', 'sha256', hash.slice(0, 2), hash), bytes)
    await expect(verifyInferenceStateIntegrity(selected.state)).rejects.toThrow('unreferenced')

    await mkdir(resolve(temporary, 'backup-real'))
    await symlink(resolve(temporary, 'backup-real'), resolve(temporary, 'backup-link'))
    await expect(createInferenceBackup({ stateRoot: selected.state, destination: resolve(temporary, 'backup-link', 'output'), applicationVersion: '0.1.0' })).rejects.toThrow('symlink')
  })

  it('never deletes an unmarked supply-chain destination', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'supply-chain-output-'))
    const context = resolve(temporary, 'context.json')
    const output = resolve(temporary, 'output')
    await writeFile(context, canonicalJson(provenanceContext()))
    await mkdir(output)
    await writeFile(resolve(output, 'operator-data'), 'retain')
    await expect(execute(process.execPath, [resolve(import.meta.dirname, '../../scripts/supply-chain.js'), 'generate', output, '--context', context])).rejects.toThrow()
    await expect(readFile(resolve(output, 'operator-data'), 'utf8')).resolves.toBe('retain')
    const marked = resolve(temporary, 'marked-output')
    await mkdir(marked)
    await writeFile(resolve(marked, '.biochemical-supply-chain-output.json'), canonicalJson({ output_schema_version: 'biochemical-supply-chain-output-v1', owner: 'biochemical-inference' }))
    await writeFile(resolve(marked, 'operator-data'), 'retain')
    await expect(execute(process.execPath, [resolve(import.meta.dirname, '../../scripts/supply-chain.js'), 'generate', marked, '--context', context])).rejects.toThrow()
    await expect(readFile(resolve(marked, 'operator-data'), 'utf8')).resolves.toBe('retain')
  }, 120_000)

  it('verifies package, entrypoint, dependency bytes, built bytes, and executable modes before deployment execution', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'deployment-identity-'))
    const root = resolve(temporary, 'biochemical-inference')
    await mkdir(resolve(root, 'dist'), { recursive: true })
    await mkdir(resolve(root, 'server-dist', 'server'), { recursive: true })
    await mkdir(resolve(root, 'node_modules', 'dependency'), { recursive: true })
    const packageValue = { name: 'biochemical-inference-deployment', private: true, type: 'module', engines: { node: '>=22 <23' }, scripts: { start: 'node server-dist/server/index.js' } }
    await writeFile(resolve(root, 'package.json'), `${JSON.stringify(packageValue, null, 2)}\n`)
    await writeFile(resolve(root, 'dist', 'index.js'), 'built-client')
    await writeFile(resolve(root, 'server-dist', 'server', 'index.js'), 'server-entrypoint')
    await writeFile(resolve(root, 'node_modules', 'dependency', 'index.js'), 'dependency-bytecode')
    const commit = 'a'.repeat(40)
    const writeMarker = async () => writeFile(resolve(root, '.biochemical-deployment.json'), canonicalJson({ deployment_archive_schema_version: 'biochemical-deployment-archive-v1', repository: 'biochemical-inference', commit, artifact_sha256: await deploymentTreeDigest(root, 'biochemical-inference'), entrypoint: 'server-dist/server/index.js' }))
    await writeMarker()
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'test deployment')).resolves.toMatchObject({ root, commit, entrypoint: 'server-dist/server/index.js' })

    await writeFile(resolve(root, 'node_modules', 'dependency', 'index.js'), 'mutated dependency')
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'test deployment')).rejects.toThrow('runnable deployment tree')
    await writeFile(resolve(root, 'node_modules', 'dependency', 'index.js'), 'dependency-bytecode')
    await writeMarker()
    await chmod(resolve(root, 'server-dist', 'server', 'index.js'), 0o700)
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'test deployment')).rejects.toThrow('runnable deployment tree')
    await chmod(resolve(root, 'server-dist', 'server', 'index.js'), 0o600)
    packageValue.scripts.start = 'node node_modules/dependency/index.js'
    await writeFile(resolve(root, 'package.json'), `${JSON.stringify(packageValue, null, 2)}\n`)
    await writeMarker()
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'test deployment')).rejects.toThrow('exact entrypoint')
  })
})
