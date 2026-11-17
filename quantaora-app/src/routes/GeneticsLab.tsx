import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, invalidate, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SlidersHorizontal, X, Play, Pause, Dna as DnaIcon, ListChecks } from 'lucide-react'
import { genetics } from '@/data/generated/genetics'
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
import { useGlbRetry } from '@/components/explorer/useGlbRetry'
import { cn } from '@/lib/utils'

// ── palette & shared constants ──────────────────────────────────────────────
const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const NUCLEOTIDE_COLORS: Record<string, string> = {
  A: '#4C7EC8',
  T: '#D95448',
  C: '#3E9E6F',
  G: '#C98F2C',
}
const COMPLEMENT: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }

/** A small gene used across the molecular scenes: start codon + codons + stop. */
const GENE: Record<string, string> = {
  'ATG': 'MET',
  'GGC': 'GLY',
  'CCT': 'PRO',
  'TTC': 'PHE',
  'GAA': 'GLU',
  'TAA': 'STOP',
  'TAG': 'STOP',
  'TGA': 'STOP',
  'AAT': 'ASN',
  'TTA': 'LEU',
}
const TRANSLATE = (codon: string) => GENE[codon] ?? '???'

const DEFAULT_SEQUENCE = 'ATGGCCTTCGAATAAC'
const DNA_RUNG_COUNT = 12

const contentById = Object.fromEntries(genetics.map((item) => [item.id, item]))
const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'genetics')

function hotspotFor(content: ComponentContent, label: string): Hotspot | null {
  return content.hotspots.find((hotspot) => hotspot.label === label) ?? null
}

/** Clamps copy to a fixed character budget (word-safe) so a UI cell driven by this text never
 *  grows taller than its shortest sibling's content would — used for the BottomTray "Real-world"
 *  cell, whose unclamped length otherwise forces every cell in its grid row (and the whole tray)
 *  to match the longest `whyItMatters` paragraph across all ten genetics components. */
function clampCopy(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const cut = text.slice(0, maxLength)
  const lastSpace = cut.lastIndexOf(' ')
  return `${cut.slice(0, lastSpace > 0 ? lastSpace : maxLength)}…`
}

function helixPoint(t: number, radius: number, phase: number, rise = 0): [number, number, number] {
  return [Math.cos(t + phase) * radius, t * rise - 1.5, Math.sin(t + phase) * radius]
}

/** A curved tube along a polyline of points — the app's proven 3D path primitive. */
function Strand({ points, color, radius = 0.055, onSelect, dim }: {
  points: [number, number, number][]
  color: string
  radius?: number
  onSelect?: () => void
  dim?: boolean
}) {
  const center: [number, number, number] = [
    (points[0][0] + points[points.length - 1][0]) / 2,
    (points[0][1] + points[points.length - 1][1]) / 2,
    (points[0][2] + points[points.length - 1][2]) / 2,
  ]
  return (
    <group position={center} onClick={onSelect ? (event) => { event.stopPropagation(); onSelect() } : undefined}>
      <Line points={points.map((p) => [p[0] - center[0], p[1] - center[1], p[2] - center[2]] as [number, number, number])} color={color} lineWidth={radius * 22} />
      <mesh>
        <sphereGeometry args={[radius, 14, 14]} />
        <meshStandardMaterial color={color} transparent={dim} opacity={dim ? 0.3 : 1} />
      </mesh>
    </group>
  )
}

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

// ── DNA double helix (component scenes share the rung/backbone builders) ────
const HELIX_RADIUS = 0.42
const RISE = 0.34
function helixRungPositions(count: number) {
  const positions: { index: number; from: [number, number, number]; to: [number, number, number] }[] = []
  for (let i = 0; i < count; i += 1) {
    const t = i * RISE
    const phase = i * 0.62
    const from = helixPoint(t, HELIX_RADIUS, phase, 1)
    from[1] = t - (count * RISE) / 2
    const to = helixPoint(t, HELIX_RADIUS, phase + Math.PI, 1)
    to[1] = t - (count * RISE) / 2
    positions.push({ index: i, from, to })
  }
  return positions
}

function DnaRungs({
  sequence,
  selectedIndex,
  onSelect,
  dimOthers,
  pairMode = false,
}: {
  sequence: string
  selectedIndex: number | null
  onSelect: (index: number) => void
  dimOthers: boolean
  pairMode?: boolean
}) {
  const positions = helixRungPositions(sequence.length)
  return (
    <group>
      {positions.map(({ index, from, to }) => {
        const base = sequence[index]
        const mate = COMPLEMENT[base] ?? base
        const active = selectedIndex === index
        const dim = dimOthers && !active
        return (
          <group key={index} position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]}>
            <Line
              points={[[from[0] - (from[0] + to[0]) / 2, 0, 0], [to[0] - (from[0] + to[0]) / 2, 0, 0]]}
              color={NUCLEOTIDE_COLORS[base] ?? '#888'}
              lineWidth={pairMode ? 4 : 6}
              transparent={dim}
              opacity={dim ? 0.15 : 1}
            />
            <mesh
              position={[from[0] - (from[0] + to[0]) / 2, 0, 0]}
              onClick={(event) => { event.stopPropagation(); onSelect(index) }}
            >
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color={NUCLEOTIDE_COLORS[base] ?? '#888'} emissive={NUCLEOTIDE_COLORS[base] ?? '#888'} emissiveIntensity={active ? 0.75 : 0.15} transparent={dim} opacity={dim ? 0.2 : 1} />
            </mesh>
            <mesh position={[to[0] - (from[0] + to[0]) / 2, 0, 0]}>
              <sphereGeometry args={[0.09, 16, 16]} />
              <meshStandardMaterial color={NUCLEOTIDE_COLORS[mate] ?? '#888'} transparent={dim} opacity={dim ? 0.2 : 1} />
            </mesh>
            {active && pairMode && (
              <>
                <ChipLabel text={base} position={[-(from[0] - (from[0] + to[0]) / 2) * 1.6, 0.05, 0]} color={NUCLEOTIDE_COLORS[base]} />
                <ChipLabel text={mate} position={[(from[0] - (from[0] + to[0]) / 2) * 1.6, 0.05, 0]} color={NUCLEOTIDE_COLORS[mate]} />
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

function DnaBackbone({
  count,
  phase,
  color,
  onSelect,
  dim,
}: {
  count: number
  phase: number
  color: string
  onSelect?: () => void
  dim?: boolean
}) {
  const points: [number, number, number][] = []
  for (let i = 0; i <= count; i += 1) {
    const t = i * RISE
    const p = helixPoint(t, HELIX_RADIUS, phase, 1)
    p[1] = t - (count * RISE) / 2
    points.push(p)
  }
  return <Strand points={points} color={color} radius={0.06} onSelect={onSelect} dim={dim} />
}

// ── molecular scenes ────────────────────────────────────────────────────────
function DnaScene({
  sequence,
  selectedRung,
  onSelectRung,
  labelsVisible,
  xray,
  isolateActive,
  selectedPart,
}: {
  sequence: string
  selectedRung: number | null
  onSelectRung: (index: number) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  selectedPart: string | null
}) {
  const count = Math.min(DNA_RUNG_COUNT, sequence.length)
  const rungs = helixRungPositions(count)
  const meanY = 0
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <DnaBackbone count={count} phase={0} color="#A98F6B" onSelect={() => onSelectRung(-1) } dim={isolateActive && selectedPart !== 'dna-backbone'} />
      <DnaBackbone count={count} phase={Math.PI} color="#A98F6B" onSelect={() => onSelectRung(-1)} dim={isolateActive && selectedPart !== 'dna-backbone'} />
      <DnaRungs sequence={sequence.slice(0, count)} selectedIndex={selectedRung} onSelect={onSelectRung} dimOthers={isolateActive} pairMode={labelsVisible} />
      <Marker position={[0, rungs[0].from[1] + 0.35, 0.55]} color="#D0A21E" label={labelsVisible ? 'Double helix' : undefined} onSelect={() => onSelectRung(-1)} dim={isolateActive && selectedPart !== 'dna-helix'} />
      {labelsVisible && (
        <>
          <ChipLabel text="sugar-phosphate backbone" position={[0.85, meanY + 0.2, 0.5]} color="#8A6A45" />
          <ChipLabel text={`${count} base pairs · A–T · C–G`} position={[0, meanY - 1.95, 0.2]} color="#277E98" />
        </>
      )}
      {xray && (
        <mesh position={[0, meanY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.01, 3.4, 48]} />
          <meshStandardMaterial color="#D96B5A" transparent opacity={0.25} side={2} />
        </mesh>
      )}
    </group>
  )
}

// ── real DNA structure (sourced GLB, PASS per docs/assets/reviews/biology-cell-visual.md) ──
// Real B-DNA double helix, RCSB PDB 1BNA. CC-BY 4.0 — see docs/ASSET-LICENSES.md for attribution.
const DNA_MODEL_URL = '/models/biology/genetics/dna-b-form-double-helix-nih.glb'
useGLTF.preload(DNA_MODEL_URL)

/** Fixed footprint the model is normalized into (native bbox ~[42, 28, 23] units, no fixed
 *  real-world scale) — chosen to roughly match the schematic helix's on-screen size. */
const DNA_GLB_FIT_SIZE = 3.6

/** Pill hotspot marker for the real DNA mesh — mirrors CellModel's GlbHotspotMarker so real
 *  sourced GLBs read consistently across the app (colored dot + ping + label chip). */
function RealDnaHotspotMarker({
  position,
  color,
  label,
  active,
  labelsVisible,
  onSelect,
}: {
  position: [number, number, number]
  color: string
  label: string
  active: boolean
  labelsVisible: boolean
  onSelect: () => void
}) {
  const [hovered, setHovered] = useState(false)
  return (
    <Html position={position} center distanceFactor={4.2} zIndexRange={[10, 0]} occlude={false}>
      <button
        type="button"
        onClick={(event) => { event.stopPropagation(); onSelect() }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-label={`View ${label}`}
        className="group relative flex h-11 w-11 items-center justify-center"
      >
        <span className="relative flex h-5 w-5 items-center justify-center">
          <span className={cn('absolute inline-flex h-full w-full rounded-full opacity-60', active && 'animate-ping')} style={{ background: color }} />
          <span className={cn('relative inline-flex h-3 w-3 rounded-full border-2 border-white shadow-md transition-transform', (hovered || active) && 'scale-125')} style={{ background: color }} />
        </span>
        <span
          className={cn(
            'pointer-events-none absolute left-1/2 top-full mt-1 max-w-40 -translate-x-1/2 truncate whitespace-nowrap rounded-full bg-[color:var(--color-ink-900)] px-2.5 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity',
            (hovered || active || labelsVisible) && 'opacity-100',
          )}
        >
          {label}
        </span>
      </button>
    </Html>
  )
}

/** Structural hotspots authored directly in the normalized/rotated DNA_GLB_FIT_SIZE space —
 *  same technique CellModel uses for its untextured sourced meshes (no per-atom color data to
 *  derive positions from, so positions are hand-placed against the known helix geometry). */
const DNA_REAL_HOTSPOTS: { part: LabPart; position: [number, number, number] }[] = [
  { part: 'dna-helix', position: [0, 1.7, 0.45] },
  { part: 'dna-backbone', position: [1.05, 1.1, 0.3] },
  { part: 'dna-basepairs', position: [0, 0.1, 0.65] },
  { part: 'dna-major-groove', position: [0.85, -0.55, 0.2] },
  { part: 'dna-minor-groove', position: [-0.9, 0.55, -0.3] },
]

/**
 * Catches GLB-load failures (bad URL, network error, malformed file) for the real B-DNA
 * structure (PDB 1BNA) mesh — RealDnaHelixModel has no procedural fallback of its own, so
 * without this the whole Genetics lab canvas would blank/crash on a broken asset instead of
 * showing a friendly, retryable message. Keyed by `retryKey` so "Try again" remounts the model
 * for a fresh load attempt. Mirrors OrganViewer's GlbErrorBoundary pattern.
 */
class DnaGlbErrorBoundary extends Component<{ children: ReactNode; onRetry: () => void }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[GeneticsLab] DNA model failed to load.', error)
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <Html center>
        <div
          role="alert"
          className="flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-3 text-center shadow-[var(--shadow-tactile)]"
        >
          <p className="text-xs font-medium text-[color:var(--color-ink-500)]">This 3D DNA model couldn&apos;t load.</p>
          <button
            type="button"
            onClick={this.props.onRetry}
            className="rounded-full bg-[color:var(--color-ink-900)] px-3 py-1 text-[11px] font-semibold text-white"
          >
            Try again
          </button>
        </div>
      </Html>
    )
  }
}

function RealDnaHelixModel({
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const { scene } = useGLTF(DNA_MODEL_URL)

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = DNA_GLB_FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    // Rotate the long helix axis (native X) upright so it reads as a vertical double helix,
    // matching the schematic scene's orientation.
    cloned.rotation.set(0, 0, Math.PI / 2)

    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      // Ships POSITION only, no NORMAL/material (confirmed in biology-cell-visual.md) — without
      // this the real GLTFLoader renders it unlit/flat.
      if (child.geometry && !child.geometry.getAttribute('normal')) {
        child.geometry.computeVertexNormals()
      }
      child.material = new THREE.MeshPhysicalMaterial({
        color: '#E4DAC4',
        roughness: 0.5,
        metalness: 0,
        clearcoat: 0.22,
        clearcoatRoughness: 0.45,
        transparent: true,
        opacity: 1,
      })
    })

    return cloned
  }, [scene])

  useFrame(() => {
    const dimmed = isolateActive && selectedPart !== null
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      const material = child.material as THREE.MeshPhysicalMaterial
      const target = dimmed ? 0.32 : 1
      material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
    })
  })

  return (
    <group onClick={(event) => { event.stopPropagation(); onSelectPart('dna-helix') }}>
      <primitive object={model} />
      {DNA_REAL_HOTSPOTS.map(({ part, position }) => (
        <RealDnaHotspotMarker
          key={part}
          position={position}
          color={PART_META[part].color}
          label={PART_META[part].label}
          active={selectedPart === part}
          labelsVisible={labelsVisible}
          onSelect={() => onSelectPart(part)}
        />
      ))}
    </group>
  )
}

