# Wave 14 QA — Orbit lab (Saturn / Neptune / Ceres): cold loads, switch-back, zoom bounds, banner overlap

Reviewer: Wave 14 reviewer #7 (read-only). Route: `http://127.0.0.1:5174/app/labs/orbit`
(`src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`).
Evidence dir: `review-screenshots/wave14-2026-08-18/orbit/` (19 primary + 5 supplemental
screenshots, all filenames referenced below exist there).

Environment note: this run executed while 9 other parallel QA reviewer browsers were also
running against the same machine (Wave 14 coordination), so occasional Playwright click
timeouts were observed on a first pass and the script was rerun with longer per-step timeouts
and per-step error isolation; the results below are from the clean rerun (`run-log.txt`
preserved at `/tmp/wave14-orbit-qa/run-log.txt`, not in the repo).

## Verdict summary

| Body | Cold load (desktop) | Switch-away/back x2 (desktop) | Zoom bounds (desktop) | Toolbar reachable | Mobile framing |
|---|---|---|---|---|---|
| Saturn | PASS | PASS | CONDITIONAL (Zoom In inert) | PASS | **FAIL (clipped)** |
| Neptune | PASS | PASS | CONDITIONAL (Zoom In inert) | PASS | PASS |
| Ceres | **FAIL (clipped)** | **FAIL (clipped, persists)** | **FAIL (clipping worsens at max zoom)** | PASS | **FAIL (clipped)** |

Instruction-banner overlap check (desktop + mobile): **PASS** — no overlap with toolbar or
scene content observed in any captured state.

## P0 — none found in this scope.

Nothing here rose to "app unreachable / route crashes / core interaction totally inert" —
zoom bounds and the two clipping bugs below are all real but are one control/one body's framing
being wrong, not the lab being unusable, so I'm scoring them P1 rather than P0. Flagging that
the Ceres clipping in particular is close to the P0 line since it defeats the entire purpose of
the close-focus feature for that body (see finding #2).

## P1 findings

**1. Saturn is clipped by the canvas edge on mobile (390×844) when selected, and does not
self-correct over time.**
- Route/surface: Orbit lab, Mobile 390×844, Saturn selected via the mobile planet-switcher chip
  row (`PLANET 7 OF 11` strip).
- Observed: immediately after selection (~300ms) and still at +1s, +2.5s, +5s, and +10s later
  (sim left running the whole time, i.e. across many different live orbital angles — not a
  single unlucky frame), Saturn's ring and body sit hard against the left edge of the canvas,
  and its "ORBIT"/"SPIN" hotspot label chips are visibly cut in half by the canvas boundary.
  Desktop 1440×900 does not show this for Saturn (see PASS screenshots below) — this is
  mobile-aspect-specific.
- Evidence: `orbit-saturn-clipped-mobile-300ms.png`, `orbit-saturn-clipped-mobile-10s.png`,
  `orbit-banner-overlap-mobile-saturn.png`.
- Contrast (Saturn correctly framed on desktop): `orbit-saturn-cold-load-desktop.png`,
  `orbit-saturn-switch-back-1-desktop.png`, `orbit-saturn-switch-back-2-desktop.png`.
- No console/page errors accompanied this (purely visual framing).

**2. Ceres is clipped by the canvas edge on desktop at its default cold-load distance, gets
worse at max zoom-in, and is only fixed by zooming out to (or near) the global minimum — which
defeats the point of its dedicated close-focus camera behavior. Also clipped on mobile.**
- Route/surface: Orbit lab, Desktop 1440×900 and Mobile 390×844, Ceres selected.
- Observed on desktop: on cold load, on both switch-back cycles, and worse still after 2 Zoom-In
  clicks (2 clicks were all that were available before the button disabled itself), Ceres's own
  sphere is cut off by the right edge of the canvas where it meets the right-hand DetailPanel —
  visually a large tan cratered disc bleeding off the edge of the stage, with the "CERES" label
  pill partially/fully pushed off-canvas. Zooming out to near the global minimum (45 clicks)
  finally resolves it, but at that point Ceres is a tiny unreadable dot in the full-system view —
  i.e. there is no zoom level at which Ceres is both fully in-frame and actually legible as the
  "close focus" feature intends.
- Evidence (desktop): `orbit-ceres-cold-load-desktop.png`, `orbit-ceres-switch-back-1-desktop.png`,
  `orbit-ceres-switch-back-2-desktop.png` (all three show the same clipped right edge),
  `orbit-ceres-zoom-max-desktop.png` (clipping visibly worse), `orbit-ceres-zoom-min-desktop.png`
  (clipping resolved only by losing the close-focus view entirely).
- Evidence (mobile): `orbit-ceres-clipped-mobile.png` — same right-edge clipping pattern.
- This directly contradicts the code's own stated intent for `CLOSE_FOCUS_BODY_IDS`
  (`OrbitSandbox.tsx`, around the `CLOSE_FOCUS_BODY_IDS` export): "so a child can actually see
  the tiny body they picked." As observed, the child instead sees an oversized, edge-clipped
  sphere by default.

**3. "Zoom In" toolbar control is inert (already disabled) for Saturn and Neptune from the
moment either body is selected — pressing it has no available effect.**
- Route/surface: Orbit lab, Desktop 1440×900, Saturn and Neptune.
- Observed via instrumented test: on cold load and after every switch-back cycle, the Zoom In
  button's disabled state was already `true` before any click was attempted (0 successful clicks
  possible in a 30-attempt loop) for both Saturn and Neptune. Ceres, by contrast, accepted 2 Zoom
  In clicks before disabling (it has a much closer floor). Zoom Out worked normally for all three
  bodies (38–45 clicks before hitting the ceiling).
