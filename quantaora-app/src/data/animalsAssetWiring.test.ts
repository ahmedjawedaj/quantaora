import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { animals } from './animals.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const DEER_MODEL = '/models/sourced/biology-life/ecology/consumer-deer/deer-optimized.glb'
const FOX_MODEL = '/models/sourced/biology-life/ecology/predator-fox/fox-optimized.glb'
const FISH_MODEL = '/models/sourced/biology-animals/barramundi-fish-khronos.glb'

const EXPECTED_SOURCED_MODELS = new Map([
  ['biology-animals-vertebrate', FISH_MODEL],
  ['biology-animals-body-systems', DEER_MODEL],
  ['biology-animals-habitat-adaptation', DEER_MODEL],
  ['biology-animals-life-cycle', DEER_MODEL],
  ['biology-animals-behavior', FOX_MODEL],
])

test('Animals branch opens with sourced recognizable animal GLBs instead of symbolic placeholders', () => {
  for (const [id, model] of EXPECTED_SOURCED_MODELS) {
    const component = animals.find((entry) => entry.id === id)
    assert.ok(component, `expected Animals component ${id}`)
    assert.equal(component.model, model)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.match(
      resolution.asset.sourceName,
      model === FISH_MODEL ? /Khronos glTF Sample Assets/ : /Quaternius Ultimate Animated Animal Pack/,
    )
    assert.ok(
      existsSync(join(process.cwd(), 'public', model.replace(/^\//, ''))),
      `expected sourced Animals GLB file to exist for ${id}`,
    )
  }
})

test('Animals sourced realism upgrades remain support-tier, not falsely marked complete', () => {
  for (const component of animals) {
    const resolution = componentAssetResolution(component)
    assert.ok(resolution.asset, `expected registered asset for ${component.id}`)
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(
      resolution.asset.notes,
      /stylized\/low-poly|strong predator\/prey read|real animal body plan/,
      `expected honest support-tier quality note for ${component.id}`,
    )
  }
})
