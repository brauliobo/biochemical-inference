import { createPublicKey, randomBytes } from 'node:crypto'
import { spawn } from 'node:child_process'
import { lstat, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { canonicalJson } from '../shared/canonical-json.js'
import { acquireInferenceBackupLock } from '../server/operations/runtime-lock.js'
import { inspectNoSymlinkPath, publishDirectoryAnchored, removeAnchored, syncPath, syncTree } from '../server/operations/path-safety.js'
import { createInferenceBackup, INFERENCE_STATE_ROOTS, restoreInferenceBackup, snapshotInferenceStateManifest, verifyInferenceBackup, verifyInferenceStateIntegrity, verifyInferenceStateManifest, verifyRestoredInferenceState } from './operations/inference-state.js'
import { verifyDeploymentTree } from './operations/deployment-identity.js'
import { flags } from './operations/cli.js'
import { inside } from '../server/commons/paths.js'

const inferenceRoot = resolve(import.meta.dirname, '..')
const defaultDatabaseRoot = resolve(inferenceRoot, '..', 'biochemical-db')

function requireNode22() {
  if (Number(process.versions.node.split('.')[0]) !== 22) throw new Error(`Node 22 is required; found ${process.versions.node}`)
}

function token() {
  return randomBytes(32).toString('base64url')
}

async function databaseModules(databaseRoot) {
  const serviceRoot = resolve(databaseRoot, 'service-js')
  const config = await import(pathToFileURL(resolve(serviceRoot, 'src/operations/runtime-config-node.js')))
  const backup = await import(pathToFileURL(resolve(serviceRoot, 'src/operations/state-backup-node.js')))
  const lock = await import(pathToFileURL(resolve(serviceRoot, 'src/operations/runtime-lock-node.js')))
  return { ...config, ...backup, ...lock, serviceRoot }
}

async function writeExclusive(path, value) {
  await writeFile(path, value, { flag: 'wx', mode: 0o600 })
}

function envText(value) {
  return `${Object.entries(value).map(([name, selected]) => `${name}=${selected}`).join('\n')}\n`
}

async function parseEnv(path) {
  await inspectNoSymlinkPath(path, 'runtime environment file', { type: 'file' })
  const output = {}
  for (const line of (await readFile(path, 'utf8')).split('\n')) {
    if (!line || line.startsWith('#')) continue
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line)
    if (!match) throw new Error(`invalid environment line in ${path}`)
    output[match[1]] = match[2]
  }
  return output
}

function localHost(value, label) {
  if (!['127.0.0.1', '::1'].includes(value)) throw new Error(`${label} must be the literal loopback address 127.0.0.1 or ::1`)
  return value
}

function localPort(value, label) {
  const selected = Number(value)
  if (!Number.isInteger(selected) || selected < 1 || selected > 65535) throw new Error(`${label} must be an integer between 1 and 65535`)
  return selected
}

const localOrigin = (host, port) => `http://${host.includes(':') ? `[${host}]` : host}:${port}`

