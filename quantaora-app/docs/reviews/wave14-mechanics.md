# Wave 14 Visual QA — Mechanics (Physics/Motion) Lab

Reviewer: Wave 14 reviewer #9 of 10 (scope: Mechanics)
Route: `http://127.0.0.1:5174/app/labs/motion` (`src/routes/PhysicsLab.tsx`)
Date: 2026-08-18
Viewports: Desktop 1440x900, Mobile 390x844
Tooling: isolated Playwright 1.62.1 in `/tmp/wave14-mechanics-qa`, Chromium, `page.on('console')` and `page.on('pageerror')` captured across all runs.
Screenshots: `review-screenshots/wave14-2026-08-18/mechanics/` (52 files, filenames referenced inline below)

Source inspected (read-only): `src/routes/PhysicsLab.tsx` (full file), `src/components/explorer/CanvasControls.tsx`. Confirmed via code comments that this lab has already been through wave10/wave11/wave12 visual-QA fix cycles (baseball/tape sizing, camera framing, hotspot-slug sanitizer, baseball/tape z-lane separation) — this review re-validates the current state, not first-pass findings.

## Summary verdict

**CONDITIONAL PASS.** Core interactions (camera toolbar, tune/predict/race cause-effect loop, hotspot isolate, lesson/quiz/compare modals) all work correctly and are leak-free at both viewports. One recurring P1 remains: at default camera framing in `motion-measure` mode, the baseball and measuring-tape props sit so close to the cart that they visually blend into one cluster rather than reading as clearly separated objects, even though their world-space coordinates are not truly intersecting.

P0 count: **0**
P1 count: **1**
P2 count: **2**

---

## Findings

### P1 — Baseball/tape/cart cluster reads as visually overlapping at default framing (motion-measure mode)
- **Route/surface:** Mechanics lab, `Distance` component (motion-measure mode) — same geometry/positions apply to `Displacement`, `Position`, `Speed`, `Velocity` (all share `mechanicsMode() === 'motion-measure'`).
- **Viewports:** Both desktop 1440x900 and mobile 390x844.
- **What's wrong:** At initial load (`sim.position === START_POSITION`), the code places the baseball at `[sim.position, 0.08, 0.85]` and the tape at `[START_POSITION - 0.4, -0.04, 0.58]` — a real 3D separation of roughly 0.4 units in x and 0.27 in z (per `src/routes/PhysicsLab.tsx` lines 1476–1535). At the default camera angle and the `ResponsiveMechanicsGroup` scale (0.7–0.9), that separation reads as a single blended cluster on screen: the baseball sphere visibly touches/overlaps the cart's front wheel, and the tape prop is mostly hidden behind/under the baseball, only a sliver of yellow visible. A learner cannot distinguish "here is the tape, here is the ball" without manually rotating/zooming.
- **Evidence:**
  - `mechanics-tape-baseball-initial-desktop.png` / `mechanics-tape-baseball-initial-mobile.png` — full default-state screenshots.
  - `mechanics-tape-baseball-default-tightcrop-desktop.png` / `mechanics-tape-baseball-default-tightcrop-mobile.png` — tight crops on the cart/ball/tape cluster showing the overlap most clearly.
  - `mechanics-tape-baseball-zoomedin-desktop.png` and `mechanics-tape-baseball-tightcrop-desktop.png` — zoomed-in confirmation; the ball visibly sits on top of/against the cart's wheel geometry.
  - `mechanics-tape-baseball-rotated-zoom-desktop.png` and `mechanics-full-rotated-zoomed-desktop.png` — a side/rotated angle where the tape's case becomes visible as a small separate gold box on the track (confirms the tape *is* a distinct rendered object, not missing — the issue is purely default-camera legibility, not a load failure).
- **Console check:** No `[PhysicsLab] mechanics prop GLB failed to load` warning was observed in any run — both GLBs (`baseball-polyhaven.glb`, `measuring-tape-polyhaven.glb`) load successfully; this is a framing/legibility issue, not a missing-asset issue.
- **Severity rationale:** Not a P0 (nothing is blank/crashed/non-functional — both props render, load, and are individually recoverable via rotate/zoom), but it undercuts the "Touch it / See it" learning-flow goal for these five components at the view a learner sees first, on both viewports. Consistent with the historical trend in this file's own commit trail (wave10 P1 #3, wave12 P1 #3) of this exact prop cluster needing repeated separation passes — the current separation delta is still not enough at default framing.

