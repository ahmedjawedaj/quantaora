# Wave 12 Visual Acceptance Review — Math / Data & Statistics + Measuring Cup

- Date: 2026-08-18
- Scope: `math-data` — MathManipulativesLab (`src/routes/MathManipulativesLab.tsx`) Data &
  Statistics manipulatives + the measuring-cup fraction companion panel.
- Target: `http://127.0.0.1:5174/app/labs/math-manipulatives`
- Viewports: Desktop 1440x900, Mobile 390x844
- Reviewer: isolated Playwright Chromium (own `--user-data-dir` profile), driver scripts run via
  Node/Bash, not the shared MCP browser tool.
- Method note: read `src/routes/MathManipulativesLab.tsx` first. The Data & Statistics branch
  contains 10 taxonomy ids (`mean`, `median`, `mode`, `range`, `outlier`, `bar-chart`,
  `data-point`, `line-graph`, `probability`, `table`), but `mean`/`median`/`mode`/`range`/`outlier`
  all render through the same `StatsBarManipulative` widget (`DataManipulative`'s `default` case,
  line 1937 in the source). The **5 visually/behaviorally distinct** data manipulatives are
  `BarChartManipulative`, `DataPointManipulative`, `LineGraphManipulative`,
  `ProbabilityManipulative`, and `TableManipulative` — these are the 5 sampled per the assignment,
  plus the measuring cup (6 total). This grouping (5 stats ids sharing one widget) was not itself
  probed as a 6th/7th sample per the assignment's explicit "6 total" scope; flagged as **unproven**
  below rather than guessed at.

## Summary table

| # | Component | Viewport | Verdict | Severity | Evidence |
|---|---|---|---|---|---|
| 1 | Bar Chart | Desktop 1440x900 | PASS | — | `data-01-bar-chart-desktop.png`, `data-01-bar-chart-after-interaction-desktop.png` |
| 1 | Bar Chart | Mobile 390x844 | PASS | — | `data-01-bar-chart-mobile.png`, `data-01-bar-chart-after-interaction-mobile.png` |
| 2 | Data Point | Desktop 1440x900 | PASS (P2 noted) | P2 | `data-02-data-point-desktop.png`, `data-02-data-point-after-interaction-desktop.png` |
| 2 | Data Point | Mobile 390x844 | PASS | — | `data-02-data-point-mobile.png`, `data-02-data-point-after-interaction-mobile.png` |
| 3 | Line Graph | Desktop 1440x900 | PASS (P2 noted) | P2 | `data-03-line-graph-desktop.png`, `data-03-line-graph-after-interaction-desktop.png` |
| 3 | Line Graph | Mobile 390x844 | PASS (P2 noted) | P2 | `data-03-line-graph-mobile.png`, `data-03-line-graph-after-interaction-mobile.png` |
| 4 | Probability | Desktop 1440x900 | PASS | — | `data-04-probability-before-spin-desktop.png`, `data-04-probability-after-spin-desktop.png` |
| 4 | Probability | Mobile 390x844 | PASS | — | `data-04-probability-before-spin-mobile.png`, `data-04-probability-after-spin-mobile.png` |
| 5 | Table | Desktop 1440x900 | FAIL | P1 | `data-05-table-desktop.png`, `data-05-table-hotspot-overlap-test-desktop.png` |
| 5 | Table | Mobile 390x844 | FAIL | P1 | `data-05-table-mobile.png`, `data-05-table-after-interaction-mobile.png` |
| 6 | Measuring cup | Desktop 1440x900 | PASS | — | `measuring-cup-desktop.png`, `measuring-cup-after-interaction-desktop.png` |
| 6 | Measuring cup | Mobile 390x844 | PASS | — | `measuring-cup-mobile.png`, `measuring-cup-after-interaction-mobile.png` |

Overall: 5 of 6 components PASS cleanly at both viewports; 1 of 6 (Table) FAILs at both viewports
for different reasons (P1 each). Two P2 polish items also noted (see below). No app crash, no
blank canvas, no unreachable route.

## P0 — Blocking

None observed. Dev server was reachable at `http://127.0.0.1:5174/app/labs/math-manipulatives`
(HTTP 200). No route crashed, no blank/black canvas, no uncaught page error (`pageerror`) was
recorded on either viewport for any of the 6 components tested.

## P1 — Significant

### 1. Table: "Data" hotspot marker blocks the row C "+" button (Desktop 1440x900)
The floating hotspot marker (id `data-hotspot`, rendered at fixed `x:78%, y:57%` of the canvas
card regardless of which data widget is active) lands directly on top of the Table component's
row **C** "Increase" (`+`) button on desktop. This is not just a visual overlap — a real
Playwright click on `button[aria-label="Increase C"]` **fails** with
`<button ... class="absolute ... rounded-full ...">…</button> intercepts pointer events`, i.e. the
browser itself refuses the click because the hotspot button is the top-most element at that pixel.
A user clicking there would hit the hotspot pill instead of incrementing row C.
- Evidence: `review-screenshots/wave12-2026-08-18/math-data/data-05-table-hotspot-overlap-test-desktop.png`
  (zoomed crop confirms the blue dot sits centered on the "+" glyph of row C), plus the raw
  Playwright error log (captured during this review, not saved as a file): `locator.click:
  Timeout 3000ms exceeded ... intercepts pointer events`.
