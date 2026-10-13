import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import { resolve } from 'node:path'
import { promisify } from 'node:util'
import { RULES, formatReport, validateKnowledge } from '../../src/knowledge/validate.js'
import { edited, fixture } from '../fixtures/knowledge/helpers.js'

const run = promisify(execFile)
const issuesOf = (entities, rule) => {
  const report = validateKnowledge(entities)
  return [...report.errors, ...report.warnings].filter((item) => item.rule === rule)
}
const only = (entities) => validateKnowledge(entities).errors.map((item) => item.rule)

describe('validateKnowledge on the valid fixture', () => {
  const report = validateKnowledge(fixture())

  it('passes with no errors and only the expected unverified-article warning', () => {
    expect(report.ok).toBe(true)
    expect(report.errors).toEqual([])
    expect(report.warnings.map((item) => [item.rule, item.id])).toEqual([['unverified-article', 'article:fixture-unverified']])
  })

  it('reports counts', () => {
    expect(report.counts).toMatchObject({ entities: 23, errors: 0, warnings: 1, mentions: 7, edges: { total: 48, declared: 21, derived: 27 } })
    expect(report.counts.byType).toMatchObject({ compound: 8, enzyme: 2, reaction: 2, claim: 1, article: 2 })
  })

  it('knows a severity for every rule', () => {
    for (const rule of Object.values(RULES)) expect(['error', 'warning']).toContain(rule.severity)
  })
})

