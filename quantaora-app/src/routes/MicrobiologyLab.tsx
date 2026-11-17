import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { SlidersHorizontal, X, FlaskConical, ChevronDown } from 'lucide-react'
import { microbiology } from '@/data/generated/microbiology'
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
import { GlbErrorBoundary, GlbLoadingStatus } from '@/components/explorer/GlbErrorBoundary'
import { cn } from '@/lib/utils'

// ── palette ─────────────────────────────────────────────────────────────────
const BACKGROUND = '#F7F3EE'
const INK = '#2F3740'
const TEAL = '#3E7C6F'
const TEAL_SOFT = '#7FB2A5'
const VIOLET = '#6B85A8'
const VIOLET_SOFT = '#9FB0CC'
const GOLD = '#D9A441'
const AMBER = '#C98F2C'
const SALMON = '#D98A6A'
const BLUE_SOFT = '#7FA6D9'
const GREEN = '#6FAF63'
const SOIL = '#8A6A45'
const TAN = '#C9BFA9'
const CREAM = '#F4EFE5'

const LAB_ORDER = [
  { id: 'bacteria', scene: 'Bacteria' },
  { id: 'virus', scene: 'Virus' },
  { id: 'fungus', scene: 'Fungus' },
  { id: 'protozoa', scene: 'Protozoa' },
  { id: 'microbiome', scene: 'Microbiome' },
]

const contentById = Object.fromEntries(microbiology.map((item) => [item.id, item]))
const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'microbiology')

function hotspotFor(content: ComponentContent, label: string): Hotspot | null {
  return content.hotspots.find((hotspot) => hotspot.label === label) ?? null
}

// ── step-through cycles (bacteria division / virus infection) ─────────────
type CycleStage = { id: string; label: string; from: number; progress: number }

const BACTERIA_STAGES: CycleStage[] = [
  { id: 'grow', label: 'Cell grows', from: 0, progress: 0.05 },
  { id: 'copy', label: 'DNA copies itself', from: 0.22, progress: 0.3 },
  { id: 'pinch', label: 'Wall pinches inward', from: 0.46, progress: 0.55 },
  { id: 'split', label: 'Two cells split apart', from: 0.72, progress: 0.9 },
]

const VIRUS_STAGES: CycleStage[] = [
  { id: 'attach', label: 'Virus attaches', from: 0, progress: 0.05 },
  { id: 'inject', label: 'Injects genetic material', from: 0.3, progress: 0.42 },
  { id: 'replicate', label: 'Host copies the virus', from: 0.46, progress: 0.5 },
  { id: 'burst', label: 'New viruses burst out', from: 0.7, progress: 0.9 },
]

function currentStage(stages: CycleStage[], progress: number): CycleStage {
  let current = stages[0]
  for (const stage of stages) {
    if (progress >= stage.from) current = stage
  }
  return current
}

function nextStageProgress(stages: CycleStage[], progress: number): number {
  const idx = stages.findIndex((stage) => stage.id === currentStage(stages, progress).id)
  return stages[(idx + 1) % stages.length].progress
}

// ── guided learning prompts (Observe / Predict / Change / Explain / Check) ─
const GUIDED_PROMPTS: Record<string, { observe: string; predict: string; change: string; explain: string; check: string }> = {
  bacteria: {
    observe: 'Watch the gold DNA loop and the pinch line at the middle of the cell.',
    predict: 'Before you tap Step, guess what happens to the DNA loop when the wall pinches in two.',
    change: 'Peel the wall or show the flagellum, then tap "Step division stage" and watch the cell pinch into two while the flagellum moves.',
    explain: 'Use the facts panel to explain why one bacterium can become billions so fast.',
    check: 'Open the quiz to check your binary fission answer.',
  },
  virus: {
    observe: 'Watch the virus travel toward the host cell, then watch what happens after it attaches.',
    predict: 'Guess: can the virus copy itself while floating alone, with no host cell?',
    change: 'Peel the coat or show the spikes, then tap "Step infection stage" and watch attachment, copying, and new viruses bursting from the host.',
    explain: 'Explain in the facts panel why a virus needs a host cell to make copies.',
    check: 'Open the quiz to check your infection-cycle answer.',
  },
  fungus: {
    observe: 'Watch the tan mycelium threads under the soil and the spores drifting off the cap.',
    predict: 'Guess what happens to the mycelium network if you raise the Moisture slider.',
    change: 'Peel the soil away, show the spores, then change Moisture and watch the hidden mycelium network spread or shrink.',
    explain: 'Explain why the mushroom you see is only the fruiting part of a much bigger fungus.',
    check: 'Open the quiz to check what you learned about spores and mycelium.',
  },
  protozoa: {
    observe: "Watch the amoeba's pseudopod reach toward a passing food speck.",
    predict: 'Guess what happens to feeding if you lower the Food available slider.',
    change: 'Show the movement and feeding layers, then change Food available and watch the protozoan move and reach for food differently.',
    explain: 'Explain how cilia, a flagellum, and false feet each move a protozoan differently.',
    check: 'Open the quiz to check your movement-and-feeding answer.',
  },
  microbiome: {
    observe: 'Watch the gut and skin colony dots glow brighter or dimmer.',
    predict: 'Guess what happens to the colony count if you raise Antibiotic use.',
    change: 'Change Antibiotic use and Fiber-rich diet, then show helpful jobs and compare how the community balance and colony glow change.',
    explain: 'Explain why a balanced microbiome needs more than just avoiding antibiotics.',
    check: 'Open the quiz to check your balance answer.',
  },
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

// ── bacteria ────────────────────────────────────────────────────────────────
function BacteriaScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  peelWall,
  showFlagellum,
  showBuddies,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  peelWall: boolean
  showFlagellum: boolean
  showBuddies: boolean
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const wallOpacity = peelWall || xray ? 0.1 : 0.92
  const membraneOpacity = peelWall || xray ? 0.55 : 0.55
  const whip = Math.sin(progress * Math.PI * 2) * 0.22
  const buddyGrowth = Math.max(0, (progress - 0.45) / 0.55)
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* ambient microbe dots */}
      <group>
        {[[-1.35, 1.25, -0.05], [-1.55, -0.7, -0.02], [1.45, 1.05, -0.05], [1.6, -1.2, -0.02], [-0.9, -1.35, -0.05], [0.95, -1.45, -0.04]].map((p, index) => (
          <mesh key={index} position={p as [number, number, number]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={VIOLET_SOFT} roughness={0.7} transparent opacity={0.5} />
          </mesh>
        ))}
      </group>

      {/* cell wall + membrane */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-wall') }}>
        <mesh rotation={[0.15, 0, 0]} scale={[1, 1.75, 1]}>
          <capsuleGeometry args={[0.36, 1.0, 8, 18]} />
          <meshStandardMaterial color={TEAL} roughness={0.35} transparent={peelWall || xray} opacity={wallOpacity} side={2} />
        </mesh>
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-membrane') }}>
        <mesh rotation={[0.15, 0, 0]} scale={[1, 1.72, 1]}>
          <capsuleGeometry args={[0.3, 0.95, 8, 16]} />
          <meshStandardMaterial color={SALMON} roughness={0.5} transparent opacity={membraneOpacity} side={2} />
        </mesh>
      </group>

      {/* interior: loose DNA loop + ribosomes */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-dna') }}>
        <BeadTube
          points={Array.from({ length: 14 }, (_, i) => {
            const t = (i / 14) * Math.PI * 2
            return [Math.cos(t) * 0.16, Math.sin(t) * 0.22 + 0.05, 0.02] as [number, number, number]
          })}
          color={GOLD}
          radius={0.035}
          dim={dim('ba-dna')}
        />
        <mesh position={[0, 0.05, 0.05]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color={GOLD} roughness={0.5} transparent={dim('ba-dna')} opacity={dim('ba-dna') ? 0.25 : 0.9} />
        </mesh>
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-membrane') }}>
        {[[-0.16, 0.28, 0.08], [0.18, -0.2, 0.1], [-0.08, -0.32, 0.05], [0.22, 0.3, 0.04]].map((p, index) => (
          <mesh key={index} position={p as [number, number, number]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color={GREEN} roughness={0.6} transparent={dim('ba-membrane')} opacity={dim('ba-membrane') ? 0.25 : 0.9} />
          </mesh>
        ))}
      </group>

      {/* flagellum */}
      {showFlagellum && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-flagellum') }}>
          <BeadTube
            points={Array.from({ length: 12 }, (_, i) => {
              const t = i / 11
              return [-0.2 - t * 0.85, -0.62 - t * 0.62 + Math.sin(t * 5 + progress * Math.PI * 2) * 0.14 * (t + 0.45), 0.05] as [number, number, number]
            })}
            color={TAN}
            radius={0.032}
            dim={dim('ba-flagellum')}
          />
        </group>
      )}

      {/* pinch line where the split happens */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-divide') }}>
        <mesh position={[0, 0.02, 0.08]} rotation={[Math.PI / 2, 0, 0]} scale={[1.15, 0.12, 1]}>
          <torusGeometry args={[0.3, 0.022, 8, 20]} />
          <meshStandardMaterial color={GOLD} roughness={0.4} transparent opacity={0.8 + whip * 0.2} />
        </mesh>
      </group>

      {/* division result */}
      {showBuddies && buddyGrowth > 0 && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('ba-divide') }}>
          <mesh position={[0.95 * buddyGrowth + 0.2, -0.45, 0]} rotation={[0, 0, 0.25]} scale={[0.75, 1.15 * buddyGrowth, 0.75]}>
            <capsuleGeometry args={[0.24, 0.55, 8, 14]} />
            <meshStandardMaterial color={TEAL_SOFT} roughness={0.4} transparent opacity={0.35 + 0.6 * buddyGrowth} />
          </mesh>
          <mesh position={[1.25 * buddyGrowth + 0.5, -0.85, 0]} rotation={[0, 0, -0.2]} scale={[0.55, 0.8 * buddyGrowth, 0.55]}>
            <capsuleGeometry args={[0.2, 0.45, 8, 12]} />
            <meshStandardMaterial color={TEAL_SOFT} roughness={0.4} transparent opacity={0.4 * buddyGrowth} />
          </mesh>
        </group>
      )}

      <Marker position={[0.75, 0.68, 0.25]} color={TEAL} label={labelsVisible ? 'cell wall' : undefined} onSelect={() => onSelectPart('ba-wall')} dim={dim('ba-wall')} />
      <Marker position={[-0.85, 0.58, 0.28]} color={SALMON} label={labelsVisible ? 'cell membrane' : undefined} onSelect={() => onSelectPart('ba-membrane')} dim={dim('ba-membrane')} />
      <Marker position={[-0.4, 0.78, 0.15]} color={GOLD} label={labelsVisible ? 'DNA (genetic material)' : undefined} onSelect={() => onSelectPart('ba-dna')} dim={dim('ba-dna')} />
      {showFlagellum && <Marker position={[-1.3, -1.15, 0.2]} color={TAN} label={labelsVisible ? 'flagellum' : undefined} onSelect={() => onSelectPart('ba-flagellum')} dim={dim('ba-flagellum')} />}
      {showBuddies && <Marker position={[1.35, -0.35, 0.2]} color={TEAL_SOFT} label={labelsVisible ? 'cells splitting (binary fission)' : undefined} onSelect={() => onSelectPart('ba-divide')} dim={dim('ba-divide')} />}

      {labelsVisible && (
        <>
          <ChipLabel text="bacterium — one living cell, no nucleus" position={[0, -1.9, 0.35]} color={TEAL} />
          <ChipLabel text="a bacterium splits in two — fast growth" position={[1.9, -1.5, 0.3]} color={AMBER} />
        </>
      )}
    </group>
  )
}

