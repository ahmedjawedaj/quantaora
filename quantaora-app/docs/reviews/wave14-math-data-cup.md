# Wave 14 Visual QA — Math Manipulatives: Data table + Measuring cup

Reviewer: Wave 14 reviewer #6 (parallel review)
Date: 2026-08-18
Route: `http://127.0.0.1:5174/app/labs/math-manipulatives` (`src/routes/MathManipulativesLab.tsx`)
Scope: Data & Statistics table (`table` component id) + fraction/measuring-cup companion panel
(`decimal`, `denominator`, `equivalent-fraction`, `fraction`, `numerator`, `percent` component ids,
all sharing `/models/sourced/math-wave2/measuring-cup-milkandbanana.glb`).
Viewports: Mobile 390x844, Desktop 1440x900. Method: local Playwright (chromium) instance driven
via `node` scripts in an isolated `/tmp` scratch dir, `console`/`pageerror` listeners attached for
the full session.

Screenshot dir: `review-screenshots/wave14-2026-08-18/math-data-cup/`
Console/page-error transcript: `review-screenshots/wave14-2026-08-18/math-data-cup-console.log`

## Verdict summary

Overall: **PASS with P2 notes**. No P0 or P1 findings. Both the data table and the measuring-cup
fraction interaction render correctly and communicate cause/effect clearly at both viewports. No
console/page errors were observed (only benign warnings, see below).

## 1. Data & Statistics table

### 1a. Headers fit within columns/container — PASS (mobile) / PASS (desktop)

- Desktop 1440x900: headers "Row", "Value", "Change" render fully, left/left/right-aligned,
  no truncation, no overlap with the +/- buttons. Evidence: `math-data-table-headers-desktop.png`.
- Mobile 390x844: same three headers render fully inside the card, no truncation, no horizontal
  scroll. `document.documentElement.scrollWidth > clientWidth` measured `false` at both viewports
  (confirmed programmatically, not just visually). Evidence: `math-data-table-headers-mobile.png`.
- Table extracted via DOM query returned exactly `["Row","Value","Change"]` at both viewports —
  matches what's visually rendered, no hidden/clipped header text.

**P2 (polish, both viewports):** Small unlabeled blue "hotspot" dots (from `HotspotButton`,
rendered without a label because Labels are off by default) visually sit on top of the data
table — one dot lands directly over/inside the row-A/row-B boundary area of the table body on
both mobile and desktop. They don't block clicking the +/- buttons (confirmed — see 1b below,
increment still worked), but visually they read as stray debug-looking markers floating over
table cells, which is a bit odd for a "Table" manipulative whose canvas isn't really a spatial
3D scene. See crops taken from `math-data-table-headers-desktop.png` /
`math-data-table-headers-mobile.png` (small filled circles over the "A"/"B" rows, roughly
between the Row and Value columns).

### 1b. Row C "+"/increment control updates the table — PASS (mobile) / PASS (desktop)

No literal "add a new row" affordance exists — the table always has 4 fixed rows (A, B, C, Out);
the closest equivalent interactive control per row is a "+"/"-" pair that bumps that row's data
value (`aria-label="Increase C"` / `"Decrease C"`). This matches the task's "(or equivalent)"
allowance and was tested directly:

- Desktop: clicked `Increase C` → Row C value **5 → 6**, Total row **25 → 26**, the right-side
  DetailPanel "Total" key fact **25 → 26**, "Values" key fact **4, 5, 7, 9 → 4, 6, 7, 9**, and the
  bottom "Rows/Total/Values" meter chips below the canvas also updated in lockstep. Evidence:
  `math-data-row-c-add-desktop.png` (compare to `math-data-table-headers-desktop.png` for before
  state).
- Mobile: identical result, Row C **5 → 6**, Total **25 → 26**, same synced updates in the
  compact mobile meter chips. Evidence: `math-data-row-c-add-mobile.png`.

Cause/effect for this control is clear and immediate at both viewports — a strong example of the
"learning interactions communicate cause/effect" bar.

## 2. Measuring cup / fraction companion panel

### 2a. Cup canvas renders (non-blank) — PASS (mobile) / PASS (desktop)

- Both viewports: the cup 3D canvas (a small companion panel, `absolute inset-y-2 right-2`,
  ~34-38% of the stage width) shows a clearly rendered ceramic/glass measuring-cup mesh with
  visible handle, rim, and horizontal measurement-line bands, plus a translucent liquid fill
  cylinder inside — not blank, black, or white. Confirmed programmatically too: `page.evaluate`
  read back `canvas.width/height` and a live `webgl`/`webgl2` context for the cup's `<canvas>` at
  both viewports (mobile: 124x154 with context; desktop: 206x368 with context).
- No `GlbErrorBoundary` fallback ("This 3D measuring cup model couldn't load") appeared in any
  screenshot, and no `[MathManipulativesLab] Measuring cup model failed to load.` warning appeared
  in the console log — the GLB loaded successfully both times.
- Model appears centered/framed within its small container at both viewports, not clipped by the
  panel bounds. Evidence: `math-cup-fraction-drag-before-mobile.png`,
  `math-cup-fraction-drag-before-desktop.png`.

### 2b. Fraction drag interaction visibly updates the fill level — PASS (mobile) / PASS (desktop)

