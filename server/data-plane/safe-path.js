import { constants } from 'node:fs'
import { link, lstat, mkdir, open, readdir, unlink } from 'node:fs/promises'
import { parse, resolve } from 'node:path'

const NOFOLLOW = constants.O_NOFOLLOW ?? 0
const DIRECTORY = constants.O_DIRECTORY ?? 0
const PROC_FD = '/proc/self/fd'
const SAFE_SEGMENT = /^(?!\.{1,2}$)[A-Za-z0-9.][A-Za-z0-9_.-]*$/

function unsafe(path, reason) {
  return new Error(`Unsafe data-plane path ${path}: ${reason}.`)
}

function segments(value) {
  if (value === '') return []
  if (typeof value !== 'string' || value.startsWith('/') || value.split('/').some((segment) => !SAFE_SEGMENT.test(segment) || segment === '.' || segment === '..')) throw unsafe(value, 'relative path segments are invalid')
  return value.split('/')
}

const descriptorPath = (handle, name = '') => `${PROC_FD}/${handle.fd}${name ? `/${name}` : ''}`

async function openDirectoryDescriptor(path, label) {
  let handle
  try { handle = await open(path, constants.O_RDONLY | DIRECTORY | NOFOLLOW) }
  catch (error) {
    if (['ELOOP', 'ENOTDIR'].includes(error?.code)) throw unsafe(label, 'symbolic links are forbidden or an ancestor is not a directory')
    throw error
  }
  const stat = await handle.stat()
  if (!stat.isDirectory()) {
    await handle.close()
    throw unsafe(label, 'expected a directory')
  }
  return handle
}

async function duplicateDirectory(handle, label) {
  const duplicate = await open(descriptorPath(handle), constants.O_RDONLY | DIRECTORY)
  const stat = await duplicate.stat()
  if (!stat.isDirectory()) { await duplicate.close(); throw unsafe(label, 'expected a pinned directory') }
  return duplicate
}

async function childDirectory(parent, name, { create = false, mode = 0o700 } = {}) {
  const path = descriptorPath(parent, name)
  let created = false
  if (create) {
    try { await mkdir(path, { mode }); created = true } catch (error) { if (error?.code !== 'EEXIST') throw error }
  }
  const handle = await openDirectoryDescriptor(path, name)
  if (created) await handle.chmod(mode)
  return handle
}

async function traverseFrom(start, names, options = {}) {
  let current = await duplicateDirectory(start, options.label ?? 'pinned directory')
  try {
    for (const name of names) {
      const next = await childDirectory(current, name, options)
      await current.close()
      current = next
    }
    return current
  } catch (error) {
    await current.close().catch(() => undefined)
    throw error
  }
}

export class PinnedDirectory {
  constructor(path, handle, identity) {
    this.path = path
    this.handle = handle
    this.identity = identity
    this.closed = false
  }

  async directory(relativePath = '', options = {}) {
    if (this.closed) throw unsafe(this.path, 'pinned directory is closed')
    return traverseFrom(this.handle, segments(relativePath), { ...options, label: relativePath || this.path })
  }

  async openFile(relativePath, flags = constants.O_RDONLY, mode = 0o600) {
    const names = segments(relativePath)
    if (!names.length) throw unsafe(relativePath, 'file path is empty')
    const name = names.pop()
    const parent = await traverseFrom(this.handle, names, { label: relativePath })
    try {
      const handle = await open(descriptorPath(parent, name), flags | NOFOLLOW, mode)
      const stat = await handle.stat()
      if (!stat.isFile()) {
        await handle.close()
        throw unsafe(relativePath, 'expected a regular file')
      }
      return handle
    } finally { await parent.close() }
  }

  async readFile(relativePath, maximumBytes, { allowEmpty = false } = {}) {
    const handle = await this.openFile(relativePath)
    try {
      const before = await handle.stat()
      if ((!allowEmpty && before.size < 1) || before.size > maximumBytes) throw unsafe(relativePath, 'file exceeds its byte boundary')
      const bytes = await handle.readFile()
      const after = await handle.stat()
      if (bytes.length !== before.size || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeNs !== after.mtimeNs) throw unsafe(relativePath, 'file changed while it was read')
      return bytes
    } finally { await handle.close() }
  }

  async createDirectory(relativePath, mode = 0o700) {
    const handle = await this.directory(relativePath, { create: true, mode })
    try { await handle.chmod(mode) } finally { await handle.close() }
  }

  async unlink(relativePath) {
    const names = segments(relativePath)
    const name = names.pop()
    const parent = await traverseFrom(this.handle, names, { label: relativePath })
    try { await unlink(descriptorPath(parent, name)) } finally { await parent.close() }
  }

