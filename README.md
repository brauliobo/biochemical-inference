# Biochemical Inference

A controlled, inspectable demonstration of one-carbon metabolism, standards-based ODE/SSA/FBA, a durable local experiment workspace, parameter inference, a bounded human/mouse APAP liver benchmark, a contextual MTHFR atlas, and license-aware literature evidence intelligence. The active application uses Vue 3, JavaScript (ES6), Vite, Pug, Fastify, Three.js, and Node 22 `node:sqlite`. It does not use or build the legacy Jekyll/Riot prototype.

This software is an educational systems model. Its initial conditions and kinetics are illustrative, not measured physiology, and its output is not clinical, diagnostic, or treatment guidance.

## Requirements

- Node.js 22
- npm 10 or newer
- Python 3.12 and `uv` for the sibling `../biochemical-db` service
- OpenSSL for runtime-only reviewed-derived Ed25519 keys

## Start

```sh
cd ../biochemical-db/service
uv sync --frozen
uv run uvicorn biochemical_db_api.app:app --host 127.0.0.1 --port 8000
BIOCHEMICAL_EVIDENCE_INDEX=/tmp/biochemical-evidence-index.sqlite3 \
BIOCHEMICAL_EVIDENCE_WORKSPACE=/tmp/biochemical-evidence-candidates.sqlite3 \
uv run uvicorn biochemical_db_api.evidence_app:app --host 127.0.0.1 --port 8001
```

In another shell, from this repository:

```sh
npm install
npm run dev
```

The workbench is served at `http://localhost:5173`; Vite proxies `/api` to the inference API at `http://localhost:3000`.

For production-like local operation:

```sh
npm run build
npm start
```

`npm start` serves the API and built client on `http://localhost:3000`.

## Knowledge source

By default, the service fails closed against the local biochemical-db API and pins its canonical release:

```sh
BIOCHEMICAL_DB_URL=http://127.0.0.1:8000
BIOCHEMICAL_DB_RELEASE_ID=one-carbon-human-mouse-v1.0.0
BIOCHEMICAL_DB_EXPECTED_DIGEST=b72d00c072551a6babd348cf88302788e9a7b547cca17f9fb834e7e0cddbeef1
```

The upstream must expose the biochemical-db 1.0 catalog, network, and provenance contracts. The client validates those responses with strict upstream Zod schemas, verifies the pinned release and digest across the catalog, endpoint envelope, and provenance closure, sends URL-encoded canonical taxon identifiers such as `NCBITaxon%3A9606`, and then adapts the responses into workbench contracts. An unsupported catalog or network schema, release mismatch, digest mismatch, or unavailable knowledge service disables simulation; there is no production fixture fallback.

Goal 9 also consumes the deterministic `/api/v1/releases/{release_id}/snapshots/network` route. It validates canonical RFC 8785 bytes, recomputes the snapshot digest, verifies response headers and the complete taxon/release/record closure, and stores the snapshot with each immutable experiment revision.

The contextual atlas is pinned and verified independently from the simulation release:

```sh
BIOCHEMICAL_DB_ATLAS_RELEASE_ID=contextual-mthfr-human-mouse-v2.0.0
BIOCHEMICAL_DB_ATLAS_EXPECTED_DIGEST=79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f
```

Atlas catalog, release detail, typed entities, qualified claims, evidence, identity mappings, orthology transformations, coverage, limitations, network, and bounded subgraph payloads have separate strict v2 upstream Zod schemas and adapters. Every atlas read verifies the v2 catalog pin and the endpoint release envelope without consulting the v1 simulation catalog. An atlas failure is visible in the explorer but does not relabel simulation knowledge or disable an independently verified v1 simulation.

The explorer traverses only the selected human or mouse taxon context with depth `0..6` and node limit `1..100`. Claim labels come from claim-level `derivation` and `polarity`; evidence records never turn an `orthology-transferred` claim into a direct claim. Coverage denominators show curated gaps as `Unknown / measured gap`, not biological absence. Unknown and cross-species roots are not substituted.

