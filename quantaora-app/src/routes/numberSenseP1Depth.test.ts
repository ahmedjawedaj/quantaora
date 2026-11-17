import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./NumberSenseLab.tsx', import.meta.url)), 'utf8')

test('NumberSenseLab exposes visible P1 missions and observe/predict/change/explain challenges for every number-sense domain', () => {
  assert.match(source, /const NUMBER_SENSE_MISSIONS: NumberMission\[\] = \[/)
  assert.match(source, /data-number-mission/)
  assert.match(source, /data-number-challenge/)
  for (const operation of [
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'place-value',
    'number-line',
    'negative-number',
    'factors',
    'multiples',
    'prime-number',
  ]) {
    assert.match(source, new RegExp(`operationId: '${operation}'`))
  }
  for (const marker of ['Observe:', 'Predict:', 'Change:', 'Explain:', 'challenge:']) {
    assert.match(source, new RegExp(marker.replace(':', '\\:')))
  }
  assert.match(source, /Drag the hundreds\/tens\/ones sliders, or press Add one/)
  assert.match(source, /Deal cubes into bowls/)
  assert.match(source, /Use a jump to prove where the marker lands/)
  assert.doesNotMatch(source, /coming soon|placeholder/i)
})
