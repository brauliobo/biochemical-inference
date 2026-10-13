import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import valid from '../fixtures/knowledge/valid.js'

vi.mock('../../src/knowledge/data/index.js', async () => ({ default: (await import('../fixtures/knowledge/valid.js')).default }))

const knowledge = await import('../../src/knowledge/index.js')

describe('knowledge singleton', () => {
  it('builds the graph from the data index', () => {
    expect(knowledge.graph.entities).toHaveLength(valid.length)
    expect(knowledge.getEntity('enzyme:gnmt').name).toBe('Glycine N-methyltransferase')
  })

  it('exposes helpers bound to the singleton graph', () => {
    expect(knowledge.page('enzyme:gnmt').name).toBe('Glycine N-methyltransferase')
    expect(knowledge.page('enzyme:ghost')).toBeNull()
    expect(knowledge.hub('compound').count).toBe(8)
    expect(knowledge.home().totals.entities).toBe(valid.length)
    expect(knowledge.find('gnmt')[0].id).toBe('enzyme:gnmt')
    expect(knowledge.pathBetween('enzyme:gnmt', 'compound:sam').ids).toEqual(['enzyme:gnmt', 'compound:sam'])
    expect(knowledge.components()).toHaveLength(1)
  })

  it('re-exports the vocabulary', () => {
    expect(knowledge.TYPE_IDS).toContain('claim')
    expect(knowledge.labelFor('catalyzes')).toBe('Catalyzes')
    expect(knowledge.inverseOf('catalyzes')).toBe('catalyzed-by')
  })
})

describe('data/index.js', () => {
  it('statically imports every content file and concatenates them', () => {
    const source = readFileSync(resolve(import.meta.dirname, '../../src/knowledge/data/index.js'), 'utf8')
    const files = ['compounds', 'metabolites', 'interventions', 'enzymes', 'reactions', 'pathways', 'states', 'diseases', 'outcomes', 'systems', 'claims', 'articles']
    for (const file of files) expect(source).toContain(`from './${file}.js'`)
    expect(source).not.toMatch(/import\.meta\.glob\(/)
  })
})
