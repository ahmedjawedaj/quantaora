# Wave 25 Chemistry Audit — 2026-08-18

Read-only audit. Sources: `quantaora-app/src/App.tsx`, `src/data/hierarchy.ts`, `src/data/branchModules.ts`,
`src/data/modelRegistry.ts`, `src/data/molecules.ts`, `src/data/crystals.ts`, `src/routes/ChemistryLab.tsx`,
`ChemicalReactionsLab.tsx`, `AtomsLab.tsx`, `BranchLab.tsx`, `src/data/generated/{atoms_and_elements,periodic_table,
molecules_and_bonding,chemical_reactions}.ts`, `content/taxonomy/chemistry.json`, `content/subjects/chemistry/**`.
All percentages/counts below were computed directly from these files just now, not copied from any prior audit doc.

## 1. Route map (from `App.tsx`, lines 41–43, 60)

| Route | Component | Covers |
|---|---|---|
| `/app/labs/atoms` | `AtomsLab.tsx` | `atoms-and-elements` (9 items) + `periodic-table` (10 items) combined |
| `/app/labs/molecules` | `ChemistryLab.tsx` | `molecules-and-bonding` MVP module (5 preset molecules) **and** a separate "Crystal Structures" tab (3 crystals, not in taxonomy) |
| `/app/labs/reactions` | `ChemicalReactionsLab.tsx` | `chemical-reactions` (7 items) |
| `/app/labs/branch/:branchId` | `BranchLab.tsx` (generic fallback) | Technically reachable for `atoms-and-elements`, `periodic-table`, `molecules-and-bonding`, `chemical-reactions` by direct URL, but `hierarchy.ts` routes all four to their dedicated labs above, so Labs.tsx/Subjects.tsx never link to the BranchLab path for chemistry — see §6. |

`src/data/hierarchy.ts` (lines 64–78) — chemistry branch status:

| Branch id | status | route | componentCount (hierarchy.ts) | actual authored components |
|---|---|---|---|---|
| `atoms-and-elements` | live | `/app/labs/atoms` | 9 | 9 |
| `periodic-table` | live | `/app/labs/atoms` | 10 | 10 |
| `molecules-and-bonding` | live | `/app/labs/molecules` | **4** | **6** (mismatch — see below) |
| `chemical-reactions` | live | `/app/labs/reactions` | 7 | 7 |
| `states-of-matter` | planned | — | — | 0 |
| `acids-and-bases` | planned | — | — | 0 |
| `solutions` | planned | — | — | 0 |
| `stoichiometry-foundations` | planned | — | — | 0 |
| `organic-chemistry-foundations` | planned | — | — | 0 |
| `biochemistry-links` | planned | — | — | 0 |

`hierarchy.ts` lists `molecules-and-bonding` componentCount as 4, but the taxonomy's own
`lowLevelItems` array has 6 entries and `content/subjects/chemistry/molecules-and-bonding/` has 6
authored directories (`compound`, `covalent-bond`, `ionic-bond`, `lewis-structure`, `molecule`,
`valence-electron`). This is a stale count in `hierarchy.ts`, not a content gap.

**Crystal Structures is not a taxonomy branch at all.** `content/taxonomy/chemistry.json` (read in
full) lists exactly 10 branches; `crystal-structures` is not one of them, and it has no entry in
`hierarchy.ts` either. It exists only as a second UI tab inside `ChemistryLab.tsx`
(`labMode: 'molecules' | 'crystals'`, lines 442, 683–712) backed by `src/data/crystals.ts`. Since
`HIERARCHY` has no `crystal-structures` branch, `BranchLab.tsx`'s lookup
(`Object.values(HIERARCHY).find(h => h.branches.some(b => b.id === branchId))`) would fail for
`/app/labs/branch/crystal-structures` and redirect to `/app/labs`, so this content is reachable only
through the ChemistryLab tab UI, never through the generic branch route or the Subjects/Labs listing.

