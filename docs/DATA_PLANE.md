# Goal 11 Local Data Plane

## Status

Goal 11 is delivered against the exact current `biochemical-db` factory catalog.
The complete check, dependency audit, fixture browser, and real-producer browser
gates pass. The implementation does not carry forward the obsolete
single-release local schema.

## Independent Pins

| Object | SHA-256 or identity |
| --- | --- |
| Baseline release | `one-carbon-authority-human-mouse-v2.0.0` / `310bd8a04320c9b1bd9d4e18795bd998627265ac11b1c0e2b07a0473ba48f8e0` |
| Candidate release | `one-carbon-authority-human-mouse-v2.0.1` / `9dad9f1ac92ff2c53810867414c7729a1ee97425213b9749482ebe2fd37874b5` |
| Signed catalog bytes | `a1569da9b2193d4bbfc09349fa24acbf72d03fde04af06e1b0a95eb55fdc25dc` |
| Trust bytes | `d9ada7b62b31e6ff07d3363c5b756bbc979b5600aa44add50c9ffa089ee862f7` |
| Baseline manifest / envelope | `33f1830a8138bd47993d3732b6a7bda84c78ee1cc3abc4811cdcbf6902ebe5db` / `c81bdaead61d13dc80afeb21abb029fe34cb4775451f513370dcf7a971bf4c75` |
| Candidate manifest / envelope | `bb54c85f1a87ff4fe8414ead85001d566329b4adb2a8aa7edf76495296cace0d` / `ea9dbeb9ae620a0899fa29a15368ec969bf499dfb618e479d019f7d4cdcd0641` |
| Semantic diff identity / response bytes | `080b92aa65472f1df25d6b2b573ea6b332786b22c3601ddbd081bf1e76d4b3a5` / `5e8e9cf854e1c38bf7b25651c83236d6b281c07ad76bc621a8e5c8fde00df86b` |
| Historical signer | `goal11-release-2026` / `yWbisY7eaKIvpoUkoLb28XGGpimerBSmmsAutm9kSvM` / retired |
| Active signer | `goal11-release-2026-rotation-1` / `IQyu5Evu5OzUFJXuUU5qq27H7pwiUfLHKKi6YQn0reE` / active |

The committed fixture tree is byte-identical to the sibling producer's public
catalog, trust store, two release directories, and exact semantic-diff fixture.
It contains no source authority object or private signing key.

## Synchronization

`POST /api/v9/data-plane/sync` is the only operation that constructs a factory
client. The client accepts only origin-form loopback HTTP, refuses redirects,
and enforces status, content type, declared length, bounded streaming, ETag,
content digest, release digest, and record-type headers.

Before publication it verifies:

1. Canonical discovery, the pinned trust store, the active-signed catalog, both
   release envelopes, both manifests, every partition, and the exact
   baseline-to-candidate diff.
2. Historical baseline verification under the retired key and candidate
   verification under the active rotated key, including signed-time validity,
   canonical raw Ed25519 key encoding, unique key IDs, and no public-key aliases.
3. RFC 8785 release identity, schema, counts, source object digest and bytes,
   adapter implementation and package, public redistribution license,
   attribution, and NLM courtesy closure.
4. Bounded canonical NDJSON framing, exact partition bytes/digests/counts and ID
   bounds, contiguous part numbers, strict record schemas, and exact equality
   with every producer cursor page.
5. Producer cursor binding across release, record type, limit, and a changed
   compatible filter.
6. Supported taxa, protein accession/taxon binding, reaction compound closure,
   formula and charge balance, evidence class/code, references, and exactly one
   catalysis assertion for each taxon/reaction pair.
7. The independently expected one-record citation change and its adapter
   attribution, while preserving scientific, provenance, rights, and packaging
   classes separately.

Verified object bytes are staged in a private content-addressed store. One
SQLite transaction publishes both immutable generation snapshots, one active
candidate pointer, and one immutable diff row keyed by the baseline/candidate
generation pair. A diff is never copied onto either generation. Failed metadata
publication removes newly staged unindexed objects.

Concurrent syncs have generation ownership. Every asynchronous boundary checks
ownership, stale requests are aborted, publication and integrity scans are
serialized, and an older request cannot overwrite lifecycle state after a newer
request begins.

## Storage Integrity

The default root is
`$HOME/.local/share/biochemical-inference/data-plane-v2`; configured roots must
be outside the source tree. Root, object, prefix, and staging directories are
mode `0700`; SQLite and CAS files are mode `0600`.

Root ancestors, the root, SQLite files, object roots, staging, CAS prefixes, and
object destinations are checked with `lstat`. Regular files and directories use
`O_NOFOLLOW` descriptors where Node supports it. A newly linked object is read,
hashed, sized, and classified through its destination descriptor before it is
accepted. Startup cleans only recognized regular UUID `.tmp` staging files and
rejects unknown, linked, or special staging entries.

