# Wave 16 — Plants Lab targeted re-check (reviewer 3 of 8)

Route: `http://127.0.0.1:5174/app/labs/plants` (source `src/routes/PlantsLab.tsx`)
Scope: confirm (a) the 3D canvas stays visible while the growth/timeline slider is being
actively dragged, and (b) the "Reset" toolbar button is reachable and does not overlap
`BottomTray`, at mobile 390x844 and tablet 768x1024 (tablet was the prior failing size).
Desktop 1440x900 covered briefly for context.

Tooling: ad hoc Playwright/Chromium script (`/tmp/wave16-plants/script.js`, isolated
`/tmp/wave16-playwright` install, not part of the repo). Console + `pageerror` listeners
attached on every page load. Screenshots saved under
`review-screenshots/wave16-2026-08-18/plants/`.

Control used for "growth/timeline scrub": the Seed component's **Germination** range slider
in the "Tune plant" panel (`input[type="range"]` under the "Germination" label,
`src/routes/PlantsLab.tsx` line ~2318). It drives the seed's growth stage label (dry seed →
root first → shoot rises → leaves open) and visibly changes the shoot/root 3D geometry —
this is the lab's real cause/effect timeline control for the seed's growth story (a separate
GLB-based "Growth stage" scrubber also exists behind "Show real corn/flower growth stages
(3D)", but it depends on lazy-loaded GLTFs; the Germination slider is the always-present,
deterministic growth-timeline control and was used for the scrub evidence below).

## Console / page errors

No `pageerror` events fired at any viewport. Console output was limited to benign
diagnostics only:
- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (mobile,
  tablet, desktop)
- Mobile only: four `GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU
  stall due to ReadPixels` lines — a GPU performance/perf-log notice from the WebGL driver,
  not an application error, and it self-reports "this message will no longer repeat."
- Standard React DevTools info banner.

No console errors or warnings that indicate a broken canvas or crashed component.

## PASS/FAIL summary

### Mobile 390x844 — PASS
- Canvas non-blank at load: `mobile-01-initial.png` (chloroplast scene renders with visible
  geometry, labels, and toolbar).
- Canvas remains rendered and non-zero-sized throughout an active drag of the Germination
  slider through 4 intermediate positions (15%, 45%, 75%, 95%): canvas bounding box stayed
  `390x337.6` (non-zero) at every step, and `document.elementFromPoint` at the canvas center
  returned the `<canvas>` element itself (not covered by another element) at every step.
  Evidence: `mobile-02-midscrub-1.png` … `mobile-02-midscrub-4.png`. The growth-stage label
  visibly updates from "shoot rises" to "leaves open" across the drag, and the seedling's
  shoot geometry visibly grows taller — a clear, legible cause/effect signal.
- Reset button reachable, not overlapping `BottomTray`, both with the Tune panel open and
  closed: Reset bbox `{x:337.6, y:83, w:33.4, h:32}`, BottomTray bbox `{x:0, y:676, w:390,
  h:106}` — no rectangle overlap, Reset fully inside the 390x844 viewport, and
  `elementFromPoint` at Reset's center resolved to a descendant of the Reset button (the
  `<svg>` icon inside it), not something else. Evidence: `mobile-04-reset-vs-tray-panelopen.png`,
  `mobile-05-reset-vs-tray-panelclosed.png`.

### Tablet 768x1024 — PASS (explicit, not folded into mobile — this was the prior failure point)
- Canvas non-blank at load: `tablet-01-initial.png` (chloroplast scene renders correctly,
  full width, no cropping of the toolbar rail or top badge).
- Canvas remains rendered and non-zero-sized throughout the same 4-step Germination-slider
  drag: canvas bbox stayed `768x409.6` (non-zero) at every step, `elementFromPoint` at the
  canvas center returned `<canvas>` at every step (not covered). Evidence:
  `tablet-02-midscrub-1.png` … `tablet-02-midscrub-4.png`. The seedling's shoot visibly grows
  from a short single stalk to a taller two-leaf shoot across the drag steps, with the
  "Shoot rises" → "Leaves open" label updating live — clear cause/effect.
