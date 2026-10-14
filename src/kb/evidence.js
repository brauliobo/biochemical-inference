// Evidence dashboards: pure helpers (no Vue, no DOM). Everything the claim audit, the literature
// views and the claim and article templates show is computed here from the knowledge graph.
//
//   buildEvidenceModel(graph) -> { articles, claims, ... }   (cached per graph)
//
// The scoring is deliberately simple and written down (see SCORING below, surfaced in the UI as
// "How is this scored?"): a descriptive summary of the recorded sources, NOT a meta-analysis. There
// are no effect sizes, sample sizes or risk-of-bias ratings behind it.
import { CLAIM_STATUS_KEYS, EVIDENCE_GRADES, EVIDENCE_KEYS, claimStatusInfo } from '../knowledge/evidence.js'
import { TYPES } from '../knowledge/types.js'

// ------------------------------------------------------------------ routes

export const EVIDENCE_PATH = '/evidence'
export const CLAIMS_PATH = `${EVIDENCE_PATH}/claims`
export const LITERATURE_PATH = `${EVIDENCE_PATH}/literature`

// ------------------------------------------------------------------ study designs

/**
 * Canonical study designs, strongest first. `weight` is the design weight used by the scoring,
 * `human` says whether the design observes people (true), animals or isolated systems (false) or is
 * a secondary/reference source (null). `look` is the marker slot shared with the viz Timeline lanes.
 */
export const DESIGN_CLASSES = Object.freeze([
  { id: 'meta-analysis', label: 'Meta-analysis', short: 'Meta-analysis', weight: 1, human: true, note: 'Pooled estimate over several studies.' },
  { id: 'systematic review', label: 'Systematic review', short: 'Syst. review', weight: 0.9, human: true, note: 'Structured search and appraisal, no pooled estimate.' },
  { id: 'RCT', label: 'Randomised controlled trial', short: 'RCT', weight: 0.85, human: true, note: 'People randomised to an intervention or a control.' },
  { id: 'guideline', label: 'Guideline or consensus', short: 'Guideline', weight: 0.65, human: true, note: 'Expert body summarising evidence (dietary reference values, consensus statements).' },
  { id: 'human experimental', label: 'Human experimental study', short: 'Human exp.', weight: 0.6, human: true, note: 'Non-randomised experiments on people: physiology, tracer, pharmacokinetic, imaging, feeding and depletion studies.' },
  { id: 'cohort/observational', label: 'Cohort or observational', short: 'Observational', weight: 0.5, human: true, note: 'Cohort, case-control, cross-sectional, survey and association studies.' },
  { id: 'case report', label: 'Case report or series', short: 'Case report', weight: 0.2, human: true, note: 'One or a few patients.' },
  { id: 'mechanistic/animal', label: 'Mechanistic, animal or model', short: 'Animal/model', weight: 0.3, human: false, note: 'Animal experiments and mechanistic or kinetic models.' },
  { id: 'in-vitro', label: 'In vitro or enzymology', short: 'In vitro', weight: 0.15, human: false, note: 'Purified or recombinant enzymes, cells and tissue preparations.' },
  { id: 'review', label: 'Narrative review or expert opinion', short: 'Review', weight: 0.35, human: null, note: 'Secondary source: summarises other work without a structured method.' },
  { id: 'database/reference', label: 'Database, textbook or reference', short: 'Reference', weight: 0.3, human: null, note: 'Databases, textbooks, assay and composition references, risk assessments.' }
].map((design, index) => Object.freeze({ ...design, look: index % 8 })))

export const DESIGN_IDS = Object.freeze(DESIGN_CLASSES.map((design) => design.id))
const UNCLASSIFIED = Object.freeze({ id: 'unclassified', label: 'Unclassified', short: 'Other', weight: 0.2, human: null, note: 'A design text the rules do not recognise.', look: 7 })
const DESIGN_BY_ID = new Map(DESIGN_CLASSES.map((design) => [design.id, design]))

/** The canonical design record for a class id (or the "unclassified" record). */
export const designInfo = (id) => DESIGN_BY_ID.get(id) ?? UNCLASSIFIED

