import { useMemo, useState, type ReactNode } from 'react'
import {
  Sparkles,
  Sun,
  Flame,
  CircleDot,
  Radio,
  Zap,
  Radar,
  Atom,
  Telescope,
  Eye,
  HelpCircle,
  ArrowLeftRight,
  MessageCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react'
import { stars, starById, type StarBody } from '@/data/stars'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent } from '@/data/types'
import StarViewer from '@/components/explorer/StarViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { Button } from '@/components/ui/Button'

const hierarchy = HIERARCHY.space
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'stars')
const DEFAULT_CAMERA_DISTANCE = 8.8
const MIN_CAMERA_DISTANCE = 4.2
const MAX_CAMERA_DISTANCE = 16
const ZOOM_STEP = 0.8

const ITEM_ICON: Record<string, LucideIcon> = {
  protostar: Sparkles,
  'main-sequence-star': Sun,
  'red-giant': Flame,
  'white-dwarf': CircleDot,
  'crab-nebula': Radio,
  'cassiopeia-a': Zap,
  'cygnus-loop': Radar,
  g292: Atom,
}

/**
 * Compare resolves through the shared registry first, exactly like the other
 * labs. Stars fall back to their own map so the lab works standalone before the
 * branch is wired into allContent.
 */
function resolveStarCompare(id: string): ComponentContent | null {
  if (!id) return null
  return resolveContent(id) ?? starById[id] ?? null
}

/**
 * The main sequence lesson ("Colour is a thermometer") already states the
 * three bands a star's blackbody colour falls into: ~3,000 K red, ~5,800 K
 * white-yellow, above ~10,000 K blue-white. This buckets any temperatureK
 * into that same authored scale so the causal readout below never invents a
 * number the lesson doesn't already teach.
 */
function colorBandForTemp(kelvin: number): 'red' | 'white-yellow' | 'blue-white' {
  if (kelvin < 4400) return 'red'
  if (kelvin < 7900) return 'white-yellow'
  return 'blue-white'
}

const TEMP_BAND_SWATCH: Record<ReturnType<typeof colorBandForTemp>, string> = {
  red: '#ff7a4a',
  'white-yellow': '#fff3d0',
  'blue-white': '#bcdcff',
}

/** Small colour chip for the lifecycle track — real blackbody colour for the
 *  temperature-driven procedural stars, the model's own tint/emissive for the
 *  NASA-derived remnants and disk, so the chip never claims a temperature the
 *  data doesn't have. */
function stageSwatch(star: StarBody): string {
  if (star.temperatureK) return TEMP_BAND_SWATCH[colorBandForTemp(star.temperatureK)]
  return star.emissiveColor ?? star.surface?.emissive ?? star.surface?.tint ?? '#ffffff'
}

