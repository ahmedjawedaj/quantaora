# Wave 6 Live Acceptance QA — Molecules + Generic Glass/Optics

Date: 2026-08-18
Scope: `/app/labs/molecules` (ChemistryLab.tsx) and `/app/labs/branch/light-and-optics` (BranchLab.tsx)
Viewports: desktop 1440x900, mobile 390x844
Server: `http://127.0.0.1:5174` (already running, not started/stopped by this review)
Method: throwaway Playwright script driving a locally cached Chromium build (software-WebGL
flags: `--use-gl=angle --use-angle=swiftshader --enable-webgl --ignore-gpu-blocklist
--enable-unsafe-swiftshader`, required because the default headless GPU context failed to
initialize in this sandbox — first pass with no extra flags produced genuinely blank canvases
and `THREE.WebGLRenderer: Error creating WebGL context` page errors; this was a harness/headless
GPU limitation, not a product bug, and was resolved before capturing the evidence below).
Evidence root: `review-screenshots/live-acceptance-2026-08-18-wave6/molecules-glass/`

---

## Route 1: `/app/labs/molecules` — Verdict: **FAIL** (P0 present)

### Per-molecule confirmation (desktop, 1440x900)

| Molecule | Formula text shown | Geometry observed | Atom colors observed |
|---|---|---|---|
| Water | `H₂O` (badge + key-facts panel; "Atoms: 3") | Bent triatomic (bonding-map SVG confirms the 104.5° bent projection); the 3D camera framing is so close that only 2 of the 3 spheres are visible in the captured frame, the third (second H) is occluded behind the front atoms at this angle | Large sphere red (O), one visible sphere off-white (H) — correct CPK |
| Carbon Dioxide | `CO₂` | Linear 3-atom chain, clearly distinct from water and methane | Red-black-red (O-C-O) — correct CPK |
| Methane | `CH₄` | Tetrahedral, 1 central dark sphere + 4 light spheres (1 partially occluded, expected for a tetrahedral camera angle) | Off-white H atoms, dark/black C — correct CPK |
| Sodium Chloride | `NaCl` | Repeating cubic ionic lattice (grid of alternating spheres + rods), correctly rendered as a lattice, not a discrete "molecule" — visibly distinct model type from the other three | Purple (Na) / green (Cl) — matches the app's own documented convention (`src/data/molecules.ts` ELEMENT_COLOR) |

All four models are genuinely distinct geometry (not the same mesh recolored) and each shows its
correct formula as legible text in both the canvas overlay badge and the right-hand key-facts
panel. This part of the P0/P1 checklist passes.

### P0 — Blocking

- **Mobile 390x844: no way to switch molecules.** `ChemistryLab.tsx`'s molecule list
  (`ContentNav`) lives in `<aside className="hidden shrink-0 ... lg:block ...">` — hidden below
  the `lg` breakpoint. Unlike the generic `BranchLab.tsx` route (which ships a mobile chip-row
  switcher, `Component {n} of {m}` inside an `lg:hidden` block), `ChemistryLab.tsx` has no
  equivalent control anywhere in the file (confirmed by reading the full source — no `lg:hidden`
  switcher exists). Live behavior confirms this: at 390px width, `button[title="Carbon Dioxide"]`
  and `button[title="Sodium Chloride"]` both resolve to 0 elements. A learner on a phone can only
  ever see the default molecule (Water); CO2, Methane, and NaCl are unreachable through any
  in-app control at this viewport.
  Evidence: `review-screenshots/live-acceptance-2026-08-18-wave6/molecules-glass/molecules/mobile/notes.txt`
  (`CO2 mobile chip not found`, `NaCl mobile chip not found`) and
  `.../molecules/mobile/01-default-water.png`, `.../molecules/mobile/04-toolbar-visible.png`
  (both show only Water, no switcher UI anywhere on screen).

### P1 — Significant

- **Desktop 1440x900, all 4 molecules: camera framing is too tight — atoms overflow the canvas
  and overlap toolbar/UI chrome.** Every preset loads zoomed in far enough that spheres extend
  past the canvas edges and overlap the left tool rail and/or the bottom Formula/Bonds/Valence
  meter chips. Worst on Sodium Chloride, where the lattice extends past the top of the canvas
  (behind the "SODIUM CHLORIDE (NACL)" badge) and past both side edges simultaneously.
  Evidence: `.../molecules/desktop/01-default-water.png`, `02-carbon-dioxide.png`,
  `03-methane.png`, `04-sodium-chloride.png`.
- **Mobile 390x844, Water: same oversized/clipped framing, worse relative to the smaller
  viewport** — the two visible spheres touch both the "Touch an atom to explore" badge above and
  the Formula/Bonds/Valence chip row below, with almost no framing margin.
  Evidence: `.../molecules/mobile/01-default-water.png`.

### P2 — Polish

- Water's default camera angle at first load occludes the second hydrogen atom behind the front
  two spheres (all 3 atoms are correctly authored — "Atoms: 3" in the key-facts panel, and the
  bent-shape SVG companion diagram is correct — this is a first-frame camera-angle/auto-rotate
  timing observation, not a geometry defect).
  Evidence: `.../molecules/desktop/01-default-water.png`.

### Toolbar / controls

