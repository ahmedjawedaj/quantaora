# Wave 12 Visual Acceptance Review — Moons Lab

- Date: 2026-08-18
- Scope: `MoonsLab` at `http://127.0.0.1:5174/app/labs/moons`
- Viewports: Desktop 1440x900, Mobile 390x844
- Method: Isolated Playwright Chromium (headless, persistent profile under `/tmp/quantaora-wave12-moons-profile-*`), driven via ad hoc Node scripts. Read-only inspection of `src/data/moons.ts`, `src/routes/MoonsLab.tsx`, `src/components/explorer/MoonViewer.tsx`, `src/components/explorer/MoonModel.tsx` to confirm the moon list and behavior — no files under those paths were modified.
- Screenshots: `review-screenshots/wave12-2026-08-18/moons/`

## Summary

App is reachable, no P0s found. All 5 moons render distinctly, are correctly framed with no clipping, and the selector/toolbar/hotspot system works at both viewports. Two P1s found, both mobile-only: (1) the gravity comparator is purely numeric/textual with no visual (falling/bouncing) demonstration in the 3D scene, and (2) hotspot markers/labels positioned near the top or bottom of a moon's sphere are visually obscured by the fixed toolbar pill / caption pill overlays on the compressed 390x844 canvas. No console errors or page errors were observed; only benign Three.js/WebGL driver messages.

## Per-moon results

| # | Moon | Desktop framing | Mobile framing | Visually distinct? | Evidence | Result |
|---|------|------------------|-----------------|---------------------|----------|--------|
| 1 | Earth's Moon (Luna) | Full sphere in frame, centered, no clipping | Full sphere in frame, centered, no clipping | Yes — grey cratered rocky sphere | `moons-01-earths-moon-desktop.png`, `moons-01-earths-moon-mobile.png` | PASS |
| 2 | Europa | Full sphere in frame, centered, no clipping | Full sphere in frame, centered, no clipping | Yes — tan/cream icy sphere with reddish-brown linea cracks, clearly different texture/color from the Moon | `moons-02-europa-desktop.png`, `moons-02-europa-mobile.png` | PASS |
| 3 | Io | Full sphere in frame, centered, no clipping | Full sphere in frame, centered, no clipping | Yes — distinct yellow/orange/red mottled volcanic surface | `moons-03-io-desktop.png`, `moons-03-io-mobile.png` | PASS |
| 4 | Titan | Full sphere in frame, centered, no clipping (fills slightly more of the frame than the others but not cut off) | Full sphere in frame, no clipping of the model itself | Yes — solid hazy orange/gold sphere, no visible surface detail (by design — haze), clearly different from the other 4 | `moons-04-titan-desktop.png`, `moons-04-titan-mobile.png` | PASS (model), see P1 mobile hotspot note below |
| 5 | Enceladus | Full sphere in frame, centered, no clipping | Full sphere in frame, no clipping of the model itself | Yes — small, bright white/grey icy sphere with fine linear "tiger stripe" fractures, clearly different from the other 4 | `moons-05-enceladus-desktop.png`, `moons-05-enceladus-mobile.png` | PASS (model), see P1 mobile hotspot note below |

All 5 use distinct GLB models with distinct textures/colors — confirmed visually, not just by code inspection (no repeated/generic-looking framing across moons).

## Checklist results

