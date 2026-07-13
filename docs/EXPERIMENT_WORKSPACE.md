# Controlled Experiment Workspace

## Scope

Goal 9 adds a complete local experiment workspace around the existing ODE, SSA,
and FBA child workers. It supports immutable experiment revisions, single runs,
explicit parameter-sweep portfolios, seeded ensembles, sensitivity portfolios,
and intervention schedules. Portfolio entries are complete strict model and
experiment contracts; no hidden UI state participates in execution.

The workspace is local research infrastructure. The bundled portfolio models
remain conformance benchmarks, not measured physiology, and no result is
clinical or diagnostic guidance.

## Runtime Storage

Set the storage root outside the source tree:

```sh
export BIOCHEMICAL_WORKSPACE_ROOT="$HOME/.local/share/biochemical-inference/workspace-v1"
export BIOCHEMICAL_WORKSPACE_CONCURRENCY=1
```

The first setting defaults to the path shown. A configured path inside the
repository is rejected. Tests and Playwright use isolated sibling paths outside
the source tree.
`.biochemical-workspace/` is ignored as an additional safeguard, but it is not
the production default.

`workspace.sqlite3` stores metadata with SQLite WAL, `synchronous=FULL`, foreign
keys, and a busy timeout. Database triggers reject updates or deletion of
revisions, checkpoints, and events. Objects live below
`objects/sha256/{first-two-hex}/{digest}`. Publication writes a mode-0600 staging
file, fsyncs it, verifies its SHA-256, atomically renames it, and fsyncs the
parent directory before metadata can reference it. A failed database operation
may leave an unreferenced valid object, but it cannot publish corrupt metadata
or replace completed work.

## Identity Model

Four identities are intentionally separate:

- Specification identity: RFC 8785-compatible canonical JSON SHA-256 of the
  complete workspace specification.
- Revision identity: experiment ID, monotonic revision ordinal, and
  specification identity. Revisions are immutable.
- Scientific run identity: specification digest, knowledge snapshot digest,
  sorted model digests, and sorted engine digests. Clones and reruns with the
  same scientific inputs retain this identity.
- Attempt identity: scientific run identity plus attempt number. Every initial,
  rerun, and restart execution receives a distinct attempt identity.

Changing an input changes the specification and scientific identities. Retrying
unchanged inputs creates a new attempt without pretending it is a new scientific
question.

## Knowledge Snapshot

Before a local revision is published, the server requests:

```text
GET /api/v1/releases/{release_id}/snapshots/network?taxon_id=NCBITaxon:...
```

The client validates the complete strict snapshot schema, requires canonical
RFC 8785 response bytes, recomputes `snapshot_digest` after removing only that
field, verifies the release/taxon/manifest/provenance closure and response
headers, reconstructs the canonical bytes of all seven authenticated
`release_payloads`, checks each manifest path/hash/byte count/record count, and
requires the selected taxon, network, and limitations to be the exact projection
of those payloads. Fixture-source classification, repository artifact fields,
source-namespace resolution, record links, and taxon isolation are also checked,
and the snapshot must be self-contained with no restricted dependency. The canonical snapshot is retained as
a content-addressed object. Imported bundles use their verified embedded
snapshot and do not contact biochemical-db.

## Queue And Recovery

Attempts transition only through `queued`, `running`, and `terminal`. Terminal
outcomes remain separate and include `successful`, `failed`, `non-converged`,
`infeasible`, `unbounded`, `resource-exhausted`, and `cancelled`. Append-only
events record queueing, start, portfolio progress, cancellation, completion,
interruption, recovery, resource exhaustion, and rerun verification.

Queued attempts survive restart. A process restart terminalizes every formerly
running attempt with `process_restart`, then validates its immutable
specification checkpoint and queues a new attempt labeled `restart` with
`restartMode: from-specification`. The ODE, SSA, and FBA engines do not expose
serializable mid-state. Consequently:

- Every checkpoint is an exact specification checkpoint.
- `continuation` is always false.
- Model, engine, specification, snapshot, and object digests are recomputed
  before restart.
- An incompatible checkpoint is rejected with `409` and no attempt is started.
- The UI and API never describe a restart as resume or stateful continuation.

Cancellation is recorded in SQLite before workers are signaled. Terminal result
publication checks that flag in the same transaction that publishes the result
artifact, so an accepted cancellation wins a completion race.

