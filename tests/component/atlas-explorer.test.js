import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BUNDLED_ATLAS_DETAIL,
  BUNDLED_ATLAS_RELEASE,
  bundledAtlasClaims,
  bundledAtlasCoverage,
  bundledAtlasEntity,
  bundledAtlasNetwork,
  bundledAtlasSubgraph
} from '../../server/knowledge/atlas-fixture.js'

const api = vi.hoisted(() => ({
  loadAtlasWorkspace: vi.fn(),
  loadAtlasEntity: vi.fn(),
  loadAtlasSubgraph: vi.fn()
}))

vi.mock('../../src/api.js', () => api)

import AtlasExplorer from '../../src/components/AtlasExplorer.vue'

function workspace(taxonId) {
  return {
    release: BUNDLED_ATLAS_RELEASE,
    detail: BUNDLED_ATLAS_DETAIL,
    network: bundledAtlasNetwork(taxonId),
    claims: bundledAtlasClaims({ taxonId }),
    coverage: bundledAtlasCoverage({ taxonId })
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.loadAtlasWorkspace.mockImplementation(async (taxonId) => workspace(taxonId))
  api.loadAtlasEntity.mockImplementation(async (_release, entityId, taxonId) => bundledAtlasEntity(entityId, taxonId))
  api.loadAtlasSubgraph.mockImplementation(async (_release, rootId, taxonId, depth, nodes) => bundledAtlasSubgraph(rootId, taxonId, depth, nodes))
})

describe('AtlasExplorer', () => {
  it('renders human typed traversal, identity ambiguity, and explicit unknown coverage', async () => {
    render(AtlasExplorer, { props: { taxonId: 9606 } })

    expect(await screen.findByText('MTHFR evidence atlas')).toBeTruthy()
    expect(await screen.findByText(/typed entities ·/)).toBeTruthy()
    expect(screen.getByText(/Ambiguous candidates: UniProtKB:P42898-1, UniProtKB:P42898-2/)).toBeTruthy()
    expect(screen.getByText(/Unknown \/ measured gap · cell/)).toBeTruthy()
    expect(screen.queryByText('Unknown is not absent')).toBeNull()
  })

  it('labels mouse orthology as transferred and never as direct', async () => {
    render(AtlasExplorer, { props: { taxonId: 10090 } })

    const transferred = await screen.findAllByText('orthology-transferred')
    expect(transferred.length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Mthfr dimer/).length).toBeGreaterThan(0)
    expect(screen.getByText(/not direct mouse complex-formation evidence/)).toBeTruthy()
    expect(screen.getAllByText(/Unknown \/ measured gap/)).toHaveLength(3)
  })

  it('does not substitute an unknown seed and supports form keyboard submission', async () => {
    render(AtlasExplorer, { props: { taxonId: 9606 } })
    const input = await screen.findByLabelText('Seed CURIE or unique label')
    await fireEvent.update(input, 'not-an-entity')
    await fireEvent.submit(input.closest('form'))

    expect(await screen.findByText('Unknown is not absent')).toBeTruthy()
    expect(screen.getByText(/No entity was substituted/)).toBeTruthy()
    await waitFor(() => expect(api.loadAtlasSubgraph).toHaveBeenCalledTimes(1))
  })
})
