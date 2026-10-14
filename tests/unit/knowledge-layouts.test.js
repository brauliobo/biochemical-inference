// Hand-laid metabolic maps (src/viz/layouts): every node exists, every member reaction of the layout's pathways is
// placed, nothing overlaps, generated edges are current, and the build script's checks catch what they should.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import entities from '../../src/knowledge/data/index.js'
import quant from '../../src/knowledge/data/quant.js'
import { buildGraph } from '../../src/knowledge/graph.js'
import { edgeSign } from '../../src/knowledge/relations.js'
import { LAYOUTS, LAYOUT_IDS, loadLayout } from '../../src/viz/layouts/index.js'
import { COMPOUND_HEIGHT, REACTION_SIZE, boxesOverlap, closestPair, findOverlaps, nodeBox, nodeWidth, outOfBounds } from '../../src/viz/layouts/geometry.js'
import { CURRENCY_IDS, LAYOUT_DIR, checkLayout, deriveLayout, indexEntities, layoutNames, pathwayReactions, renderGenerated, replaceGenerated } from '../../scripts/layout-build.js'

const byId = indexEntities(entities)
const graph = buildGraph(entities)
const layouts = await Promise.all(LAYOUT_IDS.map(async (id) => [id, await loadLayout(id)]))

describe('registry', () => {
  it('lists every layout file and nothing else', () => {
    const files = readdirSync(LAYOUT_DIR).filter((name) => name.endsWith('.js') && !['index.js', 'geometry.js'].includes(name)).map((name) => name.replace(/\.js$/, '')).sort()
    expect([...LAYOUT_IDS].sort()).toEqual(files)
    expect(layoutNames()).toEqual(files)
    for (const id of LAYOUT_IDS) expect(LAYOUTS[id].title, id).toBeTruthy()
  })

  it('covers the six maps the site needs', async () => {
    expect(LAYOUT_IDS).toEqual(expect.arrayContaining(['core-methylation', 'gastric-acid', 'bile-acid-conjugation', 'tma-tmao-axis', 'gaba-shunt-b6', 'glycine-flux']))
    expect(await loadLayout('nope')).toBeNull()
  })

  it('gives each layout the id it is registered under and the same title', () => {
    for (const [id, layout] of layouts) {
      expect(layout.id).toBe(id)
      expect(layout.title).toBe(LAYOUTS[id].title)
    }
  })
})

