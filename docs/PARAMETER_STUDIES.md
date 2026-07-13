# Parameter Evidence, Calibration, And Uncertainty

## Scope And Release Pin

Goal 5 consumes the independent immutable release
`parameter-evidence-benchmark-v1.0.0` at digest
`6e72e6bebf3b18aa2edd95dae7e719799cb6916a3e58bb68e697347eebce7fa9`.
The release contains a noiseless synthetic first-order decay benchmark and
repository-authored one-carbon assumptions. It contains no measured biological
parameter values or biological observations.

The server verifies the parameter catalog before every candidate, context, or
dataset request, strictly parses the upstream payload and endpoint release
envelope, and then validates a separate strict internal options contract. The
browser uses only the same-origin `/api/v2/parameter-options` and
`/api/v2/studies` routes.

## Candidate Selection

Selection is deterministic. Candidates must have a compatible physical
dimension and are ranked by exact context, explicit context transform, then
competing context; canonical units are preferred before converted units. Point,
distribution, and interval records supply the estimate, prior, and calibration
bounds respectively. Every candidate remains visible as selected, supporting,
or excluded with its upstream and consumer rationale.

Supported conversions are explicit SI-scale conversions from the release unit
set. For example, `6 min^-1` becomes `0.1 s^-1`; concentration cannot become a
first-order rate. A taxon mismatch is rejected unless a transform names the
candidate, source taxon, target taxon, positive scale, and rationale. A supplied
transform is labeled `context-transformed` and remains lower priority than an
exact-context candidate.

## Algorithms

- Local sensitivity uses a centered finite difference with a declared relative
  step and reports raw and normalized derivatives for every observation.
- Morris screening uses a seeded grid trajectory design and reports signed
  mean, absolute mean, and sample standard deviation of elementary effects.
- Calibration uses bounded Nelder-Mead and only the five fixed calibration
  observation IDs. A run that reaches its iteration limit is `non-converged`;
  its best point is labeled `bestSoFar` and is never emitted as an estimate.
- Practical identifiability forms the sensitivity Jacobian and Fisher
  information matrix, then reports numerical rank and condition number. A
  rank-deficient or ill-conditioned matrix is not identifiable.
- Posterior inference uses seeded random-walk Metropolis with independently
  seeded chains, warmup proposal adaptation, a synthetic normal prior, and an
  explicit assumed observation sigma. Success requires R-hat at most `1.05`
  and every chain acceptance rate in `[0.10, 0.70]`.
- Posterior predictive validation is evaluated only against the three fixed
  held-out IDs and reports pointwise 95% intervals and empirical coverage only
  when optimization, identifiability, and all chain diagnostics pass. Otherwise
  validation is suppressed and the result contains diagnostic-only reasons with
  no intervals or coverage statistic.
- The robustness matrix varies parameter starts, analytic versus RK4 execution,
  RK4 timesteps, and an optional deliberately misspecified fixed-offset model.
  A row supports recovery only when `k` is within `0.005 s^-1` and held-out RMSE
  is at most `0.1 umol/L`.

The canonical study identity hashes the normalized request, pinned parameter
release, model identity, and algorithm versions. Seeded studies are reproducible
and complete synchronously as immutable in-memory terminal records.

## Reference Result

With default controls, the fixture and pinned real service recover
`k = 0.10000000 s^-1`. Four 700-sample chains produce R-hat near `1.00`,
acceptance rates within the declared range, and all three held-out synthetic
points fall within posterior predictive intervals. Parameter-start, solver, and
timestep rows support the conclusion. Enabling the fixed-offset model stress
causes its estimate and held-out RMSE to violate thresholds, so robustness is
explicitly `downgraded` without changing a successfully converged posterior into
a failed one.

## Uncertainty And Limitations

Biological, measurement, structural, contextual, and numerical uncertainty are
reported separately. The likelihood sigma is an assumption because no
measurement process occurred. The first-order equation is also a structural
assumption. This benchmark does not establish biological applicability,
validate noisy or censored data, detect broad multimodality, estimate replicate
effects, or replace longer-chain convergence assessment.

Fixture mode is enabled by `BIOCHEMICAL_PARAMETERS_USE_FIXTURE=true`; the general
`BIOCHEMICAL_INFERENCE_USE_FIXTURE=true` test mode enables it as well. Production
operation has no fallback if the pinned release or digest cannot be verified.
