import { fireEvent, screen, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import Badge from '../../src/ui/Badge.vue'
import Card from '../../src/ui/Card.vue'
import DataTable from '../../src/ui/DataTable.vue'
import Disclosure from '../../src/ui/Disclosure.vue'
import EmptyState from '../../src/ui/EmptyState.vue'
import ErrorNotice from '../../src/ui/ErrorNotice.vue'
import Facts from '../../src/ui/Facts.vue'
import LineChart from '../../src/ui/LineChart.vue'
import LiveMessage from '../../src/ui/LiveMessage.vue'
import Notice from '../../src/ui/Notice.vue'
import Pagination from '../../src/ui/Pagination.vue'
import Panel from '../../src/ui/Panel.vue'
import SyncCard from '../../src/ui/SyncCard.vue'
import { fixed, humanize, list, plural, yesNo } from '../../src/ui/format.js'
import { statusTone } from '../../src/ui/tone.js'
import KitForm from '../fixtures/vapor/KitForm.vue'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const mount = (component, props) => mountVapor(component, { props })

describe('statusTone and format', () => {
  it('maps state words to one tone each', () => {
    expect(['failed', 'incompatible', 'ready', 'syncing', undefined].map(statusTone)).toEqual(['danger', 'warning', 'success', '', ''])
  })

  it('formats numbers, counts, lists and flags', () => {
    expect(fixed(1.23456, 2)).toBe('1.23')
    expect(fixed(null, 2)).toBe('n/a')
    expect(fixed(undefined, 2, 'not evaluable')).toBe('not evaluable')
    expect([plural(1, 'record'), plural(2, 'record'), plural(2, 'index', 'indices')]).toEqual(['1 record', '2 records', '2 indices'])
    expect(humanize('is_upregulated_by')).toBe('is upregulated by')
    expect([list(['a', 'b']), list([]), list(undefined, 'none declared'), list(['a', 'b'], '', ' ')]).toEqual(['a, b', 'none', 'none declared', 'a b'])
    expect([yesNo(true), yesNo(0)]).toEqual(['yes', 'no'])
  })
})

describe('Badge', () => {
  it('prints a status word with its tone, or a label with an explicit tone', () => {
    mount(Badge, { status: 'failed' })
    mount(Badge, { label: 'Supports', tone: 'success' })
    mount(Badge, { label: 'Plain', tone: 'muted' })

    expect(screen.getByText('failed').className).toBe('badge badge--danger')
    expect(screen.getByText('Supports').className).toBe('badge badge--success')
    expect(screen.getByText('Plain').className).toBe('badge')
  })
})

describe('Notice, ErrorNotice and LiveMessage', () => {
  it('shows a titled notice and an error with a retry that emits', async () => {
    let retried = 0
    mount(Notice, { tone: 'warning', title: 'Careful' })
    mountVapor(ErrorNotice, { props: { title: 'Broken', message: 'It failed.', retryLabel: 'Try again', onRetry: () => () => { retried += 1 } } })

    expect(screen.getByText('Careful').closest('.notice').className).toContain('notice--warning')
    const alert = screen.getByRole('alert')
    expect(within(alert).getByText('Broken')).toBeTruthy()
    expect(within(alert).getByText('It failed.')).toBeTruthy()
    await fireEvent.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(retried).toBe(1)
  })

  it('keeps an empty live region in the DOM and shows text as a notice only when visible', () => {
    mount(LiveMessage, { text: 'Saved.' })
    mount(LiveMessage, { visible: true, text: '' })
    mount(LiveMessage, { visible: true, text: 'Loading…' })

    const regions = screen.getAllByRole('status')
    expect(regions).toHaveLength(3)
    expect(regions[0].className).toBe('visually-hidden')
    expect(regions[1].textContent).toBe('')
    expect(within(regions[2]).getByText('Loading…').className).toBe('notice')
  })
})

describe('Facts', () => {
  it('renders items as a definition list with digests, code lines, notes and rows', async () => {
    const { container } = mount(Facts, {
      rows: true,
      items: [
        { label: 'Release', value: 'r1', code: 'abc123' },
        { label: 'Digest', value: 'sha256:aa', mono: true },
        { label: 'Count', value: 3, note: 'of 4', large: true }
      ]
    })

    const list = container.querySelector('dl.facts.facts--rows')
    expect([...list.children].map((group) => [...group.children].map((child) => child.tagName))).toEqual([['DT', 'DD'], ['DT', 'DD'], ['DT', 'DD', 'DD']])
    expect(within(list).getByText('abc123').tagName).toBe('CODE')
    expect(within(list).getByText('sha256:aa').className).toContain('digest')
    expect(within(list).getByText('3').className).toContain('fact__value')
    await expectAccessible(container)
  })
})

describe('Panel', () => {
  it('is a named region with a heading at its level, a status badge and a generated id', () => {
    mount(Panel, { title: 'Results', eyebrow: 'Step 2', level: 3, status: 'failed' })

    const region = screen.getByRole('region', { name: 'Results' })
    expect(within(region).getByRole('heading', { level: 3, name: 'Results' }).id).toMatch(/^panel-\d+$/)
    expect(within(region).getByText('failed').className).toContain('badge--danger')
    expect(within(region).getByText('Step 2')).toBeTruthy()
  })
})

describe('Card, Disclosure and EmptyState', () => {
  it('renders a flat card, a tone card as a notice, a disclosure and both empty states', () => {
    const { container } = mountVapor(Card, { props: { flat: true } })
    mount(Card, { tone: 'warning' })
    mount(Disclosure, { summary: 'More', open: true, card: true })
    mount(EmptyState, { title: 'Nothing yet' })

    expect(container.querySelector('article.card.card--flat')).toBeTruthy()
    expect(document.querySelector('article.notice.notice--warning')).toBeTruthy()
    expect(document.querySelector('details[open].card > summary').textContent).toBe('More')
    expect(document.querySelector('.empty-state strong').textContent).toBe('Nothing yet')
  })
})

describe('form fields', () => {
  it('bind v-model with number parsing, errors, hints, checkboxes and forwarded listeners', async () => {
    const { container } = mountVapor(KitForm)
    const state = () => container.querySelector('.state').textContent

    const seed = screen.getByLabelText('Seed')
    expect(seed.getAttribute('min')).toBe('0')
    expect(seed.getAttribute('aria-describedby')).toBe('seed-hint')
    await fireEvent.update(seed, '12')
    expect(state()).toBe('number:12|a|false|2')

    const name = screen.getByLabelText('Name')
    expect(name.getAttribute('aria-invalid')).toBe('true')
    expect(name.getAttribute('aria-describedby')).toBe('name-error')
    expect(screen.getByRole('alert').textContent).toBe('Required')
    await fireEvent.update(name, 'zed')
    expect(state()).toBe('number:12|zed|false|2')

    await fireEvent.click(screen.getByLabelText('Enabled'))
    expect(state().endsWith('|true|2')).toBe(true)

    await fireEvent.update(screen.getByLabelText('Listener'), 'typed')
    expect(container.querySelector('.seen').textContent).toBe('typed')
  })

  it('selects typed option values and runs the change listener after v-model', async () => {
    const { container } = mountVapor(KitForm)
    const level = screen.getByLabelText('Level')

    expect([...level.options].map((option) => option.textContent)).toEqual(['One', 'Two', 'plain'])
    await fireEvent.update(level, '1')

    expect(container.querySelector('.state').textContent).toContain('|1')
    expect(container.querySelector('.seen').textContent).toBe('1')
  })
})

describe('Pagination and SyncCard', () => {
  it('emits previous and next and disables what cannot move', async () => {
    const moves = []
    mountVapor(Pagination, { props: { label: 'Pages', summary: 'Page 2', canPrevious: true, canNext: false, onPrevious: () => () => moves.push('previous'), onNext: () => () => moves.push('next') } })

    const nav = screen.getByRole('navigation', { name: 'Pages' })
    await fireEvent.click(within(nav).getByRole('button', { name: 'Previous' }))
    expect(within(nav).getByRole('button', { name: 'Next' }).disabled).toBe(true)
    expect(within(nav).getByText('Page 2')).toBeTruthy()
    expect(moves).toEqual(['previous'])
  })

  it('offers synchronization when the mirror is empty and a reload when its status failed', async () => {
    const base = { readyTitle: 'Ready', unavailableTitle: 'Unavailable', syncLabel: 'Sync', syncingLabel: 'Syncing…', syncTestid: 'sync' }
    let synced = 0
    mountVapor(SyncCard, { props: { ...base, status: { state: 'empty' }, onSync: () => () => { synced += 1 } } })
    await fireEvent.click(screen.getByTestId('sync'))
    expect(screen.getByText('Explicit synchronization required')).toBeTruthy()
    expect(synced).toBe(1)

    mount(SyncCard, { ...base, status: { state: 'failed' } })
    expect(screen.getByRole('button', { name: 'Reload failed status' })).toBeTruthy()
    mount(SyncCard, { ...base, status: { state: 'ready' }, ready: true })
    expect(screen.getByText('Ready')).toBeTruthy()
  })
})

describe('DataTable and LineChart', () => {
  it('names a focusable scroll region and explains an empty table', () => {
    const { container } = mount(DataTable, { caption: 'Attempts', columns: ['Name', 'State'], count: 0, emptyText: 'No attempts.' })

    const region = within(container).getByRole('region', { name: 'Attempts' })
    expect(region.getAttribute('tabindex')).toBe('0')
    expect(within(region).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(['Name', 'State'])
    expect(within(region).getByText('No attempts.').getAttribute('colspan')).toBe('2')
  })

  it('draws one polyline per line, the comparison first, on a zero baseline', () => {
    const { container } = mount(LineChart, {
      times: [0, 1, 2],
      lines: [{ values: [0, 5, 10] }, { values: [0, 1, 2], compare: true }],
      max: 10,
      label: 'Series over time',
      topLabel: '10.0',
      startLabel: '0 h',
      endLabel: '2 h',
      unit: 'mM'
    })

    const lines = [...container.querySelectorAll('polyline')]
    expect(lines.map((line) => line.getAttribute('class'))).toEqual(['chart__line chart__line--compare', 'chart__line'])
    expect(lines[1].getAttribute('points')).toBe('56.0,238.0 399.0,128.0 742.0,18.0')
    expect(screen.getByRole('img', { name: 'Series over time' })).toBeTruthy()
    expect(container.textContent).toContain('2 h')
  })
})
