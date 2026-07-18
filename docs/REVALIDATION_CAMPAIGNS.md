# Revalidation Campaigns

## Status

The inference-owned Goal 15 implementation includes strict producer-plan
verification, a bounded durable local campaign engine, signed producer event
and key-lifecycle verification, durable producer receipts, a no-store v13 API,
and a responsive review-facing workbench. The declared scale campaign is now
complete.

Execution success is only a software state. Every accepted result carries a
separate scientific conclusion such as `not-evaluated`, `review-required`,
`failed`, or `supported-within-boundary`. Completing a campaign never accepts,
invalidates, or upgrades a scientific conclusion.

## Producer Verification

`shared/revalidation-contracts.js` independently declares the strict producer
wire shapes. Runtime and tests do not import source from `biochemical-db`.

`server/revalidation/verification.js` requires bounded fatal UTF-8 and exact
RFC 8785 bytes, rejects unknown fields, and recomputes node, edge, snapshot,
change, change-set, policy, impact, work, and plan SHA-256 identities. Snapshot
verification requires exact ordered roots, complete dependency counts, no
dangling edges, no unreachable nodes, and no cycles.

`server/revalidation/planning.js` independently traverses class-compatible
reverse dependency edges. It chooses shortest routes and UTF-8-ordered path
ties, then rebuilds all and only the ordered impacts and work items. Packaging
and trust changes do not become scientific changes.

The vendored fixture at
`server/revalidation/fixtures/goal11-producer-golden.json.gz.base64` decompresses
to 19,976 canonical bytes with SHA-256
`175f05ac74f717a9d48555a554a1074e2118ff98e01034dcea27a090d745627d`.
Its action-bearing work rules match the current producer contract: `verify`,
`recompute`, `reproduce`, and `review` are part of work identity.

| Producer object | Identity |
| --- | --- |
| Dependency snapshot | `sha256:a2de0e96c103476b619e42e961dec0b6686d7866685c724dd6502f3727ab9071` |
| Normalized change set | `sha256:501c6fb6f9711cc9378878eb556fb4b5fe17cba25a7dfcacea56e362d7068e72` |
| Impact policy | `sha256:a58a6ae14d401337b222e8067a9480086e737c1c2878253b3e295beec3799147` |
| Impact plan | `sha256:81be31afd9906e4cdea733efbbf414fce4882032a9d2dbde6ffbba935c36b600` |

## Campaign Specification

Executable campaign specification version `2.0.0` binds:

- the verified producer plan and ordered producer work IDs;
- the producer campaign identity, name, and reason;
- canonical snapshot, change-set, policy, and plan CAS artifacts;
- any additional immutable executor inputs;
- the exact uniform producer resource profile;
- ordered expected-artifact-class to allowlisted-executor mappings;
- checkpoint permission per executor binding;
- maximum concurrency, canonical output bytes, and lease duration; and
- maximum attempts, exponential backoff bounds, and explicit ordered retryable
  failure codes.

Concurrency cannot exceed bound CPU cores, output cannot exceed bound scratch
capacity, and every producer work item must use the exact campaign profile. The
specification and its input index are immutable SQLite rows and canonical CAS
objects. Multiple campaigns may reference the same producer work ID; queue and
accepted-result uniqueness is scoped to the immutable campaign/work pair.

The foundation-only fixture specification identity is
`sha256:f16974819e2096a82662f69125e629211eb36ba0d1567cda028df3beb66e3b52`.
The lifecycle test's fully materialized campaign identity is
`sha256:33d6c86f88583e1bf59f0fe9522da17dcf3609dab28bc6c85a7574b523ebabe2`.

## Storage Root

`server/revalidation/service.js` uses `BIOCHEMICAL_REVALIDATION_ROOT`, an
explicit `root` option, or the external default
`~/.local/share/biochemical-inference/revalidation-v1`. Resolved roots inside
the source tree fail before database or object creation. Directories and staged
objects use owner-only permissions.

The engine has a separate `revalidation.sqlite3` database configured with:

```text
PRAGMA foreign_keys = ON
PRAGMA journal_mode = WAL
PRAGMA synchronous = FULL
PRAGMA busy_timeout = 5000
```

Campaign specifications, input indexes, accepted results, and checkpoints have
update/delete rejection triggers. CAS publication writes and syncs a staging
file, atomically renames it, syncs the destination directory, and verifies every
read by SHA-256. A separate SQLite `BEGIN EXCLUSIVE` owner lock is held for the
engine-root lifetime. A second process therefore fails before it can clear
storage reservations or recover another process's leases; OS lock release after
process death still permits the explicit restart recovery drill.