describe.each(layouts)('layout %s', (id, layout) => {
  it('passes every check of the build script', () => {
    expect(checkLayout(layout, entities, quant)).toEqual([])
  })

  it('references entities that exist, with the right kind and finite coordinates', () => {
    const seen = new Set()
    for (const node of layout.nodes) {
      expect(seen.has(node.id), `duplicate ${node.id}`).toBe(false)
      seen.add(node.id)
      expect(byId.get(node.id)?.type, node.id).toBe(node.kind)
      expect(Number.isFinite(node.x) && Number.isFinite(node.y), node.id).toBe(true)
      expect(node.label, node.id).toBeTruthy()
    }
  })

  it('places every member reaction of its pathways and the extra reactions it names', () => {
    const placed = new Set(layout.nodes.map((node) => node.id))
    const wanted = [...pathwayReactions(graph, layout.pathways), ...(layout.extraReactions ?? [])]
    expect(wanted.length).toBeGreaterThan(0)
    for (const reaction of wanted) expect(placed.has(reaction), reaction).toBe(true)
    for (const pathway of layout.pathways) expect(graph.get(pathway).type).toBe('pathway')
  })

  it('has no overlapping nodes and keeps a minimum distance between centres', () => {
    expect(findOverlaps(layout.nodes)).toEqual([])
    expect(closestPair(layout.nodes).distance).toBeGreaterThanOrEqual(34)
  })

  it('keeps every node inside the view box', () => {
    expect(outOfBounds(layout.nodes, layout.viewBox)).toEqual([])
    expect(layout.viewBox.width).toBeGreaterThanOrEqual(1000)
    expect(layout.viewBox.height).toBeGreaterThanOrEqual(700)
  })

  it('draws a node inside the group box it names (label-only groups have no box)', () => {
    const groups = new Map(layout.groups.map((group) => [group.id, group]))
    expect(groups.size).toBe(layout.groups.length)
    for (const node of layout.nodes.filter((item) => item.group)) {
      const group = groups.get(node.group)
      expect(group, `${node.id} names group ${node.group}`).toBeTruthy()
      if (group.width === undefined) continue // a label-only group has no box
      const inside = node.x >= group.x && node.x <= group.x + group.width && node.y >= group.y && node.y <= group.y + group.height
      expect(inside, `${node.id} at ${node.x},${node.y} outside group ${node.group}`).toBe(true)
    }
  })

  it('has edges that join placed reactions to placed participants and match the ontology exactly', () => {
    const nodes = new Map(layout.nodes.map((node) => [node.id, node]))
    const derived = deriveLayout(layout, byId)
    expect(derived.issues).toEqual([])
    expect(layout.edges).toEqual(derived.edges)
    expect(layout.reactions).toEqual(derived.reactions)
    for (const edge of layout.edges) {
      const reaction = edge.role === 'substrate' ? edge.to : edge.from
      const compound = edge.role === 'substrate' ? edge.from : edge.to
      expect(nodes.get(reaction)?.kind, `${edge.from} -> ${edge.to}`).toBe('reaction')
      expect(nodes.get(compound)?.kind, `${edge.from} -> ${edge.to}`).toBe('compound')
      expect(edge.n).toBeGreaterThan(0)
    }
    const reactionNodes = layout.nodes.filter((node) => node.kind === 'reaction').map((node) => node.id).sort()
    expect(Object.keys(layout.reactions).sort()).toEqual(reactionNodes)
  })

  it('draws every reaction with at least one substrate and one product, drawn or pooled', () => {
    for (const [reaction, details] of Object.entries(layout.reactions)) {
      expect(details.substrates.length + details.pooled.substrates.length, `${reaction} substrates`).toBeGreaterThan(0)
      expect(details.products.length + details.pooled.products.length, `${reaction} products`).toBeGreaterThan(0)
      for (const enzyme of details.enzymes) expect(byId.get(enzyme)?.type, `${reaction} ${enzyme}`).toBe('enzyme')
      expect(details.reversible).toBe(byId.get(reaction).reaction.reversible === true)
    }
  })

  it('never pools a metabolite that it also draws, and pools only what is not drawn', () => {
    const drawn = new Set(layout.nodes.map((node) => node.id))
    for (const details of Object.values(layout.reactions)) {
      for (const item of [...details.pooled.substrates, ...details.pooled.products]) {
        expect(drawn.has(item.id), item.id).toBe(false)
        expect(CURRENCY_IDS.has(item.id) || (layout.pool ?? []).includes(item.id), item.id).toBe(true)
      }
    }
  })

  it('connects every node to the rest of the map by an edge or a link', () => {
    const connected = new Set()
    for (const edge of layout.edges) {
      connected.add(edge.from)
      connected.add(edge.to)
    }
    for (const link of layout.links ?? []) {
      connected.add(link.from)
      connected.add(link.to)
    }
    expect(layout.nodes.filter((node) => !connected.has(node.id)).map((node) => node.id)).toEqual([])
  })

  it('has links between placed nodes with a sign and no duplicates', () => {
    const placed = new Set(layout.nodes.map((node) => node.id))
    const seen = new Set()
    for (const link of layout.links ?? []) {
      expect(placed.has(link.from) && placed.has(link.to), `${link.from} -> ${link.to}`).toBe(true)
      expect(['+', '-'], `${link.from} -> ${link.to}`).toContain(link.sign)
      const key = `${link.from}|${link.to}`
      expect(seen.has(key), key).toBe(false)
      seen.add(key)
    }
  })

  it('draws only links that the knowledge base states as signed edges (a reaction stands for its enzymes)', () => {
    // a link end that is a reaction also matches the enzymes that catalyse it
    const ends = (nodeId) => {
      const found = new Set([nodeId])
      if (byId.get(nodeId).type === 'reaction') for (const edge of graph.incoming(nodeId)) if (edge.rel === 'catalyzes') found.add(edge.from)
      return found
    }
    for (const link of layout.links ?? []) {
      const sources = ends(link.from)
      const targets = ends(link.to)
      const edge = graph.edges.find((item) => sources.has(item.from) && targets.has(item.to) && edgeSign(item) === link.sign)
      expect(edge, `${link.from} -> ${link.to} (${link.sign}) has no matching signed edge`).toBeTruthy()
    }
  })

  it('names quantities that exist for flux encoding', () => {
    const ids = new Set(quant.map((record) => record.id))
    const placed = new Set(layout.nodes.map((node) => node.id))
    for (const [node, refs] of Object.entries(layout.quantRefs ?? {})) {
      expect(placed.has(node), node).toBe(true)
      for (const ref of refs) expect(ids.has(ref), ref).toBe(true)
    }
  })

  it('keeps its generated block current: rewriting it changes nothing', () => {
    const source = readSource(id)
    expect(replaceGenerated(source, deriveLayout(layout, byId))).toBe(source)
  })
})

