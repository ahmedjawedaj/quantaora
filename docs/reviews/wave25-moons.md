# Wave 25 QA Report — Moons Lab, Tiger Stripes / South Polar Geysers Recheck

**Scope:** Moons lab only, Enceladus's two spatially clustered hotspots (`tiger-stripes`,
`south-polar-geysers`) — independent read-only reviewer, isolated Playwright/Chromium process
(own `chromium.launch()`, fresh `browser.newContext()` per viewport, never reused across steps).
**Route:** `http://127.0.0.1:5174/app/labs/moons` → selected Enceladus (moon 5 of 5; the route's
default moon is Earth's Moon, so Enceladus was explicitly selected via the UI in every session
before any hotspot interaction).
**Viewports:** Desktop 1440×900, Mobile 390×844.
**Date:** 2026-08-18.
**Screenshots/data:** `review-screenshots/wave25-2026-08-18/moons/` (repo root, i.e.
`/Users/ahmedjawed/Documents/Kids Learning app/review-screenshots/wave25-2026-08-18/moons/` —
24 files: 17 PNGs (3 of which are 2×-upscaled crops for close inspection) + 7 JSON data files
including `console-log.json`, `desktop-followup-console-log.json`, `desktop-summary.json`,
`mobile-summary.json`).

Prior context reviewed (read-only, methodology reference only): `docs/reviews/wave24-moons.md`.
Current code reviewed (read-only): `src/components/explorer/MoonModel.tsx`,
`src/routes/MoonsLab.tsx`, `src/data/moons.ts`. The code is byte-for-byte the same "Wave 23
rewrite" architecture wave24 tested — single shared floating label, screen-space proximity
clustering at `CLUSTER_THRESHOLD_PX = 28`, external `data-testid="moon-hotspot-list"` — so this
wave independently re-ran the interactions rather than assuming the prior PASS still holds.

Tooling note: no project-local Playwright install exists in `quantaora-app/node_modules` or
`package.json`; used `npx playwright` (resolved via the existing npx cache, no dependency added
to the project) to drive a real Chromium instance ad hoc from two throwaway Node scripts run
through Bash (not committed to the repo, not part of the app).

---

## 1. Selecting "Tiger Stripes" gives distinct, correct scene feedback — **PASS**

Verified twice: once via the external hotspot list, once via a direct click on Tiger Stripes' own
raw 3D marker (camera auto-rotate paused first via the "Rotate" toolbar toggle so marker screen
position was stable for a clean direct-click test — see method note below).

- External list selection: `desktop-02-select-tiger-stripes.png`. Label text `"Tiger Stripes"`,
  `aria-pressed="true"` on the Tiger Stripes list item, `aria-pressed="false"` on South Polar
  Geysers', side detail panel text contains "Tiger Stripes", model dims (per-hotspot isolate
  effect) — all correct, no South Polar Geysers content visible anywhere.
- Direct raw-marker click (unclustered at this camera angle): `desktop-10-direct-click-tiger-stripes.png`.
  Single label reads "Tiger Stripes", anchored at Tiger Stripes' own marker; South Polar Geysers'
  own dot is plainly visible nearby, unselected (plain white ring, no ping/scale/label) — a clean,
  legible before/after: two separate real markers, one selected, one not.
- Measured (`desktop-summary.json`, entry `m1`): exactly 1
  `[data-testid="moon-selected-hotspot-label"]` element, text "Tiger Stripes", rect fully
  contained inside `[data-lab-stage]`'s rect, zero overlap with `[data-moon-caption-pill]`.

## 2. Selecting "South Polar Geysers" gives its own distinct, correct scene feedback — **PASS**

Same double verification.

- External list: `desktop-03-select-south-polar-geysers.png`. Label "South Polar Geysers",
  `aria-pressed` correctly flips (`ariaSPG: "true"`, `ariaTSwhileSPG: "false"`), detail panel text
  contains "South Polar Geysers", no leftover Tiger Stripes label/text anywhere
  (`staleCheck1` = `["South Polar Geysers"]`, i.e. exactly one label, the right one).
- Direct raw-marker click: `desktop-11-direct-click-south-polar-geysers.png`. Label reads "South
  Polar Geysers" at its own anchor; Tiger Stripes' own dot visible nearby, unselected.
- Measured (`m2`): 1 label, text correct, contained in stage, no caption-pill overlap.

## 3. Toggling directly between the two — **PASS**, no wrong-content or stale/overlapping label at any point

Two independent toggle sequences were run:

