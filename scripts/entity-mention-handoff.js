#!/usr/bin/env node
import { resolve } from 'node:path'
import { canonicalJson } from '../shared/canonical-json.js'
import { createImportedMthfrSimulationSpecification, simulateImportedMthfr } from '../server/entity-mention-handoff/simulation-specification.js'
import { importEntityMentionHandoff, reopenEntityMentionHandoff } from '../server/entity-mention-handoff/store.js'

function argumentsFor(values) {
  const options = {}
  for (let index = 0; index < values.length; index += 2) {
    const name = values[index]
    const value = values[index + 1]
    if (!/^--(?:release|handoff|signature|store|import-id|preset|mthfr-activity|duration-hours|step-hours)$/.test(name ?? '') || !value || value.startsWith('--') || options[name]) throw new Error(`Invalid or duplicate argument: ${name ?? '<missing>'}.`)
    options[name] = value
  }
  return options
}

async function main() {
  const [command, ...values] = process.argv.slice(2)
  const options = argumentsFor(values)
  const hasNumericalIntent = ['--preset', '--mthfr-activity', '--duration-hours', '--step-hours'].some((name) => options[name] !== undefined)
  if (command === 'import') {
    if (!options['--release'] || !options['--handoff'] || !options['--store'] || options['--import-id'] || hasNumericalIntent) throw new Error('usage: entity-mention-handoff.js import --release DIR --handoff FILE --store DIR [--signature FILE]')
    return importEntityMentionHandoff({ releaseRoot: resolve(options['--release']), handoffPath: resolve(options['--handoff']), signaturePath: options['--signature'] ? resolve(options['--signature']) : null, storeRoot: resolve(options['--store']) })
  }
  if (command === 'reproduce') {
    if (!options['--store'] || !options['--import-id'] || options['--release'] || options['--handoff'] || options['--signature'] || hasNumericalIntent) throw new Error('usage: entity-mention-handoff.js reproduce --store DIR --import-id sha256:DIGEST')
    const reopened = await reopenEntityMentionHandoff({ storeRoot: resolve(options['--store']), importId: options['--import-id'] })
    return createImportedMthfrSimulationSpecification(reopened)
  }
  if (command === 'simulate') {
    if (!options['--store'] || !options['--import-id'] || !options['--preset'] || !options['--mthfr-activity'] || !options['--duration-hours'] || options['--release'] || options['--handoff'] || options['--signature']) throw new Error('usage: entity-mention-handoff.js simulate --store DIR --import-id sha256:DIGEST --preset PRESET --mthfr-activity NUMBER --duration-hours NUMBER [--step-hours NUMBER]')
    const reopened = await reopenEntityMentionHandoff({ storeRoot: resolve(options['--store']), importId: options['--import-id'] })
    return simulateImportedMthfr({
      preset:        options['--preset'],
      mthfrActivity: Number(options['--mthfr-activity']),
      durationHours: Number(options['--duration-hours']),
      stepHours:     options['--step-hours'] === undefined ? 0.05 : Number(options['--step-hours'])
    }, reopened)
  }
  throw new Error('usage: entity-mention-handoff.js <import|reproduce|simulate> ...')
}

main().then((result) => process.stdout.write(`${canonicalJson(result)}\n`)).catch((error) => {
  process.stderr.write(`${error.stack ?? error.message}\n`)
  process.exitCode = 1
})