// ── virus (procedural capsid) ──────────────────────────────────────────────
/** Procedural protein-coat capsid: an icosahedron core with radial spike cones, in the app's
 *  existing low-poly muted style (matches BeadTube/marker/host-cell treatment elsewhere in this
 *  scene). Stays the default "infection cycle" view; the real poliovirus capsid GLB is available
 *  as a separate "Capsid (real poliovirus)" inspection mode below, same pattern as the influenza
 *  whole-virion/cutaway modes. */
function VirusCapsidModel({ peelCoat, xray }: { peelCoat: boolean; xray: boolean }) {
  const spikeDirs = useMemo(() => {
    const dirs: THREE.Vector3[] = []
    const golden = Math.PI * (3 - Math.sqrt(5))
    for (let i = 0; i < 24; i++) {
      const y = 1 - (i / 23) * 2
      const radius = Math.sqrt(1 - y * y)
      const theta = golden * i
      dirs.push(new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius))
    }
    return dirs
  }, [])
  const coatOpacity = peelCoat || xray ? 0.12 : 0.95

  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.3, 1]} />
        <meshStandardMaterial color={VIOLET} roughness={0.5} metalness={0} transparent opacity={coatOpacity} />
      </mesh>
      {spikeDirs.map((dir, index) => (
        <mesh
          key={index}
          position={dir.clone().multiplyScalar(0.3)}
          quaternion={new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)}
        >
          <coneGeometry args={[0.035, 0.09, 6]} />
          <meshStandardMaterial color={VIOLET_SOFT} roughness={0.45} metalness={0} transparent opacity={coatOpacity} />
        </mesh>
      ))}
    </group>
  )
}

// ── virus ───────────────────────────────────────────────────────────────────
function VirusScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  peelCoat,
  showSpikes,
  showCycle,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  peelCoat: boolean
  showSpikes: boolean
  showCycle: boolean
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const cycleActive = showCycle && !xray
  const attach = cycleActive ? Math.min(1, progress * 2.4) : 0
  const virusX = -0.95 + attach * 1.35
  const virusY = -0.15 + (1 - attach) * Math.sin(progress * Math.PI * 2) * 0.08
  const release = Math.max(0, (progress - 0.52) / 0.48)
  const coil = Array.from({ length: 16 }, (_, i) => {
    const t = (i / 15) * Math.PI * 2
    return [Math.sin(t * 2) * 0.1 * 0.55, Math.cos(t) * 0.16, Math.cos(t * 2) * 0.1 * 0.55] as [number, number, number]
  })
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* virus particle */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('vi-coat') }}>
        <group position={[virusX, virusY, 0]}>
          {/* Procedural protein coat: icosahedron + radial spike cones (no approved GLB yet —
              see VirusCapsidModel's doc comment). The "attachment spikes" hotspot pin below
              still labels the concept. */}
          <VirusCapsidModel peelCoat={peelCoat} xray={xray} />
          {/* genetic material */}
          <group onClick={(event) => { event.stopPropagation(); onSelectPart('vi-genetic') }}>
            <BeadTube points={coil} color={GOLD} radius={0.028} dim={dim('vi-genetic')} />
            <mesh>
              <sphereGeometry args={[0.07, 10, 10]} />
              <meshStandardMaterial color={GOLD} roughness={0.4} transparent={dim('vi-genetic')} opacity={dim('vi-genetic') ? 0.3 : 0.95} />
            </mesh>
          </group>
        </group>
      </group>

      {/* host cell */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('vi-host') }}>
        <mesh position={[1.45, 0.12, 0]} scale={[1.15, 0.95, 1]}>
          <sphereGeometry args={[0.68, 26, 26]} />
          <meshStandardMaterial color={GREEN} roughness={0.45} transparent opacity={0.5} side={2} />
        </mesh>
        <mesh position={[1.45, 0.12, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color={TEAL_SOFT} roughness={0.5} transparent={dim('vi-host')} opacity={dim('vi-host') ? 0.3 : 0.95} />
        </mesh>
        <Marker position={[1.98, 0.75, 0.2]} color={GREEN} label={labelsVisible ? 'host cell' : undefined} onSelect={() => onSelectPart('vi-host')} dim={dim('vi-host')} />
      </group>

      {/* attach path */}
      {cycleActive && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('vi-host') }}>
          <Line points={[[-0.85, -0.15, 0.1], [1.15, 0.12, 0.1]]} color={VIOLET_SOFT} lineWidth={1.5} transparent opacity={0.45} />
        </group>
      )}

      {/* released new viruses */}
      {cycleActive && release > 0 && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('vi-host') }}>
          {[[1.95, 0.35, 0.1], [1.55, 0.62, -0.08], [1.95, -0.25, 0.12], [1.5, -0.5, 0.05], [1.85, 0.0, -0.14]].map((dir, index) => (
            <mesh key={index} position={[dir[0] + 0.5 * release, dir[1], dir[2] + Math.sin(index) * 0.05]}>
              <icosahedronGeometry args={[0.06 + 0.025 * release, 0]} />
              <meshStandardMaterial color={VIOLET} roughness={0.4} transparent opacity={0.35 + 0.65 * release} />
            </mesh>
          ))}
        </group>
      )}
      {cycleActive && release > 0 && labelsVisible && <ChipLabel text="host cell made many new viruses" position={[1.85, 1.15, 0.3]} color={VIOLET} />}

      <Marker position={[-1.05, 0.6, 0.22]} color={VIOLET} label={labelsVisible ? 'protein coat' : undefined} onSelect={() => onSelectPart('vi-coat')} dim={dim('vi-coat')} />
      <Marker position={[-0.7, -0.72, 0.22]} color={GOLD} label={labelsVisible ? 'genetic material' : undefined} onSelect={() => onSelectPart('vi-genetic')} dim={dim('vi-genetic')} />
      {showSpikes && <Marker position={[-1.5, 0.18, 0.22]} color={SALMON} label={labelsVisible ? 'attachment spikes' : undefined} onSelect={() => onSelectPart('vi-spikes')} dim={dim('vi-spikes')} />}

      {labelsVisible && (
        <ChipLabel text="virus — genes in a coat, needs a host to copy itself" position={[0, -1.9, 0.35]} color={VIOLET} />
      )}
    </group>
  )
}

// ── virus: real influenza GLB inspection ───────────────────────────────────
/** Two sourced NIH 3D influenza models — PASS per
 *  docs/assets/reviews/biology-gaps-wave2-visual.md — wired as two distinct inspection states of
 *  the same organism (the schematic VirusScene above stays the default "infection cycle" view;
 *  these are the "real structure" companion, same pattern as GeneticsLab's DnaRealStructureScene). */
const VIRUS_WHOLE_MODEL_URL = '/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb'
const VIRUS_CUTAWAY_MODEL_URL = '/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb'
/** Real poliovirus capsid (NIH 3D 3DPX-001519, EMDB 5886), CC0, registered in modelRegistry.ts
 *  as componentId `virus`/CLEAR/hero. Decimated derivative (23.84MB -> 7.03MB, geometry-only,
 *  bounding box unchanged) per docs/assets/reviews/conditional-optimization.md #1, of the file
 *  rated "no content problems... best iconic virus shape of the batch" in
 *  docs/assets/reviews/biology-cell-visual.md #10. Different organism from the influenza models
 *  above (no envelope/HA/NA — a bare icosahedral protein shell), so it gets its own inspection
 *  mode rather than replacing either influenza state. */
