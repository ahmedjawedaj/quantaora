import type { EarthSpaceMode } from '@/data/earthInSpace'

/** Must match the Canvas `camera.fov` prop in EarthSpaceViewer.tsx (see CAMERA_FOV_DEG there). */
export const CAMERA_FOV_DEG = 42

/**
 * Mirrors EarthSpaceViewer.tsx's MOTION_ORBIT_RADIUS (4.2) + EARTH_SIZE/2 (0.85) and
 * SEASONS_ORBIT_RADIUS (4.2) + EARTH_SIZE/2 (0.85) — the horizontal offset from screen center
 * Earth swings to at the widest point of each mode's orbit (orbit angle 0/180). Other modes keep
 * Earth near center and don't need this compensation. Kept as literals (not imported from the R3F
 * viewer file) so this module has zero React/Three.js dependencies and can be unit-tested
 * directly under node:test; EarthSpaceViewer.test.ts guards the two files staying in sync.
 */
const WIDE_ORBIT_EXTENT: Partial<Record<EarthSpaceMode, number>> = {
  motion: 5.05,
  seasons: 5.05,
}

/** Headroom beyond the bare trig minimum so Earth doesn't sit flush against the frustum edge. */
const FRAME_MARGIN = 1.15

/**
 * The route's DEFAULT_CAMERA_DISTANCE was eyeballed against a desktop-ish (wide) canvas aspect.
 * The camera's vertical FOV is fixed, so how much horizontal room a given distance buys depends
 * on the canvas's actual aspect ratio — a near-square mobile canvas has less horizontal frustum
 * width per unit of distance than a wide desktop one, so the same default distance that frames
 * 'motion'/'seasons' fine on desktop lets Earth clip the left/right edge on mobile at the widest
 * orbit angles. This computes the minimum distance that keeps Earth's full orbit extent inside
 * the frustum for the *actual* canvas aspect, and only ever raises `baseDistance` (never shrinks
 * it), so it acts purely as a floor under the existing default/fit/reset value — zoom in/out keep
 * stepping from wherever the caller currently has the camera exactly as before.
 */
export function framedCameraDistance(baseDistance: number, mode: EarthSpaceMode, aspect: number, maxDistance = Infinity): number {
  const extent = WIDE_ORBIT_EXTENT[mode]
  if (!extent || !Number.isFinite(aspect) || aspect <= 0) return baseDistance
  const halfVFovRad = (CAMERA_FOV_DEG / 2) * (Math.PI / 180)
  const minDistance = (extent * FRAME_MARGIN) / (Math.tan(halfVFovRad) * aspect)
  return Math.min(Math.max(baseDistance, minDistance), maxDistance)
}