Graceful server shutdown is not user cancellation. It stops active workers but
leaves their durable attempts in `running` with no cancellation event or flag.
On reopen, normal recovery marks each one interrupted with `process_restart` and
creates a new restart-from-specification attempt.

## Resource Profiles

Profiles declare CPU cores, worker concurrency, GPU policy, V8 heap memory per
worker, wall time per worker, IPC output bytes, and total retained workspace
artifact bytes. Concurrency cannot exceed the CPU core budget. Existing engines
are CPU-only, so a GPU-required profile terminates as `resource-exhausted`.
Wall, output, storage, worker-signal, and V8 out-of-memory exits are reported as
resource exhaustion rather than successful or partially published work.

CPU cores are enforced as a concurrency ceiling, not OS affinity or CPU-time
cgroups. `--max-old-space-size` bounds the V8 heap, not complete process RSS.
These local Node worker limits are explicit workstation controls rather than a
container security boundary.

## Interventions And Portfolios

Dynamic interventions are deterministic assignments at declared times. ODE
state or parameter assignments split integration exactly at the discontinuity.
SSA state or rate assignments are applied in every replicate and restart the
memoryless stochastic waiting-time draw. FBA interventions occur only at time
zero and replace the selected reaction upper bound. Units, values, target
existence, ordering, duplicate target/time pairs, SSA integer state, and FBA
bound consistency are validated before a worker starts.

Parameter sweeps, ensembles, and sensitivity studies are explicit bounded lists
of complete portfolio entries. This keeps every varied model digest, seed,
engine, and numerical control visible and portable. The current UI authors
single runs, seeded ensembles, and intervention schedules; the same strict API
contract accepts parameter-sweep and sensitivity portfolios.

## Portable Bundles

The `biochemical-workspace-portable-1.0` ZIP contains canonical `manifest.json`,
`snapshot.json`, and content-addressed files under `objects/sha256/`. Export uses
fixed ZIP metadata. Import allows only those names and rejects absolute paths,
`..`, backslashes, NULs, directories, symlinks, duplicate names, unlisted or
missing objects, digest/size mismatch, more than 260 entries, entries over 25
MB, more than 50 MB expanded content, archives over 25 MB, and compression
ratios over 100.

If an exported revision has a result, the manifest declares its exact or
tolerance rerun contract and expected result object. An imported offline rerun
must reproduce the same result structure and satisfy that contract. Failure is
terminal `rerun_contract_mismatch`; it is never silently accepted.

## Reports

Reports atomically retain deterministic HTML, JSON, CSV, and SVG artifacts. The
HTML has no script or remote asset and carries this CSP in both its metadata and
HTTP response:

```text
default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

The report contains results, warnings, model assumptions and limitations,
revision/specification/snapshot provenance, and the scientific boundary. It can
be opened without a network service.

## API

All routes are below `/api/v7/workspace`:

- Resource profiles: `GET/POST /resource-profiles`
- Experiments: `GET/POST /experiments`, `GET /experiments/:id`
- Revisions and clone: `POST /experiments/:id/revisions`, `POST /experiments/:id/clone`
- Bundles: `GET /experiments/:id/export`, `POST /experiments/import`
- Queue/history: `GET/POST /runs`, with release, model, taxon, tissue, and status filters
- Run detail: `GET /runs/:attemptId`, `GET /runs/scientific/:runId`
- Events/cancel: `GET /runs/:attemptId/events`, `POST /runs/:attemptId/cancel`
- Checkpoint/restart: `GET /runs/:attemptId/checkpoints`, `POST /checkpoints/:id/restart`
- Artifacts: `GET /runs/:attemptId/artifacts`, `GET /artifacts/:id`
- Comparisons: `POST /comparisons`, `GET /comparisons/:id`
- Reports: `POST /reports`, `GET /reports/:id`, `GET /reports/:id/files/:format`

## Limitations

- There is no mid-state checkpoint or stateful engine continuation.
- The queue is a single-workstation SQLite scheduler, not a distributed cluster.
- GPU execution is not implemented by the current numerical engines.
- Resource profiles bound child execution and retained artifacts but are not an
  OS sandbox.
- Portable knowledge contains the normalized public network closure and source
  metadata, not complete upstream databases or publication full text.
- Portfolio models remain small numerical conformance systems. Parameter sweep
  and sensitivity interpretation is the researcher's responsibility.
