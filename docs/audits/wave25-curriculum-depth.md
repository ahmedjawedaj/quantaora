# Wave 25 — Curriculum Depth Audit (read-only, 2026-08-18)

Scope: every authored component under `content/subjects/**`, cross-referenced against
`content/taxonomy/*.json`, `quantaora-app/src/data/allContent.ts`, `hierarchy.ts`, and the
actual route/component code under `quantaora-app/src/routes/` and
`quantaora-app/src/components/explorer/`. All claims below are based on reading the current
code/content directly; where an older audit doc is referenced it is explicitly labeled "prior
audit claimed...".

## 0. Headline finding

**The app has two parallel, mostly non-overlapping content systems**, and the discrepancy is
large enough that it changes the answer to "how many components are actually interactive":

1. **Authored pipeline**: `content/subjects/<subject>/<branch>/<component>/` (module.json,
   lesson.md, quiz.json, model-metadata.json, glossary.json, standards.json) → codegen
   (`quantaora-app/scripts/codegen/generate.ts`) → `src/data/generated/*.ts` → wired into
   `BRANCH_COMPONENTS` (`src/data/branchModules.ts`) → rendered generically by
   `src/routes/BranchLab.tsx` at route `/app/labs/branch/:branchId`.
2. **Legacy hand-authored files**: `src/data/cells.ts`, `organs.ts`, `molecules.ts`,
   `crystals.ts`, `planets.ts`, `stars.ts`, `galaxies.ts`, `moons.ts`, `functions.ts`,
   `motionLab.ts` — TypeScript literals, not sourced from `content/subjects` at all, rendered by
   dedicated routes (`CellLab.tsx`, `Explore.tsx`, `ChemistryLab.tsx`, `SpaceLab.tsx`,
   `StarsLab.tsx`, `GalaxyLab.tsx`, `MoonsLab.tsx`, `MathLab.tsx`).

**`BranchLab.tsx` (the component that actually consumes the codegen'd `content/subjects` output
for 7 of the 22 live branches) has zero inbound links anywhere in the UI** — verified via
`grep -rn "labs/branch\|BranchLab" src/routes/Labs.tsx src/routes/Subjects.tsx
src/routes/AppShell.tsx` (no hits) and a repo-wide grep for `labs/branch` outside `App.tsx`
itself (no hits). `HIERARCHY` in `src/data/hierarchy.ts` gives every live branch its own
dedicated `route` (e.g. `cell-biology` → `/app/labs/cells`), never
`/app/labs/branch/cell-biology`. So for those 7 branches, the fully-authored
`content/subjects` files are **generated correctly but never reachable by a learner** — only
by hand-typing the URL.

## 1. Component-count reconciliation

`content/taxonomy/index.json` describes the hierarchy but carries no component count itself.
Walking `content/subjects/**` (one dir per component, verified by counting
`module.json`/`lesson.md`/`quiz.json`/`model-metadata.json` — 207 of each; `standards.json` and
`glossary.json` are present for 206/207, see §6.3) gives:

| Subject | Branches (dirs) | Component dirs |
|---|---|---|
| biology | cell-biology(21), ecology(11), genetics(10), human-anatomy(16), human-physiology(9), microbiology(5), plants(9) | 81 |
| chemistry | atoms-and-elements(9), chemical-reactions(7), molecules-and-bonding(6), periodic-table(10) | 32 |
| math | algebra(10), data-and-statistics(10), fractions-and-ratios(8), geometry(11), number-and-arithmetic(10) | 49 |
| physics | electricity(9), energy(6), mechanics(13) | 28 |
| space | earth-in-space(0), galaxies(2), solar-system(8), stars(7) | 17 |
| **Total** | | **207** |

This is the actual authored count — **not** ~190 as the spec's §6 estimate suggested, and **not**
the `componentCount` field in `src/data/hierarchy.ts`, which is stale documentation (e.g. it
says `cell-biology: componentCount: 8` but the directory has 21; `human-anatomy: 9` vs 16 dirs;
`algebra: 5` vs 10 dirs; `molecules-and-bonding: 4` vs 6 dirs — `componentCount` does not gate
anything at runtime, it is purely a display number and it is wrong for 4 branches).

Of these 207 authored components, **reachability in the running app splits three ways**:

