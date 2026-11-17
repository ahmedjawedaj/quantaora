import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  Clock,
  NotebookPen,
  ListChecks,
  Layers,
  ChevronRight,
  Dna,
  Atom,
  FlaskConical,
  Sigma,
  Orbit,
  Rocket,
  UserRound,
  Pencil,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Star,
  Bookmark,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { ALL_CONTENT, resolveContent } from '@/data/allContent'
import { HIERARCHY } from '@/data/hierarchy'
import type { ComponentContent, SubjectId } from '@/data/types'
import { cn } from '@/lib/utils'

const SUBJECT_ORDER: SubjectId[] = ['biology', 'chemistry', 'math', 'physics', 'space']

const SUBJECT_LABEL: Record<SubjectId, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  math: 'Math',
  physics: 'Physics',
  space: 'Space',
}

const SUBJECT_ICON: Record<SubjectId, LucideIcon> = {
  biology: Dna,
  physics: Atom,
  chemistry: FlaskConical,
  math: Sigma,
  space: Orbit,
}

const CONFIDENCE_LABELS = ['New', 'Okay', 'Strong']

/** A checkpoint attempt at or above this ratio counts as a "pass" for the summary below. */
const PASS_THRESHOLD = 0.6

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** First live (built) branch route for a subject, used to point an unstarted-subject suggestion somewhere real. */
function firstLiveRouteForSubject(subject: SubjectId): string {
  const branch = HIERARCHY[subject]?.branches.find((b) => b.status === 'live' && b.route)
  return branch?.route ?? '/app/subjects'
}

interface BranchGroup {
  branch: string
  items: ComponentContent[]
}

interface SubjectGroup {
  subject: SubjectId
  branches: BranchGroup[]
  total: number
}

function buildGroups(): SubjectGroup[] {
  const bySubject = new Map<SubjectId, Map<string, ComponentContent[]>>()

  for (const item of ALL_CONTENT) {
    let branches = bySubject.get(item.subject)
    if (!branches) {
      branches = new Map<string, ComponentContent[]>()
      bySubject.set(item.subject, branches)
    }
    const list = branches.get(item.branch)
    if (list) list.push(item)
    else branches.set(item.branch, [item])
  }

  return SUBJECT_ORDER.filter((subject) => bySubject.has(subject)).map((subject) => {
    const branches = [...bySubject.get(subject)!.entries()].map(([branch, items]) => ({ branch, items }))
    return {
      subject,
      branches,
      total: branches.reduce((sum, b) => sum + b.items.length, 0),
    }
  })
}

function MasteryMeter({ value, subject }: { value: number; subject: SubjectId }) {
  return (
    <div className="flex items-center gap-[3px]" aria-hidden>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-1.5 w-3 rounded-full"
          style={{ background: i < value ? `var(--color-${subject}-deep)` : 'var(--color-border)' }}
        />
      ))}
    </div>
  )
}

