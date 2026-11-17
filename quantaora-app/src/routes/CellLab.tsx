import { useMemo, useState } from 'react'
import {
  Dna,
  PawPrint,
  Leaf,
  Bug,
  Zap,
  Droplet,
  Dumbbell,
  Fish,
  Egg,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CircleCheck,
  type LucideIcon,
} from 'lucide-react'
import { cells, cellById } from '@/data/cells'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent } from '@/data/types'
import CellViewer from '@/components/explorer/CellViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { BranchCauseEffectPanel, type GenericCauseControls } from '@/components/labs/BranchCauseEffectPanel'
import { BRANCH_CAUSE_EFFECT_CONFIGS, DEFAULT_CELL_CONTROLS } from '@/data/branchCauseEffectConfigs'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const hierarchy = HIERARCHY.biology
// Cell Biology is this lab's own live branch; Human Anatomy is a separate already-live lab,
// so both are excluded from the "other branches" (not-yet-built) list shown in the sidebar.
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'cell-biology' && b.status !== 'live')
const DEFAULT_CAMERA_DISTANCE = 3.6
const MIN_CAMERA_DISTANCE = 2
const MAX_CAMERA_DISTANCE = 6
const ZOOM_STEP = 0.35

const CELL_ICONS: Record<string, LucideIcon> = {
  'animal-cell': PawPrint,
  'plant-cell': Leaf,
  'bacterial-cell': Bug,
  neuron: Zap,
  'red-blood-cell': Droplet,
  'muscle-cell': Dumbbell,
  'sperm-cell': Fish,
  'egg-cell': Egg,
}

// ---------------------------------------------------------------------------------
// Cause & Effect process trace — a staged, component-aware sequence per cell type.
// Each stage names a real hotspot on that cell's model; stepping through stages drives
// the same isolate/dim highlight CanvasControls' "Isolate" button already uses
// (see CellModel's activeOrganelleId dimming), so every step is a real visible change on
// the 3D model, not just text. Cause/effect copy is grounded in each cell's already-authored
// hotspot descriptions, key facts, and lesson steps in data/cells.ts — nothing invented here
// changes the underlying biology facts, it only sequences and stages them.
// ---------------------------------------------------------------------------------

interface ProcessStage {
  /** Must match a hotspot id already authored on this cell in data/cells.ts. */
  hotspotId: string
  cause: string
  effect: string
}

