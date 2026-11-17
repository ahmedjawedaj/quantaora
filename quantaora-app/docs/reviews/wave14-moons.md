# Wave 14 Visual Acceptance Review — Moons Lab

- Date: 2026-08-18
- Scope: `MoonsLab` at `http://127.0.0.1:5174/app/labs/moons` — polar/pole hotspot labels and the
  gravity comparator (falling/bouncing ball).
- Viewports: Desktop 1440x900, Mobile 390x844
- Method: Isolated Playwright Chromium (headless), driven via ad hoc Node `.mjs` scripts under
  `/tmp/wave14-moons-qa` (own local `playwright@1.62.1` install, no project files touched). Live
  interaction (moon selection, "Show labels" toggle, hotspot clicks) plus direct DOM inspection
  (`getComputedStyle`, inline `style` attribute reads) of the gravity-drop-ball element to get
  objective, not just eyeballed, timing/scale values. Read-only inspection of
  `src/data/moons.ts`, `src/routes/MoonsLab.tsx`, `src/components/explorer/MoonModel.tsx` to
  confirm the moon list, real gravity data, and label/animation source — no files under those
  paths were modified.
- Screenshots: `review-screenshots/wave14-2026-08-18/moons/` (all paths below are relative to
  that directory unless noted).

## Summary

