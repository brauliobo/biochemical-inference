import { digest } from '../portfolio/identity.js'
import {
  APAP_ENGINE_VERSION,
  APAP_EQUATION_SET_ID,
  APAP_MODEL_VERSION
} from '../../shared/apap-contracts.js'

export const LOBULE_BINS = 12
export const NAC_AFFECTED_TERMS = Object.freeze(['nac', 'gsh'])

export const APAP_EQUATIONS = Object.freeze({
  exposure: 'dG/dt=-ka*G; dC/dt=ka*G-kel*C-q*C+q*A[11]; dA[i]/dt=q*upstream-q*A[i]-vCYP[i]+D_A*lap(A)[i]',
  metabolism: 'vCYP[i]=kCYP*z[i]*A[i]; vGSH[i]=kGSH*N[i]*GSH[i]; vBind[i]=kBind*N[i]',
  napqi: 'dN[i]/dt=vCYP[i]-vGSH[i]-vBind[i]+D_N*lap(N)[i]',
  glutathione: 'dGSH[i]/dt=kGSyn*(GSHcap-GSH[i])+kNAC*NAC*(GSHcap-GSH[i])-vGSH[i]',
  adduct: 'dB[i]/dt=vBind[i]-kRepair*B[i]; dRepaired[i]/dt=kRepair*B[i]',
  oxygen: 'dO[i]/dt=supply[i]-kO2*O[i]*viable[i]-o2Cost*vCYP[i]+D_O*lap(O)[i]',
  cells: 'H->S and S->I depend only on adduct burden; S->R, I->R, and R->H are conservative recovery transitions',
  nac: 'dNAC/dt=-kNACel*NAC; NAC enters no equation except dNAC and the explicit GSH synthesis term'
})

export const APAP_EQUATION_SET_DIGEST = digest({
  id: APAP_EQUATION_SET_ID,
  version: APAP_MODEL_VERSION,
  engine: APAP_ENGINE_VERSION,
  bins: LOBULE_BINS,
  equations: APAP_EQUATIONS,
  nacAffectedTerms: NAC_AFFECTED_TERMS
})

const INTERNAL_STATEMENT = 'Internal illustrative assumption introduced by biochemical-inference; unsupported and not measured biology.'

const bindingValues = {
  'CONTEXT:APAP-HUMAN-LIVER': {
    initialApap: 20,
    absorptionRate: 0.8,
    eliminationRate: 0.2,
    perfusionRate: 0.32,
    cypRate: 0.025,
    detoxRate: 0.11,
    bindingRate: 0.018,
    adductRepairRate: 0.025,
    gshCapacity: 1,
    gshSynthesisRate: 0.075,
    nacDose: 1.5,
    nacEliminationRate: 0.22,
    nacGshRate: 0.16,
    apapExchange: 0.07,
    napqiExchange: 0.045,
    oxygenSupplyPortal: 0.19,
    oxygenSupplyCentral: 0.12,
    oxygenConsumption: 0.15,
    oxygenMetabolismCost: 0.035,
    oxygenExchange: 0.24,
    stressRate: 0.055,
    injuryRate: 0.045,
    stressedRecoveryRate: 0.025,
    injuredRecoveryRate: 0.008,
    recoveringHealthyRate: 0.018,
    zonationAmplitude: 0.65
  },
  'CONTEXT:APAP-MOUSE-LIVER': {
    initialApap: 30,
    absorptionRate: 1.15,
    eliminationRate: 0.28,
    perfusionRate: 0.42,
    cypRate: 0.04,
    detoxRate: 0.095,
    bindingRate: 0.022,
    adductRepairRate: 0.022,
    gshCapacity: 0.9,
    gshSynthesisRate: 0.065,
    nacDose: 1.5,
    nacEliminationRate: 0.25,
    nacGshRate: 0.15,
    apapExchange: 0.075,
    napqiExchange: 0.05,
    oxygenSupplyPortal: 0.2,
    oxygenSupplyCentral: 0.11,
    oxygenConsumption: 0.16,
    oxygenMetabolismCost: 0.04,
    oxygenExchange: 0.26,
    stressRate: 0.065,
    injuryRate: 0.055,
    stressedRecoveryRate: 0.022,
    injuredRecoveryRate: 0.007,
    recoveringHealthyRate: 0.016,
    zonationAmplitude: 0.8
  }
}

