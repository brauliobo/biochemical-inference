# Next Large Goals

## Working Method

Every goal is delivered as one large, independently useful chunk.

1. Write high-level E2E acceptance scenarios before implementation.
2. Define scientific scope, supported contexts, explicit assumptions, and non-goals.
3. Pin source releases, licenses, identifiers, and validation rules.
4. Implement the complete vertical behavior across both repositories.
5. Run source validation, scientific checks, unit/API tests, production builds, and real-service browser E2E tests.
6. Perform an independent review iteration and fix release-blocking findings.
7. Commit the completed chunk without unrelated worktree changes.

No goal is accepted because data was merely downloaded or a visualization was rendered. It must produce a verified scientific capability that can be exercised end to end.

## Goal 1: Reproducible Source Ingestion Platform

Turn `biochemical-db` from a hand-authored seed into a reproducible release producer.

### Scope

- Immutable raw-source object storage with URL, retrieval metadata, checksum, release version, and license.
- Idempotent importer contract with strict staging, normalization, rejection, and promotion phases.
- Dead-letter records and actionable validation reports.
- Deterministic release builder and release-difference report.
- Source-specific adapters for ChEBI, Rhea, UniProt, Reactome, NCBI Taxonomy, Ensembl, and MGI.
- Human and mouse identifier crosswalks.
- Source updates that cannot mutate an existing release.

### Acceptance Gate

- A clean checkout can reproduce the same normalized release digest from the same pinned source objects.
- A source parser change produces an explicit release difference.
- Invalid identifiers, broken references, license omissions, and unbalanced reactions prevent publication.
- Restricted data cannot enter a public release accidentally.

## Goal 2: Human And Mouse Biochemical Atlas Core

Expand beyond the one-carbon slice into a queryable biochemical atlas.

### Scope

- Genes, transcripts, proteins, isoforms, compounds, reactions, complexes, pathways, compartments, tissues, cells, diseases, and phenotypes.
- Reactome, Rhea, GO/GO-CAM, WikiPathways, ChEBI, UniProt, Ensembl, MGI, IMPC, MONDO, HPO, MP, Uberon, and Cell Ontology.
- Species-specific assertions with direct, inferred, orthology-transferred, supporting, and contradicting evidence.
- Explicit identity mappings, deprecations, replacements, and unresolved ambiguity.
- Coverage reports by species, tissue, entity type, and evidence class.

### Acceptance Gate

- Users can traverse gene to protein to reaction to pathway to tissue to phenotype while retaining provenance at every step.
- Human and mouse evidence cannot be mixed without an explicit transformation.
- Contradictory claims remain separately inspectable.
- Atlas coverage and known gaps are measurable rather than implied complete.

## Goal 3: PubMed, PMC, And Local Evidence Intelligence

Convert the existing literature cache into a structured, searchable evidence system.

### Scope

- PubMed baseline and update ingestion with deletion, correction, and retraction handling.
- PMCID, PMID, DOI, author, affiliation, MeSH, publication type, and citation mapping.
- License-aware PMC JATS parsing into sections, tables, methods, references, and evidence spans.
- PubTator entity and relation annotations.
- Exact identifier, full-text, ontology, graph-neighborhood, and vector retrieval.
- Ollama embeddings with versioned model, dimensions, instructions, and source digest.
- Ollama structured extraction into review-only candidate assertions.
- Contradiction and missing-parameter discovery.

### Acceptance Gate

- A biochemical entity returns relevant literature with exact evidence spans and license status.
- Every AI-generated candidate records model, prompt, input digest, output schema, and supporting text.
- Unreviewed AI output cannot become trusted knowledge.
- Retrieval quality is measured against a curated biomedical query set.

## Goal 4: Standards-Based Simulation Portfolio

Status: delivered in the active inference application. See `docs/SIMULATION_PORTFOLIO.md` for the exact supported standards profile and explicit Goal 9 deferrals.

Replace the single demonstration engine with composable scientific model types.

### Scope

- SBML Level 3 model import and export.
- SED-ML experiment definitions and COMBINE archives.
- Deterministic ODE, stochastic SSA, and constraint-based FBA engines.
- Unit-safe state, parameter, intervention, and observable contracts.
- Evidence-backed parameter candidates and explicit model assumptions.
- Checkpoint, cancellation, reproducibility, convergence, and validation contracts.
- Process-isolated model plugins with bounded resources and no default network access.

### Acceptance Gate

- Reference ODE, SSA, and FBA models pass analytic or published benchmarks.
- Every run pins its knowledge release, model, solver, parameters, units, and seeds.
- Failed, infeasible, non-converged, and successful runs remain distinct.
- Imported and exported standards bundles reproduce declared scientific conclusions.

## Goal 5: Parameter Evidence, Calibration, And Uncertainty

Status: delivered for the pinned synthetic algorithm benchmark in the active inference application. See `docs/PARAMETER_STUDIES.md` for algorithms, convergence gates, uncertainty labels, and limitations. External measured BRENDA, SABIO-RK, BioModels, and literature parameter releases remain future data work.

Make simulation conclusions evidence-aware rather than single-valued demonstrations.

### Scope