Build provenance is loaded through the inference service's same-origin proxy and shown in an expandable section. It includes recipe, source-lock, transformer, validator, and source-object digests, plus record types, source namespaces, and license identifiers. A provenance-only request failure is displayed explicitly and the UI states that reproducibility is not established; simulation remains available only when the release and network verification have succeeded.

The bundled v1 and atlas v2 fixtures are available only for tests or explicit demonstrations with `BIOCHEMICAL_INFERENCE_USE_FIXTURE=true`. The atlas fixture follows the real v2 response contracts and release identifiers while its source is visibly marked `bundled-demonstration`.

### Parameter evidence

The Goal 5 parameter client independently pins:

```sh
BIOCHEMICAL_PARAMETERS_URL=http://127.0.0.1:8000
BIOCHEMICAL_PARAMETERS_RELEASE_ID=parameter-evidence-benchmark-v1.0.0
BIOCHEMICAL_PARAMETERS_EXPECTED_DIGEST=6e72e6bebf3b18aa2edd95dae7e719799cb6916a3e58bb68e697347eebce7fa9
BIOCHEMICAL_PARAMETERS_TIMEOUT_MS=5000
```

Strict upstream and internal Zod schemas cover release references, contexts, point/interval/distribution candidates, evidence, correlations, uncertainty categories, datasets, observations, and fixed partitions. Candidate selection prefers exact context and canonical units, performs only dimension-compatible conversions, exposes all exclusions, and rejects taxon transfer without an explicit transform. The bundled parameter fixture is enabled by `BIOCHEMICAL_PARAMETERS_USE_FIXTURE=true` or the general inference fixture flag. See `docs/PARAMETER_STUDIES.md` for algorithms and scientific boundaries.

### Literature evidence

The independent Goal 3 evidence service is consumed server-to-server and pinned separately:

```sh
BIOCHEMICAL_EVIDENCE_URL=http://127.0.0.1:8001
BIOCHEMICAL_EVIDENCE_RELEASE_ID=mthfr-evidence-v1.0.0
BIOCHEMICAL_EVIDENCE_EXPECTED_DIGEST=93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701
BIOCHEMICAL_EVIDENCE_TIMEOUT_MS=10000
```

The browser never contacts port 8001. Fastify verifies `/healthz` before each evidence operation, validates strict search/document/candidate payloads, checks every available release reference, and exposes same-origin `/api/v3/evidence` routes. Cross-origin API access is denied unless `CORS_ORIGINS` explicitly allowlists an origin; no Ollama address, model service, or secret is sent to the browser.

Exact identifier and annotation matches, SQLite BM25, optional vector cosine ranking, and reciprocal-rank-fusion contributions remain separately visible. Vector retrieval is opt-in. If Ollama embedding fails, that vector request fails visibly and can be retried; the UI does not silently substitute lexical results. Exact/BM25 search does not depend on Ollama.

Document reads preserve content scope, license identifiers, source locators, local/source offsets, PubTator annotations and relations, and publication lifecycle. The inference proxy attaches the two license records fixed by the pinned release because the evidence document endpoint currently returns their IDs but not the license objects.

Candidate extraction sends only user-selected exact spans and an instruction. Every candidate remains visibly `unreviewed, not trusted knowledge`, records model and digest provenance, and stays in the evidence service's separate workspace. This application has no candidate promotion route. Use `BIOCHEMICAL_EVIDENCE_USE_FIXTURE=true` only for explicit tests; it enables deterministic candidate E2E without Ollama and is independent of `BIOCHEMICAL_INFERENCE_USE_FIXTURE`.

### APAP benchmark

