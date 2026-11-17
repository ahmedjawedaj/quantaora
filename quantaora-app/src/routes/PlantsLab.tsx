import { Component, Suspense, useCallback, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { ChevronDown, SlidersHorizontal, Sprout, X, Leaf as LeafIcon } from 'lucide-react'
import { plants, growthStageModels } from '@/data/generated/plants'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import ContentNav from '@/components/explorer/ContentNav'
import DetailPanel from '@/components/explorer/DetailPanel'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { cn } from '@/lib/utils'

// ── palette ─────────────────────────────────────────────────────────────────
const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const GREEN_DEEP = '#4E8A52'
const GREEN_LEAF = '#6FAF63'
const GREEN_SOFT = '#7FA874'
const GREEN_PALE = '#DCE8CE'
const GOLD = '#D9A441'
const AMBER = '#C98F2C'
const BLUE = '#4C7EC8'
const BLUE_SOFT = '#7FA6D9'
const SOIL = '#8A6A45'
const BARK = '#8B6B4A'
const PINK = '#D96B8A'
const CREAM = '#F4EFE5'
const TAN = '#C9BFA9'

const contentById = Object.fromEntries(plants.map((item) => [item.id, item]))

// Preload every growth-stage GLB up front (all 7 files together are well under
// 200 KB) so scrubbing the stage slider swaps meshes instantly with no
// per-step Suspense flicker.
;[...growthStageModels.seed, ...growthStageModels.flower].forEach((stage) => useGLTF.preload(stage.modelUrl))
const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'plants')

function hotspotFor(content: ComponentContent, label: string): Hotspot | null {
  return content.hotspots.find((hotspot) => hotspot.label === label) ?? null
}

// ── variable → outcome helpers ─────────────────────────────────────────────
/** 0–1 fit of water + warmth + nutrients to a seed's germination sweet spot (defaults ≈ 1). */
function seedSuitability(water: number, warmth: number, nutrients: number) {
  const waterFit = Math.max(0, 1 - Math.abs(water - 60) / 55)
  const warmthFit = Math.max(0, 1 - Math.abs(warmth - 58) / 50)
  const nutrientFit = Math.max(0.35, nutrients / 100)
  return Math.max(0, Math.min(1, waterFit * warmthFit * nutrientFit))
}

function seedStallReason(water: number, warmth: number, nutrients: number, suitability: number): string | null {
  if (suitability >= 0.18) return null
  if (water < 25) return 'too dry — add water'
  if (water > 92) return 'waterlogged — roots need air too'
  if (warmth < 25) return 'too cold to wake up'
  if (warmth > 92) return 'too hot for the embryo'
  if (nutrients < 20) return 'poor soil — add nutrients'
  return 'conditions are not quite right'
}

/** 0–1 rate of sugar production from light + CO₂ (defaults ≈ 0.58). */
function photosynthesisRate(light: number, co2: number) {
  const lightFit = Math.max(0.08, light / 100)
  const co2Fit = Math.max(0.15, Math.min(1, co2 / 60))
  return Math.max(0.08, Math.min(1, lightFit * co2Fit))
}

function sugarOutputLabel(rate: number) {
  if (rate < 0.28) return 'low — dim light or little CO₂'
  if (rate < 0.65) return 'steady'
  return 'high — lots of sugar!'
}

function waterFlowLabel(uptake: number) {
  if (uptake < 22) return 'slow trickle'
  if (uptake < 65) return 'steady flow'
  return 'rushing upward'
}

type ChallengeStep = { label: string; text: string }

/** Concise Observe/Predict/Change/Explain/Check prompts tied to the active component + state. */
function getChallenge(
  activeId: string,
  ctx: {
    germinationStage: string
    stallReason: string | null
    sugarLabel: string
    waterLabel: string
    turgorPct: number
    pollinated: boolean
    seedFormed: boolean
  },
): ChallengeStep[] {
  switch (activeId) {
    case 'seed':
      return [
        { label: 'Observe', text: `The seed is at "${ctx.germinationStage}" with the current water, warmth, and soil nutrients.` },
        { label: 'Predict', text: 'What happens to growth if you drag water almost to zero, or soil nutrients way down?' },
        { label: 'Change', text: 'Open Tune plant, tap Try: dry + cold or Try: well-watered, then adjust water, warmth, and nutrients.' },
        { label: 'Explain', text: ctx.stallReason ? `Growth stalled: ${ctx.stallReason}.` : 'Water and warmth wake the embryo; nutrients fuel steady growth; the root grows first, then the shoot.' },
        { label: 'Check', text: 'Can you grow the seedling all the way into a mature, flowering plant?' },
      ]
    case 'chloroplast':
    case 'leaf':
      return [
        { label: 'Observe', text: `Sugar output right now is ${ctx.sugarLabel}.` },
        { label: 'Predict', text: 'What happens to sugar output if light or CO₂ drops to zero?' },
        { label: 'Change', text: 'Move the sunlight, water, or CO₂ controls in Tune plant, then watch sugar output.' },
        { label: 'Explain', text: 'Photosynthesis needs light, water, and CO₂ to make sugar and oxygen.' },
        { label: 'Check', text: 'Find the light level that gives the highest sugar output.' },
      ]
    case 'phloem':
      return [
        { label: 'Observe', text: 'Sugar flows from the leaf (source) down to roots and seeds (sinks).' },
        { label: 'Predict', text: 'What happens to this flow if the leaf makes less sugar?' },
        { label: 'Change', text: 'Open the Chloroplast component and lower light or CO₂, then come back.' },
        { label: 'Explain', text: 'Phloem only carries the sugar photosynthesis actually produces.' },
        { label: 'Check', text: 'Name one sink storing sugar for later.' },
      ]
    case 'root':
      return [
        { label: 'Observe', text: `Water is moving in a ${ctx.waterLabel}.` },
        { label: 'Predict', text: 'What happens to the flow if roots take up less water or the soil is peeled away?' },
        { label: 'Change', text: 'Move Root water uptake or tap Peel the soil away in Tune plant.' },
        { label: 'Explain', text: 'Roots take in water and minerals; xylem carries them one-way, root to leaf.' },
        { label: 'Check', text: 'Can you make the flow almost stop?' },
      ]
    case 'stem':
    case 'xylem':
      return [
        { label: 'Observe', text: `Water is moving in a ${ctx.waterLabel}.` },
        { label: 'Predict', text: 'What happens to the flow if roots take up less water?' },
        { label: 'Change', text: 'Move Root water uptake; on the stem, show the cross-section to find the tubes.' },
        { label: 'Explain', text: 'Xylem carries water + minerals up; phloem carries food down.' },
        { label: 'Check', text: 'Can you point to xylem and phloem and tell their directions?' },
      ]
    case 'stomata':
      return [
        { label: 'Observe', text: `The pore is ${ctx.turgorPct}% open.` },
        { label: 'Predict', text: 'What happens to the pore if water drops close to zero?' },
        { label: 'Change', text: 'Drag the guard-cell water slider in Tune plant.' },
        { label: 'Explain', text: 'Guard cells swell with water to open the pore; low water closes it and the leaf wilts.' },
        { label: 'Check', text: 'Find the water level where the leaf starts wilting.' },
      ]
    case 'flower':
      return [
        { label: 'Observe', text: ctx.pollinated ? (ctx.seedFormed ? 'A seed has formed in the ovary.' : 'Pollen is moving toward the stigma.') : 'No pollinator has visited yet.' },
        { label: 'Predict', text: 'What has to happen before a seed can form?' },
        { label: 'Change', text: 'Tap "Bee visits" in Tune plant.' },
        { label: 'Explain', text: 'Pollen must move from anther to stigma (pollination) before a seed forms.' },
        { label: 'Check', text: 'Watch the ovary — did a seed appear?' },
      ]
    default:
      return []
  }
}

function GuidedChallenge({ steps }: { steps: ChallengeStep[] }) {
  if (steps.length === 0) return null
  return (
    <div className="grid gap-2 border-b border-[color:var(--color-border)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Guided challenge</p>
      <ol className="grid gap-1.5">
        {steps.map((step) => (
          <li key={step.label} className="text-xs leading-relaxed text-[color:var(--color-ink-700)]">
            <span className="font-semibold text-[color:var(--color-foreground)]">{step.label}:</span> {step.text}
          </li>
        ))}
      </ol>
    </div>
  )
}

// ── shared 3D primitives ────────────────────────────────────────────────────
function Marker({
  position,
  color,
  active,
  label,
  onSelect,
  dim,
}: {
  position: [number, number, number]
  color: string
  active?: boolean
  label?: string
  onSelect?: () => void
  dim?: boolean
}) {
  return (
    <group
      position={position}
      onClick={onSelect ? (event) => { event.stopPropagation(); onSelect() } : undefined}
    >
      <mesh>
        <sphereGeometry args={[active ? 0.11 : 0.09, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.7 : 0.18} transparent={dim} opacity={dim ? 0.25 : 1} />
      </mesh>
      {label && (
        <Billboard position={[0, 0.22, 0]}>
          <Text fontSize={0.11} color={INK} anchorX="center" anchorY="middle">{label}</Text>
        </Billboard>
      )}
    </group>
  )
}

function ChipLabel({ text, position, color = INK }: { text: string; position: [number, number, number]; color?: string }) {
  return (
    <Billboard position={position}>
      <Text fontSize={0.13} color={color} anchorX="center" anchorY="middle">{text}</Text>
    </Billboard>
  )
}

/** A smooth tube made of beads along a polyline — the app's tube primitive. */
function BeadTube({
  points,
  color,
  radius = 0.045,
  onSelect,
  dim,
  opacity = 1,
}: {
  points: [number, number, number][]
  color: string
  radius?: number
  onSelect?: () => void
  dim?: boolean
  opacity?: number
}) {
  return (
    <group onClick={onSelect ? (event) => { event.stopPropagation(); onSelect() } : undefined}>
      {points.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[radius, 10, 10]} />
          <meshStandardMaterial color={color} transparent={dim || opacity < 1} opacity={dim ? 0.2 : opacity} />
        </mesh>
      ))}
    </group>
  )
}

/** Particles streaming along a path — one cycle per `progress` unit. */
function Flow({
  path,
  count = 8,
  color,
  progress,
  size = 0.055,
  onSelect,
  dim,
}: {
  path: (t: number) => [number, number, number]
  count?: number
  color: string
  progress: number
  size?: number
  onSelect?: () => void
  dim?: boolean
}) {
  return (
    <group onClick={onSelect ? (event) => { event.stopPropagation(); onSelect() } : undefined}>
      {Array.from({ length: count }, (_, index) => {
        const t = (index / count + progress) % 1
        const p = path(t)
        return (
          <mesh key={index} position={p}>
            <sphereGeometry args={[size, 8, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} transparent={dim} opacity={dim ? 0.2 : 1} />
          </mesh>
        )
      })}
    </group>
  )
}

function Arrow({ from, to, color, dim }: { from: [number, number, number]; to: [number, number, number]; color: string; dim?: boolean }) {
  const dir: [number, number, number] = [to[0] - from[0], to[1] - from[1], to[2] - from[2]]
  const len = Math.hypot(dir[0], dir[1], dir[2])
  const angleY = Math.atan2(dir[0], dir[2])
  const angleX = Math.asin(dir[1] / len)
  return (
    <group position={to} rotation={[angleX, angleY, 0]}>
      <mesh>
        <coneGeometry args={[0.05, 0.14, 10]} />
        <meshStandardMaterial color={color} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
    </group>
  )
}

// ── growth-stage GLB sequences (Wave 3 / P0-4 integration) ─────────────────
// A real-3D "scrub through growth stages" layer, additive on top of the
// existing Seed/Flower procedural compositions below. Swaps which single GLB
// mesh is visible/focused based on a stage index — never overlays multiple
// stages at once. Assets are stylized Quaternius game props, not scientific
// diagrams, so labels stay generic ("stage N") rather than naming botanical
// phases (spec caveat carried over from docs/assets/biology-life.md).

/** Class component required for React error boundaries. On a GLB load
 *  failure, reports upward so the caller can fall back to the always-solid
 *  procedural composition instead of leaving a blank/broken canvas. */
class GrowthStageErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error('[PlantsLab] growth-stage GLB failed to load', error)
    this.props.onError()
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function GrowthStageLoading({ label }: { label: string }) {
  return (
    <group>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={GREEN_SOFT} transparent opacity={0.5} />
      </mesh>
      <ChipLabel text={`Loading real ${label} model…`} position={[0, -0.2, 0.3]} color={GREEN_DEEP} />
    </group>
  )
}

/** Fits every stage of a sequence with ONE shared scale (derived from the
 *  largest stage), so scrubbing the sequence still visibly shows the plant
 *  growing rather than each stage being auto-normalized to the same size. */
function useSharedGrowthScale(scenes: THREE.Object3D[], targetMaxDim: number) {
  return useMemo(() => {
    let maxDim = 0
    for (const scene of scenes) {
      const box = new THREE.Box3().setFromObject(scene)
      const size = box.getSize(new THREE.Vector3())
      maxDim = Math.max(maxDim, size.x, size.y, size.z)
    }
    return targetMaxDim / Math.max(maxDim, 0.001)
  }, [scenes, targetMaxDim])
}

/** Recolors any teal/cyan-hued material toward a warm pink — the shared
 *  material-color fix recommended (not required) for flower-stage-4-bloom's
 *  unusual dark teal petals, done here at scene-setup time (not a geometry
 *  edit to the source asset). Leaves green stem/leaf materials untouched. */
function warmTealMaterials(object: THREE.Object3D) {
  const hsl = { h: 0, s: 0, l: 0 }
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    materials.forEach((material) => {
      const standard = material as THREE.MeshStandardMaterial
      if (!standard.color) return
      standard.color.getHSL(hsl)
      if (hsl.h > 0.38 && hsl.h < 0.58) {
        standard.color.setHSL(0.94, 0.55, Math.max(0.45, hsl.l))
      }
    })
  })
}

