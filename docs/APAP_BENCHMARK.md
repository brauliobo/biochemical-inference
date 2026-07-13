# APAP Multiscale Inference Benchmark

## Scientific Boundary

The inference service pins `apap-liver-benchmark-v1.0.0` at trusted digest `6de9844b2e8e4f3a15a0aba5455c69dc4116dc3287b7adb05e68ea337707f23b`. The producer release contains verified identifier anchors, illustrative assumptions, and equation-generated synthetic observations. It contains no measured APAP pharmacokinetic, injury, histology, biomarker, glutathione, adduct, or NAC-response values.

The multiscale equation set is an inference-side algorithm benchmark. Every added parameter is an internal illustrative assumption with unsupported validation status. Outputs are synthetic, non-clinical, and unsuitable for diagnosis, dosing, treatment timing, efficacy, safety, or human/mouse toxicology claims.

## Contracts And Identity

- Producer payloads for catalog, detail, contexts, parameters, protocols, observations, assumptions, limitations, and validation matrix are strict Zod objects with unknown fields rejected.
- The APAP producer release is independently pinned; verification is not inherited from the knowledge, atlas, evidence, or parameter releases.
- Internal run requests and results are strict Zod contracts in `shared/apap-contracts.js`.
- Canonical model ID: `MODEL:APAP-LIVER-MULTISCALE`.
- Canonical equation-set ID: `EQUATION-SET:APAP-LIVER-MULTISCALE-V1`.
- Engine: `fixed-step-rk4-1.0.0`, fixed `0.01 h` step, `0.5 h` output interval.
- Run identity is SHA-256 over the pinned release, equation digest, model/engine versions, protocol/context IDs, exact effective parameters, and numerical controls.

Human and mouse use one equation evaluator. Context IDs resolve to explicit parameter-binding tables before integration. Taxon labels never enter the equations and there are no taxon branches.

## Equations

The model has a gut/administration depot `G`, central APAP `C`, NAC `X`, and 12 portal-to-central lobule bins. Bin `i` contains APAP `A_i`, NAPQI `N_i`, GSH `Q_i`, adduct `B_i`, oxygen `O_i`, detoxified and repaired cumulative fates, and healthy/stressed/injured/recovering fractions `H_i`, `S_i`, `I_i`, and `R_i`.

```text
dG/dt = -k_a G
dC/dt = k_a G - k_el C - q C + q A_11

v_CYP,i   = k_CYP z_i A_i
v_GSH,i   = k_GSH N_i Q_i
v_bind,i  = k_bind N_i
v_repair,i = k_repair B_i

dA_i/dt = q(upstream_i - A_i) - v_CYP,i + D_A lap(A)_i
dN_i/dt = v_CYP,i - v_GSH,i - v_bind,i + D_N lap(N)_i
dQ_i/dt = k_Q(Q_capacity - Q_i)
          + k_NAC X(Q_capacity - Q_i)
          - v_GSH,i
dB_i/dt = v_bind,i - v_repair,i
dRepaired_i/dt = v_repair,i

dO_i/dt = supply_i - k_O O_i(H_i + S_i + R_i)
          - oxygen_cost v_CYP,i + D_O lap(O)_i

H_i -> S_i: k_stress [B_i/(0.2 + B_i)] H_i
S_i -> I_i: k_injury [B_i/(0.2 + B_i)] S_i
S_i -> R_i, I_i -> R_i, R_i -> H_i: explicit recovery rates

dX/dt = -k_NAC,el X
```

`lap` is no-flux nearest-neighbor exchange. Portal inflow enters bin 0; serial perfusion exits bin 11 to the central compartment. APAP metabolism transfers mass to NAPQI; NAPQI transfers to detoxified or adduct fates; adduct repair transfers to a cumulative repaired fate; central elimination transfers to a cumulative eliminated fate.

NAC enters only the explicit NAC state and GSH synthesis term. It has no direct term in APAP exposure, CYP metabolism, NAPQI binding, adduct repair, oxygen, injury, or recovery equations.

Cell transitions are conservative by construction:

```text
d(H_i + S_i + I_i + R_i)/dt = 0
```

The integrator checks every RK4 intermediate and final state. Non-finite or negative states and cell-state sum violations fail the run; values are not silently clamped.

## Baseline Synthetic Results

These deterministic values document software behavior only. They are not measured or biologically validated.

| Protocol | Peak central APAP | NAPQI formed | Final adduct | Peak injured fraction | Final healthy fraction | Minimum oxygen |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Human PK, 0-24 h | 8.9835313933 | 4.8523170621 | 0.0327078225 | 0.0027039252 | 0.9384776424 | 0.8 |
| Mouse toxic-dose, 0-48 h | 13.7960543014 | 14.1494551398 | 0.1633391930 | 0.1421875309 | 0.4627856094 | 0.6875 |
| Delayed NAC, 0-48 h | 8.9835313933 | 7.9872424095 | 0.0553837968 | 0.0267273672 | 0.7495530603 | 0.8 |

APAP mass residual is zero at reported precision for these runs. Declared tolerances are `2e-6` model-unit for the human and delayed-NAC protocols and `3e-6` for the mouse protocol. The delayed-NAC result must not be compared with the 24-hour human run as efficacy evidence; protocol windows differ and no measured treatment-response benchmark exists.

## Diagnostics

Every run reports:

- APAP input, accounted final APAP and derived fates, residual, tolerance, and pass status.
- Minimum state, finite/nonnegative status, minimum cell fraction, and maximum cell-state sum error.
- Executed zero-CYP case: NAPQI, adduct, and APAP-mediated injury remain zero.
- Executed zero-binding case: adduct and APAP-mediated injury remain zero while NAPQI may form.
- Uniform-zonation case: all CYP zonation coefficients become identical.
- Synthetic source observation comparisons with calibration/validation partitions retained and validation status `unsupported`.
- The complete producer validation matrix, whose biological claims remain `unsupported`.

## API

- `GET /api/v4/apap`
- `GET /api/v4/apap/releases`
- `GET /api/v4/apap/releases/{releaseId}`
- `GET /api/v4/apap/releases/{releaseId}/contexts`
- `GET /api/v4/apap/releases/{releaseId}/parameters`
- `GET /api/v4/apap/releases/{releaseId}/protocols`
- `GET /api/v4/apap/releases/{releaseId}/observations`
- `GET /api/v4/apap/releases/{releaseId}/assumptions`
- `GET /api/v4/apap/releases/{releaseId}/limitations`
- `GET /api/v4/apap/releases/{releaseId}/validation-matrix`
- `POST /api/v4/apap/runs`
- `GET /api/v4/apap/runs/{runId}`

## Limitations

- No numeric producer value is measured biological evidence; all producer parameters are illustrative and all observations are synthetic.
- The inference-side mechanism and context binding values are unsourced internal assumptions, not estimates.
- Human injury, mouse injury, human PK accuracy, mouse-to-human translation, and delayed NAC efficacy remain unsupported.
- The model omits population variability, covariates, uncertainty distributions, detailed PBPK anatomy, immune response, necrosis biomarkers, histology, regeneration biology, and clinical outcomes.
- The one-dimensional 12-bin lobule is a numerical topology, not anatomical geometry.
- Oxygen, GSH, NAPQI, adduct, and cell-state outputs use synthetic model units or fractions.
- Fixed-step stability, conservation, and limiting-case checks establish software behavior only, not biological validity.
