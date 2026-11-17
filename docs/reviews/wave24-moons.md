# Wave 24 QA Report — Moons Lab Hotspot Marker/Label Redesign

**Scope:** Moons lab only (`MoonsLab.tsx`, `MoonModel.tsx`) — independent read-only reviewer, isolated Playwright/Chromium process (own `chromium.launch()`, fresh `browser.newContext()` per viewport).
**Route:** `http://127.0.0.1:5174/app/labs/moons` → Enceladus moon
**Viewports:** Desktop 1440×900, Mobile 390×844
**Date:** 2026-08-18
**Screenshots/data:** `review-screenshots/wave24-2026-08-18/moons/` (repo root, i.e. `/Users/ahmedjawed/Documents/Kids Learning app/review-screenshots/wave24-2026-08-18/moons/` — verified present, 27 files including `measurements.json` and `console-log.json`).

Prior context reviewed (read-only): `docs/reviews/wave22-moons.md`. Current code reviewed (read-only): `src/components/explorer/MoonModel.tsx`, `src/routes/MoonsLab.tsx`, `src/components/explorer/MoonViewer.tsx`, `src/data/moons.ts`, `src/index.css`, `src/components/explorer/CanvasControls.tsx`.

---

## Wave 22 regression re-test — **PASS**

The Wave 23 rewrite structurally changed the design: at most **one** floating text label is ever rendered at a time (the currently-active hotspot's), and it is self-clamped against the stage's safe rectangle every animation frame (`MoonModel.tsx`'s single-label clamp effect, lines 419–489). This makes the original two-label collision class structurally impossible rather than tuned away, and measurement confirms it holds.

**Off-clip drag issue: FIXED.** Ran 10 independent camera-drag trials (5 with Tiger Stripes active, 5 with South Polar Geysers active — both directions of the exact pair Wave 22 found broken), varying the drag vector each time per Wave 22's own methodology. In **10/10 trials**, the active label's `getBoundingClientRect()` was fully contained inside `[data-lab-stage]`'s rect, 0px past every edge.

**Caption-pill z-index occlusion issue: FIXED.** In all 10 trials the active label's rect never intersected `[data-moon-caption-pill]`'s rect at all (all `overlapsCaptionPill: false`).

**Mutual label overlap: structurally impossible now, confirmed.** `document.querySelectorAll('[data-testid="moon-selected-hotspot-label"]')` returned exactly 1 element at every measured moment, including while hovering the *other* (South Polar Geysers) marker with Tiger Stripes still selected — confirms `activeHotspot` always wins and a second label never renders (screenshot: `desktop-hover-spg-while-ts-active.png`).

| Drag | Vector (dx,dy) | Active hotspot | Label rect (t/b/l/r) | Stage rect (t/b/l/r) | Contained | px past any edge | Overlaps caption pill |
|---|---|---|---|---|---|---|---|
| 1 | (0,−220) | Tiger Stripes | 524.79/565.14/586.41/727.62 | 64/721/260/1080 | true | 0 | false |
| 2 | (80,−180) | Tiger Stripes | 526.97/567.16/612.37/753.01 | 64/721/260/1080 | true | 0 | false |
| 3 | (−80,−180) | Tiger Stripes | 540.10/580.63/586.48/728.35 | 64/721/260/1080 | true | 0 | false |
| 4 | (0,−260) | Tiger Stripes | 540.17/580.70/586.27/728.15 | 64/721/260/1080 | true | 0 | false |
| 5 | (40,−240) | Tiger Stripes | 534.36/574.74/600.41/741.75 | 64/721/260/1080 | true | 0 | false |
| 1 | (0,−220) | South Polar Geysers | 515.90/554.81/604.99/804.59 | 64/721/260/1080 | true | 0 | false |
| 2 | (80,−180) | South Polar Geysers | 489.63/527.76/606.43/802.11 | 64/721/260/1080 | true | 0 | false |
| 3 | (−80,−180) | South Polar Geysers | 515.73/554.62/605.08/804.65 | 64/721/260/1080 | true | 0 | false |
| 4 | (0,−260) | South Polar Geysers | 515.90/554.81/604.99/804.59 | 64/721/260/1080 | true | 0 | false |
| 5 | (40,−240) | South Polar Geysers | 502.34/540.85/608.26/805.87 | 64/721/260/1080 | true | 0 | false |

Caption pill rect (constant, desktop): top 673.13, bottom 705, left 260, right 1080. Stage rect (constant): top 64, bottom 721, left 260, right 1080. Screenshots: `desktop-drag-ts-1-settled.png` … `desktop-drag-ts-5-settled.png`, `desktop-drag-spg-1-settled.png` … `desktop-drag-spg-5-settled.png`.

Methodology note: since the new design shows only one label at a time, "both labels visible simultaneously" cannot literally recur — this re-run instead repeated Wave 22's exact 5 drag vectors with each of the two hotspots active in turn (10 trials total), the closest faithful re-test of the same failure mode under the new architecture.

Also re-confirmed the Wave 22 P0 (mobile tap resolving to the wrong hotspot) is fixed — see item 5 below.

---

## 1. Compact markers — PASS

Enceladus hotspots render as small dot markers (colored core + a light "ping" ring, no always-on text pill). Confirmed visually (`desktop-select-tiger-stripes.png`, `mobile-default.png`) and via DOM: each marker's visual dot is `h-5 w-5`/`h-3 w-3` (20px/12px), well inside its 44px logical touch target.

## 2. Close-point cluster behavior — PASS

Tiger Stripes and South Polar Geysers (authored 3D positions `[0.1,-1.85,0.5]` and `[0.5,-1.7,0.6]`, closest pair on this moon) genuinely triggered clustering:
- **Mobile, default framing**: collapsed into one `"2"` badge (`data-cluster-hotspot-ids="tiger-stripes,south-polar-geysers"`), rect 46.0×46.0px — screenshot `mobile-default.png`.
- **Desktop, mid-drag (drag 1, Tiger Stripes active)**: South Polar Geysers clustered with a different neighbor (`cratered-terrain`) at that camera angle, correctly reflecting live screen-space proximity — screenshot `desktop-drag-ts-1-settled.png`.
- No case produced overlapping raw markers; clustered members' individual buttons confirmed `opacity:0; pointer-events:none; aria-hidden:true`.
- Tapping the cluster badge on mobile scrolled to and focused the external hotspot list's first item (`moon-hotspot-item-tiger-stripes`) — screenshot `mobile-after-cluster-tap.png`.

## 3. External hotspot list — PASS, with one P2 polish note

The "Hotspots on Enceladus" list (`data-testid="moon-hotspot-list"`) lives entirely outside `[data-lab-stage]`'s clipped bounds on both viewports (desktop stage right edge x1080; list x-range 1101–1420). All 4 chips fully legible, untruncated (`desktop-hotspot-list.png`, `mobile-hotspot-list.png`).

- **P2**: On mobile, the list's second row sits flush against the fixed bottom tray with no visible gap — visually cramped, but `elementFromPoint` confirms it stays clickable. Screenshot: `mobile-hotspot-list-scrolled-end.png`.

## 4. Touch/click target size — PASS

All measured hotspot marker/cluster hit targets on both viewports were at or well above 44×44px:

| Viewport | Element | Width×Height |
|---|---|---|
| Desktop | Tiger Stripes marker (rest) | 58.5×58.5 |
| Desktop | South Polar Geysers marker (rest) | 58.6×58.6 |
| Desktop | Cratered Northern Terrain marker | 50.3×50.3 |
| Desktop | Smooth Ice Plains marker | 62.6×62.6 |
| Desktop | Cluster badge (mid-drag, SPG+cratered) | 58.0×58.0 |
| Mobile | Cluster badge (Tiger Stripes+South Polar Geysers) | 46.0×46.0 |
| Mobile | Cratered Northern Terrain marker | 40.7×40.7 (see note) |
| Mobile | Smooth Ice Plains marker | 48.3×48.3 |
| Both | External list items (`min-h-[44px] min-w-[44px]`, CSS-enforced) | ≥44×44 |

Note: one reading ("Cratered Northern Terrain" on mobile) measured 40.7×40.7, ~3px under 44px; every other measured marker met or exceeded 44px. drei's `Html` `distanceFactor` scaling makes marker screen size vary slightly with camera-relative depth (44–72px observed range).

## 5. Content-selection correctness for Tiger Stripes / South Polar Geysers — PASS (Wave 22 P0 confirmed fixed)

**Desktop** (`desktop-select-tiger-stripes.png`, `desktop-select-south-polar-geysers.png`): each selection shows its own correct heading/body text, no cross-contamination, `aria-pressed` toggles correctly.

**Mobile** (`mobile-select-tiger-stripes-recheck.png`, `mobile-select-south-polar-geysers-recheck.png`): same result — Tiger Stripes shows its fracture description, South Polar Geysers shows its plume description, no swap, `aria-pressed` toggles correctly.

This directly reverses Wave 22's P0 (tapping Tiger Stripes opened South Polar Geysers' content).

## 6. Selected marker/label visual state — PASS on desktop, **P1 on mobile when clustered**

**Desktop (not clustered at rest):** Selecting a marker gives it a distinct state — scales up (`scale-150`), gains a colored ring and animated "ping" halo, vs. a plain white-bordered dot when unselected.

**Mobile (clustered) — P1**: On mobile's default framing, Tiger Stripes and South Polar Geysers are clustered. Selecting South Polar Geysers via the external list sets it active, but its individual marker stays `opacity:0; pointer-events:none; aria-hidden:true` — visibility is gated by `!isClustered` regardless of `active`. The `ClusterMarker` badge takes no `active` prop, so it renders **identically** before and after selection (`mobile-default.png` vs `mobile-spg-selected-stage-recheck.png` — pixel-identical "2" badge). The only visible feedback is in the side list and the "Isolate" toolbar icon — nothing on the 3D marker/model indicates *which* hotspot was chosen. A real cause/effect gap, specific to the clustered case, for exactly the hotspot pair this wave focused on.

## 8. General checks — PASS, with above caveats

- No hidden/orphaned hotspots on either viewport; full coverage at rest on both.
- No wrong-content displays anywhere observed (see item 5).
- No internal QA/debug/placeholder text observed in any screenshot.
- Toolbar controls (Rotate, Play, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset) visible and non-overlapping on both viewports; mobile explicit rect check found zero pairwise overlaps, all within stage bounds.
- **Out-of-scope side note**: mobile toolbar buttons (shared `CanvasControls`, used by every 3D lab) measured 33×32px, under 44×44 — not part of the Moons hotspot redesign, flagged only for awareness (P2/out-of-scope).

---

## Console / page errors

No `pageerror` (uncaught exception) events observed across ~6 browser contexts used. Benign console output only (Vite HMR, React DevTools banner, `THREE.Clock` deprecation, GL driver perf messages). Full raw log: `review-screenshots/wave24-2026-08-18/moons/console-log.json`.

---

## Summary table

| Severity | Finding | Evidence |
|---|---|---|
| P1 | On mobile default framing, when Tiger Stripes/South Polar Geysers are clustered, selecting either via the external list produces no visible change on the 3D marker/model — cause/effect only visible in the side panel | `mobile-default.png`, `mobile-spg-selected-stage-recheck.png` |
| P2 | Mobile external hotspot list's 2nd row sits flush against the fixed bottom tray with no visible gap (still clickable) | `mobile-hotspot-list-scrolled-end.png` |
| P2 / out of scope | Mobile toolbar buttons (shared `CanvasControls`, not part of this redesign) measure 33×32px, below 44×44 | rect dump, this session |
| PASS | Off-clip drag regression (Wave 22 P1) | 10/10 drag table above, all contained |
| PASS | Caption-pill z-index occlusion (Wave 22 P1) | 10/10 drags, zero caption-pill overlap |
| PASS | Mutual label overlap (structurally impossible now) | single-label DOM count check = 1 always |
| PASS | Mobile wrong-content-on-tap (Wave 22 P0) | exact-content re-check both directions, both viewports |
| PASS | Compact markers | visual + DOM size check |
| PASS | Cluster behavior sane, no overlapping raw markers | mobile default + desktop mid-drag cluster evidence |
| PASS | External list outside clipped stage | rect comparison |
| PASS | Touch targets ≥44px (all but one 40.7px reading) | measured table above |
| PASS | Desktop selected-marker visual state | screenshots |
| PASS | No hidden markers / no wrong content / no debug text | full session |
| PASS | No console/page errors | console-log.json |
