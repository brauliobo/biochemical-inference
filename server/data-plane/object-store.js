import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { link, readdir, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { assertNoSymlinkAncestors, ensurePrivateDirectory, openDirectoryNoFollow, openRegularNoFollow, NOFOLLOW } from './safe-path.js'

const digestBuffer = (buffer) => createHash('sha256').update(buffer).digest('hex')
const STAGED_FILE = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.tmp$/

export function dataPlaneObjectPath(root, digest) {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new TypeError('Data-plane object digest must be lowercase SHA-256.')
  return join(root, 'objects', 'sha256', digest.slice(0, 2), digest)
}

async function readHandle(handle, path, digest, expectedBytes) {
  const stat = await handle.stat()
  if (!stat.isFile()) throw new Error(`Stored object ${digest} is not a regular file.`)
  if (expectedBytes !== undefined && stat.size !== expectedBytes) throw new Error(`Stored object ${digest} has an invalid byte count.`)
  const value = await handle.readFile()
  if (digestBuffer(value) !== digest) throw new Error(`Stored object ${digest} failed SHA-256 verification.`)
  if (value.length !== stat.size) throw new Error(`Stored object ${digest} changed while it was read from ${path}.`)
  return value
}

export async function createDataPlaneObjectStore(root, hooks = {}) {
  const objectRoot = join(root, 'objects')
  const shaRoot = join(objectRoot, 'sha256')
  const stagingRoot = join(root, 'staging')
  await ensurePrivateDirectory(root)
  await ensurePrivateDirectory(objectRoot)
  await ensurePrivateDirectory(shaRoot)
  await ensurePrivateDirectory(stagingRoot)

  async function verifiedRead(digest, expectedBytes) {
    const path = dataPlaneObjectPath(root, digest)
    const handle = await openRegularNoFollow(path)
    try {
      return await readHandle(handle, path, digest, expectedBytes)
    } finally {
      await handle.close()
    }
  }

  async function syncDirectory(path) {
    const directory = await openDirectoryNoFollow(path)
    try {
      await directory.sync()
    } finally {
      await directory.close()
    }
  }

  return {
    root,
    path: (digest) => dataPlaneObjectPath(root, digest),
    async put(value) {
      const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
      const digest = digestBuffer(buffer)
      const destination = dataPlaneObjectPath(root, digest)
      try {
        await verifiedRead(digest, buffer.length)
        return { digest, bytes: buffer.length, path: destination, created: false }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }

      await ensurePrivateDirectory(dirname(destination))
      const staged = join(stagingRoot, `${randomUUID()}.tmp`)
      const handle = await openRegularNoFollow(staged, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600)
      try {
        await handle.writeFile(buffer)
        await handle.chmod(0o600)
        await handle.sync()
      } finally {
        await handle.close()
      }

      try {
        const stagedHandle = await openRegularNoFollow(staged)
        try {
          await readHandle(stagedHandle, staged, digest, buffer.length)
        } finally {
          await stagedHandle.close()
        }
        await hooks.beforePublish?.({ staged, destination, digest, bytes: buffer.length })
        await assertNoSymlinkAncestors(destination)
        try {
          await link(staged, destination)
        } catch (error) {
          if (error?.code !== 'EEXIST') throw error
        }
        await verifiedRead(digest, buffer.length)
        await syncDirectory(dirname(destination))
      } finally {
        await unlink(staged).catch((error) => {
          if (error?.code !== 'ENOENT') throw error
        })
      }
      return { digest, bytes: buffer.length, path: destination, created: true }
    },
    get: verifiedRead,
    async remove(digest) {
      const path = dataPlaneObjectPath(root, digest)
      const handle = await openRegularNoFollow(path)
      try {
        await readHandle(handle, path, digest)
        await unlink(path)
      } finally {
        await handle.close()
      }
      await syncDirectory(dirname(path))
    },
    async clearStaging() {
      for (const entry of await readdir(stagingRoot, { withFileTypes: true })) {
        const path = join(stagingRoot, entry.name)
        if (!STAGED_FILE.test(entry.name) || !entry.isFile()) throw new Error(`Data-plane staging contains an unsafe or unknown entry: ${entry.name}.`)
        const handle = await openRegularNoFollow(path)
        try {
          await unlink(path)
        } finally {
          await handle.close()
        }
      }
      await syncDirectory(stagingRoot)
    },
    async inventory() {
      const objectEntries = await readdir(objectRoot, { withFileTypes: true })
      if (objectEntries.length !== 1 || objectEntries[0].name !== 'sha256' || !objectEntries[0].isDirectory()) throw new Error('Data-plane object root contains an unknown or unsafe entry.')
      const digests = []
      for (const prefix of await readdir(shaRoot, { withFileTypes: true })) {
        const prefixPath = join(shaRoot, prefix.name)
        if (!/^[a-f0-9]{2}$/.test(prefix.name) || !prefix.isDirectory()) throw new Error(`Data-plane CAS contains an unsafe prefix entry: ${prefix.name}.`)
        const directory = await openDirectoryNoFollow(prefixPath)
        await directory.close()
        for (const entry of await readdir(prefixPath, { withFileTypes: true })) {
          if (!entry.isFile() || !/^[a-f0-9]{64}$/.test(entry.name) || !entry.name.startsWith(prefix.name)) throw new Error(`Data-plane CAS contains an unsafe object entry: ${prefix.name}/${entry.name}.`)
          await verifiedRead(entry.name)
          digests.push(entry.name)
        }
      }
      return digests.sort()
    }
  }
}
