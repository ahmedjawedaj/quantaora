# Wave 20 QA — Moons (Enceladus), label collision re-test

Reviewer: Wave 20 reviewer — moons scope (read-only visual QA), Sonnet
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Scope: `MoonsLab` at `/app/labs/moons`, Enceladus body, "Tiger Stripes" / "South Polar Geysers" label collision.
Method: isolated Playwright (Chromium) launched from `/tmp/wave20-moons-qa`, own `browser.newContext()` per run, `page.on('console')` / `page.on('pageerror')` active throughout. Read-only source inspection: `src/routes/MoonsLab.tsx`, `src/components/explorer/MoonModel.tsx`, `src/components/explorer/MoonViewer.tsx`, `src/components/explorer/CanvasControls.tsx`, `src/data/moons.ts`, `docs/reviews/wave18-moons.md`.

Evidence directory: `review-screenshots/wave20-2026-08-18/moons/`.

## Prior finding being re-checked

No `docs/reviews/wave19-moons.md` exists, despite `MoonModel.tsx` containing an in-place "Wave 19 fix" comment describing a pill-avoidance patch — that fix evidently shipped without a review doc. Wave 18 (`docs/reviews/wave18-moons.md`) is therefore the correct prior baseline: it found the Wave 14 label-vs-label overlap fixed, but a new P1 where, at default desktop camera framing, the declutter fix pushes "Tiger Stripes" down underneath the fixed bottom caption pill, making it fully hidden.

## Overall verdict: 1 P0, 1 P1, 0 P2 — regressed, not fixed

The Wave 18 P1 has **not** been resolved. It has gotten worse: both south-pole labels are now clipped entirely outside the visible stage, and the original label-vs-label overlap (Wave 14) has also returned.

## Check 1 — 3x fresh desktop loads (1440x900), default view, label rects

**FAIL — P0.** All three independent cold loads produced identical, deterministic rects:
- `tigerLabel`: top=737.2 bottom=769.9
- `geyserLabel`: top=729.7 bottom=762.5
- caption pill: top=673.1 bottom=705.0
- stage container clip boundary (`overflow: hidden`): y=64–721

Two compounding defects:
1. **Label-vs-label overlap is back** — `tigerLabel`/`geyserLabel` overlap ~25px vertically (the Wave 14 defect Wave 18 had confirmed fixed).
2. **Both labels sit entirely below the stage's 721px clip boundary and are 100% invisible** — not merely painted-under the caption pill (Wave 18's finding), but clipped out of the DOM's visible box entirely. Only the two northern-hemisphere labels ("Smooth Ice Plains", "Cratered Northern …") render correctly.

Evidence: `01-desktop-run1-default.png`, `01b-desktop-run1-default-crop.png`, `02-desktop-run2-default.png`, `03-desktop-run3-default.png` (all 3 runs byte-identical).

## Check 2 — Camera drag re-check, desktop 1440x900

**FAIL — same defect persists across every tested camera angle.**
- Drag 1 (~220px right, 60px up): "South Polar Geysers" recovers and clears the pill, but **"Tiger Stripes" remains invisible** (top=726.3, still past the 721px clip).
- Drag 2 (~260px left, 90px down): "South Polar Geysers" is only partially legible, sliced mid-glyph at the canvas/tray seam; **"Tiger Stripes" again fully invisible.**

Across all 5 tested desktop states (3 fresh loads + 2 drags), "Tiger Stripes" never became visible once.

Evidence: `05-desktop-drag1.png`, `05b-desktop-drag1-crop.png`, `06-desktop-drag2.png`, `06b-desktop-drag2-crop.png`.

## Check 3 — Mobile smoke, 390x844, default view

**PASS — no regression.** Measured: "South Polar Geysers" top=284.2 bottom=309.9, "Tiger Stripes" top=315.0 bottom=340.6 (no overlap, ~4.4px gap, both fully legible), neither intersects the top toolbar (144–174.5) or bottom caption pill (416.5–440.2). Consistent with Wave 18's mobile PASS.

Evidence: `07-mobile-default.png`, `07b-mobile-default-crop.png`.

## Check 4 — Console/page errors

**PASS.** Zero `pageerror` events across all 4 sessions (3 desktop + 1 mobile). Only benign messages: Vite HMR connect, React DevTools info banner, `THREE.Clock` deprecation warning.

## Findings by severity

- **P0 (1):** Desktop 1440x900, all tested camera states (3 fresh loads + 2 drags): "Tiger Stripes" hotspot label is invisible in every single one — the pill-avoidance patch now pushes the label past the canvas stage's own `overflow: hidden` clip boundary rather than just under the caption pill. At default framing "South Polar Geysers" is also fully invisible for the same reason, and the two labels once again overlap each other (Wave 14 regression). Evidence: `01`–`03`, `05`–`06` (with crops).
- **P1 (1):** Even where "South Polar Geysers" partially recovers after a drag, its label is visually sliced at the canvas/tray seam in a different orientation — legibility is fragile/inconsistent across camera angles rather than reliably fixed. Evidence: `06b-desktop-drag2-crop.png`.
- **P2:** none.

**Conclusion:** Not fixed since Wave 18 — regressed to a worse, deterministic P0 on desktop. Mobile remains clean.
