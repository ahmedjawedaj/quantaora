import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { QuantaoraDB } from './db.ts'
import { LEGACY_STORAGE_KEY, migrateLegacyLocalStorage, getMigrationStatus } from './migrateLegacy.ts'
import type { LegacyStorageSource } from './migrateLegacy.ts'

// Run with: node --test src/lib/storage/migrateLegacy.test.ts
//
// Node's built-in `localStorage` global is a non-functional stub unless
// launched with `--localstorage-file`, so tests inject a tiny in-memory
// Storage-shaped fake instead — matching how `window.localStorage` behaves
// in a real browser.

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

function storageWith(value: unknown): FakeStorage {
  const storage = new FakeStorage()
  storage.setItem(LEGACY_STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value))
  return storage
}

test('migrateLegacyLocalStorage: no-op when nothing was ever persisted', async () => {
  const db = freshDb()
  const result = await migrateLegacyLocalStorage(db, new FakeStorage())
  assert.equal(result.migrated, false)
  assert.equal(result.reason, 'no-legacy-data')
  db.close()
})

test('migrateLegacyLocalStorage: no legacy storage source at all (e.g. non-browser) is also a safe no-op', async () => {
  const db = freshDb()
  const result = await migrateLegacyLocalStorage(db, null)
  assert.equal(result.reason, 'no-legacy-data')
  db.close()
})

test('migrateLegacyLocalStorage: corrupted JSON is handled without throwing', async () => {
  const db = freshDb()
  const storage = new FakeStorage()
  storage.setItem(LEGACY_STORAGE_KEY, '{not valid json::')
  const result = await migrateLegacyLocalStorage(db, storage)
  assert.equal(result.migrated, false)
  assert.equal(result.reason, 'corrupt-json')
  // still recorded so a second call short-circuits instead of re-parsing forever
  const second = await migrateLegacyLocalStorage(db, storage)
  assert.equal(second.reason, 'already-migrated')
  db.close()
})

test('migrateLegacyLocalStorage: unrecognized (non-object) legacy payload is handled without throwing', async () => {
  const db = freshDb()
  const result = await migrateLegacyLocalStorage(db, storageWith(42))
  assert.equal(result.migrated, false)
  assert.equal(result.reason, 'unrecognized-shape')
  db.close()
})

const LEGACY_BLOB = {
  state: {
    learnerProfile: {
      name: 'Ada',
      grade: 6,
      interests: ['biology', 'space'],
      confidence: { biology: 2, space: 1 },
      recommendedLab: '/app',
      createdAt: 1000,
      updatedAt: 1500,
    },
    lastVisitedLab: { path: '/app', name: 'DNA', subject: 'biology', visitedAt: 1500 },
    notebook: [{ id: 'dna-1', conceptId: 'dna', conceptName: 'DNA', subject: 'biology', title: 'Notes', body: 'It twists!', createdAt: 1200 }],
    quizResults: [
      { componentId: 'dna', score: 4, total: 5, completedAt: 1300 },
      { componentId: 'dna', score: 1, total: 5, completedAt: 1100 },
      { componentId: 'chloroplast', score: 5, total: 5, completedAt: 1400 },
    ],
    mastery: { dna: 3, chloroplast: 5 },
    timeSpentMinutes: 42,
    completedLabs: {
      dna: { labId: 'dna', labName: 'DNA', subject: 'biology', branch: 'Genetics', firstCompletedAt: 1000, lastCompletedAt: 1300, timesCompleted: 2 },
    },
    favorites: { dna: { id: 'dna', type: 'lab', name: 'DNA', subject: 'biology', addedAt: 1000 } },
    experimentSnapshots: [{ id: 'snap-1', labId: 'dna', labName: 'DNA', subject: 'biology', title: 'My snapshot', state: { zoom: 2 }, createdAt: 1250 }],
  },
  version: 1,
}

test('migrateLegacyLocalStorage: losslessly migrates a realistic Zustand-persisted blob (localStorage compatibility)', async () => {
  const db = freshDb()
  const result = await migrateLegacyLocalStorage(db, storageWith(LEGACY_BLOB))
  assert.equal(result.migrated, true)
  assert.equal(result.reason, 'migrated')

  const profile = await db.learnerProfile.get('local')
  assert.equal(profile?.name, 'Ada')
  assert.equal(profile?.grade, 6)

  const notebook = await db.notebookEntries.toArray()
  assert.equal(notebook.length, 1)
  assert.equal(notebook[0].body, 'It twists!')

  const snapshots = await db.experimentSnapshots.toArray()
  assert.equal(snapshots.length, 1)
  assert.deepEqual(snapshots[0].state, { zoom: 2 })

  const quizzes = await db.quizResults.toArray()
  assert.equal(quizzes.length, 3)

  const dnaProgress = await db.skillProgress.get('dna')
  assert.ok(dnaProgress)
  assert.equal(dnaProgress?.subject, 'biology')
  assert.equal(dnaProgress?.attempts, 2)
  assert.equal(dnaProgress?.correctCount, 1) // 4/5 passes the 0.6 threshold, 1/5 does not
  assert.equal(dnaProgress?.incorrectCount, 1)
  assert.equal(dnaProgress?.lastPracticedAt, 1300)

  const chloroplastProgress = await db.skillProgress.get('chloroplast')
  assert.equal(chloroplastProgress?.attempts, 1)
  assert.equal(chloroplastProgress?.correctCount, 1)

  const dnaSchedule = await db.reviewSchedule.get('dna')
  assert.ok(dnaSchedule)
  assert.ok((dnaSchedule?.nextReviewAt ?? 0) > 1300)

  // Fields with no dedicated table yet (favorites, completedLabs, timeSpentMinutes,
  // lastVisitedLab) are preserved verbatim so nothing is lost.
  const misc = await db.meta.get('legacyMisc')
  const miscValue = misc?.value as { timeSpentMinutes: number; favorites: Record<string, unknown> }
  assert.equal(miscValue.timeSpentMinutes, 42)
  assert.ok(miscValue.favorites.dna)

  const backup = await db.meta.get('legacyRawBackup')
  assert.deepEqual(backup?.value, LEGACY_BLOB.state)

  db.close()
})

test('migrateLegacyLocalStorage: idempotent — a second run on the same db does not duplicate rows', async () => {
  const db = freshDb()
  const storage = storageWith(LEGACY_BLOB)

  await migrateLegacyLocalStorage(db, storage)
  const second = await migrateLegacyLocalStorage(db, storage)
  assert.equal(second.reason, 'already-migrated')

  const quizzes = await db.quizResults.toArray()
  assert.equal(quizzes.length, 3, 'expected the second call to be a no-op, not a duplicate import')

  const status = await getMigrationStatus(db)
  assert.equal(status?.migrated, true)

  db.close()
})

test('migrateLegacyLocalStorage: accepts a bare (unwrapped) state object too, not only the {state,version} envelope', async () => {
  const db = freshDb()
  const result = await migrateLegacyLocalStorage(db, storageWith(LEGACY_BLOB.state))
  assert.equal(result.migrated, true)
  const profile = await db.learnerProfile.get('local')
  assert.equal(profile?.name, 'Ada')
  db.close()
})
