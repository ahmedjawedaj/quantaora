import { Suspense, useEffect, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars as StarField } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { MoonModel } from './MoonModel'
import type { MoonBody } from '@/data/moons'

/**
 * Deep-space viewport, matching StarViewer/GalaxyViewer's conventions: a dark
 * background and a drei Stars backdrop for context, since a moon lit only from
 * one side against a plain paper background would look flat and out of place
 * next to the rest of this Space subject's labs. Every piece of chrome layered
 * over it (controls rail, caption pill, detail panel) stays on the app's normal
 * paper-toned tokens.
 */
export default function MoonViewer({
  moon,
  activeHotspot,
  onSelectHotspot,
  autoRotate,
  resetSignal,
  cameraDistance = 8.8,
  labelsVisible = false,
  onOpenHotspotList,
}: {
  moon: MoonBody
  activeHotspot: string | null
  onSelectHotspot: (id: string) => void
  autoRotate: boolean
  resetSignal: number
  cameraDistance?: number
  labelsVisible?: boolean
  /** Wave 23 (docs/reviews/wave22-moons.md) — forwarded to MoonModel's ClusterMarker, which
   *  hands off to MoonsLab.tsx's external, always-unambiguous hotspot list instead of ever
   *  guessing which collapsed hotspot the user meant. */
  onOpenHotspotList: () => void
}) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.3, cameraDistance], fov: 34 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
        }}
      >
        <color attach="background" args={['#070a16']} />

        {/* Real rock/ice moons are lit, not self-luminous, so this rig needs an
            actual three-point setup — a warm "sunlight" key, a cooler rim light
            so the limb separates from the dark backdrop, and a low fill so the
            shadowed hemisphere reads as deep blue-grey rather than pure black. */}
        <ambientLight intensity={0.32} color="#aebedd" />
        <hemisphereLight args={['#cfe0ff', '#141a30', 0.4]} />
        <directionalLight position={[5.4, 4.2, 5.6]} intensity={2.1} color="#fff2df" />
        <directionalLight position={[-5.2, 1.6, -5.4]} intensity={0.7} color="#8fb6ff" />
        <directionalLight position={[-1.6, -4.0, 2.0]} intensity={0.4} color="#7f96d8" />

        <Suspense
          fallback={
            <Html center>
              <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-2 text-xs font-medium text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]">
                Loading moon…
              </div>
            </Html>
          }
        >
          <CameraDistance distance={cameraDistance} />
          <StarField radius={80} depth={40} count={2200} factor={2} fade speed={0.2} />
          <MoonModel
            key={moon.id}
            moon={moon}
            autoRotate={autoRotate}
            hotspots={moon.hotspots}
            activeHotspot={activeHotspot}
            labelsVisible={labelsVisible}
            onSelectHotspot={onSelectHotspot}
            onOpenHotspotList={onOpenHotspotList}
          />
        </Suspense>

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
    if (direction.lengthSq() < 0.001) direction.set(0, 0.3, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return null
}
