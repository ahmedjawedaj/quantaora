# Wave 24 Visual QA — Orbit Lab (`/app/labs/orbit`), consolidated status card

**Scope:** Orbit lab only (`SpaceLab.tsx` + `OrbitSandbox.tsx`), read-only. **Route:** `http://127.0.0.1:5174/app/labs/orbit`. **Viewports:** desktop 1440×900, mobile 390×844. **Date:** 2026-08-18. Independent Playwright/Chromium instance, single `chromium.launch()` + a fresh `browser.newContext()` per viewport — no shared state with the concurrent Moons-lab reviewer. Source read (read-only, no edits): `src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`, `src/components/explorer/orbitStatusCardConsolidation.test.ts`, `src/components/explorer/CanvasControls.tsx`, `docs/reviews/wave22-orbit.md`.

**Evidence location note (coordinator-verified):** screenshots for this scope were written under `quantaora-app/review-screenshots/wave24-2026-08-18/orbit/` (i.e. `/Users/ahmedjawed/Documents/Kids Learning app/quantaora-app/review-screenshots/wave24-2026-08-18/orbit/`, relative to the `quantaora-app` working directory the reviewer ran in) rather than the repo-root `review-screenshots/` the Moons reviewer used — both locations verified present on disk; 22 files confirmed for this scope. Raw measurement dump and console log were written to `/tmp/wave24-orbit/` (scratch, not part of the repo).

**Methodology:** fresh load per viewport → select Ceres → 5× [drag camera (verified via `elementFromPoint` hitting `CANVAS`) → reselect Ceres → idle 10s → measure `getBoundingClientRect()` for card/name/spin/orbit/stage/toolbar] → select Saturn → same 5-cycle protocol for Saturn. 10 cycles × 2 viewports = 20 total cycles, each with a genuine `dragStartHitTest: "CANVAS"` (20/20 confirmed), plus 4 initial-selection snapshots = 24 measurement points total.

## Wave 22 regression re-test — **PASS**, structurally resolved, 0/24 overlaps

The Spin/Orbit collision class is gone, and not merely "not currently reproducing" — it is structurally impossible in the new design. Evidence:

- **Source confirms the mechanism change**: `OrbitSandbox.tsx` no longer registers `registerLabel(`${body.id}:spin`...)` / `:orbit` pills or defines `LabelDeclutter`; the selected body's Name/Spin/Orbit now render once as a single plain-DOM card (`data-testid="orbit-status-card"`) in `SpaceLab.tsx`, positioned with static Tailwind classes (`absolute right-3 top-1/2 -translate-y-1/2`), not a 3D projection.
- **Measured**: the card's rect was bit-identical across all 10 cycles at each viewport, despite 10 genuine camera drags per viewport in between:
  - Desktop: `card {left:936, right:1064, top:353.5, bottom:431.5}` on every one of the 12 desktop measurement points.
  - Mobile: `card {left:266, right:378, top:236, bottom:314}` on every one of the 12 mobile measurement points.
  - Name/Spin/Orbit sub-row rects equally identical within each viewport across every cycle.
- **Visual confirmation the drags were real**: `desktop-select-ceres.png` vs `desktop-ceres-cycle-1-settled.png` — Jupiter and the Sun visibly swing to different screen positions after the drag, while the status card stays pinned at the exact same pixel rect.
- **Sub-row (Name/Spin/Orbit) internal geometry** — the exact pairing Wave 22 found overlapping — renders as three vertically-stacked flex rows inside one card, with clean positive gaps at every one of the 24 measurement points:
  - Desktop: Name `{top:364.5, bottom:380.5}`, Spin `{top:386.5, bottom:401.5}` → gap 6px; Spin `{bottom:401.5}`, Orbit `{top:405.5, bottom:420.5}` → gap 4px.
  - Mobile: Name `{top:247, bottom:263}`, Spin `{top:269, bottom:284}` → gap 6px; Spin `{bottom:284}`, Orbit `{top:288, bottom:303}` → gap 4px.
  - `overlapY = min(bottom) − max(top)` is negative (clear) for every pair, every cycle, both viewports — 0/24 measurement points show any overlap, vs. Wave 22's 20/20 Spin-vs-Orbit overlap rate.

Screenshots: `desktop-ceres-cycle-{1..5}-settled.png`, `desktop-saturn-cycle-{1..5}-settled.png`, `mobile-ceres-cycle-{1..5}-settled.png`, `mobile-saturn-cycle-{1..5}-settled.png` all show a single clean card with "SPIN" and "ORBIT" fully legible, no obscuring.

## Selection correctness (Ceres vs Saturn) — PASS

- Ceres: card text `"CeresSpin1.0xOrbit6d/s"` on all 6 Ceres measurement points per viewport, no staleness after reselect.
- Saturn: card text `"SaturnSpin1.0xOrbit6d/s"` on all 6 Saturn measurement points per viewport, correctly swapped with no lag or stale-name artifact in any of the 12 checks.
- **Observation (not a defect)**: the "Spin"/"Orbit" values (`1.0x`, `6d/s`) are driven by the sim's shared global `rotationSpeed`/`speed` state, not per-body physical data, so they're intentionally identical for Ceres and Saturn absent a speed-slider change. Only "Name" is expected to differ by selection, and did, correctly, on 12/12 checks. Inherited/existing behavior, not something the consolidation changed.

