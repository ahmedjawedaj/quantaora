# Wave 18 QA — Math Cup Failure Recovery (measuring-cup GLB)

Reviewer: Wave 18 reviewer (read-only visual QA)
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Route: `/app/labs/math-manipulatives` (`src/routes/MathManipulativesLab.tsx`), "Fraction" component
selected in the left rail / mobile chip strip.
GLB under test: `/models/sourced/math-wave2/measuring-cup-milkandbanana.glb`

Method: isolated Playwright (chromium) launched from a private scratch dir
(`/tmp/wave18-math-cup-qa`), requiring `playwright` from the shared install at
`/tmp/wave18-pw-shared/node_modules/playwright`. Each viewport run used its own fresh
`browser`/`context`. A **one-shot** `page.route()` handler aborted only the first request
matching `**/*measuring-cup-milkandbanana.glb*` (`route.abort('failed')`), then
`page.unroute()` was called immediately after the fallback UI appeared so any subsequent
(retry) request would pass through the network unmodified and succeed. `console`, `pageerror`,
`request`, `response`, and `requestfailed` listeners were attached for the full session.
DOM-mount check via `document.getElementById('root').innerHTML.length` /
`document.body.innerText.length`, taken before failure and after retry.

Viewports tested: **1440x900 desktop** (primary) and **390x844 mobile** (time allowed, full pass
completed). Both viewports produced the full sequence of screenshots and identical pass/fail
outcomes.

Screenshot dir: `review-screenshots/wave18-2026-08-18/math-cup/`

---

## Overall verdict: PASS — Wave 14 PASS verdict CONFIRMED, no regression

The stricter one-shot-intercept-then-genuine-retry methodology reproduces and reinforces Wave 14's
finding: the measuring-cup GLB failure is caught cleanly, the accessible fallback is fully visible
and unobstructed, the retry issues a genuinely new (not cached) request that succeeds, the app
never blanks out, and the fraction learning interaction (drag-to-fill + numerator/denominator/
tap-grid readouts) works normally after recovery, at both desktop and mobile viewports.

---

## Check-by-check results

### 1. Navigate to lab, select "Fraction" — PASS (both viewports)

- Desktop: `Fraction` chip in the left rail clicked directly; component header confirmed
  "Component 15 of 29 / Fraction" panel mounted (`FRACTION_CUP_IDS` group, per Wave 14 docs).
- Mobile: the left rail is not rendered at 390px width; the equivalent control is a horizontally
  scrollable chip strip at the bottom of the canvas card (`COMPONENT 1 OF 29` → after selecting,
  `COMPONENT 15 OF 29`). The plain-text "Fraction" chip required `scrollIntoViewIfNeeded()`
  before it was clickable (it was off-screen to the right in the scroll container on load) — this
  is normal horizontal-scroll-strip behavior, not a defect, and is noted only as a methodology
  detail for reproducibility.
- Evidence: `00-initial-load-desktop.png`, `00-initial-load-mobile.png`,
  `01-pre-failure-fraction-selected-desktop.png`, `01-pre-failure-fraction-selected-mobile.png`.

### 2. One-shot abort + unroute for genuine retry — PASS (both viewports)

- Route handler aborted exactly the first matching request and was `unroute()`d as soon as the
  fallback appeared, before "Try again" was clicked, so the retry path was never modified by the
  test harness itself.

### 3. Accessible error state (`role="alert"`), legible, unobstructed — PASS (both viewports)

- Desktop: `[role="alert"]` located, text: **"This 3D measuring cup model couldn't load.Try again"**
  (concatenated DOM text; visually rendered as "This 3D measuring cup model couldn't load." on one
  line and a distinct "Try again" button below it). Card renders inside its own small "Drag to
  fill the cup" panel in the top-right of the shared stage, fully visible, not overlapped by the
  tap-grid selector, key-facts panel, or any other overlay.
  Evidence: `02-failure-state-desktop.png`.
- Mobile: identical fallback card, same text, fully visible inside the same self-contained panel,
  not clipped by the viewport edge and not covered by the bottom chip strip.
  Evidence: `02-failure-state-mobile.png`.
- No obstruction issue found at either viewport (contrast with the Wave 14 Microbiology P1, which
  does not apply here — the math cup panel has no separate "Tune" overlay sitting on top of it).

### 4. Console messages / page errors — PASS, logged verbatim (both viewports)

