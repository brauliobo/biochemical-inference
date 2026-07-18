# Next Goals 16-20

## Purpose And Status

This consumer roadmap follows an evidence review of Goals 1-15. It defines five
additive scientific goals for `biochemical-inference`; it does not broaden the
meaning of any delivered fixture, model result, conformance result, or
unsupported claim. The matched producer roadmap is
`biochemical-db/docs/NEXT_GOALS_16_20.md`.

| Goal | Status |
| --- | --- |
| 16. Measured Biochemical Kinetics And Physiology Expansion | **Pending** |
| 17. Comparative Models And Propagated Uncertainty | **Pending** |
| 18. Interoperable Reproducible Model Packages | **Pending** |
| 19. Evidence Revision And Scientific Invalidation | **Pending** |
| 20. Bounded Multiscale Measured Validation | **Pending** |

`Pending` means that producer evidence, rights closure, consumer implementation,
and all acceptance evidence remain to be completed. A schema, synthetic fixture,
valid archive, successful run, or favorable metric cannot change a status by
itself. These goals have no promised dates or delivery timelines.

## Goals 1-15 Evidence Review

The implementation boundary is narrower than several original goal titles. The
following review is the baseline for Goals 16-20.

| Goal | Actual delivered or active boundary |
| --- | --- |
| 1 | **Delivered foundation.** The application consumes the immutable human/mouse one-carbon release and runs a bounded model; this is not broad biochemical source ingestion or atlas coverage. |
| 2 | **Delivered atlas slice.** The evidence explorer consumes the contextual MTHFR human/mouse release and one real Reactome mouse orthology transfer, not a complete biochemical atlas or broad cell coverage. |
| 3 | **Delivered evidence slice.** Local retrieval covers three MTHFR-connected documents with article-specific text rights and review-only machine candidates. It is not a systematic review; correction/retraction parser evidence is synthetic. |
| 4 | **Delivered conformance portfolio.** Three ODE, SSA, and FBA models exercise a narrow SBML/SED-ML/COMBINE profile. They are software and algorithm benchmarks, not physiological predictions or general archive interoperability. |
| 5 | **Delivered synthetic algorithm benchmark.** Parameter selection, calibration, identifiability, posterior, and robustness mechanics use noiseless synthetic decay data and one-carbon assumptions. No measured biological parameter, noise model, or model comparison is validated. |
| 6 | **Delivered synthetic APAP benchmark.** Every biological-looking input is an illustrative assumption and every observation is equation-generated. All human/mouse PK, injury, and NAC scientific validation remains unsupported. |
| 7 | **Delivered synthetic spatial workbench.** Linked views consume repository-authored meshes, fields, and transforms. They do not show measured anatomy, HRA placement, or lobule-local biology. |
| 8 | **Delivered bounded review loop.** The workbench submits and reviews one synthetic APAP assertion. It does not discover source updates automatically, compare an eligible measurement, or apply evidence-lifecycle invalidation. |
| 9 | **Delivered local experiment workspace.** Durable local experiments, queues, artifacts, reports, and bounded resources are supported; this is not distributed execution or proof of biological validity. |
| 10 | **Delivered synthetic physiology conformance.** Human circulation/liver/kidney packages and coupling use repository-authored schedules and synthetic mass transfer. Every mouse domain and every scientific validation claim remains unsupported. |
| 11 | **Delivered release infrastructure.** Trust-policy enforcement, verified local mirroring, pagination, offline replay, and semantic differences establish distribution trust and reproducibility, not new scientific coverage. |
| 12 | **Delivered bounded measured commons.** The consumer verifies 1,544 APAP-related measurements from three study families, but missing CEBS assay method/specimen matrix makes its selected calibration not evaluable; held-out renal GSH is provenance inspection, not model validation. |
| 13 | **Delivered narrow external challenge.** One human study supplies two aggregate parent-APAP Cmax endpoints without reported uncertainty. The frozen model failed both endpoints; no toxicity, injury, NAC, population, or clinical claim is supported. |
| 14 | **Active.** The workbench independently consumes a DigiMouse measured atlas slice and a separate Learn2Reg human source-prealigned MR/CT pair. No chain connects DigiMouse, HRA, or the synthetic mouse lobule; biologically relevant lobule registration remains pending. |
| 15 | **Delivered technical scale gate.** The local campaign executes 1,024 work items and verifies 1,029 signed events with recovery and bounded resources. Outcomes remain scientifically unsupported and review-required; execution does not accept, invalidate, or upgrade a conclusion. |

