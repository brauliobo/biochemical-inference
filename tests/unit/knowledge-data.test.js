// Quality gate for the real knowledge base (src/knowledge/data/*.js), as opposed to the fixture-based tests.
import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import { buildGraph, connectedComponents } from '../../src/knowledge/graph.js'
import { pageModel, search } from '../../src/knowledge/page-model.js'
import { TYPE_IDS } from '../../src/knowledge/types.js'
import { validateKnowledge } from '../../src/knowledge/validate.js'

const report = validateKnowledge(entities)
const graph = buildGraph(entities)

// Floors, not exact counts: they stop content from being deleted by accident but let it grow.
const MINIMUM_PER_TYPE = {
  compound: 140,
  enzyme: 64,
  reaction: 60,
  pathway: 26,
  state: 13,
  disease: 24,
  outcome: 36,
  system: 19,
  intervention: 47,
  claim: 62,
  article: 245
}

describe('the real dataset validates', () => {
  it('has zero validation errors', () => {
    expect(report.errors.map((item) => `${item.rule} ${item.id} ${item.message}`)).toEqual([])
    expect(report.ok).toBe(true)
  })

  it('only warns about claims that are openly flagged as unsupported or conversation-only', () => {
    const rules = new Set(report.warnings.map((item) => item.rule))
    expect([...rules].every((rule) => rule === 'claim-flagged-no-evidence')).toBe(true)
    for (const warning of report.warnings) {
      const claim = graph.get(warning.id)
      expect(claim.type).toBe('claim')
      expect(claim.status === 'unsupported' || claim.evidence === 'conversation-only').toBe(true)
    }
  })

  it('has no duplicate ids and one connected graph', () => {
    expect(graph.duplicates).toEqual([])
    expect(graph.dangling).toEqual([])
    expect(graph.malformedMentions).toEqual([])
    expect(connectedComponents(graph)).toHaveLength(1)
  })
})

describe('type coverage', () => {
  it('has at least one entity of every type', () => {
    for (const type of TYPE_IDS) expect(graph.byType.get(type).length, type).toBeGreaterThan(0)
  })

  it('keeps a minimum number of entities per type', () => {
    for (const [type, floor] of Object.entries(MINIMUM_PER_TYPE)) {
      expect(graph.byType.get(type).length, type).toBeGreaterThanOrEqual(floor)
    }
    expect(Object.keys(MINIMUM_PER_TYPE).sort()).toEqual([...TYPE_IDS].sort())
  })

  it('reports counts that match the graph', () => {
    expect(report.counts.entities).toBe(entities.length)
    for (const type of TYPE_IDS) expect(report.counts.byType[type]).toBe(graph.byType.get(type).length)
  })
})

describe('evidence discipline', () => {
  const articles = entities.filter((entity) => entity.type === 'article')
  const claims = entities.filter((entity) => entity.type === 'claim')

  it('keeps every article verified, with a persistent identifier and at least one takeaway', () => {
    for (const article of articles) {
      expect(article.verified, article.id).toBe(true)
      expect(Boolean(article.doi || article.pmid || article.url), article.id).toBe(true)
      expect(article.takeaways.length, article.id).toBeGreaterThan(0)
    }
  })

  it('gives every claim at least one evidence-for or evidence-against edge unless it is flagged', () => {
    const unflagged = claims.filter((claim) => claim.status !== 'unsupported' && claim.evidence !== 'conversation-only')
    for (const claim of unflagged) {
      const links = graph.links(claim.id).filter((link) => link.rel === 'has-evidence' || link.rel === 'has-counterevidence')
      expect(links.length, claim.id).toBeGreaterThan(0)
    }
  })

  it('never grades an unsupported claim above speculative', () => {
    for (const claim of claims.filter((item) => item.status === 'unsupported')) {
      expect(['speculative', 'conversation-only'], claim.id).toContain(claim.evidence)
    }
  })

  it('records literature that contradicts a claim on the claim', () => {
    const against = (id) => graph.links(id).filter((link) => link.rel === 'has-counterevidence').map((link) => link.other)
    expect(against('claim:free-glycine-stimulates-gastrin')).toEqual(expect.arrayContaining(['article:taylor-1982-amino-acids-gastric-acid', 'article:wald-1982-glycine-gastric-acid']))
    expect(against('claim:pyroluria-causes-b6-zinc-deficiency')).toContain('article:warren-2021-pyroluria-fact-or-fiction')
    expect(against('claim:dgl-ulcer-healing')).toContain('article:engqvist-1973-dgl-gastric-ulcer')
    expect(against('claim:p5p-bypasses-hepatic-activation')).toContain('article:middleton-1986-plp-intestinal-hydrolysis')
  })

  it('never lists one article twice on a page (an article that both supports and contradicts a target is split across targets)', () => {
    for (const entity of entities) {
      const ids = pageModel(graph, entity.id).references.map((reference) => reference.id)
      expect(ids, entity.id).toEqual([...new Set(ids)])
    }
  })

  it('references every established non-article entity to at least one article', () => {
    for (const entity of entities.filter((item) => item.evidence === 'established' && item.type !== 'article')) {
      const cited = graph.links(entity.id).some((link) => link.rel === 'has-evidence' && graph.get(link.other).type === 'article')
      expect(cited, entity.id).toBe(true)
    }
  })
})

