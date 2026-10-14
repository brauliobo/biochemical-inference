// Knowledge base validation, shared by scripts/kb-validate.js and the unit tests.
// Pure: raw entity array in, report object out. Errors fail the build; warnings do not.
import { TYPES } from './types.js'
import { allowedPair, describeAllowed, edgeSign } from './relations.js'
import { checkEntity } from './schema.js'
import { buildGraph, connectedComponents } from './graph.js'
import { PATH_RULES, checkPaths } from './guided-paths.js'
import { QUANT_RULES, checkQuant } from './quant-validate.js'

export const RULES = Object.freeze({
  schema: { severity: 'error', title: 'Schema violations' },
  'duplicate-id': { severity: 'error', title: 'Duplicate ids' },
  'dangling-relation': { severity: 'error', title: 'Relations pointing at missing entities' },
  'dangling-ref': { severity: 'error', title: 'Refs pointing at missing articles' },
  'dangling-mention': { severity: 'error', title: 'Body mentions of missing entities' },
  'dangling-reaction': { severity: 'error', title: 'Reaction participants or enzymes that do not exist' },
  'dangling-claim': { severity: 'error', title: 'Edge claims that do not exist or are not claims' },
  'sign-conflict': { severity: 'error', title: 'Entity pairs joined by both a raising and a lowering edge' },
  'malformed-mention': { severity: 'error', title: 'Malformed [[...]] mentions' },
  'relation-type-pair': { severity: 'error', title: 'Relations between disallowed entity types' },
  'self-relation': { severity: 'error', title: 'Relations from an entity to itself' },
  orphan: { severity: 'error', title: 'Orphans (no links in or out)' },
  unreachable: { severity: 'error', title: 'Entities disconnected from the main graph' },
  'uncited-article': { severity: 'error', title: 'Articles nothing cites' },
  'claim-no-evidence': { severity: 'error', title: 'Claims with no evidence-for/against' },
  'established-no-ref': { severity: 'error', title: "Entities graded 'established' without a reference" },
  'type-coverage': { severity: 'error', title: 'Entity types with no entities' },
  ...PATH_RULES,
  ...QUANT_RULES,
  'claim-flagged-no-evidence': { severity: 'warning', title: 'Flagged claims with no evidence yet' },
  'unverified-article': { severity: 'warning', title: 'Articles not yet verified' }
})

const DANGLING_RULE = { relation: 'dangling-relation', ref: 'dangling-ref', mention: 'dangling-mention', reaction: 'dangling-reaction', claim: 'dangling-claim' }
const DANGLING_WHAT = { relation: 'relation target', ref: 'ref', mention: 'mention', reaction: 'reaction participant', claim: 'edge claim' }
const RULE_ORDER = Object.keys(RULES)
const MEMBER_PREVIEW = 8

const isEvidenceLink = (link) => link.rel === 'has-evidence' || link.rel === 'has-counterevidence'

/**
 * validateKnowledge(rawEntities, { paths }) -> { ok, counts, errors, warnings }
 * `paths` (optional) is the guided-path list from data/paths.js; when given, every path is checked
 * against the graph (schema, duplicate ids, steps that do not resolve).
 * `quant` (optional) is the structured-quantity list from data/quant.js; when given, every record is
 * checked (see quant-validate.js).
 */
