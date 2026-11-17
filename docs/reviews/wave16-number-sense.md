# Wave 16 Visual QA — Number Sense Lab (Place Value hotspots)

Route: `http://127.0.0.1:5174/app/labs/number-sense`
Scope: Place Value component hotspot visibility/clickability above the 3D abacus, and
hotspot-click → detail-panel cause/effect. Reviewer 1 of 8, Wave 16.

Tooling: ad hoc Playwright (Chromium) driven via Node scripts in `/tmp/wave16-number-sense/`,
using the pre-provisioned install at `/tmp/wave16-playwright`. Fresh browser + context per
viewport. `console` and `pageerror` listeners attached on every page load.

Screenshots: `/Users/ahmedjawed/Documents/Kids Learning app/quantaora-app/review-screenshots/wave16-2026-08-18/number-sense/`

## Source inspected (read-only)

- `src/routes/NumberSenseLab.tsx` — `HOTSPOT_POSITIONS['place-value']` (4 hotspots:
  `hs-hundreds`, `hs-tens`, `hs-regroup-ones`, `hs-digit-number`), `HotspotButton` (z-20,
  absolute-positioned button per hotspot), `AbacusStage`/`AbacusCameraRig` (procedural R3F
  soroban, mobile vs. desktop camera rigs), `DetailPanel` usage.
- `src/components/explorer/DetailPanel.tsx` — confirms clicking a hotspot swaps the aside
  content to a "Back to Place Value" + hotspot `label`/`description`/`function`/"where it
  belongs" panel (a real content swap, not just highlighting).
- `src/components/explorer/CanvasControls.tsx` — toolbar positioning (`absolute inset-x-3 top-3`
  desktop `sm:top-4 sm:left-4`, `z-30`).

Existing in-repo code comments (Wave 15 fix, line ~1037) note that place-value hotspot buttons
were previously unclickable because the abacus `<Canvas>` wrapper had `z-10` and the hotspot
buttons had no explicit z-index; the fix added `z-20` to the hotspot buttons. This wave's testing
below verifies that fix still holds.

## Desktop 1440x900

**PASS — hotspots visible, clickable, and above the abacus in stacking order; clicking each
updates the detail panel.**

- All 4 place-value hotspot buttons found in the DOM (`hs-hundreds`, `hs-tens`,
  `hs-regroup-ones`, `hs-digit-number`), all `visible=true` and fully inside the 1440x900
  viewport (no clipping off-screen). Bounding boxes:
  - hs-hundreds: `{x:470, y:178, w:28, h:20}`
  - hs-tens: `{x:696, y:178, w:28, h:20}`
  - hs-regroup-ones: `{x:922, y:178, w:28, h:20}`
  - hs-digit-number: `{x:696, y:293, w:28, h:20}`
- `document.elementFromPoint()` at the center of every hotspot returned the hotspot's own inner
  dot `<span>` (child of the hotspot `<button>`), not the WebGL canvas — i.e. the hotspots sit on
  top of the 3D abacus for hit-testing, confirming the Wave 15 z-index fix is intact.
- Clicking each of the 4 hotspots swapped the right-hand detail panel to a distinct
  "Back to Place Value" view with a matching heading: `Hundreds place`, `Tens place`,
  `Ones place`, `Digit labels` (verified via `aside h2` text before/after each click — all 4
  produced a different heading and body text than the Place Value overview state, and clicking
  a hotspot again toggles back to the overview). This is a clear, legible cause/effect.
- Abacus canvas renders non-blank (frame + 3 rods + 15 beads, matching `placeHundreds=5,
  placeTens=7, placeOnes=3` → 573), fully framed with margin, including the wooden stand/legs at
  the bottom — no clipping observed at this viewport.
- Toolbar controls (Rotate, Play, Isolate, Cross-section, Compare, Zoom in/out, Full, More,
  Reset) all visible and reachable, not obscured.

Evidence:
- `desktop-initial.png` — Place Value overview state, abacus fully framed.
- `desktop-hotspot0-clicked.png` … `desktop-hotspot3-clicked.png` — detail panel after clicking
  each of the 4 hotspots in turn (Hundreds place / Tens place / Ones place / Digit labels).
- `desktop-canvas-only-clip.png` — canvas-only crop showing the full abacus frame with margin,
  including the four wooden legs at the bottom (no clipping at this viewport).

## Mobile 390x844

**Hotspots: PASS (visible, clickable, correctly above the abacus, and drive the same detail-panel
content swap as desktop). Abacus model framing: P1 finding — see below.**

