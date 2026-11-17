# Wave 25 — Release Gap Prioritizer (P0/P1/P2 Batching Plan)

**Method:** Read directly from `content/taxonomy/*.json`, `content/subjects/**`,
`quantaora-app/src/App.tsx`, `quantaora-app/src/data/hierarchy.ts`,
`quantaora-app/src/data/branchModules.ts`, `quantaora-app/src/data/modelRegistry.ts`, and every
`src/data/generated/*.ts` file, cross-referenced against `src/routes/Labs.tsx`,
`src/routes/Subjects.tsx`, `src/routes/BranchLab.tsx`, and the bespoke flagship data files
(`organs.ts`, `molecules.ts`, `crystals.ts`, `moons.ts`). No sibling wave25-* report was read or
depended on. All counts below were computed from source, not estimated.

---

## 1. Inventory (what exists today)

**51 branches** total across 5 subjects (from `content/taxonomy/*.json`): **23 `live`**, **1
`authored-pending`** (`earth-in-space`), **27 `planned`** (`quantaora-app/src/data/hierarchy.ts`
lines 45–127, kept in sync with taxonomy).

Content is authored through **three parallel, non-interoperable pipelines**, which itself is a
finding:

1. **`content/subjects/**`** — 207 component directories (`subject/branch/component`), each with
   up to 7 files (`module.json`, `lesson.md`, `quiz.json`, `model-metadata.json`,
   `glossary.json`, `standards.json`, optional `simulation.ts`). Feeds
   `src/data/generated/*.ts` → `BRANCH_COMPONENTS` (`src/data/branchModules.ts`), which covers
   **22 of the 23 live branches**.
2. **Bespoke hand-authored TS files**, entirely outside `content/subjects/`:
   `src/data/organs.ts` (9 anatomy organs, route `/app` via `Explore.tsx`), `src/data/
   molecules.ts` (5 molecule instances, route `/app/labs/molecules` via `ChemistryLab.tsx`),
   `src/data/crystals.ts` (3 crystal instances, same route), `src/data/moons.ts` (5 moons, route
   `/app/labs/moons` via `MoonsLab.tsx`). **`moons` is the one live branch missing from
   `BRANCH_COMPONENTS`** — it never goes through the standard content pipeline at all.
3. **Procedural composition fallback** (`docs/PROCEDURAL-VISUALS.md`,
   `src/components/explorer/procedural/resolve.ts`): every live branch has a
   `BRANCH_DEFAULTS` entry (lines 15–44), so no live component renders a blank generic solid —
   this is a real, shipped system, not a stub.

**Total inventoried learning pieces: 215** (207 in `content/subjects/` + 5 moons + 3 crystals;
`organs.ts`'s 9 and `molecules.ts`'s 5 duplicate/override components that already exist as
directories inside the 207, so they are not added again — see §5 finding on duplicate sources of
truth).

Content-file completeness inside `content/subjects/` (module+lesson+quiz≥3+model-metadata+
glossary+standards, all present): **205/207**. Two incomplete: `content/subjects/math/
data-and-statistics/range` (missing `model-metadata.json`), `content/subjects/physics/
electricity/parallel-circuit` (missing `standards.json`).

---

## 2. Real-asset cross-reference (per-component, not per-branch)

Matched each live branch's 22 `src/data/generated/*.ts` `"model"` field against
`MODEL_ASSETS` basenames in `modelRegistry.ts` (66 real GLB records):

| Branch | Components | Hero (real) | Support (real) | No match |
|---|---|---|---|---|
| cell-biology | 20 | 2 (animal-cell, neuron — CLEAR) | 1 | 17 |
| human-anatomy | 16 | 9 (all **REVIEW**, not CLEAR/ATTRIB) | 0 | 7 |
| human-physiology | 8 | 0 | 0 | 8 |
| genetics | 8 | 1 (dna — ATTRIB) | 0 | 7 |
| ecology | 11 | 0 | 2 (support-tier only) | 9 |
| plants | 9 | 0 | 0 | 9 |
| microbiology | 5 | 1 (virus — CLEAR) | 0 | 4 |
| atoms-and-elements | 9 | 1 (atom — CLEAR) | 0 | 8 |
| periodic-table | 10 | 0 | 0 | 10 |
| molecules-and-bonding | 6 | 0 | 0 | 6 |
| chemical-reactions | 7 | 0 | 0 | 7 |
| number-and-arithmetic … data-and-statistics (5 math branches) | 49 | 0 | 0 | 49 |
| energy / mechanics / electricity (3 physics branches) | 28 | 0 | 0 | 28 |
| solar-system / stars / galaxies | 17 | 1 (protostar) | 0 | 16 |