- **Sequence A (external list, desktop):** TS → SPG → TS → SPG, capturing every settle plus one
  mid-transition frame (150ms after the click, before the layout effect's next frame) —
  `desktop-02-select-tiger-stripes.png` → `desktop-03-select-south-polar-geysers.png` →
  `desktop-04-toggle-back-tiger-stripes.png` → `desktop-05-transition-to-spg-mid.png` (mid-flight
  frame — already shows only "South Polar Geysers", no residual "Tiger Stripes") →
  `desktop-06-settled-spg-again.png`. Every measured state (`m1`–`m4` in `desktop-summary.json`)
  found exactly 1 label element with the correct text and no caption-pill overlap.
- **Sequence B (direct raw-marker clicks, camera stationary, 3 repeated cycles):** TS→SPG×3 —
  screenshots `desktop-10/11`, and per-cycle DOM measurements `desktop-cycle1-click-ts` through
  `desktop-cycle3-click-spg` in `console-log.json`'s companion, none produced a mismatch (the test
  script explicitly asserted `labelTexts[0] === 'Tiger Stripes'` / `'South Polar Geysers'` after
  each click and logged nothing — 6/6 clicks resolved to the correct hotspot, 0 mismatches).
  Composite screenshot after the cycles: `desktop-12-after-toggle-cycles.png`.
- **Sequence C (mobile, clustered by default, external list — see item 5):** TS → SPG → TS,
  `mobile-03-select-tiger-stripes.png` → `mobile-04-select-south-polar-geysers.png` →
  `mobile-05-toggle-back-tiger-stripes.png`. All three correct, single-label, no cross-content.

No instance across ~13 toggles (7 desktop unclustered + 3 desktop cycles + 3 mobile clustered)
showed the wrong hotspot's label, description text, or a stale label left over from the prior
selection.

## 4. No visual/label overlap between the two hotspots' UI — **PASS**

`getBoundingClientRect()` containment/overlap checks were run at every measured step (not just a
sample), against `[data-lab-stage]` (the clipped canvas) and `[data-moon-caption-pill]` (the
bottom caption chrome the label must clear):

| Viewport | State | Label rect (t/b/l/r) | Contained in stage | Overlaps caption pill |
|---|---|---|---|---|
| Desktop | Tiger Stripes (list) | 554.28/586.71/601.84/715.36 | true | false |
| Desktop | South Polar Geysers (list) | 531.42/563.25/607.61/770.90 | true | false |
| Desktop | Tiger Stripes (toggle back) | 551.60/583.60/617.59/729.61 | true | false |
| Desktop | South Polar Geysers (toggle again) | 525.70/556.55/612.91/771.16 | true | false |
| Desktop | Tiger Stripes (direct marker click) | 555.57/588.22/587.87/702.13 | true | false |
| Desktop | South Polar Geysers (direct marker click) | 537.16/570.01/586.86/755.42 | true | false |
| Mobile | Tiger Stripes (list) | 307.87/333.40/122.97/212.32 | true | false |
| Mobile | South Polar Geysers (list) | 298.19/323.37/108.80/237.99 | true | false |
| Mobile | Tiger Stripes (toggle back) | 307.30/332.61/129.53/218.12 | true | false |

Full stage/pill rects and every additional measured cycle are in `desktop-summary.json`,
`mobile-summary.json`, and `console-log.json`. `document.querySelectorAll('[data-testid="moon-selected-hotspot-label"]')`
returned exactly 1 element at every single measurement (never 0 while a hotspot was active, never
2+) — mutual label overlap remains structurally impossible under this architecture, confirmed
fresh rather than assumed.

Additionally cropped/2×-upscaled close-ups of the clustered mobile state (see item 5) —
`mobile-03-select-tiger-stripes-CROP-2x.png`, `mobile-04-select-south-polar-geysers-CROP-2x.png`,
`mobile-05-toggle-back-tiger-stripes-CROP-2x.png` — confirm the label pill text itself never
visually collides with the nearby cluster badge or the other hotspot's dot even when the two
hotspots' real anchors are only a few px apart on screen.

## 5. External hotspot list usable at both viewports, correct scene feedback from it — **PASS**

**Desktop 1440×900** (`desktop-08-hotspot-list-panel.png`): "Hotspots on Enceladus" list shows
all 4 items (Tiger Stripes, South Polar Geysers, Cratered Northern Terrain, Smooth Ice Plains),
fully legible, sits entirely to the right of the clipped 3D stage (list x-range starts at 1101,
stage right edge at 1080 — same non-overlapping layout wave24 measured). Clicking each of Tiger
Stripes / South Polar Geysers from this list correctly selected that exact hotspot every time (see
items 1–3).

**Mobile 390×844** (`mobile-02-hotspot-list-panel.png`): same list renders as a 2-column wrapped
button row below the canvas. At this viewport and camera framing, Tiger Stripes and South Polar
Geysers are screen-space clustered into one `"2"` badge on the model
(`mobile-cluster-info-default.json`: `data-cluster-hotspot-ids="tiger-stripes,south-polar-geysers"`),
so the external list is the only way to disambiguate which one you're picking — and it worked
correctly both directions: tapping "Tiger Stripes" in the list selected Tiger Stripes
(`mDetailTS: true`, `mAriaTS: "true"`), tapping "South Polar Geysers" selected that instead
(`mDetailSPG: true`, `mAriaSPG: "true"`, and `mAriaTSwhileSPG: "false"` confirms Tiger Stripes'
list item correctly un-pressed).

