import { Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { CellModel } from './CellModel'
import { useGlbRetry } from './useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from './GlbErrorBoundary'
import type { Organelle } from '@/data/cells'
import type { Hotspot } from '@/data/types'
import { cn } from '@/lib/utils'

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
    <Html position={hotspot.position} center distanceFactor={5} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(hotspot.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${hotspot.label}`}
        className={cn(
          'group relative flex h-11 w-11 items-center justify-center rounded-full transition-transform',
          (hovered || active) && 'scale-110',
        )}
      >
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

export default function CellViewer({
  organelles,
  hotspots,
  activeOrganelle,
  onSelectOrganelle,
  autoRotate,
  resetSignal,
  modelType = 'procedural',
  modelUrl,
  modelRotation,
  modelOffset,
  modelScale,
  cameraDistance = 3.6,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  onAnimationAvailability,
}: {
  organelles: Organelle[]
  hotspots: Hotspot[]
  activeOrganelle: string | null
  onSelectOrganelle: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  modelType?: 'glb' | 'procedural'
  modelUrl?: string
  modelRotation?: [number, number, number]
  modelOffset?: [number, number, number]
  modelScale?: number
  cameraDistance?: number
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const isGlb = modelType === 'glb' && !!modelUrl
  // Bumped by the error fallback's "Try again" button — remounts the error boundary and the cell
  // model beneath it (same key-remount pattern already used below for resetSignal). Also busts
  // drei's useGLTF loader cache for the GLB url actually being loaded (see useGlbRetry.ts) so a
  // broken asset actually re-fetches instead of re-throwing the same stale rejected promise.
  const { retryKey, retryLoad } = useGlbRetry(isGlb ? modelUrl : undefined)

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.4, cameraDistance], fov: 38 }}
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

        <GlbErrorBoundary key={retryKey} onRetry={retryLoad} source="[CellViewer]">
          <Suspense fallback={<GlbLoadingStatus message="Loading model…" />}>
            <CameraDistance distance={cameraDistance} />
            <CellModel
              organelles={organelles}
              autoRotate={autoRotate}
              activeOrganelleId={activeOrganelle}
              modelType={modelType}
              modelUrl={modelUrl}
              modelRotation={modelRotation}
              modelOffset={modelOffset}
              modelScale={modelScale}
              hotspots={hotspots}
              onSelectOrganelle={onSelectOrganelle}
              labelsVisible={labelsVisible}
              xrayActive={xrayActive}
              animationPlaying={animationPlaying}
              onAnimationAvailability={onAnimationAvailability}
            />
            {/* GLB cells render their markers inside the rotating group (see CellModel) so they
                stay pinned to the mesh; procedural cells keep their existing static markers. */}
            {!isGlb &&
              hotspots.map((hotspot) => (
                <HotspotMarker
                  key={hotspot.id}
                  hotspot={hotspot}
                  active={activeOrganelle === hotspot.id}
                  labelsVisible={labelsVisible}
                  onSelect={onSelectOrganelle}
                />
              ))}
            <ContactShadows position={[0, -0.9, 0]} opacity={0.3} scale={4} blur={2.4} far={2} />
          </Suspense>
        </GlbErrorBoundary>

        <OrbitControls
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={2}
          maxDistance={6}
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
