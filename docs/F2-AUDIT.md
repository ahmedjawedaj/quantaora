# F2 — Persistence Layer Audit & Migration Design

Status: **Design / No code changed.** Audit of the current zustand/localStorage persistence, and a
complete Dexie migration design (spec §17, §19, §20, §25; aligned with PRODUCTION-PLAN §F2).

Canonical spec reference: `docs/quantaora-product-tech-spec.md`. Follows additive-mapping rules
(§8 "Additive Mapping", §32 "Data Loss").

---

## (a) Current state

### The one blob

- **Persist key:** `quantaora-local-progress` (zustand `persist` middleware, `useAppStore.ts:59`).
- **Storage engine:** `localStorage` (flat, synchronous, single string).
- **Persisted shape (zustand `persist` wrapper):**

  ```ts
  { "state": { "notebook": [], "quizResults": [], "mastery": {}, "timeSpentMinutes": 0 }, "version": 0 }
  ```

- **No** Dexie. **No** profile, grade, curriculum path, spaced-review, or per-attempt history.

### In-memory shape (`useAppStore.ts`)

```ts
notebook: NotebookEntry[]          // {id, conceptId, conceptName, subject, title, body, createdAt}
quizResults: QuizResult[]          // {componentId, score, total, completedAt}
mastery: Record<componentId, 0-5>  // 5 = derived from last quiz ratio: min(5, round(score/total*5))
timeSpentMinutes: number
```

### All read/write points (full inventory)

| File | Store access | Why / what it does |
| --- | --- | --- |
| `src/routes/AppShell.tsx` | `logTime(1)` | Tick every 60s: bumps `timeSpentMinutes` |
| `src/components/explorer/BottomTray.tsx` | reads `mastery[content.id]`, `notebook.length` | Tray copy: "Mastery N/5 — retake", "N saved items" |
| `src/components/explorer/DetailPanel.tsx` | `saveToNotebook(entry)` | Writes a highlighted hotspot/concept into notebook |
| `src/components/explorer/QuizModal.tsx` | `recordQuizResult(componentId, score, total)` | On finish: stores result + recomputes mastery |
| `src/routes/Notebook.tsx` | reads `notebook`, `removeFromNotebook(id)` | Lists + deletes notebook entries |
| `src/routes/Grownups.tsx` | reads `mastery`, `quizResults`, `notebook`, `timeSpentMinutes` | Parent/Teacher dashboard: strongest area, attempted counts, master-by-subject, time |

Only one action each for notebook-write/quiz-write; every other access is a read. No other store
access exists in `src/` (verified: the 6 files above are the complete consumer set).

> Note: the bug report referenced `quanta-app/src/routes/Gately.tsx` / `Notebook`/`Mastery`. The
> real paths are `quantaora-app/src/routes/Grownups.tsx`, `Notebook.tsx`. There is no `Gately.tsx` —
> the intended file is `Grownups.tsx`.

### Actions currently mutating state

- `saveToNotebook(entry)` → prepends entry, ids `${conceptId}-${Date.now()}`, stamps `createdAt`.
- `removeFromNotebook(id)` → filters by `id`.
- `recordQuizResult(componentId, score, total)` → **replaces** `mastery[id] = min(5, round(score/total*5))`;
  prepends `quizResults`, stamps `completedAt`. Note: mastery is last-attempt-replaces, not accumulated.
- `logTime(minutes)` → `+minutes` cumulative (never reset; even per "this session" label in Grownups).

---

## (b) Dexie schema (TypeScript)

### package.json — audit result

`dexie` is **NOT installed**. Current dependencies (`quantaora-app/package.json`):

`@react-three/drei`, `@react-three/fiber`, `@react-three/postprocessing`, `clsx`, `framer-motion`,
`lucide-react`, `react`, `react-dom`, `react-router-dom`, `tailwind-merge`, `three`,
`three-stdlib`, `zustand`.

**Add:** `dexie@^4` (and `dexie-react-hooks` if using the `useLiveQuery` hooks) + `zod` (recommended by
spec §20 for validation/import). Dexie's TS types ship in-package — no `@types` needed.

### Store count note

Spec §17 lists **12** stores. The F2 plan names **10** (it omits the two pure cache stores —
`curriculumCache`, `assetCacheMetadata`). Both are canonical; the "10" are the learner/config
stores (the two cache stores are derived/indexed content, not learner data). Everything below
implements the full 12 for fidelity.

### `Dexie` class + schema

