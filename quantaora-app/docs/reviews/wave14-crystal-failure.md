# Wave 14 Visual QA — Crystal Structures FAILURE flow (network interception)

Reviewer: Wave 14 reviewer #2 (crystal-failure scope)
Date: 2026-08-18
Route: `http://127.0.0.1:5174/app/labs/molecules` → "Crystal Structures" tab
Method: Playwright (chromium, local install in `/tmp/wave14-crystal-failure-qa`), `page.route()` with `route.abort('failed')` on the three crystal GLB URLs, set up before navigation. Fresh browser context per test.

## Headline verdict

**FIXED — PASS.** The Wave 12 P0 finding ("failed crystal GLB fetch crashes the entire app to a blank cream page with zero UI") **does not reproduce**. In every test (Diamond, Silicon Carbide, Graphite, desktop and mobile), the app rendered a graceful in-canvas error card ("This crystal lattice model couldn't load." + "Try again" button) while the header, nav, side tabs, lattice-comparison panel, and bottom lesson/checkpoint/notebook bar all remained fully intact and interactive. `#root` innerHTML stayed populated (~50,800–51,900 chars) in every case, never near-zero.

A new, unrelated **P1** finding was discovered during this pass: the "Try again" retry button does not actually retry — clicking it triggers no new network request for the GLB. A second **P1** finding: the Silicon Carbide crystal's top instructional banner overflows and visually collides with the left toolbar, rendering garbled/duplicated text.

## Per-crystal results

### Diamond (`crystal-diamond-carbon-nih-material-fixed.glb`) — default/first-loaded — CRITICAL CASE

**PASS** (graceful degradation).

- Desktop 1440x900 screenshot: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-diamond-glb-failure-desktop.png`
- Mobile 390x844 screenshot: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-diamond-glb-failure-mobile.png`
- `page.evaluate` DOM check (desktop): `{"rootLen":50817,"bodyText":2633}` — full UI present, not a crash.
- `page.evaluate` DOM check (mobile): `{"rootLen":50825,"bodyText":1713}` — full UI present.
- UI shows an accessible, human-readable, in-canvas error card: **"This crystal lattice model couldn't load."** with a dark pill button labeled **"Try again"**. This text is legible, non-technical, and appropriately placed inside the 3D viewport area (not a raw stack trace or console-only message).
- Header ("Quantaora"), top nav (Explore/Subjects/Labs/Notebook/Parent-Teacher), tab bar (Molecules & Bonding / Crystal Structures), left crystal list (Diamond/Silicon Carbide/Graphite), right-hand "Lattice Comparison" + "The Crystal Lattices" content panel, and bottom Lesson/Checkpoint/Experiment/Notebook/Real-World strip all render normally and are unaffected by the GLB failure.
- Left toolbar (Rotate/Play/Isolate/Section/Compare/Zoom In/Zoom Out/Full/More/Reset) remains visible and appears clickable, though its function against a failed model was not exercised beyond visibility.
- **Navigability confirmed**: clicked "Labs" in the top nav after the failure; app navigated cleanly to `http://127.0.0.1:5174/app/labs` (labs catalog) with no freeze. Screenshot: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-diamond-after-nav-click.png`.
- Verbatim console/page errors captured:
  - `[error] Failed to load resource: net::ERR_FAILED`
  - `PAGEERROR: Could not load /models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb: Failed to fetch`
  - `[warning] [CrystalViewer] Crystal GLB failed to load. Error: Could not load /models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb: Failed to fetch` (at react-three-fiber.esm / @react-three_drei / three.module in Vite deps)
  - `[log] THREE.WebGLRenderer: Context Lost.` (appears once, after the failed load; did not visibly break the rest of the UI)
- These logs indicate the failure **is** caught — the `[CrystalViewer] Crystal GLB failed to load` warning is a deliberate log line, consistent with an error boundary or try/catch now present around `useGLTF()` in `CrystalViewer.tsx` (inspected only via observed runtime behavior, not by reading source, per read-only-observation scope for this report).

**Retry mechanism — P1 FAIL (present but non-functional):**
- A "Try again" button is present and clickable.
- Test: began with route blocked, clicked "Try again" ~3s after the initial failure card appeared, then unblocked the route (`blocked = false`) immediately before the click.
- Result: the screenshot after clicking "Try again" (`crystal-diamond-after-retry-desktop.png`) is pixel-identical in layout to the pre-retry failure state — the same "This crystal lattice model couldn't load." card is still shown, model never renders.
- Follow-up isolated test with a request counter confirmed: **clicking "Try again" fires zero new network requests** for the diamond GLB (`Request #1` logged only once, at initial load; no `Request #2` after the retry click, even with the route unblocked). The button visibly exists and is styled as an active call-to-action but does not re-invoke the GLTF loader / does not clear whatever cached rejected-promise state is blocking the reload.
- Severity: **P1** — this is a real usability gap (a retry affordance that silently does nothing), not the P0 full-app-crash from Wave 12, but a user who hits a transient network blip has no way to recover without a manual page reload.

