import { useEffect, useMemo, useRef, useState } from 'react'
import { useGLTF, Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { Hotspot, SubjectId } from '@/data/types'
import type { ProceduralVisual } from '@/lib/procedural/types'
import { resolveProceduralShape } from './procedural/resolve'
import { COMPOSITIONS } from './procedural/registry'
import { cn } from '@/lib/utils'
import { useGlbAnimations } from './useGlbAnimations'

/** Every authored model is normalized into this cube edge length, matching the
 *  pivot space authored hotspot coordinates are written in. */
export const FIT_SIZE = 3.8

type TunableMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial

function glbPresentationFit(url: string, branch?: string) {
  if (url.includes('/models/sourced/biology-cell/organelle-ribosome')) {
    return { fitSize: 2.35, offset: new THREE.Vector3(-1.15, 0, 0) }
  }
  if (url.includes('/models/sourced/biology-cell/bacteria-ecoli-whole-cell')) {
    return { fitSize: 2.0, offset: new THREE.Vector3(-1.2, 0.25, 0) }
  }
  if (url.includes('/models/sourced/biology-cell/organelle-golgi-apparatus')) {
    return { fitSize: 3.1, offset: new THREE.Vector3(-0.9, -0.02, 0) }
  }
  if (url.includes('/models/sourced/biology-gaps-wave2/virus-influenza')) {
    return { fitSize: 2.15, offset: new THREE.Vector3(0.02, -0.02, 0) }
  }
  if (url.includes('/models/cells/neuron-authored')) {
    return { fitSize: 2.25, offset: new THREE.Vector3(0.08, -0.18, 0) }
  }
  if (url.includes('/models/sourced/chemistry-structure/glucose')) {
    return { fitSize: 2.85, offset: new THREE.Vector3(-0.85, 0, 0) }
  }
  if (
    url.includes('/models/sourced/biochemistry-structure/atp-cellular-energy') ||
    url.includes('/models/sourced/biochemistry-structure/phospholipid-membrane')
  ) {
    return { fitSize: 3.55, offset: new THREE.Vector3(-0.65, 0.02, 0) }
  }
  if (url.includes('/models/sourced/biochemistry-structure/')) {
    return { fitSize: 2.75, offset: new THREE.Vector3(-0.85, 0.02, 0) }
  }
  if (url.includes('/models/sourced/biology-life/ecology/consumer-deer')) {
    return { fitSize: 3.15, offset: new THREE.Vector3(-0.55, -0.18, 0) }
  }
  if (url.includes('/models/sourced/biology-life/ecology/predator-fox')) {
    return { fitSize: 3.2, offset: new THREE.Vector3(-0.55, -0.08, 0) }
  }
  if (url.includes('/models/sourced/biology-animals/mosquito-in-amber-khronos')) {
    return { fitSize: 2.75, offset: new THREE.Vector3(-0.72, 0.02, 0) }
  }
  if (url.includes('/models/sourced/biology-animals/barramundi-fish-khronos')) {
    return { fitSize: 3.15, offset: new THREE.Vector3(-0.55, -0.02, 0), rotation: new THREE.Euler(0, Math.PI / 2, 0) }
  }
  if (url.includes('/models/sourced/biology-animals/fox-khronos')) {
    return { fitSize: 1.85, offset: new THREE.Vector3(-0.55, -1.05, 0), rotation: new THREE.Euler(0, Math.PI / 2, 0) }
  }
  if (url.includes('/models/sourced/biology-evolution/scattering-skull-khronos')) {
    return { fitSize: 2.9, offset: new THREE.Vector3(-0.72, 0.02, 0) }
  }
  if (url.includes('/models/biology/authored/evolution-fossil-specimen-suite')) {
    return { fitSize: 2.85, offset: new THREE.Vector3(0.1, -0.05, 0) }
  }
  if (url.includes('/models/sourced/math-wave2/measuring-cup-milkandbanana')) {
    return { fitSize: 2.2, offset: new THREE.Vector3(-0.35, -0.02, 0) }
  }
  if (url.includes('/models/physics/authored/physics-sound-apparatus-suite')) {
    return { fitSize: 3.1, offset: new THREE.Vector3(0.05, -0.03, 0) }
  }
  if (url.includes('/models/sourced/physics-sound/boombox-speaker-khronos')) {
    return { fitSize: 3.0, offset: new THREE.Vector3(-0.58, -0.02, 0) }
  }
  if (url.includes('/models/physics/authored/physics-sound-')) {
    return { fitSize: 3.65, offset: new THREE.Vector3(-0.65, 0, 0) }
  }
  if (url.includes('/models/physics/authored/physics-fluids-apparatus-suite')) {
    return { fitSize: 3.0, offset: new THREE.Vector3(0.02, -0.02, 0) }
  }
  if (url.includes('/models/physics/authored/physics-fluids-')) {
    return { fitSize: 3.45, offset: new THREE.Vector3(-0.65, -0.03, 0) }
  }
  if (url.includes('/models/heart.glb')) {
    return { fitSize: 2.9, offset: new THREE.Vector3(-0.75, 0, 0) }
  }
  if (url.includes('/models/lungs.glb')) {
    return { fitSize: 3.1, offset: new THREE.Vector3(-0.8, -0.02, 0) }
  }
  if (url.includes('/models/intestine.glb')) {
    return { fitSize: 3.0, offset: new THREE.Vector3(-0.75, -0.02, 0) }
  }
  if (url.includes('/models/kidneys.glb')) {
    return { fitSize: 2.9, offset: new THREE.Vector3(-0.75, 0, 0) }
  }
  if (url.includes('/models/brain.glb')) {
    return { fitSize: 2.8, offset: new THREE.Vector3(-0.8, 0.02, 0) }
  }
  if (url.includes('/models/eyeball.glb')) {
    return { fitSize: 2.75, offset: new THREE.Vector3(-0.72, 0.02, 0) }
  }
  if (branch === 'human-physiology') {
    return { fitSize: 2.9, offset: new THREE.Vector3(-0.6, 0, 0) }
  }
  return { fitSize: FIT_SIZE, offset: new THREE.Vector3(0, 0, 0) }
}

function isTunable(material: THREE.Material): material is TunableMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
}

