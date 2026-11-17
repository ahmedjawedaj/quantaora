const WIDTH = 640
const HEIGHT = 200
const TRACK_Y = 140
const RANGE = 12 // meters shown left-to-right of center

export default function MotionTrack({ position, force, mass }: { position: number; force: number; mass: number }) {
  const clamped = Math.max(-RANGE, Math.min(RANGE, position))
  const cartX = WIDTH / 2 + (clamped / RANGE) * (WIDTH / 2 - 60)
  const cartWidth = 40 + mass * 2.2
  const hitWall = Math.abs(position) >= RANGE

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full">
      {/* track */}
      <line x1={20} x2={WIDTH - 20} y1={TRACK_Y + 30} y2={TRACK_Y + 30} stroke="var(--color-ink-300)" strokeWidth={2} />
      {Array.from({ length: 25 }, (_, i) => (
        <line
          key={i}
          x1={20 + i * ((WIDTH - 40) / 24)}
          x2={20 + i * ((WIDTH - 40) / 24) - 8}
          y1={TRACK_Y + 30}
          y2={TRACK_Y + 42}
          stroke="var(--color-border)"
          strokeWidth={1.5}
        />
      ))}
      {/* center marker */}
      <line x1={WIDTH / 2} x2={WIDTH / 2} y1={TRACK_Y + 20} y2={TRACK_Y + 40} stroke="var(--color-ink-500)" strokeWidth={1.5} strokeDasharray="3 3" />

      {/* cart */}
      <g transform={`translate(${cartX - cartWidth / 2}, ${TRACK_Y - 30})`}>
        <rect width={cartWidth} height={32} rx={6} fill="var(--color-physics-deep)" opacity={hitWall ? 0.5 : 1} />
        <circle cx={10} cy={34} r={7} fill="var(--color-ink-900)" />
        <circle cx={cartWidth - 10} cy={34} r={7} fill="var(--color-ink-900)" />
      </g>

      {/* force arrow */}
      {Math.abs(force) > 0.3 && (
        <g>
          <line
            x1={cartX}
            x2={cartX + Math.sign(force) * Math.min(80, Math.abs(force) * 4)}
            y1={TRACK_Y - 46}
            y2={TRACK_Y - 46}
            stroke="var(--color-physics-accent)"
            strokeWidth={3}
            markerEnd="url(#arrowhead)"
          />
        </g>
      )}
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-physics-accent)" />
        </marker>
      </defs>

      {hitWall && (
        <text x={cartX} y={TRACK_Y - 60} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink-700)">
          Hit the end of the track
        </text>
      )}
    </svg>
  )
}