Every startup and explicit integrity scan runs `PRAGMA integrity_check` and
`PRAGMA foreign_key_check`, then validates:

- exactly zero rows/files for an empty store or exactly the two pinned
  generations, one candidate active pointer, and one pinned diff pair;
- allowed record types and exact generation, partition, record, audit, and
  object row closure;
- every partition metadata field against its manifest;
- every canonical encoded record and its denormalized `id`, `taxon_id`,
  `reaction_id`, and `protein_id` columns;
- both signed release snapshots and the cross-release semantic diff;
- every immutable audit identity and encoded report;
- exact equality between indexed object digests and regular CAS files, rejecting
  missing, extra, and unindexed files.

Scans return an isolated result. Only the owning sync applies sync lifecycle
changes, and failed integrity blocks every release read.

## Authority Closure Audit

`POST /api/v9/data-plane/audits` accepts the exact pinned baseline and candidate
IDs. It reads only verified local objects and records, recomputes scientific
closure, constructs canonical report bytes, and stores them in an immutable
SQLite audit table. The report digest excludes only its own `reportDigest`
field, so repeated execution is idempotent and returns the original report row.

The `authority-closure-audit-v1.0.0` report pins candidate and baseline release
identity, schema, signer and signed time, catalog, trust, envelope, manifest,
every partition digest/count/bytes/bounds, every source-object digest/bytes,
adapter implementation/package, license, full semantic diff, and class counts.
Results report record totals, reaction balance, taxon/catalysis coverage, and
reference closure. `scientificValidation` is always `unsupported`: distribution
integrity and deterministic authority closure are not biological validation.

`GET /api/v9/data-plane/audits` and
`GET /api/v9/data-plane/audits/:reportDigest` are fully offline.

## Origin Policy

`BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN` and comma-separated `CORS_ORIGINS` must be
exact HTTP(S) origins. They are validated once at startup into one fixed set.
Derived, physiology, and data-plane mutations fail closed when `Origin` is
absent or unlisted, regardless of `Host`, and retain their family-specific CSRF
headers. Data-plane sync and audit mutations require
`X-Data-Plane-CSRF: data-plane-v1`.

## API

- `GET /api/v9/data-plane`
- `GET /api/v9/data-plane/status`
- `POST /api/v9/data-plane/sync`
- `GET /api/v9/data-plane/releases`
- `GET /api/v9/data-plane/releases/:releaseId`
- `GET /api/v9/data-plane/releases/:releaseId/records/:recordType/:recordId`
- `GET /api/v9/data-plane/releases/:releaseId/pages/:recordType`
- `GET /api/v9/data-plane/diff?base_release_id=...&candidate_release_id=...`
- `GET /api/v9/data-plane/integrity`
- `GET/POST /api/v9/data-plane/audits`
- `GET /api/v9/data-plane/audits/:reportDigest`

The workbench displays both releases, key rotation, complete metadata/source/
adapter/license/partition pins, attributed nonzero diff classes, linked local
records, and the persisted audit report. Page requests have a dedicated abort
controller and generation; record type, page, and cursor state commit together
only after the owning request succeeds. Busy controls are disabled and page/audit
completion is announced through an `aria-live` region.

## Configuration

```sh
BIOCHEMICAL_FACTORY_URL=http://127.0.0.1:8000
BIOCHEMICAL_FACTORY_TIMEOUT_MS=5000
BIOCHEMICAL_DATA_PLANE_ROOT=/absolute/path/outside/the/source/tree
BIOCHEMICAL_DATA_PLANE_CURSOR_SECRET=<unpadded-base64url-for-32-random-bytes>
BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:3000
```

The cursor secret is mandatory outside tests and is never returned by an API.
Local HMAC cursors bind release ID/digest, schema, record type, exact filters,
sort, page limit, and last ID.

## Limitations

- Publisher signatures authenticate the release distribution closure, not
  upstream-source authorship, current upstream content, scientific completeness,
  or biological validation.
- The bounded release contains no concentrations, fluxes, compartments,
  kinetics, measured physiology, or clinical evidence.
- Source authority response bytes remain producer-owned. The mirror retains
  their signed digest, size, adapter, source, license, attribution, and exact
  normalized records.
- Node 22 labels `node:sqlite` experimental; the runtime is pinned to Node 22.

## Test Evidence

- `npm run check`: syntax, 45 Vitest files / 207 tests, and production client and
  server builds passed.
- `npm audit`: zero vulnerabilities.
- Exact-fixture Playwright: 40 passed and 14 intentionally skipped across
  Chromium desktop and 360 px mobile projects.
- Real-producer Playwright: 40 passed and 14 intentionally skipped against the
  sibling Python factory, evidence, and derived services across both projects.
- Adversarial coverage includes denormalized index corruption, unknown and extra
  rows, unindexed object files, dirty staging, symlinked root/database/CAS/object
  destinations, Host/Origin rebinding for all mutation families, stale sync
  ownership, audit pins/idempotence/offline restart, and rapid UI page/type races.