function GrowthStageModelView({
  stages,
  index,
  targetMaxDim,
  recolorTeal,
}: {
  stages: { label: string; modelUrl: string }[]
  index: number
  targetMaxDim: number
  recolorTeal?: boolean
}) {
  const results = useGLTF(stages.map((stage) => stage.modelUrl)) as unknown as { scene: THREE.Object3D }[]
  const scenes = useMemo(() => results.map((r) => r.scene), [results])
  const baseScale = useSharedGrowthScale(scenes, targetMaxDim)
  const clampedIndex = Math.min(Math.max(index, 0), stages.length - 1)
  const active = results[clampedIndex] ?? results[0]

  const model = useMemo(() => {
    const cloned = active.scene.clone(true)
    const box = new THREE.Box3().setFromObject(active.scene)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    // Minimum-visibility floor (Wave 10 QA P2): stages share ONE scale derived
    // from the largest stage, so an early stage (e.g. a corn seedling) can end
    // up a barely-visible sliver. Boost only the small stages toward a visible
    // floor height, capped so the size progression across stages stays
    // readable — this doesn't touch the shared-scale "growing" story, it just
    // keeps the smallest stage from disappearing.
    const scaledHeight = size.y * baseScale
    const minVisibleHeight = targetMaxDim * 0.3
    const boost = scaledHeight > 0.001 && scaledHeight < minVisibleHeight ? Math.min(1.6, minVisibleHeight / scaledHeight) : 1
    const scale = baseScale * boost
    cloned.scale.setScalar(scale)
    cloned.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = Array.isArray(child.material) ? child.material.map((m) => m.clone()) : child.material.clone()
    })
    if (recolorTeal && clampedIndex === stages.length - 1) warmTealMaterials(cloned)
    return cloned
  }, [active, baseScale, targetMaxDim, recolorTeal, clampedIndex, stages.length])

  return <primitive object={model} />
}

// ── chloroplast ─────────────────────────────────────────────────────────────
function ChloroplastScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showInputs,
  peelMembrane,
  sugarRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showInputs: boolean
  peelMembrane: boolean
  sugarRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const membraneOpacity = peelMembrane || xray ? 0.1 : 0.3
  const photons = (t: number) => [-2.2 + t * 1.7, 0.55 + Math.sin(t * 3) * 0.15, 0.3] as [number, number, number]
  const food = (t: number) => [0.62 + t * 1.3, -0.45 - Math.sin(t * 2.4) * 0.1, 0.35] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* outer membrane shell */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('cp-outer') }}>
        <mesh scale={[1.05, 0.6, 0.4]}>
          <sphereGeometry args={[0.78, 32, 32]} />
          <meshStandardMaterial color={GREEN_SOFT} roughness={0.35} transparent opacity={membraneOpacity} side={2} />
        </mesh>
        <mesh scale={[1.0, 0.55, 0.36]}>
          <sphereGeometry args={[0.78, 24, 24]} />
          <meshStandardMaterial color={GREEN_PALE} roughness={0.5} transparent opacity={0.55} />
        </mesh>
      </group>

      {/* grana stacks */}
      {[[-0.32, 0.05, 0], [0.08, -0.02, 0], [0.42, 0.12, 0]].map((center, stackIndex) => (
        <group key={stackIndex} onClick={(event) => { event.stopPropagation(); onSelectPart('cp-grana') }}>
          {Array.from({ length: 3 }, (_, disc) => (
            <mesh key={disc} position={[center[0], center[1] + (disc - 1) * 0.09, center[2]]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.17, 0.17, 0.05, 18]} />
              <meshStandardMaterial color={GREEN_DEEP} roughness={0.6} transparent={dim('cp-grana')} opacity={dim('cp-grana') ? 0.25 : 1} />
            </mesh>
          ))}
        </group>
      ))}

      {/* chlorophyll flecks */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('cp-chlorophyll') }}>
        {[[-0.5, 0.32, 0.12], [-0.18, 0.28, 0.15], [0.3, 0.38, 0.1], [-0.45, -0.28, 0.12], [0.25, -0.25, 0.14], [0.55, 0.28, 0.08]].map((position, index) => (
          <mesh key={index} position={position as [number, number, number]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color="#8FBF56" emissive="#8FBF56" emissiveIntensity={dim('cp-chlorophyll') ? 0.15 : 0.15 + sugarRate * 0.55} transparent={dim('cp-chlorophyll')} opacity={dim('cp-chlorophyll') ? 0.25 : 1} />
          </mesh>
        ))}
      </group>

      {/* inputs: sunlight rays + water/CO2 */}
      {showInputs && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('cp-inputs') }}>
          <Line points={[[-2.1, 0.9, 0], [-1.05, 0.42, 0.1]]} color={GOLD} lineWidth={2.5} transparent opacity={0.8} />
          <Line points={[[-2.1, 0.3, 0.2], [-1.05, 0.2, 0.12]]} color={BLUE_SOFT} lineWidth={2.5} transparent opacity={0.7} />
          <Line points={[[-2.1, -0.2, 0.1], [-1.05, -0.05, 0.1]]} color="#8FA3A8" lineWidth={2.5} transparent opacity={0.7} />
          <Flow path={photons} color={GOLD} progress={progress} count={5} size={0.05} />
          {labelsVisible && (
            <>
              <ChipLabel text="sunlight" position={[-1.95, 1.05, 0.3]} color="#A8892D" />
              <ChipLabel text="water" position={[-1.95, 0.5, 0.3]} color={BLUE} />
              <ChipLabel text="CO₂" position={[-1.95, -0.05, 0.3]} color="#6B7B80" />
            </>
          )}
        </group>
      )}

      {/* output: sugar + oxygen */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('cp-output') }}>
        <Line points={[[0.82, -0.35, 0.15], [2.0, -0.55, 0.2]]} color={GREEN_DEEP} lineWidth={2.5} transparent opacity={0.85} />
        <Arrow from={[0.82, -0.35, 0.15]} to={[2.0, -0.55, 0.2]} color={GREEN_DEEP} dim={dim('cp-output')} />
        <Flow path={food} color={GREEN_DEEP} progress={progress} count={Math.round(2 + sugarRate * 6)} size={0.055} />
        {labelsVisible && <ChipLabel text={`sugar + O₂ out — ${sugarOutputLabel(sugarRate)}`} position={[1.75, -0.82, 0.3]} color={GREEN_DEEP} />}
      </group>

      {labelsVisible && (
        <>
          <ChipLabel text="outer membrane" position={[0, 0.78, 0.4]} color={GREEN_SOFT} />
          <ChipLabel text="stroma (fluid)" position={[-0.78, -0.35, 0.3]} color="#5C8A5E" />
          <ChipLabel text="grana — disc stacks" position={[0.62, 0.5, 0.3]} color={GREEN_DEEP} />
          <ChipLabel text="sunlight + water + CO₂ → sugar + O₂" position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
        </>
      )}
    </group>
  )
}

// ── flower ──────────────────────────────────────────────────────────────────
function FlowerGrowthScene({ index, labelsVisible, onError }: { index: number; labelsVisible: boolean; onError: () => void }) {
  const stages = growthStageModels.flower
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -1.05, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 1.6]} />
        <meshStandardMaterial color="#D8C6A6" roughness={0.95} transparent opacity={0.6} />
      </mesh>
      <group position={[0, -1.05, 0]}>
        <GrowthStageErrorBoundary onError={onError}>
          <Suspense fallback={<GrowthStageLoading label="flower" />}>
            <GrowthStageModelView stages={stages} index={index} targetMaxDim={2.2} recolorTeal />
          </Suspense>
        </GrowthStageErrorBoundary>
      </group>
      {labelsVisible && (
        <>
          <ChipLabel text={`Real 3D model — ${stages[Math.min(index, stages.length - 1)]?.label ?? ''} (flower growth sequence, 3 stages)`} position={[0, 2.1, 0.3]} color={GREEN_DEEP} />
          <ChipLabel text="Stylized reference model — not a labeled botanical stage" position={[0, -1.9, 0.35]} color={AMBER} />
        </>
      )}
    </group>
  )
}

function FlowerScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showPollenPath,
  pollinated,
  seedProgress,
  showRealGrowth,
  growthStageIndex,
  onGrowthError,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showPollenPath: boolean
  pollinated: boolean
  seedProgress: number
  showRealGrowth: boolean
  growthStageIndex: number
  onGrowthError: () => void
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const petalOpacity = xray ? 0.15 : 1
  if (showRealGrowth) {
    return <FlowerGrowthScene index={growthStageIndex} labelsVisible={labelsVisible} onError={onGrowthError} />
  }
  const pollen = (t: number) => {
    const base: [number, number, number] = [0.42, 1.62, 0]
    const target: [number, number, number] = [0, 1.38, 0.08]
    return [
      base[0] + (target[0] - base[0]) * t,
      base[1] + (target[1] - base[1]) * t + Math.sin(t * Math.PI) * 0.16,
      base[2] + (target[2] - base[2]) * t,
    ] as [number, number, number]
  }
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* stem + receptacle */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fl-pistil') }}>
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.09, 0.12, 1.3, 12]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.12, 0]}>
          <sphereGeometry args={[0.28, 20, 20]} />
          <meshStandardMaterial color={GREEN_SOFT} roughness={0.6} />
        </mesh>
      </group>

      {/* petals */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fl-petal') }}>
        {[0, 1, 2, 3, 4, 5].map((index) => {
          const angle = (index / 6) * Math.PI * 2
          return (
            <group key={index} position={[Math.cos(angle) * 0.52, 0.12, Math.sin(angle) * 0.52]} rotation={[Math.sin(angle) * 0.5, 0, -Math.cos(angle) * 0.5]}>
              <mesh scale={[1, 1.55, 0.35]}>
                <sphereGeometry args={[0.24, 16, 16]} />
                <meshStandardMaterial color={PINK} roughness={0.45} transparent={xray} opacity={petalOpacity} />
              </mesh>
            </group>
          )
        })}
      </group>

      {/* stamen: filament + anther */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fl-stamen') }}>
        <mesh position={[0.42, 0.85, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.03, 0.035, 0.85, 10]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.6} />
        </mesh>
        <mesh position={[0.42, 1.3, 0]}>
          <capsuleGeometry args={[0.075, 0.18, 6, 10]} />
          <meshStandardMaterial color={GOLD} roughness={0.5} transparent={dim('fl-anther')} opacity={dim('fl-anther') ? 0.25 : 1} />
        </mesh>
      </group>
      <Marker position={[0.42, 1.52, 0]} color={GOLD} label={labelsVisible ? 'anther (pollen)' : undefined} onSelect={() => onSelectPart('fl-anther')} dim={dim('fl-anther')} />

      {/* pistil: stigma + style + ovary */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fl-pistil') }}>
        <mesh position={[0, 0.72, 0]}>
          <cylinderGeometry args={[0.045, 0.06, 1.05, 10]} />
          <meshStandardMaterial color={GREEN_SOFT} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.28, 0]} scale={[0.55, 0.7, 0.55]}>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <sphereGeometry args={[0.24, 18, 18]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.5} transparent={dim('fl-ovary')} opacity={dim('fl-ovary') ? 0.3 : 1} />
        </mesh>
      </group>
      <Marker position={[0, 1.42, 0.24]} color={GREEN_DEEP} label={labelsVisible ? 'stigma (catches pollen)' : undefined} onSelect={() => onSelectPart('fl-pistil')} dim={dim('fl-pistil')} />
      <Marker position={[0, -0.25, 0.3]} color={GREEN_LEAF} label={labelsVisible ? 'ovary — seed forms here' : undefined} onSelect={() => onSelectPart('fl-ovary')} dim={dim('fl-ovary')} />

      {/* pollen transfer — only once a pollinator has visited */}
      {showPollenPath && pollinated && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('fl-pollen') }}>
          <Line points={[[0.42, 1.6, 0], [0, 1.45, 0.1]]} color={GOLD} lineWidth={1.5} transparent opacity={0.5} />
          <Flow path={pollen} color={GOLD} progress={progress} count={6} size={0.035} />
        </group>
      )}

      {/* seed forming in ovary — gated on pollination, not just time */}
      {seedProgress > 0.6 && (
        <mesh position={[0, 0.06, 0.18]}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial color={TAN} roughness={0.5} />
        </mesh>
      )}

      {labelsVisible && (
        <>
          <ChipLabel text="petal — attracts pollinators" position={[0.95, 0.42, 0.3]} color={PINK} />
          <ChipLabel text="stamen (male) — makes pollen" position={[-1.35, 1.05, 0.3]} color={GREEN_DEEP} />
          <ChipLabel text="pollen → stigma = pollination" position={[0, -1.9, 0.35]} color={AMBER} />
          <ChipLabel
            text={pollinated ? (seedProgress > 0.6 ? 'seed has formed in the ovary!' : 'pollen reaching the stigma…') : 'no pollinator yet — tap "Bee visits" below'}
            position={[0, 1.95, 0.3]}
            color={pollinated ? GREEN_DEEP : AMBER}
          />
        </>
      )}
    </group>
  )
}