- This is a knock-on effect of finding #2's mechanism in reverse: Saturn's ring-safety floor
  (`DEFAULT_CAMERA_DISTANCE`) equals the initial `cameraDistance` state, so the Zoom In button's
  `zoomInDisabled = cameraDistance <= zoomInFloor` check is true from first paint for any
  non-close-focus body. A learner selecting Saturn or Neptune and trying to zoom in for a closer
  look gets no visible response from that control at all — no cause/effect feedback.
- Evidence: `orbit-saturn-zoom-max-desktop.png` is pixel-for-pixel the same framing as
  `orbit-saturn-cold-load-desktop.png` (0 zoom-in clicks landed); same pattern for
  `orbit-neptune-zoom-max-desktop.png` vs `orbit-neptune-cold-load-desktop.png`.
- Toolbar itself remains visible and the button is legibly greyed-out/disabled (not a broken
  render), so this is a functional/UX gap rather than a rendering bug.

## P2 findings

**4. Zooming out to the maximum distance renders every body as a barely-distinguishable dot.**
- Route/surface: Orbit lab, Desktop 1440×900, all three bodies at max zoom-out.
- Observed: at the zoom-out ceiling the whole solar system collapses to a tiny cluster of dots
  near screen center — not broken/empty (no clipping, camera doesn't fly through geometry, stays
  centered), but not a very useful end state for a learner either.
- Evidence: `orbit-saturn-zoom-min-desktop.png`, `orbit-neptune-zoom-min-desktop.png`,
  `orbit-ceres-zoom-min-desktop.png`.
- Scored P2 rather than P1 because the task's zoom-bounds check specifically asks for "does not
  clip through geometry / does not zoom into an empty or broken view" — this passes that bar; it's
  a legibility/polish note, not a broken camera clamp.

## What passed cleanly

- **No console errors or page errors** for any of the three bodies across cold load, switch-back
  cycles, or zoom extremes. Only benign warnings were seen: `THREE.Clock` deprecation notice and
  repeated `GPU stall due to ReadPixels` performance warnings (driver-level, not app-caused,
  present for every body).
- **Cold loads (fresh `page.goto`, then select)** for all three bodies rendered a populated,
  non-blank scene with the Sun, 9 planets, and Ceres all visible, textured, and orbiting.
- **Switch-away/switch-back x2** for all three bodies: no flicker, no duplicate/ghost models, no
  visible performance degradation across repeated selection cycles observed in the captured
  frames. Saturn and Neptune re-framed correctly on return each time (aside from the pre-existing
  clipping noted in findings #1/#2, which was present identically on every visit, not introduced
  or worsened by the switch cycle itself).
- **Toolbar controls** (`Rotate`, `Pause/Play`, `Isolate`, `Compare`, `Zoom In`, `Zoom Out`,
  `Fullscreen`, `More`, `Reset`) stayed visible and reachable throughout every scenario above,
  including at the zoom extremes and on both viewports. `Section` (cross-section) is
  intentionally disabled for this lab (no `onToggleCrossSection` handler passed in) — not a
  defect, this lab doesn't implement that tool.
- **Instruction banner vs. toolbar/scene overlap**: checked at both viewports. On mobile the
  banner ("Orbit Sandbox · click a planet · sizes and distances compressed for view") sits
  clearly below the toolbar rail with a visible gap and above the default-selected Earth's
  hotspot labels, no overlap (`orbit-banner-overlap-mobile-default.png`,
  crop-verified). On desktop the banner sits at the very top of the stage, to the right of the
  narrow left-side toolbar rail, with no horizontal or vertical overlap with either the toolbar
  or the default Earth's labels (`orbit-banner-fresh-earth-desktop.png`, captured pre-interaction
  so the banner is still shown). Because both `selectPlanet()` and any canvas pointer-down
  dismiss the banner immediately, a learner can never end up with the banner visible
  simultaneously with a *non-default* selected body (e.g. Saturn) on screen — so the
  ring-vs-banner overlap scenario Wave 12 previously flagged is structurally avoided.
- **No internal QA/debug language** observed in any captured UI text (button labels, panel copy,
  facts, banner text all read as finished learner-facing copy).

## Unproven / not covered

- Did not test touch-drag/pinch-zoom gestures specifically (only toolbar Zoom In/Out buttons and
  native OrbitControls' `minDistance`/`maxDistance` via those buttons) — mouse-wheel/native pinch
  zoom bounds were not independently exercised.
- Did not test Tablet 1024×768 (out of this scope's required viewport list).
- Did not test the "Investigate motion" panel's Motion/Mission tabs, distance-override slider, or
  Compare modal for Saturn/Neptune/Ceres specifically (out of this scope's checklist — that
  panel's general behavior was covered by other Wave 14 reviewers per the coordinator's task
  split).
- The transient "Loading solar system… 100%" skeleton text was seen faintly ghosted behind the
  rendered scene in one mobile screenshot taken ~1.5s after `domcontentloaded`
  (`orbit-loading-skeleton-fade-transient-mobile-crop.png`); a recheck at +6s confirmed it fully
  fades out and does not persist — noting this only as a transient capture artifact, not a
  defect, and not counted in the findings above.
- Did not attempt to reproduce finding #1 (Saturn mobile clipping) at intermediate viewport
  widths to bound exactly where the aspect-ratio threshold sits — only confirmed present at
  390×844 and absent at 1440×900.
- Quality-bar comparison to Anatomy Atelier / the app's strongest Space-lab work is a judgment
  call, not a pixel measurement: framing, toolbar, and copy quality all matched that bar except
  for the two clipping bugs and the inert Zoom In control above, which fall short of it.
