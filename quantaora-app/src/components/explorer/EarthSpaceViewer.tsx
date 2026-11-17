import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars as StarField } from '@react-three/drei'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { GlbErrorBoundary } from './GlbErrorBoundary'
import { EARTH_AXIAL_TILT_DEG } from '@/lib/earthInSpacePhysics'
import { CAMERA_FOV_DEG } from '@/lib/earthSpaceCamera'
import type { EarthSpaceMode } from '@/data/earthInSpace'

/**
 * Deep-space 3D stage for the Earth In Space lab. Unlike Moons/Stars (one body,
 * hotspots), this branch is process-driven: five different simulations reuse
 * the same Sun/Earth/Moon actors at different positions, angles, and
 * lighting, driven entirely by props the route (EarthInSpaceLab.tsx) computes
 * and animates — this file owns no simulation state of its own except the
 * always-on Earth spin visible in 'motion' mode (see MotionScene). Every
 * numeric readout shown to the user (season, moon phase, tide, eclipse
 * strength) is computed in src/lib/earthInSpacePhysics.ts and rendered as
 * plain DOM in the route's sidebar, not inside the canvas — this file is
 * purely the 3D geometry.
 */

const EARTH_MODEL_URL = '/models/space/planets/earth.glb'
const MOON_MODEL_URL = '/models/sourced/space/moon-earth-optimized.glb'
const MOON_DRACO_PATH = '/draco/'

const EARTH_SIZE = 1.7
const MOON_SIZE = 0.48
const SUN_RADIUS = 0.85
const MOTION_ORBIT_RADIUS = 4.2
const SEASONS_ORBIT_RADIUS = 4.2
const WIDE_SCENE_X_OFFSET = -1.2
const MOON_ORBIT_RADIUS = 3.3
const TIDE_MOON_DISTANCE = 4.4

/** Not-to-scale note shared by every mode's caption pill in the route — kept here as the single
 *  source of truth since every mode compresses real distances/sizes for visual clarity. */
export const NOT_TO_SCALE_NOTE =
  'Sizes and distances are adjusted so the motion stays clear — not drawn to real scale.'

function degToRad(deg: number) {
  return (deg * Math.PI) / 180
}

// ─────────────────────────────── shared bodies ───────────────────────────────

function PlaceholderSphere({ size, tint }: { size: number; tint: string }) {
  return (
    <mesh>
      <sphereGeometry args={[size / 2, 28, 28]} />
      <meshStandardMaterial color={tint} roughness={0.95} metalness={0} />
    </mesh>
  )
}

function useNormalizedClone(scene: THREE.Object3D, targetSize: number) {
  return useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = targetSize / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) child.frustumCulled = false
    })
    return cloned
  }, [scene, targetSize])
}

function NormalizedGlb({ url, draco, size }: { url: string; draco?: string; size: number }) {
  const { scene } = useGLTF(url, draco)
  const model = useNormalizedClone(scene, size)
  return <primitive object={model} />
}

function SafeModel({ url, draco, size, tint }: { url: string; draco?: string; size: number; tint: string }) {
  return (
    <GlbErrorBoundary fallback={<PlaceholderSphere size={size} tint={tint} />} source="[EarthSpaceViewer]">
      <Suspense fallback={<PlaceholderSphere size={size} tint={tint} />}>
        <NormalizedGlb url={url} draco={draco} size={size} />
      </Suspense>
    </GlbErrorBoundary>
  )
}

function EarthBody({ size = EARTH_SIZE }: { size?: number }) {
  return <SafeModel url={EARTH_MODEL_URL} size={size} tint="#3f6ea8" />
}

function MoonBody3D({ size = MOON_SIZE }: { size?: number }) {
  return <SafeModel url={MOON_MODEL_URL} draco={MOON_DRACO_PATH} size={size} tint="#b9c2cc" />
}

/** The Sun as a bright, self-lit sphere. In 'motion'/'seasons' mode it sits at the scene's true
 *  center and casts a real point light Earth orbits around, so the day/night terminator on Earth
 *  falls out of ordinary Three.js lighting rather than any special-cased shader. */