- Not reproduced on mobile 390x844: the same hotspot dot visually overlaps row C's controls too,
  but at that viewport's layout the "+" button remained clickable (verified: a real click on
  `Increase C` succeeded and the value/][total updated, `4,5,7,9`→total 25 to `4,6,7,9`→total 26).
  See `data-05-table-mobile-hittest.png`.
- Severity: P1 — a documented "common toolbar/control reachable" requirement is violated for one
  specific control on desktop; the other 3 rows' +/- buttons are unaffected.

### 2. Table: title and column headers are clipped off-canvas (Mobile 390x844)
On mobile, the Table component's "Data table" caption and the "Row / Value / Change" column
header row are not visible anywhere in the rendered canvas card. The visible card starts directly
at data row "A", with the heading and header row rendered outside the visible/painted area (the
`TableManipulative`'s content is taller than the fixed-aspect-ratio canvas card at this viewport,
and the card's `overflow-hidden` clips the top of the vertically-centered content). A learner
opening Table on a phone has no way to see that the columns are "Row / Value / Change" or that
the block is titled "Data table" without already knowing the app.
- Evidence: `review-screenshots/wave12-2026-08-18/math-data/data-05-table-mobile.png`. A tighter
  crop confirming the heading/header row are absent from the painted output was inspected during
  this review (crop of y=60–260 of that same file shows toolbar → banner pill → row "A" with
  nothing in between).
- Severity: P1 — matches the checklist's "panels do not overflow their containers / get cut off"
  failure condition; column meaning is not communicated at this viewport.

## P2 — Polish

### 3. Data Point: "On axis" meter value truncates on desktop
The bottom meter strip's "ON AXIS" value reads `single poi…` (mid-word truncation of "single
point") in the compact meter card on desktop 1440x900. The same meter renders in full as
"single point" on mobile 390x844 (narrower meter grid, but full-width text wraps/fits there).
- Evidence: `review-screenshots/wave12-2026-08-18/math-data/data-02-data-point-desktop.png`
  (compare to `data-02-data-point-mobile.png`, where the same label is not truncated).
- Severity: P2 — value is still inferable from the detail panel's "On axis: single point" key fact
  in the right rail; only the compact meter chip clips.

### 4. Line Graph: helper caption text clipped at the canvas's right edge (Desktop + Mobile)
The instructional caption under the Line Graph chart — "Drag any point up or down - the
connecting line traces the trend, no bars needed." — is cut off mid-word at the canvas card's
right edge on both viewports (reads "...no bars needed" with the final letter(s) clipped by the
card boundary). Confirmed via pixel crop on both the desktop and mobile screenshots.
- Evidence: `review-screenshots/wave12-2026-08-18/math-data/data-03-line-graph-desktop.png`,
  `review-screenshots/wave12-2026-08-18/math-data/data-03-line-graph-mobile.png`.
- Severity: P2 — cosmetic clipping of a supplementary instruction string; axis labels, point
  values, and key-fact panel text (which restate the same information) are all legible.

### 5. Sidebar nav icon reuse across Bar Chart / Data Point / Line Graph / Outlier (Desktop)
`COMPONENT_ICONS` (in `MathManipulativesLab.tsx`) maps `bar-chart`, `data-point`, `line-graph`,
and `outlier` all to the same Lucide `BarChart3` glyph, so the left sidebar list shows an
identical icon next to "Bar Chart" and "Data Point" (confirmed visually — both rows show the same
bars-icon). The actual manipulative canvases themselves are fully distinct (bars vs. single point
on a number line vs. connected line vs. stats-bar summary — verified above), so this is a
nav-list icon affordance nit only, not a content/behavior collision.
- Evidence: crop of `review-screenshots/wave12-2026-08-18/math-data/data-01-bar-chart-desktop.png`
  sidebar region (Bar Chart and Data Point rows both show the bars glyph).
- Severity: P2 — purely a left-nav iconography nit; does not affect the canvas content itself.

## What explicitly PASSED

- **Bar Chart** (both viewports): distinct 4-bar vertical bar chart, category axis (A/B/C/Out) and
  value axis legible, value labels on top of each bar, "Total" readout. Dragging bar A from 4→12
  produced a visibly taller bar, updated "Tallest" (Out(9)→A(12)) and "Total" (25→33) key facts —
  clear, correct cause/effect. No clipping at either viewport.
- **Probability**: genuinely distinct spinner-wheel visualization (pie wedges + legend %s), clearly
  different from Bar Chart/Line Graph. Tapping "Spin" rotated the wheel and produced a "Landed on
  B!" result banner — clear, legible cause/effect at both viewports. No clipping.
- **Data Point**: distinct single-point-on-a-number-line visualization, clearly different from Bar
  Chart. Dragging the point from 4→14 updated the Value/Position key facts correctly at both
  viewports (aside from the P2 truncation noted above).
- **Line Graph**: distinct connected-line-with-dots visualization; dragging point A from 4→12
  correctly flipped the Trend readout from "rising" to "falling" — correct cause/effect, concept-
  correct (trend is genuinely reversed by the drag). No clipping of the chart itself at either
  viewport (only the caption text clips, per P2 above).
- **Measuring cup** (tested via the `decimal` and `fraction` fraction ids, both members of
  `FRACTION_CUP_IDS`): real 3D GLB cup model with a translucent liquid mesh that fills
  proportionally, alongside a synced tap-grid and hundred-grid readout. Dragging the cup's fill
  slider from 5/10 to 9/10 (desktop) and 3/8 to 7/8 (mobile) correctly updated the 3D liquid level,
  the tap-grid selection, the decimal/percent readouts, and the key-facts panel simultaneously —
  strong, legible, multi-channel cause/effect. No clipping, no blank canvas, model well framed at
  both viewports.

## Console / page errors

- **Desktop 1440x900**: `THREE.Clock: This module has been deprecated. Please use THREE.Timer
  instead.` (warning, one-time); four `[.WebGL-...]GL Driver Message (OpenGL, Performance,
  GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` warnings (last one self-reports "this
  message will no longer repeat"). No `pageerror` (uncaught exception) events.
- **Mobile 390x844**: `THREE.Clock: This module has been deprecated. Please use THREE.Timer
  instead.` (warning, one-time). No `pageerror` events, no GPU-stall warnings observed.
- These are pre-existing library-level/perf warnings unrelated to the Data & Statistics or
  measuring-cup UI; no functional error was observed for any of the 6 components at either
  viewport.

## Unproven / not verified (explicitly flagged, not guessed)

- The 5 taxonomy ids that share `StatsBarManipulative` (`mean`, `median`, `mode`, `range`,
  `outlier`) were **not** individually screenshotted or interaction-tested in this pass — the
  assignment scoped exactly "5 data/statistics components + measuring cup (6 total)", and the 5
  visually distinct manipulative *widgets* (Bar Chart, Data Point, Line Graph, Probability, Table)
  were sampled as that set. Whether the shared stats-bar widget itself has any of the same
  hotspot-overlap or overflow issues found in Table was not checked — unproven either way.
- The `Fraction` (id `fraction`) cup instance specifically was screenshotted only on mobile; the
  desktop cup screenshots ended up testing `Decimal` (id `decimal`) instead, because the
  desktop nav-selection helper matched on substring text and `Decimal`'s meta subtitle
  ("Fractions And Ratios") also contains the substring "Fraction", so it was selected first. Both
  ids are members of `FRACTION_CUP_IDS` and the cup panel is the same component regardless of
  which fraction id is active, so this is not believed to invalidate the finding, but the other 4
  cup-eligible ids (`denominator`, `equivalent-fraction`, `numerator`, `percent`) were not
  individually re-verified on desktop — unproven for those specific ids, though the panel is
  identical code (`CupPanel`) for all six.
- Keyboard-only reachability of controls (tab order, focus rings) was not tested — this review
  used pointer/mouse and touch-equivalent drag simulation only.

## Screenshots (all under `review-screenshots/wave12-2026-08-18/math-data/`)

```
data-01-bar-chart-desktop.png
data-01-bar-chart-mobile.png
data-01-bar-chart-after-interaction-desktop.png
data-01-bar-chart-after-interaction-mobile.png
data-02-data-point-desktop.png
data-02-data-point-mobile.png
data-02-data-point-after-interaction-desktop.png
data-02-data-point-after-interaction-mobile.png
data-03-line-graph-desktop.png
data-03-line-graph-mobile.png
data-03-line-graph-after-interaction-desktop.png
data-03-line-graph-after-interaction-mobile.png
data-04-probability-desktop.png
data-04-probability-mobile.png
data-04-probability-before-spin-desktop.png
data-04-probability-before-spin-mobile.png
data-04-probability-after-spin-desktop.png
data-04-probability-after-spin-mobile.png
data-05-table-desktop.png
data-05-table-mobile.png
data-05-table-after-interaction-desktop.png
data-05-table-after-interaction-mobile.png
data-05-table-hotspot-overlap-test-desktop.png
data-05-table-mobile-hittest.png
measuring-cup-desktop.png
measuring-cup-mobile.png
measuring-cup-after-interaction-desktop.png
measuring-cup-after-interaction-mobile.png
```
