# Goal 12 Measured Commons

## Status

Goal 12 is delivered after final review against `biochemical-db` commit
`93d6c44b1d97c33ded0514569bfd8a197f106c9c`. The active consumer is the existing
Vue 3 / ES module application; the legacy Riot prototype remains untouched.

Producer release `measured-apap-observation-commons-v1.0.0` remains an immutable
scientific baseline. Follow-up v1.0.1 has byte-identical scientific record files
and adds signed transport/inclusion proofs only.

## Independent Pins

| Object | Identity |
| --- | --- |
| Consumer release | `measured-apap-observation-commons-v1.0.1` |
| Release digest | `6a1f81b41d89e52d666e38a26943955ed3fdb008adb7ae23bb2c353abc0cd496` |
| Manifest SHA-256 | `32b687616d8521f344d0fc0b20aa3415739262c5076a6a6802253baf9741b4d7` |
| Envelope SHA-256 | `f4fca212d1d4a73cb01f5978075b8f92e09bc482791b3d053ab90c87d2860df4` |
| Two-release catalog SHA-256 | `d9a68ad32700b592dd3bbbe98e54c514cfc03041a514e25b29a2fc64aaad3853` |
| Trust SHA-256 | `5ddd92b32724378a692a2e815935bc8ee1abd46be1ba2afaba26d55e5bbd8160` |
| v1.0.1 publication key | `goal12-measured-2026-rotation-1` / `wXpO3gYV4ASU2o5X_sfLF4ZMewvm80e1sXZo_tG2FRI` |
| v1.0.0 baseline digest | `96bb00dc5b7f718275f890ab43b085eb87015b8ab4af023af51a1a9916830572` |

Both publication keys are retired and accepted only for signed date
`2026-07-14`, inside their exact trust intervals. The consumer verifies the
complete two-key trust closure, both independently pinned catalog entries, and
the rotation-key catalog/release signatures.

## Signed Synchronization

`POST /api/v10/measured/sync` is the only public-data network operation. The
client accepts only an origin-form loopback HTTP producer, refuses redirects,
bounds time and bytes, requires exact canonical response ETags and release
headers, and probes release/query/schema/sort/limit-bound producer cursors.

The strict manifest schema requires v1.1.0, the exact transport-only
`semantic_diff`, exactly ten ordered `api_views`, and one exact
`selected_lineage_view`. The unsigned duplicate `candidates` traversal is not
used. After every complete traversal, the consumer reconstructs the producer's
exact RFC 8785 root object with endpoint, record type, complete null-inclusive
query, sort, count, and uniquely ordered items. It verifies each root against
the signed descriptor and independent v1.0.1 pins. It separately fetches the
exact signed 35 measurement IDs, reconstructs sorted
`{measurement_id,lineage}` items and the complete selected-lineage root, and
verifies count, IDs, selection, endpoint template, order, and root digest.

No records are published until all ten API roots, the selected-lineage root,
release, catalog, trust, envelope, signatures, page contracts, cursor probes,
counts, and non-heldout roles pass. The verified local record closure is:

- 687 development and 851 calibration measurements;
- 15 development and 73 calibration missingness records;
- three families, studies, partitions, exclusions, 25 applicability records,
  and six source records;
- 35 selected complete lineages, including the 34 calibration inputs;
- zero validation or external-heldout outcomes, uncertainties, values, IDs,
  summaries, or previews.

## Publication And Recovery

Canonical public response bytes are stored in a private CAS and normalized
records in SQLite under
`$HOME/.local/share/biochemical-inference/measured-commons-v2` by default.
Configured roots must be outside the source tree. Directories are mode `0700`;
SQLite and CAS files are mode `0600`.

Before any CAS promotion, a strict typed publication journal durably binds the
`sync` or `immutable-artifact` publication type, exact publication identity,
artifact kind when applicable, and uniquely sorted object digests. Startup and
serialized re-entry remove journal-owned orphan CAS objects when the matching
SQLite transaction did not commit, or accept the exact completed snapshot or
artifact index when it did, then clear and fsync the journal. Sync publication
and its post-publication integrity scan run under one storage lock. Every
awaited sync stage reasserts request ownership; a superseded request cannot
publish, set ready, or overwrite the current error state.

Integrity revalidates SQLite/foreign keys, all signed metadata and signed roots,
strict records, role closure, lineage digests, immutable artifact bytes, freeze
intent/request/receipt identities, artifact references, every CAS digest, and
the exact object inventory. It scans every persisted SQLite/CAS payload for the
six heldout measurement/uncertainty IDs and reported values. A failed
post-publication scan sets failed integrity before throwing and disables all
local data and calibration/freeze/disclosure reads.

## Calibration

The request contract is one exact sorted five-group tuple for C55801C ALT at
24 h in `partition:calibration:cebs-c55801c`; arbitrary subsets and reorderings
are rejected. The repository exposed to calibration is physically limited to
release, partition, applicability, exact calibration measurement/missingness,
exclusion, and access-report methods. It has no generic record, development,
validation, heldout, producer, or evaluation method.

