import { readFile } from 'node:fs/promises'
import { gunzipSync } from 'node:zlib'
import { resolve } from 'node:path'
import { RevalidationGoldenFixtureSchema } from '../../shared/revalidation-contracts.js'
import { recomputeImpactPlan } from './planning.js'
import { parseCanonicalRevalidation } from './verification.js'

export async function loadGoal11RevalidationFixture() {
  const serverRoot = process.argv[1]?.includes('server-dist/') ? 'server-dist/server' : 'server'
  const path = resolve(process.cwd(), serverRoot, 'revalidation/fixtures/goal11-producer-golden.json.gz.base64')
  const encoded = (await readFile(path, 'utf8')).replace(/\s/g, '')
  const bytes = gunzipSync(Buffer.from(encoded, 'base64'))
  const fixture = parseCanonicalRevalidation(bytes, RevalidationGoldenFixtureSchema, 'Goal 11 revalidation producer fixture')
  const planning = {
    dependencySnapshot: fixture.dependency_snapshot,
    changeSet: fixture.change_set,
    impactPolicy: fixture.impact_policy
  }
  return Object.freeze({ ...planning, impactPlan: recomputeImpactPlan(planning) })
}
