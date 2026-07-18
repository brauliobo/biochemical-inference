import { expect, test } from 'vitest'
import { runBoundedProcess } from '../fixtures/bounded-process.js'

test('escalates after the leader exits and proves a SIGTERM-resistant grandchild is gone', async () => {
  const resistant = `
    process.on('SIGTERM', () => {})
    process.stdout.write('ready')
    setInterval(() => {}, 1000)
  `
  const script = `
    const { spawn } = require('node:child_process')
    const child = spawn(process.execPath, ['-e', ${JSON.stringify(resistant)}], { stdio: ['ignore', 'pipe', 'ignore'] })
    child.stdout.once('data', () => process.stdout.write('ready:' + child.pid))
    setInterval(() => {}, 1000)
  `
  const result = await runBoundedProcess(process.execPath, ['-e', script], {
    timeoutMs: 2_000,
    killOnStdout: 'ready:',
    readySignal: 'SIGTERM',
    expectedSignal: 'SIGTERM',
    killGraceMs: 50
  })
  const descendantPid = Number(result.stdout.slice('ready:'.length))
  expect(result.processGroupEmpty).toBe(true)
  expect(descendantPid).toBeGreaterThan(0)
  expect(() => process.kill(descendantPid, 0)).toThrow(expect.objectContaining({ code: 'ESRCH' }))
}, 5_000)
