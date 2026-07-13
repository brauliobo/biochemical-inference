import { fork } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { ExperimentSchema, PortfolioModelSchema, PortfolioResultSchema, RunRecordSchema, dimensionsEqual } from '../../shared/portfolio-contracts.js'
import { runIdentity } from './identity.js'

export class PortfolioRequestError extends Error {
  constructor(code, message, statusCode = 422, findings = []) {
    super(message)
    this.name = 'PortfolioRequestError'
    this.code = code
    this.statusCode = statusCode
    this.findings = findings
  }
}

export function validateExperimentForModel(model, rawExperiment) {
  const experiment = ExperimentSchema.parse(rawExperiment)
  if (experiment.modelId !== model.id || experiment.modelDigest !== model.digest) throw new PortfolioRequestError('model_mismatch', 'Experiment model identity does not match the selected registry model.')
  if (experiment.knowledgeRelease.id !== model.knowledgeRelease.id || experiment.knowledgeRelease.digest !== model.knowledgeRelease.digest) throw new PortfolioRequestError('release_mismatch', 'Experiment knowledge release does not match the model release pin.')
  if (experiment.engine.type !== model.engine.type || experiment.engine.id !== model.engine.id || experiment.engine.version !== model.engine.version) throw new PortfolioRequestError('engine_mismatch', 'Experiment engine does not match the selected model engine.')
  const expectedAlgorithm = experiment.engine.type === 'ode' ? experiment.controls.method : experiment.controls.method
  if (experiment.engine.algorithm !== expectedAlgorithm || experiment.engine.algorithmVersion !== '1.0.0') throw new PortfolioRequestError('algorithm_mismatch', 'Experiment algorithm pin does not match its numerical controls.')
  if (experiment.interventions.length > 0) {
    const targets = model.engine.type === 'fba'
      ? new Map(model.definition.reactions.map((item) => [item.id, item.unit]))
      : new Map([...model.definition.species.map((item) => [item.id, item.unit]), ...model.definition.parameters.map((item) => [item.id, item.unit])])
    for (const intervention of experiment.interventions) {
      const unit = targets.get(intervention.targetId)
      if (!unit || !dimensionsEqual(unit.dimension, intervention.unit.dimension) || unit.scaleToSI !== intervention.unit.scaleToSI) throw new PortfolioRequestError('intervention_unit_mismatch', `Intervention ${intervention.targetId} must use the target's exact execution unit scale.`)
      if (intervention.value < 0) throw new PortfolioRequestError('intervention_value_invalid', `Intervention ${intervention.targetId} must assign a non-negative value.`)
      if (model.engine.type === 'ssa' && model.definition.species.some((item) => item.id === intervention.targetId) && !Number.isInteger(intervention.value)) throw new PortfolioRequestError('intervention_value_invalid', `SSA state intervention ${intervention.targetId} must assign an integer molecule count.`)
      if (model.engine.type === 'fba') {
        const reaction = model.definition.reactions.find((item) => item.id === intervention.targetId)
        if (reaction && intervention.value < reaction.lowerBound) throw new PortfolioRequestError('intervention_value_invalid', `FBA upper-bound intervention ${intervention.targetId} cannot be below its lower bound.`)
      }
    }
  }
  return experiment
}

export function terminalResult(model, experiment, runId, execution) {
  return PortfolioResultSchema.parse({
    contractVersion: '2.0.0',
    runId,
    lifecycle: 'terminal',
    outcome: execution.outcome,
    provenance: {
      modelId: model.id,
      modelVersion: model.version,
      modelDigest: model.digest,
      knowledgeRelease: model.knowledgeRelease,
      engine: experiment.engine,
      seed: experiment.seed
    },
    experiment,
    assumptions: [...model.assumptions, ...experiment.assumptions],
    limitations: [...model.limitations, ...experiment.limitations],
    data: execution.data,
    diagnostics: {
      algorithm: experiment.engine.algorithm,
      algorithmVersion: experiment.engine.algorithmVersion,
      iterations: execution.iterations,
      residuals: execution.residuals,
      deterministic: true,
      warnings: execution.warnings
    },
    failure: execution.failure
  })
}

function boundedFailure(model, experiment, runId, outcome, code, message) {
  return terminalResult(model, experiment, runId, { outcome, data: null, iterations: 0, residuals: {}, warnings: [], failure: { code, message } })
}