async function initialize({ runtimeRoot, databaseRoot, origin, inferenceHost = '127.0.0.1', inferencePort = 3000, databaseHost = '127.0.0.1', databasePort = 8000 }) {
  requireNode22()
  const root = resolve(runtimeRoot)
  const databaseRepository = (await inspectNoSymlinkPath(databaseRoot, 'database repository')).path
  if (inside(inferenceRoot, root) || inside(databaseRepository, root)) throw new Error('runtime root must be outside both source repositories')
  const selectedOrigin = new URL(origin)
  if (!['http:', 'https:'].includes(selectedOrigin.protocol) || selectedOrigin.username || selectedOrigin.password || selectedOrigin.origin !== origin) throw new Error('origin must be an exact HTTP(S) origin')
  const selectedInferenceHost = localHost(inferenceHost, 'inference host')
  const selectedDatabaseHost = localHost(databaseHost, 'database host')
  const selectedInferencePort = localPort(inferencePort, 'inference port')
  const selectedDatabasePort = localPort(databasePort, 'database port')
  await inspectNoSymlinkPath(root, 'runtime root', { allowMissing: true })
  await mkdir(root, { recursive: true, mode: 0o700 })
  await inspectNoSymlinkPath(root, 'runtime root')
  if ((await readdir(root)).length !== 0) throw new Error('runtime root must be a new empty real directory')
  const database = await databaseModules(databaseRepository)
  const databaseRuntime = await database.initializeRuntimeConfiguration({
    runtimeRoot: resolve(root, 'database'),
    knowledgeRoot: resolve(databaseRepository, 'knowledge'),
    allowedOrigin: origin,
    host: selectedDatabaseHost,
    port: selectedDatabasePort
  })
  const stateRoot = resolve(root, 'inference-state')
  const secretsRoot = resolve(root, 'inference-secrets')
  await mkdir(stateRoot, { mode: 0o700 })
  await mkdir(secretsRoot, { mode: 0o700 })
  for (const { name } of INFERENCE_STATE_ROOTS) await mkdir(resolve(stateRoot, name), { mode: 0o700 })
  const databaseEnv = databaseRuntime.env
  const databaseProbeOrigin = localOrigin(selectedDatabaseHost, selectedDatabasePort)
  const inferenceProbeOrigin = localOrigin(selectedInferenceHost, selectedInferencePort)
  const publicKey = createPublicKey(await readFile(databaseEnv.BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_PUBLIC_KEY)).export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64')
  const rolePolicy = JSON.parse(await readFile(databaseEnv.BIOCHEMICAL_JS_REVALIDATION_ROLE_POLICY, 'utf8'))
  const inferenceEnv = {
    NODE_ENV: 'production',
    HOST: selectedInferenceHost,
    PORT: String(selectedInferencePort),
    BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: origin,
    BIOCHEMICAL_INFERENCE_STATE_ROOT: stateRoot,
    BIOCHEMICAL_WORKSPACE_ROOT: resolve(stateRoot, 'workspace'),
    BIOCHEMICAL_WORKSPACE_CONCURRENCY: '1',
    BIOCHEMICAL_PHYSIOLOGY_ROOT: resolve(stateRoot, 'physiology'),
    BIOCHEMICAL_DATA_PLANE_ROOT: resolve(stateRoot, 'data-plane'),
    BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET: token(),
    BIOCHEMICAL_MEASURED_ROOT: resolve(stateRoot, 'measured'),
    BIOCHEMICAL_MEASURED_CURSOR_SECRET: token(),
    BIOCHEMICAL_MEASURED_SPATIAL_ROOT: resolve(stateRoot, 'measured-spatial'),
    BIOCHEMICAL_SPATIAL_REGISTRATION_ROOT: resolve(stateRoot, 'spatial-registration'),
    BIOCHEMICAL_CHALLENGE_ROOT: resolve(stateRoot, 'challenge'),
    BIOCHEMICAL_REVALIDATION_ROOT: resolve(stateRoot, 'revalidation'),
    BIOCHEMICAL_REVALIDATION_CURSOR_SECRET: token(),
    BIOCHEMICAL_REVALIDATION_CONCURRENCY: '1',
    BIOCHEMICAL_OPTIONAL_UNINITIALIZED_DOMAINS: 'challenge,data-plane,measured,measured-spatial,physiology,revalidation,spatial-registration,workspace',
    BIOCHEMICAL_DB_URL: databaseProbeOrigin,
    BIOCHEMICAL_PARAMETERS_URL: databaseProbeOrigin,
    BIOCHEMICAL_APAP_URL: databaseProbeOrigin,
    BIOCHEMICAL_SPATIAL_URL: databaseProbeOrigin,
    BIOCHEMICAL_PHYSIOLOGY_URL: databaseProbeOrigin,
    BIOCHEMICAL_FACTORY_URL: databaseProbeOrigin,
    BIOCHEMICAL_EVIDENCE_URL: databaseProbeOrigin,
    BIOCHEMICAL_EVIDENCE_HEALTH_PATH: '/api/evidence/v1/healthz',
    BIOCHEMICAL_EVIDENCE_ALLOWED_ORIGIN: origin,
    BIOCHEMICAL_EVIDENCE_CSRF_TOKEN: databaseEnv.BIOCHEMICAL_JS_EVIDENCE_CSRF_TOKEN,
    BIOCHEMICAL_DERIVED_URL: databaseProbeOrigin,
    BIOCHEMICAL_DERIVED_HEALTH_PATH: '/api/derived/v1/healthz',
    BIOCHEMICAL_DERIVED_WRITE_TOKEN: databaseEnv.BIOCHEMICAL_JS_DERIVED_BEARER_TOKEN,
    BIOCHEMICAL_MEASURED_URL: databaseProbeOrigin,
    BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN: origin,
    BIOCHEMICAL_MEASURED_CSRF_TOKEN: databaseEnv.BIOCHEMICAL_JS_MEASURED_CSRF_TOKEN,
    BIOCHEMICAL_MEASURED_SPATIAL_URL: databaseProbeOrigin,
    BIOCHEMICAL_SPATIAL_REGISTRATION_URL: databaseProbeOrigin,
    BIOCHEMICAL_CHALLENGE_URL: databaseProbeOrigin,
    BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN: origin,
    BIOCHEMICAL_CHALLENGE_CSRF_TOKEN: databaseEnv.BIOCHEMICAL_JS_CHALLENGE_CSRF_TOKEN,
    BIOCHEMICAL_REVALIDATION_URL: databaseProbeOrigin,
    BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN: origin,
    BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN: databaseEnv.BIOCHEMICAL_JS_REVALIDATION_AUTHOR_BEARER_TOKEN,
    BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN: databaseEnv.BIOCHEMICAL_JS_REVALIDATION_EXECUTOR_BEARER_TOKEN,
    BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID: databaseEnv.BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_KEY_ID,
    BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY: publicKey,
    BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID: rolePolicy.role_policy_id
  }
  const inferenceEnvPath = resolve(secretsRoot, 'inference.env')
  await writeExclusive(inferenceEnvPath, envText(inferenceEnv))
  await writeExclusive(resolve(root, 'runtime.json'), canonicalJson({ runtime_schema_version: '2.0.0', database_repository: databaseRepository, public_origin: origin, probes: { database: databaseProbeOrigin, inference: inferenceProbeOrigin } }))
  return { database_env: databaseRuntime.envPath, inference_env: inferenceEnvPath, runtime_root: root }
}