describe('reactions', () => {
  it('only use compounds as participants and enzymes as catalysts, all of which exist', () => {
    for (const reaction of entities.filter((entity) => entity.type === 'reaction')) {
      const { reactants, products, enzymes = [] } = reaction.reaction
      for (const item of [...reactants, ...products]) expect(graph.get(item.id)?.type, `${reaction.id} ${item.id}`).toBe('compound')
      for (const id of enzymes) expect(graph.get(id)?.type, `${reaction.id} ${id}`).toBe('enzyme')
    }
  })

  it('resolves the small molecules and cofactors that reactions rely on', () => {
    for (const id of ['compound:water', 'compound:proton', 'compound:nad', 'compound:nadph', 'compound:phosphate', 'compound:coa', 'compound:acetyl-coa', 'compound:oxygen', 'compound:hydrogen-peroxide']) {
      expect(graph.get(id), id).toBeDefined()
    }
  })
})

describe('naming', () => {
  it('uses one canonical id per concept (retired aliases stay absent)', () => {
    const retired = [
      'compound:5-methyl-thf', 'enzyme:gcs', 'intervention:ppi', 'intervention:p5p', 'intervention:methylfolate',
      'intervention:alginate', 'intervention:h-pylori-eradication', 'intervention:choline-salts', 'enzyme:badh',
      'compound:glycocholate', 'compound:taurocholate', 'compound:vitamin-b12-methylcobalamin', 'enzyme:urease-h-pylori'
    ]
    for (const id of retired) expect(graph.get(id), id).toBeUndefined()
  })

  it('defines family-level enzymes next to their isoforms', () => {
    for (const id of ['enzyme:shmt', 'enzyme:gad', 'enzyme:mat', 'enzyme:glycine-cleavage-system']) expect(graph.get(id)?.type, id).toBe('enzyme')
  })
})

describe('topic pages are rich', () => {
  const TOPICS = [
    'state:undermethylation', 'state:overmethylation', 'compound:glycine', 'compound:choline', 'compound:betaine',
    'enzyme:gnmt', 'disease:peptic-ulcer', 'disease:sibo', 'disease:lpr', 'outcome:belching'
  ]

  it.each(TOPICS)('%s links to at least 10 distinct non-article entities of at least 4 types', (id) => {
    const others = new Set(graph.links(id).map((link) => link.other).filter((other) => graph.get(other).type !== 'article'))
    const types = new Set([...others].map((other) => graph.get(other).type))
    expect(others.size).toBeGreaterThanOrEqual(10)
    expect(types.size).toBeGreaterThanOrEqual(4)
  })

  it.each(TOPICS)('%s has at least three typed relation groups besides "associated with"', (id) => {
    const page = pageModel(graph, id)
    const groups = page.relationGroups.filter((group) => group.rel !== 'associated-with' && group.rel !== 'interacts-with')
    expect(groups.length).toBeGreaterThanOrEqual(3)
  })

  it('lists the key helps, aggravates and contraindications explicitly', () => {
    const has = (from, rel, to) => expect(graph.links(from).some((link) => link.rel === rel && link.other === to), `${from} ${rel} ${to}`).toBe(true)
    has('compound:niacin', 'aggravates', 'state:undermethylation')
    has('compound:betaine', 'mitigates', 'state:undermethylation')
    has('compound:glycine', 'contraindicated-in', 'disease:nonketotic-hyperglycinemia')
    has('intervention:betaine-hcl', 'contraindicated-in', 'disease:peptic-ulcer')
    has('intervention:sodium-alginate', 'mitigates', 'disease:lpr')
    has('intervention:zinc-carnosine', 'mitigates', 'disease:peptic-ulcer')
    has('intervention:ppi-therapy', 'aggravates', 'disease:sibo')
    has('intervention:diaphragmatic-breathing', 'mitigates', 'outcome:belching')
  })
})

describe('page models and search over the whole dataset', () => {
  it('builds a page for every entity without throwing', () => {
    for (const entity of entities) {
      const page = pageModel(graph, entity.id)
      expect(page, entity.id).not.toBeNull()
      expect(page.name).toBe(entity.name)
    }
  })

  it('finds entities by name, alias and abbreviation', () => {
    expect(search(graph, 'GNMT')[0].id).toBe('enzyme:gnmt')
    expect(search(graph, 'glicina')[0].id).toBe('compound:glycine')
    expect(search(graph, 'P5P').map((hit) => hit.id)).toContain('intervention:p5p-supplement')
  })
})

