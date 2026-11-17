import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./PlantsLab.tsx', import.meta.url)), 'utf8')

test('PlantsLab P1: kid-facing missions and change controls cover the plant systems', () => {
  for (const marker of ['Observe', 'Predict', 'Change', 'Explain']) {
    assert.match(source, new RegExp(`label: '${marker}'`), `missing ${marker} mission marker`)
  }
  for (const topic of ['seed', 'chloroplast', 'flower', 'leaf', 'stomata', 'xylem', 'phloem', 'root', 'stem']) {
    assert.match(source, new RegExp(`case '${topic}'`), `missing ${topic} challenge`)
  }
  for (const control of [
    'germination', 'Light intensity', 'CO₂ level', 'Soil water', 'Bee visits (pollinate)',
    'Water in guard cells', 'Root water uptake', 'Peel the soil away', 'cross-section',
    'pollen path', 'xylem', 'phloem',
  ]) {
    assert.match(source, new RegExp(control.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing visible control marker: ${control}`)
  }
  assert.doesNotMatch(source, /coming soon|placeholder/i)
})
