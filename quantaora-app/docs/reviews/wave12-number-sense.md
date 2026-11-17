# Wave 12 Visual Acceptance Review — Number Sense (Abacus / Place Value)

Date: 2026-08-18
Scope: `/app/labs/number-sense` (NumberSenseLab), Place Value component (the procedural R3F
soroban abacus), plus surrounding lab chrome (toolbar, meters, mobile switcher, tune panel).
Reviewer: read-only visual QA (own isolated headless Chromium via Playwright, profile dir
`/tmp/quantaora-wave12-number-sense-profile`).

Route inspected read-only: `src/routes/NumberSenseLab.tsx` (component `AbacusStage` /
`AbacusModel` / `AbacusRod` / `AbacusBead`, lines ~1180-1382). No product files were modified.

Viewports tested: Desktop 1440x900, Mobile 390x844.

Server reachability: `curl -o /dev/null -w '%{http_code}' http://127.0.0.1:5174/app/labs/number-sense`
returned `200`. App reachable — not a blocker.

Console/page errors observed across all runs (desktop + mobile, all interactions): only
`THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (warning) and
repeated `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to
ReadPixels` (performance warning, not an error, self-throttles to "will no longer repeat"). No
`pageerror` events, no failed requests, no crashes on any interaction performed (component
switch, bead push x/-, x-ray toggle, isolate toggle, more-menu open, tune panel open, zoom).

---

## Checklist results

### 1. Abacus bead animation (drag/push interaction correctness)
**PASS.**

The abacus is not drag-based; per-rod interaction is via `+`/`−` "push a bead" buttons (labelled
`Push a bead up/down: increase/decrease <Rod> rod`), which is the actual intended interaction
(confirmed by reading `AbacusStage`/`PLACE_VALUE_ROD_FIELDS` — there is no pointer-drag handler on
the beads themselves). Source code confirms bead motion is not a snap: `AbacusBead` damps its
mesh's Y position every frame via `THREE.MathUtils.damp(mesh.position.y, targetY, 9, delta)`
rather than setting `position` directly, so the bead genuinely slides rather than teleporting.

Visual evidence (desktop, Ones rod 3 → 4 → 5, i.e. crossing into the "heaven" bead):
- Before: `review-screenshots/wave12-2026-08-18/number-sense/nsl-abacus-bead-before.png` (ones = 3)
- +60ms after click (attempted mid-motion capture): `.../nsl-abacus-bead-mid.png`
- Settled after: `.../nsl-abacus-bead-after.png` (ones = 4, bead turned blue/active, correct rod
  position, Digits/Number/Expanded meters and right-panel Key Facts updated in lockstep to 574)
- Second push crossing the 5-threshold (activates the "heaven" bead worth 5, giving 4 active earth
  beads + 1 active heaven bead = 5): `.../nsl-abacus-heaven-bead-after.png` — all 5 beads on the
  Ones rod correctly render as active/blue, no overlapping or duplicated bead, no stray bead left
  in the wrong resting slot.

Same sequence repeated on mobile: `nsl-mobile-abacus-bead-before.png`, `-mid.png`, `-after.png` —
same correct settle behavior, digit counter and meters updated correctly (3 → 4).

Caveat (explicitly flagged, not guessed): a static screenshot 60ms after the click did not visibly
differ from the "before" frame at the pixel level in a way that unambiguously proves the
in-between animation frame (the earth-bead travel distance is only ~0.17 world units and the damp
happens quickly). I could not visually prove smooth interpolation vs. a very fast snap purely from
screenshots; my "no teleport" conclusion rests on (a) direct source-code reading, which shows
`useFrame` + `damp` is used, not a direct assignment, and (b) the settled end-states are always
geometrically correct with no glitched/duplicate bead artifacts across four separate pushes. This
is marked **unproven-by-screenshot-alone** but supported by code inspection, not guessed.

### 2. Desktop margins (1440x900)
**PASS.**

`review-screenshots/wave12-2026-08-18/number-sense/numbersense-abacus-desktop.png`. The abacus
sits inside its cream-toned canvas card, framed with visible margin on all sides — no clipping of
the frame, heaven bead, or resting earth beads (this was previously a P1 in Wave 10 per the code
comment at lines 1295-1307 in `NumberSenseLab.tsx`, and the fix — a desktop-specific camera rig
`ABACUS_CAMERA_DESKTOP` — is confirmed working: no clipping observed at 1440x900). The stage card,
left content-nav rail (240px), canvas toolbar rail, and right 360px detail panel together fill the
1440px width with intentional padding, not dead whitespace or a cramped/cropped abacus. Right
panel (`THE BASE-TEN PLACE VALUE` / definition / Key Facts / Digits/Number/Expanded) renders in
full with no overflow or clipping — see same screenshot.

### 3. Mobile switcher (390x844)
**PASS, with one related P1 finding (see below).**

`review-screenshots/wave12-2026-08-18/number-sense/numbersense-mobile-switcher.png`. A horizontal
"Component 5 of 10" pill row (Addition…Prime Number) is present directly under the abacus card and
is reachable — it is an `overflow-x-auto` scroll strip, confirmed functional: clicking the
"Place Value" pill correctly switched components in every mobile test run. It is not clipped
vertically. The active pill ("Place Value") is visibly highlighted.

### 4. Labels / stat text legibility
**PASS** at both viewports. "HUNDREDS ROD / TENS ROD / ONES ROD" labels and their digit values are
legible at 1440x900 (`numbersense-abacus-desktop.png`) and at 390x844
(`numbersense-abacus-mobile.png`). The Digits/Number/Expanded meter row (bottom overlay) is
legible at both sizes, including after values update from bead pushes
(`nsl-abacus-heaven-bead-after.png` shows "575" legible in all three meters and in the right-panel
Key Facts simultaneously).

### 5. Toolbar
**PASS** at both viewports.

Desktop: vertical left rail (Rotate, Play, Isolate, Section [disabled — expected, cross-section not
applicable to this manipulative], Compare, Zoom In, Zoom Out, Full, More, Reset) is fully visible
and not obscured — `numbersense-toolbar-desktop.png`. The "More" menu opens correctly and is fully
legible/not clipped: `numbersense-desktop-more-menu.png` (Show labels / X-Ray view / Fit view /
Clean view). X-Ray toggle produces a visible effect (bead opacity drops, colors lighten):
`numbersense-desktop-xray-on.png`. Isolate produces a clear, legible cause/effect: the right panel
swaps to a hotspot detail card ("Hundreds place — Function / Where it belongs") —
`numbersense-desktop-isolate-on.png`.

Mobile: toolbar collapses to a single horizontal icon pill row, all 10 icons visible, evenly
spaced, not overlapping or cut off — `numbersense-toolbar-mobile.png` (cropped closeup confirms
icons are crisp and individually tappable).

---

## Additional finding not explicitly on the checklist but discovered while verifying "panels do
not overflow" for the surrounding lab chrome

### P1 — Mobile "aside" detail panel is squeezed to a ~105px scroll peephole, hiding almost all of
its content by default
Route/surface: Number Sense lab, Place Value component (structure shared by all 10 operations),
mobile 390x844.

What's wrong: the right-hand `DetailPanel` (title "Place Value", tagline, definition, etc. — the
same content shown in full on desktop) lives in an `<aside>` with
`order-2 min-h-0 flex-1 overflow-y-auto` that, on mobile, is sandwiched between the component
switcher pill row above and the fixed `BottomTray` (Lesson/Checkpoint/Experiment/Notebook/
Real-world cards) below. Measured via DOM: this aside's visible `clientHeight` is only **105px**
against a `scrollHeight` of **204px** of actual content. In the default (unscrolled) state, the
switcher pill row alone consumes essentially all of that 105px, so the DetailPanel's title/
definition text is not visible at all without a small, easy-to-miss scroll gesture confined to a
105px-tall strip.

Evidence:
- Default/unscrolled state — DetailPanel content is entirely absent from view (only switcher pills
  then BottomTray cards are visible): `numbersense-mobile-switcher.png`,
  `numbersense-mobile-fullpage.png` (a `fullPage` screenshot, included to show this is not a
  page-level scroll issue — the panel is a nested `overflow-y-auto` region that doesn't expand the
  document height).
- Scrolled 200px within that nested container — the title "Place Value" and its definition become
  partially visible but are still cut off at both the top (by the switcher row above) and bottom
  (by the fixed BottomTray below): `numbersense-mobile-detailpanel-mid.png`,
  `numbersense-mobile-detailpanel-scrolled.png` (scrolling further did not reveal more — 200px was
  already at/near `scrollHeight`).

Severity rationale: P1, not P0 — the panel is technically reachable (no page crash, no hard
clipping bug in code, the container does scroll), and the same information is also accessible via
the "Lesson" button in `BottomTray` which opens a full-content modal (not audited in depth here,
out of explicit scope, but present as an alternate path). Still, this materially fails the "panels
do not overflow / are not cut off" bar in practice: an end user is very unlikely to discover or
successfully use a 105px scroll peephole to read the definition text, so the default mobile
experience effectively hides that panel's content.

Not verified: whether this same squeeze applies identically to all 10 number-sense components
(structure is shared/generic in code, so it is expected to, but only Place Value was directly
re-measured via DOM for this report — flagging as inferred-from-shared-code, not independently
re-measured on the other 9).

---

## Summary

| # | Check | Result |
|---|---|---|
| 1 | Abacus bead animation correctness | PASS (code-confirmed damped motion; screenshots show correct settle states; mid-frame animation not independently provable from a still image, noted as a caveat) |
| 2 | Desktop margins (1440x900) | PASS |
| 3 | Mobile switcher reachable | PASS |
| 4 | Labels/stat text legible | PASS |
| 5 | Toolbar visible/functional both viewports | PASS |
| Extra | Mobile DetailPanel squeeze | **P1** |

No P0s found. One P1 found (mobile DetailPanel scroll peephole, above). No P2 polish items were
separately logged beyond what's captured above.

## Screenshots (all under `review-screenshots/wave12-2026-08-18/number-sense/`)
- `numbersense-desktop-default.png`, `numbersense-addition-desktop.png` — lab chrome baseline
- `numbersense-abacus-desktop.png`, `numbersense-abacus-mobile.png` — framing check
- `nsl-abacus-bead-before.png`, `nsl-abacus-bead-mid.png`, `nsl-abacus-bead-after.png`,
  `nsl-abacus-heaven-bead-after.png` — desktop bead animation sequence
- `nsl-mobile-abacus-bead-before.png`, `nsl-mobile-abacus-bead-mid.png`,
  `nsl-mobile-abacus-bead-after.png` — mobile bead animation sequence
- `numbersense-toolbar-desktop.png`, `numbersense-desktop-more-menu.png`,
  `numbersense-desktop-xray-on.png`, `numbersense-desktop-isolate-on.png` — desktop toolbar
- `numbersense-toolbar-mobile.png` — mobile toolbar
- `numbersense-mobile-default.png`, `numbersense-mobile-switcher.png`,
  `numbersense-mobile-fullpage.png`, `numbersense-mobile-tunepanel.png` — mobile chrome
- `numbersense-mobile-detailpanel-mid.png`, `numbersense-mobile-detailpanel-scrolled.png` —
  evidence for the P1 finding above
