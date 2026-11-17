# Wave 10 — Mechanics Lab Visual QA Report (Physics / mechanics scope)

**Route:** `http://127.0.0.1:5174/app/labs/motion` (title "Mechanics")
**Viewports:** Mobile 390x844 (primary), Desktop 1440x900
**Method:** Isolated `chromium.launchPersistentContext` at `/tmp/wave10-mechanics/profile`, driven via ad-hoc Node/Playwright scripts (not added to any project `package.json`). All screenshots and the full console log are saved under:
`review-screenshots/wave10-2026-08-18/mechanics/`

App was reachable (HTTP 200) and rendered without route crashes throughout — **no P0 findings.**

## P1 — Significant

**1. Zoom In / Zoom Out / Fit View ("Full") / Reset toolbar buttons have no visible effect on camera framing (mobile 390x844).**
Clicking "Zoom In" 6x changed the button's `disabled` state (confirming the underlying `cameraDistance` React state did update) but the rendered canvas was **pixel-identical** before and after. The "Reset" button likewise failed to restore framing after a native wheel-zoom. By contrast, native mouse-wheel dolly over the canvas (OrbitControls' own zoom) visibly works, isolating the bug to the toolbar-driven distance state, not to OrbitControls itself.
Root cause (read-only source observation, not a fix): `cameraDistance` is only threaded into the initial `<Canvas camera={{ position: [0, 1.55, cameraDistance], fov: 39 }}>` prop (`src/routes/PhysicsLab.tsx` line 883), while `<OrbitControls>` (line 891) independently drives the camera every frame, so state-driven distance updates appear to be overridden.
Evidence: `mobile-zoomin-button-before.png` / `mobile-zoomin-button-after-6clicks-nochange.png`, `mobile-reset-button-1-afterwheelzoom.png` / `mobile-reset-button-2-afterclick-nochange.png`, contrasted with `mobile-nativewheel-zoom-before.png` / `mobile-nativewheel-zoom-after-works.png`.

**2. Cart/track model clips at the right canvas edge on mobile 390x844 when the cart travels toward the high end of the track.**
After running the Predict-and-Race interaction (Applied Force 28N) or simply pressing Play at default settings for ~1.5s, the cart, its force-arrow labels, and part of the reference cart/"momentum stack" label get cut off by the canvas right edge — not fully framed within the container.
Evidence: `mobile-toolbar-check.png`, `mobile-cart-endstate-clip-check.png` (clean crop confirming clipping), `mobile-play-after.png` (milder instance of the same issue).

**3. Baseball and measuring-tape sourced 3D props are effectively invisible at default camera framing, both viewports.**
Both assets load successfully (no console errors, no `[PhysicsLab] mechanics prop GLB failed to load` fallback warning ever fired), but at default framing they render as tiny, dark, shadow-blended shapes near the cart's rear wheels — indistinguishable from generic scene clutter. They only became identifiable after ~14 native wheel-zoom clicks plus a tight crop (and the in-app Zoom In control is broken per finding #1, so a real learner has no way to reach this framing).
Evidence: `mobile-switcher-late-velocity-motionmeasure.png` (default framing — not identifiable), `desktop-tape-baseball-final-crop.png` (only identifiable after manual zoom+crop).