function run(command, arguments_, options) {
  const child = spawn(command, arguments_, { ...options, stdio: 'inherit' })
  return new Promise((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with ${code ?? signal}`)))
  })
}

async function bootstrap(databaseRoot) {
  requireNode22()
  const serviceRoot = resolve(databaseRoot, 'service-js')
  await run('nice', ['-n', '10', 'npm', 'ci'], { cwd: serviceRoot, env: process.env })
  await run('nice', ['-n', '10', 'npm', 'ci'], { cwd: inferenceRoot, env: process.env })
  await run('nice', ['-n', '10', 'npm', 'run', 'build'], { cwd: inferenceRoot, env: process.env })
  return { status: 'ready', node: process.versions.node }
}

async function runtimeValues(runtimeRoot, stateOverride) {
  const root = (await inspectNoSymlinkPath(runtimeRoot, 'runtime root')).path
  const runtime = JSON.parse(await readFile(resolve(root, 'runtime.json'), 'utf8'))
  const databaseEnvPath = resolve(root, 'database', 'secrets', 'database.env')
  const inferenceEnvPath = resolve(root, 'inference-secrets', 'inference.env')
  const databaseEnv = await parseEnv(databaseEnvPath)
  const inferenceEnv = await parseEnv(inferenceEnvPath)
  if (runtime.runtime_schema_version !== '2.0.0' || typeof runtime.public_origin !== 'string' || typeof runtime.probes?.database !== 'string' || typeof runtime.probes?.inference !== 'string') throw new Error('runtime metadata is incompatible')
  const databaseRoot = (await inspectNoSymlinkPath(runtime.database_repository, 'database repository')).path
  if (stateOverride) {
    const selected = (await inspectNoSymlinkPath(stateOverride, 'state override root')).path
    const markerPath = resolve(selected, '.biochemical-restore.json')
    await inspectNoSymlinkPath(markerPath, 'combined restore marker', { type: 'file' })
    const markerBytes = await readFile(markerPath, 'utf8')
    const marker = JSON.parse(markerBytes)
    if (canonicalJson(marker) !== markerBytes || marker.restore_schema_version !== 'biochemical-pair-restore-v1' || marker.state_directories?.join('\0') !== ['database-state', 'inference-state'].join('\0') || marker.backup_database_manifest_sha256 !== marker.backup_database_manifest?.content_sha256 || marker.backup_inference_manifest_sha256 !== marker.backup_inference_manifest?.content_sha256 || marker.database_manifest_sha256 !== marker.database_manifest?.content_sha256 || marker.inference_manifest_sha256 !== marker.inference_manifest?.content_sha256) throw new Error('state override is not a complete pair-atomic restore')
    const database = await databaseModules(databaseRoot)
    await Promise.all([
      database.verifyStateManifest(marker.database_manifest),
      database.verifyStateManifest(marker.backup_database_manifest),
      Promise.resolve().then(() => verifyInferenceStateManifest(marker.inference_manifest)),
      Promise.resolve().then(() => verifyInferenceStateManifest(marker.backup_inference_manifest))
    ])
    databaseEnv.BIOCHEMICAL_JS_STATE_ROOT = resolve(selected, 'database-state')
    databaseEnv.BIOCHEMICAL_JS_REVALIDATION_STATE_PATH = resolve(selected, 'database-state', 'revalidation-state-v1')
    const inferenceState = resolve(selected, 'inference-state')
    inferenceEnv.BIOCHEMICAL_INFERENCE_STATE_ROOT = inferenceState
    for (const { name } of INFERENCE_STATE_ROOTS) {
      const variable = `BIOCHEMICAL_${name.replaceAll('-', '_').toUpperCase()}_ROOT`
      inferenceEnv[variable] = resolve(inferenceState, name)
    }
  }
  return { databaseEnv, databaseEnvPath, databaseRoot, inferenceEnv, inferenceEnvPath, probes: runtime.probes, publicOrigin: runtime.public_origin, root }
}

function childProcess(command, arguments_, options) {
  const child = spawn(command, arguments_, { ...options, detached: true, stdio: 'inherit' })
  child.exitPromise = new Promise((resolvePromise, reject) => {
    child.once('error', reject)
    child.once('exit', (code, signal) => resolvePromise({ code, signal }))
  })
  return child
}

async function waitReady(url, child, timeoutMilliseconds = 180_000) {
  const deadline = Date.now() + timeoutMilliseconds
  let lastObservation = 'no response received'
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      const outcome = await child.exitPromise
      throw new Error(`process ${child.pid} exited before readiness at ${url}: ${outcome.code ?? outcome.signal}`)
    }
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) })
      if (response.status === 200) return
      lastObservation = `HTTP ${response.status}`
    } catch (error) { lastObservation = error instanceof Error ? error.message : String(error) }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250))
  }
  throw new Error(`process ${child.pid} readiness timed out after ${timeoutMilliseconds} ms at ${url}; last observation: ${lastObservation}`)
}

async function stopChild(child, timeoutMilliseconds = 20_000) {
  if (!child) return
  const groupExists = () => {
    try { process.kill(-child.pid, 0); return true } catch (error) { if (error?.code === 'ESRCH') return false; if (error?.code === 'EPERM') return true; throw error }
  }
  const signalGroup = (signal) => { try { process.kill(-child.pid, signal) } catch (error) { if (error?.code !== 'ESRCH') throw error } }
  if (!groupExists()) return
  signalGroup('SIGTERM')
  const deadline = Date.now() + timeoutMilliseconds
  while (groupExists() && Date.now() < deadline) await new Promise((resolvePromise) => setTimeout(resolvePromise, 50))
  if (groupExists()) {
    signalGroup('SIGKILL')
    await child.exitPromise.catch(() => undefined)
    throw new Error(`process ${child.pid} did not stop gracefully`)
  }
  const result = await child.exitPromise
  if (result.code !== 0 && result.signal !== 'SIGTERM') throw new Error(`process ${child.pid} failed during shutdown`)
}

class ShutdownRequested extends Error {
  constructor(outcome) { super(`shutdown requested by ${outcome.signal}`); this.outcome = outcome }
}

async function deploymentIdentity(repository, expectedName, expectedCommit, label) {
  const root = (await inspectNoSymlinkPath(repository, label)).path
  const markerPath = resolve(root, '.biochemical-deployment.json')
  await inspectNoSymlinkPath(markerPath, `${label} marker`, { type: 'file' })
  const bytes = await readFile(markerPath, 'utf8')
  const marker = JSON.parse(bytes)
  if (canonicalJson(marker) !== bytes || marker.deployment_archive_schema_version !== 'biochemical-deployment-archive-v1' || marker.repository !== expectedName || marker.commit !== expectedCommit || !/^[a-f0-9]{64}$/.test(marker.artifact_sha256)) throw new Error(`${label} does not match its exact deployment archive identity`)
  await verifyDeploymentTree(root, expectedName, marker)
  return Object.freeze({ commit: expectedCommit, entrypoint: marker.entrypoint, name: expectedName, root })
}

async function startServices(runtimeRoot, stateOverride, { repositories = {}, readiness = {}, shutdownSignal = null, prior = false } = {}) {
  const selected = await runtimeValues(runtimeRoot, stateOverride)
  const databaseDeployment = repositories.database && typeof repositories.database === 'object'
    ? await deploymentIdentity(repositories.database.root, repositories.database.name, repositories.database.commit, 'database deployment before execution')
    : null
  const databaseRoot = databaseDeployment?.root ?? repositories.database ?? selected.databaseRoot
  const databaseService = resolve(databaseRoot, 'service-js')
  const legacy = prior
  let priorFixtureState
  if (legacy) {
    priorFixtureState = (await inspectNoSymlinkPath(resolve(stateOverride, 'database-state'), 'prior release rollback state')).path
  }
  const databaseEnv = legacy
    ? { ...process.env, ...selected.databaseEnv, BIOCHEMICAL_JS_DATA_DIR: priorFixtureState, PORT: selected.databaseEnv.PORT }
    : { ...process.env, ...selected.databaseEnv }
  const databaseArguments = legacy
    ? ['-n', '10', 'node', resolve(inferenceRoot, 'scripts/operations/prior-database-server.js'), databaseService]
    : ['-n', '10', 'node', databaseDeployment ? resolve(databaseRoot, databaseDeployment.entrypoint) : 'src/http/server.js']
  const database = childProcess('nice', databaseArguments, { cwd: databaseService, env: databaseEnv })
  let inference
  const bounded = async (promise) => {
    if (!shutdownSignal) return promise
    const outcome = await Promise.race([promise.then((value) => ({ value })), shutdownSignal])
    if (outcome.signal) throw new ShutdownRequested(outcome)
    return outcome.value
  }
  try {
    await bounded(waitReady(`${selected.probes.database}${readiness.database ?? (legacy ? '/healthz' : '/ops/readyz')}`, database))
    const inferenceDeployment = repositories.inference && typeof repositories.inference === 'object'
      ? await deploymentIdentity(repositories.inference.root, repositories.inference.name, repositories.inference.commit, 'inference deployment before execution')
      : null
    const inferenceRepository = inferenceDeployment?.root ?? repositories.inference ?? inferenceRoot
    const inferenceEnv = legacy
      ? { ...process.env, ...selected.inferenceEnv, BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_EVIDENCE_USE_FIXTURE: 'true' }
      : { ...process.env, ...selected.inferenceEnv }
    const inferenceArguments = inferenceDeployment
      ? ['-n', '10', 'node', resolve(inferenceRepository, inferenceDeployment.entrypoint)]
      : ['-n', '10', 'npm', 'start']
    inference = childProcess('nice', inferenceArguments, { cwd: inferenceRepository, env: inferenceEnv })
    await bounded(waitReady(`${selected.probes.inference}${readiness.inference ?? (legacy ? '/api/v1/ready' : '/ops/readyz')}`, inference))
    return {
      database,
      inference,
      async stop() {
        let failure
        try { await stopChild(inference) } catch (error) { failure = error }
        try { await stopChild(database) } catch (error) { failure ??= error }
        if (failure) throw failure
      }
    }
  } catch (error) {
    await stopChild(inference).catch(() => {})
    await stopChild(database).catch(() => {})
    throw error
  }
}

async function supervise(runtimeRoot, stateOverride, { processTarget = process, start = startServices } = {}) {
  let requested = false
  let resolveSignal
  const signal = new Promise((resolvePromise) => { resolveSignal = resolvePromise })
  const shutdown = (name) => { if (!requested) { requested = true; resolveSignal({ signal: name }) } }
  const sigint = () => shutdown('SIGINT')
  const sigterm = () => shutdown('SIGTERM')
  processTarget.once('SIGINT', sigint)
  processTarget.once('SIGTERM', sigterm)
  try {
    let services
    try { services = await start(runtimeRoot, stateOverride, { shutdownSignal: signal }) }
    catch (error) { if (error instanceof ShutdownRequested) return { status: 'stopped', signal: error.outcome.signal }; throw error }
    const outcome = await Promise.race([signal, services.database.exitPromise.then((value) => ({ service: 'database', ...value })), services.inference.exitPromise.then((value) => ({ service: 'inference', ...value }))])
    await services.stop()
    if (outcome.service) throw new Error(`${outcome.service} exited unexpectedly`)
    return { status: 'stopped', signal: outcome.signal }
  } finally {
    processTarget.removeListener('SIGINT', sigint)
    processTarget.removeListener('SIGTERM', sigterm)
  }
}

async function smoke(runtimeRoot, stateOverride) {
  let services
  try {
    services = await startServices(runtimeRoot, stateOverride)
    await services.stop()
    services = null
    return { actual_process_restarts: 2, status: 'ready-and-stopped' }
  } finally {
    await services?.stop().catch(() => undefined)
  }
}

async function createBackup(runtimeRoot, destination) {
  const selected = await runtimeValues(runtimeRoot)
  const database = await databaseModules(selected.databaseRoot)
  const packageValue = JSON.parse(await readFile(resolve(inferenceRoot, 'package.json'), 'utf8'))
  const target = resolve(destination)
  const targetState = await inspectNoSymlinkPath(target, 'combined backup destination', { allowMissing: true })
  if (targetState.exists) throw new Error('combined backup destination must not exist')
  let databaseLock
  let inferenceLock
  let created = false
  try {
    await mkdir(target, { mode: 0o700 })
    created = true
    databaseLock = await database.acquireBackupLock(selected.databaseEnv.BIOCHEMICAL_JS_STATE_ROOT)
    inferenceLock = await acquireInferenceBackupLock(selected.inferenceEnv.BIOCHEMICAL_INFERENCE_STATE_ROOT)
    const databaseManifest = await database.createStateBackup({ stateRoot: selected.databaseEnv.BIOCHEMICAL_JS_STATE_ROOT, destination: resolve(target, 'database'), applicationVersion: JSON.parse(await readFile(resolve(database.serviceRoot, 'package.json'), 'utf8')).version, secretEnvPath: selected.databaseEnvPath, operationLock: databaseLock })
    const inferenceManifest = await createInferenceBackup({ stateRoot: selected.inferenceEnv.BIOCHEMICAL_INFERENCE_STATE_ROOT, destination: resolve(target, 'inference'), applicationVersion: packageValue.version, secretEnvPaths: [selected.databaseEnvPath, selected.inferenceEnvPath], operationLock: inferenceLock })
    const manifestPath = resolve(target, 'manifest.json')
    await writeFile(manifestPath, canonicalJson({
      backup_set_schema_version: 'biochemical-disaster-recovery-v1',
      database_application_version: databaseManifest.application_version,
      database_manifest_sha256: databaseManifest.content_sha256,
      inference_application_version: inferenceManifest.application_version,
      inference_manifest_sha256: inferenceManifest.content_sha256
    }), { flag: 'wx', mode: 0o600 })
    await syncPath(manifestPath)
    await syncTree(target)
    await syncPath(dirname(target))
    return { database: databaseManifest.content_sha256, inference: inferenceManifest.content_sha256, status: 'created' }
  } catch (error) {
    if (created) await removeAnchored(target, rm, { recursive: true, force: true })
    throw error
  } finally {
    const released = await Promise.allSettled([inferenceLock?.release(), databaseLock?.release()])
    const failure = released.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
  }
}

async function verifyBackup(runtimeRoot, backupRoot, context = {}) {
  const selected = context.selected ?? await runtimeValues(runtimeRoot)
  const database = context.database ?? await databaseModules(selected.databaseRoot)
  const backup = (await inspectNoSymlinkPath(backupRoot, 'combined backup root')).path
  const entries = (await readdir(backup, { withFileTypes: true })).sort((left, right) => Buffer.compare(Buffer.from(left.name), Buffer.from(right.name)))
  if (entries.map((entry) => entry.name).join('\0') !== ['database', 'inference', 'manifest.json'].join('\0') || !entries[0]?.isDirectory() || !entries[1]?.isDirectory() || !entries[2]?.isFile() || entries.some((entry) => entry.isSymbolicLink())) throw new Error('combined backup file closure is invalid')
  const manifestPath = resolve(backup, 'manifest.json')
  await inspectNoSymlinkPath(manifestPath, 'combined backup manifest', { type: 'file' })
  const top = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (canonicalJson(top) !== await readFile(manifestPath, 'utf8') || top.backup_set_schema_version !== 'biochemical-disaster-recovery-v1') throw new Error('combined backup manifest is invalid')
  const [databaseManifest, inferenceManifest] = await Promise.all([
    database.verifyStateBackup({ backupRoot: resolve(backup, 'database'), secretEnvPath: selected.databaseEnvPath }),
    verifyInferenceBackup({ backupRoot: resolve(backup, 'inference'), secretEnvPaths: [selected.databaseEnvPath, selected.inferenceEnvPath] })
  ])
  if (databaseManifest.content_sha256 !== top.database_manifest_sha256 || inferenceManifest.content_sha256 !== top.inference_manifest_sha256 || databaseManifest.application_version !== top.database_application_version || inferenceManifest.application_version !== top.inference_application_version) throw new Error('combined backup manifest does not bind both repositories')
  return { databaseManifest, inferenceManifest, status: 'verified' }
}

async function restoreBackup(runtimeRoot, backupRoot, targetRoot, { beforePublish } = {}) {
  const selected = await runtimeValues(runtimeRoot)
  const database = await databaseModules(selected.databaseRoot)
  const backup = (await inspectNoSymlinkPath(backupRoot, 'combined backup root')).path
  const target = resolve(targetRoot)
  const liveRoots = [selected.root, selected.databaseEnv.BIOCHEMICAL_JS_STATE_ROOT, selected.inferenceEnv.BIOCHEMICAL_INFERENCE_STATE_ROOT]
  if ([backup, ...liveRoots].some((root) => inside(root, target) || inside(target, root))) throw new Error('combined restore target must not overlap backup or live runtime roots')
  await inspectNoSymlinkPath(target, 'combined restore target', { allowMissing: true })
  await mkdir(dirname(target), { recursive: true, mode: 0o700 })
  await inspectNoSymlinkPath(dirname(target), 'combined restore target parent')
  let targetMetadata = null
  try {
    const details = await lstat(target)
    if (!details.isDirectory() || details.isSymbolicLink() || (await readdir(target)).length !== 0) throw new Error('combined restore target must be absent or an empty real directory')
    targetMetadata = await lstat(target)
  } catch (error) { if (error?.code !== 'ENOENT') throw error }
  let databaseLock
  let inferenceLock
  let stage
  try {
    databaseLock = await database.acquireBackupLock(selected.databaseEnv.BIOCHEMICAL_JS_STATE_ROOT)
    inferenceLock = await acquireInferenceBackupLock(selected.inferenceEnv.BIOCHEMICAL_INFERENCE_STATE_ROOT)
    const verified = await verifyBackup(runtimeRoot, backup, { selected, database })
    stage = await mkdtemp(resolve(dirname(target), `.${target.split(sep).at(-1)}.combined-restore-`))
    await database.restoreStateBackup({ backupRoot: resolve(backup, 'database'), targetStateRoot: resolve(stage, 'database-state'), secretEnvPath: selected.databaseEnvPath, verifiedManifest: verified.databaseManifest })
    await restoreInferenceBackup({ backupRoot: resolve(backup, 'inference'), targetStateRoot: resolve(stage, 'inference-state'), secretEnvPaths: [selected.databaseEnvPath, selected.inferenceEnvPath], verifiedManifest: verified.inferenceManifest })
    const [databaseIntegrity, inferenceIntegrity] = await Promise.all([
      database.verifyDatabaseStateIntegrity(resolve(stage, 'database-state')),
      verifyInferenceStateIntegrity(resolve(stage, 'inference-state'))
    ])
    const [databaseManifest, inferenceManifest] = await Promise.all([
      database.snapshotStateManifest({ stateRoot: resolve(stage, 'database-state'), applicationVersion: verified.databaseManifest.application_version, secretEnvPath: selected.databaseEnvPath }),
      snapshotInferenceStateManifest({ stateRoot: resolve(stage, 'inference-state'), applicationVersion: verified.inferenceManifest.application_version, secretEnvPaths: [selected.databaseEnvPath, selected.inferenceEnvPath] })
    ])
    const marker = {
      restore_schema_version: 'biochemical-pair-restore-v1',
      backup_database_manifest_sha256: verified.databaseManifest.content_sha256,
      backup_database_manifest: verified.databaseManifest,
      backup_inference_manifest_sha256: verified.inferenceManifest.content_sha256,
      backup_inference_manifest: verified.inferenceManifest,
      database_manifest_sha256: databaseManifest.content_sha256,
      database_manifest: databaseManifest,
      inference_manifest_sha256: inferenceManifest.content_sha256,
      inference_manifest: inferenceManifest,
      state_directories: ['database-state', 'inference-state']
    }
    const markerPath = resolve(stage, '.biochemical-restore.json')
    await writeFile(markerPath, canonicalJson(marker), { flag: 'wx', mode: 0o600 })
    await syncPath(markerPath)
    await Promise.all([
      database.verifyRestoredState({ stateRoot: resolve(stage, 'database-state'), manifest: databaseManifest, secretEnvPath: selected.databaseEnvPath }),
      verifyRestoredInferenceState({ stateRoot: resolve(stage, 'inference-state'), manifest: inferenceManifest, secretEnvPaths: [selected.databaseEnvPath, selected.inferenceEnvPath] })
    ])
    await syncTree(stage)
    await publishDirectoryAnchored(stage, target, { metadata: targetMetadata, beforePublish: beforePublish && (() => beforePublish({ stage, target })) })
    return {
      integrity: { database: databaseIntegrity, inference: inferenceIntegrity },
      marker: {
        restore_schema_version: marker.restore_schema_version,
        backup_database_manifest_sha256: marker.backup_database_manifest_sha256,
        backup_inference_manifest_sha256: marker.backup_inference_manifest_sha256,
        database_manifest_sha256: marker.database_manifest_sha256,
        inference_manifest_sha256: marker.inference_manifest_sha256,
        state_directories: marker.state_directories
      },
      status: 'restored'
    }
  } catch (error) {
    if (stage) await removeAnchored(stage, rm, { recursive: true, force: true })
    throw error
  } finally {
    const released = await Promise.allSettled([inferenceLock?.release(), databaseLock?.release()])
    const failure = released.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
  }
}

async function disasterRecoveryTest(runtimeRoot, backupRoot, targetRoot, { candidateDatabaseRoot, candidateInferenceRoot, candidateDatabaseCommit, candidateInferenceCommit, priorDatabaseRoot, priorInferenceRoot } = {}) {
  const baseline = await verifyBackup(runtimeRoot, backupRoot)
  if (!candidateDatabaseRoot || !candidateInferenceRoot || !candidateDatabaseCommit || !candidateInferenceCommit || !priorDatabaseRoot || !priorInferenceRoot) throw new Error('upgrade rehearsal requires extracted candidate and pinned prior deployment archives')
  const selected = await runtimeValues(runtimeRoot)
  const database = await databaseModules(selected.databaseRoot)
  const databaseBaseline = JSON.parse(await readFile(resolve(selected.databaseRoot, 'service-js', 'operations', 'schema-baseline.json'), 'utf8'))
  const inferenceBaseline = JSON.parse(await readFile(resolve(inferenceRoot, 'operations', 'schema-baseline.json'), 'utf8'))
  const [candidateDatabase, candidateInference, priorDatabase, priorInference] = await Promise.all([
    deploymentIdentity(candidateDatabaseRoot, 'biochemical-db', candidateDatabaseCommit, 'candidate database deployment'),
    deploymentIdentity(candidateInferenceRoot, 'biochemical-inference', candidateInferenceCommit, 'candidate inference deployment'),
    deploymentIdentity(priorDatabaseRoot, 'biochemical-db', databaseBaseline.prior_release.commit, 'prior database deployment'),
    deploymentIdentity(priorInferenceRoot, 'biochemical-inference', inferenceBaseline.prior_release.commit, 'prior inference deployment')
  ])
  if (baseline.databaseManifest.application_version !== databaseBaseline.application_version || baseline.inferenceManifest.application_version !== inferenceBaseline.application_version) throw new Error('backup application versions do not match the consumed schema baselines')
  if (baseline.databaseManifest.roots.map((root) => root.name).join('\0') !== databaseBaseline.persistent_roots.join('\0') || baseline.inferenceManifest.roots.map((root) => root.name).join('\0') !== inferenceBaseline.persistent_roots.join('\0')) throw new Error('backup roots do not match the consumed schema baselines')
  const target = resolve(targetRoot)
  const upgrade = resolve(target, 'upgrade')
  const rollback = resolve(target, 'rollback')
  await inspectNoSymlinkPath(target, 'disaster recovery target', { allowMissing: true })
  await mkdir(target, { mode: 0o700 })
  const restart = async (state, options) => {
    let services
    try {
      services = await startServices(runtimeRoot, state, options)
      await services.stop()
      services = null
    } finally {
      await services?.stop().catch(() => undefined)
    }
  }
  await restoreBackup(runtimeRoot, backupRoot, upgrade)
  await restart(upgrade, { repositories: { database: candidateDatabase, inference: candidateInference } })
  const upgradedDatabaseIntegrity = await database.verifyDatabaseStateIntegrity(resolve(upgrade, 'database-state'))
  const upgradedIntegrity = await verifyInferenceStateIntegrity(resolve(upgrade, 'inference-state'))
  await restoreBackup(runtimeRoot, backupRoot, rollback)
  await restart(rollback, { repositories: { database: priorDatabase, inference: priorInference }, prior: true })
  const rollbackDatabaseIntegrity = await database.verifyDatabaseStateIntegrity(resolve(rollback, 'database-state'))
  const rollbackIntegrity = await verifyInferenceStateIntegrity(resolve(rollback, 'inference-state'))
  return {
    actual_process_restarts: 4,
    baseline: { database: baseline.databaseManifest.application_version, inference: baseline.inferenceManifest.application_version },
    candidate_archives: { database: candidateDatabaseCommit, inference: candidateInferenceCommit },
    pinned_prior_archives: { database: databaseBaseline.prior_release.commit, inference: inferenceBaseline.prior_release.commit },
    rollback: { database: rollbackDatabaseIntegrity, inference: rollbackIntegrity },
    status: 'passed',
    upgrade: { database: upgradedDatabaseIntegrity, inference: upgradedIntegrity }
  }
}

export { childProcess, createBackup, deploymentIdentity, disasterRecoveryTest, initialize, restoreBackup, runtimeValues, startServices, stopChild, supervise, verifyBackup }

async function main() {
  const [command, ...rest] = process.argv.slice(2)
  const selected = flags(rest)
  const databaseRoot = resolve(selected['database-repo'] ?? defaultDatabaseRoot)
  let result
  if (command === 'bootstrap') result = await bootstrap(databaseRoot)
  else if (command === 'init') result = await initialize({
    runtimeRoot: selected['runtime-root'],
    databaseRoot,
    origin: selected.origin ?? 'http://127.0.0.1:3000',
    inferenceHost: selected['inference-host'],
    inferencePort: selected['inference-port'],
    databaseHost: selected['database-host'],
    databasePort: selected['database-port']
  })
  else if (command === 'start') result = await supervise(selected['runtime-root'], selected['state-root'])
  else if (command === 'smoke') result = await smoke(selected['runtime-root'], selected['state-root'])
  else if (command === 'backup') result = await createBackup(selected['runtime-root'], selected.destination)
  else if (command === 'verify-backup') {
    const verified = await verifyBackup(selected['runtime-root'], selected.backup)
    result = { baseline: { database: verified.databaseManifest.application_version, inference: verified.inferenceManifest.application_version }, status: verified.status }
  }
  else if (command === 'restore') result = await restoreBackup(selected['runtime-root'], selected.backup, selected.target, process.env.NODE_ENV === 'test' && process.env.BIOCHEMICAL_TEST_FAIL_BEFORE_RESTORE_PUBLISH === 'true' ? { beforePublish: async () => { throw new Error('injected crash before combined restore publication') } } : {})
  else if (command === 'dr-test') result = await disasterRecoveryTest(selected['runtime-root'], selected.backup, selected.target, {
    candidateDatabaseRoot: selected['candidate-database-repo'],
    candidateInferenceRoot: selected['candidate-inference-repo'],
    candidateDatabaseCommit: selected['candidate-database-commit'],
    candidateInferenceCommit: selected['candidate-inference-commit'],
    priorDatabaseRoot: selected['prior-database-repo'],
    priorInferenceRoot: selected['prior-inference-repo']
  })
  else throw new Error('usage: operations.js bootstrap|init|start|smoke|backup|verify-backup|restore|dr-test --name value ...')
  process.stdout.write(`${JSON.stringify(result)}\n`)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) await main()