### 1a. Fully live (generated pipeline, reachable) — 137 components
`human-physiology`(9) via `PhysiologyLab.tsx`, `genetics`(10) via `GeneticsLab.tsx`,
`ecology`(11) via `EcologyLab.tsx`, `plants`(9) via `PlantsLab.tsx`, `microbiology`(5) via
`MicrobiologyLab.tsx`, `atoms-and-elements`(9)+`periodic-table`(10) via `AtomsLab.tsx`,
`chemical-reactions`(7) via `ChemicalReactionsLab.tsx`, `number-and-arithmetic`(10) via
`NumberSenseLab.tsx`, `fractions-and-ratios`(8)+`geometry`(11)+`data-and-statistics`(10) via
`MathManipulativesLab.tsx`, `mechanics`(13) via `PhysicsLab.tsx`, `energy`(6) via
`EnergyLab.tsx`, `electricity`(9) via `ElectricityLab.tsx`. Confirmed via
`grep -n "^import.*from '@/data" src/routes/<Lab>.tsx` for each — every one of these imports
directly from `src/data/generated/<branch>.ts` with no filtering, so all authored components in
these 15 branches are 1:1 live.

### 1b. Authored but orphaned (generated correctly, unreachable) — 47 components
Reachable only through the dead `BranchLab.tsx` route; the branch's real, linked route renders a
**different, smaller, differently-ID'd** legacy dataset instead:

- **cell-biology**: 21 authored, only 8 live via `CellLab.tsx`'s `src/data/cells.ts`
  (`animal-cell`, `plant-cell`, `bacterial-cell`, `neuron`, `red-blood-cell`, `muscle-cell`,
  `sperm-cell`, `egg-cell`). **13 orphaned**: `cell-membrane`, `cell-wall`, `chloroplast`,
  `cytoplasm`, `cytoskeleton`, `dna`, `endoplasmic-reticulum`, `golgi-apparatus`, `lysosome`,
  `mitochondrion`, `nucleus`, `ribosome`, `vacuole` — each has a complete `module.json` +
  `lesson.md` + `quiz.json` + `model-metadata.json` in `content/subjects/biology/cell-biology/`
  but is only ever embedded as a same-named *hotspot* inside one of the 8 live cell types, never
  as its own explorable component with its own lesson/quiz.
- **human-anatomy**: 16 authored, only 9 live via `Explore.tsx`'s `src/data/organs.ts`
  (top-level ids confirmed via `grep -B2 "scientificName:" src/data/organs.ts`: `heart`,
  `brain`, `lungs`, `liver`, `kidneys`, `eyeball`, `intestine`, `pancreas`, `skin`). **7
  orphaned**: `blood-vessels`, `bones`, `ear`, `muscles`, `spleen`, `stomach`, and one of
  `{large-intestine, small-intestine}` (organs.ts collapses both into a single `intestine`).
- **molecules-and-bonding**: 6 authored (`compound`, `covalent-bond`, `ionic-bond`,
  `lewis-structure`, `molecule`, `valence-electron` — abstract bonding concepts), **0 live**.
  `ChemistryLab.tsx` instead renders `src/data/molecules.ts`'s 5 *named molecules* (`water`,
  `oxygen`, `carbon-dioxide`, `methane`, `sodium-chloride-lattice`) plus `src/data/crystals.ts`'s
  3 crystal lattices — a completely disjoint ID space from the taxonomy branch. **6 orphaned.**
- **algebra**: 10 authored (`coefficient`, `constant`, `equation`, `expression`, `inequality`,
  `intercept`, `like-terms`, `slope`, `term`, `variable`), **0 live**. `MathLab.tsx` instead
  renders `src/data/functions.ts`'s 5 real-world linear scenarios (`steady-savings`,
  `taxi-fare`, `tank-draining`, `balance-scale`, `candle-burning`) — none of the 10 algebra
  vocabulary terms have their own lesson/quiz in the shipped app. **10 orphaned.**
- **solar-system**: 8 authored (`distance-from-sun-timeline`, `gravity-comparison`,
  `orbit-simulator`, `planet-cards`, `planet-rotation-day-length`, `planet-size-comparison`,
  `solar-system-scale`, `surface-feature-hotspots` — these are *interactive-tool* names, not
  planet names), **0 live** by that ID space. `SpaceLab.tsx` instead renders `src/data/
  planets.ts`'s 11 actual planet bodies (`sun` … `pluto`, `ceres`). **8 orphaned** (the tool
  concepts authored in `content/subjects` were never built as those specific tools; SpaceLab's
  orbit speed slider, described in §3, functionally covers some of `orbit-simulator`'s intent but
  is not sourced from or credited to that authored file).
