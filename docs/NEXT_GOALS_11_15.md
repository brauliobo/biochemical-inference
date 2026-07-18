# Next Goals 11-15

## Purpose And Status

These goals begin after the completed Goals 1-10 review. The completed releases,
models, and workflows remain bounded fixtures under their published contracts.
In particular, the existing parameter, APAP, spatial, derived-knowledge, and
physiology assets do not become measured evidence or broader scientific
validation by being reused here.

| Goal | Status |
| --- | --- |
| 11. Authoritative Release Factory And Local Data Plane | **Delivered** |
| 12. Measured Parameter And Observation Commons | **Delivered** |
| 13. Externally Challenged APAP Benchmark | **Delivered** |
| 14. Measured Spatial Liver Atlas And Registration | **Active; bounded measured atlas slice delivered, real registration pending** |
| 15. Local Revalidation Campaigns At Scale | **Delivered; scale gate complete** |

Status is changed only by evidence that the acceptance gates are met. These
goals have no dates, duration estimates, or delivery timelines.

## Working Method

1. Write matched, high-level E2E scenarios in both repositories before changing
   an implementation or data contract.
2. Establish the producer contract in `biochemical-db` before the inference
   application depends on it.
3. Preserve immutable inputs, canonical identities, licenses, source locators,
   transformations, and rejected records from acquisition through presentation.
4. Use clean, network-disabled rebuilds and fresh local state for acceptance;
   an existing cache cannot be the only proof of reproducibility.
5. Add new release families and API versions rather than mutating published
   Goals 1-10 releases or relabeling their fixtures.
6. Keep calibration, model development, challenge, and display concerns
   separate. A scientific gate cannot be satisfied by a software conformance
   result alone.
7. Exercise recovery, corruption, missing-license, incompatible-context, and
   unsupported-registration paths as first-class outcomes.
8. Complete an independent review of source rights, scientific boundaries,
   trust policy, and cross-repository behavior before a goal is delivered.

## Scientific Labels

Labels are explicit and orthogonal. A record must state its origin, role, and
validation state; one label cannot imply the others.

- `measured`: a value observed by a declared assay or acquisition protocol and
  linked to a study, source object, evidence locator, context, and uncertainty.
- `derived-measurement`: a deterministic normalization, digitization, summary,
  or registration derived only from measured inputs, with the transformation
  and original observations retained.
- `illustrative-assumption`: a repository-authored numeric input without a
  measured evidence claim.
- `synthetic` and `synthetic-benchmark`: generated fixtures used to verify
  software or algorithms, never substitutes for measured data.
- `fitted`, `estimated`, `predicted`, and `computed`: derived result classes;
  none is relabeled `measured` after review.
- `development`, `calibration`, `validation`, and `external-held-out`: study or
  observation roles fixed by an immutable partition before the relevant fit or
  challenge run.
- `unsupported`, `not-evaluable`, `failed`, and `supported-within-boundary`:
  conclusion states. `supported-within-boundary` requires a declared endpoint,
  context, comparator, metric, threshold, and applicability boundary.

Trusted external provenance and redistribution permission are separate from
scientific origin. A measured record can remain unusable when its identity,
license, context, or source closure is incomplete.

## Cross-Repository Ownership

| Concern | `biochemical-db` | `biochemical-inference` |
| --- | --- | --- |
| Source truth | Acquires, locks, licenses, normalizes, validates, signs, and publishes immutable releases | Never authors or repairs producer records at consumption time |
| Local data | Serves verified release, page, chunk, and semantic-difference contracts | Mirrors and pins verified content for loopback, offline workflows |
| Scientific contracts | Defines measured lineage, study partitions, contexts, assets, transforms, and evidence boundaries | Selects compatible records and preserves every producer qualifier in runs and reports |
| Computation | Publishes benchmark protocols, observations, scoring contracts, and dependency indexes | Runs models, challenges, comparisons, campaigns, and recovery workflows |
| Trust | Publishes signed metadata, key identifiers, rotation, and revocation history | Applies an explicit trust policy and records the verified signer with every consumed release |
| Review | Keeps source releases immutable and stores signed derived review history separately | Presents source and derived layers separately and requests review without silently changing status |

Cross-repository JSON identities use the declared canonicalization profile and
digest algorithm. Distribution signatures authenticate those identities; they
do not turn a digest into a signature or prove a scientific conclusion.

## Goal 11: Authoritative Release Factory And Local Data Plane

**Status: Delivered**

Make one reproducible producer path and one verified local read path
authoritative for every subsequent data-backed workflow.

### Scope

- A clean, network-disabled bootstrap from pinned local source objects to a
  byte-identical release, signed distribution metadata, and an inference-side
  local mirror.
