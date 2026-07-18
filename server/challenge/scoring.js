import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CHALLENGE_CONCLUSION_BOUNDARY,
  ChallengeResultSubmissionSchema
} from '../../shared/challenge-contracts.js'
import { ChallengeVerificationError } from './verification.js'

const BOUNDED_CONCLUSIONS = Object.freeze({
  failed: 'The model remains unsupported for at least one frozen challenge endpoint within this boundary; no clinical, treatment, or bioequivalence claim is made.',
  'not-evaluable': 'The model is not evaluable under the frozen mapping or diagnostics boundary; no clinical, treatment, or bioequivalence claim is made.',
  'supported-within-boundary': 'The model is supported only for both frozen aggregate parent-APAP Cmax endpoints within this boundary; no clinical, treatment, or bioequivalence claim is made.'
})

function decimalInteger(value) {
  const match = /^(-?)([0-9]+)(?:\.([0-9]+))?(?:e([+-]?[0-9]+))?$/i.exec(value)
  if (!match) throw new ChallengeVerificationError(`Invalid decimal for Goal 13 arithmetic: ${value}.`)
  const sign = match[1] === '-' ? -1n : 1n
  const fraction = match[3] ?? ''
  const exponent = Number(match[4] ?? 0)
  let digits = `${match[2]}${fraction}`
  let scale = fraction.length - exponent
  if (scale < 0) {
    digits += '0'.repeat(-scale)
    scale = 0
  }
  return { value: sign * BigInt(digits), scale }
}

function commonIntegers(leftText, rightText) {
  const left = decimalInteger(leftText)
  const right = decimalInteger(rightText)
  const scale = Math.max(left.scale, right.scale)
  return [left.value * 10n ** BigInt(scale - left.scale), right.value * 10n ** BigInt(scale - right.scale)]
}

function formatFixed(value, places) {
  const digits = value.toString().padStart(places + 1, '0')
  return places === 0 ? digits : `${digits.slice(0, -places)}.${digits.slice(-places)}`
}

export function quantizeDecimalText(value, places) {
  const decimal = decimalInteger(value)
  if (decimal.value < 0n || !Number.isInteger(places) || places < 0 || places > 18) throw new ChallengeVerificationError('Goal 13 prediction quantization requires a non-negative decimal and 0-18 places.')
  if (decimal.scale <= places) return formatFixed(decimal.value * 10n ** BigInt(places - decimal.scale), places)
  const divisor = 10n ** BigInt(decimal.scale - places)
  let rounded = decimal.value / divisor
  const remainder = decimal.value % divisor
  const comparison = remainder * 2n - divisor
  if (comparison > 0n || (comparison === 0n && rounded % 2n === 1n)) rounded += 1n
  return formatFixed(rounded, places)
}

export function quantizePrediction(value, places = 10) {
  if (!Number.isFinite(value) || value < 0) throw new ChallengeVerificationError('Goal 13 prediction must be finite and non-negative before quantization.')
  return quantizeDecimalText(value.toString(), places)
}

export function scoreRelativeError(predicted, measured) {
  const [prediction, observation] = commonIntegers(predicted, measured)
  if (observation <= 0n) throw new ChallengeVerificationError('Goal 13 measured values must be positive for relative-error scoring.')
  const difference = prediction >= observation ? prediction - observation : observation - prediction
  const scaled = difference * 10n ** 10n
  let rounded = scaled / observation
  const remainder = scaled % observation
  const comparison = remainder * 2n - observation
  if (comparison > 0n || (comparison === 0n && rounded % 2n === 1n)) rounded += 1n
  return { score: formatFixed(rounded, 10), passed: difference * 100n <= observation * 30n }
}

function endpointStatus(endpointId, diagnostics) {
  if (typeof diagnostics === 'string') return diagnostics
  const item = diagnostics.find((candidate) => candidate.endpoint_id === endpointId)
  if (!item) throw new ChallengeVerificationError(`Goal 13 diagnostics omitted ${endpointId}.`)
  return item.status
}

