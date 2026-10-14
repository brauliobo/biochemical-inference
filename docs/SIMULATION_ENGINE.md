# Simulation engine (`src/sim/`)

A generic, deterministic, browser-safe kinetic ODE engine: declarative model data in, time courses,
steady states, dose-response curves and uncertainty bands out. Pure JavaScript, no dependencies, no
`node:` imports (not to be confused with the server-side `server/portfolio/engines/ode.js`, which has
a fixed first-order model). Everything shown is an **illustrative educational model**, never
measurable physiology or medical advice; models carry a `label` saying so.

```js
import { compileModel, simulate, steadyState, sweep, ensemble } from '../sim/index.js'
import { toyModel } from '../sim/models/_toy.js'
```

Gzip size, tree-shaken: about 10.5 kB for compile + simulate + steadyState + sweep + compare + ensemble,
7.9 kB for compile + simulate, 12.9 kB with everything (`validateModel` and `sensitivity` are only
included when imported). Load it lazily from dashboards, as with the knowledge data.

## Modules

| File | Content |
| --- | --- |
| `ratelaws.js` | Rate-law functions, `RATE_LAWS` / `MODIFIER_LAWS` registries |
| `validate.js` | `validateModel(model)` -> `{ valid, errors, warnings }` |
| `model.js` | `compileModel(model)`, `asCompiled` |
| `integrate.js` | `integrate(f, y0, times, options)`: Dormand-Prince 5(4) + stiff fallback |
| `run.js` | `simulate`, `steadyState`, `sweep`, `compare`, `ensemble`, `sensitivity`, `conservedSums` |
| `rng.js`, `linalg.js` | seeded PRNG / quantiles; tiny LU for the stiff solver and Newton |
| `models/` | model data (`_toy.js` is the format reference and test fixture) |

## Model data format

Plain objects. Ids are identifiers (`[A-Za-z_][A-Za-z0-9_.-]*`) and share **one namespace** across
species, parameters, reactions, controls and observables. Units are free text, but a model must use one
concentration unit and one time unit throughout (the toy: uM and min).

```js
{
  id, name, label: 'Illustrative educational model - not measurable physiology or medical advice',
  time: { unit: 'min', duration: 240 },            // optional defaults for simulate()
  species: [{ id, name, initial, unit, fixed?, compartment?, ontologyId?: 'compound:sam' }],
  parameters: [{ id, value, low?, high?, unit, source?, confidence?: 'high'|'medium'|'low'|'assumed' }],
  reactions: [{
    id, name, ontologyId?: 'reaction:gnmt-glycine-methylation', enzymeId?: 'enzyme:gnmt',
    substrates: [{ species, n }], products: [{ species, n }],
    rate: {
      law: 'michaelisMenten',                       // key of RATE_LAWS
      params: { Vmax: 'vmax_mat', Km: 'km_mat' },   // parameter id, or a number literal
      species: { I: 'sam' },                        // role -> species id (only what the defaults miss)
      modifiers: [{ law: 'allostericInhibition', species: { I: 'sam' }, params: { Ki: 'ki' } }],
      refs: ['article:...']                         // provenance, not used by the maths
    }
  }],
  controls: [{ id, label, min, max, default, unit, effects: [{ target: 'param'|'reaction'|'species', id, op: 'multiply'|'set'|'add', gain? }] }],
  events: [{ time, set?: { id: value }, add?: { id: value }, label? }],   // id = species or parameter
  observables: [{ id, label, unit, expr: { ref | sum | ratio | product | diff: ... } }]
}
```

- **`fixed: true`** species are buffers: they appear in rate laws and in the stoichiometry matrix but their
  derivative is 0 (use for ATP, a sink, a clamped dietary pool). Events and `set`/`add` controls still change them.
- **Stoichiometry** is `substrates`/`products` with `n`. Net change per unit flux is
  `products.n - substrates.n`. `massAction` uses `n` as exponents; `reversibleMassAction` multiplies the products.
