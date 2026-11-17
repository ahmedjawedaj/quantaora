# Wave 16 Visual QA — Orbit/Solar Lab (`/app/labs/orbit`)

Reviewer 4 of 8. Read-only QA against the already-running dev server at
`http://127.0.0.1:5174/app/labs/orbit`. Source inspected (read-only):
`src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`,
`src/components/explorer/PlanetModel.tsx`, `src/data/planets.ts`.

Tooling: ad hoc Playwright/Chromium script at `/tmp/wave16-orbit/script.js`
(not committed to the repo), driven via `node`, using a pre-provisioned
Playwright install at `/tmp/wave16-playwright`. Each "cold load" used a fresh
`browser.newContext()` (clean cache/storage) + `page.goto(..., { waitUntil: 'networkidle' })`,
so every run listed below is a genuine cold load, not an SPA-internal navigation.

All screenshots: `review-screenshots/wave16-2026-08-18/orbit/` (repo-relative from
`quantaora-app/`). Raw console/error log: `/tmp/wave16-orbit/run-log.txt`.

## Console / page errors

Across all 17 page loads (10 cold loads, 1 zoom test, 6 switch-test loads): **zero
`pageerror` events**, and the only recurring console output was the benign
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
warning (present on effectively every load) and, once, a Chromium GPU driver
perf-only message (`GPU stall due to ReadPixels`, `desktop-saturn-coldload-1`).
Neither indicates an app bug. No red console errors anywhere.

## (a) Saturn rings on mobile after repeated cold loads — PASS

Ran mobile (390x844) Saturn cold loads twice (`mobile-saturn-coldload-1.png`,
`mobile-saturn-coldload-2.png`) plus a third in-session Saturn view during the
switch test (`mobile-switch-1-saturn.png`, `mobile-switch-3-saturn.png`). In every
case Saturn's full elliptical ring geometry renders with clear margin on all sides
inside the canvas — no edge of the ring touches or is cut by the canvas/viewport
bounds, and no overlay/toolbar clips it. Confirmed via 3x pixel-level zoom crops
(`/tmp/wave16-orbit/mobile-saturn-crop1.png`, `mobile-saturn-crop2.png`, not
copied into the repo screenshots dir since they're inspection-only crops of the
above canonical screenshots). Consistent across all runs — **no flake observed
for ring clipping specifically.**

## (b) Ceres readability after repeated cold loads/switches — **FAIL (P1)**

Ceres itself (the tiny dwarf-planet sphere) is essentially indistinguishable on
screen from the much larger Jupiter model rendered immediately behind/adjacent to
it at the default (non-zoomed) camera distance — the "CERES" / "SPIN" / "ORBIT"
hotspot label stack renders directly on top of Jupiter's disc in every run, desktop
and mobile alike (see `desktop-ceres-coldload-1.png` through `-3.png`,
`mobile-ceres-coldload-1.png`, `mobile-ceres-coldload-2.png`). This alone is a
framing/clarity issue: a learner has no strong visual cue that the labels describe
Ceres rather than Jupiter.

More severe and directly reproducing the flakiness this scope was flagged for: the
**"SPIN" label overlaps/collides with the "ORBIT" and/or "CERES" pills and becomes
illegible, inconsistently across runs of the identical cold-load flow**:

- `mobile-ceres-coldload-1.png` — SPIN label not visible at all (fully hidden/off).
- `mobile-ceres-coldload-2.png` — **FAIL**: SPIN pill renders stacked directly
  behind the ORBIT pill; only a sliver of "SPIN"'s top edge peeks out above ORBIT,
  not legible. See pixel crop evidence in the same finding on
  `desktop-switch-2-ceres.png` (SPIN almost entirely obscured by the CERES pill,
  only a fragment visible) and `desktop-ceres-coldload-2.png` (SPIN partially cut
  by the CERES pill above it).
- `desktop-ceres-coldload-3.png` and `desktop-switch-4-ceres.png` — PASS: all three
  labels (CERES / SPIN / ORBIT) render fully separated and legible with no overlap.

So the same cold-load flow for the same body produces a legible label stack on some
runs and an illegible, overlapping one on others — this is exactly the flake this
task was scoped to confirm, and it reproduces on both fresh cold loads and
in-session switches (no reload needed). Root cause appears to be that the SPIN/
ORBIT pills are anchored to the live, continuously animating rotation/orbit marker
position (the lab runs the orbit/spin animation by default), so whichever instant
a screenshot/user glance lands on determines whether the pills happen to collide.

