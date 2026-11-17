import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const src = (name: string) => readFileSync(fileURLToPath(new URL(name, import.meta.url)), 'utf8')
const solar = src('./SpaceLab.tsx')
const earth = src('./EarthInSpaceLab.tsx')

test('space motion depth: both labs expose kid-facing mission markers and cause/effect controls', () => {
  for (const marker of ['Observe', 'Predict', 'Change', 'Explain', 'Challenge']) {
    assert.ok(solar.includes(marker), `Solar System should show ${marker}`)
    assert.ok(earth.includes(`label="${marker}"`) || earth.includes(`>${marker}<`), `Earth In Space should show ${marker}`)
  }
  for (const phrase of ['rotation', 'revolution', 'speed', 'distance', 'gravity', 'year', 'day/night']) {
    assert.match(`${solar}\n${earth}`, new RegExp(phrase, 'i'), `expected motion depth marker: ${phrase}`)
  }
  assert.match(earth, /tilt to 0°|daylight bars|seasons/i)
  assert.match(solar, /farther out.*longer year|stronger gravity pull|distance changes the year/i)
})
