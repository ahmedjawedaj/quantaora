/**
 * Small React hooks over the Dexie learner-model API, built on Dexie's own
 * `liveQuery` (no extra dependency). Not wired into any route yet — these are
 * the typed entry points for the next agent's Predict-Test / mastery UI.
 */
import { useEffect, useState } from 'react'
import { liveQuery } from 'dexie'
import { db as defaultDb, type QuantaoraDB } from './db.ts'
import * as api from './api.ts'
import type {
  ExperimentSnapshotRecord,
  LearnerProfileRecord,
  MigrationStatus,
  NotebookEntryRecord,
  ReviewScheduleRecord,
  SkillProgressRecord,
} from './types.ts'

function useLiveQuery<T>(querier: () => Promise<T> | T, deps: unknown[], defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue)
  useEffect(() => {
    const subscription = liveQuery(querier).subscribe({
      next: (next) => setValue(next),
      error: () => setValue(defaultValue),
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return value
}

export function useLearnerProfile(targetDb: QuantaoraDB = defaultDb): LearnerProfileRecord | undefined {
  return useLiveQuery(() => api.getLearnerProfile(targetDb), [targetDb], undefined)
}

export function useSkillProgress(skillId: string, targetDb: QuantaoraDB = defaultDb): SkillProgressRecord | undefined {
  return useLiveQuery(() => api.getSkillProgress(skillId, targetDb), [skillId, targetDb], undefined)
}

export function useSkillProgressList(targetDb: QuantaoraDB = defaultDb): SkillProgressRecord[] {
  return useLiveQuery(() => api.listSkillProgress(targetDb), [targetDb], [])
}

export function useDueReviews(now: number = Date.now(), targetDb: QuantaoraDB = defaultDb): ReviewScheduleRecord[] {
  return useLiveQuery(() => api.listDueReviews(now, targetDb), [now, targetDb], [])
}

export function useNotebookEntries(targetDb: QuantaoraDB = defaultDb): NotebookEntryRecord[] {
  return useLiveQuery(() => api.listNotebookEntries(targetDb), [targetDb], [])
}

export function useExperimentSnapshotRecords(targetDb: QuantaoraDB = defaultDb): ExperimentSnapshotRecord[] {
  return useLiveQuery(() => api.listExperimentSnapshotRecords(targetDb), [targetDb], [])
}

export function useMigrationStatus(targetDb: QuantaoraDB = defaultDb): MigrationStatus | null {
  return useLiveQuery(() => api.getMigrationStatus(targetDb), [targetDb], null)
}
