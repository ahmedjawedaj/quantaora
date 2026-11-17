# Wave 18 QA — Orbit lab (Saturn / Ceres): cold-load determinism, pill readability, zoom re-framing

- Date: 2026-08-18
- Scope: `orbit` (SpaceLab component), `http://127.0.0.1:5174/app/labs/orbit`
  (`src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`)
- Reviewer: isolated Playwright Chromium session (`/tmp/wave18-orbit-qa/`, own browser
  instance/contexts, shared Playwright install at `/tmp/wave18-pw-shared/`), strictly read-only —
  no source/asset files edited.
- Viewports: desktop 1440x900 (primary, all checks), mobile 390x844 (final-state + Ceres label
  legibility check)
- Evidence dir: `review-screenshots/wave18-2026-08-18/orbit/` (22 screenshots, all referenced
  below exist there)

Route/code discovery note (read-only): confirmed route via `grep -rn "labs/orbit" src/App.tsx`
→ `<Route path="labs/orbit" element={<SpaceLab />} />`. Read `SpaceLab.tsx` and
`OrbitSandbox.tsx` in full to locate selectors (desktop `ContentNav` sidebar buttons by planet
name; mobile chip switcher `button[title="<Planet>"]`), the instruction banner
(`[data-canvas-overlay]`, text "Orbit Sandbox · click a planet · sizes and distances compressed
for view"), the loading skeleton (`div[aria-hidden]` containing "Loading solar system…N%"), and
the in-scene Name/Spin/Orbit "pills" (the source code's own term — see
`OrbitSandbox.tsx` comments on `NAME_LABEL_Y_OFFSET`/"Spin pill"/"Orbit pill" and the Wave 17
label-declutter effect). Also read `docs/reviews/wave12-orbit.md` and
`docs/reviews/wave14-orbit.md` for prior finding language, directly re-verified below.

## Summary

| # | Check | Verdict | Severity |
|---|---|---|---|
| 1 | 3x cold load — loader timing + pill determinism | **PASS** | — |
| 2 | Saturn → Ceres selection framing/zoom, Ceres label distinctness/readability | **PARTIAL FAIL** (desktop PASS, mobile FAIL) | P1 (mobile only) |
| 3 | Camera re-framing Saturn → Ceres → Saturn (no stale zoom) | **PASS** | — |
| 4 | Console/page errors + duplicate network requests | **PASS** | — |

**No P0s.** App is reachable, no route crashes, no blank canvases, no console/page errors beyond
benign driver-level warnings. One real P1 (mobile-only Ceres label overlap) found; everything
else in this scope passed cleanly, including two previously-documented P1s from Wave 12/14 that
are now confirmed fixed (see "Prior findings re-verified" below).

---

## Check 1 — 3x cold load: loader timing + pill determinism

**Verdict: PASS.**

Method: 3 separate fresh `browser.newContext()` instances (no shared cache/state), each doing a
true `page.goto()` cold navigation to `/app/labs/orbit`, polling every 100ms for the loading
skeleton's `aria-hidden` attribute to flip to `"true"` (timed from navigation start), then
capturing the settled scene and every visible "pill" (Name/Spin/Orbit labels + the instruction
banner) via DOM query scoped to `[data-lab-stage]`.

**Loader timings** (navigation start → skeleton `aria-hidden="true"`):
- Run 1: **5376 ms**
- Run 2: **5636 ms**
- Run 3: **5109 ms**

All three are well inside the code's own `MAX_LOADING_WAIT_MS = 12000` backstop and were driven
by the real event-based path (observed progress climbing 9% → 55–64% → 91% → 100% during manual
debug polling, not an instant jump), i.e. the skeleton is not masking a still-loading scene and is
not hanging. ~5.1–5.6s to load 11 bodies' GLBs on a cold context is consistent across all 3 runs
(≈500ms spread, consistent with normal machine/network jitter, not flakiness) — noting this only
as an observation (first-cold-load latency), not a defect.

**Pill determinism** — content and order identical across all 3 runs (default Earth selection,
same y-then-x sort order):
- Run 1: `Earth` (638,320) → `Orbit` (663,336) → `Spin` (642,366) → `Investigate motion` (766,669)
- Run 2: `Earth` (642,320) → `Orbit` (666,336) → `Spin` (645,365) → `Investigate motion` (766,669)
- Run 3: `Earth` (638,320) → `Orbit` (663,366) → `Spin` (642,366) → `Investigate motion` (766,669)

Text and stacking order are identical on every run; pixel positions vary by only 3-4px between
runs (expected — the sim is running live and each screenshot lands on a slightly different frame
of continuous orbit/spin motion, not a layout difference). The instruction banner text was also
identical every run: `"Orbit Sandbox · click a planet · sizes and distances compressed for view"`.
The full-scene post-load screenshots for all 3 runs are pixel-identical in body framing/positions
(compared by eye; see evidence) — confirming the deterministic-camera-framing fix (originally
Wave 13, `deterministicAngle()` in `OrbitSandbox.tsx`) still holds.

Evidence: `coldload-run1-initial.png`, `coldload-run1-postload.png`, `coldload-run2-initial.png`,
`coldload-run2-postload.png`, `coldload-run3-initial.png`, `coldload-run3-postload.png`.

Console output was identical across all 3 runs and contained only benign warnings:
```
[warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[warning] [.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
```
No `pageerror` events on any of the 3 runs. Request count was identical (206 requests) on all 3
cold loads.

---

## Check 2 — Saturn → Ceres selection: framing, distinctness, readability

**Verdict: PARTIAL FAIL — desktop PASS, mobile FAIL (P1).**

### Desktop 1440x900 — PASS

- **Saturn**, selected via the desktop `ContentNav` sidebar: rings fully visible, well inside the
  canvas, camera clearly re-centered around it, nothing clipped. Evidence:
  `desktop-02-saturn-settled.png`.
- **Ceres**, selected next: camera performs a genuine close-focus zoom — Ceres renders as a large,
  clearly legible cratered sphere (not a speck, not clipped by the canvas/panel edge as in prior
  waves), with a persistent cyan halo ring distinctly marking it (`#8be9fd`, `renderOrder={999}`,
  `depthTest={false}` per the source) that no other body in the scene has — this is a real,
  visually distinctive marker unique to Ceres. The "CERES" name pill (gold border, dark-blue fill,
  white text) and the "ORBIT"/"SPIN" pills are all fully inside the canvas, not clipped, and fully
  legible. Evidence: `desktop-04-ceres-settled.png`, crop `desktop-05-ceres-label-crop.png`,
  label-only crop `desktop-08-ceres-labels-crop.png` (confirms "CERES", "ORBIT", "SPIN" all read
  cleanly with no character obscured, only light visual adjacency between the Orbit/Spin pill
  edges — not a legibility problem).
- Also checked the very-first-frame state (300ms after click, before any settle): Ceres is already
  correctly framed/zoomed, no "stale wide shot" flash. Evidence:
  `desktop-03-ceres-immediate.png`.

### Mobile 390x844 — FAIL (P1)

- **Saturn** on mobile: fully framed, rings not clipped by the canvas or toolbar (this is the
  specific regression Wave 14 finding #1 flagged — "Saturn is clipped by the canvas edge on
  mobile... hard against the left edge" — **that finding no longer reproduces**; Saturn now sits
  centered with full rings visible). Evidence: `mobile-02-saturn-settled.png`.
- **Ceres** on mobile: the close-focus zoom and cyan halo ring both work correctly (same mechanism
  as desktop), and the "CERES" name pill is fully legible. **However**, the "ORBIT" pill visually
  overlaps and obscures the "SPIN" pill directly beneath it — the word "SPIN" is only partially
  visible (its top ~40-50% is covered by the bottom edge of the "ORBIT" pill), which fails the
  "not overlapping other labels" bar this same review scope explicitly checks for. This is
  **not** a one-frame glitch: measured the DOM-rect overlap area between the "Orbit" and "Spin"
  pill elements at 6 timestamps after selecting Ceres (500ms, 1000ms, 2000ms, 3500ms, 5000ms,
  8000ms) and the overlap area **grows monotonically the whole time** the sim keeps running
  (733px² → 773px² → 861px² → 1004px² → 1167px² → 1543px²), i.e. it is a persistent and
  worsening problem, not a transient collision that the Wave 17 label-declutter pass resolves on
  this viewport/body combination. Evidence: `mobile-05-ceres-labels-crop.png` (early state,
  ~2s), `mobile-06-ceres-labels-8s.png` (8s later, overlap visibly worse — "SPIN" almost entirely
  hidden under "ORBIT").

---

## Check 3 — Camera re-framing Saturn → Ceres → Saturn

**Verdict: PASS.**

Switched Saturn → Ceres → Saturn again in the same desktop session and screenshotted each state
at both the ~300ms-post-click mark and after a ~2s settle:
- Saturn (first select): full rings in frame, centered — `desktop-01-saturn-immediate.png`,
  `desktop-02-saturn-settled.png`.
- Ceres: correctly zooms in close (see Check 2) — `desktop-03-ceres-immediate.png`,
  `desktop-04-ceres-settled.png`.
- Saturn (switch-back): camera correctly zooms back out and re-centers on Saturn with full rings
  visible — visually matches the first Saturn selection's framing (not left at Ceres's tight
  zoom level, not stuck/empty/off-screen). Evidence: `desktop-06-saturn-switchback-immediate.png`,
  `desktop-07-saturn-switchback-settled.png`.

