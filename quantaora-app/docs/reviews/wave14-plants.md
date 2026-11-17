# Wave 14 Visual QA — Plants Lab: Tune scrubbing ergonomics

**Reviewer:** Wave 14 reviewer #3 (independent, parallel QA)
**Date:** 2026-08-18
**Route:** `http://127.0.0.1:5174/app/labs/plants`
**Scope:** "Tune plant" scrubbing control ergonomics (growth-stage sliders for Seed and Flower
components), canvas framing, toolbar reachability, panel overflow, BottomTray coexistence.
**Viewports tested:** Mobile 390×844, Tablet 1024×768, Desktop 1440×900 (all three covered).
**Method:** Local ad hoc Playwright 1.62.1 (installed to `/tmp/wave14-plants-qa`, not committed
to the repo), Chromium headless, `page.on('console'/'pageerror'/'requestfailed')` capture per
viewport. Screenshots under
`review-screenshots/wave14-2026-08-18/plants/`.

## Headline verdict

**CONDITIONAL PASS.** The core interaction works — scrubbing the growth-stage slider for both
Seed and Flower produces a clear, immediate, distinct visual change in the 3D model at every
viewport, and there were no console/page errors. However, there are two real P1 defects: (1) the
mature/full-grown stage of both the corn and the flower model is visually clipped by the
top canvas-badge overlay on mobile specifically while the Tune panel is open (canvas shrinks to
32% of viewport height in that state), and (2) the left toolbar's "Reset" control is ~60% clipped
and effectively unusable at the 1024×768 tablet viewport, with no scroll affordance to reach it.

## Findings by severity

### P0 — none found.

App was reachable at all three viewports, no route crashes, no console/page errors beyond benign
THREE.js deprecation/GPU-driver/font-substitution debug noise (see "Console output" below), and
the core scrub interaction never failed to produce a visible change.

### P1 — significant

**1. Mature-stage flower ("full bloom") clipped by the top canvas badge on mobile with Tune panel open**
- Route/surface: Plants lab → Flower component → "See it grow (real 3D)" → Growth stage 3 of 3
  ("full bloom"), mobile 390×844.
- The purple bloom is rendered up near the very top of the canvas and is cut off behind/under the
  "PLANTS · TAP PARTS · TRACE HOW A PLANT WORKS" pill badge that floats over the canvas top edge.
  Only the tips of two sepals are visible below the badge; the bloom itself is hidden.
- Evidence: `plants-flower-scrub-end-bloom-mobile.png`,
  close-up crop `plants-fullbloom-clipped-crop-mobile.png`.
- Not reproduced on tablet (`plants-flower-scrub-end-bloom-tablet.png`) or desktop
  (`plants-flower-scrub-end-bloom-desktop.png`) — bloom is fully visible and well-framed at both.

**2. Mature-stage corn ("tasseled") clipped by the top canvas badge on mobile with Tune panel open**
- Route/surface: Plants lab → Seed component → "See it grow (real 3D)" → Growth stage 4 of 4
  ("tasseled"), mobile 390×844.
- Same failure mode as finding 1: the corn tassel is cut off by the top badge overlay.
- Evidence: `plants-tune-scrub-end-mobile.png`, close-up crop
  `plants-tasseled-corn-clipped-crop-mobile.png`.
- Not reproduced on tablet (`plants-tune-scrub-end-tablet.png`) or desktop
  (`plants-tune-scrub-end-desktop.png`) — fully visible, well-framed.
- Root cause context (observed, not fixed): with the Tune panel open on mobile the canvas drops
  to **32% of viewport height** (see finding 3), leaving no headroom for the tallest growth
  stage before it collides with the fixed top overlay badge. With the Tune panel closed, the same
  mature stages render fully unclipped at 56% canvas height
  (`plants-full-page-final-mobile.png` shows the flower fully visible once the panel is closed).