/** Real-structure companion to DnaScene: the sourced PDB 1BNA mesh instead of the procedural
 *  teaching helix, for genuine molecular inspection. Toggled from Tune molecule; the schematic
 *  view (with its interactive per-base A–T/C–G rungs) stays the default and fully untouched. */
function DnaRealStructureScene({
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  // Busts the useGLTF module cache for DNA_MODEL_URL before bumping retryKey, so "Try again"
  // actually re-fetches instead of re-throwing the same cached rejection (same pattern OrganViewer
  // uses for its specimen model).
  const { retryKey, retryLoad } = useGlbRetry(DNA_MODEL_URL)

  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <DnaGlbErrorBoundary key={retryKey} onRetry={retryLoad}>
        <Suspense
          fallback={
            <Html center>
              <div
                role="status"
                aria-live="polite"
                className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-2 text-xs font-medium text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)]"
              >
                Loading DNA model…
              </div>
            </Html>
          }
        >
          <RealDnaHelixModel selectedPart={selectedPart} onSelectPart={onSelectPart} labelsVisible={labelsVisible} isolateActive={isolateActive} />
        </Suspense>
      </DnaGlbErrorBoundary>
      {labelsVisible && (
        <ChipLabel text="real B-DNA structure (PDB 1BNA) — twelve base pairs, ball-and-stick" position={[0, -1.95, 0.2]} color="#8A6A45" />
      )}
    </group>
  )
}

function ReplicationScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const count = 10
  const totalHeight = count * RISE + 0.6
  const fork = -totalHeight / 2 + progress * totalHeight
  const leftPoints: [number, number, number][] = []
  const rightPoints: [number, number, number][] = []
  for (let i = 0; i <= count; i += 1) {
    const t = i * RISE
    const p = helixPoint(t, HELIX_RADIUS, 0, 1)
    p[1] = t - totalHeight / 2
    leftPoints.push(p)
    const q = helixPoint(t, HELIX_RADIUS, Math.PI, 1)
    q[1] = t - totalHeight / 2
    rightPoints.push(q)
  }
  const separatedLeft = leftPoints.map((p) => (p[1] > fork ? [p[0], p[1], p[2]] : [p[0] - 0.35, p[1], p[2] + 0.2]) as [number, number, number])
  const separatedRight = rightPoints.map((p) => (p[1] > fork ? [p[0], p[1], p[2]] : [p[0] + 0.35, p[1], p[2] + 0.2]) as [number, number, number])
  const dim = (id: string) => isolateActive && selectedPart !== id
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <Strand points={separatedLeft} color="#7A6A55" onSelect={() => onSelectPart('repl-original')} dim={dim('repl-original')} />
      <Strand points={separatedRight} color="#7A6A55" onSelect={() => onSelectPart('repl-original')} dim={dim('repl-original')} />
      {progress > 0.12 && (
        <Strand
          points={leftPoints.map((p, index) => {
            const built = leftPoints.length - index
            const limit = Math.floor(progress / 0.6 * leftPoints.length)
            if (built > limit) return [p[0] - 0.5, p[1], p[2] + 0.35]
            return [p[0], p[1], p[2]] as [number, number, number]
          })}
          color="#D9A441"
          radius={0.05}
          onSelect={() => onSelectPart('repl-new')}
          dim={dim('repl-new')}
        />
      )}
      {progress > 0.45 && (
        <Strand
          points={rightPoints.map((p, index) => {
            const built = index
            const limit = Math.floor(progress / 0.6 * rightPoints.length)
            if (built > limit) return [p[0] + 0.5, p[1], p[2] + 0.35]
            return [p[0], p[1], p[2]] as [number, number, number]
          })}
          color="#D9A441"
          radius={0.05}
          onSelect={() => onSelectPart('repl-new')}
          dim={dim('repl-new')}
        />
      )}
      <Marker position={[0, fork + 0.15, 0.62]} color="#D96B5A" label={labelsVisible ? 'replication fork' : undefined} onSelect={() => onSelectPart('repl-fork')} dim={dim('repl-fork')} />
      {labelsVisible && (
        <>
          <ChipLabel text="original strands" position={[-1.6, -1.55, 0.35]} color="#7A6A55" />
          <ChipLabel text="new strands (complementary)" position={[1.6, -1.55, 0.35]} color="#B8872F" />
        </>
      )}
      {selectedPart === 'repl-new' && labelsVisible && (
        <ChipLabel text="semi-conservative: each new helix has one old + one new strand" position={[0, -1.95, 0.4]} color="#277E98" />
      )}
    </group>
  )
}

