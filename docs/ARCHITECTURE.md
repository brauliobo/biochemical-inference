# Biochemical Inference MVP Architecture

## Repository Boundary

`biochemical-inference` owns models, controlled execution, run artifacts, comparisons, and visualization. It consumes immutable knowledge but does not mutate `biochemical-db` releases or promote predictions into source facts.

## Runtime Structure

```text
biochemical-db API
        | v1 simulation release         | v2 contextual atlas release
        v                               v
strict adapters + independent digest pins
        |
        v
controlled simulation API
        |
        v
deterministic model engine
        |
        v
run result + diagnostics
        |
        v
Vue/Pug workbench
  |       |       |
 chart   table   Three.js

evidence API :8001
        | evidence v3 release + mutable candidate workspace
        v
strict evidence adapter + independent release/digest pin
        |
        v
same-origin Fastify /api/v3/evidence proxy
        |
        v
EvidencePanel (exact/BM25/vector/RRF, licensed spans, review-only candidates)

declarative Goal 4 registry
        |
        v
validated JSON IPC -> bounded child process
        |
        +-- RK4 / Dormand-Prince 5(4)
        +-- seeded Gillespie direct SSA
        +-- two-phase simplex FBA
        |
        v
strict terminal result + PortfolioWorkbench

parameter API :8000
        | parameter-evidence-benchmark-v1.0.0 + digest pin
        v
strict parameter adapter + context/unit/taxon selection
        |
        v
immediate-terminal /api/v2/studies
        |
        +-- centered finite-difference + seeded Morris
        +-- bounded Nelder-Mead + Fisher identifiability
        +-- multi-chain random-walk Metropolis + held-out prediction
        +-- numerical/model-form robustness matrix
        |
        v
ParameterStudyWorkbench

APAP benchmark API :8000
        | apap-liver-benchmark-v1.0.0 + independent digest pin
        v
strict APAP producer contracts + same-origin /api/v4/apap proxy
        |
        v
explicit human/mouse context bindings -> one taxon-agnostic equation set
        |
        +-- gut / central / 12-bin portal-to-central APAP exposure
        +-- NAPQI / GSH / adduct / repair / oxygen / neighbor exchange
        +-- conservative healthy / stressed / injured / recovering states
        +-- NAC state coupled only to explicit GSH synthesis
        |
        v
canonical terminal run + APAPBenchmarkWorkbench

Spatial benchmark API :8000
        | apap-liver-spatial-benchmark-v1.0.0 + independent digest pin
        v
strict spatial contracts + bounded same-origin /api/v5/spatial proxy
        |
        +-- asset/content ID ownership + immutable single ranges
        +-- full-content SHA-256 + byte-cap verification
        +-- same-taxon transforms + explicit unavailable HRA mapping
        v
shared APAP time / field / lobule bin
        |
        +-- complete semantic and numeric workflow
        +-- lazy Three.js instancing with context-loss fallback
        v
SpatialTissueWorkbench
```

## Active Application

```text
src/                 Vue application
server/              Controlled API and simulation engine
shared/              Versioned request and response contracts
tests/                Unit, API, and browser automation
specs/e2e/            Product-level acceptance scenarios
```

The legacy Jekyll, Slim, Riot, and generated `docs/` application remains outside the active build until unrelated local modifications are resolved. The new build writes only to `dist/` and `server-dist/`.

The active application is plain JavaScript (ES6) on Node.js 22. Vite builds the browser application, while the server build reproducibly copies the ES modules in `server/` and `shared/` without a compilation step.

Goal 4 adds `shared/portfolio-contracts.js`, `server/portfolio/`, and `src/components/PortfolioWorkbench.vue`. Registry models are immutable declarative data. Numerical execution occurs only in bounded child processes; the parent validates input and output contracts and owns timeout, output-limit, cancellation, and lifecycle transitions. The archive boundary validates XML and ZIP safety before a model can reach execution.

Goal 5 adds `shared/parameter-contracts.js`, `server/parameters/`, `server/studies/`, and `src/components/ParameterStudyWorkbench.vue`. Parameter evidence is independently pinned and fail-closed. Studies are bounded synchronous benchmark analyses rather than Goal 9 background jobs; their immediate terminal records still distinguish successful and non-converged outcomes.