## Transition From Goals 14 And 15

Goal 14 remains active independently of Goals 16-20. The inference application
may expose a lobule registration only after independently verifying a separately
signed producer closure with compatible spaces, axes, units, direction, quality
evidence, uncertainty, valid region, and inverse status. It must not approximate
the mapping or compose the unrelated Learn2Reg identity into it.

Goal 15 supplies reusable impact verification, durable local execution,
recovery, and signed-event audit. It does not supply scientific review policy.
Goal 19 may use its campaign engine to request and execute revalidation, but must
add evidence-lifecycle and reviewer-decision behavior rather than interpreting a
successful technical result as a disposition. Goal 20 may omit spatial
validation when no same-context registration exists; a visible
`not-evaluable` scale is preferable to an invented multiscale chain.

## Working Method

1. Write matched producer/consumer E2E scenarios for a bounded question,
   coverage denominator, rights boundary, and failure outcomes before adding a
   route, model, or workbench control.
2. Consume only independently verified immutable producer closures. The
   inference service cannot repair missing source, context, rights, uncertainty,
   partition, or registration fields.
3. Keep reported measurements, deterministic derived measurements, fitted
   values, predictions, assumptions, and synthetic fixtures as distinct types
   in storage, computation, APIs, and presentation.
4. Isolate complete study families before calibration, model selection, or
   challenge disclosure. Browser previews, caches, summaries, and artifacts must
   not bypass a partition.
5. Report source rights, distribution trust, format conformance, numerical
   reproducibility, model adequacy, and scientific support as independent gates.
6. Preserve immutable local inputs and artifacts plus enough software and
   environment identity for clean, network-disabled replay.
7. Present failed, non-converged, non-identifiable, incompatible, and
   not-evaluable results without substituting a fixture or hiding an endpoint.
8. Complete source-rights, scientific, security, standards-interoperability, and
   cross-repository review before changing a goal from `Pending`.

## Research And Rights Baseline

The source survey was reviewed on 2026-07-17. These pages identify candidates
and constraints; the inference application must rely on pinned producer source
and rights records rather than fetching them during a scientific workflow.

- BRENDA release 2026.1 states CC BY 4.0 for BRENDA data and separately notes
  possible Digital Sequence Information benefit-sharing obligations:
  `https://www.brenda-enzymes.org/license.php`.
- BioModels states that its encoded models and annotations are distributed under
  CC0, while model-associated publications remain separate works:
  `https://www.biomodels.org/termsofuse`.
- SBML is an open model format; SED-ML Level 1 Version 5 describes reproducible
  simulation experiments; OMEX packages models, data, and procedures:
  `https://sbml.org/`, `https://sed-ml.org/`, and
  `https://identifiers.org/combine.specifications:omex`.
- PEtab specifies measurements, conditions, observables, noise models, and
  parameter bounds; PEtab Select specifies candidate-model spaces and comparison
  criteria: `https://petab.readthedocs.io/` and
  `https://petab-select.readthedocs.io/`.
- NCBI states that contributed or licensed content can retain third-party rights,
  PubMed abstracts may be copyrighted, and PMC reuse is article-license-specific;
  PMC bulk retrieval must use designated services:
  `https://www.ncbi.nlm.nih.gov/home/about/policies/` and
  `https://www.ncbi.nlm.nih.gov/pmc/about/copyright/`.
- Crossref documents public Retraction Watch metadata, daily-working-day updates,
  and explicit retraction, correction, expression-of-concern, and reinstatement
  natures: `https://www.crossref.org/documentation/retrieve-metadata/retraction-watch/`.

