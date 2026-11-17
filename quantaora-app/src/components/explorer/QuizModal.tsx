import { useCallback, useState } from 'react'
import { Check, X, ArrowRight, Trophy, RotateCcw, Lightbulb, Save } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import type { ComponentContent } from '@/data/types'
import { useAppStore } from '@/store/useAppStore'

export default function QuizModal({
  content,
  open,
  onClose,
}: {
  content: ComponentContent
  open: boolean
  onClose: () => void
}) {
  const recordQuizResult = useAppStore((s) => s.recordQuizResult)
  // Nudges the "why that's a common mix-up" card into view when it appears below the fold.
  const revealFeedback = useCallback((node: HTMLDivElement | null) => {
    node?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  // Per-question learner picks, kept only for the answer-review screen — not part of what gets persisted.
  const [answers, setAnswers] = useState<(number | null)[]>(() => content.quiz.map(() => null))

  const question = content.quiz[index]
  const isCorrect = selected === question?.correctIndex

  if (!question || content.quiz.length === 0) {
    return (
      <Modal open={open} onClose={onClose} title={`Checkpoint · ${content.name}`} widthClass="max-w-xl">
        <p className="py-6 text-center text-sm text-[color:var(--color-ink-500)]">
          No checkpoint questions yet for this component.
        </p>
      </Modal>
    )
  }

  const reset = () => {
    setIndex(0)
    setSelected(null)
    setScore(0)
    setFinished(false)
    setAnswers(content.quiz.map(() => null))
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleSelect = (i: number) => {
    if (selected !== null) return
    setSelected(i)
    if (i === question.correctIndex) setScore((s) => s + 1)
    setAnswers((prev) => {
      const next = [...prev]
      next[index] = i
      return next
    })
  }

  const handleNext = () => {
    if (index + 1 >= content.quiz.length) {
      recordQuizResult(content.id, score, content.quiz.length)
      setFinished(true)
      return
    }
    setIndex((i) => i + 1)
    setSelected(null)
  }

  if (finished) {
    const pct = Math.round((score / content.quiz.length) * 100)
    return (
      <Modal open={open} onClose={handleClose} title={`Checkpoint · ${content.name}`} widthClass="max-w-xl">
        <div className="flex flex-col items-center py-2 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-brand-soft)]">
            <Trophy className="h-7 w-7 text-[color:var(--color-brand-strong)]" />
          </div>
          <p className="mt-5 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
            {score} / {content.quiz.length}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-ink-500)]">{pct}% mastery</p>
          <div
            role="status"
            className="mt-3 flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-50/60 px-3 py-1 text-xs font-medium text-emerald-900"
          >
            <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            Result saved to this device
          </div>
        </div>

        <div role="list" aria-label="Answer review" className="mt-5 flex flex-col gap-3 text-left">
          {content.quiz.map((q, i) => {
            const pick = answers[i]
            const gotItRight = pick === q.correctIndex
            return (
              <div
                key={i}
                role="listitem"
                className={cn(
                  'rounded-[var(--radius-md)] border p-4 text-sm leading-relaxed',
                  gotItRight ? 'border-emerald-400/40 bg-emerald-50/50' : 'border-rose-400/40 bg-rose-50/50',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-[color:var(--color-foreground)]">
                    {i + 1}. {q.prompt}
                  </p>
                  {gotItRight ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-label="Correct" />
                  ) : (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-label="Incorrect" />
                  )}
                </div>

                {!gotItRight && (
                  <p className="mt-2 text-rose-900">
                    <span className="font-semibold">Your answer: </span>
                    {pick !== null ? q.options[pick] : 'Skipped'}
                  </p>
                )}
                <p className="mt-1 text-emerald-900">
                  <span className="font-semibold">Correct answer: </span>
                  {q.options[q.correctIndex]}
                </p>

                <p className="mt-2 text-[color:var(--color-ink-700)]">{q.explanation}</p>

                {!gotItRight && (
                  <div className="mt-2 flex items-start gap-2 border-t border-rose-400/30 pt-2">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--color-brand)]" aria-hidden="true" />
                    <p className="text-xs leading-relaxed text-[color:var(--color-ink-700)]">{q.misconception}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={reset}>
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </Button>
          <Button size="sm" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    )
  }

  const footer = (
    <div className="flex justify-end">
      <Button size="sm" onClick={handleNext} disabled={selected === null}>
        {index + 1 >= content.quiz.length ? 'See results' : 'Next question'}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  )

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`Checkpoint · ${content.name}`}
      widthClass="max-w-xl"
      footer={footer}
    >
      <div className="mb-5 flex items-center gap-1.5">
        {content.quiz.map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ background: i <= index ? 'var(--color-brand)' : 'var(--color-border)' }}
          />
        ))}
      </div>

      <div className="min-h-[380px]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
        Question {index + 1} of {content.quiz.length}
      </p>
      <h3 className="mt-1.5 text-lg font-semibold leading-snug text-[color:var(--color-foreground)]">
        {question.prompt}
      </h3>

      <div className="mt-4 flex flex-col gap-2">
        {question.options.map((option, i) => {
          const answered = selected !== null
          const isThisCorrect = i === question.correctIndex
          const isThisSelected = i === selected

          return (
            <button
              key={option}
              type="button"
              onClick={() => handleSelect(i)}
              disabled={answered}
              className={cn(
                'flex items-center justify-between rounded-[var(--radius-md)] border px-4 py-3 text-left text-sm font-medium transition-colors',
                !answered && 'border-[color:var(--color-border)] hover:border-[color:var(--color-brand)] hover:bg-[color:var(--color-brand-soft)]',
                answered && isThisCorrect && 'border-emerald-400/60 bg-emerald-50 text-emerald-900',
                answered && isThisSelected && !isThisCorrect && 'border-rose-400/60 bg-rose-50 text-rose-900',
                answered && !isThisSelected && !isThisCorrect && 'border-[color:var(--color-border)] opacity-50',
              )}
            >
              {option}
              {answered && isThisCorrect && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
              {answered && isThisSelected && !isThisCorrect && <X className="h-4 w-4 shrink-0 text-rose-600" />}
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <div
          className={cn(
            'mt-4 rounded-[var(--radius-md)] border p-4 text-sm leading-relaxed',
            isCorrect ? 'border-emerald-400/40 bg-emerald-50/60 text-emerald-900' : 'border-rose-400/40 bg-rose-50/60 text-rose-900',
          )}
        >
          <p className="font-semibold">{isCorrect ? 'Correct!' : 'Not quite — and that is useful.'}</p>
          <p className="mt-1">{question.explanation}</p>
        </div>
      )}

      {selected !== null && !isCorrect && (
        <div
          ref={revealFeedback}
          className="mt-3 flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4"
        >
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
              Why that's a common mix-up
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
              {question.misconception}
            </p>
          </div>
        </div>
      )}
      </div>
    </Modal>
  )
}
