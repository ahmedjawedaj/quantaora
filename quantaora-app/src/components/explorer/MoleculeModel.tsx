import { Suspense, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GlbErrorBoundary } from './GlbErrorBoundary'
import { ELEMENT_COLOR, ELEMENT_RADIUS, type Atom, type Bond } from '@/data/molecules'

/** Reported by the rendered model (procedural or GLB) once its real geometric extent and
 *  per-atom screen positions are known, so the camera (MoleculeViewer) and hotspot markers can
 *  be sized/placed from the actual rendered geometry instead of a single shared guess. */
export interface ModelReadyInfo {
  /** Worst-case bounding-sphere radius (half the 3D diagonal of the rendered model's bounding
   *  box) — safe to use for camera framing regardless of how the model is rotated. */
  radius: number
  /** Final on-screen position for each atom id, in the same world space the model itself
   *  renders in (post GLB centering/scaling, when applicable). */
  atomPositions: Record<string, [number, number, number]>
}

const BOND_RADIUS = 0.07
const BOND_GAP = 0.11

function bondTransform(from: THREE.Vector3, to: THREE.Vector3) {
  const mid = from.clone().add(to).multiplyScalar(0.5)
  const dir = to.clone().sub(from)
  const length = dir.length()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return { mid, length, quaternion }
}

function Bond({
  from,
  to,
  order,
  dimmed,
  xrayActive,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  order: 1 | 2
  dimmed: boolean
  xrayActive: boolean
}) {
  const { mid, length, quaternion } = useMemo(() => bondTransform(from, to), [from, to])
  const offsets = order === 2 ? [-BOND_GAP, BOND_GAP] : [0]
  const perp = useMemo(() => {
    const dir = to.clone().sub(from).normalize()
    const arbitrary = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0)
    return new THREE.Vector3().crossVectors(dir, arbitrary).normalize()
  }, [from, to])

  return (
    <>
      {offsets.map((offset) => (
        <mesh
          key={offset}
          position={mid.clone().addScaledVector(perp, offset)}
          quaternion={quaternion}
        >
          <cylinderGeometry args={[BOND_RADIUS, BOND_RADIUS, length, 16]} />
          <meshPhysicalMaterial color="#d8d2c6" roughness={0.35} clearcoat={0.6} clearcoatRoughness={0.3} transparent opacity={xrayActive ? 0.28 : dimmed ? 0.3 : 1} />
        </mesh>
      ))}
    </>
  )
}

function BondElectron({
  from,
  to,
  offset,
  active,
}: {
  from: THREE.Vector3
  to: THREE.Vector3
  offset: number
  active: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  const progress = useRef(offset)

  useFrame((_, delta) => {
    if (!ref.current) return
    if (active) progress.current = (progress.current + delta * 0.55) % 1
    ref.current.position.lerpVectors(from, to, progress.current)
  })

  return (
    <mesh ref={ref} position={from}>
      <sphereGeometry args={[0.045, 16, 16]} />
      <meshStandardMaterial color="#35A6C8" emissive="#35A6C8" emissiveIntensity={active ? 1.25 : 0.12} />
    </mesh>
  )
}

function AtomSphere({
  atom,
  dimmed,
  highlighted,
  xrayActive,
}: {
  atom: Atom
  dimmed: boolean
  highlighted: boolean
  xrayActive: boolean
}) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (!ref.current) return
    const material = ref.current.material as THREE.MeshPhysicalMaterial
    const targetOpacity = xrayActive ? (dimmed ? 0.18 : 0.38) : dimmed ? 0.28 : 1
    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.15)
    const targetScale = highlighted ? 1.15 : 1
    ref.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.15)
  })
  return (
    <mesh ref={ref} position={atom.position}>
      <sphereGeometry args={[ELEMENT_RADIUS[atom.element], 32, 32]} />
      <meshPhysicalMaterial
        color={ELEMENT_COLOR[atom.element]}
        roughness={0.3}
        clearcoat={0.7}
        clearcoatRoughness={0.25}
        transparent
      />
    </mesh>
  )
}