The consumer must display and preserve the producer's exact source version,
retrieval report, checksums, attribution, license or terms snapshot,
redistribution decision, and limitations. A verified signature does not prove
source authorship, comparability, measurement quality, or scientific support.

## Cross-Repository Ownership

| Concern | `biochemical-db` | `biochemical-inference` |
| --- | --- | --- |
| Measured expansion | Owns source acquisition, rights, reported values, context, transformations, coverage, and exclusions | Owns compatible selection, use, diagnostics, and preservation of producer qualifiers |
| Model comparison | Owns measured problem definitions, fixed partitions, candidate-model evidence, and scoring declarations | Owns fitting, uncertainty propagation, comparison execution, robustness, and reports |
| Portable packages | Owns source archives, licenses, immutable package releases, metadata, and conformance descriptors | Owns independent import, execution, export, round-trip checks, and local artifact closure |
| Evidence lifecycle | Owns source revision events, evidence dependencies, eligibility policy inputs, and signed scientific dispositions | Owns impact consumption, quarantine, revalidation requests, historical presentation, and offline replay |
| Multiscale validation | Owns compatible measured endpoint closures, mappings, partitions, and challenge contracts | Owns model freeze, scale-specific and coupled execution, diagnostics, scoring, and bounded conclusions |

## Goal 16: Measured Biochemical Kinetics And Physiology Expansion

**Status: Pending**

### Motivation

Goal 12 proves measured synchronization, lineage, and partition isolation but
does not provide broad kinetic parameters or measured physiology. Goal 5 and
Goal 10 remain synthetic at their scientific boundaries. The consumer needs
enough context-qualified measured evidence to replace assumptions only where an
explicit selection can be defended.

### Strict Scope

- Independently verify a producer-declared coverage matrix for kinetic quantity,
  physiological quantity, taxon, tissue or organ, compartment, assay or
  acquisition method, and intended model role.
- Synchronize measured enzyme kinetics and nonclinical physiological observations
  from at least two independent study families in each included domain while
  retaining explicit producer gap cells.
- Preserve reported values, units, uncertainty or explicit absence, conditions,
  constructs or isoforms, taxa, tissues, specimens, assays, protocols,
  experimental units, interventions, times, and evidence locators without local
  completion.
- Select compatible candidates deterministically and expose all competing,
  converted, transferred, restricted, context-incomplete, and excluded records
  with producer and consumer rationale.
- Keep in-vitro enzyme kinetics, ex-vivo measurements, and in-vivo physiology as
  separate applicability classes; a model-use transform must be explicit and
  sensitivity-tested.
- Bind every selected input and complete lineage to run, calibration,
  uncertainty, comparison, and report artifacts for offline replay.

### Non-Goals

- Comprehensive kinetics or physiology, a universal parameter library, or
  silently filling every human and mouse coverage cell.
- Choosing one database value as universal truth or treating a database record as
  direct measurement without study and locator closure.
- Guessing missing assay context, uncertainty, tissue, sex, strain, pH,
  temperature, or cross-species equivalence.
- Relabeling or overwriting Goal 5 assumptions, Goal 6 synthetic APAP values, or
  Goal 10 synthetic flows.
- Clinical ranges, dose advice, diagnosis, treatment, or population claims.

### Acceptance Gates

- Every value displayed or used as measured independently verifies against the
  producer release, source and rights decision, study family, protocol, evidence
  locator, context, uncertainty statement, and transformation lineage.
- The local coverage projection exactly matches the producer partition of usable,
  restricted, incompatible, context-incomplete, conflicting, and absent evidence.
- At least two independent study families support consumed kinetic evidence and
  at least two support consumed physiological evidence. No taxon/context cell is
  selected solely through an undeclared transfer.
- Duplicate and contradictory reports remain visible, and any preferred
  candidate is derived by a pinned selection policy whose change creates a new
  input and run identity.
- A clean network-disabled replay reconstructs one selected kinetic closure and
  one physiological closure, their exclusion rationale, and every report field
  without producer access or local field repair.

### Cross-Repository Ownership

