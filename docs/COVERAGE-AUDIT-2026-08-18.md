# Quantaora Coverage Audit — 2026-08-18

**Auditor:** COVERAGE-AUDITOR (read-only inspection agent, Asset Recovery Wave 1)
**Scope:** `content/taxonomy/*.json` (5 MVP subjects) cross-referenced against `quantaora-app/src` routing,
`src/data/modelRegistry.ts`, all `src/data/generated/*.ts`, the seven legacy hand-authored data files, and
every route component under `src/routes/`.
**Method:** static code/data inspection only. The dev server was not run and no model was opened in a 3D
viewer — every quality claim below is inferred from code (which asset loader is used, whether a `.glb` path
resolves, whether a component has a bespoke composition or the single generic per-subject solid). Anywhere
this doc says "quality" it means *asset presence/distinctness*, not rendered fidelity — those items are
marked **not render-inspected**.

---

## 0. Critical context: the app has three parallel rendering systems

This matters for every row below, so it's stated once up front instead of repeated 51 times.

Each of the 5 subjects' taxonomy branches (`content/taxonomy/*.json`) was transcribed into
`src/data/hierarchy.ts` with a `status` (`live` / `authored-pending` / `planned`) and, for `live` branches, a
production `route`. Following those routes to their actual components shows **three different content
systems**, not one:

- **System A — legacy hand-authored data + GLB-capable viewer.** `human-anatomy` (`/app` → `Explore.tsx` →
  `src/data/organs.ts` → `OrganViewer`/`OrganModel`), `cell-biology` (`/app/labs/cells` → `CellLab` →
  `src/data/cells.ts` → `CellViewer`/`CellModel`), and `stars` (`/app/labs/stars` → `StarsLab` →
  `src/data/stars.ts` → `StarViewer`/`StarModel`) use their own data files and a viewer that calls
  `useGLTF()` when a `.glb` is wired, else falls back to a per-component procedural body.
- **System A′ — legacy hand-authored data, no GLB path at all.** `molecules-and-bonding`
  (`src/data/molecules.ts` → `MoleculeViewer`, procedural ball-and-stick), `solar-system`
  (`src/data/planets.ts` → `OrbitSandbox`/`PlanetModel`, procedurally-generated spheres with real texture
  maps via `useTexture`), `galaxies` (`src/data/galaxies.ts` → `GalaxyViewer`/`GalaxyModel`, procedural
  particle disks), `algebra` (`src/data/functions.ts` → `LinearGraph`, a 2D/3D graph). None of these
  components ever call `useGLTF`.
- **System B — taxonomy-generated data (`src/data/generated/*.ts`) rendered by a bespoke, hand-built
  Canvas/Billboard/Line scene per lab.** `human-physiology`, `genetics`, `ecology`, `plants`,
  `microbiology`, `atoms-and-elements`, `periodic-table`, `chemical-reactions`, `mechanics`, `electricity`,
  `energy`, `geometry`, `fractions-and-ratios`, `data-and-statistics`, `number-and-arithmetic`. Verified by
  grep: **zero** occurrences of `useGLTF`/`modelRegistry`/`.glb` in `AtomsLab.tsx`, `ChemicalReactionsLab.tsx`,
  `PhysicsLab.tsx`, `ElectricityLab.tsx`, `EnergyLab.tsx`, `PhysiologyLab.tsx`, `GeneticsLab.tsx`,
  `PlantsLab.tsx`, `MicrobiologyLab.tsx`, `MathManipulativesLab.tsx`, `NumberSenseLab.tsx`. These labs will
  never show a real GLB regardless of what `modelRegistry.ts` contains — the rendering path doesn't consult
  it.
- **A fourth, orphaned path — `BranchLab.tsx` + `GenericViewer`.** This generic component (`route
  /app/labs/branch/:branchId`) is the *only* renderer that actually calls `resolveAuthoredAsset()` /
  `modelRegistry.ts` and falls back to the component-specific procedural-composition library
  (`src/components/explorer/procedural/*.tsx`, 181 registered shape compositions) or, failing that, a single
  generic per-subject solid (box/octahedron/sphere/icosahedron). **7 of the 22 live branches'
  `generated/*.ts` files are only ever reachable through this path** (`cell_biology.ts`,
  `human_anatomy.ts`, `molecules_and_bonding.ts`, `solar_system.ts`, `stars.ts`, `galaxies.ts`, `algebra.ts`
  all have real dedicated routes that use a *different* data file — their `generated/` counterpart is dead
  weight except through `BranchLab`).