function sourcedCellMaterialTone(url: string) {
  if (url.includes('/models/sourced/biology-cell/bacteria-ecoli-whole-cell')) {
    return { color: new THREE.Color('#d79b79'), doubleSide: false }
  }
  if (url.includes('/models/sourced/biology-cell/organelle-golgi-apparatus')) {
    return { color: new THREE.Color('#d4a15f'), doubleSide: true }
  }
  return null
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
    <Html position={hotspot.position} center distanceFactor={3.5} zIndexRange={[10, 0]} occlude={false}>
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

/**
 * A real GLB asset, normalized with the same quality pipeline as the organ
 * models: fit-cube scaled and centered, warm matte-clay materials, and the
 * authored hotspots pinned onto the surfaced mesh.
 */
function GlbModel({
  url,
  branch,
  autoRotate,
  crossSection,
  hotspots,
  activeHotspot,
  labelsVisible,
  xrayActive,
  animationPlaying,
  onAnimationAvailability,
  onSelectHotspot,
}: {
  url: string
  branch?: string
  autoRotate: boolean
  crossSection: boolean
  hotspots: Hotspot[]
  activeHotspot: string | null
  labelsVisible: boolean
  xrayActive: boolean
  animationPlaying: boolean
  onAnimationAvailability?: (available: boolean) => void
  onSelectHotspot: (id: string) => void
}) {
  const { scene, animations } = useGLTF(url)
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)
  const clipPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0), [])
  const dimmed = activeHotspot !== null
  const presentationFit = useMemo(() => glbPresentationFit(url, branch), [url, branch])
  const materialTone = useMemo(() => sourcedCellMaterialTone(url), [url])

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = presentationFit.fitSize / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    if (presentationFit.rotation) cloned.rotation.copy(presentationFit.rotation)

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
        if (materialTone && !material.map) {
          material.color.copy(materialTone.color)
          material.roughness = 0.58
          material.side = materialTone.doubleSide ? THREE.DoubleSide : THREE.FrontSide
        }

        if ('clearcoat' in material) {
          const physical = material as THREE.MeshPhysicalMaterial
          // Authored optical glass (KHR_materials_transmission — e.g. the
          // bulb/lens glass envelopes) needs to stay transmissive to read as
          // glass once GenericViewer's env map has something to refract
          // against; everything else (the vast majority of GLBs here, none
          // of which are real glass) keeps the flattened matte-clay look
          // every other model in the app already uses.
          const isAuthoredGlass = physical.transmission > 0.4
          if (isAuthoredGlass) {
            physical.roughness = THREE.MathUtils.clamp(physical.roughness ?? 0.05, 0.02, 0.18)
            physical.clearcoat = THREE.MathUtils.clamp(physical.clearcoat, 0.15, 0.35)
            physical.clearcoatRoughness = 0.08
            physical.envMapIntensity = 1.1
          } else {
            physical.clearcoat = THREE.MathUtils.clamp(physical.clearcoat, 0.08, 0.12)
            physical.clearcoatRoughness = 0.62
            physical.transmission = 0
            physical.thickness = 0
          }
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
  }, [scene, gl, presentationFit.fitSize, materialTone])

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
    <group ref={groupRef} rotation={[0.05, -0.28, 0]} position={presentationFit.offset}>
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

