// Type listing helpers (pure): enrich hub items with the type-specific line that
// makes a list scannable (claim status, reaction equation, citation), then filter,
// sort and group them. The view only wires these to form controls.
import { CLAIM_STATUS_KEYS, EVIDENCE_GRADES, EVIDENCE_KEYS, claimStatusInfo } from '../knowledge/evidence.js'
import { formatCitation, pageModel } from '../knowledge/page-model.js'
import { normalizeText } from '../knowledge/search.js'

export const SORTS = Object.freeze([
  { id: 'name', label: 'Name (A to Z)' },
  { id: 'evidence', label: 'Evidence (strongest first)' },
  { id: 'linked', label: 'Most linked first' }
])
const SORT_IDS = SORTS.map((sort) => sort.id)
export const DEFAULT_SORT = 'name'

const OTHER_PATHWAY = 'Not in a pathway'
const byName = (a, b) => a.name.localeCompare(b.name)

function pathwayOf(graph, id) {
  const link = graph.links(id).find((candidate) => candidate.rel === 'part-of' && graph.get(candidate.other)?.type === 'pathway')
  return link ? graph.get(link.other).name : OTHER_PATHWAY
}

/** hubModel items plus what each type needs in a list row. Dangling targets never throw. */
export function enrichItems(graph, hub) {
  return hub.items.map((item) => {
    const entity = graph.get(item.id)
    const extra = {}
    if (hub.type === 'claim') {
      extra.status = entity.status
      extra.statusInfo = claimStatusInfo(entity.status)
      extra.detail = entity.statement
    } else if (hub.type === 'reaction') {
      extra.equation = pageModel(graph, item.id).reaction.equation
      extra.pathway = pathwayOf(graph, item.id)
    } else if (hub.type === 'article') {
      extra.citation = formatCitation(entity)
      extra.year = entity.year
      extra.verified = entity.verified
    }
    return { ...item, ...extra }
  })
}

/** Filters: q (all words must appear in name, aliases, summary or statement), grade, status. */
export function filterItems(items, { q = '', grade = '', status = '' } = {}) {
  const words = normalizeText(q).split(' ').filter(Boolean)
  return items.filter((item) => {
    if (grade && item.evidence !== grade) return false
    if (status && item.status !== status) return false
    if (!words.length) return true
    const haystack = normalizeText([item.name, ...item.aliases, item.summary, item.detail ?? ''].join(' '))
    return words.every((word) => haystack.includes(word))
  })
}

export function sortItems(items, sort = DEFAULT_SORT) {
  const list = [...items]
  if (sort === 'evidence') return list.sort((a, b) => EVIDENCE_GRADES[b.evidence].rank - EVIDENCE_GRADES[a.evidence].rank || byName(a, b))
  if (sort === 'linked') return list.sort((a, b) => b.degree - a.degree || byName(a, b))
  return list.sort(byName)
}

const initialOf = (item) => {
  const letter = normalizeText(item.name).charAt(0).toUpperCase()
  return /[A-Z]/.test(letter) ? letter : '#'
}

function bucket(items, keyOf, labelOf, order) {
  const groups = new Map()
  for (const item of items) {
    const key = keyOf(item)
    if (!groups.has(key)) groups.set(key, { key, label: labelOf(key), items: [] })
    groups.get(key).items.push(item)
  }
  return [...groups.values()].sort(order)
}

/**
 * Sensible groups for a (filtered) list. By name: claims by status, articles by year (newest
 * first), reactions by pathway, everything else by initial letter. By evidence: by grade.
 * Most linked: one ungrouped list. Returns [{ key, label, items }]; label is null for no heading.
 */
export function groupItems(items, { type, sort = DEFAULT_SORT } = {}) {
  if (!items.length) return []
  const sorted = sortItems(items, sort)
  if (sort === 'linked') return [{ key: 'all', label: null, items: sorted }]
  if (sort === 'evidence') {
    return bucket(sorted, (item) => item.evidence, (grade) => EVIDENCE_GRADES[grade]?.label ?? grade, (a, b) => EVIDENCE_GRADES[b.key].rank - EVIDENCE_GRADES[a.key].rank)
  }
  if (type === 'claim') {
    return bucket(sorted, (item) => item.status, (status) => claimStatusInfo(status).label, (a, b) => CLAIM_STATUS_KEYS.indexOf(a.key) - CLAIM_STATUS_KEYS.indexOf(b.key))
  }
  if (type === 'article') {
    return bucket(sorted, (item) => String(item.year), (year) => year, (a, b) => Number(b.key) - Number(a.key))
  }
  if (type === 'reaction') {
    const last = (key) => (key === OTHER_PATHWAY ? 1 : 0)
    return bucket(sorted, (item) => item.pathway, (name) => name, (a, b) => last(a.key) - last(b.key) || a.key.localeCompare(b.key))
  }
  return bucket(sorted, initialOf, (letter) => letter, (a, b) => (a.key === '#') - (b.key === '#') || a.key.localeCompare(b.key))
}

/** Normalise untrusted query values: only known grades, statuses and sorts survive. */
export function readFilters(query = {}) {
  return {
    q: typeof query.q === 'string' ? query.q.slice(0, 200) : '',
    grade: EVIDENCE_KEYS.includes(query.grade) ? query.grade : '',
    status: CLAIM_STATUS_KEYS.includes(query.status) ? query.status : '',
    sort: SORT_IDS.includes(query.sort) ? query.sort : DEFAULT_SORT
  }
}

/** Query object for the filters, omitting defaults so URLs stay short. */
export function writeFilters({ q, grade, status, sort }) {
  return Object.fromEntries(Object.entries({ q, grade, status, sort: sort === DEFAULT_SORT ? '' : sort }).filter(([, value]) => value))
}

/** How many items carry each evidence grade / claim status (for option labels). */
export function countBy(items, field) {
  const counts = {}
  for (const item of items) counts[item[field]] = (counts[item[field]] ?? 0) + 1
  return counts
}
