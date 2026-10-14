#!/usr/bin/env node
// Validate the knowledge base.
//   npm run kb:validate                    human readable report
//   npm run kb:validate -- --json          machine readable report
//   npm run kb:validate -- --data <file>   validate another module (default export = entity array)
//   npm run kb:validate -- --paths <file>  also check a guided-path module (default export = path array);
//                                          the default data set always checks src/knowledge/data/paths.js
//   npm run kb:validate -- --quant <file>  also check a structured-quantity module (default export = record array);
//                                          the default data set always checks src/knowledge/data/quant.js
// Exit code 1 when there are errors (or the data cannot be loaded); warnings never fail.
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { formatReport, validateKnowledge } from '../src/knowledge/validate.js'

const args = process.argv.slice(2)
const json = args.includes('--json')
const dataFlag = args.indexOf('--data')
const dataPath = dataFlag >= 0 ? resolve(args[dataFlag + 1] ?? '') : resolve(import.meta.dirname, '../src/knowledge/data/index.js')

function fail(message) {
  if (json) process.stdout.write(`${JSON.stringify({ ok: false, loadError: message })}\n`)
  else process.stderr.write(`kb:validate could not load ${dataPath}\n${message}\n`)
  process.exit(1)
}

if (dataFlag >= 0 && !args[dataFlag + 1]) fail('--data needs a file path')

let entities
try {
  entities = (await import(pathToFileURL(dataPath).href)).default
} catch (error) {
  fail(error?.message ?? String(error))
}

/** Load an optional companion module: the --<flag> file when given, else the default data file for the default data set. */
async function companion(flag, defaultFile) {
  const at = args.indexOf(flag)
  if (at >= 0) {
    if (!args[at + 1]) fail(`${flag} needs a file path`)
    try {
      return (await import(pathToFileURL(resolve(args[at + 1])).href)).default
    } catch (error) {
      fail(error?.message ?? String(error))
    }
  }
  if (dataFlag < 0) return (await import(pathToFileURL(resolve(import.meta.dirname, '../src/knowledge/data', defaultFile)).href)).default
  return undefined
}

// Guided paths and structured quantities ship with the default data set; a custom --data file can bring its own.
const paths = await companion('--paths', 'paths.js')
const quant = await companion('--quant', 'quant.js')

const report = validateKnowledge(entities, { paths, quant })
process.stdout.write(json ? `${JSON.stringify(report, null, 2)}\n` : `${formatReport(report)}\n`)
process.exitCode = report.ok ? 0 : 1
