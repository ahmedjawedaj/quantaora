# Wave 12 Visual Acceptance Review — Microbiology Lab

- **Date:** 2026-08-18
- **Scope:** `MicrobiologyLab` at `http://127.0.0.1:5174/app/labs/microbiology`
- **Viewports:** Desktop 1440x900, Mobile 390x844
- **Reviewer:** read-only Playwright Chromium session (isolated profile at `/tmp/quantaora-wave12-microbiology*`), driven via ad hoc Node scripts, no shared browser tool
- **Screenshots:** `review-screenshots/wave12-2026-08-18/microbiology/`
- **Note on hotspot naming:** the checklist's "nucleic-acid (NA) spike hotspot" is understood to mean the app's real hotspot id `vi-na`, labeled **"Neuraminidase (NA) spikes"** (NA = neuraminidase, not "nucleic acid" — there is no separate nucleic-acid spike hotspot in the code; `PART_META['vi-na'].label` confirms this). This hotspot, together with the **"Lipid envelope"** hotspot (`vi-envelope`), only exists on the real-influenza GLB inspection modes ("Whole virion (real influenza)" and, for NA only, "Cutaway (real influenza)") reached via the virus's Tune panel → Inspect. The default "Infection cycle (schematic)" view has different hotspot ids (`vi-coat`, `vi-genetic`, `vi-spikes`) and does not carry `vi-na`/`vi-envelope`. All hotspot testing below was done in "Whole virion (real influenza)" mode, which is the only mode carrying both target hotspots simultaneously.

---

## 1. Repeated hotspot clicks — NA spike hotspot & Lipid envelope hotspot

**Verdict: PASS** (consistent every time, no desync, no stuck/duplicate popups), with **one P2 visual-overlap finding**.

- NA spikes hotspot (`View Neuraminidase (NA) spikes` button) clicked 3x in a row at desktop 1440x900: every click produced byte-identical panel state — right-rail "STRUCTURE / Neuraminidase (NA) spikes" heading, description, Function box, Where-it-belongs box, plus the on-canvas floating pill label "Neuraminidase (NA) spikes" and meter row updating to `INSPECT: whole virion…`.
  Evidence: `microbio-spike-hotspot-click1.png`, `microbio-spike-hotspot-click2.png`, `microbio-spike-hotspot-click3.png` (all three are pixel-identical).
- Lipid envelope hotspot clicked 3x in a row: every click produced identical "STRUCTURE / Lipid envelope" panel content.
  Evidence: `microbio-lipid-hotspot-click1.png`, `microbio-lipid-hotspot-click2.png`, `microbio-lipid-hotspot-click3.png` (identical).
- Interleaving test — NA → envelope → NA again (`microbio-spike-hotspot-after-envelope-interleave.png`) reproduced the exact same NA panel as the first click, confirming no state bleed between hotspots.
- **Click-away-and-back cycle** (explicit deselect/reselect test, done cleanly with a settle delay and a canvas-background coordinate clear of any mesh/label): select NA (`microbio-desktop-clickaway-test-A-selected.png`) → click empty canvas background → panel correctly reverts to the unselected default state, "THE MICROBIAL TYPES / Virus" heading, default key fact reverting to "Hemagglutinin (HA) spikes" (`microbio-desktop-clickaway-test-B-after-clickaway.png`) → re-click NA → panel correctly re-shows Neuraminidase again (`microbio-desktop-clickaway-test-C-reselected.png`). This 3-step cycle is clean; no ghost/duplicate popup, no stale label.
  - Note for methodology transparency: two earlier, hastier click-away attempts (`microbio-spike-hotspot-after-click-away.png`, `microbio-desktop-na-hotspot-after-true-clickaway.png`, `microbio-desktop-na-hotspot-clickaway-final.png`) used a 300ms settle delay and/or a click coordinate that landed on the left sidebar/an on-canvas label mesh instead of empty background, and did not observe a deselect. Re-run with a verified-empty coordinate and a 700ms settle delay (above) shows the deselect does work correctly and consistently — flagging this only so the PASS verdict isn't mistaken for having skipped the check.
- Mobile (390x844): same 3x-repeat test for both hotspots in "Whole virion (real influenza)" mode. NA spikes label chip is fully legible each time; consistent across all 3 clicks (`microbio-mobile-spike-hotspot-click1.png` → `click3.png`, identical). Lipid envelope also consistent across 3 clicks (`microbio-mobile-lipid-hotspot-click1.png` → `click3.png`, identical) — see P2 note below on legibility.
- Cutaway mode sanity check: NA hotspot also present and functional in "Cutaway (real influenza)" mode (`microbio-desktop-cutaway-loaded.png`, `microbio-desktop-cutaway-na-hotspot.png`). Lipid envelope hotspot is **not present** in cutaway mode (by design — only 3 hotspots wired there: HA, NA, Matrix, RNP; envelope is whole-virion-only). Not a bug, noting for completeness.
- DOM sanity: hotspot button count stayed at exactly 1 for each target across every click (`console.log` assertions in the driver script), ruling out duplicate-marker creation.

