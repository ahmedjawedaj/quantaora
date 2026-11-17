# Wave 22 Visual QA — Moons Lab (Enceladus label-declutter regression check)

Route: `http://127.0.0.1:5174/app/labs/moons` (source: `src/routes/MoonsLab.tsx`,
`src/components/explorer/MoonViewer.tsx`, `src/components/explorer/MoonModel.tsx`,
`src/data/moons.ts`)
Reviewer: Wave 22 reviewer, one of two parallel/independent reviewers (Moons scope only).
Tooling: standalone Playwright/Chromium instance, own process, own profile dir
(`/tmp/wave22-moons/`), scripts `script.js` (main run), `script2-mobile-verify.js` /
`script3-diagnose.js` / `script4-zindex.js` (follow-up diagnostics). Not the shared MCP browser —
no risk of colliding with the other concurrent reviewer.
Viewports: desktop 1440x900 (primary, required — 5 fresh loads + 5 camera drags), mobile 390x844
(smoke).

Server reachability: `curl -o /dev/null -w '%{http_code}'` returned `200` before this run started
(pre-verified by the harness) — app reachable, not a blocker.

## Scope note

This wave's assignment: determine whether the Wave 21 rewrite (`MoonModel.tsx`'s "deterministic,
single-pass, stage-aware layout," see its own in-file comment block) actually holds under repeated
stress for Enceladus's `tiger-stripes` / `south-polar-geysers` hotspot pair — the same pair Wave 16
found visually overlapping and illegible. This is a fresh, independent measurement pass, not a
re-confirmation of Wave 16's conclusions.

**Result: the regression is still present, in two distinct forms on desktop, plus a newly-found
and more severe correctness bug on mobile that Wave 16 explicitly did not find (Wave 16 confirmed
tapping either dot still opened the correct content — that is no longer true).**

---

## Findings

### P0 — Mobile: tapping "Tiger Stripes" opens the wrong hotspot's content ("South Polar Geysers")

- **Route/surface**: Moons lab, Enceladus, mobile 390x844, labels on, default framing (no drag
  needed).
