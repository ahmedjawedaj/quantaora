# Wave 8 QA — Math (Number Sense abacus + Math Manipulatives fraction cup)

Date: 2026-08-18
Route(s): Number Sense Lab, Math Manipulatives Lab
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/math/`

## Checklist verdicts

**1. Number Sense abacus place-value interaction — FAIL (P0)**
- Desktop 1440x900: `desktop-abacus-initial.png` (5/7/3 = 573) → `desktop-abacus-after-345.png` (898 after +3/+4/+5 clicks). Numeric readouts (rod counters, Digits/Number/Expanded meters, Key Facts panel) update correctly, but a pixel diff of the 3D canvas region between the two screenshots is empty (zero difference) — the abacus bead model never visually moves, even though controls are labeled "Push a bead down/up".
- Mobile 390x844: `mobile-abacus-initial-FORCED-via-desktop-selection.png` (573) → `mobile-abacus-after-236-FORCED-via-desktop-selection.png` (799). Same result: numeric readouts update, 3D canvas pixel-identical, beads never move.
- Rod controls/labels fit cleanly at both viewports, no clipped text.

**2. Math Manipulatives fraction cup drag — PASS functionally, FAIL on mobile reachability (P0)**
- Desktop 1440x900: `desktop-fraction-cup-initial.png` (3/8) → `desktop-fraction-cup-mid-drag.png` (5/8) → `desktop-fraction-cup-after-drag-full.png` (0/8). Dragging correctly drives numerator/denominator meters, the translucent liquid level inside the 3D cup mesh, the "tap squares" selection grid, and the decimal/percent readout, all in sync.
- Mobile 390x844: drag mechanics verified working correctly (`mobile-fraction-cup-initial-FORCED-via-desktop-selection.png` 3/8 → `mobile-fraction-cup-after-drag-full-FORCED-via-desktop-selection.png` 0/8) with a reasonably large touch hit-area (~124x155 CSS px).
- However, both the "Fraction" and "Place Value" items live only in a sidebar (`<aside class="hidden ... lg:block">`) that is completely absent from the DOM below the `lg` breakpoint. Confirmed via Playwright: "Place Value" button count in DOM = 0, "Fraction" button count = 0 at 390px width. A real mobile visitor has no in-app way to reach the abacus or the fraction cup at all — mobile screenshots were only obtainable by selecting the component at desktop width first, then resizing down to 390px (filenames marked "-FORCED-via-desktop-selection").

**3. Controls/labels fit within viewport, no clipping — PASS** for everything actually exercised (rod +/- buttons, digit meters, numerator/denominator/simplified meters, Tune panel toggle) at both viewports.

## Console/network errors
No `console.error` or `pageerror` events in any of the 4 sessions. Only benign warnings: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` and repeated WebGL `GPU stall due to ReadPixels` performance messages (likely from screenshot capture itself). No `requestfailed` events — all GLB models loaded.

## Findings

**P0 — broken/blocking**
1. Abacus 3D model does not respond to the place-value bead controls at all, on both viewports — pixel-identical canvas before/after all rod changes. Evidence: `desktop-abacus-initial.png` vs `desktop-abacus-after-345.png`; `mobile-abacus-initial-FORCED-via-desktop-selection.png` vs `mobile-abacus-after-236-FORCED-via-desktop-selection.png`.
2. On mobile (390x844), the component switcher for both Number Sense and Math Manipulatives is entirely missing from the DOM, so "Place Value"/abacus and "Fraction"/measuring-cup are unreachable by any real mobile user — only the default component (Addition, Angle) is ever visible. Evidence: `mobile-numbersense-initial-addition.png`, `mobile-mathmanip-initial-angle.png`.

**P1** — none beyond the above (fraction drag mechanics work correctly on both viewports once reached).

**P2 — polish**
1. On the fraction cup screen, the "Drag to fill the cup" panel is absolutely positioned over the right side of the canvas and overlaps/truncates the underlying SVG's "Tap dots to make ratio" section (label reads "Tap dots to m…", ratio value "3:5 ->" cut off). Worse on mobile where the ratio dots are almost entirely hidden. Evidence: `desktop-fraction-cup-initial.png`, `mobile-fraction-cup-initial-FORCED-via-desktop-selection.png`.
2. Desktop abacus canvas frames the soroban model quite small within a much taller container, leaving large empty margins above/below (not clipped, just not well-filled/centered). Evidence: `desktop-abacus-initial.png`.

## Files inspected (read-only)
`src/App.tsx`, `src/routes/NumberSenseLab.tsx`, `src/routes/MathManipulativesLab.tsx`, `src/components/explorer/ContentNav.tsx`, `src/routes/AppShell.tsx`, `src/data/generated/number_and_arithmetic.ts`, `src/data/generated/fractions_and_ratios.ts`. No product/source files modified.
