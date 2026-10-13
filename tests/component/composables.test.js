import { describe, expect, it, vi } from 'vitest'
import { useMirror } from '../../src/composables/useMirror.js'
import { usePolling } from '../../src/composables/usePolling.js'
import { errorMessage, isAbort, useTask } from '../../src/composables/useTask.js'
import { useWorkflow } from '../../src/composables/useWorkflow.js'
import Setup from '../fixtures/vapor/Setup.vue'
import { mountVapor } from '../helpers/mount-vapor.js'

// Run a composable in a real component and hand back its result and the mount.
function inComponent(use) {
  const found = {}
  const mounted = mountVapor(Setup, { props: { setup: () => () => { found.value = use() } } })
  return { value: found.value, ...mounted }
}

const later = (value, delay = 0) => new Promise((resolve) => setTimeout(() => resolve(value), delay))
const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((done, failed) => { resolve = done; reject = failed })
  return { promise, resolve, reject }
}

describe('useTask', () => {
  it('commits a result and ignores a superseded run', async () => {
    const { value: task } = inComponent(useTask)
    const slow = deferred()
    const done = vi.fn()

    const first = task.run(async ({ fresh }) => fresh(await slow.promise), { done })
    const second = task.run(async ({ fresh }) => fresh(await later('new')), { done })
    slow.resolve('old')
    await Promise.all([first, second])

    expect(done).toHaveBeenCalledOnce()
    expect(done).toHaveBeenCalledWith('new')
  })

  it('aborts the request signal of a superseded run and on unmount', async () => {
    const { value: task, unmount } = inComponent(useTask)
    const signals = []
    const stuck = (context) => { signals.push(context.signal); return new Promise(() => {}) }

    task.run(stuck)
    task.run(stuck)
    expect(signals.map((signal) => signal.aborted)).toEqual([true, false])
    unmount()
    expect(signals[1].aborted).toBe(true)
  })

  it('reports failures to fail, swallows aborts, and rethrows when nobody handles them', async () => {
    const { value: task } = inComponent(useTask)
    const fail = vi.fn()

    await task.run(async () => { throw new Error('nope') }, { fail })
    expect(fail).toHaveBeenCalledWith(expect.objectContaining({ message: 'nope' }))
    fail.mockClear()
    await task.run(async () => { throw new DOMException('stopped', 'AbortError') }, { fail })
    expect(fail).not.toHaveBeenCalled()
    await expect(task.run(async () => { throw new Error('unhandled') })).rejects.toThrow('unhandled')
  })

  it('names abort errors and error messages', () => {
    expect(isAbort(new DOMException('x', 'AbortError'))).toBe(true)
    expect(isAbort(new Error('x'))).toBe(false)
    expect(errorMessage(new Error('boom'), 'fallback')).toBe('boom')
    expect(errorMessage('text', 'fallback')).toBe('fallback')
  })
})

describe('useWorkflow', () => {
  it('moves through a step and announces its result', async () => {
    const { value: flow } = inComponent(() => useWorkflow())
    expect(flow.state.value).toBe('loading')
    expect(flow.busy.value).toBe(true)

    const running = flow.step('syncing', async () => later('result'), { announce: (result) => `got ${result}` })
    expect(flow.state.value).toBe('syncing')
    await running

    expect(flow.state.value).toBe('idle')
    expect(flow.busy.value).toBe(false)
    expect(flow.announcement.value).toBe('got result')
  })

  it('fails with the error message or the fallback, and a later step recovers', async () => {
    const { value: flow } = inComponent(() => useWorkflow())

    await flow.step('syncing', async () => { throw new Error('mirror unreadable') }, { failure: 'fallback' })
    expect(flow.state.value).toBe('failed')
    expect(flow.message.value).toBe('mirror unreadable')
    await flow.step('syncing', async () => { throw 'opaque' }, { failure: 'fallback' })
    expect(flow.message.value).toBe('fallback')
    await flow.step('syncing', async () => 1)
    expect(flow.state.value).toBe('idle')
    expect(flow.message.value).toBe('')
  })

  it('lets done choose the settled state', async () => {
    const { value: flow } = inComponent(() => useWorkflow({ settled: ['ready', 'failed'] }))

    await flow.step('running', async () => 1, { done: () => 'ready' })

    expect(flow.state.value).toBe('ready')
    expect(flow.busy.value).toBe(false)
  })
})

