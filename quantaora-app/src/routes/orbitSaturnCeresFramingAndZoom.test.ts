import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Orbit task (docs/reviews/wave14-COMBINED.md P1 #5): "Saturn
// clipped by the left canvas edge on mobile (persistent, not a frame glitch); Ceres clipped at
// desktop+mobile (its dedicated close-focus camera doesn't keep it in frame); 'Zoom In' toolbar
// button is inert for Saturn and Neptune (no cause/effect feedback)."
//
// This is distinct from -- and layered on top of -- the already-passing ./orbitZoomFloor.test.ts
// and ./orbitPostSelectionFit.test.ts guards from earlier waves (Saturn's *ring-safety floor* and
// *live-selection-aware* fit machinery already exist; this file targets the two remaining concrete
// gaps found reading OrbitSandbox.tsx/SpaceLab.tsx at the start of this wave):
//
//  1. CameraFit's per-frame `computeRequired()` only calls `considerBody(selectedBody)` (the
//     live-position-aware fit) when `!selectedBody.hasRings` -- i.e. it explicitly EXCLUDES Saturn
//     (the one ringed body) from ever having its own live selected-position considered, falling
//     back entirely to the static, angle-independent `computeRequiredCameraDistance(aspect)` worst
//     case instead. That static worst case was derived once for the ORIGINAL fixed camera framing;
//     a persistent (not flickering) mobile-only edge clip is consistent with that static formula
//     alone not actually being sufficient for Saturn specifically once it's the live selection.
//  2. SpaceLab.tsx's `zoomInFloor` for any non-close-focus body (every body except Ceres, including
//     Saturn AND Neptune) is exactly `DEFAULT_CAMERA_DISTANCE` -- the SAME value `cameraDistance`
//     starts at (`useState(DEFAULT_CAMERA_DISTANCE)`) and gets reset to by Fit View/Reset. Since
//     `zoomInDisabled={cameraDistance <= zoomInFloor}`, Zoom In is disabled/inert from the very
//     first click on a fresh or reset selection for exactly the bodies whose framing genuinely
//     needs Saturn's ring-safety floor (i.e. every body except Ceres) -- there is no headroom
//     between the starting distance and the point Zoom In refuses to go past.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why). Expected to
// be RED until this wave's Orbit sibling fix lands -- that's correct, not a bug in this test (see
// ./mobileSwitcherAffordance.test.ts for the established precedent of writing a test correct and
// letting it stay red until the owning fix lands).
//
// Run with: node --test src/routes/orbitSaturnCeresFramingAndZoom.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const orbitSandboxSrc = readFileSync(srcPath('../components/explorer/OrbitSandbox.tsx'), 'utf8')
const spaceLabSrc = readFileSync(srcPath('./SpaceLab.tsx'), 'utf8')

test('OrbitSandbox: the selected body\'s own live-position fit (considerBody) is not unconditionally skipped for ringed bodies (Saturn)', () => {
  const guardMatch = orbitSandboxSrc.match(/if \(([^)]*)\)\s*considerBody\(selectedBody\)/)
  // Accept either shape: no explicit exclusion at all (bare `if (selectedBody) considerBody(...)`),
  // or a guard that still calls considerBody for Saturn (e.g. gated on something other than
  // `!selectedBody.hasRings`, or the ring case handled via a separate ring-aware call site).
  if (guardMatch) {
    assert.doesNotMatch(
      guardMatch[1],
      /!\s*selectedBody\.hasRings/,
      'expected the guard around considerBody(selectedBody) to no longer unconditionally exclude ringed bodies (`!selectedBody.hasRings`) -- Saturn, the one ringed body, needs its own live selected-position considered too, not only the static angle-independent ring-safety floor, for the persistent mobile edge-clip to be fixed',
    )
  } else {
    // No guard at all around the considerBody(selectedBody) call site -- i.e. it now runs for every
    // selected body unconditionally, which also satisfies this test's intent.
    assert.match(
      orbitSandboxSrc,
      /considerBody\(selectedBody\)/,
      'expected a considerBody(selectedBody) call site to still exist in OrbitSandbox.tsx',
    )
  }
})

test('SpaceLab: Zoom In has real headroom for a fresh/reset selection of a non-close-focus body (Saturn, Neptune, and every other body except Ceres), not disabled from the first click', () => {
  const zoomInFloorMatch = spaceLabSrc.match(/const zoomInFloor = CLOSE_FOCUS_BODY_IDS\.has\(selectedId\) \? MIN_CAMERA_DISTANCE : (\w+)/)
  assert.ok(zoomInFloorMatch, 'expected SpaceLab.tsx to still define zoomInFloor as a ternary keyed on CLOSE_FOCUS_BODY_IDS.has(selectedId)')
  const nonCloseFocusFloorExpr = zoomInFloorMatch![1]

  const initialDistanceMatch = spaceLabSrc.match(/useState\((\w+)\)\s*\n?\s*const \[labelsVisible/) ?? spaceLabSrc.match(/const \[cameraDistance, setCameraDistance\] = useState\((\w+)\)/)
  assert.ok(initialDistanceMatch, 'expected to find the cameraDistance useState\'s initial value expression')
  const initialDistanceExpr = initialDistanceMatch![1]

  assert.notEqual(
    nonCloseFocusFloorExpr,
    initialDistanceExpr,
    `expected the non-close-focus zoomInFloor expression ("${nonCloseFocusFloorExpr}") to differ from cameraDistance's starting/reset value ("${initialDistanceExpr}") -- today both are literally DEFAULT_CAMERA_DISTANCE, which means zoomInDisabled={cameraDistance <= zoomInFloor} is already true the moment a body is selected or Fit View/Reset is pressed, so Zoom In has no headroom to do anything for Saturn or Neptune (or any other non-Ceres body) until the user has first zoomed OUT`,
  )
})

test('SpaceLab: onFitView/onReset\'s target distance is not the exact same expression as the non-close-focus zoomInFloor (so a Fit View/Reset never immediately re-disables Zoom In with zero headroom)', () => {
  const zoomInFloorMatch = spaceLabSrc.match(/const zoomInFloor = CLOSE_FOCUS_BODY_IDS\.has\(selectedId\) \? MIN_CAMERA_DISTANCE : (\w+)/)
  const nonCloseFocusFloorExpr = zoomInFloorMatch![1]

  const fitViewMatch = spaceLabSrc.match(/onFitView=\{\(\) => setCameraDistance\((\w+)\)\}/)
  assert.ok(fitViewMatch, 'expected an onFitView={() => setCameraDistance(...)} handler to still exist in SpaceLab.tsx')

  assert.notEqual(
    fitViewMatch![1],
    nonCloseFocusFloorExpr,
    `expected onFitView's target distance ("${fitViewMatch![1]}") to differ from the non-close-focus zoomInFloor expression ("${nonCloseFocusFloorExpr}") for the same reason as the previous test -- otherwise pressing Fit View for Saturn/Neptune immediately re-disables Zoom In with no room to click it again`,
  )
})
