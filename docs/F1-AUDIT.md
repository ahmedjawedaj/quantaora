# F1 — Content-as-Truth Audit & Zod Schema Design

Status: **Design / No code changed.** Research + design for making `content/` the single source of
truth and generating `quantaora-app/src/data/*.ts` from it. No app source and no authored content were
modified. One new file produced (this report).

Canonical refs: `docs/PRODUCTION-PLAN.md` §F1, `docs/quantaora-product-tech-spec.md` §6, §16, §21,
§23. Data model read across `quantaora-app/src/data/*.ts`.

---

## (a) Authored content inventory — 27 components, all Biology

Every component folder carries the same six files (`module.json`, `lesson.md`, `quiz.json`,
`model-metadata.json`, `glossary.json`, `standards.json`) — 27 × 6 = **162 files**. No `simulation.ts`
exists in any folder yet (spec §23 lists it; none present).

| Branch | Components (dirs) | Count |
|---|---|---|
| cell-biology | animal-cell, bacterial-cell, egg-cell, muscle-cell, neuron, plant-cell, red-blood-cell, sperm-cell | 8 |
| genetics | allele, chromosome, dna, dna-replication, gene, inheritance-punnett-squares, mutation, protein, trait, transcription-translation | 10 |
| human-physiology | blood-circulation, breathing, digestion, hormone-signaling, immune-response, kidney-filtration, muscle-contraction, nerve-signaling, temperature-regulation | 9 |
| **Total** | | **27** |

### Per-file survey results (full sweep over all 27)

| File | Status |
|---|---|
| `module.json` | PRESENT in all 27, but **shape is inconsistent across 3 variants** (below). |
| `lesson.md` | 27/27; two different section formats (cell-biology vs genetics/physiology); all encode the 8-step learning flow + predict/practice/checkpoint. |
| `quiz.json` | 27/27, consistent `{ componentId, questions:[{prompt,options,correctIndex,explanation,misconception}] }`. 130 questions. |
| `glossary.json` | 27/27, consistent `{ componentId, terms:[{term,definition,conceptId?}] }`. |
| `model-metadata.json` | 27/27, rich (layers, materialBudget, assetBrief, cameraDefault…). 137 hotspots total. |
| `standards.json` | 27/27, but **all 27 have empty `standards:[]`** ("pending-sourcing"). No alignment data to generate. |

### The three `module.json` variants (critical finding)

1. **Rich / spec-shaped** (most of 27; all genetics, all human-physiology, most cell-biology):
   `id, subject, title, summary, gradeMin, gradeMax, skillIds, type, estimatedMinutes, hierarchyPath,
   crossReferences, belongsTo, compareCandidate{label,description}, parts, processes,
   plainLanguageExplanation, keyFacts[{label,value}], whyItMatters, files`. These carry the pedagogic
   core: keyFacts, summary, hierarchy path, compare pairing.
2. **Sparse** (3 of 27): only `animal-cell`, `bacterial-cell`, `plant-cell` — carry
   `id, subject, title, summary, gradeMin, gradeMax, skillIds, type, estimatedMinutes` and **no
   keyFacts, no whyItMatters, no hierarchy, no compare, no `files`**. For these, the pedagogic tail
   (key facts, why-it-matters, belongs-to, compare candidate, 8-step flow, predict/practice/check)
   lives **only in `lesson.md`**.
