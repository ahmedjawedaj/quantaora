import { RotateCcw, Compass, Target, CheckCircle2, Save } from 'lucide-react'
import Reveal from './Reveal'

const STAGES = [
  { icon: RotateCcw, label: 'Review', body: 'A spaced-review item due today' },
  { icon: Compass, label: 'Explore', body: 'One new concept, shown first' },
  { icon: Target, label: 'Practice', body: 'A targeted exercise on that skill' },
  { icon: CheckCircle2, label: 'Checkpoint', body: 'A short quiz with real feedback' },
  { icon: Save, label: 'Save', body: 'Mastery updates, locally, instantly' },
]

export default function TutorSection() {
  return (
    <section className="relative bg-[color:var(--color-surface)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <Reveal>
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
              Built like a tutor
            </span>
            <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
              Every mission adapts to what the learner knows.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-[color:var(--color-ink-700)]">
              Quantaora turns exploration into progress. Each activity connects to a micro-skill,
              each micro-skill connects to curriculum, and every mission is built fresh from
              mastery, prerequisites, and what's due for review.
            </p>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="rounded-[var(--radius-xl)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3 shadow-[var(--shadow-tactile-lg)]">
              <ol className="flex flex-col">
                {STAGES.map((stage, i) => (
                  <li
                    key={stage.label}
                    className="group flex items-center gap-4 rounded-[var(--radius-md)] px-4 py-3.5 transition-colors hover:bg-[color:var(--color-surface)]"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-background)] text-[color:var(--color-brand-strong)]">
                        <stage.icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {i < STAGES.length - 1 && <span className="h-6 w-px bg-[color:var(--color-border)]" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{stage.label}</p>
                      <p className="text-[13px] text-[color:var(--color-ink-500)]">{stage.body}</p>
                    </div>
                    <span className="ml-auto font-[family-name:var(--font-mono)] text-xs text-[color:var(--color-ink-300)]">
                      0{i + 1}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