// First matching rule wins, so the order is the policy: pooled/structured syntheses, then trials,
// then guidelines, then small clinical series, then assay or reference sources, then observational
// studies, then animals and models, then lab work, then reviews, then the human experiments.
const DESIGN_RULES = Object.freeze([
  [/meta-?analys/, 'meta-analysis'],
  [/systematic/, 'systematic review'],
  [/^rct$|randomi[sz]ed/, 'RCT'],
  [/guideline|consensus/, 'guideline'],
  [/case[ -]report|case series/, 'case report'],
  [/assay|analytical method|food composition|textbook|database|risk assessment/, 'database/reference'],
  [/depletion|feeding|ward\b/, 'human experimental'],
  [/cohort|case-control|cross-sectional|survey|genetic[ -]association|autopsy/, 'cohort/observational'],
  [/animal|knockout|\bmouse\b|\bmice\b|\brats?\b|mathematical|model/, 'mechanistic/animal'],
  [/in[ -]vitro|enzymology|biochemistry/, 'in-vitro'],
  [/review|expert|workshop|opinion/, 'review'],
  [/physiolog|tracer|pharmacokinetic|imaging|trial|controlled|intervention|dose|clinical|before.after|uncontrolled|human/, 'human experimental']
])

/**
 * Canonical design class id for the free-text `facts.design` of an article
 * ("controlled crossover study" -> "human experimental"). Unknown text gives "unclassified".
 */
export function normalizeDesign(raw) {
  const text = String(raw ?? '').trim().toLowerCase()
  if (!text) return UNCLASSIFIED.id
  for (const [pattern, id] of DESIGN_RULES) if (pattern.test(text)) return id
  return UNCLASSIFIED.id
}

// ------------------------------------------------------------------ scoring (written down)

/** Weight of an unknown-direction prior added to the denominator of the support index. */
export const PRIOR_WEIGHT = 1
/** An unverified citation counts half. */
export const UNVERIFIED_FACTOR = 0.5

export const SCORING = Object.freeze({
  summary: 'A descriptive summary of the recorded sources for and against a claim. It is not a meta-analysis: it ignores effect sizes, sample sizes and risk of bias, and it only sees the articles in this knowledge base.',
  steps: Object.freeze([
    'Each article that supports or contradicts a claim gets a weight from its study design (table below). An unverified citation counts half.',
    'Evidence for = the sum of the weights of the supporting articles. Evidence against = the sum for the contradicting ones.',
    'Support index = (for - against) / (for + against + 1). The 1 is a prior of one study of unknown direction, so a claim with no source sits at 0 and one weak study cannot push a claim far from 0.',
    'The index runs from -1 (contradicted) to +1 (strongly supported). It is shown next to the curated claim status, which also weighs mechanism and indirect evidence the index cannot see.'
  ]),
  formula: 'support index = (for - against) / (for + against + 1)'
})

/** Weight of one article: its design weight, halved if its citation has not been verified. */
export function articleWeight({ design, verified = true }) {
  return designInfo(design).weight * (verified === false ? UNVERIFIED_FACTOR : 1)
}

/** Support index in (-1, 1) from the summed weights for and against. */
export function supportIndex(evidenceFor, evidenceAgainst) {
  const total = evidenceFor + evidenceAgainst + PRIOR_WEIGHT
  return (evidenceFor - evidenceAgainst) / total
}

const round = (value, places = 2) => Math.round(value * 10 ** places) / 10 ** places

// ------------------------------------------------------------------ topics

export const TOPICS = Object.freeze([
  { id: 'gastric', label: 'Gastric acid and reflux', short: 'Gastric' },
  { id: 'methylation', label: 'Methylation and glycine', short: 'Methylation' },
  { id: 'choline', label: 'Choline, betaine and TMA', short: 'Choline/TMA' },
  { id: 'histamine', label: 'Histamine and sleep', short: 'Histamine/sleep' },
  { id: 'b6-gaba', label: 'B6 and GABA', short: 'B6/GABA' },
  { id: 'supplements', label: 'Supplements and herbs', short: 'Supplements' }
].map((topic) => Object.freeze(topic)))
export const TOPIC_IDS = Object.freeze(TOPICS.map((topic) => topic.id))
export const topicInfo = (id) => TOPICS.find((topic) => topic.id === id) ?? TOPICS[1]