- **stars**: 7 authored (`black-hole`, `main-sequence-star`, `neutron-star`, `protostar`,
  `red-giant`, `supernova`, `white-dwarf`). `StarsLab.tsx` (`src/data/stars.ts`) live-renders
  `protostar`, `main-sequence-star`, `red-giant`, `white-dwarf` (4 match) plus 4 named supernova
  remnants (`crab-nebula`, `cassiopeia-a`, `cygnus-loop`, `g292`) that have no `content/subjects`
  backing at all. **3 orphaned**: `black-hole`, `neutron-star`, `supernova` — the generic
  concepts are not directly explorable; a neutron star / pulsar only appears as an embedded
  hotspot inside `crab-nebula`.
- **galaxies**: 2 authored (`andromeda`, `milky-way`), **both live** via `GalaxyLab.tsx`
  (`src/data/galaxies.ts`). 0 orphaned here, but GalaxyLab also live-renders 5 galaxies with
  zero `content/subjects` authoring: `whirlpool-galaxy`, `sombrero-galaxy`,
  `elliptical-galaxy`, `irregular-galaxy`, `globular-cluster` (see §1c).

### 1c. Live but unauthored (no content/subjects backing at all)
- `GalaxyLab.tsx`: 5 extra galaxies (listed above).
- `MoonsLab.tsx` (`src/data/moons.ts`): all 5 components (`moon`, `europa`, `io`, `titan`,
  `enceladus`) — there is no `content/subjects/space/moons/` directory; `moons` is a "live"
  branch in `hierarchy.ts` (`componentCount: 5`) with zero taxonomy/authoring-pipeline presence.
- `ChemistryLab.tsx`: the 5 molecules + 3 crystals (8 components) have no `content/subjects` id
  match (see §1b, molecules-and-bonding).
- `MathLab.tsx`: the 5 linear scenarios (see §1b, algebra).
- `PhysicsLab.tsx`: `motionLab` (`src/data/motionLab.ts`), a single flagship sandbox component,
  separate from the 13 `mechanics` components.

**Net:** of 207 authored `content/subjects` components, 137 (66%) are live and content-faithful,
47 (23%) are fully authored but orphaned (unreachable), and 23 (11%; stars partial + galaxies
full) are live via a route that partially or fully reuses the same IDs. Separately, ~27 live
components (moons ×5, extra galaxies ×5, molecules ×5, crystals ×3, scenarios ×5, motionLab ×1,
+ 4 stars-lab-only remnants ≈ 28) exist in the running app with **no** `content/subjects`
authoring file at all.

## 2. Interaction depth, by branch/route