**Why this is the sharpest finding in the audit:** `BranchLab` is not dead code — it is the literal landing
spot for **3 of the app's 5 first-flight onboarding paths** and the **primary landing-page CTA**:

| Entry point | Target | What it actually renders |
|---|---|---|
| `Nav.tsx` "Try it" / `Hero.tsx` primary CTA | `/app/labs/branch/atoms-and-elements` | `BranchLab` + orphaned `generated/atoms_and_elements.ts` (procedural compositions; only the `atom` component resolves a real `.glb`). The *actual* built atoms experience, `AtomsLab.tsx` at `/app/labs/atoms`, is never linked from the landing page. |
| `FirstFlight.tsx` → "Math" interest | `/app/labs/branch/geometry` | `BranchLab` + orphaned `generated/geometry.ts` (procedural). The real geometry experience lives in `MathManipulativesLab.tsx` at `/app/labs/math-manipulatives` and is not what a new math-interested user sees first. |
| `FirstFlight.tsx` → "Physics" interest | `/app/labs/branch/electricity` | `BranchLab` + `generated/electricity.ts` (procedural). The real bespoke circuit builder is `ElectricityLab.tsx` at `/app/labs/electricity`. |
| `FirstFlight.tsx` → "Space" interest | `/app/labs/branch/solar-system` | `BranchLab` + orphaned `generated/solar_system.ts` (procedural clay compositions, 0 real assets). The real textured-planet experience is `SpaceLab.tsx` at `/app/labs/orbit` (`OrbitSandbox`/`PlanetModel`, real NASA-style planet textures). |
| `FirstFlight.tsx` → "Biology" interest | `/app` | Correct — routes to the real organ viewer. |
| `FirstFlight.tsx` → "Chemistry" interest | `/app/labs/atoms` | Correct — routes to the real `AtomsLab`. |

**3 of 5 first-touch onboarding paths, plus the single highest-visibility landing CTA, route new users to
the weakest visual system in the app, bypassing better experiences that already exist for the same
content.** This is a routing defect, not an asset gap, and is almost certainly a large share of what the
product owner is perceiving as "generic procedural Three.js" and "repetitive visuals" on first impression —
independent of whatever asset gaps exist underneath. (Per instructions, no route/code fix is proposed here —
flagging only.)

---

## 1. Duplicated-flagship-model finding: **not found in currently-wired code**

Every registered asset in `modelRegistry.ts` was grepped across the entire `src/` tree by basename. Result:
**every real `.glb` is referenced by exactly the one data file for its own branch** (organ basenames only
appear in `organs.ts`/`modelRegistry.ts`/the orphaned `human_anatomy.ts`; cell assets only in
`cells.ts`/`modelRegistry.ts`; `atom.glb` only in `atoms_and_elements.ts`/`modelRegistry.ts`; the 5 NASA
star/nebula assets only in `stars.ts`/`modelRegistry.ts`; `producer.glb`/`ecosystem.glb` only in
`ecology.ts`/`EcologyLab.tsx`). **No component was found reusing another, unrelated component's flagship
`.glb`.**

The one asset-sharing pattern that does exist in production: `EcologyLab.tsx` (lines ~957–960) renders
`producer.glb` and `ecosystem.glb` as faded background set-dressing behind **all 11** ecology components
simultaneously (dimmed/brightened based on which is focused), not as a per-component identity. That's a
within-branch diorama design choice, not cross-subject reuse — flagged for completeness, not as a top
offender.

**Honest reframing of the "repetitive visuals" complaint:** the evidence doesn't support "the same flagship
model standing in for many unrelated components." It supports two different, real problems instead:
(1) real assets exist for only ~8% of live components, so the overwhelming majority of the app is procedural
by necessity, and (2) the routing defect in §0 means the *procedural fallback path* (clay-primitive
compositions) is what several first-touch users see even where a much better bespoke experience exists one
click away. If the product owner watched several unrelated components resolve to visually-similar clay
shapes, §0's `BranchLab` fallback path is the most likely source — every branch reached only through it
defaults to a subject-level solid (box for math, octahedron for physics/chemistry, sphere for space,
icosahedron for biology) whenever a component lacks its own composition, and distinct components across
*different* subjects would render as the *same* primitive shape.

