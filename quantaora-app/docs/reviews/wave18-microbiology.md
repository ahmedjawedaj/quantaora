# Wave 18 Visual QA — Microbiology Lab (regression re-test of Wave 14 P1)

- **Date:** 2026-08-18
- **Scope:** `MicrobiologyLab` at `http://127.0.0.1:5174/app/labs/microbiology`, focused on
  re-testing the Wave 14 "Tune microbe" panel / GLB-error `role="alert"` obstruction P1
  (see `docs/reviews/wave14-cross-lab-glb-failure.md`, section b).
- **Viewports:** Desktop 1440x900, Mobile 390x844
- **Method:** isolated Playwright (Chromium) sessions launched from `/tmp/wave18-microbiology-qa`
  against the pre-installed shared Playwright at `/tmp/wave18-pw-shared/node_modules/playwright`.
  Own `chromium.launch()` + `browser.newContext()` per script, fresh context per GLB-abort test.
  `page.route()` used to `route.abort('failed')` on only the *first* matching request for each
  target GLB, then pass-through (`route.continue()`) on subsequent requests to the same URL, so a
  retry click issues a genuinely new request that succeeds. `page.on('console')`,
  `page.on('pageerror')`, `page.on('request'/'requestfinished'/'requestfailed')` attached
  throughout. Read-only: no source files were edited; only screenshots were written, under
  `review-screenshots/wave18-2026-08-18/microbiology/`.
- Route/UI flow confirmed from source (`src/routes/MicrobiologyLab.tsx`) before testing: left-rail
  microbe list (desktop) / chip switcher (mobile) → select "Virus" → "Tune microbe" button opens a
  panel with "Inspect" buttons "Infection cycle (schematic)" / "Whole virion (real influenza)" /
  "Cutaway (real influenza)". GLB URLs: `virus-influenza-whole-nih.glb` and
  `virus-influenza-pathogenar-cutaway-nih.glb` under `/models/sourced/biology-gaps-wave2/`.

---

## Wave 14 P1 regression check — result: **FIXED**

Reading `src/routes/MicrobiologyLab.tsx` before testing showed a fix already present in code,
directly targeting the Wave 14 finding:

- `GlbErrorBoundary` (line ~673) now takes an `onError` callback, fired once in
  `componentDidCatch`, with an explicit code comment: *"Also fires `onError` (once, in
  componentDidCatch) so an ancestor with UI that floats over the canvas — here, the Tune panel —
  can react and get out of the way."*
- `VirusRealStructureScene` forwards this as `onGlbError` to `MicrobiologyCanvas`
  (`onVirusGlbError` prop, line ~1197), documented inline: *"Fired when the real-structure virus
  GLB ... fails to load, so the Tune panel ... can close itself out of the way ... stays fully
  reachable/reopenable afterward via its own 'Tune microbe' button."*
- Wired at the call site: `onVirusGlbError={() => setControlsOpen(false)}` (line 1550).

### b1. Whole virion — `virus-influenza-whole-nih.glb` — **PASS (P1 fixed)**

Fresh context. First request to the GLB aborted (`route.abort('failed')`), subsequent request
passed through.

- `page.on('pageerror')`: `Could not load /models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb: Failed to fetch`
- Console warning (caught): `[MicrobiologyLab] Virus model failed to load. Error: Could not load /models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb: Failed to fetch`
- Accessible fallback: `role="alert"` present, text `"This 3D virus model couldn't load. Try again"`.
- **"Tune microbe" panel auto-closed on error** — checked via `page.locator('text=Tune microbe · virus').count()` → `0` (panel heading not present; panel had closed itself). Confirmed visually: screenshot shows only the small "Tune microbe" pill button, not the open panel, alongside the fully visible error card.
- "Try again" button bounding box: `{"x":643.5,"y":416,"width":53,"height":41}` — fully on-canvas, not overlapped by any panel.
- **Natural click (no `force`) succeeded**: `tryAgainBtn.click({ timeout: 4000 })` → `SUCCESS`, no timeout.
- Network log confirms a genuinely new request, not a replayed failure:
  ```
  [request] .../virus-influenza-whole-nih.glb
  [route] aborting first request for whole-virion GLB
  [requestfailed] .../virus-influenza-whole-nih.glb net::ERR_FAILED
  ...
  [request] .../virus-influenza-whole-nih.glb        <- second, distinct request event
  [route] passing through subsequent request for whole-virion GLB
  [requestfinished] .../virus-influenza-whole-nih.glb  <- succeeded
  ```
