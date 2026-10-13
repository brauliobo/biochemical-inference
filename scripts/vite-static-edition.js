// Vite plugin for the static (GitHub Pages) edition, VITE_STATIC_MODE=true.
// Workbenches that need the API are replaced by a notice in views/WorkbenchView.vue,
// so their lazy imports are never requested. Rewriting them keeps those components,
// the API client and the validation schemas out of the static bundle.
export function omitApiWorkbenches() {
  return {
    name: 'omit-api-workbenches',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
      if (!id.replaceAll('\\', '/').endsWith('/src/workbenches.js')) return null
      return code.replace(/^(.*needsApi: true.*?load: )\(\) => import\('[^']+'\)/gm, "$1() => Promise.reject(new Error('This workbench needs the API server.'))")
    }
  }
}
