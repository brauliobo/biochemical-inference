import { afterEach, describe, expect, it } from 'vitest'
import { linkState, matchPath, navigate, parseHash, resolveRoute, setPageTitle, syncRoute, useRoute } from '../../src/router.js'
import { notFoundRoute, routes } from '../../src/routes.js'

describe('parseHash', () => {
  it.each([
    ['', '/'],
    ['#', '/'],
    ['#/', '/'],
    ['#/kb', '/kb'],
    ['#/kb/', '/kb'],
    ['#//kb//enzymes', '/kb/enzymes']
  ])('normalises %j to %s', (hash, path) => {
    expect(parseHash(hash).path).toBe(path)
  })

  it('parses the query string', () => {
    expect(parseHash('#/kb?tab=refs&x=1')).toEqual({ path: '/kb', query: { tab: 'refs', x: '1' } })
  })

  it('ignores in-page anchors such as the skip link target', () => {
    expect(parseHash('#main')).toBeNull()
  })
})

describe('matchPath', () => {
  it('extracts and decodes params', () => {
    expect(matchPath('/kb/:type/:slug', '/kb/enzymes/5%2C10-mthfr')).toEqual({ type: 'enzymes', slug: '5,10-mthfr' })
  })

  it('rejects other lengths, literals and bad encodings', () => {
    expect(matchPath('/kb/:type', '/kb')).toBeNull()
    expect(matchPath('/kb/:type', '/kb/a/b')).toBeNull()
    expect(matchPath('/kb/:type', '/workbench/a')).toBeNull()
    expect(matchPath('/kb/:type', '/kb/%E0%A4%A')).toBeNull()
  })
})

describe('resolveRoute', () => {
  it.each([
    ['/', 'home', {}],
    ['/kb', 'kb-hub', {}],
    ['/kb/enzymes', 'kb-type', { type: 'enzymes' }],
    ['/kb/enzymes/mthfr', 'kb-entity', { type: 'enzymes', slug: 'mthfr' }],
    ['/workbench', 'workbench-index', {}],
    ['/workbench/atlas', 'workbench', { name: 'atlas' }]
  ])('%s -> %s', (path, name, params) => {
    const resolved = resolveRoute(path)
    expect(resolved.route.name).toBe(name)
    expect(resolved.params).toEqual(params)
  })

  it('falls back to the 404 route', () => {
    expect(resolveRoute('/nope').route).toBe(notFoundRoute)
    expect(resolveRoute('/kb/a/b/c').route).toBe(notFoundRoute)
  })

  it('has unique route names and lazy loaders', () => {
    const names = routes.map((route) => route.name)
    expect(new Set(names).size).toBe(names.length)
    for (const route of [...routes, notFoundRoute]) expect(route.load).toBeTypeOf('function')
  })
})

describe('linkState', () => {
  it('marks the exact route as the page', () => {
    expect(linkState('/kb', '/kb')).toBe('page')
  })

  it('marks ancestors only for section links', () => {
    expect(linkState('/kb/enzymes', '/kb', true)).toBe('true')
    expect(linkState('/kb/enzymes', '/kb')).toBeUndefined()
    expect(linkState('/kb2', '/kb', true)).toBeUndefined()
    expect(linkState('/dash/glycine', '/dashboards', true, ['/dash'])).toBe('true')
    expect(linkState('/dashboards', '/dashboards', true, ['/dash'])).toBe('page')
    expect(linkState('/dashboard-x/a', '/dashboards', true, ['/dash'])).toBeUndefined()
  })

  it('never marks home as an ancestor', () => {
    expect(linkState('/kb', '/', true)).toBeUndefined()
  })
})

describe('reactive route', () => {
  afterEach(() => navigate('/'))

  it('follows navigate() and exposes params, query and title', () => {
    const route = useRoute()
    navigate('/kb/enzymes/mthfr?tab=refs')
    expect(window.location.hash).toBe('#/kb/enzymes/mthfr?tab=refs')
    expect(route.route.name).toBe('kb-entity')
    expect(route.params).toEqual({ type: 'enzymes', slug: 'mthfr' })
    expect(route.query).toEqual({ tab: 'refs' })
    expect(route.title).toBe('Knowledge base')
  })

  it('lets a view override the title until the next navigation', () => {
    navigate('/kb/enzymes/mthfr')
    setPageTitle('MTHFR')
    expect(useRoute().title).toBe('MTHFR')
    navigate('/kb')
    expect(useRoute().title).toBe('Knowledge base')
  })

  it('keeps the current route for in-page anchors', () => {
    navigate('/kb')
    syncRoute('#main')
    expect(useRoute().path).toBe('/kb')
  })

  it('picks up browser hash changes', async () => {
    window.location.hash = '#/workbench'
    await new Promise((resolve) => window.addEventListener('hashchange', resolve, { once: true }))
    expect(useRoute().route.name).toBe('workbench-index')
  })
})