function ProceduralMolecule({
  atoms,
  bonds,
  autoRotate,
  activeAtomId,
  xrayActive = false,
  animationPlaying = true,
  onModelReady,
}: {
  atoms: Atom[]
  bonds: Bond[]
  autoRotate: boolean
  activeAtomId: string | null
  xrayActive?: boolean
  animationPlaying?: boolean
  onModelReady?: (info: ModelReadyInfo) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const atomById = useMemo(() => Object.fromEntries(atoms.map((a) => [a.id, a])), [atoms])
  const dimmed = activeAtomId !== null

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.35
  })

  // The procedural renderer draws atoms exactly at their authored positions (no extra
  // centering/scaling step), so the footprint bounding box IS the real rendered extent and the
  // atom positions ARE the real on-screen positions — reported as-is for the shared camera-bounds
  // and hotspot-alignment logic in MoleculeViewer.
  useEffect(() => {
    const footprint = proceduralFootprint(atoms)
    const radius = footprint.length() / 2
    const atomPositions = Object.fromEntries(atoms.map((atom) => [atom.id, atom.position])) as Record<
      string,
      [number, number, number]
    >
    onModelReady?.({ radius, atomPositions })
  }, [atoms, onModelReady])

  return (
    <group ref={groupRef}>
      {bonds.map((bond) => (
        <Bond
          key={`${bond.a}-${bond.b}`}
          from={new THREE.Vector3(...atomById[bond.a].position)}
          to={new THREE.Vector3(...atomById[bond.b].position)}
          order={bond.order}
          dimmed={dimmed}
          xrayActive={xrayActive}
        />
      ))}
      {bonds.flatMap((bond) => {
        const from = new THREE.Vector3(...atomById[bond.a].position)
        const to = new THREE.Vector3(...atomById[bond.b].position)
        return Array.from({ length: bond.order }, (_, index) => (
          <BondElectron
            key={`${bond.a}-${bond.b}-electron-${index}`}
            from={from}
            to={to}
            offset={(index + 1) / (bond.order + 1)}
            active={animationPlaying}
          />
        ))
      })}
      {atoms.map((atom) => (
        <AtomSphere
          key={atom.id}
          atom={atom}
          dimmed={dimmed && atom.id !== activeAtomId}
          highlighted={atom.id === activeAtomId}
          xrayActive={xrayActive}
        />
      ))}
    </group>
  )
}

type TunableMaterial = THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial

function isTunable(material: THREE.Material): material is TunableMaterial {
  return (material as THREE.MeshStandardMaterial).isMeshStandardMaterial === true
}

/** The same van-der-Waals-adjacent "footprint" the procedural atoms already occupy (atom
 *  position ± its CPK radius on every axis) — used as the target size a sourced GLB is
 *  normalized into, so switching between procedural and GLB rendering for the same molecule
 *  doesn't jump in scale, and different molecules keep their real relative sizes (CO2 bigger
 *  than water, etc.) instead of all being force-fit into one shared cube. */
export function proceduralFootprint(atoms: Atom[]): THREE.Vector3 {
  const box = new THREE.Box3()
  atoms.forEach((atom) => {
    const r = ELEMENT_RADIUS[atom.element]
    const [x, y, z] = atom.position
    box.expandByPoint(new THREE.Vector3(x + r, y + r, z + r))
    box.expandByPoint(new THREE.Vector3(x - r, y - r, z - r))
  })
  const size = box.getSize(new THREE.Vector3())
  if (!Number.isFinite(size.x) || !Number.isFinite(size.y) || !Number.isFinite(size.z)) {
    return new THREE.Vector3(1.6, 1.6, 1.6)
  }
  return size
}

const GLB_ATOM_NODE_PATTERN = /^atom-([A-Za-z]+)-\d+$/

/** Default (non-"Focus") isolate dim target applied to every material in a GLB mesh whenever an
 *  atom/ion is selected. A real sourced GLB (e.g. the ~27-ion NaCl lattice) can't reliably be
 *  isolated node-by-node -- nearest-neighbor node matching only tags the one node closest to each
 *  authored atom, which is fragile across differently-exported assets -- so the whole mesh dims as
 *  a single unit instead, and the selected ion is made unmistakable separately via
 *  `SelectedIonOverlay` below. Named "context" because, unlike ISOLATE_FOCUS_DIM_OPACITY, it stays
 *  bright enough to keep the rest of the lattice's spatial arrangement visible. */
