import { BookOpen, ListChecks, NotebookPen, Globe2, Star } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useAppStore } from '@/store/useAppStore'
import SaveExperimentButton from './SaveExperimentButton'
import type { ComponentContent } from '@/data/types'

export default function BottomTray({
  content,
  onOpenLesson,
  onOpenQuiz,
  labState,
}: {
  content: ComponentContent
  onOpenLesson: () => void
  onOpenQuiz: () => void
  /**
   * Optional bag of a lab's own live interaction state (active hotspot,
   * isolate/cross-section toggles, etc). No lab route currently passes this
   * in — `BottomTray` only ever receives `content` from every caller today —
   * so "Save experiment" works for every lab with a shallower but always
   * truthful snapshot (component + route + mastery/favorite status). A lab
   * can opt into a richer snapshot later by passing its own state here
   * without any change to this file.
   */
  labState?: Record<string, unknown>
}) {
  const mastery = useAppStore((s) => s.mastery[content.id])
  const notebookCount = useAppStore((s) => s.notebook.length)
  const isFavorited = useAppStore((s) => Boolean(s.favorites[content.id]))
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const location = useLocation()

  function handleToggleFavorite() {
    toggleFavorite({
      id: content.id,
      type: 'lab',
      name: content.name,
      subject: content.subject,
      branch: content.branch,
      path: location.pathname,
    })
  }

  return (
    <div className="relative grid grid-cols-4 items-start gap-2 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-2 sm:grid-cols-5 sm:gap-3 sm:p-3">
      <button
        type="button"
        onClick={handleToggleFavorite}
        aria-pressed={isFavorited}
        aria-label={isFavorited ? `Remove ${content.name} from favorites` : `Add ${content.name} to favorites`}
        className="absolute -top-3 right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-amber-500 shadow-[var(--shadow-tactile)] transition-colors hover:bg-[color:var(--color-surface)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand)]"
      >
        <Star className="h-3.5 w-3.5" strokeWidth={1.75} fill={isFavorited ? 'currentColor' : 'none'} />
      </button>

      <button
        type="button"
        onClick={onOpenLesson}
        className="flex min-h-[5rem] flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-2 text-left transition-colors hover:bg-[color:var(--color-surface)] sm:min-h-0 sm:p-3"
      >
        <BookOpen className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.75} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] sm:text-xs">Lesson</span>
        <span className="text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">
          {content.lesson.steps.length}-step guided walk
        </span>
      </button>

      <button
        type="button"
        onClick={onOpenQuiz}
        className="flex min-h-[5rem] flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-2 text-left transition-colors hover:bg-[color:var(--color-surface)] sm:min-h-0 sm:p-3"
      >
        <ListChecks className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.75} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] sm:text-xs">Checkpoint</span>
        <span className="text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">
          {mastery ? `Mastery ${mastery}/5 — retake` : `${content.quiz.length}-question quiz`}
        </span>
      </button>

      <SaveExperimentButton
        labId={content.id}
        labName={content.name}
        subject={content.subject}
        branch={content.branch}
        route={location.pathname}
        state={{
          mastery: mastery ?? null,
          favorited: isFavorited,
          ...(labState ?? {}),
        }}
      />

      <Link
        to="/app/notebook"
        className="flex min-h-[5rem] flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-2 text-left transition-colors hover:bg-[color:var(--color-surface)] sm:min-h-0 sm:p-3"
      >
        <NotebookPen className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.75} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] sm:text-xs">Notebook</span>
        <span className="text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">
          {notebookCount} saved item{notebookCount === 1 ? '' : 's'}
        </span>
      </Link>

      <div className="hidden flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-3 sm:flex">
        <Globe2 className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.75} />
        <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Real-world</span>
        {/*
          Wave 15 fix (wave14-COMBINED.md P1 #4b): this cell used to remove its height cap at
          `sm:` (`sm:max-h-none`), so a long `whyItMatters` paragraph made this cell -- and the
          whole tray's grid row, since grid rows share height -- grow as tall as the longest
          paragraph across every component on the route (GeneticsLab's `clampCopy` comment
          documented a real 465px-vs-285px swing from this). At short viewports (e.g. a 1024x768
          tablet) that unbounded tray height starves the canvas stage above of vertical space,
          which is what let the CanvasControls toolbar rail's last buttons (Reset among them)
          render past the stage's bottom edge, into the space the tray itself painted over.
          Capping the height at every breakpoint (not just mobile) keeps the tray's height
          bounded and predictable for all ~20 BottomTray consumers, not just the routes that
          happened to add their own per-route clamp. `overflow-y-auto` (replacing bare
          `overflow-hidden`) plus the bottom fade below let a learner still scroll to read a
          longer blurb instead of silently losing the tail of it.
        */}
        <div className="relative w-full">
          <span className="block max-h-[5.5rem] overflow-y-auto text-sm font-medium text-[color:var(--color-foreground)]">
            {content.whyItMatters}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-5 rounded-b-[var(--radius-md)] bg-gradient-to-t from-[color:var(--color-surface-raised)] to-transparent" />
        </div>
      </div>
    </div>
  )
}
