import { spawn } from 'node:child_process'

// Parses `--name value` pairs into an object.
export function flags(values) {
  const output = {}
  for (let index = 0; index < values.length; index += 2) {
    if (!values[index]?.startsWith('--') || values[index + 1] === undefined) throw new Error('arguments must use --name value pairs')
    output[values[index].slice(2)] = values[index + 1]
  }
  return output
}

// Runs `git -C repository ...` and resolves with trimmed stdout.
export function git(repository, ...arguments_) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn('git', ['-C', repository, ...arguments_], { stdio: ['ignore', 'pipe', 'pipe'] })
    const stdout = []
    const stderr = []
    child.stdout.on('data', (value) => stdout.push(value))
    child.stderr.on('data', (value) => stderr.push(value))
    child.once('error', reject)
    child.once('exit', (code) => code === 0 ? resolvePromise(Buffer.concat(stdout).toString('utf8').trim()) : reject(new Error(Buffer.concat(stderr).toString('utf8').trim() || `git exited with ${code}`)))
  })
}
