// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { causalView, claimPath, describeView, rowsAt, shortName, statusInfo } from '../../src/components/dash-gut/causal-view.js'
import { BILE_MAP, B6_MAP, GUT_ACID_MAP, HISTAMINE_MAP, TMA_MAP } from '../../src/components/dash-gut/map-sets.js'
import * as knowledge from '../../src/knowledge/index.js'

const SETS = { GUT_ACID_MAP, HISTAMINE_MAP, B6_MAP, BILE_MAP, TMA_MAP }

/** Is there a directed path from -> to in the view's edges? */
function reaches(view, from, to) {
  const seen = new Set([from])
  const queue = [from]
  for (const id of queue) {
    for (const edge of view.edges) {
      if (edge.from === id && !seen.has(edge.to)) {
        seen.add(edge.to)
        queue.push(edge.to)
      }
    }
  }
  return seen.has(to)
}

describe('map sets', () => {
  for (const [name, set] of Object.entries(SETS)) {
    it(`${name}: every entity exists, labels are for listed entities, the map is small and layered`, () => {
      for (const id of set.include) expect(knowledge.getEntity(id), id).toBeTruthy()
      for (const id of Object.keys(set.labels)) expect(set.include, `label for unlisted ${id}`).toContain(id)
      const view = causalView(knowledge, set)
      expect(view.nodes.length).toBeGreaterThanOrEqual(10)
      expect(view.nodes.length).toBeLessThanOrEqual(30)
      expect(view.edges.length).toBeLessThanOrEqual(60)
      expect(new Set(view.nodes.map((node) => node.id)).size).toBe(view.nodes.length)
      for (const node of view.nodes) {
        expect(node.label.length, node.id).toBeGreaterThan(0)
        expect(node.label.length, node.id).toBeLessThanOrEqual(40)
        expect(node.tier, node.id).toBeGreaterThanOrEqual(0)
      }
      const ids = new Set(view.nodes.map((node) => node.id))
      for (const edge of view.edges) {
        expect(ids.has(edge.from) && ids.has(edge.to)).toBe(true)
        expect(['increase', 'decrease', 'mitigate', 'aggravate', 'neutral']).toContain(edge.sign)
      }
    })

    it(`${name}: every hypothesis edge names the claim that asserts it, with a verdict and an evidence link`, () => {
      const view = causalView(knowledge, set)
      expect(view.hypothesisRows.length).toBeGreaterThan(0)
      for (const row of view.hypothesisRows) {
        expect(row.claimId, row.key).toMatch(/^claim:/)
        expect(['supported', 'partly-supported', 'unsupported', 'contested']).toContain(row.claimStatus)
        expect(claimPath(row.claimId)).toMatch(/^\/evidence\/claim\/[a-z0-9-]+$/)
        expect(knowledge.getEntity(row.claimId), row.claimId).toBeTruthy()
      }
    })
  }
})

describe('the chains of the conversation are in the maps', () => {
  const gut = causalView(knowledge, GUT_ACID_MAP)
  it('glycine powder -> belching (hypothesis, unsupported claim) and belching -> LPR -> throat burning', () => {
    const direct = gut.rows.find((row) => row.from === 'intervention:glycine-powder' && row.to === 'outcome:belching')
    expect(direct).toMatchObject({ hypothesis: true, claimStatus: 'unsupported', sign: 'increase' })
    expect(reaches(gut, 'intervention:glycine-powder', 'outcome:throat-burning')).toBe(true)
    expect(reaches(gut, 'intervention:collagen-peptides', 'outcome:throat-burning')).toBe(true)
  })
  it('PPI -> SIBO and H. pylori -> low acid branches exist; betaine HCl aggravates throat burning', () => {
    expect(reaches(gut, 'intervention:ppi-therapy', 'disease:sibo')).toBe(true)
    expect(reaches(gut, 'disease:h-pylori-infection', 'state:hypochlorhydria')).toBe(true)
    expect(gut.rows.find((row) => row.from === 'intervention:betaine-hcl' && row.to === 'outcome:throat-burning')).toMatchObject({ sign: 'aggravate' })
  })
  it('histamine excess -> night waking, tachycardia and flushing; choline and betaine levers are signed edges', () => {
    const view = causalView(knowledge, HISTAMINE_MAP)
    for (const outcome of ['outcome:night-waking', 'outcome:tachycardia', 'outcome:flushing']) expect(reaches(view, 'state:histamine-excess', outcome), outcome).toBe(true)
    expect(reaches(view, 'intervention:choline-bitartrate', 'outcome:night-waking')).toBe(true)
    expect(reaches(view, 'intervention:betaine-anhydrous', 'state:undermethylation')).toBe(true)
    expect(reaches(view, 'intervention:p5p-supplement', 'disease:anxiety-disorder')).toBe(true)
    expect(view.rows.find((row) => row.from === 'enzyme:hnmt' && row.to === 'compound:histamine')).toMatchObject({ sign: 'decrease' })
    expect(view.rows.find((row) => row.from === 'compound:sam' && row.to === 'enzyme:hnmt')).toMatchObject({ sign: 'increase', claimId: 'claim:hnmt-needs-sam' })
  })
  it('TMAO links to cardiovascular disease as a contested hypothesis; choline above the UL leads to fishy odour', () => {
    const view = causalView(knowledge, TMA_MAP)
    expect(view.rows.find((row) => row.from === 'compound:tmao' && row.to === 'disease:cardiovascular-disease')).toMatchObject({ hypothesis: true, claimStatus: 'contested' })
    expect(reaches(view, 'state:choline-excess', 'outcome:fishy-odor')).toBe(true)
  })
  it('bile reflux is a hypothesis edge from glycine, asserted by an unsupported claim', () => {
    const view = causalView(knowledge, BILE_MAP)
    expect(view.rows.find((row) => row.from === 'compound:glycine' && row.to === 'state:duodenogastric-reflux')).toMatchObject({ hypothesis: true, claimStatus: 'unsupported' })
  })
  it('PLP is the cofactor of GAD, SHMT, glycine cleavage and CBS', () => {
    const view = causalView(knowledge, B6_MAP)
    for (const enzyme of ['enzyme:gad', 'enzyme:shmt', 'enzyme:glycine-cleavage-system', 'enzyme:cbs']) {
      expect(view.rows.find((row) => row.from === 'compound:plp' && row.to === enzyme), enzyme).toBeTruthy()
    }
  })
})

describe('helpers', () => {
  it('shortName strips the parenthetical', () => {
    expect(shortName('Proton pump inhibitors (omeprazole, pantoprazole)')).toBe('Proton pump inhibitors')
    expect(shortName('Glycine')).toBe('Glycine')
  })
  it('statusInfo gives the evidence dashboards\' words and a muted fallback', () => {
    expect(statusInfo('partly-supported')).toEqual({ word: 'Partly supported', tone: 'info' })
    expect(statusInfo(null)).toEqual({ word: 'No claim', tone: 'muted' })
  })
  it('rowsAt lists the edges at a node, hypotheses first, and describeView counts them', () => {
    const view = causalView(knowledge, GUT_ACID_MAP)
    const rows = rowsAt(view, 'outcome:belching')
    expect(rows.length).toBeGreaterThan(3)
    const firstPlain = rows.findIndex((row) => !row.hypothesis)
    expect(rows.slice(firstPlain).every((row) => !row.hypothesis)).toBe(true)
    expect(describeView(view)).toMatch(/\d+ entries and \d+ signed links; \d+ are hypotheses/)
  })
})
