# Wave 6 — Live Acceptance QA: Orbit Lab (`/app/labs/orbit`)

Date: 2026-08-18
Route: `http://127.0.0.1:5174/app/labs/orbit` (Space > Solar System)
Source read (inspection only, no edits): `src/routes/SpaceLab.tsx`
Tooling: ad-hoc Playwright (chromium) script run from `/tmp/wave6-orbit/`, not committed to the repo.

## Overall verdict: PASS

The Orbit lab loads, renders a real non-blank 3D scene at both viewports, all 11 bodies
(Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Ceres) are
selectable and each switch correctly updates both the rendered body and the detail panel
(name, tagline, key facts, "why it matters" copy). No console errors, page errors, or failed
requests were observed. No blocking (P0) issues found. Two P1s and two P2s below are worth
follow-up but none block the lab.

## Ceres check (explicit)

**Ceres loads correctly and is visually distinct.** Selecting it from the desktop sidebar list
renders a small, reddish-brown body clearly smaller than the neighboring planets, labeled
`CERES` with `ORBIT`/`SPIN` indicator tags, and the right-hand detail panel updates to "THE
DWARF PLANET / Ceres / The asteroid belt's giant" with correct key facts (2.77 AU, 470 km
radius, 9.1 hour day, 4.6-year orbital period, 0 moons) and a "why it matters" blurb about the
asteroid belt. Evidence: `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/desktop/02-switch-ceres.png`.

## Coverage statement

- **Desktop 1440x900:** initial load; sequential switch through all 10 non-Sun bodies via the
  left sidebar list (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto,
  Ceres) with a screenshot after each; a rapid back-to-back switch test (Mercury → Jupiter →
  Ceres → Saturn → Earth, ~120ms apart) with an "immediate" and a "settled" screenshot; toolbar
  control checks (auto-rotate, isolate, zoom in, zoom out, reset — all found and clickable;
  "Section"/cross-section is present but disabled, "Compare" present).
- **Mobile 390x844:** initial load; switch through Mars, Jupiter, Ceres (all via direct canvas
  tap, since the sidebar list is not present at this breakpoint — see P1 below); toolbar `More`
  menu check (reveals Show labels / X-Ray view / Fit view / Clean view); a direct-tap-on-3D-body
  test both while the scene was animating and while paused, to determine whether canvas-tap
  selection genuinely works on touch-sized viewports (it does, confirmed via a precise tap on
  the paused Sun — see P1 below for the caveat).
- Console/page-error listeners were attached before navigation and stayed attached for the
  full session on both viewports; full log: `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/console-log.txt`.
- Not separately re-verified: isolate-mode and zoom-level visual state in isolation (a reset
  click included in the same automated pass fired immediately after zoom/isolate and before the
  next screenshot, so their standalone visual effect wasn't captured — this is a gap in this
  QA pass's screenshots, not an observed product defect, since both controls were confirmed
  clickable with no console errors).

## Findings

### P1 — Significant

1. **No visible planet-selector list on mobile; switching relies on tapping small, moving 3D
   bodies directly in the canvas.** The left sidebar (`ContentNav`, the only enumerated list of
   all 11 bodies) is rendered with `hidden lg:block` in `SpaceLab.tsx`, so at 390x844 it does not
   exist in the DOM at all — there is no dropdown, tab strip, or bottom-sheet fallback list. The
   toolbar's `More` menu only exposes view toggles (Show labels / X-Ray view / Fit view / Clean
   view), not a body picker. Direct-tap selection on the canvas does work (confirmed: tapping
   precisely on the paused Sun switched the detail panel to "Sun"), but an unpaused attempt to
   tap a small orbiting body (Jupiter-sized target near the frame edge) missed and left the
   selection unchanged, illustrating how easy it is for a touch user to miss small/fast bodies
   like Mercury or Ceres with no textual fallback to fall back on.
   Viewport: mobile 390x844.
   Evidence: `.../mobile/01-initial-scene.png` (no sidebar present), `.../mobile/05-more-menu.png`
   (More menu contents), `.../mobile/07-after-canvas-tap.png` (tap while animating, missed — still
   shows Earth), `.../mobile/10-tap-sun-paused.png` (tap while paused, succeeded — shows Sun).

