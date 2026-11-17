# Wave 22 Visual QA — Orbit/Solar Lab (`/app/labs/orbit`), Ceres stress test

Reviewer 2 of 2 (parallel pass), independent browser session. Read-only QA against the
already-running dev server at `http://127.0.0.1:5174/app/labs/orbit`. Source inspected
(read-only, no edits made): `src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`,
`src/components/explorer/PlanetModel.tsx`, `src/components/explorer/CanvasControls.tsx`,
`src/data/planets.ts`. Prior report read for house style/rigor only, not as ground truth:
`docs/reviews/wave16-orbit.md` (found a P1: the CERES/SPIN/ORBIT pill stack intermittently
overlapping and becoming illegible, root-caused to labels anchored to a continuously-animating
rotation/orbit marker; later waves — visible in the source as Wave 17/18/20 QA comments —
rewrote the label anchoring and added a `useFrame`-driven `LabelDeclutter` pairwise-separation
pass with a stage-bounds clamp).

**Scope**: Orbit/Solar Lab, Ceres only, desktop 1440×900 (5 select→drag→reselect cycles) and
mobile 390×844 (5 long sessions, ~15–20s each, interleaved wait/drag/tap).

## Tooling

Dedicated Playwright/Chromium instance (`NODE_PATH=/Users/ahmedjawed/.npm/_npx/5c6d8c4f680fcd0a/node_modules`),
driven from `/tmp/wave22-orbit/run.js` (not committed to the repo), own `browser.launch()` +
per-viewport `browser.newContext()` — no shared/MCP browser tool, no collision with the other
concurrent Wave 22 reviewer. `console`/`pageerror` listeners attached to every page. Raw
measurement dump: `/tmp/wave22-orbit/results.json`; deduped console/error log:
`/tmp/wave22-orbit/console-log.txt`.

**Methodology correction made during this run** (documented because it changes what the numbers
mean): the first draft of the drag gesture started the mouse-down at the exact geometric center
of the `data-lab-stage` container. For a `CLOSE_FOCUS_BODY_IDS` selection (Ceres), the body — and
specifically its Orbit label pill — sits very close to that same screen center, so
`elementFromPoint` at the drag's start coordinate resolved to the Orbit `<span>`, not the
`<canvas>`. Since OrbitControls' own pointerdown listener is attached directly to the canvas DOM
element (not a document-level listener), a `mousedown` that lands on a sibling label element never
reaches it — no real camera drag occurred that cycle. This was caught by cross-checking
`document.elementFromPoint()` against the intended drag-start pixel before trusting any
measurement, confirmed by a visible click-log capture showing `pointerdown` landing on
`SPAN:Orbit` in the uncorrected version. The drag start was moved to a fixed offset
(stage-relative `0.8×width, 0.25×height`), reverified via `elementFromPoint` to reliably hit
`CANVAS` on both viewports, and every one of the 15 drags in the final run below logged
`dragStartHitTest: "CANVAS"` confirming a genuine OrbitControls-driven camera drag occurred each
time. All numbers in this report are from that corrected run.

Also note: an `aside h2` selector used mid-investigation to sanity-check "which body is currently
selected" was found to match the wrong `<aside>` (ContentNav's own left-column heading, "Solar
System", not DetailPanel's body-name heading) and its `selectedBodyName` field in the raw JSON is
consequently a red herring — every real check in this report (label rects, containment, overlap,
selection-text) does not depend on it. Ceres' continued selection was independently confirmed via
screenshots (DetailPanel visibly reads "Ceres" / "The Dwarf Planet" throughout) and via the
Name/Spin/Orbit labels' continued presence at every measurement point (they only render for the
selected body).

## Console / page errors

Zero `pageerror` events across all 6 browser contexts (1 desktop, 5 mobile). Console output limited
to benign noise present on every load: Vite HMR connect/connected debug lines, the React DevTools
info banner, and the `THREE.Clock: This module has been deprecated. Please use THREE.Timer
instead.` warning (same benign warning Wave 16 noted). No red console errors anywhere. Full
deduplicated set:

