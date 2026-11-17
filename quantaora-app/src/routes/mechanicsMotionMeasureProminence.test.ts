import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Mechanics QA task: in motion-measure mode (the Position,
// Distance, Displacement, Speed, and Velocity components), the cleared baseball and
// measuring-tape GLBs previously rendered tiny and buried under the always-on force/friction/
// gravity-arrow/momentum-stack apparatus that MechanicsRig renders for every component regardless
// of relevance (see docs/reviews/wave16-mechanics.md P1 #1/#2, docs/reviews/wave18-mechanics.md).
// The fix: (1) both props were sized up further and pulled toward the camera so they read as the
// clear focal props rather than incidental background clutter, and (2) the force/friction/
// gravity/momentum apparatus - which has nothing to do with Distance/Displacement/Speed/Velocity/
// Position - is now dimmed specifically in motion-measure mode (independent of the isolate
// toggle), and a readout label tied to the same mechanicsReadout() the HUD panel already uses is
// rendered next to the tracked baseball so its number always matches the active component.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/mechanicsMotionMeasureProminence.test.ts

const PHYSICS_LAB_PATH = fileURLToPath(new URL('./PhysicsLab.tsx', import.meta.url))
const src = readFileSync(PHYSICS_LAB_PATH, 'utf8')

test('PhysicsLab: the baseball and measuring-tape target sizes are large enough to read as focal props, not incidental clutter', () => {
  const baseballMatch = src.match(/const BASEBALL_TARGET_SIZE = ([\d.]+)/)
  const tapeMatch = src.match(/const MEASURING_TAPE_TARGET_SIZE = ([\d.]+)/)
  assert.ok(baseballMatch, 'expected a BASEBALL_TARGET_SIZE constant to still exist in PhysicsLab.tsx')
  assert.ok(tapeMatch, 'expected a MEASURING_TAPE_TARGET_SIZE constant to still exist in PhysicsLab.tsx')

  const baseballSize = Number(baseballMatch![1])
  const tapeSize = Number(tapeMatch![1])
  // Cart's own body width is `0.54 + mass * 0.012` (see the Cart component's `size` calc), i.e.
  // >= 0.54 for any mass >= 0. Both props should be comparable in scale to the cart itself, not a
  // small fraction of it -- otherwise they read as background detail again regardless of framing.
  assert.ok(
    baseballSize >= 0.4,
    `expected BASEBALL_TARGET_SIZE to be at least 0.4 world units (comparable to the cart's own ~0.54+ body width); got ${baseballSize}`,
  )
  assert.ok(
    tapeSize >= 0.4,
    `expected MEASURING_TAPE_TARGET_SIZE to be at least 0.4 world units (comparable to the cart's own ~0.54+ body width); got ${tapeSize}`,
  )
})

test('PhysicsLab: motion-measure mode declutters the force/friction/gravity/momentum apparatus that has nothing to do with Distance/Displacement/Speed/Velocity/Position', () => {
  const declutterMatch = src.match(/const declutterForMeasure = (mode === 'motion-measure')/)
  assert.ok(
    declutterMatch,
    "expected a `declutterForMeasure` flag derived from `mode === 'motion-measure'` inside MechanicsRig",
  )

  const rigIdx = src.indexOf('function MechanicsRig')
  assert.ok(rigIdx !== -1, 'expected a MechanicsRig component to still exist in PhysicsLab.tsx')
  const rigBody = src.slice(rigIdx, src.indexOf('\nfunction Track', rigIdx))

  // The force/friction/gravity/momentum props are otherwise only dimmed via the isolate-mode
  // `dim()` helper (focus-based); this asserts declutterForMeasure is additionally OR'd in for
  // each of them, so motion-measure declutters them even outside isolate mode.
  for (const needle of [
    "dim('force') || declutterForMeasure",
    "dim('acceleration') || declutterForMeasure",
    "dim('friction') || declutterForMeasure",
    'declutterForMeasure',
  ]) {
    assert.ok(
      rigBody.includes(needle),
      `expected MechanicsRig's JSX to reference "${needle}" so motion-measure mode dims the unrelated apparatus`,
    )
  }
  assert.ok(
    rigBody.includes("dim('momentum') || declutterForMeasure"),
    "expected MomentumBlocks' dim prop to also be OR'd with declutterForMeasure",
  )
})

test('PhysicsLab: motion-measure mode is the ONLY mode declutterForMeasure affects (not applied unconditionally, which would silently dim force-motion/friction-slope/etc. too)', () => {
  assert.match(
    src,
    /const declutterForMeasure = mode === 'motion-measure'\n/,
    'expected declutterForMeasure to be scoped strictly to the motion-measure mode check, not a bare `true`/unconditional flag',
  )
})

test('PhysicsLab: the tracked baseball renders a live readout label sourced from the same mechanicsReadout() the HUD panel uses, not a hardcoded string', () => {
  const measureReadoutMatch = src.match(/const measureReadout = declutterForMeasure \? mechanicsReadout\(componentId, sim, controls\) : null/)
  assert.ok(
    measureReadoutMatch,
    'expected MechanicsRig to compute `measureReadout` via mechanicsReadout(componentId, sim, controls) when in motion-measure mode',
  )
  assert.match(
    src,
    /readout=\{measureReadout\}/,
    'expected measureReadout to be threaded into <MotionMarkers readout={measureReadout} />',
  )
  assert.match(
    src,
    /text=\{`\$\{readout\.primaryLabel\}: \$\{readout\.primaryValue\}`\}/,
    'expected MotionMarkers to render a SceneLabel using readout.primaryLabel/readout.primaryValue, so the on-canvas number next to the ball always matches whichever motion-measure component (Distance/Displacement/Speed/Velocity/Position) is active',
  )
})

test('PhysicsLab: TrackedBaseball and MeasuringTapeTool stay clearly separated on screen at the larger sizes (not just non-overlapping by a hair)', () => {
  const startMatch = src.match(/const START_POSITION = (-?[\d.]+)/)
  assert.ok(startMatch, 'expected START_POSITION to still exist')
  const startPosition = Number(startMatch![1])

  const ballIdx = src.indexOf('function TrackedBaseball')
  assert.ok(ballIdx !== -1, 'expected TrackedBaseball to still exist')
  const ballBody = src.slice(ballIdx, ballIdx + 1200)
  const ballMatch = ballBody.match(/<group ref=\{groupRef\} position=\{\[\s*sim\.position\s*,\s*[-\d.]+\s*,\s*([-\d.]+)\s*\]\}/)
  assert.ok(ballMatch, 'expected TrackedBaseball to render <group ref={groupRef} position={[sim.position, <y>, <z>]}>')
  const ball = { x: startPosition, z: Number(ballMatch![1]) }

  const tapeIdx = src.indexOf('function MeasuringTapeTool')
  assert.ok(tapeIdx !== -1, 'expected MeasuringTapeTool to still exist')
  const tapeBody = src.slice(tapeIdx, tapeIdx + 1200)
  const tapeMatch = tapeBody.match(/<group position=\{\[\s*START_POSITION\s*([+-])\s*([\d.]+)\s*,\s*[-\d.]+\s*,\s*([-\d.]+)\s*\]\}/)
  assert.ok(tapeMatch, 'expected MeasuringTapeTool to render <group position={[START_POSITION <+|-> <offset>, <y>, <z>]}>')
  const [, sign, offsetStr, zStr] = tapeMatch!
  const offset = Number(offsetStr)
  const tape = { x: sign === '-' ? startPosition - offset : startPosition + offset, z: Number(zStr) }

  const dx = ball.x - tape.x
  const dz = ball.z - tape.z
  const distance = Math.hypot(dx, dz)

  // At the larger BASEBALL_TARGET_SIZE/MEASURING_TAPE_TARGET_SIZE (both >= 0.4, asserted above),
  // each prop's own footprint radius is up to ~0.3 world units, so a combined footprint of ~0.6
  // is the real collision threshold now (looser than the original 0.3 m guard written for the
  // smaller pre-fix sizes) -- require a clear margin above that.
  assert.ok(
    distance > 0.8,
    `expected the baseball (${ball.x}, ${ball.z}) and measuring-tape (${tape.x}, ${tape.z}) props to be separated by more than 0.8 world units given their larger sizes; got ${distance.toFixed(3)}`,
  )
})
