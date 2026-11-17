import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Lock, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BranchInfo } from '@/data/hierarchy'

export interface NavComponentItem {
  id: string
  name: string
  meta?: string
  icon?: LucideIcon
}

export default function ContentNav({
  subjectName,
  subjectColor,
  defaultIcon: DefaultIcon,
  branchName,
  items,
  activeItemId,
  onSelect,
  otherBranches,
  footerNote,
}: {
  subjectName: string
  subjectColor: string
  defaultIcon: LucideIcon
  branchName: string
  items: NavComponentItem[]
  activeItemId: string
  onSelect: (id: string) => void
  otherBranches: BranchInfo[]
  footerNote?: ReactNode
}) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-500)]">
          {subjectName}
        </span>
        <h2 className="mt-0.5 text-sm font-semibold text-[color:var(--color-foreground)]">{branchName}</h2>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = item.icon ?? DefaultIcon
          const active = item.id === activeItemId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-left transition-colors',
                active ? '' : 'border-transparent hover:bg-[color:var(--color-surface)]',
              )}
              style={
                active
                  ? {
                      borderColor: `color-mix(in oklch, ${subjectColor} 25%, transparent)`,
                      background: `color-mix(in oklch, ${subjectColor} 8%, var(--color-surface-raised))`,
                    }
                  : undefined
              }
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: active ? `color-mix(in oklch, ${subjectColor} 14%, transparent)` : 'var(--color-surface)' }}
              >
                <Icon className="h-4 w-4" style={{ color: active ? subjectColor : 'var(--color-ink-500)' }} strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-[color:var(--color-foreground)]">{item.name}</span>
                {item.meta && <span className="block truncate text-[11px] text-[color:var(--color-ink-500)]">{item.meta}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {footerNote && (
        <div className="mt-3 rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-border)] px-3 py-3 text-[11px] leading-relaxed text-[color:var(--color-ink-500)]">
          {footerNote}
        </div>
      )}

      {otherBranches.length > 0 && (
        <div className="mt-5 border-t border-[color:var(--color-border)] pt-4">
          <span className="mb-2 block px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-ink-500)]">
            Other branches of {subjectName}
          </span>
          <div className="flex flex-col gap-0.5">
            {otherBranches.map((b) =>
              b.status === 'live' && b.route ? (
                <Link
                  key={b.id}
                  to={b.route}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] transition-colors hover:bg-[color:var(--color-surface)]"
                >
                  <span className="truncate font-medium" style={{ color: subjectColor }}>
                    {b.name}
                  </span>
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: subjectColor }}
                  >
                    Live
                  </span>
                </Link>
              ) : (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-1.5 text-[12px] text-[color:var(--color-ink-500)]"
                >
                  <span className="truncate">{b.name}</span>
                  <span className="flex shrink-0 items-center gap-1 text-[9px] font-semibold uppercase tracking-wide opacity-70">
                    <Lock className="h-2.5 w-2.5" />
                    {b.status === 'authored-pending' ? 'Not built yet' : 'Coming soon'}
                  </span>
                </div>
              ),
            )}
          </div>
          <Link
            to="/app/subjects"
            className="mt-3 flex items-center gap-1 px-1 text-[11px] font-medium text-[color:var(--color-ink-500)] hover:text-[color:var(--color-foreground)]"
          >
            Browse all subjects <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  )
}
