import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

const physiologyLabSrc = readSrc('./PhysiologyLab.tsx')

test('PhysiologyLab exposes visible critical-thinking missions for every P1 body system', () => {
  const missions = [
    'Heart mission:',
    'Lung mission:',
    'Digestion mission:',
    'Kidney mission:',
    'Nerve mission:',
    'Muscle mission:',
    'Hormone mission:',
    'Immune mission:',
    'Temperature mission:',
  ]

  for (const mission of missions) {
    assert.match(physiologyLabSrc, new RegExp(mission))
  }

  assert.match(physiologyLabSrc, /Critical-thinking mission/)
  assert.match(physiologyLabSrc, /\{challenge\.mission\}/)
})

test('PhysiologyLab keeps predict, change, observe, and explain visible in the tuning panel', () => {
  assert.match(physiologyLabSrc, /Predict, then check/)
  assert.match(physiologyLabSrc, /Observe\.<\/strong> \{challenge\.observe\}/)
  assert.match(physiologyLabSrc, /Predict\.<\/strong> \{challenge\.predict\}/)
  assert.match(physiologyLabSrc, /Change\.<\/strong> \{challenge\.change\}/)
  assert.match(physiologyLabSrc, /Explain\.<\/strong> \{copy\.explanation\}/)
})

test('PhysiologyLab names the required cause and effect variables across systems', () => {
  const requiredSignals = [
    'Heart rate',
    'Pressure',
    'Airway tightness',
    'enzyme action',
    'Water level',
    'Waste load',
    'nerve signal',
    'pathway gap',
    'Load weight',
    'Hormone delivery',
    'Germ load',
    'sweat',
    'Heat stress',
  ]

  for (const signal of requiredSignals) {
    assert.match(physiologyLabSrc, new RegExp(signal, 'i'))
  }
})

test('PhysiologyLab preserves common canvas toolbar compatibility', () => {
  assert.match(physiologyLabSrc, /<CanvasControls/)
  assert.match(physiologyLabSrc, /onToggleAutoRotate=\{\(\) => setAutoRotate/)
  assert.match(physiologyLabSrc, /onToggleIsolate=\{\(\) => setIsolateActive/)
  assert.match(physiologyLabSrc, /onCompare=\{\(\) => setCompareOpen\(true\)\}/)
  assert.match(physiologyLabSrc, /onToggleAnimation=\{\(\) => setAnimationPlaying/)
  assert.match(physiologyLabSrc, /onToggleCleanView=\{\(\) => setCleanView/)
  assert.match(physiologyLabSrc, /onReset=\{reset\}/)
})
