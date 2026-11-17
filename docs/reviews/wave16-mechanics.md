# Wave 16 QA — Mechanics / motion-measure (baseball + tape prop scene)

Date: 2026-08-18
Route: `/app/labs/motion` (Physics > Mechanics), scoped to the "motion-measure" mode/prop
(baseball + measuring-tape scene), reached via the Position/Distance/Displacement/Speed/Velocity
components. Verified via the "Position" component.
Viewports: desktop 1440x900, mobile 390x844
Server reachability: confirmed reachable (`curl` 200 at `http://127.0.0.1:5174/app/labs/motion`).
Screenshots: `review-screenshots/wave16-2026-08-18/mechanics/`
Source inspected (read-only): `src/routes/PhysicsLab.tsx` (MotionMarkers, TrackedBaseball,
MeasuringTapeTool, safeDefaultDistanceForAspect/rigYawForMode), `src/routes/mechanicsPropPositions.test.ts`,
`src/routes/mechanicsMotionMeasureFraming.test.ts`, `src/components/explorer/ContentNav.tsx`.

## Method
Drove an isolated headless Chromium (Playwright) instance, navigated to the route, clicked the
"Position" nav item (the exact-name match — the sidebar's "Displacement"/"Distance" entries also
contain the substring "Position" in their subtitle, so an initial loose text-match landed on the
wrong component; this was corrected before capturing evidence) to enter motion-measure mode, and
captured the scene immediately on load (no interaction) at both viewports. Captured console/page
error events on every load.

## Console/page errors
Zero `pageerror` events at either viewport. Console output was benign dev-server/GPU noise only:
`[vite] connecting/connected`, React DevTools info banner, `THREE.Clock` deprecation warning, a few
headless-GPU `GPU stall due to ReadPixels` perf warnings, and harmless `unsupported GPOS/GSUB table`
font-shaping debug lines. No errors of any kind.

## Findings

### P0 — none found.
App is reachable, the route loads, the "motion-measure" mode is reachable, and no crashes/blank
canvases occurred at either viewport.

### P1
1. **Baseball model heavily occludes the measuring-tape model in the initial motion-measure framing, at both viewports.**
   `TrackedBaseball` renders at `[sim.position, 0.08, 0.85]` and `MeasuringTapeTool` at
   `[START_POSITION - 0.4, -0.04, 0.58]` — the source comments (and the passing
   `mechanicsPropPositions.test.ts` / `mechanicsMotionMeasureFraming.test.ts` unit tests) assert
   these are "clearly separated and visible at rest" based on raw 3D (x, z) coordinate distance and
   a mode-specific camera yaw. In the actual rendered frame, under the current camera
   position/yaw, the large white baseball sits directly in front of the small tape prop from the
   camera's point of view: only a thin yellow/black sliver of the tape peeks out from behind/below
   the baseball's left edge. A first-time viewer would very plausibly miss the tape model
   entirely or mistake it for a shadow — this fails the task's explicit success criterion that
   both props be "fully visible (not overlapping/occluding each other in a way that makes either
   hard to identify)" at the start of motion-measure mode. This is a real render-time regression
   the existing static-source-text unit tests cannot catch (they check literal coordinate
   deltas/yaw values, not actual on-screen occlusion under perspective projection).
   Evidence: `desktop-motion-measure-start.png`, close-up
   `desktop-motion-measure-start-crop-baseball-tape.png`; `mobile-motion-measure-start.png`,
   close-up `mobile-motion-measure-start-crop-baseball-tape.png`. Same occlusion pattern at both
   viewports.

2. **Overlapping floating text labels near the same prop cluster are illegible.** The tape's own
   `"tape reads 0.00 m"` label and a nearby `"friction"` force-arrow label render stacked almost
   exactly on top of each other in the same screen position (both similar gold/amber tone), so
   neither is individually readable at the default framing. Evidence:
   `desktop-motion-measure-start-crop-label-overlap.png`.

### P2 — none additional found within scope.

## Camera toolbar reachability — PASS (both viewports)
- **Desktop 1440x900:** all 11 toolbar controls (Rotate, Play, Isolate, Section, Compare, Zoom In,
  Zoom Out, Full, More, Reset, plus the separate "Tune mechanics" trigger) are present, have
  non-zero bounding boxes, and sit inside the canvas stage without being clipped or covered by the
  side detail panel. Confirmed via DOM bounding-box inspection (all `visible: true`, no boxes
  outside the stage). Evidence: `desktop-motion-measure-start.png`.
- **Mobile 390x844:** the same control set renders as a single horizontal row above the canvas,
  fully inside the viewport with no clipping or overflow scroll needed. Evidence:
  `mobile-motion-measure-start.png`, close-up `mobile-motion-measure-start-crop-toolbar.png`.

## Panels / framing — PASS
Detail panel (desktop right rail) and readout meters (Position / Origin / Time) render fully
inside their containers at both viewports with no overflow or page-level scroll triggered by
entering motion-measure mode specifically. The track, cart, and all props stay within the canvas
bounds (no geometry clipped by the canvas edge) at both viewports.

## No internal QA/debug language observed
No lorem ipsum, TODO strings, internal component names, or debug scaffolding visible in the
motion-measure UI at either viewport.

## Screenshots
`review-screenshots/wave16-2026-08-18/mechanics/`:
- `desktop-motion-measure-start.png` — full desktop initial-state capture
- `desktop-motion-measure-start-crop-baseball-tape.png` — close-up of baseball/tape occlusion
- `desktop-motion-measure-start-crop-label-overlap.png` — close-up of overlapping text labels
- `mobile-motion-measure-start.png` — full mobile initial-state capture
- `mobile-motion-measure-start-crop-baseball-tape.png` — close-up of baseball/tape occlusion (mobile)
- `mobile-motion-measure-start-crop-toolbar.png` — close-up of mobile toolbar row

## Files inspected (read-only)
`src/routes/PhysicsLab.tsx`, `src/routes/mechanicsPropPositions.test.ts`,
`src/routes/mechanicsMotionMeasureFraming.test.ts`, `src/components/explorer/ContentNav.tsx`,
`src/data/generated/mechanics.ts`. No product/source files modified.
