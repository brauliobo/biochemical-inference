// Builds the experiment request the portfolio API accepts (contract 2.0.0) from
// a registry model and the few controls a workbench exposes. Everything a
// workbench does not expose is fixed here, once.
const METHODS = { ode: 'dormand-prince-5-4', ssa: 'gillespie-direct', fba: 'two-phase-simplex' }

export const defaultMethod = (engineType) => METHODS[engineType]

// Controls for the model's engine ('ode' | 'ssa' | 'fba').
//   method (ode only), duration, outputInterval, fixedStep (ode), replicates (ssa)
function portfolioControls(engineType, { method = METHODS.ode, duration, outputInterval = 1, fixedStep = 0.1, replicates = 128 } = {}) {
  if (engineType === 'ode') {
    return { method, timeUnit: 'second', duration, outputInterval, fixedStep, absoluteTolerance: 1e-9, relativeTolerance: 1e-7, maxInternalSteps: 100000 }
  }
  if (engineType === 'ssa') {
    return { method: METHODS.ssa, timeUnit: 'second', duration, outputInterval, replicates, maxEventsPerReplicate: 100000 }
  }
  return { method: METHODS.fba, feasibilityTolerance: 1e-8, maxIterations: 10000 }
}

export function portfolioExperiment(model, { seed, interventions = [], assumptions, limitations, ...controlOptions }) {
  const controls = portfolioControls(model.engine.type, controlOptions)
  return {
    contractVersion: '2.0.0',
    modelId: model.id,
    modelDigest: model.digest,
    knowledgeRelease: model.knowledgeRelease,
    engine: { ...model.engine, algorithm: controls.method, algorithmVersion: '1.0.0' },
    seed,
    assumptions,
    limitations,
    interventions,
    controls
  }
}
