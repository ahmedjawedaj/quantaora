# Wave 12 Visual QA — Plants Lab (PlantsLab)

- Date: 2026-08-18
- Route reviewed: `http://127.0.0.1:5174/app/labs/plants`
- Reviewer: read-only Playwright (own Chromium, isolated profile `/tmp/quantaora-wave12-plants-profile`)
- Viewports: desktop 1440x900, tablet 1024x768, mobile 390x844
- Corn maps to the "Seed" content component (`activeId === 'seed'`); flower maps to the
  "Flower" component (`activeId === 'flower'`). Both have a "See it grow (real 3D)" toggle
  that reveals a `Growth stage` range slider inside the "Tune plant" panel.
- Corn growth sequence has 4 real-3D stages: seedling → young stalk → taller stalk → tasseled
  (mature). Flower growth sequence has only **3** real-3D stages: bud → opening → full bloom
  (there is no 4th/seedling-equivalent stage for flower — flagged as unproven-against-spec
  below, not assumed to be a bug).
- Screenshots: `review-screenshots/wave12-2026-08-18/plants/` (47 PNGs; every stage × every
  viewport plus supporting states). Filenames cited below are relative to that directory unless
  noted otherwise.

## Console / page errors

Captured via `page.on('console', …)` and `page.on('pageerror', …)` across all three viewports,
through both growth-stage sequences. Verbatim, deduplicated by viewport:

```
[desktop] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[desktop] console.warning: [.WebGL-0x11c0052b400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[desktop] console.warning: [.WebGL-0x11c0052b400]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)

[tablet] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[tablet] console.warning: [.WebGL-0x114005b9200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[tablet] console.warning: [.WebGL-0x114005b9200]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)

[mobile] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[mobile] console.warning: [.WebGL-0x10400569800]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[mobile] console.warning: [.WebGL-0x10400569800]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
```

No `pageerror` events fired on any viewport. The only warnings are a benign upstream three.js
deprecation notice and headless/software-GPU `ReadPixels` performance messages from Playwright's
software WebGL — neither is app-code breakage. **No console errors observed** beyond these
warnings.

A separate text-content scan of all 9 plant components' rendered DOM (`document.body.innerText`)
for `lorem ipsum`, `TODO`, `FIXME`, `debug`, `test-id`, `stub`, and known internal part-ids
(`cp-grana`, `fl-pistil`, `lf-blade`, `rt-cap`, `ph-tube`, etc.) found **no matches** on any
component, at desktop viewport.

---

## Checklist results

### 1. Growth scrubbing (corn + flower, 4 viewports/stages)

**Corn (Seed component) — PASS**, real cause/effect confirmed at all 3 viewports. Scrubbing the
`Growth stage` slider (via keyboard Home + ArrowRight, since it's a native `<input type=range>`)
swapped the visible GLB mesh at every step, at every viewport — seedling → young stalk → taller
stalk → tasseled. Evidence: `plants-corn-seedling-{desktop,tablet,mobile}.png`,
`plants-corn-young-stalk-{desktop,tablet,mobile}.png`,
`plants-corn-taller-stalk-{desktop,tablet,mobile}.png`,
`plants-corn-tasseled-mature-{desktop,tablet,mobile}.png`. Stat rail's `Stage`/`Growth` labels
and the panel's "Growth stage N of 4" counter updated in sync with every step (e.g.
`plants-stat-rail-seed-desktop.png` shows `STAGE Shoot rises`, `NUTRIENTS 65%`, matching the
selected stage).

**Flower (Flower component) — PASS for the transitions that exist, but only 3 stages exist, not
"at least 4" as the checklist asked for.** Real 3D sequence is `bud → opening → full bloom`
(`growthStageModels.flower` in `src/data/generated/plants.ts` has exactly 3 entries). Scrubbing
those 3 stages does swap the mesh correctly at all 3 viewports — evidence:
`plants-flower-bud-{desktop,tablet,mobile}.png`, `plants-flower-opening-{desktop,tablet,mobile}.png`,
`plants-flower-full-bloom-{desktop,tablet,mobile}.png`. **Flagging as unproven/not-applicable**
rather than a bug: I could not test a 4th flower stage because the app only ships 3 for flower
(this is a content/asset-count fact, not something I can "fail" against a checklist expectation
that assumes 4 exist for both plants).

Corn and flower are visually distinct at their mature stage (tall green tasseled stalk vs. a
pink/purple bloom on a stem) — **PASS** on "not generic/repeated visuals between corn and
flower." See `plants-corn-tasseled-mature-desktop.png` vs. `plants-flower-full-bloom-desktop.png`.

