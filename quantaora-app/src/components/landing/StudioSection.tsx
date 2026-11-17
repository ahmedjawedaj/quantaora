import { Atom, FlaskConical, Sigma, Dna, Orbit } from 'lucide-react'
import Reveal from './Reveal'

const TILES = [
  {
    icon: Dna,
    title: '3D anatomy & biology models',
    body: 'Rotate a heart, isolate a chamber, and watch blood actually flow through it.',
    accent: 'var(--color-biology-deep)',
  },
  {
    icon: Atom,
    title: 'Physics simulations with live graphs',
    body: 'Drag a cart, change the friction, and watch the position-time graph respond instantly.',
    accent: 'var(--color-physics-deep)',
  },
  {
    icon: FlaskConical,
    title: 'Chemistry molecule & reaction labs',
    body: 'Build water and methane atom by atom, then balance a real reaction.',
    accent: 'var(--color-chemistry-deep)',
  },
  {
    icon: Sigma,
    title: 'Math manipulatives & function explorers',
    body: 'Drag a line, watch the equation and table update together in real time.',
    accent: 'var(--color-math-deep)',
  },
  {
    icon: Orbit,
    title: 'Solar-system & gravity sandboxes',
    body: 'Change a planet’s mass and distance, then run the orbit to see what happens.',
    accent: 'var(--color-space-deep)',
  },
]

export default function StudioSection() {
  return (
    <section id="studio" className="relative bg-[color:var(--color-background)] py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand)]">
            Interactive STEM Studio
          </span>
          <h2 className="mt-4 text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-foreground)] sm:text-5xl">
            Touch the model. Change the variables.
            <br />
            Watch the system respond.
          </h2>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TILES.map((tile, i) => (
            <Reveal key={tile.title} delay={i * 0.06} className={i === 4 ? 'sm:col-span-2 lg:col-span-1' : ''}>
              <div className="group h-full rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-7 shadow-[var(--shadow-tactile)] transition-transform duration-300 hover:-translate-y-1">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ background: `color-mix(in oklch, ${tile.accent} 14%, transparent)` }}
                >
                  <tile.icon className="h-5 w-5" style={{ color: tile.accent }} strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[color:var(--color-foreground)]">{tile.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--color-ink-500)]">{tile.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
