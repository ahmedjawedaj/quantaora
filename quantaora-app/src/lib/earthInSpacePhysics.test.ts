import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  EARTH_AXIAL_TILT_DEG,
  MOON_ORBIT_TILT_DEG,
  subsolarLatitudeDeg,
  seasonLabels,
  daylightHours,
  moonPhase,
  tideState,
  eclipseOutcome,
} from './earthInSpacePhysics.ts'

// Regression/behavior guard for the Earth In Space lab's cause/effect math. These are pure
// functions (no JSX), so — per the convention established by
// src/routes/moonsGravityComparison.test.ts — they can be imported and tested directly under
// this repo's plain node:test + native TS type-stripping setup.
// Run with: node --test src/lib/earthInSpacePhysics.test.ts

test('constants: real published Earth/Moon values', () => {
  assert.equal(EARTH_AXIAL_TILT_DEG, 23.5)
  assert.equal(MOON_ORBIT_TILT_DEG, 5.1)
})

test('subsolarLatitudeDeg: swings between +tilt and -tilt across the year, and is 0 at the equinoxes', () => {
  assert.ok(Math.abs(subsolarLatitudeDeg(0, 23.5)) < 1e-9, 'March equinox (0°) should have ~0° subsolar latitude')
  assert.ok(Math.abs(subsolarLatitudeDeg(90, 23.5) - 23.5) < 1e-9, 'June solstice (90°) should be at +tilt')
  assert.ok(Math.abs(subsolarLatitudeDeg(180, 23.5)) < 1e-9, 'September equinox (180°) should have ~0° subsolar latitude')
  assert.ok(Math.abs(subsolarLatitudeDeg(270, 23.5) + 23.5) < 1e-9, 'December solstice (270°) should be at -tilt')
})

test('subsolarLatitudeDeg: zero tilt means zero subsolar latitude everywhere in the orbit (no seasons)', () => {
  for (const angle of [0, 45, 90, 180, 270, 333]) {
    assert.ok(Object.is(subsolarLatitudeDeg(angle, 0), 0) || Object.is(subsolarLatitudeDeg(angle, 0), -0))
  }
})

test('seasonLabels: north and south are always opposite, never the same season', () => {
  for (const angle of [0, 15, 90, 135, 180, 225, 270, 315]) {
    const { north, south } = seasonLabels(angle)
    assert.notEqual(north, south, `expected opposite seasons at orbit angle ${angle}, got north=${north} south=${south}`)
  }
})

test('seasonLabels: June solstice is Northern summer, December solstice is Northern winter', () => {
  assert.equal(seasonLabels(90).north, 'summer')
  assert.equal(seasonLabels(270).north, 'winter')
})

test('daylightHours: exactly 12 hours everywhere at an equinox (subsolar latitude 0)', () => {
  for (const lat of [-60, -23.5, 0, 23.5, 60]) {
    assert.ok(Math.abs(daylightHours(lat, 0) - 12) < 1e-6, `expected 12h daylight at latitude ${lat} when subsolar latitude is 0`)
  }
})

test('daylightHours: the hemisphere leaning toward the Sun gets more than 12 hours', () => {
  const northernSummerDaylight = daylightHours(45, 23.5)
  const northernWinterDaylight = daylightHours(45, -23.5)
  assert.ok(northernSummerDaylight > 12, 'expected more than 12h daylight at 45°N when the Northern Hemisphere leans toward the Sun')
  assert.ok(northernWinterDaylight < 12, 'expected less than 12h daylight at 45°N when the Northern Hemisphere leans away from the Sun')
})

test('daylightHours: polar day/night clamp to 24/0 instead of producing NaN', () => {
  assert.equal(daylightHours(85, 23.5), 24)
  assert.equal(daylightHours(85, -23.5), 0)
})

test('moonPhase: New Moon (0°) is unlit, Full Moon (180°) is fully lit', () => {
  assert.equal(moonPhase(0).label, 'New Moon')
  assert.ok(moonPhase(0).illumination < 0.01)
  assert.equal(moonPhase(180).label, 'Full Moon')
  assert.ok(moonPhase(180).illumination > 0.99)
})

test('moonPhase: First Quarter (90°) and Last Quarter (270°) are both about half-lit', () => {
  assert.equal(moonPhase(90).label, 'First Quarter')
  assert.ok(Math.abs(moonPhase(90).illumination - 0.5) < 1e-6)
  assert.equal(moonPhase(270).label, 'Last Quarter')
  assert.ok(Math.abs(moonPhase(270).illumination - 0.5) < 1e-6)
})

test('moonPhase: illumination increases monotonically from New to Full across the waxing half', () => {
  const angles = [0, 30, 60, 90, 120, 150, 180]
  const illuminations = angles.map((a) => moonPhase(a).illumination)
  for (let i = 1; i < illuminations.length; i += 1) {
    assert.ok(illuminations[i] >= illuminations[i - 1], `expected illumination to increase from angle ${angles[i - 1]} to ${angles[i]}`)
  }
})

test('tideState: a full rotation passes through two highs and two lows (bulges at 0° and 180°)', () => {
  assert.equal(tideState(0).state, 'high')
  assert.equal(tideState(180).state, 'high')
  assert.equal(tideState(90).state, 'low')
  assert.equal(tideState(270).state, 'low')
})

test('tideState: state sequence over a full spin visits high, falling, low, rising, high in order', () => {
  const samples = [0, 45, 90, 135, 180]
  const states = samples.map((deg) => tideState(deg).state)
  assert.deepEqual(states, ['high', 'falling', 'low', 'rising', 'high'])
})

test('eclipseOutcome: perfect alignment (offset 0) is always total, regardless of the tilt toggle', () => {
  assert.equal(eclipseOutcome(0, true).strength, 'total')
  assert.equal(eclipseOutcome(0, false).strength, 'total')
})

test('eclipseOutcome: with the real 5.1° tilt applied, a large offset produces no eclipse', () => {
  const outcome = eclipseOutcome(6, true)
  assert.equal(outcome.strength, 'none')
  assert.equal(outcome.occurs, false)
})

test('eclipseOutcome: switching the tilt off ignores the offset and always aligns perfectly', () => {
  const outcome = eclipseOutcome(6, false)
  assert.equal(outcome.strength, 'total')
  assert.equal(outcome.occurs, true)
})

test('eclipseOutcome: a moderate offset with the tilt applied produces a partial eclipse', () => {
  assert.equal(eclipseOutcome(2, true).strength, 'partial')
})
