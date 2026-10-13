// Entity id helpers. An id is '<type>:<kebab-slug>', e.g. 'enzyme:gnmt'.
import { TYPE_IDS } from './types.js'

export const SLUG_PATTERN = '[a-z0-9]+(?:-[a-z0-9]+)*'
export const ID_PATTERN = new RegExp(`^(${TYPE_IDS.join('|')}):(${SLUG_PATTERN})$`)

export function isId(value) {
  return typeof value === 'string' && ID_PATTERN.test(value)
}

/** Split an id into { type, slug }; returns null for malformed ids. */
export function parseId(id) {
  const match = typeof id === 'string' ? ID_PATTERN.exec(id) : null
  return match ? { type: match[1], slug: match[2] } : null
}

/** Type prefix of an id without validating the slug ('' when there is no colon). */
export function idType(id) {
  const text = String(id)
  const colon = text.indexOf(':')
  return colon < 0 ? '' : text.slice(0, colon)
}

export function makeId(type, slug) {
  return `${type}:${slug}`
}
