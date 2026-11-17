import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { localStorageAdapter } from '@/lib/storage/localStorageAdapter'
import { migrateLegacyLocalStorage } from '@/lib/storage/migrateLegacy'

export interface NotebookEntry {
  id: string
  conceptId: string
  conceptName: string
  subject: string
  title: string
  body: string
  createdAt: number
}

export interface QuizResult {
  componentId: string
  score: number
  total: number
  completedAt: number
}

export interface LearnerProfile {
  name: string
  grade: number
  interests: string[]
  confidence: Record<string, number>
  recommendedLab: string
  recommendedMission?: RecommendedMission
  createdAt: number
  updatedAt: number
}

export interface RecommendedMissionStep {
  label: string
  path: string
  reason: string
}

export interface RecommendedMission {
  title: string
  subject: string
  summary: string
  steps: RecommendedMissionStep[]
}

export interface LastVisitedLab {
  path: string
  name: string
  subject: string
  visitedAt: number
}

/**
 * A lab component the learner has finished at least once. Keyed by `labId`,
 * which is the *component*-level id (e.g. `content.id` such as `'dna'` or
 * `'chloroplast'`) — not the branch id or route. `branch` carries
 * `content.branch` (the authored branch label, e.g. `'Genetics'`, or in some
 * generated content files the branch id itself, e.g. `'plants'`) so
 * branch-level UI (Labs.tsx) can match a completion back to its branch
 * without needing the two id spaces to coincide.
 */
export interface CompletedLab {
  labId: string
  labName: string
  subject: string
  branch?: string
  firstCompletedAt: number
  lastCompletedAt: number
  timesCompleted: number
}

/**
 * A saved-for-later reference to a lab component or concept. Keyed by `id`
 * (component/concept id, e.g. `content.id`). `branch` mirrors `CompletedLab.branch`
 * for the same branch-matching reason.
 */
export interface FavoriteItem {
  id: string
  type: 'lab' | 'concept'
  name: string
  subject: string
  branch?: string
  path?: string
  addedAt: number
}

/**
 * A saved snapshot of a lab's simulation/control state so a learner can
 * return to it later. `state` is intentionally an opaque bag so any lab can
 * shape its own controls without changing the store.
 */
export interface ExperimentSnapshot {
  id: string
  labId: string
  labName: string
  subject: string
  title: string
  state: Record<string, unknown>
  createdAt: number
}

interface AppState {
  learnerProfile: LearnerProfile | null
  lastVisitedLab: LastVisitedLab | null
  notebook: NotebookEntry[]
  quizResults: QuizResult[]
  mastery: Record<string, number>
  timeSpentMinutes: number
  completedLabs: Record<string, CompletedLab>
  favorites: Record<string, FavoriteItem>
  experimentSnapshots: ExperimentSnapshot[]
  setLearnerProfile: (profile: Omit<LearnerProfile, 'createdAt' | 'updatedAt'>) => void
  clearLearnerProfile: () => void
  setLastVisitedLab: (lab: Omit<LastVisitedLab, 'visitedAt'>) => void
  saveToNotebook: (entry: Omit<NotebookEntry, 'id' | 'createdAt'>) => void
  removeFromNotebook: (id: string) => void
  recordQuizResult: (componentId: string, score: number, total: number) => void
  logTime: (minutes: number) => void
  markLabCompleted: (lab: { labId: string; labName: string; subject: string; branch?: string }) => void
  unmarkLabCompleted: (labId: string) => void
  toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void
  removeFavorite: (id: string) => void
  /**
   * Saves an experiment snapshot, guarding against duplicate-spam: if the
   * most recent snapshot for the same `labId` has byte-identical `state`, or
   * was created within `SNAPSHOT_MIN_INTERVAL_MS`, no new entry is written
   * and the existing snapshot's id is returned with `created: false` so
   * callers can show honest "already saved" feedback instead of a fake
   * confirmation.
   */
  saveExperimentSnapshot: (
    snapshot: Omit<ExperimentSnapshot, 'id' | 'createdAt'>,
  ) => { id: string; created: boolean }
  removeExperimentSnapshot: (id: string) => void
  renameExperimentSnapshot: (id: string, title: string) => void
}

const STORAGE_VERSION = 1

/** Minimum gap between two saved snapshots for the same lab before a save is treated as duplicate-spam. */
const SNAPSHOT_MIN_INTERVAL_MS = 1500

