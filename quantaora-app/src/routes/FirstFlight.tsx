import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Atom, FlaskConical, HeartPulse, Orbit, Sigma, Sparkles } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import type { SubjectId } from '@/data/types'
import { cn } from '@/lib/utils'

const SUBJECTS: {
  id: SubjectId
  label: string
  icon: typeof HeartPulse
  color: string
  firstLab: string
  description: string
  mission: {
    title: string
    summary: string
    steps: { label: string; path: string; reason: string }[]
  }
}[] = [
  {
    id: 'biology',
    label: 'Biology',
    icon: HeartPulse,
    color: 'var(--color-biology-deep)',
    firstLab: '/app',
    description: 'Bodies, cells, plants, genetics, and living systems.',
    mission: {
      title: 'Living Systems Launch',
      summary: 'Start with a visible body system, then connect it to cells and plant life.',
      steps: [
        { label: 'Inspect anatomy', path: '/app', reason: 'Use the highest-quality 3D reference model first.' },
        { label: 'Open plants', path: '/app/labs/plants', reason: 'Watch growth, water flow, and photosynthesis change with controls.' },
        { label: 'Try genetics', path: '/app/labs/genetics', reason: 'Connect living traits to DNA, mutation, and inheritance.' },
      ],
    },
  },
  {
    id: 'chemistry',
    label: 'Chemistry',
    icon: FlaskConical,
    color: 'var(--color-chemistry-deep)',
    firstLab: '/app/labs/atoms',
    description: 'Atoms, elements, molecules, and reactions.',
    mission: {
      title: 'Matter Builder Mission',
      summary: 'Move from atoms to molecules, then test how reactions conserve matter.',
      steps: [
        { label: 'Build an atom', path: '/app/labs/atoms', reason: 'See protons, electrons, shells, ions, and isotopes.' },
        { label: 'Make molecules', path: '/app/labs/molecules', reason: 'Add atoms and bonds, then inspect valence and formula changes.' },
        { label: 'Balance a reaction', path: '/app/labs/reactions', reason: 'Change coefficients and watch atom counts prove conservation.' },
      ],
    },
  },
  {
    id: 'math',
    label: 'Math',
    icon: Sigma,
    color: 'var(--color-math-deep)',
    firstLab: '/app/labs/math-manipulatives',
    description: 'Numbers, shapes, patterns, data, and algebra.',
    mission: {
      title: 'Math Objects Mission',
      summary: 'Use concrete manipulatives before moving to graphs and equations.',
      steps: [
        { label: 'Use manipulatives', path: '/app/labs/math-manipulatives', reason: 'Measure shapes, fractions, ratios, and data with visible objects.' },
        { label: 'Practice number sense', path: '/app/labs/number-sense', reason: 'Make operations and place value visible before abstraction.' },
        { label: 'Connect algebra', path: '/app/labs/functions', reason: 'Link objects, equations, tables, and graphs.' },
      ],
    },
  },
  {
    id: 'physics',
    label: 'Physics',
    icon: Atom,
    color: 'var(--color-physics-deep)',
    firstLab: '/app/labs/electricity',
    description: 'Motion, forces, energy, light, and electricity.',
    mission: {
      title: 'Cause And Effect Physics',
      summary: 'Change one variable at a time and watch the physical result.',
      steps: [
        { label: 'Wire a circuit', path: '/app/labs/electricity', reason: 'Change voltage, resistance, and switch state to see current respond.' },
        { label: 'Push a cart', path: '/app/labs/motion', reason: 'Change force, mass, friction, and slope to compare motion.' },
        { label: 'Track energy', path: '/app/labs/energy', reason: 'Watch potential, kinetic, heat, work, and power trade places.' },
      ],
    },
  },
  {
    id: 'space',
    label: 'Space',
    icon: Orbit,
    color: 'var(--color-space-deep)',
    firstLab: '/app/labs/orbit',
    description: 'Planets, stars, galaxies, orbits, and scale.',
    mission: {
      title: 'Space Motion Mission',
      summary: 'Separate spin, orbit, light, gravity, scale, and deep-space structure.',
      steps: [
        { label: 'Test orbit motion', path: '/app/labs/orbit', reason: 'Change distance and speed to see year length and orbit motion.' },
        { label: 'Compare Earth motions', path: '/app/labs/earth-in-space', reason: 'Separate rotation from revolution with speed experiments.' },
        { label: 'Zoom out to galaxies', path: '/app/labs/galaxies', reason: 'See how large systems move beyond the solar system.' },
      ],
    },
  },
]

const CONFIDENCE_LABELS = ['New', 'Okay', 'Strong']

