# Reviewed Derived Knowledge Workbench

## Boundary

Goal 8 submits completed APAP algorithm runs to the integrated biochemical-db JavaScript reviewed-derived v1 routes on `127.0.0.1:8000`. State is persisted in PGlite with a separate filesystem CAS. Simulation results never modify a source release. Submitted scientific content is immutable and content-addressed; review is represented only by signed append-only events.

The browser contacts same-origin `/api/v6/derived` routes. The Fastify server is the only holder of `BIOCHEMICAL_DERIVED_WRITE_TOKEN` and the only process that contacts the upstream service. The proxy removes the signing public key and key identifier from health responses and never returns bearer credentials or private key material. Event records retain their public event digest, key identifier, chain link, and signature for audit display.

Browser mutation routes require both an exact configured or directly served scheme-and-host `Origin` match and `x-biochemical-csrf: derived-review-v1`. `BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN` declares the browser-facing origin only when a trusted development reverse proxy changes the Fastify request host. This public custom-header value is not an authentication secret; its purpose is to prevent form-based CSRF while Origin enforcement rejects cross-site requests. The upstream bearer token independently authorizes writes.

## APAP Bundle

One successful terminal APAP run produces exactly three referenced canonical JSON objects:

- The taxon-agnostic equation/model object, including equations, equation-set digest, model and engine versions, 12-bin declaration, and NAC term boundary.
- A protocol artifact containing the exact normalized APAP run specification and pinned source protocol.
- A result artifact containing the complete successful APAP result.

The bundle contains one explicitly synthetic `predicted` scalar assertion for peak modeled injured-hepatocyte fraction. It carries:

- The APAP source release, model object, protocol artifact, and result artifact dependencies.
- Exact human or mouse taxon, liver, hepatocyte, sex, strain, route, dose, time, fasting, assay, spatial-region, and model-scope fields, with unavailable values explicitly `null`.
- Bounded dose, time, and mechanism-scale applicability plus explicit exclusions.
- Qualitative biological, measurement, structural, contextual, and numerical uncertainty.
- Upstream and inference limitations, including unsupported biological and clinical interpretation.

`shared/canonical-json.js` implements the accepted RFC 8785/I-JSON domain with ECMAScript number serialization, UTF-16 key ordering, unpaired-surrogate rejection, finite numbers, safe integers, and SHA-256 identities. Object, assertion, and bundle digests are recalculated locally before every submission. Cross-language tests use the same fixture as biochemical-db.

## Reproduction And Review

New assertions are `pending`. The workbench exposes only transitions valid for the current state:

- `pending` to `accepted` or `rejected`.
- `accepted` to `superseded` or `invalidated`, plus `recalculation-requested`.
- `reproduction-verified` is available only for an accepted producer-verified assertion.

Reproduction retrieves the original in-memory APAP run, reruns its exact normalized specification, reconstructs the complete result artifact, and compares RFC 8785 canonical JSON and its digest. A mismatch returns a conflict and appends no event. A match requests the signed `reproduction-verified` event using the assertion's declared result artifact digest. Rejected, superseded, and invalidated states remain terminal and auditable.

The layered query has no implicit source/derived merge. The UI asks explicitly for the exact APAP protocol source record and `reviewed-derived` predictions. Pending, rejected, superseded, and invalidated assertions remain in the review queue but never appear in the reviewed-derived layer. Impact and measurement-comparison reads never invalidate assertions automatically.

## Configuration

```sh
BIOCHEMICAL_DB_URL=http://127.0.0.1:8000
BIOCHEMICAL_DERIVED_WRITE_TOKEN='runtime-secret'
BIOCHEMICAL_DERIVED_TIMEOUT_MS=5000
```

The derived health path defaults to `/api/derived/v1/healthz`. `BIOCHEMICAL_DERIVED_URL` and `BIOCHEMICAL_DERIVED_HEALTH_PATH` remain explicit domain overrides.

`BIOCHEMICAL_DERIVED_USE_FIXTURE=true` enables the explicit in-memory fixture ledger. The general `BIOCHEMICAL_INFERENCE_USE_FIXTURE=true` also enables it. Production has no fixture fallback.

Real Playwright mode creates a run-isolated database, object root, Ed25519 private key, and random bearer token below `/tmp`. No private key or fixed token is committed. Fixture Playwright mode uses the deterministic in-memory ledger and visibly synthetic APAP records.

## Limitations

- APAP and derived run records are process-local on the inference side; after an inference server restart an existing ledger assertion remains readable, but exact rerun requires recreating its APAP run in the current process.
- The assertion is one deterministic synthetic scalar, not measured evidence or biological validation.
- Qualitative uncertainty identifies unsupported categories but is not a confidence interval, posterior, or error model.
- V1 review authentication uses the derived service's single shared bearer token and signing key; multi-user authorization and key rotation belong to the producer service roadmap.
- Impact requests require explicit previous dependencies and current digests. The inference application does not discover source updates automatically.
- Measurement comparison requires a verified parameter-observation source record with exact value, unit, and context pins. The current synthetic parameter release has no eligible observation, so the UI reports that limitation explicitly and never substitutes an APAP protocol record. Requests contain `measurement.record`, `value`, `unit`, and `context`; successful responses return the verified `measurement` plus trust metadata. The retained wire contract has no `uncertainty` request field or `measurement_record` response alias.