Goal 6 independently pins `apap-liver-benchmark-v1.0.0` with digest `6de9844b2e8e4f3a15a0aba5455c69dc4116dc3287b7adb05e68ea337707f23b`. Optional settings are `BIOCHEMICAL_APAP_URL`, `BIOCHEMICAL_APAP_RELEASE_ID`, `BIOCHEMICAL_APAP_EXPECTED_DIGEST`, and `BIOCHEMICAL_APAP_TIMEOUT_MS`. Production has no fallback; `BIOCHEMICAL_APAP_USE_FIXTURE=true` is explicit test/demo behavior.

Strict producer and internal Zod contracts cover discovery, detail, contexts, parameters, protocols, observations, assumptions, limitations, validation matrix, requests, and terminal results. One taxon-agnostic fixed-step equation set receives explicit human or mouse parameter bindings and produces systemic time series, 12-bin lobule matrices, exact assumptions, unsupported synthetic comparisons, and mass/cell-state/limiting-case diagnostics. NAC affects only its state and the explicit GSH term. See `docs/APAP_BENCHMARK.md` for equations, baseline software results, and limitations.

### Spatial tissue benchmark

Goal 7 independently pins `apap-liver-spatial-benchmark-v1.0.0` with digest `fd838be6771c61b79eb97561320ffee8096f538e31ec769480c0a4979101290b`. Optional settings are `BIOCHEMICAL_SPATIAL_URL`, `BIOCHEMICAL_SPATIAL_RELEASE_ID`, `BIOCHEMICAL_SPATIAL_EXPECTED_DIGEST`, and `BIOCHEMICAL_SPATIAL_TIMEOUT_MS`. Production has no fallback; `BIOCHEMICAL_SPATIAL_USE_FIXTURE=true` is explicit test/demo behavior.

The same-origin `/api/v5/spatial` proxy validates strict metadata closures, content ownership, byte caps, immutable single ranges, release headers, and full-content SHA-256 digests. The APAP workbench links time, field, and portal-to-central bin across the complete numeric table, semantic inspector, and lazy Three.js instanced-cell view. Synthetic geometry and unavailable HRA status remain persistent; no mouse or pointer operation creates HRA placement. See `docs/SPATIAL_WORKBENCH.md`.

### Reviewed derived knowledge

Goal 8 uses the independent reviewed-derived service on `http://127.0.0.1:8002`. Configure `BIOCHEMICAL_DERIVED_URL`, `BIOCHEMICAL_DERIVED_WRITE_TOKEN`, and optional `BIOCHEMICAL_DERIVED_TIMEOUT_MS`. Generate the service key and token only at runtime; do not place either in this repository:

```sh
DERIVED_RUNTIME="$(mktemp -d)"
openssl genpkey -algorithm Ed25519 -out "$DERIVED_RUNTIME/events.pem"
export BIOCHEMICAL_DERIVED_DATABASE="$DERIVED_RUNTIME/derived.sqlite3"
export BIOCHEMICAL_DERIVED_OBJECT_ROOT="$DERIVED_RUNTIME/objects"
export BIOCHEMICAL_DERIVED_SIGNING_KEY="$DERIVED_RUNTIME/events.pem"
export BIOCHEMICAL_DERIVED_WRITE_TOKEN="$(openssl rand -hex 32)"
uv run biochemical-db-derived
```

Pass the same runtime `BIOCHEMICAL_DERIVED_WRITE_TOKEN` only to the inference server. The browser uses same-origin `/api/v6/derived` routes and never receives the bearer token, signing key material, or upstream service address. Completed APAP runs become three-object RFC 8785 content-addressed bundles with one explicitly synthetic prediction, complete lineage/context/applicability/qualitative uncertainty/limitations, and signed append-only review. Exact reproduction must match the complete canonical result artifact before verification can be appended. `BIOCHEMICAL_DERIVED_USE_FIXTURE=true` enables the explicit in-memory test/demo ledger. See `docs/DERIVED_KNOWLEDGE.md`.

### Identifier integrity

