import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./MathLab.tsx', import.meta.url)), 'utf8')

test('MathLab exposes kid-facing algebra predict/change/observe/explain missions', () => {
  assert.match(source, /data-algebra-mission/)
  assert.match(source, /data-algebra-challenge/)
  for (const concept of ['Variable', 'Expression', 'Equation', 'Slope', 'Intercept', 'Like terms \/ constant \/ coefficient']) {
    assert.match(source, new RegExp(concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  for (const action of ['predict', 'change', 'observe', 'explain']) {
    assert.match(source, new RegExp(action))
  }
  assert.match(source, /formatNum\(focusX\)/)
  assert.match(source, /equation\(slope, intercept\)/)
})