Goal 6 adds `shared/apap-contracts.js`, `server/apap/`, and `src/components/APAPBenchmarkWorkbench.vue`. APAP producer payloads and internal runs have separate strict contracts. Context binding occurs before a single equation evaluator with no taxon branches. Fixed-step RK4 fails on invalid intermediate state, and every terminal result includes mass, cell-state, and limiting-case diagnostics.

Goal 7 adds `shared/spatial-contracts.js`, `server/spatial/`, `src/spatial.js`, `SpatialTissueWorkbench`, and the lazy `TissueScene`. Spatial trust is independent of the APAP simulation release. Metadata and content are fail-closed at the server boundary; the browser receives only same-origin content IDs. The scene has no placement operation, and the explicit unavailable human HRA mapping cannot become a mouse target. WebGL is an optional projection over the same time, field, bin, values, provenance, and encoding policy exposed semantically.

## Service Contract

- `GET /api/v1/health`
- `GET /api/v1/releases`
- `GET /api/v1/releases/{release_id}/network?taxon_id=...`
- `GET /api/v1/models/one-carbon`
- `POST /api/v1/models/one-carbon/simulations`

The inference service proxies knowledge requests so the browser has one origin and every simulation can verify the same release used by the workbench. Atlas v2 has a separate catalog, release ID, digest, strict schemas, adapters, and endpoint envelope checks; it never inherits verification from the v1 release.

Atlas v2 adds read-only same-origin release detail, entity, claims, bounded subgraph, coverage, and taxon network routes. The network projection supplies mappings and limitations that are not present in the producer's subgraph response. Traversal bounds are validated at the Fastify boundary before upstream access.

Evidence is a third independent compatibility boundary. The server verifies `mthfr-evidence-v1.0.0` and digest `93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701` through evidence health before search, document, or candidate operations. Strict schemas cover release references, ranking components, documents, licenses, lifecycle, licensed sections, exact spans, PubTator annotations/relations, and unreviewed candidates. Browser code receives only same-origin proxy responses and never receives an Ollama endpoint or direct evidence-service access.

Parameter evidence is a fourth independent compatibility boundary. It verifies `parameter-evidence-benchmark-v1.0.0` and digest `6e72e6bebf3b18aa2edd95dae7e719799cb6916a3e58bb68e697347eebce7fa9` before every operation. Candidate and dataset response closures retain contexts, evidence, correlations, uncertainties, observations, and fixed partitions. Calibration and posterior likelihood receive only calibration IDs; held-out IDs enter only posterior predictive validation.

The evidence index is disposable derived state. Candidate storage is a separate mutable workspace. Neither is part of an immutable release, and the inference service has no route that promotes a candidate into atlas or trusted knowledge.

## Model Contract

The one-carbon model uses an explicit stoichiometric system:

```text
dx/dt = S * v(x, p) + boundary_fluxes
```

The model declares metabolites, reactions, units, initial conditions, bounded parameters, presets, numerical controls, and scientific limitations. Model assumptions are never written into the knowledge release.

## Run Identity

The canonical run identity is a SHA-256 digest of:

- Knowledge release identifier and digest.
- Model and engine versions.
- Taxon.
- Effective input parameters.
- Initial conditions.
- Numerical controls.

Display formatting, object key order, UI state, and locale must not change run identity.

## Visualization Contract

- The chart displays concentrations and fluxes with units.
- The 3D scene uses compounds as spheres and reactions as distinct nodes.
- Directed links represent reactant and product roles.
- Simulation values update node and edge encodings.
- Selection is synchronized with an accessible semantic list.
- Reduced motion disables decorative animation.
- WebGL failure leaves controls, tables, charts, provenance, and export usable.

## Failure Contract

The interface distinguishes loading, invalid, incompatible, running, successful, failed, and cancelled states. A failed request cannot reuse stale data. Changing a completed run configuration marks existing results as belonging to the previous specification until a new run succeeds.

The atlas independently distinguishes release loading, traversal loading, unavailable data, unknown or ambiguous seeds, bounded/truncated results, denominator gaps, and successful results. Unknown roots are never replaced with a default. Atlas compatibility failure does not disable a separately verified v1 simulation, and v1 readiness does not establish atlas compatibility.

Evidence independently distinguishes release verification, lexical search, requested vector search, document retrieval, and generation. A vector failure displays no substituted lexical result. A generation failure creates no candidate. Publication corrections, retractions, and deletions are warnings at the document boundary. Candidate output remains labeled `unreviewed, not trusted knowledge` in extraction results, detail, and the persistent workspace list.
