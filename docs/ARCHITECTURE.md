# Biochemical Inference MVP Architecture

## Repository Boundary

`biochemical-inference` owns models, controlled execution, run artifacts, comparisons, and visualization. It consumes immutable knowledge but does not mutate `biochemical-db` releases or promote predictions into source facts.

## Runtime Structure

```text
biochemical-db API
        |
        v
knowledge client + digest pin
        |
        v
controlled simulation API
        |
        v
deterministic model engine
        |
        v
run result + diagnostics
        |
        v
Vue/Pug workbench
  |       |       |
 chart   table   Three.js
```

## Active Application

```text
src/                 Vue application
server/              Controlled API and simulation engine
shared/              Versioned request and response contracts
tests/                Unit, API, and browser automation
specs/e2e/            Product-level acceptance scenarios
```

The legacy Jekyll, Slim, Riot, and generated `docs/` application remains outside the active build until unrelated local modifications are resolved. The new build writes only to `dist/` and `server-dist/`.

The active application is plain JavaScript (ES6) on Node.js 22. Vite builds the browser application, while the server build reproducibly copies the ES modules in `server/` and `shared/` without a compilation step.

## Service Contract

- `GET /api/v1/health`
- `GET /api/v1/releases`
- `GET /api/v1/releases/{release_id}/network?taxon_id=...`
- `GET /api/v1/models/one-carbon`
- `POST /api/v1/models/one-carbon/simulations`

The inference service proxies knowledge requests so the browser has one origin and every simulation can verify the same release used by the workbench.

## Model Contract

The one-carbon model uses an explicit stoichiometric system:

```text
dx/dt = S * v(x, p) + boundary_fluxes
```

The model declares metabolites, reactions, units, initial conditions, bounded parameters, presets, numerical controls, and scientific limitations. Model assumptions are never written into the knowledge release.

## Run Identity

The canonical run identity is a SHA-256 digest of:

- Knowledge release identifier and digest.
- Model and engine versions.
- Taxon.
- Effective input parameters.
- Initial conditions.
- Numerical controls.

Display formatting, object key order, UI state, and locale must not change run identity.

## Visualization Contract

- The chart displays concentrations and fluxes with units.
- The 3D scene uses compounds as spheres and reactions as distinct nodes.
- Directed links represent reactant and product roles.
- Simulation values update node and edge encodings.
- Selection is synchronized with an accessible semantic list.
- Reduced motion disables decorative animation.
- WebGL failure leaves controls, tables, charts, provenance, and export usable.

## Failure Contract

The interface distinguishes loading, invalid, incompatible, running, successful, failed, and cancelled states. A failed request cannot reuse stale data. Changing a completed run configuration marks existing results as belonging to the previous specification until a new run succeeds.
