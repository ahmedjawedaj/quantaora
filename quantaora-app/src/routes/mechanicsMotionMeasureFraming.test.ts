import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Mechanics task (docs/reviews/wave14-COMBINED.md P1 #8): "in
// motion-measure mode, baseball and measuring-tape props sit close enough to the cart at default
// camera framing to visually blend into one cluster (true 3D coordinates are separated; only a
// framing/readability issue)."
//
// This is deliberately NOT a re-check of ./mechanicsPropPositions.test.ts, which already guards
// that the baseball/measuring-tape pair's raw (x, z) coordinates are non-overlapping -- per that
// file's own comment, it does not cover the CART/baseball pair at all (TrackedBaseball rides the
// cart's exact x via `sim.position`, differentiated from the cart only by a fixed Z depth offset,
// so there is zero native x-separation there to lean on). At this scene's shared -0.25 rad rig yaw,
// a pure depth (Z) difference barely converts into on-screen horizontal spread, which is what let
// the cart and baseball visually cluster even with genuinely separated 3D coordinates. A real fix
// needs the *camera framing* (not the coordinates) to account for motion-measure's specific prop
// layout -- e.g. a steeper mode-specific rig yaw that converts more of that existing depth
// separation into visible screen-space spread.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/mechanicsMotionMeasureFraming.test.ts

const PHYSICS_LAB_PATH = fileURLToPath(new URL('./PhysicsLab.tsx', import.meta.url))
const src = readFileSync(PHYSICS_LAB_PATH, 'utf8')

test('PhysicsLab: the default-framing distance calculation is mode-aware (takes more than just aspect ratio)', () => {
  const fnMatch = src.match(/function safeDefaultDistanceForAspect\(([^)]*)\)/)
  assert.ok(fnMatch, 'expected a safeDefaultDistanceForAspect function to still exist in PhysicsLab.tsx')
  assert.match(
    fnMatch![1],
    /mode/,
    `expected safeDefaultDistanceForAspect's parameter list to include a mode parameter (got: "${fnMatch![1]}") -- a purely aspect-driven default framing has no way to special-case motion-measure's own prop layout`,
  )
})

test('PhysicsLab: applyDefaultFraming actually threads a live mode value into safeDefaultDistanceForAspect (or an equivalent mode-aware call), not a hardcoded default', () => {
  const fnIdx = src.indexOf('function applyDefaultFraming')
  assert.ok(fnIdx !== -1, 'expected an applyDefaultFraming function to still exist in PhysicsLab.tsx')
  const body = src.slice(fnIdx, fnIdx + 800)
  assert.match(
    body,
    /mode/,
    'expected applyDefaultFraming to accept/use a mode parameter of its own',
  )
  assert.match(
    body,
    /safeDefaultDistanceForAspect\([^)]*mode[^)]*\)/,
    'expected applyDefaultFraming to pass a mode value through to safeDefaultDistanceForAspect, not call it with only the aspect ratio',
  )
})

test('PhysicsLab: the call site that frames motion-measure mode\'s default view actually passes the real mode, not always the fallback default', () => {
  assert.match(
    src,
    /applyDefaultFraming\([^)]*mode\)/,
    'expected at least one applyDefaultFraming(..., mode) call site using the live `mode` variable (not omitted, which would silently fall back to force-motion\'s framing for every mode including motion-measure)',
  )
})

test('PhysicsLab: motion-measure mode gets a genuinely different rig yaw / framing input than the other modes, not the identical shared default', () => {
  // Accept the concrete shape already used elsewhere in this file for this kind of per-mode
  // divergence (rigYawForMode / MOTION_MEASURE_RIG_YAW), or any other named mode-keyed constant
  // that safeDefaultDistanceForAspect's mode parameter (checked above) actually feeds from.
  const rigYawFnMatch = src.match(/function rigYawForMode\(mode: MechanicsMode\) \{\s*return ([^\n]+)\n/)
  if (rigYawFnMatch) {
    assert.match(
      rigYawFnMatch[1],
      /'motion-measure'/,
      'expected rigYawForMode to special-case \'motion-measure\' with a distinct value, not return the same constant for every mode',
    )
    return
  }
  // If that exact helper doesn't exist, fall back to a looser check: some mode-keyed conditional
  // or lookup referencing 'motion-measure' must exist near the camera-framing code.
  assert.match(
    src,
    /motion-measure[\s\S]{0,200}?(?:yaw|Yaw|frame|Frame|distance|Distance)/,
    'expected some mode-aware camera-framing logic (yaw, frame, or distance) to special-case \'motion-measure\' specifically',
  )
})

test('PhysicsLab: the mode-specific framing change is scoped to motion-measure only, not applied to every mode (would silently change the already-passing force-motion/friction-slope/etc. framing)', () => {
  const rigGroupMatch = src.match(/<group rotation=\{\[-?[\d.]+,\s*(\w+\([^)]*\)|-?[\d.]+),\s*0\]\}>/)
  assert.ok(rigGroupMatch, 'expected MechanicsRig\'s root <group rotation={[...]}> to still exist')
  assert.match(
    rigGroupMatch![1],
    /mode/,
    `expected MechanicsRig's rotation to be driven by a mode-aware expression referencing \`mode\` (got: "${rigGroupMatch![1]}"), so only motion-measure's framing changes and every other mode's already-reviewed framing is untouched`,
  )
})
