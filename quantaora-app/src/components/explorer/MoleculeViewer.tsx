import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { MoleculeModel, proceduralFootprint, type ModelReadyInfo } from './MoleculeModel'
import type { Atom, Bond } from '@/data/molecules'
import { cn } from '@/lib/utils'

// Must match the Canvas camera's `fov` below — used to work out how far back the camera needs
// to sit to fit a given model's real bounding sphere in frame.
const CAMERA_FOV_DEG = 38
const CAMERA_FOV_RAD = (CAMERA_FOV_DEG * Math.PI) / 180
// Headroom around the model's worst-case (any-rotation) bounding sphere at the "default"/"fit
// view" distance, and how far the min/max zoom range extends relative to that fit distance.
const FIT_MARGIN = 1.3
const MIN_DISTANCE_FACTOR = 0.45
const MAX_DISTANCE_FACTOR = 2.1
const ABSOLUTE_MIN_DISTANCE = 1.1
const FALLBACK_ASPECT = 1.6

export interface CameraBounds {
  min: number
  max: number
  default: number
  step: number
}

/** Distance a camera with vertical FOV `CAMERA_FOV_DEG` needs to sit at, for a sphere of the
 *  given `radius` centered at the origin to fit fully inside the frame — using whichever of the
 *  vertical/horizontal FOV is tighter for the current viewport aspect ratio, since a narrow
 *  portrait canvas (mobile) is often horizontally tighter than the camera's vertical FOV. */
function fitDistanceForRadius(radius: number, aspect: number): number {
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : 1.2
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : FALLBACK_ASPECT
  const halfVertical = CAMERA_FOV_RAD / 2
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * safeAspect)
  const bindingHalfFov = Math.min(halfVertical, halfHorizontal)
  const safeHalfFov = Math.min(Math.max(bindingHalfFov, 0.05), Math.PI / 2 - 0.01)
  return safeRadius / Math.sin(safeHalfFov)
}

function boundsForFitDistance(fitDistance: number): CameraBounds {
  const defaultDistance = fitDistance * FIT_MARGIN
  const minDistance = Math.max(fitDistance * MIN_DISTANCE_FACTOR, ABSOLUTE_MIN_DISTANCE)
  const maxDistance = Math.max(fitDistance * MAX_DISTANCE_FACTOR, defaultDistance + 0.5)
  const step = Math.max(defaultDistance * 0.1, 0.25)
  return {
    min: Number(minDistance.toFixed(2)),
    max: Number(maxDistance.toFixed(2)),
    default: Number(defaultDistance.toFixed(2)),
    step: Number(step.toFixed(2)),
  }
}

