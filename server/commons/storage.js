import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { mkdir, mkdtemp, realpath } from 'node:fs/promises'
import { assertNoSymlinkAncestors, ensurePrivateDirectory } from '../data-plane/safe-path.js'
import { inside } from './paths.js'

// Resolves a service storage root that must live outside the source tree.
//   configured    explicit path (option or env); undefined selects the default
//   test          { parent, prefix }: when no path is configured, make a unique
//                 ephemeral directory under `parent`; null disables that mode
//   defaultName   directory under ~/.local/share/biochemical-inference
//   secure        true: refuse symlinked ancestors and create 0700 directories
//   inSourceError () => Error thrown when the root is inside the source tree
// Returns { root, ephemeral }.
export async function selectStorageRoot({ configured, test, defaultName, secure, inSourceError }) {
  const prepare = secure
    ? async (path) => { await assertNoSymlinkAncestors(path); await ensurePrivateDirectory(path) }
    : (path) => mkdir(path, { recursive: true, mode: 0o700 })
  if (!configured && test) {
    const parent = resolve(test.parent)
    await prepare(parent)
    const root = await mkdtemp(resolve(parent, test.prefix))
    if (secure) await ensurePrivateDirectory(root)
    return { root, ephemeral: true }
  }
  const root = resolve(configured ?? resolve(homedir(), '.local', 'share', 'biochemical-inference', defaultName))
  if (inside(resolve(process.cwd()), root)) throw inSourceError()
  await prepare(root)
  const [sourceReal, rootReal] = await Promise.all([realpath(process.cwd()), realpath(root)])
  if (inside(sourceReal, rootReal)) throw inSourceError()
  if (secure) await assertNoSymlinkAncestors(rootReal)
  return { root: rootReal, ephemeral: false }
}

// Default parent of ephemeral test roots (kept outside the repository).
export const testRootParent = (override) => override ?? resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces')
