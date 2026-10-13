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

integrated biochemical-db JS/PGlite API :8000
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

biochemical-db deterministic network snapshot
        | strict schema + RFC 8785 digest verification
        v
Goal 9 workspace root outside source
        |
        +-- SQLite WAL metadata + immutable revision/event/checkpoint triggers
        +-- staged/fsynced SHA-256 object store
        +-- durable queue -> existing bounded portfolio child workers
        +-- specification-only restart recovery
        +-- safe portable ZIP import/export + offline rerun contract
        +-- static HTML/JSON/CSV/SVG reports with no network
        v
ExperimentWorkspace + /api/v7/workspace

physiology evidence API :8000
        | physiology-plugin-evidence-v1.0.0 + independent digest pin
        v
strict evidence closure + same-origin /api/v8/physiology proxy
        |
        +-- Ed25519 trust store + strict canonical .bpp ZIP validation
        +-- immutable SHA-256 package objects + SQLite metadata
        +-- exact semantic/unit/shape/taxon port matching
        v
deterministic multirate coupler
        |
        +-- integrated source loss / target gain + residual
        +-- explicit cadence / zero-order hold interpolation
        +-- 1x / 2x / 4x timestep refinement
        +-- Bubblewrap-gated process protocol (default refused)
        v
PhysiologyPluginWorkbench + persistent synthetic/non-clinical boundary

factory API :8000 (loopback only during explicit sync)
        | signed catalog/trust/envelope + exact manifest/partitions/pages/diff
        v
strict Goal 11 contracts + RFC 8785 + Ed25519 trust policy + independent pins
        |
        +-- exact producer cursor traversal equals partition records
        +-- source/license/adapter/accession closure
        +-- reaction/taxon/protein/reference/catalysis scientific closure
        v
staged SHA-256 objects -> one SQLite WAL publication transaction
        |
        +-- immutable generation/partition/record triggers
        +-- restart integrity scan
        +-- deployment-HMAC local cursors
        +-- no upstream code path for reads
        v
DataPlaneWorkbench + /api/v9/data-plane
```

## Active Application

```text
src/                 Vue application
server/              Controlled API and simulation engine
shared/              Versioned request and response contracts
tests/                Unit, API, and browser automation
specs/e2e/            Product-level acceptance scenarios
```

### Module Map

```text
src/api.js              public entry of the browser API client (re-exports every client function)
src/api/core.js         HTTP core: ApiError, requestJson, CSRF headers, strict cache-policy clients, paging
src/api/chunks.js       browser SHA-256 + gzip verification of immutable chunks
src/api/<domain>.js     one module per API generation (simulation, portfolio, apap, spatial, atlas,
                        evidence, derived, workspace, physiology, data-plane, measured,
                        measured-spatial, spatial-registration, challenge, revalidation)
