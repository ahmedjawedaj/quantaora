import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox, Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Organelle } from '@/data/cells'
import type { Hotspot } from '@/data/types'
import { cn } from '@/lib/utils'
import { useGlbAnimations } from './useGlbAnimations'

/** Builds a biconcave-disc silhouette (thin rim, thick mid-radius, gently dimpled center on
 *  both faces) as a closed Lathe profile — used only for the red blood cell's cell membrane. */
function biconcaveProfile(radius: number): THREE.Vector2[] {
  const half: [number, number][] = [
    [0, 0.075],
    [0.15, 0.09],
    [0.35, 0.13],
    [0.6, 0.15],
    [0.85, 0.09],
    [1, 0.05],
  ]
  const bottom = half.map(([xf, yf]) => new THREE.Vector2(xf * radius, -yf * radius))
  const top = [...half].reverse().map(([xf, yf]) => new THREE.Vector2(xf * radius, yf * radius))
  return [...bottom, ...top]
}

const MATERIAL_BASE = { roughness: 0.58, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.4 } as const

/** Single-mesh organelle shapes (sphere / capsule / torus / lathe / box) — dimming and the
 *  highlight pulse animate smoothly via useFrame, matching MoleculeModel's AtomSphere. */
function OrganelleMesh({
  organelle,
  dimmed,
  highlighted,
  xrayActive,
}: {
  organelle: Organelle
  dimmed: boolean
  highlighted: boolean
  xrayActive: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const baseOpacity = organelle.opacity ?? 1

  useFrame(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const material = mesh.material as THREE.MeshPhysicalMaterial
    const targetOpacity = xrayActive ? baseOpacity * (dimmed ? 0.16 : 0.38) : dimmed ? baseOpacity * 0.22 : baseOpacity
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.15)
    const s = highlighted ? 1.12 : 1
    mesh.scale.lerp(new THREE.Vector3(s, s, s), 0.15)
  })

  const latheProfile = useMemo(
    () => (organelle.shape === 'lathe' ? biconcaveProfile(organelle.radius ?? 1) : null),
    [organelle.shape, organelle.radius],
  )

  return (
    <group position={organelle.position} rotation={organelle.rotation} scale={organelle.scale}>
      {organelle.shape === 'sphere' && (
        <mesh ref={meshRef}>
          <sphereGeometry args={[organelle.radius ?? 0.1, 32, 32]} />
          <meshPhysicalMaterial color={organelle.color} transparent opacity={baseOpacity} {...MATERIAL_BASE} />
        </mesh>
      )}
      {organelle.shape === 'capsule' && (
        <mesh ref={meshRef}>
          <capsuleGeometry args={[organelle.radius ?? 0.08, organelle.length ?? 0.2, 6, 14]} />
          <meshPhysicalMaterial color={organelle.color} transparent opacity={baseOpacity} {...MATERIAL_BASE} />
        </mesh>
      )}
      {organelle.shape === 'torus' && (
        <mesh ref={meshRef}>
          <torusGeometry args={[organelle.radius ?? 0.2, organelle.tubeRadius ?? 0.04, 12, 32]} />
          <meshPhysicalMaterial color={organelle.color} transparent opacity={baseOpacity} {...MATERIAL_BASE} />
        </mesh>
      )}
      {organelle.shape === 'lathe' && latheProfile && (
        <mesh ref={meshRef}>
          <latheGeometry args={[latheProfile, 48]} />
          <meshPhysicalMaterial color={organelle.color} transparent opacity={baseOpacity} side={THREE.DoubleSide} {...MATERIAL_BASE} />
        </mesh>
      )}
      {organelle.shape === 'box' && (
        <RoundedBox ref={meshRef} args={organelle.boxSize ?? [1, 1, 1]} radius={organelle.boxRadius ?? 0.1} smoothness={4}>
          <meshPhysicalMaterial color={organelle.color} transparent opacity={baseOpacity} {...MATERIAL_BASE} />
        </RoundedBox>
      )}
    </group>
  )
}

/** Golgi apparatus / disc-stack shapes: a handful of flattened discs offset along a slight
 *  curve. Secondary decoration, so opacity/scale respond immediately rather than lerping. */
function DiscStack({
  organelle,
  dimmed,
  highlighted,
  xrayActive,
}: {
  organelle: Organelle
  dimmed: boolean
  highlighted: boolean
  xrayActive: boolean
}) {
  const count = organelle.discCount ?? 5
  const radius = organelle.discRadius ?? 0.13
  const spacing = organelle.discSpacing ?? 0.04
  const opacity = (organelle.opacity ?? 1) * (xrayActive ? (dimmed ? 0.16 : 0.38) : dimmed ? 0.22 : 1)
  const scale = highlighted ? 1.1 : 1

  return (
    <group position={organelle.position} rotation={organelle.rotation}>
      {Array.from({ length: count }).map((_, i) => {
        const t = i - (count - 1) / 2
        const r = radius * (1 - Math.abs(t) * 0.05)
        return (
          <mesh key={i} position={[t * spacing * 0.35, t * spacing, 0]} scale={scale}>
            <cylinderGeometry args={[r, r, spacing * 0.55, 24]} />
            <meshPhysicalMaterial color={organelle.color} transparent opacity={opacity} {...MATERIAL_BASE} />
          </mesh>
        )
      })}
    </group>
  )
}

