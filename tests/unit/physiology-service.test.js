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

async function service(root, options = {}) {
  const value = await createPhysiologyService({ root, env: { NODE_ENV: 'test' }, evidenceClient: createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }), ...options })
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
    expect(run.diagnostics.refinement.map((item) => item.finalMassesMg)).toEqual([run.states.at(-1).massesMg, run.states.at(-1).massesMg, run.states.at(-1).massesMg])
    expect(run.schedule.find((item) => item.timeMinutes === 1).duePluginIds).toEqual(['PLUGIN:CIRCULATION-REFERENCE'])
    expect(run.schedule.at(-1)).toEqual({ timeMinutes: 4, duePluginIds: [] })
    expect(run.protocolEvents.slice(0, 3).map((item) => item.event)).toEqual(['initialize', 'initialize', 'initialize'])
    expect(run.protocolEvents.every((item) => item.cadenceDue)).toBe(true)
    expect(run.scientificValidation).toBe('unsupported')
  })

  it('publishes two-minute outputs only when due and holds them across every refinement grid', async () => {
    const root = await isolatedTestRoot('physiology-multirate')
    roots.push(root)
    const calls = { 1: [], 2: [], 4: [] }
    const physiology = await service(root, {
      outputPublisher(plugin, event) {
        const pluginId = plugin.record.manifest.pluginId
        calls[event.refinementFactor].push([pluginId, event.timeMinutes])
        return new Map(plugin.coupling.ports.filter((port) => port.direction === 'output').map((port) => {
          if (pluginId === 'PLUGIN:LIVER-REFERENCE') return [port.id, event.timeMinutes + 1]
          const schedule = plugin.model.outputSchedules.find((item) => item.portId === port.id)
          const interval = schedule?.intervals.find((item) => event.timeMinutes >= item.startMinute && event.timeMinutes < item.endMinute)
          return [port.id, interval?.value ?? 0]
        }))
      }
    })
    const coupling = physiology.createCoupling(request(physiology.listPackages()))
    const run = await physiology.run({ couplingDigest: coupling.couplingDigest })
    const repeated = await physiology.run({ couplingDigest: coupling.couplingDigest })
    const liverRates = run.exchanges.filter((item) => item.quantityId === 'QUANTITY:LIVER-TO-CIRCULATION-DRUG-MASS-FLOW').map((item) => item.rateMgPerMinute)

    for (const factor of [1, 2, 4]) {
      expect(calls[factor].filter(([pluginId]) => pluginId === 'PLUGIN:LIVER-REFERENCE')).toEqual([['PLUGIN:LIVER-REFERENCE', 0], ['PLUGIN:LIVER-REFERENCE', 2]])
      expect(calls[factor].filter(([pluginId]) => pluginId === 'PLUGIN:CIRCULATION-REFERENCE')).toHaveLength(4)
    }
    expect(liverRates).toEqual([1, 1, 3, 3])
    expect(run.states.at(-1).massesMg).toEqual({ 'PLUGIN:CIRCULATION-REFERENCE': 58, 'PLUGIN:KIDNEY-REFERENCE': 20, 'PLUGIN:LIVER-REFERENCE': 22 })
    expect(run.protocolEvents.filter((item) => item.pluginId === 'PLUGIN:LIVER-REFERENCE' && item.event === 'publish-outputs').map((item) => item.timeMinutes)).toEqual([0, 2])
    expect(run.schedule.map((item) => [item.timeMinutes, item.duePluginIds])).toEqual([
      [0, ['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE', 'PLUGIN:LIVER-REFERENCE']],
      [1, ['PLUGIN:CIRCULATION-REFERENCE']],
      [2, ['PLUGIN:CIRCULATION-REFERENCE', 'PLUGIN:KIDNEY-REFERENCE', 'PLUGIN:LIVER-REFERENCE']],
      [3, ['PLUGIN:CIRCULATION-REFERENCE']],
      [4, []]
    ])
    expect(run.diagnostics).toMatchObject({ massConserved: true, deterministic: true, convergenceMaximumDifferenceMg: 0, converged: true })
    expect(repeated).toEqual(run)
  })

  it('checks aggregate source availability before applying simultaneous exchange deltas', async () => {
    const root = await isolatedTestRoot('physiology-aggregate')
    roots.push(root)
    const physiology = await service(root, {
      outputPublisher(plugin) {
        const highRate = plugin.record.manifest.pluginId === 'PLUGIN:CIRCULATION-REFERENCE' ? 50 : 0
        return new Map(plugin.coupling.ports.filter((port) => port.direction === 'output').map((port) => [port.id, highRate]))
      }
    })
    const coupling = physiology.createCoupling(request(physiology.listPackages()))

    await expect(physiology.run({ couplingDigest: coupling.couplingDigest })).rejects.toThrow(/aggregate 100 mg/i)
  })

  it('starts uncertified and derives catalog certification only from persisted conformance', async () => {
    const root = await isolatedTestRoot('physiology-certification')
    roots.push(root)
    let physiology = await service(root)
    const packages = physiology.listPackages()
    const selected = packages[0]
    const bytes = await physiology.packageBytes(selected.packageDigest)

    expect(packages.every((item) => item.certification.status === 'not-certified' && item.certification.checks.conformanceBenchmark === false && item.certification.scientificValidation === 'unsupported')).toBe(true)
    const result = await physiology.conformance(selected.packageDigest)
    expect(result).toMatchObject({ benchmark: { passed: true }, certification: { status: 'certified-conformant', checks: { conformanceBenchmark: true }, scientificValidation: 'unsupported' } })
    expect(physiology.getPackage(selected.packageDigest).certification.status).toBe('certified-conformant')
    expect(physiology.listPackages().filter((item) => item.certification.status === 'certified-conformant').map((item) => item.packageDigest)).toEqual([selected.packageDigest])
    expect(await physiology.packageBytes(selected.packageDigest)).toEqual(bytes)
    await physiology.close()
    services.splice(services.indexOf(physiology), 1)
    physiology = await service(root)
    expect(physiology.getPackage(selected.packageDigest).certification.status).toBe('certified-conformant')
    expect(await physiology.packageBytes(selected.packageDigest)).toEqual(bytes)
  })

  it('blocks unit/taxon/applicability extrapolation and dynamically applies trust revocation', async () => {
    const root = await isolatedTestRoot('physiology-trust')
    roots.push(root)
    const physiology = await service(root)
    const packages = physiology.listPackages()

    expect(() => physiology.createCoupling(request(packages, { taxonId: 'NCBITaxon:10090' }))).toThrow(/mouse extrapolation is blocked/i)
    const coupling = physiology.createCoupling(request(packages))
    const historical = await physiology.run({ couplingDigest: coupling.couplingDigest })
    physiology.revokeTrustKey(REFERENCE_KEY_ID)
    expect(physiology.listPackages().every((item) => item.trust.status === 'revoked' && item.certification.status === 'not-certified')).toBe(true)
    await expect(physiology.run({ couplingDigest: coupling.couplingDigest })).rejects.toThrow(/publisher key is revoked/i)
    expect(physiology.getRun(historical.runDigest)).toEqual(historical)
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
