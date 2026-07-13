import { digest } from '../portfolio/identity.js'
import {
  APAP_CONTRACT_VERSION,
  APAP_ENGINE_VERSION,
  APAP_EQUATION_SET_ID,
  APAP_MODEL_VERSION,
  APAP_RELEASE_ID,
  APAP_WARNING,
  ApapRunRequestSchema,
  ApapRunRecordSchema
} from '../../shared/apap-contracts.js'
import {
  APAP_EQUATION_SET_DIGEST,
  integrateApap,
  resolveContextBinding,
  runLimitingCaseDiagnostics,
  runTimestepRefinement,
  systemicSeries
} from './model.js'

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
const round = (value) => Number(value.toFixed(10))

export class ApapRequestError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ApapRequestError'
    this.statusCode = options.statusCode ?? 422
    this.code = options.code ?? 'INVALID_APAP_RUN'
  }
}

function requireUnique(items, id, description) {
  const selected = items.filter((item) => item.id === id)
  if (selected.length !== 1) throw new ApapRequestError(`Pinned APAP release must contain exactly one ${description} ${id}`, { statusCode: 409, code: 'APAP_CLOSURE_INVALID' })
  return selected[0]
}

function outputAt(integrated, timeHours) {
  const index = integrated.times.findIndex((time) => Math.abs(time - timeHours) < 1e-9)
  if (index < 0) throw new ApapRequestError(`Output grid does not include synthetic observation time ${timeHours}`)
  return integrated.outputs[index]
}

function syntheticComparisons(observations, protocol, integrated) {
  return observations.filter((item) => item.protocol_id === protocol.id).map((observation) => {
    const output = outputAt(integrated, observation.time.value)
    const predicted = observation.observable === 'synthetic-apap-concentration'
      ? output.centralApap
      : output.injuredFraction
    return {
      observationId: observation.id,
      partition: observation.partition,
      observed: observation.value.value,
      predicted: round(predicted),
      unit: observation.value.unit,
      validationStatus: 'unsupported'
    }
  })
}

function internalLimitations(upstream) {
  return [
    ...upstream,
    { id: 'LIMITATION:APAP-INFERENCE-MODEL-UNVALIDATED', category: 'scope', statement: 'The multiscale equations and every added kinetic value are internal illustrative assumptions; the pinned release does not validate them.' },
    { id: 'LIMITATION:APAP-INFERENCE-NO-UNCERTAINTY', category: 'benchmark', statement: 'Outputs are deterministic point trajectories without biological, measurement, structural, or contextual uncertainty estimates.' }
  ]
}

function resultAssumptions(effectiveParameters, upstreamAssumptions) {
  const upstream = upstreamAssumptions.map((item) => ({ id: item.id, statement: item.statement, origin: 'upstream', validationStatus: 'unsupported' }))
  const internal = effectiveParameters.filter((item) => item.origin === 'internal-illustrative-assumption').map((item) => ({ id: item.assumptionId, statement: item.statement, origin: 'internal', validationStatus: 'unsupported' }))
  return [...upstream, ...internal]
}

export async function loadApapClosure(client) {
  const [catalog, detail, contexts, parameters, protocols, observations, validation] = await Promise.all([
    client.catalog(), client.detail(), client.contexts(), client.parameters(), client.protocols(), client.observations(), client.validationMatrix()
  ])
  const release = catalog.releases.find((item) => item.release_id === APAP_RELEASE_ID)
  if (!release || release.release_digest !== detail.release.digest) throw new ApapRequestError('APAP catalog and release detail do not share the pinned digest', { statusCode: 409, code: 'APAP_CLOSURE_INVALID' })
  const contextIds = new Set(contexts.items.map((item) => item.id))
  for (const item of [...parameters.items, ...protocols.items, ...observations.items, ...validation.items]) {
    if (!contextIds.has(item.context_id)) throw new ApapRequestError(`APAP closure references unknown context ${item.context_id}`, { statusCode: 409, code: 'APAP_CLOSURE_INVALID' })
  }
  return { catalog, detail, contexts: contexts.items, parameters: parameters.items, protocols: protocols.items, observations: observations.items, validationMatrix: validation.items }
}

