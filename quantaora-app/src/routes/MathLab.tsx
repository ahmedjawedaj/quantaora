import { useEffect, useMemo, useState } from 'react'
import { CarTaxiFront, Droplets, PiggyBank, Sigma } from 'lucide-react'
import { scenarios, scenarioById } from '@/data/functions'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent, Hotspot } from '@/data/types'
import LinearGraph from '@/components/explorer/LinearGraph'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { cn } from '@/lib/utils'

const hierarchy = HIERARCHY.math
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'algebra')
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 0.86
const MAX_ZOOM = 1.16
const ZOOM_STEP = 0.06

function formatNum(n: number) {
  return Math.round(n * 100) / 100
}

function equation(slope: number, intercept: number) {
  return `y = ${formatNum(slope)}x ${intercept >= 0 ? '+' : '-'} ${Math.abs(formatNum(intercept))}`
}

function progressBetween(value: number, min: number, max: number) {
  if (max === min) return 0
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

function yRange(slope: number, intercept: number, xMax: number) {
  const values = [0, intercept, slope * xMax + intercept]
  return { min: Math.min(...values), max: Math.max(...values) || 1 }
}

function scenarioKind(id: string): 'savings' | 'taxi' | 'tank' {
  if (id === 'taxi-fare') return 'taxi'
  if (id === 'tank-draining') return 'tank'
  return 'savings'
}

const SCENARIO_ICONS: Record<string, typeof PiggyBank> = {
  savings: PiggyBank,
  taxi: CarTaxiFront,
  tank: Droplets,
}

/** Real authored `content/subjects/math/algebra/*` components this scenario genuinely teaches — not every id fits every scenario, so this only lists true matches. */
const RELATED_ALGEBRA_IDS: Record<string, string[]> = {
  'steady-savings': ['intercept', 'slope', 'variable', 'equation'],
  'taxi-fare': ['coefficient', 'constant', 'slope', 'intercept', 'equation'],
  'tank-draining': ['slope', 'intercept', 'inequality', 'equation'],
}

const CONTROL_LABELS: Record<string, { rate: string; start: string; test: string }> = {
  'steady-savings': { rate: 'Weekly deposit ($/wk)', start: 'Starting coins ($)', test: 'Weeks passed' },
  'taxi-fare': { rate: 'Price per mile ($/mi)', start: 'Flat fare ($)', test: 'Miles driven' },
  'tank-draining': { rate: 'Drain rate (L/min)', start: 'Starting volume (L)', test: 'Minutes passed' },
}

function Meter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-3 py-2 shadow-[var(--shadow-tactile)]">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-medium text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

function AlgebraObject({
  kind,
  x,
  y,
  slope,
  intercept,
  xMax,
  yMax,
  yUnit,
  labelsVisible,
  xrayActive,
  autoRotate,
  guessActive,
  guessY,
  guessRevealed,
}: {
  kind: 'savings' | 'taxi' | 'tank'
  x: number
  y: number
  slope: number
  intercept: number
  xMax: number
  yMax: number
  yUnit: string
  labelsVisible: boolean
  xrayActive: boolean
  autoRotate: boolean
  guessActive: boolean
  guessY: number
  guessRevealed: boolean
}) {
  const fill = progressBetween(y, 0, Math.max(yMax, 1))
  const travel = progressBetween(x, 0, xMax)
  const direction = slope >= 0 ? 'increasing' : 'decreasing'
  const guessTop = Math.max(6, Math.min(92, (1 - progressBetween(guessY, 0, Math.max(yMax, 1))) * 100))
  const actualTop = Math.max(6, Math.min(92, (1 - fill) * 100))

  return (
    <div
      className={cn(
        'relative mx-auto flex aspect-[4/3] w-full max-w-[38rem] items-center justify-center overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[radial-gradient(circle_at_50%_28%,#fff_0%,#f7f4ee_55%,#ece7dd_100%)] shadow-[var(--shadow-tactile-lg)]',
        autoRotate && 'animate-[pulse_5s_ease-in-out_infinite]',
      )}
      style={{ perspective: '900px' }}
    >
      <div className="absolute inset-x-8 bottom-10 h-7 rounded-full bg-black/10 blur-md" />

      {kind === 'savings' && (
        <div className="relative h-44 w-64" style={{ transform: 'rotateX(12deg) rotateY(-18deg)' }}>
          <div className="absolute bottom-2 left-7 h-32 w-48 rounded-[42%_48%_44%_46%] border border-[#7d4a63]/30 bg-[#ce6d8d] shadow-2xl">
            <div className="absolute left-14 top-5 h-3 w-20 rounded-full bg-[#5f364c]" />
            <div className="absolute right-8 top-9 h-5 w-5 rounded-full bg-[#412336]" />
            <div className="absolute -left-2 top-14 h-10 w-7 rounded-full bg-[#c35f82]" />
          </div>
          {Array.from({ length: Math.min(16, Math.max(3, Math.round(fill * 16))) }, (_, index) => (
            <div
              key={index}
              className="absolute h-4 w-10 rounded-full border border-[#9c7a21] bg-[#e6c653] shadow"
              style={{ left: 28 + (index % 8) * 20, bottom: 120 + Math.floor(index / 8) * 13 }}
            />
          ))}
        </div>
      )}

      {kind === 'taxi' && (
        <div className="relative h-44 w-72">
          <div className="absolute bottom-8 left-5 h-2 w-64 rounded-full bg-[color:var(--color-ink-300)]" />
          <div
            className="absolute bottom-12 h-24 w-40 rounded-[18px] border border-[#9c7816]/40 bg-[#e7bf35] shadow-2xl transition-all duration-500"
            style={{ left: `${8 + travel * 40}%`, transform: 'translateX(-50%) rotateX(8deg)' }}
          >
            <div className="absolute -top-5 left-12 rounded-sm bg-[#2f2933] px-3 py-1 text-[10px] font-bold text-white">TAXI</div>
            <div className="absolute left-8 top-5 h-9 w-28 rounded-t-[20px] bg-[#fff7d0]" />
            <div className="absolute bottom-[-10px] left-7 h-9 w-9 rounded-full border-[7px] border-[#2f2933] bg-[#d9d2c6]" />
            <div className="absolute bottom-[-10px] right-7 h-9 w-9 rounded-full border-[7px] border-[#2f2933] bg-[#d9d2c6]" />
          </div>
        </div>
      )}

      {kind === 'tank' && (
        <div className="relative h-56 w-44" style={{ transform: 'rotateX(8deg) rotateY(16deg)' }}>
          <div className="absolute inset-x-5 bottom-0 h-52 rounded-b-[30px] rounded-t-[18px] border border-[#6d8795]/45 bg-white/45 shadow-2xl">
            <div className="absolute bottom-0 left-0 right-0 rounded-b-[30px] bg-[#5bb7d8] transition-all duration-500" style={{ height: `${Math.max(8, fill * 100)}%`, opacity: xrayActive ? 0.5 : 0.86 }} />
            <div className="absolute inset-0 rounded-b-[30px] rounded-t-[18px] border border-white/70" />
          </div>
          <div className="absolute -right-6 bottom-7 h-4 w-16 rounded-full bg-[#6d8795]" />
          <div className="absolute -right-10 bottom-3 h-8 w-3 rounded-full bg-[#5bb7d8]" style={{ opacity: slope < 0 ? 0.8 : 0.2 }} />
        </div>
      )}

      {kind === 'savings' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rotate-[-3deg] rounded-md border border-[#9c7a21]/50 bg-[#fdf7e6] px-3 py-1 text-center shadow">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#9c7a21]">Coin slot total</p>
          <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#7d5a12]">{yUnit}{formatNum(y)}</p>
        </div>
      )}

      {kind === 'taxi' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-black/60 bg-[#161616] px-3 py-1 text-center shadow-lg">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#5fbf6a]/80">Meter</p>
          <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#5fbf6a]">{yUnit}{formatNum(y)}</p>
        </div>
      )}

      {kind === 'tank' && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md border border-[#4a6f7f]/50 bg-white/85 px-3 py-1 text-center shadow">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#4a6f7f]">Gauge</p>
          <p className="font-[family-name:var(--font-mono)] text-sm font-bold text-[#2f5666]">{formatNum(y)}{yUnit}</p>
        </div>
      )}

      {guessActive && (
        <div
          className="pointer-events-none absolute inset-x-6 z-10 flex items-center gap-2 transition-[top] duration-300"
          style={{ top: `${guessTop}%` }}
        >
          <span className="h-0 flex-1 border-t-2 border-dashed border-[color:var(--color-brand-strong)]" />
          <span className="shrink-0 rounded-full bg-[color:var(--color-brand-strong)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            Your guess
          </span>
        </div>
      )}
      {guessActive && guessRevealed && (
        <div
          className="pointer-events-none absolute inset-x-6 z-10 flex items-center gap-2 transition-[top] duration-300"
          style={{ top: `${actualTop}%` }}
        >
          <span className="h-0 flex-1 border-t-2 border-[color:var(--color-math-deep)]" />
          <span className="shrink-0 rounded-full bg-[color:var(--color-math-deep)] px-2 py-0.5 text-[10px] font-semibold text-white shadow">
            Actual
          </span>
        </div>
      )}

      <div className="absolute left-4 top-9 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] sm:top-4">
        {direction} line
      </div>
      {(labelsVisible || xrayActive) && (
        <div className="absolute right-4 top-9 max-w-44 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-3 text-xs text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] sm:top-4">
          <span className="font-semibold text-[color:var(--color-foreground)]">Starting value:</span> {formatNum(intercept)}
          <br />
          <span className="font-semibold text-[color:var(--color-foreground)]">Rate:</span> {formatNum(slope)} per step
        </div>
      )}
    </div>
  )
}

export default function MathLab() {
  const [scenarioId, setScenarioId] = useState(scenarios[0].id)
  const base = scenarioById[scenarioId]
  const [slope, setSlope] = useState(base.slope)
  const [intercept, setIntercept] = useState(base.intercept)
  const [focusX, setFocusX] = useState(Math.round(base.xMax * 0.45))
  const [showXIntercept, setShowXIntercept] = useState(false)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(true)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [predictActive, setPredictActive] = useState(false)
  const [predictGuess, setPredictGuess] = useState(0)
  const [predictChecked, setPredictChecked] = useState(false)
  const compareTarget = base.compareCandidate ? resolveContent(base.compareCandidate) : null
  const currentY = formatNum(slope * focusX + intercept)
  const range = yRange(slope, intercept, base.xMax)
  const objectYMax = Math.max(range.max, base.intercept, 1)
  const kind = scenarioKind(scenarioId)
  const controlLabels = CONTROL_LABELS[scenarioId] ?? CONTROL_LABELS['steady-savings']
  const guessTolerance = Math.max(1, objectYMax * 0.08)
  const guessCorrect = Math.abs(predictGuess - currentY) <= guessTolerance

  useEffect(() => {
    if (!animationPlaying || cleanView) return undefined
    const id = window.setInterval(() => {
      setFocusX((value) => {
        const next = value + base.xMax / 40
        return next > base.xMax ? base.xMin : Number(next.toFixed(2))
      })
    }, 260)
    return () => window.clearInterval(id)
  }, [animationPlaying, base.xMax, base.xMin, cleanView])

  const selectScenario = (id: string) => {
    const s = scenarioById[id]
    setScenarioId(id)
    setSlope(s.slope)
    setIntercept(s.intercept)
    setFocusX(Math.round(s.xMax * 0.45))
    setShowXIntercept(false)
    setActiveHotspotId(null)
    setAnimationPlaying(true)
    setZoom(DEFAULT_ZOOM)
    setXrayActive(false)
    setControlsOpen(false)
    setPredictActive(false)
    setPredictChecked(false)
  }

  const tableRows = useMemo(() => {
    const step = (base.xMax - base.xMin) / 5
    return Array.from({ length: 6 }, (_, i) => {
      const x = base.xMin + step * i
      return { x: formatNum(x), y: formatNum(slope * x + intercept) }
    })
  }, [base, slope, intercept])

  const hotspots: Hotspot[] = useMemo(() => [
    {
      id: 'starting-value',
      label: 'Starting value',
      position: [-0.65, 0.2, 0],
      color: 'var(--color-math-deep)',
      description: `The y-intercept is ${formatNum(intercept)} ${base.yUnit}. It is the value when ${base.xLabel.toLowerCase()} is 0.`,
      function: 'Sets where the line begins before any change happens.',
    },
    {
      id: 'rate',
      label: 'Rate',
      position: [0, 0.3, 0],
      color: 'var(--color-math-accent)',
      description: `The slope is ${formatNum(slope)} ${base.yUnit}/${base.xUnit}.`,
      function: 'Controls how fast the object changes for each step on x.',
    },
    {
      id: 'current-value',
      label: 'Current value',
      position: [0.65, 0.2, 0],
      color: 'var(--color-brand-strong)',
      description: `At ${formatNum(focusX)} ${base.xUnit}, y is ${currentY} ${base.yUnit}.`,
      function: 'Connects the equation, graph, table, and object state.',
    },
  ], [base.xLabel, base.xUnit, base.yUnit, currentY, focusX, intercept, slope])
  const activeHotspot = hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null
  const isolateActive = activeHotspotId !== null

  const relatedConcepts = (RELATED_ALGEBRA_IDS[scenarioId] ?? [])
    .map((id) => resolveContent(id)?.name)
    .filter((name): name is string => Boolean(name))

  const algebraMissions = [
    { concept: 'Variable', prompt: `Change ${base.xLabel.toLowerCase()} and observe x=${formatNum(focusX)} become y=${currentY}. Explain what the letter stands for.` },
    { concept: 'Expression', prompt: `Read ${equation(slope, intercept)} as an expression: change x and observe the value change.` },
    { concept: 'Equation', prompt: `Change the rate or starting value, then explain how the equation changes with the object.` },
    { concept: 'Slope', prompt: `Change ${controlLabels.rate.toLowerCase()} and observe the line become ${slope >= 0 ? 'steeper upward' : 'steeper downward'}.` },
    { concept: 'Intercept', prompt: `Change ${controlLabels.start.toLowerCase()} and observe where the line begins when x is 0.` },
    ...(RELATED_ALGEBRA_IDS[scenarioId]?.some((id) => id === 'coefficient' || id === 'constant')
      ? [{ concept: 'Like terms / constant / coefficient', prompt: 'Compare the fixed starting value with the changing rate. Explain which part stays constant and which part multiplies each step.' }]
      : []),
  ]

  const content: ComponentContent = {
    ...base,
    scientificName: equation(slope, intercept),
    summary: `${base.summary} The object, equation, graph, and table are linked: change one and the rest update immediately.`,
    hotspots,
    keyFacts: [
      { label: 'Equation', value: equation(slope, intercept) },
      { label: 'Current x', value: `${formatNum(focusX)} ${base.xUnit}` },
      { label: 'Current y', value: `${currentY} ${base.yUnit}` },
      { label: 'Slope (rate)', value: `${formatNum(slope)} ${base.yUnit}/${base.xUnit}` },
      { label: 'Y-intercept', value: `${formatNum(intercept)} ${base.yUnit}` },
      { label: 'Direction', value: slope >= 0 ? 'Increasing' : 'Decreasing' },
      ...(relatedConcepts.length ? [{ label: 'Also builds', value: relatedConcepts.join(', ') }] : []),
    ],
  }

  const resetScenario = () => {
    setSlope(base.slope)
    setIntercept(base.intercept)
    setFocusX(Math.round(base.xMax * 0.45))
    setShowXIntercept(false)
    setActiveHotspotId(null)
    setAutoRotate(true)
    setAnimationPlaying(true)
    setLabelsVisible(false)
    setXrayActive(false)
    setCleanView(false)
    setControlsOpen(false)
    setZoom(DEFAULT_ZOOM)
    setPredictActive(false)
    setPredictChecked(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Math"
            subjectColor="var(--color-math-deep)"
            defaultIcon={Sigma}
            branchName="Algebra"
            items={scenarios.map((s) => ({ id: s.id, name: s.name, meta: s.slope > 0 ? 'Increasing' : 'Decreasing' }))}
            activeItemId={scenarioId}
            onSelect={selectScenario}
            otherBranches={otherBranches}
            footerNote="Concrete algebra studio: every equation is attached to a visible object, not only a line."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[66svh] shrink-0 overflow-hidden lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setActiveHotspotId((id) => (id ? null : hotspots[0].id))}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setZoom((value) => Math.min(MAX_ZOOM, Number((value + ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setZoom((value) => Math.max(MIN_ZOOM, Number((value - ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={zoom >= MAX_ZOOM}
            zoomOutDisabled={zoom <= MIN_ZOOM}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((v) => !v)}
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((v) => !v)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => setZoom(DEFAULT_ZOOM)}
            onReset={resetScenario}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              {base.name} · {equation(slope, intercept)} · x={formatNum(focusX)}
            </div>
          </div>

          <div className="flex h-full flex-col gap-3 px-3 pb-32 pt-20 sm:pl-24 sm:pr-4 sm:pt-4 lg:pb-36 xl:grid xl:grid-cols-[minmax(20rem,1fr)_minmax(18rem,0.82fr)] xl:items-center">
            <div className="min-h-0" style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}>
              <AlgebraObject
                kind={kind}
                x={focusX}
                y={currentY}
                slope={slope}
                intercept={intercept}
                xMax={base.xMax}
                yMax={objectYMax}
                yUnit={base.yUnit}
                labelsVisible={labelsVisible}
                xrayActive={xrayActive}
                autoRotate={autoRotate}
                guessActive={predictActive}
                guessY={predictGuess}
                guessRevealed={predictChecked}
              />
            </div>

            <div className="hidden min-h-0 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 p-3 shadow-[var(--shadow-tactile)] backdrop-blur-sm md:block">
              <LinearGraph
                slope={slope}
                intercept={intercept}
                xMin={base.xMin}
                xMax={base.xMax}
                xLabel={`${base.xLabel} (${base.xUnit})`}
                yLabel={`${base.yLabel} (${base.yUnit})`}
                onChange={(s, i) => {
                  setSlope(s)
                  setIntercept(i)
                }}
                showXIntercept={showXIntercept}
              />
            </div>
          </div>

          <div
            data-canvas-overlay
            className={cn(
              'absolute z-10',
              controlsOpen
                ? 'bottom-3 left-3 right-3 sm:left-24 sm:right-4'
                : 'right-3 top-32 sm:bottom-3 sm:left-24 sm:right-4 sm:top-auto',
            )}
          >
            {!controlsOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="hidden max-w-[26rem] flex-1 grid-cols-3 gap-2 sm:grid">
                  <Meter label="Equation" value={equation(slope, intercept)} />
                  <Meter label={base.xLabel} value={`${formatNum(focusX)} ${base.xUnit}`} />
                  <Meter label={base.yLabel} value={`${currentY} ${base.yUnit}`} />
                </div>
                <button
                  type="button"
                  onClick={() => setControlsOpen(true)}
                  className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)]"
                >
                  <span className="md:hidden">Graph &amp; tune algebra</span>
                  <span className="hidden md:inline">Tune algebra</span>
                </button>
              </div>
            ) : (
              <div className="grid max-h-[min(56svh,30rem)] gap-2 overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3 shadow-[var(--shadow-tactile-lg)] sm:max-h-[min(70svh,34rem)] xl:grid-cols-[auto_1fr]">
                <div className="grid grid-cols-3 gap-2 xl:w-[19rem]">
                  <Meter label="Equation" value={equation(slope, intercept)} />
                  <Meter label={base.xLabel} value={`${formatNum(focusX)} ${base.xUnit}`} />
                  <Meter label={base.yLabel} value={`${currentY} ${base.yUnit}`} />
                </div>

                {/* Mobile-only line graph: at md+ the same graph already renders
                    inside the stage, so this stays scoped to the "Tune algebra"
                    panel below md, where the object stage has no room for a
                    dedicated graph pane. Reached via the same toggle instead of
                    a squeezed, easy-to-miss scroll region. */}
                <div data-mobile-graph className="grid gap-2 md:hidden xl:w-[19rem]">
                  <Meter label="Slope" value={`${formatNum(slope)} ${base.yUnit}/${base.xUnit}`} />
                  <div className="h-40 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
                    <LinearGraph
                      slope={slope}
                      intercept={intercept}
                      xMin={base.xMin}
                      xMax={base.xMax}
                      xLabel={`${base.xLabel} (${base.xUnit})`}
                      yLabel={`${base.yLabel} (${base.yUnit})`}
                      onChange={(s, i) => {
                        setSlope(s)
                        setIntercept(i)
                      }}
                      showXIntercept={showXIntercept}
                    />
                  </div>
                </div>

                <div className="grid gap-2 lg:grid-cols-3">
                  <div data-algebra-mission className="grid gap-2 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 lg:col-span-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-math-deep)]">Algebra missions</span>
                    {algebraMissions.map((mission) => (
                      <div key={mission.concept} data-algebra-challenge className="grid gap-0.5 text-[11px]">
                        <span className="font-semibold text-[color:var(--color-foreground)]">{mission.concept}: predict, change, observe, explain</span>
                        <span className="text-[color:var(--color-ink-500)]">{mission.prompt}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between lg:col-span-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Variable controls</span>
                    <button
                      type="button"
                      onClick={() => setControlsOpen(false)}
                      className="text-xs font-semibold text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]"
                    >
                      Hide
                    </button>
                  </div>
                  <label className="grid gap-1 text-xs font-medium text-[color:var(--color-ink-500)]">
                    {controlLabels.rate}
                    <input
                      type="range"
                      min={base.slope < 0 ? -10 : 0}
                      max={base.slope < 0 ? 0 : 12}
                      step={base.slope % 1 === 0 ? 1 : 0.5}
                      value={slope}
                      onChange={(event) => setSlope(Number(event.target.value))}
                      className="accent-[color:var(--color-math-deep)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[color:var(--color-ink-500)]">
                    {controlLabels.start}
                    <input
                      type="range"
                      min={0}
                      max={Math.max(base.intercept * 1.5, 12)}
                      step={base.intercept % 1 === 0 ? 1 : 0.5}
                      value={intercept}
                      onChange={(event) => setIntercept(Number(event.target.value))}
                      className="accent-[color:var(--color-math-deep)]"
                    />
                  </label>
                  <label className="grid gap-1 text-xs font-medium text-[color:var(--color-ink-500)]">
                    {controlLabels.test}
                    <input
                      type="range"
                      min={base.xMin}
                      max={base.xMax}
                      step={0.5}
                      value={focusX}
                      onChange={(event) => setFocusX(Number(event.target.value))}
                      className="accent-[color:var(--color-math-deep)]"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowXIntercept((v) => !v)}
                    className={cn(
                      'h-9 rounded-[var(--radius-sm)] border px-3 text-xs font-semibold transition-colors lg:col-span-1',
                      showXIntercept
                        ? 'border-transparent bg-[color:var(--color-math-deep)] text-white'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)]',
                    )}
                  >
                    x-intercept
                  </button>
                  <div className="hidden gap-1 overflow-x-auto text-center text-[11px] md:grid md:grid-cols-6 lg:col-span-2">
                    {tableRows.map((row) => (
                      <div key={row.x} className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1">
                        <div className="text-[color:var(--color-ink-500)]">x={row.x}</div>
                        <div className="font-medium text-[color:var(--color-foreground)]">y={row.y}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-1.5 rounded-[var(--radius-sm)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 lg:col-span-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-[color:var(--color-foreground)]">
                        Predict {base.yLabel.toLowerCase()} at x = {formatNum(focusX)} {base.xUnit}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPredictActive((v) => {
                            const next = !v
                            if (next) {
                              setPredictGuess(Math.round(objectYMax / 2))
                              setPredictChecked(false)
                              setAnimationPlaying(false)
                            }
                            return next
                          })
                        }}
                        className={cn(
                          'h-7 shrink-0 rounded-full border px-3 text-[11px] font-semibold transition-colors',
                          predictActive
                            ? 'border-transparent bg-[color:var(--color-math-deep)] text-white'
                            : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)]',
                        )}
                      >
                        {predictActive ? 'Predicting' : 'Predict it'}
                      </button>
                    </div>

                    {predictActive && (
                      <>
                        <input
                          type="range"
                          min={0}
                          max={Math.max(objectYMax * 1.15, 1)}
                          step={objectYMax > 40 ? 1 : 0.5}
                          value={predictGuess}
                          onChange={(event) => setPredictGuess(Number(event.target.value))}
                          className="accent-[color:var(--color-brand-strong)]"
                        />
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-[color:var(--color-ink-500)]">
                            Your guess: <span className="font-semibold text-[color:var(--color-foreground)]">{formatNum(predictGuess)} {base.yUnit}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setPredictChecked(true)}
                            className="h-7 rounded-full bg-[color:var(--color-brand-strong)] px-3 text-[11px] font-semibold text-white"
                          >
                            Check
                          </button>
                        </div>
                        {predictChecked && (
                          <p className={cn('text-[11px] font-medium', guessCorrect ? 'text-emerald-600' : 'text-amber-600')}>
                            {guessCorrect ? 'Close enough — nice read of the line. ' : 'Not quite — '}
                            Actual: {equation(slope, intercept)} gives y={currentY} {base.yUnit} at x={formatNum(focusX)}.
                            {!guessCorrect && ` Try changing rate or start, then predict again.`}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Scenario switcher for mobile/tablet, where the ContentNav list in
              the left aside is hidden (lg:block only). Picking a chip drives
              the same selectScenario() path as the desktop list. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Scenario {scenarios.findIndex((s) => s.id === scenarioId) + 1} of {scenarios.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {scenarios.map((s) => {
                const active = s.id === scenarioId
                const Icon = SCENARIO_ICONS[scenarioKind(s.id)]
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectScenario(s.id)}
                    title={s.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-math-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-math-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-math-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[9rem] truncate">{s.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DetailPanel
            content={content}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={content} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={content} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