describe('the core methylation map', () => {
  const core = layouts.find(([id]) => id === 'core-methylation')?.[1]

  it('is a network of about a hundred nodes in a 1600 x 1000 view box', () => {
    expect(core.viewBox).toEqual({ width: 1600, height: 1000 })
    expect(core.nodes.length).toBeGreaterThanOrEqual(100)
    expect(core.nodes.length).toBeLessThanOrEqual(160)
    expect(core.nodes.filter((node) => node.kind === 'reaction').length).toBeGreaterThanOrEqual(40)
    expect(core.nodes.filter((node) => node.kind === 'compound').length).toBeGreaterThanOrEqual(50)
  })

  it('covers the methionine cycle, folate cycle, transsulfuration, choline oxidation, glycine, PEMT, Kennedy, creatine, NNMT, histamine and DNMT', () => {
    const ids = new Set(core.nodes.map((node) => node.id))
    for (const id of [
      'reaction:mat-sam-synthesis', 'reaction:ahcy-sah-hydrolysis', 'reaction:mtr-methionine-synthase', 'reaction:bhmt-betaine-homocysteine', 'reaction:mthfr-methylene-thf-reduction',
      'reaction:dhfr-dihydrofolate-reduction', 'reaction:shmt-serine-glycine-interconversion', 'reaction:glycine-cleavage-system', 'reaction:cbs-cystathionine-synthesis',
      'reaction:cth-cystathionine-cleavage', 'reaction:chdh-choline-oxidation', 'reaction:pemt-pe-to-pc', 'reaction:chpt1-cdp-choline-to-pc', 'reaction:gamt-creatine-synthesis',
      'reaction:nnmt-nicotinamide-methylation', 'reaction:hnmt-histamine-methylation', 'reaction:dao-histamine-oxidation', 'reaction:dnmt-dna-cytosine-methylation',
      'reaction:gnmt-glycine-methylation', 'reaction:comt-dopamine-methylation',
      'compound:sam', 'compound:sah', 'compound:homocysteine', 'compound:methionine', 'compound:glycine', 'compound:serine', 'compound:choline', 'compound:betaine', 'compound:5-mthf', 'compound:thf'
    ]) expect(ids.has(id), id).toBe(true)
  })

  it('places SAM as the hub that every methyltransferase reaction reads from', () => {
    const sam = core.reactions
    const consumers = Object.entries(sam).filter(([, details]) => details.substrates.some((item) => item.id === 'compound:sam')).map(([id]) => id)
    expect(consumers.length).toBeGreaterThanOrEqual(8)
    for (const id of ['reaction:gnmt-glycine-methylation', 'reaction:pemt-pe-to-pc', 'reaction:gamt-creatine-synthesis', 'reaction:nnmt-nicotinamide-methylation', 'reaction:hnmt-histamine-methylation', 'reaction:comt-dopamine-methylation', 'reaction:dnmt-dna-cytosine-methylation']) {
      expect(consumers, id).toContain(id)
    }
  })
})