**Re-check of wave24's P1** ("clustered selection produces no visible change on the 3D
marker/model, only in the side panel"): **not reproduced this wave.** At 2× crop
(`mobile-03-select-tiger-stripes-CROP-2x.png` / `mobile-04-select-south-polar-geysers-CROP-2x.png`),
selecting either hotspot from the list now visibly changes the 3D scene itself, not just the side
list: the single floating label appears directly over the model reading the correct name, the
cluster badge switches to its active/selected ring style, and a sliver of the individual selected
hotspot's own highlighted ring peeks out from behind the cluster badge — on a different side
(left for Tiger Stripes, right for South Polar Geysers) matching their slightly different real
authored positions. This is a real, on-canvas, per-hotspot-distinguishable signal, which directly
addresses wave24's P1. Filing this as a **re-verified improvement**, not re-opening wave24's
finding, since current behavior does not match what wave24 described as broken.

- **P2 carried forward, unchanged:** mobile list's second row (Cratered Northern Terrain / Smooth
  Ice Plains) still sits close to the fixed bottom tab bar with little visual breathing room —
  visible in `mobile-02-hotspot-list-panel.png`. Not re-measured for click reliability this wave
  (out of this wave's two-hotspot scope), flagged only for continuity with wave24's note.
- **P2, new, out of this wave's core scope:** the top canvas caption pill on mobile truncates
  mid-word — `"TAP A HOTSPOT TO EXPLO…"` — visible in every mobile screenshot
  (e.g. `mobile-01-enceladus-default.png`). Cosmetic only, does not affect hotspot selection or
  label correctness.

---

## Method note: auto-rotate and the "direct marker click" tests

`autoRotate` defaults to `true` on this route. The first full test pass (list-driven, ~700ms
between steps) was run with auto-rotate left on, matching how a real user would first land on the
page. A **second, follow-up pass** explicitly paused auto-rotate (clicking the "Rotate" toolbar
toggle) before doing raw-marker click tests, so marker screen position was stable and Playwright's
click coordinates couldn't go stale between the pre-click "is this marker clickable" check and the
actual click dispatch. One early ad hoc direct-marker click attempted *without* pausing rotation
(`desktop-07-direct-marker-click-tiger-stripes.png`) landed on a moment where continued rotation
had already re-clustered Tiger Stripes with South Polar Geysers between the check and the click —
the click correctly no-opped against the (now pointer-events-disabled) raw marker rather than
mis-selecting, which is itself consistent behavior, not a bug, but is a test-timing artifact, not
independent evidence — superseded by the paused-rotation follow-up in items 1–3 above, which is
the reliable result.

---

## Console / page errors

No `pageerror` (uncaught exception) events in either the main pass or the follow-up pass. Console
output is the same benign set wave24 saw: Vite HMR connect/connected, React DevTools banner,
`THREE.Clock` deprecation warning, GL driver perf messages (`GPU stall due to ReadPixels`). Full
raw logs: `console-log.json`, `desktop-followup-console-log.json`.

---

## Summary table

| # | Check | Verdict | Evidence |
|---|---|---|---|
| 1 | Tiger Stripes selection gives distinct, correct scene feedback | PASS | `desktop-02-select-tiger-stripes.png`, `desktop-10-direct-click-tiger-stripes.png` |
| 2 | South Polar Geysers selection gives distinct, correct scene feedback | PASS | `desktop-03-select-south-polar-geysers.png`, `desktop-11-direct-click-south-polar-geysers.png` |
| 3 | Toggling both directions never shows wrong/stale content | PASS | `desktop-04/05/06`, `desktop-12`, `mobile-03/04/05`, per-cycle DOM asserts (0 mismatches / 13 toggles) |
| 4 | No visual/label overlap (measured, not eyeballed) | PASS | rect table above, `desktop-summary.json`, `mobile-summary.json` |
| 5 | External hotspot list usable + correct at both viewports | PASS | `desktop-08-hotspot-list-panel.png`, `mobile-02-hotspot-list-panel.png` |
| — | wave24 P1 (clustered mobile selection invisible on-canvas) | **not reproduced — appears fixed** | `mobile-03/04/05-*-CROP-2x.png` |
| P2 (carried forward) | Mobile list 2nd row cramped against bottom tray | unchanged, not re-verified for click reliability | `mobile-02-hotspot-list-panel.png` |
| P2 (new, cosmetic) | Mobile top caption pill truncates mid-word ("EXPLO…") | noted | `mobile-01-enceladus-default.png` |
| — | Console/page errors | none | `console-log.json`, `desktop-followup-console-log.json` |

## Overall verdict: **PASS**

All 5 requested checks pass on independently re-run, freshly measured evidence (not assumed from
prior waves). The Tiger Stripes / South Polar Geysers pair shows correct, distinct, non-colliding
scene feedback on both selection paths (external list and direct 3D marker) and at both viewports,
including the clustered mobile case, where wave24's P1 (no visible on-canvas change) did not
reproduce this run. Only cosmetic P2s remain, neither specific to the two-hotspot collision class
this wave targeted.