export const ISOLATE_CONTEXT_DIM_OPACITY = 0.4
/** Opt-in stronger dim (see ChemistryLab.tsx's "Focus this ion" toggle) for a learner who wants
 *  the selected ion to stand out sharply from the rest of the lattice instead of keeping full
 *  spatial context. Deliberately far below ISOLATE_CONTEXT_DIM_OPACITY (not just "a bit lower")
 *  so Focus reads as unmistakably different even accounting for how ~27 overlapping
 *  semi-transparent ions in the real lattice GLB compound their alpha visually. */
export const ISOLATE_FOCUS_DIM_OPACITY = 0.12

/** Per-material opacity target for a whole GLB mesh during Isolate. Pure and Three.js-free so
 *  it's directly unit-testable -- see moleculeLatticeIsolate.test.ts. When `dimmed` is false this
 *  always returns to `baseOpacity` regardless of prior selection, so deselecting (or switching
 *  molecules, which remounts with a fresh baseOpacity) fully restores the original material with
 *  no leftover isolate state. Context and Focus modes are guaranteed to read as visibly different
 *  because ISOLATE_FOCUS_DIM_OPACITY is strictly lower than ISOLATE_CONTEXT_DIM_OPACITY and both
 *  are applied to the same whole-lattice target -- there is no per-node branch to silently no-op. */
export function resolveIsolateOpacity({
  baseOpacity,
  dimmed,
  isolateFocusMode,
  xrayActive,
}: {
  baseOpacity: number
  dimmed: boolean
  isolateFocusMode: boolean
  xrayActive: boolean
}): number {
  if (!dimmed) return xrayActive ? Math.min(baseOpacity, 0.42) : baseOpacity
  const dimTarget = isolateFocusMode ? ISOLATE_FOCUS_DIM_OPACITY : ISOLATE_CONTEXT_DIM_OPACITY
  return xrayActive ? Math.min(dimTarget, 0.2) : Math.min(baseOpacity, dimTarget)
}

/** Sourced molecule GLBs name every atom mesh `atom-<ELEMENT>-<index>` (see
 *  public/models/chemistry/molecules/*.glb — verified across water/CO2/methane/NaCl). The
 *  authored `atoms` array (used for hotspots, the builder, and the procedural fallback) is a
 *  separate, hand-placed coordinate space that only happens to line up with the GLB's real atom
 *  nodes for small molecules authored from the same source coordinates. It does NOT line up for
 *  the sodium-chloride lattice, whose `atoms` array is a stylized 2-ion "formula unit" while the
 *  GLB renders the real ~27-ion repeating lattice for visual richness — so hotspot markers built
 *  from the raw `atoms` positions float over empty space there.
 *
 *  This matches each authored atom to its nearest same-element GLB node (in the GLB's own raw,
 *  pre-normalization coordinate space) and returns that node's position after applying the exact
 *  same centering + scaling transform used to render the mesh, so a hotspot marker always sits
 *  on the atom it actually names, for every molecule — not just the ones where the two coordinate
 *  spaces happened to already agree. Also returns each matched node's own real on-screen radius
 *  (its bounding box, scaled the same way), used by `SelectedIonOverlay` below to size a
 *  correctly-colored highlight sphere over the selected ion without needing to isolate that ion's
 *  mesh node from the rest of the (uniformly dimmed) lattice. */
