# Wave 10 Visual QA — Microbiology Lab

Route: `http://127.0.0.1:5174/app/labs/microbiology`
Viewports: Mobile 390x844 (primary), Desktop 1440x900
Tooling: isolated Playwright/Chromium (`launchPersistentContext`, profile under `/tmp/wave10-microbiology`), not the shared browser session.
Evidence dir: `/Users/ahmedjawed/Documents/Kids Learning app/review-screenshots/wave10-2026-08-18/microbiology/`

Scope note on "Influenza": the microbe switcher (mobile chip row and desktop `ContentNav`) has
exactly 5 entries — Bacteria, Virus, Fungus, Protozoa, Microbiome. There is no separate
"Influenza" switcher entry. Influenza is reached as two **Inspect modes** of the Virus microbe,
via the Tune panel's "Whole virion (real influenza)" and "Cutaway (real influenza)" buttons
(`src/routes/MicrobiologyLab.tsx` `VirusInspectionMode`). This is how the flow was tested below;
flagging it since the task description implied Influenza might be its own switcher stop.

---

## P0 — Blocking

None found. Dev server was reachable (`200` on the route), no route crashed, no blank canvases,
no page-level JS errors (`pageErrors` was empty in every capture — see Console section).

---

## P1 — Significant

### 1. Two real-influenza-GLB hotspots are physically unclickable behind the collapsed meters bar (both viewports)
- **Surface:** Virus → Inspect: Whole virion (real) and Cutaway (real), mobile 390x844 and desktop 1440x900
- **What's wrong:** In the *default, closed* Tune-panel state (the small "Microbe / Alive? / Copy / Inspect / Made of / Stage" meter-chip row that always floats over the bottom of the canvas), two of the DOM-based hotspot markers on the real influenza GLBs render underneath that opaque overlay and cannot receive a real user tap/click:
  - **Cutaway mode:** "Neuraminidase (NA) spikes" hotspot — confirmed on mobile *and* desktop.
  - **Whole-virion mode:** "Lipid envelope" hotspot — confirmed on mobile *and* desktop.
- **How verified:** `document.elementFromPoint()` at each hotspot button's true screen center resolves to the meter-panel's `<P>`/`<DIV>` text node, not the hotspot `<button aria-label="View …">`. A real (non-forced) Playwright `.click()` on the NA/Lipid-envelope buttons times out after the actionability check reports `"...subtree intercepts pointer events"` from `div[data-canvas-overlay]`. All other hotspots on the same models (HA, Matrix protein, RNP) are unobstructed and clickable.
- **Evidence:**
  - `mobile-BUG-na-hotspot-overlap-before.png`, `mobile-BUG-cutaway-hotspots-overlap.png`, `mobile-BUG-na-hotspot-click-failed.png` (mobile cutaway, NA blocked)
  - `mobile-BUG-whole-virion-hotspots-overlap.png`, `mobile-BUG-lipid-envelope-click-failed.png` (mobile whole-virion, Lipid envelope blocked)
  - `desktop-BUG-cutaway-panel-closed.png` (desktop cutaway — NA hotspot sits directly over/behind the "Copy" meter chip)
  - `desktop-BUG-whole-virion-panel-closed.png` (desktop whole-virion — Lipid envelope hotspot sits behind the "Copy" meter chip)
- **Impact:** A learner cannot open the info panel for the lipid envelope (whole virion) or the NA spikes (cutaway) without first discovering they need to scroll/hide the meter row — directly undercuts the "hotspot → info" cause/effect loop for those two structures.

### 2. Mobile Tune panel for stage-driven microbes (Bacteria, Virus) clips its own primary controls with no scroll affordance
- **Surface:** Bacteria and Virus, mobile 390x844, Tune panel open in "Infection cycle (schematic)" mode
- **What's wrong:** The Tune panel is intentionally shorter for these two microbes (`max-h-[28svh]` in `TunePanel`, see the `stageDriven` comment in `MicrobiologyLab.tsx`) so the canvas animation stays visible. On mobile this means the panel's *last* two elements — the "Cutaway (real influenza)" inspect button and, further down, the "Stage: … / Step infection stage" button (the primary Observe→Change interaction for this microbe) plus the Guided Challenge accordion — are cut off below the panel's hard edge. Only "Cutaway" gets a thin visible sliver; "Step infection stage" is entirely off-screen with no scrollbar, chevron, or gradient fade signaling that content continues. It **is** reachable (confirmed a mouse-wheel scroll inside the panel reveals it), but there is no visual cue that scrolling is needed or possible.
- **Evidence:**
  - `mobile-BUG-tunepanel-virus-cutoff-before-scroll.png` — initial state, "Step infection stage" fully hidden, "Cutaway" barely peeking at the bottom edge
  - `mobile-tunepanel-virus-after-wheel-scroll.png` — same panel after a manual scroll, showing the previously-hidden Cutaway/Stage/Step/Guided-challenge content
- **Impact:** On a phone, a learner opening Tune on Bacteria/Virus is likely to miss the step-through-the-cycle control entirely — the single most important interactive verb for those two microbes — because nothing indicates it's below the fold.

---

## P2 — Polish

- Meter chip text truncation: "Moves" meter for Protozoa reads `whip · hairs ·…` (line-clamped/truncated with an ellipsis) on mobile; full text is only available via the `title` tooltip attribute, which isn't discoverable on touch. Screenshot: `mobile-switcher-protozoa.png`. Cosmetic only, value is still legible in the DetailPanel/key-facts list.

---

## PASS — Verified working correctly