The pinned release follows the authoritative EMBL-EBI ChEBI identities: `CHEBI:57844` is L-methionine zwitterion and `CHEBI:58199` is L-homocysteine zwitterion. The inference adapter preserves these identifiers without rewriting upstream records.

### Controlled experiment workspace

Goal 9 stores metadata in SQLite WAL and artifacts in a staged, atomically published SHA-256 object store. Set `BIOCHEMICAL_WORKSPACE_ROOT` to a path outside the repository; it defaults to `$HOME/.local/share/biochemical-inference/workspace-v1`. `BIOCHEMICAL_WORKSPACE_CONCURRENCY` controls concurrent durable attempts. Resource profiles further bound portfolio worker concurrency, V8 heap, wall time, IPC output, GPU policy, and retained storage.

The v7 workspace distinguishes immutable revisions, scientific run identity, and attempt identity. Process recovery never claims engine continuation: interrupted work is terminalized and a new attempt is explicitly labeled `restart` and `from-specification` after all specification, model, engine, and snapshot digests are checked. Portable ZIP bundles include a manifest, content-addressed objects, and the verified knowledge snapshot; imports reject traversal, duplicates, digest mismatch, and expansion bombs. Imported runs execute offline and must meet their exported exact or tolerance contract. See `docs/EXPERIMENT_WORKSPACE.md`.

Optional server settings are `PORT` (default `3000`), `HOST` (default `127.0.0.1`), explicit comma-separated `CORS_ORIGINS`, and `BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN` when a trusted development reverse proxy gives the browser a different origin. The development script pins that value to `http://127.0.0.1:5173`; production same-origin serving needs no override.

## Verification

```sh
npm run check
npm audit
E2E_USE_FIXTURE=true npm run test:e2e
npm run test:e2e
```

Playwright browsers must be installed once with `npx playwright install chromium` before running E2E tests. Real mode starts the sibling biochemical-db API on port 8000, the evidence API on port 8001, and the inference development servers. Evidence and Goal 9 use run-isolated sibling runtime paths outside the source tree; real E2E exercises the canonical network snapshot, non-vector search, and document retrieval and has no generation dependency. Fixture mode enables explicit inference, evidence, and deterministic workspace fixtures.

## API

