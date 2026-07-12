import { describe, expect, it } from 'vitest'
import { SimulationRequestSchema } from '../../shared/contracts.js'
import { BUNDLED_RELEASE, bundledNetwork } from '../../server/knowledge/fixture.js'
import { simulate, SimulationNumericalError } from '../../server/simulation.js'
import { METABOLITE_IDS, REACTION_IDS } from '../../shared/identifiers.js'
import { MODEL } from '../../server/model.js'

const baselineRequest = {
  releaseId: BUNDLED_RELEASE.id,
  taxonId: 9606,
  preset: 'baseline',
  mthfrActivity: 1,
  durationHours: 24,
  stepHours: 0.05
}

describe('one-carbon simulation', () => {
  it('repeats with an identical identity and canonical output', () => {
    const first = simulate(baselineRequest, BUNDLED_RELEASE, bundledNetwork(9606))
    const second = simulate({ ...baselineRequest }, BUNDLED_RELEASE, bundledNetwork(9606))

    expect(second).toEqual(first)
    expect(first.runId).toBe('sha256:fc22a4af8287726e1d54b5bafefdf0d4a7b8d11181aff905f39e4f679e0f2500')
    expect(first.diagnostics).toMatchObject({ method: 'fixed-step RK4', deterministic: true, nonNegative: true, integrationSteps: 480, integrationStepHours: 0.05 })
    expect(first.concentrations.map((series) => series.id)).toContain(METABOLITE_IDS.homocysteine)
    expect(first.fluxes.map((series) => series.id)).toContain(REACTION_IDS.mthfr)
  })

  it('predicts higher homocysteine and lower SAM:SAH under reduced MTHFR activity', () => {
    const baseline = simulate(baselineRequest, BUNDLED_RELEASE, bundledNetwork(9606))
    const reduced = simulate({ ...baselineRequest, preset: 'reduced-mthfr', mthfrActivity: 0.35 }, BUNDLED_RELEASE, bundledNetwork(9606))

    expect(reduced.runId).not.toBe(baseline.runId)
    expect(reduced.summary.finalHomocysteine).toBeGreaterThan(baseline.summary.finalHomocysteine)
    expect(reduced.summary.finalSamSahRatio).toBeLessThan(baseline.summary.finalSamSahRatio)
  })

  it('keeps taxon identity and protein evidence distinct', () => {
    const human = simulate(baselineRequest, BUNDLED_RELEASE, bundledNetwork(9606))
    const mouse = simulate({ ...baselineRequest, taxonId: 10090 }, BUNDLED_RELEASE, bundledNetwork(10090))

    expect(mouse.runId).not.toBe(human.runId)
    expect(mouse.release.digest).toBe(human.release.digest)
    expect(mouse.proteinAssociations.every((protein) => protein.taxonId === 10090)).toBe(true)
    expect(mouse.proteinAssociations.map((protein) => protein.id)).not.toEqual(human.proteinAssociations.map((protein) => protein.id))
    expect(mouse.concentrations).toEqual(human.concentrations)
    expect(mouse.fluxes).toEqual(human.fluxes)
  })

  it('discloses the lumped remethylation equation and curator-inferred MTHFR direction', () => {
    const remethylation = MODEL.topology.reactions.find((reaction) => reaction.id === REACTION_IDS.remethylation)
    const humanMthfr = bundledNetwork(9606).catalysis.find((assertion) => assertion.reactionId === REACTION_IDS.mthfr)

    expect(remethylation).toMatchObject({
      kind: 'model-only',
      productIds: expect.arrayContaining([METABOLITE_IDS.methionine, METABOLITE_IDS.methyleneThf]),
      knowledgeReactionId: REACTION_IDS.remethylation
    })
    expect(humanMthfr).toMatchObject({ evidenceClass: 'inferred', evidenceCode: 'ECO:0000305' })
  })

  it('executes and reports every exact requested step', () => {
    const request = { ...baselineRequest, durationHours: 1, stepHours: 0.25 }
    const result = simulate(request, BUNDLED_RELEASE, bundledNetwork(9606))

    expect(result.diagnostics).toMatchObject({ integrationSteps: 4, integrationStepHours: 0.25 })
    expect(result.timeHours).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(result.concentrations.every((series) => series.values.length === result.timeHours.length)).toBe(true)
    expect(result.diagnostics).toHaveProperty('netRepresentedPoolChange')
    expect(result.diagnostics).not.toHaveProperty('massBalanceResidual')

    const decimalSchedule = simulate({ ...baselineRequest, durationHours: 1.2, stepHours: 0.1 }, BUNDLED_RELEASE, bundledNetwork(9606))
    expect(decimalSchedule.diagnostics).toMatchObject({ integrationSteps: 12, integrationStepHours: 0.1 })
    expect(decimalSchedule.timeHours.at(-1)).toBe(1.2)
  })

  it('rejects incompatible schedules and invalid intermediate states instead of changing or clamping them', () => {
    expect(SimulationRequestSchema.safeParse({ ...baselineRequest, durationHours: 1, stepHours: 0.3 }).success).toBe(false)
    expect(() => simulate({ ...baselineRequest, durationHours: 1, stepHours: 0.3 }, BUNDLED_RELEASE, bundledNetwork(9606))).toThrow(SimulationNumericalError)
    expect(() => simulate({ ...baselineRequest, durationHours: 1, stepHours: 0.5, mthfrActivity: 100 }, BUNDLED_RELEASE, bundledNetwork(9606))).toThrow(/Invalid .* concentration during RK4 intermediate stage/)
  })
})
