import { screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.vue'
import { navigate } from '../../src/router.js'
import { findWorkbench } from '../../src/workbenches.js'
import { mountVapor } from '../helpers/mount-vapor.js'

// Workbenches migrated to the design system (no legacy-workbench.css wrapper).
const migrated = ['challenge', 'spatial-registration', 'evidence', 'experiments', 'apap', 'data-plane']

beforeEach(() => {
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('migrated workbenches in the static build', () => {
  it.each(migrated)('shows the API notice instead of the %s workbench and makes no request', async (name) => {
    const request = vi.fn()
    vi.stubGlobal('fetch', request)
    vi.stubEnv('VITE_STATIC_MODE', 'true')
    navigate(`/workbench/${name}`)
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 1, name: findWorkbench(name).title })).toBeTruthy()
    expect(screen.getByText(/requires the API server/).closest('[role="status"]')).toBeTruthy()
    expect(document.querySelector('.panel')).toBeNull()
    expect(request).not.toHaveBeenCalled()
  })

  it.each(migrated)('registers %s without the legacy wrapper', (name) => {
    expect(findWorkbench(name)).toMatchObject({ needsApi: true, legacy: false })
  })
})
