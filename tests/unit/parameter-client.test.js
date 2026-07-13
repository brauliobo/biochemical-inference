import { afterEach, describe, expect, it, vi } from 'vitest'
import { createParameterClient, ParameterCompatibilityError } from '../../server/parameters/client.js'
import { createParameterFixtureClient } from '../../server/parameters/fixture.js'
import {
  PARAMETER_RELEASE_ID,
  UpstreamParameterCandidatesResponseSchema,
  UpstreamParameterContextsResponseSchema,
  UpstreamParameterDatasetsResponseSchema
} from '../../shared/parameter-contracts.js'

afterEach(() => vi.unstubAllGlobals())

describe('parameter evidence service boundary', () => {
  it('rejects undocumented fields in candidate, dataset, context, and envelope records', async () => {
    const fixture = createParameterFixtureClient()
    const candidates = await fixture.candidates()
    const datasets = await fixture.datasets()
    const contexts = await fixture.contexts()

    expect(UpstreamParameterCandidatesResponseSchema.safeParse({ ...candidates, undocumented: true }).success).toBe(false)
    expect(UpstreamParameterCandidatesResponseSchema.safeParse({ ...candidates, items: [{ ...candidates.items[0], undocumented: true }, ...candidates.items.slice(1)] }).success).toBe(false)
    expect(UpstreamParameterDatasetsResponseSchema.safeParse({ ...datasets, observations: [{ ...datasets.observations[0], undocumented: true }, ...datasets.observations.slice(1)] }).success).toBe(false)
    expect(UpstreamParameterContextsResponseSchema.safeParse({ ...contexts, items: [{ ...contexts.items[0], undocumented: true }, ...contexts.items.slice(1)] }).success).toBe(false)
  })

  it('fails closed before candidate access when the catalog digest differs', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      catalog_schema_version: '1.0.0',
      releases: [{ release_id: PARAMETER_RELEASE_ID, title: 'Mismatched', schema_version: '1.0.0', release_digest: '0'.repeat(64), manifest_path: `${PARAMETER_RELEASE_ID}/manifest.json` }]
    }), { status: 200, headers: { 'content-type': 'application/json' } })))

    await expect(createParameterClient().candidates()).rejects.toEqual(expect.objectContaining({ name: 'ParameterCompatibilityError', message: expect.stringMatching(/Digest mismatch/) }))
    expect(fetch).toHaveBeenCalledOnce()
    expect(ParameterCompatibilityError.prototype).toBeInstanceOf(Error)
  })
})
