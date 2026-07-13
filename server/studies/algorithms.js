const EPSILON = 1e-14

export function createSeededRandom(seed) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ value >>> 15, value | 1)
    value ^= value + Math.imul(value ^ value >>> 7, value | 61)
    return ((value ^ value >>> 14) >>> 0) / 0x100000000
  }
}

function normalRandom(random) {
  const first = Math.max(random(), Number.MIN_VALUE)
  return Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * random())
}

export function predictDecay(times, rate, options = {}) {
  const initial = options.initial ?? 10
  const modelForm = options.modelForm ?? 'first-order'
  const offset = modelForm === 'first-order-offset' ? (options.offset ?? 1.5) : 0
  const solver = options.solver ?? 'analytic'
  if (!Number.isFinite(rate) || rate < 0) throw new Error('Decay rate must be finite and non-negative')
  if (solver === 'analytic') return times.map((time) => offset + (initial - offset) * Math.exp(-rate * time))
  if (solver !== 'rk4') throw new Error(`Unsupported decay solver: ${solver}`)
  const step = options.timestep ?? 0.25
  if (!Number.isFinite(step) || step <= 0) throw new Error('RK4 timestep must be positive')
  let currentTime = 0
  let state = initial
  const result = []
  for (const target of times) {
    if (target < currentTime) throw new Error('Decay prediction times must be ordered')
    while (currentTime < target - EPSILON) {
      const h = Math.min(step, target - currentTime)
      const derivative = (value) => -rate * (value - offset)
      const k1 = derivative(state)
      const k2 = derivative(state + h * k1 / 2)
      const k3 = derivative(state + h * k2 / 2)
      const k4 = derivative(state + h * k3)
      state += h * (k1 + 2 * k2 + 2 * k3 + k4) / 6
      currentTime += h
    }
    result.push(state)
  }
  return result
}

export function centeredFiniteDifference({ value, relativeStep, evaluate }) {
  const step = Math.max(Math.abs(value) * relativeStep, relativeStep)
  const upper = evaluate(value + step)
  const lower = evaluate(Math.max(0, value - step))
  const denominator = value - step < 0 ? value + step : 2 * step
  return upper.map((item, index) => (item - lower[index]) / denominator)
}

export function morrisScreen({ parameterSpecs, evaluate, trajectories, levels, seed }) {
  const random = createSeededRandom(seed)
  const delta = levels / (2 * (levels - 1))
  const effects = new Map(parameterSpecs.map((item) => [item.id, []]))
  for (let trajectory = 0; trajectory < trajectories; trajectory += 1) {
    const normalized = parameterSpecs.map(() => Math.floor(random() * (levels - 1)) / (levels - 1))
    const order = parameterSpecs.map((_, index) => index)
    for (let index = order.length - 1; index > 0; index -= 1) {
      const selected = Math.floor(random() * (index + 1))
      const previous = order[index]
      order[index] = order[selected]
      order[selected] = previous
    }
    let current = normalized.map((item, index) => parameterSpecs[index].lower + item * (parameterSpecs[index].upper - parameterSpecs[index].lower))
    let output = evaluate(current)
    for (const index of order) {
      const direction = normalized[index] + delta <= 1 ? 1 : -1
      const nextNormalized = Math.min(1, Math.max(0, normalized[index] + direction * delta))
      const next = [...current]
      next[index] = parameterSpecs[index].lower + nextNormalized * (parameterSpecs[index].upper - parameterSpecs[index].lower)
      const nextOutput = evaluate(next)
      effects.get(parameterSpecs[index].id).push((nextOutput - output) / (next[index] - current[index]))
      normalized[index] = nextNormalized
      current = next
      output = nextOutput
    }
  }
  return parameterSpecs.map((spec) => {
    const values = effects.get(spec.id)
    const mu = values.reduce((sum, item) => sum + item, 0) / values.length
    const muStar = values.reduce((sum, item) => sum + Math.abs(item), 0) / values.length
    const sigma = values.length > 1 ? Math.sqrt(values.reduce((sum, item) => sum + (item - mu) ** 2, 0) / (values.length - 1)) : 0
    return { parameterId: spec.id, mu, muStar, sigma, trajectories }
  })
}

function boundedPoint(point, bounds) {
  return point.map((value, index) => Math.min(bounds[index].upper, Math.max(bounds[index].lower, value)))
}

function simplexDiameter(simplex) {
  const first = simplex[0].point
  return Math.max(...simplex.slice(1).map((item) => Math.sqrt(item.point.reduce((sum, value, index) => sum + (value - first[index]) ** 2, 0))), 0)
}

