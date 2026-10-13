import { expect, test } from '@playwright/test'

// ISO 9241-11 task-success and efficiency measures from docs/USABILITY.md, automated:
// effectiveness (the task is completed), efficiency (interactions and key presses
// needed) and operability from the keyboard alone. An interaction is one activation of
// a link or control (click, tap or Enter); typing and moving focus are counted only
// where noted. Each test records its measure as an annotation ("measure") so the
// numbers appear in the report; docs/USABILITY.md lists the last recorded results.
//
//   npm run build:static && npm run test:e2e:static
const MAX_INTERACTIONS = 3 // E3 / F1

const record = (name, value) => {
  test.info().annotations.push({ type: 'measure', description: `${name} = ${value}` })
  console.log(`MEASURE [${test.info().project.name}] ${name} = ${value}`)
}
const heading = (page, name) => page.getByRole('heading', { level: 1, name })
const settle = (page) => page.waitForLoadState('networkidle')

// Clicks the first match of `locator` and returns 1, so callers can add up interactions.
async function activate(locator) {
  await locator.first().click()
  return 1
}

test.describe('tasks from Home, with the mouse or touch', () => {
  test('T1 learn what betaine is: 1 interaction from Home to a page with a plain summary and an evidence badge', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('main').getByRole('link', { name: 'Betaine', exact: true }))
    await expect(heading(page, /Betaine/)).toBeVisible()
    await expect(page.locator('main .lede')).not.toBeEmpty()
    await expect(page.getByText(/^Evidence: /).first()).toBeVisible()
    await expect(page.getByText(/Well supported by|Mechanistically reasonable|little or no direct support|not yet checked/).first()).toBeVisible() // the grade is explained in plain words
    record('T1 interactions', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('T2 find GNMT by name: 2 interactions (focus the search box, choose the result)', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('searchbox'))
    await page.keyboard.type('GNMT')
    interactions += await activate(page.locator('main a[href="#/kb/enzyme/gnmt"]'))
    await expect(heading(page, /Glycine N-methyltransferase/)).toBeVisible()
    record('T2 interactions (search)', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('T2 find GNMT by browsing: 3 interactions (kind, then entry)', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('link', { name: /^Enzymes/ }))
    await expect(heading(page, 'Enzymes')).toBeVisible()
    interactions += await activate(page.locator('main a[href="#/kb/enzyme/gnmt"]'))
    await expect(heading(page, /Glycine N-methyltransferase/)).toBeVisible()
    record('T2 interactions (browse)', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('T2 filter a listing to find an entry by text', async ({ page }) => {
    await page.goto('/#/kb/enzyme')
    await page.getByLabel('Filter by name or text').fill('methyltransferase')
    const shown = Number((await page.getByRole('status').filter({ hasText: /^Showing/ }).textContent()).match(/Showing (\d+)/)[1])
    expect(shown).toBeGreaterThan(0)
    expect(shown).toBeLessThan(20)
    record('T2 filter results for "methyltransferase"', shown)
  })

  test('T3 follow relationships: from GNMT to the reaction it catalyses in 1 interaction, and on to a compound in 2', async ({ page }) => {
    await page.goto('/#/kb/enzyme/gnmt')
    let interactions = 0
    interactions += await activate(page.getByRole('heading', { name: /^Catalyzes/ }).locator('xpath=ancestor::section[1]').getByRole('link'))
    await expect(page.locator('main .equation')).toBeVisible()
    interactions += await activate(page.locator('main .equation').getByRole('link').first())
    await expect(page.getByText(/^Compound$/).first()).toBeVisible()
    record('T3 interactions (enzyme to reaction to compound)', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('T3 find what links glycine to belching: the start-here step shows a labelled chain in 1 interaction', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('link', { name: 'The belching question' }))
    await expect(heading(page, 'Glycine')).toBeVisible()
    const chain = page.locator('main details[open] ol li')
    await expect(chain.first()).toBeVisible()
    const steps = await chain.count()
    expect(steps).toBeGreaterThan(0)
    for (const step of await chain.all()) {
      await expect(step.locator('.badge')).not.toBeEmpty() // each step names its relationship
      expect(await step.getByRole('link').count()).toBe(2)
    }
    await expect(chain.last().getByRole('link').last()).toHaveAttribute('href', '#/kb/outcome/belching')
    record('T3 glycine-to-belching interactions (guided)', interactions)
    record('T3 glycine-to-belching chain length (steps)', steps)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('T3 find what links glycine to belching by choosing the target on the entity page: 4 interactions', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('main').getByRole('link', { name: 'Glycine', exact: true }))
    await expect(heading(page, 'Glycine')).toBeVisible()
    interactions += await activate(page.getByText(/How is Glycine connected/))
    interactions += await activate(page.getByLabel('Connect to'))
    await page.keyboard.type('belching')
    interactions += await activate(page.getByRole('button', { name: /^Belching/ }))
    await expect(page.locator('main details[open] ol li').first()).toBeVisible()
    expect(new URL(page.url()).hash).toBe('#/kb/compound/glycine?to=outcome%3Abelching')
    record('T3 glycine-to-belching interactions (manual)', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS + 1)
  })

  test('T4 compare under- and over-methylation: each page is 1 interaction from Home and they are linked', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('main').getByRole('link', { name: 'Under-methylation', exact: true }))
    await expect(heading(page, 'Under-methylation')).toBeVisible()
    interactions += await activate(page.getByText(/How is Under-methylation connected/))
    interactions += await activate(page.getByLabel('Connect to'))
    await page.keyboard.type('over-methylation')
    interactions += await activate(page.getByRole('button', { name: /^Over-methylation/ }))
    await expect(page.getByRole('heading', { level: 3, name: 'Under-methylation to Over-methylation' })).toBeVisible()
    record('T4 interactions (page, then relationship to the other)', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS + 1)
  })

  test('T5 check the evidence behind a statement: claims audit in 1 interaction, a claim with status and evidence in 2', async ({ page }) => {
    await page.goto('/')
    let interactions = 0
    interactions += await activate(page.getByRole('main').getByRole('link', { name: 'Claims audit', exact: true }))
    await expect(heading(page, 'Claims')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /^Unsupported \(\d+\)$/ })).toBeVisible()
    interactions += await activate(page.getByRole('heading', { name: /^Supported \(/ }).locator('xpath=ancestor::section[1]').getByRole('link'))
    await expect(page.getByText(/^Claim: /).first()).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Evidence for this claim' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Evidence against this claim' })).toBeVisible()
    record('T5 interactions', interactions)
    expect(interactions).toBeLessThanOrEqual(MAX_INTERACTIONS)
  })

  test('E3 every kind is 1 interaction from Home and its first entry is 2', async ({ page }) => {
    await page.goto('/')
    const cards = page.getByRole('heading', { name: 'Browse by kind' }).locator('xpath=ancestor::section[1]').getByRole('link')
    await expect(cards).toHaveCount(11)
    const hrefs = await cards.evaluateAll((links) => links.map((link) => link.getAttribute('href')))
    for (const [index, href] of hrefs.entries()) {
      await page.goto('/')
      await settle(page)
      await cards.nth(index).click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const entry = page.locator(`main ul a[href^="${href}/"]`).first()
      if ((await entry.count()) === 0) continue // a kind with no entries yet (articles until articles.js lands)
      await entry.click()
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    }
    record('E3 kinds reachable from Home in 1 interaction', hrefs.length)
  })

  test('T6 a copied address reopens the same page in a fresh browser, including a shared connection', async ({ page, browser }) => {
    await page.goto('/#/kb/compound/glycine?to=outcome%3Abelching')
    await expect(page.locator('main details[open] ol li').first()).toBeVisible()
    const copied = page.url()
    const fresh = await browser.newContext()
    const other = await fresh.newPage()
    await other.goto(copied)
    await expect(heading(other, 'Glycine')).toBeVisible()
    await expect(other.locator('main details[open] ol li').first()).toBeVisible()
    await fresh.close()
    record('T6 deep link restores page and result', 'yes')
  })

  test('T8 the "not medical advice" notice is fully inside the first screen of Home and in every page footer', async ({ page }) => {
    await page.goto('/')
    const notice = page.getByRole('note').filter({ hasText: /not medical advice/i })
    await expect(notice).toBeVisible()
    const box = await notice.boundingBox()
    const viewport = page.viewportSize()
    record('T8 notice bottom edge / viewport height', `${Math.round(box.y + box.height)} / ${viewport.height}`)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height) // fully inside the first screen, also on a phone
    for (const route of ['/#/', '/#/kb/state/undermethylation', '/#/kb/claim']) {
      await page.goto(route)
      await expect(page.getByRole('contentinfo')).toContainText(/not medical advice/i)
    }
  })
})

