import { spawn } from 'node:child_process'

const MAX_OUTPUT_BYTES = 1024 * 1024
const PROCESS_GROUP_EMPTY_TIMEOUT_MS = 5_000
const PROCESS_GROUP_POLL_MS = 10

function outputError(message, stdout, stderr) {
  return new Error(`${message}\n--- stdout ---\n${stdout || '(empty)'}\n--- stderr ---\n${stderr || '(empty)'}`)
}

export function runBoundedProcess(command, arguments_, options = {}) {
  const timeoutMs = options.timeoutMs
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new TypeError('Bounded subprocess timeout must be a positive integer.')
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, arguments_, {
      cwd: options.cwd,
      detached: true,
      env: options.env,
      stdio: ['ignore', 'pipe', 'pipe']
    })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let outputExceeded = false
    let ready = options.killOnStdout === undefined
    let settled = false
    let stopping = false
    let escalation

    const signalGroup = (signal) => {
      if (!child.pid) return false
      try { process.kill(-child.pid, signal); return true } catch (error) { if (error?.code !== 'ESRCH') throw error; return false }
    }
    const groupExists = () => {
      if (!child.pid) return false
      try { process.kill(-child.pid, 0); return true } catch (error) { if (error?.code !== 'ESRCH') throw error; return false }
    }
    const proveGroupEmpty = async () => {
      const deadline = Date.now() + (options.processGroupEmptyTimeoutMs ?? PROCESS_GROUP_EMPTY_TIMEOUT_MS) + (stopping ? (options.killGraceMs ?? 1_000) : 0)
      while (groupExists()) {
        if (Date.now() >= deadline) throw outputError(`Subprocess group ${child.pid} remained alive after SIGKILL.`, stdout, stderr)
        await new Promise((resolvePromise) => setTimeout(resolvePromise, PROCESS_GROUP_POLL_MS))
      }
    }
    const stop = (signal) => {
      stopping = true
      signalGroup(signal)
      if (signal !== 'SIGKILL') escalation ??= setTimeout(() => signalGroup('SIGKILL'), options.killGraceMs ?? 1_000)
    }
    const append = (current, chunk) => {
      const next = `${current}${chunk}`
      if (Buffer.byteLength(next) <= (options.maximumOutputBytes ?? MAX_OUTPUT_BYTES)) return next
      outputExceeded = true
      stop('SIGKILL')
      return next.slice(-(options.maximumOutputBytes ?? MAX_OUTPUT_BYTES))
    }
    const timeout = setTimeout(() => {
      timedOut = true
      stop('SIGTERM')
    }, timeoutMs)
    const finish = async (action) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      try {
        if (!stopping) signalGroup('SIGKILL')
        await proveGroupEmpty()
        action()
      } catch (error) {
        reject(error)
      } finally {
        clearTimeout(escalation)
      }
    }

    child.stdout.on('data', (chunk) => {
      stdout = append(stdout, chunk.toString())
      if (!ready && stdout.includes(options.killOnStdout)) {
        ready = true
        stop(options.readySignal ?? 'SIGKILL')
      }
    })
    child.stderr.on('data', (chunk) => { stderr = append(stderr, chunk.toString()) })
    child.once('error', (error) => finish(() => reject(outputError(`Subprocess failed to start: ${error.message}`, stdout, stderr))))
    child.once('close', (code, signal) => finish(() => {
      if (timedOut) reject(outputError(`Subprocess timed out after ${timeoutMs} ms (pid ${child.pid}).`, stdout, stderr))
      else if (outputExceeded) reject(outputError(`Subprocess exceeded its output limit (pid ${child.pid}).`, stdout, stderr))
      else if (!ready) reject(outputError(`Subprocess exited before reporting ${JSON.stringify(options.killOnStdout)} (${code ?? signal}).`, stdout, stderr))
      else if (options.expectedSignal && signal !== options.expectedSignal) reject(outputError(`Subprocess exited with ${code ?? signal}; expected ${options.expectedSignal}.`, stdout, stderr))
      else if (options.expectedCode !== undefined && code !== options.expectedCode) reject(outputError(`Subprocess exited with ${code ?? signal}; expected ${options.expectedCode}.`, stdout, stderr))
      else if (!options.expectedSignal && options.expectedCode === undefined && code !== 0) reject(outputError(`Subprocess exited with ${code ?? signal}.`, stdout, stderr))
      else resolvePromise({ code, signal, stderr, stdout, processGroupEmpty: true })
    }))
  })
}
