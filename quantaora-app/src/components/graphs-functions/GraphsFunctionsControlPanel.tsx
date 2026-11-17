import { useMemo, useState } from 'react'
import { ArrowLeftRight, Crosshair, FunctionSquare, MoveDiagonal2, SlidersHorizontal } from 'lucide-react'
import type { ComponentContent } from '@/data/types'

type ControlFocus = 'point' | 'slope' | 'intercept' | 'function' | 'compare'

type GraphControl = {
  title: string
  x: number
  y: number
  slope: number
  intercept: number
  compareSlope?: number
  compareIntercept?: number
  scenario: string
  controlFocus: ControlFocus
}

const GRID_MIN = -6
const GRID_MAX = 6
const GRID_SPAN = GRID_MAX - GRID_MIN

function readControl(content: ComponentContent): GraphControl {
  const control = content.visual?.graphControl as Partial<GraphControl> | undefined
  return {
    title: control?.title ?? 'Explore the graph',
    x: control?.x ?? 2,
    y: control?.y ?? 2,
    slope: control?.slope ?? 1,
    intercept: control?.intercept ?? 0,
    compareSlope: control?.compareSlope,
    compareIntercept: control?.compareIntercept,
    scenario: control?.scenario ?? 'Change one value and watch the graph respond.',
    controlFocus: control?.controlFocus ?? 'function',
  }
}

function clampGraph(value: number) {
  return Math.max(GRID_MIN, Math.min(GRID_MAX, value))
}

function sx(x: number) {
  return ((x - GRID_MIN) / GRID_SPAN) * 100
}

function sy(y: number) {
  return 100 - ((y - GRID_MIN) / GRID_SPAN) * 100
}

function lineEndpoints(slope: number, intercept: number) {
  const candidates = [
    [GRID_MIN, slope * GRID_MIN + intercept],
    [GRID_MAX, slope * GRID_MAX + intercept],
    [(GRID_MIN - intercept) / slope, GRID_MIN],
    [(GRID_MAX - intercept) / slope, GRID_MAX],
  ].filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y) && x >= GRID_MIN && x <= GRID_MAX && y >= GRID_MIN && y <= GRID_MAX)

  const unique = candidates.filter(([x, y], index) =>
    candidates.findIndex(([a, b]) => Math.abs(a - x) < 0.001 && Math.abs(b - y) < 0.001) === index,
  )
  return unique.length >= 2 ? [unique[0], unique[1]] : [[GRID_MIN, intercept], [GRID_MAX, intercept]]
}

function RangeControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)_2.25rem] items-center gap-2 text-xs font-medium text-[color:var(--color-foreground)]">
      <span className="truncate text-[color:var(--color-ink-500)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="min-w-0 accent-[color:var(--color-brand-strong)]"
      />
      <span className="text-right tabular-nums">{value}</span>
    </label>
  )
}