- `GET /api/v1/health`
- `GET /api/v1/releases`
- `GET /api/v1/releases/:releaseId/provenance`
- `GET /api/v1/releases/:releaseId/network?taxon_id=9606`
- `GET /api/v1/models/one-carbon`
- `POST /api/v1/models/one-carbon/simulations`
- `GET /api/v2/releases`
- `GET /api/v2/releases/:releaseId`
- `GET /api/v2/releases/:releaseId/entities/:entityId?taxon_id=9606`
- `GET /api/v2/releases/:releaseId/claims?taxon_id=9606`
- `GET /api/v2/releases/:releaseId/subgraph?root_id=HGNC%3A7436&taxon_id=9606&max_depth=4&max_nodes=50`
- `GET /api/v2/releases/:releaseId/coverage?taxon_id=9606`
- `GET /api/v2/releases/:releaseId/network?taxon_id=9606`
- `GET /api/v2/models`
- `GET /api/v2/models/:modelId`
- `POST /api/v2/model-archives/export`
- `POST /api/v2/model-archives/validate`
- `POST /api/v2/runs`
- `GET /api/v2/runs/:runId`
- `DELETE /api/v2/runs/:runId`
- `GET /api/v2/parameter-options?parameter_id=PARAMETER%3ADECAY-K&target_context_id=CONTEXT%3ASYNTHETIC-DECAY`
- `POST /api/v2/studies`
- `GET /api/v2/studies/:studyId`
- `GET /api/v3/evidence/health`
- `POST /api/v3/evidence/search`
- `GET /api/v3/evidence/documents/:identifier`
- `POST /api/v3/evidence/candidates/extract`
- `GET /api/v3/evidence/candidates`
- `GET /api/v3/evidence/candidates/:candidateId`
- `GET /api/v4/apap`
- `GET /api/v4/apap/releases`
- `GET /api/v4/apap/releases/:releaseId`
- `GET /api/v4/apap/releases/:releaseId/{contexts|parameters|protocols|observations|assumptions|limitations|validation-matrix}`
- `POST /api/v4/apap/runs`
- `GET /api/v4/apap/runs/:runId`
- `GET /api/v5/spatial`
- `GET /api/v5/spatial/releases`
- `GET /api/v5/spatial/releases/:releaseId`
- `GET /api/v5/spatial/releases/:releaseId/{structures|spaces|transforms|assets|descriptors|mappings|inventory}`
- `GET /api/v5/spatial/releases/:releaseId/assets/:assetId/content/:contentId`
- `GET /api/v6/derived/health`
- `POST /api/v6/derived/apap-runs/:runId/bundles`
- `GET /api/v6/derived/bundles/:bundleDigest`
- `GET /api/v6/derived/assertions`
- `GET /api/v6/derived/assertions/:assertionDigest`
- `GET /api/v6/derived/assertions/:assertionDigest/events`
- `POST /api/v6/derived/assertions/:assertionDigest/events`
- `POST /api/v6/derived/assertions/:assertionDigest/reproduce`
- `GET /api/v6/derived/reviewed-assertions`
- `GET /api/v6/derived/source-records`
- `POST /api/v6/derived/query`
- `POST /api/v6/derived/impact`
- `POST /api/v6/derived/measurements/compare`
- `GET/POST /api/v7/workspace/resource-profiles`
- `GET/POST /api/v7/workspace/experiments`
- `GET /api/v7/workspace/experiments/:experimentId`
- `POST /api/v7/workspace/experiments/:experimentId/revisions`
- `POST /api/v7/workspace/experiments/:experimentId/clone`
- `GET /api/v7/workspace/experiments/:experimentId/export`
- `POST /api/v7/workspace/experiments/import`
- `GET/POST /api/v7/workspace/runs`
- `GET /api/v7/workspace/runs/:attemptId`
- `GET /api/v7/workspace/runs/:attemptId/{events|checkpoints|artifacts}`
- `POST /api/v7/workspace/runs/:attemptId/cancel`
- `POST /api/v7/workspace/checkpoints/:checkpointId/restart`
- `GET /api/v7/workspace/artifacts/:artifactId`
- `GET/POST /api/v7/workspace/comparisons`
- `GET/POST /api/v7/workspace/reports`

Every successful run includes the exact release digest, model and engine versions, normalized effective inputs, a deterministic SHA-256 identity, trajectories, summaries, warnings, and numerical diagnostics.

See `docs/ATLAS_EXPLORER.md` for atlas contract, interpretation, and failure boundaries.

See `docs/EVIDENCE_PANEL.md` for the evidence contract, ranking interpretation, license behavior, and candidate trust boundary.

See `docs/SIMULATION_PORTFOLIO.md` for algorithms, strict v2 contracts, units, worker limits, and the exact SBML L3/SED-ML/COMBINE supported profile.

See `docs/PARAMETER_STUDIES.md` for parameter selection, study algorithms, convergence diagnostics, held-out validation, and uncertainty boundaries.

See `docs/APAP_BENCHMARK.md` for APAP equations, context parameter bindings, deterministic results, diagnostics, and unsupported scientific boundaries.

See `docs/SPATIAL_WORKBENCH.md` for spatial release integrity, range proxy behavior, linked selections, visual encoding, fallback behavior, and HRA limitations.

See `docs/DERIVED_KNOWLEDGE.md` for canonical bundle identity, APAP assertion lineage, review transitions, reproduction, layer separation, security, and limitations.

See `docs/EXPERIMENT_WORKSPACE.md` for durable identity, queue recovery, resource profiles, specification checkpoints, portable bundle safety, offline rerun verification, report CSP, and limitations.