---

## 2. Component and asset inventory (true production paths)

Counts below use each branch's **actual production data file** (not `generated/*.ts` where a legacy file is
what's really rendered — see §0). `HIERARCHY.componentCount` in `hierarchy.ts` was cross-checked and is
**stale in several branches** (both under- and over-counting); true counts are from reading the data files
directly. This table is per-branch (not per-component) to stay legible — component-level exceptions (which
specific items are real vs. procedural) are called out in the Notes column.

### Biology

| Branch | Status | Route | Visual system | Components (true) | Real GLB | Notes / P |
|---|---|---|---|---|---|---|
| Cell Biology | live | `/app/labs/cells` | A (CellLab/`cells.ts`/CellViewer) | 8 | 2 (`animal-cell`, `neuron`) | 6 procedural whole-cell types (`plant-cell`, `bacterial-cell`, `red-blood-cell`, `muscle-cell`, `sperm-cell`, `egg-cell`); `bacteria-wall-nih.glb` exists but is *deliberately* not wired to `bacterial-cell` per an inline code comment ("not suitable as whole bacterial-cell hero"). Orphaned `generated/cell_biology.ts` (21 items incl. individual organelles) is unreachable in production. **P0** (should-look-real living things, mostly procedural). |
| Human Anatomy | live | `/app` | A (Explore/`organs.ts`/OrganViewer) | 9 | 9 (all) | Approved anatomy set — **out of scope**, not flagged as a problem. Orphaned `generated/human_anatomy.ts` (16 items incl. blood-vessels, bones, ear, eye, muscles, large-intestine) is unreachable in production — real taxonomy content invisible to users, not even labeled Coming Soon. **P1** (surface the orphaned content, not an asset gap). |
| Human Physiology | live | `/app/labs/physiology` | B (bespoke Canvas, no GLB path) | 9 | 0 | Bespoke hand-built process diagrams (breathing, circulation, digestion, filtration, etc.), not a generic fallback. Not render-inspected. **P1**. |
| Genetics | live | `/app/labs/genetics` | B | 10 | 0 | DNA/chromosome/protein content — conceptually "should look real" (a real double helix, real chromosome). Bespoke diagram, not generic. **P0**. |
| Ecology | live | `/app/labs/ecology` | B + 2 shared background GLBs | 11 | 0 individually (`producer.glb`/`ecosystem.glb` are ambient dressing for the whole scene, not per-component) | Food-web/ecosystem content — should show recognizable organisms; currently abstract clusters + 2 shared background props. **P0**. |
| Plants | live | `/app/labs/plants` | B | 9 | 0 | Root/stem/leaf/flower content — should look like real plant parts. **P0**. |
| Microbiology | live | `/app/labs/microbiology` | B | 5 | 0 | Bacteria/virus/fungus/protozoa — should look like recognizable organisms, currently abstract diagrams. **P0**. |
| Evolution | planned | none | — | not sourced (taxonomy `detailed:false`) | — | Coming Soon (branch-level pill in Subjects.tsx). **P2** (blocked on SME content sourcing per CLAUDE.md, not asset-workable this wave). |
| Animals | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Health And Disease | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Neuroscience | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Biochemistry Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |

Biology coverage: 7 of 12 branches live (58.3%), 5 planned/Coming Soon (41.7%). Of the 61 live-branch
components: **11 real (18.0%)**, **50 procedural (82.0%)**, 0 literal "Coming soon" *within* a live branch
(every live branch is fully built, just mostly procedural).

### Chemistry