// Keywords matched against the words of an entity id. A topic is a reading aid, not an ontology:
// each claim and article goes to the topic whose keywords match most of the entities it is about.
const TOPIC_PATTERNS = Object.freeze({
  gastric: /gastr|acid|\bppi|pylori|sibo|belch|reflux|lpr|pepsin|ulcer|stomach|bicarbonate|duoden|pylorus|esophag|oesophag|dyspepsia|motilin|secretin|emptying|hypochlorhydria|carbon dioxide|\bco2|throat|larynx|pharyn|gerd|mucos|aerophagia|flatus|tlesr|\bbile|\bhcl|intestin|digest|\bmmc|prokinetic|\bgut|\bles\b|parietal/g,
  methylation: /\bsam\b|\bsah\b|gnmt|methyl|homocysteine|methionine|mthfr|folate|folic|b12|cobalamin|dnmt|\bmat[0-9a-z]*\b|ahcy|\bcbs\b|transsulfur|cystathionine|creatine|gamt|gatm|nnmt|niacin|nicotinamide|glycine|serine|shmt|collagen|sarcosine|glutathione|one carbon|dhfr|\bthf\b|\bmtr\b/g,
  choline: /choline|betaine|\btma|tmao|pemt|phosphatidyl|kennedy|carnitine|fishy|lecithin|\bgpc|bhmt|trimethyl|chdh|\bdmg/g,
  histamine: /histamin|hnmt|\bdao\b|sleep|night|waking|circadian|tachycardia|flushing|\bmast\b|vagal|autonomic|insomnia|nocturnal|acetylcholine/g,
  'b6-gaba': /\bb6\b|\bplp\b|\bp5p|pyridox|gaba|\bgad[0-9]?\b|pyroluria|anxiety|magnesium|glutamate|brain/g,
  supplements: /supplement|powder|extract|\boil\b|\bdgl|licorice|glutamine|artichoke|carnosine|oregano|espinheira|threonate|alginate|ginger|beta alanine|peptides|thymol/g
})

const wordsOf = (id) => String(id).replace(/^[a-z]+:/, '').replace(/-/g, ' ')

/** Keyword matches per topic in a text: { gastric: 2, methylation: 0, ... }. */
export function topicScores(text) {
  const scores = {}
  for (const topic of TOPIC_IDS) scores[topic] = (String(text).toLowerCase().match(TOPIC_PATTERNS[topic]) ?? []).length
  return scores
}

function bestTopic(scores) {
  let best = 'methylation'
  let top = 0
  for (const topic of TOPIC_IDS) {
    if (scores[topic] > top) {
      best = topic
      top = scores[topic]
    }
  }
  return best
}

// ------------------------------------------------------------------ model

const STANCE_BY_REL = Object.freeze({ 'has-evidence': 'supports', 'has-counterevidence': 'contradicts' })

/** "Mudd SH" -> "Mudd"; organisation names stay whole. */
function surname(author) {
  return String(author ?? '').replace(/\s+[A-Z]{1,3}$/, '').trim()
}

/** "Mudd et al.", "Taylor & Smith", or "Anonymous". */
export function shortAuthors(authors = []) {
  if (!authors.length) return 'Anonymous'
  if (authors.length === 1) return surname(authors[0])
  if (authors.length === 2) return `${surname(authors[0])} & ${surname(authors[1])}`
  return `${surname(authors[0])} et al.`
}

function articleEntry(graph, entity) {
  const design = normalizeDesign(entity.facts?.design)
  const informs = []
  const seen = new Set()
  for (const link of graph.links(entity.id)) {
    if (link.rel !== 'evidence-for' && link.rel !== 'evidence-against') continue
    if (seen.has(link.other) || !graph.get(link.other)) continue
    seen.add(link.other)
    const target = graph.get(link.other)
    informs.push({ id: target.id, type: target.type, name: target.name, stance: link.rel === 'evidence-for' ? 'supports' : 'contradicts', ...(link.note ? { note: link.note } : {}) })
  }
  return {
    id: entity.id,
    name: entity.name,
    year: entity.year,
    journal: entity.journal,
    authors: entity.authors ?? [],
    byline: shortAuthors(entity.authors),
    doi: entity.doi ?? null,
    pmid: entity.pmid ?? null,
    url: entity.url ?? null,
    verified: entity.verified !== false,
    grade: entity.evidence,
    designText: entity.facts?.design ?? '',
    design,
    designLabel: designInfo(design).label,
    population: entity.facts?.population ?? '',
    weight: round(articleWeight({ design, verified: entity.verified }), 3),
    takeaways: entity.takeaways ?? [],
    informs,
    nInforms: informs.length,
    claimIds: informs.filter((item) => item.type === 'claim').map((item) => item.id),
    topic: 'methylation'
  }
}

