# Landing Manifest

This manifest inventories the intended `biochemical-inference` worktree changes
observed on 2026-07-18 at base `5e8b108e99fbab317da658051af4e518dbc15b83`.
It is a planning record only: do not stage from the current mixed worktree.
Reconstruct each increment in a clean worktree and split the shared tracked
files by feature hunk.

`path/**` means every currently untracked descendant. Each untracked path below
has one owner. This manifest itself belongs to I7.

## Dependency Order

1. I1 migration/runtime retirement consumer changes, after producer I1.
2. I2 Goal 13, after producer I2 and I1 in both repositories.
3. I3 Goal 14 measured atlas, after producer I3 and I1.
4. I4 Goal 14 registration v1.1, after producer I4 and I3.
5. I5 Goal 15 planning/ledger/scale, after producer I5 and I1. It does not
   depend scientifically on Goal 14, but lands after I4 to simplify shared app
   and Playwright integration.
6. I6 operations/supply chain, after I1-I5 in both repositories because its
   readiness, backup, schema, build, and provenance closures cover them all.
7. I7 Goals 16-20 roadmaps and final Goals 11-15 status text, after I2-I6.
8. I8 Python deletion in `biochemical-db` only, after both repositories pass all
   gates and the protected retirement authorization exists.

For every paired increment, land the `biochemical-db` producer commit first,
then pin its exact 40-character commit in the inference acceptance checkout.

## Clean-Checkout Prerequisites

- Start I1 from clean `biochemical-inference@5e8b108e99fbab317da658051af4e518dbc15b83`
  and sibling `biochemical-db@ca3153802bbc72e897f70c697256fa40283d3a28`.
- Use Linux, Node `22.23.1`, npm 10+, `nice`, `/proc/self/fd`, and `npm ci` in
  both this repository and `../biochemical-db/service-js`.
- Keep runtime, SQLite/PGlite, CAS, chunk, key, report, coverage, and Playwright
  output outside both source trees. Start each gate with `git status --short`
  empty except for the increment under review.
- Install Chromium before browser gates. Real tests require loopback ports,
  OpenSSL Ed25519 generation, and explicit run-isolated state roots.
- Do not set `BIOCHEMICAL_DB_GOAL15_REF` or reciprocal refs until the producer
  commit exists. The value must be an exact immutable 40-character SHA.

## I1 Migration And Runtime Retirement

Tracked files:

- `docs/ARCHITECTURE.md`, `docs/DATA_PLANE.md`,
  `docs/DERIVED_KNOWLEDGE.md`, `docs/EVIDENCE_PANEL.md`
- `server/derived/client.js`, `server/derived/fixture.js`,
  `server/data-plane/service.js`,
  `server/evidence/client.js`, `server/evidence/fixture.js`,
  `server/measured/service.js`,
  `server/knowledge/client.js`, `server/parameters/client.js`,
  `server/physiology/client.js`, `server/physiology/service.js`,
  `server/spatial/client.js`, `server/workspace/service.js`
- `shared/derived-contracts.js`, `shared/evidence-contracts.js`
- `src/components/EvidencePanel.vue`, `src/components/ReviewWorkbench.vue`
- `tests/api/derived-api.test.js`, `tests/component/evidence-panel.test.js`,
  `tests/component/review-workbench.test.js`, `tests/e2e/derived.spec.js`,
  `tests/e2e/measured.spec.js`, `tests/measured/client-and-service.test.js`,
  `tests/unit/derived-client.test.js`, `tests/unit/evidence-client.test.js`

Untracked files: none.

Tests:

```sh
nice -n 10 npx vitest run tests/api/derived-api.test.js tests/component/evidence-panel.test.js tests/component/review-workbench.test.js tests/measured/client-and-service.test.js tests/unit/derived-client.test.js tests/unit/evidence-client.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npm run check:syntax
nice -n 10 npm run build
nice -n 10 npx playwright test tests/e2e/derived.spec.js tests/e2e/measured.spec.js --workers=1
```

## I2 Goal 13

Exclusive files:

- `docs/CHALLENGE.md`
- `server/challenge/**`, `shared/challenge-contracts.js`
- `src/components/ChallengeWorkbench.vue`
- `tests/api/challenge-api.test.js`, `tests/challenge/**`,
  `tests/component/challenge-workbench.test.js`, `tests/e2e/challenge.spec.js`,
  `tests/fixtures/challenge.js`, `tests/unit/challenge-api.test.js`
- Tracked Goal 13 model changes: `server/apap/client.js`,
  `server/apap/model.js`

