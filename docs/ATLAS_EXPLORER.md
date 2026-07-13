# Atlas Explorer

## Release Pin

The inference service consumes biochemical-db atlas release `contextual-mthfr-human-mouse-v2.0.0` at SHA-256 `79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f`.

This is independent from v1 simulation release `one-carbon-human-mouse-v1.0.0`. The service discovers and verifies `/api/v2/releases`, then verifies each immutable response envelope and the release manifest against the atlas pin. It does not accept the v1 catalog or digest as evidence that v2 is compatible.

## Contract Boundary

`server/knowledge/biochemical-db-atlas.js` owns strict upstream Zod schemas and adapters for:

- v2 catalog and release detail
- typed entities
- qualified claims
- evidence records
- identity mappings
- orthology transformations
- coverage partitions
- limitations
- bounded subgraph and network responses

Adapters preserve CURIEs and lineage while converting snake_case fields and canonical NCBI taxon CURIEs to the workbench's camelCase and numeric taxon contracts in `shared/atlas-contracts.js`. Unknown fields fail schema parsing rather than being discarded.

## Interpretation

Every displayed relationship is a qualified claim. The explorer labels its support from `derivation` (`direct`, `inferred`, or `orthology-transferred`) and `polarity` (`supporting` or `contradicting`). Evidence kind and source do not upgrade derivation. Mouse orthology-transferred claims retain their transformation ID, source claim, endpoint pairs, method, and limitations.

Mappings distinguish exact identity, related records, unresolved ambiguity, and replacement. Candidate identifiers are displayed when no target is selected. No identity is inferred from similar labels.

Coverage is denominator-based. `uncovered` rows and `gapIds` are rendered as measured curation gaps. They mean unknown within a declared target set, not biological absence. Lack of a contradictory claim likewise does not establish consensus.

## Traversal And Isolation

Traversal accepts an included CURIE or a unique entity label. The server restricts depth to `0..6` and nodes to `1..100`; the producer performs deterministic traversal. Human and mouse claims remain taxon-isolated, while taxon-neutral chemistry and context entities may appear in either projection. Unknown, ambiguous, and cross-species roots are reported without fallback substitution.

## Fixture Mode

`BIOCHEMICAL_INFERENCE_USE_FIXTURE=true` explicitly enables contract-shaped atlas data for tests and demonstrations. Production has no fallback to fixture data. Fixture responses retain the pinned release metadata but identify their source as `bundled-demonstration`.
