# Wave 8 QA — Crystals (material-fixed derivatives) + BranchLab

Date: 2026-08-18
Viewports: desktop 1440x900, mobile 390x844 (spot-check)
Screenshots: `review-screenshots/wave8-2026-08-18/crystals-branchlab/` (36 files)

**Methodology note:** the three "material-fixed" crystal derivatives are not wired into the app (confirmed via `modelRegistry.ts`/`ChemistryLab.tsx` — `docs/assets/reviews/crystal-material-fix.md` explicitly says integration was never done, status "visual-review-pending"). Rendered directly from served GLB URLs (`/models/sourced/chemistry-gaps-wave2/*-material-fixed.glb`) via `<model-viewer>` at 4 camera angles (front/side90/back180/top-down), same method as the prior Wave 6 review. Console/page errors during crystal capture: none.

## Part 1 — Crystals (3 material-fixed derivatives)

| Asset | Verdict | Evidence |
|---|---|---|
| `crystal-diamond-carbon-nih-material-fixed.glb` | **CONDITIONAL** | `crystal-1-diamond/desktop-{front,side90,back180,top-down}.png`, `mobile-front.png` |
| `crystal-silicon-carbide-2h-nih-material-fixed.glb` | **PASS** | `crystal-2-silicon-carbide/desktop-{front,side90,back180,top-down}.png`, `mobile-front.png` |
| `crystal-graphite-sheet-nih-material-fixed.glb` | **PASS** | `crystal-3-graphite/desktop-{front,side90,back180,top-down}.png`, `mobile-front.png` |

- **Diamond (CONDITIONAL):** Tetrahedral bonded-carbon cage geometry correct and fully in-frame at every angle, no clipping. But the pale blue-white translucent material reads as washed-out/near-invisible against the off-white review background, especially at `back180` and `side90` — confirms the exact open concern flagged in `docs/assets/reviews/crystal-material-fix.md` ("clear gem" vs "washed out"). Technically distinguishable from the other two (by being far paler) but not for the right reason — a learner could mistake it for a broken/empty render rather than a deliberate clear-gem material.
- **Silicon carbide (PASS):** Blue-grey opaque material clearly visible, faceted low-poly shading reads as intentional, hexagonal wurtzite-stack topology legible and unmistakably distinct from both siblings, no clipping at any angle.
- **Graphite (PASS):** Near-black opaque material with visible sheen, unmistakable flat honeycomb sheet (confirmed edge-on at `side90`), most visually distinct of the three, no clipping at any angle.

## Part 2 — BranchLab (3 states)

**a) CLEAR — PASS.** `/app/labs/branch/atoms-and-elements`, default "Atom" component (hero CLEAR asset `atom.glb`). Real 3D atom renders correctly, no fallback note, toolbar fully reachable. Hotspot click and Isolate toggle both produced clear, legible cause/effect (DetailPanel swaps to a hotspot-specific "One atom" card with a "Back to Atom" breadcrumb). Evidence: `branchlab-clear-state-atom-desktop.png`, `-before-hotspot.png`, `-after-hotspot-click.png`, `-after-isolate-toggle.png`, `-mobile.png`.

**b) REVIEW — NOT LIVE-REACHABLE (see P1).** Every `licenseStatus: 'REVIEW'` asset in `modelRegistry.ts` (9 total: brain/eyeball/heart/intestine/kidneys/liver/lungs/pancreas/skin) belongs exclusively to the `human-anatomy` branch, and `branchLabAssetPresentation.ts` explicitly excludes `human-anatomy` (`ANATOMY_BRANCH_ID`) from the REVIEW-fallback logic. Verified live at `/app/labs/branch/human-anatomy` -> "Heart": the real, legally-unconfirmed `heart.glb` renders as a full hero model with zero footer note — visually identical to a fully-cleared asset. The honest-fallback path (`childSafeAssetNote`) is unit-tested with a synthetic fixture in `BranchLab.test.ts` but is dead code for every real component in the shipped catalog today. Evidence: `branchlab-anatomy-review-status-asset-desktop.png` (default "Blood Vessels"), `branchlab-anatomy-heart-review-asset-desktop.png` (Heart).

**c) missing/not-yet-available — PASS on the note's own wording, but see P0 below for a leak in adjacent UI.** `/app/labs/branch/atoms-and-elements` -> "Electron", and `/app/labs/branch/algebra` -> "Coefficient" (neither has a registered GLB). Both show a procedural illustration plus the identical honest note "Illustrated 3D model, built to teach this topic clearly." — no internal vocabulary in that specific note. Evidence: `branchlab-missing-state-electron-desktop.png`, `branchlab-missing-state-electron-tallviewport.png`, `branchlab-missing-state-algebra-coefficient-desktop.png`, `branchlab-missing-state-algebra-mobile.png`.

Console/page errors during BranchLab navigation: none.

## Findings

**P0 — internal-text leak**
BranchLab's left sidebar ("Other branches of `<subject>`" list, `ContentNav.tsx:117`) shows a badge reading **"Needs sourcing"** for any locked/not-yet-built branch — literal internal asset-sourcing-pipeline vocabulary, visible to any end user on every branch's BranchLab page (confirmed live on `/app/labs/branch/atoms-and-elements`: States Of Matter, Acids And Bases, Solutions, Stoichiometry, Organic Chemistry, Biochemistry all show it). This is exactly the class of leak the task calls out ("sourcing TBD"-type language). Code: `src/components/explorer/ContentNav.tsx:117` — `b.status === 'authored-pending' ? 'Not built yet' : 'Needs sourcing'`. Evidence: `branchlab-missing-state-electron-tallviewport.png`.

**P1 — notable quality issues**
1. Diamond crystal derivative reads as washed-out/near-invisible at several camera angles — not ready to integrate without a contrast/opacity pass (confirms the open question already flagged in `docs/assets/reviews/crystal-material-fix.md`). Evidence: `crystal-1-diamond/desktop-back180.png`, `desktop-side90.png`.
2. The BranchLab REVIEW->honest-fallback code path is unreachable through any real live navigation: the only branch that actually holds legally-unconfirmed (REVIEW) 3D assets ships them as full, unlabeled hero content indistinguishable from cleared assets. This is a documented, intentional design decision (Anatomy's separate approved pathway), not a text leak — but it means the honest-REVIEW-state UX has never actually been exercised by a real user path. Evidence: `branchlab-anatomy-heart-review-asset-desktop.png`.

**P2 — polish**
None beyond the above. CLEAR and missing-state footer copy is otherwise clean, honest, and (by deliberate, tested design) intentionally reuses identical wording across REVIEW/missing cases — not a bug.

## Files inspected (read-only)
`docs/assets/reviews/crystal-material-fix.md`, `docs/assets/reviews/chemistry-gaps-wave2-visual.md`, `src/routes/BranchLab.tsx`, `src/routes/branchLabAssetPresentation.ts`, `src/routes/BranchLab.test.ts`, `src/data/modelRegistry.ts`, `src/data/branchModules.ts`, `src/data/hierarchy.ts`, `src/App.tsx`, `src/components/explorer/ContentNav.tsx`, `src/components/explorer/GenericModel.tsx`. No product/source/asset files modified (verified via `git status`).