```ts
// lib/db.ts (design only — do not implement layout here)
import Dexie, { type Table } from "dexie"

export class QuantaoraDB extends Dexie {
  profiles!: Table<LearnerProfile, string>
  skills!: Table<SkillProgress, string>
  missions!: Table<Mission, string>
  quizAttempts!: Table<QuizAttempt, string>
  labAttempts!: Table<LabAttempt, string>
  notebookEntries!: Table<NotebookEntry, string>
  savedConcepts!: Table<SavedConcept, string>
  settings!: Table<AppSettings, string>
  streaks!: Table<Streak, string>
  curriculumCache!: Table<CurriculumCache, string>
  assetCacheMetadata!: Table<AssetCacheMeta, string>
  backupHistory!: Table<BackupRecord, string>

  constructor() {
    super("quantaora")
    this.version(1).stores({
      profiles: `id, updatedAt`,
      skills: `id, skillId, profileId, mastery, nextReviewAt, [profileId+skillId]`,
      missions: `id, profileId, status, dueBy`,
      quizAttempts: `id, profileId, componentId, profileId+componentId, completedAt`,
      labAttempts: `id, profileId, componentId, completedAt`,
      notebookEntries: `id, profileId, conceptId, created`,
      savedConcepts: `id, [profileId+conceptId], created`,
      settings: `key`,
      streaks: `profileId, day`,
      curriculumCache: `id, subject, branch, updatedAt`,
      assetCacheMetadata: `id, url, updatedAt`,
      backupHistory: `id, createdAt`,
    })
  }
}
export const db = new QuantaoraDB()
```

### Per-store records

```ts
interface LearnerProfile {
  id: string            // single active profile for MVP
  name: string
  grade: string
  country?: string
  region?: string
  curriculumPath: string
  interests: string[]
  missionMinutes: number
  difficulty: 'gentle' | 'balanced' | 'challenge'
  reducedMotion: boolean
  soundOn: boolean
  createdAt: number
  updatedAt: number
}

interface SkillProgress {        // lives in `skills` store
  id: string
  skillId: string               // maps to a ComponentContent.id (or hotspot/micro-skill id later)
  profileId: string
  mastery: number               // 0–5
  confidence: number            // 0–1, smoothed
  attempts: number
  correct: number               // cumulative correct answers
  lastSeenAt?: number
  nextReviewAt?: number         // spaced-review due timestamp
  mistakeTags: string[]         // e.g. ["negation", "unit-mixup"]
}

interface QuizAttempt {
  id: string
  profileId: string
  componentId: string
  score: number
  total: number
  wrongConceptIds?: string[]    // hot concept-mappings for mistakeTags
  completedAt: number
}

interface LabAttempt {
  id: string; profileId: string; componentId: string
  predictionCorrect: boolean; completedAt: number
}

interface NotebookEntry {
  id: string; profileId: string; conceptId: string
  title: string; body: string; screenshotDataUrl?: string
  tags: string[]; createdAt: number; updatedAt: number
}

interface SavedConcept {
  id: string; profileId: string; conceptId: string; createdAt: number
}

interface AppSettings { key: string; value: unknown }

interface Streak { id: string; day: string /* yyyy-mm-dd */; secondsActive: number }

type Mission = any            // §18; not yet authored — schema reserved
type CurriculumCache = any    // cache of last-known curriculum metadata
type AssetCacheMeta = { id: string; url: string; updatedAt: number }
type BackupRecord = { id: string; createdAt: number; format: string }
```

> `db.version(2)` and beyond follow Dexie's additive migration style: add fields in the same call,
> never drop — aligns with §32 "Local IndexedDB schema migrations" no-data-loss rule. Future
> `nextReviewAt`, `mistakeTags`, `confidence` land on `skills` in v1 from day one, so no backfill is
> needed.

---

## (c) Migration plan — import the existing blob (additive, no data loss)

De-activate the blob **after** a one-time import so a re-run never double-counts. Never delete the
legacy key (keeps a manual rollback path; harmless ~few KB).

### Step 0 — detect

```ts
const LEGACY_KEY = "quantaora-local-progress"

function readLegacyBlob(): AppState | null {
  const raw = localStorage.getItem(LEGACY_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed?.state ?? null                 // unwrap zustand persist envelope
  } catch { return null }
}
```

### Step 1 — seed the active profile (idempotent)

```ts
const SEED_PROFILE_ID = "local-default"

// only on first run
await db.settings.put({ key: "migration", value: `legacy-imported:${Date.now()}` })
await db.profiles.put({ /* seeded from defaults; skip if a profile already exists */ })
```

### Step 2 — additive mapping rules (spec §8, §17)

