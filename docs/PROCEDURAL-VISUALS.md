# Quantaora — Meaningful Procedural Visuals (execution plan)

**Status:** math slice DONE (2026-08-09) — implemented, lint/build/codegen clean, 49/49
components visually verified via headless screenshots. Physics slice (§5) is next. Owner:
build lead.
**Why this doc exists:** today a math *circle*, a math *number line*, and a math *abacus* all
render the **same cube**. The generic viewer (`quantaora-app/src/components/explorer/
GenericModel.tsx`) picks a placeholder solid purely by *subject* (`ProceduralBody` → box for
math, octahedron for physics/chemistry, sphere for space, icosahedron for biology) and ignores
everything the authored content already says about the component. That is the "square for a
circle" problem. This is the plan to kill it.
**Related:** [STEM OS catalogue](supplier/stem-os-asset-catalogue.md) (procurement source of
truth), [PRODUCTION-PLAN.md](PRODUCTION-PLAN.md) (F3 generic-engine foundation this sits on).

---

## 1. Root cause (verified in code)

`GenericModel.tsx:182` `ProceduralBody({ subject })`:
- `math` → `boxGeometry` (every math component = cube)
- `physics`/`chemistry` → `octahedronGeometry`
- `space` → `sphereGeometry`
- default (biology) → `icosahedronGeometry`

So all **19 geometry + 10 number components** in the math branch are indistinguishable cubes.
The authored data that *should* drive shape is present but unused: `module.json` has
`type: "model" | "simulation" | "manipulative" | "project"`, `parts[]`, `processes[]`,
`branch`, `compareCandidate`; `model-metadata.json` has layers/hotspot positions. The viewer
reads none of it for the procedural body.

## 2. Design principle

**A procedural body is a *component-aware composition*, not a subject-colored primitive.**
Shapes must teach: `circle` → disc + torus rim + visible radius line; `triangle` → extruded
prism; `line`/`segment`/`ray` → endpoints + tube; `angle` → two rays + arc measure; `place
value` → instanced unit-cube / rod / flat-block manipulative; `number line` → tick rail +
draggable bead; `fraction` → split/colored region. Same rule from the catalogue's blueprint:
*"don't force a static GLB where procedural is better"* — reversed here, *don't force a blank
solid where a meaningful procedural composition is nearly free.*

Shape language by catalogue objectType (`content/taxonomy/index.json`):
- **Entity / Part** → solid object (sphere/box/cylinder/lathe from a small ShapeKind set)
- **System** → multi-part assembly in a shared pivot (parts arranged, not one blob)
- **Process / Variable / Rule** → line/curve/field/flux visuals with a control input
- **Relationship** → two linked bodies + a connector (that is what a compare needs to show)

Every composition must still respect the existing contracts: hotspot markers stay pinned to
`FIT_SIZE = 3.8` authored coordinates; auto-rotate, cross-section, dim-on-select all keep
working via the same `GenericModel` shell. This is a drop-in replacement of
`ProceduralBody`'s internals, not a new viewer.

## 3. Implementation shape (three layers, dependency-ordered)

### L1 — `ShapeKind` primitive library (pure function components)
`src/components/explorer/procedural/` — a small set of reusable, composable primitives:
- solids: `box`, `sphere`, `cylinder`, `cone`, `torus`, `prism`, `pyramid`, `tube`
- math: `disc`, `arc`, `rayPair`, `tickRail`, `bead`, `angleMarker`
- manipulative: `unitCube`, `rod`, `flatBlock`, `grid`
- each exposes the same tiny prop contract (size, color, segments) and uses the warm
  matte-clay `MeshStandardMaterial` conventions already in `GenericModel` (roughness ~0.86,
  metalness 0, flatShading) so all 207 components share one visual language.

### L2 — authored `visual` config (optional, additive)
Add an optional `visual` block to `model-metadata.json` (mirrors catalogue `Asset` entity,
`meshMap` idea). Zod-schema + codegen extended so authored content *declares* rather than the
viewer *guesses*:
```json
"visual": {
  "kind": "composition",
  "shape": "disc-torus-radius-pi",
  "axis": "z",
  "variables": ["radius", "diameter", "circumference"]
}
```
Backfill rule: **math geometry + number branches get authored `visual` entries first** (the
components being complained about); everything else falls back to L3 below.

### L3 — branch-aware resolver (fallback, no authoring required)
`resolveProcedural(kind: string, subject, branch, objectType)`:
1. authored `visual.shape` if present
2. catalogue/branch default table (math×geometry → shape kinds; math×number → manipulative
   kinds; physics×mechanics → rigid-body shapes; etc.)
3. old per-subject solid (so nothing ever renders blank while the table is incomplete)

## 4. Scope — the math vertical slice first

**SHIPPED 2026-08-09.** The first deliverable proves the pattern on the screen the user is actually looking at:

