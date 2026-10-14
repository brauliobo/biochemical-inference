// Type listing as a sortable table with a small visual per row (pure functions over the shipped graph).
// Every type gets a name, an evidence grade, a link-count bar and a "relations by kind" fingerprint; each type adds the
// columns that make its rows comparable: reactions and quantities for compounds, EC and reactions for enzymes, the
// equation for reactions, status and statement for claims, year and citation for articles.
import { causalGraph, getEntity, graph, quantFor } from '../knowledge/index.js'
import { claimStatusInfo, EVIDENCE_GRADES } from '../knowledge/evidence.js'
import { relationInfo } from '../knowledge/relations.js'
import { formatCitation } from '../knowledge/page-model.js'
import { normalizeText } from '../knowledge/search.js'
import { reactionModel } from './entity-model.js'

/** Relation kinds of the fingerprint sparkline, in this order. */
export const FINGERPRINT = Object.freeze(['substrate-of', 'product-of', 'catalyzes', 'part-of', 'increases', 'decreases', 'causes', 'mitigates', 'aggravates', 'manifests-as', 'associated-with', 'interacts-with'])

const COUNT = 'count'
const COLUMN_SETS = {
  compound: [{ id: 'reactions', label: 'Reactions', kind: COUNT }, { id: 'quantities', label: 'Quantities', kind: COUNT }],
  enzyme: [{ id: 'ec', label: 'EC number', kind: 'text' }, { id: 'reactions', label: 'Reactions', kind: COUNT }],
  reaction: [{ id: 'equation', label: 'Equation', kind: 'equation', sort: false }, { id: 'pathway', label: 'Pathway', kind: 'text' }],
  pathway: [{ id: 'reactions', label: 'Reactions', kind: COUNT }, { id: 'enzymes', label: 'Enzymes', kind: COUNT }],
  state: [{ id: 'effects', label: 'Signed effects', kind: COUNT }],
  disease: [{ id: 'effects', label: 'Signed effects', kind: COUNT }],
  outcome: [{ id: 'effects', label: 'Signed effects', kind: COUNT }],
  system: [{ id: 'effects', label: 'Signed effects', kind: COUNT }],
  intervention: [{ id: 'effects', label: 'Signed effects', kind: COUNT }, { id: 'doses', label: 'Doses', kind: COUNT }],
  claim: [{ id: 'status', label: 'Status', kind: 'status' }, { id: 'statement', label: 'Statement', kind: 'text', sort: false }],
  article: [{ id: 'year', label: 'Year', kind: 'text' }, { id: 'citation', label: 'Citation', kind: 'text', sort: false }, { id: 'verified', label: 'Verified', kind: 'verified' }]
}

/** The columns of a type's table: [{ id, label, kind, sort }]. Name is always first. */
export function columnsFor(type) {
  return [
    { id: 'name', label: 'Name', kind: 'name', sort: true },
    { id: 'evidence', label: 'Evidence', kind: 'grade', sort: true },
    ...(COLUMN_SETS[type] ?? []).map((column) => ({ sort: true, ...column })),
    { id: 'linked', label: 'Links', kind: COUNT, sort: true },
    { id: 'fingerprint', label: 'Relations by kind', kind: 'spark', sort: false }
  ]
}

function fingerprint(id) {
  const counts = Object.fromEntries(FINGERPRINT.map((rel) => [rel, 0]))
  for (const link of graph.links(id)) {
    const forward = relationInfo(link.rel)?.forward
    if (forward in counts) counts[forward] += 1
  }
  return FINGERPRINT.map((rel) => counts[rel])
}

const count = (list, rels) => list.filter((link) => rels.includes(link.rel)).length
const pathwayOf = (links) => {
  const link = links.find((candidate) => candidate.rel === 'part-of' && getEntity(candidate.other)?.type === 'pathway')
  return link ? getEntity(link.other).name : ''
}

