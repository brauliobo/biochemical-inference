import { ODE_MODEL } from '../../../server/portfolio/registry.js'

export function incompatibleUnitModel() {
  const model = structuredClone(ODE_MODEL)
  model.definition.species[1].unit = {
    id: 'mole',
    symbol: 'mol',
    scaleToSI: 1,
    dimension: { amount: 1, mass: 0, length: 0, time: 0, temperature: 0, current: 0, luminosity: 0 }
  }
  return model
}
