# Wave 16 Visual QA — Moons Lab

Route: `http://127.0.0.1:5174/app/labs/moons` (source: `src/routes/MoonsLab.tsx`,
`src/components/explorer/MoonViewer.tsx`, `src/components/explorer/MoonModel.tsx`)
Reviewer: Wave 16 reviewer 5/8 (Moons scope only)
Tooling: ad hoc Playwright/Chromium script (`/tmp/wave16-moons/script2.js`, `script3.js`), own
isolated browser instance against `/tmp/wave16-playwright`'s installed Playwright.
Viewports: mobile 390x844 (primary/required), desktop 1440x900 (comparison).

Server reachability: `curl -o /dev/null -w '%{http_code}'` on the route returned `200` — app
reachable, not a blocker.

## Scope note

This wave's target (per the task assignment) was proving/disproving whether hotspot labels
stack near the poles on mobile, and confirming the gravity visual still renders. Enceladus was
selected as the test case because its data (`src/data/moons.ts`) authors two hotspots very close
together near the south pole: `tiger-stripes` at `position: [0.1, -1.85, 0.5]` and
`south-polar-geysers` at `position: [0.5, -1.7, 0.6]`. A prior wave (wave 15, per
`src/components/explorer/moonsHotspotLabelDeconfliction.test.ts`) already shipped a
`getBoundingClientRect`-based collision-avoidance pass in `MoonModel.tsx` specifically for this
Enceladus pair, so this check is a regression/verification pass on that existing fix, not a
first-time discovery.

## Findings

### P1 — Enceladus "Tiger Stripes" / "South Polar Geysers" hotspot labels visually stack and become unreadable, on both mobile and desktop

- **Route/surface**: Moons lab, Enceladus body, mobile 390x844 (primary) and desktop 1440x900
  (confirmed present too).
- **What's wrong**: With the "Show labels" toggle on (More menu → Show labels), the two label
  pills for `tiger-stripes` and `south-polar-geysers` render on top of each other — text from
  one pill is drawn directly over the other, producing an unreadable smear of overlapping
  characters. This reproduces in the **default camera framing** (no drag needed) and persists
  after dragging the camera to bring the south pole further into view, and after the
  auto-rotate-driven camera settles (checked at +3s and +4.5s after interaction, so this is not
  a single-frame transient before the existing collision-avoidance effect converges — it is a
  steady-state overlap).
- **Bounding-box evidence** (`getBoundingClientRect()` read directly from the DOM, mobile
  390x844, default framing, no drag):
  - `Tiger Stripes` label: `top 272.99, bottom 298.38, left 171.25, right 260.12`
  - `South Polar Geysers` label: `top 256.71, bottom 281.83, left 173.53, right 302.39`
  - Computed overlap: `overlapX ≈ 88.1px`, `overlapY ≈ 1.5px` (both axes positive → true
    overlap, not a false-positive from checking a single axis).
  - A second, independent run (after a south-pole drag + 3s settle) measured a larger overlap
    for the same pair: `overlapX ≈ 75.0px`, `overlapY ≈ 13.5px`; a third orientation (drag
    toward the opposite pole) measured `overlapX ≈ 97.1px`, `overlapY ≈ 26.3px` and additionally
    showed `South Polar Geysers` overlapping a third label, `Cratered Northern Terrain`
    (`overlapX ≈ 94.4px`, `overlapY ≈ 2.1px`).
  - Desktop 1440x900, Enceladus, default framing, labels on: same pair overlaps —
    `Tiger Stripes: top 696.55, bottom 728.82, left 656.57, right 769.51` vs.
    `South Polar Geysers: top 673.46, bottom 705.35, left 680.10, right 843.74`
    (`overlapX ≈ 89.4px`, `overlapY ≈ 8.8px`).
- **Screenshot evidence**:
  - `review-screenshots/wave16-2026-08-18/moons/mobile-poles-overlap-crop.png` — tight crop on
    the overlapping pair; "South Polar Geysers" text is drawn directly over "...ger Stripes",
    both illegible as separate labels.
  - `review-screenshots/wave16-2026-08-18/moons/mobile-poles-overlap-default-full.png` — full
    canvas, default framing, showing the same stacked pair in context with the other two
    (non-overlapping in this frame) labels.
  - `review-screenshots/wave16-2026-08-18/moons/mobile-poles-view-dragdown-settled.png` — after
    a south-pole-ward drag and a 4.5s settle, "South Polar Geysers" and "Tiger Stripes" are
    rendered as two full-width pills directly stacked on the same lines, unreadable as two
    distinct labels.
  - `review-screenshots/wave16-2026-08-18/moons/desktop-labels-on-enceladus.png` — desktop:
    "Tiger Stripes" pill is visible near the south-pole dot cluster, but the "South Polar
    Geysers" label is not visibly legible as a separate pill in this frame (consistent with one
    label being drawn on top of/immediately adjacent to the other, matching the DOM-measured
    overlap above).
- **Assessment**: the wave 15 collision-avoidance pass in `MoonModel.tsx` (measures
  `getBoundingClientRect()` each animation frame, computes `overlapX`/`overlapY`, and pushes
  overlapping labels apart along their own existing `direction`) exists and is wired up per the
  regression test, but on live measurement it is not fully preventing overlap for this
  close-together Enceladus pair — the residual push is insufficient to fully separate two
  full-width pills whose anchor dots are only ~0.2–0.3 model units apart, so at typical
  mobile/desktop framing the pills still collide. This is a P1 (not P0) because it does not
  block the route or break the interaction mechanism itself (tapping either dot still opens the
  correct hotspot in the detail panel — this is a **label legibility/declutter** bug, not a
  broken interaction), but it does directly violate the "labels should not stack/overlap"
  requirement this review was scoped to verify, at the exact location (Enceladus south pole,
  mobile) a prior wave's own regression test says it was fixed for.

