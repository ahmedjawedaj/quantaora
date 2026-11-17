import { useMemo, useState } from 'react'
import { Calculator, CircleDot, Ruler, TriangleRight } from 'lucide-react'
import { trigonometryFoundations } from '@/data/trigonometryFoundations'
import { Button } from '@/components/ui/Button'
import CanvasControls from '@/components/explorer/CanvasControls'
import BottomTray from '@/components/explorer/BottomTray'
import LessonModal from '@/components/explorer/LessonModal'
import QuizModal from '@/components/explorer/QuizModal'

const MIN_ANGLE = 10
const MAX_ANGLE = 80

function trigValues(angle: number) {
  const radians = (angle * Math.PI) / 180
  const sine = Math.sin(radians)
  const cosine = Math.cos(radians)
  const tangent = Math.tan(radians)
  return { radians, sine, cosine, tangent }
}

function valueText(value: number) {
  return value.toFixed(2)
}

export default function TrigonometryFoundationsLab() {
  const [angle, setAngle] = useState(35)
  const [autoRotate, setAutoRotate] = useState(false)
  const [labelsVisible, setLabelsVisible] = useState(true)
  const [cleanView, setCleanView] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [lessonOpen, setLessonOpen] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const { radians, sine, cosine, tangent } = useMemo(() => trigValues(angle), [angle])
  const pointX = cosine * 135
  const pointY = -sine * 135
  const tangentHeight = Math.min(tangent * 42, 132)
  const content = trigonometryFoundations[0]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[color:var(--color-surface)]">
      <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] lg:grid-cols-[280px_1fr_340px] lg:grid-rows-1">
        <aside className="hidden overflow-y-auto border-r border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 lg:block">
          <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Trigonometry Foundations</p>
          <div className="mt-3 space-y-2">
            {trigonometryFoundations.map((component) => (
              <div key={component.id} className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{component.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-ink-500)]">{component.tagline}</p>
              </div>
            ))}
          </div>
        </aside>

        <main
          data-lab-stage
          data-clean-view={cleanView ? 'true' : undefined}
          className="relative min-h-0 overflow-hidden p-4 sm:p-6"
        >
          <CanvasControls
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate((value) => !value)}
            isolateActive={labelsVisible}
            onToggleIsolate={() => setLabelsVisible((value) => !value)}
            onCompare={() => {}}
            compareDisabled
            onZoomIn={() => setZoom((value) => Math.min(1.3, Number((value + 0.1).toFixed(2))))}
            onZoomOut={() => setZoom((value) => Math.max(0.8, Number((value - 0.1).toFixed(2))))}
            zoomInDisabled={zoom >= 1.3}
            zoomOutDisabled={zoom <= 0.8}
            labelsVisible={labelsVisible}
            onToggleLabels={() => setLabelsVisible((value) => !value)}
            xrayActive={false}
            onToggleXray={() => {}}
            animationAvailable
            animationPlaying={autoRotate}
            onToggleAnimation={() => setAutoRotate((value) => !value)}
            cleanViewActive={cleanView}
            onToggleCleanView={() => setCleanView((value) => !value)}
            onFitView={() => setZoom(1)}
            onReset={() => {
              setAngle(35)
              setZoom(1)
              setAutoRotate(false)
              setLabelsVisible(true)
              setCleanView(false)
            }}
          />
          <div className="mx-auto flex h-full max-w-5xl flex-col gap-4 overflow-y-auto pl-16" style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}>
            <section className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-tactile)]">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">Angle lab</p>
                  <h1 className="mt-1 text-2xl font-semibold text-[color:var(--color-foreground)]">Angle {angle} degrees changes every ratio</h1>
                </div>
                <div className="flex items-center gap-2">
                  {[30, 45, 60].map((preset) => (
                    <Button key={preset} type="button" variant={angle === preset ? 'primary' : 'secondary'} size="sm" onClick={() => setAngle(preset)}>
                      {preset} deg
                    </Button>
                  ))}
                </div>
              </div>
              <label className="mt-4 block text-sm font-medium text-[color:var(--color-foreground)]" htmlFor="trig-angle">
                Drag angle
              </label>
              <input
                id="trig-angle"
                type="range"
                min={MIN_ANGLE}
                max={MAX_ANGLE}
                value={angle}
                onChange={(event) => setAngle(Number(event.target.value))}
                className="mt-2 w-full accent-[color:var(--color-brand-strong)]"
                aria-valuetext={`${angle} degrees`}
              />
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-tactile)]">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                  <TriangleRight className="h-4 w-4" strokeWidth={1.75} />
                  Right triangle
                </div>
                <svg viewBox="0 0 360 240" role="img" aria-label="Right triangle with adjustable angle" className="h-auto w-full">
                  <rect width="360" height="240" rx="8" fill="#faf8f4" />
                  <line x1="54" y1="196" x2="306" y2="196" stroke="#8a7f6d" strokeWidth="5" />
                  <line x1="306" y1="196" x2="306" y2={196 + pointY} stroke="#7FA86A" strokeWidth="5" />
                  <line x1="54" y1="196" x2="306" y2={196 + pointY} stroke="#D96B5A" strokeWidth="5" />
                  <path d={`M86 196 A32 32 0 0 0 ${86 + Math.cos(radians) * 32} ${196 - Math.sin(radians) * 32}`} fill="none" stroke="#D9A441" strokeWidth="4" />
                  <rect x="292" y="182" width="14" height="14" fill="none" stroke="#6B85A8" strokeWidth="3" />
                  <circle cx="54" cy="196" r="6" fill="#D9A441" />
                  <text x="170" y="221" textAnchor="middle" fontSize="13" fill="#5f5648">adjacent = cos {valueText(cosine)}</text>
                  <text x="319" y={196 + pointY / 2} fontSize="13" fill="#4f6f3f">opposite = sin {valueText(sine)}</text>
                  <text x="180" y={180 + pointY / 2} textAnchor="middle" fontSize="13" fill="#9a4137">hypotenuse = 1</text>
                </svg>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 shadow-[var(--shadow-tactile)]">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
                  <CircleDot className="h-4 w-4" strokeWidth={1.75} />
                  Unit circle
                </div>
                <svg viewBox="0 0 260 240" role="img" aria-label="Unit circle coordinate model" className="h-auto w-full">
                  <rect width="260" height="240" rx="8" fill="#faf8f4" />
                  <line x1="28" y1="120" x2="232" y2="120" stroke="#d9cfe6" strokeWidth="3" />
                  <line x1="130" y1="222" x2="130" y2="18" stroke="#d9cfe6" strokeWidth="3" />
                  <circle cx="130" cy="120" r="90" fill="none" stroke="#6B85A8" strokeWidth="4" />
                  <line x1="130" y1="120" x2={130 + pointX * 0.67} y2={120 + pointY * 0.67} stroke="#D96B5A" strokeWidth="5" />
                  <line x1="130" y1={120 + pointY * 0.67} x2={130 + pointX * 0.67} y2={120 + pointY * 0.67} stroke="#8a7f6d" strokeWidth="4" />
                  <line x1={130 + pointX * 0.67} y1="120" x2={130 + pointX * 0.67} y2={120 + pointY * 0.67} stroke="#7FA86A" strokeWidth="4" />
                  <circle cx={130 + pointX * 0.67} cy={120 + pointY * 0.67} r="7" fill="#D9A441" />
                  <text x="130" y="232" textAnchor="middle" fontSize="13" fill="#5f5648">x = cos {valueText(cosine)}, y = sin {valueText(sine)}</text>
                </svg>
              </div>
            </section>
          </div>
        </main>

        <aside className="min-h-0 overflow-y-auto border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-raised)] p-4 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
            <Calculator className="h-4 w-4" strokeWidth={1.75} />
            Live ratio meters
          </div>
          <div className="mt-4 space-y-3">
            {[
              ['Sine', sine, '#7FA86A', 'opposite / hypotenuse'],
              ['Cosine', cosine, '#8a7f6d', 'adjacent / hypotenuse'],
              ['Tangent', Math.min(tangent, 3), '#D9A441', 'opposite / adjacent'],
            ].map(([label, value, color, caption]) => (
              <div key={label} className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-[color:var(--color-foreground)]">{label}</p>
                  <p className="font-mono text-sm text-[color:var(--color-ink-700)]">{valueText(Number(label === 'Tangent' ? tangent : value))}</p>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--color-border)]">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(Number(value) * 100, 100)}%`, background: String(color) }} />
                </div>
                <p className="mt-1 text-xs text-[color:var(--color-ink-500)]">{caption}</p>
              </div>
            ))}
          </div>
            <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)]">
              <Ruler className="h-4 w-4" strokeWidth={1.75} />
              Cause and effect
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
              Opening the angle raises sine, lowers cosine, and makes tangent climb because the rise grows while the run shrinks.
            </p>
            <div className="mt-3 h-36 rounded-[var(--radius-sm)] bg-[#faf8f4] p-3">
              <div className="flex h-full items-end gap-3">
                <div className="w-1/3 rounded-t bg-[#7FA86A]" style={{ height: `${sine * 100}%` }} />
                <div className="w-1/3 rounded-t bg-[#8a7f6d]" style={{ height: `${cosine * 100}%` }} />
                <div className="w-1/3 rounded-t bg-[#D9A441]" style={{ height: `${tangentHeight}%` }} />
              </div>
            </div>
            <div className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Guided challenge · Observe → Predict → Change → Explain → Check
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                Observe the triangle, predict which ratio changes most, change the angle slider, then explain why the side ratios moved.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <BottomTray content={content} onOpenLesson={() => setLessonOpen(true)} onOpenQuiz={() => setQuizOpen(true)} />
      <LessonModal content={content} open={lessonOpen} onClose={() => setLessonOpen(false)} onStartQuiz={() => setQuizOpen(true)} />
      <QuizModal content={content} open={quizOpen} onClose={() => setQuizOpen(false)} />
    </div>
  )
}