// ── leaf ────────────────────────────────────────────────────────────────────
function LeafScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showInner,
  sugarRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showInner: boolean
  sugarRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const bladeOpacity = xray || showInner ? 0.28 : 1
  const stomataOpen = 0.55 + Math.sin(progress * Math.PI * 2) * 0.35
  const veins: [number, number, number][][] = [
    [[-0.15, 0, 0.1], [0.55, 0.32, 0.12]],
    [[-0.15, 0, 0.1], [0.62, 0.0, 0.1]],
    [[-0.15, 0, 0.1], [0.5, -0.34, 0.1]],
    [[-0.15, 0, 0.1], [0.35, 0.52, 0.08]],
    [[-0.15, 0, 0.1], [0.3, -0.55, 0.08]],
  ]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* petiole */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('lf-blade') }}>
        <mesh position={[-0.95, -0.5, 0.06]} rotation={[0, 0, 0.55]}>
          <cylinderGeometry args={[0.04, 0.06, 1.1, 10]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.6} />
        </mesh>
      </group>

      {/* blade */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('lf-blade') }}>
        <mesh position={[0.12, 0.05, 0.08]} scale={[1.05, 0.85, 0.32]} rotation={[-0.12, 0.3, 0.4]}>
          <sphereGeometry args={[0.85, 24, 24]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.55} transparent={xray || showInner} opacity={bladeOpacity} />
        </mesh>
      </group>

      {/* veins */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('lf-vein') }}>
        {veins.map((points, index) => (
          <Line key={index} points={points} color={BLUE_SOFT} lineWidth={2.2} transparent opacity={xray || showInner ? 0.95 : 0.55} />
        ))}
      </group>

      {/* chlorophyll flecks */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('lf-chlorophyll') }}>
        {[[-0.3, 0.35, 0.12], [-0.1, -0.28, 0.14], [0.2, 0.42, 0.1], [0.4, -0.12, 0.12], [0.05, 0.1, 0.18]].map((position, index) => (
          <mesh key={index} position={position as [number, number, number]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#8FBF56" emissive="#8FBF56" emissiveIntensity={dim('lf-chlorophyll') ? 0.15 : 0.15 + sugarRate * 0.55} transparent={dim('lf-chlorophyll')} opacity={dim('lf-chlorophyll') ? 0.25 : 1} />
          </mesh>
        ))}
      </group>

      {/* stomata on the surface */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('lf-stomata') }}>
        <mesh position={[0.05, -0.15, 0.27]} scale={[0.16 * stomataOpen, 0.09, 0.02]}>
          <sphereGeometry args={[1, 10, 10]} />
          <meshStandardMaterial color="#2E4630" roughness={0.4} transparent opacity={0.85} />
        </mesh>
        {/* gas arrows */}
        <Line points={[[-0.35, -0.3, 0.3], [-0.15, -0.22, 0.3]]} color="#8FA3A8" lineWidth={2} transparent opacity={0.6} />
        <Line points={[[0.28, -0.06, 0.3], [0.5, 0.02, 0.3]]} color={BLUE_SOFT} lineWidth={2} transparent opacity={0.6} />
        {labelsVisible && (
          <>
            <ChipLabel text="CO₂ in" position={[-0.42, -0.42, 0.35]} color="#6B7B80" />
            <ChipLabel text="O₂ out" position={[0.55, -0.1, 0.35]} color={BLUE} />
          </>
        )}
      </group>

      {labelsVisible && (
        <>
          <ChipLabel text="leaf blade — food factory" position={[-1.15, 0.62, 0.25]} color={GREEN_DEEP} />
          <ChipLabel text="veins — water in, food out" position={[1.15, 0.75, 0.2]} color={BLUE} />
          <ChipLabel text={`sunlight + water + CO₂ → sugar + O₂ — output ${sugarOutputLabel(sugarRate)}`} position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
        </>
      )}
    </group>
  )
}

// ── phloem ──────────────────────────────────────────────────────────────────
function PhloemScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showXylemContrast,
  sugarRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showXylemContrast: boolean
  sugarRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const sugar = (t: number) => [0.16, 1.55 - t * 3.0, 0.14] as [number, number, number]
  const sugarToSeed = (t: number) => [0.16 - t * 0.9, 0.1 + Math.sin(t * Math.PI) * 0.25, 0.12] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* xylem contrast column */}
      {showXylemContrast && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('ph-xylem') }}>
          <BeadTube points={[[-0.28, -1.35, -0.08], [-0.28, 0.1, -0.08], [-0.28, 1.55, -0.08]]} color={BLUE_SOFT} radius={0.055} dim={dim('ph-xylem')} />
        </group>
      )}

      {/* phloem column */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ph-tube') }}>
        <BeadTube points={[[0.16, -1.35, 0.12], [0.16, 0.1, 0.12], [0.16, 1.55, 0.12]]} color={GREEN_DEEP} radius={0.075} dim={dim('ph-tube')} opacity={xray ? 0.3 : 1} />
        <BeadTube points={[[0.16, 0.1, 0.12], [-0.6, 0.28, 0.1]]} color={GREEN_DEEP} radius={0.055} dim={dim('ph-tube')} />
      </group>

      {/* leaf source */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ph-source') }}>
        <mesh position={[0.05, 1.7, 0.08]} scale={[0.75, 0.45, 0.22]}>
          <sphereGeometry args={[0.55, 18, 18]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.55} transparent={dim('ph-source')} opacity={dim('ph-source') ? 0.3 : 1} />
        </mesh>
        <Marker position={[0.85, 1.78, 0.2]} color={GREEN_LEAF} label={labelsVisible ? 'leaf — food source' : undefined} onSelect={() => onSelectPart('ph-source')} dim={dim('ph-source')} />
      </group>

      {/* sinks */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ph-root-sink') }}>
        <mesh position={[0.2, -1.5, 0.05]} scale={[1.1, 0.5, 0.5]}>
          <sphereGeometry args={[0.45, 18, 18]} />
          <meshStandardMaterial color={SOIL} roughness={0.8} transparent={dim('ph-root-sink')} opacity={dim('ph-root-sink') ? 0.35 : 1} />
        </mesh>
        <Marker position={[1.05, -1.55, 0.2]} color={SOIL} label={labelsVisible ? 'root — sugar sink' : undefined} onSelect={() => onSelectPart('ph-root-sink')} dim={dim('ph-root-sink')} />
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ph-seed-sink') }}>
        <mesh position={[-0.75, 0.42, 0.06]} scale={[0.7, 0.45, 0.45]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color={TAN} roughness={0.6} transparent={dim('ph-seed-sink')} opacity={dim('ph-seed-sink') ? 0.4 : 1} />
        </mesh>
        <Marker position={[-1.25, 0.5, 0.18]} color={TAN} label={labelsVisible ? 'seed — sugar sink' : undefined} onSelect={() => onSelectPart('ph-seed-sink')} dim={dim('ph-seed-sink')} />
      </group>

      {/* sugar flow down + to seed — density tracks how much sugar photosynthesis is making */}
      <Flow path={sugar} color={GOLD} progress={progress} count={Math.round(2 + sugarRate * 7)} size={0.06} onSelect={() => onSelectPart('ph-tube')} dim={dim('ph-tube')} />
      <Flow path={sugarToSeed} color={GOLD} progress={progress} count={Math.round(1 + sugarRate * 4)} size={0.05} onSelect={() => onSelectPart('ph-seed-sink')} dim={dim('ph-seed-sink')} />

      {labelsVisible && (
        <>
          <ChipLabel text={`phloem — sugar from leaves to everywhere (${sugarOutputLabel(sugarRate)})`} position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
          {showXylemContrast && <ChipLabel text="xylem (water up)" position={[-0.85, 0.3, 0.1]} color={BLUE} />}
        </>
      )}
    </group>
  )
}

// ── root ────────────────────────────────────────────────────────────────────
function RootScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  peelSoil,
  flowRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  peelSoil: boolean
  flowRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const soilOpacity = peelSoil || xray ? 0.25 : 0.9
  const taproot: [number, number, number][] = [[0, 0.75, 0], [0, -0.3, 0], [0, -1.2, 0], [-0.15, -1.7, 0]]
  const laterals: [number, number, number][][] = [
    [[0, -0.5, 0], [0.55, -0.62, 0.05], [0.85, -0.8, 0.05]],
    [[0, -0.7, 0], [-0.6, -0.8, -0.05], [-0.9, -1.0, -0.02]],
    [[-0.05, -1.05, 0], [0.5, -1.12, 0.08], [0.8, -1.3, 0.1]],
    [[-0.08, -1.35, 0], [-0.5, -1.4, -0.1], [-0.75, -1.55, -0.08]],
  ]
  const water = (t: number) => [0, -1.75 + t * 2.15, 0.02] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* soil block */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-system') }}>
        <mesh position={[0, -0.85, 0]} scale={[1.7, 0.75, 1]}>
          <boxGeometry args={[1.9, 0.9, 0.5]} />
          <meshStandardMaterial color="#B99A72" roughness={0.95} transparent={peelSoil || xray} opacity={soilOpacity} />
        </mesh>
        <mesh position={[0, -0.42, 0]} scale={[1.7, 0.2, 1]}>
          <boxGeometry args={[1.9, 0.2, 0.5]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.8} transparent={peelSoil || xray} opacity={peelSoil || xray ? 0.2 : 0.9} />
        </mesh>
      </group>

      {/* taproot + laterals */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-system') }}>
        <BeadTube points={taproot} color={BARK} radius={0.08} dim={dim('rt-system')} />
        {laterals.map((points, index) => (
          <BeadTube key={index} points={points} color={BARK} radius={0.045} dim={dim('rt-system')} />
        ))}
      </group>

      {/* root cap */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-cap') }}>
        <mesh position={[-0.2, -1.78, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.12, 0.22, 10]} />
          <meshStandardMaterial color={GOLD} roughness={0.5} transparent={dim('rt-cap')} opacity={dim('rt-cap') ? 0.3 : 1} />
        </mesh>
        <Marker position={[-0.62, -1.8, 0.15]} color={GOLD} label={labelsVisible ? 'root cap' : undefined} onSelect={() => onSelectPart('rt-cap')} dim={dim('rt-cap')} />
      </group>

      {/* root hairs */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-hair') }}>
        {[[0.12, -0.45, 0.1], [-0.12, -0.55, -0.08], [0.16, -0.8, 0.08], [-0.16, -0.9, -0.05], [0.1, -1.05, 0.12]].map((position, index) => (
          <Line key={index} points={[position as [number, number, number], [position[0] + 0.28, position[1] - 0.02, position[2]]]} color="#C9A97A" lineWidth={1.2} transparent opacity={dim('rt-hair') ? 0.15 : 0.8} />
        ))}
        <Marker position={[0.85, -0.72, 0.15]} color="#C9A97A" label={labelsVisible ? 'root hairs — soak up water' : undefined} onSelect={() => onSelectPart('rt-hair')} dim={dim('rt-hair')} />
      </group>

      {/* xylem core + rising water */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-xylem') }}>
        <BeadTube points={[[0, 0.78, 0.04], [0, -1.55, 0.04]]} color={BLUE_SOFT} radius={0.035} dim={dim('rt-xylem')} />
        <Flow path={water} color={BLUE} progress={progress} count={Math.round(2 + flowRate * 7)} size={0.05} dim={dim('rt-xylem')} />
        {labelsVisible && <ChipLabel text={`xylem — water rides up (${waterFlowLabel(flowRate * 100)})`} position={[0.55, 0.5, 0.2]} color={BLUE} />}
      </group>

      {/* food storage */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('rt-store') }}>
        <mesh position={[0.32, -0.42, 0.1]} scale={[0.85, 0.6, 0.5]}>
          <sphereGeometry args={[0.24, 14, 14]} />
          <meshStandardMaterial color={TAN} roughness={0.6} transparent={dim('rt-store')} opacity={dim('rt-store') ? 0.4 : 1} />
        </mesh>
        <Marker position={[0.75, -0.38, 0.2]} color={TAN} label={labelsVisible ? 'storage — extra sugar' : undefined} onSelect={() => onSelectPart('rt-store')} dim={dim('rt-store')} />
      </group>

      {labelsVisible && (
        <ChipLabel text="roots anchor the plant and soak up water + minerals" position={[0, -1.95, 0.35]} color={SOIL} />
      )}
    </group>
  )
}

// ── seed ────────────────────────────────────────────────────────────────────
function CornGrowthScene({ index, labelsVisible, onError }: { index: number; labelsVisible: boolean; onError: () => void }) {
  const stages = growthStageModels.seed
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -1.05, -0.05]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 1.6]} />
        <meshStandardMaterial color="#D8C6A6" roughness={0.95} transparent opacity={0.6} />
      </mesh>
      <group position={[0, -1.05, 0]}>
        <GrowthStageErrorBoundary onError={onError}>
          <Suspense fallback={<GrowthStageLoading label="corn" />}>
            <GrowthStageModelView stages={stages} index={index} targetMaxDim={2.6} />
          </Suspense>
        </GrowthStageErrorBoundary>
      </group>
      {labelsVisible && (
        <>
          <ChipLabel text={`Real 3D model — ${stages[Math.min(index, stages.length - 1)]?.label ?? ''} (corn growth sequence, 4 stages)`} position={[0, 2.3, 0.3]} color={GREEN_DEEP} />
          <ChipLabel text="Stylized reference model — not a labeled botanical stage" position={[0, -1.9, 0.35]} color={AMBER} />
        </>
      )}
    </group>
  )
}

