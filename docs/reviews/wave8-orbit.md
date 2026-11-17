# Wave 8 QA — Orbit / Solar System

Date: 2026-08-18
Route: `/app/labs/orbit` (Space > Solar System)
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/orbit/` (41 files: 33 PNGs + console/error logs)

## Checklist verdicts

**1. Scene reaches a fully completed load state — PASS (both viewports)**
"LOADING SOLAR SYSTEM…" spinner with progress bar displays briefly, then resolves to the full interactive scene. No infinite spinner. Evidence: `desktop-00-navigating.png` → `desktop-01-loaded-earth-default.png`; `mobile-00-navigating.png` → `mobile-01-loaded-earth-default.png`.

**2. Mobile planet selector reaches all planets/bodies — PASS**
Horizontal pill selector ("Planet X of 11") present below the canvas on mobile. Cycled through all 11 bodies (Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Ceres); each tap correctly updated both the 3D scene and detail panel. Evidence: `mobile-planet-{mercury,venus,earth,mars,jupiter,uranus,neptune,pluto,ceres,sun}.png`, `mobile-saturn-rings-check.png`.

**3. Saturn's rings fully framed — PASS on desktop, FAIL on mobile**
- Desktop: rings cleanly within canvas bounds with margin on all sides. Evidence: `desktop-planet-saturn.png`, `desktop-saturn-rings-check.png`.
- Mobile: ring geometry and the "SATURN" label are visibly cut off by the right edge of the canvas. Evidence: `mobile-saturn-rings-check.png`. This contradicts an in-code comment in `OrbitSandbox.tsx` claiming a "Wave 6 P1 fix" for ring clipping "on both desktop and mobile viewports" — the fix computes camera distance only from the vertical FOV/frustum, not the narrower horizontal frustum on portrait mobile.

**4. Ceres and multiple planets visually distinct — PASS**
Earth (blue, cloud/continent texture, visible moon), Jupiter (banded gas-giant texture), Saturn (ringed), Mars, and Ceres (small, correctly scaled-down dwarf planet with its own tag) all render as distinct, non-duplicated models at both viewports, detail panel updates correctly per selection. Evidence: `desktop-planet-jupiter.png`, `desktop-planet-earth.png`, `desktop-planet-ceres.png`, `mobile-planet-ceres.png`.

**5. Loading/error state, toolbar — Loading: PASS. Toolbar: PASS. Error state: PARTIAL/graceful, no dedicated UI.**
Simulated asset-load failure by blocking all `.glb`/texture network requests. App did not crash or hang; each `PlanetModel` gracefully falls back to a plain placeholder sphere (console: `[PlanetModel] GLB failed to load, showing placeholder sphere instead`), rest of UI stayed functional. No dedicated user-facing error banner/message — degradation is silent rather than communicated to the learner. Evidence: `desktop-error-state-attempt.png`, `console-error-attempt.log`.

Toolbar (desktop): Rotate, Isolate, Zoom In/Out, Reset, Compare (opens well-formed "X vs. Y" modal, no overflow), More menu (Show labels / X-Ray view / Fit view / Clean view) all confirmed reachable and functional with clear cause/effect. "Section" (cross-section) button present but disabled, no tooltip explaining why. Mobile: same icon set present and tappable, More menu opens correctly. Evidence: `desktop-interact-00..05-*.png`, `desktop-toolbar-overview.png`, `mobile-toolbar-overview.png`, `mobile-more-menu-open.png`.

## Console/network errors
Normal run (both viewports): zero console errors or page errors. Only benign warnings (`THREE.Clock deprecated`, occasional `GPU stall due to ReadPixels` desktop-only, self-throttling). No failed requests. Simulated asset-failure run: expected `ERR_FAILED`/`Failed to fetch` per blocked asset, each paired with a caught `[PlanetModel]` fallback log — failures are caught, not unhandled.

## No internal QA/debug language observed in UI copy.

## Findings

**P1 — significant**
1. Saturn's rings are clipped by the canvas's right edge on mobile (390x844) when Saturn is selected — both ring geometry and the "SATURN" label are cut off, contradicting the in-code claim that the camera-framing fix covers both viewports (it only accounts for vertical FOV, not the narrower horizontal frustum on portrait). Evidence: `mobile-saturn-rings-check.png`.

**P2 — polish**
1. "Section" (cross-section) toolbar button visibly present but disabled with no tooltip/label explaining why, on both viewports. Evidence: `desktop-toolbar-overview.png`.
2. Asset-load failure fallback (placeholder spheres) is silent — no learner-facing message communicates a model failed to load, only a visual downgrade to a flat colored sphere. Evidence: `desktop-error-state-attempt.png`.

No P0s found. App is reachable, loads to completion, no crashes, core interactions (planet selection, toolbar controls, compare) all produce clear cause/effect.

## Files inspected (read-only)
`src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`. No product/source files modified.
