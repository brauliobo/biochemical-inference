import { createHash } from 'node:crypto'
import { METABOLITE_IDS, REACTION_IDS } from '../shared/identifiers.js'
import { MODEL } from './model.js'

const metaboliteIds = Object.values(METABOLITE_IDS)

const initial = {
  [METABOLITE_IDS.methyleneThf]: 8,
  [METABOLITE_IDS.methylThf]: 6,
  [METABOLITE_IDS.methionine]: 30,
  [METABOLITE_IDS.sam]: 12,
  [METABOLITE_IDS.sah]: 4,
  [METABOLITE_IDS.homocysteine]: 8
}

function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

function fluxes(state, activity) {
  return {
    [REACTION_IDS.mthfr]: 0.075 * activity * state[METABOLITE_IDS.methyleneThf],
    [REACTION_IDS.remethylation]: 0.007 * state[METABOLITE_IDS.homocysteine] * state[METABOLITE_IDS.methylThf],
    [REACTION_IDS.mat]: 0.032 * state[METABOLITE_IDS.methionine],
    [REACTION_IDS.methylation]: 0.075 * state[METABOLITE_IDS.sam],
    [REACTION_IDS.sahHydrolase]: 0.11 * state[METABOLITE_IDS.sah],
    [REACTION_IDS.homocysteineClearance]: 0.022 * state[METABOLITE_IDS.homocysteine],
    [REACTION_IDS.methionineInput]: 0.42,
    [REACTION_IDS.homocysteineInput]: 0.12
  }
}

function derivative(state, activity) {
  const v = fluxes(state, activity)
  return {
    [METABOLITE_IDS.methyleneThf]: -v[REACTION_IDS.mthfr] + v[REACTION_IDS.remethylation],
    [METABOLITE_IDS.methylThf]: v[REACTION_IDS.mthfr] - v[REACTION_IDS.remethylation],
    [METABOLITE_IDS.methionine]: v[REACTION_IDS.remethylation] - v[REACTION_IDS.mat] + v[REACTION_IDS.methionineInput],
    [METABOLITE_IDS.sam]: v[REACTION_IDS.mat] - v[REACTION_IDS.methylation],
    [METABOLITE_IDS.sah]: v[REACTION_IDS.methylation] - v[REACTION_IDS.sahHydrolase],
    [METABOLITE_IDS.homocysteine]: v[REACTION_IDS.sahHydrolase] - v[REACTION_IDS.remethylation] - v[REACTION_IDS.homocysteineClearance] + v[REACTION_IDS.homocysteineInput]
  }
}

export class SimulationNumericalError extends Error {
  constructor(message) {
    super(message)
    this.name = 'SimulationNumericalError'
  }
}

function assertValidState(state, stage) {
  for (const id of metaboliteIds) {
    if (!Number.isFinite(state[id]) || state[id] < 0) {
      throw new SimulationNumericalError(`Invalid ${id} concentration during ${stage}: ${state[id]}`)
    }
  }
  return state
}

function add(state, slope, scale) {
  return assertValidState(Object.fromEntries(metaboliteIds.map((id) => [id, state[id] + slope[id] * scale])), 'RK4 intermediate stage')
}

function rk4(state, dt, activity) {
  const k1 = derivative(state, activity)
  const k2 = derivative(add(state, k1, dt / 2), activity)
  const k3 = derivative(add(state, k2, dt / 2), activity)
  const k4 = derivative(add(state, k3, dt), activity)
  return assertValidState(Object.fromEntries(metaboliteIds.map((id) => [id, state[id] + dt * (k1[id] + 2 * k2[id] + 2 * k3[id] + k4[id]) / 6])), 'RK4 final stage')
}

const round = (value) => Number(value.toFixed(8))

