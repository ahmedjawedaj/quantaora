import { Suspense, useCallback, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Html, Line, OrbitControls, Text, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import {
  Activity,
  Circle,
  Home,
  Leaf,
  Minus,
  Plus,
  Shield,
  SlidersHorizontal,
  Sprout,
  Target,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { decomposerGrowthStages, ecology, ecologyById } from '@/data/generated/ecology'
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
import { GlbErrorBoundary } from '@/components/explorer/GlbErrorBoundary'

const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const GREEN = '#5D9A5D'
const GREEN_DARK = '#3F7E49'
const GREEN_LIGHT = '#95BD75'
const GOLD = '#D9A441'
const AMBER = '#C7833A'
const BLUE = '#5A8FC8'
const BROWN = '#8C6B45'
const BROWN_DARK = '#6F5036'
const RED = '#D96459'
const VIOLET = '#7E68B4'
const STONE = '#B8B0A0'
const DEFAULT_COMPONENT_ID = 'ecosystem'
const DEFAULT_CAMERA_DISTANCE = 7.8
const MIN_CAMERA_DISTANCE = 5.2
const MAX_CAMERA_DISTANCE = 10.6
const ZOOM_STEP = 0.45
const DEFAULT_DECOMPOSER_STAGE = 1

// Preload the mushroom growth-stage sequence so scrubbing the stage control doesn't re-trigger
// a visible Suspense fallback for stages the learner has already reached this session.
decomposerGrowthStages.forEach((entry) => useGLTF.preload(entry.url))

type EcosystemMode = 'energy-flow' | 'population-balance' | 'recycling' | 'habitat-fit'

const ROLE_ICONS: Record<string, LucideIcon> = {
  organism: Circle,
  population: Users,
  community: Users,
  ecosystem: Activity,
  habitat: Home,
  niche: Target,
  producer: Sprout,
  consumer: Activity,
  decomposer: Leaf,
  predator: Shield,
  prey: Circle,
}

const COMPARE_TARGET: Record<string, string> = {
  community: 'ecosystem',
  ecosystem: 'community',
  habitat: 'niche',
  niche: 'habitat',
  organism: 'population',
  population: 'community',
  producer: 'consumer',
  consumer: 'producer',
  predator: 'prey',
  prey: 'predator',
  decomposer: 'producer',
}

const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((branch) => branch.id !== 'ecology')

const SCENARIO_STEPS = ['observe', 'predict', 'change', 'explain', 'check'] as const
const SCENARIO_STEP_LABELS = ['1. Observe', '2. Predict', '3. Change', '4. Explain', '5. Check']

const ECOLOGY_MISSIONS = [
  'Mission: observe an organism, then compare its population, community, and ecosystem.',
  'Mission: predict how habitat and niche change when water or shelter becomes scarce.',
  'Mission: observe a producer, consumer, decomposer, predator, and prey as energy flows.',
  'Mission: change sunlight, predator pressure, decomposer activity, or habitat stress; explain what changes next.',
]

type EcoSetters = {
  setSunlight: Dispatch<SetStateAction<number>>
  setPredators: Dispatch<SetStateAction<number>>
  setDecomposers: Dispatch<SetStateAction<number>>
  setHabitatStress: Dispatch<SetStateAction<number>>
}

interface Scenario {
  id: string
  label: string
  icon: LucideIcon
  observe: string
  predict: string
  changeLabel: string
  apply: (setters: EcoSetters) => void
  explain: string
  question: string
  options: string[]
  correctIndex: number
  correctFeedback: string
  incorrectFeedback: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'drought',
    label: 'Drought',
    icon: Sprout,
    observe: 'Look at the producers (plants) growing under today’s sunlight.',
    predict: 'If sunlight drops sharply, what happens to the plant food supply — and everything that eats it?',
    changeLabel: 'Cut sunlight to 15%',
    apply: ({ setSunlight }) => setSunlight(0.15),
    explain: 'Producers turn sunlight into food. With almost no light, plants shrink and make little food, so prey have less to eat and predators go hungry too — the shortage moves up the whole food web.',
    question: 'Why did prey and predators shrink after the drought?',
    options: [
      'Predators hunted them all at once',
      'Less sunlight meant less plant food, so animals higher up had less to eat',
      'The habitat lost its water',
    ],
    correctIndex: 1,
    correctFeedback: 'Right — energy starts with sunlight and producers, then flows upward through the food web.',
    incorrectFeedback: 'Look again: sunlight feeds producers first, then everything above them depends on that food.',
  },
  {
    id: 'predator-boom',
    label: 'Predator boom',
    icon: Shield,
    observe: 'Count the prey and predators at today’s balanced pressure level.',
    predict: 'If predator pressure rises a lot, what happens to prey first — and to predators after that?',
    changeLabel: 'Raise predator pressure to 90%',
    apply: ({ setPredators }) => setPredators(0.9),
    explain: 'More predators means more hunting, so prey numbers fall fast. Once prey become scarce, predators cannot find enough food either, and their own numbers start to drop too.',
    question: 'What happens to predators if they hunt too much prey?',
    options: [
      'They keep growing forever',
      'Nothing changes for predators',
      'They eventually decline too because there is less prey to eat',
    ],
    correctIndex: 2,
    correctFeedback: 'Right — predator and prey numbers rise and fall together over time.',
    incorrectFeedback: 'Think about what predators eat: if prey run out, predators struggle too.',
  },
  {
    id: 'no-decomposers',
    label: 'Recycling stalls',
    icon: Leaf,
    observe: 'Look at the decomposer patch and how green and tall the plants are today.',
    predict: 'If decomposers nearly disappear, what happens to dead material and soil nutrients?',
    changeLabel: 'Drop decomposers to 5%',
    apply: ({ setDecomposers }) => setDecomposers(0.05),
    explain: 'Decomposers break down dead material and return nutrients to the soil. Without them, waste piles up, nutrients stay locked away, and producers grow stunted from starved soil.',
    question: 'Why do plants grow smaller when decomposers disappear?',
    options: [
      'Sunlight disappears too',
      'Dead material is not broken down, so nutrients never return to the soil',
      'Predators eat the plants',
    ],
    correctIndex: 1,
    correctFeedback: 'Right — decomposers recycle the nutrients that producers need to grow.',
    incorrectFeedback: 'Focus on the soil: what do decomposers normally return to it?',
  },
  {
    id: 'habitat-loss',
    label: 'Habitat loss',
    icon: Home,
    observe: 'Notice the shelter, water, and open ground around the scene today.',
    predict: 'If habitat stress rises sharply, what happens across the whole system, even without removing any species?',
    changeLabel: 'Raise habitat stress to 85%',
    apply: ({ setHabitatStress }) => setHabitatStress(0.85),
    explain: 'A stressed habitat has less water, shelter, and usable space. Every population is squeezed at once — producers, prey, and predators all lose ground even though none of them left.',
    question: 'Why can habitat stress hurt every population at the same time?',
    options: [
      'Habitat stress only affects predators',
      'It removes shared resources like water and shelter that every organism needs',
      'It only changes the color of the ground',
    ],
    correctIndex: 1,
    correctFeedback: 'Right — habitat quality is a shared resource for the whole ecosystem.',
    incorrectFeedback: 'Habitat provides resources every organism depends on, not just one group.',
  },
]

function ecosystemMode(componentId: string): EcosystemMode {
  if (componentId === 'producer' || componentId === 'consumer' || componentId === 'ecosystem') return 'energy-flow'
  if (componentId === 'population' || componentId === 'predator' || componentId === 'prey' || componentId === 'community') return 'population-balance'
  if (componentId === 'decomposer') return 'recycling'
  return 'habitat-fit'
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function clampInt(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value))
}

/**
 * Single source of truth for how sunlight, predator pressure, decomposer activity, and
 * habitat stress cascade through the food web: producers depend on sunlight AND recycled
 * nutrients, prey depend on producer energy, predators depend on prey availability (they can
 * starve), and low decomposer activity leaves visible waste behind.
 */
function computeEcosystemState(sunlight: number, predators: number, decomposers: number, habitatStress: number) {
  const nutrientFactor = 0.55 + decomposers * 0.45
  const producerEnergy = clamp01((0.3 + sunlight * 0.7) * nutrientFactor * (1 - habitatStress * 0.45))
  const preyFood = clamp01(0.2 + producerEnergy * 0.8)
  const preySafety = clamp01((1 - predators * 0.68) * (1 - habitatStress * 0.22))
  const predatorFood = clamp01((0.2 + predators * 0.5) * preyFood)
  const recycling = clamp01(0.2 + decomposers * 0.8)
  const wasteLevel = clamp01(1 - decomposers * 0.92)
  const habitatHealth = clamp01(1 - habitatStress)
  const balance = clamp01(producerEnergy * 0.34 + preySafety * 0.18 + preyFood * 0.16 + recycling * 0.18 + habitatHealth * 0.14)

  const preyCount = clampInt(2, 9, Math.round(2 + preyFood * 5.4 - predators * 3.2 - habitatStress * 2))
  const starving = preyCount <= 3
  const predatorCount = clampInt(1, 5, Math.round(1 + predators * 3.2) - (starving ? 1 : 0))
  const decomposerCount = clampInt(2, 9, Math.round(2 + decomposers * 7))
  const wastePileCount = clampInt(0, 6, Math.round(wasteLevel * 6))

  return {
    producerEnergy,
    preyFood,
    preySafety,
    predatorFood,
    recycling,
    wasteLevel,
    habitatHealth,
    balance,
    preyCount,
    predatorCount,
    decomposerCount,
    wastePileCount,
    starving,
  }
}

/**
 * Canonical predator/prey stat formulas. This is the ONLY place capture chance, energy cost,
 * detection range, safe-zone distance, escape route, camouflage, and risk are computed — both
 * ecosystemReadout (the HTML meters) and the 3D scene views (PredatorHuntView/PreySurvivalView)
 * consume these results instead of recomputing their own versions, so the meters and the scene
 * can never contradict each other.
 */
function predatorHuntStats(predators: number, state: ReturnType<typeof computeEcosystemState>) {
  return {
    detectionPct: Math.round(clamp01(0.5 + predators * 0.5) * 100),
    captureChance: Math.round(clamp01(0.16 + state.predatorFood * 0.7 - (state.starving ? 0.22 : 0)) * 100),
    energyCost: Math.round(clamp01(0.32 + predators * 0.55) * 100),
  }
}