`biochemical-db` owns the coverage target, source locks, rights decisions,
measured records, contexts, transformations, conflicts, exclusions, and signed
query roots. `biochemical-inference` owns strict synchronization, local closure,
context matching, selection rationale, model use, sensitivity, diagnostics, and
lineage presentation.

### Source And Rights Prerequisites

- Require exact producer pins for the BRENDA release, CC BY 4.0 terms,
  attribution, and applicable DSI notice when BRENDA records are used.
- Refuse SABIO-RK, primary-article, supplementary-table, NTP/CEBS, or other data
  whose producer rights and redistribution decision are absent or ambiguous.
- Do not fetch restricted article text or source tables to complete a producer
  metadata-only record; expose the restriction and exclude the value if required
  fields cannot be verified.
- Do not persist or process human subject-level data unless the producer release
  proves compatible access, consent, privacy, and redistribution conditions.

### Smallest First Increment

Consume one context-complete enzyme-kinetic study family and one nonclinical
liver-physiology study family after producer rights triage. Implement verified
selection, unit conversion, exclusion rationale, and lineage reporting only; do
not couple the values into a validated model or mark Goal 16 delivered.

## Goal 17: Comparative Models And Propagated Uncertainty

**Status: Pending**

### Motivation

Goal 5 proves uncertainty algorithms on a noiseless synthetic equation, and
Goal 13 challenges one frozen APAP model against two aggregate values. The
workbench cannot yet compare structural alternatives against measured data or
show whether a conclusion survives measured, structural, contextual, numerical,
and model-selection uncertainty.

### Strict Scope

- Consume immutable comparison problems binding measured data, complete
  development/calibration/validation partitions, observables, conditions,
  transformations, noise models, candidate model identities, parameter priors or
  bounds, and predeclared comparison criteria.
- Fit and compare at least two scientifically plausible, structurally distinct
  models for the same bounded question without treating complexity as truth.
- Propagate parameter, measurement, structural, contextual, numerical, and
  model-selection uncertainty separately into predictions and endpoint
  conclusions.
- Import a declared PEtab-compatible problem profile and PEtab Select-compatible
  candidate space where lossless, with explicit rejection of unsupported
  semantics before fitting.
- Retain all converged, non-converged, non-identifiable, failed, and
  not-evaluable candidates and report sensitivity to priors, starts, solvers,
  criteria, and permitted partition assumptions.
- Freeze candidates, fitting policy, criteria, tie handling, and endpoint mapping
  before requesting held-out outcomes.

### Non-Goals

- Declaring one universal best model, equating an information criterion with
  biological truth, or hiding model-selection uncertainty behind one trajectory.
- Searching structures, thresholds, endpoints, or priors against held-out data
  while retaining a held-out label.
- Promoting fitted, posterior, ensemble, or selected values to measured origin.
- Requiring a favorable or unique winner; indistinguishable and not-evaluable
  outcomes are valid results.
- Clinical prediction or individualized inference.

### Acceptance Gates

- One measured comparison closes over at least two structural candidates,
  complete rights-qualified lineage, and leakage-free family partitions.
- Local identities change for any candidate, data, transform, noise model,
  prior, bound, criterion, threshold, algorithm, or partition change.
- Producer and consumer independently agree on problem, candidate, observable,
  and partition identities before held-out disclosure.
- Fits and uncertainty diagnostics reproduce offline; every candidate failure is
  retained, and reports show whether ranking or conclusions change under every
  predeclared criterion and robustness condition.
- Held-out scoring occurs once against the frozen comparison and can conclude
  `failed`, `not-evaluable`, `indistinguishable-within-boundary`, or
  `supported-within-boundary` without changing source or measured records.

### Cross-Repository Ownership

`biochemical-db` owns measured comparison inputs, source lineage, partition
closure, observable mappings, candidate-model evidence, and frozen comparison
declarations. `biochemical-inference` owns fitting, diagnostics, uncertainty
propagation, model comparison, held-out execution, immutable artifacts, offline
replay, and bounded reporting.

### Source And Rights Prerequisites

