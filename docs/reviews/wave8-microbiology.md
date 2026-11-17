# Wave 8 Visual QA — Microbiology / Influenza Virus

Route: `/app/labs/microbiology` (Virus microbe). Viewports: Desktop 1440x900, Mobile 390x844.
Tool: headless Chromium via Playwright (ad hoc `npx`, not added to project deps).
Screenshots: `review-screenshots/wave8-2026-08-18/microbiology/`

## Checklist verdicts

| # | Item | Verdict |
|---|------|---------|
| 1 | Whole-virus ↔ cutaway switching works, both render correctly (no clipping/z-fighting) | **PASS** (desktop + mobile) |
| 2 | Hotspots meaningfully placed (real anatomical features) | **PASS** (placement/content) — see P1 below for click reliability |
| 3 | Infection stages shown correctly, visually distinct | **PASS** when the Tune panel is closed — see P1 for panel occlusion while stepping |
| 4 | Mobile navigation and stats legible/functional | **FAIL** — see P0 |
| 5 | Shared toolbar functions correctly | **FAIL** — Zoom In/Out non-functional; Isolate no-op in real-GLB modes (see P1s) |

## Evidence highlights

- `desktop-whole-virion.png`, `desktop-cutaway.png` — real NIH/PathogenAR influenza GLBs render cleanly, well framed, color-coded HA/NA/matrix/envelope, no clipping or z-fighting.
- `mobile-whole-virion-clean.png`, `mobile-cutaway-clean.png` — same, correctly framed at 390px once the Tune panel is closed.
- `desktop-infection-stage0-attach.png` → `desktop-infection-stage3.png`, `mobile-infection-stage0-clean.png` → `mobile-infection-stage3-clean.png` — the 4 infection stages (Attach → Inject → Replicate → Burst) are visually distinct (virus position, released-virus dots, and stage label all change) once the Tune panel is closed.
- `mobile-virus-cycle-default.png`, `mobile-tune-panel-open.png` — mobile always loads on **Bacteria**; there is no control anywhere in the mobile DOM to switch to Virus (see P0-1).
- `mobile-cutaway-workaround.png`, `mobile-whole-virion-workaround.png` — Tune panel open on mobile covers essentially the entire canvas.
- `desktop-toolbar-zoomed-in.png` / `desktop-toolbar-zoomed-out.png` / `desktop-zoomcheck-schematic-before.png` / `desktop-zoomcheck-schematic-after5in.png` — pixel-identical framing before/after repeated Zoom In/Zoom Out clicks.
- `desktop-toolbar-autorotate.png` — Rotate control confirmed working (model orientation visibly changed).
- `desktop-labels-check-2-after3s.png` — label toggle works (chip labels appear correctly after render settles).
- `console-errors.log` — no `console.error` or `pageerror` events captured in any session (only benign `THREE.Clock` deprecation notice and WebGL driver perf warnings).

## Findings

### P0 — Blocking

**P0-1. Mobile (390x844): the Virus scene (and every other microbe) is unreachable from the UI.**
`ContentNav` — the sidebar listing Bacteria/Virus/Fungus/Protozoa/Microbiome — is rendered with `hidden ... lg:block` (`src/routes/MicrobiologyLab.tsx`, the `<aside>` around `ContentNav`), so on a 390px viewport it doesn't render at all (confirmed via DOM: its bounding box is `null`). No other control (bottom tray, header, canvas overlay) offers a microbe switcher on mobile. A mobile user loads the lab on the default **Bacteria** microbe and has no way to reach the influenza **Virus** component — including whole-virion/cutaway inspection and infection-stage stepping — through any exposed UI element.
Evidence: `mobile-virus-cycle-default.png`, `mobile-tune-panel-open.png` (both show Bacteria despite being captured on the "virus" test pass). To capture the mobile Virus/cutaway/infection-stage screenshots in this report at all, the Virus microbe had to be selected at desktop width first, then the viewport resized down (client-side state persists across a resize) — this is not something an actual mobile user/touch session can do.

### P1 — Significant

