import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Orbit,
  Sun as SunIcon,
  Moon as MoonIcon,
  CircleDot,
  Waves,
  Eye,
  HelpCircle,
  ArrowLeftRight,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Rocket,
  type LucideIcon,
} from 'lucide-react'
import { earthInSpace, earthInSpaceById, type EarthSpaceMode } from '@/data/earthInSpace'
import { moons, moonById, EARTH_SURFACE_GRAVITY_MS2 } from '@/data/moons'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import {
  EARTH_AXIAL_TILT_DEG,
  MOON_ORBIT_TILT_DEG,
  subsolarLatitudeDeg,
  seasonLabels,
  daylightHours,
  moonPhase,
  tideState,
  eclipseOutcome,
} from '@/lib/earthInSpacePhysics'
import EarthSpaceViewer, { NOT_TO_SCALE_NOTE } from '@/components/explorer/EarthSpaceViewer'
import { framedCameraDistance } from '@/lib/earthSpaceCamera'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { Button } from '@/components/ui/Button'

const hierarchy = HIERARCHY.space
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'earth-in-space')

const NAV_ICON: Record<string, LucideIcon> = {
  'rotation-and-revolution': Orbit,
  'axial-tilt-and-seasons': SunIcon,
  'moon-phases': MoonIcon,
  eclipses: CircleDot,
  tides: Waves,
}

// Picked so the widest scene (Motion/Seasons' 5.2-radius orbit ring, plus Earth's own ~0.85
// radius riding on it) comfortably fits inside the frustum at every orbit angle — at the
// previous 9.5 default, Earth itself (not just the thin ring line) poked outside the visible
// frame for large stretches of the orbit even though the ring appeared fully framed.
const DEFAULT_CAMERA_DISTANCE = 16
const MIN_CAMERA_DISTANCE = 4
const MAX_CAMERA_DISTANCE = 24
const ZOOM_STEP = 1.4

const DEFAULT_ROTATION_SPEED = 1
const DEFAULT_REVOLUTION_SPEED = 1
const DEFAULT_ORBIT_ANGLE = 0
const DEFAULT_MOON_ANGLE = 90
const DEFAULT_ALIGNMENT_OFFSET = 0
const DEFAULT_TIDE_SPIN_SPEED = 1.5

/** Auto-advance rates used only while the toolbar Play button is on, for modes whose primary
 *  angle isn't already animated inside the canvas (seasons/phases/tides — see EarthSpaceViewer's
 *  own comment on why 'motion' animates internally instead). Picked purely so a full cycle is
 *  comfortably watchable, not to any real ratio. */
const SEASONS_ADVANCE_DEG_PER_SEC = 15
const PHASES_ADVANCE_DEG_PER_SEC = 12
const BASE_TIDE_DEG_PER_SEC = 40

const SEASON_PRESETS = [
  { label: 'Mar Equinox', angle: 0 },
  { label: 'Jun Solstice', angle: 90 },
  { label: 'Sep Equinox', angle: 180 },
  { label: 'Dec Solstice', angle: 270 },
]

const PHASE_BUCKETS = [
  { label: 'New', angle: 0 },
  { label: 'Waxing Crescent', angle: 45 },
  { label: 'First Quarter', angle: 90 },
  { label: 'Waxing Gibbous', angle: 135 },
  { label: 'Full', angle: 180 },
  { label: 'Waning Gibbous', angle: 225 },
  { label: 'Last Quarter', angle: 270 },
  { label: 'Waning Crescent', angle: 315 },
]