function claimEntry(graph, entity, articleById) {
  const supporting = []
  const contradicting = []
  const associated = []
  for (const link of graph.links(entity.id)) {
    const stance = STANCE_BY_REL[link.rel]
    const other = graph.get(link.other)
    if (stance && other?.type === 'article') {
      const article = articleById.get(other.id)
      if (article) (stance === 'supports' ? supporting : contradicting).push(article)
    } else if (link.rel === 'associated-with' && other) {
      associated.push(other.id)
    }
  }
  const sum = (list) => round(list.reduce((total, article) => total + article.weight, 0), 3)
  const evidenceFor = sum(supporting)
  const evidenceAgainst = sum(contradicting)
  const all = [...supporting, ...contradicting]
  const best = all.reduce((top, article) => (top === null || article.weight > top.weight ? article : top), null)
  const edges = graph.edges.filter((edge) => edge.claim === entity.id)
  const text = `${wordsOf(entity.id)} ${wordsOf(entity.id)} ${wordsOf(entity.id)} ${associated.map(wordsOf).join(' ')}`
  const humanFor = supporting.filter((article) => designInfo(article.design).human === true).length
  const humanAgainst = contradicting.filter((article) => designInfo(article.design).human === true).length
  const nonHuman = all.filter((article) => designInfo(article.design).human === false).length
  const years = all.map((article) => article.year)
  const designMix = {}
  for (const article of all) designMix[article.design] = (designMix[article.design] ?? 0) + 1
  return {
    id: entity.id,
    name: entity.name,
    statement: entity.statement,
    summary: entity.summary,
    status: entity.status,
    source: entity.source,
    grade: entity.evidence,
    topic: bestTopic(topicScores(text)),
    associated,
    supporting,
    contradicting,
    nFor: supporting.length,
    nAgainst: contradicting.length,
    evidenceFor,
    evidenceAgainst,
    index: round(supportIndex(evidenceFor, evidenceAgainst), 3),
    bestDesign: best ? best.design : null,
    bestWeight: best ? best.weight : 0,
    designMix,
    humanFor,
    humanAgainst,
    nonHuman,
    newestYear: years.length ? Math.max(...years) : null,
    oldestYear: years.length ? Math.min(...years) : null,
    edges: edges.length,
    hypothesisEdges: edges.filter((edge) => edge.hypothesis === true).length
  }
}

const modelCache = new WeakMap()

/**
 * Everything the evidence views need, computed once per graph:
 * { articles, articleById, claims, claimById, topicOfArticle(id) } plus the totals.
 */
export function buildEvidenceModel(graph) {
  const cached = modelCache.get(graph)
  if (cached) return cached

  const articles = (graph.byType.get('article') ?? []).map((entity) => articleEntry(graph, entity))
  const articleById = new Map(articles.map((article) => [article.id, article]))
  const claims = (graph.byType.get('claim') ?? []).map((entity) => claimEntry(graph, entity, articleById))
  const claimById = new Map(claims.map((claim) => [claim.id, claim]))

  // An article belongs to the topic of what it informs: its own id words count double, each
  // informed entity adds its keyword matches, and an informed claim votes with its topic.
  for (const article of articles) {
    const scores = Object.fromEntries(TOPIC_IDS.map((topic) => [topic, 0]))
    const own = topicScores(wordsOf(article.id))
    for (const topic of TOPIC_IDS) scores[topic] += 2 * own[topic]
    for (const item of article.informs) {
      if (item.type === 'claim') {
        const claim = claimById.get(item.id)
        if (claim) scores[claim.topic] += 3
        continue
      }
      const matched = topicScores(wordsOf(item.id))
      for (const topic of TOPIC_IDS) scores[topic] += matched[topic]
    }
    article.topic = bestTopic(scores)
  }

  const model = Object.freeze({
    articles,
    articleById,
    claims,
    claimById,
    totals: Object.freeze({ articles: articles.length, claims: claims.length })
  })
  modelCache.set(graph, model)
  return model
}

// ------------------------------------------------------------------ aggregates

export const STATUS_ORDER = Object.freeze(['supported', 'partly-supported', 'unsupported', 'contested'])