```
[console:debug] [vite] connecting...
[console:debug] [vite] connected.
[console:info] %cDownload the React DevTools for a better development experience... (React banner)
[console:warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

## Desktop 1440×900 — 5 select→drag→reselect cycles

Fresh load once, then 5 cycles of: select Ceres (left ContentNav list) → drag gesture on canvas
(verified to hit `CANVAS`, not a label) → reselect Ceres (click its own in-canvas Name pill) →
settle → measure.

### (a) Containment — PASS, 5/5 cycles, 15/15 label checks

Every one of Name/Spin/Orbit's `getBoundingClientRect()` was fully inside the stage container
(`[data-lab-stage]`, 260,64 → 1080,721, 820×657) on every cycle, with large margins (hundreds of
px from any edge — e.g. cycle 1 Name: `leftOverflow -353.25, rightOverflow -353.34, topOverflow
-274.95, bottomOverflow -336.35`, where negative = inside by that many px). No label ever
approached the stage-bounds clamp. Full per-cycle numbers below.

### (b) Pairwise non-overlap — **FAIL (P1), 5/5 cycles — Spin/Orbit pill collision**

| Cycle | Name vs Spin | Name vs Orbit | **Spin vs Orbit** |
|---|---|---|---|
| 1 | overlapX 74.79, overlapY **-27.54** → clear | overlapX 39.17, overlapY **-19.85** → clear | overlapX **19.86**, overlapY **27.11** → **OVERLAPPING** |
| 2 | overlapX 75.69, overlapY **-52.93** → clear | overlapX 36.66, overlapY **-38.38** → clear | overlapX **15.76**, overlapY **20.47** → **OVERLAPPING** |
| 3 | overlapX 75.54, overlapY **-41.45** → clear | overlapX 35.53, overlapY **-36.88** → clear | overlapX **14.70**, overlapY **30.38** → **OVERLAPPING** |
| 4 | overlapX 75.39, overlapY **-30.03** → clear | overlapX 35.81, overlapY **-35.43** → clear | overlapX **15.05**, overlapY **26.92** → **OVERLAPPING** |
| 5 | overlapX 75.24, overlapY **-18.86** → clear | overlapX 37.50, overlapY **-34.06** → clear | overlapX **16.79**, overlapY **17.07** → **OVERLAPPING** |

(overlap = `min(right) − max(left)` / same for Y; both axes must be positive to be a true
overlap — negative means clear on that axis.)

Name-vs-Spin and Name-vs-Orbit never overlap in any of the 5 cycles — the Wave 17/18 fixes for
those specific pairs hold up under this stress test. But **Spin and Orbit overlap in all 5 of 5
cycles**, by a consistent, non-trivial amount (~15–20px horizontally, ~17–30px vertically — not a
1px rounding artifact). Visually confirmed in every screenshot checked
(`desktop-cycle-1-settled.png`, `desktop-cycle-3-settled.png`, `desktop-cycle-5-settled.png`): the
"SPIN" pill's text is partly-to-almost-fully obscured behind the "ORBIT" pill or the body's own
halo ring in every case. This is the same *symptom class* Wave 16 flagged as P1 (a pill in this
label stack becoming illegible due to overlap with a sibling pill) — the specific pair changed
(Spin/Orbit instead of Ceres/Spin) and the failure mode changed from *intermittent* (Wave 16: 2/5
observations) to **consistently reproducible (5/5)**, but it is not fixed. Given
`LabelDeclutter`'s own extensive in-source comments describe exactly this pairwise
overlap-avoidance as its job, a 100% reproduction rate across 5 independent cycles suggests this
isn't frame-timing flake but a case its separation math (or the stage-bounds clamp that runs after
it) does not actually resolve for this specific pair/anchor geometry.

### (c) Drift across cycles (camera state is not held equivalent — see note)

Each cycle performs an *additional* drag on top of the previous cycles' camera state (no reset
between cycles, matching the assigned protocol), so azimuth accumulates and label drift across
cycles reflects a genuinely different camera angle each time, not instability. Numbers (all deltas
vs. cycle 1):

| Cycle | Name Δleft / Δtop | Spin Δleft / Δtop | Orbit Δleft / Δtop |
|---|---|---|---|
| 1 | 0 / 0 | 0 / 0 | 0 / 0 |
| 2 | -1.99 / -57.21 | -0.41 / -30.18 | -135.11 / -37.05 |
| 3 | -1.85 / -45.60 | -0.34 / -30.16 | -135.91 / -27.05 |
| 4 | -1.71 / -34.06 | -0.26 / -30.16 | -135.30 / -17.07 |
| 5 | -1.57 / -22.77 | -0.18 / -30.14 | -133.30 / -7.26 |

Name and Spin are near-fixed screen-space anchors once the close-focus camera locks on (small,
smoothly-decaying deltas — consistent with `CameraFit`'s per-frame re-centering settling). Orbit
jumped ~135px left after cycle 1's drag and then held there (cycles 2–5 within 3px of each other
on X) while drifting steadily *downward* toward Spin's row each cycle (top 367→377→387→397, i.e.
+10px/cycle) — this progressive vertical convergence toward Spin's fixed Y band is the direct
mechanical cause of the (b) overlap above: as cumulative camera azimuth increases, Orbit's 3D
anchor projects closer and closer to Spin's screen position, and the declutter pass never fully
separates them once they're this close. Not classified as its own separate finding — it's the same
root cause as (b).

### (d) No native text-selection artifact — PASS, 5/5

`window.getSelection().toString()` was empty (`""`) after every drag in all 5 cycles. The drag
gesture is being consumed as a camera-rotate, not falling into native browser text selection.

### (e) Toolbar control still responds after cycle — PASS, 5/5 (spot-verified cycle 1)

Used Rotate (`button[aria-label="Rotate"]`) rather than Zoom In, since Zoom In can hit its floor
(`zoomInFloor`) after repeated close-focus selections within one session, making a before/after
diff ambiguous by design — Rotate toggles idempotently every cycle. Clicked without error in all 5
cycles (screenshots captured for every cycle: `desktop-cycle-{1..5}-toolbar-before.png` /
`-after.png`); visually verified for cycle 1 (`desktop-cycle-1-toolbar-before.png` vs.
`-after.png`) — after ~1.2s of auto-rotate the background Earth model and the Orbit pill both
visibly shift position, confirming the control drives the camera. Toggled back off immediately
after each check so it doesn't pollute the next cycle's camera state.

## Mobile 390×844 — 5 long sessions (~15–20s each)

Fresh load per session → select Ceres (mobile planet-switcher pill, `button[title="Ceres"]`) →
wait ~3s → drag canvas (verified `CANVAS` hit) → wait ~3s → tap the in-canvas Ceres Name pill →
wait ~3s → second drag → screenshot end. 3 measurement points per session (after each drag / after
the tap), 5 sessions = 15 measurement points total.

### (a) Containment — PASS, 15/15 measurement points

All three labels stayed fully inside `[data-lab-stage]` (0,64 → 390,486, 390×422) at every
measurement point across all 5 sessions — no clipping.

### (b) Pairwise non-overlap — **FAIL (P1), 15/15 points — same Spin/Orbit collision as desktop**

Identical pattern to desktop, and just as consistent. Representative session (numbers essentially
identical across all 5 sessions — see drift note below):

| Point | Action | Name vs Spin | Name vs Orbit | **Spin vs Orbit** |
|---|---|---|---|---|
| 1 | drag | overlapX 75.36, overlapY **-31.04** → clear | overlapX 71.66, overlapY **-51.86** → clear | overlapX **51.10**, overlapY **11.50** → **OVERLAPPING** |
| 2 | tap-label | overlapX 75.76, overlapY **-29.03** → clear | overlapX 78.03, overlapY **-57.88** → clear | overlapX **57.22**, overlapY **3.64** → **OVERLAPPING** |
| 3 | drag-2 | overlapX 75.95, overlapY **-63.17** → clear | overlapX 61.50, overlapY **-57.08** → clear | overlapX **40.49**, overlapY **29.07** → **OVERLAPPING** |

This held across all 5 sessions with sub-0.1px variance point-for-point (deterministic — see drift
below), i.e. **every single one of the 15 mobile measurement points shows Spin/Orbit overlapping**.
Visually confirmed in `mobile-session-1-start.png` (Orbit pill overlapping the selection halo ring
and Spin), `mobile-session-3-end.png` (Spin almost entirely swallowed by Orbit — only "...IN" of
"SPIN" visible), and the corresponding desktop screenshots above. Combined with the desktop
5-for-5 result, this is a clean, 20-for-20 reproduction across every cycle/session/viewport tested
in this pass — not a flake, a consistently-present defect in the current build.

### (c) Drift

Point-1 measurements across the 5 independent sessions (fresh load each time, same deterministic
scripted gesture) are essentially identical — deltas of 0.00–0.03px vs. session 1 (e.g. session 5:
`name.left Δ0.00, name.top Δ0.00`). This confirms the scene's deterministic-start-angle design
(Wave 13 QA fix, still holding) produces bit-for-bit-repeatable camera/label state for identical
input across cold loads — no cross-session flakiness. Within a single session, point 1→2 (tap)
shows only a small shift (~0.5–2px, expected from `selectPlanet` resetting `cameraDistance` to
`CLOSE_FOCUS_DEFAULT_DISTANCE` on reselect) while point 2→3 (second drag) shows a real ~40px jump
(`name.top` 193.0→152.6) consistent with a genuine second camera rotation — both expected,
non-buggy behavior.

### (d) No native text-selection artifact — PASS, 15/15

`window.getSelection().toString()` empty at every measurement point across all 5 sessions.

### (e) Toolbar check

Per the task's own allowance, skipped as a scored check on mobile (no unambiguous toolbar
equivalent given `Zoom In`'s floor issue noted above) — but the same `CanvasControls` rail (Rotate,
Pause, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset) is visibly present and reachable
at the top of the mobile canvas in every start/end screenshot, so it's not inaccessible on mobile.

## Screenshots

All in `review-screenshots/wave22-2026-08-18/orbit/` (repo-relative from `quantaora-app/`):

- `desktop-cycle-{1..5}-settled.png` — settled state after each select→drag→reselect cycle
- `desktop-cycle-{1..5}-toolbar-before.png` / `-toolbar-after.png` — Rotate control before/after
- `mobile-session-{1..5}-start.png` / `-end.png` — start and end of each mobile session

## Summary

| # | Check | Viewport | Result |
|---|---|---|---|
| a | Label containment inside stage | desktop (5 cycles) | PASS (15/15) |
| a | Label containment inside stage | mobile (15 points) | PASS (15/15) |
| b | Name vs Spin non-overlap | desktop + mobile | PASS (20/20) |
| b | Name vs Orbit non-overlap | desktop + mobile | PASS (20/20) |
| b | **Spin vs Orbit non-overlap** | desktop + mobile | **FAIL (P1), 20/20 overlapping** |
| c | Drift explainable by real camera motion | desktop + mobile | PASS (no unexplained jumps) |
| d | No native text-selection artifact | desktop + mobile | PASS (20/20 empty) |
| e | Toolbar control (Rotate) visibly responds | desktop | PASS (5/5) |
| — | Console/page errors | all | PASS (none) |

### P1 findings

1. **Spin and Orbit label pills overlap on every single select→drag→reselect cycle/session
   tested (20/20: 5 desktop cycles + 15 mobile measurement points across 5 sessions)**, by a
   consistent, visually-significant margin (desktop: ~15–20px × ~17–30px; mobile: up to ~57px ×
   ~30px), with "SPIN" frequently reduced to a single visible fragment behind "ORBIT". This is the
   same symptom class the Wave 16 QA P1 flagged (a pill in the Ceres label stack overlapping a
   sibling and becoming illegible) and later waves (17/18/20, per in-source comments) attempted to
   fix via label re-anchoring plus a per-frame `LabelDeclutter` pairwise-separation pass. That fix
   demonstrably resolved the Name-vs-Spin and Name-vs-Orbit pairs (0/20 overlaps observed for
   either in this pass) but **did not resolve the Spin-vs-Orbit pair**, and did so with *worse*
   consistency than the original bug (100% reproduction here vs. Wave 16's ~40% intermittent rate) —
   this reads as a structural gap in the current declutter/anchoring logic for this specific pair
   rather than residual timing flake. Evidence: `desktop-cycle-1-settled.png`,
   `desktop-cycle-3-settled.png`, `desktop-cycle-5-settled.png`, `mobile-session-1-start.png`,
   `mobile-session-3-end.png`, plus the full overlap tables above (raw data:
   `/tmp/wave22-orbit/results.json`).

### P2 findings

None. No lorem/QA/debug text observed, no unrelated layout overflow, toolbar fully reachable on
both viewports in every screenshot.

### Not reproduced (fix holding)

- The original Wave 16 P1's specific pairing (CERES name pill vs. SPIN) — 0 overlaps in 20/20
  measurements.
- CERES/Name pill vs. ORBIT — 0 overlaps in 20/20 measurements.
- Label containment/off-stage clipping — 0 failures in 30/30 label-containment checks (15 desktop
  + 15×... see full counts above).
- Native text-selection artifacts from the drag gesture — 0/20.
- Cross-session/cross-load non-determinism — mobile point-1 measurements were reproducible to
  within 0.03px across 5 independent fresh loads.
