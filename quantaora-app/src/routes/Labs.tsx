import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  Atom,
  FlaskConical,
  Sigma,
  Orbit,
  BadgeCheck,
  Box,
  Sparkles,
  Layers3,
  Wand2,
  ArrowRight,
  ChevronDown,
  Search,
  X,
  GraduationCap,
  CheckCircle2,
  Star,
  type LucideIcon,
} from 'lucide-react'
import { GRADE_BANDS, HIERARCHY } from '@/data/hierarchy'
import type { SubjectId } from '@/data/types'
import { branchComponents } from '@/data/branchModules'
import { summarizeComponentAssets, type AssetCoverageSummary } from '@/data/modelRegistry'
import { branchVisualQualityProfile, type BranchVisualQualityProfile } from '@/data/visualQualityRubric'
import { useAppStore } from '@/store/useAppStore'
import { cn } from '@/lib/utils'

const SUBJECT_ORDER: SubjectId[] = ['biology', 'chemistry', 'math', 'physics', 'space']
type QualityFilter = 'all' | 'flagship' | 'interactive' | 'concept'
type GradeFilter = 'all' | (typeof GRADE_BANDS)[number]['id']

const SUBJECT_META: Record<SubjectId, { icon: LucideIcon; deep: string; name: string }> = {
  biology: { icon: HeartPulse, deep: 'var(--color-biology-deep)', name: 'Biology' },
  physics: { icon: Atom, deep: 'var(--color-physics-deep)', name: 'Physics' },
  chemistry: { icon: FlaskConical, deep: 'var(--color-chemistry-deep)', name: 'Chemistry' },
  math: { icon: Sigma, deep: 'var(--color-math-deep)', name: 'Math' },
  space: { icon: Orbit, deep: 'var(--color-space-deep)', name: 'Space' },
}

// Branches that are richly built as illustrated, hands-on simulations *by design*
// (see docs/PROCEDURAL-VISUALS.md) rather than being driven by hero-tier 3D scans.
// `summarizeComponentAssets()` can still report a nonzero `heroReady` for a couple
// of these (e.g. atoms-and-elements registers a CLEAR `atom.glb` that its live
// route never actually loads), so these branches get their own honest "Interactive
// simulation" label instead of ever being counted as a GLB-driven "Flagship lab" —
// and instead of being mistaken for a broken/empty "Preview lab" when their real
// hero count happens to be 0.
const ILLUSTRATED_SIMULATION_BRANCHES = new Set([
  'human-physiology',
  'ecology',
  'plants',
  'atoms-and-elements',
  'periodic-table',
  'molecules-and-bonding',
  'chemical-reactions',
  'number-and-arithmetic',
  'fractions-and-ratios',
  'algebra',
  'geometry',
  'data-and-statistics',
  'mechanics',
  'energy',
  'electricity',
  'galaxies',
])

function liveBranchRows(subjectId: SubjectId) {
  return HIERARCHY[subjectId].branches
    .filter((branch) => branch.status === 'live' && branch.route)
    .map((branch) => {
      const components = branchComponents(branch.id)
      const assetSummary = summarizeComponentAssets(components)
      const isIllustratedSimulation = ILLUSTRATED_SIMULATION_BRANCHES.has(branch.id)
      const visualProfile = branchVisualQualityProfile(branch.id)
      const experience = labExperienceMeta(assetSummary, isIllustratedSimulation, visualProfile)
      return {
        id: branch.id,
        name: branch.name,
        componentCount: components.length || branch.componentCount || 0,
        gradeMin: branch.gradeMin,
        gradeMax: branch.gradeMax,
        assetSummary,
        visualProfile,
        experience,
        isIllustratedSimulation,
        isFlagship: experience.kind === 'flagship',
        to: branch.route!,
      }
    })
}

