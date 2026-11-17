import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readRoute(name: string): string {
  return readFileSync(fileURLToPath(new URL(`./${name}`, import.meta.url)), 'utf8')
}

const plantsSrc = readRoute('PlantsLab.tsx')
const ecologySrc = readRoute('EcologyLab.tsx')
const geneticsSrc = readRoute('GeneticsLab.tsx')
const microbiologySrc = readRoute('MicrobiologyLab.tsx')

test('PlantsLab seed growth challenge names observe, predict, change, explain, and check around growing conditions', () => {
  const seedCase = plantsSrc.slice(plantsSrc.indexOf("case 'seed':"), plantsSrc.indexOf("case 'chloroplast':"))

  assert.match(seedCase, /Observe[\s\S]*water, warmth, and soil nutrients/)
  assert.match(seedCase, /Predict[\s\S]*drag water almost to zero/)
  assert.match(seedCase, /Change[\s\S]*Try: dry \+ cold[\s\S]*Try: well-watered/)
  assert.match(seedCase, /Explain[\s\S]*Water and warmth wake the embryo/)
  assert.match(seedCase, /Check[\s\S]*mature, flowering plant/)
})

test('EcologyLab challenge panel keeps predator-prey and decomposer lifecycle changes in a full observe-to-check sequence', () => {
  assert.match(ecologySrc, /id: 'predator-boom'[\s\S]*observe:[\s\S]*predict:[\s\S]*changeLabel:[\s\S]*Raise predator pressure to 90%[\s\S]*explain:[\s\S]*question:/)
  assert.match(ecologySrc, /id: 'no-decomposers'[\s\S]*observe:[\s\S]*predict:[\s\S]*changeLabel:[\s\S]*Drop decomposers to 5%[\s\S]*explain:[\s\S]*question:/)
  assert.match(ecologySrc, /const SCENARIO_STEP_LABELS = \['1\. Observe', '2\. Predict', '3\. Change', '4\. Explain', '5\. Check'\]/)
})

test('GeneticsLab mutation tuning surfaces prediction-change-observe-explain copy next to mutation controls', () => {
  assert.match(geneticsSrc, /mutationEffectLabel=\{effect\.label\}/)
  assert.match(geneticsSrc, /Observe: base \{mutationIndex \+ 1\} now makes a \{mutationEffectLabel\} effect/)
  assert.match(geneticsSrc, /Predict, change, observe, explain:[\s\S]*Effect meter update/)
  assert.match(geneticsSrc, /Check: insertion or deletion should change every codon after the changed spot/)
})

test('MicrobiologyLab keeps bacteria and virus guided cycle challenges open while step controls are visible', () => {
  assert.match(microbiologySrc, /const stageDriven = activeId === 'bacteria' \|\| activeId === 'virus'/)
  assert.match(microbiologySrc, /<details open=\{stageDriven\}[\s\S]*Guided challenge · Observe → Predict → Change → Explain → Check/)
  assert.match(microbiologySrc, /Step \{activeId === 'bacteria' \? 'division' : 'infection'\} stage/)
})