/** Chain shapes: a poly-line of tapering cylinder segments — used for flagella, dendrites,
 *  axons, and cytoskeleton struts, the same bond-segment technique MoleculeModel uses. */
function Chain({
  organelle,
  dimmed,
  highlighted,
  xrayActive,
}: {
  organelle: Organelle
  dimmed: boolean
  highlighted: boolean
  xrayActive: boolean
}) {
  const points = organelle.points ?? [organelle.position, organelle.position]
  const opacity = (organelle.opacity ?? 1) * (xrayActive ? (dimmed ? 0.16 : 0.38) : dimmed ? 0.22 : 1)
  const scale = highlighted ? 1.08 : 1

  const segments = useMemo(() => {
    const [r0, r1] = organelle.chainRadius ?? [organelle.radius ?? 0.03, organelle.radius ?? 0.03]
    const out: { mid: THREE.Vector3; quaternion: THREE.Quaternion; length: number; radius: number }[] = []
    for (let i = 0; i < points.length - 1; i++) {
      const from = new THREE.Vector3(...points[i])
      const to = new THREE.Vector3(...points[i + 1])
      const mid = from.clone().add(to).multiplyScalar(0.5)
      const dir = to.clone().sub(from)
      const length = dir.length()
      const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
      const t0 = i / (points.length - 1)
      const t1 = (i + 1) / (points.length - 1)
      const radius = THREE.MathUtils.lerp(THREE.MathUtils.lerp(r0, r1, t0), THREE.MathUtils.lerp(r0, r1, t1), 0.5)
      out.push({ mid, quaternion, length, radius })
    }
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points), organelle.chainRadius, organelle.radius])

  return (
    <>
      {segments.map((seg, i) => (
        <mesh key={i} position={seg.mid} quaternion={seg.quaternion} scale={scale}>
          <cylinderGeometry args={[seg.radius, seg.radius, seg.length, 10]} />
          <meshPhysicalMaterial color={organelle.color} transparent opacity={opacity} {...MATERIAL_BASE} />
        </mesh>
      ))}
    </>
  )
}

/** Every sourced cell GLB is normalized into this cube edge length — the space the `glb`
 *  hotspot coordinates in src/data/cells.ts are authored in, and roughly the footprint the
 *  procedural cells already occupy under CellViewer's camera. */
export const CELL_FIT_SIZE = 2.3

type TunableMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial

function isTunable(material: THREE.Material): material is TunableMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
}

/** Visible hotspot pin for GLB cells. Rendered *inside* the rotating group so the markers stay
 *  pinned to the mesh while auto-rotate turns it — the same fix OrganModel carries. */
