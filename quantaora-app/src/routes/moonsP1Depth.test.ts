import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./MoonsLab.tsx', import.meta.url)), 'utf8')

test('MoonsLab: exposes a changing phase control and kid-facing mission markers', () => {
  assert.match(source, /MOON_PHASES/)
  assert.match(source, /aria-label="Moon phase"/)
  assert.match(source, /value=\{phaseIndex\}/)

  for (const marker of ['label="Observe"', 'label="Predict"', 'label="Change"', 'label="Explain"']) {
    assert.match(source, new RegExp(marker), `expected mission marker ${marker}`)
  }
})

test('MoonsLab: mission copy names the required moon learning cause/effect areas', () => {
  for (const concept of ['phase', 'gravity', 'craters', 'surface', 'orbit', 'tidal', 'compare']) {
    assert.match(source, new RegExp(concept, 'i'), `expected visible mission/challenge copy to mention ${concept}`)
  }
})
