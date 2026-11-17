import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { neuroscience } from './neuroscience.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const EXPECTED_MODELS = new Map([
  ['biology-neuroscience-neuron', '/models/cells/neuron-authored.glb'],
  ['biology-neuroscience-synapse', '/models/cells/neuron-authored.glb'],
  ['biology-neuroscience-reflex-arc', '/models/cells/neuron-authored.glb'],
  ['biology-neuroscience-brain-regions', '/models/brain.glb'],
  ['biology-neuroscience-senses-signals', '/models/eyeball.glb'],
])

test('Neuroscience branch uses stronger real/organ-quality assets where available', () => {
  for (const [id, model] of EXPECTED_MODELS) {
    const component = neuroscience.find((entry) => entry.id === id)
    assert.ok(component, `expected Neuroscience component ${id}`)
    assert.equal(component.model, model)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.ok(
      resolution.asset.licenseStatus === 'CLEAR' || resolution.asset.licenseStatus === 'REVIEW',
      `expected known license status for ${id}`,
    )
    assert.ok(existsSync(join(process.cwd(), 'public', model.replace(/^\//, ''))), `expected GLB file to exist for ${id}`)
  }
})

test('Neuroscience brain-region reuse keeps paid-launch review risk explicit', () => {
  const component = neuroscience.find((entry) => entry.id === 'biology-neuroscience-brain-regions')
  assert.ok(component, 'expected brain regions component')

  const resolution = componentAssetResolution(component)
  assert.ok(resolution.asset, 'expected brain asset metadata')
  assert.equal(resolution.asset.branch, 'human-anatomy')
  assert.equal(resolution.asset.licenseStatus, 'REVIEW')
  assert.equal(resolution.asset.replaceBeforePaidLaunch, true)
})

test('Neuroscience senses reuse keeps paid-launch review risk explicit', () => {
  const component = neuroscience.find((entry) => entry.id === 'biology-neuroscience-senses-signals')
  assert.ok(component, 'expected senses and signals component')

  const resolution = componentAssetResolution(component)
  assert.ok(resolution.asset, 'expected eyeball asset metadata')
  assert.equal(resolution.asset.branch, 'human-anatomy')
  assert.equal(resolution.asset.licenseStatus, 'REVIEW')
  assert.equal(resolution.asset.replaceBeforePaidLaunch, true)
})
