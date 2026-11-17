import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Static coverage guard for the Mechanics P1 depth upgrade: the kid-facing tune panel must
// expose critical-thinking missions that ask learners to predict, change, observe, and explain
// the major mechanics relationships, plus show what each slider changes as it moves.

const PHYSICS_LAB_PATH = fileURLToPath(new URL('./PhysicsLab.tsx', import.meta.url))
const src = readFileSync(PHYSICS_LAB_PATH, 'utf8')

test('PhysicsLab: critical thinking missions cover predict/change/observe/explain moves', () => {
  assert.match(src, /data-critical-thinking-missions/, 'expected a visible critical-thinking missions panel')
  for (const label of ['Predict', 'Change', 'Observe', 'Explain']) {
    assert.match(src, new RegExp(`>${label}<`), `expected learner-facing ${label} mission label`)
  }
})

test('PhysicsLab: missions cover the requested mechanics concepts', () => {
  for (const concept of [
    'Force and acceleration',
    'Mass resists change',
    'Friction steals push',
    'Slope and gravity',
    'Speed vs velocity',
    'Distance vs displacement',
    'Momentum and stopping',
    'Kinetic energy',
  ]) {
    assert.match(src, new RegExp(concept), `expected a kid-visible mission for ${concept}`)
  }
})

test('PhysicsLab: every mechanics mode has at least one mission', () => {
  for (const mode of ['force-motion', 'friction-slope', 'gravity-weight', 'motion-measure', 'momentum-energy']) {
    assert.match(src, new RegExp(`['"]${mode}['"]:\\s*\\[`), `expected missions for ${mode}`)
  }
})

test('PhysicsLab: slider labels state what changes when controls change', () => {
  assert.match(src, /function controlImpactLabels/, 'expected live control-impact labels')
  for (const phrase of [
    'changes net force now',
    'changes acceleration now',
    'changes friction limit now',
    'changes downhill pull now',
    'changes weight now',
  ]) {
    assert.match(src, new RegExp(phrase), `expected slider impact text: ${phrase}`)
  }
  assert.match(src, /impactText=\{impacts\.force\}/, 'expected force slider to show its live impact')
  assert.match(src, /impactText=\{impacts\.mass\}/, 'expected mass slider to show its live impact')
  assert.match(src, /impactText=\{impacts\.friction\}/, 'expected friction slider to show its live impact')
  assert.match(src, /impactText=\{impacts\.slope\}/, 'expected slope slider to show its live impact')
  assert.match(src, /impactText=\{impacts\.gravity\}/, 'expected gravity slider to show its live impact')
})
