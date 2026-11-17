import { useCallback, useMemo, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Billboard, Line, OrbitControls, Text } from '@react-three/drei'
import {
  Activity,
  CheckCircle2,
  Droplets,
  Dumbbell,
  HeartPulse,
  Radio,
  ShieldCheck,
  SlidersHorizontal,
  Thermometer,
  Utensils,
  Wind,
  X,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { physiologyProcesses, physiologyProcessById } from '@/data/generated/human_physiology'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { BranchCauseEffectPanel, type GenericCauseControls } from '@/components/labs/BranchCauseEffectPanel'
import { BRANCH_CAUSE_EFFECT_CONFIGS, DEFAULT_PHYSIOLOGY_CONTROLS } from '@/data/branchCauseEffectConfigs'

const PROCESS_ICONS: Record<string, LucideIcon> = {
  breathing: Wind,
  'blood-circulation': HeartPulse,
  digestion: Utensils,
  'kidney-filtration': Droplets,
  'muscle-contraction': Dumbbell,
  'nerve-signaling': Zap,
  'hormone-signaling': Radio,
  'immune-response': ShieldCheck,
  'temperature-regulation': Thermometer,
}

const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'human-physiology')
const BACKGROUND = '#F8F3EA'
const INK = '#2F3740'
const RED = '#D85F55'
const BLUE = '#5A7EC8'
const PINK = '#D88AA0'
const GOLD = '#D9A441'
const GREEN = '#5E9E67'
const VIOLET = '#7E68B4'
const TEAL = '#4D9B91'
const BROWN = '#9A6A44'
const DEFAULT_CAMERA_DISTANCE = 7.4
const MIN_CAMERA_DISTANCE = 5.6
const MAX_CAMERA_DISTANCE = 10
const ZOOM_STEP = 0.4

function tuningCopy(processId: string, signal: number, load: number) {
  const signalPct = Math.round(signal * 100)
  const loadPct = Math.round(load * 100)

  switch (processId) {
    case 'blood-circulation': {
      const heartRate = Math.round(62 + signal * 95)
      const pressure = Math.round(95 + load * 55 + signal * 18)
      return {
        title: 'Pulse challenge',
        signalLabel: 'Body demand',
        signalValue: `${signalPct}%`,
        loadLabel: 'Vessel resistance',
        loadValue: `${loadPct}%`,
        resultLabel: 'Heart rate',
        resultValue: `${heartRate} bpm`,
        secondLabel: 'Pressure',
        secondValue: `${pressure}`,
        explanation: 'Rate rises when muscles ask for more oxygen. Narrower vessels raise pressure, so the pump works harder.',
      }
    }
    case 'breathing': {
      const breaths = Math.round(10 + signal * 28)
      const oxygen = Math.round((0.45 + signal * 0.55) * (1 - load * 0.55) * 100)
      return {
        title: 'Oxygen challenge',
        signalLabel: 'Breathing rate',
        signalValue: `${breaths}/min`,
        loadLabel: 'Airway tightness',
        loadValue: `${loadPct}%`,
        resultLabel: 'Oxygen pickup',
        resultValue: `${oxygen}%`,
        secondLabel: 'Lung motion',
        secondValue: signal > 0.65 ? 'fast' : 'steady',
        explanation: 'Faster breathing rate moves more air, but a tighter airway reduces how much oxygen reaches the blood.',
      }
    }
    case 'digestion': {
      const breakdown = Math.round((0.35 + signal * 0.65) * (1 - load * 0.35) * 100)
      return {
        title: 'Digestion challenge',
        signalLabel: 'Enzyme help',
        signalValue: `${signalPct}%`,
        loadLabel: 'Meal size',
        loadValue: `${loadPct}%`,
        resultLabel: 'Breakdown speed',
        resultValue: `${breakdown}%`,
        secondLabel: 'Time',
        secondValue: load > 0.65 ? 'longer' : 'shorter',
        explanation: 'More enzyme action speeds up chemical breakdown. A larger meal takes longer to move through the same digestion pathway.',
      }
    }
    case 'kidney-filtration': {
      const cleaned = Math.round((0.45 + signal * 0.55) * (1 - load * 0.45) * 100)
      return {
        title: 'Filter challenge',
        signalLabel: 'Water level',
        signalValue: `${signalPct}%`,
        loadLabel: 'Waste load',
        loadValue: `${loadPct}%`,
        resultLabel: 'Cleaned fluid',
        resultValue: `${cleaned}%`,
        secondLabel: 'Urine color',
        secondValue: signal < 0.35 ? 'dark' : 'pale',
        explanation: 'More water helps fluid flow through the filters. More waste load means the kidneys must remove more from the blood.',
      }
    }
    case 'nerve-signaling': {
      const speed = Math.round(15 + signal * 85 - load * 25)
      return {
        title: 'Signal challenge',
        signalLabel: 'Signal strength',
        signalValue: `${signalPct}%`,
        loadLabel: 'Pathway gap',
        loadValue: `${loadPct}%`,
        resultLabel: 'Signal speed',
        resultValue: `${Math.max(5, speed)}%`,
        secondLabel: 'Message',
        secondValue: load > 0.7 ? 'weaker' : 'clear',
        explanation: 'A stronger nerve signal travels more clearly. A wider pathway gap makes the message weaker before it reaches the next cell.',
      }
    }
    case 'muscle-contraction': {
      const force = Math.round((0.3 + signal * 0.7) * (1 - load * 0.42) * 100)
      return {
        title: 'Muscle challenge',
        signalLabel: 'Nerve command',
        signalValue: `${signalPct}%`,
        loadLabel: 'Load weight',
        loadValue: `${loadPct}%`,
        resultLabel: 'Contraction',
        resultValue: `${force}%`,
        secondLabel: 'Fatigue',
        secondValue: load > 0.65 ? 'rising' : 'low',
        explanation: 'A stronger nerve command pulls more fibers together. A heavier load makes the same muscle work harder and fatigue sooner.',
      }
    }
    case 'hormone-signaling': {
      const delivered = Math.round((0.3 + signal * 0.7) * (1 - load * 0.4) * 100)
      return {
        title: 'Hormone challenge',
        signalLabel: 'Hormone release',
        signalValue: `${signalPct}%`,
        loadLabel: 'Receptor scarcity',
        loadValue: `${loadPct}%`,
        resultLabel: 'Hormone delivery',
        resultValue: `${delivered}%`,
        secondLabel: 'Feedback',
        secondValue: signal > 0.7 ? 'dialing down' : 'steady',
        explanation: 'More hormone release improves hormone delivery to matching receptors. When receptors are scarce, fewer target cells respond.',
      }
    }
    case 'immune-response': {
      const response = Math.round((0.25 + signal * 0.75) * (1 - load * 0.28) * 100)
      return {
        title: 'Defense challenge',
        signalLabel: 'Immune signal',
        signalValue: `${signalPct}%`,
        loadLabel: 'Germ load',
        loadValue: `${loadPct}%`,
        resultLabel: 'Defense',
        resultValue: `${response}%`,
        secondLabel: 'Inflammation',
        secondValue: signal > 0.7 ? 'strong' : 'mild',
        explanation: 'More immune signaling brings more defenders. A bigger germ load takes longer to clear and can outpace the response.',
      }
    }
    case 'temperature-regulation': {
      const cooling = Math.round((0.3 + signal * 0.7) * 100)
      return {
        title: 'Temperature challenge',
        signalLabel: 'Heat stress',
        signalValue: `${signalPct}%`,
        loadLabel: 'Sweat loss',
        loadValue: `${loadPct}%`,
        resultLabel: 'Cooling',
        resultValue: `${cooling}%`,
        secondLabel: 'Water need',
        secondValue: load > 0.55 ? 'high' : 'normal',
        explanation: 'Heat stress triggers sweat and blood flow near skin. Too much sweat loss removes water, making heat release harder.',
      }
    }
    default: {
      const delivery = Math.round((0.4 + signal * 0.6) * (1 - load * 0.3) * 100)
      return {
        title: 'Signal challenge',
        signalLabel: 'Signal strength',
        signalValue: `${signalPct}%`,
        loadLabel: 'Body load',
        loadValue: `${loadPct}%`,
        resultLabel: 'Response',
        resultValue: `${delivery}%`,
        secondLabel: 'System',
        secondValue: 'adjusting',
        explanation: 'Body systems respond to signals and loads. Change the cause and watch the response shift.',
      }
    }
  }
}

