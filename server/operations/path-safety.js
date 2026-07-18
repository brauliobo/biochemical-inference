import { spawn } from 'node:child_process'
import { chmod, chown, lstat, open, readdir, realpath, rename, rm, statfs, utimes } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'

export async function inspectNoSymlinkPath(path, label, { allowMissing = false, type = 'directory' } = {}) {
  const selected = resolve(path)
  const ancestors = []
  for (let current = selected; ; current = dirname(current)) {
    ancestors.push(current)
    if (dirname(current) === current) break
  }
  let exists = true
  for (const candidate of ancestors.reverse()) {
    try {
      const details = await lstat(candidate)
      if (details.isSymbolicLink()) throw new Error(`${label} cannot contain or resolve through a symlink`)
      if (candidate !== selected && !details.isDirectory()) throw new Error(`${label} has a non-directory ancestor`)
      if (candidate === selected && type === 'directory' && !details.isDirectory()) throw new Error(`${label} must be a directory`)
      if (candidate === selected && type === 'file' && !details.isFile()) throw new Error(`${label} must be a regular file`)
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error
      if (candidate === selected) exists = false
    }
  }
  if (!exists && !allowMissing) throw new Error(`${label} must exist`)
  if (exists && await realpath(selected) !== selected) throw new Error(`${label} must resolve to its exact configured path`)
  return Object.freeze({ exists, path: selected })
}

export async function syncPath(path) {
  const handle = await open(path, 'r')
  try { await handle.sync() } finally { await handle.close() }
}

export async function syncTree(path) {
  const selected = (await inspectNoSymlinkPath(path, 'durability tree')).path
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const child = resolve(directory, entry.name)
      if (entry.isSymbolicLink()) throw new Error('durability tree cannot contain symlinks')
      if (entry.isDirectory()) await visit(child)
      else if (entry.isFile()) await syncPath(child)
      else throw new Error('durability tree cannot contain special files')
    }
    await syncPath(directory)
  }
  await visit(selected)
}

const UNSAFE_FILESYSTEMS = new Set([0x6969n, 0x517bn, 0xff534d42n, 0x65735546n, 0x01021997n])

export async function assertSafeLocalFilesystem(path, label) {
  const selected = (await inspectNoSymlinkPath(path, label)).path
  const filesystem = await statfs(selected, { bigint: true })
  if (UNSAFE_FILESYSTEMS.has(filesystem.type)) throw new Error(`${label} must use a local filesystem with reliable inode, link, and atomic-rename semantics`)
  const handle = await open(selected, 'r')
  try {
    const anchor = `/proc/self/fd/${handle.fd}`
    if (await realpath(anchor) !== selected) throw new Error(`${label} cannot be anchored through /proc/self/fd`)
  } finally { await handle.close() }
  return selected
}

export async function withDirectoryAnchor(path, label, operation) {
  const selected = await assertSafeLocalFilesystem(path, label)
  const handle = await open(selected, 'r')
  try { return await operation(`/proc/self/fd/${handle.fd}`) } finally { await handle.close() }
}

export async function renameAnchored(source, target, rename) {
  if (dirname(resolve(source)) !== dirname(resolve(target))) throw new Error('anchored rename requires one parent directory')
  return withDirectoryAnchor(dirname(resolve(source)), 'rename parent', (anchor) => rename(resolve(anchor, basename(source)), resolve(anchor, basename(target))))
}

export async function removeAnchored(path, remove, options) {
  return withDirectoryAnchor(dirname(resolve(path)), 'removal parent', (anchor) => remove(resolve(anchor, basename(path)), options))
}

function exchangeDirectories(source, target) {
  return new Promise((resolvePromise, reject) => {
    const externalSource = source.replace('/proc/self/', `/proc/${process.pid}/`)
    const externalTarget = target.replace('/proc/self/', `/proc/${process.pid}/`)
    const child = spawn('mv', ['--exchange', '--no-copy', '-T', externalSource, externalTarget], { env: { ...process.env, LC_ALL: 'C' }, stdio: ['ignore', 'ignore', 'pipe'] })
    const stderr = []
    child.stderr.on('data', (value) => stderr.push(value))
    child.once('error', reject)
    child.once('exit', (code, signal) => {
      if (code === 0) return resolvePromise()
      const message = Buffer.concat(stderr).toString('utf8').trim() || `mv --exchange exited with ${code ?? signal}`
      const error = new Error(message)
      error.exchangeUnavailable = /unrecognized option|unknown option|Function not implemented|Operation not supported|Invalid argument/.test(message)
      reject(error)
    })
  })
}

export async function publishDirectoryAnchored(source, target, { metadata = null, beforePublish } = {}) {
  if (dirname(resolve(source)) !== dirname(resolve(target))) throw new Error('anchored publication requires one parent directory')
  if (metadata) {
    await chown(source, metadata.uid, metadata.gid)
    await chmod(source, metadata.mode & 0o7777)
    await utimes(source, metadata.atime, metadata.mtime)
    await syncPath(source)
  }
  await beforePublish?.({ source, target })
  let exchanged = false
  if (metadata) {
    await withDirectoryAnchor(dirname(resolve(source)), 'publication parent', async (anchor) => {
      const anchoredSource = resolve(anchor, basename(source))
      const anchoredTarget = resolve(anchor, basename(target))
      try {
        await exchangeDirectories(anchoredSource, anchoredTarget)
        exchanged = true
      } catch (exchangeError) {
        if (exchangeError?.code !== 'ENOENT' && !exchangeError?.exchangeUnavailable) throw exchangeError
        try { await rename(anchoredSource, anchoredTarget) } catch (renameError) { renameError.cause = exchangeError; throw renameError }
      }
    })
  } else await renameAnchored(source, target, rename)
  await syncPath(dirname(target))
  if (exchanged) {
    await removeAnchored(source, rm, { recursive: true })
    await syncPath(dirname(target))
  }
}
