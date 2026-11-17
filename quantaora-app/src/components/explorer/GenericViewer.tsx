import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import GenericModel from './GenericModel'
import { useGlbRetry } from './useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from './GlbErrorBoundary'
import type { Hotspot, SubjectId } from '@/data/types'
import type { ProceduralVisual } from '@/lib/procedural/types'

/**
 * View-level wrapper for the procedural branch models. Mirrors the bespoke
 * viewers' canvas setup (warm off-white studio, soft key+fill, contact shadow)
 * and hands the hotspot interaction to the shared marker model.
 */
export default function GenericViewer({
  subject,
  branch,
  url,
  visual,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  resetSignal,
  cameraDistance = 6.3,
  minCameraDistance = 4,
  maxCameraDistance = 9,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  onAnimationAvailability,
}: {
  subject: SubjectId
  branch?: string
  url?: string
  visual?: ProceduralVisual
  hotspots: Hotspot[]
  activeHotspotId: string | null
  onSelectHotspot: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  cameraDistance?: number
  minCameraDistance?: number
  maxCameraDistance?: number
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  // Bumped by the error fallback's "Try again" button — remounts the error boundary and the
  // model beneath it, giving a broken GLB load a fresh attempt (same key-remount pattern already
  // used below for OrbitControls' resetSignal). Also busts drei's useGLTF loader cache for `url`
  // (see useGlbRetry.ts) so a broken asset actually re-fetches instead of re-throwing the same
  // stale rejected promise on every retry click.
  const { retryKey, retryLoad } = useGlbRetry(url)

  return (
    // rounded-lg + shadow to match the app's tactile card language used by
    // every other panel in this layout (CanvasControls rail, BottomTray
    // cards, DetailPanel fact boxes all use --radius-lg/md + shadow-tactile).
    // overflow-hidden is required because the underlying <canvas> element is
    // always a plain rectangle; this is the only place that needs it, since
    // CanvasControls/the caption pill render as siblings in BranchLab, not
    // inside this div.
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-tactile)]">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.35, cameraDistance], fov: 36 }}
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
        <StudioEnvironment />

        <GlbErrorBoundary key={retryKey} onRetry={retryLoad} source="[GenericViewer]">
          <Suspense fallback={<GlbLoadingStatus message="Loading model…" />}>
            <CameraDistance distance={cameraDistance} />
            <GenericModel
              subject={subject}
              branch={branch}
              url={url}
              visual={visual}
              hotspots={hotspots}
              activeHotspotId={activeHotspotId}
              onSelectHotspot={onSelectHotspot}
              autoRotate={autoRotate}
              labelsVisible={labelsVisible}
              xrayActive={xrayActive}
              animationPlaying={animationPlaying}
              onAnimationAvailability={onAnimationAvailability}
            />
            <ContactShadows position={[0, -1.2, 0]} opacity={0.28} scale={4} blur={2.4} far={2} />
          </Suspense>
        </GlbErrorBoundary>

        <OrbitControls
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={minCameraDistance}
          maxDistance={maxCameraDistance}
          enableDamping
          dampingFactor={0.08}
        />
      </Canvas>
    </div>
  )
}

/**
 * Lightweight local/procedural image-based lighting so physically-based
 * materials (transmissive glass, high-metalness surfaces) have something to
 * refract and reflect against. Bakes three's built-in `RoomEnvironment` (a
 * neutral studio softbox rig, not a photographic HDRI) through a
 * `PMREMGenerator` at mount time — no network fetch, no external asset file.
 * Sets `scene.environment` only, never `scene.background`, so the warm
 * off-white stage color and the two-directional-light look are unchanged;
 * this purely gives PBR materials an env map to sample (see each material's
 * own `envMapIntensity` in GenericModel.tsx for how strongly it shows).
 */
function StudioEnvironment() {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmremGenerator = new THREE.PMREMGenerator(gl)
    const renderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = renderTarget.texture
    pmremGenerator.dispose()

    return () => {
      scene.environment = null
      renderTarget.dispose()
    }
  }, [gl, scene])

  return null
}

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(0, 0.35, distance)
    camera.lookAt(0, 0, 0)
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return null
}