/** Instruction-friendly hero form used only while an authored GLB is absent. The
 *  shape is deliberately subject-distinct so the blank 3D view still teaches:
 *  biology a soft rounded body, physics/chemistry a faceted kinetic solid, math
 *  a crisp block, space a lit sphere. Hotspot markers stay fully interactive. */
function ProceduralBody({ subject, active, xrayActive }: { subject: SubjectId; active: boolean; xrayActive: boolean }) {
  const scale = active ? 0.9 : 1
  const opacity = xrayActive ? 0.42 : 1
  const shared = {
    roughness: 0.86,
    metalness: 0,
    // Matches GlbModel's matte-clay envMapIntensity so these placeholder
    // shapes don't pick up three's envMapIntensity=1 default once
    // GenericViewer's StudioEnvironment populates scene.environment.
    envMapIntensity: 0.32,
    flatShading: true as const,
    transparent: xrayActive,
    opacity,
  }
  switch (subject) {
    case 'math':
      return (
        <mesh scale={scale}>
          <boxGeometry args={[1.15, 1.15, 1.15]} />
          <meshStandardMaterial color="#d9cfe6" {...shared} />
        </mesh>
      )
    case 'physics':
    case 'chemistry':
      return (
        <mesh scale={scale}>
          <octahedronGeometry args={[1.05, 0]} />
          <meshStandardMaterial color="#cfe0e6" {...shared} />
        </mesh>
      )
    case 'space':
      return (
        <mesh scale={scale}>
          <sphereGeometry args={[1, 24, 24]} />
          <meshStandardMaterial color="#c9d6e8" roughness={0.9} metalness={0} envMapIntensity={0.32} />
        </mesh>
      )
    default:
      return (
        <mesh scale={scale}>
          <icosahedronGeometry args={[1.02, 1]} />
          <meshStandardMaterial color="#e8dcc8" {...shared} />
        </mesh>
      )
  }
}

/** L1 composition root — a meaningful, component-aware procedural body. Wrapped in a
 *  group so the "dim on hotspot select" scale behaviour is identical to ProceduralBody. */
