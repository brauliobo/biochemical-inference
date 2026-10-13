import { fireEvent, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App.vue'
import { getPath, pathList, pathsFor } from '../../src/knowledge/index.js'
import { navigate } from '../../src/router.js'
import { expectAccessible } from '../helpers/axe.js'
import { mountVapor } from '../helpers/mount-vapor.js'

beforeEach(() => {
  window.scrollTo = () => {}
})

async function open(path) {
  navigate(path)
  const view = mountVapor(App)
  await screen.findByRole('heading', { level: 1 })
  return view
}

const main = () => screen.getByRole('main')
const h1 = () => screen.getByRole('heading', { level: 1 })
const step = () => screen.getByRole('heading', { level: 2, name: (_, element) => element.id === 'step-heading' })
const stepLinks = () => within(screen.getByRole('navigation', { name: 'Move between steps' })).queryAllByRole('link')

const BELCHING = getPath('glycine-belching-question')

describe('/kb/paths', () => {
  it('lists every guided path with its summary and step count, linking to the first step', async () => {
    await open('/kb/paths')
    expect(h1().textContent).toBe('Guided paths')
    const list = pathList()
    const titles = within(main()).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(titles).toEqual(list.map((item) => item.title))
    for (const item of list) {
      const link = within(main()).getByRole('link', { name: item.title })
      expect(link.getAttribute('href')).toBe(`#/kb/paths/${item.id}`)
      expect(within(link.closest('article')).getByText(item.summary)).toBeTruthy()
      expect(within(link.closest('article')).getByText(`${item.length} steps`)).toBeTruthy()
    }
    expect(document.title).toMatch(/^Guided paths · /)
  })

  it('has no accessibility violations', async () => {
    await open('/kb/paths')
    await expectAccessible(document.body, { page: true })
  })

  it('is not read as an entity type', async () => {
    await open('/kb/paths')
    expect(screen.queryByText(/We have no entries of that kind/)).toBeNull()
  })
})

describe('/kb/paths/:id', () => {
  it('opens on the first step with a heading, summary, badges, reason, progress and a Next link only', async () => {
    await open('/kb/paths/glycine-belching-question')
    expect(h1().textContent).toBe(BELCHING.title)
    const first = BELCHING.steps[0]
    expect(step().textContent).toBe(first.entity.name)
    expect(within(main()).getByText(`Step 1 of ${BELCHING.length}`)).toBeTruthy()
    expect(within(main()).getByText(first.why)).toBeTruthy()
    expect(within(main()).getByText(first.entity.summary)).toBeTruthy()
    expect(within(main()).getByText(first.entity.typeLabel, { selector: '.badge' })).toBeTruthy()
    expect(within(main()).getAllByText(/^Evidence: /)).toHaveLength(1)
    expect(within(main()).getByRole('link', { name: `Read the page for ${first.entity.name}` }).getAttribute('href')).toBe(`#/kb/${first.entity.id.replace(':', '/')}`)

    const bar = within(main()).getByRole('progressbar')
    expect(bar.tagName).toBe('PROGRESS')
    expect(bar.getAttribute('max')).toBe(String(BELCHING.length))
    expect(bar.value).toBe(1)
    expect(bar.getAttribute('aria-valuetext')).toBe(`Step 1 of ${BELCHING.length}`)
    expect(bar.getAttribute('aria-labelledby')).toBe('step-progress-label')

    expect(stepLinks().map((link) => link.getAttribute('href'))).toEqual([`#/kb/paths/${BELCHING.id}?step=2`])
    expect(stepLinks()[0].textContent).toBe(`Next: ${BELCHING.steps[1].entity.name}`)
    expect(document.title).toBe(`Step 1 of ${BELCHING.length}: ${first.entity.name} · ${BELCHING.title} · Biochemical Inference`)
  })

  it('deep-links to a step with ?step=, with Previous and Next both present in the middle', async () => {
    await open('/kb/paths/glycine-belching-question?step=3')
    const third = BELCHING.steps[2]
    expect(step().textContent).toBe(third.entity.name)
    expect(within(main()).getByText(`Step 3 of ${BELCHING.length}`)).toBeTruthy()
    expect(within(main()).getByText(third.why)).toBeTruthy()
    expect(within(main()).getByRole('progressbar').value).toBe(3)
    expect(stepLinks().map((link) => link.getAttribute('href'))).toEqual([`#/kb/paths/${BELCHING.id}?step=2`, `#/kb/paths/${BELCHING.id}?step=4`])
    expect(stepLinks()[0].textContent).toBe(`Previous: ${BELCHING.steps[1].entity.name}`)
  })

  it('on the last step offers Previous and a way back to all paths instead of Next', async () => {
    await open(`/kb/paths/glycine-belching-question?step=${BELCHING.length}`)
    expect(within(main()).getByText(`Step ${BELCHING.length} of ${BELCHING.length}`)).toBeTruthy()
    expect(within(main()).getByRole('progressbar').value).toBe(BELCHING.length)
    expect(stepLinks().map((link) => link.getAttribute('href'))).toEqual([`#/kb/paths/${BELCHING.id}?step=${BELCHING.length - 1}`, '#/kb/paths'])
    expect(within(main()).queryByRole('link', { name: /^Next:/ })).toBeNull()
  })

  it('clamps a missing, malformed or out-of-range step', async () => {
    await open('/kb/paths/glycine-belching-question?step=abc')
    expect(within(main()).getByText(`Step 1 of ${BELCHING.length}`)).toBeTruthy()
    navigate('/kb/paths/glycine-belching-question?step=999')
    await waitFor(() => expect(within(main()).getByText(`Step ${BELCHING.length} of ${BELCHING.length}`)).toBeTruthy())
    navigate('/kb/paths/glycine-belching-question?step=0')
    await waitFor(() => expect(within(main()).getByText(`Step 1 of ${BELCHING.length}`)).toBeTruthy())
  })

  it('moves between steps with the links, keeping the step in the URL and putting focus on the step heading', async () => {
    await open('/kb/paths/glycine-belching-question')
    await fireEvent.click(stepLinks()[0])
    await waitFor(() => expect(within(main()).getByText(`Step 2 of ${BELCHING.length}`)).toBeTruthy())
    expect(window.location.hash).toBe(`#/kb/paths/${BELCHING.id}?step=2`)
    expect(step().textContent).toBe(BELCHING.steps[1].entity.name)
    await waitFor(() => expect(document.activeElement).toBe(step()))
    await fireEvent.click(within(main()).getByRole('link', { name: /^Previous:/ }))
    await waitFor(() => expect(within(main()).getByText(`Step 1 of ${BELCHING.length}`)).toBeTruthy())
    await waitFor(() => expect(document.activeElement).toBe(step()))
    expect(document.title).toMatch(new RegExp(`^Step 1 of ${BELCHING.length}: `))
  })

  it('lists every step as a link to its own URL and marks the current one in words', async () => {
    await open('/kb/paths/glycine-belching-question?step=2')
    const section = screen.getByRole('heading', { level: 2, name: `All ${BELCHING.length} steps` }).closest('section')
    const items = within(section).getAllByRole('listitem')
    expect(items).toHaveLength(BELCHING.length)
    expect(items[1].textContent).toBe(`2. ${BELCHING.steps[1].entity.name} (you are here)`)
    expect(items[1].querySelector('[aria-current="step"]')).toBeTruthy()
    expect(within(items[0]).getByRole('link').getAttribute('href')).toBe(`#/kb/paths/${BELCHING.id}?step=1`)
    expect(within(items[BELCHING.length - 1]).getByRole('link').getAttribute('href')).toBe(`#/kb/paths/${BELCHING.id}?step=${BELCHING.length}`)
  })

  it('has breadcrumbs back to the list and the knowledge base', async () => {
    await open('/kb/paths/glycine-belching-question?step=4')
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }))
    expect(crumbs.getByRole('link', { name: 'Guided paths' }).getAttribute('href')).toBe('#/kb/paths')
    expect(crumbs.getByRole('link', { name: 'Knowledge base' }).getAttribute('href')).toBe('#/kb')
    expect(crumbs.getByText(BELCHING.title).getAttribute('aria-current')).toBe('page')
  })

  it('shows every step of every path without a broken entity', async () => {
    await open('/kb/paths/glycine-belching-question')
    for (const item of pathList()) {
      const path = getPath(item.id)
      navigate(`/kb/paths/${item.id}?step=${path.length}`)
      await waitFor(() => expect(h1().textContent).toBe(path.title))
      expect(step().textContent).toBe(path.steps.at(-1).entity.name)
    }
  })

  it('explains an unknown path and offers the real ones', async () => {
    await open('/kb/paths/no-such-path')
    expect(h1().textContent).toBe('We could not find that guided path')
    expect(within(main()).getAllByRole('heading', { level: 2 })).toHaveLength(pathList().length)
    expect(within(main()).getByRole('link', { name: 'All guided paths' }).getAttribute('href')).toBe('#/kb/paths')
    expect(document.title).toMatch(/^Guided path not found/)
  })

  it.each([1, 5, 11])('has no accessibility violations at step %i', async (position) => {
    await open(`/kb/paths/glycine-belching-question?step=${position}`)
    await expectAccessible(document.body, { page: true })
  })
})