function MissionStep({
  icon: Icon,
  label,
  body,
  action,
}: {
  icon: LucideIcon
  label: string
  body: string
  action?: ReactNode
}) {
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

export default function StarsLab() {
  const [starId, setStarId] = useState(stars[0].id)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [cameraDistance, setCameraDistance] = useState(DEFAULT_CAMERA_DISTANCE)
  const [labelsVisible, setLabelsVisible] = useState(false)
  const [animationAvailable, setAnimationAvailable] = useState(false)
  const [animationPlaying, setAnimationPlaying] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [missionOpen, setMissionOpen] = useState(true)

  const content = starById[starId]
  const compareTarget = resolveStarCompare(content.compareCandidate)
  const activeHotspot = useMemo(
    () => content.hotspots.find((h) => h.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )
  const isolateActive = activeHotspotId !== null

  // Surfaces the consequence of the current stage without inventing new
  // facts: pulls whichever already-authored key fact names a lifespan or
  // duration (main sequence lifetime, red giant duration, etc.) so "how long
  // does this last" reads as a direct answer instead of buried prose.
  const lifespanFact = useMemo(
    () => content.keyFacts.find((f) => /lifetime|duration/i.test(f.label)),
    [content],
  )

  const selectStar = (id: string) => {
    setStarId(id)
    setActiveHotspotId(null)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setAnimationAvailable(false)
    setAnimationPlaying(true)
    setResetSignal((s) => s + 1)
  }

  // Kept short on purpose: this pill is a one-line hint, not a caption. The
  // scientific name and the physics behind the colour are both already in the
  // detail panel, so repeating them here only made the pill wrap onto two lines
  // and collide with the tool rail.
  const captionDetail =
    content.modelType === 'glb'
      ? 'NASA 3D model · tap a hotspot'
      : `${content.temperatureK?.toLocaleString()} K surface · tap a hotspot`

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Space"
            subjectColor="var(--color-space-deep)"
            defaultIcon={Sparkles}
            branchName="Stars"
            items={stars.map((s) => ({
              id: s.id,
              name: s.name,
              meta: s.system,
              icon: ITEM_ICON[s.id],
            }))}
            activeItemId={starId}
            onSelect={selectStar}
            otherBranches={otherBranches}
            footerNote="Five of these are real NASA 3D models built from telescope data. The other three are rendered from published temperatures and radii — a star's colour really is set by how hot its surface is."
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
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
              setActiveHotspotId(null)
              setAutoRotate(true)
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setAnimationPlaying(true)
              setCleanView(false)
              setResetSignal((s) => s + 1)
            }}
          />

          {/* The tool rail is 64px wide at left-4, so it ends at 80px. Capping
              the pill at calc(100% - 11rem) keeps it centred over the canvas
              while guaranteeing its edges can never reach the rail, however
              long the label gets. It truncates rather than wrapping. */}
          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="max-w-[calc(100%-11rem)] truncate rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Tap a hotspot to explore</span>
              <span className="hidden sm:inline">
                {content.name} · {captionDetail}
              </span>
            </div>
          </div>

          <StarViewer
            star={content}
            activeHotspot={activeHotspotId}
            onSelectHotspot={(id) => setActiveHotspotId((cur) => (cur === id ? null : id))}
            autoRotate={autoRotate}
            resetSignal={resetSignal}
            cameraDistance={cameraDistance}
            labelsVisible={labelsVisible}
            animationPlaying={animationPlaying}
            onAnimationAvailability={setAnimationAvailable}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 bottom-4 z-10 flex justify-center px-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] leading-relaxed text-[color:var(--color-ink-500)] backdrop-blur-sm">
              {content.modelType === 'glb'
                ? 'Geometry reconstructed from real telescope observations. Colour is applied for clarity.'
                : 'Radii here are shown on a logarithmic scale so all stages fit one view — the real values are in the facts panel.'}
            </div>
          </div>
        </div>

        <aside className="order-2 min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          {/* Lifecycle track + causal readout: this is the "Change" control for
              every screen size, including mobile, where the branch nav list in
              the left aside is hidden (lg:block only). Picking a stage here
              drives the exact same selectStar() path as the desktop list, so
              the 3D model's colour/size/glow always visibly follows it. */}
          <div className="border-b border-[color:var(--color-border)] p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Lifecycle stage {content.stageOrder} of {stars.length}
            </p>
            <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
              {stars.map((s) => {
                const Icon = ITEM_ICON[s.id]
                const active = s.id === starId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStar(s.id)}
                    title={s.name}
                    aria-current={active}
                    className={`flex shrink-0 flex-col items-center gap-1 rounded-[var(--radius-sm)] border px-2 py-1.5 transition-colors ${
                      active
                        ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]'
                        : 'border-[color:var(--color-border)] text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface)]'
                    }`}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: stageSwatch(s) }} />
                    {Icon ? <Icon className="h-3.5 w-3.5" strokeWidth={1.75} /> : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              {content.temperatureK && (
                <p className="text-[color:var(--color-ink-700)]">
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    {content.temperatureK.toLocaleString()} K surface
                  </span>{' '}
                  → renders {colorBandForTemp(content.temperatureK)} here, the same blackbody colour rule the
                  lesson teaches ("colour is a thermometer").
                </p>
              )}
              {lifespanFact && (
                <p className="text-[color:var(--color-ink-700)]">
                  <span className="font-semibold text-[color:var(--color-foreground)]">{lifespanFact.label}:</span>{' '}
                  {lifespanFact.value}
                </p>
              )}
              {compareTarget && (
                <p className="text-[color:var(--color-ink-700)]">
                  <span className="font-semibold text-[color:var(--color-foreground)]">
                    Where this leads — {compareTarget.name}:
                  </span>{' '}
                  {content.compareReason}
                </p>
              )}
            </div>
          </div>

          {/* Mission sequence: Observe → Predict → Change → Explain → Check,
              built entirely from fields already authored per star (lesson
              steps, predictionPrompt, practiceItem, checkpoint) so it deepens
              existing content instead of adding new astrophysics claims.
              Collapsed by default so it never competes with the 3D view. */}
          <div className="border-b border-[color:var(--color-border)]">
            <button
              type="button"
              onClick={() => setMissionOpen((v) => !v)}
              aria-expanded={missionOpen}
              className="flex w-full items-center justify-between gap-2 p-5 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                <Telescope className="h-3.5 w-3.5" strokeWidth={1.75} />
                Mission: {content.name}
              </span>
              {missionOpen ? (
                <ChevronUp className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              ) : (
                <ChevronDown className="h-4 w-4 text-[color:var(--color-ink-500)]" strokeWidth={1.75} />
              )}
            </button>

            {missionOpen && (
              <div className="space-y-4 px-5 pb-5">
                <MissionStep
                  icon={Eye}
                  label="Observe"
                  body={`Rotate ${content.name} and tap a hotspot on the model to see how it's built.`}
                />
                <MissionStep icon={HelpCircle} label="Predict" body={content.lesson.predictionPrompt} />
                <MissionStep
                  icon={ArrowLeftRight}
                  label="Change"
                  body={
                    compareTarget
                      ? `Tap ${compareTarget.name} in the stage track above (or the Compare tool) and watch the colour, size, and glow change.`
                      : 'Tap a different stage in the track above and watch the colour, size, and glow change.'
                  }
                />
                <MissionStep icon={MessageCircle} label="Explain" body={content.lesson.practiceItem} />
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

          <DetailPanel
            content={content}
            activeHotspot={activeHotspot}
            onClearHotspot={() => setActiveHotspotId(null)}
            onOpenLesson={() => setLessonOpen(true)}
          />
        </aside>
      </div>

      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />

      <LessonModal
        content={content}
        open={lessonOpen}
        onClose={() => setLessonOpen(false)}
        onStartQuiz={() => setQuizOpen(true)}
      />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
      <CompareModal
        content={content}
        candidate={compareTarget}
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
      />
    </div>
  )
}