const LAB_GROUPS = SUBJECT_ORDER.map((subjectId) => {
  const rows = liveBranchRows(subjectId)
  const totals = rows.reduce(
    (acc, row) => {
      acc.components += row.assetSummary.total
      acc.hero += row.assetSummary.heroReady
      acc.flagshipLabs += row.isFlagship ? 1 : 0
      acc.preview += row.assetSummary.previewMissing
      return acc
    },
    { components: 0, hero: 0, flagshipLabs: 0, preview: 0 },
  )

  return {
    id: subjectId,
    ...SUBJECT_META[subjectId],
    rows,
    totals,
  }
})

const TOTALS = LAB_GROUPS.reduce(
  (acc, group) => {
    acc.labs += group.rows.length
    acc.components += group.totals.components
    acc.hero += group.totals.hero
    acc.flagshipLabs += group.totals.flagshipLabs
    return acc
  },
  { labs: 0, components: 0, hero: 0, flagshipLabs: 0 },
)

function labExperienceMeta(
  summary: AssetCoverageSummary,
  isIllustratedSimulation: boolean,
  visualProfile?: BranchVisualQualityProfile,
): {
  icon: LucideIcon
  label: string
  tone: string
  kind: 'flagship' | 'interactive' | 'concept'
} {
  if (visualProfile?.grade === 'flagship' || visualProfile?.grade === 'legal-review') {
    return { icon: BadgeCheck, label: 'Flagship 3D', tone: '#2f7d55', kind: 'flagship' }
  }

  if (visualProfile?.grade === 'good') {
    return { icon: Sparkles, label: 'Interactive 3D', tone: 'var(--color-brand-strong)', kind: 'interactive' }
  }

  if (isIllustratedSimulation || visualProfile?.grade === 'diagram-only') {
    return { icon: Wand2, label: 'Concept Lab', tone: 'var(--color-ink-500)', kind: 'concept' }
  }

  if (summary.status === 'hero-complete' || summary.status === 'partial-hero') {
    return { icon: Layers3, label: 'Guided Model', tone: 'var(--color-ink-500)', kind: 'interactive' }
  }

  return { icon: Box, label: 'Preview Lab', tone: 'var(--color-ink-500)', kind: 'concept' }
}

function AssetBadge({
  experience,
}: {
  experience: ReturnType<typeof labExperienceMeta>
}) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide"
      style={{
        borderColor: `color-mix(in oklch, ${experience.tone} 28%, transparent)`,
        background: `color-mix(in oklch, ${experience.tone} 9%, var(--color-surface-raised))`,
        color: experience.tone,
      }}
    >
      <experience.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
      {experience.label}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[color:var(--color-foreground)]">{value}</p>
    </div>
  )
}

const QUALITY_FILTERS: { id: QualityFilter; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All labs', icon: Box },
  { id: 'flagship', label: 'Flagship 3D', icon: BadgeCheck },
  { id: 'interactive', label: 'Interactive 3D', icon: Sparkles },
  { id: 'concept', label: 'Concept labs', icon: Wand2 },
]

const GRADE_FILTERS: { id: GradeFilter; label: string; icon: LucideIcon }[] = [
  { id: 'all', label: 'All grades', icon: GraduationCap },
  ...GRADE_BANDS.map((band) => ({ id: band.id, label: band.short, icon: GraduationCap })),
]