// ---------------------------------------------------------------------------------------------------------------------
// Coverage of the source conversation (tmp/base-talk.txt). Each row is a term a reader would type, in the language the
// conversation uses, and the entity that must be among the top three results. The full checklist is tmp/coverage.md.
const CONVERSATION_TERMS = [
  // substances
  ['glicina em pó', 'intervention:glycine-powder'], ['glicina', 'compound:glycine'], ['colágeno tipo 2', 'intervention:type-ii-collagen'],
  ['colágeno', 'compound:collagen'], ['SAMe', 'compound:sam'], ['sarcosina', 'compound:sarcosine'], ['fosfatidilcolina', 'compound:phosphatidylcholine'],
  ['colina', 'compound:choline'], ['acetilcolina', 'compound:acetylcholine'], ['gastrina', 'compound:gastrin'], ['ácido clorídrico', 'compound:hydrochloric-acid'],
  ['bicarbonato', 'compound:bicarbonate'], ['gás carbônico', 'compound:carbon-dioxide'], ['zwitterion', 'compound:glycine'], ['amônia', 'compound:ammonia'],
  ['prolina', 'compound:proline'], ['hidroxiprolina', 'compound:hydroxyproline'], ['P5P', 'compound:plp'], ['piridoxina', 'compound:pyridoxine'],
  ['tetraidrofolato', 'compound:thf'], ['metilfolato', 'compound:5-mthf'], ['ácido fólico', 'compound:folic-acid'], ['ácido folínico', 'compound:folinic-acid'],
  ['B12', 'compound:vitamin-b12'], ['metilcobalamina', 'compound:methylcobalamin'], ['adenosilcobalamina', 'compound:adenosylcobalamin'], ['taurina', 'compound:taurine'],
  ['ácidos biliares', 'compound:bile-acids'], ['TMG', 'compound:betaine'], ['trimetilglicina', 'compound:betaine'], ['betaína anidra', 'intervention:betaine-anhydrous'],
  ['betaína HCl', 'intervention:betaine-hcl'], ['niacina', 'compound:niacin'], ['glutamato', 'compound:glutamate'], ['GABA', 'compound:gaba'], ['histamina', 'compound:histamine'],
  ['homocisteína', 'compound:homocysteine'], ['metionina', 'compound:methionine'], ['omeprazol', 'intervention:ppi-therapy'], ['zinco carnosina', 'intervention:zinc-carnosine'],
  ['PepZin', 'intervention:zinc-carnosine'], ['DGL', 'intervention:dgl-licorice'], ['glutamina', 'compound:glutamine'], ['berberina', 'compound:berberine'],
  ['óleo de orégano', 'intervention:oregano-oil'], ['carvacrol', 'compound:carvacrol'], ['timol', 'compound:thymol'], ['alfa-GPC', 'compound:glycerophosphocholine'],
  ['citicolina', 'compound:cdp-choline'], ['betaína aldeído', 'compound:betaine-aldehyde'], ['dimetilglicina', 'compound:dimethylglycine'], ['glutationa', 'compound:glutathione'],
  ['creatina', 'compound:creatine'], ['elastina', 'compound:elastin'], ['secretina', 'compound:secretin'], ['motilina', 'compound:motilin'], ['prostaglandinas', 'compound:prostaglandin-e2'],
  ['beta-alanina', 'compound:beta-alanine'], ['carnosina', 'compound:carnosine'], ['histidina', 'compound:histidine'], ['pepsina', 'compound:pepsin'], ['alginato', 'compound:alginate'],
  ['trimetilamina', 'compound:trimethylamine'], ['TMAO', 'compound:tmao'], ['bitartarato de colina', 'intervention:choline-bitartrate'], ['gengibre', 'intervention:ginger-extract'],
  ['alcachofra', 'intervention:artichoke-leaf-extract'], ['cinarina', 'compound:cynarin'], ['treonato de magnésio', 'intervention:magnesium-l-threonate'], ['malato de magnésio', 'intervention:magnesium-malate'],
  ['magnésio', 'compound:magnesium'], ['dopamina', 'compound:dopamine'], ['serotonina', 'compound:serotonin'], ['taninos', 'compound:tannins-flavonoids'], ['gelatina', 'intervention:dietary-glycine-sources'],
  ['BulkSupplements', 'intervention:choline-bitartrate'], ['Extreme Suplementos', 'intervention:choline-bitartrate'], ['Elysx', 'intervention:citicoline-supplement'],
  ['Cognizin', 'intervention:citicoline-supplement'], ['BodyBio', 'intervention:phosphatidylcholine-supplement'], ['lecitina de girassol', 'intervention:phosphatidylcholine-supplement'],
  // enzymes
  ['GNMT', 'enzyme:gnmt'], ['PEMT', 'enzyme:pemt'], ['SHMT', 'enzyme:shmt'], ['sistema de clivagem da glicina', 'enzyme:glycine-cleavage-system'], ['HNMT', 'enzyme:hnmt'],
  ['BHMT', 'enzyme:bhmt'], ['colina desidrogenase', 'enzyme:chdh'], ['BADH', 'enzyme:aldh7a1'], ['dimetilglicina desidrogenase', 'enzyme:dmgdh'], ['SARDH', 'enzyme:sardh'],
  ['metionina adenosiltransferase', 'enzyme:mat'], ['anidrase carbônica', 'enzyme:carbonic-anhydrase'], ['urease', 'enzyme:h-pylori-urease'], ['bomba de prótons', 'enzyme:h-k-atpase'],
  ['colina acetiltransferase', 'enzyme:chat'], ['FMO3', 'enzyme:fmo3'], ['Stickland', 'enzyme:bacterial-glycine-reductase'], ['carnosina sintase', 'enzyme:carns1'], ['timidilato sintase', 'enzyme:tyms'],
  // reactions and pathways
  ['síntese de timidilato', 'reaction:tyms-thymidylate-synthesis'], ['síntese de carnosina', 'reaction:carns1-carnosine-synthesis'], ['demetilação da sarcosina', 'reaction:sardh-sarcosine-demethylation'],
  ['remetilação por betaína', 'reaction:bhmt-betaine-homocysteine'], ['neutralização do ácido', 'reaction:hcl-bicarbonate-neutralisation'], ['ciclo de metilação', 'pathway:methionine-cycle'],
  ['ciclo do folato', 'pathway:folate-cycle'], ['via de Kennedy', 'pathway:kennedy-pathway'], ['dreno de metil', 'pathway:methyl-budget'], ['complexo motor migratório', 'pathway:migrating-motor-complex'],
  ['síntese de purinas', 'pathway:nucleotide-synthesis'], ['receptor muscarínico M2', 'pathway:muscarinic-m2-vagal-brake'], ['receptor 5-HT4', 'pathway:5-ht4-prokinetic-signalling'],
  ['receptor de histamina H1', 'pathway:histamine-receptor-signalling'], ['secreção ácida', 'pathway:gastric-acid-secretion'], ['transsulfuração', 'pathway:transsulfuration'],
  ['síntese de colágeno', 'pathway:collagen-synthesis'], ['degradação da histamina', 'pathway:histamine-degradation'],
  // states, diseases, outcomes
  ['submetilação', 'state:undermethylation'], ['hipermetilação', 'state:overmethylation'], ['hipocloridria', 'state:hypochlorhydria'], ['supressão ácida', 'state:acid-suppression'],
  ['armadilha do folato', 'state:folate-trap'], ['refluxo duodenogástrico', 'state:duodenogastric-reflux'], ['gastroparesia funcional', 'state:gastric-dysmotility'],
  ['pirolúria', 'disease:pyroluria-kpu'], ['úlcera', 'disease:peptic-ulcer'], ['H. pylori', 'disease:h-pylori-infection'], ['SIBO', 'disease:sibo'], ['refluxo laringofaríngeo', 'disease:lpr'],
  ['refluxo silencioso', 'disease:lpr'], ['gastrite', 'disease:gastritis'], ['duodenite', 'disease:gastritis'], ['esofagite', 'disease:esophagitis'], ['trimetilaminúria', 'disease:trimethylaminuria'],
  ['intolerância à histamina', 'disease:histamine-intolerance'], ['arroto', 'outcome:belching'], ['eructação', 'outcome:belching'], ['flatulência', 'outcome:flatulence'],
  ['intolerância à glicina', 'outcome:glycine-intolerance'], ['relaxamentos transitórios', 'outcome:transient-les-relaxations'], ['névoa mental', 'outcome:brain-fog'], ['taquicardia', 'outcome:tachycardia'],
  ['rubor', 'outcome:flushing'], ['queimação na garganta', 'outcome:throat-burning'], ['pigarro', 'outcome:throat-burning'], ['odor de peixe', 'outcome:fishy-odor'],
  ['pepsina salivar', 'outcome:salivary-pepsin'], ['despertar às 2-3h', 'outcome:night-waking'],
  // systems, interventions, claims
  ['tônus vagal', 'system:vagal-tone'], ['esfíncter esofágico inferior', 'system:lower-esophageal-sphincter'], ['células parietais', 'system:gastric-parietal-cells'], ['células G', 'system:gastric-g-cells'],
  ['duodeno', 'system:duodenum'], ['piloro', 'system:pylorus'], ['íleo', 'system:ileum'], ['fermentação colônica', 'system:colon'], ['nó sinoatrial', 'system:cardiac-autonomic-control'],
  ['espinheira santa', 'intervention:espinheira-santa'], ['bochecho com bicarbonato', 'intervention:bicarbonate-rinse'], ['reintrodução em fases', 'intervention:phased-reintroduction-protocol'],
  ['glicina com as refeições', 'intervention:amino-acids-with-meals'], ['alginato de sódio', 'intervention:sodium-alginate'], ['procinético', 'intervention:prokinetic-drugs'],
  ['déficit de glicina 10 g', 'claim:glycine-deficit-10g'], ['28 a 35 g de colina', 'claim:choline-28-35g-for-10g-glycine'], ['50 a 100 vezes', 'claim:larynx-50-100x-more-sensitive'],
  ['pico de histamina', 'claim:histamine-peaks-2-4am'], ['esponja de metil', 'claim:glycine-gnmt-depletes-sam-in-undermethylated'], ['válvula de escape', 'claim:gnmt-methyl-sink-valve'],
  ['colina 400 a 1000', 'claim:choline-400-1000-mg-supportive-range'], ['Meléndez-Hevia', 'article:melendez-hevia-2009-glycine-weak-link'], ['IOM colina', 'article:iom-1998-choline-dri']
]

