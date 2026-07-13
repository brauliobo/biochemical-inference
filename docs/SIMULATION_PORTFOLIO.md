# Standards-Based Simulation Portfolio

## Scope

Goal 4 adds three bounded, declarative benchmark models. They are scientific conformance models, not physiological predictions.

- ODE: irreversible first-order `A -> B`, solved by fixed-step classical RK4 or adaptive Dormand-Prince 5(4). The analytic reference is `A(t) = A0 exp(-k t)`.
- SSA: the same first-order conversion in integer molecule counts, solved by Gillespie's direct method. Replicates use version `1.0.0` of the in-repository xoshiro128** implementation, independently seeded through splitmix32. The final survivor count follows the binomial reference with `p = exp(-k t)`.
- FBA: a one-metabolite uptake/biomass system, solved as a continuous linear program by a two-phase primal simplex. The solver distinguishes optimal, infeasible, unbounded, non-converged, and residual-failure outcomes.

Every model, experiment, result, unit, engine, algorithm, seed, assumption, limitation, and knowledge release uses the strict `2.0.0` Zod contracts in `shared/portfolio-contracts.js`. Model and run identities are canonical SHA-256 digests; object key order and display formatting do not affect them. Lifecycle (`queued`, `running`, `terminal`) is separate from terminal outcome (`successful`, `failed`, `non-converged`, `infeasible`, `unbounded`, `resource-exhausted`, `cancelled`).

## Unit Profile

Units carry a symbol, SI scale, and all seven SI base-dimension exponents. The current profile supports:

- ODE state: `mol/L`; first-order rates: `s^-1`; time: `s`.
- SSA state: integer `molecule` counts; first-order rates: `s^-1`; time: `s`.
- FBA flux: `mmol gDW^-1 h^-1`.

All dynamic state dimensions must agree, first-order constants must have inverse-time dimensions, FBA flux dimensions must agree, and observables/interventions must match their targets. Goal 4 contracts validate intervention units but the benchmark executor rejects non-empty intervention schedules. Intervention execution and parameter sweeps belong to Goal 9.

## Standards Profile

The supported profile is named `portfolio-combine-1.0`.

### SBML

- SBML Level 3 Version 2 core.
- FBC Version 2 syntax for FBA bounds and a single maximize objective.
- One constant compartment, explicit species, constant scalar parameters, irreversible reactions, fixed stoichiometry, and first-order mass-action MathML for ODE/SSA.
- A required `portfolio:contract` annotation contains the strict, digest-verified model contract. The executable species, reaction, bound, objective, and kinetic structures remain represented in standard SBML elements.

Events, rules, function definitions, algebraic rules, delays, assignment/rate rules, spatial semantics, comp, qual, distrib, dynamic stoichiometry, non-first-order kinetic laws, multiple objectives, integer programs, and unsupported package semantics are rejected rather than approximated.

### SED-ML

- SED-ML Level 1 Version 4.
- One local SBML model, one simulation, and one task.
- Uniform time course for ODE/SSA or steady state for FBA.
- KiSAO identifiers: RK4 `KISAO:0000032`, Dormand-Prince `KISAO:0000087`, Gillespie direct `KISAO:0000029`, and FBA `KISAO:0000437`.
- A required `portfolio:contract` annotation preserves strict tolerances, resource controls, seed, assumptions, limitations, model/release digests, and algorithm versions.

Repeated tasks, remote models, data generators, parameter scans, nested simulations, and workflow substitutions are outside this profile.

### COMBINE

Archives contain exactly `manifest.xml`, `model.xml`, and `experiment.sedml`. Import limits are 2 MB compressed, 2 MB per entry, 5 MB expanded total, 32 entries, and compression ratio 100. Import rejects absolute paths, `..`, backslashes, duplicate or unknown entries, remote/file references, DTDs/entities, unsupported constructs, and mismatched model digests before execution. XML is parsed with entities disabled; ZIP entries are expanded lazily with declared and streamed size checks.

## Execution Boundary

Each run executes in a child Node.js process with validated JSON-text IPC, a 1 MB input limit, 2 MB default output limit, 96 MB V8 heap, and 10 second wall-time limit. The worker imports only contracts and numerical engines and has no network client. Parent-enforced termination produces `resource-exhausted`; cancellation produces `cancelled`. The protocol and API are cancellation-ready, but durable queues, checkpoints, resume, and artifact retention remain explicitly deferred to Goal 9.

The Fastify surface is additive:

- `GET /api/v2/models`
- `GET /api/v2/models/:modelId`
- `POST /api/v2/model-archives/export`
- `POST /api/v2/model-archives/validate`
- `POST /api/v2/runs`
- `GET /api/v2/runs/:runId`
- `DELETE /api/v2/runs/:runId`

Run storage is process-local and synchronous terminal completion is intentional for Goal 4.
