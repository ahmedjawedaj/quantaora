# Wave 14 Visual QA — Number Sense Lab (DetailPanel ergonomics & abacus visibility)

Reviewer: Wave 14 reviewer #5 of 10
Date: 2026-08-18
Route: `http://127.0.0.1:5174/app/labs/number-sense` (`src/routes/NumberSenseLab.tsx`)
Scope: DetailPanel mobile ergonomics, abacus/procedural place-value model visibility, and
mobile switcher/BottomTray coexistence. Desktop covered briefly for comparison, per assignment.

Tooling: local Playwright 1.62.1 installed in an isolated `/tmp/wave14-number-sense-qa` scratch
dir (no repo/package.json touched), driving Chromium headless against the already-running dev
server. Screenshots + `elementFromPoint`/bounding-box probes captured programmatically.

Server reachability: **PASS** — `http://127.0.0.1:5174/app/labs/number-sense` returned HTTP 200
and rendered on first load at both viewports.

---

## Headline verdict

**FAIL** — the place-value component's on-canvas hotspots are completely non-interactive (and
effectively invisible) at both mobile and desktop, because the abacus's own R3F `<Canvas>`
wrapper is stacked above the hotspot-button layer. This is a P0: it silently removes 3 of the 4
"Touch it" learning interactions for the flagship place-value manipulative on every viewport,
not just mobile. DetailPanel ergonomics themselves (once reached via a workaround) are otherwise
reasonable, and the switcher/BottomTray coexist without overlap.

P0 count: **1**
P1 count: **3**
P2 count: **2**

---

## P0 — Broken / blocking

### P0-1: Place-value hotspots are unclickable (and unseen) at every viewport — canvas intercepts all pointer events over them

**Surface:** Number Sense lab, Place Value component, canvas stage. **Both** Mobile 390x844
and Desktop 1440x900.

Attempting a real user click on any of the 4 in-canvas hotspot pins for Place Value
(`hs-hundreds`, `hs-tens`, `hs-regroup-ones`, `hs-digit-number`) fails outright. Direct Playwright
`locator.click()` on the hotspot `<button>` timed out after 30s with:

```
<canvas width="338" height="133" data-engine="three.js r185"></canvas> from <div class="relative
z-10 flex h-full w-full flex-col gap-2 p-3 sm:p-4">…</div> subtree intercepts pointer events
```

I then confirmed this programmatically with `document.elementFromPoint()` at the exact screen
coordinates of all 4 hotspot buttons, on both viewports — in every case the topmost element at
that point is the `<canvas>`, never the hotspot `<button>`:

```
MOBILE:  4/4 hotspots -> elementAtCenterTag: "CANVAS", elementAtCenterIsSelf: false
DESKTOP: 4/4 hotspots -> elementAtCenterTag: "CANVAS", elementAtCenterIsSelf: false
```

Root cause (read-only source inspection, not modified): in `NumberSenseLab.tsx`, `AbacusStage`'s
root wrapper is `<div className="relative z-10 flex h-full w-full ...">` (line 1384), which fully
covers the parent stage and explicitly sets `z-10`. The hotspot buttons rendered by
`hotspotPositions.map(...)` in `NumberSenseStage` (line 1125-1129) are plain
`className="absolute ..."` with no `z-index` set (`HotspotButton`, line 1028-1042) — i.e.
`z-index: auto`. Per normal CSS stacking rules, a sibling with `z-index: 10` always paints above a
sibling with `z-index: auto`, regardless of DOM order, so the abacus's `<Canvas>` (and its
`bg-white/50` panel) sits visually and functionally on top of all 4 hotspot pins. This is
specific to Place Value: the other 9 operations render their visual as an `<svg>` sibling with no
explicit `z-index`, so their hotspots stack correctly — confirmed by successfully clicking an
Addition hotspot with the identical selector/flow (`number-sense-addition-hotspot-mobile-confirm.png`).

**Practical impact:** a learner can never reach 3 of the 4 place-value hotspot concepts at all
("Tens place", "Regroup ones", "Digit -> number") through the UI. The only way I could get the
DetailPanel to show *any* hotspot content was via the "Isolate" toolbar button, which (per its
`onToggleIsolate` handler) always jumps to `hotspots[0]` ("Hundreds place") and only toggles that
one on/off — it is not a hotspot browser, so it cannot substitute for the other 3.

