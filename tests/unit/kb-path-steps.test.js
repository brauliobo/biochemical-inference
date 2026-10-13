import { describe, expect, it } from 'vitest'
import { pathList, getPath, pathsFor, graph } from '../../src/knowledge/index.js'
import { PATH_CARDS } from '../../src/kb/path-cards.js'
import { clampStep, stepLabel, stepView } from '../../src/kb/path-steps.js'
import { PATHS_PATH, entityPath, guidedPathPath } from '../../src/kb/paths.js'
import { resolveRoute } from '../../src/router.js'

describe('guided path URLs', () => {
  it('builds list and step paths', () => {
    expect(PATHS_PATH).toBe('/kb/paths')
    expect(guidedPathPath('methyl-budget')).toBe('/kb/paths/methyl-budget')
    expect(guidedPathPath('methyl-budget', 3)).toBe('/kb/paths/methyl-budget?step=3')
  })

  it('registers /kb/paths before /kb/:type, so "paths" is never read as an entity type', () => {
    expect(resolveRoute('/kb/paths').route.name).toBe('kb-paths')
    expect(resolveRoute('/kb/paths/methyl-budget').route.name).toBe('kb-path')
    expect(resolveRoute('/kb/paths/methyl-budget').params).toEqual({ id: 'methyl-budget' })
    // the neighbours still resolve as before
    expect(resolveRoute('/kb/enzyme').route.name).toBe('kb-type')
    expect(resolveRoute('/kb/enzyme/gnmt').route.name).toBe('kb-entity')
    expect(resolveRoute('/kb/map').route.name).toBe('kbMap')
  })

  it('resolves the first-step and every deep link of every path to the path route', () => {
    for (const item of pathList()) {
      for (let step = 1; step <= item.length; step += 1) {
        const [path] = guidedPathPath(item.id, step).split('?')
        expect(resolveRoute(path).route.name).toBe('kb-path')
      }
    }
  })
})

describe('clampStep', () => {
  it('keeps a valid step as is', () => {
    expect(clampStep('1', 10)).toBe(1)
    expect(clampStep('7', 10)).toBe(7)
    expect(clampStep(10, 10)).toBe(10)
  })

  it('falls back to the first step for anything that is not a whole number of at least 1', () => {
    for (const raw of [undefined, null, '', 'abc', '2.5', '-3', '0', '1e2', ' ', '3 4']) expect(clampStep(raw, 10), String(raw)).toBe(1)
  })

  it('caps a number past the end at the last step', () => {
    expect(clampStep('11', 10)).toBe(10)
    expect(clampStep('99999999999999999999', 10)).toBe(10)
  })

  it('is safe for an empty or invalid length', () => {
    expect(clampStep('3', 0)).toBe(1)
    expect(clampStep('3', NaN)).toBe(1)
  })

  it('labels a step', () => {
    expect(stepLabel(3, 12)).toBe('Step 3 of 12')
  })
})

describe('stepView', () => {
  const path = getPath('glycine-belching-question')

  it('has no previous link on the first step and a next link with its URL', () => {
    const view = stepView(path, undefined)
    expect(view).toMatchObject({ step: 1, length: path.length, label: `Step 1 of ${path.length}`, first: true, last: false, previous: null })
    expect(view.current.id).toBe(path.steps[0].id)
    expect(view.next.to).toBe('/kb/paths/glycine-belching-question?step=2')
    expect(view.next.id).toBe(path.steps[1].id)
  })

  it('has both neighbours in the middle', () => {
    const view = stepView(path, '4')
    expect(view.previous.to).toBe('/kb/paths/glycine-belching-question?step=3')
    expect(view.next.to).toBe('/kb/paths/glycine-belching-question?step=5')
    expect(view.current.position).toBe(4)
  })

  it('has no next link on the last step', () => {
    const view = stepView(path, String(path.length))
    expect(view).toMatchObject({ last: true, next: null })
    expect(view.previous.position).toBe(path.length - 1)
  })
})

describe('paths and their entities agree', () => {
  it('the cards the home page shows equal pathList()', () => {
    expect(PATH_CARDS).toEqual(pathList())
  })

  it('every step of every path resolves to an entity page, and pathsFor points back at the same step', () => {
    for (const item of pathList()) {
      const path = getPath(item.id)
      expect(path.length).toBe(item.length)
      for (const step of path.steps) {
        expect(graph.has(step.id), step.id).toBe(true)
        expect(resolveRoute(entityPath(step.id)).route.name).toBe('kb-entity')
        const back = pathsFor(step.id).find((found) => found.id === item.id)
        expect(back.position, `${item.id} ${step.id}`).toBe(step.position)
        expect(stepView(path, String(back.position)).current.id).toBe(step.id)
      }
    }
  })
})