### Silicon Carbide (`crystal-silicon-carbide-2h-nih-material-fixed.glb`)

**PASS** (graceful degradation) with one adjacent **P1 layout defect**.

- Desktop 1440x900 screenshot: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-silicon-carbide-glb-failure-desktop.png`
- `page.evaluate` DOM check: `{"rootLen":51884,"bodyText":2936}` — full UI present, header/nav/panels intact.
- Same accessible error card and "Try again" button shown ("This crystal lattice model couldn't load.").
- Verbatim console: `[error] Failed to load resource: net::ERR_FAILED`; `PAGEERROR: Could not load /models/sourced/chemistry-gaps-wave2/crystal-silicon-carbide-2h-nih-material-fixed.glb: Failed to fetch`; `[warning] [CrystalViewer] Crystal GLB failed to load. Error: ...` — same pattern as Diamond.
- **P1 (independent layout bug, observed only in this state):** the top instructional banner pill ("Silicon Carbide (Silicon (Si) and Carbon (C) — a compound, not elemental silicon) · drag to rotate · tap a hotspot") is long enough that it overflows left and visually overlaps/renders behind the left vertical toolbar column. The result is garbled duplicated text fragments reading "n atom" / "n atom" stacked over the "Rotate" toolbar label, and the banner's own leading text is clipped so it visibly starts mid-word ("...RBIDE (SILICON (SI) AND CARBON (C)..." instead of "SILICON CARBIDE..."). Confirmed via DOM measurement: the banner text element starts at `left: 313px` with `width: 713px` (extends to x≈1026), while the "Rotate" toolbar label sits at `left: 289px, top: 152px`, directly under/behind the banner's start — a clear z-index/positioning collision, not just a screenshot artifact. Zoomed evidence: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-silicon-carbide-banner-zoom.png`.
  - This bug reproduces because Silicon Carbide's title/subtitle string is materially longer than Diamond's; it is plausible (not confirmed, since I did not read source) that this container simply isn't sized/truncated for longer crystal names and would show regardless of GLB load success or failure — flagging as observed-in-this-flow, not confirmed as failure-specific.

### Graphite / Graphene Sheet (`crystal-graphite-sheet-nih-material-fixed.glb`)

**PASS** (graceful degradation), no additional layout issues observed.

