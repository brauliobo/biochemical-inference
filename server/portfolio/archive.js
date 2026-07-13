import { XMLParser } from 'fast-xml-parser'
import yauzl from 'yauzl'
import yazl from 'yazl'
import { canonicalJson } from '../../shared/canonical-json.js'
import { ExperimentSchema, PORTFOLIO_MAX_ARCHIVE_BYTES, PortfolioModelSchema } from '../../shared/portfolio-contracts.js'
import { modelDigest } from './identity.js'

export const COMBINE_PROFILE = 'portfolio-combine-1.0'
const MAX_ENTRY_BYTES = 2_000_000
const MAX_TOTAL_BYTES = 5_000_000
const MAX_ENTRIES = 32
const MAX_COMPRESSION_RATIO = 100

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

function safeXml(xml, path) {
  if (Buffer.byteLength(xml) > MAX_ENTRY_BYTES) throw new Error(`${path}: XML exceeds the ${MAX_ENTRY_BYTES} byte profile limit`)
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error(`${path}: DTD and entity declarations are forbidden`)
  if (/\b(?:href|source|location)\s*=\s*["'](?:https?|ftp|file):/i.test(xml)) throw new Error(`${path}: remote or file references are forbidden`)
  if (/<(?:\w+:)?(?:event|listOfEvents|rule|listOfRules|functionDefinition|listOfFunctionDefinitions|initialAssignment|listOfInitialAssignments|stoichiometryMath|modifierSpeciesReference|listOfModifiers|localParameter|listOfLocalParameters|delay|comp:|qual:|distrib:)/i.test(xml)) throw new Error(`${path}: unsupported SBML semantics are present`)
  return xml
}

function parser() {
  return new XMLParser({ ignoreAttributes: false, processEntities: false, allowBooleanAttributes: false, parseTagValue: false, trimValues: true })
}

const asArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value]

const ZERO = { amount: 0, mass: 0, length: 0, time: 0, temperature: 0, current: 0, luminosity: 0 }
const SUPPORTED_SBML_UNITS = Object.freeze({
  molar: {
    contract: { id: 'molar', symbol: 'mol/L', scaleToSI: 1000, dimension: { ...ZERO, amount: 1, length: -3 } },
    factors: [{ kind: 'mole', exponent: 1, scale: 0, multiplier: 1 }, { kind: 'metre', exponent: -3, scale: 0, multiplier: 1 }]
  },
  molecule: {
    contract: { id: 'molecule', symbol: 'molecule', scaleToSI: 1 / 6.02214076e23, dimension: { ...ZERO, amount: 1 } },
    factors: [{ kind: 'mole', exponent: 1, scale: 0, multiplier: 1 / 6.02214076e23 }]
  },
  per_second: {
    contract: { id: 'per_second', symbol: 's^-1', scaleToSI: 1, dimension: { ...ZERO, time: -1 } },
    factors: [{ kind: 'second', exponent: -1, scale: 0, multiplier: 1 }]
  },
  millimole_per_gram_hour: {
    contract: { id: 'millimole_per_gram_hour', symbol: 'mmol gDW^-1 h^-1', scaleToSI: 1 / 3600, dimension: { ...ZERO, amount: 1, mass: -1, time: -1 } },
    factors: [{ kind: 'mole', exponent: 1, scale: 0, multiplier: 1 }, { kind: 'kilogram', exponent: -1, scale: 0, multiplier: 1 }, { kind: 'second', exponent: -1, scale: 0, multiplier: 3600 }]
  }
})

function supportedUnit(unit, path) {
  const supported = SUPPORTED_SBML_UNITS[unit.id]
  if (!supported || canonicalJson(supported.contract) !== canonicalJson(unit)) throw new Error(`${path}: unit ${unit.id} is outside the exact supported SBML profile`)
  return supported
}

function modelUnits(model, path) {
  const units = model.engine.type === 'fba'
    ? [...model.definition.reactions.map((item) => item.unit), model.definition.objective.unit, ...model.observables.map((item) => item.unit)]
    : [...model.definition.species.map((item) => item.unit), ...model.definition.parameters.map((item) => item.unit), ...model.observables.map((item) => item.unit)]
  const byId = new Map()
  for (const unit of units) {
    supportedUnit(unit, path)
    const existing = byId.get(unit.id)
    if (existing && canonicalJson(existing) !== canonicalJson(unit)) throw new Error(`${path}: unit identifier ${unit.id} has conflicting definitions`)
    byId.set(unit.id, unit)
  }
  return [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))
}

