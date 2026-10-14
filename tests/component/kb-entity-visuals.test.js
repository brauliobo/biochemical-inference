import { waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import KbEntityView from '../../src/views/kb/KbEntityView.vue'
import { graph } from '../../src/knowledge/index.js'
import { entityPath } from '../../src/kb/paths.js'
import { navigate } from '../../src/router.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// Every entity page that uses a visual template (all kinds but claims and articles, which have their own templates)
// is rendered once, in one mounted view, as a reader would move from page to page. Each must render without an
// exception, and at least 90 percent must show at least one visual (a map, graph, bar, curve, chips or table).
beforeEach(() => {
  window.scrollTo = () => {}
})

const entities = graph.entities.filter((entity) => !['claim', 'article'].includes(entity.type))

describe('every visual entity page', () => {
  it('renders without an exception and shows a visual for at least 90 percent of the entities', async () => {
    navigate(entityPath(entities[0].id))
    const { container } = mountVapor(KbEntityView)
    const without = []
    const problems = []
    const byKind = {}
    const visuals = {}
    for (const entity of entities) {
      navigate(entityPath(entity.id))
      try {
        await waitFor(() => {
          expect(container.querySelector('h1')?.textContent).toBe(entity.name)
          expect(container.querySelector('[data-testid="entity-visuals"]')).toBeTruthy()
          expect(container.querySelector('[data-loading]')).toBeNull()
        }, { timeout: 15000, interval: 5 })
      } catch (error) {
        problems.push(`${entity.id}: ${error.message.split('\n')[0]}`)
        continue
      }
      const found = [...new Set([...container.querySelectorAll('[data-visual]')].map((node) => node.getAttribute('data-visual')))]
      for (const kind of found) visuals[kind] = (visuals[kind] ?? 0) + 1
      const chartOnly = found.filter((kind) => !['chips', 'quantity-chips'].includes(kind))
      const stat = (byKind[entity.type] ??= { total: 0, withVisual: 0, withChart: 0 })
      stat.total += 1
      if (found.length) stat.withVisual += 1
      if (chartOnly.length) stat.withChart += 1
      if (!found.length) without.push(entity.id)
      if (container.querySelectorAll('h1').length !== 1) problems.push(`${entity.id}: ${container.querySelectorAll('h1').length} h1`)
    }
    const total = Object.values(byKind).reduce((sum, stat) => sum + stat.total, 0)
    const shown = Object.values(byKind).reduce((sum, stat) => sum + stat.withVisual, 0)
    console.log(`ENTITY VISUALS: ${shown} of ${total} (${((100 * shown) / total).toFixed(1)} %)`)
    console.log('by type', JSON.stringify(byKind))
    console.log('visual kinds', JSON.stringify(visuals))
    console.log('without a visual', without.join(', ') || 'none')
    expect(problems).toEqual([])
    expect(shown / total).toBeGreaterThanOrEqual(0.9)
  }, 600_000)
})
