import { readdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const files = ['playwright.config.js', 'vite.config.js']

async function collect(directory) {
  for (const entry of await readdir(resolve(root, directory), { withFileTypes: true })) {
    const relativePath = `${directory}/${entry.name}`
    if (entry.isDirectory()) await collect(relativePath)
    else if (entry.name.endsWith('.js')) files.push(relativePath)
  }
}

for (const directory of ['server', 'shared', 'src', 'tests']) await collect(directory)

for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ['--check', file], { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout)
    process.exit(result.status ?? 1)
  }
}

console.log(`Syntax checked ${files.length} JavaScript files.`)
