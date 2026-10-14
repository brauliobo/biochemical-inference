// Pure helpers for the claim page: the causal edges a claim underpins (as LayeredGraph props) and the
// quantities of the entries it is about (as chips). No Vue, no DOM.
import { TIER_LABELS, tierOf } from '../knowledge/causal.js'
import { edgeSign } from '../knowledge/relations.js'

// The viz sign of an effect relation. Relations that carry no sign of their own fall back to the
// explicit sign on the edge ('+' / '-'), else they are drawn as plain links.
const SIGN_BY_REL = Object.freeze({
  increases: 'increase',
  causes: 'increase',
  'precursor-of': 'increase',
  'manifests-as': 'increase',
  decreases: 'decrease',
  mitigates: 'mitigate',
  aggravates: 'aggravate'
})

export function vizSign(edge) {
  if (SIGN_BY_REL[edge.rel]) return SIGN_BY_REL[edge.rel]
  const sign = edgeSign(edge)
  return sign === '+' ? 'increase' : sign === '-' ? 'decrease' : 'neutral'
}

/**
 * The edges asserted by one claim, shaped for LayeredGraph (hypothesis edges are drawn dashed):
 * { nodes: [{ id, label, type, tier, grade }], edges: [{ from, to, sign, hypothesis }], rows, tierNames }.
 * `rows` is the same edges as text for the list beside the graph.
 */
export function claimGraph(graph, claimId) {
  const asserted = graph.edges.filter((edge) => edge.claim === claimId)
  const nodes = new Map()
  for (const edge of asserted) {
    for (const id of [edge.from, edge.to]) {
      const entity = graph.get(id)
      if (!entity || nodes.has(id)) continue
      const tier = tierOf(entity.type)
      nodes.set(id, { id, label: entity.name, type: entity.type, ...(tier === null ? {} : { tier }), grade: entity.evidence })
    }
  }
  const edges = asserted.map((edge) => ({ from: edge.from, to: edge.to, sign: vizSign(edge), hypothesis: edge.hypothesis === true }))
  const rows = asserted.map((edge) => ({
    from: edge.from,
    to: edge.to,
    fromName: graph.get(edge.from)?.name ?? edge.from,
    toName: graph.get(edge.to)?.name ?? edge.to,
    rel: edge.rel,
    sign: vizSign(edge),
    hypothesis: edge.hypothesis === true,
    strength: edge.strength ?? null
  }))
  return { nodes: [...nodes.values()], edges, rows, tierNames: TIER_LABELS }
}

const QUANT_KINDS = Object.freeze(['UL', 'RDA', 'AI', 'EAR', 'PRI', 'approved-dose', 'trial-dose', 'typical-dose', 'reference-range', 'threshold'])
const KIND_RANK = Object.freeze(Object.fromEntries(QUANT_KINDS.map((kind, index) => [kind, index])))

const number = (value) => (Number.isInteger(value) ? String(value) : String(Number(value.toPrecision(3))))

/** "3500 mg/day", "12 to 20 µmol/L" for a quantity record, or '' when there is no number. */
export function quantText(record) {
  const unit = record.unit && record.unit !== 'fraction' ? ` ${record.unit}` : ''
  if (typeof record.value === 'number') return `${record.approximate ? 'about ' : ''}${number(record.value)}${unit}`
  if (typeof record.low === 'number' && typeof record.high === 'number') return `${number(record.low)} to ${number(record.high)}${unit}`
  return ''
}

/**
 * Chips for the quantities of the entries a claim is about: [{ id, subject, subjectName, kind, text,
 * authority, population }], limits and doses first, at most `limit`. `api` is { quantFor, getEntity }
 * (the knowledge module).
 */
export function claimQuantities({ quantFor, getEntity }, claim, limit = 8) {
  const subjects = [...new Set([...claim.associated, ...(claim.graphIds ?? [])])].filter((id) => /^(compound|intervention):/.test(id))
  const found = []
  for (const subject of subjects) {
    for (const record of quantFor(subject)) {
      if (!(record.kind in KIND_RANK)) continue
      const text = quantText(record)
      if (!text) continue
      found.push({ id: record.id, subject, subjectName: getEntity(subject)?.name ?? subject, kind: record.kind, text, authority: record.authority ?? '', population: record.population ?? '', rank: KIND_RANK[record.kind] })
    }
  }
  return found.sort((a, b) => a.rank - b.rank || a.subjectName.localeCompare(b.subjectName)).slice(0, limit).map(({ rank, ...chip }) => chip)
}
