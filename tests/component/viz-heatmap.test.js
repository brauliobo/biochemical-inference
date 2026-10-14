import { fireEvent, within } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import Heatmap from '../../src/viz/Heatmap.vue'
import Matrix from '../../src/viz/Matrix.vue'
import { changeHeatSample, gradeHeatSample, matrixSample } from '../../src/viz/samples/charts.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const grades = gradeHeatSample()
const cells = (container) => [...container.querySelectorAll('[role="gridcell"][data-r]')]
const cell = (container, r, c) => container.querySelector(`[data-r="${r}"][data-c="${c}"]`)

describe('Heatmap', () => {
  const props = { id: 'heat-test', title: 'Entries by kind and grade', rows: grades.rows, cols: grades.cols, values: grades.values, totals: true, rowTitle: 'Kind', colTitle: 'Grade', unit: 'entries' }

  it('is a labelled grid with the value printed in every cell and a colour key', async () => {
    const { container } = mountVapor(Heatmap, { props })
    expect(container.querySelector('table[role="grid"]')).toBeTruthy()
    expect(cells(container)).toHaveLength(grades.rows.length * grades.cols.length)
    expect(cell(container, 0, 0).textContent).toBe(String(grades.values[0][0]))
    expect(cell(container, 0, 0).getAttribute('aria-label')).toBe(`Compound, Established: ${grades.values[0][0]} entries`)
    expect(container.querySelectorAll('.viz-key')).toHaveLength(6)
    expect(cell(container, 0, 0).className).toMatch(/viz-bin-s\d/)
    await expectAccessible(container)
  })

  it('adds row and column totals', () => {
    const { container } = mountVapor(Heatmap, { props })
    const rowTotal = grades.values[0].reduce((a, b) => a + b, 0)
    expect(container.querySelector('tbody tr:first-child .viz-heat__total').textContent).toBe(String(rowTotal))
    expect(container.querySelectorAll('tfoot td')).toHaveLength(grades.cols.length + 1)
    const grand = grades.values.flat().reduce((a, b) => a + b, 0)
    expect(container.querySelector('tfoot td:last-child').textContent).toBe(String(grand))
  })

  it('has exactly one tab stop and moves with the arrow keys, Home, End and Ctrl+Home/End', async () => {
    const { container } = mountVapor(Heatmap, { props })
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    const start = cell(container, 0, 0)
    start.focus()
    await fireEvent.keyDown(start, { key: 'ArrowRight' })
    expect(document.activeElement).toBe(cell(container, 0, 1))
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(cell(container, 1, 1))
    await fireEvent.keyDown(document.activeElement, { key: 'End' })
    expect(document.activeElement).toBe(cell(container, 1, grades.cols.length - 1))
    await fireEvent.keyDown(document.activeElement, { key: 'End', ctrlKey: true })
    expect(document.activeElement).toBe(cell(container, grades.rows.length - 1, grades.cols.length - 1))
    await fireEvent.keyDown(document.activeElement, { key: 'Home', ctrlKey: true })
    expect(document.activeElement).toBe(cell(container, 0, 0))
    await fireEvent.keyDown(document.activeElement, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(cell(container, 0, 0))
    expect(container.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    expect(cell(container, 0, 0).getAttribute('tabindex')).toBe('0')
  })

  it('reports a cell chosen with Enter, Space or a click', async () => {
    const picked = []
    const { container } = mountVapor(Heatmap, { props: { ...props, onSelect: () => (cellInfo) => picked.push(cellInfo) } })
    await fireEvent.keyDown(cell(container, 1, 2), { key: 'Enter' })
    await fireEvent.keyDown(cell(container, 1, 2), { key: ' ' })
    await fireEvent.click(cell(container, 2, 0))
    expect(picked).toEqual([
      { row: 'enzyme', col: 'speculative', value: grades.values[1][2] },
      { row: 'enzyme', col: 'speculative', value: grades.values[1][2] },
      { row: 'reaction', col: 'established', value: grades.values[2][0] }
    ])
  })

  it('repeats the grid as a plain data table with a text summary', () => {
    const { container } = mountVapor(Heatmap, { props })
    const table = container.querySelector('details table')
    expect(table.querySelectorAll('tbody tr')).toHaveLength(grades.rows.length)
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toContain('Conversation only')
    expect(container.querySelector('figure > p').textContent).toContain('Highest:')
  })

  it('uses the diverging scale around zero', async () => {
    const change = changeHeatSample()
    const { container } = mountVapor(Heatmap, { props: { title: 'Change', rows: change.rows, cols: change.cols, values: change.values, mode: 'diverging', unit: '%' } })
    const classes = cells(container).map((node) => node.className)
    expect(classes.some((name) => name.includes('viz-bin-n'))).toBe(true)
    expect(classes.some((name) => name.includes('viz-bin-p'))).toBe(true)
    expect(container.querySelectorAll('.viz-key')).toHaveLength(7)
    await expectAccessible(container)
  })

  it('shows a dash for missing data and says so', () => {
    const { container } = mountVapor(Heatmap, { props: { title: 'Gaps', rows: [{ id: 'a', label: 'A' }], cols: [{ id: 'x', label: 'X' }, { id: 'y', label: 'Y' }], values: [[1, null]] } })
    expect(cell(container, 0, 1).textContent).toBe('–')
    expect(cell(container, 0, 1).getAttribute('aria-label')).toBe('A, Y: no data')
  })
})

describe('Matrix', () => {
  const sample = matrixSample()

  it('shows relation counts between kinds, zeros as a dot, and outlines the diagonal', async () => {
    const { container } = mountVapor(Matrix, { props: { id: 'matrix-test', title: 'Relations between kinds', types: sample.types, counts: sample.counts } })
    expect(cells(container)).toHaveLength(sample.types.length ** 2)
    expect(container.querySelectorAll('.viz-heat__cell--diagonal')).toHaveLength(sample.types.length)
    expect(cells(container).some((node) => node.textContent === '·')).toBe(true)
    const compoundToEnzyme = sample.counts.compound.enzyme
    expect(cell(container, 0, 1).textContent).toBe(String(compoundToEnzyme))
    expect(cell(container, 0, 1).getAttribute('aria-label')).toBe(`Compound, Enzyme: ${compoundToEnzyme} relations`)
    expect(container.querySelector('thead').textContent).toContain('From / To')
    await expectAccessible(container)
  })

  it('calls back with from, to and count so a view can open the list behind a cell', async () => {
    const picked = []
    const { container } = mountVapor(Matrix, { props: { title: 'Relations', types: sample.types, counts: sample.counts, onSelect: () => (value) => picked.push(value) } })
    await fireEvent.click(cell(container, 0, 1))
    await fireEvent.keyDown(cell(container, 1, 0), { key: 'Enter' })
    expect(picked[0]).toEqual({ from: 'compound', to: 'enzyme', count: sample.counts.compound.enzyme })
    expect(picked[1]).toMatchObject({ from: 'enzyme', to: 'compound' })
  })

  it('accepts counts as a list of pairs', () => {
    const { container } = mountVapor(Matrix, { props: { title: 'Pairs', types: sample.types.slice(0, 2), counts: [{ from: 'compound', to: 'enzyme', count: 3 }, { from: 'compound', to: 'enzyme', count: 4 }] } })
    expect(cell(container, 0, 1).textContent).toBe('7')
  })
})
