# QA Report — Wave 10, Energy Lab (`/app/labs/energy`)

**Environment:** Isolated Chromium (Playwright, persistent context at `/tmp/wave10-energy/profile*`), dev server untouched at `http://127.0.0.1:5174`. Screenshots saved to `review-screenshots/wave10-2026-08-18/energy/`. Full console transcript: `.../energy/console-log.txt`.

### Summary table

| Check | Result |
|---|---|
| App reachable | PASS |
| Multimeter renders, live readout visible/updating | PASS |
| Generator renders, live readout visible/updating | PASS |
| Stove renders, live readout visible/updating | PASS |
| Mobile framing (390×844), all 3 examples | PASS (no clipping) |
| Tune panel translucency | **FAIL (P1)** |
| Live meters visible/updating while Tune open | PASS |
| Toolbar reachable, desktop | PASS |
| Toolbar reachable, mobile | PASS |
| "More" menu / Fit View reachable, both viewports | PASS |
| Console errors/warnings | No errors; 2 benign warning types only |

### P1 — Significant

**1. Tune panel + live-meter row visually collides with the top canvas overlay (real-world-example chips + description tooltip) — reproducible on every "Tune energy" open, both viewports, with or without an active real-world example.**
- Route/surface: Energy lab, all three example components (Multimeter/Generator/Stove) and even the default (no example) state.
- Viewports: Desktop 1440×900 and Mobile 390×844.
- What's wrong: opening "Tune energy" makes the bottom-anchored meters+panel stack tall enough to ride up into the fixed-position top overlay (badge, "Generator/Multimeter/Electric stove" chips, and the active example's description tooltip). Text overlaps illegibly — e.g. "Generator"/"Multimeter" chip labels are sliced by the Meter cards, and the example description text ("...the coil glows hotter and shifts from amber toward red as the heat share of the total...") bleeds directly under/behind the "TOTAL ENERGY / MOTION + STORED / HEAT" cards.
- Functional note: a scripted click on the (visually obscured) "Generator" chip still succeeded, so this is a legibility/visual bug, not a hard click-blocker — still counts as significant per the "panels do not overflow / obscure controls" bar.
- Evidence: `tune-translucency-desktop.png`, `crop-desktop-tune-overlap.png` (2× zoom crop), `tune-translucency-mobile.png`, `crop-mobile-tune-overlap.png` (2× zoom crop), and reproduced with no example active in `tune-default-no-example-desktop.png` / `tune-default-no-example-mobile.png`.

**2. Tune panel reads as visually opaque, not translucent — the 3D scene is not visible through it, contrary to the design intent noted in the component's own code comments.**
- Route/surface: Energy lab, Tune panel, all components/examples.
- Viewports: Desktop 1440×900 and Mobile 390×844.
- What's wrong: the panel's `bg-…/95` + `backdrop-blur-sm` styling is visually indistinguishable from a solid opaque card — no model geometry is discernible through the panel body in any screenshot; the model is only visible in the strip outside the panel's bounds. Live meter *values* do stay visible and update correctly above/behind the panel (see PASS list below), but the panel itself does not let the scene show through it as "translucent" implies.
- Evidence: `tune-translucency-desktop.png`, `tune-default-no-example-desktop.png`, `tune-translucency-mobile.png` — stove/coaster model is fully hidden behind the panel body in each.

### P2 — Polish

**3. Multimeter's on-model live text ("reads ~W", volt/amp readout) sits very close to/under the example description tooltip on mobile.**
- Route/surface: Energy lab, Multimeter example, mobile 390×844.
- What's wrong: legible but tight — the green "reads ~31 W" label is close to the bottom edge of the "Multimeter – Measuring electrical energy" tooltip box, with the "12V ..." line partly under it. Not clipped by canvas bounds, not unreadable, just cramped.
- Evidence: `crop-multimeter-mobile-zoom.png` (2× zoom crop of `multimeter-mobile.png`).

