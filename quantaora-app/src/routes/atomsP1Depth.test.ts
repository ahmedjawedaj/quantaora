import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const routeSource = readFileSync(new URL('./AtomsLab.tsx', import.meta.url), 'utf8')

describe('Atoms Lab P1 depth', () => {
  it('keeps the visible critical-thinking missions focused on prediction', () => {
    assert.ok(routeSource.includes('Critical-thinking missions'))
    assert.ok(routeSource.includes('Predict first'))
    assert.ok(routeSource.includes('Predict which element you will get before tapping a different periodic table tile.'))
    assert.ok(routeSource.includes('Predict whether adding neutrons changes the element or just its mass.'))
    assert.ok(routeSource.includes('Predict which shell loses or gains an electron as charge changes.'))
    assert.ok(routeSource.includes('Predict how the outer shell ring will look before you move the Ion charge slider.'))
  })

  it('names particle identity and periodic-table family challenges', () => {
    for (const marker of [
      'Protons set identity',
      'neutrons set isotope mass',
      'electrons set ion charge',
      'group ${element.group}, period ${element.period}',
      'metal, nonmetal, halogen, or noble gas',
      'Halogens sit in group 17',
      'Noble gases sit in group 18',
      'metal side',
      'Nonmetals cluster on the upper right',
    ]) {
      assert.ok(routeSource.includes(marker), `missing marker: ${marker}`)
    }
  })
})
