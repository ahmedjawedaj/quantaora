import { Suspense, useCallback, useEffect, useMemo, useRef, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { planets, type PlanetBody } from '@/data/planets'
import { PlanetModel } from './PlanetModel'

/** Distances/sizes are real relative values compressed with sqrt/cbrt so the
 *  whole system fits on screen at once — true-to-scale distance AND size
 *  simultaneously is physically impossible to render (every real orrery
 *  compresses one or both). Real figures are shown in the facts panel. */
const DISTANCE_UNIT = 1.15
const SIZE_UNIT = 0.34
const SUN_VISUAL_RADIUS = 0.85

function visualDistance(au: number) {
  return au === 0 ? 0 : (1.6 + Math.sqrt(au) * DISTANCE_UNIT)
}

/** Wave 17 QA (desktop/mobile-ceres-coldload screenshots): Ceres's true cbrt-scaled radius
 *  (~0.140) sits close enough to zero that at its own default framing it visually disappears into
 *  a much larger neighbor (Jupiter) sitting nearby in the same view -- you can only tell it's there
 *  from its label pills, not from its own disc. This floor is a *readability* nudge, not a rescale:
 *  0.17 sits comfortably below Pluto's own natural ~0.195 (the next-smallest body), so it only ever
 *  raises Ceres (every other body's natural radius already clears this floor) and never changes the
 *  size ORDER of any two bodies relative to each other -- Ceres is still visibly the smallest body
 *  in the scene, just no longer swallowed entirely by whatever happens to be near it on screen. See
 *  the always-on halo ring below (CLOSE_FOCUS_BODY_IDS) for the other half of this fix, which
 *  handles contrast/distinctness rather than raw size. */
const MIN_VISUAL_RADIUS = 0.17

function visualRadius(body: PlanetBody) {
  if (body.isStar) return SUN_VISUAL_RADIUS
  return Math.max(Math.cbrt(body.relativeRadius) * SIZE_UNIT, MIN_VISUAL_RADIUS)
}

/** Ring geometry extends to ~2.6x a ringed body's own radius -- matches Saturn's real GLB
 *  bounding box on its ring axes (PlanetModel.tsx documents ~2331 vs ~902 on the non-ring axis,
 *  i.e. ~2.58x) and SaturnRings' `RingGeometry(radius * 1.4, radius * 2.6, ...)` fallback below,
 *  which is kept in sync with this constant. Wave 15 QA traced Saturn's persistent mobile-canvas
 *  clipping (Wave 14 QA finding #1) partly to this constant previously being set to 2.3 -- a
 *  stale value that undershot the GLB's own documented ~2.58x ratio despite this file's old
 *  comment claiming they matched. */
const RING_OUTER_MULTIPLIER = 2.6
/** A selected (non-ringed) body draws a highlight ring/spin marker out to ~1.28x its own radius
 *  plus a small label above it — this multiplier keeps that whole marker set inside the frame,
 *  not just the bare sphere, whenever that body is the one being fit to. */
const SELECTION_FRAMING_MULTIPLIER = 1.5
/** How far a body's own visible radius extends outward, for camera-fit purposes: the full ring
 *  system for Saturn, or body-radius-plus-selection-marker for anything else. */
function bodyFramingExtent(body: PlanetBody): number {
  if (body.hasRings) return visualRadius(body) * RING_OUTER_MULTIPLIER
  return visualRadius(body) * SELECTION_FRAMING_MULTIPLIER
}
/** Live (x, z) orbital-plane position of every body, written every frame by OrbitingBody below —
 *  this is what makes the camera fit react to where a body *actually* is right now instead of a
 *  precomputed worst case. Keyed by body id. */
type LivePositions = Map<string, { x: number; z: number }>
type LivePositionsRef = { current: LivePositions }
/** Vertical field of view of the orbit Canvas below — keep in sync with the `fov` passed to
 *  <Canvas camera> so the bounds-aware fit below stays accurate if that ever changes. three.js's
 *  `fov` is always the *vertical* FOV; the *horizontal* FOV it implies is narrower or wider than
 *  this depending on the canvas's aspect ratio (width/height) — see computeRequiredCameraDistance
 *  below, which is why the fit can't just use this constant on its own. */
const CAMERA_FOV_DEG = 42
/** Reasonable landscape-ish aspect ratio used only before the Canvas has mounted and reported its
 *  real size (initial React state in SpaceLab.tsx, and this module's DEFAULT_CAMERA_DISTANCE
 *  export). Once the Canvas is live, CameraFit below re-derives the true required distance from the
 *  canvas's actual measured aspect ratio (and each relevant body's live position) continuously, so
 *  this fallback only affects the very first paint / non-mounted call sites, not steady-state
 *  framing. */
const FALLBACK_ASPECT = 16 / 9
/** Height:depth ratio of the scene's original camera position ([0, 6, 11] at the original
 *  default distance of 11) — preserved exactly so the bounds-aware fit below only changes *how
 *  far back* the camera sits, not the three-quarter viewing angle the scene was designed around.
 *  Camera position is now built from this ratio (see <Canvas camera> below) instead of a fixed
 *  y = 6, so the elevation angle also stays constant across zoom levels instead of flattening out
 *  as a user zooms out (a side-effect fix of the same change). */
const CAMERA_ELEVATION_RATIO = 6 / 11
/** Small buffer so a ringed body's near edge isn't razor-tight against the frustum edge. */
const CAMERA_FIT_MARGIN_DEG = 2
const FALLBACK_CAMERA_DISTANCE = 11
/** Pure numeric safety floor for CameraFit's per-frame `computeRequired` below — just enough to
 *  keep the trig well-behaved, NOT a "reasonable default scene" distance (that job belongs to
 *  FALLBACK_CAMERA_DISTANCE above, used only by the static computeRequiredCameraDistance). Kept
 *  small on purpose so a tight CLOSE_FOCUS_BODY_IDS selection (Ceres) isn't artificially floored. */
const MIN_REQUIRED_FIT_DISTANCE = 2
/** OrbitControls' own hard ceiling on camera distance. Raised from the previous 30 so CameraFit's
 *  live fit (below) has enough room to actually pull the camera back far enough to keep an outer,
 *  unringed body (Neptune, Uranus, Pluto — none of which are in computeRequiredCameraDistance's
 *  ringed-only loop) fully framed at its worst realistic case: selected, sitting broadside to the
 *  camera's default view direction, on the narrowest tested viewport (390×844 portrait mobile,
 *  where the horizontal frustum is tightest). Traced by hand for Neptune/Pluto at that aspect —
 *  see this worker's report for the numbers — required distance comes out to ~62–65; 75 leaves
 *  margin without being unbounded. minDistance (4) is unchanged, so Zoom In behavior is unaffected. */
const MAX_ORBIT_CONTROLS_DISTANCE = 75

/** Bodies small/distant enough that Saturn's ring-safety floor (see CameraFit's `computeRequired`
 *  below) would otherwise prevent ever framing them up close. Wave 13 QA: Ceres, a ~470 km dwarf
 *  planet, rendered as an indistinct dot on selection because the camera never zoomed in past what
 *  Saturn's rings needed, regardless of which body was actually selected. For bodies in this set,
 *  CameraFit skips that floor entirely so the selected body's own (much smaller) framing need wins
 *  instead — a deliberate trade so a child can actually see the tiny body they picked, at the cost
 *  of Saturn potentially falling out of frame while one of these bodies is the focus (acceptable:
 *  Saturn isn't the thing being looked at in that moment). Exported so SpaceLab.tsx's selectPlanet
 *  can also give these bodies a bespoke tight starting `cameraDistance` instead of leaving whatever
 *  wide distance was already dialed in from the previous selection. */
export const CLOSE_FOCUS_BODY_IDS = new Set(['ceres'])
/** Native <OrbitControls> minDistance used only while a CLOSE_FOCUS_BODY_IDS body is selected —
 *  matches this scene's original global zoom-in floor (see SpaceLab.tsx's MIN_CAMERA_DISTANCE). */
const CLOSE_FOCUS_MIN_DISTANCE = 4

/** Deterministic per-body pseudo-random angle in [0, 2π) — replaces `Math.random()` so every body
 *  starts at the SAME point in its orbit/spin on every mount. Wave 13 QA found cold-load camera
 *  framing was non-deterministic (same default selection, visibly different zoom level across
 *  reloads): every body's start angle was seeded from `Math.random()`, and both Saturn's ring-safety
 *  consideration and the selected body's own live-position consideration in CameraFit below react to
 *  wherever a body's *current* position happens to be — so a randomly-placed body produced a
 *  different required camera distance on every load even with the same selection. Still varies per
 *  body (via a simple string hash) and per `salt` (so a body's orbit angle and spin angle aren't
 *  identical), just no longer varies between page loads. */
function deterministicAngle(id: string, salt: number): number {
  let hash = salt >>> 0
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(hash, 31) + id.charCodeAt(i)) >>> 0
  }
  return ((hash % 10007) / 10007) * Math.PI * 2
}

