import { XMLParser } from 'fast-xml-parser'
import yauzl from 'yauzl'
import yazl from 'yazl'
import { ExperimentSchema, PortfolioModelSchema } from '../../shared/portfolio-contracts.js'
import { modelDigest } from './identity.js'

export const COMBINE_PROFILE = 'portfolio-combine-1.0'
const MAX_ARCHIVE_BYTES = 2_000_000
const MAX_ENTRY_BYTES = 2_000_000
const MAX_TOTAL_BYTES = 5_000_000
const MAX_ENTRIES = 32
const MAX_COMPRESSION_RATIO = 100

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;')

function safeXml(xml, path) {
  if (Buffer.byteLength(xml) > MAX_ENTRY_BYTES) throw new Error(`${path}: XML exceeds the ${MAX_ENTRY_BYTES} byte profile limit`)
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error(`${path}: DTD and entity declarations are forbidden`)
  if (/\b(?:href|source|location)\s*=\s*["'](?:https?|ftp|file):/i.test(xml)) throw new Error(`${path}: remote or file references are forbidden`)
  if (/<(?:\w+:)?(?:event|listOfEvents|rule|listOfRules|functionDefinition|listOfFunctionDefinitions|comp:|qual:|distrib:)/i.test(xml)) throw new Error(`${path}: unsupported SBML semantics are present`)
  return xml
}

function parser() {
  return new XMLParser({ ignoreAttributes: false, processEntities: false, allowBooleanAttributes: false, parseTagValue: false, trimValues: true })
}

const asArray = (value) => value === undefined ? [] : Array.isArray(value) ? value : [value]

function assertSameIds(actual, expected, path, kind) {
  const left = [...actual].sort().join(',')
  const right = [...expected].sort().join(',')
  if (left !== right) throw new Error(`${path}: SBML ${kind} do not match the portfolio contract`)
}

function verifySbmlProjection(sbmlModel, model, path) {
  const species = asArray(sbmlModel.listOfSpecies?.species)
  const parameters = asArray(sbmlModel.listOfParameters?.parameter)
  const reactions = asArray(sbmlModel.listOfReactions?.reaction)
  const expectedSpecies = model.engine.type === 'fba' ? model.definition.metabolites : model.definition.species
  assertSameIds(species.map((item) => item['@_id']), expectedSpecies.map((item) => item.id), path, 'species')
  assertSameIds(reactions.map((item) => item['@_id']), model.definition.reactions.map((item) => item.id), path, 'reactions')
  if (model.engine.type === 'fba') {
    const parameterValues = new Map(parameters.map((item) => [item['@_id'], Number(item['@_value'])]))
    for (const reaction of model.definition.reactions) {
      if (parameterValues.get(`LB_${reaction.id}`) !== reaction.lowerBound) throw new Error(`${path}: FBA lower bound ${reaction.id} does not match the contract`)
      if (reaction.upperBound !== null && parameterValues.get(`UB_${reaction.id}`) !== reaction.upperBound) throw new Error(`${path}: FBA upper bound ${reaction.id} does not match the contract`)
    }
    const objectiveReaction = sbmlModel['fbc:listOfObjectives']?.['fbc:objective']?.['fbc:listOfFluxObjectives']?.['fbc:fluxObjective']?.['@_fbc:reaction']
    if (objectiveReaction !== model.definition.objective.reactionId) throw new Error(`${path}: FBA objective does not match the contract`)
  } else {
    const speciesValues = new Map(species.map((item) => [item['@_id'], Number(item[model.engine.type === 'ode' ? '@_initialConcentration' : '@_initialAmount'])]))
    const parameterValues = new Map(parameters.map((item) => [item['@_id'], Number(item['@_value'])]))
    for (const item of model.definition.species) if (speciesValues.get(item.id) !== item.initial) throw new Error(`${path}: initial state ${item.id} does not match the contract`)
    for (const item of model.definition.parameters) if (parameterValues.get(item.id) !== item.value) throw new Error(`${path}: parameter ${item.id} does not match the contract`)
    for (const expected of model.definition.reactions) {
      const reaction = reactions.find((item) => item['@_id'] === expected.id)
      const reactants = asArray(reaction?.listOfReactants?.speciesReference).map((item) => item['@_species'])
      const products = asArray(reaction?.listOfProducts?.speciesReference).map((item) => item['@_species'])
      const kineticIdentifiers = asArray(reaction?.kineticLaw?.math?.apply?.ci).map(String)
      if (reactants.length !== 1 || reactants[0] !== expected.reactant) throw new Error(`${path}: reaction ${expected.id} reactant does not match the contract`)
      assertSameIds(products, expected.products.map((item) => item.speciesId), path, `reaction ${expected.id} products`)
      if (!kineticIdentifiers.includes(expected.rateConstantId) || !kineticIdentifiers.includes(expected.reactant)) throw new Error(`${path}: reaction ${expected.id} kinetic law does not match the contract`)
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
  const contract = Buffer.from(JSON.stringify(model)).toString('base64')
  const dynamicSpecies = model.engine.type === 'fba'
    ? model.definition.metabolites.map((item) => `      <species id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" compartment="cell" initialAmount="0" hasOnlySubstanceUnits="true" boundaryCondition="false" constant="false"/>`).join('\n')
    : model.definition.species.map((item) => `      <species id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" compartment="cell" ${model.engine.type === 'ode' ? 'initialConcentration' : 'initialAmount'}="${item.initial}" hasOnlySubstanceUnits="${model.engine.type === 'ssa'}" boundaryCondition="false" constant="false"/>`).join('\n')
  const parameters = model.engine.type === 'fba'
    ? model.definition.reactions.flatMap((reaction) => [
        `      <parameter id="LB_${escapeXml(reaction.id)}" value="${reaction.lowerBound}" constant="true"/>`,
        reaction.upperBound === null ? '' : `      <parameter id="UB_${escapeXml(reaction.id)}" value="${reaction.upperBound}" constant="true"/>`
      ]).filter(Boolean).join('\n')
    : model.definition.parameters.map((item) => `      <parameter id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" value="${item.value}" constant="true"/>`).join('\n')
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
  <model id="${escapeXml(model.id)}" name="${escapeXml(model.name)}">
    <annotation><portfolio:contract encoding="base64-json">${contract}</portfolio:contract></annotation>
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
  if (!Buffer.isBuffer(buffer) || buffer.length === 0 || buffer.length > MAX_ARCHIVE_BYTES) return Promise.reject(new Error(`archive: compressed archive must be 1..${MAX_ARCHIVE_BYTES} bytes`))
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
