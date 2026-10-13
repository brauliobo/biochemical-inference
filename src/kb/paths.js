// URL scheme of the knowledge site. The one place that turns entity ids and types
// into router paths (and back), so no view or component builds a URL by hand.
//
//   /kb                      hub of all types
//   /kb/<type>               listing of one type            (type = singular id, e.g. "enzyme")
//   /kb/<type>/<slug>        entity page                    (id = "<type>:<slug>")
//   /kb/map?id=<id>          neighbourhood map
//
// The plural spelling of a type ("enzymes") is accepted wherever a type is read.
import { makeId, parseId } from '../knowledge/ids.js'
import { TYPES, isType } from '../knowledge/types.js'

export const KB_PATH = '/kb'
export const MAP_PATH = '/kb/map'

export const typePath = (type) => `${KB_PATH}/${type}`

/** Guided paths: /kb/paths lists them, /kb/paths/<id>?step=<n> shows one step of one path. */
export const PATHS_PATH = `${KB_PATH}/paths`

/**
 * Router path of a guided path; with `step` (1-based) the URL deep-links to that step.
 * Registered before /kb/:type so "paths" is never read as an entity type.
 */
export function guidedPathPath(id, step) {
  const base = `${PATHS_PATH}/${encodeURIComponent(id)}`
  return step ? `${base}?step=${step}` : base
}

/** The claims audit is the claim listing, which groups claims by status. */
export const CLAIMS_AUDIT_PATH = typePath('claim')

/** Router path of an entity page; the hub for anything that is not a well-formed id. */
export function entityPath(id) {
  const parts = parseId(id)
  return parts ? `${KB_PATH}/${parts.type}/${parts.slug}` : KB_PATH
}

/** "/kb/map" or "/kb/map?id=compound%3Aglycine". */
export const mapPath = (id) => (id ? `${MAP_PATH}?id=${encodeURIComponent(id)}` : MAP_PATH)

/** Entity page with the "How is this connected to..." result for `to` already showing. */
export const connectionPath = (from, to) => `${entityPath(from)}?to=${encodeURIComponent(to)}`

/** Type id for a route param ("enzyme" or "enzymes", any case), or null. */
export function resolveType(param) {
  const text = String(param ?? '').toLowerCase()
  if (isType(text)) return text
  return TYPES.find((type) => type.plural.toLowerCase() === text)?.id ?? null
}

/** Entity id for the :type/:slug route params, or null when the type is unknown. */
export function idFromParams({ type, slug }) {
  const resolved = resolveType(type)
  return resolved && slug ? makeId(resolved, String(slug).toLowerCase()) : null
}

/** Plain words for a slug, used to seed a search on a "not found" page. */
export const slugWords = (slug) => String(slug ?? '').replace(/[-_]+/g, ' ').trim()
