import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import {
  Atom,
  BadgeCheck,
  CheckCircle2,
  Flame,
  FlaskConical,
  PackageCheck,
  Snowflake,
  SlidersHorizontal,
  X,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
import { chemical_reactions, chemical_reactionsById } from '@/data/generated/chemical_reactions'
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

const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const HYDROGEN = '#DDEAF6'
const OXYGEN = '#D86459'
const BLUE = '#4F83C4'
const GREEN = '#5E9E67'
const RED = '#D86459'
const VIOLET = '#7D69B3'
const AMBER = '#C9863A'
const DEFAULT_COMPONENT_ID = 'balanced-equation'
const DEFAULT_CAMERA_DISTANCE = 7.3
const MIN_CAMERA_DISTANCE = 5.2
const MAX_CAMERA_DISTANCE = 10.4
const ZOOM_STEP = 0.45

// Real, sourced physical-apparatus asset (Poly Haven "Bunsen Burner", CC0 - see
// docs/ASSET-LICENSES.md and src/data/modelRegistry.ts). Reaction particles and state changes
// stay procedural; this is a static prop with its own selectable, runtime-synthesized hotspot.
const BUNSEN_BURNER_MODEL_URL = '/models/chemistry/chemical-reactions/bunsen-burner.glb'
const BUNSEN_HOTSPOT_ID = 'apparatus-bunsen-burner'
useGLTF.preload(BUNSEN_BURNER_MODEL_URL)

type ReactionMode = 'balance' | 'mass' | 'thermal' | 'roles'
type PredictionValue = 'balanced' | 'unbalanced' | 'released' | 'absorbed' | 'reactants' | 'products'

interface ReactionControls {
  hydrogenCoeff: number
  oxygenCoeff: number
  waterCoeff: number
  temperature: number
  catalyst: number
  heatMode: 'exo' | 'endo'
}

interface ReactionState {
  progress: number
}

const COMPONENT_ICONS: Record<string, LucideIcon> = {
  'balanced-equation': BadgeCheck,
  coefficient: Atom,
  'conservation-of-mass': PackageCheck,
  endothermic: Snowflake,
  exothermic: Flame,
  product: FlaskConical,
  reactant: FlaskConical,
}

const hierarchy = HIERARCHY.chemistry
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'chemical-reactions')

function reactionMode(componentId: string): ReactionMode {
  if (componentId === 'conservation-of-mass') return 'mass'
  if (componentId === 'endothermic' || componentId === 'exothermic') return 'thermal'
  if (componentId === 'reactant' || componentId === 'product') return 'roles'
  return 'balance'
}

function atomCounts(controls: ReactionControls) {
  const leftH = controls.hydrogenCoeff * 2
  const leftO = controls.oxygenCoeff * 2
  const rightH = controls.waterCoeff * 2
  const rightO = controls.waterCoeff
  const hGap = leftH - rightH
  const oGap = leftO - rightO
  const balanced = hGap === 0 && oGap === 0
  const mismatch = Math.abs(hGap) + Math.abs(oGap)
  const rate = Math.max(0.05, (controls.temperature / 100) * (1 + controls.catalyst * 1.25) * (balanced ? 1 : 0.35))
  const heat = controls.heatMode === 'exo' ? Math.round(40 + controls.temperature * 0.45) : -Math.round(25 + (100 - controls.temperature) * 0.28)
  return { leftH, leftO, rightH, rightO, hGap, oGap, balanced, mismatch, rate, heat }
}

function apparatusObservation(controls: ReactionControls, counts: ReturnType<typeof atomCounts>) {
  const flame = controls.heatMode === 'endo' ? 'steady heating flame' : 'starter spark'
  const heatDirection = controls.heatMode === 'endo' ? 'energy arrows pull inward' : 'energy arrows push outward'
  const balanceEffect = counts.balanced ? 'products can build smoothly' : 'the arrow warns that atoms do not match yet'
  return `${flame}; ${heatDirection}; rate ${counts.rate.toFixed(1)}x, so ${balanceEffect}.`
}

function missionSpec(mode: ReactionMode, controls: ReactionControls, counts: ReturnType<typeof atomCounts>) {
  if (mode === 'mass') {
    return {
      mission: 'Mission: Conservation of mass',
      change: 'Change coefficients first, then predict whether the atom ledger will still match.',
      observe: `Observe: H ${counts.leftH}->${counts.rightH}, O ${counts.leftO}->${counts.rightO}; total atoms ${counts.leftH + counts.leftO}->${counts.rightH + counts.rightO}.`,
      explain: counts.balanced
        ? 'Explain: Same atoms on both sides means mass is conserved.'
        : 'Explain: A mismatch means the written equation breaks conservation until coefficients are fixed.',
    }
  }
  if (mode === 'thermal') {
    return {
      mission: controls.heatMode === 'exo' ? 'Mission: Exothermic energy flow' : 'Mission: Endothermic energy flow',
      change: 'Change heat mode only after predicting whether energy leaves or enters the reaction.',
      observe: `Observe: ${apparatusObservation(controls, counts)}`,
      explain: 'Explain: Exothermic sends energy outward; endothermic pulls energy inward while temperature changes the rate.',
    }
  }
  if (mode === 'roles') {
    return {
      mission: 'Mission: Reactants become products',
      change: 'Change coefficients and predict which side gains molecules as the arrow runs.',
      observe: `Observe: reactants ${controls.hydrogenCoeff} H2 + ${controls.oxygenCoeff} O2, products ${controls.waterCoeff} H2O, rate ${counts.rate.toFixed(1)}x.`,
      explain: 'Explain: Reactants start on the left and products form on the right from the same conserved atoms.',
    }
  }
  return {
    mission: 'Mission: Balance coefficients',
    change: 'Change H2, O2, and H2O coefficients only after predicting balanced or not balanced.',
    observe: `Observe: atom gap ${counts.mismatch}; catalyst ${Math.round(controls.catalyst * 100)}% and ${controls.temperature} C set rate ${counts.rate.toFixed(1)}x.`,
    explain: 'Explain: Coefficients count whole molecules; temperature and catalyst change rate, not atom conservation.',
  }
}