## 2. Atoms And Elements + Periodic Table — `/app/labs/atoms` (`AtomsLab.tsx`)

**Visual: 100% procedural, not GLB-driven, despite one real GLB being registered.**
`AtomsLab.tsx` (read in full, lines 1–908) renders every mode — `atom`, `table`, `identity`,
`shells`, `isotope`, `ion` — with hand-built Three.js primitives (`Nucleus`/`ShellRing`/
`PeriodicTable`/`ElementTile` functions, all `<mesh><sphereGeometry>/<boxGeometry>`, lines
760–846). There is no `useGLTF` call and no import of `modelRegistry.ts` anywhere in the file.

`modelRegistry.ts` (lines 197–208) registers one real chemistry GLB:
`/models/chemistry/atoms-and-elements/atom.glb` — `licenseStatus: 'CLEAR'`, `qualityTier: 'hero'`,
Quantaora-authored, componentIds `['atom']`. This asset is **not rendered anywhere in the live
route** (`AtomsLab.tsx` never loads it); it would only render if a user reached `atom` through the
`BranchLab.tsx` fallback route, which Labs.tsx/Subjects.tsx never link to for this branch (§1, §6).
This is a real, licence-clear hero asset that is effectively dead code in the shipped UI.

**Content: fully authored for all 19 items.** `content/subjects/chemistry/atoms-and-elements/` (9
dirs: `atom`, `electron`, `electron-shell`, `element`, `ion`, `isotope`, `neutron`, `nucleus`,
`proton`) and `content/subjects/chemistry/periodic-table/` (10 dirs: `alkali-metal`, `atomic-mass`,
`atomic-number`, `group`, `halogen`, `metal`, `metalloid`, `noble-gas`, `nonmetal`, `period`) each
have all six spec §23 files (`module.json`, `lesson.md`, `quiz.json`, `model-metadata.json`,
`glossary.json`, `standards.json`). No `simulation.ts` files exist in any chemistry component dir
(spec marks that file "if applicable"; none of the 32 chemistry components use it).

**Model-metadata gap:** the generated `atoms_and_elements.ts`/`periodic_table.ts` (compiled from
those `model-metadata.json` files) point every item except `atom` at broken paths — see §6.

## 3. Molecules And Bonding — `/app/labs/molecules` (`ChemistryLab.tsx`, molecules tab)

**This route does not use the authored `molecules-and-bonding` concept content at all.**
`ChemistryLab.tsx` (read in full) is driven by `src/data/molecules.ts`'s 5 hand-authored preset
molecules (`water`, `oxygen`, `carbon-dioxide`, `methane`, `sodium-chloride-lattice`), not by the 6
authored concept components (`compound`, `covalent-bond`, `ionic-bond`, `lewis-structure`,
`molecule`, `valence-electron`) that live in `content/subjects/chemistry/molecules-and-bonding/`
and compile into `src/data/generated/molecules_and_bonding.ts`. Those 6 generated components are
only reachable via the `BranchLab.tsx` fallback route (`branchComponents('molecules-and-bonding')`
in `branchModules.ts` line 34), which is not linked from the app's live navigation (§1, §6).

**Molecule visuals (5 total):**

| Molecule | `modelType` | Visual | Registry entry |
|---|---|---|---|
| Water | `procedural` (deliberate) | Ball-and-stick built live from `atoms`/`bonds` | A GLB exists (`water.glb`, CLEAR, hero) but is **intentionally unused** — code comment in `molecules.ts` lines 10–16 states the sourced GLB's two hydrogens sit behind each other from the default camera, occluding one atom; kept procedural until the GLB atom placement is fixed |
| Oxygen | `procedural` (deliberate) | Ball-and-stick, procedural | A sourced GLB exists (`public/models/sourced/chemistry-structure/oxygen.glb`, RCSB ligand OXY) but is flagged CONDITIONAL in review and **not wired**, per code comment lines 198-202 — not even present in `MODEL_ASSETS` |
| Carbon dioxide | `glb` | Real GLB | `/models/chemistry/molecules/carbon-dioxide.glb` — RCSB PDB ideal coordinates, `licenseStatus: CLEAR`, `qualityTier: hero` |
| Methane | `glb` | Real GLB | `/models/chemistry/molecules/methane.glb` — textbook tetrahedral geometry, `CLEAR`, `hero` |
| Sodium chloride | `glb` | Real GLB (rock-salt lattice, not a discrete molecule) | `/models/chemistry/molecules/sodium-chloride-lattice.glb` — `CLEAR`, `hero` |