- **Server reachable:** `GET /app/labs/microbiology` → `200`. Not a P0 blocker.
- **Mobile microbe switcher, all 5 microbes:** stepped through Bacteria → Virus → Fungus → Protozoa → Microbiome via the mobile chip row; every scene rendered non-blank, centered, and un-clipped. Evidence: `mobile-switcher-bacteria.png`, `mobile-switcher-virus.png`, `mobile-switcher-fungus.png`, `mobile-switcher-protozoa.png`, `mobile-switcher-microbiome.png`.
- **Influenza whole-virion and cutaway reachable and rendering correctly (mobile):** both Inspect modes load their sourced NIH/PathogenAR GLBs, render with visible vertex-color detail, correctly labeled banner text ("Real influenza virion · NIH 3D · CC0" / "…cutaway · NIH 3D / PathogenAR · CC-BY 4.0"), and stay framed in the canvas. Evidence: `mobile-switcher-influenza-whole.png`, `mobile-influenza-cutaway.png`.
- **Desktop microbe switcher, all 5 microbes:** stepped through the same 5 via the left `ContentNav` sidebar; all rendered correctly. Evidence: `desktop-switcher-bacteria.png`, `desktop-switcher-virus.png`, `desktop-switcher-fungus.png`, `desktop-switcher-protozoa.png`, `desktop-switcher-microbiome.png`. Influenza whole/cutaway also confirmed on desktop: `desktop-influenza-whole.png`, `desktop-influenza-cutaway.png`.
- **Zoom in / zoom out, mobile:** 5× Zoom In then 10× Zoom Out (button clamps correctly at its coded `minDistance`/`maxDistance` bounds — no runaway, no clipping, no blank frame at either extreme) on the influenza cutaway model. Camera framing visibly and correctly changes at each step. Evidence: `mobile-zoom-00-before.png` → `mobile-zoom-01-after-5x-zoomin.png` → `mobile-zoom-02-after-10x-zoomout.png`.
- **Zoom in / zoom out, desktop:** same test, same correct behavior. Evidence: `desktop-zoom-00-before.png` → `desktop-zoom-01-after-5x-zoomin.png` → `desktop-zoom-02-after-10x-zoomout.png`.
- **Hotspot reliability — unobstructed hotspots (mobile + desktop):** clicked the same "Hemagglutinin (HA) spikes" hotspot 5 times in a row on the influenza cutaway model on both viewports; the DetailPanel heading correctly read "Hemagglutinin (HA) spikes" on all 5 clicks, every time (`mobile-hotspot-ha-click5-FINAL.png`, `desktop-hotspot-ha-click5.png`). Switching between different hotspots (Matrix protein → RNP → HA, and HA → NA on desktop) updated the DetailPanel correctly and immediately every time, no stuck state, no stale label. Evidence: `mobile-hotspot-matrix-click-FINAL.png`, `mobile-hotspot-rnp-click-FINAL.png`, `desktop-hotspot-na-click.png`.
- **Hotspot reliability — schematic canvas markers (mobile):** clicked the Bacteria "cell wall" 3D marker 3 times in a row; the DetailPanel correctly showed "Cell wall" / "Back to Bacteria" every time, no flakiness. Evidence: `mobile-schematic-hotspot-bacteria-click3.png`.
- **Tune panel visible/reachable, both viewports, most microbes:** the collapsed meter row + "Tune microbe" button and the expanded panel (toggle chips, Inspect buttons, sliders, Guided Challenge accordion) render fully within their container with no cut-off text on desktop for every microbe checked, and on mobile for Microbiome and the Virus "Whole virion" Inspect state (which has fewer rows than the Virus cycle state). Evidence: `desktop-tune-panel-microbiome.png`, `desktop-tune-panel-virus-cycle.png`, `mobile-tune-panel-whole-virion-open.png`. (See P1 #2 above for the one mobile case where this is *not* fully true.)
- **Cause/effect legibility:** DetailPanel key-facts and the collapsed meter row both update live with slider/stage changes (e.g., "Cycle stage" text, "Balance %", "Moisture %"), and the "Step infection/division stage" button visibly advances the on-canvas animation stage label when reachable.
- **No internal QA/debug language observed** in any captured UI text (labels, tooltips, banners, meter text) across all screens reviewed.
- **Console/page errors:** zero `pageerror` events across all mobile and desktop runs. Console output was limited to benign dev-only noise: Vite HMR connect/connected, a React DevTools suggestion, a `THREE.Clock` deprecation warning, four repeated (then silenced) `GL Driver Message … GPU stall due to ReadPixels` performance warnings, and font-shaping debug lines (`unsupported GPOS/GSUB table LookupType …`). None indicate a functional defect; verbatim log saved in `/tmp/wave10-microbiology/final-mobile-log.json` and `/tmp/wave10-microbiology/final-desktop-log.json` (outside the repo, QA-tool-only).

---

## Not verified / out of scope

- Hotspot reliability was **not** automated-tested on the schematic Fungus/Protozoa/Microbiome scenes (only Bacteria was spot-checked) — those markers are plain Three.js meshes with no DOM handle, so each additional check requires manually re-deriving pixel coordinates per viewport; time-boxed out given the Bacteria check already validated the same `Marker`/`onSelectPart` code path other schematic scenes share.
- Did not test browser-native pinch-zoom / orbit-drag gestures (touch drag-to-rotate), only the dedicated Zoom In/Out toolbar buttons.
- Did not test the Compare, Isolate, X-Ray, Section, or Fullscreen toolbar buttons in depth (Section/Compare were disabled/greyed for these microbes in the states tested, consistent with `crossSection`/`compareTarget` not being wired for schematic scenes — not flagged as a defect since the buttons correctly show a disabled state rather than doing nothing silently).
- Did not test Lesson/Quiz/Notebook modal content in detail — only confirmed their trigger buttons render un-clipped in the bottom tray.
- Landing page, onboarding, and other labs/subjects were out of scope per this task's brief (microbiology only).
