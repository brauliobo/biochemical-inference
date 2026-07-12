import { cp, mkdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = process.cwd()
const output = resolve(root, 'server-dist')

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await Promise.all([
  cp(resolve(root, 'server'), resolve(output, 'server'), { recursive: true }),
  cp(resolve(root, 'shared'), resolve(output, 'shared'), { recursive: true })
])
