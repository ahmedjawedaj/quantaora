import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const routeSource = readFileSync(fileURLToPath(new URL('./CellLab.tsx', import.meta.url)), 'utf8')

test('Cell Biology P1 route contains kid-facing depth mission markers', () => {
  for (const marker of ['Mission:', 'Predict:', 'Change the view', 'Observe and explain', 'Inspect:', 'Explain']) {
    assert.ok(routeSource.includes(marker), `expected route source to include ${marker}`)
  }
  for (const structure of ['Cell membrane', 'Nucleus + DNA', 'Mitochondria', 'Chloroplast', 'Ribosome', 'Cell wall', 'Cytoplasm + organelles']) {
    assert.ok(routeSource.includes(structure), `expected route source to include ${structure}`)
  }
  for (const control of ['labelsVisible', 'xrayActive', 'isolateActive', 'animationPlaying']) {
    assert.match(routeSource, new RegExp(control))
  }
})