const VIRUS_CAPSID_MODEL_URL = '/models/biology/microbiology/virus-polio-capsid-nih-optimized.glb'
useGLTF.preload(VIRUS_WHOLE_MODEL_URL)
useGLTF.preload(VIRUS_CUTAWAY_MODEL_URL)
useGLTF.preload(VIRUS_CAPSID_MODEL_URL)

type VirusInspectionMode = 'cycle' | 'whole-virion' | 'cutaway' | 'capsid'

/** Fixed footprint both influenza GLBs are normalized into — keeps the two files framed
 *  consistently even though their native scales differ (whole-virion ~17 native units,
 *  cutaway ~1.8 native units; per the visual review, the cutaway would otherwise need a longer
 *  camera radius to avoid crowding the frame). */
const VIRUS_GLB_FIT_SIZE = 3.2

/** Hand-placed against each model's known silhouette (same technique as GeneticsLab's
 *  DNA_REAL_HOTSPOTS/RealDnaHotspotMarker for untextured sourced meshes with no per-atom data to
 *  derive exact positions from). Only labels structures the visual review actually confirms are
 *  visible in that specific file — whole-virion has no interior/matrix/RNP visible, cutaway is
 *  the only one with a cut face exposing them. */
const VIRUS_WHOLE_HOTSPOTS: { part: LabPart; position: [number, number, number] }[] = [
  { part: 'vi-ha', position: [0.55, 0.95, 0.75] },
  { part: 'vi-na', position: [-0.9, 0.4, 0.85] },
  { part: 'vi-envelope', position: [0.1, -1.05, 0.65] },
]

const VIRUS_CUTAWAY_HOTSPOTS: { part: LabPart; position: [number, number, number] }[] = [
  { part: 'vi-ha', position: [-0.85, 0.6, 0.65] },
  { part: 'vi-na', position: [-0.55, -0.65, 0.7] },
  { part: 'vi-matrix', position: [0.4, 0.35, 0.3] },
  { part: 'vi-rnp', position: [0.25, -0.2, 0.1] },
]

/** The capsid file is a single undifferentiated mesh (no per-region color/material data to key
 *  additional hotspots off of, per the visual review) — one hotspot for the whole structure. */
const VIRUS_CAPSID_HOTSPOTS: { part: LabPart; position: [number, number, number] }[] = [
  { part: 'vi-capsid', position: [0.9, 0.5, 0.7] },
]

/** Pill hotspot marker for the real influenza meshes — mirrors CellModel's GlbHotspotMarker /
 *  GeneticsLab's RealDnaHotspotMarker so real sourced GLBs read consistently across the app
 *  (colored dot + ping + label chip, DOM-based so it stays legible and unclipped at any zoom or
 *  viewport width, including 390px mobile). */