const upstreamSources = {
  'CONTEXT:APAP-HUMAN-LIVER': {
    initialApap: ['PARAMETER:APAP-HUMAN-DOSE', 'ASSUMPTION:APAP-HUMAN-DOSE', '1000 mg / 50 L is bound as 20 model units.'],
    eliminationRate: ['PARAMETER:APAP-HUMAN-ELIMINATION', 'ASSUMPTION:APAP-HUMAN-ELIMINATION', 'The upstream illustrative 0.2 h^-1 value is used exactly.']
  },
  'CONTEXT:APAP-MOUSE-LIVER': {
    initialApap: ['PARAMETER:APAP-MOUSE-DOSE', 'ASSUMPTION:APAP-MOUSE-DOSE', 'The upstream illustrative 300 mg/kg challenge is bound through an explicit 10 mg/kg per model-unit scale.']
  }
}

const units = {
  initialApap: 'model-unit',
  gshCapacity: 'model-unit',
  nacDose: 'model-unit',
  absorptionRate: 'h^-1',
  eliminationRate: 'h^-1',
  perfusionRate: 'h^-1',
  cypRate: 'h^-1',
  detoxRate: 'h^-1',
  bindingRate: 'h^-1',
  adductRepairRate: 'h^-1',
  gshSynthesisRate: 'h^-1',
  nacEliminationRate: 'h^-1',
  nacGshRate: 'h^-1',
  apapExchange: 'h^-1',
  napqiExchange: 'h^-1',
  oxygenSupplyPortal: 'model-unit/h',
  oxygenSupplyCentral: 'model-unit/h',
  oxygenConsumption: 'h^-1',
  oxygenMetabolismCost: '1',
  oxygenExchange: 'h^-1',
  stressRate: 'h^-1',
  injuryRate: 'h^-1',
  stressedRecoveryRate: 'h^-1',
  injuredRecoveryRate: 'h^-1',
  recoveringHealthyRate: 'h^-1',
  zonationAmplitude: '1'
}

export class ApapNumericalError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApapNumericalError'
    this.statusCode = 422
    this.code = 'APAP_INVALID_NUMERICAL_STATE'
  }
}

function parameterId(symbol) {
  return `PARAMETER:APAP-INTERNAL-${symbol.replace(/[A-Z]/g, (letter) => `-${letter}`).toUpperCase()}`
}

function assumptionId(symbol) {
  return parameterId(symbol).replace('PARAMETER:', 'ASSUMPTION:')
}

export function resolveContextBinding(contextId, mechanismScales = { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 }) {
  const source = bindingValues[contextId]
  if (!source) throw new ApapNumericalError(`No explicit APAP parameter binding exists for ${contextId}`)
  const values = {
    ...source,
    cypRate: source.cypRate * mechanismScales.cypActivity,
    bindingRate: source.bindingRate * mechanismScales.adductBinding,
    zonationAmplitude: source.zonationAmplitude * mechanismScales.zonation,
    nacGshRate: source.nacGshRate * mechanismScales.nacGsh
  }
  const effectiveParameters = Object.entries(values).map(([symbol, value]) => {
    const upstream = upstreamSources[contextId][symbol]
    return {
      id: upstream?.[0] ?? parameterId(symbol),
      symbol,
      value,
      unit: units[symbol],
      contextId,
      origin: upstream ? 'upstream-illustrative-assumption' : 'internal-illustrative-assumption',
      sourceId: upstream?.[0] ?? 'biochemical-inference/apap-equation-set-1.0.0',
      assumptionId: upstream?.[1] ?? assumptionId(symbol),
      statement: upstream?.[2] ?? INTERNAL_STATEMENT
    }
  })
  return { contextId, values, effectiveParameters }
}

export function buildZonation(amplitude) {
  return Array.from({ length: LOBULE_BINS }, (_, index) => 1 + amplitude * (index / (LOBULE_BINS - 1) - 0.35))
}

function oxygenSupply(parameters) {
  return Array.from({ length: LOBULE_BINS }, (_, index) => parameters.oxygenSupplyPortal + (parameters.oxygenSupplyCentral - parameters.oxygenSupplyPortal) * index / (LOBULE_BINS - 1))
}