/** Angular resolution (in samples around a full orbit) used by computeRequiredCameraDistance's
 *  worst-case search below — far finer than CAMERA_FIT_MARGIN_DEG's safety buffer, so
 *  discretization error is negligible, while cheap enough that caching by aspect (below) keeps it
 *  well within a per-frame budget even though CameraFit calls this every frame. */
const RING_FIT_SAMPLE_COUNT = 720

/**
 * Wave 15 QA correction (Wave 14 QA finding #1: Saturn's rings persistently clipping the mobile
 * canvas edge, not a one-frame glitch). Through Wave 14 this function used a closed-form "vertical
 * fit vs horizontal fit, take the larger" derivation that checked only two specific points on a
 * ringed body's orbit — the point sitting exactly on the camera's forward line, and the point a
 * sum-of-sines formula predicted was worst for the horizontal axis — and assumed one of those two
 * was always the true global worst case. Numerically sampling every point around the orbit (not
 * just those two) disproves that: at this app's actual mobile `data-lab-stage` aspect ratio (full
 * viewport width, but only 50svh tall — not the full device aspect), the true worst case ran ~40%
 * higher than the closed form's answer, which is why Saturn kept clipping on mobile even though the
 * closed form's own math "checked out." This function now finds the real worst case directly
 * instead of trusting a hand-derived shortcut: for each ringed body, sample
 * `RING_FIT_SAMPLE_COUNT` points around its orbit and, for each, compute the same "how far back
 * must the camera sit to keep a sphere of this body's ring radius, centered on this point, inside
 * the frustum" formula CameraFit's own live `considerBody` already uses for the selected body below
 * — so both paths share one verified formula instead of two independently hand-derived ones (one of
 * which was wrong). This still only models the *origin-centered* worst case (camera always looking
 * at the world origin, at the scene's fixed elevation angle) — CLOSE_FOCUS_BODY_IDS selections are
 * framed differently; see CameraFit's `focus`/`getFocus` below for why. Because it doesn't depend
 * on any live body position or the current camera azimuth (only orbit radius, ring extent, and
 * aspect), results are cached by aspect so the sample loop isn't re-run 60x/sec for an aspect ratio
 * that essentially never changes frame-to-frame.
 */