**4. Internal hotspot ID slugs leak into learner-facing lesson copy.**
The "Force" lesson, Step 1 of 8 ("See it"), reads: *"Tap `hs-force-arrows` to label the two force arrows... `hs-force-box`... `hs-force-scale`..."* — raw internal identifiers are shown verbatim to the learner instead of human-readable labels.
Evidence: `mobile-lesson-modal.png`. Not verified whether this pattern repeats across the other 12 mechanics lessons (only Force's lesson was opened in this pass — flagging as a confirmed instance, not a confirmed systemic pattern).

## P2 — Polish

**1. Tune panel: 3 of 5 sliders require scrolling to discover on mobile.** Only Applied Force and Mass are visible without scrolling inside the `max-h-[42svh]` panel; Friction/Slope/Gravity sit below the fold. A bottom fade-gradient scroll cue is present (appears intentional per source comment), so this is polish rather than a broken affordance. Evidence: `mobile-tune-panel-open.png`.

## PASS — Verified working, no issues found

- **App reachability / no crashes**: confirmed at both viewports across all sampled routes.
- **Console health**: zero `pageerror` and zero `requestfailed` events across the entire pass. Only benign dev-mode noise: `THREE.Clock` deprecation warning, headless-GPU "ReadPixels stall" performance notices, and Chromium font GPOS/GSUB substitution debug logs. Full transcript: `console-log.txt`.
- **Canvases render non-blank** at both viewports across all sampled components: Acceleration (early, 1/13), Force (middle/default, 4/13), Friction (5/13), Momentum (8/13), Velocity (12/13), Weight (13/13). Evidence: `mobile-switcher-early-acceleration.png`, `mobile-switcher-force-default.png`, `mobile-switcher-middle-friction.png`, `mobile-switcher-middle-momentum.png`, `mobile-switcher-late-velocity-motionmeasure.png`, `mobile-switcher-late-weight.png`, plus desktop equivalents `desktop-acceleration.png`, `desktop-initial-force.png`, `desktop-weight.png`, `desktop-velocity-exact.png`.
- **Mobile component switcher** (horizontal chip strip, "Component X of 13") is fully reachable and correctly re-focuses the DetailPanel, readout meters, and 3D scene per selection — verified across 6 of the 13 components spanning early/middle/late.
- **Mobile toolbar reachability**: all 10 controls (Rotate, Play, Isolate, Section, Compare, Zoom In, Zoom Out, Full, More, Reset) sit fully inside the 390px viewport (rightmost edge at x=371 of 390) with no cutoff; "Tune mechanics" button also reachable without page scroll. Raw geometry dump logged in `console-log.txt` line 20.
- **Predict-and-race interaction** is clear, legible cause/effect: chose "My cart wins," ran the race, got color-coded resolution text "Not quite - You said 'My cart wins', the race result was 'They tie'." Evidence: `sim-control-before-race.png` → `sim-control-after-race.png`.
- **Play/Pause control**: visibly moves the cart and live-updates Net Force / Acceleration meters. Evidence: `mobile-play-before.png` → `mobile-play-after.png`.
- **Isolate toggle**: visibly changes DetailPanel content (adds "Where it belongs" breadcrumb, highlights a hotspot label in-scene) and toggles the toolbar icon's active state. Evidence: `mobile-isolate-before.png` → `mobile-isolate-after.png`.
- **Lesson modal**: opens well-framed on mobile, no overflow/clipping, readable step progress ("STEP 1 OF 8"). (Content itself flagged separately under P1 #4.) Evidence: `mobile-lesson-modal.png`.
- **Desktop 1440x900 layout**: three-column layout (ContentNav / canvas+toolbar / DetailPanel) renders cleanly with no overflow across Force, Acceleration, Weight, Velocity. Evidence: `desktop-initial-force.png`, `desktop-acceleration.png`, `desktop-weight.png`, `desktop-velocity-exact.png`.

## Could not verify / out of scope this pass

- Whether the leaked-hotspot-ID pattern (P1 #4) repeats across the other 12 mechanics lessons — only "Force" was opened.
- Root cause of the zoom/reset bug was inferred from reading `PhysicsLab.tsx` only (not confirmed via React DevTools state inspection); `CanvasControls.tsx` internals were not read.
- Section (cross-section) and Compare toolbar buttons were visible and reachable but not functionally exercised (clicked/verified for output) in this pass — time-boxed to the checks requested (switcher sampling, baseball/tape visibility, sim-control cause/effect, toolbar reachability, console log).
- Model framing/centering was assessed visually from screenshots only, not measured algorithmically against canvas bounds.

## Key evidence files (all under `review-screenshots/wave10-2026-08-18/mechanics/`)

- `console-log.txt` — full console/network transcript
- `mobile-zoomin-button-before.png` / `mobile-zoomin-button-after-6clicks-nochange.png`
- `mobile-nativewheel-zoom-before.png` / `mobile-nativewheel-zoom-after-works.png`
- `mobile-reset-button-1-afterwheelzoom.png` / `mobile-reset-button-2-afterclick-nochange.png`
- `mobile-cart-endstate-clip-check.png`, `mobile-toolbar-check.png`, `mobile-play-after.png`
- `desktop-tape-baseball-final-crop.png`
- `mobile-lesson-modal.png`
- `sim-control-before-race.png` / `sim-control-during-race.png` / `sim-control-after-race.png`
- `mobile-play-before.png` / `mobile-play-after.png`
- `mobile-isolate-before.png` / `mobile-isolate-after.png`

Source file read (inspection only, no edits made): `quantaora-app/src/routes/PhysicsLab.tsx`.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `mechanics` reviewer agent, which produced all findings and evidence above but did not itself write to `docs/reviews/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
