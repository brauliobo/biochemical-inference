import { describe, expect, it } from 'vitest'
import { balanceOf, parseFormula } from '../../src/kb/balance.js'
import { causalFor, conditionsFor, effectRows, graphLabel, vizSign } from '../../src/kb/causal-view.js'
import { enzymeChips, equationText, pathwayModel, reactionModel, reactionNetwork, reactionsOfCompound, reactionsOfEnzyme } from '../../src/kb/entity-model.js'
import { curvePoints, curvesFor, isMichaelisConstant, loadParameters, saturation, substrateOf, toMicromolar } from '../../src/kb/params.js'
import { chipFor, chipsFor, doseRows, limitRows, topQuantities, valueText } from '../../src/kb/quantities.js'
import { getEntity, graph, quantFor } from '../../src/knowledge/index.js'

describe('balance', () => {
  it('parses formulas with charges and rejects what is not a plain formula', () => {
    expect(parseFormula('C5H14NO+')).toEqual({ atoms: { C: 5, H: 14, N: 1, O: 1 }, charge: 1 })
    expect(parseFormula('C2H5NO2')).toEqual({ atoms: { C: 2, H: 5, N: 1, O: 2 }, charge: 0 })
    expect(parseFormula('HCO3-')).toEqual({ atoms: { H: 1, C: 1, O: 3 }, charge: -1 })
    expect(parseFormula('')).toBeNull()
    expect(parseFormula('(C6H10O5)n')).toBeNull()
  })

  it('reports GNMT as balanced in atoms, hydrogens and charge', () => {
    const balance = balanceOf(getEntity('reaction:gnmt-glycine-methylation').reaction, getEntity)
    expect(balance.status).toBe('balanced')
    expect(balance.elements.every((item) => item.balanced)).toBe(true)
    expect(balance.charge.balanced).toBe(true)
  })

  it('does not claim a verdict when a participant has no formula, and flags an unbalanced equation', () => {
    const lookup = (id) => ({ 'compound:a': { facts: { formula: 'CH4' } }, 'compound:b': { facts: { formula: 'C2H6' } }, 'compound:c': {} })[id]
    expect(balanceOf({ reactants: [{ id: 'compound:a', n: 1 }], products: [{ id: 'compound:c', n: 1 }] }, lookup).status).toBe('unknown')
    const bad = balanceOf({ reactants: [{ id: 'compound:a', n: 1 }], products: [{ id: 'compound:b', n: 1 }] }, lookup)
    expect(bad.status).toBe('unbalanced')
    expect(bad.elements[0]).toEqual({ element: 'C', left: 1, right: 2, balanced: false })
  })
})