- After retry: `role="alert"` count = `0` (fallback gone), model mounted and rendered (see
  screenshot), no blank canvas, hotspot labels and "Cycle stage" chip visible and correct.
- Evidence:
  - `desktop-whole-tune-panel-open.png` (panel open before selecting the failing variant)
  - `desktop-whole-glb-failure-panel-open.png` **(the regression check itself — panel is closed, "Try again" fully visible/unobstructed, right DetailPanel still showing Virus overview)**
  - `desktop-whole-after-tryagain-click-attempt.png` (immediately after the successful natural click)
  - `desktop-whole-after-retry-result.png` (model fully loaded post-retry: real influenza virion mesh, "Cycle stage: New viruses burst out", meter row correct, no alert)

### b2. Cutaway — `virus-influenza-pathogenar-cutaway-nih.glb` — **PASS (P1 fixed)**

Fresh context, same method, aborting only the cutaway GLB's first request.

- `page.on('pageerror')`: `Could not load /models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb: Failed to fetch`
- Console warning (caught): `[MicrobiologyLab] Virus model failed to load. Error: Could not load .../virus-influenza-pathogenar-cutaway-nih.glb: Failed to fetch`
- `role="alert"` present, text `"This 3D virus model couldn't load. Try again"`.
- Tune panel heading count after failure: `0` — panel auto-closed here too (same `onVirusGlbError` call site, shared by both variants).
- "Try again" bounding box identical position/size to b1 (`x:643.5,y:416,w:53,h:41`) — unobstructed.
- Natural click succeeded (no timeout, no `force` needed).
- Network log: abort → `requestfailed` → fresh `request` on retry → `requestfinished` (success).
- After retry: `role="alert"` count = `0`, model mounted.
- Evidence: `desktop-cutaway-glb-failure-panel-open.png`, `desktop-cutaway-after-retry-result.png`.

**Conclusion on Wave 14 P1:** the panel-obstruction bug is **fixed for both GLB variants**. The
fix is structural (an `onError` callback closes the panel), not incidental, and reproduces
consistently across two independent fresh-context runs. No `force: true` click was needed for
either variant — the natural, unmodified Playwright click succeeded in both cases, meaning a real
user could reach and click "Try again" without first discovering they need to close the panel
themselves.

---

## Successful load (no interception) — hotspots and cycle-stage info preserved

Verified this did **not** regress, per task instruction 6.

### Desktop 1440x900 — PASS