function SeedScene({
  germination,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  light,
  stallReason,
  showRealGrowth,
  growthStageIndex,
  onGrowthError,
}: {
  germination: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  light: boolean
  stallReason: string | null
  showRealGrowth: boolean
  growthStageIndex: number
  onGrowthError: () => void
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  if (showRealGrowth) {
    return <CornGrowthScene index={growthStageIndex} labelsVisible={labelsVisible} onError={onGrowthError} />
  }
  const rootGrowth = Math.min(1, germination / 0.42)
  const shootGrowth = Math.max(0, Math.min(1, (germination - 0.26) / 0.52))
  const leavesScale = Math.max(0, Math.min(1, (germination - 0.62) / 0.32))
  const sproutHeight = shootGrowth * 1.25
  const rootLength = rootGrowth * 0.9
  const coatSplit = Math.max(0, Math.min(1, (germination - 0.16) / 0.42))
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, -0.52, -0.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.6, 1.45]} />
        <meshStandardMaterial color="#D8C6A6" roughness={0.95} transparent opacity={0.58} />
      </mesh>

      {/* seed coat (cutaway) */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-coat') }}>
        <mesh position={[-0.12 - coatSplit * 0.22, 0, 0]} scale={[0.82, 0.95, 0.85]}>
          <sphereGeometry args={[0.52, 24, 24]} />
          <meshStandardMaterial color={TAN} roughness={0.5} transparent opacity={xray ? 0.18 : 0.5} />
        </mesh>
        <mesh position={[0.12 + coatSplit * 0.22, 0, 0]} scale={[0.82, 0.95, 0.85]}>
          <sphereGeometry args={[0.52, 24, 24]} />
          <meshStandardMaterial color={TAN} roughness={0.5} transparent opacity={xray ? 0.18 : 0.5} />
        </mesh>
        {coatSplit > 0.05 && (
          <Line
            points={[[-0.04, -0.45, 0.32], [0.04, -0.18, 0.35], [-0.02, 0.08, 0.35], [0.05, 0.34, 0.32]]}
            color={SOIL}
            lineWidth={2}
          />
        )}
      </group>

      {/* stored food */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-food') }}>
        <mesh scale={[1.1, 0.72, 0.7]}>
          <sphereGeometry args={[0.42, 20, 20]} />
          <meshStandardMaterial color={CREAM} roughness={0.7} transparent={dim('sd-food')} opacity={dim('sd-food') ? 0.3 : 0.95} />
        </mesh>
        <Marker position={[-0.85, 0.05, 0.25]} color={CREAM} label={labelsVisible ? 'stored food' : undefined} onSelect={() => onSelectPart('sd-food')} dim={dim('sd-food')} />
      </group>

      {/* embryo */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-embryo') }}>
        <mesh position={[0.05, 0.02, 0.05]} scale={[0.35, 0.7, 0.3]}>
          <sphereGeometry args={[0.3, 14, 14]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.5} transparent={dim('sd-embryo')} opacity={dim('sd-embryo') ? 0.3 : 1} />
        </mesh>
        <Marker position={[0.62, 0.3, 0.2]} color={GREEN_LEAF} label={labelsVisible ? 'embryo — baby plant' : undefined} onSelect={() => onSelectPart('sd-embryo')} dim={dim('sd-embryo')} />
      </group>

      {/* first root */}
      {rootGrowth > 0.05 && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-root') }}>
          <mesh position={[0.02, -0.18 - rootLength / 2, 0.06]} rotation={[0.08, 0, 0.08]}>
            <cylinderGeometry args={[0.028, 0.044, rootLength, 8]} />
            <meshStandardMaterial color={CREAM} roughness={0.78} transparent={dim('sd-root')} opacity={dim('sd-root') ? 0.3 : 1} />
          </mesh>
          {[0.22, 0.42, 0.62].map((y, index) => (
            rootGrowth > y && (
              <mesh key={y} position={[index % 2 === 0 ? -0.1 : 0.13, -0.25 - y * 0.85, 0.06]} rotation={[0, 0, index % 2 === 0 ? 0.9 : -0.9]}>
                <cylinderGeometry args={[0.008, 0.012, 0.25, 6]} />
                <meshStandardMaterial color={CREAM} roughness={0.8} transparent opacity={dim('sd-root') ? 0.25 : 0.8} />
              </mesh>
            )
          ))}
          <Marker position={[0.45, -0.28 - rootLength, 0.18]} color={CREAM} label={labelsVisible ? 'root grows first' : undefined} onSelect={() => onSelectPart('sd-root')} dim={dim('sd-root')} />
        </group>
      )}

      {/* shoot */}
      {shootGrowth > 0.02 && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-sprout') }}>
          <mesh position={[0.05, 0.25 + sproutHeight / 2, 0.05]}>
            <cylinderGeometry args={[0.035, 0.05, sproutHeight, 8]} />
            <meshStandardMaterial color={GREEN_DEEP} roughness={0.6} transparent={dim('sd-sprout')} opacity={dim('sd-sprout') ? 0.3 : 1} />
          </mesh>
          {leavesScale > 0 && (
            <>
              <mesh position={[0.05 - 0.16 * leavesScale, 0.3 + sproutHeight, 0.05]} rotation={[0, 0, -0.7]} scale={[1, leavesScale, 1]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial color={light ? GREEN_LEAF : '#C9C27A'} roughness={0.5} />
              </mesh>
              <mesh position={[0.05 + 0.16 * leavesScale, 0.3 + sproutHeight, 0.05]} rotation={[0, 0, 0.7]} scale={[1, leavesScale, 1]}>
                <sphereGeometry args={[0.12, 12, 12]} />
                <meshStandardMaterial color={light ? GREEN_LEAF : '#C9C27A'} roughness={0.5} />
              </mesh>
              {!light && labelsVisible && (
                <ChipLabel text="pale leaves — no light to turn green yet" position={[0.75, 0.55 + sproutHeight, 0.2]} color={AMBER} />
              )}
            </>
          )}
          <Marker position={[0.62, 0.5 + sproutHeight, 0.15]} color={GREEN_DEEP} label={labelsVisible ? 'sprout — germination' : undefined} onSelect={() => onSelectPart('sd-sprout')} dim={dim('sd-sprout')} />
          {germination >= 0.98 && (
            <group onClick={(event) => { event.stopPropagation(); onSelectPart('sd-bud') }}>
              <mesh position={[0.05, 0.42 + sproutHeight, 0.05]}>
                <sphereGeometry args={[0.09, 12, 12]} />
                <meshStandardMaterial color={PINK} roughness={0.4} transparent={dim('sd-bud')} opacity={dim('sd-bud') ? 0.3 : 1} />
              </mesh>
              <Marker position={[0.62, 0.62 + sproutHeight, 0.18]} color={PINK} label={labelsVisible ? 'bud — grows into a flower' : undefined} onSelect={() => onSelectPart('sd-bud')} dim={dim('sd-bud')} />
            </group>
          )}
        </group>
      )}

      {stallReason && (
        <ChipLabel text={`stalled — ${stallReason}`} position={[0, 2.15, 0.35]} color={AMBER} />
      )}

      {labelsVisible && (
        <>
          <ChipLabel text="seed coat — protective shell" position={[-0.4, -0.68, 0.2]} color={TAN} />
          <ChipLabel text={`${seedStage(germination)} — ${seedObservation(germination)}`} position={[0, 1.78, 0.35]} color={GREEN_DEEP} />
          <ChipLabel text="seed = baby plant + lunchbox in a coat" position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
        </>
      )}
    </group>
  )
}

// ── stem ────────────────────────────────────────────────────────────────────
function StemScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showCrossSection,
  flowRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showCrossSection: boolean
  flowRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const stemOpacity = xray ? 0.3 : 1
  const waterUp = (t: number) => [-0.06, -1.5 + t * 3.0, 0] as [number, number, number]
  const foodDown = (t: number) => [0.12, 1.5 - t * 3.0, 0.02] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* stem column */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('st-node') }}>
        <mesh position={[0.03, 0, 0]}>
          <cylinderGeometry args={[0.22, 0.26, 3.1, 14]} />
          <meshStandardMaterial color={GREEN_SOFT} roughness={0.6} transparent={xray} opacity={stemOpacity} />
        </mesh>
      </group>

      {/* nodes */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('st-node') }}>
        {[-1.1, -0.3, 0.5, 1.3].map((y) => (
          <mesh key={y} position={[0.03, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.235, 0.03, 8, 20]} />
            <meshStandardMaterial color={GREEN_DEEP} roughness={0.5} transparent={dim('st-node')} opacity={dim('st-node') ? 0.3 : 1} />
          </mesh>
        ))}
      </group>

      {/* xylem core (water up) */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('st-xylem') }}>
        <BeadTube points={[[-0.06, -1.5, 0], [-0.06, 1.5, 0]]} color={BLUE_SOFT} radius={0.045} dim={dim('st-xylem')} opacity={xray ? 0.9 : 0.75} />
        <Flow path={waterUp} color={BLUE} progress={progress} count={Math.round(2 + flowRate * 7)} size={0.05} dim={dim('st-xylem')} />
      </group>

      {/* phloem ring (food down) */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('st-phloem') }}>
        <BeadTube points={[[0.12, -1.5, 0.02], [0.12, 1.5, 0.02]]} color={GREEN_DEEP} radius={0.05} dim={dim('st-phloem')} />
        <Flow path={foodDown} color={GOLD} progress={progress} count={6} size={0.05} dim={dim('st-phloem')} />
      </group>

      {/* attached leaf */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('st-leaf') }}>
        <mesh position={[0.28, 0.5, 0.1]} rotation={[0.2, -0.5, 0.9]} scale={[1.1, 0.55, 0.25]}>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.55} transparent={dim('st-leaf')} opacity={dim('st-leaf') ? 0.3 : 1} />
        </mesh>
        <Marker position={[0.95, 0.68, 0.2]} color={GREEN_LEAF} label={labelsVisible ? 'attached leaf' : undefined} onSelect={() => onSelectPart('st-leaf')} dim={dim('st-leaf')} />
      </group>

      {/* cross-section ring */}
      {showCrossSection && (
        <group position={[-0.7, 0, 0.05]} onClick={(event) => { event.stopPropagation(); onSelectPart('st-node') }}>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.42, 0.09, 10, 26]} />
            <meshStandardMaterial color={GREEN_SOFT} roughness={0.5} transparent opacity={0.9} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.27, 0.07, 10, 24]} />
            <meshStandardMaterial color={BLUE_SOFT} roughness={0.5} transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.12, 10]} />
            <meshStandardMaterial color={GREEN_DEEP} roughness={0.5} />
          </mesh>
          {labelsVisible && (
            <>
              <ChipLabel text="xylem inside" position={[-0.2, 0.62, 0.05]} color={BLUE} />
              <ChipLabel text="phloem outside" position={[-0.62, 0.62, 0.05]} color={GREEN_DEEP} />
            </>
          )}
        </group>
      )}

      <Marker position={[0.03, -1.45, 0.25]} color={GREEN_DEEP} label={labelsVisible ? 'node' : undefined} onSelect={() => onSelectPart('st-node')} dim={dim('st-node')} />

      {labelsVisible && (
        <ChipLabel text={`stem: water up (xylem, ${waterFlowLabel(flowRate * 100)}) · food down (phloem)`} position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
      )}
    </group>
  )
}

