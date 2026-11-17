import { Atom, FlaskConical, Sigma, Dna, Orbit, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal'

const SUBJECTS = [
  {
    id: 'physics',
    name: 'Physics',
    icon: Atom,
    deep: 'var(--color-physics-deep)',
    accent: 'var(--color-physics-accent)',
    blurb: 'Forces, energy, waves, circuits.',
    labs: ['Motion Lab: cart & friction', 'Skate-ramp energy transfer', 'Circuit builder'],
  },
  {
    id: 'chemistry',
    name: 'Chemistry',
    icon: FlaskConical,
    deep: 'var(--color-chemistry-deep)',
    accent: 'var(--color-chemistry-accent)',
    blurb: 'Atoms, bonding, reactions, periodic trends.',
    labs: ['Molecule Builder: water, CO₂, methane', 'Balance the equation', 'Periodic trend heatmap'],
  },
  {
    id: 'math',
    name: 'Math',
    icon: Sigma,
    deep: 'var(--color-math-deep)',
    accent: 'var(--color-math-accent)',
    blurb: 'Algebra, geometry, functions, statistics.',
    labs: ['Function Studio: slope & intercept', 'Algebra balance scale', 'Area decomposition'],
  },
  {
    id: 'biology',
    name: 'Biology',
    icon: Dna,
    deep: 'var(--color-biology-deep)',
    accent: 'var(--color-biology-accent)',
    blurb: 'Cells, anatomy, genetics, ecosystems.',
    labs: ['Heart: chambers & blood flow', 'Cell Explorer: organelles', 'Food-web builder'],
    featured: true,
  },
  {
    id: 'space',
    name: 'Space',
    icon: Orbit,
    deep: 'var(--color-space-deep)',
    accent: 'var(--color-space-accent)',
    blurb: 'Orbits, planets, gravity, rockets.',
    labs: ['Orbit Sandbox: mass & distance', 'Solar system scale mode', 'Seasons simulator'],
  },
]

export default function SubjectsSection() {
  return (
    <section id="subjects" className="relative bg-[color:var(--color-background)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Five subjects, one engine
          </span>
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
            Every subject, built the same careful way.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((subject, i) => (
            <Reveal
              key={subject.id}
              delay={i * 0.06}
              className={subject.featured ? 'sm:col-span-2 lg:col-span-1 lg:row-span-1' : ''}
            >
              <Link
                to="/app/labs"
                className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-7 shadow-[var(--shadow-tactile)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-tactile-lg)]"
              >
                <div
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-[0.14] blur-2xl transition-opacity duration-300 group-hover:opacity-25"
                  style={{ background: subject.deep }}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: `color-mix(in oklch, ${subject.deep} 12%, transparent)` }}
                  >
                    <subject.icon className="h-6 w-6" style={{ color: subject.deep }} strokeWidth={1.6} />
                  </div>
                  {subject.featured && (
                    <span className="rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-background)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                      Try this one
                    </span>
                  )}
                </div>

                <h3 className="relative mt-5 font-[family-name:var(--font-display)] text-2xl text-[color:var(--color-foreground)]">
                  {subject.name}
                </h3>
                <p className="relative mt-1 text-sm text-[color:var(--color-ink-500)]">{subject.blurb}</p>

                <ul className="relative mt-5 space-y-2 border-t border-[color:var(--color-border)] pt-5 text-[13px] text-[color:var(--color-ink-700)]">
                  {subject.labs.map((lab) => (
                    <li key={lab} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                        style={{ background: subject.deep }}
                      />
                      {lab}
                    </li>
                  ))}
                </ul>

                <div className="relative mt-6 flex items-center gap-1 text-sm font-medium text-[color:var(--color-foreground)]">
                  Explore {subject.name.toLowerCase()}
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
