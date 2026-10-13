import { describe, expect, it } from 'vitest'
import { graph, page } from '../../src/knowledge/index.js'
import { entityPath } from '../../src/kb/paths.js'
import { resolveRoute } from '../../src/router.js'

// Link integrity of the knowledge site (docs/USABILITY.md E4), at the model level:
// every id that an entity page can link to has a route that resolves and an entity
// behind it.
//
// Strict by default: every link target must exist. The views render targets that the
// engine reports as dangling (graph.dangling, the same list `npm run kb:validate`
// prints) as plain text, never as a link; KB_STRICT_LINKS=0 tolerates exactly those
// reported targets (for working on content that is still incomplete). A view may
// never invent a link target either way.
const STRICT = process.env.KB_STRICT_LINKS !== '0'
const reported = new Set(graph.dangling.map((entry) => entry.target))
const tolerated = (id) => !STRICT && reported.has(id)

function linkTargets(model) {
  const ids = []
  for (const paragraph of model.body) for (const segment of paragraph) if (segment.link) ids.push(segment.link.id)
  for (const group of model.relationGroups) for (const item of group.items) ids.push(item.id)
  for (const reference of model.references) ids.push(reference.id)
  for (const item of model.mentionedBy) ids.push(item.id)
  for (const item of model.seeAlso) ids.push(item.id, ...item.via.map((via) => via.id))
  if (model.reaction) {
    for (const part of [...model.reaction.reactants, ...model.reaction.products, ...model.reaction.enzymes]) ids.push(part.id)
  }
  return ids
}

describe('knowledge page links', () => {
  const models = graph.entities.map((entity) => page(entity.id))

  it('builds a page model for every entity', () => {
    expect(models.every(Boolean)).toBe(true)
    expect(models.length).toBe(graph.stats.entities)
  })

  it('gives every entity page a route that resolves to the entity view', () => {
    for (const entity of graph.entities) {
      const { route, params } = resolveRoute(entityPath(entity.id))
      expect(route.name, entity.id).toBe('kb-entity')
      expect(`${params.type}:${params.slug}`).toBe(entity.id)
    }
  })

  it('links only to entities that exist (strict unless KB_STRICT_LINKS=0)', () => {
    const missing = []
    for (const model of models) {
      for (const id of linkTargets(model)) {
        if (graph.has(id)) expect(resolveRoute(entityPath(id)).route.name, id).toBe('kb-entity')
        else if (!tolerated(id)) missing.push(`${model.id} -> ${id}`)
      }
    }
    expect(missing).toEqual([])
  })

  it('gives every page at least one outgoing content link (no dead ends)', () => {
    const deadEnds = models.filter((model) => !linkTargets(model).some((id) => graph.has(id))).map((model) => model.id)
    expect(deadEnds).toEqual([])
  })
})
