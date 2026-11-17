import { Link } from 'react-router-dom'
import { Compass, Home } from 'lucide-react'

/** Catch-all for unmatched paths, both top-level ("/*") and nested inside "/app/*". Links are
 *  absolute so this renders identically whether or not it's inside the AppShell chrome. */
export default function NotFound() {
  return (
    <div
      role="main"
      aria-labelledby="not-found-heading"
      className="flex h-full min-h-[70svh] w-full flex-col items-center justify-center gap-4 bg-[color:var(--color-background)] px-6 py-16 text-center"
    >
      <p className="font-[family-name:var(--font-display)] text-5xl text-[color:var(--color-brand-strong)]">404</p>
      <h1
        id="not-found-heading"
        className="font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]"
      >
        We couldn't find that page.
      </h1>
      <p className="max-w-xs text-sm text-[color:var(--color-ink-500)]">
        The link may be broken or the page may have moved — your progress is safe.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-strong)] px-5 text-[0.95rem] font-medium text-[color:var(--color-paper-50)] shadow-[var(--shadow-tactile)] transition-all duration-200 ease-out hover:bg-[color:var(--color-aura-900)] active:scale-[0.97]"
        >
          <Home className="h-4 w-4" strokeWidth={1.8} />
          Back to home
        </Link>
        <Link
          to="/app/labs"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-5 text-[0.95rem] font-medium text-[color:var(--color-foreground)] transition-all duration-200 ease-out hover:border-[color:var(--color-ink-300)] active:scale-[0.97]"
        >
          <Compass className="h-4 w-4" strokeWidth={1.8} />
          Browse Labs
        </Link>
      </div>
    </div>
  )
}
