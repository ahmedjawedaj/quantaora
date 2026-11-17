import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type RefObject, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Gauge,
  MoveRight,
  Scale,
  SlidersHorizontal,
  Timer,
  Weight,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { mechanics, mechanicsById } from '@/data/generated/mechanics'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import ContentNav from '@/components/explorer/ContentNav'
import DetailPanel from '@/components/explorer/DetailPanel'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'

const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const BLUE = '#4F83C4'
const BLUE_DARK = '#2F5F95'
const TEAL = '#4D9B91'
const GOLD = '#D9A441'
const AMBER = '#C9863A'
const RED = '#D86459'
const GREEN = '#5E9E67'
const VIOLET = '#7D69B3'
const BROWN = '#8B6A47'
const STONE = '#B7B0A0'
const DEFAULT_COMPONENT_ID = 'force'
const CAMERA_FOV_DEG = 39
const DEFAULT_CAMERA_DISTANCE = 7.4
const MIN_CAMERA_DISTANCE = 5.2
// Raised from the original 10.6 (see safeDefaultDistanceForAspect below) so narrow mobile
// aspect ratios have room to pull back far enough to keep the cart's full track excursion
// and its force-arrow labels framed (docs/reviews/wave10-mechanics.md P1 #2).
const MAX_CAMERA_DISTANCE = 13.5
// Native OrbitControls clamp kept a little looser than our own button-driven bounds above,
// matching the original 5 / 10.6+0.2-ish margin pattern.
const NATIVE_MIN_DISTANCE = 5
const NATIVE_MAX_DISTANCE = 13.8
const ZOOM_STEP = 0.45
const TRACK_LIMIT = 2.55
const MAX_HISTORY = 32
const REFERENCE_MASS = 5
const START_POSITION = -1.65
const RACE_STEP = 0.04

// Wave 2 sourced props (approved PASS-verdict assets, see docs/assets/reviews/mechanics-wave2-visual.md).
// Purely visual dressing/inspection aids layered on top of the procedural sim below - they never
// feed into computePhysics/stepOnce.
const BASEBALL_MODEL_URL = '/models/sourced/physics-mechanics-wave2/baseball-polyhaven.glb'
const MEASURING_TAPE_MODEL_URL = '/models/sourced/physics-mechanics-wave2/measuring-tape-polyhaven.glb'
// Sizes roughly doubled from the original 0.16 / 0.34 - at the original size these props were
// effectively invisible at default camera framing, reading as generic dark clutter near the
// cart's wheels rather than identifiable props (docs/reviews/wave10-mechanics.md P1 #3).
// Bumped again (0.3 -> 0.46, 0.42 -> 0.6) for this wave's fix: even clearly separated, both
// props still read as tiny background clutter next to the cart's force-arrow/gravity-arrow
// cluster at default framing - now sized close to or larger than the cart body itself
// (Cart's body width is ~0.54-0.6, see the `size` calc in the Cart component) so a child can
// actually identify them as the focal props of motion-measure mode, not incidental detail.
const BASEBALL_TARGET_SIZE = 0.46
const MEASURING_TAPE_TARGET_SIZE = 0.6
useGLTF.preload(BASEBALL_MODEL_URL)
useGLTF.preload(MEASURING_TAPE_MODEL_URL)

type MechanicsMode = 'force-motion' | 'motion-measure' | 'friction-slope' | 'gravity-weight' | 'momentum-energy'

interface SimState {
  position: number
  velocity: number
  acceleration: number
  time: number
  distance: number
}

interface MechanicsControls {
  force: number
  mass: number
  friction: number
  slope: number
  gravity: number
}

type HistoryPoint = { t: number; position: number; velocity: number; velocityB: number }

type PredictionChoice = 'mine' | 'reference' | 'tie'

interface PredictionState {
  choice: PredictionChoice | null
  running: boolean
  result: { winner: PredictionChoice; match: boolean } | null
}

const PREDICTION_OPTIONS: { id: PredictionChoice; label: string }[] = [
  { id: 'mine', label: 'My cart wins' },
  { id: 'reference', label: 'Reference wins' },
  { id: 'tie', label: 'They tie' },
]

function predictionOptionLabel(id: PredictionChoice | null) {
  return PREDICTION_OPTIONS.find((option) => option.id === id)?.label ?? '-'
}

function predictionQuestion(mode: MechanicsMode, mass: number): string {
  switch (mode) {
    case 'friction-slope':
      return `Predict: with this friction and slope, will your ${mass} kg cart beat the 5 kg reference cart down the track, lose, or tie?`
    case 'gravity-weight':
      return `Predict: at this gravity, will your ${mass} kg cart beat the 5 kg reference cart, lose, or tie?`
    case 'momentum-energy':
      return `Predict: will your ${mass} kg cart out-race the 5 kg reference cart, lose, or tie - which is harder to stop?`
    case 'motion-measure':
      return `Predict: will your ${mass} kg cart beat the 5 kg reference cart down the track, lose, or tie?`
    default:
      return `Predict: with this force and mass, will your cart beat the 5 kg reference cart, lose, or tie?`
  }
}

interface CriticalMission {
  topic: string
  predict: string
  change: string
  observe: string
  explain: string
}

const MECHANICS_MISSIONS: Record<MechanicsMode, CriticalMission[]> = {
  'force-motion': [
    {
      topic: 'Force and acceleration',
      predict: 'Predict whether doubling applied force doubles the acceleration.',
      change: 'Change Applied force while Mass stays fixed.',
      observe: 'Observe Net force and Acceleration in the meters below.',
      explain: 'Explain why a larger unbalanced force changes motion faster.',
    },
    {
      topic: 'Mass resists change',
      predict: 'Predict which cart accelerates less with the same push.',
      change: 'Change Mass, then run the same force again.',
      observe: 'Observe Acceleration shrink as Mass grows.',
      explain: 'Explain how inertia makes a heavier cart harder to speed up.',
    },
  ],
  'friction-slope': [
    {
      topic: 'Friction steals push',
      predict: 'Predict when friction will stop the cart from moving.',
      change: 'Change Friction from slick to rough.',
      observe: 'Observe Friction, Net force, and Speed update.',
      explain: 'Explain why friction points opposite motion or the attempted slide.',
    },
    {
      topic: 'Slope and gravity',
      predict: 'Predict whether a steeper slope helps or fights the push.',
      change: 'Change Slope uphill and downhill.',
      observe: 'Observe Downhill pull and Acceleration change sign or size.',
      explain: 'Explain how gravity has a along-track part only on a slope.',
    },
  ],
  'gravity-weight': [
    {
      topic: 'Gravity changes weight',
      predict: 'Predict what happens to weight on the Moon versus Earth.',
      change: 'Change Gravity while Mass stays the same.',
      observe: 'Observe Weight or Downhill pull update in newtons.',
      explain: 'Explain why weight changes but mass does not.',
    },
    {
      topic: 'Mass and gravity together',
      predict: 'Predict which change makes weight larger: more mass or more gravity.',
      change: 'Change Mass, then change Gravity.',
      observe: 'Observe Weight = mass x gravity respond to both controls.',
      explain: 'Explain why both kilograms and gravity strength set the force you feel.',
    },
  ],
  'motion-measure': [
    {
      topic: 'Speed vs velocity',
      predict: 'Predict when speed and velocity will show the same number.',
      change: 'Change Applied force direction or let the cart bounce back.',
      observe: 'Observe Speed stays positive while Velocity can become negative.',
      explain: 'Explain why velocity needs direction and speed does not.',
    },
    {
      topic: 'Distance vs displacement',
      predict: 'Predict which number keeps growing after the cart backtracks.',
      change: 'Change force, run, and let the cart return toward the start.',
      observe: 'Observe Distance count the path while Displacement tracks position from origin.',
      explain: 'Explain why a long trip can end with small displacement.',
    },
  ],
  'momentum-energy': [
    {
      topic: 'Momentum and stopping',
      predict: 'Predict which cart is harder to stop at the same velocity.',
      change: 'Change Mass, then compare the momentum stack.',
      observe: 'Observe Momentum grow with mass and velocity.',
      explain: 'Explain why momentum uses direction but also depends on mass.',
    },
    {
      topic: 'Kinetic energy',
      predict: 'Predict whether speed or mass changes kinetic energy more sharply.',
      change: 'Change Applied force to build speed, then change Mass.',
      observe: 'Observe Kinetic energy and Speed in the live readout.',
      explain: 'Explain why faster motion stores more energy for a collision or stop.',
    },
  ],
}

function controlImpactLabels(controls: MechanicsControls) {
  const physics = computePhysics({ position: START_POSITION, velocity: 0.2, acceleration: 0, time: 0, distance: 0 }, controls)
  return {
    force: `changes net force now: ${physics.netForce.toFixed(1)} N`,
    mass: `changes acceleration now: ${physics.acceleration.toFixed(2)} m/s2`,
    friction: `changes friction limit now: ${physics.frictionMax.toFixed(1)} N`,
    slope: `changes downhill pull now: ${physics.gravityAlongTrack.toFixed(1)} N`,
    gravity: `changes weight now: ${(controls.mass * controls.gravity).toFixed(0)} N`,
  }
}

