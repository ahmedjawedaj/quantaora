import { Dna, Atom, FlaskConical, Sigma, Orbit, ArrowLeft, BookmarkPlus, Check, Lightbulb, Sparkles, type LucideIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ComponentContent, Hotspot, SubjectId } from '@/data/types'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import { useState } from 'react'

const SUBJECT_ICON: Record<SubjectId, LucideIcon> = {
  biology: Dna,
  physics: Atom,
  chemistry: FlaskConical,
  math: Sigma,
  space: Orbit,
}

export default function DetailPanel({
  content,
  activeHotspot,
  onClearHotspot,
  onOpenLesson,
}: {
  content: ComponentContent
  activeHotspot: Hotspot | null
  onClearHotspot: () => void
  onOpenLesson: () => void
}) {
  const saveToNotebook = useAppStore((s) => s.saveToNotebook)
  const [saved, setSaved] = useState<string | null>(null)
  const SubjectIcon = SUBJECT_ICON[content.subject]

  const handleSave = (conceptId: string, conceptName: string, body: string) => {
    saveToNotebook({
      conceptId,
      conceptName,
      subject: content.subject,
      title: conceptName,
      body,
    })
    setSaved(conceptId)
    setTimeout(() => setSaved(null), 1800)
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <AnimatePresence mode="wait">
        {activeHotspot ? (
          <motion.div
            key={activeHotspot.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.22 }}
          >
            <button
              type="button"
              onClick={onClearHotspot}
              className="mb-4 flex items-center gap-1.5 text-sm font-medium text-[color:var(--color-ink-500)] transition-colors hover:text-[color:var(--color-foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to {content.name}
            </button>

            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: activeHotspot.color }} />
              <span className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Structure
              </span>
            </div>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[color:var(--color-foreground)]">
              {activeHotspot.label}
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-ink-700)]">
              {activeHotspot.description}
            </p>

            <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Function
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-[color:var(--color-foreground)]">
                {activeHotspot.function}
              </p>
            </div>

            <div className="mt-5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Where it belongs
              </p>
              <p className="mt-1.5 text-sm text-[color:var(--color-foreground)]">
                {activeHotspot.label} → {content.name} → {content.system} → {content.branch}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              className="mt-5 w-full"
              onClick={() => handleSave(activeHotspot.id, activeHotspot.label, activeHotspot.description)}
            >
              {saved === activeHotspot.id ? (
                <>
                  <Check className="h-4 w-4" /> Saved to notebook
                </>
              ) : (
                <>
                  <BookmarkPlus className="h-4 w-4" /> Save to notebook
                </>
              )}
            </Button>
          </motion.div>
        ) : (
          <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <div className="flex items-center gap-1.5" style={{ color: `var(--color-${content.subject}-deep)` }}>
              <SubjectIcon className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-xs font-semibold uppercase tracking-wide">The {content.system}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-4xl text-[color:var(--color-foreground)]">
                {content.name}
              </h2>
            </div>
            <p className="mt-1 font-[family-name:var(--font-display)] italic text-[color:var(--color-brand)]">
              {content.tagline}
            </p>

            <p className="mt-4 text-[15px] leading-relaxed text-[color:var(--color-ink-700)]">{content.summary}</p>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                Key facts
              </p>
              <dl className="mt-3 divide-y divide-[color:var(--color-border)] border-t border-[color:var(--color-border)]">
                {content.keyFacts.map((fact, index) => (
                  <div
                    key={`${fact.label}-${index}`}
                    className="grid grid-cols-[minmax(5.5rem,0.42fr)_minmax(0,1fr)] gap-3 py-2.5 text-sm"
                  >
                    <dt className="min-w-0 break-words text-[color:var(--color-ink-500)]">{fact.label}</dt>
                    <dd className="min-w-0 break-words text-right font-medium leading-snug text-[color:var(--color-foreground)]">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand)]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                  Why it matters
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                  {content.whyItMatters}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" style={{ color: `var(--color-${content.subject}-deep)` }} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--color-ink-500)]">
                  Did you know?
                </p>
                <p className="mt-1 text-sm leading-relaxed text-[color:var(--color-ink-700)]">
                  {content.didYouKnow}
                </p>
              </div>
            </div>

            <Button size="md" className="mt-6 w-full" onClick={onOpenLesson}>
              View lesson
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