function unitDefinitionsXml(model) {
  const definitions = modelUnits(model, 'model.xml').map((unit) => {
    const factors = supportedUnit(unit, 'model.xml').factors.map((factor) => `<unit kind="${factor.kind}" exponent="${factor.exponent}" scale="${factor.scale}" multiplier="${factor.multiplier}"/>`).join('')
    return `      <unitDefinition id="${escapeXml(unit.id)}"><listOfUnits>${factors}</listOfUnits></unitDefinition>`
  }).join('\n')
  return `    <listOfUnitDefinitions>\n${definitions}\n    </listOfUnitDefinitions>`
}

function assertSameIds(actual, expected, path, kind) {
  const left = [...actual].sort().join(',')
  const right = [...expected].sort().join(',')
  if (left !== right) throw new Error(`${path}: SBML ${kind} do not match the portfolio contract`)
}

function assertAttribute(node, name, expected, path) {
  const actual = node?.[`@_${name}`]
  if (String(actual) !== String(expected)) throw new Error(`${path}: ${name} must be ${expected}`)
}

function assertNoAttribute(node, name, path) {
  if (node && Object.hasOwn(node, `@_${name}`)) throw new Error(`${path}: ${name} is not permitted`)
}

function verifyUnitDefinitions(sbmlModel, model, path) {
  const expectedUnits = modelUnits(model, path)
  const definitions = asArray(sbmlModel.listOfUnitDefinitions?.unitDefinition)
  assertSameIds(definitions.map((item) => item['@_id']), expectedUnits.map((item) => item.id), path, 'unit definitions')
  for (const unit of expectedUnits) {
    const definition = definitions.find((item) => item['@_id'] === unit.id)
    if (Object.keys(definition).sort().join(',') !== '@_id,listOfUnits') throw new Error(`${path}: unit definition ${unit.id} contains unsupported structure`)
    const factors = asArray(definition?.listOfUnits?.unit)
    const expected = supportedUnit(unit, path).factors
    if (factors.length !== expected.length) throw new Error(`${path}: unit definition ${unit.id} does not match the supported profile`)
    for (const [index, factor] of factors.entries()) {
      const attributes = Object.fromEntries(Object.entries(factor).filter(([key]) => key.startsWith('@_')).map(([key, value]) => [key.slice(2), String(value)]))
      const expectedAttributes = Object.fromEntries(Object.entries(expected[index]).map(([key, value]) => [key, String(value)]))
      if (Object.keys(factor).some((key) => !key.startsWith('@_')) || canonicalJson(attributes) !== canonicalJson(expectedAttributes)) throw new Error(`${path}: unit definition ${unit.id} factor ${index} does not match the supported profile`)
    }
  }
}

function verifySpeciesReferenceList(container, expected, path) {
  const references = asArray(container?.speciesReference)
  if (references.length !== expected.length) throw new Error(`${path}: stoichiometric participant count does not match the contract`)
  assertSameIds(references.map((item) => item['@_species']), expected.map((item) => item.speciesId), path, 'stoichiometric participants')
  for (const participant of expected) {
    const matches = references.filter((item) => item['@_species'] === participant.speciesId)
    const keys = matches.length === 1 ? Object.keys(matches[0]).sort().join(',') : ''
    if (matches.length !== 1 || keys !== '@_constant,@_species,@_stoichiometry' || Number(matches[0]['@_stoichiometry']) !== participant.stoichiometry || String(matches[0]['@_constant']) !== 'true') throw new Error(`${path}: stoichiometric coefficient for ${participant.speciesId} does not match the contract`)
  }
}

function verifyFirstOrderMath(reaction, expected, path) {
  const math = reaction.kineticLaw?.math
  const apply = math?.apply
  if (!math || String(math['@_xmlns']) !== 'http://www.w3.org/1998/Math/MathML' || Object.keys(math).sort().join(',') !== '@_xmlns,apply') throw new Error(`${path}: reaction ${expected.id} MathML root does not match the supported profile`)
  if (!apply || Object.keys(apply).sort().join(',') !== 'ci,times' || apply.times !== '') throw new Error(`${path}: reaction ${expected.id} kinetic law must be one exact multiply AST`)
  const identifiers = asArray(apply.ci).map((item) => typeof item === 'string' ? item : item?.['#text'])
  if (canonicalJson(identifiers) !== canonicalJson([expected.rateConstantId, expected.reactant])) throw new Error(`${path}: reaction ${expected.id} kinetic multiply operands do not match the contract`)
}