const COMPONENT_ICONS: Record<string, LucideIcon> = {
  acceleration: Gauge,
  displacement: MoveRight,
  distance: Timer,
  force: Zap,
  friction: Wind,
  gravity: ArrowDown,
  mass: Weight,
  momentum: Activity,
  'normal-force': ArrowRight,
  position: Scale,
  speed: Gauge,
  velocity: MoveRight,
  weight: Weight,
}

const COMPARE_TARGET: Record<string, string> = {
  acceleration: 'velocity',
  displacement: 'distance',
  distance: 'displacement',
  force: 'mass',
  friction: 'force',
  gravity: 'weight',
  mass: 'weight',
  momentum: 'velocity',
  'normal-force': 'weight',
  position: 'displacement',
  speed: 'velocity',
  velocity: 'speed',
  weight: 'mass',
}

const hierarchy = HIERARCHY.physics
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'mechanics')

function mechanicsMode(componentId: string): MechanicsMode {
  if (componentId === 'friction' || componentId === 'normal-force') return 'friction-slope'
  if (componentId === 'gravity' || componentId === 'weight' || componentId === 'mass') return 'gravity-weight'
  if (componentId === 'momentum') return 'momentum-energy'
  if (componentId === 'position' || componentId === 'distance' || componentId === 'displacement' || componentId === 'speed' || componentId === 'velocity') return 'motion-measure'
  return 'force-motion'
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// Shared Y-yaw applied to the whole MechanicsRig group (see safeDefaultDistanceForAspect /
// applyDefaultFraming below, and the group rotation in MechanicsRig).
const DEFAULT_RIG_YAW = -0.25
// Wave 15 fix (motion-measure prop clustering, docs/reviews/wave14-COMBINED.md P1 #8): in
// motion-measure mode, TrackedBaseball rides the cart's exact x position (sim.position) and is
// differentiated from the cart *only* by a 0.85 world-unit Z (depth) offset - there is zero
// native x-separation to lean on for that pair. At the shared -0.25 rad yaw, a pure depth
// difference like that barely turns into on-screen horizontal separation at this scene's default
// camera distance (~7-13 units out), so the cart and baseball read as one cluster even though
// their true coordinates are already apart (see mechanicsPropPositions.test.ts, which only
// guards the baseball/tape pair's raw (x, z) separation - the cart/baseball pair's near-zero x
// delta isn't covered by that test at all). A steeper yaw converts more of that same depth
// separation into visible screen-space spread without moving a single prop coordinate. Kept
// mode-scoped (not applied to force-motion/friction-slope/gravity-weight/momentum-energy) so
// those modes' existing camera framing is untouched.
const MOTION_MEASURE_RIG_YAW = -0.42

/** The Y-yaw the MechanicsRig group (and, consistently, the default-framing distance math below)
 * should use for a given mode. Only motion-measure diverges from the shared default - see
 * MOTION_MEASURE_RIG_YAW above for why. */
function rigYawForMode(mode: MechanicsMode) {
  return mode === 'motion-measure' ? MOTION_MEASURE_RIG_YAW : DEFAULT_RIG_YAW
}

// --- Camera control helpers (Wave 11 fix) -----------------------------------------------
// OrbitControls owns the live camera every frame once mounted, so pushing a new
// `cameraDistance` through the Canvas `camera` prop after first mount is a no-op (see
// docs/reviews/wave10-mechanics.md P1 #1). These helpers instead read/write the mounted
// OrbitControls instance directly via its ref, and are the only place that moves the
// live camera for the toolbar's Zoom In / Zoom Out / Full / Reset buttons.

/** Moves the camera along the existing target->camera ray to a new distance and asks
 * OrbitControls to re-derive its internal spherical state from that position. Native
 * mouse-wheel/drag interaction is untouched - this only fires from explicit button clicks. */
function dollyOrbitControls(controls: OrbitControlsImpl, distance: number, min: number, max: number) {
  const clamped = clamp(distance, min, max)
  const camera = controls.object
  const offset = camera.position.clone().sub(controls.target)
  if (offset.lengthSq() < 1e-6) offset.set(0, 0, 1)
  offset.setLength(clamped)
  camera.position.copy(controls.target).add(offset)
  controls.update()
  return clamped
}

/** Calibrated so the cart plus its longest force-arrow label (Applied Force near its 30N
 * extreme) stays inside frame across the cart's full +/-TRACK_LIMIT excursion, accounting
 * for MechanicsRig's own Y-rotation (which pulls +x content noticeably closer to
 * the camera - see rigYawForMode) and the ResponsiveMechanicsGroup scale tiers (0.54 / 0.7 / 0.9
 * by aspect). A heuristic, not a pixel-exact fit - see docs/reviews/wave10-mechanics.md P1 #2.
 * `mode` defaults to force-motion's shared yaw so every existing caller keeps its prior framing;
 * only motion-measure's steeper yaw (Wave 15 fix, see MOTION_MEASURE_RIG_YAW) changes the result,
 * and even then the required distance barely moves (a larger yaw trades some of the x-coverage
 * term for the z-coverage term at roughly the same total), so the full +/-TRACK_LIMIT race
 * excursion still stays safely framed in motion-measure mode too. */
function safeDefaultDistanceForAspect(aspect: number, mode: MechanicsMode = 'force-motion') {
  const scale = aspect < 0.7 ? 0.54 : aspect < 1 ? 0.7 : 0.9
  const rotY = Math.abs(rigYawForMode(mode))
  const worstCaseHalfExtent = 4 // unscaled local x-reach: cart near TRACK_LIMIT + long force arrow + label
  const xScaled = worstCaseHalfExtent * Math.cos(rotY) * scale
  const zScaled = worstCaseHalfExtent * Math.sin(rotY) * scale
  const halfFovV = (CAMERA_FOV_DEG * Math.PI) / 360
  const tanHalfFovH = Math.tan(halfFovV) * Math.max(aspect, 0.01)
  const required = zScaled + xScaled / tanHalfFovH
  return clamp(required, DEFAULT_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)
}

/** Restores the "home" framing (target at origin, camera on the +Z axis) at a distance
 * safe for the live canvas aspect ratio. Used both right after OrbitControls mounts (the
 * canvas aspect isn't known before then) and by the Reset button. `mode` keeps the distance
 * formula's yaw assumption in sync with MechanicsRig's actual rendered yaw (see rigYawForMode);
 * omitting it falls back to the original force-motion framing. */
function applyDefaultFraming(controls: OrbitControlsImpl, mode: MechanicsMode = 'force-motion') {
  const camera = controls.object as THREE.PerspectiveCamera
  const aspect = camera.aspect || 1
  const distance = safeDefaultDistanceForAspect(aspect, mode)
  controls.target.set(0, 0, 0)
  camera.position.set(0, 1.55, distance)
  controls.update()
  return distance
}

function computePhysics(state: SimState, controls: MechanicsControls) {
  const slopeRad = (controls.slope * Math.PI) / 180
  const gravityAlongTrack = controls.mass * controls.gravity * Math.sin(slopeRad)
  const normalForce = Math.max(0.1, controls.mass * controls.gravity * Math.cos(slopeRad))
  const frictionMax = controls.friction * normalForce
  const drive = controls.force + gravityAlongTrack
  const moving = Math.abs(state.velocity) > 0.015
  let frictionForce = 0

  if (moving) {
    frictionForce = -Math.sign(state.velocity) * frictionMax
  } else if (Math.abs(drive) <= frictionMax) {
    frictionForce = -drive
  } else {
    frictionForce = -Math.sign(drive) * frictionMax
  }

  const netForce = drive + frictionForce
  return {
    gravityAlongTrack,
    normalForce,
    frictionForce,
    frictionMax,
    netForce,
    acceleration: netForce / controls.mass,
  }
}

function stepOnce(state: SimState, controls: MechanicsControls, dt: number): SimState {
  const physics = computePhysics(state, controls)
  let velocity = state.velocity + physics.acceleration * dt
  let position = state.position + velocity * dt
  let distance = state.distance + Math.abs(velocity * dt)
  if (Math.abs(velocity) < 0.015 && Math.abs(physics.netForce) < 0.02) velocity = 0
  if (position >= TRACK_LIMIT || position <= -TRACK_LIMIT) {
    position = clamp(position, -TRACK_LIMIT, TRACK_LIMIT)
    velocity *= -0.18
    distance += 0.08
  }
  return { position, velocity, acceleration: physics.acceleration, time: state.time + dt, distance }
}

function mechanicsReadout(componentId: string, sim: SimState, controls: MechanicsControls) {
  const forces = computePhysics(sim, controls)
  const speed = Math.abs(sim.velocity)
  const weight = controls.mass * controls.gravity
  const momentum = controls.mass * sim.velocity
  const kineticEnergy = 0.5 * controls.mass * speed * speed
  const displacement = sim.position

  switch (componentId) {
    case 'acceleration':
      return {
        title: 'Acceleration challenge',
        primaryLabel: 'Net force',
        primaryValue: `${forces.netForce.toFixed(1)} N`,
        resultLabel: 'Acceleration',
        resultValue: `${forces.acceleration.toFixed(2)} m/s2`,
        secondLabel: 'Mass',
        secondValue: `${controls.mass} kg`,
        explanation: 'Acceleration changes when net force changes or mass changes. Same force, bigger mass means slower acceleration.',
      }
    case 'friction':
      return {
        title: 'Friction challenge',
        primaryLabel: 'Friction',
        primaryValue: `${Math.abs(forces.frictionForce).toFixed(1)} N`,
        resultLabel: 'Speed',
        resultValue: `${speed.toFixed(2)} m/s`,
        secondLabel: 'Surface',
        secondValue: controls.friction > 0.45 ? 'rough' : controls.friction > 0.18 ? 'grippy' : 'slick',
        explanation: 'Friction pushes opposite motion. A rougher surface steals more of the applied force before the cart can speed up.',
      }
    case 'gravity':
      return {
        title: 'Gravity challenge',
        primaryLabel: 'Gravity',
        primaryValue: `${controls.gravity.toFixed(1)} m/s2`,
        resultLabel: 'Downhill pull',
        resultValue: `${forces.gravityAlongTrack.toFixed(1)} N`,
        secondLabel: 'Slope',
        secondValue: `${controls.slope} deg`,
        explanation: 'Gravity pulls downward. On a slope, part of that pull acts along the track and changes the cart motion.',
      }
    case 'mass':
      return {
        title: 'Mass challenge',
        primaryLabel: 'Mass',
        primaryValue: `${controls.mass} kg`,
        resultLabel: 'Acceleration',
        resultValue: `${forces.acceleration.toFixed(2)} m/s2`,
        secondLabel: 'Weight',
        secondValue: `${weight.toFixed(0)} N`,
        explanation: 'Mass is how much matter resists acceleration. More mass also means more weight in the same gravity.',
      }
    case 'momentum':
      return {
        title: 'Momentum challenge',
        primaryLabel: 'Momentum',
        primaryValue: `${momentum.toFixed(1)} kg m/s`,
        resultLabel: 'Kinetic energy',
        resultValue: `${kineticEnergy.toFixed(1)} J`,
        secondLabel: 'Speed',
        secondValue: `${speed.toFixed(2)} m/s`,
        explanation: 'Momentum grows with mass and velocity. A heavy cart at the same speed is harder to stop.',
      }
    case 'normal-force':
      return {
        title: 'Support force challenge',
        primaryLabel: 'Normal force',
        primaryValue: `${forces.normalForce.toFixed(1)} N`,
        resultLabel: 'Friction limit',
        resultValue: `${forces.frictionMax.toFixed(1)} N`,
        secondLabel: 'Slope',
        secondValue: `${controls.slope} deg`,
        explanation: 'The track pushes perpendicular to the cart. That support force sets how much friction the surface can provide.',
      }
    case 'weight':
      return {
        title: 'Weight challenge',
        primaryLabel: 'Weight',
        primaryValue: `${weight.toFixed(0)} N`,
        resultLabel: 'Gravity',
        resultValue: `${controls.gravity.toFixed(1)} m/s2`,
        secondLabel: 'Mass',
        secondValue: `${controls.mass} kg`,
        explanation: 'Weight is a force: mass times gravity. Move the gravity slider and weight changes while mass stays the same.',
      }
    case 'distance':
      return {
        title: 'Distance challenge',
        primaryLabel: 'Distance',
        primaryValue: `${sim.distance.toFixed(2)} m`,
        resultLabel: 'Position',
        resultValue: `${sim.position.toFixed(2)} m`,
        secondLabel: 'Path',
        secondValue: sim.distance > Math.abs(displacement) + 0.2 ? 'backtracked' : 'direct',
        explanation: 'Distance counts the whole path traveled. It can grow even when the cart returns near the starting point.',
      }
    case 'displacement':
      return {
        title: 'Displacement challenge',
        primaryLabel: 'Displacement',
        primaryValue: `${displacement.toFixed(2)} m`,
        resultLabel: 'Distance',
        resultValue: `${sim.distance.toFixed(2)} m`,
        secondLabel: 'Direction',
        secondValue: displacement > 0.05 ? 'right' : displacement < -0.05 ? 'left' : 'origin',
        explanation: 'Displacement compares start and finish positions. Direction matters; returning to start makes displacement zero.',
      }
    case 'speed':
      return {
        title: 'Speed challenge',
        primaryLabel: 'Speed',
        primaryValue: `${speed.toFixed(2)} m/s`,
        resultLabel: 'Velocity',
        resultValue: `${sim.velocity.toFixed(2)} m/s`,
        secondLabel: 'Direction',
        secondValue: sim.velocity >= 0 ? 'right' : 'left',
        explanation: 'Speed tells how fast. Velocity tells how fast and which direction.',
      }
    case 'velocity':
      return {
        title: 'Velocity challenge',
        primaryLabel: 'Velocity',
        primaryValue: `${sim.velocity.toFixed(2)} m/s`,
        resultLabel: 'Speed',
        resultValue: `${speed.toFixed(2)} m/s`,
        secondLabel: 'Sign',
        secondValue: sim.velocity >= 0 ? 'positive' : 'negative',
        explanation: 'Velocity includes direction. A negative value means moving left along the track.',
      }
    case 'position':
      return {
        title: 'Position challenge',
        primaryLabel: 'Position',
        primaryValue: `${sim.position.toFixed(2)} m`,
        resultLabel: 'Origin',
        resultValue: '0 m',
        secondLabel: 'Time',
        secondValue: `${sim.time.toFixed(1)} s`,
        explanation: 'Position is where the cart is compared with a chosen origin. Change the motion and watch the position marker move.',
      }
    default:
      return {
        title: 'Force challenge',
        primaryLabel: 'Applied force',
        primaryValue: `${controls.force} N`,
        resultLabel: 'Net force',
        resultValue: `${forces.netForce.toFixed(1)} N`,
        secondLabel: 'Acceleration',
        secondValue: `${forces.acceleration.toFixed(2)} m/s2`,
        explanation: 'Forces change motion only through net force. Friction and gravity can help or fight the applied push.',
      }
  }
}

// --- Lesson/quiz copy sanitizer (Wave 11 fix) -------------------------------------------
// Lesson copy generated by the content pipeline (src/data/generated/mechanics.ts,
// "@generated - do not edit by hand") references hotspot ids inline, e.g. "Tap
// `hs-force-arrows` to label...". LessonModal/QuizModal render that text verbatim with no
// markdown parsing, so the raw internal slug leaks straight to the learner (see
// docs/reviews/wave10-mechanics.md P1 #4, confirmed systemic across all 13 mechanics
// components' lesson steps). Since mechanics.ts is generated and LessonModal/QuizModal are
// shared components out of this file's scope, this swaps each `hs-*` reference for the
// matching hotspot's authored human-readable `label` before any copy reaches those
// components, falling back to a humanized version of the slug itself if a component ever
// references an id its own hotspots list doesn't define.
const HOTSPOT_SLUG_PATTERN = /`?\b(hs-[a-z0-9]+(?:-[a-z0-9]+)*)\b`?/g

function humanizeHotspotSlug(slug: string): string {
  return slug.replace(/^hs-/, '').replace(/-/g, ' ')
}

function sanitizeHotspotSlugs(text: string, hotspots: Hotspot[]): string {
  if (!text || !text.includes('hs-')) return text
  const labelById = new Map(hotspots.map((hotspot) => [hotspot.id, hotspot.label]))
  return text.replace(HOTSPOT_SLUG_PATTERN, (_match, slug: string, offset: number, full: string) => {
    const label = labelById.get(slug) ?? humanizeHotspotSlug(slug)
    // Some authored copy already reads "...Spot the `hs-negative-arrow` note..." - don't turn
    // that into a doubled "the the reverse arrow note" when a determiner already precedes the slug.
    const alreadyHasDeterminer = /\b(?:the|a|an)\s*$/i.test(full.slice(0, offset))
    return alreadyHasDeterminer ? label.toLowerCase() : `the ${label.toLowerCase()}`
  })
}

function sanitizeLessonContent(content: ComponentContent): ComponentContent {
  const hotspots = content.hotspots
  const sanitizeText = (text: string) => sanitizeHotspotSlugs(text, hotspots)
  return {
    ...content,
    lesson: {
      steps: content.lesson.steps.map((step) => ({
        title: sanitizeText(step.title),
        body: sanitizeText(step.body),
      })),
      predictionPrompt: sanitizeText(content.lesson.predictionPrompt),
      practiceItem: sanitizeText(content.lesson.practiceItem),
      checkpoint: sanitizeText(content.lesson.checkpoint),
    },
    quiz: content.quiz.map((question) => ({
      prompt: sanitizeText(question.prompt),
      options: question.options.map(sanitizeText),
      correctIndex: question.correctIndex,
      explanation: sanitizeText(question.explanation),
      misconception: sanitizeText(question.misconception),
    })),
  }
}

export default function PhysicsLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [controls, setControls] = useState<MechanicsControls>({
    force: 9,
    mass: 5,
    friction: 0.18,
    slope: 4,
    gravity: 9.8,
  })
  const [sim, setSim] = useState<SimState>({
    position: START_POSITION,
    velocity: 0,
    acceleration: 0,
    time: 0,
    distance: 0,
  })
  const [simB, setSimB] = useState<SimState>({
    position: START_POSITION,
    velocity: 0,
    acceleration: 0,
    time: 0,
    distance: 0,
  })
  const [history, setHistory] = useState<HistoryPoint[]>([
    { t: 0, position: START_POSITION, velocity: 0, velocityB: 0 },
  ])
  const [prediction, setPrediction] = useState<PredictionState>({ choice: null, running: false, result: null })
  const simRef = useRef(sim)
  const simBRef = useRef(simB)
  const controlsRef = useRef(controls)
  const predictionRef = useRef(prediction)
  const accumulator = useRef(0)
  // Live OrbitControls instance + the group wrapping the rendered scene content, used by
  // zoomIn/zoomOut/fitView/reset below to drive the camera imperatively (see the camera
  // control helpers above this component).
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null)
  const sceneGroupRef = useRef<THREE.Group | null>(null)
  simRef.current = sim
  simBRef.current = simB
  controlsRef.current = controls
  predictionRef.current = prediction

  const content = mechanicsById[componentId] ?? mechanicsById[DEFAULT_COMPONENT_ID] ?? mechanics[0]
  const readout = useMemo(() => mechanicsReadout(componentId, sim, controls), [componentId, sim, controls])
  const mode = mechanicsMode(componentId)
  const compareTarget = COMPARE_TARGET[componentId]
    ? (mechanicsById[COMPARE_TARGET[componentId]] ?? resolveContent(COMPARE_TARGET[componentId]))
    : content.compareCandidate
      ? resolveContent(content.compareCandidate)
      : null
  const activeHotspot = useMemo(
    () => content.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const enhancedContent: ComponentContent = useMemo(() => {
    const sanitized = sanitizeLessonContent(content)
    return {
      ...sanitized,
      compareCandidate: COMPARE_TARGET[componentId] ?? sanitized.compareCandidate,
      keyFacts: [
        { label: readout.primaryLabel, value: readout.primaryValue },
        { label: readout.resultLabel, value: readout.resultValue },
        { label: readout.secondLabel, value: readout.secondValue },
        { label: 'Cause/effect', value: readout.explanation },
        ...sanitized.keyFacts.slice(0, 4),
      ],
    }
  }, [componentId, content, readout])

  const tick = useCallback((delta: number) => {
    accumulator.current += delta
    const steps = Math.floor(accumulator.current / RACE_STEP)
    if (steps <= 0) return
    accumulator.current -= steps * RACE_STEP

    let next = simRef.current
    let nextB = simBRef.current
    const liveControls = controlsRef.current
    const referenceControls: MechanicsControls = { ...liveControls, mass: REFERENCE_MASS }
    for (let i = 0; i < steps; i += 1) {
      next = stepOnce(next, liveControls, RACE_STEP)
      nextB = stepOnce(nextB, referenceControls, RACE_STEP)
    }
    simRef.current = next
    simBRef.current = nextB
    setSim(next)
    setSimB(nextB)
    setHistory((items) => {
      const nextItems = [...items, { t: next.time, position: next.position, velocity: next.velocity, velocityB: nextB.velocity }]
      return nextItems.slice(-MAX_HISTORY)
    })

    if (predictionRef.current.running) {
      const settled = Math.abs(next.velocity) < 0.02 && Math.abs(nextB.velocity) < 0.02 && next.time > 0.4
      const hitLimit = Math.abs(next.position) >= TRACK_LIMIT - 0.01 || Math.abs(nextB.position) >= TRACK_LIMIT - 0.01
      const timedOut = next.time > 6
      if (settled || hitLimit || timedOut) {
        const travelA = Math.abs(next.position - START_POSITION)
        const travelB = Math.abs(nextB.position - START_POSITION)
        const diff = travelA - travelB
        const winner: PredictionChoice = Math.abs(diff) < 0.06 ? 'tie' : diff > 0 ? 'mine' : 'reference'
        const resolved: PredictionState = {
          choice: predictionRef.current.choice,
          running: false,
          result: { winner, match: winner === predictionRef.current.choice },
        }
        predictionRef.current = resolved
        setPrediction(resolved)
        setAnimationPlaying(false)
      }
    }
  }, [])

  const resetPrediction = () => {
    const cleared: PredictionState = { choice: null, running: false, result: null }
    predictionRef.current = cleared
    setPrediction(cleared)
  }

  const selectComponent = (id: string) => {
    setComponentId(id)
    setActiveHotspotId(null)
    setIsolateActive(false)
    setControlsOpen(false)
    resetPrediction()
  }

  const reset = () => {
    const resetState = { position: START_POSITION, velocity: 0, acceleration: 0, time: 0, distance: 0 }
    accumulator.current = 0
    simRef.current = resetState
    simBRef.current = resetState
    setSim(resetState)
    setSimB(resetState)
    setHistory([{ t: 0, position: START_POSITION, velocity: 0, velocityB: 0 }])
    setAutoRotate(false)
    const orbit = orbitControlsRef.current
    setCameraDistance(orbit ? applyDefaultFraming(orbit, mode) : DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(false)
    setCleanView(false)
    setControlsOpen(false)
    resetPrediction()
  }

  // Toolbar-driven camera actions. OrbitControls owns the live camera every frame once
  // mounted, so these read/write the mounted instance directly via orbitControlsRef instead
  // of relying on the Canvas `camera` prop (which only applies once, at first mount).
  const zoomIn = () => {
    const orbit = orbitControlsRef.current
    if (!orbit) return
    const next = dollyOrbitControls(orbit, orbit.getDistance() - ZOOM_STEP, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)
    setCameraDistance(Number(next.toFixed(2)))
  }

  const zoomOut = () => {
    const orbit = orbitControlsRef.current
    if (!orbit) return
    const next = dollyOrbitControls(orbit, orbit.getDistance() + ZOOM_STEP, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)
    setCameraDistance(Number(next.toFixed(2)))
  }

  // "Full" / Fit View: bounds-based - measures the actual rendered scene content (track,
  // cart wherever it currently sits, force arrows, props) via a live Box3 and picks a
  // distance that fits its bounding sphere, rather than jumping to a fixed constant.
  const fitView = () => {
    const orbit = orbitControlsRef.current
    if (!orbit) return
    let targetDistance = DEFAULT_CAMERA_DISTANCE
    const group = sceneGroupRef.current
    if (group) {
      const box = new THREE.Box3().setFromObject(group)
      if (!box.isEmpty()) {
        const sphere = box.getBoundingSphere(new THREE.Sphere())
        const camera = orbit.object as THREE.PerspectiveCamera
        const fovRad = ((camera.fov ?? CAMERA_FOV_DEG) * Math.PI) / 180
        const paddedRadius = sphere.radius * 1.2 + 0.15
        targetDistance = paddedRadius / Math.sin(fovRad / 2)
      }
    }
    const next = dollyOrbitControls(orbit, targetDistance, MIN_CAMERA_DISTANCE, MAX_CAMERA_DISTANCE)
    setCameraDistance(Number(next.toFixed(2)))
  }

  const startRace = () => {
    if (!prediction.choice) return
    const resetState = { position: START_POSITION, velocity: 0, acceleration: 0, time: 0, distance: 0 }
    accumulator.current = 0
    simRef.current = resetState
    simBRef.current = resetState
    setSim(resetState)
    setSimB(resetState)
    setHistory([{ t: 0, position: START_POSITION, velocity: 0, velocityB: 0 }])
    const running: PredictionState = { choice: prediction.choice, running: true, result: null }
    predictionRef.current = running
    setPrediction(running)
    setAnimationPlaying(true)
  }

  const choosePrediction = (choice: PredictionChoice) => {
    const next: PredictionState = { choice, running: false, result: null }
    predictionRef.current = next
    setPrediction(next)
  }

  const firstControlsRender = useRef(true)
  useEffect(() => {
    if (firstControlsRender.current) {
      firstControlsRender.current = false
      return
    }
    resetPrediction()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controls])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Physics"
            subjectColor="var(--color-physics-deep)"
            defaultIcon={Activity}
            branchName="Mechanics"
            items={mechanics.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.system,
              icon: COMPONENT_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship mechanics lab: change force, mass, friction, slope, and gravity to see motion respond."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => {
              setIsolateActive((value) => !value)
              if (!isolateActive && !activeHotspotId) setActiveHotspotId(content.hotspots[0]?.id ?? null)
            }}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((value) => !value)}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={fitView}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-2 text-center text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:py-1.5 sm:text-[11px]">
              Mechanics - change a cause, watch motion respond
            </div>
          </div>

          <MechanicsScene
            componentId={componentId}
            mode={mode}
            content={content}
            sim={sim}
            simB={simB}
            raceActive={prediction.choice !== null}
            controls={controls}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={setActiveHotspotId}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            orbitControlsRef={orbitControlsRef}
            sceneGroupRef={sceneGroupRef}
            onDistanceChange={setCameraDistance}
            history={history}
            onTick={tick}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2.5 sm:gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={readout.primaryLabel} value={readout.primaryValue} />
                  <Meter label={readout.resultLabel} value={readout.resultValue} />
                  <Meter label={readout.secondLabel} value={readout.secondValue} />
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune mechanics
                </button>
              </div>
            ) : (
              <TunePanel
                readout={readout}
                mode={mode}
                controls={controls}
                setControls={setControls}
                prediction={prediction}
                onPredict={choosePrediction}
                onRunRace={startRace}
                onClose={() => setControlsOpen(false)}
              />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Component switcher for every screen size, including mobile, where the desktop
              ContentNav list in the left aside is hidden (lg:block only). Tapping a chip calls
              the same selectComponent handler the desktop ContentNav's onSelect already calls,
              so tune/prediction state, hotspot state, and the sim readouts all refocus exactly
              like the desktop path. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {mechanics.findIndex((item) => item.id === componentId) + 1} of {mechanics.length}
            </p>
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1">
              {mechanics.map((item) => {
                const active = item.id === componentId
                const Icon = COMPONENT_ICONS[item.id] ?? Activity
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectComponent(item.id)}
                    title={item.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-physics-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-physics-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-physics-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[8rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2.5 py-2.5 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3 sm:py-2">
      <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

function TunePanel({
  readout,
  mode,
  controls,
  setControls,
  prediction,
  onPredict,
  onRunRace,
  onClose,
}: {
  readout: ReturnType<typeof mechanicsReadout>
  mode: MechanicsMode
  controls: MechanicsControls
  setControls: Dispatch<SetStateAction<MechanicsControls>>
  prediction: PredictionState
  onPredict: (choice: PredictionChoice) => void
  onRunRace: () => void
  onClose: () => void
}) {
  const question = predictionQuestion(mode, controls.mass)
  const missions = MECHANICS_MISSIONS[mode]
  const impacts = controlImpactLabels(controls)
  const update = (patch: Partial<MechanicsControls>) => setControls((value) => ({ ...value, ...patch }))

  return (
    <div className="relative grid max-h-[42svh] gap-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm sm:max-h-none sm:overflow-visible">
      {/* Scroll affordance: this panel scrolls on small screens (max-h-[42svh] + overflow-y-auto
          above); a bare scroll area has no visible cue that more controls sit below the fold, so
          hint it with a bottom fade. Not shown once sm:max-h-none removes the scroll. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-[var(--radius-lg)] bg-gradient-to-t from-[color:var(--color-surface-raised)] to-transparent sm:hidden" />
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{readout.title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide mechanics controls"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs font-semibold text-[color:var(--color-foreground)]">{question}</p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {PREDICTION_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onPredict(option.id)}
              disabled={prediction.running}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                prediction.choice === option.id
                  ? 'border-[color:var(--color-physics-deep)] bg-[color:var(--color-physics-deep)]/12 text-[color:var(--color-physics-deep)]'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]'
              }`}
            >
              {option.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onRunRace}
            disabled={!prediction.choice || prediction.running}
            className="ml-auto inline-flex items-center gap-1 rounded-full bg-[color:var(--color-physics-deep)] px-3.5 py-1.5 text-xs font-semibold text-[color:var(--color-surface-raised)] disabled:opacity-40"
          >
            {prediction.running ? 'Racing...' : 'Run the race'}
          </button>
        </div>
        {prediction.result && (
          <p
            className={`mt-2 text-xs font-semibold ${
              prediction.result.match ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {prediction.result.match ? 'Prediction matched! ' : 'Not quite - '}
            You said "{predictionOptionLabel(prediction.choice)}", the race result was "{predictionOptionLabel(prediction.result.winner)}".
          </p>
        )}
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{readout.explanation}</p>
      </div>
      <div className="grid gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2" data-critical-thinking-missions>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Critical thinking missions</p>
          <p className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-ink-500)]">
            {readout.primaryLabel}: {readout.primaryValue}
          </p>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          {missions.map((mission) => (
            <section key={mission.topic} className="min-w-0 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-2.5 py-2">
              <h3 className="text-xs font-semibold text-[color:var(--color-foreground)]">{mission.topic}</h3>
              <dl className="mt-1 grid gap-1 text-[11px] leading-snug text-[color:var(--color-ink-500)]">
                <div className="grid grid-cols-[4.8rem_1fr] gap-1">
                  <dt className="font-semibold text-[color:var(--color-foreground)]">Predict</dt>
                  <dd>{mission.predict}</dd>
                </div>
                <div className="grid grid-cols-[4.8rem_1fr] gap-1">
                  <dt className="font-semibold text-[color:var(--color-foreground)]">Change</dt>
                  <dd>{mission.change}</dd>
                </div>
                <div className="grid grid-cols-[4.8rem_1fr] gap-1">
                  <dt className="font-semibold text-[color:var(--color-foreground)]">Observe</dt>
                  <dd>{mission.observe}</dd>
                </div>
                <div className="grid grid-cols-[4.8rem_1fr] gap-1">
                  <dt className="font-semibold text-[color:var(--color-foreground)]">Explain</dt>
                  <dd>{mission.explain}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <RangeControl label="Applied force" value={controls.force} min={-30} max={30} step={1} valueText={`${controls.force} N`} impactText={impacts.force} onChange={(force) => update({ force })} />
        <RangeControl label="Mass" value={controls.mass} min={1} max={20} step={1} valueText={`${controls.mass} kg`} impactText={impacts.mass} onChange={(mass) => update({ mass })} />
        <RangeControl label="Friction" value={controls.friction} min={0} max={0.7} step={0.01} valueText={controls.friction.toFixed(2)} impactText={impacts.friction} onChange={(friction) => update({ friction })} />
        <RangeControl label="Slope" value={controls.slope} min={-20} max={20} step={1} valueText={`${controls.slope} deg`} impactText={impacts.slope} onChange={(slope) => update({ slope })} />
        <RangeControl label="Gravity" value={controls.gravity} min={1.6} max={12} step={0.1} valueText={`${controls.gravity.toFixed(1)} m/s2`} impactText={impacts.gravity} onChange={(gravity) => update({ gravity })} />
      </div>
    </div>
  )
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  valueText,
  impactText,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  valueText: string
  impactText: string
  onChange: (value: number) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-xs font-medium text-[color:var(--color-ink-500)]">
        {label} <span className="font-[family-name:var(--font-mono)]">{valueText}</span>
      </span>
      <input
        className="w-full accent-[color:var(--color-physics-deep)]"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="mt-1 block text-[11px] leading-tight text-[color:var(--color-ink-500)]">{impactText}</span>
    </label>
  )
}

function MechanicsScene({
  componentId,
  mode,
  content,
  sim,
  simB,
  raceActive,
  controls,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  orbitControlsRef,
  sceneGroupRef,
  onDistanceChange,
  history,
  onTick,
}: {
  componentId: string
  mode: MechanicsMode
  content: ComponentContent
  sim: SimState
  simB: SimState
  raceActive: boolean
  controls: MechanicsControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  orbitControlsRef: RefObject<OrbitControlsImpl | null>
  sceneGroupRef: RefObject<THREE.Group | null>
  onDistanceChange: (distance: number) => void
  history: HistoryPoint[]
  onTick: (delta: number) => void
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ display: 'block', height: '100%', width: '100%' }}
      camera={{ position: [0, 1.55, cameraDistance], fov: CAMERA_FOV_DEG }}
      dpr={[1, 2]}
      onPointerMissed={() => onSelectHotspot(null)}
    >
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 6, 5]} intensity={1.08} />
      <directionalLight position={[-4, 3, 2]} intensity={0.42} color="#D8EAFF" />
      <OrbitControls
        ref={orbitControlsRef}
        enablePan={false}
        autoRotate={autoRotate}
        autoRotateSpeed={0.46}
        minDistance={NATIVE_MIN_DISTANCE}
        maxDistance={NATIVE_MAX_DISTANCE}
        onChange={() => {
          const live = orbitControlsRef.current
          if (live) onDistanceChange(Number(live.getDistance().toFixed(2)))
        }}
      />
      <InitialCameraFraming orbitControlsRef={orbitControlsRef} mode={mode} onFramed={onDistanceChange} />
      <AnimationDriver playing={animationPlaying} onTick={onTick} />
      <ResponsiveMechanicsGroup groupRef={sceneGroupRef}>
        <MechanicsRig
          componentId={componentId}
          content={content}
          sim={sim}
          simB={simB}
          raceActive={raceActive}
          controls={controls}
          activeHotspotId={activeHotspotId}
          onSelectHotspot={onSelectHotspot}
          labelsVisible={labelsVisible}
          xrayActive={xrayActive}
          isolateActive={isolateActive}
          history={history}
        />
      </ResponsiveMechanicsGroup>
    </Canvas>
  )
}

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  useFrame((_, delta) => {
    if (playing) onTick(delta)
  })
  return null
}

/** Runs once after OrbitControls mounts to correct the camera framing for the real canvas
 * aspect ratio, which isn't known yet when the Canvas `camera` prop is first evaluated (see
 * safeDefaultDistanceForAspect / docs/reviews/wave10-mechanics.md P1 #2). Also reports the
 * corrected distance back so the zoom-button disabled state stays accurate. */
function InitialCameraFraming({
  orbitControlsRef,
  mode,
  onFramed,
}: {
  orbitControlsRef: RefObject<OrbitControlsImpl | null>
  mode: MechanicsMode
  onFramed: (distance: number) => void
}) {
  const framed = useRef(false)
  useFrame(() => {
    if (framed.current) return
    const controls = orbitControlsRef.current
    if (!controls) return
    framed.current = true
    onFramed(applyDefaultFraming(controls, mode))
  })
  return null
}

function ResponsiveMechanicsGroup({ children, groupRef }: { children: ReactNode; groupRef: RefObject<THREE.Group | null> }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.54 : viewport.aspect < 1 ? 0.7 : 0.9
  return <group ref={groupRef} scale={scale} position={[0, -0.04, 0]}>{children}</group>
}

function MechanicsRig({
  componentId,
  content,
  sim,
  simB,
  raceActive,
  controls,
  activeHotspotId,
  onSelectHotspot,
  labelsVisible,
  xrayActive,
  isolateActive,
  history,
}: {
  componentId: string
  content: ComponentContent
  sim: SimState
  simB: SimState
  raceActive: boolean
  controls: MechanicsControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  history: HistoryPoint[]
}) {
  const physics = computePhysics(sim, controls)
  const slopeRad = (controls.slope * Math.PI) / 180
  const cartPosition: [number, number, number] = [sim.position, 0.18 + Math.sin(slopeRad) * sim.position, 0]
  const referenceCartPosition: [number, number, number] = [simB.position, 0.18 + Math.sin(slopeRad) * simB.position, 0.52]
  const focus = componentId
  const mode = mechanicsMode(componentId)
  const focused = (id: string) => !isolateActive || focus === id || activeHotspotId !== null
  const dim = (id: string) => !focused(id)
  // Wave 19 fix (this wave's QA task): motion-measure's Distance/Displacement/Speed/Velocity/
  // Position components share the scene with the full force/friction/gravity/momentum apparatus,
  // none of which is relevant to what those components teach. At default (non-isolate) framing
  // that whole apparatus rendered at full opacity right on top of the cart's rest position -
  // exactly where the tracked baseball and measuring tape also live - so the props a child is
  // meant to inspect were visually buried under unrelated force arrows and the momentum stack.
  // Dimming/hiding that apparatus specifically for motion-measure (independent of isolate mode)
  // lets the baseball/tape/track-marker cluster read as the clear focal point. Vector's own
  // `hidden={opacity < 0.4}` on its label (see ForceArrow/FrictionArrow) means dimming these also
  // auto-hides their floating text labels, which is what previously collided with the tape's
  // "tape reads" label (docs/reviews/wave16-mechanics.md P1 #2).
  const declutterForMeasure = mode === 'motion-measure'
  const measureReadout = declutterForMeasure ? mechanicsReadout(componentId, sim, controls) : null

  return (
    <group rotation={[-0.02, rigYawForMode(mode), 0]}>
      <Track slope={controls.slope} xrayActive={xrayActive} dim={dim('friction') || dim('normal-force')} />
      <ReferenceRail slope={controls.slope} />
      <Cart
        position={cartPosition}
        mass={controls.mass}
        velocity={sim.velocity}
        acceleration={sim.acceleration}
        dim={dim('mass')}
        onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)}
      />
      <Cart position={referenceCartPosition} mass={REFERENCE_MASS} velocity={simB.velocity} acceleration={simB.acceleration} dim={false} ghost />
      {(labelsVisible || raceActive) && (
        <SceneLabel text="reference cart - 5 kg" position={[referenceCartPosition[0], referenceCartPosition[1] + 0.34, referenceCartPosition[2]]} color={TEAL} small />
      )}
      <ForceArrow start={[cartPosition[0], cartPosition[1] + 0.42, 0]} value={controls.force} color={BLUE} label="applied force" labelsVisible={labelsVisible || focus === 'force'} dim={dim('force') || declutterForMeasure} />
      <ForceArrow start={[cartPosition[0], cartPosition[1] + 0.74, 0.02]} value={physics.netForce} color={GREEN} label="net force" labelsVisible={labelsVisible || focus === 'acceleration'} dim={dim('acceleration') || declutterForMeasure} />
      <FrictionArrow start={[cartPosition[0], cartPosition[1] + 0.08, 0.16]} value={physics.frictionForce} labelsVisible={labelsVisible || focus === 'friction'} dim={dim('friction') || declutterForMeasure} />
      <GravityNormalArrows
        cartPosition={cartPosition}
        controls={controls}
        physics={physics}
        labelsVisible={(labelsVisible || focus === 'gravity' || focus === 'weight' || focus === 'normal-force') && !declutterForMeasure}
        dimGravity={(dim('gravity') && dim('weight')) || declutterForMeasure}
        dimNormal={dim('normal-force') || declutterForMeasure}
      />
      <MotionMarkers
        sim={sim}
        labelsVisible={labelsVisible || focus === 'position' || focus === 'distance' || focus === 'displacement' || focus === 'speed' || focus === 'velocity'}
        showMeasureTool={mode === 'motion-measure'}
        readout={measureReadout}
      />
      <MomentumBlocks sim={sim} mass={controls.mass} active={focus === 'momentum'} dim={dim('momentum') || declutterForMeasure} />
      <GraphScreen history={history} active={focus === 'acceleration' || focus === 'velocity' || focus === 'speed'} />
      <Workbench labelsVisible={labelsVisible} />
      {content.hotspots.slice(0, 5).map((hotspot, index) => (
        <MechanicsHotspot
          key={hotspot.id}
          hotspot={hotspot}
          index={index}
          active={activeHotspotId === hotspot.id}
          labelsVisible={labelsVisible}
          dim={isolateActive && activeHotspotId !== null && activeHotspotId !== hotspot.id}
          onSelect={onSelectHotspot}
        />
      ))}
      <ComponentStrip content={content} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} />
    </group>
  )
}

function Track({ slope, xrayActive, dim }: { slope: number; xrayActive: boolean; dim: boolean }) {
  return (
    <group rotation={[0, 0, (slope * Math.PI) / 180]}>
      <mesh position={[0, 0, 0]} scale={[3.15, 0.06, 0.34]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={STONE} roughness={0.86} transparent={xrayActive || dim} opacity={dim ? 0.18 : xrayActive ? 0.42 : 1} />
      </mesh>
      {Array.from({ length: 13 }, (_, index) => (
        <mesh key={index} position={[-2.7 + index * 0.45, 0.07, 0.26]} scale={[0.025, 0.12, 0.03]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={BROWN} roughness={0.8} transparent={dim} opacity={dim ? 0.2 : 1} />
        </mesh>
      ))}
      <mesh position={[-2.95, 0.2, 0]} scale={[0.05, 0.42, 0.42]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={RED} roughness={0.72} />
      </mesh>
      <mesh position={[2.95, 0.2, 0]} scale={[0.05, 0.42, 0.42]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={RED} roughness={0.72} />
      </mesh>
    </group>
  )
}

function ReferenceRail({ slope }: { slope: number }) {
  return (
    <group rotation={[0, 0, (slope * Math.PI) / 180]} position={[0, 0, 0.52]}>
      <mesh scale={[3.15, 0.045, 0.22]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={TEAL} roughness={0.9} transparent opacity={0.28} />
      </mesh>
    </group>
  )
}

function Cart({
  position,
  mass,
  velocity,
  acceleration,
  dim,
  onSelect,
  ghost,
}: {
  position: [number, number, number]
  mass: number
  velocity: number
  acceleration: number
  dim: boolean
  onSelect?: () => void
  ghost?: boolean
}) {
  const size = 0.54 + mass * 0.012
  const bodyColor = ghost ? TEAL : BLUE_DARK
  const topColor = ghost ? TEAL : BLUE
  const wheelColor = ghost ? TEAL : INK
  const isTransparent = dim || Boolean(ghost)
  const opacity = dim ? 0.2 : ghost ? 0.48 : 1
  return (
    <group position={position} onClick={onSelect ? (event) => { event.stopPropagation(); onSelect() } : undefined}>
      <mesh position={[0, 0.22, 0]} scale={[size, 0.26, 0.36]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={bodyColor} roughness={0.55} transparent={isTransparent} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.47, 0]} scale={[size * 0.62, 0.1, 0.28]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={topColor} roughness={0.65} transparent={isTransparent} opacity={opacity} />
      </mesh>
      {[-0.22, 0.22].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.02, 0.24]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.095, 0.095, 0.06, 16]} />
            <meshStandardMaterial color={wheelColor} roughness={0.62} transparent={isTransparent} opacity={opacity} />
          </mesh>
          <mesh position={[x, 0.02, -0.24]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.095, 0.095, 0.06, 16]} />
            <meshStandardMaterial color={wheelColor} roughness={0.62} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>
      ))}
      {!ghost && Array.from({ length: Math.min(6, Math.round(mass / 3)) }, (_, index) => (
        <mesh key={index} position={[-0.18 + index * 0.08, 0.62, 0]} scale={[0.07, 0.07, 0.1]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={GOLD} roughness={0.72} transparent={dim} opacity={dim ? 0.2 : 1} />
        </mesh>
      ))}
      {!ghost && Math.abs(velocity) > 0.04 && <Vector start={[0, 0.78, -0.04]} value={velocity * 0.45} color={TEAL} label="velocity" />}
      {!ghost && Math.abs(acceleration) > 0.04 && <Vector start={[0, 0.96, -0.06]} value={acceleration * 0.2} color={GREEN} label="accel" />}
    </group>
  )
}

function ForceArrow({ start, value, color, label, labelsVisible, dim }: { start: [number, number, number]; value: number; color: string; label: string; labelsVisible: boolean; dim: boolean }) {
  if (Math.abs(value) < 0.1) return null
  const length = clamp(Math.abs(value) / 18, 0.22, 1.2)
  const sign = Math.sign(value)
  return (
    <group>
      <Vector start={start} value={sign * length} color={color} label={label} opacity={dim ? 0.18 : 0.92} />
      {labelsVisible && <SceneLabel text={label} position={[start[0] + sign * (length + 0.22), start[1] + 0.05, start[2]]} color={color} />}
    </group>
  )
}

function FrictionArrow({ start, value, labelsVisible, dim }: { start: [number, number, number]; value: number; labelsVisible: boolean; dim: boolean }) {
  if (Math.abs(value) < 0.1) return null
  const length = clamp(Math.abs(value) / 16, 0.18, 0.9)
  const sign = Math.sign(value)
  return (
    <group>
      <Vector start={start} value={sign * length} color={AMBER} label="friction" opacity={dim ? 0.18 : 0.9} />
      {labelsVisible && <SceneLabel text="friction fights motion" position={[start[0] + sign * (length + 0.3), start[1] + 0.06, start[2]]} color={AMBER} />}
    </group>
  )
}

function GravityNormalArrows({
  cartPosition,
  controls,
  physics,
  labelsVisible,
  dimGravity,
  dimNormal,
}: {
  cartPosition: [number, number, number]
  controls: MechanicsControls
  physics: ReturnType<typeof computePhysics>
  labelsVisible: boolean
  dimGravity: boolean
  dimNormal: boolean
}) {
  const weightLength = clamp((controls.mass * controls.gravity) / 120, 0.35, 1.2)
  const normalLength = clamp(physics.normalForce / 120, 0.3, 1.05)
  return (
    <group>
      <Line points={[[cartPosition[0] + 0.58, cartPosition[1] + 0.5, 0], [cartPosition[0] + 0.58, cartPosition[1] + 0.5 - weightLength, 0]]} color={RED} lineWidth={2.4} transparent opacity={dimGravity ? 0.18 : 0.9} />
      <mesh position={[cartPosition[0] + 0.58, cartPosition[1] + 0.5 - weightLength, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.055, 0.14, 12]} />
        <meshStandardMaterial color={RED} transparent={dimGravity} opacity={dimGravity ? 0.18 : 1} />
      </mesh>
      <Line points={[[cartPosition[0] - 0.58, cartPosition[1] + 0.08, 0], [cartPosition[0] - 0.58, cartPosition[1] + 0.08 + normalLength, 0]]} color={VIOLET} lineWidth={2.4} transparent opacity={dimNormal ? 0.18 : 0.9} />
      <mesh position={[cartPosition[0] - 0.58, cartPosition[1] + 0.08 + normalLength, 0]}>
        <coneGeometry args={[0.055, 0.14, 12]} />
        <meshStandardMaterial color={VIOLET} transparent={dimNormal} opacity={dimNormal ? 0.18 : 1} />
      </mesh>
      {labelsVisible && (
        <>
          <SceneLabel text="weight = m x g" position={[cartPosition[0] + 0.9, cartPosition[1] - 0.15, 0]} color={RED} />
          <SceneLabel text="normal force" position={[cartPosition[0] - 0.95, cartPosition[1] + 0.88, 0]} color={VIOLET} />
        </>
      )}
    </group>
  )
}

function Vector({ start, value, color, label, opacity = 1 }: { start: [number, number, number]; value: number; color: string; label: string; opacity?: number }) {
  const sign = value >= 0 ? 1 : -1
  const end: [number, number, number] = [start[0] + value, start[1], start[2]]
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={2.4} transparent opacity={opacity} />
      <mesh position={end} rotation={[0, 0, sign > 0 ? -Math.PI / 2 : Math.PI / 2]}>
        <coneGeometry args={[0.055, 0.14, 12]} />
        <meshStandardMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <SceneLabel text={label} position={[end[0], end[1] + 0.16, end[2]]} color={color} small hidden={opacity < 0.4} />
    </group>
  )
}

function MotionMarkers({
  sim,
  labelsVisible,
  showMeasureTool,
  readout,
}: {
  sim: SimState
  labelsVisible: boolean
  showMeasureTool: boolean
  readout: { primaryLabel: string; primaryValue: string } | null
}) {
  const measuredSpan = Math.abs(sim.position - START_POSITION)
  return (
    <group>
      <Line points={[[-1.65, -0.2, 0.42], [sim.position, -0.2, 0.42]]} color={GOLD} lineWidth={2.2} transparent opacity={0.75} />
      {showMeasureTool ? (
        <>
          <MeasuringTapeTool measuredSpan={measuredSpan} />
          <TrackedBaseball sim={sim} />
          {readout && (
            // Wave 19 fix: ties the baseball's on-canvas readout directly to the same
            // mechanicsReadout() the HUD/keyFacts panel already renders, so the number a child
            // sees floating over the ball always matches whichever of Distance/Displacement/
            // Speed/Velocity/Position is the active component - not a generic hardcoded label.
            <SceneLabel text={`${readout.primaryLabel}: ${readout.primaryValue}`} position={[sim.position, 0.85, 1.55]} color={INK} />
          )}
        </>
      ) : (
        <mesh position={[-1.65, -0.2, 0.42]} scale={[0.045, 0.24, 0.045]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={GOLD} />
        </mesh>
      )}
      <mesh position={[0, -0.16, 0.5]} scale={[0.035, 0.32, 0.035]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={INK} roughness={0.8} />
      </mesh>
      {labelsVisible && (
        <>
          <SceneLabel text={`position ${sim.position.toFixed(1)} m`} position={[sim.position, -0.45, 0.5]} color={INK} />
          <SceneLabel text={`distance ${sim.distance.toFixed(1)} m`} position={[-0.72, -0.43, 0.62]} color={GOLD} />
          <SceneLabel text="origin" position={[0, 0.16, 0.58]} color={INK} />
        </>
      )}
    </group>
  )
}

/** Loads and normalizes a small prop GLB to a fixed world-space size, matching the
 * clone-in-useMemo + Box3 auto-fit convention used elsewhere in the codebase (see
 * GenericModel.tsx/OrganModel.tsx) so the cached drei scene is never mutated in place. */
function useFittedGltf(url: string, targetSize: number) {
  const { scene } = useGLTF(url)
  return useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.set(-center.x * scale, -center.y * scale, -center.z * scale)
    return cloned
  }, [scene, targetSize])
}

/** Catches GLB load failures so a missing/broken asset degrades to a procedural placeholder
 * instead of crashing the whole mechanics scene (same shape as BunsenBurnerBoundary/WireGlbBoundary
 * in ChemicalReactionsLab.tsx / ElectricityLab.tsx). */
class MechanicsPropBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[PhysicsLab] mechanics prop GLB failed to load; showing procedural fallback.', error)
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children
  }
}

function BaseballModel() {
  const fitted = useFittedGltf(BASEBALL_MODEL_URL, BASEBALL_TARGET_SIZE)
  return <primitive object={fitted} />
}

function BaseballFallback() {
  return (
    <mesh>
      <sphereGeometry args={[BASEBALL_TARGET_SIZE / 2, 20, 20]} />
      <meshStandardMaterial color="#F4EFE4" roughness={0.5} />
    </mesh>
  )
}

/** The physical object standing in for "the thing whose position/distance is being tracked."
 * Rides the existing gold distance line at the cart's real x position (sim.position) - it is a
 * read-out of already-computed sim state, not a second physics body. The slow roll is a cosmetic
 * flourish driven by the real velocity value; it never writes back into sim.
 * Only mounted while a motion-measure component is active (position/distance/displacement/
 * speed/velocity) and placed in its own lane (z=1.05, raised off the ground-shadow band) well
 * clear of the cart's wheels (z +/-0.24) so it no longer blends into the cart at default framing
 * (was previously always-rendered at z=0.42, right behind the wheels - see
 * docs/reviews/wave10-mechanics.md P1 #3). z was bumped again from 0.66 to 0.85 (paired with
 * MeasuringTapeTool's x pullback below) because at the default/initial state sim.position
 * equals START_POSITION, so this prop's x lands exactly on the tape's fixed x and the old
 * 0.08 z-gap between the two lanes wasn't enough to keep them visually separated - they read as
 * one overlapping blob (docs/reviews/wave12-mechanics.md P1 #3). Wave 17 fix: even at z=0.85 the
 * baseball and tape still read as one cluster at motion-measure start (the combined x+z gap was
 * still small once camera perspective and the steep MOTION_MEASURE_RIG_YAW compressed it), so z
 * was bumped once more to 1.05, paired with a larger x pullback on the tape below, for a clearly
 * larger combined separation without moving either prop off its lane. Wave 19 fix (this wave's QA
 * task): separation from the tape was no longer the problem - both props were still tiny and
 * visually buried under the cart's always-on force/friction/gravity apparatus at default framing.
 * z was pulled forward once more to 1.55 (paired with BASEBALL_TARGET_SIZE's bump to 0.46 and the
 * MechanicsRig-level decluttering of that apparatus in motion-measure mode) so the ball reads
 * clearly larger via perspective and sits forward of the now-dimmed arrow cluster. A small point
 * light counters the sourced GLB's naturally dark shading. */
function TrackedBaseball({ sim }: { sim: SimState }) {
  const groupRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.x -= sim.velocity * delta * 3.2
  })
  const fallback = <BaseballFallback />
  return (
    <group ref={groupRef} position={[sim.position, 0.08, 1.55]}>
      <pointLight position={[0, 0.24, 0.12]} intensity={0.65} distance={1.6} color="#FFF4E0" />
      <MechanicsPropBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <BaseballModel />
        </Suspense>
      </MechanicsPropBoundary>
    </group>
  )
}

