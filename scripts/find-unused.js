#!/usr/bin/env node
// Reports unused imports and unused exports in the JavaScript modules.
// Heuristic (regex based, no parser): an exported name is "used" when it is
// imported by name, re-exported, or referenced via `import * as` anywhere in
// the repository sources, tests, scripts or Vue components.
//   node scripts/find-unused.js [--exports] [--imports]
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const SCAN_ROOTS = ['server', 'shared', 'scripts', 'src', 'tests']
const SKIP = new Set(['node_modules', 'dist', 'dist-static', 'server-dist', 'fixtures'])

function walk(directory, files = []) {
  for (const name of readdirSync(directory)) {
    if (SKIP.has(name)) continue
    const path = join(directory, name)
    const details = statSync(path)
    if (details.isDirectory()) walk(path, files)
    else if (/\.(?:js|vue)$/.test(name)) files.push(path)
  }
  return files
}

const files = SCAN_ROOTS.flatMap((name) => walk(join(root, name)))
const sources = new Map(files.map((path) => [path, readFileSync(path, 'utf8')]))
const corpus = [...sources.values()].join('\n')

const importPattern = /import\s+(?:([A-Za-z_$][\w$]*)\s*,?\s*)?(?:\{([^}]*)\}|\*\s+as\s+([A-Za-z_$][\w$]*))?\s*from\s*['"][^'"]+['"]/g
const exportPattern = /^export\s+(?:async\s+)?(?:function\*?|class|const|let|var)\s+([A-Za-z_$][\w$]*)/gm
const exportListPattern = /^export\s*\{([^}]*)\}/gm

function occurrences(text, name) {
  // Not preceded by a word character or a lone dot (property access); `...name` still counts.
  return (text.match(new RegExp(`(?<![\\w$])(?<![^.]\\.)${name.replace(/\$/g, '\\$')}(?![\\w$])`, 'g')) ?? []).length
}

function unusedImports(path, text) {
  const findings = []
  for (const match of text.matchAll(importPattern)) {
    const names = []
    if (match[1]) names.push(match[1])
    if (match[3]) names.push(match[3])
    for (const part of (match[2] ?? '').split(',')) {
      const trimmed = part.trim()
      if (!trimmed) continue
      names.push(trimmed.split(/\s+as\s+/).at(-1).trim())
    }
    for (const name of names) if (occurrences(text, name) < 2) findings.push(name)
  }
  return findings.map((name) => `${relative(root, path)}: unused import ${name}`)
}

function importedNames() {
  const names = new Set()
  for (const text of sources.values()) {
    for (const match of text.matchAll(importPattern)) {
      if (match[1]) names.add('default')
      for (const part of (match[2] ?? '').split(',')) {
        const trimmed = part.trim()
        if (trimmed) names.add(trimmed.split(/\s+as\s+/)[0].trim())
      }
    }
    for (const match of text.matchAll(/export\s*\{([^}]*)\}\s*from/g)) {
      for (const part of match[1].split(',')) if (part.trim()) names.add(part.trim().split(/\s+as\s+/)[0].trim())
    }
  }
  return names
}

function unusedExports(path, text, imported) {
  const findings = []
  const declared = [...text.matchAll(exportPattern)].map((match) => match[1])
  for (const match of text.matchAll(exportListPattern)) {
    for (const part of match[1].split(',')) if (part.trim()) declared.push(part.trim().split(/\s+as\s+/).at(-1).trim())
  }
  for (const name of declared) {
    if (imported.has(name)) continue
    // `import * as ns` consumers read any export; count a namespace import of this file as use.
    const stem = relative(join(root), path).replace(/\\/g, '/')
    const namespaced = [...sources.entries()].some(([other, otherText]) => other !== path && new RegExp(`import\\s*\\*\\s*as\\s+\\w+\\s+from\\s*['"][^'"]*${stem.split('/').at(-1).replace('.', '\\.')}['"]`).test(otherText))
    if (namespaced) continue
    if (occurrences(text, name) > 1) findings.push(`${relative(root, path)}: export ${name} is only used inside its own module`)
    else findings.push(`${relative(root, path)}: export ${name} is never used`)
  }
  return findings
}

const wantImports = process.argv.includes('--imports') || !process.argv.includes('--exports')
const wantExports = process.argv.includes('--exports') || !process.argv.includes('--imports')
const imported = importedNames()
const output = []
for (const [path, text] of sources) {
  if (path.endsWith('.vue')) continue
  if (relative(root, path).startsWith('tests/')) continue
  if (wantImports) output.push(...unusedImports(path, text))
  if (wantExports) output.push(...unusedExports(path, text, imported))
}
void corpus
process.stdout.write(`${output.sort().join('\n')}${output.length ? '\n' : ''}`)
process.exitCode = output.length ? 1 : 0
