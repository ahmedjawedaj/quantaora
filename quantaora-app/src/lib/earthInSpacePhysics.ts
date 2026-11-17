/**
 * Pure, framework-free astronomy helpers backing the Earth In Space lab
 * (EarthInSpaceLab.tsx + EarthSpaceViewer.tsx). Kept separate from both so the
 * cause/effect math is independently unit-testable under this repo's plain
 * node:test + native TS type-stripping convention (see
 * src/routes/moonsGravityComparison.test.ts for the established pattern).
 *
 * Every formula here is a real, simplified textbook approximation — not
 * invented — picked to be directionally and numerically honest for a
 * grade 3–7 audience without needing full spherical/orbital-mechanics
 * precision (e.g. no eccentricity, no precession, no true anomaly).
 */

/** Earth's real axial tilt (obliquity), in degrees. */
export const EARTH_AXIAL_TILT_DEG = 23.5

/** The Moon's real orbital inclination relative to the ecliptic (Earth's orbital plane), in
 *  degrees — the reason eclipses happen only a few times a year instead of every single month:
 *  most months the Moon's shadow (or the Moon itself) passes above or below the Sun-Earth line. */
export const MOON_ORBIT_TILT_DEG = 5.1

/** Order of the four cardinal points of Earth's orbit, starting at the March equinox, used as
 *  `orbitAngleDeg`'s reference frame everywhere in this module (0° = March equinox, 90° = June
 *  solstice, 180° = September equinox, 270° = December solstice). */
export type Hemisphere = 'north' | 'south'
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter'

function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/** Latitude directly under the Sun at noon, for a given position in Earth's orbit and axial
 *  tilt — the standard sin-approximation of solar declination. At tiltDeg = 23.5 this matches
 *  Earth's real seasonal swing between +23.5° (June solstice) and -23.5° (December solstice). */
export function subsolarLatitudeDeg(orbitAngleDeg: number, tiltDeg: number): number {
  const rad = (normalizeDeg(orbitAngleDeg) * Math.PI) / 180
  return tiltDeg * Math.sin(rad)
}

const SEASON_OPPOSITE: Record<SeasonName, SeasonName> = {
  spring: 'autumn',
  summer: 'winter',
  autumn: 'spring',
  winter: 'summer',
}

function seasonForAngle(orbitAngleDeg: number): SeasonName {
  const t = normalizeDeg(orbitAngleDeg)
  if (t < 90) return 'spring'
  if (t < 180) return 'summer'
  if (t < 270) return 'autumn'
  return 'winter'
}

/** Season name per hemisphere for a given orbit position — always opposite each other, the core
 *  fact this whole simulator exists to make visible ("Change" the orbit position and watch both
 *  hemispheres' seasons flip at the same time). */
export function seasonLabels(orbitAngleDeg: number): Record<Hemisphere, SeasonName> {
  const north = seasonForAngle(orbitAngleDeg)
  return { north, south: SEASON_OPPOSITE[north] }
}

/** Approximate hours of daylight at a given latitude for a given subsolar (declination)
 *  latitude — the standard sunrise-equation half-day-angle formula, clamped to the polar
 *  day/night cases where the cosine falls outside [-1, 1]. */
export function daylightHours(latitudeDeg: number, subsolarLatDeg: number): number {
  const lat = (latitudeDeg * Math.PI) / 180
  const dec = (subsolarLatDeg * Math.PI) / 180
  const cosH = -Math.tan(lat) * Math.tan(dec)
  if (cosH <= -1) return 24
  if (cosH >= 1) return 0
  const halfDayAngle = Math.acos(cosH)
  return (24 / Math.PI) * halfDayAngle
}

export interface MoonPhaseInfo {
  label: string
  /** Fraction of the Moon's visible disc that is lit, from 0 (new) to 1 (full). */
  illumination: number
}

const PHASE_LABELS = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
]

/** moonAngleDeg is the Moon's position in its orbit measured from the Sun-Earth line: 0° = Moon
 *  between Earth and Sun (New Moon), 180° = Moon opposite the Sun (Full Moon). Illumination uses
 *  the standard (1 - cos θ) / 2 phase-angle approximation. */
export function moonPhase(moonAngleDeg: number): MoonPhaseInfo {
  const t = normalizeDeg(moonAngleDeg)
  const rad = (t * Math.PI) / 180
  const illumination = (1 - Math.cos(rad)) / 2
  const bucket = Math.round(t / 45) % 8
  return { label: PHASE_LABELS[bucket], illumination }
}

export type TideState = 'high' | 'low' | 'rising' | 'falling'

export interface TideInfo {
  state: TideState
  label: string
}

const TIDE_LABEL: Record<TideState, string> = {
  high: 'High tide',
  low: 'Low tide',
  rising: 'Tide rising',
  falling: 'Tide falling',
}

/** Earth carries two tidal bulges at all times — one facing the Moon, one facing directly away
 *  from it — so a fixed point on the spinning Earth passes through a high tide roughly every 12
 *  hours, not once a day. `spinAngleDeg` is that point's current rotation angle; the Moon's
 *  bulge axis is fixed at 0°/180° in this simplified model (the Moon itself moves far slower
 *  than Earth spins, so treating it as momentarily fixed is a standard teaching simplification). */
export function tideState(spinAngleDeg: number): TideInfo {
  const m = normalizeDeg(spinAngleDeg) % 180
  const distanceFromBulge = Math.min(m, 180 - m)
  let state: TideState
  if (distanceFromBulge <= 20) state = 'high'
  else if (distanceFromBulge >= 70) state = 'low'
  else state = m < 90 ? 'falling' : 'rising'
  return { state, label: TIDE_LABEL[state] }
}

export type EclipseStrength = 'total' | 'partial' | 'none'

export interface EclipseOutcome {
  strength: EclipseStrength
  occurs: boolean
  explanation: string
}

/** alignmentOffsetDeg represents how far the Moon is, this particular month, from the exact
 *  point where its tilted orbit crosses Earth's orbital plane (a "node"). Real eclipses need
 *  near-perfect Sun-Earth-Moon alignment at a node; most months the Moon crosses well away from
 *  a node, so its shadow (or the Moon itself, for a lunar eclipse) misses entirely — exactly what
 *  the `tiltApplied` toggle demonstrates: turn the Moon's real 5.1° tilt off and every month
 *  aligns perfectly, which is *not* what really happens and is the point of the toggle. */
export function eclipseOutcome(alignmentOffsetDeg: number, tiltApplied: boolean): EclipseOutcome {
  const offset = tiltApplied ? Math.abs(alignmentOffsetDeg) : 0
  if (offset <= 1) {
    return { strength: 'total', occurs: true, explanation: 'Sun, Earth, and Moon are almost perfectly in line — the shadow lands squarely on target.' }
  }
  if (offset <= 3) {
    return { strength: 'partial', occurs: true, explanation: 'Close, but not quite lined up — only part of the shadow reaches its target.' }
  }
  return {
    strength: 'none',
    occurs: false,
    explanation: tiltApplied
      ? "The Moon's orbit is tilted about 5.1° from Earth's, so most months its shadow passes above or below Earth entirely — no eclipse."
      : 'With the tilt switched off, Sun, Earth, and Moon would line up every single month.',
  }
}
