# Wave 12 Visual Acceptance Review — Mechanics

Date: 2026-08-18
Scope: `mechanics` (PhysicsLab, route `/app/labs/motion`)
Reviewer: read-only Playwright-driven QA agent (isolated Chromium profile, own process)
Viewports: Desktop 1440x900, Mobile 390x844
Target: `http://127.0.0.1:5174/app/labs/motion` (reachable, HTTP 200; app did not need to be started/stopped)

All screenshots referenced below live in
`review-screenshots/wave12-2026-08-18/mechanics/` (paths given are relative to that directory
unless stated otherwise).

---

## Summary

| # | Checklist item | Verdict | Severity if failed |
|---|---|---|---|
| 1 | Toolbar zoom/fit/reset visible effect | PASS | — |
| 2 | Cart mobile fit (390x844, no clipping, controls reachable) | PASS | — |
| 3 | Baseball/tape visibility | **PARTIAL FAIL** | P1 |
| 4 | No `hs-*` learner-facing text | PASS | — |
| 5 | Simulation preserved (cart/baseball actually move) | PASS | — |

Worst severity found: **P1** (measuring-tape prop occluded at default/start state).
No P0s found. No console/page errors observed beyond benign engine warnings (listed below,
verbatim).

---

## 1. Toolbar zoom / fit / reset — PASS

Exercised on the default "Force" component, desktop and mobile. Every control produced a
visible change in camera framing.

- **Zoom In**: scene visibly enlarges/moves closer.
  Evidence: `mechanics-toolbar-zoomin-before.png` → `mechanics-toolbar-zoomin-after.png`
  (desktop), `mechanics-toolbar-zoomin-mobile-before.png` → `mechanics-toolbar-zoomin-mobile-after.png`
  (mobile).
- **Zoom Out**: scene visibly shrinks/moves away (button becomes disabled once the configured
  `MAX_CAMERA_DISTANCE` is hit after 2 clicks — expected, not a bug).
  Evidence: `mechanics-toolbar-zoomout-before.png` → `mechanics-toolbar-zoomout-after.png`
  (desktop), `mechanics-toolbar-zoomout-mobile-before.png` → `mechanics-toolbar-zoomout-mobile-after.png`
  (mobile).
- **Fit view** (in the "More" overflow menu): recalculates a bounds-based camera distance and
  visibly pulls back further than the manual zoom-out state to fit the full scene bounding
  sphere.
  Evidence: `mechanics-toolbar-fitview-before.png` → `mechanics-toolbar-fitview-after.png`
  (desktop), `mechanics-toolbar-fitview-mobile-before.png` → `mechanics-toolbar-fitview-mobile-after.png`
  (mobile).
- **Reset**: returns camera to default framing (visibly zooms back in from the wide fit-view
  state) and clears sim/prediction state.
  Evidence: `mechanics-toolbar-reset-before.png` → `mechanics-toolbar-reset-after.png`
  (desktop), `mechanics-toolbar-reset-mobile-before.png` → `mechanics-toolbar-reset-mobile-after.png`
  (mobile).

All toolbar icons (Rotate, Play/Pause, Isolate, Section, Compare, Zoom In, Zoom Out,
Fullscreen, More, Reset) render in a single non-overflowing row at both viewports; none are
clipped or unreachable. Note: the "Section" (cross-section) tool is present but disabled
(greyed out) for mechanics — this route doesn't wire a cross-section handler. Not counted as a
failure since the checklist only requires that whichever controls exist have a visible effect
when clicked; a disabled/unimplemented tool is a scope note, not a broken control (no click was
possible to test, so it is flagged here as **unproven/not-applicable** rather than pass or fail).

## 2. Cart mobile fit (390x844) — PASS

At 390x844 the cart-on-track scene renders fully inside the canvas bounds with no clipping
against the canvas edge or overlapping UI, and the full toolbar row remains reachable (all 10
icons visible in one row, none cut off).

Evidence: `mechanics-cart-mobile.png`, `mechanics-mobile-initial.png`,
`mechanics-toolbar-zoomin-mobile-before.png`. The bottom "Tune mechanics" panel (readouts +
expandable controls) also fits without causing page-level scroll; when expanded
(`mechanics-sim-before-race-mobile.png`) it scrolls internally (`max-h-[42svh] overflow-y-auto`
with a bottom fade-out affordance) rather than overflowing the viewport.

## 3. Baseball / tape visibility — PARTIAL FAIL (P1)

**Baseball**: confirmed rendered and visually identifiable (visible seam/stitch texture) at
both viewports, in every motion-measure component (Position/Distance/Displacement/Speed/
Velocity — verified on Displacement at desktop and Position at mobile).
Evidence: `mechanics-baseball-tape-desktop-zoomed.png`,
`mechanics-baseball-tape-closeup-mobile.png`.