export function validateKnowledge(rawEntities, { paths, quant } = {}) {
  const issues = []
  const add = (rule, id, message, path = '') => issues.push({ rule, severity: RULES[rule].severity, id, path, message })

  if (!Array.isArray(rawEntities)) {
    add('schema', '', 'knowledge data must be an array of entities')
    return finish(issues, { entities: 0, byType: {}, edges: { total: 0, declared: 0, derived: 0 }, mentions: 0 })
  }

  // 1. structure
  const valid = []
  const invalidIds = new Set()
  rawEntities.forEach((raw, index) => {
    const found = checkEntity(raw, index)
    if (!found.length) return valid.push(raw)
    if (typeof raw?.id === 'string') invalidIds.add(raw.id)
    for (const item of found) add('schema', item.id, item.message, item.path)
  })

  const counted = new Map()
  for (const raw of rawEntities) if (typeof raw?.id === 'string') counted.set(raw.id, (counted.get(raw.id) ?? 0) + 1)
  for (const [id, count] of counted) if (count > 1) add('duplicate-id', id, `id is defined ${count} times; the first definition wins`)

  const graph = buildGraph(valid)

  // 2. references
  for (const item of graph.dangling) {
    if (invalidIds.has(item.target)) continue // already reported as a schema error; avoid cascades
    add(DANGLING_RULE[item.kind], item.owner, `${DANGLING_WHAT[item.kind]} '${item.target}' does not exist`, item.path)
  }
  for (const item of graph.malformedMentions) add('malformed-mention', item.owner, `${item.raw} is not a valid mention; use [[type:slug]] or [[type:slug|text]]`, item.path)

  // 3. relations
  for (const edge of graph.edges) {
    if (edge.from === edge.to) add('self-relation', edge.from, `relation '${edge.rel}' points at the entity itself`)
    if (edge.origin !== 'declared') continue
    const fromType = graph.get(edge.from).type
    const toType = graph.get(edge.to).type
    if (!allowedPair(edge.rel, fromType, toType)) {
      add('relation-type-pair', edge.from, `'${edge.rel}' to ${edge.to} links ${fromType} -> ${toType}, but allowed is ${describeAllowed(edge.rel)}`)
    }
  }

  // 3b. signed edges must not contradict each other
  const signs = new Map()
  for (const edge of graph.edges) {
    const sign = edgeSign(edge)
    if (!sign) continue
    const key = `${edge.from}|${edge.to}`
    const found = signs.get(key)
    if (!found) signs.set(key, { signs: new Set([sign]), rels: [edge.rel] })
    else {
      found.signs.add(sign)
      found.rels.push(edge.rel)
    }
  }
  for (const [key, found] of signs) {
    if (found.signs.size < 2) continue
    const [from, to] = key.split('|')
    add('sign-conflict', from, `both raises and lowers ${to} (${found.rels.join(', ')}); keep the one the evidence supports`)
  }

  // 4. connectivity
  const [main, ...rest] = connectedComponents(graph)
  for (const entity of graph.entities) if (graph.degree(entity.id) === 0) add('orphan', entity.id, 'has no relations, refs or mentions in or out')
  for (const component of rest) {
    if (component.length < 2) continue
    const shown = component.slice(0, MEMBER_PREVIEW).join(', ')
    add('unreachable', component[0], `part of a ${component.length}-entity island (${shown}${component.length > MEMBER_PREVIEW ? ', ...' : ''}) not connected to the main graph of ${main.length}`)
  }

  // 5. evidence discipline
  for (const entity of graph.entities) {
    const links = graph.links(entity.id)
    const hasReference = links.some((link) => link.rel === 'has-evidence' && graph.get(link.other).type === 'article')
    if (entity.evidence === 'established' && entity.type !== 'article' && !hasReference) {
      add('established-no-ref', entity.id, "evidence is 'established' but no article is referenced (add refs: ['article:...'])")
    }
    if (entity.type === 'article') {
      const cited = links.some((link) => graph.get(link.other).type !== 'article') || graph.mentionedBy(entity.id).some((id) => graph.get(id).type !== 'article')
      if (!cited) add('uncited-article', entity.id, 'no entity cites this article (refs, relation or mention)')
      if (entity.verified === false) add('unverified-article', entity.id, `verified: false${entity.doi ? ` (doi ${entity.doi})` : ''}; check the citation before relying on it`)
    }
    if (entity.type === 'claim' && !links.some(isEvidenceLink)) {
      const flagged = entity.status === 'unsupported' || entity.evidence === 'conversation-only'
      add(flagged ? 'claim-flagged-no-evidence' : 'claim-no-evidence', entity.id,
        flagged ? 'flagged as unsupported/conversation-only and has no evidence yet' : 'has no evidence-for or evidence-against (add refs, or mark it status: unsupported / evidence: conversation-only)')
    }
  }

  // 6. coverage
  for (const type of TYPES) if (!graph.byType.get(type.id)?.length) add('type-coverage', '', `no entities of type '${type.id}'`)

  // 7. guided paths
  if (paths !== undefined) for (const item of checkPaths(paths, graph)) issues.push(item)

  // 8. structured quantities
  if (quant !== undefined) {
    for (const item of checkQuant(quant, graph)) add(item.rule, item.id, item.message, item.path)
  }

  return finish(issues, {
    entities: graph.stats.entities,
    byType: Object.fromEntries(TYPES.map((type) => [type.id, graph.byType.get(type.id).length])),
    edges: { total: graph.stats.edges, declared: graph.stats.declared, derived: graph.stats.derived },
    mentions: graph.stats.mentions,
    ...(Array.isArray(paths) ? { paths: paths.length } : {}),
    ...(Array.isArray(quant) ? { quant: quant.length } : {})
  })
}

function finish(issues, counts) {
  issues.sort((a, b) => RULE_ORDER.indexOf(a.rule) - RULE_ORDER.indexOf(b.rule) || a.id.localeCompare(b.id) || a.path.localeCompare(b.path))
  const errors = issues.filter((item) => item.severity === 'error')
  const warnings = issues.filter((item) => item.severity === 'warning')
  return { ok: errors.length === 0, counts: { ...counts, errors: errors.length, warnings: warnings.length }, errors, warnings }
}

/** Human readable report, grouped by severity then rule. */
export function formatReport(report) {
  const { counts } = report
  const lines = ['Knowledge base validation', '']
  const types = Object.entries(counts.byType).map(([type, count]) => `${type} ${count}`).join(', ')
  lines.push(`Entities: ${counts.entities}${types ? ` (${types})` : ''}`)
  lines.push(`Relations: ${counts.edges.total} (${counts.edges.declared} declared, ${counts.edges.derived} derived); body mentions: ${counts.mentions}${counts.paths === undefined ? '' : `; guided paths: ${counts.paths}`}${counts.quant === undefined ? '' : `; quantities: ${counts.quant}`}`, '')
  const section = (label, items) => {
    if (!items.length) return
    lines.push(`${label} (${items.length})`)
    const byRule = Map.groupBy(items, (item) => item.rule)
    for (const [rule, group] of byRule) {
      lines.push(`  ${rule}: ${RULES[rule].title} (${group.length})`)
      for (const item of group) lines.push(`    - ${item.id ? `${item.id}${item.path ? ` ${item.path}` : ''}: ` : ''}${item.message}`)
    }
    lines.push('')
  }
  section('ERRORS', report.errors)
  section('WARNINGS', report.warnings)
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`
  lines.push(`Result: ${report.ok ? 'OK' : 'FAILED'} - ${plural(counts.errors, 'error')}, ${plural(counts.warnings, 'warning')}`)
  return lines.join('\n')
}
