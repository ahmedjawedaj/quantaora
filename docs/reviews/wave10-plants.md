# Wave 10 Plants Lab — Visual QA Report

**Route:** `/app/labs/plants` · **Viewports:** mobile 390×844, narrow-desktop 1024×768, desktop 1440×900
**Method:** Isolated Chromium via Playwright (`chromium.launchPersistentContext`, profile at `/tmp/wave10-plants/profile`, not the shared/extension browser). Script: `/tmp/wave10-plants/qa.js`. Raw console/network capture: `review-screenshots/wave10-2026-08-18/plants/_console-log.txt`. All 79 screenshots are in `review-screenshots/wave10-2026-08-18/plants/`.

---

## P0 — Blocking

**1. Tune panel fully or near-fully hides the 3D canvas on mobile (390×844) while scrubbing growth stages.**
- Corn, stage 1: canvas shows zero plant geometry, only the empty background plane — `04-corn-stage1-mobile.png`.
- Flower, stage 1 (bud): canvas is **100% obscured**, no flower visible at all — `16-flower-stage1-mobile.png`. Flower panel is taller (extra "Hide the pollen path" toggle + growth toggle + slider), so it eats the whole 56svh canvas height.
- This directly violates the "canvas remains visible while scrubbing" requirement — a learner scrubbing corn/flower growth stages on a phone cannot see the model change live; they must close the panel after every drag to check the result.
- Evidence: `04-corn-stage1-mobile.png`, `04-corn-stage4-mobile.png` (still ~60% covered even at the tallest stage), `16-flower-stage1-mobile.png`, `16-flower-stage3-mobile.png` (only a small sliver of the bloom visible above the sheet).

**2. Tune panel fully obscures the 3D canvas at narrow desktop (1024×768) for every component, whenever it's open.**
- With Tune plant open (right-docked panel per the `lg:` breakpoint, which triggers at exactly 1024px), the panel (22rem/352px wide) plus the always-on CanvasControls toolbar rail together consume the *entire* width of the narrow center column (~404px), leaving **0% of the model visible** — only the empty background plane shows.
- Reproduced identically on Seed/Corn, Root, and Flower: `03-corn-tune-open-narrowdesktop.png`, `09-root-tune-beforescrub-narrowdesktop.png`, `11-root-tune-afterscrub-high95-narrowdesktop.png`, `15-flower-tune-open-narrowdesktop.png`, `16-flower-stage3-narrowdesktop.png`.
- This is the exact "especially the narrow ones" failure case called out in the task brief.

**3. CanvasControls toolbar rail visually overlaps and occludes the Tune panel at 1024×768, cutting off panel text.**
- Panel header renders as `…E PLANT · SEED` (missing "TUN"), button labels render as `…ide real corn growth stages (3D)`, `…ide the pollen path`, `…mpare growing conditions`, `…w Peel the soil away`, `…t water uptake` — the toolbar rail icon column paints directly on top of the left edge of the panel.
- Evidence: `04-corn-stage1-narrowdesktop.png`, `04-corn-stage4-narrowdesktop.png`, `09-root-tune-beforescrub-narrowdesktop.png`, `16-flower-stage3-narrowdesktop.png`.

## P1 — Significant

**4. "PLANTS · TAP PARTS · TRACE HOW A PLANT WORKS" canvas-overlay pill is clipped at 1024×768, in every state, including on first paint (no interaction required).**
- Renders as `LANTS · TAP PARTS · TRACE HOW A PLANT WORKS` — the leading "P" and part of the pill's rounded background are cut off on the left, even on the default landing screen with no panel open.
- Evidence: `00-landing-narrowdesktop.png` (default Chloroplast view, first load), `01-corn-select-narrowdesktop.png`, `08-root-select-narrowdesktop.png`, `13-flower-select-narrowdesktop.png`.

**5. Stat rail (top-right chip row) is clipped on the right edge at 1024×768.**
- e.g. Root shows `MOLECULE Root  WATER rushing upward  A…` with the next chip(s) cut off mid-word by the right detail panel's edge; Flower shows `MOLECULE Flower  POLLEN on the anther` similarly truncated.
- Evidence: `08-root-select-narrowdesktop.png`, `13-flower-select-narrowdesktop.png`, `02-corn-statrail-narrowdesktop.png`.
- Note: on mobile and 1440 desktop the same chip row is intentionally horizontally-scrollable (`overflow-x-auto`) and the last chip is cut by design at the container edge — that is expected/PASS behavior (`02-corn-statrail-mobile.png`, `02-corn-statrail-desktop.png`). The 1024px case is different: it's the pill and rail that are structurally too wide for the narrowed center column, not an intentional scroll affordance.

