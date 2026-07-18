# Goal 14 Measured Spatial Plan

Research and source verification date: 2026-07-17.

This plan defines the first bounded Goal 14 increment. It does not declare Goal
14 complete and does not relabel the Goal 7 synthetic lobule as measured
anatomy.

## Release Boundary

- Release ID: `digimouse-measured-liver-atlas-v1.0.0`.
- Contract family: additive `measured-spatial/1.0.0`.
- Taxon: `NCBITaxon:10090`.
- Scope: the DigiMouse source anatomical label volume, a deterministic binary
  liver mask, two multiresolution levels, source and rights closure, and bounded
  immutable chunk delivery.
- Excluded from the first release: raw CT, raw cryosections, PET, registered
  intensity volumes, meshes, HRA placement, APAP values, and executable
  registration transforms.
- Registration from the measured-derived whole-body atlas to
  `SPACE:MOUSE-LOBULE-LOCAL` is explicitly unavailable. No transform,
  deformation field, landmarks, quality metrics, valid region, or inverse is
  present in the source archive.

## Rights And Attribution

DigiMouse is distributed by the USC NeuroImage project under CC BY-SA 4.0.
The release must preserve the archive's `LICENSE.txt`, attribution, source URL,
DOI, modification notice, ShareAlike obligation, warranty disclaimer, and
no-endorsement boundary.

- Title: Digimouse: A 3D Whole Body Mouse Atlas from CT and Cryosection Data.
- Creators: B. Dogdas, D. Stout, A. Chatziioannou, and R. M. Leahy.
- DOI: `10.1088/0031-9155/52/3/003`.
- Source: `https://neuroimage.usc.edu/neuro/Digimouse`.
- License: `https://creativecommons.org/licenses/by-sa/4.0/`.
- Modifications: Analyze extraction, explicit axis declaration, two-level mode
  pyramid, liver-value extraction, binary mask generation, chunk padding, and
  deterministic compression.

The converted arrays, masks, pyramids, chunks, and data attribution are treated
conservatively as CC BY-SA 4.0 adapted material. Repository software remains
under its existing software license; that license must not be presented as a
grant over the measured data artifacts.

## Pinned Source Objects

The production source adapter must acquire and verify these objects before any
offline build. Web pages belong in the external acquisition CAS unless a later
rights review authorizes mirroring their complete bytes.

| Object | Bytes | SHA-256 |
| --- | ---: | --- |
| `atlas.zip` | 907411 | `6f7cbd8a7236a78c47a14c3259d387439c0dc0284b2a83fa955f8c49efe11761` |
| `atlas_380x992x208.hdr` | 348 | `2c5a91506fe46591feb46b61e495f1d06a0a825dd10afdb029fafa4570c684ad` |
| `atlas_380x992x208.img` | 78407680 | `0169aa60143b9dfab042270bf10ec45579cf1dd62b9d72437c99b1703cc0b298` |
| `atlas_380x992x208.txt` | 420 | `8e8ca7bf9c29b6f24617e65c3529d6d114f954638d47bac00491d9b3ec040f26` |
| `LICENSE.txt` | 20774 | `59794e20b4f461cb3fc5fb0f559ec99b92f9365264a48668e0b1151b06e35d63` |

The archive transport metadata observed during source verification was ETag
`"dd893-626fe9ec439a1"` and Last-Modified
`Sat, 16 Nov 2024 02:41:27 GMT`. Transport metadata is conditional-fetch data,
not content identity.

Authoritative evidence pages:

- `https://neuroimage.usc.edu/neuro/Digimouse`
- `https://neuroimage.usc.edu/neuro/Digimouse_Download`
- `https://neuroimage.usc.edu/neuro/Digimouse_Registration`
- `https://neuroimage.usc.edu/neuro/Digimouse_license`

## Source Validation

Acquisition is the only network-enabled phase. Build, verify, promote, package
verification, and routine tests must reject network access.

