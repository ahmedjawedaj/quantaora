# Wave 20 QA — Number Sense, hotspot-to-visual-highlight correctness

Reviewer: Wave 20 reviewer — number-sense visual scope (read-only visual QA), Sonnet
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Scope: `NumberSenseLab` at `/app/labs/number-sense`, Place Value component, 4 hotspots (`hs-hundreds`, `hs-tens`, `hs-regroup-ones`, `hs-digit-number`), desktop 1440x900 + mobile 390x844.
Method: isolated Playwright (Chromium) from `/tmp/wave20-numbersense-visual-qa`, `page.on('console')` / `page.on('pageerror')` active throughout. Pixel diff via `pixelmatch` + manual per-pixel RGB-threshold pass bucketed into left/mid/right thirds approximating hundreds/tens/ones rod columns. Read-only source inspection: `src/routes/NumberSenseLab.tsx` (HotspotButton, `ABACUS_HOTSPOT_ROD`, `ROD_GLOW_COLOR`), `docs/reviews/wave18-number-sense.md`.

Evidence directory: `review-screenshots/wave20-2026-08-18/number-sense-visual/`.

## Prior finding being re-checked

No `docs/reviews/wave19-number-sense-visual.md` exists. Wave 18 confirmed hotspots are clickable and update the DetailPanel text, but flagged (as an additional/secondary note) that hotspot selection produced no visible change on the 3D abacus model. In-code "Wave 19 fix" comments in `NumberSenseLab.tsx` (~lines 1354–1392) describe a fix for exactly this. This wave verifies the fix: does clicking a hotspot visibly highlight the *corresponding* rod/beads while overall geometry stays legible?

## Overall verdict: 0 P0, 0 P1, 0 P2 — fixed, confirmed correct

## Results (PASS/FAIL per hotspot per viewport)

| Hotspot | Desktop 1440x900 | Mobile 390x844 |
|---|---|---|
| `hs-hundreds` → hundreds rod (coral glow) | **PASS** | **PASS** |
| `hs-tens` → tens rod (green glow) | **PASS** | **PASS** |
| `hs-regroup-ones` → ones rod (amber glow) | **PASS** | **PASS** |
| `hs-digit-number` → all 3 rods | **PASS** | **PASS** |

For each hotspot × viewport: baseline canvas crop → click hotspot (confirmed `aria-pressed` flips true) → after crop → pixel diff + diff-mask visualization.

- `hs-hundreds`: diff pixels 100% confined to the left third (`colRight: 0` both viewports) — coral glow + emissive tint specifically on the hundreds (leftmost) rod plus its label. Evidence: `desktop-hundreds-{before,after,diff}.png`, `mobile-hundreds-{before,after,diff}.png`.
- `hs-tens`: diff pixels 100% confined to the middle third (`colLeft: 0`, `colRight: 0`) — green glow on tens (middle) rod only. Evidence: `desktop-tens-*.png`, `mobile-tens-*.png`.
- `hs-regroup-ones`: diff pixels concentrated in the right third (`colLeft: 0`), with the small mid-third component explained by the hotspot's text-label pill (confirmed via diff-mask, no second rod glow) — amber glow correctly on the ones (rightmost) rod. Evidence: `desktop-regroup-ones-*.png`, `mobile-regroup-ones-*.png`.
- `hs-digit-number`: diff pixels present in all three thirds, consistent with the coded "highlight all rods" behavior for this hotspot. Evidence: `desktop-digit-number-*.png`, `mobile-digit-number-*.png`.

Full-page baselines (`desktop-fullpage-baseline.png`, `mobile-fullpage-baseline.png`) confirm the abacus frame/legs/crossbar remain fully visible, centered, and undistorted, with toolbar/rod controls reachable at both viewports — the highlight effect does not degrade geometry legibility.

## Console/page errors

**PASS.** Zero `pageerror` events across all sessions (5 loads per viewport: 4 hotspot iterations + 1 fullpage-baseline reload). Only benign messages: `THREE.Clock` deprecation, Vite HMR, React DevTools banner. No `console.error`.

## Findings by severity

- **P0:** none.
- **P1:** none.
- **P2:** none.

**Conclusion:** Wave 18's secondary finding ("hotspot selection produces no visible change on the 3D model") is fixed. Highlight is visible, correctly localized to the matching rod (or all three for the digit-number hotspot), at both viewports, with no geometry-legibility regression.
