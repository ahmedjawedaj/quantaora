import { Component, type ReactNode } from 'react'
import { Html } from '@react-three/drei'
import { cn } from '@/lib/utils'

/**
 * Shared GLB-load error boundary, extracted after eleven files (GenericViewer, CellViewer,
 * OrganViewer, StarViewer, CrystalViewer, MoleculeModel, MoonModel, EarthSpaceViewer,
 * PlanetModel, EcologyLab, MicrobiologyLab, MathManipulativesLab) each independently
 * reimplemented the same `class extends Component` + `getDerivedStateFromError` +
 * `componentDidCatch` shape. Pairs with the shared `useGlbRetry` hook (./useGlbRetry.ts), which
 * busts drei's useGLTF cache before bumping the `key` that remounts this boundary.
 *
 * Two call shapes:
 *  - pass `fallback` for a caller-supplied permanent replacement (procedural mesh, placeholder
 *    sphere, or an accessible status/alert node) -- used by viewers with their own substitute
 *    visual instead of a canned message.
 *  - omit `fallback` and pass `message`/`onRetry` for the built-in accessible "couldn't load" +
 *    Try again card -- used by viewers with no substitute visual of their own.
 * `onError` fires in addition to either shape (e.g. MicrobiologyLab's Tune-panel reflow signal,
 * PlanetModel's per-body settled-readiness signal). Resetting on a new load attempt or a changed
 * model URL is still the caller's job via a `key` prop on the JSX usage (by url/retryKey/both,
 * matching whatever each call site already keyed on before migration) -- this boundary only reads
 * `hasError` from its own local state, so a fresh `key` remount is what actually clears it.
 */
interface GlbErrorBoundaryProps {
  children: ReactNode
  /** Caller-supplied permanent replacement shown on error, in place of the built-in card. */
  fallback?: ReactNode
  /** Wires the built-in card's "Try again" button. Ignored when `fallback` is supplied. */
  onRetry?: () => void
  /** Extra hook fired from componentDidCatch, alongside the built-in console log. */
  onError?: (error: unknown) => void
  /** Built-in card copy. Defaults to "This 3D model couldn't load." */
  message?: string
  /** Built-in card button label. Defaults to "Try again". */
  retryLabel?: string
  /** Console log source label, e.g. "[CrystalViewer]". */
  source?: string
  /** Extra classes appended to the built-in card's wrapper div -- e.g. MicrobiologyLab's
   *  mobile-safe vertical offset so the card clears an absolutely-positioned chip row below it. */
  cardClassName?: string
  /** Html zIndexRange override for the built-in card -- e.g. MicrobiologyLab's stacking priority
   *  over its floating Tune panel. */
  zIndexRange?: [number, number]
}

export class GlbErrorBoundary extends Component<GlbErrorBoundaryProps, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: unknown) {
    console.error(`${this.props.source ?? '[GlbErrorBoundary]'} GLB failed to load.`, error)
    this.props.onError?.(error)
  }
  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback !== undefined) return this.props.fallback
    return (
      <Html center zIndexRange={this.props.zIndexRange}>
        <div
          role="alert"
          className={cn(
            'flex flex-col items-center gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] px-4 py-3 text-center shadow-[var(--shadow-tactile)]',
            this.props.cardClassName,
          )}
        >
          <p className="text-xs font-medium text-[color:var(--color-ink-500)]">{this.props.message ?? "This 3D model couldn't load."}</p>
          <button
            type="button"
            onClick={this.props.onRetry}
            className="rounded-full bg-[color:var(--color-ink-900)] px-3 py-1 text-[11px] font-semibold text-white"
          >
            {this.props.retryLabel ?? 'Try again'}
          </button>
        </div>
      </Html>
    )
  }
}

/** Accessible "still loading" pill for the `<Suspense fallback={...}>` immediately around a
 *  GlbErrorBoundary's children -- standardizes the role="status" aria-live="polite" markup every
 *  built-in-card viewer duplicated verbatim (message text is the only thing that varies). */
export function GlbLoadingStatus({ message = 'Loading model…' }: { message?: string }) {
  return (
    <Html center zIndexRange={[20, 0]}>
      <div
        role="status"
        aria-live="polite"
        className="w-[min(280px,calc(100vw-4rem))] rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 px-4 py-3 text-center shadow-[var(--shadow-tactile)] backdrop-blur-sm"
      >
        <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand)]/10">
          <div className="h-3.5 w-3.5 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
        </div>
        <p className="mt-2 text-xs font-semibold text-[color:var(--color-ink-700)]">{message}</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[color:var(--color-border)]">
          <div className="h-full w-2/3 animate-pulse rounded-full bg-[color:var(--color-brand)]" />
        </div>
      </div>
    </Html>
  )
}