function extractGlbAtomPositions(
  root: THREE.Object3D,
  atoms: Atom[],
  center: THREE.Vector3,
  scale: number,
): { positions: Record<string, [number, number, number]>; radii: Record<string, number> } {
  const candidatesByElement = new Map<string, { node: THREE.Object3D; worldPos: THREE.Vector3 }[]>()
  root.traverse((child) => {
    const match = GLB_ATOM_NODE_PATTERN.exec(child.name)
    if (!match) return
    const element = match[1].toUpperCase()
    const list = candidatesByElement.get(element) ?? []
    // World position, not local `child.position` — accounts for any corrective rotation applied
    // to `root` (see `modelRotation`), so a hotspot marker lands on the atom's real on-screen
    // location even when the mesh has been re-oriented from its authored transform.
    list.push({ node: child, worldPos: child.getWorldPosition(new THREE.Vector3()) })
    candidatesByElement.set(element, list)
  })

  const claimed = new Set<THREE.Object3D>()
  const positions: Record<string, [number, number, number]> = {}
  const radii: Record<string, number> = {}

  atoms.forEach((atom) => {
    const pool = candidatesByElement.get(atom.element.toUpperCase()) ?? []
    const target = new THREE.Vector3(...atom.position)
    let best: { node: THREE.Object3D; worldPos: THREE.Vector3 } | null = null
    let bestDistSq = Infinity
    for (const candidate of pool) {
      if (claimed.has(candidate.node)) continue
      const distSq = candidate.worldPos.distanceToSquared(target)
      if (distSq < bestDistSq) {
        best = candidate
        bestDistSq = distSq
      }
    }
    if (!best) return
    claimed.add(best.node)
    const finalPos = best.worldPos.clone().sub(center).multiplyScalar(scale)
    positions[atom.id] = [finalPos.x, finalPos.y, finalPos.z]
    const nodeSize = new THREE.Box3().setFromObject(best.node).getSize(new THREE.Vector3())
    radii[atom.id] = (Math.max(nodeSize.x, nodeSize.y, nodeSize.z) / 2) * scale
  })

  return { positions, radii }
}

/** How much bigger than its real matched-node radius the selected ion's opaque core sphere grows
 *  to, once its grow-in animation settles -- deliberately well past the old 1.18 so "this is the
 *  selected ion" reads at a glance even at a 390x844 mobile viewport, not just on close inspection. */
const OVERLAY_CORE_SCALE = 1.32
/** Outer halo shell scale, relative to the same real matched-node radius -- rendered as a
 *  translucent THREE.BackSide shell around the opaque core (see `SelectedIonOverlay` below), so it
 *  reads as a soft rim/outline silhouette rather than a bloom-postprocessing glow (this app doesn't
 *  depend on postprocessing bloom being enabled for isolate/focus to read correctly). */
const OVERLAY_HALO_SCALE = 1.6
const OVERLAY_HALO_OPACITY = 0.32

/** Correctly-colored, always-full-strength highlight rendered over the selected atom/ion's real
 *  on-screen position -- the mechanism that makes selection "unmistakable" for a real sourced GLB.
 *  Doesn't rely on isolating that ion's own mesh node from the rest of the (uniformly dimmed, see
 *  `resolveIsolateOpacity`) lattice, since nearest-neighbor node matching in
 *  `extractGlbAtomPositions` is a best-effort visual match, not guaranteed for every asset.
 *
 *  Two nested meshes: an opaque core sphere (always full strength, never affected by isolate/focus
 *  dimming) sized visibly larger than the real ion it highlights, plus a translucent BackSide halo
 *  shell around it -- BackSide-only geometry renders just the far inner surface of the shell, so it
 *  shows up as a soft rim/outline around the core's silhouette instead of a solid blob that would
 *  cover the core's own color and obscure the chemistry underneath. */
function SelectedIonOverlay({
  position,
  radius,
  color,
}: {
  position: [number, number, number]
  radius: number
  color: string
}) {
  const coreRef = useRef<THREE.Mesh>(null)
  const haloRef = useRef<THREE.Mesh>(null)
  useFrame(() => {
    if (coreRef.current) {
      const s = OVERLAY_CORE_SCALE
      coreRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15)
    }
    if (haloRef.current) {
      const s = OVERLAY_HALO_SCALE
      haloRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.15)
    }
  })
  return (
    <group position={position}>
      <mesh ref={haloRef} scale={1}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={OVERLAY_HALO_OPACITY}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={coreRef} scale={1}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.8} clearcoatRoughness={0.2} emissive={color} emissiveIntensity={0.16} />
      </mesh>
    </group>
  )
}