describe('validation rules', () => {
  it('schema: reports invalid entities by id and does not cascade into dangling errors', () => {
    const entities = edited((list, find) => { find('compound:sarcosine').summary = 'x'.repeat(201) })
    const report = validateKnowledge(entities)
    expect(report.errors).toEqual([expect.objectContaining({ rule: 'schema', id: 'compound:sarcosine', path: 'summary' })])
    expect(only(entities)).toEqual(['schema'])
    expect(validateKnowledge('nope').errors[0]).toMatchObject({ rule: 'schema' })
    expect(validateKnowledge([42]).errors[0]).toMatchObject({ rule: 'schema', id: '#0' })
  })

  it('duplicate-id', () => {
    expect(issuesOf(fixture(), 'duplicate-id')).toEqual([])
    const entities = fixture()
    entities.push(structuredClone(entities[0]))
    expect(issuesOf(entities, 'duplicate-id')).toEqual([expect.objectContaining({ id: 'compound:glycine', message: expect.stringContaining('2 times') })])
  })

  it('dangling-relation', () => {
    const entities = edited((list, find) => { find('compound:sam').relations.push({ rel: 'increases', to: 'enzyme:ghost' }) })
    expect(issuesOf(entities, 'dangling-relation')).toEqual([expect.objectContaining({ id: 'compound:sam', path: 'relations[1]', message: "relation target 'enzyme:ghost' does not exist" })])
  })

  it('dangling-ref', () => {
    const entities = edited((list, find) => { find('compound:sam').refs.push('article:ghost') })
    expect(issuesOf(entities, 'dangling-ref')).toEqual([expect.objectContaining({ id: 'compound:sam', path: 'refs[1]' })])
  })

  it('dangling-mention and malformed-mention', () => {
    const entities = edited((list, find) => { find('compound:sam').body.push('see [[state:ghost]] and [[oops]]') })
    expect(issuesOf(entities, 'dangling-mention')).toEqual([expect.objectContaining({ id: 'compound:sam', path: 'body[1]' })])
    expect(issuesOf(entities, 'malformed-mention')).toEqual([expect.objectContaining({ id: 'compound:sam', message: expect.stringContaining('[[oops]]') })])
    expect(issuesOf(fixture(), 'dangling-mention')).toEqual([])
  })

  it('dangling-reaction: unknown participants and enzymes', () => {
    const entities = edited((list, find) => {
      find('reaction:gnmt-methylation').reaction.reactants.push({ id: 'compound:ghost', n: 1 })
      find('reaction:gnmt-methylation').reaction.enzymes.push('enzyme:ghost')
    })
    expect(issuesOf(entities, 'dangling-reaction').map((item) => item.path)).toEqual(['reaction.enzymes[1]', 'reaction.reactants[2]'])
  })

  it('relation-type-pair', () => {
    expect(issuesOf(fixture(), 'relation-type-pair')).toEqual([])
    const entities = edited((list, find) => { find('compound:sam').relations.push({ rel: 'catalyzes', to: 'state:under-methylation' }) })
    const [issue] = issuesOf(entities, 'relation-type-pair')
    expect(issue).toMatchObject({ id: 'compound:sam' })
    expect(issue.message).toContain('compound -> state')
    expect(issue.message).toContain('enzyme -> reaction')
  })

  it('self-relation', () => {
    expect(issuesOf(fixture(), 'self-relation')).toEqual([])
    const entities = edited((list, find) => { find('compound:sam').relations.push({ rel: 'associated-with', to: 'compound:sam' }) })
    expect(issuesOf(entities, 'self-relation')).toEqual([expect.objectContaining({ id: 'compound:sam' })])
  })

  it('orphan: an entity with no links in or out', () => {
    expect(issuesOf(fixture(), 'orphan')).toEqual([])
    const entities = [...fixture(), { id: 'compound:lonely', type: 'compound', name: 'Lonely', summary: 's', evidence: 'plausible' }]
    expect(issuesOf(entities, 'orphan')).toEqual([expect.objectContaining({ id: 'compound:lonely' })])
    expect(issuesOf(entities, 'unreachable')).toEqual([])
  })

  it('orphan: a mention counts as a link', () => {
    const entities = [...fixture(), { id: 'compound:lonely', type: 'compound', name: 'Lonely', summary: 's', evidence: 'plausible', body: ['see [[compound:sam]]'] }]
    expect(issuesOf(entities, 'orphan')).toEqual([])
  })

  it('unreachable: an island not connected to the main graph', () => {
    const island = [
      { id: 'compound:island-a', type: 'compound', name: 'A', summary: 's', evidence: 'plausible', relations: [{ rel: 'precursor-of', to: 'compound:island-b' }] },
      { id: 'compound:island-b', type: 'compound', name: 'B', summary: 's', evidence: 'plausible' }
    ]
    const issues = issuesOf([...fixture(), ...island], 'unreachable')
    expect(issues).toHaveLength(1)
    expect(issues[0].message).toContain('2-entity island (compound:island-a, compound:island-b)')
    expect(issuesOf([...fixture(), ...island], 'orphan')).toEqual([])
  })

  it('uncited-article', () => {
    expect(issuesOf(fixture(), 'uncited-article')).toEqual([])
    const entities = [...fixture(), { id: 'article:nobody-cites-me', type: 'article', name: 'Uncited', summary: 's', evidence: 'plausible', authors: ['A'], year: 2000, journal: 'J', verified: true, takeaways: ['t'], relations: [{ rel: 'associated-with', to: 'article:fixture-gnmt-review' }] }]
    expect(issuesOf(entities, 'uncited-article')).toEqual([expect.objectContaining({ id: 'article:nobody-cites-me' })])
  })

  it('uncited-article: refs, mentions and the article’s own evidence relation all count as use', () => {
    const base = { type: 'article', name: 'N', summary: 's', evidence: 'plausible', authors: ['A'], year: 2000, journal: 'J', verified: true, takeaways: ['t'] }
    const viaRef = edited((list, find) => {
      list.push({ ...base, id: 'article:via-ref' })
      find('compound:sah').refs.push('article:via-ref')
    })
    const viaMention = edited((list, find) => {
      list.push({ ...base, id: 'article:via-mention' })
      find('compound:sah').body = ['see [[article:via-mention]]']
    })
    const viaOwnRelation = [...fixture(), { ...base, id: 'article:via-relation', relations: [{ rel: 'evidence-for', to: 'compound:sah' }] }]
    for (const entities of [viaRef, viaMention, viaOwnRelation]) expect(issuesOf(entities, 'uncited-article')).toEqual([])
  })

  it('claim-no-evidence: errors unless the claim is flagged, in which case it warns', () => {
    const noEvidence = (change) => edited((list, find) => {
      const claim = find('claim:glycine-depletes-sam')
      delete claim.refs
      claim.status = 'supported'
      claim.evidence = 'plausible'
      Object.assign(claim, change)
      list.splice(list.findIndex((item) => item.id === 'article:fixture-unverified'), 1)
    })
    expect(issuesOf(fixture(), 'claim-no-evidence')).toEqual([])
    expect(issuesOf(noEvidence({}), 'claim-no-evidence')).toEqual([expect.objectContaining({ id: 'claim:glycine-depletes-sam' })])
    for (const flag of [{ status: 'unsupported' }, { evidence: 'conversation-only' }]) {
      const entities = noEvidence(flag)
      expect(issuesOf(entities, 'claim-no-evidence')).toEqual([])
      expect(issuesOf(entities, 'claim-flagged-no-evidence')).toHaveLength(1)
      expect(validateKnowledge(entities).ok).toBe(true)
    }
  })

  it('claim-no-evidence: counter-evidence alone satisfies the rule', () => {
    const entities = edited((list, find) => { delete find('claim:glycine-depletes-sam').refs })
    expect(issuesOf(entities, 'claim-no-evidence')).toEqual([])
  })

  it('established-no-ref', () => {
    expect(issuesOf(fixture(), 'established-no-ref')).toEqual([])
    const entities = edited((list, find) => { delete find('compound:sah').refs })
    expect(issuesOf(entities, 'established-no-ref')).toEqual([expect.objectContaining({ id: 'compound:sah' })])
    const plausible = edited((list, find) => {
      delete find('compound:sah').refs
      find('compound:sah').evidence = 'plausible'
    })
    expect(issuesOf(plausible, 'established-no-ref')).toEqual([])
  })

  it('established-no-ref: articles themselves are exempt', () => {
    const entities = edited((list, find) => { find('article:fixture-unverified').evidence = 'established' })
    expect(issuesOf(entities, 'established-no-ref')).toEqual([])
  })

  it('unverified-article is a warning, not an error', () => {
    const issues = issuesOf(fixture(), 'unverified-article')
    expect(issues).toEqual([expect.objectContaining({ severity: 'warning', id: 'article:fixture-unverified' })])
    expect(validateKnowledge(fixture()).ok).toBe(true)
  })

  it('type-coverage: every type needs an entity', () => {
    expect(issuesOf(fixture(), 'type-coverage')).toEqual([])
    const entities = fixture().filter((item) => item.type !== 'system' && item.id !== 'state:hypochlorhydria')
    expect(issuesOf(entities, 'type-coverage')).toEqual([expect.objectContaining({ message: "no entities of type 'system'" })])
    expect(issuesOf([], 'type-coverage')).toHaveLength(11)
  })
})

