// Lazy access to the knowledge engine for the few places that must render before
// the data is needed (the home page and its search box). The engine and all entity
// data are about 185 kB gzipped; importing them statically from the home route would
// push its initial JavaScript past the 100 kB budget in docs/USABILITY.md (F4).
// Views that always need the data (entity, listing, map) import the engine statically.
import { shallowRef } from 'vue'

/** The engine module once loaded, else null. Reactive: read it inside computed/effects. */
export const knowledgeModule = shallowRef(null)

let pending = null

/** Start (or join) loading the engine; resolves with the module. Safe to call repeatedly. */
export function loadKnowledge() {
  pending ??= import('../knowledge/index.js').then((module) => {
    knowledgeModule.value = module
    return module
  })
  return pending
}