/** Real sourced molecule mesh (RCSB PDB ideal coordinates or project-authored textbook
 *  geometry, see public/models/chemistry/molecules/). Normalized to match the footprint the
 *  procedural atoms/bonds render for the same molecule, centered, and given the same warm
 *  matte-glossy material tuning as the other GLB catalogs in the app (CellModel, GenericModel). */
function GlbMolecule({
  url,
  atoms,
  autoRotate,
  activeAtomId,
  isolateFocusMode = false,
  xrayActive,
  rotation,
  onModelReady,
}: {
  url: string
  atoms: Atom[]
  autoRotate: boolean
  /** Selected atom/ion id, or null when nothing is selected. Drives whole-lattice isolate dimming
   *  below (see `resolveIsolateOpacity`) plus the `SelectedIonOverlay` highlight rendered over
   *  this atom's real on-screen position, so the selection reads as unmistakable even though the
   *  underlying GLB mesh dims as one unit rather than node-by-node. */
  activeAtomId: string | null
  /** See ChemistryLab.tsx's "Focus this ion" toggle -- strengthens the dim on the whole lattice
   *  instead of the softer default that keeps the rest of the structure's spatial layout visible. */
  isolateFocusMode?: boolean
  xrayActive: boolean
  /** Fixed Euler correction [x, y, z] (radians) — see `Molecule.modelRotation`. Applied to the
   *  mesh before its bounding box/atom positions are measured, so framing and hotspots both
   *  reflect the corrected orientation, not the GLB's raw authored one. */
  rotation?: [number, number, number]
  onModelReady?: (info: ModelReadyInfo) => void
}) {
  const dimmed = activeAtomId !== null
  const { scene } = useGLTF(url)
  const { gl } = useThree()
  const groupRef = useRef<THREE.Group>(null)

  const { model, radius, atomPositions, atomRadii } = useMemo(() => {
    const cloned = scene.clone(true)
    if (rotation) cloned.rotation.set(rotation[0], rotation[1], rotation[2])
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const targetSize = proceduralFootprint(atoms)
    const targetMax = Math.max(targetSize.x, targetSize.y, targetSize.z, 0.6)
    const scale = targetMax / Math.max(size.x, size.y, size.z, 0.001)

    // Computed from the model's REAL bounding box (not the footprint target), before it gets
    // mutated below — this is what actually ends up on screen, which for a large repeating
    // lattice like NaCl can be a very different shape than the small authored `atoms` footprint.
    const { positions: atomPositions, radii: atomRadii } = extractGlbAtomPositions(cloned, atoms, center.clone(), scale)
    const radius = size.clone().multiplyScalar(scale).length() / 2

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

        material.roughness = THREE.MathUtils.clamp(material.roughness ?? 0.5, 0.42, 0.62)
        material.metalness = 0
        material.envMapIntensity = 0.32
        material.emissive.set(0x000000)

        if ('clearcoat' in material) {
          const physical = material as THREE.MeshPhysicalMaterial
          physical.clearcoat = THREE.MathUtils.clamp(physical.clearcoat, 0.08, 0.12)
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

    return { model: cloned, radius, atomPositions, atomRadii }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, gl, rotation])

  useEffect(() => {
    onModelReady?.({ radius, atomPositions })
  }, [radius, atomPositions, onModelReady])

  // The materials cloned above (`child.material.clone()`) are per-mount GPU resources distinct
  // from the ones on the cached `useGLTF(url)` scene -- three.js never garbage-collects a
  // material's compiled WebGL program on its own, so switching molecules (which remounts this
  // component with a new `model`) leaks one full set of cloned materials per switch unless
  // disposed here. Only the clones are disposed, not their `.map`/`.normalMap`/etc. textures --
  // `Material.dispose()` doesn't cascade to attached textures, and those textures are shared
  // references back to the cached `useGLTF` scene's original materials, so disposing them would
  // corrupt every other mount of this same cached model.
  useEffect(() => {
    return () => {
      model.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return
        const materials = Array.isArray(child.material) ? child.material : [child.material]
        materials.forEach((material) => material.dispose())
      })
    }
  }, [model])

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) groupRef.current.rotation.y += delta * 0.35
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        const baseOpacity =
          typeof material.userData.baseOpacity === 'number'
            ? material.userData.baseOpacity
            : 1
        const target = resolveIsolateOpacity({ baseOpacity, dimmed, isolateFocusMode, xrayActive })
        material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
        // transparent stays true until the fade has actually settled back near baseOpacity, so
        // un-dimming never "pops" to fully opaque mid-fade (a non-transparent material ignores
        // its opacity value and always renders fully opaque).
        material.transparent = baseOpacity < 0.999 || material.opacity < 0.999 || target < 0.999
      })
    })
  })

  const activeAtom = activeAtomId ? atoms.find((atom) => atom.id === activeAtomId) : null
  const activeAtomPosition = activeAtomId ? atomPositions[activeAtomId] : null

  return (
    <group ref={groupRef}>
      {dimmed && activeAtom && activeAtomPosition && (
        <SelectedIonOverlay
          position={activeAtomPosition}
          radius={atomRadii[activeAtomId!] ?? ELEMENT_RADIUS[activeAtom.element]}
          color={ELEMENT_COLOR[activeAtom.element]}
        />
      )}
      <primitive object={model} />
    </group>
  )
}

