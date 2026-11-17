import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  NotebookPen,
  Trash2,
  Star,
  CheckCircle2,
  Camera,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

type TabId = 'notes' | 'quizzes' | 'favorites' | 'completed' | 'snapshots'

/** Renders a saved-experiment state value compactly and honestly — no invented precision. */
function formatSnapshotValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'string') return value.length > 40 ? `${value.slice(0, 37)}…` : value
  if (typeof value === 'number') return String(value)
  try {
    const json = JSON.stringify(value)
    return json.length > 40 ? `${json.slice(0, 37)}…` : json
  } catch {
    return String(value)
  }
}

function EmptyState({ icon: Icon, message }: { icon: typeof NotebookPen; message: string }) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-[var(--radius-lg)] border border-dashed border-[color:var(--color-border)] py-16 text-center">
      <Icon className="h-8 w-8 text-[color:var(--color-ink-300)]" strokeWidth={1.5} />
      <p className="mt-4 max-w-xs text-sm text-[color:var(--color-ink-500)]">{message}</p>
    </div>
  )
}

function SubjectFilter({
  subjects,
  value,
  onChange,
}: {
  subjects: string[]
  value: string
  onChange: (value: string) => void
}) {
  if (subjects.length <= 1) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onChange('all')}
        className={cn(
          'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
          value === 'all'
            ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]'
            : 'border-[color:var(--color-border)] text-[color:var(--color-ink-500)] hover:border-[color:var(--color-ink-300)]',
        )}
      >
        All
      </button>
      {subjects.map((subject) => (
        <button
          key={subject}
          type="button"
          onClick={() => onChange(subject)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            value === subject
              ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand)]/10 text-[color:var(--color-brand)]'
              : 'border-[color:var(--color-border)] text-[color:var(--color-ink-500)] hover:border-[color:var(--color-ink-300)]',
          )}
        >
          {subject}
        </button>
      ))}
    </div>
  )
}

const TABS: { id: TabId; label: string; icon: typeof NotebookPen }[] = [
  { id: 'notes', label: 'Notes', icon: NotebookPen },
  { id: 'quizzes', label: 'Quiz history', icon: Award },
  { id: 'favorites', label: 'Favorites', icon: Star },
  { id: 'completed', label: 'Completed labs', icon: CheckCircle2 },
  { id: 'snapshots', label: 'Saved experiments', icon: Camera },
]