### PASS — confirmed with evidence

- **Multimeter (desktop/mobile):** model renders fully framed, not clipped; live readout "reads ~51 W" (desktop) / "reads ~31 W" (mobile) and "12V X.XA" digital text both visible on the device screen. `multimeter-desktop-1.png`, `multimeter-mobile.png`.
- **Generator (desktop/mobile):** model renders fully framed; rotor + glow pulse driven by live power value, on-model label "rotor spins -> ~51 W out" visible. `generator-desktop.png`, `generator-mobile.png`.
- **Stove (desktop/mobile):** model renders fully framed; coil-glow color and "heat share: 1%" label visible and tied to live thermal fraction. `stove-desktop.png`, `stove-mobile.png`.
- **Cause/effect while Tune is open:** dragging "Start height" to max moved Total Energy 470 J → 706 J, Motion+Stored 466 J → 699 J, Heat 5 J → 7 J live in the Meter row while the panel was open — confirms meters stay visible and update. `tune-desktop-after-slider-change.png` (compare to `tune-translucency-desktop.png`).
- **Toolbar reachability, desktop:** left rail (Rotate, Play, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset) fully visible, unobscured, in every desktop screenshot. `landing-desktop.png`, `stove-desktop.png`.
- **Toolbar reachability, mobile:** top horizontal icon row fully visible across the viewport width, not clipped/overflowed. `stove-mobile.png` / `toolbar-mobile.png`.
- **"More" menu / Fit view control:** menu opens fully on-screen with all four items (Show labels, X-Ray view, Fit view, Clean view) legible and unclipped at both viewports; Fit view click succeeded with no console error. `more-menu-desktop.png`, `more-menu-mobile.png`, `fitview-clicked-desktop.png`, `fitview-clicked-mobile.png`.
- **No QA/internal language leaks:** all on-screen copy (labels, tooltips, lesson/checkpoint/notebook cards, real-world example descriptions) read as finished product copy — no lorem ipsum, TODOs, or internal component names observed in any screenshot.

### Console/network

No `pageerror` or `requestfailed` events were recorded in any run. Only benign console output was observed, verbatim:
```
console.debug: [vite] connecting...
console.info: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
console.debug: [vite] connected.
console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
console.debug: unsupported GPOS table LookupType 8 format 2
console.debug: unsupported GPOS table LookupType 5 format 1
console.debug: unsupported GSUB table LookupType 6 format 2
console.debug: unsupported GSUB table LookupType 6 format 1
```
(The `unsupported GPOS/GSUB table` messages are from the loaded Text font glyph table and repeat per font load; the `THREE.Clock` deprecation warning is a library-level three.js notice, not app code.) Full transcript with timestamps: `review-screenshots/wave10-2026-08-18/energy/console-log.txt`.

### Not verified / out of scope for this pass

- Did not test `Isolate`, `Section` (no cross-section handler wired for this lab per source — button present but disabled/no-op was not explicitly exercised), `Compare`, or hotspot-click cause/effect in the 3D scene beyond what's visible in the general screenshots — only Tune-panel-driven and example-toggle-driven cause/effect were directly exercised per the assigned scope.
- Did not test tablet/intermediate breakpoints, only the two specified viewports.
- Did not test keyboard/screen-reader accessibility paths.

### Source files referenced (read-only)

- `quantaora-app/src/routes/EnergyLab.tsx` — Energy lab scene, `TunePanel`, `Meter`, real-world example props (Multimeter/Generator/Stove), toolbar wiring.
- `quantaora-app/src/components/explorer/CanvasControls.tsx` — shared toolbar rail, "More" menu (Fit view, labels, X-Ray, clean view).
- `quantaora-app/src/data/generated/energy.ts` — generated content data (not the source of the layout bug).

All evidence files are under: `review-screenshots/wave10-2026-08-18/energy/`.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `energy` reviewer agent, which produced all findings and evidence above but whose permission scope restricted its own file writes to `review-screenshots/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