The adapter must enforce HTTPS without credentials or cross-origin redirects,
bounded exact-length streaming, ZIP magic and SHA-256, safe unique paths, no
encryption, links, devices, ZIP64, or extra members, and a maximum expanded size
of 79 MiB. The Analyze pair must be little-endian, 348-byte header, dimensions
`380 x 992 x 208`, uint8 datatype, 8 bits, zero voxel offset, and approximately
`0.1 x 0.1 x 0.1 mm` spacing. The image byte count must equal the dimension
product. The ASCII label map must bind scalar label `18` to liver. License and
registration evidence must be retained and checked separately.

The source reports one normal nude male mouse, 28 g, with post-mortem CT and
cryosection-derived anatomy. Axis polarity, physical origin, registration
uncertainty, and quantitative registration quality are not reported and must
never be inferred.

## Deterministic Conversion

Arrays use C-order `z,y,x` storage. Level 1 reduces aligned `2 x 2 x 2` blocks
by mode, resolving ties to the numerically smallest label. The liver mask is one
exactly where the corresponding anatomy level equals 18. No interpolation,
smoothing, morphology, hole filling, or connected-component filtering is
allowed.

| Array | Level | Shape ZYX | Spacing um | Uncompressed SHA-256 |
| --- | ---: | --- | --- | --- |
| anatomy labels | 0 | `[208,992,380]` | `[100,100,100]` | `0169aa60143b9dfab042270bf10ec45579cf1dd62b9d72437c99b1703cc0b298` |
| anatomy labels | 1 | `[104,496,190]` | `[200,200,200]` | `6ecba397ef638d8f9d1b9d581aadb01b871a331470d77e918a6d131b74bc1965` |
| liver mask | 0 | `[208,992,380]` | `[100,100,100]` | `2b9608326cd9f2ef3c4998d63c941099df6b71db3206e24f5fb1b894be5f05b9` |
| liver mask | 1 | `[104,496,190]` | `[200,200,200]` | `5a82200f36c92dd5bb64acd0e04b32dc2b1e34b81ef0f86ea9af5bca2d661222` |

The source has 2,007,078 liver voxels with inclusive XYZ bounds
`[54,442,25]` through `[293,624,181]`. Level 1 has 248,736 liver voxels with
inclusive XYZ bounds `[27,221,13]` through `[146,311,90]`.

Use fixed Zarr v2 arrays with NGFF 0.4 axes, uint8 values, C order, chunks
`[32,128,128]`, deterministic gzip level 9, and no omitted all-fill chunks.
Edge chunks are zero-padded to the full stored shape. The inventory contains
400 chunks: 168 per level-0 array and 32 per level-1 array. Every record binds
array, level, grid coordinates, voxel origin and shape, stored shape, path,
codec, media type, encoded bytes and digest, and decoded bytes and digest.

## API And Storage

The producer surface is additive under `/api/measured-spatial/v1`. It exposes
signed catalog/release metadata, acquisitions, spaces, arrays, labels,
registrations, limitations, attribution, bounded chunk inventory, and exact
manifest-owned chunk coordinates. Chunk responses carry immutable cache and
release/array/chunk identities. They are atomic and reject range requests.

PGlite stores sealed metadata generations and immutable external-file
descriptors, not duplicate chunk bytes. Chunk bytes remain in the immutable
release filesystem or a digest-bound browser cache and are checked on every
read. Browser offline completion is valid only after all 400 encoded and
decoded hashes verify. Missing or corrupt cache entries remain visibly
unavailable; Goal 7 geometry and other levels are never fallbacks.

## Routine Test Boundary

Routine tests use a deterministic synthetic `4 x 4 x 4` Analyze archive with
labels 0 and 18 plus generated corruption variants. They do not download the
production source. An opt-in full-source replay may download only the pinned
907411-byte archive and allocate its 78 MiB image; raw CT, cryosection, PET, and
registered modality archives must not appear in CI or package scripts.

The first increment passes only when independent builds reproduce all four
array hashes and the complete chunk inventory; source, license, and attribution
closure verify; producer and consumer reject all identity drift; offline
semantic access works without WebGL; and the unsupported registration remains
explicit. Goal 14 remains active until a later release supplies a real pinned
transform with quality evidence, valid region, and inverse status.