/** One row per entity of a type, with every value the columns show or sort by. */
export function rowsFor(type) {
  return (graph.byType.get(type) ?? []).map((entity) => {
    const links = graph.links(entity.id)
    const row = {
      id: entity.id,
      name: entity.name,
      aliases: entity.aliases ?? [],
      summary: entity.summary,
      evidence: entity.evidence,
      linked: graph.degree(entity.id),
      fingerprint: fingerprint(entity.id)
    }
    if (type === 'compound') Object.assign(row, { reactions: count(links, ['substrate-of', 'product-of']), quantities: quantFor(entity.id).length })
    else if (type === 'enzyme') Object.assign(row, { ec: entity.facts?.ec ?? '', reactions: count(links, ['catalyzes']) })
    else if (type === 'reaction') Object.assign(row, { equation: reactionModel(entity.id), pathway: pathwayOf(links) })
    else if (type === 'pathway') Object.assign(row, { reactions: links.filter((link) => link.rel === 'has-part' && getEntity(link.other)?.type === 'reaction').length, enzymes: links.filter((link) => link.rel === 'has-part' && getEntity(link.other)?.type === 'enzyme').length })
    else if (type === 'intervention') Object.assign(row, { effects: causalGraph({ focus: entity.id, depth: 1, direction: 'down' }).edges.length, doses: quantFor(entity.id, { kind: ['typical-dose', 'trial-dose', 'approved-dose'] }).length })
    else if (type === 'claim') Object.assign(row, { status: entity.status, statusInfo: claimStatusInfo(entity.status), statement: entity.statement })
    else if (type === 'article') Object.assign(row, { year: entity.year, citation: formatCitation(entity), verified: entity.verified })
    else Object.assign(row, { effects: causalGraph({ focus: entity.id, depth: 1 }).edges.length })
    return row
  })
}

/** Largest value of a count column over the rows (to scale its bar). */
export const maxOf = (rows, id) => Math.max(1, ...rows.map((row) => Number(row[id]) || 0))

/** Filter by words (name, aliases, summary, statement), grade and claim status. */
export function filterRows(rows, { q = '', grade = '', status = '' } = {}) {
  const words = normalizeText(q).split(' ').filter(Boolean)
  return rows.filter((row) => {
    if (grade && row.evidence !== grade) return false
    if (status && row.status !== status) return false
    if (!words.length) return true
    const haystack = normalizeText([row.name, ...row.aliases, row.summary, row.statement ?? ''].join(' '))
    return words.every((word) => haystack.includes(word))
  })
}

function sortValue(row, id) {
  if (id === 'evidence') return EVIDENCE_GRADES[row.evidence]?.rank ?? -1
  if (id === 'verified') return row.verified ? 1 : 0
  const value = row[id]
  return typeof value === 'number' ? value : String(value ?? '').toLowerCase()
}

/** Rows sorted by a column id; `dir` is 'asc' or 'desc'. Name breaks ties. Numbers and grades sort high to low first by default. */
export function sortRows(rows, id = 'name', dir = 'asc') {
  const sign = dir === 'desc' ? -1 : 1
  return [...rows].sort((a, b) => {
    const x = sortValue(a, id)
    const y = sortValue(b, id)
    const order = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y))
    return sign * order || a.name.localeCompare(b.name)
  })
}

/** Direction a column starts in when first chosen: names and text ascending, counts, grades and years descending. */
export const firstDirection = (column) => (column.id === 'name' || column.kind === 'text' || column.kind === 'status' ? 'asc' : 'desc')

/** Query values of the listing: only known sort ids survive. */
export function readTable(query, columns) {
  const ids = columns.filter((column) => column.sort).map((column) => column.id)
  return {
    q: typeof query.q === 'string' ? query.q.slice(0, 200) : '',
    grade: Object.hasOwn(EVIDENCE_GRADES, query.grade) ? query.grade : '',
    status: ['supported', 'partly-supported', 'unsupported', 'contested'].includes(query.status) ? query.status : '',
    sort: ids.includes(query.sort) ? query.sort : 'name',
    dir: query.dir === 'desc' ? 'desc' : query.dir === 'asc' ? 'asc' : ''
  }
}

/** Query object for the table state, leaving out defaults so URLs stay short. */
export function writeTable({ q, grade, status, sort, dir }, columns) {
  const column = columns.find((item) => item.id === sort)
  const isDefault = sort === 'name' && (dir === 'asc' || !dir)
  const natural = column && (dir === firstDirection(column) || !dir)
  return Object.fromEntries(Object.entries({ q, grade, status, sort: isDefault ? '' : sort, dir: isDefault || natural ? '' : dir }).filter(([, value]) => value))
}

/** The direction in effect: the one in the query, else the column's natural first direction. */
export function effectiveDirection(state, columns) {
  const column = columns.find((item) => item.id === state.sort) ?? columns[0]
  return state.dir || firstDirection(column)
}
