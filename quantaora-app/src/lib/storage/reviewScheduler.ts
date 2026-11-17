/**
 * Minimal spaced-repetition ladder: a correct attempt advances one level
 * (longer interval), an incorrect attempt drops back to level 0. Intentionally
 * simple (not full SM-2) — enough for the next agent's review-queue UI.
 */
export const REVIEW_INTERVAL_DAYS_LADDER = [1, 3, 7, 14, 30]
const ONE_DAY_MS = 24 * 60 * 60 * 1000

export interface ReviewLadderStep {
  level: number
  intervalDays: number
  nextReviewAt: number
}

export function nextReviewStep(currentLevel: number, wasCorrect: boolean, now: number): ReviewLadderStep {
  const maxLevel = REVIEW_INTERVAL_DAYS_LADDER.length - 1
  const level = wasCorrect ? Math.min(currentLevel + 1, maxLevel) : 0
  const intervalDays = REVIEW_INTERVAL_DAYS_LADDER[level]
  return { level, intervalDays, nextReviewAt: now + intervalDays * ONE_DAY_MS }
}