- Explicit trust roots, signer key identifiers, signature verification results,
  release and manifest digests, and fail-closed handling of unknown, revoked, or
  invalid signers.
- Snapshot-pinned cursor pagination with deterministic ordering, bounded page
  sizes, and no duplication or omission while a consumer traverses a release.
- Release-family discovery and content retrieval from the local data plane with
  no runtime dependence on GitHub, mutable branches, or upstream scientific
  services.
- Record-level semantic differences that distinguish additions, removals,
  scientific field changes, provenance changes, and packaging-only changes and
  attribute each difference to source or transformation inputs.
- Visible inference run and report pins to the exact release, signer, schema,
  page or chunk closure, and semantic difference used.

### Non-Goals

- A cloud catalog, hosted account system, distributed database, or mutable
  release editor.
- Treating publisher signatures as upstream-source authenticity or scientific
  validation.
- Expanding the scientific coverage of completed Goals 1-10 fixtures.
- A fallback that silently serves stale, unsigned, partially mirrored, or
  schema-incompatible data.

### Acceptance Gates

- Two clean offline builds from the same source-object closure produce the same
  payload bytes, manifest digest, release identity, and valid signed envelope.
- The inference application populates an empty local data plane, verifies the
  configured trust policy, and completes a pinned workflow while the producer
  and network are unavailable.
- Pagination over a fixed snapshot returns every eligible identity exactly once
  under declared ordering, and a cursor cannot be reused across release
  identities or query contracts.
- Signature, digest, canonicalization, schema, missing-object, and revocation
  failures prevent publication or consumption with an actionable finding.
- A semantic difference is deterministic in both repositories and explains the
  originating source-object or transformer change without classifying mere
  packaging changes as scientific changes.

### Cross-Repository Ownership

`biochemical-db` owns the release factory, signed metadata, paginated producer
API, and semantic-difference truth. `biochemical-inference` owns trust-policy
enforcement, the local mirror, offline use, and user-visible pins and failures.

## Goal 12: Measured Parameter And Observation Commons

**Status: Delivered**

Replace assumption-only parameter selection with a reusable commons of
measured, context-qualified parameters and observations without weakening the
existing synthetic boundary.

### Scope

- Parameter candidates and observations linked through study, cohort or
  experimental unit, sample, protocol, assay, source object, evidence locator,
  license, and deterministic transformation lineage.
- Raw reported values alongside normalized values, dimensions, units,
  uncertainty, censoring, replicate structure, detection limits, and missingness.
- Explicit taxon, strain, sex, life stage, tissue, cell, compartment, disease,
  route, dose, time, pH, temperature, fasting, and named context qualifiers.
- Immutable study-level development, calibration, validation, and
  external-held-out partitions that prevent related samples or subjects from
  leaking across roles.
- Deterministic applicability and exclusion rationale for model contexts,
  including unit conversion and any evidence transfer.
- Inference searches, calibration, held-out evaluation, uncertainty reporting,
  and reports that retain the complete measured lineage.

### Non-Goals

- Claiming comprehensive kinetic, pharmacological, or physiological coverage.
- Redistributing restricted source bytes or inventing a measurement where only
  an abstract, summary, or inaccessible figure exists.
- Silent imputation, cross-species transfer, unit guessing, or automatic
  selection of one candidate as universal truth.
- Relabeling the Goal 5 synthetic decay observations or one-carbon assumptions
  as measured records.

### Acceptance Gates

- Every value displayed or used as measured resolves to an immutable source
  object, study and protocol, exact evidence locator, license decision, original
  value, normalized value, transformation, context, and uncertainty statement.
- A study family, subject, specimen, or repeated measure cannot cross an
  incompatible partition boundary, and partition changes create a new identity.
- Compatible selection is deterministic and explains every included, excluded,
  converted, transferred, censored, or unavailable candidate.
- Calibration cannot access validation or external-held-out values, including
  through summaries, cached artifacts, defaults, or visual previews.
- The same release closure and study partition produce identical inference
  inputs and lineage reports offline.

### Cross-Repository Ownership

`biochemical-db` owns measured records, study topology, partition identities,
licenses, transformations, and query contracts. `biochemical-inference` owns
context matching, selection rationale, calibration isolation, uncertainty use,
and complete lineage in run artifacts.

## Goal 13: Externally Challenged APAP Benchmark

**Status: Delivered**

The signed producer contract, inference-owned freeze, isolated disclosure,
independent scoring, immutable report, offline replay, bounded Vue presentation,
focused service/API/component tests, and real desktop/mobile browser acceptance
are implemented. The exact two-endpoint result is `failed`; this does not
validate the model more broadly. See `docs/CHALLENGE.md`.

