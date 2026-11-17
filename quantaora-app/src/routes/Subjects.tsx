import { useMemo, useState } from 'react'
import { Atom, FlaskConical, Sigma, Dna, Orbit, Clock, ChevronDown, Search, X, CheckCircle2, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import { HIERARCHY, type BranchInfo, type SubjectHierarchy } from '@/data/hierarchy'
import { branchComponents } from '@/data/branchModules'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import type { SubjectId } from '@/data/types'

const SUBJECTS: { id: SubjectId; icon: typeof Atom; deep: string }[] = [
  { id: 'biology', icon: Dna, deep: 'var(--color-biology-deep)' },
  { id: 'physics', icon: Atom, deep: 'var(--color-physics-deep)' },
  { id: 'chemistry', icon: FlaskConical, deep: 'var(--color-chemistry-deep)' },
  { id: 'math', icon: Sigma, deep: 'var(--color-math-deep)' },
  { id: 'space', icon: Orbit, deep: 'var(--color-space-deep)' },
]

interface BranchMatch {
  branch: BranchInfo
  matches: boolean
  matchedComponents: string[]
}

/** A branch matches when the query hits the subject name, the branch name, or (for live
 *  branches, which have real authored components) a component name inside it. This is what
 *  makes search cover subject → branch → component, not just the branch list. */
function matchBranch(subject: SubjectHierarchy, branch: BranchInfo, query: string): BranchMatch {
  if (!query) return { branch, matches: true, matchedComponents: [] }

  if (subject.name.toLowerCase().includes(query) || branch.name.toLowerCase().includes(query)) {
    return { branch, matches: true, matchedComponents: [] }
  }

  if (branch.status === 'live') {
    const matchedComponents = branchComponents(branch.id)
      .filter((c) => c.name.toLowerCase().includes(query))
      .map((c) => c.name)
    if (matchedComponents.length > 0) {
      return { branch, matches: true, matchedComponents }
    }
  }

  return { branch, matches: false, matchedComponents: [] }
}

export default function Subjects() {
  const [openId, setOpenId] = useState<SubjectId | null>('biology')
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()

  const completedLabs = useAppStore((s) => s.completedLabs)
  const favorites = useAppStore((s) => s.favorites)
  const isBranchCompleted = (branch: BranchInfo) =>
    Boolean(branch.route && (completedLabs[branch.id] ?? completedLabs[branch.route]))
  const isBranchFavorite = (branch: BranchInfo) =>
    Boolean(branch.route && (favorites[branch.id] ?? favorites[branch.route]))

  // Only the search match depends on the query, so only it needs memoizing on normalizedQuery.
  // Live/completed counts read the store directly below and stay live across store updates.
  const groups = useMemo(
    () =>
      SUBJECTS.map((subject) => {
        const h = HIERARCHY[subject.id]
        const branchMatches = h.branches.map((b) => matchBranch(h, b, normalizedQuery))
        const visibleBranches = branchMatches.filter((r) => r.matches)
        return { subject, hierarchy: h, visibleBranches }
      }),
    [normalizedQuery],
  )

  const filtersActive = normalizedQuery.length > 0
  const visibleBranchTotal = groups.reduce((count, g) => count + g.visibleBranches.length, 0)

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
          Subjects
        </h1>
        <p className="mt-2 text-[color:var(--color-ink-500)]">
          Every subject is organized the same way: subject → branch → hands-on components. Branches
          marked Live are ready to explore today — the rest are on the way and will unlock soon.
        </p>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3 shadow-[var(--shadow-tactile)]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-500)]" strokeWidth={1.8} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subjects, branches, or components"
              className="h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-9 pr-9 text-sm text-[color:var(--color-foreground)] outline-none transition-colors placeholder:text-[color:var(--color-ink-500)] focus:border-[color:var(--color-brand)]"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[color:var(--color-ink-500)] hover:bg-[color:var(--color-surface-raised)]"
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
          </label>
          {filtersActive && (
            <p className="mt-2 px-1 text-xs text-[color:var(--color-ink-500)]">
              {visibleBranchTotal} {visibleBranchTotal === 1 ? 'branch' : 'branches'} match “{query.trim()}”
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {groups.map(({ subject, hierarchy: h, visibleBranches }) => {
            const isOpen = openId === subject.id || (filtersActive && visibleBranches.length > 0)
            const liveCount = h.branches.filter((b) => b.status === 'live').length
            const completedCount = h.branches.filter((b) => b.status === 'live' && isBranchCompleted(b)).length
            return (
              <div
                key={subject.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-tactile)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenId((cur) => (cur === subject.id ? null : subject.id))}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `color-mix(in oklch, ${subject.deep} 12%, transparent)` }}
                    >
                      <subject.icon className="h-5 w-5" style={{ color: subject.deep }} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                        {h.name}
                      </h2>
                      <p className="text-xs text-[color:var(--color-ink-500)]">
                        {h.branches.length} branches · {liveCount} live now
                        {completedCount > 0 ? ` · ${completedCount} completed` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-[color:var(--color-ink-500)] transition-transform', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen && (
                  <div className="grid grid-cols-1 gap-2 border-t border-[color:var(--color-border)] p-5 sm:grid-cols-2">
                    {visibleBranches.map(({ branch: b, matchedComponents }) => {
                      const completed = isBranchCompleted(b)
                      const favorited = isBranchFavorite(b)
                      return b.status === 'live' && b.route ? (
                        <Link
                          key={b.id}
                          to={b.route}
                          className="flex min-h-[44px] flex-col justify-center gap-1 rounded-[var(--radius-md)] border px-3.5 py-2.5 text-sm transition-transform hover:-translate-y-0.5"
                          style={{
                            borderColor: `color-mix(in oklch, ${subject.deep} 25%, transparent)`,
                            background: `color-mix(in oklch, ${subject.deep} 8%, var(--color-surface))`,
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5 font-medium text-[color:var(--color-foreground)]">
                              <span className="truncate">{b.name}</span>
                              {completed && (
                                <span className="inline-flex shrink-0 items-center text-emerald-600" title="You completed this lab">
                                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
                                  <span className="sr-only">Completed</span>
                                </span>
                              )}
                              {favorited && (
                                <span className="inline-flex shrink-0 items-center text-amber-500" title="One of your favorites">
                                  <Star className="h-3.5 w-3.5 fill-current" strokeWidth={1.8} aria-hidden="true" />
                                  <span className="sr-only">Favorite</span>
                                </span>
                              )}
                            </span>
                            <span
                              className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                              style={{ background: subject.deep }}
                            >
                              Live · {b.componentCount}
                            </span>
                          </div>
                          {matchedComponents.length > 0 && (
                            <p className="truncate text-xs text-[color:var(--color-ink-500)]">
                              Includes {matchedComponents.slice(0, 3).join(', ')}
                              {matchedComponents.length > 3 ? `, +${matchedComponents.length - 3} more` : ''}
                            </p>
                          )}
                        </Link>
                      ) : (
                        <div
                          key={b.id}
                          className="flex min-h-[44px] items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3.5 py-2.5 text-sm opacity-60"
                        >
                          <span className="text-[color:var(--color-foreground)]">{b.name}</span>
                          <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                            <Clock className="h-2.5 w-2.5" /> Coming soon
                          </span>
                        </div>
                      )
                    })}
                    {visibleBranches.length === 0 && (
                      <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-ink-500)] sm:col-span-2">
                        No branches match “{query.trim()}” in {h.name}.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