function verifySbmlProjection(sbmlModel, model, path) {
  const species = asArray(sbmlModel.listOfSpecies?.species)
  const parameters = asArray(sbmlModel.listOfParameters?.parameter)
  const reactions = asArray(sbmlModel.listOfReactions?.reaction)
  const expectedSpecies = model.engine.type === 'fba' ? model.definition.metabolites : model.definition.species
  assertSameIds(species.map((item) => item['@_id']), expectedSpecies.map((item) => item.id), path, 'species')
  assertSameIds(reactions.map((item) => item['@_id']), model.definition.reactions.map((item) => item.id), path, 'reactions')
  assertAttribute(sbmlModel, 'timeUnits', 'second', path)
  assertNoAttribute(sbmlModel, 'conversionFactor', path)
  verifyUnitDefinitions(sbmlModel, model, path)
  for (const item of species) {
    assertAttribute(item, 'boundaryCondition', 'false', `${path}: species ${item['@_id']}`)
    assertAttribute(item, 'constant', 'false', `${path}: species ${item['@_id']}`)
    assertNoAttribute(item, 'conversionFactor', `${path}: species ${item['@_id']}`)
  }
  if (model.engine.type === 'fba') {
    if (model.definition.reactions.some((reaction) => reaction.lowerBound < 0)) throw new Error(`${path}: reversible FBA bounds are outside the supported profile`)
    const expectedParameterIds = model.definition.reactions.flatMap((reaction) => [`LB_${reaction.id}`, ...(reaction.upperBound === null ? [] : [`UB_${reaction.id}`])])
    assertSameIds(parameters.map((item) => item['@_id']), expectedParameterIds, path, 'FBA bound parameters')
    for (const reaction of model.definition.reactions) {
      const projected = reactions.find((item) => item['@_id'] === reaction.id)
      if (projected.kineticLaw !== undefined) throw new Error(`${path}: FBA reaction ${reaction.id} cannot contain a kinetic law`)
      assertAttribute(projected, 'reversible', 'false', `${path}: reaction ${reaction.id}`)
      assertAttribute(projected, 'fbc:lowerFluxBound', `LB_${reaction.id}`, `${path}: reaction ${reaction.id}`)
      if (reaction.upperBound === null) assertNoAttribute(projected, 'fbc:upperFluxBound', `${path}: reaction ${reaction.id}`)
      else assertAttribute(projected, 'fbc:upperFluxBound', `UB_${reaction.id}`, `${path}: reaction ${reaction.id}`)
      const lower = parameters.find((item) => item['@_id'] === `LB_${reaction.id}`)
      if (Number(lower?.['@_value']) !== reaction.lowerBound) throw new Error(`${path}: FBA lower bound ${reaction.id} does not match the contract`)
      assertAttribute(lower, 'constant', 'true', `${path}: FBA lower bound ${reaction.id}`)
      assertAttribute(lower, 'units', reaction.unit.id, `${path}: FBA lower bound ${reaction.id}`)
      if (reaction.upperBound !== null) {
        const upper = parameters.find((item) => item['@_id'] === `UB_${reaction.id}`)
        if (Number(upper?.['@_value']) !== reaction.upperBound) throw new Error(`${path}: FBA upper bound ${reaction.id} does not match the contract`)
        assertAttribute(upper, 'constant', 'true', `${path}: FBA upper bound ${reaction.id}`)
        assertAttribute(upper, 'units', reaction.unit.id, `${path}: FBA upper bound ${reaction.id}`)
      }
      const reactants = Object.entries(reaction.stoichiometry).filter(([, coefficient]) => coefficient < 0).map(([speciesId, coefficient]) => ({ speciesId, stoichiometry: Math.abs(coefficient) }))
      const products = Object.entries(reaction.stoichiometry).filter(([, coefficient]) => coefficient > 0).map(([speciesId, stoichiometry]) => ({ speciesId, stoichiometry }))
      verifySpeciesReferenceList(projected.listOfReactants, reactants, `${path}: reaction ${reaction.id} reactants`)
      verifySpeciesReferenceList(projected.listOfProducts, products, `${path}: reaction ${reaction.id} products`)
    }
    const objectives = sbmlModel['fbc:listOfObjectives']
    const objective = asArray(objectives?.['fbc:objective'])
    const fluxObjectives = asArray(objective[0]?.['fbc:listOfFluxObjectives']?.['fbc:fluxObjective'])
    if (objectives?.['@_fbc:activeObjective'] !== 'objective' || objective.length !== 1 || objective[0]?.['@_fbc:id'] !== 'objective' || objective[0]?.['@_fbc:type'] !== model.definition.objective.direction || fluxObjectives.length !== 1 || fluxObjectives[0]?.['@_fbc:reaction'] !== model.definition.objective.reactionId || Number(fluxObjectives[0]?.['@_fbc:coefficient']) !== 1) throw new Error(`${path}: FBA objective reference, direction, or coefficient does not match the contract`)
  } else {
    assertSameIds(parameters.map((item) => item['@_id']), model.definition.parameters.map((item) => item.id), path, 'parameters')
    const speciesValues = new Map(species.map((item) => [item['@_id'], Number(item[model.engine.type === 'ode' ? '@_initialConcentration' : '@_initialAmount'])]))
    const parameterValues = new Map(parameters.map((item) => [item['@_id'], Number(item['@_value'])]))
    for (const item of model.definition.species) {
      if (speciesValues.get(item.id) !== item.initial) throw new Error(`${path}: initial state ${item.id} does not match the contract`)
      const projected = species.find((candidate) => candidate['@_id'] === item.id)
      assertAttribute(projected, 'substanceUnits', item.unit.id, `${path}: species ${item.id}`)
      assertAttribute(projected, 'hasOnlySubstanceUnits', model.engine.type === 'ssa' ? 'true' : 'false', `${path}: species ${item.id}`)
    }
    for (const item of model.definition.parameters) {
      if (parameterValues.get(item.id) !== item.value) throw new Error(`${path}: parameter ${item.id} does not match the contract`)
      const projected = parameters.find((candidate) => candidate['@_id'] === item.id)
      assertAttribute(projected, 'constant', 'true', `${path}: parameter ${item.id}`)
      assertAttribute(projected, 'units', item.unit.id, `${path}: parameter ${item.id}`)
    }
    for (const expected of model.definition.reactions) {
      const reaction = reactions.find((item) => item['@_id'] === expected.id)
      assertAttribute(reaction, 'reversible', 'false', `${path}: reaction ${expected.id}`)
      verifySpeciesReferenceList(reaction?.listOfReactants, [{ speciesId: expected.reactant, stoichiometry: 1 }], `${path}: reaction ${expected.id} reactants`)
      verifySpeciesReferenceList(reaction?.listOfProducts, expected.products, `${path}: reaction ${expected.id} products`)
      verifyFirstOrderMath(reaction, expected, path)
    }
  }
}