describe('geometry', () => {
  it('sizes compound boxes from their label and reaction marks as squares', () => {
    expect(nodeWidth({ kind: 'reaction', label: 'GNMT' })).toBe(REACTION_SIZE)
    expect(nodeWidth({ kind: 'compound', label: 'SAM' })).toBe(64)
    expect(nodeWidth({ kind: 'compound', label: 'Cardiovascular disease' })).toBeGreaterThan(130)
    expect(nodeWidth({ kind: 'compound', label: 'x'.repeat(100) })).toBe(200)
    const box = nodeBox({ kind: 'compound', label: 'SAM', x: 100, y: 50 })
    expect(box).toMatchObject({ x0: 68, x1: 132, y0: 50 - COMPOUND_HEIGHT / 2, y1: 50 + COMPOUND_HEIGHT / 2 })
  })

  it('detects overlaps, with a gap', () => {
    const a = nodeBox({ kind: 'compound', label: 'SAM', x: 100, y: 100 })
    expect(boxesOverlap(a, nodeBox({ kind: 'compound', label: 'SAH', x: 150, y: 100 }))).toBe(true)
    expect(boxesOverlap(a, nodeBox({ kind: 'compound', label: 'SAH', x: 180, y: 100 }))).toBe(false)
    expect(boxesOverlap(a, nodeBox({ kind: 'compound', label: 'SAH', x: 180, y: 100 }), 30)).toBe(true)
    const nodes = [{ id: 'a', kind: 'compound', label: 'A', x: 100, y: 100 }, { id: 'b', kind: 'compound', label: 'B', x: 120, y: 100 }, { id: 'c', kind: 'compound', label: 'C', x: 400, y: 400 }]
    expect(findOverlaps(nodes)).toEqual([['a', 'b']])
    expect(closestPair(nodes)).toEqual({ distance: 20, pair: ['a', 'b'] })
  })

  it('finds nodes that leave the view box', () => {
    const nodes = [{ id: 'in', kind: 'compound', label: 'In', x: 100, y: 100 }, { id: 'out', kind: 'compound', label: 'Out', x: 1590, y: 100 }]
    expect(outOfBounds(nodes, { width: 1600, height: 1000 })).toEqual(['out'])
  })
})