function array(value) {
  return Array.from({ length: LOBULE_BINS }, () => value)
}

function initialState(parameters) {
  const supplies = oxygenSupply(parameters)
  return {
    gut: parameters.initialApap,
    central: 0,
    eliminated: 0,
    nac: 0,
    totalNapqiFormed: 0,
    apap: array(0),
    napqi: array(0),
    gsh: array(parameters.gshCapacity),
    detoxified: array(0),
    adduct: array(0),
    repaired: array(0),
    oxygen: supplies.map((supply) => supply / parameters.oxygenConsumption),
    healthy: array(1),
    stressed: array(0),
    injured: array(0),
    recovering: array(0)
  }
}

function mapState(state, operation) {
  const next = {}
  for (const [key, value] of Object.entries(state)) next[key] = Array.isArray(value) ? value.map((item, index) => operation(item, key, index)) : operation(value, key)
  return next
}

function combine(state, slope, scale) {
  return mapState(state, (value, key, index) => value + (Array.isArray(slope[key]) ? slope[key][index] : slope[key]) * scale)
}

function laplacian(values, index) {
  const left = index === 0 ? values[index] : values[index - 1]
  const right = index === LOBULE_BINS - 1 ? values[index] : values[index + 1]
  return left - 2 * values[index] + right
}

function allValues(state) {
  return Object.values(state).flatMap((value) => Array.isArray(value) ? value : [value])
}

export function assertValidApapState(state, stage) {
  for (const [key, values] of Object.entries(state)) {
    for (const value of Array.isArray(values) ? values : [values]) {
      if (!Number.isFinite(value) || value < 0) throw new ApapNumericalError(`Invalid ${key} state during ${stage}: ${value}`)
    }
  }
  for (let index = 0; index < LOBULE_BINS; index += 1) {
    const total = state.healthy[index] + state.stressed[index] + state.injured[index] + state.recovering[index]
    if (Math.abs(total - 1) > 1e-10) throw new ApapNumericalError(`Cell-state fractions do not sum to one in bin ${index} during ${stage}: ${total}`)
  }
  return state
}

export function apapDerivative(state, parameters) {
  const zonation = buildZonation(parameters.zonationAmplitude)
  const supplies = oxygenSupply(parameters)
  const result = {
    gut: -parameters.absorptionRate * state.gut,
    central: parameters.absorptionRate * state.gut - parameters.eliminationRate * state.central - parameters.perfusionRate * state.central + parameters.perfusionRate * state.apap.at(-1),
    eliminated: parameters.eliminationRate * state.central,
    nac: -parameters.nacEliminationRate * state.nac,
    totalNapqiFormed: 0,
    apap: array(0), napqi: array(0), gsh: array(0), detoxified: array(0), adduct: array(0), repaired: array(0), oxygen: array(0),
    healthy: array(0), stressed: array(0), injured: array(0), recovering: array(0)
  }

  for (let index = 0; index < LOBULE_BINS; index += 1) {
    const upstream = index === 0 ? state.central : state.apap[index - 1]
    const cyp = parameters.cypRate * zonation[index] * state.apap[index]
    const detox = parameters.detoxRate * state.napqi[index] * state.gsh[index]
    const binding = parameters.bindingRate * state.napqi[index]
    const repair = parameters.adductRepairRate * state.adduct[index]
    const viable = state.healthy[index] + state.stressed[index] + state.recovering[index]
    const damageSignal = state.adduct[index] / (0.2 + state.adduct[index])
    const healthyToStressed = parameters.stressRate * damageSignal * state.healthy[index]
    const stressedToInjured = parameters.injuryRate * damageSignal * state.stressed[index]
    const stressedToRecovering = parameters.stressedRecoveryRate * state.stressed[index] / (1 + state.adduct[index])
    const injuredToRecovering = parameters.injuredRecoveryRate * state.injured[index] / (1 + state.adduct[index])
    const recoveringToHealthy = parameters.recoveringHealthyRate * state.recovering[index]

    result.apap[index] = parameters.perfusionRate * (upstream - state.apap[index]) - cyp + parameters.apapExchange * laplacian(state.apap, index)
    result.napqi[index] = cyp - detox - binding + parameters.napqiExchange * laplacian(state.napqi, index)
    result.gsh[index] = parameters.gshSynthesisRate * (parameters.gshCapacity - state.gsh[index]) + parameters.nacGshRate * state.nac * (parameters.gshCapacity - state.gsh[index]) - detox
    result.detoxified[index] = detox
    result.adduct[index] = binding - repair
    result.repaired[index] = repair
    result.oxygen[index] = supplies[index] - parameters.oxygenConsumption * state.oxygen[index] * viable - parameters.oxygenMetabolismCost * cyp + parameters.oxygenExchange * laplacian(state.oxygen, index)
    result.healthy[index] = -healthyToStressed + recoveringToHealthy
    result.stressed[index] = healthyToStressed - stressedToInjured - stressedToRecovering
    result.injured[index] = stressedToInjured - injuredToRecovering
    result.recovering[index] = stressedToRecovering + injuredToRecovering - recoveringToHealthy
    result.totalNapqiFormed += cyp
  }
  return result
}