function verifySedmlProjection(sedml, experiment, path) {
  const modelSource = sedml.listOfModels?.model?.['@_source']
  if (modelSource !== 'model.xml') throw new Error(`${path}: SED-ML model source must be model.xml`)
  const simulation = experiment.engine.type === 'fba' ? sedml.listOfSimulations?.steadyState : sedml.listOfSimulations?.uniformTimeCourse
  if (!simulation) throw new Error(`${path}: SED-ML simulation type does not match the experiment`)
  const expectedKisao = experiment.engine.type === 'ode'
    ? experiment.controls.method === 'rk4' ? 'KISAO:0000032' : 'KISAO:0000087'
    : experiment.engine.type === 'ssa' ? 'KISAO:0000029' : 'KISAO:0000437'
  if (simulation.algorithm?.['@_kisaoID'] !== expectedKisao) throw new Error(`${path}: KiSAO algorithm does not match the experiment contract`)
  if (experiment.engine.type !== 'fba' && Number(simulation['@_outputEndTime']) !== experiment.controls.duration) throw new Error(`${path}: SED-ML duration does not match the experiment contract`)
}

function contractElement(xml, kind, path) {
  safeXml(xml, path)
  const root = parser().parse(xml)
  if (kind === 'model') {
    const sbml = root.sbml
    if (!sbml || String(sbml['@_level']) !== '3' || String(sbml['@_version']) !== '2') throw new Error(`${path}: only SBML Level 3 Version 2 is supported`)
    const encoded = sbml.model?.annotation?.['portfolio:contract']?.['#text'] ?? sbml.model?.annotation?.['portfolio:contract']
    if (typeof encoded !== 'string') throw new Error(`${path}: portfolio model contract annotation is required`)
    const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))
    const model = PortfolioModelSchema.parse(decoded)
    if (model.id !== sbml.model['@_id']) throw new Error(`${path}: SBML model identifier does not match its contract`)
    if (modelDigest(model) !== model.digest) throw new Error(`${path}: model digest does not match canonical model content`)
    verifySbmlProjection(sbml.model, model, path)
    return model
  }
  const sedml = root.sedML
  if (!sedml || String(sedml['@_level']) !== '1' || String(sedml['@_version']) !== '4') throw new Error(`${path}: only SED-ML Level 1 Version 4 is supported`)
  if (/<(?:\w+:)?(?:repeatedTask|listOfRepeatedTasks)/i.test(xml)) throw new Error(`${path}: repeated tasks are outside the supported SED-ML profile`)
  const encoded = sedml.annotation?.['portfolio:contract']?.['#text'] ?? sedml.annotation?.['portfolio:contract']
  if (typeof encoded !== 'string') throw new Error(`${path}: portfolio experiment contract annotation is required`)
  const experiment = ExperimentSchema.parse(JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')))
  verifySedmlProjection(sedml, experiment, path)
  return experiment
}

