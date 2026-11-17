import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the Wave 25 Chemistry P0 asset-integration task: the sourced water GLB
// (public/models/chemistry/molecules/water.glb) places both hydrogen atoms at identical X/Y and
// differs only in Z-depth (∓0.4268), so from the app's default camera (looking down the Z axis) an
// unrotated render would put one hydrogen exactly behind the other, fully occluded. Rather than
// leaving this real, chemically-accurate GLB unused, molecules.ts wires it in with a `modelRotation`
// correction (90° about X -- see MoleculeModel.tsx's GlbMolecule, which applies the rotation before
// measuring the bounding box/atom positions) that rotates the H-O-H bend into the camera-facing XY
// plane, matching the procedural fallback's own layout. This test locks in that the `water` entry
// keeps both `modelType: 'glb'` and a non-zero `modelRotation` together (the rotation is what makes
// the GLB safe to render -- dropping it while keeping modelType: 'glb' would reintroduce the
// occlusion bug), and that its `atoms` array still has the right composition/mapping (3 atoms: 2 H +
// 1 O, with oxygen visually distinguishable from hydrogen per the standard CPK convention).
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/data/molecules.test.ts

const MOLECULES_PATH = fileURLToPath(new URL('./molecules.ts', import.meta.url))
const src = readFileSync(MOLECULES_PATH, 'utf8')

function extractMoleculeBlock(id: string): string {
  const idIdx = src.indexOf(`id: '${id}',`)
  assert.ok(idIdx !== -1, `expected a molecule entry with id: '${id}' to still exist in molecules.ts`)
  // Each molecule object literal in this array is terminated by a `\n  },\n  {` (closing this
  // entry, opening the next) or, for the last entry, `\n  },\n]`. Slice from this entry's `id:`
  // line up to the next top-level `\n  {` (start of the following object) so we don't accidentally
  // pick up a later molecule's fields.
  const nextEntryIdx = src.indexOf('\n  {\n    id:', idIdx)
  return src.slice(idIdx, nextEntryIdx !== -1 ? nextEntryIdx : src.length)
}

test('molecules.ts: the water entry sets modelType: \'glb\' together with a modelRotation correction (never the GLB without the rotation that prevents hydrogen occlusion)', () => {
  const waterBlock = extractMoleculeBlock('water')
  const codeOnly = waterBlock
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
  assert.match(codeOnly, /modelType:\s*'glb'/, "expected the water molecule entry to set modelType: 'glb' -- the sourced water.glb is now wired in with a corrective rotation instead of left unused.")
  assert.match(
    codeOnly,
    /modelUrl:\s*'\/models\/chemistry\/molecules\/water\.glb'/,
    'expected the water molecule entry to point modelUrl at the sourced water.glb',
  )
  assert.match(
    codeOnly,
    /modelRotation:\s*\[[^\]]*Math\.PI[^\]]*\]/,
    "expected the water molecule entry to set a non-trivial modelRotation -- without it, the GLB's two hydrogens sit at identical X/Y and differ only in Z-depth, fully occluding one behind the other from the default camera.",
  )
})

for (const [id, url] of [
  ['carbon-dioxide', '/models/chemistry/molecules/carbon-dioxide.glb'],
  ['methane', '/models/chemistry/molecules/methane.glb'],
  ['sodium-chloride-lattice', '/models/chemistry/molecules/sodium-chloride-lattice.glb'],
] as const) {
  test(`molecules.ts: the ${id} entry stays wired to its sourced GLB (modelType: 'glb', modelUrl set)`, () => {
    const block = extractMoleculeBlock(id)
    const codeOnly = block
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .join('\n')
    assert.match(codeOnly, /modelType:\s*'glb'/, `expected the ${id} entry to keep modelType: 'glb'`)
    assert.match(
      codeOnly,
      new RegExp(`modelUrl:\\s*'${url.replace(/\//g, '\\/')}'`),
      `expected the ${id} entry's modelUrl to still point at ${url}`,
    )
  })
}

test('molecules.ts: the water entry\'s atoms array has exactly 3 entries -- 2 hydrogen + 1 oxygen', () => {
  const waterBlock = extractMoleculeBlock('water')
  const atomsMatch = waterBlock.match(/atoms:\s*\[([\s\S]*?)\],\n\s*bonds:/)
  assert.ok(atomsMatch, "expected the water entry to have an `atoms: [...]` array (terminated before `bonds:`)")
  const atomsBody = atomsMatch![1]

  const atomEntries = [...atomsBody.matchAll(/\{\s*id:\s*'([^']+)',\s*element:\s*'([HCNONaCl]+)'/g)]
  assert.equal(atomEntries.length, 3, `expected exactly 3 atoms in water's atoms array, found ${atomEntries.length}`)

  const elements = atomEntries.map((m) => m[2]).sort()
  assert.deepEqual(
    elements,
    ['H', 'H', 'O'],
    `expected water's atoms array to contain exactly 2 hydrogen (H) atoms and 1 oxygen (O) atom, got: ${JSON.stringify(elements)}`,
  )
})

test('molecules.ts: oxygen and hydrogen have distinct radius and color values (oxygen visually larger and differently colored, standard CPK convention)', () => {
  const radiusBlockMatch = src.match(/export const ELEMENT_RADIUS: Record<Atom\['element'\], number> = \{([\s\S]*?)\}/)
  assert.ok(radiusBlockMatch, 'expected an ELEMENT_RADIUS map to still exist in molecules.ts')
  const radiusBody = radiusBlockMatch![1]
  const hRadiusMatch = radiusBody.match(/H:\s*([\d.]+)/)
  const oRadiusMatch = radiusBody.match(/O:\s*([\d.]+)/)
  assert.ok(hRadiusMatch, 'expected ELEMENT_RADIUS.H to be defined')
  assert.ok(oRadiusMatch, 'expected ELEMENT_RADIUS.O to be defined')
  const hRadius = Number(hRadiusMatch![1])
  const oRadius = Number(oRadiusMatch![1])
  assert.ok(
    oRadius > hRadius,
    `expected ELEMENT_RADIUS.O (${oRadius}) to be larger than ELEMENT_RADIUS.H (${hRadius}) -- oxygen must render as the visually larger atom`,
  )

  const colorBlockMatch = src.match(/export const ELEMENT_COLOR: Record<Atom\['element'\], string> = \{([\s\S]*?)\}/)
  assert.ok(colorBlockMatch, 'expected an ELEMENT_COLOR map to still exist in molecules.ts')
  const colorBody = colorBlockMatch![1]
  const hColorMatch = colorBody.match(/H:\s*'(#[0-9a-fA-F]+)'/)
  const oColorMatch = colorBody.match(/O:\s*'(#[0-9a-fA-F]+)'/)
  assert.ok(hColorMatch, 'expected ELEMENT_COLOR.H to be defined')
  assert.ok(oColorMatch, 'expected ELEMENT_COLOR.O to be defined')
  assert.notEqual(
    hColorMatch![1].toLowerCase(),
    oColorMatch![1].toLowerCase(),
    `expected ELEMENT_COLOR.H (${hColorMatch![1]}) and ELEMENT_COLOR.O (${oColorMatch![1]}) to be distinct colors, so hydrogen and oxygen are visually distinguishable`,
  )
})