  async linkNoReplace(sourcePath, destinationPath) {
    const sourceNames = segments(sourcePath)
    const destinationNames = segments(destinationPath)
    const sourceName = sourceNames.pop()
    const destinationName = destinationNames.pop()
    const [sourceParent, destinationParent] = await Promise.all([
      traverseFrom(this.handle, sourceNames, { label: sourcePath }),
      traverseFrom(this.handle, destinationNames, { label: destinationPath })
    ])
    try { await link(descriptorPath(sourceParent, sourceName), descriptorPath(destinationParent, destinationName)) }
    finally { await Promise.all([sourceParent.close(), destinationParent.close()]) }
  }

  async entries(relativePath = '') {
    const directory = await this.directory(relativePath)
    try {
      const entries = await readdir(descriptorPath(directory), { withFileTypes: true })
      return entries.map((entry) => ({ name: entry.name, file: entry.isFile(), directory: entry.isDirectory(), symlink: entry.isSymbolicLink() }))
    } finally { await directory.close() }
  }

  async sync(relativePath = '') {
    const handle = await this.directory(relativePath)
    try { await handle.sync() } finally { await handle.close() }
  }

  async listTree({ maximumEntries, maximumDepth }) {
    const output = []
    const walk = async (directory, prefix, depth) => {
      if (depth > maximumDepth) throw unsafe(prefix, 'directory depth exceeds its limit')
      const entries = await readdir(descriptorPath(directory), { withFileTypes: true })
      for (const entry of entries) {
        if (!SAFE_SEGMENT.test(entry.name)) throw unsafe(`${prefix}${entry.name}`, 'entry name is invalid')
        const path = `${prefix}${entry.name}`
        if (entry.isSymbolicLink()) throw unsafe(path, 'symbolic links are forbidden')
        if (entry.isDirectory()) {
          const child = await childDirectory(directory, entry.name)
          try { await walk(child, `${path}/`, depth + 1) } finally { await child.close() }
        } else if (entry.isFile()) output.push(path)
        else throw unsafe(path, 'entry is not a regular file or directory')
        if (output.length > maximumEntries) throw unsafe(this.path, 'directory entry count exceeds its limit')
      }
    }
    const root = await this.directory()
    try { await walk(root, '', 0) } finally { await root.close() }
    return output.sort()
  }

  async assertPathIdentity() {
    const current = await openPinnedDirectory(this.path)
    try {
      if (current.identity.dev !== this.identity.dev || current.identity.ino !== this.identity.ino) throw unsafe(this.path, 'named path no longer identifies the pinned directory')
    } finally { await current.close() }
  }

  async close() {
    if (this.closed) return
    this.closed = true
    await this.handle.close()
  }
}

export async function openPinnedDirectory(value, { create = false, mode = 0o700 } = {}) {
  const path = resolve(value)
  const parsed = parse(path)
  const names = path.slice(parsed.root.length).split('/').filter(Boolean)
  let current = await openDirectoryDescriptor(parsed.root, parsed.root)
  try {
    for (const name of names) {
      if (!SAFE_SEGMENT.test(name)) throw unsafe(path, `invalid path segment ${name}`)
      const next = await childDirectory(current, name, { create, mode })
      await current.close()
      current = next
    }
    const identity = await current.stat()
    if (create) await current.chmod(mode)
    return new PinnedDirectory(path, current, { dev: identity.dev, ino: identity.ino })
  } catch (error) {
    await current.close().catch(() => undefined)
    throw error
  }
}

// Legacy helpers remain for services that hold no filesystem authority after setup.
export async function assertNoSymlinkAncestors(value) {
  const path = resolve(value)
  const parsed = parse(path)
  let current = parsed.root
  for (const name of path.slice(parsed.root.length).split('/').filter(Boolean)) {
    current = resolve(current, name)
    let stat
    try { stat = await lstat(current) } catch (error) { if (error?.code === 'ENOENT') return path; throw error }
    if (stat.isSymbolicLink()) throw unsafe(current, 'symbolic links are forbidden')
    if (current !== path && !stat.isDirectory()) throw unsafe(current, 'an ancestor is not a directory')
  }
  return path
}

export async function openDirectoryNoFollow(value) {
  const directory = await openPinnedDirectory(value)
  const handle = directory.handle
  directory.closed = true
  return handle
}

export async function openRegularNoFollow(value, flags = constants.O_RDONLY, mode = 0o600) {
  const path = resolve(value)
  const parsed = parse(path)
  const names = path.slice(parsed.root.length).split('/').filter(Boolean)
  const name = names.pop()
  const parent = await openPinnedDirectory(resolve(parsed.root, ...names))
  try { return await parent.openFile(name, flags, mode) } finally { await parent.close() }
}

export async function ensurePrivateDirectory(value) {
  const directory = await openPinnedDirectory(value, { create: true, mode: 0o700 })
  await directory.close()
  return resolve(value)
}

export async function assertRegularOrMissing(value) {
  const path = resolve(value)
  try {
    const handle = await openRegularNoFollow(path)
    await handle.close()
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  return path
}

export { NOFOLLOW }
