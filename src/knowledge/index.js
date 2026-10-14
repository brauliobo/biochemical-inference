// Public entry point: the ready-to-use knowledge graph plus helpers bound to it.
// Validation (zod) is deliberately NOT imported here; use `npm run kb:validate` or
// import { validateKnowledge } from './validate.js' where needed.
import entities from './data/index.js'
import guidedPaths from './data/paths.js'
import quantData from './data/quant.js'
import { buildGraph, connectedComponents, shortestPath } from './graph.js'
import { homeModel, hubModel, pageModel, search } from './page-model.js'
import { pathListModel, pathModel, pathsContaining } from './guided-paths.js'
import * as quantApi from './quant.js'
import * as causalApi from './causal.js'

export const graph = buildGraph(entities)

/** Curated guided paths: [{ id, title, summary, steps: [{ id, why }] }] in reading order. */
export const paths = guidedPaths
export const pathList = () => pathListModel(guidedPaths)
export const getPath = (id) => pathModel(graph, guidedPaths.find((item) => item.id === id))
export const pathsFor = (entityId) => pathsContaining(guidedPaths, entityId)

// Structured quantities (doses, intake limits, contents, molar masses, fluxes): see quant.js and data/quant.js.
export const quant = quantData
export const quantIndex = quantApi.makeQuantIndex(quantData)
export const quantOf = (id) => quantApi.quantOf(quantIndex, id)
export const quantFor = (subject, filter) => quantApi.quantFor(quantIndex, subject, filter)
export const limitsFor = (subject) => quantApi.limitsFor(quantIndex, subject)
export const molarMassOf = (subject, basis) => quantApi.molarMassOf(quantIndex, subject, basis)
export const contentFraction = (subject, component) => quantApi.contentFraction(quantIndex, subject, component)
export const convertDose = (options) => quantApi.convertDose(quantIndex, options)
export const cholineForGlycine = (options) => quantApi.cholineForGlycine(quantIndex, options)
export const glycineFromCholine = (options) => quantApi.glycineFromCholine(quantIndex, options)
export const betaineHclAcid = (options) => quantApi.betaineHclAcid(quantIndex, options)

// Signed causal model over the graph: tiered nodes, signed edges, hypothesis layer, topic slices.
export const causalGraph = (options) => causalApi.causalGraph(graph, options)
export const upstream = (id, options) => causalApi.upstream(graph, id, options)
export const downstream = (id, options) => causalApi.downstream(graph, id, options)
export const causalSlices = () => causalApi.causalSlices(graph, guidedPaths)
export const causalSlice = (id) => causalApi.causalSlice(graph, guidedPaths, id)
export const typeMatrix = (options) => causalApi.typeMatrix(graph, options)

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
export { checkPaths, pathModel, pathListModel, pathsContaining, PATH_RULES } from './guided-paths.js'
export { KINDS as QUANT_KINDS, UNITS as QUANT_UNITS, convertUnit, gasMolarVolume, co2VolumeFromAcid, makeQuantIndex } from './quant.js'
export { TIERS, tierOf } from './causal.js'
export { CAUSAL_RELATIONS, edgeSign, intrinsicSign } from './relations.js'