### P2 — Lipid envelope on-canvas label chip is partly occluded by the meter row
- **Desktop 1440x900:** the floating "Lipid envelope" pill label (rendered near the hotspot marker) is partly hidden behind the "COPY / needs a host cell" meter chip that sits in the bottom meter row — only the tail "…envelope" is legible on-canvas; the full label is still fully and correctly readable in the right-hand DetailPanel, so the information is not lost, just doubled up awkwardly on-canvas.
  Evidence: `microbio-lipid-hotspot-click1.png` (crop confirms; same on click2/click3, reproducible every time — consistent, not a desync).
- **Mobile 390x844:** the same occlusion is worse — the "INSPECT / whole virion…" meter chip covers most of the label, leaving only "…elope" visible on-canvas.
  Evidence: `microbio-mobile-lipid-hotspot-click1.png`.
- This is a positioning/z-order interaction between the fixed hotspot marker screen-position and the meter-chip grid, not a functional bug — the same marker consistently produces the same (partly covered) label every time, and the full text is always available in the side/below detail panel. Severity kept at P2 because information is not blocked, only visually cluttered.

---

## 2. Mobile switcher and scroll cue

**Verdict: PASS.**

- Mobile microbe switcher (chip row "MICROBE 2 of 5: Bacteria / Virus / Fungus / Protozoa / Microbiome…") is visible and reachable below the canvas on 390x844, and switching microbes works correctly (confirmed Bacteria → Virus → Bacteria transitions rebuild the scene and DetailPanel).
  Evidence: `microbio-mobile-initial-bacteria.png`, `microbio-mobile-virus-selected.png`, `microbio-mobile-bacteria-meters.png`.
- "Scroll for more" cue: opening the Tune panel on mobile for a stage-driven microbe (bacteria/virus) shows a bottom fade + bouncing chevron-down affordance, and it is accurate — the content it's hinting at (the "Step infection/division stage" row and the "Guided challenge" accordion) is genuinely clipped below the panel's `max-h-[34svh]` fold at that point.
  Evidence (before scroll, cue visible, Step/Guided content NOT yet visible): `microbio-mobile-scroll-cue.png`.
  Evidence (after scrolling the panel to `scrollTop = scrollHeight`, the Step button and Guided challenge become visible, confirming the cue was accurate): `microbio-mobile-tune-panel-scrolled.png`.
  Bounding-box measurement backs this up: before scroll the "Step infection stage" button's box bottom (y≈545) sits right at/past the panel's own bottom edge (panel bottom ≈524); after scroll its top moves to y≈411, fully inside the panel.

### P2 — secondary observation (outside the strict checklist item, flagged for completeness)
While confirming the Lipid envelope hotspot's full description on mobile, the right-hand-becomes-bottom DetailPanel content (Function / Where-it-belongs boxes) sits inside a second, independently-scrolling, only ~138px-tall nested pane (`aside.order-2 > div.overflow-y-auto`) with **no scroll-affordance cue** (no fade/chevron, unlike the Tune panel). The content is reachable with a normal touch-scroll gesture inside that pane (confirmed via `scrollIntoViewIfNeeded`, screenshot `microbio-mobile-lipid-detailpanel-scrollintoview.png`), so it is not a P1 blocker, but the lack of any visible cue there (contrasted with the Tune panel's explicit chevron) is inconsistent and easy for a learner to miss on a small screen.

---

## 3. Infection-stage controls

**Verdict: PASS at both viewports.**

- Located in the virus Tune panel: "Stage: <current stage label>" row + "Step infection stage" button, cycling Attach → Inject → Replicate → Burst → (wraps back to Attach).
- Desktop: stepped through 5 clicks (1 full cycle + wraparound). Each step correctly updated (a) the "Stage:" text in the Tune panel, (b) the "STAGE" meter chip / Key Facts "Cycle stage" value in the DetailPanel, and (c) the 3D scene itself — visibly new virus particles (small violet icosahedra) appearing and drifting away from the host cell once the cycle reaches "New viruses burst out."
  Evidence: `microbio-desktop-virus-cycle.png` (baseline) → `microbio-desktop-infection-stage-step1.png` ("Injects genetic material") → `microbio-desktop-infection-stage-step3.png` ("New viruses burst out," new virus particles visible near host cell) → steps 2/4/5 also captured.
