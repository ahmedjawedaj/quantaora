# Wave 16 Visual QA — Crystal Structures (Chemistry / Molecules lab)

**Reviewer:** 2 of 8 (parallel Wave 16 pass)
**Route:** `http://127.0.0.1:5174/app/labs/molecules` → "Crystal Structures" tab
**Source inspected (read-only):** `src/routes/ChemistryLab.tsx`, `src/components/explorer/CrystalViewer.tsx`, `src/data/crystals.ts`
**Viewports:** Desktop 1440x900, Mobile 390x844
**Tooling:** ad hoc Playwright/Chromium script at `/tmp/wave16-crystal/script.js` (isolated install at `/tmp/wave16-playwright`), not committed to the repo.
**Screenshots:** `review-screenshots/wave16-2026-08-18/crystal/`
**Raw DOM measurements + network counters:** `review-screenshots/wave16-2026-08-18/crystal/results.json`
**Console/page/network error capture:** `review-screenshots/wave16-2026-08-18/crystal/console-log.txt`

## Scope covered

- Entered Chemistry/Molecules lab, switched to the "Crystal Structures" tab (`labMode='crystals'` in `ChemistryLab.tsx`).
- All 3 crystals in `src/data/crystals.ts`: Diamond (`crystal-diamond`), Silicon Carbide (`crystal-silicon-carbide`, the two-element compound with an always-on element legend), Graphite/Graphene sheet (`crystal-graphite`).
- Legend visibility/positioning check (DOM bounding boxes) for the SiC legend at both viewports.
- Simulated GLB fetch failure via `page.route('**/*.glb', ...)` scoped to each crystal's specific filename, aborting the request, then removing the abort and clicking "Try again" to verify a real re-fetch + remount, at both viewports.

## Findings

### PASS — SiC legend renders as its own separate, visible element outside the toolbar

- `CrystalViewer.tsx` (lines 428-448) renders the element-color legend as its own `<div>` positioned `absolute right-3 top-20` (mobile) / `sm:right-4 sm:top-4` (desktop) — a sibling of the `<Canvas>`, not nested inside `CanvasControls`' toolbar container.
- Desktop: legend DOM rect measured at `x:956.9, y:127, w:107, h:55` (`results.json` → `legendBoxDesktop`). The toolbar rail renders as a vertical stack on the far left (`x≈280-330`, visible in screenshot). The two do not visually overlap — confirmed in `desktop-02-sic-selected.png` and the close-up `desktop-03-sic-legend-closeup.png`: the "Silicon atom / Carbon atom" swatch card sits top-right, fully legible, independent of the left-side toolbar rail.
  - Note: my own bounding-box overlap calculation in `results.json` (`legendToolbarOverlapAreaDesktop`) is misleading — the harness's toolbar-locator heuristic climbed too many DOM ancestors and captured an oversized container, not the real toolbar rail. Visual screenshot evidence is the reliable signal here and confirms no actual overlap or obstruction.
- Mobile: legend DOM rect `x:270.9, y:191, w:107, h:55` (`results.json` → `legendBoxMobile`), toolbar renders as a short horizontal icon bar near the top (`mobile-01-sic-selected.png`). Legend sits clear of it, fully visible, own element, not collapsed into any "more"/overflow menu.
- `display:block`, `visibility:visible`, `opacity:1` confirmed via `getComputedStyle` at both viewports.
- Diamond and Graphite correctly show **no** legend (single-element crystals) — matches the intentional `elementLegend` logic (only rendered when more than one distinct hotspot color exists), confirmed in `desktop-01-crystals-diamond-default.png` and `desktop-04-graphite-loaded.png`.

Evidence: `desktop-02-sic-selected.png`, `desktop-03-sic-legend-closeup.png`, `mobile-01-sic-selected.png`, `mobile-02-sic-legend-closeup.png`.

### PASS — Normal crystal models load and render correctly