export default function GraphsFunctionsControlPanel({ content }: { content: ComponentContent }) {
  const authored = readControl(content)
  const [x, setX] = useState(authored.x)
  const [pointY, setPointY] = useState(authored.y)
  const [slope, setSlope] = useState(authored.slope)
  const [intercept, setIntercept] = useState(authored.intercept)

  const isPointMode = authored.controlFocus === 'point'
  const output = isPointMode ? pointY : slope * x + intercept
  const compareSlope = authored.compareSlope ?? slope - 1
  const compareIntercept = authored.compareIntercept ?? intercept + 2
  const compareOutput = compareSlope * x + compareIntercept
  const intersection =
    slope === compareSlope ? null : (compareIntercept - intercept) / (slope - compareSlope)

  const lineA = useMemo(() => lineEndpoints(slope, intercept), [slope, intercept])
  const lineB = useMemo(() => lineEndpoints(compareSlope, compareIntercept), [compareSlope, compareIntercept])
  const plottedY = clampGraph(output)
  const pointLabel = isPointMode ? `(${x}, ${pointY})` : `(${x}, ${output})`
  const rateText = slope === 0 ? 'flat' : slope > 0 ? `up ${slope}` : `down ${Math.abs(slope)}`

  return (
    <section
      aria-label={`${content.name} graph controls`}
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%-6.75rem)] overflow-y-auto rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)]/95 p-3 shadow-[var(--shadow-tactile)] backdrop-blur-sm sm:left-auto sm:right-4 sm:top-4 sm:w-[min(21rem,calc(100%-6rem))] sm:max-h-[calc(100%-2rem)]"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-brand-soft)] text-[color:var(--color-brand-strong)]">
          {authored.controlFocus === 'point' ? <Crosshair className="h-4 w-4" /> : authored.controlFocus === 'compare' ? <ArrowLeftRight className="h-4 w-4" /> : <FunctionSquare className="h-4 w-4" />}
        </div>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold leading-snug text-[color:var(--color-foreground)]">{authored.title}</h3>
          <p className="mt-0.5 text-xs leading-snug text-[color:var(--color-ink-600)]">{authored.scenario}</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <svg viewBox="0 0 100 100" role="img" aria-label={`Graph showing ${pointLabel}`} className="block aspect-square w-full">
          {Array.from({ length: 13 }, (_, i) => (
            <g key={i}>
              <line x1={sx(GRID_MIN + i)} y1="0" x2={sx(GRID_MIN + i)} y2="100" stroke="currentColor" className="text-[color:var(--color-border)]" strokeWidth="0.35" />
              <line x1="0" y1={sy(GRID_MIN + i)} x2="100" y2={sy(GRID_MIN + i)} stroke="currentColor" className="text-[color:var(--color-border)]" strokeWidth="0.35" />
            </g>
          ))}
          <line x1="0" y1={sy(0)} x2="100" y2={sy(0)} stroke="#8a7f6d" strokeWidth="0.9" />
          <line x1={sx(0)} y1="0" x2={sx(0)} y2="100" stroke="#8a7f6d" strokeWidth="0.9" />
          {!isPointMode && (
            <>
              {authored.controlFocus === 'compare' && (
                <line x1={sx(lineB[0][0])} y1={sy(lineB[0][1])} x2={sx(lineB[1][0])} y2={sy(lineB[1][1])} stroke="#D96B5A" strokeWidth="2.2" strokeLinecap="round" />
              )}
              <line x1={sx(lineA[0][0])} y1={sy(lineA[0][1])} x2={sx(lineA[1][0])} y2={sy(lineA[1][1])} stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
          <line x1={sx(x)} y1={sy(0)} x2={sx(x)} y2={sy(plottedY)} stroke="#D9A441" strokeWidth="1.2" strokeDasharray="2 2" />
          <circle cx={sx(x)} cy={sy(plottedY)} r="3.2" fill="#D9A441" stroke="#fffaf0" strokeWidth="1.4" />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Rule</p>
          <p className="mt-1 truncate text-xs font-semibold tabular-nums">y = {slope}x {intercept < 0 ? '-' : '+'} {Math.abs(intercept)}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Point</p>
          <p className="mt-1 truncate text-xs font-semibold tabular-nums">{pointLabel}</p>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Rate</p>
          <p className="mt-1 truncate text-xs font-semibold">{rateText}</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Change one thing
        </div>
        <RangeControl label="x input" value={x} min={GRID_MIN} max={GRID_MAX} onChange={setX} />
        {isPointMode ? (
          <RangeControl label="y height" value={pointY} min={GRID_MIN} max={GRID_MAX} onChange={setPointY} />
        ) : (
          <>
            <RangeControl label="slope m" value={slope} min={-3} max={3} onChange={setSlope} />
            <RangeControl label="start b" value={intercept} min={GRID_MIN} max={GRID_MAX} onChange={setIntercept} />
          </>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-[var(--radius-sm)] bg-[color:var(--color-brand-soft)] p-2 text-xs leading-snug text-[color:var(--color-foreground)]">
        <MoveDiagonal2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand-strong)]" />
        <p>
          {isPointMode
            ? 'The coordinates cause the dot to move: x goes sideways, y goes up or down.'
            : authored.controlFocus === 'compare'
              ? intersection === null
                ? 'Same slope means the lines stay the same distance apart.'
                : `At x = ${x}, blue gives ${output} and red gives ${compareOutput}; they match near x = ${Number(intersection.toFixed(1))}.`
              : `Slope changes the rate, intercept changes the start, and x = ${x} gives y = ${output}.`}
        </p>
      </div>
    </section>
  )
}
