import { Map, HardDriveDownload, ShieldCheck } from 'lucide-react'
import Reveal from './Reveal'

export default function CurriculumSection() {
  return (
    <section className="relative bg-[color:var(--color-surface)] py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Curriculum-aware
          </span>
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
            Choose a grade. Get a real map.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[color:var(--color-ink-700)]">
            Choose a grade and curriculum path. Quantaora builds a skill map from standards,
            prerequisites, and what the learner is studying right now.
          </p>
          <div className="mt-6 inline-flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">
              MVP ships with a built-in starter curriculum. Regional standards are planned as
              downloadable packs.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="relative rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-8 shadow-[var(--shadow-tactile-lg)]">
            <div className="flex items-center gap-2 text-[color:var(--color-brand-strong)]">
              <Map className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Curriculum map</span>
            </div>
            <div className="mt-6 space-y-4">
              {[
                { label: 'Motion & Forces', pct: 82, color: 'var(--color-physics-deep)' },
                { label: 'Cell Biology', pct: 64, color: 'var(--color-biology-deep)' },
                { label: 'Linear Functions', pct: 41, color: 'var(--color-math-deep)' },
                { label: 'Atoms & Elements', pct: 18, color: 'var(--color-chemistry-deep)' },
              ].map((row) => (
                <div key={row.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium text-[color:var(--color-foreground)]">{row.label}</span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-500)]">
                      {row.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--color-surface)]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${row.pct}%`, background: row.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 border-t border-[color:var(--color-border)] pt-5 text-xs text-[color:var(--color-ink-500)]">
              <HardDriveDownload className="h-3.5 w-3.5" />
              Starter curriculum · US, Canada & homeschool paths
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
