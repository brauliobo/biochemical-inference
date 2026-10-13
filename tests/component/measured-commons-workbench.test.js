import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import { pressWhenEnabled } from '../helpers/interactions.js'

const api = vi.hoisted(() => ({
  discloseMeasuredEvaluation: vi.fn(),
  freezeMeasuredCommitment: vi.fn(),
  loadMeasuredDiscovery: vi.fn(),
  loadMeasuredLineage: vi.fn(),
  loadMeasuredPage: vi.fn(),
  loadMeasuredStatus: vi.fn(),
  runMeasuredCalibration: vi.fn(),
  syncMeasured: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import MeasuredCommonsWorkbench from '../../src/components/MeasuredCommonsWorkbench.vue'

const digest = (letter) => letter.repeat(64)
const ready = { state: 'ready', integrity: 'valid', release: { id: 'measured-release-1' } }
const empty = { state: 'empty', integrity: 'unverified', release: null }
const measurement = (id) => ({ id, reported_value: '41', reported_unit: 'U/L', normalized: { value: '0.68', unit: 'µkat/L' }, locator: { table: 'Table 2', source_native_cell: 'B4' } })
const pages = {
  families: { items: [
    { id: 'family:dev', role: 'development', title: 'Development family' },
    { id: 'family:cal', role: 'calibration', title: 'Calibration family' },
    { id: 'family:held', role: 'external-held-out', title: 'Held-out family' }
  ] },
  partitions: { items: [{ id: 'partition:held', role: 'external-held-out' }] },
  sources: { items: [] },
  applicability: { items: [] },
  measurements: { items: [measurement('measurement:a'), measurement('measurement:b')], nextCursor: null },
  missingness: { items: [{ id: 'missing:1' }] }
}
const lineage = {
  lineageDigest: digest('l'),
  lineage: {
    measurement: { id: 'measurement:a', scientific_origin: 'measured', validation_state: 'source-verified', locator: { source_native_cell: 'B4', table: 'Table 2' } },
    uncertainty: { kind: 'not-reported' },
    context: { qualifiers: [{ status: 'blank', raw_value: 'QNS' }] },
    normalized_transformation: { expression: 'value * 0.0167' },
    source: { accession: 'CEBS:0004' },
    license: { rights_basis: 'public-domain-default' }
  }
}
const calibration = {
  status: 'not-evaluable',
  artifactDigest: digest('c'),
  measurements: [1, 2],
  missingness: [],
  reasons: ['Scientific context differs between groups.'],
  accessProof: { developmentMeasurementsRead: 0, validationMeasurementsRead: 0, externalHeldoutMeasurementsRead: 0, evaluationClientAvailable: false }
}
const commitment = {
  receipt: { commitment_digest: digest('r') },
  frozenRequest: { nonce: 'abc' },
  artifacts: Object.fromEntries(['model', 'parameterPolicy', 'endpointMapping', 'metricThresholdPolicy', 'prediction'].map((key, index) => [key, { digest: digest(String(index)) }]))
}
const disclosure = {
  disclosed_at: '2026-01-01T00:00:00Z',
  items: [{ measurement_id: 'm1', group_id: 'group:d250', reported_value: '2.700', reported_unit: 'mmol/g', uncertainty: { value: '0.1', n: 4 } }]
}

beforeEach(() => {
  vi.clearAllMocks()
  api.loadMeasuredDiscovery.mockResolvedValue({ pins: { releaseDigest: digest('a'), catalogDigest: digest('b'), signerKeyId: 'key-1' } })
  api.loadMeasuredStatus.mockResolvedValue(ready)
  api.loadMeasuredPage.mockImplementation(async (collection) => pages[collection])
  api.loadMeasuredLineage.mockResolvedValue(lineage)
  api.runMeasuredCalibration.mockResolvedValue(calibration)
  api.freezeMeasuredCommitment.mockResolvedValue({ value: commitment, cacheControl: 'private, no-store' })
  api.discloseMeasuredEvaluation.mockResolvedValue({ value: disclosure, cacheControl: 'private, no-store' })
})

describe('MeasuredCommonsWorkbench', () => {
  it('asks for explicit synchronization before any measured record is shown', async () => {
    api.loadMeasuredStatus.mockResolvedValue(empty)
    api.syncMeasured.mockResolvedValue(ready)
    render(MeasuredCommonsWorkbench)

    expect(await screen.findByText('Explicit synchronization required')).toBeTruthy()
    expect(screen.queryByTestId('measured-table')).toBeNull()
    await fireEvent.click(screen.getByTestId('measured-sync'))
    expect(await screen.findByText('Verified local mirror ready')).toBeTruthy()
    expect(await screen.findByTestId('measured-table')).toBeTruthy()
    expect(api.syncMeasured).toHaveBeenCalledOnce()
  })

  it('labels measured and derived values, then isolates calibration, freeze and explicit disclosure', async () => {
    render(MeasuredCommonsWorkbench)

    const families = await screen.findByTestId('measured-families')
    expect(await within(families).findByText('Metadata visible; outcomes, uncertainties, summaries, defaults, and previews absent.')).toBeTruthy()
    expect(within(families).getAllByRole('heading', { level: 3 })).toHaveLength(3)
    expect(within(screen.getByTestId('measured-table')).getAllByRole('row')).toHaveLength(3)
    expect(screen.getByRole('button', { name: 'Next verified page' }).disabled).toBe(true)

    await fireEvent.click(screen.getByTestId('inspect-lineage'))
    expect(within(await screen.findByTestId('measured-lineage')).getByText('not-reported')).toBeTruthy()

    expect(screen.getByTestId('freeze-measured').disabled).toBe(true)
    await fireEvent.click(screen.getByTestId('run-measured-calibration'))
    const artifact = await screen.findByTestId('calibration-artifact')
    expect(artifact.textContent).toContain('development 0, validation 0, external-heldout 0')

    await fireEvent.click(screen.getByTestId('freeze-measured'))
    const receipt = await screen.findByTestId('commitment-receipt')
    expect(receipt.querySelectorAll('code')).toHaveLength(1)
    expect(receipt.textContent).toContain('private, no-store')
    expect(within(screen.getByTestId('frozen-artifact-digests')).queryAllByRole('textbox')).toHaveLength(0)

    expect(screen.queryByTestId('disclosure-values')).toBeNull()
    await fireEvent.click(screen.getByTestId('disclose-measured'))
    const values = await screen.findByTestId('disclosure-values')
    expect(within(values).getAllByRole('listitem')).toHaveLength(1)
    expect(values.textContent).toContain('2.700 mmol/g')
    expect(values.textContent).toContain('Labels remain external-held-out')
    await waitFor(() => expect(api.discloseMeasuredEvaluation).toHaveBeenCalledWith({ commitmentDigest: digest('r') }, expect.any(AbortSignal)))
  })

  it('reports a failed workflow in an alert without hiding the sync control', async () => {
    api.loadMeasuredDiscovery.mockRejectedValue(new Error('mirror unreadable'))
    render(MeasuredCommonsWorkbench)

    expect(await screen.findByRole('alert')).toBeTruthy()
    expect(screen.getByText('mirror unreadable')).toBeTruthy()
    expect(screen.getByTestId('measured-sync')).toBeTruthy()
  })

  it('has no WCAG 2.2 AA violations through lineage, calibration, commitment and disclosure', async () => {
    render(MeasuredCommonsWorkbench)
    await screen.findByTestId('measured-table')
    await pressWhenEnabled('inspect-lineage')
    await screen.findByTestId('measured-lineage')
    await pressWhenEnabled('run-measured-calibration')
    await screen.findByTestId('calibration-artifact')
    await pressWhenEnabled('freeze-measured')
    await screen.findByTestId('commitment-receipt')
    await pressWhenEnabled('disclose-measured')
    await screen.findByTestId('disclosure-values')
    await expectAccessible()
  })
})
