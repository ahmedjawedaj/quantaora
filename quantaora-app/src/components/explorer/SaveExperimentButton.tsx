import { useEffect, useRef, useState } from 'react'
import { Save, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

export interface SaveExperimentButtonProps {
  /** Component/lab id, e.g. `content.id`. */
  labId: string
  /** Human-readable lab/component name, e.g. `content.name`. */
  labName: string
  subject: string
  branch?: string
  /** Current route, e.g. `location.pathname`, saved as part of the snapshot. */
  route?: string
  /**
   * Any additional genuinely-live state the caller has on hand (e.g. mastery,
   * favorited status, or — for labs that opt in later — their own control
   * state). Never fabricate values here; omit a key if it isn't real.
   */
  state?: Record<string, unknown>
  className?: string
}

const CONFIRMATION_MS = 2200

/**
 * Shared "Save experiment" action, usable from any lab via `BottomTray` (or
 * standalone). Snapshots whatever state is genuinely available at call time
 * — never synthesized measurements — into `useAppStore`'s
 * `experimentSnapshots`, which `Notebook.tsx` renders under "Saved
 * experiments".
 *
 * Duplicate-spam protection lives in the store (`saveExperimentSnapshot`):
 * content-hash + minimum-interval dedupe against the most recent snapshot
 * for the same lab. This component adds a second, UI-level guard — clicks
 * are ignored while the confirmation state is showing — and reflects the
 * store's honest `created` flag ("Saved!" vs "Already saved") rather than
 * always claiming success.
 */
export default function SaveExperimentButton({
  labId,
  labName,
  subject,
  branch,
  route,
  state,
  className,
}: SaveExperimentButtonProps) {
  const saveExperimentSnapshot = useAppStore((s) => s.saveExperimentSnapshot)
  const [status, setStatus] = useState<'idle' | 'saved' | 'duplicate'>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    },
    [],
  )

  function handleSave() {
    // UI-level debounce: ignore mashing while a confirmation is already showing.
    if (status !== 'idle') return

    const snapshotState: Record<string, unknown> = { ...(state ?? {}) }
    if (route) snapshotState.route = route
    if (branch) snapshotState.branch = branch

    const { created } = saveExperimentSnapshot({
      labId,
      labName,
      subject,
      title: `${labName} — saved setup`,
      state: snapshotState,
    })

    setStatus(created ? 'saved' : 'duplicate')
    timeoutRef.current = setTimeout(() => setStatus('idle'), CONFIRMATION_MS)
  }

  const label = status === 'idle' ? 'Save this setup' : status === 'saved' ? 'Saved!' : 'Already saved'

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={status !== 'idle'}
      aria-live="polite"
      className={cn(
        'flex min-h-[5rem] flex-col items-start gap-1 rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-2 text-left transition-colors hover:bg-[color:var(--color-surface)] disabled:cursor-default sm:min-h-0 sm:p-3',
        className,
      )}
    >
      {status === 'idle' ? (
        <Save className="h-4 w-4 text-[color:var(--color-brand)]" strokeWidth={1.75} />
      ) : (
        <CheckCircle2 className="h-4 w-4 text-emerald-500" strokeWidth={1.75} />
      )}
      <span className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)] sm:text-xs">
        Experiment
      </span>
      <span className="text-xs font-medium text-[color:var(--color-foreground)] sm:text-sm">{label}</span>
    </button>
  )
}
