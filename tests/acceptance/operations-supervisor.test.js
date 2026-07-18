import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { EventEmitter } from 'node:events'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { childProcess, stopChild, supervise } from '../../scripts/operations.js'

let temporary
afterEach(async () => { if (temporary) await rm(temporary, { recursive: true, force: true }); temporary = undefined })

async function waitForPid(path) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try { return Number(await readFile(path, 'utf8')) } catch (error) { if (error?.code !== 'ENOENT') throw error }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 20))
  }
  throw new Error('child PID fixture timed out')
}

function exists(pid) {
  try { process.kill(pid, 0); return true } catch (error) { if (error?.code === 'ESRCH') return false; throw error }
}

describe('actual process-group supervisor acceptance', () => {
  for (const signal of ['SIGINT', 'SIGTERM']) it(`integrates ${signal} with ordered child-group cleanup`, async () => {
    const processTarget = new EventEmitter()
    const database = childProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env: process.env })
    const inference = childProcess(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env: process.env })
    const stop = async () => { await stopChild(inference); await stopChild(database) }
    const running = supervise('unused', null, { processTarget, start: async () => ({ database, inference, stop }) })
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 25))
    expect(processTarget.listenerCount(signal)).toBe(1)
    processTarget.emit(signal)
    await expect(running).resolves.toEqual({ status: 'stopped', signal })
    expect(exists(database.pid)).toBe(false)
    expect(exists(inference.pid)).toBe(false)
    expect(processTarget.listenerCount('SIGINT')).toBe(0)
    expect(processTarget.listenerCount('SIGTERM')).toBe(0)
  }, 10_000)

  it('forwards shutdown to the whole group without leaving an orphan', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'biochemical-supervisor-'))
    const pidPath = resolve(temporary, 'descendant.pid')
    const source = `const{spawn}=require('child_process'),fs=require('fs');const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(pidPath)},String(child.pid));process.on('SIGTERM',()=>setTimeout(()=>process.exit(0),25));setInterval(()=>{},1000)`
    const supervisor = childProcess(process.execPath, ['-e', source], { env: process.env })
    const descendantPid = await waitForPid(pidPath)
    await expect(stopChild(supervisor, 2_000)).resolves.toBeUndefined()
    expect(exists(supervisor.pid)).toBe(false)
    expect(exists(descendantPid)).toBe(false)
  }, 10_000)

  it('escalates a process group that ignores SIGTERM and still reaps every member', async () => {
    temporary = await mkdtemp(resolve(tmpdir(), 'biochemical-supervisor-escalation-'))
    const pidPath = resolve(temporary, 'descendant.pid')
    const ignored = `process.on('SIGTERM',()=>{});setInterval(()=>{},1000)`
    const source = `const{spawn}=require('child_process'),fs=require('fs');process.on('SIGTERM',()=>{});const child=spawn(process.execPath,['-e',${JSON.stringify(ignored)}],{stdio:'ignore'});fs.writeFileSync(${JSON.stringify(pidPath)},String(child.pid));setInterval(()=>{},1000)`
    const supervisor = childProcess(process.execPath, ['-e', source], { env: process.env })
    const descendantPid = await waitForPid(pidPath)
    await expect(stopChild(supervisor, 100)).rejects.toThrow('did not stop gracefully')
    expect(exists(supervisor.pid)).toBe(false)
    expect(exists(descendantPid)).toBe(false)
  }, 10_000)
})
