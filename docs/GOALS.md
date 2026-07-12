# Biochemical Inference MVP Goals

## Mission

`biochemical-inference` turns a verified biochemical knowledge release into controlled, reproducible, inspectable simulations. It provides a Vue and Pug scientific workbench where users can compare human and mouse knowledge, perturb a model, inspect time-dependent results, and trace every run to its exact inputs.

The first model is a bounded one-carbon metabolism demonstration. It proves the complete platform contract without claiming clinical or whole-body validity.

## Product Goals

1. Remove RiotJS from the active application and replace it with Vue 3, JavaScript (ES6), Vite, and Pug templates.
2. Load a pinned, verified `biochemical-db` release through its API.
3. Expose a controlled deterministic simulation service with strict input validation.
4. Derive stable run identities from the release, model version, and normalized inputs.
5. Preserve model assumptions, units, diagnostics, and scientific limitations.
6. Compare baseline and perturbed trajectories.
7. Link network selection, time-series results, and scientific details.
8. Provide a meaningful Three.js view of compounds, reactions, and flux.
9. Keep the complete core workflow available without WebGL.
10. Work on desktop and narrow mobile viewports.

## Scientific Goals

The MVP supports:

- Human and mouse selection.
- A one-carbon reaction network backed by a pinned knowledge release.
- Explicit model-only initial concentrations and kinetic parameters.
- Baseline and reduced-MTHFR perturbation presets.
- Deterministic integration and diagnostics.
- Concentration and flux time series.
- Summary measures including homocysteine and SAM-to-SAH behavior.
- Clear separation of curated knowledge from illustrative model assumptions.

## Controlled Run Goals

Every run records:

- Knowledge release identifier and digest.
- Model and engine version.
- Taxon.
- Preset and effective parameters.
- Initial conditions and units.
- Numerical controls.
- Deterministic run identity.
- Time series, summary, diagnostics, warnings, and status.

Invalid, unstable, incompatible, cancelled, or failed runs must never appear as successful scientific output.

## Experience Goals

- A user can understand the scientific scope before running anything.
- A user can inspect the exact knowledge release and evidence.
- A user can execute a baseline run without editing code.
- A user can perturb MTHFR activity and compare outcomes.
- Selecting a metabolite updates textual, chart, and 3D views together.
- Units and limitations are always visible with results.
- API failure preserves the configured experiment and offers retry.
- Keyboard and touch users can complete the workflow.

## Explicit Non-Goals

- Clinical, diagnostic, or treatment guidance.
- A complete cell, organ, or body simulation.
- Automatic parameter fitting.
- Molecular dynamics or structure prediction.
- Arbitrary user-defined equations or executable model code.
- Cloud accounts, collaboration, or distributed execution.
- Treating illustrative kinetics as measured physiology.
- Depending on a live GitHub branch or external scientific API at runtime.

## MVP Exit Criteria

The MVP is ready when the high-level scenarios in `specs/e2e/workbench.feature` pass, all runs pin and display a verified knowledge release, deterministic runs reproduce, the production build passes, and the scientific workflow remains usable on desktop, mobile, keyboard-only, and without WebGL.
