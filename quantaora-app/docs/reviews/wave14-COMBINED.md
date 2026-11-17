# Wave 14 Visual Acceptance — Combined Coordinator Verdict

**Date:** 2026-08-18
**Method:** 10 independent Sonnet reviewers, each with its own isolated Playwright/Chromium
install (`/tmp/wave14-<scope>-qa`, `playwright@1.62.1`) and browser context, run in parallel
against a single shared dev server at `http://127.0.0.1:5174` (not stopped/restarted/shared
between reviewers). Strictly read-only against product source — no fixes applied.
**Evidence root:** `review-screenshots/wave14-2026-08-18/<scope>/`
**Per-scope reports:** `docs/reviews/wave14-<scope>.md`

**Note on evidence hygiene:** the repo's git root is the parent of `quantaora-app/`
(`/Users/ahmedjawed/Documents/Kids Learning app/`), which has its own top-level `docs/` and
`review-screenshots/` trees unrelated to this app. 5 of 10 reviewers (crystal-failure, plants,
number-sense screenshots, orbit screenshots, cross-lab-glb-failure) initially wrote into that
parent tree instead of `quantaora-app/`. The coordinator detected this after each affected
agent's completion and relocated all misplaced reports/screenshots into the correct
`quantaora-app/docs/reviews/` and `quantaora-app/review-screenshots/wave14-2026-08-18/` paths
before compiling this verdict — all 10 scopes are now consolidated in the locations named above.

## Overall verdict by scope

| # | Scope | Verdict | P0 | P1 | P2 |
|---|---|---|---|---|---|
| 1 | Crystal — normal flow | CONDITIONAL PASS | 0 | 2 | 0 |
| 2 | Crystal — failure flow | PASS (Wave 12 P0 fixed) | 0 | 2 | 1 |
| 3 | Plants | CONDITIONAL PASS | 0 | 4 | 3 |
| 4 | Energy | CONDITIONAL PASS | 0 | 1 | 0 |
| 5 | Number Sense | **FAIL** | **1** | 3 | 2 |
| 6 | Math Data/Cup | PASS | 0 | 0 | 2 |
| 7 | Orbit | CONDITIONAL PASS | 0 | 3 | 1 |
| 8 | Moons | CONDITIONAL PASS | 0 | 1 | 1 |
| 9 | Mechanics | CONDITIONAL PASS | 0 | 1 | 2 |
| 10 | Cross-lab GLB failure (Genetics/Microbiology/Math cup) | CONDITIONAL PASS | 0 | 1 | 0 |
| | **Total** | | **1** | **18** | **12** |

## Regression tracking vs. Wave 12

**Fixed since Wave 12:**
- Crystal GLB fetch failure no longer crashes the whole app to a blank page (was P0; `CrystalViewer.tsx` now has a `GlbErrorBoundary` and shows a graceful in-canvas error card).
- Graphite no longer visually vanishes edge-on during auto-rotate (was P1).
- Moons gravity comparator's fall/bounce behavior now visibly and correctly scales with each moon's real gravity value; polar hotspots no longer sit under the mobile toolbar (both were P1).

**Still open / regressed:**
- Silicon Carbide materials still not reliably distinguishable — the fix (a color legend) is itself hidden behind the toolbar (Wave 12 P1 → still P1, root cause moved).

**New findings this wave (not in Wave 12 scope or newly surfaced):**
- Number Sense place-value hotspots unclickable (P0) — likely pre-existing, not previously tested this deeply.
- Crystal-failure retry button non-functional; orbit Saturn/Ceres clipping + inert Zoom In; plants mobile clipping/canvas-height; moons hotspot label pill stacking; mechanics prop clustering; cross-lab microbiology retry-button obstruction.

## P0 — Broken/blocking (1)