| Component | Today | Target composition (meaningful) |
| --- | --- | --- |
| `circle` | cube | disc + torus rim + radius line (pi hook) |
| `triangle` | cube | extruded triangular prism, vertices marked |
| `square`/`quadrilateral` | cube | extruded quad, side signs |
| `segment`/`line`/`ray` | cube | tube + endpoint/single-end caps |
| `angle` | cube | two rays + arc measure wedge |
| `point` | cube | small sphere + axes |
| `number-line` | cube | tick rail + draggable bead |
| `place-value` | cube | instanced unit/rod/flat/grid blocks |
| `abacus` | cube | rods + sliding beads (MATH-004 engine) |
| `fractions` | cube | unit square split + colored regions |

Exit signal for L1: these ~12 render as distinct, nameable shapes with hotspots intact,
`npm run lint` clean, `npm run build` green.

**L1 exit signal — PASSED (2026-08-09):** headless Chrome walked all 5 math branches, clicked
through all 49 components, and pixel-analyzed the capture region: every component renders a
distinct composition (mean-frame diffs 23–108, 275–614 distinct colors per view); 0 GLB
request failures, 0 page errors. Note for future runs: nav buttons concatenate
`name + scientificName` ("CircleCircle", "NumberLineIntegernumberline") — match with
`.toLowerCase()` on the doubled string.

## 5. Then physics (hybrid, matches catalogue over-claim fix)

Catalogue flags Physics as 48 GLB / 1 procedural, but our adopted stance (§3 of
`stem-os-asset-catalogue.md`) is procedural/hybrid: `lever` → fulcrum + beam + effort/load
forces (PHY-003 rig); `pulley` → wheel + rope + payload; `battery` → cylinder body + terminals;
`circuit` → nodes + wires + bulb glow (PHY-004 wave/current rendering). Not octahedrons.

## 6. Then the rest (207 → 0 generic solids)

- Biology: real `GLB` hero path already handles organs/cells (19 shipped). Remaining
  procedural biology (ecology, plants, microbiology) gets composition defaults; Quaternius
  pack continues as diorama base, **never presented as hero**.
- Chemistry: `CHEM-001/002/003` molecule/reaction/crystal engines per catalogue — the NC/ND
  rows (Oxygen Atom, Crystal Lattice, Generator×3) are **already replaced by these engines** in
  the plan, never imported as GLB.
- Space: sphere + texture path already meaningful; astronomy star/galaxy procedural viewers
  already exist and stay.
- CS/AI/Math abstract branches: catalogue says procedural-first — the ShapeKind library
  *is* their content (graphs, networks, coordinate planes), not a stand-in for it.

## 7. Sequencing / dependency notes

**Math slice implementation record (2026-08-09):**
- `src/lib/procedural/types.ts` — `ProceduralVisual` + `KNOWN_COMPOSITIONS` (51 shape keys).
- `src/lib/schema/content.ts` — `proceduralVisualSchema`; `visual` optional on
  `modelMetadataFileSchema` + `componentContentSchema`; `src/data/types.ts` + codegen updated.
- `src/components/explorer/procedural/compositions.tsx` — 10 L1 primitives (Board, Tube, Dot,
  Disc, TorusArc, ArrowHead, Block, ExtrudedShape, Wedge, Tick) + **51 compositions**
  (geometry 11, number 10, fractions 8, algebra 10, data 10) in a `COMPOSITIONS` registry.
- `src/components/explorer/procedural/resolve.ts` — authored `visual.shape` → math branch
  defaults (geometry→quad-prism, number→place-value-blocks, fractions→fraction-bar,
  algebra→expression-tiles, data→bar-chart-3bars) → subject solid fallback.
- `GenericModel.tsx` (CompositionBody + fallback), `GenericViewer.tsx` + `BranchLab.tsx`
  (pass `branch` + `visual`).
- Authored `visual` blocks into all **49 math `model-metadata.json` files** (0 unmatched);
  regenerated all 16 branches; `codegen:check` round-trip clean; `npm run lint` 0 errors;
  `vite build` green.
- Verified via `shot-math3/4.js` (puppeteer-core, 49/49 components, pixel-diff analysis).

1. Write `src/components/explorer/procedural/` primitives (pure, no app wiring). — DEP 1 ✔
2. Add `visual` to `model-metadata.json` Zod schema + codegen pass-through (additive, safe). — DEP 2 ✔
3. Rewire `ProceduralBody` to `resolveProcedural(...)`. — DEP 3 ✔
4. Author `visual` blocks for math geometry + number components. — DEP 4 ✔
5. Verify the 12 math components; then physics compositions; then the rest by branch table.
6. No GLB license actions in this workstream — catalog CC BY hero import (Heart→...→Abacus)
   proceeds independently under the licence-gate pipeline.

## 8. Definition of done for this workstream

- **Zero generic-subject solids** at 207/207 once fully backfilled: every component either
  resolves a meaningful composition, an authored `visual`, or a real GLB.
- Hotspot/camera/auto-rotate/cross-section/interaction contracts undisturbed (QA-GATE still
  passes).
- Catalogue adoptions respected: physics/chemistry stay procedural/hybrid; no NC/ND GLB; bion
  heroes stay GLB.
- `npm run lint`, `npm run build`, `npm run codegen:check` green at every step.