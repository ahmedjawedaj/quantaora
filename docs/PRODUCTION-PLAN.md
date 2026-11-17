# Quantaora — Production Plan

**Status:** active plan. Executes after the foundations below, in dependency order.
**Companion docs:** [PROJECT-STATUS.md](PROJECT-STATUS.md) (what's built / phase status) and
[quantaora-product-tech-spec.md](quantaora-product-tech-spec.md) (the full scope).
**License register:** [ASSET-LICENSES.md](ASSET-LICENSES.md).

This doc is the *engineering path* from what exists to a production-grade, engaging,
interactive STEM learning product. It is organized as **foundations → engine → moat →
hardening → sequenced execution**, not as a convenience-to-phase list. Read the
`Current status` block at the top of every session before trusting anything below.

---

## The one structural reframe

The product today is a collection of distinct, bespoke 3D labs (one viewer per subject)
mechanically circled around a learning engine that is almost entirely absent:
a single flat `localStorage` blob for learner state and a `content/` tree that the app
never reads. Two source-of-truth problems and zero retention loop.

> Fix `content/` being authoritative and make every lab a single generic engine, and
> everything else (missions, spaced review, filters, new subjects) collapses to cheap.
> Leave those broken and every new subject compounds bespoke code + drift.

---

## Part 1 — Three foundations

### F1. Content becomes the single source of truth — build FIRST
- `content/subjects/<subject>/<branch>/<component>/` is authoritative for everything the app
  renders. The app **compiles** content; it does not redefine it.
- Add a Zod schema (`app/lib/schema/content.ts`) covering `module.json`, `model-metadata.json`,
  `lesson.md`, `quiz.json`, `glossary.json`, `standards.json`, `simulation.ts`.
- Replace hand-written `src/data/*.ts` (cells/organs/physiology/molecules/functions/planets/
  stars/galaxies/motionLab) with **generated** code from the schema, via a codegen build step.
  Delete the duplicates — two sources of truth is the #1 root cause of silent drift.
- Remove or repoint the currently-unused `@content` alias in `vite.config.ts`.
- **Acceptance:** editing one content file + rebuild reflects everywhere; no copy exists in src/.

### F2. Learner substrate — single flat mastery → IndexedDB/Dexie schema
- Current: `useAppStore.ts` = one `localStorage` blob (`notebook[]`, `quizResults[]`,
  `mastery: Record<id,0-5>`, `timeSpentMinutes`) with no profile, no grade, no spaced-review.
- Replace with Dexie stores per spec §17: `profiles`, `skills`, `quests`, `quizAttempts`,
  `labAttempts`, `notebookEntries`, `savedConcepts`, `settings`, `streaks`, `backupHistory`.
- Full **additive mapping** (spec §8): old skill IDs → new IDs never lose/cap mastery.
- `SkillProgress` with `confidence`, `attempts`, `nextReviewAt`, `mistakeTags`.
- This is the prerequisite for every retention mechanic — build F2 before **any** mission/review.

### F3. Generic component engine — one shell, all labs
- Replace the bespoke `CellViewer / OrganViewer / StarViewer / GalaxyViewer / MoleculeViewer`
  with one `ComponentRenderer` selected by a `modelType` field
  (`procedural | glb | diagram | sim`), sharing the shell:
  `ContentNav`, `CanvasRail` (rotate/isolate/cross-section/compare/reset), `DetailPanel`,
  `BottomTray`, `CompareModal`, `LessonModal`, `QuizModal`.
- Hotspots/layers/compare-candidate all come from metadata (authored), not code.
- **Acceptance:** adding a new component = authoring content + choosing a modelType; ~zero new code.

---

## Part 2 — The Learning loop (engagement = the product)

| # | Feature | Builds on | Why |
|---|---|---|---|
| E1 | Onboarding (3-step, ~90s: grade → interests → mission) | F2 | Conversion gate; creates `LearnerProfile` |
| E2 | Predict-before-respond (surface `predictionPrompt` as first step of the model flow) | F3 | **The difference between browsing 3D and learning** — the core "see science move" unlock |
| E3 | Mission composer (`/app/quest`): prerequisites, due-review, low-mastery, school-unit | F1+F2 | The engagement engine, per spec §18 / §33 |
| E4 | Mastery + spaced review (Leitner 1/2/4/8/16 → `nextReviewAt`) + Mastery Challenge | F2 | Retention; feeds Parent zone |
| E5 | Notebook capture (offscreen → dataURL) + notebook as scrapbook | F2 | Learner-ownership |

---

## Part 3 — Content, the moat (the cost)

Each component is a full production unit: asset + hotspots + framing + lesson + quiz + glossary +
standards + compare + cross-section. There is no shortcut that preserves the Anatomy Atelier —
grade quality bar.

### C1. Component factory pipeline (make `component-builder.workflow.js` real)
Spec-source (from taxonomy, never invent) → author content (generic lesson/quiz/glossary/standards,
human-reviewed) → asset (GLB for anatomy/cells/molecules; procedural for physics/math/space) →
hotspot + camera framing → **quality gate** → commit. Each stage ships a validated artifact.

### C2. Quality gate (the differentiator) — enforce, don't rediscover
Anatomy Atelier bar: default camera, auto-rotate, hotspots→concept IDs, isolate/cross-
section/compare. Convert the QA persona into a checklist usable by agents + a fixture that
fails if hotspot markers overlap (lock the 22px bug out permanently).

### C3. Order + batch by bang-for-buck
First prove the full pipeline *on one biology component to zero-fault*, lock the standard,
*batch the cleanup* across live branches. Then fill thinnest live leaves + highest-lever
guidance branches. **Containment rule:** do NOT scale authoring before the per-component bar
is zero-complaint.

---

## Part 4 — Production hardening (gates, not "polish")

- **Tests:** unit on pure logic (mission builder, mastery updates, backup round-trip,
  codegen determinism, simulation math). E2E on the loop order. Visual on the shell.
- **Performance:** code-split routes/3D, lazy-load GLB, dispose resources on scene switch,
  adaptive pixel ratio, `reduced-motion` respected (spec §27). Today everything bundles.
- **A11y:** keyboard focus, 44px targets, ARIA on hotspots (parallel structure list), modal
  focus-trap + Escape, contrast AA (spec §26).
- **Licensing gate:** make the NC-RISK/provenance rule a CI gate so NC-risk assets cannot
  re-enter prod paths and the 9 organ models with unconfirmed provenance block paid release
  until cleared or replaced (spec §21).
- **Local telemetry** (@ spec §27) — structured local-events so you see mission drop-off /
  mastery rates without a backend.
- **PWA/offline** — shell + service worker; content ships in bundle.

---

## Part 5 — Execution order (dependency-sorted, with exit signals)

| # | Work | Builds on | Exit signal |
|---|---|---|---|
| 1 | **F1 — content-as-truth + codegen** | — | one content file compiles; no source-copy exists |
| 2 | **F3 — generic ComponentEngine** | F1 | all live components render through one shell |
| 3 | **F2 — Dexie learner substrate + migration** | — | profiles + skill rows exist; legacy blob imported |
| 4 | **E1+E2 — onboarding + predict-before-respond** | F1 | new user → mission in 90s; predicts before model runs |
| 5 | **E3+E4 — quests + spaced review** | F2 | `/app/quest` builds from mastery; Mastery Challenge |
| 6 | **Part 3 — factory pipeline on 1 biology component; then batch-clean live** | F1+F3 | authored-pending → live; flagship Biology |
| 7 | **Part 4 — tests, perf, a11y, license gate, PWA** | everything | CI red on NC-RISK; a11y + perf pass |

**Recommended first move after audits:** F1. It is the cheapest thing that makes everything else
cheaper and safer. Do not scale or author scaling proprietary before it lands.

---

## Parallelism rules for agents
- **Safe in parallel (disjoint files):** research + scaffolding into `docs/` and isolated
  `src/lib/` additions (F2 schema, qa-gate, schema, pipeline doc, perf/a11y audit).
- **Must be serialized:** anything that deletes/rewires `src/data/*` or the single viewer –
  the moment F1's codegen drops those files the app temporarily stops compiling; only one driver
  can land it.

**NORTH STAR (from spec):** a learner can say *"I finally understand it because I could see it
move, change it myself, and practice it until it made sense."*
