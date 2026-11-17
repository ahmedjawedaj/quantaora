# Asset Recovery Wave 2 — Integration Batches (2026-08-18)

**Role:** Integration Mapper. Pure planning — no code, no `.glb`/`.license.json` edits, no other
docs touched. This file is the only output of this pass.

## 0. Status of this plan — read before executing anything

This is **pre-verdict planning**. At the time this file was written, six visual-review agents were
concurrently inspecting the 65 sourced-but-unwired `.glb` files under
`quantaora-app/public/models/sourced/<domain>/` and had not yet published verdicts to
`docs/assets/reviews/<domain>-visual.md` (the `reviews/` directory was empty when checked). An
eighth agent was normalizing `*.license.json` sidecar schema in place (no effect on which assets
exist or their content, only their sidecar shape).

**Every asset named below is an "accepted-candidate — pending reviewer verdict."** None of them
are approved for integration by this document. Before any batch below is actually executed:

1. Re-open `docs/assets/reviews/*.md` (all six) and confirm a **PASS** (or an accepted
   **CONDITIONAL**, with its stated condition satisfied) for every asset in the batch being run.
   Drop or defer any asset with a REJECT or an unresolved CONDITIONAL.
2. Confirm the license-normalizer's pass on that asset's `.license.json` sidecar is clean (schema
   normalized, all `REQUIRED_SIDECAR_FIELDS` present per
   `quantaora-app/scripts/asset-quality/validate-assets.mjs`).
3. Re-run `node scripts/asset-quality/validate-assets.mjs --root public/models/sourced` and, after
   any registry edit, `npm run assets:check` (`quantaora-app/scripts/check-assets.ts`) from
   `quantaora-app/`.
4. Only then move the file(s) out of `sourced/` into their permanent `public/models/<subject>/...`
   home, add a `docs/ASSET-LICENSES.md` row, and add a `MODEL_ASSETS` entry in
   `quantaora-app/src/data/modelRegistry.ts`.

Batch ordering below (P0 then P1) reflects **coverage priority from
`docs/COVERAGE-AUDIT-2026-08-18.md`**, not review outcome — a P0 batch whose assets fail review
simply doesn't happen; it does not get promoted around a P1 batch that passes.

**Serialization note:** almost every batch below edits the same two shared files —
`quantaora-app/src/data/modelRegistry.ts` and `docs/ASSET-LICENSES.md`. These are described as
"conflict-free" in the sense that each batch's *own* rows are additive and don't overlap another
batch's rows, but they are **not parallel-safe as literal simultaneous edits** — whoever executes
these batches should append rows to those two files serially (one batch's edit lands, then the
next), or merge carefully. Every other file listed per batch is genuinely disjoint across batches.

---

## 1. P0 batches

### P0-1 — Cell Biology: bacterial cell + DNA/chromosome (biology-cell)