For each key in the legacy blob, map **without ever lowering existing values**:

| Legacy field | Target store | Mapping rule (additive) |
| --- | --- | --- |
| `mastery[componentId]` | `skills` | `skillId = componentId`; **take the max** of existing row vs legacy value: `newMastery = max(existingMastery, legacyMastery)`. Never reduce. |
| `quizResults[]` | `quizAttempts` | Insert each row, mapping `componentId`→`componentId`, `completedAt`→`completedAt`, score/total passed through; skip rows whose `id` already exists. |
| `notebook[]` | `notebookEntries` | Insert, mapping `conceptId→conceptId`, `conceptName→title`, `subject` discarded (derive from component), `createdAt→createdAt`. Skip existing by PK. |
| `timeSpentMinutes` | cumulative | Add to `LearnerProfile.missionMinutes` and today's `streaks.day` row (or a `settings` "legacyMinutes" counter). Do not overwrite fresh minutes. |

Additive intent: **monotonic** — existing progress can only go up, never down, never reset.

### Step 3 — import transaction (crash-safe)

```ts
await db.transaction("rw", db.skills, db.quizAttempts,
  db.notebookEntries, db.settings, db.profiles, db.streaks, async () => {
    // merge skills (max), insert quizAttempts, notebookEntries,
    // fold timeSpent, set settings.migration="applied"
  })
```

Using a single Dexie transaction guards against partial import on tab-close mid-migration.

### Step 4 — switch readers to Dexie; drop the zustand persist middleware

- Remove `persist` from `useAppStore` (keep zustand as UI cache only, or drop the store entirely and
  read straight from Dexie via `useLiveQuery`).
- Keep `localStorage[legacy]` in place for one N-version rollback window; a cleanup task can remove
  it later under explicit user action (a backup button already implies opt-in).

### Step 5 — verify

- `skills` count == legacy `mastery` keys, and every value is `max(old, imported)`.
- `quizAttempts` count >= legacy `quizResults`.
- `notebookEntries` count == legacy `notebook`.
- `timeSpentMinutes` preserved (additive).

---

## (d) SkillProgress model & quiz-attempt update math

Lives in the `skills` store. This is the exact shape spec §17/§19 requires and it directly supports
the Leitner box schedule (1/2/4/8/16 days) via `nextReviewAt`.

### Update on a quiz attempt (`recordQuizAttempt`)

Input: `componentId`, `score`, `total`, `wrongIds?: string[]`, `correctPerMistake` optionally per tag.

```ts
async function recordQuizAttempt(componentId, profileId, options: { score, total, wrongIds? }) {
  const ratio = options.score / options.total
  const correctCount = options.score

  return db.transaction("rw", db.skills, db.quizAttempts, db.profiles, async () => {
    const existing = await db.skills
      .where("[profileId+skillId]")
      .equals([profileId, componentId])
      .first()

    const attempts = (existing?.attempts ?? 0) + 1
    const correct = (existing?.correct ?? 0) + correctCount

    // mastery: never lower by re-taking  (§4 last-attempt-replace → additive is NOT allowed to drop)
    const mastery = Math.max(existing?.mastery ?? 0,
      Math.min(5, Math.round(ratio * 5)))

    // confidence: exponential moving average, clamped to [0,1]
    const target = ratio
    const confidence = existing
      ? clamp01(existing.confidence * 0.7 + target * 0.3)
      : target

    // mistaken: a miss in this attempt is a mistakeTag source
    const mistakeTags = existing?.mistakeTags ?? []
    for (const tag of wrongIds ?? []) {
      if (!mistakeTags.includes(tag) && mistakeTags.length < 8)
        mistakeTags.push(tag)
    }

    // Leitner nextReviewAt (box 1..5): corrects advance, a miss stays/collapses
    const reviewDelayDays = boxFromResult(existing, ratio)  // {1:1,2:2,3:4,4:8,5:16}
    const nextReviewAt = Date.now() + reviewDelayDays * 86_400_000

    await db.skills.put({
      id: existing?.id ?? `${profileId}:${componentId}`,
      skillId: componentId, profileId,
      mastery, confidence, attempts, correct,
      lastSeenAt: Date.now(), nextReviewAt, mistakeTags,
    })

    await db.quizAttempts.add({
      id: crypto.randomUUID(), profileId, componentId,
      score, total, wrongIds, completedAt: Date.now(),
    })
  })
}
```

### `mastery` — exact 0–5 semantic (spec §19)