- BRENDA, SABIO-RK, BioModels, and literature parameter candidates.
- Condition-qualified values including species, tissue, compartment, pH, temperature, assay, and units.
- Parameter distributions, correlations, and competing evidence.
- Sensitivity analysis, identifiability checks, calibration, held-out validation, and posterior predictive checks.
- Separate biological, measurement, structural, contextual, and numerical uncertainty.

### Acceptance Gate

- The system explains why each parameter value or distribution was selected.
- Calibration and validation data are never silently reused.
- Predictions include uncertainty and applicability boundaries.
- Conclusions are tested against parameter, solver, timestep, and model-form variation.

## Goal 6: Human And Mouse Liver Toxicity Benchmark

Status: delivered for the pinned synthetic APAP algorithm benchmark in the active inference application. See `docs/APAP_BENCHMARK.md` for equations, context bindings, diagnostics, results, and unsupported biological validation. Measured independent PK, biomarker, histology, injury, and NAC-response validation remain future evidence work.

Build the first defensible multiscale vertical simulation around acetaminophen liver injury.

### Scope

- Human and mouse PBPK exposure.
- Hepatic metabolism, NAPQI production, glutathione depletion, and detoxification.
- Liver-lobule spatial oxygen and metabolic zonation.
- Hepatocyte injury and recovery state transitions.
- Dose and antidote intervention protocols.
- Species-specific enzyme, physiology, and evidence mappings.
- Independent validation against published concentration, biomarker, and injury datasets.

### Acceptance Gate

- Molecular, cellular, tissue, and systemic components validate independently.
- Coupled limiting cases reproduce uncoupled behavior where expected.
- Human/mouse differences arise only from visible, sourced parameters or assumptions.
- Every visible prediction links to run controls, evidence, uncertainty, and validation status.

## Goal 7: Spatial Tissue And Anatomical 3D Workbench

Status: delivered for the pinned synthetic APAP spatial algorithm benchmark in the active inference application. See `docs/SPATIAL_WORKBENCH.md` for integrity controls, linked semantics, rendering behavior, and the explicit unavailable HRA boundary. Measured imaging, realistic tissue geometry, HRA reference-organ assets, and OME-Zarr remain future release work.

Advance visualization from a pathway scene to linked scientific spaces.

### Scope

- Instanced cells, reaction-diffusion fields, vessels, compartments, and tissue geometry.
- HRA reference-organ geometry and ontology links.
- OME-Zarr imaging and multiresolution volume support.
- Shared time cursor across pathway, cell, tissue, organ, and chart views.
- Level-of-detail rendering and viewport-based data loading.
- Provenance selection from every visual object.
- Equivalent semantic and tabular workflows without 3D.

### Acceptance Gate

- A selected molecule, reaction, cell state, tissue region, and result remain linked across views.
- Visual scaling, interpolation, missing values, and uncertainty are explicit.
- Large scenes remain responsive through level of detail and GPU instancing.
- Mobile and non-WebGL workflows retain all scientific information.

## Goal 8: Reviewed Derived Knowledge Loop

Allow simulations and analyses to grow the database without corrupting source truth.

### Scope

- Content-addressed run bundles and analysis artifacts.
- Derived assertions labeled as predicted, fitted, estimated, or computed.
- Complete lineage from source releases through model and code to result.
- Scientific review queues with accept, reject, supersede, and invalidate actions.
- Recalculation when source data, transformations, or model versions change.
- Comparison between derived predictions and newly ingested measurements.

### Acceptance Gate

- Simulation output never overwrites source assertions.
- A reviewed derived result can be reproduced from its immutable inputs.
- Superseded and invalidated results remain auditable.
- New evidence automatically identifies affected derived results and models for review.

## Goal 9: Controlled Experiment Workspace

Turn the MVP page into a complete local research workbench.

### Scope

- Experiment creation, cloning, import, export, and comparison.
- Run queue, progress, cancellation, checkpoints, and artifact retention.
- Parameter sweeps, ensembles, sensitivity studies, and intervention schedules.
- Searchable run history with release, model, taxon, tissue, and status filters.
- Reproducible reports containing charts, provenance, warnings, and scientific boundaries.
- Local workstation resource profiles for CPU, GPU, memory, and storage budgets.

### Acceptance Gate

- An exported experiment reproduces its result under the declared numerical contract.
- Changed inputs always create a distinct run identity and visible comparison.
- Resource limits fail safely without corrupting completed work.
- The complete workflow remains usable without cloud services.

## Goal 10: Extensible Digital Physiology Platform

Grow from validated vertical models into a modular human/mouse physiology platform.

### Scope

- Liver, kidney, cardiovascular, respiratory, endocrine, immune, neural, and tumor modules.
- Explicit multirate coupling contracts and conserved exchange variables.
- Tissue and organ applicability domains.
- Certified external model plugins and conformance tests.
- Portable release and experiment bundles for independent reproduction.
- Public benchmark suites and coverage dashboards.

### Acceptance Gate

- Each component has independent scientific validation and declared failure domains.
- Coupling conserves declared quantities and passes timestep convergence studies.
- Integrated conclusions remain stable under reasonable numerical and model variation.
- The platform reports unknowns and unsupported extrapolations instead of claiming a universal digital twin.