function predictionSpec(mode: ReactionMode, controls: ReactionControls, counts: ReturnType<typeof atomCounts>) {
  if (mode === 'thermal') {
    return {
      question: 'Does energy leave (release) or enter (absorb) as this reaction runs?',
      options: [
        { value: 'released' as const, label: 'Released' },
        { value: 'absorbed' as const, label: 'Absorbed' },
      ],
      actual: (controls.heatMode === 'exo' ? 'released' : 'absorbed') as PredictionValue,
      explain: `Heat mode is set to ${controls.heatMode === 'exo' ? 'exothermic' : 'endothermic'}, so energy is ${controls.heatMode === 'exo' ? 'released outward' : 'absorbed inward'} (${counts.heat} kJ).`,
    }
  }
  if (mode === 'roles') {
    return {
      question: 'As the arrow runs, which side gains molecules?',
      options: [
        { value: 'reactants' as const, label: 'Reactants' },
        { value: 'products' as const, label: 'Products' },
      ],
      actual: 'products' as PredictionValue,
      explain: 'Reactants are used up on the left; products form on the right as the reaction proceeds.',
    }
  }
  return {
    question: 'Is this recipe balanced before it runs?',
    options: [
      { value: 'balanced' as const, label: 'Balanced' },
      { value: 'unbalanced' as const, label: 'Not balanced' },
    ],
    actual: (counts.balanced ? 'balanced' : 'unbalanced') as PredictionValue,
    explain: `H tallies ${counts.leftH} to ${counts.rightH}, O tallies ${counts.leftO} to ${counts.rightO} - the recipe is ${counts.balanced ? 'balanced' : 'not balanced yet'}.`,
  }
}

function readout(componentId: string, controls: ReactionControls) {
  const counts = atomCounts(controls)
  switch (componentId) {
    case 'coefficient':
      return {
        title: 'Coefficient challenge',
        primaryLabel: 'Recipe',
        primaryValue: `${controls.hydrogenCoeff}H2 + ${controls.oxygenCoeff}O2 -> ${controls.waterCoeff}H2O`,
        resultLabel: 'Atom gap',
        resultValue: counts.mismatch === 0 ? '0' : `${counts.mismatch}`,
        secondLabel: 'Fix',
        secondValue: counts.balanced ? 'balanced' : 'adjust coeffs',
        explanation: 'Coefficients count whole molecules. Change coefficients to balance atom counts without changing the formulas.',
      }
    case 'conservation-of-mass':
      return {
        title: 'Mass conservation challenge',
        primaryLabel: 'Left atoms',
        primaryValue: `${counts.leftH + counts.leftO}`,
        resultLabel: 'Right atoms',
        resultValue: `${counts.rightH + counts.rightO}`,
        secondLabel: 'Law',
        secondValue: counts.balanced ? 'obeyed' : 'broken',
        explanation: 'Atoms cannot appear or vanish. The count panels expose whether the written equation respects conservation of mass.',
      }
    case 'endothermic':
      return {
        title: 'Endothermic challenge',
        primaryLabel: 'Heat flow',
        primaryValue: controls.heatMode === 'endo' ? 'into reaction' : 'outward',
        resultLabel: 'Energy',
        resultValue: `${counts.heat} kJ`,
        secondLabel: 'Temperature',
        secondValue: `${controls.temperature} C`,
        explanation: 'Endothermic reactions absorb energy from the surroundings. Switch heat flow and watch the energy arrows reverse.',
      }
    case 'exothermic':
      return {
        title: 'Exothermic challenge',
        primaryLabel: 'Heat flow',
        primaryValue: controls.heatMode === 'exo' ? 'outward' : 'inward',
        resultLabel: 'Energy',
        resultValue: `${counts.heat} kJ`,
        secondLabel: 'Glow',
        secondValue: controls.heatMode === 'exo' ? 'bright' : 'cool',
        explanation: 'Exothermic reactions release energy. The products sit lower in energy, and the extra leaves as heat or light.',
      }
    case 'product':
      return {
        title: 'Product challenge',
        primaryLabel: 'Products',
        primaryValue: `${controls.waterCoeff} H2O`,
        resultLabel: 'Made',
        resultValue: `${Math.round(controls.waterCoeff * counts.rate)} units`,
        secondLabel: 'Rate',
        secondValue: `${counts.rate.toFixed(1)}x`,
        explanation: 'Products form on the right side. Higher temperature and catalyst help a balanced reaction make products faster.',
      }
    case 'reactant':
      return {
        title: 'Reactant challenge',
        primaryLabel: 'Reactants',
        primaryValue: `${controls.hydrogenCoeff} H2 + ${controls.oxygenCoeff} O2`,
        resultLabel: 'Used',
        resultValue: counts.balanced ? 'matched' : 'left over',
        secondLabel: 'Rate',
        secondValue: `${counts.rate.toFixed(1)}x`,
        explanation: 'Reactants are starting materials on the left. If the recipe is not balanced, atoms are left over or missing.',
      }
    default:
      return {
        title: 'Balance challenge',
        primaryLabel: 'Hydrogen',
        primaryValue: `${counts.leftH}:${counts.rightH}`,
        resultLabel: 'Oxygen',
        resultValue: `${counts.leftO}:${counts.rightO}`,
        secondLabel: 'Equation',
        secondValue: counts.balanced ? 'balanced' : 'unbalanced',
        explanation: 'A balanced equation has the same number of each atom on both sides. Coefficients fix the recipe.',
      }
  }
}