Evidence:
- `number-sense-abacus-mobile-stage-only.png` / `number-sense-abacus-desktop.png` — no hotspot
  pins are visible anywhere on the abacus canvas at all (they're painted under the canvas).
- `number-sense-detailpanel-hotspot-mobile.png`, `number-sense-detailpanel-hotspot-desktop.png` —
  the only hotspot reachable, "Hundreds place," obtained via the Isolate toolbar workaround, not
  by tapping the model.
- `number-sense-addition-hotspot-mobile-confirm.png` — control case proving hotspot clicks work
  normally on a non-place-value (SVG-based) component, isolating the bug to Place Value's Canvas
  stacking.

---

## P1 — Significant

### P1-1: Selecting a place-value hotspot produces zero visible change in the 3D scene

**Surface:** Number Sense lab, Place Value component. Mobile 390x844 and Desktop 1440x900.

Independent of P0-1: even using the Isolate-button workaround to activate the "Hundreds place"
hotspot, the abacus model itself is pixel-identical before and after (compare
`number-sense-abacus-desktop.png` vs. `number-sense-detailpanel-hotspot-desktop.png` — same bead
colors, same rods, no dimming/highlighting of the hundreds rod vs. tens/ones). Source confirms
`AbacusStage` (`NumberSenseLab.tsx` line 1367) never receives `activeHotspotId` as a prop, so
there is no code path that could highlight/isolate the selected rod. Only the DetailPanel text
changes. This fails the "learning interactions communicate cause/effect" bar for this component —
a learner selecting "Hundreds place" gets no visual confirmation on the manipulative itself of
which rod that refers to. (Other operations were not exhaustively checked for the same gap; this
was only confirmed for place-value, in scope.)

### P1-2: Abacus is clipped at top/bottom by overlay UI on mobile

**Surface:** Number Sense lab, Place Value component, Mobile 390x844.

The abacus's actual WebGL canvas measures only 338x133px inside a 390x338px stage box (`canvas
box: {"width":338,"height":133}` vs `stage box: {"height":337.6}`), and what's visible is further
cropped: the toolbar icon row sits over the top of the frame, the "NUMBER SENSE — PREDICT BEFORE
YOU CHECK" pill badge overlaps directly across the abacus's crossbar/upper frame, and the
Hundreds/Tens/Ones rod meter cards sit immediately below, cropping the base/legs. Net effect: the
full wooden frame (top crossbar, legs) is never visible on mobile — only the rods and beads
mid-frame are visible, and the badge partially occludes that middle band too. Beads themselves
(blue = active, cream = inactive) remain distinguishable in the parts that are visible, so this is
readability degradation rather than a fully blank/illegible canvas.

Evidence: `number-sense-abacus-mobile-stage-only.png` (cropped to just the stage element,
`[data-lab-stage]`, showing the badge sitting on top of the frame and the rod meters cropping the
base).

### P1-3: "Back to {component}" dismiss control is a very small tap target on mobile

**Surface:** Number Sense lab, Place Value hotspot detail view, Mobile 390x844.

The only dismiss affordance for a hotspot detail view is the "Back to Place Value" text link
(`DetailPanel.tsx` line 54-61: icon + text, no explicit padding/min-height). Measured bounding
box on mobile: `{"width":150,"height":20}` — a 20px-tall tap target, well under the ~44px minimum
recommended for reliable touch targets. It is clearly *labeled* (arrow + "Back to Place Value"
text, easy to understand what it does), so dismissibility is not ambiguous, but it will be
error-prone to actually tap accurately on a phone.

Evidence: `number-sense-detailpanel-hotspot-mobile.png` (link visible directly under the
component switcher, above "Structure / Hundreds place").

---

## P2 — Polish

### P2-1: DetailPanel content requires substantial internal scrolling on mobile to reach "Save to notebook"

**Surface:** Number Sense lab, Place Value hotspot detail view, Mobile 390x844.

With the mobile component switcher (~90px) sharing the same scroll container as the DetailPanel,
only ~273px of vertical space (32.5% of the 844px viewport) is visible at once
(`aside` bounding box height 274.4px; `scrollHeight` 372 vs `clientHeight` 273 in the overview
state, deeper for the hotspot-detail state where "Save to notebook" sits at `y≈921`, ~250px below
the fold). This is a real amount of scrolling, but the panel already ships a purpose-built "Scroll
for more" affordance (chevron pill, sticky at the bottom of the visible area, confirmed present in
`number-sense-detailpanel-hotspot-mobile.png` and `number-sense-abacus-mobile.png`) that makes the
cut-off state legible rather than silently hidden, so I'm marking this P2 (not P1) — it is
functional and clearly signposted, just dense. No text was found clipped/truncated unexpectedly
inside the panel content itself.

### P2-2: Switcher chip tap targets are slightly under the 44px touch-target guideline

**Surface:** Number Sense lab, mobile component switcher (all components), Mobile 390x844.

All 10 switcher chips ("Addition" … "Prime Number") measured `h: 36px` (widths vary 89-153px per
label). 36px is workable but below the common 44px minimum touch-target recommendation. Labels
truncate correctly with no visual overflow/clipping (verified via `truncate` class and no
horizontal-overflow elements detected outside the intentionally horizontally-scrollable chip
row itself).

---

## PASS / no-issue items observed

- **Server reachability:** PASS at both viewports, no blank screen, no route crash.
- **Component switcher + BottomTray coexistence, mobile:** PASS. In the default (no-hotspot)
  Place Value view, the switcher chip row (~y 422-475), the DetailPanel summary content, and the
  BottomTray cards (Lesson/Checkpoint/Experiment/Notebook, ~y 690-767) are all simultaneously
  visible above the global bottom tab bar (Explore/Subjects/Labs/Notebook/Parent, ~y 797-844) with
  no visual overlap between any of them. Evidence: `number-sense-switcher-bottomtray-mobile.png`,
  `number-sense-abacus-mobile.png`.
- **Abacus visibility/framing, Desktop 1440x900:** PASS. The full soroban frame (top crossbar,
  three rods, legs) is clearly visible and well-framed inside its canvas box, with legible blue
  (active) vs. cream (inactive) beads matching the "Digits 573 / Number 573 / Expanded 500+70+3"
  readout. Evidence: `number-sense-abacus-desktop.png`.
- **DetailPanel overview text, both viewports:** PASS — no lorem ipsum, no debug/internal
  component names, no TODO strings visible in any captured screen. Copy reads as intended
  end-user content ("A digit's position tells its worth," "Place value is the doorway to all
  arithmetic," etc).
- **Console/page errors:** No JS `pageerror` events and no `console.error` messages were observed
  during any of the flows tested (mobile or desktop, default load, component switch, hotspot
  interaction attempts). Only benign warnings were logged:
  `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` and repeated
  headless-GPU-only messages `[.WebGL-...]GL Driver Message (OpenGL, Performance,
  GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` — the latter is a headless/software-GPU
  rendering artifact of this sandbox, not expected to reproduce on real hardware, so not reported
  as a finding.
- **Desktop DetailPanel ergonomics:** PASS-ish (no dedicated P-level finding) — on desktop the
  panel is a normal fixed-width (360px) right-hand column in the layout (not an overlay), all
  content ("Key facts," "Definition," hotspot "Function"/"Where it belongs") rendered fully within
  the 545px visible height with no internal scroll needed for the hotspot-detail view captured
  (`scrollHeight` 545 === `clientHeight` 545). Evidence: `number-sense-detailpanel-hotspot-desktop.png`.

---

## Unproven / not covered

- The other 9 Number Sense operations (Addition, Subtraction, Multiplication, Division, Number
  Line, Negative Numbers, Factors, Multiples, Prime Number) were **not** exhaustively re-audited
  for DetailPanel ergonomics or hotspot cause/effect — only Addition's hotspot click was spot-
  checked as a control case for the P0 finding (confirmed working). Mobile canvas top-clipping by
  the toolbar/badge overlay was visually present on the Addition default view too
  (`number-sense-mobile-default.png` shows "Group A(3)" cubes partly under the badge), but a full
  per-operation clipping audit was out of this task's scope (Place Value/abacus was the assigned
  focus) and is not separately scored here.
- Did not test real touch/tap gestures on an actual mobile device or emulated touch input mode —
  all interactions were synthesized via Playwright's default (mouse-based) `click()`/DOM APIs.
  Touch-specific behavior (e.g., 300ms tap delay, touch-action CSS) was not verified.
- Did not test the "Section" (cross-section), "Compare," "Zoom," or "Fullscreen" toolbar controls
  for Place Value — out of the assigned DetailPanel/abacus-visibility scope.
- Did not test keyboard/screen-reader accessibility of the DetailPanel or hotspot controls.
- Did not verify behavior across repeated hotspot-select/back cycles or check for memory/state
  leaks over extended interaction.

---

## Screenshot index

All paths relative to
`review-screenshots/wave14-2026-08-18/number-sense/`:

- `number-sense-mobile-default.png` — Mobile landing (Addition, default component).
- `number-sense-abacus-mobile.png` — Mobile, Place Value selected, overview DetailPanel state.
- `number-sense-switcher-bottomtray-mobile.png` — Mobile, same view; evidence switcher + BottomTray coexist without overlap.
- `number-sense-abacus-mobile-fullpage.png` — Mobile full-page capture (identical to viewport capture, confirming no extra page-level scroll; layout panels scroll internally instead).
- `number-sense-abacus-mobile-stage-only.png` — Mobile, cropped to just the canvas stage; shows toolbar/badge/meter-card clipping of the abacus frame (P1-2).
- `number-sense-detailpanel-open-mobile.png` — Mobile, overview DetailPanel state (toolbar toggle was clicked, not an actual hotspot; kept as secondary overview evidence).
- `number-sense-desktop-default.png` — Desktop landing (Addition, default component).
- `number-sense-abacus-desktop.png` — Desktop, Place Value selected; clean, well-framed abacus (PASS reference).
- `number-sense-detailpanel-open-desktop.png` — Desktop, overview DetailPanel state.
- `number-sense-detailpanel-hotspot-mobile.png` — Mobile, "Hundreds place" hotspot detail view (reached via Isolate-button workaround; P0-1 evidence).
- `number-sense-detailpanel-hotspot-desktop.png` — Desktop, same hotspot detail view (P0-1 evidence).
- `number-sense-addition-hotspot-mobile-confirm.png` — Mobile, Addition component hotspot click succeeding normally (control case isolating P0-1 to Place Value).
