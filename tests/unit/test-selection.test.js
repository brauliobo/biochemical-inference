import { expect, test } from 'vitest'
import { checkTestSelection } from '../../scripts/test-selection.js'

test('closes every test and workflow action into the documented gate selection', async () => {
  await expect(checkTestSelection()).resolves.toMatchObject({
    status: 'closed',
    node_acceptance: 6,
    exclusions: 0,
    workflow_actions: 4
  })
})
