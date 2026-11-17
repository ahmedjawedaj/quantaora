# Wave 18 QA — Genetics DNA GLB failure recovery (strict one-shot-intercept re-verification)

Reviewer: Wave 18 reviewer (read-only visual QA)
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, confirmed `200` on `/`; not started/stopped/restarted)
Scope: GENETICS FAILURE RECOVERY (DNA GLB) only — re-verifying Wave 14's "a. Genetics DNA" PASS
verdict with a stricter methodology (one-shot request abort + unroute + genuine retry + mutation
scene regression check).

Method: isolated Playwright (chromium v1.62.1, using the shared install at
`/tmp/wave18-pw-shared/node_modules/playwright`, own browser instance, own scratch folder
`/tmp/wave18-genetics-qa/`). Desktop 1440x900 primary pass, plus a mobile 390x844 pass (time
allowed). `page.route()` registered with a counter-based one-shot handler that calls
`route.abort('failed')` only on the first matching request to
`*dna-b-form-double-helix-nih.glb`, then immediately calls `page.unroute()` so every subsequent
matching request (the retry) passes through completely unmodified. `page.on('console')`,
`page.on('pageerror')`, `page.on('request')`, `page.on('response')`, and `page.on('requestfailed')`
all logged for the full run.

**Important methodology correction vs. a naive re-run:** `GeneticsLab.tsx` calls
`useGLTF.preload(DNA_MODEL_URL)` at module scope (line 281), which fires the DNA GLB's *first*
network request as soon as the route/module loads — well before a user ever opens "Tune molecule"
or clicks "Real structure (PDB 1BNA)". An interceptor registered only after clicking "Real
structure" (i.e. after `page.goto`) never sees a request at all, because drei's `useGLTF` module
cache already resolved successfully from the preload; the click then just serves the cached mesh
instantly with zero new network activity, and the failure path is never exercised (confirmed
directly: a first attempt at this run using post-navigation `page.route()` produced a `role="alert"`
count of 0 and a `Try again` click timeout, because nothing had failed). Correct methodology is to
arm the one-shot abort **before** `page.goto()` so it catches the module-level preload request.
This is a materially stricter/more accurate repro than a route armed only around the click.

---

## Recovery sequence — Desktop 1440x900

### 1. Pre-failure — schematic view loads normally
Screenshot: `review-screenshots/wave18-2026-08-18/genetics/01-pre-failure-default.png`
Default "DNA" component, schematic helix view, fully rendered, canvas framed correctly, "Tune
molecule" and "Challenge" buttons visible in the bottom toolbar.
**PASS.**

### 2. Tune molecule panel opened
Screenshot: `review-screenshots/wave18-2026-08-18/genetics/02-tune-panel-open.png`
Panel shows "Molecule view" toggle: "Schematic (A-T / C-G rungs)" (active) and "Real structure
(PDB 1BNA)". Panel does not overflow or clip.
**PASS.**

### 3. One-shot abort armed pre-navigation, "Real structure (PDB 1BNA)" clicked → failure state
- The one-shot route fired exactly once during initial page load (the module-level
  `useGLTF.preload` call), and was unrouted immediately after:
  ```
  INTERCEPT #1: aborting first matching GLB request: http://127.0.0.1:5174/models/biology/genetics/dna-b-form-double-helix-nih.glb
  Called page.unroute() immediately after first intercept.
  ```
- Network log for the aborted attempt (`page.on('request')` / `page.on('requestfailed')`):
  ```
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025455780, "phase": "request" }
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025455841, "phase": "requestfailed", "errorText": "net::ERR_FAILED" }
  ```
- After clicking "Real structure (PDB 1BNA)" (which mounts `RealDnaHelixModel`, hitting the
  already-rejected cached promise for that URL), the error boundary rendered immediately without
  needing a second request — this is expected/correct behavior since drei's `useGLTF` cache holds
  the rejected promise from the preload.
- `page.on('pageerror')`: `Could not load /models/biology/genetics/dna-b-form-double-helix-nih.glb: Failed to fetch`
- Console warning (caught, not fatal): `[GeneticsLab] DNA model failed to load. Error: Could not load /models/biology/genetics/dna-b-form-double-helix-nih.glb: Failed to fetch`
- DOM mount check immediately after failure: `rootLen: 64806`, `bodyText: 2543` — app fully
  mounted, no blank/crash.
