import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test } from 'vitest'
import { checkTestSelection, workflowActions } from '../../scripts/test-selection.js'

test('closes every test and workflow action into the documented gate selection', async () => {
  await expect(checkTestSelection()).resolves.toMatchObject({
    status: 'closed',
    node_acceptance: 6,
    live_certification: 1,
    exclusions: 0,
    workflow_actions: 8
  })
})

test('recognizes SHA-pinned workflow actions with trailing comments', () => {
  expect(workflowActions('  - uses: actions/example@1234567890123456789012345678901234567890 # v1\n')).toEqual([
    'actions/example@1234567890123456789012345678901234567890'
  ])
})

test('isolates operational attestation permissions from candidate execution', async () => {
  const source = await readFile(resolve(process.cwd(), '.github/workflows/operations.yml'), 'utf8')
  const verify = source.slice(source.indexOf('  verify:'), source.indexOf('\n  attest:'))
  const attest = source.slice(source.indexOf('  attest:'))
  expect(verify).not.toMatch(/id-token:\s*write|attestations:\s*write/)
  expect(attest).toMatch(/if: github\.event_name == 'push'/)
  expect(attest).toContain('needs: verify')
  expect(attest).not.toMatch(/actions\/checkout|actions\/setup-node|\n\s+run:/)
  expect(attest).toContain('actions/download-artifact@')
})
