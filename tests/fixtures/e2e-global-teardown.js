import { rm } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

export default async function globalTeardown() {
  const root = resolve(process.env.E2E_RUNTIME_ROOT)
  const source = resolve(process.cwd())
  const path = relative(source, root)
  if (path === '' || (!path.startsWith(`..${sep}`) && path !== '..' && !isAbsolute(path))) throw new Error(`Refusing to remove E2E runtime inside the source tree: ${root}`)
  await rm(root, { recursive: true, force: true, maxRetries: 3 })
}