- **What's wrong**: The two hotspots' 44×44px tap targets (`button[aria-label="View Tiger
  Stripes"]` and `button[aria-label="View South Polar Geysers"]`, each centered on its own 3D dot)
  overlap on screen. `South Polar Geysers` is later in DOM order (it's the second hotspot in
  `src/data/moons.ts`'s `enceladus.hotspots` array) and sits on top in the overlapping region, so
  a tap anywhere near Tiger Stripes' own dot — including its exact geometric center — is
  intercepted by the South Polar Geysers button instead.
- **Reproduced three independent ways**, all in agreement:
  1. Playwright's `locator('button[aria-label="View Tiger Stripes"]').click({ force: true })`
     (`script2-mobile-verify.js`) → DetailPanel opened with `h2` text `South Polar Geysers` and
     "Where it belongs" text `South Polar Geysers → Enceladus → Orbits Saturn → Moons` — not
     Tiger Stripes.
  2. `document.elementFromPoint(cx, cy)` at Tiger Stripes' own measured center
     (`cx: 212.63, cy: 367.10`, from its own `getBoundingClientRect()`) returns the **South Polar
     Geysers** button, not the Tiger Stripes button (`elementFromPointIsThisButton: false`,
     `elementFromPointClosestButtonAriaLabel: "View South Polar Geysers"`) — confirmed via
     `script3-diagnose.js`, independent of any Playwright locator/actionability behavior.
  3. A raw `page.mouse.click(212.63, 367.10)` (Tiger Stripes' exact center, no locator API
     involved at all) also opened `South Polar Geysers` (`h2s: ["Moons","South Polar Geysers"]`).
  - Exact overlapping rects at the moment of the click (mobile 390x844, default framing):
    - `Tiger Stripes` button: `top 344.21, bottom 389.99, left 189.73, right 235.52` (center
      `212.63, 367.10`)
    - `South Polar Geysers` button: `top 334.77, bottom 380.28, left 213.32, right 258.83`
      (center `236.08, 357.52`)
    - These two 45.5–45.8px squares overlap by roughly 22px horizontally and 46px vertically —
      Tiger Stripes' own center point falls inside South Polar Geysers' box.
  - As a direct consequence, tapping the button now labeled `View South Polar Geysers` right
    afterward does not open South Polar Geysers either — because `activeHotspotId` is already
    `'south-polar-geysers'` (set by the mis-click above) and `MoonsLab.tsx`'s
    `onSelectHotspot={(id) => setActiveHotspotId((cur) => (cur === id ? null : id))}` toggles it
    back off, closing the panel to the Enceladus overview instead of opening anything.
- **Screenshot evidence**:
  - `mobile-detailpanel-tiger-stripes-scrolled.png` — DetailPanel scrolled into view immediately
    after tapping the Tiger Stripes dot: heading reads **"South Polar Geysers"**, body text "More
    than 100 individual jets of water ice and vapor erupting from the tiger stripe fractures…"
    (South Polar Geysers' authored description from `src/data/moons.ts`, not Tiger Stripes').
  - `mobile-detailpanel-south-polar-geysers-scrolled.png` — after the next tap (on the South Polar
    Geysers button), the panel is back to the **Enceladus overview** (no hotspot open at all),
    confirming the toggle-off side effect described above.
  - `mobile-labels-on-enceladus.png` — shows the two dots' visual proximity at default framing
    (the two markers nearly touch just left of the caption pill's "Cratered Northern…" pill).
- **Assessment**: this is worse than Wave 16's finding. Wave 16 explicitly noted "tapping either
  dot still opens the correct hotspot in the detail panel — this is a label legibility/declutter
  bug, not a broken interaction" and scoped its finding to P1 on that basis. That is no longer
  true: tapping Tiger Stripes now reliably surfaces South Polar Geysers' facts under a "South
  Polar Geysers" heading, and the reverse tap silently closes the panel instead of opening the
  correct one. A child following the spec's "Touch it → Name it → Explain it" flow (`CLAUDE.md`
  content hierarchy) would read the wrong structure's name and function. This is a functional
  correctness bug, not merely a visual-declutter one — hence P0.

### P1 — Desktop 1440x900, 5/5 fresh loads: labels overlap each other AND render hidden behind the caption pill

- **Route/surface**: Moons lab, Enceladus, desktop 1440x900, labels on, default framing, no drag.
- **What's wrong**: On every one of 5 independent fresh-context loads, `Tiger Stripes` and `South
  Polar Geysers` labels overlap each other on both axes, and both labels' rects fall inside the
  bottom caption pill's rect (`[data-moon-caption-pill]`) — which shares the caption pill's `z-10`
  stacking value and is later in DOM order (see root-cause note below), so the caption pill
  visually covers the labels. In every cold-load screenshot, neither "Tiger Stripes" nor "South
  Polar Geysers" text is legible anywhere on screen — only the other two (non-colliding) Enceladus
  labels ("Cratered Northern Terrain"/"Smooth Ice Plains" depending on default rotation) render
  normally.
- **Bounding-box evidence** (`getBoundingClientRect()`, desktop 1440x900, default framing, values
  nearly identical across all 5 fresh-context loads — sub-pixel differences are auto-rotate phase
  noise from the ~500ms it takes to select Enceladus and open the More menu each run):

  | Run | Tiger Stripes rect (t/b/l/r) | South Polar Geysers rect (t/b/l/r) | overlapX | overlapY | hits caption pill |
  |---|---|---|---|---|---|
  | 1 | 672.82 / 695.84 / 636.52 / 723.11 | 678.53 / 701.26 / 643.38 / 771.35 | 79.73px | 17.32px | both: yes |
  | 2 | 672.81 / 695.85 / 636.02 / 722.64 | 678.56 / 701.32 / 643.06 / 771.15 | 79.58px | 17.29px | both: yes |
  | 3 | 672.80 / 695.84 / 636.07 / 722.68 | 678.55 / 701.31 / 643.09 / 771.17 | 79.59px | 17.28px | both: yes |
  | 4 | 672.80 / 695.84 / 635.91 / 722.54 | 678.56 / 701.33 / 642.98 / 771.09 | 79.55px | 17.28px | both: yes |
  | 5 | 672.80 / 695.83 / 636.37 / 722.96 | 678.53 / 701.27 / 643.28 / 771.29 | 79.68px | 17.31px | both: yes |

  - Caption pill rect (constant across runs, desktop): `top 673.13, bottom 705, left 260, right
    1080`. Both labels' `top`/`bottom` fall almost entirely inside that vertical band.
  - Stage rect (constant): `top 64, bottom 721, left 260, right 1080` — both labels remain fully
    *contained within the stage* in this default-framing case (`tsContained`/`spgContained: true`
    all 5 runs); the failure here is occlusion by the caption pill and mutual overlap, not
    off-clip invisibility (see the drag section below for that failure mode).
  - Neither label ever intersected the toolbar rail (`tsHitsToolbar`/`spgHitsToolbar: false` all
    5 runs) — that constraint held.
- **Root cause (diagnosed, not fixed — read-only per this review's scope)**: `script4-zindex.js`
  shows the Html-portal `<div>` wrapping each hotspot marker gets `z-index: 10` at close camera
  distance (from drei's `zIndexRange={[10, 0]}` prop in `MoonModel.tsx`'s `HotspotMarker`), and
  `[data-moon-caption-pill]` (`MoonsLab.tsx`) is a plain `absolute` div also computed at
  `z-index: 10`. With equal z-index, CSS stacking falls back to DOM order, and the caption pill
  div is rendered after `<MoonViewer>` in `MoonsLab.tsx`'s JSX, so it wins the tie and paints over
  the label whenever their rects overlap in screen space — exactly the observed behavior.
- **Screenshot evidence**: `desktop-coldload-1.png` through `desktop-coldload-5.png` — in every
  one, only one Enceladus hotspot label ("Smooth Ice Plains" or similar, depending on that run's
  auto-rotate phase at the 3s screenshot mark) is legible; no "Tiger Stripes" or "South Polar
  Geysers" text is visible anywhere in any of the 5 screenshots, despite both being
  `display:block`/`opacity:1` per the DOM.

### P1 — Desktop 1440x900, 5/5 camera drags: labels pushed fully outside the clipped stage, becoming invisible

- **Route/surface**: Moons lab, Enceladus, desktop 1440x900, labels on, after a south-pole-ward
  drag gesture (mouse down at stage center → 12-step move → up, ~3s settle). One page reused
  across all 5 drags (fresh load once, then 5 sequential drags on the same settled state, each
  followed by its own 3s wait and measurement — documented explicitly per the task's either/or
  allowance).
- **What's wrong**: `[data-lab-stage]` has `overflow: hidden` (`src/index.css` line 122-124), so
  anything positioned outside its rect is fully invisible, not just crowded. In all 5 drag
  iterations, **both** labels' rects extend past the stage's bottom edge — the exact "off-clip"
  failure mode the Wave 21 rewrite's own in-file comment (`MoonModel.tsx`) says it was written to
  eliminate ("a label rendered past this rect is invisible, not just crowded... the final rect is
  always inside the safe rectangle by construction"). That invariant does not hold under
  measurement.
- **Bounding-box evidence** (stage rect constant: `top 64, bottom 721, left 260, right 1080`):

  | Drag | Vector (dx,dy) | Tiger Stripes rect (t/b/l/r) | South Polar Geysers rect (t/b/l/r) | overlapX | overlapY | contained in stage | past stage bottom by |
  |---|---|---|---|---|---|---|---|
  | 1 | (0, −220) | 774.40/802.55/659.81/765.63 | 745.64/772.60/648.87/800.61 | 105.82px | −1.80px (no overlap) | both: no | Tiger Stripes 81.5px |
  | 2 | (80, −180) | 740.20/767.71/643.13/746.56 | 709.64/735.98/577.19/725.39 | 82.26px | −4.23px (no overlap) | both: no | Tiger Stripes 46.7px |
  | 3 | (−80, −180) | 734.61/762.02/633.22/736.25 | 707.08/733.36/558.01/705.91 | 72.69px | −1.25px (no overlap) | both: no | Tiger Stripes 41.0px |
  | 4 | (0, −260) | 693.91/732.03/577.88/711.29 | 710.54/747.44/474.08/663.41 | 85.53px | 21.49px (overlap) | both: no | South Polar Geysers 26.4px |
  | 5 | (40, −240) | 735.94/763.36/536.62/639.74 | 746.23/773.26/429.48/581.64 | 45.02px | 17.14px (overlap) | both: no | South Polar Geysers 52.3px |

  - **All 5/5 drags**: neither label is fully contained in the stage rect — at least one label's
    bottom edge is clipped off-screen by 26px–82px, meaning that label is 100% invisible to the
    user for as long as the camera stays in that orientation (not merely low-contrast or
    crowded — literally not rendered, per `overflow: hidden`).
  - **2/5 drags** (iterations 4 and 5) additionally show the surviving/visible portions of the two
    labels overlapping each other on top of being off-clip — the worst of both failure modes at
    once.
  - **3/5 drags** (iterations 1–3) have no mutual overlap (`overlapY` negative), but that's because
    one or both labels have already been pushed so far past the clip boundary that they no longer
    occupy the same visible band — not evidence the declutter pass is working correctly.
  - Neither label ever intersected the toolbar rail or (in 4/5 runs) the caption pill during drags;
    run 4 did additionally clip into the caption pill rect (`tsHitsCaption: true`).
- **Screenshot evidence**: `desktop-drag-1-settled.png` through `desktop-drag-5-settled.png` — in
  every screenshot, "Cratered Northern Terrain" and/or "Smooth Ice Plains" (the other two
  Enceladus hotspots) are legible, but neither "Tiger Stripes" nor "South Polar Geysers" text
  appears anywhere in any of the 5 screenshots — consistent with the off-clip measurement above.

### PASS — Mobile 390x844, default framing: both labels visible, contained, non-overlapping

- **Route/surface**: Moons lab, Enceladus, mobile 390x844, labels on, default framing, fresh load.
- **Verification**: `getBoundingClientRect()` measurement and screenshot both confirm all four
  Enceladus hotspot labels stack cleanly, top to bottom: "Smooth Ice Plains," "South Polar
  Geysers," "Tiger Stripes," "Cratered Northern Terrain," with visible gaps between each pill and
  the bottom caption pill.
  - `Tiger Stripes`: `top 329.82, bottom 355.26, left 125.93, right 214.98`
  - `South Polar Geysers`: `top 298.30, bottom 323.53, left 108.21, right 237.66`
  - `overlapX: 89.06px, overlapY: −6.29px` → **no overlap** (negative Y overlap = there is an
    actual ~6.3px vertical gap between the two pills).
  - Stage rect: `top 64, bottom 452.23, left 0, right 390`. Both labels fully contained
    (`tsContained`/`spgContained: true`).
  - Neither label intersects the toolbar rect (`top 76, bottom 122, left 12, right 378`) or the
    caption pill rect (`top 416.48, bottom 440.23, left 0, right 390`) —
    `tsHitsToolbar`/`spgHitsToolbar`/`tsHitsCaption`/`spgHitsCaption`: all `false`.
- **Screenshot evidence**: `mobile-labels-on-enceladus.png` — all four labels clearly legible as
  distinct pills, no visual overlap.
- **Caveat**: this PASS is about label *legibility/placement* only. The tap-target collision (P0
  above) exists at this exact same camera framing — the labels are legible, but the two dots'
  clickable hit-areas still overlap underneath them.

---

## Console / page errors

Captured via `page.on('console')` / `page.on('pageerror')` across all contexts (5 cold loads, 1
drag session, 1 mobile session, plus the follow-up diagnostic scripts). No `pageerror` (uncaught
exception) events were observed in any run. De-duplicated console output:

```
[console:debug] [vite] connecting...
[console:debug] [vite] connected.
[console:info] Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
[console:warning] THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[console:warning] [.WebGL-...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (repeated a few times per run, then "will no longer repeat")
```

None of the above are application errors — same as Wave 16's observation, these are Three.js
deprecation notices and WebGL driver performance messages, not exceptions, and appeared on both
desktop and mobile runs.

## Screenshots (all under `review-screenshots/wave22-2026-08-18/moons/`)

- `desktop-coldload-1.png` … `desktop-coldload-5.png` — 5 independent fresh-context loads,
  Enceladus, labels on, default framing, 3s settle.
- `desktop-drag-1-settled.png` … `desktop-drag-5-settled.png` — 5 sequential camera drags on one
  reused page, each with its own 3s settle before capture.
- `mobile-labels-on-enceladus.png` — mobile default framing, labels on, all four labels legible.
- `mobile-click-tiger-stripes.png` / `mobile-click-south-polar-geysers.png` — viewport-only
  captures immediately after each tap (toolbar "Isolate" state visible; DetailPanel content is
  below the fold in these two, see the `-scrolled` pair below for the actual panel content).
- `mobile-detailpanel-tiger-stripes-scrolled.png` — DetailPanel scrolled into view after tapping
  Tiger Stripes: shows the wrong heading, "South Polar Geysers."
- `mobile-detailpanel-south-polar-geysers-scrolled.png` — DetailPanel scrolled into view after the
  next tap (on the South Polar Geysers button): shows the Enceladus overview (panel closed, not
  opened), confirming the toggle-off side effect.

## Summary

- **P0 (1)**: Mobile — tapping Tiger Stripes' own hotspot dot opens South Polar Geysers' content
  instead (overlapping 44×44px tap targets, later-DOM-order element wins), and the follow-up tap on
  South Polar Geysers closes the panel instead of opening it. Confirmed via three independent
  methods (Playwright locator click, raw `elementFromPoint` inspection, raw coordinate
  `page.mouse.click`). This is a functional/content-correctness regression beyond what Wave 16
  found (Wave 16 confirmed taps still opened correct content; that no longer holds).
- **P1 (1)**: Desktop, default framing — Tiger Stripes / South Polar Geysers labels overlap each
  other (~79.6px × ~17.3px) **and** both render hidden behind the bottom caption pill (equal
  `z-index: 10`, caption pill wins DOM-order tiebreak) in 5/5 fresh loads; neither label is
  legible in any of the 5 cold-load screenshots.
- **P1 (1)**: Desktop, after camera drag — in 5/5 drags, at least one of the two labels is pushed
  26px–82px past the stage's clipped bottom edge and is therefore fully invisible
  (`overflow: hidden`), reproducing the exact off-clip failure the Wave 21 rewrite's own code
  comments claim to have eliminated; 2/5 of those drags additionally show mutual label overlap on
  top of the off-clip clipping.
- **PASS**: Mobile, default framing — all four Enceladus labels (including the Tiger
  Stripes/South Polar Geysers pair) are legible, contained within the stage, and do not overlap
  each other or the toolbar/caption pill, per direct DOM measurement.
- **PASS**: No console `pageerror` events on any of the 8 browser contexts used across this review.

**Net assessment**: the Wave 21 fix does not hold under repeated stress. It regressed in a new,
more serious way on mobile (wrong content opens on tap — P0) while the desktop-side overlap/off-
clip problems Wave 16 first found are both still present, just manifesting slightly differently
(hidden-behind-caption-pill at default framing; off-clip-and-invisible after any south-pole-ward
drag) rather than as the simple on-top-of-each-other smear Wave 16 screenshotted.
