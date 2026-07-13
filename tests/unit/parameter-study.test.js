import { describe, expect, it } from 'vitest'
import { createParameterFixtureClient } from '../../server/parameters/fixture.js'
import { loadParameterOptions } from '../../server/parameters/selection.js'
import { assessIdentifiability, randomWalkMetropolis } from '../../server/studies/algorithms.js'
import { executeStudy } from '../../server/studies/service.js'

describe('Goal 5 parameter selection and inference algorithms', () => {
  it('prefers the exact canonical-unit candidate and exposes conversion and exclusion rationale', async () => {
    const options = await loadParameterOptions(createParameterFixtureClient())
    const converted = options.decisions.find((item) => item.candidateId === 'CANDIDATE:DECAY-CONVERTIBLE')
    const incompatible = options.decisions.find((item) => item.candidateId === 'CANDIDATE:DECAY-INCOMPATIBLE-UNIT')

    expect(options).toMatchObject({ selectedCandidateId: 'CANDIDATE:DECAY-POINT', selectedValue: 0.1, canonicalUnit: 's^-1' })
    expect(converted).toMatchObject({ decision: 'excluded', canonicalValue: 0.1, labels: expect.arrayContaining(['unit-converted']) })
    expect(incompatible).toMatchObject({ decision: 'excluded', canonicalValue: null })
    expect(incompatible.rationale).toMatch(/dimensions cannot be converted/)
  })

  it('rejects taxon leakage unless an explicit matching transform is supplied', async () => {
    const client = createParameterFixtureClient()
    const input = { parameterId: 'PARAMETER:MTHFR-KM-CH2THF', targetContextId: 'CONTEXT:HUMAN-LIVER-CYTOSOL' }
    const rejected = await loadParameterOptions(client, input)
    const rejectedMouse = rejected.decisions.find((item) => item.candidateId === 'CANDIDATE:MTHFR-KM-MOUSE-MISMATCH')
    const transformed = await loadParameterOptions(client, {
      ...input,
      transforms: [{ id: 'TRANSFORM:MOUSE-TO-HUMAN-ASSUMPTION', candidateId: 'CANDIDATE:MTHFR-KM-MOUSE-MISMATCH', sourceTaxonId: 'NCBITaxon:10090', targetTaxonId: 'NCBITaxon:9606', scaleFactor: 1, rationale: 'Explicit synthetic transform used only to test the boundary.' }]
    })
    const transformedMouse = transformed.decisions.find((item) => item.candidateId === 'CANDIDATE:MTHFR-KM-MOUSE-MISMATCH')

    expect(rejected.selectedCandidateId).toBe('CANDIDATE:MTHFR-KM-ASSUMED')
    expect(rejectedMouse.rationale).toMatch(/no explicit taxon transform/)
    expect(transformedMouse.labels).toContain('context-transformed')
    expect(transformed.selectedCandidateId).toBe('CANDIDATE:MTHFR-KM-ASSUMED')
  })

  it('is reproducible, uses disjoint IDs, and recovers the known synthetic rate', async () => {
    const client = createParameterFixtureClient()
    const first = await executeStudy(client, {})
    const second = await executeStudy(client, {})
    const calibration = new Set(first.calibration.calibrationObservationIds)

    expect(second).toEqual(first)
    expect(first.outcome).toBe('successful')
    expect(first.calibration.estimate).toBeCloseTo(0.1, 8)
    expect(first.calibration.validationObservationIdsAccessed).toEqual([])
    expect(first.validation.observationIds.every((id) => !calibration.has(id))).toBe(true)
    expect(first.validation.coverageProbability).toBe(1)
  })

  it('detects underidentifiability from a rank-deficient Fisher matrix', () => {
    const result = assessIdentifiability([[1, 2], [2, 4], [3, 6]], 0.01, ['PARAMETER:A', 'PARAMETER:B'])
    expect(result).toMatchObject({ identifiable: false, rank: 1, columns: 2, conditionNumber: 'infinite' })
  })

  it('marks poor random-walk chain diagnostics as non-converged', () => {
    const sampled = randomWalkMetropolis({ logDensity: (value) => -(value ** 2) / 2, bounds: { lower: -10, upper: 10 }, initial: 0, priorStandardDeviation: 1, chains: 4, warmup: 0, samples: 100, proposalScale: 100, seed: 17 })
    expect(sampled.converged).toBe(false)
    expect(sampled.acceptanceRates.some((rate) => rate < 0.1)).toBe(true)
    expect(sampled.diagnostics.join(' ')).toMatch(/acceptance below/)
  })

  it('never presents optimizer best-so-far as a converged estimate', async () => {
    const result = await executeStudy(createParameterFixtureClient(), { controls: { optimizerMaxIterations: 1 } })
    expect(result).toMatchObject({ outcome: 'non-converged', calibration: { status: 'non-converged', converged: false, estimate: null, bestSoFar: expect.any(Number) }, posterior: { status: 'non-converged', converged: false, interval: null } })
  })

  it('downgrades robustness when a misspecified model alternative violates held-out thresholds', async () => {
    const result = await executeStudy(createParameterFixtureClient(), { controls: { includeMisspecifiedAlternative: true } })
    expect(result.robustness.status).toBe('downgraded')
    expect(result.robustness.matrix.find((item) => item.id === 'structural-offset-stress')).toMatchObject({ modelForm: 'first-order-offset', supportsConclusion: false })
  })
})
