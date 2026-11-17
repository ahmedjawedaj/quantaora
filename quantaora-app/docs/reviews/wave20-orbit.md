# Wave 20 QA — Orbit lab (Ceres label drift, mobile + desktop camera actions)

Reviewer: Wave 20 reviewer — orbit scope (read-only visual QA), Sonnet
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Scope: `SpaceLab`/`OrbitSandbox` at `/app/labs/orbit`, Ceres Name/ORBIT/SPIN pill drift and overlap.
Method: isolated Playwright (Chromium) from `/tmp/wave20-orbit-qa`, fresh `browser.newContext()` per check, `page.on('console')` / `page.on('pageerror')` active throughout. Read-only source inspection: `src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`, `src/components/explorer/CanvasControls.tsx`, `docs/reviews/wave18-orbit.md`.

Evidence directory: `review-screenshots/wave20-2026-08-18/orbit/`.

## Prior finding being re-checked

No `docs/reviews/wave19-orbit.md` exists. `OrbitSandbox.tsx` contains inline comments describing a "Wave 18 QA fix" for the ORBIT pill's anchor (fixed local offset instead of riding the rotating arrow group). Wave 18 (`docs/reviews/wave18-orbit.md`) found desktop cold-load pill determinism and Saturn→Ceres re-framing PASS, but a P1 specifically on **mobile**: Ceres's ORBIT/SPIN pills grew an overlap over ~8 seconds after selection.

## Overall verdict: 0 P0, 1 P1 (new, desktop-only), 1 P2 — mobile fixed, new desktop regression found

## Check 1 — Mobile (390x844), Ceres label drift, immediate vs +10s

**PASS — Wave 18 P1 resolved.** Cold load → "Show labels" → selected Ceres via mobile chip → captured pill rects immediately (+250ms) and again at +10.5s.

| | Name↔Orbit gap | Orbit↔Spin gap | Overlap? |
|---|---|---|---|
| Immediate | 8.1px | 7.6px | none |
| +10.5s | 9.8px | 8.9px | none |

Gaps stayed positive and slightly increased over time — the opposite of Wave 18's finding (monotonic overlap growth 733px²→1543px² over 8s). All three pills stayed distinct and legible at both timestamps.

Evidence: `00-mobile-cold-load-default.png`, `01-mobile-ceres-immediate.png`, `01b-mobile-ceres-immediate-crop.png`, `02-mobile-ceres-after10s.png`, `02b-mobile-ceres-after10s-crop.png`.

## Check 2 — Desktop (1440x900) smoke + camera actions

**Reselect-only (no drag), 3 cycles (Ceres→Saturn→Ceres): PASS.** 0px² overlap in 2/3 cycles, one negligible 26px² transient in the 3rd. Evidence: `repeat-cycle1-3-ceres*.png`.

**Drag + reselect, 3 cycles: FAIL — P1 (new finding).** Per the assignment's "camera actions" requirement, drag-rotate was tested in addition to plain reselect. Overlap reproduced in 3/3 cycles:
- Cycle 1: after reselect, `CERES` Name pill fully overlapped by `SPIN` — 2148px² (near-total containment, "CERES" text only a faint ghost behind "SPIN"). Matches the initial single-pass run (2202px², crop `07b-desktop-ceres-reselected-pillcrop.png`).
- Cycle 2: immediately after drag (pre-reselect), `SPIN`/`ORBIT` overlap = 424px².
- Cycle 3: immediately after drag, `SPIN`/`ORBIT` overlap = 274px².

Reselecting without ever dragging stayed clean, isolating the drag/rotate gesture as the trigger — a label-decluttering failure, not a zoom/framing regression (Ceres's own disc position/size was correctly framed in every case).

Evidence: `05-desktop-ceres-after-drag.png`, `06-desktop-saturn-selected.png`, `06b-desktop-saturn-pillcrop.png` (clean control), `07-desktop-ceres-reselected.png`, `07b-desktop-ceres-reselected-pillcrop.png` (primary failure), `dragrepeat-cycle1-3-*.png`.

## P2 — Secondary observation

During one drag (`dragrepeat-cycle2-after-drag.png`), the mouse-drag rotate gesture also triggered native browser text-selection highlighting across the `JUPITER`/`EARTH` Name-label pills the pointer crossed, rather than only rotating the camera — suggests label overlays may intercept pointer events meant for the camera-rotate control during a mouse drag. Polish/UX flag, not confirmed as root cause of the P1 above.

## Console/page errors

**PASS.** Zero `pageerror` events across every session (mobile cold load, desktop smoke, both 3-cycle repeat runs). Only benign noise: `THREE.Clock` deprecation, GPU-stall driver warning (self-silences), Vite HMR, React DevTools banner.

## Summary

| # | Check | Verdict | Severity |
|---|---|---|---|
| 1 | Mobile Ceres label drift, immediate vs +10s | PASS (Wave 18 P1 resolved) | — |
| 2a | Desktop reselect-only camera action | PASS | — |
| 2b | Desktop drag-rotate + reselect camera action | FAIL (new) | P1 |
| 3 | Native text-selection artifact during drag | Observed | P2 |
| 4 | Console/page errors | PASS | — |

**Conclusion:** The originally scoped mobile Ceres P1 is fixed. A new, reproducible desktop-only pill-overlap regression was found when the camera is dragged before/around a Ceres reselect — not covered by the task's literal "select Ceres on mobile" wording but caught under "desktop smoke and camera actions."