export function boundedNelderMead({ objective, initial, bounds, maxIterations, tolerance }) {
  const dimension = initial.length
  let simplex = [{ point: boundedPoint(initial, bounds) }]
  for (let index = 0; index < dimension; index += 1) {
    const point = [...initial]
    point[index] += Math.max((bounds[index].upper - bounds[index].lower) * 0.05, tolerance * 10)
    simplex.push({ point: boundedPoint(point, bounds) })
  }
  simplex = simplex.map((item) => ({ ...item, value: objective(item.point) }))
  let iterations = 0
  let converged = false
  for (; iterations < maxIterations; iterations += 1) {
    simplex.sort((left, right) => left.value - right.value)
    const spread = Math.abs(simplex.at(-1).value - simplex[0].value)
    if (simplexDiameter(simplex) <= tolerance && spread <= tolerance) {
      converged = true
      break
    }
    const centroid = Array.from({ length: dimension }, (_, index) => simplex.slice(0, dimension).reduce((sum, item) => sum + item.point[index], 0) / dimension)
    const worst = simplex[dimension]
    const reflectedPoint = boundedPoint(centroid.map((value, index) => value + (value - worst.point[index])), bounds)
    const reflected = { point: reflectedPoint, value: objective(reflectedPoint) }
    if (reflected.value < simplex[0].value) {
      const expandedPoint = boundedPoint(centroid.map((value, index) => value + 2 * (reflected.point[index] - value)), bounds)
      const expanded = { point: expandedPoint, value: objective(expandedPoint) }
      simplex[dimension] = expanded.value < reflected.value ? expanded : reflected
    } else if (reflected.value < simplex[dimension - 1].value) {
      simplex[dimension] = reflected
    } else {
      const contractedPoint = boundedPoint(centroid.map((value, index) => value + 0.5 * ((reflected.value < worst.value ? reflected.point[index] : worst.point[index]) - value)), bounds)
      const contracted = { point: contractedPoint, value: objective(contractedPoint) }
      if (contracted.value < Math.min(worst.value, reflected.value)) simplex[dimension] = contracted
      else {
        const best = simplex[0]
        simplex = [best, ...simplex.slice(1).map((item) => {
          const point = boundedPoint(item.point.map((value, index) => best.point[index] + 0.5 * (value - best.point[index])), bounds)
          return { point, value: objective(point) }
        })]
      }
    }
  }
  simplex.sort((left, right) => left.value - right.value)
  return { converged, estimate: converged ? simplex[0].point : null, bestSoFar: simplex[0].point, objective: simplex[0].value, iterations }
}

function jacobiEigenvalues(matrix) {
  const values = matrix.map((row) => [...row])
  const size = values.length
  for (let iteration = 0; iteration < 100 * Math.max(1, size * size); iteration += 1) {
    let row = 0
    let column = 0
    let maximum = 0
    for (let left = 0; left < size; left += 1) {
      for (let right = left + 1; right < size; right += 1) {
        if (Math.abs(values[left][right]) > maximum) {
          maximum = Math.abs(values[left][right])
          row = left
          column = right
        }
      }
    }
    if (maximum < 1e-14) break
    const angle = Math.atan2(2 * values[row][column], values[column][column] - values[row][row]) / 2
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    for (let index = 0; index < size; index += 1) {
      if (index === row || index === column) continue
      const left = values[index][row]
      const right = values[index][column]
      values[index][row] = values[row][index] = cosine * left - sine * right
      values[index][column] = values[column][index] = sine * left + cosine * right
    }
    const leftDiagonal = values[row][row]
    const rightDiagonal = values[column][column]
    const offDiagonal = values[row][column]
    values[row][row] = cosine ** 2 * leftDiagonal - 2 * sine * cosine * offDiagonal + sine ** 2 * rightDiagonal
    values[column][column] = sine ** 2 * leftDiagonal + 2 * sine * cosine * offDiagonal + cosine ** 2 * rightDiagonal
    values[row][column] = values[column][row] = 0
  }
  return values.map((row, index) => row[index]).sort((left, right) => right - left)
}

export function assessIdentifiability(jacobian, noiseVariance, parameterIds) {
  const columns = parameterIds.length
  const fisher = Array.from({ length: columns }, () => Array(columns).fill(0))
  for (const row of jacobian) {
    for (let left = 0; left < columns; left += 1) {
      for (let right = 0; right < columns; right += 1) fisher[left][right] += row[left] * row[right] / noiseVariance
    }
  }
  const eigenvalues = jacobiEigenvalues(fisher).map((item) => Math.max(0, item))
  const maximum = eigenvalues[0] ?? 0
  const threshold = Math.max(maximum * 1e-10, 1e-12)
  const positive = eigenvalues.filter((item) => item > threshold)
  const rank = positive.length
  const conditionNumber = rank < columns ? 'infinite' : Math.sqrt(maximum / positive.at(-1))
  return { identifiable: rank === columns && conditionNumber !== 'infinite' && conditionNumber < 1e8, parameterIds, rank, columns, conditionNumber, fisherInformation: fisher }
}