const PROCESS_TRACE: Record<string, { topic: string; stages: ProcessStage[] }> = {
  'animal-cell': {
    topic: 'Trace a protein — energy & protein roles',
    stages: [
      { hotspotId: 'hs-dna', cause: 'DNA in the nucleus holds the instructions for a new protein.', effect: 'A copy of those instructions heads out to a ribosome.' },
      { hotspotId: 'hs-ribosome', cause: 'The ribosome reads the copied instructions.', effect: 'It strings amino acids together, building a brand-new protein.' },
      { hotspotId: 'hs-endoplasmic-reticulum', cause: 'The freshly built protein arrives at the endoplasmic reticulum.', effect: 'The ER folds it into its working shape and starts it moving onward.' },
      { hotspotId: 'hs-golgi-apparatus', cause: 'The folded protein reaches the Golgi apparatus.', effect: 'The Golgi packages and labels it, then ships it to wherever the cell needs it.' },
      { hotspotId: 'hs-mitochondrion', cause: 'Building, folding, and shipping every protein costs energy.', effect: 'Mitochondria convert nutrients and oxygen into the ATP that powers all of it.' },
      { hotspotId: 'hs-lysosome', cause: 'Old, damaged, or misfolded proteins pile up over time.', effect: 'Lysosome enzymes break them down so the cell can recycle the parts.' },
    ],
  },
  'plant-cell': {
    topic: 'Energy in, energy out — photosynthesis & respiration',
    stages: [
      { hotspotId: 'hs-chloroplast', cause: 'Sunlight strikes the chloroplast.', effect: 'It captures that light energy and builds sugar from water and carbon dioxide.' },
      { hotspotId: 'hs-mitochondrion', cause: 'The cell needs energy it can actually use, not just raw sugar.', effect: 'Mitochondria break the sugar down and release ATP.' },
      { hotspotId: 'hs-vacuole', cause: 'Water flows into the large central vacuole.', effect: 'It swells and presses outward, building turgor pressure.' },
      { hotspotId: 'hs-cell-wall', cause: 'Turgor pressure pushes against the rigid cell wall.', effect: 'The wall holds firm, keeping the cell — and the whole plant — standing upright.' },
    ],
  },
  'bacterial-cell': {
    topic: 'Defend & divide — membrane transport & binary fission',
    stages: [
      { hotspotId: 'hs-cell-membrane', cause: 'Nutrients outside the cell need to get in.', effect: "The membrane controls exactly what crosses — it's the checkpoint many antibiotics target." },
      { hotspotId: 'hs-cell-wall', cause: 'Internal pressure keeps pushing outward against the cell.', effect: "The rigid peptidoglycan wall holds the shape and stops it bursting — unless an antibiotic like penicillin blocks the wall from being built." },
      { hotspotId: 'hs-ribosome', cause: 'The cell needs new proteins in order to grow.', effect: "70S ribosomes scattered through the cytoplasm build them — a different size than the ribosomes in your own cells." },
      { hotspotId: 'hs-dna-nucleoid', cause: 'The cell has grown enough to divide.', effect: 'Its single circular chromosome copies itself, and the cell pinches in half by binary fission — one cell becomes two.' },
    ],
  },
  neuron: {
    topic: 'Trace a signal — electrical & chemical relay',
    stages: [
      { hotspotId: 'hs-dendrites', cause: 'Neurotransmitters arrive from another neuron.', effect: 'Dendrites pick up the signal and carry it toward the cell body.' },
      { hotspotId: 'hs-soma', cause: 'Signals converge from many dendrites at once.', effect: 'The soma integrates them and decides whether to fire.' },
      { hotspotId: 'hs-mitochondrion', cause: 'Firing and resetting ion balance both burn energy.', effect: 'Mitochondria in the soma keep the ATP supply flowing.' },
      { hotspotId: 'hs-axon', cause: 'The soma decides to fire.', effect: 'An electrical signal races away down the axon.' },
      { hotspotId: 'hs-myelin-sheath', cause: 'The signal needs to travel fast without leaking away.', effect: 'Myelin insulates the axon so the signal jumps quickly along it.' },
      { hotspotId: 'hs-axon-terminals', cause: 'The electrical signal reaches the end of the axon.', effect: 'It triggers the terminals to release chemical neurotransmitters.' },
      { hotspotId: 'hs-synapse', cause: 'Neurotransmitters cross the synaptic gap.', effect: "They bind to the next neuron's dendrites, continuing the signal onward." },
    ],
  },
  'red-blood-cell': {
    topic: 'Trace a delivery — gas transport across the membrane',
    stages: [
      { hotspotId: 'hs-biconcave-shape', cause: 'Both faces of the cell dip inward instead of staying flat.', effect: 'That biconcave shape maximizes surface area, so gases can diffuse in and out faster.' },
      { hotspotId: 'hs-cell-membrane', cause: 'The cell squeezes into a capillary narrower than its own width.', effect: 'Its flexible membrane bends without breaking.' },
      { hotspotId: 'hs-hemoglobin', cause: 'Oxygen is plentiful in the lungs.', effect: "Hemoglobin's iron binds it tightly for the trip through the body." },
      { hotspotId: 'hs-cytoplasm', cause: 'In a body tissue, oxygen runs low.', effect: 'Hemoglobin releases its oxygen there and picks up carbon dioxide for the return trip.' },
    ],
  },
  'muscle-cell': {
    topic: 'Trace a contraction — signal to movement',
    stages: [
      { hotspotId: 'hs-sarcolemma', cause: 'A nerve signal reaches the sarcolemma.', effect: 'The electrical signal spreads across the membrane and dives into the cell.' },
      { hotspotId: 'hs-sarcoplasmic-reticulum', cause: 'The signal reaches the sarcoplasmic reticulum.', effect: 'It releases stored calcium into the cell.' },
      { hotspotId: 'hs-myofibrils', cause: 'Calcium floods the myofibrils.', effect: 'Myosin grabs actin and pulls — the filaments slide past each other and the cell shortens.' },
      { hotspotId: 'hs-mitochondria', cause: 'Sliding filaments and resetting calcium both cost energy.', effect: 'Densely packed mitochondria keep the ATP flowing.' },
      { hotspotId: 'hs-nuclei', cause: 'This fiber runs far too long for one nucleus to manage alone.', effect: "Hundreds of nuclei, spread along its length, keep protein production going everywhere it's needed." },
    ],
  },
  'sperm-cell': {
    topic: 'Trace the journey — power to delivery',
    stages: [
      { hotspotId: 'hotspot-midpiece', cause: 'Mitochondria packed into the midpiece burn fuel.', effect: 'They generate the ATP that powers movement.' },
      { hotspotId: 'hotspot-tail', cause: 'ATP from the midpiece reaches the tail.', effect: 'The tail whips side to side, propelling the sperm forward.' },
      { hotspotId: 'hotspot-head', cause: "The sperm reaches the egg's outer coat.", effect: 'Enzymes in the acrosome digest through it, delivering the DNA inside.' },
    ],
  },
  'egg-cell': {
    topic: 'Trace fertilization — from arrival to a new cell',
    stages: [
      { hotspotId: 'hs-zona-pellucida', cause: 'A sperm cell arrives at the egg.', effect: 'The zona pellucida controls entry — and blocks any other sperm once one gets through.' },
      { hotspotId: 'hs-cell-membrane', cause: "The first sperm's membrane reaches the egg's membrane.", effect: "The two membranes fuse, letting the sperm's contents enter." },
      { hotspotId: 'hs-nucleus', cause: "The sperm's 23 chromosomes enter the egg.", effect: "They combine with the egg's own 23 chromosomes, restoring a full set of 46." },
      { hotspotId: 'hs-cytoplasm', cause: 'The new fertilized cell must survive its first days alone.', effect: 'It draws on the nutrient-rich cytoplasm stored here before it can get food any other way.' },
    ],
  },
}

