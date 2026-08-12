import { expect, test } from 'vitest'
import { buildSbom } from '../../scripts/supply-chain.js'

test('SBOM declares the application and available dependency licenses', async () => {
  const sbom = await buildSbom()
  expect(sbom.metadata.component.licenses).toEqual([{ license: { id: 'MIT' } }])
  expect(sbom.metadata.tools.components[0].licenses).toEqual([{ license: { id: 'MIT' } }])
  expect(sbom.components.some((component) => component.licenses?.length)).toBe(true)
  expect(sbom.components.every((component) => component['bom-ref'] === component.purl)).toBe(true)
})
