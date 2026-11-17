import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { GlbErrorBoundary } from './GlbErrorBoundary'

/** Shown while a planet's GLB is still fetching, and as the permanent fallback
 *  if it fails to load — a plain neutral sphere so the orbit slot is never
 *  empty, just visually flat until (or unless) the real relief model lands. */
function PlaceholderSphere({ radius, spinSpeed }: { radius: number; spinSpeed: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spinSpeed
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial color="#b5ab9c" roughness={0.9} metalness={0} />
    </mesh>
  )
}

/**
 * Real NASA relief-mesh GLB, normalized to this body's authored `radius` so all
 * 9 wired bodies (earth/venus/mars/jupiter/saturn/uranus/neptune/pluto/ceres)
 * read as a visually consistent set in the same orbit scene, regardless of each
 * file's native export scale.
 *
 * Scale rule: target diameter (radius * 2) / the SMALLEST of the model's own
 * bounding-box dimensions. Every body in this batch is a near-spherical relief
 * mesh whose x/y/z dimensions are already close together (e.g. Earth
 * ~1000x996.6x1000), so the smallest axis is a reliable stand-in for "body
 * diameter" — except Saturn, where the ring geometry inflates x/z to ~2.58x
 * (2331 / 902 ≈ 2.58, rounded up to 2.6 for margin — see OrbitSandbox.tsx's
 * RING_OUTER_MULTIPLIER, kept in sync with this ratio) the body-only box
 * (~2331 vs ~902 on y) while leaving the non-ring axis alone. Taking the min
 * dimension picks that untouched axis automatically, so Saturn's body comes
 * out the same visual size as every other planet and its rings extend outward
 * from there at their real (larger) proportion — no separate ring-vs-body
 * special case needed.
 */
function GlbPlanetBody({
  url,
  radius,
  spinSpeed,
  dimmed,
  xrayActive,
  onSettled,
}: {
  url: string
  radius: number
  spinSpeed: number
  dimmed: boolean
  xrayActive: boolean
  onSettled?: () => void
}) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)

  // This component only mounts once Suspense has resolved the GLB fetch/parse for THIS body —
  // firing here (rather than trusting any shared/global loader signal) makes "settled" a purely
  // local, per-body fact instead of something an unrelated asset elsewhere in the app can wedge.
  // Wave 17 QA (desktop-zoom-before/after + coldload screenshots, loader-timing finding): a plain
  // `useEffect(() => onSettled?.(), [])` fires as soon as React commits this mount — before R3F's
  // own next requestAnimationFrame has actually drawn the now-scaled/materialed model to the
  // canvas. Between those two moments there's a real (if usually brief) window where the caller's
  // "ready" signal could fire while the body it's reporting on hasn't been painted yet, risking the
  // loading skeleton dismissing a frame early. Deferring by one rAF costs at most one frame of
  // extra wait — not a guessed timeout, just "wait for the render loop to actually catch up" — and
  // guarantees at least one real paint has happened first.
  useEffect(() => {
    const id = requestAnimationFrame(() => onSettled?.())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const bodyDiameter = Math.min(size.x, size.y, size.z) || 1
    const scale = (radius * 2) / bodyDiameter
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const standard = material as THREE.MeshStandardMaterial
        if (standard.map) {
          standard.map.colorSpace = THREE.SRGBColorSpace
          standard.map.anisotropy = 8
        }
        material.userData.baseOpacity = material.opacity
      })
    })

    return cloned
  }, [scene, radius])

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * spinSpeed
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const baseOpacity = typeof material.userData.baseOpacity === 'number' ? material.userData.baseOpacity : 1
        const target = xrayActive ? baseOpacity * (dimmed ? 0.2 : 0.42) : baseOpacity * (dimmed ? 0.35 : 1)
        material.transparent = true
        material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
      })
    })
  })

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  )
}

function TexturedSphere({
  texture,
  radius,
  spinSpeed,
  isStar,
  dimmed,
  xrayActive,
  onSettled,
}: {
  texture: string
  radius: number
  spinSpeed: number
  isStar?: boolean
  dimmed: boolean
  xrayActive: boolean
  onSettled?: () => void
}) {
  const map = useTexture(texture)
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>(null)

  useMemo(() => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 8
  }, [map])

  // Mirrors GlbPlanetBody's mount-signal above (including the one-rAF defer — see its own comment
  // for why): this only mounts once the texture Suspense has resolved, so it's an equally reliable
  // local "this body is visible now" signal for Sun/Mercury (the two bodies with no GLB, still
  // procedural texture spheres), deferred one frame so it reports after an actual paint.
  useEffect(() => {
    const id = requestAnimationFrame(() => onSettled?.())
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * spinSpeed
    if (materialRef.current && 'opacity' in materialRef.current) {
      const target = xrayActive ? (dimmed ? 0.2 : 0.42) : dimmed ? 0.35 : 1
      materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, target, 0.15)
      materialRef.current.transparent = true
    }
  })

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 48, 48]} />
      {isStar ? (
        <meshBasicMaterial ref={materialRef as never} map={map} toneMapped={false} />
      ) : (
        <meshStandardMaterial ref={materialRef as never} map={map} roughness={0.85} metalness={0} />
      )}
    </mesh>
  )
}

