# Knowledge Model

The educational ontology on methylation biochemistry is a graph of **entities** authored as plain JS data in `src/knowledge/data/*.js`. Every entity gets its own page and links to related entities. The engine in `src/knowledge/*.js` builds the graph, derives inverse links, validates the data and produces page view models. It is framework-free ES modules and runs in node and the browser.

```text
data/*.js (arrays) -> data/index.js -> buildGraph -> pageModel / hubModel / homeModel / search
data/paths.js (guided paths) ---------------------> pathModel / pathsContaining (guided-paths.js)
                                           ^
                         validate.js + scripts/kb-validate.js (npm run kb:validate)
```

## Entity contract

```js
{
  id: 'enzyme:gnmt',                  // '<type>:<kebab-slug>', slug is [a-z0-9] words joined by '-'
  type: 'enzyme',                     // compound enzyme reaction pathway state disease outcome system intervention claim article
  name: 'Glycine N-methyltransferase',
  aliases: ['GNMT'],                  // optional; include Portuguese names and abbreviations (searchable)
  summary: 'One sentence, at most 200 characters.',
  body: ['Paragraph with a [[compound:sam]] mention or [[compound:sam|custom text]].'],  // optional
  evidence: 'established',            // established | plausible | speculative | conversation-only
  facts: { gene: 'GNMT', ec: '2.1.1.20', uniprot: 'Q14749' },   // optional, string values only
  relations: [{ rel: 'decreases', to: 'compound:sam', note: 'optional context' }],
  refs: ['article:some-paper']        // optional, article ids supporting this entity
}
```

Unknown fields are rejected (typos like `alias` fail loudly). Type-specific fields:

| type | extra fields |
| --- | --- |
| reaction | `reaction: { reactants: [{id, n}], products: [{id, n}], ec?, rhea?, reactome?, reversible?, compartment?, enzymes?: id[] }` (participants must be `compound:` ids, enzymes `enzyme:` ids, `n > 0`) |
| article | `authors: string[]`, `year`, `journal`, `verified: boolean`, `takeaways: string[]` (your own words), optional `doi` (bare `10.x/y`, not a URL), `pmid` (digits), `url` |
| claim | `statement`, `source: 'conversation' \| 'literature'`, `status: 'supported' \| 'partly-supported' \| 'unsupported' \| 'contested'` |

The type-specific fields are required on their type and forbidden on all others.

### Ids

`<type>:<slug>` with the type prefix matching `type`. Prefer the commonly used short name for the slug (`enzyme:gnmt`, `compound:betaine`, `state:under-methylation`). Ids are permanent: other entities and the site routes depend on them. Define each id once, across all data files.

### Mentions in body text

`[[type:slug]]` links to the entity using its name; `[[type:slug|display text]]` uses your text. Mentions are navigation links: they make pages clickable, count for connectivity, and show up as "mentioned by" on the target. They are not relations. A mention of a missing id is a validation error (the page still renders it as plain text).

## Relations

Write only the **forward** relation. The engine derives the inverse and shows both on each page. Symmetric relations are stored once and appear on both sides. `from`/`to` are the allowed entity types for the forward direction.

