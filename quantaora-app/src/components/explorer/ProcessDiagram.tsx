import type { Hotspot } from '@/data/types'

const HEIGHT = 240
const NODE_R = 22
const NODE_R_ACTIVE = 28
const PAD_X = 76
const ROW_Y = 118
const STAGE_MIN_W = 150

function wrapLabel(label: string, maxChars = 14): string[] {
  const words = label.split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, 2)
}

export default function ProcessDiagram({
  stages,
  playing,
  activeStageId,
  onSelectStage,
}: {
  stages: Hotspot[]
  playing: boolean
  activeStageId: string | null
  onSelectStage: (id: string) => void
}) {
  const width = Math.max(640, stages.length * STAGE_MIN_W)
  const activeIndex = stages.findIndex((s) => s.id === activeStageId)
  const step = stages.length > 1 ? (width - 2 * PAD_X) / (stages.length - 1) : 0

  return (
    <svg viewBox={`0 0 ${width} ${HEIGHT}`} className="w-full" role="img" aria-label="Process stage sequence">
      <defs>
        <marker id="process-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-ink-300)" />
        </marker>
        <marker id="process-arrowhead-active" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="var(--color-biology-deep)" />
        </marker>
      </defs>

      {/* connecting segments */}
      {stages.slice(0, -1).map((stage, i) => {
        const x1 = PAD_X + i * step + NODE_R
        const x2 = PAD_X + (i + 1) * step - NODE_R - 6
        const passed = activeIndex >= 0 && i < activeIndex
        return (
          <line
            key={`seg-${stage.id}`}
            x1={x1}
            x2={x2}
            y1={ROW_Y}
            y2={ROW_Y}
            stroke={passed ? 'var(--color-biology-deep)' : 'var(--color-border)'}
            strokeWidth={passed ? 2 : 1.5}
            strokeDasharray={passed ? undefined : '4 4'}
            markerEnd={`url(#${passed ? 'process-arrowhead-active' : 'process-arrowhead'})`}
          />
        )
      })}

      {/* stage nodes */}
      {stages.map((stage, i) => {
        const x = PAD_X + i * step
        const isActive = stage.id === activeStageId
        const isPassed = activeIndex >= 0 && i < activeIndex
        const r = isActive ? NODE_R_ACTIVE : NODE_R
        const lines = wrapLabel(stage.label)

        return (
          <g
            key={stage.id}
            role="button"
            tabIndex={0}
            aria-label={`View stage: ${stage.label}`}
            onClick={() => onSelectStage(stage.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onSelectStage(stage.id)
            }}
            className="cursor-pointer outline-none"
          >
            <circle
              cx={x}
              cy={ROW_Y}
              r={r}
              fill={isActive || isPassed ? stage.color : 'var(--color-surface)'}
              fillOpacity={isActive ? 1 : isPassed ? 0.55 : 1}
              stroke={stage.color}
              strokeWidth={isActive ? 3 : 2}
            />
            {isActive && (
              <circle cx={x} cy={ROW_Y} r={r + 5} fill="none" stroke={stage.color} strokeOpacity={0.35} strokeWidth={1.5} />
            )}
            <text x={x} y={ROW_Y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={isActive || isPassed ? '#fff' : 'var(--color-ink-500)'}>
              {i + 1}
            </text>
            <text x={x} y={ROW_Y + r + 22} textAnchor="middle" fontSize={11.5} fontWeight={isActive ? 700 : 500} fill={isActive ? 'var(--color-foreground)' : 'var(--color-ink-500)'}>
              {lines.map((line, li) => (
                <tspan key={li} x={x} dy={li === 0 ? 0 : 14}>
                  {line}
                </tspan>
              ))}
            </text>
          </g>
        )
      })}

      {playing && activeIndex >= 0 && (
        <text x={width / 2} y={26} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--color-ink-500)">
          Playing · stage {activeIndex + 1} of {stages.length}
        </text>
      )}
    </svg>
  )
}