3. **App-shaped hybrids** (`red-blood-cell`, `trait`, `immune-response`, reaching into the others'):
   add top-level keys mirroring the app verbatim — `name, scientificName, branch, system, tagline,
   model, didYouKnow, conditions, compareCandidateId, compareReason,
   lesson{steps,predictionPrompt,practiceItem,checkpoint}`. These were authored to match
   `ComponentContent` exactly.

Net: the set is **rich and nearly complete for the pedagogic fields**, but (a) three cell components
are sparse, (b) `didYouKnow`/`conditions`/`name`/`scientificName`/`tagline`/`compareReason` are only
reliably authored on 2–5 of 27, and (c) the **procedural render parameters** (cell organelles,
molecule atoms/bonds, star/galaxy/planet physics) are **absent from every content file**.

---

## (b) Current app data types (`quantaora-app/src/data/types.ts`)

```ts
export type SubjectId = 'physics' | 'chemistry' | 'math' | 'biology' | 'space'

export interface KeyFact { label: string; value: string }
export interface Hotspot {
  id: string; label: string; position: [number, number, number]
  color: string; description: string; function: string
}
export interface QuizQuestion {
  prompt: string; options: string[]; correctIndex: number
  explanation: string; misconception: string
}
export interface LessonStep { title: string; body: string }
export interface ComponentContent {
  id: string; name: string; scientificName: string
  subject: SubjectId; branch: string; system: string; model: string
  tagline: string; summary: string
  keyFacts: KeyFact[]
  whyItMatters: string; didYouKnow: string
  belongsTo: string[]; conditions: string[]
  hotspots: Hotspot[]
  lesson: { steps: LessonStep[]; predictionPrompt: string; practiceItem: string; checkpoint: string }
  quiz: QuizQuestion[]
  compareCandidate: string; compareReason: string
}
```

### Schema sketches in the spec vs. what shipped

- §23 `LearningModule` is `id, subject, title, summary, gradeMin, gradeMax, skillIds, type,
  estimatedMinutes` — **exactly the sparse variant**; `module.json` has grown well beyond it.
- §21 `ModelAsset`/`Hotspot` = `{id,label,position,conceptId,description}` — **no `color`/`function`**,
  but the shipped app `Hotspot` requires both.
- §23 lists the 7-file authoring set including `simulation.ts` (not present on disk) and `lesson.md`.

**Take-away:** the spec schemas were the *starting sketch*; the shipped app (`types.ts`) is the
de-facto contract, and several shipped fields are not even described in the spec's sketches. **The
shipped app types, not the spec, are what codegen must satisfy.**

---

## (c) Proposed Zod schema shape (`app/lib/schema/content.ts`)

Three sub-schemas: the **raw file** schemas (what content holds), a **normalizer** (rich + sparse +
lesson.md merge → a coherent core), and the **component** schema (superset covering every app field).
Codegen: read `content/subjects/**` → validate → normalize → emit `src/data/*.ts`.

```ts
// ── Raw authoring file schemas ───────────────────────────────────────────────
const zVec3 = z.tuple([z.number(), z.number(), z.number()])

const ModuleFile = z.object({
  id: z.string(), subject: z.enum(['physics','chemistry','math','biology','space']),
  title: z.string(), summary: z.string(), gradeMin: z.number(), gradeMax: z.number(),
  skillIds: z.array(z.string()), type: z.enum(['component','model','process']).optional(),
  estimatedMinutes: z.number().optional(),
  hierarchyPath: z.object({ subject: z.string(), branch: z.string(),
    systemOrGroup: z.string().optional() }).optional(),
  belongsTo: z.string().or(z.array(z.string())).optional(),
  parts: z.array(z.string()).optional(), processes: z.array(z.string()).optional(),
  plainLanguageExplanation: z.string().optional(),
  keyFacts: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  whyItMatters: z.string().optional(),
  compareCandidate: z.union([z.string(), z.object({ label: z.string(),
    description: z.string() })]).optional(),
  compareCandidateId: z.string().optional(), compareReason: z.string().optional(),
  // app-shaped-only keys (few modules today):
  name: z.string().optional(), scientificName: z.string().optional(), branch: z.string().optional(),
  system: z.string().optional(), tagline: z.string().optional(), model: z.string().optional(),
  didYouKnow: z.string().optional(), conditions: z.array(z.string()).optional(),
  lesson: z.object({ steps: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
    predictionPrompt: z.string().optional(), practiceItem: z.string().optional(),
    checkpoint: z.string().optional() }).optional(),
}).passthrough()

const ModelMetadataFile = z.object({
  componentId: z.string(),
  modelType: z.enum(['glb','glb-authored','procedural','procedural-three','diagram','sim']).optional(),
  url: z.string().optional(), thumbnailUrl: z.string().optional(),
  // note: on-disk field appears as BOTH `defaultCamera` and `cameraDefault`
  hotspots: z.array(z.object({ id: z.string(), label: z.string(), conceptId: z.string().optional(),
    position: zVec3, description: z.string().optional(), color: z.string().optional(),
    function: z.string().optional(), positionHint: z.string().optional(),
    structureCard: z.any().optional() })).optional(),
  layers: z.any().optional(),
}).passthrough() // thumbnails, materialBudget, visualStyleNotes, assetBrief preserved verbatim

const QuizFile = z.object({ componentId: z.string(),
  questions: z.array(z.object({ prompt: z.string(), options: z.array(z.string()),
    correctIndex: z.number(), explanation: z.string(), misconception: z.string() })) })

const GlossaryFile = z.object({ componentId: z.string(),
  terms: z.array(z.object({ term: z.string(), definition: z.string(),
    conceptId: z.string().optional() })) })

const StandardsFile = z.object({ componentId: z.string(),
  status: z.enum(['pending-sourcing','sourced']).default('pending-sourcing'),
  standards: z.array(z.any()).default([]) })   // all 27 currently empty

// ── normalized, app-facing (generated) ───────────────────────────────────────
const KeyFactSchema = z.object({ label: z.string(), value: z.string() })

const ComponentContentSchema = z.object({
  id: z.string(), name: z.string(), scientificName: z.string(),
  subject: SubjectIdSchema, branch: z.string(), system: z.string(), model: z.string(),
  tagline: z.string(), summary: z.string(),
  keyFacts: z.array(KeyFactSchema),
  whyItMatters: z.string().default(''), didYouKnow: z.string().default(''),
  belongsTo: z.array(z.string()), conditions: z.array(z.string()).default([]),
  hotspots: z.array(z.object({
    id: z.string(), label: z.string(), position: zVec3,
    color: z.string().default(APP_DEFAULT_HOTSPOT), description: z.string(),
    function: z.string().default(''),
  })),
  lesson: z.object({ steps: z.array(z.object({ title: z.string(), body: z.string() })).default(FLOW_STEPS),
    predictionPrompt: z.string().default(''), practiceItem: z.string().default(''),
    checkpoint: z.string().default('') }),
  quiz: z.array(z.object({ prompt: z.string(), options: z.array(z.string()),
    correctIndex: z.number(), explanation: z.string(), misconception: z.string() })),
  compareCandidate: z.string().default(''), compareReason: z.string().default(''),
})
```

**normalizer contract:** codegen must (1) accept **both** the rich and sparse `module.json` variants +
the app-shaped extra keys; (2) **parse `lesson.md`** for the 8-step flow + predict/practice/checkpoint
(`## 1. See it`…, plus `### Prediction prompt` / `### Practice item` / `### Checkpoint` on cell-biology,
or `**Predict:**` / `**Practice item:**` / `**Checkpoint:**` inline on genetics/physiology); (3) hydrate
`Hotspot.color`/`hotspot.function` (currently not cleanly authored — see §4); (4) hydrate
`name`/`scientificName`/`tagline`/`didYouKnow` from the app-shaped modules where present, else from
defaults/lesson text.

---

## (d) Field-by-field gap table (app field → content location → MISSING)

Legend: ✓ present/derivable · ◔ partial (only some modules, or pattern-parseable but not a discrete
field) · ✗ MISSING entirely from content (today injected only from `src/data/*.ts`).

| App field (`types.ts`) | Content location | Verdict |
|---|---|---|
| `id` | `module.json.id` (all 27) | ✓ |
| `name` | `module.json.title` (or `name` app-shaped) | ✓ (title→name map) |
| `scientificName` | app-shaped only (2/27) | ✗ (needs authoring on ~25) |
| `subject` | `module.json.subject` | ✓ |
| `branch` | `hierarchyPath.branch` / `belongsTo` / `branch` | ✓ derivable |
| `system` | `hierarchyPath.systemOrGroup` / `system` | ◐ (root-hierarchy key on most) |
| `model` | `model-metadata.json.url` + `modelType` (procedural→'') | ◐ |
| `tagline` | app-shaped only (3/27) | ✗ |
| `summary` | `module.json.summary` | ✓ |
| `keyFacts` | `module.json.keyFacts` (24) + `lesson.md` "Key facts" table (3 sparse) | ✓ (merge) |
| `whyItMatters` | `module.json` (24) + `lesson.md` "Why it matters" (3 sparse) | ✓ (merge) |
| `didYouKnow` | no consistent home; app-shaped only (2/27) | ✗ **MISSING** for most |
| `belongsTo` (string[]) | `module.json.belongsTo` (string) / `belongsToPath` / hierarchy | ✓ derivable |
| `conditions` | app-shaped only | ✗ **MISSING** for most |
| `hotspots[].id,label,position,description` | `model-metadata.json` (137) | ✓ |
| `hotspots[].color` | not authored (9/137 coloured) | ✗ **MISSING** |
| `hotspots[].function` | `structureCard.whyItMatters`/`description` on most; literal `function` only 31/137 | ◐ derivable |
| `lesson.steps` (8) | `lesson.md` (§learning-flow) / app `lesson.steps` | ✓ parseable |
| `lesson.predictionPrompt` | `lesson.md` ("Prediction prompt"/"Predict:") / app `lesson.predictionPrompt` | ✓ parseable |
| `lesson.practiceItem` | `lesson.md` ("Practice item") / app-shaped | ✓ parseable |
| `lesson.checkpoint` | `lesson.md` ("Checkpoint") / app-shaped | ✓ parseable |
| `quiz[].*` (all 5 subfields) | `quiz.json` | ✓ (130/130) |
| `compareCandidate` (string id) | `compareCandidateId` (app-shaped) else `compareCandidate` object | ◐ type mismatch (object≠id on most) |
| `compareReason` | app `compareReason` (3/27) else `compareCandidate.description` | ◐ derivable |

`standards.json`: app has no consumer today; all 27 are empty (`pending-sourcing`) — not an F1
blocker, but a future content task.

---

## (e) `src/data/*.ts` to replace (and their exports)

| File | Exports | F1 fate |
|---|---|---|
| `types.ts` | `SubjectId`, `KeyFact`, `Hotspot`, `QuizQuestion`, `LessonStep`, `ComponentContent` | Generate from the normalized schema (or keep as the source TS decl — see plan). |
| `cells.ts` | `Organelle`, `OrganelleShape`, `Cell (extends ComponentContent)`, `cells`, `cellById` | Replace. `organelle[]` procedural geometry is **NOT in content** (see §(f)). |
| `organs.ts` | `organs`, component objects | Replace — but eight Human Anatomy organs have **no authored content folder at all**, so replace only when authored. |
| `physiologyProcesses.ts` | `physiologyProcesses`, `physiologyProcessById` | **Closest to content.** Replace with generated from the 9 physiology modules. |
| `molecules.ts` | `Atom`, `Bond`, `Molecule`, `ELEMENT_COLOR`, `ELEMENT_RADIUS`, `molecules`, `moleculeById` | Chemistry never authored → not replaceable today; needs its own `scene` config. |
| `functions.ts` | `LinearScenario`, `scenarios`, `scenarioById` | Math never authored → not replaceable today. |
| `planets.ts` | `PlanetBody`, `planets`, `planetById` | Space never authored → not replaceable |
| `stars.ts` | `StarBody`, `stars`, `starById` | Space never authored → not replaceable |
| `galaxies.ts` | `Galaxy`, `GalaxyCompanion`, `GalaxyType`, `galaxies`, `galaxyById` | Space never authored → not replaceable |
| `motionLab.ts` | `motionLab: ComponentContent` | Physics `motion-lab` never authored → not replaceable |
| `allContent.ts` | `ALL_CONTENT`, `resolveContent(id)`, the `*ById` maps | Replace with content-driven index + lookup |
| (`hierarchy.ts`) | `HIERARCHY`, `GRADE_MIN/MAX`, `GRADE_BANDS`, `liveBranches()` | **Not a content file** — derived from `content/taxonomy/*.json` (spec §6); keep taxonomy as source; generate if needed. Not a candidate to delete. |

**Net:** `allContent.ts` + `types.ts` + (with care) `physiologyProcesses.ts` are the only files that can
be generated today from content that exists. The other eight (`cells, organs, molecules, functions,
planets, stars, galaxies, motionLab`) either lack authored content entirely (chemistry/math/physics/
space + Human Anatomy) or, for `cells`, are missing the procedural geometry file.

---

## (f) Assessment & vocabulary-sufficiency answer

### Can the authoring file set produce every `ComponentContent` field today?

**No — close for the pedagogic layer, but not complete.** The set already holds the lesson flow, quiz
(all five subfields), summary, keyFacts, whyItMatters, hierarchy/belongs, hotspot anchors, and the
predict/practice/checkpoint. With a normalizer that (1) parses `lesson.md`, (2) merges
`keyFacts`/`whyItMatters` from `lesson.md` for the 3 sparse cell modules, (3) derives
`compareCandidate`/`compareReason` from `module.json.compareCandidate`, and (4) derives
`hotspot.function` from `structureCard.whyItMatters`/`description` — codegen could materialize
`ComponentContent` for roughly **20–24 of the 27** biology components.

### The irreducible blockers (fields with no authored source, derived today only in `src/data`)

- `hotspots[].color` — **no field authored** (9/137). Required by the app `Hotspot`.
- `didYouKnow`, `conditions`, `scientificName`, `tagline` — authored on only a handful (~2–5 of 27);
  **MISSING for most**.
- **Procedural render parameters** — cell `organelles[]` (shape/position/scale/color), molecule
  `atoms`/`bonds`, planet `texture`/physics, star/`StarBody` physics, galaxy generator params. There is
  **no home for these in any content file**; `model-metadata.json` only carries `layers`, `visualStyle`,
  `materialBudget`, `assetBrief` — not geometry/primitives. This is the biggest gap.
- `compareCandidate` as a **string id** vs authored object — needs standardizing.
- `standards.json` alignment — empty everywhere.

### Conclusion for F1

**F1 can proceed as the infrastructure + one content-driven target today, but "no copy in `src/`"
is NOT yet obtainable for all live components without extending authored content.**

Recommended layered path:

1. **Layer A — now, no content change:** Zod schema + codegen pipeline + blank generated `allContent`
   index. Generate **physiology processes** end-to-end (the only branch whose content is complete and
   consistent); that is the safe first production target.
2. **Layer B — small content extension, unlocks cells:** before cell-biology can be codegen'd:
   - add `color` to each `model-metadata.json` hotspot (or an indexed hotspot-palette default that
     codegen splices onto colour-less hotspots);
   - add `didYouKnow`/`conditions`/`scientificName`/`tagline` where missing (they already exist on
     app-shaped modules like `red-blood-cell` as reference);
   - give the cell **procedural `organelle[]`** a home — either a new `scene-*`/`render.json` in the
     component folder or a conventional addition to `model-metadata.json` — because cells render
     procedurally and that data currently lives only in `cells.ts`.
   - extend the **sparse** `animal-cell/bacterial-cell/plant-cell` `module.json` to the rich variant.
3. **Layer C — author, don't codegen:** chemistry/math/physics/space and Human Anatomy organs have
   **no authored folders**, so `molecules/functions/planets/stars/galaxies/motionLab/organs` cannot be
   generated until their content is authored. Keep them hand-written for F1 and emit only from content
   that exists; delete a `src/data` file only when its content lands (the PRODUCTION plan already warns
   the app stop compiling if a still-needed file is dropped).

**Bottom line:** the F1 *pipeline* is fully unblockable now; the F1 *acceptance ("one content file
compiles; no source-copy exists")* is reachable today **only for the Human Physiology branch**, blocked
for Cell Biology by the missing procedural geometry + hotspot colour + sparse modules, and blocked for
four subjects + Human Anatomy by **absent content altogether**.

**Recommended content changes before "codegen-complete" (ranked):**
1. `color` on every `model-metadata` hotspot (or hotspot-palette fallback). — unblocks UI.
2. Add the cell `organelle[]` procedural records to a content file. — unblocks cells copy.
3. Reconcile sparse `animal-cell`/`bacterial-cell`/`plant-cell` `module.json` to the rich variant.
4. Standardize `lesson.md` parsing markers (or add a structured `lesson{}` block to `module.json`).
5. Audit the empty `standards.json` (curriculum-sourcing task, later than F1).

---

## Appendix — field-name & source-of-truth note-spots for the F1 implementer

- `model-metadata.json` inconsistency: the on-disk field is `defaultCamera` in some files and
  `cameraDefault` in others — schema must accept both.
- `layers` is a `string[]` in some files and an `array` of `{id,label,submesh,defaultVisible}` in
  others — union both.
- `branch` label drift: app's `branch` names (e.g. "Cell Biology"/"Human Anatomy") vs
  `module.json.hierarchyPath.branch`; normalizer must map consistently.
- `physiologyProcesses.ts` is already a near-verbatim transcription of the physiology content files
  (per its own header comment) — the proof the codegen path works for that branch.
- `vite.config.ts` alias `@content` currently points into `../content` (unused by `src` today);
  PRODUCTION-PLAN §F1 wants it removed/repointed once codegen is live.