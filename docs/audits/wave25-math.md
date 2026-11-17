# Wave 25 Math Audit (read-only, 2026-08-18)

Scope: every component in `content/taxonomy/math.json` (`"detailed": true` branches) and
`content/subjects/math/`. Verified against `quantaora-app/src/App.tsx` route table,
`quantaora-app/src/data/hierarchy.ts`, `quantaora-app/src/data/branchModules.ts`,
`quantaora-app/src/routes/NumberSenseLab.tsx`, `quantaora-app/src/routes/MathManipulativesLab.tsx`,
`quantaora-app/src/routes/MathLab.tsx`, `quantaora-app/src/routes/BranchLab.tsx`,
`quantaora-app/src/data/functions.ts`, `quantaora-app/src/data/generated/{algebra,geometry,
fractions_and_ratios,data_and_statistics,number_and_arithmetic}.ts`, `quantaora-app/src/routes/
Subjects.tsx`, `quantaora-app/src/routes/Labs.tsx`, `quantaora-app/src/routes/FirstFlight.tsx`.

Content-authored math components total: **49**, across 5 `"detailed": true` branches (matches
`content/subjects/math/<branch>/<component>/` directory count exactly):

- `number-and-arithmetic`: 10 (addition, division, factors, multiples, multiplication,
  negative-number, number-line, place-value, prime-number, subtraction)
- `fractions-and-ratios`: 8 (decimal, denominator, equivalent-fraction, fraction, numerator,
  percent, proportion, ratio)
- `algebra`: 10 (coefficient, constant, equation, expression, inequality, intercept, like-terms,
  slope, term, variable)
- `geometry`: 11 (angle, area, circle, line, perimeter, point, quadrilateral, ray, segment,
  triangle, volume)
- `data-and-statistics`: 10 (bar-chart, data-point, line-graph, mean, median, mode, outlier,
  probability, range, table)

4 branches are `"detailed": false` in `content/taxonomy/math.json` and have zero
`content/subjects/math/` folders: `measurement`, `graphs-and-functions`,
`trigonometry-foundations`, `calculus-foundations`. In `quantaora-app/src/data/hierarchy.ts:80-90`
each is `status: 'planned'` with no `route`. `quantaora-app/src/routes/Subjects.tsx:194-203`
renders any branch that is not `status: 'live'`/has no `route` as a disabled row with a
`<Clock/> Coming soon` badge (`opacity-60`, not a `<Link>`). This is the only "Coming soon" state
found anywhere in math — no component-level "coming soon"/locked state exists inside any of the
three live math lab routes (grepped `NumberSenseLab.tsx`, `MathManipulativesLab.tsx`,
`MathLab.tsx` for "coming soon"/"locked"/"placeholder": no matches besides an unrelated form
`placeholder="Your guess"` string).

## Route/CTA map (`quantaora-app/src/data/hierarchy.ts:80-90`, `quantaora-app/src/App.tsx:45-47`)

| Branch | `hierarchy.ts` route | Route table target (`App.tsx`) | Component file |
|---|---|---|---|
| `number-and-arithmetic` | `/app/labs/number-sense` | `<Route path="labs/number-sense">` (App.tsx:47) | `NumberSenseLab.tsx` |
| `fractions-and-ratios` | `/app/labs/math-manipulatives` | `<Route path="labs/math-manipulatives">` (App.tsx:46) | `MathManipulativesLab.tsx` |
| `geometry` | `/app/labs/math-manipulatives` (**same route as fractions-and-ratios**) | same | `MathManipulativesLab.tsx` |
| `data-and-statistics` | `/app/labs/math-manipulatives` (**same route as the two above**) | same | `MathManipulativesLab.tsx` |
| `algebra` | `/app/labs/functions` | `<Route path="labs/functions">` (App.tsx:45) | `MathLab.tsx` |

`quantaora-app/src/routes/BranchLab.tsx` (the generic `GenericViewer`-driven fallback at
`/app/labs/branch/:branchId`, App.tsx:60) is **not** the branch route for any live math branch —
every math branch has its own dedicated component. However, `BranchLab` is still reachable by
direct URL for any branch id, including math ones, because it reads `branchComponents(branchId)`
generically (`quantaora-app/src/data/branchModules.ts:48-50`).

---

## 1. Number Sense And Arithmetic — `/app/labs/number-sense` (`NumberSenseLab.tsx`)

