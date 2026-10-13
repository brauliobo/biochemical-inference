import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../src/App.vue'
import { navigate } from '../../src/router.js'
import { workbenches } from '../../src/workbenches.js'
import { mountVapor } from '../helpers/mount-vapor.js'

const api = vi.hoisted(() => ({ loadPortfolioModels: vi.fn(), runPortfolioExperiment: vi.fn() }))
vi.mock('../../src/api.js', () => api)

beforeEach(() => {
  window.scrollTo = vi.fn()
  navigate('/')
})

afterEach(() => vi.unstubAllEnvs())

const nav = () => within(screen.getByRole('navigation', { name: 'Primary' }))

describe('app shell', () => {
  it('provides the landmarks, a skip link and the disclaimer', async () => {
    mountVapor(App)

    expect(screen.getByRole('banner')).toBeTruthy()
    expect(screen.getByRole('main')).toBeTruthy()
    expect(screen.getByRole('contentinfo').textContent).toMatch(/not medical advice/i)
    expect(screen.getByRole('link', { name: 'Skip to main content' }).getAttribute('href')).toBe('#main')
    expect(await screen.findByRole('heading', { level: 1, name: /Methylation biochemistry/ })).toBeTruthy()
    expect(document.title).toBe('Home · Biochemical Inference')
    // class on <RouterLink> falls through to its root <a>
    expect(screen.getByRole('link', { name: 'Browse the knowledge base' }).classList.contains('button')).toBe(true)
  })

  it('moves focus to main from the skip link without changing the route', async () => {
    mountVapor(App)
    await screen.findByRole('heading', { level: 1 })

    await fireEvent.click(screen.getByRole('link', { name: 'Skip to main content' }))

    expect(document.activeElement).toBe(screen.getByRole('main'))
    expect(window.location.hash).not.toBe('#main')
  })

  it('marks the current page in the navigation and announces each navigation', async () => {
    mountVapor(App)
    await screen.findByRole('heading', { level: 1 })
    expect(nav().getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBe('page')

    await fireEvent.click(nav().getByRole('link', { name: 'Knowledge base' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Knowledge base' })).toBeTruthy()
    expect(nav().getByRole('link', { name: 'Knowledge base' }).getAttribute('aria-current')).toBe('page')
    expect(nav().getByRole('link', { name: 'Home' }).getAttribute('aria-current')).toBeNull()
    expect(document.title).toBe('Knowledge base · Biochemical Inference')
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole('main')))
    expect(screen.getByRole('status').textContent).toBe(document.title)
  })

  it('renders entity routes with params and keeps their section marked', async () => {
    navigate('/kb/enzymes/mthfr')
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 1, name: 'mthfr' })).toBeTruthy()
    expect(nav().getByRole('link', { name: 'Knowledge base' }).getAttribute('aria-current')).toBe('true')

    navigate('/kb/enzymes/comt')
    expect(await screen.findByRole('heading', { level: 1, name: 'comt' })).toBeTruthy()
  })

  it('shows a 404 page with a way out', async () => {
    navigate('/does/not/exist')
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Go to the home page' }).getAttribute('href')).toBe('#/')
  })
})

describe('workbench routes', () => {
  it('lists every registered workbench', async () => {
    navigate('/workbench')
    mountVapor(App)

    await screen.findByRole('heading', { level: 1, name: 'Workbenches' })
    const links = within(screen.getByRole('main')).getAllByRole('link').filter((link) => link.getAttribute('href').startsWith('#/workbench/'))
    expect(links).toHaveLength(workbenches.length)
  })

  it('lazy-loads a legacy virtual-DOM workbench inside the Vapor shell', async () => {
    api.loadPortfolioModels.mockResolvedValue([])
    navigate('/workbench/portfolio')
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 2, name: 'ODE · SSA · FBA workbench' })).toBeTruthy()
    expect(document.querySelector('.legacy-workbench .portfolio-panel')).toBeTruthy()
    expect(api.loadPortfolioModels).toHaveBeenCalled()
  })

  it('shows one notice instead of the workbench in static mode', async () => {
    vi.stubEnv('VITE_STATIC_MODE', 'true')
    navigate('/workbench/atlas')
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 1, name: 'MTHFR evidence atlas' })).toBeTruthy()
    expect(screen.getByText(/requires the API server/).closest('[role="status"]')).toBeTruthy()
    expect(document.querySelector('.legacy-workbench')).toBeNull()
  })

  it('reports an unknown workbench as not found', async () => {
    navigate('/workbench/zzz')
    mountVapor(App)

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeTruthy()
  })
})
