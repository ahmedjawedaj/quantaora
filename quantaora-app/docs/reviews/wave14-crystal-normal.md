# Wave 14 Visual Acceptance Review — Crystal Structures (Normal / Happy-Path Flow)

**Date:** 2026-08-18
**Scope:** Chemistry Lab → "Crystal Structures" mode (`http://127.0.0.1:5174/app/labs/molecules`,
tab switcher "Molecules & Bonding" vs. "Crystal Structures"). Normal/happy-path interaction only —
no intentionally broken network requests (that is a separate reviewer's scope).
**Reviewer:** Read-only Playwright QA agent (isolated Chromium profile, own local Playwright
1.62.1 install in `/tmp/wave14-crystal-normal-qa`, no product files touched besides screenshots
and this report).
**Source files read (read-only):** `src/data/crystals.ts`, `src/components/explorer/CrystalViewer.tsx`,
`src/routes/ChemistryLab.tsx`, `src/components/explorer/DetailPanel.tsx`,
`src/components/explorer/CanvasControls.tsx`, `src/components/ui/Modal.tsx`,
`src/components/explorer/ContentNav.tsx`, and the prior `docs/reviews/wave12-crystal-structures.md`
for context on what to re-check.

Viewports: Desktop 1440×900, Mobile 390×844. All 3 crystals in `crystals.ts` (Diamond, Silicon
Carbide, Graphite/Graphene Sheet — the only 3 in the app) were covered at both viewports.

## Headline

Diamond and Graphite are clean PASSes at both viewports, with both Wave 12 P1s specific to them
(missing loading-state UI; Graphite vanishing edge-on during auto-rotate) confirmed **fixed**.
Silicon Carbide is **CONDITIONAL**: its Wave 12 "materials not distinguishable" P1 is **still
failing in practice** — the code now includes a color-coded Si/C legend specifically meant to fix
this, but that legend renders **completely hidden behind the canvas toolbar** at both viewports
(including in "Clean view" mode), so a real learner still cannot tell silicon from carbon by
looking at the model. A second, related P1 was found: Silicon Carbide's on-canvas caption pill
(crystal name + element label) wraps and is illegible where it collides with the toolbar at
desktop width. No P0s, no console/page errors, in this normal-flow pass.

## Summary table

| Crystal | Load/render | Framing | Loading-state UI | Materials distinguishable | Hotspots | Auto-rotate | Compare |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Diamond | PASS | PASS | PASS (shared code, verified via Graphite) | PASS (single element, N/A) | PASS (3/3) | PASS | PASS |
| Silicon Carbide | PASS | PASS | PASS (shared code, verified via Graphite) | **FAIL (P1)** | PASS (3/3, but see caption-overlap P1) | PASS (not a flat-sheet case) | PASS |
| Graphite (Graphene Sheet) | PASS | PASS | PASS (directly verified) | PASS (single element, N/A) | PASS (3/3) | **PASS — Wave 12 edge-on P1 confirmed fixed** | PASS |

## Findings by severity

### P0 — Broken/blocking

None observed in this normal-flow pass. (Wave 12's P0 — a failed GLB fetch crashing the whole app
via a missing error boundary — is out of this reviewer's scope, which is explicitly normal
happy-path only; note that `CrystalViewer.tsx` now visibly contains a `GlbErrorBoundary` class and
a non-null `Suspense` fallback, which reads as a intentional fix for that finding, but re-verifying
it under simulated network failure was not performed here by design — see "not covered" below.)

### P1 — Significant

**1. Silicon Carbide: the Si/C color legend — the code's own fix for Wave 12's "materials not
distinguishable" finding — is completely hidden behind the canvas toolbar, at both viewports, so
the underlying legibility problem is unresolved for a real user.**
- `CrystalViewer.tsx` computes an `elementLegend` (color-swatch list mapping each hotspot color to
  "Silicon atom" / "Carbon atom") specifically because "individual atoms can't be recolored in the
  rendered mesh itself" for this GLB, and renders it `absolute left-3 top-3 z-10`. The
  `CanvasControls` toolbar is `absolute ... left-4 top-4 z-30` (desktop) / `inset-x-3 top-3 z-30`
  (mobile) — same corner, higher z-index — so the toolbar sits directly on top of the legend and
  fully occludes it.
- Desktop evidence: only a two-line sliver of text ("n atom" / "n atom" — the tail ends of
  "Silicon atom" / "Carbon atom") peeks out to the right of the toolbar's rounded corner; the color
  swatches themselves (the only per-element visual cue) are 100% hidden. Screenshot:
  `crystal-silicon-carbide-desktop.png`, cropped evidence `sic-legend-crop.png`.
- Mobile evidence: the legend box is entirely covered by the horizontal toolbar row; only a faint
  drop-shadow edge is visible peeking out bottom-left of the toolbar, no text or color dots at all.
  Screenshot: `crystal-silicon-carbide-mobile.png`, cropped evidence `sic-legend-crop-mobile2.png`.
- Also re-confirmed the original Wave 12 root cause is still true independently of the legend: a
  zoomed crop of the raw mesh shows every sphere (both Si and C) rendered in the same uniform
  gray/blue-gray material with zero per-atom color differentiation. Evidence: `sic-model-crop.png`.
- Also checked whether "Clean view" (which collapses the toolbar to a small "Show UI" pill) frees
  up the corner for the legend to become visible — it does not: the legend is still not visible
  anywhere in Clean view either. Evidence: `crystal-sic-cleanview-legend-check-desktop.png`.
- **Net result: a learner viewing Silicon Carbide today has no way to visually distinguish a
  silicon atom from a carbon atom in the model at a glance — only by clicking each of the 3
  hotspots one at a time and reading the text — exactly the Wave 12 finding, unresolved.**
- Verdict: **materials-distinguishability check = FAIL** for Silicon Carbide (Diamond and Graphite
  are single-element, so N/A/PASS there by definition).

**2. Silicon Carbide, desktop 1440×900 only: the on-canvas caption pill (crystal name + element
label + interaction hint) wraps to 2 lines and becomes illegible where it overlaps the toolbar.**
- Silicon Carbide's `elementsLabel` ("Silicon (Si) and Carbon (C) — a compound, not elemental
  silicon") is much longer than Diamond's or Graphite's, so the centered caption pill
  (`SILICON CARBIDE (SILICON (SI) AND CARBON (C) — A COMPOUND, NOT ELEMENTAL SILICON) · DRAG TO
  ROTATE · TAP A HOTSPOT`) wraps, and its wrapped left edge extends underneath the toolbar rail
  (`z-10` caption vs. `z-30` toolbar, same top-of-canvas region), leaving partially-legible text
  bleeding through/behind the toolbar's rounded panel.
- Diamond's and Graphite's shorter labels stay on one line and do not exhibit this at the same
  viewport — this is specific to Silicon Carbide's longer authored copy.
- Screenshot: `crystal-silicon-carbide-desktop.png`, cropped evidence `sic-toolbar-crop.png`.
- Not observed at mobile — mobile uses a much shorter caption string
  ("Touch a hotspot to explore") that never wraps.

### P2 — Polish

None observed beyond the P1s above. Framing, hotspot interaction mechanics, panel copy/layout, and
compare views were otherwise clean at both viewports for all 3 crystals.

## What passed / was verified clean

- **Diamond — model load/render/framing:** Fully framed, centered, no clipping, both viewports.
  Evidence: `crystal-diamond-desktop.png`, `crystal-diamond-mobile.png`.
- **Diamond — hotspots (3/3):** Carbon atom, Covalent bond, Tetrahedral unit cell all open the
  Detail Panel with matching label/description/Function callout, close cleanly via "Back to
  Diamond", no overflow. Evidence: `crystal-diamond-hotspot-carbon-atom-desktop.png`,
  `crystal-diamond-hotspot-covalent-bond-desktop.png`,
  `crystal-diamond-hotspot-tetrahedral-unit-cell-desktop.png`, mobile equivalents, plus
  `crystal-diamond-hotspot-detailpanel-mobile-scrolled.png` confirming the mobile Detail Panel is
  reachable by scrolling past the crystal switcher/lattice-comparison block above it (same
  established pattern as Wave 12), with legible non-clipped content once scrolled into view.
- **Graphite — loading-state UI (Wave 12 P1, re-verified fixed):** Throttling the GLB fetch by
  ~1.8s and screenshotting mid-fetch now shows a clean, centered "Loading lattice…" pill (role=
  status) instead of a silently blank canvas, at both viewports. Evidence:
  `crystal-graphite-loading-state-desktop.png`, `crystal-graphite-loading-state-mobile.png`,
  `crystal-graphite-loaded-after-throttle-desktop.png`,
  `crystal-graphite-loaded-after-throttle-mobile.png`. (This is shared `Suspense`
  fallback code in `CrystalViewer.tsx` used identically for all 3 crystals, so this fix is expected
  to generalize to Diamond/Silicon Carbide too, though only Graphite's fetch was independently
  throttled and captured — see "not covered.")
- **Graphite — auto-rotate edge-on vanish (Wave 12 P1, re-verified fixed):** Sampled 10 frames over
  ~30s of continuous auto-rotate at each viewport (~86% of one full ~35s revolution). In every
  sampled frame the honeycomb sheet stayed face-on to the camera and legible — the sheet now
  visibly spins in-plane around its own face-normal (thin) axis rather than tumbling around the
  world Y-axis, so it never collapses to an edge-on sliver. Evidence:
  `crystal-graphite-autorotate-frame0-desktop.png` through `...-frame9-desktop.png` and the mobile
  equivalents (10 frames each, all legible, none edge-on).
- **Graphite — hotspots (3/3):** Carbon atom, Hexagonal ring, Planar sheet all open/close cleanly
  with legible, correctly matched Detail Panel content, both viewports. Evidence:
  `crystal-graphite-hotspot-carbon-atom-desktop.png`,
  `crystal-graphite-hotspot-hexagonal-ring-desktop.png`,
  `crystal-graphite-hotspot-planar-sheet-desktop.png`, mobile equivalents.
- **Silicon Carbide — model load/render/framing:** Fully framed, centered, no clipping, both
  viewports (framing itself is fine; the materials/legend/caption issues above are legibility, not
  framing, problems). Evidence: `crystal-silicon-carbide-desktop.png`,
  `crystal-silicon-carbide-mobile.png`.
- **Silicon Carbide — hotspots (3/3) mechanics:** Silicon atom, Carbon atom, Hexagonal stacking all
  open/close cleanly and each Detail Panel's text content is itself legible and non-overflowing
  (independent of the legend/caption bugs above, which live in the always-visible canvas overlay,
  not the Detail Panel). Evidence: `crystal-silicon-carbide-hotspot-silicon-atom-desktop.png`,
  `crystal-silicon-carbide-hotspot-carbon-atom-desktop.png`,
  `crystal-silicon-carbide-hotspot-hexagonal-stacking-desktop.png`, mobile equivalents.
- **Cause/effect legibility for hotspots (all 3 crystals, both viewports):** Clicking a hotspot
  visibly (a) enlarges/pulses the marker dot, (b) activates the toolbar "Isolate" button, (c)
  dims the rest of the model slightly, and (d) swaps the Detail Panel to the matching structure
  name/description/Function card — a learner can clearly tell their tap did something, for every
  hotspot tested (9 total: 3 per crystal).
- **"Compare all 3 lattices" (3-way `LatticeCompareModal`):** Opens a data-comparison modal showing
  all 3 crystals side-by-side (Elements / Lattice / Dimensionality / Coordination), desktop as a
  3-column grid, mobile as a scrollable single-column stack — no overflow/clipping/cut-off text at
  either viewport, closes cleanly via the "×" button. Evidence: `crystal-compare-all3-desktop.png`,
  `crystal-compare-all3-mobile.png`.
- **Pairwise toolbar "Compare" (`CompareModal`, Diamond vs. its `compareCandidate` Graphite):**
  Toolbar Compare button is enabled (not `disabled`) for Diamond; clicking it opens a clean 2-up
  comparison card (Formula / Elements / Bonding / Lattice / Coordination / Hardness or Note) at
  both viewports, no overflow, closes cleanly. Evidence:
  `crystal-pairwise-compare-diamond-desktop.png`, `crystal-pairwise-compare-diamond-mobile.png`.
- **Mobile crystal switcher ("Lattice N of 3" chip row) and desktop `ContentNav` list:** Both
  reliably switch the active crystal, model, meters (Formula/Bonds-per-atom/Dimensionality), and
  right-hand text panel together, verified for all 3 crystals at both viewports.
- **No internal QA language observed:** No lorem ipsum, TODO strings, debug labels, or internal
  component names visible in any captured UI surface for this scope.

## Console/page errors observed

No `pageerror` events and no application-level console errors during this entire normal-flow pass
(both viewports, all 3 crystals, all hotspots, both compare modals, auto-rotate sampling, and the
one throttled-load test). Only benign/expected noise, quoted verbatim:
- `[desktop] warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
- `[desktop] warning: [.WebGL-0x11c00506600]GL Driver Message (OpenGL, Performance,
  GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (repeated a few times, then
  `... (this message will no longer repeat)`) — a headless/software-GL driver performance notice,
  not an application error.
- `[mobile] warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`

## Explicitly NOT verified (unproven / not covered — flagging rather than guessing)

- **Simulated/real GLB fetch failure and the P0 crash Wave 12 found:** out of this reviewer's
  assigned scope (normal happy-path only, no intentionally broken network requests). Source
  inspection shows `CrystalViewer.tsx` now has a `GlbErrorBoundary` class and a non-`null` Suspense
  fallback where Wave 12 found neither, which reads as an intentional fix, but this was not
  independently re-verified live in this pass.
- **Loading-state UI for Diamond and Silicon Carbide specifically:** only Graphite's GLB fetch was
  throttled and screenshotted mid-load; Diamond/Silicon Carbide use the exact same shared
  `Suspense`/`CrystalLoadingFallback` code path in `CrystalViewer.tsx`, so the fix is expected to
  generalize, but each crystal's own fetch was not independently throttled and captured.
- **Auto-rotate edge-on behavior for Diamond and Silicon Carbide:** not sampled over a full
  rotation the way Graphite was, since both are roughly cube-shaped (per the file's own
  `isFlatSheet` check, `CrystalViewer.tsx` only applies the thin-axis spin fix to models whose
  thinnest axis is <25% of their largest — Graphite is the only crystal that qualifies), so there
  is no equivalent "vanish" risk to check for these two; not independently sampled/screenshotted
  over a long rotation regardless.
- **Silicon Carbide's own pairwise `compareCandidate` (Diamond) via the toolbar Compare button:**
  the pairwise Compare mechanism itself was verified working (via Diamond → Graphite), but Silicon
  Carbide's own toolbar Compare click was not independently screenshotted (time-boxed).
- **X-Ray view and Show-labels toggles' specific visual effect on crystal materials:** confirmed
  reachable in the "More" menu (`crystal-sic-more-menu-open-desktop.png`) but their rendered effect
  on the crystal meshes was not separately captured/verified in this pass.
- **Keyboard-only/screen-reader accessibility** of the crystal viewer and hotspots: not tested —
  pointer/tap interaction via Playwright only.
- **Real (non-headless) GPU rendering:** this run used headless Chromium software/ANGLE rendering;
  exact pixel-level shading fidelity on real hardware was not independently confirmed, though the
  legend-occlusion and caption-wrap findings above are DOM/CSS-positioning issues, not rendering
  artifacts, and are not expected to be headless-specific.

## Deliverables

- Screenshots: `review-screenshots/wave14-2026-08-18/crystal-normal/` (61 files — baselines,
  hotspot open/close states for all 9 hotspots × 2 viewports, loading-state throttle captures,
  10-frame auto-rotate sampling for Graphite × 2 viewports, both compare modals × 2 viewports, and
  cropped zoom evidence for the two Silicon Carbide P1s).
- This report: `docs/reviews/wave14-crystal-normal.md`.
