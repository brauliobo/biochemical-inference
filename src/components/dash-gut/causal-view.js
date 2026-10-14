// Pure helpers for the causal maps of the gut/B6/bile/TMA dashboards. No Vue, no DOM.
//
// The page names the entities it wants to see (`include`); the map is the signed causal edges of the
// knowledge base among those entities, so a map stays small and readable (the atlas, not these pages,
// is where whole neighbourhoods are explored). Hypothesis edges keep their flag, the claim that asserts
// them and that claim's verdict, so the page can link every dashed edge to /evidence/claim/<slug>.
import { TIER_LABELS, tierOf } from '../../knowledge/causal.js'
import { vizSign } from '../../kb/evidence-graph.js'
import { SIGNS } from '../../viz/shapes.js'

/** Verdict words and badge tones of the four claim statuses (the same words the evidence dashboards print). */
export const CLAIM_STATUS = Object.freeze({
  supported: Object.freeze({ word: 'Supported', tone: 'success' }),
  'partly-supported': Object.freeze({ word: 'Partly supported', tone: 'info' }),
  unsupported: Object.freeze({ word: 'Unsupported', tone: 'danger' }),
  contested: Object.freeze({ word: 'Contested', tone: 'warning' })
})

export const claimSlug = (claimId) => String(claimId).replace(/^claim:/, '')
/** The evidence dashboards' page for a claim id. */
export const claimPath = (claimId) => `/evidence/claim/${claimSlug(claimId)}`
export const articlePath = (articleId) => `/evidence/article/${String(articleId).replace(/^article:/, '')}`

/** "Proton pump inhibitors (omeprazole, ...)" -> "Proton pump inhibitors". */
export const shortName = (name) => String(name).replace(/\s*[(:].*$/, '').trim() || String(name)

export function statusInfo(status) {
  return CLAIM_STATUS[status] ?? { word: status ? String(status) : 'No claim', tone: 'muted' }
}

/**
 * The induced causal subgraph of `include` as LayeredGraph props plus a text row per edge.
 *   knowledge: the knowledge module ({ causalGraph })
 *   options.include: entity ids to show (unknown ids and nodes without an edge among the others are dropped)
 *   options.labels: { id: 'short label' } overrides
 * Returns { nodes, edges, rows, tierNames, hypothesisRows } where
 *   nodes [{ id, label, type, tier, grade }], edges [{ from, to, sign, hypothesis }] (LayeredGraph),
 *   rows [{ key, from, to, fromName, toName, rel, sign, signWord, hypothesis, claimId, claimStatus, status, strength, note }].
 */
export function causalView(knowledge, { include, labels = {} }) {
  const allowed = new Set(include)
  const full = knowledge.causalGraph()
  const edges = full.edges.filter((edge) => allowed.has(edge.from) && allowed.has(edge.to) && edge.from !== edge.to)
  const used = new Set(edges.flatMap((edge) => [edge.from, edge.to]))
  const byId = new Map(full.nodes.map((node) => [node.id, node]))
  const nodes = include
    .filter((id) => used.has(id) && byId.has(id))
    .map((id) => {
      const node = byId.get(id)
      const tier = tierOf(node.type)
      return { id, label: labels[id] ?? shortName(node.name), type: node.type, ...(tier === null ? {} : { tier }), grade: node.evidence }
    })
  const name = (id) => labels[id] ?? shortName(byId.get(id)?.name ?? id)
  const rows = edges.map((edge) => {
    const sign = vizSign(edge)
    return {
      key: `${edge.from}|${edge.rel}|${edge.to}`,
      from: edge.from,
      to: edge.to,
      fromName: name(edge.from),
      toName: name(edge.to),
      rel: edge.rel,
      sign,
      signWord: SIGNS[sign].label,
      hypothesis: edge.hypothesis,
      claimId: edge.claimId,
      claimStatus: edge.claimStatus,
      status: statusInfo(edge.claimStatus),
      strength: edge.strength,
      note: edge.note
    }
  })
  return {
    nodes,
    edges: rows.map((row) => ({ from: row.from, to: row.to, sign: row.sign, hypothesis: row.hypothesis })),
    rows,
    tierNames: TIER_LABELS,
    hypothesisRows: rows.filter((row) => row.hypothesis)
  }
}

/** Edges that touch a node (either end), hypothesis edges first. */
export function rowsAt(view, nodeId) {
  return view.rows.filter((row) => row.from === nodeId || row.to === nodeId).sort((a, b) => Number(b.hypothesis) - Number(a.hypothesis))
}

/** Text for the summary line under a map: how many entities, links, hypotheses, and the claims behind them. */
export function describeView(view) {
  const claims = new Set(view.hypothesisRows.map((row) => row.claimId).filter(Boolean))
  return `${view.nodes.length} entries and ${view.edges.length} signed links; ${view.hypothesisRows.length} are hypotheses (dashed), asserted by ${claims.size} claims whose verdicts are listed below the map.`
}
