import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { evolution } from './evolution.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const SPECIMEN_MODEL = '/models/biology/authored/evolution-fossil-specimen-suite.glb'
const SKULL_MODEL = '/models/sourced/biology-evolution/scattering-skull-khronos.glb'

const SPECIMEN_COMPONENTS = [
  'biology-evolution-common-ancestry',
  'biology-evolution-adaptation',
]

test('Evolution ancestry and adaptation topics use the authored fossil specimen suite', () => {
  for (const id of SPECIMEN_COMPONENTS) {
    const component = evolution.find((entry) => entry.id === id)
    assert.ok(component, `expected Evolution component ${id}`)
    assert.equal(component.model, SPECIMEN_MODEL)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset.sourceName, 'Quantaora authored GLB')
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(resolution.asset.notes, /Smithsonian CC0 fossil\/specimen photogrammetry remains queued/)
  }
})

test('Evolution fossil evidence uses a sourced skull specimen GLB', () => {
  const component = evolution.find((entry) => entry.id === 'biology-evolution-fossil-evidence')
  assert.ok(component, 'expected Evolution fossil evidence component')
  assert.equal(component.model, SKULL_MODEL)

  const resolution = componentAssetResolution(component)
  assert.equal(resolution.status, 'ready')
  assert.ok(resolution.asset, 'expected skull asset metadata')
  assert.equal(resolution.asset.licenseStatus, 'CLEAR')
  assert.equal(resolution.asset.sourceName, 'Khronos glTF Sample Assets')
  assert.equal(resolution.asset.qualityTier, 'support')
  assert.match(resolution.asset.notes, /realistic bone-structure anchor/)
  assert.ok(existsSync(join(process.cwd(), 'public', SKULL_MODEL.replace(/^\//, ''))))
  assert.ok(existsSync(join(process.cwd(), 'public', SKULL_MODEL.replace(/\.glb$/, '.license.json').replace(/^\//, ''))))
})

test('Evolution specimen suite has a GLB file and provenance sidecar', () => {
  assert.ok(
    existsSync(join(process.cwd(), 'public', SPECIMEN_MODEL.replace(/^\//, ''))),
    'expected generated Evolution specimen GLB to exist',
  )
  assert.ok(
    existsSync(join(process.cwd(), 'public', SPECIMEN_MODEL.replace(/\.glb$/, '.license.json').replace(/^\//, ''))),
    'expected generated Evolution specimen provenance sidecar to exist',
  )
})

test('Evolution population mechanics keep their own cause/effect models', () => {
  for (const id of ['biology-evolution-variation', 'biology-evolution-natural-selection']) {
    const component = evolution.find((entry) => entry.id === id)
    assert.ok(component, `expected Evolution component ${id}`)
    assert.equal(component.model, `/models/biology/authored/${id}.glb`)
  }
})
