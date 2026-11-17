import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the math quality coverage wave: these checks stay intentionally narrow
// and source-structural because the route tests in this app do not mount WebGL/R3F scenes.
//
// Run with: node --test src/routes/mathHandsOnCoverageWave.test.ts

const NUMBER_SENSE_SRC = readFileSync(fileURLToPath(new URL('./NumberSenseLab.tsx', import.meta.url)), 'utf8')
const MANIPULATIVES_SRC = readFileSync(fileURLToPath(new URL('./MathManipulativesLab.tsx', import.meta.url)), 'utf8')
const MANIPULATIVE_MISSIONS_SRC = readFileSync(fileURLToPath(new URL('../data/mathManipulativeMissions.ts', import.meta.url)), 'utf8')
const MATH_P1_CONTROLS_SRC = readFileSync(fileURLToPath(new URL('../components/labs/MathP1Controls.tsx', import.meta.url)), 'utf8')

test('NumberSenseLab place value exposes an in-stage Add one regroup prediction tied to the same carry helper as TunePanel', () => {
  assert.match(NUMBER_SENSE_SRC, /function addOnePlaceValue\(value: Controls\): Controls/)
  assert.match(NUMBER_SENSE_SRC, /Predict:\s*<\/span>\s*\{currentValue\} \+ 1 becomes/)
  assert.match(NUMBER_SENSE_SRC, /Observe:\s*<\/span>/)
  assert.match(NUMBER_SENSE_SRC, /<AbacusRegroupPreview controls=\{controls\} onAddOne=\{\(\) => onChangeControls\(addOnePlaceValue\(controls\)\)\}/)
  assert.match(NUMBER_SENSE_SRC, /onClick=\{\(\) => setControls\(addOnePlaceValue\)\}/)
})

test('NumberSenseLab exposes guided missions across every number-sense component', () => {
  assert.match(NUMBER_SENSE_SRC, /const NUMBER_SENSE_MISSIONS: NumberMission\[\] = \[/)
  assert.match(NUMBER_SENSE_SRC, /title: 'Regroup ones into a ten'/)
  assert.match(NUMBER_SENSE_SRC, /title: 'Prime or composite proof'/)
  assert.match(NUMBER_SENSE_SRC, /function MissionRail\(/)
  assert.match(NUMBER_SENSE_SRC, /data-number-mission/)
  assert.match(NUMBER_SENSE_SRC, /const startMissionAt = \(index: number\) =>/)
  assert.match(NUMBER_SENSE_SRC, /setMissionIndex\(Math\.max\(0, NUMBER_SENSE_MISSIONS\.findIndex\(\(mission\) => mission\.operationId === nextId\)\)\)/)
})

test('NumberSenseLab exposes direct canvas-level manipulative controls outside the tuning drawer', () => {
  assert.match(NUMBER_SENSE_SRC, /function QuickManipulativeControls\(/)
  assert.match(NUMBER_SENSE_SRC, /data-number-quick-controls/)
  assert.match(NUMBER_SENSE_SRC, /<QuickManipulativeControls operationId=\{componentId\} controls=\{controls\} setControls=\{setControls\} \/>/)
  assert.match(NUMBER_SENSE_SRC, /Next prime/)
  assert.match(NUMBER_SENSE_SRC, /Make 6 & 8/)
})

test('MathManipulativesLab fractions and ratios show immediate observe/predict feedback beyond static selected parts', () => {
  assert.match(MANIPULATIVES_SRC, /Observe: simplified = \{simplified\}\. Predict half, then change squares\./)
  assert.match(MANIPULATIVES_SRC, /Predict: make both groups match\./)
  assert.match(MANIPULATIVES_SRC, /Observe: \{ratioTotal\} dots total; groups differ by \{ratioDiff\}\./)
})

test('MathManipulativesLab exposes guided missions across geometry, fractions, and data components', () => {
  assert.match(MANIPULATIVE_MISSIONS_SRC, /export const MATH_MANIPULATIVE_MISSIONS: MathMission\[\] = \[/)
  assert.match(MANIPULATIVE_MISSIONS_SRC, /title: 'Build a right angle'/)
  assert.match(MANIPULATIVE_MISSIONS_SRC, /title: 'Make one half'/)
  assert.match(MANIPULATIVE_MISSIONS_SRC, /title: 'Create a rising trend'/)
  assert.match(MANIPULATIVES_SRC, /import \{ MATH_MANIPULATIVE_MISSIONS \} from '@\/data\/mathManipulativeMissions'/)
  assert.match(MANIPULATIVES_SRC, /import \{ MathMissionPanel, QuickMathControls \} from '@\/components\/labs\/MathP1Controls'/)
  assert.match(MATH_P1_CONTROLS_SRC, /export function MathMissionPanel\(/)
  assert.match(MATH_P1_CONTROLS_SRC, /data-math-mission/)
  assert.match(MANIPULATIVES_SRC, /setMissionIndex\(Math\.max\(0, MATH_MANIPULATIVE_MISSIONS\.findIndex\(\(mission\) => mission\.componentId === id\)\)\)/)
})

test('MathManipulativesLab has one visible mission for all 29 components and causal P1 prompts', () => {
  const ids = ['angle', 'area', 'circle', 'line', 'perimeter', 'point', 'quadrilateral', 'ray', 'segment', 'triangle', 'volume', 'decimal', 'denominator', 'equivalent-fraction', 'fraction', 'numerator', 'percent', 'proportion', 'ratio', 'bar-chart', 'data-point', 'line-graph', 'mean', 'median', 'mode', 'outlier', 'probability', 'range', 'table']
  assert.equal((MANIPULATIVE_MISSIONS_SRC.match(/componentId: '/g) ?? []).length, 29)
  for (const id of ids) assert.match(MANIPULATIVE_MISSIONS_SRC, new RegExp(`componentId: '${id}'`))
  for (const term of ['angle', 'area', 'perimeter', 'depth', 'denominator', 'numerator', 'percent', 'ratio', 'mean', 'median', 'mode', 'range', 'outlier', 'probability']) assert.match(MANIPULATIVE_MISSIONS_SRC, new RegExp(term, 'i'))
})

test('MathManipulativesLab exposes direct bottom-band quick controls outside Tune math', () => {
  assert.match(MATH_P1_CONTROLS_SRC, /export function QuickMathControls\(/)
  assert.match(MATH_P1_CONTROLS_SRC, /data-math-quick-controls/)
  assert.match(MANIPULATIVES_SRC, /<QuickMathControls domain=\{domain\} componentId=\{componentId\} controls=\{controls\} setControls=\{setControls\} \/>/)
  assert.match(MATH_P1_CONTROLS_SRC, /Make target/)
  assert.match(MATH_P1_CONTROLS_SRC, /Equal mix/)
  assert.match(MATH_P1_CONTROLS_SRC, /Balance/)
  assert.match(MATH_P1_CONTROLS_SRC, /data-outside-canvas-controls/)
  assert.match(MANIPULATIVES_SRC, /!cleanView && <QuickMathControls/)
})

test('MathManipulativesLab probability requires a prediction and explains it against the observed spin', () => {
  assert.match(MANIPULATIVES_SRC, /const \[prediction, setPrediction\] = useState<string \| null>\(null\)/)
  assert.match(MANIPULATIVES_SRC, /Predict outcome/)
  assert.match(MANIPULATIVES_SRC, /disabled=\{!prediction\}/)
  assert.match(MANIPULATIVES_SRC, /Observed: landed on \{landed\}\./)
  assert.match(MANIPULATIVES_SRC, /Explain: prediction \{prediction === landed/)
})
