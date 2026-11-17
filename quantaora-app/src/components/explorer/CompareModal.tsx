import { Sparkles } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import type { ComponentContent } from '@/data/types'

export default function CompareModal({
  open,
  onClose,
  content,
  candidate,
}: {
  open: boolean
  onClose: () => void
  content: ComponentContent
  candidate: ComponentContent | null
}) {
  return (
    <Modal
      open={open && candidate !== null}
      onClose={onClose}
      title={candidate ? `${content.name} vs. ${candidate.name}` : 'Compare'}
      widthClass="max-w-3xl"
    >
      {candidate && (
        <>
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
            <p className="text-sm leading-relaxed text-[color:var(--color-ink-700)]">{content.compareReason}</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {[content, candidate].map((item) => (
              <div key={item.id} className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] p-4">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: `var(--color-${item.subject}-deep)` }}
                >
                  {item.system}
                </span>
                <h3 className="mt-1 font-[family-name:var(--font-display)] text-2xl text-[color:var(--color-foreground)]">
                  {item.name}
                </h3>
                <p className="mt-1 text-sm italic text-[color:var(--color-ink-500)]">{item.tagline}</p>
                <dl className="mt-4 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
                  {item.keyFacts.map((fact) => (
                    <div key={fact.label} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <dt className="text-[color:var(--color-ink-500)]">{fact.label}</dt>
                      <dd className="text-right font-medium text-[color:var(--color-foreground)]">{fact.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </>
      )}
    </Modal>
  )
}
