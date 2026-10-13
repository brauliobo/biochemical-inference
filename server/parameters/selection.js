import { ParameterOptionsResponseSchema, TaxonTransformSchema } from '../../shared/parameter-contracts.js'
import { defineProblemError } from '../commons/errors.js'

const UNIT_DEFINITIONS = Object.freeze({
  '1': { dimension: 'dimensionless', scale: 1 },
  s: { dimension: 'time', scale: 1 },
  's^-1': { dimension: 'first_order_rate', scale: 1 },
  'min^-1': { dimension: 'first_order_rate', scale: 1 / 60 },
  'umol/L': { dimension: 'concentration', scale: 1 },
  'mmol/L': { dimension: 'concentration', scale: 1000 },
  'umol/L/s': { dimension: 'concentration_rate', scale: 1 },
  'mmol/L/min': { dimension: 'concentration_rate', scale: 1000 / 60 }
})

export const ParameterSelectionError = defineProblemError('ParameterSelectionError', { statusCode: 422, code: 'PARAMETER_SELECTION_FAILED' })

function convertParameterValue(value, sourceUnit, targetUnit) {
  const source = UNIT_DEFINITIONS[sourceUnit]
  const target = UNIT_DEFINITIONS[targetUnit]
  if (!source || !target || source.dimension !== target.dimension) throw new ParameterSelectionError(`Cannot convert ${sourceUnit} to ${targetUnit}`, { code: 'INCOMPATIBLE_PARAMETER_UNIT' })
  return value * source.scale / target.scale
}

function representative(candidate, canonicalUnit) {
  if (candidate.value_kind === 'point') return convertParameterValue(candidate.value, candidate.unit, canonicalUnit)
  if (candidate.value_kind === 'interval') return convertParameterValue((candidate.lower + candidate.upper) / 2, candidate.unit, canonicalUnit)
  if (candidate.distribution.family === 'normal') return convertParameterValue(candidate.distribution.mean, candidate.unit, canonicalUnit)
  if (candidate.distribution.family === 'lognormal') return convertParameterValue(Math.exp(candidate.distribution.log_mean + candidate.distribution.log_standard_deviation ** 2 / 2), candidate.unit, canonicalUnit)
  return convertParameterValue((candidate.distribution.lower + candidate.distribution.upper) / 2, candidate.unit, canonicalUnit)
}

function normalPrior(candidate, canonicalUnit) {
  if (candidate?.value_kind === 'distribution' && candidate.distribution.family === 'normal') {
    return {
      family: 'normal',
      mean: convertParameterValue(candidate.distribution.mean, candidate.unit, canonicalUnit),
      standardDeviation: convertParameterValue(candidate.distribution.standard_deviation, candidate.unit, canonicalUnit),
      candidateId: candidate.id
    }
  }
  if (candidate?.value_kind === 'distribution' && candidate.distribution.family === 'lognormal') {
    const variance = (Math.exp(candidate.distribution.log_standard_deviation ** 2) - 1) * Math.exp(2 * candidate.distribution.log_mean + candidate.distribution.log_standard_deviation ** 2)
    return { family: 'normal', mean: representative(candidate, canonicalUnit), standardDeviation: convertParameterValue(Math.sqrt(variance), candidate.unit, canonicalUnit), candidateId: candidate.id }
  }
  if (candidate?.value_kind === 'distribution') {
    return { family: 'normal', mean: representative(candidate, canonicalUnit), standardDeviation: convertParameterValue((candidate.distribution.upper - candidate.distribution.lower) / Math.sqrt(12), candidate.unit, canonicalUnit), candidateId: candidate.id }
  }
  const mean = representative(candidate, canonicalUnit)
  return { family: 'normal', mean, standardDeviation: Math.max(Math.abs(mean) * 0.1, 1e-12), candidateId: candidate.id }
}