/** Marker look (viz series slot) of each claim status: a shape and colour, so status is never colour alone. */
export const STATUS_LOOK = Object.freeze({ supported: 2, 'partly-supported': 0, unsupported: 1, contested: 3 })
/** Marker looks of the two stances: supports is a blue circle, contradicts a vermillion square. */
export const STANCE_LOOK = Object.freeze({ supports: 0, contradicts: 1 })

/** [{ status, label, tone, count, share }] in display order. */
export function statusCounts(claims) {
  const total = claims.length || 1
  return STATUS_ORDER.map((status) => {
    const count = claims.filter((claim) => claim.status === status).length
    return { status, ...claimStatusInfo(status), count, share: count / total }
  })
}

/** Entity type (rows) by evidence grade (columns) counts, for the Heatmap. */
export function typeGradeMatrix(graph) {
  const rows = TYPES.map((type) => ({ id: type.id, label: type.plural }))
  const cols = EVIDENCE_KEYS.map((grade) => ({ id: grade, label: EVIDENCE_GRADES[grade].label }))
  const counts = new Map()
  for (const entity of graph.entities) {
    const key = `${entity.type}|${entity.evidence}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return { rows, cols, values: (row, col) => counts.get(`${row}|${col}`) ?? 0 }
}

/** Topic (rows) by study design (columns) article counts, for the coverage Heatmap. */
export function coverageMatrix(articles) {
  const rows = TOPICS.map((topic) => ({ id: topic.id, label: topic.label, short: topic.short }))
  const cols = DESIGN_CLASSES.map((design) => ({ id: design.id, label: design.label, short: design.short }))
  const counts = new Map()
  for (const article of articles) {
    const key = `${article.topic}|${article.design}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return { rows, cols, values: (row, col) => counts.get(`${row}|${col}`) ?? 0, count: (row, col) => counts.get(`${row}|${col}`) ?? 0 }
}

const TRIAL_DESIGNS = Object.freeze(['meta-analysis', 'systematic review', 'RCT'])
const HUMAN_DESIGNS = Object.freeze(DESIGN_CLASSES.filter((design) => design.human === true).map((design) => design.id))
/** Below this many randomised trials in a topic the coverage view calls the topic thin. */
export const THIN_RCT_COUNT = 3

/**
 * Where the evidence is thin: for every topic the number of articles, how many observe people, how
 * many of each trial-level design exist, the strongest design present, and a list of plain gaps
 * ("no meta-analysis", "only 1 RCT", "no human data"). Thinnest first.
 */
export function coverageGaps(articles) {
  return TOPICS.map((topic) => {
    const mine = articles.filter((article) => article.topic === topic.id)
    const count = (design) => mine.filter((article) => article.design === design).length
    const trials = mine.filter((article) => TRIAL_DESIGNS.includes(article.design)).length
    const human = mine.filter((article) => HUMAN_DESIGNS.includes(article.design)).length
    const strongest = mine.reduce((best, article) => (best === null || designInfo(article.design).weight > designInfo(best).weight ? article.design : best), null)
    const rct = count('RCT')
    const gaps = []
    if (!count('meta-analysis')) gaps.push('no meta-analysis')
    if (!count('systematic review')) gaps.push('no systematic review')
    if (!rct) gaps.push('no RCT')
    else if (rct < THIN_RCT_COUNT) gaps.push(`only ${rct} RCT${rct === 1 ? '' : 's'}`)
    if (!human) gaps.push('no human data')
    return { topic: topic.id, label: topic.label, total: mine.length, human, trials, rct, strongest, gaps }
  }).sort((a, b) => a.trials - b.trials || a.total - b.total)
}

/** Dumbbell rows: every claim from the conversation, from least to best supported. */
export function dumbbellRows(claims, { source = 'conversation' } = {}) {
  return claims
    .filter((claim) => !source || claim.source === source)
    .map((claim) => ({ id: claim.id, label: claim.name, status: claim.status, index: claim.index, nFor: claim.nFor, nAgainst: claim.nAgainst, noSource: claim.nFor + claim.nAgainst === 0 }))
    .sort((a, b) => a.index - b.index || a.label.localeCompare(b.label))
}

/** Timeline items for the literature: one per article, grouped by design. */
export function timelineItems(articles, { topic = '', yearFrom = -Infinity, yearTo = Infinity } = {}, hrefOf = () => undefined) {
  return articles
    .filter((article) => (!topic || article.topic === topic) && article.year >= yearFrom && article.year <= yearTo)
    .map((article) => ({ id: article.id, title: article.name, year: article.year, group: article.design, detail: `${article.byline}, ${article.journal}`, href: hrefOf(article.id) }))
}

/** Timeline lanes: only the designs that occur, strongest first. */
export function timelineGroups(items) {
  const present = new Set(items.map((item) => item.group))
  return DESIGN_CLASSES.filter((design) => present.has(design.id)).map((design) => ({ id: design.id, label: design.short, look: design.look }))
}

export const yearExtent = (articles) => {
  const years = articles.map((article) => article.year).filter(Number.isFinite)
  return years.length ? [Math.min(...years), Math.max(...years)] : [0, 0]
}

// ------------------------------------------------------------------ "why this verdict" chips

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

/**
 * Three to five short, generated facts that explain a claim's verdict: [{ id, label, tone }]
 * (tone: success | info | warning | danger | muted). Derived from the data, not authored.
 */
export function whyChips(claim) {
  const chips = []
  const total = claim.nFor + claim.nAgainst
  if (!total) {
    chips.push({ id: 'design', label: 'No source recorded', tone: 'danger' })
  } else {
    const best = designInfo(claim.bestDesign)
    chips.push({ id: 'design', label: `Best design: ${best.label}`, tone: best.weight >= 0.6 ? 'success' : best.weight >= 0.3 ? 'info' : 'warning' })
  }

  const human = claim.humanFor + claim.humanAgainst
  if (!total) chips.push({ id: 'human', label: 'No human data', tone: 'warning' })
  else if (!human) chips.push({ id: 'human', label: claim.nonHuman ? 'No human data: animal, model or lab work only' : 'No human data: reviews and references only', tone: 'warning' })
  else if (!claim.nonHuman) chips.push({ id: 'human', label: `Human data: ${plural(human, 'study', 'studies')}`, tone: 'success' })
  else chips.push({ id: 'human', label: `${plural(human, 'human study', 'human studies')}, ${claim.nonHuman} animal, model or lab`, tone: 'info' })

  if (!claim.nAgainst) chips.push({ id: 'against', label: 'No contradicting study recorded', tone: total ? 'success' : 'muted' })
  else {
    const strongerAgainst = claim.evidenceAgainst > claim.evidenceFor
    chips.push({ id: 'against', label: `${plural(claim.nAgainst, 'contradicting study', 'contradicting studies')}${strongerAgainst ? ', outweighing the support' : ''}`, tone: strongerAgainst ? 'danger' : 'warning' })
  }

  if (claim.newestYear !== null) {
    const span = claim.oldestYear === claim.newestYear ? `${claim.newestYear}` : `${claim.oldestYear} to ${claim.newestYear}`
    chips.push({ id: 'recency', label: `Sources from ${span}`, tone: 'muted' })
  }
  chips.push({ id: 'origin', label: claim.source === 'conversation' ? 'Raised in the conversation' : 'Taken from the literature', tone: 'muted' })
  // keep the first five; the first three are always present
  return chips.slice(0, 5)
}

// ------------------------------------------------------------------ claims table: filter, sort, URL

export const CLAIM_SORTS = Object.freeze([
  { id: 'topic', label: 'Topic, then name' },
  { id: 'status', label: 'Status (supported first)' },
  { id: 'index', label: 'Support index (highest first)' },
  { id: 'for', label: 'Most supporting articles' },
  { id: 'against', label: 'Most contradicting articles' },
  { id: 'design', label: 'Best design' },
  { id: 'name', label: 'Name (A to Z)' }
])
const CLAIM_SORT_IDS = CLAIM_SORTS.map((sort) => sort.id)
const byName = (a, b) => a.name.localeCompare(b.name)

export function sortClaims(claims, sort = 'topic') {
  const list = [...claims]
  const topicOrder = (claim) => TOPIC_IDS.indexOf(claim.topic)
  switch (sort) {
    case 'status': return list.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || b.index - a.index || byName(a, b))
    case 'index': return list.sort((a, b) => b.index - a.index || byName(a, b))
    case 'for': return list.sort((a, b) => b.nFor - a.nFor || byName(a, b))
    case 'against': return list.sort((a, b) => b.nAgainst - a.nAgainst || byName(a, b))
    case 'design': return list.sort((a, b) => b.bestWeight - a.bestWeight || byName(a, b))
    case 'name': return list.sort(byName)
    default: return list.sort((a, b) => topicOrder(a) - topicOrder(b) || byName(a, b))
  }
}