// ── stomata ─────────────────────────────────────────────────────────────────
function StomataScene({
  progress,
  turgor,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
}: {
  progress: number
  turgor: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const openness = Math.max(0.08, turgor)
  const wilting = turgor < 0.18
  const co2 = (t: number) => [-0.75 - t * 0.85, 0.25 - Math.sin(t * 3) * 0.06, 0.3] as [number, number, number]
  const o2 = (t: number) => [0.75 + t * 0.85, -0.3 + Math.sin(t * 3) * 0.06, 0.3] as [number, number, number]
  const h2o = (t: number) => [0.15 + Math.sin(t * 2) * 0.4, 0.7 - t * 0.75, 0.3] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* leaf surface */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('leaf-surface') }}>
        <mesh position={[0, 0, 0.05]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[3.4, 3]} />
          <meshStandardMaterial color={wilting ? '#C9B36B' : GREEN_PALE} roughness={0.9} transparent opacity={xray ? 0.25 : 0.95} />
        </mesh>
      </group>

      {/* guard cells — kidney pair */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('guard-cells') }}>
        <mesh position={[-openness * 0.16, 0, 0.09]} scale={[0.9, 1, 0.4]} rotation={[0, 0, 0.35]}>
          <sphereGeometry args={[0.28, 18, 18]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.45} transparent={dim('guard-cells')} opacity={dim('guard-cells') ? 0.3 : 1} />
        </mesh>
        <mesh position={[openness * 0.16, 0, 0.09]} scale={[0.9, 1, 0.4]} rotation={[0, 0, -0.35]}>
          <sphereGeometry args={[0.28, 18, 18]} />
          <meshStandardMaterial color={GREEN_DEEP} roughness={0.45} transparent={dim('guard-cells')} opacity={dim('guard-cells') ? 0.3 : 1} />
        </mesh>
        <Marker position={[0.72, 0.62, 0.2]} color={GREEN_DEEP} label={labelsVisible ? 'guard cells' : undefined} onSelect={() => onSelectPart('guard-cells')} dim={dim('guard-cells')} />
      </group>

      {/* pore */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('stoma-pore') }}>
        <mesh position={[0, 0, 0.1]} scale={[openness, 1.4, 0.05]}>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#2E4630" roughness={0.4} transparent={dim('stoma-pore')} opacity={dim('stoma-pore') ? 0.3 : 0.95} />
        </mesh>
        <Marker position={[-0.75, 0.15, 0.2]} color="#2E4630" label={labelsVisible ? 'stoma pore' : undefined} onSelect={() => onSelectPart('stoma-pore')} dim={dim('stoma-pore')} />
      </group>

      {/* gas + water flows */}
      {openness > 0.2 && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('gas-flow') }}>
          <Line points={[[-0.75, 0.25, 0.25], [-1.55, 0.35, 0.25]]} color="#8FA3A8" lineWidth={2} transparent opacity={0.65} />
          <Line points={[[0.75, -0.3, 0.25], [1.55, -0.4, 0.25]]} color={BLUE_SOFT} lineWidth={2} transparent opacity={0.65} />
          <Flow path={co2} color="#8FA3A8" progress={progress} count={5} size={0.045} dim={dim('gas-flow')} />
          <Flow path={o2} color={BLUE_SOFT} progress={progress} count={5} size={0.045} dim={dim('gas-flow')} />
          <Flow path={h2o} color="#7FB2D9" progress={progress} count={4} size={0.04} dim={dim('gas-flow')} />
          {labelsVisible && (
            <>
              <ChipLabel text="CO₂ in" position={[-1.45, 0.5, 0.3]} color="#6B7B80" />
              <ChipLabel text="O₂ out" position={[1.45, -0.55, 0.3]} color={BLUE} />
              <ChipLabel text="H₂O escapes (why plants close up when dry)" position={[0.05, 0.85, 0.3]} color="#5A86B0" />
            </>
          )}
        </group>
      )}

      {wilting && (
        <ChipLabel text="wilting — too little water, the pore stays shut to save what's left" position={[0, 1.15, 0.32]} color={AMBER} />
      )}

      {labelsVisible && (
        <ChipLabel text="guard cells swell with water → pore opens; dry → pore closes" position={[0, -1.9, 0.35]} color={GREEN_DEEP} />
      )}
    </group>
  )
}

// ── xylem ───────────────────────────────────────────────────────────────────
function XylemScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showOuterWall,
  flowRate,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showOuterWall: boolean
  flowRate: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const water = (t: number) => [0, -1.6 + t * 3.3, 0.02] as [number, number, number]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* outer wall */}
      {showOuterWall && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('xy-tubelet') }}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.36, 3.2, 16, 1, true]} />
            <meshStandardMaterial color={GREEN_SOFT} roughness={0.6} transparent opacity={xray ? 0.2 : 0.5} side={2} />
          </mesh>
        </group>
      )}

      {/* inner tube rings */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('xy-tubelet') }}>
        {[-1.35, -0.8, -0.25, 0.3, 0.85, 1.4].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.035, 8, 20]} />
            <meshStandardMaterial color="#8FA9C9" roughness={0.5} transparent={dim('xy-tubelet')} opacity={dim('xy-tubelet') ? 0.3 : 0.85} />
          </mesh>
        ))}
      </group>

      {/* rising water */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('xy-tubelet') }}>
        <Flow path={water} color={BLUE} progress={progress} count={Math.round(3 + flowRate * 6)} size={0.06} dim={dim('xy-tubelet')} />
      </group>

      {/* root entry */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('xy-root') }}>
        <mesh position={[0, -1.72, 0]} scale={[1.2, 0.35, 0.8]}>
          <sphereGeometry args={[0.42, 16, 16]} />
          <meshStandardMaterial color={SOIL} roughness={0.85} transparent={dim('xy-root')} opacity={dim('xy-root') ? 0.35 : 1} />
        </mesh>
        <Marker position={[0.8, -1.78, 0.15]} color={SOIL} label={labelsVisible ? 'roots — water enters' : undefined} onSelect={() => onSelectPart('xy-root')} dim={dim('xy-root')} />
      </group>

      {/* leaf end */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('xy-leaf') }}>
        <mesh position={[0.15, 1.72, 0.05]} scale={[0.8, 0.4, 0.2]} rotation={[0.1, 0.4, 0.6]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshStandardMaterial color={GREEN_LEAF} roughness={0.55} transparent={dim('xy-leaf')} opacity={dim('xy-leaf') ? 0.35 : 1} />
        </mesh>
        <Marker position={[0.85, 1.75, 0.2]} color={GREEN_LEAF} label={labelsVisible ? 'leaf — water arrives' : undefined} onSelect={() => onSelectPart('xy-leaf')} dim={dim('xy-leaf')} />
      </group>

      {labelsVisible && (
        <ChipLabel text={`xylem: water + minerals, one direction — root → leaf (${waterFlowLabel(flowRate * 100)})`} position={[0, -1.9, 0.35]} color={BLUE} />
      )}
    </group>
  )
}

// ── scene router ────────────────────────────────────────────────────────────
type PlantsSceneProps = {
  activeId: string
  selectedPart: string | null
  onSelectPart: (part: string) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  flowProgress: number
  germination: number
  turgor: number
  toggles: Record<string, boolean>
  onAnimationTick: (delta: number) => void
  sugarRate: number
  waterFlowRate: number
  seedLight: boolean
  seedStallReason: string | null
  pollinated: boolean
  pollinationProgress: number
  showCornGrowth: boolean
  cornStageIndex: number
  onCornGrowthError: () => void
  showFlowerGrowth: boolean
  flowerStageIndex: number
  onFlowerGrowthError: () => void
}

/** Looping flow progress driver — one cycle per ~12s while Play is on. */
function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  const accumulated = useRef(0)
  useFrame((_, delta) => {
    if (!playing) {
      accumulated.current = 0
      return
    }
    accumulated.current += delta
    const steps = Math.floor(accumulated.current / 0.1)
    if (steps > 0) {
      accumulated.current -= steps * 0.1
      onTick(steps * 0.1)
    }
  })
  return null
}

function PlantsScene(props: PlantsSceneProps) {
  const { activeId, autoRotate, labelsVisible, cameraDistance, flowProgress, germination, turgor, toggles, sugarRate, waterFlowRate, seedLight, seedStallReason, pollinated, pollinationProgress } = props
  const tick = useMemo(() => props.onAnimationTick, [props.onAnimationTick])
  return (
    <Canvas camera={{ position: [0, 0.35, cameraDistance], fov: 38 }} dpr={[1, 2]} onPointerMissed={() => props.onSelectPart('none')}>
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={1.15} />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.65} minDistance={5.8} maxDistance={11} />
      <AnimationDriver playing={props.animationPlaying} onTick={tick} />
      <ResponsivePlantsGroup>
        {activeId === 'chloroplast' && <ChloroplastScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showInputs={toggles['cp-inputs'] !== false} peelMembrane={toggles['cp-peel'] === true} sugarRate={sugarRate} />}
        {activeId === 'flower' && <FlowerScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showPollenPath={toggles['fl-pollen'] !== false} pollinated={pollinated} seedProgress={pollinationProgress} showRealGrowth={props.showFlowerGrowth} growthStageIndex={props.flowerStageIndex} onGrowthError={props.onFlowerGrowthError} />}
        {activeId === 'leaf' && <LeafScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showInner={toggles['lf-inner'] === true} sugarRate={sugarRate} />}
        {activeId === 'phloem' && <PhloemScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showXylemContrast={toggles['ph-xylem'] !== false} sugarRate={sugarRate} />}
        {activeId === 'root' && <RootScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} peelSoil={toggles['rt-soil'] === true} flowRate={waterFlowRate} />}
        {activeId === 'seed' && <SeedScene germination={germination} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} light={seedLight} stallReason={seedStallReason} showRealGrowth={props.showCornGrowth} growthStageIndex={props.cornStageIndex} onGrowthError={props.onCornGrowthError} />}
        {activeId === 'stem' && <StemScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showCrossSection={toggles['st-section'] !== false} flowRate={waterFlowRate} />}
        {activeId === 'stomata' && <StomataScene progress={flowProgress} turgor={turgor} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} />}
        {activeId === 'xylem' && <XylemScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showOuterWall={toggles['xy-wall'] !== false} flowRate={waterFlowRate} />}
      </ResponsivePlantsGroup>
    </Canvas>
  )
}

function ResponsivePlantsGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.52 : viewport.aspect < 1 ? 0.72 : 1
  return <group scale={scale}>{children}</group>
}

// ── primary lab ─────────────────────────────────────────────────────────────
type LabPart = string