So 3 of 5 preset molecules render a real hero GLB; water and oxygen render accurate, real-geometry
procedural ball-and-stick models (deliberately, per documented visual-QA findings, not because no
asset exists).

**Missing starter molecule: Glucose.** `content/taxonomy/chemistry.json`'s `mvpModule.interactions`
and the `molecules-and-bonding` branch's own `starterMolecules` array both list exactly 6 starters:
`["Water", "Oxygen", "Carbon dioxide", "Methane", "Sodium chloride", "Glucose"]`. `molecules.ts`
(read in full, 682 lines) implements only 5 — **Glucose is absent** from `molecules.ts`,
`moleculeById`, and the ContentNav list; there is no glucose GLB in `modelRegistry.ts` either.

**Content status for the 6 concept components** (`compound`, `covalent-bond`, `ionic-bond`,
`lewis-structure`, `molecule`, `valence-electron`): fully authored, all 6 spec §23 files present in
`content/subjects/chemistry/molecules-and-bonding/<id>/`. See §6 for their broken model paths.

## 4. Chemical Reactions — `/app/labs/reactions` (`ChemicalReactionsLab.tsx`)

**Visual: procedural equation scene + one real apparatus GLB.** `ChemicalReactionsLab.tsx` (read in
full, 970 lines) renders the reaction itself (`Reactants`/`Products`/`ReactionArrow`/`CountPanels`/
`ThermalFlow`) entirely with Three.js primitives — atoms are literal `<sphereGeometry>` balls with
billboard text labels (`AtomBall`, `MoleculeH2`/`O2`/`H2O`, lines 785–828). This is a designed,
labeled, real-chemistry-accurate scene (H2 + O2 → H2O, live coefficient balancing, live rate/heat),
not a placeholder.

One real GLB is wired in as a static prop: `/models/chemistry/chemical-reactions/bunsen-burner.glb`
(Poly Haven, CC0, `licenseStatus: CLEAR`, `qualityTier: hero`), loaded via `useGLTF` with a
dedicated error boundary (`BunsenBurnerBoundary`, lines 678–689) and its own runtime-synthesized
hotspot (`apparatus-bunsen-burner`, lines 262–271). This is the only physical lab-apparatus asset
in the chemistry subject.

**Content: fully authored for all 7 items** (`balanced-equation`, `coefficient`,
`conservation-of-mass`, `endothermic`, `exothermic`, `product`, `reactant`) — all six spec §23 files
present per component in `content/subjects/chemistry/chemical-reactions/`.

## 5. Crystal Structures — ChemistryLab.tsx "Crystal Structures" tab (not a taxonomy branch)

**Visual: 3 real, hero-quality, material-fixed GLBs — the strongest asset coverage in chemistry.**
`crystals.ts` (read in full, 432 lines) defines 3 crystals, each backed by a `modelRegistry.ts`
entry:

| Crystal | GLB | License | Quality |
|---|---|---|---|
| Diamond | `/models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb` | CC0 (NIH 3D 3DPX-008116) | hero |
| Silicon Carbide | `/models/sourced/chemistry-gaps-wave2/crystal-silicon-carbide-2h-nih-material-fixed.glb` | CC0 (NIH 3D 3DPX-008102) | hero |
| Graphite (single graphene sheet) | `/models/sourced/chemistry-gaps-wave2/crystal-graphite-sheet-nih-material-fixed.glb` | CC-BY 4.0 (NIH 3D 3DPX-008098, attribution required) | hero |

