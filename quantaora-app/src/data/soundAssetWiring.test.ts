import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { sound } from './sound.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const SOUND_APPARATUS_MODEL = '/models/physics/authored/physics-sound-apparatus-suite.glb'
const BOOMBOX_SPEAKER_MODEL = '/models/sourced/physics-sound/boombox-speaker-khronos.glb'

const EXPECTED_SOUND_COMPONENTS = [
  'physics-sound-vibration',
  'physics-sound-pitch',
  'physics-sound-volume',
  'physics-sound-medium',
  'physics-sound-echo',
]

test('Sound branch uses sourced or apparatus-suite GLBs for every component', () => {
  for (const id of EXPECTED_SOUND_COMPONENTS) {
    const component = sound.find((entry) => entry.id === id)
    assert.ok(component, `expected Sound component ${id}`)
    const expectedModel = id === 'physics-sound-volume' ? BOOMBOX_SPEAKER_MODEL : SOUND_APPARATUS_MODEL
    assert.equal(component.model, expectedModel)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(resolution.asset.notes, id === 'physics-sound-volume' ? /recognizable physical speaker/ : /tuning fork, speaker driver/)
    assert.ok(existsSync(join(process.cwd(), 'public', expectedModel.replace(/^\//, ''))), `expected GLB file for ${id}`)
    assert.ok(
      existsSync(join(process.cwd(), 'public', expectedModel.replace(/\.glb$/, '.license.json').replace(/^\//, ''))),
      `expected provenance sidecar for ${id}`,
    )
  }
})