const PART_META: Record<LabPart, { label: string; color: string }> = {
  'cp-outer': { label: 'Outer membrane', color: GREEN_SOFT },
  'cp-stroma': { label: 'Stroma (fluid)', color: '#5C8A5E' },
  'cp-grana': { label: 'Grana (disc stacks)', color: GREEN_DEEP },
  'cp-chlorophyll': { label: 'Chlorophyll', color: '#8FBF56' },
  'cp-output': { label: 'Food + oxygen out', color: GREEN_DEEP },
  'cp-inputs': { label: 'Sunlight + water + CO₂ in', color: GOLD },
  'fl-petal': { label: 'Petal', color: PINK },
  'fl-stamen': { label: 'Stamen', color: GREEN_DEEP },
  'fl-anther': { label: 'Anther', color: GOLD },
  'fl-pistil': { label: 'Pistil', color: GREEN_SOFT },
  'fl-ovary': { label: 'Ovary (seed base)', color: GREEN_LEAF },
  'fl-pollen': { label: 'Pollen path', color: GOLD },
  'lf-blade': { label: 'Leaf blade', color: GREEN_LEAF },
  'lf-vein': { label: 'Vein', color: BLUE_SOFT },
  'lf-chlorophyll': { label: 'Chlorophyll', color: '#8FBF56' },
  'lf-stomata': { label: 'Stomata pore', color: '#2E4630' },
  'ph-tube': { label: 'Phloem tube', color: GREEN_DEEP },
  'ph-xylem': { label: 'Xylem (contrast)', color: BLUE_SOFT },
  'ph-source': { label: 'Leaf food source', color: GREEN_LEAF },
  'ph-root-sink': { label: 'Root sink', color: SOIL },
  'ph-seed-sink': { label: 'Seed sink', color: TAN },
  'rt-system': { label: 'Root system', color: BARK },
  'rt-cap': { label: 'Root cap', color: GOLD },
  'rt-hair': { label: 'Root hairs', color: '#C9A97A' },
  'rt-xylem': { label: 'Xylem tubes', color: BLUE_SOFT },
  'rt-store': { label: 'Food storage', color: TAN },
  'sd-coat': { label: 'Seed coat', color: TAN },
  'sd-embryo': { label: 'Embryo', color: GREEN_LEAF },
  'sd-food': { label: 'Stored food', color: CREAM },
  'sd-root': { label: 'First root', color: CREAM },
  'sd-sprout': { label: 'Sprout', color: GREEN_DEEP },
  'sd-bud': { label: 'Flower bud', color: PINK },
  'st-xylem': { label: 'Xylem (water tube)', color: BLUE_SOFT },
  'st-phloem': { label: 'Phloem (food tube)', color: GREEN_DEEP },
  'st-node': { label: 'Node', color: GREEN_DEEP },
  'st-leaf': { label: 'Attached leaf', color: GREEN_LEAF },
  'stoma-pore': { label: 'Stoma pore', color: '#2E4630' },
  'guard-cells': { label: 'Guard cells', color: GREEN_DEEP },
  'gas-flow': { label: 'Gas flow', color: '#8FA3A8' },
  'leaf-surface': { label: 'Leaf surface', color: GREEN_PALE },
  'xy-tubelet': { label: 'Xylem tube', color: '#8FA9C9' },
  'xy-root': { label: 'Root entry', color: SOIL },
  'xy-leaf': { label: 'Leaf end', color: GREEN_LEAF },
}

const DEFAULT_PART_BY_COMPONENT: Record<string, LabPart> = {
  chloroplast: 'cp-grana',
  flower: 'fl-petal',
  leaf: 'lf-blade',
  phloem: 'ph-tube',
  root: 'rt-system',
  seed: 'sd-coat',
  stem: 'st-node',
  stomata: 'stoma-pore',
  xylem: 'xy-tubelet',
}

const DEFAULT_TOGGLES: Record<string, boolean> = {
  'cp-inputs': true,
  'cp-peel': false,
  'fl-pollen': true,
  'lf-inner': false,
  'ph-xylem': true,
  'rt-soil': false,
  'st-section': true,
  'xy-wall': true,
}

function seedStage(germination: number) {
  if (germination < 0.2) return 'Dry seed'
  if (germination < 0.42) return 'Root first'
  if (germination < 0.68) return 'Shoot rises'
  if (germination < 0.9) return 'Leaves open'
  if (germination < 0.98) return 'Seedling'
  return 'Mature plant'
}

function seedObservation(germination: number) {
  if (germination < 0.2) return 'coat protects the embryo'
  if (germination < 0.42) return 'water wakes the embryo; root anchors first'
  if (germination < 0.68) return 'shoot pushes upward through soil'
  if (germination < 0.9) return 'first leaves open to catch light'
  if (germination < 0.98) return 'seedling starts making its own food'
  return 'fully grown — ready to flower and make new seeds (see the Flower tab)'
}

