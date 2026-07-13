# Evidence Panel

## Pinned Boundary

The workbench consumes the separate evidence service at `http://127.0.0.1:8001` through Fastify only. It pins:

- Release: `mthfr-evidence-v1.0.0`
- Schema: `3.0.0`
- SHA-256: `93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701`
- Evidence API contract: `1.0.0`

`server/evidence/client.js` verifies health before every evidence read or candidate operation. A release or digest mismatch fails closed. The browser uses only `/api/v3/evidence`; direct browser CORS to the producer is neither required nor configured by this repository.

## Retrieval

Non-vector search always remains available and combines exact identifiers or aliases, exact PubTator normalized IDs or annotation text, and SQLite BM25. Optional vector search adds a local Ollama cosine ranking channel. Reciprocal-rank fusion uses `k=60` and exposes each participating rank and contribution.

The UI shows:

- Exact, annotation, BM25, vector, and RRF meanings.
- Raw BM25 or cosine values where applicable.
- Per-channel ranks and RRF contribution.
- Total RRF score and final order.

Vector search is explicit. A failed vector request is not retried as lexical search and does not display stale lexical results. Users may retry the vector request or turn vectors off and submit a separate exact/BM25 request.

## Document Evidence

Document detail preserves canonical and alias identifiers, publication status and lifecycle, content scope, section access, source locator, local and source offsets, exact spans, PubTator annotations, and PubTator relations. Metadata-only text stays withheld. The two license definitions are fixed to the pinned release in the proxy because evidence API 1.0 document responses expose license IDs but not the corresponding records.

Lifecycle status is not a confidence score. Corrected, retracted, or deleted records receive a prominent warning; their retained records remain inspectable for audit.

## Candidate Trust Boundary

Candidate extraction requires one to twenty unique exact spans from the selected document. Only those span texts and the user instruction are sent by the evidence service to its configured generation model.

Every candidate records status `unreviewed`, model name and digest, prompt/input/output digests, document and span IDs, unresolved entities, and missing context. The panel repeats `Unreviewed, not trusted knowledge` in the extraction notice, candidate detail, and workspace list. Candidate APIs use mutable workspace storage outside the evidence release. There is no inference route to accept or promote a candidate.

If Ollama generation is unavailable or returns incompatible output, extraction fails visibly and no candidate is created. Fixture E2E uses `BIOCHEMICAL_EVIDENCE_USE_FIXTURE=true`; real E2E intentionally does not depend on generation.

## Accessibility

Search and extraction are native forms and support Enter submission. Results and persisted candidates are buttons, spans use labeled checkboxes, loading and failure changes use live regions or alerts, and all information remains textual without relying on color or graphics. At narrow widths, search controls, ranking cards, document headings, and annotation columns collapse to one column without changing semantics.