Expected pins: release `apap-human-pk-challenge-v1.0.0`; release
`3c1c7e50b8b9e10b9912802e471a07d9df50ee5088b441784fb39e441663ffb7`;
catalog `7c825c04df71a33525cb224c1237531784d3e2da93498e7961943543e4a2ef3b`;
trust `36daef48ccd9a3fa412caed0082fa72e61eaf676babc6ca802174a4c56a30b3b`;
manifest `07ac5f559167d71f2eea142992090fa5332f2ce79682290595db8a41baa2e7f0`;
envelope `474eca34b532b49fb666f9d3f04a58e67b20b0ce9740af120637ad40c9c4bb05`;
partition `aaba147a203d1b43055a273b1a7a7fb076015377084defe5172d2a38ddcb8cd9`.

Tests:

```sh
nice -n 10 npx vitest run tests/api/challenge-api.test.js tests/challenge/consumer.test.js tests/component/challenge-workbench.test.js tests/unit/challenge-api.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx playwright test tests/e2e/challenge.spec.js --workers=1
```

## I3 Goal 14 Measured Atlas

Exclusive files:

- `docs/MEASURED_SPATIAL_ATLAS.md`, `docs/MEASURED_SPATIAL_PLAN.md`
- `server/measured-spatial/**`, `shared/measured-spatial-contracts.js`
- `src/components/MeasuredSpatialLiverAtlas.vue`
- `tests/api/measured-spatial-api.test.js`,
  `tests/component/measured-spatial-liver-atlas.test.js`,
  `tests/e2e/measured-spatial.spec.js`,
  `tests/unit/measured-spatial-api.test.js`,
  `tests/unit/measured-spatial-verification.test.js`

Expected pins: release
`9b4ea920b9daa49f23aefe453b88fcd0b13f92dd50c5ebb168c7809d78c22b1b`;
catalog `8d9197c2f3c964a82392e871efc12b063b46228b4d33e3203aa8528af83eb845`;
trust `f438a720972edf576a37ee12103eac949b84d942126ea97bbd97b40c0f83813f`;
manifest `3a3409e44df84e200e074760bfda4197ec8673dd5bf79b37167b2b83aaf850c0`;
inventory `fac42ad9b6796d62933dd0b370113404d0c1cb51a4776ebd3c63d20775fcbb9a`;
400 chunks; source archive
`6f7cbd8a7236a78c47a14c3259d387439c0dc0284b2a83fa955f8c49efe11761`.

Tests:

```sh
nice -n 10 npx vitest run tests/api/measured-spatial-api.test.js tests/component/measured-spatial-liver-atlas.test.js tests/unit/measured-spatial-api.test.js tests/unit/measured-spatial-verification.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx playwright test tests/e2e/measured-spatial.spec.js --workers=1
```

## I4 Goal 14 Registration V1.1

Exclusive files:

- `docs/SPATIAL_REGISTRATION.md`
- `server/spatial-registration/**`, `shared/spatial-registration-contracts.js`
- `src/components/SpatialRegistrationWorkbench.vue`
- `tests/api/spatial-registration-api.test.js`,
  `tests/component/spatial-registration-workbench.test.js`,
  `tests/e2e/spatial-registration.spec.js`,
  `tests/unit/spatial-registration-verification.test.js`

Expected pins: release `learn2reg-abdomen-mrct-0001-registration-v1.1.0` at
`cb8c615c145dbc0a31cd1e1c3786eac2031daeae6164839b0b6dd770ab6b441c`;
catalog `876305624bea41a6f629a8ed26d12b5359874354828020409cc6133603238340`;
trust `07081bb05e590c7041d89902452e6f8ea41ffb04c000fa8cb5b93180ef3bb9a3`;
manifest `9375478cac0bd9452b1407e01e12ebfd44e41a02572d065126b5888e1e1300e4`;
inventory `7d0d6587bbd66ab71dfcc15715c881de3f2ff53c620941ccc815df439db2b0e2`;
304 chunks; source package
`5c8272429f0465c37b2ae2a276bd901932099f4b219363b8ad2d93ef2497c426`.

Tests:

```sh
nice -n 10 npx vitest run tests/api/spatial-registration-api.test.js tests/component/spatial-registration-workbench.test.js tests/unit/spatial-registration-verification.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npx playwright test tests/e2e/spatial-registration.spec.js --workers=1
```

## I5 Goal 15 Planning, Ledger, And Scale

Exclusive files:

- `.github/workflows/goal15.yml`, `docs/REVALIDATION_CAMPAIGNS.md`
- `server/revalidation/**`, `shared/revalidation-contracts.js`
- `src/components/RevalidationCampaignWorkbench.vue`
- `tests/acceptance/revalidation-process.test.js`,
  `tests/api/revalidation-api.test.js`,
  `tests/component/revalidation-campaign-workbench.test.js`,
  `tests/e2e/revalidation.spec.js`, `tests/fixtures/bounded-process.js`,
  `tests/fixtures/e2e-global-teardown.js`,
  `tests/fixtures/revalidation-e2e-runtime.js`,
  `tests/fixtures/revalidation.js`, `tests/revalidation/**`,
  `tests/unit/bounded-process.test.js`, `tests/unit/revalidation-api.test.js`

