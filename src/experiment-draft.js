// The experiment form as plain data, and its translation to and from the
// immutable specification the workspace stores.
import { portfolioExperiment } from './portfolio-experiment.js'

export const exactModelKey = (model) => `${model.id}|${model.digest}`

export const newDraft = () => ({
  name: 'Controlled first-order experiment',
  description: 'Local, digest-pinned portfolio experiment.',
  modelKey: '',
  resourceProfileId: 'local-default',
  taxonId: 'NCBITaxon:9606',
  tissueId: '',
  duration: 10,
  seed: 20260713,
  design: 'single',
  ensembleMembers: 3,
  interventionTarget: '',
  interventionTime: 5,
  interventionValue: 5,
  numericalKind: 'exact',
  absoluteTolerance: 1e-9,
  relativeTolerance: 1e-7
})

const DESIGNS = ['single', 'ensemble', 'intervention-schedule']

// What a model lets the form assign: reactions for FBA, species and parameters otherwise.
export function interventionTargets(model) {
  if (!model) return []
  const items = model.engine.type === 'fba' ? model.definition.reactions : [...model.definition.species, ...model.definition.parameters]
  return items.map((item) => ({ id: item.id, unit: item.unit }))
}

export function buildSpecification(draft, model) {
  const target = interventionTargets(model).find((item) => item.id === draft.interventionTarget)
  const interventions = draft.design === 'intervention-schedule' && target
    ? [{ targetId: target.id, time: model.engine.type === 'fba' ? 0 : draft.interventionTime, value: draft.interventionValue, unit: target.unit }]
    : []
  const count = draft.design === 'ensemble' ? draft.ensembleMembers : 1
  const entries = Array.from({ length: count }, (_, index) => ({
    id: count === 1 ? 'primary' : `member_${index + 1}`,
    label: count === 1 ? 'Primary specification' : `Ensemble member ${index + 1}`,
    model,
    experiment: portfolioExperiment(model, {
      seed: (draft.seed + index) >>> 0,
      interventions,
      duration: draft.duration,
      assumptions: ['Registry values are used without substitution unless the immutable revision declares a portfolio variant.'],
      limitations: ['Workspace execution is a bounded numerical experiment, not a physiological or clinical prediction.']
    })
  }))
  return {
    contractVersion: '1.0.0',
    design: draft.design === 'ensemble' ? { type: 'ensemble', members: count } : { type: draft.design },
    context: { taxonId: draft.taxonId, tissueId: draft.tissueId || null },
    entries,
    numericalContract: draft.numericalKind === 'exact' ? { kind: 'exact' } : { kind: 'tolerance', absolute: draft.absoluteTolerance, relative: draft.relativeTolerance },
    tags: ['workspace']
  }
}

// The form fields a stored revision implies (the rest keep their values).
export function draftFromRevision(revision) {
  const { specification: spec } = revision
  const [first] = spec.entries
  const intervention = first.experiment.interventions[0]
  const tolerance = spec.numericalContract.kind === 'tolerance'
  return {
    modelKey: exactModelKey(first.model),
    taxonId: spec.context.taxonId,
    tissueId: spec.context.tissueId ?? '',
    design: DESIGNS.includes(spec.design.type) ? spec.design.type : 'single',
    ensembleMembers: spec.entries.length,
    seed: first.experiment.seed,
    duration: first.experiment.controls.duration ?? 10,
    numericalKind: spec.numericalContract.kind,
    ...(tolerance ? { absoluteTolerance: spec.numericalContract.absolute, relativeTolerance: spec.numericalContract.relative } : {}),
    ...(intervention ? { interventionTarget: intervention.targetId, interventionTime: intervention.time, interventionValue: intervention.value } : {})
  }
}
