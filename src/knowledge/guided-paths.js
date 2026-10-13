// Guided paths: curated reading lists through the graph (data in data/paths.js).
//   { id, title, summary, steps: [{ id: '<entity id>', why: 'one or two sentences' }] }
// This module checks them against a graph and builds the view models. It is framework-free and
// does not import zod, so it can ship in the browser bundle next to the rest of the engine.
import { typeLabel } from './types.js'
import { isId } from './ids.js'

export const PATH_RULES = Object.freeze({
  'path-schema': { severity: 'error', title: 'Guided paths that break the contract' },
  'path-duplicate-id': { severity: 'error', title: 'Duplicate guided path ids' },
  'path-dangling-step': { severity: 'error', title: 'Guided path steps pointing at missing entities' },
  'path-duplicate-step': { severity: 'error', title: 'Guided paths that visit one entity twice' }
})

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PATH_FIELDS = new Set(['id', 'title', 'summary', 'steps'])
const STEP_FIELDS = new Set(['id', 'why'])
export const PATH_LIMITS = Object.freeze({ minSteps: 3, maxSteps: 30, summary: 300, why: 400 })

const isText = (value) => typeof value === 'string' && value.trim().length > 0

/**
 * Check a list of guided paths against a built graph.
 * Returns [{ rule, severity, id, path, message }] (same shape as validateKnowledge issues; empty when fine).
 */
export function checkPaths(paths, graph) {
  const issues = []
  const add = (rule, id, message, path = '') => issues.push({ rule, severity: PATH_RULES[rule].severity, id, path, message })
  if (!Array.isArray(paths)) {
    add('path-schema', '', 'guided paths must be an array')
    return issues
  }
  const seen = new Map()
  paths.forEach((item, index) => {
    const label = isText(item?.id) ? `path:${item.id}` : `path:#${index}`
    if (item === null || typeof item !== 'object' || Array.isArray(item)) return add('path-schema', label, 'a path must be an object')
    for (const key of Object.keys(item)) if (!PATH_FIELDS.has(key)) add('path-schema', label, `unknown field '${key}'`, key)
    if (!isText(item.id) || !SLUG.test(item.id)) add('path-schema', label, "id must be a kebab-case slug such as 'my-path'", 'id')
    else seen.set(item.id, (seen.get(item.id) ?? 0) + 1)
    if (!isText(item.title)) add('path-schema', label, 'title is required', 'title')
    if (!isText(item.summary)) add('path-schema', label, 'summary is required', 'summary')
    else if (item.summary.length > PATH_LIMITS.summary) add('path-schema', label, `summary must be at most ${PATH_LIMITS.summary} characters (is ${item.summary.length})`, 'summary')
    if (!Array.isArray(item.steps)) return add('path-schema', label, 'steps must be an array', 'steps')
    if (item.steps.length < PATH_LIMITS.minSteps || item.steps.length > PATH_LIMITS.maxSteps) {
      add('path-schema', label, `a path needs ${PATH_LIMITS.minSteps}-${PATH_LIMITS.maxSteps} steps (has ${item.steps.length})`, 'steps')
    }
    const visited = new Set()
    item.steps.forEach((step, position) => {
      const where = `steps[${position}]`
      if (step === null || typeof step !== 'object' || Array.isArray(step)) return add('path-schema', label, 'a step must be an object', where)
      for (const key of Object.keys(step)) if (!STEP_FIELDS.has(key)) add('path-schema', label, `unknown step field '${key}'`, `${where}.${key}`)
      if (!isText(step.why)) add('path-schema', label, 'every step needs a why', `${where}.why`)
      else if (step.why.length > PATH_LIMITS.why) add('path-schema', label, `why must be at most ${PATH_LIMITS.why} characters (is ${step.why.length})`, `${where}.why`)
      if (!isText(step.id) || !isId(step.id)) return add('path-schema', label, `step id '${step.id}' is not a valid entity id`, `${where}.id`)
      if (!graph.has(step.id)) add('path-dangling-step', label, `step '${step.id}' does not exist`, `${where}.id`)
      if (visited.has(step.id)) add('path-duplicate-step', label, `'${step.id}' appears twice`, `${where}.id`)
      visited.add(step.id)
    })
  })
  for (const [id, count] of seen) if (count > 1) add('path-duplicate-id', `path:${id}`, `path id is defined ${count} times`)
  return issues
}

function stepEntity(graph, id) {
  const entity = graph.get(id)
  return { id: entity.id, type: entity.type, typeLabel: typeLabel(entity.type), name: entity.name, summary: entity.summary, evidence: entity.evidence }
}

/** Card for a path in a list: no entity detail. */
export function pathCard(path) {
  return { id: path.id, title: path.title, summary: path.summary, length: path.steps.length }
}

/**
 * Full model of one path: every step resolved to an entity card, in order.
 * Steps whose entity is missing are dropped (validation reports them). Returns null for an unknown path.
 */
export function pathModel(graph, path) {
  if (!path) return null
  const steps = path.steps
    .filter((step) => graph.has(step.id))
    .map((step, index) => ({ position: index + 1, id: step.id, why: step.why, entity: stepEntity(graph, step.id) }))
  const types = {}
  for (const step of steps) types[step.entity.type] = (types[step.entity.type] ?? 0) + 1
  return { id: path.id, title: path.title, summary: path.summary, length: steps.length, types, steps }
}

/** Cards for all paths, in authoring order. */
export function pathListModel(paths) {
  return paths.map(pathCard)
}

/** Paths that visit an entity, each with the position and the reason given for it. */
export function pathsContaining(paths, id) {
  const found = []
  for (const path of paths) {
    const index = path.steps.findIndex((step) => step.id === id)
    if (index >= 0) found.push({ ...pathCard(path), position: index + 1, why: path.steps[index].why })
  }
  return found
}