function CompositionBody({
  shape,
  active,
  xrayActive,
}: {
  shape: string
  active: boolean
  xrayActive: boolean
}) {
  const Comp = COMPOSITIONS[shape]
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        if (typeof material.userData.baseOpacity !== 'number') {
          material.userData.baseOpacity = material.opacity
        }
        const baseOpacity = material.userData.baseOpacity as number
        material.transparent = xrayActive || baseOpacity < 0.999
        material.opacity = xrayActive ? Math.min(baseOpacity, 0.42) : baseOpacity
        // Registry compositions never authored envMapIntensity (there was no
        // env map to tune against). Clamp to GlbModel's matte-clay default
        // so StudioEnvironment's env map doesn't wash out the tuned clay
        // look with three's envMapIntensity=1 default.
        if (isTunable(material)) material.envMapIntensity = 0.32
        material.needsUpdate = true
      })
    })
  }, [xrayActive, shape])

  if (!Comp) return null
  const scale = active ? 0.9 : 1
  return (
    <group ref={groupRef} scale={scale}>
      <Comp />
    </group>
  )
}

function ProceduralScene({
  subject,
  shape,
  hasComposition,
  hotspots,
  activeHotspotId,
  labelsVisible,
  xrayActive,
  autoRotate,
  animationPlaying,
  onSelectHotspot,
}: {
  subject: SubjectId
  shape?: string
  hasComposition: boolean
  hotspots: Hotspot[]
  activeHotspotId: string | null
  labelsVisible: boolean
  xrayActive: boolean
  autoRotate: boolean
  animationPlaying: boolean
  onSelectHotspot: (id: string) => void
}) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    const group = groupRef.current
    if (!group) return
    if (autoRotate) group.rotation.y += delta * 0.14

    const pulse = animationPlaying ? Math.sin(clock.elapsedTime * 1.35) : 0
    group.position.y = pulse * 0.035
    group.rotation.z = pulse * 0.012
  })

  return (
    <group ref={groupRef}>
      {hasComposition && shape ? (
        <CompositionBody shape={shape} active={activeHotspotId !== null} xrayActive={xrayActive} />
      ) : (
        <ProceduralBody subject={subject} active={activeHotspotId !== null} xrayActive={xrayActive} />
      )}
      {hotspots.map((hs) => (
        <HotspotMarker
          key={hs.id}
          hotspot={hs}
          active={activeHotspotId === hs.id}
          labelsVisible={labelsVisible}
          onSelect={onSelectHotspot}
        />
      ))}
    </group>
  )
}

export default function GenericModel({
  subject,
  branch,
  url,
  visual,
  hotspots,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  crossSection = false,
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
  crossSection?: boolean
  labelsVisible?: boolean
  xrayActive?: boolean
  animationPlaying?: boolean
  onAnimationAvailability?: (available: boolean) => void
}) {
  const hasRealModel = !!url
  const shape = useMemo(
    () => resolveProceduralShape(visual, subject, branch ?? ''),
    [visual, subject, branch],
  )
  const hasComposition = shape !== undefined && shape in COMPOSITIONS

  useEffect(() => {
    if (!hasRealModel) onAnimationAvailability?.(true)
  }, [hasRealModel, onAnimationAvailability])

  if (hasRealModel) {
    return (
      <GlbModel
        url={url}
        branch={branch}
        autoRotate={autoRotate}
        crossSection={crossSection}
        hotspots={hotspots}
        activeHotspot={activeHotspotId}
        labelsVisible={labelsVisible}
        xrayActive={xrayActive}
        animationPlaying={animationPlaying}
        onAnimationAvailability={onAnimationAvailability}
        onSelectHotspot={onSelectHotspot}
      />
    )
  }

  return (
    <ProceduralScene
      subject={subject}
      shape={shape}
      hasComposition={hasComposition}
      hotspots={hotspots}
      activeHotspotId={activeHotspotId}
      labelsVisible={labelsVisible}
      xrayActive={xrayActive}
      autoRotate={autoRotate}
      animationPlaying={animationPlaying}
      onSelectHotspot={onSelectHotspot}
    />
  )
}