const requiredCameraDistanceCache = new Map<number, number>()
function computeRequiredCameraDistance(aspect: number): number {
  const cacheKey = Math.round(aspect * 2000)
  const cached = requiredCameraDistanceCache.get(cacheKey)
  if (cached !== undefined) return cached

  const elevationRad = Math.atan(CAMERA_ELEVATION_RATIO)
  const halfVFovRad = THREE.MathUtils.degToRad(CAMERA_FOV_DEG / 2)
  const halfHFovRad = Math.atan(Math.tan(halfVFovRad) * aspect)
  const marginRad = THREE.MathUtils.degToRad(CAMERA_FIT_MARGIN_DEG)
  const tanHalfVFov = Math.tan(Math.max(halfVFovRad - marginRad, 0.01))
  const tanHalfHFov = Math.tan(Math.max(halfHFovRad - marginRad, 0.01))

  // Fixed default view direction/basis — no live camera involved. This is the worst case over
  // every possible orbital angle at the scene's fixed elevation, matching the Canvas's initial
  // camera direction (the same one CameraFit falls back to before a live position is known).
  const dirHat = new THREE.Vector3(0, Math.sin(elevationRad), Math.cos(elevationRad))
  const forward = dirHat.clone().multiplyScalar(-1)
  let right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0))
  if (right.lengthSq() < 0.0001) right = new THREE.Vector3(1, 0, 0)
  right.normalize()
  const upCam = new THREE.Vector3().crossVectors(right, forward).normalize()

  let required = FALLBACK_CAMERA_DISTANCE
  for (const body of planets) {
    if (!body.hasRings) continue
    const orbitDistance = visualDistance(body.distanceAU)
    const ringRadius = visualRadius(body) * RING_OUTER_MULTIPLIER
    for (let i = 0; i < RING_FIT_SAMPLE_COUNT; i++) {
      const theta = (i / RING_FIT_SAMPLE_COUNT) * Math.PI * 2
      const point = new THREE.Vector3(Math.cos(theta) * orbitDistance, 0, Math.sin(theta) * orbitDistance)
      const depth = point.dot(dirHat)
      const h = point.dot(right)
      const v = point.dot(upCam)
      const neededForH = depth + (Math.abs(h) + ringRadius) / tanHalfHFov
      const neededForV = depth + (Math.abs(v) + ringRadius) / tanHalfVFov
      if (neededForH > required) required = neededForH
      if (neededForV > required) required = neededForV
    }
  }

  requiredCameraDistanceCache.set(cacheKey, required)
  return required
}

/** Bounds-aware default camera distance at a landscape-ish fallback aspect ratio — see
 *  computeRequiredCameraDistance above. Exported so SpaceLab.tsx can use the same value for its
 *  initial state and "Fit view" / "Reset" framing instead of duplicating this geometry-derived
 *  constant. The live Canvas below re-derives (and, if needed, enlarges) this per-frame from the
 *  canvas's real measured aspect ratio, so this constant only has to be a reasonable starting point
 *  for viewports at least as wide as they are tall — it does not need to anticipate every possible
 *  aspect ratio itself. */
export const DEFAULT_CAMERA_DISTANCE = computeRequiredCameraDistance(FALLBACK_ASPECT)

function OrbitRing({ radius }: { radius: number }) {
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, 0.006, 6, 128), [radius])
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2, 0, 0]}>
      <meshBasicMaterial color="#b8a892" transparent opacity={0.28} />
    </mesh>
  )
}

/** Vertical offset (world units) of the Name label above a body's own center — used only for
 *  bodies that still render their in-canvas Name pill (any non-star body when `labelsVisible` is
 *  on, as long as it is NOT the currently selected body). Wave 23: the selected body's Name/Spin/
 *  Orbit readout moved out of the canvas entirely into a plain-DOM status card (see SpaceLab.tsx's
 *  `orbit-status-card`) — a structural fix for the Spin/Orbit pill collision Wave 22 QA found
 *  reproducing in 20/20 measurements (root cause: the Orbit pill's screen-space projection drifting
 *  closer to the Spin pill's as camera azimuth accumulates across drags). Removing the collision
 *  class entirely — rather than further patching the old per-frame pairwise push-apart pass,
 *  `LabelDeclutter`, which this wave deletes — is structurally immune to that drift, since the card
 *  is plain DOM and never 3D-projected in the first place.
 */
