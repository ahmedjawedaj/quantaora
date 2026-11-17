/**
 * Typed CRUD/query surface over the Dexie learner-model database. This is the
 * contract the next agent's Predict-Test / mastery UI builds on — it does not
 * touch `useAppStore` or any lab UI.
 */
import type { QuantaoraDB } from './db.ts'
import { db as defaultDb } from './db.ts'
import { nextReviewStep } from './reviewScheduler.ts'
import { defaultLegacyStorageSource } from './migrateLegacy.ts'
import type { LegacyStorageSource } from './migrateLegacy.ts'
import type {
  AttemptRecord,
  ExperimentSnapshotRecord,
  ExportedData,
  LearnerProfileRecord,
  MistakeTagLogRecord,
  NotebookEntryRecord,
  QuizResultRecord,
  ReviewScheduleRecord,
  SkillProgressRecord,
} from './types.ts'

const SCHEMA_VERSION = 1

export { migrateLegacyLocalStorage, getMigrationStatus } from './migrateLegacy.ts'

// ---- Learner profile ----

export async function getLearnerProfile(targetDb: QuantaoraDB = defaultDb): Promise<LearnerProfileRecord | undefined> {
  return targetDb.learnerProfile.get('local')
}

export async function setLearnerProfile(
  profile: Omit<LearnerProfileRecord, 'id' | 'createdAt' | 'updatedAt'>,
  targetDb: QuantaoraDB = defaultDb,
): Promise<LearnerProfileRecord> {
  const now = Date.now()
  const existing = await targetDb.learnerProfile.get('local')
  const record: LearnerProfileRecord = {
    id: 'local',
    ...profile,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  await targetDb.learnerProfile.put(record)
  return record
}

export async function clearLearnerProfile(targetDb: QuantaoraDB = defaultDb): Promise<void> {
  await targetDb.learnerProfile.delete('local')
}

// ---- Skill progress + attempts + mistake tags ----

export async function getSkillProgress(skillId: string, targetDb: QuantaoraDB = defaultDb): Promise<SkillProgressRecord | undefined> {
  return targetDb.skillProgress.get(skillId)
}

export async function listSkillProgress(targetDb: QuantaoraDB = defaultDb): Promise<SkillProgressRecord[]> {
  return targetDb.skillProgress.toArray()
}

export interface RecordAttemptInput {
  skillId: string
  componentId: string
  subject: string
  correct: boolean
  score: number
  total: number
  mistakeTags?: string[]
}

/**
 * Logs one attempt, updates (or creates) the skill's aggregate progress and
 * mistake-tag counts, and advances its review schedule. Returns the updated
 * skill progress row.
 */
export async function recordAttempt(input: RecordAttemptInput, targetDb: QuantaoraDB = defaultDb): Promise<SkillProgressRecord> {
  const now = Date.now()
  const mistakeTags = input.mistakeTags ?? []

  return targetDb.transaction(
    'rw',
    [targetDb.attempts, targetDb.mistakeTagLog, targetDb.skillProgress, targetDb.reviewSchedule],
    async () => {
      const attemptId = await targetDb.attempts.add({
        skillId: input.skillId,
        componentId: input.componentId,
        correct: input.correct,
        score: input.score,
        total: input.total,
        mistakeTags,
        createdAt: now,
      })

      if (mistakeTags.length) {
        const logEntries: MistakeTagLogRecord[] = mistakeTags.map((tag) => ({
          skillId: input.skillId,
          attemptId,
          tag,
          createdAt: now,
        }))
        await targetDb.mistakeTagLog.bulkAdd(logEntries)
      }

      const existing = await targetDb.skillProgress.get(input.skillId)
      const attempts = (existing?.attempts ?? 0) + 1
      const correctCount = (existing?.correctCount ?? 0) + (input.correct ? 1 : 0)
      const incorrectCount = (existing?.incorrectCount ?? 0) + (input.correct ? 0 : 1)
      const mergedTags = { ...(existing?.mistakeTags ?? {}) }
      for (const tag of mistakeTags) mergedTags[tag] = (mergedTags[tag] ?? 0) + 1

      const schedule = nextReviewStep(
        (await targetDb.reviewSchedule.get(input.skillId))?.level ?? -1,
        input.correct,
        now,
      )
      await targetDb.reviewSchedule.put({
        skillId: input.skillId,
        intervalDays: schedule.intervalDays,
        level: schedule.level,
        lastReviewedAt: now,
        nextReviewAt: schedule.nextReviewAt,
        updatedAt: now,
      })

      const record: SkillProgressRecord = {
        skillId: input.skillId,
        subject: input.subject,
        confidence: attempts ? correctCount / attempts : 0,
        mastery: attempts ? correctCount / attempts : 0,
        attempts,
        correctCount,
        incorrectCount,
        mistakeTags: mergedTags,
        lastPracticedAt: now,
        nextReviewAt: schedule.nextReviewAt,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }
      await targetDb.skillProgress.put(record)
      return record
    },
  )
}

export async function listAttempts(skillId?: string, targetDb: QuantaoraDB = defaultDb): Promise<AttemptRecord[]> {
  if (skillId) return targetDb.attempts.where('skillId').equals(skillId).toArray()
  return targetDb.attempts.toArray()
}

export async function listMistakeTags(skillId?: string, targetDb: QuantaoraDB = defaultDb): Promise<MistakeTagLogRecord[]> {
  if (skillId) return targetDb.mistakeTagLog.where('skillId').equals(skillId).toArray()
  return targetDb.mistakeTagLog.toArray()
}

// ---- Review scheduling ----

export async function getReviewSchedule(skillId: string, targetDb: QuantaoraDB = defaultDb): Promise<ReviewScheduleRecord | undefined> {
  return targetDb.reviewSchedule.get(skillId)
}

export async function listDueReviews(now: number = Date.now(), targetDb: QuantaoraDB = defaultDb): Promise<ReviewScheduleRecord[]> {
  return targetDb.reviewSchedule.where('nextReviewAt').belowOrEqual(now).toArray()
}

// ---- Notebook ----

export async function saveNotebookEntry(entry: NotebookEntryRecord, targetDb: QuantaoraDB = defaultDb): Promise<void> {
  await targetDb.notebookEntries.put(entry)
}

export async function removeNotebookEntry(id: string, targetDb: QuantaoraDB = defaultDb): Promise<void> {
  await targetDb.notebookEntries.delete(id)
}

export async function listNotebookEntries(targetDb: QuantaoraDB = defaultDb): Promise<NotebookEntryRecord[]> {
  return targetDb.notebookEntries.toArray()
}

// ---- Experiment snapshots ----

export async function saveExperimentSnapshotRecord(
  snapshot: ExperimentSnapshotRecord,
  targetDb: QuantaoraDB = defaultDb,
): Promise<void> {
  await targetDb.experimentSnapshots.put(snapshot)
}

export async function removeExperimentSnapshotRecord(id: string, targetDb: QuantaoraDB = defaultDb): Promise<void> {
  await targetDb.experimentSnapshots.delete(id)
}

export async function listExperimentSnapshotRecords(targetDb: QuantaoraDB = defaultDb): Promise<ExperimentSnapshotRecord[]> {
  return targetDb.experimentSnapshots.toArray()
}

// ---- Quiz results ----

export async function recordQuizResultRow(result: Omit<QuizResultRecord, 'id'>, targetDb: QuantaoraDB = defaultDb): Promise<number> {
  return targetDb.quizResults.add(result)
}

export async function listQuizResultRows(targetDb: QuantaoraDB = defaultDb): Promise<QuizResultRecord[]> {
  return targetDb.quizResults.toArray()
}

// ---- Export / reset ----

export async function exportAllData(targetDb: QuantaoraDB = defaultDb): Promise<ExportedData> {
  const [learnerProfile, skillProgress, attempts, mistakeTagLog, notebookEntries, experimentSnapshots, quizResults, reviewSchedule, meta] =
    await Promise.all([
      targetDb.learnerProfile.get('local'),
      targetDb.skillProgress.toArray(),
      targetDb.attempts.toArray(),
      targetDb.mistakeTagLog.toArray(),
      targetDb.notebookEntries.toArray(),
      targetDb.experimentSnapshots.toArray(),
      targetDb.quizResults.toArray(),
      targetDb.reviewSchedule.toArray(),
      targetDb.meta.toArray(),
    ])
  return {
    exportedAt: Date.now(),
    schemaVersion: SCHEMA_VERSION,
    learnerProfile,
    skillProgress,
    attempts,
    mistakeTagLog,
    notebookEntries,
    experimentSnapshots,
    quizResults,
    reviewSchedule,
    meta,
  }
}

export interface ResetOptions {
  /** Also clear the legacy `quantaora-local-progress` localStorage key. Default false. */
  clearLegacyLocalStorage?: boolean
}

/**
 * Clears every data table but re-marks the legacy migration as done (with
 * reason `'reset'`) so a stale legacy localStorage blob can't resurrect old
 * data on the next load.
 */
export async function resetAllData(
  options: ResetOptions = {},
  targetDb: QuantaoraDB = defaultDb,
  storage: LegacyStorageSource | null = defaultLegacyStorageSource(),
): Promise<void> {
  const now = Date.now()
  await targetDb.transaction(
    'rw',
    [
      targetDb.learnerProfile,
      targetDb.skillProgress,
      targetDb.attempts,
      targetDb.mistakeTagLog,
      targetDb.notebookEntries,
      targetDb.experimentSnapshots,
      targetDb.quizResults,
      targetDb.reviewSchedule,
      targetDb.meta,
    ],
    async () => {
      await Promise.all([
        targetDb.learnerProfile.clear(),
        targetDb.skillProgress.clear(),
        targetDb.attempts.clear(),
        targetDb.mistakeTagLog.clear(),
        targetDb.notebookEntries.clear(),
        targetDb.experimentSnapshots.clear(),
        targetDb.quizResults.clear(),
        targetDb.reviewSchedule.clear(),
        targetDb.meta.clear(),
      ])
      await targetDb.meta.put({ key: 'legacyMigration', value: { completedAt: now, reason: 'reset', counts: {} }, updatedAt: now })
    },
  )
  if (options.clearLegacyLocalStorage && storage) {
    try {
      storage.removeItem('quantaora-local-progress')
    } catch {
      // best-effort
    }
  }
}
