import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 8 QA findings that traced several camera-framing/clipping bugs to a
// single, model-agnostic camera constant being reused for every entry in a route, instead of
// being computed (or overridden) per model:
//
// - docs/reviews/wave8-molecules.md: NaCl's lattice mesh is clipped on all 4 edges at both
//   viewports, uncorrectable via any in-app control, because ChemistryLab.tsx shares one fixed
//   camera-distance range (DEFAULT/MIN/MAX = 3.6/2/6) across every molecule -- fine for small
//   covalent molecules, far too tight for the larger NaCl lattice.
// - docs/reviews/wave8-orbit.md: Saturn's rings clip the mobile canvas edge because the Wave 6
//   camera-distance fix only accounted for the vertical FOV/frustum, not the narrower horizontal
//   frustum on portrait mobile aspect ratios.
// - docs/reviews/wave8-energy.md: the Multimeter example renders clipped against the mobile
//   canvas's left edge while Generator/Electric stove (same rig, same viewport) remain correctly
//   framed.
//
// These are light static/structural checks, not pixel-level rendering assertions -- full 3D
// rendering is out of scope for this project's test setup (plain node:test, no jsdom/WebGL; see
// ../routes/BranchLab.test.ts's own comment on why). Each check below asserts the *shape* of a
// fix (per-model computation/override present) rather than rendering the scene.
//
// Run with: node --test src/routes/perModelCameraConfig.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const chemistryLabSrc = readFileSync(srcPath('./ChemistryLab.tsx'), 'utf8')
const moleculesSrc = readFileSync(srcPath('../data/molecules.ts'), 'utf8')
const orbitSandboxSrc = readFileSync(srcPath('../components/explorer/OrbitSandbox.tsx'), 'utf8')
const energyLabSrc = readFileSync(srcPath('./EnergyLab.tsx'), 'utf8')

test('ChemistryLab/molecules: camera framing is no longer one fixed distance range shared by every molecule (Wave 8 NaCl clipping)', () => {
  // Accept either shape of a real per-molecule fix: (a) molecules.ts carries a per-molecule
  // camera/bounds/framing field the lab reads, or (b) ChemistryLab.tsx computes/looks up the
  // camera distance from the active molecule (a keyed record or a function taking the molecule
  // as input) rather than only ever using the bare DEFAULT_CAMERA_DISTANCE constant.
  const perMoleculeDataField = /camera(?:Distance|Bounds)|viewDistance|framingDistance|boundingRadius/i.test(moleculesSrc)
  const perMoleculeComputation =
    /function\s+\w*(?:[Cc]amera|[Ff]ram(?:e|ing))\w*\s*\([^)]*\w+[^)]*\)/.test(chemistryLabSrc) ||
    /(?:CAMERA|Camera)\w*_BY_(?:ID|MOLECULE)/.test(chemistryLabSrc)
  assert.ok(
    perMoleculeDataField || perMoleculeComputation,
    'expected molecules.ts to carry a per-molecule camera/bounds field, or ChemistryLab.tsx to compute camera distance per selected molecule, instead of only the shared DEFAULT/MIN/MAX_CAMERA_DISTANCE constants used identically for every molecule including NaCl',
  )
})

test('OrbitSandbox: default camera distance accounts for the horizontal (aspect-ratio-dependent) frustum, not only the vertical FOV (Wave 8 Saturn ring clipping on mobile)', () => {
  // The Wave 6 fix computed camera distance from vertical FOV only and claimed this was
  // "aspect-ratio independent" -- Wave 8 found that claim false on portrait mobile. A real fix
  // must factor the canvas aspect ratio into the distance computation somewhere.
  assert.match(
    orbitSandboxSrc,
    /aspect/i,
    'expected OrbitSandbox.tsx camera-distance logic to reference aspect ratio (horizontal frustum), not only a fixed vertical FOV, so ringed bodies are not clipped on narrower/portrait viewports',
  )
})

test('EnergyLab: Multimeter framing accounts for viewport/aspect so it is not clipped while Generator/Electric stove remain framed (Wave 8/9 P1)', () => {
  // The real fix does NOT put viewport/aspect logic inside MultimeterExample itself -- that
  // function still just renders the multimeter at a fixed local rig position. Instead, a
  // separate always-mounted helper (e.g. computeMultimeterFramingShiftX) computes an
  // aspect-dependent camera/target correction, and a sibling component reads the live canvas
  // size via useThree() and applies that correction every frame. So the guard here checks the
  // *file as a whole* for that shape: an aspect-aware framing function, actually invoked with a
  // useThree-sourced size/viewport value -- not just defined and unused, and not assumed to live
  // inside MultimeterExample.
  const framingFnMatch = energyLabSrc.match(
    /function\s+(\w*Multimeter\w*(?:Fram\w*|Shift\w*|Offset\w*))\s*\([^)]*aspect[^)]*\)/i,
  )
  assert.ok(
    framingFnMatch,
    'expected EnergyLab.tsx to define a multimeter framing helper (e.g. computeMultimeterFramingShiftX) that takes an aspect-ratio parameter, rather than relying on a single fixed-literal position shared across all viewports',
  )
  const fnName = framingFnMatch![1]

  assert.match(
    energyLabSrc,
    /useThree\s*\(\s*\(?\s*state\s*\)?\s*=>\s*state\.(?:size|viewport)/,
    'expected EnergyLab.tsx to source live canvas size/viewport via useThree() so the framing correction reacts to the real viewport, not a hardcoded assumption',
  )

  const callRegex = new RegExp(
    `${fnName}\\s*\\([^)]*(?:size\\.(?:width|height)|viewport\\.aspect)[^)]*\\)`,
  )
  assert.match(
    energyLabSrc,
    callRegex,
    `expected ${fnName} to actually be invoked with a useThree-sourced size/aspect value (e.g. size.width / size.height), not just defined and unused, since that live-viewport call is what fixed the Multimeter clipping on mobile while Generator/Electric stove (same rig) stayed correctly framed`,
  )
})
