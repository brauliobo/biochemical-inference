import { execFile, spawn } from 'node:child_process'
import { chmod, lstat, mkdir, mkdtemp, readFile, readdir, rm, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import { deploymentIdentity } from '../../scripts/operations.js'
import { INFERENCE_STATE_ROOTS } from '../../scripts/operations/inference-state.js'
import { openChallengeDatabase } from '../../server/challenge/database.js'
import { openDataPlaneDatabase } from '../../server/data-plane/database.js'
import { openMeasuredDatabase } from '../../server/measured/database.js'
import { openMeasuredSpatialDatabase } from '../../server/measured-spatial/database.js'
import { openPhysiologyDatabase } from '../../server/physiology/database.js'
import { openRevalidationDatabase } from '../../server/revalidation/database.js'
import { openSpatialRegistrationDatabase } from '../../server/spatial-registration/database.js'
import { openWorkspaceDatabase } from '../../server/workspace/database.js'

const execute = promisify(execFile)
const databaseRepository = resolve(import.meta.dirname, '../../../biochemical-db')
const deploymentArchiveScript = resolve(import.meta.dirname, '../../scripts/deployment-archive.js')
const operationsScript = resolve(import.meta.dirname, '../../scripts/operations.js')
let temporary

afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined })

async function runOperations(arguments_, options = {}) {
  return execute(process.execPath, [operationsScript, ...arguments_], { timeout: 30_000, maxBuffer: 1024 * 1024, ...options })
}

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

async function initializeDatabaseRuntime(runtime, port) {
  const values = {}
  for (const line of (await readFile(resolve(runtime, 'database', 'secrets', 'database.env'), 'utf8')).split('\n')) {
    if (!line) continue
    const index = line.indexOf('=')
    values[line.slice(0, index)] = line.slice(index + 1)
  }
  const child = spawn(process.execPath, ['src/http/server.js'], { cwd: resolve(databaseRepository, 'service-js'), env: { ...process.env, ...values }, stdio: 'inherit' })
  const exited = new Promise((resolveExit, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolveExit({ code, signal }))
  })
  try {
    let ready = false
    for (let attempt = 0; attempt < 1_200; attempt += 1) {
      const outcome = await Promise.race([exited.then((result) => ({ result })), fetch(`http://127.0.0.1:${port}/healthz`).then((response) => ({ response })).catch(() => ({}))])
      if (outcome.result) throw new Error(`database fixture exited before readiness: ${outcome.result.code ?? outcome.result.signal}`)
      if (outcome.response?.status === 200) { ready = true; break }
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 50))
    }
    if (!ready) throw new Error('database fixture readiness timed out')
  } finally {
    child.kill('SIGTERM')
    const result = await exited
    if (result.code !== 0 && result.signal !== 'SIGTERM') throw new Error(`database fixture shutdown failed: ${result.code ?? result.signal}`)
  }
}