All 3 are `qualityTier: 'hero'`, `licenseStatus: CLEAR` or `ATTRIB` (no `REVIEW`/`NC-RISK`). Each
GLB is a single-primitive mesh (no per-atom vertex data — converted from STL/OpenSCAD), so hotspots
are authored representative points, not literal per-atom markers (documented in `crystals.ts`
header comment, lines 3–10).

**Content-authoring format gap:** unlike every other chemistry component, this content is **not**
authored under `content/subjects/chemistry/<branch>/<component>/` as the spec §23 file set
(`module.json`/`lesson.md`/`quiz.json`/`model-metadata.json`/`glossary.json`/`standards.json`).
Confirmed: `find content/subjects/chemistry -mindepth 1 -maxdepth 1 -type d` returns only 4
directories (`atoms-and-elements`, `chemical-reactions`, `molecules-and-bonding`, `periodic-table`)
— no `crystal-structures` directory exists. All lesson/quiz/hotspot content instead lives inline as
TypeScript object literals in `crystals.ts` itself. It is complete and high-quality content
(5-step lessons, 4-question quizzes with misconceptions, compare pairings — same depth as the file-
based components), just in the wrong location relative to the spec's file-set convention, and not
represented in `content/taxonomy/chemistry.json` at all.

## 6. Broken model paths — the central asset finding for this wave

`resolveAuthoredAsset()` in `modelRegistry.ts` (lines 851–877) resolves a `model` string first by
exact URL match against `MODEL_ASSETS`, then by basename fallback. Every `MODEL_ASSETS` URL in the
file starts with `/models/...`. Checking the `"model"` fields actually compiled into the generated
branch-content files:

```
grep -n '"model":' src/data/generated/{atoms_and_elements,periodic_table,molecules_and_bonding,chemical_reactions}.ts
```

Every entry **except** `atom` (`/models/chemistry/atoms-and-elements/atom.glb`, real, registered)
points at `/assets/models/chemistry/<branch>/<component>/<component>.glb` — a URL prefix
(`/assets/models/...`) that does not exist anywhere: `public/` has no `assets/` directory at all
(`public/` only contains `models/`, `textures/`, `draco/`, `basis/`), and none of these basenames
(e.g. `compound.glb`, `covalent-bond.glb`, `alkali-metal.glb`, `balanced-equation.glb`) appear in
`MODEL_ASSETS`. That is **31 of 32** low-level chemistry concept components
(8 of 9 atoms-and-elements + all 10 periodic-table + all 6 molecules-and-bonding + all 7
chemical-reactions) with an authored `model` path that will never resolve.

This is **not** a broken/blank-screen bug: `GenericViewer.tsx`/`GenericModel.tsx` fall back to a
procedural `visual.shape` illustration (each component has a distinct authored shape id, e.g.
`atom-shells`, `covalent-share`, `ionic-transfer`, `lewis-dots`, `equation-balance`,
`metal-lattice`, `element-tile` — 31 distinct shape ids checked, no duplicates/reuse across
unrelated concepts), and `branchLabAssetPresentation.ts`'s `childSafeAssetNote()` (lines 32–35)
shows the honest, non-alarming line **"Illustrated 3D model, built to teach this topic clearly."**
— never claiming a real GLB is present. So the graceful-degradation path is well designed; the
underlying gap is that 31 authored components have no real sourced/authored GLB behind their
illustration, and their `model-metadata.json` files record a path that was never actually built or
registered.

**In practice this gap is invisible in the live app**, because none of these 31 components are
reachable through the app's real navigation — `AtomsLab.tsx` and `ChemistryLab.tsx`/
`ChemicalReactionsLab.tsx` never call `GenericViewer`/`GenericModel` at all; they use fully
bespoke, hand-authored Three.js scenes that don't read the `model` field. The broken paths only
matter if someone reaches these branches through `/app/labs/branch/<id>`, which is not linked from
Labs.tsx or Subjects.tsx for any live chemistry branch (§1).

