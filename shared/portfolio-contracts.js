import { z } from 'zod'
import { Sha256DigestSchema, SemverSchema, ShortIdentifierSchema, FiniteNumberSchema, NonNegativeIntSchema, PositiveIntSchema, NonEmptyStringSchema } from './commons/schemas.js'

export const PORTFOLIO_CONTRACT_VERSION = '2.0.0'
export const PORTFOLIO_MAX_ARCHIVE_BYTES = 2_000_000
export const PORTFOLIO_ARCHIVE_BASE64_MAX_LENGTH = Math.ceil(PORTFOLIO_MAX_ARCHIVE_BYTES / 3) * 4
export const PORTFOLIO_ARCHIVE_REQUEST_BODY_LIMIT = PORTFOLIO_ARCHIVE_BASE64_MAX_LENGTH + 64
export const Sha256Schema = Sha256DigestSchema


export const DimensionSchema = z.object({
  amount: z.number().int().min(-4).max(4),
  mass: z.number().int().min(-4).max(4),
  length: z.number().int().min(-4).max(4),
  time: z.number().int().min(-4).max(4),
  temperature: z.number().int().min(-4).max(4),
  current: z.number().int().min(-4).max(4),
  luminosity: z.number().int().min(-4).max(4)
}).strict()

export const UnitSchema = z.object({
  id: ShortIdentifierSchema,
  symbol: NonEmptyStringSchema.max(32),
  scaleToSI: z.number().positive().finite(),
  dimension: DimensionSchema
}).strict()

const EngineSchema = z.object({
  type: z.enum(['ode', 'ssa', 'fba']),
  id: ShortIdentifierSchema,
  version: SemverSchema,
  algorithm: ShortIdentifierSchema,
  algorithmVersion: SemverSchema
}).strict()

const ReleaseReferenceSchema = z.object({
  id: NonEmptyStringSchema.max(160),
  digest: Sha256Schema
}).strict()

const SpeciesSchema = z.object({
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  initial: FiniteNumberSchema.nonnegative(),
  unit: UnitSchema
}).strict()

const ParameterSchema = z.object({
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  value: FiniteNumberSchema.nonnegative(),
  unit: UnitSchema,
  evidence: z.array(NonEmptyStringSchema.max(500)).max(20)
}).strict()

const ReactionSchema = z.object({
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  reactant: ShortIdentifierSchema,
  products: z.array(z.object({ speciesId: ShortIdentifierSchema, stoichiometry: PositiveIntSchema.max(16) }).strict()).min(1).max(16),
  rateConstantId: ShortIdentifierSchema
}).strict()

const DynamicDefinitionSchema = z.object({
  species: z.array(SpeciesSchema).min(1).max(64),
  parameters: z.array(ParameterSchema).min(1).max(128),
  reactions: z.array(ReactionSchema).min(1).max(128)
}).strict()

const FluxUnitSchema = UnitSchema
const FbaReactionSchema = z.object({
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  stoichiometry: z.record(ShortIdentifierSchema, FiniteNumberSchema).refine((value) => Object.keys(value).length > 0 && Object.values(value).every((coefficient) => coefficient !== 0), 'stoichiometry cannot be empty or contain zero coefficients'),
  lowerBound: FiniteNumberSchema,
  upperBound: FiniteNumberSchema.nullable(),
  unit: FluxUnitSchema
}).strict().refine((reaction) => reaction.upperBound === null || reaction.upperBound >= reaction.lowerBound, {
  message: 'upperBound must be greater than or equal to lowerBound',
  path: ['upperBound']
})

const FbaDefinitionSchema = z.object({
  metabolites: z.array(z.object({ id: ShortIdentifierSchema, name: NonEmptyStringSchema.max(160) }).strict()).min(1).max(32),
  reactions: z.array(FbaReactionSchema).min(1).max(64),
  objective: z.object({ reactionId: ShortIdentifierSchema, direction: z.literal('maximize'), unit: FluxUnitSchema }).strict()
}).strict()