- Diamond (default on entering Crystal Structures mode): renders a clean tetrahedral cage, centered and framed, toolbar and side panel intact, no console errors. `desktop-01-crystals-diamond-default.png`.
- Silicon Carbide: renders correctly with two-tone atoms and legend. `desktop-02-sic-selected.png`.
- Graphite (graphene sheet): renders the flat honeycomb sheet correctly, centered, no clipping. `desktop-04-graphite-loaded.png`.
- Console/page-error log for these normal loads (`console-log.txt` lines 1-6, 16-17) shows only benign, expected messages (`THREE.Clock` deprecation notice, WebGL `GPU stall due to ReadPixels` performance advisories) — no actual errors during normal loads.
- (Harness note: an in-page canvas pixel-sampling check I added returned `mean:0, variance:0` for these canvases — this is a limitation of my readback method against a WebGL context without `preserveDrawingBuffer`, not a real blank-canvas bug; the full-page screenshots above are the reliable evidence and clearly show real rendered geometry.)

### PASS — GLB load-failure state: retry control is reachable and correctly positioned

- Simulated failure by aborting the network request for the target crystal's specific `.glb` filename before it was ever fetched (Graphite on desktop, SiC on mobile), then triggering that crystal's selection.
- `GlbErrorBoundary` in `CrystalViewer.tsx` caught the failure and rendered the expected fallback: "This crystal lattice model couldn't load." + a "Try again" button, centered inside the canvas, fully visible and unobstructed by any other UI (toolbar, legend, or overlay meters) at both viewports.
- Confirmed via DOM: `errorStateDesktop.btnVisible: true`, `errorStateMobile.btnVisible: true` (`results.json`).
- Console/page-error log correctly shows the underlying failure being surfaced, not silently swallowed: `requestfailed`, `console.error: Failed to load resource: net::ERR_FAILED`, `pageerror: Could not load .../crystal-graphite-sheet-nih-material-fixed.glb: Failed to fetch`, and the app's own `[CrystalViewer] Crystal GLB failed to load.` warning (`console-log.txt` lines 9-15 desktop, 20-26 mobile).

Evidence: `desktop-05-graphite-load-failure.png`, `mobile-03-sic-load-failure.png`.

### PASS — Retry flow directly exercised and observed to actually recover (not inferred)

This was tested end-to-end, not assumed:
1. Counted network requests to the target `.glb` via the Playwright route handler while aborting (1 request observed, matching the initial failed load).
2. Stopped aborting (let the route pass through) and clicked the "Try again" button.
3. Directly observed a **second** network request fire for the same URL after the click (`requestCountBeforeClick: 1` → `requestCountAfterClick: 2` on desktop; `mRequestCountBeforeClick: 1` → `mRequestCountAfterClick: 2` on mobile — `results.json`), confirming `CrystalViewer.tsx`'s `retryLoad()` (`useGLTF.clear(url)` + `retryKey` bump, `CrystalViewer.tsx` lines 339-342) genuinely re-fetches rather than re-showing a cached rejection.
4. Confirmed the error alert (`[role="alert"]`) was gone from the DOM after retry (`errorAlertGoneAfterRetry: true` desktop, `mErrorAlertGoneAfterRetry: true` mobile).
5. Confirmed via screenshot that the canvas remounted with real, correctly framed geometry (not still blank/error): `desktop-06-graphite-recovered-after-retry.png` shows the full graphene honeycomb sheet, pixel-identical in composition to the normal-load screenshot; `mobile-04-sic-recovered-after-retry.png` shows the SiC lattice with its legend intact.

This is a genuine, directly-observed pass of the retry mechanism at both viewports — not inferred from UI resting state alone.

## Issues found

None at P0/P1/P2 within this scope. Everything checked (legend visibility/placement, normal model rendering, failure-state UI, and retry recovery) passed at both viewports.

## Coverage notes / limitations

- Scope was bounded to the crystal-structures surface only, per instructions — no broader exploration of the Molecules & Bonding mode or other labs.
- The in-script canvas-pixel-sampling helper I wrote returned zeroed stats for all WebGL canvases (a readback limitation of my own throwaway script against a non-`preserveDrawingBuffer` WebGL context), so canvas "non-blank" verification here rests on the full-page screenshots (which clearly show rendered 3D geometry) rather than that pixel-stats helper — noted for transparency, not treated as a finding against the product.
- Did not test simultaneous/rapid double-clicks on "Try again," slow-network (throttled, not aborted) failure/timeout paths, or failures on Diamond specifically (only Graphite on desktop and SiC on mobile were used for the abort/retry test) — those would be reasonable follow-ups if deeper failure-mode coverage is wanted later.