function SunCore({ radius = SUN_RADIUS, withLight = true }: { radius?: number; withLight?: boolean }) {
  return (
    <group position={[WIDE_SCENE_X_OFFSET, 0, 0]}>
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color="#ffe6a8" />
      </mesh>
      {withLight && <pointLight color="#fff3d6" intensity={38} decay={2} distance={0} />}
    </group>
  )
}

function OrbitRing({ radius, opacity = 0.45 }: { radius: number; opacity?: number }) {
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.01, 8, 128]} />
      <meshBasicMaterial color="#5d6f9e" transparent opacity={opacity} />
    </mesh>
  )
}

function BodyLabel({ text, position }: { text: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={9} zIndexRange={[10, 0]}>
      <span className="pointer-events-none rounded-full bg-[color:var(--color-ink-900)]/85 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-md">
        {text}
      </span>
    </Html>
  )
}

/** Far, effectively-parallel sunlight used by phases/eclipses/tides mode (the Sun there is not
 *  the scene's orbital center, so a directional light — astronomically correct for a source this
 *  far away — replaces the point light MotionScene/SeasonsScene use. */
function ParallelSunlight({ direction }: { direction: THREE.Vector3 }) {
  const pos: [number, number, number] = [direction.x * 22, direction.y * 22, direction.z * 22]
  return (
    <>
      <directionalLight position={pos} intensity={2.4} color="#fff3d6" />
      <mesh position={[direction.x * 15, direction.y * 15, direction.z * 15]}>
        <sphereGeometry args={[SUN_RADIUS * 0.7, 24, 24]} />
        <meshBasicMaterial color="#ffe6a8" />
      </mesh>
    </>
  )
}

// ────────────────────────────── mode: motion ──────────────────────────────

/** 'speed=1' completes one rotation every 3s and one revolution every 24s — an 8:1 ratio picked
 *  purely so both motions read clearly on screen at once; the real ratio (~365:1) would make
 *  rotation invisible at any revolution rate slow enough to actually see the orbit happen. The
 *  lesson content is explicit that this is not the real ratio. */
const ROTATION_RATE = (Math.PI * 2) / 3
const REVOLUTION_RATE = (Math.PI * 2) / 24

function MotionScene({
  rotationSpeed,
  revolutionSpeed,
  playing,
  labelsVisible,
}: {
  rotationSpeed: number
  revolutionSpeed: number
  playing: boolean
  labelsVisible: boolean
}) {
  const orbitRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!playing) return
    if (orbitRef.current) orbitRef.current.rotation.y += delta * revolutionSpeed * REVOLUTION_RATE
    if (spinRef.current) spinRef.current.rotation.y += delta * rotationSpeed * ROTATION_RATE
  })

  return (
    <group position={[WIDE_SCENE_X_OFFSET, 0, 0]}>
      <SunCore />
      {labelsVisible && <BodyLabel text="Sun" position={[0, SUN_RADIUS + 0.5, 0]} />}
      <OrbitRing radius={MOTION_ORBIT_RADIUS} />
      <group ref={orbitRef}>
        <group position={[MOTION_ORBIT_RADIUS, 0, 0]}>
          <group rotation={[0, 0, degToRad(EARTH_AXIAL_TILT_DEG)]}>
            <group ref={spinRef}>
              <EarthBody />
              {/* Bright marker fixed to Earth's surface — because it's a child of the same group
                  that spins, it visibly whips around fast under rotation while the whole group
                  also glides slowly around the orbit ring under revolution: the two motions read
                  as distinct even though the marker is the single point being watched. */}
              <mesh position={[EARTH_SIZE / 2 + 0.06, 0, 0]}>
                <sphereGeometry args={[0.08, 12, 12]} />
                <meshBasicMaterial color="#7dd3fc" />
              </mesh>
            </group>
            {labelsVisible && <BodyLabel text="Earth" position={[0, EARTH_SIZE / 2 + 0.5, 0]} />}
          </group>
        </group>
      </group>
    </group>
  )
}