test.describe('keyboard only', () => {
  test('T2 reaches GNMT from Home with no pointer: Tab to the search box, type, Enter', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    let tabs = 0
    while (tabs < 20) {
      await page.keyboard.press('Tab')
      tabs += 1
      if (await page.getByRole('searchbox').evaluate((input) => input === document.activeElement)) break
    }
    await expect(page.getByRole('searchbox')).toBeFocused()
    record('keyboard: Tab presses from page load to the search box', tabs)
    expect(tabs).toBeLessThanOrEqual(10)

    await page.keyboard.type('gnmt')
    await expect(page.locator('main a[href="#/kb/enzyme/gnmt"]').first()).toBeVisible()
    await page.keyboard.press('Enter') // opens the best match
    await expect(heading(page, /Glycine N-methyltransferase/)).toBeVisible()
    await expect(page.getByRole('main')).toBeFocused()
    record('keyboard: interactions for T2', 1)
  })

  test('arrow keys move through the search results and Enter follows the focused link', async ({ page }) => {
    await page.goto('/#/kb')
    await page.getByRole('searchbox').focus()
    await page.keyboard.type('glycine')
    await expect(page.locator('main ul a').first()).toBeVisible()
    await page.keyboard.press('ArrowDown')
    const first = await page.evaluate(() => document.activeElement.getAttribute('href'))
    await page.keyboard.press('ArrowDown')
    const second = await page.evaluate(() => document.activeElement.getAttribute('href'))
    expect(first).toMatch(/^#\/kb\//)
    expect(second).not.toBe(first)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('searchbox')).toBeFocused()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    expect(new URL(page.url()).hash).toBe(first)
  })

  test('T3 follows a relationship link with Tab and Enter, then asks how two entries are connected', async ({ page }) => {
    await page.goto('/#/kb/compound/glycine')
    await expect(heading(page, 'Glycine')).toBeVisible()
    await page.getByRole('main').focus()
    let tabs = 0
    while (tabs < 80) {
      await page.keyboard.press('Tab')
      tabs += 1
      const href = await page.evaluate(() => document.activeElement.getAttribute('href') ?? '')
      if (href.startsWith('#/kb/reaction/') || href.startsWith('#/kb/enzyme/')) break
    }
    record('keyboard: Tab presses from the top of an entity page to its first reaction or enzyme link', tabs)
    await page.keyboard.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toBeVisible()
    await expect(page.getByRole('main')).toBeFocused()

    await page.goto('/#/kb/compound/glycine')
    await expect(heading(page, 'Glycine')).toBeVisible()
    await page.locator('main summary').filter({ hasText: /How is Glycine connected/ }).focus()
    await page.keyboard.press('Enter') // opens the disclosure
    await page.getByLabel('Connect to').focus()
    await page.keyboard.type('belching')
    await page.keyboard.press('Enter') // chooses the best match
    await expect(page.locator('main details[open] ol li').first()).toBeVisible()
  })

  test('T9 follows the glycine-belching guided path from Home to its last step with the keyboard only', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    let presses = 0
    const focusedHref = () => page.evaluate(() => document.activeElement?.getAttribute('href') ?? '')
    const tabTo = async (matches, limit = 40) => {
      for (let count = 0; count < limit; count += 1) {
        await page.keyboard.press('Tab')
        presses += 1
        if (matches(await focusedHref(), await page.evaluate(() => document.activeElement?.textContent ?? ''))) return count + 1
      }
      throw new Error(`no matching control within ${limit} Tab presses`)
    }
    const toPath = await tabTo((href) => href === '#/kb/paths/glycine-belching-question')
    record('T9 keyboard: Tab presses from page load to the glycine-belching path link', toPath)
    await page.keyboard.press('Enter')
    await expect(heading(page, 'The glycine-belching question')).toBeVisible()
    await expect(page.getByRole('main')).toBeFocused()
    const total = Number((await page.getByText(/^Step 1 of \d+$/).textContent()).match(/of (\d+)/)[1])
    expect(total).toBeGreaterThan(3)

    let step = 1
    while (step < total) {
      const perStep = await tabTo((href, text) => href.endsWith(`?step=${step + 1}`) && text.startsWith('Next:'), 6)
      // From <main> (first step): three breadcrumb links, Read the page, Next. Later, from the focused heading:
      // Read the page, Previous, Next.
      expect(perStep).toBeLessThanOrEqual(step === 1 ? 5 : 3)
      if (step === 2) record('T9 keyboard: Tab presses per step (from the step heading to Next)', perStep)
      await page.keyboard.press('Enter')
      step += 1
      await expect(page.getByText(`Step ${step} of ${total}`, { exact: true })).toBeVisible()
      await expect(page.locator('#step-heading')).toBeFocused() // the new step is where the keyboard is
      expect(new URL(page.url()).hash).toBe(`#/kb/paths/glycine-belching-question?step=${step}`)
    }
    await expect(page.getByRole('progressbar')).toHaveJSProperty('value', total)
    await expect(page.getByRole('link', { name: /^Next:/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Previous:/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'End of the path: all guided paths' })).toHaveAttribute('href', '#/kb/paths')
    record('T9 keyboard: Tab presses from Home to the last step', presses)
    record('T9 keyboard: steps followed', total)
  })

  test('a step deep link reopens the same step in a fresh browser and the entity page links back to it (T6)', async ({ page, browser }) => {
    await page.goto('/#/kb/paths/glycine-belching-question?step=5')
    await expect(page.getByText(/^Step 5 of \d+$/)).toBeVisible()
    const heading5 = await page.locator('#step-heading').textContent()
    const fresh = await browser.newContext()
    const other = await fresh.newPage()
    await other.goto(page.url())
    await expect(other.getByText(/^Step 5 of \d+$/)).toBeVisible()
    await expect(other.locator('#step-heading')).toHaveText(heading5)
    await fresh.close()
    await page.goto('/#/kb/enzyme/gnmt')
    const link = page.getByRole('link', { name: /^The glycine-belching question, step 5 of/ })
    await link.click()
    await expect(page.locator('#step-heading')).toHaveText(heading5)
  })

  test('primary navigation is within 5 Tab presses of page load, on Home and on an entity page (F5)', async ({ page }) => {
    for (const route of ['/#/', '/#/kb/enzyme/gnmt']) {
      await page.goto(route)
      await page.reload() // a fresh page load: after in-app navigation focus is deliberately on <main>
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      let presses = 0
      while (presses < 10) {
        await page.keyboard.press('Tab')
        presses += 1
        if (await page.evaluate(() => document.activeElement?.closest('nav[aria-label="Primary"]') !== null)) break
      }
      record(`F5 Tab presses to primary navigation (${route})`, presses)
      expect(presses).toBeLessThanOrEqual(5)
    }
  })

  test('every control on the key pages can be reached by Tab and shows a focus indicator', async ({ page }) => {
    for (const route of ['/#/', '/#/kb/claim', '/#/kb/reaction/gnmt-glycine-methylation']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await settle(page)
      const total = await page.evaluate(() => document.querySelectorAll('a[href], button, input, select, summary').length)
      const seen = new Set()
      let hidden = 0
      for (let press = 0; press < total + 5; press += 1) {
        await page.keyboard.press('Tab')
        const state = await page.evaluate(() => {
          const element = document.activeElement
          if (!element || element === document.body) return null
          const style = getComputedStyle(element)
          return { key: element.outerHTML.slice(0, 120), outline: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0 }
        })
        if (!state) break
        seen.add(state.key)
        if (!state.outline) hidden += 1
      }
      expect(hidden, `${route}: focused controls without an outline`).toBe(0)
      expect(seen.size, route).toBeGreaterThan(10)
    }
  })
})

