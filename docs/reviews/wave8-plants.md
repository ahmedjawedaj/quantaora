# Wave 8 QA — Plants

Date: 2026-08-18
Route: `/app/labs/plants`
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/plants/` (54 PNGs + console-log-full.txt + console-log.txt)

No `console.error` or `pageerror` events captured in any session — only benign warnings (`THREE.Clock deprecated`, GPU `ReadPixels` perf warning).

## Checklist verdicts

**1. Component/stage switcher — PASS**
Desktop left sidebar list and mobile horizontal chip row both correctly switch across all 9 components (Chloroplast, Flower, Leaf, Phloem, Root, Seed, Stem, Stomata, Xylem). Evidence: `desktop-02-seed-selected.png`, `desktop-06-flower-selected.png`, `mobile-02-seed-selected.png`, `mobile-06-flower-selected.png`.

**2. Corn/flower growth-stage assets real and distinct — PASS (asset content), see P0 #1 below for visibility bug**
Each stage loads a genuinely different GLB, not a placeholder/reused mesh:
- Corn: seedling → young stalk → taller stalk → tasseled stalk with visible cobs/tassel (`desktop-14-corn-panelclosed-stage1..4.png`).
- Flower: closed bud → opening bud → full purple/magenta bloom (`desktop-15-flower-panelclosed-stage1..3.png`, `mobile-15-flower-panelclosed-stage3.png`).
Framing/scale is shared correctly across the sequence and no clipping of the model geometry itself was observed.

**3. Tune panel boundedness — PASS**
Desktop panel `x:356 y:162 w:448 h:495` inside 1440x900 (no overflow). Mobile panel `x:12 y:187 w:366 h:337.6` inside 390x844 (no overflow); uses `max-h-[40svh]` + internal scroll, controls not clipped. Evidence: `desktop-05-tune-panel-seed.png`, `mobile-05-tune-panel-seed.png`.

**4. Mobile stats display legibility — PASS (text), see P0 #1 below for layout side-effect**
Stat cards (Molecule/Growth/Stage/Conditions/Nutrients/Next/3D stage) render with fully legible text, no truncation/overlap of the cards themselves, fit mobile viewport width. Evidence: `mobile-13-corn-stage4-panelclosed.png`, `mobile-14-corn-panelclosed-stage4.png`.

**5. Stage-5 exclusion & cause/effect — MIXED**
- Stage-5 exclusion: PASS, intentional and documented. `src/data/generated/plants.ts` (lines 1781–1800) explicitly documents why corn only has 4 of 5 source stages (stage 5 was a detached, husked "harvest crop" asset, rejected in Wave 2 visual review as not a taller continuation of the standing plant) and flower only 3 of 4 (the "stage 1 bud" file rendered as a generic two-blade sprout, so the sequence intentionally starts at stage 2). Deliberate, reasoned content decision, not a broken/missing state.
- Seed germination sliders → cause/effect: PASS. Tuning water/warmth/nutrients (or "Try: dry + cold" preset) visibly and immediately updates germination % (65%→2%), stage label ("Shoot rises"→"Dry seed"), and stall reason text. Evidence: `desktop-11-seed-before-drycold.png` / `desktop-12-seed-after-drycold.png`.
- Flower pollination → cause/effect: PASS in procedural mode, P1 in real-3D-growth mode. In default procedural flower scene, "Bee visits" visibly animates gold pollen particles toward the stigma (`desktop-16...png` → `desktop-17...png`). But with "Real 3D growth" toggled on, `FlowerGrowthScene` renders instead with no pollen-path/seed-forming visuals — pollinating only changes text, zero visible scene change (`desktop-09-flower-before-pollinate.png` / `desktop-10-flower-after-pollinate.png`).

## Findings

**P0 — Corn growth-stage model is obscured by UI overlay, defeating the feature's purpose (both viewports, worse on mobile).**
The "Real 3D growth" stat-card overlay sits directly over the lower-center of the canvas, exactly where the short early-stage corn seedling sits. At corn stage 1 and 2, the plant is essentially invisible — only a ~10px sliver of green sprout peeks above the card row (2x crop of `desktop-14-corn-panelclosed-stage1.png`). Stage 3 shows a small sliver; only stage 4 is clearly visible. On mobile it's worse: stage 1 shows zero visible plant, stage 4 shows only a ~15px sliver squeezed between two card columns, tasseled top and leaves clipped on both sides. Evidence: `desktop-14-corn-panelclosed-stage1.png`, `desktop-14-corn-panelclosed-stage2.png` (compare `desktop-14-corn-panelclosed-stage4.png`), `mobile-14-corn-panelclosed-stage1.png`, `mobile-14-corn-panelclosed-stage4.png`. The flower sequence does not have this problem — it sits higher in frame and stays clear of the card overlay at all 3 stages, both viewports.

**P0/P1 — Opening the Tune panel covers most/all of the canvas, hiding the model while the user is actively scrubbing the growth-stage slider.**
Desktop: open Tune panel covers roughly two-thirds of canvas width — no corn plant visible in `desktop-04-corn-stage-1.png` through `-4.png`, only a beige ground-plane sliver. Mobile: Tune panel covers essentially the entire canvas — model 100% hidden while dragging the stage slider (`mobile-04-corn-stage-1.png`, `mobile-04-corn-stage-4.png`). Since the growth-stage slider lives inside the Tune panel, the "scrub through stages and watch it grow" interaction gives no visible feedback until the panel is closed.

**P1 — Pollination has no visible effect in "Real 3D growth" mode.**
Tapping "Bee visits" while real-3D flower growth is active produces no visual change in the scene, only text-panel updates. Cause/effect is legible in default procedural mode but silently drops when the real-3D toggle is on. Evidence: `desktop-09-flower-before-pollinate.png`, `desktop-10-flower-after-pollinate.png`.

**P2 — Canvas backdrop reads grayish-tan rather than the intended warm cream (`#F0E7DA`).**
Likely a lighting/exposure effect rather than a color bug; worth a design look for consistency with the "warm off-white" bar. Evidence: any `desktop-*` screenshot, e.g. `desktop-01-initial.png`.

**P2 — No internal/QA/placeholder text observed.** All copy checked reads as intended learner-facing content.

## Files inspected (read-only)
`src/routes/PlantsLab.tsx`, `src/data/generated/plants.ts`, `src/App.tsx`, `src/components/explorer/ContentNav.tsx`. No product/source files modified.
