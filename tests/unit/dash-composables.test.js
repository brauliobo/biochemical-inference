import { effectScope, nextTick, reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnsemble } from '../../src/composables/useEnsemble.js'
import { useModelRun } from '../../src/composables/useModelRun.js'

// useModelRun: debounced, last-run-wins, cancelled on unmount. useEnsemble: one worker per job, terminated when the job
// changes, progress and bands relayed. Fake timers and a fake worker: no simulator runs here.
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

const settle = async (ms = 0) => { await vi.advanceTimersByTimeAsync(ms) }
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }

describe('useModelRun', () => {
  it('runs once at start and returns the result, a plain snapshot of the controls and no warning', async () => {
    const run = vi.fn((controls) => ({ answer: controls.x * 2, warnings: [] }))
    const controls = reactive({ x: 2 })
    const scope = effectScope()
    const model = scope.run(() => useModelRun(() => run, controls, { debounceMs: 50 }))
    expect(model.running.value).toBe(true)
    await settle(5)
    expect(model.result.value.answer).toBe(4)
    expect(model.running.value).toBe(false)
    expect(model.error.value).toBeNull()
    expect(run).toHaveBeenCalledTimes(1)
    expect(run.mock.calls[0][0]).toEqual({ x: 2 })
    expect(run.mock.calls[0][0]).not.toBe(controls)
    scope.stop()
  })

  it('debounces a burst of changes into one run with the last value', async () => {
    const run = vi.fn((controls) => ({ answer: controls.x }))
    const controls = reactive({ x: 1 })
    const scope = effectScope()
    const model = scope.run(() => useModelRun(() => run, controls, { debounceMs: 100 }))
    await settle(5)
    run.mockClear()
    controls.x = 2
    await nextTick()
    await settle(40)
    controls.x = 3
    await nextTick()
    await settle(40)
    controls.x = 4
    await nextTick()
    await settle(99)
    expect(run).not.toHaveBeenCalled()
    expect(model.running.value).toBe(true)
    await settle(10)
    expect(run).toHaveBeenCalledTimes(1)
    expect(run.mock.calls[0][0]).toEqual({ x: 4 })
    expect(model.result.value.answer).toBe(4)
    scope.stop()
  })

  it('drops the result of a run that a newer change has made stale', async () => {
    const slow = deferred()
    const run = vi.fn((controls, { isStale }) => (controls.x === 1 ? slow.promise.then(() => ({ answer: 'old', stale: isStale() })) : { answer: 'new' }))
    const controls = reactive({ x: 1 })
    const scope = effectScope()
    const model = scope.run(() => useModelRun(() => run, controls, { debounceMs: 10 }))
    await settle(5)
    expect(run).toHaveBeenCalledTimes(1)
    controls.x = 2
    await nextTick()
    await settle(30)
    expect(model.result.value.answer).toBe('new')
    slow.resolve()
    await settle(5)
    expect(model.result.value.answer).toBe('new') // the old run finished later but is ignored
    expect(model.running.value).toBe(false)
    scope.stop()
  })

  it('keeps the previous result and reports the error when a run throws, then recovers', async () => {
    const run = vi.fn((controls) => { if (controls.x === 2) throw new Error('boom'); return { answer: controls.x } })
    const controls = reactive({ x: 1 })
    const scope = effectScope()
    const model = scope.run(() => useModelRun(() => run, controls, { debounceMs: 10 }))
    await settle(5)
    controls.x = 2
    await nextTick()
    await settle(30)
    expect(model.error.value.message).toBe('boom')
    expect(model.result.value.answer).toBe(1)
    controls.x = 3
    await nextTick()
    await settle(30)
    expect(model.error.value).toBeNull()
    expect(model.result.value.answer).toBe(3)
    scope.stop()
  })

  it('surfaces warnings, loads the runner once and ignores everything after the scope stops', async () => {
    const run = vi.fn(() => ({ warnings: ['stiff step'] }))
    const getRunner = vi.fn(async () => run)
    const controls = ref({ x: 1 })
    const scope = effectScope()
    const model = scope.run(() => useModelRun(getRunner, controls, { debounceMs: 10 }))
    await settle(5)
    expect(model.warnings.value).toEqual(['stiff step'])
    controls.value = { x: 2 }
    await nextTick()
    await settle(30)
    expect(getRunner).toHaveBeenCalledTimes(1)
    expect(run).toHaveBeenCalledTimes(2)
    controls.value = { x: 3 }
    await nextTick()
    scope.stop()
    await settle(100)
    expect(run).toHaveBeenCalledTimes(2)
    expect(model.running.value).toBe(false)
  })
})

