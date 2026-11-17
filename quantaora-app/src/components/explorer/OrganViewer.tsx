import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { OrganModel } from './OrganModel'
import { useGlbRetry } from './useGlbRetry'
import { GlbErrorBoundary, GlbLoadingStatus } from './GlbErrorBoundary'
import type { Hotspot } from '@/data/types'

export default function OrganViewer({
  model,
  hotspots,
  activeHotspot,
  onSelectHotspot,
  crossSection,
  autoRotate,
  resetSignal,
  cameraDistance = 8.2,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  onAnimationAvailability,
}: {
  model: string
  hotspots: Hotspot[]
  activeHotspot: string | null
  onSelectHotspot: (id: string) => void
  crossSection: boolean
  autoRotate: boolean
  resetSignal: number
  cameraDistance?: number
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  // Bumped by the error fallback's "Try again" button — remounts the error boundary and the
  // specimen model beneath it (same key-remount pattern already used below for resetSignal). Also
  // busts drei's useGLTF loader cache for `model` (see useGlbRetry.ts) so a broken asset actually
  // re-fetches instead of re-throwing the same stale rejected promise on every retry click.
  const { retryKey, retryLoad } = useGlbRetry(model)

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.55, cameraDistance], fov: 34 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.02
        }}
      >
        <color attach="background" args={['#faf8f4']} />
        <ambientLight intensity={0.5} color="#ffffff" />
        <hemisphereLight args={['#fff8ee', '#33252d', 0.55]} />
        <directionalLight position={[4.8, 6.5, 6.8]} intensity={2.2} color="#fff3e7" />
        <directionalLight position={[-4.5, 1.2, 5.2]} intensity={0.75} color="#e6ecff" />
        <directionalLight position={[-4, 3.5, -5.5]} intensity={1.0} color="#ffb7a5" />
        <pointLight position={[-3, -1.4, 3.5]} intensity={12} distance={11} color="#ff8d70" />

        <GlbErrorBoundary key={retryKey} onRetry={retryLoad} message="This 3D specimen couldn't load." source="[OrganViewer]">
          <Suspense fallback={<GlbLoadingStatus message="Loading specimen…" />}>
            <Environment preset="apartment" environmentIntensity={0.32} />
            <CameraDistance distance={cameraDistance} />
            <group position={[0, 0.02, 0]}>
              <OrganModel
                url={model}
                autoRotate={autoRotate}
                crossSection={crossSection}
                hotspots={hotspots}
                activeHotspot={activeHotspot}
                labelsVisible={labelsVisible}
                xrayActive={xrayActive}
                animationPlaying={animationPlaying}
                onAnimationAvailability={onAnimationAvailability}
                onSelectHotspot={onSelectHotspot}
              />
            </group>
            <ContactShadows position={[0, -1.9, 0]} opacity={0.5} scale={6} blur={2.4} far={3} />
          </Suspense>
        </GlbErrorBoundary>

        <OrbitControls
          ref={controlsRef}
          key={`${resetSignal}-${cameraDistance}`}
          enablePan={false}
          minDistance={4.8}
          maxDistance={12}
          minPolarAngle={Math.PI * 0.18}
          maxPolarAngle={Math.PI * 0.82}
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
    if (direction.lengthSq() < 0.001) direction.set(0, 0.55, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return null
}
