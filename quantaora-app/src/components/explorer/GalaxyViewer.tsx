import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { GalaxyModel } from './GalaxyModel'
import type { Galaxy } from '@/data/galaxies'

/** Deep-space viewport, matching OrbitSandbox's conventions: near-black background,
 *  a drei Stars backdrop for depth, damped OrbitControls, no panning. */
export default function GalaxyViewer({
  galaxy,
  branches,
  spin,
  autoRotate,
  animationPlaying,
  activeHotspot,
  onSelectHotspot,
  resetSignal,
  cameraDistance = 4.8,
  labelsVisible = false,
}: {
  galaxy: Galaxy
  branches: number
  spin: number
  autoRotate: boolean
  animationPlaying: boolean
  activeHotspot: string | null
  onSelectHotspot: (id: string) => void
  resetSignal: number
  cameraDistance?: number
  labelsVisible?: boolean
}) {
  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.9, cameraDistance], fov: 42 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.15
        }}
      >
        <color attach="background" args={['#05070f']} />
        {/* Points carry their own colour; a faint ambient keeps drei's Stars visible. */}
        <ambientLight intensity={0.4} color="#c9d6ff" />

        <Suspense
          fallback={
            <Html center>
              <div role="status" aria-live="polite" className="rounded-full bg-black/40 px-4 py-2 text-xs text-white">
                Building galaxy…
              </div>
            </Html>
          }
        >
          <CameraDistance distance={cameraDistance} />
          <Stars radius={90} depth={60} count={1400} factor={2.4} fade speed={0.2} />
          <GalaxyModel
            galaxy={galaxy}
            branches={branches}
            spin={spin}
            autoRotate={animationPlaying}
            activeHotspot={activeHotspot}
            labelsVisible={labelsVisible}
            onSelectHotspot={onSelectHotspot}
          />
        </Suspense>

        <OrbitControls
          key={`${resetSignal}-${cameraDistance}`}
          /* Framed slightly high so the arm/winding slider panel at the bottom of
             the viewport does not sit over the galaxy. */
          target={[0, -0.55, 0]}
          enablePan={false}
          minDistance={2.4}
          maxDistance={14}
          enableDamping
          dampingFactor={0.08}
          autoRotate={autoRotate}
          autoRotateSpeed={0.45}
        />
      </Canvas>
    </div>
  )
}

function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()

  useEffect(() => {
    const direction = camera.position.clone()
    if (direction.lengthSq() < 0.001) direction.set(0, 2.9, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])

  return null
}