describe('usePolling', () => {
  it('repeats while the tick resolves true and stops on false', async () => {
    let calls = 0
    const { value: poll } = inComponent(() => usePolling(async () => { calls += 1; return calls < 3 }, { interval: 5 }))

    poll.start()
    await later(undefined, 80)

    expect(calls).toBe(3)
  })

  it('stops on unmount, and an error ends polling unless onError asks to go on', async () => {
    let calls = 0
    const { value: poll, unmount } = inComponent(() => usePolling(async () => { calls += 1; return true }, { interval: 5 }))
    poll.start()
    await later(undefined, 30)
    unmount()
    const seen = calls
    await later(undefined, 30)
    expect(calls).toBe(seen)

    let failing = 0
    const { value: broken } = inComponent(() => usePolling(async () => { failing += 1; throw new Error('x') }, { interval: 5 }))
    broken.start()
    await later(undefined, 50)
    expect(failing).toBe(1)

    let resilient = 0
    const { value: retry, unmount: stop } = inComponent(() => usePolling(async () => { resilient += 1; throw new Error('x') }, { interval: 5, onError: () => true }))
    retry.start()
    await later(undefined, 50)
    stop()
    expect(resilient).toBeGreaterThan(2)
  })
})

describe('useMirror', () => {
  const api = () => ({
    discovery: vi.fn(async () => ({ pins: {} })),
    status: vi.fn(async () => ({ state: 'ready', integrity: 'valid' })),
    sync: vi.fn(async () => ({ state: 'ready', integrity: 'valid' })),
    integrity: vi.fn(async () => ({ status: 'valid' })),
    complete: vi.fn(async () => ({ verifiedChunks: 4 }))
  })
  const text = { load: 'load', sync: 'sync', synced: 'synced', integrity: 'integrity', integrityDone: (checked) => `integrity ${checked.status}`, complete: 'complete', completed: 'completed' }

  it('loads the local records only when the mirror is ready', async () => {
    const loadLocal = vi.fn(async () => {})
    const empty = api()
    empty.status.mockResolvedValue({ state: 'empty', integrity: 'empty' })
    const { value: mirror } = inComponent(() => useMirror({ api: empty, loadLocal, text }))

    await mirror.initialize()
    expect(mirror.ready.value).toBe(false)
    expect(loadLocal).not.toHaveBeenCalled()

    const ready = inComponent(() => useMirror({ api: api(), loadLocal, text })).value
    await ready.initialize()
    expect(ready.ready.value).toBe(true)
    expect(loadLocal).toHaveBeenCalledOnce()
    expect(ready.flow.state.value).toBe('idle')
  })

  it('synchronizes, verifies integrity and completes with announcements', async () => {
    const { value: mirror } = inComponent(() => useMirror({ api: api(), text }))

    await mirror.synchronize()
    expect(mirror.flow.announcement.value).toBe('synced')
    await mirror.checkIntegrity()
    expect(mirror.flow.announcement.value).toBe('integrity valid')
    await mirror.completeOffline()
    expect(mirror.completion.value).toEqual({ verifiedChunks: 4 })
    expect(mirror.flow.state.value).toBe('idle')
  })

  it('fails the workflow with the findings of a failed integrity check', async () => {
    const failing = api()
    failing.integrity.mockResolvedValue({ status: 'failed', findings: ['object missing', 'digest differs'] })
    const { value: mirror } = inComponent(() => useMirror({ api: failing, text }))

    await mirror.checkIntegrity()

    expect(mirror.flow.state.value).toBe('failed')
    expect(mirror.flow.message.value).toBe('object missing digest differs')
  })
})
