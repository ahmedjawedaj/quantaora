import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the Ecology P2 fix: Predator and Prey previously rendered through the
// same `PursuitScene` component with only a scale/opacity `emphasis` prop swapped, and shared
// near-identical readout labels ("Predators" / "Prey safety" for both). That made the two
// concepts look and read almost identically. This test locks in that they now use distinct
// geometry components, distinct readout labels, and a distinct control order/copy, and that the
// mobile StageStrip no longer renders unreadably tiny in-scene text.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL/R3F-render harness -- see ecologySupportGlbErrorStatus.test.ts).
//
// Run with: node --test src/routes/ecologyPredatorPreyDistinct.test.ts

const ECOLOGY_LAB_PATH = fileURLToPath(new URL('./EcologyLab.tsx', import.meta.url))
const src = readFileSync(ECOLOGY_LAB_PATH, 'utf8')

test('ConceptFocus: predator and prey each render their own dedicated hero component, not a shared PursuitScene', () => {
  assert.doesNotMatch(src, /PursuitScene/, 'expected the old shared PursuitScene component to be fully removed')
  assert.match(src, /function PredatorHuntView\(/, 'expected a dedicated PredatorHuntView component')
  assert.match(src, /function PreySurvivalView\(/, 'expected a dedicated PreySurvivalView component')

  const conceptFocusIdx = src.indexOf('function ConceptFocus(')
  assert.ok(conceptFocusIdx !== -1, 'expected a ConceptFocus component')
  const predatorCaseIdx = src.indexOf("case 'predator': {", conceptFocusIdx)
  const preyCaseIdx = src.indexOf("case 'prey': {", conceptFocusIdx)
  assert.ok(predatorCaseIdx !== -1 && preyCaseIdx !== -1, 'expected predator/prey cases in ConceptFocus')
  const predatorCase = src.slice(predatorCaseIdx, preyCaseIdx)
  const preyCase = src.slice(preyCaseIdx, preyCaseIdx + 400)
  assert.match(predatorCase, /<PredatorHuntView/, 'predator case should render PredatorHuntView')
  assert.match(preyCase, /<PreySurvivalView/, 'prey case should render PreySurvivalView')
})

test('PredatorHuntView uses hunter-viewpoint geometry (detection range + capture/energy readouts) distinct from PreySurvivalView', () => {
  const fnIdx = src.indexOf('function PredatorHuntView(')
  const body = src.slice(fnIdx, src.indexOf('function PreySurvivalView('))
  assert.match(body, /detectionRadius/, 'expected a detection-range concept in the hunter view')
  assert.match(body, /captureChance/, 'expected a capture-chance readout in the hunter view')
  assert.match(body, /energyCost/, 'expected an energy-cost readout in the hunter view')
  assert.doesNotMatch(body, /safeZonePos/, 'hunter view should not reuse the prey survival view safe-zone concept')
})

test('PreySurvivalView uses survival-viewpoint geometry (safe zones + escape route + camouflage/risk) distinct from PredatorHuntView', () => {
  const fnIdx = src.indexOf('function PreySurvivalView(')
  const body = src.slice(fnIdx, fnIdx + 3000)
  assert.match(body, /safeZonePos/, 'expected a safe-zone concept in the survival view')
  assert.match(body, /camouflage/, 'expected a camouflage readout in the survival view')
  assert.match(body, /risk/, 'expected a risk readout in the survival view')
  assert.doesNotMatch(body, /detectionRadius/, 'survival view should not reuse the predator hunt view detection-range concept')
})

test('ecosystemReadout: predator and prey no longer share identical primary/result meter labels', () => {
  const predatorIdx = src.indexOf("case 'predator': {")
  const preyIdx = src.indexOf("case 'prey': {")
  assert.ok(predatorIdx !== -1 && preyIdx !== -1, 'expected predator/prey readout cases')
  const predatorBlock = src.slice(predatorIdx, preyIdx)
  const preyBlock = src.slice(preyIdx, preyIdx + 900)

  assert.match(predatorBlock, /primaryLabel: 'Detection range'/)
  assert.match(predatorBlock, /resultLabel: 'Capture chance'/)
  assert.match(predatorBlock, /secondLabel: 'Energy cost'/)

  assert.match(preyBlock, /primaryLabel: 'Safe zone'/)
  assert.match(preyBlock, /resultLabel: 'Escape route'/)
  assert.match(preyBlock, /secondLabel: 'Camouflage'/)
})

test('TunePanel: predator and prey lead with a role-specific control instead of the shared default sunlight-first order', () => {
  const fnIdx = src.indexOf('function TunePanel(')
  assert.ok(fnIdx !== -1, 'expected TunePanel to still be defined')
  const body = src.slice(fnIdx, fnIdx + 3200)
  assert.match(body, /componentId: string/, 'expected TunePanel to accept a componentId prop to key role-specific behavior off of')
  assert.match(body, /predator: \['predators', 'sunlight', 'decomposers', 'habitatStress'\]/)
  assert.match(body, /prey: \['habitatStress', 'sunlight', 'predators', 'decomposers'\]/)
})

test('StageStrip: no longer renders in-scene 3D text labels on mobile-aspect viewports', () => {
  const fnIdx = src.indexOf('function StageStrip(')
  assert.ok(fnIdx !== -1, 'expected StageStrip to still be defined')
  const body = src.slice(fnIdx, src.indexOf('function EcoLabel('))
  assert.match(body, /viewport\.aspect < 1/, 'expected StageStrip to gate its label text on the same not-full-desktop-scale threshold ResponsiveEcoGroup uses for its own downscale tiers')
  assert.match(body, /\{!mobile && \(/, 'expected the <Billboard><Text> label to be conditionally skipped on mobile')
})