Challenge a frozen APAP model against independently sourced, measured, held-out
data instead of interpreting the completed synthetic APAP fixture as biological
validation.

### Scope

- Independently sourced measured APAP datasets with explicit human or mouse
  context, protocol, endpoints, uncertainty, study relationships, and rights.
- A development closure and a separately identified external-held-out challenge
  closure that was not used to choose equations, parameters, thresholds, or
  endpoint transformations.
- A frozen model, parameter-selection policy, challenge protocol, endpoint
  mapping, metrics, thresholds, exclusions, and not-evaluable rules committed by
  digest before challenge values are made available to execution.
- Endpoint-level scoring for supported PK, glutathione, adduct, biomarker,
  histology, or injury observations only where the release supplies compatible
  evidence.
- Complete pass, fail, and not-evaluable results with applicability boundaries,
  uncertainty, sensitivity, numerical diagnostics, and source lineage.

### Non-Goals

- Treatment, diagnosis, dose selection, NAC efficacy guidance, or a universal
  human liver toxicity claim.
- Tuning after seeing held-out outcomes while retaining an
  `external-held-out` label.
- Treating conservation, convergence, limiting cases, or the Goal 6 synthetic
  observations as external biological support.
- Filling absent human injury or cross-species evidence by translation from a
  different taxon or protocol.

### Acceptance Gates

- The challenge runner proves the model, parameter policy, partitions, endpoint
  mappings, metrics, and thresholds were frozen before held-out disclosure.
- No held-out study, subject, sample, observation, summary, or derivative is
  reachable by model development or calibration.
- Every declared endpoint produces a reproducible `failed`, `not-evaluable`, or
  `supported-within-boundary` result; missing or incompatible evidence cannot be
  omitted from the report.
- Repeating the challenge from a clean offline workspace reproduces input pins,
  scores, diagnostics, and conclusion labels.
- Existing APAP claims remain `unsupported` unless the specific predeclared
  endpoint and context pass their scientific gate.

### Cross-Repository Ownership

`biochemical-db` owns the licensed measured release, source locators, immutable
partition, protocol, endpoint definitions, mapping, metric, threshold,
exclusions, not-evaluable rules, protected disclosure, and authoritative result
contract. `biochemical-inference` owns independent pins and verification, the
local immutable snapshot and artifact closure, model and parameter-policy freeze
evidence, isolated execution, numerical diagnostics, independent score
recomputation and producer comparison, offline replay and integrity, and the
bounded conclusion presentation. The browser supplies intents only and cannot
author digests, measured values, scores, or conclusions.

## Goal 14: Measured Spatial Liver Atlas And Registration

**Status: Active; Bounded Atlas And Source-Prealigned Pair Delivered**

Add measured liver imagery and explicit registration contracts while keeping
synthetic lobule geometry and unsupported coordinate mappings visibly separate.

### Scope

- Measured image acquisitions, donor or specimen context, modality, physical
  units, orientation, resolution, channels, masks, segmentations, landmarks,
  uncertainty, source, and license.
- Manifest-closed multiresolution arrays and real chunk inventories with
  canonical metadata, per-object integrity, bounded reads, and immutable cache
  behavior.
- Directed registrations with source and target spaces, transform convention,
  algorithm and parameters, landmarks or evidence, quality metrics, valid
  region, uncertainty, and explicit inverse availability.
- Strict boundaries across taxa, donors, specimens, modalities, scales, and
  reference versions; transform composition is allowed only through a complete,
  compatible chain.
- Viewport-based local chunk loading plus equivalent semantic and tabular access
  to measured values, registration quality, missing data, and provenance.

### Non-Goals

- Relabeling the Goal 7 repository-authored meshes, fields, or transforms as
  measured anatomy.
- Inventing HRA, donor, mouse-to-human, or cross-modality mappings when a pinned
  transform and its evidence do not exist.
- Diagnostic histopathology, patient-specific prediction, or lossless hosting
  of every upstream imaging collection.
- Hiding interpolation, segmentation error, registration uncertainty, absent
  chunks, or out-of-domain coordinates behind a rendered scene.

### Acceptance Gates

- A clean local import verifies source rights and every metadata object and
  chunk before publishing a measured spatial release.
- The inference application requests only chunks belonging to the pinned level,
  region, channels, and release and verifies them before display or analysis.
- Every displayed coordinate and derived value resolves through a declared
  directed transform chain with visible quality, uncertainty, interpolation,
  and validity bounds.
- Cross-taxon, cross-donor, version-mismatched, non-invertible, and
  out-of-boundary registrations fail explicitly rather than falling back to an
  approximate placement.
- The full scientific content and boundary decisions remain available without
  WebGL and after network disconnection.

### Cross-Repository Ownership