## P2 — Polish

**6. Corn growth "Stage 1 — seedling" is very hard to see at all viewports.**
- The seedling model is scaled uniformly with the full-grown corn stalk (shared-scale-by-largest-stage, by design), so at stage 1 it renders as a barely-visible thin sliver against a similarly-toned background — easy for a learner to mistake for a blank canvas even though *something* is technically rendering.
- Evidence: `04-corn-stage1-desktop.png`, `04-corn-stage1-mobile.png` (compare against the clearly-visible `04-corn-stage4-desktop.png`).

---

## PASS items (with evidence)

- **Corn (Seed component) growth-stage scrubbing, 1440×900 desktop:** all 4 stages render correctly, distinctly, and are unobstructed by the Tune panel (right-docked, doesn't overlap the model). `04-corn-stage1-desktop.png` → `04-corn-stage4-desktop.png`.
- **Flower growth-stage scrubbing, 1440×900 desktop:** all 3 stages (bud, opening, full bloom) render correctly and unobstructed. `16-flower-stage1-desktop.png` → `16-flower-stage3-desktop.png`.
- **Stat rail legibility, mobile & desktop (390 and 1440):** chips render with clear labels/values, no wrapping issues, scrollable row behaves as intended. `02-corn-statrail-mobile.png`, `02-corn-statrail-desktop.png`, `14-flower-statrail-desktop.png`, `20-flower-statrail-afterpollinate-desktop.png`.
- **Tune panel scrub cause/effect (Root water uptake), all 3 viewports:** dragging from 65%→5% visibly reduces the number/density of animated water-droplet particles and flips the label from "rushing upward" to "slow trickle"; dragging to 95% restores dense flow. `09-root-tune-beforescrub-mobile.png` → `10-root-tune-afterscrub-low5-mobile.png` (label + particle count both change) and desktop/narrow-desktop equivalents.
- **Germination slider cause/effect:** scrubbing to 90% updates both the "Stage" label ("Seedling") and description text live, consistent with the app's own stage thresholds. `07-corn-tune-afterscrub-germination90-narrowdesktop.png`.
- **Pollination interaction (partial verification, see below):** clicking "Bee visits (pollinate)" changes state from "No pollinator has visited yet" → visible gold pollen particles moving toward the stigma + label "Pollen is moving to the stigma…" within under a second. `17-flower-procedural-beforepollinate-desktop.png` → `18-flower-pollinate-inprogress-desktop.png`.
- **Canvas non-blank / framed, panel-closed state, all viewports and all 3 tested components (Seed/Corn, Root, Flower):** model is centered, fully in frame, no clipping against canvas bounds. `05-corn-stage4-panelclosed-mobile.png`, `08-root-select-narrowdesktop.png`, `13-flower-select-narrowdesktop.png`, and all `*-desktop.png` select shots.
- **No internal QA/debug language leaked into UI:** reviewed all 79 screenshots — no lorem ipsum, TODO strings, or component/debug names visible anywhere in-app.
- **Console/network cleanliness:** zero page errors, zero failed requests, zero 4xx/5xx HTTP responses across all three viewport passes. Only benign entries: `THREE.Clock: This module has been deprecated…` (library warning, not app-caused), headless-only `GL Driver Message … GPU stall due to ReadPixels` performance warnings, and `debug`-level font-shaping messages (`unsupported GPOS/GSUB table…`) from the 3D-label font — none are errors and none reference the app's own code paths. Full text: `_console-log.txt`.

## Could not verify

- **Full seed formation after pollination** (`pollinationProgress > 0.6`, which gates the visible seed mesh appearing in the ovary): capture window (~5s post-click) was shorter than the ~10s the app's own tick rate requires to cross that threshold. `19-flower-pollinate-seedformed-desktop.png` still shows "Pollen is moving to the stigma…" rather than "seed has formed." The pollen-movement half of the interaction is confirmed working (see PASS list); the seed-appearance payoff is not confirmed either way (not asserting it's broken — just untested within the time budget).
- Did not test every other Plants component (Chloroplast, Leaf, Phloem, Stem, Stomata, Xylem) against the growth-stage/Tune-panel-obstruction axis — the task scoped growth-stage stepping to Corn and Flower specifically, and the scrub/obstruction check was extended to Root as a representative third component. Given the P0 obstruction bug is a layout-level issue (Tune panel + toolbar rail vs. canvas column width), it is reasonable to expect it reproduces on any component with the panel open at 1024px/390px, but not all nine were screenshotted individually to confirm.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `plants` reviewer agent, which produced all findings and evidence above but whose permission scope restricted its own file writes to `review-screenshots/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
