import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import guidedPaths from '../../src/knowledge/data/paths.js'
import { buildGraph } from '../../src/knowledge/graph.js'
import { PATH_LIMITS, checkPaths, pathCard, pathListModel, pathModel, pathsContaining } from '../../src/knowledge/guided-paths.js'
import { formatReport, validateKnowledge } from '../../src/knowledge/validate.js'
import * as knowledge from '../../src/knowledge/index.js'
import { fixture } from '../fixtures/knowledge/helpers.js'

const graph = buildGraph(entities)
const small = buildGraph(fixture())
const step = (id, why = 'A reason that is long enough to read.') => ({ id, why })
const good = () => ({
  id: 'demo-path',
  title: 'Demo',
  summary: 'A demonstration path.',
  steps: [step('compound:glycine'), step('enzyme:gnmt'), step('compound:sam')]
})
const rulesOf = (paths) => checkPaths(paths, small).map((issue) => issue.rule)

describe('data/paths.js', () => {
  it('validates with no issues against the real graph', () => {
    expect(checkPaths(guidedPaths, graph)).toEqual([])
    const report = validateKnowledge(entities, { paths: guidedPaths })
    expect(report.ok).toBe(true)
    expect(report.counts.paths).toBe(guidedPaths.length)
  })

  it('offers the paths the site was asked to have', () => {
    const titles = guidedPaths.map((item) => item.title)
    expect(titles).toEqual(expect.arrayContaining(['The glycine-belching question', 'Methyl budget: who spends the methyl groups', 'Choline to glycine', 'Gut, acid and ulcers', 'Reading the evidence']))
    expect(guidedPaths.length).toBeGreaterThanOrEqual(6)
  })

  it('gives every path a slug id, a summary, at least eight steps, a reason per step and a mix of entity types', () => {
    const ids = new Set()
    for (const item of guidedPaths) {
      expect(item.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      expect(ids.has(item.id), item.id).toBe(false)
      ids.add(item.id)
      expect(item.summary.length).toBeGreaterThan(40)
      expect(item.summary.length).toBeLessThanOrEqual(PATH_LIMITS.summary)
      expect(item.steps.length, item.id).toBeGreaterThanOrEqual(8)
      const types = new Set()
      for (const entry of item.steps) {
        expect(graph.has(entry.id), `${item.id} -> ${entry.id}`).toBe(true)
        expect(entry.why.length, `${item.id} ${entry.id}`).toBeGreaterThan(30)
        expect(entry.why.length).toBeLessThanOrEqual(PATH_LIMITS.why)
        types.add(graph.get(entry.id).type)
      }
      expect(types.size, item.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('does not ask the reader to do anything medical', () => {
    for (const item of guidedPaths) {
      for (const entry of item.steps) expect(entry.why, `${item.id} ${entry.id}`).not.toMatch(/\b(you should|you must|take \d+ ?(mg|g)\b|start taking)/i)
    }
  })

  it('keeps the story connected: consecutive steps are at most four links apart without going through articles', () => {
    // "Reading the evidence" is a tour of grades across unrelated topics, so adjacency does not apply to it.
    for (const item of guidedPaths.filter((candidate) => candidate.id !== 'reading-the-evidence')) {
      for (let index = 1; index < item.steps.length; index += 1) {
        const hop = knowledge.pathBetween(item.steps[index - 1].id, item.steps[index].id, { avoidTypes: ['article'] })
        expect(hop, `${item.id}: ${item.steps[index - 1].id} -> ${item.steps[index].id}`).not.toBeNull()
        expect(hop.ids.length - 1, `${item.id}: ${item.steps[index - 1].id} -> ${item.steps[index].id}`).toBeLessThanOrEqual(4)
      }
    }
  })
})

describe('checkPaths', () => {
  it('accepts a good path', () => {
    expect(rulesOf([good()])).toEqual([])
  })

  it('rejects a list that is not an array', () => {
    expect(rulesOf({})).toEqual(['path-schema'])
  })

  it('reports steps that do not resolve', () => {
    const item = good()
    item.steps.push(step('compound:ghost'))
    const issues = checkPaths([item], small)
    expect(issues.map((issue) => issue.rule)).toEqual(['path-dangling-step'])
    expect(issues[0]).toMatchObject({ id: 'path:demo-path', path: 'steps[3].id', severity: 'error' })
    expect(issues[0].message).toContain('compound:ghost')
  })

  it('reports duplicate path ids and repeated steps', () => {
    expect(rulesOf([good(), good()])).toEqual(['path-duplicate-id'])
    const repeated = good()
    repeated.steps.push(step('compound:glycine'))
    expect(rulesOf([repeated])).toEqual(['path-duplicate-step'])
  })

  it('reports schema problems one by one', () => {
    const cases = [
      [{ ...good(), id: 'Not A Slug' }, 'id must be a kebab-case slug'],
      [{ ...good(), title: '' }, 'title is required'],
      [{ ...good(), summary: undefined }, 'summary is required'],
      [{ ...good(), summary: 'x'.repeat(PATH_LIMITS.summary + 1) }, 'summary must be at most'],
      [{ ...good(), steps: [step('compound:glycine'), step('enzyme:gnmt')] }, 'a path needs'],
      [{ ...good(), steps: 'nope' }, 'steps must be an array'],
      [{ ...good(), extra: 1 }, "unknown field 'extra'"],
      [{ ...good(), steps: [step('compound:glycine'), step('enzyme:gnmt'), { id: 'compound:sam' }] }, 'every step needs a why'],
      [{ ...good(), steps: [step('compound:glycine'), step('enzyme:gnmt'), step('not-an-id')] }, 'not a valid entity id'],
      [{ ...good(), steps: [step('compound:glycine'), step('enzyme:gnmt'), { ...step('compound:sam'), note: 'x' }] }, "unknown step field 'note'"],
      [{ ...good(), steps: [step('compound:glycine'), step('enzyme:gnmt'), step('compound:sam', 'y'.repeat(PATH_LIMITS.why + 1))] }, 'why must be at most']
    ]
    for (const [item, text] of cases) {
      const issues = checkPaths([item], small)
      expect(issues.length, text).toBeGreaterThan(0)
      expect(issues.every((issue) => issue.rule === 'path-schema'), text).toBe(true)
      expect(issues.map((issue) => issue.message).join('\n'), text).toContain(text)
    }
  })

  it('is wired into validateKnowledge and its report', () => {
    const item = good()
    item.steps.push(step('compound:ghost'))
    const report = validateKnowledge(fixture(), { paths: [item] })
    expect(report.ok).toBe(false)
    expect(report.errors.map((issue) => issue.rule)).toEqual(['path-dangling-step'])
    expect(report.counts.paths).toBe(1)
    expect(formatReport(report)).toContain('guided paths: 1')
    expect(formatReport(report)).toContain('path-dangling-step')
    expect(validateKnowledge(fixture()).counts.paths).toBeUndefined()
    expect(validateKnowledge(fixture(), { paths: [good()] }).ok).toBe(true)
  })
})

describe('path view models', () => {
  const first = guidedPaths[0]

  it('resolves every step to an entity card in order', () => {
    const model = pathModel(graph, first)
    expect(model).toMatchObject({ id: first.id, title: first.title, summary: first.summary, length: first.steps.length })
    expect(model.steps.map((entry) => entry.id)).toEqual(first.steps.map((entry) => entry.id))
    expect(model.steps.map((entry) => entry.position)).toEqual(first.steps.map((_, index) => index + 1))
    for (const entry of model.steps) {
      expect(entry.why.length).toBeGreaterThan(0)
      expect(entry.entity).toMatchObject({ id: entry.id, name: graph.get(entry.id).name, evidence: graph.get(entry.id).evidence })
      expect(entry.entity.typeLabel).toBeTruthy()
    }
    expect(Object.values(model.types).reduce((sum, count) => sum + count, 0)).toBe(model.length)
  })

  it('drops steps whose entity is missing instead of throwing, and returns null for no path', () => {
    const item = good()
    item.steps.push(step('compound:ghost'))
    expect(pathModel(small, item).length).toBe(3)
    expect(pathModel(small, undefined)).toBeNull()
  })

  it('lists cards without entity detail', () => {
    const cards = pathListModel(guidedPaths)
    expect(cards).toHaveLength(guidedPaths.length)
    expect(cards[0]).toEqual(pathCard(first))
    expect(Object.keys(cards[0]).sort()).toEqual(['id', 'length', 'summary', 'title'])
  })

  it('finds the paths that visit an entity', () => {
    const found = pathsContaining(guidedPaths, 'compound:glycine')
    expect(found.map((item) => item.id)).toContain('glycine-belching-question')
    expect(found[0]).toMatchObject({ position: expect.any(Number), why: expect.any(String), length: expect.any(Number) })
    expect(pathsContaining(guidedPaths, 'compound:ghost')).toEqual([])
  })
})

describe('knowledge index exports', () => {
  it('exposes the raw list, cards, resolved paths and reverse lookup', () => {
    expect(knowledge.paths).toBe(guidedPaths)
    expect(knowledge.pathList()).toHaveLength(guidedPaths.length)
    expect(knowledge.getPath('choline-to-glycine').steps[0].entity.name).toBe('Choline')
    expect(knowledge.getPath('nope')).toBeNull()
    expect(knowledge.pathsFor('enzyme:gnmt').map((item) => item.id)).toEqual(expect.arrayContaining(['glycine-belching-question', 'methyl-budget']))
  })
})