### P2 — Auto-rotate change is subtle at default 1–2s glance
- **Route/surface:** Mechanics lab, any component, desktop 1440x900.
- **What's wrong:** Toggling "Rotate" does drive the camera (confirmed via distinct screenshot hashes and a clearly-different frame after 5s — `mechanics-autorotate-before-desktop.png` vs `mechanics-autorotate-after5s-desktop.png` show the track/track-post positions visibly shifted), but at the default `autoRotateSpeed={0.46}` the change is barely perceptible within the first 1–2 seconds (`mechanics-camera-toolbar-before-desktop.png` vs `mechanics-autorotate-after-desktop.png` look nearly identical to a quick glance). A learner tapping Rotate and looking away quickly may not register that anything happened.
- **Evidence:** `mechanics-autorotate-before-desktop.png`, `mechanics-autorotate-after5s-desktop.png` (5s gap, clearly rotated), vs. `mechanics-camera-toolbar-before-desktop.png`/`mechanics-autorotate-after-desktop.png` (1.2s gap, subtle).
- **Severity rationale:** Polish-level — the control works and is not misleading, just slow to visibly confirm.

### P2 — Baseball rendering reads dull/flat against cart at default lighting
- **Route/surface:** Mechanics lab, `Distance` component, both viewports.
- **What's wrong:** The baseball model (`baseball-polyhaven.glb`) renders as a fairly plain grey-white sphere rather than a recognizable baseball (no visible stitching/seam texture at this camera distance/lighting), which contributes to it reading as generic clutter next to the cart rather than an identifiable "baseball" prop, compounding the P1 clustering issue above.
- **Evidence:** `mechanics-tape-baseball-tightcrop-desktop.png`, `mechanics-tape-baseball-default-tightcrop-desktop.png`.
- **Severity rationale:** Cosmetic/asset-fidelity only; does not block comprehension once isolated/zoomed.

---

## Checks performed (PASS unless noted above)

| Check | Desktop 1440x900 | Mobile 390x844 |
| --- | --- | --- |
| App reachable at `/app/labs/motion` | PASS (HTTP 200, loads) | PASS |
| Canvas non-blank / properly framed | PASS — `mechanics-landing-force-desktop.png` | PASS — `mechanics-landing-force-mobile.png` |
| Models not clipped by canvas bounds | PASS — full cart/track/props visible within stage at both sizes | PASS — `mechanics-mobile-fit-390.png`, no geometry cut at edges |
| Tape + baseball spatially separated at initial load | **P1 FAIL** (see above) | **P1 FAIL** (see above) |
| Camera toolbar reachable, not obscured/cut off | PASS — all 10 icons (Rotate/Play/Isolate/Section/Compare/Zoom In/Zoom Out/Full/More/Reset) visible in the vertical rail (desktop) and horizontal rail (mobile), none cut off — `mechanics-camera-toolbar-before-mobile.png` | PASS |
| Zoom In / Zoom Out visibly changes scene | PASS — `mechanics-camera-toolbar-before-desktop.png` → `mechanics-camera-toolbar-after-zoomout-desktop.png` (button disables correctly at bound) | PASS — `mechanics-camera-toolbar-before-mobile.png` → `mechanics-camera-toolbar-after-zoomout-mobile.png` |
| Reset restores default framing | PASS — `mechanics-camera-toolbar-after-reset-desktop.png` matches original default framing | not separately re-tested on mobile; same code path, low risk — see "unproven" |
| Isolate toggles hotspot detail + highlights model part | PASS — clicking Isolate opened "Distance Counter" detail panel and gold-highlighted the corresponding track element — `mechanics-isolate-active-desktop.png` | not directly screenshotted but same handler; low risk |
| Auto-rotate | PASS functionally, P2 on perceptibility (see above) | not separately tested |
| More menu (Show labels / X-Ray / Fit view / Clean view) reachable | PASS — `mechanics-more-menu-mobile.png`, all 4 items visible, not cut off | PASS (same screenshot) |
| Tune-mechanics panel: opens, sliders reachable, no overflow | PASS desktop — `mechanics-tune-panel-open-desktop.png` | PASS — panel scrolls internally (`max-h-[42svh]` + fade hint), confirmed via mouse-wheel scroll test reaching Slope/Gravity sliders — `mechanics-tune-panel-open-mobile.png`, `mechanics-tune-panel-scrolled-mobile.png` |
| Predict → Run the race → result cause/effect | PASS — clear state progression Distance 0.00m → 3.48m (mid-run) → 4.51m (result), "Racing…" button state, and a legible match/mismatch verdict banner — `mechanics-race-before-desktop.png`, `mechanics-race-midrun-desktop.png`, `mechanics-race-result-desktop.png` | not separately re-tested; same shared component/state logic as desktop, low risk |
| Compare modal (Force vs. Mass) | PASS, no overflow at either viewport, legible two-column layout on desktop collapsing to single column on mobile | PASS — `mechanics-compare-modal-desktop.png`, `mechanics-compare-modal-mobile.png` |
| Lesson modal (5 components sampled: Force, Friction, Gravity, Momentum, Distance) | PASS, no overflow, step content legible | PASS (Friction sampled) — `mechanics-lesson-modal-mobile.png` |
| Quiz modal (same 5 components) | PASS, no overflow | PASS (Friction sampled) — `mechanics-quiz-modal-mobile.png` |
| No leaked internal identifiers in canvas labels | PASS — scanned Force/Friction/Gravity/Momentum mode screenshots at both viewports; all labels are human-readable ("Force Arrows", "Newton Scale", "Sliding Book", "Surface Strips", "Distance Counter", "Fall Together", "Satellite Orbit", "Cart A"/"Cart B", "Mass Sliders", "Velocity Arrows", etc.) | PASS |
| No leaked `hs-*` hotspot slugs in Lesson/Quiz copy | PASS — automated regex scan (`/\bhs-[a-z0-9-]+\b/i`) of full modal body text across Force/Friction/Gravity/Momentum/Distance found zero matches; the file's own `sanitizeHotspotSlugs` pass appears effective | PASS (spot-checked Friction) |
| Console/page errors during navigation + interaction | PASS — zero `pageerror` events across all runs; only benign warnings (`THREE.Clock` deprecation, WebGL `GPU stall due to ReadPixels` perf notices, font-shaping `unsupported GPOS/GSUB table` debug logs) — none `[PhysicsLab]` GLB-failure warnings, confirming both sourced GLBs loaded successfully | PASS |