App is reachable (HTTP 200), no P0s. All 5 moons are present, individually selectable, and
correctly framed/non-clipped at both viewports, matching the prior wave12 PASS. The two P1s from
`docs/reviews/wave12-moons.md` (no visual gravity demonstration; polar hotspots obscured by
fixed toolbar/caption pills on mobile) are now genuinely fixed — the gravity comparator has a real
falling/bouncing ball whose speed and bounce height are driven by each moon's actual
`surfaceGravityMs2`, confirmed both by direct CSS-variable inspection and live position sampling,
and the wave12 polar-hotspot-vs-overlay-pill collisions are resolved (Titan's north-pole "Orange
Haze" and Enceladus's south-pole cluster no longer sit under the toolbar/caption pills on mobile).
However, this pass found a **new P1**: when all hotspot labels are shown at once (the "Show
labels" toolbar toggle), two hotspots that sit close together in 3D space render their text-label
pills stacked on top of each other, making one label almost entirely unreadable — this happens on
**Enceladus at both viewports** (Tiger Stripes label hidden under South Polar Geysers label) and,
mobile-only, on **Earth's Moon** (Tycho Crater hidden under South Pole–Aitken Basin) and **Io**
(Loki Patera hidden under Sulfur Plains).

## Moon list confirmation

All 5 moons from `src/data/moons.ts` are present and individually selectable at both viewports
(desktop left sidebar, mobile pill-row switcher under "Moon X of 5"):

1. Earth's Moon (Luna) — `surfaceGravityMs2: 1.62`
2. Europa — `surfaceGravityMs2: 1.315`
3. Io — `surfaceGravityMs2: 1.796`
4. Titan — `surfaceGravityMs2: 1.352`
5. Enceladus — `surfaceGravityMs2: 0.113`

Evidence: `moons-00-initial-desktop.png`, `moons-00-initial-mobile.png`, and one selection
screenshot per moon per viewport (`moons-<id>-selected-desktop.png`,
`moons-<id>-labels-{desktop,mobile}.png`).

## Per-moon results

| # | Moon | Desktop framing | Mobile framing | Polar labels legible/positioned correctly? | Result |
|---|------|------------------|-----------------|---------------------------------------------|--------|
| 1 | Earth's Moon | Full sphere, centered, no clipping | Full sphere, centered, no clipping | 3 of 4 labels clean; "South Pole–Aitken Basin" and "Tycho Crater" (both south-hemisphere, close together) overlap **on mobile only** — see P1 #2 | CONDITIONAL |
| 2 | Europa | Full sphere, centered, no clipping | Full sphere, centered, no clipping | All 4 labels legible, correctly positioned on the model, no overlap at either viewport | PASS |
| 3 | Io | Full sphere, centered, no clipping | Full sphere, centered, no clipping | 3 of 4 labels clean; "Loki Patera" and "Sulfur Plains" (adjacent) overlap **on mobile only** — see P1 #2 | CONDITIONAL |
| 4 | Titan | Full sphere, centered, no clipping | Full sphere, centered, no clipping | Single north-pole hotspot ("Orange Haze") — legible, correctly positioned, clear of the toolbar pill at both viewports (wave12 P1 #2 fix confirmed) | PASS |
| 5 | Enceladus | Full sphere, centered, no clipping | Full sphere, centered, no clipping | South-pole cluster: "South Polar Geysers" label fully legible; "Tiger Stripes" label almost entirely hidden underneath it, **at both viewports** — see P1 #1 | FAIL (label overlap) |

Evidence per moon: `moons-<id>-labels-desktop.png`, `moons-<id>-labels-mobile.png` (all captured
with the "Show labels" toolbar toggle on, via the More menu, so every hotspot's label is forced
visible simultaneously rather than only on hover/tap — see `moons-labels-on-desktop.png` /
`moons-labels-on-mobile.png` for that toggle being engaged). Close crops for the Enceladus overlap:
`moons-enceladus-southpole-crop-mobile.png`, `moons-enceladus-southpole-crop2x-mobile.png`,
`moons-enceladus-labels-desktop-full.png`.

## Gravity comparator ("What would you weigh here?" panel + falling/bouncing ball)

The panel has two parts: (1) a numeric weight readout (pre-existing, unit-tested in
`src/routes/moonsGravityComparison.test.ts`, not the focus of this pass) and (2) a CSS-animated
falling/bouncing ball (`gravity-drop-ball`, added since wave12 as the P1 #1 fix) whose fall speed
and bounce height are computed per moon from `content.surfaceGravityMs2` via a `useMemo` in
`MoonsLab.tsx` (`gravityDrop`): `fallDurationS = clamp(0.85 + log2(1/gravityRatio)*0.3, 0.85, 2.4)`,
`bounceScale = clamp(sqrt(1/gravityRatio), 1, 2.6)`.

**What was directly observed** (not assumed): for each moon, selected it, then read the ball
element's live inline `style` attribute (the actual `--gravity-fall-duration` /
`--gravity-bounce-scale` CSS custom properties the browser is using to drive the `@keyframes
gravity-drop-fall` animation), identical at both viewports:

| Moon | `surfaceGravityMs2` (data) | Observed fall duration | Observed bounce scale |
|------|------|------|------|
| Io | 1.796 (highest) | **1.584s** (fastest) | **2.336x** (smallest bounce) |
| Earth's Moon | 1.62 | 1.629s | 2.460x |
| Titan | 1.352 | 1.707s | 2.6x (clamped) |
| Europa | 1.315 | 1.719s | 2.6x (clamped) |
| Enceladus | 0.113 (lowest) | **2.4s** (slowest, clamped) | **2.6x** (clamped, largest bounce) |

This ordering is **monotonic and consistent with the real physics**: sorting the 5 moons by
`surfaceGravityMs2` descending (Io > Moon > Titan > Europa > Enceladus) produces exactly matching
ascending fall-duration order (Io fastest → Enceladus slowest), i.e. higher real gravity ⇒
visibly faster fall, and the two lowest-gravity moons (Enceladus, and Titan/Europa which are
close to each other at ~1.3 m/s²) hit the intentional 2.6x bounce-height clamp. Because Titan
(1.352) and Europa (1.315) are close enough in gravity that both clamp to the same 2.6x bounce
scale, their bounce heights are visually indistinguishable from each other even though their
underlying gravity values differ by ~3% — this is a deliberate clamp in the code (to keep bounce
height from flying off the drop-zone container) rather than a bug, but it means the visual
cannot discriminate those two specific moons from each other on bounce height alone (fall
duration still differs slightly between them, 1.707s vs 1.719s, likely too close to perceive by
eye).

I additionally sampled the ball's live `getComputedStyle().transform` (`translateY`) roughly every
130ms for ~2.6s for the two extreme moons (Io, highest gravity; Enceladus, lowest) to confirm the
element is genuinely animating in the browser and not a static/frozen CSS declaration — confirmed:
translateY values change sample-to-sample for both moons (e.g. Io: -63.6 → -48.4 → -4.2 → -2.4 →
0 → -61.2 → ...; Enceladus: -19.0 → -44.4 → -5.9 → -11.4 → -63.8 → ...), i.e. the ball is visibly
rising/falling/bouncing in real time on screen for every moon tested.

Evidence: `moons-gravity-panel-io-desktop.png`, `moons-gravity-panel-io-mobile.png`,
`moons-gravity-panel-enceladus-desktop.png`, `moons-gravity-panel-enceladus-mobile.png`, plus the
raw sampled data and per-moon CSS-variable dump saved during this pass at
`review-screenshots/wave14-2026-08-18/moons-gravity-data.json` (outside the `moons/` screenshot
subfolder — a plain JSON evidence artifact, not a screenshot, kept alongside for this report).

**Verdict: PASS.** The comparator has a real, live, per-moon-gravity-driven visual (not just
numeric text), and its behavior is directly confirmed consistent with each moon's actual
published surface gravity from `src/data/moons.ts`.

## Toolbar / common controls (both viewports)

Rotate, Play/Pause (correctly disabled — no embedded GLB animation for these single-mesh moon
GLBs), Isolate, Section/cross-section (correctly disabled — not applicable to single-mesh moon
models), Compare, Zoom In, Zoom Out, Full(screen), More (Show/Hide labels, X-Ray [disabled],
Fit view, Clean view), Reset — all visible and reachable at both viewports, no icon clipping in
the 390px-wide mobile toolbar pill. Isolate + on-canvas dim + Detail Panel population confirmed
working from a direct hotspot click on both viewports (`moons-hotspot-after-click-desktop2.png`,
`moons-hotspot-after-click-mobile.png`, compared against
`moons-hotspot-before-click-desktop2.png` / `moons-hotspot-before-click-mobile.png`). Compare
modal opens and its content is fully legible with no overflow on mobile
(`moons-compare-modal-mobile.png`). No page-level horizontal overflow measured on mobile
(`document.documentElement.scrollWidth === clientWidth === 390`).

## No internal QA language leaks

All on-canvas captions, hotspot labels, and panel copy read as intentional, polished, real
content (real NASA mission facts, no lorem ipsum, no "TODO"/debug strings, no internal component
names surfaced to the UI) across all 5 moons at both viewports.

## Findings

### P0 — none found.

### P1 — significant

1. **Enceladus's south-pole "Tiger Stripes" hotspot label is almost entirely hidden under the
   "South Polar Geysers" label, at both viewports**, when both labels are visible at once (via
   the "Show labels" toggle, or if a user happens to have both nearby markers active/hovered).
   The two hotspots are authored close together in 3D space (`position: [0.1, -1.85, 0.5]` vs
   `[0.5, -1.7, 0.6]` in `src/data/moons.ts`), so their floating label pills land on top of each
   other on screen; only a faint sliver of "…iger Strip…" text peeks out from behind the
   "South Polar Geysers" pill.
   Evidence: `moons-enceladus-labels-desktop.png`, `moons-enceladus-labels-desktop-full.png`,
   `moons-enceladus-labels-mobile.png`, `moons-enceladus-southpole-crop-mobile.png` (crop),
   `moons-enceladus-southpole-crop2x-mobile.png` (tighter 2x crop showing the buried text).

2. **Two more hotspot-label overlaps on mobile only** (390x844), same root cause as #1 — nearby
   hotspots' label pills stack when shown together:
   - Earth's Moon: "Tycho Crater" label is largely hidden behind "South Pole–Aitken Basin"
     (both south-hemisphere hotspots, close together). Evidence: `moons-moon-labels-mobile.png`.
   - Io: "Loki Patera" label is largely hidden behind "Sulfur Plains" (adjacent hotspots).
     Evidence: `moons-io-labels-mobile.png`.
   Both of these render as two cleanly separated, fully legible labels on **desktop** at the same
   moon/hotspot pair (`moons-moon-labels-desktop.png`, `moons-io-labels-desktop.png`), so this is
   mobile-viewport-specific (smaller on-screen sphere → hotspots land closer together in screen
   space).
   Note: this label-overlap issue is distinct from, and not the same bug as, the wave12 P1 #2
   ("hotspot obscured by fixed toolbar/caption pill") — that specific defect (Titan's Orange Haze
   under the top pill, Enceladus's south-pole cluster under the bottom pill) was directly
   re-checked this pass and is confirmed fixed (`moons-titan-labels-mobile.png`,
   `moons-enceladus-labels-mobile.png` both show the relevant hotspot markers clear of the
   toolbar/caption pills).

### P2 — polish

1. **Long hotspot label text is truncated with an ellipsis on-canvas** (e.g. "Equatorial Dune
   Fi…", "South Pole-Aitken …", "Reddish-Brown Str…"), both viewports, all moons with a
   long-named hotspot. This appears to be an intentional `max-w-32 truncate` design choice
   (label pill stays a fixed compact width) rather than a defect, and the full name is always
   available in the Detail Panel after tapping/clicking the hotspot — flagged as minor polish
   only, since a first-glance on-canvas label can't always be read in full. Evidence:
   `moons-titan-labels-desktop.png`, `moons-moon-labels-desktop.png`,
   `moons-europa-labels-mobile.png`.

## Console / page errors

- `pageerror` events: **none observed** on either viewport.
- `console.error` events: **none observed** on either viewport.
- `console.warning` events (verbatim, benign/expected, same as wave12):
  - `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
  - `[.WebGL-<handle>]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (repeated a few times, then "this message will no longer repeat") — a headless/software-GPU driver performance notice from Playwright's Chromium, not an app-level error.

Full raw logs saved at `review-screenshots/wave14-2026-08-18/moons-console-log.txt` and
`review-screenshots/wave14-2026-08-18/moons-page-errors.txt` (both empty of real errors).

## Explicitly unproven / not directly captured

- **Gravity-comparator physics correctness beyond the fall-duration/bounce-scale mapping was not
  visually/perceptually confirmed by eye alone** — the CSS-variable and live `transform` sampling
  evidence above is an objective DOM-level confirmation that the mapping to `surfaceGravityMs2`
  is correct and that the element genuinely animates, but I did not attempt to time a human-eye
  perception test (e.g. "does a person watching actually notice Io's ball fall faster than the
  Moon's ball," where the duration gap is only ~45ms out of ~1.6s). The Titan-vs-Europa case
  specifically (bounce heights identical due to the shared 2.6x clamp, fall durations only 12ms
  apart) is very unlikely to be perceptible as "different" by eye even though the underlying data
  differs — flagging this as a real limit of the current visual design, not a failure of the
  implementation to use real data.
- **Hotspot label overlap was tested via the "Show labels" all-at-once toggle**, which is the
  clearest way to force a worst-case simultaneous-labels state and is a real, user-reachable
  toolbar control (More → Show labels). Default hover/tap-one-at-a-time interaction was not
  exhaustively re-tested for every possible two-hotspot hover combination at every viewport; the
  P1 findings above are confirmed for the "Show labels" toggle state specifically.
- **Loading/fallback GLB states** (spinner, error placeholder) were not re-tested this pass — out
  of this review's assigned scope (polar labels + gravity comparator only); see wave12-moons.md
  for that prior coverage.

## Screenshot index (all under `review-screenshots/wave14-2026-08-18/moons/` unless noted)

- `moons-00-initial-{desktop,mobile}.png` — initial load, both viewports
- `moons-<id>-selected-desktop.png` (desktop-only pass) and `moons-<id>-labels-{desktop,mobile}.png`
  for `id` in `moon, europa, io, titan, enceladus` — every moon, both viewports, with "Show
  labels" engaged
- `moons-labels-on-{desktop,mobile}.png` — the "Show labels" toggle being engaged via the More menu
- `moons-enceladus-labels-desktop-full.png`, `moons-enceladus-southpole-crop-mobile.png`,
  `moons-enceladus-southpole-crop2x-mobile.png` — P1 #1 evidence (Tiger Stripes label buried)
- `moons-gravity-panel-io-{desktop,mobile}.png`, `moons-gravity-panel-enceladus-{desktop,mobile}.png`
  — gravity-comparator panel scrolled into view for the two extreme-gravity moons
- `moons-hotspot-before-click-desktop2.png` → `moons-hotspot-after-click-desktop2.png`,
  `moons-hotspot-before-click-mobile.png` → `moons-hotspot-after-click-mobile.png` — hotspot
  click cause/effect (Isolate + label + panel dim)
- `moons-compare-modal-mobile.png` — Compare modal overflow check on mobile
- `moons-detailpanel-scrolled-mobile.png` — mobile scroll-state sanity check
- `../moons-gravity-data.json`, `../moons-console-log.txt`, `../moons-page-errors.txt` — raw
  evidence artifacts (JSON/text, not screenshots) saved one level up from `moons/`, alongside the
  other wave14 route folders
