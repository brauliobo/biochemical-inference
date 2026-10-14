// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'
import knowledge from '../../src/knowledge/data/index.js'

// The simulation cites its inputs as 'article:<id>' (and so on). When the knowledge data is
// deduplicated or an article is renamed, those citations silently dangle, so every one is
// checked against the knowledge data here.
const root = join(import.meta.dirname, '../../src/sim')
const known = new Set(knowledge.map((entity) => entity.id))

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else if (/\.(js|json)$/.test(name)) yield path
  }
}

const citations = []
for (const file of files(root)) {
  const text = readFileSync(file, 'utf8')
  for (const match of text.matchAll(/\barticle:[a-z0-9][a-z0-9-]*/g)) citations.push({ file: relative(root, file), id: match[0] })
}

describe('article citations in the simulation', () => {
  it('finds the citations in the parameter tables, the models, the calculators and the validation targets', () => {
    const where = new Set(citations.map((citation) => citation.file.split('/')[0]))
    expect(where.has('data')).toBe(true)
    expect(where.has('models')).toBe(true)
    expect(citations.length).toBeGreaterThan(100)
  })

  it('cites only articles that exist in the knowledge data', () => {
    const missing = [...new Set(citations.filter((citation) => !known.has(citation.id)).map((citation) => `${citation.id} (${citation.file})`))]
    expect(missing).toEqual([])
  })

  it('cites entities of type article', () => {
    const notArticles = citations.filter((citation) => known.has(citation.id) && knowledge.find((entity) => entity.id === citation.id).type !== 'article')
    expect(notArticles).toEqual([])
  })
})
