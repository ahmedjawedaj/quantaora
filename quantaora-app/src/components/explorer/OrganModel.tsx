import { useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Hotspot } from '@/data/types'
import { cn } from '@/lib/utils'
import { useGlbAnimations } from './useGlbAnimations'

/** Every organ is normalized into this cube edge length, matching the space
 *  the hotspot coordinates in src/data/organs.ts were authored in. */
export const FIT_SIZE = 3.8

type TunableMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial

function isTunable(material: THREE.Material): material is TunableMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
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
    <Html position={hotspot.position} center distanceFactor={7} zIndexRange={[10, 0]} occlude={false}>
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

export function OrganModel({
  url,
  autoRotate,
  crossSection,
  hotspots,
  activeHotspot,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  onAnimationAvailability,
  onSelectHotspot,
}: {
  url: string
  autoRotate: boolean
  crossSection: boolean
  hotspots: Hotspot[]
  activeHotspot: string | null
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
  onSelectHotspot: (id: string) => void
}) {
  const { scene, animations } = useGLTF(url)
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), [])
  const dimmed = activeHotspot !== null

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))

    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false
      child.material = Array.isArray(child.material)
        ? child.material.map((m) => m.clone())
        : child.material.clone()

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.side = THREE.FrontSide
        material.userData.baseOpacity = material.opacity
        if (!isTunable(material)) return

        // A tighter specular lobe sparkles on any surface with normal detail;
        // holding roughness a little higher keeps highlights stable while the
        // model turns.
        material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.5, 0.42, 0.62)
        material.metalness = 0
        material.envMapIntensity = 0.32
        material.emissive.set(0x000000)

        if ('clearcoat' in material) {
          const physical = material as THREE.MeshPhysicalMaterial
          physical.clearcoat = THREE.MathUtils.clamp(physical.clearcoat, 0.08, 0.12)
          physical.clearcoatRoughness = 0.62
          physical.transmission = 0
          physical.thickness = 0
        }

        if (material.map) material.map.colorSpace = THREE.SRGBColorSpace
        for (const map of [
          material.map,
          material.normalMap,
          material.roughnessMap,
          material.metalnessMap,
          material.aoMap,
          material.emissiveMap,
        ]) {
          if (!map) continue
          map.anisotropy = maxAnisotropy
          map.needsUpdate = true
        }
        material.needsUpdate = true
      })
    })

    return cloned
  }, [scene, gl])

  useGlbAnimations({
    model,
    clips: animations,
    playing: animationPlaying,
    onAvailabilityChange: onAnimationAvailability,
  })

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.14
    }
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.clippingPlanes = crossSection ? [clipPlane] : []
        const baseOpacity =
          typeof material.userData.baseOpacity === 'number'
            ? material.userData.baseOpacity
            : 1
        const targetOpacity = xrayActive ? Math.min(baseOpacity, dimmed ? 0.24 : 0.42) : dimmed ? Math.min(baseOpacity, 0.32) : baseOpacity
        material.transparent = xrayActive || dimmed || baseOpacity < 0.999
        material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.15)
      })
    })
  })

  return (
    <group ref={groupRef} rotation={[0.05, -0.28, 0]}>
      <primitive object={model} />
      {hotspots.map((h) => (
        <HotspotMarker
          key={h.id}
          hotspot={h}
          active={activeHotspot === h.id}
          labelsVisible={labelsVisible}
          onSelect={onSelectHotspot}
        />
      ))}
    </group>
  )
}
