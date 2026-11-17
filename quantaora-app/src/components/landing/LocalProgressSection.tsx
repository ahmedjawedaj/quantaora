import { Lock, Smartphone, KeyRound } from 'lucide-react'
import Reveal from './Reveal'

const POINTS = [
  { icon: Lock, title: 'No account for the MVP', body: 'Nothing to sign up for, nothing to remember.' },
  { icon: Smartphone, title: 'Everything stays on this device', body: 'Profiles, notes, mastery, and saved labs never leave.' },
  { icon: KeyRound, title: 'Export a backup any time', body: 'A single code from Settings — yours to keep.' },
]

export default function LocalProgressSection() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--color-background)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Progress stays local
          </span>
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
            Your child's data is not the product.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 0.08}>
              <div className="h-full rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-7 text-center shadow-[var(--shadow-tactile)]">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)]">
                  <point.icon className="h-5 w-5 text-[color:var(--color-brand-strong)]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-base font-semibold text-[color:var(--color-foreground)]">{point.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-500)]">{point.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