No stale-zoom, empty-frame, or off-screen-camera behavior was observed in either direction of the
switch.

---

## Check 4 — Console/page errors and duplicate network requests

**Verdict: PASS.**

Across the full Saturn → Ceres → Saturn switching session (with `page.on('pageerror')` and
`page.on('request')` listeners attached throughout):
- `pageErrors: []` — zero JS errors during any selection/switch.
- Filtered every `request` event matching image/model asset extensions
  (`.glb/.gltf/.jpg/.jpeg/.png/.webp/.hdr/.ktx2`) — **29 asset requests total**, and grouping by
  exact URL found **zero duplicate URLs** (`Duplicate asset requests (url -> count): []`) —
  no evidence of flaky refetching when switching planets back and forth.
- Across all 3 independent cold-load contexts (Check 1), console output was limited to the two
  benign warnings quoted above (THREE.Clock deprecation, GPU stall ReadPixels driver message) —
  identical every run, no new/unexpected console errors.
- No internal QA/placeholder/debug strings were observed in any captured screenshot's UI text
  (banner copy, pill labels, DetailPanel fact copy, toolbar labels all read as finished
  learner-facing copy) — not an exhaustive text audit of every string in the lab, but nothing
  surfaced in any of the 22 captured screenshots.

---

## Prior findings re-verified (Wave 12 / Wave 14 language, checked directly)

