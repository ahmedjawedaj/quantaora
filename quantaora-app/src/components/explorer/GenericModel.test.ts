import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'

const src = readFileSync(fileURLToPath(new URL('./GenericModel.tsx', import.meta.url)), 'utf8')

test('procedural BranchLab scenes expose real Play/Pause motion', () => {
  assert.match(src, /function ProceduralScene\(/)
  assert.match(src, /animationPlaying\?\s*:\s*boolean/)
  assert.match(src, /useFrame\(\(\{\s*clock\s*\},\s*delta\)\s*=>/)
  assert.match(src, /group\.rotation\.y\s*\+=\s*delta\s*\*\s*0\.14/)
  assert.match(src, /animationPlaying\s*\?\s*Math\.sin\(clock\.elapsedTime/)
  assert.match(src, /onAnimationAvailability\?\.\(true\)/)
})

test('sourced Animals GLBs have explicit presentation fit rules', () => {
  assert.match(src, /biology-life\/ecology\/consumer-deer/)
  assert.match(src, /biology-life\/ecology\/predator-fox/)
  assert.match(src, /biology-animals\/mosquito-in-amber-khronos/)
  assert.match(src, /biology-animals\/barramundi-fish-khronos/)
  assert.match(src, /biology-animals\/fox-khronos/)
  assert.match(src, /fitSize:\s*3\.15/)
  assert.match(src, /fitSize:\s*1\.85/)
  assert.match(src, /fitSize:\s*3\.2/)
  assert.match(src, /fitSize:\s*2\.75/)
  assert.match(src, /rotation:\s*new THREE\.Euler\(0,\s*Math\.PI \/ 2,\s*0\)/)
})

test('sourced Evolution skull GLB has an explicit presentation fit rule', () => {
  assert.match(src, /biology-evolution\/scattering-skull-khronos/)
  assert.match(src, /fitSize:\s*2\.9/)
  assert.match(src, /new THREE\.Vector3\(-0\.72,\s*0\.02,\s*0\)/)
})

test('authored Evolution specimen suite has an explicit presentation fit rule', () => {
  assert.match(src, /evolution-fossil-specimen-suite/)
  assert.match(src, /fitSize:\s*2\.85/)
  assert.match(src, /new THREE\.Vector3\(0\.1,\s*-0\.05,\s*0\)/)
})

test('sourced Fluids measuring cup has an explicit presentation fit rule', () => {
  assert.match(src, /math-wave2\/measuring-cup-milkandbanana/)
  assert.match(src, /fitSize:\s*2\.2/)
  assert.match(src, /new THREE\.Vector3\(-0\.35,\s*-0\.02,\s*0\)/)
})

test('sourced Cell Biology GLBs have explicit presentation fit rules', () => {
  assert.match(src, /biology-cell\/bacteria-ecoli-whole-cell/)
  assert.match(src, /biology-cell\/organelle-golgi-apparatus/)
  assert.match(src, /cells\/neuron-authored/)
  assert.match(src, /fitSize:\s*2\.0/)
  assert.match(src, /fitSize:\s*2\.25/)
  assert.match(src, /fitSize:\s*3\.1/)
  assert.match(src, /function sourcedCellMaterialTone/)
  assert.match(src, /THREE\.DoubleSide/)
})

test('NIH influenza health assets have mobile-safe presentation fit rules', () => {
  assert.match(src, /biology-gaps-wave2\/virus-influenza/)
  assert.match(src, /fitSize:\s*2\.15/)
  assert.match(src, /new THREE\.Vector3\(0\.02,\s*-0\.02,\s*0\)/)
})

test('sourced glucose GLB has an explicit presentation fit rule', () => {
  assert.match(src, /chemistry-structure\/glucose/)
  assert.match(src, /fitSize:\s*2\.85/)
  assert.match(src, /new THREE\.Vector3\(-0\.85,\s*0,\s*0\)/)
})

test('real RCSB biochemistry GLBs have explicit presentation fit rules', () => {
  assert.match(src, /biochemistry-structure/)
  assert.match(src, /atp-cellular-energy/)
  assert.match(src, /phospholipid-membrane/)
  assert.match(src, /fitSize:\s*2\.75/)
  assert.match(src, /fitSize:\s*3\.55/)
  assert.match(src, /new THREE\.Vector3\(-0\.85,\s*0\.02,\s*0\)/)
  assert.match(src, /new THREE\.Vector3\(-0\.65,\s*0\.02,\s*0\)/)
})

test('Sound and Fluids authored hero GLBs have explicit presentation fit rules', () => {
  assert.match(src, /physics\/authored\/physics-sound-/)
  assert.match(src, /physics\/authored\/physics-fluids-/)
  assert.match(src, /physics-sound-apparatus-suite/)
  assert.match(src, /physics-fluids-apparatus-suite/)
  assert.match(src, /fitSize:\s*3\.1/)
  assert.match(src, /fitSize:\s*3\.0/)
  assert.match(src, /fitSize:\s*3\.65/)
  assert.match(src, /fitSize:\s*3\.45/)
})

test('sourced Sound speaker GLB has an explicit presentation fit rule', () => {
  assert.match(src, /physics-sound\/boombox-speaker-khronos/)
  assert.match(src, /fitSize:\s*3\.0/)
  assert.match(src, /new THREE\.Vector3\(-0\.58,\s*-0\.02,\s*0\)/)
})

test('prototype organ and sense reuses have explicit presentation fit rules outside anatomy', () => {
  for (const model of ['heart', 'lungs', 'intestine', 'kidneys', 'brain', 'eyeball']) {
    assert.ok(src.includes(`/models/${model}.glb`), `expected fit rule for ${model}.glb`)
  }
  assert.match(src, /fitSize:\s*3\.1/)
  assert.match(src, /fitSize:\s*2\.75/)
  assert.match(src, /new THREE\.Vector3\(-0\.8,\s*0\.02,\s*0\)/)
})