describe('report formatting', () => {
  it('groups by severity then rule with counts and a result line', () => {
    const entities = edited((list, find) => {
      find('compound:sam').relations.push({ rel: 'increases', to: 'enzyme:ghost' })
      list.push({ id: 'compound:lonely', type: 'compound', name: 'L', summary: 's', evidence: 'plausible' })
    })
    const text = formatReport(validateKnowledge(entities))
    expect(text).toContain('Entities: 24 (compound 9')
    expect(text).toMatch(/ERRORS \(2\)\n {2}dangling-relation: Relations pointing at missing entities \(1\)\n {4}- compound:sam relations\[1\]: relation target 'enzyme:ghost' does not exist/)
    expect(text).toMatch(/ {2}orphan: Orphans \(no links in or out\) \(1\)\n {4}- compound:lonely: /)
    expect(text).toMatch(/WARNINGS \(1\)\n {2}unverified-article/)
    expect(text.trim().split('\n').at(-1)).toBe('Result: FAILED - 2 errors, 1 warning')
  })

  it('says OK when there are no errors', () => {
    expect(formatReport(validateKnowledge(fixture())).trim().split('\n').at(-1)).toBe('Result: OK - 0 errors, 1 warning')
  })
})

describe('scripts/kb-validate.js', () => {
  const script = resolve(import.meta.dirname, '../../scripts/kb-validate.js')
  const fixtures = resolve(import.meta.dirname, '../fixtures/knowledge')
  const cli = (...args) => run(process.execPath, [script, ...args]).then((out) => ({ code: 0, ...out }), (error) => ({ code: error.code, stdout: error.stdout, stderr: error.stderr }))

  it('exits 0 with a readable report when only warnings exist', async () => {
    const result = await cli('--data', `${fixtures}/valid.js`)
    expect(result.code).toBe(0)
    expect(result.stdout).toContain('Result: OK - 0 errors, 1 warning')
  })

  it('exits 1 on errors', async () => {
    const result = await cli('--data', `${fixtures}/broken.js`)
    expect(result.code).toBe(1)
    expect(result.stdout).toContain('Result: FAILED')
    expect(result.stdout).toContain("compound:missing' does not exist")
  })

  it('prints machine readable output with --json', async () => {
    const ok = JSON.parse((await cli('--json', '--data', `${fixtures}/valid.js`)).stdout)
    expect(ok).toMatchObject({ ok: true, errors: [], counts: { entities: 23, errors: 0, warnings: 1 } })
    const bad = await cli('--json', '--data', `${fixtures}/broken.js`)
    expect(bad.code).toBe(1)
    const parsed = JSON.parse(bad.stdout)
    expect(parsed.ok).toBe(false)
    expect(parsed.errors.map((item) => item.rule)).toEqual(expect.arrayContaining(['schema', 'dangling-relation']))
  })

  it('exits 1 when the data module cannot be loaded', async () => {
    const result = await cli('--data', `${fixtures}/does-not-exist.js`)
    expect(result.code).toBe(1)
    expect(result.stderr).toContain('could not load')
    expect(JSON.parse((await cli('--json', '--data', `${fixtures}/does-not-exist.js`)).stdout)).toMatchObject({ ok: false })
  })
})