function preySurvivalStats(predators: number, state: ReturnType<typeof computeEcosystemState>) {
  const safetyPct = Math.round(state.preySafety * 100)
  return {
    safetyPct,
    camouflage: safetyPct > 60 ? 'good' : safetyPct > 35 ? 'fair' : 'low',
    risk: predators > 0.6 ? 'high' : predators > 0.3 ? 'medium' : 'low',
  }
}

function ecosystemReadout(componentId: string, sunlight: number, predators: number, decomposers: number, habitatStress: number) {
  const state = computeEcosystemState(sunlight, predators, decomposers, habitatStress)
  const producerEnergy = Math.round(state.producerEnergy * 100)
  const recycling = Math.round(state.recycling * 100)
  const habitatHealth = Math.round(state.habitatHealth * 100)
  const balance = Math.round(state.balance * 100)
  const waste = Math.round(state.wasteLevel * 100)

  switch (componentId) {
    case 'producer':
      return {
        title: 'Energy source',
        primaryLabel: 'Sunlight',
        primaryValue: `${Math.round(sunlight * 100)}%`,
        resultLabel: 'Plant food',
        resultValue: `${producerEnergy}%`,
        secondLabel: 'Feeds',
        secondValue: producerEnergy > 70 ? 'many' : producerEnergy > 45 ? 'some' : 'few',
        explanation: 'Producers turn sunlight into food, and decomposers return nutrients that help them grow. Cut either one and less energy enters the whole food web.',
      }
    case 'consumer':
      return {
        title: 'Eating for energy',
        primaryLabel: 'Plant energy',
        primaryValue: `${producerEnergy}%`,
        resultLabel: 'Consumer food',
        resultValue: producerEnergy > 65 ? 'plenty' : producerEnergy > 42 ? 'limited' : 'scarce',
        secondLabel: 'Pressure',
        secondValue: predators > 0.6 ? 'high' : 'steady',
        explanation: 'Consumers cannot make food. They depend on producers or other consumers, so a weak producer base affects every eater above it.',
      }
    case 'predator': {
      const hunt = predatorHuntStats(predators, state)
      return {
        title: 'Hunter view: pursuit and capture odds',
        primaryLabel: 'Detection range',
        primaryValue: `${hunt.detectionPct}%`,
        resultLabel: 'Capture chance',
        resultValue: `${hunt.captureChance}%`,
        secondLabel: 'Energy cost',
        secondValue: `${hunt.energyCost}%`,
        explanation: state.starving
          ? 'Prey numbers dropped enough that hunts are failing more often — the shortage is moving up the food web.'
          : 'Predators spend energy chasing prey inside their detection range. Higher pressure raises capture chance, but also raises the energy spent per hunt.',
      }
    }
    case 'prey': {
      const survival = preySurvivalStats(predators, state)
      return {
        title: 'Survival view: safe zones and escape routes',
        primaryLabel: 'Safe zone',
        primaryValue: survival.safetyPct > 50 ? 'near' : 'far',
        resultLabel: 'Escape route',
        resultValue: survival.safetyPct > 45 ? 'clear' : 'blocked',
        secondLabel: 'Camouflage',
        secondValue: `${survival.camouflage} · ${survival.risk} risk`,
        explanation: 'Prey survive by reaching cover before predators close the distance. Good camouflage and nearby safe zones lower risk even when predator pressure rises.',
      }
    }
    case 'decomposer':
      return {
        title: 'Recycling loop',
        primaryLabel: 'Decomposers',
        primaryValue: `${Math.round(decomposers * 100)}%`,
        resultLabel: 'Nutrients',
        resultValue: `${recycling}%`,
        secondLabel: 'Waste',
        secondValue: waste > 45 ? 'piling up' : 'clear',
        explanation: 'Decomposers break down dead material and return nutrients to soil. When decomposers drop, waste piles up and producers grow stunted from missing nutrients.',
      }
    case 'habitat':
      return {
        title: 'Habitat health',
        primaryLabel: 'Stress',
        primaryValue: `${Math.round(habitatStress * 100)}%`,
        resultLabel: 'Shelter',
        resultValue: `${habitatHealth}%`,
        secondLabel: 'Water',
        secondValue: habitatStress > 0.58 ? 'low' : 'available',
        explanation: 'A habitat supplies space, water, shelter, and temperature. Stress removes resources even when organisms are still present.',
      }
    case 'niche':
      return {
        title: 'Role fit',
        primaryLabel: 'Resources',
        primaryValue: `${habitatHealth}%`,
        resultLabel: 'Niche fit',
        resultValue: habitatHealth > 68 && producerEnergy > 55 ? 'strong' : 'weak',
        secondLabel: 'Competition',
        secondValue: habitatStress > 0.5 ? 'rising' : 'low',
        explanation: 'A niche is how an organism uses resources and interacts. When resources change, the same organism may not fit as well.',
      }
    default:
      return {
        title: 'Ecosystem balance',
        primaryLabel: 'Energy',
        primaryValue: `${producerEnergy}%`,
        resultLabel: 'Balance',
        resultValue: `${balance}%`,
        secondLabel: 'Recycling',
        secondValue: `${recycling}%`,
        explanation: 'An ecosystem links living things with sunlight, water, soil, and shelter. Change one cause and the effects ripple through the whole system.',
      }
  }
}