### 2. Quantify visible canvas occupancy

- **Desktop (1440x900) — PASS**, good occupancy for mid/late stages. Mature corn stalk fills
  roughly 60–70% of the canvas height and is centered (`plants-corn-tasseled-mature-desktop.png`,
  `plants-stat-rail-seed-desktop.png`). Full-bloom flower is a bit smaller/higher in frame with
  more surrounding empty space than corn, but is not cropped or lost (`plants-stat-rail-flower-desktop.png`)
  — **P2**, minor imbalance, not a real occupancy problem.
- **Tablet (1024x768) — P1.** The 3-column row (left nav / canvas / right detail panel) is
  vertically squeezed because the full-width `BottomTray` (Lesson/Checkpoint/Experiment/
  Notebook/Real-world cards) sits below it at fixed height and the viewport is only 768px tall;
  measured canvas region is roughly 396×384px versus 540×451px on desktop. Even the fully
  visible mature stalk occupies a noticeably smaller absolute area than on desktop
  (`plants-stat-rail-seed-tablet.png`). See severity note under item 5 for the bigger tablet
  problem (panel occluding the model while scrubbing).
- **Mobile (390x844) — PASS for mid/mature stages**, model is a reasonable size and centered
  within the 56svh canvas strip when the Tune panel is closed (`plants-stat-rail-seed-mobile.png`,
  `plants-stat-rail-flower-mobile.png`). See item 3 for the seedling-specific failure.

### 3. Seedling / earliest-stage visibility

- **Model itself, zoomed in: legible.** Cropped/zoomed inspection of the corn seedling
  (desktop, no panel obstruction) shows a recognizable two-blade sprout shape — not blank, not a
  formless blob. Same for the flower bud (a dark green pointed sheath) — recognizable as a
  closed bud shape when zoomed.
- **In context, at full frame size: P2 on desktop.** Both the corn seedling and the flower bud
  are very small relative to the canvas — the seedling is a thin ~5% of canvas height and the
  bud similarly small — so at a normal glance (not zoomed) the canvas can look mostly empty.
  Evidence: `plants-corn-seedling-desktop.png`, `plants-flower-bud-desktop.png`.
- **P1 on mobile and tablet: the earliest stage is effectively invisible, not just small,
  because the "Tune plant" panel (which is the only place to reach the growth-stage slider)
  overlaps the same screen region the seedling/bud occupies.** On mobile
  (`plants-corn-seedling-mobile.png`, `plants-flower-bud-mobile.png`) the seedling/bud is
  entirely covered by the panel — zero pixels of plant visible above the panel's top edge. On
  tablet the same is true (`plants-flower-bud-tablet.png` — no plant visible at all; only a
  border edge). This is a direct **FAIL of the "seedling visibility" checklist item** on two of
  three viewports.

### 4. Stat rail / pills

**PASS on all three viewports**, when the Tune panel is closed. Chips (`MOLECULE`, `GROWTH`,
`STAGE`, `CONDITIONS`, `NUTRIENTS`, `3D corn stage` / `3D bloom stage`, etc.) are legible,
correctly updated per stage, and do not overlap the model:
- Desktop: `plants-stat-rail-seed-desktop.png`, `plants-stat-rail-flower-desktop.png` — full row
  fits without horizontal scrolling.
- Tablet: `plants-stat-rail-seed-tablet.png`, `plants-stat-rail-flower-tablet.png` — row is
  horizontally clipped/truncated (last chip cut off, e.g. `SEED —` with a 4th chip's edge just
  visible) but scrollable (`overflow-x-auto` by design) — **P2**, not a blocking issue, but worth
  noting the row is tighter than desktop.
- Mobile: `plants-stat-rail-seed-mobile.png`, `plants-stat-rail-flower-mobile.png` — same
  horizontally-scrollable pattern, legible, not overlapping the model.

### 5. Toolbar and panels — clipping / reachability

- **CanvasControls toolbar (rotate/pause/isolate/section/compare/zoom/full/more/reset) — PASS
  at all three viewports.** Fully visible, left-docked, no icons clipped or unreachable, at
  1440, 1024, and 390 widths (`plants-toolbar-desktop.png`, `plants-toolbar-tablet.png`,
  `plants-toolbar-mobile.png`, `plants-landing-desktop.png`, `plants-landing-mobile.png`).