type GuidedChallenge = {
  mission: string
  observe: string
  predict: string
  change: string
  check: string
  predictOptions: [string, string]
  predictCorrectIndex: 0 | 1
}

const GUIDED_CHALLENGES: Record<string, GuidedChallenge> = {
  'blood-circulation': {
    mission: 'Heart mission: balance rate and pressure so oxygen delivery rises without overloading the pump.',
    observe: 'Watch the red loop pulse out to the body and the blue loop pulse to the lungs.',
    predict: 'If the body demands more oxygen, will the heart beat faster or slower?',
    change: 'Drag Body demand up, then drag Vessel resistance up.',
    check: 'Why does a narrower vessel raise pressure even at the same heart rate?',
    predictOptions: ['Beat faster', 'Beat slower'],
    predictCorrectIndex: 0,
  },
  breathing: {
    mission: 'Lung mission: test how breathing rate and airway tightness compete during oxygen pickup.',
    observe: 'Watch the lungs expand and shrink, and the blue air dots move down the airway.',
    predict: 'If the airway gets tighter, will the same breathing rate pick up more or less oxygen?',
    change: 'Drag Breathing rate up, then drag Airway tightness up.',
    check: 'Why can faster breathing still fail to raise oxygen pickup?',
    predictOptions: ['More oxygen', 'Less oxygen'],
    predictCorrectIndex: 1,
  },
  digestion: {
    mission: 'Digestion mission: decide when enzyme help can compensate for a larger meal.',
    observe: 'Watch the stomach size change and the gold food particles move through the tract.',
    predict: 'If a meal gets much bigger, will it move through digestion faster or slower?',
    change: 'Drag Meal size up, then drag Enzyme help up to compensate.',
    check: 'What does enzyme help actually speed up along the tract?',
    predictOptions: ['Faster', 'Slower'],
    predictCorrectIndex: 1,
  },
  'kidney-filtration': {
    mission: 'Kidney mission: protect water balance while clearing a rising waste load.',
    observe: 'Watch the fluid dots move through both kidneys and notice their color.',
    predict: 'If water level drops, will urine get darker or paler?',
    change: 'Drag Water level down, then drag Waste load up.',
    check: 'Why does more waste load need more water to clean it out?',
    predictOptions: ['Darker', 'Paler'],
    predictCorrectIndex: 0,
  },
  'nerve-signaling': {
    mission: 'Nerve mission: keep a signal clear across a stressed pathway.',
    observe: 'Watch the gold signal dot travel node to node along the purple pathway.',
    predict: 'If the pathway gap grows, will the message stay clear or get weaker?',
    change: 'Drag Signal strength up, then drag Pathway gap up.',
    check: 'Why can a strong starting signal still arrive weak?',
    predictOptions: ['Stay clear', 'Get weaker'],
    predictCorrectIndex: 1,
  },
  'muscle-contraction': {
    mission: 'Muscle mission: compare nerve command against load weight before fatigue climbs.',
    observe: 'Watch the four muscle fibers shorten and the load block shift.',
    predict: 'If the load gets heavier, will the same nerve command pull it as far?',
    change: 'Drag Nerve command up, then drag Load weight up.',
    check: 'Why does fatigue rise when load stays high?',
    predictOptions: ['Yes, same distance', 'No, less distance'],
    predictCorrectIndex: 1,
  },
  'hormone-signaling': {
    mission: 'Hormone mission: improve hormone delivery even when receptor access is limited.',
    observe: 'Watch the gold hormone dot travel from the gland to the target cell.',
    predict: 'If receptors are scarce, will more hormone released still reach more cells?',
    change: 'Drag Hormone release up, then drag Receptor scarcity up.',
    check: 'Why does a hormone pass most cells with zero effect?',
    predictOptions: ['Yes, more cells respond', 'No, fewer cells respond'],
    predictCorrectIndex: 1,
  },
  'immune-response': {
    mission: 'Immune mission: match immune signal to germ load before defenders fall behind.',
    observe: 'Watch germs shrink as defenders clear them, and antibodies appear near the center.',
    predict: 'If germ load rises faster than immune signal, will defense keep up?',
    change: 'Drag Germ load up, then drag Immune signal up to respond.',
    check: 'Why does a bigger germ load take longer to clear?',
    predictOptions: ['Yes, keeps up', 'No, falls behind'],
    predictCorrectIndex: 1,
  },
  'temperature-regulation': {
    mission: 'Temperature mission: choose sweat, heat release, or shivering to return toward balance.',
    observe: 'Watch the skin tone and cues change: sweat drops when hot, a shiver-blue tint when cold.',
    predict: 'If heat stress is low instead of high, will the body sweat or shiver?',
    change: 'Drag Heat stress to the low end, then to the high end.',
    check: 'Why does sweating cool the body while shivering warms it?',
    predictOptions: ['Sweat', 'Shiver'],
    predictCorrectIndex: 1,
  },
}

