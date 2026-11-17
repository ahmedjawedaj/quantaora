import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

const chemistryLabSrc = readSrc('./ChemistryLab.tsx')
const reactionsLabSrc = readSrc('./ChemicalReactionsLab.tsx')

test('ChemistryLab crystal branch has an explicit predict/change/observe/explain challenge tied to switching lattices', () => {
  assert.match(chemistryLabSrc, /function CrystalChallenge/)
  assert.match(chemistryLabSrc, /type CrystalPrediction = 'three-bond-sheet' \| 'four-bond-network'/)
  assert.match(chemistryLabSrc, /Predict:/)
  assert.match(chemistryLabSrc, /Change:/)
  assert.match(chemistryLabSrc, /Observe:/)
  assert.match(chemistryLabSrc, /Explain:/)
  assert.match(chemistryLabSrc, /Switch to \{targetCrystal\.name\}/)
  assert.match(chemistryLabSrc, /onOpenCompare=\{\(\) => setLatticeCompareOpen\(true\)\}/)
})

test('ChemistryLab resets crystal predictions when the learner changes lattice', () => {
  const selectCrystalMatch = chemistryLabSrc.match(/const selectCrystal = \(id: string\) => \{[\s\S]{0,900}?\n  \}/)
  assert.ok(selectCrystalMatch, 'expected selectCrystal implementation')
  assert.match(selectCrystalMatch![0], /setCrystalPrediction\(null\)/)
  assert.match(selectCrystalMatch![0], /setCrystalPredictionChecked\(false\)/)
})

test('ChemicalReactionsLab uses the real chemistry burner asset and makes heating variables visible in the apparatus', () => {
  assert.match(reactionsLabSrc, /BUNSEN_BURNER_MODEL_URL = '\/models\/chemistry\/chemical-reactions\/bunsen-burner\.glb'/)
  assert.match(reactionsLabSrc, /heatMode=\{controls\.heatMode\}/)
  assert.match(reactionsLabSrc, /temperature=\{controls\.temperature\}/)
  assert.match(reactionsLabSrc, /const temperatureBoost = temperature \/ 100/)
  assert.match(reactionsLabSrc, /heatMode === 'endo'[\s\S]{0,140}?0\.55 \+ temperatureBoost \* 0\.85/)
  assert.match(reactionsLabSrc, /const flameHeight = thermalActive/)
})

test('ChemicalReactionsLab tuning panel keeps prediction, change, observe, and explain visible together', () => {
  assert.match(reactionsLabSrc, /function apparatusObservation/)
  assert.match(reactionsLabSrc, /function missionSpec/)
  assert.match(reactionsLabSrc, /function predictionSpec/)
  assert.match(reactionsLabSrc, /Predict, then check/)
  assert.match(reactionsLabSrc, /Mission: Balance coefficients/)
  assert.match(reactionsLabSrc, /Change:<\/span> \{mission\.change\}/)
  assert.match(reactionsLabSrc, /Observe:<\/span> \{mission\.observe\.replace/)
  assert.match(reactionsLabSrc, /Explain:<\/span> \{mission\.explain\.replace/)
  assert.match(reactionsLabSrc, /temperature and catalyst change rate, not atom conservation/)
})