export function independentlyScoreChallenge(frozen, disclosure, endpointDiagnostics) {
  const observations = new Map(disclosure.observations.map((item) => [item.endpoint_id, item]))
  let invalid = false
  let failed = false
  const endpointResults = frozen.predictions.map((prediction) => {
    const observation = observations.get(prediction.endpoint_id)
    if (!observation) throw new ChallengeVerificationError(`Goal 13 disclosure omitted ${prediction.endpoint_id}.`)
    let diagnosticStatus = endpointStatus(prediction.endpoint_id, endpointDiagnostics)
    if (prediction.predicted_unit !== 'mg/L' || observation.normalized_unit !== 'mg/L') diagnosticStatus = 'invalid-mapping'
    let absoluteRelativeError = null
    let supportLabel = 'not-evaluable'
    if (diagnosticStatus !== 'evaluable') {
      invalid = true
    } else {
      const scored = scoreRelativeError(prediction.predicted_value, observation.normalized_value)
      absoluteRelativeError = scored.score
      failed ||= !scored.passed
      supportLabel = scored.passed ? 'supported-within-boundary' : 'unsupported'
    }
    return {
      endpoint_id: prediction.endpoint_id,
      predicted_value: prediction.predicted_value,
      predicted_unit: prediction.predicted_unit,
      predicted_time_h: prediction.predicted_time_h,
      measured_value: observation.normalized_value,
      measured_unit: observation.normalized_unit,
      absolute_relative_error: absoluteRelativeError,
      threshold: '0.30',
      support_label: supportLabel,
      diagnostic_status: diagnosticStatus
    }
  })
  const conclusion = invalid ? 'not-evaluable' : failed ? 'failed' : 'supported-within-boundary'
  return {
    result_contract: 'apap-human-pk-challenge-result-v1',
    commitment_digest: disclosure.commitment_digest,
    disclosure_digest: disclosure.disclosure_digest,
    metric: 'abs(predicted-measured)/measured',
    threshold: '<=0.30',
    rounding: 'decimal ROUND_HALF_EVEN to 10 places',
    endpoint_results: endpointResults,
    conclusion,
    bounded_conclusion: BOUNDED_CONCLUSIONS[conclusion]
  }
}

export function buildResultSubmission(frozen, disclosure, artifactRefs) {
  const endpointDiagnostics = artifactRefs.diagnostics.content.diagnostics.endpoint_diagnostics
  const scored = independentlyScoreChallenge(frozen, disclosure, endpointDiagnostics)
  return ChallengeResultSubmissionSchema.parse({
    result_schema_version: '1.0.0',
    commitment_digest: disclosure.commitment_digest,
    disclosure_digest: disclosure.disclosure_digest,
    frozen_commitment: frozen,
    endpoint_results: scored.endpoint_results.map(({ absolute_relative_error: _score, threshold: _threshold, support_label: _label, ...item }) => item),
    submitted_conclusion: scored.conclusion,
    conclusion_boundary: CHALLENGE_CONCLUSION_BOUNDARY,
    software_digest: artifactRefs.software.digest,
    diagnostics_digest: artifactRefs.diagnostics.digest
  })
}

export function verifyProducerScoring(producerResult, independent) {
  const comparable = {
    result_contract: producerResult.result_contract,
    commitment_digest: producerResult.commitment_digest,
    disclosure_digest: producerResult.disclosure_digest,
    metric: producerResult.metric,
    threshold: producerResult.threshold,
    rounding: producerResult.rounding,
    endpoint_results: producerResult.endpoint_results,
    conclusion: producerResult.conclusion,
    bounded_conclusion: producerResult.bounded_conclusion
  }
  if (canonicalJson(comparable) !== canonicalJson(independent)) throw new ChallengeVerificationError('Goal 13 producer scoring differs from the independent consumer recomputation.')
  return producerResult
}
