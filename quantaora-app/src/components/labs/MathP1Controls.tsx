import type { Dispatch, SetStateAction } from 'react'
import type { MathMission } from '@/data/mathManipulativeMissions'

type MathDomain = 'geometry' | 'fractions' | 'data'

interface MathControls {
  angle: number
  width: number
  height: number
  depth: number
  numerator: number
  denominator: number
  ratioA: number
  ratioB: number
  proportionC: number
  proportionD: number
  dataA: number
  dataB: number
  dataC: number
  outlier: number
}

export function MathMissionPanel({ mission, missionIndex, total, onStart, onNext }: { mission: MathMission; missionIndex: number; total: number; onStart: () => void; onNext: () => void }) {
  return (
    <div data-math-mission className="grid gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-3 shadow-[var(--shadow-tactile)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
            Mission {missionIndex + 1} of {total}
          </p>
          <h2 className="mt-0.5 text-sm font-semibold leading-snug text-[color:var(--color-foreground)]">{mission.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-[color:var(--color-math-deep)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">Try</span>
      </div>
      <div className="grid gap-1.5 text-xs leading-relaxed text-[color:var(--color-ink-600)]">
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Observe:</span> read the live model and measurement cards before changing anything.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Predict:</span> {mission.prompt}
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Change:</span> use the model, quick controls, or tune panel, then compare the new value.
        </p>
        <p>
          <span className="font-semibold text-[color:var(--color-foreground)]">Explain:</span> connect the visible change to the rule named in this mission.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onStart} className="h-9 rounded-full bg-[color:var(--color-math-deep)] px-3 text-xs font-semibold text-white shadow-[var(--shadow-tactile)]">
          Start mission
        </button>
        <button type="button" onClick={onNext} className="h-9 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-xs font-semibold text-[color:var(--color-foreground)]">
          Next
        </button>
      </div>
    </div>
  )
}

export function QuickMathControls({ domain, componentId, controls, setControls }: { domain: MathDomain; componentId: string; controls: MathControls; setControls: Dispatch<SetStateAction<MathControls>> }) {
  const patch = (value: Partial<MathControls>) => setControls((current) => ({ ...current, ...value }))
  const actions: Array<{ label: string; onClick: () => void }> = (() => {
    if (domain === 'geometry') {
      return [
        { label: 'Angle +5', onClick: () => patch({ angle: controls.angle >= 160 ? 20 : controls.angle + 5 }) },
        { label: 'Width +1', onClick: () => patch({ width: controls.width >= 10 ? 2 : controls.width + 1 }) },
        { label: 'Height +1', onClick: () => patch({ height: controls.height >= 8 ? 2 : controls.height + 1 }) },
        { label: 'Make target', onClick: () => patch(geometryTargetFor(componentId)) },
      ]
    }
    if (domain === 'fractions') {
      return [
        { label: 'Part +1', onClick: () => patch({ numerator: controls.numerator >= controls.denominator ? 1 : controls.numerator + 1 }) },
        { label: 'Split +1', onClick: () => patch({ denominator: controls.denominator >= 12 ? 2 : controls.denominator + 1, numerator: Math.min(controls.numerator, controls.denominator >= 12 ? 2 : controls.denominator + 1) }) },
        { label: 'Make half', onClick: () => patch({ numerator: 4, denominator: 8 }) },
        { label: 'Equal mix', onClick: () => patch({ ratioA: 5, ratioB: 5, proportionC: 10, proportionD: 10 }) },
      ]
    }
    return [
      { label: 'A +1', onClick: () => patch({ dataA: controls.dataA >= 12 ? 1 : controls.dataA + 1 }) },
      { label: 'B +1', onClick: () => patch({ dataB: controls.dataB >= 12 ? 1 : controls.dataB + 1 }) },
      { label: 'Out +1', onClick: () => patch({ outlier: controls.outlier >= 14 ? 1 : controls.outlier + 1 }) },
      { label: 'Balance', onClick: () => patch({ dataA: 6, dataB: 6, dataC: 6, outlier: 6 }) },
    ]
  })()

  return (
    <div data-math-quick-controls data-outside-canvas-controls data-canvas-overlay className="hidden min-w-0 flex-1 gap-2 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/92 p-2 shadow-[var(--shadow-tactile)] backdrop-blur-sm md:grid md:max-w-[18rem]">
      <p className="px-1 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Try on the model</p>
      <div className="grid grid-cols-4 gap-1.5">
        {actions.map((action) => (
          <button key={action.label} type="button" onClick={action.onClick} className="min-h-10 rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 text-[11px] font-semibold leading-tight text-[color:var(--color-foreground)] transition-colors hover:border-[color:var(--color-math-deep)]">
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function geometryTargetFor(componentId: string): Partial<MathControls> {
  switch (componentId) {
    case 'angle':
    case 'ray':
      return { angle: 90 }
    case 'area':
      return { width: 5, height: 6 }
    case 'perimeter':
      return { width: 6, height: 6 }
    case 'volume':
      return { width: 6, height: 4, depth: 4 }
    case 'line':
      return { width: 4, height: 7 }
    case 'segment':
      return { width: 8, height: 6 }
    case 'triangle':
      return { width: 5, height: 7, angle: 62 }
    case 'quadrilateral':
    case 'point':
      return { width: 8, height: 8 }
    case 'circle':
      return { width: 8 }
    default:
      return { width: 6, height: 6 }
  }
}