describe('operations actual process acceptance', () => {
  it('produces an archive whose complete runnable-byte closure passes the runtime verifier', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'deployment-archive-acceptance-'))
    const source = resolve(temporary, 'source')
    await mkdir(resolve(source, 'dist'), { recursive: true })
    await mkdir(resolve(source, 'server-dist', 'server'), { recursive: true })
    await mkdir(resolve(source, 'node_modules', 'dependency'), { recursive: true })
    await writeFile(resolve(source, 'dist', 'index.js'), 'client bytes')
    await writeFile(resolve(source, 'server-dist', 'server', 'index.js'), 'server bytes')
    await writeFile(resolve(source, 'node_modules', 'dependency', 'index.js'), 'dependency bytes')
    await writeFile(resolve(source, 'package.json'), '{}\n')
    await execute('git', ['init', source])
    await execute('git', ['-C', source, 'add', '.'])
    await execute('git', ['-C', source, '-c', 'user.name=Operations Test', '-c', 'user.email=operations@example.invalid', 'commit', '-m', 'fixture'])
    const { stdout: commitOutput } = await execute('git', ['-C', source, 'rev-parse', 'HEAD'])
    const commit = commitOutput.trim()
    const archive = resolve(temporary, 'deployment.tar')
    const produced = await execute(process.execPath, [deploymentArchiveScript, '--kind', 'inference', '--source-root', source, '--commit', commit, '--output', archive])
    const result = JSON.parse(produced.stdout)
    const extracted = resolve(temporary, 'extracted')
    await mkdir(extracted)
    await execute('tar', ['-xf', archive, '-C', extracted])
    const root = resolve(extracted, 'biochemical-inference')
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'produced deployment')).resolves.toMatchObject({ root, commit })
    const marker = JSON.parse(await readFile(resolve(root, '.biochemical-deployment.json'), 'utf8'))
    expect(result.artifact_sha256).toBe(marker.artifact_sha256)
    await writeFile(resolve(root, 'node_modules', 'dependency', 'index.js'), 'changed dependency bytes')
    await expect(deploymentIdentity(root, 'biochemical-inference', commit, 'mutated deployment')).rejects.toThrow('runnable deployment tree')
  }, 30_000)

  it('publishes a combined restore only after both repositories and its durable marker are complete', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'combined-restore-'))
    const runtime = resolve(temporary, 'runtime')
    const databasePort = 20_000 + (process.pid % 10_000)
    await runOperations(['init', '--runtime-root', runtime, '--database-repo', databaseRepository, '--origin', 'https://public.invalid', '--database-port', String(databasePort)])
    await initializeDatabaseRuntime(runtime, databasePort)
    await populateInferenceState(resolve(runtime, 'inference-state'))
    const backup = resolve(temporary, 'backup')
    await runOperations(['backup', '--runtime-root', runtime, '--destination', backup])
    await writeFile(resolve(backup, 'unmanifested'), 'x')
    await expect(runOperations(['verify-backup', '--runtime-root', runtime, '--backup', backup])).rejects.toThrow('file closure')
    await rm(resolve(backup, 'unmanifested'))
    await expect(runOperations(['restore', '--runtime-root', runtime, '--backup', backup, '--target', resolve(backup, 'nested')])).rejects.toThrow('must not overlap')
    await expect(runOperations(['restore', '--runtime-root', runtime, '--backup', backup, '--target', resolve(runtime, 'nested')])).rejects.toThrow('must not overlap')
    const crashed = resolve(temporary, 'crashed')
    await expect(runOperations(['restore', '--runtime-root', runtime, '--backup', backup, '--target', crashed], { env: { ...process.env, NODE_ENV: 'test', BIOCHEMICAL_TEST_FAIL_BEFORE_RESTORE_PUBLISH: 'true' } })).rejects.toThrow('injected crash')
    await expect(readFile(resolve(crashed, '.biochemical-restore.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(lstat(crashed)).rejects.toMatchObject({ code: 'ENOENT' })
    const emptyCrashed = resolve(temporary, 'empty-crashed')
    await mkdir(emptyCrashed)
    await chmod(emptyCrashed, 0o750)
    await utimes(emptyCrashed, new Date('2025-01-01T00:00:00.000Z'), new Date('2025-01-02T00:00:00.000Z'))
    const emptyBefore = await lstat(emptyCrashed)
    await expect(runOperations(['restore', '--runtime-root', runtime, '--backup', backup, '--target', emptyCrashed], { env: { ...process.env, NODE_ENV: 'test', BIOCHEMICAL_TEST_FAIL_BEFORE_RESTORE_PUBLISH: 'true' } })).rejects.toThrow('injected crash')
    await expect(readdir(emptyCrashed)).resolves.toEqual([])
    const emptyAfter = await lstat(emptyCrashed)
    expect({ dev: emptyAfter.dev, ino: emptyAfter.ino, mode: emptyAfter.mode, mtimeMs: emptyAfter.mtimeMs }).toEqual({ dev: emptyBefore.dev, ino: emptyBefore.ino, mode: emptyBefore.mode, mtimeMs: emptyBefore.mtimeMs })
    const restored = resolve(temporary, 'restored')
    await mkdir(restored)
    await chmod(restored, 0o750)
    await utimes(restored, new Date('2025-02-01T00:00:00.000Z'), new Date('2025-02-02T00:00:00.000Z'))
    const restoredBefore = await lstat(restored)
    await expect(runOperations(['restore', '--runtime-root', runtime, '--backup', backup, '--target', restored])).resolves.toMatchObject({ stdout: expect.stringContaining('"status":"restored"') })
    const restoredAfter = await lstat(restored)
    expect({ gid: restoredAfter.gid, mode: restoredAfter.mode, mtimeMs: restoredAfter.mtimeMs, uid: restoredAfter.uid }).toEqual({ gid: restoredBefore.gid, mode: restoredBefore.mode, mtimeMs: restoredBefore.mtimeMs, uid: restoredBefore.uid })
    const markerPath = resolve(restored, '.biochemical-restore.json')
    const markerBytes = await readFile(markerPath, 'utf8')
    const marker = JSON.parse(markerBytes)
    expect(marker).toMatchObject({ restore_schema_version: 'biochemical-pair-restore-v1', state_directories: ['database-state', 'inference-state'], database_manifest: { content_sha256: marker.database_manifest_sha256 }, inference_manifest: { content_sha256: marker.inference_manifest_sha256 } })
    const moduleUrl = pathToFileURL(operationsScript).href
    await expect(execute(process.execPath, ['--input-type=module', '--eval', `const { runtimeValues } = await import(${JSON.stringify(moduleUrl)}); await runtimeValues(${JSON.stringify(runtime)}, ${JSON.stringify(restored)});`])).resolves.toBeDefined()
    marker.database_manifest.application_version = '9.9.9'
    await writeFile(markerPath, canonicalJson(marker))
    await expect(runOperations(['smoke', '--runtime-root', runtime, '--state-root', restored])).rejects.toThrow('checksum')
  }, 60_000)
})
