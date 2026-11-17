# Wave 12 Visual Acceptance Review — Crystal Structures

**Date:** 2026-08-18
**Scope:** Chemistry Lab → "Crystal Structures" mode (`http://127.0.0.1:5174/app/labs/molecules`, tab
switcher "Molecules & Bonding" vs. "Crystal Structures")
**Reviewer:** Read-only Playwright QA agent (isolated Chromium profile, own npx-cached Playwright install)
**Source files read (read-only):** `src/routes/ChemistryLab.tsx`, `src/data/crystals.ts`,
`src/components/explorer/CrystalViewer.tsx`, `src/components/explorer/CompareModal.tsx`,
`src/components/explorer/CanvasControls.tsx`

The 3 crystals in `crystals.ts` (`crystal-diamond`, `crystal-silicon-carbide`, `crystal-graphite`)
are the only crystals in the app and are documented in-source as the wave 8/9/10-reviewed
PASS-quality set ("Wave 11 integration of the 3 crystal-lattice GLBs that reached PASS status").
All three were sampled at both viewports.

Viewports: Desktop 1440×900, Mobile 390×844.

## Summary table

| Crystal | Verdict | Severity | Evidence |
| --- | --- | --- | --- |
| Diamond | PASS (with app-wide P0 below) | — | `crystal-01-diamond-desktop.png`, `crystal-01-diamond-mobile.png`, `crystal-hotspot-click-diamond-desktop.png`, `crystal-hotspot-detailpanel-mobile-scrolled.png` |
| Silicon Carbide | CONDITIONAL — materials not distinguishable | P1 | `crystal-02-silicon-carbide-desktop.png`, `crystal-02-silicon-carbide-mobile.png` |
| Graphite (Graphene Sheet) | CONDITIONAL — vanishes edge-on during auto-rotate | P1 | `crystal-03-graphite-desktop.png`, `crystal-03-graphite-mobile.png`, `crystal-03-graphite-desktop-EDGEON-during-autorotate.png`, `crystal-03-graphite-mobile-EDGEON-during-autorotate.png` |

Cross-cutting/app-level finding (not specific to one crystal): **P0**, see below.

## Findings by severity

### P0 — Broken/blocking

**1. A failed crystal GLB fetch crashes the entire app to a blank white/cream page (all 3 crystals affected; no error boundary around `CrystalViewer`'s `useGLTF` call).**
- Surface: Crystal Structures mode, any crystal, both viewports (tested desktop 1440×900).
- Reproduction: inspected `src/components/explorer/CrystalViewer.tsx` first — confirmed it wraps
  `useGLTF(url)` in a bare `<Suspense fallback={null}>` with **no** error boundary, unlike every
  other GLB consumer in the codebase (`MoleculeModel.tsx`, `PlanetModel.tsx`, `MoonModel.tsx`,
  `EcologyLab.tsx` all define/use a `GlbErrorBoundary`). Verified live by intercepting
  `**/*.glb` requests with Playwright route `abort('failed')` and loading the Crystal Structures
  tab (diamond, the default crystal).
- Observed result: React unmounts the entire app — `document.getElementById('root').innerHTML`
  length was `0` and `document.body.innerText` was empty. The page rendered as a single flat
  cream-colored rectangle with **zero UI** (no header, no nav, no error message) — confirmed with
  a screenshot. Verbatim console output at the moment of failure:
  ```
  pageerror: Could not load /models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb: Failed to fetch
  pageerror: Could not load /models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb: Failed to fetch
  console.warning: An error occurred in the <CanvasImpl> component. Consider adding an error boundary to your tree to customize error handling behavior.
  console.log: THREE.WebGLRenderer: Context Lost.
  console.log: THREE.WebGLRenderer: Context Lost.
  ```
  For contrast, in the same test run the *molecule* viewer's water GLB also failed to load (same
  simulated network failure) and degraded gracefully with a warning and a procedural fallback
  render (`[MoleculeViewer] Molecule GLB failed to load, showing procedural fallback.`) — i.e. the
  molecules path already has the exact protective pattern the crystals path is missing.
- Screenshot: `crystal-error-state-failed-glb.png` (100% blank cream rectangle, no UI at all).
- Note: this requires a genuinely failed/slow asset fetch to trigger (verified via Playwright
  request interception, not observed during normal browsing on the healthy dev server) — flagging
  because the checklist explicitly asked to test/inspect error-handling behavior, and this is a
  real, reproducible full-app crash with no recovery path (only a hard reload restores the app).

### P1 — Significant

**2. No loading indicator while a crystal GLB is fetching — canvas is silently blank (background-color only) for the full fetch duration.**
- Surface: Crystal Structures mode, all 3 crystals, desktop 1440×900 (representative; same
  `Suspense fallback={null}` applies at all viewports).