- Whole virion: loaded cleanly (`desktop-whole-success-loaded.png` not separately needed —
  see `desktop-whole-after-retry-result.png` for an equivalent clean-load view), "Cycle stage:
  New viruses burst out" label correct, meter row (`MICROBE / ALIVE? / COPY / INSPECT / MADE OF /
  STAGE`) all populated correctly.
- Clicked hotspot button "Neuraminidase (NA) spikes": right DetailPanel text changed from the
  generic "Virus" overview to `STRUCTURE / Neuraminidase (NA) spikes` with Function ("Helps newly
  made viruses cut free from the host cell surface so they can spread.") and "Where it belongs"
  boxes, plus an on-canvas floating "Neuraminidase (NA) spikes" label pill — confirmed via
  `innerText` diff (`before !== after` → `true`) and screenshot.
  Evidence: `desktop-whole-success-na-hotspot-clicked.png`.
- Cutaway: loaded cleanly, distinct camera angle showing the cut face (RNA/matrix visible
  inside). Clicked "Hemagglutinin (HA) spikes" hotspot: DetailPanel updated correctly to
  `STRUCTURE / Hemagglutinin (HA) spikes` with Function/Where-it-belongs text, confirmed changed.
  Evidence: `desktop-cutaway-success-loaded.png`, `desktop-cutaway-success-hotspot-clicked.png`.
- No console errors during either clean load (`page.on('console', 'error')` array was empty across
  a combined whole→cutaway sequence in the same session).

### Mobile 390x844 — PASS

- Initial load (Bacteria default) renders correctly: `mobile-initial-bacteria.png`.
- Switched to Virus via the mobile chip switcher (`MICROBE 2 of 5` row): `mobile-virus-selected.png`.
- Opened Tune panel, selected "Whole virion (real influenza)": model loads (`mobile-tune-panel-open.png` before selection, `mobile-whole-success-loaded.png` after — panel still open but partial model visible above it, no blank canvas).
- Closed panel: `mobile-whole-success-panel-closed.png` — model fully framed, meter chips legible, "Tune microbe" pill reachable.
- Clicked "Neuraminidase (NA) spikes" hotspot: on-canvas label chip "Neuraminidase (NA) spikes" appears; below-canvas panel switches to the detail view (confirmed by "← Back to Virus" link appearing).
  Evidence: `mobile-whole-success-na-hotspot-clicked.png`.
- Confirmed the STRUCTURE detail content itself (not just the "Back to Virus" header) is reachable
  by scrolling a nested `overflow-y-auto` pane (`scrollHeight: 587` vs `clientHeight: 138`) —
  scrolled it programmatically and captured the "WHERE IT BELONGS: Neuraminidase (NA) spikes →
  Virus → Microbial types → microbiology" text. Evidence:
  `mobile-whole-success-na-hotspot-detail-scrolled.png`. (This nested-scroll-with-no-visible-cue
  behavior matches a P2 already documented in `docs/reviews/wave12-microbiology.md`; not
  re-flagged as new, noted only for completeness.)
- Cutaway variant also spot-checked on mobile: loads cleanly (`mobile-cutaway-success-loaded.png`),
  clicked "Matrix protein (M1)" hotspot and confirmed the DetailPanel/label reacts
  (`mobile-cutaway-success-hotspot-clicked.png`).

### P2 (new instance of a previously-documented pattern) — on-canvas hotspot label partly occluded by meter chip, mobile cutaway

- **Mobile 390x844, cutaway, "Matrix protein (M1)" hotspot:** the floating on-canvas label pill is
  partly hidden behind the "ALIVE?" meter chip directly below it — only "...protein (M1)" is
  legible on-canvas, the word "Matrix" is cut off. The same information is still fully legible
  once the DetailPanel updates (not verified further since this is a canvas-label cosmetic issue,
  not an information-loss issue). This is the same category of finding as the wave12 P2 "Lipid
  envelope on-canvas label chip is partly occluded by the meter row," just reproduced here on a
  different hotspot (Matrix protein M1) in cutaway mode. Not re-counted as a new class of bug,
  flagged as a new occurrence for completeness.
  Evidence: `mobile-cutaway-success-hotspot-clicked.png` (crop confirms: "MICROBE" / "ALIVE?"
  meter chips sit directly under/over the tail of the label pill).

---

## Console / network summary across all sessions

- Benign/expected warnings seen in every session (not findings): `THREE.Clock: This module has
  been deprecated. Please use THREE.Timer instead.`; repeated
  `[.WebGL-...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to
  ReadPixels` (headless/software-GL artifact, self-silences); font-shaping debug lines
  (`unsupported GPOS table LookupType 8 format 2`, etc., from `console.debug`, not visible to
  users).
- Deliberate-abort sessions: exactly the expected `pageerror` (`Could not load
  .../<file>.glb: Failed to fetch`) and caught `console.warn` (`[MicrobiologyLab] Virus model
  failed to load. Error: ...`) per variant — no additional/unexpected errors.
- Clean success-path session (both variants loaded without interception): `page.on('console',
  'error')` array was empty; no `pageerror` events.
- No `requestfailed` events occurred outside the deliberately-aborted first request in each abort
  test.

---

## Findings by severity

- **P0:** none.
- **P1:** none currently open. **The Wave 14 P1 (obstructed "Try again" button behind the "Tune
  microbe" panel) is FIXED** — verified independently for both the whole-virion and cutaway GLB
  variants, with fresh browser contexts, a real (non-forced) Playwright click, and confirmation via
  network logs that the retry issues a genuinely new request that succeeds.
- **P2:**
  - Mobile 390x844, cutaway, "Matrix protein (M1)" on-canvas hotspot label chip partly occluded by
    the "ALIVE?" meter chip below it (same pattern as a wave12-documented P2 for a different
    hotspot/mode). Evidence: `mobile-cutaway-success-hotspot-clicked.png`.
  - (Carried over from wave12, re-observed not re-scored) DetailPanel's nested scroll pane on
    mobile has no visible scroll-affordance cue (unlike the Tune panel's chevron), though content
    is reachable by touch-scroll. Evidence: `mobile-whole-success-na-hotspot-detail-scrolled.png`.

## Not covered / out of scope for this pass

- Did not re-test the schematic "Infection cycle" default view GLB-free path (out of scope; task
  was specifically about the real-influenza GLB variants).
- Did not test simultaneous/interleaved abort of both GLBs in one session (task specified fresh
  context per variant, followed as instructed).
- Did not exhaustively re-verify every hotspot in both modes (HA/NA/envelope for whole-virion;
  HA/NA/Matrix/RNP for cutaway) — one representative hotspot per variant/viewport combination was
  clicked and confirmed functional, per task instruction 6 ("click at least one hotspot").
