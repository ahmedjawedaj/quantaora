# Wave 16 — Microbiology Lab (Virus) Visual QA

Route: `http://127.0.0.1:5174/app/labs/microbiology` (BrowserRouter). Source: `src/routes/MicrobiologyLab.tsx`.
Scope: virus organism only — infection-cycle schematic (procedural, always available) plus the two real-influenza
GLB "Inspect" modes (`whole-virion`, `cutaway`), reached via Tune microbe panel → Inspect → "Whole virion (real
influenza)" / "Cutaway (real influenza)". Viewports: desktop 1440×900, mobile 390×844.

Tooling: ad hoc Playwright (Chromium) driven from `/tmp/wave16-microbiology/script.js`, using
`page.route('**/*.glb', ...)` to abort `virus-influenza-*.glb` requests, then unblocking and clicking "Try again"
while observing `page.on('request'|'response'|'requestfailed'|'console'|'pageerror')`. Screenshots saved under
`review-screenshots/wave16-2026-08-18/microbiology/`.

Note: the default virus view (`Inspect → Infection cycle (schematic)`) is fully procedural three.js geometry, not
a GLB — it never enters a load-failure state. The failure/retry path only exists for the two real-influenza GLB
"Inspect" modes, so all failure-state testing below deliberately switches into `whole-virion` (or `cutaway`).

## Summary verdict