function MeasuringTapeModel() {
  const fitted = useFittedGltf(MEASURING_TAPE_MODEL_URL, MEASURING_TAPE_TARGET_SIZE)
  return <primitive object={fitted} />
}

function MeasuringTapeFallback() {
  return (
    <mesh>
      <boxGeometry args={[MEASURING_TAPE_TARGET_SIZE * 0.4, MEASURING_TAPE_TARGET_SIZE * 0.3, MEASURING_TAPE_TARGET_SIZE * 0.2]} />
      <meshStandardMaterial color={GOLD} roughness={0.6} />
    </mesh>
  )
}

/** On-demand distance-inspection prop: only mounted while the selected component is in the
 * position/distance/displacement/speed/velocity group (see mechanicsMode). Sits just behind the
 * track's start post; the existing gold Line already stretching from START_POSITION to
 * sim.position reads as the tape's ribbon, and the label reports the real measured span
 * (|sim.position - START_POSITION|) so a student gets a concrete tool reading next to the
 * abstract distance/position numbers.
 * x is offset START_POSITION - 0.75 rather than sitting exactly on START_POSITION: at the
 * default/initial sim state TrackedBaseball's x is also sim.position === START_POSITION, so the
 * two props landed on the same x with only a shallow z lane between them and rendered as one
 * overlapping blob, hiding the tape entirely until the race moved the baseball away
 * (docs/reviews/wave12-mechanics.md P1 #3). Pulling the tape back along the track (paired with
 * TrackedBaseball's z bump above) keeps both props clearly separated and visible at rest, on
 * both desktop and mobile framing, while it's still parked at the same end of the track the
 * ribbon-line reads from. Wave 17 fix: the x pullback was widened from 0.4 to 0.75 and the tape's
 * own z lane moved from 0.58 to 0.38 (paired with TrackedBaseball's z=1.05 above) - at the old
 * values the two props' combined on-screen separation at motion-measure start was still too small
 * to reliably tell apart. The "tape reads ..." label's y offset was also raised from 0.34 to 0.52
 * so it clears the friction arrow's tip label, which otherwise lands at almost the same height
 * near this end of the track (docs/reviews/wave17-mechanics.md P1). Wave 19 fix (this wave's QA
 * task): z pulled forward again from 0.38 to 0.95 (paired with TrackedBaseball's z=1.55 above and
 * MEASURING_TAPE_TARGET_SIZE's bump to 0.6) so the tape reads clearly larger via perspective and
 * sits forward of the now motion-measure-decluttered force/gravity arrow cluster instead of
 * blending into it; the label's y offset was raised again to 0.62 to clear the taller model. */