export default function Notebook() {
  const notebook = useAppStore((s) => s.notebook)
  const removeFromNotebook = useAppStore((s) => s.removeFromNotebook)
  const quizResults = useAppStore((s) => s.quizResults)
  const favorites = useAppStore((s) => s.favorites)
  const removeFavorite = useAppStore((s) => s.removeFavorite)
  const completedLabs = useAppStore((s) => s.completedLabs)
  const unmarkLabCompleted = useAppStore((s) => s.unmarkLabCompleted)
  const experimentSnapshots = useAppStore((s) => s.experimentSnapshots)
  const removeExperimentSnapshot = useAppStore((s) => s.removeExperimentSnapshot)
  const renameExperimentSnapshot = useAppStore((s) => s.renameExperimentSnapshot)

  const [tab, setTab] = useState<TabId>('notes')
  const [query, setQuery] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [editingSnapshotId, setEditingSnapshotId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  function startRenamingSnapshot(id: string, currentTitle: string) {
    setEditingSnapshotId(id)
    setEditingTitle(currentTitle)
  }

  function commitSnapshotRename() {
    const title = editingTitle.trim()
    if (editingSnapshotId && title.length > 0) {
      renameExperimentSnapshot(editingSnapshotId, title)
    }
    setEditingSnapshotId(null)
    setEditingTitle('')
  }

  function cancelSnapshotRename() {
    setEditingSnapshotId(null)
    setEditingTitle('')
  }

  // The tab strip can overflow its width on both narrow (mobile) and
  // constrained (desktop) viewports. It scrolls horizontally, but a plain
  // overflow-x-auto row gives no visual hint that more tabs exist off-screen,
  // so track scroll position to show fade + arrow affordances at whichever
  // edge still has hidden content.
  const tabScrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateTabScrollState = useCallback(() => {
    const el = tabScrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateTabScrollState()
    window.addEventListener('resize', updateTabScrollState)
    return () => window.removeEventListener('resize', updateTabScrollState)
  }, [updateTabScrollState])

  function scrollTabs(direction: 'left' | 'right') {
    tabScrollRef.current?.scrollBy({ left: direction === 'left' ? -140 : 140, behavior: 'smooth' })
  }

  const favoritesList = useMemo(
    () => Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt),
    [favorites],
  )
  const completedList = useMemo(
    () => Object.values(completedLabs).sort((a, b) => b.lastCompletedAt - a.lastCompletedAt),
    [completedLabs],
  )

  const subjectsForTab = useMemo(() => {
    const source =
      tab === 'notes'
        ? notebook.map((n) => n.subject)
        : tab === 'favorites'
          ? favoritesList.map((f) => f.subject)
          : tab === 'completed'
            ? completedList.map((c) => c.subject)
            : tab === 'snapshots'
              ? experimentSnapshots.map((s) => s.subject)
              : []
    return Array.from(new Set(source)).sort()
  }, [tab, notebook, favoritesList, completedList, experimentSnapshots])

  const filteredNotebook = useMemo(() => {
    const q = query.trim().toLowerCase()
    return notebook.filter((n) => {
      const matchesSubject = subjectFilter === 'all' || n.subject === subjectFilter
      const matchesQuery =
        !q || n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q) || n.conceptName.toLowerCase().includes(q)
      return matchesSubject && matchesQuery
    })
  }, [notebook, query, subjectFilter])

  const filteredFavorites = useMemo(
    () => favoritesList.filter((f) => subjectFilter === 'all' || f.subject === subjectFilter),
    [favoritesList, subjectFilter],
  )
  const filteredCompleted = useMemo(
    () => completedList.filter((c) => subjectFilter === 'all' || c.subject === subjectFilter),
    [completedList, subjectFilter],
  )
  const filteredSnapshots = useMemo(
    () => experimentSnapshots.filter((s) => subjectFilter === 'all' || s.subject === subjectFilter),
    [experimentSnapshots, subjectFilter],
  )

  const quizHistory = useMemo(() => [...quizResults].sort((a, b) => b.completedAt - a.completedAt), [quizResults])

  const counts: Record<TabId, number> = {
    notes: notebook.length,
    quizzes: quizResults.length,
    favorites: favoritesList.length,
    completed: completedList.length,
    snapshots: experimentSnapshots.length,
  }

  // Reset subject filter (which is scoped per-tab) whenever the tab changes.
  function handleTabChange(next: TabId) {
    setTab(next)
    setSubjectFilter('all')
  }

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
          Notebook
        </h1>
        <p className="mt-2 text-[color:var(--color-ink-500)]">
          Everything you save stays on this device — notes, favorites, completed labs, saved
          experiments, and quiz history.
        </p>

        <div className="relative mt-6">
          <div
            ref={tabScrollRef}
            onScroll={updateTabScrollState}
            className="flex gap-1.5 overflow-x-auto pb-1"
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => handleTabChange(id)}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                  tab === id
                    ? 'border-[color:var(--color-brand)] bg-[color:var(--color-brand)] text-[color:var(--color-paper-50)]'
                    : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)] hover:border-[color:var(--color-ink-300)]',
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                {label}
                <span
                  className={cn(
                    'ml-0.5 rounded-full px-1.5 text-xs',
                    tab === id ? 'bg-white/20' : 'bg-[color:var(--color-surface)]',
                  )}
                >
                  {counts[id]}
                </span>
              </button>
            ))}
          </div>

          {canScrollLeft && (
            <>
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[color:var(--color-background)] to-transparent" />
              <button
                type="button"
                onClick={() => scrollTabs('left')}
                aria-label="Scroll tabs left"
                className="absolute left-0.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] transition-colors hover:text-[color:var(--color-foreground)]"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          )}

          {canScrollRight && (
            <>
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[color:var(--color-background)] to-transparent" />
              <button
                type="button"
                onClick={() => scrollTabs('right')}
                aria-label="Scroll tabs right"
                className="absolute right-0.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-ink-500)] shadow-[var(--shadow-tactile)] transition-colors hover:text-[color:var(--color-foreground)]"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {tab === 'notes' && (
          <div className="relative mt-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-300)]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] py-2 pl-9 pr-4 text-sm text-[color:var(--color-foreground)] outline-none focus:border-[color:var(--color-brand)]"
            />
          </div>
        )}

        {tab !== 'quizzes' && subjectsForTab.length > 1 && (
          <div className="mt-4">
            <SubjectFilter subjects={subjectsForTab} value={subjectFilter} onChange={setSubjectFilter} />
          </div>
        )}

        {tab === 'notes' &&
          (filteredNotebook.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              message={
                notebook.length === 0
                  ? 'Nothing saved yet. Open a lab, select a structure, and hit "Save to notebook."'
                  : 'No notes match your search or filter.'
              }
            />
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {filteredNotebook.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
                      {entry.subject}
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                      {entry.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{entry.body}</p>
                    <p className="mt-2 text-[11px] text-[color:var(--color-ink-300)]">
                      Saved {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromNotebook(entry.id)}
                    aria-label={`Remove ${entry.title} from notebook`}
                    className="shrink-0 rounded-full p-2 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'quizzes' &&
          (quizHistory.length === 0 ? (
            <EmptyState icon={Award} message="No quizzes taken yet. Finish a lab quiz to see your history here." />
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {quizHistory.map((result, idx) => {
                const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
                return (
                  <div
                    key={`${result.componentId}-${result.completedAt}-${idx}`}
                    className="flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
                  >
                    <div>
                      <h3 className="font-[family-name:var(--font-display)] text-base text-[color:var(--color-foreground)]">
                        {result.componentId}
                      </h3>
                      <p className="mt-1 text-[11px] text-[color:var(--color-ink-300)]">
                        {new Date(result.completedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={cn(
                          'rounded-full px-3 py-1 text-sm font-semibold',
                          pct >= 80
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : pct >= 50
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-500',
                        )}
                      >
                        {result.score}/{result.total} · {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

        {tab === 'favorites' &&
          (filteredFavorites.length === 0 ? (
            <EmptyState
              icon={Star}
              message={
                favoritesList.length === 0
                  ? 'No favorites yet. Star a lab or concept to keep it handy here.'
                  : 'No favorites match this filter.'
              }
            />
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {filteredFavorites.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
                      {item.subject} · {item.type}
                    </span>
                    <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-[11px] text-[color:var(--color-ink-300)]">
                      Added {new Date(item.addedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFavorite(item.id)}
                    aria-label={`Remove ${item.name} from favorites`}
                    className="shrink-0 rounded-full p-2 text-amber-500 transition-colors hover:bg-[color:var(--color-surface)]"
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'completed' &&
          (filteredCompleted.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              message={
                completedList.length === 0
                  ? 'No labs marked complete yet. Finish a lab to track it here.'
                  : 'No completed labs match this filter.'
              }
            />
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {filteredCompleted.map((lab) => (
                <div
                  key={lab.labId}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" strokeWidth={2} />
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
                        {lab.subject}
                      </span>
                      <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                        {lab.labName}
                      </h3>
                      <p className="mt-2 text-[11px] text-[color:var(--color-ink-300)]">
                        Completed {lab.timesCompleted}× · last on {new Date(lab.lastCompletedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => unmarkLabCompleted(lab.labId)}
                    aria-label={`Unmark ${lab.labName} as completed`}
                    className="shrink-0 rounded-full p-2 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'snapshots' &&
          (filteredSnapshots.length === 0 ? (
            <EmptyState
              icon={Camera}
              message={
                experimentSnapshots.length === 0
                  ? 'No saved experiments yet. Save a lab\'s current setup to revisit it later.'
                  : 'No saved experiments match this filter.'
              }
            />
          ) : (
            <div className="mt-6 flex flex-col gap-3">
              {filteredSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="flex items-start justify-between gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
                >
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-brand)]">
                      {snap.subject} · {snap.labName}
                    </span>
                    {editingSnapshotId === snap.id ? (
                      <div className="mt-1 flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitSnapshotRename()
                            if (e.key === 'Escape') cancelSnapshotRename()
                          }}
                          autoFocus
                          aria-label={`Rename saved experiment ${snap.title}`}
                          className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand)]"
                        />
                        <button
                          type="button"
                          onClick={commitSnapshotRename}
                          aria-label="Save name"
                          className="shrink-0 rounded-full p-1.5 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-emerald-500"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelSnapshotRename}
                          aria-label="Cancel rename"
                          className="shrink-0 rounded-full p-1.5 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-rose-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center gap-1.5">
                        <h3 className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                          {snap.title}
                        </h3>
                        <button
                          type="button"
                          onClick={() => startRenamingSnapshot(snap.id, snap.title)}
                          aria-label={`Rename saved experiment ${snap.title}`}
                          className="shrink-0 rounded-full p-1 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-[color:var(--color-brand)]"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                    {Object.keys(snap.state).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {Object.entries(snap.state).map(([key, value]) => (
                          <span
                            key={key}
                            className="rounded-full bg-[color:var(--color-surface)] px-2 py-0.5 text-[11px] text-[color:var(--color-ink-500)]"
                          >
                            {key}: {formatSnapshotValue(value)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-2 text-[11px] text-[color:var(--color-ink-300)]">
                      Saved {new Date(snap.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingSnapshotId === snap.id) cancelSnapshotRename()
                      removeExperimentSnapshot(snap.id)
                    }}
                    aria-label={`Delete saved experiment ${snap.title}`}
                    className="shrink-0 rounded-full p-2 text-[color:var(--color-ink-300)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
