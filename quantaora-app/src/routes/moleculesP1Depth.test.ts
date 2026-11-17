import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./ChemistryLab.tsx', import.meta.url)), 'utf8')

test('molecules route exposes the P1 predict/change/observe/explain depth markers', () => {
  assert.match(source, /function GuidedChallenge\(\{ moleculeName, formula, atomCount, bondCount, bondType/)
  for (const marker of ['Predict:', 'Change:', 'Observe:', 'Explain:']) assert.match(source, new RegExp(marker))
  for (const concept of ['atom count', 'bond count', 'bondType', 'shape', 'polarity', 'electrical attraction', 'Compare all 3 lattices']) {
    assert.match(source, new RegExp(concept, 'i'), `expected visible depth marker for ${concept}`)
  }
  assert.match(source, /<CrystalChallenge[\s\S]*onOpenCompare=\{\(\) => setLatticeCompareOpen\(true\)\}/)
})
