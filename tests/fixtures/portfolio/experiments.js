export function benchmarkExperiment(model, overrides = {}) {
  const controls = model.engine.type === 'ode'
    ? { method: 'dormand-prince-5-4', timeUnit: 'second', duration: 10, outputInterval: 1, fixedStep: 0.1, absoluteTolerance: 1e-10, relativeTolerance: 1e-8, maxInternalSteps: 100000 }
    : model.engine.type === 'ssa'
      ? { method: 'gillespie-direct', timeUnit: 'second', duration: 10, outputInterval: 1, replicates: 1000, maxEventsPerReplicate: 100000 }
      : { method: 'two-phase-simplex', feasibilityTolerance: 1e-8, maxIterations: 10000 }
  const effectiveControls = { ...controls, ...overrides.controls }
  return {
    contractVersion: '2.0.0',
    modelId: model.id,
    modelDigest: model.digest,
    knowledgeRelease: model.knowledgeRelease,
    engine: { ...model.engine, algorithm: effectiveControls.method, algorithmVersion: '1.0.0' },
    seed: overrides.seed ?? 123456789,
    assumptions: ['Benchmark registry values are used without substitution.'],
    limitations: ['This conformance experiment is not a physiological prediction.'],
    interventions: [],
    controls: effectiveControls
  }
}