## State Machine

Campaigns transition from `active` to `terminal` only when every work item is
terminal. Work follows:

```text
queued -> leased -> running -> terminal
                    |            |
                    +-> queued ---+  retryable failure with attempts remaining
```

Each runtime-safe lease outlives the declared worker runtime, renews while its
worker remains healthy, and expires automatically without an API call. Late
results are rejected. Each lease creates exactly one deterministic, monotonic attempt identity from
campaign ID, producer work ID, and attempt number. Attempt rows progress from
`leased` to `running` to `terminal`; terminal attempts are retained. Lease
expiry, worker exit, and process restart terminalize the abandoned attempt and
requeue only when the explicit retry policy permits it.

Queued cancellation terminalizes immediately. Leased/running cancellation sets
the durable request before interrupting the worker. Result acceptance checks
cancellation again inside the same immediate transaction, so either the result
or cancellation wins, never both. Campaign cancellation applies the same rule
to every nonterminal work item.

## Workers And Resources

`server/revalidation/execution.js` forks workers with a PID-ready handshake,
polled process-RSS ceiling, V8 heap ceiling, hard runtime timer, bounded request,
and bounded response. Campaign logical storage and process-level concurrency are
also enforced. CPU cores are reported only as a concurrency ceiling because no
OS affinity or CPU-time quota is installed. Workers receive no code path, command, module,
network endpoint, or arbitrary executable from campaign input.

Reports claim RSS and runtime enforcement only after at least one isolated
worker attempt has persisted both measurements. Execution mode, peak RSS, and
runtime are immutable attempt and accepted-result evidence; restart reporting
uses those rows rather than the currently configured executor. Migrated rows
without historical mode evidence are explicitly `unrecorded`. Injected inline
execution is identified as `inline-evidence-only`; it can prove
campaign/HTTP/ledger closure but is not resource-enforcement acceptance
evidence.

The allowlist currently contains:

- `closure-verification@1.0.0`, which verifies the bound closure and reports
  execution success with scientific conclusion `not-evaluated`; and
- `test-deterministic@1.0.0`, which is rejected unless `NODE_ENV=test` and
  supports only a strict finite test-control schema.

There is no shell executor, plugin loader, cloud scheduler, distributed lease,
or user-supplied code execution.

## Results And Checkpoints

Workers return a strict technical status, separate scientific conclusion, and
JSON output. The engine constructs the result identity from campaign, producer
work, executor version, complete ordered input digest closure, conclusion, and
output. Attempt identity and timestamps are deliberately excluded, so exact
redelivery has the same result identity.

The lifecycle golden result identity is
`sha256:9011220cf254366077418e670a45c297aa962561e21aa54ab491e6bbfa9281f2`.

Result bytes enter CAS before one immediate transaction inserts the immutable
accepted result and terminalizes work. A unique campaign/work constraint allows
exact idempotent redelivery but rejects conflicting redelivery. Cancellation is
rechecked before insertion.

Continuation checkpoints are accepted only for bindings declaring
`exact-input-closure`. Their compatibility identity binds campaign, work,
executor, resource profile, and every ordered input digest. Checkpoint state is
canonical CAS content. Other work classes forbid continuation. A restart always
revalidates compatibility before passing state to a worker.

## Restart And Integrity

Startup verifies all campaign specification and input CAS objects, recomputes
the complete producer plan, checks exact queue ordering, verifies monotonic
attempt identities and active lease bindings, validates checkpoints, and checks
every accepted result artifact and one-result cardinality. Only then can
completed work be reused.

Leased or running attempts owned by a stopped process become `worker-lost` and
follow the declared retry policy. A crash after result CAS publication but
before SQLite acceptance leaves an unreferenced immutable object; rerun
recomputes the same result and only one row can be accepted. Corrupt input,
checkpoint, specification, or result artifacts fail startup/integrity closed.

## Producer Trust And Receipts

`server/revalidation/client.js` accepts only an exact HTTP loopback producer
origin. Every request carries the deployment-held exact Origin and the
role-specific author or executor bearer credential;
responses must be canonical JSON with `cache-control: no-store`,
`pragma: no-cache`, and no ETag. The browser receives none of these producer
credentials.

The client pins an independently configured Ed25519 bootstrap key. It verifies
event identity, signature, sequence, previous digest, actor role, signed
historical role-policy identity, and activation,
rotation, retirement, or revocation boundary before trusting a transition.
Historical head verification also rebuilds the complete key, campaign, outcome,
and scientific-label projection and compares it byte-for-byte with producer
state at that head. Technical reports perform this producer-head/materialized
state verification before projecting campaign-specific label counts.

