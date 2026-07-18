import { createRevalidationCampaignEngine } from '../../server/revalidation/service.js'

const campaignId = process.argv[3]
const engine = await createRevalidationCampaignEngine({
  root: process.argv[2],
  env: { NODE_ENV: 'test', BIOCHEMICAL_REVALIDATION_CONCURRENCY: '1' },
  maximumWorkerRuntimeMs: 60000
})

const timer = setInterval(() => {
  const campaign = engine.getCampaign(campaignId)
  if (campaign.work.some((work) => work.state === 'running')) {
    clearInterval(timer)
    process.stdout.write('RUNNING\n')
  }
}, 5)