**Number Sense — Place Value hotspots are completely unclickable and invisible-to-pointer at both viewports.**
`AbacusStage`'s wrapper div (`NumberSenseLab.tsx` ~line 1384) is `z-10`; the hotspot `<button>`s (`HotspotButton`, ~line 1028-1042) have no explicit `z-index` (`auto`), so per CSS stacking rules the canvas always paints on top and intercepts all pointer events. Confirmed via `document.elementFromPoint()` at all 4 hotspot coordinates on both viewports (100% CANVAS, never the button). This is specific to Place Value — the other 9 Number Sense components render their visual as an `<svg>` sibling with no explicit z-index and their hotspots work correctly (control-case confirmed by clicking an Addition hotspot). Practical impact: 3 of 4 place-value concepts ("Tens place", "Regroup ones", "Digit → number") are entirely unreachable through the UI; only "Hundreds place" is reachable via a toolbar Isolate workaround that isn't a hotspot browser.
Evidence: `review-screenshots/wave14-2026-08-18/number-sense/`, full report `docs/reviews/wave14-number-sense.md`.

## Next fix batch (priority order)

1. **[P0]** Fix Number Sense place-value hotspot stacking — give `HotspotButton` a `z-index` above `AbacusStage`'s `z-10` wrapper (or restructure so hotspots aren't a lower sibling), in `src/routes/NumberSenseLab.tsx`. Also address P1: hotspot selection produces no visible change on the abacus model itself (`AbacusStage` never receives `activeHotspotId`).
2. **[P1]** Crystal Structures — Silicon Carbide's material-distinguishing color legend renders behind the toolbar at both viewports; also its on-canvas caption text wraps illegibly behind the toolbar at desktop. (`ChemistryLab.tsx` / crystal viewer components)
3. **[P1]** Crystal Structures failure flow — the "Try again" retry button after a simulated GLB failure fires no new network request and never recovers the model (graceful-degrade UI is otherwise correct).
4. **[P1]** Plants — mobile: full-bloom flower and tasseled-corn models clipped by the canvas badge overlay while the Tune panel is open; root cause is canvas dropping to ~32% of viewport height with the panel open (below the 40% bar). Tablet 1024×768: "Reset" toolbar button ~60% obscured by BottomTray with `overflow:hidden` and no scroll cue.
5. **[P1]** Orbit — Saturn clipped by the left canvas edge on mobile (persistent, not a frame glitch); Ceres clipped at desktop+mobile (its dedicated close-focus camera doesn't keep it in frame); "Zoom In" toolbar button is inert for Saturn and Neptune (no cause/effect feedback).
6. **[P1]** Cross-lab GLB failure — Microbiology's "Try again" button is visually obstructed by the still-open "Tune microbe" panel after a simulated virus GLB failure (both whole-virion and cutaway variants); no cue that the panel needs closing first.
7. **[P1]** Moons — hotspot label pills stack and hide each other when multiple are shown: Enceladus (Tiger Stripes hidden under South Polar Geysers) at both viewports; Earth's Moon (Tycho Crater) and Io (Loki Patera) mobile-only.
8. **[P1]** Mechanics — in `motion-measure` mode, baseball and measuring-tape props sit close enough to the cart at default camera framing to visually blend into one cluster (true 3D coordinates are separated; only a framing/readability issue).
9. **[P2 batch]** Math-cup liquid color mismatch vs. "milkandbanana" asset name; overlapping hotspot dots on data table rows; Energy's intermittent (2/6 runs) late-render of the generator/stove prop (self-resolves, no errors); plants tablet label wrapping/small early-stage models/chevron overlap; number-sense "Back to..." 20px tap target and switcher-chip touch targets; orbit max-zoom-out legibility; mechanics subtle auto-rotate and flat baseball texture.

## Unproven / not independently covered (see individual reports for full lists)

- Crystal normal-flow reviewer did not re-test the GLB-failure scenario (covered separately by reviewer 2).
- Math-cup: only the `decimal`/`fraction` sub-components were screenshotted; denominator/equivalent-fraction/numerator/percent were not individually verified.
- Cross-lab: mobile viewport skipped for all 3 labs (desktop-only per scope); microbiology cutaway variant's nav-away was inferred from the whole-virion result, not independently re-run.
- Mechanics: friction-slope/momentum-energy interaction depth, fullscreen toggle, and 8 of 13 components' modal text not sampled.
- Orbit: touch gestures and tablet viewport not tested; Motion/Mission panel not covered.
- Real-GPU/hardware-accelerated rendering and full accessibility (screen reader) passes were not performed anywhere — all runs used headless/software rendering.
