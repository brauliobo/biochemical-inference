import { render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import { BUNDLED_RELEASE, bundledNetwork } from '../../server/knowledge/fixture.js'
import { BUNDLED_PROVENANCE } from '../../server/knowledge/fixture.js'
import { simulate } from '../../server/simulation.js'
import NetworkView from '../../src/components/NetworkView.vue'
import TimeSeriesChart from '../../src/components/TimeSeriesChart.vue'
import { METABOLITE_IDS } from '../../shared/identifiers.js'
import { MODEL } from '../../server/model.js'
import BuildProvenance from '../../src/components/BuildProvenance.vue'

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

  it('expands the complete build provenance closure', async () => {
    render(BuildProvenance, { props: { provenance: BUNDLED_PROVENANCE, status: 'available' } })

    await screen.getByText('Build provenance').click()
    expect(screen.getByText('Recipe')).toBeTruthy()
    expect(screen.getByText(BUNDLED_PROVENANCE.recipe.digest)).toBeTruthy()
    expect(screen.getByText('normalized-json 1.0.0')).toBeTruthy()
    expect(screen.getByText('mvp-scientific 1.0.0')).toBeTruthy()
    expect(screen.getByText(/catalysis, compounds, limitations/)).toBeTruthy()
    expect(screen.getByText(/CHEBI.*NCBI_TAXONOMY.*PUBMED.*RHEA.*UNIPROTKB/)).toBeTruthy()
    expect(screen.getByText(/CC-BY-4.0.*MIT.*NLM-TERMS/)).toBeTruthy()
    expect(screen.getByText('demo-compounds')).toBeTruthy()
  })

  it('states that reproducibility is not established when provenance is unavailable', () => {
    render(BuildProvenance, { props: { status: 'unavailable', error: 'upstream provenance failed' } })

    expect(screen.getByText('upstream provenance failed')).toBeTruthy()
    expect(screen.getByText(/Reproducibility is not established/)).toBeTruthy()
  })

  it('has no WCAG 2.2 AA violations for the charts, the network key and the provenance closure', async () => {
    render(TimeSeriesChart, { props: { result, selectedId: METABOLITE_IDS.homocysteine } })
    render(NetworkView, { props: { model: MODEL, network: bundledNetwork(9606), result, selectedId: METABOLITE_IDS.homocysteine } })
    render(BuildProvenance, { props: { provenance: BUNDLED_PROVENANCE, status: 'available' } })
    await screen.findByText('3D view unavailable')
    await expectAccessible()
  })
})
