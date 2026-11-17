import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Html, OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { useGlbRetry } from './useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from './GlbErrorBoundary'
import type { Hotspot } from '@/data/types'
import { cn } from '@/lib/utils'

// Dedicated viewer for the 3 crystal-lattice GLBs (diamond / silicon carbide / graphite sheet).
// Mirrors MoleculeViewer.tsx's real-bounding-sphere-driven camera-fit pattern (see
// src/routes/perModelCameraConfig.test.ts for the regression guard on that convention in
// ChemistryLab) rather than reusing one fixed camera distance for every model: diamond, SiC, and
// the graphite sheet have very different real extents (diamond ~74x83x71mm roughly cube-shaped;
// SiC ~167x151x145mm also roughly cube-shaped but larger; graphite ~673x502x31mm, an extremely
// flat wide sheet) per the .license.json sidecars' approxBoundingBox data, so a single shared
// distance picked for one would clip or under-fill the others.
//
// Deliberately does NOT retune material roughness/metalness/clearcoat the way GenericModel.tsx /
// MoleculeModel.tsx do for other GLB catalogs — those crystal materials were purpose-tuned in
// docs/assets/reviews/crystal-material-fix.md (including a Wave 9 contrast fix for diamond) and
// visually reviewed to PASS as-is; flattening them here would undo that reviewed look.

const CRYSTAL_FIT_SIZE = 3.8
const CAMERA_FOV_DEG = 36
const CAMERA_FOV_RAD = (CAMERA_FOV_DEG * Math.PI) / 180
const FIT_MARGIN = 1.35
const MIN_DISTANCE_FACTOR = 0.5
const MAX_DISTANCE_FACTOR = 2.2
const ABSOLUTE_MIN_DISTANCE = 1.4
const FALLBACK_ASPECT = 1.6
const FALLBACK_RADIUS = 2

export interface CrystalCameraBounds {
  min: number
  max: number
  default: number
  step: number
}

/** Distance a camera with vertical FOV `CAMERA_FOV_DEG` needs to sit at, for a sphere of the
 *  given `radius` centered at the origin to fit fully inside the frame — using whichever of the
 *  vertical/horizontal FOV is tighter for the current viewport aspect ratio, so a narrow portrait
 *  canvas (mobile) is accounted for, not just the vertical FOV. Same formula as
 *  MoleculeViewer.tsx's fitDistanceForRadius. */
function fitDistanceForRadius(radius: number, aspect: number): number {
  const safeRadius = Number.isFinite(radius) && radius > 0 ? radius : FALLBACK_RADIUS
  const safeAspect = Number.isFinite(aspect) && aspect > 0 ? aspect : FALLBACK_ASPECT
  const halfVertical = CAMERA_FOV_RAD / 2
  const halfHorizontal = Math.atan(Math.tan(halfVertical) * safeAspect)
  const bindingHalfFov = Math.min(halfVertical, halfHorizontal)
  const safeHalfFov = Math.min(Math.max(bindingHalfFov, 0.05), Math.PI / 2 - 0.01)
  return safeRadius / Math.sin(safeHalfFov)
}