function rk4(state, dt, parameters) {
  const k1 = apapDerivative(state, parameters)
  const s2 = assertValidApapState(combine(state, k1, dt / 2), 'RK4 stage 2')
  const k2 = apapDerivative(s2, parameters)
  const s3 = assertValidApapState(combine(state, k2, dt / 2), 'RK4 stage 3')
  const k3 = apapDerivative(s3, parameters)
  const s4 = assertValidApapState(combine(state, k3, dt), 'RK4 stage 4')
  const k4 = apapDerivative(s4, parameters)
  const next = mapState(state, (value, key, index) => {
    const a = Array.isArray(k1[key]) ? k1[key][index] : k1[key]
    const b = Array.isArray(k2[key]) ? k2[key][index] : k2[key]
    const c = Array.isArray(k3[key]) ? k3[key][index] : k3[key]
    const d = Array.isArray(k4[key]) ? k4[key][index] : k4[key]
    return value + dt * (a + 2 * b + 2 * c + d) / 6
  })
  return assertValidApapState(next, 'RK4 final state')
}

const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length
const sum = (values) => values.reduce((total, value) => total + value, 0)
const round = (value) => Number(value.toFixed(10))
const rounded = (values) => values.map(round)

function output(state) {
  return {
    gutApap: state.gut,
    centralApap: state.central,
    liverApap: mean(state.apap),
    liverNapqi: mean(state.napqi),
    liverGsh: mean(state.gsh),
    adductBurden: mean(state.adduct),
    injuredFraction: mean(state.injured),
    healthyFraction: mean(state.healthy),
    nac: state.nac
  }
}

function snapshot(state, timeHours) {
  return {
    timeHours: round(timeHours),
    apap: rounded(state.apap), napqi: rounded(state.napqi), gsh: rounded(state.gsh), adduct: rounded(state.adduct), oxygen: rounded(state.oxygen),
    healthy: rounded(state.healthy), stressed: rounded(state.stressed), injured: rounded(state.injured), recovering: rounded(state.recovering)
  }
}

function accountedApap(state) {
  return state.gut + state.central + state.eliminated + sum(state.apap) + sum(state.napqi) + sum(state.detoxified) + sum(state.adduct) + sum(state.repaired)
}

