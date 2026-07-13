# Extensible Physiology Plugins

## Boundary

Goal 10 consumes only `physiology-plugin-evidence-v1.0.0` at canonical manifest
digest `8f7a14db2cebe4603772146b3d1f9f2a8ccafbf2452ef5c9ff856326584fadb8`.
The producer release is evidence for a synthetic coupling contract. It is not an
executable package release, measured physiology, scientific validation, or a
universal digital twin.

The inference server adds a separate local `.bpp` execution package layer. The
three built-in circulation, liver, and kidney packages copy the upstream plugin,
context, port, evidence-model digest, protocol digest, unit, and cadence records
exactly. Package-content digests are intentionally separate from the upstream
opaque evidence digests. The UI displays both instead of implying equivalence.

## Architecture

`shared/physiology-contracts.js` defines strict upstream envelopes and internal
package, catalog, coupling, run, conformance, trust, and coverage records.
`server/physiology/client.js` independently verifies the producer catalog,
release envelope, immutable digest headers, canonical manifest digest, source
trust classes, port closure, fixed benchmark partitions, unsupported validation,
and unsupported mouse coverage.

`server/physiology/package.js` validates the package boundary before persistence.
`server/physiology/service.js` owns the local trust store, package catalog,
coupling metadata, deterministic execution, conformance results, and run records.
`server/physiology/database.js` uses a focused SQLite WAL database. Compressed
package bytes are immutable SHA-256 objects in the adjacent staged/fsynced object
store. Package, coupling, and run rows have immutable update/delete triggers.

Storage defaults to
`$HOME/.local/share/biochemical-inference/physiology-v1`. Set
`BIOCHEMICAL_PHYSIOLOGY_ROOT` to a directory outside the repository, or set
`BIOCHEMICAL_WORKSPACE_ROOT` to place physiology under its `physiology-v1`
subdirectory.

## `.bpp` Profile

A `.bpp` file is a deterministic ZIP with canonical JSON:

- `manifest.json`: package identity, plugin kind, publisher, pinned evidence,
  SPDX license, applicability, resources, permissions, entrypoints, and content
  SHA-256/byte descriptors;
- `model.json`: declarative state, evidence-model digest, cadence, shape, units,
  and bounded piecewise output schedule;
- `coupling.json`: exact evidence protocol digest, cadence, interpolation,
  integration rule, and ports;
- optional `process/*.mjs`: process entrypoint for a sandbox-gated package;
- `signature.json`: Ed25519 signature over the canonical manifest digest.

The committed reference publisher material is one public SPKI key and three
signatures. No publisher private key or recovery material is stored in this
repository. Built-in archives are reconstructed deterministically with a fixed
ZIP timestamp and mode, and their exact bytes are content-addressed at startup.

Validation rejects malformed or non-canonical JSON, unknown fields, missing or
unlisted entries, duplicate names, absolute paths, traversal, backslashes, NULs,
directories, symbolic links, encryption, unsupported names, oversized compressed
or expanded data, excessive entry count or compression ratio, digest/byte drift,
unknown or revoked keys, invalid signatures, evidence drift, context drift,
port/direction/semantic/dimension/unit drift, cadence drift, excessive resources,
undeclared permissions, and output schedule gaps.

## Trust And Processes

The local trust store begins with the built-in public key. Revocation is durable
and immediately downgrades every affected package to `not-certified`; new
validation, conformance, coupling, and execution fail closed. Immutable package
bytes are retained for audit.

Declarative packages execute in-process through the bounded descriptor runtime.
Process packages are format-recognized but default to refused installation and
execution. Enabling them requires both:

```sh
BIOCHEMICAL_PHYSIOLOGY_ENABLE_PROCESS_PLUGINS=true
BIOCHEMICAL_PHYSIOLOGY_BWRAP_PATH=/usr/bin/bwrap
```

The configured absolute executable must identify as Bubblewrap and pass a
user/mount/network namespace probe. A process receives one strict JSON protocol
message, a read-only entrypoint mount, read-only system runtime mounts, isolated
PID/network/user namespaces, a size-bounded empty temporary filesystem, bounded
wall time and output, and declared V8 heap/worker-pool limits. Its response must
contain only finite non-negative rates for declared output ports. Identical
primary runs are compared exactly and nondeterministic output is refused. Process
packages are not protocol-certified merely by
passing archive validation; a sandbox must be available and conformance remains a
separate operation. No process reference package is shipped.

## Coupling And Identity

The reference coupling binds four directed `drug-mass-flow` exchanges. Every
exchange is scalar, extensive, `mass_rate`, and `mg/min`; source output and target
input declarations must agree exactly. The runtime integrates each rate over the
coupling interval and records source loss, target gain, integrated amount, and
residual. The declared source-to-target sign convention is never inferred from a
negative value.

The explicit coupling cadence is one minute with zero-order-hold interpolation.
Plugin cadences are one minute for circulation and two minutes for liver and
kidney. Protocol events distinguish initialization, input reads, due advances,
and output publication. Coupling applicability is the taxon/use-scope
intersection plus all three context bindings and exclusions. Mouse and duration
beyond the four-minute evidence domain are blocked as unsupported extrapolation.

Identity is exact canonical SHA-256:

- package digest: immutable `.bpp` bytes;
- model and coupling descriptor digests: canonical descriptor bytes;
- plugin digest: package plus both descriptor digests;
- coupling digest: ordered plugin/package closure, exchanges, cadence,
  interpolation, refinement contract, and applicability intersection;
- run digest: coupling digest plus deterministic coupler version.

The synthetic schedule starts at 80/10/10 mg and reaches 50/30/20 mg at four
minutes. Total represented mass remains 100 mg. Runs repeat at factors 1, 2, and
4; the result includes each refined endpoint, maximum conservation residual,
maximum endpoint difference, and the declared convergence tolerance.

## Certification

`certified-conformant` requires all seven checks: publisher signature, strict
schema, exact ports, applicability, redistributable license, bounded resources,
and conformance benchmark. Protocol certification always carries
`scientificValidation: unsupported` and the statement that certification does
not establish scientific validity. Upstream calibration/validation labels are
fixed synthetic software partitions and are never presented as biological
generalization.

## API

All mutations require exact same-origin requests and
`X-Physiology-CSRF: physiology-v1`.

- `GET /api/v8/physiology`
- `GET /api/v8/physiology/evidence`
- `POST /api/v8/physiology/packages/validate`
- `POST /api/v8/physiology/packages/install`
- `GET /api/v8/physiology/packages`
- `GET /api/v8/physiology/packages/:packageDigest`
- `POST /api/v8/physiology/packages/:packageDigest/conformance`
- `GET /api/v8/physiology/trust`
- `POST /api/v8/physiology/trust/:keyId/revoke`
- `GET/POST /api/v8/physiology/couplings`
- `GET /api/v8/physiology/couplings/:couplingDigest`
- `GET/POST /api/v8/physiology/runs`
- `GET /api/v8/physiology/runs/:runDigest`
- `GET /api/v8/physiology/coverage`

## Limitations

- Only the three human synthetic reference plugins and four-minute contract
  domain have evidence and execution fixtures.
- Respiratory, endocrine, immune, neural, tumor, and every mouse domain remain
  unsupported.
- Rates, initial masses, cadences, observations, and convergence results are
  repository-authored software fixtures, not measured values.
- Exact conservation and timestep convergence do not establish mechanism,
  parameter validity, exposure prediction, organ function, treatment response,
  safety, or clinical usefulness.
- SQLite and the object store target one local workstation, not a distributed or
  multi-tenant plugin registry.
