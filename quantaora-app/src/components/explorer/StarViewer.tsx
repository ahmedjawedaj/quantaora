import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Stars as StarField } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { StarModel } from './StarModel'
import { useGlbRetry } from './useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from './GlbErrorBoundary'
import type { StarBody } from '@/data/stars'

/**
 * Stars and their remnants are self-luminous objects in space, so this viewport
 * is dark — the same convention OrbitSandbox uses, and the only background a
 * glowing object reads correctly against. Every piece of chrome layered over it
 * (controls rail, caption pill, detail panel) stays on the app's normal
 * paper-toned tokens.
 */
export default function StarViewer({
  star,
  activeHotspot,
  onSelectHotspot,
  autoRotate,
  resetSignal,
  cameraDistance = 8.8,
  labelsVisible = false,
  animationPlaying = true,
  onAnimationAvailability,
}: {
  star: StarBody
  activeHotspot: string | null
  onSelectHotspot: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  cameraDistance?: number
  labelsVisible?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  // Bumped by the error fallback's "Try again" button — remounts the error boundary and the star
  // model beneath it. Combined with star.id below so switching stars also clears a prior error.
  // Also busts drei's useGLTF loader cache for `star.model` (see useGlbRetry.ts) when this star is
  // GLB-backed, so a broken asset actually re-fetches instead of re-throwing the same stale
  // rejected promise on every retry click; procedural stars never call useGLTF, so nothing to clear.
  const { retryKey, retryLoad } = useGlbRetry(star.modelType === 'glb' ? star.model : undefined)

  /**
   * The remnants and the procedural stars emit their own light, so they need
   * almost none from the rig. A protoplanetary disk is the opposite — it is
   * dusty rock, visible only because something shines on it — so when a model
   * asks for a lit material it also gets a real three-point rig: a warm key, a
   * cooler back/rim light to separate the disk from the sky, and enough fill
   * that the shadowed side reads as dark blue rather than dead black.
   */
  const litRig = star.surface?.mode === 'lit'

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.35, cameraDistance], fov: 34 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={['#080d1c']} />

        {/* Deliberately low-key lighting: these objects mostly emit their own
            light, so the rig only needs to keep unlit geometry from going black
            and give the remnant shells a little directional shape. */}
        {litRig ? (
          <>
            <ambientLight intensity={0.62} color="#9db2e0" />
            <hemisphereLight args={['#cfe0ff', '#241a3c', 0.7]} />
            {/* Warm key, high and front-right. */}
            <directionalLight position={[5.5, 5.0, 5.0]} intensity={2.3} color="#ffd9b0" />
            {/* Cool rim from behind, so the disk's outer edge separates from the sky. */}
            <directionalLight position={[-5.0, 2.2, -6.0]} intensity={1.5} color="#8fb6ff" />
            {/* Low cool fill so the shadow side is deep blue, never black. */}
            <directionalLight position={[-2.0, -4.5, 2.5]} intensity={0.95} color="#7f96d8" />
          </>
        ) : (
          <>
            <ambientLight intensity={0.42} color="#b9c8ff" />
            <hemisphereLight args={['#cfe0ff', '#1a1030', 0.35]} />
            <directionalLight position={[5.2, 4.4, 6.4]} intensity={0.85} color="#ffe6cf" />
            <directionalLight position={[-5.4, -1.8, -4.2]} intensity={0.5} color="#7f9fff" />
          </>
        )}

        <GlbErrorBoundary key={`${star.id}-${retryKey}`} onRetry={retryLoad} source="[StarViewer]">
          <Suspense fallback={<GlbLoadingStatus message="Loading star…" />}>
            <CameraDistance distance={cameraDistance} />
            <StarField radius={80} depth={40} count={2600} factor={2.2} fade speed={0.25} />
            <StarModel
              key={star.id}
              star={star}
              autoRotate={autoRotate}
              hotspots={star.hotspots}
              activeHotspot={activeHotspot}
              labelsVisible={labelsVisible}
              animationPlaying={animationPlaying}
              onAnimationAvailability={onAnimationAvailability}
              onSelectHotspot={onSelectHotspot}
            />
          </Suspense>
        </GlbErrorBoundary>

        <OrbitControls
          ref={controlsRef}
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={4.2}
          maxDistance={16}
          minPolarAngle={Math.PI * 0.12}
          maxPolarAngle={Math.PI * 0.88}
          enableDamping
          dampingFactor={0.07}
          rotateSpeed={0.55}
        />
      </Canvas>
    </div>
  )
}

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
