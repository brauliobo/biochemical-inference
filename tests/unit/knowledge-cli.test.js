// The two command line tools of the knowledge base: kb:validate (entities, paths, quantities) and build-layout.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = resolve(import.meta.dirname, '../..')
const run = (script, args = []) => spawnSync(process.execPath, [join(ROOT, 'scripts', script), ...args], { cwd: ROOT, encoding: 'utf8' })

describe('npm run kb:validate', () => {
  it('validates entities, guided paths and quantities of the shipped data with zero errors', () => {
    const result = run('kb-validate.js', ['--json'])
    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.ok).toBe(true)
    expect(report.counts.errors).toBe(0)
    expect(report.counts.quant).toBeGreaterThan(250)
    expect(report.counts.paths).toBe(9)
  })

  it('prints a human report that mentions the quantities', () => {
    const result = run('kb-validate.js')
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/quantities: \d+/)
    expect(result.stdout).toMatch(/Result: OK - 0 errors/)
  })

  it('fails on a quantity module with a bad record and names the rule', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kb-quant-'))
    const file = join(dir, 'bad-quant.js')
    writeFileSync(file, "export default [{ id: 'quant:bad', subject: 'compound:nothing', kind: 'AI', value: 1, unit: 'mg/day', basis: 'x', authority: 'IOM', population: 'adults', refs: ['article:none'], established: true }]\n")
    const result = run('kb-validate.js', ['--json', '--quant', file])
    expect(result.status).toBe(1)
    const rules = JSON.parse(result.stdout).errors.map((item) => item.rule)
    expect(rules).toEqual(expect.arrayContaining(['quant-dangling-subject', 'quant-dangling-ref']))
  })

  it('fails with a message when a companion file cannot be loaded', () => {
    const result = run('kb-validate.js', ['--json', '--quant', join(tmpdir(), 'does-not-exist.js')])
    expect(result.status).toBe(1)
    expect(JSON.parse(result.stdout).ok).toBe(false)
  })
})

describe('node scripts/build-layout.js', () => {
  it('checks every layout without writing and finds none stale', () => {
    const result = run('build-layout.js', ['--check', '--json'])
    expect(result.status).toBe(0)
    const report = JSON.parse(result.stdout)
    expect(report.ok).toBe(true)
    expect(report.layouts.map((item) => item.name)).toEqual(['bile-acid-conjugation', 'core-methylation', 'gaba-shunt-b6', 'gastric-acid', 'glycine-flux', 'tma-tmao-axis'])
    for (const item of report.layouts) expect(item.issues, item.name).toEqual([])
    const core = report.layouts.find((item) => item.name === 'core-methylation')
    expect(core.nodes).toBeGreaterThanOrEqual(100)
    expect(core.edges).toBeGreaterThan(100)
  })

  it('can be limited to one layout', () => {
    const result = run('build-layout.js', ['--check', 'gastric-acid'])
    expect(result.status).toBe(0)
    expect(result.stdout).toMatch(/ok\s+gastric-acid: 19 nodes/)
    expect(result.stdout).not.toMatch(/core-methylation/)
  })
})
