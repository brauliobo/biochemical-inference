import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService } from '../../server/apap/service.js'
import { buildApapDerivedBundle } from '../../server/derived/bundle.js'

const api = vi.hoisted(() => ({
  appendDerivedReviewEvent: vi.fn(), loadDerivedAssertion: vi.fn(), loadDerivedAssertions: vi.fn(), loadDerivedEvents: vi.fn(), loadDerivedHealth: vi.fn(), queryDerivedLayers: vi.fn(), reproduceDerivedAssertion: vi.fn(), submitApapDerivedBundle: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import ReviewWorkbench from '../../src/components/ReviewWorkbench.vue'

let record
let item

function deferred() {
  let resolve
  const promise = new Promise((complete) => { resolve = complete })
  return { promise, resolve }
}

function queueButton(digest) {
  return screen.getAllByText(digest).map((element) => element.closest('button')).find(Boolean)
}

beforeAll(async () => {
  record = await createApapRunService(createApapFixtureClient()).create({})
  const wrapped = buildApapDerivedBundle(record).bundle.assertions[0]
  item = { digest: wrapped.digest, assertion: wrapped.assertion, state: { review_status: 'pending', reproduction_verified: false, recalculation_requested: false, superseded_by: null, event_count: 0 } }
}, 30_000)

beforeEach(() => {
  vi.clearAllMocks()
  api.loadDerivedHealth.mockResolvedValue({ status: 'ok', journal_mode: 'wal', bundles: 1, assertions: 1, content_objects: 3, events: 0 })
  api.loadDerivedAssertions.mockResolvedValue({ layer: 'derived-review-workspace', items: [item] })
  api.loadDerivedAssertion.mockResolvedValue(item)
  api.loadDerivedEvents.mockResolvedValue({ assertion_digest: item.digest, items: [] })
  api.queryDerivedLayers.mockResolvedValue({ layers: ['source', 'reviewed-derived'], source: [{ family: 'apap', release_id: record.result.release.id, release_digest: `sha256:${record.result.release.digest}`, collection: 'protocols', record_digest: `sha256:${'a'.repeat(64)}`, record: record.result.protocol }], 'reviewed-derived': [] })
  api.submitApapDerivedBundle.mockResolvedValue({ created: true, bundle_digest: `sha256:${'b'.repeat(64)}`, assertion_digests: [item.digest] })
  api.appendDerivedReviewEvent.mockResolvedValue({ event: {}, state: { ...item.state, review_status: 'accepted', event_count: 1 } })
})

describe('ReviewWorkbench', () => {
  it('links a completed run and exposes claim, lineage, context, limitations, layers, and valid pending actions', async () => {
    render(ReviewWorkbench, { props: { apapRun: record } })

    expect(await screen.findByRole('heading', { name: 'Review workbench' })).toBeTruthy()
    expect(await screen.findByText('Claim')).toBeTruthy()
    expect(screen.getByText('Lineage')).toBeTruthy()
    expect(screen.getByText('Full scientific context')).toBeTruthy()
    expect(screen.getByText('Qualitative uncertainty')).toBeTruthy()
    expect(screen.getByText('Unsupported limitations')).toBeTruthy()
    expect(screen.getByText('Source vs reviewed-derived')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Accept' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reject' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Invalidate' })).toBeNull()
  })

  it('submits the linked run and appends a validated acceptance event', async () => {
    render(ReviewWorkbench, { props: { apapRun: record } })
    await screen.findByText('Claim')

    await fireEvent.click(screen.getByRole('button', { name: 'Submit immutable bundle' }))
    await waitFor(() => expect(api.submitApapDerivedBundle).toHaveBeenCalledWith(record.runId))
    await fireEvent.click(screen.getByRole('button', { name: 'Accept' }))
    await waitFor(() => expect(api.appendDerivedReviewEvent).toHaveBeenCalledWith(item.digest, expect.objectContaining({ action: 'accepted', reproduction_artifact_digest: null })))
  })

  it('aborts and ignores stale rapid-selection detail responses', async () => {
    const second = { ...item, digest: `sha256:${'c'.repeat(64)}`, assertion: { ...item.assertion, statement: 'Second rapidly selected claim.' } }
    const delayed = deferred()
    api.loadDerivedAssertions.mockResolvedValue({ layer: 'derived-review-workspace', items: [item, second] })
    render(ReviewWorkbench, { props: { apapRun: record } })
    await screen.findByText('Claim')
    api.loadDerivedAssertion.mockImplementation((digest) => digest === second.digest ? delayed.promise : Promise.resolve(item))

    await fireEvent.click(queueButton(second.digest))
    const staleSignal = api.loadDerivedAssertion.mock.calls.at(-1)[1]
    await fireEvent.click(queueButton(item.digest))
    await screen.findByText(item.assertion.statement)
    delayed.resolve(second)

    await waitFor(() => expect(staleSignal.aborted).toBe(true))
    expect(screen.getByText(item.assertion.statement)).toBeTruthy()
    expect(screen.queryByText(second.assertion.statement)).toBeNull()
  })

  it('binds a review mutation to the digest rendered in the detail panel', async () => {
    const second = { ...item, digest: `sha256:${'d'.repeat(64)}`, assertion: { ...item.assertion, statement: 'Displayed second claim.' } }
    api.loadDerivedAssertions.mockResolvedValue({ layer: 'derived-review-workspace', items: [item, second] })
    api.loadDerivedAssertion.mockImplementation((digest) => Promise.resolve(digest === second.digest ? second : item))
    render(ReviewWorkbench, { props: { apapRun: record } })
    await screen.findByText('Claim')
    await fireEvent.click(queueButton(second.digest))
    await screen.findByText(second.assertion.statement)
    await fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    await waitFor(() => expect(api.appendDerivedReviewEvent).toHaveBeenCalledWith(second.digest, expect.objectContaining({ action: 'accepted' })))
  })
})