Desktop:
```
[pageerror] Could not load /models/sourced/math-wave2/measuring-cup-milkandbanana.glb: Failed to fetch
[console.warning] [MathManipulativesLab] Measuring cup model failed to load. Error: Could not load /models/sourced/math-wave2/measuring-cup-milkandbanana.glb: Failed to fetch
    at http://127.0.0.1:5174/node_modules/.vite/deps/react-three-fiber.esm-CxgixgCJ.js?v=1bac4afe:1178:52
    at Object._onError [as onError] (http://127.0.0.1:5174/node_modules/.vite/deps/@react-three_drei.js?v=1bac4afe:16545:17)
    at http://127.0.0.1:5174/node_modules/.vite/deps/three.module-2I7R9NbB.js?v=1bac4afe:31458:36
[console.error] Failed to load resource: net::ERR_FAILED
```
Mobile: byte-identical error text (only the internal WebGL context id in the benign GPU-driver
warning lines differs, as expected per-process). No additional `console.error` or `pageerror`
events occurred at any other point in either run (pre-failure load, post-retry, or during the
fraction drag interaction). Only other console output was benign: Vite HMR connect messages, React
DevTools info line, `THREE.Clock` deprecation warning, and `GL_CLOSE_PATH_NV` GPU-stall
performance warnings (library/driver-level, not application bugs, not visible to end users).
This matches the raw internal error text pattern Wave 14 already flagged as console-only (never
rendered in the visible `role="alert"` text shown to the learner) — confirmed again here.

### 5. Genuinely new retry request (not cached), succeeds — PASS, exact timestamps below (both viewports)

