const EPSILON = 1e-9

class Simplex {
  constructor(matrix, bounds, objective, maxIterations) {
    this.rows = bounds.length
    this.columns = objective.length
    this.basic = Array.from({ length: this.rows }, (_, index) => this.columns + index)
    this.nonBasic = [...Array.from({ length: this.columns }, (_, index) => index), -1]
    this.tableau = Array.from({ length: this.rows + 2 }, () => Array(this.columns + 2).fill(0))
    this.maxIterations = maxIterations
    this.iterations = 0
    for (let row = 0; row < this.rows; row += 1) {
      for (let column = 0; column < this.columns; column += 1) this.tableau[row][column] = matrix[row][column]
    }
    for (let row = 0; row < this.rows; row += 1) {
      this.tableau[row][this.columns] = -1
      this.tableau[row][this.columns + 1] = bounds[row]
    }
    for (let column = 0; column < this.columns; column += 1) this.tableau[this.rows][column] = -objective[column]
    this.tableau[this.rows + 1][this.columns] = 1
  }

  pivot(row, column) {
    const inverse = 1 / this.tableau[row][column]
    for (let otherRow = 0; otherRow < this.rows + 2; otherRow += 1) {
      if (otherRow === row) continue
      for (let otherColumn = 0; otherColumn < this.columns + 2; otherColumn += 1) {
        if (otherColumn !== column) this.tableau[otherRow][otherColumn] -= this.tableau[row][otherColumn] * this.tableau[otherRow][column] * inverse
      }
    }
    for (let otherColumn = 0; otherColumn < this.columns + 2; otherColumn += 1) if (otherColumn !== column) this.tableau[row][otherColumn] *= inverse
    for (let otherRow = 0; otherRow < this.rows + 2; otherRow += 1) if (otherRow !== row) this.tableau[otherRow][column] *= -inverse
    this.tableau[row][column] = inverse
    ;[this.basic[row], this.nonBasic[column]] = [this.nonBasic[column], this.basic[row]]
    this.iterations += 1
    if (this.iterations > this.maxIterations) throw new Error('simplex iteration limit exceeded')
  }

  optimize(phase) {
    const objectiveRow = phase === 1 ? this.rows + 1 : this.rows
    while (true) {
      let entering = -1
      for (let column = 0; column <= this.columns; column += 1) {
        if (phase === 2 && this.nonBasic[column] === -1) continue
        if (entering === -1 || this.tableau[objectiveRow][column] < this.tableau[objectiveRow][entering] - EPSILON || (Math.abs(this.tableau[objectiveRow][column] - this.tableau[objectiveRow][entering]) <= EPSILON && this.nonBasic[column] < this.nonBasic[entering])) entering = column
      }
      if (this.tableau[objectiveRow][entering] >= -EPSILON) return true
      let leaving = -1
      for (let row = 0; row < this.rows; row += 1) {
        if (this.tableau[row][entering] <= EPSILON) continue
        if (leaving === -1) leaving = row
        else {
          const ratio = this.tableau[row][this.columns + 1] / this.tableau[row][entering]
          const bestRatio = this.tableau[leaving][this.columns + 1] / this.tableau[leaving][entering]
          if (ratio < bestRatio - EPSILON || (Math.abs(ratio - bestRatio) <= EPSILON && this.basic[row] < this.basic[leaving])) leaving = row
        }
      }
      if (leaving === -1) return false
      this.pivot(leaving, entering)
    }
  }

  solve() {
    let row = 0
    for (let index = 1; index < this.rows; index += 1) if (this.tableau[index][this.columns + 1] < this.tableau[row][this.columns + 1]) row = index
    if (this.tableau[row][this.columns + 1] < -EPSILON) {
      this.pivot(row, this.columns)
      if (!this.optimize(1) || this.tableau[this.rows + 1][this.columns + 1] < -EPSILON) return { status: 'infeasible', iterations: this.iterations }
      if (Math.abs(this.tableau[this.rows + 1][this.columns + 1]) > EPSILON) return { status: 'infeasible', iterations: this.iterations }
      const artificialRow = this.basic.indexOf(-1)
      if (artificialRow !== -1) {
        let entering = 0
        for (let column = 1; column <= this.columns; column += 1) if (Math.abs(this.tableau[artificialRow][column]) > Math.abs(this.tableau[artificialRow][entering])) entering = column
        this.pivot(artificialRow, entering)
      }
    }
    if (!this.optimize(2)) return { status: 'unbounded', iterations: this.iterations }
    const solution = Array(this.columns).fill(0)
    for (let index = 0; index < this.rows; index += 1) if (this.basic[index] < this.columns) solution[this.basic[index]] = this.tableau[index][this.columns + 1]
    return { status: 'optimal', solution, objective: this.tableau[this.rows][this.columns + 1], iterations: this.iterations }
  }
}

