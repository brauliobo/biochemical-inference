function splitmix32(seed) {
  let value = seed >>> 0
  return () => {
    value = (value + 0x9e3779b9) >>> 0
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 16), 0x21f0aaad)
    mixed = Math.imul(mixed ^ (mixed >>> 15), 0x735a2d97)
    return (mixed ^ (mixed >>> 15)) >>> 0
  }
}

export function createXoshiro128StarStar(seed) {
  const seedWord = splitmix32(seed)
  const state = [seedWord(), seedWord(), seedWord(), seedWord()]
  return () => {
    const result = Math.imul(((Math.imul(state[1], 5) << 7) | (Math.imul(state[1], 5) >>> 25)) >>> 0, 9) >>> 0
    const temporary = (state[1] << 9) >>> 0
    state[2] ^= state[0]
    state[3] ^= state[1]
    state[1] ^= state[2]
    state[0] ^= state[3]
    state[2] ^= temporary
    state[3] = ((state[3] << 11) | (state[3] >>> 21)) >>> 0
    return (result + 0.5) / 4294967296
  }
}

function sampleSchedule(duration, interval) {
  const times = [0]
  for (let time = interval; time < duration - 1e-12; time += interval) times.push(Number(time.toPrecision(14)))
  times.push(Number(duration.toPrecision(14)))
  return times
}

function quantile(sorted, fraction) {
  return sorted[Math.floor(fraction * (sorted.length - 1))]
}

export function runSsa(model, experiment) {
  const species = model.definition.species
  const speciesIndex = new Map(species.map((item, index) => [item.id, index]))
  const parameters = new Map(model.definition.parameters.map((item) => [item.id, item.value]))
  const reactions = model.definition.reactions.map((reaction) => ({
    reactant: speciesIndex.get(reaction.reactant),
    products: reaction.products.map((product) => ({ index: speciesIndex.get(product.speciesId), stoichiometry: product.stoichiometry })),
    rate: parameters.get(reaction.rateConstantId)
  }))
  const controls = experiment.controls
  const times = sampleSchedule(controls.duration, controls.outputInterval)
  const finalStates = []
  let representative
  let totalEvents = 0
  let conservationResidual = 0

  for (let replicate = 0; replicate < controls.replicates; replicate += 1) {
    const random = createXoshiro128StarStar((experiment.seed + Math.imul(replicate, 0x9e3779b9)) >>> 0)
    const state = species.map((item) => item.initial)
    const sampled = species.map((item) => [item.initial])
    const initialTotal = state.reduce((sum, value) => sum + value, 0)
    let time = 0
    let sampleIndex = 1
    let events = 0
    while (time < controls.duration) {
      const propensities = reactions.map((reaction) => reaction.rate * state[reaction.reactant])
      const total = propensities.reduce((sum, value) => sum + value, 0)
      if (total <= 0) break
      const eventTime = time - Math.log(random()) / total
      while (sampleIndex < times.length && times[sampleIndex] < eventTime) {
        state.forEach((value, index) => sampled[index].push(value))
        sampleIndex += 1
      }
      if (eventTime > controls.duration) break
      let threshold = random() * total
      let selected = propensities.length - 1
      for (let index = 0; index < propensities.length; index += 1) {
        threshold -= propensities[index]
        if (threshold <= 0) {
          selected = index
          break
        }
      }
      const reaction = reactions[selected]
      if (state[reaction.reactant] <= 0) throw new Error('SSA selected a reaction without an available reactant')
      state[reaction.reactant] -= 1
      for (const product of reaction.products) state[product.index] += product.stoichiometry
      time = eventTime
      events += 1
      if (events > controls.maxEventsPerReplicate) {
        return { outcome: 'non-converged', data: null, iterations: totalEvents + events, residuals: { replicate, events }, warnings: [], failure: { code: 'event_limit', message: 'SSA replicate exceeded maxEventsPerReplicate.' } }
      }
    }
    while (sampleIndex < times.length) {
      state.forEach((value, index) => sampled[index].push(value))
      sampleIndex += 1
    }
    conservationResidual = Math.max(conservationResidual, Math.abs(state.reduce((sum, value) => sum + value, 0) - initialTotal))
    totalEvents += events
    finalStates.push([...state])
    if (replicate === 0) representative = sampled
  }

  const summaries = species.map((item, index) => {
    const values = finalStates.map((state) => state[index]).sort((left, right) => left - right)
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
    return { id: item.id, name: item.name, unit: item.unit, mean, variance, minimum: values[0], median: quantile(values, 0.5), maximum: values.at(-1) }
  })

  return {
    outcome: 'successful',
    data: {
      engine: 'ssa',
      finalTime: controls.duration,
      timeUnit: { id: 'second', symbol: 's', scaleToSI: 1, dimension: { amount: 0, mass: 0, length: 0, time: 1, temperature: 0, current: 0, luminosity: 0 } },
      replicates: controls.replicates,
      summaries,
      representative: species.map((item, index) => ({ id: item.id, name: item.name, unit: item.unit, values: representative[index] })),
      sampleTimes: times
    },
    iterations: totalEvents,
    residuals: { conservedMolecules: conservationResidual },
    warnings: ['Replicate moments are Monte Carlo estimates and depend on the pinned seed, PRNG, and replicate count.'],
    failure: null
  }
}
