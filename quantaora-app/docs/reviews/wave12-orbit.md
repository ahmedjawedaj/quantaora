# Wave 12 Visual Acceptance Review — Orbit (Space / Solar System Lab)

- Date: 2026-08-18
- Scope: `orbit` (SpaceLab component, `http://127.0.0.1:5174/app/labs/orbit`)
- Reviewer: isolated Playwright Chromium session (`/tmp/quantaora-wave12-orbit`), read-only
- Viewports: desktop 1440x900, mobile 390x844
- Screenshots: `review-screenshots/wave12-2026-08-18/orbit/`

Note on scope discovery: read-only inspection of `src/routes/SpaceLab.tsx`, `src/components/explorer/OrbitSandbox.tsx`, `src/components/explorer/CanvasControls.tsx`, and `src/data/planets.ts` was used only to locate selectors/buttons for automation and to understand the camera-fit mechanism referenced in findings below — no source files were modified.

## Summary

| # | Checklist item | Verdict | Worst severity |
|---|---|---|---|
| 1 | Repeated fresh loads — deterministic camera framing | **FAIL** | P1 |
| 2 | Planet switching (Saturn / Neptune / Ceres) — bounds visible, deterministic re-fit, rings not cut off | **PARTIAL FAIL** | P1 |
| 3 | Mobile planet selector — usable, switching works | **PARTIAL FAIL** | P1 |
| 4 | Toolbar (zoom/reset/fit) — visible, produces visible effect | **PARTIAL FAIL** | P1 |

No P0s observed — the app is reachable, no route crashes, no blank canvases, no console/page errors beyond benign browser-level warnings (below). All failures are framing/clipping/legibility issues, not app-breaking.

## Console / page errors observed (verbatim)

Across every page load and interaction, the only console output was:

```
THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[.WebGL-0x....]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
```

These are benign, non-blocking, driver/library-level warnings that appeared identically on every reload and route in this session (likely an artifact of headless Chromium's software/ANGLE GL path, not app-specific). No `pageerror` events and no `requestfailed` network events were observed on any load or interaction in this session.

---

## Item 1 — Repeated fresh loads: deterministic camera framing

**Verdict: FAIL (P1).**

Did 3 cold `page.goto()` navigations (not client-side nav) to `/app/labs/orbit` at 1440x900, each in a fresh Playwright page, waiting for `networkidle` + canvas + 2.5s settle before screenshotting.

Evidence:
- `orbit-reload1-desktop.png`
- `orbit-reload2-desktop.png`
- `orbit-reload3-desktop.png`

Observed: the canvas is never blank/partial — all 3 loads render a full populated solar-system scene. However, the **camera zoom/framing level visibly differs across the 3 loads** — in reload 2 the camera is noticeably more zoomed out than reload 1 and 3 (all bodies render smaller, Saturn sits near the left edge of frame), and reload 3 is more zoomed in than reload 1. This is a real, reproducible framing inconsistency, not a screenshot-timing artifact (all 3 were captured after the same settle delay and the same default selection, Earth).

Likely mechanism (reported as context, not as a prescribed fix): each mount seeds every body's orbital start angle from `Math.random()`, so Saturn (and every other body) starts at a different point in its orbit on every load; the camera-fit logic factors in the *live* position of every ringed body on every distance computation regardless of which body is selected, so a randomly-placed Saturn can force a different final camera distance on each load even though the same planet (Earth) is selected in all three.

**Unproven / not verified:** whether this also happens at mobile viewport (only tested at desktop for this specific reload-comparison item, per the 3 reload screenshots requested) — visually spot-checked mobile loads later in this session (see Item 3) and they also showed a live, moving scene consistent with the same randomized-start-angle mechanism, but no formal 3x-mobile-reload comparison was captured.

---

## Item 2 — Planet switching: Saturn, Neptune, Ceres

**Verdict: PARTIAL FAIL (P1).**

No "dwarf planets" / "show more" toggle exists in this build — Ceres and Pluto are simply the last two items in the single always-visible, scrollable planet list (desktop left sidebar has 11 items total: Sun, Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto, Ceres). Ceres was reached by scrolling that list to the bottom. This is a discovery note, not a fail in itself.

- **Saturn** (desktop): selected via sidebar. Full model + rings clearly visible, well inside canvas bounds, not clipped, camera clearly re-centered/re-fit around it. **PASS.** Evidence: `orbit-saturn-desktop.png`.
- **Neptune** (desktop): full model visible, not clipped, camera re-fit deterministically for this selection. **PASS.** Evidence: `orbit-neptune-desktop.png`.
- **Re-selecting Saturn** after visiting Neptune reproduced the same framing as the first Saturn selection within the same session (no leftover Neptune framing). **PASS.** Evidence: `orbit-saturn-desktop-refit-check.png` vs `orbit-saturn-desktop.png`.
- **Ceres** (desktop): selectable, and the label/marker does move to Ceres, but **the camera does not meaningfully zoom in on it** — because Saturn's rings are always factored into the required camera distance regardless of the current selection, the framing stays at the same wide "whole solar system" zoom level used for Saturn/Neptune. At that zoom, Ceres (a ~470 km body) renders as a single indistinct dot next to Jupiter — effectively illegible, not usably "framed." **FAIL, P1.** Evidence: `orbit-ceres-desktop.png` (full scene) and `orbit-ceres-desktop-crop-detail.png` (pixel-level crop of the Ceres marker showing it as a barely-visible speck).
- **Saturn's rings clipped by canvas edge under repeated Zoom In** (found while testing Item 4, but directly relevant to this item's "rings not cut off" requirement): after repeatedly pressing the Zoom In toolbar button (~28-30 clicks) with Earth selected, Saturn (present elsewhere in the scene, not selected) ends up with its ring visibly cut off by the right edge of the 3D canvas/stage, where it meets the right-hand detail panel. **FAIL, P1.** Evidence: `zoomdebug-2-after30zoomin.png` (full frame) and `orbit-saturn-clipped-after-zoomin-crop.png` (crop showing the clipped ring edge against the detail-panel boundary).