- Desktop: 11 tool-rail controls present and reachable — Rotate, Pause, Isolate, Section
  (disabled for these presets — expected, no cross-section geometry), Compare, Zoom In, Zoom Out,
  Full (fit view), More, Reset, plus an unlabeled overflow control. On the Sodium Chloride
  hotspot-detail view, two additional labeled controls appear ("View Na", "View Cl").
  Evidence: `.../molecules/desktop/notes.txt`, `.../molecules/desktop/05-toolbar-visible.png`.
- Mobile: the same icon row renders as a horizontally-scrollable strip at the top and is visibly
  within the 390px viewport with no obvious cut-off. Evidence:
  `.../molecules/mobile/04-toolbar-visible.png`.
- Cause/effect confirmed: clicking a preset in the (desktop) sidebar list rebuilds the 3D model
  and updates the formula/atom-count/bond-count meters and the right-hand lesson copy each time
  (see the 4 per-molecule screenshots above, each with different Key Facts values). Clicking
  "Isolate" while Sodium Chloride is active swaps the right-hand detail panel to a per-ion view
  ("Sodium ion (Na⁺)" with a "Back to Sodium Chloride" link) — a clear, legible state change.
  Evidence: `.../molecules/desktop/07-isolate-toggled.png`.
- "Build molecule" panel opens cleanly with no overflow/clipping of its own content (element
  picker, Bond/Remove/Preset buttons, live builder message) at desktop width. Evidence:
  `.../molecules/desktop/06-build-molecule-open.png`.

### Console / page errors

- No React error boundaries, unhandled promise rejections, or app-level console errors were
  observed once the harness's headless-GPU limitation was corrected (see Method above). Search of
  both desktop and mobile console logs for `error` (excluding benign SwiftShader
  `GPU stall due to ReadPixels` performance warnings) returned zero matches.
  Evidence: `.../molecules/desktop/console-log.txt`, `.../molecules/mobile/console-log.txt`.
- No internal QA/debug/placeholder/lorem-ipsum text was visible in any captured screenshot.

### Coverage statement

Tested: default load (Water) at both viewports; explicit switch to Carbon Dioxide, Methane, and
Sodium Chloride via the desktop sidebar (all 3 switches captured and verified); toolbar
inventory and reachability at both viewports; Isolate toggle cause/effect; "Build molecule"
panel open/cause-effect. Not tested: mobile switch to Carbon Dioxide/Methane/Sodium Chloride
(impossible — see P0 above, this is itself the finding, not a gap in test coverage); the
in-canvas Bond-mode atom-editing interactions (add/remove atom, add/remove bond) beyond opening
the builder panel; Compare modal contents; Section/cross-section toggle (disabled for all 4
presets, so not exercised); Lesson/Quiz modal contents.

---

## Route 2: `/app/labs/branch/light-and-optics` — Verdict: **N/A — not yet implemented**

`src/data/hierarchy.ts` lists this branch with `status: 'planned'` and no `route`. Reading
`src/routes/BranchLab.tsx` confirms the guard: `branchComponents(branchId)` returns no components
for a planned branch, so `activeId` stays `null`, and the route's own render guard
(`if (!branchId || !subject || !branch || !content || !activeId) return <Navigate to="/app/labs"
replace />`) fires immediately. Live navigation confirms this exactly: at both viewports, hitting
`/app/labs/branch/light-and-optics` client-side-redirects straight to `/app/labs` (the Labs
catalog) with no crash, no error boundary, and no console errors.

**Finding: there is no bulb/lens/glass 3D content wired for this branch at all** — not a
partially-working GenericViewer with a low-quality glass material, but a full redirect back to
the catalog before any `GenericViewer` instance is ever mounted. There is therefore nothing to
assess for transmission/refraction material quality, hotspot behavior, or toolbar reachability
on this specific route — none of that UI renders.

Evidence:
- `review-screenshots/live-acceptance-2026-08-18-wave6/molecules-glass/light-and-optics/desktop/01-default.png`
  (shows the Labs catalog, not a lab canvas) and `notes.txt` (`final URL:
  http://127.0.0.1:5174/app/labs`).
- `.../light-and-optics/mobile/01-default.png` and its `notes.txt` (same redirect, mobile).
- Console logs for both viewports contain zero `error`-level entries:
  `.../light-and-optics/desktop/console-log.txt`, `.../light-and-optics/mobile/console-log.txt`.

### Coverage statement

Tested: navigation to the route at both viewports, confirmed the redirect target, checked for
console/page errors during the redirect, read `BranchLab.tsx` and `hierarchy.ts` to confirm the
root cause in source (read-only). Not tested: anything downstream of a rendered glass/lens/bulb
model, since no such model is reachable through this route today. If bulb/lens content is
intended to live under a different, already-live branch, that was outside this task's explicitly
assigned route and was not searched for.

---

## Summary

| Route | Verdict | P0 | P1 | P2 |
|---|---|---|---|---|
| `/app/labs/molecules` | FAIL | 1 (mobile molecule switcher missing) | 2 (camera framing/clipping, desktop + mobile) | 1 (water first-frame atom occlusion) |
| `/app/labs/branch/light-and-optics` | N/A — not implemented | — | — | — |