export default function ChemicalReactionsLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [controls, setControls] = useState<ReactionControls>({
    hydrogenCoeff: 2,
    oxygenCoeff: 1,
    waterCoeff: 2,
    temperature: 55,
    catalyst: 0.25,
    heatMode: 'exo',
  })
  const [state, setState] = useState<ReactionState>({ progress: 0 })
  const [prediction, setPrediction] = useState<PredictionValue | null>(null)
  const [checked, setChecked] = useState(false)
  const accumulator = useRef(0)

  const content = chemical_reactionsById[componentId] ?? chemical_reactionsById[DEFAULT_COMPONENT_ID] ?? chemical_reactions[0]
  const copy = useMemo(() => readout(componentId, controls), [componentId, controls])
  const mode = reactionMode(componentId)

  // A prediction only counts against the current recipe/heat mode. Any coefficient or heat-mode
  // change (or switching component) invalidates a stale prediction so the learner predicts again
  // before checking.
  useEffect(() => {
    setPrediction(null)
    setChecked(false)
  }, [controls.hydrogenCoeff, controls.oxygenCoeff, controls.waterCoeff, controls.heatMode, componentId])
  const compareTarget = content.compareCandidate
    ? (chemical_reactionsById[content.compareCandidate] ?? resolveContent(content.compareCandidate))
    : null
  // Real physical apparatus (not part of the authored equation-scene content), so its detail
  // copy is synthesized here at runtime rather than authored into model-metadata.json/codegen -
  // same pattern this file already uses for enhancedContent.keyFacts below.
  const burnerHotspot: Hotspot = useMemo(() => ({
    id: BUNSEN_HOTSPOT_ID,
    label: 'Heat source: Bunsen burner',
    position: [0, -0.4, -0.32],
    color: AMBER,
    description: controls.heatMode === 'exo'
      ? "A real Bunsen burner - the classic lab heat source. This exothermic reaction only needs a spark to start: once lit, it releases more energy than the flame put in, so it can keep itself going."
      : "A real Bunsen burner - the classic lab heat source. This endothermic reaction needs a steady flame under it the whole time: it keeps absorbing energy from the burner, and stops as soon as the heat is removed.",
    function: 'Provides the ignition spark or steady heat that real reactions need to start or keep running.',
  }), [controls.heatMode])
  const activeHotspot = useMemo(() => {
    if (activeHotspotId === BUNSEN_HOTSPOT_ID) return burnerHotspot
    return content.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null
  }, [content, activeHotspotId, burnerHotspot])
  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    system: content.system.replace(/^The\s+/i, ''),
    keyFacts: [
      { label: copy.primaryLabel, value: copy.primaryValue },
      { label: copy.resultLabel, value: copy.resultValue },
      { label: copy.secondLabel, value: copy.secondValue },
      ...content.keyFacts.slice(0, 4),
    ],
  }), [content, copy])

  const tick = useCallback((delta: number) => {
    const counts = atomCounts(controls)
    accumulator.current += delta
    const steps = Math.floor(accumulator.current / 0.04)
    if (steps <= 0) return
    accumulator.current -= steps * 0.04
    setState((value) => ({ progress: (value.progress + steps * 0.01 * counts.rate) % 1 }))
  }, [controls])

  const selectComponent = (id: string) => {
    setComponentId(id)
    setActiveHotspotId(null)
    setIsolateActive(false)
    setControlsOpen(false)
    if (id === 'endothermic') setControls((value) => ({ ...value, heatMode: 'endo' }))
    if (id === 'exothermic') setControls((value) => ({ ...value, heatMode: 'exo' }))
  }

  const reset = () => {
    accumulator.current = 0
    setState({ progress: 0 })
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(false)
    setCleanView(false)
    setControlsOpen(false)
    setPrediction(null)
    setChecked(false)
    setControls({ hydrogenCoeff: 2, oxygenCoeff: 1, waterCoeff: 2, temperature: 55, catalyst: 0.25, heatMode: 'exo' })
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Chemistry"
            subjectColor="var(--color-chemistry-deep)"
            defaultIcon={FlaskConical}
            branchName="Chemical Reactions"
            items={chemical_reactions.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.system,
              icon: COMPONENT_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship reaction lab: balance coefficients, track atoms, change heat flow, and tune reaction rate."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => {
              setIsolateActive((value) => !value)
              if (!isolateActive && !activeHotspotId) setActiveHotspotId(content.hotspots[0]?.id ?? null)
            }}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setCameraDistance((distance) => Math.max(MIN_CAMERA_DISTANCE, Number((distance - ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setCameraDistance((distance) => Math.min(MAX_CAMERA_DISTANCE, Number((distance + ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((value) => !value)}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setCameraDistance(DEFAULT_CAMERA_DISTANCE)}
            onReset={reset}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
              Reactions - balance atoms, then run the reaction
            </div>
          </div>

          <ReactionScene
            componentId={componentId}
            content={content}
            state={state}
            controls={controls}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={setActiveHotspotId}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            onTick={tick}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={copy.primaryLabel} value={copy.primaryValue} />
                  <Meter label={copy.resultLabel} value={copy.resultValue} />
                  <Meter label={copy.secondLabel} value={copy.secondValue} />
                </div>
                <button type="button" onClick={() => setControlsOpen(true)} className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm">
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune reaction
                </button>
              </div>
            ) : (
              <TunePanel
                copy={copy}
                mode={mode}
                controls={controls}
                setControls={setControls}
                prediction={prediction}
                setPrediction={setPrediction}
                checked={checked}
                setChecked={setChecked}
                onClose={() => setControlsOpen(false)}
              />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <DetailPanel content={enhancedContent} activeHotspot={activeHotspot} onClearHotspot={() => setActiveHotspotId(null)} onOpenLesson={() => setLessonOpen(true)} />
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
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 truncate font-[family-name:var(--font-mono)] text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">{value}</p>
    </div>
  )
}

function TunePanel({
  copy,
  mode,
  controls,
  setControls,
  prediction,
  setPrediction,
  checked,
  setChecked,
  onClose,
}: {
  copy: ReturnType<typeof readout>
  mode: ReactionMode
  controls: ReactionControls
  setControls: Dispatch<SetStateAction<ReactionControls>>
  prediction: PredictionValue | null
  setPrediction: Dispatch<SetStateAction<PredictionValue | null>>
  checked: boolean
  setChecked: Dispatch<SetStateAction<boolean>>
  onClose: () => void
}) {
  const update = (patch: Partial<ReactionControls>) => setControls((value) => ({ ...value, ...patch }))
  const counts = atomCounts(controls)
  const mission = missionSpec(mode, controls, counts)
  return (
    <div className="grid max-h-[46svh] gap-3 overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{copy.title}</span>
        <button type="button" onClick={onClose} aria-label="Hide reaction controls" className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{copy.explanation}</p>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-chemistry-deep)]/25 bg-[color:var(--color-chemistry-soft)]/45 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-chemistry-deep)]">{mission.mission}</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">Predict what changes before you adjust coefficients or heat mode, then run the observation.</p>
      </div>
      <PredictCheck mode={mode} controls={controls} prediction={prediction} setPrediction={setPrediction} checked={checked} setChecked={setChecked} />
      <div className="grid gap-1.5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Change:</span> {mission.change}
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> {mission.observe.replace(/^Observe:\s*/, '')}
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> {mission.explain.replace(/^Explain:\s*/, '')}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <RangeControl label="H2 coefficient" value={controls.hydrogenCoeff} min={1} max={4} step={1} valueText={`${controls.hydrogenCoeff}`} onChange={(hydrogenCoeff) => update({ hydrogenCoeff })} />
        <RangeControl label="O2 coefficient" value={controls.oxygenCoeff} min={1} max={4} step={1} valueText={`${controls.oxygenCoeff}`} onChange={(oxygenCoeff) => update({ oxygenCoeff })} />
        <RangeControl label="H2O coefficient" value={controls.waterCoeff} min={1} max={5} step={1} valueText={`${controls.waterCoeff}`} onChange={(waterCoeff) => update({ waterCoeff })} />
        <RangeControl label="Temperature" value={controls.temperature} min={10} max={100} step={1} valueText={`${controls.temperature} C`} onChange={(temperature) => update({ temperature })} />
        <RangeControl label="Catalyst help" value={controls.catalyst} min={0} max={1} step={0.01} valueText={`${Math.round(controls.catalyst * 100)}%`} onChange={(catalyst) => update({ catalyst })} />
        <button type="button" onClick={() => update({ heatMode: controls.heatMode === 'exo' ? 'endo' : 'exo' })} className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-left text-xs font-semibold text-[color:var(--color-foreground)]">
          Heat mode: {controls.heatMode === 'exo' ? 'Exothermic' : 'Endothermic'}
        </button>
      </div>
    </div>
  )
}