- **Default species roles.** `S`, `A` = `substrates[0]`, `B` = `substrates[1]`, `P` = `products[0]`; everything else
  (inhibitors `I`, modifier slots `A`/`I`/`L`) must be given in `rate.species`.
- **Rates are net fluxes** in concentration/time; a reversible law may be negative. Rate laws clamp negative or
  NaN concentrations and constants to 0, so a rate never returns NaN.
- **Modifiers** multiply the base rate by a dimensionless factor: `allostericActivation {Ka, n=1, fold=2}` (role `A`),
  `allostericInhibition {Ki, n=1, residual=0}` (role `I`), `ligandModifier {K, fold, n=1}` (role `L`).
- **Controls** are what a slider changes. Value `v` (default `control.default`) becomes `v * gain` and is applied to
  the target: `reaction` + `multiply` scales a flux (enzyme activity, a knocked-down variant), `param` + `multiply|set|add`
  changes a parameter (dietary input rate), `species` + `multiply|set|add` changes the initial value (or the level of a fixed species).
  Several controls on one target compose in declaration order.
- **Events** apply exactly at `time`; `set`/`add` on a species changes the state (bolus dose), on a parameter switches
  an input on or off. A sample at exactly the event time shows the post-event value. Pass `events` to `simulate` to replace `model.events`.
- **Observables** (`ratio: ['sam', 'sah']`, `sum: ['gnmt', 'mt_other']`) take species ids, reaction ids (their flux) and earlier observables.
- **`low`/`high`** on a parameter define the uncertainty range that `ensemble` samples. Give every literature parameter `source` and `confidence`.

### Rate laws (`RATE_LAWS`)

| law | params | roles | rate |
| --- | --- | --- | --- |
| `massAction` | k | (all substrates) | `k * prod(S^n)` |
| `reversibleMassAction` | kf, kr | (substrates, products) | `kf*prod(S^n) - kr*prod(P^n)` |
| `firstOrder` | k | S | `k*S` |
| `constantInput` | rate | | `rate` |
| `michaelisMenten` | Vmax, Km | S | `Vmax*S/(Km+S)` |
| `reversibleMM` | Vf, Ks, Kp, Keq | S, P | `(Vf/Ks)(S - P/Keq)/(1 + S/Ks + P/Kp)` (Haldane) |
| `orderedBiBi` | Vmax, Kia, Kma, Kmb | A, B | `Vmax*A*B/(Kia*Kmb + Kmb*A + Kma*B + A*B)` |
| `randomBiBi` | Vmax, Kma, Kmb | A, B | `Vmax*A*B/((Kma+A)(Kmb+B))` (rapid equilibrium, independent binding) |
| `pingPong` | Vmax, Kma, Kmb | A, B | `Vmax*A*B/(Kmb*A + Kma*B + A*B)` |
| `competitiveInhibition` | Vmax, Km, Ki | S, I | `Vmax*S/(Km(1+I/Ki)+S)` |
| `uncompetitiveInhibition` | Vmax, Km, Ki | S, I | `Vmax*S/(Km+S(1+I/Ki))` |
| `noncompetitiveInhibition` | Vmax, Km, Ki | S, I | `Vmax*S/((Km+S)(1+I/Ki))` |
| `mixedInhibition` | Vmax, Km, Kic, Kiu | S, I | `Vmax*S/(Km(1+I/Kic)+S(1+I/Kiu))` |
| `substrateInhibition` | Vmax, Km, Ksi | S | `Vmax*S/(Km+S+S^2/Ksi)` |
| `hill` | Vmax, K, n | S | `Vmax*S^n/(K^n+S^n)` |

The plain functions (`michaelisMenten(Vmax, Km, S)`, `hill(Vmax, K, n, S)`, `allostericInhibition(I, Ki, n, residual)`, ...)
are exported too. For a gas/stoichiometric model (acid + bicarbonate -> CO2) use `massAction` or `constantInput` with `fixed` buffers.