- Accessible fallback: `role="alert"` element present (count 1), exact text:
  `"This 3D DNA model couldn't load.\n\nTry again"` — matches Wave 14's documented text.
- Obstruction check: `Try again` button bounding box `{x:643.5, y:416, width:53, height:41}`
  (fully inside the 1440x900 viewport); the "Tune molecule" panel's own label bounding box is
  `{x:741, y:162.75, width:127.8, height:16.5}` — vertically and horizontally clear of the alert
  card, no overlap. Confirmed visually in the screenshot below: the alert card sits centered in
  the canvas well below and left of the Tune molecule panel.
- Screenshot: `review-screenshots/wave18-2026-08-18/genetics/03-failure-state.png` — alert card
  fully visible, "Try again" button legible and unobstructed, rest of the lesson panel/toolbar
  unaffected.

**PASS, P0 clear.** No obstruction (unlike the Microbiology P1 documented in Wave 14) — consistent
with Wave 14's finding for this specific lab.

### 4. Retry — genuinely new request, successful recovery
- GLB request count immediately before clicking "Try again": **1** (the aborted attempt only).
- Clicked `button:has-text("Try again")` — succeeded without timeout (button was reachable).
- Full network log after retry:
  ```
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025455780, "phase": "request" }        <- attempt #1 (aborted)
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025455841, "phase": "requestfailed", "errorText": "net::ERR_FAILED" }
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025460450, "phase": "request" }        <- attempt #2 (retry, ~4.67s later)
  { "url": ".../dna-b-form-double-helix-nih.glb", "ts": 1787025460461, "phase": "response", "status": 200 }
  ```
- **2 distinct request events confirmed**, ~4.67 seconds apart (not a cached replay — a real new
  network round-trip with its own `200` response), exactly matching the "genuinely new request,
  not a cached replay" requirement. This confirms `useGlbRetry`'s `useGLTF.clear(url)` call (in
  `src/components/explorer/useGlbRetry.ts`, wired into `GeneticsLab.tsx`'s
  `const { retryKey, retryLoad } = useGlbRetry(DNA_MODEL_URL)`) is working as intended for this
  call site.
- DOM mount check after successful retry: `rootLen: 68937`, `bodyText: 2584` — both non-trivial
  and larger than the failure-state numbers (more content rendered, i.e. the real mesh + its
  hotspots), app never blanked at any point in the sequence.
- `role="alert"` count after retry: **0** — the fallback correctly unmounted.
- `canvas` count after retry: **1** — WebGL canvas present and rendering.
- Screenshot: `review-screenshots/wave18-2026-08-18/genetics/04-post-retry-success.png` — real
  B-DNA mesh (PDB 1BNA) visibly rendered (tan/beige molecular surface, correctly framed, centered,
  not clipped by the canvas bounds), 3 colored hotspot markers visible and positioned on the
  model, "Tune molecule" panel still open and unobstructive.

**PASS.** Retry fires a genuinely new, successful network request and the model visibly mounts;
app never blanks.

