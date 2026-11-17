import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cells } from './cells.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const GENERATED_CELL_BIOLOGY_PATH = fileURLToPath(new URL('./generated/cell_biology.ts', import.meta.url))
const MODEL_REGISTRY_PATH = fileURLToPath(new URL('./modelRegistry.ts', import.meta.url))

const cellBiologySource = readFileSync(GENERATED_CELL_BIOLOGY_PATH, 'utf8')
const registrySource = readFileSync(MODEL_REGISTRY_PATH, 'utf8')

function extractGeneratedComponentBlock(id: string): string {
  const idIdx = cellBiologySource.indexOf(`"id": "${id}"`)
  assert.ok(idIdx !== -1, `expected generated Cell Biology component "${id}" to exist`)
  const nextEntryIdx = cellBiologySource.indexOf('\n  {\n    "id":', idIdx + 1)
  return cellBiologySource.slice(idIdx, nextEntryIdx === -1 ? cellBiologySource.length : nextEntryIdx)
}

test('Cell Biology DNA is wired to the reviewed B-DNA GLB instead of the placeholder authored path', () => {
  const dnaBlock = extractGeneratedComponentBlock('dna')

  assert.match(
    dnaBlock,
    /"model": "\/models\/biology\/genetics\/dna-b-form-double-helix-nih\.glb"/,
    'expected Cell Biology DNA to use the reviewed PASS B-DNA GLB from the asset registry',
  )
  assert.doesNotMatch(
    dnaBlock,
    /\/assets\/models\/biology\/cell-biology\/dna\/dna\.glb/,
    'expected Cell Biology DNA not to fall back to the old placeholder authored path',
  )
})

test('B-DNA GLB remains registered with attribution metadata for release review', () => {
  const assetIdx = registrySource.indexOf("url: '/models/biology/genetics/dna-b-form-double-helix-nih.glb'")
  assert.ok(assetIdx !== -1, 'expected B-DNA GLB to stay present in the model registry')

  const assetBlock = registrySource.slice(assetIdx, registrySource.indexOf('\n  },', assetIdx))
  assert.match(assetBlock, /license:\s*'CC-BY 4\.0'/, 'expected B-DNA registry row to keep its CC-BY 4.0 license')
  assert.match(assetBlock, /licenseStatus:\s*'ATTRIB'/, 'expected B-DNA registry row to keep attribution-required release status')
  assert.match(assetBlock, /PASS in biology-cell-visual\.md review/, 'expected B-DNA registry row to remain PASS-reviewed')
})

test('remaining Cell Biology specialized cells load authored P0 GLBs through the cell lab', () => {
  const expectedIds = new Set(['plant-cell', 'bacterial-cell', 'red-blood-cell', 'muscle-cell', 'sperm-cell', 'egg-cell'])

  for (const cell of cells.filter((candidate) => expectedIds.has(candidate.id))) {
    assert.equal(cell.modelType, 'glb', `expected ${cell.id} to load a GLB`)
    assert.equal(cell.modelUrl, `/models/biology/authored/${cell.id}.glb`, `expected authored biology model URL for ${cell.id}`)
    const resolution = componentAssetResolution({ ...cell, model: cell.modelUrl })
    assert.equal(resolution.status, 'ready', `expected registered asset for ${cell.id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${cell.id}`)
    assert.notEqual(resolution.asset.licenseStatus, 'REVIEW', `expected cleared asset for ${cell.id}`)
    assert.ok(existsSync(join(process.cwd(), 'public', resolution.asset.url.replace(/^\//, ''))), `expected GLB file to exist for ${cell.id}`)
  }
})

test('Cell Biology low-level generated branch uses existing sourced realism assets where they fit', () => {
  const expected = [
    {
      id: 'bacterial-cell',
      model: '/models/sourced/biology-cell/bacteria-ecoli-whole-cell-nih.glb',
      license: /licenseStatus:\s*'CLEAR'/,
    },
    {
      id: 'cell-wall',
      model: '/models/cells/bacteria-wall-nih.glb',
      license: /licenseStatus:\s*'CLEAR'/,
    },
    {
      id: 'golgi-apparatus',
      model: '/models/sourced/biology-cell/organelle-golgi-apparatus-nih.glb',
      license: /licenseStatus:\s*'CLEAR'/,
    },
    {
      id: 'ribosome',
      model: '/models/sourced/biology-cell/organelle-ribosome-80s-bychain-nih-optimized.glb',
      license: /licenseStatus:\s*'ATTRIB'/,
    },
  ]

  for (const { id, model, license } of expected) {
    const block = extractGeneratedComponentBlock(id)
    assert.ok(block.includes(`"model": "${model}"`), `expected ${id} to use ${model}`)

    const resolution = componentAssetResolution({ ...cells[0], id, model })
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.match(registrySource.slice(registrySource.indexOf(`url: '${model}'`), registrySource.indexOf('\n  },', registrySource.indexOf(`url: '${model}'`))), license)
    assert.ok(existsSync(join(process.cwd(), 'public', model.replace(/^\//, ''))), `expected GLB file to exist for ${id}`)
  }
})
