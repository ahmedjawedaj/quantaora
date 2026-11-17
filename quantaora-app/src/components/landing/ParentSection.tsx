import { TrendingUp, AlertTriangle, Clock, BookOpen, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import Reveal from './Reveal'
import { Button } from '@/components/ui/Button'

const CARDS = [
  { icon: TrendingUp, label: 'Strongest subject', value: 'Space', tone: 'var(--color-space-deep)' },
  { icon: AlertTriangle, label: 'Needs review', value: 'Slope & rate of change', tone: 'var(--color-math-deep)' },
  { icon: Clock, label: 'Time practiced this week', value: '2h 14m', tone: 'var(--color-brand-strong)' },
  { icon: BookOpen, label: 'Suggested next mission', value: 'Motion graphs', tone: 'var(--color-physics-deep)' },
]

export default function ParentSection() {
  return (
    <section id="parents" className="relative bg-[color:var(--color-surface)] py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-14 px-6 lg:grid-cols-2 lg:items-center">
        <Reveal>
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Parent & teacher insight
          </span>
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
            See what was practiced. See what's mastered.
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-[color:var(--color-ink-700)]">
            No punitive controls, no locked features — just a clear view of progress by subject,
            what's stuck, and what to try next.
          </p>
          <Link to="/app/grownups" className="mt-6 inline-block">
            <Button variant="secondary" className="group">
              Open the parent zone
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </Reveal>

        <Reveal delay={0.15} className="grid grid-cols-2 gap-3">
          {CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-5 shadow-[var(--shadow-tactile)]"
            >
              <card.icon className="h-4 w-4" style={{ color: card.tone }} strokeWidth={1.75} />
              <p className="mt-3 text-xs text-[color:var(--color-ink-500)]">{card.label}</p>
              <p className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
                {card.value}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}