export function normalizeQuery(text) {
  return String(text ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

/** Filters: q (all words in name, statement or aliases-free summary), status, topic, source, grade. */
export function filterClaims(claims, { q = '', status = '', topic = '', source = '', grade = '' } = {}) {
  const words = normalizeQuery(q).split(' ').filter(Boolean)
  return claims.filter((claim) => {
    if (status && claim.status !== status) return false
    if (topic && claim.topic !== topic) return false
    if (source && claim.source !== source) return false
    if (grade && claim.grade !== grade) return false
    if (!words.length) return true
    const haystack = normalizeQuery(`${claim.name} ${claim.statement} ${claim.summary}`)
    return words.every((word) => haystack.includes(word))
  })
}

/** Trusted values from an untrusted query object (only known ids survive). */
export function readClaimFilters(query = {}) {
  return {
    q: typeof query.q === 'string' ? query.q.slice(0, 200) : '',
    status: CLAIM_STATUS_KEYS.includes(query.status) ? query.status : '',
    topic: TOPIC_IDS.includes(query.topic) ? query.topic : '',
    source: ['conversation', 'literature'].includes(query.source) ? query.source : '',
    grade: EVIDENCE_KEYS.includes(query.grade) ? query.grade : '',
    sort: CLAIM_SORT_IDS.includes(query.sort) ? query.sort : 'topic'
  }
}

/** The query object for the filters, omitting defaults so URLs stay short. */
export function writeClaimFilters({ q, status, topic, source, grade, sort }) {
  return Object.fromEntries(Object.entries({ q, status, topic, source, grade, sort: sort === 'topic' ? '' : sort }).filter(([, value]) => value))
}

// ------------------------------------------------------------------ literature table: filter, sort, URL

export const ARTICLE_SORTS = Object.freeze([
  { id: 'newest', label: 'Year (newest first)' },
  { id: 'oldest', label: 'Year (oldest first)' },
  { id: 'design', label: 'Design (strongest first)' },
  { id: 'informs', label: 'Entries informed (most first)' },
  { id: 'grade', label: 'Evidence grade (strongest first)' }
])
const ARTICLE_SORT_IDS = ARTICLE_SORTS.map((sort) => sort.id)

export function sortArticles(articles, sort = 'newest') {
  const list = [...articles]
  const tie = (a, b) => b.year - a.year || a.name.localeCompare(b.name)
  switch (sort) {
    case 'oldest': return list.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name))
    case 'design': return list.sort((a, b) => designInfo(b.design).weight - designInfo(a.design).weight || tie(a, b))
    case 'informs': return list.sort((a, b) => b.nInforms - a.nInforms || tie(a, b))
    case 'grade': return list.sort((a, b) => EVIDENCE_GRADES[b.grade].rank - EVIDENCE_GRADES[a.grade].rank || tie(a, b))
    default: return list.sort(tie)
  }
}