export default function EcologyLab() {
  const [componentId, setComponentId] = useState(DEFAULT_COMPONENT_ID)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [isolateActive, setIsolateActive] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [sunlight, setSunlight] = useState(0.72)
  const [predators, setPredators] = useState(0.42)
  const [decomposers, setDecomposers] = useState(0.55)
  const [habitatStress, setHabitatStress] = useState(0.18)
  const [decomposerStage, setDecomposerStage] = useState(DEFAULT_DECOMPOSER_STAGE)
  const [flowProgress, setFlowProgress] = useState(0)
  const flowAccumulator = useRef(0)
  const [scenarioId, setScenarioId] = useState<string | null>(null)
  const [scenarioStepIndex, setScenarioStepIndex] = useState(0)
  const [checkSelected, setCheckSelected] = useState<number | null>(null)

  const content = ecologyById[componentId] ?? ecologyById[DEFAULT_COMPONENT_ID] ?? ecology[0]
  const readout = useMemo(
    () => ecosystemReadout(componentId, sunlight, predators, decomposers, habitatStress),
    [componentId, sunlight, predators, decomposers, habitatStress],
  )
  const mode = ecosystemMode(componentId)
  const activeScenario = useMemo(() => SCENARIOS.find((item) => item.id === scenarioId) ?? null, [scenarioId])
  const compareTarget = COMPARE_TARGET[componentId]
    ? (ecologyById[COMPARE_TARGET[componentId]] ?? resolveContent(COMPARE_TARGET[componentId]))
    : null
  const activeHotspot = useMemo(
    () => content.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const decomposerStageEntry = decomposerGrowthStages[decomposerStage - 1] ?? decomposerGrowthStages[0]
  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    compareCandidate: COMPARE_TARGET[componentId] ?? content.compareCandidate,
    keyFacts: [
      { label: readout.primaryLabel, value: readout.primaryValue },
      { label: readout.resultLabel, value: readout.resultValue },
      { label: readout.secondLabel, value: readout.secondValue },
      { label: 'Cause/effect', value: readout.explanation },
      ...content.keyFacts.slice(0, 4),
    ],
  }), [componentId, content, readout])

  const handleAnimationTick = useCallback((delta: number) => {
    flowAccumulator.current += delta
    const steps = Math.floor(flowAccumulator.current / 0.07)
    if (steps <= 0) return
    flowAccumulator.current -= steps * 0.07
    setFlowProgress((value) => (value + steps * 0.035 * (0.7 + sunlight)) % 1)
  }, [sunlight])

  const selectComponent = (id: string) => {
    setComponentId(id)
    setActiveHotspotId(null)
    setIsolateActive(false)
    setControlsOpen(false)
  }

  const reset = () => {
    setActiveHotspotId(null)
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(true)
    setCleanView(false)
    setControlsOpen(false)
    setSunlight(0.72)
    setPredators(0.42)
    setDecomposers(0.55)
    setHabitatStress(0.18)
    setFlowProgress(0)
    setScenarioId(null)
    setScenarioStepIndex(0)
    setCheckSelected(null)
    setDecomposerStage(DEFAULT_DECOMPOSER_STAGE)
  }

  const startScenario = (id: string) => {
    setScenarioId(id)
    setScenarioStepIndex(0)
    setCheckSelected(null)
  }

  const closeScenario = () => {
    setScenarioId(null)
    setScenarioStepIndex(0)
    setCheckSelected(null)
  }

  const advanceScenario = () => {
    setScenarioStepIndex((index) => Math.min(index + 1, SCENARIO_STEPS.length - 1))
  }

  const applyScenarioChange = () => {
    if (!activeScenario) return
    activeScenario.apply({ setSunlight, setPredators, setDecomposers, setHabitatStress })
    setScenarioStepIndex(3)
  }

  const activeIndex = ecology.findIndex((item) => item.id === componentId)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={Leaf}
            branchName="Ecology"
            items={ecology.map((item) => ({
              id: item.id,
              name: item.name,
              meta: item.system,
              icon: ROLE_ICONS[item.id],
            }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="Flagship ecology lab: change energy, predators, decomposers, and habitat pressure to see system effects."
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
              Ecology - change one condition, watch the system respond
            </div>
          </div>

          <EcologyScene
            componentId={componentId}
            content={content}
            activeHotspotId={activeHotspotId}
            onSelectHotspot={setActiveHotspotId}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            sunlight={sunlight}
            predators={predators}
            decomposers={decomposers}
            habitatStress={habitatStress}
            flowProgress={flowProgress}
            decomposerStageUrl={decomposerStageEntry.url}
            onAnimationTick={handleAnimationTick}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {componentId === 'decomposer' && !controlsOpen && (
              <GrowthStageControl
                stage={decomposerStage}
                stageLabel={decomposerStageEntry.label}
                capWidthCm={decomposerStageEntry.capWidthCm}
                ageDays={decomposerStageEntry.ageDays}
                total={decomposerGrowthStages.length}
                onChange={setDecomposerStage}
              />
            )}
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={readout.primaryLabel} value={readout.primaryValue} />
                  <Meter label={readout.resultLabel} value={readout.resultValue} />
                  <Meter label={readout.secondLabel} value={readout.secondValue} />
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune ecosystem
                </button>
              </div>
            ) : (
              <TunePanel
                readout={readout}
                mode={mode}
                componentId={componentId}
                sunlight={sunlight}
                setSunlight={setSunlight}
                predators={predators}
                setPredators={setPredators}
                decomposers={decomposers}
                setDecomposers={setDecomposers}
                habitatStress={habitatStress}
                setHabitatStress={setHabitatStress}
                onClose={() => setControlsOpen(false)}
              />
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Component switcher for every screen size, including mobile,
              where the ContentNav list in the left aside is hidden
              (lg:block only). Picking an item here drives the same
              selectComponent() path as the desktop list, so the diorama
              visibly refocuses around it. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Component {activeIndex + 1} of {ecology.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {ecology.map((item) => {
                const active = item.id === componentId
                const Icon = ROLE_ICONS[item.id] ?? Leaf
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
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{item.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <ScenarioPanel
            scenario={activeScenario}
            stepIndex={scenarioStepIndex}
            checkSelected={checkSelected}
            onSelectScenario={startScenario}
            onNext={advanceScenario}
            onApplyChange={applyScenarioChange}
            onSelectCheck={setCheckSelected}
            onClose={closeScenario}
          />
          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
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

function GrowthStageControl({
  stage,
  stageLabel,
  capWidthCm,
  ageDays,
  total,
  onChange,
}: {
  stage: number
  stageLabel: string
  capWidthCm: number
  ageDays: number
  total: number
  onChange: Dispatch<SetStateAction<number>>
}) {
  return (
    <div className="mb-2 flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-3 py-1.5 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
      <button
        type="button"
        onClick={() => onChange((value) => Math.max(1, value - 1))}
        disabled={stage <= 1}
        aria-label="Earlier mushroom growth stage"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-foreground)] transition-opacity disabled:opacity-30"
      >
        <Minus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
      <div className="min-w-0 flex-1">
        <input
          type="range"
          min={1}
          max={total}
          step={1}
          value={stage}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label="Mushroom growth stage"
          className="w-full accent-[color:var(--color-biology-deep)]"
        />
        <p className="mt-0.5 truncate text-center text-[10px] font-medium text-[color:var(--color-ink-500)]">
          Growth stage {stage} of {total} - {stageLabel} · {capWidthCm} cm cap · day {ageDays}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange((value) => Math.min(total, value + 1))}
        disabled={stage >= total}
        aria-label="Later mushroom growth stage"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-[color:var(--color-foreground)] transition-opacity disabled:opacity-30"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  )
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p
        role="status"
        aria-live="polite"
        className="mt-0.5 line-clamp-2 break-words font-[family-name:var(--font-mono)] text-xs font-medium leading-snug text-[color:var(--color-foreground)] sm:text-sm"
      >
        {value}
      </p>
    </div>
  )
}

function TunePanel({
  readout,
  mode,
  componentId,
  sunlight,
  setSunlight,
  predators,
  setPredators,
  decomposers,
  setDecomposers,
  habitatStress,
  setHabitatStress,
  onClose,
}: {
  readout: ReturnType<typeof ecosystemReadout>
  mode: EcosystemMode
  componentId: string
  sunlight: number
  setSunlight: Dispatch<SetStateAction<number>>
  predators: number
  setPredators: Dispatch<SetStateAction<number>>
  decomposers: number
  setDecomposers: Dispatch<SetStateAction<number>>
  habitatStress: number
  setHabitatStress: Dispatch<SetStateAction<number>>
  onClose: () => void
}) {
  const modeNote =
    componentId === 'predator'
      ? 'Predict: if hunting pressure rises, what happens to capture chance and energy cost?'
      : componentId === 'prey'
        ? 'Predict: if predator pressure rises, what happens to safe zones and escape routes?'
        : mode === 'energy-flow'
          ? 'Predict: what happens to consumers if less sunlight enters the food web?'
          : mode === 'population-balance'
            ? 'Predict: what happens when predator pressure rises or falls?'
            : mode === 'recycling'
              ? 'Predict: what happens to soil when decomposers slow down?'
              : 'Predict: what happens when the same organism loses shelter or water?'

  // Predator and prey lead with the control most relevant to their own viewpoint (hunting
  // pressure vs. cover/safe-zone stress) instead of the shared sunlight-first order every other
  // component uses, so the control panel itself -- not just labels -- reads differently per role.
  const controls = [
    { key: 'sunlight', label: 'Sunlight into plants', value: sunlight, onChange: setSunlight },
    {
      key: 'predators',
      label: componentId === 'predator' ? 'Your hunting pressure' : componentId === 'prey' ? 'Predator threat level' : 'Predator pressure',
      value: predators,
      onChange: setPredators,
    },
    { key: 'decomposers', label: 'Decomposer activity', value: decomposers, onChange: setDecomposers },
    {
      key: 'habitatStress',
      label: componentId === 'prey' ? 'Cover and safe-zone stress' : 'Habitat stress',
      value: habitatStress,
      onChange: setHabitatStress,
    },
  ]
  const order: Record<string, string[]> = {
    predator: ['predators', 'sunlight', 'decomposers', 'habitatStress'],
    prey: ['habitatStress', 'sunlight', 'predators', 'decomposers'],
  }
  const orderedControls = (order[componentId] ?? ['sunlight', 'predators', 'decomposers', 'habitatStress']).map(
    (key) => controls.find((control) => control.key === key)!,
  )

  return (
    <div className="grid max-h-[42svh] gap-3 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm lg:max-h-none lg:overflow-visible">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{readout.title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide ecology controls"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-xs font-semibold text-[color:var(--color-foreground)]">{modeNote}</p>
        <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{readout.explanation}</p>
      </div>
      {orderedControls.map((control) => (
        <RangeControl key={control.key} label={control.label} value={control.value} valueText={`${Math.round(control.value * 100)}%`} onChange={control.onChange} />
      ))}
    </div>
  )
}

function RangeControl({
  label,
  value,
  valueText,
  onChange,
}: {
  label: string
  value: number
  valueText: string
  onChange: Dispatch<SetStateAction<number>>
}) {
  return (
    <label>
      <span className="mb-1 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label} <span className="font-[family-name:var(--font-mono)]">{valueText}</span>
      </span>
      <input
        className="w-full accent-[color:var(--color-biology-deep)]"
        type="range"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
    </label>
  )
}

function ScenarioPanel({
  scenario,
  stepIndex,
  checkSelected,
  onSelectScenario,
  onNext,
  onApplyChange,
  onSelectCheck,
  onClose,
}: {
  scenario: Scenario | null
  stepIndex: number
  checkSelected: number | null
  onSelectScenario: (id: string) => void
  onNext: () => void
  onApplyChange: () => void
  onSelectCheck: (index: number) => void
  onClose: () => void
}) {
  return (
    <div className="border-b border-[color:var(--color-border)] p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Try a challenge</span>
        {scenario && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close challenge"
            className="rounded-full p-1 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="mt-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Ecology missions</p>
        <ul className="mt-1 grid gap-1 text-[11px] leading-relaxed text-[color:var(--color-foreground)]">
          {ECOLOGY_MISSIONS.map((mission) => <li key={mission}>{mission}</li>)}
        </ul>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {SCENARIOS.map((item) => {
          const active = scenario?.id === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScenario(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                active
                  ? 'border-[color:var(--color-biology-deep)] bg-[color:var(--color-biology-deep)]/10 text-[color:var(--color-biology-deep)]'
                  : 'border-[color:var(--color-border)] text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]'
              }`}
            >
              <item.icon className="h-3 w-3" strokeWidth={1.8} />
              {item.label}
            </button>
          )
        })}
      </div>

      {scenario && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{SCENARIO_STEP_LABELS[stepIndex]}</p>

          {stepIndex === 0 && (
            <>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">{scenario.observe}</p>
              <button type="button" onClick={onNext} className="mt-2 rounded-full bg-[color:var(--color-biology-deep)] px-3 py-1.5 text-[11px] font-semibold text-white">
                Next: Predict
              </button>
            </>
          )}

          {stepIndex === 1 && (
            <>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">{scenario.predict}</p>
              <button type="button" onClick={onNext} className="mt-2 rounded-full bg-[color:var(--color-biology-deep)] px-3 py-1.5 text-[11px] font-semibold text-white">
                Make your guess, then change it
              </button>
            </>
          )}

          {stepIndex === 2 && (
            <>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">Tap to change the ecosystem and watch what happens.</p>
              <button type="button" onClick={onApplyChange} className="mt-2 rounded-full bg-[color:var(--color-biology-accent,#C7833A)] px-3 py-1.5 text-[11px] font-semibold text-white">
                {scenario.changeLabel}
              </button>
            </>
          )}

          {stepIndex === 3 && (
            <>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">{scenario.explain}</p>
              <button type="button" onClick={onNext} className="mt-2 rounded-full bg-[color:var(--color-biology-deep)] px-3 py-1.5 text-[11px] font-semibold text-white">
                Check my understanding
              </button>
            </>
          )}

          {stepIndex === 4 && (
            <>
              <p className="mt-1 text-xs font-medium text-[color:var(--color-foreground)]">{scenario.question}</p>
              <div className="mt-2 grid gap-1.5">
                {scenario.options.map((option, index) => {
                  const isSelected = checkSelected === index
                  const isCorrect = index === scenario.correctIndex
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => onSelectCheck(index)}
                      className={`rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                        isSelected
                          ? isCorrect
                            ? 'border-[#3F7E49] bg-[#3F7E49]/10 text-[#3F7E49]'
                            : 'border-[#D96459] bg-[#D96459]/10 text-[#D96459]'
                          : 'border-[color:var(--color-border)] text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface-raised)]'
                      }`}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
              {checkSelected !== null && (
                <p className="mt-2 text-xs leading-relaxed text-[color:var(--color-ink-500)]">
                  {checkSelected === scenario.correctIndex ? scenario.correctFeedback : scenario.incorrectFeedback}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  const accumulated = useRef(0)
  useFrame((_, delta) => {
    if (!playing) {
      accumulated.current = 0
      return
    }
    accumulated.current += delta
    const steps = Math.floor(accumulated.current / 0.07)
    if (steps <= 0) return
    accumulated.current -= steps * 0.07
    onTick(steps * 0.07)
  })
  return null
}

function EcologyScene({
  componentId,
  content,
  activeHotspotId,
  onSelectHotspot,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  sunlight,
  predators,
  decomposers,
  habitatStress,
  flowProgress,
  decomposerStageUrl,
  onAnimationTick,
}: {
  componentId: string
  content: ComponentContent
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  sunlight: number
  predators: number
  decomposers: number
  habitatStress: number
  flowProgress: number
  decomposerStageUrl: string
  onAnimationTick: (delta: number) => void
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ display: 'block', height: '100%', width: '100%' }}
      camera={{ position: [0, 1.2, cameraDistance], fov: 40 }}
      dpr={[1, 2]}
      onPointerMissed={() => onSelectHotspot(null)}
    >
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.74} />
      <directionalLight position={[-4, 5, 4]} intensity={0.9 + sunlight * 0.6} color="#FFF1BE" />
      <directionalLight position={[4, 3, 5]} intensity={0.55} color="#CFE4FF" />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.5} minDistance={5} maxDistance={10.2} />
      <AnimationDriver playing={animationPlaying} onTick={onAnimationTick} />
      <ResponsiveEcoGroup>
        <EcosystemDiorama
          componentId={componentId}
          content={content}
          activeHotspotId={activeHotspotId}
          onSelectHotspot={onSelectHotspot}
          labelsVisible={labelsVisible}
          xrayActive={xrayActive}
          isolateActive={isolateActive}
          sunlight={sunlight}
          predators={predators}
          decomposers={decomposers}
          habitatStress={habitatStress}
          flowProgress={flowProgress}
          decomposerStageUrl={decomposerStageUrl}
        />
      </ResponsiveEcoGroup>
    </Canvas>
  )
}

function ResponsiveEcoGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.52 : viewport.aspect < 1 ? 0.68 : 0.92
  return <group scale={scale} position={[0, 0.05, 0]}>{children}</group>
}

function EcosystemDiorama({
  componentId,
  content,
  activeHotspotId,
  onSelectHotspot,
  labelsVisible,
  xrayActive,
  isolateActive,
  sunlight,
  predators,
  decomposers,
  habitatStress,
  flowProgress,
  decomposerStageUrl,
}: {
  componentId: string
  content: ComponentContent
  activeHotspotId: string | null
  onSelectHotspot: (id: string | null) => void
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  sunlight: number
  predators: number
  decomposers: number
  habitatStress: number
  flowProgress: number
  decomposerStageUrl: string
}) {
  const state = computeEcosystemState(sunlight, predators, decomposers, habitatStress)
  const producerEnergy = state.producerEnergy
  const preyCount = state.preyCount
  const predatorCount = state.predatorCount
  const decomposerCount = state.decomposerCount
  const wasteLevel = state.wasteLevel
  const habitatOpacity = 1 - habitatStress * 0.42
  const focus = componentId
  const dim = (id: string) => isolateActive && focus !== id && activeHotspotId === null
  const hotspotDim = (hotspot: Hotspot) => isolateActive && activeHotspotId !== null && activeHotspotId !== hotspot.id
  // Only the ecosystem component keeps the full-size, full-position simulation clusters as its
  // main visual (the "broad diorama"). Every other component shrinks and pushes that shared rig
  // into a back corner so it reads as secondary context, leaving center stage free for that
  // component's own dominant ConceptFocus visual below -- this is what makes each of the 11
  // components look structurally different at first glance instead of sharing one center scene.
  const broadDiorama = componentId === 'ecosystem'
  const sharedRigScale = broadDiorama ? 1 : 0.46
  const sharedRigPosition: [number, number, number] = broadDiorama ? [0, 0, 0] : [1.15, -0.34, -1.55]
  // The decomposer's mushroom hero is large enough to dominate every component's center stage by
  // itself if left at full size everywhere (the exact "same central diorama" problem this pass
  // fixes) -- so it gets the same focused-vs-secondary treatment as the shared rig, just keyed to
  // its own id and tucked into a different back corner so it doesn't overlap the shared rig there.
  const decomposerFocused = componentId === 'decomposer'
  const decomposerHeroScale = decomposerFocused ? 1 : 0.4
  const decomposerHeroPosition: [number, number, number] = decomposerFocused ? [0, 0, 0] : [-1.35, -0.08, -1.5]

  return (
    <group rotation={[-0.05, -0.22, 0]}>
      {/* The island/pond ground plane is the ecosystem component's own hero visual, not shared
          set dressing -- rendering it for every component was what made all 11 look like the
          same diorama, since it's large enough to visually swallow each component's dedicated
          ConceptFocus visual below. It only renders here. */}
      {broadDiorama && <Ground habitatStress={habitatStress} xrayActive={xrayActive} />}
      <Sun sunlight={sunlight} />

      {/* Ecosystem and producer each own one of the two real ecology GLBs we have — instead of
          both models sitting in the background for all 11 components (the old behavior), each
          model now only renders as a proper hero for its matching component. Every other
          component gets its own distinct procedural focus below via <ConceptFocus>. */}
      {componentId === 'ecosystem' && (
        <GlbErrorBoundary
          key="/models/biology/ecology/ecosystem.glb"
          fallback={<DecomposerStatusAnnouncement role="alert" message="This 3D model couldn't load. Showing a simplified view instead." />}
        >
          <Suspense fallback={<DecomposerStatusAnnouncement role="status" message="Loading ecosystem model…" />}>
            <SupportGlb url="/models/biology/ecology/ecosystem.glb" position={[0.3, -0.24, -0.55]} scale={0.98} opacity={0.94} />
          </Suspense>
        </GlbErrorBoundary>
      )}
      {componentId === 'producer' && (
        <GlbErrorBoundary
          key="/models/biology/ecology/producer.glb"
          fallback={<DecomposerStatusAnnouncement role="alert" message="This 3D model couldn't load. Showing a simplified view instead." />}
        >
          <Suspense fallback={<DecomposerStatusAnnouncement role="status" message="Loading producer model…" />}>
            <SupportGlb url="/models/biology/ecology/producer.glb" position={[-0.95, -0.25, -0.3]} scale={0.88} opacity={0.94} />
          </Suspense>
        </GlbErrorBoundary>
      )}

      <group scale={sharedRigScale} position={sharedRigPosition}>
        <ProducerCluster energy={producerEnergy} dim={dim('producer')} labelsVisible={labelsVisible} onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)} />
        <PreyCluster count={preyCount} dim={dim('prey')} labelsVisible={labelsVisible} onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)} />
        <PredatorCluster count={predatorCount} pressure={predators} dim={dim('predator')} labelsVisible={labelsVisible} onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)} />
        <DecomposerPatch count={decomposerCount} activity={decomposers} dim={dim('decomposer')} labelsVisible={labelsVisible} onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)} />
        <WastePile level={wasteLevel} dim={dim('decomposer')} labelsVisible={labelsVisible} />
        <HabitatLayer stress={habitatStress} opacity={habitatOpacity} dim={dim('habitat')} labelsVisible={labelsVisible} onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)} />
        <NicheRing active={focus === 'niche'} dim={dim('niche')} labelsVisible={labelsVisible} />
        <EnergyWeb progress={flowProgress} sunlight={sunlight} predators={predators} decomposers={decomposers} habitatStress={habitatStress} xrayActive={xrayActive || focus === 'ecosystem' || focus === 'community'} />
      </group>

      {/* The decomposer's own identity model stays outside the shared rig group above (it is this
          component's hero, not generic background dressing, and must stay always-mounted so
          switching stages doesn't retrigger Suspense) but still shrinks into its own back corner
          when decomposer isn't the active focus, via the wrapping group below. */}
      <group scale={decomposerHeroScale} position={decomposerHeroPosition}>
        <DecomposerMushroomHero
          url={decomposerStageUrl}
          dim={dim('decomposer')}
          labelsVisible={labelsVisible}
          onSelect={() => onSelectHotspot(content.hotspots[0]?.id ?? null)}
        />
      </group>

      <ConceptFocus
        componentId={componentId}
        state={state}
        habitatStress={habitatStress}
        sunlight={sunlight}
        predators={predators}
        flowProgress={flowProgress}
        labelsVisible={labelsVisible}
      />

      {content.hotspots.map((hotspot, index) => (
        <EcoHotspot
          key={hotspot.id}
          hotspot={hotspot}
          index={index}
          active={activeHotspotId === hotspot.id}
          labelsVisible={labelsVisible}
          dim={hotspotDim(hotspot)}
          onSelect={(id) => onSelectHotspot(id)}
        />
      ))}

      <StageStrip content={content} activeHotspotId={activeHotspotId} onSelectHotspot={onSelectHotspot} />
    </group>
  )
}

/**
 * Routes each of the 11 ecology components to a genuinely distinct, dominant, center-stage
 * visual -- this is the primary thing a learner sees for that component, not a small accent
 * layered over a shared scene. The shared simulation clusters (producer/prey/predator/
 * decomposer, habitat, niche ring, energy web) are shrunk into secondary background dressing by
 * the caller for every id except `ecosystem` (see `sharedRigScale`/`sharedRigPosition` above),
 * so this component's output is what actually fills the center of the canvas.
 * `ecosystem` and `producer` also get real hero GLBs (handled where this is called from), and
 * `decomposer` has its own always-mounted hero (`DecomposerMushroomHero`) -- both stay outside
 * this switch and combine with the visuals below rather than being replaced by them.
 */
function ConceptFocus({
  componentId,
  state,
  habitatStress,
  sunlight,
  predators,
  flowProgress,
  labelsVisible,
}: {
  componentId: string
  state: ReturnType<typeof computeEcosystemState>
  habitatStress: number
  sunlight: number
  predators: number
  flowProgress: number
  labelsVisible: boolean
}) {
  switch (componentId) {
    case 'organism':
      return <OrganismSpotlight labelsVisible={labelsVisible} />
    case 'population':
      return <SpeciesBoundary count={state.preyCount} labelsVisible={labelsVisible} />
    case 'community':
      return (
        <FoodWebNetwork
          producerEnergy={state.producerEnergy}
          preyCount={state.preyCount}
          predatorCount={state.predatorCount}
          decomposerCount={state.decomposerCount}
          labelsVisible={labelsVisible}
        />
      )
    case 'habitat':
      return <HabitatBands stress={habitatStress} labelsVisible={labelsVisible} />
    case 'niche':
      return <NicheZones labelsVisible={labelsVisible} />
    case 'producer':
      return (
        <EnergyConversion sunlight={sunlight} producerEnergy={state.producerEnergy} progress={flowProgress} labelsVisible={labelsVisible} />
      )
    case 'consumer':
      return <FoodChainFlow progress={flowProgress} producerEnergy={state.producerEnergy} labelsVisible={labelsVisible} />
    case 'decomposer':
      return (
        <NutrientReturnFlow wasteLevel={state.wasteLevel} recycling={state.recycling} progress={flowProgress} labelsVisible={labelsVisible} />
      )
    case 'predator': {
      const hunt = predatorHuntStats(predators, state)
      return (
        <>
          <PredatorHuntView progress={flowProgress} pressure={predators} starving={state.starving} labelsVisible={labelsVisible} {...hunt} />
          <PopulationDynamics
            emphasis="predator"
            predatorCount={state.predatorCount}
            preyCount={state.preyCount}
            starving={state.starving}
            labelsVisible={labelsVisible}
          />
        </>
      )
    }
    case 'prey': {
      const survival = preySurvivalStats(predators, state)
      return (
        <>
          <PreySurvivalView progress={flowProgress} pressure={predators} starving={state.starving} labelsVisible={labelsVisible} {...survival} />
          <PopulationDynamics
            emphasis="prey"
            predatorCount={state.predatorCount}
            preyCount={state.preyCount}
            starving={state.starving}
            labelsVisible={labelsVisible}
          />
        </>
      )
    }
    default:
      return null
  }
}

/** organism: one individual, spotlighted alone on a pedestal at center stage, instead of a whole
 *  cluster — makes "a single living thing" visually obvious at a glance. */
function OrganismSpotlight({ labelsVisible }: { labelsVisible: boolean }) {
  return (
    <group position={[0.1, -0.06, 0.35]}>
      <mesh position={[0, -0.19, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.34, 0.36, 0.05, 24]} />
        <meshStandardMaterial color={STONE} roughness={0.85} />
      </mesh>
      <group scale={1.65}>
        <SmallAnimal position={[0, 0.06, 0]} color={AMBER} scale={1} dim={false} />
      </group>
      <mesh position={[0, 1.05, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 1.1, 24, 1, true]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.3} transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>
      {labelsVisible && <EcoLabel text="one organism, up close" position={[0, 1.15, 0]} color={AMBER} />}
    </group>
  )
}

/** population: a boundary ring around a single species group with a headcount label, at center
 *  stage, so "population" reads as a same-species group + count rather than a wide multi-species
 *  scene (that's `FoodWebNetwork`, community's own dominant visual). */
function SpeciesBoundary({
  count,
  labelsVisible,
}: {
  count: number
  labelsVisible: boolean
}) {
  const center: [number, number, number] = [0.12, 0.02, 0.16]
  const radius = 0.92
  const stretch: [number, number, number] = [1, 1, 0.72]
  const color = AMBER
  const label = `population: ${count} of the same species`

  return (
    <group position={center} rotation={[Math.PI / 2, 0, 0]} scale={stretch}>
      <mesh>
        <torusGeometry args={[radius, 0.016, 8, 72]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0.72} />
      </mesh>
      {labelsVisible && <EcoLabel text={label} position={[0, 0, -radius - 0.15]} color={color} small />}
    </group>
  )
}

/** habitat: stacked resource "layers" (canopy shade, shelter, ground, water) centered at the
 *  stage and sized much larger than the small decorative shapes in the shrunk shared rig, so
 *  habitat reads as "the whole living space" rather than a background prop. */
function HabitatBands({ stress, labelsVisible }: { stress: number; labelsVisible: boolean }) {
  const bands: { y: number; depth: number; color: string; label: string }[] = [
    { y: 0.98, depth: 0.4, color: GREEN_DARK, label: 'canopy shade' },
    { y: 0.58, depth: 0.48, color: GREEN_LIGHT, label: 'shelter + cover' },
    { y: 0.18, depth: 0.56, color: stress > 0.55 ? '#C9A676' : BROWN, label: 'open ground' },
    { y: -0.22, depth: 0.6, color: BLUE, label: 'water' },
  ]
  return (
    <group position={[0, 0, -0.15]}>
      {bands.map((band) => (
        <mesh key={band.label} position={[0, band.y, 0]}>
          <boxGeometry args={[2.9, 0.07, band.depth]} />
          <meshStandardMaterial color={band.color} roughness={0.82} transparent opacity={0.62 - stress * 0.14} />
        </mesh>
      ))}
      {labelsVisible && <EcoLabel text="habitat: every layer a species needs to live here" position={[0, 1.35, 0]} color={BLUE} />}
    </group>
  )
}

/** niche: four role/resource zones (what each species eats / does) arranged around a center-
 *  stage ring, so "niche" visually reads as resource-partitioning rather than one thin ring. */
function NicheZones({ labelsVisible }: { labelsVisible: boolean }) {
  const zones = [
    { angle: 0, color: GREEN, label: 'makes food' },
    { angle: Math.PI / 2, color: AMBER, label: 'eats plants' },
    { angle: Math.PI, color: RED, label: 'hunts prey' },
    { angle: (3 * Math.PI) / 2, color: VIOLET, label: 'recycles waste' },
  ]
  return (
    <group position={[0.05, 0.15, 0.25]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.02, 8, 64]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.4} transparent opacity={0.85} />
      </mesh>
      {zones.map((zone) => {
        const x = Math.cos(zone.angle) * 0.85
        const z = Math.sin(zone.angle) * 0.85
        return (
          <group key={zone.label} position={[x, 0, z]}>
            <mesh scale={[0.15, 0.15, 0.15]}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={zone.color} emissive={zone.color} emissiveIntensity={0.35} roughness={0.6} />
            </mesh>
            {labelsVisible && <EcoLabel text={zone.label} position={[0, 0.28, 0]} color={zone.color} small />}
          </group>
        )
      })}
    </group>
  )
}

/** predator/prey: a live population bar-chart pair, driven by the same computeEcosystemState
 *  counts as everything else, so a child clicking predator vs. prey sees the same two bars but
 *  with the relevant one visually emphasized — a genuinely dynamic, not just re-tinted, visual. */
function PopulationDynamics({
  emphasis,
  predatorCount,
  preyCount,
  starving,
  labelsVisible,
}: {
  emphasis: 'predator' | 'prey'
  predatorCount: number
  preyCount: number
  starving: boolean
  labelsVisible: boolean
}) {
  const predatorHeight = 0.14 + (predatorCount / 5) * 0.9
  const preyHeight = 0.14 + (preyCount / 9) * 0.9
  return (
    <group position={[2.05, -0.24, 0.75]}>
      <group position={[-0.22, 0, 0]}>
        <mesh position={[0, predatorHeight / 2, 0]} scale={emphasis === 'predator' ? 1.12 : 1}>
          <boxGeometry args={[0.24, predatorHeight, 0.24]} />
          <meshStandardMaterial
            color={RED}
            emissive={RED}
            emissiveIntensity={emphasis === 'predator' ? 0.4 : 0.1}
            transparent
            opacity={emphasis === 'predator' ? 1 : 0.55}
          />
        </mesh>
        <EcoLabel text={`${predatorCount} predators`} position={[0, predatorHeight + 0.16, 0]} color={RED} small />
      </group>
      <group position={[0.22, 0, 0]}>
        <mesh position={[0, preyHeight / 2, 0]} scale={emphasis === 'prey' ? 1.12 : 1}>
          <boxGeometry args={[0.24, preyHeight, 0.24]} />
          <meshStandardMaterial
            color={AMBER}
            emissive={AMBER}
            emissiveIntensity={emphasis === 'prey' ? 0.4 : 0.1}
            transparent
            opacity={emphasis === 'prey' ? 1 : 0.55}
          />
        </mesh>
        <EcoLabel text={`${preyCount} prey`} position={[0, preyHeight + 0.16, 0]} color={AMBER} small />
      </group>
      {labelsVisible && (
        <EcoLabel
          text={
            emphasis === 'predator'
              ? starving
                ? 'predators are running out of prey to eat'
                : 'predator numbers rise and fall with prey'
              : 'prey numbers rise and fall with predator pressure'
          }
          position={[0, Math.max(predatorHeight, preyHeight) + 0.4, 0]}
          color={emphasis === 'predator' ? RED : AMBER}
          small
        />
      )}
    </group>
  )
}

/** predator: hunter viewpoint — a large predator dominates center stage inside a dashed
 *  detection-range ring, with a sightline out to the small, distant prey it is stalking and
 *  hunter-specific readouts (detection range, capture chance, energy spent per hunt) floating
 *  beside it. Deliberately a different shape language (ring + sightline + stat stack) from
 *  PreySurvivalView's safe-zone-and-escape-route framing, so the two roles read as distinct
 *  scenes instead of the same chase track with a size swap. */
function PredatorHuntView({
  progress,
  pressure,
  starving,
  labelsVisible,
  detectionPct,
  captureChance,
  energyCost,
}: {
  progress: number
  pressure: number
  starving: boolean
  labelsVisible: boolean
  detectionPct: number
  captureChance: number
  energyCost: number
}) {
  const { viewport } = useThree()
  const mobile = viewport.aspect < 1
  // Ring radius is a visual mapping of the canonical detectionPct (from predatorHuntStats), not
  // an independent formula — keeps the ring size and the "detection range" label in lockstep.
  const detectionRadius = 0.12 + detectionPct / 100
  const angle = progress * Math.PI * 2
  const ringPoints = Array.from({ length: 57 }, (_, index) => {
    const a = (index / 56) * Math.PI * 2
    return [Math.cos(a) * detectionRadius, -0.235, Math.sin(a) * detectionRadius] as [number, number, number]
  })
  const preyPos: [number, number, number] = [
    Math.cos(angle) * (detectionRadius + 0.35),
    -0.16,
    Math.sin(angle) * (detectionRadius + 0.35) * 0.6,
  ]

  return (
    <group position={[0.05, 0, 0.05]}>
      <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[detectionRadius - 0.015, detectionRadius, 56]} />
        <meshBasicMaterial color={RED} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
      <Line points={ringPoints} color={RED} lineWidth={1.4} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.55} />
      <group scale={1.55}>
        <Predator position={[0, 0, 0]} pressure={pressure} dim={false} />
      </group>
      <Line points={[[0, -0.05, 0], preyPos]} color={RED} lineWidth={2} dashed dashSize={0.05} gapSize={0.05} transparent opacity={0.7} />
      <group position={preyPos} scale={0.5}>
        <SmallAnimal position={[0, 0, 0]} color={AMBER} scale={1} dim={false} />
      </group>
      {!mobile && (
        <>
          <EcoLabel text={`detection range ${detectionPct}%`} position={[0.75, 0.85, 0]} color={RED} small />
          <EcoLabel text={`capture chance ${captureChance}%`} position={[0.75, 0.65, 0]} color={RED} small />
          <EcoLabel text={`energy per hunt ${energyCost}%`} position={[0.75, 0.45, 0]} color={RED} small />
        </>
      )}
      {labelsVisible && (
        <EcoLabel
          text={starving ? 'hunts keep failing — too little prey nearby' : 'hunter view: range, pursuit, and capture odds'}
          position={[0, 1.1, 0]}
          color={RED}
        />
      )}
    </group>
  )
}

/** prey: survival viewpoint — a large prey animal dominates center stage next to its nearest
 *  safe zone, with a dashed escape route to that cover and survival-specific readouts (safe-zone
 *  distance, escape-route status, camouflage, risk level). The predator is shrunk to a small
 *  background threat instead of sharing the frame equally — the mirror image of how
 *  PredatorHuntView shrinks the prey — so the same pressure numbers read as two different lived
 *  experiences instead of one shared chase animation. */
function PreySurvivalView({
  progress,
  pressure,
  starving,
  labelsVisible,
  safetyPct,
  camouflage,
  risk,
}: {
  progress: number
  pressure: number
  starving: boolean
  labelsVisible: boolean
  safetyPct: number
  camouflage: string
  risk: string
}) {
  const { viewport } = useThree()
  const mobile = viewport.aspect < 1
  const safeZonePos: [number, number, number] = [-0.62, -0.22, 0.4]
  const farZonePos: [number, number, number] = [0.55, -0.22, -0.35]
  const angle = progress * Math.PI * 2
  const predatorPos: [number, number, number] = [Math.cos(angle) * 1.05, -0.16, Math.sin(angle) * 1.05 * 0.6]

  return (
    <group position={[0.05, 0, 0.05]}>
      {[safeZonePos, farZonePos].map((pos, index) => (
        <mesh key={index} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 28]} />
          <meshStandardMaterial color={GREEN_LIGHT} roughness={0.85} transparent opacity={index === 0 ? 0.65 : 0.32} />
        </mesh>
      ))}
      <Line points={[[0, -0.05, 0], safeZonePos]} color={GREEN_DARK} lineWidth={2.2} dashed dashSize={0.05} gapSize={0.04} transparent opacity={0.75} />
      <group scale={1.55}>
        <SmallAnimal position={[0, 0, 0]} color={AMBER} scale={1} dim={false} />
      </group>
      <group position={predatorPos} scale={0.5}>
        <Predator position={[0, 0, 0]} pressure={pressure} dim={false} />
      </group>
      {!mobile && (
        <>
          <EcoLabel text={`nearest safe zone ${safetyPct > 50 ? 'near' : 'far'}`} position={[0.75, 0.85, 0]} color={GREEN_DARK} small />
          <EcoLabel text={`escape route ${safetyPct > 45 ? 'clear' : 'blocked'}`} position={[0.75, 0.65, 0]} color={GREEN_DARK} small />
          <EcoLabel text={`camouflage ${camouflage} · ${risk} risk`} position={[0.75, 0.45, 0]} color={GREEN_DARK} small />
        </>
      )}
      {labelsVisible && (
        <EcoLabel
          text={starving ? 'predators are struggling, but prey still stay near cover' : 'survival view: safe zones, escape routes, and risk'}
          position={[0, 1.1, 0]}
          color={GREEN_DARK}
        />
      )}
    </group>
  )
}

/** consumer: a bold, animated "eats" chain from producer to consumer to predator, with an energy
 *  pulse traveling each link and the consumer growing as it takes in more energy — a directional
 *  trophic sequence, not just a static pair of arrows. */
function FoodChainFlow({
  progress,
  producerEnergy,
  labelsVisible,
}: {
  progress: number
  producerEnergy: number
  labelsVisible: boolean
}) {
  const producerPos: [number, number, number] = [-0.95, 0.05, 0]
  const consumerPos: [number, number, number] = [0.05, 0.32, 0.12]
  const predatorPos: [number, number, number] = [1.05, 0.05, -0.18]
  const lerp = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ]
  const pulse1 = lerp(producerPos, consumerPos, progress % 1)
  const pulse2 = lerp(consumerPos, predatorPos, (progress + 0.5) % 1)
  const intake = 0.7 + producerEnergy * 0.7

  return (
    <group>
      <Line points={[producerPos, consumerPos]} color={GREEN_DARK} lineWidth={5} transparent opacity={0.68} />
      <Line points={[consumerPos, predatorPos]} color={RED} lineWidth={5} transparent opacity={0.68} />
      <mesh position={pulse1}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.75} />
      </mesh>
      <mesh position={pulse2}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.75} />
      </mesh>
      <group position={consumerPos} scale={intake}>
        <SmallAnimal position={[0, 0, 0]} color={AMBER} scale={1} dim={false} />
      </group>
      {labelsVisible && <EcoLabel text="food chain: energy moves one step at a time" position={[0.05, 0.68, 0.12]} color={GREEN_DARK} />}
    </group>
  )
}

/** community: a branching food-web network of population nodes (producer/prey/predator/
 *  decomposer) sized by their live counts and linked by connecting edges, so "community" reads
 *  as several populations sharing a web of relationships rather than one boundary ring. */
function FoodWebNetwork({
  producerEnergy,
  preyCount,
  predatorCount,
  decomposerCount,
  labelsVisible,
}: {
  producerEnergy: number
  preyCount: number
  predatorCount: number
  decomposerCount: number
  labelsVisible: boolean
}) {
  const nodes = [
    { key: 'producers', angle: -Math.PI / 2, color: GREEN_DARK, size: 0.14 + producerEnergy * 0.14 },
    { key: 'prey', angle: -Math.PI / 6, color: AMBER, size: 0.1 + preyCount * 0.014 },
    { key: 'predators', angle: Math.PI / 3, color: RED, size: 0.1 + predatorCount * 0.024 },
    { key: 'decomposers', angle: (5 * Math.PI) / 6, color: VIOLET, size: 0.1 + decomposerCount * 0.014 },
  ]
  const radius = 0.9
  const positions = nodes.map((node) => ({
    ...node,
    pos: [Math.cos(node.angle) * radius, 0.05, Math.sin(node.angle) * radius * 0.72] as [number, number, number],
  }))
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [1, 3],
    [0, 3],
  ]

  return (
    <group position={[0.05, 0.1, 0.1]}>
      {edges.map(([a, b], index) => (
        <Line key={index} points={[positions[a].pos, positions[b].pos]} color={BLUE} lineWidth={2.4} transparent opacity={0.5} />
      ))}
      {positions.map((node) => (
        <group key={node.key} position={node.pos}>
          <mesh scale={node.size}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshStandardMaterial color={node.color} emissive={node.color} emissiveIntensity={0.32} roughness={0.55} />
          </mesh>
          {labelsVisible && <EcoLabel text={node.key} position={[0, node.size + 0.16, 0]} color={node.color} small />}
        </group>
      ))}
    </group>
  )
}

/** producer: sunlight visibly converting into stored plant energy — pulses travel from the sun
 *  toward the plant and a rising energy column shows the resulting food supply, so "producer"
 *  reads as an energy-conversion process rather than a static cluster of trees. */
function EnergyConversion({
  sunlight,
  producerEnergy,
  progress,
  labelsVisible,
}: {
  sunlight: number
  producerEnergy: number
  progress: number
  labelsVisible: boolean
}) {
  const sunPos: [number, number, number] = [-1.7, 1.55, -0.6]
  const plantPos: [number, number, number] = [0.1, 0.02, 0.15]
  const lerp = (t: number): [number, number, number] => [
    sunPos[0] + (plantPos[0] - sunPos[0]) * t,
    sunPos[1] + (plantPos[1] - sunPos[1]) * t,
    sunPos[2] + (plantPos[2] - sunPos[2]) * t,
  ]
  const pulses = Array.from({ length: 3 }, (_, index) => lerp((progress + index / 3) % 1))
  const energyHeight = 0.25 + producerEnergy * 1.05

  return (
    <group>
      <Line points={[sunPos, plantPos]} color={GOLD} lineWidth={2} transparent opacity={0.35 + sunlight * 0.4} />
      {pulses.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.8} transparent opacity={0.3 + sunlight * 0.6} />
        </mesh>
      ))}
      <mesh position={[plantPos[0] + 0.4, plantPos[1] + energyHeight / 2, plantPos[2] + 0.3]}>
        <cylinderGeometry args={[0.055, 0.055, energyHeight, 12]} />
        <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.35} transparent opacity={0.88} />
      </mesh>
      {labelsVisible && (
        <EcoLabel text="sunlight converts into stored plant energy" position={[plantPos[0] + 0.4, energyHeight + 0.35, plantPos[2] + 0.3]} color={GREEN_DARK} />
      )}
    </group>
  )
}

/** decomposer: dead material visibly breaking down and flowing back as nutrients, paired with
 *  the always-mounted mushroom hero, so "decomposer" reads as a breakdown/return process rather
 *  than a mushroom sitting still. */
function NutrientReturnFlow({
  wasteLevel,
  recycling,
  progress,
  labelsVisible,
}: {
  wasteLevel: number
  recycling: number
  progress: number
  labelsVisible: boolean
}) {
  const wastePos: [number, number, number] = [0.6, -0.05, 1.35]
  const soilPos: [number, number, number] = [-0.35, -0.05, 0.55]
  const path = (t: number): [number, number, number] => [
    wastePos[0] + (soilPos[0] - wastePos[0]) * t,
    wastePos[1] + Math.sin(t * Math.PI) * 0.18,
    wastePos[2] + (soilPos[2] - wastePos[2]) * t,
  ]
  const pulses = Array.from({ length: 4 }, (_, index) => path((progress + index / 4) % 1))
  const fragmentCount = Math.round(wasteLevel * 5)

  return (
    <group>
      <Line points={Array.from({ length: 12 }, (_, index) => path(index / 11))} color={VIOLET} lineWidth={2.6} transparent opacity={0.55} />
      {pulses.map((point, index) => (
        <mesh key={index} position={point}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={GREEN_DARK} emissive={GREEN_DARK} emissiveIntensity={0.65} transparent opacity={0.35 + recycling * 0.55} />
        </mesh>
      ))}
      {Array.from({ length: fragmentCount }, (_, index) => (
        <mesh key={index} position={[wastePos[0] - index * 0.1, -0.18 + (index % 2) * 0.06, wastePos[2] + index * 0.05]} rotation={[0.2, index, 0.1]} scale={0.09}>
          <boxGeometry args={[1, 0.6, 1]} />
          <meshStandardMaterial color={BROWN_DARK} roughness={0.95} />
        </mesh>
      ))}
      {labelsVisible && (
        <EcoLabel text="decomposers break down waste and return nutrients" position={[0.1, 0.42, 0.95]} color={VIOLET} />
      )}
    </group>
  )
}

function SupportGlb({ url, position, scale, opacity }: { url: string; position: [number, number, number]; scale: number; opacity: number }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const fit = 1.8 / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(fit)
    cloned.position.copy(center.multiplyScalar(-fit))
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.transparent = true
        material.opacity = opacity
        if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const standard = material as THREE.MeshStandardMaterial
          standard.roughness = 0.72
          standard.metalness = 0
        }
      })
    })
    return cloned
  }, [scene, opacity])

  return (
    <group position={position} scale={scale} rotation={[0, 0.35, 0]}>
      <primitive object={model} />
    </group>
  )
}

const DECOMPOSER_HERO_POSITION: [number, number, number] = [0.05, -0.25, 1.75]
const DECOMPOSER_HERO_FIT_SIZE = 0.95

/** Screen-reader-only status/alert text layered over a visual fallback (the procedural mushroom
 *  shape) that doesn't otherwise carry any text of its own — announces the loading/error state to
 *  assistive tech without changing what's actually drawn on screen. */
function DecomposerStatusAnnouncement({ message, role }: { message: string; role: 'status' | 'alert' }) {
  return (
    <Html center>
      <span role={role} aria-live={role === 'status' ? 'polite' : undefined} className="sr-only">
        {message}
      </span>
    </Html>
  )
}

/**
 * The Decomposer component's own mesh identity: the real mushroom-growth-stage GLB the learner
 * scrubs through with the growth-stage control, distinct from the dimmed producer/ecosystem
 * background dressing rendered by `SupportGlb` above. Always mounted (like the other role
 * clusters in this diorama) so it participates in the same isolate/dim food-web interaction;
 * only its own stage/url changes.
 */
function DecomposerMushroomHero({
  url,
  dim,
  labelsVisible,
  onSelect,
}: {
  url: string
  dim: boolean
  labelsVisible: boolean
  onSelect: () => void
}) {
  const fallback = <DecomposerMushroomFallback dim={dim} />
  const loadingFallback = (
    <>
      {fallback}
      <DecomposerStatusAnnouncement role="status" message="Loading mushroom model…" />
    </>
  )
  const errorFallback = (
    <>
      {fallback}
      <DecomposerStatusAnnouncement role="alert" message="This 3D model couldn't load. Showing a simplified view instead." />
    </>
  )
  return (
    <group
      position={DECOMPOSER_HERO_POSITION}
      rotation={[0, 0.3, 0]}
      onClick={(event) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <GlbErrorBoundary key={url} fallback={errorFallback} source="[EcologyLab]">
        <Suspense fallback={loadingFallback}>
          <DecomposerHeroModel url={url} dim={dim} />
        </Suspense>
      </GlbErrorBoundary>
      {labelsVisible && <EcoLabel text="decomposer: mushroom growth stages" position={[0, 0.85, 0]} color={VIOLET} />}
    </group>
  )
}

function DecomposerHeroModel({ url, dim }: { url: string; dim: boolean }) {
  const { scene } = useGLTF(url)
  const model = useMemo(() => {
    const cloned = scene.clone(true)
    const box = new THREE.Box3().setFromObject(cloned)
    const size = box.getSize(new THREE.Vector3())
    const center = box.getCenter(new THREE.Vector3())
    const fit = DECOMPOSER_HERO_FIT_SIZE / Math.max(size.x, size.y, size.z, 0.001)
    cloned.scale.setScalar(fit)
    // Center on x/z, but sit the base of the bounding box on the ground (y = 0 of this group)
    // instead of centering vertically, so the mushroom stands on the diorama floor at every stage.
    cloned.position.set(-center.x * fit, -box.min.y * fit, -center.z * fit)
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return
      child.material = Array.isArray(child.material)
        ? child.material.map((material) => material.clone())
        : child.material.clone()
      const materials = Array.isArray(child.material) ? child.material : [child.material]
      materials.forEach((material) => {
        material.transparent = true
        material.opacity = dim ? 0.2 : 1
        if ((material as THREE.MeshStandardMaterial).isMeshStandardMaterial) {
          const standard = material as THREE.MeshStandardMaterial
          standard.roughness = 0.75
          standard.metalness = 0
        }
      })
    })
    return cloned
  }, [scene, dim])

  return <primitive object={model} />
}

/** Loading/error placeholder for the mushroom hero — a simple cap-and-stem silhouette so the
 *  Decomposer component never shows a blank gap while a stage loads or if one fails to load. */
function DecomposerMushroomFallback({ dim }: { dim: boolean }) {
  const opacity = dim ? 0.18 : 0.55
  return (
    <group>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.05, 0.07, 0.32, 10]} />
        <meshStandardMaterial color="#EFE2CF" roughness={0.85} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.36, 0]} scale={[0.2, 0.11, 0.2]}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial color={VIOLET} roughness={0.8} transparent opacity={opacity} />
      </mesh>
    </group>
  )
}

function Ground({ habitatStress, xrayActive }: { habitatStress: number; xrayActive: boolean }) {
  return (
    <group>
      <mesh position={[0, -0.38, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.78, 1]}>
        <cylinderGeometry args={[2, 2, 0.18, 64]} />
        <meshStandardMaterial color={habitatStress > 0.55 ? '#B9A579' : '#88A864'} roughness={0.9} transparent opacity={xrayActive ? 0.28 : 1} />
      </mesh>
      <mesh position={[1.16, -0.27, 0.8]} rotation={[Math.PI / 2, 0, 0]} scale={[1.08, 0.54, 1]}>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 32]} />
        <meshStandardMaterial color={BLUE} roughness={0.36} transparent opacity={0.78 - habitatStress * 0.28} />
      </mesh>
      <mesh position={[-1.1, -0.28, 0.95]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[1.2, 0.18, 0.35]} />
        <meshStandardMaterial color={BROWN_DARK} roughness={0.8} />
      </mesh>
      {Array.from({ length: 9 }, (_, index) => (
        <mesh key={index} position={[-1.8 + index * 0.42, -0.22, 1.34 + Math.sin(index) * 0.16]} scale={[0.12, 0.05, 0.09]}>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color={STONE} roughness={0.86} />
        </mesh>
      ))}
    </group>
  )
}

function Sun({ sunlight }: { sunlight: number }) {
  return (
    <group position={[-2.25, 2.1, -0.9]}>
      <mesh scale={0.42 + sunlight * 0.16}>
        <sphereGeometry args={[1, 28, 18]} />
        <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={0.8 + sunlight * 1.2} roughness={0.4} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <Line
          key={index}
          points={[[0.12 + index * 0.05, -0.1 - index * 0.05, 0], [1.2 + index * 0.12, -1.2 - index * 0.1, 0.12]]}
          color={GOLD}
          lineWidth={1.6}
          transparent
          opacity={0.22 + sunlight * 0.45}
        />
      ))}
    </group>
  )
}

function ProducerCluster({ energy, dim, labelsVisible, onSelect }: { energy: number; dim: boolean; labelsVisible: boolean; onSelect: () => void }) {
  const height = 0.75 + energy * 0.45
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
      {[
        [-1.35, 0, -0.25, 1],
        [-0.88, 0, -0.52, 0.72],
        [-1.65, 0, 0.28, 0.62],
        [-0.55, 0, 0.22, 0.5],
      ].map(([x, _y, z, s], index) => (
        <group key={index} position={[x, -0.18, z]} scale={s}>
          <mesh position={[0, height * 0.16, 0]}>
            <cylinderGeometry args={[0.055, 0.075, height, 10]} />
            <meshStandardMaterial color={BROWN} transparent={dim} opacity={dim ? 0.18 : 1} />
          </mesh>
          <mesh position={[0, height * 0.72, 0]} scale={[0.35, 0.42, 0.35]}>
            <sphereGeometry args={[1, 18, 14]} />
            <meshStandardMaterial color={energy > 0.55 ? GREEN : GREEN_LIGHT} roughness={0.82} transparent={dim} opacity={dim ? 0.18 : 1} />
          </mesh>
        </group>
      ))}
      {labelsVisible && <EcoLabel text="producers make food" position={[-1.2, 1.18, 0.1]} color={GREEN_DARK} />}
    </group>
  )
}

function PreyCluster({ count, dim, labelsVisible, onSelect }: { count: number; dim: boolean; labelsVisible: boolean; onSelect: () => void }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
      {Array.from({ length: count }, (_, index) => {
        const angle = index * 0.72
        const x = 0.12 + Math.cos(angle) * 0.82
        const z = 0.16 + Math.sin(angle) * 0.44
        return <SmallAnimal key={index} position={[x, -0.06, z]} color="#C9A36F" scale={0.74} dim={dim} />
      })}
      {labelsVisible && <EcoLabel text={`${count} prey`} position={[0.25, 0.72, 0.72]} color={AMBER} />}
    </group>
  )
}

function PredatorCluster({ count, pressure, dim, labelsVisible, onSelect }: { count: number; pressure: number; dim: boolean; labelsVisible: boolean; onSelect: () => void }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
      {Array.from({ length: count }, (_, index) => (
        <Predator key={index} position={[1.28 + index * 0.32, 0.02, -0.48 + Math.sin(index) * 0.36]} pressure={pressure} dim={dim} />
      ))}
      {labelsVisible && <EcoLabel text="predators control prey pressure" position={[1.54, 0.78, -0.42]} color={RED} />}
    </group>
  )
}

function DecomposerPatch({ count, activity, dim, labelsVisible, onSelect }: { count: number; activity: number; dim: boolean; labelsVisible: boolean; onSelect: () => void }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
      {Array.from({ length: count }, (_, index) => (
        <group key={index} position={[-1.58 + (index % 5) * 0.22, -0.05, 1.0 + Math.floor(index / 5) * 0.18]} scale={0.82 + activity * 0.36}>
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.025, 0.035, 0.16, 8]} />
            <meshStandardMaterial color="#EFE2CF" transparent={dim} opacity={dim ? 0.2 : 1} />
          </mesh>
          <mesh position={[0, 0.18, 0]} scale={[0.09, 0.04, 0.09]}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color={VIOLET} roughness={0.78} transparent={dim} opacity={dim ? 0.2 : 1} />
          </mesh>
        </group>
      ))}
      {labelsVisible && <EcoLabel text="decomposers recycle nutrients" position={[-1.08, 0.56, 1.05]} color={VIOLET} />}
    </group>
  )
}

function WastePile({ level, dim, labelsVisible }: { level: number; dim: boolean; labelsVisible: boolean }) {
  const count = Math.round(level * 6)
  if (count <= 0) return null
  return (
    <group>
      {Array.from({ length: count }, (_, index) => {
        const row = Math.floor(index / 3)
        const col = index % 3
        const scale = 0.12 + level * 0.05
        return (
          <mesh
            key={index}
            position={[-1.55 + col * 0.24, -0.24 + row * 0.08, 1.32 + row * 0.16]}
            rotation={[0.1, index * 0.6, 0.05]}
            scale={scale}
          >
            <boxGeometry args={[1, 0.6, 1]} />
            <meshStandardMaterial color={BROWN_DARK} roughness={0.95} transparent opacity={dim ? 0.15 : 0.82} />
          </mesh>
        )
      })}
      {labelsVisible && level > 0.4 && <EcoLabel text="waste piling up" position={[-1.3, 0.06, 1.4]} color={BROWN_DARK} small />}
    </group>
  )
}

function HabitatLayer({ stress, opacity, dim, labelsVisible, onSelect }: { stress: number; opacity: number; dim: boolean; labelsVisible: boolean; onSelect: () => void }) {
  return (
    <group onClick={(event) => { event.stopPropagation(); onSelect() }}>
      <mesh position={[1.15, 0.12, 0.8]} scale={[1.42, 0.28, 0.78]}>
        <sphereGeometry args={[1, 24, 12]} />
        <meshStandardMaterial color={BLUE} roughness={0.55} transparent opacity={dim ? 0.12 : opacity * 0.14} />
      </mesh>
      <mesh position={[0.1, 0.05, -0.9]} rotation={[-0.2, 0.35, 0]} scale={[1.45, 0.12, 0.48]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={stress > 0.55 ? '#C9A676' : '#B6C996'} roughness={0.9} transparent opacity={dim ? 0.1 : 0.26} />
      </mesh>
      {labelsVisible && <EcoLabel text={stress > 0.5 ? 'stressed habitat' : 'water + shelter'} position={[1.25, 0.55, 0.95]} color={BLUE} />}
    </group>
  )
}

function NicheRing({ active, dim, labelsVisible }: { active: boolean; dim: boolean; labelsVisible: boolean }) {
  return (
    <group position={[0.48, 0.12, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <torusGeometry args={[0.62, 0.018, 8, 64]} />
        <meshStandardMaterial color={active ? GOLD : '#A8A094'} emissive={active ? GOLD : '#000000'} emissiveIntensity={active ? 0.45 : 0} transparent opacity={dim ? 0.14 : 0.88} />
      </mesh>
      {labelsVisible && <EcoLabel text="niche: role + resources" position={[0, 0, -0.62]} color={GOLD} />}
    </group>
  )
}

function EnergyWeb({
  progress,
  sunlight,
  predators,
  decomposers,
  habitatStress,
  xrayActive,
}: {
  progress: number
  sunlight: number
  predators: number
  decomposers: number
  habitatStress: number
  xrayActive: boolean
}) {
  const producerToPrey = (t: number) => [-1.05 + t * 1.42, 0.33 + Math.sin(t * Math.PI) * 0.2, -0.08 + t * 0.35] as [number, number, number]
  const preyToPredator = (t: number) => [0.2 + t * 1.25, 0.36 + Math.sin(t * Math.PI) * 0.18, 0.25 - t * 0.62] as [number, number, number]
  const deathToDecomposer = (t: number) => [0.55 - t * 1.42, 0.12 - t * 0.08, 0.5 + t * 0.56] as [number, number, number]
  const nutrientsToProducer = (t: number) => [-0.72 - t * 0.42, 0.08 + Math.sin(t * Math.PI) * 0.15, 0.92 - t * 1.0] as [number, number, number]
  const opacity = xrayActive ? 0.92 : 0.52

  return (
    <group>
      <FlowLine path={producerToPrey} color={GOLD} progress={progress} opacity={opacity * sunlight} label="food energy" />
      <FlowLine path={preyToPredator} color={RED} progress={progress + 0.18} opacity={opacity * predators} label="predation" />
      <FlowLine path={deathToDecomposer} color={VIOLET} progress={progress + 0.36} opacity={opacity * decomposers} label="dead matter" />
      <FlowLine path={nutrientsToProducer} color={GREEN_DARK} progress={progress + 0.54} opacity={opacity * (1 - habitatStress * 0.55)} label="nutrients" />
    </group>
  )
}

function FlowLine({ path, color, progress, opacity, label }: { path: (t: number) => [number, number, number]; color: string; progress: number; opacity: number; label: string }) {
  const points = Array.from({ length: 18 }, (_, index) => path(index / 17))
  return (
    <group>
      <Line points={points} color={color} lineWidth={2.2} transparent opacity={opacity * 0.62} />
      {Array.from({ length: 5 }, (_, index) => {
        const p = path((index / 5 + progress) % 1)
        return (
          <mesh key={index} position={p}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.58} transparent opacity={opacity} />
          </mesh>
        )
      })}
      <EcoLabel text={label} position={path(0.5)} color={color} small hidden={!opacity || opacity < 0.78} />
    </group>
  )
}

function SmallAnimal({ position, color, scale, dim }: { position: [number, number, number]; color: string; scale: number; dim: boolean }) {
  return (
    <group position={position} scale={scale}>
      <mesh scale={[0.18, 0.12, 0.28]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color={color} roughness={0.74} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[0.02, 0.08, 0.2]} scale={[0.09, 0.08, 0.11]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color={color} roughness={0.74} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[-0.06, 0.18, 0.23]} rotation={[0.45, 0, 0]} scale={[0.025, 0.12, 0.035]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color={color} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[0.08, 0.18, 0.23]} rotation={[0.45, 0, 0]} scale={[0.025, 0.12, 0.035]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color={color} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
    </group>
  )
}

function Predator({ position, pressure, dim }: { position: [number, number, number]; pressure: number; dim: boolean }) {
  return (
    <group position={position} scale={0.82 + pressure * 0.24} rotation={[0, -0.45, 0]}>
      <mesh scale={[0.24, 0.13, 0.34]}>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color={RED} roughness={0.72} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[0.02, 0.1, 0.28]} scale={[0.12, 0.1, 0.12]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#C74E45" roughness={0.72} transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[-0.08, 0.22, 0.3]} rotation={[0.12, 0, 0.2]} scale={[0.05, 0.13, 0.05]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color="#B64038" transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
      <mesh position={[0.09, 0.22, 0.3]} rotation={[0.12, 0, -0.2]} scale={[0.05, 0.13, 0.05]}>
        <coneGeometry args={[1, 1, 8]} />
        <meshStandardMaterial color="#B64038" transparent={dim} opacity={dim ? 0.18 : 1} />
      </mesh>
    </group>
  )
}

function EcoHotspot({
  hotspot,
  index,
  active,
  labelsVisible,
  dim,
  onSelect,
}: {
  hotspot: Hotspot
  index: number
  active: boolean
  labelsVisible: boolean
  dim: boolean
  onSelect: (id: string) => void
}) {
  const positions: [number, number, number][] = [
    [-1.14, 0.72, -0.18],
    [0.08, 0.58, 0.28],
    [1.35, 0.62, -0.34],
    [-0.9, 0.28, 1.0],
  ]
  const position = positions[index % positions.length]
  return (
    <group position={position} onClick={(event) => { event.stopPropagation(); onSelect(hotspot.id) }}>
      <mesh>
        <sphereGeometry args={[active ? 0.12 : 0.095, 18, 18]} />
        <meshStandardMaterial color={hotspot.color} emissive={hotspot.color} emissiveIntensity={active ? 0.75 : 0.22} transparent={dim} opacity={dim ? 0.22 : 1} />
      </mesh>
      {(labelsVisible || active) && <EcoLabel text={hotspot.label} position={[0, 0.25, 0]} color={hotspot.color} />}
    </group>
  )
}

function StageStrip({ content, activeHotspotId, onSelectHotspot }: { content: ComponentContent; activeHotspotId: string | null; onSelectHotspot: (id: string | null) => void }) {
  // The whole diorama scales down to ~0.52x on narrow/mobile viewports (see ResponsiveEcoGroup),
  // which shrinks this strip's 3D text past legibility. Below that same aspect threshold, keep
  // the tappable colored bars but drop the in-scene text -- the hotspot's full label is still
  // available via the DetailPanel/hotspot sphere once tapped.
  const { viewport } = useThree()
  const mobile = viewport.aspect < 1
  return (
    <group position={[0, -1.02, 1.52]}>
      {content.hotspots.slice(0, 4).map((hotspot, index) => {
        const active = activeHotspotId === hotspot.id
        return (
          <group key={hotspot.id} position={[-1.35 + index * 0.9, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectHotspot(active ? null : hotspot.id) }}>
            <mesh>
              <boxGeometry args={[0.72, 0.08, 0.12]} />
              <meshStandardMaterial color={active ? hotspot.color : '#DED6C9'} roughness={0.82} />
            </mesh>
            {!mobile && (
              <Billboard position={[0, -0.16, 0]}>
                <Text fontSize={0.09} color={active ? INK : '#7D766C'} anchorX="center" anchorY="middle" maxWidth={0.78}>
                  {hotspot.label}
                </Text>
              </Billboard>
            )}
          </group>
        )
      })}
    </group>
  )
}

function EcoLabel({ text, position, color, small, hidden }: { text: string; position: [number, number, number]; color: string; small?: boolean; hidden?: boolean }) {
  if (hidden) return null
  return (
    <Billboard position={position}>
      <Text fontSize={small ? 0.085 : 0.11} color={color} anchorX="center" anchorY="middle" maxWidth={1.15}>
        {text}
      </Text>
    </Billboard>
  )
}