**P1-1. Zoom In / Zoom Out toolbar buttons have no visible effect.**
Clicking "Zoom In" (up to 5×) or "Zoom Out" (up to 4×) produces no change in model framing/size, tested on the schematic infection-cycle scene and on both real-GLB inspection modes (whole-virion, cutaway), on desktop. The `cameraDistance` state does update (button disabled-state at min/max reflects it), but it never reaches the actual Three.js camera — likely because `OrbitControls` re-asserts its own spherical camera position every frame, overriding the `camera` prop passed to `<Canvas>`.
Evidence: `desktop-zoomcheck-schematic-before.png` vs `desktop-zoomcheck-schematic-after5in.png`; `desktop-toolbar-zoomed-in.png` vs `desktop-toolbar-zoomed-out.png` (cutaway mode).

**P1-2. Hotspot marker clicks in the real-GLB inspection modes (Whole virion / Cutaway) are unreliable — roughly every other click fails.**
Reproduced three independent ways (real user click, `force:true` click, raw native `dispatchEvent(click)` on the exact DOM button) on both mobile and desktop: clicking HA and Matrix-protein markers correctly updates the Detail panel, but clicking NA / RNP markers frequently does nothing, or clears the selection back to the generic "Virus" overview, instead of showing that structure's info. This makes roughly half the influenza structure hotspots practically unusable for a learner.
Evidence: `mobile-cutaway-hotspot-force-0.png` → `-3.png` (aside text logged during capture showed HA→HA(no-op)→Matrix→Matrix(no-op) across the 4 sequential clicks); same pattern reproduced on desktop cutaway and whole-virion.

**P1-3. Opening "Tune microbe" (required to switch Whole virion ↔ Cutaway and to click "Step infection stage") covers most/all of the 3D canvas, hiding the very change it triggers.**
On mobile the panel covers essentially the entire model, leaving only the top status chip visible. On desktop it covers roughly the bottom half of the canvas, which is where the virus-to-host movement and "new viruses burst out" particles render. This undermines "learner can see their action changed the scene" for the infection-cycle stepping and inspection-mode switching specifically, since the visible feedback is mostly limited to text (stage label, key-facts panel).
Evidence: `mobile-cutaway-workaround.png`, `desktop-infection-stage1.png` (panel occludes lower half where the animation happens).

### P2 — Polish

**P2-1. "Isolate" toggle has no visible effect in the real-GLB inspection modes.** The sourced whole-virion/cutaway GLBs are single merged meshes (no per-structure sub-meshes), so `Isolate` uniformly dims the *entire* model rather than isolating just the selected structure, unlike the schematic scenes where individual parts dim independently. Not broken (button responds, state toggles) but doesn't do anything visibly useful here.
Evidence: `desktop-toolbar-isolate.png` (identical to the non-isolated cutaway screenshot with no hotspot selected).

**P2-2. Schematic (non-GLB) virus capsid reads as a small, low-detail fuzzy ball at default zoom** compared to the crisp real NIH/PathogenAR GLBs — spike detail is barely legible during the infection-cycle animation, so most of the stage-to-stage "explanation" is carried by the text panel rather than the model geometry itself. Not a defect, a fidelity gap between the two inspection modes.
Evidence: `desktop-virus-cycle-default.png`.

**P2-3. "Compare" is disabled for Virus** (no `compareCandidate` configured in content data) — expected/content-driven, not a rendering bug, noted for completeness since it's part of the shared toolbar checklist.

## Not found / explicitly checked and clean

- No lorem ipsum, TODO strings, debug labels, or internal component names leaked into any Virus-related UI text observed.
- No console errors or page errors during the full test session (`console-errors.log`).
- No failed/404 network requests for the two influenza GLB files (`virus-influenza-whole-nih.glb`, `virus-influenza-pathogenar-cutaway-nih.glb`).
- Mobile bottom nav (Explore/Subjects/Labs/Notebook/Parent) and the mobile "Meter" stat chips (Microbe/Alive?/Copy/Inspect/Stage) are legible and correctly update — see `mobile-bottom-nav-final.png`, `mobile-cutaway-clean.png`.

## Scope note

No product/source files were modified. All screenshots and this report are the only files written, under `review-screenshots/wave8-2026-08-18/microbiology/` and `docs/reviews/wave8-microbiology.md` respectively.