1. **Sample all five moon assets / camera fit** — PASS for all 5 at both viewports. No clipping of any model observed. See per-moon table above.
2. **Selector reachable at both viewports** — PASS. Desktop: left sidebar list (`aside`) with all 5 moons, always visible, click-to-select confirmed working for all 5 (`moons-01..05-*-desktop.png`). Mobile: horizontally-scrollable pill row under "Moon X of 5" heading, all 5 moons reachable and confirmed working (`moons-01..05-*-mobile.png`, `moons-selector-mobile.png`). Note: on mobile, the pill row auto-scrolls to keep the active pill in view, so the non-adjacent pill(s) scroll off-screen — this is normal horizontal-scroll behavior, not a defect.
3. **Hotspots respond with legible info** — PASS on desktop, PASS-WITH-CAVEAT on mobile. Tested on 2 different moons (Earth's Moon "Tycho Crater", Europa "Conamara Chaos") on desktop: clicking a hotspot triggers the "Isolate" toolbar state, dims the rest of the scene, shows an on-canvas floating label, and populates the right-hand Detail Panel with the hotspot's structure name, description, "Function", and "Where it belongs" hierarchy — all legible, no overflow (`moons-hotspot-click-moon-desktop.png`, `moons-hotspot-click-europa-desktop.png`, `moons-detailpanel-hotspot-desktop.png`). On mobile, the same interaction works and the Detail Panel below the fold is fully legible with no overflow (`moons-detailpanel-hotspot-mobile.png`), **but** the on-canvas floating hotspot label itself is visually obscured — see P1 findings below.
4. **Gravity comparison cause/effect** — PARTIAL / P1. The "What would you weigh here?" panel recomputes a weight-in-kg figure live, driven by each moon's real `surfaceGravityMs2`, both when switching moons and when dragging the weight slider (verified: Io at 40kg body weight = 6.6→7.3kg... then moved slider to 90kg = 16.5kg, live update confirmed via keyboard-driven slider interaction, see `moons-gravity-compare-io-before-slider-desktop.png` → `moons-gravity-compare-slider-moved-desktop.png`). This is a real, working interactive control — but the cause/effect is communicated **only as recomputed text/numbers** (weight in kg, a "jump ~Nx higher" sentence). There is no visual demonstration in the 3D scene itself (no dropped/bouncing object, no animation) showing the different gravity. See P1 finding below.
5. **Loading/fallback state** — COULD NOT DIRECTLY CAPTURE a live loading spinner via screenshot (see "Unproven" below), but confirmed by code inspection (read-only) that a real loading state and a real error fallback both exist and are non-blank: `MoonViewer.tsx`'s `<Suspense fallback={<Html center>…"Loading moon…"…}>` wraps the whole canvas, and `MoonModel.tsx` additionally wraps each GLB in its own `Suspense` with a rotating wireframe placeholder sphere + "Loading {name}…" label, plus a `GlbErrorBoundary` that shows the same placeholder sphere (solid, not wireframe) with "Illustrated 3D model, built to teach this topic clearly." copy if the GLB fails to load. Neither path leaves a blank/broken canvas by design. Screenshot `moons-loading-state.png` was attempted immediately after a moon switch but captured the already-loaded state (GLBs load/cache fast locally) — flagged as unproven live, not as a failure.
6. **Toolbar controls (zoom/rotate/reset)** — PASS at both viewports. Full toolbar button set confirmed present and legible: Rotate, Play (auto-rotate toggle), Isolate, Section (cross-section — intentionally disabled/greyed, no handler wired for this branch, consistent with single-mesh moon GLBs), Compare, Zoom In, Zoom Out, Full (fit view), More, Reset. Functionally verified: Zoom In/Zoom Out both change camera distance visibly (`moons-zoom-00-before-desktop.png` → `moons-zoom-01-zoomedin-desktop.png` → `moons-zoom-02-zoomedout-desktop.png`), Reset restores default framing (`moons-zoom-03-afterreset-desktop.png`), Play/pause and Isolate both confirmed functional via the hotspot tests above. Mobile toolbar row fits within 390px width with no icon clipping (`moons-toolbar-mobile.png`, cropped check).
7. **Mobile layout fit** — PASS overall, no page-level horizontal overflow (`document.documentElement.scrollWidth === clientWidth === 390` measured programmatically) and no unwanted full-page scroll/clipping (`moons-fullpage-mobile.png` matches the viewport-height capture, confirming the app-shell's internal scroll containers work as intended rather than spilling the document). Toolbar, selector, size-comparison bars, gravity panel, and Detail Panel all render within their containers with no visible text/panel overflow. See P1 hotspot-obscuring findings below, which are the one real mobile-layout defect found.

## Findings

### P0 — none found.
App loaded successfully (HTTP 200), all 5 canvases rendered non-blank content at both viewports, no route crashes, no core interaction failed to do anything.

### P1 — significant

1. **Gravity comparator has no visual (only numeric) cause/effect.**
   Route/surface: Moons Lab, desktop 1440x900 and mobile 390x844 (same panel at both).
   The "What would you weigh here?" control is real and interactive (slider + live moon switching correctly recompute a weight figure and a "jump ~Nx higher" line), but it never visually demonstrates the different gravity in the 3D scene — no object drop, bounce, or animation tied to the selected moon's gravity, only text. Per this review's explicit quality bar, a static/numeric-only comparator without a visible in-scene demonstration is called out as a failing pattern for this feature.
   Evidence: `moons-gravity-compare-moon-desktop.png`, `moons-gravity-compare-io-desktop.png`, `moons-gravity-compare-io-before-slider-desktop.png`, `moons-gravity-compare-slider-moved-desktop.png`, `moons-gravity-compare-mobile.png`.

2. **Hotspot markers/labels near the top or bottom of a moon are visually obscured by the fixed toolbar/caption overlay pills on mobile (390x844).**
   Route/surface: Moons Lab, mobile 390x844 only. The 3D canvas is compressed to `46svh` on mobile, and the fixed-position toolbar pill (top) and "Geometry reconstructed…" caption pill (bottom) both overlay the canvas. Any hotspot marker whose 3D position projects near the top or bottom edge of the sphere renders partially or almost entirely underneath these pills:
   - Titan's "Orange Haze" hotspot (near the model's north pole) renders directly under the top toolbar pill, only the very tip of the marker peeking out. Evidence: `moons-BUG-titan-hotspot-obscured-by-toolbar-mobile-crop.png` (cropped from `moons-04-titan-mobile.png`).
   - Enceladus's south-pole hotspot (tiger-stripes / south-polar-geysers cluster, near the model's south pole) renders directly under the bottom caption pill, only a sliver of the marker visible above it. Evidence: `moons-BUG-enceladus-hotspot-obscured-by-caption-mobile-crop.png` (cropped from `moons-05-enceladus-mobile.png`).
   - Separately, when a hotspot is active/selected on mobile, its floating text label (e.g. "Tycho Crater") renders partially behind the bottom caption pill, leaving only a sliver of the label legible. Evidence: `moons-BUG-hotspot-label-obscured-mobile-crop.png` (cropped from `moons-hotspot-click-mobile.png`).
   This does not block the interaction outright (the Detail Panel below still shows full hotspot info once tapped/scrolled to, confirmed in `moons-detailpanel-hotspot-mobile.png`), but it does reduce legibility/discoverability of specific hotspots and their on-canvas labels at the mobile viewport, which the review brief explicitly calls out as a fail condition ("hidden/inaccessible controls").

