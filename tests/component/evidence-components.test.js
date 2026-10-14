import { fireEvent, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import ClaimDumbbell from '../../src/components/evidence/ClaimDumbbell.vue'
import CoverageMap from '../../src/components/evidence/CoverageMap.vue'
import DesignIcon from '../../src/components/evidence/DesignIcon.vue'
import GradeMark from '../../src/components/evidence/GradeMark.vue'
import IndexGauge from '../../src/components/evidence/IndexGauge.vue'
import LiteratureTimeline from '../../src/components/evidence/LiteratureTimeline.vue'
import ScoringHelp from '../../src/components/evidence/ScoringHelp.vue'
import StatusTiles from '../../src/components/evidence/StatusTiles.vue'
import VerdictBar from '../../src/components/evidence/VerdictBar.vue'
import WhyChips from '../../src/components/evidence/WhyChips.vue'
import { graph } from '../../src/knowledge/index.js'
import { SCORING, buildEvidenceModel, dumbbellRows, statusCounts } from '../../src/kb/evidence.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const model = buildEvidenceModel(graph)
const claim = (id) => model.claimById.get(`claim:${id}`)

describe('StatusTiles', () => {
  it('prints the four headline counters and reports the chosen status', async () => {
    const { container } = mountVapor(StatusTiles, { props: { counts: statusCounts(model.claims), total: 65 } })
    const tiles = [...container.querySelectorAll('.ev-tile')]
    expect(tiles.map((tile) => tile.querySelector('.ev-tile__count').textContent)).toEqual(['11', '33', '14', '7'])
    expect(tiles.map((tile) => tile.querySelector('.ev-tile__label').textContent)).toEqual(['Supported', 'Partly supported', 'Unsupported', 'Contested'])
    expect(tiles.every((tile) => tile.getAttribute('aria-pressed') === 'false')).toBe(true)
    expect(container.querySelector('[role="group"]').getAttribute('aria-label')).toMatch(/status/)
    await expectAccessible(container)
  })

  it('toggles the pressed state when a tile is clicked (v-model)', async () => {
    const { container } = mountVapor(StatusTiles, { props: { counts: statusCounts(model.claims), total: 65, modelValue: 'contested' } })
    expect(container.querySelector('.ev-tile--contested').getAttribute('aria-pressed')).toBe('true')
    expect(container.querySelector('.ev-tile--supported').getAttribute('aria-pressed')).toBe('false')
  })
})

describe('VerdictBar', () => {
  it('draws the split and states it in words', () => {
    const maxTotal = Math.max(...model.claims.map((entry) => entry.evidenceFor + entry.evidenceAgainst))
    const { container } = mountVapor(VerdictBar, { props: { claim: claim('niacin-drains-methyl-groups'), maxTotal } })
    expect(container.querySelector('.ev-vbar__for')).toBeTruthy()
    expect(container.querySelector('.ev-vbar__against')).toBeNull()
    expect(container.querySelector('.visually-hidden').textContent).toMatch(/Evidence for \d+(\.\d)? from 5 articles, against 0 from 0 articles\. Support index \+0\.71/)
    expect(container.querySelector('.ev-vbar__nums').textContent).toBe('+0.71')
  })

  it('draws both parts for a contested claim and nothing for a claim without sources', () => {
    const contested = mountVapor(VerdictBar, { props: { claim: claim('above-ul-tmao-endothelial-stress'), maxTotal: 3 } })
    expect(contested.container.querySelector('.ev-vbar__for')).toBeTruthy()
    expect(contested.container.querySelector('.ev-vbar__against')).toBeTruthy()
    const none = mountVapor(VerdictBar, { props: { claim: claim('undermethylated-hypochlorhydria'), maxTotal: 3 } })
    expect(none.container.querySelector('.ev-vbar__fill')).toBeNull()
    expect(none.container.querySelector('.ev-vbar__none').textContent).toBe('no source')
    expect(none.container.querySelector('.visually-hidden').textContent).toMatch(/No supporting or contradicting article/)
  })
})

describe('ScoringHelp', () => {
  it('is closed by default and shows the formula, the weights and the caveat when opened', async () => {
    const { container } = mountVapor(ScoringHelp, { props: { articles: model.articles } })
    const details = container.querySelector('details')
    expect(details.open).toBe(false)
    expect(details.querySelector('summary').textContent).toBe('How is this scored?')
    expect(details.textContent).toContain(SCORING.formula)
    expect(details.textContent).toMatch(/not a meta-analysis/i)
    const rows = details.querySelectorAll('tbody tr')
    expect(rows).toHaveLength(11)
    expect(within(rows[0]).getByText('Meta-analysis')).toBeTruthy()
    expect(rows[0].querySelectorAll('td')[0].textContent).toBe('1')
    expect(rows[0].querySelectorAll('td')[1].textContent).toBe('17')
    await expectAccessible(container)
  })
})

describe('WhyChips and IndexGauge', () => {
  it('lists generated chips with their tones', async () => {
    const { container } = mountVapor(WhyChips, { props: { claim: claim('free-glycine-stimulates-gastrin') } })
    const chips = [...container.querySelectorAll('.badge')]
    expect(chips.length).toBeGreaterThanOrEqual(3)
    expect(chips.length).toBeLessThanOrEqual(5)
    expect(chips.some((chip) => chip.classList.contains('badge--danger'))).toBe(true)
    await expectAccessible(container)
  })

  it('puts the gauge marker at the index and names the value', () => {
    const { container } = mountVapor(IndexGauge, { props: { index: -0.5, status: 'unsupported' } })
    expect(container.querySelector('.ev-gauge').getAttribute('aria-label')).toMatch(/Support index −0\.50/)
    expect(container.querySelector('.ev-gauge__mark').getAttribute('style')).toMatch(/--at: 0\.25/)
    const none = mountVapor(IndexGauge, { props: { index: 0, noSource: true } })
    expect(none.container.textContent).toMatch(/no source recorded/)
  })
})

describe('DesignIcon and GradeMark', () => {
  it('names the design and the grade as words', () => {
    const design = mountVapor(DesignIcon, { props: { design: 'RCT' } })
    expect(design.container.textContent).toBe('Randomised controlled trial')
    expect(design.container.querySelector('svg').getAttribute('aria-hidden')).toBe('true')
    const short = mountVapor(DesignIcon, { props: { design: 'cohort/observational', short: true } })
    expect(short.container.textContent).toBe('Observational')
    const grade = mountVapor(GradeMark, { props: { grade: 'plausible' } })
    expect(grade.container.textContent).toBe('PPlausible')
    expect(grade.container.querySelector('.viz-grade-plausible')).toBeTruthy()
  })
})

describe('ClaimDumbbell', () => {
  const rows = dumbbellRows(model.claims)

  it('has one linked row per conversation claim, an index and a status word each', async () => {
    const { container } = mountVapor(ClaimDumbbell, { props: { rows } })
    const items = container.querySelectorAll('.ev-db__row')
    expect(items).toHaveLength(rows.length)
    expect(items[0].querySelector('a').getAttribute('href')).toMatch(/^#\/kb\/claim\//)
    expect(items[0].querySelector('.visually-hidden').textContent).toMatch(/support index −?\d\.\d\d; \d+ for, \d+ against/)
    expect(container.querySelectorAll('.viz-toggle')).toHaveLength(4)
    await expectAccessible(container)
  })

  it('hides a status when its legend button is switched off, and keeps the data table complete', async () => {
    const { container } = mountVapor(ClaimDumbbell, { props: { rows } })
    const contested = [...container.querySelectorAll('.viz-toggle')].find((button) => /Contested/.test(button.textContent))
    await fireEvent.click(contested)
    expect(contested.getAttribute('aria-pressed')).toBe('false')
    expect(container.querySelectorAll('.ev-db__row')).toHaveLength(rows.length - rows.filter((row) => row.status === 'contested').length)
    expect(container.querySelectorAll('details tbody tr')).toHaveLength(rows.length)
  })
})

describe('CoverageMap', () => {
  it('prints zeros, lists the gaps and reports the chosen cell', async () => {
    const picked = []
    const { container } = mountVapor(CoverageMap, { props: { articles: model.articles, onSelect: () => (cell) => picked.push(cell) } })
    const cells = [...container.querySelectorAll('[role="gridcell"][data-r]')]
    expect(cells).toHaveLength(6 * 11)
    expect(cells.some((cell) => cell.textContent === '0')).toBe(true)
    expect(container.textContent).toMatch(/no meta-analysis/)
    await fireEvent.click(cells[0])
    expect(picked).toEqual([{ topic: 'gastric', design: 'meta-analysis' }])
    await expectAccessible(container)
  })
})

describe('LiteratureTimeline', () => {
  it('shows every article, then narrows by topic and by year', async () => {
    const { container } = mountVapor(LiteratureTimeline, { props: { articles: model.articles } })
    expect(container.querySelectorAll('.viz-dot-mark')).toHaveLength(465)
    await fireEvent.change(container.querySelector('#ev-tl-topic'), { target: { value: 'histamine' } })
    expect(container.querySelectorAll('.viz-dot-mark')).toHaveLength(24)
    await fireEvent.change(container.querySelector('#ev-tl-topic'), { target: { value: '' } })
    await fireEvent.input(container.querySelector('#ev-tl-from'), { target: { value: '2020' } })
    const recent = container.querySelectorAll('.viz-dot-mark').length
    expect(recent).toBe(model.articles.filter((article) => article.year >= 2020).length)
    await expectAccessible(container)
  })
})
