import { constants } from 'node:fs'
import { access, realpath } from 'node:fs/promises'
import { isAbsolute } from 'node:path'
import { spawnSync } from 'node:child_process'

export async function checkBubblewrapSandbox(env = process.env) {
  const configured = env.BIOCHEMICAL_PHYSIOLOGY_BWRAP_PATH
  if (env.BIOCHEMICAL_PHYSIOLOGY_ENABLE_PROCESS_PLUGINS !== 'true') return { available: false, reason: 'Process plugins are disabled by default.' }
  if (!configured || !isAbsolute(configured)) return { available: false, reason: 'BIOCHEMICAL_PHYSIOLOGY_BWRAP_PATH must be an absolute configured path.' }
  let binary
  try {
    binary = await realpath(configured)
    await access(binary, constants.X_OK)
    await access('/usr/bin/node', constants.X_OK)
  } catch {
    return { available: false, reason: 'Configured Bubblewrap or the pinned /usr/bin/node runtime is unavailable.' }
  }
  const version = spawnSync(binary, ['--version'], { encoding: 'utf8', timeout: 3000, env: { PATH: '/usr/bin:/bin' } })
  if (version.status !== 0 || !/^bubblewrap [0-9]/.test(version.stdout.trim())) return { available: false, reason: 'Configured binary did not identify as Bubblewrap.' }
  const help = spawnSync(binary, ['--help'], { encoding: 'utf8', timeout: 3000, env: { PATH: '/usr/bin:/bin' } })
  if (help.status !== 0 || !help.stdout.includes('--disable-userns') || !help.stdout.includes('--size BYTES')) return { available: false, reason: 'Bubblewrap lacks required nested-userns and tmpfs-size controls.' }
  const probe = spawnSync(binary, ['--unshare-all', '--die-with-parent', '--new-session', '--ro-bind', '/', '/', '--proc', '/proc', '--dev', '/dev', '--size', '1048576', '--tmpfs', '/tmp', '--disable-userns', '/usr/bin/node', '--experimental-permission', '-e', ''], { encoding: 'utf8', timeout: 3000, env: { PATH: '/usr/bin:/bin' } })
  if (probe.status !== 0) return { available: false, reason: 'Bubblewrap failed the user/mount/network namespace capability probe.' }
  return { available: true, binary, reason: 'Bubblewrap passed executable and namespace capability probes.' }
}

export function runBubblewrapPlugin(sandbox, scriptPath, input, limits) {
  if (!sandbox.available) throw new Error('Process plugin execution refused because Bubblewrap capability checks did not pass.')
  const result = spawnSync(sandbox.binary, [
    '--unshare-all', '--die-with-parent', '--new-session',
    '--ro-bind', '/usr', '/usr', '--ro-bind', '/bin', '/bin',
    '--proc', '/proc', '--dev', '/dev', '--size', String(limits.maxOutputBytes), '--tmpfs', '/tmp', '--disable-userns',
    '--ro-bind', scriptPath, '/plugin.mjs',
    '/usr/bin/node', '--experimental-permission', '--allow-fs-read=/plugin.mjs', `--max-old-space-size=${limits.memoryMb}`, `--v8-pool-size=${limits.cpuCores}`, '--disable-proto=throw', '/plugin.mjs'
  ], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    timeout: limits.wallTimeMs,
    maxBuffer: limits.maxOutputBytes,
    env: { PATH: '/usr/bin:/bin', HOME: '/tmp', NODE_NO_WARNINGS: '1' }
  })
  if (result.error || result.status !== 0) throw new Error('Sandboxed process plugin failed without producing an accepted protocol response.')
  return JSON.parse(result.stdout)
}
