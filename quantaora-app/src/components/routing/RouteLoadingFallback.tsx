import { LoaderCircle } from 'lucide-react'

export default function RouteLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className="flex h-full min-h-[60svh] w-full flex-col items-center justify-center gap-3 bg-[color:var(--color-background)] py-16"
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-[color:var(--color-brand-strong)]" strokeWidth={2} />
      <p className="text-sm font-medium text-[color:var(--color-ink-500)]">Loading…</p>
    </div>
  )
}