export function exportSbml(modelInput) {
  const model = PortfolioModelSchema.parse(modelInput)
  modelUnits(model, 'model.xml')
  if (model.engine.type === 'fba' && model.definition.reactions.some((reaction) => reaction.lowerBound < 0)) throw new Error('model.xml: reversible FBA bounds are outside the supported profile')
  const contract = Buffer.from(JSON.stringify(model)).toString('base64')
  const dynamicSpecies = model.engine.type === 'fba'
    ? model.definition.metabolites.map((item) => `      <species id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" compartment="cell" initialAmount="0" hasOnlySubstanceUnits="true" boundaryCondition="false" constant="false"/>`).join('\n')
    : model.definition.species.map((item) => `      <species id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" compartment="cell" ${model.engine.type === 'ode' ? 'initialConcentration' : 'initialAmount'}="${item.initial}" substanceUnits="${escapeXml(item.unit.id)}" hasOnlySubstanceUnits="${model.engine.type === 'ssa'}" boundaryCondition="false" constant="false"/>`).join('\n')
  const parameters = model.engine.type === 'fba'
    ? model.definition.reactions.flatMap((reaction) => [
        `      <parameter id="LB_${escapeXml(reaction.id)}" value="${reaction.lowerBound}" units="${escapeXml(reaction.unit.id)}" constant="true"/>`,
        reaction.upperBound === null ? '' : `      <parameter id="UB_${escapeXml(reaction.id)}" value="${reaction.upperBound}" units="${escapeXml(reaction.unit.id)}" constant="true"/>`
      ]).filter(Boolean).join('\n')
    : model.definition.parameters.map((item) => `      <parameter id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" value="${item.value}" units="${escapeXml(item.unit.id)}" constant="true"/>`).join('\n')
  const reactions = model.engine.type === 'fba'
    ? model.definition.reactions.map((reaction) => {
        const reactants = Object.entries(reaction.stoichiometry).filter(([, value]) => value < 0).map(([id, value]) => `<speciesReference species="${escapeXml(id)}" stoichiometry="${Math.abs(value)}" constant="true"/>`).join('')
        const products = Object.entries(reaction.stoichiometry).filter(([, value]) => value > 0).map(([id, value]) => `<speciesReference species="${escapeXml(id)}" stoichiometry="${value}" constant="true"/>`).join('')
        const upper = reaction.upperBound === null ? '' : ` fbc:upperFluxBound="UB_${escapeXml(reaction.id)}"`
        return `      <reaction id="${escapeXml(reaction.id)}" name="${escapeXml(reaction.name)}" reversible="false" fbc:lowerFluxBound="LB_${escapeXml(reaction.id)}"${upper}><listOfReactants>${reactants}</listOfReactants><listOfProducts>${products}</listOfProducts></reaction>`
      }).join('\n')
    : model.definition.reactions.map((reaction) => {
        const products = reaction.products.map((item) => `<speciesReference species="${escapeXml(item.speciesId)}" stoichiometry="${item.stoichiometry}" constant="true"/>`).join('')
        return `      <reaction id="${escapeXml(reaction.id)}" name="${escapeXml(reaction.name)}" reversible="false"><listOfReactants><speciesReference species="${escapeXml(reaction.reactant)}" stoichiometry="1" constant="true"/></listOfReactants><listOfProducts>${products}</listOfProducts><kineticLaw><math xmlns="http://www.w3.org/1998/Math/MathML"><apply><times/><ci>${escapeXml(reaction.rateConstantId)}</ci><ci>${escapeXml(reaction.reactant)}</ci></apply></math></kineticLaw></reaction>`
      }).join('\n')
  const objective = model.engine.type === 'fba' ? `\n    <fbc:listOfObjectives fbc:activeObjective="objective"><fbc:objective fbc:id="objective" fbc:type="maximize"><fbc:listOfFluxObjectives><fbc:fluxObjective fbc:reaction="${escapeXml(model.definition.objective.reactionId)}" fbc:coefficient="1"/></fbc:listOfFluxObjectives></fbc:objective></fbc:listOfObjectives>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<sbml xmlns="http://www.sbml.org/sbml/level3/version2/core" xmlns:fbc="http://www.sbml.org/sbml/level3/version1/fbc/version2" xmlns:portfolio="https://biochemical-inference.local/ns/portfolio/1" level="3" version="2" fbc:required="false">
  <model id="${escapeXml(model.id)}" name="${escapeXml(model.name)}" timeUnits="second">
    <annotation><portfolio:contract encoding="base64-json">${contract}</portfolio:contract></annotation>
${unitDefinitionsXml(model)}
    <listOfCompartments><compartment id="cell" size="1" constant="true"/></listOfCompartments>
    <listOfSpecies>
${dynamicSpecies}
    </listOfSpecies>
    <listOfParameters>
${parameters}
    </listOfParameters>
    <listOfReactions>
${reactions}
    </listOfReactions>${objective}
  </model>
</sbml>
`
}