export function executeInWorker(model, experiment, options = {}) {
  const timeoutMs = options.timeoutMs ?? 10_000
  const maxOutputBytes = options.maxOutputBytes ?? 2_000_000
  const memoryMb = options.memoryMb ?? 96
  const runId = runIdentity(model, experiment)
  const workerPath = process.env.VITEST ? resolve(process.cwd(), 'server/portfolio/worker.js') : fileURLToPath(new URL('./worker.js', import.meta.url))
  const child = fork(workerPath, [], {
    execArgv: [`--max-old-space-size=${memoryMb}`],
    stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
    serialization: 'json',
    env: { NODE_ENV: 'production' }
  })
  let settled = false
  let resolvePromise
  const promise = new Promise((resolve) => { resolvePromise = resolve })
  const finish = (result) => {
    if (settled) return
    settled = true
    clearTimeout(timer)
    if (child.connected) child.disconnect()
    resolvePromise(result)
  }
  const timer = setTimeout(() => {
    child.kill('SIGKILL')
    finish(boundedFailure(model, experiment, runId, 'resource-exhausted', 'wall_time_limit', `Worker exceeded the ${timeoutMs} ms wall-time limit.`))
  }, timeoutMs)

  child.on('message', (raw) => {
    try {
      if (typeof raw !== 'string' || Buffer.byteLength(raw) > maxOutputBytes) {
        child.kill('SIGKILL')
        return finish(boundedFailure(model, experiment, runId, 'resource-exhausted', 'output_limit', `Worker output exceeded ${maxOutputBytes} bytes.`))
      }
      const message = JSON.parse(raw)
      if (message.type !== 'result') return
      const result = PortfolioResultSchema.parse(message.result)
      if (result.runId !== runId) throw new Error('Worker returned a mismatched run identity')
      finish(result)
    } catch (error) {
      child.kill('SIGKILL')
      finish(boundedFailure(model, experiment, runId, 'failed', 'invalid_worker_output', error instanceof Error ? error.message : 'Worker output validation failed.'))
    }
  })
  child.on('error', (error) => finish(boundedFailure(model, experiment, runId, 'failed', 'worker_error', error.message)))
  child.on('exit', (code, signal) => {
    if (!settled) {
      const exhausted = signal !== null || code === 134 || code === 137
      finish(boundedFailure(model, experiment, runId, exhausted ? 'resource-exhausted' : 'failed', exhausted ? 'worker_resource_limit' : 'worker_exit', `Worker exited before returning a result (${signal ?? code}).`))
    }
  })
  const request = JSON.stringify({ type: 'run', model, experiment, runId })
  if (Buffer.byteLength(request) > 1_000_000) throw new PortfolioRequestError('input_limit', 'Validated worker input exceeds 1 MB.', 413)
  child.send(request)

  return {
    runId,
    promise,
    cancel() {
      if (settled) return false
      child.kill('SIGTERM')
      finish(boundedFailure(model, experiment, runId, 'cancelled', 'cancelled_by_request', 'Execution was cancelled before terminal completion.'))
      return true
    },
    interrupt() {
      if (settled) return false
      child.kill('SIGTERM')
      finish(boundedFailure(model, experiment, runId, 'failed', 'server_shutdown', 'Execution was interrupted by server shutdown before terminal completion.'))
      return true
    }
  }
}

export function createRunService(options = {}) {
  const records = new Map()
  const active = new Map()
  return {
    async create(model, rawExperiment) {
      PortfolioModelSchema.parse(model)
      const experiment = validateExperimentForModel(model, rawExperiment)
      const runId = runIdentity(model, experiment)
      const existing = records.get(runId)
      if (existing?.result) return existing
      records.set(runId, RunRecordSchema.parse({ runId, lifecycle: 'queued', outcome: null, result: null }))
      const execution = executeInWorker(model, experiment, options)
      active.set(runId, execution)
      records.set(runId, RunRecordSchema.parse({ runId, lifecycle: 'running', outcome: null, result: null }))
      const result = await execution.promise
      active.delete(runId)
      const record = RunRecordSchema.parse({ runId, lifecycle: 'terminal', outcome: result.outcome, result })
      records.set(runId, record)
      return record
    },
    get(runId) {
      return records.get(runId)
    },
    cancel(runId) {
      const execution = active.get(runId)
      return execution?.cancel() ?? false
    }
  }
}
