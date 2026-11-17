# Quantaora — Content Factory & Authoring Pipeline

**Purpose:** the one place that defines how a component is authored, gated, and committed at the
Anatomy-Atelier quality bar. Grounds the currently-never-run
`scripts/workflows/component-builder.workflow.js` and makes the whole pipeline agent-usable.

**Companion docs:** [PRODUCTION-PLAN.md](PRODUCTION-PLAN.md) §C (this doc operationalizes C1–C3),
[PROJECT-STATUS.md](PROJECT-STATUS.md) (what's written / wired / planned),
[ASSET-LICENSES.md](ASSET-LICENSES.md) (cleared asset sources + traps).

**Status:** design spec. Update PROJECT-STATUS.md the moment any stage here ships for real.

---

## 0. Why a factory, in one paragraph

Each component is a **full production unit** (spec §6, §21, §23): asset + hotspots + default
camera + lesson + quiz + glossary + standards + compare + cross-section. There is no shortcut that
preserves the quality bar. The factory exists to make the cost *predictable and repeatable*: a
fixed sequence of stages, each with explicit inputs, outputs, ownership, and a **reject** branch,
so an agent — or any agent-like producer — can be told "run component X through the pipeline" and
the standard is uniform, not rediscovered per component. The taxonomy is the only upstream fact
source; facts are never invented.

---

## 1. The pipeline — 7 stages

Closed loop: **source → author → asset → frame → gate → commit**. Stage 6 (quality gate) is the
adversarial checkpoint that can bounce work back to earlier stages. Every stage ships one
validated artifact and knows exactly where it lands.

```
  1.Spec-source     2.Author content    3.Author asset     4.Hotspot+framing    5.Produce         6.Quality gate       7.Commit
  ┌──────────┐  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────┐  ┌───────────────┐  ┌───────────────┐
  │ taxonomy  │→ │ module/lesson │→ │ GLB OR        │→ │ hotspots,     │→ │ validate │→ │ 4 adversarial │→ │ PR + license +│
  │ branch    │  │ quiz/glossary │  │ procedural.ts │  │ camera, layers│  │ schema   │  │ lenses        │  │ status + test │
  │ object    │  │ standards     │  │ + fixture     │  │ compare+cross │  │ + fact   │  │ accuracy      │  │               │
  │ descriptor│  │ (no invention)│  │               │  │               │  │ checklist│  │ pedagogy      │  │               │
  └────────────┘  └───────────────┘  └───────────────┘  └───────────────┘  └──────────┘  │ schema visual │  └───────────────┘
    upstream        write files        asset files →       merge into       →           │   → reject?   │
    read-only      content/…          public/assets/       model-metadata    →         └───────────────┘
                                                                                          → REJECT → back
                                                                                          to stage 2/3/4
```

### Stage 1 — Spec-source (upstream, read-only)

- **Input:** one `component descriptor` derived **only** from `content/taxonomy/<subject>.json`
  (or `index.json`). The descriptor bundle is exactly what `component-builder.workflow.js` expects
  as `args`: `{ subject, subjectName, branch, branchName, componentId, componentName,
  belongsTo[], parts/processes[], objectType }`.
- **Rules:**
  - The descriptor is carved from the taxonomy, never authored ad-hoc.
  - If the branch has `"detailed": false` (e.g. `evolution`, `animals`, `health-and-disease`,
    `neuroscience`, `biochemistry-foundations` in biology), the component is **not sourceable**:
    output `REQUIRES SOURCING`, do not invent parts/processes/hotspot targets. → **reject**
    (exit the pipeline before any drafting).
  - Object type (`Entity`, `Part`, `Process`, `Rule`, `Variable`, `Relationship`, `System`,
    `Skill`) is recorded — it drives authoring depth and asset path (see §2).
  - A **carve-lock** guard: a small script asserts the descriptor's `branch` + `componentId` +
    `parts`/`lowLevelItems`/`processes` appear verbatim in the taxonomy. Prevent the drift where
    an agent later "improves" parts or wraps concepts in new vocabulary.
- **Artifact:** serialized descriptor (JSON) passed to Stage 2. Land: none (in-memory / CLI arg).
- **Reject:** `detailed===false` → `REQUIRES SOURCING`; descriptor terms missing from taxonomy →
  `CARVE MISMATCH`. Nothing else in the pipeline may introduce facts the taxonomy does not already
  carry for this component.

### Stage 2 — Author content (templated)

- **Input:** the Stage-1 descriptor.
- **Output (content files, written by a content author agent using `CONTENT_SCHEMA`):**
  `module.json`, `lesson.md` (8-step learning flow, spec §6), `quiz.json` (+ a `misconception`
  field per question), `glossary.json`, `standards.json` (standards array left empty until a
  curriculum pack is sourced). Land: `content/subjects/<subject>/<branch>/<component>/`.
- **Non-negotiables:**
  - Sourcing: all facts originate from the descriptor/parts/processes list. If the author is
    unsure of a number/fact, **omit** it — never guess. Flag
    anything contested in a `factFlags` note rather than asserting it.
  - Every component satisfies the 8-step learning flow: See → Touch → Name → Explain → Belongs →
    Compare → Use → Review. `lesson.md` must contain the canonical flow (see the `allele`
    `lesson.md` for the reference shape).
  - `module.json` includes `gradeMin/gradeMax` (grade-band: the branch's). `compareCandidate` must
    name the natural pairing (fed to `CompareModal`'s `compareReason`).
  - `simulation.ts` is authored only "where applicable" and placed per spec §23
    (simulation/motion/predict-test components); most static Models ship a `simulationSpec` in
    `module.json` (as `allele` does) instead of a file. Decided by `objectType`/branch
    metadata (§4).
  - **Reject:** lesson <3 steps or missing any of the 8 flow sections; quiz <3 questions or missing
    `misconception`; any `parts`/`processes` not traceable to the descriptor; a number/fact with no
    traceable base flagged as invented.

### Stage 3 — Asset (the C-quality asset decision)

- **Input:** descriptor + an intentional **asset-path decision** (see §2; C-quality coupling).
- **Output (written by asset builder):**
  - `modelType`: `glb-authored` (real anatomical/geometric fidelity: anatomy, cells, molecules,
    apparatus) or `procedural-three` (built from primitives: physics, math, space, symbolic
    biology like `allele`, `protein`, `mutation`).
  - For `glb`: the `.glb` in `public/assets/models/…` **+ a source + licence row** appended to
    `ASSET-LICENSES.md` before it may be referenced (see Stage 7). For `procedural`: a
    `<component>.procedural.ts` (or `.glb` for imported procedural natives) in
    `public/assets/models/…`.
  - A `model-metadata.json` (spec §21 `ModelAsset` + `Hotspot`) authored here.
  - **Assets are the C-quality coupling,** so the material/palette guidance must match the
    Anatomy-Atelier bar (warm off-white studio, matte clay, single key light, no glow/no bloom/no
    particles/no in-viewport billboards). See the `allele` `assetBrief`/`materialNotes` as the
    executable brief reference.
  - **Reject:** no license row; material/palette deviating from the reference (neon/glow/gamey);
    `glb` without documented provenance.

### Stage 4 — Hotspot + framing

- **Input:** `model-metadata.json` from Stage 3 + descriptor `parts`/`processes`.
- **Output:** finalized hotspot list + default camera + layers, all merged into `model-metadata.json`.
- **Rules (spec §21 / §13):**
  - Hotspots map to a `conceptId` that is a real concept (title-cased part/process). Every authored
    part in the descriptor must be reachable by a hotspot (the reference's hotspot-driven language).
  - Default camera framing (`defaultCamera.position/target`) + `autoRotateDefault` required.
  - `crossSectionAvailable`/`compareCandidate` decided here (isolate/cross-section/compare support,
    spec §13).
  - **Reject (the 22px-bug lockout):** any two hotspot markers that would overlap any other
    hotspot marker or fall outside clip space at the authored camera. This is staged as a **fixture
    that fails the build** (see §2, T86 [overlap-fixture]). A separate `overlap-reject` note is returned.
  - No floating 3D text/billboards in viewport — labels live in the side `DetailPanel` only.

### Stage 5 — Produce + validate (schemas compile)

- **Input:** every staged file. **Output:** none external — an internal signal.
- Runs schema validation against the Zod content schema (spec §23 shapes): `module.json`,
  `model-metadata.json`, `quiz.json`, `glossary.json`, `standards.json`; a `lesson.md` flow-heading
  lint (the 8 flow sections); the overlap/framing fixture.
- **Reject:** any schema failure, missing required field, or fixture failure → return to the
  offending stage (2/3/4) with a precise fix list.

### Stage 6 — Quality gate (the differentiator)

- **Input:** the fully authored + produced artifact set. **Owner:** an adversarial reviewer
  persona, not the author.
- **Method:** four independent lenses, run like `component-builder.workflow.js`'s Stage 2
  `VERDICT_SCHEMA`, each defaulting to `pass=false` when uncertain:
  1. **accuracy** — every factual claim correct for the target age band; nothing made up.
  2. **pedagogy** — teaching not trivia; correct difficulty; jumps-through-reasoning flagged; quiz
     misconception-feedback is genuinely instructive.
  3. **schema / completeness** — all 8 flow steps + all required files + spec §6/§13/§21 fields
     present.
  4. **visual vs reference** — the asset/hotspot/framing genuinely matches Anatomy-Atelier, not
     generic/AI-slop; the license row is present.
- **Verdict:** all four `pass=true` AND zero `requiredFixes` → **PASS**, release to Stage 7.
  Any `pass=false` or required fix → **REJECT** and return to the earliest offending stage
  (2/3/4) with a fix list. Rejected components are logged to a queue/backlog artifact
  (`docs/FACTORY-REJECTS.md` or the runner's reject log) so nothing silently drops.
- **Zero-fault rule:** a component does not move to "done" until the gate passes with zero
  required fixes. This is the ONLY path out of Stage 6 (per PRODUCTION-PLAN §C3).

### Stage 7 — Commit (ship + register)

- **Input:** a passing component. **Output:** committed code + registry updates.
- Steps (serial, agent-or-human):
  1. **License gate** — if a new `glb`/texture was introduced, `ASSET-LICENSES.md` must have a
     CLEAR/ATTRIB row (NC-RISK is a hard blocker except while explicitly unmonetized). Enforce as a
     CI/gate so bad assets never re-enter prod paths (Part 4, PRODUCTION-PLAN).
  2. Write to the correct tree (content + asset + `model-metadata`), then **wire** to a route so
     it stops being "authored-pending".
  3. Update `PROJECT-STATUS.md` row: `planned → authored-pending → live`; bump the count.
  4. `git commit` with a message mirroring the repo style (do not skip hooks; never `-i`/force).
- **Reject (should be rare here):** uncommittable state — restore + re-run prior stage.

**Consolidated pipeline*: single CLI entrypoint wrapping all 7 stages with argument-passing by
descriptor list, so the `Workflow` tool can invoke it (see §6).

---

## 2. The C-quality coupling of the asset strategy

How a component is decided *before* authoring, so the asset is correct from the start. The decision
rule mirrors the spec (§21) and the PRODUCTION plan (C1):

| object / subject class | Asset path | modelType |
| --- | --- | --- |
| Physics, Math, Space (mechanics, waves, solar system, orbits, asteroids/moons) | **procedural** three.js primitives / GPU shaders | `procedural-three` |
| Symbolic & diagrammatic Biology (DNA, gene, allele, mutation, Punnett, ecosystem web) | **procedural** (symbol-prone, state-swap friendly) | `procedural-three` |
| Anatomy (organs, systems, cross-sections) | **imported** fidelity GLB (provenance-required) | `glb-authored` |
| Cells (animal, plant, bacterial) | GLB fidelity (except those with clean CC0 cross-sections); check licence per file | `glb-authored` |
| Molecules / molecular biology | **RCSB PDB + Mol\*** — CC0 data, MIT viewer, exports `.glb` | `glb-authored` |
| Apparatus / lab | **Poly Haven** CC0 → decimate → `.glb` | `glb-authored` |
| Ecosystem/food-web animals | **Quaternius** CC0, stylised low-poly | `glb-authored` |
| Fossils/specimens | **Smithsonian** CC0 where marked | `glb-authored` |

Decision input: `objectType` from the descriptor + a mini checklist at Stage 3:
- Does it need *geometrically accurate / recognizable real-world* fidelity (an organ, a molecule, a
  bacterium)? → **GLB**. Exact coordinates / surface detail matter.
- Is it a scale-free / abstract / symbolic structure that is best shown by showing its *shape-with
  convexity + color/structure*, or does the "wow" come from a slider-driven simulation of its
  behavior? → **procedural**.
- Is it a **process** (photosynthesis, orbit, evaporation, Punnett) rather than an object? →
  prefer procedural + a `simulation.ts`/`simulationSpec`; the model is a diagram not a statue.

When choosing GLB: **only** a cleared source from `ASSET-LICENSES.md` §8 (`Poly Haven` CC0,
`Quaternius` CC0, `RCSB PDB`+`Mol*`, `Smithsonian` CC0-marked, `NASA` public domain). Traps are
explicit: NIH 3D varies per-file (two of ours are NC-risks), PhET ≥2026-03-29 is CC-BY-NC, the
mesh-share sites and AI text-to-3D are unverifiable provenance. Never reference an asset without its
license row (Stage 7 enforces).

---

## 3. Factory first-aid MVP

Per PRODUCTION-PLAN §C3: prove the full pipeline piece by piece on **one biology component, run to
zero-fault**, lock the standard, then **batch the remaining biology**. This is deliberately low
(not 60 components at once).

### Step 1 — run one component through the full 7 stages to zero-fault

Pick the reference component: **`allele` (biology/genetics/allele)** — it is already authored to a
high bar (full `module.json`/`lesson.md`/`quiz.json`/`glossary.json`/`standards.json`; a rich
`model-metadata.json` with 4 hotspots, framing, layers, material/asset brief; a `simulationSpec`).
It's a `procedural-three` model in a branch that is `detailed:true` — cheap (no GLB source/licensing
needed) and it exercises at least 5 of the 8 flow steps with compare + hotspot + tween states.

Run it through the automatable stages (1 carve, 5 schema+framing fixture, 6 four-lens, 7 license
skip + register). The failures found in Stage 6 gate evaluations (accuracy/pedagogy/schema/visual) are fixed and
re-run until **four lenses pass with zero `requiredFixes`**. That run *is* the locked reference.

### Acceptance criteria per stage (for the first-pass component)

| Stage | Acceptance criterion (must be met to-pass for `allele`) |
| --- | --- |
| 1 Spec-source | descriptor carved verbatim from `taxonomy/biology.json`; branch `detailed:true`; parts/processes traced to `lowLevelItems`/`processes` |
| 2 Author | 8-step lesson.md present; module.json with gradeBand + hierarchyPath + belongsTo + compareCandidate; quiz ≥3 questions each with misconception; glossary ≥6; facts traceable, no invented numbers |
| 3 Asset | modelType=procedural-three; procedural asset brief is executable (proportions, materials, palette, what to avoid) matching Anatomy-Atelier; license row N/A (no external GLB) |
| 4 Hotspot+framing | 4 hotspots each mapped to a conceptId in the descriptor; defaultCamera set; autoRotate true; crossSectionAvailable as authored; overlap fixture legitimately passes at scene camera |
| 5 Produce/validate | Zod + lint over all authored files compile clean; no schema error |
| 6 Quality gate | all four lenses pass with zero required fixes AND a human sign-off file (`docs/reference/allele-gate-signoff.md`) recording the run |
| 7 Commit | files land; `PROJECT-STATUS.md` genetics count reflects; `ASSET-LICENSES.md` unchanged (no external GLB); git commit clean |

Acceptance of Step 1 = a **signed-off reference component** that all future components are graded
against ("does it match the `allele` bar?").

### Step 2 — batch the remaining biology (authored-pending first)

Once `allele` passes, batch-run the factory over the remaining **already-authored** biology (these
are the cheapest: content already written), in specific order (recipe in §5), then over the
**planned** branches that are `detailed:false` only **after** sourcing (see §4).

Containment: do **not** scale past biology until `allele`-level zero-placement is established on
every batched component. (Every batch re-runs the gate per component — a component that rejects
does not block the batch, it returns to its offending stage.)

---

## 4. Taxonomy budget & governance — how to pick what to author, and never invent

### Budget rule (don't do all of everything)

We have 29 `planned`/unsourced branches and 13 `authored-pending` branches. **Budget = by outcome,
not by coverage.** Default ordering (price/leverage):

1. **"author-pending → live"** (cheapest: content already on disk, only wiring + gate needed):
   biology genetics, ecology, plants, microbiology; chemistry atoms, periodic-table, reactions;
   math number-sense, fractions, geometry, data-stats; physics energy, electricity; space
   earth-in-space. This turns 60→~90 live components without authoring new facts.
2. **Thin live leaves** (live but sparse): Mechanics (1 comp), Algebra (4, and user-rated 1/10 —
   needs the grounded-object redesign first).
3. **Highest-leverage `detailed:true` new branches**: e.g. Cell Biology variants (microscope/
   energy-flow), Human-Physiology process components.
4. **`detailed:false` branches last**, and only after sourcing: sourcing = add a
   competent, non-invented extension to the taxonomy file from a cited source (see Governance).

**Non-negotiable:** never author a branch scored `detailed:false` by inventing parts — flag
`REQUIRES SOURCING`. The factory rejects at Stage 1, its output is a sourcing work item, not a
half-authored component.

### Governance — the "never invent" enforcement

Every authored fact derives from the taxonomy descriptor (Stage 1) + the authoring step 2 must
re-derive from it. Concretely:

1. **Carve-lock:** a small script (`scripts/factory/carve-lock.js`) reads the taxonomy and asserts
   each descriptor's branch/IDs/parts/processes appear in the taxonomy. If a `detailed:false`
   branch is requested → exits with `REQUIRES SOURCING`. This is a hard gate at Stage 1.
2. **No fact-invention rule:** the author prompt (from `workflow.js` `contentPrompt`) is extended to
   say: "Every fact must come from the supplied descriptor (parts/processes/lowLevelItems). If a
   precise number/fact is not in the descriptor, omit it or flag it — never invent."
3. **Uncertainty flag:** a `factFlags` array in module.json for any contested fact + a
   `sourcingNeeded` boolean the accuracy gate rejects on.
4. **Sourcing work item:** when `detailed:false` is needed, emit a sourcing checklist: which
   branches to add `parts`/`processes`/`systems`. The factory never invents content for them.

### Planning note — branch budget in PROJECT-STATUS

Keep the PROJECT-STATUS `status` column and the taxonomy `detailed` flag in sync — they are the two
authoring-governance inputs. Update `PROJECT-STATUS` on every Stage-7 commit and mark `detailed`
progression when sourcing lands.

---

## 5. Batching the next N — recommended order

Groups go graph-by-group. Within a group, run the 4-lens gate on each component; a fail returns the
single component not the card.

**Tier 0 — unlock (1):** `biology/genetics/allele` — zero-fault reference pass. Everything follows.

**Tier 1 — author-pending, procedural (cheapest: content exists, pure asset + wiring):**
Genetics' remaining components (chromosome, dna, dna-replication, gene,
inheritance-punnett-squares, mutation, protein, transcription-translation, trait) — all
`procedural-three`, all `detailed:true`. These are cheap because content is on disk; the factory
adds/updates asset + framing + gate.

**Tier 2 — author-pending, new content but open asset (each `detailed:true`; content largely
exists, ready to confirm and wire):**
- chemistry: atoms-and-elements, periodic-table, chemical-reactions.
- math: number-sense, fractions-and-ratios, geometry, data-and-statistics.
- biology: ecology, plants, microbiology.
- space: earth-in-space.
- physics: energy, electricity.

**Tier 3 — thin live leaves / flagship rebuild:**
- mechanics (1 comp) — new.
- algebra rebuild (abstract→grounded: piggy bank, taxi, tank) — priority fix.

**Tier 4 — planned only-when-sourced (REQUIRES SOURcing gate):** evolution, animals,
health-and-disease, neuroscience, biochemistry-foundations + the planned physics/space/chem/math
branches. Output of the factory here is a sourcing checklist, never invented content.

Estimate: Tier 0–1 set the reference bar with the full factory; Tier 2+ reuse the Stage 3 asset
decision and the gate fixture, so costs drop — but every component still goes through the four-lens
gate.

---

## 6. Tooling / fixtures / scripts to add

Map `component-builder.workflow.js` into the stages. It currently implements stages 2 (parallel
author), 6 (4-lens verifier), and write logic of 7; the gaps are 1, 3, 4, 5, and 7's registry.

### Scripts/commands to add (all under `scripts/factory/`, invoked from a single `scripts/factory/run.js` entrypoint)

| Add | Purpose | Stage |
| --- | --- | --- |
| `scripts/factory/carve-lock.js` | Read taxonomy; assert descriptor is carve-able; emit `REQUIRES SOURCING` on `detailed:false`; print a JSON descriptor | 1 |
| `scripts/factory/asset-decide.js` | Given descriptor `objectType` + checklist → return `modelType` + source-hint (Poly Haven/RCSB/Mol*/NASA/Quaternius vs procedural) | 3 |
| `scripts/factory/license-check.js` | Assert every `url` in `model-metadata.json` has a CLEAR/ATTRIB row in `ASSET-LICENSES.md`; hard-fails NC-RISK in paid mode; writes `public/assets/models/` → register | 3/7 |
| `scripts/factory/overlap-fixture.js` | Project every hotspot at default camera; fail if any are closer than an epsilon px or off-screen (locks out the 22 px hotspot-overlap bug) | 4/5 |
| `scripts/factory/validate-schema.ts` | Zod run over `module/model-metadata/quiz/glossary/standards` + lesson-flow-headings lint | 5 |
| `scripts/factory/run.js` | Orchestrate all 7 stages on N descriptors; runs components in parallel; supports `--component <id>` and `--reject-log` | all |
| `scripts/factory/status-sync.js` | Read `content/subjects` + gate results, update `docs/PROJECT-STATUS.md` counts & branch status | 7 |
| `scripts/factory/signoff.js` | Emit `docs/reference/quality-gate-signoff.md` for a passing batch; part of zero-fault acceptance | 6/7 |

### Fixtures/data worth wiring in

- **Zod content schema** in `app/lib/schema/content.ts` (already spec'd in PRODUCTION-PLAN F1) —
  the single source for both the app and the factory's validate step. One file, two consumers, zero
  drift.
- **Anatomy-Atelier reference fixture** (`assets/reference/anatomy-atelier/*`) already present —
  point the visual lens README at it and load into Stage 6 prompt.
- **Gearless default camera fixture**: `defaultCamera` sanity bounds per modelType (object centered,
  not-nan). Catch mistakes in stage 5 not in the app.

### Orchestration mapping to the existing `workflow.js`

Keep `component-builder.workflow.js` as the orchestrator for the Author + Verify + Synthesize phases
for agent runs (it already drives parallel asset/content author + 4-lens verify), but wrap it with
the `run.js` entrypoint that inserts the missing stages:
`carve-lock (S1) → asset-decide/license-probe (S3) → [workflow.js: S2+S6+S-synth] → overlap+validate
(S5) → signoff+status-sync (S7)`. Do **not** scatter the stage logic back across ad-hoc one-off
scripts — every stage lives in `scripts/factory/`.

---

## 7. Risk / honest gaps in the factory itself

- The factory's quality is bounded by the *authoring prompts* — a bad prompt yields bad content the
  gate is designed to catch. Carry a `factFlags` escalation + a human sign-off gate at the MVP;
  the 4-lens auto gate is a first-pass filter, not a replacement for curatorial judgement.
- **`standards.json`** is authored-but-invisible today (all components ship it, nothing renders it).
  The factory should keep it, but its completeness is a downstream Phase 4 concern, not an authoring
  blocker.
- `simulation.ts` vs. `simulationSpec`: authored spec may be a JSON spec now; keep the factory able
  to emit both and let the engine pick, per spec §22.
- REVIEW assets of live branches (9 organ GLBs) predate the pipeline; a cleanup run by Stage 7's
  license-probe is tracked separately. The earlier NIH NC-risk cell assets were replaced by
  project-owned authored GLBs on 2026-08-12.

---

## 8. Definition of done for the factory as a whole

- Stage 1 can never emit a component for a `detailed:false` branch (hard gate).
- Stage 6 can never be skipped; a component only leaves via **pass-with-zero-fixes**.
- Every Stage-7 ship updates `docs/PROJECT-STATUS.md` + touches `ASSET-LICENSES.md` iff an asset
  was introduced.
- A brand-new component costs authoring (Stage 2) + an asset (Stage 3) + framing (Stage 4) + gate
  (Stage 6); everything else is mechanical.
- The pipeline is runnable as `node scripts/factory/run.js --branch <b> --components "<json>"` with
  the exact descriptors `component-builder.workflow.js` already reads, so over time any agent
  (or the `Workflow` tool) can call the whole thing the same way.
