const round = (value) => Number(value.toPrecision(14))

function system(model) {
  const species = model.definition.species
  const speciesIndex = new Map(species.map((item, index) => [item.id, index]))
  const parameters = new Map(model.definition.parameters.map((item) => [item.id, item.value]))
  const reactions = model.definition.reactions.map((reaction) => ({
    reactant: speciesIndex.get(reaction.reactant),
    products: reaction.products.map((product) => ({ index: speciesIndex.get(product.speciesId), stoichiometry: product.stoichiometry })),
    rateConstantId: reaction.rateConstantId
  }))
  return {
    initial: species.map((item) => item.initial),
    speciesIndex,
    parameters,
    derivative(state) {
      const slope = state.map(() => 0)
      for (const reaction of reactions) {
        const flux = parameters.get(reaction.rateConstantId) * state[reaction.reactant]
        slope[reaction.reactant] -= flux
        for (const product of reaction.products) slope[product.index] += product.stoichiometry * flux
      }
      return slope
    }
  }
}

function add(state, terms) {
  return state.map((value, index) => value + terms.reduce((sum, [coefficient, slope]) => sum + coefficient * slope[index], 0))
}

function rk4Step(derivative, state, step) {
  const k1 = derivative(state)
  const k2 = derivative(add(state, [[step / 2, k1]]))
  const k3 = derivative(add(state, [[step / 2, k2]]))
  const k4 = derivative(add(state, [[step, k3]]))
  return add(state, [[step / 6, k1], [step / 3, k2], [step / 3, k3], [step / 6, k4]])
}

function dormandPrinceStep(derivative, state, step) {
  const k1 = derivative(state)
  const k2 = derivative(add(state, [[step * 1 / 5, k1]]))
  const k3 = derivative(add(state, [[step * 3 / 40, k1], [step * 9 / 40, k2]]))
  const k4 = derivative(add(state, [[step * 44 / 45, k1], [step * -56 / 15, k2], [step * 32 / 9, k3]]))
  const k5 = derivative(add(state, [[step * 19372 / 6561, k1], [step * -25360 / 2187, k2], [step * 64448 / 6561, k3], [step * -212 / 729, k4]]))
  const k6 = derivative(add(state, [[step * 9017 / 3168, k1], [step * -355 / 33, k2], [step * 46732 / 5247, k3], [step * 49 / 176, k4], [step * -5103 / 18656, k5]]))
  const fifth = add(state, [[step * 35 / 384, k1], [step * 500 / 1113, k3], [step * 125 / 192, k4], [step * -2187 / 6784, k5], [step * 11 / 84, k6]])
  const k7 = derivative(fifth)
  const fourth = add(state, [[step * 5179 / 57600, k1], [step * 7571 / 16695, k3], [step * 393 / 640, k4], [step * -92097 / 339200, k5], [step * 187 / 2100, k6], [step * 1 / 40, k7]])
  return { fifth, error: fifth.map((value, index) => value - fourth[index]) }
}

function assertState(state) {
  if (state.some((value) => !Number.isFinite(value) || value < -1e-12)) throw new Error('ODE integration produced a non-finite or negative state')
}

function schedule(duration, interval) {
  const values = [0]
  for (let time = interval; time < duration - 1e-12; time += interval) values.push(round(time))
  values.push(round(duration))
  return values
}

export function runOde(model, experiment) {
  const controls = experiment.controls
  const dynamics = system(model)
  const { initial, derivative } = dynamics
  const times = schedule(controls.duration, controls.outputInterval)
  const values = model.definition.species.map(() => [])
  let state = [...initial]
  let time = 0
  let step = Math.min(controls.fixedStep, controls.outputInterval)
  let iterations = 0
  let rejectedSteps = 0
  let minimumStep = Number.POSITIVE_INFINITY
  let maximumStep = 0
  let interventionIndex = 0

  const applyInterventions = () => {
    while (interventionIndex < experiment.interventions.length && Math.abs(experiment.interventions[interventionIndex].time - time) <= 1e-12) {
      const intervention = experiment.interventions[interventionIndex]
      const stateIndex = dynamics.speciesIndex.get(intervention.targetId)
      if (stateIndex === undefined) dynamics.parameters.set(intervention.targetId, intervention.value)
      else state[stateIndex] = intervention.value
      interventionIndex += 1
    }
  }
  applyInterventions()
  state.forEach((value, index) => values[index].push(round(value)))

  for (const target of times.slice(1)) {
    while (time < target - 1e-14) {
      if (iterations + rejectedSteps >= controls.maxInternalSteps) {
        return { outcome: 'non-converged', data: null, iterations, residuals: { rejectedSteps }, warnings: [], failure: { code: 'step_limit', message: 'ODE integration exceeded maxInternalSteps.' } }
      }
      const nextIntervention = experiment.interventions[interventionIndex]?.time ?? Number.POSITIVE_INFINITY
      const candidateStep = Math.min(step, target - time, nextIntervention - time)
      if (controls.method === 'rk4') {
        state = rk4Step(derivative, state, candidateStep)
        assertState(state)
        time += candidateStep
        iterations += 1
        minimumStep = Math.min(minimumStep, candidateStep)
        maximumStep = Math.max(maximumStep, candidateStep)
      } else {
        const attempted = dormandPrinceStep(derivative, state, candidateStep)
        const errorNorm = Math.max(...attempted.error.map((error, index) => Math.abs(error) / (controls.absoluteTolerance + controls.relativeTolerance * Math.max(Math.abs(state[index]), Math.abs(attempted.fifth[index])))))
        const factor = errorNorm === 0 ? 5 : Math.min(5, Math.max(0.2, 0.9 * errorNorm ** -0.2))
        if (errorNorm <= 1) {
          state = attempted.fifth
          assertState(state)
          time += candidateStep
          iterations += 1
          minimumStep = Math.min(minimumStep, candidateStep)
          maximumStep = Math.max(maximumStep, candidateStep)
        } else {
          rejectedSteps += 1
        }
        step = candidateStep * factor
        if (step < Number.EPSILON * Math.max(1, Math.abs(time))) {
          return { outcome: 'non-converged', data: null, iterations, residuals: { rejectedSteps }, warnings: [], failure: { code: 'step_underflow', message: 'Adaptive ODE step size underflowed before reaching the requested output time.' } }
        }
      }
      applyInterventions()
    }
    state.forEach((value, index) => values[index].push(round(value)))
  }

  const initialTotal = initial.reduce((sum, value) => sum + value, 0)
  const finalTotal = state.reduce((sum, value) => sum + value, 0)
  return {
    outcome: 'successful',
    data: {
      engine: 'ode',
      time: times,
      timeUnit: { id: 'second', symbol: 's', scaleToSI: 1, dimension: { amount: 0, mass: 0, length: 0, time: 1, temperature: 0, current: 0, luminosity: 0 } },
      trajectories: model.definition.species.map((item, index) => ({ id: item.id, name: item.name, unit: item.unit, values: values[index] }))
    },
    iterations,
    residuals: { rejectedSteps, minimumStep: round(minimumStep), maximumStep: round(maximumStep), conservedPool: round(Math.abs(finalTotal - initialTotal)) },
    warnings: [
      ...controls.method === 'rk4' ? ['Fixed-step RK4 has no local error estimator; convergence must be checked by step refinement.'] : [],
      ...experiment.interventions.length > 0 ? ['Scheduled assignments are applied exactly at declared times; they are discontinuities, not inferred biological mechanisms.'] : []
    ],
    failure: null
  }
}