export function exportSedml(experimentInput) {
  const experiment = ExperimentSchema.parse(experimentInput)
  const contract = Buffer.from(JSON.stringify(experiment)).toString('base64')
  const kisao = experiment.engine.type === 'ode'
    ? experiment.controls.method === 'rk4' ? 'KISAO:0000032' : 'KISAO:0000087'
    : experiment.engine.type === 'ssa' ? 'KISAO:0000029' : 'KISAO:0000437'
  const simulation = experiment.engine.type === 'fba'
    ? `<steadyState id="simulation"><algorithm kisaoID="${kisao}"/></steadyState>`
    : `<uniformTimeCourse id="simulation" initialTime="0" outputStartTime="0" outputEndTime="${experiment.controls.duration}" numberOfPoints="${Math.ceil(experiment.controls.duration / experiment.controls.outputInterval)}"><algorithm kisaoID="${kisao}"/></uniformTimeCourse>`
  return `<?xml version="1.0" encoding="UTF-8"?>
<sedML xmlns="http://sed-ml.org/sed-ml/level1/version4" xmlns:portfolio="https://biochemical-inference.local/ns/portfolio/1" level="1" version="4">
  <annotation><portfolio:contract encoding="base64-json">${contract}</portfolio:contract></annotation>
  <listOfModels><model id="model" language="urn:sedml:language:sbml.level-3.version-2" source="model.xml"/></listOfModels>
  <listOfSimulations>${simulation}</listOfSimulations>
  <listOfTasks><task id="task" modelReference="model" simulationReference="simulation"/></listOfTasks>
</sedML>
`
}

export function importSbml(xml, path = 'model.xml') {
  return contractElement(xml, 'model', path)
}

export function importSedml(xml, path = 'experiment.sedml') {
  return contractElement(xml, 'experiment', path)
}