/** Screen-reader-only status/alert text layered over a visual fallback (the procedural
 *  ball-and-stick render) that doesn't otherwise carry any text of its own — announces the
 *  loading/error state to assistive tech without changing what's actually drawn on screen. */
function StatusAnnouncement({ message, role }: { message: string; role: 'status' | 'alert' }) {
  return (
    <Html center>
      <span role={role} aria-live={role === 'status' ? 'polite' : undefined} className="sr-only">
        {message}
      </span>
    </Html>
  )
}

export function MoleculeModel({
  atoms,
  bonds,
  autoRotate,
  activeAtomId,
  isolateFocusMode = false,
  modelType = 'procedural',
  modelUrl,
  modelRotation,
  xrayActive = false,
  animationPlaying = true,
  onModelReady,
}: {
  atoms: Atom[]
  bonds: Bond[]
  autoRotate: boolean
  activeAtomId: string | null
  /** See ChemistryLab.tsx's "Focus this ion" toggle — only meaningful for `'glb'` rendering, where
   *  it strengthens the isolate dim on every mesh node except the selected atom/ion's own. */
  isolateFocusMode?: boolean
  modelType?: 'glb' | 'procedural'
  modelUrl?: string
  /** Fixed Euler correction [x, y, z] (radians) — see `Molecule.modelRotation`. */
  modelRotation?: [number, number, number]
  xrayActive?: boolean
  animationPlaying?: boolean
  onModelReady?: (info: ModelReadyInfo) => void
}) {
  const procedural = (
    <ProceduralMolecule
      atoms={atoms}
      bonds={bonds}
      autoRotate={autoRotate}
      activeAtomId={activeAtomId}
      xrayActive={xrayActive}
      animationPlaying={animationPlaying}
      onModelReady={onModelReady}
    />
  )

  if (modelType === 'glb' && modelUrl) {
    const loadingFallback = (
      <>
        {procedural}
        <StatusAnnouncement role="status" message="Loading molecule model…" />
      </>
    )
    const errorFallback = (
      <>
        {procedural}
        <StatusAnnouncement role="alert" message="This 3D model couldn't load. Showing a simplified view instead." />
      </>
    )
    return (
      <GlbErrorBoundary key={modelUrl} fallback={errorFallback} source="[MoleculeViewer]">
        <Suspense fallback={loadingFallback}>
          <GlbMolecule
            url={modelUrl}
            atoms={atoms}
            autoRotate={autoRotate}
            activeAtomId={activeAtomId}
            isolateFocusMode={isolateFocusMode}
            xrayActive={xrayActive}
            rotation={modelRotation}
            onModelReady={onModelReady}
          />
        </Suspense>
      </GlbErrorBoundary>
    )
  }

  return procedural
}
