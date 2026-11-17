# Wave 12 Visual Acceptance Review — Energy Lab

- Date: 2026-08-18
- Scope: `energy` (EnergyLab) — generator, multimeter, electric-stove real-world examples
- Target: http://127.0.0.1:5174/app/labs/energy
- Viewports: Desktop 1440x900, Mobile 390x844
- Method: isolated headless Chromium via Playwright (own `--user-data-dir` profile,
  cached local Playwright install), scripted navigation/clicks, `console`/`pageerror`
  listeners attached on every page load.
- Reviewer stance: read-only. No product/source/asset files were modified. Only writes
  were screenshots under `review-screenshots/wave12-2026-08-18/energy/` and this report.

## Summary

| Severity | Count |
| --- | --- |
| P0 | 0 |
| P1 | 3 |
| P2 | 3 |

Worst severity: **P1**. No blocking/broken issues found (app reachable, canvases render,
no route crashes, no `pageerror` events on any load). The P1s are all the same class of
bug repeated across the three examples on the **mobile** viewport only: a descriptive
tooltip card that appears when an example is selected, or the Tune panel's own fixed
content height, overlaps/hides the in-scene readout text directly beneath it.

## Checklist results

### 1. Tune panel clearance / translucency

- **Desktop — PASS.** Opening "Tune energy" while the "Electric stove" example was active
  renders the "Conservation challenge" panel at `x≈356–772, y≈270–580` inside the canvas.
  It does not overlap the meter row above it, the toolbar rail on the left, or the
  right-hand DetailPanel/RealWorld aside. Pixel-sampled comparison of the panel body
  against the same coordinates in the pre-panel baseline screenshot shows blended (not
  fully opaque) colors — e.g. baseline `(173,169,163)` vs. panel-open `(233,230,225)` at
  `(600,460)` — consistent with the panel's coded `/60` opacity + backdrop-blur, and all
  slider labels/values remained clearly legible in a 1x zoom crop.
  Evidence: `energy-tune-panel-open-desktop.png`.
- **Mobile — FAIL (P1).** Translucency itself is fine (same blending pattern found via
  pixel sampling, e.g. baseline `(245,240,231)` vs. panel-open `(221,216,209)` at
  `(200,420)`), but **clearance is broken**: DOM inspection shows the panel's scrollable
  content region is `scrollHeight: 615px` inside a `clientHeight: 172px` box — only ~28%
  of the panel's content is visible by default. On open, only the "CONSERVATION
  CHALLENGE" title and the predict/explanation text are visible; all 7 controls (Start
  height, Mass, Heat loss, Perfectly elastic, Push force, Push distance, Transfer time)
  are pushed entirely out of view below the fold, with **no visible scrollbar, fade
  edge, or other affordance** hinting that the panel scrolls. A programmatic scroll to
  the bottom of the panel confirms the sliders exist and are reachable via scroll, but a
  real user has no visual cue to do this — the panel reads as if it has no controls.
  Additionally, once scrolled, the sticky "CONSERVATION CHALLENGE" header clips across
  the top of the "Push force" slider row.
  Evidence: `energy-tune-panel-open-mobile.png` (sliders absent),
  `energy-tune-panel-scrolled-mobile.png` (sliders revealed only after manual scroll,
  header overlapping "Push force" label),
  `energy-tune-panel-open-fullpage-mobile.png` (confirms this is not a page-level scroll
  issue — the page itself doesn't scroll further; the clipping is inside the panel's own
  nested scroll region).

### 2. Live scene visibility with panel open

- **Desktop — PASS.** With the Tune panel open, the right ~40% of the canvas (grey
  coaster-track oval, hotspot dots, "without friction" / "stays fixed" labels) remains
  fully visible and unobstructed beside the panel.
  Evidence: `energy-tune-panel-open-desktop.png`.
- **Mobile — PASS.** With the Tune panel open, the upper portion of the canvas (coaster
  track, hotspot dots) remains visible above the meter row and panel.
  Evidence: `energy-tune-panel-open-mobile.png`.

### 3. Generator framing

- **Desktop — PASS.** Generator model is centered in the right-of-center canvas area,
  fully inside the canvas bounds, not clipped by any UI. Evidence:
  `energy-generator-desktop.png`.
- **Mobile — PASS (with a P2 note).** Generator model is well framed and not clipped.
  Evidence: `energy-generator-mobile.png`. Minor: the accompanying cause/effect label
  ("rotor spins → ~51 W out") is clipped at the right edge of the canvas on mobile — only
  "...out" is visible, the rest of the string runs past the viewport edge. This affects
  the label text, not the 3D model framing itself. See P2 findings below.

### 4. Multimeter framing + meter readability

- **Desktop — PASS (with P2 notes).** Multimeter model sits fully inside the canvas
  (roughly `x 380–430, y 330–400`), not clipped by canvas bounds. The live readout
  ("reads ~51 W", "12V 4.3A") is rendered as green text near the model and is clearly
  legible at normal zoom. Evidence: `energy-multimeter-desktop.png`. Two P2 polish notes
  below (device is small/off-center vs. the other two examples; its own on-model LCD
  screen renders blank/dark rather than showing the reading).
