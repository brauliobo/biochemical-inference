import { randomUUID } from 'node:crypto'
import { mkdir, open, readFile, rename, rm } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { sha256Prefixed as digestBuffer } from '../commons/digest.js'

export function objectPath(root, digest) {
  const hash = digest.slice('sha256:'.length)
  return join(root, 'objects', 'sha256', hash.slice(0, 2), hash)
}

export async function createObjectStore(root, hooks = {}) {
  const stagingRoot = join(root, 'staging')
  await mkdir(stagingRoot, { recursive: true, mode: 0o700 })
  await mkdir(join(root, 'objects', 'sha256'), { recursive: true, mode: 0o700 })

  return {
    root,
    async put(value) {
      const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value)
      const digest = digestBuffer(buffer)
      const destination = objectPath(root, digest)
      try {
        if (digestBuffer(await readFile(destination)) !== digest) throw new Error(`Existing object ${digest} failed digest verification.`)
        return { digest, bytes: buffer.length, path: destination, created: false }
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error
      }
      await mkdir(dirname(destination), { recursive: true, mode: 0o700 })
      const staged = join(stagingRoot, `${randomUUID()}.tmp`)
      const handle = await open(staged, 'wx', 0o600)
      try {
        await handle.writeFile(buffer)
        await handle.sync()
      } finally {
        await handle.close()
      }
      try {
        if (digestBuffer(await readFile(staged)) !== digest) throw new Error('Staged object digest changed before publication.')
        await hooks.beforeRename?.({ staged, destination, digest, bytes: buffer.length })
        await rename(staged, destination)
        const directory = await open(dirname(destination), 'r')
        try {
          await directory.sync()
        } finally {
          await directory.close()
        }
      } catch (error) {
        await rm(staged, { force: true })
        throw error
      }
      return { digest, bytes: buffer.length, path: destination, created: true }
    },
    async get(digest) {
      const buffer = await readFile(objectPath(root, digest))
      if (digestBuffer(buffer) !== digest) throw new Error(`Stored object ${digest} failed digest verification.`)
      return buffer
    }
  }
}
