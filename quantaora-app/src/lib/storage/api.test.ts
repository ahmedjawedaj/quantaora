import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { QuantaoraDB } from './db.ts'
import {
  clearLearnerProfile,
  exportAllData,
  getLearnerProfile,
  getReviewSchedule,
  getSkillProgress,
  listAttempts,
  listDueReviews,
  listMistakeTags,
  listNotebookEntries,
  recordAttempt,
  resetAllData,
  saveNotebookEntry,
  setLearnerProfile,
} from './api.ts'
import { LEGACY_STORAGE_KEY, migrateLegacyLocalStorage } from './migrateLegacy.ts'
import type { LegacyStorageSource } from './migrateLegacy.ts'

// Run with: node --test src/lib/storage/api.test.ts
//
// See migrateLegacy.test.ts for why a fake Storage is injected instead of
// relying on Node's flag-gated `localStorage` global.

class FakeStorage implements LegacyStorageSource {
  private map = new Map<string, string>()
  getItem(key: string) {
    return this.map.has(key) ? this.map.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.map.set(key, value)
  }
  removeItem(key: string) {
    this.map.delete(key)
  }
}

function freshDb() {
  return new QuantaoraDB(`quantaora-progress-test-${randomUUID()}`)
}

test('learner profile: set/get/clear round-trip and createdAt is preserved across updates', async () => {
  const db = freshDb()
  const first = await setLearnerProfile({ name: 'Ada', grade: 6, interests: ['biology'], confidence: {}, recommendedLab: '/app' }, db)
  const second = await setLearnerProfile({ name: 'Ada Lovelace', grade: 7, interests: ['biology'], confidence: {}, recommendedLab: '/app' }, db)
  assert.equal(second.createdAt, first.createdAt)
  assert.equal((await getLearnerProfile(db))?.name, 'Ada Lovelace')

  await clearLearnerProfile(db)
  assert.equal(await getLearnerProfile(db), undefined)
  db.close()
})

test('recordAttempt: aggregates correct/incorrect counts, mistake tags, and advances the review schedule', async () => {
  const db = freshDb()
  await recordAttempt({ skillId: 'dna', componentId: 'dna', subject: 'biology', correct: true, score: 5, total: 5 }, db)
  const afterWrong = await recordAttempt(
    { skillId: 'dna', componentId: 'dna', subject: 'biology', correct: false, score: 1, total: 5, mistakeTags: ['sign-error'] },
    db,
  )

  assert.equal(afterWrong.attempts, 2)
  assert.equal(afterWrong.correctCount, 1)
  assert.equal(afterWrong.incorrectCount, 1)
  assert.equal(afterWrong.mistakeTags['sign-error'], 1)

  const attempts = await listAttempts('dna', db)
  assert.equal(attempts.length, 2)

  const tags = await listMistakeTags('dna', db)
  assert.equal(tags.length, 1)
  assert.equal(tags[0].tag, 'sign-error')

  // An incorrect attempt resets the review-schedule level back to 0 (1-day interval).
  const schedule = await getReviewSchedule('dna', db)
  assert.equal(schedule?.level, 0)
  assert.equal(schedule?.intervalDays, 1)

  const progress = await getSkillProgress('dna', db)
  assert.equal(progress?.attempts, 2)

  db.close()
})

test('recordAttempt: consecutive correct attempts advance the review-schedule level/interval', async () => {
  const db = freshDb()
  await recordAttempt({ skillId: 'dna', componentId: 'dna', subject: 'biology', correct: true, score: 5, total: 5 }, db)
  await recordAttempt({ skillId: 'dna', componentId: 'dna', subject: 'biology', correct: true, score: 5, total: 5 }, db)
  const schedule = await getReviewSchedule('dna', db)
  assert.equal(schedule?.level, 1)
  assert.equal(schedule?.intervalDays, 3)
  db.close()
})

test('listDueReviews: only returns skills whose nextReviewAt has passed', async () => {
  const db = freshDb()
  await db.reviewSchedule.bulkPut([
    { skillId: 'past', intervalDays: 1, level: 0, lastReviewedAt: 0, nextReviewAt: 1000, updatedAt: 0 },
    { skillId: 'future', intervalDays: 1, level: 0, lastReviewedAt: 0, nextReviewAt: 999_999_999, updatedAt: 0 },
  ])
  const due = await listDueReviews(2000, db)
  assert.deepEqual(due.map((d) => d.skillId), ['past'])
  db.close()
})

test('notebook CRUD works independently of the legacy Zustand notebook', async () => {
  const db = freshDb()
  await saveNotebookEntry({ id: 'n1', conceptId: 'dna', conceptName: 'DNA', subject: 'biology', title: 'T', body: 'B', createdAt: 1 }, db)
  const entries = await listNotebookEntries(db)
  assert.equal(entries.length, 1)
  db.close()
})

test('exportAllData: returns every table plus a schema/exported timestamp', async () => {
  const db = freshDb()
  await setLearnerProfile({ name: 'Ada', grade: 6, interests: [], confidence: {}, recommendedLab: '/app' }, db)
  await recordAttempt({ skillId: 'dna', componentId: 'dna', subject: 'biology', correct: true, score: 5, total: 5 }, db)

  const exported = await exportAllData(db)
  assert.equal(exported.learnerProfile?.name, 'Ada')
  assert.equal(exported.attempts.length, 1)
  assert.equal(exported.skillProgress.length, 1)
  assert.ok(exported.exportedAt > 0)
  assert.equal(exported.schemaVersion, 1)
  db.close()
})

test('resetAllData: clears every table and prevents legacy localStorage from resurrecting old data', async () => {
  const db = freshDb()
  const storage = new FakeStorage()
  storage.setItem(
    LEGACY_STORAGE_KEY,
    JSON.stringify({ state: { learnerProfile: { name: 'Old', grade: 5, interests: [], confidence: {}, recommendedLab: '/app', createdAt: 0, updatedAt: 0 } }, version: 1 }),
  )
  await migrateLegacyLocalStorage(db, storage)
  assert.equal((await getLearnerProfile(db))?.name, 'Old')

  await resetAllData({}, db, storage)
  assert.equal(await getLearnerProfile(db), undefined)

  // Legacy blob is still sitting in localStorage, but reset must not let it come back.
  const afterReset = await migrateLegacyLocalStorage(db, storage)
  assert.equal(afterReset.reason, 'already-migrated')
  assert.equal(await getLearnerProfile(db), undefined)

  db.close()
})

test('resetAllData: clearLegacyLocalStorage option removes the legacy key too', async () => {
  const db = freshDb()
  const storage = new FakeStorage()
  storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify({ state: {}, version: 1 }))
  await resetAllData({ clearLegacyLocalStorage: true }, db, storage)
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), null)
  db.close()
})
