# Goal 13 External APAP Challenge

## Status

Goal 13 is **Delivered** at the producer-contract, inference-service, browser
consumer, unit/component/service, and real desktop/mobile Playwright layers.
Delivery does not alter the result: the frozen model **failed** the two
evaluable endpoints and remains unsupported outside the exact boundary below.

The active presentation is `src/components/ChallengeWorkbench.vue` in the Vue 3
application. The legacy Riot prototype is intentionally untouched.

## Scientific Boundary

The challenge evaluates only aggregate parent-acetaminophen Cmax for the
reference Ultracet and test Gesico Duo oral formulations in one published study:

- healthy adult male and female subjects aged 18 to 50 years under fasting
  conditions;
- a frozen 325 mg APAP oral-depot input and repository-authored 50 L consumer
  volume normalization;
- the exact published 20-time APAP sampling grid from 0 to 12 hours;
- maximum consumer central parent-APAP concentration on that grid;
- absolute relative error `abs(predicted-measured)/measured`, rounded half-even
  to ten decimal places;
- a repository-authored endpoint threshold of `<= 0.30`, which is explicitly
  not a paper criterion.

No result is a clinical, treatment, dose-selection, safety, diagnosis, or
bioequivalence claim. Passing both endpoints would mean only
`supported-within-boundary`; it would not establish broad model validation.

## Independent Pins

| Object | Identity |
| --- | --- |
| Release | `apap-human-pk-challenge-v1.0.0` |
| Release digest | `3c1c7e50b8b9e10b9912802e471a07d9df50ee5088b441784fb39e441663ffb7` |
| Catalog digest | `7c825c04df71a33525cb224c1237531784d3e2da93498e7961943543e4a2ef3b` |
| Trust digest | `36daef48ccd9a3fa412caed0082fa72e61eaf676babc6ca802174a4c56a30b3b` |
| Manifest digest | `07ac5f559167d71f2eea142992090fa5332f2ce79682290595db8a41baa2e7f0` |
| Envelope digest | `474eca34b532b49fb666f9d3f04a58e67b20b0ce9740af120637ad40c9c4bb05` |
| Retired signer | `goal13-challenge-2026` / `NiSiA9onSkxjUk-nW6iWRnpy5oZrGhXob21Dv6gx8tc` |
| Held-out partition | `partition:external-held-out:zenodo13358906` |
| Partition digest | `aaba147a203d1b43055a273b1a7a7fb076015377084defe5172d2a38ddcb8cd9` |
| Sampling-grid digest | `f3957d19d16bc1e274306ed1a01fd848b3679880d1a995272e766c12a3e5744c` |

The inference client also independently pins all twelve signed public-view
roots. Synchronization rejects a changed value even when the producer supplies
a matching new ETag. Public outcome routes are not traversed during release
synchronization.

## Ownership

`biochemical-db` owns the licensed measured release, source facts and locators,
study and partition identities, protocol, endpoint definitions, mapping,
metric, threshold, exclusions, not-evaluable rules, protected disclosure, and
authoritative result contract.

`biochemical-inference` owns independent pins and verification, the private
local snapshot and immutable artifact store, the frozen APAP execution,
commitment evidence, numerical diagnostics, independent score recomputation,
producer-score comparison, offline replay, integrity verification, and bounded
browser presentation. The browser sends only freeze and disclosure intents; it
does not author a model digest, score, measured value, or conclusion.

## Commit And Disclosure

1. Explicit synchronization retrieves and verifies signed public metadata and
   public records. It does not request observations, commitments, disclosures,
   or results.
2. Freeze constructs content-addressed model, equation-set, parameter-policy,
   concentration-mapping, solver, software, diagnostics, prediction, and
   public-lineage artifacts. The parameter policy records zero held-out reads
   and forbids held-out, model-specific, formulation-specific, and
   post-disclosure fitting.
3. The producer receipt must bind the exact canonical frozen commitment before
   the first outcome read. The UI then shows predictions and a prominent
   statement that measured values, uncertainty, scores, and result are absent.
4. Explicit disclosure returns the two reviewed aggregate observations. The
   consumer verifies their commitment binding, exact ng/mL-to-mg/L conversion,
   disclosure digest, source locators, and immutable storage.
5. The inference service independently scores both endpoints, submits the exact
   result, rejects any producer-score mismatch, and stores one immutable report.

Every same-origin `/api/v11/challenge` response is `private, no-store`, has
`Pragma: no-cache`, and has no ETag. The frontend refuses otherwise valid JSON
when this policy is absent. Mutations and protected run, report, artifact, and
integrity GETs require the fixed browser-origin policy and
`x-challenge-csrf: goal13-challenge-v1`; discovery and status GETs remain
unprotected but no-store. Because standard same-origin GETs omit `Origin`, the
protected read guard validates their same-origin `Referer` against the same
startup allowlist; an explicit `Origin`, when present, takes precedence. The
producer-facing inference client separately uses `x-csrf-token` and must be
configured with the exact same origin and token as the producer.

## Bounded Result

The frozen model predicts `2.9196477028 mg/L` at `1.5 h` for each formulation.
The producer discloses exact reviewed values `5206.095 ng/mL` (`5.206095 mg/L`)
for the reference arm and `4853.221 ng/mL` (`4.853221 mg/L`) for the test arm.
The independently recomputed endpoint results are:

