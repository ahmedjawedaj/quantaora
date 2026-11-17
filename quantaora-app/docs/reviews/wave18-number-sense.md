# Wave 18 Visual QA — Number Sense (Abacus / Place Value)

Date: 2026-08-18
Reviewer: read-only visual QA (own isolated headless Chromium via Playwright 1.62.1, shared
install at `/tmp/wave18-pw-shared`, own scratch script/profile at `/tmp/wave18-number-sense-qa`).
Route: `http://127.0.0.1:5174/app/labs/number-sense` (`src/routes/NumberSenseLab.tsx`), Place
Value component (procedural R3F soroban abacus, `AbacusStage`/`AbacusModel`/`AbacusRod`), plus
the shared `DetailPanel`/mobile switcher chrome.

Scope per assignment: re-verify (1) mobile top/bottom margin around the abacus (prior documented
issue), (2) hotspot visibility/clickability at 390x844, (3) DetailPanel usability at 390x844
(readable, scrollable, closeable, non-blocking), (4) desktop 1440x900 layout parity with prior
waves, (5) console/pageerror monitoring throughout.

No product files were modified — read-only inspection of `src/routes/NumberSenseLab.tsx` only,
plus `docs/reviews/wave12-number-sense.md` and `docs/reviews/wave14-number-sense.md` for prior
finding language.

Server reachability: **PASS**. `http://127.0.0.1:5174` reachable; `/app/labs/number-sense`
rendered on first load at both viewports, no route crash.

---

## Check 1 — Mobile abacus top/bottom margin (390x844)

**PASS — the specific prior issue is FIXED, not a regression.**

Prior finding being re-checked, quoted verbatim from `docs/reviews/wave14-number-sense.md`
(P1-2, "Abacus is clipped at top/bottom by overlay UI on mobile"):

> "The abacus's actual WebGL canvas measures only 338x133px inside a 390x338px stage box... the
> toolbar icon row sits over the top of the frame, the 'NUMBER SENSE — PREDICT BEFORE YOU CHECK'
> pill badge overlaps directly across the abacus's crossbar/upper frame, and the Hundreds/Tens/
> Ones rod meter cards sit immediately below, cropping the base/legs. Net effect: the full wooden
> frame (top crossbar, legs) is never visible on mobile."

Current measurement at 390x844: stage box `{"x":0,"y":64,"width":390,"height":472.625}` (place
value now gets a taller `56svh` mobile stage per the Wave 17 code comment at
`NumberSenseLab.tsx:572-583`), canvas box `{"x":26,"y":175.9,"width":338,"height":133.25}`. The
"NUMBER SENSE — PREDICT BEFORE YOU CHECK" badge sits above the stage card (not overlapping the
frame), and the Hundreds/Tens/Ones rod meter+bead-push cards sit with a visible gap below the
canvas (canvas bottom ≈309px, push-bead buttons start at y≈343px — a ~33px gap, not a crop). The
full wooden frame (top crossbar and legs) is visible in the screenshot with clear margin on all
sides, matching the desktop-quality framing.

Evidence: `mobile-01-fullpage-abacus.png`, `mobile-01-viewport-abacus.png`.

## Check 2 — Hotspots visible/clickable at 390x844

**PASS.**

4 place-value hotspot pins (`hs-hundreds`, `hs-tens`, `hs-regroup-ones`, `hs-digit-number`,
rendered as `<button aria-pressed>` per `HotspotButton`/`ABACUS_HOTSPOT_ROD`,
`NumberSenseLab.tsx:1439-1443`) are visible as small blue dot pins overlaid on the abacus canvas.
Selector-scoped click on the first pin (`hs-hundreds`) toggled `aria-pressed` from `false` to
`true`, and the DetailPanel content updated to show "Structure / Hundreds place / Function /
Where it belongs" — confirming the hotspot is both visible and functionally clickable. This
directly re-confirms the fix for Wave 14's P0-1 ("Place-value hotspots are unclickable... canvas
intercepts all pointer events over them") — the z-index fix noted in
`src/routes/numberSensePlaceValueHotspotStacking.test.ts` holds at runtime.

Evidence: `mobile-02-after-hotspot-click.png`, `mobile-03-detailpanel-state.png`.

## Check 3 — DetailPanel usability at 390x844

**Mixed: readable text and scroll mechanism PASS; default-visible content and close-control
visibility still reproduce the substance of the prior Wave 12 P1, now downgraded to P2 due to an
added "Scroll for more" affordance.**