export function runFba(model, experiment) {
  const interventions = new Map(experiment.interventions.map((item) => [item.targetId, item.value]))
  const reactions = model.definition.reactions.map((reaction) => interventions.has(reaction.id) ? { ...reaction, upperBound: interventions.get(reaction.id) } : reaction)
  const metabolites = model.definition.metabolites
  if (reactions.some((reaction) => !Number.isFinite(reaction.lowerBound))) throw new Error('FBA profile requires finite lower bounds')
  const shiftedObjective = reactions.map((reaction) => reaction.id === model.definition.objective.reactionId ? 1 : 0)
  const offset = reactions.reduce((sum, reaction, index) => sum + shiftedObjective[index] * reaction.lowerBound, 0)
  const matrix = []
  const bounds = []
  for (const metabolite of metabolites) {
    const coefficients = reactions.map((reaction) => reaction.stoichiometry[metabolite.id] ?? 0)
    const right = -reactions.reduce((sum, reaction, index) => sum + coefficients[index] * reaction.lowerBound, 0)
    matrix.push(coefficients, coefficients.map((value) => -value))
    bounds.push(right, -right)
  }
  for (let index = 0; index < reactions.length; index += 1) {
    if (reactions[index].upperBound !== null) {
      matrix.push(reactions.map((_reaction, column) => column === index ? 1 : 0))
      bounds.push(reactions[index].upperBound - reactions[index].lowerBound)
    }
  }

  let solved
  try {
    solved = new Simplex(matrix, bounds, shiftedObjective, experiment.controls.maxIterations).solve()
  } catch (error) {
    return { outcome: 'non-converged', data: null, iterations: experiment.controls.maxIterations, residuals: {}, warnings: [], failure: { code: 'iteration_limit', message: error.message } }
  }
  if (solved.status !== 'optimal') return { outcome: solved.status, data: null, iterations: solved.iterations, residuals: {}, warnings: [], failure: { code: `${solved.status}_lp`, message: `The stoichiometric linear program is ${solved.status}.` } }

  const fluxes = solved.solution.map((value, index) => value + reactions[index].lowerBound)
  const steadyStateResidual = Math.max(...metabolites.map((metabolite) => Math.abs(reactions.reduce((sum, reaction, index) => sum + (reaction.stoichiometry[metabolite.id] ?? 0) * fluxes[index], 0))))
  const boundViolation = Math.max(0, ...reactions.map((reaction, index) => Math.max(reaction.lowerBound - fluxes[index], reaction.upperBound === null ? 0 : fluxes[index] - reaction.upperBound)))
  if (steadyStateResidual > experiment.controls.feasibilityTolerance || boundViolation > experiment.controls.feasibilityTolerance) {
    return { outcome: 'failed', data: null, iterations: solved.iterations ?? 0, residuals: { steadyState: steadyStateResidual, boundViolation }, warnings: [], failure: { code: 'residual_failure', message: 'The LP solution violates the requested feasibility tolerance.' } }
  }
  const objective = solved.objective + offset
  return {
    outcome: 'successful',
    data: {
      engine: 'fba',
      objective,
      objectiveUnit: model.definition.objective.unit,
      fluxes: reactions.map((reaction, index) => ({ id: reaction.id, name: reaction.name, value: fluxes[index], unit: reaction.unit }))
    },
    iterations: solved.iterations ?? 0,
    residuals: { steadyState: steadyStateResidual, boundViolation, objectiveAgreement: Math.abs(objective - fluxes[reactions.findIndex((reaction) => reaction.id === model.definition.objective.reactionId)]) },
    warnings: [
      'FBA optimality applies only to the declared linear objective and constraints.',
      ...experiment.interventions.length > 0 ? ['Time-zero FBA interventions replace declared reaction upper bounds; they do not represent dynamic continuation.'] : []
    ],
    failure: null
  }
}