The shared-component architecture means interaction affordances are **determined by route code,
uniformly, for every component in a branch** — verified by reading each route file and the
shared modal/panel components they all import. This is why depth is reported per branch rather
than restating identical mechanics 207 times; where a branch's mechanic differs per component
(e.g. Genetics' Punnett square only appearing for `inheritance-punnett-squares`), that is called
out explicitly.

**Universal, for every live component (all branches, evidence in §3–4):**
- **Observe**: yes — 3D/procedural viewer with drag-to-rotate, auto-rotate toggle
  (`CanvasControls.tsx`), zoom, and (where a GLB is registered) x-ray/labels toggles.
- **Explain**: yes — `DetailPanel.tsx` shows `whyItMatters`/`didYouKnow`/key facts always;
  `LessonModal.tsx` shows the parsed `lesson.md` step sequence plus `practiceItem` text on the
  last step.
- **Check**: yes — `QuizModal.tsx` is a real multi-question flow with per-question correctness
  feedback, a misconception callout on wrong answers, and an end-of-quiz answer-review screen
  (`src/components/explorer/QuizModal.tsx:56-65,229-249`). Confirmed wired via `grep -n
  "QuizModal" src/routes/*.tsx` in every one of the 19 live lab routes.
- **Predict**: partial/weak everywhere — `content.lesson.predictionPrompt` is *displayed* as
  read-only text (`MissionStep` in `BranchLab.tsx:315`, `LessonModal.tsx:127-139` "Predict
  first" callout). No route captures a learner's guess before revealing the answer; it is a
  prompt shown alongside the answer, not a gated predict-then-reveal interaction. This is true
  for all 19 live routes — none differ here.
- **Hotspot tap → visual state change**: yes, for every live component with authored hotspots
  (all 207, confirmed 0 components have an empty hotspots array —
  `python3` scan of all 207 `model-metadata.json`, zero-hotspot count = 0). Tapping a hotspot
  sets `activeHotspotId`, which `GenericModel.tsx` passes into `CompositionBody`/`ProceduralBody`
  as `active` (`src/components/explorer/GenericModel.tsx:364-385`) and drives an opacity/isolate
  state change (`GenericModel.tsx:203,230,297-301`) even for components with no real GLB (i.e.
  procedural-only fallback shapes still visibly react).

**Branch-specific "Change" — real, live-parameter simulation vs. hotspot/switch-only:**

| Branch (route) | Real slider/control-driven Change? | Evidence |
|---|---|---|
| electricity (`ElectricityLab.tsx`) | **Yes** — voltage (1.5–12V) and resistance (2–20Ω) sliders recompute the circuit | `ElectricityLab.tsx:1200,1207` |
| solar-system (`SpaceLab.tsx`) | **Yes** — orbit speed slider (`useState(6)`) plus 2 more range inputs | `SpaceLab.tsx:140,495-532` |
| mechanics (`PhysicsLab.tsx`) | **Yes** — motion-track control | `PhysicsLab.tsx:1032` |
| energy (`EnergyLab.tsx`) | **Yes** — 2 range controls | `EnergyLab.tsx:604,822` |
| plants (`PlantsLab.tsx`) | **Yes** — light-intensity slider (0–100) plus others | `PlantsLab.tsx:1609,2272` |
| microbiology (`MicrobiologyLab.tsx`) | **Yes** — moisture/food/antibiotic-use/fiber-intake sliders (4 controls) driving a population/growth simulation | `MicrobiologyLab.tsx:1856,1865,1875,1881` |
| ecology (`EcologyLab.tsx`) | **Yes** — 4 control hits | grep count 4 |
| genetics (`GeneticsLab.tsx`) | **Yes**, but only for one component — a mutation-index slider (0–11) and a dedicated Punnett-square grid scene that renders only when `activeId === 'inheritance-punnett-squares'` | `GeneticsLab.tsx:1938,1205` |
| math (algebra scenarios, `MathLab.tsx`) | **Yes** — 4 range inputs | `MathLab.tsx:472,484,496,558` |
| math-manipulatives (`MathManipulativesLab.tsx`) | **Yes** — 3 control hits | grep count 3 |
| number-sense (`NumberSenseLab.tsx`) | **Yes** — 3 control hits | grep count 3 |
| atoms/periodic-table (`AtomsLab.tsx`) | **Yes** — 3 control hits | grep count 3 |
| chemical-reactions (`ChemicalReactionsLab.tsx`) | **Yes** — 3 control hits | grep count 3 |
| physiology (`PhysiologyLab.tsx`) | **Yes** — 3 control hits | grep count 3 |
| galaxies (`GalaxyLab.tsx`) | **Yes** — 2 range inputs | `GalaxyLab.tsx:265,282` |
| moons (`MoonsLab.tsx`) | **Yes**, minimal — 1 range input | `MoonsLab.tsx:486` |
| **molecules-and-bonding (`ChemistryLab.tsx`)** | **No** — 0 range/slider hits | grep count 0 |
| **stars (`StarsLab.tsx`)** | **No** — 0 range/slider hits | grep count 0 |
| **cell-biology (`CellLab.tsx`)** | **No** — 0 range/slider hits | grep count 0 |
| **human-anatomy (`Explore.tsx`)** | **No** — 0 range/slider hits | grep count 0 |

For the 4 branches with no live-parameter control, "Change" is limited to switching between
sibling components in the list and tapping hotspots to isolate/highlight parts — a real visual
state change (per the hotspot mechanism above), but not a simulation a learner can tune. None of
these 4 branches are strictly **text-only** (the 3D/procedural render does visibly react to
hotspot selection and component switching in all four), but they are the shallowest tier of
"Change" in the app. **No component in the audited set was found to be interaction-that-only-
changes-displayed-copy-with-zero-visual-reaction** — every authored component has ≥1 hotspot and
a `visual`/`url`, and `GenericModel.tsx`'s hotspot-active wiring is unconditional.

## 3. Lesson/quiz content quality (sampled, not stub content)

- `lesson.md` files are substantive prose, not stubs: sampled word counts —
  `content/subjects/space/solar-system/orbit-simulator/lesson.md` (475 words),
  `content/subjects/biology/cell-biology/mitochondrion/lesson.md` (426 words),
  `content/subjects/chemistry/molecules-and-bonding/lewis-structure/lesson.md` (439 words).
  Parsed into `lesson.steps`/`predictionPrompt`/`practiceItem`/`checkpoint` by
  `scripts/codegen/generate.ts:parseLesson()` (`quantaora-app/scripts/codegen/generate.ts:69-114`).
- `quiz.json` question counts sampled: `mechanics/acceleration` = 5,
  `human-anatomy/heart` = 5, `solar-system/orbit-simulator` = 5, `algebra/slope` = 5,
  `atoms-and-elements/atom` = 4. Every quiz question carries `prompt`, `options`,
  `correctIndex`, `explanation`, and `misconception` (`src/data/types.ts:22-28`), all of which
  are surfaced in `QuizModal.tsx` (not just stored and unused).
- 206/207 components have `standards.json`; missing:
  `content/subjects/physics/electricity/parallel-circuit/` (no `standards.json`).
  206/207 have `glossary.json`; missing:
  `content/subjects/math/data-and-statistics/range/` (no `glossary.json`).

This is uniform for every branch — orphaned components (§1b) have the *same* real lesson/quiz
content authored, it is simply not reachable in the shipped app.

## 4. Save/progress persistence (uniform across every live component)

Persistence is backed by Zustand `persist` middleware over `src/lib/storage/localStorageAdapter.ts`,
key `quantaora-local-progress` (`src/store/useAppStore.ts:139,251-252`). Confirmed code paths:

- **Quiz completion** → `QuizModal.tsx:69` calls `recordQuizResult(content.id, score,
  content.quiz.length)` → `useAppStore.ts:173-181` appends to `quizResults[]` and updates
  `mastery[componentId]` (0–5 scale). UI shows a "Result saved to this device" badge
  (`QuizModal.tsx:89-95`).
- **Lesson completion** → `LessonModal.tsx:29-39` (`fireCompletion`) calls
  `markLabCompleted({labId: content.id, ...})` on reaching the final step or starting the
  checkpoint → `useAppStore.ts:183-201` updates `completedLabs[labId]` with
  `timesCompleted`/`firstCompletedAt`/`lastCompletedAt`. Explicitly guarded against firing on
  modal-open/dismiss (`hasFiredCompletion` ref) so peeking doesn't fake-credit a learner.
- **Save to Notebook** → `DetailPanel.tsx:27-41` "Save" button calls `saveToNotebook({conceptId,
  conceptName, subject, title, body})` → `useAppStore.ts:164-170` prepends a `NotebookEntry`;
  rendered back out by `src/routes/Notebook.tsx`.
- **Experiment snapshots** → `SaveExperimentButton.tsx` calls `saveExperimentSnapshot`, which
  de-dupes identical/rapid saves (`useAppStore.ts:224-240`, 1500ms + content-hash guard).

All four persistence paths are shared components used identically across all 19 live lab routes
— there is no branch where quiz/lesson/notebook saving is missing or behaves differently.
**No persistence exists for the 47 orphaned components** (§1b) simply because they are never
rendered, so no interaction can occur to trigger a save.

## 5. Text-only vs. visual-outcome — the central distinction

**Finding: no live, reachable component in this app is "text-only" in the strict sense of
"interaction only swaps displayed copy with zero visual/model reaction."** Every one of the ~190
live components (137 generated-pipeline + ~53 legacy: cells 8, organs 9, molecules 5, crystals 3,
planets 11, stars 8, galaxies 7, moons 5, scenarios 5, motionLab 1) has authored hotspots and a
`visual`/model, and `GenericModel.tsx`'s hotspot-active wiring unconditionally drives a visible
opacity/isolate state change on tap (`GenericModel.tsx:203,230,297-301,364-385`), even when
falling back to a procedural placeholder shape (no real GLB registered —
`src/data/modelRegistry.ts:853-876` returns `status:'missing'` for any `content.model` not in
`MODEL_ASSETS`, and `GenericModel` still renders and animates `CompositionBody`/`ProceduralBody`
in that case).

The real, defensible distinction found in the code is a **three-tier gradient of visual-outcome
richness**, not a binary text/visual split:

1. **Live-simulation tier** (15 of 19 live branches, listed in §2's table) — a slider/control
   changes a value that visibly redraws or recomputes the model (circuit current, orbit speed,
   plant light response, population growth, Punnett-square outcome, etc.).
2. **Hotspot-isolate-only tier** (4 branches: `molecules-and-bonding`/`ChemistryLab`,
   `stars`/`StarsLab`, `cell-biology`/`CellLab`, `human-anatomy`/`Explore`) — no learner-tunable
   variable; "Change" means switching to a sibling component or tapping a hotspot to
   isolate/highlight a part. Visual, but the weakest tier — closest to what the audit brief calls
   out as a risk, though not actually text-only.
3. **Unreachable tier** (47 orphaned components, §1b) — full lesson/quiz content authored, zero
   interaction possible because the route never surfaces them.

No component was found where the *model itself never changes but a text panel does* — the
architecture doesn't structurally allow that combination (hotspot-active state always reaches the
3D layer). If a stricter definition of "text-only" is intended by "only change displayed
text/copy" — i.e., excluding the ambient dim/highlight hotspot reaction as a qualifying "visual
outcome" — then the tier-2 branches above (comprising the 8 cell-biology components in
`cells.ts`, 9 human-anatomy components in `organs.ts`, 5 molecules + 3 crystals in
`molecules.ts`/`crystals.ts`, and 8 stars in `stars.ts` — **33 live components**) are the ones to
flag, since their only content-driven state change on interaction is which hotspot/part is
isolated and which sibling model is loaded, not a manipulable simulation variable.

## 6. Summary table

| Metric | Count |
|---|---|
| Total authored components (`content/subjects/**` dirs, verified) | **207** |
| — Fully live, generated-pipeline-faithful (§1a) | 137 |
| — Authored but orphaned / unreachable (§1b) | 47 |
| — Authored, partially live via ID overlap (stars 4/7, galaxies 2/2) | 23 |
| Live components with no `content/subjects` authoring at all (§1c) | ~28 (moons 5, extra galaxies 5, molecules 5, crystals 3, scenarios 5, motionLab 1, extra star remnants 4) |
| Components with Observe (rotate + hotspot tap) | 207/207 authored; ~190 actually live |
| Components with Predict (text shown, not gated) | same as Observe — universal but weak everywhere |
| Components with real Change (live slider/control) | 15 of 19 live branches (see §2 table); 4 branches hotspot/switch-only |
| Components with Explain (DetailPanel + LessonModal text) | 207/207 authored; ~190 live |
| Components with Check (real quiz, correctness + misconception feedback) | 207/207 authored; ~190 live |
| Components with real `lesson.md` (non-stub, sampled 300–500 words) | 207/207 (sampled, consistent quality) |
| Components with real `quiz.json` (avg ~4.8 questions/quiz, sampled 4–5) | 207/207; 206/207 have `standards.json`, 206/207 have `glossary.json` |
| Components with save/progress persistence wired | all ~190 live components (quiz result, lesson completion, notebook save, experiment snapshot — shared store); 0 of the 47 orphaned components (never rendered) |
| Components that are strictly text-only-on-interaction (no model/visual reaction at all) | **0** |
| Components whose only visual reaction is hotspot-isolate/switch-model (no tunable simulation) | **33 live components** — cells.ts (8: animal-cell, plant-cell, bacterial-cell, neuron, red-blood-cell, muscle-cell, sperm-cell, egg-cell), organs.ts (9: heart, brain, lungs, liver, kidneys, eyeball, intestine, pancreas, skin), molecules.ts (5: water, oxygen, carbon-dioxide, methane, sodium-chloride-lattice) + crystals.ts (3: crystal-diamond, crystal-silicon-carbide, crystal-graphite), stars.ts (8: protostar, main-sequence-star, red-giant, white-dwarf, crab-nebula, cassiopeia-a, cygnus-loop, g292) |