export default function PlantsLab() {
  const [activeId, setActiveId] = useState('chloroplast')
  const [selectedPart, setSelectedPart] = useState<LabPart | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(7.6)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const [flowProgress, setFlowProgress] = useState(0)
  const [germination, setGermination] = useState(0.3)
  const [turgor, setTurgor] = useState(0.6)
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES)

  // seed → sprout: water + warmth + nutrients drive germination timing/success
  const [seedWater, setSeedWater] = useState(60)
  const [seedWarmth, setSeedWarmth] = useState(58)
  const [seedNutrients, setSeedNutrients] = useState(65)
  const [seedLight, setSeedLight] = useState(true)
  // photosynthesis: light + CO2 drive sugar output
  const [lightIntensity, setLightIntensity] = useState(70)
  const [co2Level, setCo2Level] = useState(50)
  // water transport: root uptake drives visible flow speed
  const [rootUptake, setRootUptake] = useState(65)
  // pollination: a pollinator visit gates seed formation
  const [pollinated, setPollinated] = useState(false)
  const [pollinationProgress, setPollinationProgress] = useState(0)
  // real 3D growth-stage sequences (Wave 3 / P0-4): opt-in layer on Seed (corn) + Flower (bloom)
  const [showCornGrowth, setShowCornGrowth] = useState(false)
  const [cornStageIndex, setCornStageIndex] = useState(0)
  const [showFlowerGrowth, setShowFlowerGrowth] = useState(false)
  const [flowerStageIndex, setFlowerStageIndex] = useState(0)

  const flowAccumulator = useRef(0)
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  const germinationSuitability = seedSuitability(seedWater, seedWarmth, seedNutrients)
  const seedStall = seedStallReason(seedWater, seedWarmth, seedNutrients, germinationSuitability)
  const sugarRate = photosynthesisRate(lightIntensity, co2Level)
  const waterFlowRate = rootUptake / 100

  const handleAnimationTick = useCallback((delta: number) => {
    const activeComp = activeIdRef.current
    let rateMultiplier = 1
    if (activeComp === 'chloroplast' || activeComp === 'leaf' || activeComp === 'phloem') {
      rateMultiplier = 0.25 + photosynthesisRate(lightIntensity, co2Level) * 1.5
    } else if (activeComp === 'root' || activeComp === 'stem' || activeComp === 'xylem') {
      rateMultiplier = 0.2 + (rootUptake / 100) * 1.6
    }
    flowAccumulator.current += delta
    const steps = Math.floor(flowAccumulator.current / 0.1)
    if (steps > 0) {
      flowAccumulator.current -= steps * 0.1
      setFlowProgress((value) => (value + 0.08 * steps * 0.1 * rateMultiplier) % 1)
    }
    if (activeComp === 'seed') {
      const suitability = seedSuitability(seedWater, seedWarmth, seedNutrients)
      const rate = suitability < 0.18 ? 0 : 0.05 * (0.15 + suitability * 0.85)
      if (rate > 0) setGermination((value) => Math.min(1, value + rate * delta))
    }
    if (activeComp === 'flower' && pollinated) {
      setPollinationProgress((value) => Math.min(1, value + 0.06 * delta))
    }
  }, [lightIntensity, co2Level, rootUptake, seedWater, seedWarmth, seedNutrients, pollinated])

  const activeContent = contentById[activeId] ?? plants[0]
  const compareTarget = activeContent.compareCandidate ? resolveContent(activeContent.compareCandidate) : null
  const displayPart = selectedPart ?? DEFAULT_PART_BY_COMPONENT[activeId] ?? 'cp-grana'

  const activeHotspot = useMemo(() => {
    if (!selectedPart) return null
    const meta = PART_META[selectedPart]
    if (!meta) return null
    const authored = hotspotFor(activeContent, meta.label)
    if (authored) return authored
    return {
      id: `part-${selectedPart}`,
      label: meta.label,
      color: meta.color,
      position: [0, 0, 0] as [number, number, number],
      description: meta.label,
      function: meta.label,
    }
  }, [selectedPart, activeContent])

  const effectiveTurgor = useMemo(
    () => Math.max(0, Math.min(1, turgor + Math.sin(flowProgress * Math.PI * 2) * 0.12)),
    [turgor, flowProgress],
  )

  const enhancedContent: ComponentContent = useMemo(() => ({
    ...activeContent,
    keyFacts: [
      { label: 'What you are looking at', value: PART_META[displayPart]?.label ?? activeContent.name },
      ...(activeId === 'chloroplast'
        ? [
            { label: 'Makes', value: 'sugar (food) + oxygen' },
            { label: 'Uses', value: 'sunlight + water + CO₂' },
            { label: 'Sugar output', value: sugarOutputLabel(sugarRate) },
          ]
        : []),
      ...(activeId === 'flower'
        ? [{ label: 'Pollination', value: !pollinated ? 'waiting for a pollinator' : pollinationProgress > 0.6 ? 'seed has formed' : 'pollen on its way to the stigma' }]
        : []),
      ...(activeId === 'leaf'
        ? [
            { label: 'Gas exchange', value: flowProgress > 0.5 ? 'O₂ leaving · CO₂ arriving' : 'stoma breathing' },
            { label: 'Sugar output', value: sugarOutputLabel(sugarRate) },
          ]
        : []),
      ...(activeId === 'phloem'
        ? [
            { label: 'Direction', value: 'leaf → roots · seeds (down)' },
            { label: 'Sugar supply', value: sugarOutputLabel(sugarRate) },
          ]
        : []),
      ...(activeId === 'root'
        ? [
            { label: 'Soaks up', value: 'water + minerals (see blue flow)' },
            { label: 'Water flow', value: waterFlowLabel(rootUptake) },
          ]
        : []),
      ...(activeId === 'seed'
        ? [
            { label: 'Germination', value: `${Math.round(germination * 100)}%` },
            { label: 'Stage', value: seedStage(germination) },
            { label: 'What changed?', value: seedObservation(germination) },
            { label: 'Conditions', value: seedStall ?? 'good for growing' },
            { label: 'Nutrients', value: `${seedNutrients}%` },
          ]
        : []),
      ...(activeId === 'stem'
        ? [
            { label: 'Two-way elevator', value: 'water up · sugar down' },
            { label: 'Water flow', value: waterFlowLabel(rootUptake) },
          ]
        : []),
      ...(activeId === 'stomata'
        ? [{ label: 'Pore openness', value: `${Math.round(effectiveTurgor * 100)}% (water level)` }]
        : []),
      ...(activeId === 'xylem'
        ? [
            { label: 'Direction', value: 'root → leaf, one way' },
            { label: 'Water flow', value: waterFlowLabel(rootUptake) },
          ]
        : []),
      ...activeContent.keyFacts.slice(1, 4),
    ],
  }), [activeContent, activeId, displayPart, effectiveTurgor, flowProgress, germination, sugarRate, rootUptake, pollinated, pollinationProgress, seedStall, seedNutrients])

  const challengeSteps = useMemo(
    () => getChallenge(activeId, {
      germinationStage: seedStage(germination),
      stallReason: seedStall,
      sugarLabel: sugarOutputLabel(sugarRate),
      waterLabel: waterFlowLabel(rootUptake),
      turgorPct: Math.round(effectiveTurgor * 100),
      pollinated,
      seedFormed: pollinationProgress > 0.6,
    }),
    [activeId, germination, seedStall, sugarRate, rootUptake, effectiveTurgor, pollinated, pollinationProgress],
  )

  const selectPart = (part: LabPart) => {
    if (part === 'none') {
      setSelectedPart(null)
      return
    }
    setSelectedPart(part)
  }

  const toggleControl = (key: string) => setToggles((current) => ({ ...current, [key]: !current[key] }))

  const reset = () => {
    setSelectedPart(null)
    setAutoRotate(false)
    setCameraDistance(7.6)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(true)
    setCleanView(false)
    setControlsOpen(false)
    setFlowProgress(0)
    setGermination(0.3)
    setTurgor(0.6)
    setToggles(DEFAULT_TOGGLES)
    setSeedWater(60)
    setSeedWarmth(58)
    setSeedNutrients(65)
    setSeedLight(true)
    setLightIntensity(70)
    setCo2Level(50)
    setRootUptake(65)
    setPollinated(false)
    setPollinationProgress(0)
    setShowCornGrowth(false)
    setCornStageIndex(0)
    setShowFlowerGrowth(false)
    setFlowerStageIndex(0)
  }

  const activeIndex = plants.findIndex((item) => item.id === activeId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={LeafIcon}
            branchName="Plants"
            items={plants.map((item) => ({ id: item.id, name: item.name, meta: item.system }))}
            activeItemId={activeId}
            onSelect={(id) => { setActiveId(id); setSelectedPart(null) }}
            otherBranches={otherBranches}
            footerNote="Flagship plant lab: photosynthesis, transport, reproduction, and growth are interactive."
          />
        </aside>

        <div
          data-lab-stage
          data-clean-view={cleanView ? 'true' : undefined}
          className={cn(
            'relative order-1 flex min-h-[300px] shrink-0 flex-col lg:order-2 lg:h-auto lg:min-h-[380px] lg:flex-1',
            // Wave 15 fix (wave14-COMBINED.md P1 #4a): the Tune panel's mobile bottom sheet is a
            // real flex sibling of the canvas below it (not an overlay -- see the Wave 13 comment
            // above), capped at max-h-[24svh] (TunePanel below). Against the old fixed h-[56svh]
            // box that left the canvas as little as ~32svh once the sheet grew toward its cap --
            // enough to clip the full-bloom flower / tasseled-corn growth models against the
            // canvas badge overlay. Growing the box to 64svh while the panel is open keeps a
            // >=40svh floor for the canvas (64 - 24 = 40svh), matching this app's established
            // minimum-canvas-height convention (NumberSenseLab's Wave 13 fix settled on 40svh as
            // the floor a stage needs to stay usable). No effect once the panel is closed, or at
            // `lg:h-auto` on desktop.
            controlsOpen ? 'h-[64svh]' : 'h-[56svh]',
          )}
        >
          {/* Canvas viewport: the 3D scene + its floating toolbar/badge/stat-rail
              overlays, now its own flex-1 box (Wave 13 QA P1 fix) so the Tune
              panel below (a real bottom sheet in normal flow below `lg`, see
              the wrapper further down) can never draw on top of it. Previously
              the whole panel was always `absolute`, which let it cover the
              seedling/bud at 390x844 even though the panel was already
              height-capped — the model renders low in-frame (near the soil
              plane), exactly where a bottom-anchored overlay sits. */}
          <div className="relative min-h-0 flex-1">
            <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setIsolateActive((value) => !value)}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setCameraDistance((distance) => Math.max(5.9, Number((distance - 0.4).toFixed(2))))}
            onZoomOut={() => setCameraDistance((distance) => Math.min(9.8, Number((distance + 0.4).toFixed(2))))}
            zoomInDisabled={cameraDistance <= 5.9}
            zoomOutDisabled={cameraDistance >= 9.8}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((value) => !value)}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setCameraDistance(7.6)}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4 lg:px-2 xl:px-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm lg:px-2.5 lg:text-[10px] lg:tracking-normal xl:px-3.5 xl:text-[11px] xl:tracking-wide">
              Plants · tap parts · trace how a plant works
            </div>
          </div>

          <PlantsScene
            activeId={activeId}
            selectedPart={selectedPart}
            onSelectPart={selectPart}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            flowProgress={flowProgress}
            germination={germination}
            turgor={effectiveTurgor}
            toggles={toggles}
            onAnimationTick={handleAnimationTick}
            sugarRate={sugarRate}
            waterFlowRate={waterFlowRate}
            seedLight={seedLight}
            seedStallReason={seedStall}
            pollinated={pollinated}
            pollinationProgress={pollinationProgress}
            showCornGrowth={showCornGrowth}
            cornStageIndex={cornStageIndex}
            onCornGrowthError={() => setShowCornGrowth(false)}
            showFlowerGrowth={showFlowerGrowth}
            flowerStageIndex={flowerStageIndex}
            onFlowerGrowthError={() => setShowFlowerGrowth(false)}
          />

          {/* Compact stat rail — kept off the lower-canvas area (and capped to one
              scrollable row) so short growth stages, like early corn, stay visible
              above/around it. Wave 8 QA P0: this used to be a tall multi-row card
              grid pinned to the canvas bottom, which hid short plants entirely. */}
          {!controlsOpen && (
            <div
              data-canvas-overlay
              className="pointer-events-none absolute inset-x-3 top-32 z-10 flex justify-center sm:left-24 sm:right-4 sm:top-16 sm:justify-end lg:left-20 lg:right-3 xl:left-24 xl:right-4"
            >
              <div className="pointer-events-auto flex max-w-full gap-1.5 overflow-x-auto px-0.5 pb-1">
                <StatChip label="Molecule" value={activeContent.name} />
                {activeId === 'chloroplast' && <StatChip label="Pigment" value="chlorophyll" />}
                {activeId === 'flower' && <StatChip label="Pollen" value={!pollinated ? 'on the anther' : pollinationProgress > 0.6 ? 'delivered' : 'on the move'} />}
                {activeId === 'leaf' && <StatChip label="Job" value="food factory" />}
                {activeId === 'phloem' && <StatChip label="Flow" value={animationPlaying ? 'sugar flowing' : 'paused'} />}
                {activeId === 'root' && <StatChip label="Water" value={animationPlaying ? waterFlowLabel(rootUptake) : 'paused'} />}
                {activeId === 'seed' && <StatChip label="Growth" value={`${Math.round(germination * 100)}%`} />}
                {activeId === 'seed' && <StatChip label="Stage" value={seedStage(germination)} />}
                {activeId === 'seed' && <StatChip label="Conditions" value={seedStall ?? 'good'} />}
                {activeId === 'seed' && <StatChip label="Nutrients" value={`${seedNutrients}%`} />}
                {activeId === 'stem' && <StatChip label="Elevator" value="both ways" />}
                {activeId === 'stomata' && <StatChip label="Pore" value={`${Math.round(effectiveTurgor * 100)}% open`} />}
                {activeId === 'xylem' && <StatChip label="Direction" value="root → leaf" />}
                {activeId === 'chloroplast' && <StatChip label="Sugar output" value={sugarOutputLabel(sugarRate)} />}
                {activeId === 'flower' && <StatChip label="Seed" value={pollinationProgress > 0.6 ? 'forming' : '—'} />}
                {activeId === 'leaf' && <StatChip label="Gas" value="CO₂ in · O₂ out" />}
                {activeId === 'root' && <StatChip label="Anchor" value="firmly in soil" />}
                {activeId === 'seed' && <StatChip label="Next" value={seedObservation(Math.min(1, germination + 0.16))} />}
                {activeId === 'seed' && showCornGrowth && <StatChip label="3D corn stage" value={`${cornStageIndex + 1} of ${growthStageModels.seed.length}`} />}
                {activeId === 'flower' && showFlowerGrowth && <StatChip label="3D bloom stage" value={`${flowerStageIndex + 1} of ${growthStageModels.flower.length}`} />}
                {activeId === 'stem' && <StatChip label="Water flow" value={waterFlowLabel(rootUptake)} />}
                {activeId === 'xylem' && <StatChip label="Water flow" value={waterFlowLabel(rootUptake)} />}
                {activeId === 'leaf' && <StatChip label="Sugar output" value={sugarOutputLabel(sugarRate)} />}
                {activeId === 'phloem' && <StatChip label="Sugar supply" value={sugarOutputLabel(sugarRate)} />}
              </div>
            </div>
          )}
          </div>

          {/* Per-component tune panel. Collapsed: just the two action buttons,
              bottom-anchored, minimal height, absolute over the canvas (small
              enough to never meaningfully occlude it). Expanded, below `lg`
              (phones and the 1024px tablet breakpoint no longer applies here —
              see next paragraph): a REAL bottom sheet in normal flow, below the
              canvas viewport rather than drawn on top of it (Wave 13 QA P1 fix
              for 390x844 — the old always-`absolute` sheet covered the
              seedling/bud, which renders low in-frame, even though it was
              already height-capped). TunePanel's own max-h-[24svh] still caps
              how tall the sheet gets.
              At `lg` and up (1024px+) this reverts to the pre-existing
              right-docked overlay (12rem narrowed at `lg`, 22rem from `xl`) —
              desktop already had enough canvas width for that dock not to
              occlude the model (Wave 8/10 QA passed here). The 1024–1279px
              tablet band, which Wave 12 QA flagged P1 for this same dock
              hiding the model, is fixed differently: the right DetailPanel
              `aside` below now collapses at `lg` (not `xl`) while the panel is
              open, freeing the stage's full width so the 12rem dock's sliver
              lands well clear of the (horizontally centered) model instead of
              on top of it. Wave 8 QA P0/P1, Wave 10 QA P0, Wave 13 QA P1. */}
          {controlsOpen && (
            <div
              data-canvas-overlay
              className={cn('relative z-10 shrink-0 lg:absolute lg:inset-x-auto lg:bottom-4 lg:right-3 lg:top-20 lg:w-[12rem] xl:right-4 xl:w-[22rem]')}
            >
              <TunePanel
                activeId={activeId}
                toggles={toggles}
                onToggle={toggleControl}
                germination={germination}
                setGermination={setGermination}
                turgor={turgor}
                setTurgor={setTurgor}
                seedWater={seedWater}
                setSeedWater={setSeedWater}
                seedWarmth={seedWarmth}
                setSeedWarmth={setSeedWarmth}
                seedNutrients={seedNutrients}
                setSeedNutrients={setSeedNutrients}
                seedLight={seedLight}
                setSeedLight={setSeedLight}
                seedStall={seedStall}
                lightIntensity={lightIntensity}
                setLightIntensity={setLightIntensity}
                co2Level={co2Level}
                setCo2Level={setCo2Level}
                rootUptake={rootUptake}
                setRootUptake={setRootUptake}
                pollinated={pollinated}
                pollinationProgress={pollinationProgress}
                onPollinate={() => { setPollinated(true); setPollinationProgress(0) }}
                showCornGrowth={showCornGrowth}
                setShowCornGrowth={setShowCornGrowth}
                cornStageIndex={cornStageIndex}
                setCornStageIndex={setCornStageIndex}
                showFlowerGrowth={showFlowerGrowth}
                setShowFlowerGrowth={setShowFlowerGrowth}
                flowerStageIndex={flowerStageIndex}
                setFlowerStageIndex={setFlowerStageIndex}
                onClose={() => setControlsOpen(false)}
              />
            </div>
          )}
          {!controlsOpen && (
          <div
            data-canvas-overlay
            className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4"
          >
            <div className="flex flex-wrap items-center justify-end gap-2">
              {(activeId === 'seed' || activeId === 'flower') && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeId === 'seed') setShowCornGrowth(true)
                    else setShowFlowerGrowth(true)
                    setControlsOpen(true)
                  }}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-[var(--shadow-tactile)] backdrop-blur-sm',
                    (activeId === 'seed' ? showCornGrowth : showFlowerGrowth)
                      ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white'
                      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 text-[color:var(--color-foreground)]',
                  )}
                >
                  <Sprout className="h-4 w-4" strokeWidth={1.8} />
                  {(activeId === 'seed' ? showCornGrowth : showFlowerGrowth) ? 'Real 3D growth — on' : 'See it grow (real 3D)'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setControlsOpen(true)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                Tune plant
              </button>
            </div>
          </div>
          )}
        </div>

        <aside
          className={cn(
            'order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0',
            // Wave 13 QA P1: at the 1024–1279px tablet band the Tune panel's
            // lg:w-[12rem] right dock (see the stage above) left almost no
            // clearance from the model once this 360px-wide detail rail and
            // the 260px left nav were both subtracted from a 1024px viewport
            // — the model ended up hidden behind the dock. Collapsing this
            // aside while the panel is open frees the stage's full width so
            // the dock lands clear of the (horizontally centered) model
            // instead of on top of it. Restored at `xl` (1280px+), where the
            // panel widens to 22rem but the stage is wide enough that the
            // three-column layout already passed QA with this aside visible.
            controlsOpen && 'lg:hidden xl:block',
          )}
        >
          {/* Component switcher for every screen size, including mobile,
              where the ContentNav list in the left aside is hidden
              (lg:block only). Picking an item here mirrors the desktop
              list's onSelect handler, so the model + tune panel refocus
              on the chosen component. Growth-stage scrubbing (corn/flower)
              stays independent of this switcher — it lives in the
              always-visible "See it grow" button + Tune plant panel below. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeIndex + 1} of {plants.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {plants.map((item) => {
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setActiveId(item.id); setSelectedPart(null) }}
                    title={item.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-biology-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-biology-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-biology-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <LeafIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <GuidedChallenge steps={challengeSteps} />
          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setSelectedPart(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

/** Compact single-line stat chip for the canvas stat rail — deliberately terse
 *  (unlike the old card-style Meter) so a whole row of them stays a slim strip
 *  instead of a tall block that can obscure short growth stages. */
function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-2.5 py-1 shadow-[var(--shadow-tactile)] backdrop-blur-sm lg:gap-1 lg:px-2 lg:py-0.5 xl:gap-1.5 xl:px-2.5 xl:py-1">
      <span className="text-[9px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] lg:text-[8px] xl:text-[9px]">{label}</span>
      <span className="font-[family-name:var(--font-mono)] text-[11px] font-medium text-[color:var(--color-foreground)] lg:text-[10px] xl:text-[11px]">{value}</span>
    </div>
  )
}