**Unproven / not verified:** Sun and other rocky/ice-giant bodies (Mercury, Venus, Mars, Jupiter, Uranus, Pluto) were visible as background bodies in captured screenshots but were not each individually selected and screenshotted — only Earth (default), Saturn, and Neptune were explicitly selected and checked per the assigned checklist scope.

---

## Item 3 — Mobile planet selector (390x844)

**Verdict: PARTIAL FAIL (P1).**

A horizontally-scrollable chip-row planet selector is present below the canvas, labeled "PLANET X OF 11", and is reachable/usable — not hidden or cut off. Switching planets on mobile works: clicking Saturn/Neptune/Ceres chips (after `scrollIntoView` for later ones) correctly re-selected each body and updated the detail panel and 3D scene. **PASS** for reachability/usability of the selector itself. Evidence: `orbit-mobile-selector.png`, `orbit-mobile-initial.png`, `orbit-saturn-mobile.png`, `orbit-neptune-mobile.png`, `orbit-ceres-mobile.png`.

However:
- When **Saturn** is selected on mobile, its rings render directly underneath/behind the "ORBIT SANDBOX · CLICK A PLANET..." instruction pill overlaid at the top of the canvas — the top portion of the ring system is visually obscured by that opaque banner. **FAIL, P1.** Evidence: `orbit-saturn-mobile.png`, cropped detail visible in the top band of that same image (ring top edge runs directly into the pill's rounded bottom edge).
- The same overlap pattern (label/body sitting directly under the top instruction banner) recurred with **Earth** after a Reset+Zoom-In sequence later in the session (`orbit-mobile-after-zoomin.png`), suggesting this is a general risk whenever a body's live orbital position happens to fall in the top strip of the canvas, not a Saturn-only issue — but Saturn's case is the most visible instance since its rings are large relative to the frame.
- Ceres on mobile has the same "too-small-to-see-when-selected" issue as desktop (Item 2). Evidence: `orbit-ceres-mobile.png`.

Full-page capture (`orbit-mobile-fullpage.png`) shows no additional page-level scroll/overflow beyond the viewport-sized capture — bottom tray (Lesson/Checkpoint/Experiment/Notebook) and bottom nav render fully, no clipped panel text observed.

---

## Item 4 — Toolbar controls (zoom/reset/fit), both viewports

**Verdict: PARTIAL FAIL (P1)** — controls are visible/reachable at both viewports and mostly produce visible effects, but see the Saturn-clipping finding under Item 2 which was discovered via this control.

- **Desktop:** toolbar rail (Rotate, Play/Pause, Isolate, Section, Compare, Zoom In, Zoom Out, Full, More, Reset) is fully visible at the top-left of the canvas, none of the icons are cut off or obscured. Evidence: `orbit-toolbar-before-desktop.png`.
  - Zoom In / Zoom Out: an initial quick test (5 zoom-in clicks then 10 zoom-out clicks, animation running) showed only a small pixel-diff between before/after screenshots and looked visually almost identical — ambiguous at first glance. A follow-up, more rigorous test (animation paused first via the Play/Pause toggle to remove orbital-drift noise, then 20 Zoom Out clicks followed by 30 Zoom In clicks, each checked against the button's `disabled` state) showed a **clear, large, unambiguous visible effect** in both directions (scene shrinks dramatically on zoom-out, grows dramatically on zoom-in). **PASS** overall for "produces a visible effect." Evidence: `zoomdebug-0-paused.png` → `zoomdebug-1-after20zoomout.png` → `zoomdebug-2-after30zoomin.png`. Note the Zoom In button correctly self-disabled once it reached the minimum camera distance (observed at click 29 of 30).
  - Reset: confirmed to return the scene to the default Earth selection/framing. Evidence: `orbit-toolbar-after-reset-desktop.png`.
  - Isolate: toggling it visibly dims/fades the non-selected bodies and orbit rings relative to the selected body. **PASS.** Evidence: `orbit-toolbar-after-isolate-desktop.png` vs `orbit-toolbar-before-desktop.png`.
  - **However**, pushing Zoom In to its limit (as above) is what produced the Saturn ring-clipping shown in `orbit-saturn-clipped-after-zoomin-crop.png` — so while the control is reachable and visibly responsive, its extreme end-state can clip a body that should stay fully in frame per the review's explicit quality bar. Filed under Item 2 above; cross-referenced here since it's a toolbar-driven failure mode.
- **Mobile:** toolbar renders as a horizontal icon strip at the top of the canvas, all icons visible, not overlapping or cut off. Zoom In (4 clicks) and Zoom Out (8 clicks) both produced clear, visible size changes to the scene, and Reset correctly returned to Earth. **PASS.** Evidence: `orbit-mobile-after-zoomin.png`, `orbit-mobile-after-zoomout.png`, `orbit-mobile-after-reset.png`.

**Unproven / not verified:** the "Section" (cross-section) and "Compare" tools were visible on the toolbar at both viewports but their disabled/enabled state and interaction effect were not exercised in this pass (out of the explicit checklist's named controls — zoom/reset/fit — so left unverified rather than guessed at).

---

## Overall findings list (severity-sorted)

**P1**
1. Camera framing is not deterministic across cold reloads of the same default state (Earth selected) — zoom level visibly differs between 3 successive fresh loads. (`orbit-reload1-desktop.png`, `orbit-reload2-desktop.png`, `orbit-reload3-desktop.png`)
2. Selecting Ceres (and by extension any small/dwarf body) does not produce a usable close-up framing — the camera stays at the same wide, Saturn-dominated zoom level, rendering Ceres as an indistinct single-pixel dot. Reproduced on both desktop and mobile. (`orbit-ceres-desktop.png`, `orbit-ceres-desktop-crop-detail.png`, `orbit-ceres-mobile.png`)
3. Saturn's rings become clipped by the canvas/panel edge after repeatedly pressing Zoom In (~28-30 clicks) on desktop, even though Saturn is not the selected body. (`zoomdebug-2-after30zoomin.png`, `orbit-saturn-clipped-after-zoomin-crop.png`)
4. On mobile, Saturn's rings render partially behind/underneath the top "ORBIT SANDBOX..." instruction banner overlay when Saturn is selected, obscuring part of the model. (`orbit-saturn-mobile.png`)

**P2**
- None specifically isolated beyond the above; no minor framing/spacing/text issues were observed that weren't already covered by a P1 above.

## Explicitly unproven / not covered in this pass

- Full 3x-reload determinism comparison was only performed at the desktop viewport, not mobile.
- Not every planet (Sun, Mercury, Venus, Mars, Jupiter, Uranus, Pluto) was individually selected/screenshotted — only Earth (default), Saturn, Neptune, and Ceres per the assigned checklist scope.
- Cross-section ("Section") and "Compare" toolbar tools were seen but not functionally exercised.
- No internal QA/placeholder/debug text was observed anywhere in the UI copy captured during this pass, but this was not an exhaustive text audit of every string in the lab (e.g., quiz/lesson modal content was not opened).