function readArchive(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > PORTFOLIO_MAX_ARCHIVE_BYTES) return Promise.reject(new Error(`archive: compressed archive must be 1..${PORTFOLIO_MAX_ARCHIVE_BYTES} bytes`))
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true, decodeStrings: true, validateEntrySizes: true }, (openError, zip) => {
      if (openError) return reject(openError)
      const files = new Map()
      let entries = 0
      let total = 0
      let failed = false
      const fail = (error) => {
        if (failed) return
        failed = true
        zip.close()
        reject(error)
      }
      zip.on('error', fail)
      zip.on('entry', (entry) => {
        entries += 1
        const path = entry.fileName
        if (entries > MAX_ENTRIES) return fail(new Error(`archive: more than ${MAX_ENTRIES} entries`))
        if (path.includes('\\') || path.startsWith('/') || path.split('/').includes('..') || path.includes('\0')) return fail(new Error(`${path}: unsafe archive path`))
        if (/\/$/.test(path)) return zip.readEntry()
        if (files.has(path)) return fail(new Error(`${path}: duplicate archive entry`))
        if (entry.uncompressedSize > MAX_ENTRY_BYTES) return fail(new Error(`${path}: entry exceeds ${MAX_ENTRY_BYTES} bytes`))
        if (entry.compressedSize > 0 && entry.uncompressedSize / entry.compressedSize > MAX_COMPRESSION_RATIO) return fail(new Error(`${path}: compression ratio exceeds ${MAX_COMPRESSION_RATIO}`))
        total += entry.uncompressedSize
        if (total > MAX_TOTAL_BYTES) return fail(new Error(`archive: expanded content exceeds ${MAX_TOTAL_BYTES} bytes`))
        zip.openReadStream(entry, (streamError, stream) => {
          if (streamError) return fail(streamError)
          const chunks = []
          let bytes = 0
          stream.on('data', (chunk) => {
            bytes += chunk.length
            if (bytes > MAX_ENTRY_BYTES) return fail(new Error(`${path}: streamed entry exceeds limit`))
            chunks.push(chunk)
          })
          stream.on('error', fail)
          stream.on('end', () => {
            if (failed) return
            files.set(path, Buffer.concat(chunks))
            zip.readEntry()
          })
        })
      })
      zip.on('end', () => { if (!failed) resolve(files) })
      zip.readEntry()
    })
  })
}

export async function exportCombineArchive(model, experiment) {
  const zip = new yazl.ZipFile()
  zip.addBuffer(Buffer.from(exportSbml(model)), 'model.xml', { compress: true })
  zip.addBuffer(Buffer.from(exportSedml(experiment)), 'experiment.sedml', { compress: true })
  zip.addBuffer(Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>\n<omexManifest xmlns="http://identifiers.org/combine.specifications/omex-manifest"><content location="." format="http://identifiers.org/combine.specifications/omex"/><content location="model.xml" format="http://identifiers.org/combine.specifications/sbml.level-3.version-2" master="false"/><content location="experiment.sedml" format="http://identifiers.org/combine.specifications/sed-ml.level-1.version-4" master="true"/></omexManifest>\n`), 'manifest.xml', { compress: true })
  zip.end()
  const chunks = []
  return new Promise((resolve, reject) => {
    zip.outputStream.on('data', (chunk) => chunks.push(chunk))
    zip.outputStream.on('error', reject)
    zip.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

export async function validateCombineArchive(buffer) {
  try {
    const files = await readArchive(buffer)
    const allowed = new Set(['manifest.xml', 'model.xml', 'experiment.sedml'])
    for (const path of files.keys()) if (!allowed.has(path)) throw new Error(`${path}: unsupported archive entry`)
    for (const required of allowed) if (!files.has(required)) throw new Error(`${required}: required archive entry is missing`)
    const manifest = files.get('manifest.xml').toString('utf8')
    safeXml(manifest, 'manifest.xml')
    if (!/location="model\.xml"/.test(manifest) || !/location="experiment\.sedml"/.test(manifest)) throw new Error('manifest.xml: model and experiment entries must be declared')
    const model = importSbml(files.get('model.xml').toString('utf8'))
    const experiment = importSedml(files.get('experiment.sedml').toString('utf8'))
    if (experiment.modelId !== model.id || experiment.modelDigest !== model.digest) throw new Error('experiment.sedml: experiment does not pin the imported model digest')
    return { valid: true, profile: COMBINE_PROFILE, findings: [], model, experiment }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Archive validation failed.'
    const separator = message.indexOf(':')
    const path = separator > 0 ? message.slice(0, separator) : 'archive'
    return { valid: false, profile: COMBINE_PROFILE, findings: [{ code: 'archive_validation', path, message }], model: null, experiment: null }
  }
}
