/**
 * Typed record shapes for the Dexie-backed learner-model database. These are
 * intentionally independent of `useAppStore`'s `AppState` — this module is
 * additive infrastructure for the next agent's Predict-Test / mastery work,
 * not a replacement for the existing Zustand-facing localStorage store.
 */

export interface LearnerProfileRecord {
  /** Fixed singleton key — this app has exactly one local learner profile. */
  id: 'local'
  name: string
  grade: number
  interests: string[]
  confidence: Record<string, number>
  recommendedLab: string
  recommendedMission?: RecommendedMissionRecord
  createdAt: number
  updatedAt: number
}

export interface RecommendedMissionStepRecord {
  label: string
  path: string
  reason: string
}

export interface RecommendedMissionRecord {
  title: string
  subject: string
  summary: string
  steps: RecommendedMissionStepRecord[]
}

/** Per-mistake-tag occurrence counts, e.g. `{ 'sign-error': 3, 'unit-confusion': 1 }`. */
export type MistakeTagCounts = Record<string, number>

export interface SkillProgressRecord {
  /** Component/concept id, e.g. `content.id` such as `'dna'` or `'chloroplast'`. */
  skillId: string
  subject: string
  /** 0-1 model confidence in the learner's mastery of this skill. */
  confidence: number
  /** 0-1 mastery estimate (distinct from confidence: mastery reflects demonstrated correctness). */
  mastery: number
  attempts: number
  correctCount: number
  incorrectCount: number
  mistakeTags: MistakeTagCounts
  lastPracticedAt: number | null
  nextReviewAt: number | null
  createdAt: number
  updatedAt: number
}

export interface AttemptRecord {
  id?: number
  skillId: string
  componentId: string
  correct: boolean
  score: number
  total: number
  mistakeTags: string[]
  createdAt: number
}

export interface MistakeTagLogRecord {
  id?: number
  skillId: string
  attemptId: number | null
  tag: string
  createdAt: number
}

export interface NotebookEntryRecord {
  id: string
  conceptId: string
  conceptName: string
  subject: string
  title: string
  body: string
  createdAt: number
}

export interface ExperimentSnapshotRecord {
  id: string
  labId: string
  labName: string
  subject: string
  title: string
  state: Record<string, unknown>
  createdAt: number
}

export interface QuizResultRecord {
  id?: number
  componentId: string
  score: number
  total: number
  completedAt: number
}

/** Lightweight spaced-repetition state, one row per skill. */
export interface ReviewScheduleRecord {
  skillId: string
  intervalDays: number
  /** Consecutive-correct streak level driving the interval ladder. */
  level: number
  lastReviewedAt: number | null
  nextReviewAt: number
  updatedAt: number
}

export interface MetaRecord {
  key: string
  value: unknown
  updatedAt: number
}

export interface MigrationStatus {
  migrated: boolean
  reason:
    | 'already-migrated'
    | 'no-legacy-data'
    | 'corrupt-json'
    | 'unrecognized-shape'
    | 'migrated'
  completedAt?: number
  counts?: Record<string, number>
}

export interface ExportedData {
  exportedAt: number
  schemaVersion: number
  learnerProfile: LearnerProfileRecord | undefined
  skillProgress: SkillProgressRecord[]
  attempts: AttemptRecord[]
  mistakeTagLog: MistakeTagLogRecord[]
  notebookEntries: NotebookEntryRecord[]
  experimentSnapshots: ExperimentSnapshotRecord[]
  quizResults: QuizResultRecord[]
  reviewSchedule: ReviewScheduleRecord[]
  meta: MetaRecord[]
}
