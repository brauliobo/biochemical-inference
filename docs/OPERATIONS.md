# Production Operations

This runbook owns deployment, process lifecycle, persistent-state recovery, upgrade rehearsal, and package evidence for the Node 22 inference application and sibling `biochemical-db/service-js`. It deliberately does not alter scientific JSON contracts or Goal 13-15 domain/scientific logic.

## Fresh machine

Requirements are Linux, Node 22.23.1, npm 10 or newer, `nice`, `/proc/self/fd`, two sibling source checkouts, and network access to the npm registry only for `npm ci`. Playwright and Ollama are not required for service startup. Keep the runtime outside both repositories on a local filesystem that provides durable file/directory fsync, atomic same-filesystem rename, and hardlink semantics. NFS/object-backed mounts without those guarantees are unsupported.

```sh
export INFERENCE_REPO=/srv/biochemical-inference
export DATABASE_REPO=/srv/biochemical-db
export RUNTIME=/var/lib/biochemical-runtime

cd "$INFERENCE_REPO"
nice -n 10 npm run ops:bootstrap -- --database-repo "$DATABASE_REPO"
nice -n 10 npm run ops:init -- \
  --database-repo "$DATABASE_REPO" \
  --runtime-root "$RUNTIME" \
  --origin https://biochemical.example \
  --inference-host 127.0.0.1 --inference-port 3000 \
  --database-host 127.0.0.1 --database-port 8000
nice -n 10 npm run ops:smoke -- --runtime-root "$RUNTIME"
nice -n 10 npm run ops:start -- --runtime-root "$RUNTIME"
```

`--origin` is the browser-facing origin used for CORS and authorization. It never controls listener binding or readiness probes. The two bind addresses must remain loopback; publish through a deployment-owned TLS reverse proxy. `ops:bootstrap` verifies Node 22, runs `npm ci` in `service-js` and inference, then builds the production client/server. `ops:init` refuses a non-empty runtime or any symlink ancestor, invokes the database key/token generator, creates separate inference cursor secrets, and writes mode-`0600` environment files. No placeholder or checked-in key is used.

The foreground supervisor installs `SIGINT`/`SIGTERM` cleanup before starting any child, creates an independent process group for each service, starts the database first at its configured local probe origin, waits for `/ops/readyz`, then starts and probes inference locally. All child processes run through `nice -n 10`. Shutdown signals entire groups, closes inference first and database second, and gives either group 20 seconds before `SIGKILL` and a reported failure.

## Runtime layout

Private configuration is separate from state:

```text
$RUNTIME/
  database/secrets/       # keys, keyring, policy, database.env; never in state backup
  database/state/         # seven PGlite roots and derived CAS
  inference-secrets/      # inference.env; never in state backup
  inference-state/        # eight SQLite/CAS/chunk roots
  runtime.json            # local launcher metadata; never in state backup
```

The inference roots are `challenge`, `data-plane`, `measured`, `measured-spatial`, `physiology`, `revalidation`, `spatial-registration`, and `workspace`. Operational backup includes all of them, including SQLite WAL/SHM files, filesystem CAS objects, measured-spatial chunks, and all 304 spatial-registration chunks. The current version, complete root set, pinned prior release, and exact SQLite `user_version` values are in `operations/schema-baseline.json`.

Store both secret directories in an encrypted, access-controlled secret manager. Disaster recovery requires those original keys/tokens separately because backups intentionally reject them. Rotating a key or token is a planned identity/authorization operation, not a restore side effect.

## Readiness and metrics

- Database liveness: `http://127.0.0.1:8000/healthz`
- Database bounded readiness: `http://127.0.0.1:8000/ops/readyz`
- Inference liveness: `http://127.0.0.1:3000/api/v1/health`
- Inference bounded readiness: `http://127.0.0.1:3000/ops/readyz`
- Prometheus metrics: `/metrics` on each service

Readiness coalesces concurrent checks and returns within five seconds. It checks core, atlas, parameters, APAP, spatial, physiology evidence, evidence, derived, workspace, local physiology, data-plane, measured, challenge, measured-spatial, spatial-registration, and revalidation. One shared `AbortSignal` reaches every real domain check; timeout aborts that shared operation, clears its one timer, and retains the coalescing slot until cancellation cleanup settles. Failure responses are generic, redacted, and `no-store`. Metrics use bigint counters and expose only totals, in-flight requests, fixed `2xx`/`3xx`/`4xx`/`5xx` classes, readiness outcomes, and uptime. They never label by URL, route parameter, release, path, token, key, user, or error text.

## Deterministic backup

Gracefully stop `ops:start`, then create and verify one combined backup set:

```sh
nice -n 10 npm run ops:backup -- \
  --runtime-root "$RUNTIME" \
  --destination /backup/biochemical/backup-001

nice -n 10 npm run ops:verify-backup -- \
  --runtime-root "$RUNTIME" \
  --backup /backup/biochemical/backup-001
```

Backup atomically acquires owner-token `backup` locks for both state roots and holds both until the combined manifest is durable. Runtime startup uses the same exclusive lock names with role `runtime`, so start/backup races fail closed. Locks are fully written before one atomic rename publishes them. A well-formed stale lock is not automatically removed; inspect its PID, role, and token, prove the process is gone, then remove it explicitly. Backup rejects symlink ancestors or entries, hardlinks, special files, changing files using bigint inode/size/nanosecond statistics, unsafe CAS/chunk names, digest mismatch, non-empty staging, PEM private keys, secret-bearing filenames, and exact configured secret bytes.