const ObservableSchema = z.object({
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  targetId: ShortIdentifierSchema,
  unit: UnitSchema
}).strict()

const ModelBaseSchema = z.object({
  contractVersion: z.literal(PORTFOLIO_CONTRACT_VERSION),
  id: ShortIdentifierSchema,
  name: NonEmptyStringSchema.max(160),
  version: SemverSchema,
  digest: Sha256Schema,
  knowledgeRelease: ReleaseReferenceSchema,
  engine: EngineSchema,
  assumptions: z.array(NonEmptyStringSchema.max(1000)).min(1).max(50),
  limitations: z.array(NonEmptyStringSchema.max(1000)).min(1).max(50),
  observables: z.array(ObservableSchema).min(1).max(64)
})

function sameDimension(left, right) {
  return Object.keys(left).every((key) => left[key] === right[key])
}

function uniqueIds(items) {
  const identifiers = items.map((item) => item.id)
  return new Set(identifiers).size === identifiers.length
}

function sameScale(left, right) {
  return left.scaleToSI === right.scaleToSI
}

const inverseTime = { amount: 0, mass: 0, length: 0, time: -1, temperature: 0, current: 0, luminosity: 0 }

function addDimensionFindings(model, context) {
  if (!uniqueIds(model.observables)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['observables'], message: 'observable identifiers must be unique' })
  if (model.engine.type === 'ode' || model.engine.type === 'ssa') {
    const species = new Map(model.definition.species.map((item) => [item.id, item]))
    const parameters = new Map(model.definition.parameters.map((item) => [item.id, item]))
    const expectedState = model.definition.species[0].unit.dimension
    const expectedStateScale = model.definition.species[0].unit
    const executableIds = [...model.definition.species, ...model.definition.parameters, ...model.definition.reactions].map((item) => item.id)
    if (!uniqueIds(model.definition.species)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'species'], message: 'species identifiers must be unique' })
    if (!uniqueIds(model.definition.parameters)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'parameters'], message: 'parameter identifiers must be unique' })
    if (!uniqueIds(model.definition.reactions)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions'], message: 'reaction identifiers must be unique' })
    if (new Set(executableIds).size !== executableIds.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition'], message: 'species, parameter, and reaction identifiers must be unique in the executable model namespace' })
    for (const [index, item] of model.definition.species.entries()) {
      if (!sameDimension(item.unit.dimension, expectedState)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'species', index, 'unit'], message: 'all dynamic state units must have compatible dimensions' })
      else if (!sameScale(item.unit, expectedStateScale)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'species', index, 'unit', 'scaleToSI'], message: 'all dynamic state values must use one exact execution scale' })
      if (model.engine.type === 'ssa' && !Number.isInteger(item.initial)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'species', index, 'initial'], message: 'SSA initial molecule counts must be integers' })
      if (model.engine.type === 'ssa' && item.unit.scaleToSI !== 1 / 6.02214076e23) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'species', index, 'unit', 'scaleToSI'], message: 'SSA state values must use the exact molecule execution scale' })
    }
    for (const [index, reaction] of model.definition.reactions.entries()) {
      if (!species.has(reaction.reactant) || reaction.products.some((item) => !species.has(item.speciesId))) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index], message: 'reaction species references must exist' })
      const productIds = reaction.products.map((item) => item.speciesId)
      if (new Set(productIds).size !== productIds.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index, 'products'], message: 'reaction product references must be unique' })
      const rate = parameters.get(reaction.rateConstantId)
      if (!rate) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index, 'rateConstantId'], message: 'rate constant reference must exist' })
      else if (!sameDimension(rate.unit.dimension, inverseTime)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'parameters'], message: 'first-order rate constants must have inverse-time dimensions' })
      else if (rate.unit.scaleToSI !== 1) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'parameters'], message: 'first-order rate constants must use inverse seconds because ODE and SSA controls execute in seconds' })
    }
    for (const [index, observable] of model.observables.entries()) {
      const target = species.get(observable.targetId)
      if (!target || !sameDimension(target.unit.dimension, observable.unit.dimension)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['observables', index], message: 'observable units must match their state target dimensions' })
      else if (!sameScale(target.unit, observable.unit)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['observables', index, 'unit', 'scaleToSI'], message: 'observable values must use the exact target execution scale' })
    }
  } else {
    const metabolites = new Set(model.definition.metabolites.map((item) => item.id))
    const reactions = new Map(model.definition.reactions.map((item) => [item.id, item]))
    const expectedFlux = model.definition.reactions[0].unit.dimension
    const expectedFluxScale = model.definition.reactions[0].unit
    if (!uniqueIds(model.definition.metabolites)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'metabolites'], message: 'metabolite identifiers must be unique' })
    if (!uniqueIds(model.definition.reactions)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions'], message: 'reaction identifiers must be unique' })
    const executableIds = [...model.definition.metabolites, ...model.definition.reactions].map((item) => item.id)
    if (new Set(executableIds).size !== executableIds.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition'], message: 'metabolite and reaction identifiers must be unique in the executable model namespace' })
    for (const [index, reaction] of model.definition.reactions.entries()) {
      if (Object.keys(reaction.stoichiometry).some((id) => !metabolites.has(id))) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index, 'stoichiometry'], message: 'stoichiometry may reference only declared metabolites' })
      if (!sameDimension(reaction.unit.dimension, expectedFlux)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index, 'unit'], message: 'all FBA fluxes must have compatible dimensions' })
      else if (!sameScale(reaction.unit, expectedFluxScale)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'reactions', index, 'unit', 'scaleToSI'], message: 'all FBA fluxes must use one exact execution scale' })
    }
    const objective = reactions.get(model.definition.objective.reactionId)
    if (!objective || !sameDimension(model.definition.objective.unit.dimension, objective.unit.dimension)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'objective'], message: 'objective unit and reaction must match a declared flux' })
    else if (!sameScale(objective.unit, model.definition.objective.unit)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['definition', 'objective', 'unit', 'scaleToSI'], message: 'objective values must use the exact reaction execution scale' })
    for (const [index, observable] of model.observables.entries()) {
      const target = reactions.get(observable.targetId)
      if (!target || !sameDimension(target.unit.dimension, observable.unit.dimension)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['observables', index], message: 'observable units must match their flux target dimensions' })
      else if (!sameScale(target.unit, observable.unit)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['observables', index, 'unit', 'scaleToSI'], message: 'observable values must use the exact target execution scale' })
    }
  }
}