- Use only Goal 16 or other independently verified measured releases whose
  producer rights records permit the declared package and computation use.
- Pin and validate exact PEtab and PEtab Select profiles; format validity cannot
  substitute for data adequacy or model plausibility.
- Accept a BioModels candidate only with exact archive/version and CC0 dataset
  verification. Treat associated publication text and externally linked data as
  separate rights objects.
- Display original model authors, citations, identifiers, modifications,
  licenses, and producer limitations in every comparison report.

### Smallest First Increment

Consume a producer comparison declaration with two predeclared structural
variants over one adequate Goal 16 measured study closure. If the data cannot
identify or validate either variant, publish the immutable insufficiency report
and keep the goal pending rather than substituting the Goal 5 synthetic
benchmark.

## Goal 18: Interoperable Reproducible Model Packages

**Status: Pending**

### Motivation

Goal 4 supports a deliberately narrow three-file archive profile with required
repository annotations, and Goal 9 exports an internal experiment bundle. The
application does not yet prove that an independently authored standards package
can be imported, executed, exported, and reproduced in another tool without
private semantic repair.

### Strict Scope

- Independently import immutable producer packages using version-pinned OMEX
  manifests, SBML, SED-ML, OMEX metadata, and PEtab files where measurements are
  part of the experiment.
- Verify every model, experiment, measurement, condition, observable, unit,
  algorithm, parameter, seed, expected output, citation, license, software
  profile, limitation, and local or content-addressed reference before execution.
- Implement explicit supported-feature matrices rather than claiming general
  SBML, SED-ML, PEtab, CellML, or COMBINE support.
- Execute standard semantics independently of optional repository metadata; a
  private annotation cannot be the only representation of equations, tasks,
  observables, or result comparisons.
- Track canonical package bytes and semantic identity separately so harmless XML
  or ZIP reserialization is not reported as a model change.
- Export and re-import complete offline archives and compare them with an
  independently conforming tool under declared numeric tolerances.

### Non-Goals

- Executing arbitrary code, macros, remote references, containers, or scripts
  embedded in an archive.
- Universal support for every standards level, package, solver, algorithm, or
  model formalism.
- Calling archive validity scientific reproducibility or biological validation.
- Repackaging restricted data or publications under the application license.
- Requiring byte-identical output where a standard permits equivalent
  serialization; semantic identity and declared numeric tolerances are the gates.

### Acceptance Gates

- Every accepted package passes version-pinned independent standards validators
  and the consumer's stricter archive security, closure, units, identifiers,
  rights, and offline-reference checks.
- At least one independently authored kinetic package and one constraint-based
  or physiology-relevant package execute in this application and one independent
  conforming tool, reproducing all predeclared observables within tolerance.
- Import, execution, export, and re-import preserve semantic identity and
  provenance closure; unsupported or lossy semantics fail before execution.
- A clean network-disabled workspace reconstructs the complete package, software
  profile, run artifacts, and cross-tool comparison from immutable objects.
- The workbench reports format conformance, numerical reproduction, and
  scientific support separately and preserves divergence or failure visibly.

### Cross-Repository Ownership

`biochemical-db` owns source package acquisition, rights and attribution,
immutable package releases, standards profiles, semantic identities, and
expected-result descriptors. `biochemical-inference` owns independent parsing,
safe execution, export, round-trip comparison, local artifact closure,
cross-tool reproduction evidence, and accessible presentation.

### Source And Rights Prerequisites

- Independently pin the producer-declared SBML, SED-ML Level 1 Version 5, OMEX,
  OMEX metadata, and PEtab specifications and validator versions.
- For BioModels, verify the exact archive and current CC0 terms for encoded
  models and annotations while retaining attribution and separating publication
  or externally linked data rights.
- Refuse Physiome/CellML or other repository packages without an exact
  model-exposure license and complete imported-component license closure; a
  project-level open-source policy is not enough.
- Reject remote package dependencies rather than fetching them at execution;
  every accepted dependency must be rights-reviewed and present in the immutable
  producer closure.

### Smallest First Increment