All 10 components are addressed by `componentId` in a single `switch` (`NumberSenseLab.tsx:480-503`
drives auto-play; `NumberSenseLab.tsx:1181-1194` drives the rendered visual) and each renders its
**own dedicated component function** — no sharing:

| Component | Visual function | Notes |
|---|---|---|
| `addition` | `AdditionVisual` (NumberSenseLab.tsx:1205) | |
| `subtraction` | `SubtractionVisual` (:1228) | |
| `multiplication` | `MultiplicationVisual` (:1248) | array/grid model |
| `division` | `DivisionVisual` (:1267) | |
| `place-value` | `AbacusStage`/`AbacusModel` (:1312-1568), a real react-three-fiber `<Canvas>` 3D abacus with beads (`AbacusBead`, `AbacusRod`) and its own camera rig (`AbacusCameraRig`, :1478) | This is exactly the "abacus for place value" example named in the task brief — genuinely unique, not shared with any other component. |
| `number-line` | `NumberLineVisual` (:1569), built on shared `NumberLineSVG` (:1112) primitive | |
| `negative-number` | `NegativeNumberVisual` (:1590), also built on `NumberLineSVG` but with distinct negative-axis framing/controls | Shares the axis-drawing primitive with `number-line` but is a distinct concept-specific composition (negative shading, zero-crossing jump), not a copy-paste reuse of the whole component. |
| `factors` | `FactorsVisual` (:1610) | factor-pair layout |
| `multiples` | `MultiplesVisual` (:1635) | multiples-on-a-line |
| `prime-number` | `PrimeVisual` (:1661) | prime/composite tiling |

**Verdict: 10/10 unique, concept-specific visuals. 0 generic/reused. P0 fully met** for this
branch — this is the strongest of the 5 math branches.

---

## 2. Fractions And Ratios — `/app/labs/math-manipulatives` (`MathManipulativesLab.tsx`)

`FractionManipulative` (`MathManipulativesLab.tsx:1886-1968`) is the single render function for
**all 8** fractions-and-ratios components. It branches on `FRACTION_CUP_IDS =
new Set(['decimal', 'denominator', 'equivalent-fraction', 'fraction', 'numerator', 'percent'])`
(line 48):

- **6 of 8** ids (`decimal`, `denominator`, `equivalent-fraction`, `fraction`, `numerator`,
  `percent`) render the identical tap-to-fill square grid (lines 1904-1929) **plus** the identical
  3D `CupPanel`/`CupModel` drag-to-fill measuring cup (`MathStage`, lines 1005-1020, using the
  same sourced GLB `MEASURING_CUP_MODEL_URL = '/models/sourced/math-wave2/
  measuring-cup-milkandbanana.glb'`, line 47). The only per-id difference in the visual layer is
  one line of footer text (`componentId === 'percent' ? '...' : '...'`, line 1965) — the grid,
  the cup, the numerator/denominator readout, and the interaction (tap squares, drag cup fill)
  are byte-identical code paths across all 6 ids.
