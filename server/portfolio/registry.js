import { PortfolioModelSchema } from '../../shared/portfolio-contracts.js'
import { modelDigest } from './identity.js'

const ZERO = Object.freeze({ amount: 0, mass: 0, length: 0, time: 0, temperature: 0, current: 0, luminosity: 0 })
const CONCENTRATION = Object.freeze({ ...ZERO, amount: 1, length: -3 })
const COUNT = Object.freeze({ ...ZERO, amount: 1 })
const INVERSE_SECOND = Object.freeze({ ...ZERO, time: -1 })
const FLUX = Object.freeze({ ...ZERO, amount: 1, mass: -1, time: -1 })

const UNITS = Object.freeze({
  second: Object.freeze({ id: 'second', symbol: 's', scaleToSI: 1, dimension: Object.freeze({ ...ZERO, time: 1 }) }),
  molar: Object.freeze({ id: 'molar', symbol: 'mol/L', scaleToSI: 1000, dimension: CONCENTRATION }),
  molecule: Object.freeze({ id: 'molecule', symbol: 'molecule', scaleToSI: 1 / 6.02214076e23, dimension: COUNT }),
  perSecond: Object.freeze({ id: 'per_second', symbol: 's^-1', scaleToSI: 1, dimension: INVERSE_SECOND }),
  flux: Object.freeze({ id: 'millimole_per_gram_hour', symbol: 'mmol gDW^-1 h^-1', scaleToSI: 1 / 3600, dimension: FLUX })
})

const KNOWLEDGE_RELEASE = Object.freeze({
  id: 'portfolio-benchmarks-v1.0.0',
  digest: 'sha256:5f60c549b26f905f058b6d1d942110d3db224fdd81f58a6f2e51775cbe93cc48'
})

function finalized(model) {
  const candidate = { ...model, digest: `sha256:${'0'.repeat(64)}` }
  candidate.digest = modelDigest(candidate)
  return Object.freeze(PortfolioModelSchema.parse(candidate))
}

const sharedDynamic = {
  contractVersion: '2.0.0',
  knowledgeRelease: KNOWLEDGE_RELEASE,
  assumptions: [
    'The vessel is well mixed and isothermal.',
    'The irreversible first-order rate constant remains constant over the experiment.'
  ],
  limitations: [
    'This benchmark contains one irreversible reaction and does not represent a cellular pathway.',
    'No parameter uncertainty, transport, delay, or spatial variation is represented.'
  ]
}

export const ODE_MODEL = finalized({
  ...sharedDynamic,
  id: 'first_order_ode',
  name: 'First-order conversion (ODE)',
  version: '1.0.0',
  engine: { type: 'ode', id: 'biochemical_ode', version: '1.0.0', algorithm: 'dormand-prince-5-4', algorithmVersion: '1.0.0' },
  definition: {
    species: [
      { id: 'A', name: 'Reactant A', initial: 10, unit: UNITS.molar },
      { id: 'B', name: 'Product B', initial: 0, unit: UNITS.molar }
    ],
    parameters: [{ id: 'k', name: 'First-order rate constant', value: 0.3, unit: UNITS.perSecond, evidence: ['Analytic benchmark parameter; A(t) = A0 exp(-k t).'] }],
    reactions: [{ id: 'conversion', name: 'A to B', reactant: 'A', products: [{ speciesId: 'B', stoichiometry: 1 }], rateConstantId: 'k' }]
  },
  observables: [
    { id: 'reactant', name: 'Reactant A concentration', targetId: 'A', unit: UNITS.molar },
    { id: 'product', name: 'Product B concentration', targetId: 'B', unit: UNITS.molar }
  ]
})

export const SSA_MODEL = finalized({
  ...sharedDynamic,
  id: 'first_order_ssa',
  name: 'First-order conversion (SSA)',
  version: '1.0.0',
  engine: { type: 'ssa', id: 'biochemical_ssa', version: '1.0.0', algorithm: 'gillespie-direct', algorithmVersion: '1.0.0' },
  definition: {
    species: [
      { id: 'A', name: 'Reactant A', initial: 40, unit: UNITS.molecule },
      { id: 'B', name: 'Product B', initial: 0, unit: UNITS.molecule }
    ],
    parameters: [{ id: 'k', name: 'First-order event rate', value: 0.2, unit: UNITS.perSecond, evidence: ['Binomial survival benchmark parameter; p = exp(-k t).'] }],
    reactions: [{ id: 'conversion', name: 'A to B', reactant: 'A', products: [{ speciesId: 'B', stoichiometry: 1 }], rateConstantId: 'k' }]
  },
  observables: [
    { id: 'reactant_count', name: 'Reactant A count', targetId: 'A', unit: UNITS.molecule },
    { id: 'product_count', name: 'Product B count', targetId: 'B', unit: UNITS.molecule }
  ],
  limitations: [
    'This benchmark is a closed, well-mixed, first-order Markov jump process.',
    'Replicate summaries characterize simulation variability, not biological or measurement uncertainty.'
  ]
})

export const FBA_MODEL = finalized({
  contractVersion: '2.0.0',
  id: 'bounded_growth_fba',
  name: 'Bounded uptake and biomass (FBA)',
  version: '1.0.0',
  knowledgeRelease: KNOWLEDGE_RELEASE,
  engine: { type: 'fba', id: 'biochemical_fba', version: '1.0.0', algorithm: 'two-phase-simplex', algorithmVersion: '1.0.0' },
  assumptions: [
    'The intracellular precursor is at steady state.',
    'Maximizing biomass flux is the declared objective and substrate uptake is bounded.'
  ],
  limitations: [
    'This two-reaction benchmark omits maintenance, thermodynamics, regulation, and alternate optima.',
    'Flux balance solutions are steady-state feasible rates, not time trajectories.'
  ],
  definition: {
    metabolites: [{ id: 'precursor', name: 'Intracellular precursor' }],
    reactions: [
      { id: 'uptake', name: 'Precursor uptake', stoichiometry: { precursor: 1 }, lowerBound: 0, upperBound: 10, unit: UNITS.flux },
      { id: 'biomass', name: 'Biomass production', stoichiometry: { precursor: -1 }, lowerBound: 0, upperBound: null, unit: UNITS.flux }
    ],
    objective: { reactionId: 'biomass', direction: 'maximize', unit: UNITS.flux }
  },
  observables: [{ id: 'growth', name: 'Biomass objective flux', targetId: 'biomass', unit: UNITS.flux }]
})

const models = Object.freeze([ODE_MODEL, SSA_MODEL, FBA_MODEL])

export function listModels() {
  return models
}

export function getModel(id) {
  return models.find((model) => model.id === id)
}
