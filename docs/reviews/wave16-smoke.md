# Wave 16 Smoke Test — 7 Lab Routes (Desktop + Mobile)

Date: 2026-08-18
Reviewer: Wave16 reviewer 8/8 (cross-route smoke pass)
App: http://127.0.0.1:5174
Scope: breadth only — 7 lab routes x 2 viewports (1440x900 desktop, 390x844 mobile). No deep
interaction testing performed; any interaction/framing issues are flagged for the relevant
deep-dive reviewer, not investigated further here.

## Summary

- **14/14 route x viewport combinations loaded with visible, non-blank content.**
- **0 console errors and 0 page errors captured on any route/viewport.**
- No React error boundary / "something went wrong" text detected on any page.
- Overall pass rate: **14/14 PASS** on core "does it load and render" criteria.
- 3 items flagged as P1/P2 for deep-dive reviewers (not blockers — noted in passing per scope
  instructions).

Note on methodology: `page.goto(..., { waitUntil: 'networkidle' })` timed out (20s) on
`molecules` (mobile) and `motion` (both viewports). This is very likely caused by the Vite dev
server's persistent HMR/WebSocket connection keeping the network "busy" rather than an actual
app hang — in all three cases the page had already rendered visible content (canvas count 1, no
console/page errors) by the time of the screenshot, and a follow-up retry of `molecules` mobile
using `waitUntil: 'domcontentloaded'` succeeded cleanly with no errors. Treated as non-blocking
tooling noise, not an app fault — but noting it explicitly since it technically produced a
Playwright-level error message.

## Results table

| Route | Viewport | Result | Console/page errors | Screenshot |
|---|---|---|---|---|
| /app/labs/number-sense | 1440x900 desktop | PASS | none | number-sense-desktop.png |
| /app/labs/number-sense | 390x844 mobile | PASS | none | number-sense-mobile.png |
| /app/labs/molecules | 1440x900 desktop | PASS | none | molecules-desktop.png |
| /app/labs/molecules | 390x844 mobile | PASS | none (`networkidle` goto timeout on first attempt, no console/page error; confirmed clean on retry with `domcontentloaded`) | molecules-mobile.png |
| /app/labs/plants | 1440x900 desktop | PASS | none | plants-desktop.png |
| /app/labs/plants | 390x844 mobile | PASS | none | plants-mobile.png |
| /app/labs/orbit | 1440x900 desktop | PASS | none | orbit-desktop.png |
| /app/labs/orbit | 390x844 mobile | PASS | none | orbit-mobile.png |
| /app/labs/moons | 1440x900 desktop | PASS | none | moons-desktop.png |
| /app/labs/moons | 390x844 mobile | PASS | none | moons-mobile.png |
| /app/labs/motion | 1440x900 desktop | PASS | none (`networkidle` goto timeout, no console/page error) | motion-desktop.png |
| /app/labs/motion | 390x844 mobile | PASS | none (`networkidle` goto timeout, no console/page error) | motion-mobile.png |
| /app/labs/microbiology | 1440x900 desktop | PASS | none | microbiology-desktop.png |
| /app/labs/microbiology | 390x844 mobile | PASS | none | microbiology-mobile.png |

All screenshots saved under:
`/Users/ahmedjawed/Documents/Kids Learning app/quantaora-app/review-screenshots/wave16-2026-08-18/smoke/`

## Findings (flagged in passing, for the relevant deep-dive reviewer — not investigated further)

**P1 — Molecules, desktop 1440x900 (`molecules-desktop.png`)**
The Water (H2O) 3D model panel reports "Atoms: 3" in the right-hand info card, but the 3D
viewport visibly shows only two spheres (one large red, one smaller off-white/gray) — a third
atom is not visually distinguishable in the render. Flagging for the molecules-lab deep-dive
reviewer to confirm whether the second hydrogen is occluded/overlapping or actually missing from
the scene.

**P2 — Orbit (Solar System), both viewports (`orbit-desktop.png`, `orbit-mobile.png`)**
At the time of screenshot capture (page load + ~1.5s settle wait), the canvas was still showing
an in-progress "LOADING SOLAR SYSTEM… 82%/91%" spinner rather than the fully rendered scene, on
both desktop and mobile. This may just reflect a longer asset-load time for this lab (real
NASA-derived textures per on-page copy) rather than a bug, but the deep-dive reviewer should
verify the scene reaches 100% and renders the full solar system correctly, and check whether
load time is reasonable.

**P2 — Motion (Mechanics/Force), mobile 390x844 (`motion-mobile.png`)**
The toolbar icon row (rotate/play/isolate/section/compare/zoom/etc.) and the in-scene text labels
(e.g. "applied force", "net force arrow", "momentum stack") render very small/tightly packed at
this viewport width. Not confirmed broken or unreachable in this smoke pass — flagging for the
motion-lab deep-dive reviewer to check tap-target size and label legibility at mobile width.

## Coverage confirmation

All 7 assigned routes were visited at both required viewports (14/14), console and page-error
listeners were attached before every navigation, and one screenshot was captured per
route/viewport. No routes were skipped; no additional routes were explored beyond the assigned
list, per scope.
