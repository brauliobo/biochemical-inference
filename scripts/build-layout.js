#!/usr/bin/env node
// Build and check the hand-laid metabolic maps in src/viz/layouts/*.js.
//
//   node scripts/build-layout.js              rewrite the generated block of every layout, then check
//   node scripts/build-layout.js --check      check only; fail when a generated block is stale
//   node scripts/build-layout.js core-methylation gastric-acid     limit to named layouts
//   node scripts/build-layout.js --json       machine readable report
//
// The rules and the derivation live in scripts/layout-build.js (see its header for what is checked); this file is the command line.
import { readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { LAYOUT_DIR, ROOT, checkLayout, deriveLayout, indexEntities, layoutNames, loadLayout, replaceGenerated } from './layout-build.js'

async function main() {
  const args = process.argv.slice(2)
  const json = args.includes('--json')
  const checkOnly = args.includes('--check')
  const named = args.filter((arg) => !arg.startsWith('--'))
  const entities = (await import(pathToFileURL(join(ROOT, 'src/knowledge/data/index.js')).href)).default
  const quant = (await import(pathToFileURL(join(ROOT, 'src/knowledge/data/quant.js')).href)).default
  const byId = indexEntities(entities)
  const report = []
  let failed = false
  for (const name of named.length ? named : layoutNames()) {
    const file = join(LAYOUT_DIR, `${name}.js`)
    let layout = await loadLayout(name)
    const derivation = deriveLayout(layout, byId)
    if (!checkOnly) {
      const source = readFileSync(file, 'utf8')
      const next = replaceGenerated(source, derivation)
      if (next !== source) {
        writeFileSync(file, next)
        layout = await loadLayout(name)
      }
    }
    const issues = checkLayout(layout, entities, quant)
    const current = deriveLayout(layout, byId)
    const fresh = JSON.stringify(layout.edges) === JSON.stringify(current.edges) && JSON.stringify(layout.reactions) === JSON.stringify(current.reactions)
    if (!fresh) issues.push({ rule: 'stale-generated', id: name, message: 'generated block is out of date; run node scripts/build-layout.js' })
    const kinds = Object.fromEntries(Object.entries(Object.groupBy(layout.nodes, (node) => node.kind)).map(([kind, list]) => [kind, list.length]))
    report.push({ name, nodes: layout.nodes.length, kinds, edges: layout.edges.length, links: (layout.links ?? []).length, issues })
    if (issues.length) failed = true
  }
  if (json) process.stdout.write(`${JSON.stringify({ ok: !failed, layouts: report }, null, 2)}\n`)
  else {
    for (const item of report) {
      const kinds = Object.entries(item.kinds).map(([kind, count]) => `${kind} ${count}`).join(', ')
      process.stdout.write(`${item.issues.length ? 'FAIL' : 'ok  '} ${item.name}: ${item.nodes} nodes (${kinds}), ${item.edges} edges, ${item.links} links\n`)
      for (const issue of item.issues) process.stdout.write(`       ${issue.rule}: ${issue.id}: ${issue.message}\n`)
    }
    process.stdout.write(failed ? 'Layouts: FAILED\n' : 'Layouts: OK\n')
  }
  process.exitCode = failed ? 1 : 0
}

await main()