const SPEED_EXPERIMENTS = [
  {
    label: 'Spin only',
    rotationSpeed: 1,
    revolutionSpeed: 0,
    outcome: 'Days still pass because Earth is rotating, but the year is frozen because Earth is not moving around the Sun.',
  },
  {
    label: 'Orbit only',
    rotationSpeed: 0,
    revolutionSpeed: 1,
    outcome: 'Earth still travels around the Sun, but the surface marker stops making day and night because Earth is not spinning.',
  },
  {
    label: 'Fast days',
    rotationSpeed: 4,
    revolutionSpeed: 1,
    outcome: 'Day and night speed up, while the yearly path around the Sun stays steady.',
  },
  {
    label: 'Fast year',
    rotationSpeed: 1,
    revolutionSpeed: 4,
    outcome: 'Earth races around the Sun, but one spin still has its own separate speed.',
  },
] as const

const DEFAULT_MOON_COMPARE_ID = 'moon'
const DEFAULT_MOON_COMPARE_WEIGHT_KG = 40

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

/** Every compareCandidate in earthInSpace.ts points at another component in this same branch, so
 *  the local map always resolves it — same reasoning MoonsLab.tsx's resolveMoonCompare uses. */
function resolveEarthSpaceCompare(id: string) {
  if (!id) return null
  return earthInSpaceById[id] ?? resolveContent(id)
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{children}</p>
}

function MissionStep({ icon: Icon, label, body, action }: { icon: LucideIcon; label: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" strokeWidth={1.75} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{body}</p>
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  )
}

