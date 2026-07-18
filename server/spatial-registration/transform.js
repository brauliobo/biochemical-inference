export function multiplyAffine(left, right) {
  return left.map((row) => row.map((_value, column) => row.reduce((total, item, index) => total + item * right[index][column], 0)))
}

export function applyAffine(matrix, pointXyz) {
  const point = [...pointXyz, 1]
  const output = matrix.map((row) => row.reduce((total, item, index) => total + item * point[index], 0))
  if (output[3] === 0) throw new Error('Transform produced a zero homogeneous coordinate.')
  return output.slice(0, 3).map((item) => item / output[3])
}

export function selectRegistrationChain(metadata, sourceSpaceId, targetSpaceId) {
  const registration = metadata.registration
  const spaces = new Map(metadata.spaces.map((space) => [space.id, space]))
  const source = spaces.get(sourceSpaceId)
  const target = spaces.get(targetSpaceId)
  if (!source || !target || sourceSpaceId === targetSpaceId) throw new Error('Transform chain source and target must be distinct published spaces.')
  if (source.subject_id !== target.subject_id || source.taxon_id !== target.taxon_id || source.dimensions !== target.dimensions || source.unit !== target.unit || source.version !== target.version || JSON.stringify(source.axes) !== JSON.stringify(target.axes)) throw new Error('Transform chain crosses an incompatible subject, taxon, axis, dimension, unit, or version boundary.')
  if (registration.source_space_id === sourceSpaceId && registration.target_space_id === targetSpaceId) return { matrix: registration.matrix, direction: 'forward', registration }
  if (registration.source_space_id === targetSpaceId && registration.target_space_id === sourceSpaceId && registration.inverse.status === 'available-exact') return { matrix: registration.inverse.matrix, direction: 'inverse', registration }
  throw new Error('No directed registration chain reaches the requested target space.')
}
