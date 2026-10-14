// Atom and charge balance of a reaction, from the `formula` facts of its participants.
// Reactions are written in the ionisation states of Rhea/ChEBI at pH 7.3, compound formulas are the neutral or
// PubChem form with a charge where the species is an ion (docs/KNOWLEDGE_MODEL.md), so a reaction may balance in heavy
// atoms but not in hydrogens or charge: the indicator says which of the three holds instead of a single yes or no.

const SPECIAL = Object.freeze({ 'compound:proton': { atoms: { H: 1 }, charge: 1 } })

/** { atoms, charge } of a formula such as 'C5H14NO+' or 'C2H5NO2', or null when it is not a plain formula. */
export function parseFormula(text) {
  const head = String(text ?? '').trim().match(/^[A-Za-z0-9]+/)?.[0]
  if (!head) return null
  const atoms = {}
  let consumed = 0
  for (const match of head.matchAll(/([A-Z][a-z]?)(\d*)/g)) {
    atoms[match[1]] = (atoms[match[1]] ?? 0) + (match[2] ? Number(match[2]) : 1)
    consumed += match[0].length
  }
  if (consumed !== head.length) return null
  const charge = String(text).trim().slice(head.length).match(/^(\d*)([+-])/)
  return { atoms, charge: charge ? (charge[1] ? Number(charge[1]) : 1) * (charge[2] === '+' ? 1 : -1) : 0 }
}

function side(list, getEntity) {
  const atoms = {}
  let charge = 0
  const missing = []
  for (const { id, n } of list) {
    const parsed = SPECIAL[id] ?? parseFormula(getEntity(id)?.facts?.formula)
    if (!parsed) {
      missing.push(id)
      continue
    }
    for (const [element, count] of Object.entries(parsed.atoms)) atoms[element] = (atoms[element] ?? 0) + count * n
    charge += parsed.charge * n
  }
  return { atoms, charge, missing }
}

/**
 * Balance of a reaction block ({ reactants, products }):
 *   { status, elements: [{ element, left, right, balanced }], charge: { left, right, balanced }, missing: [compound ids], words }
 * status: 'balanced' (atoms, hydrogens and charge), 'heavy-atoms' (every element but H and charge), 'unbalanced', or
 * 'unknown' (a participant has no plain formula, so nothing is claimed). `elements` is ordered C, H, then alphabetically.
 */
export function balanceOf(reaction, getEntity) {
  const left = side(reaction.reactants ?? [], getEntity)
  const right = side(reaction.products ?? [], getEntity)
  const missing = [...new Set([...left.missing, ...right.missing])]
  const names = [...new Set([...Object.keys(left.atoms), ...Object.keys(right.atoms)])]
  const order = (element) => (element === 'C' ? 0 : element === 'H' ? 1 : 2)
  const elements = names
    .sort((a, b) => order(a) - order(b) || a.localeCompare(b))
    .map((element) => ({ element, left: left.atoms[element] ?? 0, right: right.atoms[element] ?? 0, balanced: (left.atoms[element] ?? 0) === (right.atoms[element] ?? 0) }))
  const charge = { left: left.charge, right: right.charge, balanced: left.charge === right.charge }
  if (missing.length) return { status: 'unknown', elements, charge, missing, words: 'Not checked: not every participant has a stored formula.' }
  const heavy = elements.filter((item) => item.element !== 'H').every((item) => item.balanced)
  const all = elements.every((item) => item.balanced) && charge.balanced
  if (all) return { status: 'balanced', elements, charge, missing, words: 'Atoms, hydrogens and charge balance.' }
  if (heavy) return { status: 'heavy-atoms', elements, charge, missing, words: 'Every heavy atom balances; hydrogen or charge differs because the stored formulas use different ionisation forms.' }
  return { status: 'unbalanced', elements, charge, missing, words: 'The stored formulas do not balance.' }
}
