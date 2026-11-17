import type { ReactNode } from 'react'
import { Gauge, Minus, Plus, type LucideIcon } from 'lucide-react'

export interface GenericCauseControls {
  [key: string]: number
}

export interface GenericCauseControl {
  key: string
  label: string
  min: number
  max: number
  step?: number
  unit: string
}

export interface GenericCauseResult {
  title: string
  body: string
}

export interface GenericCauseComputed {
  primary: number
  secondary: number
  focus: string
  results: [GenericCauseResult, GenericCauseResult]
  evidence?: GenericCauseResult[]
  causeMap?: {
    input: string
    mechanism: string
    outcome: string
  }
}

export interface BranchCauseEffectConfig {
  branchId: string
  dataAttribute: string
  eyebrow: string
  title: string
  icon: LucideIcon
  accent: string
  gradient: string
  controls: GenericCauseControl[]
  defaultControls: GenericCauseControls
  focusByComponent: Record<string, string>
  defaultFocus: string
  compute: (controls: GenericCauseControls, activeId: string) => GenericCauseComputed
}

function ResultCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-[color:var(--color-foreground)]">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{children}</p>
    </div>
  )
}

function ControlRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  accent,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit: string
  accent: string
  onChange: (value: number) => void
}) {
  const applyDelta = (delta: number) => {
    const next = Math.max(min, Math.min(max, value + delta))
    onChange(next)
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[color:var(--color-foreground)]">
        <span>{label}</span>
        <div className="inline-flex items-center gap-1 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-1 py-0.5">
          <button
            type="button"
            onClick={() => applyDelta(-(step || 1))}
            disabled={value <= min}
            aria-label={`Decrease ${label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-ink-500)] transition-colors hover:bg-[color:var(--color-surface-raised)] disabled:opacity-35"
          >
            <Minus className="h-3 w-3" strokeWidth={2} />
          </button>
          <span className="min-w-10 text-center text-[11px] text-[color:var(--color-ink-500)]">
            {value}
            {unit}
          </span>
          <button
            type="button"
            onClick={() => applyDelta(step || 1)}
            disabled={value >= max}
            aria-label={`Increase ${label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[color:var(--color-ink-500)] transition-colors hover:bg-[color:var(--color-surface-raised)] disabled:opacity-35"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
          </button>
        </div>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="h-2 w-full"
        style={{ accentColor: accent }}
      />
    </div>
  )
}

export function BranchCauseEffectPanel({
  activeId,
  config,
  controls,
  onChange,
}: {
  activeId: string
  config: BranchCauseEffectConfig
  controls: GenericCauseControls
  onChange: (next: GenericCauseControls) => void
}) {
  const Icon = config.icon
  const computed = config.compute(controls, activeId)
  const dataProps = { [config.dataAttribute]: '' } as Record<string, string>
  const dots = Array.from({ length: 15 }, (_, index) => ({
    primary: index < Math.ceil(computed.primary / 8),
    secondary: index < Math.ceil(computed.secondary / 8),
  }))

  return (
    <div {...dataProps} data-branch-cause-effect={config.branchId} className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{config.eyebrow}</p>
          <h3 className="mt-1 font-[family-name:var(--font-display)] text-lg text-[color:var(--color-foreground)]">
            {config.title}
          </h3>
        </div>
        <Icon className="h-5 w-5 shrink-0" style={{ color: config.accent }} strokeWidth={1.8} />
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
        <div className="grid min-h-[8rem] gap-3 rounded-[var(--radius-sm)] p-3 sm:grid-cols-[0.82fr_1fr]" style={{ background: config.gradient }}>
          <div className="flex flex-col justify-center gap-2">
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(8, computed.primary)}%`, background: config.accent }} />
            </div>
            <div className="h-2 rounded-full bg-[color:var(--color-border)]">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${Math.max(8, computed.secondary)}%` }} />
            </div>
            <p className="text-xs leading-relaxed text-[color:var(--color-ink-500)]">{computed.focus}</p>
          </div>
          <div className="grid grid-cols-5 items-center gap-1.5 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
            {dots.map((dot, index) => (
              <span
                key={index}
                className={`justify-self-center rounded-full transition-all ${dot.primary ? 'bg-emerald-400' : dot.secondary ? 'bg-amber-400' : 'bg-[color:var(--color-border)]'}`}
                style={{ height: dot.primary ? 9 : 5, width: dot.secondary ? 9 : 5, opacity: dot.primary || dot.secondary ? 1 : 0.65 }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        {config.controls.map((control) => (
          <ControlRow
            key={control.key}
            label={control.label}
            value={controls[control.key] ?? 0}
            min={control.min}
            max={control.max}
            step={control.step}
            unit={control.unit}
            accent={config.accent}
            onChange={(value) => onChange({ ...controls, [control.key]: value })}
          />
        ))}
      </div>

      {computed.evidence && computed.evidence.length > 0 && (
        <div className="mt-4 grid gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
            What changes on the model
          </p>
          <div className="grid gap-2">
            {computed.evidence.map((item) => (
              <ResultCard key={item.title} icon={Icon} title={item.title}>
                {item.body}
              </ResultCard>
            ))}
          </div>
        </div>
      )}

      {computed.causeMap && (
        <div className="mt-4 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
            Cause map
          </p>
          <div className="mt-2 grid gap-2">
            {[
              ['Input changed', computed.causeMap.input],
              ['System response', computed.causeMap.mechanism],
              ['Observable result', computed.causeMap.outcome],
            ].map(([label, body], index) => (
              <div key={label} className="relative rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2.5">
                <span
                  aria-hidden="true"
                  className="absolute -top-1.5 left-5 h-3 w-3 rotate-45 border-l border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]"
                  style={{ display: index === 0 ? 'none' : undefined }}
                />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">{label}</p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-foreground)]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 grid gap-2">
        <ResultCard icon={Gauge} title={computed.results[0].title}>
          {computed.results[0].body}
        </ResultCard>
        <ResultCard icon={Icon} title={computed.results[1].title}>
          {computed.results[1].body}
        </ResultCard>
      </div>
    </div>
  )
}
