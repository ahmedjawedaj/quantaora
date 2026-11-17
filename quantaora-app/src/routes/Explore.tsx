import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useProgress } from '@react-three/drei'
import {
  Heart,
  Brain,
  Wind,
  Droplet,
  Eye,
  Waves,
  Zap,
  Layers,
  Filter,
  Rocket,
  UserRound,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  MousePointerClick,
  MessageSquareText,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { organs, organById } from '@/data/organs'
import { HIERARCHY } from '@/data/hierarchy'
import { resolveContent } from '@/data/allContent'
import type { ComponentContent } from '@/data/types'
import OrganViewer from '@/components/explorer/OrganViewer'
import CanvasControls from '@/components/explorer/CanvasControls'
import DetailPanel from '@/components/explorer/DetailPanel'
import ContentNav from '@/components/explorer/ContentNav'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'
import CompareModal from '@/components/explorer/CompareModal'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'

type InvestigateStepId = 'observe' | 'predict' | 'inspect' | 'explain' | 'check'

const INVESTIGATE_STEPS: { id: InvestigateStepId; label: string; icon: LucideIcon }[] = [
  { id: 'observe', label: 'Observe', icon: Eye },
  { id: 'predict', label: 'Predict', icon: HelpCircle },
  { id: 'inspect', label: 'Change it', icon: MousePointerClick },
  { id: 'explain', label: 'Explain', icon: MessageSquareText },
  { id: 'check', label: 'Check', icon: CheckCircle2 },
]

/** Compact, collapsible Observe -> Predict -> Change -> Explain -> Check layer.
 *  Lives in the side panel column only — never overlaps the 3D stage — and drives
 *  the same isolate/section/labels state the canvas toolbar already exposes. */
function InvestigationGuide({
  content,
  activeHotspotId,
  onCycleHotspot,
  crossSection,
  onToggleCrossSection,
  labelsVisible,
  onToggleLabels,
  onOpenLesson,
  onOpenQuiz,
}: {
  content: ComponentContent
  activeHotspotId: string | null
  onCycleHotspot: () => void
  crossSection: boolean
  onToggleCrossSection: () => void
  labelsVisible: boolean
  onToggleLabels: () => void
  onOpenLesson: () => void
  onOpenQuiz: () => void
}) {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [prediction, setPrediction] = useState('')
  const step = INVESTIGATE_STEPS[stepIndex]
  const StepIcon = step.icon
  const activeHotspot = content.hotspots.find((h) => h.id === activeHotspotId) ?? null
  const chipClass =
    'rounded-full border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-brand)]'
  const chipActiveClass = 'border-[color:var(--color-brand)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]'

  return (
    <div className="shrink-0 border-b border-[color:var(--color-border)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-6 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          <StepIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
          Guided investigation · {step.label}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-[color:var(--color-ink-500)]" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-[color:var(--color-ink-500)]" />
        )}
      </button>

      {open && (
        <div className="px-6 pb-4">
          <div className="mb-3 flex gap-1">
            {INVESTIGATE_STEPS.map((s, i) => (
              <span
                key={s.id}
                className="h-1 flex-1 rounded-full"
                style={{ background: i <= stepIndex ? 'var(--color-brand)' : 'var(--color-border)' }}
              />
            ))}
          </div>

          {step.id === 'observe' && (
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
              Drag or auto-rotate the {content.name.toLowerCase()} and look at its overall shape. What parts stand
              out before you touch anything?
            </p>
          )}

          {step.id === 'predict' && (
            <div>
              <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">{content.lesson.predictionPrompt}</p>
              <textarea
                value={prediction}
                onChange={(e) => setPrediction(e.target.value)}
                placeholder="Type your guess (optional)"
                rows={2}
                className="mt-2 w-full resize-none rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2 text-sm text-[color:var(--color-foreground)] placeholder:text-[color:var(--color-ink-300)] focus:outline-none focus:ring-1 focus:ring-[color:var(--color-brand)]"
              />
            </div>
          )}

          {step.id === 'inspect' && (
            <div>
              <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                Test your prediction — isolate a structure, slice a cross-section, or reveal labels.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={onCycleHotspot} className={chipClass + (activeHotspot ? ` ${chipActiveClass}` : '')}>
                  {activeHotspot ? `Next structure (${activeHotspot.label})` : 'Isolate a structure'}
                </button>
                <button type="button" onClick={onToggleCrossSection} className={chipClass + (crossSection ? ` ${chipActiveClass}` : '')}>
                  Cross-section
                </button>
                <button type="button" onClick={onToggleLabels} className={chipClass + (labelsVisible ? ` ${chipActiveClass}` : '')}>
                  Show labels
                </button>
              </div>
            </div>
          )}

          {step.id === 'explain' && (
            <div>
              <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                {activeHotspot ? activeHotspot.function : content.whyItMatters}
              </p>
              <button
                type="button"
                onClick={onOpenLesson}
                className="mt-2 text-xs font-semibold text-[color:var(--color-brand)] hover:underline"
              >
                Open the full lesson
              </button>
            </div>
          )}

          {step.id === 'check' && (
            <div>
              <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                Ready to check what you noticed? {content.lesson.checkpoint}
              </p>
              <Button size="sm" className="mt-2 w-full" onClick={onOpenQuiz}>
                Take the quick check
              </Button>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(i - 1, 0))}
              disabled={stepIndex === 0}
              className="text-xs font-medium text-[color:var(--color-ink-500)] disabled:opacity-30"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.min(i + 1, INVESTIGATE_STEPS.length - 1))}
              disabled={stepIndex === INVESTIGATE_STEPS.length - 1}
              className="text-xs font-semibold text-[color:var(--color-brand)] disabled:opacity-30"
            >
              Next step
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ICONS: Record<string, typeof Heart> = {
  heart: Heart,
  brain: Brain,
  lungs: Wind,
  liver: Droplet,
  kidneys: Filter,
  eyeball: Eye,
  intestine: Waves,
  pancreas: Zap,
  skin: Layers,
}

const hierarchy = HIERARCHY.biology
const otherBranches = hierarchy.branches.filter((b) => b.id !== 'human-anatomy')
const DEFAULT_CAMERA_DISTANCE = 8.2
const MIN_CAMERA_DISTANCE = 4.8
const MAX_CAMERA_DISTANCE = 12
const ZOOM_STEP = 0.7

/** Tracks whether the very first 3D specimen has finished loading, using drei's global
 *  loading-manager progress (works without reaching into OrganViewer's own Suspense boundary).
 *  Stays true forever once reached — later organ switches use OrganViewer's own fallback pill. */
function useInitialModelReady() {
  const { active, progress } = useProgress()
  const [ready, setReady] = useState(false)
  const startedRef = useRef(false)

  useEffect(() => {
    if (active) startedRef.current = true
  }, [active])

  useEffect(() => {
    if (ready) return
    if (startedRef.current) {
      if (!active && progress >= 100) {
        const timer = setTimeout(() => setReady(true), 200)
        return () => clearTimeout(timer)
      }
      return
    }
    // Nothing has started loading yet (e.g. already cached) — reveal after a short grace window.
    const timer = setTimeout(() => setReady(true), 450)
    return () => clearTimeout(timer)
  }, [active, progress, ready])

  return { ready, progress: Math.min(100, Math.round(progress)) }
}

/** Skeleton shown over the 3D stage until the first specimen finishes loading. Absolutely
 *  positioned inside the already-sized `data-lab-stage` container, so it never shifts layout. */
function OrganCanvasSkeleton({ visible, progress }: { visible: boolean; progress: number }) {
  return (
    <div
      aria-hidden={!visible}
      style={{ backgroundColor: '#faf8f4' }}
      className={`absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 transition-opacity duration-500 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute h-24 w-24 rounded-full border-2 border-t-transparent border-[color:var(--color-biology-deep)]/45 motion-safe:animate-spin" />
        <span className="h-16 w-16 rounded-full bg-[color:var(--color-biology-deep)]/15 motion-safe:animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          Loading 3D specimen{progress > 0 ? `… ${progress}%` : '…'}
        </p>
        <div className="h-1 w-36 overflow-hidden rounded-full bg-[color:var(--color-border)]">
          <div
            className="h-full rounded-full bg-[color:var(--color-biology-deep)]/70 transition-[width]"
            style={{ width: `${Math.max(8, progress)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Explore() {
  const learnerProfile = useAppStore((s) => s.learnerProfile)
  const lastVisitedLab = useAppStore((s) => s.lastVisitedLab)
  const mastery = useAppStore((s) => s.mastery)
  const [organId, setOrganId] = useState(organs[0].id)
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null)
  const [autoRotate, setAutoRotate] = useState(true)
  const [crossSection, setCrossSection] = useState(false)
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
  const { ready: canvasReady, progress: canvasProgress } = useInitialModelReady()

  const content = organById[organId]
  const compareTarget = content.compareCandidate ? resolveContent(content.compareCandidate) : null
  const recommendedBranch = useMemo(
    () =>
      learnerProfile
        ? Object.values(HIERARCHY)
            .flatMap((subject) => subject.branches)
            .find((branch) => branch.route === learnerProfile.recommendedLab)
        : undefined,
    [learnerProfile],
  )
  const primaryNextLab = lastVisitedLab
    ? { path: lastVisitedLab.path, name: lastVisitedLab.name }
    : recommendedBranch
      ? { path: recommendedBranch.route!, name: recommendedBranch.name }
      : null
  const attemptedCount = Object.keys(mastery).length

  const activeHotspot = useMemo(
    () => content.hotspots.find((h) => h.id === activeHotspotId) ?? null,
    [content, activeHotspotId],
  )

  const isolateActive = activeHotspotId !== null

  const cycleHotspot = () => {
    setActiveHotspotId((cur) => {
      const ids = content.hotspots.map((h) => h.id)
      if (!cur) return ids[0] ?? null
      const idx = ids.indexOf(cur)
      return ids[(idx + 1) % ids.length]
    })
  }

  const selectOrgan = (id: string) => {
    setOrganId(id)
    setActiveHotspotId(null)
    setCrossSection(false)
    setAutoRotate(true)
    setCameraDistance(DEFAULT_CAMERA_DISTANCE)
    setXrayActive(false)
    setAnimationAvailable(false)
    setAnimationPlaying(true)
    setResetSignal((s) => s + 1)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="shrink-0 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-3">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]">
              <UserRound className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--color-foreground)]">
                {learnerProfile ? `${learnerProfile.name}'s learning path` : 'Set up a learning path'}
              </p>
              <p className="truncate text-xs text-[color:var(--color-ink-500)]">
                {learnerProfile
                  ? `Grade ${learnerProfile.grade} · ${attemptedCount} component${attemptedCount === 1 ? '' : 's'} attempted`
                  : 'First Flight recommends a starting lab and stores progress locally.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={primaryNextLab?.path ?? '/first-flight'}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              <Rocket className="h-4 w-4" strokeWidth={1.8} />
              {primaryNextLab ? `Continue ${primaryNextLab.name}` : 'Start First Flight'}
            </Link>
            <Link
              to="/app/labs"
              className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-brand)]"
            >
              Browse labs
              <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
            </Link>
          </div>
        </div>
      </section>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden shrink-0 overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-1 lg:block lg:w-[260px]">
          <ContentNav
            subjectName="Biology"
            subjectColor="var(--color-biology-deep)"
            defaultIcon={Heart}
            branchName="Human Anatomy"
            items={organs.map((o) => ({ id: o.id, name: o.name, meta: o.system, icon: ICONS[o.id] }))}
            activeItemId={organId}
            onSelect={selectOrgan}
            otherBranches={otherBranches}
            footerNote={
              <>
                9 fully modeled organs.{' '}
                <Link to="/app/labs/branch/human-anatomy" className="font-medium underline underline-offset-2">
                  9 more anatomy topics
                </Link>{' '}
                (blood vessels, bones, ear, eye, intestines, muscles, spleen, stomach) are text-and-diagram only for now.
              </>
            }
          />
        </aside>

        <div data-lab-stage data-clean-view={cleanView ? 'true' : undefined} className="relative order-1 h-[46svh] shrink-0 lg:order-2 lg:h-auto lg:flex-1">
          <OrganCanvasSkeleton visible={!canvasReady} progress={canvasProgress} />

          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((v) => !v)}
            isolateActive={isolateActive}
            onToggleIsolate={() => setActiveHotspotId((id) => (id ? null : content.hotspots[0].id))}
            crossSection={crossSection}
            onToggleCrossSection={() => setCrossSection((v) => !v)}
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
              setActiveHotspotId(null)
              setCrossSection(false)
              setAutoRotate(true)
              setCameraDistance(DEFAULT_CAMERA_DISTANCE)
              setXrayActive(false)
              setAnimationPlaying(true)
              setCleanView(false)
              setResetSignal((s) => s + 1)
            }}
          />

          <div data-canvas-overlay className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center px-4 sm:top-4">
            <div className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/90 px-3.5 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-[color:var(--color-ink-500)] backdrop-blur-sm">
              <span className="sm:hidden">Touch a dot to explore</span>
              <span className="hidden sm:inline">3D specimen · drag to rotate · click a dot to explore</span>
            </div>
          </div>

          <OrganViewer
            model={content.model}
            hotspots={content.hotspots}
            activeHotspot={activeHotspotId}
            onSelectHotspot={(id) => setActiveHotspotId((cur) => (cur === id ? null : id))}
            crossSection={crossSection}
            autoRotate={autoRotate}
            resetSignal={resetSignal}
            cameraDistance={cameraDistance}
            labelsVisible={labelsVisible}
            xrayActive={xrayActive}
            animationPlaying={animationPlaying}
            onAnimationAvailability={setAnimationAvailable}
          />
        </div>

        <aside className="order-2 flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] lg:order-3 lg:w-[360px] lg:flex-none lg:border-l lg:border-t-0">
          <InvestigationGuide
            key={organId}
            content={content}
            activeHotspotId={activeHotspotId}
            onCycleHotspot={cycleHotspot}
            crossSection={crossSection}
            onToggleCrossSection={() => setCrossSection((v) => !v)}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((v) => !v)}
            onOpenLesson={() => setLessonOpen(true)}
            onOpenQuiz={() => setQuizOpen(true)}
          />
          <div className="min-h-0 flex-1">
            <DetailPanel
              content={content}
              activeHotspot={activeHotspot}
              onClearHotspot={() => setActiveHotspotId(null)}
              onOpenLesson={() => setLessonOpen(true)}
            />
          </div>
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
      <CompareModal content={content} candidate={compareTarget} open={compareOpen} onClose={() => setCompareOpen(false)} />
    </div>
  )
}
