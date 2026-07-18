import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'

await createRevalidationCampaignEngine({
  root: process.argv[2],
  env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '1' },
  hooks: { afterResultArtifact: () => process.exit(73) },
  maximumWorkerRuntimeMs: 5000
})

await new Promise(() => {})
