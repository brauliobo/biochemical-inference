import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { rm } from 'node:fs/promises'
import { createPhysiologyClient } from '../../server/physiology/client.js'
import { createPhysiologyService } from '../../server/physiology/service.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const api = vi.hoisted(() => ({
  loadPhysiologyWorkbench: vi.fn(),
  createPhysiologyCoupling: vi.fn(),
  runPhysiologyCoupling: vi.fn(),
  runPhysiologyConformance: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import PhysiologyPluginWorkbench from '../../src/components/PhysiologyPluginWorkbench.vue'

let root
let service
let workspace
let coupling
let run

beforeAll(async () => {
  root = await isolatedTestRoot('physiology-component')
  const client = createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })
  service = await createPhysiologyService({ root, env: { NODE_ENV: 'test' }, evidenceClient: client })
  const evidence = service.evidence()
  const packages = service.listPackages()
  workspace = {
    discovery: { contractVersion: '1.0.0', releaseId: evidence.release.id, releaseDigest: evidence.release.digest, packageProfile: 'biochemical-physiology-package-v1', processPlugins: 'disabled', scientificValidation: 'unsupported', warning: evidence.warning, routes: { evidence: '', validatePackage: '', installPackage: '', catalog: '', couplings: '', runs: '', coverage: '', trust: '' } },
    evidence,
    packages,
    trust: service.listTrust(),
    coverage: service.coverage(),
    couplings: [],
    runs: []
  }
  coupling = service.createCoupling({ packageDigests: packages.map((item) => item.packageDigest), taxonId: 'NCBITaxon:9606', durationMinutes: 4, couplingCadenceMinutes: 1, interpolation: 'zero-order-hold', refinementFactors: [1, 2, 4], convergenceToleranceMg: 1e-9 })
  run = await service.run({ couplingDigest: coupling.couplingDigest })
})

afterAll(async () => {
  await service.close()
  await rm(root, { recursive: true, force: true })
})

beforeEach(() => {
  vi.clearAllMocks()
  api.loadPhysiologyWorkbench.mockResolvedValue(workspace)
  api.createPhysiologyCoupling.mockResolvedValue(coupling)
  api.runPhysiologyCoupling.mockResolvedValue(run)
  api.runPhysiologyConformance.mockResolvedValue(service.conformance(workspace.packages[0].packageDigest))
})

describe('PhysiologyPluginWorkbench', () => {
  it('shows persistent warning, trust/signatures, ports, certification distinction, coverage, and diagnostics', async () => {
    render(PhysiologyPluginWorkbench)

    expect(await screen.findByRole('heading', { name: 'Physiology plugin workbench' })).toBeTruthy()
    expect(screen.getByText('Synthetic / non-clinical')).toBeTruthy()
    expect(await screen.findByText('Certification is not scientific validation')).toBeTruthy()
    expect(screen.getByText('8f7a14db2cebe4603772146b3d1f9f2a8ccafbf2452ef5c9ff856326584fadb8')).toBeTruthy()
    expect(screen.getAllByText('not-certified')).toHaveLength(3)
    expect(screen.getByText(/PORT:CIRCULATION-LIVER-OUT/)).toBeTruthy()
    expect(screen.getAllByText(/signed package installed/)).toHaveLength(3)

    await fireEvent.click(screen.getAllByRole('button', { name: 'Run and persist conformance' })[0])
    expect(await screen.findByText('certified-conformant')).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: 'Create exact coupling' }))
    expect(await screen.findByText(coupling.couplingDigest)).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: 'Run coupled fixture' }))
    expect(await screen.findByText(run.runDigest)).toBeTruthy()
    expect(screen.getByText('100 → 100 mg')).toBeTruthy()
    expect(screen.getAllByText('0 mg').length).toBeGreaterThan(2)
    expect(screen.getByText('passed')).toBeTruthy()
  })

  it('surfaces unsupported-extrapolation refusal without hiding the verified catalog', async () => {
    api.createPhysiologyCoupling.mockRejectedValue(new Error('The pinned reference packages are human-only; mouse extrapolation is blocked.'))
    render(PhysiologyPluginWorkbench)
    await fireEvent.update(await screen.findByLabelText('Applicability taxon'), 'NCBITaxon:10090')
    await fireEvent.click(screen.getByRole('button', { name: 'Create exact coupling' }))

    expect(await screen.findByText(/mouse extrapolation is blocked/i)).toBeTruthy()
    await waitFor(() => expect(screen.getByText('PLUGIN:CIRCULATION-REFERENCE')).toBeTruthy())
  })
})
