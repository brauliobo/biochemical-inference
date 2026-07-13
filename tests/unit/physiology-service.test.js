import { rm } from 'node:fs/promises'
import { afterEach, describe, expect, it } from 'vitest'
import { createPhysiologyClient } from '../../server/physiology/client.js'
import { REFERENCE_KEY_ID } from '../../server/physiology/reference.js'
import { createPhysiologyService } from '../../server/physiology/service.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const roots = []
const services = []
afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((service) => service.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function service(root) {
  const value = await createPhysiologyService({ root, env: { NODE_ENV: 'test' }, evidenceClient: createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }) })
  services.push(value)
  return value
}

function request(packages, overrides = {}) {
  return { packageDigests: packages.map((item) => item.packageDigest), taxonId: 'NCBITaxon:9606', durationMinutes: 4, couplingCadenceMinutes: 1, interpolation: 'zero-order-hold', refinementFactors: [1, 2, 4], convergenceToleranceMg: 1e-9, ...overrides }
}

describe('persistent deterministic physiology service', () => {
  it('uses exact multirate schedules, integrated amounts, conservation, and timestep convergence', async () => {
    const root = await isolatedTestRoot('physiology-service')
    roots.push(root)
    const physiology = await service(root)
    const coupling = physiology.createCoupling(request(physiology.listPackages()))
    const run = await physiology.run({ couplingDigest: coupling.couplingDigest })
    const repeated = await physiology.run({ couplingDigest: coupling.couplingDigest })

    expect(coupling.exchanges).toHaveLength(4)
    expect(coupling.applicabilityIntersection.taxonIds).toEqual(['NCBITaxon:9606'])
    expect(run.runDigest).toBe(repeated.runDigest)
    expect(run.states.map((state) => [state.timeMinutes, state.massesMg['PLUGIN:CIRCULATION-REFERENCE'], state.massesMg['PLUGIN:LIVER-REFERENCE'], state.massesMg['PLUGIN:KIDNEY-REFERENCE']])).toEqual([[0, 80, 10, 10], [1, 70, 18, 12], [2, 60, 25, 15], [3, 55, 27.5, 17.5], [4, 50, 30, 20]])
    expect(run.exchanges.every((item) => item.integratedAmountMg === item.rateMgPerMinute * (item.intervalEndMinutes - item.intervalStartMinutes))).toBe(true)
    expect(run.diagnostics).toMatchObject({ maximumAbsoluteResidualMg: 0, massConserved: true, convergenceMaximumDifferenceMg: 0, converged: true })
    expect(run.schedule.find((item) => item.timeMinutes === 1).duePluginIds).toEqual(['PLUGIN:CIRCULATION-REFERENCE'])
    expect(run.protocolEvents.slice(0, 3).map((item) => item.event)).toEqual(['initialize', 'initialize', 'initialize'])
    expect(run.scientificValidation).toBe('unsupported')
  })

  it('blocks unit/taxon/applicability extrapolation and dynamically applies trust revocation', async () => {
    const root = await isolatedTestRoot('physiology-trust')
    roots.push(root)
    const physiology = await service(root)
    const packages = physiology.listPackages()

    expect(() => physiology.createCoupling(request(packages, { taxonId: 'NCBITaxon:10090' }))).toThrow(/mouse extrapolation is blocked/i)
    const coupling = physiology.createCoupling(request(packages))
    physiology.revokeTrustKey(REFERENCE_KEY_ID)
    expect(physiology.listPackages().every((item) => item.trust.status === 'revoked' && item.certification.status === 'not-certified')).toBe(true)
    await expect(physiology.run({ couplingDigest: coupling.couplingDigest })).rejects.toThrow(/publisher key is revoked/i)
  })

  it('persists immutable package bytes, coupling metadata, runs, and revocation across restarts', async () => {
    const root = await isolatedTestRoot('physiology-persistence')
    roots.push(root)
    let physiology = await service(root)
    const packages = physiology.listPackages()
    const coupling = physiology.createCoupling(request(packages))
    const run = await physiology.run({ couplingDigest: coupling.couplingDigest })
    const bytes = await physiology.packageBytes(packages[0].packageDigest)
    await physiology.close()
    services.splice(services.indexOf(physiology), 1)

    physiology = await service(root)
    expect(physiology.listPackages().map((item) => item.packageDigest)).toEqual(packages.map((item) => item.packageDigest))
    expect(await physiology.packageBytes(packages[0].packageDigest)).toEqual(bytes)
    expect(physiology.getCoupling(coupling.couplingDigest)).toEqual(coupling)
    expect(physiology.getRun(run.runDigest)).toEqual(run)
  })
})
