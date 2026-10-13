import { describe, expect, it } from 'vitest'
import { graph, page } from '../../src/knowledge/index.js'
import { entityPath } from '../../src/kb/paths.js'
import { resolveRoute } from '../../src/router.js'

// Link integrity of the knowledge site (docs/USABILITY.md E4), at the model level:
// every id that an entity page can link to has a route that resolves and an entity
// behind it.
//
// Targets the engine itself reports as dangling (graph.dangling, the same list
// `npm run kb:validate` prints) are rendered as plain text by the views, never as a
// link, so by default they are tolerated here, but only while they are in that report:
// a view may never invent a link target.
//
// KB_STRICT_LINKS=1 tolerates nothing except article targets while no article data
// exists (src/knowledge/data/articles.js not merged yet). Run it once the content is
// complete; it fails with the list of missing ids otherwise.
const STRICT = process.env.KB_STRICT_LINKS === '1'
const articlesLoaded = (graph.byType.get('article') ?? []).length > 0
const reported = new Set(graph.dangling.map((entry) => entry.target))
const tolerated = (id) => reported.has(id) && (!STRICT || (!articlesLoaded && id.startsWith('article:')))

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

  it('links only to entities that exist (or, outside strict mode, that the engine reports as dangling)', () => {
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