function RealVirusHotspotMarker({
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

function VirusGlbModel({
  url,
  rotation,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
  hotspots,
}: {
  url: string
  rotation: [number, number, number]
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
  hotspots: { part: LabPart; position: [number, number, number] }[]
}) {
  const { scene } = useGLTF(url)

  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const scale = VIRUS_GLB_FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(scale)
    cloned.position.copy(center.multiplyScalar(-scale))
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.frustumCulled = false
      // Both influenza GLBs ship POSITION + COLOR_0 (real per-vertex HA/NA/membrane coloring);
      // the capsid GLB ships POSITION only, no color attribute at all. None of the three ship a
      // NORMAL accessor — per the sidecar .license.json files, without this the real GLTFLoader
      // renders them unlit/flat (same gap the DNA GLB has, handled the same way).
      if (child.geometry && !child.geometry.getAttribute('normal')) {
        child.geometry.computeVertexNormals()
      }
      const hasVertexColor = !!child.geometry?.getAttribute('color')
      child.material = new THREE.MeshStandardMaterial({
        vertexColors: hasVertexColor,
        color: hasVertexColor ? '#ffffff' : VIOLET,
        roughness: 0.55,
        metalness: 0,
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
      const material = child.material as THREE.MeshStandardMaterial
      const target = dimmed ? 0.3 : 1
      material.opacity = THREE.MathUtils.lerp(material.opacity, target, 0.15)
    })
  })

  // No catch-all onClick on this group: a whole-mesh click handler here would compete with the
  // per-hotspot Html buttons below for any raycast hit that lands on the model near a marker
  // (very likely, since markers sit right on the model's surface), intermittently stealing clicks
  // meant for NA/RNP and re-routing them to whichever hotspot this handler defaulted to, or —
  // when the raycast missed the mesh entirely — falling through to the Canvas's onPointerMissed
  // and clearing the selection. Same reference pattern as CellModel's GlbHotspotMarker, which has
  // no group-level click handler competing with its markers.
  return (
    <group rotation={rotation}>
      <primitive object={model} />
      {hotspots.map(({ part, position }) => (
        <RealVirusHotspotMarker
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

/** Real-structure companion to VirusScene: three inspection states across two organisms —
 *  the intact influenza exterior (whole-virion GLB), an influenza half-cutaway revealing internal
 *  structure (cutaway GLB), and a real poliovirus capsid (capsid GLB) — selected from the Tune
 *  panel. The schematic infection-cycle view stays the default and fully untouched. Still reads
 *  the shared VIRUS_STAGES/flowProgress driven by the same "Step infection stage" control in the
 *  Tune panel, so the reproduction/stage system is reused rather than duplicated for this
 *  inspection mode. */
function VirusRealStructureScene({
  mode,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
  flowProgress,
  onGlbError,
}: {
  mode: 'whole-virion' | 'cutaway' | 'capsid'
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
  flowProgress: number
  onGlbError?: () => void
}) {
  const url = mode === 'cutaway' ? VIRUS_CUTAWAY_MODEL_URL : mode === 'capsid' ? VIRUS_CAPSID_MODEL_URL : VIRUS_WHOLE_MODEL_URL
  const hotspots = mode === 'cutaway' ? VIRUS_CUTAWAY_HOTSPOTS : mode === 'capsid' ? VIRUS_CAPSID_HOTSPOTS : VIRUS_WHOLE_HOTSPOTS
  // Cutaway file's cut face reads clearest from a slightly elevated three-quarter angle (per the
  // visual review's topdown/quarter screenshots) — tilt the model, not the shared OrbitControls,
  // so it starts on-face without moving every other scene's default camera. Capsid is a near-
  // perfect sphere (native bbox ~[358,372,374]), so any rotation reads equivalently well.
  const rotation: [number, number, number] = mode === 'cutaway' ? [0.35, 0.55, 0] : [0, 0.3, 0]
  // Bumped by the error fallback's "Try again" button — remounts the error boundary and the virus
  // model beneath it. Combined with `url` below so switching whole↔cutaway also clears a prior
  // error. Also busts drei's useGLTF loader cache for `url` (see useGlbRetry.ts) so a broken asset
  // actually re-fetches instead of re-throwing the same stale rejected promise on every retry click.
  const { retryKey, retryLoad } = useGlbRetry(url)
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>
      <GlbErrorBoundary
        key={`${url}-${retryKey}`}
        onRetry={retryLoad}
        onError={onGlbError}
        message="This 3D virus model couldn't load."
        source="[MicrobiologyLab]"
        // Renders dead-center on the canvas by default (Html `center`, no `position`, so the
        // scene-group origin), which is fine on desktop (canvas fills `lg:h-auto lg:flex-1`,
        // plenty of clearance below). On mobile/tablet the canvas is height-clamped to `h-[56svh]`
        // (see the `data-lab-stage` wrapper in the parent route) while the collapsed meter-chip
        // row below still occupies its own fixed pixel height pinned to `absolute bottom-3` — on a
        // short canvas that chip row's top edge lands right under this card's vertical center, so
        // the "Try again" button (below the message text) would render right on top of/under the
        // opaque meter chips: hard to see, and taps landing on a `pointer-events-auto` chip (e.g.
        // "Tune microbe") never reach the button underneath. `-translate-y-16` nudges the whole
        // card up clear of that chip row below `lg` (matching the `h-[56svh]` mobile/tablet
        // breakpoint used by the same wrapper); `lg:translate-y-0` restores the untouched centered
        // desktop position where the chip row never reaches this high. A generous `zIndexRange` is
        // set too so this card also wins any remaining stacking comparison against the chip row's
        // `z-10`.
        cardClassName="-translate-y-16 lg:translate-y-0"
        zIndexRange={[1000, 900]}
      >
        <Suspense fallback={<GlbLoadingStatus message="Loading virus model…" />}>
          <VirusGlbModel url={url} rotation={rotation} selectedPart={selectedPart} onSelectPart={onSelectPart} labelsVisible={labelsVisible} isolateActive={isolateActive} hotspots={hotspots} />
        </Suspense>
      </GlbErrorBoundary>
      {labelsVisible && (
        <ChipLabel
          text={
            mode === 'cutaway'
              ? 'influenza virion — cutaway reveals RNA + matrix protein inside'
              : mode === 'capsid'
                ? 'poliovirus — real capsid: spiky protein shell, no lipid envelope (unlike influenza)'
                : 'influenza virion — real surface: HA and NA spikes on the envelope'
          }
          position={[0, -1.9, 0.35]}
          color={VIOLET}
        />
      )}
      {/* Poliovirus capsid is a different organism from the shared infection-cycle stages
          (VIRUS_STAGES models influenza's attach/release narrative), so that chip is skipped here
          rather than showing a misleading "Cycle stage" label next to a static capsid. */}
      {mode !== 'capsid' && <ChipLabel text={`Cycle stage: ${currentStage(VIRUS_STAGES, flowProgress).label}`} position={[0, 1.7, 0.3]} color={INK} />}
    </group>
  )
}

// ── fungus ──────────────────────────────────────────────────────────────────
function FungusScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  peelSoil,
  showSpores,
  showYeast,
  moisture,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  peelSoil: boolean
  showSpores: boolean
  showYeast: boolean
  moisture: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const soilOpacity = peelSoil || xray ? 0.22 : 0.95
  const spore = (t: number) => [0.18 + Math.sin(t * 3) * 0.22, 0.92 + t * 0.75 - t * t * 0.5, 0.08] as [number, number, number]
  /** Wetter soil → mycelium reaches further and drops more spores — visible, not just a number. */
  const reach = 0.55 + moisture * 0.85
  const sporeCount = Math.max(3, Math.round(3 + moisture * 6))
  const myceliumPaths: [number, number, number][][] = [
    [[0, -0.62, 0], [-0.5 * reach, -0.68, 0.03], [-0.95 * reach, -0.5, 0.02], [-1.25 * reach, -0.62, 0.05]],
    [[0, -0.62, 0], [0.55 * reach, -0.72, -0.02], [1.0 * reach, -0.6, -0.04], [1.3 * reach, -0.8, 0.02]],
    [[0, -0.62, 0], [-0.4 * reach, -0.95, 0.04], [-0.8 * reach, -1.0, 0.02]],
    [[0, -0.62, 0], [0.45 * reach, -1.0, -0.03], [0.9 * reach, -1.05, 0.01]],
  ]
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* soil block */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fu-mycelium') }}>
        <mesh position={[0, -0.48, 0]} scale={[1.7, 0.6, 1]}>
          <boxGeometry args={[1.9, 0.75, 0.5]} />
          <meshStandardMaterial color="#B99A72" roughness={0.95} transparent={peelSoil || xray} opacity={soilOpacity} />
        </mesh>
        <mesh position={[0, -0.1, 0]} scale={[1.7, 0.12, 1]}>
          <boxGeometry args={[1.9, 0.16, 0.5]} />
          <meshStandardMaterial color={GREEN} roughness={0.85} transparent={peelSoil || xray} opacity={peelSoil || xray ? 0.2 : 0.95} />
        </mesh>
      </group>

      {/* mycelium network */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fu-mycelium') }}>
        {myceliumPaths.map((points, index) => (
          <BeadTube key={index} points={points} color={TAN} radius={0.03} dim={dim('fu-mycelium')} />
        ))}
      </group>
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fu-hyphae') }}>
        <BeadTube points={[[0.12, -0.58, 0.06], [0.62, -0.5, 0.08], [1.0, -0.72, 0.05]]} color={SALMON} radius={0.035} dim={dim('fu-hyphae')} />
      </group>

      {/* mushroom: stalk + cap */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('fu-fruit') }}>
        <mesh position={[0.05, -0.28, 0]}>
          <cylinderGeometry args={[0.11, 0.16, 0.72, 14]} />
          <meshStandardMaterial color={CREAM} roughness={0.7} transparent={dim('fu-fruit')} opacity={dim('fu-fruit') ? 0.3 : 1} />
        </mesh>
        <mesh position={[0.05, 0.24, 0]} scale={[1.25, 0.62, 1.25]}>
          <sphereGeometry args={[0.42, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color={SALMON} roughness={0.4} transparent={dim('fu-fruit')} opacity={dim('fu-fruit') ? 0.3 : 1} />
        </mesh>
        <mesh position={[0.05, 0.08, 0]} scale={[0.85, 0.18, 0.85]}>
          <cylinderGeometry args={[0.3, 0.3, 0.05, 18]} />
          <meshStandardMaterial color={CREAM} roughness={0.8} transparent={dim('fu-fruit')} opacity={dim('fu-fruit') ? 0.4 : 0.95} />
        </mesh>
      </group>

      {/* spores */}
      {showSpores && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('fu-spores') }}>
          <Flow path={spore} color={GOLD} progress={progress} count={sporeCount} size={0.035} dim={dim('fu-spores')} />
          <Line points={[[0.05, 0.85, 0.1], [0.05, 1.25, 0.1]]} color={GOLD} lineWidth={1.5} transparent opacity={0.4} />
        </group>
      )}

      {/* yeast */}
      {showYeast && (
        <group position={[-1.15, -0.02, 0]} onClick={(event) => { event.stopPropagation(); onSelectPart('fu-yeast') }}>
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.17, 14, 14]} />
            <meshStandardMaterial color={VIOLET} roughness={0.4} transparent={dim('fu-yeast')} opacity={dim('fu-yeast') ? 0.3 : 1} />
          </mesh>
          <mesh position={[0.26, -0.04, 0.02]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshStandardMaterial color={VIOLET_SOFT} roughness={0.4} transparent={dim('fu-yeast')} opacity={dim('fu-yeast') ? 0.3 : 1} />
          </mesh>
          <mesh position={[0.38, 0.16, 0.04]}>
            <sphereGeometry args={[0.07, 10, 10]} />
            <meshStandardMaterial color={VIOLET_SOFT} roughness={0.4} transparent={dim('fu-yeast')} opacity={dim('fu-yeast') ? 0.3 : 1} />
          </mesh>
        </group>
      )}

      <Marker position={[0.62, 0.78, 0.2]} color={SALMON} label={labelsVisible ? 'fruiting body' : undefined} onSelect={() => onSelectPart('fu-fruit')} dim={dim('fu-fruit')} />
      {peelSoil && <Marker position={[-1.55, -0.55, 0.2]} color={TAN} label={labelsVisible ? 'mycelium — the real fungus' : undefined} onSelect={() => onSelectPart('fu-mycelium')} dim={dim('fu-mycelium')} />}
      {peelSoil && <Marker position={[0.95, -1.15, 0.2]} color={SALMON} label={labelsVisible ? 'hypha (thread)' : undefined} onSelect={() => onSelectPart('fu-hyphae')} dim={dim('fu-hyphae')} />}
      {showSpores && <Marker position={[-0.65, 1.42, 0.2]} color={GOLD} label={labelsVisible ? 'spores' : undefined} onSelect={() => onSelectPart('fu-spores')} dim={dim('fu-spores')} />}
      {showYeast && <Marker position={[-1.45, 0.4, 0.2]} color={VIOLET} label={labelsVisible ? 'yeast (single cell)' : undefined} onSelect={() => onSelectPart('fu-yeast')} dim={dim('fu-yeast')} />}

      {labelsVisible && (
        <ChipLabel text="the mushroom is the fruit — the mycelium tangle below is the fungus" position={[0, -1.9, 0.35]} color={SOIL} />
      )}
    </group>
  )
}