## 7. Misleading status badge: chemistry branches force-flagged "Flagship lab"

`Labs.tsx` and `Subjects.tsx` both define an identical `flagshipInteractiveBranches` allow-list
(`Labs.tsx` lines 46–69, `Subjects.tsx` same pattern) that includes `atoms-and-elements`,
`periodic-table`, `molecules-and-bonding`, and `chemical-reactions`. For any branch in that set, the
real `summarizeComponentAssets()` result (which would show `previewMissing` for all 31 broken-path
components in §6, since 0 of them resolve to a real asset) is **overridden**:

```
heroReady: Math.max(assetSummary.heroReady, 1),
previewMissing: 0,
status: 'partial-hero',
```

This forces the "Flagship lab" / `Sparkles` badge (`Subjects.tsx` `assetStatusMeta`, line 132) to
show for all four branches regardless of actual GLB coverage. It is accurate in spirit (all four are
genuinely bespoke, high-quality interactive labs — just built with hand-authored Three.js scenes
instead of the registry's GLB pipeline), but it means the "Flagship lab" badge does not reflect the
`modelRegistry.ts` GLB-coverage numbers a reader might assume it does. Not a bug, but worth flagging
as an audit-legibility gap: the badge and the asset registry tell two different, both-true stories.

## 8. "Coming soon" / locked branches

`Subjects.tsx` (lines 194–204) renders any non-`live` branch as a disabled, `opacity-60` card with a
`Clock` icon and **"Coming soon"** label. For chemistry this applies to all 6 `planned` branches:
`states-of-matter`, `acids-and-bases`, `solutions`, `stoichiometry-foundations`,
`organic-chemistry-foundations`, `biochemistry-links`. These match `content/taxonomy/chemistry.json`
exactly (all 6 are `"detailed": false`, named only, no `lowLevelItems`/`interactiveComponents`
transcribed) — confirmed zero authored content directories for any of them under
`content/subjects/chemistry/`. `Labs.tsx` filters non-`live` branches out entirely rather than
showing a locked card (line 42: `.filter((branch) => branch.status === 'live' && branch.route)`), so
these 6 don't appear on `/app/labs` at all, only as "Coming soon" rows on `/app/subjects`.

## 9. Repeated/misleading visual reuse

No cross-component GLB reuse found in chemistry (each registered GLB has a distinct
`componentIds` array; no `/models/chemistry/...` URL is shared across unrelated concepts). The one
apparent duplication — `supernova-remnant` reused across 3 different space GLBs — is out of scope
(space subject, not chemistry). Within chemistry, the closest thing to a "generic" reuse is the 31
components sharing the graceful-fallback illustration mechanism (§6), but each gets its own distinct
`visual.shape`, so there is no single placeholder shown for multiple different concepts.

## 10. P0 vs P1 completion need

**P0 (blocks claimed coverage / user-facing correctness):**
- Glucose is a named MVP starter molecule (`content/taxonomy/chemistry.json` `mvpModule.interactions`
  and `starterMolecules`) with zero implementation in `molecules.ts` — the "Build water, oxygen,
  carbon dioxide, methane" interaction list is otherwise complete, but glucose is silently dropped.
- `hierarchy.ts`'s `molecules-and-bonding` `componentCount: 4` is stale (actual authored count is 6)
  — low severity but a direct data-accuracy fix.
- Crystal Structures (3 real hero GLBs, fully authored lesson/quiz content) is invisible to
  `content/taxonomy/chemistry.json` and `hierarchy.ts` — it's the best-asset-coverage chemistry
  content in the app but isn't tracked anywhere machine-readable as a branch, and its content isn't
  in the spec §23 file-set location. Worth formalizing rather than leaving as a ChemistryLab-only tab.

**P1 (asset/pipeline hygiene, not user-visible today):**
- 31 of 32 low-level concept components under `atoms-and-elements`/`periodic-table`/
  `molecules-and-bonding`/`chemical-reactions` have dead `model`/`model-metadata.json` paths
  (`/assets/models/...`, no such directory exists, not registered in `modelRegistry.ts`). Currently
  harmless because these components are only reached through hand-built bespoke labs that ignore the
  `model` field, but the moment anyone links directly to `/app/labs/branch/<chemistry-branch-id>`,
  users see illustration-only fallbacks with no real GLB behind any of them except `atom`.
- The registered `atom.glb` (real, CLEAR, hero) and the registered-but-intentionally-unused
  `water.glb`/`oxygen.glb` assets are dead weight in the shipped experience — not urgent, but worth
  noting for anyone doing asset-registry cleanup.

## Summary table

| Branch | Taxonomy components | Dedicated route | Real GLB (hero/support, resolves) | Procedural-only (no resolving GLB) | "Coming soon" | Zero authored content files |
|---|---|---|---|---|---|---|
| Atoms And Elements | 9 | Yes (`/app/labs/atoms`) | 1 (`atom`, unused in live route) | 9 (all rendered procedurally in `AtomsLab.tsx`; 8 also have dead `model` paths) | No | 0 |
| Periodic Table | 10 | Yes (`/app/labs/atoms`) | 0 | 10 (rendered procedurally; all 10 have dead `model` paths) | No | 0 |
| Molecules And Bonding (MVP module, `molecules.ts`) | 5 of 6 taxonomy starters implemented (Glucose missing) | Yes (`/app/labs/molecules`) | 3 (CO2, methane, NaCl lattice) | 2 (water, oxygen — deliberate, real GLBs exist but excluded for visual-QA reasons) | No | 0 |
| Molecules And Bonding (concept components, `content/subjects/.../molecules-and-bonding/`) | 6 | No (only via unlinked BranchLab fallback) | 0 | 6 (dead `model` paths) | No | 0 |
| Chemical Reactions | 7 | Yes (`/app/labs/reactions`) | 1 (Bunsen burner apparatus prop, not per-component) | 7 (equation scene procedural; all 7 have dead `model` paths) | No | 0 |
| Crystal Structures (not in taxonomy) | 3 | Via ChemistryLab tab only | 3 (all hero, all resolve) | 0 | No | 3 (content inline in `crystals.ts`, not spec §23 files) |
| States Of Matter | named only (`detailed: false`) | No | 0 | — | Yes | all (0 dirs) |
| Acids And Bases | named only | No | 0 | — | Yes | all (0 dirs) |
| Solutions | named only | No | 0 | — | Yes | all (0 dirs) |
| Stoichiometry Foundations | named only | No | 0 | — | Yes | all (0 dirs) |
| Organic Chemistry Foundations | named only | No | 0 | — | Yes | all (0 dirs) |
| Biochemistry Links | named only | No | 0 | — | Yes | all (0 dirs) |

**Totals:** 32 taxonomy-defined low-level chemistry components (9 atoms-and-elements + 10
periodic-table + 6 molecules-and-bonding + 7 chemical-reactions) + 5 MVP preset molecules + 3
crystal structures (extra-taxonomy) = 40 distinct built/authored chemistry things.
- With a dedicated flagship route: 32 (all except the 6 molecules-and-bonding concept components,
  which are content-complete but UI-unreachable) + 5 molecules + 3 crystals reachable via
  `/app/labs/molecules` = effectively all 40 reachable except the 6 orphaned concept components.
- Real, resolving GLB: 1 (atom, unused) + 3 (molecules: CO2/methane/NaCl) + 1 (Bunsen burner
  apparatus) + 3 (crystals) = **8 real resolving GLBs** across all of chemistry.
- Procedural-only (no resolving GLB behind the visual): 32 taxonomy components + water + oxygen = 34.
- "Coming soon": 6 branches (all `planned`, 0 authored content each).
- Zero authored content files: the 6 planned branches, plus Crystal Structures' 3 components (content
  exists but not as spec §23 files, so also "zero authored *content-file-set*" files by that strict
  definition even though the content itself is complete).
