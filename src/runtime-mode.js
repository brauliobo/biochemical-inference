// Static mode is the API-less build deployed to GitHub Pages (VITE_STATIC_MODE=true
// at build time, see .github/workflows/pages.yml). The knowledge site works
// there; workbenches that call the Fastify API show a notice instead.
//
// A function, not a constant, so tests can vi.stubEnv('VITE_STATIC_MODE', 'true').
export function isStaticMode() {
  return import.meta.env.VITE_STATIC_MODE === 'true'
}
