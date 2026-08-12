import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { expect, test } from 'vitest'

const execute = promisify(execFile)

test('npm pack declares MIT and excludes the producer golden archive', async () => {
  const { stdout } = await execute('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], { cwd: process.cwd(), maxBuffer: 16 * 1024 * 1024 })
  const value = JSON.parse(stdout)
  const pack = Array.isArray(value) ? value[0] : Object.values(value)[0]
  const paths = pack.files.map(({ path }) => path)
  expect(pack).toMatchObject({ name: 'biochemical-inference', version: '0.1.0' })
  expect(paths).toContain('LICENSE')
  expect(paths.some((path) => path.startsWith('tests/fixtures/entity-mention-handoff-producer/'))).toBe(false)
  expect(JSON.parse(await readFile('package.json', 'utf8')).license).toBe('MIT')
})