- Reached the Place Value component via the mobile-only horizontal component-switcher chip
  (`button[title="Place Value"]`) in the right-hand aside, since the left `ContentNav` list is
  `lg:block`-only and hidden on mobile (confirmed in source at line ~548).
- All 4 hotspot buttons found, all `visible=true` and fully inside the 390x844 viewport:
  - hs-hundreds: `{x:64.5, y:130.8, w:28, h:20}`
  - hs-tens: `{x:181, y:130.8, w:28, h:20}`
  - hs-regroup-ones: `{x:297.5, y:130.8, w:28, h:20}`
  - hs-digit-number: `{x:181, y:189.7, w:28, h:20}`
- Same `elementFromPoint()` check: each hotspot's own dot `<span>` is the topmost hit at its
  center point, i.e. clickable and not occluded by the canvas.
- Clicking each of the 4 hotspots produced the same 4 distinct panel headings as desktop
  (`Hundreds place`, `Tens place`, `Ones place`, `Digit labels`), confirmed via
  `textChanged=true` and a `Back to Place Value` link appearing after every click.
- Toolbar (Rotate, Play, Isolate, Cross-section, Compare, Zoom in/out, Full, More, Reset) is
  fully visible in one row directly under the app header, not clipped or overlapping other
  chrome (see `mobile-top-clip.png`).

**P1 — abacus 3D model is clipped/cropped by its own canvas on mobile.** The `AbacusStage`
canvas measured `338x133` px on this viewport (vs `672x339` on desktop, a much flatter aspect
ratio: ~2.5:1 vs ~2:1). A crop of exactly the canvas bounding box
(`mobile-canvas-only-clip.png`) shows the taupe frame panel's top edge is not visible (rods run
off the top of the canvas) and the wooden stand/legs visible at the bottom on desktop are absent
here — the model's vertical extent exceeds the canvas viewport on mobile, unlike desktop where
the full frame renders with margin. This does not block the hotspot task (hotspots remain
correctly positioned and clickable regardless), but it does fail the "models are not
clipped"/"properly framed" bar for this route at the mobile viewport. Code comments in
`NumberSenseLab.tsx` (~line 1373) describe a "Wave 10" fix that tuned `ABACUS_CAMERA_MOBILE`
specifically to avoid clipping the top/bottom bead extremes and state the mobile values "already
passed Wave 10 QA" — the crop evidence captured in this pass suggests that framing is currently
still tight/clipped at 390x844, so this may be worth a re-check against the current canvas
height rather than being treated as fixed. (Reported as observed only; no code was touched.)

Evidence:
- `mobile-initial-scrolltop.png` — full mobile page at scroll position 0 after selecting Place
  Value.
- `mobile-top-clip.png` — top 220px crop showing header + toolbar + hotspots, confirming the
  toolbar itself is fully visible and not clipped.
- `mobile-canvas-only-clip.png` — exact canvas-bounding-box crop showing the abacus frame/rods
  cropped top and bottom (compare with `desktop-canvas-only-clip.png`).
- `mobile-hotspot0-clicked.png` … `mobile-hotspot3-clicked.png` — detail panel after clicking
  each of the 4 hotspots (all 4 confirmed to swap content the same as desktop).
- `mobile-stage-only-clip.png` — full stage-container crop (toolbar + canvas + rod +/- controls)
  for additional context.

## Console / page errors

No `pageerror` events were captured on either viewport. Console output was limited to benign
noise, not indicative of a bug:
- `[vite] connecting...` / `[vite] connected.` (dev HMR, expected)
- React DevTools suggestion (expected in dev)
- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (three.js
  library deprecation warning, not from app code, non-blocking)
- Repeated `GL Driver Message ... GPU stall due to ReadPixels` (GPU/WebGL driver performance
  warning, not a JS error; browser stopped repeating it after 4 occurrences as noted in the
  message itself)

## Summary

| Viewport | Hotspots visible+clickable above abacus | Hotspot click → panel content change | Abacus framing |
|---|---|---|---|
| Desktop 1440x900 | PASS | PASS (4/4 distinct headings) | PASS — fully framed with margin |
| Mobile 390x844 | PASS | PASS (4/4 distinct headings) | P1 — model clipped top/bottom in canvas |

No P0s. One P1 (mobile abacus framing/clipping, described above). No P2s identified within this
scoped pass (toolbar, hotspot positioning, and panel-swap interaction all read clean at both
viewports).
