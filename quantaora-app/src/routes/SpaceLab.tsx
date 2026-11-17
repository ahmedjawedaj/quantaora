import { useEffect, useState } from 'react'
import { Play, Pause, Orbit, StepForward } from 'lucide-react'
import { planets, planetById } from '@/data/planets'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import { cn } from '@/lib/utils'
import OrbitSandbox, { DEFAULT_CAMERA_DISTANCE, CLOSE_FOCUS_BODY_IDS } from '@/components/explorer/OrbitSandbox'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'

const STEP_DAYS = 12

type MissionStepId = 'observe' | 'predict' | 'change' | 'explain' | 'challenge' | 'check'

interface MissionStep {
  id: MissionStepId
  label: string
  prompt: string
}

const hierarchy = HIERARCHY.space
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'solar-system')
const MIN_CAMERA_DISTANCE = 4
// Matches OrbitSandbox's MAX_ORBIT_CONTROLS_DISTANCE — raised from 30 in Wave 11 so the Zoom Out
// button's ceiling doesn't sit below what OrbitSandbox's live camera fit may legitimately need to
// keep an outer body (e.g. Neptune) framed when selected at a bad orbital angle. See
// OrbitSandbox.tsx's CameraFit for why.
const MAX_CAMERA_DISTANCE = 75
const ZOOM_STEP = 1.6
// Bespoke default distance for CLOSE_FOCUS_BODY_IDS bodies (Ceres) — close enough that a ~0.07-
// Earth-radius dwarf planet actually reads clearly on selection, while still leaving a little
// headroom above MIN_CAMERA_DISTANCE for the Zoom In button to do something.
const CLOSE_FOCUS_DEFAULT_DISTANCE = MIN_CAMERA_DISTANCE + 2
// Wave 15 QA finding #3: for every OTHER (non-close-focus) body, the starting `cameraDistance`
// was set to exactly `DEFAULT_CAMERA_DISTANCE` -- the same value used as that body's own Zoom In
// floor (`zoomInFloor` below) -- so `zoomInDisabled = cameraDistance <= zoomInFloor` was true from
// the very first frame for Saturn, Neptune, and (by the same logic) every other planet: there was
// no room between the starting distance and the floor for a single Zoom In click to move the
// camera. `DEFAULT_CAMERA_DISTANCE` itself must stay the true minimum (OrbitSandbox's CameraFit
// still enforces it as a hard floor so Saturn's rings can never clip regardless of selection), so
// the fix gives every non-close-focus selection a couple of clicks of genuine headroom ABOVE that
// floor to start from instead -- mirroring the same "start a little back from the floor" idea
// CLOSE_FOCUS_DEFAULT_DISTANCE above already uses for Ceres. Applied to the initial state and to
// "Fit View"/"Reset" (the three places that reset to "the default view"), not to ordinary
// selection-to-selection switches, so a user's own chosen zoom level still persists across picking
// a different planet exactly as before.
const GENERAL_ZOOM_HEADROOM = ZOOM_STEP * 2
// Single named constant for "the default view's camera distance", used everywhere that resets to
// it (initial state, Fit View, Reset) so all three stay in lockstep by construction instead of
// repeating the same `DEFAULT_CAMERA_DISTANCE + GENERAL_ZOOM_HEADROOM` expression three times.
const INITIAL_CAMERA_DISTANCE = DEFAULT_CAMERA_DISTANCE + GENERAL_ZOOM_HEADROOM

/** Hard ceiling on how long the loading skeleton can block the scene. OrbitSandbox's onReady
 *  callback (below) is the normal, expected path — it's driven purely by this route's own 11
 *  bodies settling (each one firing only after a real paint, per PlanetModel's own one-rAF-deferred
 *  onSettled — see that file), not any shared/global loader and not a guessed duration. This
 *  timeout is only a last-resort backstop in case a network request for one of those bodies
 *  genuinely never settles (neither resolves nor errors), so the skeleton can never block the scene
 *  forever no matter what happens on the wire.
 *  Wave 17 QA (loader-timing finding): raised from 8000 to 12000. 8s undersells how long a genuine
 *  cold load of 11 bodies' worth of relief-mesh GLBs (several multi-MB) can legitimately take on a
 *  slower connection — if the backstop fires while assets are still actively (if slowly) loading,
 *  it dismisses the skeleton over a scene where some bodies are still showing their placeholder
 *  sphere, which is the "masking a still-loading model" failure mode this backstop exists to avoid,
 *  not just handle a truly-stalled request. Raising it only ever affects that rare
 *  stalled/slow-network worst case — the normal event-driven path above already dismisses as soon
 *  as every body has actually settled, regardless of this constant's value, so typical/fast loads
 *  see zero added wait. */