- Reset button reachable, not overlapping `BottomTray`, both with the Tune panel open and
  closed: Reset bbox `{x:21, y:442.75, w:46, h:35.25}`, BottomTray bbox `{x:0, y:845, w:768,
  h:179}` — no overlap, Reset fully inside the 768x1024 viewport (well above the tray's
  y=845 top edge, ~367px of clearance), and `elementFromPoint` at Reset's center resolved to
  a descendant of the Reset button (the icon's `<path>`). Evidence:
  `tablet-04-reset-vs-tray-panelopen.png`, `tablet-05-reset-vs-tray-panelclosed.png`. This is
  the specific "Reset ~60% obscured by BottomTray" defect flagged in a prior wave
  (`docs/reviews` wave14-COMBINED.md P1 #4b, later fixed in Wave 15 per the in-source
  regression comment in `src/routes/PlantsLab.tsx` and the guard tests
  `src/routes/plantsMobileCanvasAndTabletReset.test.ts`) — it does **not** reproduce at
  768x1024 today.

### Desktop 1440x900 (brief, optional) — PASS
- Canvas renders correctly at load and through the same drag sequence (canvas bbox
  `820x657`, unchanged and non-zero at every scrub step, `elementFromPoint` returned
  `<canvas>` throughout). Reset button (left-docked toolbar rail) is clearly separated from
  `BottomTray` with large vertical clearance in both Tune-panel-open and closed states.
  Evidence: `desktop-01-initial.png`, `desktop-02-midscrub-*.png`, `desktop-05-reset-vs-tray-panelclosed.png`.

## Findings

No P0 or P1 findings for the two specifically-scoped checks (canvas visibility during
timeline scrubbing; Reset vs. BottomTray overlap) at mobile or tablet.

- **P2** — Minor test-harness artifact, not a product bug: in a couple of mid-scrub
  screenshots (e.g. `mobile-02-midscrub-2.png`, `tablet-02-midscrub-4.png`) the "Lesson" /
  "Component X of 9" text in the panel below shows a native browser text-selection highlight.
  This is a side effect of the synthetic `mouse.down()` → `mouse.move()` drag sequence used
  to scrub the slider (the browser's default drag-to-select behavior firing outside the
  slider thumb's hit target on some intermediate frames), not something an end user would
  trigger by dragging the slider thumb itself with a normal touch/mouse interaction. Flagged
  for completeness but not counted as an app defect.

## Screenshot index

All under `review-screenshots/wave16-2026-08-18/plants/`:

- `mobile-01-initial.png`, `tablet-01-initial.png`, `desktop-01-initial.png` — initial load
- `mobile-02-midscrub-{1..4}.png`, `tablet-02-midscrub-{1..4}.png`,
  `desktop-02-midscrub-{1..4}.png` — canvas mid-drag at 15%/45%/75%/95% slider positions
- `mobile-03-after-scrub.png`, `tablet-03-after-scrub.png`, `desktop-03-after-scrub.png` —
  state immediately after releasing the drag
- `mobile-04-reset-vs-tray-panelopen.png`, `tablet-04-reset-vs-tray-panelopen.png`,
  `desktop-04-reset-vs-tray-panelopen.png` — Reset + BottomTray with Tune panel open
- `mobile-05-reset-vs-tray-panelclosed.png`, `tablet-05-reset-vs-tray-panelclosed.png`,
  `desktop-05-reset-vs-tray-panelclosed.png` — Reset + BottomTray with Tune panel closed
  (default state)

## Coverage note

This pass was scoped strictly to the Plants route's growth-slider/canvas-visibility and
Reset/BottomTray-overlap checks per the assignment; it did not re-review other Plants Lab
surfaces (hotspots, other components' sliders, lesson/quiz modals, compare mode) beyond what
was incidentally visible in the screenshots above.