**Saturn shows the identical label-collision pattern**, so this is not exclusive
to Ceres: in all 3 Saturn cold loads (`desktop-saturn-coldload-1.png` through
`-3.png`), the "SATURN" name pill and "ORBIT" pill overlap enough that "SATURN"'s
lower edge/descenders are clipped by "ORBIT" sitting in front of it (consistent in
all 3 runs — not flaky for that particular pair), and in run 3 specifically the
"SPIN" pill collapses almost entirely into "ORBIT" (only a fragment reading "...IN"
is visible) — worse than runs 1–2 where SPIN sits clearly separated below the
rings. See crops referenced in the raw evidence; screenshots themselves are
`desktop-saturn-coldload-1.png` / `-2.png` / `-3.png`.

Net: **Ceres (and Saturn) label/info readability is flaky and P1-broken on a
meaningful fraction of loads** — not a one-off, reproduced on 2 of 5 Ceres
observations and 1 of 3 Saturn observations across this run.

## (c) Zoom In control — PASS

Desktop, Saturn selected. `desktop-zoom-before.png` vs. `desktop-zoom-after.png`
(2 successive "Zoom In" clicks, after which the button correctly self-disabled —
`zoomInDisabled` fired exactly at the documented floor). Saturn's rendered size
visibly and measurably increases between before/after (pixel crops confirm the
ring diameter grows and the whole body shifts toward center-frame), confirming
real cause/effect from the control. Saturn and its rings remain fully inside the
canvas bounds after zooming — not clipped by the canvas edge or the left toolbar
column in either screenshot. One expected, non-blocking side effect: Neptune (an
unselected, unrelated background body near the right edge) gets pushed to/past the
canvas edge after zooming in — this is a natural consequence of zooming toward the
selected body (Saturn) in a shared-camera whole-system view, not a defect in the
zoomed model itself, and Neptune's own geometry isn't the subject of this zoom
interaction.

## Switch-flake check (no reload, alternating Saturn ↔ Ceres in one session)

Desktop: `desktop-switch-1-saturn.png` → `desktop-switch-5-saturn.png` (5 switches).
Mobile: `mobile-switch-1-saturn.png` → `mobile-switch-3-saturn.png` (3 switches).
Ring geometry stayed correctly framed/unclipped on every switch on both viewports.
The label-overlap issue from (b) reproduced here too (see `desktop-switch-2-ceres.png`
vs. `desktop-switch-4-ceres.png` — same body, same switch action, different label
legibility outcome), confirming the flake is not limited to fresh page loads.

## Summary

| # | Check | Viewport | Result |
|---|---|---|---|
| a | Saturn rings not clipped, repeated cold loads | mobile 390x844 | PASS |
| b | Ceres readable, repeated cold loads/switches | desktop + mobile | **FAIL (P1)** |
| c | Zoom In visibly changes camera, no model clipping | desktop 1440x900 | PASS |
| — | Saturn/Ceres switch-flake (no reload) | desktop + mobile | Ring framing PASS; label overlap **FAIL (P1)**, same root cause as (b) |
| — | Console/page errors | all | PASS (none) |

### P1 findings

1. **Ceres label stack (CERES/SPIN/ORBIT) intermittently overlaps and becomes
   illegible** across otherwise-identical cold loads and in-session switches.
   Evidence: `mobile-ceres-coldload-2.png` (SPIN hidden behind ORBIT),
   `desktop-ceres-coldload-2.png` and `desktop-switch-2-ceres.png` (SPIN clipped
   by CERES pill), contrasted with clean layouts on
   `desktop-ceres-coldload-3.png` / `desktop-switch-4-ceres.png`. Same pattern
   also reproduces for Saturn (`desktop-saturn-coldload-1/2/3.png` — SATURN/ORBIT
   pills consistently overlap; run 3 additionally collapses SPIN into ORBIT).
2. **Ceres' own 3D body is visually indistinguishable from the adjacent, much
   larger Jupiter model** at the default (non-zoomed) camera framing on every
   cold load observed (desktop and mobile) — the CERES/SPIN/ORBIT labels render
   directly over Jupiter's disc rather than over a visually distinct Ceres,
   which undermines confidence that the labels are annotating the selected body.
   Evidence: `desktop-ceres-coldload-1.png`, `mobile-ceres-coldload-1.png`.

### P2 findings

None beyond the above — no lorem/QA/debug text observed, panels did not overflow
on either viewport, and toolbar controls (Rotate, Isolate, Section, Compare, Zoom
In/Out, Full/Reset) were visible and reachable on both desktop and mobile in every
screenshot captured.