| forward (label) | inverse (label) | from -> to | example |
| --- | --- | --- | --- |
| `substrate-of` (Substrate of) | `has-substrate` (Has substrate) | compound -> reaction/enzyme/pathway | usually derived from `reaction.reactants` |
| `product-of` (Product of) | `has-product` (Has product) | compound -> reaction/enzyme/pathway | derived from `reaction.products` |
| `catalyzes` (Catalyzes) | `catalyzed-by` (Catalyzed by) | enzyme -> reaction | derived from `reaction.enzymes` |
| `cofactor-of` (Cofactor of) | `requires-cofactor` (Requires cofactor) | compound -> enzyme/reaction | `compound:zinc cofactor-of enzyme:bhmt` |
| `part-of` (Part of) | `has-part` (Has part) | any -> any | `reaction:bhmt-remethylation part-of pathway:methionine-cycle` |
| `precursor-of` (Precursor of) | `derived-from` (Derived from) | compound -> compound | `compound:choline precursor-of compound:betaine` |
| `increases` (Increases) | `increased-by` (Increased by) | biological/intervention -> biological | `intervention:tmg-supplement increases compound:methionine` |
| `decreases` (Decreases) | `decreased-by` (Decreased by) | same as increases | `enzyme:gnmt decreases compound:sam` |
| `causes` (Causes) | `caused-by` (Caused by) | biological/intervention -> state/disease/outcome | `state:hypochlorhydria causes disease:sibo` |
| `mitigates` (Mitigates) | `mitigated-by` (Mitigated by) | biological/intervention -> state/disease/outcome | `intervention:tmg-supplement mitigates state:under-methylation` |
| `aggravates` (Aggravates) | `aggravated-by` (Aggravated by) | biological/intervention -> state/disease/outcome | `intervention:glycine-supplement aggravates outcome:belching` |
| `contraindicated-in` (Contraindicated in) | `contraindicates` (Contraindicates) | intervention/compound -> state/disease | `intervention:glycine-supplement contraindicated-in disease:sibo` |
| `manifests-as` (Manifests as) | `manifestation-of` (Manifestation of) | state/disease -> state/disease/outcome | `disease:sibo manifests-as outcome:belching` |
| `evidence-for` (Evidence for) | `has-evidence` (Supported by) | any -> biological/intervention/claim | `article:x evidence-for claim:y`; also derived from `refs` |
| `evidence-against` (Evidence against) | `has-counterevidence` (Contradicted by) | any -> biological/intervention/claim | `article:x evidence-against claim:y` |
| `measured-by` (Measured by) | `measures` (Measures) | biological -> compound/outcome/intervention/state | `state:under-methylation measured-by compound:homocysteine` |
| `associated-with` (symmetric) | itself | any <-> any | use when no mechanism is claimed |
| `interacts-with` (symmetric) | itself | actors <-> actors | synergy, competition, binding |

"biological" = compound, enzyme, reaction, pathway, state, disease, outcome, system. The authoritative table (including descriptions) is `src/knowledge/relations.js`.

Derived automatically (do not repeat them by hand): `reaction.reactants/products/enzymes` give `substrate-of`, `product-of`, `catalyzes`; each ref in `refs` gives `article --evidence-for--> entity`. If you also declare one, the declared edge (with its note) wins and nothing is duplicated.

Page groups use the labels above, so "Substrate of" and "Has substrate" are separate groups on a page. Article evidence (`has-evidence`/`has-counterevidence` from an article) is shown as the page's references instead of a group.

## Evidence grades

| grade | use when |
| --- | --- |
| `established` | textbook or well-replicated literature. **Requires at least one reference** (`refs`, or an article that declares `evidence-for`). |
| `plausible` | mechanistically sound, partial or indirect support |
| `speculative` | hypothesis with little or no direct support |
| `conversation-only` | came up in the source conversation and has not been checked |

Grade the claim the entity makes, not how well-known the word is. When unsure, grade lower.

## Validation

`npm run kb:validate` loads `src/knowledge/data/index.js` (and `data/paths.js`) and prints a report grouped by severity then rule. Exit code 1 if there are errors; warnings never fail. `npm run kb:validate -- --json` prints `{ ok, counts, errors, warnings }` (each issue is `{ rule, severity, id, path, message }`). `-- --data <file>` validates another module whose default export is an entity array; add `-- --paths <file>` to check a guided-path module with it. In code, `validateKnowledge(entities, { paths })` does the same. Unit tests use the same code (`validateKnowledge` in `src/knowledge/validate.js`) on fixtures in `tests/fixtures/knowledge/`.

Errors:

| rule | meaning |
| --- | --- |
| `schema` | contract violation; the message names the entity id and field path. Cross-field checks (id prefix vs type, required type-specific fields) appear once the per-field errors are fixed |
| `duplicate-id` | an id defined twice (the first definition wins) |
| `dangling-relation`, `dangling-ref`, `dangling-mention`, `dangling-reaction` | an id used in a relation, `refs`, body mention, or reaction participant/enzyme that does not exist |
| `malformed-mention` | `[[...]]` whose content is not a valid id |
| `relation-type-pair` | relation between types it does not allow (message lists the allowed pair) |
| `self-relation` | relation from an entity to itself |
| `orphan` | no relations, refs or mentions in or out |
| `unreachable` | a group of linked entities cut off from the main graph (connected components over relations and mentions; the largest is "main") |
| `uncited-article` | an article no entity references through refs, a mention or a relation |
| `claim-no-evidence` | claim with no `evidence-for`/`evidence-against` edge (a ref counts as evidence-for) |
| `established-no-ref` | `evidence: 'established'` without any article support (articles are exempt) |
| `type-coverage` | one of the types has no entities |

Guided-path errors (see [Guided paths](#guided-paths)):

| rule | meaning |
| --- | --- |
| `path-schema` | a path breaks the contract: unknown field, bad slug id, missing title/summary/`why`, fewer than 3 or more than 30 steps, summary over 300 or `why` over 400 characters, step id that is not an entity id |
| `path-duplicate-id` | two paths with the same id |
| `path-dangling-step` | a step names an entity that does not exist |
| `path-duplicate-step` | a path visits one entity twice |

Warnings: `unverified-article` (`verified: false`) and `claim-flagged-no-evidence` (a claim with no evidence that is explicitly flagged by `status: 'unsupported'` or `evidence: 'conversation-only'`).

The graph builder itself never throws on bad data; it records problems (`graph.dangling`, `graph.duplicates`, `graph.malformedMentions`, `graph.unknownRelations`) and skips them, so the site keeps rendering while validation tells you what to fix.

`tests/unit/knowledge-data.test.js` runs the same validation over the real dataset and fails on any error, so a data change that breaks a reference, drops a type below its floor or leaves an established entity without a source cannot merge.

## Data files and conventions

| file | holds |
| --- | --- |
| `compounds.js` | nutrients, drugs-as-molecules, hormones, amino acids, bile acids, neurotransmitters |
| `metabolites.js` | water, protons, nucleotides, NAD(P)(H), CoA, ETF, thioredoxin, pathway intermediates: the small molecules that appear only as reaction participants |
| `enzymes.js`, `reactions.js`, `pathways.js`, `states.js`, `diseases.js`, `outcomes.js`, `systems.js`, `interventions.js` | one type each |
| `claims.js` | atomic statements from the source conversation, graded against the literature |
| `articles.js` | verified papers, guidelines and database papers; bibliographic fields come from PubMed or Crossref |
| `paths.js` | curated guided paths (reading lists through the graph); not entities, see [Guided paths](#guided-paths) |

Conventions settled when the files were merged:

- One canonical id per concept: `compound:5-mthf` (not `5-methyl-thf`), `intervention:ppi-therapy`, `intervention:p5p-supplement`, `enzyme:glycine-cleavage-system`. Retired aliases are asserted absent in the data test.
- Gene-family enzymes have a family entity plus isoform entities (`enzyme:shmt` with `shmt1`/`shmt2`, `enzyme:gad` with `gad1`/`gad2`, `enzyme:mat` with `mat1a`/`mat2a`, `enzyme:glycine-cleavage-system` with its four proteins). Reactions list the isoforms in `reaction.enzymes`; cofactor and substrate relations may point at the family.
- A compound made from another compound is written `precursor-of` on the parent. `product-of`/`substrate-of` link a compound to a reaction, enzyme or pathway only, and a microbial source is written `increases` from the system.
- Generic placeholders used by databases (`compound:hydrogen-acceptor`, the ETF and thioredoxin redox pairs) are real entities graded `plausible` or tied to a review, and the body says they are bookkeeping.
- Evidence edges carry the caveat: a weak, animal-only or second-hand source is attached with a note saying so, and counter-evidence is an `evidence-against` edge written on the article.
- One article never both supports and contradicts the same target (the page would list it twice). Split the two stances across targets, for example "supports the product" and "contradicts the mechanism claim", or fold the caveat into the note of one edge. A data test enforces this.
- Topic hubs open with a plain-language lead. The first body paragraph of the main topics (`state:undermethylation`, `state:overmethylation`, `compound:glycine`, `compound:choline`, `compound:betaine`, `enzyme:gnmt`, `enzyme:pemt`, `enzyme:bhmt`, `disease:peptic-ulcer`, `disease:sibo`, `disease:lpr`, `outcome:belching`, `pathway:choline-oxidation`, `pathway:methyl-budget`) starts with "In plain words:" and says what it is, why it matters and how it connects, in under 1,200 characters and without links. The technical detail follows in the next paragraphs.
- Portuguese comes in as aliases, never as separate entities: the Portuguese name, the common unaccented or colloquial phrasing, and for claims a short Portuguese statement. Search ignores case and accents, so `eructacao` and `eructação` find the same page. Where an abbreviation is shared (`PPI` the drug class, `PPi` pyrophosphate) the abbreviation belongs to the entity people search for and the other one is found by its full name.
- Retail listings named in the source conversation (BulkSupplements, Extreme Suplementos, Elysx, Cognizin, BodyBio) are recorded in the body of the matching intervention as a neutral note, not as endorsements, and are also aliases so that searching the brand finds the page.
- Reactions are written in the ionisation states of Rhea/ChEBI at pH 7.3 (`compound:proton` appears where Rhea has H+). Compound `formula` facts are the neutral or PubChem form, with the charge written when the species is an ion (`C5H14NO+`, `C15H23N6O5S+`). Tests therefore require every heavy atom to balance in every reaction whose participants have plain formulas, and require atoms, hydrogens and charge to balance for a hand-checked list.

## Guided paths

`src/knowledge/data/paths.js` holds short, ordered reading lists through the graph. A path is a curated story over existing entities, not new data:

```js
export default [
  {
    id: 'glycine-belching-question',       // kebab-case slug, permanent
    title: 'The glycine-belching question',
    summary: 'One or two sentences, at most 300 characters.',
    steps: [                                // 3 to 30 steps
      { id: 'outcome:belching', why: 'One or two sentences on why this step comes next (at most 400 characters).' }
      // ...
    ]
  }
]
```

Current paths: the glycine-belching question; methyl budget (who spends the methyl groups); choline to glycine; gut, acid and ulcers; the throat burn; the 2-3 am question (histamine, choline and the vagal brake); B6, GABA and the anxious mind; forms that are easy to confuse (betaine HCl and TMG, folic acid and methylfolate, P5P and pyridoxine, choline salts and phospholipids); reading the evidence (one example of each grade and claim status). `npm run kb:validate` fails when a step does not resolve, an id repeats or a path visits an entity twice (rules above). Engine API from `src/knowledge/index.js`:

```js
import { paths, pathList, getPath, pathsFor } from './knowledge/index.js'

paths                         // the raw array above
pathList()                    // [{ id, title, summary, length }]
getPath('choline-to-glycine') // { id, title, summary, length, types, steps: [{ position, id, why, entity: { id, type, typeLabel, name, summary, evidence } }] } or null
pathsFor('enzyme:gnmt')       // paths that visit the entity: [{ id, title, summary, length, position, why }]
```

There is no UI for paths yet; the models are shaped for one (an entity page can say "appears in 2 guided paths" from `pathsFor`).

## Coverage of the source conversation

`tmp/coverage.md` is the line-by-line checklist of `tmp/base-talk.txt`: 315 items (substances, enzymes, reactions, pathways, states and diseases, symptoms and outcomes, interventions and products, systems, mechanisms and numeric claims, studies), each with the phrase used in the conversation, a short search term and the entity that holds it. 280 items mapped to entities that already existed, 35 needed new entities (32 distinct ids, listed in the file), and about 20 existing entities received extra aliases so that the conversation's own phrasing resolves. All 315 search terms find their entity in the top three results. The test table `CONVERSATION_TERMS` in `tests/unit/knowledge-data.test.js` keeps 173 of them under test.

## Current coverage

Output of `npm run kb:validate` (0 errors, 6 warnings):

| type | entities | | type | entities |
| --- | ---: | --- | --- | ---: |
| compound | 144 | | intervention | 48 |
| enzyme | 65 | | claim | 65 |
| reaction | 61 | | system | 20 |
| pathway | 27 | | outcome | 37 |
| state | 14 | | disease | 25 |
| article | 253 | | **total** | **759** |

3,336 relations (2,324 declared, 1,012 derived from `refs` and reaction blocks), 3,602 body mentions, about 2,000 aliases and 9 guided paths (104 steps). Evidence grades: 533 established, 188 plausible, 36 speculative, 2 conversation-only. Every non-article entity is linked to at least five others (at least three non-article), every article to at least two. The six warnings are conversation claims flagged `unsupported` for which no literature was found for or against (`claim:glycine-powder-low-dose-belching-reports` and `claim:glycine-with-meals-reduces-gastric-irritation` are new; `claim:higher-ph-delays-les-closure-and-pylorus`, `claim:undermethylated-have-functional-b6-deficiency`, `claim:undermethylated-hypochlorhydria` and `claim:undermethylation-causes-subclinical-vagal-dysfunction` were already there).

## Content QA log

An audit of the dataset against primary sources, with the checks that are now repeatable.

Checked programmatically against the source databases (scripts were run once; the format and consistency parts live on as tests):

- all 231 PMIDs resolve in PubMed and agree with the stored year, first author, journal and title; the 4 DOI-only articles resolve in Crossref; none of the cited records is retracted or carries an expression of concern; the 4 Reactome database pages have no PMID or DOI and were opened by URL, and 2 IOM book chapters have a PMID whose PubMed record carries no title (so the title could not be compared).
- 128 Rhea references: 126 resolve and every equation was compared with the stored participants and coefficients; the other 2 distinct ids (RHEA:19819 for MTHFR and RHEA:11173 for MTR) are directional ids that the search endpoint does not return, and are documented next to their master ids RHEA:19817 and RHEA:11172. 109 Reactome references resolve to the right reaction or pathway; 61 UniProt entries match the stated gene, organism and EC; 120 ChEBI ids and 111 PubChem CIDs resolve and agree with the stored formula and molar mass.
- molar masses recomputed from the formulas (108 compounds), heavy-atom balance of the 53 reactions with plain formulas, and hydrogen and charge balance of 25 of them.
- identifier formats, reaction-versus-enzyme EC consistency and duplicate PMID/DOI checks now run in `tests/unit/knowledge-data.test.js`.

Read and fact-checked by hand (about 70 entities across all eleven types: the 14 hub topics, 12 interventions, 11 compounds, 7 enzymes, 8 pathways and states, 6 diseases, 5 outcomes and systems, 12 claims and 15 articles against their PubMed abstracts, plus the status and evidence edges of all 54 original claims), including the conversation's numbers: IOM and EFSA choline values (EFSA set an adequate intake of 400 mg/day and no upper level), 3 g/day endogenous glycine and about 10 g/day deficit (Meléndez-Hevia 2009 abstract), 41 % choline in the bitartrate and the 13.88 g stoichiometry, vitamin and mineral upper limits, SIBO breath-test thresholds, trimethylaminuria prevalence, the glycine-gastrin human studies.

Errors found and fixed:

| category | what | fix |
| --- | --- | --- |
| identifier | `reaction:mthfd1-methylene-thf-oxidation` and `enzyme:mthfd1` cited Reactome R-HSA-200661, which is the cyclohydrolase step | the dehydrogenase step R-HSA-200718 now on the reaction; both ids on the enzyme |
| chemistry | SAM was stored as `C15H22N6O5S (cation)`, which is the neutral zwitterion; the cation is `C15H23N6O5S+` (399.45 g/mol). The error made `reaction:gnmt-glycine-methylation` fail hydrogen and charge balance | formula and masses corrected; the reaction now balances |
| number | the gastrin claim and `outcome:elevated-gastrin` said glycine did not raise gastrin "even at 200 mM"; the Taylor 1982 abstract does not give that figure and Wald 1982 used 100 mM glycine | wording reduced to what the abstracts state |
| study metadata | Da Costa 2006 was labelled RCT and graded established, but it is a single-arm controlled depletion study with genetic association (n=57) | design corrected, grade plausible |
| structure | two articles (Zeisel 2017 on TMAO, Hu 2011 on ginger) both supported and contradicted the same target, so entity pages listed them twice (a duplicate-key warning in the UI) | contradiction moved to the claim it concerns, or folded into one note; test added |
| completeness | 19 compounds had no ChEBI id and S-methylmethionine had no formula | ids, formula and mass added (verified against ChEBI and PubChem) |
| wording | `compound:glycerophosphocholine` stated acid-independent absorption as fact; the sources used here do not cover alpha-GPC | wording softened and linked to `claim:alpha-gpc-pc-absorbed-without-acid` |
| search | the alias `PPi` on pyrophosphate outranked the drug class `PPI`; `IBP` and `omeprazol` on the proton pump enzyme outranked the intervention; `H. pylori` and `vago` found articles first | aliases moved or added; tests lock the ranking |
| coverage | 32 concepts of the conversation had no page (nucleotide synthesis, migrating motor complex, H1/H2, M2 and 5-HT4 receptor signalling, TLESR, flatulence, colon, ileum, parietal and G cells, gastritis and duodenitis, oesophagitis, duodenogastric reflux, carnosine synthase, thymidylate synthase, thymol, elastin, tannins and flavonoids, 11 claims) | created at full quality with 14 verified articles |
| semantics | converse edges missing: contraindicated without aggravates (betaine HCl, choline in trimethylaminuria, glycine in NKH), and 13 diseases or states without any helps, causes or aggravates group | 31 typed edges added, with notes stating the evidence level, plus about 70 further links so that every entity has at least five neighbours |

No errors were found in the remaining spot-checks of formulas, EC numbers, UniProt, Rhea, Reactome, PubChem, DOIs and PMIDs. The "reaction balance" difference between formula conventions (neutral PubChem forms against Rhea ionisation states) is a documented convention, not an error.

## Using the engine

```js
import { page, hub, home, find, pathBetween } from './knowledge/index.js'   // singleton graph over all data

page('enzyme:gnmt')   // entity page model, or null
hub('compound')       // listing for a type, or null
home()                // landing page model
find('arroto')        // search: name, aliases, id, summary; accent/case-insensitive
pathBetween('state:hypochlorhydria', 'compound:sam', { avoidTypes: ['article'] })
```

Guided paths use the same entry point: `import { paths, pathList, getPath, pathsFor } from './knowledge/index.js'` (see [Guided paths](#guided-paths)).

`page(id)` returns `{ id, type, typeLabel, typeIcon, name, aliases, summary, evidence: {grade,label,tone,rank,description}, facts: [{key,label,value,url}], body: Segment[][], relationGroups: [{rel,label,direction,items}], references, mentionedBy, seeAlso, breadcrumbs, reaction, article, claim, entity }` where a body `Segment` is `{ text }` or `{ link: { id, label, type } }`. Breadcrumb entries are `{ kind: 'home' | 'hub' | 'entity', ... }`; the router decides URLs. `src/knowledge/index.js` deliberately does not import zod; validation is a build/test-time concern.

## Adding an entity type

1. Add a row to `src/knowledge/types.js` (id, label, plural, description, icon name). ID patterns, hubs, home cards, search labels and type coverage pick it up automatically.
2. If it has dedicated fields, add them to `TYPE_SPECIFIC_FIELDS` and the zod object in `src/knowledge/schema.js`.
3. Extend the allowed `from`/`to` lists in `src/knowledge/relations.js` where the new type may participate.
4. Create the data file and add it to `src/knowledge/data/index.js`.
5. Add a fixture entity in `tests/fixtures/knowledge/valid.js` and update the expected counts in the tests.

To add a relation, add one `def(...)` row in `relations.js` (forward id, inverse id, both labels, allowed types); labels must stay unique across all directions (a test enforces it).