**Measuring tape**: the 3D tape prop and its "tape reads X m" text label are present in the
scene graph (`MeasuringTapeTool`, always mounted whenever a motion-measure component is
selected) and the model *is* correctly loaded/rendered — confirmed by
`mechanics-tape-visible-after-race-closeup-desktop.png`, captured after running the built-in
prediction race, where the tape and its "tape reads 4.20 m" label are clearly visible once the
cart/baseball have moved away from the start post.

However, **at the default/initial state of every motion-measure component** (i.e. what a
learner sees the instant they open Position, Distance, Displacement, Speed, or Velocity, before
touching anything), the tracked baseball prop (`TrackedBaseball`, positioned at
`sim.position`) and the tape prop (`MeasuringTapeTool`, fixed at the track's start post) both
sit at the same starting x-coordinate (`START_POSITION = -1.65`) and are only ~0.08 units apart
in depth. They render almost fully overlapping, and the tape/label is effectively invisible,
hidden behind/under the baseball and the cart. This reproduced identically at both viewports.

Evidence (default state, tape not visible): `mechanics-baseball-tape-desktop.png`,
`mechanics-baseball-tape-desktop-zoomed.png`,
`mechanics-tape-occluded-closeup-desktop.png` (4x-zoomed crop of the cart/baseball cluster — no
tape geometry or "tape reads" label is discernible anywhere in frame), and on mobile
`mechanics-baseball-tape-mobile.png` / `mechanics-baseball-tape-closeup-mobile.png`.

Evidence (after triggering the race, tape becomes visible once separated from the baseball):
`mechanics-scene-after-race-settled-desktop.png`,
`mechanics-tape-visible-after-race-closeup-desktop.png`.

**Severity: P1.** This is not a total failure (the tape does exist and does render correctly),
but a first-time learner opening any Position/Distance/Displacement/Speed/Velocity component
sees only a baseball-shaped blob at the start post and cannot identify the measuring tape until
after running the race — failing the "actually rendered and visible on screen, not hidden
behind other UI" bar in the checklist for the tape specifically, at both viewports, in the
component's default state.

## 4. No `hs-*` learner-facing text — PASS

Extracted full rendered `document.body.innerText` and `page.content()` HTML on both desktop and
mobile, across the default Force view, the Displacement/Position (baseball+tape) view, and mid/
post-race states, with a regex search for `\bhs-[a-z0-9-]+`. Zero matches in every case:

```
desktopBodyTextHasHs: false, matches: []
desktopHtmlHsMatches: 0
mobileBodyTextHasHs: false, matches: []
mobileHtmlHsMatches: 0
```

This matches what the source shows: `PhysicsLab.tsx` runs a `sanitizeLessonContent` /
`sanitizeHotspotSlugs` pass over all lesson/quiz copy before it reaches `LessonModal`/
`QuizModal`/`DetailPanel`, replacing any inline `` `hs-*` `` slug references from the generated
content (`src/data/generated/mechanics.ts`) with the hotspot's human-readable label. Hotspot
`label` fields themselves (e.g. "Cart", "Gas Control") are already human-readable in the
generated data and were not observed leaking raw ids either. Not checked: the Lesson modal's
full 8-step walkthrough and Quiz modal content were not opened/paged through in this pass (only
`document.body.innerText`/`page.content()` of the base route views were scanned, and those
modals were not opened) — **flagging as unproven** for the specific in-modal lesson/quiz body
text at each of the 8 lesson steps, though the sanitizer is applied uniformly to all of it
before render per the source code read.

## 5. Simulation preserved — PASS

Confirmed the underlying physics sim still runs and produces correct, visible motion, not just
static rendering, on both viewports:

- Desktop (Displacement component): opened "Tune mechanics", chose "My cart wins", clicked
  "Run the race". Displacement readout changed live: `-1.65 m` (before) →
  `-0.05 m` (mid-race, ~350ms in) → `2.55 m` (settled), the "Run the race" button switched to a
  disabled "Racing..." state during the run, and a result banner appeared: `Not quite - You
  said "My cart wins", the race result was "They tie".`
  Evidence: `mechanics-sim-before-race-desktop.png`, `mechanics-sim-mid-race-desktop.png`,
  `mechanics-sim-after-race-desktop.png`.
- A follow-up capture with the tune panel closed after the race confirms the cart and the
  tracked baseball prop both visibly moved together from the start post out to `position 2.5 m`
  (desktop): `mechanics-scene-after-race-settled-desktop.png`.
- Mobile (Position component): same interaction reproduced — result banner
  `Not quite - You said "My cart wins", the race result was "They tie".` rendered correctly
  inside the mobile tune panel without overflow.
  Evidence: `mechanics-sim-before-race-mobile.png`, `mechanics-sim-mid-race-mobile.png`,
  `mechanics-sim-after-race-mobile.png`.

This demonstrates real cause/effect: choosing a prediction and running the race changes numeric
readouts, moves the 3D cart/baseball, and reports a legible pass/fail message against the
learner's prediction.

---

## Console / page errors

Captured via `page.on('console', ...)` and `page.on('pageerror', ...)` on both viewports.
**No `pageerror` events were emitted at either viewport.** Console output (verbatim), all
benign dev/engine noise, no errors or warnings related to the mechanics lab's own code:

```
[desktop] console.debug: [vite] connecting...
[desktop] console.info: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
[desktop] console.debug: [vite] connected.
[desktop] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[desktop] console.warning: [.WebGL-0x13400581400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[desktop] console.warning: [.WebGL-0x13400585600]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[desktop] console.warning: [.WebGL-0x13400581400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[desktop] console.warning: [.WebGL-0x13400581400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[desktop] console.debug: unsupported GPOS table LookupType 8 format 2
[desktop] console.debug: unsupported GPOS table LookupType 5 format 1
[desktop] console.debug: unsupported GSUB table LookupType 6 format 2
[desktop] console.debug: unsupported GSUB table LookupType 6 format 1
[desktop] console.debug: unsupported GPOS table LookupType 8 format 2
[desktop] console.debug: unsupported GPOS table LookupType 5 format 1
[desktop] console.debug: unsupported GSUB table LookupType 6 format 2
[desktop] console.debug: unsupported GSUB table LookupType 6 format 1
[mobile] console.debug: [vite] connecting...
[mobile] console.debug: [vite] connected.
[mobile] console.info: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
[mobile] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[mobile] console.debug: unsupported GPOS table LookupType 8 format 2
[mobile] console.debug: unsupported GPOS table LookupType 5 format 1
[mobile] console.debug: unsupported GSUB table LookupType 6 format 2
[mobile] console.debug: unsupported GSUB table LookupType 6 format 1
[mobile] console.debug: unsupported GPOS table LookupType 8 format 2
[mobile] console.debug: unsupported GPOS table LookupType 5 format 1
[mobile] console.debug: unsupported GSUB table LookupType 6 format 2
[mobile] console.debug: unsupported GSUB table LookupType 6 format 1
```
`[.WebGL-...] GPU stall due to ReadPixels` is a macOS/headless-Chromium GPU driver perf notice
tied to `page.screenshot()` readback, not an app bug. `THREE.Clock` deprecation and font-shaper
"unsupported GPOS/GSUB" notices are third-party library noise (three.js / troika-three-text),
also not specific to this app's mechanics code.

## Not verified / out of scope for this pass

- The full 8-step Lesson modal and 5-question Quiz modal were not opened/screenshotted for
  every mechanics component (13 components × 2 viewports) — only the base canvas/detail-panel
  views were checked directly for `hs-*` leakage. The sanitizer code path applies uniformly per
  source inspection, but per-component in-modal text was not individually screenshotted.
- Only 2 of the 5 motion-measure components (Displacement on desktop, Position on mobile) were
  directly used to verify baseball/tape behavior; Distance, Speed, and Velocity were not
  individually screenshotted, though they share the same `MotionMarkers`/`showMeasureTool`
  code path so the same occlusion behavior is expected but not individually proven for those
  three.
- Cross-section ("Section") toolbar control is disabled/unwired for mechanics; not exercised
  since it cannot be clicked (not a failure — no handler is passed in for this lab).
- Compare tool, Isolate tool, and hotspot click interactions were not part of the assigned
  checklist and were not exercised.

## Screenshot index (all in `review-screenshots/wave12-2026-08-18/mechanics/`)

- `mechanics-desktop-initial.png`, `mechanics-mobile-initial.png`
- `mechanics-toolbar-zoomin-before.png` / `-after.png` (+ `-mobile-before/after`)
- `mechanics-toolbar-zoomout-before.png` / `-after.png` (+ `-mobile-before/after`)
- `mechanics-toolbar-fitview-before.png` / `-after.png` (+ `-mobile-before/after`)
- `mechanics-toolbar-reset-before.png` / `-after.png` (+ `-mobile-before/after`)
- `mechanics-baseball-tape-desktop.png`, `mechanics-baseball-tape-desktop-zoomed.png`,
  `mechanics-tape-occluded-closeup-desktop.png`
- `mechanics-baseball-tape-mobile.png`, `mechanics-baseball-tape-closeup-mobile.png`
- `mechanics-cart-mobile.png`
- `mechanics-sim-before-race-desktop.png` / `-mid-race-` / `-after-race-` (+ `-mobile`)
- `mechanics-scene-after-race-settled-desktop.png`,
  `mechanics-tape-visible-after-race-closeup-desktop.png`