- `CrystalViewer.tsx` line ~291: `<Suspense fallback={null}>` — confirmed by throttling `**/*.glb`
  requests by 3s and screenshotting mid-fetch: the canvas shows only the off-white background
  color, no spinner/skeleton/"Loading…" text, while the right-hand text panel and toolbar are
  already fully rendered. After the throttled fetch completes the model appears cleanly with no
  broken-state flash (that part is fine) — the only gap is the silent blank interval beforehand.
- Screenshots: `crystal-loading-state.png`, `crystal-loading-state-2.png` (both blank canvas,
  ~0.6s and ~1.6s into a 3s-throttled load), `crystal-loading-state-loaded.png` (clean final
  render for comparison).
- This directly matches the QUALITY BAR's explicit "missing loading state" fail criterion.

**3. Graphite (graphene sheet) becomes an almost-invisible edge-on sliver for a real portion of every default auto-rotate cycle, at both viewports.**
- Surface: Crystal Structures mode, Graphite, desktop 1440×900 and mobile 390×844. Auto-rotate is
  on by default (`crystalAutoRotate` initial state `true`).
- The graphite GLB is an extremely flat sheet (per the file's own header comment: "graphite
  ~673x502x31mm, an extremely flat wide sheet"). The shared bounding-sphere camera-fit logic used
  for all 3 crystals assumes a roughly cube-like model; for this one asset, a large fraction of
  the auto-rotate cycle (default rotation speed 0.18 rad/s ⇒ ~35s per revolution) presents the
  sheet edge-on, at which point it collapses to a thin near-invisible vertical line — confirmed by
  sampling 8 frames at mobile over ~9.6s (2 of 8 frames caught it edge-on) and 6 frames at desktop
  over ~10s (1 of 6 frames caught it edge-on).
- Screenshots: `crystal-03-graphite-mobile-EDGEON-during-autorotate.png`,
  `crystal-03-graphite-desktop-EDGEON-during-autorotate.png` (both show only a thin dark vertical
  sliver where the honeycomb sheet should be legible), contrasted with
  `crystal-03-graphite-mobile.png` / `crystal-03-graphite-desktop.png` (face-on, clearly legible
  hexagonal honeycomb, good contrast against the off-white background).
- Impact: a learner who leaves the default auto-rotate running (the out-of-the-box state) will
  periodically see the model appear to vanish, with no indication this is expected — this
  contradicts "camera fit: full lattice visible, no clipping" for a meaningful fraction of normal
  viewing time.

**4. Silicon and carbon atoms are visually indistinguishable in the Silicon Carbide model — both render as the same uniform gray/metallic material.**
- Surface: Crystal Structures mode, Silicon Carbide, desktop 1440×900 (representative; same GLB
  at both viewports).
- The lattice's entire teaching point (per its own authored copy: "every silicon atom bonds only
  to carbon atoms... never to another silicon atom directly") depends on being able to tell the
  two elements apart, but a close crop of the rendered mesh shows every sphere sharing the same
  brushed-gray material/color — there is no color-coding distinguishing Si from C the way
  molecule atoms use CPK colors (confirmed by cropping/zooming
  `crystal-02-silicon-carbide-desktop.png`). A learner can only tell the two elements apart by
  clicking each of the 3 hotspots one at a time, not by looking at the model.
- Screenshot: `crystal-02-silicon-carbide-desktop.png` (zoomed crop on file, not saved separately
  since it's the same source frame — see the cluster of spheres in the lower-left/upper-right of
  that image, all identical gray).
- This is a legibility/"distinguishable materials" checklist fail specific to the one crystal that
  has two elements; diamond and graphite are single-element so the same concern doesn't apply
  there.

### P2 — Polish

No additional polish-only issues observed beyond the P1s above; panel copy, layout, and framing
were otherwise clean at both viewports for all 3 crystals (see "What passed" below).

## What passed / was verified clean

- **Camera fit / no clipping (default, non-edge-on views):** All 3 crystals are fully framed with
  margin, centered, no geometry cut off by canvas bounds, at both viewports. Evidence:
  `crystal-01-diamond-desktop.png`, `crystal-01-diamond-mobile.png`,
  `crystal-02-silicon-carbide-desktop.png`, `crystal-02-silicon-carbide-mobile.png`,
  `crystal-03-graphite-desktop.png`, `crystal-03-graphite-mobile.png`.
- **Crystal selector:** Both the desktop left `ContentNav` list and the mobile horizontal chip
  switcher ("Lattice N of 3") successfully switch between all 3 crystals at both viewports, and
  the 3D model, meters (Formula/Bonds per atom/Dimensionality), and right-hand text panel all
  update together. Verified for all 3 crystals at both viewports.
- **Hotspots:** Clicking a hotspot on Diamond (both viewports) and on Graphite (mobile) correctly
  opens/updates the right-hand Detail Panel with the matching structure name, description, and
  "Function" callout, and highlights the "Isolate" toolbar button as active — clear, legible
  cause/effect. Evidence: `crystal-hotspot-click-diamond-desktop.png`,
  `crystal-hotspot-click-mobile.png`, `crystal-hotspot-detailpanel-mobile-scrolled.png` (confirms
  the mobile Detail Panel is reachable by scrolling the right-hand column, no overflow/clipping).
- **Lattice comparison ("Compare all 3 lattices"):** Opens a modal with all 3 crystals shown
  side-by-side as distinct, legibly labeled data/property cards (Elements, Lattice,
  Dimensionality, Coordination) plus a "View this lattice" switch-and-close action; renders
  cleanly with no overflow/clipping at both viewports (mobile stacks the 3 cards vertically inside
  a scrollable modal). Evidence: `crystal-compare-view-desktop.png`,
  `crystal-compare-view-mobile.png`. Note: this is a **data-comparison view, not a live 3D
  side-by-side render** of the two models — same pattern as the toolbar's pairwise "Compare" (via
  `CompareModal.tsx`), which is text/keyFacts-only for both molecules and crystals app-wide. Not
  counted as a defect since the checklist's "if there's a compare/side-by-side lattice view" is
  satisfied by this data view, but flagging so it's not mistaken for a 3D compare.