// ────────────────────────────── mode: seasons ──────────────────────────────

/** Always-on gentle spin so the day/night terminator stays visibly alive while a learner drags
 *  the orbit-position/tilt sliders — independent of `playing`, which here only controls whether
 *  the route auto-advances orbitAngleDeg through the year. */
const SEASONS_SPIN_RATE = (Math.PI * 2) / 6

function SeasonsScene({
  tiltDeg,
  orbitAngleDeg,
  labelsVisible,
}: {
  tiltDeg: number
  orbitAngleDeg: number
  labelsVisible: boolean
}) {
  const spinRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * SEASONS_SPIN_RATE
  })

  const orbitRad = degToRad(orbitAngleDeg)
  const earthPos: [number, number, number] = [Math.cos(orbitRad) * SEASONS_ORBIT_RADIUS, 0, Math.sin(orbitRad) * SEASONS_ORBIT_RADIUS]

  // Equinox/solstice tick marks at the four cardinal orbit points, purely visual reference.
  const ticks = [0, 90, 180, 270].map((deg) => {
    const r = degToRad(deg)
    return [Math.cos(r) * SEASONS_ORBIT_RADIUS, 0, Math.sin(r) * SEASONS_ORBIT_RADIUS] as [number, number, number]
  })

  return (
    <group>
      <SunCore />
      {labelsVisible && <BodyLabel text="Sun" position={[0, SUN_RADIUS + 0.5, 0]} />}
      <OrbitRing radius={SEASONS_ORBIT_RADIUS} />
      {ticks.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshBasicMaterial color="#8a97c4" />
        </mesh>
      ))}
      <group position={earthPos}>
        {/* The axial tilt stays pointed the same absolute direction in space as orbitAngleDeg
            changes (real Earth behavior) — so this group's rotation is NOT relative to the
            Sun-facing direction, just a fixed lean applied once, matching SeasonsScene's
            physics.ts counterpart (subsolarLatitudeDeg assumes a fixed-direction tilt). */}
        <group rotation={[0, 0, degToRad(tiltDeg)]}>
          <group ref={spinRef}>
            <EarthBody />
          </group>
          {labelsVisible && <BodyLabel text="Earth" position={[0, EARTH_SIZE / 2 + 0.5, 0]} />}
        </group>
      </group>
    </group>
  )
}

// ────────────────────────────── mode: phases ──────────────────────────────

const PHASES_SUN_DIR = new THREE.Vector3(-1, 0.12, 0.3).normalize()

function PhasesScene({ moonAngleDeg, labelsVisible }: { moonAngleDeg: number; labelsVisible: boolean }) {
  const spinRef = useRef<THREE.Group>(null)
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * 0.25
  })

  // moonAngleDeg=0 -> Moon sits toward the Sun (New Moon); 180 -> opposite the Sun (Full Moon).
  const rad = degToRad(moonAngleDeg)
  const dir = PHASES_SUN_DIR.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rad)
  const moonPos: [number, number, number] = [dir.x * MOON_ORBIT_RADIUS, dir.y * MOON_ORBIT_RADIUS, dir.z * MOON_ORBIT_RADIUS]

  return (
    <group>
      <ambientLight intensity={0.06} />
      <ParallelSunlight direction={PHASES_SUN_DIR} />
      <group ref={spinRef}>
        <EarthBody size={EARTH_SIZE * 0.9} />
      </group>
      {labelsVisible && <BodyLabel text="Earth" position={[0, (EARTH_SIZE * 0.9) / 2 + 0.5, 0]} />}
      <OrbitRing radius={MOON_ORBIT_RADIUS} opacity={0.3} />
      <group position={moonPos}>
        <MoonBody3D />
        {labelsVisible && <BodyLabel text="Moon" position={[0, MOON_SIZE / 2 + 0.4, 0]} />}
      </group>
    </group>
  )
}

// ────────────────────────────── mode: eclipses ──────────────────────────────