const NAME_LABEL_Y_OFFSET = 0.3

function OrbitingBody({
  body,
  distanceOverrideAU,
  running,
  speedDaysPerSec,
  rotationSpeedScale,
  selected,
  dimmed,
  labelsVisible,
  xrayActive,
  onSelect,
  stepToken,
  stepDays,
  onSettled,
  positionsRef,
}: {
  body: PlanetBody
  distanceOverrideAU: number | null
  running: boolean
  speedDaysPerSec: number
  rotationSpeedScale: number
  selected: boolean
  dimmed: boolean
  labelsVisible: boolean
  xrayActive: boolean
  onSelect: (id: string) => void
  stepToken: number
  stepDays: number
  /** Fires once this body's model has settled (loaded or fell back) — see PlanetModel. */
  onSettled?: () => void
  /** Shared map this body writes its live (x, z) orbital-plane position into every frame, so
   *  CameraFit can fit the camera to wherever a body actually is right now. */
  positionsRef: LivePositionsRef
}) {
  const groupRef = useRef<THREE.Group>(null)
  const spinMarkerRef = useRef<THREE.Group>(null)
  const orbitArrowRef = useRef<THREE.Group>(null)
  const angleRef = useRef(deterministicAngle(body.id, 17))
  const spinAngleRef = useRef(deterministicAngle(body.id, 43))
  const prevStepTokenRef = useRef(stepToken)
  const distanceAU = distanceOverrideAU ?? body.distanceAU
  const dist = visualDistance(distanceAU)
  const period =
    distanceOverrideAU && body.distanceAU > 0
      ? body.orbitalPeriodDays * Math.pow(distanceOverrideAU / body.distanceAU, 1.5)
      : body.orbitalPeriodDays

  const radius = visualRadius(body)
  // "Spin" (rotation, orange marker) and "Orbit" (revolution, blue arrow) are driven by
  // independent speed inputs on purpose — a child should see one change without the other moving.
  const baseSpinSpeed = (body.isStar ? 0.05 : 0.6) * (selected ? rotationSpeedScale : 1)
  const spinSpeed = running ? baseSpinSpeed : 0
  const showOrbitMotionMarkers = selected && !body.isStar && dist > 0

  const applyTransforms = () => {
    if (!groupRef.current) return
    const x = Math.cos(angleRef.current) * dist
    const z = Math.sin(angleRef.current) * dist
    groupRef.current.position.set(x, 0, z)
    positionsRef.current.set(body.id, { x, z })
    if (spinMarkerRef.current) spinMarkerRef.current.rotation.y = spinAngleRef.current
    if (orbitArrowRef.current && showOrbitMotionMarkers) {
      const arrowAngle = angleRef.current + 0.22
      const ax = Math.cos(arrowAngle) * dist
      const az = Math.sin(arrowAngle) * dist
      orbitArrowRef.current.position.set(ax, 0, az)
      const aheadAngle = arrowAngle + 0.12
      orbitArrowRef.current.lookAt(Math.cos(aheadAngle) * dist, 0, Math.sin(aheadAngle) * dist)
    }
  }

  useFrame((_, delta) => {
    if (running && period > 0) {
      angleRef.current += ((2 * Math.PI) / period) * speedDaysPerSec * delta
    }
    if (running) {
      spinAngleRef.current += baseSpinSpeed * delta * 1.4
    }
    applyTransforms()
  })

  // Step: while paused, nudge the orbit (and a matching spin tick) forward by a fixed amount so a
  // child can compare two planets lap-by-lap instead of only watching continuous motion.
  useEffect(() => {
    if (prevStepTokenRef.current === stepToken) return
    prevStepTokenRef.current = stepToken
    if (period > 0) {
      angleRef.current += ((2 * Math.PI) / period) * stepDays
    }
    spinAngleRef.current += baseSpinSpeed * 0.6
    applyTransforms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepToken])

  return (
    <>
      {!body.isStar && <OrbitRing radius={dist} />}
      <group ref={groupRef}>
        <group
          onClick={(e) => {
            e.stopPropagation()
            onSelect(body.id)
          }}
        >
          <PlanetModel
            texture={body.texture}
            model={body.model || undefined}
            radius={radius}
            tiltDeg={body.axialTilt}
            spinSpeed={spinSpeed}
            isStar={body.isStar}
            hasRings={body.hasRings}
            dimmed={dimmed}
            xrayActive={xrayActive}
            onSettled={onSettled}
          />
          {selected && !body.isStar && (
            <group rotation={[0, 0, THREE.MathUtils.degToRad(body.axialTilt)]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius * 1.28, 0.012, 8, 48]} />
                <meshBasicMaterial color="#f8d66d" transparent opacity={0.9} />
              </mesh>
              <mesh position={[radius * 1.28, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
                <coneGeometry args={[0.055, 0.14, 12]} />
                <meshBasicMaterial color="#f8d66d" />
              </mesh>
              {/* Spin marker: an orange dot that sweeps the equator at the rotation speed only.
                  It has no in-canvas text label of its own -- the selected body's "Spin" readout
                  lives in the plain-DOM status card outside the Canvas (Wave 23, see
                  SpaceLab.tsx's `orbit-status-card`), so this dot's own rotating motion can never
                  drag a label anchor around with it. The dot itself keeps spinning here -- that
                  part is the intended "watch it spin" visual. */}
              <group ref={spinMarkerRef}>
                <mesh position={[radius * 1.16, 0, 0]}>
                  <sphereGeometry args={[0.045, 10, 10]} />
                  <meshBasicMaterial color="#ff8a5c" toneMapped={false} />
                </mesh>
              </group>
            </group>
          )}
        </group>
        {/* Name pill: only for bodies that are NOT the current selection. The selected body's full
            Name/Spin/Orbit readout now lives in the plain-DOM status card outside the Canvas (see
            SpaceLab.tsx's `orbit-status-card`), so it no longer needs its own in-canvas pill --
            keeping this one for unselected bodies preserves the "see other planet names when labels
            are toggled on" affordance without reintroducing the Spin/Orbit collision Wave 22 QA
            found (that collision only ever involved the SELECTED body's own pill stack). */}
        {!body.isStar && labelsVisible && !selected && (
          <Html position={[0, radius + NAME_LABEL_Y_OFFSET, 0]} center distanceFactor={9} zIndexRange={[10, 0]} occlude={false}>
            <button
              type="button"
              onClick={() => onSelect(body.id)}
              // select-none (Wave 20 QA P2): a mouse-drag camera-rotate gesture that happens to
              // cross this pill must only rotate the camera, never fall into the browser's native
              // "drag to select text" behavior. Doesn't affect the button's own onClick/tap handling.
              className="select-none whitespace-nowrap rounded-full border border-white/30 bg-black/30 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur-sm transition-colors hover:bg-black/50"
            >
              {body.name}
            </button>
          </Html>
        )}
        {/* Wave 17 QA (desktop/mobile-ceres-coldload screenshots): Ceres's own disc can visually
            disappear into a much larger neighbor sitting nearby in the current view. This ring is a
            persistent "here it is" annotation -- not a size change (see MIN_VISUAL_RADIUS above for
            that half of the fix) -- rendered with depthTest disabled so it can never itself get lost
            behind whatever geometry happens to be in front of/behind Ceres from the camera's current
            angle. Shown at all times (selected or not), matching the bug report's "at default
            framing" complaint, which is before any selection-only marker would show. */}
        {!body.isStar && CLOSE_FOCUS_BODY_IDS.has(body.id) && (
          <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={999}>
            <ringGeometry args={[radius * 1.55, radius * 1.85, 40]} />
            <meshBasicMaterial
              color="#8be9fd"
              transparent
              opacity={dimmed ? 0.25 : 0.7}
              side={THREE.DoubleSide}
              toneMapped={false}
              depthTest={false}
            />
          </mesh>
        )}
      </group>
      {/* Orbit direction arrow: travels the wide path (revolution speed only), separate from spin.
          This group's own world position is still recomputed every frame (a fixed 0.22 rad ahead of
          the body along its orbit) -- that continuous motion is the intended "watch the arrow travel
          around the orbit" visual. It has no in-canvas text label of its own -- the selected body's
          "Orbit" readout lives in the plain-DOM status card outside the Canvas (Wave 23, see
          SpaceLab.tsx's `orbit-status-card`), so this arrow's own sweeping motion can never drag a
          label anchor around with it. */}
      {showOrbitMotionMarkers && (
        <group ref={orbitArrowRef}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.075, 0.24, 12]} />
            <meshBasicMaterial color="#7dd3fc" toneMapped={false} />
          </mesh>
        </group>
      )}
    </>
  )
}