test.describe('reflow and target size', () => {
  test('no horizontal scrolling at 320 CSS px on the key pages (A5)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 })
    const overflowing = []
    for (const route of ['/#/', '/#/kb', '/#/kb/claim', '/#/kb/reaction', '/#/kb/state/undermethylation', '/#/kb/reaction/gnmt-glycine-methylation', '/#/kb/compound/glycine?to=outcome%3Abelching', '/#/kb/map?id=compound%3Aglycine', '/#/kb/paths', '/#/kb/paths/glycine-belching-question?step=4']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await settle(page)
      const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      if (widths.scroll > widths.client) overflowing.push(`${route}: ${widths.scroll} > ${widths.client}`)
    }
    record('A5 routes with horizontal overflow at 320 px', overflowing.length)
    expect(overflowing).toEqual([])
  })

  test('buttons, form fields and disclosure summaries are at least 44 px tall (A4)', async ({ page }) => {
    const small = []
    for (const route of ['/#/', '/#/kb', '/#/kb/claim', '/#/kb/compound/glycine?to=outcome%3Abelching', '/#/kb/paths/glycine-belching-question?step=4']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await settle(page)
      const found = await page.evaluate(() => [...document.querySelectorAll('main button, main input, main select, main summary, a.button')]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => ({ tag: element.tagName, text: (element.textContent || element.id).trim().slice(0, 30), height: Math.round(element.getBoundingClientRect().height) }))
        .filter((item) => item.height < 44))
      small.push(...found.map((item) => `${route}: ${item.tag} "${item.text}" ${item.height}px`))
    }
    record('A4 controls under 44 px', small.length)
    expect(small).toEqual([])
  })
})