2. **Saturn's ring geometry is clipped by the bottom edge of the canvas in the default camera
   framing, on every screen regardless of which body is selected.** Saturn sits low in the fixed
   default orbital view and its rings extend past the bottom of the `data-lab-stage` container in
   every screenshot captured (both viewports, all planet selections). This is a static-framing
   issue, not tied to any one selection.
   Viewport: desktop 1440x900 (and reproducible at mobile 390x844).
   Evidence: `.../desktop/02-switch-saturn.png`, also visible cropped at bottom in
   `.../desktop/01-initial-scene.png`, `.../desktop/02-switch-earth.png`, and most other desktop
   screenshots in this set.

### P2 — Polish

3. **Body name label overlaps the "ORBIT" pill tag for inner/closely-spaced bodies.** When
   Mercury is selected, its floating name label and the "ORBIT" indicator tag render at nearly
   the same screen position, producing an illegible overlapped readout (reads roughly
   "ORBIT[obscured]URY"). Earth, Jupiter, Saturn, Uranus, Pluto, and Ceres labels (further out /
   less crowded) did not show this overlap in the same pass.
   Viewport: desktop 1440x900 (also reproduced on mobile for Earth's own SPIN/ORBIT tags at
   `.../mobile/03-toolbar-check.png`, where the "ORBIT" and "EARTH" labels visibly collide).
   Evidence: `.../desktop/02-switch-mercury.png`.

4. **Loading skeleton readiness never resolves to Playwright's "hidden" state even after
   reaching 100%.** The `OrbitCanvasSkeleton` overlay fades via `opacity` (not `display:none`),
   so it stays technically "visible" (non-zero size, `pointer-events-none`, `aria-hidden`)
   after the fade-out completes. This did not cause any visible defect in the screenshots (the
   scene was fully rendered and unobstructed by the time captures were taken, after a fixed
   settle delay), but it's worth noting for anyone using visibility-based waits against this
   component in future automated QA.
   Viewport: both.
   Evidence: console log timestamps in `console-log.txt` showing "100%" progress text still
   matched by a `waitForSelector(..., {state:'hidden'})` timeout.

## Console / page error summary

No `pageerror` events, no `requestfailed` events, and no application-level console errors were
logged across either viewport's full session (verified via `grep -iE "pageerror|requestfailed|error"` over the log, excluding benign lines).

Verbatim recurring lines (both benign, expected in a WebGL/dev environment):
```
[console:warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[console:warning] [.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
```
Plus standard Vite dev-server connect/HMR debug lines and the React DevTools install hint —
none indicate a defect.

Full log evidence: `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/console-log.txt`.

## No internal QA / debug / placeholder text observed

All copy inspected (labels, key facts, "why it matters" blurbs, toolbar tooltips, mission-step
prompts) reads as finished learner-facing content. No lorem ipsum, TODO strings, or internal
component names were visible in the UI in any captured screenshot.

## Screenshot index

Desktop (1440x900): `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/desktop/`
- `01-initial-scene.png`, `02-switch-{mercury,venus,earth,mars,jupiter,saturn,uranus,neptune,pluto,ceres}.png`,
  `03-rapid-switch-immediate.png`, `03-rapid-switch-settled.png`, `04-after-toolbar-interactions.png`

Mobile (390x844): `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/mobile/`
- `01-initial-scene.png`, `03-toolbar-check.png`, `04-after-toolbar-click.png`, `05-more-menu.png`,
  `06-before-canvas-tap.png`, `07-after-canvas-tap.png`, `08-direct-canvas-tap-topleft.png`,
  `09-paused-state.png`, `10-tap-sun-paused.png`

Console/error log: `review-screenshots/live-acceptance-2026-08-18-wave6/orbit/console-log.txt`
