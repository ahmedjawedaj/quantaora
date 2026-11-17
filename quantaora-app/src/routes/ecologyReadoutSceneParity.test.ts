import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the Ecology P0 fix: PredatorHuntView and PreySurvivalView used to
// recompute capture chance, energy cost, detection range, safe zone, escape route, and
// camouflage/risk with their own local formulas driven only by `pressure`, while the HTML
// meters (ecosystemReadout) computed the same-looking stats from the full cascade (including
// habitatStress via computeEcosystemState). At defaults the two formulas coincidentally lined
// up closely enough to look right, but under scenarios like Habitat Loss they diverged and the
// meters contradicted the 3D scene. The fix funnels both through predatorHuntStats /
// preySurvivalStats — a single canonical formula path — and the scene components now take the
// results as props instead of recomputing them.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/WebGL/R3F-render harness -- see
// ecologySupportGlbErrorStatus.test.ts and ecologyPredatorPreyDistinct.test.ts).

const ECOLOGY_LAB_PATH = fileURLToPath(new URL('./EcologyLab.tsx', import.meta.url))
const src = readFileSync(ECOLOGY_LAB_PATH, 'utf8')

test('predatorHuntStats/preySurvivalStats are the single canonical formula source', () => {
  assert.match(src, /function predatorHuntStats\(/, 'expected a canonical predatorHuntStats helper')
  assert.match(src, /function preySurvivalStats\(/, 'expected a canonical preySurvivalStats helper')

  const huntBody = src.slice(src.indexOf('function predatorHuntStats('), src.indexOf('function preySurvivalStats('))
  assert.match(huntBody, /state\.predatorFood/, 'capture chance must depend on the full cascade (predatorFood), not pressure alone')

  const survivalIdx = src.indexOf('function preySurvivalStats(')
  const survivalBody = src.slice(survivalIdx, src.indexOf('function ecosystemReadout('))
  assert.match(survivalBody, /state\.preySafety/, 'camouflage/safe-zone must depend on state.preySafety, which folds in habitatStress')
})

test('ecosystemReadout calls the canonical helpers instead of inlining its own formulas', () => {
  const predatorIdx = src.indexOf("case 'predator': {", src.indexOf('function ecosystemReadout('))
  const preyIdx = src.indexOf("case 'prey': {", predatorIdx)
  const predatorBlock = src.slice(predatorIdx, preyIdx)
  const preyBlock = src.slice(preyIdx, preyIdx + 600)
  assert.match(predatorBlock, /predatorHuntStats\(predators, state\)/)
  assert.match(preyBlock, /preySurvivalStats\(predators, state\)/)
})

test('ConceptFocus computes stats via the canonical helpers and passes them into the scene views as props', () => {
  const conceptFocusIdx = src.indexOf('function ConceptFocus(')
  const predatorCaseIdx = src.indexOf("case 'predator': {", conceptFocusIdx)
  const preyCaseIdx = src.indexOf("case 'prey': {", conceptFocusIdx)
  const predatorCase = src.slice(predatorCaseIdx, preyCaseIdx)
  const preyCase = src.slice(preyCaseIdx, preyCaseIdx + 500)

  assert.match(predatorCase, /const hunt = predatorHuntStats\(predators, state\)/)
  assert.match(predatorCase, /<PredatorHuntView[\s\S]*?\{\.\.\.hunt\}/)

  assert.match(preyCase, /const survival = preySurvivalStats\(predators, state\)/)
  assert.match(preyCase, /<PreySurvivalView[\s\S]*?\{\.\.\.survival\}/)
})

test('PredatorHuntView and PreySurvivalView no longer recompute stats locally from pressure alone', () => {
  const huntFnIdx = src.indexOf('function PredatorHuntView(')
  const huntBody = src.slice(huntFnIdx, src.indexOf('function PreySurvivalView('))
  assert.doesNotMatch(huntBody, /0\.16 \+ pressure/, 'capture chance must not be recomputed locally in the scene')
  assert.doesNotMatch(huntBody, /0\.32 \+ pressure/, 'energy cost must not be recomputed locally in the scene')
  assert.match(huntBody, /detectionPct: number/, 'expected detectionPct to arrive as a prop')
  assert.match(huntBody, /captureChance: number/, 'expected captureChance to arrive as a prop')
  assert.match(huntBody, /energyCost: number/, 'expected energyCost to arrive as a prop')

  const survivalFnIdx = src.indexOf('function PreySurvivalView(')
  const survivalBody = src.slice(survivalFnIdx, survivalFnIdx + 3000)
  assert.doesNotMatch(survivalBody, /1 - pressure \* 0\.68/, 'prey safety must not be recomputed locally in the scene (it must include habitatStress via preySafety)')
  assert.match(survivalBody, /safetyPct: number/, 'expected safetyPct to arrive as a prop')
  assert.match(survivalBody, /camouflage: string/, 'expected camouflage to arrive as a prop')
  assert.match(survivalBody, /risk: string/, 'expected risk to arrive as a prop')
})

test('scenario consistency: predator capture chance and prey safe zone reflect habitatStress in the canonical formula (defaults vs Habitat Loss)', () => {
  function clamp01(value: number) {
    return Math.min(1, Math.max(0, value))
  }
  function computeEcosystemState(sunlight: number, predators: number, decomposers: number, habitatStress: number) {
    const nutrientFactor = 0.55 + decomposers * 0.45
    const producerEnergy = clamp01((0.3 + sunlight * 0.7) * nutrientFactor * (1 - habitatStress * 0.45))
    const preyFood = clamp01(0.2 + producerEnergy * 0.8)
    const preySafety = clamp01((1 - predators * 0.68) * (1 - habitatStress * 0.22))
    const predatorFood = clamp01((0.2 + predators * 0.5) * preyFood)
    const starving = clampInt(2, 9, Math.round(2 + preyFood * 5.4 - predators * 3.2 - habitatStress * 2)) <= 3
    return { predatorFood, preySafety, starving }
  }
  function clampInt(min: number, max: number, value: number) {
    return Math.min(max, Math.max(min, value))
  }
  function predatorHuntStats(state: ReturnType<typeof computeEcosystemState>) {
    return {
      captureChance: Math.round(clamp01(0.16 + state.predatorFood * 0.7 - (state.starving ? 0.22 : 0)) * 100),
    }
  }
  function preySurvivalStats(state: ReturnType<typeof computeEcosystemState>) {
    return { safetyPct: Math.round(state.preySafety * 100) }
  }

  // Defaults from EcologyLab's own initial state.
  const defaultSunlight = 0.72
  const defaultPredators = 0.42
  const defaultDecomposers = 0.55
  const defaultHabitatStress = 0.18
  const habitatLossStress = 0.85 // the "Habitat loss" scenario's apply()

  const defaults = computeEcosystemState(defaultSunlight, defaultPredators, defaultDecomposers, defaultHabitatStress)
  const habitatLoss = computeEcosystemState(defaultSunlight, defaultPredators, defaultDecomposers, habitatLossStress)

  const defaultSafety = preySurvivalStats(defaults).safetyPct
  const habitatLossSafety = preySurvivalStats(habitatLoss).safetyPct
  assert.ok(
    habitatLossSafety < defaultSafety,
    `expected prey safety to drop under Habitat Loss via the canonical formula (defaults=${defaultSafety}, habitatLoss=${habitatLossSafety})`,
  )

  const defaultCapture = predatorHuntStats(defaults).captureChance
  const habitatLossCapture = predatorHuntStats(habitatLoss).captureChance
  assert.notStrictEqual(
    defaultCapture,
    habitatLossCapture,
    'expected capture chance to change under Habitat Loss via the canonical formula (it depends on predatorFood, which folds in habitatStress) — a local pressure-only formula would incorrectly hold this constant',
  )
})
