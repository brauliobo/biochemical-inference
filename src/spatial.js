export function applyCoordinateTransform(matrix, point) {
  if (!Array.isArray(matrix) || matrix.length !== 4 || !Array.isArray(point) || point.length !== 3) throw new TypeError('A 4x4 matrix and xyz point are required.')
  const input = [...point, 1]
  const output = matrix.map((row) => row.reduce((sum, value, index) => sum + value * input[index], 0))
  if (!output.every(Number.isFinite) || output[3] === 0) throw new RangeError('The coordinate transform produced an invalid homogeneous point.')
  return output.slice(0, 3).map((value) => value / output[3])
}

export function selectLod(levels, projectedCellPixels) {
  if (!Array.isArray(levels) || levels.length === 0) throw new TypeError('At least one LOD level is required.')
  if (!Number.isFinite(projectedCellPixels) || projectedCellPixels < 0) throw new RangeError('Projected size must be non-negative.')
  const ordered = [...levels].sort((left, right) => left.level - right.level)
  if (projectedCellPixels >= 4) return ordered[0]
  if (projectedCellPixels <= 1) return ordered.at(-1)
  const index = Math.min(ordered.length - 1, Math.floor((4 - projectedCellPixels) / 3 * ordered.length))
  return ordered[index]
}

export function valueState(value, missingPolicy) {
  if (value === null || value === undefined || !Number.isFinite(value)) return { missing: true, reason: 'not-finite' }
  if (missingPolicy.mode === 'sentinel' && value === missingPolicy.sentinel) return { missing: true, reason: 'sentinel' }
  return { missing: false, value }
}

export function scaleValue(value, domain, missingPolicy) {
  const state = valueState(value, missingPolicy)
  if (state.missing) return { ...state, ratio: null }
  const [minimum, maximum] = domain
  if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum >= maximum) throw new RangeError('Scaling requires an ordered finite domain.')
  return { ...state, ratio: Math.max(0, Math.min(1, (value - minimum) / (maximum - minimum))) }
}

export function interpolateValue(lower, upper, fraction, mode, missingPolicy) {
  const left = valueState(lower, missingPolicy)
  const right = valueState(upper, missingPolicy)
  if (left.missing || right.missing) return { missing: true, reason: left.missing ? left.reason : right.reason }
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new RangeError('Interpolation fraction must be from zero to one.')
  if (mode === 'none') return fraction === 0 ? left : { missing: true, reason: 'interpolation-forbidden' }
  if (mode === 'nearest') return { missing: false, value: fraction < 0.5 ? lower : upper }
  if (mode === 'linear') return { missing: false, value: lower + (upper - lower) * fraction }
  throw new TypeError('Unknown interpolation mode.')
}

export function parsePointInstances(csv) {
  const rows = csv.trim().split(/\r?\n/)
  if (rows.shift() !== 'instance_id,x,y,z') throw new Error('Spatial instance content has an incompatible header.')
  return rows.map((row) => {
    const [id, x, y, z] = row.split(',').map(Number)
    if (![id, x, y, z].every(Number.isFinite)) throw new Error('Spatial instance content contains a non-finite value.')
    return { id, position: [x, y, z] }
  })
}

export function resolveExistingBin(intersections, targetSystem = 'synthetic-benchmark') {
  if (targetSystem === 'HRA') return undefined
  const hit = intersections.find((intersection) => Number.isInteger(intersection?.instanceId))
  const bin = hit?.object?.userData?.bins?.[hit.instanceId]
  return Number.isInteger(bin) && bin >= 0 && bin < 12 ? bin : undefined
}