export default function OrbitSandbox({
  selectedId,
  onSelect,
  running,
  speedDaysPerSec,
  rotationSpeedScale = 1,
  distanceOverrideAU,
  isolateActive,
  cameraAutoRotate,
  cameraDistance = DEFAULT_CAMERA_DISTANCE,
  labelsVisible = false,
  xrayActive = false,
  stepToken = 0,
  stepDays = 12,
  onReady,
  onProgress,
}: {
  selectedId: string | null
  onSelect: (id: string) => void
  running: boolean
  speedDaysPerSec: number
  rotationSpeedScale?: number
  distanceOverrideAU: number | null
  isolateActive: boolean
  cameraAutoRotate: boolean
  cameraDistance?: number
  labelsVisible?: boolean
  xrayActive?: boolean
  /** Increment to nudge the simulation forward by `stepDays` while paused. */
  stepToken?: number
  stepDays?: number
  /** Fires exactly once, the moment every body in `planets` has settled (loaded its real model or
   *  fallen back to a placeholder) — the caller's cue that there is an actual visible scene, not
   *  just an empty stage. Deliberately local to this component's own known set of bodies rather
   *  than any shared/global three.js loading signal, so an unrelated asset elsewhere in the app
   *  can never wedge this scene's own "ready" state. */
  onReady?: () => void
  /** Fires after every individual body settles, with (settledCount, totalCount) — purely cosmetic,
   *  for a progress readout. */
  onProgress?: (settled: number, total: number) => void
}) {
  const dimmed = isolateActive && selectedId !== null
  // Native <OrbitControls> minDistance (mouse wheel / pinch, independent of the Zoom In/Out toolbar
  // buttons' own `cameraDistance` state) — body-aware so raw scroll/pinch zoom can't get any closer
  // than CameraFit's own ring-safety floor allows either. DEFAULT_CAMERA_DISTANCE already IS that
  // floor's value (computeRequiredCameraDistance at the fallback aspect — see CameraFit below), so
  // reusing it here keeps native zoom and the reactive camera fit in agreement instead of fighting
  // each other. Relaxed only for CLOSE_FOCUS_BODY_IDS (Ceres), which needs to zoom in much tighter.
  const orbitControlsMinDistance = selectedId && CLOSE_FOCUS_BODY_IDS.has(selectedId) ? CLOSE_FOCUS_MIN_DISTANCE : DEFAULT_CAMERA_DISTANCE

  /** Persists across renders; passed down to every OrbitingBody (which writes its own live (x, z)
   *  each frame) and to CameraFit (which reads it to fit the camera to Saturn's ring and/or the
   *  currently selected body's *actual current* position — see CameraFit below). */
  const livePositionsRef = useRef<LivePositions>(new Map())

  const settledIdsRef = useRef<Set<string>>(new Set())
  const readyFiredRef = useRef(false)
  const handleBodySettled = useCallback(
    (id: string) => {
      if (settledIdsRef.current.has(id)) return
      settledIdsRef.current.add(id)
      onProgress?.(settledIdsRef.current.size, planets.length)
      if (!readyFiredRef.current && settledIdsRef.current.size >= planets.length) {
        readyFiredRef.current = true
        onReady?.()
      }
    },
    [onProgress, onReady],
  )

  // Live <OrbitControls> instance — CameraFit needs imperative access so a CLOSE_FOCUS_BODY_IDS
  // selection (Ceres) can keep the controls' own `target` synced to that body's live position every
  // frame, not just the camera's distance/position (see CameraFit's `focus`/`getFocus` below).
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, cameraDistance * CAMERA_ELEVATION_RATIO, cameraDistance], fov: CAMERA_FOV_DEG }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
        }}
      >
        <color attach="background" args={['#0b1224']} />
        <ambientLight intensity={0.5} color="#c9d6ff" />
        <pointLight position={[0, 0, 0]} intensity={80} distance={60} decay={1.5} color="#fff3d6" />

        <Suspense fallback={<Html center><div role="status" aria-live="polite" className="rounded-full bg-black/40 px-4 py-2 text-xs text-white">Loading solar system…</div></Html>}>
          <CameraFit distance={cameraDistance} selectedId={selectedId} positionsRef={livePositionsRef} controlsRef={controlsRef} />
          <Stars radius={60} depth={30} count={2000} factor={2} fade speed={0.3} />
          {planets.map((body) => (
            <OrbitingBody
              key={body.id}
              body={body}
              distanceOverrideAU={body.id === selectedId ? distanceOverrideAU : null}
              running={running}
              speedDaysPerSec={speedDaysPerSec}
              rotationSpeedScale={rotationSpeedScale}
              selected={body.id === selectedId}
              dimmed={dimmed && body.id !== selectedId}
              labelsVisible={labelsVisible}
              xrayActive={xrayActive}
              onSelect={onSelect}
              stepToken={stepToken}
              stepDays={stepDays}
              onSettled={() => handleBodySettled(body.id)}
              positionsRef={livePositionsRef}
            />
          ))}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={orbitControlsMinDistance}
          maxDistance={MAX_ORBIT_CONTROLS_DISTANCE}
          enableDamping
          dampingFactor={0.08}
          autoRotate={cameraAutoRotate}
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  )
}