Re-checking the prior finding, quoted verbatim from `docs/reviews/wave12-number-sense.md`
("P1 — Mobile 'aside' detail panel is squeezed to a ~105px scroll peephole, hiding almost all of
its content by default"):

> "Measured via DOM: this aside's visible `clientHeight` is only **105px** against a
> `scrollHeight` of **204px** of actual content. In the default (unscrolled) state, the switcher
> pill row alone consumes essentially all of that 105px, so the DetailPanel's title/definition
> text is not visible at all without a small, easy-to-miss scroll gesture confined to a 105px-tall
> strip."

Current measurement (overview state, Place Value selected, no hotspot picked): aside
`clientHeight: 138`, `scrollHeight: 245`. The panel is slightly taller than Wave 12 (138px vs
105px) but the underlying problem is still present in substance: in the default unscrolled state
only "COMPONENT 5 OF 10" + the switcher pill row + a "Scroll for more" chevron are visible — the
"Place Value" title and definition text are entirely below the fold, matching Wave 12's
description almost exactly (evidence: `mobile-04-overview-detailpanel.png`, cropped closeup
`mobile-02-after-hotspot-click.png`+crop). Scrolling the container (`aside.scrollTop = 999`)
reveals the "Σ THE BASE-TEN PLACE VALUE / Place Value / A digit's position tells its worth" title
and definition correctly (`mobile-05-overview-scrolled.png`) — the scroll mechanism itself works
and text is legible once scrolled, so this is **not** a hard content-loss bug.

What changed since Wave 12: a "Scroll for more" chevron pill (first documented as present in
`docs/reviews/wave14-number-sense.md` P2-1) is now visibly present and sticky at the bottom of the
default view, explicitly signposting that there is more content below — Wave 12's report
explicitly called this out as absent ("easy-to-miss scroll gesture"). Because the affordance now
exists and is visually legible, I am rating this **P2** (down from Wave 12's P1) rather than
calling it unfixed — the substance of "content hidden by default" reproduces, but it is no longer
a silently-hidden trap.

In the hotspot-detail state (after selecting "Hundreds place"), the same pattern applies to the
dismiss control specifically: the "Back to Place Value" link (`DetailPanel.tsx`) has DOM bounding
box `{"width":150,"height":20}` at `y≈668.6` while the aside's visible clipped region only extends
to `y≈674.6` from a scroll-top of 536.6 — in practice the link is clipped almost entirely out of
view by default (confirmed visually: the cropped default-state screenshot shows only the
switcher pills and "Scroll for more" hint, no "Back to Place Value" text at all). A learner must
scroll before the close/back control is visible or tappable. This reproduces Wave 14's
P1-3 finding almost exactly (same `150x20` bounding box, same sub-44px touch target) — **still
open, unchanged**. Combined with the default-hidden state above, I'm flagging this as **P1** for
the hotspot-detail case specifically (the *only* dismiss affordance for a hotspot detail view is
not visible without a scroll, which is a real, if not severe, usability regression risk), while
keeping the general overview-state text-hidden-by-default issue at P2 given the mitigating "Scroll
for more" hint.

The panel does not overflow the page (no page-level scroll) and does not visually cover/block the
abacus canvas at any point — the switcher pills and the abacus stage remain simultaneously
visible and interactive.

Evidence: `mobile-02-after-hotspot-click.png`, `mobile-03-detailpanel-state.png`,
`mobile-04-overview-detailpanel.png`, `mobile-05-overview-scrolled.png`.

## Check 4 — Desktop 1440x900 layout parity

**PASS — no regression observed relative to Wave 12/14 desktop screenshots.**

Layout matches the previously documented desktop structure: left `ContentNav` rail (measured
260px wide in this run vs. "~240px" as described in Wave 12's prose — a minor descriptive
discrepancy, not a re-measured pixel claim in that report, so not flagged as a regression), center
canvas stage with the full 10-icon toolbar rail, abacus centered and fully framed with visible
margin on all sides (no clipping of frame/beads/legs), and a fixed 360px-wide right `DetailPanel`
column showing "THE BASE-TEN PLACE VALUE / Place Value / A digit's position tells its worth" plus
Key Facts (Digits/Number/Expanded/Definition/Base ten/Example) — all rendered in full with no
internal overflow needed for this content length, no page-level clipping.

Clicking the same "Hundreds place" hotspot on desktop worked identically to mobile:
`aria-pressed` toggled, DetailPanel swapped to "Structure / Hundreds place / Function / Where it
belongs / Save to notebook" with a clearly visible, normal-sized "Back to Place Value" link at the
top of the panel (not clipped — desktop's DetailPanel is a static column, not a squeezed
scroll-fold like mobile's).

Evidence: `desktop-01-fullpage-abacus.png` (overview), `desktop-02-after-hotspot-click.png`
(hotspot detail state).

## Additional finding — place-value hotspot selection produces no visible change on the 3D model itself

**P1 — new finding this wave, not explicitly on the assigned checklist but discovered while
verifying hotspot cause/effect.**

Route/surface: Number Sense lab, Place Value component, **both** 390x844 and 1440x900.

Source code (`NumberSenseLab.tsx:1273-1342`) wires `activeHotspotId` through
`NumberSenseStage` → `AbacusStage` → `AbacusModel` → `AbacusRod`, computing a `highlight` value
via `ABACUS_HOTSPOT_ROD['hs-hundreds'] = 'placeHundreds'` and conditionally rendering a colored
`meshBasicMaterial` glow plane (`color: '#D96B5A'`, `opacity: 0.28`) behind the corresponding rod
when its hotspot is selected — this is the code path Wave 14's P1-1 finding
("Selecting a place-value hotspot produces zero visible change in the 3D scene") was fixed
against.

At runtime, however, selecting the "Hundreds place" hotspot produces **zero pixel-level change**
in the 3D canvas region on both viewports. I captured before/after screenshots of the exact
canvas bounding box and diffed them programmatically (Pillow `ImageChops.difference`): the only
non-zero pixels in the diff, at both 390x844 and 1440x900, are the antialiased edges of the
"Hundreds place" text label pill that appears next to the pin — no glow, tint, or brightness
change appears anywhere on the hundreds rod itself, where the coded highlight plane
(`#D96B5A` at 0.28 opacity behind the wooden frame's tan/cream color) should be clearly visible if
it were rendering. The DetailPanel text updates correctly; the manipulative itself does not.

Practical impact: a learner selecting "Hundreds place" still gets no visual confirmation on the
abacus of *which* rod that refers to — the same "Touch it" learning-flow gap Wave 14 flagged,
even though the code was subsequently changed to attempt a fix.

Evidence: `mobile-01-fullpage-abacus.png` vs `mobile-02-after-hotspot-click.png` (pixel-diffed,
diff isolated to the label pill only, confirmed via ad hoc script in
`/tmp/wave18-number-sense-qa`, not committed to the repo); `desktop-01-fullpage-abacus.png` vs
`desktop-02-after-hotspot-click.png` (same result).

## Check 5 — Console/page errors

**PASS — no errors, only benign warnings, consistent with Wave 12/14.**

`page.on('console')` and `page.on('pageerror')` were attached for the full run (both viewports,
page load, component switch, hotspot click). Zero `pageerror` events. Console output was limited
to:

```
warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
warning: [.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
warning: [.WebGL-0x...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
debug: [vite] connecting... / [vite] connected.
info: Download the React DevTools for a better development experience...
```

No `console.error`, no failed network requests observed, no crashes on any interaction performed
(component switch, hotspot select, screenshot capture at both viewports).

---

## Summary table

| # | Check | Viewport | Result |
|---|---|---|---|
| 1 | Abacus top/bottom margin (prior Wave 14 P1-2) | Mobile 390x844 | **PASS — fixed** |
| 2 | Hotspots visible & clickable (prior Wave 14 P0-1) | Mobile 390x844 | **PASS — fixed** |
| 3a | DetailPanel readable/scrollable, doesn't block abacus | Mobile 390x844 | PASS |
| 3b | DetailPanel content visible by default (prior Wave 12 P1) | Mobile 390x844 | **P2 — improved, still reproduces in substance (mitigated by a "Scroll for more" hint)** |
| 3c | DetailPanel close control ("Back to...") visible/reachable by default | Mobile 390x844 | **P1 — not visible without a scroll (prior Wave 14 P1-3 small-tap-target issue also still open, unchanged)** |
| 4 | Desktop layout parity with Wave 12/14 | Desktop 1440x900 | PASS, no regression |
| Extra | Place-value hotspot selection changes the 3D model itself (prior Wave 14 P1-1) | Both | **P1 — still reproduces despite code changes intended to fix it; only DetailPanel text/label updates, model unchanged** |
| 5 | Console/pageerror monitoring | Both | PASS — no errors, only benign warnings |

**P0: 0. P1: 2 (DetailPanel close-control not visible by default on mobile; place-value hotspot
selection has no visible effect on the 3D model). P2: 1 (DetailPanel overview text hidden by
default on mobile, mitigated by a "Scroll for more" hint).**

Two of the three previously-documented issues explicitly assigned for re-check are confirmed
**fixed**: the mobile top/bottom margin/clipping (Wave 14 P1-2) and hotspot clickability
(Wave 14 P0-1). The DetailPanel ergonomics issue (Wave 12 P1) is **improved but not fully
resolved** — content is still hidden by default and requires a scroll, though it is now
signposted by a visible "Scroll for more" affordance, and the dismiss control for a hotspot
detail view is still not visible without that same scroll (matching Wave 14 P1-3, unchanged). A
new-to-this-wave finding is that the place-value hotspot highlight-on-the-model feature (code
added since Wave 14 specifically to fix Wave 14's P1-1) does not produce any observable visual
change at runtime, based on pixel-diffed screenshots.

## Screenshot index

All paths relative to `review-screenshots/wave18-2026-08-18/number-sense/`:

- `mobile-01-fullpage-abacus.png`, `mobile-01-viewport-abacus.png` — mobile framing/margin check (Check 1)
- `mobile-02-after-hotspot-click.png`, `mobile-03-detailpanel-state.png` — mobile hotspot click + DetailPanel hotspot-detail state (Checks 2 & 3)
- `mobile-04-overview-detailpanel.png` — mobile DetailPanel overview (unscrolled) state (Check 3b)
- `mobile-05-overview-scrolled.png` — mobile DetailPanel overview after programmatic scroll, confirming content is reachable (Check 3b)
- `desktop-01-fullpage-abacus.png` — desktop overview (Check 4)
- `desktop-02-after-hotspot-click.png` — desktop hotspot-detail state (Check 4)
