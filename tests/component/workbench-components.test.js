import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { BUNDLED_RELEASE, bundledNetwork } from '../../server/knowledge/fixture.js'
import { simulate } from '../../server/simulation.js'
import NetworkView from '../../src/components/NetworkView.vue'
import TimeSeriesChart from '../../src/components/TimeSeriesChart.vue'
import { METABOLITE_IDS } from '../../shared/identifiers.js'
import { MODEL } from '../../server/model.js'

const result = simulate({
  releaseId: BUNDLED_RELEASE.id,
  taxonId: 9606,
  preset: 'baseline',
  mthfrActivity: 1,
  durationHours: 4,
  stepHours: 0.05
}, BUNDLED_RELEASE, bundledNetwork(9606))

describe('scientific workbench components', () => {
  it('keeps the network usable when WebGL is unavailable', async () => {
    render(NetworkView, { props: { model: MODEL, network: bundledNetwork(9606), result, selectedId: METABOLITE_IDS.homocysteine } })
    expect(await screen.findByText('3D view unavailable')).toBeTruthy()
    expect(screen.getByText(/semantic network list/)).toBeTruthy()
  })

  it('exposes selected concentration values without relying on graphics', () => {
    render(TimeSeriesChart, { props: { result, selectedId: METABOLITE_IDS.homocysteine } })
    expect(screen.getByText('Homocysteine concentration')).toBeTruthy()
    const charts = screen.getAllByRole('img')
    expect(charts[0].getAttribute('aria-label')).toContain('Final value')
    expect(charts[1].getAttribute('aria-label')).toContain('MTHFR flux over time')
    expect(screen.getByText(/illustrative µM at 4 h/)).toBeTruthy()
  })
})