describe('the build script checks', () => {
  const minimal = (overrides = {}) => ({
    id: 'test',
    title: 'Test',
    viewBox: { width: 1280, height: 800 },
    pathways: ['pathway:histamine-degradation'],
    groups: [{ id: 'g', label: 'G', x: 0, y: 0, width: 1280, height: 800 }],
    nodes: [
      { id: 'compound:histamine', kind: 'compound', x: 200, y: 200, label: 'Histamine', group: 'g' },
      { id: 'reaction:hnmt-histamine-methylation', kind: 'reaction', x: 400, y: 200, label: 'HNMT', group: 'g' },
      { id: 'compound:methylhistamine', kind: 'compound', x: 600, y: 200, label: 'Methylhistamine', group: 'g' },
      { id: 'reaction:dao-histamine-oxidation', kind: 'reaction', x: 400, y: 400, label: 'DAO', group: 'g' },
      { id: 'compound:imidazole-acetaldehyde', kind: 'compound', x: 600, y: 400, label: 'Imidazole acetaldehyde', group: 'g' }
    ],
    pool: ['compound:sam', 'compound:sah'],
    links: [],
    ...overrides
  })
  const rules = (layout) => checkLayout(layout, entities, quant).map((issue) => issue.rule)

  it('accepts a minimal valid layout', () => {
    expect(rules(minimal())).toEqual([])
    const derived = deriveLayout(minimal(), byId)
    expect(derived.edges).toEqual(expect.arrayContaining([{ from: 'compound:histamine', to: 'reaction:hnmt-histamine-methylation', role: 'substrate', n: 1 }, { from: 'reaction:hnmt-histamine-methylation', to: 'compound:methylhistamine', role: 'product', n: 1 }]))
    expect(derived.reactions['reaction:hnmt-histamine-methylation'].pooled).toEqual({ substrates: [{ id: 'compound:sam', n: 1 }], products: [{ id: 'compound:sah', n: 1 }, { id: 'compound:proton', n: 1 }] })
    expect(derived.reactions['reaction:hnmt-histamine-methylation'].enzymes).toEqual(['enzyme:hnmt'])
  })

  it('fails on unknown entities, wrong kinds and bad coordinates', () => {
    const layout = minimal()
    layout.nodes.push({ id: 'compound:nonexistent', kind: 'compound', x: 800, y: 200, label: 'Ghost', group: 'g' })
    layout.nodes.push({ id: 'enzyme:hnmt', kind: 'compound', x: 800, y: 300, label: 'HNMT', group: 'g' })
    layout.nodes.push({ id: 'enzyme:dao', kind: 'enzyme', x: Number.NaN, y: 300, label: 'DAO', group: 'g' })
    expect(rules(layout)).toEqual(expect.arrayContaining(['unknown-entity', 'kind-mismatch', 'coordinates']))
  })

  it('fails when a member reaction has no coordinates', () => {
    const layout = minimal()
    layout.nodes = layout.nodes.filter((node) => node.id !== 'reaction:dao-histamine-oxidation')
    expect(checkLayout(layout, entities, quant).filter((issue) => issue.rule === 'reaction-missing').map((issue) => issue.id)).toEqual(['reaction:dao-histamine-oxidation'])
  })

  it('fails when a reaction participant is neither placed nor pooled', () => {
    const layout = minimal({ pool: [] })
    expect(checkLayout(layout, entities, quant).filter((issue) => issue.rule === 'participant-missing').length).toBeGreaterThanOrEqual(2)
    const layout2 = minimal()
    layout2.nodes = layout2.nodes.filter((node) => node.id !== 'compound:methylhistamine')
    expect(checkLayout(layout2, entities, quant).some((issue) => issue.rule === 'participant-missing' && /methylhistamine/.test(issue.message))).toBe(true)
  })

  it('fails on overlapping nodes, nodes outside the view box and duplicate nodes', () => {
    const overlap = minimal()
    overlap.nodes[2] = { ...overlap.nodes[2], x: 210, y: 205 }
    expect(rules(overlap)).toContain('overlap')
    const outside = minimal()
    outside.nodes[2] = { ...outside.nodes[2], x: 1270 }
    expect(rules(outside)).toContain('out-of-bounds')
    const twice = minimal()
    twice.nodes.push({ ...twice.nodes[0], x: 900, y: 600 })
    expect(rules(twice)).toContain('duplicate-node')
  })

  it('fails on unknown groups, links to nothing, pool conflicts and missing quantities', () => {
    const layout = minimal({ links: [{ from: 'compound:histamine', to: 'compound:none', sign: '+' }], pool: ['compound:histamine', 'compound:ghost'], quantRefs: { 'compound:histamine': ['quant:nothing'], 'compound:other': [] } })
    layout.nodes[0] = { ...layout.nodes[0], group: 'nowhere' }
    expect(rules(layout)).toEqual(expect.arrayContaining(['unknown-group', 'unknown-link-end', 'pool-and-node', 'unknown-entity', 'quant-ref', 'quant-ref-node']))
  })

  it('rewrites only the generated block and is idempotent', () => {
    const layout = minimal()
    const derivation = deriveLayout(layout, byId)
    const source = `const layout = {}\n// BEGIN GENERATED by scripts/build-layout.js (x)\nconst generated = { edges: [], reactions: {} }\n// END GENERATED\n\nexport default { ...layout, ...generated }\n`
    const once = replaceGenerated(source, derivation)
    expect(once).toContain('role: \'substrate\'')
    expect(once.startsWith('const layout = {}\n')).toBe(true)
    expect(once.endsWith('export default { ...layout, ...generated }\n')).toBe(true)
    expect(replaceGenerated(once, derivation)).toBe(once)
    expect(renderGenerated(derivation)).toContain('// END GENERATED')
    expect(() => replaceGenerated('no markers', derivation)).toThrow(/markers not found/)
  })

  it('knows which reactions belong to a pathway', () => {
    expect(pathwayReactions(graph, ['pathway:histamine-degradation']).sort()).toEqual(['reaction:dao-histamine-oxidation', 'reaction:hnmt-histamine-methylation'])
    expect(pathwayReactions(graph, [])).toEqual([])
  })
})

function readSource(id) {
  return readFileSync(join(LAYOUT_DIR, `${id}.js`), 'utf8')
}