`biochemical-db` owns measured spatial assets, chunk manifests, coordinate
spaces, registration evidence, and delivery contracts. `biochemical-inference`
owns verified chunk caching, transform-aware analysis, linked views, and
semantic alternatives to 3D.

The signed producer and inference consumer deliver the bounded CC BY-SA 4.0
DigiMouse atlas slice plus a separate CC BY 3.0 Learn2Reg human MR-fixed/
CT-moving pair. Both use independently pinned trust, catalog, release,
manifest, metadata, inventory, and array identities; strict signature and chunk
verification; release-bound caching; complete offline closure; and responsive
semantic/tabular access without WebGL. The Learn2Reg release materializes an
identity affine only between equal source-prealigned NIfTI sforms, binds every
array to an exact space/index transform, and recomputes residual organ overlap
inside a repository-derived evaluation ROI from 288 evidence chunks. The ROI
scopes metrics and does not invalidate outside-ROI transforms. It cannot connect DigiMouse, HRA, synthetic
lobule geometry, another subject, or another taxon. The biologically relevant
lobule registration remains unavailable, so Goal 14 remains active.

## Goal 15: Local Revalidation Campaigns At Scale

**Status: Delivered; Scale Gate Complete**

Turn source, model, and trust changes into recoverable local campaigns that
revalidate only the affected scientific work and preserve an auditable history.

### Scope

- Immutable campaign specifications pinning baseline and candidate releases,
  models, transforms, policies, dependency snapshots, selection rules, resource
  profiles, and expected work-item identities.
- Producer-supplied dependency and semantic-impact data that distinguishes
  scientific changes from packaging, pagination, or signature-envelope changes.
- A durable local queue with deterministic work identities, leases, attempts,
  checkpoints where scientifically valid, cancellation, retry policy, and
  terminal result artifacts.
- Restart recovery without duplicate accepted results, lost terminal states, or
  silent reuse of artifacts built from incompatible inputs.
- Signed review and campaign events across key activation, rotation, retirement,
  and revocation, with the verifying key and trust state retained per event.
- Bounded concurrency, storage, CPU, memory, and output profiles, plus progress
  and impact summaries that remain usable for large declared local workloads.

### Non-Goals

- Cloud scheduling, multi-tenant collaboration, or an unbounded distributed
  execution platform.
- Automatically accepting, invalidating, or upgrading a scientific conclusion
  because a campaign completed.
- Rerunning unaffected work to mask incomplete dependency information.
- Deleting historical events or resigning old events with the current key.

### Acceptance Gates

- A process interruption during a declared scale campaign recovers the exact
  queue and campaign identity; completed work is reused only after its complete
  input and artifact closure verifies.
- Semantic impact selects every and only directly or transitively affected run,
  assertion, report, and registration under the declared dependency policy.
- Repeated delivery, retry, cancellation, and worker loss cannot create two
  accepted results for one deterministic work identity.
- Rotation preserves verification of historical events, signs new events only
  with an active key, and causes unknown or revoked signing states to fail
  closed without erasing the audit chain.
- Campaign reports separate execution success from scientific result labels and
  expose failures, skipped work, resource exhaustion, and review requirements.

### Cross-Repository Ownership

`biochemical-db` owns dependency indexes, release-impact truth, signed event
contracts, and signing-key lifecycle records. `biochemical-inference` owns local
campaign planning, durable execution and recovery, resource enforcement,
artifact verification, and review-facing impact reports.

The producer/consumer slice independently agrees on action-bearing dependency,
semantic-change, policy, impact, work-item, plan, and campaign identities for the
Goal 11 release pair. The durable local queue now covers leases, attempts,
checkpoints, cancellation, retries, worker-loss and restart recovery, bounded
subprocesses, CAS closure, and exactly-once accepted technical results. Signed
producer campaign/outcome events and activation/rotation/retirement/revocation
rules are verified against an independent bootstrap pin; exact requests,
receipts, events, and historical heads persist locally and verify on restart.
The no-store v13 API and responsive workbench expose technical progress and
review requirements without authoring scientific labels or automatic acceptance.
The delivered scale gate now loads the configured 1,024-work producer plan over
bounded HTTP pages, executes the exact independently recomputed work closure,
and returns 1,024 campaign-scoped outcomes through bounded HTTP batches. The
cross-repository acceptance ledger closes at exactly 1,029 signed events after
the four key-lifecycle transitions and campaign creation. Worker PID readiness,
automatic lease expiry/renewal, process RSS/runtime/output/storage enforcement,
crash-atomic cancellation, and computed report assertions are covered by the
focused CI workflow. CPU cores remain an honest concurrency ceiling rather than
an unenforceable OS CPU-time claim.