### 5. Mutation scene — post-recovery regression check
Located via source inspection (`src/routes/GeneticsLab.tsx`): the "Mutation" component is a
left-rail item (exact-match button "Mutation"); its Tune molecule panel exposes "Change type"
(Substitution / Insertion / Deletion buttons), a "Base position" slider, and a "New base" selector
(A/T/C/G). The side panel shows a live "Mutation effect" readout (e.g. "substitution at base 4 →
silent").

- Navigated to "Mutation" (exact-text left-rail match found, 1 hit) — screenshot
  `review-screenshots/wave18-2026-08-18/genetics/05-mutation-scene-default.png`: default state is
  Substitution at base 4, effect reads **"substitution at base 4 → silent"**, one base pair rung
  highlighted with a colored dot marker.
- Clicked "Deletion" — screenshot
  `review-screenshots/wave18-2026-08-18/genetics/06-mutation-scene-deletion-applied.png`: effect
  readout visibly updated to **"deletion at base 5 → frameshift"**, the "Deletion" button is now
  the active/highlighted control, the affected-base marker changed color (from an amber/gold dot
  to a magenta/pink dot at the frameshift site), and the strand's rung layout visibly shifted
  below the mutation point (consistent with the documented frameshift behavior: "every codon after
  the mutation shifts").

**PASS.** Cause/effect is clear and legible: toggling mutation type produces an immediately visible
change in both the 3D scene (marker color/position, rung layout) and the side-panel text (effect
readout), and this works normally after the DNA-GLB failure/retry cycle — no regression from the
earlier failure state bled into this unrelated component.

---

## Mobile 390x844 pass

Repeated the full failure → retry sequence at 390x844 (same one-shot pre-navigation abort
methodology).

- Pre-failure screenshot: `review-screenshots/wave18-2026-08-18/genetics/07-mobile-pre-failure-default.png`
- Tune panel open screenshot: `review-screenshots/wave18-2026-08-18/genetics/08-mobile-tune-panel-open.png`
- Failure state: `review-screenshots/wave18-2026-08-18/genetics/09-mobile-failure-state.png` —
  `role="alert"` fallback card visible directly above the "Tune molecule" panel (which is docked
  lower on the mobile layout), no overlap; "Try again" button bounding box
  `{x:168.5, y:323.8, width:53, height:41}`, fully inside the 390x844 viewport
  (`withinViewport: true`). DOM check at failure: `rootLen: 64812`, `bodyText: 1704` (non-trivial,
  app mounted).
- Retry clicked successfully (no obstruction). Network log:
  ```
  { "ts": 1787025521511, "phase": "request" }   <- attempt #1 (aborted)
  { "ts": 1787025525332, "phase": "request" }   <- attempt #2 (retry, ~3.8s later)
  { "ts": 1787025525338, "phase": "response", "status": 200 }
  ```
  Again 2 distinct request events, confirming a genuine retry (not cached) on mobile too.
- Post-retry success: `review-screenshots/wave18-2026-08-18/genetics/10-mobile-post-retry-success.png`
  — real DNA mesh rendered and framed correctly inside the mobile canvas, hotspot markers visible,
  not clipped. DOM check at success: `rootLen: 69085`, `bodyText: 1745`.

**PASS at mobile viewport too** — no obstruction, no blanking, genuine retry, same as desktop.

---

## Findings by severity

- **P0:** none.
- **P1:** none.
- **P2:** none observed for this surface/flow.

## Comparison against Wave 14 verdict

Wave 14's "a. Genetics DNA" section verdict was **PASS (graceful degradation confirmed)**, with the
same accessible fallback text, the same non-obstructed "Try again" control, and a working nav-away.
This Wave 18 re-verification, using a stricter one-shot-intercept-then-unroute methodology (which
also required correcting for the module-level `useGLTF.preload` call that a naive post-click route
would have missed entirely), **confirms the Wave 14 PASS verdict still holds, with no regression**.
Additionally verifies two things Wave 14 did not test for this lab: (1) that a real, non-cached
retry genuinely re-issues the network request and succeeds (2 distinct request/response pairs, ~4.7s
apart on desktop / ~3.8s apart on mobile, both ending in `200`), and (2) that recovery does not
leave any regression in an unrelated feature (the Mutation scene's substitution/insertion/deletion
toggle) — confirmed still fully functional with clear, legible cause/effect after the failure/retry
cycle. Also newly confirms the same non-obstruction result holds at mobile 390x844, which Wave 14
did not cover for any lab.

## Unproven / not covered

- Did not test the Insertion mutation type specifically (only default Substitution and Deletion
  were exercised) — Deletion was sufficient to prove the mutation scene updates correctly
  post-recovery; Insertion was not independently re-verified in this run.
- Did not re-test nav-away-after-failure (Wave 14 already proved this for Genetics DNA; not
  re-run here since this task's scope was specifically the intercept/retry/mutation-regression
  methodology, not a full re-run of every Wave 14 check).
- Did not test aborting the retry itself (i.e., a second consecutive failure) — only a single
  fail-then-succeed cycle was exercised, per task instructions.