const MAX_LOADING_WAIT_MS = 12000

/** Tracks whether the orbit sandbox has a real, visible scene to show yet. Driven entirely by
 *  OrbitSandbox's own onReady/onProgress callbacks — which fire once every one of the 11 bodies
 *  in `planets` has settled (loaded its model, or fallen back to a placeholder sphere) — not by
 *  drei's `useProgress()` global THREE.DefaultLoadingManager signal. That manager is shared by the
 *  entire app (other labs eagerly `useGLTF.preload` their own models at import time), and THREE's
 *  LoadingManager never calls `itemEnd` after an `itemError`, so a single failed/slow asset
 *  *anywhere* in the app — not just on this route — could permanently wedge `active` at true and
 *  leave this skeleton stuck below 100% forever. Scoping readiness to this route's own known set
 *  of bodies removes that cross-route coupling entirely. */
function useOrbitSandboxReady() {
  const [ready, setReady] = useState(false)
  const [settled, setSettled] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    if (ready) return
    const timer = setTimeout(() => setReady(true), MAX_LOADING_WAIT_MS)
    return () => clearTimeout(timer)
  }, [ready])

  const onReady = () => setReady(true)
  const onProgress = (settledCount: number, totalCount: number) => {
    setSettled(settledCount)
    setTotal(totalCount)
  }

  const progress = total > 0 ? Math.min(100, Math.round((settled / total) * 100)) : 0
  return { ready, progress, onReady, onProgress }
}

/** Skeleton shown over the 3D stage until the first orbit sandbox finishes loading. Absolutely
 *  positioned inside the already-sized `data-lab-stage` container, so it never shifts layout. */