- Desktop 1440x900 screenshot: `review-screenshots/wave14-2026-08-18/crystal-failure/crystal-graphite-glb-failure-desktop.png`
- `page.evaluate` DOM check: `{"rootLen":50992,"bodyText":2809}` — full UI present.
- Same accessible error card ("This crystal lattice model couldn't load." + "Try again"), header/nav/panels intact, banner text ("Graphite (Graphene Sheet) (Carbon (C) only) · drag to rotate · tap a hotspot") fits within its container without the overlap seen on Silicon Carbide.
- Verbatim console: `[error] Failed to load resource: net::ERR_FAILED`; `PAGEERROR: Could not load /models/sourced/chemistry-gaps-wave2/crystal-graphite-sheet-nih-material-fixed.glb: Failed to fetch`; `[warning] [CrystalViewer] Crystal GLB failed to load. Error: ...`.
- Retry button present (not separately click-tested for this crystal, given the retry mechanism was already confirmed non-functional for Diamond via a general/shared code path — see Diamond section).

## Findings summary

| # | Severity | Surface / viewport | Finding | Evidence |
|---|----------|---------------------|---------|----------|
| 1 | P1 | Crystal Structures — Diamond, desktop 1440x900 | "Try again" retry button on the GLB-load-failure card does not trigger a new network request / does not recover the model; state is unchanged after clicking it with the route unblocked. | `crystal-diamond-after-retry-desktop.png`; request-counter test showed 1 request total (no retry request fired) |
| 2 | P1 | Crystal Structures — Silicon Carbide, desktop 1440x900 | Top instructional banner text overflows and renders overlapping/behind the left toolbar, producing garbled duplicated "n atom" text and clipping the banner's own leading words. | `crystal-silicon-carbide-glb-failure-desktop.png`, `crystal-silicon-carbide-banner-zoom.png` |
| 3 | P2 | Crystal Structures — Diamond, mobile 390x844 | Formula/Bonds-per-atom/Dimensionality stat cards and the Graphite tab label are visually truncated ("FORMU", "BONDS/", "3D netwo", "Graphite (Grap...") at this viewport; text is cut off rather than wrapped or abbreviated cleanly. | `crystal-diamond-glb-failure-mobile.png` |

**No P0 findings.** The previously-reported Wave 12 P0 (full app crash / blank cream page / empty `#root`) is **not reproduced** for any of the three crystal GLBs, at either viewport tested.

## Unproven / not covered

- Whether the "Try again" button's non-functionality (finding #1) is a `useGLTF`/drei cache-invalidation issue vs. some other cause — I only observed the runtime symptom (no new request fired), not the implementation, per read-only scope.
- Whether the Silicon Carbide banner-overlap bug (finding #2) also occurs on a **successful** load (i.e., whether it's failure-specific or a general layout defect for long crystal titles) — out of scope for this failure-focused pass; only observed in the intercepted-failure state.
- Toolbar button *functionality* (Rotate/Isolate/Section/Compare/Zoom/Full/Reset) against a failed-to-load model — only checked for visibility/presence, not click-behavior, since the model itself never renders in the failure state.
- Retry-button behavior for Silicon Carbide and Graphite specifically (only Diamond's retry was click-tested end-to-end); assumed to share the same non-functional behavior based on the Diamond result and identical error-card markup, but not independently verified per-crystal.
- Mobile 390x844 viewport was only tested for Diamond, not Silicon Carbide or Graphite.
- Compare mode ("Compare all 3 lattices") was not tested under a GLB failure condition.
- Any *partial* failure scenario (e.g., only one of the three crystal GLBs failing while the others succeed, or a failure that occurs after a successful load then a tab-switch back) was not tested.
- Network throttling / slow-load (as opposed to hard `abort('failed')`) was not tested — only immediate hard failure.

## Tooling notes

- Local Playwright 1.62.1 installed ad hoc via `npm install --no-save --prefix /tmp/wave14-crystal-failure-qa playwright@1.62.1` (no changes to project `package.json`/lockfiles).
- All scripts run from `/tmp/wave14-crystal-failure-qa/*.mjs` via plain `node`, each launching its own isolated `chromium` browser/context. No shared state with the dev server beyond normal HTTP GET/route-intercepted traffic.
- Dev server at `http://127.0.0.1:5174` was left running and untouched throughout.
