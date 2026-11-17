import { useMemo } from 'react'

const WIDTH = 320
const HEIGHT = 150
const PAD_LEFT = 40
const PAD_RIGHT = 10
const PAD_TOP = 10
const PAD_BOTTOM = 24

export default function LiveChart({
  points,
  color,
  label,
  unit,
}: {
  points: { t: number; value: number }[]
  color: string
  label: string
  unit: string
}) {
  const { path, yMin, yMax, tMax } = useMemo(() => {
    if (points.length < 2) return { path: '', yMin: -1, yMax: 1, tMax: 1 }
    const values = points.map((p) => p.value)
    let lo = Math.min(0, ...values)
    let hi = Math.max(0, ...values)
    if (hi - lo < 1) {
      hi += 0.5
      lo -= 0.5
    }
    const span = hi - lo
    lo -= span * 0.15
    hi += span * 0.15
    const tMaxVal = Math.max(points[points.length - 1].t, 1)

    const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
    const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM
    const d = points
      .map((p, i) => {
        const x = PAD_LEFT + (p.t / tMaxVal) * plotW
        const y = PAD_TOP + (1 - (p.value - lo) / (hi - lo)) * plotH
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' ')
    return { path: d, yMin: lo, yMax: hi, tMax: tMaxVal }
  }, [points])

  const zeroY = PAD_TOP + (1 - (0 - yMin) / (yMax - yMin)) * (HEIGHT - PAD_TOP - PAD_BOTTOM)

  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-[color:var(--color-ink-500)]">
        {label} ({unit})
      </p>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full rounded-[var(--radius-sm)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={zeroY} y2={zeroY} stroke="var(--color-border)" strokeWidth={1} />
        <line x1={PAD_LEFT} x2={PAD_LEFT} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-ink-300)" strokeWidth={1} />
        <text x={4} y={PAD_TOP + 8} fontSize={9} fill="var(--color-ink-500)">{yMax.toFixed(1)}</text>
        <text x={4} y={HEIGHT - PAD_BOTTOM} fontSize={9} fill="var(--color-ink-500)">{yMin.toFixed(1)}</text>
        <text x={WIDTH - PAD_RIGHT} y={HEIGHT - 4} fontSize={9} fill="var(--color-ink-500)" textAnchor="end">{tMax.toFixed(1)}s</text>
        {path && <path d={path} fill="none" stroke={color} strokeWidth={2} />}
      </svg>
    </div>
  )
}
