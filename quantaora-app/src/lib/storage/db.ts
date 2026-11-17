import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  AttemptRecord,
  ExperimentSnapshotRecord,
  LearnerProfileRecord,
  MetaRecord,
  MistakeTagLogRecord,
  NotebookEntryRecord,
  QuizResultRecord,
  ReviewScheduleRecord,
  SkillProgressRecord,
} from './types.ts'

/** Default IndexedDB database name used in the running app. Tests pass a unique name. */
export const DEFAULT_DB_NAME = 'quantaora-progress'

/**
 * Production local learner-model database. Version 1 establishes the
 * foundation schema (learner profile, skill progress, attempts, mistake tag
 * log, notebook, experiment snapshots, quiz results, review schedule, meta).
 * Future schema changes must add a new `.version(n)` block with an `upgrade`
 * function rather than editing the v1 `.stores()` call, so existing learner
 * data survives the upgrade.
 */
export class QuantaoraDB extends Dexie {
  learnerProfile!: Table<LearnerProfileRecord, string>
  skillProgress!: Table<SkillProgressRecord, string>
  attempts!: Table<AttemptRecord, number>
  mistakeTagLog!: Table<MistakeTagLogRecord, number>
  notebookEntries!: Table<NotebookEntryRecord, string>
  experimentSnapshots!: Table<ExperimentSnapshotRecord, string>
  quizResults!: Table<QuizResultRecord, number>
  reviewSchedule!: Table<ReviewScheduleRecord, string>
  meta!: Table<MetaRecord, string>

  constructor(name: string = DEFAULT_DB_NAME) {
    super(name)
    this.version(1).stores({
      learnerProfile: 'id',
      skillProgress: 'skillId, subject, nextReviewAt',
      attempts: '++id, skillId, componentId, createdAt',
      mistakeTagLog: '++id, skillId, tag, createdAt',
      notebookEntries: 'id, conceptId, createdAt',
      experimentSnapshots: 'id, labId, createdAt',
      quizResults: '++id, componentId, completedAt',
      reviewSchedule: 'skillId, nextReviewAt',
      meta: 'key',
    })
  }
}

/** Singleton used by the running app; tests construct their own `QuantaoraDB` instances. */
export const db = new QuantaoraDB()