function GeneScene({
  sequence,
  selectedRegion,
  onSelectRegion,
  labelsVisible,
  isolateActive,
}: {
  sequence: string
  selectedRegion: string | null
  onSelectRegion: (region: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const count = sequence.length
  const rungs = helixRungPositions(count)
  const promoterSpan = 3
  const codingStart = 4
  const codingEnd = count - 3
  const dim = (id: string) => isolateActive && selectedRegion !== id
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <DnaBackbone count={count} phase={0} color="#A98F6B" onSelect={() => onSelectRegion('gene-helix')} dim={dim('gene-helix')} />
      <DnaBackbone count={count} phase={Math.PI} color="#A98F6B" onSelect={() => onSelectRegion('gene-helix')} dim={dim('gene-helix')} />
      <DnaRungs sequence={sequence} selectedIndex={null} onSelect={() => undefined} dimOthers={false} />
      <group onClick={(event) => { event.stopPropagation(); onSelectRegion('gene-promoter') }}>
        <mesh position={[rungs[promoterSpan - 1].from[0] + 0.4, rungs[promoterSpan - 1].from[1], 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.75, 0.75, 0.06]} />
          <meshStandardMaterial color="#D9A441" transparent={dim('gene-promoter')} opacity={dim('gene-promoter') ? 0.2 : 0.8} />
        </mesh>
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectRegion('gene-coding') }}>
        <mesh position={[rungs[codingStart].from[0] + 0.4, (rungs[codingStart].from[1] + rungs[codingEnd - 1].from[1]) / 2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.75, rungs[codingEnd - 1].from[1] - rungs[codingStart].from[1], 0.06]} />
          <meshStandardMaterial color="#6B85A8" transparent={dim('gene-coding')} opacity={dim('gene-coding') ? 0.2 : 0.8} />
        </mesh>
      </group>
      {labelsVisible && (
        <>
          <ChipLabel text="promoter" position={[rungs[promoterSpan - 1].from[0] + 0.42, rungs[promoterSpan - 1].from[1], 0.25]} color="#A8892D" />
          <ChipLabel text="coding sequence" position={[rungs[codingStart].from[0] + 0.42, (rungs[codingStart].from[1] + rungs[codingEnd - 1].from[1]) / 2, 0.25]} color="#4A6390" />
          <ChipLabel text={`gene = the stretch of DNA that codes a protein (${codingEnd - codingStart} bases shown)`} position={[0, -1.95, 0.35]} color="#5C6B8A" />
        </>
      )}
    </group>
  )
}

type MutationType = 'substitution' | 'insertion' | 'deletion'
const MUTATION_TYPES: { key: MutationType; label: string }[] = [
  { key: 'substitution', label: 'Substitution' },
  { key: 'insertion', label: 'Insertion' },
  { key: 'deletion', label: 'Deletion' },
]

const EFFECT_EXPLAIN: Record<string, string> = {
  silent: 'silent: base changed but the amino acid stays the same',
  missense: 'missense: the amino acid this codon makes changes',
  nonsense: 'nonsense: an early STOP forms — the protein is cut short',
  frameshift: 'frameshift: adding or removing one letter shifts every codon boundary downstream, scrambling the rest of the protein',
}

/** Applies one mutation to a sequence: substitution keeps the length the same (a like-for-like
 *  swap at `index`); insertion adds one base at `index`; deletion removes the base at `index`.
 *  The length change for insertion/deletion is what drives the frameshift downstream. */
function applyMutation(sequence: string, mutationType: MutationType, index: number, replacement: string): string {
  if (mutationType === 'insertion') return sequence.slice(0, index) + replacement + sequence.slice(index)
  if (mutationType === 'deletion') return sequence.slice(0, index) + sequence.slice(index + 1)
  return sequence.slice(0, index) + replacement + sequence.slice(index + 1)
}

/** Non-overlapping codon groups read from the start of `sequence` (whole codons only, no
 *  trailing partial codon) — used to show how the reading frame regroups after a mutation. */
function codonsFrom(sequence: string): string[] {
  const codons: string[] = []
  for (let i = 0; i + 3 <= sequence.length; i += 3) codons.push(sequence.slice(i, i + 3))
  return codons
}

function MutationScene({
  sequence,
  mutationType,
  mutationIndex,
  mutationBase,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
  effect,
}: {
  sequence: string
  mutationType: MutationType
  mutationIndex: number
  mutationBase: string
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
  effect: { label: string; color: string }
}) {
  // Actually apply the mutation to the sequence: substitution keeps the same length, insertion
  // adds a base, deletion removes one — the helix below is rebuilt at the new length so the
  // length change is visible, not just a same-slot swap.
  const mutatedSequence = useMemo(
    () => applyMutation(sequence, mutationType, mutationIndex, mutationBase),
    [sequence, mutationType, mutationIndex, mutationBase],
  )
  const count = mutatedSequence.length
  const rungs = helixRungPositions(count)
  const dim = (id: string) => isolateActive && selectedPart !== id
  const affectedIndex = Math.min(mutationIndex, count - 1)
  const inserted = mutationType === 'insertion' ? mutationBase : null
  const deletedBase = mutationType === 'deletion' ? sequence[mutationIndex] : null
  const mutSiteId = `mut-site-${mutationType}`

  // Reading frame from the start of the affected codon onward: a substitution never moves a
  // codon boundary, so only that one codon differs. Insertion/deletion change the base count,
  // so every codon boundary from here on shifts — the frameshift ripple this scene must show.
  const frameStart = Math.floor(mutationIndex / 3) * 3
  const codonsBefore = codonsFrom(sequence.slice(frameStart))
  const codonsAfter = codonsFrom(mutatedSequence.slice(frameStart))
  const aminoBefore = codonsBefore.map(TRANSLATE)
  const aminoAfter = codonsAfter.map(TRANSLATE)

  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <DnaBackbone count={count} phase={0} color="#A98F6B" onSelect={() => onSelectPart('mut-backbone')} dim={dim('mut-backbone')} />
      <DnaBackbone count={count} phase={Math.PI} color="#A98F6B" onSelect={() => onSelectPart('mut-backbone')} dim={dim('mut-backbone')} />
      <DnaRungs
        sequence={mutatedSequence}
        selectedIndex={null}
        onSelect={() => undefined}
        dimOthers={false}
      />
      {deletedBase && (
        <group position={[rungs[affectedIndex]?.from[0] ?? 0, (rungs[affectedIndex]?.from[1] ?? 0) + 0.35, 0.55]}>
          <mesh>
            <sphereGeometry args={[0.12, 18, 18]} />
            <meshStandardMaterial color="#8B7A68" transparent opacity={0.6} />
          </mesh>
          <ChipLabel text={`deleted ${deletedBase} → strand is now ${count} bases`} position={[0.55, 0.1, 0]} color="#8B7A68" />
        </group>
      )}
      <Marker
        position={[rungs[affectedIndex].from[0] - 0.1, rungs[affectedIndex].from[1] + 0.25, 0.6]}
        color={effect.color}
        active
        label={labelsVisible ? (inserted ? `inserted ${inserted} → ${effect.label}` : deletedBase ? `deleted ${deletedBase} → ${effect.label}` : `${mutationType} at base ${mutationIndex + 1} → ${effect.label}`) : undefined}
        onSelect={() => onSelectPart(mutSiteId)}
        dim={dim(mutSiteId)}
      />
      {inserted && (
        <Marker position={[rungs[affectedIndex].from[0] + 0.3, rungs[affectedIndex].from[1], 0.55]} color={NUCLEOTIDE_COLORS[inserted]} label={labelsVisible ? `${inserted} inserted → strand is now ${count} bases` : undefined} />
      )}
      {labelsVisible && (
        <>
          {/* Stacked tighter and higher than the -1.95..-2.35 range used before: that range sat at
              the very bottom edge of the camera frame, right behind the always-present bottom
              canvas overlay (meter row / Tune panel), so these frameshift labels never rendered
              visibly (Wave 8 QA bug #2). Live-verified against the bottom meter-row overlay at
              1440x900: -1.72/-1.88/-2.04 still brushed the overlay on the deepest line, so this
              is tightened and raised once more to -1.60/-1.74/-1.88, clearing it with margin. */}
          <ChipLabel
            text={mutationType === 'substitution' ? 'one base changed → only the codon it sits in changes' : `${mutationType === 'insertion' ? 'one base added' : 'one base removed'} → every codon after base ${mutationIndex + 1} shifts`}
            position={[0, -1.6, 0.35]}
            color="#A64E43"
          />
          <ChipLabel
            text={mutationType === 'substitution'
              ? `codon before: ${codonsBefore[0] ?? ''} → after: ${codonsAfter[0] ?? ''}`
              : `frame before: ${codonsBefore.join(' ')} → after: ${codonsAfter.join(' ')}`}
            position={[0, -1.74, 0.35]}
            color="#277E98"
          />
          <ChipLabel
            text={mutationType === 'substitution' ? (EFFECT_EXPLAIN[effect.label] ?? effect.label) : `protein: ${aminoBefore.join('-') || '(none)'} → ${aminoAfter.join('-') || '(none)'}`}
            position={[0, -1.88, 0.35]}
            color={effect.color}
          />
        </>
      )}
    </group>
  )
}

function TranscriptionScene({
  sequence,
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  sequence: string
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const count = sequence.length
  const dim = (id: string) => isolateActive && selectedPart !== id
  const transcribed = Math.floor(progress * count)
  const mrna = sequence.slice(0, transcribed).split('').map((base) => COMPLEMENT[base] ?? base).join('')
  const codons = mrna.match(/.{3}/g) ?? []
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <DnaBackbone count={count} phase={0} color="#A98F6B" onSelect={() => onSelectPart('tx-dna')} dim={dim('tx-dna')} />
      <DnaBackbone count={count} phase={Math.PI} color="#A98F6B" dim={dim('tx-dna')} />
      <DnaRungs sequence={sequence} selectedIndex={null} onSelect={() => undefined} dimOthers={false} />
      <Strand
        points={Array.from({ length: transcribed + 1 }, (_, index) => [index * 0.3 - 0.8, -1.72, 0.45] as [number, number, number])}
        color="#277E98"
        radius={0.05}
        onSelect={() => onSelectPart('tx-mrna')}
        dim={dim('tx-mrna')}
      />
      {codons.length > 0 && (
        <group position={[0, -1.72, 0.75]}>
          {codons.map((codon, index) => (
            <Billboard key={index} position={[index * 0.3 - 0.8, 0, 0]}>
              <Text fontSize={0.11} color="#277E98" anchorX="center" anchorY="middle">{codon}</Text>
            </Billboard>
          ))}
        </group>
      )}
      <Marker position={[0.55, 0.2, 0.6]} color="#7FA86A" label={labelsVisible ? 'RNA polymerase' : undefined} onSelect={() => onSelectPart('tx-polymerase')} dim={dim('tx-polymerase')} />
      {labelsVisible && (
        <>
          <ChipLabel text="DNA" position={[-1.6, 1.2, 0.3]} color="#A98F6B" />
          <ChipLabel text="mRNA (T → U) leaves to the ribosome" position={[0, -2.05, 0.5]} color="#277E98" />
        </>
      )}
    </group>
  )
}