Tested by pointer-dragging inside the cup's drag layer (`aria-label="Drag to change how full the
cup is"`) from near the bottom of the panel to near the top:

- **Desktop** (landed on the `decimal` component, which is one of the six
  `FRACTION_CUP_IDS` members, so the cup + drag mechanism under test is identical to the
  `fraction` id): fill label read **"5/10 full" → "9/10 full"**, and the liquid cylinder inside
  the cup visibly rose from roughly half-full to near the rim between the two screenshots. The
  tap-grid selector and Fraction/Decimal/Hundred-grid key-fact numbers to the left/right updated
  in the same action (5/10 → 9/10, 0.50 → 0.90, 50/100 → 90/100). Evidence:
  `math-cup-fraction-drag-before-desktop.png` → `math-cup-fraction-drag-after-desktop.png`.
- **Mobile** (landed on the `fraction` component itself, confirmed via the "Component 15 of 29 /
  Fraction" mobile chip strip): fill label read **"3/8 full" → "7/8 full"**, liquid visibly rose
  from ~40% to ~85% of the cup's height, and the Numerator/Denominator/Simplified key-fact chips
  updated **3 → 7** (numerator) in sync. Evidence: `math-cup-fraction-drag-before-mobile.png` →
  `math-cup-fraction-drag-after-mobile.png`.

Cause/effect here is legible and immediate at both viewports: dragging produces a visible liquid
level change plus synchronized numeric readouts.

**P2 (polish, informational only, both viewports):** the GLB is named
`measuring-cup-milkandbanana.glb`, but the liquid fill renders as a blue-gray/slate color rather
than a milk-like white/cream tone. Purely a color-choice observation, not a functional defect —
flagging since the asset's own filename implies a different liquid color language.

### 2c. Panel layout / no overflow — PASS (mobile) / PASS (desktop)

- Desktop: the "Drag to fill the cup" panel sits cleanly in the top-right corner of the shared
  stage card, does not overlap the tap-grid selector to its left, and its own fill-fraction label
  ("5/10 full" etc.) stays inside the panel with no text clipping.
- Mobile: same panel, proportionally larger (min-width 108px, up to 38% of the narrower stage),
  layered as a rounded card over the shared stage background; it does not visually collide with
  the tap-grid squares, which remain fully visible to its left. No overflow/clipping observed at
  this narrower viewport.
- Toolbar (rotate/play/isolate/section/compare/zoom/full/more/reset): fully visible, one icon-only
  row at mobile (no truncation, all icons distinguishable, fits comfortably inside 390px width —
  crop reviewed directly), and a labeled vertical rail at desktop with no clipped labels.

## Console / page errors

Full transcript: `review-screenshots/wave14-2026-08-18/math-data-cup-console.log`. No
`pageerror` events and no `console.error` events were recorded at either viewport across the
entire table + cup test sequence. Only benign warnings appeared, verbatim:

```
[mobile] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[mobile] console.warning: [.WebGL-0x10400520a00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[mobile] console.warning: [.WebGL-0x10400520a00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[mobile] console.warning: [.WebGL-0x10400520a00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[mobile] console.warning: [.WebGL-0x10400520a00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[desktop] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

These are library-level (three.js deprecation notice) and GPU-driver-level (readback performance
notice, Chromium ANGLE/Metal backend on this machine) — not application bugs, and not visible to
end users in the UI.

## No internal QA / debug language leaked into the UI

None observed in any of the six captured screenshots — no lorem ipsum, TODO strings, internal
component names, or test scaffolding visible in the table, cup panel, key-facts panel, lesson/
checkpoint/experiment/notebook/real-world tray, or toolbar at either viewport.

## Unproven / not covered

- Other four `FRACTION_CUP_IDS` members (`denominator`, `equivalent-fraction`, `numerator`,
  `percent`) were not individually screenshotted — only `decimal` (desktop) and `fraction`
  (mobile) were directly exercised. Since all six share the exact same `CupPanel`/`CupModel`/
  `CupDragLayer` code path and only the numerator/denominator defaults differ, this is treated as
  a strong (not certain) proxy for the other four; genuinely unproven for the remaining four ids.
- Cross-section/xray toggle ("Section" in the desktop toolbar) appeared visually
  grayed/lower-contrast in the cup view but was not clicked/tested — not in this task's assigned
  scope (only table headers, row-C add, and cup fill-drag were in scope).
- Other Data & Statistics table interactions (e.g. dragging bars in the Bar Chart/Stats-bar
  widgets, other rows' +/- buttons, the "-" decrement direction) were not exercised — only Row C
  "+" was tested per the assigned task.
- Auto-rotate, isolate, compare, and zoom controls on the cup/table canvases were not exercised —
  out of this task's scope.
- Landing page, onboarding, labs catalog, notebook, and all other labs are out of scope for this
  reviewer and were not inspected.

## Findings summary

| Severity | Count | Notes |
|---|---|---|
| P0 | 0 | none |
| P1 | 0 | none |
| P2 | 2 | (1) unlabeled hotspot dots visually overlap the data table at both viewports (cosmetic, non-blocking); (2) cup liquid color reads blue-gray rather than milk-toned despite the asset filename (cosmetic only) |
