// Concatenation of every data file's default export. Static imports on purpose (no import.meta.glob)
// so the same module loads in node, vitest and the browser bundle.
import compounds from './compounds.js'
import interventions from './interventions.js'
import enzymes from './enzymes.js'
import reactions from './reactions.js'
import pathways from './pathways.js'
import states from './states.js'
import diseases from './diseases.js'
import outcomes from './outcomes.js'
import systems from './systems.js'
import claims from './claims.js'
import articles from './articles.js'

export default [
  ...compounds,
  ...interventions,
  ...enzymes,
  ...reactions,
  ...pathways,
  ...states,
  ...diseases,
  ...outcomes,
  ...systems,
  ...claims,
  ...articles
]