export function createApapRunService(client) {
  const records = new Map()

  return {
    async create(request) {
      const specification = ApapRunRequestSchema.parse(request)
      const closure = await loadApapClosure(client)
      const context = requireUnique(closure.contexts, specification.contextId, 'context')
      const protocol = requireUnique(closure.protocols, specification.protocolId, 'protocol')
      if (protocol.context_id !== context.id) throw new ApapRequestError(`${protocol.id} is bound to ${protocol.context_id}, not ${context.id}`)
      const binding = resolveContextBinding(context.id, specification.mechanismScales)
      for (const parameter of binding.effectiveParameters.filter((item) => item.origin === 'upstream-illustrative-assumption')) requireUnique(closure.parameters, parameter.id, 'upstream parameter')

      const durationHours = protocol.observation_window.upper
      const antidote = protocol.interventions.find((item) => item.role === 'antidote')
      const controls = { durationHours, stepHours: specification.stepHours, outputEveryHours: specification.outputEveryHours, nacStartHours: antidote?.start_time.lower ?? null }
      const identityInput = {
        release: closure.detail.release,
        modelVersion: APAP_MODEL_VERSION,
        engineVersion: APAP_ENGINE_VERSION,
        equationSetDigest: APAP_EQUATION_SET_DIGEST,
        contextId: context.id,
        protocolId: protocol.id,
        parameters: binding.effectiveParameters.map(({ symbol, value, unit }) => ({ symbol, value, unit })),
        controls
      }
      const runId = digest(identityInput)
      const existing = records.get(runId)
      if (existing) return existing
      const integrated = integrateApap(binding.values, controls)
      const timestepRefinement = runTimestepRefinement(binding.values, controls, integrated)
      if (!timestepRefinement.passed) throw new ApapRequestError('APAP equation set failed the declared timestep-refinement tolerance', { statusCode: 500, code: 'APAP_REFINEMENT_FAILED' })
      const limitingCases = runLimitingCaseDiagnostics(binding.values, controls)
      if (!limitingCases.every((item) => item.passed)) throw new ApapRequestError('APAP equation set failed a required limiting-case diagnostic', { statusCode: 500, code: 'APAP_LIMITING_CASE_FAILED' })
      const systemicOutputs = systemicSeries(integrated)
      const finalOutput = integrated.outputs.at(-1)
      const peakCentralApap = Math.max(...integrated.outputs.map((item) => item.centralApap))
      const peakInjuredFraction = Math.max(...integrated.outputs.map((item) => item.injuredFraction))
      const minimumOxygen = Math.min(...integrated.snapshots.flatMap((item) => item.oxygen))
      const result = {
        contractVersion: APAP_CONTRACT_VERSION,
        runId,
        lifecycle: 'terminal',
        outcome: 'successful',
        warning: APAP_WARNING,
        release: closure.detail.release,
        context,
        protocol,
        equationSet: { id: APAP_EQUATION_SET_ID, version: APAP_MODEL_VERSION, digest: APAP_EQUATION_SET_DIGEST, taxonBranches: false, lobuleBins: 12, identityIncludes: { formulas: true, boundaryConditions: true, initialConditions: true, events: true, constants: true } },
        engine: { version: APAP_ENGINE_VERSION, method: 'fixed-step RK4', stepHours: specification.stepHours, outputEveryHours: specification.outputEveryHours, deterministic: true },
        effectiveParameters: binding.effectiveParameters,
        assumptions: resultAssumptions(binding.effectiveParameters, closure.detail.benchmark.assumptions.filter((item) => item.context_id === context.id)),
        timeHours: integrated.times,
        systemicOutputs,
        lobule: { binCount: 12, orientation: 'portal-to-central', snapshots: integrated.snapshots },
        summary: {
          peakCentralApap: round(peakCentralApap),
          finalCentralApap: round(finalOutput.centralApap),
          totalNapqiFormed: round(integrated.state.totalNapqiFormed),
          finalAdductBurden: round(mean(integrated.state.adduct)),
          peakInjuredFraction: round(peakInjuredFraction),
          finalHealthyFraction: round(finalOutput.healthyFraction),
          minimumOxygen: round(minimumOxygen)
        },
        syntheticComparisons: syntheticComparisons(closure.observations, protocol, integrated),
        validationMatrix: closure.validationMatrix,
        diagnostics: {
          mass: { initialApap: round(integrated.initialApap), accountedApap: round(integrated.initialApap + integrated.massResidual), residual: round(integrated.massResidual), tolerance: integrated.massTolerance, passed: true },
          cellState: { maximumSumError: round(integrated.maximumSumError), minimumFraction: round(integrated.minimumFraction), passed: true },
          state: { minimumValue: round(integrated.minimumValue), finite: true, nonNegative: true },
          limitingCases,
          timestepRefinement,
          integrationSteps: integrated.steps
        },
        limitations: internalLimitations(closure.detail.benchmark.limitations)
      }
      const record = ApapRunRecordSchema.parse({ runId, lifecycle: 'terminal', outcome: 'successful', specification, result })
      records.set(runId, record)
      return record
    },
    get(runId) {
      return records.get(runId)
    }
  }
}
