# Wave 8 QA — Energy (generator / multimeter / stove)

Date: 2026-08-18
Route: `/app/labs/energy` (Physics > Energy > Conservation of Energy, real-world-example chip row)
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/energy/` (26 files)

## Checklist verdicts

**1. Switching between generator/multimeter/stove works at both viewports — PASS.** Each chip toggles a single `activeExampleId` state; clicking one swaps the model cleanly with no leftover geometry from the previous example. Evidence: `desktop-generator-selected.png`, `desktop-multimeter-selected.png`, `desktop-electric-stove-selected.png`, `mobile-generator-clean-retest.png`, `mobile-multimeter-clean-retest.png`, `mobile-electric-stove-selected.png`.

**2. Each shows a real, distinct 3D asset — PASS.** Sourced GLBs (`public/models/sourced/physics-energy-wave2/{generator,multimeter,electric-stove}.glb`) render as visually distinct props: yellow portable generator with handle/wheels, black handheld multimeter with LCD, white free-standing electric stove/oven.

**3. Live power/heat overlays update dynamically — PASS.** Two independent cause→effect chains confirmed: generator wattage label went from "~51 W out" (Push force 32 N) to "~128 W out" after maxing Push force to 80 N (matches work = 80 N x 4 m / 2.5 s = 128 W); Heat meter rose from 5 J baseline to 19 J after ~3s of Play. Evidence: `desktop-generator-before-force-change.png` → `desktop-generator-after-force-change-closed.png`; `desktop-baseline-coaster.png` vs `desktop-generator-mid-animation.png`.

**4. Mobile panel layout fits and is legible — PASS.** "Tune energy" panel switches to single-column layout with internal scroll, no page-level overflow. Evidence: `mobile-tune-panel-open.png`, `mobile-full-page.png`.

**5. Shared toolbar functions consistently across all three — PASS.** `CanvasControls` is a single shared component that doesn't branch per example. Isolate and Zoom In/Out verified working at both viewports.

## Console/network errors
None. Only benign warnings: `THREE.Clock` deprecation, WebGL "GPU stall due to ReadPixels" perf warnings (multiple concurrent QA sessions were running against the same dev server during this pass), troika-text font-shaping debug notices. Zero `console.error`/`pageerror` events.

## Findings

**P0 — none.** App reachable, route does not crash, canvases render real content at both viewports, all three example switches work.

**P1 — Multimeter model clipped on mobile (390x844).**
On a fresh, uncontested page load, the Multimeter example renders flush against the left edge of the canvas with roughly the left 30-40% of its body cut off by the viewport boundary. Generator and Electric stove remain fully framed at the same viewport/scale. Evidence: `mobile-multimeter-clean-retest.png`, also reproduced in `mobile-multimeter-selected.png`. Compare `mobile-generator-clean-retest.png` / `mobile-electric-stove-selected.png`, correctly framed.

**P2 — Tune-energy panel obscures the scene while open (desktop and mobile).**
Bottom-anchored panel grows upward, covering most of the canvas (including the active model and its live wattage label) while sliders are adjusted — cause/effect only visible after closing the panel. Evidence: `desktop-tune-panel-retest-open.png`, `mobile-tune-panel-open.png`.

**P2 — "Section" (cross-section) toolbar button present but always disabled on this lab.**
`onToggleCrossSection` never wired up in `EnergyLab.tsx`, so Section renders permanently disabled/greyed for all three examples. Likely intentional (rig isn't cross-section-able) and clearly styled as disabled, not misleadingly clickable. Evidence: `desktop-baseline-coaster.png`.

**Informational (not scored):** During one long multi-step pass, the Tune panel's close (X) button appeared unresponsive mid-session; an immediate clean, isolated retest showed the same button working correctly on first click. Given concurrent QA load on the same dev server at that moment, likely test-environment contention rather than a reproducible product bug — noted in case it recurs.

## Files inspected (read-only)
`src/routes/EnergyLab.tsx` and shared `CanvasControls` component. No product/source files modified.
