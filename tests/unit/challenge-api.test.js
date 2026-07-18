import { afterEach, describe, expect, it, vi } from 'vitest'
import { CHALLENGE_PINS } from '../../shared/challenge-contracts.js'
import { loadChallengeArtifact, loadChallengeRuns, loadChallengeStatus, prepareChallengeCommitment, syncChallenge } from '../../src/api.js'

const noStoreHeaders = {
  'cache-control': 'private, no-store',
  'content-type': 'application/json',
  pragma: 'no-cache'
}
const status = {
  state: 'ready',
  integrity: 'valid',
  releaseId: CHALLENGE_PINS.releaseId,
  disclosureEpoch: null,
  lastError: null
}

function jsonResponse(value, headers = noStoreHeaders) {
  return new Response(JSON.stringify(value), { status: 200, headers })
}

afterEach(() => vi.unstubAllGlobals())

describe('Goal 13 frontend API', () => {
  it('sends the exact challenge CSRF header and accepts only the strict no-store status contract', async () => {
    const fetch = vi.fn(async () => jsonResponse(status))
    vi.stubGlobal('fetch', fetch)

    await expect(syncChallenge()).resolves.toEqual(status)
    expect(fetch).toHaveBeenCalledWith('/api/v11/challenge/sync', expect.objectContaining({
      method: 'POST',
      body: '{}',
      headers: { 'content-type': 'application/json', 'x-challenge-csrf': 'goal13-challenge-v1' }
    }))
  })

  it('sends only a freeze intent while accepting the server-built frozen commitment', async () => {
    const digest = 'a'.repeat(64)
    const frozenCommitment = {
      commitment_schema_version: '1.0.0',
      release_id: CHALLENGE_PINS.releaseId,
      release_digest: CHALLENGE_PINS.releaseDigest,
      consumer_id: 'consumer:biochemical-inference:apap-model-v1',
      consumer_model_digest: digest,
      equation_set_digest: digest,
      parameter_policy_digest: digest,
      consumer_volume_l: '50',
      normalization_assumption: 'frozen consumer volume normalization',
      sampling_grid_digest: CHALLENGE_PINS.samplingGridDigest,
      solver_digest: digest,
      endpoint_mapping_id: 'mapping:oral-depot-325mg-volume-50l',
      endpoint_mapping_digest: digest,
      metric_id: 'metric:absolute-relative-error-v1',
      metric_digest: digest,
      threshold_id: 'threshold:absolute-relative-error-le-0.30',
      threshold_digest: digest,
      exclusion_digest: digest,
      not_evaluable_digest: digest,
      partition_id: CHALLENGE_PINS.partitionId,
      partition_digest: CHALLENGE_PINS.partitionDigest,
      prediction_artifact_digest: digest,
      predictions: [
        { endpoint_id: 'endpoint:apap-cmax:reference', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' },
        { endpoint_id: 'endpoint:apap-cmax:test', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' }
      ],
      nonce: 'goal13-browser-test-0001',
      created_at: '2026-07-14T00:00:00Z'
    }
    const reference = (kind) => ({ kind, digest, bytes: 100 })
    const response = {
      frozenCommitment,
      receipt: {
        commitment_contract: 'apap-human-pk-challenge-commitment-v1',
        commitment_digest: digest,
        created_at: frozenCommitment.created_at,
        committed_at: '2026-07-15T03:18:24Z',
        partition_digest: CHALLENGE_PINS.partitionDigest
      },
      artifacts: {
        model: reference('model'),
        equationSet: reference('equation-set'),
        parameterPolicy: reference('parameter-policy'),
        concentrationMapping: reference('concentration-mapping'),
        solver: reference('solver'),
        software: reference('software'),
        diagnostics: reference('diagnostics'),
        prediction: reference('prediction'),
        publicLineage: reference('public-lineage')
      }
    }
    const fetch = vi.fn(async () => jsonResponse(response))
    vi.stubGlobal('fetch', fetch)

    await expect(prepareChallengeCommitment({ nonce: frozenCommitment.nonce, createdAt: frozenCommitment.created_at })).resolves.toEqual(response)
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ nonce: frozenCommitment.nonce, createdAt: frozenCommitment.created_at })
  })

  it('rejects cacheable challenge responses even when their JSON body is valid', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(status, { 'cache-control': 'public, max-age=60', pragma: 'no-cache' })))

    await expect(loadChallengeStatus()).rejects.toMatchObject({
      name: 'ApiError',
      code: 'CHALLENGE_CACHE_POLICY_INVALID'
    })
  })

  it('authorizes protected GETs and binds returned artifacts to the requested digest', async () => {
    const digest = 'a'.repeat(64)
    const fetch = vi.fn(async (path) => path.includes('/runs')
      ? jsonResponse({ items: [], limit: 20 })
      : jsonResponse({ artifactDigest: 'b'.repeat(64), kind: 'model', bytes: 100, content: {} }))
    vi.stubGlobal('fetch', fetch)

    await expect(loadChallengeRuns()).resolves.toEqual({ items: [], limit: 20 })
    expect(fetch.mock.calls[0][1]).toMatchObject({ headers: { 'x-challenge-csrf': 'goal13-challenge-v1' } })
    await expect(loadChallengeArtifact(digest)).rejects.toMatchObject({
      name: 'ApiError',
      code: 'CHALLENGE_IDENTITY_MISMATCH'
    })
    expect(fetch.mock.calls[1][1]).toMatchObject({ headers: { 'x-challenge-csrf': 'goal13-challenge-v1' } })
  })
})
