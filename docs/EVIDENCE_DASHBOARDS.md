# Evidence dashboards

Charts and tables that replace the text-heavy "meta-analysis" pages. Everything is computed from the
knowledge graph (465 articles, 65 claims); running text lives in a collapsed "Notes" drawer only.
Components are Vapor + Pug, styled by `src/styles/evidence.css` (semantic tokens only) on top of the
`src/viz` primitives ([VIZ_COMPONENTS.md](VIZ_COMPONENTS.md)).

| Route | View | Shows |
|---|---|---|
| `/evidence` | `views/evidence/EvidenceOverviewView.vue` | status tiles and claims audit, claimed-against-recorded dumbbell, kind x grade heatmap, literature timeline, topic x design coverage |
| `/evidence/claims` | `EvidenceClaimsView.vue` | the audit alone; filters in the URL (`?q=&status=&topic=&source=&grade=&sort=`) |
| `/evidence/literature` | `EvidenceLiteratureView.vue` | every article as a dot-plot row; filters in the URL (`?q=&entity=&topic=&design=&grade=&from=&to=&sort=&page=`) |
| `/evidence/claim/:slug`, `/evidence/article/:slug` | `EvidenceTemplateView.vue` | the two templates on their own (the knowledge-base pages render the same templates through the entity view) |

Templates: `views/kb/templates/ClaimTemplate.vue` and `ArticleTemplate.vue`. Props: `model` (the engine's
`page(id)`, what the entity dispatcher passes) or just `id`. They render their own `h1`, set the page title and put
`data-testid="entity-visuals"` with `data-visuals` on the root.

## Pure logic: `src/kb/evidence.js` (and `evidence-graph.js`)

No Vue, no DOM, unit-tested (`tests/unit/evidence-*.test.js`). `buildEvidenceModel(graph)` returns
`{ articles, claims, articleById, claimById, totals }`, cached per graph. The components get it through
`components/evidence/useEvidence.js`, which loads the engine lazily (`kb/knowledge-lazy.js`): each view
draws its heading first and the dashboards when the data has arrived.

### Study designs

`facts.design` has 50 free-text variants. `normalizeDesign(raw)` maps them with an ordered rule list (first match
wins) to 11 canonical classes: the ten requested (RCT, meta-analysis, systematic review, guideline,
cohort/observational, mechanistic/animal, in-vitro, review, database/reference, case report) plus **human
experimental** (non-randomised experiments on people: physiology, tracer, pharmacokinetic, imaging, feeding and
depletion studies; 79 articles). Mathematical and kinetic models are folded into mechanistic/animal. Unknown
text gives `unclassified`; a test fails if any article in the data does.

### Scoring ("How is this scored?")

A descriptive summary, **not a meta-analysis**: no effect sizes, sample sizes or risk-of-bias ratings.

1. An article that supports or contradicts a claim weighs its design weight (meta-analysis 1, systematic review 0.9,
   RCT 0.85, guideline 0.65, human experimental 0.6, cohort/observational 0.5, review 0.35, mechanistic/animal 0.3,
   database/reference 0.3, case report 0.2, in-vitro 0.15). An unverified citation counts half.
2. evidence for = sum of the weights of the supporting articles; evidence against = the same for contradicting ones.
3. **support index = (for - against) / (for + against + 1)**, in (-1, 1). The 1 is a prior of one study of unknown
   direction: no source gives 0, and one weak study cannot move a claim far.

The table and the formula are in the "How is this scored?" disclosure under every audit and on the claim page
(`components/evidence/ScoringHelp.vue`, text from `SCORING`). The curated claim status is separate and also weighs
mechanism and indirect evidence; the dashboards show both.

### Topics

Six topics (gastric, methylation, choline/TMA, histamine/sleep, B6/GABA, supplements) by keyword: a claim by the
words of its own id (counted three times) and of the entries it is associated with; an article by its own id words,
the entries it informs and the topics of the claims it informs. A reading aid, stated as such in the UI.

## What each view shows

- **Status tiles** (11 supported / 33 partly supported / 14 unsupported / 7 contested): toggle buttons that filter the
  matrix.
- **Claims audit matrix** (`ClaimsMatrix`, `ClaimsExplorer`): rows grouped by topic; status badge, grade letter, articles
  for (blue circle) and against (vermillion square), best design (marker + name) and a **verdict bar**
  (`VerdictBar`: length = weighted amount of evidence relative to the largest claim, split = solid for versus hatched
  against, support index printed). Sortable by column header; filter by text, topic, source, grade.
- **Dumbbell** (`ClaimDumbbell`): every conversation claim; open ring at +1 is the claim as asserted, the filled marker
  (shape and colour = curated status, hollow = no source) is the support index; the line is the shortfall.
- **Kind x grade heatmap**, **coverage heatmap** (`CoverageMap`): zeros are printed; below it the plain gaps per topic
  ("no meta-analysis", "only 1 RCT", "no human data"). A cell opens the filtered list.
- **Literature timeline** (`LiteratureTimeline`): `viz/Timeline`, a lane per design, topic menu and a year range.
- **Literature table** (`ArticleTable`, `ArticlesExplorer`): design marker, year as a dot on a thin axis, grade, entries
  informed, one citation line; 60 rows a page.
- **Claim page**: verdict card with the support index gauge, evidence balance bar, generated "why this verdict" chips
  (design mix, human versus animal, contradictions, recency, origin), articles for and against on a two-lane timeline,
  the causal edges the claim asserts as a mini `LayeredGraph` (hypothesis edges dashed) with links, quantities of the
  entries it is about (`quantFor`), entries it is about, Notes drawer.
- **Article page**: citation card (authors, journal, year, DOI, PMID, verified badge, design, grade, population),
  what it informs grouped by kind with stance markers, up to five key points, related articles on a timeline, Notes.

Colour is never the only signal: design, stance and status are marker shapes with a printed word; grades are letters.

## Tests

- `tests/unit/evidence-design.test.js` (design normalisation, weights, index), `evidence-aggregates.test.js`
  (counts, coverage, filters, sorting, chips, bars), `evidence-graph.test.js`.
- `tests/component/evidence-components.test.js`, `evidence-pages.test.js`, `evidence-templates.test.js` (renders all 65
  claim and all 465 article templates, jsdom axe on samples).
- `tests/e2e/evidence-dashboards.spec.js` (static build, also in `playwright.static.config.js`): axe in light and dark on
  desktop and a phone, no sideways page scroll, 44 px controls, and the keyboard-only task "find the verdict for the
  claim that free glycine stimulates gastrin" (11 Tab presses to the search box, then the row shows "Unsupported" and
  the verdict bar sentence). The routes are also in `ROUTES` of `shell.spec.js`.

## Known limits

- Support counts only articles linked directly to the claim; indirect support (mechanism, other claims) is invisible
  to the index.
- The claim and article pages are reachable at `/evidence/claim/...` and `/evidence/article/...`; the entity view
  (`/kb/claim/...`) uses them once its dispatcher imports the templates.
- Topics are keyword-derived; a few claims sit in a neighbouring topic.