const CELL_MISSIONS: Record<string, { title: string; challenge: string; parts: string[] }> = {
  'animal-cell': {
    title: 'Mission: build a working cell',
    challenge: 'Predict: what changes when the membrane controls entry, the nucleus shares DNA, and ribosomes build a protein?',
    parts: ['Cell membrane', 'Cytoplasm + organelles', 'Nucleus + DNA', 'Mitochondria', 'Ribosome'],
  },
  'plant-cell': {
    title: 'Mission: keep a plant cell firm',
    challenge: 'Predict: what changes when chloroplasts make sugar, mitochondria release energy, and the vacuole presses on the cell wall?',
    parts: ['Cell wall + membrane', 'Cytoplasm + organelles', 'Nucleus + DNA', 'Chloroplast', 'Mitochondria', 'Ribosome'],
  },
  'bacterial-cell': {
    title: 'Mission: survive and divide',
    challenge: 'Predict: what changes when the membrane selects materials, the cell wall holds shape, and ribosomes build proteins from DNA instructions?',
    parts: ['Cell membrane + cell wall', 'Cytoplasm + organelles', 'DNA nucleoid', 'Ribosome'],
  },
}

function CellMission({ cellId, labelsVisible, xrayActive, isolateActive, animationPlaying }: {
  cellId: string
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
}) {
  const mission = CELL_MISSIONS[cellId]
  if (!mission) return null
  const viewChange = [
    labelsVisible ? 'labels on' : 'labels off',
    xrayActive ? 'inside visible' : 'outer view',
    isolateActive ? 'one part isolated' : 'whole cell',
    animationPlaying ? 'process moving' : 'process paused',
  ].join(' · ')
  return (
    <section className="border-b border-[color:var(--color-border)] px-6 py-4" aria-label="Cell mission">
      <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{mission.title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{mission.challenge}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Change the view</p>
      <p className="mt-1 text-xs text-[color:var(--color-ink-700)]">{viewChange}</p>
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Observe and explain</p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-700)]">Inspect: {mission.parts.join(' · ')}. Explain how the parts work together in this cell.</p>
    </section>
  )
}

