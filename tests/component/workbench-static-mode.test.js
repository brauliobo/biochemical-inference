import { screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.vue'
import { navigate } from '../../src/router.js'
import { findWorkbench, workbenches } from '../../src/workbenches.js'
import { mountVapor } from '../helpers/mount-vapor.js'

beforeEach(() => {
  window.scrollTo = vi.fn()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('workbenches in the static build', () => {
  it.each(workbenches.map((item) => item.name))('shows the API notice instead of the %s workbench and makes no request', async (name) => {
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

  it('registers only the fields the workbench view reads', () => {
    for (const item of workbenches) {
      expect(Object.keys(item).filter((key) => !['name', 'title', 'summary', 'needsApi', 'props', 'load'].includes(key)), item.name).toEqual([])
    }
  })
})