const OdeModelSchema = ModelBaseSchema.extend({
  engine: EngineSchema.extend({ type: z.literal('ode') }),
  definition: DynamicDefinitionSchema
}).strict()
const SsaModelSchema = ModelBaseSchema.extend({
  engine: EngineSchema.extend({ type: z.literal('ssa') }),
  definition: DynamicDefinitionSchema
}).strict()
const FbaModelSchema = ModelBaseSchema.extend({
  engine: EngineSchema.extend({ type: z.literal('fba') }),
  definition: FbaDefinitionSchema
}).strict()

export const StrictPortfolioModelSchema = z.union([OdeModelSchema, SsaModelSchema, FbaModelSchema]).superRefine(addDimensionFindings)
export const PortfolioModelSchema = StrictPortfolioModelSchema

const InterventionSchema = z.object({
  targetId: ShortIdentifierSchema,
  time: FiniteNumberSchema.nonnegative(),
  value: FiniteNumberSchema,
  unit: UnitSchema
}).strict()

const ExperimentBaseSchema = z.object({
  contractVersion: z.literal(PORTFOLIO_CONTRACT_VERSION),
  modelId: ShortIdentifierSchema,
  modelDigest: Sha256Schema,
  knowledgeRelease: ReleaseReferenceSchema,
  engine: EngineSchema,
  seed: z.number().int().min(0).max(0xffffffff),
  assumptions: z.array(NonEmptyStringSchema.max(1000)).min(1).max(50),
  limitations: z.array(NonEmptyStringSchema.max(1000)).min(1).max(50),
  interventions: z.array(InterventionSchema).max(16)
})