function ProcessTraceCard({
  content,
  topic,
  stages,
  stageIndex,
  revealed,
  open,
  onOpen,
  onClose,
  onReveal,
  onNext,
  onBack,
}: {
  content: ComponentContent
  topic: string
  stages: ProcessStage[]
  stageIndex: number
  revealed: boolean
  open: boolean
  onOpen: () => void
  onClose: () => void
  onReveal: () => void
  onNext: () => void
  onBack: () => void
}) {
  if (stages.length === 0) return null
  const stage = stages[Math.min(stageIndex, stages.length - 1)]
  const hotspot = content.hotspots.find((h) => h.id === stage.hotspotId) ?? null
  const isLastStage = stageIndex === stages.length - 1

  return (
    <div className="border-b border-[color:var(--color-border)]">
      <button
        type="button"
        onClick={open ? onClose : onOpen}
        className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-biology-deep)]/12 text-[color:var(--color-biology-deep)]">
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
          <span>
            <span className="block text-sm font-semibold text-[color:var(--color-foreground)]">Cause &amp; effect: trace it</span>
            <span className="block text-xs text-[color:var(--color-ink-500)]">{topic}</span>
          </span>
        </span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-[color:var(--color-ink-500)] transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="px-6 pb-5">
          <div className="mb-3 flex items-center justify-between text-xs font-medium text-[color:var(--color-ink-500)]">
            <span>
              Step {stageIndex + 1} of {stages.length}
            </span>
            <div className="flex gap-1">
              {stages.map((s, i) => (
                <span
                  key={s.hotspotId}
                  className={cn(
                    'h-1.5 w-4 rounded-full transition-colors',
                    i === stageIndex ? 'bg-[color:var(--color-biology-deep)]' : 'bg-[color:var(--color-border)]',
                  )}
                />
              ))}
            </div>
          </div>

          {hotspot && (
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: hotspot.color }} />
              <span className="text-sm font-semibold text-[color:var(--color-foreground)]">{hotspot.label}</span>
            </div>
          )}

          <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{stage.cause}</p>

          {!revealed ? (
            <div className="mt-3">
              <p className="text-xs italic text-[color:var(--color-ink-500)]">Predict: what happens next?</p>
              <Button variant="secondary" size="sm" className="mt-2" onClick={onReveal}>
                Reveal what happens <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Effect</p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-foreground)]">{stage.effect}</p>
            </div>
          )}

          {revealed && isLastStage && (
            <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
              <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-biology-deep)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Check yourself</p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{content.lesson.checkpoint}</p>
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBack} disabled={stageIndex === 0}>
              <ArrowLeft className="h-3.5 w-3.5" /> Back
            </Button>
            <Button variant="secondary" size="sm" onClick={onNext}>
              {isLastStage ? (
                <>
                  <RotateCcw className="h-3.5 w-3.5" /> Restart
                </>
              ) : (
                <>
                  Next step <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CellLab() {
  const [cellId, setCellId] = useState(cells[0].id)
  const [activeOrganelleId, setActiveOrganelleId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [animationAvailable, setAnimationAvailable] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [traceOpen, setTraceOpen] = useState(false)
  const [traceIndex, setTraceIndex] = useState(0)
  const [traceRevealed, setTraceRevealed] = useState(false)
  const [cellControls, setCellControls] = useState<GenericCauseControls>(DEFAULT_CELL_CONTROLS)

  const content = cellById[cellId]
  const compareTarget = content.compareCandidate ? resolveContent(content.compareCandidate) : null
  const activeHotspot = useMemo(
    () => content.hotspots.find((h) => h.id === activeOrganelleId) ?? null,
    [content, activeOrganelleId],
  )
  const isolateActive = activeOrganelleId !== null
  const trace = PROCESS_TRACE[cellId]
  const traceStages = trace?.stages ?? []

  const selectCell = (id: string) => {
    setCellId(id)
    setActiveOrganelleId(null)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setXrayActive(false)
    setAnimationAvailable(false)
    setAnimationPlaying(true)
    setResetSignal((s) => s + 1)
    setTraceOpen(false)
    setTraceIndex(0)
    setTraceRevealed(false)
  }

  const selectOrganelle = (id: string) => {
    // Manually picking a different structure on the model breaks out of the guided
    // trace sequence so the isolate highlight isn't fighting two sources of truth.
    if (traceOpen) setTraceOpen(false)
    setActiveOrganelleId((cur) => (cur === id ? null : id))
  }

  const openTrace = () => {
    if (traceStages.length === 0) return
    setTraceOpen(true)
    setTraceIndex(0)
    setTraceRevealed(false)
    setActiveOrganelleId(traceStages[0].hotspotId)
  }
  const closeTrace = () => {
    setTraceOpen(false)
    setActiveOrganelleId(null)
  }
  const revealTraceEffect = () => setTraceRevealed(true)
  const nextTraceStage = () => {
    if (traceIndex >= traceStages.length - 1) {
      setTraceIndex(0)
      setTraceRevealed(false)
      setActiveOrganelleId(traceStages[0].hotspotId)
      return
    }
    const next = traceIndex + 1
    setTraceIndex(next)
    setTraceRevealed(false)
    setActiveOrganelleId(traceStages[next].hotspotId)
  }
  const prevTraceStage = () => {
    if (traceIndex === 0) return
    const prev = traceIndex - 1
    setTraceIndex(prev)
    setTraceRevealed(true)
    setActiveOrganelleId(traceStages[prev].hotspotId)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={Dna}
            branchName="Cell Biology"
            items={cells.map((c) => ({ id: c.id, name: c.name, meta: c.scientificName, icon: CELL_ICONS[c.id] }))}
            activeItemId={cellId}
            onSelect={selectCell}
            otherBranches={otherBranches}
            footerNote="Animal Cell and Neuron now use project-owned animated GLBs. The rest are procedurally built: membrane and organelles rendered as real 3D geometry, colored and placed to match each cell type's biology."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() => {
              setTraceOpen(false)
              setActiveOrganelleId((id) => (id ? null : content.hotspots[0].id))
            }}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() =>
              setCameraDistance((distance) =>
                Math.max(MIN_CAMERA_DISTANCE, Number((distance - ZOOM_STEP).toFixed(2))),
              )
            }
            onZoomOut={() =>
              setCameraDistance((distance) =>
                Math.min(MAX_CAMERA_DISTANCE, Number((distance + ZOOM_STEP).toFixed(2))),
              )
            }
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((v) => !v)}
            animationAvailable={animationAvailable}
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((v) => !v)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => {
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setResetSignal((s) => s + 1)
            }}
            onReset={() => {
              setActiveOrganelleId(null)
              setAutoRotate(true)
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setXrayActive(false)
              setAnimationPlaying(true)
              setCleanView(false)
              setResetSignal((s) => s + 1)
              setTraceOpen(false)
              setTraceIndex(0)
              setTraceRevealed(false)
            }}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Touch a structure to explore</span>
              <span className="hidden sm:inline">{content.name} · drag to rotate · click a structure</span>
            </div>
          </div>
          <CellViewer
            organelles={content.organelles}
            hotspots={content.hotspots}
            activeOrganelle={activeOrganelleId}
            onSelectOrganelle={selectOrganelle}
            autoRotate={autoRotate}
            resetSignal={resetSignal}
            modelType={content.modelType}
            modelUrl={content.modelUrl}
            modelRotation={content.modelRotation}
            modelOffset={content.modelOffset}
            modelScale={content.modelScale}
            cameraDistance={cameraDistance}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            animationPlaying={animationPlaying}
            onAnimationAvailability={setAnimationAvailable}
          />
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <BranchCauseEffectPanel
            activeId={cellId}
            config={BRANCH_CAUSE_EFFECT_CONFIGS['cell-biology']}
            controls={cellControls}
            onChange={setCellControls}
          />
          <CellMission
            cellId={cellId}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
          />
          {traceStages.length > 0 && (
            <ProcessTraceCard
              content={content}
              topic={trace.topic}
              stages={traceStages}
              stageIndex={traceIndex}
              revealed={traceRevealed}
              open={traceOpen}
              onOpen={openTrace}
              onClose={closeTrace}
              onReveal={revealTraceEffect}
              onNext={nextTraceStage}
              onBack={prevTraceStage}
            />
          )}
          <DetailPanel
            content={content}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveOrganelleId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} labState={{ cellControls }} />

      <LessonModal content={content} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={content} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
