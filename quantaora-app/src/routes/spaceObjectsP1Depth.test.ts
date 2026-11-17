import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

const read = (name: string) => readFileSync(new URL(name, import.meta.url), 'utf8')

test('keeps star missions visibly authored around lifecycle and physics', () => {
    const source = read('StarsLab.tsx')
    for (const marker of ['Observe', 'Predict', 'Change', 'Explain', 'Lifecycle stage', 'temperatureK']) {
      assert.ok(source.includes(marker), marker)
    }
    assert.match(read('../data/stars.ts'), /fusion/i)
})

test('keeps galaxy missions visibly authored around structure experiments', () => {
    const source = read('GalaxyLab.tsx')
    for (const marker of ['Observe:', 'Predict:', 'Change:', 'Explain:', 'Challenge:', 'Spiral arms', 'Winding (spin)', 'Star density', 'differential', 'compareTarget']) {
      assert.ok(source.includes(marker), marker)
    }
})
