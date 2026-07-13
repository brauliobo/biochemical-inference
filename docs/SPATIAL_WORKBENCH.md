# Spatial Tissue Workbench

## Release boundary

Goal 7 pins the independent producer release `apap-liver-spatial-benchmark-v1.0.0` and digest `fd838be6771c61b79eb97561320ffee8096f538e31ec769480c0a4979101290b`. It does not modify or inherit trust from the Goal 6 APAP release.

The Fastify server verifies strict catalog, detail, structure, space, transform, asset, descriptor, mapping, and inventory contracts. The producer release detail supplies mappings and inventory. Because producer API v1 does not expose its published `transforms.json` as a route, the inference adapter returns the two release-pinned transforms only after verifying the manifest's exact transform-file digest.

Content is addressed only by strict asset and content IDs. Paths are never accepted from a browser. The server resolves ownership against the verified inventory, enforces the 1 MiB release cap, accepts one closed, open, or suffix range, forwards a normalized range, and verifies immutable release/content headers. A complete response is also checked against its inventory byte count and SHA-256 digest.

## Linked behavior

`APAPBenchmarkWorkbench` owns time, field, and the selected portal-to-central bin. The heatmap, complete numeric table, semantic spatial inspector, keyboard controls, and Three.js scene all consume those values. Scene selection can only select an existing synthetic cell or cuboid bin; it cannot create a coordinate or mapping.

The lazy Three.js scene renders:

- a repository-authored synthetic cuboid lobule;
- portal and central orientation markers;
- an `InstancedMesh` of the release's four synthetic hepatocyte points;
- APAP run field coloring using the selected time and field;
- selected-bin emphasis and keyboard/raycast selection.

The semantic inspector always exposes the selected time, field, bin, all nine values, release provenance, scale domain, interpolation, missing-value policy, uncertainty meaning, coordinate convention, and selected LOD. WebGL initialization failure and context loss leave all of those controls and the complete APAP numeric table active.

## Scientific boundary

- Geometry, coordinates, transforms, instances, and release fields are synthetic algorithm fixtures, not measured tissue.
- The APAP run's 12 bins are numerical model state, not anatomical registration.
- HRA is explicitly unavailable: there is no HRA geometry, target space, transform, donor, source version, or licensed content in this release.
- Mouse data cannot target human reference anatomy. Pointer interactions do not place cells or results into HRA.
- The producer's dimensionless release field and the APAP run result are distinct. The descriptor documents release encoding policy; scene colors use the selected APAP run field and state their run-specific scale.
- Exact-synthetic uncertainty means byte-exact fixture values, not zero biological uncertainty.
- The four cell markers do not represent density, morphology, segmentation, histology, or zonation.