describe('guided paths surfaced elsewhere', () => {
  it('Home lists every path before "Start here", linking to the first step, and keeps the start-here path', async () => {
    await open('/')
    const section = screen.getByRole('heading', { level: 2, name: 'Guided paths' }).closest('section')
    for (const item of pathList()) {
      expect(within(section).getByRole('link', { name: item.title }).getAttribute('href')).toBe(`#/kb/paths/${item.id}`)
    }
    expect(within(section).getByRole('link', { name: 'All guided paths' }).getAttribute('href')).toBe('#/kb/paths')
    const headings = within(main()).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings.indexOf('Guided paths')).toBeLessThan(headings.indexOf('Start here'))
  })

  it('/kb lists every path above the kinds', async () => {
    await open('/kb')
    const section = screen.getByRole('heading', { level: 2, name: 'Guided paths' }).closest('section')
    expect(within(section).getAllByRole('heading', { level: 3 })).toHaveLength(pathList().length)
    expect(within(section).getByRole('link', { name: 'All guided paths' }).getAttribute('href')).toBe('#/kb/paths')
  })

  it('an entity page lists the paths it is part of, each linking to the right step with the reason', async () => {
    await open('/kb/enzyme/gnmt')
    const section = screen.getByRole('heading', { level: 2, name: 'Part of guided paths' }).closest('section')
    const found = pathsFor('enzyme:gnmt')
    expect(found.length).toBeGreaterThan(1)
    for (const item of found) {
      const link = within(section).getByRole('link', { name: `${item.title}, step ${item.position} of ${item.length}` })
      expect(link.getAttribute('href')).toBe(`#/kb/paths/${item.id}?step=${item.position}`)
      expect(within(section).getByText(item.why)).toBeTruthy()
    }
    await fireEvent.click(within(section).getByRole('link', { name: new RegExp(`^${found[0].title}`) }))
    await waitFor(() => expect(h1().textContent).toBe(found[0].title))
    expect(step().textContent).toBe('Glycine N-methyltransferase (GNMT)')
    expect(within(main()).getByText(`Step ${found[0].position} of ${found[0].length}`)).toBeTruthy()
  })

  it('an entity in no path has no such block', async () => {
    await open('/kb/enzyme/gnmt')
    expect(pathsFor('enzyme:mthfr')).toEqual([])
    navigate('/kb/enzyme/mthfr')
    await waitFor(() => expect(screen.queryByRole('heading', { level: 2, name: 'Part of guided paths' })).toBeNull())
  })
})