function ProteinScene({
  sequence,
  folded,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  sequence: string
  folded: boolean
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const mrna = sequence.split('').map((base) => COMPLEMENT[base] ?? base).join('')
  const codons = mrna.match(/.{3}/g) ?? []
  const aminoAcids = codons.map((codon) => TRANSLATE(codon)).filter((amino) => amino !== 'STOP')
  const dim = (id: string) => isolateActive && selectedPart !== id
  const SHELF = [
    [0, 0, 0], [0.5, 0.1, 0.12], [1.0, -0.1, -0.1], [1.5, 0.12, 0.05],
    [2.0, -0.08, 0.18], [2.5, 0.15, -0.05], [3.0, 0.0, 0.1], [3.5, -0.1, 0.2],
  ]
  const FOLD = [
    [0, 0, 0], [0.22, 0.3, 0.12], [0.05, 0.55, 0.3], [-0.25, 0.5, 0.32],
    [-0.45, 0.25, 0.2], [-0.4, -0.15, 0.05], [-0.12, -0.3, -0.12], [0.2, -0.25, -0.2],
    [0.42, 0.0, -0.08], [0.15, 0.55, 0.5],
  ]
  const spots = folded ? FOLD : SHELF
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      {aminoAcids.map((amino, index) => (
        <group key={index} position={[spots[index % spots.length][0] - (folded ? 0 : 1.5), spots[index % spots.length][1] + 0.2, spots[index % spots.length][2]]}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.16, 20, 20]} />
            <meshStandardMaterial color="#C08868" roughness={0.6} transparent={dim('protein-chain')} opacity={dim('protein-chain') ? 0.2 : 1} emissive="#C08868" emissiveIntensity={index === 0 ? 0.35 : 0.05} />
          </mesh>
          {labelsVisible && (
            <Billboard position={[0, 0.28, 0]}>
              <Text fontSize={0.1} color="#8A5A44" anchorX="center" anchorY="middle">{amino}</Text>
            </Billboard>
          )}
          {index > 0 && (
            <Line points={[[spots[(index - 1) % spots.length][0] - (folded ? 0 : 1.5), spots[(index - 1) % spots.length][1] + 0.2, spots[(index - 1) % spots.length][2]], [spots[index % spots.length][0] - (folded ? 0 : 1.5), spots[index % spots.length][1] + 0.2, spots[index % spots.length][2]]]} color="#A08068" lineWidth={2} transparent opacity={0.6} />
          )}
        </group>
      ))}
      <Marker position={folded ? [0.7, -0.8, 0.2] : [1.6, -1.0, 0.2]} color="#6B85A8" label={labelsVisible ? (folded ? 'folded shape' : 'unfolded chain') : undefined} onSelect={() => onSelectPart('protein-fold')} dim={dim('protein-fold')} />
      {labelsVisible && (
        <ChipLabel text={folded ? 'every protein folds into a unique 3D shape → that shape determines function' : 'a protein is a chain of amino acids (here: peptide bonds in between)'} position={[0, -1.9, 0.35]} color="#5C6B8A" />
      )}
    </group>
  )
}

function ChromosomeScene({
  selectedArm,
  onSelectArm,
  labelsVisible,
  showDnaCoil,
  isolateActive,
}: {
  selectedArm: string | null
  onSelectArm: (arm: string) => void
  labelsVisible: boolean
  showDnaCoil: boolean
  isolateActive: boolean
}) {
  const dim = (id: string) => isolateActive && selectedArm !== id
  const armTopLeft: [number, number, number][] = [[-0.05, 0, 0], [-0.75, 0.55, 0], [-0.95, 1.5, 0]]
  const armTopRight: [number, number, number][] = [[0.05, 0, 0], [0.75, 0.55, 0], [0.95, 1.5, 0]]
  const armBottomLeft: [number, number, number][] = [[-0.05, 0, 0], [-0.55, -0.6, 0], [-0.7, -1.4, 0]]
  const armBottomRight: [number, number, number][] = [[0.05, 0, 0], [0.55, -0.6, 0], [0.7, -1.4, 0]]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <group onClick={(event) => { event.stopPropagation(); onSelectArm('chromatid') }}>
        <Strand points={armTopLeft} color="#7A6A55" dim={dim('chromatid')} />
        <Strand points={armTopRight} color="#7A6A55" dim={dim('chromatid')} />
        <Strand points={armBottomLeft} color="#7A6A55" dim={dim('chromatid')} />
        <Strand points={armBottomRight} color="#7A6A55" dim={dim('chromatid')} />
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectArm('centromere') }}>
        <mesh position={[0, 0, 0.02]}>
          <cylinderGeometry args={[0.26, 0.26, 0.16, 24]} />
          <meshStandardMaterial color="#D9A441" roughness={0.6} transparent={dim('centromere')} opacity={dim('centromere') ? 0.2 : 1} />
        </mesh>
      </group>
      {showDnaCoil && (
        <group position={[0.95, 1.5, 0.18]}>
          <Line points={[[0, 0, 0], [0.25, 0.35, 0], [0.15, 0.7, 0], [0.4, 1.05, 0]]} color="#A98F6B" lineWidth={3} />
          <ChipLabel text="coiled DNA" position={[0.55, 0.55, 0]} color="#8A6A45" />
        </group>
      )}
      <Marker position={[0.95, 1.5, 0.22]} color="#D0A21E" label={labelsVisible ? 'chromatid' : undefined} onSelect={() => onSelectArm('chromatid')} dim={dim('chromatid')} />
      <Marker position={[0, 0.05, 0.22]} color="#C08868" label={labelsVisible ? 'centromere' : undefined} onSelect={() => onSelectArm('centromere')} dim={dim('centromere')} />
      {labelsVisible && (
        <ChipLabel text="chromosome = two identical sister chromatids joined at the centromere" position={[0, -1.95, 0.35]} color="#5C6B8A" />
      )}
    </group>
  )
}

// ── genetics studio scenes (cards, flowers, Punnett grid) ───────────────────
function AlleleScene({
  pairing,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  pairing: 'homozygous-dominant' | 'heterozygous' | 'homozygous-recessive'
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const alleles: Record<string, [string, string]> = {
    'homozygous-dominant': ['P', 'P'],
    'heterozygous': ['P', 'p'],
    'homozygous-recessive': ['p', 'p'],
  }
  const [first, second] = alleles[pairing]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('allele-pair') }}>
        <mesh position={[-0.75, 0, 0]}>
          <boxGeometry args={[0.55, 0.75, 0.12]} />
          <meshStandardMaterial color={first === 'P' ? '#C08868' : '#C9BFA9'} roughness={0.7} transparent={dim('allele-pair')} opacity={dim('allele-pair') ? 0.25 : 1} />
        </mesh>
        <Billboard position={[-0.75, 0, 0.12]}>
          <Text fontSize={0.34} color={INK} anchorX="center" anchorY="middle">{first}</Text>
        </Billboard>
        <mesh position={[0.75, 0, 0]}>
          <boxGeometry args={[0.55, 0.75, 0.12]} />
          <meshStandardMaterial color={second === 'P' ? '#C08868' : '#C9BFA9'} roughness={0.7} transparent={dim('allele-pair')} opacity={dim('allele-pair') ? 0.25 : 1} />
        </mesh>
        <Billboard position={[0.75, 0, 0.12]}>
          <Text fontSize={0.34} color={INK} anchorX="center" anchorY="middle">{second}</Text>
        </Billboard>
      </group>
      <Marker position={[-0.75, 1.1, 0.15]} color="#C08868" label={labelsVisible ? (first === 'P' ? 'dominant allele' : 'recessive allele') : undefined} onSelect={() => onSelectPart('allele-dominant')} dim={dim('allele-dominant')} />
      <Marker position={[0.75, 1.1, 0.15]} color="#C9BFA9" label={labelsVisible ? (second === 'p' ? 'recessive allele' : 'dominant allele') : undefined} onSelect={() => onSelectPart('allele-recessive')} dim={dim('allele-recessive')} />
      {labelsVisible && (
        <ChipLabel text={pairing === 'heterozygous' ? 'heterozygous: one dominant + one recessive → dominant trait shows' : pairing === 'homozygous-dominant' ? 'homozygous dominant: both copies dominant' : 'homozygous recessive: both copies recessive'} position={[0, -1.85, 0.35]} color="#5C6B8A" />
      )}
    </group>
  )
}

