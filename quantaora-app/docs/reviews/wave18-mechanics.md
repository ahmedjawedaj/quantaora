# Wave 18 Visual QA — Mechanics (Physics/Motion) Lab

Reviewer: Wave 18 read-only QA agent (scope: Mechanics)
Route: `http://127.0.0.1:5174/app/labs/motion` (`src/routes/PhysicsLab.tsx`, toolbar in
`src/components/explorer/CanvasControls.tsx`)
Date: 2026-08-18
Viewports: Desktop 1440x900, Mobile 390x844
Tooling: isolated Playwright 1.62.1 (shared install at `/tmp/wave18-pw-shared`, own Chromium
process/context launched from `/tmp/wave18-mechanics-qa/*.js`), `page.on('console')` and
`page.on('pageerror')` captured throughout.
Screenshots: `review-screenshots/wave18-2026-08-18/mechanics/` (27 PNGs + `console-log.txt` +
`results.json`, filenames referenced inline below).

Prior reports read for context: `docs/reviews/wave12-mechanics.md`, `docs/reviews/wave14-mechanics.md`
(a `docs/reviews/wave17-mechanics.md` is referenced in source-code comments as the origin of the
current baseball/tape separation values, but no such file exists in `docs/reviews/` — only
wave12 and wave14 reports are present on disk; the wave17 fix itself is visible directly in
`src/routes/PhysicsLab.tsx` code comments and was verified live in this pass).

---

## Overall verdict: PASS, no P0/P1 found. 3 P2 notes.

The historically recurring P1 (baseball/tape visually overlapping/blending at default framing,
flagged in wave12 and again in wave14) **no longer reproduces** — it appears the wave17 fix
mentioned in the source comments (tape x-pullback widened to `START_POSITION - 0.75`, tape z-lane
moved to `0.38`, baseball z-lane at `1.05`) resolved it. See finding below.

---

## 1. Baseball vs. tape visual distinction at default state — PASS (prior P1 now fixed)