Backups are directories, not implicitly encrypted archives. Place them on immutable/encrypted storage with deployment-defined retention, replication, access logging, and deletion controls.

## Restore and disaster recovery

Restore only to an absent or empty target. The original active roots and backup remain untouched:

```sh
nice -n 10 npm run ops:restore -- \
  --runtime-root "$RUNTIME" \
  --backup /backup/biochemical/backup-001 \
  --target /var/lib/biochemical-restore

nice -n 10 npm run ops:start -- \
  --runtime-root "$RUNTIME" \
  --state-root /var/lib/biochemical-restore
```

Restore creates one sibling staging generation containing both `database-state` and `inference-state`. It copies and fsyncs every file, fsyncs every directory, verifies both manifests, writes and fsyncs `.biochemical-restore.json`, and publishes the pair with one same-filesystem rename followed by a parent-directory fsync. A crash before that rename leaves the requested target absent. SQLite verification runs full `PRAGMA integrity_check`, `foreign_key_check`, exact `user_version`, and SQLite-to-filesystem CAS closure checks for all eight databases. Database readiness revalidates every mounted domain, PGlite migration/schema constraints, private-state snapshots, derived CAS replay, and revalidation state.

The automated disaster-recovery and upgrade rehearsal performs two complete database+inference starts and graceful stops, for four actual process restarts:

```sh
nice -n 10 npm run ops:dr-test -- \
  --runtime-root "$RUNTIME" \
  --backup /backup/biochemical/backup-001 \
  --target /var/lib/biochemical-dr-rehearsal \
  --candidate-inference-repo /srv/deployments/candidate/biochemical-inference \
  --candidate-database-repo /srv/deployments/candidate/biochemical-db \
  --candidate-inference-commit "$(git -C "$INFERENCE_REPO" rev-parse 'HEAD^{commit}')" \
  --candidate-database-commit "$(git -C "$DATABASE_REPO" rev-parse 'HEAD^{commit}')" \
  --prior-inference-repo /srv/pinned/biochemical-inference-5e8b108e99fb \
  --prior-database-repo /srv/pinned/biochemical-db-ca3153802bbc
```

The pinned fixture commits are `biochemical-inference@5e8b108e99fbab317da658051af4e518dbc15b83` and `biochemical-db@ca3153802bbc72e897f70c697256fa40283d3a28`; CI checks out, verifies clean worktrees, installs, and builds those exact sources. They are not a coordinated historical deployment: the first committed database server has a broken `closeStores` import and does not expose every API expected by the inference commit. The provenance-covered `scripts/operations/prior-database-server.js` corrects only that entrypoint import, opens the pinned old PGlite implementation against an isolated fixture namespace seeded from the untouched knowledge index, and closes it through the old module's real `closeStores`. Old inference runs against its checked-in immutable upstream fixtures while opening the restored SQLite roots. This is explicitly a pinned binary/check-out fixture rehearsal, not evidence of a previously shipped release.

The rehearsal consumes both schema baselines, restores the untouched backup into `upgrade`, starts the candidate so SQLite/PGlite migrations and all application/CAS closures run, then restores a separate `rollback` pair and starts both pinned fixture binaries. It rechecks the complete restored SQLite/FK/user-version/CAS closure after old-binary shutdown. Four real service-process restarts occur. Never point the old PGlite binary at candidate-mutated private/candidate schemas.

## SBOM and provenance

After both exact commits are built, create one canonical context that records both commit IDs/remotes, both workflow hashes, tree digests and byte counts for database `dist`, inference `dist`, and `server-dist`, and the observed Node/npm/runner environment. Then generate and verify each repository offline:

```sh
nice -n 10 node scripts/operations/provenance-context.js /tmp/build-context.json \
  --inference-repo "$INFERENCE_REPO" --database-repo "$DATABASE_REPO"
nice -n 10 npm run supply-chain:generate -- /tmp/inference-attestations --context /tmp/build-context.json
nice -n 10 npm run supply-chain:verify -- /tmp/inference-attestations --context /tmp/build-context.json

nice -n 10 npm --prefix "$DATABASE_REPO/service-js" run supply-chain:generate -- /tmp/database-attestations --context /tmp/build-context.json
nice -n 10 npm --prefix "$DATABASE_REPO/service-js" run supply-chain:verify -- /tmp/database-attestations --context /tmp/build-context.json
```

Each output is owner-marked. Regeneration may delete only a marker-valid directory containing the fixed evidence-file closure; an unmarked path or unknown entry is left untouched and fails closed. CI pins all actions by full SHA on `ubuntu-24.04`, signs the build/evidence archives through GitHub artifact attestations (OIDC/Sigstore), uploads the signed provenance to the transparency service, and uploads the context, SBOMs, checksums, provenance, and exact built artifacts as one retained workflow artifact.

## Environment decisions

Before production promotion, operators still must provide a TLS/reverse-proxy and network policy if loopback is insufficient; an encrypted secret/backup system; storage capacity and IOPS targets; retention/RPO/RTO; monitoring thresholds and alert routing; service-manager definitions and OS user/group ownership; npm mirror/proxy policy; optional Ollama endpoint/model capacity; and signing/transparency infrastructure for generated provenance. None can be selected safely from the source tree alone.