// ── protozoa ────────────────────────────────────────────────────────────────
function ProtozoaScene({
  progress,
  selectedPart,
  onSelectPart,
  labelsVisible,
  isolateActive,
  showMovement,
  showFeeding,
  foodAvailable,
}: {
  progress: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  isolateActive: boolean
  showMovement: boolean
  showFeeding: boolean
  foodAvailable: number
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const wave = Math.sin(progress * Math.PI * 2)
  const flagWave = (t: number) => [0.52 - 0.55 * t, 0.78 - 0.18 * t + Math.sin(t * 6 + progress * Math.PI * 2) * 0.09, 0.1] as [number, number, number]
  const food = (t: number) => [-0.72 + t * 0.55, -0.62 + Math.sin(t * Math.PI) * 0.14, 0.14] as [number, number, number]
  /** More food around → the pseudopod reaches further and more food specks drift by. */
  const pseudopodReach = 0.55 + foodAvailable * 0.8
  const foodCount = Math.max(1, Math.round(foodAvailable * 6))
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* pond drop */}
      <mesh position={[0, -0.1, -0.14]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.62, 48]} />
        <meshStandardMaterial color={BLUE_SOFT} roughness={0.3} transparent opacity={0.3} />
      </mesh>

      {/* amoeba */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-amoeba') }}>
        <group position={[-0.78, -0.18, 0.02]}>
          <mesh scale={[1.35, 0.85, 0.9]} rotation={[0.1, 0, 0.2]}>
            <sphereGeometry args={[0.34, 20, 20]} />
            <meshStandardMaterial color={SALMON} roughness={0.45} transparent={dim('pr-amoeba')} opacity={dim('pr-amoeba') ? 0.3 : 1} />
          </mesh>
          {/* pseudopod */}
          {showMovement && (
            <group>
              <mesh position={[0.42 + wave * 0.14, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} scale={[pseudopodReach + wave * 0.5, 1, 1]}>
                <capsuleGeometry args={[0.07, 0.3, 6, 10]} />
                <meshStandardMaterial color={SALMON} roughness={0.45} transparent opacity={0.95} />
              </mesh>
            </group>
          )}
          <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-nucleus') }}>
            <mesh position={[-0.08, 0.02, 0.08]}>
              <sphereGeometry args={[0.11, 12, 12]} />
              <meshStandardMaterial color={GREEN} roughness={0.45} transparent={dim('pr-nucleus')} opacity={dim('pr-nucleus') ? 0.3 : 1} />
            </mesh>
          </group>
          {showFeeding && (
            <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-food') }}>
              <mesh position={[0.18, -0.18, 0.1]}>
                <sphereGeometry args={[0.08, 10, 10]} />
                <meshStandardMaterial color={GOLD} roughness={0.5} transparent={dim('pr-food')} opacity={dim('pr-food') ? 0.3 : 0.95} />
              </mesh>
            </group>
          )}
        </group>
      </group>

      {/* flagellate */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-flagellum') }}>
        <mesh position={[0.55, 0.78, 0]}>
          <sphereGeometry args={[0.26, 18, 18]} />
          <meshStandardMaterial color={TEAL_SOFT} roughness={0.4} transparent={dim('pr-flagellum')} opacity={dim('pr-flagellum') ? 0.3 : 1} />
        </mesh>
        <mesh position={[0.55, 0.78, 0.05]}>
          <sphereGeometry args={[0.09, 10, 10]} />
          <meshStandardMaterial color={GREEN} roughness={0.45} transparent={dim('pr-flagellum')} opacity={dim('pr-flagellum') ? 0.3 : 1} />
        </mesh>
        {showMovement && <BeadTube points={Array.from({ length: 10 }, (_, i) => flagWave(i / 9))} color={AMBER} radius={0.028} dim={dim('pr-flagellum')} />}
      </group>

      {/* ciliate */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-cilia') }}>
        <mesh position={[0.72, -0.5, 0]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={VIOLET_SOFT} roughness={0.4} transparent={dim('pr-cilia')} opacity={dim('pr-cilia') ? 0.3 : 1} />
        </mesh>
        {showMovement && Array.from({ length: 12 }, (_, i) => {
          const angle = (i / 12) * Math.PI * 2
          const from: [number, number, number] = [0.72 + Math.cos(angle) * 0.2, -0.5 + Math.sin(angle) * 0.2, 0.02]
          return (
            <Line
              key={i}
              points={[from, [from[0] + Math.cos(angle) * 0.14, from[1] + Math.sin(angle) * 0.14, from[2]] as [number, number, number]]}
              color={VIOLET_SOFT}
              lineWidth={1}
              transparent
              opacity={0.5 + 0.2 * wave}
            />
          )
        })}
      </group>

      {/* food speck → amoeba */}
      {showFeeding && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('pr-food') }}>
          {foodAvailable > 0.05 && <Flow path={food} color={GOLD} progress={progress} count={foodCount} size={0.035} dim={dim('pr-food')} />}
          <Line points={[[-1.15, -0.78, 0.14], [-0.42, -0.5, 0.14]]} color={AMBER} lineWidth={1.5} transparent opacity={0.15 + foodAvailable * 0.55} />
        </group>
      )}

      <Marker position={[-1.25, 0.5, 0.2]} color={SALMON} label={labelsVisible ? 'amoeba — false feet' : undefined} onSelect={() => onSelectPart('pr-amoeba')} dim={dim('pr-amoeba')} />
      <Marker position={[0.05, 1.05, 0.2]} color={TEAL_SOFT} label={labelsVisible ? 'nucleus (true nucleus)' : undefined} onSelect={() => onSelectPart('pr-nucleus')} dim={dim('pr-nucleus')} />
      <Marker position={[1.15, 0.92, 0.2]} color={AMBER} label={labelsVisible ? 'flagellum' : undefined} onSelect={() => onSelectPart('pr-flagellum')} dim={dim('pr-flagellum')} />
      <Marker position={[1.28, -0.62, 0.2]} color={VIOLET} label={labelsVisible ? 'cilia' : undefined} onSelect={() => onSelectPart('pr-cilia')} dim={dim('pr-cilia')} />
      <Marker position={[-0.15, -0.65, 0.22]} color={GOLD} label={labelsVisible ? 'food vacuole' : undefined} onSelect={() => onSelectPart('pr-food')} dim={dim('pr-food')} />

      {labelsVisible && (
        <ChipLabel text="protozoa — one cell that senses, swims, and hunts" position={[0, -1.9, 0.35]} color={TEAL} />
      )}
    </group>
  )
}

// ── microbiome ──────────────────────────────────────────────────────────────
function MicrobiomeScene({
  progress,
  balance,
  selectedPart,
  onSelectPart,
  labelsVisible,
  xray,
  isolateActive,
  showJobs,
}: {
  progress: number
  balance: number
  selectedPart: string | null
  onSelectPart: (part: string) => void
  labelsVisible: boolean
  xray: boolean
  isolateActive: boolean
  showJobs: boolean
}) {
  const dim = (id: string) => isolateActive && selectedPart !== id
  const colonyOpacity = 0.35 + 0.65 * balance + 0.1 * Math.sin(progress * Math.PI * 2)
  const visibleCount = Math.round(64 * balance)
  const gutSpots = useMemo(() => {
    const spots: [number, number, number][] = []
    for (let i = 0; i < 90; i++) {
      const y = -0.62 + (i / 89) * 1.24
      const wobble = Math.sin(y * 9) * 0.06 + ((i * 37) % 17) / 170
      spots.push([wobble * 0.9, y + 0.05, 0.04 + ((i * 13) % 9) / 320])
    }
    return spots
  }, [])
  const skinSpots = useMemo(() => {
    const spots: [number, number, number][] = []
    for (let i = 0; i < 26; i++) {
      const y = -0.55 + ((i * 47) % 100) / 90
      const side = i % 2 === 0 ? -1 : 1
      spots.push([side * (0.3 + ((i * 29) % 9) / 80), y, 0.03 + ((i * 7) % 5) / 300])
    }
    return spots
  }, [])
  return (
    <group rotation={[-0.04, 0, 0]}>
      <mesh position={[0, 0, -0.18]}>
        <planeGeometry args={[4.6, 4]} />
        <meshStandardMaterial color="#F0E7DA" roughness={0.9} transparent opacity={0.9} />
      </mesh>

      {/* human silhouette */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('mb-bacteria') }}>
        <mesh position={[0, -0.28, 0]} rotation={[0, 0, 0]} scale={[1, 1.5, 0.75]}>
          <capsuleGeometry args={[0.34, 1.15, 8, 16]} />
          <meshStandardMaterial color="#B8C4CC" roughness={0.9} transparent opacity={xray ? 0.15 : 0.85} side={2} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <sphereGeometry args={[0.24, 18, 18]} />
          <meshStandardMaterial color="#B8C4CC" roughness={0.9} transparent opacity={xray ? 0.15 : 0.85} side={2} />
        </mesh>
      </group>

      {/* gut colonies */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('mb-gut') }}>
        {gutSpots.slice(0, visibleCount).map((p, index) => {
          const color = index % 9 === 0 ? GOLD : index % 7 === 0 ? VIOLET : TEAL
          return (
            <mesh key={index} position={p}>
              <sphereGeometry args={[0.032, 8, 8]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.25} transparent opacity={colonyOpacity} />
            </mesh>
          )
        })}
      </group>

      {/* skin colonies */}
      <group onClick={(event) => { event.stopPropagation(); onSelectPart('mb-skin') }}>
        {skinSpots.slice(0, Math.round(26 * balance)).map((p, index) => (
          <mesh key={index} position={p}>
            <sphereGeometry args={[0.026, 8, 8]} />
            <meshStandardMaterial color={VIOLET_SOFT} emissive={VIOLET_SOFT} emissiveIntensity={0.25} transparent opacity={colonyOpacity * 0.9} />
          </mesh>
        ))}
      </group>

      {/* close-up: gut wall patch */}
      <group position={[-1.05, 0.28, 0]} onClick={(event) => { event.stopPropagation(); onSelectPart('mb-gut') }}>
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.34, 0.05, 10, 30]} />
          <meshStandardMaterial color={TEAL_SOFT} roughness={0.6} transparent opacity={0.85} />
        </mesh>
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2
          const radius = 0.06 + ((i * 17) % 9) / 55
          return (
            <mesh key={i} position={[Math.cos(angle) * radius, Math.sin(angle) * radius, 0.03]}>
              <sphereGeometry args={[0.028, 8, 8]} />
              <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.3} transparent opacity={colonyOpacity} />
            </mesh>
          )
        })}
        {labelsVisible && <ChipLabel text="gut wall — packed with microbes" position={[0, -0.52, 0.1]} color={TEAL} />}
      </group>

      {/* helpful jobs */}
      {showJobs && (
        <group onClick={(event) => { event.stopPropagation(); onSelectPart('mb-jobs') }}>
          {([
            { label: 'digest food', position: [0.85, 0.5, 0.15] as [number, number, number], color: TEAL },
            { label: 'make vitamins', position: [0.6, -0.05, 0.15] as [number, number, number], color: GOLD },
            { label: 'train immunity', position: [0.85, -0.45, 0.15] as [number, number, number], color: VIOLET },
          ]).map((chip) => (
            <ChipLabel key={chip.label} text={chip.label} position={chip.position} color={chip.color} />
          ))}
        </group>
      )}

      <Marker position={[0.68, -0.1, 0.22]} color={TEAL} label={labelsVisible ? 'gut microbiome' : undefined} onSelect={() => onSelectPart('mb-gut')} dim={dim('mb-gut')} />
      <Marker position={[0.85, 0.72, 0.22]} color={VIOLET_SOFT} label={labelsVisible ? 'skin microbiome' : undefined} onSelect={() => onSelectPart('mb-skin')} dim={dim('mb-skin')} />
      <Marker position={[-1.55, 0.05, 0.2]} color={GOLD} label={labelsVisible ? 'mostly bacteria' : undefined} onSelect={() => onSelectPart('mb-bacteria')} dim={dim('mb-bacteria')} />
      {showJobs && <Marker position={[1.2, -0.28, 0.22]} color={SALMON} label={labelsVisible ? 'helpful jobs' : undefined} onSelect={() => onSelectPart('mb-jobs')} dim={dim('mb-jobs')} />}
      <Marker position={[0.45, 0.42, 0.2]} color={TEAL_SOFT} label={labelsVisible ? 'balanced community' : undefined} onSelect={() => onSelectPart('mb-balance')} dim={dim('mb-balance')} />

      {labelsVisible && (
        <ChipLabel text="trillions of microbes live on and in you — mostly helpful" position={[0, -1.9, 0.35]} color={TEAL} />
      )}
    </group>
  )
}