/**
 * Filters: q (words in title, authors, journal), topic, design, grade, yearFrom, yearTo, entity (an
 * entity id the article informs, or words in the name of any entity it informs).
 */
export function filterArticles(articles, { q = '', topic = '', design = '', grade = '', yearFrom = -Infinity, yearTo = Infinity, entity = '' } = {}) {
  const words = normalizeQuery(q).split(' ').filter(Boolean)
  const entityWords = /^[a-z]+:/.test(entity) ? [] : normalizeQuery(entity).split(' ').filter(Boolean)
  const entityId = /^[a-z]+:/.test(entity) ? entity : ''
  return articles.filter((article) => {
    if (topic && article.topic !== topic) return false
    if (design && article.design !== design) return false
    if (grade && article.grade !== grade) return false
    if (article.year < yearFrom || article.year > yearTo) return false
    if (entityId && !article.informs.some((item) => item.id === entityId)) return false
    if (entityWords.length) {
      const names = normalizeQuery(article.informs.map((item) => item.name).join(' '))
      if (!entityWords.every((word) => names.includes(word))) return false
    }
    if (!words.length) return true
    const haystack = normalizeQuery(`${article.name} ${article.authors.join(' ')} ${article.journal}`)
    return words.every((word) => haystack.includes(word))
  })
}

