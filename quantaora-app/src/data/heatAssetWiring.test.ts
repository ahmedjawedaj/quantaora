import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { heatAndThermodynamics } from './heatAndThermodynamics.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const STOVE_MODEL = '/models/sourced/physics-energy-wave2/electric-stove.glb'
const FLASK_MODEL = '/models/sourced/physics-energy-wave2/insulated-flask.glb'
const HEATER_MODEL = '/models/sourced/physics-energy-wave2/masonry-heater.glb'

const EXPECTED_HEAT_MODELS = new Map([
  ['physics-heat-temperature', FLASK_MODEL],
  ['physics-heat-conduction', STOVE_MODEL],
  ['physics-heat-convection', STOVE_MODEL],
  ['physics-heat-radiation', HEATER_MODEL],
  ['physics-heat-phase-change', STOVE_MODEL],
])

test('Heat And Thermodynamics uses sourced real apparatus GLBs for every component', () => {
  for (const [id, model] of EXPECTED_HEAT_MODELS) {
    const component = heatAndThermodynamics.find((entry) => entry.id === id)
    assert.ok(component, `expected Heat component ${id}`)
    assert.equal(component.model, model)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered sourced asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.match(resolution.asset.sourceName, /Poly Haven/)
    assert.ok(
      existsSync(join(process.cwd(), 'public', model.replace(/^\//, ''))),
      `expected sourced Heat GLB file to exist for ${id}`,
    )
  }
})