function AtomMarker({
  atom,
  position,
  active,
  labelsVisible,
  onSelect,
}: {
  atom: Atom
  /** Real on-screen position for this atom. Defaults to the atom's authored position, but for
   *  GLB-rendered molecules this is overridden with the position actually reported by the loaded
   *  mesh (see MoleculeModel's `onModelReady`) — the authored `atoms` coordinates aren't
   *  guaranteed to line up with the real rendered geometry (see sodium-chloride-lattice, whose
   *  2-atom "formula unit" coordinates don't correspond to any single node in the real ~27-ion
   *  lattice mesh). */
  position: [number, number, number]
  active: boolean
  labelsVisible: boolean
  onSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Html position={position} center distanceFactor={5} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(atom.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${atom.element}`}
        className={cn(
          'group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform',
          (hovered || active) && 'scale-110',
        )}
      >
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-full mt-1 max-w-24 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity',
            (hovered || active || labelsVisible) && 'opacity-100',
          )}
        >
          {atom.element}
        </span>
      </button>
    </Html>
  )
}

export default function MoleculeViewer({
  atoms,
  bonds,
  activeAtom,
  onSelectAtom,
  autoRotate,
  resetSignal,
  modelType = 'procedural',
  modelUrl,
  modelRotation,
  cameraDistance = 3.6,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  isolateFocusMode = false,
  onBoundsChange,
}: {
  atoms: Atom[]
  bonds: Bond[]
  activeAtom: string | null
  onSelectAtom: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  modelType?: 'glb' | 'procedural'
  modelUrl?: string
  /** Fixed Euler correction [x, y, z] (radians) applied to a `'glb'` model — see `Molecule.modelRotation`. */
  modelRotation?: [number, number, number]
  cameraDistance?: number
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  /** See ChemistryLab.tsx's "Focus this ion" toggle — only meaningful for `'glb'` rendering with
   *  an atom/ion selected; strengthens the isolate dim on every node except the selected one. */
  isolateFocusMode?: boolean
  /** Reports the current molecule's real camera-distance range (min/max/default/step) — derived
   *  from its actual rendered bounding sphere and the canvas's live aspect ratio — so the caller
   *  can drive zoom in/out buttons and Fit View correctly instead of assuming one shared range
   *  fits every molecule. */
  onBoundsChange?: (bounds: CameraBounds) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(FALLBACK_ASPECT)
  // What the currently-rendered model actually reports about itself (real bounding radius + real
  // on-screen atom positions), once known. Reset to null whenever the model identity changes so
  // a stale, previous molecule's measurements never get applied to the new one even for a frame.
  const [modelInfo, setModelInfo] = useState<ModelReadyInfo | null>(null)

  useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setAspect(width / height)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setModelInfo(null)
  }, [modelUrl, modelType, modelRotation])

  // Synchronous fallback derived straight from the authored atoms, available immediately (no
  // GLB load to wait on) — this is the exact truth for procedural rendering, and a reasonable
  // first estimate for GLB rendering until the real mesh reports back via onModelReady.
  const footprintRadius = useMemo(() => proceduralFootprint(atoms).length() / 2, [atoms])
  const radius = modelInfo?.radius ?? footprintRadius
  const atomPositions = modelInfo?.atomPositions ?? null

  const bounds = useMemo(() => boundsForFitDistance(fitDistanceForRadius(radius, aspect)), [radius, aspect])

  useEffect(() => {
    onBoundsChange?.(bounds)
    // onBoundsChange intentionally excluded: it's called with the latest `bounds` value already,
    // and including it would refire this effect on every parent re-render for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds])

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, cameraDistance], fov: CAMERA_FOV_DEG }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={['#faf8f4']} />
        <ambientLight intensity={0.7} color="#fff4e6" />
        <directionalLight position={[3, 4, 3]} intensity={2} color="#fff7ec" />
        <directionalLight position={[-3, -1, 2]} intensity={0.6} color="#dce8f5" />

        <Suspense
          fallback={
            <Html center>
              <div
                role="status"
                aria-live="polite"
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-2 text-xs font-medium text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]"
              >
                Loading model…
              </div>
            </Html>
          }
        >
          <CameraDistance distance={cameraDistance} />
          <MoleculeModel
            atoms={atoms}
            bonds={bonds}
            autoRotate={autoRotate}
            activeAtomId={activeAtom}
            modelType={modelType}
            modelUrl={modelUrl}
            modelRotation={modelRotation}
            xrayActive={xrayActive}
            animationPlaying={animationPlaying}
            isolateFocusMode={isolateFocusMode}
            onModelReady={setModelInfo}
          />
          {atoms.map((atom) => (
            <AtomMarker
              key={atom.id}
              atom={atom}
              position={atomPositions?.[atom.id] ?? atom.position}
              active={activeAtom === atom.id}
              labelsVisible={labelsVisible}
              onSelect={onSelectAtom}
            />
          ))}
          <ContactShadows position={[0, -0.9, 0]} opacity={0.3} scale={4} blur={2.4} far={2} />
        </Suspense>

        <OrbitControls
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={bounds.min}
          maxDistance={bounds.max}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  )
}

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()

  useEffect(() => {
    const direction = camera.position.clone()
    if (direction.lengthSq() < 0.001) direction.set(0, 0.4, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return null
}
