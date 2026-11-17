import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { biochemistryFoundations } from './biochemistryFoundations.ts'
import { biochemistryLinks } from './biochemistryLinks.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const GLUCOSE_MODEL = '/models/sourced/chemistry-structure/glucose.glb'
const PROTEIN_MODEL = '/models/sourced/biochemistry-structure/hemoglobin-protein.glb'
const ENZYME_MODEL = '/models/sourced/biochemistry-structure/lysozyme-enzyme.glb'
const ATP_MODEL = '/models/sourced/biochemistry-structure/atp-cellular-energy.glb'
const LIPID_MODEL = '/models/sourced/biochemistry-structure/phospholipid-membrane.glb'

const RCSB_STRUCTURE_EXPECTATIONS = [
  {
    component: biochemistryFoundations.find((entry) => entry.id === 'biology-biochemistry-protein'),
    model: PROTEIN_MODEL,
    source: 'RCSB PDB 1HHO',
    note: /human deoxyhemoglobin backbone/,
  },
  {
    component: biochemistryFoundations.find((entry) => entry.id === 'biology-biochemistry-enzyme'),
    model: ENZYME_MODEL,
    source: 'RCSB PDB 1LYZ',
    note: /lysozyme enzyme backbone/,
  },
  {
    component: biochemistryLinks.find((entry) => entry.id === 'chem-biolink-protein-folding'),
    model: PROTEIN_MODEL,
    source: 'RCSB PDB 1HHO',
    note: /human deoxyhemoglobin backbone/,
  },
  {
    component: biochemistryLinks.find((entry) => entry.id === 'chem-biolink-enzyme-substrate'),
    model: ENZYME_MODEL,
    source: 'RCSB PDB 1LYZ',
    note: /lysozyme enzyme backbone/,
  },
  {
    component: biochemistryFoundations.find((entry) => entry.id === 'biology-biochemistry-atp-cellular-energy'),
    model: ATP_MODEL,
    source: 'RCSB PDB Chemical Component Dictionary - ATP',
    note: /adenosine triphosphate molecular geometry/,
  },
  {
    component: biochemistryFoundations.find((entry) => entry.id === 'biology-biochemistry-lipid'),
    model: LIPID_MODEL,
    source: 'RCSB PDB Chemical Component Dictionary - PEF',
    note: /dipalmitoyl phosphatidylethanolamine molecular geometry/,
  },
  {
    component: biochemistryLinks.find((entry) => entry.id === 'chem-biolink-lipid-membrane'),
    model: LIPID_MODEL,
    source: 'RCSB PDB Chemical Component Dictionary - PEF',
    note: /dipalmitoyl phosphatidylethanolamine molecular geometry/,
  },
]

test('Biochemistry carbohydrate lessons use the sourced glucose molecular structure', () => {
  const expected = [
    biochemistryFoundations.find((entry) => entry.id === 'biology-biochemistry-carbohydrate'),
    biochemistryLinks.find((entry) => entry.id === 'chem-biolink-carbohydrate'),
  ]

  for (const component of expected) {
    assert.ok(component, 'expected carbohydrate component to exist')
    assert.equal(component.model, GLUCOSE_MODEL)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${component.id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${component.id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset.sourceName, 'RCSB PDB Chemical Component Dictionary - GLC')
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(resolution.asset.notes, /one sugar unit/)
    assert.ok(
      existsSync(join(process.cwd(), 'public', GLUCOSE_MODEL.replace(/^\//, ''))),
      `expected sourced glucose GLB file to exist for ${component.id}`,
    )
  }
})

test('Biochemistry protein, enzyme, ATP, and lipid lessons use real RCSB-derived 3D structures', () => {
  for (const expected of RCSB_STRUCTURE_EXPECTATIONS) {
    assert.ok(expected.component, 'expected biochemistry component to exist')
    assert.equal(expected.component.model, expected.model)

    const resolution = componentAssetResolution(expected.component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${expected.component.id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${expected.component.id}`)
    assert.equal(resolution.asset.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset.sourceName, expected.source)
    assert.equal(resolution.asset.qualityTier, 'support')
    assert.match(resolution.asset.notes, expected.note)
    assert.ok(
      existsSync(join(process.cwd(), 'public', expected.model.replace(/^\//, ''))),
      `expected sourced RCSB GLB file to exist for ${expected.component.id}`,
    )
    assert.ok(
      existsSync(join(process.cwd(), 'public', expected.model.replace(/\.glb$/, '.license.json').replace(/^\//, ''))),
      `expected RCSB provenance sidecar for ${expected.component.id}`,
    )
  }
})