function GlbHotspotMarker({
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
    <Html position={hotspot.position} center distanceFactor={4} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={() => onSelect(hotspot.id)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${hotspot.label}`}
        // No -translate-x/y-1/2 here: drei's `center` already offsets the wrapper by -50%/-50%,
        // so adding it again pushes the pin visibly up-left of the point it is marking.
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

/** Real sourced cell mesh (NIH 3D Print Exchange). These are STL-derived: one untextured
 *  mesh, no materials, arbitrary units and Z-up. So we normalize into CELL_FIT_SIZE, seat the
 *  orientation, and give the mesh the same warm matte-clay surface the procedural cells use. */
function GlbCell({
  url,
  orientation,
  offset,
  extraScale,
  autoRotate,
  hotspots,
  activeOrganelleId,
  onSelectOrganelle,
  labelsVisible,
  xrayActive,
  animationPlaying,
  onAnimationAvailability,
}: {
  url: string
  orientation: [number, number, number]
  offset: [number, number, number]
  extraScale: number
  autoRotate: boolean
  hotspots: Hotspot[]
  activeOrganelleId: string | null
  onSelectOrganelle: (id: string) => void
  labelsVisible: boolean
  xrayActive: boolean
  animationPlaying: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const { scene, animations } = useGLTF(url)
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const dimmed = activeOrganelleId !== null

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = CELL_FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))

    const maxAnisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      child.castShadow = false
      child.receiveShadow = false
      // These STL exports carry no normals or materials, so three hands us a default white
      // MeshStandardMaterial and flat facets. Compute smooth vertex normals and swap in the
      // warm matte-clay surface the rest of the cell lab uses.
      if (child.geometry && !child.geometry.getAttribute('normal')) {
        child.geometry.computeVertexNormals()
      }
      const existing = Array.isArray(child.material) ? child.material : [child.material]
      const hasAuthoredMaterial = existing.some((m) => {
        if (!isTunable(m)) return false
        const tunable = m as TunableMaterial
        const defaultWhite = new THREE.Color('#ffffff')
        return !!tunable.map || !!tunable.name || tunable.opacity < 0.999 || !tunable.color.equals(defaultWhite)
      })

      if (!hasAuthoredMaterial) {
        child.material = new THREE.MeshPhysicalMaterial({
          color: '#e8cdb6',
          roughness: 0.55,
          metalness: 0,
          clearcoat: 0.24,
          clearcoatRoughness: 0.45,
          transparent: true,
          opacity: 1,
        })
      } else {
        child.material = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone()
      }

      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.side = THREE.FrontSide
        material.userData.baseOpacity = material.opacity
        if (!isTunable(material)) return

        material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.5, 0.42, 0.62)
        material.metalness = 0
        material.envMapIntensity = 0.32
        material.emissive.set(0x000000)

        if ('clearcoat' in material) {
          const physical = material as THREE.MeshPhysicalMaterial
          physical.clearcoat = THREE.MathUtils.clamp(physical.clearcoat, 0.08, 0.26)
          physical.clearcoatRoughness = 0.5
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
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.28
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const baseOpacity =
          typeof material.userData.baseOpacity === 'number'
            ? material.userData.baseOpacity
            : 1
        const target = xrayActive
          ? Math.min(baseOpacity, dimmed ? 0.2 : 0.42)
          : dimmed
            ? Math.min(baseOpacity, 0.34)
            : baseOpacity
        material.transparent = xrayActive || dimmed || baseOpacity < 0.999
        material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
      })
    })
  })

  return (
    <group ref={groupRef}>
      {/* Orientation fix lives on an inner group so the turntable above it always spins about
          world Y, and so the hotspots below stay children of the rotating group. */}
      <group rotation={orientation} position={offset} scale={extraScale}>
        <primitive object={model} />
        {hotspots.map((hotspot) => (
          <GlbHotspotMarker
            key={hotspot.id}
            hotspot={hotspot}
            active={activeOrganelleId === hotspot.id}
            labelsVisible={labelsVisible}
            onSelect={onSelectOrganelle}
          />
        ))}
      </group>
    </group>
  )
}

function ProceduralCell({
  organelles,
  autoRotate,
  activeOrganelleId,
  xrayActive,
}: {
  organelles: Organelle[]
  autoRotate: boolean
  activeOrganelleId: string | null
  xrayActive: boolean
}) {
  const groupRef = useRef<THREE.Group>(null)
  const dimmedAll = activeOrganelleId !== null

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.28
  })

  return (
    <group ref={groupRef}>
      {organelles.map((organelle) => {
        const dimmed = dimmedAll && organelle.id !== activeOrganelleId
        const highlighted = organelle.id === activeOrganelleId
        if (organelle.shape === 'chain') {
          return <Chain key={organelle.id} organelle={organelle} dimmed={dimmed} highlighted={highlighted} xrayActive={xrayActive} />
        }
        if (organelle.shape === 'discStack') {
          return <DiscStack key={organelle.id} organelle={organelle} dimmed={dimmed} highlighted={highlighted} xrayActive={xrayActive} />
        }
        return <OrganelleMesh key={organelle.id} organelle={organelle} dimmed={dimmed} highlighted={highlighted} xrayActive={xrayActive} />
      })}
    </group>
  )
}

export function CellModel({
  organelles,
  autoRotate,
  activeOrganelleId,
  modelType = 'procedural',
  modelUrl,
  modelRotation,
  modelOffset,
  modelScale = 1,
  hotspots = [],
  onSelectOrganelle,
  labelsVisible = false,
  xrayActive = false,
  animationPlaying = true,
  onAnimationAvailability,
}: {
  organelles: Organelle[]
  autoRotate: boolean
  activeOrganelleId: string | null
  modelType?: 'glb' | 'procedural'
  modelUrl?: string
  modelRotation?: [number, number, number]
  modelOffset?: [number, number, number]
  modelScale?: number
  hotspots?: Hotspot[]
  onSelectOrganelle?: (id: string) => void
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  if (modelType === 'glb' && modelUrl) {
    return (
      <GlbCell
        url={modelUrl}
        orientation={modelRotation ?? [0, 0, 0]}
        offset={modelOffset ?? [0, 0, 0]}
        extraScale={modelScale}
        autoRotate={autoRotate}
        hotspots={hotspots}
        activeOrganelleId={activeOrganelleId}
        onSelectOrganelle={onSelectOrganelle ?? (() => {})}
        labelsVisible={labelsVisible}
        xrayActive={xrayActive}
        animationPlaying={animationPlaying}
        onAnimationAvailability={onAnimationAvailability}
      />
    )
  }

  return <ProceduralCell organelles={organelles} autoRotate={autoRotate} activeOrganelleId={activeOrganelleId} xrayActive={xrayActive} />
}
