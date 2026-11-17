import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const source = readFileSync(fileURLToPath(new URL('./EcologyLab.tsx', import.meta.url)), 'utf8')

test('Ecology P1 exposes kid-facing mission markers for the full concept ladder and causal changes', () => {
  for (const marker of [
    'organism', 'population', 'community', 'ecosystem', 'habitat', 'niche',
    'producer', 'consumer', 'decomposer', 'predator', 'prey',
    'sunlight', 'predator pressure', 'decomposer activity', 'habitat stress',
    'water', 'shelter', 'energy flows',
  ]) {
    assert.match(source, new RegExp(marker, 'i'), `expected visible mission/challenge marker: ${marker}`)
  }

  for (const step of ['observe', 'predict', 'change', 'explain']) {
    assert.match(source, new RegExp(`Mission:[\\s\\S]*${step}`, 'i'), `expected mission step: ${step}`)
  }
  assert.match(source, /const ECOLOGY_MISSIONS = \[/)
  assert.match(source, /ECOLOGY_MISSIONS\.map\(/)
  const missionBlock = source.slice(source.indexOf('const ECOLOGY_MISSIONS = ['), source.indexOf('type EcoSetters'))
  assert.doesNotMatch(missionBlock, /coming soon|placeholder/i)
})