/** Legacy (pre-version) persisted shape — only the fields that existed before this migration. */
interface LegacyPersistedStateV0 {
  learnerProfile: LearnerProfile | null
  lastVisitedLab: LastVisitedLab | null
  notebook: NotebookEntry[]
  quizResults: QuizResult[]
  mastery: Record<string, number>
  timeSpentMinutes: number
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      learnerProfile: null,
      lastVisitedLab: null,
      notebook: [],
      quizResults: [],
      mastery: {},
      timeSpentMinutes: 0,
      completedLabs: {},
      favorites: {},
      experimentSnapshots: [],
      setLearnerProfile: (profile) =>
        set((state) => {
          const now = Date.now()
          return {
            learnerProfile: {
              ...profile,
              createdAt: state.learnerProfile?.createdAt ?? now,
              updatedAt: now,
            },
          }
        }),
      clearLearnerProfile: () => set({ learnerProfile: null }),
      setLastVisitedLab: (lab) => set({ lastVisitedLab: { ...lab, visitedAt: Date.now() } }),
      saveToNotebook: (entry) =>
        set((state) => ({
          notebook: [
            { ...entry, id: `${entry.conceptId}-${Date.now()}`, createdAt: Date.now() },
            ...state.notebook,
          ],
        })),
      removeFromNotebook: (id) =>
        set((state) => ({ notebook: state.notebook.filter((n) => n.id !== id) })),
      recordQuizResult: (componentId, score, total) =>
        set((state) => {
          const ratio = score / total
          const nextMastery = Math.min(5, Math.round(ratio * 5))
          return {
            quizResults: [{ componentId, score, total, completedAt: Date.now() }, ...state.quizResults],
            mastery: { ...state.mastery, [componentId]: nextMastery },
          }
        }),
      logTime: (minutes) => set((state) => ({ timeSpentMinutes: state.timeSpentMinutes + minutes })),
      markLabCompleted: (lab) =>
        set((state) => {
          const now = Date.now()
          const existing = state.completedLabs[lab.labId]
          return {
            completedLabs: {
              ...state.completedLabs,
              [lab.labId]: {
                labId: lab.labId,
                labName: lab.labName,
                subject: lab.subject,
                branch: lab.branch ?? existing?.branch,
                firstCompletedAt: existing?.firstCompletedAt ?? now,
                lastCompletedAt: now,
                timesCompleted: (existing?.timesCompleted ?? 0) + 1,
              },
            },
          }
        }),
      unmarkLabCompleted: (labId) =>
        set((state) => {
          const next = { ...state.completedLabs }
          delete next[labId]
          return { completedLabs: next }
        }),
      toggleFavorite: (item) =>
        set((state) => {
          const next = { ...state.favorites }
          if (next[item.id]) {
            delete next[item.id]
          } else {
            next[item.id] = { ...item, addedAt: Date.now() }
          }
          return { favorites: next }
        }),
      removeFavorite: (id) =>
        set((state) => {
          const next = { ...state.favorites }
          delete next[id]
          return { favorites: next }
        }),
      saveExperimentSnapshot: (snapshot) => {
        const now = Date.now()
        const contentKey = JSON.stringify(snapshot.state ?? {})
        const mostRecentForLab = get().experimentSnapshots.find((s) => s.labId === snapshot.labId)
        if (mostRecentForLab) {
          const sameContent = JSON.stringify(mostRecentForLab.state ?? {}) === contentKey
          const tooSoon = now - mostRecentForLab.createdAt < SNAPSHOT_MIN_INTERVAL_MS
          if (sameContent || tooSoon) {
            return { id: mostRecentForLab.id, created: false }
          }
        }
        const id = `${snapshot.labId}-${now}-${Math.round(Math.random() * 1e6)}`
        set((state) => ({
          experimentSnapshots: [{ ...snapshot, id, createdAt: now }, ...state.experimentSnapshots],
        }))
        return { id, created: true }
      },
      removeExperimentSnapshot: (id) =>
        set((state) => ({
          experimentSnapshots: state.experimentSnapshots.filter((s) => s.id !== id),
        })),
      renameExperimentSnapshot: (id, title) =>
        set((state) => ({
          experimentSnapshots: state.experimentSnapshots.map((s) => (s.id === id ? { ...s, title } : s)),
        })),
    }),
    {
      name: 'quantaora-local-progress',
      storage: createJSONStorage(() => localStorageAdapter),
      version: STORAGE_VERSION,
      // Additive-only migration: every release before `version: 1` only ever
      // persisted the legacy fields below. Carry them forward untouched and
      // backfill the new v1 collections so existing learner data (profile,
      // notebook, quiz history, mastery, time spent) is never dropped.
      migrate: (persistedState, version) => {
        const legacy = (persistedState ?? {}) as Partial<LegacyPersistedStateV0 & AppState>
        if (version < 1) {
          return {
            learnerProfile: legacy.learnerProfile ?? null,
            lastVisitedLab: legacy.lastVisitedLab ?? null,
            notebook: legacy.notebook ?? [],
            quizResults: legacy.quizResults ?? [],
            mastery: legacy.mastery ?? {},
            timeSpentMinutes: legacy.timeSpentMinutes ?? 0,
            completedLabs: legacy.completedLabs ?? {},
            favorites: legacy.favorites ?? {},
            experimentSnapshots: legacy.experimentSnapshots ?? [],
          } satisfies Partial<AppState>
        }
        return legacy as Partial<AppState>
      },
      partialize: (state) => {
        const {
          learnerProfile,
          lastVisitedLab,
          notebook,
          quizResults,
          mastery,
          timeSpentMinutes,
          completedLabs,
          favorites,
          experimentSnapshots,
        } = state
        return {
          learnerProfile,
          lastVisitedLab,
          notebook,
          quizResults,
          mastery,
          timeSpentMinutes,
          completedLabs,
          favorites,
          experimentSnapshots,
        }
      },
      // Fire-and-forget: idempotently copies this same persisted blob into the
      // new Dexie learner-model database (see src/lib/storage/) without
      // changing this store's own behavior or shape. Safe to run on every
      // load — migrateLegacyLocalStorage no-ops once already migrated.
      onRehydrateStorage: () => () => {
        void migrateLegacyLocalStorage().catch(() => {
          // Best-effort background migration; failures do not affect the Zustand store.
        })
      },
    },
  ),
)