describe('every topic of the source conversation has its own page', () => {
  it.each(CONVERSATION_TERMS)('"%s" finds %s in the top three', (term, id) => {
    expect(graph.get(id), id).toBeDefined()
    expect(search(graph, term, { limit: 3 }).map((hit) => hit.id), term).toContain(id)
  })

  it('keeps the conversation checklist table large enough to matter', () => {
    expect(CONVERSATION_TERMS.length).toBeGreaterThanOrEqual(150)
    expect(new Set(CONVERSATION_TERMS.map(([, id]) => id)).size).toBeGreaterThanOrEqual(130)
  })
})

describe('Portuguese search', () => {
  const FIRST_HIT = [
    ['glicina', 'compound:glycine'], ['colina', 'compound:choline'], ['betaína', 'compound:betaine'], ['acetilcolina', 'compound:acetylcholine'],
    ['arroto', 'outcome:belching'], ['submetilação', 'state:undermethylation'], ['sobremetilação', 'state:overmethylation'], ['hipocloridria', 'state:hypochlorhydria'],
    ['gastrina', 'compound:gastrin'], ['pepsina', 'compound:pepsin'], ['piloro', 'system:pylorus'], ['taurina', 'compound:taurine'], ['sarcosina', 'compound:sarcosine'],
    ['histamina', 'compound:histamine'], ['SIBO', 'disease:sibo'], ['H. pylori', 'disease:h-pylori-infection'], ['IBP', 'intervention:ppi-therapy'], ['PPI', 'intervention:ppi-therapy'],
    ['nervo vago', 'system:vagal-tone'], ['metilcobalamina', 'compound:methylcobalamin'], ['zinco carnosina', 'intervention:zinc-carnosine'], ['espinheira santa', 'intervention:espinheira-santa'],
    ['refluxo laringofaríngeo', 'disease:lpr'], ['piroluria', 'disease:pyroluria-kpu'], ['microbiota intestinal', 'system:gut-microbiota'], ['bile', 'system:bile'], ['esofagite', 'disease:esophagitis']
  ]

  it.each(FIRST_HIT)('"%s" ranks %s first', (term, id) => {
    expect(search(graph, term)[0]?.id).toBe(id)
  })

  it('ignores accents and case, so unaccented typing finds the same entity', () => {
    for (const [accented, plain] of [['eructação', 'eructacao'], ['submetilação', 'SUBMETILACAO'], ['pirolúria', 'pirolURIA'], ['hipocloridria', 'HIPOCLORIDRIA'], ['colágeno', 'colageno'], ['íleo', 'ileo'], ['esofagite', 'ESOFAGITE']]) {
      expect(search(graph, plain).map((hit) => hit.id), plain).toEqual(search(graph, accented).map((hit) => hit.id))
    }
  })

  it('gives every non-article entity at least one alias (claims carry a Portuguese phrasing of their statement)', () => {
    expect(entities.filter((entity) => entity.type !== 'article' && !(entity.aliases ?? []).length).map((entity) => entity.id)).toEqual([])
  })

  it('finds each claim by a Portuguese phrase', () => {
    for (const claim of entities.filter((entity) => entity.type === 'claim')) {
      const alias = claim.aliases[0]
      expect(search(graph, alias, { limit: 3 }).map((hit) => hit.id), `${claim.id} via "${alias}"`).toContain(claim.id)
    }
  })
})

