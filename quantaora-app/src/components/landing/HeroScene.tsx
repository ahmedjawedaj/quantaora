import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Sparkles } from '@react-three/drei'
import * as THREE from 'three'

const ORBITS = [
  { radius: 3.2, tilt: 0.14, speed: 0.22, color: '#5b8def', size: 0.06, phase: 1.4 },
  { radius: 4.0, tilt: -0.28, speed: -0.15, color: '#e8546b', size: 0.07, phase: 3.6 },
  { radius: 4.8, tilt: 0.48, speed: 0.11, color: '#d9a441', size: 0.055, phase: 5.5 },
]

function OrbitRing({ radius, tilt }: { radius: number; tilt: number }) {
  const geometry = useMemo(() => new THREE.TorusGeometry(radius, 0.0035, 8, 160), [radius])
  return (
    <mesh geometry={geometry} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <meshBasicMaterial color="#8a7f74" transparent opacity={0.18} />
    </mesh>
  )
}

function OrbitBody({
  radius,
  tilt,
  speed,
  color,
  size,
  phase,
  reducedMotion,
}: (typeof ORBITS)[number] & { reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null)
  useEffect(() => {
    if (!ref.current) return
    ref.current.position.set(Math.cos(phase) * radius, 0, Math.sin(phase) * radius)
  }, [phase, radius])
  useFrame(({ clock }) => {
    if (!ref.current || reducedMotion) return
    const t = clock.getElapsedTime() * speed + phase
    const x = Math.cos(t) * radius
    const z = Math.sin(t) * radius
    ref.current.position.set(x, 0, z)
  })
  return (
    <group rotation={[tilt, 0, 0]}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[size * 2.4, 16, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[size, 20, 20]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

function Nucleus({ reducedMotion }: { reducedMotion: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (!ref.current || reducedMotion) return
    ref.current.rotation.y += delta * 0.07
    ref.current.rotation.x += delta * 0.025
  })
  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[0.82, 3]} />
      <meshPhysicalMaterial
        color="#f0e6d6"
        roughness={0.42}
        metalness={0.03}
        clearcoat={0.45}
        clearcoatRoughness={0.5}
        transmission={0.38}
        thickness={0.75}
        ior={1.12}
        opacity={0.85}
        transparent
      />
    </mesh>
  )
}

function Scene({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) return
    pointer.current.x = state.pointer.x
    pointer.current.y = state.pointer.y
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, pointer.current.x * 0.15, 0.03)
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -pointer.current.y * 0.06, 0.03)
  })

  const nucleus = <Nucleus reducedMotion={reducedMotion} />

  return (
    <group ref={groupRef} position={[0, -1.35, -1.1]}>
      {reducedMotion ? nucleus : (
        <Float speed={1.1} rotationIntensity={0.1} floatIntensity={0.4}>
          {nucleus}
        </Float>
      )}
      {ORBITS.map((o) => (
        <group key={o.color}>
          <OrbitRing radius={o.radius} tilt={o.tilt} />
          <OrbitBody {...o} reducedMotion={reducedMotion} />
        </group>
      ))}
      <Sparkles
        count={110}
        scale={13}
        size={1.2}
        speed={reducedMotion ? 0 : 0.1}
        color="#c9bfae"
        opacity={0.3}
      />
    </group>
  )
}

export default function HeroScene({ reducedMotion = false }: { reducedMotion?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.5, 9.2], fov: 44 }}
      gl={{ antialias: true, alpha: true }}
      className="!absolute inset-0"
    >
      <ambientLight intensity={0.7} color="#fff3e2" />
      <directionalLight position={[4, 5, 4]} intensity={1.4} color="#fff7ec" />
      <directionalLight position={[-5, -2, -3]} intensity={0.35} color="#c9def0" />
      <Suspense fallback={null}>
        <Scene reducedMotion={reducedMotion} />
      </Suspense>
    </Canvas>
  )
}
