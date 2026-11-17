import { useMemo, useRef, useState } from 'react'

const PAD_LEFT = 56
const PAD_RIGHT = 24
const PAD_TOP = 24
const PAD_BOTTOM = 44
const WIDTH = 560
const HEIGHT = 340

export default function LinearGraph({
  slope,
  intercept,
  xMin,
  xMax,
  xLabel,
  yLabel,
  onChange,
  showXIntercept,
}: {
  slope: number
  intercept: number
  xMin: number
  xMax: number
  xLabel: string
  yLabel: string
  onChange: (slope: number, intercept: number) => void
  showXIntercept: boolean
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  // A ref (not state) so the very next pointermove — which can arrive before
  // React re-renders — always sees the current drag target, not a stale
  // closure value.
  const draggingRef = useRef<'left' | 'right' | null>(null)
  const [, forceRender] = useState(0)

  // Static y-domain derived from the scenario's default line, padded, so the
  // graph doesn't rescale disorientingly while the user drags.
  const yDomain = useMemo(() => {
    const yAtLeft = intercept
    const yAtRight = slope * xMax + intercept
    const lo = Math.min(0, yAtLeft, yAtRight)
    const hi = Math.max(0, yAtLeft, yAtRight)
    const span = hi - lo || 1
    return { min: lo - span * 0.3, max: hi + span * 0.3 }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const plotW = WIDTH - PAD_LEFT - PAD_RIGHT
  const plotH = HEIGHT - PAD_TOP - PAD_BOTTOM

  const xToPx = (x: number) => PAD_LEFT + ((x - xMin) / (xMax - xMin)) * plotW
  const yToPx = (y: number) => PAD_TOP + (1 - (y - yDomain.min) / (yDomain.max - yDomain.min)) * plotH
  const pxToY = (py: number) => yDomain.min + (1 - (py - PAD_TOP) / plotH) * (yDomain.max - yDomain.min)

  const yLeft = intercept
  const yRight = slope * xMax + intercept

  const xIntercept = slope !== 0 ? -intercept / slope : null

  const applyDrag = (clientY: number) => {
    const target = draggingRef.current
    if (!target || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scaleY = HEIGHT / rect.height
    const py = (clientY - rect.top) * scaleY
    const newY = Math.max(yDomain.min, Math.min(yDomain.max, pxToY(py)))

    if (target === 'left') {
      const newIntercept = newY
      const newSlope = (yRight - newIntercept) / xMax
      onChange(newSlope, newIntercept)
    } else {
      const newSlope = (newY - intercept) / xMax
      onChange(newSlope, intercept)
    }
  }

  const startDrag = (which: 'left' | 'right') => (e: React.PointerEvent) => {
    e.preventDefault()
    draggingRef.current = which
    forceRender((n) => n + 1)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // ignore — capture is a nice-to-have, not required for correctness
    }
  }

  const endDrag = () => {
    if (!draggingRef.current) return
    draggingRef.current = null
    forceRender((n) => n + 1)
  }

  const yTicks = useMemo(() => {
    const count = 5
    return Array.from({ length: count + 1 }, (_, i) => yDomain.min + ((yDomain.max - yDomain.min) * i) / count)
  }, [yDomain])

  const xTicks = useMemo(() => {
    const count = 5
    return Array.from({ length: count + 1 }, (_, i) => xMin + ((xMax - xMin) * i) / count)
  }, [xMin, xMax])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-full w-full touch-none select-none"
      onPointerMove={(e) => applyDrag(e.clientY)}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onMouseMove={(e) => {
        if (draggingRef.current) applyDrag(e.clientY)
      }}
      onMouseUp={endDrag}
    >
      {/* grid */}
      {yTicks.map((t) => (
        <g key={`y-${t}`}>
          <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yToPx(t)} y2={yToPx(t)} stroke="var(--color-border)" strokeWidth={1} />
          <text x={PAD_LEFT - 10} y={yToPx(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-ink-500)">
            {Math.round(t * 10) / 10}
          </text>
        </g>
      ))}
      {xTicks.map((t) => (
        <g key={`x-${t}`}>
          <line x1={xToPx(t)} x2={xToPx(t)} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-border)" strokeWidth={1} />
          <text x={xToPx(t)} y={HEIGHT - PAD_BOTTOM + 18} textAnchor="middle" fontSize={11} fill="var(--color-ink-500)">
            {Math.round(t * 10) / 10}
          </text>
        </g>
      ))}

      {/* axes */}
      <line x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={yToPx(0)} y2={yToPx(0)} stroke="var(--color-ink-300)" strokeWidth={1.5} />
      <line x1={xToPx(Math.max(0, xMin))} x2={xToPx(Math.max(0, xMin))} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} stroke="var(--color-ink-300)" strokeWidth={1.5} />

      <text x={WIDTH / 2} y={HEIGHT - 4} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-ink-700)">
        {xLabel}
      </text>
      <text x={14} y={HEIGHT / 2} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--color-ink-700)" transform={`rotate(-90 14 ${HEIGHT / 2})`}>
        {yLabel}
      </text>

      {/* x-intercept marker */}
      {showXIntercept && xIntercept !== null && xIntercept >= xMin && xIntercept <= xMax && (
        <g>
          <line
            x1={xToPx(xIntercept)}
            x2={xToPx(xIntercept)}
            y1={yToPx(0)}
            y2={yToPx(yDomain.max)}
            stroke="var(--color-brand)"
            strokeDasharray="4 3"
            strokeWidth={1.5}
          />
          <circle cx={xToPx(xIntercept)} cy={yToPx(0)} r={5} fill="var(--color-brand)" />
        </g>
      )}

      {/* the line */}
      <line
        x1={xToPx(xMin)}
        y1={yToPx(yLeft)}
        x2={xToPx(xMax)}
        y2={yToPx(yRight)}
        stroke="var(--color-math-deep)"
        strokeWidth={3}
      />

      {/* drag handles */}
      <circle
        cx={xToPx(xMin)}
        cy={yToPx(yLeft)}
        r={9}
        fill="var(--color-surface-raised)"
        stroke="var(--color-math-deep)"
        strokeWidth={3}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={startDrag('left')}
        onMouseDown={() => {
          draggingRef.current = 'left'
          forceRender((n) => n + 1)
        }}
      />
      <circle
        cx={xToPx(xMax)}
        cy={yToPx(yRight)}
        r={9}
        fill="var(--color-surface-raised)"
        stroke="var(--color-math-accent)"
        strokeWidth={3}
        className="cursor-grab active:cursor-grabbing"
        onPointerDown={startDrag('right')}
        onMouseDown={() => {
          draggingRef.current = 'right'
          forceRender((n) => n + 1)
        }}
      />
    </svg>
  )
}
