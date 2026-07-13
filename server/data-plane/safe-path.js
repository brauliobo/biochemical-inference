import { constants } from 'node:fs'
import { chmod, lstat, mkdir, open } from 'node:fs/promises'
import { parse, resolve } from 'node:path'

const NOFOLLOW = constants.O_NOFOLLOW ?? 0
const DIRECTORY = constants.O_DIRECTORY ?? 0

function unsafe(path, reason) {
  return new Error(`Unsafe data-plane path ${path}: ${reason}.`)
}

async function pathStat(path) {
  try {
    return await lstat(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

export async function assertNoSymlinkAncestors(value) {
  const path = resolve(value)
  const root = parse(path).root
  const segments = path.slice(root.length).split('/').filter(Boolean)
  let current = root
  let missing = false
  for (const segment of segments) {
    current = resolve(current, segment)
    if (missing) continue
    const stat = await pathStat(current)
    if (!stat) {
      missing = true
      continue
    }
    if (stat.isSymbolicLink()) throw unsafe(current, 'symbolic links are forbidden')
    if (current !== path && !stat.isDirectory()) throw unsafe(current, 'an ancestor is not a directory')
  }
  return path
}

export async function openDirectoryNoFollow(value) {
  const path = await assertNoSymlinkAncestors(value)
  const handle = await open(path, constants.O_RDONLY | DIRECTORY | NOFOLLOW)
  const stat = await handle.stat()
  if (!stat.isDirectory()) {
    await handle.close()
    throw unsafe(path, 'expected a directory')
  }
  return handle
}

export async function openRegularNoFollow(value, flags = constants.O_RDONLY, mode = 0o600) {
  const path = await assertNoSymlinkAncestors(value)
  const handle = await open(path, flags | NOFOLLOW, mode)
  const stat = await handle.stat()
  if (!stat.isFile()) {
    await handle.close()
    throw unsafe(path, 'expected a regular file')
  }
  return handle
}

export async function ensurePrivateDirectory(value) {
  const path = await assertNoSymlinkAncestors(value)
  await mkdir(path, { recursive: true, mode: 0o700 })
  await assertNoSymlinkAncestors(path)
  await chmod(path, 0o700)
  const handle = await openDirectoryNoFollow(path)
  await handle.close()
  return path
}

export async function assertRegularOrMissing(value) {
  const path = await assertNoSymlinkAncestors(value)
  const stat = await pathStat(path)
  if (stat && !stat.isFile()) throw unsafe(path, 'expected a regular file or a missing path')
  return path
}

export { NOFOLLOW }
