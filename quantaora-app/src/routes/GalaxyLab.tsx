import { useEffect, useMemo, useRef, useState } from 'react'
import { Orbit, Disc3, Disc2, Tornado, Aperture, Circle, Sparkles, Grip, Eye, HelpCircle, ArrowLeftRight, MessageCircle, CheckCircle2, type LucideIcon } from 'lucide-react'
import { galaxies, galaxyById } from '@/data/galaxies'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import GalaxyViewer from '@/components/explorer/GalaxyViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { cn } from '@/lib/utils'

const hierarchy = HIERARCHY.space
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'galaxies')
const DEFAULT_CAMERA_DISTANCE = 4.8
const MIN_CAMERA_DISTANCE = 2.4
const MAX_CAMERA_DISTANCE = 14
const ZOOM_STEP = 0.75

// GalaxyViewer's <Canvas> uses a fixed 42° vertical FOV with the camera offset
// above/behind its orbit target (camera y 2.9, target y -0.55 -> 3.45 apart).
// That framing was tuned against the desktop stage's wide aspect ratio. The
// mobile stage is full-width but only ~50svh tall, so it is much narrower
// relative to its height — the same vertical FOV yields far less horizontal
// FOV there, and the galaxy disk / edge hotspots run past the canvas' left and
// right edges. We measure the actual stage aspect ratio and, whenever it is
// narrower than the desktop reference, zoom the camera out just enough to keep
// the same horizontal extent visible (desktop-width stages are left untouched).
const CAMERA_VERTICAL_OFFSET = 3.45 // camera y (2.9) - orbit target y (-0.55)
const VERTICAL_FOV_RAD = (42 * Math.PI) / 180
const REFERENCE_STAGE_ASPECT = 1.2 // approx. desktop stage width / height

function visibleHalfWidth(distance: number, aspect: number) {
  const targetDistance = Math.sqrt(CAMERA_VERTICAL_OFFSET ** 2 + distance ** 2)
  return targetDistance * Math.tan(VERTICAL_FOV_RAD / 2) * aspect
}

function distanceForVisibleHalfWidth(halfWidth: number, aspect: number) {
  const targetDistance = halfWidth / (Math.tan(VERTICAL_FOV_RAD / 2) * aspect)
  return Math.sqrt(Math.max(targetDistance ** 2 - CAMERA_VERTICAL_OFFSET ** 2, 0))
}

const GALAXY_ICON: Record<string, LucideIcon> = {
  'milky-way': Disc3,
  andromeda: Disc2,
  'whirlpool-galaxy': Tornado,
  'sombrero-galaxy': Aperture,
  'elliptical-galaxy': Circle,
  'irregular-galaxy': Sparkles,
  'globular-cluster': Grip,
}

const first = galaxies[0]