describe('quantities', () => {
  it('formats values, ranges and absences', () => {
    expect(valueText({ value: 3500, unit: 'mg/day' })).toBe('3500 mg/day')
    expect(valueText({ value: null, low: 3, high: 10, unit: 'g/day' })).toBe('3 to 10 g/day')
    expect(valueText({ value: null, unit: 'mg/day' })).toBe('none established')
    expect(valueText({ value: 0.411, unit: 'fraction' })).toBe('41.1 %')
    expect(valueText({ value: 9.6, unit: 'pKa' })).toBe('9.6')
  })

  it('turns a record into a chip that keeps its provenance', () => {
    const record = quantFor('compound:choline', { kind: 'UL', authority: 'IOM 1998', population: 'adults 19+' })[0]
    const chip = chipFor(record)
    expect(chip.label).toBe('UL (IOM 1998)')
    expect(chip.text).toBe('3500 mg/day')
    expect(chip.refs).toEqual(['article:iom-1998-choline-dri'])
    expect(chip.absent).toBe(false)
    const absent = chipFor(quantFor('compound:choline', { kind: 'UL', authority: 'EFSA 2016' })[0])
    expect(absent.absent).toBe(true)
    expect(absent.text).toBe('none established')
  })

  it('puts the most informative quantities first and caps them', () => {
    const top = topQuantities('compound:choline', 3)
    expect(top).toHaveLength(3)
    expect(top[0].kind).toBe('UL')
    expect(chipsFor('compound:glycine', { kinds: ['molar-mass'] })[0].text).toMatch(/^75\.\d+ g\/mol$/)
  })

  it('builds range rows per authority and sex, with the adult UL on each and the absent EFSA UL in words', () => {
    const { rows, unit } = limitRows('compound:choline')
    expect(unit).toBe('mg/day')
    expect(rows.map((row) => row.label)).toEqual(['IOM 1998, men 19+', 'IOM 1998, women 19+', 'EFSA 2016, adults'])
    expect(rows[0].markers).toEqual([{ kind: 'ai', value: 550 }, { kind: 'ul', value: 3500 }])
    expect(rows[2].markers).toEqual([{ kind: 'ai', value: 400 }])
    expect(rows[2].noUlNote).toMatch(/no tolerable upper intake level/)
    expect(limitRows('compound:glycine')).toBeNull()
  })

  it('has at most one marker of a kind per row', () => {
    for (const entity of graph.entities) {
      for (const row of limitRows(entity.id)?.rows ?? []) {
        const kinds = row.markers.map((marker) => marker.kind)
        expect(new Set(kinds).size, `${entity.id} ${row.label}`).toBe(kinds.length)
      }
    }
  })

  it('compares doses with the upper limit of what the product delivers, scaled by its content', () => {
    const glycine = doseRows('intervention:glycine-powder')
    expect(glycine.unit).toBe('g/day')
    expect(glycine.rows[0].typical).toEqual({ from: 3, to: 10, label: '3 to 10 g/day' })
    expect(glycine.rows.every((row) => row.doseOnly)).toBe(true)
    const choline = doseRows('intervention:choline-bitartrate')
    const ul = choline.rows.find((row) => row.markers.length)
    expect(ul.markers[0].value).toBeCloseTo(3500 / 0.411, -1)
    expect(doseRows('compound:glycine')).toBeNull()
  })
})

describe('kinetic parameters', () => {
  it('recognises Michaelis constants and names their substrate', () => {
    expect(isMichaelisConstant({ id: 'GNMT.Km_gly', value: 130, unit: 'µM' })).toBe(true)
    expect(isMichaelisConstant({ id: 'gnmt-km-gly', value: 1100, unit: 'uM' })).toBe(true)
    expect(isMichaelisConstant({ id: 'GNMT.Ki_SAH', value: 35, unit: 'µM' })).toBe(false)
    expect(isMichaelisConstant({ id: 'MAT1A.Km_Met@korendyaseva2008', value: 25, unit: 'µM' })).toBe(false)
    expect(isMichaelisConstant({ id: 'gnmt-kcat', value: 1, unit: '1/h' })).toBe(false)
    expect(substrateOf('Km_Met')).toBe('methionine')
    expect(substrateOf('gnmt-km-gly')).toBe('glycine')
    expect(substrateOf('baat-km-cholyl-coa')).toBe('cholyl-CoA')
    expect(toMicromolar(2.2, 'mM')).toBe(2200)
    expect(toMicromolar(5, '1/h')).toBeNull()
  })

  it('computes saturation and curve points', () => {
    expect(saturation(100, 100)).toBe(0.5)
    expect(saturation(0, 100)).toBe(0)
    const { x, y } = curvePoints(100, 600, 7)
    expect(x).toEqual([0, 100, 200, 300, 400, 500, 600])
    expect(y[1]).toBe(50)
    expect(y.every((value, index) => index === 0 || value > y[index - 1])).toBe(true)
  })

  it('finds curves for GNMT with their provenance, and none for an enzyme without constants', async () => {
    const sets = await loadParameters()
    const curves = curvesFor(sets, { enzymeIds: ['enzyme:gnmt'], reactionIds: ['reaction:gnmt-glycine-methylation'] })
    expect(curves.length).toBeGreaterThanOrEqual(2)
    const glycine = curves.find((curve) => curve.substrate === 'glycine')
    expect(glycine.kmParam.source).toMatch(/^article:/)
    expect(glycine.kmLow).toBeLessThanOrEqual(glycine.km)
    expect(glycine.kmHigh).toBeGreaterThanOrEqual(glycine.km)
    const pemt = curvesFor(sets, { enzymeIds: ['enzyme:pemt'], reactionIds: ['reaction:pemt-pe-to-pc'] }).find((curve) => curve.substrate === 'SAM')
    expect(pemt.vmax).toBeGreaterThan(0)
    expect(curvesFor(sets, { enzymeIds: ['enzyme:does-not-exist'], reactionIds: [] })).toEqual([])
  })
})