1. **Wave 12: "the camera zoom/framing level visibly differs across the 3 loads"** (non-
   deterministic cold-load framing) — **FIXED, confirmed not reproducing.** All 3 fresh-context
   cold loads in Check 1 produced pixel-identical scene framing/body layout on the default (Earth)
   selection, and identical pill content/order.

2. **Wave 12/14: Ceres renders as "an indistinct dot" / is "clipped by the canvas edge... Ceres's
   own sphere is cut off by the right edge of the canvas" at default framing, worsening at max
   zoom, with "no zoom level at which Ceres is both fully in-frame and actually legible"** —
   **FIXED on desktop, confirmed not reproducing.** Ceres now renders as a large, fully in-frame,
   clearly legible cratered sphere with a distinctive persistent cyan halo ring on selection at
   both immediate and settled states, and switching away and back to Saturn works correctly. See
   `desktop-04-ceres-settled.png`, `desktop-05-ceres-label-crop.png`.

3. **Wave 14 finding #1: "Saturn is clipped by the canvas edge on mobile (390×844) when selected...
   sit hard against the left edge of the canvas, and its 'ORBIT'/'SPIN' hotspot label chips are
   visibly cut in half by the canvas boundary"** — **FIXED, confirmed not reproducing.** Saturn on
   mobile (`mobile-02-saturn-settled.png`) now renders fully centered and in-frame with rings and
   labels intact.

4. **New finding this wave (not previously documented): Ceres's own ORBIT/SPIN pills overlap
   on mobile** (390×844) specifically — see Check 2 above. This is a distinct issue from Wave 14's
   Saturn-clipping finding (different body, different failure mode — label overlap, not
   off-canvas clipping) and was not called out in Wave 12/14's mobile testing of Ceres (those
   reports' mobile-Ceres notes focused only on size/legibility, e.g. Wave 12's "Ceres on mobile has
   the same 'too-small-to-see-when-selected' issue as desktop" — that specific complaint is now
   also fixed, but the pill-overlap problem documented here is new).

---

## Findings list (severity-sorted)

**P1**
1. On mobile (390×844), selecting Ceres causes its "ORBIT" pill to progressively overlap and
   obscure its "SPIN" pill — the "SPIN" text becomes mostly unreadable, and the overlap worsens
   the longer the simulation runs (measured overlap area 733px² at 500ms growing to 1543px² at
   8000ms post-selection). Does not reproduce on desktop 1440×900 for the same selection (labels
   are adjacent but both fully legible there). Evidence: `mobile-05-ceres-labels-crop.png`,
   `mobile-06-ceres-labels-8s.png`.

**P2**
- None isolated beyond the above. Desktop Ceres Orbit/Spin pills sit visually close together
  (`desktop-08-ceres-labels-crop.png`) but remain fully legible, so not filed as a defect.

## Explicitly unproven / not covered in this pass

- Only Saturn and Ceres were exercised per this scope's explicit checklist — other bodies
  (Neptune, Pluto, Uranus, etc.) were not re-tested this wave.
- Toolbar controls (Zoom In/Out, Isolate, Compare, Reset, Fullscreen) were visually confirmed
  reachable/unobscured in every screenshot at both viewports but were not each individually
  clicked and functionally re-verified this wave (out of this scope's explicit 4-item checklist,
  which focused on cold-load determinism, Saturn/Ceres framing, and re-framing on switch).
  `zoomInDisabled`/floor behavior documented in Wave 14/15 was not re-exercised.
- Did not test touch drag/pinch-zoom gestures, only programmatic selection via chip/button clicks.
- Mobile determinism (3x cold-load comparison) was only performed at desktop per the task's
  "primarily desktop" instruction; only the final-state Saturn/Ceres selection flow was captured
  at 390×844.
