import { describe, expect, it } from 'vitest'
import { getEntity, pathBetween } from '../../src/knowledge/index.js'
import { START_HERE } from '../../src/kb/start-here.js'
import { resolveRoute } from '../../src/router.js'

describe('start-here path', () => {
  it('covers the topics the home page promises, in order', () => {
    expect(START_HERE.map((step) => step.name)).toEqual([
      'Under-methylation', 'Over-methylation', 'Glycine', 'Choline', 'Betaine', 'GNMT', 'The belching question', 'Claims audit'
    ])
  })

  it('points every step at an existing entity and a route that resolves', () => {
    for (const step of START_HERE) {
      if (step.id) expect(getEntity(step.id), step.id).toBeTruthy()
      const [path] = step.to.split('?')
      expect(resolveRoute(path).route.name, step.to).not.toBe('not-found')
      expect(step.why.length).toBeGreaterThan(20)
    }
  })

  it('has a real chain of links from glycine to belching for the question step', () => {
    const question = START_HERE.find((step) => step.name === 'The belching question')
    expect(question.to).toContain('to=outcome%3Abelching')
    expect(pathBetween('compound:glycine', 'outcome:belching', { avoidTypes: ['article'] }).steps.length).toBeGreaterThan(0)
  })
})
