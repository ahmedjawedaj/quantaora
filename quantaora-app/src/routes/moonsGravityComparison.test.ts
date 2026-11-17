import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { moons, EARTH_SURFACE_GRAVITY_MS2 } from '../data/moons.ts'

// Regression guard for this wave's Moons task: "adding a visual gravity comparison element."
// MoonsLab.tsx already renders a "What would you weigh here?" section (the gravity comparator):
// pick a body weight in kg, and it recomputes live against whichever moon's real published
// surfaceGravityMs2 is currently selected. This test has two parts:
//  1. a genuine unit test against the real, pure moons data (moons.ts has no JSX, so unlike the
//     route file it can be imported directly under this repo's plain node:test + native TS
//     type-stripping setup -- see ./BranchLab.test.ts's own comment on that convention) --
//     confirming the underlying data actually varies enough for a comparison to be meaningful,
//     and that the same weight formula MoonsLab.tsx uses scales monotonically with gravity; and
//  2. a source-text check that MoonsLab.tsx still contains and renders that computation, so this
//     doesn't just test the data in isolation.
//
// Run with: node --test src/routes/moonsGravityComparison.test.ts

test('moons data: surfaceGravityMs2 varies across the five moons (the comparison has something real to show)', () => {
  const gravities = moons.map((m) => m.surfaceGravityMs2)
  const distinct = new Set(gravities)
  assert.ok(
    distinct.size > 1,
    `expected moons.ts to define varying surfaceGravityMs2 values across moons so a gravity comparison is meaningful; got ${JSON.stringify(gravities)}`,
  )
  assert.ok(EARTH_SURFACE_GRAVITY_MS2 > 0, 'expected a positive EARTH_SURFACE_GRAVITY_MS2 baseline to compare against')
})

test('gravity comparator formula (weight-on-moon = earthWeight * moonGravity / earthGravity) scales monotonically with gravity', () => {
  const earthWeightKg = 40
  const weighOn = (surfaceGravityMs2: number) => Math.round(earthWeightKg * (surfaceGravityMs2 / EARTH_SURFACE_GRAVITY_MS2) * 10) / 10

  const sorted = [...moons].sort((a, b) => a.surfaceGravityMs2 - b.surfaceGravityMs2)
  for (let i = 1; i < sorted.length; i += 1) {
    const prevWeight = weighOn(sorted[i - 1].surfaceGravityMs2)
    const nextWeight = weighOn(sorted[i].surfaceGravityMs2)
    assert.ok(
      nextWeight >= prevWeight,
      `expected weight-on-moon to be non-decreasing as surfaceGravityMs2 increases: ${sorted[i - 1].name} (g=${sorted[i - 1].surfaceGravityMs2}) -> ${prevWeight}kg, ${sorted[i].name} (g=${sorted[i].surfaceGravityMs2}) -> ${nextWeight}kg`,
    )
  }

  // Sanity check the formula isn't degenerate (e.g. always returning the same value regardless of
  // gravity) -- the lightest-gravity and heaviest-gravity moon must produce different weights.
  const lightest = weighOn(sorted[0].surfaceGravityMs2)
  const heaviest = weighOn(sorted[sorted.length - 1].surfaceGravityMs2)
  assert.notEqual(lightest, heaviest, 'expected the comparator to actually produce different weights across moons with different gravity, not a constant')
})

test('MoonsLab.tsx: renders a gravity-comparison element driven by the real per-moon surfaceGravityMs2 field', () => {
  const moonsLabSrc = readFileSync(fileURLToPath(new URL('./MoonsLab.tsx', import.meta.url)), 'utf8')

  assert.match(
    moonsLabSrc,
    /content\.surfaceGravityMs2/,
    'expected MoonsLab.tsx to compute something from the active moon\'s real surfaceGravityMs2 field',
  )
  assert.match(
    moonsLabSrc,
    /EARTH_SURFACE_GRAVITY_MS2/,
    'expected MoonsLab.tsx to compare against the shared EARTH_SURFACE_GRAVITY_MS2 baseline',
  )
  // It must actually be rendered (JSX interpolation), not just computed and discarded -- e.g. a
  // `{weightOnMoonKg}` or similar interpolation inside the returned tree.
  assert.match(
    moonsLabSrc,
    /\{weightOnMoonKg\}|\{jumpMultiplier\}/,
    'expected the computed gravity-comparison value(s) to actually be interpolated into rendered JSX, not just computed and left unused',
  )
})