`0 unseen · 1 introduced · 2 tried w/ support · 3 normal support · 4 independent · 5 mastered`.
Rule: mastery only ever rises within a skill-id family (spec §8; §32 loss risk). `masteryReviewResult`
moves the Leitner box **forward** on `ratio ≥ 0.8`, holds on a pass, drops on a fail.

### Gains later (F2 + spaced review)

- **Review scheduling:** `db.skills.where("nextReviewAt").belowOrEqual(now)` + order by nextReviewAt =
  the "due today" queue underpinning Mission Mode (§18) and Daily Missions (§8).
- **Mistake engine:** `mistakeTags` feed re-quiz selection and Parent/Teacher weak-area UI.
- **Confidence** unblocking practice-mode difficulty and the `onboarding §7` subject-confidence data.

---

## (e) Store-consumer migration list (component → store function)

The interface offered to components should be split into **query hooks** (subscribe/read) and
**actions** (write), per the task's separation-of-concerns. Recommended query Hooks:

```ts
useProfile(): LearnerProfile | null        // active profile
useSkill(componentId): SkillProgress | undefined
useSkillsDue(reviewAt = now): SkillProgress[]
useNotebookEntries(): NotebookEntry[]
useTimeSpent(): number
useQuizAttempts(): QuizAttempt[]
useStreakToday(): Streak | undefined
```

Actions (all async, writing via Dexie):

```ts
saveToNotebook(entry): Promise<void>
removeFromNotebook(id): Promise<void>
recordQuizAttempt(componentId, { score, total, wrongIds }): Promise<void>
logTime(minutes): Promise<void>
```

| Component / Route | Current store call | New call |
| --- | --- | --- |
| `AppShell.tsx` | `useAppStore(s => s.logTime)` | `logTime(1)` action (fires the existing 60s interval unchanged) |
| `BottomTray.tsx` | `useAppStore(s => s.mastery[content.id])` | `useSkill(content.id).mastery` |
| `BottomTray.tsx` | `useAppStore(s => s.notebook.length)` | `useNotebookEntries().length` |
| `DetailPanel.tsx` | `useAppStore(s => s.saveToNotebook)` | `saveRecord(...)` action |
| `QuizModal.tsx` | `useAppStore(s => s.recordQuizResult)` | `recordQuizAttempt(componentId, {score, total, wrongIds})` (needs the wrong-question ids plumbed) |
| `Notebook.tsx` | `useAppStore(s => s.notebook)` | `useNotebookEntries()` |
| `Notebook.tsx` | `useAppStore(s => s.removeFromNotebook)` | `removeFromNotebook(id)` action |
| `Grownups.tsx` | `useAppStore(s => s.mastery / quizResults / notebook / timeSpent)` | `useSkillsForAll()`, `useQuizAttempts()`, `useNotebookEntries()`, `useTimeSpent()` |
| *(future)* `Parent` weak-tags, review queue | — | `useSkillsDueTo()`, `useSkillsByMistake(tag)` |

Switching is a **pure query swap** for every read; only `QuizModal` needs new data plumbing
(`wrongIds`), and `AppShell`/`QuizModal` must call the async actions in `useEffect`/handlers (they
already do). No route's contract changes.

---

## (f) Recommendation

**Proceed with the Dexie migration (F2), scoped as follows:**

1. **Add `dexie` (+ optional `dexie-react-hooks`) and `zod`** — not currently installed.
2. **Single-source Dexie schema** exactly as §(b), versioned from `version(1)`, never unversioned.
3. **State via account-only-readers**: keep zustand only for invalidation if needed; prefer
   `useLiveQuery` hooks so the parent dashboard and tray derive straight from IndexedDB. Read the
   imperative form (transactional) for the two writes.
4. **Profile seed**: one default `LearnerProfile` created on first boot (MVP is a single learner),
   `profileId` threaded through every store.
5. **Import migration (idempotent, additive)**: run the Step-0→3 transaction on boot when
   `settings.migration == undefined` and the legacy blob exists. Keep the legacy key, never lower.
6. **Land first** before any mission/review/nightly work: this is the dependency-sorted prerequisite.

Duplicates to watch:
- `QuizModal.recordQuizResult` must winter its `wrongIds` into the attempt for `mistakeTags` (it
  doesn't today) — otherwise the spaced-review signal is lost.
- `timeSpentMinutes` folding shouldn't double-count if the user reloads mid-second — make `logTime`
  idempotent via a module-level `lastTick` guard.
- "This session" label in `Grownups` will look odd once minutes no longer reset per load; decide
  whether to seed a daily `streaks` baseline or rename the metric.
```