// ── scene router ────────────────────────────────────────────────────────────
type MicroSceneProps = {
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
  balance: number
  moisture: number
  foodAvailable: number
  toggles: Record<string, boolean>
  virusInspectionMode: VirusInspectionMode
  onAnimationTick: (delta: number) => void
  /** Fired when the real-structure virus GLB (whole-virion or cutaway) fails to load, so the
   *  Tune panel — which floats over the bottom of this same canvas and would otherwise sit on
   *  top of / obscure the error card's "Try again" button (Wave 14 QA finding) — can close
   *  itself out of the way. The panel stays fully reachable/reopenable afterward via its own
   *  "Tune microbe" button; this only clears it out of the failure's path once. */
  onVirusGlbError?: () => void
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

/** Imperatively drives the camera to `distance` along its current viewing direction. `<Canvas
 *  camera={{ position }}>` only applies once at mount — OrbitControls re-asserts its own
 *  spherical position every frame afterward, so a changing `cameraDistance` prop alone never
 *  reaches the actual camera. This effect updates `camera.position` directly (preserving whatever
 *  angle the user has orbited to), and pairs with `key={cameraDistance}` on <OrbitControls> below
 *  so OrbitControls re-reads that new position as its baseline instead of overriding it back.
 *  Same technique as OrganViewer's CameraDistance helper. */
function CameraDistance({ distance }: { distance: number }) {
  const { camera } = useThree()
  useEffect(() => {
    const direction = camera.position.clone()
    if (direction.lengthSq() < 0.001) direction.set(0, 0.35, 1)
    direction.normalize()
    camera.position.copy(direction.multiplyScalar(distance))
    camera.updateProjectionMatrix()
  }, [camera, distance])
  return null
}

function MicroScene(props: MicroSceneProps) {
  const { activeId, autoRotate, labelsVisible, cameraDistance, flowProgress, balance, moisture, foodAvailable, toggles } = props
  const tick = useMemo(() => props.onAnimationTick, [props.onAnimationTick])
  return (
    <Canvas camera={{ position: [0, 0.35, cameraDistance], fov: 38 }} dpr={[1, 2]} onPointerMissed={() => props.onSelectPart('none')}>
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.72} />
      <directionalLight position={[4, 5, 6]} intensity={1.15} />
      <CameraDistance distance={cameraDistance} />
      <OrbitControls key={cameraDistance} enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.65} minDistance={5.8} maxDistance={11} />
      <AnimationDriver playing={props.animationPlaying} onTick={tick} />
      <ResponsiveMicroGroup>
        {activeId === 'bacteria' && <BacteriaScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} peelWall={toggles['ba-wall'] === true} showFlagellum={toggles['ba-flagellum'] !== false} showBuddies={toggles['ba-buddies'] !== false} />}
        {activeId === 'virus' && (
          props.virusInspectionMode === 'cycle' ? (
            <VirusScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} peelCoat={toggles['vi-coat'] === true} showSpikes={toggles['vi-spikes'] !== false} showCycle={toggles['vi-cycle'] !== false} />
          ) : (
            <VirusRealStructureScene mode={props.virusInspectionMode} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} flowProgress={flowProgress} onGlbError={props.onVirusGlbError} />
          )
        )}
        {activeId === 'fungus' && <FungusScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} peelSoil={toggles['fu-soil'] === true} showSpores={toggles['fu-spores'] !== false} showYeast={toggles['fu-yeast'] !== false} moisture={moisture} />}
        {activeId === 'protozoa' && <ProtozoaScene progress={flowProgress} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} isolateActive={props.isolateActive} showMovement={toggles['pr-move'] !== false} showFeeding={toggles['pr-feed'] !== false} foodAvailable={foodAvailable} />}
        {activeId === 'microbiome' && <MicrobiomeScene progress={flowProgress} balance={balance} selectedPart={props.selectedPart} onSelectPart={props.onSelectPart} labelsVisible={labelsVisible} xray={props.xrayActive} isolateActive={props.isolateActive} showJobs={toggles['mb-jobs'] !== false} />}
      </ResponsiveMicroGroup>
    </Canvas>
  )
}

function ResponsiveMicroGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.52 : viewport.aspect < 1 ? 0.72 : 1
  return <group scale={scale}>{children}</group>
}

// ── primary lab ─────────────────────────────────────────────────────────────
type LabPart = string

const PART_META: Record<LabPart, { label: string; color: string }> = {
  'ba-wall': { label: 'Cell wall', color: TEAL },
  'ba-membrane': { label: 'Cell membrane', color: SALMON },
  'ba-dna': { label: 'DNA (genetic material)', color: GOLD },
  'ba-flagellum': { label: 'Flagellum', color: TAN },
  'ba-divide': { label: 'Cells splitting', color: TEAL_SOFT },
  'vi-coat': { label: 'Protein coat', color: VIOLET },
  'vi-genetic': { label: 'Genetic material', color: GOLD },
  'vi-spikes': { label: 'Attachment spikes', color: SALMON },
  'vi-host': { label: 'Host cell', color: GREEN },
  'vi-ha': { label: 'Hemagglutinin (HA) spikes', color: VIOLET },
  'vi-na': { label: 'Neuraminidase (NA) spikes', color: SALMON },
  'vi-envelope': { label: 'Lipid envelope', color: GOLD },
  'vi-matrix': { label: 'Matrix protein (M1)', color: TAN },
  'vi-rnp': { label: 'Ribonucleoprotein complex (RNA + nucleoprotein)', color: VIOLET_SOFT },
  'vi-capsid': { label: 'Capsid — real poliovirus protein shell (icosahedral)', color: VIOLET },
  'fu-fruit': { label: 'Fruiting body', color: SALMON },
  'fu-mycelium': { label: 'Mycelium', color: TAN },
  'fu-hyphae': { label: 'Hypha (thread)', color: SALMON },
  'fu-spores': { label: 'Spores', color: GOLD },
  'fu-yeast': { label: 'Yeast (single cell)', color: VIOLET },
  'pr-amoeba': { label: 'Amoeba', color: SALMON },
  'pr-nucleus': { label: 'Nucleus', color: GREEN },
  'pr-flagellum': { label: 'Flagellum', color: AMBER },
  'pr-cilia': { label: 'Cilia', color: VIOLET },
  'pr-food': { label: 'Food vacuole', color: GOLD },
  'mb-gut': { label: 'Gut microbiome', color: TEAL },
  'mb-skin': { label: 'Skin microbiome', color: VIOLET_SOFT },
  'mb-bacteria': { label: 'Mostly bacteria', color: GOLD },
  'mb-jobs': { label: 'Helpful jobs', color: SALMON },
  'mb-balance': { label: 'Balanced community', color: TEAL_SOFT },
}

const DEFAULT_PART_BY_MICROBE: Record<string, LabPart> = {
  bacteria: 'ba-wall',
  virus: 'vi-coat',
  fungus: 'fu-mycelium',
  protozoa: 'pr-amoeba',
  microbiome: 'mb-gut',
}

/** Default hotspot per real-structure virus inspection mode when nothing is explicitly selected —
 *  whole-virion/cutaway show the shared influenza HA hotspot, capsid shows its own single
 *  poliovirus hotspot (see VIRUS_CAPSID_HOTSPOTS), cycle falls through to DEFAULT_PART_BY_MICROBE. */
const VIRUS_INSPECTION_DEFAULT_PART: Record<VirusInspectionMode, LabPart | null> = {
  cycle: null,
  'whole-virion': 'vi-ha',
  cutaway: 'vi-ha',
  capsid: 'vi-capsid',
}

const DEFAULT_TOGGLES: Record<string, boolean> = {
  'ba-wall': false,
  'ba-flagellum': true,
  'ba-buddies': true,
  'vi-coat': false,
  'vi-spikes': true,
  'vi-cycle': true,
  'fu-soil': false,
  'fu-spores': true,
  'fu-yeast': true,
  'pr-move': true,
  'pr-feed': true,
  'mb-jobs': true,
}