The "no match" cells for **math and most of physics/chemistry are by design**, per
`docs/PROCEDURAL-VISUALS.md` §6 — those branches are explicitly procedural/hybrid, not GLB
gaps. The real gaps are the branches that are *supposed* to be GLB-hero (human-anatomy,
cell-biology, genetics, microbiology, ecology, plants) and still show 0 or REVIEW-only matches.

**Bespoke-pipeline assets (outside the table above, verified by grepping `model:` in each
file):**
- `organs.ts`: 9/9 organs wired to real GLBs, **all `licenseStatus: 'REVIEW'`**
  (`modelRegistry.ts` lines 30–136, `ORGAN_ASSET_NOTES`: *"Provenance must be verified before any
  paid launch"*, `replaceBeforePaidLaunch: true` on every one).
- `crystals.ts`: 3/3 wired to real CLEAR/ATTRIB GLBs (diamond, silicon-carbide, graphite) —
  these **pass** definition-of-done.
- `molecules.ts`: **all 5 entries have `model: ''`** (empty string) — despite 4 real, licensed,
  build-scripted CLEAR GLBs sitting registered and unused in `modelRegistry.ts`
  (`/models/chemistry/molecules/water.glb`, `carbon-dioxide.glb`, `methane.glb`,
  `sodium-chloride-lattice.glb`). `MoleculeViewer.tsx` must be rendering these procedurally;
  the sourced GLBs are orphaned.
- `moons.ts`: 5/5 wired to real CLEAR NASA GLBs, all pass.

**Fully orphaned sourced/reviewed GLBs** (registered in `modelRegistry.ts`, PASS'd in asset
review docs, referenced by **zero** route or component file — verified via
`grep -rl <componentId>` across `src/`):
- `physics-mechanics-baseball`, `physics-mechanics-measuring-tape` (mechanics — 13 live
  components, neither wired)
- `physics-energy-generator`, `physics-energy-multimeter`, `physics-energy-electric-stove`
  (energy — 6 live components, none wired)
- `math-measurement-measuring-cup` (branch `measurement` is `planned`, not live — expected)
- `math-number-and-arithmetic-abacus` (branch is live; no `abacus` component exists among the
  10 real number-and-arithmetic components)
- The 4 orphaned molecule GLBs above

That is **9 real, licensed, already-reviewed GLBs sitting completely unwired** — pure
integration work, not sourcing work.

---

## 3. Misleading "done" signals (verified in code, not inferred)

**P0 — `quantaora-app/src/routes/Labs.tsx` lines 46–78 (`flagshipInteractiveBranches` override):**
```js
const qualitySummary = flagshipInteractiveBranches.has(branch.id)
  ? { ...assetSummary, heroReady: Math.max(assetSummary.heroReady, 1), previewMissing: 0, status: 'partial-hero' }
  : assetSummary
```
This hardcoded set force-inflates `heroReady` to at least 1 and zeroes out `previewMissing` for
16 of its 22 listed branches that have **zero real hero-tier GLBs** by actual computation above:
`human-physiology`, `ecology`, `plants`, `algebra`, `number-and-arithmetic`, `geometry`,
`fractions-and-ratios`, `data-and-statistics`, `mechanics`, `energy`, `periodic-table`,
`electricity`, `molecules-and-bonding`, `chemical-reactions`, `solar-system`, `galaxies`. The
Labs page (line 415-421) then renders "Flagship lab" badges and literally says **"1 premium 3D
piece"** for branches with 0 real premium 3D assets. This is a code-level fabrication of asset
status, not a display bug — it actively lies to whoever is deciding what's release-ready by
reading the Labs page.

**P0 — Human Anatomy flagship (route `/app`, `src/data/organs.ts`) has 0 components meeting a
CLEAR/ATTRIB bar.** All 9 wired organ GLBs (heart, brain, lungs, liver, kidneys, eye, intestine,
pancreas, skin) are `licenseStatus: 'REVIEW'` in `modelRegistry.ts`, with the registry's own
comment flagging `replaceBeforePaidLaunch: true`. This is the single most visible, highest-polish
part of the product (home route `/app`, the spec's "quality bar" flagship) and it is not
launch-clear by licensing today.

**P0 — Navigation sends first-time users to the thinner generic lab, not the flagship one.**
- `src/components/landing/Hero.tsx:60` and `src/components/landing/Nav.tsx:50` — the landing
  page's primary CTA links to `/app/labs/branch/atoms-and-elements` (generic `BranchLab.tsx`
  fallback), even though a dedicated flagship route `/app/labs/atoms` (`AtomsLab.tsx`) exists for
  that exact branch.
- `src/routes/FirstFlight.tsx:37` — onboarding's `firstLab` points to `/app/labs/branch/geometry`
  (generic fallback) instead of `/app/labs/math-manipulatives` (`MathManipulativesLab.tsx`,
  geometry's real flagship route).
Every new user's first click and the marketing site's main CTA both bypass the best-built
experience in favor of the generic fallback.

**P0 — `earth-in-space` (space): fully spec'd, zero built.** `content/taxonomy/space.json` marks
it `"detailed": true` with `lowLevelItems` (Axis, Rotation, Revolution, Tilt, Equator,
Hemisphere, Orbit), `processes` (Day and night, Seasons, Moon phases, Solar/Lunar eclipse,
Tides), and `interactiveComponents` (Seasons simulator, Moon phase wheel, Eclipse alignment
model, Tide cause/effect model) fully transcribed and ready for content-agent authoring.
`content/subjects/space/earth-in-space/` is an **empty directory** (confirmed via `find`). No
route exists in `App.tsx`. `hierarchy.ts` correctly marks it `authored-pending` (not `live`), so
it is not exposed misleadingly — but it is the one `detailed: true` branch in the entire 5-subject
taxonomy with zero implementation, and it needs no further SME sourcing to start.

---

## 4. P0 / P1 / P2 batching plan

### P0 — blocks core release (7 batches)

1. **Fix the Labs.tsx asset-honesty bug.** Remove or correct the `flagshipInteractiveBranches`
   override in `src/routes/Labs.tsx` (lines 46–78) so `heroReady`/`previewMissing`/badge text
   reflect the real `summarizeComponentAssets` output. Decide and document a real distinct label
   for "procedural-but-real" branches (math, most of physics/chemistry) vs. actual GLB-hero
   branches, instead of collapsing both into "Flagship lab / N premium 3D pieces."
2. **Resolve the Human Anatomy organ licensing.** 9 organs in `organs.ts`
   (heart/brain/lungs/liver/kidneys/eye/intestine/pancreas/skin) are `REVIEW` status; this is the
   flagship route (`/app`). Either complete provenance verification to `CLEAR`/`ATTRIB`, or
   replace with cleared sourced GLBs, before this branch can be called release-ready.
3. **Fix landing + onboarding routing.** `Hero.tsx:60`, `Nav.tsx:50` → point to
   `/app/labs/atoms` not `/app/labs/branch/atoms-and-elements`. `FirstFlight.tsx:37` → point to
   `/app/labs/math-manipulatives` not `/app/labs/branch/geometry`.
4. **Ecology and Plants (biology, both `live`, 11 + 9 components): 0 real hero GLBs.** Ecology
   has only 2 support-tier Quaternius assets (producer, ecosystem); Plants has 0 matched (the 8
   sourced flower/corn growth-stage GLBs in `modelRegistry.ts` are wired somewhere but not
   through the standard per-component `model` field — verify wiring or treat as unwired).
   Classification: **PROCEDURAL is acceptable per `PROCEDURAL-VISUALS.md` §6** ("gets composition
   defaults, Quaternius pack continues as diorama base, never presented as hero") — so this is a
   **content/labeling fix**, not a sourcing blocker, provided the Labs badge (item 1) stops
   claiming hero coverage it doesn't have.
5. **Molecules-and-bonding: wire the 4 already-built, CLEAR-licensed molecule GLBs.**
   `water.glb`, `carbon-dioxide.glb`, `methane.glb`, `sodium-chloride-lattice.glb` exist, are
   CLEAR, and are registered — but `molecules.ts` has `model: ''` for every entry. This is pure
   integration (connect `MoleculeViewer.tsx` to the real assets or explicitly confirm/document
   the procedural-only design decision), not asset sourcing.
6. **`earth-in-space`: build the branch.** Fully speced in taxonomy (`content/taxonomy/
   space.json`), zero content, zero route. Needs: `EarthInSpaceLab.tsx` route, 7
   `content/subjects/space/earth-in-space/<component>/` directories (axis, rotation, revolution,
   tilt, equator, hemisphere, orbit — or the 4 interactiveComponents as the component set), full
   file-set authoring, `App.tsx` route registration, `hierarchy.ts` status flip to `live`.
   Classification: **AUTHORED-CONTENT** work (procedural rendering is fine per the design
   pattern — seasons/moon-phase/eclipse/tide are naturally simulations, no GLB required).
7. **Fix the 2 structurally incomplete components** so nothing under `content/subjects/` silently
   fails content validation: `math/data-and-statistics/range` (add `model-metadata.json`),
   `physics/electricity/parallel-circuit` (add `standards.json`).

### P1 — needed for complete release, not launch-blocking (5 batches)

1. **Human Physiology (9 components, live route `/app/labs/physiology`): 0 real assets, 0
   support.** Confirm/author explicit procedural compositions per `PROCEDURAL-VISUALS.md`'s
   `blood-loop` branch default; no evidence any GLB sourcing was attempted or is warranted here
   — classify **PROCEDURAL**.
2. **Wire the 5 orphaned mechanics/energy prop GLBs.** `baseball-polyhaven.glb`,
   `measuring-tape-polyhaven.glb` (mechanics), `generator.glb`, `multimeter.glb`,
   `electric-stove.glb` (energy) are sourced, CLEAR, PASS-reviewed, and completely unreferenced
   in any route. Classification: **integration-only**, highest-ROI batch in the whole plan (real
   assets, zero sourcing cost, just need `PhysicsLab.tsx`/`EnergyLab.tsx` wiring).
3. **Wire or formally place the 3 crystal-structures GLBs.** `crystals.ts` (diamond, silicon
   carbide, graphite) are real, CLEAR/ATTRIB, and already reachable inside `/app/labs/molecules`
   — but `crystal-structures` is not a taxonomy branch nor in `content/subjects/chemistry/` at
   all. Decide: fold into `molecules-and-bonding`/`periodic-table` taxonomy formally, or leave as
   an undocumented bonus feature (currently the latter, which is a content-governance gap).
4. **Reconcile the `moons` bespoke pipeline.** `moons.ts` (5 components, all CLEAR, real content)
   works and is `live`, but bypasses `content/subjects/`, `BRANCH_COMPONENTS`, and the standard
   `module.json`/`glossary.json`/`standards.json` file-set contract entirely; `content/taxonomy/
   space.json` still marks `moons` `"detailed": false`. Either migrate it into the standard
   pipeline or explicitly document it as an intentional exception so future audits don't miss it.
5. **Reconcile Human Anatomy's dual source of truth.** `content/subjects/biology/human-anatomy/`
   has 16 fully authored component directories, but the live route (`/app`) actually renders from
   `organs.ts` (9 organs, hand-authored separately). 7 of the 16 authored directories (bones,
   blood-vessels, ear, muscles, large-intestine, small-intestine, spleen, stomach) have no
   corresponding entry in `organs.ts` at all — fully authored content that is unreachable from
   the live app.

### P2 — polish / nice-to-have (2 batches)

1. **27 `planned` branches with `"detailed": false`** — need SME/content sourcing before any
   authoring can start (evolution, animals, health-and-disease, neuroscience,
   biochemistry-foundations; states-of-matter, acids-and-bases, solutions,
   stoichiometry-foundations, organic-chemistry-foundations, biochemistry-links; measurement,
   graphs-and-functions, trigonometry-foundations, calculus-foundations; waves, sound,
   light-and-optics, magnetism, fluids, heat-and-thermodynamics, modern-physics-foundations;
   gravity-and-orbits, asteroids-and-comets, space-exploration, cosmology-foundations,
   telescopes-and-observation). Correctly hidden from nav today (`Subjects.tsx` gates on
   `status === 'live'`), so not misleading — just the bulk of remaining product surface.
   Classification: **AUTHORED-CONTENT**, blocked on sourcing before authoring, not an asset
   problem.
2. **`math-number-and-arithmetic-abacus.glb`** — real, ATTRIB-licensed, PASS-reviewed, unwired;
   no `abacus` component exists in the 10 live number-and-arithmetic components. Low priority
   because number-and-arithmetic is intentionally procedural per design; adding an abacus
   component would be new-content work, not a fix.

---

## 5. Definition of done, applied

**Definition used:** dedicated/reachable route (not a misleading badge) **+** full authored
content file-set (module + lesson + quiz ≥3 questions + model-metadata + glossary + standards, or
the bespoke-file equivalent) **+** either (a) a real GLB with `licenseStatus` `CLEAR` or `ATTRIB`
(not `REVIEW`) wired to that specific component, **or** (b) for branches that are legitimately
procedural-by-design per `docs/PROCEDURAL-VISUALS.md` (math, physics mechanics/energy/
electricity, chemistry atoms/periodic-table/reactions, human-physiology, ecology/plants/
microbiology-secondary), a real distinct authored composition (not a blank subject solid) — which
all 22 live branches now have via `resolve.ts`'s `BRANCH_DEFAULTS` table.

**Components meeting the strict GLB-hero clause of (a) today: 14** — `animal-cell`, `neuron`
(cell-biology, CLEAR); `dna` (genetics, ATTRIB); `virus` (microbiology, CLEAR); `atom`
(atoms-and-elements, CLEAR); `protostar` (stars, CLEAR); `diamond`, `silicon-carbide`,
`graphite` (crystals.ts, CLEAR/ATTRIB); `enceladus`, `europa`, `io`, `moon`, `titan` (moons.ts,
CLEAR). Everything else either fails the license clause (human-anatomy's 9 organs, all `REVIEW`),
has no matched GLB at all, or qualifies only under the procedural clause (b) — which the large
majority of the other ~200 components do satisfy structurally (full content + a real branch-level
composition), just not with a GLB.

Out of **215 total inventoried components**, **14** meet the full strict definition of done
(content + reachable route + CLEAR/ATTRIB hero GLB). If procedural-by-design branches are
credited under clause (b) with a real composition instead of a GLB, roughly **203** additionally
meet a content-and-visual bar (205/207 content-complete minus the 2 incomplete files, plus
moons/crystals), but none of those carry a licensed 3D hero asset — they are procedural-plus-text
components, which is an intentional design choice, not automatically a gap, except where the
branch is explicitly meant to be GLB-hero (anatomy, cell-biology, genetics, ecology, plants,
microbiology) and isn't yet.

---

## Summary

- **Total components inventoried:** 215 (207 in `content/subjects/` + 5 moons + 3 crystals;
  `organs.ts`'s 9 and `molecules.ts`'s 5 overlap with existing `content/subjects/` directories).
- **Meeting full strict definition-of-done (content + route + CLEAR/ATTRIB hero GLB):** 14.
- **P0 batches:** 7 — headline items: Labs.tsx asset-honesty bug (16 branches falsely badged
  "Flagship"), Human Anatomy's 9 REVIEW-license organs on the flagship `/app` route, landing/
  onboarding CTAs routing to the generic fallback instead of flagship labs, Ecology/Plants 0
  hero coverage, 4 unwired CLEAR molecule GLBs, `earth-in-space` fully speced but 0% built, 2
  structurally incomplete content directories.
- **P1 batches:** 5 — headline items: Human Physiology 0 assets, 5 orphaned mechanics/energy prop
  GLBs (pure integration, zero sourcing cost), 3 unplaced crystal GLBs, `moons` bespoke pipeline
  reconciliation, Human Anatomy's dual source of truth (7 authored-but-unreachable organs).
- **P2 batches:** 2 — 27 `planned` branches needing SME sourcing before authoring, 1 low-priority
  orphaned abacus GLB.
- **Needs newly sourced GLB:** effectively 0 urgent cases — every P0/P1 gap above is either
  already-sourced-but-unwired (9 GLBs: 4 molecule + 5 mechanics/energy), a licensing/provenance
  fix (9 anatomy organs), or legitimately procedural by design.
- **Should remain procedural (by design, per `PROCEDURAL-VISUALS.md`):** the ~190+ components in
  math, physics mechanics/energy/electricity, chemistry atoms/periodic-table/molecules-core/
  reactions-core, and biology human-physiology/ecology/plants/microbiology-secondary items.
- **Needs authored-content-only (no asset problem):** `earth-in-space` (fully speced, needs
  authoring + route), plus the 27 `planned` branches (blocked on SME sourcing first, then
  authoring).