/** Fraction of the vertical frustum reserved at the *bottom* of the canvas for the floating
 *  Spin/Orbit/Year meter panel (SpaceLab.tsx's absolutely-positioned bottom overlay) — Wave 10 QA
 *  finding #2 included Saturn's rings rendering correctly-in-frustum but still visually sitting
 *  behind that panel. A body whose current screen position falls in the lower part of the frame is
 *  treated as needing a tighter (harder to satisfy) vertical bound than one in the upper part, so
 *  the fit pushes the camera back before a body gets that low, instead of only reacting to true
 *  off-canvas clipping. Approximate (the panel's real pixel height isn't read from the DOM here),
 *  but deterministic and re-applied every frame from each body's actual projected position. */
const BOTTOM_UI_RESERVE_FRACTION = 0.22

/**
 * Bounds-aware camera fit (Wave 11, focus-point corrected Wave 15). Computes, every frame, the
 * minimum camera distance that keeps two things inside the camera frustum, using their *actual
 * current* live world position (from `positionsRef`, written every frame by OrbitingBody) rather
 * than a precomputed worst case:
 *  1. Saturn's ring extent — always, regardless of what's selected, so the rings never clip/get
 *     occluded no matter which body a learner has picked (Wave 10 QA finding #2).
 *  2. The currently selected body's own extent — so whichever body is selected is guaranteed to
 *     be framed, which is what Wave 10 QA finding #5 (Neptune landing entirely off-canvas) needed:
 *     Neptune was never covered by the old computeRequiredCameraDistance loop at all, since that
 *     loop only visits ringed bodies and Neptune has no rings.
 *
 * Wave 15 QA finding #2: for a normal selection the camera looks at the world origin, but Ceres
 * orbits ~3.5 visual units out — larger than any camera distance close enough to actually read a
 * ~0.14-radius dwarf planet. Keeping the view origin-centered means Ceres's own orbital offset (not
 * its size) is what pins the required distance, so "close" and "fully in frame" were mutually
 * exclusive for it no matter how the distance math was tuned. The fix: for a CLOSE_FOCUS_BODY_IDS
 * selection, the camera looks at *that body's own live position* instead of the origin (see
 * `getFocus` below) — its orbital offset from the origin stops mattering entirely once the view is
 * centered on it, so only its own (small) extent needs to fit, which a close distance can satisfy.
 * `controlsRef` keeps native OrbitControls' own `target` synced to that same focus point every
 * frame, so drag/native-zoom orbit around the body being examined, not the origin, while it's
 * close-focused.
 *
 * The math (origin-centered case): the camera looks at a fixed focus point F, so with camera
 * position C = F + R * dirHat (dirHat = current unit view direction, R = distance to solve for),
 * the forward/right/up axes are all perpendicular to dirHat. For a point P (a body's live position,
 * relative to F) with framing radius r, P's horizontal/vertical offset from the view axis
 * (P·right, P·up) does NOT depend on R — only P's depth along the view axis does. So "R large
 * enough that P (± r) stays inside the half-angle tan(halfFov)" reduces to a direct, exact,
 * closed-form R for THIS specific live position — no worst-case search over every possible orbital
 * angle needed, and it's naturally exact regardless of where the body actually is.
 *
 * Applied two ways: (a) a `useEffect` on selection/aspect/requested-distance change jumps straight
 * to the correct distance in both directions (so Zoom In/Out, Fit View, and selecting a new body
 * all stay fully responsive), and (b) a `useFrame` continuously re-clamps the camera no *closer*
 * than what's currently required, so a body drifting into a bad angle mid-orbit (the sim runs by
 * default) gets caught too — but only ever pushes the camera further out, never fighting a user's
 * free zoom-in/drag the rest of the time.
 */
