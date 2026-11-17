/**
 * One-time, idempotent import of the pre-Dexie `quantaora-local-progress`
 * localStorage blob (written by `useAppStore`'s Zustand `persist` middleware)
 * into the Dexie learner-model database. The legacy storage source is
 * injectable (defaulting to `window.localStorage`) so this is unit-testable
 * under `node --test` without a DOM or Node's flag-gated `localStorage` global.
 */
import type { QuantaoraDB } from './db.ts'
import { db as defaultDb } from './db.ts'
import { REVIEW_INTERVAL_DAYS_LADDER } from './reviewScheduler.ts'
import type {
  ExperimentSnapshotRecord,
  LearnerProfileRecord,
  MigrationStatus,
  NotebookEntryRecord,
  QuizResultRecord,
  ReviewScheduleRecord,
  SkillProgressRecord,
} from './types.ts'

export const LEGACY_STORAGE_KEY = 'quantaora-local-progress'
const MIGRATION_META_KEY = 'legacyMigration'
const LEGACY_MISC_META_KEY = 'legacyMisc'
const LEGACY_RAW_BACKUP_META_KEY = 'legacyRawBackup'
const ONE_DAY_MS = 24 * 60 * 60 * 1000

/** A quiz attempt is treated as "correct" for skill-progress seeding when it clears this ratio. */
const LEGACY_PASS_RATIO = 0.6

interface LegacyQuizResult {
  componentId: string
  score: number
  total: number
  completedAt: number
}

interface LegacyCompletedLab {
  labId: string
  subject?: string
  lastCompletedAt?: number
}

interface LegacyAppState {
  learnerProfile?: {
    name: string
    grade: number
    interests: string[]
    confidence: Record<string, number>
    recommendedLab: string
    recommendedMission?: LearnerProfileRecord['recommendedMission']
    createdAt: number
    updatedAt: number
  } | null
  notebook?: NotebookEntryRecord[]
  quizResults?: LegacyQuizResult[]
  mastery?: Record<string, number>
  timeSpentMinutes?: number
  completedLabs?: Record<string, LegacyCompletedLab>
  favorites?: Record<string, unknown>
  experimentSnapshots?: ExperimentSnapshotRecord[]
  lastVisitedLab?: unknown
}

/** Minimal shape this module needs from a Storage-like object — real `window.localStorage` satisfies it. */
export interface LegacyStorageSource {
  getItem(key: string): string | null
  removeItem(key: string): void
}

/**
 * Reads `window.localStorage` via `globalThis` (not the bare `window`
 * identifier) so this module type-checks under both the DOM-enabled app
 * tsconfig and the DOM-less `node --test` tsconfig used by its own tests.
 */
export function defaultLegacyStorageSource(): LegacyStorageSource | null {
  const browserWindow = (globalThis as { window?: { localStorage?: LegacyStorageSource } }).window
  return browserWindow?.localStorage ?? null
}