function gradeBand(grade: number) {
  if (grade <= 5) return 'Foundation explorer'
  if (grade <= 8) return 'Middle school explorer'
  return 'Advanced explorer'
}

function recommendLab(interests: SubjectId[], confidence: Record<string, number>) {
  const weakestInterest = [...interests].sort((a, b) => {
    const confidenceDelta = (confidence[a] ?? 1) - (confidence[b] ?? 1)
    if (confidenceDelta !== 0) return confidenceDelta
    return interests.indexOf(b) - interests.indexOf(a)
  })[0]
  const subjectId = weakestInterest ?? interests[0] ?? 'biology'
  return SUBJECTS.find((subject) => subject.id === subjectId) ?? SUBJECTS[0]
}

export default function FirstFlight() {
  const navigate = useNavigate()
  const existingProfile = useAppStore((state) => state.learnerProfile)
  const setLearnerProfile = useAppStore((state) => state.setLearnerProfile)
  const [name, setName] = useState(existingProfile?.name ?? '')
  const [grade, setGrade] = useState(existingProfile?.grade ?? 6)
  const [interests, setInterests] = useState<SubjectId[]>(
    existingProfile?.interests.filter((id): id is SubjectId => SUBJECTS.some((subject) => subject.id === id)) ?? [],
  )
  const [confidence, setConfidence] = useState<Record<string, number>>(
    existingProfile?.confidence ?? {
      biology: 1,
      chemistry: 1,
      math: 1,
      physics: 1,
      space: 1,
    },
  )

  const recommended = useMemo(() => recommendLab(interests, confidence), [interests, confidence])
  const canStart = name.trim().length >= 2 && interests.length > 0

  const toggleInterest = (subjectId: SubjectId) => {
    setInterests((current) =>
      current.includes(subjectId)
        ? current.filter((id) => id !== subjectId)
        : [...current, subjectId],
    )
  }

  const start = () => {
    if (!canStart) return
    setLearnerProfile({
      name: name.trim(),
      grade,
      interests,
      confidence,
      recommendedLab: recommended.firstLab,
      recommendedMission: {
        title: recommended.mission.title,
        subject: recommended.id,
        summary: recommended.mission.summary,
        steps: recommended.mission.steps,
      },
    })
    navigate(recommended.firstLab)
  }

  return (
    <main className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="flex h-16 items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/80 px-5 backdrop-blur">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--color-ink-700)]">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} />
          Quantaora
        </Link>
        <span className="rounded-full bg-[color:var(--color-brand-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-brand-strong)]">
          First Flight
        </span>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 pb-28 pt-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-12">
        <section>
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-strong)]">
            <Sparkles className="h-4 w-4" strokeWidth={1.8} />
            Build your learning path
          </p>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl leading-tight sm:text-5xl">
            Start with the right lab.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[color:var(--color-ink-500)]">
            A short setup creates a local profile on this device. No account, no backend, no personal data sent anywhere.
          </p>

          <div className="mt-8 grid gap-5">
            <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]">
              <label className="text-sm font-semibold text-[color:var(--color-foreground)]" htmlFor="learner-name">
                Learner name
              </label>
              <input
                id="learner-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Name"
                className="mt-2 h-12 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-base outline-none transition-colors placeholder:text-[color:var(--color-ink-500)] focus:border-[color:var(--color-brand)]"
              />
            </div>

            <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-sm font-semibold text-[color:var(--color-foreground)]" htmlFor="learner-grade">
                    Grade
                  </label>
                  <p className="text-xs text-[color:var(--color-ink-500)]">{gradeBand(grade)}</p>
                </div>
                <span className="rounded-full bg-[color:var(--color-surface)] px-4 py-2 text-lg font-semibold">{grade}</span>
              </div>
              <input
                id="learner-grade"
                type="range"
                min={3}
                max={10}
                value={grade}
                onChange={(event) => setGrade(Number(event.target.value))}
                aria-valuetext={`Grade ${grade}`}
                className="mt-4 w-full accent-[color:var(--color-brand-strong)]"
              />
              <div className="mt-2 flex justify-between text-xs text-[color:var(--color-ink-500)]">
                <span>Grade 3</span>
                <span>Grade 10</span>
              </div>
            </div>

            <fieldset className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]">
              <legend className="text-sm font-semibold text-[color:var(--color-foreground)]">Pick interests</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {SUBJECTS.map((subject) => {
                  const selected = interests.includes(subject.id)
                  return (
                    <button
                      key={subject.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleInterest(subject.id)}
                      className={cn(
                        'rounded-[var(--radius-md)] border p-4 text-left transition-transform hover:-translate-y-0.5',
                        selected
                          ? 'border-transparent bg-[color:var(--color-surface)] shadow-[var(--shadow-tactile)]'
                          : 'border-[color:var(--color-border)] bg-transparent',
                      )}
                      style={selected ? { outline: `2px solid color-mix(in oklch, ${subject.color} 32%, transparent)` } : undefined}
                    >
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ background: `color-mix(in oklch, ${subject.color} 12%, transparent)` }}
                      >
                        <subject.icon className="h-5 w-5" style={{ color: subject.color }} strokeWidth={1.8} />
                      </span>
                      <span className="mt-3 block font-medium">{subject.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-[color:var(--color-ink-500)]">{subject.description}</span>
                    </button>
                  )
                })}
              </div>
            </fieldset>

            <fieldset className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]">
              <legend className="text-sm font-semibold text-[color:var(--color-foreground)]">How confident do you feel?</legend>
              <div className="mt-4 grid gap-3">
                {SUBJECTS.map((subject) => (
                  <div key={subject.id} className="grid gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3 sm:grid-cols-[150px_1fr] sm:items-center">
                    <span className="inline-flex items-center gap-2 text-sm font-medium">
                      <subject.icon className="h-4 w-4" style={{ color: subject.color }} strokeWidth={1.8} />
                      {subject.label}
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {CONFIDENCE_LABELS.map((label, index) => (
                        <button
                          key={label}
                          type="button"
                          aria-pressed={(confidence[subject.id] ?? 1) === index}
                          aria-label={`${subject.label}: ${label}`}
                          onClick={() => setConfidence((current) => ({ ...current, [subject.id]: index }))}
                          className={cn(
                            'h-9 rounded-full border text-xs font-medium transition-colors',
                            (confidence[subject.id] ?? 1) === index
                              ? 'border-transparent bg-[color:var(--color-brand-strong)] text-white'
                              : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] text-[color:var(--color-foreground)]',
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>
          </div>
        </section>

        <aside className="hidden lg:sticky lg:top-8 lg:block lg:self-start">
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile-lg)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-ink-500)]">Recommended start</p>
            <div className="mt-4 flex items-start gap-3">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: `color-mix(in oklch, ${recommended.color} 12%, transparent)` }}
              >
                <recommended.icon className="h-6 w-6" style={{ color: recommended.color }} strokeWidth={1.8} />
              </span>
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-2xl">{recommended.label}</h2>
                <p className="mt-1 text-sm leading-6 text-[color:var(--color-ink-500)]">{recommended.description}</p>
              </div>
            </div>

            <div className="mt-5 rounded-[var(--radius-md)] bg-[color:var(--color-surface)] p-4">
              <p className="text-sm font-medium text-[color:var(--color-foreground)]">
                {name.trim() || 'Your learner'} · Grade {grade}
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--color-ink-500)]">
                We will start with the subject you picked that has the most room to grow.
              </p>
            </div>

            <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Mission path</p>
              <h3 className="mt-1 font-[family-name:var(--font-display)] text-xl leading-tight text-[color:var(--color-foreground)]">
                {recommended.mission.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-[color:var(--color-ink-500)]">{recommended.mission.summary}</p>
              <ol className="mt-3 grid gap-2">
                {recommended.mission.steps.map((step, index) => (
                  <li key={step.label} className="grid grid-cols-[1.5rem_1fr] gap-2 text-xs leading-5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[color:var(--color-surface-raised)] font-semibold text-[color:var(--color-brand-strong)]">
                      {index + 1}
                    </span>
                    <span>
                      <span className="font-semibold text-[color:var(--color-foreground)]">{step.label}</span>
                      <span className="block text-[color:var(--color-ink-500)]">{step.reason}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              type="button"
              onClick={start}
              disabled={!canStart}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-strong)] px-5 text-sm font-semibold text-white shadow-[var(--shadow-tactile)] transition-transform hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-45"
            >
              Start first lab
              <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
            </button>

            {!canStart && (
              <p className="mt-3 text-center text-xs text-[color:var(--color-ink-500)]">
                Add a name and choose at least one interest.
              </p>
            )}
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 px-4 py-3 shadow-[0_-16px_40px_rgba(34,23,14,0.10)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: `color-mix(in oklch, ${recommended.color} 12%, transparent)` }}
          >
            <recommended.icon className="h-5 w-5" style={{ color: recommended.color }} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Recommended start
            </p>
            <p className="truncate font-[family-name:var(--font-display)] text-lg leading-tight">
              {recommended.label}
            </p>
          </div>
          <button
            type="button"
            onClick={start}
            disabled={!canStart}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[color:var(--color-brand-strong)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-tactile)] disabled:pointer-events-none disabled:opacity-45"
          >
            Start
            <ArrowRight className="h-4 w-4" strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </main>
  )
}