export default function GalaxyLab() {
  const [galaxyId, setGalaxyId] = useState(first.id)
  const [branches, setBranches] = useState(first.branches)
  const [spin, setSpin] = useState(first.spin)
  const [density, setDensity] = useState(1)
  const [rotationMode, setRotationMode] = useState<'differential' | 'rigid'>('differential')
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [cleanView, setCleanView] = useState(false)
  const [controlsOpen, setControlsOpen] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)

  const stageRef = useRef<HTMLDivElement | null>(null)
  const [stageAspect, setStageAspect] = useState(REFERENCE_STAGE_ASPECT)

  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const measure = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width > 0 && height > 0) setStageAspect(width / height)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Only widen the framing on stages narrower than the desktop reference —
  // desktop's own aspect ratio is left exactly as before.
  const fittedCameraDistance = useMemo(() => {
    if (stageAspect >= REFERENCE_STAGE_ASPECT) return cameraDistance
    const referenceHalfWidth = visibleHalfWidth(cameraDistance, REFERENCE_STAGE_ASPECT)
    const fitted = distanceForVisibleHalfWidth(referenceHalfWidth, stageAspect)
    return Math.min(MAX_CAMERA_DISTANCE, Number(fitted.toFixed(2)))
  }, [cameraDistance, stageAspect])

  const content = galaxyById[galaxyId]
  // Galaxies are not registered in allContent yet, so resolve inside this branch
  // first and fall back to the global resolver for cross-branch pairings later.
  const compareTarget = content.compareCandidate
    ? (galaxyById[content.compareCandidate] ?? resolveContent(content.compareCandidate))
    : null

  const activeHotspot = useMemo(
    () => content.hotspots.find((h) => h.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const isolateActive = activeHotspotId !== null
  const hasDisk = content.galaxyType === 'spiral' || content.galaxyType === 'barred-spiral' || content.galaxyType === 'irregular'

  // Real disks rotate DIFFERENTIALLY — inner stars sweep round faster than outer
  // ones — which is exactly what the shader already animates via `differential`.
  // Forcing it to 0 here (a local override, not a data change) makes the disk spin
  // as one rigid sheet instead, so flipping this toggle is a live cause/effect
  // experiment in the "arms are a wave, not fixed stars" idea the lessons teach.
  const displayGalaxy = useMemo(() => {
    const adjusted = density === 1 ? content : { ...content, starCount: Math.round(content.starCount * density) }
    if (!hasDisk || rotationMode === 'differential') return adjusted
    return { ...adjusted, differential: 0 }
  }, [content, density, hasDisk, rotationMode])

  const selectGalaxy = (id: string) => {
    const next = galaxyById[id]
    setGalaxyId(id)
    setBranches(next.branches)
    setSpin(next.spin)
    setDensity(1)
    setRotationMode('differential')
    setActiveHotspotId(null)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setControlsOpen(false)
    setResetSignal((s) => s + 1)
  }

  const resetAll = () => {
    setBranches(content.branches)
    setSpin(content.spin)
    setDensity(1)
    setRotationMode('differential')
    setActiveHotspotId(null)
    setAutoRotate(false)
    setAnimationPlaying(true)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setCleanView(false)
    setControlsOpen(false)
    setResetSignal((s) => s + 1)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Space"
            subjectColor="var(--color-space-deep)"
            defaultIcon={Orbit}
            branchName="Galaxies"
            items={galaxies.map((g) => ({
              id: g.id,
              name: g.name,
              meta: g.hubbleType,
              icon: GALAXY_ICON[g.id],
            }))}
            activeItemId={galaxyId}
            onSelect={selectGalaxy}
            otherBranches={otherBranches}
            footerNote="No galaxy is a solid object, so none of these is a downloaded model — each is tens of thousands of point-lights generated live from real structural parameters, rotating on a flat rotation curve."
          />
        </aside>

        <div ref={stageRef} data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[50svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() =>
              setActiveHotspotId((id) => (id ? null : (content.hotspots[0]?.id ?? null)))
            }
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
            animationAvailable
            animationPlaying={animationPlaying}
            onToggleAnimation={() => setAnimationPlaying((v) => !v)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((v) => !v)}
            onFitView={() => {
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setResetSignal((s) => s + 1)
            }}
            onReset={resetAll}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-0 flex justify-center px-4 sm:top-4 sm:z-10">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Tap a marker to explore</span>
              <span className="hidden sm:inline">
                {content.name} · {content.hubbleType} · {content.starCount.toLocaleString()} rendered stars · drag to orbit
              </span>
            </div>
          </div>

          <GalaxyViewer
            galaxy={displayGalaxy}
            branches={branches}
            spin={spin}
            autoRotate={autoRotate}
            animationPlaying={animationPlaying}
            activeHotspot={activeHotspotId}
            onSelectHotspot={(id) => setActiveHotspotId((cur) => (cur === id ? null : id))}
            resetSignal={resetSignal}
            cameraDistance={fittedCameraDistance}
            labelsVisible={labelsVisible}
          />

          <div
            data-canvas-overlay
            className={cn(
              'absolute z-10',
              controlsOpen
                ? 'bottom-4 right-4 w-[min(calc(100%-2rem),300px)]'
                : 'bottom-4 right-3 sm:right-4',
            )}
          >
            {!controlsOpen ? (
              <button
                type="button"
                onClick={() => setControlsOpen(true)}
                className="inline-flex h-11 items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 text-sm font-semibold text-[color:var(--color-foreground)] shadow-[var(--shadow-tactile)]"
              >
                Tune galaxy
              </button>
            ) : hasDisk ? (
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-tactile)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Galaxy structure</span>
                  <button
                    type="button"
                    onClick={() => setControlsOpen(false)}
                    className="text-xs font-semibold text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]"
                  >
                    Hide
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-medium text-[color:var(--color-ink-500)]">Spiral arms</span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] text-[color:var(--color-foreground)]">
                    {branches} arms
                  </span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={6}
                  step={1}
                  value={branches}
                  onChange={(e) => setBranches(Number(e.target.value))}
                  className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                  aria-label="Number of spiral arms"
                />

                <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                  <span>Winding (spin)</span>
                  <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">
                    {Math.round((spin * 180) / Math.PI)}° sweep
                  </span>
                </div>
                <input
                  type="range"
                  min={0.4}
                  max={7}
                  step={0.1}
                  value={spin}
                  onChange={(e) => setSpin(Number(e.target.value))}
                  className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                  aria-label="Spiral arm winding"
                />

                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  Winding is how far an arm sweeps around between the core and the rim. Real spirals
                  run from loose (Sc) to tightly wound (Sa) — {content.name} sits near{' '}
                  {Math.round((content.spin * 180) / Math.PI)}°.
                </p>

                <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-[color:var(--color-ink-500)]">
                  <span>Star density</span>
                  <span className="font-[family-name:var(--font-mono)] text-[color:var(--color-foreground)]">
                    {Math.round(density * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.35}
                  max={1.5}
                  step={0.05}
                  value={density}
                  onChange={(e) => setDensity(Number(e.target.value))}
                  className="mt-2 w-full accent-[color:var(--color-space-deep)]"
                  aria-label="Star density"
                />
                <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  Change density and watch the number of rendered stars, bright core, and arm contrast respond.
                </p>

                <div className="mt-4 border-t border-[color:var(--color-border)] pt-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    Mission: real spin vs. rigid spin
                  </span>
                  <div className="mt-2 flex gap-1 rounded-full bg-[color:var(--color-surface)] p-1">
                    <button
                      type="button"
                      onClick={() => setRotationMode('differential')}
                      aria-pressed={rotationMode === 'differential'}
                      className={cn(
                        'flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors',
                        rotationMode === 'differential'
                          ? 'bg-[color:var(--color-space-deep)] text-white'
                          : 'text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]',
                      )}
                    >
                      Real (differential)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotationMode('rigid')}
                      aria-pressed={rotationMode === 'rigid'}
                      className={cn(
                        'flex-1 rounded-full px-2 py-1.5 text-[11px] font-semibold transition-colors',
                        rotationMode === 'rigid'
                          ? 'bg-[color:var(--color-space-deep)] text-white'
                          : 'text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]',
                      )}
                    >
                      Rigid (no shear)
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                    {rotationMode === 'differential' ? (
                      <>
                        <span className="font-medium text-[color:var(--color-foreground)]">Predict, then press Play:</span>{' '}
                        inner stars sweep round faster than outer ones here — the real rotation law. Let it
                        spin for a few seconds and watch the arms smear out of shape.
                      </>
                    ) : (
                      <>
                        <span className="font-medium text-[color:var(--color-foreground)]">Explain what changed:</span>{' '}
                        every star now turns at the same speed, so the arms stay locked in place like a
                        spinning record. No real disk rotates this way — this override only exists so you can
                        see why astronomers know spiral arms can’t be fixed strings of stars.
                      </>
                    )}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-tactile)]">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Galaxy structure</span>
                  <button
                    type="button"
                    onClick={() => setControlsOpen(false)}
                    className="text-xs font-semibold text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]"
                  >
                    Hide
                  </button>
                </div>
                <p className="text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
                  <span className="font-medium text-[color:var(--color-foreground)]">No disk, no arms.</span>{' '}
                  {content.name} has no shared orbital plane — its stars travel in every direction at
                  once, so there is nothing for a spiral pattern to form in. The arm controls only
                  apply to disk galaxies.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Mission: read the galaxy</p>
            <div className="mt-4 space-y-4">
              <div className="flex items-start gap-2.5"><Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" /><p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]"><b>Observe:</b> orbit the {content.name} and tap a hotspot to find its structure.</p></div>
              <div className="flex items-start gap-2.5"><HelpCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" /><p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]"><b>Predict:</b> will tighter arms, faster rotation, or more stars make the pattern easier to see?</p></div>
              <div className="flex items-start gap-2.5"><ArrowLeftRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" /><p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]"><b>Change:</b> tune arms, winding, density, and rotation, then compare with {compareTarget?.name ?? 'another galaxy'}.</p></div>
              <div className="flex items-start gap-2.5"><MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" /><p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]"><b>Explain:</b> {content.lesson.practiceItem}</p></div>
              <div className="flex items-start gap-2.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" /><p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]"><b>Challenge:</b> {content.lesson.checkpoint}</p></div>
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