function readLegacyRaw(key: string, storage: LegacyStorageSource | null): string | null {
  if (!storage) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

async function markMigrated(
  targetDb: QuantaoraDB,
  reason: MigrationStatus['reason'],
  counts: Record<string, number>,
): Promise<MigrationStatus> {
  const completedAt = Date.now()
  await targetDb.meta.put({
    key: MIGRATION_META_KEY,
    value: { completedAt, reason, counts },
    updatedAt: completedAt,
  })
  return { migrated: reason === 'migrated', reason, completedAt, counts }
}

/**
 * Runs the legacy-localStorage → Dexie import exactly once per database
 * (guarded by a `meta` row), and is safe to call on every app load. Never
 * throws — corrupt or missing legacy data is recorded as a no-op reason
 * rather than surfaced as an error, so callers (e.g. a Zustand
 * `onRehydrateStorage` hook) can fire-and-forget it.
 */
export async function migrateLegacyLocalStorage(
  targetDb: QuantaoraDB = defaultDb,
  storage: LegacyStorageSource | null = defaultLegacyStorageSource(),
): Promise<MigrationStatus> {
  const existing = await targetDb.meta.get(MIGRATION_META_KEY)
  if (existing) {
    const value = existing.value as { completedAt: number; reason: MigrationStatus['reason']; counts?: Record<string, number> }
    return { migrated: value.reason === 'migrated', reason: 'already-migrated', completedAt: value.completedAt, counts: value.counts }
  }

  const raw = readLegacyRaw(LEGACY_STORAGE_KEY, storage)
  if (!raw) return markMigrated(targetDb, 'no-legacy-data', {})

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return markMigrated(targetDb, 'corrupt-json', {})
  }

  const legacyState: LegacyAppState | undefined =
    parsed && typeof parsed === 'object' && 'state' in parsed && typeof (parsed as { state: unknown }).state === 'object'
      ? ((parsed as { state: LegacyAppState }).state ?? undefined)
      : parsed && typeof parsed === 'object'
        ? (parsed as LegacyAppState)
        : undefined

  if (!legacyState || typeof legacyState !== 'object') {
    return markMigrated(targetDb, 'unrecognized-shape', {})
  }

  const now = Date.now()
  const notebook = Array.isArray(legacyState.notebook) ? legacyState.notebook : []
  const experimentSnapshots = Array.isArray(legacyState.experimentSnapshots) ? legacyState.experimentSnapshots : []
  const quizResults: LegacyQuizResult[] = Array.isArray(legacyState.quizResults) ? legacyState.quizResults : []
  const mastery = legacyState.mastery ?? {}
  const completedLabs = legacyState.completedLabs ?? {}

  const quizByComponent = new Map<string, LegacyQuizResult[]>()
  for (const result of quizResults) {
    const list = quizByComponent.get(result.componentId) ?? []
    list.push(result)
    quizByComponent.set(result.componentId, list)
  }

  const skillIds = new Set<string>([...Object.keys(mastery), ...Object.keys(completedLabs), ...quizByComponent.keys()])

  const skillProgressRecords: SkillProgressRecord[] = []
  const reviewScheduleRecords: ReviewScheduleRecord[] = []
  for (const skillId of skillIds) {
    const quizzes = quizByComponent.get(skillId) ?? []
    const attempts = quizzes.length
    const correctCount = quizzes.filter((q) => q.total > 0 && q.score / q.total >= LEGACY_PASS_RATIO).length
    const incorrectCount = attempts - correctCount
    const lastPracticedAt = attempts
      ? Math.max(...quizzes.map((q) => q.completedAt))
      : (completedLabs[skillId]?.lastCompletedAt ?? null)
    const masteryRaw = mastery[skillId]
    const masteryScore =
      typeof masteryRaw === 'number' ? Math.min(1, Math.max(0, masteryRaw / 5)) : attempts ? correctCount / attempts : 0

    skillProgressRecords.push({
      skillId,
      subject: completedLabs[skillId]?.subject ?? 'unknown',
      confidence: masteryScore,
      mastery: masteryScore,
      attempts,
      correctCount,
      incorrectCount,
      mistakeTags: {},
      lastPracticedAt,
      nextReviewAt: lastPracticedAt ? lastPracticedAt + REVIEW_INTERVAL_DAYS_LADDER[0] * ONE_DAY_MS : null,
      createdAt: lastPracticedAt ?? now,
      updatedAt: now,
    })
    reviewScheduleRecords.push({
      skillId,
      intervalDays: REVIEW_INTERVAL_DAYS_LADDER[0],
      level: 0,
      lastReviewedAt: lastPracticedAt,
      nextReviewAt: lastPracticedAt ? lastPracticedAt + REVIEW_INTERVAL_DAYS_LADDER[0] * ONE_DAY_MS : now,
      updatedAt: now,
    })
  }

  const learnerProfileRecord: LearnerProfileRecord | null = legacyState.learnerProfile
    ? { id: 'local', ...legacyState.learnerProfile }
    : null

  const quizResultRecords: QuizResultRecord[] = quizResults.map((q) => ({
    componentId: q.componentId,
    score: q.score,
    total: q.total,
    completedAt: q.completedAt,
  }))

  const counts = {
    learnerProfile: learnerProfileRecord ? 1 : 0,
    notebookEntries: notebook.length,
    experimentSnapshots: experimentSnapshots.length,
    quizResults: quizResultRecords.length,
    skillProgress: skillProgressRecords.length,
  }

  await targetDb.transaction(
    'rw',
    [
      targetDb.learnerProfile,
      targetDb.notebookEntries,
      targetDb.experimentSnapshots,
      targetDb.quizResults,
      targetDb.skillProgress,
      targetDb.reviewSchedule,
      targetDb.meta,
    ],
    async () => {
      if (learnerProfileRecord) await targetDb.learnerProfile.put(learnerProfileRecord)
      if (notebook.length) await targetDb.notebookEntries.bulkPut(notebook)
      if (experimentSnapshots.length) await targetDb.experimentSnapshots.bulkPut(experimentSnapshots)
      if (quizResultRecords.length) await targetDb.quizResults.bulkAdd(quizResultRecords)
      if (skillProgressRecords.length) await targetDb.skillProgress.bulkPut(skillProgressRecords)
      if (reviewScheduleRecords.length) await targetDb.reviewSchedule.bulkPut(reviewScheduleRecords)

      await targetDb.meta.put({
        key: LEGACY_MISC_META_KEY,
        value: {
          lastVisitedLab: legacyState.lastVisitedLab ?? null,
          timeSpentMinutes: legacyState.timeSpentMinutes ?? 0,
          completedLabs,
          favorites: legacyState.favorites ?? {},
        },
        updatedAt: now,
      })
      await targetDb.meta.put({ key: LEGACY_RAW_BACKUP_META_KEY, value: legacyState, updatedAt: now })
      await targetDb.meta.put({ key: MIGRATION_META_KEY, value: { completedAt: now, reason: 'migrated', counts }, updatedAt: now })
    },
  )

  return { migrated: true, reason: 'migrated', completedAt: now, counts }
}

export async function getMigrationStatus(targetDb: QuantaoraDB = defaultDb): Promise<MigrationStatus | null> {
  const row = await targetDb.meta.get(MIGRATION_META_KEY)
  if (!row) return null
  const value = row.value as { completedAt: number; reason: MigrationStatus['reason']; counts?: Record<string, number> }
  return { migrated: value.reason === 'migrated', reason: value.reason, completedAt: value.completedAt, counts: value.counts }
}
