import { afterEach, describe, expect, it } from 'vitest'
import { accessibilityViolations } from '../helpers/axe.js'

// The jsdom audit must actually find problems, or every component audit is vacuous.
describe('jsdom accessibility audit', () => {
  afterEach(() => { document.body.innerHTML = '' })

  it('reports unnamed controls, unlabelled inputs and broken definition lists', async () => {
    document.body.innerHTML = '<main><button></button><input type="text"><dl><span>x</span></dl><img src="x.png"></main>'

    const found = (await accessibilityViolations()).map((line) => line.split(':')[0])

    expect(found).toEqual(expect.arrayContaining(['button-name', 'label', 'definition-list', 'image-alt']))
  })

  it('accepts a labelled control', async () => {
    document.body.innerHTML = '<main><label for="a">Name</label><input id="a" type="text"><button type="button">Save</button></main>'

    expect(await accessibilityViolations()).toEqual([])
  })
})