| Branch | Status | Route | Visual system | Components | Real GLB | Notes / P |
|---|---|---|---|---|---|---|
| Atoms And Elements | live | `/app/labs/atoms` (canonical) **or** `/app/labs/branch/atoms-and-elements` (landing CTA) | B in AtomsLab (no GLB) / orphaned-B+fallback via BranchLab | 9 | 0 in AtomsLab; 1 (`atom`) only via the BranchLab path | `atom.glb` (the one bespoke-authored chemistry asset that exists) is *unused* by the canonical route. **P0** — first-touch, high visibility. |
| Periodic Table | live | `/app/labs/atoms` (shares AtomsLab) | B | 10 | 0 | Grid/card layout is arguably appropriate as a diagram (periodic table is inherently tabular). **P1**. |
| Molecules And Bonding | live | `/app/labs/molecules` | A′ (`molecules.ts`/MoleculeViewer, ball-and-stick, no GLB) | 6 | 0 | Ball-and-stick is a legitimate scientific representation, not "generic," but still not a "real recognizable object." **P0** (starter molecules are core MVP module). |
| Chemical Reactions | live | `/app/labs/reactions` | B | 7 | 0 | Bespoke reaction-flow diagrams. **P1**. |
| States Of Matter | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Acids And Bases | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Solutions | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Stoichiometry Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Organic Chemistry Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Biochemistry Links | planned | none | — | not sourced | — | Coming Soon. **P2**. |

Chemistry coverage: 4 of 10 branches live (40%), 6 planned (60%). Of the 32 live-branch components: **0–1
real depending on entry path (0–3.1%)**, effectively **100% procedural** on the canonical routes.

### Math

| Branch | Status | Route | Visual system | Components | Real GLB | Notes / P |
|---|---|---|---|---|---|---|
| Number Sense And Arithmetic | live | `/app/labs/number-sense` | B | 10 | 0 | Diagrammatic content is pedagogically appropriate here (number lines, place-value blocks). **P1**. |
| Fractions And Ratios | live | `/app/labs/math-manipulatives` | B | 8 | 0 | Same — appropriate abstraction. **P1**. |
| Algebra | live | `/app/labs/functions` | A′ (`functions.ts`/LinearGraph) | 5 | 0 | Real-world scenario graphs (savings, taxi fare, tank draining, candle burning) — reasonable representation. Orphaned `generated/algebra.ts` (10 items: variable/expression/equation/term/etc.) unreachable in production. **P1**. |
| Geometry | live | `/app/labs/math-manipulatives` (canonical) **or** `/app/labs/branch/geometry` (first-flight) | B (canonical) / same data via BranchLab fallback (first-flight) | 11 | 0 | **P0** — first-touch entry point for the Math onboarding path lands here specifically. |
| Measurement | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Graphs And Functions | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Data And Statistics | live | `/app/labs/math-manipulatives` | B | 10 | 0 | Chart/graph diagrams — appropriate abstraction. **P1**. |
| Trigonometry Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Calculus Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |

Math coverage: 5 of 9 branches live (55.6%), 4 planned (44.4%). Of the 44 live-branch components: **0 real
(0%)**, 100% procedural — but for math this is largely appropriate content (diagrams/graphs, not "should be
recognizable real objects"), so the visual-quality complaint applies less here than in biology/chemistry.
Geometry's first-touch routing defect is still P0.

### Physics

| Branch | Status | Route | Visual system | Components | Real GLB | Notes / P |
|---|---|---|---|---|---|---|
| Mechanics | live | `/app/labs/motion` | B | 13 | 0 | Cart/vector/graph diagrams — appropriate abstraction for MVP flagship module. **P1**. |
| Energy | live | `/app/labs/energy` | B | 6 | 0 | Skate-ramp/pendulum diagrams — appropriate. **P1**. |
| Waves | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Sound | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Light And Optics | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Electricity | live | `/app/labs/electricity` (canonical) **or** `/app/labs/branch/electricity` (first-flight) | B (canonical, bespoke circuit builder) / same data via BranchLab fallback (first-flight) | 9 | 0 | **P0** — first-touch entry point for the Physics onboarding path lands on the weaker path. |
| Magnetism | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Fluids | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Heat And Thermodynamics | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Modern Physics Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |

Physics coverage: 3 of 10 branches live (30%), 7 planned (70% — this is the branch where the PM's "~70%
Coming Soon" figure lines up almost exactly). Of the 28 live-branch components: **0 real (0%)**, but again
largely appropriate diagrammatic content; Electricity's first-touch routing defect is P0.

### Space

| Branch | Status | Route | Visual system | Components | Real GLB | Notes / P |
|---|---|---|---|---|---|---|
| Solar System | live | `/app/labs/orbit` (canonical) **or** `/app/labs/branch/solar-system` (first-flight) | A′ (`planets.ts`/OrbitSandbox, real texture maps via `useTexture`) on canonical route / orphaned `generated/solar_system.ts` procedural clay compositions on first-flight route | 10 (sun + 8 planets + Pluto) | 0 literal `.glb` but real NASA-style planet textures on spheres (reasonable representation; not render-inspected) on canonical route — **0 real, generic clay primitives** on the first-flight route | **P0** — the single starkest before/after gap in the app: a new space-interested user's first click shows a worse experience than the one that already exists for the exact same content. |
| Stars | live | `/app/labs/stars` | A (`stars.ts`/StarViewer, GLB-capable) | 8 | 5 (`protostar`→`bp-tauri.glb`, `crab-nebula`, `cassiopeia-a`→`cassiopeia-a-supernova.glb`, `cygnus-loop`→`cygnus-loop-supernova.glb`, `g292`→`g292-supernova-remnant.glb`) | **Best-covered branch in the app** — 5/8 (62.5%) real NASA public-domain assets; `main-sequence-star`, `red-giant`, `white-dwarf` remain procedural (no public generic-star assets sourced). **P1** for the remaining 3. |
| Galaxies | live | `/app/labs/galaxies` | A′ (`galaxies.ts`/GalaxyViewer, procedural particle disks) | 7 (Milky Way, Andromeda, Whirlpool, Sombrero, M87/elliptical, irregular, globular cluster) | 0 | `HIERARCHY.componentCount` says 2 — actual built content is 7, each with distinct procedural parameters (star counts/colors/arm structure differ per galaxy). Metadata undercounts real coverage here. **P0** (galaxies are visually iconic; should look real/recognizable, not particle clouds). |
| Gravity And Orbits | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Moons | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Asteroids And Comets | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Space Exploration | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Cosmology Foundations | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Telescopes And Observation | planned | none | — | not sourced | — | Coming Soon. **P2**. |
| Earth In Space | authored-pending | none | — | spec-detailed (7 structures + 6 processes) but 0 built | — | Coming Soon, but *ready* for content-agent authoring (taxonomy `detailed: true`) unlike the fully-`planned` branches above. **P1** (highest-priority Coming Soon branch — closest to buildable). |

Space coverage: 3 of 10 branches fully live (30%), 1 authored-pending, 6 planned (70% not live). Of the 25
live-branch components: **5 real (20%)** — space is the second-best-covered subject after the approved
anatomy set, driven entirely by Stars' NASA assets.

---

## 3. Honest coverage summary (all numbers = true production paths, §0)

| Subject | Branches live / total | Live-branch components | Real-asset components | % real | Procedural (bespoke, appropriate) | Procedural (should-look-real, currently abstract) |
|---|---|---|---|---|---|---|
| Biology | 7 / 12 (58.3%) | 61 | 11 | 18.0% | 9 (human-physiology) | 41 (cell-biology remainder, genetics, ecology, plants, microbiology) |
| Chemistry | 4 / 10 (40%) | 32 | 0–1 | 0–3.1% | 7 (chemical-reactions, periodic-table) | 25 (atoms-and-elements, molecules-and-bonding) |
| Math | 5 / 9 (55.6%) | 44 | 0 | 0% | 44 (all — diagrams are appropriate for math) | 0 |
| Physics | 3 / 10 (30%) | 28 | 0 | 0% | 28 (all — diagrams are appropriate for physics) | 0 |
| Space | 3 / 10 (30%, +1 authored-pending) | 25 | 5 | 20% | 10 (galaxies + solar-system, arguably appropriate) | 10 (solar-system via first-flight path) |
| **Total** | **22 / 51 fully live (43.1%)** | **190** | **16** | **8.4%** | **88** | **102** |

(9 of the 16 real-asset components are the pre-approved human-anatomy organ set, out of scope for
replacement; the other 7 are genuinely new coverage: `animal-cell`, `neuron`, and 5 Stars/nebula assets.)

**On the product owner's "~70% Coming Soon" claim:** at the *branch* level, 29 of 51 branches (56.9%) are
not live at all (28 `planned` + 1 `authored-pending`) — Physics alone is 70% Coming Soon. That figure is
accurate and matches the complaint almost exactly for physics specifically, and is directionally right
across the app. At the *component* level within live branches, the more precise and arguably more damning
number is that only 8.4% of built components have a real distinct asset — the other 91.6% are procedural,
which is a different (and in some subjects worse) problem than "not built yet," since it presents as
finished/interactive but visually generic.

---

## 4. Top offenders

Reframed per the finding in §1 — there is no single GLB being reused across many unrelated components in
the wired code today. The actual top offenders are structural:

1. **`BranchLab.tsx` generic clay-primitive fallback** — reached by the single landing-page CTA
   (atoms-and-elements) and 3 of 5 first-flight onboarding paths (geometry, electricity, solar-system).
   Whenever a component in one of the 7 branches whose `generated/*.ts` file is *only* reachable through
   this path lacks its own composition, it renders one of 4 subject-level primitives (box / octahedron /
   sphere / icosahedron) — the one place in the app where genuinely unrelated components across different
   subjects could render literally the same shape.
2. **`producer.glb` / `ecosystem.glb`** — the only assets rendered identically regardless of which of 11
   different ecology components is focused (background dressing, not per-component identity). Low severity,
   same branch.
3. **`atom.glb`** — built and registered, but unused by the canonical `/app/labs/atoms` route; only resolves
   via the bypassed `BranchLab` path. Effectively wasted work today.
4. **Orphaned `generated/*.ts` files** (`cell_biology.ts`, `human_anatomy.ts`, `molecules_and_bonding.ts`,
   `solar_system.ts`, `stars.ts`, `galaxies.ts`, `algebra.ts`) — richer, taxonomy-complete content that the
   canonical routes never render, duplicating and drifting from the hand-authored files that actually ship.

---

## 5. Data-integrity caveats found along the way (not asset issues, but relevant to trusting any coverage number)

- `HIERARCHY.componentCount` in `src/data/hierarchy.ts` is stale for several branches: Cell Biology is
  listed as 8 but the (unreachable) generated file has 21; Galaxies is listed as 2 but the real, live
  `galaxies.ts` has 7; Human Anatomy is listed as 9 (correct for the live `organs.ts`) but the orphaned
  generated file has 16.
- Several `content.model` path basenames in `generated/*.ts` don't match their intended `modelRegistry.ts`
  basename even where an asset was clearly authored for that exact component (e.g. `cell_biology.ts`'s
  `neuron` component references `.../neuron/neuron.glb`, but the actual authored asset is registered as
  `/models/cells/neuron-authored.glb` — a basename mismatch that would silently fail to resolve if this file
  were ever wired to a live route). Moot today only because that file is orphaned (§0); worth knowing before
  anyone tries to "fix" it by pointing `BranchLab` at these files.

---

## 6. Priority ranking

**P0 (86 components across 10 branches) — first-touched and/or should-look-real-but-isn't:**
Atoms And Elements (9), Molecules And Bonding (6), Solar System (10), Genetics (10), Ecology (11),
Plants (9), Microbiology (5), Cell Biology non-real remainder (6), Galaxies (7), Geometry (11) and
Electricity (9) *specifically for the first-flight routing defect* — note Geometry/Electricity's canonical
labs are otherwise reasonable bespoke experiences (P1-quality), it's only the first-touch path that's P0.

**P1 — live, bespoke, appropriately-abstract content, or partially-covered branches:**
Human Physiology, Chemical Reactions, Periodic Table, Mechanics, Energy, Number Sense And Arithmetic,
Fractions And Ratios, Data And Statistics, Algebra, Stars' remaining 3 procedural bodies, Human Anatomy's
orphaned richer content (surface it, don't re-asset it), Earth In Space (spec-ready, not yet built).

**P2 — blocked on SME content sourcing before any asset work is possible (per CLAUDE.md, `detailed:false`
branches):** Evolution, Animals, Health And Disease, Neuroscience, Biochemistry Foundations, States Of
Matter, Acids And Bases, Solutions, Stoichiometry Foundations, Organic Chemistry Foundations, Biochemistry
Links, Measurement, Graphs And Functions, Trigonometry Foundations, Calculus Foundations, Waves, Sound,
Light And Optics, Magnetism, Fluids, Heat And Thermodynamics, Modern Physics Foundations, Gravity And
Orbits, Moons, Asteroids And Comets, Space Exploration, Cosmology Foundations, Telescopes And Observation
(28 branches).