describe('entity models', () => {
  it('describes a reaction with names, enzymes, pathways and balance', () => {
    const reaction = reactionModel('reaction:gnmt-glycine-methylation')
    expect(reaction.text).toBe('Glycine + SAMe → Sarcosine + SAH + H+')
    expect(reaction.enzymes.map((enzyme) => enzyme.id)).toEqual(['enzyme:gnmt'])
    expect(reaction.pathways.length).toBeGreaterThan(0)
    expect(reaction.balance.status).toBe('balanced')
    expect(equationText(getEntity('reaction:gnmt-glycine-methylation').reaction)).toBe(reaction.text)
    expect(reactionModel('compound:glycine')).toBeNull()
  })

  it('lists the reactions of a compound with the role it plays and of an enzyme', () => {
    const roles = Object.fromEntries(reactionsOfCompound('compound:glycine').map((row) => [row.id, row.role]))
    expect(roles['reaction:gnmt-glycine-methylation']).toBe('consumed')
    expect(Object.values(roles)).toContain('produced')
    expect(reactionsOfEnzyme('enzyme:gnmt').map((row) => row.id)).toContain('reaction:gnmt-glycine-methylation')
    expect(enzymeChips('enzyme:gnmt').gene).toBe('GNMT')
    expect(pathwayModel('pathway:methionine-cycle').reactions.length).toBeGreaterThan(3)
  })

  it('builds a reaction network for LayeredGraph', () => {
    const network = reactionNetwork(['reaction:gnmt-glycine-methylation'])
    expect(network.nodes.filter((node) => node.type === 'reaction')).toHaveLength(1)
    expect(network.edges.filter((edge) => edge.to === 'reaction:gnmt-glycine-methylation')).toHaveLength(2)
  })
})

describe('causal view', () => {
  it('maps edges to viz signs and shortens long names', () => {
    expect(vizSign({ rel: 'mitigates', sign: '-' })).toBe('mitigate')
    expect(vizSign({ rel: 'aggravates', sign: '+' })).toBe('aggravate')
    expect(vizSign({ rel: 'decreases', sign: '-' })).toBe('decrease')
    expect(vizSign({ rel: 'associated-with', sign: null })).toBe('neutral')
    expect(graphLabel('Glycine N-methyltransferase (GNMT)')).toBe('GNMT')
    expect(graphLabel('Betaine (trimethylglycine, TMG)')).toBe('Betaine')
  })

  it('draws a causal neighbourhood with hypothesis labels and falls back to unsigned links on request', () => {
    const near = causalFor('state:undermethylation', { depth: 2, limit: 28 })
    expect(near.nodes.length).toBeLessThanOrEqual(28)
    expect(near.edges.some((edge) => edge.hypothesis && /unsupported|partly|contested/.test(edge.label))).toBe(true)
    expect(near.unsigned).toBe(false)
    const none = graph.entities.find((entity) => ['system', 'pathway'].includes(entity.type) && !causalFor(entity.id) && causalFor(entity.id, { unsignedFallback: true }))
    if (none) expect(causalFor(none.id, { unsignedFallback: true }).unsigned).toBe(true)
  })

  it('lists signed effects from the entity point of view', () => {
    const rows = effectRows('intervention:glycine-powder')
    expect(rows.find((row) => row.id === 'outcome:belching')).toMatchObject({ phrase: 'Causes', hypothesis: true, claimStatus: 'unsupported' })
    const incoming = effectRows('outcome:belching').find((row) => row.id === 'intervention:glycine-powder')
    expect(incoming.phrase).toBe('Caused by')
    expect(effectRows('claim:belching-mostly-swallowed-air')).toEqual([])
  })

  it('groups the related states, diseases and outcomes by relation', () => {
    const groups = conditionsFor('compound:choline')
    expect(groups.map((group) => group.label)).toEqual(expect.arrayContaining(['Mitigates', 'Contraindicated in']))
    expect(groups.flatMap((group) => group.items).every((item) => ['state', 'disease', 'outcome'].includes(item.type))).toBe(true)
  })
})
