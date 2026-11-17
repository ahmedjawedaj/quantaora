# QA Report: Math Manipulatives (Wave 10)

**Route:** `/app/labs/math-manipulatives` at `http://127.0.0.1:5174`
**Viewports tested:** Mobile 390x844 (primary), Desktop 1440x900 (secondary pass)
**Method:** Isolated headless Chromium via Playwright (`launchPersistentContext`, profile at `/tmp/wave10-math-manipulatives/profile*`), driven by throwaway scripts at `/tmp/wave10-math-manipulatives/qa.js` and `qa2.js` (not committed to the repo). No product files were modified — inspection of `src/routes/MathManipulativesLab.tsx` was read-only.

All evidence saved under:
`review-screenshots/wave10-2026-08-18/math-manipulatives/`
Console log: `review-screenshots/wave10-2026-08-18/console-log-math-manipulatives.txt` and `.../console-log-toolbar-check.txt`
Component inventory: `review-screenshots/wave10-2026-08-18/component-list.json` (29 components total)

---

## P0 — Blocking
None found. App was reachable (HTTP 200), the route loaded without crashing, and no `pageerror` or `requestfailed` events were logged in either viewport pass.

---

## P1 — Significant

**1. Geometry domain: 11 named components share one non-representative visual, with no shape-specific rendering.**
Confirmed in source: `GeometryManipulative` (`src/routes/MathManipulativesLab.tsx:938-1028`) renders a single fixed SVG scene (an angle-ray drag widget + a generic resizable rectangular "block") for **every** geometry id (`angle, area, circle, line, perimeter, point, quadrilateral, ray, segment, triangle, volume`), differentiated only by which numeric readout labels are shown below, not by the shape drawn. Selecting "Point," "Line," "Quadrilateral," or "Circle" shows no point marker, no line, no quadrilateral polygon, and no circle at all — just the same angle+block combo as "Angle."
Evidence (visually near-identical): `mobile-switcher-00-angle.png`, `mobile-switcher-02-circle.png`, `mobile-switcher-03-line.png`, `mobile-switcher-05-point.png`, `mobile-switcher-06-quadrilateral.png`, `mobile-switcher-09-triangle.png`. Also note "Circle" and later "Point"/"Line"/"Quadrilateral" all display a stale `360 deg` (rays fully overlapped, i.e. invisible turn) carried over from Circle's forced normalization, reinforcing that these screens are not meaningfully tied to their label.

**2. Data & Statistics domain: 5 of 10 named components are pixel-identical duplicate screens.**
`Bar Chart`, `Data Point`, `Line Graph`, `Probability`, and `Table` all render the exact same bar-chart-plus-summary widget (`DataManipulative`, lines 1120-1176) **and** fall through to the same generic `readout()` default case ("Data challenge" / Values / Mean / Median) — confirmed in code (`readout()` only special-cases `mean`, `median`, `mode`, `range`/`outlier`). There is no probability spinner, no table grid, no line-only chart, no single highlighted data point.
Evidence: `mobile-switcher-19-bar-chart.png`, `mobile-switcher-20-data-point.png`, `mobile-switcher-26-probability.png`, `mobile-switcher-28-table.png` — indistinguishable except for the highlighted switcher pill and "Component N of 29" counter.

---

## P2 — Polish

1. Mobile toolbar buttons (Rotate/Play/Isolate/Section/Compare/Zoom In/Zoom Out/Full/More/Reset) are ~32-33px square — below common ~44px touch-target guidance, though all 10 fit in one row with no clipping (bounding boxes logged in `console-log-toolbar-check.txt`, max right edge 371px within the 390px viewport).
2. The measuring-cup's own small canvas crops the cup model's rim/base slightly at mobile width (visible in `mobile-switcher-14-fraction.png`, `mobile-drag-after.png`) — a minor framing nit; the fill and text label remain fully legible.
3. A single `THREE.WebGLRenderer: Context Lost.` console message fired during rapid mobile switching through the fraction-cup ids (5 Canvas mount/unmounts within ~3s of clicks). No blank/black canvas appeared in any of the 29 switcher screenshots (verified via per-screenshot color-histogram sampling, no dominant fill >9%), and the cup rendered correctly in the very next screenshot — so no user-visible regression was captured, but this flags a latent risk under fast navigation on lower-end mobile GPUs.

---

## PASS items (explicitly verified)

- **Mobile component switcher:** all 29 components (11 geometry, 8 fractions/ratios, 10 data/statistics — full list in `component-list.json`) are reachable via the horizontal-scroll pill switcher and screenshotted (`mobile-switcher-00-*.png` through `mobile-switcher-28-*.png`). Active pill and counter ("Component N of 29") always visible, no clipping.
- **Measuring-cup drag interaction — real, correct geometry response:** dragging the pointer down→up over the cup's slider region moved the liquid fill from `1/4 full` → `2/4 full` → `4/4 full`, matching drag position proportionally, and stayed in sync with the tap-grid panel's own numerator/denominator readout. Evidence sequence: `mobile-drag-before.png` (1/4), `mobile-drag-mid.png` (2/4), `mobile-drag-during.png` (4/4), `mobile-drag-after.png` (4/4 held on release).
- **Labels/controls fit within the mobile viewport:** the "Tune math" panel, "Fraction Challenge" observe/predict/change/explain box, the 3 meter chips, bottom tray, and top toolbar all rendered fully inside 390px width with no page-level scroll — a full-page screenshot (`mobile-fraction-fullpage.png`) matched exactly 844px tall (viewport height), confirming no unwanted overflow.
- **Toolbar "More" overflow menu:** opens correctly with "Show labels," "X-Ray view," "Fit view," "Clean view," fully contained on-screen with no clipping (`mobile-toolbar-more-open.png`).
- **No internal QA/debug language observed:** no lorem ipsum, TODO strings, or internal component names visible in any captured screenshot.
- **No console errors or failed requests:** only benign `THREE.Clock` deprecation warnings and WebGL driver perf-stall warnings were logged (both viewports); see console log files above for verbatim text.
- **Desktop 1440x900 pass:** canvases render, no clipping, side panels (glossary/key-facts) contained with their own scroll, cup panel well-framed at desktop size too. Evidence: `desktop-initial.png`, `desktop-fraction-fit.png` (Decimal's cup panel), `desktop-fit.png`.

---

## Could not verify / out of scope for this pass

- Did not drag-test every geometry/data component's own interactive elements (angle-ray drag, block-corner resize, individual data bars) — only the specifically-requested cup drag plus default-state visual review of all 29 components.
- Did not open/inspect the Lesson, Quiz, or Compare modal bodies in depth (only confirmed the "Tune math" panel and toolbar "More" menu open cleanly).
- Did not click the on-canvas hotspot dots (e.g. "Angle"/"Inside"/"Edge") to confirm isolate/description cause-effect explicitly.
- Testing used Playwright mouse events over headless Chromium, not genuine OS-level touch input — multi-touch/momentum-scroll edge cases weren't exercised.
- The downstream real-world impact of the single WebGL "Context Lost" event on actual low-end mobile hardware (vs. this headless desktop-class Chromium) could not be verified.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `math-manipulatives` reviewer agent, which produced all findings and evidence above but did not itself write to `docs/reviews/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