### PASS — Gravity visual renders correctly, mobile and desktop

- **Route/surface**: Moons lab, sidebar "What would you weigh here?" panel, mobile 390x844 and
  desktop 1440x900.
- **What it is**: a CSS-keyframe-animated dropped ball (`.gravity-drop-ball`, defined inline in
  `MoonsLab.tsx`) inside a bordered drop-zone box, whose fall duration and bounce height are
  driven live by the selected moon's real `surfaceGravityMs2` (see the `gravityDrop` `useMemo`
  in `MoonsLab.tsx`). This is the only gravity-visualization element in this lab (there is no
  separate field-overlay/arrows visual in the 3D canvas) — the numeric weight comparator above
  it is the "cause" and this ball is the "effect."
- **Verification**: confirmed present, non-blank, and contained within its bounding box on both
  Earth's Moon (default selection) and Enceladus (lowest-gravity body, most visually distinct
  slow-fall/high-bounce case):
  - Moon: box `x:187, y:583.8, width:16, height:16`, background `rgb(242, 237, 224)`
    (matches that hotspot's authored color), `opacity: 1`.
  - Enceladus: box `x:187, y:556.6, width:16, height:16`, background `rgb(127, 195, 224)`
    (matches Enceladus's hotspot color, confirming the ball's color/behavior updates per moon,
    not just a static decoration).
  - Desktop: box `x:1252.5, y:383.6, width:16, height:16` — present, positioned inside its panel,
    not clipped.
  - The caption text under the box ("A dropped ball falls and bounces here the way {g} m/s² of
    gravity would really move it...") updates its numeric value per moon, confirming the
    cause/effect link between the moon selector and this visual is legible.
- **Screenshot evidence**:
  - `review-screenshots/wave16-2026-08-18/moons/mobile-gravity-visual-moon.png`
  - `review-screenshots/wave16-2026-08-18/moons/mobile-gravity-visual-enceladus.png`
  - `review-screenshots/wave16-2026-08-18/moons/desktop-gravity-visual.png`
- No clipping, no blank/black box, no leaked debug text observed in this element or its caption.

### PASS — Canvas framing, default load, both viewports

- `review-screenshots/wave16-2026-08-18/moons/mobile-default.png` and
  `review-screenshots/wave16-2026-08-18/moons/desktop-default.png`: the moon model (Earth's Moon,
  default selection) renders centered and fully framed in the canvas at load, star backdrop
  visible, toolbar rail and caption pills legible and not overlapping the model, no clipped
  geometry observed at either viewport.

### No internal QA language observed

No lorem ipsum, TODO strings, internal component names, or debug scaffolding were visible in any
captured screenshot (toolbar labels, captions, panel copy, and hotspot labels all read as
production-intended copy).

## Console / page errors

Captured via `page.on('console')` / `page.on('pageerror')` across all runs. No `pageerror`
(uncaught exception) events were observed on any load or interaction. Console output was limited
to expected dev-server/runtime noise:

```
[console:debug] [vite] connecting...
[console:debug] [vite] connected.
[console:info] Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
[console:warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[console:warning] [.WebGL-...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (repeated a few times, then "will no longer repeat")
```

None of the above are application errors — the Three.js deprecation notice and the GPU-stall
performance message are informational/from the WebGL driver, not exceptions, and were seen on
both mobile and desktop runs.

## Screenshots (all under `review-screenshots/wave16-2026-08-18/moons/`)

- `mobile-default.png` — mobile default load, Earth's Moon.
- `mobile-labels-on-default.png` — mobile, Enceladus selected, labels toggled on, default framing.
- `mobile-poles-overlap-default-full.png` — full canvas, overlap visible in default framing.
- `mobile-poles-overlap-crop.png` — tight crop, overlap evidence.
- `mobile-poles-view-dragdown.png` / `mobile-poles-view-dragdown-settled.png` — after dragging
  toward the south pole, immediately and after a 3s+ settle.
- `mobile-poles-view-dragup.png` — after dragging toward the opposite pole.
- `mobile-gravity-visual-moon.png` / `mobile-gravity-visual-enceladus.png` — gravity visual,
  two different moons.
- `desktop-default.png` — desktop default load.
- `desktop-labels-on-enceladus.png` — desktop, Enceladus, labels on.
- `desktop-gravity-visual.png` — desktop gravity visual.

## Summary

- **P1 (1)**: Enceladus's `Tiger Stripes` / `South Polar Geysers` hotspot labels overlap and
  become illegible near the south pole, reproduced on both mobile 390x844 (primary target) and
  desktop 1440x900, in default framing and after camera rotation, with DOM bounding-box evidence
  on both axes. This is the finding this wave was scoped to check for, and it is confirmed
  present despite an existing wave-15 fix targeting this exact pair.
- **PASS**: gravity visual (dropped-ball element) renders correctly, non-blank, contained, and
  updates per moon on both viewports.
- **PASS**: default canvas framing at both viewports, no clipped geometry, no console/page
  errors, no leaked QA/debug language observed.
