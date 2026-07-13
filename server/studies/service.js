import { StudyRecordSchema, StudyRequestSchema, StudyResultSchema } from '../../shared/parameter-contracts.js'
import { digest } from '../portfolio/identity.js'
import { loadParameterOptions } from '../parameters/selection.js'
import {
  assessIdentifiability,
  boundedNelderMead,
  centeredFiniteDifference,
  interval,
  morrisScreen,
  posteriorPredictive,
  predictDecay,
  randomWalkMetropolis
} from './algorithms.js'

const MODEL_ID = 'synthetic-first-order-decay'
const MODEL_VERSION = '1.0.0'
const ALGORITHMS = Object.freeze({
  sensitivity: 'centered-finite-difference-1.0.0',
  morris: 'seeded-morris-1.0.0',
  calibration: 'bounded-nelder-mead-1.0.0',
  posterior: 'random-walk-metropolis-1.0.0'
})

function byIds(observations, identifiers) {
  const indexed = new Map(observations.map((item) => [item.id, item]))
  return identifiers.map((id) => {
    const observation = indexed.get(id)
    if (!observation) throw new Error(`Partition references missing observation ${id}`)
    return observation
  })
}

function objectiveFor(observations, options = {}) {
  const times = observations.map((item) => item.independent_value)
  return ([rate]) => {
    const predictions = predictDecay(times, rate, options)
    return predictions.reduce((sum, value, index) => sum + (value - observations[index].value) ** 2, 0)
  }
}

function calibrate(observations, bounds, start, controls, predictor = {}) {
  return boundedNelderMead({
    objective: objectiveFor(observations, predictor),
    initial: [start],
    bounds: [bounds],
    maxIterations: controls.optimizerMaxIterations,
    tolerance: controls.optimizerTolerance
  })
}

function rmse(observations, rate, predictor = {}) {
  const predictions = predictDecay(observations.map((item) => item.independent_value), rate, predictor)
  return Math.sqrt(predictions.reduce((sum, value, index) => sum + (value - observations[index].value) ** 2, 0) / observations.length)
}

function robustnessMatrix(options, calibration, validation, controls) {
  const span = options.bounds.upper - options.bounds.lower
  const scenarios = [
    { id: 'baseline-analytic', parameterStart: options.selectedValue, solver: 'analytic', timestep: 0, modelForm: 'first-order' },
    { id: 'parameter-low-start', parameterStart: options.bounds.lower + span * 0.2, solver: 'analytic', timestep: 0, modelForm: 'first-order' },
    { id: 'parameter-high-start', parameterStart: options.bounds.upper - span * 0.2, solver: 'analytic', timestep: 0, modelForm: 'first-order' },
    { id: 'rk4-step-0.5', parameterStart: options.selectedValue, solver: 'rk4', timestep: 0.5, modelForm: 'first-order' },
    { id: 'rk4-step-0.25', parameterStart: options.selectedValue, solver: 'rk4', timestep: 0.25, modelForm: 'first-order' }
  ]
  if (controls.includeMisspecifiedAlternative) scenarios.push({ id: 'structural-offset-stress', parameterStart: options.selectedValue, solver: 'analytic', timestep: 0, modelForm: 'first-order-offset' })
  const matrix = scenarios.map((scenario) => {
    const predictor = { solver: scenario.solver, timestep: scenario.timestep || undefined, modelForm: scenario.modelForm, offset: 1.5 }
    const fit = calibrate(calibration, options.bounds, scenario.parameterStart, controls, predictor)
    const estimate = fit.converged ? fit.estimate[0] : null
    const heldOutRmse = estimate === null ? null : rmse(validation, estimate, predictor)
    const supportsConclusion = estimate !== null && Math.abs(estimate - 0.1) <= 0.005 && heldOutRmse <= 0.1
    return {
      ...scenario,
      outcome: fit.converged ? 'successful' : 'non-converged',
      estimate,
      heldOutRmse,
      supportsConclusion,
      rationale: supportsConclusion ? 'Recovered k within 0.005 s^-1 and held-out RMSE within 0.1 umol/L.' : 'The scenario violates the declared recovery or held-out error threshold.'
    }
  })
  const robust = matrix.every((item) => item.supportsConclusion)
  return {
    status: robust ? 'robust' : 'downgraded',
    conclusion: robust ? 'Parameter recovery is stable across starts, solver, and timestep controls.' : 'The conclusion is downgraded because at least one numerical or model-form scenario fails the declared threshold.',
    matrix
  }
}