function DaylightBar({ label, hours }: { label: string; hours: number }) {
  const pct = clamp((hours / 24) * 100, 0, 100)
  return (
    <div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-[color:var(--color-ink-700)]">{label}</span>
        <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-ink-500)]">{hours.toFixed(1)}h daylight</span>
      </div>
      <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface)]">
        <div className="h-full rounded-full bg-[color:var(--color-space-deep)] transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function EarthInSpaceLab() {
  const [componentId, setComponentId] = useState(earthInSpace[0].id)
  const [autoRotate, setAutoRotate] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)

  // The default camera distance that keeps Earth's orbit fully framed depends on the stage's
  // actual pixel aspect ratio (see framedCameraDistance's comment) — near-square mobile stages
  // need more distance than wide desktop ones for the same 'motion'/'seasons' orbit. Measured via
  // ResizeObserver rather than a CSS breakpoint so it tracks the real canvas box, not the viewport.
  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageAspect, setStageAspect] = useState<number | null>(null)
  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) setStageAspect(width / height)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const defaultDistanceFor = (m: EarthSpaceMode) =>
    stageAspect == null ? DEFAULT_CAMERA_DISTANCE : framedCameraDistance(DEFAULT_CAMERA_DISTANCE, m, stageAspect, MAX_CAMERA_DISTANCE)

  // Correct the initial mount's camera distance for the stage's real aspect once it's known
  // (ResizeObserver's first callback fires before paint, so this doesn't visibly flash).
  const appliedInitialFraming = useRef(false)
  useEffect(() => {
    if (stageAspect == null || appliedInitialFraming.current) return
    appliedInitialFraming.current = true
    setCameraDistance(framedCameraDistance(DEFAULT_CAMERA_DISTANCE, earthInSpaceById[componentId].mode, stageAspect, MAX_CAMERA_DISTANCE))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageAspect])
  const [labelsVisible, setLabelsVisible] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(true)

  // motion mode
  const [rotationSpeed, setRotationSpeed] = useState(DEFAULT_ROTATION_SPEED)
  const [revolutionSpeed, setRevolutionSpeed] = useState(DEFAULT_REVOLUTION_SPEED)
  // seasons mode
  const [tiltDeg, setTiltDeg] = useState(EARTH_AXIAL_TILT_DEG)
  const [orbitAngleDeg, setOrbitAngleDeg] = useState(DEFAULT_ORBIT_ANGLE)
  // phases mode
  const [moonAngleDeg, setMoonAngleDeg] = useState(DEFAULT_MOON_ANGLE)
  const [moonCompareId, setMoonCompareId] = useState(DEFAULT_MOON_COMPARE_ID)
  const [moonCompareWeightKg, setMoonCompareWeightKg] = useState(DEFAULT_MOON_COMPARE_WEIGHT_KG)
  // eclipses mode
  const [eclipseType, setEclipseType] = useState<'solar' | 'lunar'>('solar')
  const [alignmentOffsetDeg, setAlignmentOffsetDeg] = useState(DEFAULT_ALIGNMENT_OFFSET)
  const [useRealisticTilt, setUseRealisticTilt] = useState(true)
  // tides mode
  const [tideSpinAngleDeg, setTideSpinAngleDeg] = useState(0)
  const [tideSpinSpeed, setTideSpinSpeed] = useState(DEFAULT_TIDE_SPIN_SPEED)
  const [springTide, setSpringTide] = useState(false)

  const content = earthInSpaceById[componentId]
  const mode = content.mode
  const compareTarget = resolveEarthSpaceCompare(content.compareCandidate)

  // Auto-advance for modes whose primary angle isn't already animated inside the canvas.
  // 'motion' animates its own rotation/revolution via useFrame in EarthSpaceViewer; 'eclipses'
  // is a manual alignment explorer with nothing to auto-cycle.
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  useEffect(() => {
    if (!playing || mode === 'motion' || mode === 'eclipses') {
      lastTsRef.current = null
      return
    }
    const tick = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      if (mode === 'seasons') setOrbitAngleDeg((a) => (a + dt * SEASONS_ADVANCE_DEG_PER_SEC) % 360)
      if (mode === 'phases') setMoonAngleDeg((a) => (a + dt * PHASES_ADVANCE_DEG_PER_SEC) % 360)
      if (mode === 'tides') setTideSpinAngleDeg((a) => (a + dt * BASE_TIDE_DEG_PER_SEC * tideSpinSpeed) % 360)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      lastTsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, mode, tideSpinSpeed])

  const selectComponent = (id: string) => {
    setComponentId(id)
    setCameraDistance(defaultDistanceFor(earthInSpaceById[id].mode))
    setResetSignal((s) => s + 1)
    setPlaying(true)
  }

  const resetAll = () => {
    setAutoRotate(false)
    setFocusMode(false)
    setCameraDistance(defaultDistanceFor(mode))
    setLabelsVisible(true)
    setCleanView(false)
    setPlaying(true)
    setRotationSpeed(DEFAULT_ROTATION_SPEED)
    setRevolutionSpeed(DEFAULT_REVOLUTION_SPEED)
    setTiltDeg(EARTH_AXIAL_TILT_DEG)
    setOrbitAngleDeg(DEFAULT_ORBIT_ANGLE)
    setMoonAngleDeg(DEFAULT_MOON_ANGLE)
    setMoonCompareId(DEFAULT_MOON_COMPARE_ID)
    setMoonCompareWeightKg(DEFAULT_MOON_COMPARE_WEIGHT_KG)
    setEclipseType('solar')
    setAlignmentOffsetDeg(DEFAULT_ALIGNMENT_OFFSET)
    setUseRealisticTilt(true)
    setTideSpinAngleDeg(0)
    setTideSpinSpeed(DEFAULT_TIDE_SPIN_SPEED)
    setSpringTide(false)
    setResetSignal((s) => s + 1)
  }

  // ── derived readouts (plain functions from earthInSpacePhysics.ts — the canvas only renders
  //    the geometry these describe, it never computes them independently) ──
  const subsolarLat = useMemo(() => subsolarLatitudeDeg(orbitAngleDeg, tiltDeg), [orbitAngleDeg, tiltDeg])
  const seasons = useMemo(() => seasonLabels(orbitAngleDeg), [orbitAngleDeg])
  const northDaylight = useMemo(() => daylightHours(45, subsolarLat), [subsolarLat])
  const southDaylight = useMemo(() => daylightHours(-45, subsolarLat), [subsolarLat])

  const phase = useMemo(() => moonPhase(moonAngleDeg), [moonAngleDeg])
  const comparedMoon = moonById[moonCompareId] ?? moonById[DEFAULT_MOON_COMPARE_ID]
  const earthMoon = moonById[DEFAULT_MOON_COMPARE_ID]
  const moonOrbitDistanceRatio = comparedMoon.orbitDistanceKm / earthMoon.orbitDistanceKm
  const moonOrbitPeriodRatio = comparedMoon.orbitPeriodDays / earthMoon.orbitPeriodDays
  const moonSurfaceGravityRatio = comparedMoon.surfaceGravityMs2 / EARTH_SURFACE_GRAVITY_MS2
  const moonWeightHereKg = Math.round(moonCompareWeightKg * moonSurfaceGravityRatio * 10) / 10
  const moonOrbitOutcome =
    comparedMoon.id === earthMoon.id
      ? 'Earth reference: one Moon orbit takes 27.3 days.'
      : moonOrbitPeriodRatio < 1
        ? `${comparedMoon.name} orbits faster than Earth's Moon because it completes a lap in fewer days.`
        : `${comparedMoon.name} orbits more slowly than Earth's Moon because one lap takes more days.`

  const eclipse = useMemo(() => eclipseOutcome(alignmentOffsetDeg, useRealisticTilt), [alignmentOffsetDeg, useRealisticTilt])

  const tide = useMemo(() => tideState(tideSpinAngleDeg), [tideSpinAngleDeg])

  const captionDetail =
    mode === 'motion'
      ? 'Drag speed sliders below · watch spin vs. path'
      : mode === 'seasons'
        ? 'Drag tilt & orbit position below'
        : mode === 'phases'
          ? 'Drag the Moon around its orbit below'
          : mode === 'eclipses'
            ? 'Drag the alignment slider below'
        : 'Watch Earth spin through the tidal bulge'
  const motionExperiment =
    SPEED_EXPERIMENTS.find((experiment) => experiment.rotationSpeed === rotationSpeed && experiment.revolutionSpeed === revolutionSpeed) ?? null
  const dayLengthLabel = rotationSpeed === 0 ? 'No day/night cycle' : `${(3 / rotationSpeed).toFixed(1)}s model day`
  const yearLengthLabel = revolutionSpeed === 0 ? 'No yearly orbit' : `${(24 / revolutionSpeed).toFixed(1)}s model year`
  const motionChallenge =
    mode === 'motion'
      ? 'Challenge: set rotation to 0, then revolution to 0. Predict which day/night or year signal stops, change both sliders, and observe the result.'
      : mode === 'seasons'
        ? 'Challenge: set tilt to 0°, observe the daylight bars, then restore 23.5° and explain why day length and seasons change.'
        : mode === 'phases'
          ? 'Challenge: change Moon distance and compare orbit period and gravity. Predict which value changes, then explain what you observe.'
          : 'Challenge: change the control above, predict the next marker, observe it move, and explain the pattern.'

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Space"
            subjectColor="var(--color-space-deep)"
            defaultIcon={Orbit}
            branchName="Earth In Space"
            items={earthInSpace.map((c) => ({ id: c.id, name: c.name, meta: c.system, icon: NAV_ICON[c.id] }))}
            activeItemId={componentId}
            onSelect={selectComponent}
            otherBranches={otherBranches}
            footerNote="A procedural, physically-lit simulation — Earth and the Moon render from the same real NASA-derived 3D models used elsewhere in Space. Nothing here is invented geometry, only the scale and speed are stylized for clarity."
          />
        </aside>

        <div ref={stageRef} data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={focusMode}
            onToggleIsolate={() => setFocusMode((v) => !v)}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() => setCameraDistance((d) => Math.max(MIN_CAMERA_DISTANCE, Number((d - ZOOM_STEP).toFixed(2))))}
            onZoomOut={() => setCameraDistance((d) => Math.min(MAX_CAMERA_DISTANCE, Number((d + ZOOM_STEP).toFixed(2))))}
            zoomInDisabled={cameraDistance <= MIN_CAMERA_DISTANCE}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            animationAvailable={mode !== 'eclipses'}
            animationPlaying={playing}
            onToggleAnimation={mode !== 'eclipses' ? () => setPlaying((v) => !v) : undefined}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => {
              setCameraDistance(defaultDistanceFor(mode))
              setResetSignal((s) => s + 1)
            }}
            onReset={resetAll}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="max-w-[calc(100%-11rem)] truncate rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              {content.name} · {captionDetail}
            </div>
          </div>

          <EarthSpaceViewer
            mode={mode}
            playing={playing}
            autoRotate={autoRotate}
            cameraDistance={cameraDistance}
            resetSignal={resetSignal}
            labelsVisible={labelsVisible && !focusMode}
            rotationSpeed={rotationSpeed}
            revolutionSpeed={revolutionSpeed}
            tiltDeg={tiltDeg}
            orbitAngleDeg={orbitAngleDeg}
            moonAngleDeg={moonAngleDeg}
            eclipseType={eclipseType}
            alignmentOffsetDeg={alignmentOffsetDeg}
            useRealisticTilt={useRealisticTilt}
            tideSpinAngleDeg={tideSpinAngleDeg}
            springTide={springTide}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-4 sm:bottom-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-2.5 py-1 text-center text-[10px] leading-snug text-[color:var(--color-ink-500)] backdrop-blur-sm sm:px-3.5 sm:py-1.5 sm:text-[11px]">
              {NOT_TO_SCALE_NOTE}
            </div>
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[380px] lg:flex-none lg:border-l lg:border-t-0">
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <SectionLabel>
              Component {earthInSpace.findIndex((c) => c.id === componentId) + 1} of {earthInSpace.length}
            </SectionLabel>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {earthInSpace.map((c) => {
                const Icon = NAV_ICON[c.id]
                const active = c.id === componentId
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => selectComponent(c.id)}
                    title={c.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-space-deep)',
                          }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-ink-500)' }
                    }
                  >
                    {Icon && <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    {c.name}
                  </button>
                )
              })}
            </div>
          </div>

          {mode === 'motion' && (
            <div className="border-b border-[color:var(--color-border)] p-5">
              <SectionLabel>Independent speed controls</SectionLabel>
              <div className="mt-3 space-y-4">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                    <span>Rotation speed (spin)</span>
                    <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{rotationSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={rotationSpeed}
                    onChange={(e) => setRotationSpeed(Number(e.target.value))}
                    className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                    aria-label="Rotation speed"
                  />
                  <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">
                    {rotationSpeed === 0 ? 'Spin stopped.' : `A full spin every ${(3 / rotationSpeed).toFixed(1)}s at this speed.`}
                  </p>
                </div>
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                    <span>Revolution speed (orbit)</span>
                    <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{revolutionSpeed.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={5}
                    step={0.5}
                    value={revolutionSpeed}
                    onChange={(e) => setRevolutionSpeed(Number(e.target.value))}
                    className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                    aria-label="Revolution speed"
                  />
                  <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">
                    {revolutionSpeed === 0 ? 'Orbit stopped.' : `A full lap around the Sun every ${(24 / revolutionSpeed).toFixed(1)}s at this speed.`}
                  </p>
                </div>
                <p className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  Each slider only changes its own motion — set one to 0 and watch the other keep going on its own.
                </p>
                <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                  <SectionLabel>Speed experiment</SectionLabel>
                  <div className="mt-2 grid grid-cols-2 gap-1.5">
                    {SPEED_EXPERIMENTS.map((experiment) => {
                      const active = experiment.rotationSpeed === rotationSpeed && experiment.revolutionSpeed === revolutionSpeed
                      return (
                        <button
                          key={experiment.label}
                          type="button"
                          onClick={() => {
                            setRotationSpeed(experiment.rotationSpeed)
                            setRevolutionSpeed(experiment.revolutionSpeed)
                          }}
                          aria-pressed={active}
                          className="rounded-[var(--radius-sm)] border px-2 py-1.5 text-left text-[11px] font-semibold transition-colors"
                          style={
                            active
                              ? { borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)', background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))', color: 'var(--color-space-deep)' }
                              : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                          }
                        >
                          {experiment.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Day signal</p>
                      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-foreground)]">{dayLengthLabel}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Year signal</p>
                      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-foreground)]">{yearLengthLabel}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                    <span className="font-semibold text-[color:var(--color-foreground)]">Conclusion:</span>{' '}
                    {motionExperiment?.outcome ?? 'Rotation controls day/night; revolution controls the trip around the Sun. Changing one does not automatically change the other.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'seasons' && (
            <div className="border-b border-[color:var(--color-border)] p-5">
              <SectionLabel>Axial tilt</SectionLabel>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                <span>Tilt angle</span>
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{tiltDeg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={0.5}
                value={tiltDeg}
                onChange={(e) => setTiltDeg(Number(e.target.value))}
                className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                aria-label="Axial tilt in degrees"
              />
              <button
                type="button"
                onClick={() => setTiltDeg(EARTH_AXIAL_TILT_DEG)}
                className="mt-2 text-[11px] font-medium text-[color:var(--color-space-deep)] underline underline-offset-2"
              >
                Reset to Earth's real tilt (23.5°)
              </button>

              <div className="mt-4">
                <SectionLabel>Position in orbit</SectionLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {SEASON_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setOrbitAngleDeg(p.angle)}
                      aria-pressed={Math.round(orbitAngleDeg) === p.angle}
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                      style={
                        Math.round(orbitAngleDeg) === p.angle
                          ? { borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)', background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))', color: 'var(--color-space-deep)' }
                          : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={orbitAngleDeg}
                  onChange={(e) => setOrbitAngleDeg(Number(e.target.value))}
                  className="mt-3 w-full accent-[color:var(--color-space-deep)]"
                  aria-label="Position in Earth's orbit, in degrees"
                />
              </div>

              <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <p className="text-sm text-[color:var(--color-foreground)]">
                  Northern Hemisphere: <span className="font-semibold capitalize" style={{ color: 'var(--color-space-deep)' }}>{seasons.north}</span> · Southern Hemisphere:{' '}
                  <span className="font-semibold capitalize" style={{ color: 'var(--color-space-deep)' }}>{seasons.south}</span>
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">Subsolar latitude: {subsolarLat.toFixed(1)}°</p>
                <div className="mt-3 space-y-2.5">
                  <DaylightBar label="Northern mid-latitudes (45°N)" hours={northDaylight} />
                  <DaylightBar label="Southern mid-latitudes (45°S)" hours={southDaylight} />
                </div>
              </div>
            </div>
          )}

          {mode === 'phases' && (
            <div className="border-b border-[color:var(--color-border)] p-5">
              <SectionLabel>Moon phase wheel</SectionLabel>
              <div className="mt-3 grid grid-cols-4 gap-1.5" data-testid="moon-phase-wheel">
                {PHASE_BUCKETS.map((b) => {
                  const active = phase.label === b.label || (b.label === 'New' && phase.label === 'New Moon') || (b.label === 'Full' && phase.label === 'Full Moon')
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => setMoonAngleDeg(b.angle)}
                      aria-pressed={active}
                      className="flex flex-col items-center gap-1 rounded-[var(--radius-md)] border px-1.5 py-2 text-center text-[10px] font-medium leading-tight transition-colors"
                      style={
                        active
                          ? { borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)', background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))', color: 'var(--color-space-deep)' }
                          : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                      }
                    >
                      <span
                        aria-hidden="true"
                        className="h-4 w-4 rounded-full border border-[color:var(--color-border)]"
                        style={{ background: `linear-gradient(90deg, #e8edf7 ${100 - Math.round((1 - Math.cos((b.angle * Math.PI) / 180)) * 50)}%, #1a2036 0%)` }}
                      />
                      {b.label}
                    </button>
                  )
                })}
              </div>
              <input
                type="range"
                min={0}
                max={360}
                step={1}
                value={moonAngleDeg}
                onChange={(e) => setMoonAngleDeg(Number(e.target.value))}
                className="mt-3 w-full accent-[color:var(--color-space-deep)]"
                aria-label="Moon's position in orbit, in degrees"
              />
              <div className="mt-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <p className="text-sm text-[color:var(--color-foreground)]">
                  Current phase: <span className="font-semibold" style={{ color: 'var(--color-space-deep)' }}>{phase.label}</span>
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">{Math.round(phase.illumination * 100)}% of the visible disc is lit.</p>
              </div>

              <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3" data-testid="moon-gravity-orbit-comparison">
                <SectionLabel>Moon gravity and orbit comparison</SectionLabel>
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
                  {moons.map((m) => {
                    const active = m.id === comparedMoon.id
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMoonCompareId(m.id)}
                        aria-pressed={active}
                        className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors"
                        style={
                          active
                            ? { borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)', background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))', color: 'var(--color-space-deep)' }
                            : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                        }
                      >
                        {m.name}
                      </button>
                    )
                  })}
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Orbit distance</p>
                    <p className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-foreground)]">
                      {comparedMoon.orbitDistanceKm.toLocaleString()} km
                    </p>
                    <p className="text-[10px] text-[color:var(--color-ink-500)]">{moonOrbitDistanceRatio.toFixed(1)}x Earth's Moon</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Orbit period</p>
                    <p className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-foreground)]">
                      {comparedMoon.orbitPeriodDays} days
                    </p>
                    <p className="text-[10px] text-[color:var(--color-ink-500)]">{moonOrbitPeriodRatio.toFixed(1)}x Earth's Moon</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Surface gravity</p>
                    <p className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-foreground)]">
                      {Math.round(moonSurfaceGravityRatio * 100)}% of Earth
                    </p>
                    <p className="text-[10px] text-[color:var(--color-ink-500)]">{comparedMoon.surfaceGravityMs2} m/s²</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                  <span>Change your Earth weight</span>
                  <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{moonCompareWeightKg} kg</span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={100}
                  step={1}
                  value={moonCompareWeightKg}
                  onChange={(e) => setMoonCompareWeightKg(Number(e.target.value))}
                  className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                  aria-label="Earth weight for moon gravity comparison"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  <span className="font-semibold text-[color:var(--color-foreground)]">Predict:</span> pick a moon, then guess whether its gravity makes you lighter or heavier than on Earth.{' '}
                  <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> {moonCompareWeightKg} kg on Earth becomes {moonWeightHereKg} kg on {comparedMoon.name}.{' '}
                  <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> {moonOrbitOutcome}
                </p>
              </div>
            </div>
          )}

          {mode === 'eclipses' && (
            <div className="border-b border-[color:var(--color-border)] p-5">
              <SectionLabel>Eclipse type</SectionLabel>
              <div className="mt-2 flex gap-1.5">
                {(['solar', 'lunar'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEclipseType(t)}
                    aria-pressed={eclipseType === t}
                    className="flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-center text-xs font-semibold capitalize transition-colors"
                    style={
                      eclipseType === t
                        ? { borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)', background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))', color: 'var(--color-space-deep)' }
                        : { borderColor: 'var(--color-border)', color: 'var(--color-ink-700)' }
                    }
                  >
                    {t} eclipse
                  </button>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                <span>Alignment offset</span>
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{alignmentOffsetDeg.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                step={0.25}
                value={alignmentOffsetDeg}
                onChange={(e) => setAlignmentOffsetDeg(Number(e.target.value))}
                className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                aria-label="Alignment offset in degrees"
              />

              <label className="mt-4 flex items-center justify-between gap-2 text-[11px] font-medium text-[color:var(--color-ink-700)]">
                <span>Use the Moon's real {MOON_ORBIT_TILT_DEG}° orbital tilt</span>
                <input
                  type="checkbox"
                  checked={useRealisticTilt}
                  onChange={(e) => setUseRealisticTilt(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-space-deep)]"
                />
              </label>

              <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <p className="text-sm font-semibold capitalize" style={{ color: eclipse.occurs ? 'var(--color-space-deep)' : 'var(--color-ink-500)' }}>
                  {eclipse.strength === 'none' ? 'No eclipse' : `${eclipse.strength} ${eclipseType} eclipse`}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">{eclipse.explanation}</p>
              </div>
            </div>
          )}

          {mode === 'tides' && (
            <div className="border-b border-[color:var(--color-border)] p-5">
              <SectionLabel>Earth spin speed</SectionLabel>
              <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                <span>Spin speed</span>
                <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{tideSpinSpeed.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={tideSpinSpeed}
                onChange={(e) => setTideSpinSpeed(Number(e.target.value))}
                className="mt-1.5 w-full accent-[color:var(--color-space-deep)]"
                aria-label="Earth spin speed for the tide model"
              />

              <label className="mt-4 flex items-center justify-between gap-2 text-[11px] font-medium text-[color:var(--color-ink-700)]">
                <span>Spring tide (Sun & Moon aligned)</span>
                <input
                  type="checkbox"
                  checked={springTide}
                  onChange={(e) => setSpringTide(e.target.checked)}
                  className="h-4 w-4 accent-[color:var(--color-space-deep)]"
                />
              </label>
              <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">
                {springTide ? 'Sun and Moon pulling together — bigger high tides, lower low tides.' : "Sun and Moon at right angles — gentler, in-between tides."}
              </p>

              <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <p className="text-sm text-[color:var(--color-foreground)]">
                  At the marker: <span className="font-semibold" style={{ color: 'var(--color-space-deep)' }}>{tide.label}</span>
                </p>
                <p className="mt-1 text-[11px] text-[color:var(--color-ink-500)]">Watch the yellow marker pass through both tidal bulges as Earth spins.</p>
              </div>
            </div>
          )}

          <div className="border-b border-[color:var(--color-border)]">
            <button type="button" onClick={() => setMissionOpen((v) => !v)} aria-expanded={missionOpen} className="flex w-full items-center justify-between gap-2 p-5 text-left">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                <Rocket className="h-3.5 w-3.5" strokeWidth={1.75} />
                Mission: {content.name}
              </span>
              {missionOpen ? <ChevronUp className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} /> : <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />}
            </button>

            {missionOpen && (
              <div className="space-y-4 px-5 pb-5">
                <MissionStep icon={Eye} label="Observe" body={`Watch how the simulation responds as you change ${content.name.toLowerCase()}'s controls above.`} />
                <MissionStep icon={HelpCircle} label="Predict" body={content.lesson.predictionPrompt} />
                <MissionStep
                  icon={ArrowLeftRight}
                  label="Change"
                  body={compareTarget ? `Tap Compare, or switch to ${compareTarget.name} in the sidebar, and see what's different.` : 'Switch to a different component in the sidebar and see what changes.'}
                />
                <MissionStep icon={MessageCircle} label="Explain" body={content.lesson.practiceItem} />
                <MissionStep icon={Rocket} label="Challenge" body={motionChallenge} />
                <MissionStep
                  icon={CheckCircle2}
                  label="Check"
                  body={content.lesson.checkpoint}
                  action={
                    <Button size="sm" variant="secondary" onClick={() => setQuizOpen(true)}>
                      Open checkpoint
                    </Button>
                  }
                />
              </div>
            )}
          </div>

          <DetailPanel content={content} activeHotspot={null} onClearHotspot={() => {}} onOpenLesson={() => setLessonOpen(true)} />
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={content} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={content} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