export function readArticleFilters(query = {}, [minYear, maxYear] = [-Infinity, Infinity]) {
  const year = (value, fallback) => {
    const number = Number.parseInt(value, 10)
    return Number.isFinite(number) ? Math.min(maxYear, Math.max(minYear, number)) : fallback
  }
  return {
    q: typeof query.q === 'string' ? query.q.slice(0, 200) : '',
    topic: TOPIC_IDS.includes(query.topic) ? query.topic : '',
    design: DESIGN_IDS.includes(query.design) ? query.design : '',
    grade: EVIDENCE_KEYS.includes(query.grade) ? query.grade : '',
    entity: typeof query.entity === 'string' ? query.entity.slice(0, 120) : '',
    yearFrom: year(query.from, minYear),
    yearTo: year(query.to, maxYear),
    sort: ARTICLE_SORT_IDS.includes(query.sort) ? query.sort : 'newest'
  }
}

export function writeArticleFilters({ q, topic, design, grade, entity, yearFrom, yearTo, sort }, [minYear, maxYear]) {
  return Object.fromEntries(Object.entries({
    q, topic, design, grade, entity,
    from: yearFrom > minYear ? String(yearFrom) : '',
    to: yearTo < maxYear ? String(yearTo) : '',
    sort: sort === 'newest' ? '' : sort
  }).filter(([, value]) => value))
}

// ------------------------------------------------------------------ article page

/** Articles that inform at least one of the same entities, most overlap first (the article itself excluded). */
export function relatedArticles(model, articleId, limit = 24) {
  const article = model.articleById.get(articleId)
  if (!article) return []
  const mine = new Set(article.informs.filter((item) => item.type !== 'claim').map((item) => item.id))
  const claims = new Set(article.claimIds)
  return model.articles
    .filter((other) => other.id !== articleId)
    .map((other) => {
      const shared = other.informs.filter((item) => (item.type === 'claim' ? claims.has(item.id) : mine.has(item.id))).length
      return { article: other, shared }
    })
    .filter((entry) => entry.shared > 0)
    .sort((a, b) => b.shared - a.shared || b.article.year - a.article.year || a.article.name.localeCompare(b.article.name))
    .slice(0, limit)
}

/** Informed entities grouped by type, claims first, each group sorted by name. */
export function informsByType(article) {
  const order = ['claim', ...TYPES.map((type) => type.id).filter((id) => id !== 'claim' && id !== 'article')]
  const groups = new Map()
  for (const item of article.informs) {
    const list = groups.get(item.type) ?? []
    list.push(item)
    groups.set(item.type, list)
  }
  return order
    .filter((type) => groups.has(type))
    .map((type) => ({ type, label: TYPES.find((entry) => entry.id === type)?.plural ?? type, items: groups.get(type).sort((a, b) => a.name.localeCompare(b.name)) }))
}

// ------------------------------------------------------------------ a verdict bar's numbers

/**
 * Geometry of the compact verdict bar of one claim as fractions of the cell:
 * the bar's length shows how much evidence there is (relative to `maxTotal`), its split shows
 * for versus against.
 */
export function verdictBar(claim, maxTotal) {
  const total = claim.evidenceFor + claim.evidenceAgainst
  const length = maxTotal > 0 ? total / maxTotal : 0
  return {
    total: round(total, 2),
    length: total ? Math.max(0.06, length) : 0,
    forShare: total ? claim.evidenceFor / total : 0,
    againstShare: total ? claim.evidenceAgainst / total : 0
  }
}

/** Plain sentence for the verdict bar, used as its accessible name. */
export function verdictBarText(claim) {
  const total = claim.nFor + claim.nAgainst
  if (!total) return 'No supporting or contradicting article recorded.'
  return `Evidence for ${round(claim.evidenceFor, 1)} from ${plural(claim.nFor, 'article')}, against ${round(claim.evidenceAgainst, 1)} from ${plural(claim.nAgainst, 'article')}. Support index ${signed(claim.index)}.`
}

/** "+0.46", "-0.20", "0.00". */
export function signed(value) {
  const text = value.toFixed(2)
  return value > 0 ? `+${text}` : value < 0 ? text.replace('-', '−') : text
}
