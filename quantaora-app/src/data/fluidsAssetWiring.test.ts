import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { fluids } from './fluids.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const FLUIDS_APPARATUS_MODEL = '/models/physics/authored/physics-fluids-apparatus-suite.glb'

const EXPECTED_FLUIDS_COMPONENTS = [
  'physics-fluids-pressure',
  'physics-fluids-buoyancy',
  'physics-fluids-density',
  'physics-fluids-flow-viscosity',
]

test('Fluids branch uses the richer apparatus-suite GLB for every component', () => {
  for (const id of EXPECTED_FLUIDS_COMPONENTS) {
    const component = fluids.find((entry) => entry.id === id)
    assert.ok(component, `expected Fluids component ${id}`)
    assert.equal(component.model, FLUIDS_APPARATUS_MODEL)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset.sourceName, 'Quantaora authored GLB')
    assert.ok(
      existsSync(join(process.cwd(), 'public', FLUIDS_APPARATUS_MODEL.replace(/^\//, ''))),
      `expected sourced Fluids GLB file to exist for ${id}`,
    )
    assert.ok(
      existsSync(join(process.cwd(), 'public', FLUIDS_APPARATUS_MODEL.replace(/\.glb$/, '.license.json').replace(/^\//, ''))),
      `expected provenance sidecar for ${id}`,
    )
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(resolution.asset.notes, /clear pressure tank, water column, gauges/)
  }
})
