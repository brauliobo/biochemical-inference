# Biochemical Inference

A controlled, inspectable demonstration of one-carbon metabolism simulation, a standards-based ODE/SSA/FBA portfolio, parameter calibration and uncertainty, a bounded contextual MTHFR atlas, and license-aware literature evidence intelligence. The active application uses Vue 3, JavaScript (ES6), Vite, Pug, Fastify, and Three.js. It does not use or build the legacy Jekyll/Riot prototype.

This software is an educational systems model. Its initial conditions and kinetics are illustrative, not measured physiology, and its output is not clinical, diagnostic, or treatment guidance.

## Requirements

- Node.js 22
- npm 10 or newer
- Python 3.12 and `uv` for the sibling `../biochemical-db` service

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

### Identifier integrity

The pinned release follows the authoritative EMBL-EBI ChEBI identities: `CHEBI:57844` is L-methionine zwitterion and `CHEBI:58199` is L-homocysteine zwitterion. The inference adapter preserves these identifiers without rewriting upstream records.

Optional server settings are `PORT` (default `3000`), `HOST` (default `127.0.0.1`), and explicit comma-separated `CORS_ORIGINS`.

## Verification

```sh
npm run check
npm audit
E2E_USE_FIXTURE=true npm run test:e2e
npm run test:e2e
```

Playwright browsers must be installed once with `npx playwright install chromium` before running E2E tests. Real mode starts the sibling biochemical-db API on port 8000, the evidence API on port 8001, and the inference development servers. Evidence uses run-isolated index and candidate workspace paths below `/tmp`; real E2E exercises non-vector search and document retrieval and has no generation dependency. Fixture mode enables both explicit inference and evidence fixtures and exercises deterministic candidate extraction.

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

Every successful run includes the exact release digest, model and engine versions, normalized effective inputs, a deterministic SHA-256 identity, trajectories, summaries, warnings, and numerical diagnostics.

See `docs/ATLAS_EXPLORER.md` for atlas contract, interpretation, and failure boundaries.

See `docs/EVIDENCE_PANEL.md` for the evidence contract, ranking interpretation, license behavior, and candidate trust boundary.

See `docs/SIMULATION_PORTFOLIO.md` for algorithms, strict v2 contracts, units, worker limits, and the exact SBML L3/SED-ML/COMBINE supported profile.

See `docs/PARAMETER_STUDIES.md` for parameter selection, study algorithms, convergence diagnostics, held-out validation, and uncertainty boundaries.