function MeasuringTapeTool({ measuredSpan }: { measuredSpan: number }) {
  const fallback = <MeasuringTapeFallback />
  return (
    <group position={[START_POSITION - 1.15, -0.04, 1.3]} rotation={[0, 0.35, 0]}>
      <pointLight position={[0, 0.3, 0.1]} intensity={0.55} distance={1.6} color="#FFF4E0" />
      <MechanicsPropBoundary fallback={fallback}>
        <Suspense fallback={fallback}>
          <MeasuringTapeModel />
        </Suspense>
      </MechanicsPropBoundary>
      <SceneLabel text={`tape reads ${measuredSpan.toFixed(2)} m`} position={[0, 0.62, 0]} color={GOLD} small />
    </group>
  )
}

function MomentumBlocks({ sim, mass, active, dim }: { sim: SimState; mass: number; active: boolean; dim: boolean }) {
  const count = Math.min(7, Math.max(1, Math.round((Math.abs(sim.velocity) * mass) / 8)))
  return (
    <group position={[1.85, 0.34, -0.54]}>
      {Array.from({ length: count }, (_, index) => (
        <mesh key={index} position={[index * 0.1, index * 0.04, 0]} scale={[0.08, 0.08, 0.12]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={active ? GOLD : AMBER} emissive={active ? GOLD : '#000000'} emissiveIntensity={active ? 0.28 : 0} transparent={dim} opacity={dim ? 0.18 : 0.92} />
        </mesh>
      ))}
      <SceneLabel text="momentum stack" position={[0.26, 0.45, 0]} color={AMBER} hidden={dim} />
    </group>
  )
}

function GraphScreen({ history, active }: { history: HistoryPoint[]; active: boolean }) {
  const points = history.length > 1 ? history : [{ t: 0, position: START_POSITION, velocity: 0, velocityB: 0 }, { t: 1, position: START_POSITION, velocity: 0, velocityB: 0 }]
  const firstT = points[0]?.t ?? 0
  const spanT = Math.max(1, (points[points.length - 1]?.t ?? 1) - firstT)
  const toLine = (key: 'velocity' | 'velocityB') =>
    points.map((point) => {
      const x = -0.72 + ((point.t - firstT) / spanT) * 1.44
      const y = -0.38 + ((clamp(point[key], -5, 5) + 5) / 10) * 0.74
      return [x, y, 0.05] as [number, number, number]
    })
  return (
    <group position={[0.25, 1.55, -0.8]} rotation={[0.08, 0, 0]}>
      <mesh scale={[0.9, 0.56, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#ECE5D8" roughness={0.78} />
      </mesh>
      <Line points={[[-0.72, -0.38, 0.06], [0.72, -0.38, 0.06]]} color="#A7A095" lineWidth={1.2} />
      <Line points={[[-0.72, -0.38, 0.06], [-0.72, 0.36, 0.06]]} color="#A7A095" lineWidth={1.2} />
      <Line points={toLine('velocityB')} color={TEAL} lineWidth={1.8} transparent opacity={0.65} />
      <Line points={toLine('velocity')} color={active ? GREEN : BLUE} lineWidth={2.5} />
      <SceneLabel text="velocity-time (yours vs reference)" position={[0, 0.55, 0.08]} color={active ? GREEN : BLUE_DARK} small />
    </group>
  )
}

function Workbench({ labelsVisible }: { labelsVisible: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3.4, 2.05, 1]}>
        <cylinderGeometry args={[1, 1, 0.12, 64]} />
        <meshStandardMaterial color="#E9DECE" roughness={0.92} />
      </mesh>
      {labelsVisible && <SceneLabel text="change variables, observe motion" position={[0, -0.68, 1.18]} color={INK} />}
    </group>
  )
}

function MechanicsHotspot({
  hotspot,
  index,
  active,
  labelsVisible,
  dim,
  onSelect,
}: {
  hotspot: Hotspot
  index: number
  active: boolean
  labelsVisible: boolean
  dim: boolean
  onSelect: (id: string) => void
}) {
  const positions: [number, number, number][] = [
    [-1.55, 0.72, 0.18],
    [-0.32, 1.05, 0.1],
    [0.9, 0.78, 0.12],
    [1.65, 0.5, 0.3],
    [0, 1.42, -0.42],
  ]
  const position = positions[index % positions.length]
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect(hotspot.id) }}>
      <mesh>
        <sphereGeometry args={[active ? 0.11 : 0.09, 18, 18]} />
        <meshStandardMaterial color={hotspot.color} emissive={hotspot.color} emissiveIntensity={active ? 0.74 : 0.2} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      {(labelsVisible || active) && <SceneLabel text={hotspot.label} position={[0, 0.24, 0]} color={hotspot.color} />}
    </group>
  )
}