function TraitScene({
  genotype,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  genotype: string
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const flower = (x: number, color: string) => (
    <group key={x} position={[x, -0.65, 0]}>
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 10]} />
        <meshStandardMaterial color="#7FA86A" />
      </mesh>
      {[0, 1, 2, 3, 4].map((petal) => (
        <mesh key={petal} position={[Math.cos((petal / 5) * Math.PI * 2) * 0.11, 0.44, Math.sin((petal / 5) * Math.PI * 2) * 0.11]}>
          <sphereGeometry args={[0.07, 12, 12]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
  const showsPurple = genotype.includes('P')
  const flowerColor = showsPurple ? '#8B5FC6' : '#F4EFE5'
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('trait-phenotype') }}>
        {flower(0, flowerColor)}
      </group>
      <group position={[1.5, 0.6, 0.15]} onClick={(event) => { event.stopPropagation(); onSelectPart('trait-genotype') }}>
        <mesh>
          <boxGeometry args={[0.7, 0.4, 0.12]} />
          <meshStandardMaterial color="#F4EFE5" roughness={0.7} />
        </mesh>
        <Billboard position={[0, 0, 0.12]}>
          <Text fontSize={0.16} color={INK} anchorX="center" anchorY="middle">{genotype}</Text>
        </Billboard>
      </group>
      <Marker position={[0, 1.15, 0.15]} color={flowerColor === '#F4EFE5' ? '#C9BFA9' : '#8B5FC6'} label={labelsVisible ? (showsPurple ? 'purple phenotype (P present)' : 'white phenotype (no P)') : undefined} onSelect={() => onSelectPart('trait-phenotype')} dim={isolateActive && selectedPart !== 'trait-phenotype'} />
      <Marker position={[1.5, 1.25, 0.15]} color="#C08868" label={labelsVisible ? 'genotype: the two alleles' : undefined} onSelect={() => onSelectPart('trait-genotype')} dim={isolateActive && selectedPart !== 'trait-genotype'} />
      {labelsVisible && (
        <ChipLabel text="genotype (alleles) → phenotype (what shows): one P is enough" position={[0, -1.85, 0.35]} color="#5C6B8A" />
      )}
    </group>
  )
}

function PunnettScene({
  parentA,
  parentB,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
}: {
  parentA: string
  parentB: string
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
}) {
  const gametesA = [parentA, parentA]
  const gametesB = [parentB, parentB]
  const cells = gametesA.flatMap((a) => gametesB.map((b) => [a, b].sort().join('')))
  const counts: Record<string, number> = {}
  cells.forEach((cell) => { counts[cell] = (counts[cell] ?? 0) + 1 })
  const dim = (id: string) => isolateActive && selectedPart !== id
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      {gametesA.map((g, row) =>
        gametesB.map((h, col) => {
          const genotype = [g, h].sort().join('')
          return (
            <mesh key={`${row}-${col}`} position={[col * 0.85 - 0.42, 0.5 - row * 0.85, 0.05]} onClick={(event) => { event.stopPropagation(); onSelectPart('punnett-grid') }}>
              <boxGeometry args={[0.75, 0.75, 0.1]} />
              <meshStandardMaterial color={genotype.includes('P') ? '#EFD9EC' : '#F4EFE5'} roughness={0.7} transparent={dim('punnett-grid')} opacity={dim('punnett-grid') ? 0.25 : 1} />
            </mesh>
          )
        }),
      )}
      {gametesA.map((g, row) =>
        gametesB.map((h, col) => (
          <Billboard key={`l-${row}-${col}`} position={[col * 0.85 - 0.42, 0.5 - row * 0.85, 0.12]}>
            <Text fontSize={0.15} color={INK} anchorX="center" anchorY="middle">{[g, h].sort().join('')}</Text>
          </Billboard>
        )),
      )}
      <Marker position={[0, 1.7, 0.2]} color="#7C5CFF" label={labelsVisible ? (parentA === parentB ? `${parentA} × ${parentB}` : `${parentA} × ${parentB}`) : undefined} onSelect={() => onSelectPart('punnett-parents')} dim={dim('punnett-parents')} />
      <group position={[0, -1.55, 0.1]}>
        {Object.entries(counts).map(([genotype, amount], index) => (
          <group key={genotype} position={[index * 1.6 - 0.8, 0, 0]}>
            <mesh position={[0, 0.18, 0]}>
              <boxGeometry args={[0.55, Math.max(0.16, amount * 0.34), 0.1]} />
              <meshStandardMaterial color="#8B5FC6" transparent opacity={0.85} />
            </mesh>
            <Billboard position={[0, 0.5, 0]}>
              <Text fontSize={0.12} color={INK} anchorX="center" anchorY="middle">{genotype} {amount}/4</Text>
            </Billboard>
          </group>
        ))}
      </group>
      {labelsVisible && (
        <ChipLabel text={`each parent passes one allele → offspring ${parentA} and ${parentB} combos: ${Object.entries(counts).map(([g, a]) => `${g} ${a}/4`).join(' · ')}`} position={[0, -2.1, 0.35]} color="#5C6B8A" />
      )}
    </group>
  )
}

// ── scene router ────────────────────────────────────────────────────────────
/** Advances replication/transcription progress while the shared Play control is on.
 *  Calls are throttled to ~8–10 Hz so React state updates stay cheap. */
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

type GeneticsSceneProps = {
  activeId: string
  selectedPart: string | null
  onSelectPart: (part: string) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  dnaSequence: string
  dnaRealStructure: boolean
  selectedRung: number | null
  onSelectRung: (index: number) => void
  mutationType: MutationType
  mutationIndex: number
  mutationBase: string
  mutationEffectResult: { label: string; color: string }
  pairing: 'homozygous-dominant' | 'heterozygous' | 'homozygous-recessive'
  genotype: string
  parentA: string
  parentB: string
  replicationProgress: number
  transcriptionProgress: number
  proteinFolded: boolean
  geneRegion: string | null
  onSelectGeneRegion: (region: string) => void
  showDnaCoil: boolean
  selectedArm: string | null
  onSelectArm: (arm: string) => void
  onAnimationTick: (delta: number) => void
}

function GeneticsScene(props: GeneticsSceneProps) {
  const { activeId, autoRotate, labelsVisible, cameraDistance } = props
  const tick = useMemo(() => props.onAnimationTick, [props.onAnimationTick])
  return (
    <Canvas
      camera={{ position: [0, 0.35, cameraDistance], fov: 38 }}
      dpr={[1, 2]}
      // preserveDrawingBuffer: a resize/layout race that skips or delays a single frame would
      // otherwise show as a fully blank canvas (the WebGL buffer auto-clears with nothing drawn
      // yet); preserving the buffer means the last painted frame stays on screen until the next
      // render lands, instead of flashing blank. Fixes the intermittent blank-canvas repro after
      // rapid Tune-panel open/close + control toggles (Wave 8 QA bug #3).
      gl={{ preserveDrawingBuffer: true }}
      onPointerMissed={() => props.onSelectPart('none')}
    >
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={1.15} />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.65} minDistance={5.8} maxDistance={11} />
      <AnimationDriver playing={props.animationPlaying && ANIMATED_COMPONENTS.has(activeId)} onTick={tick} />
      <ResponsiveGeneticsGroup>
        {activeId === 'dna' && (
          props.dnaRealStructure ? (
            <DnaRealStructureScene selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />
          ) : (
            <DnaScene sequence={props.dnaSequence} selectedRung={props.selectedRung} onSelectRung={props.onSelectRung} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} selectedPart={props.selectedPart} />
          )
        )}
        {activeId === 'dna-replication' && <ReplicationScene progress={props.replicationProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'gene' && <GeneScene sequence={props.dnaSequence.slice(0, 10)} selectedRegion={props.geneRegion} onSelectRegion={props.onSelectGeneRegion} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'mutation' && <MutationScene sequence={props.dnaSequence.slice(0, 12)} mutationType={props.mutationType} mutationIndex={props.mutationIndex} mutationBase={props.mutationBase} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} effect={props.mutationEffectResult} />}
        {activeId === 'transcription-translation' && <TranscriptionScene sequence={props.dnaSequence.slice(0, 9)} progress={props.transcriptionProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'protein' && <ProteinScene sequence={props.dnaSequence.slice(0, 12)} folded={props.proteinFolded} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'chromosome' && <ChromosomeScene selectedArm={props.selectedArm} onSelectArm={props.onSelectArm} labelsVisible={labelsVisible} showDnaCoil={props.showDnaCoil} isolateActive={props.isolateActive} />}
        {activeId === 'allele' && <AlleleScene pairing={props.pairing} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'trait' && <TraitScene genotype={props.genotype} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
        {activeId === 'inheritance-punnett-squares' && <PunnettScene parentA={props.parentA} parentB={props.parentB} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} />}
      </ResponsiveGeneticsGroup>
    </Canvas>
  )
}

function ResponsiveGeneticsGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.52 : viewport.aspect < 1 ? 0.72 : 1
  return <group scale={scale}>{children}</group>
}

// ── primary lab ─────────────────────────────────────────────────────────────
type LabPart = string

const PART_META: Record<LabPart, { label: string; color: string }> = {
  'dna-helix': { label: 'Double Helix', color: '#D0A21E' },
  'dna-backbone': { label: 'Sugar-Phosphate Backbone', color: '#A98F6B' },
  'dna-basepairs': { label: 'Base Pairs (A–T, C–G)', color: '#D9A441' },
  'dna-major-groove': { label: 'Major Groove', color: '#6B85A8' },
  'dna-minor-groove': { label: 'Minor Groove', color: '#8B5FC6' },
  'repl-original': { label: 'Strands Separate', color: '#7A6A55' },
  'repl-new': { label: 'New Strands Built', color: '#D9A441' },
  'repl-fork': { label: 'Replication Fork', color: '#D96B5A' },
  'gene-helix': { label: 'Segment of DNA', color: '#D0A21E' },
  'gene-promoter': { label: 'Promoter region', color: '#D9A441' },
  'gene-coding': { label: 'Coding sequence', color: '#6B85A8' },
  'mut-backbone': { label: 'Sugar-Phosphate Backbone', color: '#A98F6B' },
  'mut-site-substitution': { label: 'Substitution mutation', color: '#C08868' },
  'mut-site-insertion': { label: 'Insertion mutation', color: '#C08868' },
  'mut-site-deletion': { label: 'Deletion mutation', color: '#C08868' },
  'tx-dna': { label: 'DNA template', color: '#A98F6B' },
  'tx-mrna': { label: 'mRNA transcript', color: '#277E98' },
  'tx-polymerase': { label: 'RNA polymerase', color: '#7FA86A' },
  'protein-chain': { label: 'Amino Acid Chain', color: '#C08868' },
  'protein-fold': { label: 'Folded 3D Shape', color: '#6B85A8' },
  'chromatid': { label: 'Chromatid', color: '#D0A21E' },
  'centromere': { label: 'Centromere', color: '#C08868' },
  'allele-pair': { label: 'Homozygous Pairing', color: '#C08868' },
  'allele-dominant': { label: 'Dominant Allele', color: '#C08868' },
  'allele-recessive': { label: 'Recessive Allele', color: '#C9BFA9' },
  'trait-genotype': { label: 'Genotype', color: '#C08868' },
  'trait-phenotype': { label: 'Phenotype', color: '#8B5FC6' },
  'punnett-parents': { label: 'Parent alleles combine', color: '#7C5CFF' },
  'punnett-grid': { label: 'Punnett square grid', color: '#8B5FC6' },
}