function ShadowCone({ from, to, radius, opacity = 0.35 }: { from: THREE.Vector3; to: THREE.Vector3; radius: number; opacity?: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const length = from.distanceTo(to)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.position.copy(from)
    group.lookAt(to)
    group.rotateX(Math.PI / 2)
  }, [from, to])

  return (
    <group ref={groupRef}>
      <mesh position={[0, -length / 2, 0]}>
        <coneGeometry args={[radius, length, 24, 1, true]} />
        <meshBasicMaterial color="#0a0e1c" transparent opacity={opacity} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

const ECLIPSE_SUN_DIR = new THREE.Vector3(-1, 0, 0)

function EclipseScene({
  eclipseType,
  alignmentOffsetDeg,
  useRealisticTilt,
  labelsVisible,
}: {
  eclipseType: 'solar' | 'lunar'
  alignmentOffsetDeg: number
  useRealisticTilt: boolean
  labelsVisible: boolean
}) {
  const earthPos = new THREE.Vector3(0, 0, 0)
  const offsetRad = degToRad(useRealisticTilt ? alignmentOffsetDeg : 0)
  // eclipseType 'solar': Moon sits between Sun and Earth. 'lunar': Moon sits on the far side of
  // Earth from the Sun. Either way the alignment offset tips the Moon slightly out of the exact
  // Sun-Earth line (vertically), mirroring the real 5.1° orbital-tilt effect this component
  // teaches via the tilt toggle above.
  const sideSign = eclipseType === 'solar' ? -1 : 1
  const baseDir = ECLIPSE_SUN_DIR.clone().multiplyScalar(sideSign)
  const tiltedDir = baseDir.clone().applyAxisAngle(new THREE.Vector3(0, 0, 1), offsetRad).normalize()
  const moonPos = tiltedDir.clone().multiplyScalar(MOON_ORBIT_RADIUS * 0.62)

  const shadowFrom = eclipseType === 'solar' ? moonPos : earthPos
  const shadowTo = eclipseType === 'solar' ? earthPos : moonPos
  const shadowRadius = eclipseType === 'solar' ? MOON_SIZE * 0.55 : EARTH_SIZE * 0.5

  return (
    <group>
      <ambientLight intensity={0.08} />
      <ParallelSunlight direction={ECLIPSE_SUN_DIR} />
      <EarthBody size={EARTH_SIZE * 0.9} />
      {labelsVisible && <BodyLabel text="Earth" position={[0, (EARTH_SIZE * 0.9) / 2 + 0.5, 0]} />}
      <group position={[moonPos.x, moonPos.y, moonPos.z]}>
        <MoonBody3D />
        {labelsVisible && <BodyLabel text="Moon" position={[0, MOON_SIZE / 2 + 0.4, 0]} />}
      </group>
      <ShadowCone from={shadowFrom} to={shadowTo} radius={shadowRadius} />
    </group>
  )
}

// ────────────────────────────── mode: tides ──────────────────────────────

const TIDE_MOON_DIR = new THREE.Vector3(1, 0, 0)

function TidesScene({
  tideSpinAngleDeg,
  springTide,
  labelsVisible,
}: {
  tideSpinAngleDeg: number
  springTide: boolean
  labelsVisible: boolean
}) {
  const bulgeScaleX = springTide ? 1.42 : 1.14
  const earthCoreSize = EARTH_SIZE * 0.82

  return (
    <group>
      <ambientLight intensity={0.16} />
      <directionalLight position={[-6, 3, 4]} intensity={1.6} color="#fff3d6" />
      <directionalLight position={[6, -2, -4]} intensity={0.5} color="#8fb6ff" />

      <group position={[TIDE_MOON_DIR.x * TIDE_MOON_DISTANCE, 0, 0]}>
        <MoonBody3D size={MOON_SIZE * 0.9} />
        {labelsVisible && <BodyLabel text="Moon" position={[0, (MOON_SIZE * 0.9) / 2 + 0.4, 0]} />}
      </group>

      {/* Ocean bulge — world-fixed (not a child of the spinning group below), so it always
          stays pointed toward the Moon while Earth spins underneath it, matching real tides. */}
      <mesh scale={[bulgeScaleX, 1, 1]}>
        <sphereGeometry args={[earthCoreSize / 2 + 0.22, 28, 28]} />
        <meshStandardMaterial color="#5fc4f0" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <mesh scale={[bulgeScaleX, 1, 1]}>
        <sphereGeometry args={[earthCoreSize / 2 + 0.22, 28, 28]} />
        <meshBasicMaterial color="#8fd9ff" wireframe transparent opacity={0.4} />
      </mesh>

      <group rotation={[0, degToRad(tideSpinAngleDeg), 0]}>
        <EarthBody size={earthCoreSize} />
        {/* "You are here" marker — a child of the spinning group, so it sweeps through the
            world-fixed bulge above twice per rotation (2 highs, 2 lows), matching tideState()
            in earthInSpacePhysics.ts. */}
        <mesh position={[earthCoreSize / 2 + 0.1, 0, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
        {labelsVisible && <BodyLabel text="Earth" position={[0, earthCoreSize / 2 + 0.5, 0]} />}
      </group>
    </group>
  )
}

// ────────────────────────────── public viewer ──────────────────────────────

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const direction = camera.position.clone()
    if (direction.lengthSq() < 0.001) direction.set(0, 0.35, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])
  return null
}

export interface EarthSpaceViewerProps {
  mode: EarthSpaceMode
  playing: boolean
  autoRotate: boolean
  cameraDistance: number
  resetSignal: number
  labelsVisible: boolean
  rotationSpeed: number
  revolutionSpeed: number
  tiltDeg: number
  orbitAngleDeg: number
  moonAngleDeg: number
  eclipseType: 'solar' | 'lunar'
  alignmentOffsetDeg: number
  useRealisticTilt: boolean
  tideSpinAngleDeg: number
  springTide: boolean
}

export default function EarthSpaceViewer({
  mode,
  playing,
  autoRotate,
  cameraDistance,
  resetSignal,
  labelsVisible,
  rotationSpeed,
  revolutionSpeed,
  tiltDeg,
  orbitAngleDeg,
  moonAngleDeg,
  eclipseType,
  alignmentOffsetDeg,
  useRealisticTilt,
  tideSpinAngleDeg,
  springTide,
}: EarthSpaceViewerProps) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 3.2, cameraDistance], fov: CAMERA_FOV_DEG }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={['#070a16']} />
        <ambientLight intensity={0.12} color="#aebedd" />

        <Suspense fallback={null}>
          <CameraDistance distance={cameraDistance} />
          <StarField radius={90} depth={45} count={2200} factor={2} fade speed={0.15} />

          {mode === 'motion' && (
            <MotionScene rotationSpeed={rotationSpeed} revolutionSpeed={revolutionSpeed} playing={playing} labelsVisible={labelsVisible} />
          )}
          {mode === 'seasons' && <SeasonsScene tiltDeg={tiltDeg} orbitAngleDeg={orbitAngleDeg} labelsVisible={labelsVisible} />}
          {mode === 'phases' && <PhasesScene moonAngleDeg={moonAngleDeg} labelsVisible={labelsVisible} />}
          {mode === 'eclipses' && (
            <EclipseScene
              eclipseType={eclipseType}
              alignmentOffsetDeg={alignmentOffsetDeg}
              useRealisticTilt={useRealisticTilt}
              labelsVisible={labelsVisible}
            />
          )}
          {mode === 'tides' && <TidesScene tideSpinAngleDeg={tideSpinAngleDeg} springTide={springTide} labelsVisible={labelsVisible} />}
        </Suspense>

        <OrbitControls
          ref={controlsRef}
          key={`${resetSignal}-${cameraDistance}-${mode}`}
          enablePan={false}
          minDistance={3.5}
          maxDistance={22}
          minPolarAngle={Math.PI * 0.1}
          maxPolarAngle={Math.PI * 0.9}
          enableDamping
          dampingFactor={0.08}
          rotateSpeed={0.55}
          autoRotate={autoRotate}
          autoRotateSpeed={0.6}
        />
      </Canvas>
    </div>
  )
}

useGLTF.preload(EARTH_MODEL_URL)