- **"Tune plant" panel content is only partially visible without scrolling, with no visible
  scroll affordance (no scrollbar thumb, fade edge, or "more" hint) — P1 on mobile and tablet,
  P2 on desktop.** Measured directly via `scrollHeight`/`clientHeight` on the panel's scrollable
  container (`overflow-y-auto` div) for the Seed panel:
  - Desktop: clientHeight 507 / scrollHeight 655 → ~77% visible (only the trailing "Light:
    on/off" toggle is below the fold) — **P2**.
  - Tablet: clientHeight 295 / scrollHeight 851 → ~35% visible — germination/water/warmth/
    nutrients sliders and the "Compare growing conditions" buttons are below the fold with no
    visual cue more content exists. Confirmed reachable by mouse-wheel scroll
    (`plants-corn-panel-scrolled-tablet.png`) — so **not broken**, but a real discoverability
    gap — **P1**.
  - Mobile: clientHeight 201 / scrollHeight 655 → ~31% visible, same pattern, confirmed
    scrollable (`plants-corn-panel-scrolled-mobile.png`) — **P1**.
- **P1, tablet only: the open Tune plant panel visually occludes most of the 3D model for
  most growth stages**, which is the same interaction surface the user needs to watch while
  scrubbing. At 1024×768 the panel (12rem wide per the `lg` breakpoint rule in
  `src/routes/PlantsLab.tsx`) combined with the already-narrow canvas column (nav 260px + canvas
  + 360px-ish detail rail) leaves only a sliver of canvas outside the panel. Evidence:
  `plants-corn-young-stalk-tablet.png` (plant almost entirely hidden, only a few green pixels at
  the far-left edge visible), `plants-corn-taller-stalk-tablet.png` (same), `plants-flower-bud-tablet.png`
  (no plant visible at all). Only the largest/mature stage partially peeks out
  (`plants-corn-tasseled-mature-desktop.png` for comparison — desktop does NOT have this problem
  because the panel is right-docked at `xl:w-[22rem]` well clear of the model). This directly
  undermines "cause/effect legible" for the flagship growth-scrub interaction at tablet width.
  On mobile the same panel is bottom-anchored over a horizontally-full-width canvas, so mid/late
  stages remain partly visible above the panel (`plants-corn-taller-stalk-mobile.png`), but the
  seedling/bud stage is fully hidden as already noted in item 3.
- No panel content overflowed its rounded-border box or bled outside the container in any
  screenshot (i.e., the panel's own edges are always clean — the issue is what's occluded
  *outside* the panel, and what's below-the-fold *inside* it, not literal overflow/rendering
  breakage).

---

## Summary table

| # | Check | Desktop 1440×900 | Tablet 1024×768 | Mobile 390×844 |
|---|---|---|---|---|
| 1 | Growth scrubbing works (corn) | PASS | PASS | PASS |
| 1 | Growth scrubbing works (flower, only 3 stages exist) | PASS (3 stages) | PASS (3 stages) | PASS (3 stages) |
| 2 | Canvas occupancy | PASS (P2 flower slightly small) | P1 (squeezed row) | PASS |
| 3 | Seedling/bud visibility | P2 (small but legible) | P1 (hidden behind panel) | P1 (hidden behind panel) |
| 4 | Stat rail / pills | PASS | P2 (truncated row, scrollable) | PASS |
| 5 | Toolbar reachable | PASS | PASS | PASS |
| 5 | Tune panel — content below fold, no scroll affordance | P2 | P1 | P1 |
| 5 | Tune panel occludes model while scrubbing | PASS (no overlap) | P1 | PASS (mid/late stages only) |

**Worst severity found: P1** (no P0s — app was reachable throughout, no crashes, no blank
canvases, and every interaction tested produced a visible, correct effect on at least one
viewport).

## Explicitly unproven / not verified

- Flower's real-3D growth sequence has only 3 stages in the current build
  (`growthStageModels.flower` in `src/data/generated/plants.ts`), so "scrub through at least 4
  stages" could not be exercised for flower — this is a data/content fact I read directly from
  source, not a rendering bug I'm asserting.
- I did not test the "Bee visits (pollinate)" button, xray/isolate/section/compare toggles, or
  any component other than Seed/Flower — out of scope for this checklist.
- I did not test touch-drag gestures on the range slider (only keyboard Home/ArrowRight), since
  Playwright's synthetic drag on a native `<input type=range>` is unreliable; keyboard
  interaction fires the same native `input`/`change` events a real user's drag would, so I'm
  confident the underlying state wiring is exercised correctly, but I did not verify the
  touch/drag *gesture* itself is comfortable on a real mobile device.
- Panel-scroll affordance testing used `page.mouse.wheel`, which is a reasonable proxy for
  trackpad/mouse but does not confirm touch-scroll behavior on a real mobile browser (should be
  similar since it's a standard scrollable `div`, but not directly observed on-device).
