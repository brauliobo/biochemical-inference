// Public entry point: the ready-to-use knowledge graph plus helpers bound to it.
// Validation (zod) is deliberately NOT imported here; use `npm run kb:validate` or
// import { validateKnowledge } from './validate.js' where needed.
import entities from './data/index.js'
import { buildGraph, connectedComponents, shortestPath } from './graph.js'
import { homeModel, hubModel, pageModel, search } from './page-model.js'

export const graph = buildGraph(entities)

export const getEntity = (id) => graph.get(id)
export const page = (id) => pageModel(graph, id)
export const hub = (type) => hubModel(graph, type)
export const home = () => homeModel(graph)
export const find = (query, options) => search(graph, query, options)
export const pathBetween = (from, to, options) => shortestPath(graph, from, to, options)
export const components = () => connectedComponents(graph)

export { TYPES, TYPE_IDS, typeLabel, typeMeta } from './types.js'
export { RELATIONS, labelFor, inverseOf, relationInfo } from './relations.js'
export { evidenceInfo, EVIDENCE_GRADES } from './evidence.js'
export { parseId, isId, makeId } from './ids.js'
export { buildGraph, connectedComponents, shortestPath } from './graph.js'
export { pageModel, hubModel, homeModel, search, seeAlso } from './page-model.js'
