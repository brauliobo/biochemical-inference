# Entity Mention Atlas simulation handoff consumer

This repository consumes, but does not import or execute, producer code from
`biochemical-db`. The offline importer verifies these independent inputs:

- a complete static Pages release directory closed by `manifest.json`;
- one canonical `nutrient-reaction-atlas/simulation-handoff/v1` document; and
- optionally, one desktop workspace-local Ed25519 signature over the release
  manifest; and
- when present in an actual Pages tree, the distinct `envelope.json` official
  signature schema.

The current release is not import-ready for simulation. Every selected payload
reaches conditional rights records whose public content classes are empty, and
there is no closed machine-verifiable rights-disposition artifact. Producer and
consumer therefore reject the candidate with an external legal blocker; neither
side infers permission from `conditional`.

The exact supported release is pinned in
`server/entity-mention-handoff/pins.js`. The pin includes the serving manifest,
Entity Mention release identity, static manifest, and every file needed to
verify the MTHFR/folate selection. The complete 1,699-file release closure,
including `manifest.json`, is checked and retained in the consumer CAS.
The consumer independently derives every canonical, linked, type-index,
article-index, fixed-shard, JSON-LD, and N-Quads record count from canonical
record families; agreeing declarations in both producer manifests are not
accepted as evidence of their own correctness.

## Trust labels

- `workspace-local-unsigned` means canonical bytes and all pinned SHA-256 tree
  closures verified. It does not identify a signer.
- `workspace-local-signed` additionally means a self-contained workspace-local
  Ed25519 signature verified. Its embedded key is self-asserted and is not an
  official producer authority.
- The strict Pages `envelope.json` schema is implemented separately from local
  signatures, but there is no official trust: the production public-key/key-ID
  pin is absent, so an official envelope fails closed as unsupported.

## Locally implemented contract

Phase 8 implemented the offline import, reopen, and simulation contract. That
contract is not current-release acceptance. The following commands are usable
only with an independently pinned release whose exact selected rights are
explicitly public or carry complete reviewed immutable dispositions. They reject
the current release and retained unauthorized regression handoff.

```sh
node scripts/entity-mention-handoff.js import \
  --release /path/to/static-release \
  --handoff /path/to/handoff.json \
  --store /path/to/consumer-store

node scripts/entity-mention-handoff.js reproduce \
  --store /path/to/consumer-store \
  --import-id sha256:<import-digest>

node scripts/entity-mention-handoff.js simulate \
  --store /path/to/consumer-store \
  --import-id sha256:<import-digest> \
  --preset baseline \
  --mthfr-activity 1 \
  --duration-hours 1 \
  --step-hours 0.05
```

Add `--signature /path/to/local-signature.json` only for an actual desktop
workspace-local signature. Import uses hard-link no-replace publication through
the existing data-plane CAS. Stored indexes contain relative logical paths and
content digests only, never source or host paths.

Reopen verifies the complete stored byte closure again and derives its returned
release and trust identity from those verified bytes. Duplicated import-root
release, manifest, Entity Mention release, handoff, and trust fields must agree
exactly but are never treated as authority.

For a separately authorized local synthetic fixture, `simulate` accepts
numerical intent only. The verified import supplies the
release identity, human taxon, liver/cytosol context, reaction identity,
catalyst protein, and evidence-bound network. Release, taxon, context, and
network overrides are rejected.

## Golden certification

`tests/fixtures/entity-mention-handoff-producer/provenance.json` records the
producer source parent commit, the complete authoritative generator source-file
hash set, exact generator commands, informational tool versions, deterministic
timestamp policy, static release/tree/archive identities, and the complete
actual-build knowledge/source input map. The prior positive handoff identity is
retained only under `rejected_historical_handoff`. Compatibility is
the producer package's Node 22 engine range; output bytes and source hashes are
authoritative. The parent commit is an ancestry
anchor, not a claim that the hash-pinned generated state was a clean commit.
`npm run test:certification:producer` validates source and builder-input state,
regenerates and byte-compares the static release and normalized archive, invokes
the actual producer handoff CLI and requires its external-rights-blocker failure
with no output, then requires the independent consumer to reject the retained
unauthorized historical handoff. It performs no positive numerical simulation.

Positive acceptance is blocked by unresolved rights. Official trust is also
unavailable. Repository certification is additionally blocked until the
producer changes are committed and
`BIOCHEMICAL_DB_CERTIFICATION_REF` points to that immutable 40-hex commit.
That clean commit may equal or descend from the recorded source parent, but it
must contain every authoritative source file at the recorded hash. Local runs
may validate the explicitly hash-pinned dirty source state without representing
it as a clean commit.

## Scientific boundary

Only an independently authorized future disposition for
`REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION` and its explicit `RHEA:19819`
identity could map into the existing one-carbon simulation. In the local
synthetic contract fixture, the imported
five-participant reaction is not substituted for the model's reduced numerical
topology: hydron, NADPH, and NADP remain visibly omitted, and no unknown disease,
drug, or pathogen relationship becomes a parameter or numerical boundary.

Producer facts and reviewed contextual edges, article mentions, unreviewed
machine assertions, derived consumer inputs, and numerical outputs remain
separate record types. Broad Rhea/Reactome discovery reports and article
co-mentions are verified only as ineligible context; they cannot promote or
support a biological conclusion.
