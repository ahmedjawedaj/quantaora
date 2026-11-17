import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const ELECTRICITY_LAB_PATH = fileURLToPath(new URL('./ElectricityLab.tsx', import.meta.url))
const src = readFileSync(ELECTRICITY_LAB_PATH, 'utf8')

test('ElectricityLab: circuit inspection is driven by live variables, not static copy', () => {
  const helperIdx = src.indexOf('function circuitInspectionSummary')
  assert.notEqual(helperIdx, -1, 'expected circuitInspectionSummary to exist')
  const helperBody = src.slice(helperIdx, src.indexOf('\nfunction pathLength', helperIdx))

  for (const needle of [
    'selectedPart',
    'mode',
    'switchClosed',
    'voltage',
    'resistance',
    'loadCount',
    'current',
    'brightness',
    'bulbPower',
  ]) {
    assert.ok(helperBody.includes(needle), `expected inspection helper to use ${needle}`)
  }

  assert.match(helperBody, /current\.toFixed\(2\)/, 'expected inspection copy to show live current')
  assert.match(helperBody, /Math\.round\(brightness \* 100\)/, 'expected inspection copy to show live glow percentage')
  assert.match(helperBody, /bulbPower\.toFixed\(1\)/, 'expected inspection copy to show live bulb power')
})

test('ElectricityLab: side inspection card makes change, observe, and explain explicit', () => {
  const componentIdx = src.indexOf('function CircuitInspection')
  assert.notEqual(componentIdx, -1, 'expected CircuitInspection component to exist')
  const componentBody = src.slice(componentIdx, src.indexOf('\n/** Short predict', componentIdx))

  for (const label of ['Change', 'Observe', 'Explain']) {
    assert.ok(componentBody.includes(`>${label}<`), `expected CircuitInspection to render a ${label} step`)
  }

  assert.match(componentBody, /inspection\.change/, 'expected card to render the live change instruction')
  assert.match(componentBody, /inspection\.observe/, 'expected card to render the live observation')
  assert.match(componentBody, /inspection\.explain/, 'expected card to render the explanation')
  assert.match(componentBody, /onOpenControls/, 'expected card to open the actual circuit controls')
})

test('ElectricityLab: inspection reaches both the side card and DetailPanel key facts', () => {
  assert.match(
    src,
    /const inspection = useMemo\(\(\) => circuitInspectionSummary\(\{/,
    'expected route to memoize inspection from current circuit state',
  )
  assert.match(
    src,
    /\{ label: 'Cause\/effect', value: inspection\.explain \}/,
    'expected DetailPanel key facts to include the same cause/effect explanation',
  )
  assert.match(
    src,
    /<CircuitInspection inspection=\{inspection\} onOpenControls=\{\(\) => setControlsOpen\(true\)\} \/>/,
    'expected the side column to render the live inspection card and open the real controls',
  )
})

test('ElectricityLab: critical thinking missions cover the P1 electricity concepts', () => {
  const challengesIdx = src.indexOf('const challenges: Challenge[] = useMemo(() => [')
  assert.notEqual(challengesIdx, -1, 'expected a critical thinking mission list')
  const challengesBody = src.slice(challengesIdx, src.indexOf('\n  const selectPart', challengesIdx))

  for (const concept of [
    'Voltage',
    'Resistance',
    'Current',
    'Open/closed circuit',
    'Series circuit',
    'Parallel circuit',
    'Bulb brightness',
    'Energy transfer',
    'Series vs parallel',
  ]) {
    assert.ok(challengesBody.includes(`concept: '${concept}'`), `expected mission coverage for ${concept}`)
  }
})

test('ElectricityLab: missions render predict, change, observe, and explain visibly', () => {
  const componentIdx = src.indexOf('function PredictRunCheck')
  assert.notEqual(componentIdx, -1, 'expected PredictRunCheck component to exist')
  const componentBody = src.slice(componentIdx, src.indexOf('\nexport default function ElectricityLab', componentIdx))

  for (const label of ['Predict', 'Change', 'Observe', 'Explain']) {
    assert.ok(componentBody.includes(`>${label}<`), `expected PredictRunCheck to render ${label}`)
  }

  for (const field of ['challenge.prompt', 'challenge.change', 'challenge.observe', 'challenge.explain']) {
    assert.ok(componentBody.includes(field), `expected PredictRunCheck to render ${field}`)
  }

  assert.match(componentBody, /Mission \{index \+ 1\} of \{challenges\.length\}/, 'expected mission progress to be visible')
  assert.match(componentBody, /challenge\.concept/, 'expected each mission concept to be visible')
})
