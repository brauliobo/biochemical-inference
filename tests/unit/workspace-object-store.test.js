import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createObjectStore, objectPath } from '../../server/workspace/object-store.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const roots = []
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

describe('content-addressed object publication', () => {
  it('fails closed when an existing object is corrupt', async () => {
    const root = await isolatedTestRoot('workspace-object-corrupt-test')
    roots.push(root)
    const store = await createObjectStore(root)
    const content = Buffer.from('immutable object')
    const published = await store.put(content)
    await writeFile(published.path, 'corrupt')

    await expect(store.put(content)).rejects.toThrow(`Existing object ${published.digest} failed digest verification.`)
    await expect(readFile(published.path, 'utf8')).resolves.toBe('corrupt')
  })

  it('leaves no visible object or staging file when atomic rename fails', async () => {
    const root = await isolatedTestRoot('workspace-object-test')
    roots.push(root)
    const store = await createObjectStore(root, { beforeRename: () => { throw new Error('injected publication failure') } })
    const content = Buffer.from('atomic object')
    const digest = `sha256:${createHash('sha256').update(content).digest('hex')}`

    await expect(store.put(content)).rejects.toThrow('injected publication failure')
    await expect(readdir(join(root, 'staging'))).resolves.toEqual([])
    await expect(readdir(join(root, 'objects', 'sha256', digest.slice(7, 9)))).resolves.toEqual([])
    expect(objectPath(root, digest)).toContain(digest.slice(7))
  })
})