Import one independently authored, rights-compatible BioModels model with a
bounded reproducible experiment. Execute it locally and in one independent tool,
export and re-import it, and publish the exact comparison without using optional
metadata as executable truth. This proves one package path, not general
interoperability or scientific validity.

## Goal 19: Evidence Revision And Scientific Invalidation

**Status: Pending**

### Motivation

Goal 3 can parse lifecycle records but has only synthetic correction,
retraction, and deletion fixture evidence. Goal 8 stores manual derived-review
events, and Goal 15 verifies technical impact, but the workbench cannot consume
real evidence revisions and carry their scientific disposition through affected
inputs, assertions, challenges, and reports.

### Strict Scope

- Synchronize immutable producer lifecycle events for corrections, retractions,
  expressions of concern, deletions, replacements, data revisions, model
  revisions, and reinstatements with exact identity and source closure.
- Independently verify DOI, PMID, PMCID, accession, dataset, model, and release
  relations and preserve ambiguous or conflicting notices as unresolved.
- Recompute producer dependency impacts over local inputs, runs, derived
  assertions, challenges, comparisons, and reports without inventing edges.
- Keep source event, deterministic evidence-eligibility result, campaign
  execution, reviewer decision, and final scientific state as separate records
  and workbench lanes.
- Support append-only `review-required`, `evidence-ineligible`, `invalidated`,
  `superseded`, `reinstated`, and `unchanged-with-rationale` dispositions with
  signature and historical-head verification.
- Quarantine currently ineligible evidence from new computations while retaining
  exact historical replay of work that previously used it.

### Non-Goals

- Deleting or rewriting retracted evidence, silently replacing a source, or
  treating absence from one update feed as proof that a work is current.
- Automatically invalidating every multi-source conclusion because one source
  changed, or automatically preserving it because another citation remains.
- Fetching or redistributing restricted notice or article text when only metadata
  is licensed.
- Letting an AI-generated contradiction, dependency edge, or completed campaign
  make the scientific decision.
- Reputation scoring, misconduct adjudication, or clinical alerting.

### Acceptance Gates

- At least one real biochemical publication lifecycle event and one real
  dataset or model revision are independently verified and linked to exact local
  dependents without accepting the existing synthetic parser event as evidence.
- The same event and dependency snapshot produce the same ordered impact and
  evidence-eligibility results in both repositories.
- A sole-support retraction makes its dependent claim unavailable to new runs
  under a predeclared policy without erasing it; a multi-source claim remains
  review-required until a signed disposition addresses every support.
- Correction, retraction, and reinstatement sequences preserve ordering,
  signatures, historical trust, reasons, and all prior states across restart and
  network-disabled replay.
- Revalidation execution cannot author a scientific disposition; reports expose
  source state, technical state, reviewer state, and current eligibility
  separately.

### Cross-Repository Ownership

`biochemical-db` owns source-event acquisition, identifier resolution,
evidence-dependency truth, eligibility policy inputs, and signed scientific
dispositions. `biochemical-inference` owns synchronization, local impact
verification, quarantine, revalidation requests and execution, historical
presentation, notifications within the local workbench, and offline audit replay.

### Source And Rights Prerequisites

- Require producer pins for PubMed baseline/update inputs and current NLM terms;
  do not mirror PubMed abstracts merely because metadata can be downloaded.
- Accept PMC text only when the producer used designated bulk services and the
  exact article license permits reuse, including third-party figure and
  supplement exclusions.
- Verify Crossref/Retraction Watch snapshot or response identity, update source,
  vocabulary, terms, and retrieval date, plus publisher or issuer corroboration
  where available.
- Display metadata-only notices when notice text is restricted and never infer a
  retraction reason absent from the producer source closure.

### Smallest First Increment

Consume one real biochemical article correction or retraction relation confirmed
by DOI or PMID, link one bounded dependent assertion, execute its Goal 15 impact
campaign, quarantine it from new use when policy requires, and present the signed
human disposition and historical state. The real event, not the synthetic parser
fixture, is the increment's evidence.

## Goal 20: Bounded Multiscale Measured Validation