## API

All of these accept a raw model or the result of `compileModel`; compile once and reuse it in loops.

- `validateModel(model)` -> `{ valid, errors[], warnings[] }`. Call it in the model's unit test. `compileModel` itself
  only throws on the first structural error (`Invalid model: ...`), so shipped models stay cheap.
- `compileModel(model)` -> `{ names, y0, stoichiometry, fixed, reactionIds, paramIds, controlIds, observableIds,
  derivative(t, y, controls), fluxes(t, y, controls), bind(controls, paramOverrides), values(y, flux), defaultControls() }`.
  `stoichiometry[i][j]` is species i per unit flux of reaction j. `bind` returns a system with its own parameter copy.
- `simulate(model, { controls, duration, samples = 200 | times, events, params, rtol = 1e-6, atol = 1e-9, method = 'auto', maxSteps })`
  -> `{ ok, time[], series: { speciesOrObservable: number[] }, fluxes: { reaction: number[] }, summary: { final, min, max, steps, rejected, method, status }, warnings[], notes[] }`.
- `steadyState(model, controls?, { params, tol = 1e-10, tMax })` -> `{ converged, residual, state, observables, fluxes, values, y, warnings }`.
  Integrates in growing chunks, then a damped Newton polish (ridge-regularised, so closed cycles with conserved totals work).
  Not converged (oscillation, unbounded accumulation) -> `converged: false` plus a warning.
- `sweep(model, controlId, values, observable, { controls, mode = 'steady' | 'transient', duration, reduce })`
  -> `{ controlId, observable, values, y[], ok, warnings }`. `observable` is a species, flux or observable id, or `{ id, reduce: 'final'|'max'|'min'|'mean'|'auc' }` (transient).
- `compare(baseRun, perturbedRun)` -> `{ time, delta: { id: [] }, final: { id: { base, perturbed, delta, relChange } }, ranked: ids by |relChange| }`.
- `ensemble(model, { n = 50, seed = 1, paramRanges, only, quantiles = [5, 50, 95], mode = 'time' | 'steady', controls, duration, samples })`
  -> `{ n, ok, failures, seed, paramIds, samples, time, bands: { id: { p5, p50, p95 } }, fluxBands }`; band values are arrays over time
  (or numbers in steady mode). Each run draws every parameter with `low < high` log-uniformly (uniform if `low <= 0`) from a seeded mulberry32.
- `sensitivity(model, observable, { only, delta = 0.05, mode, controls })` -> `[{ param, elasticity, base, up, down }]` by |elasticity|.
- `conservedSums(model, groups, run?, { reactions? })` with `groups = [{ id, species: [...] } | { id, weights: { species: n } }]`.
  Structural check `w^T N = 0` per reaction (fixed species ignored): `{ id, balanced, violations: [{ reaction, delta }] }`;
  with a run it adds `totals`, `drift`, `relativeDrift`. Restrict to the closed part with `reactions`.
- `integrate(f, y0, times, options)` is the low-level solver (`f(t, y, out)`), for custom right-hand sides.

### Integrator behaviour

Adaptive Dormand-Prince 5(4) with FSAL, Hairer step control and 4th-order dense output at the requested times.
A Hairer stiffness detector (15 consecutive steps with `h*|df/dy|` near 3.25) hands over to a Rosenbrock 2(3) solver with a
numeric Jacobian (reported in `notes`, not `warnings`; `method: 'dopri5'` only warns). States are kept `>= 0`: a step that
goes materially negative is rejected and shrunk; below the step floor it is clamped with a warning. Hitting `maxSteps`
(200000) or step underflow ends the run early: `ok: false`, a warning, and only the reached samples. Events are applied at their exact time.
Deterministic: no randomness outside `ensemble`'s explicit seed.

## Worked example: the toy methyl-donor / SAM / SAH cycle

`src/sim/models/_toy.js` (units uM and min) is the model the assembly agent should mirror:

```
(diet) -> met --MAT--> sam --mt_other--> sah --recycle--> met     closed core: met + sam + sah conserved
                        \--gnmt (sam + gly -> sah + sarcosine)    sarcosine = fixed sink
met --drain-> (transsulfuration);  gly: constant input, first-order clearance
```

Excerpt (full file: `_toy.js`):

```js
species: [
  { id: 'met', name: 'Methionine', initial: 30, unit: 'uM', ontologyId: 'compound:methionine' },
  { id: 'sam', name: 'S-adenosylmethionine', initial: 60, unit: 'uM', ontologyId: 'compound:sam' },
  { id: 'sah', name: 'S-adenosylhomocysteine', initial: 10, unit: 'uM', ontologyId: 'compound:sah' },
  { id: 'gly', name: 'Glycine', initial: 100, unit: 'uM', ontologyId: 'compound:glycine' },
  { id: 'sar', name: 'Sarcosine (sink)', initial: 0, unit: 'uM', fixed: true }
],
parameters: [{ id: 'vmax_gnmt', value: 12, low: 4, high: 30, unit: 'uM/min', source: 'assumed', confidence: 'assumed' }, ...],
reactions: [{
  id: 'gnmt', ontologyId: 'reaction:gnmt-glycine-methylation', enzymeId: 'enzyme:gnmt',
  substrates: [{ species: 'sam', n: 1 }, { species: 'gly', n: 1 }], products: [{ species: 'sah', n: 1 }, { species: 'sar', n: 1 }],
  rate: { law: 'randomBiBi', params: { Vmax: 'vmax_gnmt', Kma: 'km_gnmt_sam', Kmb: 'km_gnmt_gly' }, refs: [] }
}, ...],
controls: [
  { id: 'gnmtActivity', label: 'GNMT activity (x)', min: 0, max: 3, default: 1, unit: 'x', effects: [{ target: 'reaction', id: 'gnmt', op: 'multiply' }] },
  { id: 'glycineIntake', label: 'Glycine intake (x)', min: 0, max: 5, default: 1, unit: 'x', effects: [{ target: 'param', id: 'gly_in_rate', op: 'multiply' }] }
],
events: [{ time: 60, add: { gly: 500 }, label: 'Glycine bolus (+500 uM)' }],
observables: [{ id: 'samSahRatio', label: 'SAM:SAH', unit: 'ratio', expr: { ratio: ['sam', 'sah'] } }]
```

Typical calls:

```js
const c = compileModel(toyModel)                                   // compile once
const run = simulate(c, { duration: 240, controls: { gnmtActivity: 0.5 } })   // run.series.samSahRatio, run.fluxes.gnmt
const base = steadyState(c).observables.samSahRatio                // steady SAM:SAH
const curve = sweep(c, 'glycineIntake', [0, 1, 2, 3, 5], 'samSahRatio')   // dose-response, curve.y falls with the dose
const band = ensemble(c, { n: 100, seed: 1, duration: 240 }).bands.samSahRatio   // { p5, p50, p95 } ribbons
const [pool] = conservedSums(c, [{ id: 'core', species: ['met', 'sam', 'sah'] }], run)
// pool.violations lists met_in and drain (the open reactions); pool.balanced is true for the closed core
```

## Conventions for model files (`src/sim/models/*.js`)

1. Export the plain model object; bind `ontologyId`/`enzymeId` to existing knowledge ids, and keep every parameter's
   `source` (article id) and `confidence`. Mark assumptions as `'assumed'`.
2. A test runs `validateModel`, `steadyState` against the published ranges, directional scenarios (a glycine load lowers SAM:SAH),
   and `conservedSums` on the closed part of the network.
3. Describe open boundaries (diet, excretion, drains) as explicit `constantInput` / `firstOrder` reactions so that mass-balance
   checks list exactly them.
4. Keep the `label` visible wherever results are shown, and show parameter `source`/`confidence` in the inspector panel.
