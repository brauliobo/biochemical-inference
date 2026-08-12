#!/usr/bin/env node
import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(import.meta.dirname, '..')

async function walk(directory, predicate) {
  const output = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) output.push(...await walk(path, predicate))
    else if (predicate(entry.name)) output.push(path)
  }
  return output
}

function normalized(path) {
  return path.split('\\').join('/')
}

function same(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort())
}

export function workflowActions(source) {
  return [...source.matchAll(/^\s*(?:-\s*)?uses:\s*([^\s#]+)(?:\s+#.*)?\s*$/gm)].map((match) => match[1])
}

export async function checkTestSelection() {
  const selection = JSON.parse(await readFile(resolve(root, 'test-selection.json'), 'utf8'))
  if (selection.selection_schema_version !== 'test-selection-closure-v1') throw new Error('invalid test selection schema')
  const discovered = (await walk(resolve(root, selection.test_root), (name) => /\.(?:test|spec)\.js$/.test(name)))
    .map((path) => normalized(relative(root, path))).sort()
  const acceptance = new Set(selection.categories.node_acceptance.files)
  const liveCertification = new Set(selection.categories.live_certification.files)
  const exclusions = new Map(selection.categories.exclusions.map((item) => [item.path, item.reason]))
  if (acceptance.size !== selection.categories.node_acceptance.files.length || liveCertification.size !== selection.categories.live_certification.files.length || exclusions.size !== selection.categories.exclusions.length) throw new Error('duplicate test selection entry')
  const assignments = new Map()
  for (const path of discovered) {
    const categories = []
    if (exclusions.has(path)) categories.push('exclusion')
    else {
      if (acceptance.has(path)) categories.push('node_acceptance')
      if (liveCertification.has(path)) categories.push('live_certification')
      if (path.startsWith(`${selection.categories.browser_e2e.directory}/`) && path.endsWith(selection.categories.browser_e2e.suffix)) categories.push('browser_e2e')
      if (path.endsWith('.test.js') && !acceptance.has(path) && !liveCertification.has(path)) categories.push('routine')
    }
    if (categories.length !== 1) throw new Error(`test must belong to exactly one selection category: ${path} (${categories.join(', ') || 'unselected'})`)
    assignments.set(path, categories[0])
  }
  for (const path of acceptance) if (!assignments.has(path)) throw new Error(`node acceptance selection does not exist: ${path}`)
  for (const path of liveCertification) if (!assignments.has(path)) throw new Error(`live certification selection does not exist: ${path}`)
  for (const [path, reason] of exclusions) {
    if (!assignments.has(path)) throw new Error(`test exclusion does not exist: ${path}`)
    if (typeof reason !== 'string' || reason.trim().length < 20) throw new Error(`test exclusion lacks a specific justification: ${path}`)
  }

  const packageValue = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'))
  for (const [category, scriptName] of Object.entries(selection.command_scripts)) {
    const command = packageValue.scripts?.[scriptName]
    if (typeof command !== 'string' || !command.includes('nice -n 10')) throw new Error(`${scriptName} must execute at niceness 10`)
    const workerFlag = category === 'browser_e2e' ? '--workers=1' : '--maxWorkers=1'
    if (!command.includes(workerFlag)) throw new Error(`${scriptName} must include ${workerFlag}`)
    if (category !== 'browser_e2e' && !command.includes('--no-file-parallelism')) throw new Error(`${scriptName} must disable file parallelism`)
  }
  const nodeCommand = packageValue.scripts[selection.command_scripts.node_acceptance]
  for (const path of acceptance) if (!nodeCommand.includes(path)) throw new Error(`node acceptance command omits ${path}`)
  const liveCommand = packageValue.scripts[selection.command_scripts.live_certification]
  for (const path of liveCertification) if (!liveCommand.includes(path)) throw new Error(`live certification command omits ${path}`)

  const workflows = await walk(resolve(root, '.github/workflows'), (name) => /\.ya?ml$/.test(name))
  const actions = new Set()
  for (const path of workflows) {
    const source = await readFile(path, 'utf8')
    for (const runner of source.matchAll(/^\s*runs-on:\s*([^\s#]+)\s*$/gm)) if (runner[1] !== 'ubuntu-24.04') throw new Error(`workflow runner must be ubuntu-24.04: ${normalized(relative(root, path))}`)
    for (const action of workflowActions(source)) actions.add(action)
  }
  for (const action of actions) if (!/@[0-9a-f]{40}$/.test(action)) throw new Error(`workflow action is not SHA-pinned: ${action}`)
  if (!same(actions, selection.workflow_actions)) throw new Error(`workflow action selection drift: discovered=${JSON.stringify([...actions].sort())}`)
  const certification = await readFile(resolve(root, selection.certification_workflow), 'utf8')
  for (const scriptName of Object.values(selection.command_scripts)) if (!certification.includes(`npm run ${scriptName}`)) throw new Error(`certification workflow omits ${scriptName}`)
  const sibling = selection.certification_sibling
  if (!certification.includes(`/${sibling.repository}`) || !certification.includes(`vars.${sibling.ref_variable}`) || !certification.includes('test "${#SIBLING_REF}" -eq 40')) throw new Error('certification workflow lacks an exact sibling revision pin')
  if (!certification.includes('retirement remains the strongest') && !certification.includes('retirement workflow remains the strongest')) throw new Error('certification workflow must document the stronger retirement gate')

  return {
    status: 'closed',
    tests: discovered.length,
    routine: [...assignments.values()].filter((value) => value === 'routine').length,
    node_acceptance: acceptance.size,
    live_certification: liveCertification.size,
    browser_e2e: [...assignments.values()].filter((value) => value === 'browser_e2e').length,
    exclusions: exclusions.size,
    workflow_actions: actions.size
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.stdout.write(`${JSON.stringify(await checkTestSelection())}\n`)