function CameraFit({
  distance,
  selectedId,
  positionsRef,
  controlsRef,
}: {
  distance: number
  selectedId: string | null
  positionsRef: LivePositionsRef
  /** Live <OrbitControls> instance (see OrbitSandbox's own controlsRef) — kept in sync with
   *  `getFocus()`'s current focus point every frame so native drag/zoom orbits around whatever the
   *  camera is actually looking at, not always the world origin. */
  controlsRef: RefObject<OrbitControlsImpl | null>
}) {
  const { camera, size } = useThree()
  // `size` is the Canvas's real measured pixel box (R3F keeps this live via ResizeObserver), so
  // this aspect ratio reflects the actual rendered canvas at any viewport/orientation.
  const aspect = size.height > 0 ? size.width / size.height : FALLBACK_ASPECT
  const closeFocus = selectedId !== null && CLOSE_FOCUS_BODY_IDS.has(selectedId)

  // World point the camera looks at / orbits around right now — the selected body's own live
  // position for a CLOSE_FOCUS_BODY_IDS selection, the world origin otherwise. Reads the live ref
  // directly (not memoized) so it reflects the current frame, not a stale render's snapshot.
  const getFocus = useCallback((): THREE.Vector3 => {
    if (!closeFocus || !selectedId) return new THREE.Vector3(0, 0, 0)
    const live = positionsRef.current.get(selectedId)
    if (live) return new THREE.Vector3(live.x, 0, live.z)
    const body = planets.find((b) => b.id === selectedId)
    return new THREE.Vector3(body ? visualDistance(body.distanceAU) : 0, 0, 0)
  }, [closeFocus, selectedId, positionsRef])

  const computeRequired = useCallback(
    (focus: THREE.Vector3) => {
      const halfVFovRad = THREE.MathUtils.degToRad(CAMERA_FOV_DEG / 2)
      const halfHFovRad = Math.atan(Math.tan(halfVFovRad) * aspect)
      const marginRad = THREE.MathUtils.degToRad(CAMERA_FIT_MARGIN_DEG)
      const tanHalfVFov = Math.tan(Math.max(halfVFovRad - marginRad, 0.01))
      const tanHalfVFovBottom = Math.tan(Math.max((halfVFovRad - marginRad) * (1 - BOTTOM_UI_RESERVE_FRACTION), 0.01))
      const tanHalfHFov = Math.tan(Math.max(halfHFovRad - marginRad, 0.01))

      if (closeFocus) {
        // Camera looks directly at the selected body now (focus === its own live position), so its
        // own extent is the ONLY thing that needs to fit — no orbital offset left to account for.
        const body = selectedId ? planets.find((b) => b.id === selectedId) : undefined
        const extent = body ? bodyFramingExtent(body) : MIN_REQUIRED_FIT_DISTANCE
        return Math.max(MIN_REQUIRED_FIT_DISTANCE, extent / tanHalfHFov, extent / tanHalfVFov)
      }

      const dirHat = camera.position.clone().sub(focus)
      if (dirHat.lengthSq() < 0.001) dirHat.set(0, CAMERA_ELEVATION_RATIO, 1)
      dirHat.normalize()
      const forward = dirHat.clone().multiplyScalar(-1)
      const worldUp = new THREE.Vector3(0, 1, 0)
      let right = new THREE.Vector3().crossVectors(forward, worldUp)
      if (right.lengthSq() < 0.0001) right = new THREE.Vector3(1, 0, 0)
      right.normalize()
      const upCam = new THREE.Vector3().crossVectors(right, forward).normalize()

      // Numeric safety floor only, NOT a "whole scene" default (that was the Ceres bug: flooring
      // every selection at FALLBACK_CAMERA_DISTANCE=11 regardless of what's selected).
      let required = MIN_REQUIRED_FIT_DISTANCE

      const considerBody = (body: PlanetBody) => {
        const live = positionsRef.current.get(body.id)
        // Before the first frame has written a live position, fall back to a same-plane point at
        // the body's full orbital distance (on the horizontal/right axis) — a reasonable stand-in
        // until the real position lands a frame or two later, when the useFrame clamp corrects it.
        const point = new THREE.Vector3(live ? live.x : visualDistance(body.distanceAU), 0, live ? live.z : 0)
        const extent = bodyFramingExtent(body)

        const depth = point.dot(dirHat)
        const h = point.dot(right)
        const v = point.dot(upCam)
        const neededForH = depth + (Math.abs(h) + extent) / tanHalfHFov
        const neededForV = depth + (Math.abs(v) + extent) / (v < 0 ? tanHalfVFovBottom : tanHalfVFov)
        required = Math.max(required, neededForH, neededForV)
      }

      // Saturn ring safety: static angle-independent worst case (see computeRequiredCameraDistance
      // above), applied unconditionally here (this branch only runs when NOT close-focused —
      // closeFocus returns above) as a floor under whatever considerBody below computes. This used
      // to be paired with a `!selectedBody.hasRings` guard that skipped considerBody entirely for
      // Saturn, out of a stale Wave 12 QA concern that a live-position check could re-clip the
      // rings on repeated Zoom In. That guard predates bodyFramingExtent being ring-aware: extent
      // for a ringed body already accounts for its rings, and considerBody only ever widens
      // `required` via Math.max — it can push the camera further out, never pull it closer — so it
      // cannot reintroduce a ring clip. Saturn needs its own live-position fit considered like every
      // other body, on top of this static floor, or its selected position can still clip the left
      // canvas edge on mobile.
      required = Math.max(required, computeRequiredCameraDistance(aspect))
      const selectedBody = selectedId ? planets.find((b) => b.id === selectedId) : undefined
      if (selectedBody) considerBody(selectedBody)

      return required
    },
    [aspect, selectedId, closeFocus, camera, positionsRef],
  )

  // (a) Explicit changes (Zoom In/Out, Fit View, Reset via `distance`; a resize via `aspect`;
  // picking a new body via `selectedId`, folded into computeRequired's own deps) snap the camera
  // straight to the right distance, in either direction, relative to the current focus point.
  useEffect(() => {
    const focus = getFocus()
    const required = Math.max(distance, computeRequired(focus))
    const dirHat = camera.position.clone().sub(focus)
    if (dirHat.lengthSq() < 0.001) dirHat.set(0, CAMERA_ELEVATION_RATIO, 1)
    dirHat.normalize()
    camera.position.copy(focus.clone().add(dirHat.multiplyScalar(required)))
    camera.updateProjectionMatrix()
    if (controlsRef.current) {
      controlsRef.current.target.copy(focus)
      controlsRef.current.update()
    }
  }, [camera, distance, computeRequired, getFocus, controlsRef, selectedId])

  // (b) Continuous safety net while the sim keeps running: only ever pushes the camera OUT if the
  // live position now demands more room than it currently has — never pulls it in, so it doesn't
  // fight OrbitControls' own drag/zoom the rest of the time. Also keeps the controls' target locked
  // onto the current focus point every frame, so a close-focused body stays centered as it orbits.
  useFrame(() => {
    const focus = getFocus()
    const required = computeRequired(focus)
    const current = camera.position.distanceTo(focus)
    if (required > current + 0.02) {
      const dirHat = camera.position.clone().sub(focus)
      if (dirHat.lengthSq() < 0.001) dirHat.set(0, CAMERA_ELEVATION_RATIO, 1)
      dirHat.normalize()
      camera.position.copy(focus.clone().add(dirHat.multiplyScalar(required)))
      camera.updateProjectionMatrix()
    }
    if (controlsRef.current) {
      controlsRef.current.target.copy(focus)
    }
  })

  return null
}
