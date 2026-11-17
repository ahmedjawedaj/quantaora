# Wave 10 QA — Orbit (Solar System) Lab

Route: `http://127.0.0.1:5174/app/labs/orbit` · Reviewed 2026-08-18 · Read-only Playwright QA
(isolated Chromium, persistent profile at `/tmp/wave10-orbit/profile`, not the shared session).

Evidence directory (all paths below are relative to this):
`/Users/ahmedjawed/Documents/Kids Learning app/review-screenshots/wave10-2026-08-18/orbit/`

Console/error capture: `console-log.json` in the evidence directory (full transcript from the
primary run). No `pageerror` events were recorded in any run (main run, mobile-verify run,
resize-repro run, or the 12 frequency-sampling trials below).

---

## 1. Full load completion (desktop 1440×900) — PASS

Waited for the `OrbitCanvasSkeleton` overlay ("Loading solar system…") to reach
`aria-hidden="true"` (i.e. `OrbitSandbox`'s real `onReady` signal — all 11 bodies settled — not
the route's 8s `MAX_LOADING_WAIT_MS` backstop), plus a 1s settle buffer.

- Load completed in **5546 ms**, under the 8000 ms backstop, confirming it was the genuine
  per-body `onReady` signal, not the timeout fallback.
- Scene at load: fully rendered star field, Sun, and all 9 planets + Ceres, Earth selected by
  default, toolbar rail and canvas overlay chip both visible, no stuck spinner, no partial/blank
  canvas.
- Evidence: `load-complete-desktop.png`

No lorem ipsum, debug labels, or internal component names visible anywhere in this or any other
screenshot taken during this review.

## 2. Saturn rings — desktop vs. mobile — **FAIL (intermittent, P0)**

This is the headline finding of this pass, and it reproduces the *exact* failure mode the
extensive in-code comments in `OrbitSandbox.tsx` (`computeRequiredCameraDistance`,
`CameraDistance`) describe as fixed in Wave 6/9 — but empirically it is not fixed for the general
case, only for one specific static condition.

**Root cause (observed behavior, not code-verified — see "Not verified" below):** the sim runs by
default (`running: true`), so every body's orbital angle keeps advancing every frame, including
Saturn's. `computeRequiredCameraDistance` computes a single fixed "worst case" camera distance
(Saturn swung to its closest possible approach to the camera) and — per the effect in
`CameraDistance` — only recomputes when `distance` or the canvas `aspect` changes, not continuously
against Saturn's actual live position. In practice, at many real orbital angles Saturn's rendered
size/position exceeds what that fixed worst-case bound anticipated, so the rings clip the canvas
edge and/or sit behind the floating bottom "Spin/Orbit/Year" meter panel.

**Frequency sampling** (6 independent fresh page loads per viewport, each: goto → wait for full
load → click Saturn → screenshot ~700 ms later; Saturn's initial orbital angle is
randomized per mount via `Math.random()`, so each trial samples a different real orbital
position):

- **Mobile 390×844: 4 of 6 trials showed a real defect** — `freq-trial1.png` (rings + label clipped
  at the left canvas edge), `freq-trial3.png` (Saturn dropped low, overlapped/partially hidden
  behind the Spin/Orbit/Year meter panel), `freq-trial4.png` (Saturn rendered dramatically
  oversized/too-close, clipped by the right/bottom canvas edges *and* occluded by the meter panel —
  the most severe instance observed), `freq-trial5.png` (clipped at the left edge *and* occluded by
  the meter panel). Only `freq-trial2.png` and `freq-trial6.png` showed a cleanly framed Saturn.
  The originally-requested canonical mobile screenshot itself shows the defect:
  `saturn-rings-mobile.png` (rings/label clipped hard at the left canvas edge, label text reads
  "0RBIT"/partial "IN" because it's cut off).
- **Desktop 1440×900: 3 of 6 trials showed rings visibly overlapping/underlapping the bottom
  meter UI panel** (not clipped by the canvas edge, but touching/behind the translucent
  Spin/Orbit/Year cards) — `freq-desktop-trial1.png`, `freq-desktop-trial2.png`,
  `freq-desktop-trial5.png`. The other three (`freq-desktop-trial3/4/6.png`) and the canonical
  `saturn-rings-desktop.png` were cleanly framed. Desktop's wider aspect ratio makes the failure
  less severe (UI overlap rather than hard canvas clipping), consistent with the code comments'
  own claim that the horizontal frustum is the tighter constraint on portrait/mobile.
- I also tried to isolate whether this was a one-off *transition* artifact from the
  desktop→mobile viewport resize itself (rather than orbital position): `repro-mobile-t50ms.png`
  through `repro-mobile-t4000ms.png` and `mobile-saturn-t0.3s/t1.3s/t3.3s.png` and
  `mobile-saturn-paused-sample1/2.png` all happened to sample Saturn at a well-framed orbital
  angle and show no clipping — confirming the defect is **orbital-phase-dependent, not a resize
  race**, and that it can persist for as long as Saturn's real-time orbit keeps it in a bad zone
  (there is no re-fit driven by the body's live position, only by camera-distance/aspect changes).

**Severity: P0.** "Rings render correctly, not clipped, at both viewports" fails on a majority of
mobile samples and a plurality of desktop samples with the sim running in its default state — this
is the default state a learner lands in, not an edge case they have to seek out.

**Not verified:** I did not open/modify `OrbitSandbox.tsx` beyond read-only inspection already
covered by this review's setup, and did not instrument the actual runtime camera-distance value,
so the mechanism above is my best explanation from the black-box evidence, not a confirmed code
diff. I did not test whether pausing the sim immediately after load (before advancing the orbital
angle) changes the odds, since the requested workflow assumes default (running) state.

## 3. Mobile planet selector — 5 planets — PASS

Used the mobile-only switcher (`button[title="<Planet>"]`, "Planet X of 11" row, visible below the
canvas at 390×844). Selected Mercury, Venus, Earth, Mars, Jupiter in sequence.

- Each tap correctly updated: the active-state pill styling, the in-scene highlight ring + name/
  Spin/Orbit label badges on the newly selected body, and the entire right-hand detail panel
  (name, tagline, key facts, "Year" meter value matches the real orbital period — 88d for Mercury,
  225d for Venus, 687d for Mars, 12y for Jupiter).
- Evidence: `mobile-selector-mercury.png`, `mobile-selector-venus.png`,
  `mobile-selector-earth.png`, `mobile-selector-mars.png`, `mobile-selector-jupiter.png`
- No panel overflow, no page-level clipping of the switcher row or detail panel at this viewport.

**P2 — label crowding on inner planets.** For Mercury and Venus specifically, whose orbit radius
is visually tight around the Sun, the floating name badge + "ORBIT" badge + "SPIN" badge overlap
and become illegible (Mercury reads as "MEГ ORBIT" fused together in
`mobile-selector-mercury.png`; also reproduces on desktop in `sequential-immediate-mercury.png`,
where the name badge is cut down to "ORBIT_RY"). Jupiter/Saturn/outer planets, with more visual
room, do not show this (see `mobile-selector-jupiter.png`, `sequential-immediate-jupiter.png` for
contrast).

## 4. Fit View / zoom controls — PASS

- `Zoom In` (4 clicks) correctly pulled the camera closer — `zoomed-in-desktop.png`.
- `Zoom Out` (10 clicks, well past the point of visual usefulness, to test for overshoot/stuck
  behavior) correctly pushed the camera back, planets got progressively smaller and more spread
  out, no crash, no snap-to-blank-space, no stuck camera — `zoomed-out-desktop.png`.
- "More" menu opened cleanly with legible, non-clipped options (Show labels / X-Ray view / Fit
  view / Clean view) — `more-menu-open-desktop.png`.
- Clicking "Fit view" correctly reframed the camera back to a sane default distance showing the
  whole system without clipping and without overshooting to empty space —
  `fitview-after.png` (Jupiter selected at the time — for reference this is one of the "clean"
  cases, no ring clipping visible for Jupiter, which has no rings).

## 5. Sequential planet switching (no stale/ghost geometry) — mostly PASS, one P0 exception (Neptune)

Switched Sun → Mercury → Jupiter → Saturn → Neptune → Earth on desktop via the sidebar, capturing
both an "immediate" screenshot (~120 ms after click) and a "settled" one (~900 ms after) for each,
to check for a blank/stale frame during the transition.

- Sun, Mercury, Jupiter, Saturn, Earth: each switch correctly showed the new body highlighted
  (yellow selection ring), its own Spin/Orbit labels, and the correct detail panel/meter values (Sun
  shows "center" for Orbit as expected since it has no orbit) with no leftover geometry or
  highlight from the previous selection, and no blank canvas frame at either sample point.
  Evidence: `sequential-immediate-sun.png` / `sequential-settled-sun.png`,
  `sequential-immediate-mercury.png` / `sequential-settled-mercury.png`,
  `sequential-immediate-jupiter.png` / `sequential-settled-jupiter.png`,
  `sequential-immediate-saturn.png` / `sequential-settled-saturn.png`,
  `sequential-immediate-earth.png` / `sequential-settled-earth.png`.
- **Neptune — P0.** Clicking Neptune correctly updates the sidebar active state and the entire
  right-hand detail panel (name "Neptune", "The windiest world", key facts, Year = 165y). But in
  the 3D scene, Neptune itself is **not visible at all** — only a fragment of its name-label text
  ("…NE", clipped) peeks out at the far-left edge of the canvas, partly hidden behind the toolbar
  rail; Neptune's own sphere is entirely off-canvas, both immediately after the click and still
  1 second later (`sequential-immediate-neptune.png`, `sequential-settled-neptune.png`). Because
  Neptune's simulated orbital period is huge (165 Earth years, sped up only by the default 6
  days/sec), it would take a very long real-world time to drift back into frame — for practical
  purposes, in this session Neptune remained invisible for the entire observed window after
  selection. This breaks the "See it" step of the intended click → highlight → learn interaction:
  a learner selecting Neptune from the list gets correct facts but no visual confirmation their
  selection did anything in the 3D scene. This is consistent with the same underlying issue as
  finding #2 — the camera's fixed default framing is not derived from, or reactive to, the
  selected body's actual live orbital position.

## Summary of findings by severity

- **P0** — Saturn's rings intermittently clip the canvas edge and/or are occluded by the bottom
  meter UI panel on both viewports (majority of mobile samples, plurality of desktop samples),
  contradicting the specific "no clipping regardless of orbital position" intent documented in
  `OrbitSandbox.tsx`'s own comments. Evidence: `saturn-rings-mobile.png`, `freq-trial1/3/4/5.png`,
  `freq-desktop-trial1/2/5.png`.
- **P0** — Selecting Neptune (and likely other outer/high-eccentricity-orbit bodies at certain
  real-time orbital angles) can leave the selected planet entirely outside the camera's frustum —
  invisible in the 3D scene — for an extended, session-relevant duration, even though the detail
  panel/sidebar correctly reflect the selection. Evidence: `sequential-immediate-neptune.png`,
  `sequential-settled-neptune.png`.
- **P2** — Inner-planet (Mercury, Venus) name/Spin/Orbit label badges overlap and become illegible
  due to their tight orbital radius, on both mobile and desktop. Evidence:
  `mobile-selector-mercury.png`, `sequential-immediate-mercury.png`.

## What passed cleanly

- Full scene load completion signal and timing (desktop).
- Mobile planet selector: switching between 5 planets all correctly updated scene highlight +
  detail panel, no panel overflow.
- Zoom In / Zoom Out / Fit View: all reframe correctly, no stuck camera, no overshoot to blank
  space, "More" menu fully legible and not clipped.
- Sequential switching for 5 of 6 tested bodies (Sun, Mercury, Jupiter, Saturn, Earth): no stale/
  ghost geometry, no blank frame during transition.
- No console errors (`pageerror`) in any of the ~20 page loads run across this review. Only benign
  warnings: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` and
  repeated Chromium software-GL driver messages (`GL Driver Message (OpenGL, Performance,
  GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels`) — both environment/tooling noise, not
  app-level errors, verbatim in `console-log.json`.
- No internal QA language, placeholder/lorem ipsum text, or debug labels observed in any
  screenshot.

## Explicitly not verified

- Root cause inside `OrbitSandbox.tsx`/`CameraDistance` for findings #2/#5 — diagnosed
  behaviorally from black-box screenshots only, per this review's read-only mandate; no source
  edits or runtime instrumentation were made.
- Whether pausing the animation immediately after load (rather than the default running state)
  avoids the Saturn-clipping / Neptune-invisible states — not tested, since the task's default
  workflow assumes the sim's default running state.
- Other ringed-adjacent edge cases (e.g., Uranus, Pluto, Ceres visibility at their own orbital
  extremes) were not sampled with the same frequency rigor as Saturn/Neptune — only observed
  incidentally in wide shots, where they appeared normally rendered.
- Cross-section, Isolate, Compare, X-Ray, Labels toggle, and the "Investigate motion" panel's
  Motion/Mission tabs were visible and reachable in screenshots but not functionally exercised in
  this pass (out of the requested scope).