- **Mobile — FAIL (P1).** The readout label ("reads ~51 W") sits directly beneath the
  bottom-left corner of the descriptive tooltip card ("Multimeter – Measuring electrical
  energy…") and is almost entirely covered by it — only a sliver ("res") peeks out from
  under the card in the baseline capture. This makes the live power reading effectively
  unreadable on mobile while the tooltip is showing (which it does immediately on
  selecting the example). Evidence: `energy-multimeter-mobile.png` (see region around
  `x 0–90, y 280–300`).

### 5. Stove framing + meter readability

- **Desktop — PASS.** Electric stove model is centered and fully framed in the canvas,
  not clipped. The "heat share: 1%" readout (coral/red text) and "heat is energy too"
  label are both clearly legible above the model. Evidence: `energy-stove-desktop.png`.
- **Mobile — FAIL (P1).** Same overlap pattern as the multimeter: the "heat share: 1%"
  and "heat is energy too" labels sit right under the bottom edge of the "Electric stove
  – Electrical to thermal energy" tooltip card and are visually cut into/faded by it,
  significantly reducing legibility. The stove model itself remains well framed and not
  clipped. Evidence: `energy-stove-mobile.png` (see region around `x 0–390, y 260–310`).

## P1 findings

1. **Energy Lab, Tune panel, mobile 390x844** — Tune panel's content area is fixed at
   172px tall against 615px of actual content (~28% visible); all 7 tune sliders are
   hidden below the fold by default with no scroll affordance shown. Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-tune-panel-open-mobile.png`,
   `review-screenshots/wave12-2026-08-18/energy/energy-tune-panel-scrolled-mobile.png`.
2. **Energy Lab, Multimeter example, mobile 390x844** — Live power/volt/amp readout label
   is overlapped/obscured by the example's own descriptive tooltip card immediately
   above it, leaving it effectively unreadable. Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-multimeter-mobile.png`.
3. **Energy Lab, Electric stove example, mobile 390x844** — "heat share" meter label and
   "heat is energy too" cause/effect label are overlapped/obscured by the example's
   descriptive tooltip card immediately above them. Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-stove-mobile.png`.

## P2 findings

1. **Energy Lab, Multimeter example, desktop + mobile** — Multimeter model renders
   noticeably smaller and off-center (tucked at the canvas's left edge) compared to the
   Generator and Electric stove models, which are both centered and rendered larger —
   inconsistent framing scale across the three real-world examples. Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-multimeter-desktop.png` vs.
   `review-screenshots/wave12-2026-08-18/energy/energy-generator-desktop.png` and
   `review-screenshots/wave12-2026-08-18/energy/energy-stove-desktop.png`.
2. **Energy Lab, Multimeter example, desktop** — The multimeter's own on-model LCD screen
   renders blank/dark; the live reading ("12V 4.3A") only appears as a separate floating
   text label near the device rather than on the device's own screen, which undercuts the
   tooltip copy's claim that it "reads a real circuit." Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-multimeter-desktop.png`
   (zoom region `x 370–460, y 330–400`).
3. **Energy Lab, Generator example, mobile 390x844** — The "rotor spins → ~51 W out"
   cause/effect label is clipped at the right edge of the canvas; only "...out" is
   visible. Evidence:
   `review-screenshots/wave12-2026-08-18/energy/energy-generator-mobile.png` (top-right
   corner, roughly `y 260–300`).

## Console / page errors

No `pageerror` events were captured on any page load, at either viewport.

Console output was identical in kind at both viewports (verbatim, deduplicated):

```
[vite] connecting...
[vite] connected.
%cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
unsupported GPOS table LookupType 8 format 2
unsupported GPOS table LookupType 5 format 1
unsupported GSUB table LookupType 6 format 2
unsupported GSUB table LookupType 6 format 1
```

These are non-fatal dev-server/GPU-driver/font-shaping debug/performance messages (not
correctness errors) and were not treated as failures on their own, but are reported
verbatim per instructions.

## Not verified / out of scope for this pass

- **Stove coil glow behavior.** The tooltip copy states the coil "glows hotter and
  shifts from amber toward red" as heat share grows. At the default control state the
  heat share reads 1% and the burners appear as plain grey/dark rings (no visible glow).
  Actually driving the Heat loss slider up and confirming the coil color-shifts live was
  **not tested** — it falls outside the 5-item checklist for this pass (framing/panel/
  meter legibility only), so this is flagged as unproven rather than guessed at either
  way.
- **Toolbar "Section" (cross-section) control.** This icon renders visually
  greyed-out/disabled at both viewports for this lab (screenshots not separately saved
  for this observation; visible in the toolbar rail of any baseline screenshot). Whether
  this is an intentional "not applicable to this model" state or an unintended disabled
  control was **not verified** — it isn't one of the 5 checklist items for this pass.
- **No further routes/labs were reviewed.** Scope for this pass was strictly the Energy
  lab's generator/multimeter/stove examples per the assignment; no other labs, the
  landing page, onboarding, catalog, or notebook were inspected in this pass.

## Screenshot index

All under `review-screenshots/wave12-2026-08-18/energy/`:

- `energy-baseline-desktop.png`, `energy-baseline-mobile.png`
- `energy-generator-desktop.png`, `energy-generator-mobile.png`
- `energy-multimeter-desktop.png`, `energy-multimeter-mobile.png`
- `energy-stove-desktop.png`, `energy-stove-mobile.png`
- `energy-tune-panel-open-desktop.png`, `energy-tune-panel-open-mobile.png`
- `energy-tune-panel-open-fullpage-desktop.png`, `energy-tune-panel-open-fullpage-mobile.png`
- `energy-tune-panel-scrolled-mobile.png` (diagnostic: panel scrolled to bottom to prove
  sliders exist and are reachable, evidencing the P1 clearance finding above)