**Status: Pending**

### Motivation

Goal 6 supplies a synthetic multiscale APAP algorithm fixture, Goal 13 tests only
aggregate parent-APAP Cmax, Goal 14 has no lobule registration, and Goal 10 has
no measured physiology. The application should make a multiscale claim only
when compatible measurements and evidence-backed mappings exist at every named
scale.

### Strict Scope

- Freeze one nonclinical biological question, taxon, intervention, route, dose,
  timing, tissue, endpoint hierarchy, model closure, and applicability boundary
  before requesting outcomes.
- Consume at least two genuinely distinct, adjacent measured scales from the
  same study family or independently justified compatible families, such as
  systemic exposure plus organ response or organ response plus cellular or
  molecular response.
- Verify experimental-unit, specimen, sampling, assay, spatial, temporal, and
  intervention relationships before constructing a cross-scale mapping.
- Validate each scale-specific component separately before evaluating coupling,
  with inaccessible validation and external-held-out closures isolated from
  model development and browser previews.
- Propagate uncertainty through every cross-scale transformation, aggregation,
  normalization, registration, and surrogate-endpoint assumption and test their
  sensitivity.
- Report frozen endpoint, metric, threshold, not-evaluable rule, scale-specific
  conclusion, and integrated conclusion separately.

### Non-Goals

- Requiring spatial, cellular, organ, and whole-body levels when the source does
  not support all of them, or calling unrelated datasets multiscale because their
  labels can be mapped.
- Using DigiMouse, Learn2Reg, HRA, or the synthetic lobule as a specimen-specific
  bridge without a compatible measured registration.
- Treating an exposure fit as injury validation, a biomarker as a clinical
  outcome, or mouse evidence as direct human support.
- Treatment, safety, diagnosis, dose selection, individualized prediction, or
  clinical validation.
- Requiring a favorable integrated result or hiding a failed component behind an
  aggregate score.

### Acceptance Gates

- Independent verification proves every named scale is measured and that its
  experimental-unit, intervention, time, tissue, assay, and mapping relations
  are sufficient for the exact declared comparison.
- No development, subject, specimen, image, aggregate, transformation, cache,
  preview, or derivative crosses into validation or external-held-out closure.
- Every component and the coupled model has a frozen identity and an independent
  `failed`, `not-evaluable`, or `supported-within-boundary` conclusion with
  uncertainty and numerical diagnostics.
- Removing any cross-scale mapping, measurement family, or context qualifier
  either changes the challenge identity or makes the affected conclusion
  explicitly not evaluable.
- Clean network-disabled replay reproduces all inputs, artifacts, scores,
  diagnostics, and conclusions, and the report states that support at two
  bounded scales does not validate omitted scales or broader biology.

### Cross-Repository Ownership

`biochemical-db` owns measured scale-specific releases, study relationships,
cross-scale evidence mappings, partitions, endpoint definitions, challenge
contracts, and rights. `biochemical-inference` owns independent verification,
model and coupling freeze, scale-specific and integrated execution, uncertainty
propagation, diagnostics, scoring, immutable artifacts, offline replay, and
bounded presentation.

### Source And Rights Prerequisites

- Prefer one producer-qualified nonclinical study family with reusable exposure,
  clinical chemistry, histopathology, imaging, omics, or molecular endpoint files
  over post-hoc linkage of unrelated studies.
- Require the exact NTP/CEBS policy and accession-specific third-party review;
  do not interpret a federal public-domain default as a blanket grant.
- Verify every dataset version, article and supplement license, transformation,
  attribution, and privacy or consent boundary carried by the producer.
- Enable spatial analysis only for a same-context coordinate and registration
  closure. Otherwise show spatial validation as absent and keep Goal 14 separate.

### Smallest First Increment

Consume the producer's signed sufficiency and gap audit for one existing CEBS
APAP study family and a possible second endpoint family, such as histopathology
only if the exact experimental units, times, and rights support linkage to its
clinical chemistry. Build no coupled challenge when two scales do not close;
show the not-evaluable boundary and keep Goal 20 pending.
