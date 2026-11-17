# Wave 14 Visual QA — Energy Lab

**Reviewer:** Wave 14 reviewer #4 (Energy scope)
**Route:** `http://127.0.0.1:5174/app/labs/energy` (`src/routes/EnergyLab.tsx`)
**Date:** 2026-08-18
**Viewports:** Mobile 390x844 (primary), Desktop 1440x900 (spot-check)
**Tooling:** Ad hoc Playwright 1.62.1 (installed in isolated `/tmp/wave14-energy-qa`, not
added to the project), Chromium headless, against the already-running dev server.
Screenshots: `review-screenshots/wave14-2026-08-18/energy/`.

## Headline verdict

**CONDITIONAL PASS.** All seven sliders are reachable and operable on mobile. Live readouts
(meter row + in-scene model text) update correctly and legibly on every slider change tested,
on both viewports. The one significant, repeatable-but-intermittent issue is that the
real-world example props (Generator / Electric stove, occasionally) can render several seconds
late relative to their description tooltip and toolbar chip, leaving the model area of the
canvas blank while the rest of the UI has already updated — see P1 below.

The dev server was reachable (HTTP 200) for the whole session; no route crash, no blank-canvas
route failure, no pageerror events were observed in the browser console at any point.

## The seven sliders — mobile 390x844, individually

All seven live inside two different UI surfaces: six inside the canvas-stage "Tune energy"
panel, one inside the right-rail "Guided challenge" accordion.

| # | Slider (label) | Location | Reachable on mobile? | Operable? | Evidence |
|---|---|---|---|---|---|
| 1 | Start height | Tune energy panel | PASS — visible immediately on panel open (no scroll needed) | PASS — arrow-key + drag change confirmed (8.0 m → 12.0 m) | `04-multimeter-selected-before-slider-mobile.png`, `05-multimeter-after-height-slider-change-mobile.png` |
| 2 | Mass | Tune energy panel | PASS — visible immediately on panel open | PASS — confirmed 6 kg → 16 kg | `06-electric-stove-selected-mobile.png`, `07-electric-stove-after-mass-slider-change-mobile.png` |
| 3 | Heat loss | Tune energy panel | PASS — visible immediately on panel open | PASS — confirmed 18% → higher value, coupled to Heat meter | `15-stove-tuneopen-before-heatloss-mobile.png`, `16-stove-tuneopen-after-heatloss-mobile.png` |
| 4 | Push force | Tune energy panel | PASS — sits at the fold edge; fully reachable with one scroll | PASS — value changes on drag | `02-tune-panel-top-mobile.png` (scroll cue), `03-tune-panel-scrolled-bottom-mobile.png` |
| 5 | Push distance | Tune energy panel | PASS — below the fold, reachable after scrolling; clear "Scroll for more" cue is present and only shows while there is unseen content | PASS — value changes on drag | `03-tune-panel-scrolled-bottom-mobile.png` |
| 6 | Transfer time | Tune energy panel | PASS — below the fold, same as above | PASS — value changes on drag | `03-tune-panel-scrolled-bottom-mobile.png` |
| 7 | Predict (bounce %) | Guided challenge accordion (right rail, below canvas stage on mobile) | PASS — accordion is collapsed by default (tap "Guided challenge – predict the bounce" to open); once open the slider is immediately visible, no further scroll needed | PASS — confirmed 70% → 95%, live `%` label in DOM tracks it, and the "Check my prediction" button (reachable one scroll further) produces a legible "Actual return height: 84%..." result | `09-guided-challenge-open-mobile.png`, `38-guided-predict-slider-after-change-mobile.png`, `41-guided-check-result-mobile.png` |

**7 / 7 sliders confirmed reachable and operable on mobile.** Sliders 1–3 need zero scrolling,
4–6 need one scroll inside the Tune panel (with a working, appropriately-gated "Scroll for
more" affordance — it only appears while there is genuinely more content, and disappears once
scrolled to bottom), and slider 7 needs opening a collapsed accordion (standard, discoverable
interaction, no hidden/undiscoverable state).

## Panel overflow / scroll affordance — mobile

PASS. The Tune energy panel does not spill outside its container or cause page-level clipping.
Its internal `overflow-y-auto` region correctly shows a "Scroll for more" pill (with chevron)
only while `scrollHeight - clientHeight > 4` and the user isn't already at the bottom —
confirmed by toggling from top (`02-tune-panel-top-mobile.png`, cue visible) to bottom
(`03-tune-panel-scrolled-bottom-mobile.png`, cue gone).

## Multimeter / Electric-stove readout legibility — before/after slider change

PASS on both surfaces tested:
- **Meter row** (Total Energy / Motion+Stored / Heat, top-level cards): confirmed live update,
  e.g. Total Energy 470 J → 706 J after raising Start height
  (`04-multimeter-selected-before-slider-mobile.png` → `05-multimeter-after-height-slider-change-mobile.png`),
  and 706 J → 1882 J after raising Mass with Electric stove active
  (`06-electric-stove-selected-mobile.png` → `07-electric-stove-after-mass-slider-change-mobile.png`).
- **In-scene text** on the props themselves also tracks live values: multimeter's `"reads ~51 W"`
  billboard, electric-stove's `"heat share: X%"` label plus a coil color that lerps
  amber→red with `values.thermal`'s share of total (visible in
  `15-stove-tuneopen-before-heatloss-mobile.png` vs `17-stove-tuneclosed-after-heatloss-mobile.png`,
  Heat meter 5 J → 9 J and coil visibly redder). All text stayed legible at both viewports —
  no clipping of the meter cards, no overlapping/illegible overlap with the Tune panel.