describe('reactions balance', () => {
  const byId = new Map(entities.map((entity) => [entity.id, entity]))
  const SPECIAL = { 'compound:proton': { atoms: { H: 1 }, charge: 1 } }

  function parseFormula(text) {
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

  function totals(list) {
    const atoms = {}
    let charge = 0
    for (const { id, n } of list) {
      const parsed = SPECIAL[id] ?? parseFormula(byId.get(id)?.facts?.formula)
      if (!parsed) return null
      for (const [element, count] of Object.entries(parsed.atoms)) atoms[element] = (atoms[element] ?? 0) + count * n
      charge += parsed.charge * n
    }
    return { atoms, charge }
  }

  const reactions = entities.filter((entity) => entity.type === 'reaction')

  it('conserves every heavy atom in every reaction whose participants all have a plain formula', () => {
    let checked = 0
    for (const reaction of reactions) {
      const left = totals(reaction.reaction.reactants)
      const right = totals(reaction.reaction.products)
      if (!left || !right) continue
      checked += 1
      for (const element of new Set([...Object.keys(left.atoms), ...Object.keys(right.atoms)])) {
        if (element === 'H') continue
        expect(left.atoms[element] ?? 0, `${reaction.id} ${element}`).toBe(right.atoms[element] ?? 0)
      }
    }
    expect(checked).toBeGreaterThanOrEqual(50)
  })

  // Hand-checked: atoms, hydrogens and charge all balance with the formulas stored on the compounds.
  const FULLY_BALANCED = [
    'reaction:gnmt-glycine-methylation', 'reaction:bhmt-betaine-homocysteine', 'reaction:mtr-methionine-synthase', 'reaction:ahcy-sah-hydrolysis',
    'reaction:hnmt-histamine-methylation', 'reaction:gamt-creatine-synthesis', 'reaction:agat-guanidinoacetate-synthesis', 'reaction:comt-dopamine-methylation',
    'reaction:cbs-cystathionine-synthesis', 'reaction:shmt-serine-glycine-interconversion', 'reaction:mthfd1-methenyl-thf-cyclohydrolase', 'reaction:psat1-phosphoserine-transamination',
    'reaction:bsh-glycocholate-deconjugation', 'reaction:abat-gaba-transamination', 'reaction:chat-acetylcholine-synthesis', 'reaction:dao-histamine-oxidation',
    'reaction:pnpo-pnp-oxidation', 'reaction:proton-bicarbonate-protonation', 'reaction:carbonic-acid-dehydration', 'reaction:carbonic-anhydrase-bicarbonate-dehydration',
    'reaction:hcl-bicarbonate-neutralisation', 'reaction:urease-urea-hydrolysis', 'reaction:p4h-prolyl-hydroxylation', 'reaction:choline-tma-lyase', 'reaction:tyms-thymidylate-synthesis'
  ]

  it.each(FULLY_BALANCED)('%s balances atoms, hydrogens and charge', (id) => {
    const reaction = byId.get(id).reaction
    const left = totals(reaction.reactants)
    const right = totals(reaction.products)
    expect(left, id).not.toBeNull()
    expect(right, id).not.toBeNull()
    expect(left.atoms).toEqual(right.atoms)
    expect(left.charge).toBe(right.charge)
  })

  it('spot checks: the chemistry named in the conversation has the expected stoichiometry', () => {
    const species = (list) => Object.fromEntries(list.map(({ id, n }) => [id.replace('compound:', ''), n]))
    const gnmt = byId.get('reaction:gnmt-glycine-methylation').reaction
    expect(species(gnmt.reactants)).toEqual({ glycine: 1, sam: 1 })
    expect(species(gnmt.products)).toEqual({ sarcosine: 1, sah: 1, proton: 1 })
    const pemt = byId.get('reaction:pemt-pe-to-pc').reaction
    expect(species(pemt.reactants)).toEqual({ phosphatidylethanolamine: 1, sam: 3 })
    expect(species(pemt.products)).toEqual({ phosphatidylcholine: 1, sah: 3, proton: 3 })
    const bicarbonate = byId.get('reaction:hcl-bicarbonate-neutralisation').reaction
    expect(species(bicarbonate.reactants)).toEqual({ 'hydrochloric-acid': 1, bicarbonate: 1 })
    expect(species(bicarbonate.products)).toEqual({ 'carbon-dioxide': 1, water: 1, chloride: 1 })
    const cleavage = byId.get('reaction:glycine-cleavage-system').reaction
    expect(species(cleavage.products)).toEqual({ '5-10-methylene-thf': 1, 'carbon-dioxide': 1, ammonia: 1, nadh: 1, proton: 1 })
    const urease = byId.get('reaction:urease-urea-hydrolysis').reaction
    expect(species(urease.products)).toEqual({ ammonia: 2, 'carbon-dioxide': 1 })
  })

  it('walks the choline-to-glycine chain in the order the conversation describes', () => {
    const chain = ['reaction:chdh-choline-oxidation', 'reaction:badh-betaine-aldehyde-oxidation', 'reaction:bhmt-betaine-homocysteine', 'reaction:dmgdh-dimethylglycine-demethylation', 'reaction:sardh-sarcosine-demethylation']
    const out = chain.map((id) => byId.get(id).reaction)
    const products = out.map((reaction) => reaction.products.map((p) => p.id))
    const substrates = out.map((reaction) => reaction.reactants.map((p) => p.id))
    expect(substrates[0]).toContain('compound:choline')
    expect(products[0]).toContain('compound:betaine-aldehyde')
    expect(substrates[1]).toContain('compound:betaine-aldehyde')
    expect(products[1]).toContain('compound:betaine')
    expect(substrates[2]).toContain('compound:betaine')
    expect(products[2]).toContain('compound:dimethylglycine')
    expect(substrates[3]).toContain('compound:dimethylglycine')
    expect(products[3]).toContain('compound:sarcosine')
    expect(substrates[4]).toContain('compound:sarcosine')
    expect(products[4]).toContain('compound:glycine')
  })

  it('states the stoichiometry arithmetic of the conversation correctly', () => {
    // 10 g glycine / 75.07 g/mol = 0.1332 mol; times 104.17 g/mol choline cation = 13.88 g (one-to-one)
    const glycine = Number.parseFloat(byId.get('compound:glycine').facts.molarMass)
    const choline = Number.parseFloat(byId.get('compound:choline').facts.molarMass)
    expect(10 / glycine).toBeCloseTo(0.1332, 3)
    expect((10 / glycine) * choline).toBeCloseTo(13.88, 1)
    // choline bitartrate is about 41 % choline by mass
    expect(choline / 253.25).toBeCloseTo(0.411, 2)
  })
})

describe('identifier formats', () => {
  const tokens = (value) => String(value).split(/[;,]/).map((part) => part.trim()).filter(Boolean)
  const withFact = (key) => entities.filter((entity) => entity.facts?.[key] !== undefined)

  it('writes EC numbers as four dot-separated numbers', () => {
    for (const entity of withFact('ec')) {
      if (/^n\/a/.test(entity.facts.ec)) continue
      for (const token of tokens(entity.facts.ec)) expect(token, entity.id).toMatch(/^\d{1,2}\.\d{1,2}\.\d{1,2}\.(\d{1,3}|-)$/)
    }
    for (const entity of entities.filter((item) => item.reaction?.ec)) {
      for (const token of tokens(entity.reaction.ec)) expect(token, entity.id).toMatch(/^\d{1,2}\.\d{1,2}\.\d{1,2}\.(\d{1,3}|-)$/)
    }
  })

  it('writes ChEBI, PubChem and HMDB ids in their canonical form', () => {
    for (const entity of withFact('chebi')) expect(entity.facts.chebi, entity.id).toMatch(/^CHEBI:\d+( \(.+\))?$/)
    for (const entity of withFact('pubchem')) expect(entity.facts.pubchem, entity.id).toMatch(/^CID \d+$/)
    for (const entity of withFact('hmdb')) expect(entity.facts.hmdb, entity.id).toMatch(/^HMDB\d{7}$/)
  })

  it('writes Rhea, Reactome and UniProt ids in their canonical form', () => {
    for (const key of ['rhea', 'rhea-master']) {
      for (const entity of withFact(key)) for (const token of tokens(entity.facts[key])) expect(token, `${entity.id} ${key}`).toMatch(/^RHEA:\d+$/)
    }
    for (const entity of withFact('reactome')) for (const token of tokens(entity.facts.reactome)) expect(token, entity.id).toMatch(/^R-HSA-\d+$/)
    const accession = /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})( \(.+\))?$/
    for (const entity of withFact('uniprot')) for (const token of entity.facts.uniprot.split(';').map((part) => part.trim())) expect(token, entity.id).toMatch(accession)
    for (const entity of entities.filter((item) => item.reaction)) {
      if (entity.reaction.rhea) for (const token of tokens(entity.reaction.rhea)) expect(token, entity.id).toMatch(/^RHEA:\d+$/)
      if (entity.reaction.reactome) for (const token of tokens(entity.reaction.reactome)) expect(token, entity.id).toMatch(/^R-HSA-\d+$/)
    }
  })

  it('writes KEGG references as ec:<number> or a map id', () => {
    for (const entity of withFact('kegg')) for (const token of tokens(entity.facts.kegg)) expect(token, entity.id).toMatch(/^(ec:\d+\.\d+\.\d+\.\d+|hsa\d{5}|map\d{5})$/)
  })

  it('keeps reaction identifiers consistent with the entity facts and with the enzymes that catalyse them', () => {
    const byId = new Map(entities.map((entity) => [entity.id, entity]))
    const lumped = new Set(['reaction:pemt-pe-to-pc', 'reaction:glycine-cleavage-system', 'reaction:bacterial-glycine-cleavage'])
    for (const entity of entities.filter((item) => item.reaction)) {
      const { ec, rhea, reactome, enzymes = [] } = entity.reaction
      if (ec && entity.facts?.ec && !lumped.has(entity.id)) expect(entity.facts.ec, entity.id).toBe(ec)
      if (rhea && entity.facts?.rhea && !lumped.has(entity.id)) expect(entity.facts.rhea, entity.id).toBe(rhea)
      if (reactome && entity.facts?.reactome) expect(entity.facts.reactome, entity.id).toContain(reactome)
      if (ec) for (const id of enzymes) {
        const enzymeEc = byId.get(id).facts?.ec ?? ''
        if (!lumped.has(entity.id)) expect(enzymeEc, `${entity.id} via ${id}`).toContain(ec)
      }
    }
  })

  it('writes article DOIs bare, PMIDs as digits, years sensibly and links as https', () => {
    for (const article of entities.filter((entity) => entity.type === 'article')) {
      if (article.doi) expect(article.doi, article.id).toMatch(/^10\.\d{4,9}\/\S+$/)
      if (article.pmid) expect(article.pmid, article.id).toMatch(/^[1-9]\d{0,8}$/)
      if (article.url) expect(article.url, article.id).toMatch(/^https:\/\//)
      expect(article.year, article.id).toBeGreaterThanOrEqual(1900)
      expect(article.year, article.id).toBeLessThanOrEqual(2026)
      expect(Boolean(article.doi || article.pmid || article.url), article.id).toBe(true)
    }
  })

  it('has no duplicate PMID or DOI across articles', () => {
    for (const key of ['pmid', 'doi']) {
      const seen = new Map()
      for (const article of entities.filter((entity) => entity.type === 'article' && entity[key])) {
        const value = article[key].toLowerCase()
        expect(seen.has(value), `${key} ${value} on ${article.id} and ${seen.get(value)}`).toBe(false)
        seen.set(value, article.id)
      }
    }
  })

  it('keeps molar masses consistent with the formulas they are stored next to', () => {
    const weights = { H: 1.008, C: 12.011, N: 14.007, O: 15.999, P: 30.974, S: 32.06, Cl: 35.45, Mg: 24.305, Zn: 65.38, Co: 58.933 }
    let checked = 0
    for (const entity of entities.filter((item) => item.facts?.formula && item.facts?.molarMass)) {
      const head = entity.facts.formula.match(/^[A-Za-z0-9]+/)?.[0]
      const stated = Number.parseFloat(entity.facts.molarMass)
      let mass = 0
      let consumed = 0
      let ok = Boolean(head)
      for (const match of head?.matchAll(/([A-Z][a-z]?)(\d*)/g) ?? []) {
        if (!weights[match[1]]) ok = false
        mass += (weights[match[1]] ?? 0) * (match[2] ? Number(match[2]) : 1)
        consumed += match[0].length
      }
      if (!ok || consumed !== head.length || /\(/.test(entity.facts.formula.slice(0, 12))) continue
      checked += 1
      expect(Math.abs(mass - stated), `${entity.id} ${entity.facts.formula} -> ${mass.toFixed(2)} vs ${stated}`).toBeLessThan(0.4)
    }
    expect(checked).toBeGreaterThan(90)
  })
})

describe('link richness', () => {
  it('connects every non-article entity to at least five other entities, and every article to at least two', () => {
    for (const entity of entities) {
      const needed = entity.type === 'article' ? 2 : 5
      expect(graph.degree(entity.id), entity.id).toBeGreaterThanOrEqual(needed)
    }
  })

  it('links every non-article entity to at least three non-article entities', () => {
    for (const entity of entities.filter((item) => item.type !== 'article')) {
      const others = graph.neighbors(entity.id).filter((other) => graph.get(other).type !== 'article')
      expect(others.length, entity.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('gives every disease and state typed relation groups (two or more for the established ones)', () => {
    for (const entity of entities.filter((item) => item.type === 'disease' || item.type === 'state')) {
      const groups = pageModel(graph, entity.id).relationGroups.filter((group) => group.rel !== 'associated-with' && group.rel !== 'interacts-with')
      expect(groups.length, entity.id).toBeGreaterThanOrEqual(entity.evidence === 'established' ? 2 : 1)
    }
  })

  it('shows helps, aggravates, causes and measured-by groups on the topic hubs the user cares about', () => {
    const groupsOf = (id) => new Set(pageModel(graph, id).relationGroups.map((group) => group.rel))
    const needs = {
      'state:undermethylation': ['mitigated-by', 'aggravated-by', 'caused-by', 'measured-by', 'manifests-as'],
      'state:overmethylation': ['mitigated-by', 'aggravated-by', 'measured-by', 'manifests-as'],
      'outcome:belching': ['caused-by', 'mitigated-by', 'aggravated-by', 'manifestation-of', 'measured-by'],
      'disease:peptic-ulcer': ['mitigated-by', 'aggravated-by', 'caused-by', 'measured-by', 'contraindicates'],
      'disease:sibo': ['mitigated-by', 'aggravated-by', 'caused-by', 'measured-by', 'manifests-as'],
      'disease:lpr': ['mitigated-by', 'aggravated-by', 'caused-by', 'measured-by', 'manifests-as', 'contraindicates'],
      'compound:glycine': ['contraindicated-in', 'mitigates', 'causes', 'increased-by', 'precursor-of'],
      'compound:choline': ['precursor-of', 'mitigates', 'causes', 'aggravates', 'contraindicated-in'],
      'compound:betaine': ['mitigates', 'decreases', 'precursor-of', 'increased-by'],
      'enzyme:gnmt': ['catalyzes', 'mitigates', 'measured-by', 'decreases'],
      'enzyme:pemt': ['catalyzes', 'has-substrate', 'has-product'],
      'enzyme:bhmt': ['catalyzes', 'mitigates', 'requires-cofactor', 'has-substrate']
    }
    for (const [id, rels] of Object.entries(needs)) for (const rel of rels) expect(groupsOf(id).has(rel), `${id} lacks ${rel}`).toBe(true)
  })

  it('states the key converse edges explicitly', () => {
    const has = (from, rel, to) => expect(graph.links(from).some((link) => link.rel === rel && link.other === to), `${from} ${rel} ${to}`).toBe(true)
    has('intervention:betaine-hcl', 'aggravates', 'disease:peptic-ulcer')
    has('intervention:betaine-hcl', 'contraindicated-in', 'disease:gastritis')
    has('compound:glycine', 'aggravates', 'disease:nonketotic-hyperglycinemia')
    has('compound:choline', 'aggravates', 'disease:trimethylaminuria')
    has('intervention:ppi-therapy', 'causes', 'state:acid-suppression')
    has('disease:h-pylori-infection', 'causes', 'disease:gastritis')
    has('disease:gerd', 'manifests-as', 'disease:esophagitis')
    has('intervention:betaine-anhydrous', 'mitigates', 'disease:mthfr-deficiency')
  })
})

describe('topic pages open with a plain-language lead', () => {
  const HUBS = [
    'state:undermethylation', 'state:overmethylation', 'compound:glycine', 'compound:choline', 'compound:betaine', 'enzyme:gnmt', 'enzyme:pemt',
    'enzyme:bhmt', 'disease:peptic-ulcer', 'disease:sibo', 'disease:lpr', 'outcome:belching', 'pathway:choline-oxidation', 'pathway:methyl-budget'
  ]

  it.each(HUBS)('%s starts with an "In plain words" paragraph that is short and has no raw ids', (id) => {
    const entity = graph.get(id)
    const lead = entity.body[0]
    expect(lead.startsWith('In plain words:'), id).toBe(true)
    expect(lead.length, id).toBeGreaterThan(200)
    expect(lead.length, id).toBeLessThan(1200)
    expect(lead, id).not.toMatch(/\[\[/)
    expect(entity.body.length, id).toBeGreaterThanOrEqual(2)
  })
})

describe('quality of tone and evidence', () => {
  it('does not address the reader or give instructions in the entity text', () => {
    const advice = /\b(you should|you must|we recommend|i recommend|take \d+ ?(mg|g)\b|start taking|stop taking your)/i
    for (const entity of entities.filter((item) => item.type !== 'article')) {
      for (const paragraph of [entity.summary, ...(entity.body ?? [])]) expect(paragraph, entity.id).not.toMatch(advice)
    }
  })

  it('never grades a claim as established unless it is marked supported', () => {
    for (const claim of entities.filter((item) => item.type === 'claim' && item.evidence === 'established')) {
      expect(claim.status, claim.id).toBe('supported')
    }
  })

  it('gives every entity of the non-article types a summary that is not just its name', () => {
    for (const entity of entities.filter((item) => item.type !== 'article')) expect(entity.summary.length, entity.id).toBeGreaterThan(40)
  })
})