const OdeControlsSchema = z.object({
  method: z.enum(['rk4', 'dormand-prince-5-4']),
  timeUnit: z.literal('second'),
  duration: z.number().positive().max(100000),
  outputInterval: z.number().positive().max(10000),
  fixedStep: z.number().positive().max(10000),
  absoluteTolerance: z.number().positive().max(1),
  relativeTolerance: z.number().positive().max(1),
  maxInternalSteps: PositiveIntSchema.max(1000000)
}).strict().refine((value) => value.outputInterval <= value.duration, { message: 'outputInterval cannot exceed duration', path: ['outputInterval'] })

const SsaControlsSchema = z.object({
  method: z.literal('gillespie-direct'),
  timeUnit: z.literal('second'),
  duration: z.number().positive().max(100000),
  outputInterval: z.number().positive().max(10000),
  replicates: z.number().int().min(1).max(10000),
  maxEventsPerReplicate: PositiveIntSchema.max(10000000)
}).strict().refine((value) => value.outputInterval <= value.duration, { message: 'outputInterval cannot exceed duration', path: ['outputInterval'] })

const FbaControlsSchema = z.object({
  method: z.literal('two-phase-simplex'),
  feasibilityTolerance: z.number().positive().max(0.01),
  maxIterations: PositiveIntSchema.max(1000000)
}).strict()

export const ExperimentSchema = z.union([
  ExperimentBaseSchema.extend({ engine: EngineSchema.extend({ type: z.literal('ode') }), controls: OdeControlsSchema }).strict(),
  ExperimentBaseSchema.extend({ engine: EngineSchema.extend({ type: z.literal('ssa') }), controls: SsaControlsSchema }).strict(),
  ExperimentBaseSchema.extend({ engine: EngineSchema.extend({ type: z.literal('fba') }), controls: FbaControlsSchema }).strict()
]).superRefine((experiment, context) => {
  const ordered = [...experiment.interventions].sort((left, right) => left.time - right.time || left.targetId.localeCompare(right.targetId))
  if (ordered.some((item, index) => item !== experiment.interventions[index])) context.addIssue({ code: z.ZodIssueCode.custom, path: ['interventions'], message: 'interventions must be ordered by time and targetId' })
  const keys = experiment.interventions.map((item) => `${item.time}:${item.targetId}`)
  if (new Set(keys).size !== keys.length) context.addIssue({ code: z.ZodIssueCode.custom, path: ['interventions'], message: 'an intervention target may be assigned only once at a time' })
  if (experiment.engine.type === 'fba' && experiment.interventions.some((item) => item.time !== 0)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['interventions'], message: 'FBA bound interventions must occur at time zero' })
  if (experiment.engine.type !== 'fba' && experiment.interventions.some((item) => item.time > experiment.controls.duration)) context.addIssue({ code: z.ZodIssueCode.custom, path: ['interventions'], message: 'interventions cannot occur after the experiment duration' })
})

export const RunLifecycleSchema = z.enum(['queued', 'running', 'terminal'])
export const RunOutcomeSchema = z.enum(['successful', 'failed', 'non-converged', 'infeasible', 'unbounded', 'resource-exhausted', 'cancelled'])