export default function MicrobiologyLab() {
  const [activeId, setActiveId] = useState('bacteria')
  const [selectedPart, setSelectedPart] = useState<LabPart | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(7.6)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const [flowProgress, setFlowProgress] = useState(0)
  const [antibioticUse, setAntibioticUse] = useState(0.2)
  const [fiberIntake, setFiberIntake] = useState(0)
  const [moisture, setMoisture] = useState(0.5)
  const [foodAvailable, setFoodAvailable] = useState(0.5)
  const [toggles, setToggles] = useState(DEFAULT_TOGGLES)
  const [virusInspectionMode, setVirusInspectionModeState] = useState<VirusInspectionMode>('cycle')
  const flowAccumulator = useRef(0)
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId

  const handleAnimationTick = useCallback((delta: number) => {
    flowAccumulator.current += delta
    const steps = Math.floor(flowAccumulator.current / 0.1)
    if (steps > 0) {
      flowAccumulator.current -= steps * 0.1
      setFlowProgress((value) => (value + 0.08 * steps * 0.1) % 1)
    }
  }, [])

  const activeContent = contentById[activeId] ?? microbiology[0]
  const compareTarget = activeContent.compareCandidate ? resolveContent(activeContent.compareCandidate) : null
  const displayPart =
    selectedPart ??
    (activeId === 'virus' ? VIRUS_INSPECTION_DEFAULT_PART[virusInspectionMode] : null) ??
    DEFAULT_PART_BY_MICROBE[activeId] ??
    'ba-wall'

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

  /** Antibiotics shrink the colony, a fiber-rich diet helps it recover — both visible in the model. */
  const balance = Math.max(0.05, Math.min(1, 1 - antibioticUse * 0.85 + fiberIntake * 0.3))

  const enhancedContent: ComponentContent = useMemo(() => ({
    ...activeContent,
    keyFacts: [
      { label: 'What you are looking at', value: PART_META[displayPart]?.label ?? activeContent.name },
      ...(activeId === 'bacteria'
        ? [
            { label: 'Alive?', value: 'yes — one single cell' },
            { label: 'Copies itself', value: 'binary fission — copies DNA, splits in two' },
            { label: 'Cycle stage', value: currentStage(BACTERIA_STAGES, flowProgress).label },
          ]
        : []),
      ...(activeId === 'virus'
        ? [
            { label: 'Alive?', value: 'no — a package, not a cell' },
            { label: 'Copy machine', value: 'a host cell makes its copies' },
            { label: 'Cycle stage', value: currentStage(VIRUS_STAGES, flowProgress).label },
          ]
        : []),
      ...(activeId === 'fungus'
        ? [
            { label: 'Where the body is', value: 'hidden mycelium — mushroom is just the fruit' },
            { label: 'Moisture', value: `${Math.round(moisture * 100)}% — wetter soil, wider mycelium` },
          ]
        : []),
      ...(activeId === 'protozoa'
        ? [
            { label: 'Moves', value: flowProgress > 0.5 ? 'flagellum · cilia · false feet' : 'searching its pond drop' },
            { label: 'Food nearby', value: `${Math.round(foodAvailable * 100)}% — more food, longer pseudopod reach` },
          ]
        : []),
      ...(activeId === 'microbiome'
        ? [
            { label: 'Balance', value: `${Math.round(balance * 100)}% — antibiotics shrink it, fiber helps it recover` },
            { label: 'Mostly', value: 'bacteria, with some fungi' },
          ]
        : []),
      ...activeContent.keyFacts.slice(1, 4),
    ],
  }), [activeContent, activeId, balance, displayPart, flowProgress, moisture, foodAvailable])

  const selectMicrobe = (id: string) => {
    setActiveId(id)
    setSelectedPart(null)
  }

  const selectPart = (part: LabPart) => {
    if (part === 'none') {
      setSelectedPart(null)
      return
    }
    setSelectedPart(part)
  }

  const toggleControl = (key: string) => setToggles((current) => ({ ...current, [key]: !current[key] }))

  /** Switching influenza inspection state clears the selected hotspot — the schematic and real
   *  GLB modes use different part ids, so an id selected in one mode has no marker in another. */
  const setVirusInspectionMode = (mode: VirusInspectionMode) => {
    setVirusInspectionModeState(mode)
    setSelectedPart(null)
  }

  /** Step through the division/infection cycle one named stage at a time — pauses Play so the
   *  reached stage stays visible in the model instead of racing on to the next one. */
  const stepCycle = (kind: 'bacteria' | 'virus') => {
    const stages = kind === 'bacteria' ? BACTERIA_STAGES : VIRUS_STAGES
    setAnimationPlaying(false)
    setFlowProgress(nextStageProgress(stages, flowProgress))
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
    setFlowProgress(0)
    setAntibioticUse(0.2)
    setFiberIntake(0)
    setMoisture(0.5)
    setFoodAvailable(0.5)
    setToggles(DEFAULT_TOGGLES)
    setVirusInspectionModeState('cycle')
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={FlaskConical}
            branchName="Microbiology"
            items={LAB_ORDER.map((entry) => {
              const item = contentById[entry.id]
              return { id: entry.id, name: item?.name ?? entry.scene, meta: item?.system }
            })}
            activeItemId={activeId}
            onSelect={selectMicrobe}
            otherBranches={otherBranches}
            footerNote="Flagship microbe lab: cell structure, infection, and communities are interactive."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
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

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              {activeId === 'virus' && virusInspectionMode === 'whole-virion'
                ? 'Real influenza virion · NIH 3D · CC0'
                : activeId === 'virus' && virusInspectionMode === 'cutaway'
                  ? 'Real influenza virion · cutaway · NIH 3D / PathogenAR · CC-BY 4.0'
                  : activeId === 'virus' && virusInspectionMode === 'capsid'
                    ? 'Real poliovirus capsid · NIH 3D · CC0'
                    : 'Microbiology · tap microbes · watch them live, copy, and feed'}
            </div>
          </div>

          <MicroScene
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
            balance={balance}
            moisture={moisture}
            foodAvailable={foodAvailable}
            toggles={toggles}
            virusInspectionMode={virusInspectionMode}
            onAnimationTick={handleAnimationTick}
            onVirusGlbError={() => setControlsOpen(false)}
          />

          {/* per-component tune panel. The wrapper is pointer-events-none — same pattern as the
              attribution banner above — because the collapsed meter-chip row is a purely
              read-only display (no chip has an onClick) that otherwise sits, at z-10, above the
              entire canvas's stacking context and swallows clicks meant for whatever hotspot
              marker happens to project underneath it (confirmed for the NA-spikes/cutaway and
              lipid-envelope/whole-virion hotspots in Wave 10 QA, but any hotspot could land there
              after an orbit-drag/zoom, so the fix is structural rather than per-hotspot). Only the
              actually-interactive pieces (the Tune button, and the TunePanel once open) opt back
              in with pointer-events-auto. */}
          <div data-canvas-overlay className="pointer-events-none absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid max-w-full flex-1 grid-cols-2 gap-2 sm:max-w-[21rem] sm:grid-cols-3">
                  <Meter label="Microbe" value={activeContent.name} />
                  {activeId === 'bacteria' && <Meter label="Alive?" value="yes — 1 cell" />}
                  {activeId === 'bacteria' && <Meter label="Reproduce" value="binary fission" />}
                  {activeId === 'virus' && <Meter label="Alive?" value="no — not a cell" />}
                  {activeId === 'virus' && <Meter label="Copy" value="needs a host cell" />}
                  {activeId === 'virus' && (
                    <Meter
                      label="Inspect"
                      value={
                        virusInspectionMode === 'cycle'
                          ? 'infection cycle'
                          : virusInspectionMode === 'cutaway'
                            ? 'cutaway (real)'
                            : virusInspectionMode === 'capsid'
                              ? 'capsid (real, poliovirus)'
                              : 'whole virion (real)'
                      }
                    />
                  )}
                  {activeId === 'fungus' && <Meter label="Kingdom" value="its own — not plant" />}
                  {activeId === 'fungus' && <Meter label="Main body" value="hidden mycelium" />}
                  {activeId === 'protozoa' && <Meter label="Moves" value="whip · hairs · feet" />}
                  {activeId === 'protozoa' && <Meter label="Eats" value="engulfs food" />}
                  {activeId === 'microbiome' && <Meter label="Home" value="gut + skin" />}
                  {activeId === 'microbiome' && <Meter label="Balance" value={`${Math.round(balance * 100)}%`} />}
                  {activeId === 'bacteria' && <Meter label="Everywhere" value="soil · water · us" />}
                  {activeId === 'virus' && <Meter label="Made of" value="genes + coat" />}
                  {activeId === 'fungus' && <Meter label="Food" value="dissolves + absorbs" />}
                  {activeId === 'protozoa' && <Meter label="Cell" value="true nucleus" />}
                  {activeId === 'microbiome' && <Meter label="Mostly" value="bacteria" />}
                  {activeId === 'bacteria' && <Meter label="Stage" value={currentStage(BACTERIA_STAGES, flowProgress).label} />}
                  {activeId === 'virus' && <Meter label="Stage" value={currentStage(VIRUS_STAGES, flowProgress).label} />}
                  {activeId === 'fungus' && <Meter label="Moisture" value={`${Math.round(moisture * 100)}%`} />}
                  {activeId === 'protozoa' && <Meter label="Food" value={`${Math.round(foodAvailable * 100)}%`} />}
                  {activeId === 'microbiome' && <Meter label="Fiber" value={`${Math.round(fiberIntake * 100)}%`} />}
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="pointer-events-auto inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune microbe
                </button>
              </div>
            ) : (
              <TunePanel
                activeId={activeId}
                toggles={toggles}
                onToggle={toggleControl}
                virusInspectionMode={virusInspectionMode}
                onSetVirusInspectionMode={setVirusInspectionMode}
                antibioticUse={antibioticUse}
                setAntibioticUse={setAntibioticUse}
                fiberIntake={fiberIntake}
                setFiberIntake={setFiberIntake}
                moisture={moisture}
                setMoisture={setMoisture}
                foodAvailable={foodAvailable}
                setFoodAvailable={setFoodAvailable}
                flowProgress={flowProgress}
                onStepCycle={stepCycle}
                onClose={() => setControlsOpen(false)}
              />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Microbe switcher for every screen size, including mobile, where the ContentNav list
              in the left aside is hidden (`hidden ... lg:block`). Without this, mobile is stuck on
              Bacteria with no way to reach Virus/Fungus/Protozoa/Microbiome — same fix pattern as
              GeneticsLab's component switcher. Picking a chip drives the same selectMicrobe() path
              as the desktop ContentNav list, so the scene and Tune panel rebuild around it; the
              existing Tune panel (Inspect mode + Step infection stage buttons) is already
              unconditionally rendered below the canvas, so once Virus is reachable here,
              whole-virion/cutaway switching and infection-stage stepping are reachable too. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Microbe {LAB_ORDER.findIndex((entry) => entry.id === activeId) + 1} of {LAB_ORDER.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {LAB_ORDER.map((entry) => {
                const item = contentById[entry.id]
                const active = entry.id === activeId
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => selectMicrobe(entry.id)}
                    title={item?.name ?? entry.scene}
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
                    <FlaskConical className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{item?.name ?? entry.scene}</span>
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

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />
      <LessonModal content={enhancedContent} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={enhancedContent} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={enhancedContent} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-3 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm" title={value}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 line-clamp-2 break-words font-[family-name:var(--font-mono)] text-[11px] font-medium leading-snug text-[color:var(--color-foreground)] sm:text-sm sm:leading-normal">{value}</p>
    </div>
  )
}

function TunePanel({
  activeId,
  toggles,
  onToggle,
  virusInspectionMode,
  onSetVirusInspectionMode,
  antibioticUse,
  setAntibioticUse,
  fiberIntake,
  setFiberIntake,
  moisture,
  setMoisture,
  foodAvailable,
  setFoodAvailable,
  flowProgress,
  onStepCycle,
  onClose,
}: {
  activeId: string
  toggles: Record<string, boolean>
  onToggle: (key: string) => void
  virusInspectionMode: VirusInspectionMode
  onSetVirusInspectionMode: (mode: VirusInspectionMode) => void
  antibioticUse: number
  setAntibioticUse: Dispatch<SetStateAction<number>>
  fiberIntake: number
  setFiberIntake: Dispatch<SetStateAction<number>>
  moisture: number
  setMoisture: Dispatch<SetStateAction<number>>
  foodAvailable: number
  setFoodAvailable: Dispatch<SetStateAction<number>>
  flowProgress: number
  onStepCycle: (kind: 'bacteria' | 'virus') => void
  onClose: () => void
}) {
  const entries: [string, string][] = []
  if (activeId === 'bacteria') entries.push(['ba-wall', 'Peel the cell wall'], ['ba-flagellum', 'Show the flagellum'], ['ba-buddies', 'Show the division result'])
  if (activeId === 'virus' && virusInspectionMode === 'cycle') entries.push(['vi-coat', 'Peel the protein coat'], ['vi-spikes', 'Show attachment spikes'], ['vi-cycle', 'Show the infection cycle'])
  if (activeId === 'fungus') entries.push(['fu-soil', 'Peel the soil away'], ['fu-spores', 'Show drifting spores'], ['fu-yeast', 'Show the yeast cells'])
  if (activeId === 'protozoa') entries.push(['pr-move', 'Movement layer'], ['pr-feed', 'Feeding layer'])
  if (activeId === 'microbiome') entries.push(['mb-jobs', 'Show helpful jobs'])
  // Bacteria/virus are the two microbes with a step-through division/infection cycle — the
  // visual payoff of "Step division/infection stage" (buddies splitting off, new viruses
  // bursting near the host cell) renders inside this same canvas the panel floats over. Keep
  // this panel noticeably shorter and more translucent for those two specifically so that
  // feedback isn't hidden behind the very panel used to trigger it; on sm+ it's also capped to a
  // left-docked width (matching the toolbar's sm:left-24 offset) instead of spanning the full
  // canvas, so the host-cell/burst animation on the right stays visible while Tune is open.
  const stageDriven = activeId === 'bacteria' || activeId === 'virus'
  return (
    <div
      className={cn(
        // pointer-events-auto: the parent `data-canvas-overlay` wrapper is pointer-events-none
        // (so the collapsed meter row doesn't block hotspot clicks below it — see the comment
        // where this panel is mounted), so the actually-interactive panel has to opt back in.
        'pointer-events-auto relative grid gap-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm sm:max-w-md',
        stageDriven
          ? 'max-h-[34svh] bg-[color:var(--color-surface-raised)]/80 sm:max-h-[48svh]'
          : 'max-h-[40svh] bg-[color:var(--color-surface-raised)]/94 sm:max-h-[60svh]',
      )}
    >
      {/* Scroll affordance: on mobile this panel is deliberately shorter for bacteria/virus (see
          `stageDriven` above) so the canvas animation stays visible, which clips the panel's own
          "Step infection/division stage" button and the Guided challenge accordion below the
          fold with no native scrollbar to hint at it. Bottom fade + chevron cue makes it visible
          that scrolling reveals more — same fade pattern as PhysicsLab's Tune panel. Desktop
          (sm:) drops to a taller max-h where everything already fits, so the cue hides there. */}
      {stageDriven && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-8 items-end justify-center rounded-b-[var(--radius-lg)] bg-gradient-to-t from-[color:var(--color-surface-raised)] to-transparent pb-1 sm:hidden">
          <ChevronDown className="h-4 w-4 animate-bounce text-[color:var(--color-ink-500)]" strokeWidth={2} aria-hidden="true" />
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Tune microbe · {activeId.replace(/-/g, ' ')}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide microbe controls"
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

      {activeId === 'virus' && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Inspect</span>
          <button
            type="button"
            onClick={() => onSetVirusInspectionMode('cycle')}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              virusInspectionMode === 'cycle' ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Infection cycle (schematic)
          </button>
          <button
            type="button"
            onClick={() => onSetVirusInspectionMode('whole-virion')}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              virusInspectionMode === 'whole-virion' ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Whole virion (real influenza)
          </button>
          <button
            type="button"
            onClick={() => onSetVirusInspectionMode('cutaway')}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              virusInspectionMode === 'cutaway' ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Cutaway (real influenza)
          </button>
          <button
            type="button"
            onClick={() => onSetVirusInspectionMode('capsid')}
            className={cn(
              'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs font-semibold transition-colors',
              virusInspectionMode === 'capsid' ? 'border-transparent bg-[color:var(--color-biology-deep)] text-white' : 'text-[color:var(--color-ink-700)] hover:bg-[color:var(--color-surface)]',
            )}
          >
            Capsid (real poliovirus)
          </button>
        </div>
      )}

      {(activeId === 'bacteria' || activeId === 'virus') && (
        <div className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
          <span className="min-w-0 truncate text-xs font-medium text-[color:var(--color-ink-700)]">
            Stage: {currentStage(activeId === 'bacteria' ? BACTERIA_STAGES : VIRUS_STAGES, flowProgress).label}
          </span>
          <button
            type="button"
            onClick={() => onStepCycle(activeId === 'bacteria' ? 'bacteria' : 'virus')}
            className="shrink-0 rounded-full bg-[color:var(--color-biology-deep)] px-3 py-1.5 text-xs font-semibold text-white"
          >
            Step {activeId === 'bacteria' ? 'division' : 'infection'} stage
          </button>
        </div>
      )}

      {activeId === 'fungus' && (
        <label>
          <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
            Moisture <span className="font-[family-name:var(--font-mono)]">{Math.round(moisture * 100)}%</span>
          </span>
          <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(moisture * 100)} onChange={(event) => setMoisture(Number(event.target.value) / 100)} />
        </label>
      )}

      {activeId === 'protozoa' && (
        <label>
          <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
            Food available <span className="font-[family-name:var(--font-mono)]">{Math.round(foodAvailable * 100)}%</span>
          </span>
          <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(foodAvailable * 100)} onChange={(event) => setFoodAvailable(Number(event.target.value) / 100)} />
        </label>
      )}

      {activeId === 'microbiome' && (
        <>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Antibiotic use <span className="font-[family-name:var(--font-mono)]">{Math.round(antibioticUse * 100)}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(antibioticUse * 100)} onChange={(event) => setAntibioticUse(Number(event.target.value) / 100)} />
          </label>
          <label>
            <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
              Fiber-rich diet <span className="font-[family-name:var(--font-mono)]">{Math.round(fiberIntake * 100)}%</span>
            </span>
            <input className="w-full accent-[color:var(--color-biology-deep)]" type="range" min={0} max={100} step={1} value={Math.round(fiberIntake * 100)} onChange={(event) => setFiberIntake(Number(event.target.value) / 100)} />
          </label>
        </>
      )}

      <details open={stageDriven} className="group rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <summary className="cursor-pointer select-none text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          Guided challenge · Observe → Predict → Change → Explain → Check
        </summary>
        <ol className="mt-2 grid gap-1.5 text-xs leading-snug text-[color:var(--color-ink-700)]">
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Observe — </span>{GUIDED_PROMPTS[activeId]?.observe}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Predict — </span>{GUIDED_PROMPTS[activeId]?.predict}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Change — </span>{GUIDED_PROMPTS[activeId]?.change}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Explain — </span>{GUIDED_PROMPTS[activeId]?.explain}</li>
          <li><span className="font-semibold text-[color:var(--color-foreground)]">Check — </span>{GUIDED_PROMPTS[activeId]?.check}</li>
        </ol>
      </details>
    </div>
  )
}
