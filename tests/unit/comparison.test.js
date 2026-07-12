import { describe, expect, it } from 'vitest'
import { compatibleRuns } from '../../src/comparison.js'
import { BUNDLED_RELEASE, bundledNetwork } from '../../server/knowledge/fixture.js'
import { simulate } from '../../server/simulation.js'

const baseline = simulate({
  releaseId: BUNDLED_RELEASE.id,
  taxonId: 9606,
  preset: 'baseline',
  mthfrActivity: 1,
  durationHours: 4,
  stepHours: 0.05
}, BUNDLED_RELEASE, bundledNetwork(9606))

describe('baseline compatibility', () => {
  it('requires matching release, model, engine, taxon, duration, step, and initial conditions', () => {
    const reduced = simulate({
      releaseId: BUNDLED_RELEASE.id,
      taxonId: 9606,
      preset: 'reduced-mthfr',
      mthfrActivity: 0.35,
      durationHours: 4,
      stepHours: 0.05
    }, BUNDLED_RELEASE, bundledNetwork(9606))
    expect(compatibleRuns(reduced, baseline)).toBe(true)

    const incompatible = [
      { ...baseline, release: { ...baseline.release, digest: `sha256:${'0'.repeat(64)}` } },
      { ...baseline, modelVersion: 'other-model' },
      { ...baseline, engineVersion: 'other-engine' },
      { ...baseline, taxonId: 10090 },
      { ...baseline, effectiveInputs: { ...baseline.effectiveInputs, durationHours: 8 } },
      { ...baseline, effectiveInputs: { ...baseline.effectiveInputs, stepHours: 0.1 } },
      { ...baseline, effectiveInputs: { ...baseline.effectiveInputs, initialConcentrations: { ...baseline.effectiveInputs.initialConcentrations, 'CHEBI:58199': 9 } } }
    ]
    incompatible.forEach((candidate) => expect(compatibleRuns(reduced, candidate)).toBe(false))
  })
})