export function gelmanRubin(chains) {
  const chainLength = Math.min(...chains.map((chain) => chain.length))
  const means = chains.map((chain) => chain.slice(0, chainLength).reduce((sum, item) => sum + item, 0) / chainLength)
  const grandMean = means.reduce((sum, item) => sum + item, 0) / means.length
  const between = chainLength * means.reduce((sum, item) => sum + (item - grandMean) ** 2, 0) / Math.max(1, means.length - 1)
  const within = chains.reduce((sum, chain, index) => sum + chain.slice(0, chainLength).reduce((total, item) => total + (item - means[index]) ** 2, 0) / Math.max(1, chainLength - 1), 0) / chains.length
  if (within <= EPSILON) return between <= EPSILON ? 1 : Number.MAX_VALUE
  const variance = (chainLength - 1) * within / chainLength + between / chainLength
  return Math.sqrt(Math.max(1, variance / within))
}

export function randomWalkMetropolis({ logDensity, bounds, initial, priorStandardDeviation, chains, warmup, samples, proposalScale, seed }) {
  const allChains = []
  const acceptanceRates = []
  for (let chainIndex = 0; chainIndex < chains; chainIndex += 1) {
    const random = createSeededRandom((seed + Math.imul(chainIndex + 1, 0x9e3779b9)) >>> 0)
    let current = Math.min(bounds.upper, Math.max(bounds.lower, initial + (chainIndex - (chains - 1) / 2) * priorStandardDeviation * 0.35))
    let currentDensity = logDensity(current)
    let scale = proposalScale
    let warmupAccepted = 0
    let warmupWindow = 0
    let accepted = 0
    const values = []
    for (let iteration = 0; iteration < warmup + samples; iteration += 1) {
      const proposal = current + normalRandom(random) * scale
      const proposalDensity = proposal >= bounds.lower && proposal <= bounds.upper ? logDensity(proposal) : -Infinity
      const accept = Math.log(Math.max(random(), Number.MIN_VALUE)) < proposalDensity - currentDensity
      if (accept) {
        current = proposal
        currentDensity = proposalDensity
      }
      if (iteration < warmup) {
        warmupAccepted += accept ? 1 : 0
        warmupWindow += 1
        if ((iteration + 1) % 50 === 0) {
          const rate = warmupAccepted / warmupWindow
          scale *= rate < 0.18 ? 0.7 : rate > 0.55 ? 1.3 : 1
          warmupAccepted = 0
          warmupWindow = 0
        }
      } else {
        accepted += accept ? 1 : 0
        values.push(current)
      }
    }
    allChains.push(values)
    acceptanceRates.push(accepted / samples)
  }
  const rHat = gelmanRubin(allChains)
  const converged = rHat <= 1.05 && acceptanceRates.every((rate) => rate >= 0.1 && rate <= 0.7)
  const diagnostics = []
  if (rHat > 1.05) diagnostics.push(`R-hat ${rHat.toFixed(4)} exceeds 1.05.`)
  if (acceptanceRates.some((rate) => rate < 0.1)) diagnostics.push('At least one chain has acceptance below 0.10.')
  if (acceptanceRates.some((rate) => rate > 0.7)) diagnostics.push('At least one chain has acceptance above 0.70.')
  if (converged) diagnostics.push('All chains meet the declared R-hat and acceptance thresholds.')
  return { chains: allChains, acceptanceRates, rHat, converged, diagnostics }
}

export function quantile(values, probability) {
  const sorted = [...values].sort((left, right) => left - right)
  const position = (sorted.length - 1) * probability
  const lower = Math.floor(position)
  const fraction = position - lower
  return sorted[lower] + (sorted[Math.min(sorted.length - 1, lower + 1)] - sorted[lower]) * fraction
}

export function interval(values) {
  return { lower: quantile(values, 0.025), median: quantile(values, 0.5), upper: quantile(values, 0.975) }
}

export function posteriorPredictive({ posteriorSamples, observations, sigma, seed }) {
  const random = createSeededRandom(seed)
  const predictions = observations.map((observation) => {
    const samples = posteriorSamples.map((rate) => predictDecay([observation.independent_value], rate)[0] + normalRandom(random) * sigma)
    const predictionInterval = interval(samples)
    return { observationId: observation.id, observed: observation.value, interval: predictionInterval, covered: observation.value >= predictionInterval.lower && observation.value <= predictionInterval.upper }
  })
  const covered = predictions.filter((item) => item.covered).length
  return { heldOutOnly: true, observationIds: observations.map((item) => item.id), coverageProbability: covered / observations.length, covered, total: observations.length, predictions }
}
