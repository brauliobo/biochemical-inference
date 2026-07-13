import { mkdir, mkdtemp } from 'node:fs/promises'
import { resolve } from 'node:path'

const base = resolve(process.cwd(), '..', '.biochemical-inference-test-workspaces')

export async function isolatedTestRoot(prefix) {
  await mkdir(base, { recursive: true, mode: 0o700 })
  return mkdtemp(resolve(base, `${prefix}-`))
}
