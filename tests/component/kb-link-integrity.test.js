import { screen, waitFor } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import KbEntityView from '../../src/views/kb/KbEntityView.vue'
import { getPath, graph } from '../../src/knowledge/index.js'
import { TYPE_IDS, typeMeta } from '../../src/knowledge/types.js'
import { entityPath, typePath } from '../../src/kb/paths.js'
import { navigate, parseHash, resolveRoute } from '../../src/router.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// E4 in docs/USABILITY.md, on the rendered DOM: render every entity page and check
// that every internal link points to a route that resolves and an entity that exists,
// that every link has a name, and that each page has onward links (no dead end).
// Dangling data references render as plain text (EntityLink), so they never appear here.
describe('rendered link integrity', () => {
  it('has no broken, unnamed or missing-target link on any entity page', async () => {
    navigate(entityPath(graph.entities[0].id))
    const { container } = mountVapor(KbEntityView)
    const problems = []
    let totalLinks = 0

    for (const entity of graph.entities) {
      navigate(entityPath(entity.id))
      await waitFor(() => expect(container.querySelector('h1')?.textContent).toBe(entity.name), { timeout: 15000 })
      const anchors = [...container.querySelectorAll('a[href]')]
      const internal = anchors.filter((anchor) => anchor.getAttribute('href').startsWith('#/'))
      let onward = 0
      for (const anchor of anchors) {
        const href = anchor.getAttribute('href')
        const name = (anchor.textContent || anchor.getAttribute('aria-label') || '').trim()
        if (!name) problems.push(`${entity.id}: link without a name -> ${href}`)
        if (href.startsWith('https://')) continue
        if (!href.startsWith('#/')) {
          problems.push(`${entity.id}: unexpected link ${href}`)
          continue
        }
        const location = parseHash(href)
        const { route, params } = resolveRoute(location.path)
        if (route.name === 'kb-entity') {
          if (!graph.has(`${params.type}:${params.slug}`)) problems.push(`${entity.id}: ${href} has no entity`)
          else if (`${params.type}:${params.slug}` !== entity.id) onward += 1
        } else if (route.name === 'kb-type') {
          if (!TYPE_IDS.includes(params.type)) problems.push(`${entity.id}: ${href} is not a type`)
        } else if (route.name === 'kb-path') {
          // A guided path link must name a real path, and its step must land on this entity.
          const path = getPath(params.id)
          const step = Number(location.query.step)
          if (!path) problems.push(`${entity.id}: ${href} has no guided path`)
          else if (path.steps[step - 1]?.id !== entity.id) problems.push(`${entity.id}: ${href} does not land on this entity`)
        } else if (route.name === 'atlas-causal') {
          // "Open in the causal atlas" must name a real entity
          if (!graph.has(location.query.focus)) problems.push(`${entity.id}: ${href} has no entity to focus`)
        } else if (route.name === 'evidence-claims' || route.name === 'evidence-claim' || route.name === 'evidence-article') {
          // Claim pages link to the claims audit (optionally by topic); evidence pages must name a real entity.
          if (route.name === 'evidence-claim' && !graph.has(`claim:${params.slug}`)) problems.push(`${entity.id}: ${href} has no claim`)
          if (route.name === 'evidence-article' && !graph.has(`article:${params.slug}`)) problems.push(`${entity.id}: ${href} has no article`)
        } else if (!['home', 'kb-hub', 'kb-paths', 'kbMap', 'evidence', 'evidence-literature'].includes(route.name)) {
          problems.push(`${entity.id}: ${href} resolves to ${route.name}`)
        }
      }
      totalLinks += internal.length
      if (onward === 0) problems.push(`${entity.id}: no link to another entity`)
    }

    expect(problems).toEqual([])
    expect(totalLinks).toBeGreaterThan(graph.entities.length * 4)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  }, 180_000)

  it('links every entity from its type listing (reachable from Home in two interactions)', async () => {
    const { default: KbTypeView } = await import('../../src/views/kb/KbTypeView.vue')
    navigate(typePath(TYPE_IDS[0]))
    const { container } = mountVapor(KbTypeView)
    const missing = []
    for (const type of TYPE_IDS) {
      navigate(typePath(type))
      await waitFor(() => expect(container.querySelector('h1')?.textContent).toBe(typeMeta(type).plural))
      const hrefs = new Set([...container.querySelectorAll('a')].map((anchor) => anchor.getAttribute('href')))
      for (const entity of graph.byType.get(type)) {
        if (!hrefs.has(`#${entityPath(entity.id)}`)) missing.push(entity.id)
      }
    }
    expect(missing).toEqual([])
  }, 60_000)
})