function TunePanel({
  activeId,
  toggles,
  onToggle,
  germination,
  setGermination,
  turgor,
  setTurgor,
  seedWater,
  setSeedWater,
  seedWarmth,
  setSeedWarmth,
  seedNutrients,
  setSeedNutrients,
  seedLight,
  setSeedLight,
  seedStall,
  lightIntensity,
  setLightIntensity,
  co2Level,
  setCo2Level,
  rootUptake,
  setRootUptake,
  pollinated,
  pollinationProgress,
  onPollinate,
  showCornGrowth,
  setShowCornGrowth,
  cornStageIndex,
  setCornStageIndex,
  showFlowerGrowth,
  setShowFlowerGrowth,
  flowerStageIndex,
  setFlowerStageIndex,
  onClose,
}: {
  activeId: string
  toggles: Record<string, boolean>
  onToggle: (key: string) => void
  germination: number
  setGermination: Dispatch<SetStateAction<number>>
  turgor: number
  setTurgor: Dispatch<SetStateAction<number>>
  seedWater: number
  setSeedWater: Dispatch<SetStateAction<number>>
  seedWarmth: number
  setSeedWarmth: Dispatch<SetStateAction<number>>
  seedNutrients: number
  setSeedNutrients: Dispatch<SetStateAction<number>>
  seedLight: boolean
  setSeedLight: Dispatch<SetStateAction<boolean>>
  seedStall: string | null
  lightIntensity: number
  setLightIntensity: Dispatch<SetStateAction<number>>
  co2Level: number
  setCo2Level: Dispatch<SetStateAction<number>>
  rootUptake: number
  setRootUptake: Dispatch<SetStateAction<number>>
  pollinated: boolean
  pollinationProgress: number
  onPollinate: () => void
  showCornGrowth: boolean
  setShowCornGrowth: Dispatch<SetStateAction<boolean>>
  cornStageIndex: number
  setCornStageIndex: Dispatch<SetStateAction<number>>
  showFlowerGrowth: boolean
  setShowFlowerGrowth: Dispatch<SetStateAction<boolean>>
  flowerStageIndex: number
  setFlowerStageIndex: Dispatch<SetStateAction<number>>
  onClose: () => void
}) {
  const entries: [string, string][] = []
  if (activeId === 'chloroplast') {
    entries.push(['cp-inputs', 'Show sunlight · water · CO₂ rays'], ['cp-peel', 'Peel the outer membrane'])
  }
  if (activeId === 'flower') entries.push(['fl-pollen', 'Show the pollen path'])
  if (activeId === 'leaf') entries.push(['lf-inner', 'Show inner veins (transparent blade)'])
  if (activeId === 'phloem') entries.push(['ph-xylem', 'Show xylem for contrast'])
  if (activeId === 'root') entries.push(['rt-soil', 'Peel the soil away'])
  if (activeId === 'stem') entries.push(['st-section', 'Show the cross-section ring'])
  if (activeId === 'xylem') entries.push(['xy-wall', 'Show the outer wall'])
  return (
    <div className="relative max-h-[24svh] overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm lg:h-full lg:max-h-full">
      {/* Scroll affordance (Wave 13 QA P1): this panel's content routinely
          overflows its capped height (Wave 12 QA measured 31-77% of it
          visible depending on viewport) with no cue that more exists below.
          This fade + chevron sits OUTSIDE the scrollable div below (an
          absolute overlay, not a scroll-container child) so it stays pinned
          over the bottom edge no matter how far the content underneath is
          scrolled — a permanent "more below" cue rather than one that needs
          JS scroll-position tracking to place correctly. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex h-8 items-end justify-center rounded-b-[var(--radius-lg)] bg-gradient-to-t from-[color:var(--color-surface-raised)] to-transparent pb-1">
        <ChevronDown className="h-3.5 w-3.5 text-[color:var(--color-ink-500)]" strokeWidth={2} />
      </div>
      <div className="grid h-full gap-3 overflow-y-auto p-3 pb-7 [scrollbar-color:var(--color-ink-500)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[color:var(--color-border)] [&::-webkit-scrollbar-track]:bg-transparent">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Tune plant · {activeId.replace(/-/g, ' ')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide plant controls"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {entries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entries.map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => onToggle(key)}
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
                toggles[key] !== false ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {toggles[key] !== false ? 'Hide' : 'Show'} {label.replace(/^Show /, '')}
            </button>
          ))}
        </div>
      )}

      {activeId === 'seed' && (
        <div className="grid gap-2">
          <div className="grid gap-1.5 border-b border-[color:var(--color-border)] pb-2">
            <button
              type="button"
              onClick={() => setShowCornGrowth((value) => !value)}
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
                showCornGrowth ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {showCornGrowth ? 'Hide real corn growth stages (3D)' : 'Show real corn growth stages (3D)'}
            </button>
            {showCornGrowth && (
              <label>
                <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                  Growth stage <span className="font-[family-name:var(--font-mono)]">{cornStageIndex + 1} of {growthStageModels.seed.length}</span>
                </span>
                <input
                  className="w-full accent-[color:var(--color-biology-deep)]"
                  type="range"
                  min={0}
                  max={growthStageModels.seed.length - 1}
                  step={1}
                  value={cornStageIndex}
                  onChange={(event) => setCornStageIndex(Number(event.target.value))}
                />
                <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] leading-tight text-[color:var(--color-ink-500)]">
                  <span>seedling</span>
                  <span>young stalk</span>
                  <span>taller stalk</span>
                  <span>tasseled</span>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">Real 3D scans of a corn plant at each stage — a stylized reference, not a labeled botanical phase.</p>
              </label>
            )}
          </div>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
            <p className="text-xs font-semibold text-[color:var(--color-foreground)]">{seedStage(germination)}</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
              {seedStall ? `Stalled — ${seedStall}` : seedObservation(germination)}
            </p>
          </div>
          <div className="grid gap-1.5">
            <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Compare growing conditions</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => { setSeedWater(60); setSeedWarmth(58); setSeedNutrients(65); setGermination(0.02) }}
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-transparent bg-[color:var(--color-biology-deep)] px-3 py-2 text-xs font-semibold text-white"
              >
                Try: well-watered
              </button>
              <button
                type="button"
                onClick={() => { setSeedWater(12); setSeedWarmth(22); setSeedNutrients(20); setGermination(0.02) }}
                className="inline-flex min-h-[44px] items-center rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-2 text-xs font-semibold text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]"
              >
                Try: dry + cold
              </button>
            </div>
          </div>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Germination <span className="font-[family-name:var(--font-mono)]">{Math.round(germination * 100)}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(germination * 100)} onChange={(event) => setGermination(Number(event.target.value) / 100)} />
            <div className="mt-1 grid grid-cols-4 gap-1 text-[10px] leading-tight text-[color:var(--color-ink-500)]">
              <span>dry seed</span>
              <span>root first</span>
              <span>shoot rises</span>
              <span>leaves open</span>
            </div>
          </label>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Soil water <span className="font-[family-name:var(--font-mono)]">{seedWater}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={seedWater} onChange={(event) => setSeedWater(Number(event.target.value))} />
          </label>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Warmth <span className="font-[family-name:var(--font-mono)]">{seedWarmth}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={seedWarmth} onChange={(event) => setSeedWarmth(Number(event.target.value))} />
          </label>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Soil nutrients <span className="font-[family-name:var(--font-mono)]">{seedNutrients}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={seedNutrients} onChange={(event) => setSeedNutrients(Number(event.target.value))} />
            <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">Low nutrients slow growth even with good water and warmth.</p>
          </label>
          <button
            type="button"
            onClick={() => setSeedLight((value) => !value)}
            className={cn(
              'inline-flex items-center gap-2 self-start rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              seedLight ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            {seedLight ? 'Light: on (leaves green up)' : 'Light: off (leaves stay pale)'}
          </button>
        </div>
      )}

      {(activeId === 'chloroplast' || activeId === 'leaf') && (
        <div className="grid gap-2">
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Light intensity <span className="font-[family-name:var(--font-mono)]">{lightIntensity}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={lightIntensity} onChange={(event) => setLightIntensity(Number(event.target.value))} />
          </label>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              CO₂ level <span className="font-[family-name:var(--font-mono)]">{co2Level}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={co2Level} onChange={(event) => setCo2Level(Number(event.target.value))} />
          </label>
          <p className="text-xs text-[color:var(--color-ink-500)]">Sugar output: {sugarOutputLabel(photosynthesisRate(lightIntensity, co2Level))}</p>
        </div>
      )}

      {(activeId === 'root' || activeId === 'stem' || activeId === 'xylem') && (
        <label>
          <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
            Root water uptake <span className="font-[family-name:var(--font-mono)]">{rootUptake}%</span>
          </span>
          <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={rootUptake} onChange={(event) => setRootUptake(Number(event.target.value))} />
          <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">Flow: {waterFlowLabel(rootUptake)}</p>
        </label>
      )}

      {activeId === 'flower' && (
        <div className="grid gap-2">
          <div className="grid gap-1.5 border-b border-[color:var(--color-border)] pb-2">
            <button
              type="button"
              onClick={() => setShowFlowerGrowth((value) => !value)}
              className={cn(
                'inline-flex items-center gap-2 self-start rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
                showFlowerGrowth ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {showFlowerGrowth ? 'Hide real flower growth stages (3D)' : 'Show real flower growth stages (3D)'}
            </button>
            {showFlowerGrowth && (
              <label>
                <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                  Growth stage <span className="font-[family-name:var(--font-mono)]">{flowerStageIndex + 1} of {growthStageModels.flower.length}</span>
                </span>
                <input
                  className="w-full accent-[color:var(--color-biology-deep)]"
                  type="range"
                  min={0}
                  max={growthStageModels.flower.length - 1}
                  step={1}
                  value={flowerStageIndex}
                  onChange={(event) => setFlowerStageIndex(Number(event.target.value))}
                />
                <div className="mt-1 grid grid-cols-3 gap-1 text-[10px] leading-tight text-[color:var(--color-ink-500)]">
                  <span>bud</span>
                  <span>opening</span>
                  <span>full bloom</span>
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">Real 3D scans of a flower at each stage — a stylized reference, not a labeled botanical phase.</p>
              </label>
            )}
          </div>
          <button
            type="button"
            onClick={onPollinate}
            className="inline-flex items-center justify-center gap-2 self-start rounded-[var(--radius-md)] border border-transparent bg-[color:var(--color-biology-deep)] px-3 py-2 text-xs font-semibold text-white"
          >
            Bee visits (pollinate)
          </button>
          <p className="text-xs text-[color:var(--color-ink-500)]">
            {pollinated ? (pollinationProgress > 0.6 ? 'Seed has formed in the ovary!' : 'Pollen is moving to the stigma…') : 'Nothing happens until a pollinator visits.'}
          </p>
        </div>
      )}

      {activeId === 'stomata' && (
        <label>
          <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
            Water in guard cells <span className="font-[family-name:var(--font-mono)]">{Math.round(turgor * 100)}%</span>
          </span>
          <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(turgor * 100)} onChange={(event) => setTurgor(Number(event.target.value) / 100)} />
          {turgor < 0.18 && <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">Wilting — the pore stays shut to save water.</p>}
        </label>
      )}
      </div>
    </div>
  )
}
