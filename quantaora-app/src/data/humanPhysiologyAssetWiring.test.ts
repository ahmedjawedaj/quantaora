import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { physiologyProcesses } from './generated/human_physiology.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const EXPECTED_MODELS = new Map([
  ['blood-circulation', '/models/heart.glb'],
  ['breathing', '/models/lungs.glb'],
  ['digestion', '/models/intestine.glb'],
  ['hormone-signaling', '/models/biology/authored/bio-p1-hormone-signaling.glb'],
  ['immune-response', '/models/biology/authored/physiology-immune-response-defense.glb'],
  ['kidney-filtration', '/models/kidneys.glb'],
  ['muscle-contraction', '/models/biology/authored/physiology-muscle-contraction-muscle-cell.glb'],
  ['nerve-signaling', '/models/biology/authored/physiology-nerve-signaling-neuron.glb'],
  ['temperature-regulation', '/models/brain.glb'],
])

const PROTOTYPE_ORGAN_MODELS = new Set([
  '/models/heart.glb',
  '/models/lungs.glb',
  '/models/intestine.glb',
  '/models/kidneys.glb',
  '/models/brain.glb',
])

test('Human Physiology generic branch no longer points at unresolved authored placeholders', () => {
  for (const [id, model] of EXPECTED_MODELS) {
    const component = physiologyProcesses.find((entry) => entry.id === id)
    assert.ok(component, `expected Human Physiology component ${id}`)
    assert.equal(component.model, model)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    if (PROTOTYPE_ORGAN_MODELS.has(model)) {
      assert.equal(resolution.asset.branch, 'human-anatomy', `expected organ-quality prototype asset for ${id}`)
      assert.equal(resolution.asset.licenseStatus, 'REVIEW', `expected paid-launch review status to remain visible for ${id}`)
      assert.equal(resolution.asset.qualityTier, 'hero', `expected anatomy-quality visual tier for ${id}`)
    } else {
      assert.notEqual(resolution.asset.licenseStatus, 'REVIEW', `expected non-REVIEW asset for ${id}`)
    }
    assert.ok(existsSync(join(process.cwd(), 'public', model.replace(/^\//, ''))), `expected GLB file to exist for ${id}`)
  }
})