Before deriving rationale, calibration verifies the exact partition
family/study/role/digest; all 34 signed IDs; family, study, group, role, context,
experimental unit, specimen, intervention, protocol, assay, observable, and
uncertainty identity; and one exact assay, protocol, reported/normalized unit,
time, and dose unit. Repository counters are populated by the actual bounded
queries, not caller declarations.

The deterministic calibration CAS digest is
`79c323d189d949cd50bedf5b9dd7f7b699b51be8d6692e8001085b338ec82c5f`.
Its result is `not-evaluable`, with null fit and no validation conclusion,
because the producer reports neither assay method nor specimen matrix.

## Artifact-Bound Freeze

The browser cannot provide commitment digests. It sends only a strict freeze
intent containing an existing calibration artifact digest, exact target
partition ID, nonce, and timestamp. The server reloads and rehashes the
immutable calibration CAS object, requires `not-evaluable`, null fit, and
`no-validation-conclusion`, and constructs four canonical immutable artifacts:

- parameter policy: no heldout parameter selection;
- endpoint mapping: renal GSH provenance inspection with no scoring mapping;
- metric/threshold policy: no metric, threshold, score, or validation conclusion;
- prediction: `not-evaluable`, explicit prediction count zero, and empty predictions.

Each artifact binds the calibration digest, release, and exact target partition,
is promoted to private CAS and the immutable SQLite artifact index, then is
read back and rehashed before the upstream commitment is constructed. The
calibration CAS digest is the model digest. The UI requires calibration first
and displays all resulting digests as read-only text.

The producer commitment receipt must equal SHA-256 of the RFC 8785 frozen
request and echo its timestamp and partition digest. Disclosure is constructed
from the persisted frozen request, never a browser-forwarded request. Its
receipt must bind the exact commitment, release, partition ID/digest/role,
family/study/observable membership, six unique pinned measurement records, and
matching uncertainty measurement IDs. Exact retries must return the same
receipt/response identity. SQLite persists only disclosure request/response
digests and time, never disclosed values or IDs. Concurrent exact freeze and
disclosure retries perform producer I/O outside the storage lock, then serialize
only immutable local comparison/insertion; uniqueness races reload and compare
canonical state instead of becoming internal errors.

Every protected producer response, including every non-200 status, must have
`Cache-Control: private, no-store`, no ETag, and the exact release header before
status handling. Error bodies are never read or exposed. Protected origin must
be one exact HTTP(S) origin, and its server-held CSRF token must be canonical
unpadded base64url from 43 to 128 characters.

## API

- `GET /api/v10/measured`
- `GET /api/v10/measured/status`
- `POST /api/v10/measured/sync`
- `GET /api/v10/measured/pages/:recordType`
- `GET /api/v10/measured/lineages/:measurementId`
- `GET /api/v10/measured/integrity`
- `GET/POST /api/v10/measured/calibrations`
- `GET /api/v10/measured/calibrations/:artifactDigest`
- `POST /api/v10/measured/commitments` with a freeze intent
- `POST /api/v10/measured/evaluation` with a commitment-digest disclosure intent

## Configuration

```sh
BIOCHEMICAL_MEASURED_URL=http://127.0.0.1:8000
BIOCHEMICAL_MEASURED_TIMEOUT_MS=10000
BIOCHEMICAL_MEASURED_ROOT=/absolute/path/outside/the/source/tree
BIOCHEMICAL_MEASURED_CURSOR_SECRET=<unpadded-base64url-for-32-random-bytes>
BIOCHEMICAL_MEASURED_ALLOWED_ORIGIN=http://127.0.0.1:5173
BIOCHEMICAL_MEASURED_CSRF_TOKEN=<canonical-unpadded-base64url-43-to-128-characters>
BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173
```

## Review Evidence

- Exact v1.0.1 public fixtures contain 64 canonical producer responses and no
  heldout outcome response.
- Adversarial tests cover valid-ETag value tampering, role relabeling, omission,
  duplication, reordering, selected-lineage tampering, receipt mismatches,
  exact-group rejection, actual zero forbidden access, all protected error
  classes, exhaustive persisted leakage scans, both publication crash points,
  post-publication corruption, and sync supersession at each major awaited stage.
- Full fixture Playwright passed 42 applicable tests with 14 intentional skips
  across Chromium desktop and 360 px mobile.
- `npm run check` passed syntax, 47 Vitest files / 245 tests, the browser build,
  and the server build.
- `npm audit` reported zero vulnerabilities.
- Full real-producer Playwright passed the same 42 applicable tests with 14
  intentional skips across Chromium desktop and 360 px mobile.

## Limitations

- Distribution signatures prove this release closure, not publisher authorship,
  scientific validity, completeness, or present upstream content.
- The CEBS export omits specimen matrix and assay method. No assay equivalence,
  cross-study transfer, causal interpretation, or clinical use is asserted.
- Disclosure is provenance inspection. It does not score the empty prediction
  artifact, validate a model, or implement a Goal 13 challenge-result contract.
- Dataflow isolation limits accidental consumer leakage; it is not secrecy, DRM,
  consumer authentication, or protection from a local repository holder.
- Node 22 labels `node:sqlite` experimental; the runtime remains pinned to Node 22.
