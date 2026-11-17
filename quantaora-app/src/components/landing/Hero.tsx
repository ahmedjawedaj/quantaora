import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ChevronDown, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'

const HeroScene = lazy(() => import('./HeroScene'))

const easing = [0.16, 1, 0.3, 1] as const

function HeroSceneFallback() {
  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      <div className="h-40 w-40 animate-pulse rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]" />
    </div>
  )
}

export default function Hero() {
  const prefersReducedMotion = Boolean(useReducedMotion())
  // Critical content must paint at opacity 1 on the first frame; only subtle,
  // non-blocking transforms (never opacity) are allowed to animate in.
  const entrance = (transform: Record<string, number>) => ({
    initial: prefersReducedMotion ? false : transform,
    animate: Object.fromEntries(Object.keys(transform).map((key) => [key, 0])),
  })

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-[color:var(--color-background)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_20%,var(--color-aura-100),transparent)]" />
      <Suspense fallback={<HeroSceneFallback />}>
        <HeroScene reducedMotion={prefersReducedMotion} />
      </Suspense>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,var(--color-background)_92%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 pt-24 text-center">
        <motion.div
          {...entrance({ y: 10 })}
          transition={{ duration: 0.6, delay: 0.1, ease: easing }}
          className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/80 px-3.5 py-1.5 text-xs font-medium tracking-wide text-[color:var(--color-ink-700)] backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
          Physics · Chemistry · Math · Biology · Space
        </motion.div>

        <motion.h1
          {...entrance({ y: 16 })}
          transition={{ duration: 0.7, delay: 0.2, ease: easing }}
          className="text-balance font-[family-name:var(--font-display)] text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.98] tracking-tight text-[color:var(--color-foreground)]"
        >
          See science
          <br />
          <span className="italic text-[color:var(--color-brand-strong)]">move.</span>
        </motion.h1>

        <motion.p
          {...entrance({ y: 16 })}
          transition={{ duration: 0.7, delay: 0.32, ease: easing }}
          className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-[color:var(--color-ink-700)]"
        >
          Explore physics, chemistry, math, biology, and space through clean 3D models,
          interactive labs, and short curriculum-linked missions.
        </motion.p>

        <motion.div
          {...entrance({ y: 16 })}
          transition={{ duration: 0.7, delay: 0.44, ease: easing }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <Link to="/first-flight">
            <Button size="lg" className="group">
              Start your first mission
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
          <Link to="/app/labs/atoms">
            <Button variant="secondary" size="lg">
              Try a demo lab
            </Button>
          </Link>
        </motion.div>

        <motion.p
          {...entrance({ y: 8 })}
          transition={{ duration: 0.6, delay: 0.5, ease: easing }}
          className="mt-5 text-xs text-[color:var(--color-ink-500)]"
        >
          No account needed · Progress stays on this device
        </motion.p>
      </div>

      <motion.div
        {...entrance({ y: 8 })}
        transition={{ duration: 0.6, delay: 0.6, ease: easing }}
        className="relative z-10 flex justify-center pb-8"
      >
        <a
          href="#studio"
          aria-label="Scroll to explore the studio"
          className="animate-[bounce_2.4s_ease-in-out_infinite] rounded-full border border-[color:var(--color-border)] p-2 text-[color:var(--color-ink-500)] transition-colors hover:text-[color:var(--color-foreground)]"
        >
          <ChevronDown className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  )
}
