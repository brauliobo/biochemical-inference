import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { spatialWorkspace } from '../fixtures/spatial.js'

const api = vi.hoisted(() => ({ loadSpatialWorkspace: vi.fn() }))
vi.mock('../../src/api.js', () => api)

import SpatialTissueWorkbench from '../../src/components/SpatialTissueWorkbench.vue'

const vector = (start) => Array.from({ length: 12 }, (_, index) => start + index / 10)
const snapshot = { timeHours: 1, apap: vector(1), napqi: vector(2), gsh: vector(3), adduct: vector(4), oxygen: vector(5), healthy: vector(0), stressed: vector(0.1), injured: vector(0.2), recovering: vector(0.3) }
let human
let mouse

beforeAll(async () => {
  human = await spatialWorkspace('NCBITaxon:9606')
  mouse = await spatialWorkspace('NCBITaxon:10090')
})

beforeEach(() => {
  vi.clearAllMocks()
  api.loadSpatialWorkspace.mockImplementation((taxonId) => Promise.resolve(taxonId === 'NCBITaxon:9606' ? human : mouse))
})

describe('SpatialTissueWorkbench', () => {
  it('exposes provenance, encoding, selection, time, and values without WebGL', async () => {
    const view = render(SpatialTissueWorkbench, { props: { taxonId: 'NCBITaxon:9606', snapshot, timeIndex: 2, field: 'adduct', selectedBin: 0 } })

    expect(await screen.findByText('Synthetic lobule spatial view')).toBeTruthy()
    expect(screen.getByText('Synthetic geometry · HRA unavailable')).toBeTruthy()
    expect(await screen.findByText(/HRA mapping/)).toBeTruthy()
    expect(await screen.findByText('3D tissue view unavailable')).toBeTruthy()
    expect(screen.getByText(/complete numeric table and controls remain active/i)).toBeTruthy()
    expect(screen.getByText(/Bin 1 · 1 h/)).toBeTruthy()
    expect(screen.getByText(/Color: adduct scaled linearly/)).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: 'Bin 5' }))
    expect(view.emitted().selectBin).toEqual([[4]])
    await view.rerender({ taxonId: 'NCBITaxon:9606', snapshot: { ...snapshot, timeHours: 2 }, timeIndex: 4, field: 'gsh', selectedBin: 4 })
    expect(screen.getByText(/Bin 5 · 2 h/)).toBeTruthy()
    expect(screen.getByText(/Color: gsh scaled linearly/)).toBeTruthy()
  })

  it('cancels stale taxon metadata from the visible workspace', async () => {
    let resolveHuman
    let resolveMouse
    api.loadSpatialWorkspace.mockImplementation((taxonId) => new Promise((resolve) => {
      if (taxonId === 'NCBITaxon:9606') resolveHuman = resolve
      else resolveMouse = resolve
    }))
    const view = render(SpatialTissueWorkbench, { props: { taxonId: 'NCBITaxon:9606', snapshot, timeIndex: 0, field: 'apap', selectedBin: 0 } })
    await view.rerender({ taxonId: 'NCBITaxon:10090', snapshot, timeIndex: 0, field: 'apap', selectedBin: 0 })
    resolveMouse(mouse)
    await screen.findByText(/mouse only/)
    resolveHuman(human)
    await waitFor(() => expect(screen.queryByText(/human only/)).toBeNull())
    expect(screen.getByText(/mouse only/)).toBeTruthy()
  })
})
