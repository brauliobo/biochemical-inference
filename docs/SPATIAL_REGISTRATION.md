# Bounded Spatial Registration

## Accepted release

The inference consumer accepts only
`learn2reg-abdomen-mrct-0001-registration-v1.1.0` under
`spatial-registration/1.1.0`. It exposes one CT-to-MR identity between the
source-prealigned output grids for Learn2Reg AbdomenMRCT pair 0001.

The rejected uncommitted `v1.0.0` candidate is not compatible, cataloged, or
accepted by any consumer pin. It failed attribution, coordinate, ROI, metric,
source-acquisition, request-taxonomy, and publication-time review. The producer
retains only metadata-only rejection evidence; no rejected release bytes are
distributed.

This human registration-characterization pair is non-diagnostic and does not
connect DigiMouse, HRA, synthetic lobule geometry, another subject, or another
taxon. Discovery returns `goal14Complete: false`.

## Independent pins

| Identity | SHA-256 |
| --- | --- |
| Release | `cb8c615c145dbc0a31cd1e1c3786eac2031daeae6164839b0b6dd770ab6b441c` |
| Trust | `07081bb05e590c7041d89902452e6f8ea41ffb04c000fa8cb5b93180ef3bb9a3` |
| Signed catalog | `876305624bea41a6f629a8ed26d12b5359874354828020409cc6133603238340` |
| Manifest | `9375478cac0bd9452b1407e01e12ebfd44e41a02572d065126b5888e1e1300e4` |
| Signed envelope | `3b3049188da53e746872d60a3719bdaf6cddc413254e767c89c07bebdaa67368` |
| Metadata | `510524325ab37051f318cc16125b881a243b598349f74bc5a6e9b3a2e82ea38b` |
| Chunk inventory | `7d0d6587bbd66ab71dfcc15715c881de3f2ff53c620941ccc815df439db2b0e2` |
| Source package | `5c8272429f0465c37b2ae2a276bd901932099f4b219363b8ad2d93ef2497c426` |
| Acquisition report | `20cda54acf95839241867c4795807840ea3a6c94f718d7b98abf21db94423424` |
| Source lock | `9e72368bd33f3da6c6f0df4cbe172b6e6054b744e31afda4fed2b192937675c8` |
| Recipe | `885083abb94ff9149cb05c7b1638bcdba60587e215eafb975ef269b2b8bd5314` |
| Attribution | `f93a28541099f9ab6fb81f3679a31b70555ab4599f515eaca1d6423f5303f099` |

The independently pinned one-time key is
`goal14-spatial-registration-corrected-2026`, public key
`PpfYFnEbdWLhB5VTn6A7SDDiH-BbTsszaDWTVDYCVDo`. Signatures must verify at
`2026-07-17T20:29:54Z`, after the pinned retrieval completion
`2026-07-17T20:28:35Z`, inside the retired key's validity day, and not in the
future at verification time.

## Source and rights verification

Synchronization accepts only an origin-only loopback HTTP producer. It rejects
redirects, non-canonical or unbounded responses, schema drift, signature or pin
failure, future publication, incompatible headers, or missing rights links.

The semantic acquisition record proves that the producer streamed and hashed
the complete 1,916,666,413-byte package response and observed the exact source
SHA-256. It includes the exact origin and package URLs, retrieval instant, HTTP
identity, ten successful member range extractions, and every extracted member
hash. The consumer hashes that canonical report to its independent pin.

Attribution names all 53 Learn2Reg authors, the TCIA repository-paper authors,
and every author in the required TCGA-KIRC v3, TCGA-KIRP v4, and TCGA-LIHC v5
citations. Each citation exposes an HTTPS DOI URL and source URL. The workbench
shows the exact package URL, version, retrieval time, acquisition-report hash,
CC BY 3.0 link, TCIA policy, downstream notice, identification prohibition,
TCGA acknowledgement, modifications, no-endorsement statement, and software-
license boundary.

## Exact array coordinates

All five arrays bind their owning semantic space, ZYX index-axis order, and
full `index_zyx_to_space_xyz_mm` matrix. Source labels and the evaluation ROI
use 2 mm scale and zero translation. The center-voxel intensity previews use:

```text
0 0 8 4
0 8 0 4
8 0 0 4
0 0 0 1
```

