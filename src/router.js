// Tiny hash router: the route lives in location.hash ("#/kb/glycine"), so it
// works from any base path (GitHub Pages sub-path, file://, dev server) with
// no server rewrite rules. Routes are declared in routes.js.
//
// Hashes that do not start with "#/" (e.g. "#main") are in-page anchors and are
// ignored, so skip links and fragment links keep working.
import { shallowReactive } from 'vue'
import { notFoundRoute, routes } from './routes.js'

export function parseHash(hash) {
  if (!hash.startsWith('#/') && hash !== '' && hash !== '#') return null
  const [rawPath, search = ''] = hash.slice(1).split('?')
  const path = ('/' + rawPath).replace(/\/{2,}/g, '/').replace(/(.)\/$/, '$1')
  return { path, query: Object.fromEntries(new URLSearchParams(search)) }
}

// "/kb/:type" + "/kb/enzymes" -> { type: "enzymes" }; null when it does not match.
export function matchPath(pattern, path) {
  const wanted = pattern.split('/')
  const actual = path.split('/')
  if (wanted.length !== actual.length) return null
  const params = {}
  for (const [index, segment] of wanted.entries()) {
    if (segment.startsWith(':')) {
      try {
        params[segment.slice(1)] = decodeURIComponent(actual[index])
      } catch {
        return null
      }
    } else if (segment !== actual[index]) {
      return null
    }
  }
  return params
}

export function resolveRoute(path, table = routes) {
  for (const route of table) {
    const params = matchPath(route.path, path)
    if (params) return { route, params }
  }
  return { route: notFoundRoute, params: {} }
}

// aria-current value for a link: "page" on the exact route; with `section`
// (navigation links) also "true" on any descendant route; else undefined.
export function linkState(currentPath, to, section = false) {
  if (currentPath === to) return 'page'
  if (section && to !== '/' && currentPath.startsWith(`${to}/`)) return 'true'
  return undefined
}

export const href = (path) => `#${path}`

const state = shallowReactive({ path: '/', query: {}, params: {}, route: notFoundRoute, title: '' })

export function syncRoute(hash = window.location.hash) {
  const location = parseHash(hash)
  if (!location) return
  const { route, params } = resolveRoute(location.path)
  Object.assign(state, { ...location, route, params, title: route.title })
}

export function navigate(path, { replace = false } = {}) {
  const hash = href(path)
  if (replace) window.history.replaceState(null, '', hash)
  else window.location.hash = hash
  syncRoute(hash)
}

// The current route. Reactive: read fields inside templates or computed().
// Views that stay mounted across param changes (/kb/a -> /kb/b) must read
// route.params reactively instead of once in setup.
export function useRoute() {
  return state
}

// Views call this once their data is known, e.g. setPageTitle(entity.name).
export function setPageTitle(title) {
  state.title = title
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => syncRoute())
  syncRoute()
}