- **Toolbar:** At desktop, the full vertical toolbar (Rotate, Play [disabled for crystals, no
  animation data — correct], Isolate, Section [disabled — no cross-section feature for crystals,
  correct], Compare, Zoom In, Zoom Out, Full [fit view], More, Reset) is fully visible, labeled,
  and not obscured. At mobile, the same set collapses to an icon-only horizontal row, all icons
  visible and evenly spaced with no clipping or overflow. Evidence: `crystal-toolbar-desktop.png`,
  `crystal-toolbar-mobile.png`.
- **Zoom in/out/fit-view are functional:** Clicking "Zoom In" repeatedly visibly moves the camera
  closer (model fills more of the frame, near its `min` clamp); "Zoom Out" repeatedly moves the
  camera away (model shrinks toward its `max` clamp); "Full" (fit view) returns to the well-framed
  default. Evidence: `crystal-zoom-before.png`, `crystal-zoom-after-zoomin.png`,
  `crystal-zoom-after-zoomout.png`, `crystal-zoom-after-fitview.png`.
- **Mobile layout:** At 390×844, the crystal viewer, its overlay meters/compare button, the
  toolbar, and the bottom lesson/checkpoint/experiment/notebook tray all fit without clipping or
  page-level overflow scrolling issues, across all 3 crystals. Evidence: all `*-mobile.png` files
  above.
- **No internal QA language observed:** No lorem ipsum, TODO strings, debug labels, or internal
  component names were visible in any captured UI surface for this scope.

## Console/page errors observed

- **Normal browsing (no simulated failures):** Only benign/expected noise —
  `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (repeated),
  `[.WebGL-...] GL Driver Message ... GPU stall due to ReadPixels` (repeated, driver-level
  perf warning, headless-GPU artifact not app code), and a `THREE.WebGLRenderer: Context Lost.`
  log at each browser-context teardown (expected on `context.close()`). **No `pageerror` events
  and no application-level console errors during normal navigation of any of the 3 crystals at
  either viewport.**
- **Simulated GLB-fetch failure (P0 repro above):** verbatim pageerror/console output captured
  and quoted in Finding 1.

## Explicitly NOT verified (unproven — flagging rather than guessing)

- Section/cross-section behavior for crystals: the toolbar's "Section" control is disabled
  (`disabled={!onToggleCrossSection}` — `ChemistryLab.tsx` never wires a cross-section handler for
  `labMode === 'crystals'`), so cross-section is simply unavailable for crystals by design; not
  tested further since there is nothing to click.
  attempted on a live dev server, only via simulated request interception in an isolated browser
  profile — did not attempt to find or force a real corrupted/missing-asset condition on disk.
- Xray/labels ("More" menu) toggle interactions and clean-view mode for crystals were not
  individually screenshotted in this pass (toolbar presence/reachability was verified; the
  specific visual effect of each toggle on crystal materials was not separately captured).
- Keyboard-only/screen-reader accessibility of the crystal viewer and hotspots was not tested —
  only pointer/tap interaction via Playwright.
- Real (non-headless) GPU rendering was not tested — this run used headless Chromium software/ANGLE
  rendering, which can occasionally differ subtly in shading from a real GPU; framing/geometry/
  material-color findings above are not expected to be headless-rendering artifacts, but exact
  pixel-level shading fidelity on real hardware was not independently confirmed.

## Deliverables

- Screenshots: `review-screenshots/wave12-2026-08-18/crystal-structures/` (22 files: 3 crystals ×
  2 viewports baseline, plus hotspot/toolbar/compare/loading/error/zoom/edge-on evidence).
- This report: `docs/reviews/wave12-crystal-structures.md`.