**3. Canvas is cramped on mobile while the Tune panel is open (32% of viewport height, below the 40% bar)**
- Route/surface: Plants lab, mobile 390×844.
- Measured via `canvas.getBoundingClientRect()`: with no panel open, canvas = 472.6px / 844px =
  **56.0%** of viewport height (PASS, well-framed — see `plants-initial-mobile.png`). With the
  Tune panel open (the state a user is in for the entire duration of scrubbing the growth-stage
  slider), canvas drops to 270.1px / 844px = **32.0%** — below the 40% cramped threshold called
  out in scope, and the direct cause of findings 1–2.
- Tablet and desktop do not have this problem: tablet canvas is 53.8% (panel closed) / 51.2%
  (panel open); desktop is 69.4% / 67.2%. Both stay comfortably above 40% in both panel states.

**4. "Reset" toolbar control ~60% clipped/unreachable at tablet 1024×768 (default state, no Tune panel needed to reproduce)**
- Route/surface: Plants lab, any component, tablet 1024×768, default landing state.
- The left vertical toolbar (Rotate, Pause, Isolate, Section, Compare, Zoom In, Zoom Out, Full,
  More, Reset — 10 buttons) is taller than the canvas-stage container that clips it
  (`overflow: hidden`, measured via computed style). Measured with Playwright:
  - Stage container: `top 64 / bottom 457 / height 393px`.
  - "Reset" button: `y 442.75, height 35.25` → bottom edge at 478px, i.e. **38px past** the
    container's clip boundary.
  - Only **40.4%** of the Reset button's height is inside the visible/clipped region; the visible
    sliver shows only the top of the icon glyph with no "Reset" label text (the label sits below
    the icon and is entirely clipped).
  - `document.elementFromPoint()` at the button's true geometric center resolves to the
    **BottomTray** ("Lesson / Checkpoint …" tile row) sitting behind/below it, not the Reset
    button — confirming the button is visually obscured by unrelated page content at that exact
    screen position, not merely faded.
  - The clipping container uses `overflow: hidden` (not `auto`), so there is no way to scroll to
    reveal the rest of the button, and no fade/chevron cue exists for this toolbar (contrast with
    the Tune panel's deliberate scroll-cue treatment, see PASS notes below).
  - Not reproduced at mobile (Reset 100% visible, `plants-initial-mobile.png`) or desktop (Reset
    100% visible, `plants-initial-desktop.png`) — this is specific to the 1024×768 tablet band.
  - Evidence: `plants-toolbar-reset-clipped-crop-tablet.png` (cropped from
    `plants-initial-tablet.png`).
  - Note: a scripted Playwright `.click()` on the Reset button's accessible target still
    succeeded (Playwright resolves clicks against the intersection of the element's box and the
    viewport/ancestor clip, not the full un-clipped box), so this is a *visual clipping /
    discoverability* defect rather than a hard "click always fails" defect — but a real end user
    would very likely not notice or be able to reliably tap the ~14px sliver of icon that remains
    visible with no label.

### P2 — polish

**5. Growth-stage labels wrap awkwardly in the narrower tablet-band Tune panel dock**
- Route/surface: Plants lab, Seed and Flower components, tablet 1024×768, Tune panel open.
- The 4-column stage-label row under the corn slider ("seedling / young stalk / taller stalk /
  tasseled") wraps mid-word inside the ~12rem-wide tablet panel dock, rendering as
  "seedling young / stalk taller / stalk tasseled" — no longer aligned under their respective
  slider tick positions, and harder to parse at a glance.
- Evidence: `plants-stagelabels-wrap-crop-tablet.png` (cropped from `plants-tune-scrub-end-tablet.png`).
  Same wrap pattern reproduced on the Flower panel's 3-column row ("bud / opening / full bloom") —
  see `plants-flower-scrub-start-bud-tablet.png`.
- Not reproduced at mobile (full-width panel) or desktop (22rem `xl` panel width) — both keep
  each label on one line under its slider position.

**6. Early flower growth stages ("bud", "opening") render very small relative to the canvas**
- Route/surface: Plants lab, Flower component, all three viewports.
- The "bud" stage is a thin stem with a small ~15–20px cone/arrowhead shape at its tip (confirmed
  present via pixel-level crop, not literally blank), and "opening" is barely larger. Both are
  technically visible and technically distinct from each other and from "full bloom" at every
  viewport tested — but they occupy a small fraction of the available canvas at all three
  viewports (most pronounced on mobile, where the same crop shows the bud shape well under 5% of
  canvas height). This reads closer to a bare stick than a recognizable flower bud to a learner
  glancing at the scene, unlike the corn sequence (seedling → tasseled) which grows more
  proportionally into the frame.
- Evidence: `plants-flower-scrub-start-bud-mobile.png` /
  `plants-flower-scrub-mid-mobile.png` / crop `crop_bud_mobile.png` equivalent visible in
  `plants-flower-scrub-start-bud-mobile.png`.
- Judgment call, not a hard functional break — the in-panel caption itself calls this out as "a
  stylized reference, not a labeled botanical phase," and the two stages ARE distinguishable from
  each other on close inspection at every viewport, so this is filed as polish (P2), not P1.

**7. Scroll-cue chevron overlaps the last-visible slider on desktop**
- Route/surface: Plants lab, Seed component, Tune panel open, desktop 1440×900.
- The Tune panel's bottom fade+chevron "more below" affordance (intentional, see PASS notes)
  renders directly on top of the "Warmth" slider's track/thumb at the point where the panel
  content is naturally cut off by its container height. The chevron graphic has
  `pointer-events: none` so it does not block interaction with the slider underneath, but it is a
  minor visual overlap worth a polish pass.
- Evidence: crop from `plants-tune-scrub-end-desktop.png` (see analysis; not saved as a separate
  file since the overlap is subtle — visible on close inspection of the panel's bottom edge in
  that screenshot).

## PASS — checks that were covered and did not find issues

- **Seedling/bud growth stages visually distinct (functional definition):** at every viewport,
  scrubbing the growth-stage slider through its full range (start/mid/end) produced a clearly
  different, correctly-labeled model at each step for both Seed (`seedling → young stalk → taller
  stalk → tasseled`, 4 stages) and Flower (`bud → opening → full bloom`, 3 stages). The slider
  label, the `n of N` counter, and the model itself all update together — cause/effect is legible.
  Evidence: `plants-tune-scrub-start-seedling-{mobile,tablet,desktop}.png`,
  `plants-tune-scrub-mid-{mobile,tablet,desktop}.png`,
  `plants-tune-scrub-end-{mobile,tablet,desktop}.png`,
  `plants-flower-scrub-start-bud-{mobile,tablet,desktop}.png`,
  `plants-flower-scrub-mid-{mobile,tablet,desktop}.png`,
  `plants-flower-scrub-end-bloom-{mobile,tablet,desktop}.png`.
- **Canvas framing/percentage, tablet and desktop:** tablet 53.8%/51.2% (panel closed/open),
  desktop 69.4%/67.2% — both above the 40% cramped bar in both panel states. Mobile is fine with
  the panel closed (56%) — the only violation is mobile + panel open (see P1 finding 3).
- **Tune panel scroll affordance:** the panel deliberately caps its height
  (`max-h-[24svh]` below `lg`, full-height with internal `overflow-y-auto` at `lg`+) and pins a
  fade-gradient + `ChevronDown` icon over its bottom edge whenever content overflows — a real,
  documented (source comment references "Wave 13 QA P1") "more below" cue, and it renders
  correctly at all three viewports. This is a genuine positive and matches the kind of affordance
  the brief asked to check for. Evidence: `plants-seed-growth-revealed-mobile.png` (chevron under
  "Real 3D scans..." text), `plants-tune-scrub-end-tablet.png`
  (chevron under the "Shoot rises" observation box).
- **BottomTray vs. Tune panel overlap:** `BottomTray` renders in normal document flow (not
  `position: fixed`), strictly below/after the canvas-and-panel region in the layout, at every
  viewport. It never visually overlaps the open Tune panel in any captured screenshot. PASS.
  (Note: BottomTray *does* sit directly behind the canvas-controls toolbar's clipped region at
  tablet — see P1 finding 4 — but that is a toolbar/canvas-stage clipping defect, not a
  BottomTray/Tune-panel overlap.)
- **No internal QA language / placeholder text observed** in any of the 42 screenshots reviewed
  across all three viewports (labels, panel copy, guided-challenge text, real-world blurbs all
  read as finished, learner-facing content).
- **No console errors or page errors** at any viewport. Console output was limited to: Vite HMR
  connect/debug lines, a React DevTools info line, `THREE.Clock` deprecation warning (harmless,
  library-internal), 4× `GL Driver Message ... GPU stall due to ReadPixels` (headless/software
  GPU performance notice, not a functional error, self-limiting — "this message will no longer
  repeat"), and repeated `unsupported GPOS/GSUB table LookupType ...` debug lines (headless
  Chromium font-shaping fallback notices, cosmetic/environment-specific, not app-caused). No
  `pageerror` or `requestfailed` events were captured at any of the three viewports.

## Unproven / not covered

- Did not test the "Compare growing conditions" preset buttons ("Try: well-watered" / "Try: dry +
  cold") or the germination/water/warmth/nutrient sliders in depth — scope was specifically the
  growth-stage scrubber; these were visible in desktop screenshots but not independently scrubbed
  end-to-end.
- Did not test the "Bee visits (pollinate)" flow or pollination progress animation.
- Did not test touch-drag gestures on the range input specifically (used `fill()` +
  synthetic `input`/`change` events, which is representative of the value-changing behavior but
  not a literal finger-drag gesture simulation).
- Did not test other Plants components (Chloroplast, Leaf, Phloem, Root, Stem, Stomata, Xylem) —
  out of scope for this "Tune scrubbing ergonomics" assignment, and not covered here.
- Did not test landscape mobile orientation or any viewport outside the three specified.
- Did not check keyboard-only operation of the range slider (arrow-key stepping) beyond what the
  `fill()`-based approach implicitly exercises.
- The P2 finding 7 (chevron-over-slider overlap on desktop) was identified by close visual
  inspection of an existing screenshot rather than a dedicated isolated capture; no separate
  crop file was saved for it.

## Screenshot index (all under `review-screenshots/wave14-2026-08-18/plants/`)

- `plants-initial-{mobile,tablet,desktop}.png` — landing state, Chloroplast component.
- `plants-seed-selected-{mobile,tablet,desktop}.png`,
  `plants-flower-selected-{mobile,tablet,desktop}.png` — component switch confirmation.
- `plants-seed-growth-revealed-{mobile,tablet,desktop}.png`,
  `plants-flower-growth-revealed-{mobile,tablet,desktop}.png` — "See it grow (real 3D)" toggled on.
- `plants-tune-scrub-start-seedling-*.png`, `plants-tune-scrub-mid-*.png`,
  `plants-tune-scrub-end-*.png` — corn growth-stage scrub, 3 points × 3 viewports.
- `plants-flower-scrub-start-bud-*.png`, `plants-flower-scrub-mid-*.png`,
  `plants-flower-scrub-end-bloom-*.png` — flower growth-stage scrub, 3 points × 3 viewports.
- `plants-full-page-final-*.png`, `plants-fullpage-*.png` (full-page capture) — steady state
  after closing the Tune panel.
- `plants-tasseled-corn-clipped-crop-mobile.png`, `plants-fullbloom-clipped-crop-mobile.png`,
  `plants-toolbar-reset-clipped-crop-tablet.png`, `plants-stagelabels-wrap-crop-tablet.png` —
  close-up evidence crops for the P1/P2 findings above.

## Summary counts

- P0: 0
- P1: 4 (mobile full-bloom clipping, mobile tasseled-corn clipping, mobile canvas <40% with panel
  open, tablet Reset button clipping)
- P2: 3 (tablet stage-label wrap, small early flower-stage models, desktop chevron/slider overlap)