| Endpoint | Absolute relative error | Threshold | Result |
| --- | ---: | ---: | --- |
| Reference formulation Cmax | `0.4391866259` | `<= 0.30` | `unsupported` |
| Test formulation Cmax | `0.3984103129` | `<= 0.30` | `unsupported` |

The overall conclusion is therefore **`failed`**. The model remains unsupported
for at least one frozen endpoint within this boundary; no clinical, treatment,
or bioequivalence claim is made.

The source reports no endpoint uncertainty for these aggregate Cmax values.
The UI states `Absent: not reported in source`; it does not invent an interval,
dispersion, or precision. Predicted values, measured values, and scores occupy
separate named regions. Each measured value retains its raw unit, exact
normalization, sample size, source object, PDF and printed page, section,
paragraph, continuation flag, and separate sample-size locator.

## Explicitly Not Evaluable

The complete report and UI retain all eight exclusions with their producer
reasons:

- Tmax scoring or statistic;
- absolute AUC;
- bioequivalence ratio, confidence interval, or power;
- sequence effect;
- variance or coefficient of variation;
- full concentration-time curve;
- population, sex, or BMI subgroups;
- tramadol or safety outcomes.

These endpoints cannot inherit support from a Cmax result and are never omitted
from a completed report.

## Offline Integrity And Replay

The local service stores canonical artifacts in a private content-addressed
store and immutable commitment, disclosure, and report metadata in SQLite.
Configured roots must be outside the source tree. Startup verifies an existing
snapshot and fails closed on corruption.

`GET /api/v11/challenge/integrity` rehashes the snapshot, every indexed artifact,
commitment, disclosure, report, and the complete object inventory. Offline
replay reloads only local objects, verifies all bindings, recomputes independent
scoring, and returns `network_access: false`. The workbench exposes both actions
and never relabels numerical diagnostic success as biological support.

## API

- `GET /api/v11/challenge`
- `GET /api/v11/challenge/status`
- `POST /api/v11/challenge/sync`
- `POST /api/v11/challenge/commitments`
- `POST /api/v11/challenge/commitments/:commitmentDigest/disclose`
- `GET /api/v11/challenge/runs`
- `GET /api/v11/challenge/reports/:resultDigest`
- `POST /api/v11/challenge/reports/:resultDigest/replay`
- `GET /api/v11/challenge/artifacts/:artifactDigest`
- `GET /api/v11/challenge/integrity`

## Configuration

```sh
BIOCHEMICAL_CHALLENGE_URL=http://127.0.0.1:8000
BIOCHEMICAL_CHALLENGE_TIMEOUT_MS=10000
BIOCHEMICAL_CHALLENGE_ROOT=/absolute/path/outside/the/source/tree
BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN=http://127.0.0.1:5173
BIOCHEMICAL_CHALLENGE_CSRF_TOKEN=<canonical-unpadded-base64url-43-to-128-characters>
BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN=http://127.0.0.1:5173
```

`BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN` must equal the producer's
`BIOCHEMICAL_JS_ALLOWED_ORIGIN`, and `BIOCHEMICAL_CHALLENGE_CSRF_TOKEN` must
equal `BIOCHEMICAL_JS_CHALLENGE_CSRF_TOKEN`. They authorize inference-to-producer
protected challenge calls; they are not interchangeable with the fixed local
browser header `x-challenge-csrf: goal13-challenge-v1`.

## Verification Scope

Service and API tests cover public-root tampering, commitment-before-outcome
access, producer identity and score mismatches, model-policy mutation,
post-restart corruption, exact endpoint scoring, and network-free replay.
Frontend tests cover the failed result, not-evaluable result and all eight
reasons, absence of pre-disclosure values, mobile-friendly named semantic
regions, exact producer values and scores, freeze-intent ownership, response
identity binding, protected GET CSRF, no-store enforcement, valid definition
lists, focus transfer, and mounting independently of Goal 1.

Real Playwright acceptance runs against the sibling JavaScript/PGlite producer
and production-built inference server on desktop Chromium and a 360 px mobile
viewport. It intentionally fails Goal 1 while completing Goal 13, verifies
sync, freeze, zero pre-disclosure outcome leakage, exact disclosure and failed
report, all eight not-evaluable boundaries, local integrity, browser reload,
immutable report reopening, `network_access: false` replay, protected request
headers/bodies, response no-store policy, and horizontal overflow.

## Limitations

- One study and two aggregate Cmax endpoints cannot validate APAP metabolism,
  toxicity, injury, NAC response, safety, population behavior, or treatment.
- The 50 L normalization is a frozen consumer mapping, not a measured subject
  volume or a population PK estimate.
- The threshold is repository-authored and is not a bioequivalence, clinical,
  regulatory, or paper-defined criterion.
- Source transcription review and release signatures establish declared
  provenance and integrity, not scientific completeness or present upstream
  content.
- Dataflow isolation limits accidental consumer leakage. It is not secrecy,
  DRM, authentication, or protection from a local repository holder.
- The application shell does not currently emit `X-Frame-Options` or a CSP
  `frame-ancestors` directive. That app-wide clickjacking control belongs in
  `server/app.js` and was not added in the Goal 13-owned change set.