Desktop — two distinct GLB requests logged via `page.on('request')`:
```
2026-08-18T03:54:59.199Z [request] http://127.0.0.1:5174/models/sourced/math-wave2/measuring-cup-milkandbanana.glb   (aborted)
2026-08-18T03:55:00.868Z [request] http://127.0.0.1:5174/models/sourced/math-wave2/measuring-cup-milkandbanana.glb   (after unroute + "Try again" click)
2026-08-18T03:55:00.872Z [response] status=200 url=.../measuring-cup-milkandbanana.glb
```
Exactly **2 distinct request events**, ~1.67s apart, second one uncontested by the route handler
and resolving `200`. The `role="alert"` element detached from the DOM at `03:55:03.608Z` (~2.7s
after the successful response, matching the model's own mount/decode time), confirming the retry
was a genuine new network round-trip, not a cached replay of the aborted response (an aborted
`net::ERR_FAILED` request has nothing cacheable to replay from).

Mobile — same pattern, 2 distinct requests:
```
2026-08-18T03:59:28.578Z [request] .../measuring-cup-milkandbanana.glb   (aborted)
2026-08-18T03:59:30.124Z [request] .../measuring-cup-milkandbanana.glb   (retry)
2026-08-18T03:59:30.133Z [response] status=200 url=.../measuring-cup-milkandbanana.glb
```
`role="alert"` detached at `03:59:32.719Z`. Same 2-request pattern confirmed independently at the
second viewport.

Evidence: `03-post-retry-desktop.png`, `03-post-retry-mobile.png`,
`04-model-mounted-after-retry-desktop.png`, `04-model-mounted-after-retry-mobile.png`.

### 6. App never blanks out — PASS (both viewports)

Desktop DOM checks:
- Before Fraction selected: `rootLen=91509`, `bodyText=2481`
- After Fraction selected / GLB aborted / alert shown: `rootLen=93640`, `bodyText=2793`
- After successful retry: `rootLen=92922`, `bodyText=2738`

Mobile DOM checks:
- Before Fraction selected: `rootLen=91509`, `bodyText=1427`
- After successful retry: `rootLen=92927`, `bodyText=1640`

`rootLen`/`bodyText` stayed non-trivial and in the same order of magnitude throughout every stage
at both viewports — no blank/crashed render at any point, including during the failure state
itself.

### 7. Fraction interaction + accompanying data table after recovery — PASS for the interaction; table N/A on this screen (both viewports)

- Desktop: drag-to-fill interaction on `aria-label="Drag to change how full the cup is"` moved the
  fill label **"3/8 full" → "7/8 full"**, with synchronized updates to: the liquid level rising
  visibly inside the cup mesh (confirmed visually in the after-drag screenshot), the tap-grid
  selector (3 of 8 squares green → 7 of 8 green), and the right-side key-facts panel
  (Numerator `3 → 7`, Denominator unchanged `8`, Simplified `3/8 → 7/8`), plus the numerator/
  denominator/simplified chips beneath the canvas. Cause/effect is legible and immediate.
  Evidence: before `01-pre-failure-fraction-selected-desktop.png` (post-recovery baseline is
  `04-model-mounted-after-retry-desktop.png`, showing fill "3/8 full") →
  `05-fraction-interaction-after-drag-desktop.png` (fill "7/8 full").
- Mobile: identical pattern, fill **"3/8 full" → "7/8 full"**, same synchronized tap-grid and
  key-fact updates. Evidence: `04-model-mounted-after-retry-mobile.png` →
  `05-fraction-interaction-after-drag-mobile.png`.
- **Data table:** the "Fraction" component screen has no accompanying data table in view. Per the
  Wave 14 `wave14-math-data-cup.md` doc (read as background for this task), the Data & Statistics
  table (`table` component id, headers "Row"/"Value"/"Change") is a **separate top-level
  component** under the "Data And Statistics" domain group in the same left rail / chip strip —
  it is not co-located with the Fraction/cup panel and does not render on this screen. A DOM text
  search for "Row"/"Value"/"Change" on the Fraction screen returned no matches at either viewport,
  confirming the table is simply not present here (not a rendering failure — this matches the
  known component architecture, not a regression). Table behavior on its own screen is out of
  scope for this task (already covered independently in Wave 14) and was not re-tested here.

### 8. Full screenshot sequence — captured (both viewports)

| Stage | Desktop | Mobile |
|---|---|---|
| Initial load | `00-initial-load-desktop.png` | `00-initial-load-mobile.png` |
| Pre-failure, Fraction selected | `01-pre-failure-fraction-selected-desktop.png` | `01-pre-failure-fraction-selected-mobile.png` |
| Failure state (`role="alert"`) | `02-failure-state-desktop.png` | `02-failure-state-mobile.png` |
| Post-retry (alert detaching) | `03-post-retry-desktop.png` | `03-post-retry-mobile.png` |
| Model mounted after retry | `04-model-mounted-after-retry-desktop.png` | `04-model-mounted-after-retry-mobile.png` |
| Fraction interaction after drag | `05-fraction-interaction-after-drag-desktop.png` | `05-fraction-interaction-after-drag-mobile.png` |

---

## Findings by severity

- **P0:** none.
- **P1:** none.
- **P2:** none newly observed in this run. (Wave 14's two P2 notes for this screen — stray
  unlabeled hotspot dots and the cup liquid rendering blue-gray/pale rather than milk-toned — were
  not the focus of this failure-recovery-scoped task and were not re-verified either way; not
  re-flagged here since out of this task's scope, see Unproven below.)

---

## Comparison against Wave 14 PASS verdict

**Confirmed, no regression.** Wave 14 (`wave14-cross-lab-glb-failure.md`, section c, and
`wave14-math-data-cup.md`) rated the math cup GLB failure path PASS with a fully visible,
unobstructed fallback and a reachable "Try again" control. This wave's stricter one-shot-abort
methodology (guaranteeing the retry genuinely re-hits the network rather than merely re-rendering
a cached failure) reproduces the same outcome at both viewports: identical fallback text, identical
unobstructed layout, a provably new 200-response retry (exact 2-request timestamp pairs logged
above), a full DOM-mount continuity check across all three stages, and confirmed working
fraction-interaction cause/effect after recovery. No new issues found; the PASS verdict holds.

---

## Unproven / not covered

- Wave 14's two P2 cosmetic notes (stray hotspot dots over the Data table; cup liquid color not
  matching the "milk" in the GLB filename) were not re-verified in this run — this task was scoped
  to the failure-recovery sequence specifically, not a full visual-polish pass of the panel.
- The Data & Statistics table's own behavior (headers, row +/- controls) was not re-tested here —
  it lives on a separate component screen per the architecture, confirmed out of view on the
  Fraction screen, and was already covered independently in `wave14-math-data-cup.md`.
- Cross-section/isolate/compare/zoom toolbar controls on the cup canvas were not exercised in this
  task — out of scope (only the failure/retry/interaction sequence was assigned).
- Did not test aborting the retry request itself (i.e., a second consecutive failure) — task scope
  was one abort followed by one genuine successful retry.