- **2 of 8** ids (`ratio`, `proportion`) render the "tap dots to mix the ratio" widget (lines
  1936-1963) instead of the cup, gated by `!FRACTION_CUP_IDS.has(componentId)`. Critically,
  `ratio` and `proportion` are **not distinguished from each other anywhere** in the interactive
  layer: `readout()` groups them with `if (componentId === 'ratio' || componentId === 'proportion')`
  (line 320) returning one shared `'Ratio challenge'` object, and `challengeFor()` does the same
  (line 545, shared object literal). The visual, the readout copy, and the challenge/checkpoint
  are all identical for `ratio` and `proportion` — a child cannot tell which of the two concepts
  they are looking at. This is a genuine content gap: `content/subjects/math/fractions-and-ratios/
  ratio/lesson.md` ("A ratio compares two quantities — 3 red beads to 5 blue beads is written
  3:5.") and `.../proportion/lesson.md` ("A proportion is a statement that two ratios are equal —
  3:5 = 6:10.") are correctly differentiated at the authoring level, but none of that distinction
  survives into the interactive lab.
- Hotspots are also generic at the **domain** level, not the component level: for every one of
  the 8 fractions-and-ratios ids, `MathManipulativesLab.tsx:709-716` returns the exact same 3
  hotspots (`whole-hotspot`/"Whole", `part-hotspot`/"Selected parts", `ratio-hotspot`/"Ratio mix"),
  regardless of which of the 8 concepts is active.

**Verdict: 0/8 have a truly unique per-concept visual. 8/8 generic/reused** — 6 share one widget
(cup+grid) differentiated only by a caption string, 2 share a second widget with **zero**
differentiation (visual, readout, and challenge text are all identical for `ratio` vs.
`proportion`). P0 gap: fractions-and-ratios is the weakest branch in the audit.

---

## 3. Algebra — `/app/labs/functions` (`MathLab.tsx`)

This is the branch with the most severe structural issue: **the route the branch actually points
to does not render any of the 10 authored algebra components at all.**

- `quantaora-app/src/data/hierarchy.ts:83` sets `algebra` → `componentCount: 5, route:
  '/app/labs/functions'`.
- `MathLab.tsx` imports `scenarios, scenarioById` from `quantaora-app/src/data/functions.ts`
  (`MathLab.tsx:3`) and renders **only** those 5 story scenarios: `steady-savings`, `taxi-fare`,
  `tank-draining`, `balance-scale`, `candle-burning` (`functions.ts:16-421`). It never imports or
  reads `branchComponents('algebra')` / `BRANCH_COMPONENTS.algebra`
  (`quantaora-app/src/data/branchModules.ts:40`) anywhere in the file (confirmed by search — only
  `Labs.tsx`, `Subjects.tsx`, and `BranchLab.tsx` reference `branchComponents`/
  `BRANCH_COMPONENTS`).
- The 5 story scenarios each get a genuinely unique, bespoke hand-drawn CSS/DOM visual inside
  `AlgebraObject` (`MathLab.tsx:59-215`, switched on `kind`): a savings jar filling with coins
  (`kind === 'savings'`, :104-118), a taxi driving along a road (`kind === 'taxi'`, :121-134), a
  tank draining water (`kind === 'tank'`, :136-145), a candle burning down (`kind === 'candle'`,
  :147-154), and a balance scale with weighted pans (`kind === 'balance'`, :156-178) — plus a
  shared, linked `LinearGraph` (draggable slope/intercept line) and a live x/y table. This is a
  well-built, concept-appropriate lab for **linear functions and one equation-balancing scenario**
  — but it is a different taxonomy scope than the 10 authored `algebra` components.
- The 10 real `algebra` components — `coefficient`, `constant`, `equation`, `expression`,
  `inequality`, `intercept`, `like-terms`, `slope`, `term`, `variable` — are fully authored in
  `content/subjects/math/algebra/<id>/{module.json,lesson.md,quiz.json,model-metadata.json,
  glossary.json,standards.json}` and compiled into `quantaora-app/src/data/generated/algebra.ts`
  (confirmed 10 real component `"id"` values, verified against 30 additional `hs-*` hotspot ids
  that also carry an `"id"` field and were excluded from the count). They are registered in
  `BRANCH_COMPONENTS.algebra` (`branchModules.ts:40`) and folded into the global `ALL_CONTENT` /
  `ALL_BY_ID` used by `resolveContent()` (`quantaora-app/src/data/allContent.ts:14-38`), so
  `resolveContent('coefficient')` etc. resolve successfully and these 10 ids count toward
  `Grownups.tsx`'s global `totalComponents`/mastery stats (`quantaora-app/src/routes/
  Grownups.tsx:152-153`).
- But **no route in the app ever renders them by id.** The only code that reads
  `BRANCH_COMPONENTS.algebra` is `BranchLab.tsx` (generic fallback, reachable only at
  `/app/labs/branch/algebra` — not linked from anywhere: grepped every `.tsx` file for
  `labs/branch`, the only hits are `App.tsx` (route def), `BranchLab.tsx` itself,
  `components/landing/Nav.tsx`/`Hero.tsx` (both link to `/app/labs/branch/atoms-and-elements`,
  chemistry, not math), and `FirstFlight.tsx:37` (links to `/app/labs/branch/geometry`, not
  algebra). There is no in-app link, search result, or CTA anywhere that sends a user to
  `/app/labs/branch/algebra`), `Labs.tsx` (only for the componentCount badge/asset summary, not
  for rendering), and `Subjects.tsx` (only for search-match text, still links out to
  `b.route = '/app/labs/functions'`, never to the 10 concept components).
- **Count discrepancy, self-inconsistent within the app itself:** `hierarchy.ts:83` hardcodes
  `componentCount: 5` for algebra (matching the 5 scenarios), which is what
  `Subjects.tsx`'s `Live · {b.componentCount}` badge shows (`Subjects.tsx:180-185`). But
  `Labs.tsx:82` computes `componentCount: components.length || branch.componentCount || 0` where
  `components = branchComponents('algebra')` — that resolves to the 10 real components, not 5, so
  **the Labs page and the Subjects page show different component counts for the same branch** (10
  vs. 5), and neither count corresponds to what a user can actually interact with when they open
  the branch (5 scenarios, none sharing an id with the 10 "componentCount" items on Labs).

**Verdict: 10/10 authored algebra components are unreachable through any discoverable in-app
route (P0 — content investment with zero learner-facing surface).** The 5 scenarios that *are*
reachable are high quality and fully unique (5/5 unique visuals), but they cover a narrower,
differently-scoped slice (linear functions + one equation) than the taxonomy's 10 algebra
components, and don't reuse any of that authored content.

---

## 4. Geometry — `/app/labs/math-manipulatives` (`MathManipulativesLab.tsx`, `GeometryManipulative`)

`GeometryManipulative` (`MathManipulativesLab.tsx:1307-1333`) `switch`es on all 11 ids and every
case returns its own dedicated function — **no default-case sharing** (contrast with
data-and-statistics below):

| Component | Visual function |
|---|---|
| `ray` | `RayManipulative` (:1380) |
| `point` | `PointManipulative` (:1433) |
| `line` | `LineManipulative` (:1469) |
| `segment` | `SegmentManipulative` (:1511) |
| `triangle` | `TriangleManipulative` (:1555) |
| `quadrilateral` | `QuadrilateralManipulative` (:1626) |
| `circle` | `CircleManipulative` (:1679) |
| `perimeter` | `PerimeterManipulative` (:1726) |
| `area` | `AreaManipulative` (:1775) |
| `volume` | `VolumeManipulative` (:1826), a pseudo-3D skewed-block SVG (depth slider) |
| `angle` | `AngleManipulative` (:1335), also the `default:` case (:1329-1331) |

A code comment at `MathManipulativesLab.tsx:1974-1978` documents that this was **not** always
true: "Bar Chart, Data Point, Line Graph, Probability, and Table used to all fall through to the
shared bar-chart-plus-summary widget below. They now each render their own distinct widget" — i.e.
a prior wave fixed data-and-statistics' worst sharing but geometry was apparently never a problem
(all 11 geometry cases were already distinct in this pass).

The same generic-hotspot caveat as fractions applies: all 11 geometry ids share the same 3
domain-level hotspots (`angle-hotspot`/"Angle", `area-hotspot`/"Inside", `edge-hotspot`/"Edge",
`MathManipulativesLab.tsx:702-707`) rather than per-concept hotspots (e.g. `point` gets an
"Inside"/area hotspot despite a point having no area).

**Verdict: 11/11 unique, concept-specific interactive visuals. 0 generic/reused shells.** Second
strongest branch after number-and-arithmetic; only ding is the shared, sometimes-mismatched
hotspot labels (minor, P1).

---

## 5. Data And Statistics — `/app/labs/math-manipulatives` (`MathManipulativesLab.tsx`, `DataManipulative`)

`DataManipulative` (`MathManipulativesLab.tsx:1979-1993`) `switch`es on `componentId`:

| Component | Visual function |
|---|---|
| `bar-chart` | `BarChartManipulative` (:1996) |
| `data-point` | `DataPointManipulative` (:2046) |
| `line-graph` | `LineGraphManipulative` (:2093) |
| `probability` | `ProbabilityManipulative` (:2147), spinner wheel |
| `table` | `TableManipulative` (:2220) |
| **`mean`, `median`, `mode`, `range`, `outlier`** (`default:` case) | **`StatsBarManipulative`** (:2277-2333) — one shared function for all 5 |

`StatsBarManipulative` renders one fixed SVG: a draggable bar chart plus a "Summary" panel that
**always shows all four of mean/median/range/mode simultaneously** (`StatPill` calls at lines
2324-2327), regardless of which of the 5 stat concepts is selected. Concretely:

- `mean`, `median`, `mode`, and `range` render **pixel-for-pixel identical output** — same SVG,
  same bar colors (`fill={isOutlier || componentId === 'outlier' ? '#D96B5A' : '#6B85A8'}`, line
  2304, which only special-cases `'outlier'`), same 4-stat summary panel, same footer copy (line
  2330's ternary only branches on `componentId === 'outlier'`). There is **no code path that
  changes the rendered output between `mean`, `median`, `mode`, and `range`** — a child looking at
  the "Median" component page and the "Mode" component page sees the literal same widget with the
  same 4 numbers highlighted, with all differentiation pushed entirely into the sidebar
  text (`readout()`/`challengeFor()`), not the visual/interactive layer.
- `outlier` gets one small differentiator: its own bar (`entry.field === 'outlier'`) is colored
  red (`#D96B5A`) instead of blue, and the footer caption changes. Still the same shared
  component, same summary panel showing all 4 stats.
- The 5 components that *do* get dedicated widgets (`bar-chart`, `data-point`, `line-graph`,
  `probability`, `table`) are genuinely differentiated — this was an explicit prior-wave fix
  (comment at :1974-1978 references "Wave 11 fix (docs/reviews/wave10-math-manipulatives.md)").
  That fix did not extend to the 5 statistics-of-a-dataset concepts.
- Same domain-level generic-hotspot issue as the other two branches on this route: all 10
  data-and-statistics ids share the same 3 hotspots (`data-hotspot`/"Data points",
  `mean-hotspot`/"Mean", `spread-hotspot`/"Spread", `MathManipulativesLab.tsx:717-722`) — so, for
  example, opening `probability` or `table` still shows a "Mean" hotspot, a label that has no
  connection to either concept.

**Verdict: 5/10 unique (`bar-chart`, `data-point`, `line-graph`, `probability`, `table`); 5/10
generic/reused (`mean`, `median`, `mode`, `range`, `outlier` all share `StatsBarManipulative`, with
`mean`/`median`/`mode`/`range` being 100% visually identical to each other).** P0 gap — this is
the branch's core, most teachable content (the four central measures of center/spread) reduced to
one undifferentiated widget.

---

## P0 vs P1 completion need (by branch)

| Branch | P0 need | P1 need |
|---|---|---|
| `number-and-arithmetic` | None found — fully differentiated | — |
| `fractions-and-ratios` | Build distinct visuals for the 8 ids currently sharing 2 widgets; at minimum give `ratio` and `proportion` *any* visible difference (currently 100% identical incl. challenge/readout text) | Per-concept hotspot labels instead of the shared 3 |
| `algebra` | Wire the 10 authored `content/subjects/math/algebra/*` components into a reachable route (either extend `MathLab.tsx` to read `branchComponents('algebra')`, or point the branch route at `BranchLab.tsx`/a dedicated lab); reconcile the `componentCount: 5` vs. 10 mismatch between `hierarchy.ts`, `Subjects.tsx`, and `Labs.tsx` | — |
| `geometry` | None found — fully differentiated | Per-concept hotspot labels instead of the shared 3 |
| `data-and-statistics` | Build distinct visuals for `mean`, `median`, `mode`, `range` (currently byte-identical) and a real differentiator for `outlier` beyond bar color | Per-concept hotspot labels instead of the shared 3 |

---

## Summary table

| Branch | Components (authored) | Dedicated route | Unique concept-specific visual | Generic/reused visual | Unreachable (no route renders it) | "Coming soon" |
|---|---:|---:|---:|---:|---:|---:|
| number-and-arithmetic | 10 | 10 (`NumberSenseLab.tsx`) | 10 | 0 | 0 | 0 |
| fractions-and-ratios | 8 | 8 (`MathManipulativesLab.tsx`) | 0 | 8 | 0 | 0 |
| algebra | 10 | 0* | 0 | 0 | 10 | 0 |
| geometry | 11 | 11 (`MathManipulativesLab.tsx`) | 11 | 0 | 0 | 0 |
| data-and-statistics | 10 | 5 (`MathManipulativesLab.tsx`) | 5 | 5 | 0 | 0 |
| measurement | 0 (not authored) | 0 | — | — | — | 1 (branch-level) |
| graphs-and-functions | 0 (not authored) | 0 | — | — | — | 1 (branch-level) |
| trigonometry-foundations | 0 (not authored) | 0 | — | — | — | 1 (branch-level) |
| calculus-foundations | 0 (not authored) | 0 | — | — | — | 1 (branch-level) |
| **Total (authored, 5 live branches)** | **49** | **34** | **26** | **13** | **10** | **4 branch-level** |

\* `algebra`'s route (`/app/labs/functions` → `MathLab.tsx`) exists and is high quality, but
renders 5 story scenarios from `functions.ts` that share no ids with the 10 authored
`content/subjects/math/algebra/*` components — so those 10 have 0 dedicated route coverage even
though the branch itself is "live."

Prior-audit context only (not used to derive any figure above): `docs/COVERAGE-AUDIT-2026-08-18.md`
and `docs/PROJECT-STATUS.md` were not opened for this pass per the task's instruction to base every
claim on code read directly in this session.