export function integrateApap(parameters, controls) {
  const { durationHours, stepHours, outputEveryHours, nacStartHours } = controls
  const steps = Math.round(durationHours / stepHours)
  const outputStride = Math.round(outputEveryHours / stepHours)
  const nacStep = nacStartHours === null ? null : Math.round(nacStartHours / stepHours)
  let state = assertValidApapState(initialState(parameters), 'initialization')
  const initialApap = accountedApap(state)
  const times = [0]
  const outputs = [output(state)]
  const snapshots = [snapshot(state, 0)]
  let minimumValue = Math.min(...allValues(state))
  let minimumFraction = 1
  let maximumSumError = 0

  for (let step = 1; step <= steps; step += 1) {
    state = rk4(state, stepHours, parameters)
    if (nacStep !== null && step === nacStep) state = assertValidApapState({ ...state, nac: state.nac + parameters.nacDose }, 'NAC intervention event')
    minimumValue = Math.min(minimumValue, ...allValues(state))
    for (let index = 0; index < LOBULE_BINS; index += 1) {
      const fractions = [state.healthy[index], state.stressed[index], state.injured[index], state.recovering[index]]
      minimumFraction = Math.min(minimumFraction, ...fractions)
      maximumSumError = Math.max(maximumSumError, Math.abs(sum(fractions) - 1))
    }
    if (step % outputStride === 0 || step === steps) {
      const time = step * stepHours
      times.push(round(time))
      outputs.push(output(state))
      snapshots.push(snapshot(state, time))
    }
  }

  const massResidual = accountedApap(state) - initialApap
  const massTolerance = 1e-7 * Math.max(1, initialApap)
  if (Math.abs(massResidual) > massTolerance) throw new ApapNumericalError(`APAP mass residual ${massResidual} exceeds tolerance ${massTolerance}`)
  if (minimumValue < 0 || minimumFraction < 0 || maximumSumError > 1e-10) throw new ApapNumericalError('Integrated state violated non-negativity or cell-state conservation')

  return { state, initialApap, times, outputs, snapshots, steps, minimumValue, minimumFraction, maximumSumError, massResidual, massTolerance }
}

function maximumAcross(integrated, selector) {
  return Math.max(...integrated.outputs.map(selector), 0)
}

export function runLimitingCaseDiagnostics(parameters, controls) {
  const zeroCyp = integrateApap({ ...parameters, cypRate: 0 }, controls)
  const zeroCypSignal = Math.max(maximumAcross(zeroCyp, (item) => item.liverNapqi), maximumAcross(zeroCyp, (item) => item.adductBurden), maximumAcross(zeroCyp, (item) => item.injuredFraction))
  const zeroBinding = integrateApap({ ...parameters, bindingRate: 0 }, controls)
  const zeroBindingSignal = Math.max(maximumAcross(zeroBinding, (item) => item.adductBurden), maximumAcross(zeroBinding, (item) => item.injuredFraction))
  const uniform = buildZonation(0)
  const uniformSignal = Math.max(...uniform) - Math.min(...uniform)
  const tolerance = 1e-12
  return [
    { id: 'zero-cyp', passed: zeroCypSignal <= tolerance, expectation: 'Zero CYP activity yields zero NAPQI, adduct, and APAP-mediated injury.', maximumSignal: round(zeroCypSignal), tolerance },
    { id: 'zero-binding', passed: zeroBindingSignal <= tolerance, expectation: 'Zero adduct binding yields zero adduct and APAP-mediated injury.', maximumSignal: round(zeroBindingSignal), tolerance },
    { id: 'uniform-zonation', passed: uniformSignal <= tolerance, expectation: 'Zero zonation amplitude makes all CYP zonation coefficients identical.', maximumSignal: round(uniformSignal), tolerance }
  ]
}

export function systemicSeries(integrated) {
  const definitions = [
    ['SYSTEMIC:GUT-APAP', 'Gut/depot APAP', 'model-unit', (state, item) => item.gutApap],
    ['SYSTEMIC:CENTRAL-APAP', 'Central APAP', 'model-unit', (state, item) => item.centralApap],
    ['SYSTEMIC:LIVER-APAP', 'Mean lobule APAP', 'model-unit', (state, item) => item.liverApap],
    ['SYSTEMIC:LIVER-NAPQI', 'Mean lobule NAPQI', 'model-unit', (state, item) => item.liverNapqi],
    ['SYSTEMIC:LIVER-GSH', 'Mean lobule GSH', 'model-unit', (state, item) => item.liverGsh],
    ['SYSTEMIC:ADDUCT', 'Mean adduct burden', 'model-unit', (state, item) => item.adductBurden],
    ['SYSTEMIC:INJURED', 'Mean injured fraction', '1', (state, item) => item.injuredFraction],
    ['SYSTEMIC:HEALTHY', 'Mean healthy fraction', '1', (state, item) => item.healthyFraction],
    ['SYSTEMIC:NAC', 'NAC state', 'model-unit', (state, item) => item.nac]
  ]
  return definitions.map(([id, name, unit, select]) => ({ id, name, unit, values: integrated.outputs.map((item) => round(select(integrated.state, item))) }))
}
