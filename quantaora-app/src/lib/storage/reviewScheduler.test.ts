import { test } from 'node:test'
import assert from 'node:assert/strict'
import { REVIEW_INTERVAL_DAYS_LADDER, nextReviewStep } from './reviewScheduler.ts'

// Run with: node --test src/lib/storage/reviewScheduler.test.ts

test('nextReviewStep: a wrong answer always resets to level 0 regardless of prior level', () => {
  const step = nextReviewStep(3, false, 1000)
  assert.equal(step.level, 0)
  assert.equal(step.intervalDays, REVIEW_INTERVAL_DAYS_LADDER[0])
})

test('nextReviewStep: correct answers climb the ladder one level at a time', () => {
  let level = -1
  let now = 0
  for (const expectedInterval of REVIEW_INTERVAL_DAYS_LADDER) {
    const step = nextReviewStep(level, true, now)
    assert.equal(step.intervalDays, expectedInterval)
    level = step.level
  }
})

test('nextReviewStep: correct answers cap at the top of the ladder instead of growing unbounded', () => {
  const topLevel = REVIEW_INTERVAL_DAYS_LADDER.length - 1
  const step = nextReviewStep(topLevel, true, 0)
  assert.equal(step.level, topLevel)
  assert.equal(step.intervalDays, REVIEW_INTERVAL_DAYS_LADDER[topLevel])
})

test('nextReviewStep: nextReviewAt is now + intervalDays worth of milliseconds', () => {
  const now = 5_000
  const step = nextReviewStep(-1, true, now)
  assert.equal(step.nextReviewAt, now + step.intervalDays * 24 * 60 * 60 * 1000)
})