Campaign and outcome requests are persisted with their exact receipts and signed
events in immutable SQLite tables. Restart verifies the stored chain, each
campaign and outcome relation, the latest local head pin, and the producer's
historical replay before reconciliation resumes. Outcome submission is exact and
idempotent per producer campaign/work identity, including retries after key
rotation. Producer labels are never authored by
this consumer and a recorded outcome must initially remain unlabeled.

Required inference settings are:

```text
BIOCHEMICAL_REVALIDATION_URL
BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN
BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN
BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN
BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID
BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY
BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID
BIOCHEMICAL_REVALIDATION_ROOT
BIOCHEMICAL_REVALIDATION_CURSOR_SECRET
```

The URL must be `http://127.0.0.1:<port>` or `http://[::1]:<port>`. The allowed
origin and both distinct bearer credentials must exactly match the producer
configuration. The client follows the newest active signed key lifecycle state
and retries a conflicting write after refreshing that chain. Private signing
keys remain exclusively in the producer runtime.

The sibling Node runtime separately requires
`BIOCHEMICAL_JS_REVALIDATION_STATE_PATH`,
`BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_PUBLIC_KEY`,
`BIOCHEMICAL_JS_REVALIDATION_BOOTSTRAP_KEY_ID`,
`BIOCHEMICAL_JS_REVALIDATION_SIGNER_KEYRING`,
`BIOCHEMICAL_JS_REVALIDATION_ROLE_POLICY`,
`BIOCHEMICAL_JS_REVALIDATION_ROLE_POLICY_SHA256`,
`BIOCHEMICAL_JS_REVALIDATION_PLAN_PROFILE=goal15-scale-v1`,
`BIOCHEMICAL_JS_REVALIDATION_CURSOR_SECRET`,
`BIOCHEMICAL_JS_REVALIDATION_ALLOWED_ORIGIN`,
`BIOCHEMICAL_JS_REVALIDATION_AUTHOR_BEARER_TOKEN`,
`BIOCHEMICAL_JS_REVALIDATION_AUTHOR_ACTOR_ID`,
`BIOCHEMICAL_JS_REVALIDATION_EXECUTOR_BEARER_TOKEN`, and
`BIOCHEMICAL_JS_REVALIDATION_EXECUTOR_ACTOR_ID`. Keyring and role-policy files must
be canonical, externally provisioned material; the state path must be the
runtime's dedicated `revalidation-state-v1` directory.

## API And Workbench

All `/api/v13/revalidation` responses are no-store and omit ETags. Campaign
creation, reconciliation, and cancellation require a startup-allowlisted browser
Origin plus `x-biochemical-csrf: revalidation-campaign-v1`. The nine routes
cover status, campaign list/create/detail/reconcile/cancel, a separate campaign
report, integrity, and the locally persisted signed event audit. Campaign detail
uses a signed snapshot-bound `limit`/`cursor` projection with a maximum page of
100; a cursor fails if queue, attempt, checkpoint, or receipt state changes.

The workbench displays immutable local and producer campaign identities, signed
head pins, technical progress, failure/resource/cancellation counts, impact
classes, attempts, checkpoints, and producer receipt coverage. Technical
execution and scientific review are separate visual lanes. There is no browser
operation for labeling, accepting, invalidating, or upgrading a conclusion.

## Scale Acceptance Evidence

`server/revalidation/scale-campaign.js` independently regenerates the sibling
producer topology and pins the same snapshot, change-set, policy, plan, and
ordered work identities:

| Object | Identity |
| --- | --- |
| Dependency snapshot | `sha256:97747e9efa483b6dfe980eafd9aac71e641237b59ba93014647e24bfe48f9dfc` |
| Change set | `sha256:a9585aaf4eb1636252d6f90ac8cbe5740e7a8bc436fd301d03b33c8de3764fa0` |
| Impact policy | `sha256:d8b572f17b9a44781715b2d2b647e99f7448bbdb82a1614edfd576ff215a3e84` |
| Impact plan | `sha256:92c376fd835b2a13183908c457964483b8ae0fb976e6e0414848047510fc0241` |
| Local executable campaign | `sha256:954baa5a841060dce0ab1d8b41ddb75e0fc47bf9b06686607cd308dfeaf7e692` |
| First / last work | `sha256:00096428bcdc71982d55f97d1701c1b2a83c60022a5335495e9caabe64289b55` / `sha256:ffcd35e58a308b3eada422dc95f8bcb2b94e281d5458a483c1493ea3de0f9cb7` |

