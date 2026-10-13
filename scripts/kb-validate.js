#!/usr/bin/env node
// Validate the knowledge base.
//   npm run kb:validate                    human readable report
//   npm run kb:validate -- --json          machine readable report
//   npm run kb:validate -- --data <file>   validate another module (default export = entity array)
//   npm run kb:validate -- --paths <file>  also check a guided-path module (default export = path array);
//                                          the default data set always checks src/knowledge/data/paths.js
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

// Guided paths ship with the default data set; a custom --data file can bring its own with --paths <file>.
const pathsFlag = args.indexOf('--paths')
let paths
if (pathsFlag >= 0) {
  if (!args[pathsFlag + 1]) fail('--paths needs a file path')
  try {
    paths = (await import(pathToFileURL(resolve(args[pathsFlag + 1])).href)).default
  } catch (error) {
    fail(error?.message ?? String(error))
  }
} else if (dataFlag < 0) {
  paths = (await import(pathToFileURL(resolve(import.meta.dirname, '../src/knowledge/data/paths.js')).href)).default
}

const report = validateKnowledge(entities, { paths })
process.stdout.write(json ? `${JSON.stringify(report, null, 2)}\n` : `${formatReport(report)}\n`)
process.exitCode = report.ok ? 0 : 1