- Mobile: same stepper reachable and functional after scrolling the Tune panel into view (see item 2); 4 consecutive steps captured, confirming the stage label cycles correctly and wraps back to "Virus attaches" on the 4th click, matching the expected 4-stage cycle.
  Evidence: `microbio-mobile-infection-stage-step1.png` → `microbio-mobile-infection-stage-step4.png`.
- Controls remain reachable (not obscured/cut off) at both viewports throughout — the "Step infection stage" button, Tune button, and canvas toolbar were all clickable in every screenshot taken.
- Also spot-checked bacteria's analogous "Step division stage" control exists and is wired the same way (not exhaustively stepped through since checklist specifically calls out "infection-stage," i.e. virus); flagging as **unproven-but-observed-present** rather than a full pass, since only the label/button presence was confirmed (`microbio-mobile-bacteria-meters.png` shows the "STAGE: Cell grows" meter), not a full step-by-step exercise.

---

## 4. Meter readability vs. tooltip tradeoff

**Verdict: PASS — meters are directly readable on-screen; no critical info is hover-tooltip-only.**

- The lab has no literal "viral load" or "immune response" gauge; the closest analogues are the generic `Meter` chips in the collapsed bottom-left row (e.g., `MICROBE`, `ALIVE?`, `COPY`, `INSPECT`, `STAGE` for virus; `BALANCE`, `HOME`, `MOSTLY`, `FIBER` for microbiome; etc.) plus the fuller Key Facts list in the right/below DetailPanel.
- Every meter chip prints its label (10px uppercase) and value (11–14px monospace, `line-clamp-2`) directly in the chip body — fully legible in the screenshots at both viewports without any interaction.
  Evidence: `microbio-meters-desktop.png` (virus), `microbio-meters-desktop-microbiome.png` (microbiome, showing `BALANCE: 83%` both as a short chip and spelled out in the DetailPanel as "83% — antibiotics shrink it, fiber helps it recover"), `microbio-meters-mobile.png` (same chip row, 2-column grid, legible on 390px width).
- Each `Meter` div does carry a native `title` attribute equal to its value, which shows as a hover tooltip on desktop — but this is strictly supplementary/redundant, not load-bearing: the same text is already printed in the chip. On mobile/touch, that hover tooltip is inaccessible, but since nothing is gated behind it, this does not create an accessibility gap.
- Numeric/percent meters (`Balance 83%`, `Moisture %`, `Food available %`, `Fiber %`) are all printed as plain on-screen percentages, not encoded only in a color/fill gauge that would need a legend or hover to decode.
- **Explicit tradeoff verdict:** no fail condition triggered — this app does not gate any meter's core value behind hover-only tooltips.

---

## Console / page errors

- **Desktop session:** no `pageerror`/`requestfailed` events. Console warnings only: `THREE.Clock` deprecation notice (x1) and repeated benign WebGL driver performance messages (`GPU stall due to ReadPixels`, x4, headless/software-GL artifact, self-silencing after one repeat).
- **Mobile session:** no `pageerror`/`requestfailed` events. One console warning: `THREE.Clock` deprecation notice.
- Verbatim warning strings observed:
  - `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
  - `[.WebGL-0x11c00588000]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (repeated 3x, then "this message will no longer repeat")
- No other console errors/warnings, and no failed network requests, observed across either session.

---

## Not verified / out of scope for this pass

- Bacteria's "Step division stage" control was confirmed present (label + meter) but not exercised step-by-step the way the virus infection-stage stepper was — flagged as unproven, not asserted PASS or FAIL.
- Fungus/Protozoa/Microbiome sliders (Moisture, Food available, Antibiotic use, Fiber-rich diet) were not part of this checklist and were not exercised.
- Rotate/Section/Compare toolbar buttons were visually confirmed present and unobscured in every screenshot but were not each individually clicked (out of scope — checklist item 3 covers "toolbar reachable," which was satisfied by visual inspection; only the infection-stage stepper and hotspots were interaction-tested per the assigned checklist).
- No testing was done outside the Microbiology lab (landing, onboarding, other labs) — out of the assigned Wave 12 scope.

---

## Summary

| # | Checklist item | Verdict | Worst severity |
|---|---|---|---|
| 1 | Repeated hotspot clicks (NA + lipid envelope) | PASS | P2 (label occluded by meter row) |
| 2 | Mobile switcher + scroll cue | PASS | P2 (secondary: DetailPanel nested-scroll has no cue) |
| 3 | Infection-stage controls | PASS | — |
| 4 | Meter readability vs. tooltip | PASS | — |

No P0 or P1 findings. Two P2 polish findings recorded above (lipid-envelope canvas label partly covered by the meter row on both viewports; mobile DetailPanel's own nested scroll region has no visible scroll-affordance cue, unlike the Tune panel).