- Panel-obstruction regression (wave14 P1 #6, guarded by `src/routes/microbiologyRetryPanelObstruction.test.ts`):
  **PASS on desktop**, confirmed directly. **New, different obstruction found on mobile** (see P1 below) — the
  Tune panel itself does correctly auto-close, but a different element (the collapsed meter-chip row) still
  visually covers the retry button at 390px width.
- Retry recovery ("clicking retry actually recovers"): **FAIL — directly observed, not assumed.** Clicking
  "Try again" never re-issues the network request and the model never recovers, on both desktop and mobile. See P0
  below with the exact request/response event log.
- Clean successful path (mode toggle + hotspots): **PASS**, confirmed with visible cause/effect on both the
  hotspot click and the Inspect-mode toggle.

---

## P0 — Blocking

### 1. "Try again" never actually retries the GLB fetch — the model never recovers, confirmed via network log

**Route/surface:** Microbiology → Virus → Inspect: Whole virion (real influenza), desktop 1440×900 and mobile
390×844.

**What's wrong:** After a simulated GLB failure, clicking the "Try again" button does **not** re-issue an HTTP
request for the model, even after the interceptor blocking the file is removed. `page.waitForResponse()` for the
GLB URL after the retry click timed out on both viewports (`NO RESPONSE OBSERVED`), and the failure card ("This 3D
virus model couldn't load." / "Try again") is still on screen afterward, pixel-identical apart from the
independently-ticking "Cycle stage" label. This was verified two independent ways:
- **Live network capture:** zero `request`/`response` events matching `virus-influenza-*.glb` fired between the
  retry click and a 2.5 s wait, on both desktop and mobile runs.
- **Static source read:** `GlbErrorBoundary`'s `onRetry` (MicrobiologyLab.tsx, `VirusRealStructureScene`, around
  the `retryKey` state) only does `setRetryKey((k) => k + 1)` to remount the Suspense/error boundary — it never
  calls `useGLTF.clear(url)`. `useGLTF` (drei) delegates to react-three-fiber's `useLoader`, which caches the
  load **promise** globally, keyed only by `[Loader, url]`, independent of the React component tree
  (`node_modules/@react-three/fiber/dist/events-*.esm.js`, `useLoader`/`suspend()`). Once a URL's promise rejects,
  every subsequent `useGLTF(url)` call — including from a freshly remounted component — synchronously replays the
  same rejected promise instead of issuing a new request. `useLoader.clear`/`useGLTF.clear(path)` exists precisely
  to invalidate that cache entry before a retry, and it is not called here.
- A full page reload *does* recover the model (confirmed: after `page.goto()` with the interceptor removed, both
  GLBs return `200` immediately via the module-level `useGLTF.preload()` calls) — so the only way an end user can
  currently recover from this failure is to reload the whole lab, not by using the button whose entire purpose is
  to retry in place.

**Evidence:**
- `review-screenshots/wave16-2026-08-18/microbiology/desktop-virus-failure.png` — initial failure state.
- `review-screenshots/wave16-2026-08-18/microbiology/desktop-virus-retry-recovered.png` — **same failure card
  still showing** after unblocking the network and clicking "Try again".
- `review-screenshots/wave16-2026-08-18/microbiology/mobile-virus-retry-recovered.png` — same on mobile.
- Captured log lines: `[retry-response:desktop] NO RESPONSE OBSERVED`, `[dom-check:desktop-recovered]
  {"canvasPresent":true,"canvasSize":{"w":820,"h":657},"alertStillPresent":true}`, `[retry-response:mobile] NO
  RESPONSE OBSERVED`, `[dom-check:mobile-recovered] {"canvasPresent":true,"alertStillPresent":true}`.

---

## P1 — Significant

### 2. Mobile: retry button is visually invisible, hidden behind the collapsed meter-chip row (390×844)

**Route/surface:** Microbiology → Virus → Inspect: Whole virion (real influenza), mobile 390×844.

**What's wrong:** This is a *different* bug from the wave14 panel-obstruction regression, which **is** fixed —
`onVirusGlbError={() => setControlsOpen(false)}` correctly closes the Tune panel, confirmed by
`tunePanelOpen:false` in the DOM check on both viewports. But at 390px width the canvas is compressed to `56svh`,
and the centered `<Html center>` failure card lands low enough to sit directly behind the always-on collapsed
meter-chip row (`Microbe / Alive? / Copy / Inspect / Made of / Stage`, rendered at `absolute bottom-3 ... z-10`).
A pixel crop of the failure state shows only "This 3D virus model couldn't load." with **no visible "Try again"
button at all** — the pill is fully painted over by the "ALIVE? / no — not a cell" chip.

Programmatically the click still "succeeds" (Playwright's `getByRole('button', {name:'Try again'}).click()` did
not error) only because the meter-chip row's wrapper is deliberately `pointer-events-none` (per the code comment
in `MicrobiologyLab.tsx` explaining that this was done so the row doesn't swallow hotspot clicks) — so
`elementFromPoint` skips it and finds the button underneath. That means clicks technically pass through to the
retry button, but a real learner has **no visible cue that a button is there at all** on mobile; the failure state
reads as a dead end. (This is moot for actually recovering the model, given P0 #1 above — even a fully visible
retry button still wouldn't succeed — but it's a distinct, directly-observed rendering/layering issue in its own
right.)

**Evidence:**
- `review-screenshots/wave16-2026-08-18/microbiology/mobile-virus-failure.png` — full failure state; no "Try
  again" text visible below "This 3D virus model couldn't load."
- `review-screenshots/wave16-2026-08-18/microbiology/mobile-virus-failure-tryagain-obscured-crop.png` — 4×
  cropped/zoomed view of the exact button coordinates, showing the "ALIVE? / no — not a cell" meter chip painted
  directly over where the retry pill should be.
- DOM check: `{"found":true,"rect":{"x":168.5,"y":323.8,"width":53,"height":41},"topElTag":"BUTTON","topElText":"Try
  again","isBtnOrDescendant":true,"tunePanelOpen":false,"inViewport":true}` — confirms the button exists, is
  in-viewport, and is technically hit-testable, while the screenshot shows it is not visibly painted.

---

## PASS — Confirmed working correctly

### 3. Retry button is fully unobstructed on desktop (wave14 P1 #6 regression check)

Desktop 1440×900: after the simulated GLB failure, the Tune microbe panel auto-closes
(`onVirusGlbError={() => setControlsOpen(false)}` fires as designed), and the "This 3D virus model couldn't
load." / "Try again" card renders centered in the canvas with nothing else overlapping it. Bounding-box +
`elementFromPoint` check confirmed the button's own center point resolves to the button itself
(`isBtnOrDescendant:true`), and the collapsed meter-chip row sits well below it with no visual overlap. See
`review-screenshots/wave16-2026-08-18/microbiology/desktop-virus-failure.png`.

### 4. Successful path: hotspots and Inspect-mode toggle both produce clear, legible cause/effect

Desktop 1440×900, no interception:
- Loading `Inspect → Whole virion (real influenza)` renders the real influenza capsid GLB non-blank, centered and
  fully framed in the canvas, with the attribution banner correctly reading "Real influenza virion · NIH 3D ·
  CC0". `review-screenshots/wave16-2026-08-18/microbiology/desktop-virus-success-wholevirion.png`.
- Clicking the "Hemagglutinin (HA) spikes" hotspot marker on the model produces an immediate, clear state change:
  a label chip appears on the model, and the right-hand detail panel swaps to a dedicated HA-spikes card
  (Structure/Function/"Where it belongs" breadcrumb). `desktop-virus-success-hotspots.png`.
- Toggling `Inspect → Cutaway (real influenza)` swaps to the distinct cutaway GLB (different geometry, internal
  RNA/matrix visible, attribution banner updates to "Real influenza virion · cutaway · NIH 3D / PathogenAR ·
  CC-BY 4.0") — a visibly different model, not a no-op. `desktop-virus-success-cutaway-toggle.png`.
- Switching back to `Inspect → Infection cycle (schematic)` and clicking "Step infection stage" moved the stage
  label from "Host copies the virus" to "Virus attaches" (cycle wrapped) with a matching visible change in the
  procedural scene (virus dot repositioned near the host cell, stage caption updated).
  `desktop-virus-success-stage-step.png`. Logged: `[stage-step:desktop] before="Stage: Host copies the virus"
  after="Stage: Virus attaches"`.
- No lorem ipsum, TODO strings, or internal component/debug names observed anywhere in the UI copy during this
  pass.

### 5. Mobile Tune panel itself does not overflow

`review-screenshots/wave16-2026-08-18/microbiology/mobile-virus-tune-open.png` — the Tune microbe panel renders
correctly at 390px width with a scroll affordance (bounce chevron) for the extra content below the fold; no
clipped buttons or horizontal overflow observed.

---

## Console / network log excerpts (raw)

```
[request:desktop] GET .../virus-influenza-whole-nih.glb
[abort:desktop] .../virus-influenza-whole-nih.glb
[requestfailed:desktop] .../virus-influenza-whole-nih.glb :: net::ERR_FAILED
[pageerror:desktop] Could not load /models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb: Failed to fetch
[console:desktop] warning: [MicrobiologyLab] Virus model failed to load. Error: Could not load ... Failed to fetch
[retry-response:desktop] NO RESPONSE OBSERVED
...
[request:mobile] GET .../virus-influenza-whole-nih.glb
[abort:mobile] .../virus-influenza-whole-nih.glb
[requestfailed:mobile] .../virus-influenza-whole-nih.glb :: net::ERR_FAILED
[pageerror:mobile] Could not load /models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb: Failed to fetch
[retry-response:mobile] NO RESPONSE OBSERVED
```

No unrelated JS errors/crashes observed; the only `pageerror`/`console.error` entries are the expected
GLB-load-failure ones from the simulated abort, each caught cleanly by `GlbErrorBoundary` (no blank/crashed
canvas, no app-wide crash). Benign warnings only: `THREE.Clock` deprecation, a WebGL "GPU stall due to
ReadPixels" perf notice, and opentype.js "unsupported GPOS/GSUB table" font warnings (all pre-existing, unrelated
to this surface).

## Coverage note

Per scope, only the virus organism / real-influenza GLB failure-retry path and the virus successful path
(mode toggle + hotspots) were tested. Bacteria/fungus/protozoa/microbiome were not exercised beyond confirming
they appear as selectable entries in the organism list — out of scope for this pass.