Expected pins: contract `1.0.0`; profile `goal15-scale-v1`; snapshot
`sha256:97747e9efa483b6dfe980eafd9aac71e641237b59ba93014647e24bfe48f9dfc`;
change set `sha256:a9585aaf4eb1636252d6f90ac8cbe5740e7a8bc436fd301d03b33c8de3764fa0`;
policy `sha256:d8b572f17b9a44781715b2d2b647e99f7448bbdb82a1614edfd576ff215a3e84`;
plan `sha256:92c376fd835b2a13183908c457964483b8ae0fb976e6e0414848047510fc0241`;
1,024 work items, 1,027 attempts, and 1,029 producer events.

Tests:

```sh
nice -n 10 npx vitest run tests/revalidation/campaign-engine.test.js tests/revalidation/producer-integration.test.js tests/revalidation/consumer-foundation.test.js tests/api/revalidation-api.test.js tests/unit/revalidation-api.test.js tests/component/revalidation-campaign-workbench.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npm run test:acceptance:revalidation
nice -n 10 npx playwright test tests/e2e/revalidation.spec.js --workers=1
```

## I6 Operations And Supply Chain

Exclusive files:

- `.github/workflows/certification.yml`, `.github/workflows/operations.yml`,
  `docs/OPERATIONS.md`
- `operations/**`, `scripts/deployment-archive.js`, `scripts/operations.js`,
  `scripts/operations/**`, `scripts/supply-chain.js`,
  `scripts/test-selection.js`, `test-selection.json`
- `server/operations/**`
- `tests/acceptance/operations-process.test.js`,
  `tests/acceptance/operations-supervisor.test.js`,
  `tests/api/operations-api.test.js`, `tests/unit/operations.test.js`,
  `tests/unit/test-selection.test.js`

Expected pins: Node `22.23.1`; prior inference
`5e8b108e99fbab317da658051af4e518dbc15b83`; prior database
`ca3153802bbc72e897f70c697256fa40283d3a28`; the schema baseline must retain
the exact eight inference roots and sibling database baseline.

Tests:

```sh
nice -n 10 npx vitest run tests/unit/operations.test.js tests/api/operations-api.test.js tests/unit/test-selection.test.js --maxWorkers=1 --no-file-parallelism
nice -n 10 npm run test:acceptance:operations
nice -n 10 npm run build
```

## I7 Goals 16-20 Roadmaps

Files: `docs/NEXT_GOALS_16_20.md`, `docs/LANDING_MANIFEST.md`, and the Goal
13-15 status/evidence hunks in tracked `docs/NEXT_GOALS_11_15.md`.

The 2026-07-17 BRENDA, BioModels, standards, NCBI/PMC, and Crossref survey
entries are research prerequisites, not source locks or accepted scientific
pins. Keep every Goal 16-20 status `Pending`.

Tests:

```sh
nice -n 10 npm run check:syntax
nice -n 10 npx vitest run tests/component/app-hardening.test.js --maxWorkers=1 --no-file-parallelism
```

## I8 Python Deletion Last

No inference file is deleted. After the producer's authorized deletion-only
change, rerun the consumer against that exact producer checkout:

```sh
nice -n 10 npx vitest run --maxWorkers=1 --no-file-parallelism
nice -n 10 npm run build
nice -n 10 npx playwright test --workers=1
```

## Shared Tracked Files Requiring Hunk Splits

Never land these as whole files from the mixed tree:

- `README.md`: I1 runtime startup, I2 challenge, I5 revalidation, I6 operations.
- `package.json`: I5 acceptance scripts and I6 operations/supply-chain scripts;
  retain I1 routine scripts with the first matching implementation.
- `playwright.config.js`: I1 integrated producer, I2 challenge, I3 atlas, I4
  registration, I5 revalidation/global teardown.
- `server/app.js`, `server/index.js`, `src/App.vue`, `src/api.js`,
  `tests/api/app.test.js`, `tests/check-syntax.js`,
  `tests/component/app-hardening.test.js`: split route/component/runtime hunks
  into I1-I6 by imported domain.

## Never Stage

These dirty tracked files are unrelated whitespace changes in the retired Riot
prototype and are excluded from every increment:

- `docs/tags/compound-listing.riot.html`
- `tags/compound-listing.riot.slim`

No current untracked file is ambiguous or unassigned.