function guidedChallenge(processId: string): GuidedChallenge {
  return (
    GUIDED_CHALLENGES[processId] ?? {
      observe: 'Watch how the model responds as the two controls change.',
      mission: 'Physiology mission: change a cause and explain the body response.',
      predict: 'What do you expect will change first: the cause or the effect?',
      change: 'Drag both sliders and compare the result each time.',
      check: 'Can you explain the cause and effect in your own words?',
      predictOptions: ['The cause', 'The effect'],
      predictCorrectIndex: 0,
    }
  )
}

function stageLabel(content: ComponentContent, activeStageId: string | null) {
  const index = content.hotspots.findIndex((h) => h.id === activeStageId)
  if (index < 0) return 'Ready'
  return `Stage ${index + 1}/${content.hotspots.length}`
}

function pickDefaultStage(content: ComponentContent) {
  return content.hotspots[0]?.id ?? null
}

function hotspotFor(content: ComponentContent, label: string): Hotspot | null {
  return content.hotspots.find((hotspot) => hotspot.label.toLowerCase() === label.toLowerCase()) ?? null
}

export default function PhysiologyLab() {
  const [processId, setProcessId] = useState(physiologyProcesses[0].id)
  const [activeStageId, setActiveStageId] = useState<string | null>(null)
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
  const [signal, setSignal] = useState(0.55)
  const [load, setLoad] = useState(0.3)
  const [flowProgress, setFlowProgress] = useState(0)
  const [prediction, setPrediction] = useState<0 | 1 | null>(null)
  const [checked, setChecked] = useState(false)
  const [physiologyControls, setPhysiologyControls] = useState<GenericCauseControls>(DEFAULT_PHYSIOLOGY_CONTROLS)
  const flowAccumulator = useRef(0)

  const content = physiologyProcessById[processId] ?? physiologyProcesses[0]
  const copy = useMemo(() => tuningCopy(processId, signal, load), [processId, signal, load])
  const challenge = useMemo(() => guidedChallenge(processId), [processId])
  const compareTarget = content.compareCandidate
    ? (physiologyProcessById[content.compareCandidate] ?? resolveContent(content.compareCandidate))
    : null
  const activeStage = useMemo(
    () => content.hotspots.find((h) => h.id === activeStageId) ?? null,
    [content, activeStageId],
  )

  const enhancedContent: ComponentContent = useMemo(() => ({
    ...content,
    keyFacts: [
      { label: 'What changes?', value: copy.resultValue },
      { label: copy.signalLabel, value: copy.signalValue },
      { label: copy.loadLabel, value: copy.loadValue },
      { label: 'Why?', value: copy.explanation },
      ...content.keyFacts.slice(0, 4),
    ],
  }), [content, copy])

  const handleAnimationTick = useCallback((delta: number) => {
    flowAccumulator.current += delta
    const steps = Math.floor(flowAccumulator.current / 0.08)
    if (steps <= 0) return
    flowAccumulator.current -= steps * 0.08
    setFlowProgress((value) => (value + 0.09 * steps * (0.5 + signal)) % 1)
  }, [signal])

  const selectProcess = (id: string) => {
    setProcessId(id)
    setActiveStageId(null)
    setControlsOpen(false)
    setFlowProgress(0)
    setSignal(0.55)
    setLoad(id === 'breathing' ? 0.2 : 0.3)
    setPrediction(null)
    setChecked(false)
  }

  const reset = () => {
    setActiveStageId(null)
    setAutoRotate(false)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setLabelsVisible(false)
    setXrayActive(false)
    setIsolateActive(false)
    setAnimationPlaying(true)
    setCleanView(false)
    setControlsOpen(false)
    setSignal(0.55)
    setLoad(processId === 'breathing' ? 0.2 : 0.3)
    setFlowProgress(0)
    setPrediction(null)
    setChecked(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={Activity}
            branchName="Human Physiology"
            items={physiologyProcesses.map((p) => ({
              id: p.id,
              name: p.name,
              meta: p.system,
              icon: PROCESS_ICONS[p.id],
            }))}
            activeItemId={processId}
            onSelect={selectProcess}
            otherBranches={otherBranches}
            footerNote="Flagship physiology lab: change demand, resistance, speed, or load and watch the body system respond."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[56svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setIsolateActive((value) => !value)}
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
              Physiology - change a cause, watch the body respond
            </div>
          </div>

          <PhysiologyScene
            processId={processId}
            content={content}
            activeStageId={activeStageId}
            onSelectStage={setActiveStageId}
            autoRotate={autoRotate}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            isolateActive={isolateActive}
            animationPlaying={animationPlaying}
            cameraDistance={cameraDistance}
            signal={signal}
            load={load}
            flowProgress={flowProgress}
            onAnimationTick={handleAnimationTick}
          />

          <div data-canvas-overlay className="absolute bottom-3 left-3 right-3 z-10 sm:left-24 sm:right-4">
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[24rem] sm:flex-1">
                  <Meter label={copy.signalLabel} value={copy.signalValue} />
                  <Meter label={copy.resultLabel} value={copy.resultValue} />
                  <Meter label={copy.secondLabel} value={copy.secondValue} />
                </div>
                <div className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:max-w-[24rem]">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Critical-thinking mission</p>
                  <p className="mt-0.5 line-clamp-2 text-xs font-medium leading-snug text-[color:var(--color-foreground)]">{challenge.mission}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <SlidersHorizontal className="h-4 w-4" strokeWidth={1.8} />
                  Tune body
                </button>
              </div>
            ) : (
              <TunePanel
                copy={copy}
                challenge={challenge}
                signal={signal}
                setSignal={setSignal}
                load={load}
                setLoad={setLoad}
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
          <BranchCauseEffectPanel
            activeId={processId}
            config={BRANCH_CAUSE_EFFECT_CONFIGS['human-physiology']}
            controls={physiologyControls}
            onChange={setPhysiologyControls}
          />
          <DetailPanel
            content={enhancedContent}
            activeHotspot={activeStage}
            onClearHotspot={() => setActiveStageId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={enhancedContent} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} labState={{ physiologyControls }} />

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
  challenge,
  signal,
  setSignal,
  load,
  setLoad,
  prediction,
  setPrediction,
  checked,
  setChecked,
  onClose,
}: {
  copy: ReturnType<typeof tuningCopy>
  challenge: GuidedChallenge
  signal: number
  setSignal: Dispatch<SetStateAction<number>>
  load: number
  setLoad: Dispatch<SetStateAction<number>>
  prediction: 0 | 1 | null
  setPrediction: Dispatch<SetStateAction<0 | 1 | null>>
  checked: boolean
  setChecked: Dispatch<SetStateAction<boolean>>
  onClose: () => void
}) {
  return (
    <div className="grid max-h-[46svh] gap-3 overflow-y-auto overscroll-contain rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile-lg)] backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{copy.title}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Hide physiology controls"
          className="rounded-full p-1.5 text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-foreground)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs font-semibold leading-snug text-[color:var(--color-foreground)]">
        {challenge.mission}
      </p>
      <ol className="grid gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[11px] leading-snug text-[color:var(--color-ink-500)]">
        <li><strong className="text-[color:var(--color-foreground)]">Observe.</strong> {challenge.observe}</li>
        <li><strong className="text-[color:var(--color-foreground)]">Predict.</strong> {challenge.predict}</li>
        <li><strong className="text-[color:var(--color-foreground)]">Change.</strong> {challenge.change}</li>
        <li><strong className="text-[color:var(--color-foreground)]">Explain.</strong> {copy.explanation}</li>
      </ol>
      <PredictCheck challenge={challenge} prediction={prediction} setPrediction={setPrediction} checked={checked} setChecked={setChecked} />
      <RangeControl label={copy.signalLabel} value={signal} valueText={copy.signalValue} onChange={setSignal} />
      <RangeControl label={copy.loadLabel} value={load} valueText={copy.loadValue} onChange={setLoad} />
    </div>
  )
}

function PredictCheck({
  challenge,
  prediction,
  setPrediction,
  checked,
  setChecked,
}: {
  challenge: GuidedChallenge
  prediction: 0 | 1 | null
  setPrediction: Dispatch<SetStateAction<0 | 1 | null>>
  checked: boolean
  setChecked: Dispatch<SetStateAction<boolean>>
}) {
  const isCorrect = checked && prediction === challenge.predictCorrectIndex
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Predict, then check</p>
      <p className="mt-0.5 text-xs leading-snug text-[color:var(--color-foreground)]">{challenge.predict}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {challenge.predictOptions.map((option, i) => (
          <button
            key={option}
            type="button"
            onClick={() => {
              setPrediction(i as 0 | 1)
              setChecked(false)
            }}
            aria-pressed={prediction === i}
            className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              prediction === i
                ? 'border-[color:var(--color-biology-deep)] bg-[color:var(--color-biology-deep)]/12 text-[color:var(--color-foreground)]'
                : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)]'
            }`}
          >
            {option}
          </button>
        ))}
        <button
          type="button"
          disabled={prediction === null}
          onClick={() => setChecked(true)}
          className="min-h-11 rounded-full bg-[color:var(--color-biology-deep)] px-3 py-1.5 text-xs font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Check
        </button>
      </div>
      {checked && prediction !== null && (
        <p className={`mt-2 flex items-start gap-1.5 text-xs font-medium leading-relaxed ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
          {isCorrect ? <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
          <span>
            {isCorrect ? 'Correct. ' : 'Not quite. '}
            {challenge.check}
          </span>
        </p>
      )}
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

function AnimationDriver({ playing, onTick }: { playing: boolean; onTick: (delta: number) => void }) {
  const accumulated = useRef(0)
  useFrame((_, delta) => {
    if (!playing) {
      accumulated.current = 0
      return
    }
    accumulated.current += delta
    const steps = Math.floor(accumulated.current / 0.08)
    if (steps <= 0) return
    accumulated.current -= steps * 0.08
    onTick(steps * 0.08)
  })
  return null
}

function PhysiologyScene({
  processId,
  content,
  activeStageId,
  onSelectStage,
  autoRotate,
  labelsVisible,
  xrayActive,
  isolateActive,
  animationPlaying,
  cameraDistance,
  signal,
  load,
  flowProgress,
  onAnimationTick,
}: {
  processId: string
  content: ComponentContent
  activeStageId: string | null
  onSelectStage: (id: string | null) => void
  autoRotate: boolean
  labelsVisible: boolean
  xrayActive: boolean
  isolateActive: boolean
  animationPlaying: boolean
  cameraDistance: number
  signal: number
  load: number
  flowProgress: number
  onAnimationTick: (delta: number) => void
}) {
  return (
    <Canvas
      className="h-full w-full"
      style={{ display: 'block', height: '100%', width: '100%' }}
      camera={{ position: [0, 0.3, cameraDistance], fov: 38 }}
      dpr={[1, 2]}
      onPointerMissed={() => onSelectStage(null)}
    >
      <color attach="background" args={[BACKGROUND]} />
      <ambientLight intensity={0.76} />
      <directionalLight position={[4, 5, 6]} intensity={1.05} />
      <OrbitControls enablePan={false} autoRotate={autoRotate} autoRotateSpeed={0.55} minDistance={5.4} maxDistance={10.5} />
      <AnimationDriver playing={animationPlaying} onTick={onAnimationTick} />
      <ResponsivePhysiologyGroup>
        <BodySilhouette xray={xrayActive} />
        {processId === 'blood-circulation' && <BloodScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'breathing' && <BreathingScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'digestion' && <DigestionScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'kidney-filtration' && <KidneyScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'nerve-signaling' && <NerveScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'muscle-contraction' && <MuscleScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'hormone-signaling' && <HormoneScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'immune-response' && <ImmuneScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        {processId === 'temperature-regulation' && <TemperatureScene content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} signal={signal} load={load} progress={flowProgress} labelsVisible={labelsVisible} isolateActive={isolateActive} />}
        <StageStrip content={content} activeStageId={activeStageId} onSelectStage={onSelectStage} />
      </ResponsivePhysiologyGroup>
    </Canvas>
  )
}

function ResponsivePhysiologyGroup({ children }: { children: ReactNode }) {
  const { viewport } = useThree()
  const scale = viewport.aspect < 0.7 ? 0.58 : viewport.aspect < 1 ? 0.74 : 1
  return <group scale={scale}>{children}</group>
}

function BodySilhouette({ xray }: { xray: boolean }) {
  return (
    <group position={[0, -0.08, -0.22]}>
      <mesh position={[0, 0.9, 0]} scale={[0.45, 0.58, 0.12]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshStandardMaterial color="#EADDD1" roughness={0.85} transparent opacity={xray ? 0.12 : 0.3} />
      </mesh>
      <mesh position={[0, -0.46, 0]} scale={[0.85, 1.55, 0.18]}>
        <sphereGeometry args={[1, 36, 24]} />
        <meshStandardMaterial color="#EADDD1" roughness={0.85} transparent opacity={xray ? 0.1 : 0.26} />
      </mesh>
    </group>
  )
}

function Marker({
  content,
  label,
  fallback,
  activeStageId,
  onSelectStage,
  position,
  color,
  text,
  dim,
}: {
  content: ComponentContent
  label: string
  fallback?: string
  activeStageId: string | null
  onSelectStage: (id: string | null) => void
  position: [number, number, number]
  color: string
  text?: string
  dim?: boolean
}) {
  const hotspot = hotspotFor(content, label) ?? (fallback ? hotspotFor(content, fallback) : null) ?? content.hotspots[0] ?? null
  const active = hotspot?.id === activeStageId
  return (
    <group
      position={position}
      onClick={(event) => {
        event.stopPropagation()
        if (hotspot) onSelectStage(active ? null : hotspot.id)
      }}
    >
      <mesh>
        <sphereGeometry args={[active ? 0.12 : 0.09, 18, 18]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={active ? 0.55 : 0.12} transparent opacity={dim ? 0.25 : 1} />
      </mesh>
      {text && (
        <Billboard position={[0, 0.24, 0]}>
          <Text fontSize={0.11} color={INK} anchorX="center" anchorY="middle">{text}</Text>
        </Billboard>
      )}
    </group>
  )
}

function FlowBeads({ path, color, progress, count = 6, size = 0.055, dim }: { path: (t: number) => [number, number, number]; color: string; progress: number; count?: number; size?: number; dim?: boolean }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => {
        const t = (progress + index / count) % 1
        return (
          <mesh key={index} position={path(t)}>
            <sphereGeometry args={[size, 12, 12]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={dim ? 0.2 : 0.95} />
          </mesh>
        )
      })}
    </>
  )
}

function StageStrip({ content, activeStageId, onSelectStage }: { content: ComponentContent; activeStageId: string | null; onSelectStage: (id: string | null) => void }) {
  const shown = content.hotspots.slice(0, 6)
  const count = Math.max(1, shown.length)
  return (
    <group position={[0, -2.35, 0.12]}>
      <Text position={[0, 0.36, 0]} fontSize={0.13} color={INK} anchorX="center">
        {stageLabel(content, activeStageId)}
      </Text>
      {shown.map((stage, index) => {
        const x = (index - (count - 1) / 2) * 0.62
        const active = stage.id === activeStageId
        return (
          <group key={stage.id} position={[x, 0, 0]} onClick={(event) => { event.stopPropagation(); onSelectStage(active ? null : stage.id) }}>
            <mesh>
              <sphereGeometry args={[active ? 0.13 : 0.1, 16, 16]} />
              <meshStandardMaterial color={stage.color} emissive={stage.color} emissiveIntensity={active ? 0.45 : 0.08} />
            </mesh>
            <Text position={[0, -0.22, 0]} fontSize={0.09} color={INK} anchorX="center" anchorY="middle">
              {index + 1}
            </Text>
          </group>
        )
      })}
    </group>
  )
}

function BloodScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible, isolateActive }: SceneProps) {
  const beat = 1 + Math.sin(progress * Math.PI * 2) * 0.06 * (0.6 + signal)
  const pressure = 0.06 + load * 0.08
  const bodyLoop = (t: number) => [Math.sin(t * Math.PI * 2) * 1.35, -0.15 + Math.cos(t * Math.PI * 2) * 1.12, 0.1] as [number, number, number]
  const lungLoop = (t: number) => [Math.sin(t * Math.PI * 2) * 0.68, 0.85 + Math.cos(t * Math.PI * 2) * 0.38, 0.16] as [number, number, number]
  const dim = isolateActive && activeStageId !== null
  return (
    <group>
      <Line points={Array.from({ length: 90 }, (_, i) => bodyLoop(i / 89))} color={BLUE} lineWidth={pressure * 18} transparent opacity={0.55} />
      <Line points={Array.from({ length: 70 }, (_, i) => lungLoop(i / 69))} color={RED} lineWidth={3} transparent opacity={0.65} />
      <FlowBeads path={bodyLoop} color={RED} progress={progress} count={10} dim={dim} />
      <FlowBeads path={lungLoop} color={BLUE} progress={(progress + 0.45) % 1} count={6} dim={dim} />
      <group position={[0, 0.05, 0.24]} scale={[beat, beat, beat]} onClick={(event) => { event.stopPropagation(); onSelectStage(pickDefaultStage(content)) }}>
        <mesh position={[-0.13, 0.05, 0]} rotation={[0, 0, -0.25]}>
          <sphereGeometry args={[0.32, 24, 18]} />
          <meshStandardMaterial color={RED} roughness={0.48} />
        </mesh>
        <mesh position={[0.13, 0.05, 0]} rotation={[0, 0, 0.25]}>
          <sphereGeometry args={[0.32, 24, 18]} />
          <meshStandardMaterial color={RED} roughness={0.48} />
        </mesh>
      </group>
      <Marker content={content} label="Heart" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0, 0.52, 0.48]} color={RED} text={labelsVisible ? 'heart pumps faster' : undefined} />
      <Marker content={content} label="Capillaries" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[1.35, -0.2, 0.35]} color={GOLD} text={labelsVisible ? 'oxygen exchange' : undefined} />
      <CauseLabel text={`demand up -> ${Math.round(62 + signal * 95)} bpm`} />
    </group>
  )
}

function BreathingScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible, isolateActive }: SceneProps) {
  const inhale = 0.9 + Math.sin(progress * Math.PI * 2) * 0.12 * (0.45 + signal)
  const airway = 0.18 - load * 0.1
  const airPath = (t: number) => [0, 1.45 - t * 1.55, 0.32] as [number, number, number]
  const dim = isolateActive && activeStageId !== null
  return (
    <group>
      <mesh position={[0, 0.85, 0.16]}>
        <cylinderGeometry args={[airway, airway * 0.8, 1.3, 18]} />
        <meshStandardMaterial color={TEAL} roughness={0.55} transparent opacity={0.75} />
      </mesh>
      <mesh position={[-0.43, 0.2, 0.18]} scale={[0.55 * inhale, 0.8 * inhale, 0.28]}>
        <sphereGeometry args={[0.62, 32, 20]} />
        <meshStandardMaterial color={PINK} roughness={0.6} transparent opacity={dim ? 0.25 : 0.82} />
      </mesh>
      <mesh position={[0.43, 0.2, 0.18]} scale={[0.55 * inhale, 0.8 * inhale, 0.28]}>
        <sphereGeometry args={[0.62, 32, 20]} />
        <meshStandardMaterial color={PINK} roughness={0.6} transparent opacity={dim ? 0.25 : 0.82} />
      </mesh>
      <Line points={[[-1.05, -0.7, 0.3], [-0.3, -0.95, 0.3], [0.3, -0.95, 0.3], [1.05, -0.7, 0.3]]} color={BROWN} lineWidth={5} />
      <FlowBeads path={airPath} color={BLUE} progress={progress} count={7} dim={dim} />
      <Marker content={content} label="Lung expansion" fallback="Gas exchange at alveoli" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0.8, 0.58, 0.48]} color={PINK} text={labelsVisible ? 'lungs expand' : undefined} />
      <Marker content={content} label="Diaphragm contraction" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0, -1.02, 0.45]} color={BROWN} text={labelsVisible ? 'diaphragm pulls down' : undefined} />
      <CauseLabel text={`airway tightness cuts oxygen to ${Math.round((0.45 + signal * 0.55) * (1 - load * 0.55) * 100)}%`} />
    </group>
  )
}

function DigestionScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible, isolateActive }: SceneProps) {
  const stomachScale = 0.86 + load * 0.22
  const digestionPath = (t: number) => [Math.sin(t * Math.PI * 2.2) * 0.55, 0.55 - t * 1.95, 0.24] as [number, number, number]
  return (
    <group>
      <mesh position={[0, 0.72, 0.12]} scale={[0.72 * stomachScale, 0.52 * stomachScale, 0.24]}>
        <sphereGeometry args={[0.62, 28, 20]} />
        <meshStandardMaterial color={PINK} roughness={0.58} transparent opacity={isolateActive ? 0.72 : 0.9} />
      </mesh>
      <Line points={Array.from({ length: 120 }, (_, i) => digestionPath(i / 119))} color={BROWN} lineWidth={7} transparent opacity={0.55} />
      <FlowBeads path={digestionPath} color={GOLD} progress={progress * (0.6 + signal)} count={9} />
      <Marker content={content} label="Stomach" fallback="Small intestine" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0.72, 0.75, 0.42]} color={PINK} text={labelsVisible ? 'food churns' : undefined} />
      <Marker content={content} label="Small intestine" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0.58, -0.55, 0.42]} color={GOLD} text={labelsVisible ? 'nutrients absorbed' : undefined} />
      <CauseLabel text={`enzymes ${Math.round(signal * 100)}% -> breakdown changes`} />
    </group>
  )
}

function KidneyScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const cleaned = (0.45 + signal * 0.55) * (1 - load * 0.45)
  const nephron = (x: number) => (t: number) => [x + Math.sin(t * Math.PI * 4) * 0.18, 0.8 - t * 1.7, 0.22] as [number, number, number]
  const urineColor = signal < 0.35 ? BROWN : GOLD
  return (
    <group>
      {[-0.48, 0.48].map((x) => (
        <mesh key={x} position={[x, 0.18, 0.12]} scale={[0.48, 0.75, 0.22]}>
          <sphereGeometry args={[0.72, 28, 20]} />
          <meshStandardMaterial color={RED} roughness={0.62} transparent opacity={0.72} />
        </mesh>
      ))}
      <Line points={Array.from({ length: 90 }, (_, i) => nephron(-0.48)(i / 89))} color={BLUE} lineWidth={5} transparent opacity={0.55} />
      <Line points={Array.from({ length: 90 }, (_, i) => nephron(0.48)(i / 89))} color={BLUE} lineWidth={5} transparent opacity={0.55} />
      <FlowBeads path={nephron(-0.48)} color={cleaned > 0.6 ? BLUE : GOLD} progress={progress} count={6} />
      <FlowBeads path={nephron(0.48)} color={cleaned > 0.6 ? BLUE : GOLD} progress={(progress + 0.45) % 1} count={6} />
      <mesh position={[0, -1.05, 0.16]} scale={[0.22, 0.28, 0.18]}>
        <sphereGeometry args={[0.5, 20, 16]} />
        <meshStandardMaterial color={urineColor} roughness={0.5} transparent opacity={0.88} />
      </mesh>
      <Marker content={content} label="Blood Enters Kidney" fallback="Nephron Filters Waste" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[0.9, 0.34, 0.4]} color={BLUE} text={labelsVisible ? 'filters blood' : undefined} />
      <CauseLabel text={`water helps filters: cleaned ${Math.round(cleaned * 100)}%, urine ${signal < 0.35 ? 'dark' : 'pale'}`} />
    </group>
  )
}

function NerveScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const path = (t: number) => [-1.5 + t * 3, Math.sin(t * Math.PI * 3) * 0.28, 0.2] as [number, number, number]
  return (
    <group>
      <Line points={Array.from({ length: 130 }, (_, i) => path(i / 129))} color={VIOLET} lineWidth={8 - load * 4} transparent opacity={0.65} />
      <FlowBeads path={path} color={GOLD} progress={progress * (0.7 + signal)} count={5} size={0.07} />
      {[-1.5, -0.7, 0.1, 0.9, 1.5].map((x, index) => (
        <mesh key={x} position={[x, Math.sin(index) * 0.18, 0.12]}>
          <sphereGeometry args={[0.16, 18, 18]} />
          <meshStandardMaterial color={VIOLET} roughness={0.45} />
        </mesh>
      ))}
      <Marker content={content} label="Stimulus Received" fallback="Electrical Impulse Travels Axon" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[-1.55, 0.35, 0.35]} color={VIOLET} text={labelsVisible ? 'message starts' : undefined} />
      <Marker content={content} label="Response Triggered" fallback="Signal Received by Next Neuron" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[1.55, 0.35, 0.35]} color={GOLD} text={labelsVisible ? 'response fires' : undefined} />
      <CauseLabel text={`stronger signal travels clearer; gap load ${Math.round(load * 100)}%`} />
    </group>
  )
}

function MuscleScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const contraction = 1 - signal * 0.22 + load * 0.08 + Math.sin(progress * Math.PI * 2) * 0.04
  return (
    <group>
      {[-0.42, -0.14, 0.14, 0.42].map((x) => (
        <mesh key={x} position={[x * contraction, 0, 0.15]} rotation={[0, 0, Math.PI / 2]} scale={[1.15 * contraction, 0.12, 0.12]}>
          <capsuleGeometry args={[0.16, 1.9, 8, 18]} />
          <meshStandardMaterial color={RED} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[1.45, -0.72 + load * 0.25, 0.2]}>
        <boxGeometry args={[0.55, 0.55, 0.35]} />
        <meshStandardMaterial color={BROWN} roughness={0.65} />
      </mesh>
      <Line points={[[0.75, -0.22, 0.23], [1.45, -0.72 + load * 0.25, 0.23]]} color={INK} lineWidth={3} transparent opacity={0.4} />
      <Marker content={content} label="Muscle shortens" fallback="Actin-myosin filament sliding" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[-1.1, 0.45, 0.38]} color={RED} text={labelsVisible ? 'fibers shorten' : undefined} />
      <CauseLabel text={`command ${Math.round(signal * 100)}% vs load ${Math.round(load * 100)}%`} />
    </group>
  )
}

function HormoneScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const path = (t: number) => [-1.25 + t * 2.5, 0.72 - t * 1.35, 0.2] as [number, number, number]
  return (
    <group>
      <mesh position={[-1.35, 0.88, 0.16]} scale={[0.42, 0.32, 0.18]}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshStandardMaterial color={GOLD} roughness={0.55} />
      </mesh>
      <mesh position={[1.25, -0.72, 0.16]} scale={[0.82 - load * 0.28, 0.42, 0.18]}>
        <sphereGeometry args={[0.6, 24, 18]} />
        <meshStandardMaterial color={GREEN} roughness={0.55} />
      </mesh>
      <Line points={Array.from({ length: 80 }, (_, i) => path(i / 79))} color={TEAL} lineWidth={5} transparent opacity={0.5} />
      <FlowBeads path={path} color={GOLD} progress={progress * (0.55 + signal)} count={7} />
      <Marker content={content} label="Gland releases hormone" fallback="Hormone travels in bloodstream" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[-1.35, 1.08, 0.32]} color={GOLD} text={labelsVisible ? 'hormone released' : undefined} />
      <Marker content={content} label="Target cell receptor binds hormone" fallback="Cell response triggered" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[1.25, -0.42, 0.32]} color={GREEN} text={labelsVisible ? 'receptor binds' : undefined} />
      <CauseLabel text={`more hormone signal, fewer receptors -> cells responding changes`} />
    </group>
  )
}

function ImmuneScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const germCount = Math.round(4 + load * 10)
  const defenderCount = Math.round(3 + signal * 10)
  const response = (0.25 + signal * 0.75) * (1 - load * 0.28)
  const antibodyCount = response > 0.55 ? Math.round(response * 6) : 0
  return (
    <group>
      {Array.from({ length: germCount }, (_, index) => {
        const a = index * 1.7
        const isCleared = index / germCount < response
        const pulse = isCleared ? Math.max(0.08, 1 - ((progress + index * 0.12) % 1) * 1.4) : 1
        return (
          <mesh key={`germ-${index}`} position={[Math.sin(a) * 1.15, Math.cos(a * 1.3) * 0.85, 0.14]} scale={[pulse, pulse, pulse]}>
            <icosahedronGeometry args={[0.12, 0]} />
            <meshStandardMaterial color={VIOLET} roughness={0.5} transparent opacity={isCleared ? pulse : 1} />
          </mesh>
        )
      })}
      {Array.from({ length: defenderCount }, (_, index) => {
        const a = progress * Math.PI * 2 + index * 0.65
        return (
          <mesh key={`def-${index}`} position={[Math.sin(a) * 1.35, Math.cos(a * 0.8) * 0.95, 0.2]}>
            <sphereGeometry args={[0.1, 14, 14]} />
            <meshStandardMaterial color={GREEN} emissive={GREEN} emissiveIntensity={0.16} roughness={0.55} />
          </mesh>
        )
      })}
      {Array.from({ length: antibodyCount }, (_, index) => (
        <mesh key={`ab-${index}`} position={[Math.sin(index * 2.15) * 0.42, Math.cos(index * 2.6) * 0.42, 0.3]}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={TEAL} emissive={TEAL} emissiveIntensity={0.35} />
        </mesh>
      ))}
      <Marker content={content} label="White blood cells respond" fallback="Pathogen detected" activeStageId={activeStageId} onSelectStage={onSelectStage} position={[1.15, 0.72, 0.4]} color={GREEN} text={labelsVisible ? 'defenders arrive' : undefined} />
      <CauseLabel text={`defenders ${defenderCount} vs germs ${germCount} -> ${Math.round(response * 100)}% cleared`} />
    </group>
  )
}

function TemperatureScene({ content, activeStageId, onSelectStage, signal, load, progress, labelsVisible }: SceneProps) {
  const isHot = signal > 0.6
  const isCold = signal < 0.35
  const sweat = isHot ? Math.round(4 + signal * 12) : 0
  const shiverOffset = isCold ? Math.sin(progress * Math.PI * 12) * 0.025 : 0
  const skinColor = isHot ? '#E98A6E' : isCold ? '#AEC7E0' : '#E5C5A8'
  return (
    <group>
      <mesh position={[shiverOffset, 0, 0.12]} scale={[0.92, 1.2, 0.12]}>
        <sphereGeometry args={[0.82, 32, 20]} />
        <meshStandardMaterial color={skinColor} roughness={0.72} transparent opacity={0.78} />
      </mesh>
      {isHot && Array.from({ length: sweat }, (_, index) => {
        const x = -1.1 + (index % 6) * 0.44
        const y = 0.85 - Math.floor(index / 6) * 0.45 - (progress % 0.3)
        return (
          <mesh key={`sweat-${index}`} position={[x, y, 0.34]}>
            <sphereGeometry args={[0.045, 10, 10]} />
            <meshStandardMaterial color={BLUE} transparent opacity={0.82 - load * 0.3} />
          </mesh>
        )
      })}
      {isCold && Array.from({ length: 6 }, (_, index) => {
        const angle = index * 1.05
        return (
          <mesh key={`shiver-${index}`} position={[Math.sin(angle) * 0.72 + shiverOffset, Math.cos(angle) * 0.85, 0.32]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#7C93B0" roughness={0.6} />
          </mesh>
        )
      })}
      <Marker
        content={content}
        label="Sweating & Vasodilation"
        fallback="Shivering & Vasoconstriction"
        activeStageId={activeStageId}
        onSelectStage={onSelectStage}
        position={[0.9, 0.78, 0.42]}
        color={isCold ? BLUE : RED}
        text={labelsVisible ? (isHot ? 'heat leaves skin' : isCold ? 'shivering warms body' : 'steady temperature') : undefined}
      />
      <CauseLabel
        text={
          isHot
            ? `heat stress ${Math.round(signal * 100)}% -> sweating cools skin`
            : isCold
              ? `cold stress -> shivering generates heat`
              : 'temperature steady, no sweat or shiver needed'
        }
      />
    </group>
  )
}

type SceneProps = {
  content: ComponentContent
  activeStageId: string | null
  onSelectStage: (id: string | null) => void
  signal: number
  load: number
  progress: number
  labelsVisible: boolean
  isolateActive: boolean
}

function CauseLabel({ text }: { text: string }) {
  return (
    <Billboard position={[0, 1.95, 0.25]}>
      <mesh>
        <planeGeometry args={[3.2, 0.34]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={0.82} />
      </mesh>
      <Text position={[0, 0, 0.01]} fontSize={0.12} color={INK} anchorX="center" anchorY="middle">
        {text}
      </Text>
    </Billboard>
  )
}
