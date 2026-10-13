# Knowledge Model

The educational ontology on methylation biochemistry is a graph of **entities** authored as plain JS data in `src/knowledge/data/*.js`. Every entity gets its own page and links to related entities. The engine in `src/knowledge/*.js` builds the graph, derives inverse links, validates the data and produces page view models. It is framework-free ES modules and runs in node and the browser.

```text
data/*.js (arrays) -> data/index.js -> buildGraph -> pageModel / hubModel / homeModel / search
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

`npm run kb:validate` loads `src/knowledge/data/index.js` and prints a report grouped by severity then rule. Exit code 1 if there are errors; warnings never fail. `npm run kb:validate -- --json` prints `{ ok, counts, errors, warnings }` (each issue is `{ rule, severity, id, path, message }`). `-- --data <file>` validates another module whose default export is an entity array. Unit tests use the same code (`validateKnowledge` in `src/knowledge/validate.js`) on fixtures in `tests/fixtures/knowledge/`.

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

Conventions settled when the files were merged:

- One canonical id per concept: `compound:5-mthf` (not `5-methyl-thf`), `intervention:ppi-therapy`, `intervention:p5p-supplement`, `enzyme:glycine-cleavage-system`. Retired aliases are asserted absent in the data test.
- Gene-family enzymes have a family entity plus isoform entities (`enzyme:shmt` with `shmt1`/`shmt2`, `enzyme:gad` with `gad1`/`gad2`, `enzyme:mat` with `mat1a`/`mat2a`, `enzyme:glycine-cleavage-system` with its four proteins). Reactions list the isoforms in `reaction.enzymes`; cofactor and substrate relations may point at the family.
- A compound made from another compound is written `precursor-of` on the parent. `product-of`/`substrate-of` link a compound to a reaction, enzyme or pathway only, and a microbial source is written `increases` from the system.
- Generic placeholders used by databases (`compound:hydrogen-acceptor`, the ETF and thioredoxin redox pairs) are real entities graded `plausible` or tied to a review, and the body says they are bookkeeping.
- Evidence edges carry the caveat: a weak, animal-only or second-hand source is attached with a note saying so, and counter-evidence is an `evidence-against` edge written on the article.

## Current coverage

Output of `npm run kb:validate` (0 errors, 4 warnings):

| type | entities | | type | entities |
| --- | ---: | --- | --- | ---: |
| compound | 137 | | intervention | 48 |
| enzyme | 63 | | claim | 54 |
| reaction | 59 | | system | 16 |
| pathway | 22 | | outcome | 35 |
| state | 13 | | disease | 23 |
| article | 239 | | **total** | **709** |

2,997 relations (2,039 declared, 958 derived from `refs` and reaction blocks) and 3,333 body mentions. Evidence grades: 499 established, 176 plausible, 33 speculative, 1 conversation-only. The four warnings are conversation claims flagged `unsupported` for which no literature was found for or against (`claim:higher-ph-delays-les-closure-and-pylorus`, `claim:undermethylated-have-functional-b6-deficiency`, `claim:undermethylated-hypochlorhydria`, `claim:undermethylation-causes-subclinical-vagal-dysfunction`).

## Using the engine

```js
import { page, hub, home, find, pathBetween } from './knowledge/index.js'   // singleton graph over all data

page('enzyme:gnmt')   // entity page model, or null
hub('compound')       // listing for a type, or null
home()                // landing page model
find('arroto')        // search: name, aliases, id, summary; accent/case-insensitive
pathBetween('state:hypochlorhydria', 'compound:sam', { avoidTypes: ['article'] })
```

`page(id)` returns `{ id, type, typeLabel, typeIcon, name, aliases, summary, evidence: {grade,label,tone,rank,description}, facts: [{key,label,value,url}], body: Segment[][], relationGroups: [{rel,label,direction,items}], references, mentionedBy, seeAlso, breadcrumbs, reaction, article, claim, entity }` where a body `Segment` is `{ text }` or `{ link: { id, label, type } }`. Breadcrumb entries are `{ kind: 'home' | 'hub' | 'entity', ... }`; the router decides URLs. `src/knowledge/index.js` deliberately does not import zod; validation is a build/test-time concern.

## Adding an entity type

1. Add a row to `src/knowledge/types.js` (id, label, plural, description, icon name). ID patterns, hubs, home cards, search labels and type coverage pick it up automatically.
2. If it has dedicated fields, add them to `TYPE_SPECIFIC_FIELDS` and the zod object in `src/knowledge/schema.js`.
3. Extend the allowed `from`/`to` lists in `src/knowledge/relations.js` where the new type may participate.
4. Create the data file and add it to `src/knowledge/data/index.js`.
5. Add a fixture entity in `tests/fixtures/knowledge/valid.js` and update the expected counts in the tests.

To add a relation, add one `def(...)` row in `relations.js` (forward id, inverse id, both labels, allowed types); labels must stay unique across all directions (a test enforces it).