export function PlanetModel({
  texture,
  model,
  radius,
  tiltDeg,
  spinSpeed,
  isStar,
  hasRings,
  dimmed,
  xrayActive,
  onSettled,
}: {
  texture: string
  /** Path under /public to a real relief-mesh GLB. When present this fully
   *  replaces the procedural textured sphere (the GLB's own baked color +
   *  relief textures carry the look — `texture` is not layered under it).
   *  When absent, falls back to the existing `texture`-mapped sphere exactly
   *  as before, so bodies with no wired model (Mercury, the Sun) are
   *  unaffected. */
  model?: string
  radius: number
  tiltDeg: number
  spinSpeed: number
  isStar?: boolean
  hasRings?: boolean
  dimmed: boolean
  xrayActive: boolean
  /** Fires exactly once, whether this body's model loaded successfully or fell back to the
   *  placeholder sphere — a purely local "this body is done, one way or another" signal the
   *  parent scene uses to know when it has something real to show (see OrbitSandbox/SpaceLab). */
  onSettled?: () => void
}) {
  const tiltRad = useMemo(() => THREE.MathUtils.degToRad(Math.min(tiltDeg, 90)), [tiltDeg])
  const placeholder = <PlaceholderSphere radius={radius} spinSpeed={spinSpeed} />

  return (
    <group rotation={[0, 0, tiltRad]}>
      {model ? (
        <GlbErrorBoundary
          fallback={placeholder}
          source="[PlanetModel]"
          // Falling back to the placeholder IS this body settling (just unsuccessfully) — report
          // it so the scene-readiness count above doesn't wait forever on a body that will never
          // resolve. Deferred one rAF, same reasoning as GlbPlanetBody/TexturedSphere's own
          // onSettled below: give the browser one real paint of the (now-mounted) fallback before
          // declaring this body "settled", so the caller's readiness signal tracks an actually-
          // painted frame rather than firing in the same tick as the state update that produces it.
          onError={() => requestAnimationFrame(() => onSettled?.())}
        >
          <Suspense fallback={placeholder}>
            <GlbPlanetBody
              url={model}
              radius={radius}
              spinSpeed={spinSpeed}
              dimmed={dimmed}
              xrayActive={xrayActive}
              onSettled={onSettled}
            />
          </Suspense>
        </GlbErrorBoundary>
      ) : (
        // Same per-body isolation as the GLB path above: a bad/missing texture (Sun, Mercury)
        // falls back to the placeholder sphere and still reports settled, instead of throwing all
        // the way up into OrbitSandbox's shared outer Suspense and taking down every other body.
        <GlbErrorBoundary
          fallback={placeholder}
          source="[PlanetModel]"
          // Falling back to the placeholder IS this body settling (just unsuccessfully) — report
          // it so the scene-readiness count above doesn't wait forever on a body that will never
          // resolve. Deferred one rAF, same reasoning as GlbPlanetBody/TexturedSphere's own
          // onSettled below: give the browser one real paint of the (now-mounted) fallback before
          // declaring this body "settled", so the caller's readiness signal tracks an actually-
          // painted frame rather than firing in the same tick as the state update that produces it.
          onError={() => requestAnimationFrame(() => onSettled?.())}
        >
          <Suspense fallback={placeholder}>
            <TexturedSphere
              texture={texture}
              radius={radius}
              spinSpeed={spinSpeed}
              isStar={isStar}
              dimmed={dimmed}
              xrayActive={xrayActive}
              onSettled={onSettled}
            />
          </Suspense>
        </GlbErrorBoundary>
      )}
      {/* Saturn's own GLB already ships its ring geometry baked in — this
          procedural ring is only needed for the texture-only fallback path. */}
      {hasRings && !model && <SaturnRings radius={radius} dimmed={dimmed} xrayActive={xrayActive} />}
    </group>
  )
}

function SaturnRings({ radius, dimmed, xrayActive }: { radius: number; dimmed: boolean; xrayActive: boolean }) {
  const ref = useRef<THREE.Mesh>(null)
  // Outer radius kept in sync with OrbitSandbox.tsx's RING_OUTER_MULTIPLIER (2.6) -- both describe
  // the same real Saturn ring proportion, just for two different rendering paths (this procedural
  // fallback vs. the camera-fit math), so they must not drift apart.
  const geometry = useMemo(() => new THREE.RingGeometry(radius * 1.4, radius * 2.6, 64), [radius])
  useFrame(() => {
    if (!ref.current) return
    const material = ref.current.material as THREE.MeshBasicMaterial
    material.opacity = THREE.MathUtils.lerp(material.opacity, xrayActive ? (dimmed ? 0.12 : 0.28) : dimmed ? 0.2 : 0.55, 0.15)
  })
  return (
    <mesh ref={ref} geometry={geometry} rotation={[Math.PI / 2 - 0.15, 0, 0]}>
      <meshBasicMaterial color="#d9c9a3" side={THREE.DoubleSide} transparent opacity={0.55} />
    </mesh>
  )
}
