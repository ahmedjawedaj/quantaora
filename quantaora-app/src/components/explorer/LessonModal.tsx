import { useRef, useState } from 'react'
import { CheckCircle2, Circle, ArrowRight, Lightbulb } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import type { ComponentContent } from '@/data/types'

export default function LessonModal({
  content,
  open,
  onClose,
  onStartQuiz,
}: {
  content: ComponentContent
  open: boolean
  onClose: () => void
  onStartQuiz: () => void
}) {
  const [step, setStep] = useState(0)
  const [justCompleted, setJustCompleted] = useState(false)
  const markLabCompleted = useAppStore((s) => s.markLabCompleted)
  const hasFiredCompletion = useRef(false)
  const total = content.lesson.steps.length
  const isLast = step === total - 1

  // Called only from genuine forward-progress actions (advancing to the final
  // step, or explicitly starting the checkpoint) — never on modal open or on
  // close/dismiss — so a learner who peeks and bails doesn't get credit.
  const fireCompletion = () => {
    if (hasFiredCompletion.current) return
    hasFiredCompletion.current = true
    markLabCompleted({
      labId: content.id,
      labName: content.name,
      subject: content.subject,
      branch: content.branch,
    })
    setJustCompleted(true)
  }

  const handleClose = () => {
    setStep(0)
    setJustCompleted(false)
    hasFiredCompletion.current = false
    onClose()
  }

  const goNext = () => {
    setStep((s) => {
      const next = Math.min(total - 1, s + 1)
      if (next === total - 1) fireCompletion()
      return next
    })
  }

  const footer = (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={() => setStep((s) => Math.max(0, s - 1))}
        disabled={step === 0}
        className="text-sm font-medium text-[color:var(--color-ink-500)] transition-colors hover:text-[color:var(--color-foreground)] disabled:opacity-30"
      >
        Back
      </button>

      <div className="flex items-center gap-1.5">
        {content.lesson.steps.map((_, i) => (
          <span key={i}>
            {i < step ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-[color:var(--color-brand)]" />
            ) : (
              <Circle
                className={`h-2 w-2 ${i === step ? 'fill-[color:var(--color-brand)] text-[color:var(--color-brand)]' : 'text-[color:var(--color-border)]'}`}
              />
            )}
          </span>
        ))}
      </div>

      {isLast ? (
        <Button
          size="sm"
          onClick={() => {
            fireCompletion()
            handleClose()
            onStartQuiz()
          }}
        >
          Start checkpoint
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button size="sm" onClick={goNext}>
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )

  return (
    <Modal open={open} onClose={handleClose} title={`Lesson · ${content.name}`} widthClass="max-w-xl" footer={footer}>
      <div className="mb-5 flex items-center gap-1.5">
        {content.lesson.steps.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors"
            style={{
              background: i <= step ? 'var(--color-brand)' : 'var(--color-border)',
            }}
          />
        ))}
      </div>

      <div className="min-h-[230px]">
        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
          Step {step + 1} of {total}
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-display)] text-2xl text-[color:var(--color-foreground)]">
          {content.lesson.steps[step].title}
        </h3>
        <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--color-ink-700)]">
          {content.lesson.steps[step].body}
        </p>

        {step === 0 && (
          <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Predict first
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                {content.lesson.predictionPrompt}
              </p>
            </div>
          </div>
        )}

        {isLast && (
          <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--color-brand)]/25 bg-[color:var(--color-brand-soft)] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-brand-strong)]">
              Practice
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-700)]">{content.lesson.practiceItem}</p>
          </div>
        )}

        {justCompleted && (
          <div
            role="status"
            aria-live="polite"
            className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-brand)]/30 bg-[color:var(--color-brand-soft)] px-4 py-3"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
            <p className="text-sm font-medium text-[color:var(--color-brand-strong)]">
              Lesson complete — nice work! Saved to your progress.
            </p>
          </div>
        )}
      </div>
    </Modal>
  )
}