function boundsForFitDistance(fitDistance: number): CrystalCameraBounds {
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

function HotspotMarker({
  hotspot,
  active,
  labelsVisible,
  onSelect,
}: {
  hotspot: Hotspot
  active: boolean
  labelsVisible: boolean
  onSelect: (id: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Html position={hotspot.position} center distanceFactor={3.5} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(hotspot.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${hotspot.label}`}
        className="group relative flex h-11 w-11 items-center justify-center"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span
            className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', active && 'animate-ping')}
            style={{ background: hotspot.color }}
          />
          <span
            className={cn(
              'relative inline-flex h-3 w-3 rounded-full border-2 border-white shadow-md transition-transform',
              (hovered || active) && 'scale-125',
            )}
            style={{ background: hotspot.color }}
          />
        </span>
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-full mt-1 max-w-32 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity',
            (hovered || active || labelsVisible) && 'opacity-100',
          )}
        >
          {hotspot.label}
        </span>
      </button>
    </Html>
  )
}

function CrystalMesh({
  url,
  autoRotate,
  hotspots,
  activeHotspotId,
  labelsVisible,
  xrayActive,
  onSelectHotspot,
  onReady,
}: {
  url: string
  autoRotate: boolean
  hotspots: Hotspot[]
  activeHotspotId: string | null
  labelsVisible: boolean
  xrayActive: boolean
  onSelectHotspot: (id: string) => void
  onReady?: (radius: number) => void
}) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)
  const dimmed = activeHotspotId !== null

  const { model, radius, spinAxis } = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = CRYSTAL_FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    // Worst-case (any-rotation) bounding-sphere radius of the real, scaled mesh — this is what
    // actually differs between diamond/SiC/graphite and drives each model's own camera distance.
    const boundingRadius = size.clone().multiplyScalar(scale).length() / 2

    // Extremely flat/sheet-like models (the graphite sheet is ~673x502x31mm real-world -- its
    // thinnest axis is ~16-20x smaller than the other two) mathematically MUST pass through an
    // edge-on view twice per revolution if auto-rotated around the world Y axis while the sheet's
    // face is presented toward the (roughly fixed) default camera: rotating a fixed vector about
    // one axis sweeps a full circle in the plane perpendicular to that axis, and any such circle
    // crosses zero on the camera-facing axis somewhere in the sweep — this is what Wave 12 caught
    // as graphite "vanishing" during auto-rotate. Spinning a flat model around its OWN thinnest
    // (face-normal) axis instead keeps that face permanently oriented toward the camera — the
    // honeycomb pattern still visibly rotates in-plane, it just never collapses edge-on. Roughly
    // cube-shaped models (diamond, SiC) keep the original Y-axis spin, since a cube has no
    // meaningfully thin axis to protect. Driven by the model's own measured geometry (not a
    // per-crystal id check) so any future flat crystal asset gets the same protection for free.
    const axisSizes: Array<['x' | 'y' | 'z', number]> = [
      ['x', size.x],
      ['y', size.y],
      ['z', size.z],
    ]
    const [thinAxis, thinValue] = axisSizes.reduce((min, entry) => (entry[1] < min[1] ? entry : min))
    const largestValue = Math.max(size.x, size.y, size.z, 0.001)
    const isFlatSheet = thinValue / largestValue < 0.25
    const spinAxis: 'x' | 'y' | 'z' = isFlatSheet ? thinAxis : 'y'

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false
      child.material = Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        // Preserve the authored PBR values (including diamond's alpha-blended translucency)
        // exactly as reviewed — only remember the base opacity so xray/dimmed states below can
        // animate relative to it without permanently altering the material.
        material.userData.baseOpacity = material.opacity
      })
    })

    return { model: cloned, radius: boundingRadius, spinAxis }
  }, [scene])

  useEffect(() => {
    onReady?.(radius)
  }, [radius, onReady])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation[spinAxis] += delta * 0.18
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const baseOpacity = typeof material.userData.baseOpacity === 'number' ? material.userData.baseOpacity : 1
        const target = xrayActive
          ? Math.min(baseOpacity, dimmed ? 0.22 : 0.42)
          : dimmed
            ? Math.min(baseOpacity, 0.32)
            : baseOpacity
        material.transparent = xrayActive || dimmed || baseOpacity < 0.999
        material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
      })
    })
  })

  return (
    <group ref={groupRef}>
      <primitive object={model} />
      {hotspots.map((h) => (
        <HotspotMarker
          key={h.id}
          hotspot={h}
          active={activeHotspotId === h.id}
          labelsVisible={labelsVisible}
          onSelect={onSelectHotspot}
        />
      ))}
    </group>
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

export default function CrystalViewer({
  url,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  resetSignal,
  cameraDistance,
  labelsVisible = false,
  xrayActive = false,
  onBoundsChange,
}: {
  url: string
  hotspots: Hotspot[]
  activeHotspotId: string | null
  onSelectHotspot: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  cameraDistance: number
  labelsVisible?: boolean
  xrayActive?: boolean
  /** Reports this model's real camera-distance range (min/max/default/step), derived from its own
   *  rendered bounding sphere and the canvas's live aspect ratio — see the file header comment for
   *  why diamond/SiC/graphite each need their own range instead of one shared distance. */
  onBoundsChange?: (bounds: CrystalCameraBounds) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [aspect, setAspect] = useState(FALLBACK_ASPECT)
  const [radius, setRadius] = useState<number | null>(null)
  // Bumped by the error fallback's "Try again" button — remounts GlbErrorBoundary (and the
  // Suspense/model beneath it) for a fresh load attempt, same pattern every other viewer uses.
  // Also busts drei's useGLTF loader cache for `url` (see useGlbRetry.ts) so a broken asset
  // actually re-fetches instead of re-throwing the same stale rejected promise on every retry click.
  const { retryKey, retryLoad } = useGlbRetry(url)

  // The 3 crystal GLBs are each a single opaque primitive with no per-atom-type vertex/material
  // data (confirmed in the source .license.json sidecars — e.g. silicon carbide's own material
  // extras literally say "no per-atom-type (Si vs C) vertex data available"), so individual atoms
  // can't be recolored in the rendered mesh itself. For any crystal with more than one distinctly
  // colored "-atom" hotspot (only silicon carbide today — diamond/graphite are single-element),
  // surface an always-visible legend mapping each hotspot color to its element so a learner can
  // tell Si from C by looking, not only by clicking each hotspot one at a time.
  const elementLegend = useMemo(() => {
    const atomHotspots = hotspots.filter((h) => h.id.endsWith('-atom'))
    const seen = new Map<string, string>()
    for (const h of atomHotspots) if (!seen.has(h.color)) seen.set(h.color, h.label)
    return seen.size > 1 ? Array.from(seen, ([color, label]) => ({ color, label })) : []
  }, [hotspots])

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

  // Reset to null whenever the active crystal changes so a stale previous model's radius is never
  // applied to the newly-selected one, even for a single frame.
  useEffect(() => {
    setRadius(null)
  }, [url])

  const bounds = useMemo(() => boundsForFitDistance(fitDistanceForRadius(radius ?? FALLBACK_RADIUS, aspect)), [radius, aspect])

  useEffect(() => {
    onBoundsChange?.(bounds)
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

        <GlbErrorBoundary key={`${url}-${retryKey}`} onRetry={retryLoad} message="This crystal lattice model couldn't load." source="[CrystalViewer]">
          <Suspense fallback={<GlbLoadingStatus message="Loading lattice…" />}>
            <CameraDistance distance={cameraDistance} />
            <CrystalMesh
              url={url}
              autoRotate={autoRotate}
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              labelsVisible={labelsVisible}
              xrayActive={xrayActive}
              onSelectHotspot={onSelectHotspot}
              onReady={setRadius}
            />
            <ContactShadows position={[0, -1.6, 0]} opacity={0.28} scale={4.5} blur={2.4} far={2.4} />
          </Suspense>
        </GlbErrorBoundary>

        <OrbitControls
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={bounds.min}
          maxDistance={bounds.max}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>

      {elementLegend.length > 0 && (
        // Positioned at top-right, not top-left, and deliberately does NOT reuse the caption's
        // top-3/top-4 offsets: CanvasControls' toolbar occupies the *entire* top-left corner at
        // both breakpoints -- a full-width bar (`inset-x-3 top-3`) on mobile and a tall left rail
        // (`left-4 top-4`, ~9 stacked buttons) on desktop -- so any top-left placement here sits
        // directly behind it (confirmed: this legend used to be `left-3 top-3` and was reported
        // fully hidden behind the toolbar at both viewports). top-right is clear of the toolbar at
        // every breakpoint: the mobile bar only reaches up to its own height (well short of
        // top-20), and the desktop rail never extends past the left column, so the right edge is
        // toolbar-free regardless of window width.
        <div className="pointer-events-none absolute right-3 top-20 z-10 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-2.5 py-2 shadow-[var(--shadow-tactile)] sm:right-4 sm:top-4">
          <ul className="flex flex-col gap-1">
            {elementLegend.map((entry) => (
              <li key={entry.color} className="flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--color-ink-700)]">
                <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/60 shadow-sm" style={{ background: entry.color }} />
                {entry.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