const ANIMATED_COMPONENTS = new Set(['dna-replication', 'transcription-translation'])

const PAIRINGS = ['homozygous-dominant', 'heterozygous', 'homozygous-recessive'] as const

function mutationEffect(original: string, mutationType: MutationType, index: number, replacement: string) {
  if (mutationType !== 'substitution') {
    // Insertion and deletion change the base count, so every codon boundary from the mutation
    // point on reads differently — a frameshift, independent of which base was added/removed.
    return { label: 'frameshift', color: '#B23A5C' }
  }
  const mutated = applyMutation(original, mutationType, index, replacement)
  const codonStart = Math.floor(index / 3) * 3
  const originalCodon = original.slice(codonStart, codonStart + 3)
  const changedCodon = mutated.slice(codonStart, codonStart + 3)
  const before = TRANSLATE(originalCodon)
  const after = TRANSLATE(changedCodon)
  if (before === after) return { label: 'silent', color: '#7FA86A' }
  if (after === 'STOP') return { label: 'nonsense', color: '#D96B5A' }
  return { label: 'missense', color: '#D9A441' }
}

type ChallengeStep = 'observe' | 'predict' | 'change' | 'explain' | 'check'
const CHALLENGE_STEPS: { key: ChallengeStep; label: string }[] = [
  { key: 'observe', label: 'Observe' },
  { key: 'predict', label: 'Predict' },
  { key: 'change', label: 'Change' },
  { key: 'explain', label: 'Explain' },
  { key: 'check', label: 'Check' },
]
type ChallengeMission = Record<ChallengeStep, string> & {
  mission: string
  outcome: string
}

/** Short, collapsible guided-inquiry prompts, one per genetics component, that point at
 *  controls already on screen (Tune molecule panel, More menu, or a direct 3D tap). */
const CHALLENGES: Record<string, ChallengeMission> = {
  'dna': {
    mission: 'Base-pair decoder',
    outcome: 'Changing one DNA base changes only its complementary partner: A pairs with T, and C pairs with G.',
    observe: 'Two twisted backbones connected by colored rungs.',
    predict: 'Before you tap a rung, predict the partner base: if this side is A, what must the other side become? What about C?',
    change: 'Tap a rung, then open More → Show labels.',
    explain: 'Each rung is two paired bases: A always pairs with T, C always pairs with G.',
    check: 'The label on your rung should read A next to T, or C next to G.',
  },
  'dna-replication': {
    mission: 'Replication copy audit',
    outcome: 'Changing the template base changes the new complementary base, while each finished helix keeps one original strand.',
    observe: 'The point (the fork) where the helix is splitting into two strands.',
    predict: 'Pick one exposed original base and predict the matching new base that has to be built across from it.',
    change: 'Press "Step forward" in Tune molecule a few times until both new strands finish.',
    explain: 'Replication is semi-conservative: every finished helix keeps one old strand plus one new one.',
    check: 'Tap a gold new strand once it finishes — its label should say "semi-conservative".',
  },
  'gene': {
    mission: 'Gene switch test',
    outcome: 'Changing a coding-region base can change the protein recipe; changing a promoter changes whether/where the gene is read.',
    observe: 'The gold promoter block and the blue coding-sequence block on the helix.',
    predict: 'Predict which edit changes the protein recipe directly: promoter block or coding-sequence block?',
    change: 'Tap the promoter box, then tap the coding-sequence box.',
    explain: 'The promoter tells the cell where to start reading; only the coding sequence becomes protein.',
    check: 'Selecting the coding box should show "gene = the stretch of DNA that codes a protein".',
  },
  'mutation': {
    mission: 'Mutation consequence lab',
    outcome: 'A base substitution can be silent, missense, or nonsense; an insertion/deletion shifts later codons as a frameshift.',
    observe: 'The colored marker sitting on the base that is about to change.',
    predict: 'Before you change it, guess: silent, missense, nonsense, or frameshift?',
    change: 'Try Substitution with a different "New base", then try Deletion at the same spot.',
    explain: 'A substitution can leave the amino acid the same (silent), swap it (missense), or create an early STOP (nonsense) — but it never changes the strand\'s length. Insertion and deletion do change the length, which shifts the reading frame for every codon after the mutation (frameshift).',
    check: 'The marker color and the Effect meter should now match — green silent, amber missense, red nonsense, or magenta frameshift for insertion/deletion. The base count in the strand should also grow by one for insertion, shrink by one for deletion.',
  },
  'transcription-translation': {
    mission: 'Message-to-protein trace',
    outcome: 'Changing DNA changes the mRNA copy, which can change codons and then the amino-acid chain the ribosome builds.',
    observe: 'The teal mRNA strand growing underneath the DNA template.',
    predict: 'Predict the mRNA letter copied from each DNA base, then predict whether the codon will change the amino acid.',
    change: 'Press "Step forward" in Tune molecule until codons appear under the strand.',
    explain: 'RNA polymerase copies DNA into mRNA (swapping T for U); ribosomes then read the mRNA three bases at a time.',
    check: 'The mRNA-so-far text in the side panel should contain only A, U, C, G — no T.',
  },
  'protein': {
    mission: 'Fold-function challenge',
    outcome: 'Changing an amino acid can change how the chain folds; changing the fold changes the protein function it can perform.',
    observe: 'The chain of amino-acid beads, currently laid out flat on a shelf.',
    predict: 'Predict whether the same amino-acid chain does the same job when it stays unfolded.',
    change: 'Tap the Fold / Unfold button in Tune molecule.',
    explain: 'A protein\'s 3D fold — not just its list of amino acids — decides what job it can do.',
    check: 'The chain should bend into a compact 3D shape instead of a straight shelf.',
  },
  'chromosome': {
    mission: 'Chromosome packaging probe',
    outcome: 'Changing chromosome structure changes which packaged genes are carried, copied, and separated during cell division.',
    observe: 'Two arms joined together at a gold centromere disc.',
    predict: 'Predict what would be lost if a gene segment on one chromatid arm were deleted before division.',
    change: 'Tap "Show DNA coil" in Tune molecule, then tap the centromere.',
    explain: 'A chromosome is DNA coiled so tightly it becomes a visible X shape; the two sister chromatids are identical copies.',
    check: 'A "coiled DNA" label should appear near the chromatid tip you tapped.',
  },
  'allele': {
    mission: 'Allele pairing predictor',
    outcome: 'Changing one allele can switch a genotype between homozygous and heterozygous, which can reveal or mask a trait.',
    observe: 'Two allele tiles side by side, colored by whether each is dominant.',
    predict: 'Before switching one allele from P to p, predict whether the trait stays dominant or becomes recessive.',
    change: 'Try all three pairings in Tune molecule: homozygous dominant, heterozygous, homozygous recessive.',
    explain: 'Only heterozygous pairs one dominant allele with one recessive allele — the other two pairings match.',
    check: 'Tile colors should match for both homozygous options, and differ only for heterozygous.',
  },
  'trait': {
    mission: 'Genotype-to-trait test',
    outcome: 'Changing genotype from PP/Pp to pp removes the dominant allele, so the visible trait changes from purple to white.',
    observe: 'The flower\'s color and the genotype tag beside it.',
    predict: 'Before tapping "pp", guess whether the flower stays purple.',
    change: 'Tap PP, then Pp, then pp in Tune molecule.',
    explain: 'One dominant P allele is enough to show purple — only pp (no P at all) shows white.',
    check: 'The flower should turn white only on pp; PP and Pp should both stay purple.',
  },
  'inheritance-punnett-squares': {
    mission: 'Punnett outcome forecast',
    outcome: 'Changing a parent allele changes the four possible offspring genotypes and their visible trait ratios.',
    observe: 'The 2×2 grid and the offspring bars underneath it.',
    predict: 'Before changing a parent allele, predict how many of the 4 offspring boxes will show PP, Pp, or pp.',
    change: 'Switch Parent 1 and Parent 2 alleles in Tune molecule (try P × p, then p × p).',
    explain: 'Each parent contributes one allele; the grid shows every possible combination of the two.',
    check: 'The offspring bars at the bottom should update to match the new grid.',
  },
}

function MissionStrip({ activeId, onOpen }: { activeId: string; onOpen: () => void }) {
  const challenge = CHALLENGES[activeId]
  if (!challenge) return null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="pointer-events-auto grid min-w-0 gap-1 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-3 py-2 text-left shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:max-w-[24rem]"
    >
      <span className="flex min-w-0 items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-biology-deep)]">
        <ListChecks className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
        <span className="truncate">Mission · {challenge.mission}</span>
      </span>
      <span className="line-clamp-2 text-xs leading-snug text-[color:var(--color-ink-700)]">{challenge.outcome}</span>
    </button>
  )
}

