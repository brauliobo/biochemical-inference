// Deliberately invalid data for the kb:validate CLI test: a dangling relation and a bad summary.
export default [
  { id: 'compound:alpha', type: 'compound', name: 'Alpha', summary: 'Has a dangling relation.', evidence: 'plausible', relations: [{ rel: 'precursor-of', to: 'compound:missing' }] },
  { id: 'compound:beta', type: 'compound', name: 'Beta', summary: 'x'.repeat(250), evidence: 'plausible' }
]