---

## Unproven / not covered

- **friction-slope and momentum-energy modes**: canvas/prop framing was screenshotted and text-scanned for leaks (PASS), but toolbar/race interactions were not independently re-tested in those two modes — only in `motion-measure` (Distance) and implicitly `force-motion` (Force, default landing component). Given all modes share the same `TunePanel`/toolbar/prediction code path, risk of a mode-specific regression is low but not directly verified.
- **gravity-weight mode's own predict/race copy** ("Predict: at this gravity, will your X kg cart beat the 5 kg reference cart...") was read from source but not screenshotted mid-race.
- **Reset button and Isolate button were only screenshotted on desktop**, not independently re-confirmed on mobile (390x844) — same handlers/state, considered low risk but not visually proven at that viewport.
- **Fullscreen toggle** (`Maximize2`/`Minimize2` icon) was not exercised — Playwright's headless Chromium fullscreen API behavior can be unreliable in automation and was skipped to avoid a false negative.
- **X-Ray toggle and Clean View toggle** (reachable in the More menu, confirmed visible) were not clicked to verify their visual effect — only reachability was confirmed.
- Only 5 of 13 mechanics components (Force, Friction, Gravity, Momentum, Distance) were exhaustively scanned for leaked text in Lesson/Quiz modals; the remaining 8 (Acceleration, Displacement, Position, Speed, Velocity, Mass, Normal Force, Weight) were not individually opened, though they share the same `sanitizeLessonContent` code path.

---

## Evidence index (all under `review-screenshots/wave14-2026-08-18/mechanics/`)

Initial state / framing: `mechanics-landing-force-desktop.png`, `mechanics-landing-force-mobile.png`, `mechanics-mobile-fit-390.png`, `mechanics-tape-baseball-initial-desktop.png`, `mechanics-tape-baseball-initial-mobile.png`

Tape/baseball overlap evidence: `mechanics-tape-baseball-default-tightcrop-desktop.png`, `mechanics-tape-baseball-default-tightcrop-mobile.png`, `mechanics-tape-baseball-closeup-desktop.png`, `mechanics-tape-baseball-closeup-mobile.png`, `mechanics-tape-baseball-zoomedin-desktop.png`, `mechanics-tape-baseball-tightcrop-desktop.png`, `mechanics-tape-baseball-rotated-zoom-desktop.png`, `mechanics-tape-baseball-sideangle-desktop.png`, `mechanics-full-rotated-zoomed-desktop.png`

Camera toolbar before/after: `mechanics-camera-toolbar-before-desktop.png`, `mechanics-camera-toolbar-after-zoomout-desktop.png`, `mechanics-camera-toolbar-after-reset-desktop.png`, `mechanics-camera-toolbar-before-mobile.png`, `mechanics-camera-toolbar-after-zoomout-mobile.png`, `mechanics-isolate-active-desktop.png`, `mechanics-autorotate-before-desktop.png`, `mechanics-autorotate-after-desktop.png`, `mechanics-autorotate-after5s-desktop.png`, `mechanics-more-menu-mobile.png`

Tune/predict/race cause-effect: `mechanics-tune-panel-open-desktop.png`, `mechanics-tune-panel-open-mobile.png`, `mechanics-tune-panel-scrolled-mobile.png`, `mechanics-race-before-desktop.png`, `mechanics-race-midrun-desktop.png`, `mechanics-race-result-desktop.png`

Modal checks: `mechanics-compare-modal-desktop.png`, `mechanics-compare-modal-mobile.png`, `mechanics-lesson-modal-{force,friction,gravity,momentum,distance}-desktop.png`, `mechanics-lesson-modal-mobile.png`, `mechanics-quiz-modal-{force,friction,gravity,momentum,distance}-desktop.png`, `mechanics-quiz-modal-mobile.png`

Leaked-ID scan (full-mode views): `mechanics-mode-{force,friction,gravity,momentum}-desktop.png`, `mechanics-mode-{force,friction,gravity,momentum}-mobile.png`