function ComponentStrip({ content, activeHotspotId, onSelectHotspot }: { content: ComponentContent; activeHotspotId: string | null; onSelectHotspot: (id: string | null) => void }) {
  const { viewport } = useThree()
  const boost = labelSizeBoost(viewport.aspect)
  return (
    <group position={[0, -1.04, 1.38]}>
      {content.hotspots.slice(0, 4).map((hotspot, index) => {
        const active = activeHotspotId === hotspot.id
        return (
          <group key={hotspot.id} position={[-1.35 + index * 0.9, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectHotspot(active ? null : hotspot.id) }}>
            <mesh>
              <boxGeometry args={[0.72, 0.08, 0.12]} />
              <meshStandardMaterial color={active ? hotspot.color : '#DED6C9'} roughness={0.82} />
            </mesh>
            <Billboard position={[0, -0.16, 0]}>
              <Text fontSize={0.09 * boost} color={active ? INK : '#7D766C'} anchorX="center" anchorY="middle" maxWidth={0.78 * boost}>
                {hotspot.label}
              </Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

// Wave 17 fix: on-canvas Text fontSize is in local/world units, so it shrinks twice on mobile -
// once from ResponsiveMechanicsGroup's narrower-aspect scale tiers (0.54/0.7/0.9) and again from
// the larger camera distance safeDefaultDistanceForAspect picks for narrow aspects. The combined
// effect made every SceneLabel and the ComponentStrip legend text hard to read on mobile even
// though it was legible on desktop. This boost partially compensates so mobile text stays
// readable without letting desktop grow (docs/reviews/wave17-mechanics.md P1).
function labelSizeBoost(aspect: number) {
  return aspect < 0.7 ? 1.35 : aspect < 1 ? 1.15 : 1
}

function SceneLabel({ text, position, color, small, hidden }: { text: string; position: [number, number, number]; color: string; small?: boolean; hidden?: boolean }) {
  const { viewport } = useThree()
  if (hidden) return null
  const boost = labelSizeBoost(viewport.aspect)
  return (
    <Billboard position={position}>
      <Text fontSize={(small ? 0.085 : 0.11) * boost} color={color} anchorX="center" anchorY="middle" maxWidth={1.15 * boost}>
        {text}
      </Text>
    </Billboard>
  )
}
