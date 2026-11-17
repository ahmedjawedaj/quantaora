import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CAMERA_FOV_DEG, framedCameraDistance } from './earthSpaceCamera.ts'

// Regression guard for the P0 visual QA finding: Earth clipped the right edge of the canvas in
// 'motion' (Rotation & Revolution) and 'seasons' (Axial Tilt & Seasons) mode on a 390x844 mobile
// viewport, and framing was uncomfortably tight in 'seasons' on desktop too. Pure math, no
// React/Three.js — see this file's own header comment for why. Run with:
// node --test src/lib/earthSpaceCamera.test.ts

// Half-width of the view frustum at a given distance, for the fixed vertical FOV this module
// assumes — used below to independently verify "Earth's orbit extent fits on screen" rather than
// re-deriving framedCameraDistance's own formula.
function halfFrustumWidth(distance: number, aspect: number) {
  const halfVFovRad = (CAMERA_FOV_DEG / 2) * (Math.PI / 180)
  return distance * Math.tan(halfVFovRad) * aspect
}

const WIDE_ORBIT_EXTENT = 5.05 // MOTION/SEASONS_ORBIT_RADIUS (4.2) + EARTH_SIZE/2 (0.85)
const DEFAULT_CAMERA_DISTANCE = 16 // mirrors EarthInSpaceLab.tsx's constant
const MAX_CAMERA_DISTANCE = 24 // mirrors EarthInSpaceLab.tsx's constant

test('non-wide-orbit modes are untouched: phases/eclipses/tides never get distance raised', () => {
  for (const mode of ['phases', 'eclipses', 'tides'] as const) {
    for (const aspect of [0.3, 0.9, 1.3, 2.5]) {
      assert.equal(framedCameraDistance(DEFAULT_CAMERA_DISTANCE, mode, aspect), DEFAULT_CAMERA_DISTANCE)
    }
  }
})

test("mobile-square aspect (390x844 stage, ~0.9-1.05): 'motion' and 'seasons' get enough distance that Earth's full orbit extent fits inside the frustum", () => {
  for (const mode of ['motion', 'seasons'] as const) {
    for (const aspect of [0.9, 0.975, 1.005, 1.05]) {
      const distance = framedCameraDistance(DEFAULT_CAMERA_DISTANCE, mode, aspect, MAX_CAMERA_DISTANCE)
      assert.ok(
        halfFrustumWidth(distance, aspect) >= WIDE_ORBIT_EXTENT,
        `expected mode="${mode}" aspect=${aspect} distance=${distance} to fully frame Earth's orbit extent (${WIDE_ORBIT_EXTENT})`,
      )
      assert.ok(distance >= DEFAULT_CAMERA_DISTANCE, `expected the mobile aspect to preserve or raise the desktop-tuned default (${DEFAULT_CAMERA_DISTANCE})`)
    }
  }
})

test('desktop-wide aspect (~1.3): the floor stays at or near the existing default — objects stay large, no unnecessary zoom-out', () => {
  for (const mode of ['motion', 'seasons'] as const) {
    const distance = framedCameraDistance(DEFAULT_CAMERA_DISTANCE, mode, 1.3, MAX_CAMERA_DISTANCE)
    assert.ok(distance >= DEFAULT_CAMERA_DISTANCE, 'floor should never shrink below the desktop-tuned default')
    assert.ok(distance < DEFAULT_CAMERA_DISTANCE * 1.25, `expected only a modest desktop distance bump, got ${distance}`)
  }
})

test('a base distance already above the floor is returned unchanged (never clamped down)', () => {
  assert.equal(framedCameraDistance(19, 'motion', 1.3, MAX_CAMERA_DISTANCE), 19)
})

test('the computed floor never exceeds the caller-supplied maxDistance bound', () => {
  const distance = framedCameraDistance(DEFAULT_CAMERA_DISTANCE, 'motion', 0.4, MAX_CAMERA_DISTANCE)
  assert.ok(distance <= MAX_CAMERA_DISTANCE)
})

test('degenerate aspect ratios (0, negative, NaN) fall back to the base distance instead of exploding', () => {
  for (const aspect of [0, -1, NaN]) {
    assert.equal(framedCameraDistance(DEFAULT_CAMERA_DISTANCE, 'seasons', aspect), DEFAULT_CAMERA_DISTANCE)
  }
})
