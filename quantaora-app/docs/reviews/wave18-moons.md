# Wave 18 QA — Moons (Enceladus)

Reviewer: Wave 18 reviewer — moons scope (read-only visual QA)
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Scope: `MoonsLab` at `/app/labs/moons`, Enceladus body only.
Method: isolated Playwright (chromium) launched from `/tmp/wave18-moons-qa`, `page.on('console')` / `page.on('pageerror')` active. Read-only source inspection: `src/routes/MoonsLab.tsx`, `src/components/explorer/MoonModel.tsx`, `src/data/moons.ts`, `src/components/explorer/moonsHotspotLabelDeconfliction.test.ts`, `docs/reviews/wave12-moons.md`, `docs/reviews/wave14-moons.md`.

Evidence directory: `review-screenshots/wave18-2026-08-18/moons/`.

## Prior finding being re-checked

`wave14-moons.md` stated: "Enceladus's south-pole 'Tiger Stripes' hotspot label is almost entirely hidden under the 'South Polar Geysers' label, at both viewports, when both labels are visible at once... their floating label pills land on top of each other." Source comments show two subsequent fix attempts (Wave 15, then Wave 17 per the in-code changelog) implementing a `getBoundingClientRect`-based label-declutter pass in `MoonModel.tsx`.

## Overall verdict: 1 P1, zero P0

The originally reported label-vs-label overlap is fixed (labels never overlap each other anymore), but a **new, narrower defect** exists specifically at default camera framing on desktop: the declutter fix's downward push collides with a different fixed UI element (the bottom caption pill) that the declutter logic doesn't account for. All other checks (drag reorientation, hotspot clicks, gravity comparator, mobile default view, console) PASS.

## Check 1 — Default view, desktop 1440x900: label separation

**FAIL (P1) — new/different failure mode, not fully fixed.** The two labels no longer overlap *each other* (rects measured: "Tiger Stripes" 681–714px, "South Polar Geysers" 641–673px, no vertical intersection — the declutter fix genuinely works for label-vs-label collisions). However, at the exact default camera framing, the declutter pass pushes "Tiger Stripes" down far enough that it lands underneath the app's fixed bottom canvas caption pill ("Geometry reconstructed from real spacecraft imagery…", measured 673–705px), which paints on top of it in DOM/stacking order. The result: "Tiger Stripes" text is 100% visually obscured, not legible at all, reproduced consistently across 2 independent fresh page loads (verified via `getBoundingClientRect` + a visual crop). `elementFromPoint` at the label's center hits the `<canvas>` (both the label and the pill wrapper are `pointer-events-none`), confirming this is purely a paint/z-order problem, not a functional block.
- Evidence: `01-desktop-enceladus-default-labels.png`, close crop `11-desktop-tigerstripes-hidden-crop.png`.

## Check 2 — After camera drag/rotate, desktop 1440x900

**PASS.** Dragged the canvas twice (≈270px and ≈300px drags in different directions). In both resulting orientations, "Tiger Stripes" and "South Polar Geysers" are both fully legible, cleanly stacked with a visible gap, and no longer collide with the bottom caption pill (the reprojected screen position no longer lands in the pill's zone at these angles).
- Evidence: `02-desktop-enceladus-after-drag-labels.png`, `03-desktop-enceladus-after-drag2-labels.png`.

**Conclusion on the regression check:** the label-overlap bug from Wave 14 is fixed, but default camera framing on desktop is the state that now breaks — the inverse of what the task briefing hypothesized (it expected default-view-only-tested/drag-reveals-bug; instead default view is the broken state and dragging happens to fix it).

## Check 3 — Hotspot click targets (Tiger Stripes, South Polar Geysers)

**PASS.** Clicking each hotspot's dot (`button[aria-label="View Tiger Stripes"]` / `"View South Polar Geysers"`) correctly sets `aria-pressed="true"` on the Isolate toolbar button and populates the Detail Panel with the correct structure name, description, "Function," and "Where it belongs" hierarchy for each — content differs correctly per hotspot, no mix-up.
- Evidence: `09-desktop-tigerstripes-detailpanel.png` ("Tiger Stripes… Four long, parallel fractures…"), `10-desktop-southpolargeysers-detailpanel.png` ("South Polar Geysers… More than 100 individual jets…").

## Check 4 — Gravity feature ("What would you weigh here?" comparator)

**PASS.** This lab's gravity feature is a weight slider (20–100 kg, "Your weight on Earth") plus a CSS-driven falling/bouncing ball visual, both driven by Enceladus's real surface gravity (0.113 m/s²). Moving the slider from 40kg → 100kg live-recomputed the displayed Enceladus weight from 0.5 kg → 1.2 kg, correctly re-triggered the drop-ball animation (`key={content.id}` restart), and updated the jump-height multiplier text. Cause/effect is clear and functioning.
- Evidence: `06-desktop-gravity-before.png` (40kg → 0.5kg), `07-desktop-gravity-after.png` (100kg → 1.2kg).

## Check 5 — Default view, mobile 390x844

**PASS.** Measured rects: "South Polar Geysers" 284.6–309.9px, "Tiger Stripes" 314.5–340px (no overlap, ~4.6px gap), neither intersects the top toolbar overlay (144–174.5px) or bottom caption pill (416–440px). Both labels fully legible in the screenshot as well.
- Evidence: `08-mobile-enceladus-default-labels.png`.

## Check 6 — Console/page errors

**No errors, no P0/P1 console issues.** Only benign messages across both desktop and mobile sessions:
```
[warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[warning] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[info] Download the React DevTools for a better development experience...
```
Zero `pageerror` events across all sessions/interactions (drag, hotspot clicks, slider, toggles).

## Findings by severity

- **P0:** none.
- **P1 (1):** Desktop 1440x900, default camera framing: "Tiger Stripes" hotspot label is fully hidden behind the fixed bottom caption pill overlay after the label-declutter fix pushes it down to clear "South Polar Geysers." Evidence: `01-desktop-enceladus-default-labels.png`, `11-desktop-tigerstripes-hidden-crop.png`. Regression-adjacent: the originally reported label-vs-label overlap is fixed, but a new label-vs-UI-chrome collision now hides the same label at the same default view.
- **P2:** none observed.
