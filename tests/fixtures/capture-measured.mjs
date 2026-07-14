import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const origin = process.env.MEASURED_CAPTURE_ORIGIN ?? 'http://127.0.0.1:8120'
const output = resolve('tests/fixtures/measured/public')
const release = 'measured-apap-observation-commons-v1.0.1'
const base = `/api/measured/v1/releases/${release}`
const index = {}
let sequence = 0

await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })

async function capture(path) {
  const response = await fetch(`${origin}${path}`)
  if (!response.ok) throw new Error(`Capture failed with ${response.status}: ${path}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  const filename = `${String(sequence++).padStart(3, '0')}.json`
  await writeFile(resolve(output, filename), bytes)
  index[path] = filename
  return JSON.parse(bytes)
}

async function pages(endpoint, query = {}) {
  let cursor
  const items = []
  do {
    const parameters = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value !== null) parameters.set(key, value)
    parameters.set('limit', '100')
    if (cursor) parameters.set('cursor', cursor)
    const body = await capture(`${base}/${endpoint}?${parameters}`)
    items.push(...body.items)
    cursor = body.next_cursor
  } while (cursor)
  return items
}

await capture('/api/measured/v1')
await capture('/api/measured/v1/trust')
await capture('/api/measured/v1/releases')
await capture(base)
await capture(`${base}/envelope`)
await pages('datasets', { role: null })
await pages('studies', { family_id: null })
await pages('partitions', { role: null })
await pages('provenance', { source: null })
await pages('applicability', { observable_id: null, study_id: null })
await pages('exclusions', { reason_code: null })
const development = await pages('measurements', { group_id: null, level: null, observable_id: null, role: 'development', study_id: null })
const calibration = await pages('measurements', { group_id: null, level: null, observable_id: null, role: 'calibration', study_id: null })
await pages('missingness', { observable_id: null, reason: null, role: 'development', study_id: null })
await pages('missingness', { observable_id: null, reason: null, role: 'calibration', study_id: null })
const selected = calibration.filter((item) => item.observable_id === 'observable:cebs:alt' && item.id.includes(':h24:'))
selected.push(development[0])
for (const measurement of selected) await capture(`${base}/lineage/${encodeURIComponent(measurement.id)}`)
await writeFile(resolve(output, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)