Fills the sharpest "should-look-real but isn't" gap flagged P0 in the coverage audit
(cell-biology's 6 non-real cell types; genetics is 100% procedural).

| Asset (pending verdict) | Taxonomy path | Notes |
| --- | --- | --- |
| `biology-cell/bacteria-ecoli-whole-cell-nih.glb` | Biology > Cell Biology > Bacterial cell (grouping) | Whole-cell silhouette only — no internal nucleoid/ribosome/flagellum detail. Upgrades the existing wall-only cross-section, doesn't fully close the gap (see `docs/assets/biology-cell.md` §5). |
| `biology-cell/dna-b-form-double-helix-nih.glb` | Biology > Genetics > DNA | Real PDB 1BNA geometry, CC-BY. |
| `biology-cell/nucleosome-dna-packaging-nih.glb` | Biology > Genetics > Chromosome (partial) | Shows DNA-histone packaging, not a full metaphase-chromosome X-shape — label as partial coverage, not a finished Chromosome asset. |

**Target files:**
- `quantaora-app/src/data/cells.ts` — the `bacterial-cell` entry already exists (line ~339); add
  `modelType: 'glb'` + `modelUrl: '/models/cells/bacteria-ecoli-whole-cell-nih.glb'` following the
  exact pattern already used by `animal-cell` (line ~82) and `neuron` (line ~473). This is the
  lowest-effort wire in this whole plan — the mechanism already exists, only the entry needs the
  two new fields plus re-checked hotspot coordinates for the new mesh.
- `quantaora-app/src/routes/GeneticsLab.tsx` — **needs new code**, not just a data edit. This is a
  bespoke `Canvas`/`useFrame` scene (System B per `COVERAGE-AUDIT-2026-08-18.md` §0) with zero
  `useGLTF` calls today. Wiring DNA/chromosome GLBs here means adding a GLB-loading path to this
  component (mirroring `CellViewer`'s `modelType`/`modelUrl` branch), not editing a data file alone.
- `quantaora-app/src/data/generated/genetics.ts` — **do not** wire assets here instead of
  `GeneticsLab.tsx`'s real data source; this file is orphaned per the audit (only reachable through
  `BranchLab`, which `genetics` doesn't route through anyway — confirm the live route
  `/app/labs/genetics` uses `GeneticsLab.tsx` directly before touching anything).
- `quantaora-app/src/data/modelRegistry.ts` — add 3 `MODEL_ASSETS` rows (subject `biology`, branch
  `cell-biology` / `genetics`).
- `docs/ASSET-LICENSES.md` — add matching rows (bacteria: CC0 1.0 CLEAR; DNA: CC-BY 4.0 ATTRIB;
  nucleosome: CC0 1.0 CLEAR, but note "partial — not a full chromosome" in its Notes column).

### P0-2 — Microbiology: virus set (biology-cell)

Closes microbiology's "Virus" low-level item, currently 0% real per the audit.

| Asset (pending verdict) | Taxonomy path | Notes |
| --- | --- | --- |
| `biology-cell/virus-influenza-capsid-rna-nih.glb` | Biology > Microbiology > Virus (primary, piece 1/3) | CC-BY 4.0, 15.0 MB — at the size ceiling. |
| `biology-cell/virus-influenza-envelope-a-nih.glb` | Biology > Microbiology > Virus (primary, piece 2/3) | CC-BY 4.0, 12.3 MB. |
| `biology-cell/virus-influenza-envelope-b-nih.glb` | Biology > Microbiology > Virus (primary, piece 3/3) | CC-BY 4.0, 11.5 MB. 3-piece set totals ~39 MB combined — decide load strategy (all 3 on load vs. lazy-load envelope halves on an "explode/isolate" interaction) before wiring. |
| `biology-cell/virus-bacteriophage-t4-capsid-bychain-nih.glb` | Biology > Microbiology > Virus (alternate) | CC0 1.0, capsid only, no tail — pick either this or the influenza set as the wired hero, not both, to avoid two unrelated "Virus" heroes. |
| `biology-cell/virus-polio-capsid-nih.glb` | Biology > Microbiology > Virus (alternate) | CC0 1.0, 23.8 MB — oversized, needs a decimation pass before shipping regardless of review verdict. |

**Target files:**
- `quantaora-app/src/routes/MicrobiologyLab.tsx` — same situation as GeneticsLab: bespoke
  Canvas/`useFrame` scene, zero `useGLTF` today. Needs a new GLB-rendering path added.
- `quantaora-app/src/data/generated/microbiology.ts` — confirm this is the file `MicrobiologyLab.tsx`
  actually reads (it is the live route's data source per the audit — microbiology isn't in the
  BranchLab-orphaned list) before adding the new `virus` entry's model reference here.
- `quantaora-app/src/data/modelRegistry.ts` + `docs/ASSET-LICENSES.md` — add rows for whichever
  1–3 files are chosen as the shipped set (recommend picking the influenza 3-piece set as primary,
  skip the two alternates unless a future "compare virus shapes" interaction wants them).

### P0-3 — Ecology: real consumer/predator/decomposer organisms (biology-life)

Closes ecology's "abstract clusters" P0 finding — first real animals/fungus for the food-web branch.

| Asset (pending verdict) | Taxonomy path |
| --- | --- |
| `biology-life/ecology/consumer-deer/deer.glb` | Biology > Ecology > Consumer (and doubles as Prey) |
| `biology-life/ecology/predator-fox/fox.glb` | Biology > Ecology > Predator |
| `biology-life/ecology/decomposer-mushroom/mushroom-stage-{1..5-mature}.glb` (5 files) | Biology > Ecology > Decomposer |

**Target files:**
- `quantaora-app/src/routes/EcologyLab.tsx` — already calls `useGLTF` today (lines ~958–960,
  `SupportGlb`), but only for two shared **background** props (`producer.glb`/`ecosystem.glb`)
  dimmed/brightened behind all 11 components — not a per-component identity. Wiring Deer/Fox/
  Mushroom as the actual hero for Consumer/Predator/Decomposer needs a **new** per-component GLB
  path in this file (reuse the `SupportGlb` helper's loading logic, but bind it to the
  focused-component's own mesh, not shared dressing).
- `quantaora-app/src/data/generated/ecology.ts` — live route's real data source (not orphaned);
  add `model`/GLB references to the `consumer`, `predator`/`prey`, `decomposer` entries here.
- Re-check scale before compositing: the sourcing doc flags Fox (~2.6 m) and Deer (~4.3 m) bounding
  boxes as likely oversized vs. the existing `quaternius-ultimate-nature` trees already in the
  scene — a scale-normalization pass is needed at wiring time, not before.
- `quantaora-app/src/data/modelRegistry.ts` + `docs/ASSET-LICENSES.md` — add rows (all CC0 1.0
  CLEAR, Quaternius Ultimate Animated Animal Pack / Ultimate Crops Pack).

### P0-4 — Plants: growth-stage sequences (biology-life)

Closes plants' "abstract" P0 finding for the germination/flowering visual anchor.

| Asset (pending verdict) | Taxonomy path |
| --- | --- |
| `biology-life/plants/growth-stage-corn/corn-stage-{1..5-mature}.glb` (5 files) | Biology > Plants > Seed→seedling→sprout→mature plant (growth-stage sequence) |
| `biology-life/plants/flower/flower-stage-{1-bud..4-bloom}.glb` (4 files) | Biology > Plants > Flower |

**Target files:**
- `quantaora-app/src/routes/PlantsLab.tsx` — bespoke Canvas, zero `useGLTF` today; needs a new
  GLB-sequencing path (a "scrub through growth stages" control swapping which of the 5/4 meshes is
  visible — same interaction shape as the mitosis-stage gap flagged in `biology-cell.md`, reusable
  pattern).
- `quantaora-app/src/data/generated/plants.ts` — live route's real data source.
- Content-authoring caveat carried over from `docs/assets/biology-life.md` §5: these are **stylized
  game-asset stages, not scientifically labeled growth phases** — `lesson.md`/`module.json` text for
  the growth-stage and flower components must not claim these meshes map to named botanical phases
  (radicle emergence, cotyledon vs. true leaves, etc.) without an added diagram/label layer.
- `quantaora-app/src/data/modelRegistry.ts` + `docs/ASSET-LICENSES.md` — add rows (CC0 1.0 CLEAR,
  Quaternius Ultimate Crops Pack).

### P0-5 — Chemistry structure: molecule set (chemistry-structure)

Closes molecules-and-bonding's 0% real-asset finding (P0 in the audit — "starter molecules are
core MVP module").

| Asset (pending verdict) | Taxonomy path |
| --- | --- |
| `chemistry-structure/water.glb` | Chemistry > Molecules And Bonding > Water (H2O) |
| `chemistry-structure/oxygen.glb` | Chemistry > Molecules And Bonding > Oxygen (O2) |
| `chemistry-structure/carbon-dioxide.glb` | Chemistry > Molecules And Bonding > Carbon dioxide (CO2) |
| `chemistry-structure/methane.glb` | Chemistry > Molecules And Bonding > Methane (CH4) |
| `chemistry-structure/glucose.glb` | Chemistry > Molecules And Bonding > Glucose (C6H12O6) |
| `chemistry-structure/sodium-chloride-lattice.glb` | Chemistry > Molecules And Bonding > Sodium chloride (NaCl) — also doubles as a Periodic Table ionic-lattice example (intentional dual-use, documented in the sourcing doc, not a flagship-reuse violation) |

**Target files:**
- `quantaora-app/src/data/molecules.ts` — **needs a schema change**, not just new data: the
  `Molecule` interface (line ~18) currently only has `atoms`/`bonds` and is rendered 100%
  procedurally by `MoleculeViewer` — there is no `modelType`/`modelUrl` field here today, unlike
  `cells.ts`'s `Cell` interface which already has that exact mechanism (line ~53). Recommend
  mirroring `cells.ts`'s pattern verbatim: add optional `modelType?: 'glb' | 'procedural'` and
  `modelUrl?: string` to `Molecule`, default to `'procedural'` when omitted so this is additive/safe.
- `quantaora-app/src/routes/ChemistryLab.tsx` (`MoleculeViewer`) — add the GLB-branch rendering path
  that reads the new fields, same shape as `CellViewer`'s existing branch.
- `quantaora-app/src/data/modelRegistry.ts` + `docs/ASSET-LICENSES.md` — add 6 rows (4 CC0-derived
  from RCSB PDB CCD data — public-domain wwPDB policy, CLEAR; `methane`/`sodium-chloride-lattice`
  are project-authored via `build-molecules.mjs`, same authored-asset precedent as `atom.glb` —
  CLEAR, project-owned).

### P0-6 — Space: 8 planets + Pluto + Ceres relief models (space)

Closes solar-system's biggest "texture-only sphere → real relief geometry" upgrade for the live,
canonical `/app/labs/orbit` route. **Read the routing-correction section (§3) before wiring this
batch** — it interacts directly with the BranchLab defect.

| Asset (pending verdict) | Taxonomy path |
| --- | --- |
| `space/mercury.glb`, `venus.glb`, `earth.glb`, `mars.glb`, `jupiter.glb`, `saturn.glb`, `uranus.glb`, `neptune.glb` | Space > Solar System > the 8 planets |
| `space/pluto.glb`, `space/ceres.glb` | Space > Solar System > dwarf planets (Pluto already listed as a body; Ceres is new) |

**Target files:**
- `quantaora-app/src/data/planets.ts` — every existing entry (`sun`, `mercury`, …`mars`,
  `jupiter`…) currently has only a `texture: string` field (line ~8), consumed by `useTexture` on a
  procedural sphere (System A′ per the audit — no `useGLTF` anywhere in this file). Wiring real
  relief geometry means adding a `model?: string` (GLB path) field here and a rendering branch in
  whatever component renders `PlanetModel` — confirm the exact component name inside
  `quantaora-app/src/routes/SpaceLab.tsx` before editing (grep turned up no `PlanetModel`/`useTexture`
  symbol by that exact name in a first pass — the real symbol needs a closer read at execution time,
  not assumed from this doc).
- `docs/ASSET-LICENSES.md` currently lists `public/textures/planets/*` (texture rows only) — new
  rows are needed for the 10 new **model** files, distinct from the existing texture rows; don't
  overwrite the texture rows, the two can coexist (e.g., texture as a fallback while a GLB loads,
  or the GLB's own baked material replacing the texture path entirely — a call for whoever executes
  this batch to make, not decided here).
- Ceres is a genuinely new body, not a re-skin of an existing entry — needs a full new `planets.ts`
  entry (lesson text, key facts, hotspots, quiz) authored, not just a model swap.

### P0-7 — Physics-fields: Electricity apparatus (bulb, wire-cable-set)

Targets Electricity's canonical bespoke circuit-builder route, flagged P0 in the audit specifically
for the *first-flight routing defect* (see §3) — the canonical lab itself is otherwise reasonable.

| Asset (pending verdict) | Taxonomy path |
| --- | --- |
| `physics-fields/bulb.glb` | Physics > Electricity > Bulb |
| `physics-fields/wire-cable-set.glb` | Physics > Electricity > Wire (circuit builder kit) |

**Target files:**
- `quantaora-app/src/routes/ElectricityLab.tsx` — bespoke circuit builder (System B, zero `useGLTF`
  today per the audit). Needs a new GLB-anchor path for the bulb prop specifically; the wire-cable
  kit likely serves as connector/wire segment dressing in the builder's rendering rather than a
  single hero mesh — treat as a scene-prop kit, not a single hotspot object.
- `quantaora-app/src/data/generated/electricity.ts` — **do not treat this as the only wiring
  target** — see §3, this file is the orphaned BranchLab path, not what `/app/labs/electricity`
  (the canonical route) actually renders.
- `quantaora-app/src/data/modelRegistry.ts` + `docs/ASSET-LICENSES.md` — add 2 rows (CC0 1.0 CLEAR,
  Poly Haven, repacked to single-file GLB per the sourcing doc's `pack-polyhaven-glb.mjs`).

---

## 2. P1 batches

### P1-1 — Cell Biology oversized organelles (decimation-gated)

`biology-cell/organelle-ribosome-80s-bychain-nih.glb` (93 MB, ~6x over budget) and
`biology-cell/organelle-golgi-apparatus-nih.glb` (28 MB) — both CC-BY/CC0 license-clean per the
sourcing doc, but **not ship-ready regardless of visual-review verdict** until a
decimation/Draco-compression pass brings them under the 15 MB guideline in
`quantaora-app/scripts/asset-quality/validate-assets.mjs`'s `SIZE_WARN_BYTES`. Target: same
`cells.ts` mechanism as P0-1 (Ribosome/Golgi have no existing taxonomy entry point yet in
`cells.ts` — would need new component entries, not just new fields on existing ones). Do not
schedule this batch's actual wiring before the decimation pass, independent of when reviewers land.

### P1-2 — Space: Perseverance rover

`space/perseverance-rover.glb` → Space > Solar System > Mars > "Rover missions" low-level item.
Target: `quantaora-app/src/data/planets.ts`'s `mars` entry (needs a new sub-field/hotspot for the
rover, distinct from the planet body model itself — likely a small secondary mesh positioned on
the Mars surface, not a swap of the planet's own model). Lower priority than P0-6 because Mars
already has a live, reasonable procedural/textured treatment — this is additive richness, not a
gap-closer.

### P1-3 — Chemistry reactions: lab apparatus (chemistry-reactions)

`chemistry-reactions/chemistry-lab-bench.glb` (50-node Poly Haven diorama: beakers, test tubes,
retort stand, bottles, in-scene burner) and `chemistry-reactions/bunsen-burner.glb` (dedicated hero,
higher-detail). Per `docs/assets/chemistry-reactions.md` §0, these are explicitly a **complementary**
pool, not a replacement for the existing procedural ball-and-stick equation scenes already authored
at `content/subjects/chemistry/chemical-reactions/{reactant,product,coefficient,balanced-equation,
exothermic,endothermic,conservation-of-mass}/model-metadata.json` (all `modelType:
"procedural-three"`). Target:
- A **new** taxonomy component/interactive item (e.g., "lab setup") is likely needed before this
  has a real wiring target — there is currently no `chemical-reactions` low-level item that means
  "the apparatus itself." Confirm with content authoring before assuming `ChemicalReactionsLab.tsx`
  gets a new scene rather than this staying illustrative-only (used in `lesson.md` imagery, not a
  3D viewer object).
- If wired as a 3D object: `quantaora-app/src/routes/ChemicalReactionsLab.tsx` + whichever
  `content/subjects/chemistry/chemical-reactions/*/model-metadata.json` file is chosen to carry it.

### P1-4 — Space: 10 moons (blocked on branch, not just asset)

`space/{moon-earth,phobos,deimos,europa,ganymede,callisto,io,titan,enceladus,triton}.glb`. **This is
not purely an asset-wiring task.** Per `docs/COVERAGE-AUDIT-2026-08-18.md`, "Moons" is a `planned`
(not live) taxonomy branch, and `quantaora-app/src/data/planets.ts` currently has no per-moon
entries at all — moons today exist only as mentioned-in-lesson-text facts inside each planet's
entry (e.g. Earth's "One large moon" key fact, Mars's "Two tiny moons" quiz question), not as
separate inspectable 3D objects. Wiring these 10 GLBs for real requires either (a) authoring the
Moons branch's content (module.json/lesson.md/quiz.json/model-metadata.json per component) first,
which is a content-authoring task outside this wave's scope, or (b) a smaller-scope compromise:
attach each moon as a secondary orbiting mesh inside its parent planet's existing `planets.ts`
entry (Phobos/Deimos on Mars, the 4 Galilean moons on Jupiter, Titan/Enceladus on Saturn, Triton on
Neptune, Earth's Moon on Earth) without a dedicated taxonomy branch — flagging both paths for the
coordinator to choose, not deciding here. Two of the ten (`phobos.glb`, `deimos.glb`) are the
highest-value wins per the sourcing doc — irregular potato-shaped bodies where the app currently has
no representation at all (not even a texture-sphere placeholder).

### P1-5 — Space: telescopes (blocked on branch, not just asset)

`space/{hubble-telescope,jwst-telescope,chandra-xray-observatory}.glb`. Same shape of blocker as
P1-4: `telescopes-and-observation` is a `planned`/not-`detailed` branch — content doesn't exist to
attach these to yet. Hold until that branch is authored; assets are ready when it is.

### P1-6 — Physics-fields: compass and lens (blocked on branch, not just asset)

`physics-fields/compass.glb` targets Magnetism, `physics-fields/lens.glb` targets Light And Optics
— both `planned`/not-`detailed` branches per `content/taxonomy/physics.json`. Same content-gate as
P1-4/P1-5. Additionally, per `docs/assets/physics-fields.md`, `compass.glb` has a worn brass/antique
finish (restyle flag against the warm off-white quality bar) and `lens.glb` is a handheld-magnifier
proxy, not a purpose-built ray-diagram lens — both need an art-direction decision in addition to the
branch being authored.

### P1-7 — Space: asteroid specimens (Bennu, Vesta)

`space/bennu.glb`, `space/vesta.glb` → Space > Solar System > Asteroid belt specimen (`otherObjects`,
already `detailed: true` under solar-system, not a separate blocked branch). Lower priority than
P0-6 only because the audit doesn't call out asteroids as a first-touch/CTA path the way planets are.
Target: `quantaora-app/src/data/planets.ts` or a small new sibling data file for `otherObjects`
(asteroid-belt specimens aren't planets and may not belong in the same array shape — a design call
for whoever executes this).

---

## 3. Routing corrections found (describe only, not applied)

The single biggest correction, inherited directly from `docs/COVERAGE-AUDIT-2026-08-18.md` §0 and
directly relevant to **two of this plan's own P0 batches**:

> **`quantaora-app/src/routes/BranchLab.tsx` (route `/app/labs/branch/:branchId`) is the landing
> spot for the single highest-visibility landing-page CTA and 3 of 5 first-flight onboarding paths,
> but it renders a *different, orphaned* data file than the canonical lab for the same branch.**

For this wave's scope, the two collisions that matter are:

1. **Space / Solar System (P0-6):** the canonical route `/app/labs/orbit` renders
   `SpaceLab.tsx` + `src/data/planets.ts` (the file P0-6 targets). But the landing-page's
   "Space"-interest first-flight path routes to `/app/labs/branch/solar-system`, which renders
   `BranchLab.tsx` + the orphaned `src/data/generated/solar_system.ts` — **procedural clay
   compositions with zero real assets**, and wiring the new planet GLBs into `planets.ts` alone
   does **not** reach a new space-interested user's actual first click. Fix options (not applied
   here): either point `FirstFlight.tsx`'s Space path at `/app/labs/orbit` directly (a route-target
   change, no asset work needed), or mirror the same GLB references into
   `generated/solar_system.ts` as well (a duplicate-maintenance band-aid, not recommended as the
   real fix).
2. **Physics / Electricity (P0-7):** identical shape of problem. Canonical `/app/labs/electricity`
   renders `ElectricityLab.tsx` (the real bespoke circuit builder, and P0-7's target); the
   landing/first-flight "Physics"-interest path instead routes to
   `/app/labs/branch/electricity` → `BranchLab.tsx` + orphaned `generated/electricity.ts`. Wiring
   `bulb.glb`/`wire-cable-set.glb` into `ElectricityLab.tsx` alone leaves the first-touch path
   showing the old procedural fallback.

Neither fix is applied in this pass. Recommendation for whoever executes P0-6/P0-7: **fix the
`FirstFlight.tsx` route targets for the Space and Physics interest paths as a near-zero-cost
prerequisite step before or alongside those batches** — otherwise the new assets ship but remain
invisible on the exact entry points the product owner is most likely judging the app by (this is
literally the audit's own framing of why "generic procedural" is the dominant first impression).

A third, lower-stakes instance not touched by any batch here: `atoms-and-elements` and `geometry`
have the same BranchLab-bypass shape (landing CTA / Math first-flight path respectively), but no
asset in this wave's 65 files targets either branch, so no batch above is blocked by it — flagging
only for completeness, matching the audit's own §0 table.

---

## 4. Fallback behavior (today, and after this wave's integration)

Two different fallback systems already exist in the codebase, and this wave's assets interact with
each differently — read `docs/PROCEDURAL-VISUALS.md` before assuming one convention applies
everywhere:

- **Components reached through `GenericModel`/`BranchLab`** (the orphaned `generated/*.ts` files,
  plus any branch whose canonical route already uses this shell) resolve, in order: an authored
  `visual.shape` composition (`model-metadata.json`) → a branch-default composition table → the
  old per-subject solid (box/octahedron/sphere/icosahedron) as the last resort. **None of this
  wave's batches change that resolver.** Once an asset from this plan is wired and its component
  gains a `visual` block or a direct GLB reference, it simply stops falling through to the solid —
  no code change to the fallback chain itself is needed.
- **Components reached through a bespoke Canvas lab** (`GeneticsLab`, `MicrobiologyLab`,
  `PlantsLab`, `EcologyLab`, `ElectricityLab`, and all the other System B labs per the audit) have
  **no shared fallback mechanism at all today** — each lab is its own hand-built scene. For every
  batch above that targets one of these labs (P0-1 through P0-4, P0-7), "fallback for a component
  with no accepted asset" simply means: **that component keeps rendering its existing bespoke
  procedural composition**, unchanged, exactly as it does today. This is not a regression or a
  placeholder state — the audit explicitly rates most of these as "appropriate abstraction," and
  only re-flags the specific components this plan's P0 batches target as "should look real."
- **Branches that are `planned` (not live at all)** — everything in P1-4/P1-5/P1-6 above, plus every
  branch the coverage audit lists as `planned` — use the existing `Subjects.tsx` "Coming Soon" pill
  convention already in the app. No new fallback state is needed for this wave; the gap here is
  content authoring, not a rendering fallback.
- **Nothing in this plan should ever produce a literal blank/missing model.** `resolveAuthoredAsset()`
  in `modelRegistry.ts` already returns a `'missing'` status + a "Preview model – premium GLB
  sourcing needed" label (`assetStatusLabel()`) for any `GenericModel`-path component with an
  unresolved model string — that mechanism is untouched and still applies to anything wired
  incorrectly (e.g., a typoed basename), which is exactly the kind of silent-mismatch bug flagged in
  `COVERAGE-AUDIT-2026-08-18.md` §5 (basename drift between `generated/*.ts` and
  `modelRegistry.ts`). Whoever executes these batches should double-check basenames match exactly.

---

## 5. Tests to add once these are wired (describe only, no test code written here)

- **`quantaora-app/scripts/check-assets.ts`** — already asserts (per-`MODEL_ASSETS`-row): file
  exists on disk, `.glb` extension, no duplicate basename, required metadata present, a matching
  `docs/ASSET-LICENSES.md` row exists, and blocks `NC-RISK`/`REVIEW` under `PAID_RELEASE=1`. Add:
  - A new check that every asset's `licenseStatus` is not `REVIEW`/`NC-RISK` **unless** a
    corresponding `docs/assets/reviews/<domain>-visual.md` verdict of PASS/accepted-CONDITIONAL is
    also recorded — i.e., gate registry entries on the visual-review verdict, not just the license
    status, so a licensed-but-unreviewed asset can't silently ship.
  - A check that every `componentIds` entry actually exists in the relevant
    `content/taxonomy/<subject>.json` low-level-items/groupings list (catches the exact kind of
    basename/id drift the coverage audit found in `generated/cell_biology.ts`'s `neuron` entry).
- **`quantaora-app/scripts/asset-quality/validate-assets.mjs`** — already flags oversized files
  (>15 MB) and missing sidecar fields for anything under `public/models/sourced`. Add:
  - A `--root public/models` pass (its default) run in CI *after* integration to confirm every
    newly-moved-out-of-`sourced/` file still validates once relocated to its permanent path.
  - An explicit assertion that no file flagged oversized in this doc (ribosome 93 MB, golgi 28 MB,
    polio-capsid 23.8 MB, `io.glb`/`enceladus.glb` slightly over 15 MB) is present in
    `MODEL_ASSETS` until re-validated under budget — i.e., fail loudly if an oversized `sourced/`
    file's basename appears in the registry.
- **`scripts/verification/verify-components.js`** (repo root) — already screenshots every
  `content/subjects/**` component via `BranchLab`'s route and checks for non-blank canvas + no
  console/GLB errors, and already computes a `glb: boolean` per component from
  `model-metadata.json`. Add:
  - Extend it to also walk the **non-BranchLab** canonical routes this plan's batches touch
    (`/app/labs/cells`, `/app/labs/genetics`, `/app/labs/microbiology`, `/app/labs/plants`,
    `/app/labs/ecology`, `/app/labs/molecules`, `/app/labs/orbit`, `/app/labs/electricity`) — today
    it only walks `content/subjects/**` + `BranchLab`, which per §3 above is provably *not* what
    several of these branches' real users see.
  - A "route parity" assertion for the two §3 collisions specifically: for `solar-system` and
    `electricity`, assert the canonical route and the `BranchLab` route render the *same* asset set
    for the same component id — this test should currently **fail** (documenting the known defect)
    and should be the acceptance check for whichever fix (route-retarget or data-mirroring) is
    eventually chosen.
  - A GLB-load-error assertion specifically for this wave's larger files (the 15–17 MB moon/io/
    enceladus files, the 39 MB influenza 3-piece set) on a throttled/mobile-simulated network
    profile, since `PERFORMANCE-A11Y-AUDIT.md`-style budgets aren't exercised by the existing
    desktop-only puppeteer pass.

---

## 6. Batches not created

`public/models/sourced/math/` and `public/models/sourced/physics-mechanics/` are both empty (0
files) — confirmed by direct listing. `docs/assets/math.md` and `docs/assets/physics-mechanics.md`
both document *why* (Sketchfab's OAuth download wall blocked every license-qualifying candidate for
both domains; Poly Haven has no matching models in either catalog). No batch is proposed for either
domain in this wave — there is nothing to integrate. Both docs already contain ready-to-execute
"next wave" instructions (get a Sketchfab account token) that don't require re-sourcing from
scratch.
