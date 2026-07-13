import { describe, expect, it } from 'vitest'
import { PortfolioModelSchema } from '../../shared/portfolio-contracts.js'
import { runFba } from '../../server/portfolio/engines/fba.js'
import { runOde } from '../../server/portfolio/engines/ode.js'
import { createXoshiro128StarStar, runSsa } from '../../server/portfolio/engines/ssa.js'
import { FBA_MODEL, ODE_MODEL, SSA_MODEL } from '../../server/portfolio/registry.js'
import { validateExperimentForModel } from '../../server/portfolio/execution.js'
import { benchmarkExperiment } from '../fixtures/portfolio/experiments.js'
import { incompatibleUnitModel } from '../fixtures/portfolio/invalid-unit-model.js'

describe('Goal 4 numerical conformance', () => {
  it('matches the analytic first-order solution with RK4 and adaptive Dormand-Prince 5(4)', () => {
    const expected = 10 * Math.exp(-0.3 * 10)
    const adaptive = runOde(ODE_MODEL, benchmarkExperiment(ODE_MODEL))
    const rk4 = runOde(ODE_MODEL, benchmarkExperiment(ODE_MODEL, { controls: { method: 'rk4', fixedStep: 0.01 } }))

    expect(adaptive.outcome).toBe('successful')
    expect(adaptive.data.trajectories[0].values.at(-1)).toBeCloseTo(expected, 7)
    expect(rk4.data.trajectories[0].values.at(-1)).toBeCloseTo(expected, 7)
    expect(adaptive.residuals.conservedPool).toBeLessThan(1e-10)
    expect(adaptive.iterations).toBeLessThan(rk4.iterations)
  })

  it('pins the deterministic PRNG stream and reproduces seeded Gillespie runs', () => {
    const random = createXoshiro128StarStar(123)
    expect([random(), random(), random()]).toEqual([0.71717037667986, 0.7467051633866504, 0.10813909524586052])
    const experiment = benchmarkExperiment(SSA_MODEL)
    const first = runSsa(SSA_MODEL, experiment)
    const second = runSsa(SSA_MODEL, structuredClone(experiment))
    const changed = runSsa(SSA_MODEL, { ...experiment, seed: experiment.seed + 1 })

    expect(second).toEqual(first)
    expect(changed.data.summaries).not.toEqual(first.data.summaries)
    expect(first.residuals.conservedMolecules).toBe(0)
  })

  it('satisfies the binomial survival mean and variance benchmark across replicates', () => {
    const result = runSsa(SSA_MODEL, benchmarkExperiment(SSA_MODEL, { controls: { replicates: 4000 } }))
    const survivor = result.data.summaries.find((item) => item.id === 'A')
    const probability = Math.exp(-0.2 * 10)
    const expectedMean = 40 * probability
    const expectedVariance = 40 * probability * (1 - probability)

    expect(survivor.mean).toBeCloseTo(expectedMean, 1)
    expect(survivor.variance).toBeCloseTo(expectedVariance, 0)
  })

  it('reports optimal, infeasible, and unbounded linear programs distinctly', () => {
    const experiment = benchmarkExperiment(FBA_MODEL)
    const optimal = runFba(FBA_MODEL, experiment)
    const infeasibleModel = structuredClone(FBA_MODEL)
    infeasibleModel.definition.reactions = [{ ...infeasibleModel.definition.reactions[0], lowerBound: 1, upperBound: 1 }]
    infeasibleModel.definition.objective = { ...infeasibleModel.definition.objective, reactionId: 'uptake' }
    const unboundedModel = structuredClone(FBA_MODEL)
    unboundedModel.definition.reactions[0].upperBound = null

    expect(optimal).toMatchObject({ outcome: 'successful', data: { objective: 10 }, residuals: { steadyState: 0, boundViolation: 0 } })
    expect(runFba(infeasibleModel, experiment).outcome).toBe('infeasible')
    expect(runFba(unboundedModel, experiment).outcome).toBe('unbounded')
  })

  it('applies declared ODE, SSA, and FBA intervention assignments deterministically', () => {
    const odeExperiment = benchmarkExperiment(ODE_MODEL)
    odeExperiment.interventions = [{ targetId: 'A', time: 5, value: 10, unit: ODE_MODEL.definition.species[0].unit }]
    const ssaExperiment = benchmarkExperiment(SSA_MODEL, { controls: { replicates: 16 } })
    ssaExperiment.interventions = [{ targetId: 'A', time: 0, value: 0, unit: SSA_MODEL.definition.species[0].unit }]
    const fbaExperiment = benchmarkExperiment(FBA_MODEL)
    fbaExperiment.interventions = [{ targetId: 'uptake', time: 0, value: 4, unit: FBA_MODEL.definition.reactions[0].unit }]

    expect(runOde(ODE_MODEL, odeExperiment).data.trajectories[0].values.at(-1)).toBeCloseTo(10 * Math.exp(-0.3 * 5), 7)
    expect(runSsa(SSA_MODEL, ssaExperiment).data.summaries.find((item) => item.id === 'A').mean).toBe(0)
    expect(runFba(FBA_MODEL, fbaExperiment)).toMatchObject({ outcome: 'successful', data: { objective: 4 } })
  })

  it('rejects incompatible state and observable dimensions in strict model contracts', () => {
    expect(PortfolioModelSchema.safeParse(incompatibleUnitModel())).toMatchObject({ success: false })
  })

  it('rejects dimension-compatible cross-scale execution values and interventions', () => {
    const odeState = structuredClone(ODE_MODEL)
    odeState.definition.species[1].unit.scaleToSI *= 1000
    const odeRate = structuredClone(ODE_MODEL)
    odeRate.definition.parameters[0].unit.scaleToSI = 1 / 60
    const ssaState = structuredClone(SSA_MODEL)
    ssaState.definition.species.forEach((item) => { item.unit.scaleToSI = 1 })
    const fbaFlux = structuredClone(FBA_MODEL)
    fbaFlux.definition.reactions[1].unit.scaleToSI *= 1000
    const intervention = benchmarkExperiment(ODE_MODEL)
    intervention.interventions = [{ targetId: 'A', time: 0, value: 1, unit: { ...ODE_MODEL.definition.species[0].unit, scaleToSI: 1 } }]
    const hours = benchmarkExperiment(ODE_MODEL)
    hours.controls.timeUnit = 'hour'

    for (const model of [odeState, odeRate, ssaState, fbaFlux]) expect(PortfolioModelSchema.safeParse(model).success).toBe(false)
    expect(() => validateExperimentForModel(ODE_MODEL, intervention)).toThrow(/exact execution unit scale/)
    expect(() => validateExperimentForModel(ODE_MODEL, hours)).toThrow()
    expect(PortfolioModelSchema.safeParse(ODE_MODEL).success).toBe(true)
  })

  it('enforces unique executable, observable, and participant identifiers', () => {
    const duplicateSpecies = structuredClone(ODE_MODEL)
    duplicateSpecies.definition.species[1].id = duplicateSpecies.definition.species[0].id
    const crossNamespace = structuredClone(ODE_MODEL)
    crossNamespace.definition.parameters[0].id = crossNamespace.definition.species[0].id
    const duplicateProducts = structuredClone(ODE_MODEL)
    duplicateProducts.definition.reactions[0].products.push(structuredClone(duplicateProducts.definition.reactions[0].products[0]))
    const duplicateObservables = structuredClone(ODE_MODEL)
    duplicateObservables.observables[1].id = duplicateObservables.observables[0].id
    const duplicateMetabolites = structuredClone(FBA_MODEL)
    duplicateMetabolites.definition.metabolites.push(structuredClone(duplicateMetabolites.definition.metabolites[0]))

    for (const model of [duplicateSpecies, crossNamespace, duplicateProducts, duplicateObservables, duplicateMetabolites]) expect(PortfolioModelSchema.safeParse(model).success).toBe(false)
  })
})
