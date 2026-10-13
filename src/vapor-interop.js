// TEMPORARY: the only place that knows the app still contains non-Vapor
// (virtual DOM) components.
//
// The shell, router and views are Vapor (`<script setup vapor>`), but the
// legacy workbench components in src/components/ are not migrated yet.
// vaporInteropPlugin lets a Vapor tree host those vdom components, at the cost
// of also loading the vdom runtime.
//
// DELETE THIS FILE when every SFC is `<script setup vapor>`:
//   1. remove the `installLegacyInterop(app)` calls in src/main.js and
//      tests/helpers/mount-vapor.js
//   2. delete this file
import { vaporInteropPlugin } from 'vue'

export function installLegacyInterop(app) {
  app.use(vaporInteropPlugin)
}
