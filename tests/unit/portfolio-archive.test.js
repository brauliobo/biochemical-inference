import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { exportCombineArchive, exportSbml, exportSedml, importSbml, importSedml, validateCombineArchive } from '../../server/portfolio/archive.js'
import { FBA_MODEL, ODE_MODEL, SSA_MODEL } from '../../server/portfolio/registry.js'
import { benchmarkExperiment } from '../fixtures/portfolio/experiments.js'

const fixture = (name) => readFile(resolve(process.cwd(), 'tests/fixtures/portfolio', name), 'utf8')

function replaceAllBytes(buffer, source, replacement) {
  const result = Buffer.from(buffer)
  const from = Buffer.from(source)
  const to = Buffer.from(replacement)
  if (from.length !== to.length) throw new Error('replacement must preserve ZIP field lengths')
  let offset = 0
  while ((offset = result.indexOf(from, offset)) !== -1) {
    to.copy(result, offset)
    offset += to.length
  }
  return result
}

describe('SBML, SED-ML, and COMBINE profile', () => {
  it('round-trips a validated model and controlled experiment archive', async () => {
    for (const model of [ODE_MODEL, SSA_MODEL, FBA_MODEL]) {
      const experiment = benchmarkExperiment(model)
      const archive = await exportCombineArchive(model, experiment)
      const imported = await validateCombineArchive(archive)

      expect(imported.valid).toBe(true)
      expect(imported.model).toEqual(model)
      expect(imported.experiment).toEqual(experiment)
      expect(importSbml(exportSbml(model))).toEqual(model)
    }
  })

  it('rejects DTD/entities, external references, and unsupported event semantics before parsing contracts', async () => {
    const doctype = await fixture('invalid-doctype.xml')
    const external = await fixture('invalid-external.sedml')
    const unsupported = await fixture('unsupported-event.xml')
    expect(() => importSbml(doctype)).toThrow(/DTD and entity/)
    expect(() => importSedml(external)).toThrow(/remote or file references/)
    expect(() => importSbml(unsupported)).toThrow(/unsupported SBML semantics/)
    expect(() => importSbml(exportSbml(ODE_MODEL).replace('initialConcentration="10"', 'initialConcentration="11"'))).toThrow(/initial state A does not match/)
    expect(() => importSedml(exportSedml(benchmarkExperiment(ODE_MODEL)).replace('KISAO:0000087', 'KISAO:0000032'))).toThrow(/KiSAO algorithm does not match/)
  })

  it('rejects independently tampered SBML and FBC executable projections', () => {
    const dynamic = exportSbml(ODE_MODEL)
    const fba = exportSbml(FBA_MODEL)
    const tampered = [
      dynamic.replace('reversible="false"', 'reversible="true"'),
      dynamic.replace('species="A" stoichiometry="1"', 'species="A" stoichiometry="2"'),
      dynamic.replace('species="B" stoichiometry="1"', 'species="B" stoichiometry="2"'),
      dynamic.replace('<times/>', '<plus/>'),
      dynamic.replace('<ci>k</ci><ci>A</ci>', '<ci>A</ci><ci>k</ci>'),
      dynamic.replace('<listOfProducts>', '<listOfModifiers><modifierSpeciesReference species="A"/></listOfModifiers><listOfProducts>'),
      dynamic.replace('value="0.3" units="per_second"', 'value="0.3" units="molar"'),
      dynamic.replace('kind="second" exponent="-1" scale="0" multiplier="1"', 'kind="second" exponent="-1" scale="0" multiplier="60"'),
      fba.replace('fbc:lowerFluxBound="LB_uptake"', 'fbc:lowerFluxBound="LB_biomass"'),
      fba.replace('id="UB_uptake" value="10"', 'id="UB_uptake" value="11"'),
      fba.replace('species="precursor" stoichiometry="1"', 'species="precursor" stoichiometry="2"'),
      fba.replace('</listOfProducts></reaction>', '</listOfProducts><kineticLaw><math><cn>1</cn></math></kineticLaw></reaction>'),
      fba.replace('fbc:coefficient="1"', 'fbc:coefficient="2"'),
      fba.replace('fbc:reaction="biomass"', 'fbc:reaction="uptake"')
    ]

    for (const xml of tampered) expect(() => importSbml(xml)).toThrow()
  })

  it('rejects archive path traversal and oversized compressed input', async () => {
    const archive = await exportCombineArchive(ODE_MODEL, benchmarkExperiment(ODE_MODEL))
    const traversal = replaceAllBytes(archive, 'model.xml', '../xx.xml')
    const unsafe = await validateCombineArchive(traversal)
    const oversized = await validateCombineArchive(Buffer.alloc(2_000_001))

    expect(unsafe).toMatchObject({ valid: false, findings: [{ code: 'archive_validation' }] })
    expect(unsafe.findings[0].message).toMatch(/(?:unsafe archive path|invalid relative path)/)
    expect(oversized.valid).toBe(false)
  })
})