- Desktop spot-check: `28-desktop-multimeter.png` → `29-desktop-multimeter-after-slider.png`
  shows the same Total Energy 470 J → 706 J update with the multimeter model in frame throughout.

## 3D scene visibility while interacting with sliders — mobile

PASS. The canvas stage (`data-lab-stage`, `h-[56svh]`) is never pushed fully off-screen while
the Tune panel or Guided-challenge accordion is open. The Tune panel is a translucent
(`bg-.../60`, `backdrop-blur-md`) floating card over the lower portion of the canvas, and the
coaster track / cart / energy particles remain visible through and above it in every screenshot
taken with the panel open (e.g. `04-multimeter-selected-before-slider-mobile.png`,
`15-stove-tuneopen-before-heatloss-mobile.png`).

## Findings

### P1 — Real-world example model can render several seconds after its own tooltip/toolbar state (intermittent)

On two separate occasions during this session — once on mobile (Generator and Electric stove
both affected in the same run) and once on desktop (Electric stove) — selecting a real-world
example chip (Generator / Multimeter / Electric stove) caused the toolbar chip to go active and
the description tooltip to appear immediately, but the actual 3D prop (generator body, stove
appliance) did not render in the canvas for at least 1–2 seconds, leaving only the coaster rig
visible underneath the tooltip. On retry (same route, fresh browser context, longer wait, or
after toggling other examples first) the same example rendered instantly and correctly in every
other attempt (4+ successful loads per example across both viewports). No console error or
`pageerror` was emitted during either occurrence — `ExamplePropBoundary`'s `componentDidCatch`
never logged, so this reads as a load/render timing gap rather than a GLB fetch failure.

- Evidence of the failure state:
  `24-generator-transient-model-hidden-behind-tooltip-mobile-crop.png` (cropped/upscaled from
  the affected run — model reduced to a two-pixel sliver above the tooltip),
  `25-stove-transient-model-hidden-behind-tooltip-mobile-crop.png` (same, stove fully hidden),
  `30-desktop-electricstove.png` (desktop run — no stove model anywhere in frame, only the
  coaster rig and hotspot labels).
- Evidence it self-resolves: `33-desktop-stove-fresh-t1s.png` / `34-desktop-stove-fresh-t3.5s.png`
  and `10-multimeter-model-tunepanel-closed-mobile.png` / `11-electricstove-model-tunepanel-closed-mobile.png`
  / `12-generator-model-tunepanel-closed-mobile.png` (rerun of the identical script — all three
  props fully visible and framed).

Because this did not reproduce on every attempt, it is reported at P1 rather than P0, but it is
worth flagging because when it does occur it fully fails the "canvas non-blank" bar for the
model a learner is specifically trying to look at, right at the moment they've just tapped that
example — the description text and Meter cards are already showing values for a model the
learner can't see.

### P2 — Nothing else observed

- No lorem-ipsum, TODO strings, debug labels, or internal component names were visible in any
  screenshot on either viewport.
- No page-level scroll/clipping from the Tune panel, meter cards, DetailPanel, LessonModal
  entry points, or BottomTray at either viewport.
- Toolbar controls (Rotate, Play, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset)
  were visible and reachable at both viewports; on mobile they collapse to the horizontal bar
  above the canvas without being cut off (`00-initial-load-mobile.png`).
- Console only ever showed benign, non-app warnings: a `THREE.Clock` deprecation notice and
  repeated headless-Chromium `GL Driver Message ... GPU stall due to ReadPixels` performance
  warnings (environment/driver noise, not an app defect — see Console log below).

## Console / page errors (verbatim, deduplicated)

```
[console.warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[console.warning] [.WebGL-0x...] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[console.warning] [.WebGL-0x...] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[console.debug] unsupported GPOS table LookupType 8 format 2
[console.debug] unsupported GPOS table LookupType 5 format 1
[console.debug] unsupported GSUB table LookupType 6 format 2
[console.debug] unsupported GSUB table LookupType 6 format 1
```

No `[console.error]` and no `[pageerror]` entries were recorded in any run across this session
(mobile or desktop, any example/slider combination tested).

## Unproven / not covered

- **Root cause of the P1 timing gap** was not isolated (e.g., whether it correlates with
  cold GLB parse on the dev server's first serve of a given asset, a Suspense/R3F scheduling
  race, or something else) — this report only documents what was observed on screen, per scope.
  The task description names this project's Wave 9/10/13 fixes around this exact prop-framing
  and tooltip-timing area (see comments in `EnergyLab.tsx`), so the intermittency may be a
  residual edge case in that same area; not confirmed either way.
- Rotate/auto-rotate, Isolate, Section (x-ray), Compare, and Reset toolbar behaviors were only
  smoke-checked for reachability, not exhaustively verified for correctness of their visual
  effect on the Energy lab specifically.
- The other four component modes reachable from the left `ContentNav` list (Efficiency, Kinetic
  Energy, Potential Energy, Power, Work) were not opened — this review's slider scope is
  satisfied entirely within the default `conservation-of-energy` component, which is where all
  seven sliders and the three real-world examples live, so the other component IDs were out of
  scope for the seven-slider check and not screenshotted.
- Tablet or other intermediate viewports were not tested (only the two required viewports).
- Screen-reader/keyboard-only navigation and touch (as opposed to mouse-drag) slider operation
  on a real mobile device were not tested; slider "operable" verification here used
  Playwright's synthetic pointer/keyboard events against a desktop Chromium instance emulating
  the mobile viewport size, not a real touchscreen.