export default function Grownups() {
  const learnerProfile = useAppStore((s) => s.learnerProfile)
  const lastVisitedLab = useAppStore((s) => s.lastVisitedLab)
  const clearLearnerProfile = useAppStore((s) => s.clearLearnerProfile)
  const mastery = useAppStore((s) => s.mastery)
  const quizResults = useAppStore((s) => s.quizResults)
  const notebook = useAppStore((s) => s.notebook)
  const timeSpentMinutes = useAppStore((s) => s.timeSpentMinutes)
  const completedLabs = useAppStore((s) => s.completedLabs)
  const favorites = useAppStore((s) => s.favorites)
  const experimentSnapshots = useAppStore((s) => s.experimentSnapshots)

  const groups = useMemo(buildGroups, [])
  const subjectAttempted = useMemo(() => {
    const counts: Partial<Record<SubjectId, number>> = {}
    for (const group of groups) {
      counts[group.subject] = group.branches.reduce(
        (sum, b) => sum + b.items.filter((item) => mastery[item.id] !== undefined).length,
        0,
      )
    }
    return counts
  }, [groups, mastery])
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
    ? { path: lastVisitedLab.path, name: lastVisitedLab.name, caption: `Last opened in ${lastVisitedLab.subject}` }
    : recommendedBranch
      ? { path: recommendedBranch.route!, name: recommendedBranch.name, caption: 'Recommended by First Flight' }
      : null

  const totalComponents = ALL_CONTENT.length
  const attempted = ALL_CONTENT.filter((item) => mastery[item.id] !== undefined)

  const strongest = attempted.reduce<ComponentContent | null>((best, item) => {
    if (!best || mastery[item.id] > mastery[best.id]) return item
    return best
  }, null)

  const completedLabsList = useMemo(
    () => Object.values(completedLabs).sort((a, b) => b.lastCompletedAt - a.lastCompletedAt),
    [completedLabs],
  )

  const favoritesList = useMemo(
    () => Object.values(favorites).sort((a, b) => b.addedAt - a.addedAt),
    [favorites],
  )

  const recentQuizzes = useMemo(
    () =>
      quizResults.slice(0, 5).map((result) => ({
        ...result,
        name: resolveContent(result.componentId)?.name ?? result.componentId,
        passed: result.total > 0 && result.score / result.total >= PASS_THRESHOLD,
      })),
    [quizResults],
  )

  const quizPassRate =
    quizResults.length > 0
      ? Math.round(
          (quizResults.filter((r) => r.total > 0 && r.score / r.total >= PASS_THRESHOLD).length /
            quizResults.length) *
            100,
        )
      : null

  // Simple local heuristics for "what hasn't been tried yet" — no ML, no network calls.
  const suggestions = useMemo(() => {
    const list: { key: string; label: string; description: string; path: string; icon: LucideIcon }[] = []

    for (const group of groups) {
      if ((subjectAttempted[group.subject] ?? 0) === 0) {
        list.push({
          key: `try-${group.subject}`,
          label: `Try ${SUBJECT_LABEL[group.subject]}`,
          description: `Not started yet — ${group.total} component${group.total === 1 ? '' : 's'} waiting.`,
          path: firstLiveRouteForSubject(group.subject),
          icon: SUBJECT_ICON[group.subject],
        })
      }
    }

    if (attempted.length > 0 && quizResults.length === 0) {
      list.push({
        key: 'take-quiz',
        label: 'Try a checkpoint quiz',
        description: 'Components have been explored, but no checkpoint quiz has been completed yet.',
        path: primaryNextLab?.path ?? '/app/labs',
        icon: ListChecks,
      })
    }

    if (favoritesList.length === 0 && attempted.length > 0) {
      list.push({
        key: 'save-favorite',
        label: 'Save a favorite',
        description: 'Starring a component or lab while exploring builds a quick-access list here.',
        path: '/app/labs',
        icon: Star,
      })
    }

    return list.slice(0, 3)
  }, [groups, subjectAttempted, attempted.length, quizResults.length, favoritesList.length, primaryNextLab])

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  const isOpen = (group: SubjectGroup) => {
    const override = collapsed[group.subject]
    if (override !== undefined) return override
    // Default: open the subjects where something has actually been attempted.
    return group.branches.some((b) => b.items.some((item) => mastery[item.id] !== undefined))
  }

  const setOpen = (group: SubjectGroup, open: boolean) =>
    setCollapsed((prev) => ({ ...prev, [group.subject]: open }))

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
          Parent / Teacher Zone
        </h1>
        <p className="mt-2 text-[color:var(--color-ink-500)]">
          No punitive controls, no locked features — a plain view of progress, computed live from
          this device's local data.
        </p>

        <section className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-tactile)]">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]">
                  <UserRound className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                    Local learner profile
                  </p>
                  <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight text-[color:var(--color-foreground)]">
                    {learnerProfile ? learnerProfile.name : 'First Flight is not set up yet'}
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--color-ink-500)]">
                    {learnerProfile
                      ? `Grade ${learnerProfile.grade} path · ${learnerProfile.interests.length} interests selected`
                      : 'Create a profile on this device to personalize the first lab and recommendations.'}
                  </p>
                </div>
              </div>

              {learnerProfile ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {learnerProfile.interests.map((subject) => {
                    const subjectId = subject as SubjectId
                    const SubjectIcon = SUBJECT_ICON[subjectId]
                    return (
                      <span
                        key={subject}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-foreground)]"
                      >
                        {SubjectIcon && (
                          <SubjectIcon
                            className="h-3.5 w-3.5"
                            strokeWidth={1.75}
                            style={{ color: `var(--color-${subject}-deep)` }}
                          />
                        )}
                        {SUBJECT_LABEL[subjectId] ?? subject}
                        <span className="text-[color:var(--color-ink-500)]">
                          {CONFIDENCE_LABELS[learnerProfile.confidence[subject] ?? 0] ?? 'New'}
                        </span>
                      </span>
                    )
                  })}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  to="/first-flight"
                  className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.8} />
                  {learnerProfile ? 'Edit profile' : 'Create profile'}
                </Link>
                {learnerProfile && (
                  <button
                    type="button"
                    onClick={clearLearnerProfile}
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2 text-sm font-semibold text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-brand)]"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={1.8} />
                    Reset profile
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 lg:border-l lg:border-t-0">
              <Rocket className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.8} />
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                {lastVisitedLab ? 'Continue learning' : 'Recommended next lab'}
              </p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-2xl leading-tight text-[color:var(--color-foreground)]">
                {primaryNextLab?.name ?? 'Choose a starting lab'}
              </p>
              <p className="mt-2 text-sm text-[color:var(--color-ink-500)]">
                {primaryNextLab?.caption ??
                  'The app can recommend a first branch after a short local setup.'}
              </p>
              <Link
                to={primaryNextLab?.path ?? '/first-flight'}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[color:var(--color-foreground)] px-4 py-2 text-sm font-semibold text-[color:var(--color-background)] transition-transform hover:-translate-y-0.5"
              >
                {primaryNextLab ? 'Continue lab' : 'Start First Flight'}
                <ChevronRight className="h-4 w-4" strokeWidth={1.8} />
              </Link>

              {learnerProfile?.recommendedMission && (
                <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Mission path</p>
                  <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight text-[color:var(--color-foreground)]">
                    {learnerProfile.recommendedMission.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--color-ink-500)]">
                    {learnerProfile.recommendedMission.summary}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {learnerProfile.recommendedMission.steps.map((step, index) => (
                      <Link
                        key={step.label}
                        to={step.path}
                        className="grid grid-cols-[1.5rem_1fr] gap-2 rounded-[var(--radius-sm)] p-1.5 text-xs leading-5 transition-colors hover:bg-[color:var(--color-surface)]"
                      >
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-surface)] font-semibold text-[color:var(--color-brand-strong)]">
                          {index + 1}
                        </span>
                        <span>
                          <span className="font-semibold text-[color:var(--color-foreground)]">{step.label}</span>
                          <span className="block text-[color:var(--color-ink-500)]">{step.reason}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {suggestions.length > 0 && (
          <section className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.8} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Suggested next steps
              </h2>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {suggestions.map((suggestion) => {
                const SuggestionIcon = suggestion.icon
                return (
                  <Link
                    key={suggestion.key}
                    to={suggestion.path}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 transition-colors hover:border-[color:var(--color-brand)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]">
                      <SuggestionIcon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[color:var(--color-foreground)]">
                        {suggestion.label}
                      </span>
                      <span className="block text-xs text-[color:var(--color-ink-500)]">
                        {suggestion.description}
                      </span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[color:var(--color-ink-500)]" />
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)] sm:col-span-2">
            <TrendingUp
              className="h-4 w-4"
              style={{ color: strongest ? `var(--color-${strongest.subject}-deep)` : 'var(--color-brand)' }}
            />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Strongest area
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl leading-tight text-[color:var(--color-foreground)]">
              {strongest ? `${strongest.name} — ${mastery[strongest.id]}/5` : 'Not attempted yet'}
            </p>
            {strongest && (
              <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">
                {SUBJECT_LABEL[strongest.subject]} · {strongest.branch}
              </p>
            )}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
            <Layers className="h-4 w-4 text-[color:var(--color-brand)]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Components attempted
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
              {attempted.length}
              <span className="text-[color:var(--color-ink-500)]"> / {totalComponents}</span>
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
            <ListChecks className="h-4 w-4 text-[color:var(--color-brand)]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Checkpoint attempts
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
              {quizResults.length}
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
            <NotebookPen className="h-4 w-4 text-[color:var(--color-brand)]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Notebook entries
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
              {notebook.length}
            </p>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
            <Clock className="h-4 w-4 text-[color:var(--color-brand)]" />
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Time in app, this session
            </p>
            <p className="mt-1 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
              {timeSpentMinutes < 1 ? '< 1 min' : `${timeSpentMinutes} min`}
            </p>
          </div>
        </div>

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.8} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Completed labs
              </h2>
            </div>
            {completedLabsList.length > 0 && (
              <Link
                to="/app/notebook"
                className="text-xs font-medium text-[color:var(--color-brand)] hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          {completedLabsList.length > 0 ? (
            <ul className="mt-3 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
              {completedLabsList.slice(0, 5).map((lab) => (
                <li key={lab.labId} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <span className="min-w-0">
                    <span className="block font-medium text-[color:var(--color-foreground)]">{lab.labName}</span>
                    <span className="block text-xs text-[color:var(--color-ink-500)]">
                      {SUBJECT_LABEL[lab.subject as SubjectId] ?? lab.subject} · last completed{' '}
                      {formatDate(lab.lastCompletedAt)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full bg-[color:var(--color-surface)] px-2.5 py-1 font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                    {lab.timesCompleted}×
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--color-ink-500)]">
              No labs marked complete yet — completions appear here automatically after a lab is finished.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.8} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Checkpoint quiz results
              </h2>
            </div>
            <span className="flex items-center gap-3">
              {quizPassRate !== null && (
                <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                  {quizPassRate}% pass rate
                </span>
              )}
              {quizResults.length > 0 && (
                <Link
                  to="/app/notebook"
                  className="text-xs font-medium text-[color:var(--color-brand)] hover:underline"
                >
                  View all
                </Link>
              )}
            </span>
          </div>
          {recentQuizzes.length > 0 ? (
            <ul className="mt-3 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
              {recentQuizzes.map((result, index) => (
                <li
                  key={`${result.componentId}-${result.completedAt}-${index}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {result.passed ? (
                      <CheckCircle2
                        className="h-4 w-4 shrink-0 text-[color:var(--color-brand-strong)]"
                        strokeWidth={1.8}
                      />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-[color:var(--color-ink-500)]" strokeWidth={1.8} />
                    )}
                    <span className="truncate text-[color:var(--color-foreground)]">{result.name}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2.5">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                      {result.score}/{result.total}
                    </span>
                    <span className="text-xs text-[color:var(--color-ink-500)]">{formatDate(result.completedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[color:var(--color-ink-500)]">
              No checkpoint quizzes attempted yet — scores and pass/fail trends will appear here.
            </p>
          )}
        </section>

        <section className="mt-6 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-6 shadow-[var(--shadow-tactile)]">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.8} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Favorites &amp; saved work
              </h2>
            </div>
            {(favoritesList.length > 0 || experimentSnapshots.length > 0) && (
              <Link
                to="/app/notebook"
                className="text-xs font-medium text-[color:var(--color-brand)] hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          {favoritesList.length === 0 && experimentSnapshots.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--color-ink-500)]">
              Nothing saved yet — favorited labs/concepts and saved experiment setups will show up here.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              {favoritesList.slice(0, 4).map((item) => (
                <div
                  key={`fav-${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Star
                      className="h-3.5 w-3.5 shrink-0 fill-current text-[color:var(--color-brand)]"
                      strokeWidth={1.8}
                    />
                    <span className="truncate font-medium text-[color:var(--color-foreground)]">{item.name}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[color:var(--color-ink-500)]">
                    {SUBJECT_LABEL[item.subject as SubjectId] ?? item.subject}
                  </span>
                </div>
              ))}
              {experimentSnapshots.slice(0, 3).map((snap) => (
                <div
                  key={`snap-${snap.id}`}
                  className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 text-sm"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Bookmark className="h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" strokeWidth={1.8} />
                    <span className="truncate font-medium text-[color:var(--color-foreground)]">{snap.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-[color:var(--color-ink-500)]">
                    {formatDate(snap.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
            Mastery by subject
          </p>

          <div className="flex flex-col gap-3">
            {groups.map((group) => {
              const open = isOpen(group)
              const SubjectIcon = SUBJECT_ICON[group.subject]
              const subjectAttemptedCount = subjectAttempted[group.subject] ?? 0

              return (
                <section
                  key={group.subject}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-tactile)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(group, !open)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--color-surface)]"
                  >
                    <SubjectIcon
                      className="h-4 w-4 shrink-0"
                      strokeWidth={1.75}
                      style={{ color: `var(--color-${group.subject}-deep)` }}
                    />
                    <span className="flex-1 text-sm font-semibold text-[color:var(--color-foreground)]">
                      {SUBJECT_LABEL[group.subject]}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                      {subjectAttemptedCount}/{group.total} attempted
                    </span>
                    <ChevronRight
                      className={cn(
                        'h-4 w-4 shrink-0 text-[color:var(--color-ink-500)] transition-transform',
                        open && 'rotate-90',
                      )}
                    />
                  </button>

                  {open && (
                    <div className="border-t border-[color:var(--color-border)] px-4 pb-3 pt-1">
                      {group.branches.map((branch) => (
                        <div key={branch.branch} className="mt-3 first:mt-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                            {branch.branch}
                          </p>
                          <div className="mt-1 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
                            {branch.items.map((item) => {
                              const score = mastery[item.id]
                              const done = score !== undefined
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between gap-3 py-2 text-sm"
                                >
                                  <span
                                    className={cn(
                                      done
                                        ? 'text-[color:var(--color-foreground)]'
                                        : 'text-[color:var(--color-ink-500)]',
                                    )}
                                  >
                                    {item.name}
                                  </span>
                                  <span className="flex shrink-0 items-center gap-2.5">
                                    {done && <MasteryMeter value={score} subject={group.subject} />}
                                    <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                                      {done ? `${score}/5` : 'Not attempted'}
                                    </span>
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        </div>

        {attempted.length === 0 && (
          <p className="mt-6 rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] p-4 text-sm text-[color:var(--color-ink-500)]">
            Nothing attempted yet — that's a fine place to start. Suggested next step: open{' '}
            <span className="font-medium text-[color:var(--color-foreground)]">Heart</span> in Explore
            and complete the checkpoint quiz to see mastery appear here.
          </p>
        )}
      </div>
    </div>
  )
}