export default function Labs() {
  const [openId, setOpenId] = useState<SubjectId | null>('biology')
  const [query, setQuery] = useState('')
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all')
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all')
  const normalizedQuery = query.trim().toLowerCase()

  const completedLabs = useAppStore((s) => s.completedLabs)
  const favorites = useAppStore((s) => s.favorites)

  // Completion/favorite entries are recorded per lab *component* (e.g. `content.id`
  // like `'dna'` or `'chloroplast'`, keyed off whatever structure the learner was
  // looking at) — they are never keyed by this branch's id or route. The only field
  // that reliably ties a component-level entry back to a branch row is `branch`
  // (`content.branch`), which different content files populate as either the
  // branch's display name (e.g. `'Genetics'`) or its kebab-case id (e.g. `'plants'`).
  // Match on subject + either form so a real completion/favorite in this branch
  // actually surfaces here instead of silently never matching.
  const isLabCompleted = (subject: SubjectId, branchId: string, branchName: string) =>
    Object.values(completedLabs).some(
      (entry) => entry.subject === subject && (entry.branch === branchName || entry.branch === branchId),
    )
  const isLabFavorite = (subject: SubjectId, branchId: string, branchName: string) =>
    Object.values(favorites).some(
      (entry) => entry.subject === subject && (entry.branch === branchName || entry.branch === branchId),
    )

  const branchMatchesFilter = (row: ReturnType<typeof liveBranchRows>[number], groupName: string) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      row.name.toLowerCase().includes(normalizedQuery) ||
      groupName.toLowerCase().includes(normalizedQuery)

    if (!matchesQuery) return false

    if (qualityFilter !== 'all' && row.experience.kind !== qualityFilter) return false
    if (gradeFilter !== 'all') {
      const band = GRADE_BANDS.find((item) => item.id === gradeFilter)
      if (band && (row.gradeMax < band.min || row.gradeMin > band.max)) return false
    }

    return true
  }

  const filteredGroups = LAB_GROUPS.map((group) => ({
    ...group,
    filteredRows: group.rows.filter((row) => branchMatchesFilter(row, group.name)),
  }))

  const filtersActive = normalizedQuery.length > 0 || qualityFilter !== 'all' || gradeFilter !== 'all'
  const visibleBranchCount = filteredGroups.reduce((count, group) => count + group.filteredRows.length, 0)

  const clearFilters = () => {
    setQuery('')
    setQualityFilter('all')
    setGradeFilter('all')
  }

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">Labs</h1>
        <p className="mt-2 max-w-2xl text-[color:var(--color-ink-500)]">
          Pick a subject, then open a hands-on lab. Some lessons use real 3D objects, some use precise
          interactive models, and some use clear concept simulations where abstraction helps the idea.
        </p>

        <div className="mt-5 flex flex-wrap gap-2 pb-1">
          {LAB_GROUPS.map((group) => (
            <button
              key={group.id}
              type="button"
              onClick={() => setOpenId(group.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                openId === group.id
                  ? 'border-transparent text-white'
                  : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-ink-300)]',
              )}
              style={openId === group.id ? { background: group.deep } : undefined}
            >
              <group.icon className="h-4 w-4" strokeWidth={1.8} />
              {group.name}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3 shadow-[var(--shadow-tactile)]">
          <div className="grid gap-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-ink-500)]" strokeWidth={1.8} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search labs, subjects, or topics"
                className="h-11 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] pl-9 pr-3 text-sm text-[color:var(--color-foreground)] outline-none transition-colors placeholder:text-[color:var(--color-ink-500)] focus:border-[color:var(--color-brand)]"
              />
            </label>

            <div className="grid gap-2 lg:grid-cols-[1fr_auto]">
              <div className="flex min-w-0 flex-wrap gap-2">
                {QUALITY_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setQualityFilter(filter.id)}
                    className={cn(
                      'inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-colors',
                      qualityFilter === filter.id
                        ? 'border-transparent bg-[color:var(--color-brand-strong)] text-white'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-ink-300)]',
                    )}
                  >
                    <filter.icon className="h-4 w-4" strokeWidth={1.8} />
                    {filter.label}
                  </button>
                ))}
              </div>

              <div className="flex min-w-0 flex-wrap gap-2">
                {GRADE_FILTERS.map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setGradeFilter(filter.id)}
                    className={cn(
                      'inline-flex h-11 shrink-0 items-center gap-2 rounded-[var(--radius-md)] border px-3 text-sm font-medium transition-colors',
                      gradeFilter === filter.id
                        ? 'border-transparent bg-[color:var(--color-foreground)] text-[color:var(--color-surface-raised)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-foreground)] hover:border-[color:var(--color-ink-300)]',
                    )}
                  >
                    <filter.icon className="h-4 w-4" strokeWidth={1.8} />
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--color-ink-500)]">
            <span>
              Showing {visibleBranchCount} {visibleBranchCount === 1 ? 'lab' : 'labs'}
              {filtersActive ? ' matching your search' : ' across all subjects'}
            </span>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium text-[color:var(--color-foreground)] hover:bg-[color:var(--color-surface)]"
              >
                <X className="h-3.5 w-3.5" strokeWidth={1.8} />
                Clear
              </button>
            )}
          </div>
        </div>

        <div
          className="mt-6 grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}
        >
          <StatCard label="Live Labs" value={TOTALS.labs} />
          <StatCard label="Learning Pieces" value={TOTALS.components} />
          <StatCard label="Flagship Labs" value={TOTALS.flagshipLabs} />
          <StatCard label="Subjects" value={LAB_GROUPS.length} />
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {filteredGroups.map((group) => {
            const isOpen = openId === group.id || (filtersActive && group.filteredRows.length > 0)
            return (
              <section
                key={group.id}
                className="overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] shadow-[var(--shadow-tactile)]"
              >
                <button
                  type="button"
                  onClick={() => setOpenId((current) => (current === group.id ? null : group.id))}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                      style={{ background: `color-mix(in oklch, ${group.deep} 12%, transparent)` }}
                    >
                      <group.icon className="h-5 w-5" style={{ color: group.deep }} strokeWidth={1.6} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                        {group.name}
                      </h2>
                      <p className="text-xs text-[color:var(--color-ink-500)]">
                        {group.filteredRows.length} shown · {group.rows.length} labs · {group.totals.flagshipLabs} flagship labs
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={cn('h-4 w-4 shrink-0 text-[color:var(--color-ink-500)] transition-transform', isOpen && 'rotate-180')}
                  />
                </button>

                {isOpen && (
                  <div className="grid gap-3 border-t border-[color:var(--color-border)] p-4">
                    {group.filteredRows.map((lab) => {
                      const completed = isLabCompleted(group.id, lab.id, lab.name)
                      const favorited = isLabFavorite(group.id, lab.id, lab.name)
                      return (
                      <Link
                        key={lab.id}
                        to={lab.to}
                        className="grid gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 transition-transform hover:-translate-y-0.5 sm:grid-cols-[1fr_auto]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-[color:var(--color-foreground)]">{lab.name}</p>
                            <AssetBadge experience={lab.experience} />
                            {completed && (
                              <span className="inline-flex items-center text-emerald-500" title="You completed this lab">
                                <CheckCircle2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
                                <span className="sr-only">Completed</span>
                              </span>
                            )}
                            {favorited && (
                              <span className="inline-flex items-center text-amber-500" title="One of your favorites">
                                <Star className="h-4 w-4 fill-current" strokeWidth={1.8} aria-hidden="true" />
                                <span className="sr-only">Favorite</span>
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">
                            {lab.componentCount} {lab.componentCount === 1 ? 'learning piece' : 'learning pieces'} ·{' '}
                            Grades {lab.gradeMin}-{lab.gradeMax} ·{' '}
                            {lab.isIllustratedSimulation
                              ? 'interactive simulation'
                              : lab.experience.kind === 'concept'
                                ? 'concept model'
                              : lab.assetSummary.heroReady > 0
                                ? `${lab.assetSummary.heroReady} 3D ${lab.assetSummary.heroReady === 1 ? 'piece' : 'pieces'}`
                                : 'interactive preview'}
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-xs font-medium text-[color:var(--color-foreground)]">
                          Open lab
                          <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
                        </span>
                      </Link>
                      )
                    })}
                    {group.filteredRows.length === 0 && (
                      <div className="rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 text-sm text-[color:var(--color-ink-500)]">
                        No labs match the current search in {group.name}.
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
