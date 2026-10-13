import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Every workbench in a populated state (loaded, run, disclosed, ...), audited in a
// real browser with the built stylesheet: colour contrast, target size and reflow,
// which jsdom cannot check. The states are the ones the component tests audit with
// axe in jsdom: `A11Y_SNAPSHOT_DIR` makes `expectAccessible()` (tests/helpers/axe.js)
// write the audited DOM there, and this spec replays each snapshot inside the page of
// the static build, so no API is needed. Runs after `npm run build:static`.
const directory = join(process.cwd(), 'node_modules', '.cache', 'a11y-populated')
const done = join(directory, '.complete')

function snapshots() {
  if (!existsSync(done)) {
    rmSync(directory, { recursive: true, force: true })
    mkdirSync(directory, { recursive: true })
    execFileSync('npx', ['vitest', 'run', 'tests/component', '--testTimeout=200000', '--reporter=dot'], { env: { ...process.env, A11Y_SNAPSHOT_DIR: directory }, stdio: 'pipe', timeout: 280_000 })
    writeFileSync(done, new Date().toISOString())
  }
  return readdirSync(directory).filter((file) => file.endsWith('.html') && !file.includes('route-accessibility')).sort()
}

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violation and no horizontal overflow in any populated workbench state (${colorScheme})`, async ({ page }) => {
    test.setTimeout(420_000)
    const states = snapshots()
    expect(states.length).toBeGreaterThan(15)
    await page.emulateMedia({ colorScheme })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    const problems = []
    for (const file of states) {
      const html = readFileSync(join(directory, file), 'utf8')
      await page.evaluate((markup) => {
        document.title = 'Populated state'
        document.body.innerHTML = `<main class="container"><h1>Populated state</h1>${markup}</main>`
      }, html)
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      problems.push(...violations.map((violation) => `${file}: ${violation.id} (${violation.nodes.length}) ${violation.nodes[0].target.join(' ')}`))
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      if (overflow > 1) problems.push(`${file}: ${overflow}px of horizontal overflow`)
    }
    expect(problems).toEqual([])
  })
}