The `[4,4,4] mm` translation is independently required because preview index
zero selects source voxel `[2,2,2]` on a 2 mm source grid. Verification rejects
any array-space, axis-order, scale, translation, or matrix mismatch.

## Evaluation ROI and residual overlap

`evaluation-roi` is the repository-derived logical intersection of the source
MR and CT evaluation masks. It is bound to the MR prealigned grid and contains
1,444,952 voxels. It scopes recomputed residual source-label metrics only. It is
not the transform validity domain.

The consumer loads and verifies all 288 MR-label, CT-label, and evaluation-ROI
chunks, then recomputes:

| Anatomy | MR voxels | CT voxels | Dice | Centroid distance | Status |
| --- | ---: | ---: | ---: | ---: | --- |
| Liver | 147,635 | 179,807 | 0.6823498512713702 | 12.772459518661021 mm | observed |
| Spleen | 29,215 | 25,648 | 0.6056176293676977 | 14.654604304317427 mm | observed |
| Right kidney | 34,725 | 29,119 | 0.40082075057953764 | 20.720621744733393 mm | observed |
| Left kidney | 18,285 | 0 | not evaluable | not evaluable | absent from CT labels in ROI |

The API and UI call these values recomputed residual overlap, never independent
registration-quality validation or ground truth. The immutable local proof
binds the release, inventory digest, metrics digest, and 288 evidence chunks.

## Transform behavior and taxonomy

The available affine is identity from CT prealigned space to MR prealigned
space, with an exact inverse. It is a materialization of equal published NIfTI
sforms, not a recovered deeds-linear affine from original coordinates.

Any coordinate inside the selected source-space extent can be transformed,
including fractional coordinates and coordinates outside the evaluation ROI.
For exact voxel-grid coordinates the service reports ROI membership as `inside`
or `outside`; for off-grid coordinates it reports `not-assessed-off-grid`.
Membership never controls affine validity. Same-space requests fail separately
with `SPATIAL_REGISTRATION_SAME_SPACE_REQUEST`, because no registration is
required. Unknown, cross-subject, cross-taxon, axis-mismatched, unit-mismatched,
dimension-mismatched, version-mismatched, and unreachable chains fail with
their bounded chain taxonomy.

## Routes and offline closure

The inference routes are:

- `GET /api/v14/spatial-registration`
- `GET /api/v14/spatial-registration/status`
- `POST /api/v14/spatial-registration/sync`
- `GET /api/v14/spatial-registration/records/{recordType}`
- `GET /api/v14/spatial-registration/chunks`
- `GET /api/v14/spatial-registration/chunks/{arrayId}/{z}/{y}/{x}`
- `POST /api/v14/spatial-registration/residual-overlap`
- `POST /api/v14/spatial-registration/transform`
- `POST /api/v14/spatial-registration/offline-completion`
- `GET /api/v14/spatial-registration/integrity`

Mutation routes require the allowlisted browser origin and
`X-Spatial-Registration-CSRF: goal14-spatial-registration-v1`. Mutable responses
are `no-store`. Release records, inventory, and atomic chunks use one-year
immutable caching and exact release and rights headers. Ranges and chunk query
parameters are rejected.

Offline completion verifies all 304 encoded and decoded chunks, totaling
508,201 encoded bytes, and recomputes residual overlap. Local integrity performs
no network access and cannot let an old completion row hide a missing or corrupt
object. The corrected release uses a separate `v1.1` state root and schema; the
rejected candidate state is not migrated or accepted.

## Browser acceptance

The semantic workbench uses no WebGL or canvas. Desktop and 360 px mobile
Playwright acceptance starts the real sibling producer and production-built
consumer. It verifies corrected metadata and rights, full source-acquisition
evidence, residual-overlap replay, array-space matrices and 4 mm preview
translations, an inside-ROI transform, an outside-ROI transform that remains
valid, explicit same-space taxonomy, a manifest-owned ROI chunk, all-304
offline completion, network-disabled integrity, and reload from local state.

## Residual Goal 14 boundary

The Learn2Reg identity has no shared space, subject, taxon, or reference version
with DigiMouse or `SPACE:MOUSE-LOBULE-LOCAL`. It cannot support HRA or lobule-
local APAP claims. Goal 14 remains active until a separate signed and
independently pinned release supplies that biologically relevant chain.