Loaded `Distance` (motion-measure mode) at both viewports, at the component's true default
state (no interaction). Prior reports (wave12 P1 #3, wave14 P1) documented the tracked baseball
and the measuring-tape prop rendering as a single blended cluster with the tape barely/not
visible behind the ball at this exact state.

**Current state: the two props are now clearly two distinct objects** — a small gold-and-black
rectangular tape case sits to the left, and a separate white/grey sphere (baseball) sits to its
right, with visible daylight/gap between them, at both viewports. Re-verified on `Distance` and
`Velocity` (both motion-measure components) at desktop; re-verified on `Distance` at mobile.

Evidence (desktop): `02-distance-default-desktop.png` (full scene), `02b-distance-default-desktop-stage.png`
(canvas crop), `20-distance-zoomedin-desktop.png` / `21-distance-cluster-closeup-desktop.png`
(zoomed-toolbar close-up — tape case and baseball unambiguously separate, different shape/color),
`26-velocity-default-desktop.png` / `27-velocity-cluster-closeup-desktop.png` (same check repeated
on the Velocity component, same result).

Evidence (mobile): `13-distance-default-mobile.png`, `13b-distance-default-mobile-stage.png`,
`22-distance-cluster-closeup-mobile.png`, `25-distance-cluster-closeup-mobile-hires.png` (hi-DPI
zoomed-in crop — tape case and baseball clearly two separate objects, not overlapping).

**Verdict: PASS.** No overlap/occlusion observed at either viewport in the component's default,
un-interacted state — the specific defect wave12/wave14 flagged does not reproduce.

## 2. On-canvas label deconfliction (1440x900) — PASS

Checked the Force (default landing) view and the Distance/Velocity (motion-measure) views for
overlapping/illegible labels.

- Force view (`01-initial-force-desktop.png`): "net force", "applied force", "momentum stack",
  and the bottom part-name labels ("Force Arrows", "Object", "Net Force Arrow", "Newton Scale")
  are all spatially separated with no overlapping text.
- Distance view (`02-distance-default-desktop.png`, `21-distance-cluster-closeup-desktop.png`):
  "tape reads 0.00 m" (gold), "friction" (dim green, inactive-mode label), "net force" (green),
  "applied force" (blue), "position -1.6 m" (black), "distance 0.0 m" (gold) are stacked close
  together near the cart cluster but each sits on its own line/color with no character-level
  overlap; all remain individually legible in the close-up crop.
- Bottom part-name row ("Distance Counter", "Start Point", "Finish Point", "Straight Line
  (displacement)") is evenly spaced with no collisions.

**Verdict: PASS.** No two labels overlap to the point of being unreadable at 1440x900, though the
motion-measure cluster's label density right at the cart is tight (see P2 note below).

## 3. Mobile toolbar (390x844) — PASS with one P2 (tap-target size)

Toolbar renders as a single non-wrapping horizontal row at the **top** of the canvas stage (not
the bottom — this is simply where `CanvasControls` places it at all viewport widths, per
`src/components/explorer/CanvasControls.tsx`; the same component is also a vertical left rail on
desktop). All 10 icons (Rotate, Play, Isolate, Section, Compare, Zoom In, Zoom Out, Full, More,
Reset) are visible in one row, none clipped or overlapping, all render icon-only (labels are
`sm:block`-gated and hidden below the 640px breakpoint, so mobile relies on icon shape +
`aria-label`/`title` only, not visible text).

Evidence: `14-toolbar-mobile.png` (full context), `14b-toolbar-mobile-closeup.png` (tight crop
of just the row).

Measured button bounding boxes via Playwright (`results.json`): every one of the 10 buttons is
**33.4px × 32px**, spaced with small gaps, total row width ~352px inside the 390px viewport.

**P2 — tap targets are under the ~40px guidance.** At 32-33px square, these buttons are below
the "roughly 40px+" comfortable-tap-target bar. Not a functional failure (buttons are not
overlapping each other and remain individually clickable — confirmed by successfully clicking
Zoom In/Out/Isolate/Reset in sequence with no mis-hits), but real fingers on a real touchscreen
have less margin for error than Playwright's programmatic clicks. Contrast/legibility of the
icon glyphs themselves is fine (dark ink-500 stroke on off-white background, `strokeWidth={1.75}`).

**P2 — Rotate vs. Reset icon similarity at icon-only mobile size.** With no visible text label at
this viewport, `Rotate` (`RotateCcw`, a partial circular arrow) and `Reset` (`RefreshCcw`, two
opposing circular arrows) look similar at 16px icon size and sit at opposite ends of the same
row; a first-time learner without a mouse-hover `title` tooltip may need a moment to tell them
apart by shape alone. Not a defect (icons are visibly different on closer inspection — one arrow
vs. two), but worth flagging as a legibility nuance specific to the icon-only mobile treatment.

## 4. Camera actions (rotate / zoom / reset / isolate / fit view) — PASS at both viewports

All controls exercised produce a visible, verifiable change (pixel-diffed the canvas region
between before/after captures using PIL, in addition to visual screenshot review):

- **Zoom In** (desktop): scene visibly enlarges. `03-toolbar-before-desktop.png` →
  `04-zoomin-after-desktop.png`. Mobile: `15-toolbar-before-mobile.png` → `16-zoomin-after-mobile.png`.
- **Zoom Out**: scene visibly shrinks. Desktop `04-zoomin-after-desktop.png` →
  `05-zoomout-after-desktop.png`. Mobile `16-zoomin-after-mobile.png` → `17-zoomout-after-mobile.png`.
- **Isolate**: opens the "Distance Counter" hotspot detail panel in the right-hand aside and
  gold-highlights the corresponding track part's label on-canvas. Desktop:
  `05-zoomout-after-desktop.png` → `06-isolate-after-desktop.png` (right panel switches from
  "Distance" lesson copy to a "Distance Counter" structure card; canvas label for "Distance
  Counter" becomes bold/gold). Mobile: `23-stage-before-isolate-mobile.png` →
  `24-stage-after-isolate-mobile.png` (same "Distance Counter" label highlight appears).
- **Auto-rotate**: canvas-only pixel diff between a before-frame and an after-3s frame is
  substantial (1,647,602 summed abs RGB diff over an 820x657 crop — visibly rotated camera),
  confirming continued rotation. `08-autorotate-before-desktop.png` →
  `09-autorotate-after3s-desktop.png`.
- **Fit view** (via More menu): pulls the camera back further than the manual zoom-out state to
  frame the full scene bounds. `10-more-menu-desktop.png` (menu open, all 4 items — Show labels,
  X-Ray view, Fit view, Clean view — visible and not clipped) → `11-fitview-after-desktop.png`.
- **Reset**: canvas-only pixel diff confirms the camera framing moves back toward the true
  default (diff vs. the original default frame = 2.73M) rather than staying at the
  pre-reset zoomed-out/isolated framing (diff vs. that state = 4.84M) — i.e. Reset does visibly
  re-frame the camera closer to default. `07-reset-after-desktop.png`; mobile: same effect
  observed at `19-reset-after-mobile.png` (visibly more zoomed-in/default framing than the
  preceding `18-isolate-after-mobile.png`).

**P2 — Reset does not clear the previously-opened hotspot detail panel.** After clicking Reset
following an Isolate interaction, the right-hand panel still shows the "Distance Counter"
structure card with a "Back to Distance" breadcrumb (`07-reset-after-desktop.png`) rather than
returning to the component's default lesson copy — confirmed against source
(`src/routes/PhysicsLab.tsx`'s `reset()` handler calls `setIsolateActive(false)` but never calls
`setActiveHotspotId(null)`, unlike `selectComponent()` which does clear it). This is a minor
state-scope inconsistency (camera/sim/prediction state is fully reset, but hotspot-selection
state is not) rather than a broken interaction — the panel content is still legible and
non-overflowing, just not what "Reset" might imply to a learner.

## 5. Console / page errors — PASS, no errors

**Zero `pageerror` events** across desktop and mobile runs. All console output is the same
benign dev/engine noise seen in wave12/wave14 (verbatim, from `console-log.txt`):

```
[desktop] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[desktop] console.warning: [.WebGL-0x1240057a200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[desktop] console.debug: unsupported GPOS table LookupType 8 format 2
[desktop] console.debug: unsupported GSUB table LookupType 6 format 1
[mobile] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[mobile] console.debug: unsupported GPOS table LookupType 8 format 2
```

No `[PhysicsLab]` GLB-load-failure warnings were emitted at either viewport, confirming both the
baseball and measuring-tape GLBs loaded successfully in this pass.

## 6. No leaked internal/QA language — PASS

Regex-scanned `document.body.innerText` and full `page.content()` HTML on the Distance component
(desktop) for `\bhs-[a-z0-9-]+` (raw hotspot slugs) and for `TODO|FIXME|lorem ipsum|placeholder|debug|QA`:
zero matches in both the rendered text and the raw HTML. All on-canvas labels observed across
Force/Distance/Velocity are human-readable ("Force Arrows", "Distance Counter", "Straight Line
(displacement)", "tape reads 0.00 m", etc.) — no internal component/id names visible.

---

## Summary table

| # | Checklist item | Verdict | Severity |
|---|---|---|---|
| 1 | Baseball/tape distinguishable at default state (both viewports) | **PASS** (prior P1 fixed) | — |
| 2 | On-canvas label deconfliction, 1440x900 | PASS | — |
| 3 | Mobile toolbar: readable, not clipped/overlapping | PASS | — |
| 3a | Mobile toolbar tap-target size (~40px guidance) | FAIL | P2 |
| 3b | Rotate vs. Reset icon similarity, icon-only mobile | FAIL | P2 |
| 4 | Zoom In/Out visible effect (both viewports) | PASS | — |
| 4 | Isolate visible effect (both viewports) | PASS | — |
| 4 | Auto-rotate visible effect (desktop, pixel-diff confirmed) | PASS | — |
| 4 | Fit view visible effect (desktop) | PASS | — |
| 4 | Reset restores camera framing (both viewports, pixel-diff confirmed) | PASS | — |
| 4a | Reset does not clear open hotspot detail panel | FAIL | P2 |
| 5 | Console/page errors | PASS (none) | — |
| 6 | No leaked `hs-*`/debug/QA text | PASS | — |

**P0: 0. P1: 0. P2: 3** (mobile tap-target size below ~40px; Rotate/Reset icon similarity at
icon-only mobile size; Reset leaves the hotspot detail panel open).

---

## Not covered / out of scope for this pass

- Only 2 of the 5 motion-measure components (Distance on both viewports, Velocity on desktop
  only) were directly screenshotted for the baseball/tape check; Position, Displacement, Speed
  were not individually re-verified, though they share the identical `TrackedBaseball`/
  `MeasuringTapeTool` code path and fixed coordinates, so the same fix is expected to apply.
- Friction/gravity/momentum mode canvases, Lesson modal, Quiz modal, and Compare modal were not
  re-opened in this pass (all confirmed leak-free and non-overflowing as of wave14; not
  re-verified here since this pass's assigned scope was the baseball/tape regression check,
  label deconfliction, mobile toolbar, and camera-action cause/effect only).
- Section (cross-section) tool remains disabled/unwired for mechanics, as in prior waves — not
  exercised since no handler is passed in.
- Fullscreen toggle was not exercised (consistent with prior waves' rationale — headless-Chromium
  fullscreen API behavior is unreliable in automation).

## Screenshot index (all in `review-screenshots/wave18-2026-08-18/mechanics/`)

Initial state: `01-initial-force-desktop.png`, `02-distance-default-desktop.png`,
`02b-distance-default-desktop-stage.png`, `12-initial-force-mobile.png`,
`13-distance-default-mobile.png`, `13b-distance-default-mobile-stage.png`

Baseball/tape distinction evidence: `20-distance-zoomedin-desktop.png`,
`21-distance-cluster-closeup-desktop.png`, `22-distance-cluster-closeup-mobile.png`,
`25-distance-cluster-closeup-mobile-hires.png`, `26-velocity-default-desktop.png`,
`27-velocity-cluster-closeup-desktop.png`

Mobile toolbar: `14-toolbar-mobile.png`, `14b-toolbar-mobile-closeup.png`

Camera actions (desktop): `03-toolbar-before-desktop.png`, `04-zoomin-after-desktop.png`,
`05-zoomout-after-desktop.png`, `06-isolate-after-desktop.png`, `07-reset-after-desktop.png`,
`08-autorotate-before-desktop.png`, `09-autorotate-after3s-desktop.png`,
`10-more-menu-desktop.png`, `11-fitview-after-desktop.png`

Camera actions (mobile): `15-toolbar-before-mobile.png`, `16-zoomin-after-mobile.png`,
`17-zoomout-after-mobile.png`, `18-isolate-after-mobile.png`, `19-reset-after-mobile.png`,
`23-stage-before-isolate-mobile.png`, `24-stage-after-isolate-mobile.png`

Raw data: `console-log.txt`, `results.json` (mobile toolbar button bounding boxes)