const QuantitySeriesSchema = z.object({ id: ShortIdentifierSchema, name: NonEmptyStringSchema, unit: UnitSchema, values: z.array(FiniteNumberSchema).min(1) }).strict()
const OdeDataSchema = z.object({ engine: z.literal('ode'), time: z.array(FiniteNumberSchema).min(1), timeUnit: UnitSchema, trajectories: z.array(QuantitySeriesSchema).min(1) }).strict()
const SsaSummarySchema = z.object({ id: ShortIdentifierSchema, name: NonEmptyStringSchema, unit: UnitSchema, mean: FiniteNumberSchema, variance: FiniteNumberSchema.nonnegative(), minimum: FiniteNumberSchema, median: FiniteNumberSchema, maximum: FiniteNumberSchema }).strict()
const SsaDataSchema = z.object({ engine: z.literal('ssa'), finalTime: FiniteNumberSchema.nonnegative(), timeUnit: UnitSchema, replicates: PositiveIntSchema, summaries: z.array(SsaSummarySchema).min(1), representative: z.array(QuantitySeriesSchema).min(1), sampleTimes: z.array(FiniteNumberSchema).min(1) }).strict()
const FbaDataSchema = z.object({ engine: z.literal('fba'), objective: FiniteNumberSchema, objectiveUnit: UnitSchema, fluxes: z.array(z.object({ id: ShortIdentifierSchema, name: NonEmptyStringSchema, value: FiniteNumberSchema, unit: UnitSchema }).strict()).min(1) }).strict()

export const PortfolioResultSchema = z.object({
  contractVersion: z.literal(PORTFOLIO_CONTRACT_VERSION),
  runId: Sha256Schema,
  lifecycle: z.literal('terminal'),
  outcome: RunOutcomeSchema,
  provenance: z.object({ modelId: ShortIdentifierSchema, modelVersion: SemverSchema, modelDigest: Sha256Schema, knowledgeRelease: ReleaseReferenceSchema, engine: EngineSchema, seed: z.number().int().min(0).max(0xffffffff) }).strict(),
  experiment: ExperimentSchema,
  assumptions: z.array(NonEmptyStringSchema).min(1),
  limitations: z.array(NonEmptyStringSchema).min(1),
  data: z.union([OdeDataSchema, SsaDataSchema, FbaDataSchema]).nullable(),
  diagnostics: z.object({
    algorithm: ShortIdentifierSchema,
    algorithmVersion: SemverSchema,
    iterations: NonNegativeIntSchema,
    residuals: z.record(FiniteNumberSchema),
    deterministic: z.boolean(),
    warnings: z.array(z.string())
  }).strict(),
  failure: z.object({ code: ShortIdentifierSchema, message: NonEmptyStringSchema }).strict().nullable()
}).strict().superRefine((result, context) => {
  if (result.outcome === 'successful' && result.data === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ['data'], message: 'successful results require data' })
  if (result.outcome !== 'successful' && result.failure === null) context.addIssue({ code: z.ZodIssueCode.custom, path: ['failure'], message: 'non-success outcomes require a failure finding' })
})

export const RunRecordSchema = z.object({
  runId: Sha256Schema,
  lifecycle: RunLifecycleSchema,
  outcome: RunOutcomeSchema.nullable(),
  result: PortfolioResultSchema.nullable()
}).strict()

export const ArchiveValidationRequestSchema = z.object({ archiveBase64: NonEmptyStringSchema.max(PORTFOLIO_ARCHIVE_BASE64_MAX_LENGTH).regex(/^[A-Za-z0-9+/]+={0,2}$/) }).strict()
export const ArchiveValidationResponseSchema = z.object({
  valid: z.boolean(),
  profile: z.literal('portfolio-combine-1.0'),
  findings: z.array(z.object({ code: ShortIdentifierSchema, path: z.string(), message: z.string() }).strict()),
  model: StrictPortfolioModelSchema.nullable(),
  experiment: ExperimentSchema.nullable()
}).strict()

export function dimensionsEqual(left, right) {
  return sameDimension(DimensionSchema.parse(left), DimensionSchema.parse(right))
}