function candidateRank(candidate, targetContext, transform) {
  const exact = candidate.context_id === targetContext.id
  const kind = candidate.value_kind === 'point' ? 0 : candidate.value_kind === 'distribution' ? 1 : 2
  return [exact ? 0 : transform ? 1 : 2, candidate.unit === undefined || candidate.applicability.qualifiers.includes('unit-conversion-required') ? 1 : 0, kind, candidate.id]
}

function compareRank(left, right) {
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] < right[index]) return -1
    if (left[index] > right[index]) return 1
  }
  return 0
}

function matchingTransform(candidate, candidateContext, targetContext, transforms) {
  return transforms.find((item) => item.candidateId === candidate.id && item.sourceTaxonId === candidateContext.taxon_id && item.targetTaxonId === targetContext.taxon_id)
}

function selectParameterCandidates({ candidateResponse, contextResponse, datasetResponse, parameterId, targetContextId, transforms = [] }) {
  const parsedTransforms = transforms.map((item) => TaxonTransformSchema.parse(item))
  const parameter = candidateResponse.parameters.find((item) => item.id === parameterId)
  const targetContext = contextResponse.items.find((item) => item.id === targetContextId)
  if (!parameter) throw new ParameterSelectionError(`Parameter ${parameterId} is not available in the pinned release`, { code: 'PARAMETER_NOT_FOUND' })
  if (!targetContext) throw new ParameterSelectionError(`Target context ${targetContextId} is not available in the pinned release`, { code: 'PARAMETER_CONTEXT_NOT_FOUND' })

  const contexts = new Map(contextResponse.items.map((item) => [item.id, item]))
  const evaluated = candidateResponse.items.filter((item) => item.parameter_id === parameterId).map((candidate) => {
    const candidateContext = contexts.get(candidate.context_id) ?? candidateResponse.contexts.find((item) => item.id === candidate.context_id)
    if (!candidateContext) throw new ParameterSelectionError(`Candidate ${candidate.id} references an unavailable context`)
    const transform = matchingTransform(candidate, candidateContext, targetContext, parsedTransforms)
    const taxonMismatch = candidateContext.taxon_id !== targetContext.taxon_id && candidateContext.taxon_id !== null && targetContext.taxon_id !== null
    const incompatible = UNIT_DEFINITIONS[candidate.unit]?.dimension !== parameter.dimension
    const upstreamExcluded = candidate.applicability.status === 'excluded'
    const transformOverridesTaxonOnly = upstreamExcluded && candidate.applicability.qualifiers.every((item) => item === 'taxon-mismatch') && transform
    const eligible = !incompatible && (!taxonMismatch || transform) && (!upstreamExcluded || transformOverridesTaxonOnly)
    return { candidate, candidateContext, transform, eligible, taxonMismatch, incompatible, rank: candidateRank(candidate, targetContext, transform) }
  })
  const eligible = evaluated.filter((item) => item.eligible).sort((left, right) => compareRank(left.rank, right.rank))
  if (!eligible.length) throw new ParameterSelectionError(`No applicable, dimensionally compatible candidate exists for ${parameterId} in ${targetContextId}`)
  const selected = eligible[0]
  const exactOrTransformed = eligible.filter((item) => item.candidate.context_id === targetContext.id || item.transform)
  const boundsChoice = exactOrTransformed.filter((item) => item.candidate.value_kind === 'interval').sort((left, right) => compareRank(left.rank, right.rank))[0]
  const priorChoice = exactOrTransformed.filter((item) => item.candidate.value_kind === 'distribution').sort((left, right) => compareRank(left.rank, right.rank))[0] ?? selected
  const selectedValue = representative(selected.candidate, parameter.canonical_unit) * (selected.transform?.scaleFactor ?? 1)
  const bounds = boundsChoice ? {
    lower: convertParameterValue(boundsChoice.candidate.lower, boundsChoice.candidate.unit, parameter.canonical_unit) * (boundsChoice.transform?.scaleFactor ?? 1),
    upper: convertParameterValue(boundsChoice.candidate.upper, boundsChoice.candidate.unit, parameter.canonical_unit) * (boundsChoice.transform?.scaleFactor ?? 1),
    candidateId: boundsChoice.candidate.id
  } : { lower: Math.max(0, selectedValue * 0.5), upper: selectedValue * 1.5, candidateId: selected.candidate.id }
  const prior = normalPrior(priorChoice.candidate, parameter.canonical_unit)
  if (priorChoice.transform) {
    prior.mean *= priorChoice.transform.scaleFactor
    prior.standardDeviation *= priorChoice.transform.scaleFactor
  }

  const decisions = evaluated.sort((left, right) => left.candidate.id.localeCompare(right.candidate.id)).map((item) => {
    const labels = [item.candidate.evidence_class]
    if (item.candidate.unit !== parameter.canonical_unit) labels.push('unit-converted')
    if (item.transform) labels.push('context-transformed')
    if (item === selected) return { candidateId: item.candidate.id, decision: 'selected', role: 'estimate', canonicalUnit: parameter.canonical_unit, canonicalValue: selectedValue, rationale: `${item.candidate.applicability.rationale} Deterministic ranking preferred this candidate for the estimate.`, labels }
    if (item === boundsChoice) return { candidateId: item.candidate.id, decision: 'supporting', role: 'bounds', canonicalUnit: parameter.canonical_unit, canonicalValue: representative(item.candidate, parameter.canonical_unit), rationale: `${item.candidate.applicability.rationale} Used only as bounded calibration limits.`, labels }
    if (item === priorChoice) return { candidateId: item.candidate.id, decision: 'supporting', role: 'prior', canonicalUnit: parameter.canonical_unit, canonicalValue: representative(item.candidate, parameter.canonical_unit), rationale: `${item.candidate.applicability.rationale} Used only as the synthetic prior.`, labels }
    let rationale = `${item.candidate.applicability.rationale} Not selected.`
    if (item.incompatible) rationale = `${item.candidate.applicability.rationale} Excluded because dimensions cannot be converted.`
    else if (item.taxonMismatch && !item.transform) rationale = `${item.candidate.applicability.rationale} Excluded because no explicit taxon transform was supplied.`
    else if (item.eligible) rationale = `${item.candidate.applicability.rationale} Excluded because a higher-ranked exact-context candidate is available.`
    return { candidateId: item.candidate.id, decision: 'excluded', role: null, canonicalUnit: parameter.canonical_unit, canonicalValue: item.incompatible ? null : representative(item.candidate, parameter.canonical_unit), rationale, labels }
  })

  const labels = [...new Set(evaluated.map((item) => item.candidate.evidence_class === 'synthetic' ? 'synthetic' : 'assumption'))].sort()
  const relevantEvidenceIds = new Set(evaluated.flatMap((item) => item.candidate.evidence_locator_ids))
  const result = {
    contractVersion: '1.0.0',
    release: candidateResponse.release,
    parameter,
    targetContext,
    selectedCandidateId: selected.candidate.id,
    selectedValue,
    canonicalUnit: parameter.canonical_unit,
    bounds,
    prior,
    decisions,
    evidence: candidateResponse.evidence.filter((item) => relevantEvidenceIds.has(item.id)),
    correlations: candidateResponse.correlations,
    uncertainties: candidateResponse.uncertainties,
    datasets: datasetResponse.items,
    observations: datasetResponse.observations,
    partitions: datasetResponse.partitions,
    labels
  }
  return ParameterOptionsResponseSchema.parse(result)
}

export async function loadParameterOptions(client, input = {}) {
  const parameterId = input.parameterId ?? 'PARAMETER:DECAY-K'
  const targetContextId = input.targetContextId ?? 'CONTEXT:SYNTHETIC-DECAY'
  const [candidateResponse, contextResponse, datasetResponse] = await Promise.all([
    client.candidates({ parameterId }),
    client.contexts(),
    client.datasets({ parameterId, contextId: targetContextId, datasetId: input.datasetId })
  ])
  return selectParameterCandidates({ candidateResponse, contextResponse, datasetResponse, parameterId, targetContextId, transforms: input.transforms ?? [] })
}