### P2 — polish

1. **Titan renders slightly larger in-frame than the other 4 moons on desktop**, despite the code's intent (`FIT_SIZE` normalization, see `MoonModel.tsx` comment) to make every moon's apparent on-screen size consistent regardless of real physical size. Titan's sphere spans roughly 438px of vertical canvas height in the 1440x900 screenshot vs. ~390px for Earth's Moon — noticeably fuller in-frame, though not clipped or cut off. Evidence: `moons-04-titan-desktop.png` vs `moons-01-earths-moon-desktop.png`.

## Console / page errors

- `pageerror` events: **none observed** on either viewport across all navigations.
- `console.error` events: **none observed** on either viewport.
- `console.warning` events (verbatim, benign/expected, listed for completeness):
  - `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (desktop + mobile)
  - `[.WebGL-<handle>]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (repeated a few times, then "this message will no longer repeat") — a headless/software-GPU driver performance notice from Playwright's Chromium, not an app-level error, observed on both desktop and mobile.

## Explicitly unproven / not directly captured

- **Live loading spinner for a moon-model switch was not captured live via screenshot.** GLBs loaded fast enough locally (likely already cached in the browser's HTTP cache after the first load per session) that a screenshot taken ~50ms after triggering a moon switch already showed the fully-loaded model rather than the `Suspense` fallback. The loading state and the GLB-failure fallback were confirmed to exist and be non-blank by reading `MoonViewer.tsx` and `MoonModel.tsx` (both use honest, on-brand copy: "Loading {moon}…" and "Illustrated 3D model, built to teach this topic clearly."), but this is a code-inspection confirmation, not a live visual capture — flagging per instructions rather than asserting PASS from a screenshot that doesn't actually show it.
- **A genuinely slow/failed asset fallback was not exercised** (e.g. by blocking the network mid-load) — only the code path was inspected (`GlbErrorBoundary` in `MoonModel.tsx`). Not verified live.
- **Compare modal** (the "Compare" toolbar button) was confirmed present, visible, and not disabled for at least one moon (Earth's Moon vs. Europa candidate), but its internal contents/overflow behavior were not opened/inspected in detail, since it falls outside the explicit checklist items for this pass (checklist item 6 named only zoom/rotate/reset). Flagging as out-of-scope-for-this-pass rather than PASS or FAIL.

## Screenshot index (all under `review-screenshots/wave12-2026-08-18/moons/`)

- `moons-00-initial-desktop.png`, `moons-00-initial-mobile.png` — initial load, both viewports
- `moons-01-earths-moon-{desktop,mobile}.png` through `moons-05-enceladus-{desktop,mobile}.png` — all 5 moons, both viewports
- `moons-hotspot-click-moon-desktop.png`, `moons-hotspot-click-europa-desktop.png`, `moons-hotspot-click-mobile.png` — hotspot click responses
- `moons-detailpanel-hotspot-desktop.png`, `moons-detailpanel-hotspot-mobile.png` — Detail Panel content after hotspot click, scrolled into view
- `moons-gravity-compare-moon-desktop.png`, `moons-gravity-compare-io-desktop.png`, `moons-gravity-compare-io-before-slider-desktop.png`, `moons-gravity-compare-slider-moved-desktop.png`, `moons-gravity-compare-mobile.png` — gravity comparator across moons and slider interaction
- `moons-zoom-00-before-desktop.png`, `moons-zoom-01-zoomedin-desktop.png`, `moons-zoom-02-zoomedout-desktop.png`, `moons-zoom-03-afterreset-desktop.png` — zoom in/out/reset toolbar verification
- `moons-toolbar-desktop.png`, `moons-toolbar-mobile.png` — toolbar visibility
- `moons-selector-mobile.png`, `moons-fullpage-mobile.png` — mobile selector and full-page overflow check
- `moons-loading-state.png` — attempted loading-state capture (see "unproven" above)
- `moons-BUG-titan-hotspot-obscured-by-toolbar-mobile-crop.png`, `moons-BUG-enceladus-hotspot-obscured-by-caption-mobile-crop.png`, `moons-BUG-hotspot-label-obscured-mobile-crop.png` — P1 evidence crops