class FakeWorker {
  static instances = []
  constructor() { this.terminated = false; this.posted = []; FakeWorker.instances.push(this) }
  postMessage(message) { this.posted.push(message) }
  terminate() { this.terminated = true }
  emit(data) { this.onmessage?.({ data }) }
}

describe('useEnsemble', () => {
  beforeEach(() => { FakeWorker.instances = [] })

  it('starts one worker per job, relays progress and keeps the bands', async () => {
    const job = reactive({ n: 100, seed: 7 })
    const enabled = ref(true)
    const scope = effectScope()
    const ensemble = scope.run(() => useEnsemble(() => ({ ...job }), enabled, { createWorker: () => new FakeWorker(), debounceMs: 50 }))
    expect(ensemble.running.value).toBe(true)
    expect(FakeWorker.instances).toHaveLength(0)
    await settle(60)
    expect(FakeWorker.instances).toHaveLength(1)
    expect(FakeWorker.instances[0].posted[0]).toEqual({ type: 'run', job: { n: 100, seed: 7 } })
    FakeWorker.instances[0].emit({ type: 'progress', done: 25, n: 100 })
    expect(ensemble.progress.value).toBe(0.25)
    FakeWorker.instances[0].emit({ type: 'done', result: { ok: 100, bands: { x: { p5: [1], p50: [1], p95: [1] } } } })
    expect(ensemble.bands.value.ok).toBe(100)
    expect(ensemble.running.value).toBe(false)
    expect(FakeWorker.instances[0].terminated).toBe(true)
    scope.stop()
  })

  it('terminates a running worker when the job changes and clears the bands of the old job', async () => {
    const job = reactive({ n: 100, seed: 1 })
    const scope = effectScope()
    const ensemble = scope.run(() => useEnsemble(() => ({ ...job }), ref(true), { createWorker: () => new FakeWorker(), debounceMs: 20 }))
    await settle(30)
    FakeWorker.instances[0].emit({ type: 'done', result: { ok: 1, bands: {} } })
    expect(ensemble.bands.value).not.toBeNull()
    job.seed = 2
    await nextTick()
    expect(ensemble.bands.value).toBeNull()
    await settle(30)
    expect(FakeWorker.instances).toHaveLength(2)
    job.seed = 3
    await nextTick()
    await settle(5)
    expect(FakeWorker.instances[1].terminated).toBe(true) // the second worker was still running
    await settle(30)
    expect(FakeWorker.instances).toHaveLength(3)
    scope.stop()
    expect(FakeWorker.instances[2].terminated).toBe(true)
  })

  it('does nothing while disabled, and cancels when switched off', async () => {
    const enabled = ref(false)
    const scope = effectScope()
    const ensemble = scope.run(() => useEnsemble(() => ({ n: 5 }), enabled, { createWorker: () => new FakeWorker(), debounceMs: 20 }))
    await settle(50)
    expect(FakeWorker.instances).toHaveLength(0)
    expect(ensemble.running.value).toBe(false)
    enabled.value = true
    await nextTick()
    await settle(30)
    expect(FakeWorker.instances).toHaveLength(1)
    enabled.value = false
    await nextTick()
    expect(FakeWorker.instances[0].terminated).toBe(true)
    expect(ensemble.running.value).toBe(false)
    scope.stop()
  })

  it('reports a worker error', async () => {
    const scope = effectScope()
    const ensemble = scope.run(() => useEnsemble(() => ({ n: 5 }), ref(true), { createWorker: () => new FakeWorker(), debounceMs: 10 }))
    await settle(20)
    FakeWorker.instances[0].emit({ type: 'error', message: 'model failed' })
    expect(ensemble.error.value.message).toBe('model failed')
    expect(ensemble.running.value).toBe(false)
    scope.stop()
  })
})
