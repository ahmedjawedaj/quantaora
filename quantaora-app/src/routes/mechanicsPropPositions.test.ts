import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Mechanics task (docs/reviews/wave12-mechanics.md P1 #3, per
// PhysicsLab.tsx's own comment above TrackedBaseball/MeasuringTapeTool): at the cart's default
// rest state (sim.position === START_POSITION), the baseball prop and the measuring-tape prop
// previously landed on the same x with too shallow a z-gap between their lanes and rendered as
// one overlapping blob, hiding the tape entirely until the race moved the baseball away. The fix
// separates both props' x AND z so they stay visually distinct at rest, not only once the race is
// running.
//
// This test parses PhysicsLab.tsx's own source for the exact literal offsets already landed
// (TrackedBaseball's `position={[sim.position, 0.08, 0.85]}`, MeasuringTapeTool's
// `position={[START_POSITION - 0.4, -0.04, 0.58]}`) and recomputes the default-state (x, z) pair
// for each prop the same way the component does, then asserts they are meaningfully separated --
// rather than asserting on hardcoded expected numbers, so this test still catches a future
// regression if either offset changes without keeping the props apart. Static source-text
// parsing only, matching this repo's plain node:test + native TS type-stripping convention (no
// jsdom/WebGL scene-graph harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/mechanicsPropPositions.test.ts

const PHYSICS_LAB_PATH = fileURLToPath(new URL('./PhysicsLab.tsx', import.meta.url))
const physicsLabSrc = readFileSync(PHYSICS_LAB_PATH, 'utf8')

function extractStartPosition(): number {
  const match = physicsLabSrc.match(/const START_POSITION = (-?[\d.]+)/)
  assert.ok(match, 'expected a START_POSITION constant to still exist in PhysicsLab.tsx (the cart\'s default rest x-position)')
  return Number(match![1])
}

function extractBaseballDefaultXZ(startPosition: number): { x: number; z: number } {
  // TrackedBaseball rides sim.position -- at the cart's default rest state (before any race
  // runs), sim's initial useState sets position: START_POSITION, so sim.position === START_POSITION.
  const fnIdx = physicsLabSrc.indexOf('function TrackedBaseball')
  assert.ok(fnIdx !== -1, 'expected a TrackedBaseball component to still exist in PhysicsLab.tsx')
  const body = physicsLabSrc.slice(fnIdx, fnIdx + 1500)
  const posMatch = body.match(/<group ref=\{groupRef\} position=\{\[\s*sim\.position\s*,\s*[-\d.]+\s*,\s*([-\d.]+)\s*\]\}/)
  assert.ok(
    posMatch,
    'expected TrackedBaseball to render <group ref={groupRef} position={[sim.position, <y>, <z>]}> with sim.position driving x directly',
  )
  return { x: startPosition, z: Number(posMatch![1]) }
}

function extractTapeDefaultXZ(startPosition: number): { x: number; z: number } {
  const fnIdx = physicsLabSrc.indexOf('function MeasuringTapeTool')
  assert.ok(fnIdx !== -1, 'expected a MeasuringTapeTool component to still exist in PhysicsLab.tsx')
  const body = physicsLabSrc.slice(fnIdx, fnIdx + 1500)
  const posMatch = body.match(/<group position=\{\[\s*START_POSITION\s*([+-])\s*([\d.]+)\s*,\s*[-\d.]+\s*,\s*([-\d.]+)\s*\]\}/)
  assert.ok(
    posMatch,
    'expected MeasuringTapeTool to render <group position={[START_POSITION <+|-> <offset>, <y>, <z>]}>',
  )
  const [, sign, offsetStr, zStr] = posMatch!
  const offset = Number(offsetStr)
  const x = sign === '-' ? startPosition - offset : startPosition + offset
  return { x, z: Number(zStr) }
}

test('PhysicsLab: TrackedBaseball and MeasuringTapeTool default (x, z) positions are non-overlapping at cart rest state', () => {
  const startPosition = extractStartPosition()
  const baseball = extractBaseballDefaultXZ(startPosition)
  const tape = extractTapeDefaultXZ(startPosition)

  // Neither axis alone is allowed to coincide -- the Wave 12 bug was specifically that both props
  // shared the same x with only a shallow z-gap, so require real separation on at least one axis
  // and a combined 2D distance clearly larger than either prop's own footprint (BASEBALL/MEASURING
  // TAPE target sizes are both under 0.5 world units, so a combined footprint radius well under 0.5
  // is a safe non-overlap threshold).
  const dx = baseball.x - tape.x
  const dz = baseball.z - tape.z
  const distance = Math.hypot(dx, dz)

  assert.notEqual(baseball.x, tape.x, 'expected the baseball and measuring-tape props to not share the exact same default x position')
  assert.ok(
    distance > 0.3,
    `expected the baseball (${baseball.x}, ${baseball.z}) and measuring-tape (${tape.x}, ${tape.z}) props to be separated by more than 0.3 world units at the cart's default rest state; got ${distance.toFixed(3)} -- otherwise they render as one overlapping blob (docs/reviews/wave12-mechanics.md P1 #3)`,
  )
})

// Regression guard for this wave's Mechanics follow-up (docs/reviews/wave17-mechanics.md P1): the
// separation fix above (x pullback widened 0.4 -> 0.75, TrackedBaseball's z bumped to 1.05,
// MeasuringTapeTool's z lane moved to 0.38) still left the tape-reading label and the friction
// arrow's tip label ("friction fights motion") landing at nearly the same on-screen height near
// that end of the track -- PhysicsLab.tsx's own comment above MeasuringTapeTool documents raising
// the tape-reading label's y offset from 0.34 to 0.52 specifically so it clears the friction
// label. This test parses both labels' y offsets straight from source and asserts they differ by
// a meaningful margin, rather than asserting a hardcoded expected number, so it still catches a
// future regression if either offset changes without keeping the labels apart.
test('PhysicsLab: the tape-reading label\'s y offset differs meaningfully from the friction label\'s y offset (not landing at the same height)', () => {
  const tapeLabelMatch = physicsLabSrc.match(/<SceneLabel text=\{`tape reads \$\{measuredSpan\.toFixed\(2\)\} m`\} position=\{\[0, ([-\d.]+), 0\]\}/)
  assert.ok(
    tapeLabelMatch,
    'expected MeasuringTapeTool to render <SceneLabel text={`tape reads ...`} position={[0, <y>, 0]}> for the tape-reading label',
  )
  const tapeLabelYOffset = Number(tapeLabelMatch![1])

  const frictionLabelMatch = physicsLabSrc.match(/<SceneLabel text="friction fights motion" position=\{\[start\[0\][^,]*,\s*start\[1\]\s*([+-])\s*([\d.]+),/)
  assert.ok(
    frictionLabelMatch,
    'expected FrictionArrow to render <SceneLabel text="friction fights motion" position={[..., start[1] +/- <offset>, ...]}> for the friction label',
  )
  const [, frictionSign, frictionOffsetStr] = frictionLabelMatch!
  const frictionLabelYOffset = frictionSign === '-' ? -Number(frictionOffsetStr) : Number(frictionOffsetStr)

  const gap = Math.abs(tapeLabelYOffset - frictionLabelYOffset)
  assert.ok(
    gap > 0.15,
    `expected the tape-reading label's y offset (${tapeLabelYOffset}) and the friction label's y offset (${frictionLabelYOffset}) to differ by more than 0.15 world units; got a gap of ${gap.toFixed(3)} -- too close and the two labels render at nearly the same height near this end of the track (docs/reviews/wave17-mechanics.md P1)`,
  )
})
