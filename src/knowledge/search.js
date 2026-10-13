// Simple scored search over name, aliases, id slug and summary.
// Case- and accent-insensitive ("metilacao" finds "metilação"); every query word must match.
import { typeLabel } from './types.js'
import { parseId } from './ids.js'

const WEIGHTS = {
  name: { exact: 100, prefix: 80, word: 65, substring: 45 },
  alias: { exact: 90, prefix: 70, word: 55, substring: 40 },
  id: { exact: 60, prefix: 40, word: 30, substring: 20 },
  summary: { exact: 12, prefix: 12, word: 10, substring: 6 }
}
const PHRASE_BONUS = { name: 50, alias: 40 }

export function normalizeText(value) {
  return String(value).toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

function matchKind(haystack, token) {
  if (!haystack) return null
  if (haystack === token) return 'exact'
  if (haystack.startsWith(token)) return 'prefix'
  if (haystack.split(' ').some((word) => word.startsWith(token))) return 'word'
  return haystack.includes(token) ? 'substring' : null
}

const indexes = new WeakMap()

function indexFor(graph) {
  let index = indexes.get(graph)
  if (!index) {
    index = graph.entities.map((entity) => ({
      entity,
      name: normalizeText(entity.name),
      aliases: (entity.aliases ?? []).map((alias) => ({ text: alias, norm: normalizeText(alias) })),
      id: normalizeText(parseId(entity.id)?.slug ?? entity.id),
      summary: normalizeText(entity.summary)
    }))
    indexes.set(graph, index)
  }
  return index
}

function bestForToken(record, token) {
  let best = { score: 0, field: null, alias: null }
  const consider = (field, haystack, alias = null) => {
    const kind = matchKind(haystack, token)
    const score = kind ? WEIGHTS[field][kind] : 0
    if (score > best.score) best = { score, field, alias }
  }
  consider('name', record.name)
  for (const alias of record.aliases) consider('alias', alias.norm, alias.text)
  consider('id', record.id)
  consider('summary', record.summary)
  return best
}

/**
 * search(graph, query, { limit = 20, types }) ->
 *   [{ id, type, typeLabel, name, summary, evidence, score, matched: 'name'|'alias'|'id'|'summary', alias? }]
 * best match first; blank queries return [].
 */
export function search(graph, query, { limit = 20, types } = {}) {
  const phrase = normalizeText(query ?? '')
  const tokens = phrase.split(' ').filter(Boolean)
  if (!tokens.length) return []
  const results = []
  for (const record of indexFor(graph)) {
    if (types && !types.includes(record.entity.type)) continue
    const hits = tokens.map((token) => bestForToken(record, token))
    if (hits.some((hit) => hit.score === 0)) continue
    let score = hits.reduce((sum, hit) => sum + hit.score, 0)
    if (record.name === phrase) score += PHRASE_BONUS.name
    else if (record.aliases.some((alias) => alias.norm === phrase)) score += PHRASE_BONUS.alias
    const primary = hits.reduce((top, hit) => (hit.score > top.score ? hit : top))
    const { entity } = record
    results.push({
      id: entity.id,
      type: entity.type,
      typeLabel: typeLabel(entity.type),
      name: entity.name,
      summary: entity.summary,
      evidence: entity.evidence,
      score,
      matched: primary.field,
      ...(primary.alias ? { alias: primary.alias } : {})
    })
  }
  results.sort((a, b) => b.score - a.score || a.name.length - b.name.length || a.name.localeCompare(b.name))
  return results.slice(0, limit)
}