function uncertaintySummary(options, sigma) {
  const releaseComponents = options.uncertainties.flatMap((item) => item.components)
  const description = (category, fallback) => releaseComponents.find((item) => item.category === category)?.description ?? fallback
  return [
    { category: 'biological', label: 'synthetic', description: description('biological', 'Not applicable to this non-biological benchmark.') },
    { category: 'measurement', label: 'assumption', description: `No measurements occurred; ${sigma} umol/L is an explicit likelihood and predictive-noise assumption.` },
    { category: 'structural', label: 'assumption', description: description('structural', 'First-order decay is assumed to be the exact generating form.') },
    { category: 'contextual', label: 'synthetic', description: description('contextual', 'No biological context is asserted.') },
    { category: 'numerical', label: 'synthetic', description: description('numerical', 'Floating-point and solver controls are checked in the robustness matrix.') }
  ]
}

export async function executeStudy(parameterClient, requestInput) {
  const request = StudyRequestSchema.parse(requestInput)
  const options = await loadParameterOptions(parameterClient, {
    parameterId: request.parameterId,
    targetContextId: request.targetContextId,
    datasetId: request.datasetId,
    transforms: request.transforms
  })
  const dataset = options.datasets.find((item) => item.id === request.datasetId)
  const partition = options.partitions.find((item) => item.dataset_id === request.datasetId)
  if (!dataset || !partition) throw new Error('The requested study requires one pinned dataset and fixed partition')
  if (dataset.data_origin !== 'synthetic') throw new Error('Goal 5 benchmark execution accepts only the declared synthetic dataset')
  const calibrationObservations = byIds(options.observations, partition.calibration_observation_ids)
  const validationObservations = byIds(options.observations, partition.validation_observation_ids)
  const overlap = partition.calibration_observation_ids.filter((id) => partition.validation_observation_ids.includes(id))
  if (overlap.length) throw new Error(`Partition leakage detected for ${overlap[0]}`)

  const controls = request.controls
  const calibrationStart = options.bounds.lower + (options.bounds.upper - options.bounds.lower) * 0.65
  const fitted = calibrate(calibrationObservations, options.bounds, calibrationStart, controls)
  const bestRate = fitted.bestSoFar[0]
  const calibrationResult = {
    status: fitted.converged ? 'successful' : 'non-converged',
    converged: fitted.converged,
    estimate: fitted.converged ? fitted.estimate[0] : null,
    bestSoFar: bestRate,
    objective: fitted.objective,
    iterations: fitted.iterations,
    calibrationObservationIds: partition.calibration_observation_ids,
    validationObservationIdsAccessed: []
  }

  const sensitivityValues = centeredFiniteDifference({
    value: options.selectedValue,
    relativeStep: controls.sensitivityRelativeStep,
    evaluate: (rate) => predictDecay(options.observations.map((item) => item.independent_value), rate)
  })
  const baselinePredictions = predictDecay(options.observations.map((item) => item.independent_value), options.selectedValue)
  const local = options.observations.map((observation, index) => ({
    observationId: observation.id,
    derivative: sensitivityValues[index],
    normalized: baselinePredictions[index] === 0 ? 0 : sensitivityValues[index] * options.selectedValue / baselinePredictions[index]
  }))
  const morris = morrisScreen({
    parameterSpecs: [{ id: request.parameterId, lower: options.bounds.lower, upper: options.bounds.upper }],
    evaluate: ([rate]) => predictDecay([calibrationObservations.at(-1).independent_value], rate)[0],
    trajectories: controls.morrisTrajectories,
    levels: controls.morrisLevels,
    seed: request.seed
  })

  const jacobian = centeredFiniteDifference({
    value: bestRate,
    relativeStep: controls.sensitivityRelativeStep,
    evaluate: (rate) => predictDecay(calibrationObservations.map((item) => item.independent_value), rate)
  }).map((value) => [value])
  const identifiability = assessIdentifiability(jacobian, controls.observationSigma ** 2, [request.parameterId])

  const logDensity = (rate) => {
    const prior = -0.5 * ((rate - options.prior.mean) / options.prior.standardDeviation) ** 2
    const predictions = predictDecay(calibrationObservations.map((item) => item.independent_value), rate)
    const likelihood = predictions.reduce((sum, value, index) => sum - 0.5 * ((value - calibrationObservations[index].value) / controls.observationSigma) ** 2, 0)
    return prior + likelihood
  }
  const sampled = randomWalkMetropolis({
    logDensity,
    bounds: options.bounds,
    initial: bestRate,
    priorStandardDeviation: options.prior.standardDeviation,
    chains: controls.posteriorChains,
    warmup: controls.posteriorWarmup,
    samples: controls.posteriorSamples,
    proposalScale: controls.posteriorProposalScale,
    seed: request.seed
  })
  const posteriorConverged = fitted.converged && identifiability.identifiable && sampled.converged
  const flattenedSamples = sampled.chains.flat()
  const posterior = {
    status: posteriorConverged ? 'successful' : 'non-converged',
    converged: posteriorConverged,
    interval: posteriorConverged ? interval(flattenedSamples) : null,
    rHat: sampled.rHat,
    acceptanceRates: sampled.acceptanceRates,
    chains: controls.posteriorChains,
    samplesPerChain: controls.posteriorSamples,
    diagnostics: sampled.diagnostics
  }
  const validationDiagnostics = [
    ...fitted.converged ? [] : ['Posterior predictive validation was suppressed because calibration did not converge.'],
    ...identifiability.identifiable ? [] : ['Posterior predictive validation was suppressed because the fitted parameterization is not identifiable.'],
    ...sampled.converged ? [] : ['Posterior predictive validation was suppressed because chain diagnostics did not pass.']
  ]
  const validation = posteriorConverged
    ? { status: 'available', diagnosticOnly: false, ...posteriorPredictive({ posteriorSamples: flattenedSamples, observations: validationObservations, sigma: controls.observationSigma, seed: (request.seed ^ 0xa5a5a5a5) >>> 0 }), diagnostics: [] }
    : { status: 'suppressed', diagnosticOnly: true, heldOutOnly: true, observationIds: validationObservations.map((item) => item.id), coverageProbability: null, covered: null, total: validationObservations.length, predictions: [], diagnostics: validationDiagnostics }
  const robustness = robustnessMatrix(options, calibrationObservations, validationObservations, controls)
  const outcome = fitted.converged && identifiability.identifiable && posteriorConverged ? 'successful' : 'non-converged'
  const studyId = digest({ parameterRelease: options.release, model: { id: MODEL_ID, version: MODEL_VERSION }, algorithms: ALGORITHMS, request })
  return StudyResultSchema.parse({
    contractVersion: '1.0.0',
    studyId,
    lifecycle: 'terminal',
    outcome,
    provenance: { parameterRelease: options.release, modelId: MODEL_ID, modelVersion: MODEL_VERSION, algorithms: ALGORITHMS, seed: request.seed },
    request,
    labels: ['synthetic', 'assumption'],
    parameterSelection: options,
    partition,
    sensitivity: { method: 'centered-finite-difference', relativeStep: controls.sensitivityRelativeStep, local, morris },
    calibration: calibrationResult,
    identifiability,
    posterior,
    validation,
    robustness,
    uncertainty: uncertaintySummary(options, controls.observationSigma),
    limitations: [
      'All observations and parameter evidence are synthetic or repository-authored assumptions; no measured biology is analyzed.',
      'The noiseless first-order benchmark tests software behavior only over 0 to 10 seconds.',
      'The Gaussian observation error used by calibration and posterior prediction is an explicit assumption, not measured noise.',
      'R-hat and acceptance thresholds diagnose these finite chains but do not prove complete posterior exploration.'
    ]
  })
}

export function createStudyService(parameterClient) {
  const records = new Map()
  return {
    async create(input) {
      const result = await executeStudy(parameterClient, input)
      const record = StudyRecordSchema.parse({ studyId: result.studyId, lifecycle: 'terminal', outcome: result.outcome, result })
      records.set(record.studyId, record)
      return record
    },
    get(studyId) {
      return records.get(studyId)
    }
  }
}
