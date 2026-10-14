// @vitest-environment node
import { describe, expect, it } from 'vitest'
import knowledge from '../../src/knowledge/data/index.js'
import { runValidation } from '../../src/sim/models/methylation-validate.js'
import { validationIndex, validationTargets } from '../../src/sim/validation-targets.js'

const known = new Set(knowledge.map((e) => e.id))
const rows = runValidation()

describe('methylation validation targets', () => {
  it('lists every target with a source, tolerance and expected statement', () => {
    expect(validationTargets.length).toBeGreaterThanOrEqual(35)
    expect(new Set(validationTargets.map((t) => t.id)).size).toBe(validationTargets.length)
    for (const t of validationTargets) {
      expect(t.title, t.id).toBeTruthy(); expect(t.expected, t.id).toBeTruthy(); expect(t.tolerance, t.id).toBeTruthy()
      expect(['pass', 'fail', 'info']).toContain(t.expectedStatus)
      for (const ref of t.source) expect(known.has(ref), `${t.id}: ${ref}`).toBe(true)
    }
    expect(rows.map((r) => r.id)).toEqual(validationTargets.map((t) => t.id))
  })

  it('every row evaluates to its pinned status (a change of the model that flips a result fails here)', () => {
    const flipped = rows.filter((r) => r.status !== r.expectedStatus).map((r) => `${r.id}: ${r.status} (pinned ${r.expectedStatus}) - ${r.detail}`)
    expect(flipped).toEqual([])
  })

  it('every disagreement with a source is explained, not hidden', () => {
    const failing = rows.filter((r) => r.status === 'fail')
    expect(failing.length).toBeGreaterThanOrEqual(10) // the model does not reproduce everything; the list is the record
    for (const r of failing) expect(r.why && r.why.length > 60, `${r.id} needs an explanation`).toBe(true)
  })

  it('reports the validation table (pass/fail with observed values)', () => {
    const pass = rows.filter((r) => r.status === 'pass').length
    const fail = rows.filter((r) => r.status === 'fail').length
    console.info(`validation: ${pass} pass, ${fail} documented disagreements, ${rows.length} total`)
    for (const r of rows) console.info(`${r.status.toUpperCase().replace("FAIL", "MISMATCH").padEnd(8)} ${r.id.padEnd(28)} ${r.detail}`)
    expect(pass).toBeGreaterThanOrEqual(20)
  })

  describe('reference steady state and flux budgets', () => {
    it('exists, is positive and stable, and reproduces SAM, SAH, SAM:SAH and tHcy', () => {
      for (const id of ['S-steady', 'S-stable', 'S-sam', 'S-sah', 'S-ratio', 'S-thcy']) expect(rows.find((r) => r.id === id).status, id).toBe('pass')
    })
    it('reproduces the Reed 2015 SAM-consumer shares, the transmethylation/transsulfuration partition and the methionine balance', () => {
      for (const id of ['S-mat', 'S-shares-reed', 'S-partition', 'S-bhmt-share', 'S-met-balance', 'S-gnmt-gly-sat']) expect(rows.find((r) => r.id === id).status, id).toBe('pass')
      const shares = rows.find((r) => r.id === 'S-shares-reed').observed
      expect(shares.gnmt).toBeCloseTo(0.437, 2); expect(shares.pemt).toBeCloseTo(0.275, 2); expect(shares.gamt).toBeCloseTo(0.253, 2); expect(shares.dnmt).toBeCloseTo(0.02, 2)
    })
    it('documents the scale and share disagreements with parameters-b2 (whole-body vs liver)', () => {
      const scale = rows.find((r) => r.id === 'S-scale')
      expect(scale.status).toBe('fail')
      expect(scale.observed).toBeGreaterThan(0.1); expect(scale.observed).toBeLessThan(0.15)
      expect(rows.find((r) => r.id === 'S-shares-b2').status).toBe('fail')
      expect(rows.find((r) => r.id === 'S-pemt-fraction').status).toBe('fail')
    })
    it('matches the glycine and betaine pharmacokinetics it was fitted to', () => {
      const gly = rows.find((r) => r.id === 'S-gly-pk')
      expect(gly.status).toBe('pass'); expect(gly.observed.peak).toBeGreaterThan(780); expect(gly.observed.peak).toBeLessThan(1050)
      const bet = rows.find((r) => r.id === 'S-bet-pk')
      expect(bet.status).toBe('pass'); expect(bet.observed.cmax).toBeGreaterThan(800); expect(bet.observed.cmax).toBeLessThan(1080)
    })
  })

  describe('directional checks with citations', () => {
    it('MTHFR down: tHcy up and 5-MTHF down', () => {
      const r = rows.find((x) => x.id === 'D-mthfr'); expect(r.status).toBe('pass'); expect(r.observed.hcy).toBeGreaterThan(0); expect(r.observed.mthf).toBeLessThan(0)
    })
    it('B6 down: cystathionine goes UP (CTH is more PLP-sensitive than CBS), which is what Gregory 2013 measured', () => {
      const r = rows.find((x) => x.id === 'D-b6-cysta'); expect(r.status).toBe('pass'); expect(r.observed).toBeGreaterThan(0.3)
      expect(rows.find((x) => x.id === 'D-b6-postload').status).toBe('pass') // larger post-load increment
    })
    it('betaine and choline raise BHMT flux and lower Hcy, dose-dependently', () => {
      for (const id of ['D-betaine-hcy', 'D-betaine-postload', 'D-choline-hcy', 'D-choline-bhmt']) expect(rows.find((x) => x.id === id).status, id).toBe('pass')
      const o = rows.find((x) => x.id === 'D-betaine-hcy').observed
      expect(o[6]).toBeLessThan(o[1.5])
    })
    it('B12 deficiency shows the folate trap with total folate conserved', () => {
      const r = rows.find((x) => x.id === 'D-b12-trap'); expect(r.status).toBe('pass'); expect(r.observed.mthf).toBeGreaterThan(0.3); expect(r.observed.thf).toBeLessThan(-0.3)
    })
    it('niacin load raises SAH and lowers SAM and SAM:SAH', () => {
      const r = rows.find((x) => x.id === 'D-niacin'); expect(r.status).toBe('pass'); expect(r.observed.sah).toBeGreaterThan(0); expect(r.observed.ratio).toBeLessThan(-0.05)
      expect(rows.find((x) => x.id === 'D-niacin-methyl').status).toBe('pass')
    })
    it('glycine load: the SAM:SAH change is small and variant-dependent (stated amounts), sarcosine only rises in the Luka variant', () => {
      const r = rows.find((x) => x.id === 'D-glycine-sarcosine')
      expect(r.observed.reed130.ratio).toBeGreaterThan(-0.05) // Km 130 uM: GNMT saturated, essentially no SAM:SAH effect
      expect(r.observed.luka2000.ratio).toBeLessThan(-0.03); expect(r.observed.luka2000.ratio).toBeGreaterThan(-0.2)
      expect(r.observed.luka2000.gnmt).toBeGreaterThan(0.05) // GNMT flux up with the mM Km
      expect(r.observed.luka2000.sar).toBeGreaterThan(0) // sarcosine up (transiently)
      expect(r.observed.reed130.gnmt).toBeLessThan(0.05)
    })
    it('methionine load test raises tHcy by tens of percent with a peak hours after the dose', () => {
      const r = rows.find((x) => x.id === 'D-met-load'); expect(r.status).toBe('pass'); expect(r.observed.peakRel).toBeGreaterThan(0.4)
    })
  })

  describe('known disagreements stay documented', () => {
    it('knockouts: GNMT and BHMT loss are directionally right but far too small', () => {
      const g = rows.find((x) => x.id === 'D-gnmt-ko'); expect(g.status).toBe('fail'); expect(g.observed).toBeGreaterThan(1.5); expect(g.observed).toBeLessThan(10)
      const b = rows.find((x) => x.id === 'D-bhmt-ko'); expect(b.status).toBe('fail'); expect(b.observed.sam).toBeLessThan(1)
    })
    it('B6 restriction: the model raises fasting tHcy whereas the study saw no change', () => {
      expect(rows.find((x) => x.id === 'D-b6-thcy').observed).toBeGreaterThan(0.1)
      expect(validationIndex['D-b6-thcy'].why).toMatch(/PLP/)
    })
    it('glycine: sarcosine and tHcy responses disagree with the animal and human data', () => {
      expect(rows.find((x) => x.id === 'D-glycine-chronic-sarcosine').status).toBe('fail')
      expect(rows.find((x) => x.id === 'D-glycine-thcy').observed).toBeLessThan(0)
    })
  })

  describe('conservation', () => {
    it('folate total and methyl groups are conserved by the internal reactions', () => {
      expect(rows.find((x) => x.id === 'C-folate').status).toBe('pass')
      expect(rows.find((x) => x.id === 'C-methyl').status).toBe('pass')
    })
  })
})
