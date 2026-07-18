# Bounded Measured Spatial Liver Atlas

Goal 14 remains active. This delivery is the bounded DigiMouse measured atlas
and liver-segmentation slice only. It does not supply or imply a transform to
the synthetic mouse lobule space.

## Independent Pins

The inference consumer does not trust producer discovery as identity. It pins
and independently verifies the following published objects:

| Identity | SHA-256 |
| --- | --- |
| Release | `9b4ea920b9daa49f23aefe453b88fcd0b13f92dd50c5ebb168c7809d78c22b1b` |
| Trust | `f438a720972edf576a37ee12103eac949b84d942126ea97bbd97b40c0f83813f` |
| Signed catalog | `8d9197c2f3c964a82392e871efc12b063b46228b4d33e3203aa8528af83eb845` |
| Manifest | `3a3409e44df84e200e074760bfda4197ec8673dd5bf79b37167b2b83aaf850c0` |
| Signed envelope | `71a5876a50c9a9c2a7a373339ef12002f3fb054bd04095b299ac480560199210` |
| Metadata | `2244bcb1bf444911cc84655558872ab533725e39e3ecbd544322c0d76a01ad10` |
| Chunk inventory | `fac42ad9b6796d62933dd0b370113404d0c1cb51a4776ebd3c63d20775fcbb9a` |
| Source archive | `6f7cbd8a7236a78c47a14c3259d387439c0dc0284b2a83fa955f8c49efe11761` |

The one-time `goal14-measured-spatial-2026` Ed25519 key is pinned as public key
`LkUc5qudlNruohEvS3Q3cJpmIxNZydvgVS7ugH0wNT8`. Both catalog and release
signatures must verify at `2026-07-17T00:00:00Z`, inside the retired key's
one-day validity interval. A retired key is accepted only because this exact
key, signed instant, trust object, catalog, envelope, and release are all
independently pinned.

The four independent array pins are:

| Array | Shape ZYX | Spacing | Uncompressed SHA-256 | Chunks |
| --- | --- | --- | --- | ---: |
| `anatomy-labels:0` | `208 x 992 x 380` | `100 um` | `0169aa60143b9dfab042270bf10ec45579cf1dd62b9d72437c99b1703cc0b298` | 168 |
| `anatomy-labels:1` | `104 x 496 x 190` | `200 um` | `6ecba397ef638d8f9d1b9d581aadb01b871a331470d77e918a6d131b74bc1965` | 32 |
| `liver-mask:0` | `208 x 992 x 380` | `100 um` | `2b9608326cd9f2ef3c4998d63c941099df6b71db3206e24f5fb1b894be5f05b9` | 168 |
| `liver-mask:1` | `104 x 496 x 190` | `200 um` | `5a82200f36c92dd5bb64acd0e04b32dc2b1e34b81ef0f86ea9af5bca2d661222` | 32 |

## Verification And Storage

Synchronization reads the sibling JavaScript/PGlite producer at
`/api/measured-spatial/v1`. It rejects redirects, non-loopback producer URLs,
unbounded or non-canonical bodies, incompatible content/cache/release headers,
schema drift, signature failure, and any independently pinned identity drift.

The producer does not expose `metadata.json` as one response. The consumer
loads all seven bounded semantic record pages, removes only the producer's
record-page wrapper identifiers, reconstructs canonical `metadata.json`, and
must reproduce its exact digest. It similarly loads the four fixed 100-item
inventory pages and must reconstruct the exact 400-item canonical inventory.
It then verifies:

- strict acquisition, space, labels, attribution, limitations, and unavailable
  registration metadata;
- all four array levels, shapes, spacing, dtype, order, chunk shape, codec,
  uncompressed bytes and hashes, liver counts, and bounds;
- exact chunk grids and edge shapes within each pinned array;
- exact manifest ownership of metadata, Zarr metadata, inventory, and every
  chunk path, encoded length, and encoded digest;
- fixed RFC 1952 gzip level 9, mtime 0, OS byte 3, and implementation probe;
- total inventory count 400 and encoded size 1,003,982 bytes.

