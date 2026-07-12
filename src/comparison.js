export function compatibleRuns(current, candidate) {
  const currentInitial = current.effectiveInputs.initialConcentrations
  const candidateInitial = candidate.effectiveInputs.initialConcentrations
  const keys = Object.keys(currentInitial).sort((a, b) => a < b ? -1 : a > b ? 1 : 0)
  return current.release.id === candidate.release.id
    && current.release.digest === candidate.release.digest
    && current.modelVersion === candidate.modelVersion
    && current.engineVersion === candidate.engineVersion
    && current.taxonId === candidate.taxonId
    && current.effectiveInputs.durationHours === candidate.effectiveInputs.durationHours
    && current.effectiveInputs.stepHours === candidate.effectiveInputs.stepHours
    && keys.length === Object.keys(candidateInitial).length
    && keys.every((key) => currentInitial[key] === candidateInitial[key])
}
