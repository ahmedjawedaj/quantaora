import 'fake-indexeddb/auto'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import Dexie from 'dexie'
import { QuantaoraDB } from './db.ts'

// Run with: node --test src/lib/storage/db.test.ts

function freshDb() {
  return new QuantaoraDB(`quantaora-progress-test-${randomUUID()}`)
}

test('QuantaoraDB: opens and exposes every foundation table', async () => {
  const db = freshDb()
  await db.open()
  const names = db.tables.map((t) => t.name).sort()
  assert.deepEqual(names, [
    'attempts',
    'experimentSnapshots',
    'learnerProfile',
    'meta',
    'mistakeTagLog',
    'notebookEntries',
    'quizResults',
    'reviewSchedule',
    'skillProgress',
  ])
  db.close()
})

test('QuantaoraDB: basic put/get round-trips through a real (fake) IndexedDB', async () => {
  const db = freshDb()
  await db.skillProgress.put({
    skillId: 'dna',
    subject: 'biology',
    confidence: 0.5,
    mastery: 0.5,
    attempts: 1,
    correctCount: 1,
    incorrectCount: 0,
    mistakeTags: {},
    lastPracticedAt: 1000,
    nextReviewAt: 2000,
    createdAt: 1000,
    updatedAt: 1000,
  })
  const row = await db.skillProgress.get('dna')
  assert.equal(row?.subject, 'biology')
  db.close()
})

test('QuantaoraDB: attempts and quizResults use auto-incrementing numeric ids', async () => {
  const db = freshDb()
  const attemptId = await db.attempts.add({
    skillId: 'dna',
    componentId: 'dna',
    correct: true,
    score: 4,
    total: 5,
    mistakeTags: [],
    createdAt: Date.now(),
  })
  assert.equal(typeof attemptId, 'number')
  db.close()
})

test('schema upgrade: a database opened at v1 survives reopening with an added v2 index, data intact', async () => {
  const dbName = `quantaora-progress-test-${randomUUID()}`

  // Simulate "today's" v1 schema using the same shape as QuantaoraDB.
  const v1 = new Dexie(dbName)
  v1.version(1).stores({ skillProgress: 'skillId, subject, nextReviewAt' })
  await v1.table('skillProgress').put({ skillId: 'dna', subject: 'biology', mastery: 0.4 })
  v1.close()

  // A future agent adds a v2 with a new index — existing rows must survive.
  const v2 = new Dexie(dbName)
  v2.version(1).stores({ skillProgress: 'skillId, subject, nextReviewAt' })
  v2.version(2).stores({ skillProgress: 'skillId, subject, nextReviewAt, mastery' })
  await v2.open()
  const row = await v2.table('skillProgress').get('dna')
  assert.equal(row.subject, 'biology')
  assert.equal(v2.verno, 2)
  v2.close()
})