function ChallengeCard({ activeId, onClose }: { activeId: string; onClose: () => void }) {
  const challenge = CHALLENGES[activeId]
  if (!challenge) return null
  return (
    <div className="grid max-h-[40vh] gap-2.5 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Guided challenge · {activeId.replace(/-/g, ' ')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide guided challenge"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs font-semibold text-[color:var(--color-foreground)]">{challenge.mission}</p>
        <p className="mt-1 text-xs leading-snug text-[color:var(--color-ink-500)]">{challenge.outcome}</p>
      </div>
      <ol className="grid gap-1.5">
        {CHALLENGE_STEPS.map(({ key, label }) => (
          <li key={key} className="flex gap-2 text-xs leading-snug text-[color:var(--color-ink-700)]">
            <span className="shrink-0 font-semibold text-[color:var(--color-biology-deep)]">{label}</span>
            <span>{challenge[key]}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default function GeneticsLab() {
  const [activeId, setActiveId] = useState('dna')
  const [selectedPart, setSelectedPart] = useState<LabPart | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(7.6)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [challengeOpen, setChallengeOpen] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const [dnaSequence] = useState(DEFAULT_SEQUENCE)
  const [dnaRealStructure, setDnaRealStructure] = useState(false)
  const [selectedRung, setSelectedRung] = useState<number | null>(null)
  const [mutationType, setMutationType] = useState<MutationType>('substitution')
  const [mutationIndex, setMutationIndex] = useState(3)
  const [mutationBase, setMutationBase] = useState('G')
  const [pairing, setPairing] = useState<(typeof PAIRINGS)[number]>('heterozygous')
  const [genotype, setGenotype] = useState('Pp')
  const [parentA, setParentA] = useState('P')
  const [parentB, setParentB] = useState('p')
  const [replicationProgress, setReplicationProgress] = useState(0.15)
  const [transcriptionProgress, setTranscriptionProgress] = useState(0.12)
  const replicationAccumulator = useRef(0)
  const transcriptionAccumulator = useRef(0)
  const stageRef = useRef<HTMLDivElement>(null)

  // Safety net for the R3F canvas going blank after rapid layout-affecting toggles (Tune panel
  // open/close, control changes) — Wave 8 QA bug #3. R3F resizes on its own, but observed size
  // changes here force an immediate `invalidate()` so a render is never left pending past the
  // moment the stage's box actually changes, instead of waiting on the next incidental frame.
  useEffect(() => {
    const node = stageRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => invalidate())
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleAnimationTick = useCallback((delta: number) => {
    replicationAccumulator.current += delta
    let steps = Math.floor(replicationAccumulator.current / 0.1)
    if (steps > 0) {
      replicationAccumulator.current -= steps * 0.1
      setReplicationProgress((progress) => Math.min(1, progress + 0.12 * steps * 0.1))
    }
    transcriptionAccumulator.current += delta
    steps = Math.floor(transcriptionAccumulator.current / 0.1)
    if (steps > 0) {
      transcriptionAccumulator.current -= steps * 0.1
      setTranscriptionProgress((progress) => Math.min(1, progress + 0.15 * steps * 0.1))
    }
  }, [])
  const [proteinFolded, setProteinFolded] = useState(false)
  const [geneRegion, setGeneRegion] = useState<string | null>(null)
  const [showDnaCoil, setShowDnaCoil] = useState(false)
  const [selectedArm, setSelectedArm] = useState<string | null>(null)

  const activeContent = contentById[activeId] ?? genetics[0]
  const compareTarget = activeContent.compareCandidate ? resolveContent(activeContent.compareCandidate) : null

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

  const effect = useMemo(
    () => mutationEffect(dnaSequence, mutationType, mutationIndex, mutationBase),
    [dnaSequence, mutationType, mutationIndex, mutationBase],
  )

  const mrna = useMemo(() => dnaSequence.split('').map((base) => COMPLEMENT[base] ?? base).join(''), [dnaSequence])
  const aminoAcids = useMemo(() => (mrna.match(/.{3}/g) ?? []).map((codon) => TRANSLATE(codon)).filter((amino) => amino !== 'STOP'), [mrna])
  const offspringRatios = useMemo(() => {
    const cells = [parentA, parentA, parentB, parentB]
      .map((a, index, all) => [a, all[(index + 2) % 4]].sort().join(''))
    const counts: Record<string, number> = {}
    cells.forEach((cell) => { counts[cell] = (counts[cell] ?? 0) + 1 })
    return counts
  }, [parentA, parentB])

  const enhancedContent: ComponentContent = useMemo(() => ({
    ...activeContent,
    keyFacts: [
      { label: 'What you are looking at', value: PART_META[selectedPart ?? 'dna-helix']?.label ?? activeContent.name },
      ...(activeId === 'dna'
        ? [{
            label: 'Base pairs shown',
            value: `${Math.min(DNA_RUNG_COUNT, dnaSequence.length)} · A–T, C–G complementary pairs`,
          }]
        : []),
      ...(activeId === 'mutation'
        ? [{ label: 'Mutation effect', value: `${mutationType} at base ${mutationIndex + 1} → ${effect.label}` }]
        : []),
      ...(activeId === 'protein'
        ? [{ label: 'Amino acid chain', value: aminoAcids.join(' – ') || '(stop before any amino acid)' }]
        : []),
      ...(activeId === 'dna-replication'
        ? [{ label: 'Step', value: replicationProgress < 0.4 ? 'Helix unwinds' : replicationProgress < 0.9 ? 'New strands built' : 'Two identical helices' }]
        : []),
      ...(activeId === 'transcription-translation'
        ? [{ label: 'mRNA so far', value: mrna.slice(0, Math.max(1, Math.floor(transcriptionProgress * mrna.length))) || '…' }]
        : []),
      ...(activeId === 'inheritance-punnett-squares'
        ? [{
            label: 'Offspring genotypes',
            value: Object.entries(offspringRatios).map(([g, n]) => `${g} ${n}/4`).join(' · '),
          }]
        : []),
      ...activeContent.keyFacts.slice(1, 4),
    ],
  }), [activeContent, activeId, aminoAcids, dnaSequence, effect, mrna, mutationIndex, mutationType, offspringRatios, replicationProgress, selectedPart, transcriptionProgress])

  // BottomTray-only copy: same content, but with "Real-world" clamped to a fixed budget so the
  // tray's grid row height stays consistent across every component (dna's short paragraph vs.
  // mutation's much longer one no longer produce a 465px-vs-285px canvas). DetailPanel/Lesson/
  // Quiz still read the full `enhancedContent.whyItMatters` — only the tray cell is clamped.
  const trayContent: ComponentContent = useMemo(
    () => ({ ...enhancedContent, whyItMatters: clampCopy(activeContent.whyItMatters, 170) }),
    [enhancedContent, activeContent.whyItMatters],
  )

  const selectPart = (part: LabPart) => {
    if (part === 'none') {
      setSelectedPart(null)
      return
    }
    setSelectedPart(part)
  }

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
    setChallengeOpen(false)
    setDnaRealStructure(false)
    setSelectedRung(null)
    setMutationType('substitution')
    setMutationIndex(3)
    setMutationBase('G')
    setPairing('heterozygous')
    setGenotype('Pp')
    setParentA('P')
    setParentB('p')
    setReplicationProgress(0.15)
    setTranscriptionProgress(0.12)
    setProteinFolded(false)
    setGeneRegion(null)
    setShowDnaCoil(false)
    setSelectedArm(null)
  }

  const isAnimated = ANIMATED_COMPONENTS.has(activeId)
  const activeIndex = genetics.findIndex((item) => item.id === activeId)
  const selectComponent = (id: string) => {
    setActiveId(id)
    setSelectedPart(null)
    setChallengeOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={DnaIcon}
            branchName="Genetics"
            items={genetics.map((item) => ({ id: item.id, name: item.name, meta: item.system }))}
            activeItemId={activeId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship genetics lab: the DNA molecule, its replication, mutation, proteins, and inheritance are interactive."
          />
        </aside>

        <div ref={stageRef} data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
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
            animationAvailable={isAnimated}
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setCameraDistance(7.6)}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              {activeId === 'dna' && dnaRealStructure
                ? 'Real B-DNA structure · PDB 1BNA · NIH 3D · CC-BY 4.0'
                : 'Genetics · tap molecules · trace how traits pass down'}
            </div>
          </div>

          <GeneticsScene
            activeId={activeId}
            selectedPart={selectedPart}
            onSelectPart={selectPart}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            dnaSequence={dnaSequence}
            dnaRealStructure={dnaRealStructure}
            selectedRung={selectedRung}
            onSelectRung={(index) => { setSelectedRung(index); setSelectedPart(index >= 0 ? 'dna-backbone' : 'dna-helix') }}
            mutationType={mutationType}
            mutationIndex={mutationIndex}
            mutationBase={mutationBase}
            mutationEffectResult={effect}
            pairing={pairing}
            genotype={genotype}
            parentA={parentA}
            parentB={parentB}
            replicationProgress={replicationProgress}
            transcriptionProgress={transcriptionProgress}
            proteinFolded={proteinFolded}
            geneRegion={geneRegion}
            onSelectGeneRegion={setGeneRegion}
            showDnaCoil={showDnaCoil}
            selectedArm={selectedArm}
            onSelectArm={setSelectedArm}
            onAnimationTick={handleAnimationTick}
          />

          {/* per-component tune panel — docks to the right of the canvas (not on top of it) once
              there's room at lg+, and is height-capped with internal scroll below that, so the
              DNA/mutation scene stays visible while it's open instead of being covered. */}
          <div
            data-canvas-overlay
            className={cn(
              'absolute z-10',
              controlsOpen
                ? 'inset-x-3 bottom-3 z-20 max-h-[45%] overflow-y-auto sm:left-24 sm:right-4 lg:inset-x-auto lg:top-20 lg:bottom-3 lg:right-4 lg:w-[21rem] lg:max-h-none'
                : 'bottom-3 left-3 right-3 sm:left-24 sm:right-4',
            )}
          >
            {!controlsOpen && !challengeOpen ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-[40rem] sm:flex-row sm:items-stretch">
                  <div className="grid grid-cols-3 gap-2 sm:w-[21rem] sm:shrink-0">
                    <Meter label="Molecule" value={activeContent.name} />
                    {activeId === 'dna' && <Meter label="Pairs" value={`${Math.min(DNA_RUNG_COUNT, dnaSequence.length)}`} />}
                    {activeId === 'dna' && <Meter label="View" value={dnaRealStructure ? 'real structure' : 'schematic'} />}
                    {activeId === 'dna-replication' && <Meter label="Fork" value={replicationProgress < 0.9 ? `${Math.round(replicationProgress * 100)}%` : 'done'} />}
                    {activeId === 'mutation' && <Meter label="Effect" value={effect.label} />}
                    {activeId === 'protein' && <Meter label="Shape" value={proteinFolded ? 'folded' : 'unfolded'} />}
                    {activeId === 'inheritance-punnett-squares' && <Meter label="Offspring" value={`${parentA}${parentB} combos`} />}
                    {activeId === 'trait' && <Meter label="Genotype" value={genotype} />}
                    {activeId === 'allele' && <Meter label="Pairing" value={pairing.replace(/-/g, ' ')} />}
                  </div>
                  <MissionStrip activeId={activeId} onOpen={() => setChallengeOpen(true)} />
                </div>
                <div className="flex justify-end gap-2 sm:justify-start">
                  {CHALLENGES[activeId] && (
                    <button
                      type="button"
                      onClick={() => setChallengeOpen(true)}
                      className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                    >
                      <ListChecks className="h-4 w-4" strokeWidth={1.8} />
                      Challenge
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setControlsOpen(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                    Tune molecule
                  </button>
                </div>
              </div>
            ) : challengeOpen ? (
              <ChallengeCard activeId={activeId} onClose={() => setChallengeOpen(false)} />
            ) : (
              <TunePanel
                activeId={activeId}
                dnaRealStructure={dnaRealStructure}
                setDnaRealStructure={setDnaRealStructure}
                mutationType={mutationType}
                setMutationType={setMutationType}
                mutationIndex={mutationIndex}
                setMutationIndex={setMutationIndex}
                mutationBase={mutationBase}
                setMutationBase={setMutationBase}
                mutationEffectLabel={effect.label}
                pairing={pairing}
                setPairing={setPairing}
                genotype={genotype}
                setGenotype={setGenotype}
                parentA={parentA}
                setParentA={setParentA}
                parentB={parentB}
                setParentB={setParentB}
                proteinFolded={proteinFolded}
                setProteinFolded={setProteinFolded}
                showDnaCoil={showDnaCoil}
                setShowDnaCoil={setShowDnaCoil}
                animationPlaying={animationPlaying}
                setAnimationPlaying={setAnimationPlaying}
                replicateSpeed={(speed) => setReplicationProgress((progress) => Math.min(1, Math.max(0.1, progress + speed)))}
                transcribeSpeed={(speed) => setTranscriptionProgress((progress) => Math.min(1, Math.max(0.1, progress + speed)))}
                onClose={() => setControlsOpen(false)}
              />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Component switcher for every screen size, including mobile, where the
              ContentNav list in the left aside is hidden (lg:block only). Picking an
              item here drives the same selectComponent() path as the desktop list, so
              the scene visibly rebuilds around it. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeIndex + 1} of {genetics.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {genetics.map((item) => {
                const active = item.id === activeId
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectComponent(item.id)}
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
                    <DnaIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setSelectedPart(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={trayContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-3 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

function TunePanel({
  activeId,
  dnaRealStructure,
  setDnaRealStructure,
  mutationType,
  setMutationType,
  mutationIndex,
  setMutationIndex,
  mutationBase,
  setMutationBase,
  mutationEffectLabel,
  pairing,
  setPairing,
  genotype,
  setGenotype,
  parentA,
  setParentA,
  parentB,
  setParentB,
  proteinFolded,
  setProteinFolded,
  showDnaCoil,
  setShowDnaCoil,
  animationPlaying,
  setAnimationPlaying,
  replicateSpeed,
  transcribeSpeed,
  onClose,
}: {
  activeId: string
  dnaRealStructure: boolean
  setDnaRealStructure: Dispatch<SetStateAction<boolean>>
  mutationType: MutationType
  setMutationType: (value: MutationType) => void
  mutationIndex: number
  setMutationIndex: (value: number) => void
  mutationBase: string
  setMutationBase: (value: string) => void
  mutationEffectLabel: string
  pairing: (typeof PAIRINGS)[number]
  setPairing: (value: (typeof PAIRINGS)[number]) => void
  genotype: string
  setGenotype: (value: string) => void
  parentA: string
  setParentA: (value: string) => void
  parentB: string
  setParentB: (value: string) => void
  proteinFolded: boolean
  setProteinFolded: Dispatch<SetStateAction<boolean>>
  showDnaCoil: boolean
  setShowDnaCoil: Dispatch<SetStateAction<boolean>>
  animationPlaying: boolean
  setAnimationPlaying: Dispatch<SetStateAction<boolean>>
  replicateSpeed: (speed: number) => void
  transcribeSpeed: (speed: number) => void
  onClose: () => void
}) {
  return (
    <div className="grid gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Tune molecule · {activeId.replace(/-/g, ' ')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide molecule controls"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {activeId === 'dna' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Molecule view</span>
          <button
            type="button"
            onClick={() => setDnaRealStructure(false)}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              !dnaRealStructure ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Schematic (A–T / C–G rungs)
          </button>
          <button
            type="button"
            onClick={() => setDnaRealStructure(true)}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              dnaRealStructure ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Real structure (PDB 1BNA)
          </button>
        </div>
      )}

      {(activeId === 'dna-replication' || activeId === 'transcription-translation') && (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setAnimationPlaying((value) => !value)}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold text-[color:var(--color-foreground)]"
          >
            {animationPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {animationPlaying ? 'Pause animation' : 'Play animation'}
          </button>
          <button
            type="button"
            onClick={() => (activeId === 'dna-replication' ? replicateSpeed(0.12) : transcribeSpeed(0.15))}
            className="inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold text-[color:var(--color-foreground)]"
          >
            Step forward
          </button>
        </div>
      )}

      {activeId === 'mutation' && (
        <>
          <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
            <p className="text-xs font-semibold text-[color:var(--color-foreground)]">Observe: base {mutationIndex + 1} now makes a {mutationEffectLabel} effect.</p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
              Predict, change, observe, explain: guess the effect, switch the change type or new base, watch the Effect meter update, then explain whether the protein recipe stayed the same, swapped a part, stopped early, or shifted after this base.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">Check: insertion or deletion should change every codon after the changed spot.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="min-w-0">
              <span className="mb-1 block text-[11px] font-medium text-[color:var(--color-ink-500)]">Change type</span>
              <div className="grid grid-cols-1 gap-1">
                {MUTATION_TYPES.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setMutationType(key); setMutationIndex(key === 'insertion' ? 3 : 4) }}
                    className={cn(
                      'rounded-[var(--radius-sm)] border px-3 py-1.5 text-xs font-semibold transition-colors',
                      mutationType === key ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="min-w-0">
              <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                Base position <span className="font-[family-name:var(--font-mono)]">{mutationIndex + 1}</span>
              </span>
              <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={11} step={1} value={mutationIndex} onChange={(event) => setMutationIndex(Number(event.target.value))} />
            </label>
            <label className="min-w-0">
              <span className="mb-1 block text-[11px] font-medium text-[color:var(--color-ink-500)]">New base</span>
              <div className="grid grid-cols-4 gap-1">
                {['A', 'T', 'C', 'G'].map((base) => (
                  <button
                    key={base}
                    type="button"
                    onClick={() => setMutationBase(base)}
                    className={cn(
                      'rounded-[var(--radius-sm)] border py-1.5 text-xs font-semibold transition-colors',
                      mutationBase === base ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
                    )}
                  >
                    {base}
                  </button>
                ))}
              </div>
            </label>
          </div>
        </>
      )}

      {activeId === 'allele' && (
        <div className="grid grid-cols-1 gap-1 sm:grid-cols-3">
          {PAIRINGS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPairing(key)}
              className={cn(
                'rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold capitalize transition-colors',
                pairing === key ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {key.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      )}

      {activeId === 'trait' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Genotype</span>
          {['PP', 'Pp', 'pp'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setGenotype(value)}
              className={cn(
                'rounded-[var(--radius-md)] border px-3 py-2 font-[family-name:var(--font-mono)] text-sm font-semibold transition-colors',
                genotype === value ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {value}
            </button>
          ))}
        </div>
      )}

      {activeId === 'inheritance-punnett-squares' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-[11px] font-medium text-[color:var(--color-ink-500)]">Parent 1 allele</span>
            <div className="grid grid-cols-2 gap-1">
              {['P', 'p'].map((base) => (
                <button
                  key={base}
                  type="button"
                  onClick={() => setParentA(base)}
                  className={cn(
                    'rounded-[var(--radius-md)] border py-2 font-[family-name:var(--font-mono)] text-sm font-semibold transition-colors',
                    parentA === base ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
                  )}
                >
                  {base}
                </button>
              ))}
            </div>
          </label>
          <label>
            <span className="mb-1 block text-[11px] font-medium text-[color:var(--color-ink-500)]">Parent 2 allele</span>
            <div className="grid grid-cols-2 gap-1">
              {['P', 'p'].map((base) => (
                <button
                  key={base}
                  type="button"
                  onClick={() => setParentB(base)}
                  className={cn(
                    'rounded-[var(--radius-md)] border py-2 font-[family-name:var(--font-mono)] text-sm font-semibold transition-colors',
                    parentB === base ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
                  )}
                >
                  {base}
                </button>
              ))}
            </div>
          </label>
        </div>
      )}

      {(activeId === 'protein' || activeId === 'chromosome') && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setProteinFolded((value) => !value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              proteinFolded ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            {proteinFolded ? 'Folded' : 'Unfolded'}
          </button>
          {activeId === 'chromosome' && (
            <button
              type="button"
              onClick={() => setShowDnaCoil((value) => !value)}
              className={cn(
                'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
                showDnaCoil ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
              )}
            >
              {showDnaCoil ? 'Hide DNA coil' : 'Show DNA coil'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