The campaign contains 384 direct runs, 320 transitive assertions, and 320
transitive reports. All 1,024 are selected; all 64 registration-like controls
are excluded. The acceptance drill uses a real subprocess and forked worker,
waits for `running`, then sends `SIGKILL` to the process group. Restart records
that abandoned attempt as `worker-lost`. The pinned recovery work IDs are:

| Recovery | Work identity |
| --- | --- |
| Lease expired | `sha256:00096428bcdc71982d55f97d1701c1b2a83c60022a5335495e9caabe64289b55` |
| Process/worker lost | `sha256:00630aa9546004f4a01d4e8c8c1486a66de316eb99339452ca292689be21be6f` |
| Transient retry | `sha256:0070f3bbc7d3f2d0849e674f6c9005c55c7ee0d7533a623506d4dfd1d6249ca5` |

The local interruption profile is 1,024 succeeded work IDs, 1,027 attempts, three retries
(one each for `lease-expired`, `worker-lost`, and `transient`), and exactly
1,024 immutable accepted results with no duplicate, missing, or non-success
bindings. `limit=1` pagination equals the full ordered projection. A separate
campaign exercises queued and crash-atomic campaign cancellation. Exact result redelivery is
idempotent, conflicting redelivery is refused, and a deliberately corrupted CAS
result makes integrity fail until the exact bytes are restored.

The declared resource profile is 2 CPU cores, 1,024 MiB memory, 256 MiB scratch,
900 seconds maximum work runtime, concurrency 2, output limit 256 KiB, and a
901-second runtime-safe lease. The 2026-07-18 local acceptance measurement stored
1,030 campaign-specific CAS objects / 3,746,131 object bytes and 3,668,105
logical bytes, a 5,296,128-byte SQLite file, and a 4,190,072-byte WAL. Its
isolated workers recorded a 69,902,336-byte peak RSS. The executable gate
enforces ceilings of 16 MiB logical CAS
bytes and 256 MiB combined SQLite/WAL so routine CI remains bounded. The 1,024
worker results use an injected deterministic test executor; one real forked
worker is retained for the actual PID-ready kill/restart evidence. The separate
cross-repository gate loads the configured plan through bounded HTTP pages and
submits all 1,024 outcomes through at most 100-item TCP HTTP batches, closing the
producer ledger at exactly 1,029 signed events. Producer plan/outcome/event APIs
and the local work/event APIs all cap pages at 100.

Separate worst-case planner gates use 10,000 changes sharing one anchor/class and
the schema maximum of 100,000 edges, selecting one real 10,000-reason impact.
The total materialized reason closure is capped at 100,000 and larger policies
fail before reason expansion. Traversals are grouped by anchor/class and edge
class before projection, preventing one full graph scan per repeated change.
Producer campaign/work/outcome verification maps persist across bounded
requests, and signed event persistence validates every overlapping suffix event,
not only the prior head. On the same local run, the producer planner gate took
2.257 seconds, the consumer planner gate took 1.149 seconds, the isolated
1,024-work gate took 9.173 seconds, and reciprocal cross-repository HTTP took
22.962 seconds; the complete inference revalidation acceptance command took
36.033 seconds.

The cross-repository workflow requires `BIOCHEMICAL_DB_GOAL15_REF` as a
40-character repository variable and checks out that exact producer commit. The
workflow and HTTP runner also pin revalidation contract version `1.0.0`; an
unset or mutable sibling ref and contract drift fail before acceptance. The
producer workflow reciprocally requires `BIOCHEMICAL_INFERENCE_GOAL15_REF`,
verifies the exact checked-out SHA, and runs the same real cross-repository gate.

The technical report is separate from `scientific_review`. Active campaigns
report pending technical execution and do not claim a review requirement;
terminal campaigns report `support: unsupported`, `review_required: true`, and
`automatically_accepted: false`. Refreshed producer labels are counted from the
verified producer materialization only for their exact campaign unless an
independent scientific reviewer acts. CAS object counts likewise use only the
specification, inputs, results, and checkpoints referenced by that campaign.

```sh
timeout --signal=TERM --kill-after=15s 60s nice -n 10 npx vitest run tests/revalidation/planning-performance.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx vitest run tests/revalidation/scale-acceptance.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx vitest run tests/revalidation/cross-repo-scale-http.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx playwright test tests/e2e/revalidation.spec.js --workers=1
```
