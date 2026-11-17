import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Reveal from './Reveal'
import { Button } from '@/components/ui/Button'

export default function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-[color:var(--color-brand-strong)] py-32">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 60% 60% at 20% 20%, color-mix(in oklch, var(--color-aura-400) 60%, transparent), transparent), radial-gradient(ellipse 50% 50% at 85% 80%, color-mix(in oklch, var(--color-physics-deep) 40%, transparent), transparent)',
        }}
      />
      <Reveal className="relative mx-auto max-w-2xl px-6 text-center">
        <h2 className="text-balance font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-[color:var(--color-paper-50)] sm:text-5xl">
          Start with one mission.
          <br />
          Build a map of understanding.
        </h2>
        <Link to="/first-flight" className="mt-9 inline-block">
          <Button
            size="lg"
            className="group !bg-[color:var(--color-paper-50)] !text-[color:var(--color-brand-strong)] hover:!bg-white"
          >
            Start First Flight
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </Link>
      </Reveal>
    </section>
  )
}