function OrbitCanvasSkeleton({ visible, progress }: { visible: boolean; progress: number }) {
  return (
    <div
      aria-hidden={!visible}
      role={visible ? 'status' : undefined}
      aria-live="polite"
      style={{ backgroundColor: '#0b1224' }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute h-24 w-24 rounded-full border-2 border-t-transparent border-white/25 motion-safe:animate-spin" />
        <span className="absolute h-20 w-20 rounded-full border border-white/10" />
        <span className="h-3.5 w-3.5 rounded-full bg-amber-200 shadow-[0_0_12px_2px_rgba(253,230,138,0.6)] motion-safe:animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-white/70">
          Loading solar system{progress > 0 ? `… ${progress}%` : '…'}
        </p>
        <div className="h-1 w-36 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white/70 transition-[width]"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function SpaceLab() {
  const [selectedId, setSelectedId] = useState('earth')
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState(6)
  const [rotationSpeed, setRotationSpeed] = useState(1)
  const [distanceOverride, setDistanceOverride] = useState<number | null>(null)
  const [motionPanelOpen, setMotionPanelOpen] = useState(true)
  const [motionTab, setMotionTab] = useState<'motion' | 'mission'>('motion')
  const [stepToken, setStepToken] = useState(0)
  const [missionChecks, setMissionChecks] = useState<Partial<Record<MissionStepId, boolean>>>({})
  const [isolateActive, setIsolateActive] = useState(false)
  const [cameraAutoRotate, setCameraAutoRotate] = useState(false)
  const [cameraDistance, setCameraDistance] = useState(INITIAL_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [xrayActive, setXrayActive] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  // Tracks whether the "Orbit Sandbox · click a planet..." instruction pill has been shown long
  // enough / interacted with. Wave 12 QA (mobile): that pill sits at the top of the canvas and can
  // visually overlap a body (most visibly Saturn's rings) whenever that body's live orbital position
  // happens to drift into the top strip of the frame. Rather than try to guarantee no overlap for
  // every possible 3D position (which would need reading every body's live screen-projected bounds),
  // it fades out for the rest of the session on first interaction or after a short timeout — a
  // one-time hint doesn't need to persist indefinitely anyway.
  const [instructionsSeen, setInstructionsSeen] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setInstructionsSeen(true), 6000)
    return () => clearTimeout(timer)
  }, [])
  const { ready: canvasReady, progress: canvasProgress, onReady: handleCanvasReady, onProgress: handleCanvasProgress } =
    useOrbitSandboxReady()

  const selected = planetById[selectedId]
  const compareTarget = selected.compareCandidate ? resolveContent(selected.compareCandidate) : null
  // Zoom In floor for the toolbar button — mirrors OrbitSandbox's own native OrbitControls
  // minDistance (orbitControlsMinDistance) so the button disables at the same point native
  // scroll/pinch zoom would stop, instead of appearing to still have room to zoom when it doesn't.
  // See OrbitSandbox.tsx's CLOSE_FOCUS_BODY_IDS for why Ceres gets a much closer floor.
  const zoomInFloor = CLOSE_FOCUS_BODY_IDS.has(selectedId) ? MIN_CAMERA_DISTANCE : DEFAULT_CAMERA_DISTANCE

  const selectPlanet = (id: string) => {
    setSelectedId(id)
    setDistanceOverride(null)
    setXrayActive(false)
    // Small/distant bodies (Ceres) get a bespoke tight starting distance instead of inheriting
    // whatever wide distance was left over from the previous selection — see CLOSE_FOCUS_BODY_IDS
    // in OrbitSandbox.tsx for why the camera fit alone can't zoom in on these on its own. OrbitFit's
    // own live per-frame fit still applies on top of this every frame, so it's a starting point, not
    // a hard value.
    if (CLOSE_FOCUS_BODY_IDS.has(id)) {
      setCameraDistance(CLOSE_FOCUS_DEFAULT_DISTANCE)
    }
    setInstructionsSeen(true)
  }

  const effectiveDistance = distanceOverride ?? selected.distanceAU
  const effectivePeriod =
    distanceOverride && selected.distanceAU > 0
      ? Math.round(selected.orbitalPeriodDays * Math.pow(distanceOverride / selected.distanceAU, 1.5))
      : selected.orbitalPeriodDays
  const rotationFact =
    selected.keyFacts.find((fact) => /day length|rotation/i.test(fact.label))?.value ?? 'spin on its axis'
  const orbitChange =
    selected.distanceAU > 0 && effectivePeriod
      ? effectivePeriod > selected.orbitalPeriodDays
        ? 'longer year'
        : effectivePeriod < selected.orbitalPeriodDays
          ? 'shorter year'
          : 'same year'
      : 'gravity center'
  const compactYear = effectivePeriod
    ? effectivePeriod < 1000
      ? `${Math.round(effectivePeriod)}d`
      : `${Math.round(effectivePeriod / 365)}y`
    : 'center'
  // Simplified gravity reasoning: pull falls off with the square of distance (Earth at 1 AU = 1x).
  // Not exact Newtonian mass-scaled gravity — a deliberately simple "closer = stronger pull" model for kids.
  const relativePull = selected.distanceAU > 0 ? 1 / Math.pow(effectiveDistance, 2) : null
  const spinOutcome =
    rotationSpeed < 0.8
      ? 'slower surface spin, same path'
      : rotationSpeed > 1.4
        ? 'faster surface spin, same path'
        : 'normal surface spin, same path'
  const revolutionOutcome =
    speed < 8
      ? 'slow lap animation'
      : speed > 24
        ? 'fast lap animation'
        : 'steady lap animation'
  const distanceOutcome =
    selected.distanceAU > 0
      ? effectiveDistance > selected.distanceAU
        ? 'farther out: weaker pull and a longer year'
        : effectiveDistance < selected.distanceAU
          ? 'closer in: stronger pull and a shorter year'
          : 'real distance: the published year'
      : 'the Sun anchors the gravity center'

  const missionOther = planetById[selectedId === 'earth' ? 'mars' : 'earth']
  const missionSteps: MissionStep[] = [
    {
      id: 'observe',
      label: 'Observe',
      prompt: `Press Run and watch ${selected.name}. The orange dot circles fast — that's spin. The blue arrow travels the wide ring — that's orbit.`,
    },
    {
      id: 'predict',
      label: 'Predict',
      prompt: `Predict: will ${selected.name} or ${missionOther.name} finish one full lap around the Sun first?`,
    },
    {
      id: 'change',
      label: 'Change',
      prompt: `Change: pick ${missionOther.name} from the list on the left, then compare its Orbit and Year meters to ${selected.name}'s.`,
    },
    {
      id: 'explain',
      label: 'Explain',
      prompt: 'Explain: the planet closer to the Sun feels a stronger pull, moves faster, and finishes its lap sooner.',
    },
    {
      id: 'challenge',
      label: 'Challenge',
      prompt: `Challenge: change ${selected.name}'s orbit speed, rotation speed, and distance one at a time. Predict, observe, and explain which signal changes: day, lap speed, gravity, or year length.`,
    },
    {
      id: 'check',
      label: 'Check',
      prompt: 'Check off each box once you can say it out loud without looking.',
    },
  ]
  const missionDoneCount = missionSteps.filter((step) => missionChecks[step.id]).length

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Space"
            subjectColor="var(--color-space-deep)"
            defaultIcon={Orbit}
            branchName="Solar System"
            items={planets.map((p) => ({ id: p.id, name: p.name, meta: p.system }))}
            activeItemId={selectedId}
            onSelect={selectPlanet}
            otherBranches={otherBranches}
            footerNote="Sun + 9 bodies, real NASA/CC texture maps and Kepler's-law orbital mechanics. Stars and Galaxies are next."
          />
        </aside>

        <div
          data-lab-stage
          data-clean-view={cleanView ? 'true' : undefined}
          onPointerDown={() => setInstructionsSeen(true)}
          className="relative order-1 h-[50svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1"
        >
          <OrbitCanvasSkeleton visible={!canvasReady} progress={canvasProgress} />

          <div
            data-canvas-overlay
            aria-hidden={instructionsSeen}
            className={cn(
              'pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 transition-opacity duration-500 sm:top-4',
              instructionsSeen ? 'opacity-0' : 'opacity-100',
            )}
          >
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              Orbit Sandbox · click a planet · sizes and distances compressed for view
            </div>
          </div>

          {/* Wave 23: consolidated selected-body status card, replacing OrbitSandbox's old
              in-canvas Name/Spin/Orbit <Html> pill stack for the SELECTED body. Wave 22 QA found
              that stack's Spin and Orbit pills overlapping in 20/20 measurements (5 desktop
              select→drag→reselect cycles + 15 mobile points) -- as camera azimuth accumulates
              across drags, the Orbit pill's 3D-anchored screen projection drifts closer to Spin's
              each cycle, and no per-frame pairwise push-apart pass ever fully separated them for
              this geometry. Rendering this as plain DOM outside the Canvas element entirely (not
              drei's Html helper, never a 3D projection) removes that collision class structurally
              instead of patching
              the old relaxation math further -- there is no camera-relative position for these
              three readouts to drift toward each other from.
              Mirrors the existing `selected && !body.isStar` guard OrbitSandbox used for its old
              Spin/Orbit pills (Sun has no spin/orbit motion markers to report on). Positioned
              vertically centered on the stage's right edge -- clear of the top toolbar (a full-
              width row on mobile, a left rail on desktop), the top instruction pill (top-20/top-4,
              horizontally centered), and the bottom motion panel (bottom-4, horizontally centered)
              at every viewport width tested in Wave 22's own desktop/mobile breakpoints. */}
          {!selected.isStar && (
            <div
              data-canvas-overlay
              data-testid="orbit-status-card"
              className="pointer-events-none absolute right-3 top-1/2 z-10 w-28 -translate-y-1/2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-2.5 text-center shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:right-4 sm:w-32"
            >
              <p
                data-testid="orbit-status-name"
                className="truncate text-xs font-semibold text-[color:var(--color-foreground)]"
              >
                {selected.name}
              </p>
              <div className="mt-1.5 flex flex-col gap-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                <p data-testid="orbit-status-spin" className="flex items-center justify-between gap-1">
                  <span>Spin</span>
                  <span className="font-[family-name:var(--font-mono)] normal-case text-[color:var(--color-foreground)]">
                    {rotationSpeed.toFixed(1)}x
                  </span>
                </p>
                <p data-testid="orbit-status-orbit" className="flex items-center justify-between gap-1">
                  <span>Orbit</span>
                  <span className="font-[family-name:var(--font-mono)] normal-case text-[color:var(--color-foreground)]">
                    {speed}d/s
                  </span>
                </p>
              </div>
            </div>
          )}

          <CanvasControls
            autoRotate={cameraAutoRotate}
            onToggleAutoRotate={() => setCameraAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setIsolateActive((v) => !v)}
            onCompare={() => setCompareOpen(true)}
            compareDisabled={!compareTarget}
            onZoomIn={() =>
              setCameraDistance((distance) =>
                Math.max(zoomInFloor, Number((distance - ZOOM_STEP).toFixed(2))),
              )
            }
            onZoomOut={() =>
              setCameraDistance((distance) =>
                Math.min(MAX_CAMERA_DISTANCE, Number((distance + ZOOM_STEP).toFixed(2))),
              )
            }
            zoomInDisabled={cameraDistance <= zoomInFloor}
            zoomOutDisabled={cameraDistance >= MAX_CAMERA_DISTANCE}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            xrayActive={xrayActive}
            onToggleXray={() => setXrayActive((v) => !v)}
            animationAvailable
            animationPlaying={running}
            onToggleAnimation={() => setRunning((v) => !v)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => setCameraDistance(INITIAL_CAMERA_DISTANCE)}
            onReset={() => {
              setSelectedId('earth')
              setDistanceOverride(null)
              setIsolateActive(false)
              setCameraAutoRotate(false)
              setCameraDistance(INITIAL_CAMERA_DISTANCE)
              setXrayActive(false)
              setCleanView(false)
              setRunning(true)
              setRotationSpeed(1)
              setMotionPanelOpen(false)
              setMotionTab('motion')
              setStepToken(0)
              setMissionChecks({})
            }}
          />

          <OrbitSandbox
            selectedId={selectedId}
            onSelect={selectPlanet}
            running={running}
            speedDaysPerSec={speed}
            rotationSpeedScale={rotationSpeed}
            distanceOverrideAU={distanceOverride}
            isolateActive={isolateActive}
            cameraAutoRotate={cameraAutoRotate}
            cameraDistance={cameraDistance}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            stepToken={stepToken}
            stepDays={STEP_DAYS}
            onReady={handleCanvasReady}
            onProgress={handleCanvasProgress}
          />

          <div
            data-canvas-overlay
            className={cn(
              'absolute bottom-4 left-1/2 z-10 w-[min(92%,560px)] -translate-x-1/2',
              motionPanelOpen && 'top-16 overflow-y-auto sm:top-auto',
            )}
          >
            {!motionPanelOpen ? (
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="grid w-full grid-cols-3 gap-2 sm:max-w-[23rem] sm:flex-1">
                  <SmallMeter label="Spin" value={`${rotationSpeed.toFixed(1)}x`} />
                  <SmallMeter label="Orbit" value={`${speed}d/s`} />
                  <SmallMeter label="Year" value={compactYear} />
                </div>
                <button
                  type="button"
                  onClick={() => setMotionPanelOpen(true)}
                  className="inline-flex h-11 items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/94 px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)] backdrop-blur-sm"
                >
                  <Orbit className="h-4 w-4" strokeWidth={1.8} />
                  Investigate motion
                </button>
              </div>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-4 shadow-[var(--shadow-tactile)] backdrop-blur-sm">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-0.5">
                    <button
                      type="button"
                      onClick={() => setMotionTab('motion')}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                        motionTab === 'motion'
                          ? 'bg-[color:var(--color-space-deep)] text-white'
                          : 'text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]',
                      )}
                    >
                      Motion
                    </button>
                    <button
                      type="button"
                      onClick={() => setMotionTab('mission')}
                      className={cn(
                        'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors',
                        motionTab === 'mission'
                          ? 'bg-[color:var(--color-space-deep)] text-white'
                          : 'text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]',
                      )}
                    >
                      Mission {missionDoneCount > 0 ? `(${missionDoneCount}/6)` : ''}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMotionPanelOpen(false)}
                    className="rounded-full px-2 py-1 text-xs font-semibold text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)]"
                  >
                    Hide
                  </button>
                </div>
                {motionTab === 'motion' ? (
                <>
                <div className="mb-3 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Rotation</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">Spin in place = a day</p>
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-ink-500)]">{rotationFact}</p>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Revolution</p>
                    <p className="mt-1 text-sm font-medium text-[color:var(--color-foreground)]">Travel around the Sun = a year</p>
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-ink-500)]">{orbitChange}</p>
                  </div>
                </div>
                <div className="mb-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2" data-testid="space-cause-effect-strip">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    Predict · Change · Observe · Explain
                  </p>
                  <div className="mt-2 grid gap-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)] sm:grid-cols-3">
                    <p>
                      <span className="font-semibold text-[color:var(--color-foreground)]">Predict:</span> if distance moves outward, the year should grow.
                    </p>
                    <p>
                      <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> {spinOutcome}; {revolutionOutcome}; {distanceOutcome}.
                    </p>
                    <p>
                      <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> rotation changes the day marker; revolution and distance change the lap.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Revolution speed</span>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-foreground)]">{speed} days/sec</span>
                    <button
                      type="button"
                      onClick={() => setRunning((v) => !v)}
                      className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]"
                    >
                      {running ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      {running ? 'Pause' : 'Run'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setStepToken((t) => t + 1)}
                      disabled={running}
                      title={`Step forward ${STEP_DAYS} days while paused`}
                      className="flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <StepForward className="h-3 w-3" />
                      Step
                    </button>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                />

                {!selected.isStar && (
                  <>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                      <span>Rotation speed</span>
                      <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{rotationSpeed.toFixed(1)}x spin</span>
                    </div>
                    <input
                      type="range"
                      min={0.2}
                      max={4}
                      step={0.1}
                      value={rotationSpeed}
                      onChange={(e) => setRotationSpeed(Number(e.target.value))}
                      className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                      Change spin speed and the yellow arrow turns faster or slower, but the orbital path
                      does not change. That is the difference between rotation and revolution.
                    </p>
                  </>
                )}

                {selected.distanceAU > 0 && (
                  <>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                      <span>Orbital distance</span>
                      <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">{effectiveDistance.toFixed(2)} AU</span>
                    </div>
                    <input
                      type="range"
                      min={Math.max(0.2, selected.distanceAU * 0.3)}
                      max={selected.distanceAU * 2.2}
                      step={0.05}
                      value={effectiveDistance}
                      onChange={(e) => setDistanceOverride(Number(e.target.value))}
                      className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                    />
                    <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                      Drag distance and watch the year change — real orbital mechanics: farther out means a
                      slower, longer orbit. At this distance, one year on {selected.name} would take about{' '}
                      {effectivePeriod?.toLocaleString()} Earth days.
                    </p>

                    {relativePull !== null && (
                      <>
                        <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                          <span>Sun's pull here</span>
                          <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">
                            {relativePull.toFixed(2)}x Earth's pull
                          </span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--color-surface)]">
                          <div
                            className="h-full rounded-full bg-[color:var(--color-space-deep)] transition-[width]"
                            style={{ width: `${Math.min(100, (relativePull / 8) * 100)}%` }}
                          />
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                          Closer to the Sun = a stronger gravity pull = a faster lap. Farther out = a weaker
                          pull = a slower, longer lap. That pull is why distance changes the year length above.
                        </p>
                      </>
                    )}
                  </>
                )}
                </>
                ) : (
                <div className="space-y-2">
                  {missionSteps.map((step) => (
                    <label
                      key={step.id}
                      className="flex cursor-pointer items-start gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(missionChecks[step.id])}
                        onChange={() =>
                          setMissionChecks((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                        }
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[color:var(--color-space-deep)]"
                      />
                      <span className="text-[11px] leading-relaxed">
                        <span className="mr-1 font-semibold uppercase tracking-wide text-[color:var(--color-space-deep)]">
                          {step.label}:
                        </span>
                        <span className="text-[color:var(--color-foreground)]">{step.prompt}</span>
                      </span>
                    </label>
                  ))}
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    {missionDoneCount}/6 mission steps checked
                  </p>
                </div>
                )}
              </div>
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Planet switcher for every screen size, including mobile, where the ContentNav list in
              the left aside is hidden (lg:block only) — see Wave 6 P1 #1: with no fallback list, a
              mobile learner could only pick a planet by tapping a small, often-moving body in the
              canvas. Picking an item here drives the same selectPlanet() path as the desktop list,
              so the 3D scene visibly recenters/reselects around it. Mirrors BranchLab.tsx's mobile
              component switcher pattern. */}
          <div className="border-b border-[color:var(--color-border)] p-4 lg:hidden">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Planet {planets.findIndex((p) => p.id === selectedId) + 1} of {planets.length}
            </p>
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-1">
              {planets.map((p) => {
                const active = p.id === selectedId
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPlanet(p.id)}
                    title={p.name}
                    aria-current={active}
                    className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-left text-xs font-medium transition-colors"
                    style={
                      active
                        ? {
                            borderColor: 'color-mix(in oklch, var(--color-space-deep) 30%, transparent)',
                            background: 'color-mix(in oklch, var(--color-space-deep) 12%, var(--color-surface-raised))',
                            color: 'var(--color-space-deep)',
                          }
                        : {
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-ink-500)',
                          }
                    }
                  >
                    <Orbit className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                    <span className="max-w-[7rem] truncate">{p.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <DetailPanel
            content={selected}
            activeHotspot={null}
            onClearHotspot={() => {}}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={selected} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal content={selected} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={selected} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal content={selected} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}

function SmallMeter({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/88 px-2 py-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:px-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">{value}</p>
    </div>
  )
}
