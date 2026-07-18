import { randomUUID } from 'node:crypto'
import { lstat, mkdir, readFile, readdir, rename, rmdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { inspectNoSymlinkPath, syncPath } from './path-safety.js'

const LOCK_NAME = '.biochemical-inference.lock'
const LOCK_ROLES = new Set(['backup', 'runtime'])

function processExists(pid, processTarget) {
  try {
    processTarget.kill(pid, 0)
    return true
  } catch (error) {
    return error?.code === 'EPERM'
  }
}

async function readOwner(lockPath) {
  const details = await lstat(lockPath)
  if (!details.isDirectory() || details.isSymbolicLink()) throw new Error('Inference operation lock is not a real directory.')
  const entries = await readdir(lockPath, { withFileTypes: true })
  if (entries.length !== 1 || entries[0].name !== 'owner.json' || !entries[0].isFile()) throw new Error('Inference operation lock contents are invalid; inspect it before manual removal.')
  let owner
  try { owner = JSON.parse(await readFile(resolve(lockPath, 'owner.json'), 'utf8')) } catch (cause) { throw new Error('Inference operation lock owner is unreadable; inspect it before manual removal.', { cause }) }
  if (!Number.isSafeInteger(owner?.pid) || owner.pid < 1 || typeof owner.token !== 'string' || !/^[0-9a-f-]{36}$/.test(owner.token) || !LOCK_ROLES.has(owner.role)) throw new Error('Inference operation lock owner is invalid; inspect it before manual removal.')
  return owner
}

export async function acquireInferenceOperationLock(stateRoot, role, { processTarget = process } = {}) {
  if (!LOCK_ROLES.has(role)) throw new TypeError('Inference operation lock role is invalid.')
  const inspected = await inspectNoSymlinkPath(stateRoot, 'Inference state root', { allowMissing: true })
  await mkdir(inspected.path, { recursive: true, mode: 0o700 })
  const root = (await inspectNoSymlinkPath(inspected.path, 'Inference state root')).path
  const owner = Object.freeze({ pid: processTarget.pid, role, token: randomUUID() })
  const lockPath = resolve(root, LOCK_NAME)
  const candidate = resolve(root, `${LOCK_NAME}.candidate-${owner.token}`)
  await mkdir(candidate, { mode: 0o700 })
  try {
    const ownerPath = resolve(candidate, 'owner.json')
    await writeFile(ownerPath, `${JSON.stringify(owner)}\n`, { flag: 'wx', mode: 0o600 })
    await syncPath(ownerPath)
    await syncPath(candidate)
    try {
      await rename(candidate, lockPath)
      await syncPath(root)
    } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY'].includes(error?.code)) throw error
      const current = await readOwner(lockPath)
      const state = processExists(current.pid, processTarget) ? 'active' : 'stale'
      throw new Error(`Inference state root has a ${state} ${current.role} lock owned by pid ${current.pid} and token ${current.token}; stale locks require explicit operator removal.`)
    }
  } catch (error) {
    await unlink(resolve(candidate, 'owner.json')).catch((failure) => { if (failure?.code !== 'ENOENT') throw failure })
    await rmdir(candidate).catch((failure) => { if (failure?.code !== 'ENOENT') throw failure })
    throw error
  }

  let released = false
  return Object.freeze({
    path: lockPath,
    role,
    token: owner.token,
    async release() {
      if (released) return
      const observed = await readOwner(lockPath)
      if (observed.token !== owner.token || observed.pid !== owner.pid || observed.role !== owner.role) throw new Error('Inference operation lock ownership changed before release.')
      const releasePath = resolve(root, `${LOCK_NAME}.release-${owner.token}`)
      await rename(lockPath, releasePath)
      const current = await readOwner(releasePath)
      if (current.token !== owner.token || current.pid !== owner.pid || current.role !== owner.role) throw new Error('Inference operation lock ownership changed before release.')
      await unlink(resolve(releasePath, 'owner.json'))
      await rmdir(releasePath)
      await syncPath(root)
      released = true
    }
  })
}

export const acquireInferenceRuntimeLock = (stateRoot, options) => acquireInferenceOperationLock(stateRoot, 'runtime', options)
export const acquireInferenceBackupLock = (stateRoot, options) => acquireInferenceOperationLock(stateRoot, 'backup', options)

export async function assertInferenceOperationLock(lock, stateRoot, role) {
  const lockPath = inferenceOperationLockPath(resolve(stateRoot))
  if (!lock || lock.path !== lockPath || lock.role !== role || typeof lock.token !== 'string') throw new Error(`inference ${role} operation lock handle is invalid`)
  const owner = await readOwner(lockPath)
  if (owner.token !== lock.token || owner.role !== role) throw new Error(`inference ${role} operation lock token is not the published owner`)
}

export function inferenceOperationLockPath(stateRoot) {
  return resolve(stateRoot, LOCK_NAME)
}