function PredictCheck({
  mode,
  controls,
  prediction,
  setPrediction,
  checked,
  setChecked,
}: {
  mode: ReactionMode
  controls: ReactionControls
  prediction: PredictionValue | null
  setPrediction: Dispatch<SetStateAction<PredictionValue | null>>
  checked: boolean
  setChecked: Dispatch<SetStateAction<boolean>>
}) {
  const counts = atomCounts(controls)
  const spec = predictionSpec(mode, controls, counts)
  const isCorrect = checked && prediction === spec.actual
  const isWrong = checked && prediction !== null && prediction !== spec.actual
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Predict, then check</p>
      <p className="mt-0.5 text-xs text-[color:var(--color-ink-500)]">{spec.question}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {spec.options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => { setPrediction(option.value); setChecked(false) }}
            aria-pressed={prediction === option.value}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${prediction === option.value ? 'border-[color:var(--color-chemistry-deep)] bg-[color:var(--color-chemistry-deep)]/12 text-[color:var(--color-foreground)]' : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)]'}`}
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          disabled={!prediction}
          onClick={() => setChecked(true)}
          className="rounded-full bg-[color:var(--color-chemistry-deep)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Check
        </button>
      </div>
      {checked && prediction && (
        <p className={`mt-2 flex items-start gap-1.5 text-xs font-medium leading-relaxed ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isCorrect ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>
            {isCorrect ? 'Correct. ' : isWrong ? 'Not quite. ' : ''}
            {spec.explain}
          </span>
        </p>
      )}
    </div>
  )
}

function RangeControl({ label, value, min, max, step, valueText, onChange }: { label: string; value: number; min: number; max: number; step: number; valueText: string; onChange: (value: number) => void }) {
  return (
    <label>
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label} <span className="font-[family-name:var(--font-mono)]">{valueText}</span>
      </span>
      <input className="w-full accent-[color:var(--color-chemistry-deep)]" type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  )
}

function ReactionScene({
  componentId,
  content,
  state,
  controls,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  onTick,
}: {
  componentId: string
  content: ComponentContent
  state: ReactionState
  controls: ReactionControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  onTick: (delta: number) => void
}) {
  return (
    <Canvas className="h-full w-full" style={{ display: 'block', height: '100%', width: '100%' }} camera={{ position: [0, 1.45, cameraDistance], fov: 39 }} dpr={[1, 2]} onPointerMissed={() => onSelectHotspot(null)}>
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 6, 5]} intensity={1.05} />
      <directionalLight position={[-4, 3, 2]} intensity={0.42} color="#D8EAFF" />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.44} minDistance={5} maxDistance={10.8} />
      <AnimationDriver playing={animationPlaying} onTick={onTick} />
      <ResponsiveReactionGroup>
        <ReactionRig componentId={componentId} content={content} state={state} controls={controls} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} labelsVisible={labelsVisible} xrayActive={xrayActive} isolateActive={isolateActive} />
      </ResponsiveReactionGroup>
    </Canvas>
  )
}

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  useFrame((_, delta) => {
    if (playing) onTick(delta)
  })
  return null
}

function ResponsiveReactionGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.56 : viewport.aspect < 1 ? 0.72 : 0.92
  return <group scale={scale} position={[0, -0.08, 0]}>{children}</group>
}

function ReactionRig({
  componentId,
  content,
  state,
  controls,
  activeHotspotId,
  onSelectHotspot,
  labelsVisible,
  xrayActive,
  isolateActive,
}: {
  componentId: string
  content: ComponentContent
  state: ReactionState
  controls: ReactionControls
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
}) {
  const counts = atomCounts(controls)
  const focus = componentId
  const dim = (id: string) => isolateActive && focus !== id && activeHotspotId === null
  return (
    <group rotation={[-0.03, -0.24, 0]}>
      <Bench xrayActive={xrayActive} />
      <BunsenBurnerProp
        thermalActive={componentId === 'exothermic' || componentId === 'endothermic'}
        heatMode={controls.heatMode}
        temperature={controls.temperature}
        selected={activeHotspotId === BUNSEN_HOTSPOT_ID}
        labelsVisible={labelsVisible}
        onSelect={() => onSelectHotspot(BUNSEN_HOTSPOT_ID)}
      />
      <Reactants controls={controls} dim={dim('reactant')} />
      <Products controls={controls} progress={state.progress} dim={dim('product')} />
      <ReactionArrow progress={state.progress} counts={counts} dim={dim('balanced-equation')} />
      <CountPanels counts={counts} focus={focus} dim={dim('conservation-of-mass') && dim('coefficient')} />
      <ThermalFlow controls={controls} counts={counts} focus={focus} dim={dim('endothermic') && dim('exothermic')} />
      <RateChips counts={counts} controls={controls} />
      {content.hotspots.slice(0, 5).map((hotspot, index) => (
        <ReactionHotspot key={hotspot.id} hotspot={hotspot} index={index} active={activeHotspotId === hotspot.id} labelsVisible={labelsVisible} dim={isolateActive && activeHotspotId !== null && activeHotspotId !== hotspot.id} onSelect={onSelectHotspot} />
      ))}
      <ComponentStrip content={content} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} />
    </group>
  )
}

function Bench({ xrayActive }: { xrayActive: boolean }) {
  return (
    <mesh position={[0, -0.46, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3.45, 1.9, 1]}>
      <cylinderGeometry args={[1, 1, 0.12, 64]} />
      <meshStandardMaterial color="#E9DECE" roughness={0.92} transparent={xrayActive} opacity={xrayActive ? 0.42 : 1} />
    </mesh>
  )
}

/** Guards the real bunsen-burner.glb load. On failure (offline/CDN hiccup) the apparatus is
 *  simply omitted rather than crashing the whole reaction canvas -- everything else (the
 *  procedural equation scene, hotspots, toolbar) keeps working. */
class BunsenBurnerBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.warn('[ChemicalReactionsLab] bunsen-burner.glb failed to load; heat-source apparatus hidden.', error)
  }
  render() {
    return this.state.hasError ? null : this.props.children
  }
}

/** Real, static physical-apparatus prop (sourced GLB, see docs/ASSET-LICENSES.md) sitting on the
 *  bench behind the reaction. Always present -- a lab bench has its burner -- and independently
 *  selectable via its own runtime-synthesized hotspot (see `burnerHotspot` above). Its small
 *  procedural flame glow reflects the reaction's existing heat-mode state; it does not drive any
 *  new physics of its own. */
function BunsenBurnerProp({
  thermalActive,
  heatMode,
  temperature,
  selected,
  labelsVisible,
  onSelect,
}: {
  thermalActive: boolean
  heatMode: ReactionControls['heatMode']
  temperature: number
  selected: boolean
  labelsVisible: boolean
  onSelect: () => void
}) {
  return (
    <BunsenBurnerBoundary>
      <Suspense fallback={null}>
        <BunsenBurnerModel thermalActive={thermalActive} heatMode={heatMode} temperature={temperature} selected={selected} labelsVisible={labelsVisible} onSelect={onSelect} />
      </Suspense>
    </BunsenBurnerBoundary>
  )
}

function BunsenBurnerModel({
  thermalActive,
  heatMode,
  temperature,
  selected,
  labelsVisible,
  onSelect,
}: {
  thermalActive: boolean
  heatMode: ReactionControls['heatMode']
  temperature: number
  selected: boolean
  labelsVisible: boolean
  onSelect: () => void
}) {
  const { scene } = useGLTF(BUNSEN_BURNER_MODEL_URL)
  const cloned = useMemo(() => scene.clone(true), [scene])
  const temperatureBoost = temperature / 100
  const flameIntensity = thermalActive
    ? heatMode === 'endo'
      ? 0.55 + temperatureBoost * 0.85
      : 0.28 + temperatureBoost * 0.38
    : 0.14
  const flameOpacity = thermalActive
    ? heatMode === 'endo'
      ? 0.52 + temperatureBoost * 0.36
      : 0.24 + temperatureBoost * 0.3
    : 0.22
  const flameHeight = thermalActive
    ? heatMode === 'endo'
      ? 0.9 + temperatureBoost * 1.05
      : 0.55 + temperatureBoost * 0.45
    : 0.45
  return (
    <group position={[0, -0.4, -0.32]} onClick={(event) => { event.stopPropagation(); onSelect() }}>
      <group scale={3.1}>
        <primitive object={cloned} />
      </group>
      <mesh position={[0, 0.5 + flameHeight * 0.035, 0]} scale={[selected ? 1.2 : 1, flameHeight, selected ? 1.2 : 1]}>
        <coneGeometry args={[0.045, 0.16, 12]} />
        <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={flameIntensity} transparent opacity={flameOpacity} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.26, 0.012, 8, 32]} />
          <meshStandardMaterial color={AMBER} emissive={AMBER} emissiveIntensity={0.5} />
        </mesh>
      )}
      <SceneLabel text="bunsen burner" position={[0, 0.78, 0]} color={AMBER} small hidden={!labelsVisible && !selected} />
    </group>
  )
}

function Reactants({ controls, dim }: { controls: ReactionControls; dim: boolean }) {
  return (
    <group position={[-1.55, 0.18, 0]}>
      {Array.from({ length: controls.hydrogenCoeff }, (_, index) => <MoleculeH2 key={`h-${index}`} position={[-0.35 + index * 0.28, 0.34 + (index % 2) * 0.12, 0]} dim={dim} />)}
      {Array.from({ length: controls.oxygenCoeff }, (_, index) => <MoleculeO2 key={`o-${index}`} position={[0.22 + index * 0.34, 0.08 + (index % 2) * 0.18, 0.1]} dim={dim} />)}
      <SceneLabel text="reactants" position={[0, -0.24, 0.1]} color={BLUE} hidden={dim} />
    </group>
  )
}

function Products({ controls, progress, dim }: { controls: ReactionControls; progress: number; dim: boolean }) {
  const counts = atomCounts(controls)
  const exoGlow = controls.heatMode === 'exo' ? Math.min(0.6, 0.12 + Math.abs(counts.heat) / 200) : 0
  return (
    <group position={[1.45, 0.18, 0]}>
      {controls.heatMode === 'endo' && (
        <mesh position={[0, 0.14, -0.06]} scale={[0.5 + controls.waterCoeff * 0.16, 0.38, 0.05]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={VIOLET} emissive={VIOLET} emissiveIntensity={0.3} transparent opacity={dim ? 0.05 : 0.16} />
        </mesh>
      )}
      {Array.from({ length: controls.waterCoeff }, (_, index) => {
        const bob = Math.sin(progress * Math.PI * 2 + index) * 0.08
        return <MoleculeH2O key={index} position={[-0.42 + index * 0.34, 0.16 + bob + (index % 2) * 0.16, 0]} dim={dim} glow={exoGlow} />
      })}
      <SceneLabel text="products" position={[0, -0.24, 0.1]} color={GREEN} hidden={dim} />
    </group>
  )
}

function MoleculeH2({ position, dim }: { position: [number, number, number]; dim: boolean }) {
  return (
    <group position={position}>
      <AtomBall position={[-0.07, 0, 0]} color={HYDROGEN} dim={dim} label="H" />
      <AtomBall position={[0.07, 0, 0]} color={HYDROGEN} dim={dim} label="H" />
      <Line points={[[-0.04, 0, 0], [0.04, 0, 0]]} color={INK} lineWidth={1.6} transparent opacity={dim ? 0.2 : 0.65} />
    </group>
  )
}

function MoleculeO2({ position, dim }: { position: [number, number, number]; dim: boolean }) {
  return (
    <group position={position}>
      <AtomBall position={[-0.08, 0, 0]} color={OXYGEN} dim={dim} label="O" />
      <AtomBall position={[0.08, 0, 0]} color={OXYGEN} dim={dim} label="O" />
      <Line points={[[-0.04, 0, 0], [0.04, 0, 0]]} color={INK} lineWidth={1.8} transparent opacity={dim ? 0.2 : 0.7} />
    </group>
  )
}

function MoleculeH2O({ position, dim, glow = 0 }: { position: [number, number, number]; dim: boolean; glow?: number }) {
  return (
    <group position={position}>
      <AtomBall position={[0, 0, 0]} color={OXYGEN} dim={dim} label="O" glow={glow} />
      <AtomBall position={[-0.1, 0.1, 0]} color={HYDROGEN} dim={dim} label="H" glow={glow} />
      <AtomBall position={[0.1, 0.1, 0]} color={HYDROGEN} dim={dim} label="H" glow={glow} />
      <Line points={[[-0.07, 0.06, 0], [0, 0.02, 0], [0.07, 0.06, 0]]} color={INK} lineWidth={1.5} transparent opacity={dim ? 0.2 : 0.65} />
    </group>
  )
}

function AtomBall({ position, color, dim, label, glow = 0 }: { position: [number, number, number]; color: string; dim: boolean; label: string; glow?: number }) {
  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshStandardMaterial color={color} roughness={0.55} emissive={glow > 0 ? AMBER : '#000000'} emissiveIntensity={glow} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      <Billboard position={[0, 0, 0.08]}>
        <Text fontSize={0.055} color={INK} anchorX="center" anchorY="middle">{label}</Text>
      </Billboard>
    </group>
  )
}

function ReactionArrow({ progress, counts, dim }: { progress: number; counts: ReturnType<typeof atomCounts>; dim: boolean }) {
  const color = counts.balanced ? GREEN : RED
  return (
    <group>
      <Line points={[[-0.52, 0.35, 0], [0.52, 0.35, 0]]} color={color} lineWidth={3} transparent opacity={dim ? 0.2 : 0.86} />
      <mesh position={[0.58, 0.35, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.07, 0.18, 12]} />
        <meshStandardMaterial color={color} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      {Array.from({ length: 5 }, (_, index) => (
        <mesh key={index} position={[-0.42 + ((progress + index / 5) % 1) * 0.86, 0.55 + Math.sin(progress * 6 + index) * 0.05, 0.08]}>
          <sphereGeometry args={[0.035, 10, 10]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={dim ? 0.2 : 0.86} />
        </mesh>
      ))}
      <SceneLabel text={counts.balanced ? 'balanced recipe runs' : 'atom count mismatch'} position={[0, 0.72, 0.1]} color={color} />
    </group>
  )
}

function CountPanels({ counts, focus, dim }: { counts: ReturnType<typeof atomCounts>; focus: string; dim: boolean }) {
  const rows = [
    { label: 'H', left: counts.leftH, right: counts.rightH, color: BLUE },
    { label: 'O', left: counts.leftO, right: counts.rightO, color: RED },
  ]
  return (
    <group position={[0, 1.32, -0.6]}>
      <mesh scale={[1.18, 0.5, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#EEE7DA" roughness={0.82} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      {rows.map((row, index) => {
        const y = 0.12 - index * 0.22
        const ok = row.left === row.right
        return (
          <group key={row.label} position={[0, y, 0.06]}>
            <SceneLabel text={`${row.label}: ${row.left} -> ${row.right}`} position={[-0.18, 0, 0]} color={ok ? GREEN : row.color} small hidden={dim} />
            <mesh position={[0.38, 0, 0]} scale={[0.12, 0.05, 0.04]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={ok ? GREEN : RED} emissive={focus === 'conservation-of-mass' ? (ok ? GREEN : RED) : '#000000'} emissiveIntensity={focus === 'conservation-of-mass' ? 0.25 : 0} transparent={dim} opacity={dim ? 0.18 : 1} />
            </mesh>
          </group>
        )
      })}
      <SceneLabel text="atom accounting" position={[0, 0.38, 0.06]} color={INK} small hidden={dim} />
    </group>
  )
}

function ThermalFlow({ controls, counts, focus, dim }: { controls: ReactionControls; counts: ReturnType<typeof atomCounts>; focus: string; dim: boolean }) {
  const outward = controls.heatMode === 'exo'
  const color = outward ? AMBER : VIOLET
  return (
    <group position={[0, -0.05, 0.76]}>
      {Array.from({ length: 8 }, (_, index) => {
        const x = -0.45 + index * 0.13
        const y = outward ? 0.08 + Math.sin(index) * 0.05 : 0.42 - index * 0.025
        return (
          <mesh key={index} position={[x, y, 0]} scale={0.04 + Math.abs(counts.heat) / 1500}>
            <sphereGeometry args={[1, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={focus === 'exothermic' || focus === 'endothermic' ? 0.5 : 0.22} transparent={dim} opacity={dim ? 0.18 : 0.8} />
          </mesh>
        )
      })}
      <SceneLabel text={outward ? 'energy released' : 'energy absorbed'} position={[0, 0.62, 0.06]} color={color} small hidden={dim} />
    </group>
  )
}

function RateChips({ counts, controls }: { counts: ReturnType<typeof atomCounts>; controls: ReactionControls }) {
  return (
    <group position={[0, -0.58, 0.72]}>
      <Chip text={`rate ${counts.rate.toFixed(1)}x`} x={-0.5} color={GREEN} />
      <Chip text={`${controls.temperature} C`} x={0} color={AMBER} />
      <Chip text={`catalyst ${Math.round(controls.catalyst * 100)}%`} x={0.55} color={VIOLET} />
    </group>
  )
}

function Chip({ text, x, color }: { text: string; x: number; color: string }) {
  return (
    <group position={[x, 0, 0]}>
      <mesh scale={[0.38, 0.08, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#EEE7DA" roughness={0.8} />
      </mesh>
      <SceneLabel text={text} position={[0, 0, 0.05]} color={color} small />
    </group>
  )
}

function ReactionHotspot({ hotspot, index, active, labelsVisible, dim, onSelect }: { hotspot: Hotspot; index: number; active: boolean; labelsVisible: boolean; dim: boolean; onSelect: (id: string) => void }) {
  const positions: [number, number, number][] = [
    [-1.35, 0.95, 0.14],
    [0, 0.94, 0.16],
    [1.25, 0.95, 0.14],
    [-0.55, 1.34, -0.48],
    [0.72, 1.34, -0.48],
  ]
  const position = positions[index % positions.length]
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect(hotspot.id) }}>
      <mesh>
        <sphereGeometry args={[active ? 0.11 : 0.09, 18, 18]} />
        <meshStandardMaterial color={hotspot.color} emissive={hotspot.color} emissiveIntensity={active ? 0.74 : 0.2} transparent={dim} opacity={dim ? 0.2 : 1} />
      </mesh>
      {(labelsVisible || active) && <SceneLabel text={hotspot.label} position={[0, 0.24, 0]} color={hotspot.color} />}
    </group>
  )
}

function ComponentStrip({ content, activeHotspotId, onSelectHotspot }: { content: ComponentContent; activeHotspotId: string | null; onSelectHotspot: (id: string | null) => void }) {
  return (
    <group position={[0, -1.02, 1.28]}>
      {content.hotspots.slice(0, 4).map((hotspot, index) => {
        const active = activeHotspotId === hotspot.id
        return (
          <group key={hotspot.id} position={[-1.35 + index * 0.9, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectHotspot(active ? null : hotspot.id) }}>
            <mesh>
              <boxGeometry args={[0.72, 0.08, 0.12]} />
              <meshStandardMaterial color={active ? hotspot.color : '#DED6C9'} roughness={0.82} />
            </mesh>
            <Billboard position={[0, -0.16, 0]}>
              <Text fontSize={0.09} color={active ? INK : '#7D766C'} anchorX="center" anchorY="middle" maxWidth={0.78}>{hotspot.label}</Text>
            </Billboard>
          </group>
        )
      })}
    </group>
  )
}

function SceneLabel({ text, position, color, small, hidden }: { text: string; position: [number, number, number]; color: string; small?: boolean; hidden?: boolean }) {
  if (hidden) return null
  return (
    <Billboard position={position}>
      <Text fontSize={small ? 0.085 : 0.11} color={color} anchorX="center" anchorY="middle" maxWidth={1.15}>{text}</Text>
    </Billboard>
  )
}