server/app.js           buildApp(): constructs services, then registers hooks, error handler and routes
server/routes/*.js      one registerXRoutes(app, context) per domain; static client is registered last
server/http/*.js        problem replies, table-driven error handler, cache-header hooks, route/param helpers
server/commons/*.js     shared server primitives, see below
server/<domain>/        client (loopback producer), verification (digest/signature pins), service, database
shared/*-contracts.js   versioned wire contracts (also bundled by the browser)
shared/commons/         zod primitives shared by the contracts (digests, instants, identifiers, paging)
shared/canonical-json.js  RFC 8785 serialisation and digests
scripts/                operations CLI, supply-chain and deployment tooling, find-unused.js, vite-static-edition.js
```

`server/commons/` holds the code that every producer-backed domain used to repeat:

- `digest.js`: `sha256Hex`, `sha256Prefixed`, `canonicalSha256Hex`, `compareUtf8`.
- `verification.js`: strict base64url, bounded canonical-JSON parsing against a schema, Ed25519 signature checks. Each domain keeps its own error class, messages and pins and passes them in.
- `errors.js`: `defineRequestError` (code, message, status) and `defineProblemError` (message, options) class factories.
- `storage.js`, `paths.js`: storage-root selection outside the source tree (plain or symlink-refusing 0700 mode, ephemeral test roots).
- `sqlite.js`: WAL pragmas, `transaction`, plain and owner-only (`O_NOFOLLOW`, schema-version checked) database openers.
- `cursor.js`: HMAC-signed canonical pagination cursors and 32-byte secrets.
- `upstream.js`: timeout signal, Content-Length-bounded body reads, loopback origin validation.
- `clock.js`: ISO timestamps.

Digest-sensitive code is shared only where the bytes are provably identical. `server/simulation.js` (run identity) and `server/spatial/client.js` keep their own serialisers because their pinned digests depend on them. `server/challenge/model.js` hashes the source bytes of the files listed in `SOFTWARE_SOURCE_PATHS` (the challenge `software` artifact), so those files are changed only together with a deliberate artifact rotation: `server/challenge/*.js`, `server/apap/model.js`, `server/data-plane/object-store.js`, `server/data-plane/safe-path.js`, `server/portfolio/identity.js`, `shared/apap-contracts.js`, `shared/canonical-json.js` and `shared/challenge-contracts.js`.

The legacy Jekyll, Slim, Riot, and generated `docs/` application remains outside the active build until unrelated local modifications are resolved. The new build writes only to `dist/` and `server-dist/`.

The active application is plain JavaScript (ES6) on Node.js 22. Vite builds the browser application, while the server build reproducibly copies the ES modules in `server/` and `shared/` without a compilation step. The workbenches are lazy chunks and only they import `src/api`, so knowledge pages never load the API client or its validation schemas. The static edition (`npm run build:static`, `VITE_STATIC_MODE=true`) additionally rewrites the API workbench imports in `src/workbenches.js` (`scripts/vite-static-edition.js`), so none of that code is emitted into `dist-static/`.

Goal 4 adds `shared/portfolio-contracts.js`, `server/portfolio/`, and `src/components/PortfolioWorkbench.vue`. Registry models are immutable declarative data. Numerical execution occurs only in bounded child processes; the parent validates input and output contracts and owns timeout, output-limit, cancellation, and lifecycle transitions. The archive boundary validates XML and ZIP safety before a model can reach execution.

Goal 5 adds `shared/parameter-contracts.js`, `server/parameters/`, `server/studies/`, and `src/components/ParameterStudyWorkbench.vue`. Parameter evidence is independently pinned and fail-closed. Studies are bounded synchronous benchmark analyses rather than Goal 9 background jobs; their immediate terminal records still distinguish successful and non-converged outcomes.

Goal 6 adds `shared/apap-contracts.js`, `server/apap/`, and `src/components/APAPBenchmarkWorkbench.vue`. APAP producer payloads and internal runs have separate strict contracts. Context binding occurs before a single equation evaluator with no taxon branches. Fixed-step RK4 fails on invalid intermediate state, and every terminal result includes mass, cell-state, and limiting-case diagnostics.

Goal 7 adds `shared/spatial-contracts.js`, `server/spatial/`, `src/spatial.js`, `SpatialTissueWorkbench`, and the lazy `TissueScene`. Spatial trust is independent of the APAP simulation release. Metadata and content are fail-closed at the server boundary; the browser receives only same-origin content IDs. The scene has no placement operation, and the explicit unavailable human HRA mapping cannot become a mouse target. WebGL is an optional projection over the same time, field, bin, values, provenance, and encoding policy exposed semantically.

Goal 9 adds `shared/workspace-contracts.js`, `shared/snapshot-contracts.js`, `server/workspace/`, and `src/components/ExperimentWorkspace.vue`. Metadata is SQLite WAL with foreign keys; specifications, snapshots, results, bundles, and reports are content-addressed objects under `BIOCHEMICAL_WORKSPACE_ROOT`. Scientific run identity is independent of attempt identity. Restart recovery creates a new attempt from a digest-verified specification checkpoint because current engines expose no serializable mid-state. Portable imports validate every ZIP name, size, ratio, and digest before publication and can rerun from the embedded verified snapshot without an upstream service.

Goal 10 adds `shared/physiology-contracts.js`, `server/physiology/`, and `src/components/PhysiologyPluginWorkbench.vue`. The upstream release remains evidence-only. Inference-owned `.bpp` bytes are signed, strictly validated, content-addressed, and immutable; local trust revocation dynamically invalidates certification and execution without deleting audit bytes. Package evidence digests and package-content digests remain separate. Couplings require exact ports, semantics, dimensions, units, scalar shapes, taxon applicability, and complete circulation/liver/kidney closure. Protocol conformance, mass conservation, and timestep convergence are reported separately from scientific validation, which remains unsupported.

Goal 11 adds `shared/data-plane-contracts.js`, `server/data-plane/`, and `src/components/DataPlaneWorkbench.vue`. The explicit sync path is the only loopback producer client. It independently verifies the rotated trust store, signed two-release catalog, exact partitions, producer cursor pages, scientific links, and attributed baseline-to-candidate difference before one transaction publishes both generations, one active candidate pointer, and one separate diff pair. The private CAS and SQLite paths reject symlink ancestors and use no-follow descriptors where Node exposes them. Startup checks SQLite and foreign-key integrity, exact row/file closure, canonical record bytes, denormalized columns, signatures, and the cross-release diff. Immutable authority-closure audit reports are generated from verified local records only. Local HMAC cursors bind every query dimension, and v9 reads have no upstream fallback. See `docs/DATA_PLANE.md`.

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