Ceres correctly exercised the `CLOSE_FOCUS_BODY_IDS` tight-zoom camera path; Saturn exercised the normal wide-framing/ring-safety path — two genuinely different camera behaviors as requested.

## Readability (no clipping/overflow) — PASS

`scrollWidth`/`scrollHeight` vs `clientWidth`/`clientHeight` check (Saturn selected, both viewports) found zero overflow on card, name, spin, or orbit elements. No `truncate`-ellipsis triggered for either body name at either viewport.

## Bounded within stage — PASS

Card fully inside `[data-lab-stage]` at every one of the 24 measurement points:
- Desktop: stage `{left:260, right:1080, top:64, bottom:721}`; card `{left:936, right:1064, top:353.5, bottom:431.5}` → right margin 16px (matches `sm:right-4`).
- Mobile: stage `{left:0, right:390, top:64, bottom:486}`; card `{left:266, right:378, top:236, bottom:314}` → right margin 12px (matches `right-3`).

## Drift / stability — PASS, zero unexplained drift

Card position had zero variance across all 20 real select→drag→reselect→idle-10s cycles at both viewports — the card is keyed off React state (`selected.name`/`rotationSpeed`/`speed`) via static CSS positioning, not a per-frame 3D projection, so there is no drift mechanism left to explain.

## No overlap with other UI (toolbar, panels, canvas markers) — PASS

- Desktop: toolbar rail `{left:276, right:332, top:80, bottom:483}` vs. card `{left:936, ...}` — 604px horizontal clearance.
- Mobile: toolbar row `{left:12, right:378, top:76, bottom:122}` vs. card `{top:236, ...}` — 114px vertical clearance.
- Bottom motion panel sits well below the card at both viewports in every screenshot; no collision. Card is `pointer-events-none`, so it cannot itself block toolbar/canvas interaction.

## Toolbar reachability — PASS

`button[aria-label="Rotate"]` visible and boundable on both viewports at end-of-run: desktop `{x:281, y:85, w:46, h:35.25}`, mobile `{x:19, y:83, w:33.4, h:32}` — both fully within stage bounds, both clickable. Full rail unobscured by the card in every screenshot on both viewports.

## Camera state & scene markers preserved — PASS

Cross-checked `desktop-select-ceres.png` vs. `desktop-ceres-cycle-1-settled.png` and `desktop-saturn-cycle-5-settled.png`: orbit rings render as clean concentric ellipses throughout, Ceres's persistent cyan halo ring stays correctly anchored across drags, Saturn's rings render fully un-clipped after a real camera drag. No markers disappeared or reset unexpectedly across any cycle.

## No internal QA/debug text leaking into UI — PASS

Card renders only "Ceres"/"Saturn", "Spin", "1.0x", "Orbit", "6d/s" — no `data-testid` values, no lorem/placeholder/debug strings visible in any of the 24 screenshots.

## Console / page errors

None observed. Deduplicated console output: Vite HMR connect/connected debug lines, React DevTools info banner, pre-existing benign `THREE.Clock` deprecation warning, and (desktop only) informational GL driver perf warnings. Zero `pageerror` events on either viewport.

## Summary table

| # | Check | Viewport | Result | Severity |
|---|---|---|---|---|
| — | Wave 22 Spin/Orbit overlap regression | desktop + mobile (20/20 cycles) | **PASS — 0/24 overlaps, structurally resolved** | — |
| 1–2 | Ceres/Saturn both selectable, distinct state | desktop + mobile | PASS (12/12 correct name swaps) | — |
| 3 | Card shows correct (non-stale) data per selection | desktop + mobile | PASS | — |
| 4 | Card text readable, no clipping/overflow | desktop + mobile | PASS (0/8 elements overflowing) | — |
| 5 | Card bounded within stage | desktop + mobile | PASS (24/24) | — |
| 6 | No drift; no overlap with toolbar/other UI | desktop + mobile | PASS (0 variance, 0 overlaps) | — |
| 7 | Camera state / scene markers preserved | desktop + mobile | PASS | — |
| — | Toolbar reachable | desktop + mobile | PASS | — |
| — | No debug/QA text in UI | desktop + mobile | PASS | — |
| — | Console/page errors | all | PASS (none) | — |

**No P0, P1, or P2 findings.** The consolidated status card fully resolves the Wave 22 P1 (Spin/Orbit overlap) and introduces no new regressions across every check in scope, at both viewports, across 24 measurement points.

## Screenshots

All under `quantaora-app/review-screenshots/wave24-2026-08-18/orbit/`:
- `desktop-select-ceres.png`, `desktop-select-saturn.png`
- `desktop-ceres-cycle-{1..5}-settled.png`, `desktop-saturn-cycle-{1..5}-settled.png`
- `mobile-select-ceres.png`, `mobile-select-saturn.png`
- `mobile-ceres-cycle-{1..5}-settled.png`, `mobile-saturn-cycle-{1..5}-settled.png`