export function simulate(request, release, network) {
  const requestedSteps = request.durationHours / request.stepHours
  const steps = Math.round(requestedSteps)
  if (Math.abs(requestedSteps - steps) > 1e-9) throw new SimulationNumericalError('The requested duration is not an exact multiple of stepHours')
  const effectiveDt = request.stepHours
  let state = assertValidState({ ...initial }, 'initial state')
  let maxDerivative = 0
  const times = [0]
  const concentrationValues = Object.fromEntries(metaboliteIds.map((id) => [id, [state[id]]]))
  const fluxIds = Object.keys(fluxes(state, request.mthfrActivity))
  const firstFlux = fluxes(state, request.mthfrActivity)
  const fluxValues = Object.fromEntries(fluxIds.map((id) => [id, [firstFlux[id]]]))

  for (let step = 1; step <= steps; step += 1) {
    const slope = derivative(state, request.mthfrActivity)
    maxDerivative = Math.max(maxDerivative, ...metaboliteIds.map((id) => Math.abs(slope[id])))
    state = rk4(state, effectiveDt, request.mthfrActivity)
    times.push(round(step * effectiveDt))
    const currentFlux = fluxes(state, request.mthfrActivity)
    metaboliteIds.forEach((id) => concentrationValues[id].push(round(state[id])))
    fluxIds.forEach((id) => fluxValues[id].push(round(currentFlux[id])))
  }

  const startRatio = initial[METABOLITE_IDS.sam] / initial[METABOLITE_IDS.sah]
  const finalRatio = state[METABOLITE_IDS.sam] / state[METABOLITE_IDS.sah]
  const identityInput = {
    release: { id: release.id, digest: release.digest },
    modelVersion: MODEL.version,
    engineVersion: MODEL.engineVersion,
    taxonId: request.taxonId,
    preset: request.preset,
    mthfrActivity: request.mthfrActivity,
    durationHours: request.durationHours,
    stepHours: request.stepHours,
    initialConcentrations: initial
  }
  const runId = `sha256:${createHash('sha256').update(canonicalize(identityInput)).digest('hex')}`
  const names = {
    [METABOLITE_IDS.methyleneThf]: '5,10-Methylene-THF',
    [METABOLITE_IDS.methylThf]: '5-Methyl-THF',
    [METABOLITE_IDS.methionine]: 'Methionine',
    [METABOLITE_IDS.sam]: 'SAM',
    [METABOLITE_IDS.sah]: 'SAH',
    [METABOLITE_IDS.homocysteine]: 'Homocysteine',
    [REACTION_IDS.mthfr]: 'MTHFR flux',
    [REACTION_IDS.remethylation]: 'Remethylation flux',
    [REACTION_IDS.mat]: 'SAM synthesis flux',
    [REACTION_IDS.methylation]: 'Methylation flux',
    [REACTION_IDS.sahHydrolase]: 'SAH hydrolysis flux',
    [REACTION_IDS.homocysteineClearance]: 'Homocysteine clearance flux',
    [REACTION_IDS.methionineInput]: 'Methionine boundary input',
    [REACTION_IDS.homocysteineInput]: 'Homocysteine boundary input'
  }
  const totalStart = Object.values(initial).reduce((sum, value) => sum + value, 0)
  const totalEnd = Object.values(state).reduce((sum, value) => sum + value, 0)

  return {
    status: 'successful',
    runId,
    release,
    modelVersion: MODEL.version,
    engineVersion: MODEL.engineVersion,
    taxonId: request.taxonId,
    preset: request.preset,
    effectiveInputs: { mthfrActivity: request.mthfrActivity, durationHours: request.durationHours, stepHours: request.stepHours, initialConcentrations: initial },
    timeHours: times,
    concentrations: metaboliteIds.map((id) => ({ id, name: names[id], unit: MODEL.concentrationUnit, values: concentrationValues[id] })),
    fluxes: fluxIds.map((id) => ({ id, name: names[id], unit: MODEL.fluxUnit, values: fluxValues[id] })),
    summary: {
      finalHomocysteine: round(state[METABOLITE_IDS.homocysteine]),
      finalSamSahRatio: round(finalRatio),
      homocysteineChangePercent: round((state[METABOLITE_IDS.homocysteine] / initial[METABOLITE_IDS.homocysteine] - 1) * 100),
      samSahRatioChangePercent: round((finalRatio / startRatio - 1) * 100)
    },
    diagnostics: {
      method: 'fixed-step RK4',
      integrationSteps: steps,
      integrationStepHours: effectiveDt,
      maxAbsoluteDerivative: round(maxDerivative),
      nonNegative: Object.values(state).every((value) => value >= 0),
      netRepresentedPoolChange: round(totalEnd - totalStart),
      deterministic: true
    },
    warnings: [
      'Model parameters and concentrations are illustrative assumptions.',
      'Boundary inputs and clearance mean the displayed pool is not mass-conserved.'
    ],
    predictionLabel: 'Illustrative model prediction; not measured physiology.',
    proteinAssociations: network.proteins
  }
}
