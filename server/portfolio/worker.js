import { ExperimentSchema, PortfolioModelSchema } from '../../shared/portfolio-contracts.js'
import { runFba } from './engines/fba.js'
import { runOde } from './engines/ode.js'
import { runSsa } from './engines/ssa.js'
import { runIdentity } from './identity.js'
import { terminalResult } from './execution.js'

process.once('message', (raw) => {
  let model
  let experiment
  let runId
  try {
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > 1_000_000) throw new Error('Worker request must be bounded JSON text')
    const message = JSON.parse(raw)
    if (message.type !== 'run' || Object.keys(message).sort().join(',') !== 'experiment,model,runId,type') throw new Error('Worker request protocol is invalid')
    model = PortfolioModelSchema.parse(message.model)
    experiment = ExperimentSchema.parse(message.experiment)
    runId = runIdentity(model, experiment)
    if (runId !== message.runId) throw new Error('Worker request run identity is invalid')
    const execution = model.engine.type === 'ode' ? runOde(model, experiment) : model.engine.type === 'ssa' ? runSsa(model, experiment) : runFba(model, experiment)
    process.send?.(JSON.stringify({ type: 'result', result: terminalResult(model, experiment, runId, execution) }), () => process.disconnect())
  } catch (error) {
    if (model && experiment && runId) {
      const execution = { outcome: 'failed', data: null, iterations: 0, residuals: {}, warnings: [], failure: { code: 'worker_execution', message: error instanceof Error ? error.message : 'Worker execution failed.' } }
      process.send?.(JSON.stringify({ type: 'result', result: terminalResult(model, experiment, runId, execution) }), () => process.disconnect())
    } else {
      process.send?.(JSON.stringify({ type: 'protocol_error', message: error instanceof Error ? error.message : 'Worker protocol failed.' }), () => process.disconnect())
    }
  }
})
