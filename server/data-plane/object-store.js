import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { openPinnedDirectory, NOFOLLOW } from './safe-path.js'

const digestBuffer = (buffer) => createHash('sha256').update(buffer).digest('hex')
const STAGED_FILE = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.tmp$/

export function dataPlaneObjectPath(root, digest) {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new TypeError('Data-plane object digest must be lowercase SHA-256.')
  return join(root, 'objects', 'sha256', digest.slice(0, 2), digest)
}

async function readHandle(handle, label, digest, expectedBytes) {
  const before = await handle.stat()
  if (!before.isFile()) throw new Error(`Stored object ${digest} is not a regular file.`)
  if (expectedBytes !== undefined && before.size !== expectedBytes) throw new Error(`Stored object ${digest} has an invalid byte count.`)
  const value = await handle.readFile()
  const after = await handle.stat()
  if (digestBuffer(value) !== digest) throw new Error(`Stored object ${digest} failed SHA-256 verification.`)
  if (value.length !== before.size || before.dev !== after.dev || before.ino !== after.ino || before.size !== after.size || before.mtimeMs !== after.mtimeMs) throw new Error(`Stored object ${digest} changed while it was read from ${label}.`)
  return value
}

export async function createDataPlaneObjectStore(root, hooks = {}) {
  const directory = await openPinnedDirectory(root, { create: true, mode: 0o700 })
  try {
    await directory.createDirectory('objects')
    await directory.createDirectory('objects/sha256')
    await directory.createDirectory('staging')
  } catch (error) {
    await directory.close()
    throw error
  }

  const objectRelativePath = (digest) => {
    if (!/^[a-f0-9]{64}$/.test(digest)) throw new TypeError('Data-plane object digest must be lowercase SHA-256.')
    return `objects/sha256/${digest.slice(0, 2)}/${digest}`
  }

  async function verifiedRead(digest, expectedBytes) {
    const relativePath = objectRelativePath(digest)
    const handle = await directory.openFile(relativePath)
    try {
      const value = await readHandle(handle, relativePath, digest, expectedBytes)
      await hooks.afterRead?.({ digest, bytes: value.length })
      await directory.assertPathIdentity()
      return value
    } finally { await handle.close() }
  }

  return {
    root,
    path: (digest) => dataPlaneObjectPath(root, digest),
    async put(value) {
      const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
      const digest = digestBuffer(buffer)
      const destination = objectRelativePath(digest)
      try {
        await verifiedRead(digest, buffer.length)
        return { digest, bytes: buffer.length, path: dataPlaneObjectPath(root, digest), created: false }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }

      await directory.createDirectory(`objects/sha256/${digest.slice(0, 2)}`)
      const staged = `staging/${randomUUID()}.tmp`
      const handle = await directory.openFile(staged, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600)
      try {
        await handle.writeFile(buffer)
        await handle.chmod(0o600)
        await handle.sync()
      } finally { await handle.close() }

      let created = true
      try {
        const stagedHandle = await directory.openFile(staged)
        try { await readHandle(stagedHandle, staged, digest, buffer.length) }
        finally { await stagedHandle.close() }
        await hooks.beforePublish?.({
          digest,
          bytes:       buffer.length,
          destination: dataPlaneObjectPath(root, digest),
          staged:      join(root, staged)
        })
        await directory.assertPathIdentity()
        try { await directory.linkNoReplace(staged, destination) }
        catch (error) { if (error?.code === 'EEXIST') created = false; else throw error }
        await verifiedRead(digest, buffer.length)
        await directory.sync(`objects/sha256/${digest.slice(0, 2)}`)
        await directory.assertPathIdentity()
      } finally {
        await directory.unlink(staged).catch((error) => { if (error?.code !== 'ENOENT') throw error })
      }
      return { digest, bytes: buffer.length, path: dataPlaneObjectPath(root, digest), created }
    },
    get: verifiedRead,
    async remove(digest) {
      await verifiedRead(digest)
      await directory.unlink(objectRelativePath(digest))
      await directory.sync(`objects/sha256/${digest.slice(0, 2)}`)
      await directory.assertPathIdentity()
    },
    async clearStaging() {
      for (const entry of await directory.entries('staging')) {
        if (!STAGED_FILE.test(entry.name) || !entry.file || entry.directory || entry.symlink) throw new Error(`Data-plane staging contains an unsafe or unknown entry: ${entry.name}.`)
        await directory.unlink(`staging/${entry.name}`)
      }
      await directory.sync('staging')
      await directory.assertPathIdentity()
    },
    async inventory() {
      const objectEntries = await directory.entries('objects')
      if (objectEntries.length !== 1 || objectEntries[0].name !== 'sha256' || !objectEntries[0].directory) throw new Error('Data-plane object root contains an unknown or unsafe entry.')
      const digests = []
      for (const prefix of await directory.entries('objects/sha256')) {
        if (!/^[a-f0-9]{2}$/.test(prefix.name) || !prefix.directory || prefix.symlink) throw new Error(`Data-plane CAS contains an unsafe prefix entry: ${prefix.name}.`)
        for (const entry of await directory.entries(`objects/sha256/${prefix.name}`)) {
          if (!entry.file || !/^[a-f0-9]{64}$/.test(entry.name) || !entry.name.startsWith(prefix.name)) throw new Error(`Data-plane CAS contains an unsafe object entry: ${prefix.name}/${entry.name}.`)
          await verifiedRead(entry.name)
          digests.push(entry.name)
        }
      }
      await directory.assertPathIdentity()
      return digests.sort()
    },
    close: () => directory.close()
  }
}