No chunk is downloaded during metadata synchronization. The immutable verified
bundle is stored in a SHA-256 object store referenced by an immutable SQLite
snapshot row. Chunk bytes are stored in that same digest-addressed cache only
when selected or explicitly completed. The default root is
`~/.local/share/biochemical-inference/goal14-measured-spatial-v1`; configure
`BIOCHEMICAL_MEASURED_SPATIAL_ROOT` to another path outside the source tree.
Configure the loopback producer with `BIOCHEMICAL_MEASURED_SPATIAL_URL` and an
optional `BIOCHEMICAL_MEASURED_SPATIAL_TIMEOUT_MS` from 100 through 120000.

Every cache read rechecks the encoded length and SHA-256. Every served viewport
read and offline-completion pass also decodes the exact gzip member and checks
the 524,288-byte decoded length and decoded SHA-256. Corruption is never
replaced automatically. Evicted chunks become absent. A missing chunk may be
retrieved only from its exact producer coordinate; if the producer is absent,
the selected chunk remains visibly unavailable. Another level, Goal 7 geometry,
or generated data is never a fallback.

Offline completion is explicit. It is recorded only after all 400 descriptors
pass encoded and decoded verification. Local integrity performs no network
access and reports missing or corrupt entries. An old completion record cannot
hide eviction because current descriptor availability is checked before status
can report `offlineComplete: true`.

## Inference Routes

The additive inference-owned routes are:

- `GET /api/v12/measured-spatial`
- `GET /api/v12/measured-spatial/status`
- `POST /api/v12/measured-spatial/sync`
- `GET /api/v12/measured-spatial/records/{recordType}`
- `GET /api/v12/measured-spatial/chunks`
- `GET /api/v12/measured-spatial/chunks/{arrayId}/{level}/{z}/{y}/{x}`
- `POST /api/v12/measured-spatial/offline-completion`
- `GET /api/v12/measured-spatial/integrity`

Cache-changing POST routes require the allowlisted browser origin and
`X-Measured-Spatial-CSRF: goal14-measured-spatial-v1`. Discovery, status,
completion, integrity, and errors are `no-store`. Release-owned records,
inventory, and atomic chunks carry one-year immutable caching plus exact
release identity headers. Chunk ranges and query parameters are rejected with
416. Browser chunk verification intentionally reaches the inference server
rather than accepting an old browser HTTP cache entry, then independently
checks encoded and decoded hashes before showing availability.

## Accessible Atlas

`MeasuredSpatialLiverAtlas.vue` provides a responsive semantic alternative to
graphics APIs. It includes the specimen and acquisition context, all four array
identities, label-18 liver counts and bounds, source, DOI, creators, CC BY-SA
4.0 rights, ShareAlike requirement, warranty and no-endorsement text, software
license boundary, complete modification notice, orientation/origin limits, and
all scientific limitations.

The chunk viewport is a keyboard-accessible manifest grid. Changing the array,
exact level, or Z slab loads descriptors only. Activating one cell requests
only that exact chunk. It displays byte/hash verification and coordinate facts,
not an invented image orientation. No WebGL or canvas is required.

## Browser Acceptance

Real Playwright acceptance starts the integrated sibling JavaScript/PGlite
producer, production-builds the inference server, and runs on desktop Chromium
and a 360 px mobile viewport with one worker. It verifies metadata sync, rights
and registration boundaries, zero chunk reads before selection, one selected
chunk, browser encoded and decoded verification, all-400 completion, local
integrity with network access disabled, reload, and a forced server read whose
`X-Cache-Source` is `local`. This is artifact-offline acceptance: the inference
HTTP server remains available while no producer access is needed for completed
content.

## Residual Registration Boundary

The only registration record remains
`registration:digimouse-to-mouse-lobule-local` with status `unavailable`.
Transform, inverse, landmarks, quality metrics, valid region, and uncertainty
are null or unreported. The measured whole-body atlas cannot be placed in
`SPACE:MOUSE-LOBULE-LOCAL`, composed with a synthetic transform, or used to
claim lobule-local APAP values. Goal 14 remains active until a future signed,
pinned release supplies a real directed transform with axes, units, quality
evidence, uncertainty, valid region, and inverse status.
