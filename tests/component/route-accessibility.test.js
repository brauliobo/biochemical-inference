import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, it, vi } from 'vitest'
import App from '../../src/App.vue'
import { navigate } from '../../src/router.js'
import { workbenches } from '../../src/workbenches.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// The whole app shell plus each route, audited as a page (landmarks, one h1,
// heading order). Workbenches show their API-required notice in the static
// build; their working states are audited in each workbench's own test.
const KNOWLEDGE_ROUTES = ['/', '/kb', '/kb/compound', '/kb/claim', '/kb/enzyme/gnmt', '/kb/reaction/gnmt-glycine-methylation', '/kb/map', '/kb/paths', '/kb/paths/glycine-belching-question?step=4', '/kb/paths/no-such-path', '/kb/state/no-such-entry', '/no/such/page']

beforeEach(() => {
  window.scrollTo = vi.fn()
  vi.stubEnv('VITE_STATIC_MODE', 'true')
})
afterEach(() => vi.unstubAllEnvs())

async function audit(path) {
  navigate(path)
  mountVapor(App)
  await screen.findByRole('heading', { level: 1 })
  // Lazy knowledge data and the route's own content render after the heading.
  await waitFor(() => screen.getByRole('main'))
  await new Promise((settle) => setTimeout(settle, 50))
  await expectAccessible(document.body, { page: true })
}

describe('route accessibility (WCAG 2.2 AA, automated)', () => {
  it.each(KNOWLEDGE_ROUTES)('has no violations at %s', audit)
  it('has no violations at the workbench index', () => audit('/workbench'))
  it.each(workbenches.map((item) => `/workbench/${item.name}`))('has no violations at %s', audit)
})
