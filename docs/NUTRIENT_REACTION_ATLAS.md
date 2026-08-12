# Nutrient Reaction Atlas Consumer Program

## Boundary

The producer foundation is pinned to
`nutrient-reaction-atlas-foundation-v0.1.0` at digest
`ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4`.
It contains source-governance and ontology contracts, not biochemical reactions.
The consumer therefore fixes all of these values:

- 52 source dispositions;
- 85 ontology terms, including 60 nutrient concepts, 17 form classes, and 8
  event kinds;
- zero reaction records;
- zero simulation-ready reaction records;
- reaction ingestion `not-started`;
- simulation execution and candidate writes disabled;
- automatic promotion always false.

The current consumer increment is contract-only. It does not add an API route,
database, UI, producer fetch, simulation engine, or trusted claim.

The I1 bootstrap additionally pins
`nutrient-reaction-simulation-bootstrap-v0.1.0` at digest
`2f3afbed57ad6de9d4afff20c766eb08ed766e7e6593724f40240da147e86b69`
and candidate `REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION` at digest
`ffce2dcbf1186295449d52892351af24060080310d85a80c547fbad93ad27974`.
It permits one symbolic stoichiometric simulation contract while keeping broad
reaction coverage `not-started`, trusted eligibility false, biological support
false, and automatic promotion false.

The I2 consumer contract pins the Rhea 141 direct-participant candidate artifact
at compressed digest
`56acf0eff87334961d3b76a2881486fa9de572dce7ba87b9f94e60dc80c48f2a`
and uncompressed digest
`6206e847bdc1aa5d50e928513eb2c317220eec29944e232b6716bf88f0e5b03c`.
It fixes a denominator of 18,558 master reactions, with 7,288 selected and
11,270 excluded, 30 matched nutrient/form terms, and zero unresolved participant
or compound references. The 7,646 non-ChEBI references are valid Rhea generic
compounds, not repaired identities. Water accounts for 6,717 selected reactions,
so no broad human or nutrient-specific coverage follows from the aggregate.

The consumer rejects any drift in source/query/artifact digests, counts, direct-
participant closure, human-applicability status, simulation eligibility, trusted
eligibility, biological-conclusion support, or automatic promotion. It does not
yet ingest the candidate payload into a simulation runtime.

The second I2 contract pins Reactome release 97 at compressed artifact digest
`037752fc68e92e5d0ae66cc7cf6d1e9fd97a448a72b307d96169dd6db3f549dc`
and uncompressed digest
`d039d1b1cc1c0b045a521a1a213e183cf19bda63906c25070b0c01b81631b2df`.
Its denominator unions 16,107 unique human-SBML reactions with Homo sapiens
reaction IDs in the versioned ChEBI mapping, yielding 16,186 source reactions.
It pins 3,595 selected records, 12,591 exclusions, 3,575 SBML-detail records, 20
mapping-only records, 27 matched terms, zero semantic duplicate conflicts, and
zero unresolved species references.

The Reactome contract preserves reactants, products, modifiers, exact source
stoichiometry, reversibility, GO compartments, pathways, ChEBI/UniProt/Reactome
identities, PubMed citations, EC and GO annotations, and Rhea links where the
SBML supplies them. It rejects any attempt to infer endogenous human biology
from the `R-HSA` namespace alone or to claim balance, simulation readiness,
trusted eligibility, or disease/drug/pathogen separation before review. Water
contributes 1,457 candidates and the broad protein class contributes 848, so
aggregate selection remains discovery output rather than biological coverage.

The cross-source I2 contract pins the direction-aware Rhea/Reactome report at
compressed digest
`a5dd05d05f5abb47171de33066ef1f464f868a7b9f15471743a4917135bdb98d`
and uncompressed digest
`a253b7a8a26c75b00900d4f07deb3b8e8eaec25555d9654f1faa46df59f4667c`.
Among 735 explicit links, 245 are exact directional side matches, 7 are exact
undirected matches, 2 have direction conflicts, 46 have participant mismatches,
262 are non-comparable because of non-ChEBI participants, and 173 point to Rhea
masters outside the current nutrient candidate set. Authoritative Rhea direction
and obsolete tables resolve every linked ID; none is absent, obsolete, or
unknown in release 141.

The consumer requires all conflicts and non-comparable records to remain visible
and rejects any claim that they were adjudicated. Exact source agreement still
does not establish a reviewed nutrient identity, endogenous human applicability,
simulation readiness, trusted knowledge, or a biological conclusion.

## Simulation Candidates

Later iterations may simulate measured, curated, submitted, model-derived,
text-mined, computed, assumed, or hypothetical events. Weak evidence is not
discarded merely because it is weak, but every candidate must carry:

- exact chemical identity or explicit unresolved participant constraints;
- nutrient concepts and event kind;
- exact rational coefficients;
- known or explicit unknown direction and compartment status;
- source identifiers or content-addressed generation lineage;
- assumptions for model-derived, mined, computed, assumed, or hypothetical
  candidates;
- uncertainty representation and description;
- an explicit simulation-eligibility rationale;
- `trusted_knowledge_eligible: false`;
- `can_support_biological_conclusion: false`;
- `automatic_promotion: false`.

A candidate can be simulation-ready only when direction and compartment status
are known. Class-level or unresolved participants remain explicit symbolic pools
and may never masquerade as exact chemistry.

## Hypotheses

Every hypothesis binds candidate IDs, input digests, generation method,
assumptions, uncertainty, a falsifiable statement, and a proposed test. Testing
may produce supported-within-boundary, failed, or not-evaluable status. None of
those statuses changes the source origin or promotes the hypothesis to trusted
knowledge.

## Iteration Ownership

| Iteration | Producer | Consumer |
| --- | --- | --- |
| I0 | Source registry, ontology, policies, coverage, digest-bound foundation | Independent pins and fail-closed candidate/hypothesis contracts |
| I1 | Exact nutrient/form registry and rights-qualified composition sources | Verify identity mappings and expose unresolved forms without repair |
| I2 | Pinned Rhea and Reactome reaction closure | Recompute balance, direction, compartment, and nutrient closure |
| I3 | Human catalysts, transporters, contexts, pathways, and model overlays | Separate direct evidence from orthology and model-only simulation candidates |
| I4 | Kinetics, thermodynamics, transport, restricted overlays, hypotheses | Run bounded simulations with complete assumptions and uncertainty |
| I5 | Human measurements, evidence, fixed partitions, lifecycle | Freeze models and hypotheses, evaluate without leakage, retain failures and gaps |

Each iteration remains disabled until the producer publishes a new immutable
identity and the consumer independently verifies every count, digest, source,
rights, context, and epistemic boundary it uses.

## Verification

```sh
nice -n 10 npx vitest run tests/unit/nutrient-reaction-atlas-contracts.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npm run check:syntax
```
