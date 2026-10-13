import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { omitApiWorkbenches } from './scripts/vite-static-edition.js'

// Deployment knobs, both read at build time:
//   VITE_BASE         public path, e.g. "/biochemical-inference/" on GitHub Pages
//   VITE_STATIC_MODE  "true" for the API-less static build (see src/runtime-mode.js)
const base = process.env.VITE_BASE || '/'
const staticMode = process.env.VITE_STATIC_MODE === 'true'

export default defineConfig({
  base,
  plugins: [vue(), ...(staticMode ? [omitApiWorkbenches()] : [])],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:3000' }
  },
  build: { outDir: 'dist' },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    coverage: { reporter: ['text', 'html'] },
    // The Node entry of `vue` is a CJS build without Vapor. Resolve the same
    // ESM bundler builds the browser uses (not the "node" export condition) and
    // inline every package that imports Vue, so the whole test graph shares one
    // Vue instance. @testing-library/vue is CJS (it would require a second Vue),
    // so it is replaced by an ESM drop-in; see tests/helpers/testing-library-vue.js.
    alias: [
      { find: /^@testing-library\/vue$/, replacement: fileURLToPath(new URL('./tests/helpers/testing-library-vue.js', import.meta.url)) },
      { find: /^vue$/, replacement: 'vue/dist/vue.runtime.esm-bundler.js' },
      { find: /^@vue\/test-utils$/, replacement: fileURLToPath(new URL('./node_modules/@vue/test-utils/dist/vue-test-utils.esm-bundler.mjs', import.meta.url)) },
      { find: /^@vue\/(runtime-dom|runtime-core|reactivity|shared)$/, replacement: '@vue/$1/dist/$1.esm-bundler.js' }
    ],
    server: { deps: { inline: [/node_modules\/@vue\//, /node_modules\/vue\//] } }
  }
})
