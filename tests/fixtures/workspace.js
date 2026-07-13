import { ODE_MODEL } from '../../server/portfolio/registry.js'
import { benchmarkExperiment } from './portfolio/experiments.js'

export function workspaceSpecification(options = {}) {
  const model = options.model ?? ODE_MODEL
  const experiment = benchmarkExperiment(model, options.experiment ?? {})
  const entries = options.entries ?? [{ id: 'primary', label: 'Primary specification', model, experiment: { ...experiment, interventions: options.interventions ?? experiment.interventions } }]
  return {
    contractVersion: '1.0.0',
    design: options.design ?? { type: 'single' },
    context: { taxonId: options.taxonId ?? 'NCBITaxon:9606', tissueId: options.tissueId ?? null },
    entries,
    numericalContract: options.numericalContract ?? { kind: 'exact' },
    tags: options.tags ?? ['test']
  }
}
